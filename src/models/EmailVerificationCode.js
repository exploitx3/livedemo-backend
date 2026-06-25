import mongoose from 'mongoose'

const EmailVerificationCodeStatuses = {
  ACTIVE: 'active',
  DEACTIVATED: 'deactivated',
}

const EmailVerificationCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  code: { type: String, required: true },
  status: {
    type: String,
    enum: Object.values(EmailVerificationCodeStatuses),
    default: EmailVerificationCodeStatuses.ACTIVE,
  },
}, {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
})

export { EmailVerificationCodeStatuses }
export default EmailVerificationCodeSchema
