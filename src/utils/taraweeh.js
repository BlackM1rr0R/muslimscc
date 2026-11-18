// ═══════════════════════════════════════════════════════
// Təravih gündəliyi (J4) — Ramazan gecələri üçün sadə qeyd (components/ramadan/TaraweehLog)
//
// Açar: muslim_cc_taraweeh_v1 → { '<hicri il>': { '<gecə 1..30>': rəkət } }
//   rəkət: 0 — qılındı (say göstərilməyib), 2…40 — istifadəçinin özü seçdiyi say (8 / 20 / başqa).
// Rəkət sayı yalnız istifadəçinin öz qeydidir — sayt heç bir say barədə hökm vermir.
// Profilə aiddir (PROFILE_KEYS), ehtiyat nüsxəyə və hesab sinxronizasiyasına düşür
// (birləşdirici: gecə üzrə 3 tərəfli — utils/syncMergers). tests/unit/taraweeh.test.js
// ═══════════════════════════════════════════════════════
import { ramadanRange } from './ramadanRange'
import { addGDays, parseGKey, gKey } from './hijri'

export const TARAWEEH_KEY = 'muslim_cc_taraweeh_v1'
export const TARAWEEH_EVENT = 'mcc-taraweeh'
export const RAKAT_MIN = 2
export const RAKAT_MAX = 40
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }

/** Rəkət dəyəri: 0 (say yoxdur) və ya 2…40 tam ədəd; yararsız — null */
export function normRakat(v) {
  const n = Number(v)
  if (n === 0) return 0
  return Number.isInteger(n) && n >= RAKAT_MIN && n <= RAKAT_MAX ? n : null
}

export function sanitizeTaraweeh(raw) {
  const out = {}
  for (const [y, nights] of Object.entries(isObj(raw) ? raw : {})) {
    if (!/^\d{3,4}$/.test(y) || !isObj(nights)) continue
    const n = {}
    for (const [k, v] of Object.entries(nights)) {
      const night = Number(k), r = normRakat(v)
      if (Number.isInteger(night) && night >= 1 && night <= 30 && r !== null) n[night] = r
    }
    if (Object.keys(n).length) out[y] = n
  }
  return out
}

export function readTaraweeh(storage = safeStorage()) {
  try { return sanitizeTaraweeh(JSON.parse(storage?.getItem(TARAWEEH_KEY) || 'null')) } catch { return {} }
}

/** Gecəni qeyd et (rakat: 0 | 2…40) və ya sil (rakat = null). → yeni vəziyyət */
export function setNight(state, year, night, rakat, storage = safeStorage()) {
  const all = sanitizeTaraweeh(state)
  const y = String(year)
  const n = { ...(all[y] || {}) }
  const r = rakat === null || rakat === undefined ? null : normRakat(rakat)
  if (r === null) delete n[night]; else n[night] = r
  if (Object.keys(n).length) all[y] = n; else delete all[y]
  try {
    if (Object.keys(all).length) storage?.setItem(TARAWEEH_KEY, JSON.stringify(all))
    else storage?.removeItem(TARAWEEH_KEY)
  } catch { /* yaddaş bağlıdır */ }
  try { globalThis.dispatchEvent?.(new CustomEvent(TARAWEEH_EVENT)) } catch { /* */ }
  return all
}

/** Bir Ramazanın xülasəsi: { nights, rakats (yalnız say yazılan gecələr), counted } */
export function yearStats(state, year) {
  const n = sanitizeTaraweeh(state)[String(year)] || {}
  const vals = Object.values(n)
  const counted = vals.filter((v) => v > 0)
  return { nights: vals.length, rakats: counted.reduce((a, b) => a + b, 0), counted: counted.length }
}

/**
 * Miladi aralıqda [from, to] qılınan təravih gecələri. Ramazanın N-ci gecəsi — (N−1)-ci günün
 * axşamı (1-ci gecə Ramazandan əvvəlki axşamdır) — tarix həmin axşamın günü kimi sayılır.
 */
export function nightsInRange(state, from, to) {
  let count = 0
  for (const [y, nights] of Object.entries(sanitizeTaraweeh(state))) {
    const r = ramadanRange(Number(y))
    const s = r && parseGKey(r.s)
    if (!s) continue
    for (const k of Object.keys(nights)) {
      const d = gKey(addGDays(s, Number(k) - 2))
      if (d >= from && d <= to) count++
    }
  }
  return count
}
