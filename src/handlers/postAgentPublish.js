import helpers from '../helpers/livedemoHelpers.js'
import loadAgentInWorkspace from '../helpers/agent/loadAgentInWorkspace.js'
import { sendJson, sendError } from '../helpers/agent/http.js'

// POST /workspaces/:workspaceId/agents/:agentId/publish  { isPublished }
// Copy of postStoryPublish. Not revision-captured (same as stories).
const handler = async function (req, res) {
  const { Models } = req.mongo
  const { workspaceId, agentId } = req.params

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, workspaceId)

    await loadAgentInWorkspace(Models, workspaceId, agentId)

    const isPublished = !!(req.body && req.body.isPublished)

    const updated = await Models.AiDemoAgent.findOneAndUpdate(
      { _id: agentId },
      { $set: { isPublished } },
      { new: true }
    )

    sendJson(res, updated)
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
