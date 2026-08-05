import mongoose from 'mongoose'
import FormFieldTypes from '../constants/FormFieldTypes.js'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}


const FormSchema = new mongoose.Schema({
  index: { type: Number }, //View, Action
  type: {type: String, default: ''}, // step, screen
  fields: [{
    label: {type: String, default: ''},
    name: {type: String, default: ''},
    type: {type: String, default: FormFieldTypes.SHORT_TEXT}, // shortText, selector, checkbox
    required: {type: Boolean, default: true},
    index: {type: Number, default: 0},
    // selector: { options: [{ key, value }] }; checkbox: { checked }
    typeData: {
      options: [{
        key: {type: String, default: ''},
        value: {type: String, default: ''}
      }],
      checked: {type: Boolean, default: false}
    }
  }],
  hubspot: {
    formId: {type: String, default: ''},
    portalId: {type: String, default: ''},
    embedVersion: {type: Number, default: 2},
  },
  useCaptcha: {type: Boolean, default: false},
  showTopLabels: {type: Boolean, default: false},
  showBackground: {type: Boolean, default: false},
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
  stepId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScreenStep' },
  transitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScreenTransition' },
  liveDemoId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveDemo' },
  screenId: {type: mongoose.Schema.Types.ObjectId, ref: 'Screen'  },
  leads: {type: mongoose.Schema.Types.ObjectId, ref: 'Lead'}
})

export default  FormSchema
