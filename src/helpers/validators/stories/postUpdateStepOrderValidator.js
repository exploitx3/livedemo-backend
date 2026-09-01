import Joi from '@hapi/joi'

function validateBody(body) {
  let schema = Joi.object().keys({
    steps: Joi.array().custom((steps) => {
      let allValid = steps.every((step) => step.hasOwnProperty('index') && step.hasOwnProperty('_id'))

      if (steps.length === 0 || allValid) {
        return steps
      }

      throw new Error('incorrect body for updating step order')
    }),
  })

  return schema.validate(body)
}

export default validateBody
