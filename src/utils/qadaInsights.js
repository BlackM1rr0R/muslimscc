// ═══════════════════════════════════════════════════════
// /qada "Analitika" bölməsi — saf hesab (tests/unit/qada-insights.test.js)
// Mənbə yalnız istifadəçinin qeydləridir: utils/qada.js vəziyyəti
//   log: { 'YYYY-MM-DD': { p: qılınan qəza namazı, f: tutulan qəza orucu } }
// Borc dəyişiklikləri (owed) tarixlə qeyd olunmur — ona görə keçmiş "qalan borc"
// bərpa edilmir (uydurma olardı); yalnız qəza qılınma tempi hesablanır.
// ═══════════════════════════════════════════════════════
import { paceFrom, isDay } from './trackerInsights.js'

const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : 0)
const entry = (log, k) => {
  const e = log && typeof log === 'object' ? log[k] : null
  return { p: num(e?.p), f: num(e?.f) }
}

/** Günlər üzrə sıralar: { p: number[], f: number[] } (keys ilə eyni sıra). */
export function qadaSeries(log, keys) {
  const p = [], f = []
  for (const k of keys) { const e = entry(log, k); p.push(e.p); f.push(e.f) }
  return { p, f }
}

/** Dövrün cəmləri: qılınan namaz, tutulan oruc, aktiv gün (hər hansı qəza qeydi olan). */
export function qadaPeriod(log, keys) {
  let p = 0, f = 0, active = 0
  for (const k of keys) { const e = entry(log, k); p += e.p; f += e.f; if (e.p || e.f) active++ }
  return { p, f, active }
}

/** Gündə orta qəza namazı (son windowDays və ya ilk qeyddən bəri). */
export function qadaPace(log, today, windowDays = 30) {
  const byDay = {}
  for (const [k, v] of Object.entries(log && typeof log === 'object' ? log : {})) if (isDay(k)) byDay[k] = num(v?.p)
  return paceFrom(byDay, today, windowDays)
}

/** Son qeyd günləri (yenidən köhnəyə), today-dən sonrakılar atılır. */
export function qadaRecent(log, today, max = 6) {
  return Object.keys(log && typeof log === 'object' ? log : {})
    .filter(k => isDay(k) && k <= today)
    .map(k => ({ key: k, ...entry(log, k) }))
    .filter(e => e.p || e.f)
    .sort((a, b) => (a.key < b.key ? 1 : -1))
    .slice(0, max)
}

/** Borc bitmə tarixi: owed / pace gün sonra (pace ≤ 0 → null). */
export function finishDate(owed, pace, now = new Date()) {
  if (!(owed > 0) || !(pace > 0)) return null
  const d = new Date(+now)
  d.setDate(d.getDate() + Math.ceil(owed / pace))
  return d
}
