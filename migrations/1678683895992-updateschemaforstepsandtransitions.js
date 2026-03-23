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

// module.exports.up()

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

      return Models.Screen.find({ customTransitions: { $exists: true, $not: { $size: 0 } } }).lean()
    })
    .then((screenDocs) => {
      let updateOps = []

      screenDocs.forEach(screenDoc => {

        screenDoc.customTransitions.forEach(transition => {

          let content = transition.text ? `<p>${transition.text}</p>` : ''

          if (transition.type === 'Hotspot') {

            let hotspotObj = {
              frameX: transition.frameX,
              frameY: transition.frameY,
              placement: 'auto'
            }

            if(hotspotObj.frameX) {
              updateOps.push({
                updateOne: {
                  filter: { _id: screenDoc._id, 'customTransitions._id': transition._id },
                  update: {
                    $set: {
                      'customTransitions.$.hotspot': hotspotObj,
                      'customTransitions.$.content': content,
                    },
                    $unset: {
                      'customTransitions.$.text': 1,
                      'customTransitions.$.frameX': 1,
                      'customTransitions.$.frameY': 1,
                    }
                  }
                }
              })
            }



          } else {

            let pointerObj = {
              selector: transition.selector ? transition.selector : '',
            }
            if(pointerObj.selector) {

              updateOps.push({
                updateOne: {
                  filter: { _id: screenDoc._id, 'customTransitions._id': transition._id },
                  update: {
                    $set: {
                      'customTransitions.$.pointer': pointerObj,
                      'customTransitions.$.content': content,
                    },
                    $unset: {
                      'customTransitions.$.text': 1,
                      'customTransitions.$.selector': 1,
                    }
                  }
                }
              })
            }



          }


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
