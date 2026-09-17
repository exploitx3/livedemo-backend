import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}

const Lead = new mongoose.Schema({

    formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form' },
    storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
    liveDemoId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveDemo' },
    screenId: { type: mongoose.Schema.Types.ObjectId, ref: 'screenId' },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    // Set when the lead came from an AI Demo Agent connect modal (no storyId then)
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'AiDemoAgent' },
    agentSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AgentSession' },
    // Mixed: shortText/selector strings, checkbox booleans, any future field types
    data: { type: mongoose.Schema.Types.Mixed, default: {} }
  }, options
)

export default  Lead
