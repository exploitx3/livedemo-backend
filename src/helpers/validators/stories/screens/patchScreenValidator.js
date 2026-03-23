import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({

    index: Joi.number().optional(),
    name: Joi.string().optional(),
    startTime: Joi.number().optional(),
    endTime: Joi.number().optional(),
    playbackRate: Joi.number().optional(),

  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
