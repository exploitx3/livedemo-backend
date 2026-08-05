import Joi from '@hapi/joi'
import FormFieldTypes from '../../../constants/FormFieldTypes.js'

// Empty strings allowed while editing; strip mongoose option _ids
const optionSchema = Joi.object().keys({
  key: Joi.string().allow('').required(),
  value: Joi.string().allow('').required(),
}).unknown(true)

function validateBody(body) {
  let schema = Joi.object().keys({
    label: Joi.string().optional(),
    name: Joi.string().optional(),
    type: Joi.string().valid(
      FormFieldTypes.SHORT_TEXT,
      FormFieldTypes.SELECTOR,
      FormFieldTypes.CHECKBOX
    ).optional(),
    required: Joi.boolean().optional(),
    index: Joi.number().optional(),
    typeData: Joi.object().keys({
      options: Joi.array().items(optionSchema).optional(),
      checked: Joi.boolean().optional(),
    }).optional(),
  }).min(1)

  return schema.validate(body)
}

export default validateBody
