// ═══════════════════════════════════════════════════════
// "Rəqəmlərlə" bölmələri üçün saf hesablamalar (src/components/numbers/*).
// Hamısı YALNIZ repo-dakı məlumat fayllarından hesablanır — təxmin və ya
// nümunə rəqəm yoxdur. Test: tests/unit/numbers-data.test.js
// ═══════════════════════════════════════════════════════
import { SURAH_TABLE } from '../data/mushafIndex.js'
import { REVELATION_ORDER, REVELATION_PLACE } from '../data/surahRevelation.js'
import { JUZ_VERSES } from '../data/juzMap.js'

const sum = (a) => a.reduce((s, v) => s + (Number(v) || 0), 0)

// ── Quran ──────────────────────────────────────────────
/** 114 surə: { n, ayahs, madani, order } (mushaf sırası ilə) */
export function surahRows() {
  return SURAH_TABLE.map((r, i) => ({ n: i + 1, ayahs: r[2], madani: REVELATION_PLACE[i] === 1, order: REVELATION_ORDER[i] }))
}

/** Cüzlərin ayə sayı (30) — JUZ_VERSES aralıqlarından */
export function juzAyahs() {
  return JUZ_VERSES.map(parts => sum(parts.map(([, a, b]) => b - a + 1)))
}

/** Quranın ümumi rəqəmləri */
export function quranTotals() {
  const rows = surahRows()
  const mk = rows.filter(r => !r.madani), md = rows.filter(r => r.madani)
  const byLen = rows.slice().sort((a, b) => b.ayahs - a.ayahs || a.n - b.n)
  return {
    surahs: rows.length,
    ayahs: sum(rows.map(r => r.ayahs)),
    makki: { surahs: mk.length, ayahs: sum(mk.map(r => r.ayahs)) },
    madani: { surahs: md.length, ayahs: sum(md.map(r => r.ayahs)) },
    longest: byLen.slice(0, 5),
    shortest: byLen.slice(-5).reverse(),
  }
}

/**
 * Qrafik seriyaları: order 'mushaf' | 'revelation'. Hər nöqtə bir surə;
 * Məkki və Mədəni ayrıca seriya (digərində 0) — yığma sahədə yeri görünsün.
 */
export function surahSeries(order = 'mushaf') {
  const rows = surahRows()
  const list = order === 'revelation' ? rows.slice().sort((a, b) => a.order - b.order) : rows
  return {
    nums: list.map(r => r.n),
    makki: list.map(r => (r.madani ? 0 : r.ayahs)),
    madani: list.map(r => (r.madani ? r.ayahs : 0)),
  }
}

/** Oxunan surələrin əhatəsi: reads = { surəNo: say } → { surahs, ayahs } */
export function readCoverage(reads = {}) {
  const ns = Object.keys(reads || {}).map(Number).filter(n => n >= 1 && n <= 114 && reads[n] > 0)
  return { surahs: ns.length, ayahs: sum(ns.map(n => SURAH_TABLE[n - 1][2])) }
}

// ── Alimlər / səhabələr ───────────────────────────────
/** Hicri əsr (1-dən): il 0..100 → 1, 101..200 → 2; mənfi (hicrətdən əvvəl) → 1 */
export const hijriCentury = (h) => Math.max(1, Math.ceil(h / 100) || 1)

/** Alimlər vəfat (yoxdursa — doğum) əsrinə görə, dövr üzrə: { centuries:[1..N], byEra:{era:[..]} } */
export function scholarsByCentury(scholars, eras) {
  const yr = (s) => s.died?.h ?? s.born?.h
  const max = Math.max(1, ...scholars.map(s => (yr(s) != null ? hijriCentury(yr(s)) : 1)))
  const centuries = Array.from({ length: max }, (_, i) => i + 1)
  const byEra = Object.fromEntries(eras.map(e => [e, centuries.map(() => 0)]))
  for (const s of scholars) {
    const y = yr(s)
    if (y == null || !byEra[s.era]) continue
    byEra[s.era][hijriCentury(y) - 1]++
  }
  return { centuries, byEra }
}

/** Ömür uzunluğu (hicri il): yalnız doğum və vəfatı olanlar; uzundan qısaya */
export function lifespans(scholars) {
  return scholars
    .filter(s => s.born?.h != null && s.died?.h != null)
    .map(s => ({ s, years: s.died.h - s.born.h, approx: Boolean(s.born.approx || s.died.approx) }))
    .sort((a, b) => b.years - a.years)
}

/** Vəfat illərini onilliklərə böl: [{ from, to, count }] (h. −10…−1, 0…9, …) */
export function decadeBuckets(years) {
  if (!years.length) return []
  const lo = Math.floor(Math.min(...years) / 10) * 10, hi = Math.floor(Math.max(...years) / 10) * 10
  const out = []
  for (let d = lo; d <= hi; d += 10) out.push({ from: d, to: d + 9, count: years.filter(y => y >= d && y <= d + 9).length })
  return out
}

// ── Namaz vaxtları (il boyu) ───────────────────────────
/**
 * days — YearPrayerChart.yearDays() sətirləri ({ m, day, fajr, sunrise, dhuhr, asr, maghrib, isha } dəqiqə).
 * Ay üzrə orta müddətlər (dəqiqə): gündüz, oruc (sübh→məğrib), gecə (məğrib→sübh), şəfəq, qürub.
 */
export function monthDurations(days, month) {
  const rows = days.filter(d => d.m === month)
  if (!rows.length) return null
  const avg = (fn) => Math.round(sum(rows.map(fn)) / rows.length)
  return {
    day: avg(d => d.maghrib - d.sunrise),
    fast: avg(d => d.maghrib - d.fajr),
    night: avg(d => 1440 - (d.maghrib - d.fajr)),
    dawn: avg(d => d.sunrise - d.fajr),
    dusk: avg(d => d.isha - d.maghrib),
  }
}

/** İl boyu ekstremumlar: ən uzun/qısa gündüz, ən erkən sübh, ən gec işa */
export function yearExtremes(days) {
  if (!days.length) return null
  let long = days[0], short = days[0], eF = days[0], lI = days[0]
  for (const d of days) {
    if (d.maghrib - d.sunrise > long.maghrib - long.sunrise) long = d
    if (d.maghrib - d.sunrise < short.maghrib - short.sunrise) short = d
    if (d.fajr < eF.fajr) eF = d
    if (d.isha > lI.isha) lI = d
  }
  return { long, short, earliestFajr: eF, latestIsha: lI, spread: (long.maghrib - long.sunrise) - (short.maghrib - short.sunrise) }
}

// ── Hədis ─────────────────────────────────────────────
/** Kitabın bölmə statistikası: secCount — HadithBooksChart.secCount */
export function bookSectionStats(d, secCount) {
  const secs = (d?.sections || []).filter(s => s[0] > 0)
  const counts = secs.map(secCount)
  const top = secs.length ? secs[counts.indexOf(Math.max(...counts))] : null
  return {
    sections: secs.length,
    avg: secs.length ? Math.round(sum(counts) / secs.length) : 0,
    top: top ? { n: top[0], name: top[1], count: secCount(top) } : null,
  }
}

/** Mətndə hansı kitablara istinad olunur: patterns = { key: RegExp } → { key: say } */
export function citeCounts(texts, patterns) {
  const out = Object.fromEntries(Object.keys(patterns).map(k => [k, 0]))
  for (const t of texts) for (const [k, re] of Object.entries(patterns)) if (re.test(t)) out[k]++
  return out
}
