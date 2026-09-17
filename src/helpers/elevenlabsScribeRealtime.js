import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import ENV from '../envServer.js'

export const SCRIBE_WS_BASE = 'wss://api.elevenlabs.io/v1/speech-to-text/realtime'
export const SCRIBE_PCM_RATE = 16000
const SCRIBE_KEYTERMS = ['LiveDemo', 'HubSpot', 'Salesforce', 'SaaS', 'demo']

let client

function getClient() {
  if (!client) {
    const apiKey = ENV.ELEVENLABS_API_KEY
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not configured')
    }
    client = new ElevenLabsClient({ apiKey })
  }
  return client
}

function resolveRealtimeModel() {
  const configured = ENV.ELEVENLABS_SCRIBE_MODEL || 'scribe_v2_realtime'
  return configured === 'scribe_v2' ? 'scribe_v2_realtime' : configured
}

export function buildScribeRealtimeUrl(token, modelId) {
  const params = new URLSearchParams({
    model_id: modelId,
    audio_format: 'pcm_16000',
    commit_strategy: 'vad',
    vad_silence_threshold_secs: '0.5',
    min_speech_duration_ms: '100',
    min_silence_duration_ms: '100',
    language_code: 'en',
    no_verbatim: 'true',
    token,
  })
  SCRIBE_KEYTERMS.forEach(term => params.append('keyterms', term))
  return `${SCRIBE_WS_BASE}?${params}`
}

// Mint a single-use token so the browser can open Scribe realtime WS
// without seeing ELEVENLABS_API_KEY.
export default async function createScribeRealtimeSession() {
  const modelId = resolveRealtimeModel()
  const result = await getClient().tokens.singleUse.create('realtime_scribe')
  const token = result?.token || result?.data?.token
  if (!token) {
    throw new Error('Could not create Scribe realtime token')
  }

  return {
    url: buildScribeRealtimeUrl(token, modelId),
    sampleRate: SCRIBE_PCM_RATE,
  }
}
