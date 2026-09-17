import mongoose from 'mongoose'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}

// A knowledge source belongs to exactly one AiDemoAgent. There is no
// workspace-global knowledge pool. Chunks are derived, never edited by hand.
const AgentKnowledgeSource = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'AiDemoAgent', required: true, index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },

  type: { type: String, enum: ['text', 'file', 'url', 'faq', 'demo'] },
  title: { type: String, default: '' },

  // text / faq (and extracted file/url text — see postAgentKnowledge)
  rawText: { type: String, default: '' },

  // file
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  mimeType: { type: String, default: '' },
  fileBase64: { type: String, default: '' }, // PDF kept for native gemini-embedding-2 reindex
  pageCount: { type: Number, default: 0 },

  // url
  url: { type: String, default: '' },

  // demo (auto-generated from a Story — not user-uploaded)
  demoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },

  status: { type: String, enum: ['pending', 'indexing', 'ready', 'error'], default: 'pending' },
  errorMessage: { type: String, default: '' },
  chunkCount: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true },
}, options)

export default AgentKnowledgeSource
