import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    type: Joi.string().allow(null, '').optional(),
    content: Joi.string().allow(null, '').optional(),
    hotspot: {
      frameX: Joi.number().optional(),
      frameY: Joi.number().optional(),
    },
    pointer: {
      selector: Joi.string().allow(null, '').optional()
    },
    gotoType: Joi.string().allow(null, '').required(),
    gotoWebsite: Joi.string().allow(null, '').optional(),
    gotoScreen: Joi.string().custom((screenId) => {
      if (validator.isMongoId(screenId)) {

        return screenId
      } else {

        if(!screenId) {

          return ''
        }

        throw new Error('Incorrect screenId')
      }
    }).optional(),
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
