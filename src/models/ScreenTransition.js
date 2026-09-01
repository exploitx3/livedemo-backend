import mongoose from 'mongoose'
import ScreenTransitionTypes from '../constants/ScreenTransitionTypes.js'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}


const ScreenPageTransitionSchema = new mongoose.Schema({
  type: { type: String, default: ScreenTransitionTypes.HOTSPOT}, //EClick | Hotspot
  pointer: {
    selector: {type: String, default: ''},
    selectorLocation: {
      positionX: {type: Number, default: 200},
      positionY: {type: Number, default: 200},
      width: {type: Number, default: 150},
      height: {type: Number, default: 50}
    },
    placement: {type: String, default: 'auto'},
    targetMode: {type: String, default: 'select'},
    tooltipX: {type: Number, default: 200},
    tooltipY: {type: Number, default: 200},
  },
  hotspot: {
    frameX: { type: Number, default: 200 },
    frameY: { type: Number, default: 200 },
    placement: {type: String, default: 'auto'},
  },
  popup: {
    type: {type: String, default: 'post'}, //post, form, start, iframe
    formId: {type:  mongoose.Schema.Types.ObjectId, ref: 'Form', default: null },
  },
  gotoType: { type: String }, // screen | website | next
  gotoWebsite: { type: String },
  gotoScreen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' },
  content: {type: String, default: ''},
  nextButtonText: {type: String, default: 'Next'},
  showStepNumbers: {type: Boolean, default: true},
}, options)

export default  ScreenPageTransitionSchema
