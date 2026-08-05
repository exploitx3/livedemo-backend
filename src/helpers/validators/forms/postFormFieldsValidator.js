import Joi from '@hapi/joi'
import FormFieldTypes from '../../../constants/FormFieldTypes.js'

const optionSchema = Joi.object().keys({
  key: Joi.string().allow('').required(),
  value: Joi.string().allow('').required(),
}).unknown(true)

function validateBody(body) {
  let schema = Joi.object().keys({
    label: Joi.string().required(),
    name: Joi.string().required(),
    type: Joi.string().valid(
      FormFieldTypes.SHORT_TEXT,
      FormFieldTypes.SELECTOR,
      FormFieldTypes.CHECKBOX
    ).default(FormFieldTypes.SHORT_TEXT),
    required: Joi.boolean().optional(),
    index: Joi.number().optional(),
    typeData: Joi.object().keys({
      options: Joi.array().items(optionSchema).optional(),
      checked: Joi.boolean().optional(),
    }).optional(),
  })

  return schema.validate(body)
}

export default validateBody
