import WorkspaceTypes from '../constants/WorkspaceTypes.js'
import mongoose from 'mongoose'
import mongooseLongFunction from 'mongoose-long'
mongooseLongFunction(mongoose)

const options = {
  strict: false,
  timestamps: { createdAt: true, updatedAt: true },
  typeKey: '$type'
}

const WorkspaceSchema = new mongoose.Schema({
    name: { $type: String, default: '' },
    type: { $type: String, default: WorkspaceTypes.EMPTY }, // startup | pro | business
    integrations: {
      hubspot: { $type: Boolean, default: false },
    },
    adminUser: { $type: mongoose.Schema.ObjectId, ref: 'User'},
    users: [
      { $type: mongoose.Schema.ObjectId, ref: 'User' }
    ],
    subscriptions: [
      { $type: mongoose.Schema.ObjectId, ref: 'Subscription' }
    ],
    liveDemos: [{
      $type: mongoose.Schema.Types.ObjectId, ref: 'LiveDemo', default: []
    }],
    invitedEmails: [
      {$type: String, default: []}
    ],
    library: {
      pages: [
        { $type: mongoose.Schema.Types.ObjectId, ref: 'Screen' },
      ],
      screenshots: [
        { $type: mongoose.Schema.Types.ObjectId, ref: 'Screen' },
      ],
      videos: [
        { $type: mongoose.Schema.Types.ObjectId, ref: 'Screen' },
      ]
    }
  }, options
)

export default  WorkspaceSchema
