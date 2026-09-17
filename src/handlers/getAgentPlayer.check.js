// Self-check for getAgentPlayer.js — run: node src/handlers/getAgentPlayer.check.js
// Fails (non-zero exit) if the HTML shell loses its mount node, bundle tag,
// window.config, payload hygiene, or the </script> escaping.
import assert from 'assert'
import handler from './getAgentPlayer.js'

const agentDoc = {
  _id: 'agent1',
  name: 'Evil</script><script>alert(1)</script>',
  workspaceId: 'ws1',
  welcomeMessage: 'hi',
  starterQuestions: [],
  avatarUrl: '',
  voiceEnabled: true,
  visitorCapture: { enabled: false },
  cta: {},
  isPublished: true, // publish gate open — no auth stubbing needed
  defaultDemoId: null, // skips validateDemoAction — no Story stub needed
  systemPrompt: 'SECRET_PROMPT',
}

const req = {
  mongo: { Models: { AiDemoAgent: { findOne: async () => agentDoc } } },
  params: { agentId: 'agent1' },
  query: {},
  headers: {},
}

let sentBody = null
let sentStatus = null
const res = {
  set() {},
  status(code) { sentStatus = code; return this },
  send(body) { sentBody = body },
}

await handler(req, res)

assert.strictEqual(sentStatus, 200, 'expected 200')
assert.ok(sentBody.includes('id="reactAgentApp"'), 'mount node missing')
assert.ok(sentBody.includes('agentInjectScript.bundle.js'), 'bundle script tag missing')
assert.ok(sentBody.includes('window.config ='), 'window.config missing')
assert.ok(!sentBody.includes('SECRET_PROMPT'), 'systemPrompt leaked into config')
assert.ok(!sentBody.includes('</script><script>alert'), 'agent name broke out of the config script tag')

const cfg = JSON.parse(sentBody.match(/window\.config = (.*?)<\/script>/)[1])
assert.strictEqual(cfg.agent._id, 'agent1')
assert.strictEqual(cfg.mode, 'published')
assert.strictEqual(cfg.sessionId, null)

console.log('getAgentPlayer.check OK')
