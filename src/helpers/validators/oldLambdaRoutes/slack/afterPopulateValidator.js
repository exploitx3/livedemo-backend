import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {

  let schema = {}


  schema = Joi.object().presence('optional').keys({
    workspaceId: Joi.string().custom((workspaceId) => {
      if (validator.isMongoId(workspaceId)) {
        return workspaceId
      } else {
        throw new Error('incorrect workspaceId')
      }
    })
  })
  const result = schema.validate(body)

  return result
}

export default  validateBody