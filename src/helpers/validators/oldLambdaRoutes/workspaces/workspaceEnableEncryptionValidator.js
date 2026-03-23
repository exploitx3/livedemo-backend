import Joi from '@hapi/joi'
import validator from 'validator'

function validateBody(body) {


  let schema = Joi.object().keys({
    workspaceId: Joi.string().custom((workspaceId) => {
      if (validator.isMongoId(workspaceId)) {

        return workspaceId
      } else {

        throw new Error('incorrect workspaceId')
      }
    }).required(),
    publicKey: Joi.string().required(),
    privateKey: Joi.string().required(),
    passphraseSalt: Joi.string().required(),
    passphraseIV: Joi.string().required()


  })

  const result = schema.validate(body)

  return result
}

export default  validateBody