// ═══════════════════════════════════════════════════════
// Hicri ilin Ramazanı → miladi tarix aralığı (saf; utils/hijri — Ümmül-Qura)
//
//   ramadanRange(1447) → { y: 1447, s: '2026-02-18', e: '2026-03-19', days: 30 }
//   ramadanYearOf(today) → hazırkı və ya ən son başlamış Ramazanın hicri ili
//
// Qeyd: Ümmül-Qura hesablanmış təqvimdir; yerli elan bir gün fərqlənə bilər (utils/hijri).
// Ramazan albomu (utils/ramadanAlbum) və sədəqə hesabatının "Ramazan payı" bunu işlədir.
// tests/unit/ramadan-album.test.js
// ═══════════════════════════════════════════════════════
import { hijriToGregorian, gregorianToHijri, addGDays, gDiffDays, gKey, parseGKey } from './hijri'

const cache = new Map()

/** Hicri il → { y, s, e, days } | null (hüduddan kənar) */
export function ramadanRange(hy) {
  const y = Number(hy)
  if (!Number.isInteger(y) || y < 1 || y > 1800) return null
  if (cache.has(y)) return cache.get(y)
  let out = null
  const s = hijriToGregorian({ year: y, month: 9, day: 1 })
  const next = hijriToGregorian({ year: y, month: 10, day: 1 })
  if (s && next) {
    const e = addGDays(next, -1)
    out = { y, s: gKey(s), e: gKey(e), days: gDiffDays(s, next) }
  }
  cache.set(y, out)
  return out
}

/** 'YYYY-MM-DD' → hicri { year, month, day } | null */
export function hijriOfDay(day) {
  const g = parseGKey(day)
  return g ? gregorianToHijri(g) : null
}

/**
 * Bu gün üçün: { y, phase } — y: hazırkı (Ramazandadırsa) və ya ən son bitmiş Ramazanın ili;
 * phase: 'during' | 'after'. today — 'YYYY-MM-DD'.
 */
export function ramadanYearOf(today) {
  const h = hijriOfDay(today)
  if (!h) return null
  if (h.month === 9) return { y: h.year, phase: 'during' }
  return { y: h.month > 9 ? h.year : h.year - 1, phase: 'after' }
}

/** Miladi ilin günlərinə düşən Ramazan aralıqları (sədəqə hesabatı üçün) */
export function ramadanRangesInYear(gy) {
  const y = Number(gy)
  if (!Number.isInteger(y)) return []
  const a = hijriOfDay(`${y}-01-01`), b = hijriOfDay(`${y}-12-31`)
  if (!a || !b) return []
  const out = []
  for (let hy = a.year; hy <= b.year; hy++) {
    const r = ramadanRange(hy)
    if (r && r.e >= `${y}-01-01` && r.s <= `${y}-12-31`) out.push(r)
  }
  return out
}

/** Gün aralığa düşürmü (sətir müqayisəsi — ISO tarix) */
export const inRange = (day, r) => typeof day === 'string' && !!r && day >= r.s && day <= r.e
