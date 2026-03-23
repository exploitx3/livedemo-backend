import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}


const AutoRecordingEvent = new mongoose.Schema({



    eventData: {
      data: {},
      timestamp: {type: Number}
    },
    autoRecordingId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutoRecording' },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  }, options
)

export default  AutoRecordingEvent
