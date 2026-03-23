import Joi from '@hapi/joi'
import validator from 'validator'
import ExportTypes from '../../../../constants/ExportTypes.js'

function validateBody(body) {


  let schema = Joi.object().keys({
    exportId: Joi.string().custom((channelId) => {
      if (validator.isMongoId(channelId)) {

        return channelId
      } else {

        throw new Error('incorrect exportId')
      }
    }).required(),
    type: Joi.string().custom(type => {
      if(ExportTypes[type.toUpperCase()]) {

        return type
      } else {

        throw new Error('incorrect type')
      }

    }).required(),
    isIm: Joi.boolean().optional()

  })

  const result = schema.validate(body)

  return result
}

export default  validateBody