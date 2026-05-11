// ═══ FIREBASE CLOUD MESSAGING (FCM) ═══
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import app, { isFirebaseConfigured } from './config'
import { setSingleDoc, addDocument, COLLECTIONS } from './firestore'

// VAPID açar — Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || ''

let _messaging = null

async function getMessagingInstance() {
  if (_messaging) return _messaging
  if (!isFirebaseConfigured()) return null
  try {
    const supported = await isSupported()
    if (!supported) return null
    _messaging = getMessaging(app)
    return _messaging
  } catch (e) {
    console.warn('FCM init failed:', e.message)
    return null
  }
}

// ─── Brauzer dəstəkləyirmi? ───
export async function isPushSupported() {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator)) return false
  if (!('Notification' in window)) return false
  if (!isFirebaseConfigured()) return false
  try { return await isSupported() } catch { return false }
}

// ─── Cari icazə statusu ───
export function getPermissionStatus() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

// ─── İcazə istə + token al ───
export async function requestNotificationPermission() {
  if (!await isPushSupported()) return { ok: false, reason: 'unsupported' }
  if (!VAPID_KEY) {
    console.warn('FCM: VITE_FCM_VAPID_KEY .env-də yoxdur')
    return { ok: false, reason: 'no-vapid-key' }
  }

  // Service Worker qeydiyyatı (Firebase üçün ayrıca SW)
  let swReg
  try {
    swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  } catch (e) {
    return { ok: false, reason: 'sw-failed', error: e.message }
  }

  // Brauzer icazəsi
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return { ok: false, reason: 'denied' }

  // FCM token
  const messaging = await getMessagingInstance()
  if (!messaging) return { ok: false, reason: 'no-messaging' }

  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    })
    if (!token) return { ok: false, reason: 'no-token' }

    // Token-i Firestore-da saxla (təkrarlanma yoxdursa)
    await saveTokenToFirestore(token)
    return { ok: true, token }
  } catch (e) {
    return { ok: false, reason: 'token-failed', error: e.message }
  }
}

// ─── Token-i Firestore-da unikal şəkildə saxla ───
async function saveTokenToFirestore(token) {
  try {
    // Token-i ID kimi istifadə et ki, təkrar saxlanmasın
    await setSingleDoc('fcm_tokens', token, {
      token,
      userAgent: navigator.userAgent,
      lang: localStorage.getItem('muslim_cc_lang') || 'az',
      createdAt: Date.now(),
    })
    // Lokal yadda saxla
    localStorage.setItem('muslim_cc_fcm_token', token)
  } catch (e) {
    console.warn('FCM token save failed:', e.message)
  }
}

// ─── Foreground-da gələn mesajları dinləmək ───
export async function onForegroundMessage(callback) {
  const messaging = await getMessagingInstance()
  if (!messaging) return () => {}
  return onMessage(messaging, callback)
}

// ─── İstifadəçi göstərmək istəmirsə tokeni silmək ───
export function getStoredToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('muslim_cc_fcm_token')
}

export function clearStoredToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('muslim_cc_fcm_token')
  }
}
