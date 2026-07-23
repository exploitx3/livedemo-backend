import fsp from 'fs/promises'
import { decodeRrwebEvents, stringifyRrwebEvents } from './rrwebEventNames.js'

const EVENT_FULL_SNAPSHOT = 2
const EVENT_INCREMENTAL = 3
const SOURCE_MUTATION = 0
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

function updateTextInSnapshot(events, nodeId, text) {
  let found = false
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    if (ev.type !== EVENT_FULL_SNAPSHOT || !ev.data || !ev.data.node) {
      continue
    }
    walkSerialized(ev.data.node, (n) => {
      if (n.id === nodeId && n.type === NODE_TEXT) {
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
      if (t && t.id === nodeId) {
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

async function readEventsJson(filePath) {
  const raw = await fsp.readFile(filePath, { encoding: SCREENDOC_ENCODING })
  return decodeRrwebEvents(JSON.parse(raw))
}

async function writeEventsJson(filePath, events) {
  await fsp.writeFile(filePath, stringifyRrwebEvents(events), { encoding: SCREENDOC_ENCODING })
}

/**
 * Persist a text edit into an rrweb chain.
 * - Edit on base: patch FullSnapshot text node; update any texts[] mutations in deltas
 *   so later screens don't overwrite with the old value.
 * - Edit on delta: leave base alone (earlier screens keep old text); patch/append
 *   texts mutations on this delta and all later deltas in the same chain.
 */
async function editRrwebScreenText({ Models, screenDoc, nodeId, text }) {
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

  if (screenDoc.recordingRole === 'base') {
    const baseEvents = await readEventsJson(base.snapshotPath)
    const found = updateTextInSnapshot(baseEvents, nodeId, text)
    if (!found) {
      throw new Error(`Text node ${nodeId} not found in FullSnapshot`)
    }
    await writeEventsJson(base.snapshotPath, baseEvents)

    for (let i = 0; i < chain.length; i++) {
      const d = chain[i]
      if (d.recordingRole !== 'delta' || !d.eventsPath) {
        continue
      }
      const events = await readEventsJson(d.eventsPath)
      if (updateTextsInEvents(events, nodeId, text)) {
        await writeEventsJson(d.eventsPath, events)
      }
    }
    return { ok: true }
  }

  // Delta (or Final): change from this screen forward.
  const fromIndex = screenDoc.index
  let anyWrite = false

  for (let i = 0; i < chain.length; i++) {
    const d = chain[i]
    if (d.recordingRole !== 'delta' || !d.eventsPath) {
      continue
    }
    if ((d.index || 0) < fromIndex) {
      continue
    }

    const events = await readEventsJson(d.eventsPath)
    let changed = updateTextsInEvents(events, nodeId, text)
    if (!changed) {
      appendTextMutation(events, nodeId, text, d.toTimeMs)
      changed = true
    }
    if (changed) {
      await writeEventsJson(d.eventsPath, events)
      const lastTs = events[events.length - 1].timestamp
      await Models.Screen.updateOne(
        { _id: d._id },
        { eventCount: events.length, toTimeMs: lastTs },
      )
      anyWrite = true
    }
  }

  if (!anyWrite) {
    throw new Error(`Failed to apply text edit for node ${nodeId}`)
  }

  return { ok: true }
}

export {
  editRrwebScreenText,
  updateTextInSnapshot,
  updateTextsInEvents,
  appendTextMutation,
}
