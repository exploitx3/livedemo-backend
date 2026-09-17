import helpers from '../helpers/livedemoHelpers.js'
import { sendError } from '../helpers/agent/http.js'

// Marks a workspace-scoped agent route as editor mode AFTER proving auth +
// workspace membership. Editor sessions are excluded from analytics, and
// editor mode may surface unpublished allowed demos — so it must never be
// reachable anonymously, even for published agents.
const agentEditorMode = async (req, res, next) => {
  try {
    const { Models } = req.mongo
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, req.params.workspaceId)

    req.agentMode = 'editor'
    next()
  } catch (error) {
    sendError(res, error)
  }
}

// Same proof, but optional: anonymous / non-member falls through as published
// instead of 401. For read-only routes (preview, player) where the workspace
// URL must work publicly for published agents — loadPublicAgent still gates
// unpublished ones. Never use on session/chat: editor sessions skew analytics.
export const agentEditorModeOptional = async (req, res, next) => {
  try {
    const { Models } = req.mongo
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, req.params.workspaceId)
    req.agentMode = 'editor'
  } catch (error) {
    // no/invalid token → published mode
  }
  next()
}

export default agentEditorMode
