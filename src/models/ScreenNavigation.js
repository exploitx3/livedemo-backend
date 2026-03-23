import mongoose from 'mongoose'
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}


const ScreenNavigationSchema = new mongoose.Schema({
  selector: { type: String },
  gotoType: { type: String }, // screen | website | none
  gotoWebsite: { type: String },
  gotoScreen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' },
})

export default  ScreenNavigationSchema
