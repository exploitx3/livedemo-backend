import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {

  let schema = {}


  schema = Joi.object().presence('optional').keys({
    chargeId: Joi.string().allow('').custom((chargeId) => {
      if (validator.isMongoId(chargeId) || chargeId === '') {
        return chargeId
      } else {
        throw new Error('incorrect chargeId')
      }
    }),
    subscriptionId: Joi.string().custom((subscriptionId) => {
      if (validator.isMongoId(subscriptionId)) {
        return subscriptionId
      } else {
        throw new Error('incorrect subscriptionId')
      }
    })
  })
  const result = schema.validate(body)

  return result
}

export default  validateBody