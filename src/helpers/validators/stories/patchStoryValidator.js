import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    name: Joi.string().optional(),
    status: Joi.string().valid('uploading', 'ready', 'failed').optional(),
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
