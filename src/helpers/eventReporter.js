// Simplified EventReporter for story-api
// This is a no-op implementation that can be extended later if needed

function storeInfoEvent(name, data) {
  // For now, just log the event
  // In the future, this could make HTTP requests to an event reporting service
  console.log(`[Event] ${name}:`, JSON.stringify(data))
  return Promise.resolve()
}

function storeErrorEvent(name, data) {
  console.error(`[Error Event] ${name}:`, JSON.stringify(data))
  return Promise.resolve()
}

function storeEvent(name, type, data) {
  console.log(`[Event] ${name} (${type}):`, JSON.stringify(data))
  return Promise.resolve()
}

export default {
  storeEvent,
  storeInfoEvent,
  storeErrorEvent
}
