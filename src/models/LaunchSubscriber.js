import mongoose from 'mongoose'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}

const LaunchSubscriberSchema = new mongoose.Schema({
  email: { type: String, default: '' },
  launchLinkId: { type: String, default: '' },
  launchId: { type: String, default: '' },
}, options)

export default LaunchSubscriberSchema
