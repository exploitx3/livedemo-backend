import helpers from '../helpers/livedemoHelpers.js'
import ResponseCodes from '../constants/ResponseCodes.js'

import ENV from '../envServer.js'
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import fsp from 'fs/promises'

const {STORY_REQUESTS_FOLDER} = ENV


const SCREENDOC_ENCODING = 'utf-8'

const handler = function (req, res) {
    let {Models, conn} = req.mongo

    let requestBody = null

    let workspaceId = req.params.workspaceId
    let storyId = req.params.storyId
    let screenId = req.params.screenId
    var storyDocGlobal = null
    let authUserDoc = null

    return Promise.resolve().then(async () => {

        return helpers.authReq(req, Models)
    })
        .then(({authUser}) => {
            authUserDoc = authUser


            helpers.validateUserHasAccessToWorkspace(authUserDoc, workspaceId)
        })
        .then(async () => {


            return Models.Story.findOne({_id: storyId, workspaceId: workspaceId})
                .then((storyDoc) => {
                    storyDocGlobal = storyDoc
                    return Models.Screen.findOne({_id: screenId}).lean()
                        .then((screenDoc) => {
                            return {
                                screenDoc: screenDoc,
                            }
                        })
                })
        })
        .then(({screenDoc}) => {
            let promiseArray = []
            let firstIndexToMove = screenDoc.index + 1
            for (let i = firstIndexToMove; i < storyDocGlobal.screens.length; i++) {

                let promise = Models.Screen.findOneAndUpdate({_id: storyDocGlobal.screens[i]._id}, {
                    $inc:{index: 1}
                })
                promiseArray.push(promise)
            }

            return Promise.all(promiseArray)
                .then((promiseResults) => {
                    return {screenDoc, nextIndex: ++screenDoc.index}
                })
        })
        .then(async ({screenDoc, nextIndex}) => {

            let newScreenId = new ObjectId()

            let storyDir = `${ENV.STORIES_FOLDER}/${storyId}`
            let newScreenDir = `${storyDir}/${newScreenId}.html`

            if (screenDoc.type === 'Screen_Page') {

                return fsp.readFile(screenDoc.contentPath, {encoding: SCREENDOC_ENCODING})

                    .then((contentString) => {
                        return fsp.writeFile(newScreenDir, contentString)
                    })
                    .then(() => {

                        return new Models.Screen({
                            ...screenDoc,
                            _id: newScreenId,
                            index: nextIndex,
                            storyId: storyId,
                            contentPath: newScreenDir,
                        })
                            .save()
                    })
                    .then((newScreenDoc) => {
                        return Models.Story.findOneAndUpdate({_id: storyId}, {
                            $push: {
                                screens: newScreenId
                            }
                        })
                            .then(() => {
                                let pushPath = 'library.pages'

                                return Models.Workspace.findOneAndUpdate({_id: workspaceId}, {
                                    $addToSet: {[pushPath]: newScreenId}
                                })
                            })
                            .then(() => {
                                return newScreenDoc
                            })
                    })
            } else {

                let newTransitions = screenDoc.customTransitions.map(transition => {
                    delete transition._id
                })

                let initPromise = Promise.resolve([])

                if (newTransitions.length !== 0) {

                    initPromise = initPromise.then(() => Models.ScreenScreenshotTransition.insertMany(newTransitions))
                }


                return initPromise.then((newTransitionDocs) => {
                    screenDoc.customTrasitions = newTransitionDocs
                    screenDoc.storyId = storyId
                    screenDoc.index = nextIndex

                    return new Models.Screen({
                        ...screenDoc,
                        _id: newScreenId,
                        index: nextIndex,
                    }).save()
                })
                    .then((newScreenDoc) => {
                        return Models.Story.findOneAndUpdate({_id: storyId}, {
                            $push: {
                                screens: newScreenId
                            }
                        })
                            .then(() => {
                                let pushPath = screenDoc.type === 'Screen_Screenshot' ? 'library.screenshots' : 'library.videos'

                                return Models.Workspace.findOneAndUpdate({_id: workspaceId}, {
                                    $addToSet: {[pushPath]: newScreenId}
                                })
                            })
                            .then(() => {
                                return newScreenDoc
                            })
                    })
            }
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
            res.send(JSON.stringify(screenDoc))
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
