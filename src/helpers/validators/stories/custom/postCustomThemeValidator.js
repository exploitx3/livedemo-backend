import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    isActive: Joi.boolean().required(),
    stepBackgroundColor: Joi.string().required(),
    textColor: Joi.string().required(),
    buttonBackgroundColor: Joi.string().required(),
    buttonTextColor: Joi.string().required(),
    watermarkConfig: {
      isActive: Joi.boolean().required(),
      text: Joi.string().allow('').required(),
      url: Joi.string().uri().allow('').required(),
    },
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
