import webpush from "web-push"
import { eq } from "drizzle-orm"
import { db } from "../db"
import { pushSubscriptions } from "../db/schema"

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@amanah.app"

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, unknown>
  tag?: string
  requireInteraction?: boolean
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY
}

export async function sendPushNotification(userId: string, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log(`[DEV] Push notification to user ${userId}: ${payload.title}`)
    return
  }

  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))

  if (subscriptions.length === 0) return

  const pushPromises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      )
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode
      if (statusCode === 410 || statusCode === 404) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id))
      } else {
        console.error(`Push notification failed for user ${userId}:`, err)
      }
    }
  })

  await Promise.allSettled(pushPromises)
}

export async function sendPushToMultiple(userIds: string[], payload: PushPayload): Promise<void> {
  const promises = userIds.map((id) => sendPushNotification(id, payload))
  await Promise.allSettled(promises)
}
