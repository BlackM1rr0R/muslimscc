// ═══════════════════════════════════════════════════════
// Şəxsi vird (H2) — gündəlik ibadət siyahısı: saf məntiq + localStorage (React-sız).
//
// QAYDA: yeni dini mətn YOXDUR. Hər element saytda artıq olan, mənbəli məlumata işarədir:
//   quran   — Quran səhifələri (say) → /mushaf (qaldığınız səhifədən)
//   salawat — salavat (data/dhikr.js → DHIKRS, "Muslim 408") → /dhikr
//   tasbih  — namazdan sonrakı təsbih (data/dhikr.js → AFTER_PRAYER, "Muslim 597") → /dhikr
//   morning / evening — səhər / axşam azkarı (Hisnul-Müslim, fəsil 28) → /hisn#adhkar;
//            AdhkarFocus bitirəndə (adhkar_done_v1) özü işarələnir
//   sleep   — yatmazdan əvvəl zikrlər (Hisnul-Müslim, fəsil 29) → /hisn#hs-29
//   mulk / sajdah — Mülk (67) və Səcdə (32) surələri yatmazdan əvvəl (Hisnul-Müslim, fəsil 29,
//            həmin fəslin 12-ci bəndi, Tirmizi 2892) → /quran/67, /quran/32.
//            Dərəcə YAZILMIR: hadith-api-də 2892-nin hökmü "Al-Albani: Daif Maqtu"-dur, qeyddə isə
//            sonda Tavusun məqtu sözü də var — Cabir hədisinin öz hökmü oradan təsdiqlənmir, təxmin edilmir.
// Hər element bir vaxta bağlıdır (namaz və ya "yatmazdan əvvəl") — bugünkü siyahı istifadəçinin
// şəhərinin namaz vaxtlarına görə sıralanır (hooks/usePrayerTimes).
//
// GÜN SƏRHƏDİ: vird günü gecə yarısında yox, SÜBHDƏ dəyişir — 00:30-da "yatmazdan əvvəl" işarəsi
// ötən günə yazılır (wirdDay). Seriya — bütün elementləri tamamlanan ardıcıl günlər; bu gün hələ
// bitməyibsə dünənə qədərki seriya. Heç nə paylaşılmır (yalnız bu cihaz + şifrəli hesab sinxronu).
//
//   wird_v1 = { v: 1, items: [{ id, t, n?, at }], log: { 'YYYY-MM-DD': { d: [id…], n: cəmi } } }
// tests/unit/wird.test.js
// ═══════════════════════════════════════════════════════
import { toKey, addDays } from './prayerTracker'

export const WIRD_KEY = 'wird_v1'
export const WIRD_EVENT = 'mcc-wird'
export const KEEP_DAYS = 120
export const MAX_ITEMS = 12

export const ANCHORS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha', 'sleep']
// Element növləri: n — say (varsa: min/max/susmaya görə), at — susmaya görə vaxt
export const WIRD_TYPES = {
  quran:   { icon: 'mushaf', page: 'mushaf', n: [1, 20, 2], at: 'fajr' },
  salawat: { icon: 'dhikr', page: 'dhikr', n: [1, 1000, 10], at: 'maghrib', source: 'Muslim 408' },
  tasbih:  { icon: 'dhikr', page: 'dhikr', at: 'dhuhr', source: 'Muslim 597' },
  morning: { icon: 'sunrise', page: 'hisn', hash: '#adhkar', at: 'fajr', hisn: 28, auto: 'morning' },
  evening: { icon: 'sunset', page: 'hisn', hash: '#adhkar', at: 'asr', hisn: 28, auto: 'evening' },
  sleep:   { icon: 'moon', page: 'hisn', hash: '#hs-29', at: 'sleep', hisn: 29 },
  mulk:    { icon: 'quran', page: 'quran', param: 67, at: 'sleep', hisn: 29 },
  sajdah:  { icon: 'quran', page: 'quran', param: 32, at: 'sleep', hisn: 29 },
}
// "Yatmazdan əvvəl" — sıralama üçün işadan 90 dəqiqə sonra
const SLEEP_AFTER_ISHA = 90
// Namaz vaxtları hələ yoxdursa (şəbəkə) — yalnız sıralama üçün təxmini saatlar
export const FALLBACK_TIMES = { fajr: '05:30', sunrise: '07:00', dhuhr: '12:30', asr: '15:30', maghrib: '18:00', isha: '19:30' }

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const toMin = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ''))
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

export const itemId = (t, at) => `${t}-${at}`

export function cleanItem(it) {
  if (!isObj(it)) return null
  const type = WIRD_TYPES[it.t]
  if (!type) return null
  const at = ANCHORS.includes(it.at) ? it.at : type.at
  const out = { id: itemId(it.t, at), t: it.t, at }
  if (type.n) {
    const [lo, hi, def] = type.n
    const n = Math.round(Number(it.n))
    out.n = Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : def
  }
  return out
}

export function sanitizeWird(raw) {
  let o = raw
  if (typeof raw === 'string') { try { o = JSON.parse(raw) } catch { o = null } }
  if (!isObj(o)) o = {}
  const items = []
  for (const it of Array.isArray(o.items) ? o.items : []) {
    const c = cleanItem(it)
    if (c && !items.some((x) => x.id === c.id) && items.length < MAX_ITEMS) items.push(c)
  }
  const log = {}
  const days = Object.keys(isObj(o.log) ? o.log : {}).filter((d) => DATE_RE.test(d)).sort().slice(-KEEP_DAYS)
  for (const d of days) {
    const e = o.log[d]
    const ids = [...new Set((Array.isArray(e?.d) ? e.d : []).filter((x) => typeof x === 'string' && x.length <= 40))].slice(0, MAX_ITEMS * 2)
    const n = Math.max(0, Math.min(MAX_ITEMS, Math.round(Number(e?.n)) || 0))
    if (ids.length) log[d] = { d: ids, n: Math.max(n, 1) }
  }
  return { v: 1, items, log }
}

/** Vird günü: sübhdən əvvəl — hələ ötən gün */
export function wirdDay(dateKey, nowMin, fajrMin) {
  if (Number.isFinite(nowMin) && Number.isFinite(fajrMin) && nowMin < fajrMin) return addDays(dateKey, -1)
  return dateKey
}

/** Vaxt → gecə yarısından dəqiqə (times: { fajr: 'HH:MM', … }) */
export function anchorMinutes(at, times = {}) {
  const t = { ...FALLBACK_TIMES, ...Object.fromEntries(Object.entries(times || {}).filter(([, v]) => toMin(v) != null)) }
  if (at === 'sleep') return (toMin(t.isha) ?? toMin(FALLBACK_TIMES.isha)) + SLEEP_AFTER_ISHA
  return toMin(t[at]) ?? toMin(FALLBACK_TIMES[at]) ?? 0
}

/**
 * Bugünkü siyahı, vaxta görə sıralı. nowMin — vird gününün başlanğıcından (gecə yarısı) dəqiqə;
 * sübhdən əvvəlki saat (ötən günün davamı) 24·60 əlavə olunaraq ötürülməlidir (scheduleNow).
 * → [{ …item, min, due, done }]
 */
export function buildSchedule(items, times, doneIds = [], nowMin = 0) {
  const done = new Set(doneIds)
  const order = (it) => ANCHORS.indexOf(it.at)
  return (items || []).map((it, i) => ({ it, i, min: anchorMinutes(it.at, times) }))
    .sort((a, b) => (a.min - b.min) || (order(a.it) - order(b.it)) || (a.i - b.i))
    .map(({ it, min }) => ({ ...it, min, due: nowMin >= min, done: done.has(it.id) }))
}

/** Saat (Date + namaz vaxtları) → { day, nowMin } — sübhdən əvvəl ötən gün, dəqiqələr 24·60-dan böyük */
export function scheduleNow(now = new Date(), times = {}) {
  const cal = toKey(now)
  const m = now.getHours() * 60 + now.getMinutes()
  const fajr = anchorMinutes('fajr', times)
  const day = wirdDay(cal, m, fajr)
  return { day, nowMin: day === cal ? m : m + 24 * 60 }
}

export function dayEntry(w, day) { return w.log[day] || { d: [], n: w.items.length } }

/** İşarələ / sil (immutable) */
export function toggleDone(w, day, id, on) {
  const cur = dayEntry(w, day)
  const set = new Set(cur.d)
  if (on) set.add(id); else set.delete(id)
  const log = { ...w.log }
  const ids = [...set].filter((x) => w.items.some((it) => it.id === x))
  if (ids.length) log[day] = { d: ids, n: w.items.length }
  else delete log[day]
  return sanitizeWird({ ...w, log })
}

/** Avtomatik elementlər (səhər / axşam azkarı): adhkar_done_v1-də bu gün bitibsə — işarələnir */
export function applyAuto(w, day, adhkarDone, calendarDay = day) {
  let out = w
  for (const it of w.items) {
    const part = WIRD_TYPES[it.t]?.auto
    if (!part || !isObj(adhkarDone)) continue
    const d = adhkarDone[part]
    if ((d === day || d === calendarDay) && !dayEntry(out, day).d.includes(it.id)) out = toggleDone(out, day, it.id, true)
  }
  return out
}

export function progress(w, day) {
  const ids = new Set(dayEntry(w, day).d)
  const done = w.items.filter((it) => ids.has(it.id)).length
  return { done, total: w.items.length }
}

const complete = (e) => Boolean(e && e.n > 0 && e.d.length >= e.n)

/** Seriya: ardıcıl tam günlər (bu gün bitməyibsə — dünənə qədər) */
export function wirdStreak(w, today) {
  let d = today
  if (!complete(w.log[d])) d = addDays(today, -1)
  let n = 0
  while (complete(w.log[d]) && n <= KEEP_DAYS) { n++; d = addDays(d, -1) }
  return n
}

export function addItem(w, it) {
  const c = cleanItem(it)
  if (!c) return w
  const items = w.items.filter((x) => x.id !== c.id)
  if (items.length >= MAX_ITEMS) return w
  const at = w.items.findIndex((x) => x.id === c.id)
  if (at >= 0) items.splice(at, 0, c); else items.push(c)
  return sanitizeWird({ ...w, items })
}
export const removeItem = (w, id) => sanitizeWird({ ...w, items: w.items.filter((x) => x.id !== id) })

const ls = () => { try { return globalThis.localStorage } catch { return null } }
export function readWird(storage = ls()) {
  try { return sanitizeWird(storage?.getItem(WIRD_KEY)) } catch { return sanitizeWird(null) }
}
export function saveWird(w, storage = ls()) {
  const c = sanitizeWird(w)
  try {
    if (!c.items.length && !Object.keys(c.log).length) storage?.removeItem(WIRD_KEY)
    else storage?.setItem(WIRD_KEY, JSON.stringify(c))
  } catch { /* yaddaş bağlıdır */ }
  try { window.dispatchEvent(new CustomEvent(WIRD_EVENT)) } catch { /* SSR */ }
  return c
}

/** Sinxronizasiya: elementlər — id üzrə 3 tərəfli; jurnal — gün üzrə birlik (işarə itməsin), cəmi — max */
export function mergeWird(L, R, B) {
  const l = sanitizeWird(L), r = sanitizeWird(R), b = B === undefined ? null : sanitizeWird(B)
  const ids = (a) => new Set(a.items.map((x) => x.id))
  const Li = ids(l), Ri = ids(r), Bi = b ? ids(b) : new Set()
  const keep = (id) => (Li.has(id) && Ri.has(id)) || (Li.has(id) && !Bi.has(id)) || (Ri.has(id) && !Bi.has(id))
  const items = []
  for (const it of [...l.items, ...r.items]) {
    if (items.some((x) => x.id === it.id) || !keep(it.id)) continue
    // eyni element hər iki tərəfdə: bazadan dəyişən tərəfin sayı (ikisi də dəyişibsə — bu cihazınkı)
    const li = l.items.find((x) => x.id === it.id), ri = r.items.find((x) => x.id === it.id), bi = b?.items.find((x) => x.id === it.id)
    items.push(li && ri ? (bi && JSON.stringify(li) === JSON.stringify(bi) ? ri : li) : it)
  }
  // Gün üzrə 3 tərəfli çoxluq: bir cihazda əlavə olunan işarə qalır, bazada olub bir cihazda
  // silinən — silinir (baza yoxdursa — birlik)
  const log = {}
  for (const d of new Set([...Object.keys(l.log), ...Object.keys(r.log)])) {
    const a = new Set(l.log[d]?.d || []), c = new Set(r.log[d]?.d || []), o = new Set(b?.log[d]?.d || [])
    const ids = [...new Set([...a, ...c])].filter((id) => (a.has(id) && c.has(id)) || (a.has(id) && !o.has(id)) || (c.has(id) && !o.has(id)))
    if (ids.length) log[d] = { d: ids, n: Math.max(l.log[d]?.n || 0, r.log[d]?.n || 0) }
  }
  return sanitizeWird({ v: 1, items, log })
}
