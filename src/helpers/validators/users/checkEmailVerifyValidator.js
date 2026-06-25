import Joi from '@hapi/joi'

function validateBody(body) {
  const schema = Joi.object().keys({
    code: Joi.string().length(6).pattern(/^\d+$/).required(),
  })

  return schema.validate(body)
}

export default validateBody
