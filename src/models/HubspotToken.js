import mongoose from 'mongoose'

const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true }
}

// define the HubSpot Token Schema
const HubspotTokenSchema = new mongoose.Schema({
  accessToken: { type: String, required: true, unique: true },
  refreshToken: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  hubspotUserId: { type: String, required: true, unique: true },
  hubspotUserEmail: { type: String, required: true, unique: true },
  workspaceId: { type: mongoose.Schema.ObjectId, ref: 'Workspace', required: true },
  hubspotUserFirstName: { type: String, required: false },
  hubspotUserLastName: { type: String, required: false },
  hubspotUserPhone: { type: String, required: false },
  hubspotUserCompany: { type: String, required: false },
  hubspotUserCompanyId: { type: String, required: false },
  hubspotUserCompanyName: { type: String, required: false },
  hubspotUserCompanyDomain: { type: String, required: false },
}, options)

export default HubspotTokenSchema

