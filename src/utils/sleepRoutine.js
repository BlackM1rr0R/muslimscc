// ═══════════════════════════════════════════════════════
// Yatmazdan əvvəl sünnə ardıcıllığı (/bedtime-sunnah) və səhər oyanış ardıcıllığı (/morning-routine)
// — saf köməkçilər + yerli yaddaş (gizli; ardıcıllıq/xal/reytinq YOXDUR).
//
//   sleep_routine_v1 { b: { d, s }, w: { d, s }, rb, rw, bl }
//     b / w — bu günün irəliləyişi (yatma / oyanış): d — günün açarı (YYYY-MM-DD), s — bitən addım id-ləri.
//             Yalnız BU GÜN saxlanır: başqa günün qeydi oxunanda boş sayılır.
//             Yatma günü gecə 04:00-a qədər əvvəlki gündür (gecə yarısından sonra yatan da "bu axşam" sayılır).
//     rb / rw — istəyə görə xatırlatma saatı ('HH:MM' və ya ''), yalnız səhifə açıq ikən işləyir.
//     bl — yatma ekranı açıqdır (susmaya görə tünd).
//   Profilə aiddir (PROFILE_KEYS); sinxronda: eyni gün — addımların birliyi, fərqli gün — təzəsi;
//   saat və rəng — bu cihazınkı (utils/syncMergers). tests/unit/sleep-routine.test.js
// ═══════════════════════════════════════════════════════

export const ROUTINE_KEY = 'sleep_routine_v1'
export const ROUTINE_EVENT = 'mcc-sleep-routine'

// Addımların sırası — mətnləri saytın məlumatındandır (səhifələrdə mənbə ilə göstərilir)
export const BED_STEPS = ['wudu', 'dust', 'side', 'quls', 'kursi', 'tasbih', 'duas', 'mulk']
export const WAKE_STEPS = ['wake', 'adhkar', 'sunnah', 'prayers']
const STEPS = { b: BED_STEPS, w: WAKE_STEPS }

// Yatarkən təsbih: 33 / 33 / 34 (Hisnul-Müslim, "Yatarkən deyilən zikrlər": Buxari, Muslim)
export const TASBIH_PHASES = [33, 33, 34]
export const TASBIH_TOTAL = TASBIH_PHASES.reduce((a, b) => a + b, 0)

/** Yatma günü bu saatdan (gecə) sonra yeni günə keçir */
export const BED_DAY_SHIFT_H = 4
/** Xatırlatma — saatından sonra bu qədər dəqiqə ərzində (səhifə gec açılıbsa da bir dəfə) */
export const REMIND_WINDOW_MIN = 60

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const pad = (n) => String(n).padStart(2, '0')
const safe = () => { try { return globalThis.localStorage } catch { return null } }

export const DEFAULT_ROUTINE = { b: { d: '', s: [] }, w: { d: '', s: [] }, rb: '', rw: '', bl: false }

const dayOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Ardıcıllığın günü: 'b' — gecə 04:00-a qədər əvvəlki gün; 'w' — təqvim günü */
export function routineDay(part, now = new Date()) {
  const d = now instanceof Date ? now : new Date(now)
  if (part === 'b') return dayOf(new Date(d.getTime() - BED_DAY_SHIFT_H * 3600000))
  return dayOf(d)
}

function cleanPart(v, part) {
  const o = isObj(v) ? v : {}
  const d = typeof o.d === 'string' && DATE_RE.test(o.d) ? o.d : ''
  const allowed = STEPS[part]
  const s = d && Array.isArray(o.s) ? allowed.filter((id) => o.s.includes(id)) : []
  return { d, s }
}

export function sanitizeRoutine(v) {
  const o = isObj(v) ? v : {}
  return {
    b: cleanPart(o.b, 'b'),
    w: cleanPart(o.w, 'w'),
    rb: typeof o.rb === 'string' && TIME_RE.test(o.rb) ? o.rb : '',
    rw: typeof o.rw === 'string' && TIME_RE.test(o.rw) ? o.rw : '',
    bl: o.bl === true,
  }
}

export function readRoutine(storage = safe()) {
  try { return sanitizeRoutine(JSON.parse(storage?.getItem(ROUTINE_KEY) || 'null')) } catch { return sanitizeRoutine(null) }
}

function save(v, storage) {
  try { storage?.setItem(ROUTINE_KEY, JSON.stringify(v)) } catch { /* yaddaş bağlıdır */ }
  try { globalThis.dispatchEvent?.(new Event(ROUTINE_EVENT)) } catch { /* SSR */ }
  return v
}

/** Tərcihlər (rb, rw, bl) */
export function writeRoutinePrefs(patch, storage = safe()) {
  const cur = readRoutine(storage)
  return save(sanitizeRoutine({ ...cur, ...(isObj(patch) ? patch : {}), b: cur.b, w: cur.w }), storage)
}

/** Bu gün bitən addımlar (başqa günün qeydi — boş) */
export function stepsToday(st, part, now = new Date()) {
  const p = st?.[part]
  return p && p.d === routineDay(part, now) ? p.s : []
}

/** Addımı bu gün üçün işarələ / götür → yeni vəziyyət */
export function setRoutineStep(part, id, on, storage = safe(), now = new Date()) {
  const cur = readRoutine(storage)
  if (!STEPS[part]?.includes(id)) return cur
  const day = routineDay(part, now)
  const have = new Set(cur[part].d === day ? cur[part].s : [])
  if (on) have.add(id)
  else have.delete(id)
  return save(sanitizeRoutine({ ...cur, [part]: { d: day, s: [...have] } }), storage)
}

/** Bu günün irəliləyişini sil (yalnız həmin ardıcıllıq) */
export function clearRoutineToday(part, storage = safe()) {
  const cur = readRoutine(storage)
  return save(sanitizeRoutine({ ...cur, [part]: { d: '', s: [] } }), storage)
}

/**
 * Xatırlatma vaxtıdırmı? hhmm — 'HH:MM'; firedKey — artıq göstərilənin açarı.
 * Saat çatıbsa və pəncərə (60 dəq) keçməyibsə — `${gün}@${hhmm}` (hər gün bir dəfə), yoxsa null.
 */
export function routineReminderDue(hhmm, now = new Date(), firedKey = '') {
  if (typeof hhmm !== 'string' || !TIME_RE.test(hhmm)) return null
  const d = now instanceof Date ? now : new Date(now)
  const [h, m] = hhmm.split(':').map(Number)
  const diff = d.getHours() * 60 + d.getMinutes() - (h * 60 + m)
  if (diff < 0 || diff >= REMIND_WINDOW_MIN) return null
  const key = `${dayOf(d)}@${hhmm}`
  return key === firedKey ? null : key
}

/** Təsbih sayğacı: ümumi say (0…100) → { phase (0, 1, 2; 3 — bitdi), inPhase, target } */
export function tasbihPhase(count) {
  let c = Math.max(0, Math.min(TASBIH_TOTAL, Math.floor(Number(count) || 0)))
  for (let i = 0; i < TASBIH_PHASES.length; i++) {
    if (c < TASBIH_PHASES[i]) return { phase: i, inPhase: c, target: TASBIH_PHASES[i] }
    c -= TASBIH_PHASES[i]
  }
  const last = TASBIH_PHASES.length - 1
  return { phase: TASBIH_PHASES.length, inPhase: TASBIH_PHASES[last], target: TASBIH_PHASES[last] }
}

/** Sinxron birləşdirmə: eyni gün — addımların birliyi, fərqli gün — təzəsi; tərcihlər — bu cihazınkı */
export function mergeRoutine(L, R) {
  const l = sanitizeRoutine(L), r = sanitizeRoutine(R)
  const part = (k) => {
    const a = l[k], b = r[k]
    if (a.d === b.d) return { d: a.d, s: [...new Set([...a.s, ...b.s])] }
    return a.d > b.d ? a : b
  }
  const prefs = isObj(L) ? l : r
  return sanitizeRoutine({ b: part('b'), w: part('w'), rb: prefs.rb, rw: prefs.rw, bl: prefs.bl })
}
