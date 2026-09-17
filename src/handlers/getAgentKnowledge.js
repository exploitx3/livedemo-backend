import helpers from '../helpers/livedemoHelpers.js'
import loadAgentInWorkspace from '../helpers/agent/loadAgentInWorkspace.js'
import { sendJson, sendError } from '../helpers/agent/http.js'

// GET /workspaces/:workspaceId/agents/:agentId/knowledge — THIS agent's sources only
const handler = async function (req, res) {
  const { Models } = req.mongo
  const { workspaceId, agentId } = req.params

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, workspaceId)

    await loadAgentInWorkspace(Models, workspaceId, agentId)

    const sources = await Models.AgentKnowledgeSource.find({
      agentId,
      workspaceId,
    }).sort({ createdAt: -1 }).lean()

    sendJson(res, sources)
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
