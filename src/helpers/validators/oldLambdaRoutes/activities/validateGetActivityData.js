import Joi from '@hapi/joi'
import validator from 'validator'
import Emotions from '../../../../constants/Emotions.js'

function validateBody(body) {


  let schema = Joi.object().keys({
    workspaceId: Joi.string().custom((workspaceId) => {
      if (validator.isMongoId(workspaceId)) {

        return workspaceId
      } else {

        throw new Error('incorrect workspaceId')
      }
    }).required(),
    memberSlackId: Joi.string().required(),
    startTimestamp: Joi.date().timestamp().required(),
    endTimestamp: Joi.date().timestamp().required()
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody