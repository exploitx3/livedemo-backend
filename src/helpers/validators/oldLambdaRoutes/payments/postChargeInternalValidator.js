import Joi from '@hapi/joi'
import SubscriptionTypes from '../../../../constants/SubscriptionTypes.js'
import validator from 'validator'

/*
{
	"paymentMethod": {
		"id": "pm_card_visa",
		"object": "payment_method",
		"billing_details": {
			"address": {
				"city": null,
				"country": null,
				"line1": null,
				"line2": null,
				"postal_code": null,
				"state": null
			},
			"email": null,
			"name": "GeorgiTest",
			"phone": null
		},
		"card": {
			"brand": "visa",
			"checks": {
				"address_line1_check": null,
				"address_postal_code_check": null,
				"cvc_check": null
			},
			"country": "DE",
			"exp_month": 2,
			"exp_year": 2021,
			"funding": "credit",
			"generated_from": null,
			"last4": "3184",
			"three_d_secure_usage": {
				"supported": true
			},
			"wallet": null
		},
		"created": 1571025780,
		"customer": null,
		"livemode": false,
		"metadata": {},
		"type": "card"
	},
	"currency": "USD",
	"amount": 100,
	"subscriptionType": "standard",
	"workspaceId": "5da1389a9580f7790f9fbdee",
	"useSavedCard": false
}
 */

function validateBody(body) {

  if (body.useSavedCard === undefined && !(body.useSavedCard === true || body.useSavedCard === false)) {
    throw new Error('useSavedCard not configured correctly')
  }

  let schema = {}
  if (body.useSavedCard === true) {

    schema = Joi.object().keys({
      userId: Joi.string().custom((userId) => {
        if (validator.isMongoId(userId)) {
          return userId
        } else {
          throw new Error('incorrect userId')
        }
      }),
      cardId: Joi.string().custom((cardId) => {
        if (validator.isMongoId(cardId)) {
          return cardId
        } else {
          throw new Error('incorrect cardId')
        }
      }),
      currency: Joi.string().required(),
      subscriptionType: Joi.string().custom((subscriptionType, helpers) => {
        if (SubscriptionTypes[subscriptionType.toUpperCase()]) {
          return subscriptionType
        } else {
          throw new Error('Invalid SubscriptionType')
        }
      }),
      workspaceId: Joi.string().custom((workspaceId) => {
        if (validator.isMongoId(workspaceId)) {
          return workspaceId
        } else {
          throw new Error('incorrect workspaceId')
        }
      }),
      autoPay: Joi.boolean().required(),
      useSavedCard: Joi.boolean().required()
    }).presence('optional')
  } else {

    schema = Joi.object().presence('optional').keys({

      userId: Joi.string().custom((userId) => {
        if (validator.isMongoId(userId)) {
          return userId
        } else {
          throw new Error('incorrect userId')
        }
      }),

      paymentMethod: Joi.object().keys({
        id: Joi.string().min(3).max(40).required(),
        billing_details: Joi.object().keys({
          name: Joi.string().alphanum().min(3).max(30).required(),
        }).unknown(true),
        card: Joi.object().keys({
          last4: Joi.string().alphanum().length(4).required(),
        }).unknown(true)
      }).unknown(true),
      currency: Joi.string().required(),
      subscriptionType: Joi.string().custom((subscriptionType, helpers) => {
        if (SubscriptionTypes[subscriptionType.toUpperCase()]) {
          return subscriptionType
        } else {
          throw new Error('Invalid SubscriptionType')
        }
      }),
      workspaceId: Joi.string().custom((workspaceId) => {
        if (validator.isMongoId(workspaceId)) {
          return workspaceId
        } else {
          throw new Error('incorrect workspaceId')
        }
      }),
      autoPay: Joi.boolean().required(),
      useSavedCard: Joi.boolean().required()
    })
  }

  const result = schema.validate(body)

  return result
}

export default  validateBody