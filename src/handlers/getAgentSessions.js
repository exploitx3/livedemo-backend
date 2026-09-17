import helpers from '../helpers/livedemoHelpers.js'
import loadAgentInWorkspace from '../helpers/agent/loadAgentInWorkspace.js'
import moment from 'moment'
import { sendJson, sendError } from '../helpers/agent/http.js'

// GET /workspaces/:workspaceId/agents/:agentId/sessions — one agent's sessions
// (like getStorySessions: 30-day window)
const handler = async function (req, res) {
  const { Models } = req.mongo
  const { workspaceId, agentId } = req.params

  const startTimestamp = moment().subtract(30, 'day').valueOf()
  const endTimestamp = moment().valueOf()

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, workspaceId)

    await loadAgentInWorkspace(Models, workspaceId, agentId)

    const sessions = await Models.AgentSession.find({
      agentId,
      mode: 'published',
      startTimestamp: { $gte: startTimestamp, $lte: endTimestamp },
    })
      .sort({ startTimestamp: -1 })
      .lean()

    sendJson(res, sessions)
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
