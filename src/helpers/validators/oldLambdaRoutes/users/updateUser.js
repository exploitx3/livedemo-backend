import Joi from '@hapi/joi'
import OnboardingGoalsTypes from '../../../../constants/OnboardingGoalsTypes.js'

function validateBody(body) {


  let schema = Joi.object().keys({
    timezone: Joi.string().optional(),
    onboarding: Joi.object().keys({
      goals: Joi.array()
        .items(Joi.string().valid(...Object.values(OnboardingGoalsTypes.ONBOARDING_GOALS)))
        .optional(),
    }).optional(),
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody