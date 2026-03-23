import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}

const Script = new mongoose.Schema({

    liveDemoId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveDemo' },
    type: { type: String }, //js or css
    text: { type: String },
  }, options
)

export default  Script
