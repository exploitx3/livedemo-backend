import helpers from '../helpers/livedemoHelpers.js'
import { sendJson, sendError } from '../helpers/agent/http.js'

// POST /workspaces/:workspaceId/agents  { name }
// Workspace comes from the URL, never a picker (same shape as postEmptyStory).
const handler = async function (req, res) {
  const { Models } = req.mongo
  const workspaceId = req.params.workspaceId

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, workspaceId)

    const name = (req.body && req.body.name) || 'Untitled agent'

    const agent = await new Models.AiDemoAgent({
      name,
      workspaceId,
      userId: authUser.id,
    }).save()

    sendJson(res, { _id: agent._id })
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
