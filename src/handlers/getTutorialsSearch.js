import ResponseCodes from '../constants/ResponseCodes.js'
import LambdaRateLimiter from 'lambda-rate-limiter'

const CORS_HEADERS = {
    'Access-Control-Max-Age': 600,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept',
    'Access-Control-Allow-Credentials': true,
}

// 5 requests per second per IP — interval 1000 ms, limit 5
const ipLimiter = LambdaRateLimiter({
    interval: 1000,
    uniqueTokenPerInterval: 2000,
})

const MAX_RESULTS = 8
const FEATURED_LIMIT = 24

const handler = async function (req, res) {
    const { Models } = req.mongo

    // Resolve client IP (support proxies)
    const clientIp =
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.socket?.remoteAddress ||
        'unknown'

    return Promise.resolve()
        .then(() => {
            return ipLimiter.check(5, clientIp)
        })
        .catch(() => {
            const resultResponse = {
                statusCode: ResponseCodes['429_TOO_MANY_REQUESTS'],
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: 'Too many requests' }),
            }
            res.set(resultResponse.headers)
            res.status(resultResponse.statusCode)
            res.send(resultResponse.body)
            // Sentinel to stop the chain
            throw Object.assign(new Error('rate-limited'), { handled: true })
        })
        .then(() => {
            const q = (req.query.q || '').trim()
            const featured = req.query.featured === 'true'

            // ?featured=true — return latest tutorials that have an image
            if (featured) {
                return Models.Tutorial.find(
                    { draft: { $ne: true }, image: { $nin: [null, ''] } },
                    { title: 1, slug: 1, image: 1, category: 1 },
                )
                    .sort({ publishedAt: -1 })
                    .limit(FEATURED_LIMIT)
                    .lean()
            }

            if (q.length < 2) {
                return []
            }

            // Build a case-insensitive regex that requires every word to appear
            const words = q.split(/\s+/).filter(Boolean)
            const regexParts = words.map((w) => `(?=.*${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`)
            const regex = new RegExp(regexParts.join(''), 'i')

            return Models.Tutorial.find(
                { title: regex, draft: { $ne: true } },
                { title: 1, slug: 1, image: 1, category: 1 },
            )
                .sort({ publishedAt: -1 })
                .limit(MAX_RESULTS)
                .lean()
        })
        .then((results) => {
            const resultResponse = {
                statusCode: ResponseCodes['200_OK'],
                headers: CORS_HEADERS,
            }
            res.set(resultResponse.headers)
            res.status(resultResponse.statusCode)
            res.send(JSON.stringify(results))
        })
        .catch((error) => {
            if (error.handled) return

            console.error('[getTutorialsSearch]', error)

            res.set(CORS_HEADERS)
            res.status(ResponseCodes['500_INTERNAL_SERVER_ERROR'])
            res.send(JSON.stringify({ error: 'Internal server error' }))
        })
}

export default handler
