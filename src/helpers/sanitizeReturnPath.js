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

export function encodeReturnPathForOAuthState(path) {
  const safe = sanitizeReturnPath(path)
  return Buffer.from(safe, 'utf8').toString('base64url')
}

export function decodeReturnPathFromOAuthState(state) {
  if (!state || typeof state !== 'string') {
    return '/'
  }
  if (state.length > MAX_STATE_LEN) {
    return '/'
  }
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf8')
    return sanitizeReturnPath(decoded)
  } catch {
    return '/'
  }
}
