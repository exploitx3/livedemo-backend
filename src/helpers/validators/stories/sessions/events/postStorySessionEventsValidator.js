import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    events: Joi.array(),
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
