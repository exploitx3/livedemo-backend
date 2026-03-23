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

    name: { type: String },
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
  }, options
)

export default  Screen
