import helpers from '../helpers/livedemoHelpers.js'
import postStoriesValidator from '../helpers/validators/stories/postInProgressStoryValidator.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import StoryStatuses from '../constants/StoryStatuses.js'
// const {STORY_REQUESTS_FOLDER} = ENV
import pkg from 'mongodb';
const { ObjectId } = pkg;


const handler = function (req, res) {
    let {Models, conn} = req.mongo

    let requestBody = req.body
    let authUserDoc = null

    return Promise.resolve().then(async () => {

        return helpers.authReq(req, Models)
    })
        .then(({authUser}) => {
            authUserDoc = authUser
            let validatedBody = helpers.validateBody(req.body, postStoriesValidator)
            requestBody = validatedBody.value

            helpers.validateUserHasAccessToWorkspace(authUserDoc, requestBody.workspaceId)
        }).then(() => {

            return new Models.Story({
                name: requestBody.name,
                workspaceId: requestBody.workspaceId,
                userId: authUserDoc.id,
                status: StoryStatuses.UPLOADING,
                screens: [],
            }).save()
        })
        .then((newStory) => {
            console.log('Story created')

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
                _id: newStory._id
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
                    body: ''
                }

            }

            res.set(resultResponse.headers)
            res.status(resultResponse.statusCode)
            res.send(resultResponse.body)
        })
}


export default handler
