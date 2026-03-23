'use strict'
import moment from 'moment'
import { setupDB, getModels } from '../src/models.js'
import axios from 'axios.js'
import shortHash from 'short-hash.js'
import { ObjectId } from 'mongodb.js'

module.exports.up = function (next) {

  return migrate()
    .then(() => {
      next()
    })
}

module.exports.down = function (next) {
  next()
}

module.exports.up()

function migrate() {


  var Models
  var newLiveDemoId
  var fullPath

  return setupDB()
    .then(conn => getModels(conn))
    .then(ModelsResult => {
      Models = ModelsResult

    })
    .then(() => {

      return Models.Screen.find({ customNavigation: { $exists: true, $not: { $size: 0 } } }).lean()
    })
    .then((screenDocs) => {
      let updateOps = []

      screenDocs.forEach(screenDoc => {

        screenDoc.customNavigation.forEach(nav => {
          let newTransition = {
            type: 'pointer',
            pointer: {
              selector: nav.selector,
              selectorLocation: {
                positionX: 200,
                positionY: 200,
                width: 150,
                height: 50
              },
              placement: 'auto',
            },
            hotspot: {
              frameX: 200,
              frameY: 200,
              placement: 'auto',
            },
            popup: {
              type: 'post', //post, form, start, iframe
              formId: null,
            },
            gotoType: nav.gotoType, // screen | website | next
            gotoWebsite: nav.gotoWebsite || '', // screen | website | next
            gotoScreen: nav.gotoScreen, // screen | website | next
            content: '',
            nextButtonText: 'Next',
            showStepNumbers: true,
          }

/*
  selector: { type: String },
  gotoType: { type: String }, // screen | website | none
  gotoWebsite: { type: String },
  gotoScreen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' },
 */

/*
   type: { type: String, default: ScreenTransitionTypes.HOTSPOT}, //EClick | Hotspot
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
    type: {type: String, default: 'post'}, //post, form, start, iframe
    formId: {type:  mongoose.Schema.Types.ObjectId, ref: 'Form', default: null },
  },
  gotoType: { type: String }, // screen | website | next
  gotoWebsite: { type: String },
  gotoScreen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen' },
  content: {type: String, default: ''},
  nextButtonText: {type: String, default: 'Next'},
  showStepNumbers: {type: Boolean, default: true},
 */


          updateOps.push({
            updateOne: {
              filter: { _id: screenDoc._id },
              update: {
                $push: {
                  'customTransitions': newTransition,
                }
              }
            }
          })
        })


      })

      return Models.Screen.bulkWrite(updateOps, {strict: false})

    })
    .then((result) => {
      console.log(result)
      console.log('docs updated')
    })

    .catch(err => {

      console.log(err)

    })

}
