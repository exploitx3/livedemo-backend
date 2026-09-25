import helpers from '../helpers/livedemoHelpers.js'
import loadAgentInWorkspace from '../helpers/agent/loadAgentInWorkspace.js'
import { sendJson, sendError } from '../helpers/agent/http.js'

// GET /workspaces/:workspaceId/agents/:agentId/sessions/:sessionId/recording
// rrweb events for the analytics replay — same shape as getStorySessionEvents.
const handler = async function (req, res) {
  const { Models } = req.mongo
  const { workspaceId, agentId, sessionId } = req.params

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, workspaceId)
    await loadAgentInWorkspace(Models, workspaceId, agentId)

    const recording = await Models.Session.findOne({ type: 'agent', agentSessionId: sessionId, workspaceId }).lean()
    if (!recording) return sendJson(res, [])

    const events = await Models.SessionEvent.find({ workspaceId, sessionId: recording._id })
      .sort({ 'eventData.timestamp': 1 })
      .lean()

    sendJson(res, events.map(event => ({
      ...event.eventData,
      data: JSON.parse(event.eventData.data),
    })))
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
