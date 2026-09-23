import loadPublicAgent from '../helpers/agent/loadPublicAgent.js'
import loadAgentInWorkspace from '../helpers/agent/loadAgentInWorkspace.js'
import helpers from '../helpers/livedemoHelpers.js'
import runAgentTurn from '../helpers/agent/runAgentTurn.js'
import { parsePlayerState } from '../helpers/agent/validateActions.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import { sendError, httpError, CORS_HEADERS } from '../helpers/agent/http.js'

// POST /agents/:agentId/chat                     (public, isPublished gate)
// POST /workspaces/:wid/agents/:agentId/chat     (editor twin, auth + workspace)
// Body: { sessionId, message, source?, demoId?, stepNumber? } (demoId/stepNumber =
// player's current position). Response: SSE stream
// (status / text / content_card / suggestions / done / error).
const handler = async function (req, res) {
  const { Models } = req.mongo
  const body = req.body || {}
  let headersSent = false

  try {
    let agent
    let mode
    if (req.params.workspaceId) {
      const { authUser } = await helpers.authReq(req, Models)
      helpers.validateUserHasAccessToWorkspace(authUser, req.params.workspaceId)
      agent = await loadAgentInWorkspace(Models, req.params.workspaceId, req.params.agentId)
      mode = 'editor'
    } else {
      agent = await loadPublicAgent(req, Models, req.params.agentId)
      mode = 'published'
    }

    let session = await Models.AgentSession.findOne({
      _id: body.sessionId,
      agentId: agent._id,
    }).lean()
    if (!session) {
      httpError(ResponseCodes['404_NOT_FOUND'], 'Session not found')
    }

    // Visitor may have clicked through the player since the last content_card
    const player = parsePlayerState(body)
    if (player) {
      session = { ...session, currentDemoId: player.demoId, currentStepNumber: player.stepNumber }
    }

    const message = String(body.message || '').trim().slice(0, 4000)
    if (!message) {
      httpError(ResponseCodes['400_BAD_REQUEST'], 'message is required')
    }

    res.set({
      ...CORS_HEADERS,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    res.flushHeaders()
    headersSent = true

    const sse = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    await runAgentTurn(Models, {
      agent,
      session,
      message,
      source: body.source,
      mode,
      sse,
    })

    res.end()
  } catch (error) {
    if (headersSent) {
      console.log(error)
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Something went wrong' })}\n\n`)
      res.end()
    } else {
      sendError(res, error)
    }
  }
}

export default handler
