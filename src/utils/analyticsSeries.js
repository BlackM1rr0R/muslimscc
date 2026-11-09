// ═══════════════════════════════════════════════════════
// /analytics v2 (bento panel) — gündəlik zaman sıraları və fəaliyyət lenti.
// YALNIZ bu cihazın localStorage-i (heç nə serverə getmir). Açarlar
// saytın öz səhifələrinin yazdığı açarlardır:
//   muslim_cc_prayer_stats  { 'YYYY-MM-DD_Fajr': true }        (/prayer)
//   daily_tracker           { 'YYYY-MM-DD': { fajr, quran, morning, … } } (/dailytracker)
//   quran_stats             { dates: ['YYYY-MM-DD'], reads, sessions } (/quran)
//   quran_khatm_plan        { days, start, done, log: [dates] } (Xətm planı)
//   dhikr_daily_v1          { 'YYYY-MM-DD': say }               (/dhikr, 60 gün)
//   dhikr_session.log       [{ id: ms, name, count, time }]      (/dhikr, son 10)
//   hifz_srs.log            { 'YYYY-MM-DD': { reviews, new } }   (/hifz)
//   charity_log             [{ id: ms, date, type, amount }]     (/charity)
//   dua_journal.duas        [{ date, answered, answeredDate, category }] (/duajournal)
//   muslim_cc_muhasabah_v1  { entries: { 'YYYY-MM-DD': { c: [], u: ms } } } (/muhasabah)
//   muslim_cc_sunnah_fasts_v1 { days: [dates] }                  (təqvim → sünnə orucları)
//   qm_badges_v1            { badgeId: 'YYYY-MM-DD' }            (nişanlar)
// Saf hissə (buildDays, rangeStats, feedEvents) tests/unit/analytics-series.test.js-də yoxlanılır.
// ═══════════════════════════════════════════════════════
import { addDayKey, dayKeys, fromDayKey, toDayKey } from '../components/viz/scale.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
export const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
// Gündəlik izləyicinin namazdan başqa əməlləri (DailyTrackerPage → ACTIVITIES)
export const DEED_KEYS = ['quran', 'morning', 'evening', 'dhikr', 'sadaqah']
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})
const arr = (v) => (Array.isArray(v) ? v : [])

function parse(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) ?? fallback : fallback
  } catch { return fallback }
}

/** localStorage-dan xam görüntü (pozuq dəyərlər buildDays-də süzülür). */
export function readStore() {
  return {
    prayerStats: parse('muslim_cc_prayer_stats', {}),
    tracker: parse('daily_tracker', {}),
    quranStats: parse('quran_stats', {}),
    khatm: parse('quran_khatm_plan', null),
    dhikrDaily: parse('dhikr_daily_v1', {}),
    dhikrSession: parse('dhikr_session', {}),
    hifzSrs: parse('hifz_srs', {}),
    charity: parse('charity_log', []),
    duaJournal: parse('dua_journal', {}),
    muhasabah: parse('muslim_cc_muhasabah_v1', {}),
    sunnahFasts: parse('muslim_cc_sunnah_fasts_v1', {}),
    badges: parse('qm_badges_v1', {}),
  }
}

/**
 * Günlər üzrə xülasə: Map<'YYYY-MM-DD', Day>
 * Day = { prayers: Set, deeds: Set (DEED_KEYS), quran: 0|1, charity: n, dhikr: n, hifz: n, muhasabah: n, fast: 0|1 }
 */
export function buildDays(store) {
  const days = new Map()
  const day = (k) => {
    if (!days.has(k)) days.set(k, { prayers: new Set(), deeds: new Set(), quran: 0, charity: 0, dhikr: 0, hifz: 0, muhasabah: 0, fast: 0 })
    return days.get(k)
  }
  for (const [k, v] of Object.entries(obj(store.prayerStats))) {
    const m = /^(\d{4}-\d{2}-\d{2})_(Fajr|Dhuhr|Asr|Maghrib|Isha)$/.exec(k)
    if (m && v) day(m[1]).prayers.add(m[2].toLowerCase())
  }
  for (const [k, v] of Object.entries(obj(store.tracker))) {
    if (!DATE_RE.test(k) || !v || typeof v !== 'object') continue
    const d = day(k)
    for (const p of PRAYER_KEYS) if (v[p] === true) d.prayers.add(p)
    for (const p of DEED_KEYS) if (v[p] === true) d.deeds.add(p)
  }
  for (const k of arr(obj(store.quranStats).dates)) if (typeof k === 'string' && DATE_RE.test(k)) day(k).deeds.add('quran')
  for (const k of arr(obj(store.khatm).log)) if (typeof k === 'string' && DATE_RE.test(k)) day(k).deeds.add('quran')
  for (const [k, v] of Object.entries(obj(store.dhikrDaily))) {
    const n = Number(v)
    if (DATE_RE.test(k) && n > 0) day(k).dhikr += n
  }
  for (const [k, v] of Object.entries(obj(obj(store.hifzSrs).log))) {
    const n = (Number(v?.reviews) || 0) + (Number(v?.new) || 0)
    if (DATE_RE.test(k) && n > 0) day(k).hifz += n
  }
  for (const e of arr(store.charity)) {
    if (e && typeof e === 'object' && typeof e.date === 'string' && DATE_RE.test(e.date)) day(e.date).charity++
  }
  for (const [k, v] of Object.entries(obj(obj(store.muhasabah).entries))) {
    if (DATE_RE.test(k) && v && Array.isArray(v.c) && v.c.length) day(k).muhasabah = v.c.length
  }
  for (const k of arr(obj(store.sunnahFasts).days)) if (typeof k === 'string' && DATE_RE.test(k)) day(k).fast = 1
  // Quran əməli: oxunub (izləyici, oxucu, xətm) VƏ ya hifz təkrarı
  for (const d of days.values()) {
    d.quran = d.deeds.has('quran') || d.hifz > 0 ? 1 : 0
    if (d.charity > 0) d.deeds.add('sadaqah')
    if (d.dhikr > 0) d.deeds.add('dhikr')
  }
  return days
}

const EMPTY = { prayers: new Set(), deeds: new Set(), quran: 0, charity: 0, dhikr: 0, hifz: 0, muhasabah: 0, fast: 0 }
export const getDay = (days, k) => days.get(k) || EMPTY

/** Yığma qrafikin 4 kateqoriyası (sabit sıra → viz ton 1–4). */
export const CATS = ['prayer', 'adhkar', 'quran', 'charity']
export function catValues(d) {
  const adhkar = ['morning', 'evening', 'dhikr'].filter(k => d.deeds.has(k)).length
  return {
    prayer: d.prayers.size,
    adhkar,
    quran: d.quran,
    charity: Math.max(d.charity, d.deeds.has('sadaqah') ? 1 : 0),
  }
}
export const dayScore = (d) => { const c = catValues(d); return c.prayer + c.adhkar + c.quran + c.charity }

/** İlk qeyd olunan gün (yoxdursa null). */
export function firstDay(days) {
  let first = null
  for (const [k, d] of days) if (dayScore(d) > 0 || d.dhikr > 0 || d.muhasabah > 0 || d.fast) { if (!first || k < first) first = k }
  return first
}

/**
 * Dövr göstəriciləri: son n gün (endKey daxil) və ondan əvvəlki n gün.
 * effDays — dövrün ilk qeyddən sonrakı günlərinin sayı (faizlər buna bölünür).
 */
export function rangeStats(days, endKey, n) {
  const cur = dayKeys(endKey, n)
  const prev = dayKeys(addDayKey(endKey, -n), n)
  const first = firstDay(days)
  const calc = (keys) => {
    const out = { prayers: 0, active: 0, quranDays: 0, dhikr: 0, fullDays: 0, fullQuran: 0, prayerDays: 0, effDays: 0,
      cats: { prayer: 0, adhkar: 0, quran: 0, charity: 0 }, perPrayer: Object.fromEntries(PRAYER_KEYS.map(p => [p, 0])),
      perDeed: Object.fromEntries(DEED_KEYS.map(p => [p, 0])), weekday: new Array(7).fill(0), weekdayN: new Array(7).fill(0) }
    for (const k of keys) {
      if (first && k >= first) out.effDays++
      const d = getDay(days, k)
      const c = catValues(d)
      const score = c.prayer + c.adhkar + c.quran + c.charity
      out.prayers += c.prayer
      if (score > 0 || d.dhikr > 0) out.active++
      if (c.quran) out.quranDays++
      out.dhikr += d.dhikr
      if (c.prayer > 0) out.prayerDays++
      if (c.prayer === 5) { out.fullDays++; if (c.quran) out.fullQuran++ }
      for (const cat of CATS) out.cats[cat] += c[cat]
      for (const p of d.prayers) out.perPrayer[p]++
      for (const p of d.deeds) if (p in out.perDeed) out.perDeed[p]++
      const wd = (fromDayKey(k).getDay() + 6) % 7   // 0 = bazar ertəsi
      out.weekday[wd] += score
      out.weekdayN[wd]++
    }
    out.score = CATS.reduce((s, c) => s + out.cats[c], 0)
    return out
  }
  return { keys: cur, prevKeys: prev, cur: calc(cur), prev: calc(prev) }
}

/**
 * Fəaliyyət lenti hadisələri (yenidən köhnəyə). names — dilə görə yazılar:
 *   names.charity(type) names.dhikr(name, count) names.duaNew names.duaAnswered names.muhasabah(n)
 *   names.badge(id) names.quran names.hifz(n) names.fullDay names.fast
 * since — bu tarixdən köhnə hadisələr atılır ('YYYY-MM-DD').
 */
export function feedEvents(store, days, names, since) {
  const ev = []
  const ok = (k) => typeof k === 'string' && DATE_RE.test(k) && (!since || k >= since)
  const ms = (v) => (Number.isFinite(Number(v)) && Number(v) > 1e12 ? Number(v) : null)
  const dayOf = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

  for (const e of arr(store.charity)) {
    if (!e || typeof e !== 'object' || !ok(e.date)) continue
    const t = ms(e.id)
    ev.push({ key: `c-${e.id ?? e.date}-${ev.length}`, kind: 'charity', icon: 'donate', time: t && dayOf(t) === e.date ? t : e.date,
      title: names.charity(typeof e.type === 'string' ? e.type : 'other'), meta: parseFloat(e.amount) > 0 ? String(parseFloat(e.amount)) : '' })
  }
  for (const e of arr(obj(store.dhikrSession).log)) {
    const t = ms(e?.id)
    if (!t || (since && dayOf(t) < since)) continue
    ev.push({ key: `z-${t}`, kind: 'dhikr', icon: 'dhikr', time: t, title: names.dhikr(typeof e.name === 'string' ? e.name : '', Number(e.count) || 0) })
  }
  for (const d of arr(obj(store.duaJournal).duas)) {
    if (!d || typeof d !== 'object') continue
    if (ok(d.date)) ev.push({ key: `d-${d.id ?? d.date}-${ev.length}`, kind: 'dua', icon: 'duajournal', time: d.date, title: names.duaNew })
    if (d.answered && ok(d.answeredDate)) ev.push({ key: `da-${d.id ?? d.answeredDate}-${ev.length}`, kind: 'dua', icon: 'check', time: d.answeredDate, title: names.duaAnswered })
  }
  for (const [k, v] of Object.entries(obj(obj(store.muhasabah).entries))) {
    if (!ok(k) || !v || !Array.isArray(v.c) || !v.c.length) continue
    const t = ms(v.u)
    ev.push({ key: `m-${k}`, kind: 'muhasabah', icon: 'muhasabah', time: t && dayOf(t) === k ? t : k, title: names.muhasabah(v.c.length) })
  }
  for (const [id, at] of Object.entries(obj(store.badges))) {
    if (ok(at)) ev.push({ key: `b-${id}`, kind: 'badge', icon: 'star', time: at, title: names.badge(id) })
  }
  for (const [k, d] of days) {
    if (!ok(k)) continue
    if (d.prayers.size === 5) ev.push({ key: `p-${k}`, kind: 'prayer', icon: 'prayer', time: k, title: names.fullDay })
    if (d.deeds.has('quran')) ev.push({ key: `q-${k}`, kind: 'quran', icon: 'quran', time: k, title: names.quran })
    if (d.hifz > 0) ev.push({ key: `h-${k}`, kind: 'hifz', icon: 'hifz', time: k, title: names.hifz(d.hifz) })
    if (d.fast) ev.push({ key: `f-${k}`, kind: 'fast', icon: 'moonStar', time: k, title: names.fast })
  }
  // Sıralama: gün (yenidən köhnəyə), eyni gündə dəqiq vaxtlı hadisə əvvəl
  // (əvvəl gün hadisəsi günün 12:00-ı sayılırdı — səhər saatlarında bu günün dəqiq vaxtlı
  // hadisəsi onun altına düşürdü)
  const evDay = (e) => (typeof e.time === 'number' ? toDayKey(new Date(e.time)) : e.time)
  return ev.sort((a, b) => {
    const da = evDay(a), db = evDay(b)
    if (da !== db) return da < db ? 1 : -1
    const ta = typeof a.time === 'number', tb = typeof b.time === 'number'
    if (ta && tb) return b.time - a.time
    return ta === tb ? 0 : ta ? -1 : 1
  })
}
