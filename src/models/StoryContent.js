import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}


const StoryContent = new mongoose.Schema({
  storyId: {type: mongoose.Schema.Types.ObjectId, ref: 'Story'},
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  videoUrl: {type: String, default: ''},
  gifUrl: {type: String, default: ''}
}, options)

export default StoryContent
