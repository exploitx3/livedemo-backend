import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    responseBodyEncoded: Joi.string(),
    headers: Joi.object().unknown(true)
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
