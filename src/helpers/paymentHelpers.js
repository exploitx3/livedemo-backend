// Helper function to directly call postChargeInternal handler
// This replaces Lambda invocation

import postPaymentChargeInternalHandler from '../handlers/postPaymentChargeInternal.js'

/**
 * Triggers postChargeInternal handler directly (without Lambda)
 * @param {string} userId - User ID
 * @param {string} cardId - Card ID (if useSavedCard is true)
 * @param {string} currency - Currency code
 * @param {string} subscriptionType - Subscription type
 * @param {string} workspaceId - Workspace ID
 * @param {boolean} useSavedCard - Whether to use saved card
 * @param {object} Models - Mongoose models
 * @param {object} conn - MongoDB connection
 * @returns {Promise}
 */
export function triggerPostChargeInternal(userId, cardId, currency, subscriptionType, workspaceId, useSavedCard, Models, conn) {
  // Prepare request body
  const requestBody = {
    userId: userId,
    cardId: cardId,
    currency: currency,
    subscriptionType: subscriptionType,
    workspaceId: workspaceId,
    useSavedCard: useSavedCard,
    autoPay: true
  }

  // Create mock request/response objects
  const mockReq = {
    mongo: { Models, conn },
    body: requestBody
  }

  const mockRes = {
    set: () => mockRes,
    status: () => mockRes,
    send: () => {}
  }

  // Call the handler directly
  return postPaymentChargeInternalHandler(mockReq, mockRes)
    .catch((err) => {
      console.error('Error in postChargeInternal handler:', err)
      throw err
    })
}

export default {
  triggerPostChargeInternal
}
