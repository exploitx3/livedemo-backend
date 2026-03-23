import mongoose from 'mongoose'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
  discriminatorKey: 'type'
}

import ScreenScreenshotTransitionSchema from './ScreenScreenshotTransition.js'
import ScreenTransitionSchema from './ScreenTransition.js'
import ZoomSpanScreenshotSchema from "./ZoomSpanScreenshot.js";

const ScreenScreenshot = new mongoose.Schema({
    imageUrl: { type: String },
  }, options
)

export default  ScreenScreenshot
