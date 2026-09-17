import aiHelpers from '../aiHelpers.js'

const MAX_TTS_CHARS = 5000

// ElevenLabs TTS for agent read-aloud. Returns null when voice off or TTS fails.
export default async function speakAgentText(agent, text) {
  const spoken = String(text || '').trim().slice(0, MAX_TTS_CHARS)
  if (!agent.voiceEnabled || !agent.voiceId || !spoken) return null

  const tts = await aiHelpers.elTextToSpeech(agent.voiceId, spoken)
  if (!tts?.buffer?.length) return null

  return {
    audioBase64: tts.buffer.toString('base64'),
    mimeType: 'audio/mpeg',
  }
}
