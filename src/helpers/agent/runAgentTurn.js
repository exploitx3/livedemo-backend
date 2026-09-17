import moment from 'moment'
import aiHelpers from '../aiHelpers.js'
import retrieve from './retrieve.js'
import fastPath from './fastPath.js'
import speakAgentText from './speakAgentText.js'
import { getAllowedDemos, resolveDemoAction, validateDemoAction } from './validateActions.js'

// One agent turn: retrieve → prompt → parse → validate → SSE. One file, not
// eight services. `sse(event, data)` writes to the open event-stream.
//
// SSE events emitted: text, voice_audio, content_card, suggestions, done, error.
// ponytail: the answer arrives as one `text` event (generateContent JSON), not
// token-streamed. Upgrade path: genai.models.generateContentStream + a second
// non-JSON prompt pass.

const HISTORY_LIMIT = 8

function buildPrompt({ agent, session, history, message, knowledge, demoCandidates, allowedDemos }) {
  const lines = []

  lines.push('You are an AI Demo Agent for a product, embedded next to an interactive demo player.')
  lines.push('Answer ONLY from the knowledge context below. If the context does not cover the question, say you do not know and offer what you can show.')
  lines.push('You can navigate the visitor to a demo step by returning an action. Only use demo ids and step numbers listed below — never invent ids.')
  lines.push('When the visitor asks how to do something, or to be shown a feature, you MUST set action to the best matching demo step from the list. Do not leave action null if a relevant step is listed — the player jumps there while you talk.')
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

  if (demoCandidates.length) {
    lines.push('\nMost relevant demo steps for this question (demoId / stepNumber — content):')
    demoCandidates.forEach(c => {
      const m = c.metadata || {}
      lines.push(`${m.demoId} / step ${m.stepNumber || 1} — ${String(c.text).slice(0, 200)}`)
    })
  }

  lines.push(`\nVisitor message: ${message}`)
  lines.push('\nRespond with a single JSON object, nothing else:')
  lines.push('{"answer": "<short conversational answer, max 3 sentences>",')
  lines.push(' "suggestions": ["<up to 3 short follow-up questions the visitor might ask>"],')
  lines.push(' "action": null | {"type": "open_demo", "demoId": "<id from the list>", "stepNumber": <number>}}')

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
    const [history, retrieved, allowedDemos] = await Promise.all([
      Models.AgentMessage.find({ sessionId: session._id })
        .sort({ _id: -1 }).limit(HISTORY_LIMIT).lean()
        .then(list => list.reverse()),
      retrieve(Models, { agent, queryText: message }),
      getAllowedDemos(Models, agent, mode),
    ])

    const prompt = buildPrompt({
      agent,
      session,
      history,
      message,
      knowledge: retrieved.knowledge,
      demoCandidates: retrieved.demoCandidates,
      allowedDemos,
    })

    const raw = await aiHelpers.generateAgentAnswer(prompt)

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (err) {
      parsed = { answer: raw, suggestions: [], action: null }
    }

    answer = String(parsed.answer || '').trim()
    suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : []

    if (answer) sse('text', { text: answer })

    const action = resolveDemoAction(parsed.action, retrieved.demoCandidates, {
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
