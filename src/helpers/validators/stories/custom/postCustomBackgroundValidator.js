import Joi from '@hapi/joi'

function validateBody(body) {
  const schema = Joi.object().keys({
    isActive: Joi.boolean().required(),
    backgroundColor: Joi.string().allow('').required(),
    backgroundBlur: Joi.number().min(0).max(64).required(),
    backgroundType: Joi.string().valid('wallpaper', 'gradient', 'color').required(),
    wallpaperImage: Joi.string().allow('').required(),
    padding: Joi.number().min(0).max(200).required()
  })

  return schema.validate(body)
}

export default validateBody
