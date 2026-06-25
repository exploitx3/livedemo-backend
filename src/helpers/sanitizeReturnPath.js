/**
 * Validates a post-login in-app path (relative URL path + optional query).
 * Used for OAuth state and redirect query params to prevent open redirects.
 */
export function sanitizeReturnPath(path) {
  if (path == null || typeof path !== 'string') {
    return '/'
  }
  const trimmed = path.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '/'
  }
  if (/[\r\n]/.test(trimmed) || trimmed.includes('://')) {
    return '/'
  }
  if (trimmed.length > 2000) {
    return '/'
  }
  if (/^\/(login|register|auth)(\/|\?|$)/.test(trimmed)) {
    return '/'
  }
  return trimmed
}

const MAX_STATE_LEN = 3000

export function encodeReturnPathForOAuthState(path, browserSessionId) {
  const safe = sanitizeReturnPath(path)
  const payload = { returnPath: safe }
  if (browserSessionId && typeof browserSessionId === 'string') {
    payload.browserSessionId = browserSessionId.slice(0, 256)
  }
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

export function decodeReturnPathFromOAuthState(state) {
  if (!state || typeof state !== 'string') {
    return { returnPath: '/' }
  }
  if (state.length > MAX_STATE_LEN) {
    return { returnPath: '/' }
  }
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf8')
    const parsed = JSON.parse(decoded)
    if (parsed && typeof parsed === 'object' && typeof parsed.returnPath === 'string') {
      return {
        returnPath: sanitizeReturnPath(parsed.returnPath),
        browserSessionId: typeof parsed.browserSessionId === 'string' ? parsed.browserSessionId : null
      }
    }
    // Legacy: plain string state
    return { returnPath: sanitizeReturnPath(decoded) }
  } catch {
    return { returnPath: '/' }
  }
}
