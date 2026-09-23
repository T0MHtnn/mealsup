import { pushService, userService } from '@/services/supabaseClient'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export type PushSupport = 'supported' | 'needs-install' | 'unsupported' | 'not-configured'

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
}

/**
 * On iPhone, web notifications only work from the app added to the home screen
 * (iOS 16.4+), not from a Safari tab.
 */
export function pushSupport(): PushSupport {
  if (!VAPID_PUBLIC_KEY) return 'not-configured'
  if (isIos() && !isInstalled()) return 'needs-install'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported'
  return 'supported'
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  // The service worker is only registered in production builds
  const reg = await navigator.serviceWorker.getRegistration()
  return reg ? navigator.serviceWorker.ready : null
}

/** Must be called from a user tap (browsers require it to show the permission prompt). */
export async function enablePush(userId: string): Promise<'enabled' | 'denied' | 'error'> {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      await userService.updatePreferences(userId, { notifications_asked: true, notifications_enabled: false })
      return 'denied'
    }
    const reg = await registration()
    if (!reg || !VAPID_PUBLIC_KEY) return 'error'
    const subscription =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }))
    await pushService.saveSubscription(userId, subscription.toJSON())
    await userService.updatePreferences(userId, { notifications_asked: true, notifications_enabled: true })
    return 'enabled'
  } catch (err) {
    console.error('Enable push error:', err)
    return 'error'
  }
}

export async function disablePush(userId: string) {
  try {
    const reg = await registration()
    const subscription = await reg?.pushManager.getSubscription()
    if (subscription) {
      await pushService.deleteSubscription(subscription.endpoint).catch(() => undefined)
      await subscription.unsubscribe()
    }
  } finally {
    await userService.updatePreferences(userId, { notifications_asked: true, notifications_enabled: false })
  }
}

/** Is this device currently subscribed? */
export async function isSubscribedHere(): Promise<boolean> {
  try {
    const reg = await registration()
    return Boolean(await reg?.pushManager.getSubscription())
  } catch {
    return false
  }
}
