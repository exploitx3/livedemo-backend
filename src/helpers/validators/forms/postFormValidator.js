import Joi from '@hapi/joi'
import validator from 'validator'
import formTypes from '../../../constants/FormTypes.js'

function validateBody(body) {


  let schema = Joi.object().keys({
    type: Joi.string().valid(formTypes.STEP).required(),
    storyId: Joi.string().optional(),
    transitionId: Joi.string().optional(),
    stepId: Joi.string().optional(),
    screenId: Joi.string().optional(),

  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
