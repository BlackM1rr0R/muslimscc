// ═══════════════════════════════════════════════════════
// Mühasəbə / dua gündəliyi / sədəqə gündəliyi — "Analitika" bölməsinin saf hesabı.
// Giriş səhifələrin öz yoxlanmış (sanitize) məlumatıdır; burada heç nə uydurulmur.
// tests/unit/journal-insights.test.js
// ═══════════════════════════════════════════════════════
import { isDay } from './trackerInsights.js'
import { fromDayKey } from '../components/viz/scale.js'

const daysBetween = (a, b) => Math.round((fromDayKey(b) - fromDayKey(a)) / 864e5)

// ── Mühasəbə: { 'YYYY-MM-DD': { c: [id…], n, u } } ──
/** Gün üzrə işarə sayı; qeydi olan (yalnız mətnli də) gün → has. */
export function muhasabahIndex(entries) {
  const byDay = {}
  for (const [k, e] of Object.entries(entries || {})) {
    if (!isDay(k) || !e || typeof e !== 'object') continue
    byDay[k] = { n: Array.isArray(e.c) ? e.c.length : 0, c: Array.isArray(e.c) ? e.c : [], u: Number(e.u) || 0, note: typeof e.n === 'string' && !!e.n.trim() }
  }
  return byDay
}
/** Dövr üzrə: qeydli gün, cəmi işarə, gündə orta işarə (qeydli günlərə), hər bənd neçə gün. */
export function muhasabahStats(byDay, keys, items) {
  const per = Object.fromEntries(items.map(id => [id, 0]))
  let days = 0, marks = 0, full = 0
  const series = keys.map(k => {
    const d = byDay[k]
    if (!d) return 0
    days++
    marks += d.n
    if (d.n === items.length) full++
    for (const id of d.c) if (id in per) per[id]++
    return d.n
  })
  return { days, marks, full, avg: days ? Math.round((marks / days) * 10) / 10 : 0, per, series }
}

// ── Dua gündəliyi: [{ date, answered, answeredDate, category }] ──
/** Gün üzrə yazılan və qəbul olunan dua sayı. */
export function duaIndex(duas) {
  const written = {}, answered = {}
  for (const d of duas || []) {
    if (!d || typeof d !== 'object') continue
    if (isDay(d.date)) written[d.date] = (written[d.date] || 0) + 1
    if (d.answered && isDay(d.answeredDate)) answered[d.answeredDate] = (answered[d.answeredDate] || 0) + 1
  }
  return { written, answered }
}
/** Qəbul olunanlarda yazılma → "qəbul oldu" arası orta gün (yoxdursa null). */
export function duaAnswerLag(duas) {
  const lags = []
  for (const d of duas || []) {
    if (d?.answered && isDay(d.date) && isDay(d.answeredDate) && d.answeredDate >= d.date) lags.push(daysBetween(d.date, d.answeredDate))
  }
  return lags.length ? Math.round((lags.reduce((a, b) => a + b, 0) / lags.length) * 10) / 10 : null
}
/** Kateqoriya üzrə say; dövr açarlarına (written tarixi) görə süzülə bilər. */
export function duaByCategory(duas, cats, inRange) {
  const out = Object.fromEntries(cats.map(c => [c, 0]))
  for (const d of duas || []) {
    if (!d || !(d.category in out)) continue
    if (inRange && !inRange(d.date)) continue
    out[d.category]++
  }
  return out
}

// ── Sədəqə: [{ id, date, type, amount }] ──
/** Gün üzrə: əməl sayı, məbləğ cəmi, növlər. */
export function charityIndex(entries) {
  const byDay = {}
  for (const e of entries || []) {
    if (!e || !isDay(e.date)) continue
    const d = byDay[e.date] || (byDay[e.date] = { n: 0, amount: 0, types: {} })
    d.n++
    const a = Number(e.amount)
    if (Number.isFinite(a) && a > 0) d.amount += a
    const tp = typeof e.type === 'string' ? e.type : 'other'
    d.types[tp] = (d.types[tp] || 0) + 1
  }
  return byDay
}
/** Dövr üzrə cəmlər (açarlar köhnədən yeniyə). */
export function charityStats(byDay, keys, types) {
  const per = Object.fromEntries(types.map(tp => [tp, 0]))
  let n = 0, amount = 0, active = 0, withAmount = 0
  const count = [], amt = []
  for (const k of keys) {
    const d = byDay[k]
    count.push(d ? d.n : 0)
    amt.push(d ? Math.round(d.amount * 100) / 100 : 0)
    if (!d) continue
    n += d.n; amount += d.amount; active++
    if (d.amount > 0) withAmount++
    for (const [tp, c] of Object.entries(d.types)) per[tp in per ? tp : 'other'] = (per[tp in per ? tp : 'other'] || 0) + c
  }
  return { n, amount: Math.round(amount * 100) / 100, active, withAmount, per, count, amt }
}
/** Sıra: əsas növlər (ən çox 3) + qalanı "digər" qrupu — yığma qrafik 4 tondan çox olmasın. */
export function topTypes(perAll, max = 3) {
  return Object.entries(perAll).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, max).map(([k]) => k)
}
