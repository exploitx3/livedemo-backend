// let test = {
//   'type': 'rich',
//   'version': '1.0',
//   'title': 'LiveDemo | Insider Threat protection from inside',
//   'provider_name': 'LiveDemo',
//   'provider_url': 'https://livedemo.com',
//   'thumbnail_url': 'https://image.mux.com/dsfw3243/thumbnail.png',
//   'html': '<iframe src="http://localhost.mine:3005/workspaces/62255d3d3304f17b8f5e2d03/stories/633734c1ec41453c90a3d45c/preview?step=1" allowfullscreen width="1024" height="1051" title="LiveDemo | Insider Threat protection from inside"></iframe>',
//   'width': 1024,
//   'height': 474
// }
//https://story-api.livedemo.ai/oembed/?url=https://www.gumlet.com/watch/6221db301c8b821b0519fba0

import * as sanitezeLib from '@braintree/sanitize-url'

const sanitize = sanitezeLib.sanitizeUrl

import helpers from '../helpers/livedemoHelpers.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import ScreenTypes from '../constants/ScreenTypes.js'
import ENV from '../envServer.js'

const handler = function (req, res) {
  let { Models, conn } = req.mongo

  // let storyId = req.params.storyId
  let storyId = ""
  let storyUrl = req.query.url ? req.query.url : null

  let referrer = req.query.referrer ? sanitize(req.query.referrer) : ""
  let maxWidth = req.query.max_width || 0
  let maxHeight = req.query.max_height || 0




  return Promise.resolve()
    .then(() => {

      return helpers.validateStoryId(storyUrl)
        .then((storyIdFromUrl) => {

          storyId = storyIdFromUrl
        })
    })
    .then(() => {
      let responseMessage = null

      try {
        maxWidth = parseInt(maxWidth)
      } catch (e) {
        responseMessage = 'Couldn\'t parse max_width'
        maxWidth = 0
      }

      try {
        maxHeight = parseInt(maxHeight)
      } catch (e) {
        responseMessage = 'Couldn\'t parse max_height'
        maxHeight = 0
      }

      if (maxWidth < 280 && maxWidth !== 0) {
        responseMessage = 'Incorrect max_width'
      }

      if (maxHeight < 200 && maxHeight !== 0) {
        responseMessage = 'Incorrect max_height'
      }


      if (responseMessage) {

        let newError = new Error('')
        newError.resultResponse = {
          statusCode: ResponseCodes['501_NOT_IMPLEMENTED'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
            // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
          },
          body: responseMessage
        }

        throw newError
      }

    })
    .then(() => {


      return Models.Story.findOne({
          _id: storyId,
          deletedAt: null,
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
              path: 'steps.view.formId',
              model: 'Form',
            },
            {
              path: 'steps.stepAudioId',
              model: 'Audio',
            }
          ],
          select: '_id name type steps customTransitions imageUrl index imageUrl asset',
          options: { sort: { 'index': 1 } }
        })
        .populate('workspaceId', '_id name')

    })
    .then((foundStory) => {
      let firstScreen = foundStory.screens && foundStory.screens.length && foundStory.screens[0]

      let thumbnailImage = firstScreen.type === ScreenTypes.SCREEN_VIDEO ? `https://image.mux.com/${firstScreen.asset.playback_ids[0].id}/thumbnail.png` : firstScreen.imageUrl

      let oEmbedWidth = maxWidth && maxWidth <= foundStory.tabInfo.width ? maxWidth : foundStory.tabInfo.width
      let oEmbedHeight = maxHeight && maxHeight <= foundStory.tabInfo.height ? maxHeight : foundStory.tabInfo.height


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
      res.send(JSON.stringify(
        {
          'type': 'rich',
          'version': '1.0',
          'title': foundStory.name,
          'provider_name': 'LiveDemo',
          'provider_url': 'https://livedemo.ai',
          'thumbnail_url': thumbnailImage,
          'html': `<iframe src="${ENV.STORIES_API}/workspaces/${foundStory.workspaceId._id}/stories/${foundStory._id}/preview?step=1" allowfullscreen width="${oEmbedWidth}" height="${oEmbedHeight}" title="${foundStory.name}"></iframe>`,
          'width': oEmbedWidth,
          'height': oEmbedHeight,
          'referrer': referrer,
          'cache_age': 60
        }
      ))
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

