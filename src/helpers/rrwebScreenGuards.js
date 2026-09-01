import ResponseCodes from '../constants/ResponseCodes.js'

const CORS_HEADERS = {
  'Access-Control-Max-Age': 600,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept',
  'Access-Control-Allow-Credentials': true,
}

export function httpError(statusCode, message) {
  const error = new Error(message)
  error.resultResponse = {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message }),
  }
  throw error
}

/**
 * Returns a reason string when proposed order would break an rrweb chain, else null.
 *
 * The only ordering rule: a delta must sit somewhere after its base. Deltas may be
 * reordered among themselves, and any other screen (screenshot/video/other base)
 * may sit before, after, or between chain members.
 */
export function wouldBreakRrwebChainOrder(screens) {
  // screens: array of { _id, index, recordingRole, baseScreenId }
  const byId = new Map(screens.map((s) => [String(s._id), s]))

  for (const screen of screens) {
    if (screen.recordingRole !== 'delta' || !screen.baseScreenId) {
      continue
    }
    const base = byId.get(String(screen.baseScreenId))
    if (!base) {
      return 'Delta references a missing base screen'
    }
    if (base.recordingRole !== 'base') {
      return 'Delta baseScreenId must resolve to a base screen'
    }
    if (screen.index <= base.index) {
      return 'A delta screen cannot precede its base screen'
    }
  }

  return null
}

export { CORS_HEADERS, ResponseCodes }
