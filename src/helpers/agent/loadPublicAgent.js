import helpers from '../livedemoHelpers.js'
import ResponseCodes from '../../constants/ResponseCodes.js'
import { httpError } from './http.js'

// Publish gate — copy of getPreviewStory.js behavior for AiDemoAgent.
// Anonymous access only when isPublished; otherwise Bearer token + workspace
// membership (editor / share-while-draft). Used by EVERY public-looking route:
// preview, session, chat, ack — not only the first page load.
export default async function loadPublicAgent(req, Models, agentId) {
  const agent = await Models.AiDemoAgent.findOne({ _id: agentId, deletedAt: null })

  if (!agent) {
    httpError(ResponseCodes['404_NOT_FOUND'], 'Agent not found')
  }

  if (agent.isPublished) {
    return agent
  }

  const { authUser } = await helpers.authReq(req, Models)
  helpers.validateUserHasAccessToWorkspace(authUser, agent.workspaceId.toString())

  return agent
}
