import helpers from '../helpers/livedemoHelpers.js'
import loadAgentInWorkspace from '../helpers/agent/loadAgentInWorkspace.js'
import { sendJson, sendError } from '../helpers/agent/http.js'

// DELETE /workspaces/:workspaceId/agents/:agentId
// Soft-delete the agent; hard-delete its sources, chunks and revisions so no
// vectors leak after deletion. Sessions stay for analytics history.
const handler = async function (req, res) {
  const { Models } = req.mongo
  const { workspaceId, agentId } = req.params

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, workspaceId)

    const agent = await loadAgentInWorkspace(Models, workspaceId, agentId)

    await Models.AiDemoAgent.updateOne({ _id: agent._id }, { $set: { deletedAt: new Date() } })
    await Models.AgentKnowledgeChunk.deleteMany({ agentId: agent._id })
    await Models.AgentKnowledgeSource.deleteMany({ agentId: agent._id })
    await Models.AgentRevision.deleteMany({ agentId: agent._id })

    sendJson(res)
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
