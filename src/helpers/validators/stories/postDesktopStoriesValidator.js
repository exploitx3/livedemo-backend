
import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    name: Joi.string().required(),
    capturedEvents: Joi.array(),
    videoBase64: Joi.string().required(),
    screenshots: Joi.object(),
    windowMeasures: Joi.object(),
    videoStartMs: Joi.number().required(),
    videoEndMs: Joi.number().required(),
    storyId: Joi.string().custom((storyId) => {
      if (validator.isMongoId(storyId)) {

        return storyId
      } else {

        throw new Error('incorrect storyId')
      }
    }).optional(),
    workspaceId: Joi.string().custom((workspaceId) => {
      if (validator.isMongoId(workspaceId)) {

        return workspaceId
      } else {

        throw new Error('incorrect workspaceId')
      }
    }).required(),
  })

  const result = schema.validate(body)

  return result
}

export default validateBody
