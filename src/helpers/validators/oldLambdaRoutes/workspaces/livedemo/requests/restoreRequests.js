import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {
  schema = Joi.object().keys({
    requestIds: Joi.array().custom((requestIds) => {
      for (let i = 0; i < requestIds.length; i++) {
        let reqId = requestIds[i]

        if (!validator.isMongoId(reqId)) {

          throw new Error('incorrect requestIds')
        }
      }

      return requestIds

    }).required()
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
