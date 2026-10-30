// ═══════════════════════════════════════════════════════
// Namaz izləyicisi — YEGANƏ məlumat qatı (yalnız bu cihazda)
//
// Mövcud açarlar QALIR və dəyişmir (köhnə məlumat itmir, miqrasiya lazım deyil):
//   'muslim_cc_prayer_stats' → { 'YYYY-MM-DD_Fajr': true }        (/prayer)
//   'daily_tracker'          → { 'YYYY-MM-DD': { fajr: true, … } } (/dailytracker)
// Bu iki açar "namaz qılınıb" (vaxtında və ya qəza) deməkdir — /prayer,
// /dailytracker və /analytics onları əvvəlki kimi oxuyur.
//
// Yeni açarlar (hamısı localStorage, heç biri serverə/Firestore-a getmir):
//   'muslim_cc_prayer_status' → { 'YYYY-MM-DD': { fajr: 'qada' | 'missed' } }
//        Yalnız "qılındı"dan fərqli vəziyyətlər. Köhnə qeydlərdə bu açar
//        yoxdur → onlar avtomatik "qıldım" sayılır.
//   'muslim_cc_qada'  → { prayers: { fajr: { debt, done } … }, fasts: { debt, done } }
//   'muslim_cc_hayd'  → { enabled, periods: [{ id, type, start, end }], handled: [id] }
//        Heyz/nifas qeydi — HƏSSAS məlumat: yalnız cihazda, ixrac/sinxron yoxdur.
//
// Bildirişdəki "✅ Qıldım" düyməsi (public/sw.js) IndexedDB-yə yazır
// ('muslims-tracker' → 'pending'); syncPendingCheckins() onları buraya köçürür.
// ═══════════════════════════════════════════════════════

export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
export const STAT_NAME = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' }
export const STATUSES = ['prayed', 'qada', 'missed']

export const STATS_KEY = 'muslim_cc_prayer_stats'
export const TRACKER_KEY = 'daily_tracker'
export const STATUS_KEY = 'muslim_cc_prayer_status'
export const QADA_KEY = 'muslim_cc_qada'
export const HAYD_KEY = 'muslim_cc_hayd'
// PrayerPage.jsx və DailyTrackerPage.jsx ilə eyni hadisə adı
export const PRAYER_SYNC_EVENT = 'qm-prayer-sync'

export const IDB_NAME = 'muslims-tracker'
export const IDB_STORE = 'pending'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
export const isDateKey = (v) => typeof v === 'string' && DATE_RE.test(v)

// ── Tarix (YERLİ gün; toISOString UTC-dir — Bakıda gecə yarısı dünənə düşürdü) ──
export function toKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
/** 'YYYY-MM-DD' → yerli günorta (DST/saat qurşağı sürüşməsi olmasın) */
export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}
export function addDays(key, n) {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}
export function daysBetween(a, b) {
  return Math.round((fromKey(b) - fromKey(a)) / 86400000)
}

// ── Oxuma/yazma ──
function readJSON(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key)
    const v = raw ? JSON.parse(raw) : fallback
    return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback
  } catch { return fallback }
}
function writeJSON(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); return true } catch { return false }
}
function notify() {
  try { window.dispatchEvent(new Event(PRAYER_SYNC_EVENT)) } catch { /* SSR */ }
}

/** Üç namaz açarının anlıq görüntüsü: { stats, tracker, status } */
export function loadSnapshot() {
  return { stats: readJSON(STATS_KEY), tracker: readJSON(TRACKER_KEY), status: readJSON(STATUS_KEY) }
}

// ── Saf funksiyalar (tests/unit/prayer-tracker.test.js) ──

/** Bir namazın vəziyyəti: 'prayed' | 'qada' | 'missed' | null */
export function prayerStatus(snap, date, p) {
  const done = !!snap.stats[`${date}_${STAT_NAME[p]}`] || snap.tracker[date]?.[p] === true
  const s = snap.status[date]?.[p]
  if (done) return s === 'qada' ? 'qada' : 'prayed'
  return s === 'missed' ? 'missed' : null
}

export function dayStatuses(snap, date) {
  const out = {}
  for (const p of PRAYERS) out[p] = prayerStatus(snap, date, p)
  return out
}

export const isPerformed = (s) => s === 'prayed' || s === 'qada'

/** Vəziyyəti yaz (saf — yeni görüntü qaytarır). status: 'prayed'|'qada'|'missed'|null */
export function applyStatus(snap, date, p, status) {
  const stats = { ...snap.stats }
  const tracker = { ...snap.tracker }
  const statusMap = { ...snap.status }
  const done = isPerformed(status)
  const sk = `${date}_${STAT_NAME[p]}`
  if (done) stats[sk] = true
  else delete stats[sk]
  // daily_tracker-in həmin günündəki digər əməllər (Quran, zikr…) toxunulmaz qalır
  tracker[date] = { ...(tracker[date] || {}), [p]: done }
  const day = { ...(statusMap[date] || {}) }
  if (status === 'qada' || status === 'missed') day[p] = status
  else delete day[p]
  if (Object.keys(day).length) statusMap[date] = day
  else delete statusMap[date]
  return { stats, tracker, status: statusMap }
}

/**
 * IndexedDB-dən gələn gözləyən qeydləri birləşdir — İDEMPOTENT: eyni qeydi
 * iki dəfə tətbiq etmək nəticəni dəyişmir; artıq qılınmış (və ya qəza
 * qılınmış) namaz "qıldım"a endirilmir. Yararsız qeydlər atılır.
 */
export function mergePending(snap, records) {
  let next = snap
  let changed = 0
  for (const r of records || []) {
    if (!r || !PRAYERS.includes(r.prayer) || !isDateKey(r.date) || r.status !== 'prayed') continue
    if (isPerformed(prayerStatus(next, r.date, r.prayer))) continue
    next = applyStatus(next, r.date, r.prayer, 'prayed')
    changed++
  }
  return { snap: next, changed }
}

// ── Heyz / nifas dövrləri ──
export function normHayd(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const periods = (Array.isArray(r.periods) ? r.periods : [])
    .filter(p => p && isDateKey(p.start) && (p.end == null || isDateKey(p.end)))
    .map(p => ({
      id: String(p.id || p.start),
      type: p.type === 'nifas' ? 'nifas' : 'hayd',
      start: p.start,
      end: p.end && p.end >= p.start ? p.end : (p.end ? p.start : null),
    }))
    .sort((a, b) => (a.start < b.start ? 1 : -1))
  return {
    enabled: r.enabled === true,
    periods,
    handled: Array.isArray(r.handled) ? r.handled.map(String) : [],
  }
}

/** Gün hansı dövrə düşür? Açıq dövr (end=null) bu günə qədər davam edir. */
export function excusedPeriod(periods, date, today) {
  for (const p of periods || []) {
    const end = p.end || today
    if (date >= p.start && date <= end) return p
  }
  return null
}

/** Gün: 'excused' | 'complete' | 'partial' | 'none' + saylar */
export function dayState(snap, periods, date, today) {
  const ex = excusedPeriod(periods, date, today)
  const st = dayStatuses(snap, date)
  const counts = { prayed: 0, qada: 0, missed: 0 }
  for (const p of PRAYERS) if (st[p]) counts[st[p]]++
  const performed = counts.prayed + counts.qada
  let state = 'none'
  if (ex) state = 'excused'
  else if (performed === PRAYERS.length) state = 'complete'
  else if (performed || counts.missed) state = 'partial'
  return { state, type: ex ? ex.type : null, statuses: st, ...counts, performed }
}

/**
 * Ardıcıl gün seriyası: 5 fərzin hamısı qılınan (vaxtında və ya qəza) günlər.
 * Heyz/nifas günləri seriyanı QIRMIR (sayılmır da). Bu gün hələ yarımçıqdırsa
 * seriya dünəndən sayılır.
 */
export function computeStreak(snap, periods, today, maxDays = 3650) {
  let streak = 0
  for (let i = 0; i < maxDays; i++) {
    const date = addDays(today, -i)
    const s = dayState(snap, periods, date, today).state
    if (s === 'excused') continue
    if (s === 'complete') streak++
    else if (i === 0) continue
    else break
  }
  return streak
}

/** Ən uzun seriya — ilk qeyddən bu günə qədər. */
export function bestStreak(snap, periods, today) {
  const first = earliestDate(snap)
  if (!first) return 0
  let best = 0, cur = 0
  for (let d = first; d <= today; d = addDays(d, 1)) {
    const s = dayState(snap, periods, d, today).state
    if (s === 'excused') continue
    if (s === 'complete') { cur++; if (cur > best) best = cur }
    else if (d !== today) cur = 0
  }
  return best
}

export function earliestDate(snap) {
  let min = null
  const consider = (d) => { if (isDateKey(d) && (!min || d < min)) min = d }
  for (const k of Object.keys(snap.stats)) consider(k.slice(0, 10))
  for (const k of Object.keys(snap.tracker)) consider(k)
  for (const k of Object.keys(snap.status)) consider(k)
  return min
}

/** Günlər siyahısı üzrə hesabat */
export function rangeSummary(snap, periods, dates, today) {
  const out = { prayed: 0, qada: 0, missed: 0, unmarked: 0, excusedDays: 0, completeDays: 0, possible: 0 }
  for (const d of dates) {
    if (d > today) continue
    const s = dayState(snap, periods, d, today)
    if (s.state === 'excused') { out.excusedDays++; continue }
    out.possible += PRAYERS.length
    out.prayed += s.prayed
    out.qada += s.qada
    out.missed += s.missed
    out.unmarked += PRAYERS.length - s.prayed - s.qada - s.missed
    if (s.state === 'complete') out.completeDays++
  }
  out.pct = out.possible ? Math.round(((out.prayed + out.qada) / out.possible) * 100) : 0
  return out
}

export function lastNDays(today, n) {
  const out = []
  for (let i = n - 1; i >= 0; i--) out.push(addDays(today, -i))
  return out
}

export function monthDays(year, month0) {
  const n = new Date(year, month0 + 1, 0).getDate()
  const out = []
  for (let d = 1; d <= n; d++) out.push(toKey(new Date(year, month0, d, 12)))
  return out
}

// ── Qəza sayğacı ──
const clampInt = (v, max = 1e6) => {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0
}
export function normQada(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const prayers = {}
  for (const p of PRAYERS) {
    const x = r.prayers?.[p] || {}
    prayers[p] = { debt: clampInt(x.debt), done: clampInt(x.done) }
  }
  const f = r.fasts || {}
  return { prayers, fasts: { debt: clampInt(f.debt), done: clampInt(f.done) } }
}

/** Toplu daxiletmə: il/ay/gün → gün sayı (təxmini: il 365, ay 30 gün; istifadəçi təsdiqləyir/düzəldir) */
export function estimateMissedDays({ years = 0, months = 0, days = 0 } = {}) {
  return Math.min(clampInt(years, 100) * 365 + clampInt(months, 1200) * 30 + clampInt(days, 36500), 36500)
}

export function qadaTotals(q) {
  let debt = 0, done = 0
  for (const p of PRAYERS) { debt += q.prayers[p].debt; done += q.prayers[p].done }
  const all = debt + done
  return { debt, done, pct: all ? Math.round((done / all) * 100) : 0 }
}

// ── Ramazan günləri (heyz dövründə tutulmayan oruclar — TƏKLİF üçün) ──
// Hicri ay brauzerin hesablanmış Ümmül-Qura təqvimi ilə (Intl); yerli
// rü'yətdən bir gün fərqlənə bilər — istifadəçi sayı təsdiqləyir/düzəldir.
let hijriFmt
function hijriMonth(key) {
  try {
    hijriFmt ||= new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { month: 'numeric', timeZone: 'UTC' })
    const [y, m, d] = key.split('-').map(Number)
    const part = hijriFmt.formatToParts(new Date(Date.UTC(y, m - 1, d, 12))).find(x => x.type === 'month')
    return part ? Number(part.value) : null
  } catch { return null }
}

/** Dövrün Ramazana düşən günləri (bu günə qədər) */
export function ramadanDaysIn(period, today) {
  const end = period.end || today
  const last = end < today ? end : today
  const out = []
  for (let d = period.start; d <= last; d = addDays(d, 1)) {
    if (hijriMonth(d) === 9) out.push(d)
    if (out.length > 60) break
  }
  return out
}

// ── localStorage yazıcıları (hadisə ilə — açıq səhifələr yenidən oxusun) ──
export function setPrayerStatus(date, p, status) {
  if (!isDateKey(date) || !PRAYERS.includes(p)) return
  const next = applyStatus(loadSnapshot(), date, p, STATUSES.includes(status) ? status : null)
  writeJSON(STATS_KEY, next.stats)
  writeJSON(TRACKER_KEY, next.tracker)
  writeJSON(STATUS_KEY, next.status)
  notify()
}

export const loadQada = () => normQada(readJSON(QADA_KEY))
export function saveQada(q) { writeJSON(QADA_KEY, normQada(q)); notify() }
export const loadHayd = () => normHayd(readJSON(HAYD_KEY))
export function saveHayd(h) { writeJSON(HAYD_KEY, normHayd(h)); notify() }

// ── IndexedDB (service worker "✅ Qıldım" düyməsi) ──
function openIdb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('no-idb')); return }
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

let syncing = null
/**
 * Gözləyən qeydləri IndexedDB-dən localStorage-a köçür və sil.
 * Eyni vaxtda bir dəfə işləyir; nəticə — köçürülən (dəyişən) qeyd sayı.
 */
export function syncPendingCheckins() {
  if (syncing) return syncing
  syncing = (async () => {
    let db
    try {
      db = await openIdb()
      const records = await new Promise((resolve, reject) => {
        const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).getAll()
        req.onsuccess = () => resolve(req.result || [])
        req.onerror = () => reject(req.error)
      })
      if (!records.length) return 0
      const { snap, changed } = mergePending(loadSnapshot(), records)
      if (changed) {
        writeJSON(STATS_KEY, snap.stats)
        writeJSON(TRACKER_KEY, snap.tracker)
        writeJSON(STATUS_KEY, snap.status)
      }
      // localStorage yazısından SONRA sil: arada səhifə bağlansa, qeyd növbəti
      // açılışda yenidən (idempotent) tətbiq olunur
      await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite')
        const store = tx.objectStore(IDB_STORE)
        for (const r of records) store.delete(r.id)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
      if (changed) notify()
      return changed
    } catch {
      return 0
    } finally {
      try { db?.close() } catch { /* */ }
      syncing = null
    }
  })()
  return syncing
}
