import ResponseCodes from '../constants/ResponseCodes.js'
import afterPaymentValidator from '../helpers/validators/oldLambdaRoutes/payments/afterPaymentValidator.js'
import helpers from '../helpers/livedemoHelpers.js'
import EventReporter from '../helpers/eventReporter.js'
import EventNamesEnum from '../constants/EventNamesEnum.js'
import SubscriptionTypes from '../constants/SubscriptionTypes.js'

const handler = function (req, res) {
  let { Models, conn } = req.mongo
  let requestBody = req.body

  return Promise.resolve().then(() => {
      // Validate request body
      let validatedBody = helpers.validateBody(requestBody, afterPaymentValidator)
      if (validatedBody.error) {
        const resultResponse = {
          statusCode: ResponseCodes['500_INTERNAL_SERVER_ERROR'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept',
            'Access-Control-Allow-Credentials': true,
          },
          body: JSON.stringify({
            error: validatedBody.error.message || 'Validation failed'
          })
        }

        let error = new Error('Validation failed')
        error.resultResponse = resultResponse
        throw error
      }
      requestBody = validatedBody.value
    })
    .then(() => {
      const { chargeId, subscriptionId } = requestBody

      // Get charge and subscription
      let chargePromise = chargeId === '' ? Promise.resolve(null) : Models.Charge.findOne({ _id: chargeId }).lean()
      
      return Promise.all([
        chargePromise,
        Models.Subscription.findOne({ _id: subscriptionId }).lean()
      ])
    })
    .then(([chargeDoc, subDoc]) => {
      if (!subDoc) {
        throw new Error('Subscription not found')
      }

      // Cancel other active subscriptions for this workspace
      return Models.Subscription.find({
        workspaceId: subDoc.workspaceId,
        active: true,
        expired: false,
        _id: { $ne: subscriptionId }
      }).lean()
        .then((subsToCancel) => {
          // TODO: Implement subscription cancellation logic
          // For now, just mark them as inactive
          if (subsToCancel.length > 0) {
            return Models.Subscription.updateMany(
              { _id: { $in: subsToCancel.map(s => s._id) } },
              { $set: { active: false } }
            )
              .then(() => {
                return { chargeDoc, subDoc }
              })
          }
          return { chargeDoc, subDoc }
        })
    })
    .then(({ chargeDoc, subDoc }) => {
      // Report event
      return EventReporter.storeInfoEvent(EventNamesEnum.SUBSCRIPITON_PURCHASED, {
        userId: subDoc.userId,
        chargeDoc,
        subDoc
      })
        .then(() => {
          return { chargeDoc, subDoc }
        })
    })
    .then(({ chargeDoc, subDoc }) => {
      // TODO: Trigger workspace populate saga if needed
      // This would typically involve creating jobs or triggering async processes

      // TODO: Create populate job, update instant updates job, finalize subscription job
      // These are typically background jobs that run at scheduled times

      // For now, just update feature flags based on subscription type
      let featureFlags = {
        channelExports: false,
        instantUpdates: false,
        workspaceExports: false,
        freeActivate: true
      }

      if (subDoc.type === SubscriptionTypes.STARTUP_MONTHLY || subDoc.type === SubscriptionTypes.STARTUP_ANNUALLY) {
        featureFlags.channelExports = true
      } else if (subDoc.type === SubscriptionTypes.PRO_MONTHLY || subDoc.type === SubscriptionTypes.PRO_ANNUALLY) {
        featureFlags.channelExports = true
      } else if (subDoc.type === SubscriptionTypes.BUSINESS_MONTHLY || subDoc.type === SubscriptionTypes.BUSINESS_ANNUALLY) {
        featureFlags.channelExports = true
        featureFlags.instantUpdates = true
        featureFlags.workspaceExports = true
      }

      // Note: WorkspaceMember model may not exist in story-api
      // This would need to be adapted based on your data model
      // For now, we'll just return success

      return Promise.resolve()
    })
    .then(() => {
      const resultResponse = {
        statusCode: ResponseCodes['200_OK'],
        headers: {
          'Access-Control-Max-Age': 600,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept',
          'Access-Control-Allow-Credentials': true,
        }
      }

      res.set(resultResponse.headers)
      res.status(resultResponse.statusCode)
      res.send(JSON.stringify({}))
    })
    .catch((error) => {
      console.log(error)

      let resultResponse
      if (error.resultResponse) {
        resultResponse = error.resultResponse
      } else {
        resultResponse = {
          statusCode: ResponseCodes['500_INTERNAL_SERVER_ERROR'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept',
            'Access-Control-Allow-Credentials': true,
          },
          body: JSON.stringify({})
        }
      }

      res.set(resultResponse.headers)
      res.status(resultResponse.statusCode)
      res.send(resultResponse.body || '')
    })
}

export default handler
