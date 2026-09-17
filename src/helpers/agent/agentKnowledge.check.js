// Self-check for the pure agent-knowledge logic. Run: node src/helpers/agent/agentKnowledge.check.js
import assert from 'assert'
import { chunkText, cosineSim, faqToText, storyToChunks, stripHtml } from './agentKnowledge.js'
import { allowedDemosQuery, resolveDemoAction } from './validateActions.js'
import fastPath from './fastPath.js'

// --- stripHtml ---------------------------------------------------------------
assert.strictEqual(stripHtml('<p>Hello <strong>world</strong></p>'), 'Hello world')
assert.strictEqual(stripHtml('<script>evil()</script>ok &amp; fine'), 'ok & fine')

// --- chunkText ---------------------------------------------------------------
assert.deepStrictEqual(chunkText(''), [])
assert.deepStrictEqual(chunkText('short text'), ['short text'])

const para = 'word '.repeat(150).trim() // ~750 chars
const longText = Array.from({ length: 10 }, (_, i) => `## Heading ${i}\n${para}`).join('\n\n')
const chunks = chunkText(longText)
assert.ok(chunks.length > 1, 'long text must split into multiple chunks')
assert.ok(chunks.every(c => c.length <= 2400 + 400), 'chunks must respect the size cap (+overlap slack)')
// Nothing lost: every heading appears in some chunk
for (let i = 0; i < 10; i++) {
  assert.ok(chunks.some(c => c.includes(`## Heading ${i}`)), `heading ${i} must survive chunking`)
}

// A single block far larger than the cap still splits
const monster = ('sentence one. ').repeat(600) // ~8400 chars, no blank lines
const monsterChunks = chunkText(monster)
assert.ok(monsterChunks.length >= 3, 'oversized single block must hard-split')

// --- faqToText ---------------------------------------------------------------
assert.strictEqual(
  faqToText([{ q: 'Price?', a: '$10' }, { q: 'Trial?', a: 'Yes' }]),
  'Q: Price?\nA: $10\n\nQ: Trial?\nA: Yes'
)
assert.strictEqual(faqToText([]), '')

// --- cosineSim ---------------------------------------------------------------
assert.strictEqual(cosineSim([1, 0], [1, 0]), 1)
assert.strictEqual(cosineSim([1, 0], [0, 1]), 0)
assert.ok(Math.abs(cosineSim([1, 1], [1, 0]) - Math.SQRT1_2) < 1e-9)
assert.strictEqual(cosineSim([], []), 0)

// --- storyToChunks -----------------------------------------------------------
const story = {
  _id: 'story1',
  name: 'HubSpot Integration',
  screens: [
    {
      _id: 'sc2', index: 1,
      steps: [{ _id: 'st2', view: { content: '<span>Step <b>two</b></span>' }, elementData: { targetText: 'Save button' } }],
    },
    {
      _id: 'sc1', index: 0,
      steps: [{ _id: 'st1', view: { content: '<span>Step one</span>' }, elementData: {} }],
    },
  ],
}
const demoChunks = storyToChunks(story)
// 1 summary + 2 steps; screens sorted by index so st1 is stepNumber 1
assert.strictEqual(demoChunks.length, 3)
assert.ok(demoChunks[0].text.includes('HubSpot Integration'))
assert.strictEqual(demoChunks[1].metadata.stepNumber, 1)
assert.strictEqual(demoChunks[1].metadata.stepId, 'st1')
assert.strictEqual(demoChunks[2].metadata.stepNumber, 2)
assert.ok(demoChunks[2].text.includes('Save button'))
assert.ok(!demoChunks[2].text.includes('<b>'), 'html must be stripped')

// --- fastPath ----------------------------------------------------------------
assert.deepStrictEqual(fastPath('next'), { type: 'next_step' })
assert.deepStrictEqual(fastPath('  Next step. '), { type: 'next_step' })
assert.deepStrictEqual(fastPath('go back'), { type: 'previous_step' })
assert.deepStrictEqual(fastPath('start over'), { type: 'restart' })
assert.strictEqual(fastPath('what is the next pricing tier?'), null)
assert.strictEqual(fastPath(''), null)

// --- resolveDemoAction -------------------------------------------------------
const interviewStep = { metadata: { demoId: 'easyenv', stepId: 'st4', stepNumber: 4 } }
const cover = { metadata: { demoId: 'easyenv', stepNumber: 1 } }
assert.deepStrictEqual(
  resolveDemoAction(null, [cover, interviewStep]),
  { demoId: 'easyenv', stepNumber: 4 },
  'null LLM action uses the retrieved step, not the cover'
)
assert.deepStrictEqual(
  resolveDemoAction({ demoId: 'easyenv', stepNumber: 1 }, [interviewStep]),
  { demoId: 'easyenv', stepNumber: 4 },
  'LLM cover-step is upgraded to the retrieved step of the same demo'
)
assert.deepStrictEqual(
  resolveDemoAction({ demoId: 'easyenv', stepNumber: 7 }, [interviewStep]),
  { demoId: 'easyenv', stepNumber: 7 },
  'explicit later step is kept'
)
assert.strictEqual(resolveDemoAction(null, [cover]), null, 'summary-only retrieval does not navigate')
assert.strictEqual(resolveDemoAction(null, []), null)

const allowed = [{ _id: 'demo1', name: 'EasyEnv' }]
assert.deepStrictEqual(
  resolveDemoAction({ type: 'open_demo', stepNumber: 3 }, [], {
    currentDemoId: 'demo1', allowedDemos: allowed,
  }),
  { demoId: 'demo1', stepNumber: 3 },
  'step-only action uses the open demo'
)
assert.deepStrictEqual(
  resolveDemoAction({ demoId: 'EasyEnv', stepNumber: 3 }, [], { allowedDemos: allowed }),
  { demoId: 'demo1', stepNumber: 3 },
  'demo name maps to allowed id'
)
assert.deepStrictEqual(
  resolveDemoAction(null, [], {
    answer: 'Navigating you to step 3 of the EasyEnv demo.',
    defaultDemoId: 'demo1',
    allowedDemos: allowed,
  }),
  { demoId: 'demo1', stepNumber: 3 },
  'step mentioned in the answer still emits an action'
)
assert.deepStrictEqual(
  resolveDemoAction({ demoId: '<id from the list>', stepNumber: 3 }, [], {
    defaultDemoId: 'demo1', allowedDemos: allowed,
  }),
  { demoId: 'demo1', stepNumber: 3 },
  'placeholder demoId falls back to the default demo'
)
assert.deepStrictEqual(
  resolveDemoAction(null, [], {
    answer: 'I will take you to step four of the demo now.',
    currentDemoId: 'demo1',
    allowedDemos: allowed,
  }),
  { demoId: 'demo1', stepNumber: 4 },
  'word step numbers in the answer still emit an action'
)

const draftAgent = {
  workspaceId: 'ws1',
  allowedDemoIds: ['easyenv'],
  defaultDemoId: 'easyenv',
}
assert.deepStrictEqual(
  allowedDemosQuery(draftAgent, 'published'),
  { workspaceId: 'ws1', deletedAt: null, _id: { $in: ['easyenv'] } },
  'published mode still allows an unpublished demo the author attached'
)
assert.deepStrictEqual(
  allowedDemosQuery({ workspaceId: 'ws1' }, 'published'),
  { workspaceId: 'ws1', deletedAt: null, isPublished: true },
  'no allow-list in published mode = published stories only'
)

console.log('agentKnowledge.check.js: all assertions passed')
