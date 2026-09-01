import fsp from 'fs/promises'
import { decodeRrwebEvents, stringifyRrwebEvents } from './rrwebEventNames.js'

const EVENT_FULL_SNAPSHOT = 2
const EVENT_INCREMENTAL = 3
const SOURCE_MUTATION = 0
const NODE_ELEMENT = 2
const NODE_TEXT = 3
const SCREENDOC_ENCODING = 'utf-8'

function walkSerialized(node, visit) {
  if (!node) {
    return
  }
  visit(node)
  const children = node.childNodes
  if (!Array.isArray(children)) {
    return
  }
  for (let i = 0; i < children.length; i++) {
    walkSerialized(children[i], visit)
  }
}

function parseStyle(str) {
  const map = {}
  if (!str) {
    return map
  }
  String(str).split(';').forEach((part) => {
    const i = part.indexOf(':')
    if (i === -1) {
      return
    }
    const k = part.slice(0, i).trim().toLowerCase()
    const v = part.slice(i + 1).trim()
    if (k) {
      map[k] = v
    }
  })
  return map
}

function serializeStyle(map) {
  return Object.keys(map)
    .filter((k) => map[k] != null && map[k] !== '')
    .map((k) => `${k}: ${map[k]}`)
    .join('; ')
}

function mergeStyleString(existing, updates) {
  const map = parseStyle(existing)
  Object.keys(updates || {}).forEach((k) => {
    const key = String(k).trim().toLowerCase()
    const value = updates[k]
    if (value == null || value === '') {
      delete map[key]
    } else {
      map[key] = value
    }
  })
  return serializeStyle(map)
}

function findFirstTextChildId(node) {
  const kids = node && node.childNodes
  if (!Array.isArray(kids)) {
    return null
  }
  for (let i = 0; i < kids.length; i++) {
    if (kids[i] && kids[i].type === NODE_TEXT && kids[i].id != null) {
      return kids[i].id
    }
  }
  for (let i = 0; i < kids.length; i++) {
    const id = findFirstTextChildId(kids[i])
    if (id != null) {
      return id
    }
  }
  return null
}

function firstFinite() {
  for (let i = 0; i < arguments.length; i++) {
    const n = typeof arguments[i] === 'number' ? arguments[i] : parseInt(arguments[i], 10)
    if (Number.isFinite(n)) {
      return n
    }
  }
  return null
}

function findFirstTextNodeId(events, elementId) {
  let found = null
  if (!Array.isArray(events)) {
    return null
  }
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    if (ev.type === EVENT_FULL_SNAPSHOT && ev.data && ev.data.node) {
      walkSerialized(ev.data.node, (n) => {
        if (found == null && idsMatch(n.id, elementId)) {
          found = findFirstTextChildId(n)
        }
      })
    }
    if (
      ev.type === EVENT_INCREMENTAL &&
      ev.data &&
      ev.data.source === SOURCE_MUTATION &&
      Array.isArray(ev.data.adds)
    ) {
      for (let j = 0; j < ev.data.adds.length; j++) {
        const add = ev.data.adds[j]
        if (!add || !add.node) {
          continue
        }
        walkSerialized(add.node, (n) => {
          if (found == null && idsMatch(n.id, elementId)) {
            found = findFirstTextChildId(n)
          }
        })
      }
    }
  }
  return found
}

function idsMatch(a, b) {
  if (a == null || b == null) {
    return false
  }
  return Number(a) === Number(b)
}

function findElementInSnapshot(events, nodeId) {
  let found = null
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    if (ev.type !== EVENT_FULL_SNAPSHOT || !ev.data || !ev.data.node) {
      continue
    }
    walkSerialized(ev.data.node, (n) => {
      if (!idsMatch(n.id, nodeId)) {
        return
      }
      if (n.type === NODE_ELEMENT || n.tagName) {
        found = n
      }
    })
  }
  return found
}

function updateTextInSnapshot(events, nodeId, text) {
  let found = false
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    if (ev.type !== EVENT_FULL_SNAPSHOT || !ev.data || !ev.data.node) {
      continue
    }
    walkSerialized(ev.data.node, (n) => {
      if (idsMatch(n.id, nodeId) && n.type === NODE_TEXT) {
        n.textContent = text
        found = true
      }
    })
  }
  return found
}

function updateTextsInEvents(events, nodeId, text) {
  let updated = false
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    if (
      ev.type !== EVENT_INCREMENTAL ||
      !ev.data ||
      ev.data.source !== SOURCE_MUTATION ||
      !Array.isArray(ev.data.texts)
    ) {
      continue
    }
    for (let j = 0; j < ev.data.texts.length; j++) {
      const t = ev.data.texts[j]
      if (t && idsMatch(t.id, nodeId)) {
        t.value = text
        updated = true
      }
    }
  }
  return updated
}

function appendTextMutation(events, nodeId, text, hintTs) {
  const last = events.length ? events[events.length - 1] : null
  const baseTs = (last && last.timestamp) || hintTs || Date.now()
  const timestamp = baseTs + 1
  events.push({
    type: EVENT_INCREMENTAL,
    timestamp,
    data: {
      source: SOURCE_MUTATION,
      texts: [{ id: nodeId, value: text }],
      attributes: [],
      removes: [],
      adds: [],
    },
  })
  return timestamp
}

function isMutationEvent(ev) {
  return ev
    && ev.type === EVENT_INCREMENTAL
    && ev.data
    && ev.data.source === SOURCE_MUTATION
}

function insertEventAt(events, event) {
  let insertAt = events.length
  for (let i = 0; i < events.length; i++) {
    if ((events[i].timestamp || 0) > event.timestamp) {
      insertAt = i
      break
    }
  }
  events.splice(insertAt, 0, event)
}

/**
 * Player seeks to screen.toTimeMs (inclusive). A mutation after that timestamp
 * never plays, so delta edits must land at toTimeMs — not last+1.
 */
function upsertTextMutationAt(events, nodeId, text, atTs) {
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    if (!isMutationEvent(ev) || ev.timestamp !== atTs || !Array.isArray(ev.data.texts)) {
      continue
    }
    let found = false
    for (let j = 0; j < ev.data.texts.length; j++) {
      if (ev.data.texts[j] && idsMatch(ev.data.texts[j].id, nodeId)) {
        ev.data.texts[j].value = text
        found = true
      }
    }
    if (found) {
      return atTs
    }
    ev.data.texts.push({ id: nodeId, value: text })
    return atTs
  }
  insertEventAt(events, {
    type: EVENT_INCREMENTAL,
    timestamp: atTs,
    data: {
      source: SOURCE_MUTATION,
      texts: [{ id: nodeId, value: text }],
      attributes: [],
      removes: [],
      adds: [],
    },
  })
  return atTs
}

function updateTextsAfter(events, nodeId, text, afterTs) {
  let updated = false
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    if (!isMutationEvent(ev) || (ev.timestamp || 0) <= afterTs || !Array.isArray(ev.data.texts)) {
      continue
    }
    for (let j = 0; j < ev.data.texts.length; j++) {
      const t = ev.data.texts[j]
      if (t && idsMatch(t.id, nodeId)) {
        t.value = text
        updated = true
      }
    }
  }
  return updated
}

function upsertAttrMutationAt(events, nodeId, attrPatch, atTs) {
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    if (!isMutationEvent(ev) || ev.timestamp !== atTs || !Array.isArray(ev.data.attributes)) {
      continue
    }
    let found = false
    for (let j = 0; j < ev.data.attributes.length; j++) {
      const a = ev.data.attributes[j]
      if (a && idsMatch(a.id, nodeId)) {
        a.attributes = Object.assign({}, a.attributes || {}, attrPatch)
        found = true
      }
    }
    if (found) {
      return atTs
    }
    ev.data.attributes.push({ id: nodeId, attributes: attrPatch })
    return atTs
  }
  insertEventAt(events, {
    type: EVENT_INCREMENTAL,
    timestamp: atTs,
    data: {
      source: SOURCE_MUTATION,
      texts: [],
      attributes: [{ id: nodeId, attributes: attrPatch }],
      removes: [],
      adds: [],
    },
  })
  return atTs
}

function applyAttrsToSnapshot(events, nodeId, attributes, styleUpdates) {
  const node = findElementInSnapshot(events, nodeId)
  if (!node) {
    return false
  }
  node.attributes = node.attributes || {}
  if (styleUpdates && Object.keys(styleUpdates).length) {
    node.attributes.style = mergeStyleString(node.attributes.style, styleUpdates)
  }
  if (attributes) {
    Object.keys(attributes).forEach((k) => {
      const value = attributes[k]
      if (value == null || value === '') {
        delete node.attributes[k]
      } else {
        node.attributes[k] = value
      }
    })
    // Replay prefers rr_dataURL over src. Drop the inlined capture so the new src wins.
    if (attributes.src || attributes.href || attributes['xlink:href']) {
      delete node.attributes.rr_dataURL
      delete node.attributes.srcset
      delete node.attributes['rrweb-original-src']
      delete node.attributes['rrweb-original-srcset']
    }
  }
  return true
}

function updateAttributesInEvents(events, nodeId, attrPatch) {
  let updated = false
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    if (
      ev.type !== EVENT_INCREMENTAL ||
      !ev.data ||
      ev.data.source !== SOURCE_MUTATION ||
      !Array.isArray(ev.data.attributes)
    ) {
      continue
    }
    for (let j = 0; j < ev.data.attributes.length; j++) {
      const a = ev.data.attributes[j]
      if (a && a.id === nodeId) {
        a.attributes = Object.assign({}, a.attributes || {}, attrPatch)
        updated = true
      }
    }
  }
  return updated
}

function appendAttributeMutation(events, nodeId, attributes, hintTs) {
  const last = events.length ? events[events.length - 1] : null
  const baseTs = (last && last.timestamp) || hintTs || Date.now()
  const timestamp = baseTs + 1
  events.push({
    type: EVENT_INCREMENTAL,
    timestamp,
    data: {
      source: SOURCE_MUTATION,
      texts: [],
      attributes: [{ id: nodeId, attributes }],
      removes: [],
      adds: [],
    },
  })
  return timestamp
}

function getNodeAttributesFromSnapshot(events, nodeId) {
  const node = findElementInSnapshot(events, nodeId)
  return Object.assign({}, (node && node.attributes) || {})
}

function applyMutationsToResolved(attrs, events, nodeId) {
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    if (
      ev.type !== EVENT_INCREMENTAL ||
      !ev.data ||
      ev.data.source !== SOURCE_MUTATION ||
      !Array.isArray(ev.data.attributes)
    ) {
      continue
    }
    for (let j = 0; j < ev.data.attributes.length; j++) {
      const a = ev.data.attributes[j]
      if (a && a.id === nodeId && a.attributes) {
        Object.assign(attrs, a.attributes)
      }
    }
  }
  return attrs
}

function buildAttrPatch(resolvedAttrs, attributes, styleUpdates) {
  const patch = Object.assign({}, attributes || {})
  if (styleUpdates && Object.keys(styleUpdates).length) {
    patch.style = mergeStyleString(resolvedAttrs && resolvedAttrs.style, styleUpdates)
  }
  return patch
}

function hasAttrWork(attributes, styleUpdates) {
  return (attributes && Object.keys(attributes).length > 0)
    || (styleUpdates && Object.keys(styleUpdates).length > 0)
}

async function readEventsJson(filePath) {
  const raw = await fsp.readFile(filePath, { encoding: SCREENDOC_ENCODING })
  return decodeRrwebEvents(JSON.parse(raw))
}

async function writeEventsJson(filePath, events) {
  await fsp.writeFile(filePath, stringifyRrwebEvents(events), { encoding: SCREENDOC_ENCODING })
}

async function loadChain(Models, screenDoc) {
  const screens = await Models.Screen.find({ storyId: screenDoc.storyId }).lean()
  const chainId = screenDoc.recordingRole === 'base'
    ? String(screenDoc._id)
    : String(screenDoc.baseScreenId)

  const chain = screens
    .filter((s) => {
      if (!s.recordingRole) {
        return false
      }
      if (s.recordingRole === 'base') {
        return String(s._id) === chainId
      }
      return String(s.baseScreenId) === chainId
    })
    .sort((a, b) => (a.index || 0) - (b.index || 0))

  if (!chain.length) {
    throw new Error('rrweb chain not found for screen')
  }

  const base = chain.find((s) => s.recordingRole === 'base')
  if (!base || !base.snapshotPath) {
    throw new Error('rrweb base snapshot missing')
  }

  return { chain, base }
}

async function bumpDeltaMeta(Models, screen, events) {
  await Models.Screen.updateOne(
    { _id: screen._id },
    { eventCount: events.length },
  )
}

/**
 * Persist a DOM edit into an rrweb chain (text and/or element attributes).
 * - Edit on base: patch FullSnapshot; update later delta mutations so they
 *   don't overwrite with the old value.
 * - Edit on delta: leave base alone; patch/append mutations from this screen forward.
 */
async function editRrwebScreenNode({
  Models,
  screenDoc,
  nodeId,
  text,
  textNodeId,
  elementNodeId,
  attributes,
  styleUpdates,
}) {
  const { chain, base } = await loadChain(Models, screenDoc)
  const baseEvents = await readEventsJson(base.snapshotPath)

  const resolvedElementId = firstFinite(elementNodeId, nodeId)
  let resolvedTextId = firstFinite(textNodeId)

  if (text != null && resolvedTextId == null && resolvedElementId != null) {
    resolvedTextId = findFirstTextNodeId(baseEvents, resolvedElementId)
    if (resolvedTextId == null) {
      for (let i = 0; i < chain.length && resolvedTextId == null; i++) {
        const d = chain[i]
        if (d.recordingRole !== 'delta' || !d.eventsPath) {
          continue
        }
        const deltaEvents = await readEventsJson(d.eventsPath)
        resolvedTextId = findFirstTextNodeId(deltaEvents, resolvedElementId)
      }
    }
    if (resolvedTextId == null) {
      resolvedTextId = firstFinite(nodeId)
    }
  }

  const doText = text != null && resolvedTextId != null
  const doAttrs = resolvedElementId != null && hasAttrWork(attributes, styleUpdates)

  if (!doText && !doAttrs) {
    throw new Error('Nothing to persist on rrweb node')
  }

  if (screenDoc.recordingRole === 'base') {
    if (doText) {
      let found = updateTextInSnapshot(baseEvents, resolvedTextId, text)
      if (!found && resolvedElementId != null) {
        const childId = findFirstTextNodeId(baseEvents, resolvedElementId)
        if (childId != null) {
          resolvedTextId = childId
          found = updateTextInSnapshot(baseEvents, resolvedTextId, text)
        }
      }
      if (!found) {
        throw new Error(`Text node ${resolvedTextId} not found in FullSnapshot`)
      }
    }
    if (doAttrs) {
      const found = applyAttrsToSnapshot(baseEvents, resolvedElementId, attributes, styleUpdates)
      if (!found) {
        throw new Error(`Element node ${resolvedElementId} not found in FullSnapshot`)
      }
    }
    await writeEventsJson(base.snapshotPath, baseEvents)

    const attrPatch = doAttrs
      ? buildAttrPatch(getNodeAttributesFromSnapshot(baseEvents, resolvedElementId), attributes, styleUpdates)
      : null

    for (let i = 0; i < chain.length; i++) {
      const d = chain[i]
      if (d.recordingRole !== 'delta' || !d.eventsPath) {
        continue
      }
      const events = await readEventsJson(d.eventsPath)
      let changed = false
      if (doText && updateTextsInEvents(events, resolvedTextId, text)) {
        changed = true
      }
      if (doAttrs && updateAttributesInEvents(events, resolvedElementId, attrPatch)) {
        changed = true
      }
      if (changed) {
        await writeEventsJson(d.eventsPath, events)
      }
    }
    return { ok: true }
  }

  const fromIndex = screenDoc.index
  let anyWrite = false
  const resolvedAttrs = doAttrs ? getNodeAttributesFromSnapshot(baseEvents, resolvedElementId) : {}
  let atTs = firstFinite(screenDoc.toTimeMs)

  for (let i = 0; i < chain.length; i++) {
    const d = chain[i]
    if (d.recordingRole !== 'delta' || !d.eventsPath) {
      continue
    }

    const events = await readEventsJson(d.eventsPath)
    const inScope = (d.index || 0) >= fromIndex

    if (!inScope) {
      if (doAttrs) {
        applyMutationsToResolved(resolvedAttrs, events, resolvedElementId)
      }
      continue
    }

    if (atTs == null) {
      atTs = events.length ? events[events.length - 1].timestamp : Date.now()
    }

    let changed = false
    if (doText) {
      upsertTextMutationAt(events, resolvedTextId, text, atTs)
      updateTextsAfter(events, resolvedTextId, text, atTs)
      changed = true
    }
    if (doAttrs) {
      const attrPatch = buildAttrPatch(resolvedAttrs, attributes, styleUpdates)
      upsertAttrMutationAt(events, resolvedElementId, attrPatch, atTs)
      Object.assign(resolvedAttrs, attrPatch)
      changed = true
    }
    if (changed) {
      await writeEventsJson(d.eventsPath, events)
      await bumpDeltaMeta(Models, d, events)
      anyWrite = true
    }
  }

  if (!anyWrite) {
    throw new Error(`Failed to apply edit for node ${resolvedElementId || resolvedTextId}`)
  }

  return { ok: true }
}

async function editRrwebScreenText({ Models, screenDoc, nodeId, text }) {
  return editRrwebScreenNode({
    Models,
    screenDoc,
    nodeId,
    textNodeId: nodeId,
    text,
  })
}

export {
  editRrwebScreenText,
  editRrwebScreenNode,
  updateTextInSnapshot,
  updateTextsInEvents,
  appendTextMutation,
  applyAttrsToSnapshot,
  updateAttributesInEvents,
  mergeStyleString,
  findFirstTextNodeId,
  upsertTextMutationAt,
}
