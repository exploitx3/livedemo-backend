import mongoose from 'mongoose'

// Minimal schema for populate/ref; strict:false allows legacy documents in DB.
const options = {
  strict: false,
  timestamps: { createdAt: true, updatedAt: true }
}

const WorkspaceMemberSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, default: 'member' },
  slackAccessTokens: [{
    token: { type: String },
    scopes: []
  }],
  deleted: { type: Boolean, default: false }
}, options)

export default WorkspaceMemberSchema
