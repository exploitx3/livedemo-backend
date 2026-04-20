import mongoose from 'mongoose'

const options = {
    strict: true,
    timestamps: { createdAt: true, updatedAt: true },
}

/**
 * Lightweight public-facing tutorial record used for landing-page search.
 * Each document mirrors a "tutorial" story published on livedemo.ai/tutorials.
 */
const TutorialSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, index: 'text' },
        slug: { type: String, required: true, unique: true, index: true },
        image: { type: String, default: '' },
        category: { type: String, default: 'tutorial' },
        liveDemoUrl: { type: String, default: '' },
        publishedAt: { type: Date, default: null },
        draft: { type: Boolean, default: false },
    },
    options,
)

export default TutorialSchema
