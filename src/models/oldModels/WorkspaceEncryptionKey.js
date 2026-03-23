import mongoose from 'mongoose'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true }
}

const WorkspaceEncryptionKey = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  publicKey: { type: String },
  privateKey: { type: String },
  passphraseSalt: { type: String },
  passphraseIV: { type: String }

  }, options
)

export default  WorkspaceEncryptionKey
