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
 * Returns true when proposedIndexes (map of screenId -> new index) would break
 * an rrweb chain: a delta must keep index > its base, and relative order within
 * a chain must be preserved.
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

  // Relative order within each chain must be preserved vs original capture order
  // (index order among base + its deltas). We only validate the proposed absolute
  // indices already encode a consistent chain order: sorted by index, each chain
  // appears as contiguous increasing sequence relative to capture order.
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
    // base must be first
    if (members[0].recordingRole !== 'base') {
      return 'Chain order broken: base must come before its deltas'
    }
    // no interleaving: indices must be strictly increasing (already sorted);
    // also ensure deltas keep their relative capture order via fromTimeMs if present
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
      // also reject if previous index jumped such that another chain's screen sits between —
      // checked globally below by ensuring chain members are contiguous in the full sorted list
    }
  }

  // Contiguity: for each chain, members must occupy consecutive positions in the
  // global index-sorted list (whole chain may move as a block).
  const sorted = [...screens].sort((a, b) => a.index - b.index)
  for (const [, members] of chains) {
    const memberIds = new Set(members.map((m) => String(m._id)))
    const positions = sorted
      .map((s, i) => (memberIds.has(String(s._id)) ? i : -1))
      .filter((i) => i >= 0)
    for (let i = 1; i < positions.length; i++) {
      if (positions[i] !== positions[i - 1] + 1) {
        return 'rrweb chain screens must move as a contiguous block'
      }
    }
  }

  return null
}

export { CORS_HEADERS, ResponseCodes }
