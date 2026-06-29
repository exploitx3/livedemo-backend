import SubscriptionTypes from '../constants/SubscriptionTypes.js'
import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true }
}

const Subscription = new mongoose.Schema({
    type: { type: String }, // one of SubscriptionTypes
    workspaceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }],
    chargeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Charge' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subscriptionCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionCustomer',
    },
    autoPay: { type: Boolean, default: false },
    expired: { type: Boolean, default: false },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    expireDate: { type: Date },
    active: { type: Boolean, default: false },
    // exportsAllowed: { type: Number, default: 0 },
    // instantUpdatesAllowed: { type: Number, default: 0 },
    membersAllowed: { type: Number, default: 1 },
    adminsAllowed: { type: Number, default: 0 },
    attachedJobs: [
      { type: mongoose.Schema.ObjectId, ref: 'Job' }
    ],
  }, options
)

export default  Subscription
