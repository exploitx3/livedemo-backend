import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    exportId: Joi.string().custom((channelId) => {
      if (validator.isMongoId(channelId)) {

        return channelId
      } else {

        throw new Error('incorrect exportId')
      }
    }).required()
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody