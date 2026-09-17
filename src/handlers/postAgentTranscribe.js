import loadPublicAgent from '../helpers/agent/loadPublicAgent.js'
import loadAgentInWorkspace from '../helpers/agent/loadAgentInWorkspace.js'
import createScribeRealtimeSession from '../helpers/elevenlabsScribeRealtime.js'
import helpers from '../helpers/livedemoHelpers.js'
import { sendJson, sendError } from '../helpers/agent/http.js'

// POST /agents/:agentId/transcribe — mint ElevenLabs Scribe v2 Realtime WS session.
// POST /workspaces/:wid/agents/:agentId/transcribe — editor twin.
const handler = async function (req, res) {
  const { Models } = req.mongo

  try {
    if (req.params.workspaceId) {
      const { authUser } = await helpers.authReq(req, Models)
      helpers.validateUserHasAccessToWorkspace(authUser, req.params.workspaceId)
      await loadAgentInWorkspace(Models, req.params.workspaceId, req.params.agentId)
    } else {
      await loadPublicAgent(req, Models, req.params.agentId)
    }

    const session = await createScribeRealtimeSession()
    sendJson(res, session)
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
