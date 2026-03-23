import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    startTime:  Joi.number().required(),
    duration:  Joi.number().required(),
    width:  Joi.number().required(),
    height:  Joi.number().required(),
    editorWidth:  Joi.number().required(),
    editorHeight:  Joi.number().required(),
    offsetX:  Joi.number().required(),
    offsetY:  Joi.number().required(),
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
