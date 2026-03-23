'use strict'
import {getModels, setupDB} from '../src/models/index.js'
import he from 'he'

let text = {
    "targetHTML": "<html lang=\"en\" class=\"light\" style=\"color-scheme: light;\"><merlin-component id=\"merlin-text-summarizer\" class=\"merlin text-summarizer\"></merlin-component><merlin-component id=\"merlin-context-btn\" class=\"merlin context-btn\"></merlin-component><merlin-component id=\"merlin-iframechat\" class=\"merlin iframechat\"></merlin-component><head><link rel=\"preload\" href=\"/_next/static/media/a34f9d1faa5f3315-s.p.woff2\" as=\"font\" crossorigin=\"\" type=\"font/woff2\"><link rel=\"stylesheet\" href=\"/_next/static/css/7e737e76cd77c183.css\" crossorigin=\"\" data-precedence=\"next\"><link rel=\"preload\" as=\"script\" fetchpriority=\"low\" href=\"/_next/static/chunks/webpack-48477dcd768a4a17.js\" crossorigin=\"\"><script src=\"/_next/static/chunks/fd9d1056-5dd3b8c50e71368c.js\" async=\"\" crossorigin=\"\"></script><script src=\"/_next/static/chunks/69-917dfe739e254659.js\" async=\"\" crossorigin=\"\"></script><script src=\"/_next/static/chunks/main-app-a91ab301754ae529.js\" async=\"\" crossorigin=\"\"></script><script src=\"/_next/static/chunks",
}

let newText = he.encode(text.targetHTML)

module.exports.up = function (next) {

    return migrateProcessScreens()
        .then(() => {
            // next()
        })
}

module.exports.down = function (next) {
    next()
}

module.exports.up()

function migrateProcessScreens() {


    var Models
    var newLiveDemoId
    var fullPath

    return setupDB()
        .then(conn => getModels(conn))
        .then(ModelsResult => {
            Models = ModelsResult

        })
        .then(() => {

            return Models.Screen.find({
                $and: [
                    {"steps": {$not: {$size: 0}}},
                    {
                        "steps": {
                            $elemMatch: {
                                "elementData.targetHTML": {$exists: true, $ne: ''}
                            }
                        }

                    }]
            }).lean()
        })
        .then(async (screens) => {
            // Get ip info per session

            // sessions = sessions.slice(0, 1)


            let chunkSize = 50
            let chunks = []
            for (let index = 0; index < screens.length; index += chunkSize) {
                let chunk = screens.slice(index, index + chunkSize)
                chunks.push(chunk)
            }


            for (let i = 0; i < chunks.length; i++) {
                let updateOps = []

                for (let index = 0; index < chunks[i].length; index++) {

                    let screen = chunks[i][index]

                    let newSteps = JSON.parse(JSON.stringify(screen.steps))
                    newSteps = newSteps.map(step => {
                        let newStep = {...step}
                        if (newStep.elementData && newStep.elementData.targetHTML) {
                            newStep.elementData.targetHTML = he.encode(newStep.elementData.targetHTML)
                        }

                        return newStep
                    })
                    updateOps.push({
                        updateOne: {
                            filter: {_id: screen._id},
                            update: {
                                $set: {
                                    "steps": newSteps
                                }
                            },
                        }
                    })


                    await Models.Screen.bulkWrite(updateOps, {strict: false})
                        .then(() => {
                            console.log(`${i} - chunk completed - sessions updated`)
                            console.log(` screens - ${Object.keys(chunks).join(', ')}`)
                        })
                }
            }
        })
        .then((result) => {
            console.log(result)
            console.log('docs updated')
        })

        .catch(err => {

            console.log(err)

        })

}


function migrateProcessStoriesCaptureEvents() {


    var Models
    var newLiveDemoId
    var fullPath

    return setupDB()
        .then(conn => getModels(conn))
        .then(ModelsResult => {
            Models = ModelsResult

        })
        .then(() => {

            return Models.Story.find({
                $and:
                    [
                        {
                            "capturedEvents": {$exists: true}
                        },
                        {
                            "capturedEvents": {
                                $elemMatch: {
                                    "targetHTML": { $exists: true, $ne: '' }
                                }
                            }
                        }
                    ]
            }).lean()
        })
        .then(async (stories) => {
            // Get ip info per session

            // sessions = sessions.slice(0, 1)


            let chunkSize = 50
            let chunks = []
            for (let index = 0; index < stories.length; index += chunkSize) {
                let chunk = stories.slice(index, index + chunkSize)
                chunks.push(chunk)
            }


            for (let i = 0; i < chunks.length; i++) {
                let updateOps = []

                for (let index = 0; index < chunks[i].length; index++) {

                    let story = chunks[i][index]

                    let newCapturedEvents = JSON.parse(JSON.stringify(story.capturedEvents))
                    newCapturedEvents = newCapturedEvents.map(event => {
                        let newEvent = {...event}
                        if (newEvent.targetHTML) {
                            newEvent.targetHTML = he.encode(newEvent.targetHTML)
                        }

                        return newEvent
                    })
                    updateOps.push({
                        updateOne: {
                            filter: {_id: story._id},
                            update: {
                                $set: {
                                    "capturedEvents": newCapturedEvents
                                }
                            },
                        }
                    })


                    await Models.Story.bulkWrite(updateOps, {strict: false})
                        .then(() => {
                            console.log(`${i} - chunk completed - sessions updated`)
                            console.log(` stories - ${Object.keys(chunks).join(', ')}`)
                        })
                }
            }
        })
        .then((result) => {
            console.log(result)
            console.log('docs updated')
        })

        .catch(err => {

            console.log(err)

        })

}
