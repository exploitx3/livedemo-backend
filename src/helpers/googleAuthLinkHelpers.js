import ENV from '../envServer.js'
import { encodeReturnPathForOAuthState, sanitizeReturnPath } from './sanitizeReturnPath.js'

/** Same URL as `google.auth.OAuth2#generateAuthUrl` for this app's params. */
export function buildGoogleAuthorizeUrl(creds, state) {
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

export function buildGoogleLoginLink(returnTo, browserSessionId) {
  const GoogleCreds = ENV.OAUTH2Credentials?.Google
  if (!GoogleCreds) {
    return null
  }

  const safeReturn =
    returnTo != null && returnTo !== ''
      ? sanitizeReturnPath(typeof returnTo === 'string' ? returnTo : String(returnTo))
      : '/'
  const oauthState = encodeReturnPathForOAuthState(safeReturn, browserSessionId)
  return buildGoogleAuthorizeUrl(GoogleCreds, oauthState)
}
