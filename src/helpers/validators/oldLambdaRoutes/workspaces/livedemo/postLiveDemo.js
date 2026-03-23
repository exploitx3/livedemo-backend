import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    name: Joi.string().required(),
    path: Joi.string().required(),
    firstDocPath: Joi.string().required(),
    sessionRecordingId: Joi.string().required(),
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
