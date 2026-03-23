import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    subscriptionId: Joi.string().custom((subscriptionId) => {
      if (validator.isMongoId(subscriptionId)) {

        return subscriptionId
      } else {

        throw new Error('incorrect subscriptionId')
      }
    }).required()
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody