import aiHelpers from '../aiHelpers.js'
import { avatarIsLive, usesAnamVoice } from './anam.js'

const MAX_TTS_CHARS = 5000
export const AVATAR_PCM_RATE = 16000

// ElevenLabs TTS for agent read-aloud. Returns null when voice off or TTS fails.
// Avatar on: raw PCM s16le 16 kHz mono — the only format Anam passthrough takes.
// Anam voice: null — the browser sends the text to Anam, no ElevenLabs call.
export default async function speakAgentText(agent, text) {
  const spoken = String(text || '').trim().slice(0, MAX_TTS_CHARS)
  if (usesAnamVoice(agent)) return null
  if (!agent.voiceEnabled || !agent.voiceId || !spoken) return null

  const pcm = avatarIsLive(agent)
  const tts = await aiHelpers.elTextToSpeech(agent.voiceId, spoken, pcm ? { outputFormat: `pcm_${AVATAR_PCM_RATE}` } : {})
  if (!tts?.buffer?.length) return null

  if (pcm) {
    return {
      audioBase64: tts.buffer.toString('base64'),
      mimeType: 'audio/pcm',
      encoding: 'pcm_s16le',
      sampleRate: AVATAR_PCM_RATE,
    }
  }

  return {
    audioBase64: tts.buffer.toString('base64'),
    mimeType: 'audio/mpeg',
  }
}
