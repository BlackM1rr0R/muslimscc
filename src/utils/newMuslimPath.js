// ═══════════════════════════════════════════════════════
// "Yeni müsəlmanın yolu — ilk 40 gün" (/new-muslim) — addımların yerli qeydi, profilə aid, gizli.
//   new_muslim_path_v1  { v: 1, d: { <addım>: 'YYYY-MM-DD' } }  — addımın "etdim" günü
// Ardıcıllıq (streak), xal, reytinq YOXDUR. Sinxronizasiya: utils/syncMergers → MERGERS[PATH_KEY]
// (addım üzrə 3 tərəfli: işarə və işarənin götürülməsi keçir; eyni addım iki cihazda — ən erkən gün).
// Addımların özü (mətn, keçidlər) — pages/NewMuslimPathPage.jsx. tests/unit/new-muslim-path.test.js
// ═══════════════════════════════════════════════════════
import { validDay, isObj, safeStorage, parse, localDay } from './journeyStore'

export const PATH_KEY = 'new_muslim_path_v1'
export const PATH_EVENT = 'mcc-new-muslim-path'
// Sıra — səhifədəki sıra ilə eynidir (id-lər dəyişməməlidir: yerli qeydlərin açarıdır)
export const PATH_STEP_IDS = [
  'shahada', 'purity', 'times', 'fatiha', 'first-prayer', 'letters', 'short-surahs',
  'daily-duas', 'after-prayer', 'words', 'friday', 'ramadan', 'community', 'keep-learning',
]
const IDS = new Set(PATH_STEP_IDS)

export { localDay, safeStorage }
const emit = () => { try { globalThis.dispatchEvent?.(new CustomEvent(PATH_EVENT)) } catch { /* */ } }

/** → { v: 1, d } (yalnız tanınan addımlar və həqiqi günlər) */
export function sanitizePath(raw) {
  const d = {}
  const src = isObj(raw?.d) ? raw.d : {}
  for (const id of PATH_STEP_IDS) if (validDay(src[id])) d[id] = src[id]
  return { v: 1, d }
}

export const readPath = (storage = safeStorage()) => sanitizePath(parse(storage, PATH_KEY, null))

/** Addımı işarələ / işarəni götür → yeni dəyər (yazılır) */
export function setStep(id, done, storage = safeStorage(), day = localDay()) {
  const cur = readPath(storage)
  if (!IDS.has(id)) return cur
  const d = { ...cur.d }
  if (done) d[id] = d[id] || day
  else delete d[id]
  const v = sanitizePath({ d })
  try { if (Object.keys(v.d).length) storage?.setItem(PATH_KEY, JSON.stringify(v)); else storage?.removeItem(PATH_KEY) } catch { /* yaddaş bağlıdır */ }
  emit()
  return v
}

/** Növbəti (ilk işarələnməmiş) addım və ya null */
export const nextStep = (data) => PATH_STEP_IDS.find((id) => !data?.d?.[id]) || null
