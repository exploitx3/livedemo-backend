// Pure knowledge-pipeline logic: text extraction shaping, chunking, cosine
// ranking. No DB, no network — see agentKnowledge.check.js for the self-check.

export function stripHtml(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#?\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ~500–800 tokens ≈ 2000–3200 chars. Split on headings/blank lines, pack
// paragraphs until the limit, carry a tail overlap into the next chunk.
// No tokenizer library required.
const MAX_CHARS = 2400
const OVERLAP_CHARS = 300

export function chunkText(text, maxChars = MAX_CHARS, overlapChars = OVERLAP_CHARS) {
  const clean = String(text || '').replace(/\r\n/g, '\n').trim()
  if (!clean) return []
  if (clean.length <= maxChars) return [clean]

  // Paragraph-ish blocks: blank lines or markdown headings start a new block
  const blocks = clean.split(/\n(?=#{1,6}\s)|\n\s*\n/).map(b => b.trim()).filter(Boolean)

  const chunks = []
  let current = ''

  const push = () => {
    if (current.trim()) chunks.push(current.trim())
  }

  for (let block of blocks) {
    // A single oversized block gets hard-split on sentence-ish boundaries
    while (block.length > maxChars) {
      let cut = block.lastIndexOf('. ', maxChars)
      if (cut < maxChars / 2) cut = maxChars
      const piece = block.slice(0, cut + 1)
      if ((current + '\n\n' + piece).length > maxChars) {
        push()
        current = piece
        push()
        current = ''
      } else {
        current = current ? current + '\n\n' + piece : piece
        push()
        current = ''
      }
      block = block.slice(cut + 1).trim()
    }
    if (!block) continue

    if ((current ? current.length + 2 : 0) + block.length > maxChars) {
      push()
      // Overlap: carry the tail of the previous chunk for context continuity
      const tail = current.slice(-overlapChars)
      current = tail ? tail + '\n\n' + block : block
    } else {
      current = current ? current + '\n\n' + block : block
    }
  }
  push()

  return chunks
}

// FAQ list [{ q, a }] → "Q: ...\nA: ..." blocks, one chunk per pair
export function faqToText(pairs) {
  return (pairs || [])
    .filter(p => p && (p.q || p.a))
    .map(p => `Q: ${p.q || ''}\nA: ${p.a || ''}`)
    .join('\n\n')
}

// Demo-derived chunks from an existing Story (read-only; no schema changes).
// One summary chunk + one chunk per step, each tagged with demo/step metadata
// so retrieval can emit content_card { demoId, stepNumber }.
// Full step list for the prompt. Same screen order and numbering as storyToChunks
// and the player (screen.index, then steps array order). Text is view.content.
export function storyStepList(storyDoc) {
  if (!storyDoc) return []
  const screens = [...(storyDoc.screens || [])].sort((a, b) => (a.index || 0) - (b.index || 0))
  const steps = []
  let stepNumber = 0
  screens.forEach((screen) => {
    ;(screen.steps || []).forEach((step) => {
      stepNumber += 1
      steps.push({
        stepNumber,
        text: stripHtml(step.view && step.view.content),
      })
    })
  })
  return steps
}

export function storyToChunks(storyDoc) {
  const chunks = []
  const screens = [...(storyDoc.screens || [])].sort((a, b) => (a.index || 0) - (b.index || 0))

  let stepNumber = 0
  const stepEntries = []
  screens.forEach((screen) => {
    ;(screen.steps || []).forEach((step) => {
      stepNumber += 1
      const content = stripHtml(step.view && step.view.content)
      const targetText = stripHtml(step.elementData && step.elementData.targetText)
      stepEntries.push({
        stepId: step._id,
        screenId: screen._id,
        stepNumber,
        content,
        targetText,
      })
    })
  })

  const summary = stepEntries.map(s => s.content).filter(Boolean).join(' ').slice(0, 2000)
  chunks.push({
    text: `Demo: ${storyDoc.name || 'Untitled demo'}\n${summary}`,
    metadata: { title: storyDoc.name, demoId: storyDoc._id, stepNumber: 1 },
  })

  stepEntries.forEach((s) => {
    const text = [s.content.slice(0, 200), s.targetText && `UI element: ${s.targetText}`]
      .filter(Boolean).join('\n')
    if (!text) return
    chunks.push({
      text: `Demo: ${storyDoc.name || 'Untitled demo'} — step ${s.stepNumber}\n${text}`,
      metadata: {
        title: storyDoc.name,
        demoId: storyDoc._id,
        screenId: s.screenId,
        stepId: s.stepId,
        stepNumber: s.stepNumber,
      },
    })
  })

  return chunks
}

export function cosineSim(a, b) {
  let dot = 0
  let normA = 0
  let normB = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (!normA || !normB) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
