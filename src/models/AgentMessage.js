import mongoose from 'mongoose'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: false },
}

// The transcript (not rrweb). Analytics drill-in shows these.
const AgentMessage = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AgentSession', index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'AiDemoAgent' },
  role: { type: String, enum: ['user', 'assistant'] },
  content: { type: String },
  source: { type: String, enum: ['text', 'voice', 'suggestion'], default: 'text' },
  actions: [{}], // validated content_card payloads emitted with this turn
}, options)

export default AgentMessage
