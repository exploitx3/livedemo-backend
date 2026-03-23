import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    index: Joi.number().required(),
    view: {
      viewType: Joi.string().required()
    }
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
