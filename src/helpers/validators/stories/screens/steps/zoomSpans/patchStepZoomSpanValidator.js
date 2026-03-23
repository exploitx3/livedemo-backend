import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    delay: Joi.number().optional(),
    duration: Joi.number().optional(),
    width: Joi.number().optional(),
    height: Joi.number().optional(),
    editorWidth: Joi.number().optional(),
    editorHeight: Joi.number().optional(),
    offsetX: Joi.number().optional(),
    offsetY: Joi.number().optional(),
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
