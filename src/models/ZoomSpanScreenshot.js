import mongoose from 'mongoose'

const options = {
    strict: true,
    timestamps: {createdAt: true, updatedAt: true},
}


const ZoomSpanScreenshotSchema = new mongoose.Schema({
    delay: {type: Number, default: 2.5},
    duration: {type: Number, default: 0},
    width: {type: Number, default: 0},
    height: {type: Number, default: 0},
    editorWidth: {type: Number, default: 0},
    editorHeight: {type: Number, default: 0},
    offsetX: {type: Number, default: 0},
    offsetY: {type: Number, default: 0},
}, options)

export default ZoomSpanScreenshotSchema
