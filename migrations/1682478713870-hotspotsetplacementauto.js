'use strict'
import moment from 'moment'
import { setupDB, getModels } from '../src/models.js'
import StepViewTypes from '../src/constants/StepViewTypes.js'
import ScreenPopupTypes from '../src/constants/ScreenPopupTypes.js'
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

      return Models.Screen.find({ steps: { $exists: true, $not: { $size: 0 } } }).lean()
    })
    .then((screenDocs) => {
      let updateOps = []

      screenDocs.forEach(screenDoc => {

        screenDoc.steps.forEach(step => {

          let newStep = JSON.parse(JSON.stringify(step))

          if (step.view.hotspot && !step.view.hotspot.placement) {
            newStep.view.hotspot.placement = 'auto'



            let updateObj = {
              'steps.$.view.hotspot.placement': newStep.view.hotspot.placement,
            }

            updateOps.push({
              updateOne: {
                filter: { _id: screenDoc._id, 'steps._id': step._id },
                update: {
                  $set: updateObj,
                }
              }
            })
          }

          if (step.view.pointer && step.view.pointer.placement) {
            newStep.view.pointer.placement = 'auto'



            let updateObj = {
              'steps.$.view.pointer.placement': newStep.view.pointer.placement,
            }

            updateOps.push({
              updateOne: {
                filter: { _id: screenDoc._id, 'steps._id': step._id },
                update: {
                  $set: updateObj,
                }
              }
            })
          }

        })
      })

      return Models.Screen.bulkWrite(updateOps, { strict: false })

    })
    .then((result) => {
      console.log(result)
      console.log('docs updated')
    })

    .catch(err => {

      console.log(err)

    })

}
