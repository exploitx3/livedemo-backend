import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    selectedChannels: Joi.array().custom((channelsArray) => {

      let allValid = channelsArray.every(channelId => validator.isMongoId(channelId))
      if(channelsArray.length === 0 || allValid) {

        return channelsArray
      } else {

        throw new Error('incorrect selectedChannel ids')
      }
    }).optional(),
    populatePrivateChannels: Joi.boolean().optional()
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody