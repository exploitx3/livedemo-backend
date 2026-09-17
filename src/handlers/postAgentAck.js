import loadPublicAgent from '../helpers/agent/loadPublicAgent.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import moment from 'moment'
import { sendJson, sendError, httpError } from '../helpers/agent/http.js'

// POST /agents/:agentId/ack  { sessionId, type, data }
// Client-side facts the server can't infer: demo_opened, step_viewed,
// suggestion_clicked, cta_clicked, session_ended (hang-up).
const ACK_TYPES = [
  'demo_opened', 'step_viewed', 'suggestion_clicked', 'cta_clicked',
  'voice_started', 'voice_completed', 'session_ended',
]

const handler = async function (req, res) {
  const { Models } = req.mongo
  const agentId = req.params.agentId
  const body = req.body || {}

  try {
    const agent = await loadPublicAgent(req, Models, agentId)

    if (!ACK_TYPES.includes(body.type)) {
      httpError(ResponseCodes['400_BAD_REQUEST'], 'Invalid event type')
    }

    const session = await Models.AgentSession.findOne({
      _id: body.sessionId,
      agentId: agent._id,
    }).lean()
    if (!session) {
      httpError(ResponseCodes['404_NOT_FOUND'], 'Session not found')
    }

    const timestamp = moment().valueOf()

    await Models.AgentSessionEvent.create({
      sessionId: session._id,
      workspaceId: agent.workspaceId,
      agentId: agent._id,
      type: body.type,
      timestamp,
      data: body.data || {},
    })

    if (body.type === 'cta_clicked') {
      await Models.AgentSession.updateOne({ _id: session._id }, { $inc: { ctaClickCount: 1 } })
    }

    if (body.type === 'demo_opened' || body.type === 'step_viewed') {
      const demoId = body.data && body.data.demoId
      const stepNumber = body.data && body.data.stepNumber
      if (demoId) {
        await Models.AgentSession.updateOne({ _id: session._id }, {
          $set: {
            currentDemoId: demoId,
            ...(stepNumber != null ? { currentStepNumber: Number(stepNumber) || 1 } : {}),
            stage: 'demo',
          },
          $addToSet: { viewedDemoIds: demoId },
        })
      }
    }

    if (body.type === 'session_ended') {
      await Models.AgentSession.updateOne({ _id: session._id }, {
        $set: {
          endTimestamp: timestamp,
          duration: timestamp - (session.startTimestamp || timestamp),
          stage: 'ended',
        },
      })
    }

    sendJson(res)
  } catch (error) {
    sendError(res, error)
  }
}

export default handler
