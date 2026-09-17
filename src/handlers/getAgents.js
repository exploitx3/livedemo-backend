import helpers from '../helpers/livedemoHelpers.js'
import { sendJson, sendError } from '../helpers/agent/http.js'

// GET /workspaces/:workspaceId/agents — current workspace only, like getStories
const handler = async function (req, res) {
  const { Models } = req.mongo
  const workspaceId = req.params.workspaceId

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, workspaceId)

    const agents = await Models.AiDemoAgent.find({
      workspaceId,
      deletedAt: null,
    }).sort({ createdAt: -1 }).lean()

    sendJson(res, agents)
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
