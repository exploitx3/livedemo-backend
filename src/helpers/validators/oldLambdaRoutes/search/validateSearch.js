import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    channelId: Joi.string().custom((channelId) => {
      if (validator.isMongoId(channelId)) {

        return channelId
      } else {

        throw new Error('incorrect channelId')
      }
    }).required(),
    query: Joi.string().required(),
    page: Joi.number().required(),
    startDate: Joi.date().timestamp(),
    endDate: Joi.date().timestamp()
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody