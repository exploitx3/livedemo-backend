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

          if(transition.content === '') {

            let newContent = "<p></p>"

            updateOps.push({
              updateOne: {
                filter: { _id: screenDoc._id, 'customTransitions._id': transition._id },
                update: {
                  $set: {
                    'customTransitions.$.content': newContent,
                  }
                }
              }
            })
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
