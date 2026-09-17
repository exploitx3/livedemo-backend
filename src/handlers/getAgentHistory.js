import helpers from '../helpers/livedemoHelpers.js'
import { historyCounts } from '../helpers/agentRevisions.js'
import { sendJson, sendError } from '../helpers/agent/http.js'

// GET /workspaces/:workspaceId/agents/:agentId/history
// ?limit=0 returns counts only (editor load), like getStoryHistory.
const handler = async function (req, res) {
  const { Models } = req.mongo
  const { workspaceId, agentId } = req.params

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, workspaceId)

    const limit = req.query.limit !== undefined ? Number(req.query.limit) : 100

    const revisions = limit > 0
      ? await Models.AgentRevision
          .find({ agentId, kind: 'undo' })
          .sort({ _id: -1 })
          .limit(limit)
          .select('_id actionLabel createdAt')
          .lean()
      : []

    const counts = await historyCounts(Models, agentId)

    sendJson(res, { revisions, ...counts })
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
