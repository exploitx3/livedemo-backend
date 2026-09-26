import loadPublicAgent from '../helpers/agent/loadPublicAgent.js'
import { avatarIsLive, isLemonSlice } from '../helpers/agent/anam.js'
import { createLemonSliceSession } from '../helpers/agent/lemonslice.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import { sendJson, sendError, httpError } from '../helpers/agent/http.js'
import ipRateLimit from '../helpers/agent/ipRateLimit.js'

// Each call starts a billed LemonSlice session
const checkIpLimit = ipRateLimit({ limit: 10, interval: 60 * 60 * 1000, message: 'Too many avatar sessions, try again later' })

// POST /agents/:agentId/lemonslice-session — LiveKit room + token for the talking face.
// No workspace twin: the editor pane never opens a (billed) avatar session.
const handler = async function (req, res) {
  const { Models } = req.mongo

  try {
    const agent = await loadPublicAgent(req, Models, req.params.agentId)
    if (!avatarIsLive(agent) || !isLemonSlice(agent)) {
      httpError(ResponseCodes['400_BAD_REQUEST'], 'Avatar is not enabled for this agent')
    }
    await checkIpLimit(req)

    sendJson(res, await createLemonSliceSession(Models, agent))
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
