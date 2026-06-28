import mongoose from 'mongoose'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}

const LaunchConfigSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  totalSpots: { type: Number, default: 100 },
  spotsTaken: { type: Number, default: 0 },
  launchDate: { type: Date, default: null },
}, options)

export default LaunchConfigSchema
