// ═══════════════════════════════════════════════════════
// Səyyahın "Səfərlərim" siyahısı (/traveller-kit) — yalnız yaddaş (hesab utils/travelKit-dədir; birləşdirici yüngül qalsın)
//
// Açar: traveller_trips_v1 { v: 1, l: [{ id, n, la, lo, tz, cc, u }] } — profilə aid (PROFILE_KEYS),
//   ehtiyat nüsxəyə və hesabın E2E şifrəli sinxronizasiyasına düşür (birləşdirici — utils/syncMergers → mergeTrips).
//   n — yerin adı (≤ 80), la/lo — koordinat (4 onluq), tz — IANA saat qurşağı, cc — ölkə kodu, u — son dəyişiklik (ms).
// tests/unit/travel-kit.test.js
// ═══════════════════════════════════════════════════════
import { isObj, safeStorage, parse } from './journeyStore'

export const TRIPS_KEY = 'traveller_trips_v1'
export const TRIPS_EVENT = 'mcc-trips'
export const TRIPS_MAX = 20
export const NAME_MAX = 80
const ID_RE = /^t[a-z0-9]{4,23}$/
const CC_RE = /^[A-Z]{2}$/

export { safeStorage }
const round4 = (x) => Math.round(x * 1e4) / 1e4
const emit = () => { try { globalThis.dispatchEvent?.(new CustomEvent(TRIPS_EVENT)) } catch { /* SSR */ } }

/** IANA saat qurşağı Intl-də tanınırmı */
export function validTz(tz) {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true } catch { return false }
}

const cleanName = (s) => [...String(s ?? '').normalize('NFC').replace(/[\p{Cc}‎‏‪-‮⁦-⁩]/gu, '').replace(/\s+/g, ' ').trim()].slice(0, NAME_MAX).join('')

/** Bir səfər → təmiz forma və ya null */
export function sanitizeTrip(x) {
  if (!isObj(x) || typeof x.id !== 'string' || !ID_RE.test(x.id)) return null
  const la = Number(x.la), lo = Number(x.lo)
  if (!Number.isFinite(la) || la < -90 || la > 90 || !Number.isFinite(lo) || lo < -180 || lo > 180) return null
  const n = cleanName(x.n)
  if (!n || !validTz(x.tz)) return null
  const out = { id: x.id, n, la: round4(la), lo: round4(lo), tz: x.tz }
  const cc = String(x.cc || '').toUpperCase()
  if (CC_RE.test(cc)) out.cc = cc
  const u = Number(x.u)
  out.u = Number.isFinite(u) && u > 0 ? Math.round(u) : 0
  return out
}

/** Bütün dəyər → { v: 1, l } (təkrarsız, ən çox TRIPS_MAX — ən təzələri) */
export function sanitizeTrips(raw) {
  const list = Array.isArray(raw?.l) ? raw.l : []
  const seen = new Set(), l = []
  for (const x of list) { const e = sanitizeTrip(x); if (e && !seen.has(e.id)) { seen.add(e.id); l.push(e) } }
  return { v: 1, l: l.slice(-TRIPS_MAX) }
}

export const readTrips = (storage = safeStorage()) => sanitizeTrips(parse(storage, TRIPS_KEY, null))

function writeTrips(data, storage) {
  const v = sanitizeTrips(data)
  try { if (v.l.length) storage?.setItem(TRIPS_KEY, JSON.stringify(v)); else storage?.removeItem(TRIPS_KEY) } catch { /* yaddaş bağlıdır */ }
  emit()
  return v
}

export const newTripId = (now = Date.now(), rnd = Math.random) => `t${now.toString(36)}${Math.floor(rnd() * 1e6).toString(36)}`.slice(0, 24)
const sameSpot = (a, b) => Math.abs(a.la - b.la) < 0.01 && Math.abs(a.lo - b.lo) < 0.01

/**
 * Yer → səfərlərə əlavə (eyni nöqtə artıq varsa — yalnız adı/vaxtı yenilənir).
 * place: { lat, lng, tz, label, country? } → { ok, data, item?, full? }
 */
export function saveTrip(place, storage = safeStorage(), now = Date.now()) {
  const cur = readTrips(storage)
  const draft = { id: newTripId(now), n: place?.label, la: place?.lat, lo: place?.lng, tz: place?.tz, cc: place?.country, u: now }
  const item = sanitizeTrip(draft)
  if (!item) return { ok: false, data: cur }
  const dup = cur.l.find((x) => sameSpot(x, item))
  if (dup) {
    const upd = { ...dup, n: item.n, u: now }
    return { ok: true, data: writeTrips({ l: [...cur.l.filter((x) => x.id !== dup.id), upd] }, storage), item: upd }
  }
  if (cur.l.length >= TRIPS_MAX) return { ok: false, full: true, data: cur }
  return { ok: true, data: writeTrips({ l: [...cur.l, item] }, storage), item }
}

export function removeTrip(id, storage = safeStorage()) {
  const cur = readTrips(storage)
  return writeTrips({ l: cur.l.filter((x) => x.id !== id) }, storage)
}

/** Saxlanılan səfər → səhifənin yer formatı */
export const tripPlace = (t) => ({ lat: t.la, lng: t.lo, tz: t.tz, label: t.n, country: t.cc || '' })

/**
 * Sinxronizasiya birləşdiricisi (3 tərəfli): id üzrə; iki tərəfdə dəyişibsə — u-su təzə olan.
 * Bazada olub bir tərəfdə silinən — silinir. null — boş.
 */
export function mergeTrips(L, R, B) {
  const l = sanitizeTrips(L).l, r = sanitizeTrips(R).l
  const b = B == null ? null : sanitizeTrips(B).l
  const byL = new Map(l.map((x) => [x.id, x])), byR = new Map(r.map((x) => [x.id, x]))
  const inB = new Set((b || []).map((x) => x.id))
  const out = []
  for (const id of new Set([...byL.keys(), ...byR.keys()])) {
    const a = byL.get(id), c = byR.get(id)
    if (a && c) out.push((c.u || 0) > (a.u || 0) ? c : a)
    else if (inB.has(id)) continue          // bir tərəfdə silinib
    else out.push(a || c)
  }
  out.sort((x, y) => (x.u || 0) - (y.u || 0))
  const v = sanitizeTrips({ l: out })
  return v.l.length ? v : null
}
