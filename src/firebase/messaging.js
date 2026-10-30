// ═══ FIREBASE CLOUD MESSAGING (FCM) ═══
//
// Token Firestore-da `fcm_tokens/<token>` sənədində saxlanılır:
//   { token, userAgent, lang, loc:{ lat, lng, tz, method, city:{az,en,ru,ar,tr} },
//     azan:bool, checkin:bool, daily:{ ayah, hour },
//     createdAt:<ms>, updatedAt:<serverTimestamp> }
// `checkin` yalnız "Qıldınızmı?" push-unu açır/söndürür — namaz qeydləri
// (qıldım/qəza/heyz) serverə HEÇ VAXT getmir, yalnız cihazda qalır.
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

  // Saytın YEGANƏ service worker-i — push-u da o göstərir (public/sw.js).
  // Əvvəl burada ayrıca /firebase-messaging-sw.js qeyd olunurdu; eyni "/"
  // əhatəsində /sw.js ilə bir-birini əvəz edirdilər və bildirişlər itirdi.
  let swReg
  try {
    swReg = await navigator.serviceWorker.register('/sw.js')
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
  // MƏXFİLİK: dəqiq GPS nöqtəsi serverə getmir — 2 onluq rəqəm (~1 km)
  // namaz vaxtı üçün kifayətdir (fərq saniyələrlə ölçülür)
  const r2 = (v) => Math.round(Number(v) * 100) / 100
  return {
    lat: r2(loc.lat),
    lng: r2(loc.lng),
    tz: loc.tz,
    method: loc.method,
    city: { ...loc.city },
  }
}

function currentLang() {
  return readLS(LANG_KEY) || 'az'
}

/** Bildiriş ayarları (NotificationSettingsWidget ilə eyni açar) — yeni
 *  token yaranırsa seçimlər ona da köçsün (əks halda "Günün ayəsi" və
 *  azan seçimi token dəyişəndə itirdi). */
const PREFS_KEY = 'muslim_cc_notif_prefs'
function serverPrefs() {
  let p = {}
  try { p = JSON.parse(readLS(PREFS_KEY) || '{}') || {} } catch { p = {} }
  const hour = Number.isInteger(p.ayahHour) ? p.ayahHour : 8
  // checkin — "Qıldınızmı?" xatırlatması (server/checkin.js), susmaya görə sönülü
  return { azan: p.prayer !== false, checkin: p.checkin === true, daily: { ayah: p.ayah === true, hour } }
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
      userAgent: String(navigator.userAgent || '').slice(0, 512),   // firestore.rules: ≤512
      lang: currentLang(),
      loc: locationPayload(),
      ...serverPrefs(),
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

/**
 * "Günün ayəsi" seçimi → token sənədində `daily: { ayah, hour }` (merge —
 * digər sahələr, o cümlədən loc və createdAt, pozulmur). Server həmin saatda
 * (istifadəçinin şəhərinin saatı ilə) push göndərir. Token yoxdursa false.
 */
export async function updateTokenDaily({ ayah, hour }) {
  const token = readLS(TOKEN_KEY)
  if (!token || !db || !isFirebaseConfigured()) return false
  try {
    await setDoc(doc(db, TOKENS_COLLECTION, token), {
      daily: { ayah: Boolean(ayah), hour: Number(hour) },
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return true
  } catch (e) {
    console.warn('FCM daily update failed:', e.message)
    return false
  }
}

/**
 * Bildiriş seçimləri → token sənədində `azan` (false olanda azan push-u
 * göndərilmir) və `checkin` ("Qıldınızmı?" — true olanda azandan 20 dəq sonra
 * xatırlatma gedir). Token yoxdursa false.
 */
export async function updateTokenPrefs(patch) {
  const token = readLS(TOKEN_KEY)
  if (!token || !db || !isFirebaseConfigured()) return false
  try {
    await setDoc(doc(db, TOKENS_COLLECTION, token), { ...patch, updatedAt: serverTimestamp() }, { merge: true })
    return true
  } catch (e) {
    console.warn('FCM prefs update failed:', e.message)
    return false
  }
}

/**
 * Hər açılışda (icazə varsa) tokeni yoxla və təzələ. Brauzer push abunəliyini
 * vaxtaşırı dəyişir; köhnə token "ölür" və bildirişlər səssizcə kəsilirdi.
 * Eyni tokendirsə yalnız updatedAt/loc yenilənir; fərqlidirsə yenisi yazılır
 * (köhnəsini server ilk uğursuz göndərişdə özü silir).
 */
export async function refreshPushToken() {
  if (typeof window === 'undefined' || getPermissionStatus() !== 'granted') return false
  if (!readLS(TOKEN_KEY) || !VAPID_KEY) return false   // istifadəçi abunə olmayıb və ya söndürüb
  try {
    const messaging = await getMessagingInstance()
    if (!messaging) return false
    const swReg = await navigator.serviceWorker.register('/sw.js')
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })
    if (!token) return false
    await saveTokenToFirestore(token)
    return true
  } catch (e) {
    console.warn('FCM token refresh failed:', e.message)
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
