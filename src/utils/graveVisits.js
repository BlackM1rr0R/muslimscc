// ═══════════════════════════════════════════════════════
// Şəxsi qəbir ziyarəti xəritəsi (/grave-visits) — YALNIZ bu cihazda, profilə aid, gizli.
// Hesabın E2E şifrəli sinxronizasiyası və ehtiyat nüsxə onu özü daşıyır (utils/userBackup) — serverə açıq
// heç nə getmir. Xəritə plitəsi YÜKLƏNMİR (koordinat üçüncü tərəfə getməsin): nöqtələr yerli SVG-də,
// "Xəritədə aç" yalnız istifadəçinin toxunuşu ilə (məscid axtarışındakı kimi).
//   grave_visits_v1  { v: 1, l: [{ id, n, la, lo, no?, u }] }
//     n  — kimin qəbri (≤ 60), la/lo — en/uzunluq (6 onluq), no — qeyd (≤ 300, istəyə bağlı)
//     u  — son dəyişiklik anı (ms): sinxronizasiyada eyni nöqtə iki cihazda dəyişibsə təzəsi qalır
// Birləşdirici: utils/syncMergers → MERGERS[GRAVES_KEY]. tests/unit/grave-visits.test.js
// ═══════════════════════════════════════════════════════
import { cleanText as _clean } from './mosqueVisits'
import { isObj, safeStorage, parse } from './journeyStore'

export const GRAVES_KEY = 'grave_visits_v1'
export const GRAVES_EVENT = 'mcc-graves'
export const NAME_MAX = 60
export const NOTE_MAX = 300
export const GRAVES_MAX = 100
export const NEAR_M = 150          // bu məsafədə "yaxınlıqdasınız" (GPS dəqiqliyi + qəbiristanlıq ölçüsü)
const ID_RE = /^g[a-z0-9]{4,23}$/

export { safeStorage }
const cleanText = (s, max) => [..._clean(s, 10 * max)].slice(0, max).join('')
const emit = () => { try { globalThis.dispatchEvent?.(new CustomEvent(GRAVES_EVENT)) } catch { /* */ } }
const round6 = (x) => Math.round(x * 1e6) / 1e6
export const validLat = (v) => typeof v === 'number' && Number.isFinite(v) && v >= -90 && v <= 90
export const validLng = (v) => typeof v === 'number' && Number.isFinite(v) && v >= -180 && v <= 180

/** Bir nöqtə → təmiz forma və ya null */
export function sanitizeGrave(x) {
  if (!isObj(x) || typeof x.id !== 'string' || !ID_RE.test(x.id)) return null
  if (!validLat(x.la) || !validLng(x.lo)) return null
  const n = cleanText(x.n, NAME_MAX)
  if (!n) return null
  const out = { id: x.id, n, la: round6(x.la), lo: round6(x.lo) }
  const no = cleanText(x.no, NOTE_MAX)
  if (no) out.no = no
  const u = Number(x.u)
  out.u = Number.isFinite(u) && u > 0 ? Math.round(u) : 0
  return out
}

/** Bütün dəyər → { v: 1, l } (təkrarsız, ən çox GRAVES_MAX) */
export function sanitizeGraves(raw) {
  const list = Array.isArray(raw?.l) ? raw.l : []
  const seen = new Set(), l = []
  for (const x of list) { const e = sanitizeGrave(x); if (e && !seen.has(e.id)) { seen.add(e.id); l.push(e) } }
  return { v: 1, l: l.slice(-GRAVES_MAX) }
}

export const readGraves = (storage = safeStorage()) => sanitizeGraves(parse(storage, GRAVES_KEY, null))

function writeGraves(data, storage) {
  const v = sanitizeGraves(data)
  try { if (v.l.length) storage?.setItem(GRAVES_KEY, JSON.stringify(v)); else storage?.removeItem(GRAVES_KEY) } catch { /* yaddaş bağlıdır */ }
  emit()
  return v
}

export const newGraveId = (now = Date.now(), rnd = Math.random) => `g${now.toString(36)}${Math.floor(rnd() * 1e6).toString(36)}`.slice(0, 24)

/** Əlavə et və ya (id varsa) yenilə → { ok, data, item? } */
export function saveGrave(entry, storage = safeStorage(), now = Date.now()) {
  const cur = readGraves(storage)
  const item = sanitizeGrave({ ...entry, id: entry?.id || newGraveId(now), u: now })
  if (!item) return { ok: false, data: cur }
  const exists = cur.l.some((x) => x.id === item.id)
  if (!exists && cur.l.length >= GRAVES_MAX) return { ok: false, full: true, data: cur }
  return { ok: true, data: writeGraves({ l: exists ? cur.l.map((x) => (x.id === item.id ? item : x)) : [...cur.l, item] }, storage), item }
}

export function removeGrave(id, storage = safeStorage()) {
  const cur = readGraves(storage)
  return writeGraves({ l: cur.l.filter((x) => x.id !== id) }, storage)
}

/** İki nöqtə arasında məsafə (m), haversine */
export function distanceM(a, b) {
  const R = 6371008.8
  const rad = (d) => (d * Math.PI) / 180
  const dLa = rad(b.la - a.la), dLo = rad(b.lo - a.lo)
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.la)) * Math.cos(rad(b.la)) * Math.sin(dLo / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Mövqeyə ən yaxın nöqtələr (məsafə ilə, artan) */
export function nearest(list, pos) {
  if (!pos || !validLat(pos.la) || !validLng(pos.lo)) return []
  return (list || []).map((g) => ({ g, m: distanceM(pos, g) })).sort((x, y) => x.m - y.m)
}

/**
 * SVG üçün proyeksiya: nöqtələrin (və istəyə bağlı mövqenin) sərhəd qutusu → [0..w]×[0..h] (ekvirektanqulyar,
 * en dairəsinə görə uzunluq sıxılır). Tək nöqtədə — mərkəz. → { x(la, lo), y(la, lo) }
 */
export function projector(points, w, h, pad = 24) {
  const pts = (points || []).filter((p) => p && validLat(p.la) && validLng(p.lo))
  if (!pts.length) return { x: () => w / 2, y: () => h / 2 }
  const k = Math.cos((pts.reduce((s, p) => s + p.la, 0) / pts.length) * Math.PI / 180) || 1
  const xs = pts.map((p) => p.lo * k), ys = pts.map((p) => p.la)
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const spanX = maxX - minX, spanY = maxY - minY
  const scale = Math.min(spanX ? (w - 2 * pad) / spanX : Infinity, spanY ? (h - 2 * pad) / spanY : Infinity)
  const s = Number.isFinite(scale) ? scale : 1
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  return {
    x: (la, lo) => w / 2 + (lo * k - cx) * (Number.isFinite(scale) ? s : 0),
    y: (la) => h / 2 - (la - cy) * (Number.isFinite(scale) ? s : 0),
  }
}

/** "41.123456, 49.123456" və ya "41.1 49.1" → { la, lo } | null */
export function parseLatLng(s) {
  const m = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(String(s || ''))
  if (!m) return null
  const la = Number(m[1]), lo = Number(m[2])
  return validLat(la) && validLng(lo) ? { la, lo } : null
}
