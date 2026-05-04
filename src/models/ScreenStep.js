import mongoose from 'mongoose'
import ZoomSpanScreenshotSchema from "./ZoomSpanScreenshot.js";
import PopupAlignments from "../constants/PopupAlignments.js";
import StepAutoPlayTypes from "../constants/StepAutoPlayTypes.js";
const options = {
  strict: true,
  timestamps: { createdAt: true, updatedAt: true },
}


const ScreenStepSchema = new mongoose.Schema({
  index: { type: Number }, //View, Action
  view: {
    viewType: {type: String, default: 'hotspot'}, // hotspot, pointer, popup, none
    pointer: {
      selector: {type: String, default: ''},
      selectorLocation: {
        positionX: {type: Number, default: 200},
        positionY: {type: Number, default: 200},
        width: {type: Number, default: 150},
        height: {type: Number, default: 50}
      },
      placement: {type: String, default: 'auto'},
    },
    hotspot: {
      frameX: { type: Number, default: 200 },
      frameY: { type: Number, default: 200 },
      placement: {type: String, default: 'auto'},
    },
    popup: {
      type: {type: String, default: 'popup'}, //popup, form, start, iframe
      formId: {type:  mongoose.Schema.Types.ObjectId, ref: 'Form', default: null },
      showOverlay: {type: Boolean, default: false},
      title: {type: String, default: 'Title'},
      description: {type: String, default: '<p>Description</p>'},
      alignment: {type: String, default: PopupAlignments.center}, // center, left, right
      showPreviewImage: {type: Boolean, default: false},
      previewImageUrl: {type: String, default: ''},
      buttons: [{
        index: {type: Number, default: 0},
        text: {type: String, default: "Next"}, // screen | website | none
        gotoType: {type: String}, // screen | website | next | none
        gotoWebsite: {type: String},
        gotoScreen: {type: mongoose.Schema.Types.ObjectId, ref: 'Screen'},
        textColor: {type: String, default: '#FFFFFF'},// buttonColor
        backgroundColor: {type: String, default: '#1070ff'},// buttonColor

      }]
    },
    content: {type: String, default: ''},
    nextButtonText: {type: String, default: 'Next'},
    showStepNumbers: {type: Boolean, default: true},
    showHeader: {type: Boolean, default: false},
    showFooter: {type: Boolean, default: false},
    /*
      top, top-start, top-end
      bottom, bottom-start, bottom-end
      left, left-start, left-end
      right, right-start, right-end
      auto (it will choose the best position)
      center (set the target to body)
     */

  },
  zoomSpan: ZoomSpanScreenshotSchema,
  stepAudioId: {type:  mongoose.Schema.Types.ObjectId, ref: 'Audio', default: null },
  elementData: {
    targetHTML: {type: String, default: ''},
    targetElementType: {type: String, default: 'element'},
    targetText: {type: String, default: ''},
  },
  autoPlayConfig: {
    enabled: {type: Boolean, default: false},
    type: {type: String, default: StepAutoPlayTypes.auto}, // auto, manual
    delay: {type: Number, default: 2},
  },
  action: {
    actionType: {type: String, default: 'NextButton'}, // NextButton, ElementClick
    selector: {type: String, default: ''},
  }

})

export default  ScreenStepSchema
