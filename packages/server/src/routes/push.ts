import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { db } from "../db"
import { pushSubscriptions } from "../db/schema"
import { authMiddleware, AuthEnv } from "../middleware/auth"
import { getVapidPublicKey, sendPushNotification } from "../lib/push"

const push = new Hono<AuthEnv>()

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

push.post("/subscribe", authMiddleware, zValidator("json", subscribeSchema), async (c) => {
  const { endpoint, keys } = c.req.valid("json")
  const { userId } = c.get("user")

  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))

  if (existing.length > 0) {
    return c.json({ success: true, existing: true })
  }

  await db.insert(pushSubscriptions).values({
    userId,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  })

  return c.json({ success: true })
})

push.post("/unsubscribe", authMiddleware, zValidator("json", z.object({ endpoint: z.string() })), async (c) => {
  const { endpoint } = c.req.valid("json")
  const { userId } = c.get("user")

  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)))

  return c.json({ success: true })
})

push.get("/public-key", authMiddleware, async (c) => {
  return c.json({ publicKey: getVapidPublicKey() })
})

push.post("/test", authMiddleware, async (c) => {
  const { userId } = c.get("user")

  await sendPushNotification(userId, {
    title: "Test Notifikasi Amanah",
    body: "Push notification berhasil dikonfigurasi!",
    icon: "/icons/icon-192.png",
    tag: "test",
  })

  return c.json({ success: true })
})

export default push
