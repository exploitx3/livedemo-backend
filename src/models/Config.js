import StoryStatuses from '../constants/StoryStatuses.js'
import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}


const Config = new mongoose.Schema({
    lastWarmDate: { type: Date},
  }, options
)

export default  Config
