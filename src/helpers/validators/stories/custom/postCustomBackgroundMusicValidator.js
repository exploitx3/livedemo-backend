import Joi from '@hapi/joi'

function validateBody(body) {
  let schema = Joi.object().keys({
    isActive: Joi.boolean().required(),
    backgroundMusicVolume: Joi.number().min(0).max(100).required(),
    backgroundMusicUrl: Joi.string().allow('').optional(),
  })

  const result = schema.validate(body)

  return result
}

export default validateBody
