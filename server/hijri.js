// SURƏT (CommonJS): src/utils/hijri.js-in çevirmə nüvəsi — alqoritm dəyişikliyi orada edilməlidir;
// tests/unit/server-hijri.test.js iki faylın eyni nəticə verdiyini yoxlayır.
'use strict'
// ═══════════════════════════════════════════════════════
// Hicri ↔ miladi çevirmə — serverdə (server/personal.js: zəkat ili)
//
// Miladi → hicri: Intl Ümmül-Qura təqvimi ('islamic-umalqura' — saytdakı ilə eyni mənbə;
// Node-un rəsmi image-lərində tam ICU var). Bütün hesablar UTC günorta ilə aparılır.
// Hicri → miladi: arifmetik təxmin, sonra ±5 gün Intl ilə yoxlanılır.
// Intl Ümmül-Qura yoxdursa hər iki istiqamət arifmetik təqvimə düşür.
// ═══════════════════════════════════════════════════════

const MIN_G_YEAR = 622
const MAX_G_YEAR = 2400
const MIN_H_YEAR = 1
const MAX_H_YEAR = 1850
const DAY = 86400000

function utcNoon(y, m, d) {
  const dt = new Date(Date.UTC(2000, 0, 1, 12))
  dt.setUTCFullYear(y, m - 1, d)
  return dt
}

const pad = (n, w = 2) => String(n).padStart(w, '0')
const gKey = ({ year, month, day }) => `${pad(year, 4)}-${pad(month)}-${pad(day)}`

function gDaysInMonth(year, month) {
  return utcNoon(year, month + 1, 0).getUTCDate()
}
function isValidGregorian(g) {
  if (!g) return false
  const { year, month, day } = g
  return Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)
    && year >= MIN_G_YEAR && year <= MAX_G_YEAR && month >= 1 && month <= 12
    && day >= 1 && day <= gDaysInMonth(year, month)
}
function parseGKey(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''))
  if (!m) return null
  const g = { year: +m[1], month: +m[2], day: +m[3] }
  return isValidGregorian(g) ? g : null
}

function addGDays(g, n) {
  const d = utcNoon(g.year, g.month, g.day)
  d.setTime(d.getTime() + n * DAY)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}
const gDiffDays = (a, b) =>
  Math.round((utcNoon(b.year, b.month, b.day) - utcNoon(a.year, a.month, a.day)) / DAY)

// ── Arifmetik (cədvəlli) hicri təqvim ──
const ISLAMIC_EPOCH = 1948439.5
function gToJd(y, m, d) {
  return Math.floor(utcNoon(y, m, d).getTime() / DAY) + 2440587.5
}
function jdToG(jd) {
  const d = new Date(Math.round((jd - 2440587.5) * DAY) + 12 * 3600000)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}
function hToJdCivil(y, m, d) {
  return d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + ISLAMIC_EPOCH - 1
}
function gregorianToHijriCivil(g) {
  const jd = Math.floor(gToJd(g.year, g.month, g.day)) + 0.5
  const year = Math.floor((30 * (jd - ISLAMIC_EPOCH) + 10646) / 10631)
  const month = Math.min(12, Math.ceil((jd - (29 + hToJdCivil(year, 1, 1))) / 29.5) + 1)
  const day = jd - hToJdCivil(year, month, 1) + 1
  return { year, month, day: Math.round(day) }
}
const hijriToGregorianCivil = (h) => jdToG(hToJdCivil(h.year, h.month, h.day))

// ── Intl Ümmül-Qura ──
let fmt = null
let fmtTried = false
function umqFormatter() {
  if (fmtTried) return fmt
  fmtTried = true
  try {
    const f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric',
    })
    if (String(f.resolvedOptions().calendar || '').startsWith('islamic')) fmt = f
  } catch { fmt = null }
  return fmt
}
const hasUmmAlQura = () => !!umqFormatter()

function gregorianToHijri(g) {
  const f = umqFormatter()
  if (f) {
    try {
      const parts = f.formatToParts(utcNoon(g.year, g.month, g.day))
      const num = (t) => Number((parts.find(p => p.type === t) || {}).value)
      const h = { year: num('year'), month: num('month'), day: num('day') }
      if (h.month >= 1 && h.month <= 12 && h.day >= 1 && h.day <= 30 && h.year >= 1) return h
    } catch { /* aşağıdakı ehtiyat */ }
  }
  return gregorianToHijriCivil(g)
}

function isValidHijriShape(h) {
  return !!h && Number.isInteger(h.year) && Number.isInteger(h.month) && Number.isInteger(h.day)
    && h.year >= MIN_H_YEAR && h.year <= MAX_H_YEAR && h.month >= 1 && h.month <= 12 && h.day >= 1 && h.day <= 30
}

function hijriMonthLengthCivil(y, m) {
  return Math.round(hToJdCivil(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, 1) - hToJdCivil(y, m, 1))
}

function hijriToGregorian(h) {
  if (!isValidHijriShape(h)) return null
  const est = hijriToGregorianCivil(h)
  if (!hasUmmAlQura()) return h.day === 30 && hijriMonthLengthCivil(h.year, h.month) < 30 ? null : est
  for (const off of [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5]) {
    const g = addGDays(est, off)
    const x = gregorianToHijri(g)
    if (x.year === h.year && x.month === h.month && x.day === h.day) return isValidGregorian(g) ? g : null
  }
  return null
}

function hijriMonthLength(year, month) {
  return hijriToGregorian({ year, month, day: 30 }) ? 30 : 29
}

module.exports = {
  utcNoon, gKey, parseGKey, gDaysInMonth, isValidGregorian, addGDays, gDiffDays,
  gregorianToHijriCivil, hijriToGregorianCivil, hasUmmAlQura, gregorianToHijri,
  isValidHijriShape, hijriToGregorian, hijriMonthLength,
}
