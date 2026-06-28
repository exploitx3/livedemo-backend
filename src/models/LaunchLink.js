import mongoose from 'mongoose'
import short from 'short-uuid'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}

const LaunchLinkSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => short.generate(),
  },
  personName: { type: String, default: '' },
  platform: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  subscriberId: { type: String, default: '' },
  hasOpen: { type: Boolean, default: false },
  hasSubscribed: { type: Boolean, default: false },
}, options)

export default LaunchLinkSchema
