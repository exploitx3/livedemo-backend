import mongoose from 'mongoose'
import ScreenType from '../constants/ScreenTypes.js'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
  discriminatorKey: 'type'
}

import ScreenTransitionSchema from './ScreenTransition.js'
import ScreenStepSchema from './ScreenStep.js'

const Screen = new mongoose.Schema({

    name: { type: String, default: '' },
    storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },

    type: { type: String, default: ScreenType.SCREEN_SCREENSHOT}, // Screen_Page, Screen_Screenshot, Screen_Video
    steps: [
      ScreenStepSchema
    ],
    customTransitions: [
      ScreenTransitionSchema
    ],

    index: { type: Number },
    imageUrl: {type: String},

    // rrweb DOM-demo fields (also on Screen_Page; must live on base Screen so
    // Story.populate('screens') does not strip them under strict mode)
    recordingRole: { type: String, enum: ['base', 'delta'] },
    baseScreenId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' },
    snapshotPath:  { type: String },
    eventsPath:    { type: String },
    eventCount:    { type: Number },
    fromTimeMs:    { type: Number },
    toTimeMs:      { type: Number },
  }, options
)

export default  Screen
