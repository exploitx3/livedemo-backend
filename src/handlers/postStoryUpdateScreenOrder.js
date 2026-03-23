import helpers from '../helpers/livedemoHelpers.js'
import postUpdateScreenOrder from '../helpers/validators/stories/postUpdateScreenOrderValidator.js'
import ResponseCodes from '../constants/ResponseCodes.js'

const handler = function (req, res) {
  let { Models, conn } = req.mongo

  let requestBody = null

  let workspaceId = req.params.workspaceId
  let storyId = req.params.storyId
  let screenId = req.params.screenId
  let authUserDoc = null

  return Promise.resolve().then(async () => {

      return helpers.authReq(req, Models)
    })
    .then(({ authUser }) => {
      authUserDoc = authUser

      let validatedBody = helpers.validateBody(req.body, postUpdateScreenOrder)
      requestBody = validatedBody.value

      helpers.validateUserHasAccessToWorkspace(authUserDoc, workspaceId)
    })
    .then(async () => {
      let screens = requestBody.screens

      let updateOps = []
      screens.forEach((screen) => {

        updateOps.push({
          updateOne: {
            filter: {
              _id: screen._id,
            },
            update: {
              index: screen.index,
            }
          }
        })
      })


      return Models.Screen.bulkWrite(updateOps)
    })
    .then((writeResult) => {

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
      res.send()
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
          body: ''
        }

      }

      res.set(resultResponse.headers)
      res.status(resultResponse.statusCode)
      res.send(resultResponse.body)
    })
}

export default  handler
