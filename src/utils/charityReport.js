// ═══════════════════════════════════════════════════════
// Sədəqə hesabatı — charity_log-dan illik xülasə (saf hesab; /charity və /account)
//
// Mənbə: istifadəçinin öz qeydləri [{ id, date, type, amount, description, to }]. Valyuta
// saxlanmır — məbləğ qeyd olunduğu kimi cəmlənir (valyutasız). "Ramazan payı" — Ümmül-Qura
// Ramazan günlərinə düşən qeydlər (utils/ramadanRange). Heç nə uydurulmur: məbləğsiz qeydlər
// sayda var, məbləğdə yoxdur.
// tests/unit/charity-report.test.js
// ═══════════════════════════════════════════════════════
export const DEED_KEYS = ['money', 'food', 'smile', 'knowledge', 'dua', 'helping', 'clothing', 'other']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const amt = (v) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? n : 0 }
const r2 = (v) => Math.round(v * 100) / 100

/** Pozuq qeydlər atılır (səhifənin öz yoxlaması ilə eyni) */
export function cleanEntries(raw) {
  if (!Array.isArray(raw)) return []
  return raw.filter((e) => e && typeof e === 'object' && DATE_RE.test(String(e.date)))
    .map((e) => ({
      date: e.date,
      type: DEED_KEYS.includes(e.type) ? e.type : 'other',
      amount: amt(e.amount),
      to: typeof e.to === 'string' ? e.to.trim().slice(0, 80) : '',
    }))
}

/** Qeyd olan illər (yenidən köhnəyə) */
export function reportYears(entries) {
  return [...new Set(entries.map((e) => Number(e.date.slice(0, 4))))].filter(Number.isInteger).sort((a, b) => b - a)
}

/**
 * İllik hesabat. ranges — həmin ilə düşən Ramazan aralıqları [{ s, e }] (ramadanRangesInYear).
 * → { year, count, amount, withAmount, days, months[12]{count,amount}, types[{key,count,amount}],
 *     ramadan{count, amount, share}, to[{name,count}] (ən çox 5), best{month} }
 */
export function yearlyReport(entries, year, ranges = []) {
  const y = String(year)
  const months = Array.from({ length: 12 }, () => ({ count: 0, amount: 0 }))
  const types = new Map()
  const to = new Map()
  const days = new Set()
  const ram = { count: 0, amount: 0 }
  let count = 0, amount = 0, withAmount = 0
  for (const e of entries) {
    if (e.date.slice(0, 4) !== y) continue
    const a = amt(e.amount)
    count++
    amount += a
    if (a) withAmount++
    days.add(e.date)
    const m = months[Number(e.date.slice(5, 7)) - 1]
    if (m) { m.count++; m.amount += a }
    const t = types.get(e.type) || { key: e.type, count: 0, amount: 0 }
    t.count++; t.amount += a
    types.set(e.type, t)
    if (e.to) {
      const k = e.to.toLocaleLowerCase()
      const x = to.get(k) || { name: e.to, count: 0 }
      x.count++
      to.set(k, x)
    }
    if (ranges.some((r) => e.date >= r.s && e.date <= r.e)) { ram.count++; ram.amount += a }
  }
  for (const m of months) m.amount = r2(m.amount)
  let best = -1
  months.forEach((m, i) => { if (m.count && (best < 0 || m.count > months[best].count)) best = i })
  return {
    year: Number(year), count, amount: r2(amount), withAmount, days: days.size, months,
    types: [...types.values()].map((t) => ({ ...t, amount: r2(t.amount) })).sort((a, b) => b.count - a.count || DEED_KEYS.indexOf(a.key) - DEED_KEYS.indexOf(b.key)),
    ramadan: { count: ram.count, amount: r2(ram.amount), share: count ? ram.count / count : 0 },
    to: [...to.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 5),
    best: best >= 0 ? best : null,
  }
}

/** CSV xanası: vergül / dırnaq / sətir — dırnaqda; =,+,-,@ ilə başlayan — formula kimi açılmasın */
export function csvCell(v) {
  let s = String(v ?? '')
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Hesabatın CSV-si (Excel üçün BOM ilə). L — yazılar: { section, metric, value, count, amount,
 * total, ramadan, month[12], type{key}, recipients }; hideAmounts — məbləğ sütunu yoxdur.
 */
export function reportCsv(rep, L, { hideAmounts = false } = {}) {
  const rows = []
  const head = hideAmounts ? [L.section, L.metric, L.count] : [L.section, L.metric, L.count, L.amount]
  rows.push(head)
  const row = (sec, name, c, a) => rows.push(hideAmounts ? [sec, name, c] : [sec, name, c, a])
  row(L.total, String(rep.year), rep.count, rep.amount)
  row(L.ramadan, `${Math.round(rep.ramadan.share * 100)}%`, rep.ramadan.count, rep.ramadan.amount)
  rep.months.forEach((m, i) => row(L.monthSec, L.month[i], m.count, m.amount))
  for (const t of rep.types) row(L.typeSec, L.type[t.key] || t.key, t.count, t.amount)
  if (!hideAmounts) for (const x of rep.to) rows.push([L.recipients, x.name, x.count, ''])
  return '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
