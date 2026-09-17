import helpers from '../helpers/livedemoHelpers.js'
import loadAgentInWorkspace from '../helpers/agent/loadAgentInWorkspace.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import { sendJson, sendError, httpError } from '../helpers/agent/http.js'

// DELETE /workspaces/:workspaceId/agents/:agentId/knowledge/:sourceId
// Deletes the source, its chunks, and $pulls it off the agent. No orphans.
const handler = async function (req, res) {
  const { Models } = req.mongo
  const { workspaceId, agentId, sourceId } = req.params

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, workspaceId)

    await loadAgentInWorkspace(Models, workspaceId, agentId)

    const source = await Models.AgentKnowledgeSource.findOne({
      _id: sourceId,
      agentId,
      workspaceId,
    }).lean()

    if (!source) {
      httpError(ResponseCodes['404_NOT_FOUND'], 'Knowledge source not found')
    }

    await Models.AgentKnowledgeChunk.deleteMany({ sourceId: source._id, agentId })
    await Models.AgentKnowledgeSource.deleteOne({ _id: source._id })
    await Models.AiDemoAgent.updateOne(
      { _id: agentId },
      { $pull: { knowledgeSourceIds: source._id } }
    )

    sendJson(res)
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
