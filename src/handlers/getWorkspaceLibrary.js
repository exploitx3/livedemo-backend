import helpers from '../helpers/livedemoHelpers.js'
import ResponseCodes from '../constants/ResponseCodes.js'

const handler = function (req, res) {
  let { Models, conn } = req.mongo

  let workspaceId = req.params.workspaceId
  let authUserDoc = null

  return Promise.resolve().then(async () => {

      return helpers.authReq(req, Models)
    })
    .then(({ authUser }) => {
      authUserDoc = authUser

      helpers.validateUserHasAccessToWorkspace(authUserDoc, workspaceId)
    })
    .then(async () => {


      return Models.Workspace.findOne({
          _id: workspaceId
        })
        .populate('library.pages', '_id name index imageUrl', null, { sort: { index: 1 } })
        .populate('library.screenshots', '_id name index imageUrl', null, { sort: { index: 1 } })
        .populate('library.videos', '_id name index asset.playback_ids', null, { sort: { index: 1 } })
      // .populate('screens', ['_id', 'name', 'steps', 'customTransitions', 'imageUrl', 'index', 'imageUrl'], null, { sort: { 'index': 1 } })
    })
    .then((foundWorkspace) => {
      const libraryObj = foundWorkspace.library

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
      res.send(JSON.stringify(libraryObj))
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

