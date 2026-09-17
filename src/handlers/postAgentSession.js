import helpers from '../helpers/livedemoHelpers.js'
import loadPublicAgent from '../helpers/agent/loadPublicAgent.js'
import ENV from '../envServer.js'
import moment from 'moment'
import short from 'short-uuid'
import { sendJson, sendError } from '../helpers/agent/http.js'

// POST /agents/:agentId/session  { visitor: { name, email }, mode? }
// Public when published (loadPublicAgent gate), geo like postStorySession.
// Also writes a Lead when the connect modal captured name/email.
const handler = async function (req, res) {
  const { Models } = req.mongo
  const agentId = req.params.agentId
  const body = req.body || {}

  let clientIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : (ENV.ENV === 'dev' ? '69.200.224.152' : '')
  clientIp = clientIp.split(',')[0]

  try {
    const agent = await loadPublicAgent(req, Models, agentId)

    // 'editor' mode only via the authenticated twin route (req.agentMode)
    const mode = req.agentMode === 'editor' ? 'editor' : 'published'

    let clientIpData = {}
    if (clientIp) {
      try {
        const data = await helpers.getClientIpData(clientIp)
        clientIpData = {
          ip: data.ip,
          continent: data.continent,
          continent_code: data.continent_code,
          country: data.country,
          country_code: data.country_code,
          region: data.region,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          is_eu: data.is_eu,
          postal: data.postal,
          calling_code: data.calling_code,
          flag: data.flag,
          timezone: data.timezone,
        }
      } catch (err) {
        console.log('getClientIpData failed', err.message)
      }
    }

    const visitor = body.visitor || {}

    const session = await new Models.AgentSession({
      workspaceId: agent.workspaceId,
      agentId: agent._id,
      mode,
      visitorName: visitor.name || '',
      visitorEmail: visitor.email || '',
      visitorSessionId: short.uuid(),
      clientIpData,
      startTimestamp: moment().valueOf(),
    }).save()

    await Models.AgentSessionEvent.create({
      sessionId: session._id,
      workspaceId: agent.workspaceId,
      agentId: agent._id,
      type: 'session_started',
      timestamp: session.startTimestamp,
      data: {},
    })

    if (mode === 'published' && (visitor.name || visitor.email)) {
      const lead = await new Models.Lead({
        workspaceId: agent.workspaceId,
        agentId: agent._id,
        agentSessionId: session._id,
        data: { name: visitor.name || '', email: visitor.email || '' },
      }).save()
      await Models.AgentSession.updateOne({ _id: session._id }, { $set: { leadId: lead._id } })
    }

    sendJson(res, { _id: session._id, visitorSessionId: session.visitorSessionId })
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
