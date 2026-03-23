import Joi from '@hapi/joi'
import validator from 'validator'
import Emotions from '../../../../constants/Emotions.js'

function validateBody(body) {


  let schema = Joi.object().keys({
    workspaceId: Joi.string().custom((workspaceId) => {
      if (validator.isMongoId(workspaceId)) {

        return workspaceId
      } else {

        throw new Error('incorrect workspaceId')
      }
    }).required(),

    limit: Joi.number().optional(),
    userSlackIds: Joi.array().optional(),
    channelIds: Joi.array().custom((channelsArray) => {

      let allValid = channelsArray.every(channelId => validator.isMongoId(channelId))
      if(channelsArray.length === 0 || allValid) {

        return channelsArray
      } else {

        throw new Error('incorrect channelIds')
      }
    }).optional(),
    emotions: Joi.array().custom((emotionsArr) => {
      let allowedEmotions = Object.values(Emotions)
      let allValid = emotionsArr.every(emotion => allowedEmotions.indexOf(emotion) !== -1)
      if(emotionsArr.length === 0 || allValid) {

        return emotionsArr
      } else {

        throw new Error('incorrect emotions')
      }
    }).optional(),
    isIm: Joi.boolean().optional(),
    startDate: Joi.date().timestamp().optional(),
    endDate: Joi.date().timestamp().optional(),
    page: Joi.number().required(),
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody