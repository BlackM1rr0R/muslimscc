// ═══════════════════════════════════════════════════════
// flightPrayer — təyyarədə namaz vaxtları (components/FlightPrayer.jsx) — saf hesab
//
// Model: marşrut — böyük dairə (d3-geo geoInterpolate), sürət sabit. Uçuşun hər dəqiqəsində
// təyyarənin yerində Günəşin hündürlüyü (utils/rasdQibla.js → sunHorizontal, Meeus, refraksiyasız)
// hesablanır; hədd keçən dəqiqə ikiqat bölmə ilə saniyəyədək dəqiqləşdirilir.
// Təriflər saytın namaz hesabı ilə EYNİDİR (utils/prayCalc.js → CALC_METHODS):
//   • sübh  — Günəş −method.fajr dərəcəyə qalxır
//   • günəşin çıxması / məğrib — −0.833° (refraksiya + diskin radiusu)
//   • zöhr  — həqiqi günorta (saat bucağı 0 — Günəş meridianda)
//   • əsr   — hündürlük = acot(asrFactor + tan|φ − δ|) (Şafii 1, Hənəfi 2)
//   • işa   — Günəş −method.isha-ya enir, ya da məğribdən method.ishaMin dəqiqə sonra
//   • method.offset (Diyanətin temkin dəqiqələri) — hadisənin anına əlavə olunur
// Yüksək enlik düzəlişləri (gecənin yarısı və s.) burada TƏTBİQ OLUNMUR: bucaq çatmırsa hadisə yoxdur.
// Uçuş hündürlüyündə üfüq ~3° enir (horizonDip) — yalnız qeyd kimi göstərilir, hesab standart tərifdədir.
// tests/unit/flightPrayer.test.js
// ═══════════════════════════════════════════════════════
import { geoInterpolate, geoDistance } from 'd3-geo'
import { sunHorizontal, sunEq, bearing, KAABA } from './rasdQibla'
import { gmst } from './lunar'
import { CALC_METHODS } from './prayCalc'

const RAD = Math.PI / 180
const MIN = 60000
const EARTH_KM = 6371.0088
export const SUNSET_ALT = -0.833
export const EVENT_KINDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

const wrap180 = (x) => ((((x + 180) % 360) + 360) % 360) - 180

// ── Marşrut ──────────────────────────────────────────

/** A → B böyük dairə: f ∈ [0,1] → { lat, lng } (f hüdudlardan kənardırsa — uc nöqtə) */
export function greatCircle(a, b) {
  const ip = geoInterpolate([a.lng, a.lat], [b.lng, b.lat])
  return (f) => {
    const [lng, lat] = ip(Math.max(0, Math.min(1, f)))
    return { lat, lng }
  }
}

/** Böyük dairə məsafəsi (km) */
export function distanceKm(a, b) {
  return geoDistance([a.lng, a.lat], [b.lng, b.lat]) * EARTH_KM
}

/** Uçuş istiqaməti (track) f nöqtəsində — şimaldan saat əqrəbi ilə, ° */
export function trackAt(route, f) {
  const e = 1e-4
  const p = route(Math.min(f, 1 - e)), q = route(Math.min(f, 1 - e) + e)
  return bearing(p, q)
}

/** Qiblə: şimala görə istiqamət və uçuş istiqamətinə görə fərq (−180..180; müsbət — sağda) */
export function qiblaFrom(pos, track) {
  const q = bearing(pos, KAABA)
  return { bearing: q, rel: track == null ? null : wrap180(q - track) }
}

/** Hündürlükdən (km) üfüqün həndəsi enməsi, ° (refraksiya bunu bir qədər azaldır) */
export function horizonDip(hKm = 11) {
  return Math.acos(EARTH_KM / (EARTH_KM + hKm)) / RAD
}

// ── Saat qurşaqları (IANA, Intl) ─────────────────────

/** Verilmiş anda saat qurşağının UTC fərqi, dəqiqə */
export function tzOffsetMin(ms, tz) {
  try {
    const p = {}
    const f = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
    for (const x of f.formatToParts(new Date(ms))) p[x.type] = x.value
    const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second)
    return Math.round((local - Math.floor(ms / 1000) * 1000) / MIN)
  } catch {
    return -new Date(ms).getTimezoneOffset()
  }
}

/** 'YYYY-MM-DDTHH:mm' (həmin qurşağın divar saatı) → UTC ms; yararsızdırsa NaN */
export function zonedToUtc(str, tz) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(str || ''))
  if (!m) return NaN
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  let ms = wall - tzOffsetMin(wall, tz) * MIN
  ms = wall - tzOffsetMin(ms, tz) * MIN // yay vaxtı keçidi ətrafında ikinci addım
  return ms
}

/** UTC ms → həmin qurşağın 'YYYY-MM-DDTHH:mm' divar saatı (datetime-local üçün) */
export function utcToZoned(ms, tz) {
  const d = new Date(ms + tzOffsetMin(ms, tz) * MIN)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

/** 'h:mm', 'h.mm' və ya 'h' → dəqiqə; yararsızdırsa NaN */
export function parseDuration(s) {
  const t = String(s || '').trim()
  let m = /^(\d{1,2})\s*[:.hч]\s*(\d{1,2})\s*$/i.exec(t)
  if (m && +m[2] < 60) return +m[1] * 60 + +m[2]
  m = /^(\d{1,2})$/.exec(t)
  return m ? +m[1] * 60 : NaN
}

/** Dəqiqə → 'h:mm' */
export const fmtDuration = (min) => `${Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, '0')}`

/** 'lat, lng' mətni → { lat, lng } və ya null */
export function parseLatLng(s) {
  const m = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(String(s || ''))
  if (!m) return null
  const lat = +m[1], lng = +m[2]
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null
}

// ── Günəş ─────────────────────────────────────────────

export const sunAltitude = (ms, lat, lng) => sunHorizontal(ms, lat, lng).alt

/** Günəşin saat bucağı (°, −180..180; 0 — günorta, müsbət — günortadan sonra) */
export function hourAngle(ms, lng) {
  const e = sunEq(ms)
  return wrap180(gmst(ms) + lng - e.ra)
}

/** Günəşin başı üstündə olduğu nöqtə (terminator üçün) — { lat, lng } */
export function subsolarPoint(ms) {
  const e = sunEq(ms)
  return { lat: e.dec, lng: wrap180(e.ra - gmst(ms)) }
}

/** Əsr hündürlüyü (prayCalc ilə eyni düstur): acot(factor + tan|φ − δ|) */
export function asrAltitude(ms, lat, factor = 1) {
  const dec = sunEq(ms).dec
  return Math.atan(1 / (factor + Math.tan(Math.abs(lat - dec) * RAD))) / RAD
}

/** Saytın yer metodu (aladhan nömrəsi) → CALC_METHODS açarı (iftarInvite.js kimi: 99 → abubakr, qalanı → diyanet) */
export const methodKeyFor = (num) => (Number(num) === 99 ? 'abubakr' : 'diyanet')

// ── Hadisələr ─────────────────────────────────────────

/**
 * Uçuş boyu namaz vaxtı hadisələri.
 * @param {{from:{lat,lng}, to:{lat,lng}, depMs:number, durMin:number, method?:object, asrFactor?:number, stepMin?:number}} o
 * @returns {Array<{kind, ms, elapsedMin, f, lat, lng, track, qibla, rel, sunAlt}>} — zamana görə sıralı
 */
export function flightEvents({ from, to, depMs, durMin, method = CALC_METHODS.abubakr, asrFactor, stepMin = 1 }) {
  if (!(durMin > 0) || !Number.isFinite(depMs)) return []
  const route = greatCircle(from, to)
  const durMs = durMin * MIN
  const posAt = (ms) => route((ms - depMs) / durMs)
  const factor = asrFactor ?? method.asrFactor ?? 1
  const alt = (ms) => { const p = posAt(ms); return sunAltitude(ms, p.lat, p.lng) }
  const ha = (ms) => hourAngle(ms, posAt(ms).lng)

  // Funksiyalar: işarə dəyişməsi = hadisə
  const fns = {
    fajr: (ms) => alt(ms) + method.fajr,
    sun: (ms) => alt(ms) - SUNSET_ALT,
    asr: (ms) => { const p = posAt(ms); return sunAltitude(ms, p.lat, p.lng) - asrAltitude(ms, p.lat, factor) },
    isha: method.isha != null ? (ms) => alt(ms) + method.isha : null,
    noon: ha,
  }
  const bisect = (fn, t1, t2) => {
    let a1 = fn(t1)
    for (let i = 0; i < 24; i++) {
      const m = (t1 + t2) / 2, am = fn(m)
      if (am * a1 <= 0) t2 = m; else { t1 = m; a1 = am }
    }
    return Math.round((t1 + t2) / 2)
  }
  // İşa (məğrib + N dəq) üçün uçuşdan N dəqiqə əvvəldən baxılır (təyyarə hələ yerdədir)
  const lead = method.ishaMin ? method.ishaMin * MIN : 0
  const t0 = depMs - lead, t1 = depMs + durMs
  const step = stepMin * MIN
  const raw = []
  const scan = (key, fn, test) => {
    let pt = t0, pv = fn(pt)
    for (let t = Math.min(t0 + step, t1); ; t = Math.min(t + step, t1)) {
      const v = fn(t)
      if (pv * v <= 0 && pv !== v && test(pv, v, pt, t)) raw.push({ key, ms: bisect(fn, pt, t), up: v > pv })
      pt = t; pv = v
      if (t >= t1) break
    }
  }
  scan('fajr', fns.fajr, (a, b) => b > a)
  scan('sun', fns.sun, () => true)
  scan('asr', fns.asr, (a, b, ta) => b < a && ha(ta) > 0)
  scan('noon', fns.noon, (a, b) => b > a && Math.abs(b - a) < 90) // −→+ (gecəyarısı ±180 sıçrayışı deyil)
  if (fns.isha) scan('isha', fns.isha, (a, b) => b < a)

  const off = method.offset || {}
  const out = []
  const push = (kind, ms) => {
    ms += (off[kind] || 0) * MIN
    if (ms < depMs || ms > t1) return
    const f = (ms - depMs) / durMs
    const p = route(f), track = trackAt(route, f), q = qiblaFrom(p, track)
    out.push({ kind, ms, elapsedMin: (ms - depMs) / MIN, f, lat: p.lat, lng: p.lng, track, qibla: q.bearing, rel: q.rel, sunAlt: sunAltitude(ms, p.lat, p.lng) })
  }
  for (const r of raw) {
    if (r.key === 'fajr') push('fajr', r.ms)
    else if (r.key === 'sun') {
      if (r.up) push('sunrise', r.ms)
      else {
        push('maghrib', r.ms)
        if (method.ishaMin) push('isha', r.ms + method.ishaMin * MIN)
      }
    } else if (r.key === 'asr') push('asr', r.ms)
    else if (r.key === 'noon') push('dhuhr', r.ms)
    else if (r.key === 'isha') push('isha', r.ms)
  }
  return out.sort((a, b) => a.ms - b.ms)
}
