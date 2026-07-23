import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {
  // Legacy static HTML path (no recordingRole)
  if (!body || !body.recordingRole) {
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      content: Joi.string().required(),
      imageData: Joi.string().required(),
      width: Joi.number().required(),
      height: Joi.number().required(),
    })

    return schema.validate(body)
  }

  // rrweb base / delta path
  const schema = Joi.object().keys({
    name: Joi.string().required(),
    recordingRole: Joi.string().valid('base', 'delta').required(),
    baseScreenId: Joi.when('recordingRole', {
      is: 'delta',
      then: Joi.string().custom((baseScreenId) => {
        if (validator.isMongoId(baseScreenId)) {
          return baseScreenId
        }
        throw new Error('incorrect baseScreenId')
      }).required(),
      otherwise: Joi.forbidden(),
    }),
    events: Joi.array().min(1).required(),
    fromTimeMs: Joi.number().required(),
    toTimeMs: Joi.number().required(),
    imageData: Joi.string().allow('').required(),
    width: Joi.number().required(),
    height: Joi.number().required(),
  })

  return schema.validate(body)
}

export default validateBody
