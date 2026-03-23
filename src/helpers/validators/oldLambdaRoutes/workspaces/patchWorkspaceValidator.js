import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    name: Joi.string().optional(),
    invitedEmails: Joi.array().items(Joi.string()).optional(),
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
