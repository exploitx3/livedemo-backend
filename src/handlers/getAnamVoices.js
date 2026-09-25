import helpers from '../helpers/livedemoHelpers.js'
import { listStockVoices } from '../helpers/agent/anam.js'
import { sendJson, sendError } from '../helpers/agent/http.js'

// GET /workspaces/:workspaceId/anam-voices — stock Anam voices for the Persona tab
const handler = async function (req, res) {
  const { Models } = req.mongo

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, req.params.workspaceId)

    sendJson(res, { voices: await listStockVoices() })
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
