import LambdaRateLimiter from 'lambda-rate-limiter'
import ResponseCodes from '../../constants/ResponseCodes.js'
import { httpError } from './http.js'

export function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown'
}

// `limit` hits per IP per `interval` ms (window starts on the IP's first hit).
// ponytail: in-memory per process, so each pod counts on its own. Upgrade: Redis.
export default function ipRateLimit({ limit, interval, message }) {
  const limiter = LambdaRateLimiter({ interval, uniqueTokenPerInterval: 5000 })
  return async function check(req) {
    const ip = clientIp(req)
    await limiter.check(limit, ip).catch(() => {
      console.log('[rate-limit]', message, ip)
      httpError(ResponseCodes['429_TOO_MANY_REQUESTS'], message)
    })
  }
}
