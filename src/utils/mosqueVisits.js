// ═══════════════════════════════════════════════════════
// "Məscid kolleksiyam" — ziyarət etdiyiniz məscidlər (saf hesab + yaddaş)
//
// Açar: mosque_visits_v1 → { v: 1, l: [ziyarət] } (profilə aiddir; ehtiyat nüsxə + hesabın
// uçdan-uca şifrəli sinxronizasiyası — serverə açıq məlumat getmir). Ziyarət:
//   i  — kimlik: OSM obyekti ('n123', 'w5', 'r7') və ya koordinatdan ('g40.3712,49.8341')
//   n  — ad (OSM-dən, ≤ 80); la, lo — koordinat ~4 onluq (≈ 11 m)
//   cc — ölkə (ISO 3166-1 rəqəmli kod, world-atlas sərhədlərindən; tapılmasa yoxdur)
//   d  — ilk ziyarət günü; ld — son ziyarət günü; c — ziyarət günlərinin sayı
//   no — qısa qeyd (≤ 200)
// Təkrar: eyni OSM obyekti və ya ≤ 30 m-dəki nöqtə — yeni yazı yox, ziyarət sayı artır.
// tests/unit/mosque-visits.test.js
// ═══════════════════════════════════════════════════════
import { haversine } from './osmQuery'

export const VISITS_KEY = 'mosque_visits_v1'
export const VISITS_EVENT = 'mosque-visits-change'
export const NOTE_MAX = 200
export const NAME_MAX = 80
export const VISITS_MAX = 500
export const SAME_KM = 0.03
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const ID_RE = /^([nwr]\d{1,15}|g-?\d{1,3}(\.\d{1,4})?,-?\d{1,3}(\.\d{1,4})?)$/
const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }

export const round4 = (v) => Math.round(Number(v) * 1e4) / 1e4
export const cleanText = (s, max) => [...String(s ?? '').normalize('NFC')]
  .map((ch) => (ch.charCodeAt(0) < 32 || ch === '\u007f' ? ' ' : ch)).join('').replace(/\s+/g, ' ').trim()
  .slice(0, max)
const validLat = (v) => Number.isFinite(v) && v >= -90 && v <= 90
const validLon = (v) => Number.isFinite(v) && v >= -180 && v <= 180

/** Kimlik: OSM obyekti ('n'|'w'|'r' + id) və ya yuvarlanmış koordinat */
export function visitId({ osm, la, lo }) {
  if (typeof osm === 'string' && /^[nwr]\d{1,15}$/.test(osm)) return osm
  return `g${round4(la)},${round4(lo)}`
}

export function sanitizeVisit(v) {
  if (!v || typeof v !== 'object') return null
  const la = round4(v.la), lo = round4(v.lo)
  if (!validLat(la) || !validLon(lo) || !DATE_RE.test(v.d)) return null
  const i = typeof v.i === 'string' && ID_RE.test(v.i) ? v.i : visitId({ la, lo })
  const out = { i, n: cleanText(v.n, NAME_MAX), la, lo, d: v.d }
  if (typeof v.cc === 'string' && /^\d{3}$/.test(v.cc)) out.cc = v.cc
  out.ld = DATE_RE.test(v.ld) && v.ld >= v.d ? v.ld : v.d
  out.c = Number.isInteger(v.c) && v.c > 0 ? Math.min(v.c, 9999) : 1
  const no = cleanText(v.no, NOTE_MAX)
  if (no) out.no = no
  return out
}

export function sanitizeVisits(raw) {
  const list = Array.isArray(raw?.l) ? raw.l : []
  const seen = new Set(), l = []
  for (const x of list) {
    const v = sanitizeVisit(x)
    if (v && !seen.has(v.i)) { seen.add(v.i); l.push(v) }
  }
  return { v: 1, l: l.slice(-VISITS_MAX) }
}

export function readVisits(storage = safeStorage()) {
  try { return sanitizeVisits(JSON.parse(storage?.getItem(VISITS_KEY) || 'null')) } catch { return { v: 1, l: [] } }
}
export function writeVisits(data, storage = safeStorage()) {
  const clean = sanitizeVisits(data)
  try {
    if (clean.l.length) storage?.setItem(VISITS_KEY, JSON.stringify(clean))
    else storage?.removeItem(VISITS_KEY)
  } catch { return false }
  try { globalThis.dispatchEvent?.(new CustomEvent(VISITS_EVENT)) } catch { /* */ }
  return true
}

/** Artıq kolleksiyada olan ziyarət (eyni OSM obyekti və ya ≤ 30 m) və ya null */
export function findSame(list, m) {
  const id = visitId(m)
  const isOsm = (i) => /^[nwr]\d/.test(i)
  // İki fərqli OSM obyekti yan-yana ola bilər (iki məscid) — onlar məsafəyə görə birləşmir
  const near = (v) => !(isOsm(v.i) && isOsm(id)) && haversine(v.la, v.lo, Number(m.la), Number(m.lo)) <= SAME_KM
  return list.find((v) => v.i === id) || list.find(near) || null
}

/**
 * Ziyarəti qeyd et (SAF). m: { osm?, n, la, lo, cc?, no? }; today — 'YYYY-MM-DD'.
 * → { data, entry, added } — added=false: məscid artıq var (bu gün ilk dəfədirsə c++).
 */
export function addVisit(data, m, today) {
  const list = data.l.slice()
  const same = findSame(list, m)
  if (same) {
    const upd = { ...same }
    if (today > upd.ld) { upd.ld = today; upd.c += 1 }
    if (!upd.n && m.n) upd.n = cleanText(m.n, NAME_MAX)
    if (!upd.cc && m.cc) upd.cc = m.cc
    const no = cleanText(m.no, NOTE_MAX)
    if (no) upd.no = no
    const entry = sanitizeVisit(upd)
    return { data: { v: 1, l: list.map((v) => (v.i === same.i ? entry : v)) }, entry, added: false }
  }
  const entry = sanitizeVisit({ i: visitId(m), n: m.n, la: m.la, lo: m.lo, cc: m.cc, d: today, ld: today, c: 1, no: m.no })
  if (!entry) return { data, entry: null, added: false }
  return { data: sanitizeVisits({ l: [...list, entry] }), entry, added: true }
}

export const removeVisit = (data, id) => ({ v: 1, l: data.l.filter((v) => v.i !== id) })
export function setNote(data, id, note) {
  return sanitizeVisits({ l: data.l.map((v) => (v.i === id ? { ...v, no: note } : v)) })
}

/** { mosques, countries, visits } */
export function visitStats(data) {
  const cc = new Set()
  let visits = 0
  for (const v of data.l) { if (v.cc) cc.add(v.cc); visits += v.c }
  return { mosques: data.l.length, countries: cc.size, visits }
}

/** İki cihazda eyni ziyarət dəyişibsə (sinxronizasiya): ilk gün — ən erkən, son — ən gec, say — max */
export function combineVisit(a, b) {
  const newer = b.ld > a.ld ? b : a
  return sanitizeVisit({
    ...a, n: a.n || b.n, cc: a.cc || b.cc,
    d: a.d < b.d ? a.d : b.d, ld: newer.ld, c: Math.max(a.c, b.c), no: newer.no ?? a.no ?? b.no,
  })
}
