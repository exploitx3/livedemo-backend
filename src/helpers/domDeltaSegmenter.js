/**
 * Click-boundary segmentation for rrweb event streams (offline, after full capture).
 *
 * Base  = Meta + FullSnapshot (chain start / hard navigation)
 * Delta = one screen per click. Events are cumulative from the start of the
 *         post-base stream through the last event just before the next click.
 *
 * Click boundaries come from:
 *   1) clickMarkers (chrome clickThumbnails — preferred; survives event-batch loss)
 *   2) rrweb MouseInteraction Click / MouseDown events in the stream
 */

const IncrementalSource = {
  Mutation: 0,
  MouseInteraction: 2,
  Scroll: 3,
  Input: 5,
}

const MouseInteractions = {
  MouseDown: 1,
  Click: 2,
}

// MouseDown→Click gaps are often ~50–120ms; keep one marker per press.
const MARKER_DEDUP_MS = 200

export function isClick(event) {
  return (
    event &&
    event.type === 3 &&
    event.data &&
    event.data.source === IncrementalSource.MouseInteraction &&
    event.data.type === MouseInteractions.Click
  )
}

/** Some environments drop Click but keep MouseDown — treat as a boundary too. */
export function isClickLike(event) {
  if (!event || event.type !== 3 || !event.data) {
    return false
  }
  if (event.data.source !== IncrementalSource.MouseInteraction) {
    return false
  }
  return (
    event.data.type === MouseInteractions.Click ||
    event.data.type === MouseInteractions.MouseDown
  )
}

export function isMutation(event) {
  return event && event.type === 3 && event.data && event.data.source === IncrementalSource.Mutation
}

export function isContentBearing(event) {
  if (!event || event.type !== 3 || !event.data) {
    return false
  }
  const source = event.data.source
  return (
    source === IncrementalSource.Mutation ||
    source === IncrementalSource.Scroll ||
    source === IncrementalSource.Input
  )
}

function isMeta(event) {
  return event && event.type === 4
}

function isFullSnapshot(event) {
  return event && event.type === 2
}

/**
 * Normalize clickThumbnails / rrweb clicks into sorted unique markers.
 */
export function buildClickMarkers(clickThumbnails, postBaseEvents) {
  const markers = []

  if (Array.isArray(clickThumbnails)) {
    for (let i = 0; i < clickThumbnails.length; i++) {
      const thumb = clickThumbnails[i]
      if (!thumb || thumb.timestamp == null) {
        continue
      }
      markers.push({
        timestamp: thumb.timestamp,
        frameX: typeof thumb.frameX === 'number' ? thumb.frameX : null,
        frameY: typeof thumb.frameY === 'number' ? thumb.frameY : null,
        targetText: thumb.targetText || '',
        targetHTML: thumb.targetHTML || '',
        targetElementType: thumb.targetElementType || '',
      })
    }
  }

  // Prefer real Click events from the stream. MouseDown is only a fallback when
  // there is no nearby thumbnail/click marker (avoids Chat/Todo/Calendar ghosts).
  const list = Array.isArray(postBaseEvents) ? postBaseEvents : []
  const hasThumbMarkers = markers.length > 0
  for (let i = 0; i < list.length; i++) {
    const event = list[i]
    if (hasThumbMarkers) {
      if (!isClick(event)) {
        continue
      }
    } else if (!isClickLike(event)) {
      continue
    }
    markers.push({
      timestamp: event.timestamp,
      frameX: event.data && typeof event.data.x === 'number' ? event.data.x : null,
      frameY: event.data && typeof event.data.y === 'number' ? event.data.y : null,
      targetText: '',
      targetHTML: '',
      targetElementType: '',
    })
  }

  markers.sort((a, b) => a.timestamp - b.timestamp)

  const deduped = []
  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i]
    const prev = deduped[deduped.length - 1]
    if (prev && Math.abs(marker.timestamp - prev.timestamp) <= MARKER_DEDUP_MS) {
      if (!prev.targetText && marker.targetText) {
        prev.targetText = marker.targetText
        prev.targetHTML = marker.targetHTML
        prev.targetElementType = marker.targetElementType
      }
      if ((prev.frameX == null || prev.frameY == null) && marker.frameX != null) {
        prev.frameX = marker.frameX
        prev.frameY = marker.frameY
      }
      continue
    }
    deduped.push({ ...marker })
  }

  return deduped
}

function deltaFromMarker(events, marker, fallbackFromTs, fallbackToTs) {
  const hasEvents = Array.isArray(events) && events.length > 0
  return {
    events: hasEvents ? events : [],
    fromTimeMs: hasEvents ? events[0].timestamp : (marker.timestamp != null ? marker.timestamp : fallbackFromTs),
    toTimeMs: hasEvents ? events[events.length - 1].timestamp : (marker.timestamp != null ? marker.timestamp : fallbackToTs),
    clickTimestamp: marker.timestamp != null ? marker.timestamp : null,
    clickX: marker.frameX,
    clickY: marker.frameY,
    targetText: marker.targetText || '',
    targetHTML: marker.targetHTML || '',
    targetElementType: marker.targetElementType || '',
  }
}

/**
 * Split one chain's post-base events into one cumulative delta per click marker.
 */
export function segmentPostBaseByClicks(postBaseEvents, clickThumbnails) {
  const list = Array.isArray(postBaseEvents) ? postBaseEvents : []
  const markers = buildClickMarkers(clickThumbnails, list)

  if (!markers.length) {
    if (!list.length) {
      return []
    }
    return [{
      events: list.slice(),
      fromTimeMs: list[0].timestamp,
      toTimeMs: list[list.length - 1].timestamp,
      clickTimestamp: null,
      clickX: null,
      clickY: null,
      targetText: '',
      targetHTML: '',
      targetElementType: '',
    }]
  }

  const deltas = []
  let prevEvents = []

  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i]
    const endTs = i + 1 < markers.length ? markers[i + 1].timestamp : Infinity

    // Cumulative: every event before the next click.
    let events = list.filter((e) => e.timestamp < endTs)

    // Click marker survived but its rrweb events were lost (buffer not flushed
    // before navigation). Keep the screen; reuse prior cumulative state.
    if (!events.length && prevEvents.length) {
      events = prevEvents.slice()
    }

    const delta = deltaFromMarker(
      events,
      marker,
      list.length ? list[0].timestamp : marker.timestamp,
      list.length ? list[list.length - 1].timestamp : marker.timestamp,
    )
    deltas.push(delta)
    if (events.length) {
      prevEvents = events
    }
  }

  return deltas
}

function assignMarkersToChains(chainRanges, allMarkers) {
  if (!allMarkers.length || !chainRanges.length) {
    return chainRanges.map(() => [])
  }

  const assigned = chainRanges.map(() => [])

  for (let m = 0; m < allMarkers.length; m++) {
    const marker = allMarkers[m]
    let best = 0
    // Prefer the last chain whose base starts at or before this click.
    for (let c = 0; c < chainRanges.length; c++) {
      if (marker.timestamp >= chainRanges[c].startTs) {
        best = c
      }
    }
    // Clicks that happened before the first persisted FullSnapshot still belong
    // to the first chain (extension captured the thumb; events may be missing).
    if (marker.timestamp < chainRanges[0].startTs) {
      best = 0
    }
    assigned[best].push(marker)
  }

  return assigned
}

/**
 * @param {Array} events
 * @param {Array} [clickThumbnails]
 */
export function segmentRrwebEvents(events, clickThumbnails) {
  const list = Array.isArray(events) ? events : []
  const pendingChains = []

  let baseEvents = []
  let postBase = []
  let capturingBase = true

  function flushChain() {
    if (!baseEvents.length) {
      baseEvents = []
      postBase = []
      capturingBase = true
      return
    }

    pendingChains.push({
      baseEvents,
      postBase,
      startTs: baseEvents[0].timestamp,
    })

    baseEvents = []
    postBase = []
    capturingBase = true
  }

  for (let i = 0; i < list.length; i++) {
    const event = list[i]

    if (!capturingBase && isFullSnapshot(event)) {
      let trailingMeta = null
      if (postBase.length && isMeta(postBase[postBase.length - 1])) {
        trailingMeta = postBase.pop()
      }
      flushChain()
      if (trailingMeta) {
        baseEvents.push(trailingMeta)
      }
      baseEvents.push(event)
      const hasMeta = baseEvents.some(isMeta)
      const hasFull = baseEvents.some(isFullSnapshot)
      capturingBase = !(hasMeta && hasFull)
      continue
    }

    if (capturingBase) {
      baseEvents.push(event)
      const hasMeta = baseEvents.some(isMeta)
      const hasFull = baseEvents.some(isFullSnapshot)
      if (hasMeta && hasFull) {
        capturingBase = false
      }
      continue
    }

    postBase.push(event)
  }

  flushChain()

  const allMarkers = buildClickMarkers(clickThumbnails, list)
  const perChainMarkers = assignMarkersToChains(
    pendingChains.map((c) => ({ startTs: c.startTs })),
    allMarkers,
  )

  return pendingChains.map((chain, idx) => ({
    baseEvents: chain.baseEvents,
    deltas: segmentPostBaseByClicks(chain.postBase, perChainMarkers[idx]),
  }))
}

export default {
  segmentRrwebEvents,
  segmentPostBaseByClicks,
  buildClickMarkers,
  isClick,
  isClickLike,
  isMutation,
  isContentBearing,
}
