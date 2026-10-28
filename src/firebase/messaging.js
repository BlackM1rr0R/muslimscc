// ═══ FIREBASE CLOUD MESSAGING (FCM) ═══
//
// Token Firestore-da `fcm_tokens/<token>` sənədində saxlanılır:
//   { token, userAgent, lang, loc:{ lat, lng, tz, method, city:{az,en,ru,ar,tr} },
//     createdAt:<ms>, updatedAt:<serverTimestamp> }
// `loc` istifadəçinin seçdiyi namaz yeridir (utils/prayerLocation.js) — server
// hər istifadəçiyə ÖZ şəhərinin azan vaxtında push göndərir. İstifadəçi
// şəhəri dəyişəndə setPrayerCity() → updateTokenLocation() sənədi yeniləyir
// (merge — createdAt itmir).
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import app, { db, isFirebaseConfigured } from './config'
import { getPrayerLocation } from '../utils/prayerLocation'

// VAPID açar — Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || ''

const TOKEN_KEY = 'muslim_cc_fcm_token'
const LANG_KEY = 'muslim_cc_lang'
const TOKENS_COLLECTION = 'fcm_tokens'

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

function readLS(key) {
  try { return localStorage.getItem(key) } catch { return null }
}

/** Sənədə yazılan namaz yeri — yalnız serverə lazım olan sahələr. */
function locationPayload() {
  const loc = getPrayerLocation()
  return {
    lat: loc.lat,
    lng: loc.lng,
    tz: loc.tz,
    method: loc.method,
    city: { ...loc.city },
  }
}

function currentLang() {
  return readLS(LANG_KEY) || 'az'
}

// ─── Token-i Firestore-da unikal şəkildə saxla ───
async function saveTokenToFirestore(token) {
  try {
    if (!db) return
    const now = Date.now()
    // Token sənədin ID-sidir — təkrar saxlanmır. merge: əvvəlki createdAt qalsın
    // deyə yalnız token ilk dəfə yazılanda createdAt əlavə olunur.
    const isNew = readLS(TOKEN_KEY) !== token
    await setDoc(doc(db, TOKENS_COLLECTION, token), {
      token,
      userAgent: navigator.userAgent,
      lang: currentLang(),
      loc: locationPayload(),
      ...(isNew ? { createdAt: now } : {}),
      updatedAt: serverTimestamp(),
    }, { merge: true })
    // Lokal yadda saxla
    try { localStorage.setItem(TOKEN_KEY, token) } catch { /* yaddaş bağlıdır */ }
  } catch (e) {
    console.warn('FCM token save failed:', e.message)
  }
}

/**
 * İstifadəçi şəhəri (və ya dili) dəyişəndə çağırılır: token varsa onun
 * sənədində loc və lang yenilənir. Token yoxdursa heç nə etmir.
 */
export async function updateTokenLocation() {
  const token = readLS(TOKEN_KEY)
  if (!token || !db || !isFirebaseConfigured()) return false
  try {
    await setDoc(doc(db, TOKENS_COLLECTION, token), {
      lang: currentLang(),
      loc: locationPayload(),
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return true
  } catch (e) {
    console.warn('FCM location update failed:', e.message)
    return false
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
  return readLS(TOKEN_KEY)
}

export function clearStoredToken() {
  if (typeof window !== 'undefined') {
    try { localStorage.removeItem(TOKEN_KEY) } catch { /* */ }
  }
}
