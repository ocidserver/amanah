import { MiddlewareHandler } from "hono"

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 10 * 60 * 1000)

export function rateLimit(options: {
  max: number
  windowMs: number
  message?: string
}): MiddlewareHandler {
  const { max, windowMs, message = "Terlalu banyak permintaan. Silakan coba lagi nanti." } = options

  return async (c, next) => {
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown"
    const key = `ratelimit:${ip}:${c.req.path}`
    const now = Date.now()

    const entry = store.get(key)

    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      await next()
      return
    }

    entry.count++

    if (entry.count > max) {
      return c.json({ error: message }, 429)
    }

    await next()
  }
}
