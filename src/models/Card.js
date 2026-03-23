import ChargeStatuses from '../constants/ChargeStatuses.js'
import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true }
}

const Card = new mongoose.Schema({
    brand: { type: String },
    checks: { type: Object },
    country: { type: String },
    expMonth: { type: String },
    expYear: { type: String },
    fingerprint: { type: String },
    funding: { type: String },
    generatedFrom: { type: String },
    last4: { type: String },
    threeDSecureUsage: {
      supported: {
        type: String
      }
    },
    wallet: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paymentMethodId: { type: String },
    isPrimary: { type: Boolean }
  }, options
)

export default  Card
