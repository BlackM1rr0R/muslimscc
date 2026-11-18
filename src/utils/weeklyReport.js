// ═══════════════════════════════════════════════════════
// K5. Həftəlik e-poçt hesabatı — həftənin rəqəmləri YALNIZ bu cihazda hesablanır (server/weekly.js)
//
// Hesabın məlumatı uçdan-uca şifrəlidir: server namaz/Quran qeydlərini görmür. İstifadəçi hesabatı
// açıbsa (razılıqla), sayt açılanda (boş vaxtda, ən çox 3 saatda bir) bu modul qarşıdakı hesabat
// gününün dövrü üçün 5 rəqəmi hesablayıb PUT /api/weekly/stats ilə göndərir:
//   prayers    — qılınan (və ya qəza) fərz namaz sayı, ən çox 35 (utils/prayerTracker açarları)
//   quranPages — TƏXMİNİ Mushaf səhifəsi: ömürlük mozaikanın (quran_life_v1) ayə artımı × 604/6236.
//                Mozaikada gündəlik qeyd yoxdur — bu modul hər gün bir "anlıq görüntü" saxlayır
//                (mcc_weekly_snap, 30 gün); təkrar oxunan ayə sayılmır.
//   dhikr      — dhikr_daily_v1 cəmi
//   fasts      — sünnə oruc qeydləri (muslim_cc_sunnah_fasts_v1) + Ramazan (muslim_cc_ramadan_fasts_v1, 1 = tutuldu)
//   wirdPct    — vird (wird_v1) tamamlanma faizi; vird qurulmayıbsa null (məktubda sətir yoxdur)
// Hesabat günü: seçilmiş həftə günü, yerli 09:00 (həmin gün 09:00-dan əvvəl — bu gün, sonra — gələn).
// Dövr: hesabat günündən əvvəlki 7 gün (bu günə qədərki hissə). tests/unit/weekly-report.test.js
// ═══════════════════════════════════════════════════════
import { STAT_NAME, PRAYERS } from './prayerTracker'
import { decodeBits, countBits, TOTAL } from './quranLife'
import { gregorianToHijri } from './hijri'

export const WEEKLY_LOCAL_KEY = 'mcc_weekly'          // { on: true, wd: 0…6 } — bu cihaz üçün ipucu
export const WEEKLY_SNAP_KEY = 'mcc_weekly_snap'      // { 'YYYY-MM-DD': cəmi oxunan ayə }
export const WEEKLY_UP_KEY = 'mcc_weekly_up'          // son göndəriş (ms)
const SEND_HOUR = 9
const UPLOAD_EVERY_MS = 3 * 3600e3
const SNAP_KEEP_DAYS = 30
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }
const pad = (n) => String(n).padStart(2, '0')
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12) }
export const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return dayKey(d) }
function json(storage, key, fb) {
  try { const v = JSON.parse(storage?.getItem(key) || 'null'); return v == null ? fb : v } catch { return fb }
}
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})

/** Qarşıdakı hesabat günü (yerli): bu gün həmin gündürsə və saat 09:00-dan əvvəldirsə — bu gün */
export function nextReportDate(now = new Date(), weekday = 5) {
  const today = dayKey(now)
  if (now.getDay() === weekday && now.getHours() < SEND_HOUR) return today
  for (let i = 1; i <= 7; i++) { const d = addDays(today, i); if (fromKey(d).getDay() === weekday) return d }
  return today
}

/** Hesabat dövrünün günləri (hesabat günündən əvvəlki 7 gün), yalnız bu günə qədər */
export function periodDays(weekEnd, today) {
  const out = []
  for (let i = 7; i >= 1; i--) { const d = addDays(weekEnd, -i); if (d <= today) out.push(d) }
  return out
}

/** Ömürlük mozaikanın cəmi (xətmlər × 6236 + cari dövr) */
export function lifeTotal(storage = safeStorage()) {
  const raw = obj(json(storage, 'quran_life_v1', {}))
  let c = 0
  try { c = typeof raw.c === 'string' ? countBits(decodeBits(raw.c)) : 0 } catch { c = 0 }
  const k = Number.isInteger(raw.k) && raw.k > 0 ? raw.k : 0
  return k * TOTAL + c
}

/** Bu günün anlıq görüntüsünü yaz (30 gündən köhnələr silinir) → snap */
export function recordSnapshot(storage = safeStorage(), today = dayKey(new Date())) {
  const snap = obj(json(storage, WEEKLY_SNAP_KEY, {}))
  const out = {}
  const min = addDays(today, -SNAP_KEEP_DAYS)
  for (const [d, n] of Object.entries(snap)) if (DATE_RE.test(d) && d >= min && Number.isFinite(n)) out[d] = n
  // Gün ərzində ilk dəyər qalır (günün başlanğıcı) — artım günün sonuna qədər sayılır
  if (out[today] == null) out[today] = lifeTotal(storage)
  try { storage?.setItem(WEEKLY_SNAP_KEY, JSON.stringify(out)) } catch { /* yaddaş dolu */ }
  return out
}

/** Dövrün rəqəmləri → { prayers, quranPages, dhikr, fasts, wirdPct } */
export function computeWeekly(storage = safeStorage(), { weekEnd, today = dayKey(new Date()), snap = null } = {}) {
  const days = periodDays(weekEnd, today)
  const set = new Set(days)

  // Namazlar (utils/prayerTracker.prayerStatus ilə eyni qayda: stats / daily_tracker işarəsi)
  const stats = obj(json(storage, 'muslim_cc_prayer_stats', {}))
  const tracker = obj(json(storage, 'daily_tracker', {}))
  let prayers = 0
  for (const d of days) for (const p of PRAYERS) if (stats[`${d}_${STAT_NAME[p]}`] || tracker[d]?.[p] === true) prayers++

  // Quran (təxmini): dövrün başlanğıcındakı cəmlə indiki cəmin fərqi
  const sn = snap || obj(json(storage, WEEKLY_SNAP_KEY, {}))
  const inPeriod = Object.keys(sn).filter((d) => d >= (days[0] || weekEnd) && d <= today).sort()
  let quranPages = null
  if (inPeriod.length) {
    const delta = Math.max(0, lifeTotal(storage) - Number(sn[inPeriod[0]] || 0))
    quranPages = Math.min(5000, Math.round((delta * 604) / TOTAL))
  }

  let dhikr = 0
  for (const [d, n] of Object.entries(obj(json(storage, 'dhikr_daily_v1', {})))) if (set.has(d)) dhikr += Math.max(0, Math.floor(Number(n) || 0))

  const fastDays = new Set()
  const sunnah = obj(json(storage, 'muslim_cc_sunnah_fasts_v1', {}))
  for (const d of Array.isArray(sunnah.days) ? sunnah.days : []) if (set.has(d)) fastDays.add(d)
  const ram = obj(json(storage, 'muslim_cc_ramadan_fasts_v1', {}))
  if (Object.keys(ram).length) {
    for (const d of days) {
      const g = fromKey(d)
      const h = gregorianToHijri({ year: g.getFullYear(), month: g.getMonth() + 1, day: g.getDate() })
      if (h.month === 9 && obj(ram[h.year])[h.day] === 1) fastDays.add(d)
    }
  }

  // Vird: hər gün tamamlanan / cəmi element (gün qeydi yoxdursa — 0 / elementlərin sayı)
  const w = obj(json(storage, 'wird_v1', {}))
  const items = Array.isArray(w.items) ? w.items.length : 0
  let done = 0, total = 0
  for (const d of days) {
    const e = obj(obj(w.log)[d])
    const n = Number.isInteger(e.n) && e.n > 0 ? e.n : items
    if (!n) continue
    total += n
    done += Math.min(n, Array.isArray(e.d) ? e.d.length : 0)
  }
  const wirdPct = total ? Math.round((done / total) * 100) : null

  return { prayers: Math.min(35, prayers), quranPages, dhikr: Math.min(1_000_000, dhikr), fasts: Math.min(7, fastDays.size), wirdPct }
}

/** Bu cihazın ipucu (hesab bölməsi yazır) */
export function readLocalWeekly(storage = safeStorage()) {
  const v = obj(json(storage, WEEKLY_LOCAL_KEY, {}))
  return v.on === true && Number.isInteger(v.wd) && v.wd >= 0 && v.wd <= 6 ? v : null
}
export function writeLocalWeekly(prefs, storage = safeStorage()) {
  try {
    if (prefs && prefs.enabled) storage?.setItem(WEEKLY_LOCAL_KEY, JSON.stringify({ on: true, wd: prefs.weekday }))
    else storage?.removeItem(WEEKLY_LOCAL_KEY)
  } catch { /* */ }
}

/**
 * Sayt açılanda (App.jsx, boş vaxtda): hesabat açıqdırsa və son göndərişdən 3 saat keçibsə — göndər.
 * force — hesab bölməsindən (açan kimi). Qaytarır: göndərilən gövdə | null.
 */
export async function maybeUpload({ storage = safeStorage(), now = new Date(), force = false, put = null } = {}) {
  const local = readLocalWeekly(storage)
  if (!local) return null
  const last = Number(storage?.getItem(WEEKLY_UP_KEY)) || 0
  if (!force && now.getTime() - last < UPLOAD_EVERY_MS) return null
  const today = dayKey(now)
  const snap = recordSnapshot(storage, today)
  const weekEnd = nextReportDate(now, local.wd)
  const body = { weekEnd, ...computeWeekly(storage, { weekEnd, today, snap }) }
  const send = put || (await import('../api/community')).putWeeklyStats
  try {
    await send(body)
    storage?.setItem(WEEKLY_UP_KEY, String(now.getTime()))
  } catch (e) {
    // Serverdə söndürülüb (məs. məktubdakı "abunəlikdən çıx") — bu cihazın ipucu da silinir
    if (e && e.code === 'not_enabled') writeLocalWeekly(null, storage)
    else if (e && e.code === 'already_sent') { try { storage?.setItem(WEEKLY_UP_KEY, String(now.getTime())) } catch { /* */ } }
    return null
  }
  return body
}
