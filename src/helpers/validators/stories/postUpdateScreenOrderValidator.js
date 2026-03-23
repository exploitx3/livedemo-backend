import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    screens: Joi.array().custom((screens) => {

      let allValid = screens.every(screen => {
        let hasVars = screen.hasOwnProperty('index') && screen.hasOwnProperty('_id')

        return hasVars
      })

      if(screens.length === 0 || allValid) {

        return screens
      } else {

        throw new Error('incorrect body for updating screen order')
      }
    }),
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
