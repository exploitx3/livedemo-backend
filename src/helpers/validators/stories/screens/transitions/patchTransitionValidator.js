import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    type: Joi.string().allow(null, '').optional(),
    content: Joi.string().allow(null, '').optional(),
    hotspot: {
      frameX: Joi.number().optional(),
      frameY: Joi.number().optional(),
      placement: Joi.string().optional()
    },
    pointer: {
      selector: Joi.string().allow(null, '').optional(),
      selectorLocation: Joi.object().keys({
        positionX: Joi.number().optional(),
        positionY: Joi.number().optional(),
        width: Joi.number().optional(),
        height: Joi.number().optional()
      }).optional(),
      placement: Joi.string().optional(),
      targetMode: Joi.string().valid('pick', 'select', 'none').optional(),
      tooltipX: Joi.number().optional(),
      tooltipY: Joi.number().optional(),
    },
    nextButtonText: {type: String, default: 'Next'},
    showStepNumbers: {type: Boolean, default: true},
    gotoType: Joi.string().optional(),
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
