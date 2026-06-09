import Joi from '@hapi/joi'

function validateBody(body) {

  let schema = Joi.object().keys({
    additionalContentSecurityPolicy: Joi.string().allow('').required(),
  })

  const result = schema.validate(body)

  return result
}

export default validateBody
