// ═══════════════════════════════════════════════════════
// Nişanlar (v5.7) — /analytics "Nailiyyətlər" rəfi + "yeni nişan" bildirişi
//
//   badgeList(data?)  → [{ id, icon, tier, name, value, goal, done, at }]
//   syncBadges()      → yeni qazanılan nişanlar (ilk dəfə) — qeyd edir və qaytarır
//   grantBadge(id)    → hesablana bilməyən hadisə (qrup xətmi, azkar) üçün
//
// • Hamısı bu cihazın localStorage-indəndir (utils/analyticsData + prayerTracker).
// • Qazanılan nişan bir dəfə yazılır ('qm_badges_v1' → { id: 'YYYY-MM-DD' }) və
//   məlumat sonra silinsə də (xətm planı sıfırlansa da) rəfdə qalır.
// • celebrate() hər uğur anından sonra syncBadges-i çağırır → yeni nişan varsa
//   BadgeToast göstərilir (hadisə 'qm-badge').
// ═══════════════════════════════════════════════════════
import { readAnalytics, localDate, safeJSON } from './analyticsData.js'
import { BADGE_NAMES } from '../components/badgeNames.js'
import { gregorianToHijri, parseGKey } from './hijri.js'
import { loadSnapshot, loadHayd, bestStreak, earliestDate, dayState, addDays, toKey } from './prayerTracker.js'

export const BADGE_KEY = 'qm_badges_v1'
export const BADGE_EVENT = 'qm-badge'
// Azkar bitəndə components/hisn/adhkarState.markAdhkarDone yazır: { morning, evening: 'YYYY-MM-DD' }
export const ADHKAR_DONE_KEY = 'adhkar_done_v1'
const MUSHAF_PAGES = 604

// tier: bronze · silver · gold (rəfdə medalın rəngi)
const DEFS = [
  { id: 'first_prayer', icon: 'sahaba', tier: 'bronze', goal: 1, v: d => d.totalPrayers, },
  { id: 'full_day', icon: 'prayer', tier: 'bronze', goal: 1, v: d => d.fullDays, },
  { id: 'prayers_100', icon: 'tracker', tier: 'silver', goal: 100, v: d => d.totalPrayers, },
  { id: 'prayer_40', icon: 'moonStar', tier: 'gold', goal: 40, v: d => d.prayerBest, },
  { id: 'prayers_1000', icon: 'star', tier: 'gold', goal: 1000, v: d => d.totalPrayers, },
  { id: 'streak_7', icon: 'bolt', tier: 'bronze', goal: 7, v: d => d.maxStreak, },
  { id: 'streak_30', icon: 'sparkle', tier: 'silver', goal: 30, v: d => d.maxStreak, },
  { id: 'quran_10', icon: 'quran', tier: 'bronze', goal: 10, v: d => d.uniqueSurahs, },
  { id: 'quran_114', icon: 'mushaf', tier: 'gold', goal: 114, v: d => d.uniqueSurahs, },
  { id: 'khatm', icon: 'hijri', tier: 'gold', goal: MUSHAF_PAGES, v: d => d.khatmPages, },
  { id: 'group_khatm', icon: 'group', tier: 'gold', goal: 1, v: () => 0, },
  { id: 'dhikr_1000', icon: 'dhikr', tier: 'silver', goal: 1000, v: d => d.dhikrTotal, },
  { id: 'dhikr_10000', icon: 'dhikr', tier: 'gold', goal: 10000, v: d => d.dhikrTotal, },
  { id: 'adhkar', icon: 'sunrise', tier: 'bronze', goal: 1, v: d => d.adhkarAny, },
  { id: 'adhkar_both', icon: 'sunset', tier: 'silver', goal: 1, v: d => d.adhkarBoth, },
  { id: 'path', icon: 'learn', tier: 'silver', goal: 1, v: d => d.pathsDone, },
  { id: 'hifz_5', icon: 'hifz', tier: 'silver', goal: 5, v: d => d.hifzMemorized, },
  // v5.7: mövsümi nişanlar (hicri təqvim — Ümmül-Qura)
  { id: 'ramadan_quran', icon: 'ramadan', tier: 'gold', goal: 20, v: d => d.ramadanQuran },
  { id: 'dhul_hijja', icon: 'hajjguide', tier: 'gold', goal: 10, v: d => d.dhulHijja },
  { id: 'kahf', icon: 'quran', tier: 'bronze', goal: 1, v: d => d.kahf },
  { id: 'kahf_4', icon: 'mushaf', tier: 'silver', goal: 4, v: d => d.kahf },
  { id: 'scholar', icon: 'prayerguide', tier: 'silver', goal: 10, v: d => Math.max(0, ...Object.values(d.quizScores || {})), },
  { id: 'hadith_20', icon: 'hadith', tier: 'bronze', goal: 20, v: d => d.hadithFavs, },
  { id: 'dua_10', icon: 'duas', tier: 'bronze', goal: 10, v: d => d.journalTotal, },
  { id: 'charity_10', icon: 'donate', tier: 'silver', goal: 10, v: d => d.totalCharity, },
]
export const BADGE_IDS = DEFS.map(d => d.id)

/** Qazanılmış nişanlar: { id: 'YYYY-MM-DD' } */
export function loadEarned() {
  const v = safeJSON(BADGE_KEY, {})
  const out = {}
  for (const [k, d] of Object.entries(v)) if (BADGE_IDS.includes(k) && typeof d === 'string') out[k] = d
  return out
}
function saveEarned(e) {
  try { localStorage.setItem(BADGE_KEY, JSON.stringify(e)) } catch { /* yaddaş bağlıdır */ }
}

/** analyticsData-ya əlavə göstəricilər: 5/5 günlər, seriya, xətm, azkar, dərs yolu */
function extraStats() {
  const out = { fullDays: 0, prayerBest: 0, khatmPages: 0, adhkarAny: 0, adhkarBoth: 0, pathsDone: 0, ramadanQuran: 0, dhulHijja: 0, kahf: 0 }
  const hOf = (k) => { const g = parseGKey(k); return g ? gregorianToHijri(g) : null }
  try {
    const snap = loadSnapshot(), periods = loadHayd()?.periods || [], today = toKey()
    const first = earliestDate(snap)
    const dh = {}
    if (first) {
      let n = 0
      for (let d = first; d <= today && n < 4000; d = addDays(d, 1), n++) {
        if (dayState(snap, periods, d, today).state === 'complete') {
          out.fullDays++
          const h = hOf(d)
          // Zülhiccənin ilk 10 günü — ən çox tam (5/5) gün olan il
          if (h && h.month === 12 && h.day <= 10) dh[h.year] = (dh[h.year] || 0) + 1
        }
      }
      out.prayerBest = bestStreak(snap, periods, today)
    }
    out.dhulHijja = Math.max(0, ...Object.values(dh))
  } catch { /* */ }
  // Ramazan: bir Ramazanda Quran oxunan gün sayı (ən çox olan il)
  const rq = {}
  for (const k of safeJSON('quran_stats', {}).dates || []) {
    const h = typeof k === 'string' ? hOf(k) : null
    if (h && h.month === 9) rq[h.year] = (rq[h.year] || 0) + 1
  }
  out.ramadanQuran = Math.max(0, ...Object.values(rq))
  const kf = safeJSON('kahf_fridays_v1', [])
  out.kahf = Array.isArray(kf) ? new Set(kf).size : 0
  const plan = safeJSON('quran_khatm_plan', {})
  out.khatmPages = Math.min(MUSHAF_PAGES, Math.max(0, Math.floor(Number(plan.done) || 0)))
  const ad = safeJSON(ADHKAR_DONE_KEY, {})
  out.adhkarAny = ad.morning || ad.evening ? 1 : 0
  out.adhkarBoth = ad.morning && ad.morning === ad.evening ? 1 : 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith('qm_celebrated_path_')) out.pathsDone++
    }
  } catch { /* */ }
  return out
}

export function badgeStats() {
  return { ...readAnalytics(), ...extraStats() }
}

/** Rəf üçün tam siyahı. data verilməsə — hesablanır. */
export function badgeList(data = badgeStats(), earned = loadEarned()) {
  return DEFS.map(d => {
    const raw = Number(d.v(data)) || 0
    const at = earned[d.id] || null
    const done = Boolean(at) || raw >= d.goal
    return { id: d.id, icon: d.icon, tier: d.tier, name: BADGE_NAMES[d.id], goal: d.goal, value: done ? d.goal : Math.min(raw, d.goal), done, at }
  })
}

function announce(list) {
  if (!list.length || typeof window === 'undefined') return
  try { window.dispatchEvent(new CustomEvent(BADGE_EVENT, { detail: list })) } catch { /* */ }
}

/**
 * Hesablanan nişanları yoxlayır; ilk dəfə qazanılanları qeyd edib qaytarır.
 * İlk işə salınmada (rəf hələ heç yazılmayıb) köhnə nailiyyətlər səssiz qeyd
 * olunur — istifadəçiyə 10 bildiriş birdən çıxmasın.
 */
export function syncBadges({ silent = false } = {}) {
  if (typeof window === 'undefined') return []
  let first = false
  try { first = localStorage.getItem(BADGE_KEY) == null } catch { return [] }
  const earned = loadEarned()
  const today = localDate()
  const fresh = []
  for (const b of badgeList(badgeStats(), earned)) {
    if (b.done && !earned[b.id]) { earned[b.id] = today; fresh.push(b) }
  }
  if (fresh.length || first) saveEarned(earned)
  if (!first && !silent) announce(fresh)
  return first ? [] : fresh
}

/** Hesablana bilməyən hadisə üçün (məs. qrup xətmi) */
export function grantBadge(id) {
  if (!BADGE_IDS.includes(id)) return
  const earned = loadEarned()
  if (earned[id]) return
  earned[id] = localDate()
  saveEarned(earned)
  announce(badgeList(badgeStats(), earned).filter(b => b.id === id))
}
