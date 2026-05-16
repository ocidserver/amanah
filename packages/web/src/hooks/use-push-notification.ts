import { useState, useEffect, useCallback } from "react"
import { api } from "../lib/api"

interface PushSubscriptionState {
  isSupported: boolean
  permission: NotificationPermission
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  sendTest: () => Promise<void>
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotification(): PushSubscriptionState {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    setIsSupported(supported)
    if (supported) {
      setPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if (!isSupported) return

    async function checkSubscription() {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch {
        // ignore
      }
    }

    checkSubscription()
  }, [isSupported])

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError("Push notification tidak didukung di browser ini")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== "granted") {
        setError("Izin notifikasi ditolak")
        return
      }

      const { publicKey } = await api.get<{ publicKey: string }>("/push/public-key")
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })

      const p256dhKey = subscription.getKey("p256dh")
      const authKey = subscription.getKey("auth")

      await api.post("/push/subscribe", {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey as ArrayBuffer))),
          auth: btoa(String.fromCharCode(...new Uint8Array(authKey as ArrayBuffer))),
        },
      })

      setIsSubscribed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal berlangganan notifikasi")
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return

    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await api.post("/push/unsubscribe", { endpoint: subscription.endpoint })
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal berhenti berlangganan")
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const sendTest = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await api.post("/push/test", {})
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim test notifikasi")
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTest,
  }
}
