/**
 * Persist rrweb events with string enum names; convert back to numbers for Replayer.
 * Idempotent both ways (already-numeric / already-named).
 */

const EVENT_TYPE_NAMES = [
  'DomContentLoaded',
  'Load',
  'FullSnapshot',
  'IncrementalSnapshot',
  'Meta',
  'Custom',
  'Plugin',
  'Asset',
]

const INCREMENTAL_SOURCE_NAMES = [
  'Mutation',
  'MouseMove',
  'MouseInteraction',
  'Scroll',
  'ViewportResize',
  'Input',
  'TouchMove',
  'MediaInteraction',
  'StyleSheetRule',
  'CanvasMutation',
  'Font',
  'Log',
  'Drag',
  'StyleDeclaration',
  'Selection',
  'AdoptedStyleSheet',
  'CustomElement',
]

const MOUSE_INTERACTION_NAMES = [
  'MouseUp',
  'MouseDown',
  'Click',
  'ContextMenu',
  'DblClick',
  'Focus',
  'Blur',
  'TouchStart',
  'TouchMove_Departed',
  'TouchEnd',
  'TouchCancel',
]

const MEDIA_INTERACTION_NAMES = [
  'Play',
  'Pause',
  'Seeked',
  'VolumeChange',
  'RateChange',
]

function nameToIndex(names, value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const idx = names.indexOf(value)
    if (idx !== -1) {
      return idx
    }
  }
  return value
}

function indexToName(names, value) {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' && value >= 0 && value < names.length) {
    return names[value]
  }
  return value
}

function encodeEvent(event) {
  if (!event || typeof event !== 'object') {
    return event
  }

  const out = { ...event }
  out.type = indexToName(EVENT_TYPE_NAMES, event.type)

  if (event.data && typeof event.data === 'object') {
    const data = { ...event.data }
    if (Object.prototype.hasOwnProperty.call(data, 'source')) {
      data.source = indexToName(INCREMENTAL_SOURCE_NAMES, data.source)
    }
    // MouseInteraction / MediaInteraction use data.type as a nested enum.
    if (
      data.source === 'MouseInteraction' ||
      data.source === INCREMENTAL_SOURCE_NAMES.indexOf('MouseInteraction') ||
      data.source === 2
    ) {
      if (Object.prototype.hasOwnProperty.call(data, 'type')) {
        data.type = indexToName(MOUSE_INTERACTION_NAMES, data.type)
      }
    }
    if (
      data.source === 'MediaInteraction' ||
      data.source === INCREMENTAL_SOURCE_NAMES.indexOf('MediaInteraction') ||
      data.source === 7
    ) {
      if (Object.prototype.hasOwnProperty.call(data, 'type')) {
        data.type = indexToName(MEDIA_INTERACTION_NAMES, data.type)
      }
    }
    out.data = data
  }

  return out
}

function decodeEvent(event) {
  if (!event || typeof event !== 'object') {
    return event
  }

  const out = { ...event }
  out.type = nameToIndex(EVENT_TYPE_NAMES, event.type)

  if (event.data && typeof event.data === 'object') {
    const data = { ...event.data }
    const sourceNameOrNum = data.source
    const sourceNum = nameToIndex(INCREMENTAL_SOURCE_NAMES, sourceNameOrNum)
    if (Object.prototype.hasOwnProperty.call(data, 'source')) {
      data.source = sourceNum
    }
    if (sourceNum === 2 && Object.prototype.hasOwnProperty.call(data, 'type')) {
      data.type = nameToIndex(MOUSE_INTERACTION_NAMES, data.type)
    }
    if (sourceNum === 7 && Object.prototype.hasOwnProperty.call(data, 'type')) {
      data.type = nameToIndex(MEDIA_INTERACTION_NAMES, data.type)
    }
    out.data = data
  }

  return out
}

function encodeRrwebEvents(events) {
  if (!Array.isArray(events)) {
    return []
  }
  return events.map(encodeEvent)
}

function decodeRrwebEvents(events) {
  if (!Array.isArray(events)) {
    return []
  }
  return events.map(decodeEvent)
}

function stringifyRrwebEvents(events) {
  return JSON.stringify(encodeRrwebEvents(events))
}

function parseRrwebEvents(jsonString) {
  let parsed
  try {
    parsed = JSON.parse(jsonString)
  } catch (e) {
    return []
  }
  return decodeRrwebEvents(parsed)
}

export {
  EVENT_TYPE_NAMES,
  INCREMENTAL_SOURCE_NAMES,
  MOUSE_INTERACTION_NAMES,
  encodeEvent,
  decodeEvent,
  encodeRrwebEvents,
  decodeRrwebEvents,
  stringifyRrwebEvents,
  parseRrwebEvents,
}
