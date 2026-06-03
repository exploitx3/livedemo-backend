import StoryStatuses from '../constants/StoryStatuses.js'
import mongoose from 'mongoose'
import StoryTypes from "../constants/StoryTypes.js";

const options = {
    strict: true,
    timestamps: {createdAt: true, updatedAt: true},
}


const Story = new mongoose.Schema({

        name: {type: String},
        // shortId: { type: String,
        //   index: true,
        //   unique: true
        // },
        workspaceId: {type: mongoose.Schema.Types.ObjectId, ref: 'Workspace'},
        userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        screens: {
            type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Screen'}],
            default: []
        },
        filePath: {type: String, default: ''},
        status: {type: String, default: StoryStatuses.UPLOADING},
        demoSuggestionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DemoSuggestion' },
    
        isPublished: {type: Boolean, default: false},
        type: {type: String, default: StoryTypes.web}, // web, desktop
        capturedEvents: [],
        tabInfo: {},
        windowMeasures: {},
        videoStartMs: {type: mongoose.Schema.Types.Number},
        videoEndMs: {type: mongoose.Schema.Types.Number},
        aspectRatio: {type: mongoose.Schema.Types.String},
        hasCursorPositions: {type: Boolean},
        content: {
            contentStatus: {type: String, default: ''}, //updating, ready
            contentId: {type: mongoose.Schema.Types.ObjectId, ref: 'StoryContent'}
        },
        custom: {
            header: {
                isActive: {type: Boolean, default: false},
                imageUrl: {type: String, default: ''},
                personName: {type: String, default: ''},
                text: {type: String, default: ''}
            },
            theme: {
                isActive: {type: Boolean, default: false},
                stepBackgroundColor: {type: String, default: '#1070ff'}, // backgroundColor
                backgroundColor: {type: String, default: '#FFFFFF'}, // backgroundColor
                textColor: {type: String, default: '#FFFFFF'}, // textColor
                buttonBackgroundColor: {type: String, default: '#1070ff'},// buttonColor
                buttonTextColor: {type: String, default: '#FFFFFF'}, // buttonColor
                watermarkConfig: {
                    imageUrl: {type: String, default: ''},
                    text: {type: String, default: ''},
                    url: {type: String, default: ''},
                    isActive: {type: Boolean, default: false},
                }
            },
            misc: {
                isActive: {type: Boolean, default: false},
                confettiOnLastStep: {type: Boolean, default: true},
                isOmniBarDisabled: {type: Boolean, default: false},
                isLiveDemoWatermarkEnabled: {type: Boolean, default: true},
                isTabsEnabled: {type: Boolean, default: true},
            },
            background: {
                isActive: {type: Boolean, default: false},
                backgroundColor: {type: String, default: '#FFFFFF'},
                backgroundBlur: {type: Number, default: 0},
                backgroundType: {type: String, default: 'color'}, // wallpaper | gradient | color
                wallpaperImage: {type: String, default: ''},
                padding: {type: Number, default: 24},
            },
            variables: [
                {
                    name: String,
                    value: String
                }
            ],
        },

        thumbnailImageUrl: {type: String, default: ''},

        links: [
            {type: String, ref: 'Link'}
        ],
        deletedAt: {type: Date, default: null}
    }, options
)

export default Story
