import AuthTokenTypes from '../constants/AuthTokenTypes.js'
import AuthTokenStatuses from '../constants/AuthTokenStatuses.js'
import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
  discriminatorKey: 'type'
}

// define the Auth Tokens Schema
const AuthTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  type: { type: String, default: AuthTokenTypes.AuthToken },
  status: { type: String, default: AuthTokenStatuses.ACTIVE},
  clientId: { type: String, default: 'customScopes' },
  scopes: [
    { type: String }
  ]
}, options)


export default  AuthTokenSchema

