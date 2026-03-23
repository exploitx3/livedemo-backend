import Joi from '@hapi/joi'
import validator from 'validator'
import WeekDays from '../../../../constants/WeekDays.js'

function parseWorkingHours(workingHours) {
  if (!workingHours || workingHours.length === 0) {
    return null
  }


  let parsedHours = []
  workingHours.forEach(hour => {
    let from = hour.from || -1
    let to = hour.to || -1

    if (
      (from < 0 || from > 1440) &&
      (to < 0 || to > 1440)
    ) {

      return
    } else {

      parsedHours.push(hour)
    }
  })


  return parsedHours
}

function validateBody(body) {


  let schema = Joi.object().keys({
    workspaceId: Joi.string().custom((workspaceId) => {
      if (validator.isMongoId(workspaceId)) {

        return workspaceId
      } else {

        throw new Error('incorrect workspaceId')
      }
    }).required(),
    memberId: Joi.string().custom((memberId) => {
      if (validator.isMongoId(memberId)) {

        return memberId
      } else {

        throw new Error('incorrect memberId')
      }
    }),
    updateAll: Joi.boolean().required(),
    timezone: Joi.string().required(),
    workingHours: Joi.object().keys({
      monday: Joi.object().keys({

        hours: Joi.array().custom(hours => {
            return parseWorkingHours(hours)
          }).optional()

      }).optional(),

      tuesday: Joi.object().keys({

        hours: Joi.array().custom(hours => {
          return parseWorkingHours(hours)
        }).optional()

      }).optional(),
      wednesday: Joi.object().keys({

        hours: Joi.array().custom(hours => {
          return parseWorkingHours(hours)
        }).optional()

      }).optional(),

      thursday: Joi.object().keys({

        hours: Joi.array().custom(hours => {
          return parseWorkingHours(hours)
        }).optional()

      }).optional(),

      friday: Joi.object().keys({

        hours: Joi.array().custom(hours => {
          return parseWorkingHours(hours)
        }).optional()

      }).optional(),

      saturday: Joi.object().keys({

        hours: Joi.array().custom(hours => {
          return parseWorkingHours(hours)
        }).optional()

      }).optional(),

      sunday: Joi.object().keys({

        hours: Joi.array().custom(hours => {
          return parseWorkingHours(hours)
        }).optional()

      }).optional(),

    })


  })

  const result = schema.validate(body)

  return result
}


export default  validateBody