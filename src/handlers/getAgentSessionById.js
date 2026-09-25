import helpers from '../helpers/livedemoHelpers.js'
import loadAgentInWorkspace from '../helpers/agent/loadAgentInWorkspace.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import { sendJson, sendError, httpError } from '../helpers/agent/http.js'

// GET /workspaces/:workspaceId/agents/:agentId/sessions/:sessionId
// Session + transcript + events — the analytics drill-in. Replay events come
// from .../recording when hasRecording.
const handler = async function (req, res) {
  const { Models } = req.mongo
  const { workspaceId, agentId, sessionId } = req.params

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, workspaceId)

    await loadAgentInWorkspace(Models, workspaceId, agentId)

    const session = await Models.AgentSession.findOne({ _id: sessionId, agentId }).lean()
    if (!session) {
      httpError(ResponseCodes['404_NOT_FOUND'], 'Session not found')
    }

    const [messages, events, recording] = await Promise.all([
      Models.AgentMessage.find({ sessionId }).sort({ _id: 1 }).lean(),
      Models.AgentSessionEvent.find({ sessionId }).sort({ timestamp: 1 }).lean(),
      Models.Session.exists({ type: 'agent', agentSessionId: sessionId }),
    ])

    sendJson(res, { session, messages, events, hasRecording: !!recording })
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
