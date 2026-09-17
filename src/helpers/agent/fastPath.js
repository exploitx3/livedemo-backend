// "next" / "back" / "restart" navigation without an LLM round-trip.
// Pure string → intent parser; the orchestrator resolves it against the
// session's current demo. Returns null when the model should handle the turn.
const NEXT_RE = /^(next|next step|continue|forward|go on)\.?!?$/i
const BACK_RE = /^(back|previous|previous step|go back)\.?!?$/i
const RESTART_RE = /^(restart|start over|from the beginning|start again)\.?!?$/i

export default function fastPath(message) {
  const text = String(message || '').trim()

  if (NEXT_RE.test(text)) return { type: 'next_step' }
  if (BACK_RE.test(text)) return { type: 'previous_step' }
  if (RESTART_RE.test(text)) return { type: 'restart' }

  return null
}
