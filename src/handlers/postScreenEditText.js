import helpers from '../helpers/livedemoHelpers.js'
import postScreenEditTextValidator from '../helpers/validators/stories/screens/postScreenEditTextValidator.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import { editRrwebScreenText } from '../helpers/editRrwebScreenText.js'

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

      let validatedBody = helpers.validateBody(req.body, postScreenEditTextValidator)
      requestBody = validatedBody.value

      helpers.validateUserHasAccessToWorkspace(authUserDoc, workspaceId)
    })
    .then(async () => {


      return Models.Screen.findOne({
        _id: screenId
      }).lean()
    })
    .then(async (screenDoc) => {
      if (!screenDoc) {
        const error = new Error('Screen not found')
        error.resultResponse = {
          statusCode: ResponseCodes['404_NOT_FOUND'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept',
            'Access-Control-Allow-Credentials': true,
          },
          body: JSON.stringify({ message: 'Screen not found' }),
        }
        throw error
      }

      // Legacy static HTML PageScreens are no longer editable / captured.
      // Only rrweb DOM screens (recordingRole) support Edit Text.
      if (!screenDoc.recordingRole) {
        const error = new Error('EditText is only supported for DOM (rrweb) screens')
        error.resultResponse = {
          statusCode: ResponseCodes['400_BAD_REQUEST'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept',
            'Access-Control-Allow-Credentials': true,
          },
          body: JSON.stringify({ message: 'EditText is only supported for DOM (rrweb) screens' }),
        }
        throw error
      }

      const nodeId = parseInt(requestBody.selector, 10)
      if (!Number.isFinite(nodeId)) {
        const error = new Error('Invalid rrweb node id')
        error.resultResponse = {
          statusCode: ResponseCodes['400_BAD_REQUEST'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept',
            'Access-Control-Allow-Credentials': true,
          },
          body: JSON.stringify({ message: 'Invalid rrweb node id' }),
        }
        throw error
      }

      return editRrwebScreenText({
        Models,
        screenDoc,
        nodeId,
        text: requestBody.text,
      })
    })
    .then(() => {

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
