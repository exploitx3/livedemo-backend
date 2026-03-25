import helpers from '../helpers/livedemoHelpers.js'
import patchScreenValidator from '../helpers/validators/stories/screens/patchScreenValidator.js'
import ResponseCodes from '../constants/ResponseCodes.js'

import ENV from '../envServer.js'
const { STORY_REQUESTS_FOLDER } = ENV
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;


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

      let validatedBody = helpers.validateBody(req.body, patchScreenValidator)
      requestBody = validatedBody.value

      helpers.validateUserHasAccessToWorkspace(authUserDoc, workspaceId)
    })
    .then(async () => {
      let index = requestBody.index
      let name = requestBody.name
      let startTime = requestBody.startTime
      let endTime = requestBody.endTime
      let playbackRate = requestBody.playbackRate

      let updateObj = {}

      if(startTime  || startTime  === 0) {
        updateObj.startTime  = startTime
      }

      if(endTime  || endTime  === 0) {
        updateObj.endTime  = endTime
      }

      if(playbackRate) {
        updateObj.playbackRate  = playbackRate
      }

      if(index || index === 0) {
        updateObj.index = index
      }

      if(name || name === '') {
        updateObj.name = name
      }

      return Models.Screen.db.collection('screens').findOneAndUpdate({ _id: new ObjectId(screenId) },  { $set: updateObj }, {
        returnDocument: 'after'
      })
    })
    .then((screenDoc) => {

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
      res.send(JSON.stringify(screenDoc.value))
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
