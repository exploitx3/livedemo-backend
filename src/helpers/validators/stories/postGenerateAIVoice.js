import Joi from '@hapi/joi'
import validator from 'validator'
import VoiceTypes from "../../../constants/VoiceTypes.js";

function validateBody(body) {

  let schema = Joi.object().keys({
    text: Joi.string().required(),
    voiceId: Joi.string().required(), // ElevenLabs voiceId
  })

  const result = schema.validate(body)

  return result
}

export default  validateBody
