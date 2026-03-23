import mongoose from 'mongoose'
import ScreenTransitionTypes from '../constants/ScreenTransitionTypes.js'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
  discriminatorKey: 'type'
}


const ScreenScreenshotTransitionSchema = new mongoose.Schema({
  frameX: { type: Number },
  frameY: { type: Number },
  text: { type: String }, // screen | website | none
  gotoType: { type: String }, // screen | website | next | none
  gotoWebsite: { type: String },
  gotoScreen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' },
  type: { type: String }, //EClick | Hotspot

}, options)

export default  ScreenScreenshotTransitionSchema
