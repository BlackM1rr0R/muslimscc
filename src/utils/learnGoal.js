// ═══════════════════════════════════════════════════════
// Şəxsi öyrənmə yolu (H4) — seçilmiş məqsəd (mövcud dərs yollarından biri, lesson/LearningPaths),
// həftəlik irəliləyiş və "növbəti addım". Saf məntiq + localStorage (React-sız). Yeni məzmun YOXDUR:
// addımlar saytdakı dərslər, yol bitəndə — mövcud test (/quiz) və ərəb dili kursu (/arabic).
//
// Oxunan dərslər learn_progress_v1-dədir (pages/LessonsPage, "Oxudum"); orada tarix yoxdur — həftəlik
// xülasə üçün dərs oxunan gün bu açarın jurnalına yazılır (logRead).
//   learn_goal_v1 = { v: 1, g: <yol açarı>|null, gt: ms (seçim vaxtı), since: 'YYYY-MM-DD',
//                     log: { 'YYYY-MM-DD': [slug…] } }   — son 120 gün
// Profilə aiddir (PROFILE_KEYS), hesabla sinxronlanır (utils/syncMergers).
// tests/unit/learn-goal.test.js
// ═══════════════════════════════════════════════════════
import { toKey, addDays } from './prayerTracker'

export const GOAL_KEY = 'learn_goal_v1'
export const GOAL_EVENT = 'mcc-learngoal'
const KEEP = 120
const SLUG_RE = /^[a-z0-9-]{1,48}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)

export function sanitizeGoal(raw, validGoal = () => true) {
  let o = raw
  if (typeof raw === 'string') { try { o = JSON.parse(raw) } catch { o = null } }
  if (!isObj(o)) o = {}
  const g = typeof o.g === 'string' && /^[a-z]{1,20}$/.test(o.g) && validGoal(o.g) ? o.g : null
  const log = {}
  const days = Object.keys(isObj(o.log) ? o.log : {}).filter((d) => DATE_RE.test(d)).sort().slice(-KEEP)
  for (const d of days) {
    const s = [...new Set((Array.isArray(o.log[d]) ? o.log[d] : []).filter((x) => typeof x === 'string' && SLUG_RE.test(x)))].slice(0, 50)
    if (s.length) log[d] = s
  }
  return {
    v: 1, g,
    // gt məqsəd silinəndə də qalır — sinxronda "sildim" köhnə seçimə uduzmasın
    gt: Number.isFinite(Number(o.gt)) ? Math.max(0, Math.round(Number(o.gt))) : 0,
    since: g && typeof o.since === 'string' && DATE_RE.test(o.since) ? o.since : null,
    log,
  }
}

export function setGoal(goal, key, now = new Date()) {
  return sanitizeGoal({ ...goal, g: key || null, gt: now.getTime(), since: key ? toKey(now) : null })
}

/** Dərs oxundu (bu gün) — jurnala */
export function logRead(goal, slug, day = toKey()) {
  if (!SLUG_RE.test(String(slug))) return goal
  const cur = goal.log[day] || []
  if (cur.includes(slug)) return goal
  return sanitizeGoal({ ...goal, log: { ...goal.log, [day]: [...cur, slug] } })
}

/**
 * Yolun irəliləyişi. path — { key, lessons:[slug…] }, readSet — oxunan dərslər (Set).
 * → { read, total, next: slug|null, done }
 */
export function pathProgress(path, readSet) {
  const ls = Array.isArray(path?.lessons) ? path.lessons : []
  const read = ls.filter((s) => readSet.has(s)).length
  const next = ls.find((s) => !readSet.has(s)) || null
  return { read, total: ls.length, next, done: ls.length > 0 && read === ls.length }
}

/**
 * Növbəti addım: yolun ilk oxunmamış dərsi; yol bitibsə — mövcud bilik testi, sonra ərəb dili kursu.
 * → { kind: 'lesson', slug } | { kind: 'quiz' } | { kind: 'arabic' } | null (məqsəd yoxdur)
 */
export function nextStep(path, readSet, { quizDone = false } = {}) {
  if (!path) return null
  const p = pathProgress(path, readSet)
  if (p.next) return { kind: 'lesson', slug: p.next }
  return quizDone ? { kind: 'arabic' } : { kind: 'quiz' }
}

/**
 * Həftəlik xülasə (son 7 gün, bu gün daxil) və ondan əvvəlki 7 gün.
 * pathLessons — məqsəd yolunun dərsləri (bu həftə onlardan neçəsi oxunub).
 */
export function weekSummary(goal, today = toKey(), pathLessons = []) {
  const inPath = new Set(pathLessons)
  let week = 0, prev = 0, pathWeek = 0
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i)
    const s = goal.log[d] || []
    week += s.length
    pathWeek += s.filter((x) => inPath.has(x)).length
    days.push({ d, n: s.length })
  }
  for (let i = 13; i >= 7; i--) prev += (goal.log[addDays(today, -i)] || []).length
  return { week, prev, pathWeek, activeDays: days.filter((x) => x.n > 0).length, days }
}

const ls = () => { try { return globalThis.localStorage } catch { return null } }
export function readGoal(storage = ls(), validGoal) {
  try { return sanitizeGoal(storage?.getItem(GOAL_KEY), validGoal) } catch { return sanitizeGoal(null) }
}
export function saveGoal(goal, storage = ls()) {
  const c = sanitizeGoal(goal)
  try {
    if (!c.g && !Object.keys(c.log).length) storage?.removeItem(GOAL_KEY)
    else storage?.setItem(GOAL_KEY, JSON.stringify(c))
  } catch { /* yaddaş bağlıdır */ }
  try { window.dispatchEvent(new CustomEvent(GOAL_EVENT)) } catch { /* SSR */ }
  return c
}

/** Sinxronizasiya: məqsəd — sonra seçilən (gt); jurnal — gün üzrə birlik */
export function mergeGoal(L, R) {
  const l = sanitizeGoal(L), r = sanitizeGoal(R)
  const head = r.gt > l.gt ? r : l
  const log = {}
  for (const d of new Set([...Object.keys(l.log), ...Object.keys(r.log)])) log[d] = [...new Set([...(l.log[d] || []), ...(r.log[d] || [])])]
  return sanitizeGoal({ v: 1, g: head.g, gt: head.gt, since: head.since, log })
}
