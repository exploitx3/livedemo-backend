import fsp from 'fs/promises'
import ENV_VARS from '../envServer.js'
import StoryStatuses from '../constants/StoryStatuses.js'
import ScreenTypes from '../constants/ScreenTypes.js'
import pkg from 'mongodb'
const {ObjectId} = pkg
import flixHelpers from '../helpers/flixHelpers.js'
import he from 'he'

async function processStoryDemo(sharedConfig, params, callback) {
    const {Models, axios} = sharedConfig
    const {storyDemoId} = params

    console.log(`Started - processStoryDemo - ${storyDemoId}`)

    return Models.Story.findOne({_id: storyDemoId})
        .lean()
        .then((storyDemoDoc) => {

            // Allow re-proccessing of StoryDemos if the job is queued again,
            // but it does result in old screens being left-out without StoryDemo
            // if (storyDemoDoc.status !== StoryStatuses.UPLOADING || !storyDemoDoc.filePath) {
            if (!storyDemoDoc.filePath) {
                throw new Error(`Cannot process storyDemo either has incorrect status - ${storyDemoDoc.status} or missing filePath - ${storyDemoDoc.filePath}`)
            } else {

                return fsp.readFile(storyDemoDoc.filePath, {encoding: 'utf8'})
                    .then((storyDemoJsonString) => {
                        return {
                            storyDemoDoc,
                            requestBody: JSON.parse(storyDemoJsonString)
                        }
                    })
            }

        })
        .then(({storyDemoDoc, requestBody}) => {
            let name = storyDemoDoc.name
            let workspaceId = storyDemoDoc.workspaceId

            let capturedEvents = storyDemoDoc.capturedEvents
            let videoStartMs = storyDemoDoc.videoStartMs
            let videoEndMs = storyDemoDoc.videoEndMs
            let renderEvents = {}

            let videoAssetId = ''

            let storyId = storyDemoDoc._id.toString(16)

            let screenshots = {}
            let videos = {}

            // renderEvents = flixHelpers.getRenderEvents(capturedEvents, videoStartMs, videoEndMs, screenshots)

            return flixHelpers.uploadMuxVideo(requestBody.videoBase64)
                .then((videoUploadRes) => {
                    
                    // console.log(videoUploadRes)
                    videoAssetId = videoUploadRes.id

                    let videoDurationInSeconds = videoUploadRes.tracks[0].duration ?? videoUploadRes.duration
                    videoEndMs = videoStartMs + (videoDurationInSeconds * 1000)
                    // let differenceBetweenNewAndOldVideoEndMs = newVideoEndMs - videoEndMs
                    // if(differenceBetweenNewAndOldVideoEndMs !== 0) {
                    //     videoEndMs = newVideoEndMs
                    //
                    //     for(let i = 0; i < capturedEvents.length; i++) {
                    //         let event = capturedEvents[i]
                    //         event.timeMs = event.timeMs + differenceBetweenNewAndOldVideoEndMs
                    //     }
                    // }
                    return Promise.all(Object.entries(requestBody.screenshots).map(function ([key, value]) {
                            return flixHelpers.uploadImage(value, storyId + '/' + key)
                                .then(res => {
                                    let imgObj = {}
                                    imgObj.name = key
                                    imgObj.imageUrl = res.Location

                                    return imgObj
                                })
                        })
                    )
                })
                .then(imageUploadResults => {

                    let imgsObj = imageUploadResults.reduce(function (accum, imgObj) {
                        accum[imgObj.name] = imgObj
                        return accum
                    }, {})

                    // console.log(imageUploadResults)
                    // console.log(imgsObj)

                    screenshots = imgsObj
                })
                .then(() => {

                    renderEvents = flixHelpers.getRenderEvents(capturedEvents, videoStartMs, videoEndMs, screenshots)

                    return flixHelpers.createMuxClips(videoAssetId, renderEvents)
                        .then((assets) => {

                            console.log(assets)
                            videos = assets.reduce((accum, asset) => {
                                accum[asset.videoId] = asset

                                return accum
                            }, {})
                        })
                })
                .then(() => {
                    let screenScreenshots = []
                    let screenVideos = []

                    for (let i = 0; i < renderEvents.length; i++) {
                        let event = renderEvents[i]
                        let screenIndex = i

                        if (event.type === 'video') {

                            screenVideos.push({
                                asset: videos[event.videoId],

                                index: screenIndex,
                                workspaceId,
                                userId: storyDemoDoc.userId,
                                storyId,
                                type: ScreenTypes.SCREEN_VIDEO,
                                steps: [
                                    {
                                        index: 0,
                                        view: {
                                            viewType: 'none',
                                        }
                                    }
                                ]
                            })
                        }

                        if ((event.type === 'image' && screenshots[event.imageId]) &&
                            (event.frameX !== 0 && event.frameY !== 0)
                        ) {
                            let steps = []

                            if (event.frameX) {

                                let contentText = event.targetText ? `<p>Click on ${event.targetText}</p>` : `<p>Click here</p>`

                                steps.push({
                                    index: 0,
                                    view: {
                                        hotspot: {
                                            frameX: event.frameX,
                                            frameY: event.frameY,
                                        },
                                        type: 'hotspot',
                                        content: contentText,
                                    },
                                    elementData: {
                                        // targetHTML: event.targetHTML,
                                        targetHTML: he.encode(event.targetHTML),
                                        targetElementType: event.targetElementType,
                                        targetText: event.targetText
                                    }
                                })
                            }

                            screenScreenshots.push({
                                imageUrl: screenshots[event.imageId].imageUrl,
                                steps: steps,


                                index: screenIndex,
                                workspaceId,
                                userId: storyDemoDoc.userId,
                                storyId,
                                type: ScreenTypes.SCREEN_SCREENSHOT,
                            })
                        }

                    }

                    return Promise.all([
                        Models.Screen_Screenshot.insertMany(screenScreenshots),
                        Models.Screen_Video.insertMany(screenVideos)
                    ])
                })
                .then(([screenShotResults, videoResults]) => {
                    let screensArr = screenShotResults.concat(videoResults).sort((first, second) => first.index - second.index)

                    return Models.Story.findOneAndUpdate({_id: storyId}, {
                            $set: {
                                screens: screensArr,
                                status: StoryStatuses.READY,
                                videoEndMs: videoEndMs,
                            }
                        },
                        {new: true})
                        .then((newStoryDoc) => {

                            return Models.Workspace.findOneAndUpdate({_id: workspaceId}, {
                                $addToSet: {
                                    'library.screenshots': {$each: screenShotResults},
                                    'library.videos': {$each: videoResults}
                                }
                            })
                                .then(() => {
                                    return newStoryDoc
                                })
                        })
                })


        })
        .then(() => {
            console.log('processStoryDemo completed - end')
            callback(null, {storyDemoId})
        })
        .catch(err => {
            console.log('processStoryDemo failed - end')
            console.log(err)

            let endPromise = Promise.resolve()

            endPromise = endPromise.then(() => {

                return Models.Story.findOneAndUpdate({_id: storyDemoId}, {
                    $set: {
                        status: StoryStatuses.FAILED
                    }
                })
            })

            return endPromise.then(() => {

                callback(err)
            })
        })


}


const config = {
    queueNames: ['storyDemos'],
    jobNames: ['processStoryDemo'],
    handler: processStoryDemo
}

export default config
