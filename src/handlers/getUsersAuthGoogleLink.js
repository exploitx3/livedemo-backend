import ResponseCodes from '../constants/ResponseCodes.js'
import ENV from '../envServer.js'
import limiter from '../helpers/rateLimiter.js'
import { encodeReturnPathForOAuthState, sanitizeReturnPath } from '../helpers/sanitizeReturnPath.js'

function corsHeaders() {
  return {
    'Access-Control-Max-Age': 600,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept',
    'Access-Control-Allow-Credentials': true
  }
}

/** Same URL as `google.auth.OAuth2#generateAuthUrl` for this app’s params — avoids loading googleapis. */
function buildGoogleAuthorizeUrl(creds, state) {
  const redirectUri = creds.redirect_uris?.[0] ?? ''
  const scope = Array.isArray(creds.scopes) ? creds.scopes.join(' ') : creds.scopes ?? ''
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  u.searchParams.set('client_id', creds.client_id)
  u.searchParams.set('redirect_uri', redirectUri)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('scope', scope)
  u.searchParams.set('access_type', 'offline')
  u.searchParams.set('prompt', 'consent')
  u.searchParams.set('state', state)
  return u.toString()
}

const handler = function (req, res) {
  return Promise.resolve()
    .then(() => {
      const clientId = req.headers?.clientid || 'publicClient'
      const token = req.headers?.authorization || 'publicClient'

      return limiter(
        clientId,
        token,
        (errorResponse) => {
          const failedRateLimitError = new Error('Rate limit exceeded')
          failedRateLimitError.resultResponse = errorResponse
          throw failedRateLimitError
        }
      )
    })
    .then(() => {
      const GoogleCreds = ENV.OAUTH2Credentials?.Google

      if (!GoogleCreds) {
        const error = new Error('Google OAuth not configured')
        error.resultResponse = {
          statusCode: ResponseCodes['500_INTERNAL_SERVER_ERROR'],
          headers: corsHeaders()
        }
        throw error
      }

      const rawReturnTo = req.query.returnTo
      const safeReturn =
        rawReturnTo != null && rawReturnTo !== ''
          ? sanitizeReturnPath(typeof rawReturnTo === 'string' ? rawReturnTo : String(rawReturnTo))
          : '/'
      const oauthState = encodeReturnPathForOAuthState(safeReturn)
      const loginLink = buildGoogleAuthorizeUrl(GoogleCreds, oauthState)

      const resultResponse = {
        statusCode: ResponseCodes['302_FOUND'],
        headers: {
          ...corsHeaders(),
          Location: loginLink
        }
      }

      res.set(resultResponse.headers)
      res.status(resultResponse.statusCode)
      res.redirect(loginLink)
    })
    .catch((err) => {
      console.log(err)

      let resultResponse
      if (err.resultResponse) {
        resultResponse = err.resultResponse
      } else {
        resultResponse = {
          statusCode: ResponseCodes['500_INTERNAL_SERVER_ERROR'],
          headers: corsHeaders()
        }
      }

      res.set(resultResponse.headers)
      res.status(resultResponse.statusCode)
      res.send(resultResponse.body || '')
    })
}

export default handler
