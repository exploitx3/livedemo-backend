// Self-check for anam.js + speakAgentText PCM branch — run: node src/helpers/agent/anam.check.js
// Fails (non-zero exit) if stock filtering, model pick, token payload, or the
// avatar → PCM / no avatar → MP3 switch breaks.
import assert from 'assert'
import ENV from '../../envServer.js'
import aiHelpers from '../aiHelpers.js'
import { avatarIsLive, createAnamSessionToken, listStockAvatars, listStockVoices, pickAvatarModel, usesAnamVoice } from './anam.js'
import speakAgentText from './speakAgentText.js'

assert.strictEqual(pickAvatarModel({ activeVersion: 'cara-3', availableVersions: ['cara-3'] }), 'cara-3')
assert.strictEqual(pickAvatarModel({ activeVersion: 'cara-4-latest', availableVersions: ['cara-4-latest', 'cara-4'] }), 'cara-4')
assert.strictEqual(avatarIsLive({ avatarsEnabled: false, anamAvatarId: 'a' }), false)
assert.strictEqual(avatarIsLive({ avatarsEnabled: true, anamAvatarId: '' }), false)
assert.strictEqual(avatarIsLive({ avatarsEnabled: true, anamAvatarId: 'a' }), true)

ENV.ANAM_API_KEY = 'test-key'
const calls = []
globalThis.fetch = async (url, options = {}) => {
  calls.push({ url, options })
  assert.strictEqual(options.headers.Authorization, 'Bearer test-key')
  if (url.includes('/auth/session-token')) {
    return { ok: true, json: async () => ({ sessionToken: 'tok' }) }
  }
  const page = Number(new URL(url).searchParams.get('page'))
  const data = page === 1
    ? [{ id: 'stock1', displayName: 'Cara', imageUrl: 'i', videoUrl: 'signed', activeVersion: 'cara-4', availableVersions: ['cara-4'], createdByOrganizationId: null }]
    : [{ id: 'custom1', displayName: 'Mine', createdByOrganizationId: 'org' }]
  return { ok: true, json: async () => ({ data, meta: { next: page === 1 ? 2 : null } }) }
}

const list = await listStockAvatars()
assert.deepStrictEqual(list.map(a => a.id), ['stock1'], 'custom avatars must be filtered out')
assert.strictEqual(list[0].videoUrl, undefined, 'signed video URLs must not be returned')
await listStockAvatars()
assert.strictEqual(calls.length, 2, 'avatar list should be cached')

const voices = await listStockVoices()
assert.deepStrictEqual(voices.map(v => v.id), ['stock1'], 'custom voices must be filtered out')
assert.strictEqual(calls.length, 4, 'voices list is cached separately from avatars')

const liveAgent = { _id: 'agent1', avatarsEnabled: true, anamAvatarId: 'stock1', anamAvatarModel: 'cara-4' }

assert.strictEqual(await createAnamSessionToken(liveAgent), 'tok')
assert.deepStrictEqual(JSON.parse(calls[4].options.body).personaConfig,
  { avatarId: 'stock1', avatarModel: 'cara-4', enableAudioPassthrough: true })

const anamVoiceAgent = { ...liveAgent, avatarVoice: 'anam', anamVoiceId: 'voice1' }
assert.strictEqual(usesAnamVoice(anamVoiceAgent), true)
assert.strictEqual(usesAnamVoice({ ...anamVoiceAgent, anamVoiceId: '' }), false, 'no voice id → ElevenLabs')
assert.strictEqual(usesAnamVoice({ ...anamVoiceAgent, avatarsEnabled: false }), false)
await createAnamSessionToken(anamVoiceAgent)
assert.deepStrictEqual(JSON.parse(calls[5].options.body).personaConfig,
  { avatarId: 'stock1', avatarModel: 'cara-4', voiceId: 'voice1', llmId: 'CUSTOMER_CLIENT_V1', skipGreeting: true },
  'Anam voice must keep the Anam LLM off and skip passthrough')

const ttsCalls = []
aiHelpers.elTextToSpeech = async (voiceId, text, opts) => {
  ttsCalls.push(opts)
  return { buffer: Buffer.from([1, 0, 2, 0]) }
}
const voiced = { voiceEnabled: true, voiceId: 'v1' }

const mp3 = await speakAgentText({ ...voiced, avatarsEnabled: false, anamAvatarId: 'stock1' }, 'hi')
assert.strictEqual(mp3.mimeType, 'audio/mpeg')
assert.deepStrictEqual(ttsCalls[0], {})

const pcm = await speakAgentText({ ...voiced, avatarsEnabled: true, anamAvatarId: 'stock1' }, 'hi')
assert.strictEqual(pcm.encoding, 'pcm_s16le')
assert.strictEqual(pcm.sampleRate, 16000)
assert.deepStrictEqual(ttsCalls[1], { outputFormat: 'pcm_16000' })

const silent = await speakAgentText({ ...voiced, ...anamVoiceAgent }, 'hi')
assert.strictEqual(silent, null, 'Anam voice must not call ElevenLabs')
assert.strictEqual(ttsCalls.length, 2)

globalThis.fetch = async () => ({
  ok: false,
  status: 429,
  headers: new Headers({ 'retry-after': '30', 'x-ratelimit-remaining': '0' }),
  text: async () => 'slow down',
})
await assert.rejects(
  createAnamSessionToken(liveAgent),
  err => err.resultResponse.statusCode === 429,
  'Anam 429 must surface as 429',
)

globalThis.fetch = async () => { throw new Error('ECONNRESET') }
await assert.rejects(
  createAnamSessionToken(liveAgent),
  err => err.resultResponse.statusCode === 503,
  'network error must surface as 503',
)

console.log('anam.check OK')
process.exit(0)
