import StoryStatuses from '../constants/StoryStatuses.js'
import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}


const Session = new mongoose.Schema({

    // sessionId: {
    //   type: String,
    //   index: true,
    //   unique: true
    // },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
    storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
    clientIpData: {},
    startTimestamp: { type: Number},
    endTimestamp: { type: Number},
    duration: { type: Number},
    eventsClickCount: {type: Number, default: 0},
    stepsCount: {type: Number},
    dropOffStep: {type: Number},
    didPlay: {type: Boolean, default: false},
    didComplete: {type: Boolean, default: false},
  }, options
)

export default  Session
