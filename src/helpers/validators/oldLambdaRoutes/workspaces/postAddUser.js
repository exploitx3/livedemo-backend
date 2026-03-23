import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    email: Joi.string(),
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
