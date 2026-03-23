'use strict'
import {getModels, setupDB} from '../src/models/index.js'
import {default as helpers} from "../src/helpers/livedemoHelpers.js";


module.exports.up = function (next) {

    return migrate()
        .then(() => {
            // next()
        })
}

module.exports.down = function (next) {
    next()
}

module.exports.up()

function migrate() {


    var Models
    var newLiveDemoId
    var fullPath

    return setupDB()
        .then(conn => getModels(conn))
        .then(ModelsResult => {
            Models = ModelsResult

        })
        .then(() => {

            return Models.Session.find({'clientIpData.ip': /,/}).lean()
        })
        .then(async (sessions) => {
            // Get ip info per session

            // sessions = sessions.slice(0, 1)


            let ipInfoPerIp = {}
            let chunkSize = 50
            let chunks = []
            for (let index = 0; index < sessions.length; index+=chunkSize) {
                let chunk = sessions.slice(index, index + chunkSize)
                chunks.push(chunk)
            }


            for (let i = 0; i < chunks.length; i++) {
                let sessionsIpInfo = {}

                for (let index = 0; index < chunks[i].length; index++) {

                    let session = chunks[i][index]
                    let clientIp = session.clientIpData.ip.split(',')[0]

                    let ipInfo
                    if(!ipInfoPerIp[clientIp]) {
                        ipInfo = await helpers.getClientIpData(clientIp)
                        ipInfoPerIp[clientIp] = ipInfo

                        console.log(`${(i * chunkSize) + index} - got ipInfo - ${clientIp}`)

                    } else {
                        ipInfo = ipInfoPerIp[clientIp]
                    }

                    sessionsIpInfo[session._id] = ipInfo
                }


                let updateOps = []

                Object.entries(sessionsIpInfo).forEach(([sessionId, ipInfo]) => {

                    let updateObj = {
                        'clientIpData': ipInfo,
                    }

                    updateOps.push({
                        updateOne: {
                            filter: {_id: sessionId},
                            update: {
                                $set: updateObj,
                            }
                        }
                    })
                })

                await Models.Session.bulkWrite(updateOps, {strict: false})
                    .then(() => {
                        console.log(`${i} - chunk completed - sessions updated`)
                        console.log(` sessions - ${Object.keys(sessionsIpInfo).join(', ')}`)
                    })
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
