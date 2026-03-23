import Joi from '@hapi/joi'
import validator from 'validator'
import popupTypes from '../../../../constants/ScreenPopupTypes.js'

function validateBody(body) {


  let schema = Joi.object().keys({

    // enabled: Joi.boolean().optional(),
    type: Joi.string().valid(
      popupTypes.NONE,
      popupTypes.FORM,
      popupTypes.START,
      popupTypes.IFRAME
    ).optional(),
    // formId: Joi.string().allow('', null).optional(),
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
