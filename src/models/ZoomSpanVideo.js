import mongoose from 'mongoose'
import ScreenTransitionTypes from '../constants/ScreenTransitionTypes.js'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}


const ZoomSpanVideoSchema = new mongoose.Schema({
  startTime: { type: Number, default: 2.5},
  duration: { type: Number, default: 2.5},
  width: { type: Number, default: 0},
  height: { type: Number, default: 0},
  editorWidth: { type: Number, default: 0},
  editorHeight: { type: Number, default: 0},
  offsetX: { type: Number, default: 0},
  offsetY: { type: Number, default: 0}
}, options)

export default  ZoomSpanVideoSchema
