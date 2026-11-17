// ═══════════════════════════════════════════════════════
// Kağız qiblə kompası və günəş saatı — saf həndəsə (components/PaperQiblaDial.jsx)
//
// • Qiblə: böyük dairə istiqaməti Kəbəyə (rasdQibla.js → bearing, KAABA).
// • Üfüqi günəş saatı: saat xətləri tan θ = sin φ · tan(15° · (h − 12)) düsturu ilə
//   (atan2 forması — 6-dan əvvəl və 18-dən sonrakı xətlər də düz düşür).
// • Qnomon — düzbucaqlı üçbucaq: saatların mərkəzindəki (O) bucağı = |φ|, dik tərəfi F-də;
//   onun təpəsi (V) əsr nişanlarının "çubuğu"dur: kölgə ucu = F + h · (−e/u, −n/u).
// • Əsr: kölgə = günorta kölgəsi + k × boy (k = 1 — Şafii, Maliki, Hənbəli; k = 2 — Hənəfi),
//   utils/asrShadow.js ilə eyni qayda; burada il boyu meyl (δ) üzrə əyri qurulur.
// • Siferblat koordinatları: x sağa, y "qütbə" (şimal yarımkürəsində şimal, cənubda cənub)
//   — cənub yarımkürəsində şəkil düzgün güzgülənir (s = −1).
// • Saat düzəlişi: günəş saatı → saat vaxtı (uzunluq + vaxt tənliyi), bu gün üçün.
// tests/unit/paperDial.test.js
// ═══════════════════════════════════════════════════════
import { KAABA, bearing, solarNoon } from './rasdQibla'
import { tzOffsetHours } from './prayCalc'

const RAD = Math.PI / 180
export const OBLIQUITY = 23.44
export const SEASONS = [
  { key: 'jun', dec: OBLIQUITY },
  { key: 'eq', dec: 0 },
  { key: 'dec', dec: -OBLIQUITY },
]

/** Yarımkürə işarəsi: şimal (və ekvator) +1, cənub −1 */
export const hemi = (lat) => (lat < 0 ? -1 : 1)

/** Şəhərdən Kəbəyə qiblə istiqaməti (°, həqiqi şimaldan saat əqrəbi ilə) */
export const qiblaBearing = (lat, lng) => bearing({ lat, lng }, KAABA)

/**
 * Saat xəttinin bucağı (°) — siferblatda günorta xəttindən (qütbə tərəf), sağa müsbət.
 * Şimalda günortadan sonrakı saatlar sağda (şərq), cənubda solda.
 */
export function hourLineAngle(lat, h) {
  const H = 15 * (h - 12) * RAD
  const th = Math.atan2(Math.sin(Math.abs(lat) * RAD) * Math.sin(H), Math.cos(H)) / RAD
  return hemi(lat) * th
}

/** Ən uzun gündə (yay gündönümü) Günəşin çıxışından günortaya qədərki saat bucağı (°) */
export function maxHalfDay(lat) {
  const c = -Math.tan(Math.min(Math.abs(lat), 89.9) * RAD) * Math.tan(OBLIQUITY * RAD)
  if (c <= -1) return 180
  if (c >= 1) return 0
  return Math.acos(c) / RAD
}

/** Siferblatda çəkiləcək saatlar (yarım saatlar da): [{ h, angle, half }] */
export function hourLines(lat) {
  const H0 = maxHalfDay(lat)
  const out = []
  for (let q = 6; q <= 42; q++) {
    const h = q / 2
    if (Math.abs(15 * (h - 12)) > Math.min(H0, 135)) continue
    out.push({ h, angle: hourLineAngle(lat, h), half: q % 2 === 1 })
  }
  return out
}

/** Günəşə yönələn vahid vektor: { e, n, u } (şərq, şimal, yuxarı); H — saat bucağı (°, günortadan sonra +) */
export function sunVec(lat, dec, Hdeg) {
  const φ = lat * RAD, δ = dec * RAD, H = Hdeg * RAD
  return {
    e: -Math.cos(δ) * Math.sin(H),
    n: Math.sin(δ) * Math.cos(φ) - Math.cos(δ) * Math.cos(H) * Math.sin(φ),
    u: Math.sin(δ) * Math.sin(φ) + Math.cos(δ) * Math.cos(H) * Math.cos(φ),
  }
}

/** Qnomonun təpəsinin (V) kölgə ucu, siferblat koordinatlarında; Günəş üfüqdən aşağıdırsa null */
export function tipPoint(lat, dec, Hdeg, gnomon) {
  const v = sunVec(lat, dec, Hdeg)
  if (v.u <= 0.01) return null
  const s = hemi(lat)
  return { x: s * (-gnomon.h * v.e / v.u), y: gnomon.b + s * (-gnomon.h * v.n / v.u) }
}

/** Əsrin saat bucağı (°, günortadan sonra) — kölgə = günorta kölgəsi + k × boy; yoxdursa null */
export function asrHourAngle(lat, dec, k = 1) {
  const z0 = Math.abs(lat - dec) * RAD
  if (z0 >= Math.PI / 2) return null
  const a = Math.atan(1 / (Math.tan(z0) + k))
  const φ = lat * RAD, δ = dec * RAD
  const c = (Math.sin(a) - Math.sin(φ) * Math.sin(δ)) / (Math.cos(φ) * Math.cos(δ))
  if (c < -1 || c > 1) return null
  return Math.acos(c) / RAD
}

/** Əsr əyrisi il boyu (δ: −23.44° … +23.44°): [{ dec, x, y }] */
export function asrCurve(lat, k, gnomon, steps = 24) {
  const out = []
  for (let i = 0; i <= steps; i++) {
    const dec = -OBLIQUITY + (2 * OBLIQUITY * i) / steps
    const H = asrHourAngle(lat, dec, k)
    if (H == null) continue
    const p = tipPoint(lat, dec, H, gnomon)
    if (p) out.push({ dec, ...p })
  }
  return out
}

/** Gündönümü və gecə-gündüz bərabərliyi günlərində əsr nişanları: [{ key, dec, H, x, y }] */
export function asrMarks(lat, k, gnomon) {
  return SEASONS.map(({ key, dec }) => {
    const H = asrHourAngle(lat, dec, k)
    const p = H == null ? null : tipPoint(lat, dec, H, gnomon)
    return p ? { key, dec, H, ...p } : null
  }).filter(Boolean)
}

/** Qnomonun ölçüsü (mm): oturacaq b, hündürlük h = b · tan|φ|; hər ikisi limit daxilində */
export function gnomonSize(lat, maxBase = 30, maxHeight = 44) {
  const t = Math.tan(Math.max(Math.abs(lat), 0.5) * RAD)
  const b = Math.min(maxBase, maxHeight / t)
  return { b, h: b * t, angle: Math.abs(lat) }
}

/** O nöqtəsindən (ox, oy) (dx, dy) istiqamətində şüanın düzbucaqlının [x0, y0, x1, y1] kənarına qədər uzunluğu */
export function rayToRect(ox, oy, dx, dy, [x0, y0, x1, y1]) {
  let t = Infinity
  if (dx > 1e-9) t = Math.min(t, (x1 - ox) / dx)
  if (dx < -1e-9) t = Math.min(t, (x0 - ox) / dx)
  if (dy > 1e-9) t = Math.min(t, (y1 - oy) / dy)
  if (dy < -1e-9) t = Math.min(t, (y0 - oy) / dy)
  return t
}

function localParts(ms, tz) {
  const p = {}
  try {
    for (const x of new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(ms))) p[x.type] = x.value
  } catch {
    const d = new Date(ms)
    Object.assign(p, { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() })
  }
  return { y: +p.year, m: +p.month, d: +p.day, min: (+p.hour % 24) * 60 + +p.minute + +p.second / 60 }
}

/**
 * Bu gün günəş saatından saat vaxtına keçid (dəqiqə): saat vaxtı = günəş saatı + total.
 * lon — saat qurşağının meridianı ilə şəhərin uzunluğu arasındakı fərq (1° = 4 dəq, yay vaxtı da daxil);
 * eot — vaxt tənliyi (müsbət: günəş saatı "irəlidədir"); noonMs — həqiqi günortanın anı.
 */
export function clockCorrection({ lng, tz }, now = Date.now()) {
  const today = localParts(now, tz)
  const noonMs = solarNoon(Date.UTC(today.y, today.m - 1, today.d), lng)
  let total = localParts(noonMs, tz).min - 720
  if (total > 720) total -= 1440
  if (total < -720) total += 1440
  const lon = tzOffsetHours(tz, today.y, today.m, today.d) * 60 - lng * 4
  return { total, lon, eot: lon - total, noonMs }
}
