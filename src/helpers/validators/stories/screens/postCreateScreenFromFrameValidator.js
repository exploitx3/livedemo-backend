import Joi from '@hapi/joi'

function validateBody(body) {
  const schema = Joi.object().keys({
    time: Joi.number().min(0).required(),
  })

  return schema.validate(body)
}

export default validateBody
