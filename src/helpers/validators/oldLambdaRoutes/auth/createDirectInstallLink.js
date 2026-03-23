import Joi from '@hapi/joi'
import SubscriptionTypes from '../../../../constants/SubscriptionTypes.js'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    workspaceMemberId: Joi.string().required()
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody