import mongoose from 'mongoose'
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
    type: {type: String, default: 'shortText'}, // shortText
    required: {type: Boolean, default: true},
    typeData: {}
  }],
  hubspot: {
    formId: {type: String, default: ''},
    portalId: {type: String, default: ''},
    embedVersion: {type: Number, default: 2},
  },
  title: {type: String, default: 'Get in touch with us'},
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
  stepId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScreenStep' },
  transitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScreenTransition' },
  liveDemoId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveDemo' },
  screenId: {type: mongoose.Schema.Types.ObjectId, ref: 'Screen'  },
  leads: {type: mongoose.Schema.Types.ObjectId, ref: 'Lead'}
})

export default  FormSchema
