import ResponseCodes from '../constants/ResponseCodes.js'
import ENV from '../envServer.js'
import monq from 'monq'
import LambdaRateLimiter from 'lambda-rate-limiter'
import helpers from '../helpers/livedemoHelpers.js'
import postUrlDemosValidator from '../helpers/validators/urlDemos/postUrlDemosValidator.js'

const CORS_HEADERS = {
    'Access-Control-Max-Age': 600,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept',
    'Access-Control-Allow-Credentials': true,
}

// 3 requests per minute per IP
const ipLimiter = LambdaRateLimiter({
    interval: 60000,
    uniqueTokenPerInterval: 2000,
})

function enqueueProcessUrlDemo(urlDemoId, userId) {
    const client = monq(ENV.DB_URI || 'mongodb://localhost:27017/livedemo_app')
    const queue = client.queue('urlDemos', { collection: 'jobs-monq' })

    const jobData = { urlDemoId }
    if (userId) {
        jobData.userId = userId
    }

    return new Promise((resolve, reject) => {
        queue.enqueue('processUrlDemo', jobData, function (err, job) {
            if (err) {
                return reject(err)
            }
            console.log('Enqueued processUrlDemo:', job.data)
            resolve()
        })
    })
}

async function tryGetAuthUserId(req, Models) {
    try {
        const { authUser } = await helpers.authReq(req, Models)
        return authUser?._id?.toString() || null
    } catch {
        return null
    }
}

const handler = function (req, res) {
    const { Models } = req.mongo

    const clientIp =
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.socket?.remoteAddress ||
        'unknown'

    console.log('[postUrlDemos] Requesting with clientIp: ' + clientIp)

    return Promise.resolve()
        .then(() => {
            return ipLimiter.check(3, clientIp)
        })
        .catch(() => {
            res.set(CORS_HEADERS)
            res.status(ResponseCodes['429_TOO_MANY_REQUESTS'])
            res.send(JSON.stringify({ error: 'Too many requests' }))
            throw Object.assign(new Error('rate-limited'), { handled: true })
        })
        .then(() => tryGetAuthUserId(req, Models))
        .then((userId) => {
            const validated = helpers.validateBody(req.body, postUrlDemosValidator)
            return { url: validated.value.url, userId }
        })
        .then(({ url, userId }) => {
            return Models.UrlDemo.findOne({ url, status: 'completed' })
                .lean()
                .then((existing) => ({ url, existing, userId }))
        })
        .then(({ url, existing, userId }) => {
            if (existing) {
                return existing
            }

            const { browserSessionId } = req.body
            return new Models.UrlDemo({ url, browserSessionId: browserSessionId || '' })
                .save()
                .then((urlDemoDoc) => {

                    return enqueueProcessUrlDemo(urlDemoDoc._id.toString(), userId)
                        .catch((err) => {
                            console.error('Failed to enqueue processUrlDemo:', err)
                        })
                        .then(() => urlDemoDoc)
                })
        })
        .then((urlDemoDoc) => {
            res.set(CORS_HEADERS)
            res.status(ResponseCodes['200_OK'])
            res.send(JSON.stringify(urlDemoDoc))
        })
        .catch((error) => {
            if (error.handled) return

            console.error('[postUrlDemos]', error)

            res.set(CORS_HEADERS)
            res.status(ResponseCodes['500_INTERNAL_SERVER_ERROR'])
            res.send(JSON.stringify({ error: 'Internal server error' }))
        })
}

export default handler
