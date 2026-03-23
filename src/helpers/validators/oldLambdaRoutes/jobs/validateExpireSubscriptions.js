import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    subscriptions: Joi.array().custom((subId) => {
      if (validator.isMongoId(subId)) {

        return subId
      } else {

        throw new Error('incorrect subscriptionId')
      }
    }).required()
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody