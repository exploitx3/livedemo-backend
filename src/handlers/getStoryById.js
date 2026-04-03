import helpers from '../helpers/livedemoHelpers.js'
import ResponseCodes from '../constants/ResponseCodes.js'

const handler = function (req, res) {
  let { Models, conn } = req.mongo

  let workspaceId = req.params.workspaceId
  let storyId = req.params.storyId
  let authUserDoc = null

  return Promise.resolve().then(async () => {

      return helpers.authReq(req, Models)
    })
    .then(({ authUser }) => {
      authUserDoc = authUser

      helpers.validateUserHasAccessToWorkspace(authUserDoc, workspaceId)
    })
    .then(async () => {


      return Models.Story.findOne({
          _id: storyId,
          deletedAt: null
        })
        .populate({
          path: 'screens',
          populate: [
            {
              path: 'customTransitions.gotoScreen',
              model: 'Screen',
              select: '_id name'
            },
            {
              path: 'steps.view.popup.formId',
              model: 'Form',
            },
            {
              path: 'steps.stepAudioId',
              model: 'Audio',
            },
            {
              path: 'steps.view.popup.buttons.gotoScreen',
              model: 'Screen',
            }
          ],
          select: '_id name type screens steps customTransitions width height imageUrl index asset playbackRate popups zoomSpans zoomSpan startTime endTime',
        })
        .populate('content.contentId')
    })
    .then((foundStory) => {
      if (foundStory && Array.isArray(foundStory.screens)) {
        foundStory.screens.sort((a, b) => a.index - b.index)
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
      res.send(JSON.stringify(foundStory))
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

