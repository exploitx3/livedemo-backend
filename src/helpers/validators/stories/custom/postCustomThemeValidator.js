import Joi from '@hapi/joi'
import validator from 'validator'
import FooterButtons from '../../../../constants/FooterButtons.js'

function validateBody(body) {


  let schema = Joi.object().keys({
    isActive: Joi.boolean().required(),
    stepBackgroundColor: Joi.string().required(),
    textColor: Joi.string().required(),
    buttonBackgroundColor: Joi.string().required(),
    buttonTextColor: Joi.string().required(),
    // google font family name, e.g. 'Open Sans'
    fontFamily: Joi.string().allow('').regex(/^[A-Za-z0-9 ]{0,50}$/).default(''),
    showTooltipArrow: Joi.boolean().default(true),
    hoverGlow: Joi.boolean().default(true),
    footerButtons: Joi.string().valid(...Object.values(FooterButtons)).default(FooterButtons.backAndNext),
    watermarkConfig: {
      isActive: Joi.boolean().required(),
      text: Joi.string().allow('').required(),
      url: Joi.string().uri().allow('').required(),
    },
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
