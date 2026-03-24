import ResponseCodes from '../constants/ResponseCodes.js'
import ScreenTypes from '../constants/ScreenTypes.js'
import ENV from '../envServer.js'
import livedemoHelpers from "../helpers/livedemoHelpers.js";
import * as sanitezeLib from '@braintree/sanitize-url'

const sanitize = sanitezeLib.sanitizeUrl

const handler = function (req, res) {
    let {Models, conn} = req.mongo

    let requestBody = null

    let workspaceId = req.params.workspaceId
    let storyId = req.params.storyId
    let authUserDoc = null

    let isEmbed = req.query.embed || req.query.embed === '' || req.query['auto_play']
    let isSessionRecordingDisabled = req.query.sessionDisabled || req.query.sessionDisabled === ''
    let link = req.query.link ? sanitize(req.query.link) : ""

    let stepIndex = 0

    console.log(JSON.stringify(req.headers, null, 2))

    return Promise.resolve().then(async () => {

        // return authReq(req)
    })
        // .then(({ authUser }) => {
        // authUserDoc = authUser

        // let validatedBody = validateBody(req.body, patchScreenValidator)
        // requestBody = validatedBody.value

        // validateUserHasAccessToWorkspace(authUserDoc, workspaceId)
        // })
        .then(async () => {
            stepIndex = req.query.step && parseInt(req.query.step) - 1


            return Models.Story.findOne({
                _id: storyId,
                deletedAt: null
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
                            path: 'steps.view.popup.formId',
                            model: 'Form',
                        },

                        {
                            path: 'steps.stepAudioId',
                            model: 'Audio',
                        }
                    ],
                    select: '_id name steps type customTransitions width height imageUrl index imageUrl asset playbackRate popups zoomSpans startTime endTime playbackRate',
                    options: {sort: {'index': 1}}
                })
                .lean()
        })
        .then(storyDoc => {

            if (link) {
                return Models.Link.findOne({_id: link}).lean()
                    .then(linkDoc => {
                        if (!linkDoc || !linkDoc.variables) {
                            throw new Error('Cannot find link')
                        }

                        storyDoc = livedemoHelpers.processLiveDemoLinkUpdates(storyDoc, linkDoc)

                        return storyDoc
                    })
            } else {

                storyDoc = livedemoHelpers.processLiveDemoLinkUpdates(storyDoc, {variables: storyDoc.custom.variables || []})

                return storyDoc

            }

        })
        .then(async (storyDoc) => {
            let firstScreen = storyDoc.screens && storyDoc.screens.length && storyDoc.screens[0]

            let thumbnailImage = firstScreen.type === ScreenTypes.SCREEN_VIDEO ? `https://image.mux.com/${firstScreen.asset.playback_ids[0].id}/thumbnail.png` : firstScreen.imageUrl

            let htmlString = '<html><head>'

            htmlString += '<link rel="shortcut icon" type="image/png" href="https://livedemo-cdn.s3.amazonaws.com/static/logo-round.png"/>\n' +
                '    <link rel="apple-touch-icon" href="https://livedemo-cdn.s3.amazonaws.com/static/logo-round.png"/>\n' +
                '    <meta name="msapplication-TileImage" content="https://livedemo-cdn.s3.amazonaws.com/static/logo-round.png"/>\n' +
                '    <link rel="alternate" type="application/json+oembed"\n' +
                `          href="${ENV.STORIES_API}/oembed?url=${ENV.STORIES_API}/workspaces/${storyDoc.workspaceId}/stories/${storyDoc._id}/preview"\n` +
                `          title="${storyDoc.name}"/>\n` +
                '    <meta charSet="UTF-8"/>\n' +
                '    <meta name="generator"\n' +
                '          content="Powered by LiveDemo -- Demo the future. Visit us at https://livedemo.ai."/>\n' +
                '    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/>\n' +
                '    <meta name="viewport" content="width=device-width, initial-scale=1"/>\n' +
                '    <meta name="robots" content="max-image-preview:large"/>\n' +
                '    <meta name="author" content="livedemo.ai"/>\n' +
                '    <meta name="copyright" content="LiveDemo"/>\n' +
                '    <meta name="twitter:card" content="player"/>\n' +
                '    <meta name="twitter:site" content="@Live_Demo_Live"/>\n' +
                `    <meta name="twitter:title" content="${storyDoc.name}"/>\n` +
                '    <meta name="twitter:description" content=""/>\n' +
                '    <meta name="twitter:image:alt" content=""/>\n' +
                '    <meta name="twitter:image"\n' +
                `          content="${thumbnailImage}"/>\n` +
                `    <meta name="twitter:player" content="${ENV.STORIES_API}/workspaces/${storyDoc.workspaceId}/stories/${storyDoc._id}/preview?step=1"/>\n` +
                '    <meta name="twitter:player:width" content="480"/>\n' +
                '    <meta name="twitter:player:height" content="242"/>\n' +
                '    <meta property="og:locale" content="en_US"/>\n' +
                '    <meta property="og:site_name" content="LiveDemo"/>\n' +
                `    <meta name="title" property="og:title" content="${storyDoc.name}"/>\n` +
                '    <meta name="description" property="og:description" content=""/>\n' +
                '    <meta name="image" property="og:image"\n' +
                `          content="${thumbnailImage}"/>\n` +
                `    <meta property="og:url" content="${ENV.STORIES_API}/workspaces/${storyDoc.workspaceId}/stories/${storyDoc._id}/preview?step=1"/>\n` +
                '    <meta property="og:image:width" content="480"/>\n' +
                '    <meta property="og:image:height" content="242"/>\n' +
                '    <meta property="og:type" content="article"/>\n' +
                `    <meta property="article:modified_time" content="${storyDoc.updatedAt.toISOString()}"/>\n`

            // htmlString += '<link href="https://fonts.cdnfonts.com/css/gagalin" rel="stylesheet">'

            // htmlString += '<script src="https://cdn.lr-in-prod.com/LogRocket.min.js" crossorigin="anonymous"></script>\n' +
            //   '<script>window.LogRocket && window.LogRocket.init(\'dotxvj/livedemo\', {  mergeIframes: true });</script>\n'

            let screenIds = storyDoc.screens.map(screen => screen._id)
            let transitions = storyDoc.screens.reduce((accum, screen) => {

                if (!screen.customTransitions) {

                    return accum
                }

                accum[screen._id] = screen.customTransitions
                return accum
            }, {})

            let steps = storyDoc.screens.sort((firstScreen, secondScreen) => firstScreen.index - secondScreen.index).reduce((accum, screen) => {

                let screenSteps = []

                if (screen.type === ScreenTypes.SCREEN_PAGE) {
                    screenSteps = screen.steps.map(step => {
                        step.screenId = screen._id
                        step.screenType = screen.type
                        step.screenWidth = screen.width
                        step.screenHeight = screen.height


                        return step
                    })

                    if (!screenSteps.length) {
                        screenSteps.push({
                            screenId: screen._id,
                            screenWidth: screen.width,
                            screenHeight: screen.height,
                            screenType: screen.type
                        })
                    }

                } else if (screen.type === ScreenTypes.SCREEN_SCREENSHOT) {


                    let screenshotSteps = !screen.steps ? [] : screen.steps.map(step => {
                        step.screenId = screen._id
                        step.screenType = screen.type
                        step.screenWidth = screen.width
                        step.screenHeight = screen.height
                        step.imageUrl = screen.imageUrl

                        return step
                    })

                    if (screenshotSteps.length) {

                        screenshotSteps.forEach(stepObj => {

                            screenSteps.push(stepObj)
                        })
                    } else {

                        screenSteps.push({
                            screenId: screen._id,
                            imageUrl: screen.imageUrl,
                            screenType: screen.type
                        })
                    }


                } else if (screen.type === ScreenTypes.SCREEN_VIDEO) {
                    screenSteps.push({
                        _id: 1,
                        screenId: screen._id,
                        screenType: screen.type,
                        asset: screen.asset,
                        playbackRate: screen.playbackRate,
                        startTime: screen.startTime,
                        endTime: screen.endTime,
                        zoomSpans: screen.zoomSpans,
                    })
                } else {

                    screenSteps.push({
                        _id: 1,
                        screenId: screen._id,
                        type: screen.type,
                        zoomSpans: screen.zoomSpans ? screen.zoomSpans : []
                    })
                }


                accum = accum.concat(screenSteps)

                return accum
            }, [])

            steps = steps.map((step, index) => {
                step.index = index
                return step
            })

            if (steps.length !== 0) {

                if (stepIndex > steps[steps.length - 1].index) {

                    stepIndex = steps[steps.length - 1].index
                } else if (stepIndex < steps[0].index) {

                    stepIndex = steps[0].index
                }
            }


            htmlString += '<script>\n' +
                'window.config = {\n' +
                'SCREENS: ' + '[\'' + screenIds.join('\',\'') + '\'],' + '\n' +

                'STEPS: ' + JSON.stringify(steps, null, 2) + '\n,' +
                'TRANSITIONS: ' + JSON.stringify(transitions, null, 2) + '\n,' +
                'workspaceId: "' + storyDoc.workspaceId + '"\n,' +
                'currentStepIndex: ' + stepIndex + '\n,' +
                'storyId: "' + storyDoc._id + '"\n,' +
                'isEmbed:' + !!isEmbed + ',\n' +
                'isSessionRecordingDisabled:' + isSessionRecordingDisabled + ',\n' +
                'storyDemo: ' + JSON.stringify(storyDoc, null, 2) + ',\n' +
                'hasEnded: ' + 'false' + '\n' +

                '}\n' +

                '</script>\n'

            await new Promise(async (resolve, reject) => {

                if (ENV.ENV === 'dev') {

                    htmlString += '\n<script src="http://localhost.mine:8080/injectScript.bundle.js" type="text/javascript"></script>\n'
                    resolve()
                } else {

                    htmlString += '\n<script src="https://livedemo-cdn.s3.us-east-1.amazonaws.com/static/injectScript.bundle.js" type="text/javascript"></script>\n'
                    resolve()

                    // await fsp.readFile('./src/injectScript/injectScript.bundle.js', { encoding: 'utf-8' })
                    //   .then((injectScriptString) => {
                    //
                    //
                    //     htmlString += `<script>\n ${injectScriptString} \n</script>`
                    //     resolve()
                    //   })
                }

                if (!isSessionRecordingDisabled) {
                    htmlString += '\n<link\n' +
                        '  rel="stylesheet"\n' +
                        '  href="https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.css"\n' +
                        '/>\n' +
                        '<script src="https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js"></script>\n'
                }

            })

            htmlString += '</head><body><div id="demoWrapper"></div>'
            htmlString += '<div id="reactInjectTourApp"></div></body><html>'

            return htmlString
        })
        .then((htmlString) => {

            let CSP = `default-src 'self' 'unsafe-eval' 'unsafe-inline' blob:
  https://cdn.jsdelivr.net
  https://stream.mux.com
  ${ENV.STORIES_API} 
  ${ENV.LIVEDEMO_CDN_URL};

connect-src 'self'
  https://cdn.jsdelivr.net
  https://*.mux.com
  http://*.hscollectedforms.net
  https://*.hscollectedforms.net
  http://*.hsforms.com
  https://*.hsforms.com
  ${ENV.INJECT_BUNDLE_HOST} 
  ${ENV.STORIES_API} 
  ${ENV.ENV === 'dev' ? '  ws://localhost.mine:8080\n' +
                '  ws://localhost.mine:3005' : ''} ; 

script-src 'self' 'unsafe-eval' 'unsafe-inline'
  http://localhost.mine:8080
  https://www.google.com
  https://www.gstatic.com
  https://cdn.jsdelivr.net
  ${ENV.INJECT_BUNDLE_HOST} 
  ${ENV.STORIES_API}
  http://*.hscollectedforms.net
  https://*.hscollectedforms.net
  http://*.hsleadflows.net
  https://*.hsleadflows.net
  http://*.hsforms.net
  https://*.hsforms.net
  http://*.hsforms.com
  https://*.hsforms.com
  blob: ;

img-src 'self'
  https://livedemo-cdn.s3.amazonaws.com
  https://*.mux.com
  http://*.hsforms.net
  https://*.hsforms.net
  http://*.hsforms.com
  https://*.hsforms.com
  data:
  *;

font-src 'self'
  https://fonts.googleapis.com
  https://fonts.gstatic.com
  data:;

frame-src 'self'
  blob:
  ${ENV.STORIES_API}
  https://www.google.com
  http://*.hsforms.net
  https://*.hsforms.net
  http://*.hsforms.com
  https://*.hsforms.com;

child-src 'self'
  http://*.hsforms.com
  https://*.hsforms.com
  blob: ;
`

            const normalizedCsp = CSP
                .replace(/\s{2,}/g, ' ')  // collapse indentation
                .replace(/\n/g, ' ')     // remove newlines
                .trim();

            const resultResponse = {
                statusCode: ResponseCodes['200_OK'],
                headers: {
                    'Origin-Agent-Cluster': '?0',
                    'Access-Control-Max-Age': 600,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
                    // Required for CORS support to work
                    'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
                    //     'Content-Security-Policy': `default-src 'self' 'unsafe-eval' 'unsafe-inline' blob: ${ENV.STORIES_API} ${ENV.LIVEDEMO_CDN_URL} https://cdn.jsdelivr.net https://stream.mux.com; ` +
                    //         `connect-src 'self' https://cdn.jsdelivr.net https://*.mux.com https://forms.hubspot.com https://*.hsforms.com https://api.hsforms.com https://hubspot-forms-static-embed.s3.amazonaws.com ${ENV.INJECT_BUNDLE_HOST} ${ENV.STORIES_API} ${ENV.ENV === 'dev' ? 'ws:' : ''} ; ` +
                    //         `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://localhost.mine:8080 http://localhost.mine:8080 https://www.google.com https://www.gstatic.com https://cdn.jsdelivr.net https://js.hsforms.net https://static.cloudflareinsights.com ${ENV.INJECT_BUNDLE_HOST} ${ENV.STORIES_API} blob: ;` +
                    //         `style-src 'self' 'unsafe-inline' https://js.hsforms.net https://cdn.jsdelivr.net; ` +
                    //         `img-src 'self' https://livedemo-cdn.s3.amazonaws.com https://*.mux.com https://forms.hubspot.com 'unsafe-inline' data: *; ` +
                    //         `font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com data: ;` +
                    //         `frame-src 'self' blob: ${ENV.STORIES_API} https://www.google.com https://js.hsforms.net http://js.hsforms.net;`
                    // }
                    // 'Content-Security-Policy': `default-src 'self' 'unsafe-eval' 'unsafe-inline' blob: ${ENV.STORIES_API} ${ENV.LIVEDEMO_CDN_URL} https://cdn.jsdelivr.net https://stream.mux.com; ` +
                    //     `connect-src \'self\' https://cdn.jsdelivr.net https://*.mux.com ${ENV.INJECT_BUNDLE_HOST} ${ENV.STORIES_API} ${ENV.ENV === 'dev' ? 'ws:' : ''} ; ` +
                    //     `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://localhost.mine:8080 http://localhost.mine:8080 https://www.google.com https://www.gstatic.com https://cdn.jsdelivr.net ${ENV.INJECT_BUNDLE_HOST} ${ENV.STORIES_API} blob: ;` +
                    //     'img-src \'self\' https://livedemo-cdn.s3.amazonaws.com https://*.mux.com \'unsafe-inline\' data: *; ' +
                    //     'font-src \'self\' https://fonts.googleapis.com https://fonts.gstatic.com data: ;' +
                    //     `frame-src 'self' blob: ${ENV.STORIES_API} https://www.google.com;`,
                    'Content-Security-Policy': normalizedCsp
                }
            }

            res.set(resultResponse.headers)
            res.status(resultResponse.statusCode)
            res.send(htmlString)
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
                        'Origin-Agent-Cluster': '?0',
                        'Access-Control-Max-Age': 600,
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
                        // Required for CORS support to work
                        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS,
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
