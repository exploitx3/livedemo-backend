// node src/helpers/agent/lemonslice.check.js
import assert from 'assert'
import crypto from 'crypto'
import ENV from '../../envServer.js'
import { livekitToken, buildSessionBody, findStockAvatar, STOCK_AVATARS, AVATAR_IDENTITY } from './lemonslice.js'

ENV.LIVEKIT_API_KEY = 'APIkey'
ENV.LIVEKIT_API_SECRET = 'secret'
ENV.LIVEKIT_URL = 'wss://example.livekit.cloud'

function decode(jwt) {
  const [header, payload, signature] = jwt.split('.')
  const expected = crypto.createHmac('sha256', 'secret').update(`${header}.${payload}`).digest('base64url')
  assert.strictEqual(signature, expected, 'HS256 signature')
  assert.deepStrictEqual(JSON.parse(Buffer.from(header, 'base64url')), { alg: 'HS256', typ: 'JWT' })
  return JSON.parse(Buffer.from(payload, 'base64url'))
}

const visitor = decode(livekitToken({ identity: 'visitor-1', room: 'r1', grants: { canPublish: false, canSubscribe: true, canPublishData: true } }))
assert.strictEqual(visitor.iss, 'APIkey')
assert.strictEqual(visitor.sub, 'visitor-1')
assert.deepStrictEqual(visitor.video, { roomJoin: true, room: 'r1', canPublish: false, canSubscribe: true, canPublishData: true })
assert.ok(visitor.exp > visitor.nbf)
assert.strictEqual(visitor.kind, undefined)

const avatar = decode(livekitToken({ identity: AVATAR_IDENTITY, room: 'r1', kind: 'agent', attributes: { 'lk.publish_on_behalf': 'visitor-1' } }))
assert.strictEqual(avatar.kind, 'agent')
assert.deepStrictEqual(avatar.video, { roomJoin: true, room: 'r1' })
assert.deepStrictEqual(avatar.attributes, { 'lk.publish_on_behalf': 'visitor-1' })

const face = STOCK_AVATARS[0]
assert.strictEqual(findStockAvatar(face.id), face)
assert.strictEqual(findStockAvatar('nope'), null)
assert.strictEqual(new Set(STOCK_AVATARS.map(a => a.id)).size, STOCK_AVATARS.length, 'unique ids')

const body = buildSessionBody(face, 'tok')
assert.strictEqual(body.transport_type, 'livekit')
assert.deepStrictEqual(body.properties, { livekit_url: 'wss://example.livekit.cloud', livekit_token: 'tok' })
assert.strictEqual(body.agent_image_url, face.imageUrl)
assert.ok(!('agent_id' in body), 'agent_id and agent_image_url are mutually exclusive')
assert.strictEqual(body.edit_image, false, 'stock images are not reframed')

const raw = buildSessionBody({ imageUrl: 'https://x/raw.jpg', custom: true, reframed: false }, 'tok')
assert.strictEqual(raw.edit_image, true, 'raw upload gets reframed by LemonSlice')
assert.strictEqual(raw.edit_image_variant, 'bust')
assert.strictEqual(buildSessionBody({ imageUrl: 'https://x/v.jpg', custom: true, reframed: true }, 'tok').edit_image, false)

console.log('lemonslice.check ok')
