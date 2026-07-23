import helpers from '../helpers/livedemoHelpers.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import { httpError } from '../helpers/rrwebScreenGuards.js'

const handler = function (req, res) {
  let { Models, conn } = req.mongo

  let workspaceId = req.params.workspaceId
  let storyId = req.params.storyId
  let screenId = req.params.screenId
  let authUserDoc = null

  return Promise.resolve().then(async () => {

      return helpers.authReq(req, Models)
    })
    .then(({ authUser }) => {
      authUserDoc = authUser
      helpers.validateUserHasAccessToWorkspace(authUserDoc, workspaceId)
    })
    .then(async () => {
      const screenDoc = await Models.Screen.findOne({ _id: screenId }).lean()
      if (!screenDoc) {
        httpError(ResponseCodes['404_NOT_FOUND'], 'Screen not found')
      }

      // Guard: block deleting a base that has linked deltas
      if (screenDoc.recordingRole === 'base') {
        const linkedDelta = await Models.Screen.findOne({
          storyId,
          recordingRole: 'delta',
          baseScreenId: screenId,
        }).lean()
        if (linkedDelta) {
          httpError(
            ResponseCodes['409_CONFLICT'],
            'Cannot delete a base screen that still has linked delta screens'
          )
        }
      }

      // Guard: deleting a delta is allowed only if it is the last delta of its chain by index
      if (screenDoc.recordingRole === 'delta') {
        const laterDelta = await Models.Screen.findOne({
          storyId,
          recordingRole: 'delta',
          baseScreenId: screenDoc.baseScreenId,
          index: { $gt: screenDoc.index },
        }).lean()
        if (laterDelta) {
          httpError(
            ResponseCodes['409_CONFLICT'],
            'Cannot delete a middle delta; only the last delta of a chain may be deleted'
          )
        }
      }

      return Models.Screen.findOneAndDelete({ _id: screenId })
        .then(() => {

          return Models.Story.findOneAndUpdate({ _id: storyId }, {
              $pull: {
                screens: screenId
              }
            }, { new: true })
            .then(storyDoc => {
              let updateOps = []
              storyDoc.screens.forEach((screen, index) => {

                updateOps.push({
                  updateOne: {
                    filter: { _id: screen._id },
                    update: {
                      index: index,
                    }
                  }
                })
              })


              return Models.Screen.bulkWrite(updateOps)
            })
        })
    })
    .then((updateOpsResult) => {

      if (!updateOpsResult) {
        throw new Error('Screen couldn\'t be deleted')
      }

      const resultResponse = {
        statusCode: ResponseCodes['200_OK'],
        headers: {
          'Access-Control-Max-Age': 600,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({})
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
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept',
            'Access-Control-Allow-Credentials': true,
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
