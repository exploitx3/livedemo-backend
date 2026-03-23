import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}


const StepAudioSchema = new mongoose.Schema({
  audioUrl: {type: String, default: ''},
  text: {type: String, default: ''},
  voiceType: {type: String, default: ''},
  stepId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScreenStep' },
  storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
  screenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' },
  active: {type: Boolean, default: true}
})

export default  StepAudioSchema
