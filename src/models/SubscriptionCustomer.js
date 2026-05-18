import mongoose from 'mongoose'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}

const SubscriptionCustomer = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
  subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' }],
  charges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Charge' }],
  autoPay: { type: Boolean, default: true },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
}, options)

export default SubscriptionCustomer
