// ═══════════════════════════════════════════════════════
// Həyat bələdçiləri (P2): yeni doğulan körpə (/newborn-sunnah), yaxını vəfat edəndə
// (/when-a-loved-one-dies), nikaha hazırlıq (/nikah-preparation) — yerli qeydlər (React-sız).
//
//   newborn_plan_v1  { v:1, b:'YYYY-MM-DD', n?:true, d:{ <addım>: 'YYYY-MM-DD' } }
//                    b — doğum günü, n — gecə doğulub (sayma ertəsi gündən), d — "etdim" günü.
//                    Profilə aid (PROFILE_KEYS) + E2E sinxronizasiya (syncMergers → NEWBORN_KEY).
//   loved_guide_v1   { v:1, d:{…} }  — YALNIZ bu cihaz (userBackup EXCLUDE_KEYS: ehtiyat/sinxron yox)
//   nikah_prep_v1    { v:1, d:{…}, q:{ <sual>: mətn }, w:{ date?, note? } } — YALNIZ bu cihaz
//
// Dini mətn burada YOXDUR — addımların məzmunu saytın dərslərindən (pages/*GuidePage.jsx).
// tests/unit/life-guides.test.js
// ═══════════════════════════════════════════════════════
import { validDay, isObj, safeStorage, parse, localDay } from './journeyStore'
import { addGDays, parseGKey, gKey, gDiffDays } from './hijri'
import { eventIcs } from './eventIcs'

export { localDay, safeStorage, validDay }

export const NEWBORN_KEY = 'newborn_plan_v1'
export const LOVED_KEY = 'loved_guide_v1'
export const NIKAH_KEY = 'nikah_prep_v1'
export const LIFE_GUIDE_EVENT = 'mcc-life-guide'

// İşarələnən addımlar — id-lər yerli qeydlərin açarıdır, dəyişməməlidir
export const NEWBORN_STEP_IDS = ['tahnik', 'name', 'aqiqah', 'shaving']
export const LOVED_STEP_IDS = [
  'eyes', 'patience', 'ghusl', 'kafan', 'janazah', 'burial',
  'condolence', 'debts', 'will', 'mourning', 'benefit', 'remember',
]
export const NIKAH_STEP_IDS = ['choose', 'istikhara', 'questions', 'pillars', 'wali', 'mahr', 'khutbah', 'walimah', 'avoid', 'duas']
export const NIKAH_QUESTION_IDS = ['mahr', 'conditions', 'housing', 'rights', 'wedding']
export const NOTE_MAX = 600
export const WALIMAH_NOTE_MAX = 1000

const emit = () => { try { globalThis.dispatchEvent?.(new CustomEvent(LIFE_GUIDE_EVENT)) } catch { /* */ } }
// İdarəedici simvollar (sətir sonu və tab-dan başqa) atılır, uzunluq simvolla kəsilir
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
export const cleanNote = (s, max = NOTE_MAX) => [...String(typeof s === 'string' ? s : '').replace(CTRL, '')].slice(0, max).join('')

/** { id: 'YYYY-MM-DD' } — yalnız tanınan addımlar və həqiqi günlər */
export function sanitizeMarks(raw, ids) {
  const d = {}
  const src = isObj(raw) ? raw : {}
  for (const id of ids) if (validDay(src[id])) d[id] = src[id]
  return d
}

export function sanitizeNewborn(raw) {
  const r = isObj(raw) ? raw : {}
  const out = { v: 1, d: sanitizeMarks(r.d, NEWBORN_STEP_IDS) }
  if (validDay(r.b)) out.b = r.b
  if (r.n === true) out.n = true
  return out
}
export const sanitizeLoved = (raw) => ({ v: 1, d: sanitizeMarks(isObj(raw) ? raw.d : null, LOVED_STEP_IDS) })
export function sanitizeNikah(raw) {
  const r = isObj(raw) ? raw : {}
  const q = {}
  const qs = isObj(r.q) ? r.q : {}
  for (const id of NIKAH_QUESTION_IDS) { const t = cleanNote(qs[id]); if (t.trim()) q[id] = t }
  const w = {}
  const ws = isObj(r.w) ? r.w : {}
  if (validDay(ws.date)) w.date = ws.date
  const note = cleanNote(ws.note, WALIMAH_NOTE_MAX)
  if (note.trim()) w.note = note
  return { v: 1, d: sanitizeMarks(r.d, NIKAH_STEP_IDS), q, w }
}

const SANITIZE = { [NEWBORN_KEY]: sanitizeNewborn, [LOVED_KEY]: sanitizeLoved, [NIKAH_KEY]: sanitizeNikah }
const IDS = { [NEWBORN_KEY]: NEWBORN_STEP_IDS, [LOVED_KEY]: LOVED_STEP_IDS, [NIKAH_KEY]: NIKAH_STEP_IDS }

/** Dəyər boşdursa (heç nə qeyd olunmayıb) açar silinir */
const isEmpty = (v) => !Object.keys(v.d).length && !v.b && !v.n
  && !(v.q && Object.keys(v.q).length) && !(v.w && Object.keys(v.w).length)

export const readGuide = (key, storage = safeStorage()) => (SANITIZE[key] || sanitizeLoved)(parse(storage, key, null))

export function writeGuide(key, value, storage = safeStorage()) {
  const v = (SANITIZE[key] || sanitizeLoved)(value)
  try {
    if (isEmpty(v)) storage?.removeItem(key)
    else storage?.setItem(key, JSON.stringify(v))
  } catch { /* yaddaş bağlıdır / doludur */ }
  emit()
  return v
}

/** Addımı işarələ / işarəni götür → yeni dəyər (yazılır) */
export function setGuideStep(key, id, done, storage = safeStorage(), day = localDay()) {
  const cur = readGuide(key, storage)
  if (!(IDS[key] || []).includes(id)) return cur
  const d = { ...cur.d }
  if (done) d[id] = d[id] || day
  else delete d[id]
  return writeGuide(key, { ...cur, d }, storage)
}

export const clearGuide = (key, storage = safeStorage()) => writeGuide(key, {}, storage)

// ── Körpə: tarixlər ──
/**
 * Doğum günü → { birth, start, day7 } ('YYYY-MM-DD') | null.
 * Dərs ("Əqiqə", 7-ci gün): doğum günü yeddi günə daxildir; gecə doğulubsa sayma ertəsi gündən başlayır.
 */
export function newbornDates(birth, night = false) {
  if (!validDay(birth)) return null
  const g = parseGKey(birth)
  if (!g) return null
  const start = night ? addGDays(g, 1) : g
  return { birth, start: gKey(start), day7: gKey(addGDays(start, 6)) }
}

/** Gündən neçə gün keçib (bu gün = 0; gələcək — mənfi) */
export function daysSince(key, today = localDay()) {
  const a = parseGKey(key), b = parseGKey(today)
  if (!a || !b) return null
  return gDiffDays(a, b)
}

/** 7-ci gün üçün .ics (yerli vaxtla 09:00, bir gün əvvəl xatırlatma) */
export function day7Ics({ day7, title, description = '', now = Date.now() }) {
  const g = parseGKey(day7)
  if (!g) return ''
  const start = new Date(g.year, g.month - 1, g.day, 9, 0, 0).getTime()
  return eventIcs({ uid: `newborn-${day7}`, start, minutes: 60, title, description, alarmMin: 24 * 60, now })
}
