import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}

const DemoActivityEvent = new mongoose.Schema({

    name: { type: String }, // channel | workspace
    storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
    data: { }
  }, options
)

export default DemoActivityEvent

