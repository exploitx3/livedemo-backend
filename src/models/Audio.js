import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}


const AudioSchema = new mongoose.Schema({
  audioUrl: {type: String, default: ''},
  text: {type: String, default: ''},
  voiceType: {type: String, default: ''}, // ID of the voice from ElevenLabs
  audioType: {type: String, default: 'ai'}, // ai | recorded | uploaded
  timestamp:{
    alignment: {
      characters: [{type: String, default: ''}],
      character_start_times_seconds: [{type: Number, default: ''}],
      character_end_times_seconds: [{type: Number, default: ''}],
    },
    normalized_alignment: {
      characters: [{type: String, default: ''}],
      character_start_times_seconds: [{type: Number, default: ''}],
      character_end_times_seconds: [{type: Number, default: ''}],
    }
  },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  active: {type: Boolean, default: true},
  deletedAt: {type: Date, default: null}
}, options)

export default  AudioSchema
