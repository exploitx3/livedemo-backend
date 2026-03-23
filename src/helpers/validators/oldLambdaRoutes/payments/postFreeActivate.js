import Joi from '@hapi/joi'
import SubscriptionTypes from '../../../../constants/SubscriptionTypes.js'
import validator from 'validator'

function validateBody(body) {


    let schema = Joi.object().keys({
      subscriptionType: Joi.string().custom((subscriptionType, helpers) => {
        if (SubscriptionTypes[subscriptionType.toUpperCase()]) {
          return subscriptionType
        } else {
          throw new Error('Invalid SubscriptionType')
        }
      }),
      workspaceId: Joi.string().custom((workspaceId) => {
        if (validator.isMongoId(workspaceId)) {
          return workspaceId
        } else {
          throw new Error('incorrect workspaceId')
        }
      })
    })


  const result = schema.validate(body)

  return result
}

export default  validateBody