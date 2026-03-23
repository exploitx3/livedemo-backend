import mongoose from 'mongoose'
import ScreenTransitionTypes from '../constants/ScreenTransitionTypes.js'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
  discriminatorKey: 'type'

}


const ScreenPageTransitionSchema = new mongoose.Schema({
  selector: { type: String },
  gotoType: { type: String }, // screen | website | none
  gotoWebsite: { type: String },
  gotoScreen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' },
  type: { type: String }, //EClick | Hotspot

}, options)

export default  ScreenPageTransitionSchema
