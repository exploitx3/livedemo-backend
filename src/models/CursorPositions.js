import mongoose from 'mongoose'

const options = {
    strict: true,
    timestamps: {createdAt: true, updatedAt: true},
}

const CursorPositions = new mongoose.Schema({
    storyId: {type: mongoose.Schema.Types.ObjectId, ref: 'Story', required: true, index: true},
    frameX: {type: Number, required: true},
    frameY: {type: Number, required: true},
    timeMs: {type: Number, required: true},
}, options)

export default CursorPositions