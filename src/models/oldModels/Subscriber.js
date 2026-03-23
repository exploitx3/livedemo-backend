import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}

const Subscriber = new mongoose.Schema({
    subscriberHash: { type: String },
    email: { type: String },

  }, options
)

export default  Subscriber
