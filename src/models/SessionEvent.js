import StoryStatuses from '../constants/StoryStatuses.js'
import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}


const SessionEvent = new mongoose.Schema({


    eventData: {
      type: { type: Number },
      data: {},
      dataSource: {type: Number},
      dataType: {type: Number},
      timestamp: {type: Number},
    },
    stepIndex: {type: Number, default: 0},
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
    storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' }
  }, options
)

export default  SessionEvent
