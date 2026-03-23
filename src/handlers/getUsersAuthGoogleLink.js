import ResponseCodes from '../constants/ResponseCodes.js'
import ENV from '../envServer.js'
import limiter from '../helpers/rateLimiter.js'
import userValidators from '../helpers/validators/userValidators.js'

// Dynamic import for googleapis
let Google = null
let OAuth2 = null

async function getGoogleOAuth2() {
  if (!Google) {
    const googleapis = await import('googleapis')
    Google = googleapis.google
    OAuth2 = Google.auth.OAuth2
  }
  return { Google, OAuth2 }
}

const handler = function (req, res) {
  let { Models, conn } = req.mongo

  return Promise.resolve()
    .then(() => {
      const clientId = req.headers?.clientid || 'publicClient'
      const token = req.headers?.authorization || 'publicClient'

      return limiter(
        clientId,
        token,
        (errorResponse) => {
          let failedRateLimitError = new Error('Rate limit exceeded')
          failedRateLimitError.resultResponse = errorResponse
          throw failedRateLimitError
        }
      )
    })
    .then(async () => {
      const GoogleCreds = ENV.OAUTH2Credentials?.Google

      if (!GoogleCreds) {
        const resultResponse = {
          statusCode: ResponseCodes['500_INTERNAL_SERVER_ERROR'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
            // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
          }
        }

        let error = new Error('Google OAuth not configured')
        error.resultResponse = resultResponse
        throw error
      }

      // Use googleapis library to generate auth URL (matching the source implementation)
      const { OAuth2: OAuth2Class } = await getGoogleOAuth2()
      const oauth2Client = new OAuth2Class(GoogleCreds.client_id, GoogleCreds.client_secret, GoogleCreds.redirect_uris[0])

      const loginLink = oauth2Client.generateAuthUrl({
        client_id: GoogleCreds.client_id,
        redirect_uri: GoogleCreds.redirect_uris[0],
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        scope: GoogleCreds.scopes
      })

      console.log('google link - ' + loginLink)

      const resultResponse = {
        statusCode: ResponseCodes['302_FOUND'],
        headers: {
          "Location": loginLink,
          'Access-Control-Max-Age': 600,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
          // Required for CORS support to work
          'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        }
      }

      res.set(resultResponse.headers)
      res.status(resultResponse.statusCode)
      res.redirect(loginLink)
    })
    .catch((err) => {
      console.log(err)

      // Check for MongoDB duplicate error (matching the source implementation)
      let checkForDuplicateError = userValidators.handleMongoDuplicateError(err)
      if (checkForDuplicateError.error) {
        const resultResponse = {
          statusCode: ResponseCodes['400_BAD_REQUEST'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
            // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
          },
          body: JSON.stringify({
            errors: checkForDuplicateError
          }),
        }

        res.set(resultResponse.headers)
        res.status(resultResponse.statusCode)
        res.send(resultResponse.body)
        return
      }

      // Handle other errors
      let resultResponse
      if (err.resultResponse) {
        resultResponse = err.resultResponse
      } else {
        resultResponse = {
          statusCode: ResponseCodes['500_INTERNAL_SERVER_ERROR'],
          headers: {
            'Access-Control-Max-Age': 600,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept', // Required for CORS support to work
            // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
          }
        }
      }

      res.set(resultResponse.headers)
      res.status(resultResponse.statusCode)
      res.send(resultResponse.body || '')
    })
}

export default handler
