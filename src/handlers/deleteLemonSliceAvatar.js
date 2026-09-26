import helpers from '../helpers/livedemoHelpers.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import { sendJson, sendError, httpError } from '../helpers/agent/http.js'

// DELETE /workspaces/:workspaceId/lemonslice-avatars/:avatarId
// Agents using it lose the face (avatar hidden) rather than pointing at nothing.
const handler = async function (req, res) {
  const { Models } = req.mongo
  const { workspaceId, avatarId } = req.params

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, workspaceId)

    const deleted = await Models.LemonSliceAvatar.findOneAndDelete({ _id: avatarId, workspaceId })
    if (!deleted) httpError(ResponseCodes['404_NOT_FOUND'], 'Avatar not found')

    await Models.AiDemoAgent.updateMany(
      { workspaceId, lemonsliceAvatarId: String(deleted._id) },
      { $set: { lemonsliceAvatarId: '', avatarUrl: '' } },
    )

    sendJson(res, { id: String(deleted._id) })
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
