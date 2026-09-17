import mongoose from 'mongoose'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}

// A published, shareable workspace object. Sits beside Story, never touches it.
// Access is workspace membership (validateUserHasAccessToWorkspace), not userId.
const AiDemoAgent = new mongoose.Schema({
  name: { type: String },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // creator only
  isPublished: { type: Boolean, default: false },

  welcomeMessage: { type: String, default: 'Hey, welcome! What brought you here today?' },
  starterQuestions: { type: [String], default: [] },
  systemPrompt: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },

  voiceEnabled: { type: Boolean, default: false },
  voiceId: { type: String, default: '' },

  // Imported Stories (same workspace). Not copies. Empty = all published stories in the workspace.
  allowedDemoIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Story' }],
  // Opens step 1 on the right when a session starts. Must be allowed (or any published story if list empty).
  defaultDemoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story', default: null },

  // This agent's knowledge library. Every id must have AgentKnowledgeSource.agentId === this._id.
  knowledgeSourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AgentKnowledgeSource' }],

  visitorCapture: {
    enabled: { type: Boolean, default: false },
    requireName: { type: Boolean, default: false },
    requireEmail: { type: Boolean, default: false },
  },

  cta: {
    bookMeetingUrl: { type: String, default: '' },
    startTrialUrl: { type: String, default: '' },
  },

  links: [{ type: String, ref: 'Link' }],
  deletedAt: { type: Date, default: null },
}, options)

// Same shape as the Story list query
AiDemoAgent.index({ workspaceId: 1, deletedAt: 1 })

export default AiDemoAgent
