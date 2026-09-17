import helpers from '../helpers/livedemoHelpers.js'
import moment from 'moment'
import { sendJson, sendError } from '../helpers/agent/http.js'

const VIEW_TYPES = { '48H': '48H', '7D': '7D', '30D': '30D' }

// GET /workspaces/:workspaceId/agent-sessions?viewType=30D
// Same 48H/7D/30D window as getWorkspaceSessions. Published visits only —
// editor sessions never inflate numbers.
// ponytail: no server pagination; metrics grouped in Node over the window's
// sessions. Fine for thousands of sessions; upgrade path is the aggregation
// pipeline getWorkspaceSessions already uses.
const handler = async function (req, res) {
  const { Models } = req.mongo
  const workspaceId = req.params.workspaceId
  const viewType = VIEW_TYPES[req.query.viewType] || '30D'

  const subtractDays = viewType === '48H' ? 2 : (viewType === '7D' ? 7 : 30)
  const startTimestamp = moment().subtract(subtractDays, 'day').valueOf()
  const endTimestamp = moment().valueOf()

  try {
    const { authUser } = await helpers.authReq(req, Models)
    helpers.validateUserHasAccessToWorkspace(authUser, workspaceId)

    const sessions = await Models.AgentSession.find({
      workspaceId,
      mode: 'published',
      startTimestamp: { $gte: startTimestamp, $lte: endTimestamp },
    })
      .populate('agentId', 'name')
      .sort({ startTimestamp: -1 })
      .lean()

    const agentIds = [...new Set(sessions.map(s => String(s.agentId?._id || s.agentId)))]
    const agents = await Models.AiDemoAgent.find({
      _id: { $in: agentIds },
    }).select('_id name isPublished createdAt').lean()

    const leadsAgg = await Models.Lead.aggregate([
      { $match: { agentId: { $in: agents.map(a => a._id) } } },
      { $group: { _id: '$agentId', count: { $sum: 1 } } },
    ])
    const leadsCountMap = {}
    leadsAgg.forEach(item => { leadsCountMap[item._id.toString()] = item.count })

    const agentDocsWithMetrics = agents.map((agent) => {
      const agentSessions = sessions.filter(s => String(s.agentId?._id || s.agentId) === String(agent._id))
      const uniqueIps = new Set(agentSessions.map(s => s.clientIpData?.ip).filter(Boolean))

      return {
        ...agent,
        views: agentSessions.length,
        uniqueUsers: uniqueIps.size,
        timeSpent: agentSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
        messages: agentSessions.reduce((sum, s) => sum + (s.messageCount || 0), 0),
        demosOpened: agentSessions.reduce((sum, s) => sum + (s.demosOpenedCount || 0), 0),
        ctaClicks: agentSessions.reduce((sum, s) => sum + (s.ctaClickCount || 0), 0),
        leads: leadsCountMap[String(agent._id)] || 0,
      }
    }).sort((a, b) => b.views - a.views)

    sendJson(res, { sessions, agentDocsWithMetrics, meta: {} })
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
