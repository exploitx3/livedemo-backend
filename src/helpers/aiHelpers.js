import OpenAI from "openai"
import ENV from '../envServer.js'
import {ElevenLabsClient} from "elevenlabs";

const openai = new OpenAI({
    apiKey: ENV.OPENAI_API_KEY,
})


const elevenlabs = new ElevenLabsClient({
    apiKey: ENV.ELEVENLABS_API_KEY
});

function query3_5(message) {
    return openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k",
        messages: [{"role": "system", "content": message}],
        temperature: 0.5,
    })
        .then(response => {
            console.log(response.choices[0].message.content)

            return response.choices[0].message.content
        })
        .catch(err => {

            console.log(err)
            throw err
        })
}


function textToSpeech(type, text) {

    return openai.audio.speech.create({
        model: "tts-1",
        voice: type,
        input: text,
    })
        .then(response => {
            return response.arrayBuffer()
        })
        .then((responseArrayBuffer) => {

            const buffer = Buffer.from(responseArrayBuffer)

            return buffer
            // return fs.promises.writeFile(path.resolve("./speech.mp3"), buffer)
        })
        .catch(err => {

            console.log(err)
        })
}


async function elTextToSpeech(voiceId, text) {

    return await elevenlabs.textToSpeech.convertWithTimestamps(voiceId, {
        text: text,
    })
        .then(response => {
            let audioBase64 = response.audio_base64
            let alignment = response.alignment
            let normalizedAlignment = response.normalized_alignment

            return {
                audioBase64,
                alignment,
                normalizedAlignment
            }
        })
        .then(({
                   audioBase64,
                   alignment,
                   normalizedAlignment
               }) => {

            const buffer = Buffer.from(audioBase64, 'base64')

            return {
                buffer,
                alignment,
                normalizedAlignment
            }
        })
        .catch(err => {

            console.log(err)
        })
}

async function elGetVoices(collectionId) {

    return await elevenlabs.voices.search({
        collection_id: collectionId,
        sort_direction: "asc",
        page_size: 20
    })
        .then(response => {
            let voices = response.voices
            let hasMore = response.has_more
            let totalCount = response.total_count
            let nextPageToken = response.next_page_token

            return {
                voices,
                hasMore,
                totalCount,
                nextPageToken
            }
        })
        .catch(err => {

            console.log(err)
        })
}

export default {
    query3_5: query3_5,
    textToSpeech: textToSpeech,
    elTextToSpeech: elTextToSpeech,
    elGetVoices: elGetVoices,
}
