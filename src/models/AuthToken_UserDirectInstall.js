import AuthTokenTypes from '../constants/AuthTokenTypes.js'
import AuthTokenStatuses from '../constants/AuthTokenStatuses.js'
import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
  discriminatorKey: 'type'
}

const AuthToken_UserDirectInstallSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  workspaceMemberSlackId: { type: String },
  workspaceMemberId: { type: String }
}, options)


export default AuthToken_UserDirectInstallSchema

