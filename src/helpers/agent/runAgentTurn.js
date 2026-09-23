import moment from 'moment'
import aiHelpers from '../aiHelpers.js'
import retrieve from './retrieve.js'
import { storyStepList } from './agentKnowledge.js'
import fastPath from './fastPath.js'
import speakAgentText from './speakAgentText.js'
import { getAllowedDemos, resolveDemoAction, validateDemoAction } from './validateActions.js'
import { makeToolExecutors, runToolLoop } from './agentTools.js'

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

  lines.push('You are an AI Demo Agent for a product, embedded next to an interactive demo player.')
  lines.push('Answer ONLY from the knowledge context below. If the context does not cover the question, say you do not know and offer what you can show.')
  lines.push('If the context below is missing something, call search_knowledge with a standalone query (or get_demo_steps for a demo) before answering. Always finish by calling respond.')
  lines.push('You can navigate the visitor to a demo step by setting action in respond. Only use demo ids and step numbers listed below or returned by your tools — never invent ids.')
  lines.push('When the visitor asks how to do something, or to be shown a feature, you MUST set action to the best matching demo step. Do not omit action if a relevant step is known — the player jumps there while you talk.')
  if (agent.systemPrompt) {
    lines.push(`Extra instructions from the author: ${agent.systemPrompt}`)
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

async function emitContentCard(Models, { agent, session, mode, sse, demoId, stepNumber }) {
  const validated = await validateDemoAction(Models, agent, mode, demoId, stepNumber)
  if (!validated) return null

  sse('content_card', {
    entityId: validated.demoId,
    workspaceId: validated.workspaceId,
    name: validated.name,
    stepNumber: validated.stepNumber,
    stepsTotal: validated.stepsTotal,
  })

  const isNewDemo = String(session.currentDemoId || '') !== String(validated.demoId)
  await Models.AgentSession.updateOne({ _id: session._id }, {
    $set: {
      currentDemoId: validated.demoId,
      currentStepNumber: validated.stepNumber,
      stage: 'demo',
    },
    $addToSet: { viewedDemoIds: validated.demoId },
    ...(isNewDemo ? { $inc: { demosOpenedCount: 1 } } : {}),
  })

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

async function emitAnswer(sse, agent, answer, mode, { skipText } = {}) {
  if (!answer) return
  if (!skipText) sse('text', { text: answer })
  if (mode === 'editor') return
  if (agent.voiceEnabled && agent.voiceId) {
    try {
      const audio = await speakAgentText(agent, answer)
      if (audio) sse('voice_audio', audio)
    } catch (err) {
      console.log('agent TTS failed', err)
    }
  }
}

export default async function runAgentTurn(Models, { agent, session, message, source, mode, sse }) {
  const now = moment().valueOf()

  await Models.AgentMessage.create({
    sessionId: session._id,
    workspaceId: agent.workspaceId,
    agentId: agent._id,
    role: 'user',
    content: message,
    source: source || 'text',
  })
  await Models.AgentSessionEvent.create({
    sessionId: session._id,
    workspaceId: agent.workspaceId,
    agentId: agent._id,
    type: source === 'suggestion' ? 'suggestion_clicked' : 'message_sent',
    timestamp: now,
    data: { message },
  })
  await Models.AgentSession.updateOne({ _id: session._id }, {
    $inc: { messageCount: 1, ...(source === 'suggestion' ? { suggestionClickCount: 1 } : {}) },
  })

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
      agent, session, mode, sse,
      demoId: session.currentDemoId,
      stepNumber: target,
    })
    answer = appliedAction ? `Step ${appliedAction.stepNumber} of ${appliedAction.stepsTotal}.` : ''
    if (answer) await emitAnswer(sse, agent, answer, mode)
  }

  if (!appliedAction && !answer) {
    const [history, retrieved, allowedDemos, defaultDemoSteps] = await Promise.all([
      Models.AgentMessage.find({ sessionId: session._id })
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

    if (answer) sse('text', { text: answer })

    const action = resolveDemoAction(parsed.action, [...demoHits, ...retrieved.demoCandidates], {
      answer,
      allowedDemos,
      currentDemoId: session.currentDemoId,
      defaultDemoId: agent.defaultDemoId?._id || agent.defaultDemoId,
    })
    if (action) {
      appliedAction = await emitContentCard(Models, {
        agent, session, mode, sse,
        demoId: action.demoId,
        stepNumber: action.stepNumber,
      })
      if (!appliedAction) {
        const fallbackId = session.currentDemoId || agent.defaultDemoId?._id || agent.defaultDemoId
        if (fallbackId && String(fallbackId) !== String(action.demoId)) {
          appliedAction = await emitContentCard(Models, {
            agent, session, mode, sse,
            demoId: fallbackId,
            stepNumber: action.stepNumber,
          })
        }
      }
      if (!appliedAction) {
        console.log('agent turn: content_card dropped', action)
      }
    }

    await emitAnswer(sse, agent, answer, mode, { skipText: true })

    if (suggestions.length) {
      sse('suggestions', { suggestions })
    }
  }

  await Models.AgentMessage.create({
    sessionId: session._id,
    workspaceId: agent.workspaceId,
    agentId: agent._id,
    role: 'assistant',
    content: answer,
    source: 'text',
    actions: appliedAction ? [appliedAction] : [],
  })
  await Models.AgentSessionEvent.create({
    sessionId: session._id,
    workspaceId: agent.workspaceId,
    agentId: agent._id,
    type: 'message_answered',
    timestamp: moment().valueOf(),
    data: appliedAction ? { demoId: appliedAction.demoId, stepNumber: appliedAction.stepNumber } : {},
  })
  await Models.AgentSession.updateOne({ _id: session._id }, { $inc: { messageCount: 1 } })

  sse('done', {})
}
