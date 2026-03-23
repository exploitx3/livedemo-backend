import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}

import StepSchema from './Step.js'

const Tour = new mongoose.Schema({

    name: { type: String }, // channel | workspace
    options: {
      shouldAutoStart: {type: Boolean, default: true},
      startOnPath: {type: String, default: '/'}
    },
    steps: [
      StepSchema
    ],
    liveDemoId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveDemo' },

  }, options
)

export default  Tour
