import {default as ENV} from './envServer.js'
import jsdom from 'jsdom'
import express from 'express'
import bodyParser from 'body-parser'
import monq from 'monq'

import path from 'path'

import postScreensHandler from './handlers/postScreens.js'
import postStoriesHandler from './handlers/postStories.js'
import postDesktopStoriesHandler from './handlers/postDesktopStories.js'
import postEmptyStoryHandler from './handlers/postEmptyStory.js'
import postInProgressStoryHandler from './handlers/postInProgressStory.js'
import patchStoryHandler from './handlers/patchStory.js'
import postTransitionsHandler from './handlers/postTransitions.js'
import deleteTransitionHandler from './handlers/deleteTransition.js'
import patchTransitionHandler from './handlers/patchTransition.js'
import getStoriesHandler from './handlers/getStories.js'
import getStoryByIdHandler from './handlers/getStoryById.js'
import postCustomHeaderUploadImageHandler from './handlers/postCustomHeaderUploadImage.js'
import postCustomThemeUploadWatermarkImageHandler from './handlers/postCustomThemeUploadWatermarkImage.js'
import postCustomHeaderHandler from './handlers/postCustomHeader.js'
import postCustomThemeHandler from './handlers/postCustomTheme.js'
import postCustomMiscHandler from './handlers/postCustomMisc.js'
import postCustomVariablesHandler from './handlers/postCustomVariables.js'
import patchCustomVariablesHandler from './handlers/patchCustomVariables.js'
import deleteCustomVariablesHandler from './handlers/deleteCustomVariables.js'
import postScreenEditTextHandler from './handlers/postScreenEditText.js'
import patchScreenHandler from './handlers/patchScreen.js'
import postStoryUpdateScreenOrderHandler from './handlers/postStoryUpdateScreenOrder.js'
import postScreenCopyHandler from './handlers/postScreenCopy.js'
import getScreenPreviewHandler from './handlers/getScreenPreview.js'
import getStoryPreviewHandler from './handlers/getStoryPreview.js'
import postStepsHandler from './handlers/postSteps.js'
import deleteScreenHandler from './handlers/deleteScreen.js'
import deleteStepHandler from './handlers/deleteStep.js'
import deleteStoryHandler from './handlers/deleteStory.js'
import patchStepHandler from './handlers/patchStep.js'
import postFormsHandler from './handlers/postForms.js'
import patchFormHandler from './handlers/patchForm.js'
import postLeadsFormHandler from './handlers/postLeadsForm.js'
import getWorkspaceLibraryHandler from './handlers/getWorkspaceLibrary.js'
import postScreenUploadHandler from './handlers/postScreenUpload.js'
import getPreviewStoryHandler from './handlers/getPreviewStory.js'
import getLiveDemoOEmbedHandler from './handlers/getLiveDemoOEmbed.js'
import postStoryPublishHandler from './handlers/postStoryPublish.js'
import getLiveDemoPreviewHandler from './handlers/getLiveDemoPreview.js'
import postStorySessionEventsHandler from './handlers/postStorySessionEvents.js'
import postStorySessionHandler from './handlers/postStorySession.js'
import getStorySessionEventsHandler from './handlers/getStorySessionEvents.js'
import getWorkspaceSessionsHandler from './handlers/getWorkspaceSessions.js'
import getWorkspaceLeadsHandler from './handlers/getWorkspaceLeads.js'
import patchScreenPopupsHandler from './handlers/patchScreenPopups.js'

import getStorySessionsHandler from './handlers/getStorySessions.js'
import postWorkspaceLibraryUploadScreenshotHandler from './handlers/postWorkspaceLibraryUploadScreenshot.js'
import postWorkspaceLibraryUploadVideoHandler from './handlers/postWorkspaceLibraryUploadVideo.js'
// import postStoryAddScreenHandler from './handlers/postStoryAddScreen.js'
import postStepZoomSpansHandler from './handlers/postStepZoomSpans.js'
import patchStepZoomSpanHandler from './handlers/patchStepZoomSpan.js'
import postZoomSpansHandler from './handlers/postZoomSpans.js'
import patchZoomSpanHandler from './handlers/patchZoomSpan.js'
import deleteStepZoomSpanHandler from './handlers/deleteStepZoomSpan.js'
import deleteZoomSpanHandler from './handlers/deleteZoomSpan.js'

import postStoryAITextHandler from './handlers/postStoryAIText.js'
import postStoryAIVoiceHandler from './handlers/postStoryAIVoice.js'
import postGenerateAIVoiceHandler from './handlers/postGenerateAIVoice.js'

import deleteStepAudioHandler from './handlers/deleteStepAudio.js'
import postStepAudioHandler from './handlers/postStepAudio.js'

import postStepUploadAudioHandler from './handlers/postStepUploadAudio.js'

import postGenerateStoryContentHandler from './handlers/postGenerateStoryContent.js'

import getWorkspaceVoicesHandler from './handlers/getWorkspaceVoices.js'
import getWorkspacesHandler from './handlers/getWorkspaces.js'
import getWorkspaceByIdHandler from './handlers/getWorkspaceById.js'
import postWorkspaceAddUserHandler from './handlers/postWorkspaceAddUser.js'
import patchWorkspaceHandler from './handlers/patchWorkspace.js'
import patchWorkspaceIntegrationsHandler from './handlers/patchWorkspaceIntegrations.js'
import getWorkspaceHubspotFormsHandler from './handlers/getWorkspaceHubspotForms.js'
import postCreateWorkspaceHandler from './handlers/postCreateWorkspace.js'
import getSubscriptionsHandler from './handlers/getSubscriptions.js'
import patchSubscriptionHandler from './handlers/patchSubscription.js'
import getUsersHandler from './handlers/getUsers.js'
import patchUsersHandler from './handlers/patchUsers.js'
import postUsersHandler from './handlers/postUsers.js'
import postPasswordAuthenticateHandler from './handlers/postPasswordAuthenticate.js'
import postTokenAuthenticateHandler from './handlers/postTokenAuthenticate.js'
import postRefreshTokenHandler from './handlers/postRefreshToken.js'
import getUsersCardsHandler from './handlers/getUsersCards.js'
import postForgotPasswordHandler from './handlers/postForgotPassword.js'
import postSendChangePasswordEmailHandler from './handlers/postSendChangePasswordEmail.js'
import postChangePasswordHandler from './handlers/postChangePassword.js'
import getUsersAuthGoogleLinkHandler from './handlers/getUsersAuthGoogleLink.js'
import getUsersAuthGoogleCallbackHandler from './handlers/getUsersAuthGoogleCallback.js'
import postUsersAuthGoogleOneTapHandler from './handlers/postUsersAuthGoogleOneTap.js'
import getIntegrationsHubspotCallbackHandler from './handlers/getIntegrationsHubspotCallback.js'
import postLogoutHandler from './handlers/postLogout.js'
import postCloseAccountHandler from './handlers/postCloseAccount.js'
import deleteWorkspaceHandler from './handlers/deleteWorkspace.js'
import getCardsHandler from './handlers/getCards.js'
import deleteCardHandler from './handlers/deleteCard.js'
import getChargesHandler from './handlers/getCharges.js'
import postWorkspaceRemoveUserHandler from './handlers/postWorkspaceRemoveUser.js'
import postPaymentChargeHandler from './handlers/postPaymentCharge.js'
import postPaymentFreeActivateHandler from './handlers/postPaymentFreeActivate.js'
import postPaymentAfterPaymentHandler from './handlers/postPaymentAfterPayment.js'
import postVerifyPaymentChargeHandler from './handlers/postVerifyPaymentCharge.js'
import postPaymentChargeInternalHandler from './handlers/postPaymentChargeInternal.js'
import postJobFinalizeSubscriptionHandler from './handlers/postJobFinalizeSubscription.js'
import postJobCancelSubscriptionHandler from './handlers/postJobCancelSubscription.js'
import postJobExpireSubscriptionsHandler from './handlers/postJobExpireSubscriptions.js'

import postStoryLinksHandler from './handlers/postStoryLinks.js'

import patchStoryLinkHandler from './handlers/patchStoryLink.js'

import deleteStoryLinkHandler from './handlers/deleteStoryLink.js'

import getStoryLinksHandler from './handlers/getStoryLinks.js'

import postAutoRecordingsHandler from './handlers/postAutoRecordings.js'

import postAutoRecordingsEventsHandler from './handlers/postAutoRecordingsEvents.js'

import postAutoRecordingsCompleteHandler from './handlers/postAutoRecordingsComplete.js'

import getAutoRecordingByIdHandler from './handlers/getAutoRecordingById.js'

import postDemoSuggestionsGenerateLiveDemoHandler from './handlers/postDemoSuggestionsGenerateLiveDemo.js'

import postAuthorizeInstanceHandler from './handlers/postAuthorizeInstance.js'
import postInstanceAuthenticateHandler from './handlers/postInstanceAuthenticate.js'

import multer from 'multer'


import * as fs from 'fs'
// import fsp from 'fs/promises.js'
import {getModels, setupDB} from './models/index.js'

import ResponseCodes from './constants/ResponseCodes.js'
import * as https from 'https'
import * as http from 'http'
import axios from "axios";


// import axios from 'axios'
const privateAuthToken = ENV.PRIVATE_AUTH_TOKEN

const SCREENDOC_ENCODING = 'utf-8'

const options = {
    key: fs.readFileSync('./certs/key.pem'),
    cert: fs.readFileSync('./certs/cert.pem')
}

async function setupWorker() {
    console.log(process.env)

    const client = monq(process.env.DB_URI || 'mongodb://localhost:27017/livedemo_app')

    const conn = await setupDB()
    const Models = getModels(conn)

    const sharedConfig = {
        Models,
        axios
    }
    const processors = await import('./processors/index.js')
    const processorsConfig = processors.default(sharedConfig)


    const worker = client.worker(processorsConfig.allQueueNames, processorsConfig.workerConfig)
    worker.start()

    console.log('Consumer started')

}


const app = express()

let conn = null
let Models = null

function setupMongo(req, res, next) {
    req.mongo = { conn, Models }
    next()
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({limit: '5000mb', extended: true}))
app.options('*', (req, res) => {
    const resultResponse = {
        statusCode: ResponseCodes['200_OK'],
        headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept,X-Requested-With', // Required for CORS support to work
            // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        }
    }

    res.set(resultResponse.headers)
    res.status(resultResponse.statusCode)
    res.send()
})

// Handle health check
app.get('/', (req, res) => {
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
    res.send()
})

function corsMiddleware(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
}

app.post('/stories', [setupMongo, corsMiddleware], postStoriesHandler)
app.post('/desktopStories', [setupMongo, corsMiddleware], postDesktopStoriesHandler)
app.post('/emptyStory', [setupMongo, corsMiddleware], postEmptyStoryHandler)
app.post('/inProgressStory', [setupMongo, corsMiddleware], postInProgressStoryHandler)
app.patch('/workspaces/:workspaceId/stories/:storyId', [setupMongo], patchStoryHandler)
app.get('/livedemos/:storyId', [setupMongo], getLiveDemoPreviewHandler)

app.delete('/workspaces/:workspaceId/stories/:storyId', [setupMongo], deleteStoryHandler)

app.post('/workspaces/:workspaceId/stories/:storyId/screens', [setupMongo], postScreensHandler)


app.post('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/transitions', [setupMongo], postTransitionsHandler)


app.delete('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/transitions/:transitionId', [setupMongo], deleteTransitionHandler)


app.patch('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/transitions/:transitionId', [setupMongo], patchTransitionHandler)


app.get('/workspaces', [setupMongo], getWorkspacesHandler)

app.post('/workspaces', [setupMongo], postCreateWorkspaceHandler)

app.get('/workspaces/:workspaceId', [setupMongo], getWorkspaceByIdHandler)

app.patch('/workspaces/:workspaceId', [setupMongo], patchWorkspaceHandler)

app.patch('/workspaces/:workspaceId/integrations', [setupMongo], patchWorkspaceIntegrationsHandler)

app.get('/workspaces/:workspaceId/hubspot/forms', [setupMongo], getWorkspaceHubspotFormsHandler)

app.delete('/workspaces/:workspaceId', [setupMongo], deleteWorkspaceHandler)

app.post('/workspaces/:workspaceId/addUser', [setupMongo], postWorkspaceAddUserHandler)

app.post('/workspaces/:workspaceId/removeUser', [setupMongo], postWorkspaceRemoveUserHandler)

app.get('/workspaces/:workspaceId/stories', [setupMongo], getStoriesHandler)

app.get('/workspaces/:workspaceId/library', [setupMongo], getWorkspaceLibraryHandler)

app.get('/subscriptions', [setupMongo], getSubscriptionsHandler)

app.patch('/subscriptions/:subscriptionId', [setupMongo], patchSubscriptionHandler)

app.get('/users', [setupMongo], getUsersHandler)

app.post('/users', [setupMongo], postUsersHandler)

app.patch('/users', [setupMongo], patchUsersHandler)

app.post('/users/password-authenticate', [setupMongo], postPasswordAuthenticateHandler)

app.post('/users/token-authenticate', [setupMongo], postTokenAuthenticateHandler)

app.post('/users/refreshToken', [setupMongo], postRefreshTokenHandler)

app.get('/users/cards', [setupMongo], getUsersCardsHandler)

app.post('/users/forgotPassword', [setupMongo], postForgotPasswordHandler)

app.post('/users/sendChangePasswordEmail', [setupMongo], postSendChangePasswordEmailHandler)

app.post('/users/changePassword', [setupMongo], postChangePasswordHandler)

app.get('/users/auth/google-link', getUsersAuthGoogleLinkHandler)

app.get('/users/auth/google-callback', [setupMongo], getUsersAuthGoogleCallbackHandler)

app.post('/users/auth/google-one-tap', [setupMongo], postUsersAuthGoogleOneTapHandler)

app.get('/integrations/hubspot-callback', [setupMongo], getIntegrationsHubspotCallbackHandler)

app.post('/users/logout', [setupMongo], postLogoutHandler)

app.post('/users/closeAccount', [setupMongo], postCloseAccountHandler)

app.get('/cards', [setupMongo], getCardsHandler)

app.delete('/cards/:cardId', [setupMongo], deleteCardHandler)

app.get('/charges', [setupMongo], getChargesHandler)

app.post('/payments/charge', [setupMongo], postPaymentChargeHandler)

app.post('/payments/freeActivate', [setupMongo], postPaymentFreeActivateHandler)

app.post('/payments/afterPayment', [setupMongo], postPaymentAfterPaymentHandler)

app.post('/verifyPaymentCharge', [setupMongo], postVerifyPaymentChargeHandler)

app.post('/payments/chargeInternal', [setupMongo], postPaymentChargeInternalHandler)

app.post('/jobs/finalizeSubscription', [setupMongo], postJobFinalizeSubscriptionHandler)

app.post('/jobs/cancelSubscription', [setupMongo], postJobCancelSubscriptionHandler)

app.post('/jobs/expireSubscriptions', [setupMongo], postJobExpireSubscriptionsHandler)


app.get('/workspaces/:workspaceId/stories/:storyId', [setupMongo], getStoryByIdHandler)

app.get('/workspaces/:workspaceId/stories/:storyId/sessions', [setupMongo], getStorySessionsHandler)

app.get('/workspaces/:workspaceId/sessions', [setupMongo], getWorkspaceSessionsHandler)

app.get('/workspaces/:workspaceId/leads', [setupMongo], getWorkspaceLeadsHandler)

app.post('/workspaces/:workspaceId/stories/:storyId/aiText', [setupMongo], postStoryAITextHandler)

app.post('/workspaces/:workspaceId/stories/:storyId/aiVoice', [setupMongo], postStoryAIVoiceHandler)

app.post('/workspaces/:workspaceId/stories/:storyId/generateAiVoice', [setupMongo], postGenerateAIVoiceHandler)

app.delete('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/steps/:stepId/audios/:audioId', [setupMongo], deleteStepAudioHandler)

app.post('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/steps/:stepId/audios', [setupMongo], postStepAudioHandler)

app.post('/workspaces/:workspaceId/stories/:storyId/generateStoryContent', [setupMongo], postGenerateStoryContentHandler)

app.get('/workspaces/:workspaceId/voices', [setupMongo], getWorkspaceVoicesHandler)

app.post('/authorize-instance', [setupMongo], postAuthorizeInstanceHandler)

app.post('/instance-authenticate', [setupMongo], postInstanceAuthenticateHandler)


// app.get('/gif', [], getGifTestHandler)
//
// function getGifTestHandler(req, res){
//
//   return Promise.resolve()
//       .then(() => {
//
//         const resultResponse = {
//           statusCode: ResponseCodes['200_OK'],
//           headers: {
//             'cross-origin-resource-policy': 'cross-origin',
//             "Content-Type": "image/gif",
//             'Access-Control-Max-Age': 600,
//             'Access-Control-Allow-Origin': '*',
//             'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
//             // Required for CORS support to work
//             'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
//           },
//           body: JSON.stringify({})
//         }
//
//         fs.readFile("/home/exploitx/WebstormProjects/livedemo/tmp/tmp/framesloop.gif", function(err, data){
//         // fs.readFile("/home/exploitx/WebstormProjects/livedemo/tmp/tmp/65790176447bb90a38e47304test4.gif", function(err, data){
//         // fs.readFile("/home/exploitx/WebstormProjects/livedemo/tmp/tmp/65790176447bb90a38e47304test3.gif", function(err, data){
//
//
//
//           res.set(resultResponse.headers)
//           res.status(resultResponse.statusCode)
//           res.send(data)
//         })
//
//
//       })
//       .catch((error) => {
//         console.log(error)
//
//         let resultResponse
//         if (error.resultResponse) {
//
//           resultResponse = error.resultResponse
//         } else {
//
//
//           resultResponse = {
//             statusCode: ResponseCodes['500_INTERNAL_SERVER_ERROR'],
//             headers: {
//               'Access-Control-Max-Age': 600,
//               'Access-Control-Allow-Origin': '*',
//               'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
//               // Required for CORS support to work
//               'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
//             },
//             body: ''
//           }
//
//         }
//
//         res.set(resultResponse.headers)
//         res.status(resultResponse.statusCode)
//         res.send(resultResponse.body)
//       })
//
// }


const uploadImage = multer({
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname)
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg' && ext !== '.svg') {
            return callback(new Error('Only images are allowed'))
        }
        callback(null, true)
    },
})

const uploadAudio = multer({
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname)
        if (!file && (file && file.mimetype !== 'audio/mpeg')) {
            return callback(new Error('Only Audio files are allowed'))
        }
        callback(null, true)
    },
})

const uploadScreen = multer({
    limits: {
        fileSize: 25 * 1024 * 1024,
        files: 1,
    },
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname)
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg' && ext !== '.mp4') {
            return callback(new Error('Only images and videos are allowed - png, jpg, gif and mp4'))
        }
        callback(null, true)
    },
})

app.post('/workspaces/:workspaceId/stories/:storyId/custom/header/uploadImage', [setupMongo, uploadImage.single('headerImage')], postCustomHeaderUploadImageHandler)

app.post('/workspaces/:workspaceId/stories/:storyId/custom/theme/uploadWatermarkImage', [setupMongo, uploadImage.single('watermarkImage')], postCustomThemeUploadWatermarkImageHandler)

app.post('/workspaces/:workspaceId/stories/:storyId/screenUpload', [setupMongo, uploadScreen.single('screenUpload')], postScreenUploadHandler)


app.post('/workspaces/:workspaceId/stories/:storyId/custom/header', [setupMongo], postCustomHeaderHandler)


app.post('/workspaces/:workspaceId/stories/:storyId/custom/theme', [setupMongo], postCustomThemeHandler)


app.post('/workspaces/:workspaceId/stories/:storyId/custom/misc', [setupMongo], postCustomMiscHandler)

app.post('/workspaces/:workspaceId/stories/:storyId/custom/variables', [setupMongo], postCustomVariablesHandler)

app.patch('/workspaces/:workspaceId/stories/:storyId/custom/variables/:varId', [setupMongo], patchCustomVariablesHandler)

app.delete('/workspaces/:workspaceId/stories/:storyId/custom/variables/:varId', [setupMongo], deleteCustomVariablesHandler)


app.post('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/editText', [setupMongo], postScreenEditTextHandler)

app.patch('/workspaces/:workspaceId/stories/:storyId/screens/:screenId', [setupMongo], patchScreenHandler)

app.patch('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/popups', [setupMongo], patchScreenPopupsHandler)

app.post('/workspaces/:workspaceId/stories/:storyId/updateScreenOrder', [setupMongo], postStoryUpdateScreenOrderHandler)


app.post('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/copy', [setupMongo], postScreenCopyHandler)


app.get('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/preview', [setupMongo], getScreenPreviewHandler)

app.get('/workspaces/:workspaceId/stories/:storyId/preview', [setupMongo], getStoryPreviewHandler)

// Step creation
app.post('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/steps', [setupMongo], postStepsHandler)

app.delete('/workspaces/:workspaceId/stories/:storyId/screens/:screenId', [setupMongo], deleteScreenHandler)

app.delete('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/steps/:stepId', [setupMongo], deleteStepHandler)

app.patch('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/steps/:stepId', [setupMongo], patchStepHandler)

app.post('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/steps/:stepId/uploadAudio', [setupMongo, uploadAudio.single('audioFile')], postStepUploadAudioHandler)

app.post('/workspaces/:workspaceId/forms', [setupMongo], postFormsHandler)

app.patch('/workspaces/:workspaceId/forms/:formId', [setupMongo], patchFormHandler)

app.post('/leads/forms/:formId/', [setupMongo], postLeadsFormHandler)

app.get('/preview/:storyId', [setupMongo], getPreviewStoryHandler)

app.get('/oembed', [setupMongo], getLiveDemoOEmbedHandler)

app.post('/workspaces/:workspaceId/stories/:storyId/publish', [setupMongo], postStoryPublishHandler)

app.post('/workspaces/:workspaceId/stories/:storyId/sessions', [setupMongo], postStorySessionHandler)
app.post('/workspaces/:workspaceId/stories/:storyId/sessions/:sessionId/events', [setupMongo], postStorySessionEventsHandler)

app.get('/workspaces/:workspaceId/stories/:storyId/sessions/:sessionId/events', [setupMongo], getStorySessionEventsHandler)

app.post('/workspaces/:workspaceId/library/uploadScreenshot', [setupMongo], postWorkspaceLibraryUploadScreenshotHandler)
app.post('/workspaces/:workspaceId/library/uploadVideo', [setupMongo], postWorkspaceLibraryUploadVideoHandler)

app.post('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/steps/:stepId/zoomSpans', [setupMongo], postStepZoomSpansHandler)
app.patch('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/steps/:stepId/zoomSpans/:zoomSpanId', [setupMongo], patchStepZoomSpanHandler)
app.post('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/zoomSpans', [setupMongo], postZoomSpansHandler)
app.patch('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/zoomSpans/:zoomSpanId', [setupMongo], patchZoomSpanHandler)
app.delete('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/zoomSpans/:zoomSpanId', [setupMongo], deleteZoomSpanHandler)
app.delete('/workspaces/:workspaceId/stories/:storyId/screens/:screenId/steps/:stepId/zoomSpans/:zoomSpanId', [setupMongo], deleteStepZoomSpanHandler)


app.post('/workspaces/:workspaceId/stories/:storyId/links', [setupMongo], postStoryLinksHandler)

app.patch('/workspaces/:workspaceId/stories/:storyId/links/:linkId', [setupMongo], patchStoryLinkHandler)

app.delete('/workspaces/:workspaceId/stories/:storyId/links/:linkId', [setupMongo], deleteStoryLinkHandler)

app.get('/workspaces/:workspaceId/stories/:storyId/links', [setupMongo], getStoryLinksHandler)

app.post('/workspaces/:workspaceId/auto-recordings', [setupMongo], postAutoRecordingsHandler)
app.get('/workspaces/:workspaceId/auto-recordings/:autoRecordingId', [setupMongo], getAutoRecordingByIdHandler)
app.post('/workspaces/:workspaceId/auto-recordings/:autoRecordingId/events', [setupMongo], postAutoRecordingsEventsHandler)
app.post('/workspaces/:workspaceId/auto-recordings/:autoRecordingId/complete', [setupMongo], postAutoRecordingsCompleteHandler)

app.post('/workspaces/:workspaceId/demo-suggestions/:demoSuggestionId/generate-livedemo', [setupMongo], postDemoSuggestionsGenerateLiveDemoHandler)

// app.post('/workspaces/:workspaceId/stories/:storyId/addScreen', [setupMongo], postStoryAddScreenHandler)

console.log(ENV.ENV)
let server
if (ENV.ENV === 'dev1') {
    server = https.createServer(options, app)
} else {
    server = http.createServer(app)
}

async function setup() {
    conn = await setupDB()
    Models = getModels(conn)

    await new Promise((resolve) => {
        const port = 3005
        server.listen(port, () => {
            console.log('Story server started on port ', port)
            resolve()
        })
    })
}


if (ENV.ENABLE_CONSUMER) {
    setupWorker()
}

if (ENV.ENABLE_API) {
    setup()
}

// import io from 'socket.io'(http, {
//   maxHttpBufferSize: 1e8 * 100
// })

