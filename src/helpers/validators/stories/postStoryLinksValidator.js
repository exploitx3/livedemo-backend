import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let variable =  Joi.object().keys({
    name: Joi.string().required(),
    value: Joi.string().required(),
  })



  let schema = Joi.object().keys({
    name: Joi.string().allow("").optional(),
    // variables: Joi.array().items(variable)
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
