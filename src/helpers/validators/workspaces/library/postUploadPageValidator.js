import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {
  const schema = Joi.object().keys({
    storyId: Joi.string().custom((storyId) => {
      if (validator.isMongoId(storyId)) {
        return storyId
      }
      throw new Error('incorrect storyId')
    }).required(),
    events: Joi.array().min(1).required(),
    imageData: Joi.string().allow('').required(),
    width: Joi.number().required(),
    height: Joi.number().required(),
    name: Joi.string().optional().default('Base'),
  })

  return schema.validate(body)
}

export default validateBody
