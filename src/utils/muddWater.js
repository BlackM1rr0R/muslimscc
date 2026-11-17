// ═══════════════════════════════════════════════════════
// Bir mudd su (components/MuddWater.jsx) — saf hesab və yerli tarixçə
//
// • Mudd — Peyğəmbər ﷺ dövrünün həcm ölçüsü (iki ovuc dolusu). Müasir
//   litrlə qiymətləndirmələr fərqlidir: təxminən 0,5–0,75 L. Müqayisə üçün
//   orta qiymət (MUDD_L) götürülür, ekranda "təxminən" yazılır.
// • Kran axını L/dəq: zəif ≈ 4, adi ≈ 8, güclü ≈ 12 və ya istifadəçinin öz rəqəmi.
// • Tarixçə: son 7 dəstəmaz, localStorage 'muslim_cc_mudd_log'.
// • MUDD_HADITH — src/data/hadiths.js id 1602-nin OLDUĞU KİMİ surəti (komponent
//   1 MB-lıq hədis faylını yükləməsin deyə). tests/unit/muddWater.test.js
//   surətin data ilə hərfi-hərfinə eyni olduğunu yoxlayır.
// ═══════════════════════════════════════════════════════

export const MUDD_MIN_L = 0.5
export const MUDD_MAX_L = 0.75
export const MUDD_L = (MUDD_MIN_L + MUDD_MAX_L) / 2   // 0.625 — müqayisə üçün orta qiymət
export const LOG_KEY = 'muslim_cc_mudd_log'
export const LOG_MAX = 7

export const FLOWS = { low: 4, normal: 8, strong: 12 }
export const FLOW_IDS = ['low', 'normal', 'strong', 'custom']
export const CUSTOM_MIN = 0.5
export const CUSTOM_MAX = 30

/** src/data/hadiths.js → id 1602 (verbatim) */
export const MUDD_HADITH = Object.freeze({
  id: 1602,
  source: 'Muslim, Hayz 51',
  ar: 'كَانَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ يَغْتَسِلُ بِالصَّاعِ وَيَتَوَضَّأُ بِالْمُدِّ',
  text: Object.freeze({
    az: "Rəsulullah (s.a.s) bir sa' su ilə qüsl alır, bir müdd su ilə dəstəmaz alırdı.",
    en: "The Messenger of Allah would perform ghusl with a sa' of water and wudu with a mudd of water.",
    ru: 'Посланник Аллаха совершал полное омовение одним саа воды и малое омовение одним муддом воды.',
    tr: "Rasulullah (s.a.s) bir sa' su ile gusül alır, bir müdd su ile abdest alırdı.",
    ar: 'كَانَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ يَغْتَسِلُ بِالصَّاعِ وَيَتَوَضَّأُ بِالْمُدِّ',
  }),
})

const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : Number.NaN)

/** Axın (L/dəq): hazır seçim və ya sərhədlənmiş xüsusi rəqəm */
export function flowLpm(id, custom) {
  if (FLOWS[id]) return FLOWS[id]
  const c = num(Number(custom))
  if (!Number.isFinite(c) || c <= 0) return FLOWS.normal
  return Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, c))
}

/** "Bir litri neçə saniyəyə doldurur" → L/dəq */
export function lpmFromFillSeconds(sec) {
  const s = num(Number(sec))
  if (!Number.isFinite(s) || s <= 0) return Number.NaN
  return Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, 60 / s))
}

/** Saniyə × L/dəq → litr */
export function litresFor(seconds, lpm) {
  const s = num(seconds), f = num(lpm)
  if (!Number.isFinite(s) || !Number.isFinite(f) || s <= 0 || f <= 0) return 0
  return (s * f) / 60
}

/** Neçə mudd (orta qiymətlə) */
export const muddRatio = (litres, mudd = MUDD_L) => (litres > 0 ? litres / mudd : 0)

/** data-litres üçün: 1 onluq, nöqtə ilə */
export const fmt1 = (x) => (Number.isFinite(x) ? Math.max(0, x) : 0).toFixed(1)

/** "90", "1:30", "1.5m" → saniyə (yanlışdırsa NaN). 0 < s ≤ 1 saat */
export function parseSeconds(input) {
  const s = String(input ?? '').trim().replace(',', '.')
  if (!s) return Number.NaN
  let v
  const mm = /^(\d{1,2}):(\d{1,2})$/.exec(s)
  if (mm) v = Number(mm[1]) * 60 + Number(mm[2])
  else if (/^\d+(\.\d+)?m$/i.test(s)) v = Number(s.slice(0, -1)) * 60
  else if (/^\d+(\.\d+)?s?$/i.test(s)) v = Number(s.replace(/s$/i, ''))
  else return Number.NaN
  return v > 0 && v <= 3600 ? Math.round(v) : Number.NaN
}

/** 95 → "1:35" */
export function fmtClock(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Qabın tutumu (L): ən azı 5 mudd, istifadə çoxdursa yuxarı yuvarlaqlaşdırılmış */
export function vesselCap(litres) {
  const min = MUDD_L * 5
  if (!(litres > min * 0.9)) return min
  return Math.ceil((litres * 1.15) / MUDD_L) * MUDD_L
}

// ── Tarixçə ─────────────────────────────────────────────
const validEntry = (e) => e && typeof e === 'object'
  && Number.isFinite(e.t) && Number.isFinite(e.s) && Number.isFinite(e.l) && e.s > 0 && e.l >= 0

/** JSON → təmiz massiv (ən çox 7, köhnədən yeniyə) */
export function parseLog(raw) {
  let arr
  try { arr = JSON.parse(raw || '[]') } catch { return [] }
  if (!Array.isArray(arr)) return []
  return arr.filter(validEntry).slice(-LOG_MAX)
}

/** Yeni qeyd əlavə et (dəyişməz), son 7 qalır */
export function addEntry(log, { t, s, lpm }) {
  const l = litresFor(s, lpm)
  const e = { t, s: Math.round(s), lpm: Math.round(lpm * 10) / 10, l: Math.round(l * 100) / 100 }
  if (!validEntry(e)) return log
  return [...log, e].slice(-LOG_MAX)
}

export function loadLog(storage) {
  try { return parseLog(storage?.getItem(LOG_KEY)) } catch { return [] }
}
export function saveLog(storage, log) {
  try { storage?.setItem(LOG_KEY, JSON.stringify(log.slice(-LOG_MAX))) } catch { /* dolu / bağlı */ }
}

/**
 * Meyl: { avg, last, prevAvg, change } — change = son / əvvəlkilərin ortası − 1
 * (mənfi → az su). 2-dən az qeyd varsa change = null.
 */
export function trendOf(log) {
  if (!log.length) return { avg: 0, last: 0, prevAvg: 0, change: null }
  const ls = log.map(e => e.l)
  const avg = ls.reduce((a, b) => a + b, 0) / ls.length
  const last = ls[ls.length - 1]
  if (ls.length < 2) return { avg, last, prevAvg: 0, change: null }
  const prev = ls.slice(0, -1)
  const prevAvg = prev.reduce((a, b) => a + b, 0) / prev.length
  return { avg, last, prevAvg, change: prevAvg > 0 ? last / prevAvg - 1 : null }
}
