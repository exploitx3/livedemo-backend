import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    name: Joi.string().required(),
    // shortId: Joi.string().required(),
    screenshots: Joi.object(),
    tabInfo: Joi.object(),
    windowMeasures: Joi.object(),
    aspectRatio: Joi.number(),


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

export default  validateBody
