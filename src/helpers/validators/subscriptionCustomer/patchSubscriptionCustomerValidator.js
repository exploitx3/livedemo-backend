import Joi from '@hapi/joi'

function validateBody(body) {
  const schema = Joi.object().keys({
    autoPay: Joi.boolean().required(),
  })

  return schema.validate(body)
}

export default validateBody
