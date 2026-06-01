import Stripe from 'stripe'
import helpers from '../helpers/livedemoHelpers.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import ENV from '../envServer.js'
import SubscriptionTypes from '../constants/SubscriptionTypes.js'
import SubscriptionTypesExpireDates from '../constants/SubscriptionTypesExpireDates.js'
import SubscriptionTypesMembersAllowed from '../constants/SubscriptionTypesMembersAllowed.js'
import WorkspaceTypes from '../constants/WorkspaceTypes.js'
import ChargeStatuses from '../constants/ChargeStatuses.js'
import EventReporter from '../helpers/eventReporter.js'
import EventNamesEnum from '../constants/EventNamesEnum.js'
import {
  normalizeSubscription,
  enablePaidPlanUserFeatureFlags,
  setActiveUserSubscription,
} from '../helpers/subscriptionHelpers.js'
import {
  saveUserCardFromStripePaymentMethod,
  syncUserStripeCustomerId,
} from '../helpers/paymentHelpers.js'
import {
  linkSubscriptionToCustomer,
  upsertSubscriptionCustomer,
} from '../helpers/subscriptionCustomerHelpers.js'

const CORS_HEADERS = {
  'Access-Control-Max-Age': 600,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'ClientId,Authorization,Content-Type,Accept',
  'Access-Control-Allow-Credentials': true,
}

let stripe = null
function getStripe() {
  if (stripe) return stripe
  if (!ENV.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured')
  stripe = new Stripe(ENV.STRIPE_SECRET_KEY)
  return stripe
}

// Map Stripe product interval + nickname to our subscription type
const PRODUCT_TO_SUBSCRIPTION_TYPE = {
  'prod_UXbDm4HqbawhNo': SubscriptionTypes.PRO_MONTHLY,
  'prod_UXbDRK1gGrfWEh': SubscriptionTypes.PRO_ANNUALLY,
  'prod_UXbECZgFqrpCzI': SubscriptionTypes.GROWTH_MONTHLY,
  'prod_UXbEreuawwjJ1v': SubscriptionTypes.GROWTH_ANNUALLY,
  // dev products
  'prod_UXZkkwn0B77gSJ': SubscriptionTypes.PRO_MONTHLY,
  'prod_UXZmCUin8ZKi0o': SubscriptionTypes.PRO_ANNUALLY,
  'prod_UXZluZhDivdyOl': SubscriptionTypes.GROWTH_MONTHLY,
  'prod_UXZnkXaY05BRmV': SubscriptionTypes.GROWTH_ANNUALLY,
}

const SUBSCRIPTION_TYPE_TO_WORKSPACE_TYPE = {
  [SubscriptionTypes.PRO_MONTHLY]: WorkspaceTypes.PRO,
  [SubscriptionTypes.PRO_ANNUALLY]: WorkspaceTypes.PRO,
  [SubscriptionTypes.GROWTH_MONTHLY]: WorkspaceTypes.GROWTH,
  [SubscriptionTypes.GROWTH_ANNUALLY]: WorkspaceTypes.GROWTH,
}

const handler = async function (req, res) {
  res.set(CORS_HEADERS)
  const { Models, conn } = req.mongo

  try {
    const { authUser: authUserDoc } = await helpers.authReq(req, Models)
    const { sessionId } = req.body

    if (!sessionId) {
      return res.status(ResponseCodes['500_INTERNAL_SERVER_ERROR']).json({
        error: true,
        message: 'sessionId is required'
      })
    }

    const stripeInstance = getStripe()

    // Retrieve and expand line items so we get the product ID
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product']
    })

    if (session.payment_status !== 'paid') {
      return res.status(ResponseCodes['500_INTERNAL_SERVER_ERROR']).json({
        error: true,
        message: `Payment not completed. Status: ${session.payment_status}`
      })
    }

    const { userId, workspaceId } = session.metadata

    // Guard: only the authenticated user can verify their own session
    if (userId !== authUserDoc._id.toString()) {
      return res.status(ResponseCodes['403_FORBIDDEN']).json({
        error: true,
        message: 'Unauthorized'
      })
    }

    // Idempotency: skip if already processed
    const existingCharge = await Models.Charge.findOne({
      stripeCheckoutSessionId: sessionId
    }).lean()

    if (existingCharge) {
      return res.status(ResponseCodes['200_OK']).json({
        error: false,
        message: 'Already processed',
        alreadyProcessed: true
      })
    }

    // Derive subscription type from product
    const productId = session.line_items.data[0]?.price?.product?.id
    const subscriptionType = PRODUCT_TO_SUBSCRIPTION_TYPE[productId]

    if (!subscriptionType) {
      return res.status(ResponseCodes['500_INTERNAL_SERVER_ERROR']).json({
        error: true,
        message: `Unknown product: ${productId}`
      })
    }

    const workspaceType = SUBSCRIPTION_TYPE_TO_WORKSPACE_TYPE[subscriptionType]

    await syncUserStripeCustomerId(authUserDoc._id, session.customer, Models)

    // Retrieve payment details from the subscription Stripe created
    const stripeSubscription = await stripeInstance.subscriptions.retrieve(
      session.subscription,
      { expand: ['default_payment_method'] }
    )

    await syncUserStripeCustomerId(
      authUserDoc._id,
      stripeSubscription.customer,
      Models
    )

    const defaultPaymentMethod = stripeSubscription.default_payment_method
    const paymentMethodId = typeof defaultPaymentMethod === 'string'
      ? defaultPaymentMethod
      : defaultPaymentMethod?.id || ''

    const card = await saveUserCardFromStripePaymentMethod(
      stripeInstance,
      paymentMethodId,
      authUserDoc._id,
      Models
    )
    const currency = stripeSubscription.currency || 'usd'
    const stripeLineItem = session.line_items?.data?.[0]
    const stripeSubscriptionItem = stripeSubscription.items.data[0]
    const quantity = stripeLineItem?.quantity
      || stripeSubscriptionItem?.quantity
      || parseInt(session.metadata?.quantity, 10)
      || 1
    const unitAmount = stripeSubscriptionItem?.price?.unit_amount || 0
    const amount = (unitAmount * quantity) / 100
    const membersPerUnit = SubscriptionTypesMembersAllowed[subscriptionType] || 1
    const membersAllowed = membersPerUnit * quantity

    const workspace = await Models.Workspace.findOne({ _id: workspaceId }).lean()
    if (!workspace) {
      return res.status(ResponseCodes['500_INTERNAL_SERVER_ERROR']).json({
        error: true,
        message: 'Workspace not found'
      })
    }

    const stripeCustomerId =
      typeof stripeSubscription.customer === 'string'
        ? stripeSubscription.customer
        : stripeSubscription.customer?.id

    const subscriptionCustomer = await upsertSubscriptionCustomer(Models, {
      userId: authUserDoc._id,
      cardId: card?._id,
      autoPay: true,
      stripeCustomerId,
      stripeSubscriptionId: session.subscription,
    })

    // Create subscription record
    const subscription = await new Models.Subscription({
      type: subscriptionType,
      workspaceIds: [workspace._id],
      subscriptionCustomerId: subscriptionCustomer._id,
      active: true,
      userId: authUserDoc._id,
      autoPay: true,
      expired: false,
      expireDate: SubscriptionTypesExpireDates[subscriptionType],
      membersAllowed,
    }).save()

    await setActiveUserSubscription(Models, authUserDoc._id, subscription._id)
    await enablePaidPlanUserFeatureFlags(Models, authUserDoc._id)

    await linkSubscriptionToCustomer(
      Models,
      subscription._id,
      subscriptionCustomer._id
    )

    await Models.Workspace.findOneAndUpdate(
      { _id: workspace._id },
      { $push: { subscriptions: subscription._id } }
    )
    await Models.User.findOneAndUpdate(
      { _id: authUserDoc._id },
      { $push: { subscriptions: subscription._id } }
    )

    // Create charge record
    const charge = await new Models.Charge({
      amount,
      status: ChargeStatuses.COMPLETED,
      stripeCheckoutSessionId: sessionId,
      stripeSubscriptionId: session.subscription,
      paymentMethodId,
      cardId: card?._id,
      subscriptionId: subscription._id,
      subscriptionType,
      workspaceId: workspace._id,
      userId: authUserDoc._id,
      currency,
      useSavedCard: false,
      autoPay: true
    }).save()

    await Models.Subscription.findOneAndUpdate(
      { _id: subscription._id },
      { $set: { chargeId: charge._id } }
    )

    await upsertSubscriptionCustomer(Models, {
      userId: authUserDoc._id,
      cardId: card?._id,
      chargeId: charge._id,
      subscriptionId: subscription._id,
      autoPay: true,
      stripeCustomerId,
      stripeSubscriptionId: session.subscription,
    })

    // Update workspace type
    await Models.Workspace.findOneAndUpdate(
      { _id: workspace._id },
      { $set: { type: workspaceType } }
    )

    await EventReporter.storeInfoEvent(EventNamesEnum.SUBSCRIPITON_PURCHASED, {
      userId: authUserDoc._id,
      charge,
      subscription: normalizeSubscription(subscription),
    })

    res.status(ResponseCodes['200_OK']).json({
      error: false,
      message: 'Subscription activated successfully',
      alreadyProcessed: false
    })
  } catch (err) {
    console.error('postVerifyCheckoutSession error:', err)
    res.status(ResponseCodes['500_INTERNAL_SERVER_ERROR']).json({
      error: true,
      message: err.message
    })
  }
}

export default handler
