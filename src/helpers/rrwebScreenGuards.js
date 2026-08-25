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
 * Allows non-rrweb screens (screenshot/video/legacy page) between chain members so
 * Library imports can sit between Page screens. Still requires:
 * - every delta's base present, role base, and index > base
 * - within a chain, base first then deltas in capture (fromTimeMs) order
 */
export function wouldBreakRrwebChainOrder(screens) {
  // screens: array of { _id, index, recordingRole, baseScreenId, fromTimeMs? }
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

  const chains = new Map()
  for (const screen of screens) {
    if (!screen.recordingRole) continue
    const chainId = screen.recordingRole === 'base'
      ? String(screen._id)
      : String(screen.baseScreenId)
    if (!chains.has(chainId)) chains.set(chainId, [])
    chains.get(chainId).push(screen)
  }

  for (const [, members] of chains) {
    members.sort((a, b) => a.index - b.index)
    if (members[0].recordingRole !== 'base') {
      return 'Chain order broken: base must come before its deltas'
    }
    for (let i = 1; i < members.length; i++) {
      if (members[i].recordingRole !== 'delta') {
        return 'Chain order broken: unexpected non-delta after base'
      }
      if (
        members[i - 1].fromTimeMs != null &&
        members[i].fromTimeMs != null &&
        members[i].fromTimeMs < members[i - 1].fromTimeMs
      ) {
        return 'Cannot reorder deltas within an rrweb chain'
      }
    }
  }

  return null
}

export { CORS_HEADERS, ResponseCodes }
