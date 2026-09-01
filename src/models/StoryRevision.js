import mongoose from 'mongoose'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: false },
}

const StoryRevision = new mongoose.Schema({
  storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story', index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },

  // Which stack the entry sits on. POST /undo consumes 'undo' entries,
  // POST /redo consumes 'redo' entries. A fresh edit wipes all 'redo' entries.
  kind: { type: String, enum: ['undo', 'redo'], default: 'undo' },

  scope: { type: String, enum: ['screen', 'story'] },
  actionLabel: { type: String, default: '' }, // e.g. 'step:update' — shown in the history UI

  // scope === 'screen'
  screenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' },
  screenPreImage: { type: mongoose.Schema.Types.Mixed }, // full lean Screen doc

  // scope === 'story'
  storyPreImage: { type: mongoose.Schema.Types.Mixed },  // { name, status, custom, screens }
  screenIndexes: { type: mongoose.Schema.Types.Mixed },  // [{ _id, index }] of every screen at capture time
  fullScreens: { type: mongoose.Schema.Types.Mixed },    // full Screen docs — only when the route can delete screens
}, options)

// LIFO pop per story is the hot query
StoryRevision.index({ storyId: 1, kind: 1, _id: -1 })

export default StoryRevision
