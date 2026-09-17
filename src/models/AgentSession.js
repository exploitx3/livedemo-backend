import mongoose from 'mongoose'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}

// Analogue of Session.js for agent visits. Never written into Session —
// getWorkspaceSessions groups by storyId and chat visits would break demo numbers.
const AgentSession = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'AiDemoAgent', required: true, index: true },

  // Editor sessions are excluded from analytics
  mode: { type: String, enum: ['published', 'editor'], default: 'published' },

  visitorName: { type: String },
  visitorEmail: { type: String },
  visitorSessionId: { type: String },

  clientIpData: {},

  startTimestamp: { type: Number },
  endTimestamp: { type: Number },
  duration: { type: Number }, // ms, set on hang-up / session_ended

  stage: { type: String, default: 'welcome' },
  summary: { type: String },
  topics: [String],

  currentDemoId: { type: mongoose.Schema.Types.ObjectId },
  currentStepId: { type: mongoose.Schema.Types.ObjectId },
  currentStepNumber: { type: Number, default: 1 },
  viewedDemoIds: [{ type: mongoose.Schema.Types.ObjectId }],

  messageCount: { type: Number, default: 0 },
  demosOpenedCount: { type: Number, default: 0 },
  suggestionClickCount: { type: Number, default: 0 },
  ctaClickCount: { type: Number, default: 0 },

  leadId: { type: mongoose.Schema.Types.ObjectId },
}, options)

AgentSession.index({ workspaceId: 1, startTimestamp: -1 })
AgentSession.index({ agentId: 1, startTimestamp: -1 })

export default AgentSession
