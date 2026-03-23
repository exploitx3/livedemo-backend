import AuthTokenTypes from '../constants/AuthTokenTypes.js'
import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
  discriminatorKey: 'type'
}

// define the Auth Tokens Schema
const AuthToken_UserSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, options)


export default  AuthToken_UserSchema

