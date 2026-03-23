import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    workspaceId: Joi.string().custom((workspaceId) => {
      if (validator.isMongoId(workspaceId)) {

        return workspaceId
      } else {

        throw new Error('incorrect workspaceId')
      }
    }).optional(),
    page: Joi.number().required(),
    startDate: Joi.date().timestamp().optional(),
    endDate: Joi.date().timestamp().optional(),
    limit: Joi.number().optional(),
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody