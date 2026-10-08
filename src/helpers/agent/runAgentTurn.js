import moment from 'moment'
import aiHelpers from '../aiHelpers.js'
import retrieve from './retrieve.js'
import { storyStepList } from './agentKnowledge.js'
import fastPath from './fastPath.js'
import speakAgentText, { streamAgentPcm } from './speakAgentText.js'
import { appendDemoNarration, getAllowedDemos, resolveDemoAction, validateDemoAction } from './validateActions.js'
import { makeToolExecutors, runToolLoop } from './agentTools.js'
import CONVERSATION_STYLE_PROMPT from './conversationStylePrompt.js'

// One agent turn: retrieve → prompt → tool loop (model may search more, max
// MAX_TOOL_ROUNDS Gemini calls) → validate → SSE. `sse(event, data)` writes
// to the open event-stream.
//
// SSE events emitted: status, text, voice_audio, content_card, suggestions, done, error.
// ponytail: the answer arrives as one `text` event (respond tool args), not
// token-streamed. Upgrade path: genai.models.generateContentStream + a second
// plain-text prompt pass.

const HISTORY_LIMIT = 8

function buildPrompt({ agent, session, history, message, knowledge, demoCandidates, allowedDemos, defaultDemoSteps = [] }) {
  const lines = []
  const authorPrompt = String(agent.systemPrompt || '').trim()

  // The author's own prompt replaces the default persona/style, never the navigation rules
  lines.push(authorPrompt
    ? 'You are an AI Demo Agent for a product, embedded next to an interactive demo player.'
    : CONVERSATION_STYLE_PROMPT)
  lines.push('\n# KNOWLEDGE AND DEMO NAVIGATION')
  lines.push('Answer ONLY from the knowledge context below. If the context does not cover the question, say you do not know and offer what you can show.')
  lines.push('If the context below is missing something, call search_knowledge with a standalone query (or get_demo_steps for a demo) before answering. Always finish by calling respond.')
  lines.push('You can navigate the visitor to a demo step by setting action in respond. Only use demo ids and step numbers listed below or returned by your tools — never invent ids.')
  lines.push('Set action only when showing a specific demo step genuinely helps the visitor (e.g. they ask how to do something or to see a feature). Greetings, pricing, general or follow-up questions usually need no action — then omit it.')
  lines.push('Whenever you set action, you must also write action.narration: one natural, conversational sentence in your own words that points the visitor to the demo on their right and says what that step shows (e.g. "And in the demo on your right, you can see how you can review AI responses from your meetings."). Vary the wording. It is appended as your last sentence, so do not repeat it in answer.')
  if (authorPrompt) {
    lines.push(`Extra instructions from the author: ${authorPrompt}`)
  }

  if (session.summary) {
    lines.push(`\nConversation summary so far: ${session.summary}`)
  }
  if (session.currentDemoId) {
    lines.push(`Currently open demo: ${session.currentDemoId} at step ${session.currentStepNumber || 1}`)
  }

  if (history.length) {
    lines.push('\nRecent conversation:')
    history.forEach(m => lines.push(`${m.role === 'user' ? 'Visitor' : 'Agent'}: ${m.content}`))
  }

  if (knowledge.length) {
    lines.push('\nKnowledge context:')
    knowledge.forEach((c, i) => lines.push(`[${i + 1}] ${c.text}`))
  }

  if (allowedDemos.length) {
    lines.push('\nDemos you may open (id — name):')
    allowedDemos.forEach(d => lines.push(`${d._id} — ${d.name || 'Untitled'}`))
  }

  if (defaultDemoSteps.length) {
    const demoId = agent.defaultDemoId?._id || agent.defaultDemoId
    lines.push(`\nEvery step of the default demo (${demoId}). Choose stepNumber from this list:`)
    defaultDemoSteps.forEach(s => lines.push(`${s.stepNumber}. ${s.text}`))
  }

  if (demoCandidates.length) {
    lines.push('\nMost relevant demo steps for this question (demoId / stepNumber — content):')
    demoCandidates.forEach(c => {
      const m = c.metadata || {}
      lines.push(`${m.demoId} / step ${m.stepNumber || 1} — ${String(c.text).slice(0, 200)}`)
    })
  }

  lines.push(`\nVisitor message: ${message}`)

  return lines.join('\n')
}

// The session write goes into `pending` (awaited at turn end) so it never delays the answer/TTS
async function emitContentCard(Models, { agent, session, mode, sse, demoId, stepNumber, allowedDemos, pending }) {
  const validated = await validateDemoAction(Models, agent, mode, demoId, stepNumber, allowedDemos)
  if (!validated) return null

  sse('content_card', {
    entityId: validated.demoId,
    workspaceId: validated.workspaceId,
    name: validated.name,
    stepNumber: validated.stepNumber,
    stepsTotal: validated.stepsTotal,
  })

  const isNewDemo = String(session.currentDemoId || '') !== String(validated.demoId)
  const write = Models.AgentSession.updateOne({ _id: session._id }, {
    $set: {
      currentDemoId: validated.demoId,
      currentStepNumber: validated.stepNumber,
      stage: 'demo',
    },
    $addToSet: { viewedDemoIds: validated.demoId },
    ...(isNewDemo ? { $inc: { demosOpenedCount: 1 } } : {}),
  }).exec()
  write.catch(() => {})
  pending.push(write)

  return validated
}

async function loadDefaultDemoSteps(Models, agent) {
  const demoId = agent.defaultDemoId?._id || agent.defaultDemoId
  if (!demoId) return []
  const story = await Models.Story.findOne({
    _id: demoId,
    workspaceId: agent.workspaceId,
    deletedAt: null,
  })
    .populate({ path: 'screens', select: 'steps index' })
    .lean()
  return storyStepList(story)
}

// Text is held until its audio is ready (first streamed chunk, or the whole
// clip) so the words and the voice land together. TTS off/failed: text alone.
async function emitAnswer(sse, agent, answer, mode) {
  if (!answer) return
  let textSent = false
  const sendText = () => {
    if (textSent) return
    textSent = true
    sse('text', { text: answer })
  }
  const sendAudio = (audio) => {
    sendText()
    if (audio) sse('voice_audio', audio)
  }

  if (mode !== 'editor' && agent.voiceEnabled && agent.voiceId) {
    try {
      if (!(await streamAgentPcm(agent, answer, sendAudio))) {
        sendAudio(await speakAgentText(agent, answer))
      }
    } catch (err) {
      console.log('agent TTS failed', err)
    }
  }
  sendText()
}

export default async function runAgentTurn(Models, { agent, session, message, source, mode, sse }) {
  const now = moment().valueOf()

  // Bookkeeping writes run alongside retrieval + Gemini instead of before them;
  // all are awaited before the turn's own writes and `done`.
  const userMessage = new Models.AgentMessage({
    sessionId: session._id,
    workspaceId: agent.workspaceId,
    agentId: agent._id,
    role: 'user',
    content: message,
    source: source || 'text',
  })
  const pending = [
    userMessage.save(),
    Models.AgentSessionEvent.create({
      sessionId: session._id,
      workspaceId: agent.workspaceId,
      agentId: agent._id,
      type: source === 'suggestion' ? 'suggestion_clicked' : 'message_sent',
      timestamp: now,
      data: { message },
    }),
    Models.AgentSession.updateOne({ _id: session._id }, {
      $inc: { messageCount: 1, ...(source === 'suggestion' ? { suggestionClickCount: 1 } : {}) },
    }).exec(),
  ]
  // Surface a failed write at the final await, not as an unhandled rejection meanwhile.
  // Entries must be real Promises (.exec()): .catch() on a Mongoose Query runs it again.
  pending.forEach(p => p.catch(() => {}))

  let answer = ''
  let suggestions = []
  let appliedAction = null

  // Fast path: "next" / "back" / "restart" skip Gemini entirely
  const fast = fastPath(message)
  if (fast && session.currentDemoId) {
    const current = session.currentStepNumber || 1
    const target = fast.type === 'next_step' ? current + 1
      : fast.type === 'previous_step' ? current - 1
      : 1

    appliedAction = await emitContentCard(Models, {
      agent, session, mode, sse, pending,
      demoId: session.currentDemoId,
      stepNumber: target,
    })
    answer = appliedAction ? `Step ${appliedAction.stepNumber} of ${appliedAction.stepsTotal}.` : ''
    if (answer) await emitAnswer(sse, agent, answer, mode)
  }

  if (!appliedAction && !answer) {
    const [history, retrieved, allowedDemos, defaultDemoSteps] = await Promise.all([
      // This message may or may not be saved yet; it's in the prompt as "Visitor message" anyway
      Models.AgentMessage.find({ sessionId: session._id, _id: { $ne: userMessage._id } })
        .sort({ _id: -1 }).limit(HISTORY_LIMIT).lean()
        .then(list => list.reverse()),
      retrieve(Models, { agent, queryText: message }),
      getAllowedDemos(Models, agent, mode),
      loadDefaultDemoSteps(Models, agent),
    ])

    const prompt = buildPrompt({
      agent,
      session,
      history,
      message,
      knowledge: retrieved.knowledge,
      demoCandidates: retrieved.demoCandidates,
      allowedDemos,
      defaultDemoSteps,
    })

    const demoHits = []
    const exec = makeToolExecutors(Models, {
      agent,
      allowedDemos,
      retrieve,
      demoHits,
      seenChunkIds: new Set([...retrieved.knowledge, ...retrieved.demoCandidates].map(c => String(c._id))),
    })
    const parsed = await runToolLoop({
      prompt,
      exec,
      generateStep: aiHelpers.generateAgentStep,
      onStatus: () => sse('status', { text: 'Looking that up…' }),
    })

    answer = String(parsed.answer || '').trim()
    suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : []

    const action = resolveDemoAction(parsed.action, [...demoHits, ...retrieved.demoCandidates], {
      answer,
      allowedDemos,
      currentDemoId: session.currentDemoId,
      defaultDemoId: agent.defaultDemoId?._id || agent.defaultDemoId,
    })
    if (action) {
      appliedAction = await emitContentCard(Models, {
        agent, session, mode, sse, allowedDemos, pending,
        demoId: action.demoId,
        stepNumber: action.stepNumber,
      })
      if (!appliedAction) {
        const fallbackId = session.currentDemoId || agent.defaultDemoId?._id || agent.defaultDemoId
        if (fallbackId && String(fallbackId) !== String(action.demoId)) {
          appliedAction = await emitContentCard(Models, {
            agent, session, mode, sse, allowedDemos, pending,
            demoId: fallbackId,
            stepNumber: action.stepNumber,
          })
        }
      }
      if (!appliedAction) {
        console.log('agent turn: content_card dropped', action)
      }
    }
    if (appliedAction) answer = appendDemoNarration(answer, action.narration)

    await emitAnswer(sse, agent, answer, mode)

    if (suggestions.length) {
      sse('suggestions', { suggestions })
    }
  }

  await Promise.all(pending)
  await Promise.all([
    Models.AgentMessage.create({
      sessionId: session._id,
      workspaceId: agent.workspaceId,
      agentId: agent._id,
      role: 'assistant',
      content: answer,
      source: 'text',
      actions: appliedAction ? [appliedAction] : [],
    }),
    Models.AgentSessionEvent.create({
      sessionId: session._id,
      workspaceId: agent.workspaceId,
      agentId: agent._id,
      type: 'message_answered',
      timestamp: moment().valueOf(),
      data: appliedAction ? { demoId: appliedAction.demoId, stepNumber: appliedAction.stepNumber } : {},
    }),
    Models.AgentSession.updateOne({ _id: session._id }, { $inc: { messageCount: 1 } }),
  ])

  sse('done', {})
}
