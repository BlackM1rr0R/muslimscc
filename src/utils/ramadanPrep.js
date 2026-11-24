// ═══════════════════════════════════════════════════════
// Ramazana hazırlıq yolu (/road-to-ramadan) və son 10 gecə (/last-ten-nights) — saf köməkçilər + yerli yaddaş
//
// Tarixlər saytın hicri köməkçilərindəndir (utils/ramadanRange → utils/hijri, Ümmül-Qura) — Ramazanın
// başlanğıcı HEÇ YERDƏ əl ilə yazılmır. Yerli elan (hilal) bir gün fərqlənə bilər — səhifə bunu deyir.
//
//   ramadan_prep_v1 { v: 1, r: { <hicri il>: { <n>: 'YYYY-MM-DD' } }, t: { <hicri il>: { '<gecə>.<iş>': 'YYYY-MM-DD' } } }
//     r — yolun addımları: n = Ramazana qalan gün (ROAD_DAYS … 1), dəyər — "etdim" günü
//     t — son 10 gecənin işləri: gecə 21…30, iş NIGHT_ITEMS-dən
//   Profilə aiddir (PROFILE_KEYS); sinxronda açar üzrə 3 tərəfli (işarənin götürülməsi də keçir;
//   eyni işarə iki cihazda — ən erkən gün) — utils/syncMergers. Son KEEP_YEARS hicri il saxlanır.
//   Ardıcıllıq (streak), xal, reytinq YOXDUR. tests/unit/ramadan-prep.test.js
// ═══════════════════════════════════════════════════════
import { ramadanRange, hijriOfDay } from './ramadanRange'
import { hijriToGregorian, parseGKey, gDiffDays, addGDays, gKey } from './hijri'
import { validDay, isObj, safeStorage, parse, localDay } from './journeyStore'

export const PREP_KEY = 'ramadan_prep_v1'
export const PREP_EVENT = 'mcc-ramadan-prep'
/** Yol Ramazandan bu qədər gün əvvəl açılır (hər gün bir addım) */
export const ROAD_DAYS = 90
/** Son 10 gecənin işləri (sıra — səhifədəki sıra) */
export const NIGHT_ITEMS = ['qiyam', 'quran', 'dua', 'sadaqah', 'istighfar']
export const FIRST_NIGHT = 21
export const LAST_NIGHT = 30
/** Gecə yarısından sonra bu saata qədər hələ "keçən axşamın gecəsi"dir (sleepRoutine ilə eyni hədd) */
export const NIGHT_SHIFT_H = 4
const KEEP_YEARS = 3

export { localDay, safeStorage }

// ── Tarix ──

/** Bugün üçün Ramazan vəziyyəti.
 *  { phase: 'ramadan', year, day, range } — Ramazandadır (day — Ramazanın günü)
 *  { phase: 'before', year, daysLeft, range } — növbəti Ramazana qalan gün (Ramazan bitibsə — gələn ilinki)
 *  null — tarix tanınmadı */
export function ramadanStatus(today) {
  const h = hijriOfDay(today)
  if (!h) return null
  if (h.month === 9) {
    const range = ramadanRange(h.year)
    return range ? { phase: 'ramadan', year: h.year, day: h.day, range } : null
  }
  const year = h.month < 9 ? h.year : h.year + 1
  const range = ramadanRange(year)
  const g = parseGKey(today), s = range && parseGKey(range.s)
  if (!g || !s) return null
  return { phase: 'before', year, daysLeft: gDiffDays(g, s), range }
}

/** 'YYYY-MM-DD' + n gün */
export function shiftDay(day, n) {
  const g = parseGKey(day)
  return g ? gKey(addGDays(g, n)) : null
}

/** Ramazana n gün qalan günün tarixi */
export const roadDate = (range, n) => (range ? shiftDay(range.s, -n) : null)

// ── Yolun planı ──
// Hər günə bir addım (növ). Mərhələ addımları sabit "qalan gün"dədir; Şaban addımı — Şabanın 1-i
// (hicri təqvimdən). Qalan günlər — sakit gündəlik vərdişlər (növbə ilə). Mətnlər — components/ramadanPrep/prepText.js.
// g:<id> — Ramazan bələdçisinin bölməsi (src/data/ramadanGuide.js, /ramadan#rp-g-<id>).
export const MILESTONES = {
  90: 'qada-count', 85: 'prayers', 80: 'g:virtues', 75: 'dua-list', 70: 'g:intention', 65: 'zakat',
  60: 'fasts-lesson', 55: 'g:breakers', 50: 'muhasabah', 45: 'g:allowed', 40: 'g:exempt', 35: 'family',
  28: 'g:suhoor-iftar', 25: 'sadaqah-plan', 21: 'khatm', 18: 'g:taraweeh', 15: 'iftar-invite', 12: 'sleep',
  10: 'g:laylat-al-qadr', 8: 'g:itikaf', 7: 'waking', 5: 'iftar-dua', 4: 'g:zakat-al-fitr', 3: 'timetable',
  2: 'last-ten', 1: 'moon',
}
export const FILLERS = ['quran-page', 'qada-fast', 'sadaqah-small', 'dua-write', 'prayer-time', 'dhikr', 'family-talk']
export const STEP_KINDS = [...new Set([...Object.values(MILESTONES), 'shaban', ...FILLERS])]

/** Şabanın 1-i Ramazandan neçə gün əvvəldir (29 və ya 30) */
export function shabanOffset(year) {
  const r = ramadanRange(year)
  const s = r && parseGKey(r.s)
  const sh = hijriToGregorian({ year, month: 8, day: 1 })
  return s && sh ? gDiffDays(sh, s) : 30
}

/** Hicri ilin yolu: [{ n, kind }] — n ROAD_DAYS-dən 1-ə (xronoloji sıra) */
export function roadPlan(year) {
  const sh = shabanOffset(year)
  const out = []
  let f = 0
  for (let n = ROAD_DAYS; n >= 1; n--) {
    let kind = n === sh ? 'shaban' : MILESTONES[n]
    if (!kind) {
      kind = FILLERS[f++ % FILLERS.length]
      // Ramazandan dərhal əvvəlki günlərdə qəza orucu təklif olunmur — yerinə Quran
      if (kind === 'qada-fast' && n <= 10) kind = 'quran-page'
    }
    out.push({ n, kind })
  }
  return out
}

/** Yolun vəziyyəti: 'early' (yol hələ açılmayıb) | 'road' | 'ramadan' */
export function roadPhase(st) {
  if (!st) return null
  if (st.phase === 'ramadan') return 'ramadan'
  return st.daysLeft > ROAD_DAYS ? 'early' : 'road'
}

// ── Son 10 gecə ──
export const isOddNight = (n) => n % 2 === 1

/** N-ci gecə Ramazanın (N−1)-ci gününün axşamı başlayır → həmin axşamın tarixi */
export const nightEvening = (range, n) => (range ? shiftDay(range.s, n - 2) : null)

/** Hesaba görə ayın son gecəsi: 29 və ya 30 (30-cu gecə yalnız ay 30 gün olarsa) */
export const lastNightOf = (range) => (range?.days === 29 ? 29 : LAST_NIGHT)
/** Son onluğun gecələri: 21 … 30 (30-cu — "ay 30 gün olarsa"; yerli elan hesabdan fərqlənə bilər) */
export const TEN_NIGHTS = Array.from({ length: LAST_NIGHT - FIRST_NIGHT + 1 }, (_, i) => FIRST_NIGHT + i)

/**
 * Son 10 gecənin vəziyyəti (today — 'YYYY-MM-DD', hour — yerli saat 0–23):
 *   { phase: 'active', year, night, range }   — bu gecə (və ya keçən axşamdan davam edən gecə) son onluqdadır
 *   { phase: 'before', year, daysLeft, range } — son onluğun ilk axşamına (Ramazanın 20-si) qalan gün
 *   { phase: 'after', year, range }           — bu ilin son onluğu bitib (bayram gecəsi / günü)
 */
export function lastTenStatus(today, hour = 12) {
  const st = ramadanStatus(today)
  if (!st) return null
  const { year, range } = st
  if (st.phase === 'ramadan') {
    const night = hour < NIGHT_SHIFT_H ? st.day : st.day + 1
    // 29-cu günün axşamı hesab ayı 29 gün desə də 30-cu gecə açıq qalır — hilal görünməyibsə ay 30 olur
    if (night >= FIRST_NIGHT && night <= LAST_NIGHT) return { phase: 'active', year, night, range }
    if (night > LAST_NIGHT) return { phase: 'after', year, range }
    return { phase: 'before', year, daysLeft: FIRST_NIGHT - night, range }
  }
  // Şəvvalın 1-i gecəyarısından sonra (hələ bayram gecəsi) — bu il bitib
  const h = hijriOfDay(today)
  if (h && h.month === 10 && h.day === 1 && hour < NIGHT_SHIFT_H) {
    const r = ramadanRange(h.year)
    if (r) return { phase: 'after', year: h.year, range: r }
  }
  const ev = nightEvening(range, FIRST_NIGHT)
  const g = parseGKey(today), e = parseGKey(ev)
  return g && e ? { phase: 'before', year, daysLeft: gDiffDays(g, e), range } : null
}

// ── Yaddaş ──
const yearOk = (y) => /^\d{4}$/.test(y) && +y >= 1400 && +y <= 1700
const nOk = (n) => /^\d{1,3}$/.test(n) && +n >= 1 && +n <= 120
const NIGHT_SET = new Set(NIGHT_ITEMS)
const tOk = (k) => {
  const [n, it, extra] = String(k).split('.')
  return extra === undefined && /^\d{2}$/.test(n) && +n >= FIRST_NIGHT && +n <= LAST_NIGHT && NIGHT_SET.has(it)
}

function cleanPart(src, keyOk) {
  const out = {}
  if (!isObj(src)) return out
  const years = Object.keys(src).filter(yearOk).sort((a, b) => b - a).slice(0, KEEP_YEARS)
  for (const y of years) {
    const m = {}
    if (isObj(src[y])) for (const [k, d] of Object.entries(src[y])) if (keyOk(k) && validDay(d)) m[k] = d
    if (Object.keys(m).length) out[y] = m
  }
  return out
}

/** → { v: 1, r, t } (yalnız tanınan illər, addımlar, gecələr və həqiqi günlər) */
export function sanitizePrep(raw) {
  return { v: 1, r: cleanPart(raw?.r, nOk), t: cleanPart(raw?.t, tOk) }
}
export const isEmptyPrep = (p) => !Object.keys(p?.r || {}).length && !Object.keys(p?.t || {}).length

export const readPrep = (storage = safeStorage()) => sanitizePrep(parse(storage, PREP_KEY, null))

const emit = () => { try { globalThis.dispatchEvent?.(new CustomEvent(PREP_EVENT)) } catch { /* */ } }

export function writePrep(p, storage = safeStorage()) {
  const v = sanitizePrep(p)
  try { if (isEmptyPrep(v)) storage?.removeItem(PREP_KEY); else storage?.setItem(PREP_KEY, JSON.stringify(v)) } catch { /* yaddaş bağlıdır */ }
  emit()
  return v
}

function setIn(p, part, year, key, done, day) {
  const cur = sanitizePrep(p)
  const y = String(year)
  const m = { ...(cur[part][y] || {}) }
  if (done) m[key] = m[key] || day
  else delete m[key]
  return sanitizePrep({ ...cur, [part]: { ...cur[part], [y]: m } })
}

/** Yolun addımını işarələ / götür (saf) */
export const markRoad = (p, year, n, done, day = localDay()) => setIn(p, 'r', year, String(n), done, day)
/** Gecənin işini işarələ / götür (saf) */
export const markNight = (p, year, night, item, done, day = localDay()) => setIn(p, 't', year, `${night}.${item}`, done, day)

export const roadDone = (p, year) => p?.r?.[String(year)] || {}
export const nightDone = (p, year, night, item) => Boolean(p?.t?.[String(year)]?.[`${night}.${item}`])
export function nightCount(p, year, night) {
  const m = p?.t?.[String(year)] || {}
  return NIGHT_ITEMS.filter((it) => m[`${night}.${it}`]).length
}

// ── Sinxronizasiya üçün düz xəritə (syncMergers → mergeMap3) ──
export function flatPrep(raw) {
  const p = sanitizePrep(raw)
  const out = {}
  for (const part of ['r', 't']) for (const [y, m] of Object.entries(p[part])) for (const [k, d] of Object.entries(m)) out[`${part}|${y}|${k}`] = d
  return out
}
export function unflatPrep(flat) {
  const p = { v: 1, r: {}, t: {} }
  for (const [key, d] of Object.entries(flat || {})) {
    const [part, y, k] = key.split('|')
    if ((part !== 'r' && part !== 't') || !y || !k) continue
    p[part][y] = p[part][y] || {}
    p[part][y][k] = d
  }
  return sanitizePrep(p)
}
