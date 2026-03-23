import EmailTypes from '../constants/EmailTypes.js'
import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true }
}

// define the Auth Tokens Schema
const EmailSchema = new mongoose.Schema({

  type: { type: String }, // EmailTypes
  templateProps: {},
  templateData: {},
  toAddresses: [
    { type: String }
  ],
  messageId: { type: String }
}, options)


export default  EmailSchema

