// ═══════════════════════════════════════════════════════════
// PUSH BİLDİRİŞLƏRİ — standart Web Push (VAPID), FCM-siz
// (server/push.js; docs/FIREBASE-EXIT.md, 2-ci mərhələ)
//
// Axın: /sw.js (saytın YEGANƏ service worker-i, push-u o göstərir) →
// pushManager.subscribe({ userVisibleOnly, applicationServerKey: serverin
// açıq VAPID açarı }) → POST /api/push/subscribe { subscription, lang, loc,
// prefs, userAgent }. Serverdə abunəlik endpoint ünvanı ilə tanınır; onu
// bilən öz abunəliyini dəyişə (PATCH /api/push/subscription) və silə
// (POST /api/push/unsubscribe) bilər. Endpoint lokalda da saxlanır.
//
// `prefs.checkin` yalnız "Qıldınızmı?" push-unu açır/söndürür — namaz
// qeydləri (qıldım/qəza/heyz) serverə HEÇ VAXT getmir, yalnız cihazda qalır.
// `loc` istifadəçinin seçdiyi namaz yeridir (utils/prayerLocation.js) — server
// hər istifadəçiyə ÖZ şəhərinin azan vaxtında push göndərir.
//
// KÖHNƏ FCM ABUNƏLİYİNDƏN KEÇİD (ikiqat bildiriş olmasın): localStorage-da
// köhnə FCM tokeni (muslim_cc_fcm_token) varsa və icazə artıq verilibsə,
// səhifə açılanda səssizcə: FCM-in yaratdığı push abunəliyi (başqa
// applicationServerKey ilə) ləğv olunur, bizim VAPID açarı ilə yenisi yaranır
// (icazə var — sorğu çıxmır), serverə göndərilir və eyni sorğuda
// `legacyFcmToken` — server Firestore-dakı fcm_tokens/<token> sənədini silir.
// Sonra köhnə açar lokalda təmizlənir. iOS (ana ekran PWA) — eyni məntiq.
// ═══════════════════════════════════════════════════════════
import { apiFetch, ApiError } from './http'
import { getPrayerLocation } from '../utils/prayerLocation'

export const ENDPOINT_KEY = 'muslim_cc_push_endpoint'
export const LEGACY_TOKEN_KEY = 'muslim_cc_fcm_token'
const LANG_KEY = 'muslim_cc_lang'
const PREFS_KEY = 'muslim_cc_notif_prefs'

function readLS(key) {
  try { return localStorage.getItem(key) } catch { return null }
}
function writeLS(key, v) {
  try { if (v == null) localStorage.removeItem(key); else localStorage.setItem(key, v) } catch { /* yaddaş bağlıdır */ }
}

// ─── Brauzer dəstəkləyirmi? ───
// iOS-da PushManager yalnız ana ekrana əlavə olunmuş PWA-da var.
export async function isPushSupported() {
  if (typeof window === 'undefined') return false
  return 'serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window
}

// ─── Cari icazə statusu ───
export function getPermissionStatus() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

// ─── Serverin açıq VAPID açarı (bir dəfə soruşulur) ───
let vapidPromise = null
function urlB64ToBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}
function getVapidKey() {
  if (!vapidPromise) {
    vapidPromise = apiFetch('/api/push/vapid-public-key').then((r) => {
      if (!r || typeof r.key !== 'string' || !r.key) throw new Error('no-vapid-key')
      return urlB64ToBytes(r.key)
    })
    vapidPromise.catch(() => { vapidPromise = null })   // növbəti cəhddə yenidən
  }
  return vapidPromise
}

/** Abunəliyin açarı bizim VAPID açarıdırmı? Bilinmirsə null. */
function sameKey(sub, key) {
  const k = sub && sub.options && sub.options.applicationServerKey
  if (!k) return null
  const a = new Uint8Array(k)
  return a.length === key.length && a.every((v, i) => v === key[i])
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
 *  abunəlik yarananda seçimlər ona da köçsün. */
function serverPrefs() {
  let p = {}
  try { p = JSON.parse(readLS(PREFS_KEY) || '{}') || {} } catch { p = {} }
  const hour = Number.isInteger(p.ayahHour) ? p.ayahHour : 8
  // checkin — "Qıldınızmı?" xatırlatması (server/checkin.js), susmaya görə sönülü
  return { azan: p.prayer !== false, checkin: p.checkin === true, daily: { ayah: p.ayah === true, hour } }
}

/**
 * Service worker + bizim açarla push abunəliyi. Mövcud abunəlik başqa
 * açarladırsa (FCM-in yaratdığı) və ya forceNew — ləğv edilib yenisi yaranır.
 */
async function ensureSubscription({ forceNew = false } = {}) {
  const reg = await navigator.serviceWorker.register('/sw.js')
  const key = await getVapidKey()
  let sub = await reg.pushManager.getSubscription()
  if (sub && (forceNew || sameKey(sub, key) === false)) {
    await sub.unsubscribe().catch(() => {})
    sub = null
  }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
  return sub
}

/** Abunəliyi serverə yaz (upsert). legacyFcmToken — server Firestore-dan silsin. */
async function sendSubscription(sub, legacyFcmToken) {
  await apiFetch('/api/push/subscribe', {
    method: 'POST',
    body: {
      subscription: sub.toJSON(),
      lang: currentLang(),
      loc: locationPayload(),
      prefs: serverPrefs(),
      userAgent: String(navigator.userAgent || '').slice(0, 512),
      ...(legacyFcmToken ? { legacyFcmToken } : {}),
    },
  })
  const old = readLS(ENDPOINT_KEY)
  writeLS(ENDPOINT_KEY, sub.endpoint)
  if (legacyFcmToken) writeLS(LEGACY_TOKEN_KEY, null)
  // Brauzer abunəliyi dəyişibsə köhnə endpoint serverdə qalmasın
  if (old && old !== sub.endpoint) {
    apiFetch('/api/push/unsubscribe', { method: 'POST', body: { endpoint: old } }).catch(() => {})
  }
}

// ─── Köhnə FCM tokenindən keçid (bir səhifədə bir dəfə) ───
let migration = null
function migrateLegacy() {
  const legacy = readLS(LEGACY_TOKEN_KEY)
  if (!legacy) return Promise.resolve(false)
  if (migration) return migration
  migration = (async () => {
    const perm = getPermissionStatus()
    if (perm !== 'granted') {
      // İcazə geri alınıb — köhnə token onsuz da ölüdür; serverdə də silinsin
      if (perm === 'denied') {
        await apiFetch('/api/push/unsubscribe', { method: 'POST', body: { legacyFcmToken: legacy } }).catch(() => {})
        writeLS(LEGACY_TOKEN_KEY, null)
      }
      return false
    }
    if (!(await isPushSupported())) return false
    // FCM abunəliyi başqa açarladır — həmişə yenisi yaradılır
    const sub = await ensureSubscription({ forceNew: !readLS(ENDPOINT_KEY) })
    await sendSubscription(sub, legacy)
    return true
  })()
  // Alınmasa (şəbəkə, server) — növbəti açılışda yenidən; köhnə açar qalır
  migration.catch((e) => { console.warn('Push keçidi alınmadı:', e?.message || e); migration = null })
  return migration
}

// ─── İcazə istə + abunə ol ───
export async function requestNotificationPermission() {
  if (!await isPushSupported()) return { ok: false, reason: 'unsupported' }
  try {
    await navigator.serviceWorker.register('/sw.js')
  } catch (e) {
    return { ok: false, reason: 'sw-failed', error: e.message }
  }
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return { ok: false, reason: 'denied' }
  try {
    const legacy = readLS(LEGACY_TOKEN_KEY)
    const sub = await ensureSubscription({ forceNew: Boolean(legacy) })
    await sendSubscription(sub, legacy)
    return { ok: true, token: sub.endpoint }
  } catch (e) {
    const reason = e?.message === 'no-vapid-key' || (e instanceof ApiError && e.status === 503) ? 'no-vapid-key' : 'token-failed'
    return { ok: false, reason, error: e?.message }
  }
}

/** PATCH /api/push/subscription. Server abunəliyi tanımırsa (404) — yenidən abunə. */
async function patchSubscription(fields) {
  await migrateLegacy().catch(() => {})
  const endpoint = readLS(ENDPOINT_KEY)
  if (!endpoint) return false
  try {
    await apiFetch('/api/push/subscription', { method: 'PATCH', body: { endpoint, ...fields } })
    return true
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return refreshPushToken()
    console.warn('Push ayarı yenilənmədi:', e?.message || e)
    return false
  }
}

/** Şəhər (və ya dil) dəyişəndə: abunəlik varsa loc və lang yenilənir. */
export function updateTokenLocation() {
  return patchSubscription({ lang: currentLang(), loc: locationPayload() })
}

/** "Günün ayəsi" → prefs.daily = { ayah, hour } (şəhərin yerli saatı). */
export function updateTokenDaily({ ayah, hour }) {
  return patchSubscription({ prefs: { daily: { ayah: Boolean(ayah), hour: Number(hour) } } })
}

/** Bildiriş seçimləri → prefs.azan / prefs.checkin. */
export function updateTokenPrefs(patch) {
  const prefs = {}
  if ('azan' in patch) prefs.azan = Boolean(patch.azan)
  if ('checkin' in patch) prefs.checkin = Boolean(patch.checkin)
  return patchSubscription({ prefs })
}

/**
 * Hər açılışda (icazə varsa): köhnə FCM tokeni varsa — keçid; yoxsa
 * abunəliyi yoxla (brauzer onu vaxtaşırı dəyişir) və serverə yenidən yaz
 * (eyni endpoint — upsert; yeni şəhər/dil/seçimlər də gedir).
 */
export async function refreshPushToken() {
  if (typeof window === 'undefined') return false
  try {
    if (readLS(LEGACY_TOKEN_KEY)) return await migrateLegacy()
    if (getPermissionStatus() !== 'granted' || !readLS(ENDPOINT_KEY)) return false   // abunə olmayıb / söndürüb
    if (!(await isPushSupported())) return false
    const sub = await ensureSubscription()
    await sendSubscription(sub)
    return true
  } catch (e) {
    console.warn('Push abunəliyi təzələnmədi:', e?.message || e)
    return false
  }
}

/** "Söndür": brauzer abunəliyini ləğv et və serverdən sil. */
export async function disablePush() {
  const endpoint = readLS(ENDPOINT_KEY)
  const legacy = readLS(LEGACY_TOKEN_KEY)
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.()
    const sub = await reg?.pushManager?.getSubscription()
    if (sub) await sub.unsubscribe().catch(() => {})
  } catch { /* brauzer dəstəkləmir */ }
  if (endpoint || legacy) {
    await apiFetch('/api/push/unsubscribe', {
      method: 'POST',
      body: { ...(endpoint ? { endpoint } : {}), ...(legacy ? { legacyFcmToken: legacy } : {}) },
    }).catch(() => {})
  }
  clearStoredToken()
}

// ─── Lokal vəziyyət ───
/** Abunəlik varmı (yeni endpoint və ya hələ keçməmiş köhnə FCM tokeni). */
export function getStoredToken() {
  if (typeof window === 'undefined') return null
  return readLS(ENDPOINT_KEY) || readLS(LEGACY_TOKEN_KEY)
}

export function clearStoredToken() {
  writeLS(ENDPOINT_KEY, null)
  writeLS(LEGACY_TOKEN_KEY, null)
}
