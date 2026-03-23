import mongoose from 'mongoose'

const options = {
    strict: true,
    timestamps: {createdAt: true, updatedAt: true},
}


const DemoSuggestion = new mongoose.Schema({

        name: {type: String, default: ''}, //
        description: {type: String, default: ''}, //
        workspaceId: {type: mongoose.Schema.Types.ObjectId, ref: 'Workspace'},
        liveDemoId: {type: mongoose.Schema.Types.ObjectId, ref: 'Story'},
        autoRecordingId: {type: mongoose.Schema.Types.ObjectId, ref: 'AutoRecording'},
        thumbnailImageData: {type: String, default: null},
        steps: [
            {
                type: {type: String, default: ''},
                x: {type: Number, default: 0},
                y: {type: Number, default: 0},
                openAiImageId: {type: String, default: ''},
                autoRecordingEventId: {type: mongoose.Schema.Types.ObjectId, ref: 'AutoRecordingEvent'},
                explanation: {type: String, default: ''}
            }
        ],
        windowMeasures: {},

    }, options
)

export default DemoSuggestion
