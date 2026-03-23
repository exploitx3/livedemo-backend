// Simplified mapper helper for card mapping
// This is a simplified version - can be extended later if needed

export function mapCard(card) {
  // Map Stripe card object to our Card schema
  return {
    brand: card.brand || '',
    checks: card.checks || {},
    country: card.country || '',
    expMonth: card.exp_month ? String(card.exp_month) : '',
    expYear: card.exp_year ? String(card.exp_year) : '',
    fingerprint: card.fingerprint || '',
    funding: card.funding || '',
    generatedFrom: card.generated_from || '',
    last4: card.last4 || '',
    threeDSecureUsage: {
      supported: card.three_d_secure_usage?.supported ? String(card.three_d_secure_usage.supported) : ''
    },
    wallet: card.wallet || ''
  }
}

export default {
  mapCard
}
