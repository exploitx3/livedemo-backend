import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    isActive: Joi.boolean().required(),
    imageUrl: Joi.string().allow('').required(),
    personName: Joi.string().required(),
    text: Joi.string().required(),
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
