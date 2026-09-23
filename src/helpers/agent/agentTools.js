import { storyStepList } from './agentKnowledge.js'

// Agentic RAG: Gemini function calling lets the model fetch more context
// before answering. Final answer is itself a tool (`respond`) so every round
// ends in a function call — no free-text JSON parsing.
// No DB/network imports here (retrieve is injected) — see agentLoop.check.js.

export const MAX_TOOL_ROUNDS = 3
const SEARCH_RESULTS = 5
const RESULT_CHARS = 1200
const QUERY_CHARS = 300

export const TOOL_DECLARATIONS = [
  {
    name: 'search_knowledge',
    description: 'Search this product\'s knowledge base again with a better query. Use when the provided context does not answer the question, for follow-ups that need the conversation to make sense, or once per part of a multi-part question.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Standalone search query, rewritten with context from the conversation.' },
        kind: { type: 'string', enum: ['knowledge', 'demo'], description: 'demo = demo steps only; knowledge = docs/FAQ/urls only. Omit for both.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_demo_steps',
    description: 'List every step (number + text) of one demo from the allowed list, to pick an exact stepNumber.',
    parametersJsonSchema: {
      type: 'object',
      properties: { demoId: { type: 'string' } },
      required: ['demoId'],
    },
  },
  {
    name: 'respond',
    description: 'Send the final answer to the visitor. Always finish with this.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        answer: { type: 'string', description: 'Short conversational answer, max 3 sentences.' },
        suggestions: { type: 'array', items: { type: 'string' }, description: 'Up to 3 short follow-up questions the visitor might ask.' },
        action: {
          type: 'object',
          description: 'Open a demo step. Omit when no listed step is relevant.',
          properties: {
            demoId: { type: 'string', description: 'Id from the allowed demo list.' },
            stepNumber: { type: 'integer' },
          },
        },
      },
      required: ['answer'],
    },
  },
]

const ALL_TOOLS = TOOL_DECLARATIONS.map(t => t.name)

// Scope (workspaceId/agentId) comes from the closure, never from tool args.
// Demo-step hits are pushed into `demoHits` so resolveDemoAction can use them.
export function makeToolExecutors(Models, { agent, allowedDemos, seenChunkIds, demoHits, retrieve }) {
  return {
    async search_knowledge({ query, kind }) {
      const q = String(query || '').trim().slice(0, QUERY_CHARS)
      if (!q) return { error: 'empty query' }
      const { knowledge, demoCandidates } = await retrieve(Models, { agent, queryText: q })
      const pool = kind === 'demo' ? demoCandidates
        : kind === 'knowledge' ? knowledge
        : [...knowledge, ...demoCandidates]
      const fresh = pool.filter(c => !seenChunkIds.has(String(c._id))).slice(0, SEARCH_RESULTS)
      fresh.forEach(c => seenChunkIds.add(String(c._id)))
      demoHits.push(...fresh.filter(c => c.metadata?.demoId))
      return {
        results: fresh.map(c => ({
          text: String(c.text || '').slice(0, RESULT_CHARS),
          ...(c.metadata?.demoId ? { demoId: String(c.metadata.demoId), stepNumber: c.metadata.stepNumber || 1 } : {}),
        })),
      }
    },

    async get_demo_steps({ demoId }) {
      const allowed = allowedDemos.find(d => String(d._id) === String(demoId))
      if (!allowed) return { error: 'demo not in allowed list' }
      const story = await Models.Story.findOne({
        _id: allowed._id,
        workspaceId: agent.workspaceId,
        deletedAt: null,
      })
        .populate({ path: 'screens', select: 'steps index' })
        .lean()
      return {
        demoId: String(allowed._id),
        name: allowed.name || 'Untitled',
        steps: storyStepList(story).map(s => ({ stepNumber: s.stepNumber, text: s.text.slice(0, 200) })),
      }
    },
  }
}

// Model ignored mode ANY and answered in text: accept JSON or plain text.
function parseTextAnswer(text) {
  const raw = String(text || '').trim()
  try {
    return JSON.parse(raw)
  } catch (err) {
    return { answer: raw, suggestions: [], action: null }
  }
}

// Returns the `respond` args ({ answer, suggestions, action }).
// `generateStep(contents, { tools, allowedFunctionNames })` → Gemini response.
export async function runToolLoop({ prompt, generateStep, exec, onStatus }) {
  const contents = [{ role: 'user', parts: [{ text: prompt }] }]

  for (let round = 1; round <= MAX_TOOL_ROUNDS; round++) {
    const last = round === MAX_TOOL_ROUNDS
    const res = await generateStep(contents, {
      tools: TOOL_DECLARATIONS,
      allowedFunctionNames: last ? ['respond'] : ALL_TOOLS,
    })
    const calls = res.functionCalls || []

    const respondCall = calls.find(c => c.name === 'respond')
    if (respondCall) return respondCall.args || {}
    if (!calls.length) return parseTextAnswer(res.text)

    // Gemini 3 needs the model turn (with thought signatures) echoed back verbatim
    const modelContent = res.candidates?.[0]?.content
    contents.push(modelContent || { role: 'model', parts: calls.map(c => ({ functionCall: c })) })

    onStatus && onStatus()

    const parts = await Promise.all(calls.map(async (call) => {
      const fn = exec[call.name]
      const result = fn
        ? await fn(call.args || {}).catch(err => ({ error: String(err?.message || err) }))
        : { error: `unknown tool ${call.name}` }
      return { functionResponse: { id: call.id, name: call.name, response: result } }
    }))
    contents.push({ role: 'user', parts })
  }

  return { answer: '', suggestions: [], action: null }
}
