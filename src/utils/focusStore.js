// ═══════════════════════════════════════════════════════
// "Quranla diqqət seansı" (/focus) — yerli yaddaş (gizli; ardıcıllıq/xal/reytinq YOXDUR)
//   focus_prefs_v1 { f, b, m: 'random' | 'surah', s, p, snd }
//       f/b — diqqət/fasilə dəqiqəsi; m — ayə seçimi; s — seçilmiş surə; p — həmin surədə növbəti ayə;
//       snd — mərhələ dəyişəndə zəng. Tərcihdir: sinxronda bu cihazınkı (utils/syncMergers).
//   focus_done_v1  { 'YYYY-MM-DD': say } — günün bitən diqqət seansları (son 14 gün; profilə aid,
//       PROFILE_KEYS). Sinxronda gün üzrə sayğac (iki cihazın artımı toplanır).
// tests/unit/focus-timer.test.js
// ═══════════════════════════════════════════════════════
import { clampFocus, clampBreak, FOCUS_MIN, BREAK_MIN } from './focusTimer'
import { AYAH_COUNTS } from './quranMap'
import { safeStorage, localDay, isObj, DATE_RE } from './journeyStore'

export const FOCUS_PREFS_KEY = 'focus_prefs_v1'
export const FOCUS_DONE_KEY = 'focus_done_v1'
const KEEP_DAYS = 14

export const DEFAULT_FOCUS_PREFS = { f: FOCUS_MIN.def, b: BREAK_MIN.def, m: 'random', s: 1, p: 1, snd: true }

const read = (storage, k) => { try { return JSON.parse(storage?.getItem(k) || 'null') } catch { return null } }

export function sanitizeFocusPrefs(v) {
  const o = isObj(v) ? v : {}
  const s = Number.isInteger(o.s) && o.s >= 1 && o.s <= 114 ? o.s : 1
  const p = Number.isInteger(o.p) && o.p >= 1 && o.p <= AYAH_COUNTS[s - 1] ? o.p : 1
  return {
    f: clampFocus(o.f ?? FOCUS_MIN.def),
    b: clampBreak(o.b ?? BREAK_MIN.def),
    m: o.m === 'surah' ? 'surah' : 'random',
    s, p,
    snd: o.snd !== false,
  }
}

export const readFocusPrefs = (storage = safeStorage()) => sanitizeFocusPrefs(read(storage, FOCUS_PREFS_KEY))

export function writeFocusPrefs(patch, storage = safeStorage()) {
  const v = sanitizeFocusPrefs({ ...readFocusPrefs(storage), ...patch })
  try { storage?.setItem(FOCUS_PREFS_KEY, JSON.stringify(v)) } catch { /* yaddaş bağlıdır */ }
  return v
}

/** Surədə növbəti ayə (sonda — yenidən 1-ci ayə) */
export const nextAyahIn = (s, p) => (p >= AYAH_COUNTS[s - 1] ? 1 : p + 1)

export function sanitizeDone(v) {
  const out = {}
  if (!isObj(v)) return out
  const days = Object.keys(v).filter((d) => DATE_RE.test(d) && Number.isInteger(v[d]) && v[d] > 0).sort().slice(-KEEP_DAYS)
  for (const d of days) out[d] = Math.min(v[d], 999)
  return out
}

export const doneToday = (storage = safeStorage(), day = localDay()) => sanitizeDone(read(storage, FOCUS_DONE_KEY))[day] || 0

/** Bitən seansı say → bu günün yeni sayı */
export function addDone(storage = safeStorage(), day = localDay()) {
  const m = sanitizeDone(read(storage, FOCUS_DONE_KEY))
  m[day] = (m[day] || 0) + 1
  const v = sanitizeDone(m)
  try { storage?.setItem(FOCUS_DONE_KEY, JSON.stringify(v)) } catch { /* yaddaş bağlıdır */ }
  return v[day] || 0
}

/**
 * Seçilmiş ayələr siyahısından "yumşaq təsadüf": sonuncu göstərilən təkrarlanmır.
 * rnd — 0…1 (test üçün); refs — [{ s, a }]
 */
export function gentlePick(refs, lastKey = '', rnd = Math.random()) {
  if (!Array.isArray(refs) || !refs.length) return null
  const pool = refs.length > 1 ? refs.filter((r) => `${r.s}:${r.a}` !== lastKey) : refs
  return pool[Math.min(pool.length - 1, Math.floor(rnd * pool.length))]
}

/**
 * Saytın "günün ayəsi" hovuzundan (utils/dailyPools → AYAH_POOL, mənbə: data/quotes.js)
 * tək ayəlik istinadlar: "Quran 94:5" → { s: 94, a: 5 }. Aralıqlar ("2:285-286") atılır —
 * fasilədə ayə yarımçıq göstərilməsin.
 */
export function refsFromPool(pool) {
  const out = [], seen = new Set()
  for (const q of Array.isArray(pool) ? pool : []) {
    const m = String(q?.source || '').trim().match(/^(?:Quran|Qurani-Kərim)\s+(\d{1,3}):(\d{1,3})$/i)
    if (!m) continue
    const s = Number(m[1]), a = Number(m[2])
    if (s < 1 || s > 114 || a < 1 || a > AYAH_COUNTS[s - 1]) continue
    const k = `${s}:${a}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push({ s, a })
  }
  return out
}

/** Hovuz ayrıca chunk-dır (ana səhifənin "günün ayəsi" ilə eyni modul) — yalnız lazım olanda.
 *  Yalnız mənbələr oxunur: ən kiçik dil modulu (ərəbcə — tərcüməsiz, ~8 KB gzip); sıra bütün dillərdə eynidir. */
export const loadCuratedRefs = () => import('virtual:daily-pools/ar').then((m) => refsFromPool(m.AYAH_POOL))
