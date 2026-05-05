import Stripe from 'stripe'
import helpers from '../helpers/livedemoHelpers.js'
import ResponseCodes from '../constants/ResponseCodes.js'
import ENV from '../envServer.js'
import SubscriptionTypes from '../constants/SubscriptionTypes.js'
import SubscriptionTypesExpireDates from '../constants/SubscriptionTypesExpireDates.js'
import WorkspaceTypes from '../constants/WorkspaceTypes.js'
import ChargeStatuses from '../constants/ChargeStatuses.js'
import EventReporter from '../helpers/eventReporter.js'
import EventNamesEnum from '../constants/EventNamesEnum.js'

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
  'prod_USQIjwxyXqkb4a': SubscriptionTypes.BUSINESS_MONTHLY,
  'prod_USQKMjZ7qq5Zrq': SubscriptionTypes.BUSINESS_ANNUALLY,
  // dev products
  'prod_USR38KOAAF6aFo': SubscriptionTypes.BUSINESS_MONTHLY,
  'prod_USR3CHtcPZDvIx': SubscriptionTypes.BUSINESS_ANNUALLY,
}

const SUBSCRIPTION_TYPE_TO_WORKSPACE_TYPE = {
  [SubscriptionTypes.STARTUP_MONTHLY]: WorkspaceTypes.STARTUP,
  [SubscriptionTypes.STARTUP_ANNUALLY]: WorkspaceTypes.STARTUP,
  [SubscriptionTypes.PRO_MONTHLY]: WorkspaceTypes.PRO,
  [SubscriptionTypes.PRO_ANNUALLY]: WorkspaceTypes.PRO,
  [SubscriptionTypes.BUSINESS_MONTHLY]: WorkspaceTypes.BUSINESS,
  [SubscriptionTypes.BUSINESS_ANNUALLY]: WorkspaceTypes.BUSINESS,
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

    // Retrieve payment details from the subscription Stripe created
    const stripeSubscription = await stripeInstance.subscriptions.retrieve(
      session.subscription
    )
    const paymentMethodId = stripeSubscription.default_payment_method || ''
    const currency = stripeSubscription.currency || 'usd'
    const amount = (stripeSubscription.items.data[0]?.price?.unit_amount || 0) / 100

    const workspace = await Models.Workspace.findOne({ _id: workspaceId }).lean()
    if (!workspace) {
      return res.status(ResponseCodes['500_INTERNAL_SERVER_ERROR']).json({
        error: true,
        message: 'Workspace not found'
      })
    }

    // Create subscription record
    const subscription = await new Models.Subscription({
      type: subscriptionType,
      workspaceId: workspace._id,
      active: true,
      userId: authUserDoc._id,
      autoPay: true,
      expired: false,
      expireDate: SubscriptionTypesExpireDates[subscriptionType]
    }).save()

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

    // Update workspace type
    await Models.Workspace.findOneAndUpdate(
      { _id: workspace._id },
      { $set: { type: workspaceType } }
    )

    await EventReporter.storeInfoEvent(EventNamesEnum.SUBSCRIPITON_PURCHASED, {
      userId: authUserDoc._id,
      charge,
      subscription
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
