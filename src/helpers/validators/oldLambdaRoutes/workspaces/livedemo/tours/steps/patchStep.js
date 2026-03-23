import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    view: Joi.object().keys({
      viewType: Joi.string().optional(),
      content: Joi.string().optional(),
      selector: Joi.string().allow(null, '').optional(),
      placement: Joi.string().optional(),
    }).optional(),
    action: Joi.object().keys({
      actionType: Joi.string().optional(),
      selector: Joi.string().allow(null, '').optional(),
    }).optional(),
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
