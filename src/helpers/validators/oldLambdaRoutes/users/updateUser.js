import Joi from '@hapi/joi'

function validateBody(body) {


  let schema = Joi.object().keys({
    timezone: Joi.string().optional()
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody