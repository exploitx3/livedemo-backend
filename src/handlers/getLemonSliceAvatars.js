import helpers from '../helpers/livedemoHelpers.js'
import { listAvatars } from '../helpers/agent/lemonslice.js'
import { sendJson, sendError } from '../helpers/agent/http.js'

// GET /workspaces/:workspaceId/lemonslice-avatars — workspace custom + stock LemonSlice faces
const handler = async function (req, res) {
  const { Models } = req.mongo

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, req.params.workspaceId)

    sendJson(res, { avatars: await listAvatars(Models, req.params.workspaceId) })
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
