// ═══════════════════════════════════════════════════════
// "Mənim günüm" — bu günün ibadət xülasəsi (yalnız bu cihazın localStorage-i;
// heç nə serverə getmir). Ana səhifədəki MyDay paneli oxuyur.
//   prayers — bu gün qılınan fərzlər (prayerTracker: stats + daily_tracker + status)
//   dhikr   — bu gün və son 7 günün zikr sayı (dhikr_daily_v1 — DhikrPage yazır)
//   quran   — bu gün Quran açılıbmı + ardıcıl günlər (quran_stats.dates)
//   deeds   — gündəlik izləyicinin (daily_tracker) qeyd edilmiş əməlləri
//   hifz    — bu gün təkrarlanan ayələr (hifz_srs log)
//   adhkar  — səhər/axşam azkarı bu gün tamamlanıbmı (adhkar_done_v1)
//   badges  — qazanılmış nişan sayı (qm_badges_v1)
// ═══════════════════════════════════════════════════════
import { PRAYERS, loadSnapshot, dayStatuses, isPerformed, toKey, addDays } from './prayerTracker'

export const DHIKR_DAY_KEY = 'dhikr_daily_v1'
const KEEP_DAYS = 60

function readJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback } catch { return fallback }
}

/** DhikrPage hər sayda çağırır: bu günün sayını 1 artırır (60 gündən köhnə günlər silinir). */
export function bumpDhikrDay(n = 1) {
  try {
    const today = toKey()
    const map = readJSON(DHIKR_DAY_KEY, {})
    const obj = map && typeof map === 'object' && !Array.isArray(map) ? map : {}
    obj[today] = (Number(obj[today]) || 0) + n
    const cutoff = addDays(today, -KEEP_DAYS)
    for (const k of Object.keys(obj)) if (k < cutoff) delete obj[k]
    localStorage.setItem(DHIKR_DAY_KEY, JSON.stringify(obj))
  } catch { /* yaddaş bağlıdır */ }
}

const DEEDS = ['quran', 'morning', 'evening', 'dhikr', 'sadaqah']

export function readMyDay(today = toKey()) {
  // Namazlar
  let prayed = []
  try {
    const st = dayStatuses(loadSnapshot(), today)
    prayed = PRAYERS.filter(p => isPerformed(st[p]))
  } catch { /* */ }

  // Zikr — son 7 gün (köhnədən yeniyə)
  const dmap = readJSON(DHIKR_DAY_KEY, {}) || {}
  const week = []
  for (let i = 6; i >= 0; i--) week.push(Number(dmap[addDays(today, -i)]) || 0)

  // Quran
  const qs = readJSON('quran_stats', {}) || {}
  const dates = new Set(Array.isArray(qs.dates) ? qs.dates : [])
  let qStreak = 0
  for (let d = today; dates.has(d); d = addDays(d, -1)) qStreak++
  if (!qStreak && dates.has(addDays(today, -1))) {
    // Bu gün hələ açılmayıb — dünənə qədərki seriya (davam etdirmək olar)
    for (let d = addDays(today, -1); dates.has(d); d = addDays(d, -1)) qStreak++
  }

  // Gündəlik əməllər
  const tr = (readJSON('daily_tracker', {}) || {})[today] || {}
  const deeds = DEEDS.filter(k => tr[k])

  // Hifz təkrarı
  const hl = (readJSON('hifz_srs', {}) || {}).log?.[today] || {}

  // v5.7: səhər/axşam azkarı bu gün bitibmi (hisn/adhkarState.markAdhkarDone) və nişan sayı (utils/badges)
  const ad = readJSON('adhkar_done_v1', {}) || {}
  const bg = readJSON('qm_badges_v1', {}) || {}

  return {
    today,
    adhkar: { morning: ad.morning === today, evening: ad.evening === today },
    badges: bg && typeof bg === 'object' ? Object.keys(bg).length : 0,
    prayers: { done: prayed, total: PRAYERS.length },
    dhikr: { today: week[6], week },
    quran: { today: dates.has(today), streak: qStreak },
    deeds: { done: deeds, total: DEEDS.length },
    hifz: { reviewed: Number(hl.reviews) || 0, learned: Number(hl.new) || 0 },
  }
}
