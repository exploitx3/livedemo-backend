import mongoose from 'mongoose'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
  discriminatorKey: 'type'
}

import ScreenStepSchema from './ScreenStep.js'
// const ScreenTransitionSchema = require('./ScreenTransition')

import ScreenTransitionSchema from './ScreenTransition.js'
import ScreenPageTransitionSchema from './ScreenPageTransition.js'

const ScreenPage = new mongoose.Schema({

    contentPath: { type: String },
    width: { type: mongoose.Number},
    height: { type: mongoose.Number},


  }, options
)

export default  ScreenPage
