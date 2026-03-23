import Joi from '@hapi/joi'
import validator from 'validator'
import FormTypes from '../../../constants/FormTypes.js'

function validateBody(body) {


  let schema = Joi.object().keys({
    title: Joi.string().optional(),
    type: Joi.string().valid(FormTypes.STEP, FormTypes.HUBSPOT).optional(),
    hubspot: Joi.object().keys({
      formId: Joi.string().optional(),
      portalId: Joi.string().optional(),
      embedVersion: Joi.number().optional()
    }).optional()
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
