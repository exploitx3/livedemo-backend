import helpers from '../helpers/livedemoHelpers.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import patchSubscriptionValidator from '../helpers/validators/oldLambdaRoutes/subscriptions/patchSubscriptionValidator.js'

const handler = function (req, res) {
  let { Models, conn } = req.mongo

  let subscriptionId = req.params.subscriptionId
  let authUserDoc = null
  let requestBody = null

  return Promise.resolve().then(async () => {

      return helpers.authReq(req, Models)
    })
    .then(({ authUser }) => {
      authUserDoc = authUser

      // Validate request body
      let validatedBody = helpers.validateBody(req.body, patchSubscriptionValidator)
      requestBody = validatedBody.value

      if (!requestBody) {
        const resultResponse = {
          statusCode: ResponseCodes['500_INTERNAL_SERVER_ERROR'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
            // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
          },
          body: JSON.stringify({
            message: 'Something wrong happened',
            error: true,
            errorMessage: 'Something wrong happened'
          })
        }

        let error = new Error('Invalid request body')
        error.resultResponse = resultResponse
        throw error
      }
    })
    .then(async () => {
      // Verify the subscription belongs to the user
      const subscription = await Models.Subscription.findOne({ _id: subscriptionId }).lean()
      
      if (!subscription) {
        const resultResponse = {
          statusCode: ResponseCodes['404_NOT_FOUND'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
            // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
          }
        }

        let error = new Error('Subscription not found')
        error.resultResponse = resultResponse
        throw error
      }

      if (subscription.userId.toString() !== authUserDoc._id.toString()) {
        const resultResponse = {
          statusCode: ResponseCodes['403_FORBIDDEN'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
            // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
          }
        }

        let error = new Error('Access denied')
        error.resultResponse = resultResponse
        throw error
      }

      return Models.Subscription.findOneAndUpdate(
        { _id: subscriptionId },
        { $set: { ...requestBody } },
        { new: true }
      ).lean()
    })
    .then((subscription) => {
      if (!subscription) {
        const resultResponse = {
          statusCode: ResponseCodes['500_INTERNAL_SERVER_ERROR'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
            // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
          }
        }

        let error = new Error('Subscription not found')
        error.resultResponse = resultResponse
        throw error
      }

      const resultResponse = {
        statusCode: ResponseCodes['200_OK'],
        headers: {
          'Access-Control-Max-Age': 600,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
          // Required for CORS support to work
          'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        }
      }

      res.set(resultResponse.headers)
      res.status(resultResponse.statusCode)
      res.send(JSON.stringify({
        subscription: subscription
      }))
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
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
            // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
          },
          body: JSON.stringify({
            message: 'Something wrong happened',
            error: true,
            errorMessage: error.message
          })
        }

      }

      res.set(resultResponse.headers)
      res.status(resultResponse.statusCode)
      res.send(resultResponse.body || '')
    })
}

export default  handler
