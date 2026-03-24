import helpers from '../helpers/livedemoHelpers.js'
import postStepZoomSpansValidator
    from '../helpers/validators/stories/screens/steps/zoomSpans/postStepZoomSpansValidator.js'
import ResponseCodes from '../constants/ResponseCodes.js'

import pkg from 'mongodb';
const { ObjectId } = pkg;

const handler = function (req, res) {
    let {Models, conn} = req.mongo


    let requestBody = null

    let workspaceId = req.params.workspaceId
    // let storyId = req.params.storyId
    let screenId = req.params.screenId
    let stepId = req.params.stepId
    let authUserDoc = null

    return Promise.resolve().then(async () => {

        return helpers.authReq(req, Models)
    })
        .then(({authUser}) => {
            authUserDoc = authUser

            let validatedBody = helpers.validateBody(req.body, postStepZoomSpansValidator)
            requestBody = validatedBody.value

            helpers.validateUserHasAccessToWorkspace(authUserDoc, workspaceId)
        })
        .then(() => {
            return Models.Screen.findById(screenId)
        })
        .then((screenDoc) => {
            const {delay, duration, width, height, editorWidth, editorHeight, offsetX, offsetY} = requestBody

            return new Models.ZoomSpanScreenshot({
                delay,
                duration,
                width,
                height,
                editorWidth,
                editorHeight,
                offsetX,
                offsetY
            }).save()
                .then((newZoomSpanScreenshotDoc) => {

                    return Models.Screen_Screenshot.findOneAndUpdate({
                        _id: new ObjectId(screenDoc._id),
                        'steps._id': new ObjectId(stepId)
                    }, {
                        $set: {
                            "steps.$.zoomSpan": newZoomSpanScreenshotDoc
                        }
                    }, {new: true})
                        .then((result) => {

                            return newZoomSpanScreenshotDoc
                        })
                })
        })
        .then((newZoomSpanDoc) => {

            if (!newZoomSpanDoc) {
                throw new Error('ZoomSpan couldn\'t be created')
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
                body: JSON.stringify(newZoomSpanDoc)
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

export default handler
