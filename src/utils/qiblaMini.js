// ═══════════════════════════════════════════════════════
// Başlıqdakı kiçik qiblə kompası — məntiq (components/HeaderQibla.jsx İLK TOXUNUŞDA yükləyir)
//
// • Bucaq: saytın ortaq həndəsəsi (utils/paperDial → qiblaBearing; /qibla, /on-the-road ilə eyni).
// • Yer: əvvəlcə istifadəçinin seçdiyi namaz şəhəri (utils/prayerLocation); seçim yoxdursa
//   cihazın geolokasiyası (bir dəfəlik), o da alınmasa — saytın standart şəhəri. Geo-IP YOXDUR.
// • Cihaz istiqaməti: iOS — webkitCompassHeading (+ webkitCompassAccuracy), digərləri —
//   deviceorientationabsolute / absolute=true alpha. Nisbi (şimala bağlı olmayan) alpha
//   istifadə olunmur — yanlış istiqamət göstərməkdənsə bucağın rəqəmi göstərilir.
// • Dəqiqlik: iOS-da webkitCompassAccuracy (−1 və ya > 25° → zəif); digərlərində son
//   oxunuşların dairəvi səpələnməsi (QiblaAR.jsx ilə eyni qayda).
// Saf köməkçilər — tests/unit/qibla-mini.test.js
// ═══════════════════════════════════════════════════════
import { qiblaBearing } from './paperDial'
import { getPrayerCityId, getPrayerLocation } from './prayerLocation'

const RAD = Math.PI / 180

/** 0…360 → 8 istiqamətdən birinin indeksi (0 = şimal, 1 = şimal-şərq … 7 = şimal-qərb) */
export const compassIndex = (deg) => ((Math.round((((deg % 360) + 360) % 360) / 45) % 8) + 8) % 8

/** 203.4, ['şimal', …] → '203° cənub-qərb' (360° → 0°) */
export function formatBearing(deg, points) {
  if (!Number.isFinite(deg)) return ''
  const d = Math.round((((deg % 360) + 360) % 360)) % 360
  const p = points?.[compassIndex(d)]
  return p ? `${d}° ${p}` : `${d}°`
}

/** İki bucaq arasındakı işarəli fərq (−180…180): hədəf − cari */
export const angleDiff = (target, cur) => ((target - cur + 540) % 360) - 180

/** Oxunuşların dairəvi standart sapması (°); az oxunuş varsa null */
export function headingSpread(buf, min = 20) {
  if (!buf || buf.length < min) return null
  let sx = 0, sy = 0
  for (const a of buf) { sx += Math.cos(a * RAD); sy += Math.sin(a * RAD) }
  const R = Math.hypot(sx, sy) / buf.length
  return Math.sqrt(-2 * Math.log(Math.max(1e-6, R))) / RAD
}

/** Dəqiqlik: 'good' | 'low' | null (hələ bilinmir) */
export function accuracyOf({ iosAcc = null, buf = [] } = {}) {
  if (iosAcc != null) return iosAcc < 0 || iosAcc > 25 ? 'low' : 'good'
  const sd = headingSpread(buf)
  if (sd == null) return null
  return sd > 14 ? 'low' : 'good'
}

/** DeviceOrientation hadisəsindən kompas bucağı (şimaldan saat əqrəbi ilə) və ya null */
export function headingOf(e) {
  if (!e) return null
  if (typeof e.webkitCompassHeading === 'number' && e.webkitCompassHeading >= 0) return e.webkitCompassHeading
  if (e.absolute === true && typeof e.alpha === 'number' && Number.isFinite(e.alpha)) return (360 - e.alpha) % 360
  return null
}

/** Yer: seçilmiş şəhər → geolokasiya → standart şəhər. → { lat, lng, via } */
export function resolveLocation({ timeout = 10000 } = {}) {
  const loc = getPrayerLocation()
  const fallback = { lat: Number(loc.lat), lng: Number(loc.lng), via: getPrayerCityId() ? 'city' : 'default' }
  if (fallback.via === 'city' || typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(fallback)
  return new Promise((resolve) => {
    let done = false
    const finish = (v) => { if (!done) { done = true; resolve(v) } }
    const timer = setTimeout(() => finish(fallback), timeout + 500)
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => { clearTimeout(timer); finish({ lat: pos.coords.latitude, lng: pos.coords.longitude, via: 'device' }) },
        () => { clearTimeout(timer); finish(fallback) },
        { enableHighAccuracy: false, timeout, maximumAge: 600000 },
      )
    } catch { clearTimeout(timer); finish(fallback) }
  })
}

export const bearingFor = (loc) => (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng) ? qiblaBearing(loc.lat, loc.lng) : null)

/**
 * Kompası işə sal. onHeading(h) — hər oxunuşda (rAF ilə seyrəldilmiş), onAccuracy('good'|'low'),
 * onNone() — waitMs ərzində istifadəyə yararlı oxunuş gəlmədisə. → stop()
 */
export function startCompass({ onHeading, onAccuracy, onNone, waitMs = 2500 } = {}) {
  if (typeof window === 'undefined') { onNone?.(); return () => {} }
  let raw = null, raf = 0, got = false, iosAcc = null, lastAcc = null, stopped = false
  const buf = []
  const take = (e) => {
    const h = headingOf(e)
    if (h == null || !Number.isFinite(h)) return
    got = true
    raw = h
    buf.push(h); if (buf.length > 40) buf.shift()
    if (typeof e.webkitCompassAccuracy === 'number') iosAcc = e.webkitCompassAccuracy
    if (!raf) raf = requestAnimationFrame(flush)
  }
  const flush = () => {
    raf = 0
    if (stopped || raw == null) return
    onHeading?.(raw)
    const a = accuracyOf({ iosAcc, buf })
    if (a && a !== lastAcc) { lastAcc = a; onAccuracy?.(a) }
  }
  window.addEventListener('deviceorientationabsolute', take, true)
  window.addEventListener('deviceorientation', take, true)
  const timer = setTimeout(() => { if (!got && !stopped) onNone?.() }, waitMs)
  return () => {
    stopped = true
    clearTimeout(timer)
    if (raf) cancelAnimationFrame(raf)
    window.removeEventListener('deviceorientationabsolute', take, true)
    window.removeEventListener('deviceorientation', take, true)
  }
}
