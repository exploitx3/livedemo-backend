import Joi from '@hapi/joi'

function validateBody(body) {
  let schema = Joi.object().keys({
    token: Joi.string().required(),
  })

  const result = schema.validate(body)

  return result
}

export default validateBody
