import mongoose from 'mongoose'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: false },
}

// Analogue of StoryRevision.js for AiDemoAgent. Snapshots the agent doc +
// its AgentKnowledgeSource docs (never chunks/embeddings — reindex on revert).
const AgentRevision = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'AiDemoAgent', index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },

  kind: { type: String, enum: ['undo', 'redo'], default: 'undo' },
  actionLabel: { type: String, default: '' }, // 'persona:update', 'knowledge:add', 'demos:update', ...

  // Pre-image of the editable agent fields (not isPublished, not links)
  agentPreImage: { type: mongoose.Schema.Types.Mixed },

  // Pre-image of this agent's AgentKnowledgeSource docs
  sourcesPreImage: { type: mongoose.Schema.Types.Mixed },
}, options)

// LIFO pop per agent is the hot query
AgentRevision.index({ agentId: 1, kind: 1, _id: -1 })

export default AgentRevision
