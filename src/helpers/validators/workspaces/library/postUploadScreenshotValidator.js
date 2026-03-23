import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    base64Screenshot: Joi.string().required(),
    storyId: Joi.string().optional(),
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
