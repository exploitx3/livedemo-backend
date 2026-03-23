import helpers from '../helpers/livedemoHelpers.js'
import patchFormValidator from '../helpers/validators/forms/patchFormValidator.js'
import ResponseCodes from '../constants/ResponseCodes.js'

const handler = function (req, res) {
  let { Models, conn } = req.mongo


  let requestBody = null

  let workspaceId = req.params.workspaceId
  // let storyId = req.params.storyId
  // let screenId = req.params.screenId
  // let stepId = req.params.stepId
  let formId = req.params.formId
  let authUserDoc = null

  return Promise.resolve().then(async () => {

      return helpers.authReq(req, Models)
    })
    .then(({ authUser }) => {
      authUserDoc = authUser

      let validatedBody = helpers.validateBody(req.body, patchFormValidator)
      requestBody = validatedBody.value

      helpers.validateUserHasAccessToWorkspace(authUserDoc, workspaceId)
    })
    .then(() => {

      const title = requestBody.title
      const type = requestBody.type
      const hubspot = requestBody.hubspot

      

      let updateObj = {}

      if (title) {
        updateObj['title'] = title
      }

      if (type) {
        updateObj['type'] = type
      }

      if (hubspot) {
        updateObj['hubspot'] = hubspot
      }

      if (Object.keys(updateObj).length !== 0) {

        return Models.Form.findOneAndUpdate({ _id: formId}, { $set: updateObj }, {
            new: true,
            overwrite: false
          })
      } else {

        return null
      }

    })
    .then((updatedFormDoc) => {

      if (!updatedFormDoc) {
        throw new Error('Form couldn\'t be updated')
      }

      const resultResponse = {
        statusCode: ResponseCodes['200_OK'],
        headers: {
          'Access-Control-Max-Age': 600,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
          // Required for CORS support to work
          'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify(updatedFormDoc)
      }

      res.set(resultResponse.headers)
      res.status(resultResponse.statusCode)
      res.send(resultResponse.body)

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
