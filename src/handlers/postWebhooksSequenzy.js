import mongoose from 'mongoose'
import ResponseCodes from '../constants/ResponseCodes.js'
import {
  verifyWebhookSignature,
} from '../helpers/sequenzy/sequenzyClient.js'

const CORS_HEADERS = {
  'Access-Control-Max-Age': 600,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Sequenzy-Event-Id,X-Sequenzy-Event-Type,X-Sequenzy-Timestamp,X-Sequenzy-Signature',
  'Access-Control-Allow-Credentials': true,
}

const UNSUBSCRIBE_EVENT_TYPES = new Set([
  'subscriber.unsubscribed',
  'email.unsubscribed',
  'email.bounced',
])

async function markUserUnsubscribed(Models, data, eventType) {
  const email = data?.email || data?.recipient
  const externalId = data?.external_id
  const subscriberId = data?.subscriber_id

  console.log(`[sequenzy] webhook unsubscribe event=${eventType} email=${email || ''} externalId=${externalId || ''} subscriberId=${subscriberId || ''}`)

  const or = []
  if (externalId && mongoose.Types.ObjectId.isValid(externalId)) {
    or.push({ _id: externalId })
  }
  if (email) or.push({ email })
  if (subscriberId) or.push({ 'sequenzy.subscriberId': subscriberId })
  if (!or.length) {
    console.log(`[sequenzy] webhook unsubscribe skipped — no email/externalId/subscriberId on event=${eventType}`)
    return null
  }

  const updatedUser = await Models.User.findOneAndUpdate(
    { $or: or },
    {
      $set: {
        'emailConfig.isSubscribed': false,
        'emailConfig.unsubscribedAt': new Date(),
      },
    },
    { new: true }
  )

  if (updatedUser) {
    console.log(`[sequenzy] webhook unsubscribe applied userId=${updatedUser._id} email=${updatedUser.email} event=${eventType}`)
  } else {
    console.log(`[sequenzy] webhook unsubscribe no matching user event=${eventType} email=${email || ''} externalId=${externalId || ''} subscriberId=${subscriberId || ''}`)
  }

  return updatedUser
}

const handler = function (req, res) {
  const { Models } = req.mongo

  return Promise.resolve()
    .then(async () => {
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}), 'utf8')

      const timestamp = req.headers['x-sequenzy-timestamp']
      const signature = req.headers['x-sequenzy-signature']

      if (!verifyWebhookSignature(rawBody, timestamp, signature)) {
        const err = new Error('Invalid Sequenzy webhook signature')
        err.resultResponse = {
          statusCode: ResponseCodes['401_UNAUTHORIZED'] || 401,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: true, message: 'Invalid signature' }),
        }
        throw err
      }

      let event
      try {
        event = JSON.parse(rawBody.toString('utf8'))
      } catch {
        const err = new Error('Invalid JSON')
        err.resultResponse = {
          statusCode: ResponseCodes['400_BAD_REQUEST'],
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: true, message: 'Invalid JSON' }),
        }
        throw err
      }

      const type = event?.type || req.headers['x-sequenzy-event-type']
      const eventId = event?.id || req.headers['x-sequenzy-event-id'] || ''
      console.log(`[sequenzy] webhook received eventId=${eventId} type=${type || 'unknown'}`)

      if (UNSUBSCRIBE_EVENT_TYPES.has(type)) {
        await markUserUnsubscribed(Models, event.data || {}, type)
      }

      res.set(CORS_HEADERS)
      res.status(ResponseCodes['200_OK'])
      res.send(JSON.stringify({ received: true }))
    })
    .catch((error) => {
      console.log('[sequenzy] webhook error:', error)

      const resultResponse = error.resultResponse || {
        statusCode: ResponseCodes['500_INTERNAL_SERVER_ERROR'],
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: true, message: 'Webhook handler failed' }),
      }

      res.set(resultResponse.headers)
      res.status(resultResponse.statusCode)
      res.send(resultResponse.body || '')
    })
}

export default handler
