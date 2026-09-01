import Joi from '@hapi/joi'

const colorValue = Joi.string().allow('', 'transparent').optional()

function validateBody(body) {
  let schema = Joi.object().keys({
    selector: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
    elementNodeId: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
    text: Joi.string().allow('').optional(),
    textNodeId: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
    color: colorValue,
    backgroundColor: colorValue,
    hidden: Joi.boolean().optional(),
    blurred: Joi.boolean().optional(),
    imageData: Joi.string().allow('').optional(),
    imageKind: Joi.string().valid('src', 'background', 'href').optional(),
  }).or('text', 'color', 'backgroundColor', 'hidden', 'blurred', 'imageData')

  return schema.validate(body)
}

export default validateBody
