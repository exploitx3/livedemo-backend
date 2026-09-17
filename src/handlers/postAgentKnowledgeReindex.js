import helpers from '../helpers/livedemoHelpers.js'
import loadAgentInWorkspace from '../helpers/agent/loadAgentInWorkspace.js'
import enqueueIndexAgentKnowledge from '../helpers/agent/enqueueIndexJob.js'
import { sendJson, sendError } from '../helpers/agent/http.js'

// POST /workspaces/:workspaceId/agents/:agentId/knowledge/reindex        (all)
// POST /workspaces/:workspaceId/agents/:agentId/knowledge/:sourceId/reindex (one)
const handler = async function (req, res) {
  const { Models } = req.mongo
  const { workspaceId, agentId, sourceId } = req.params

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, workspaceId)

    await loadAgentInWorkspace(Models, workspaceId, agentId)

    await Models.AgentKnowledgeSource.updateMany(
      sourceId ? { _id: sourceId, agentId } : { agentId },
      { $set: { status: 'pending', errorMessage: '' } }
    )

    await enqueueIndexAgentKnowledge(agentId, sourceId || null)

    sendJson(res, { enqueued: true })
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
