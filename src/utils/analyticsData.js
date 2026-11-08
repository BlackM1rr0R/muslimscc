// ═══════════════════════════════════════════════════════
// readAnalytics — /analytics səhifəsinin bütün göstəriciləri (yalnız bu cihazın
// localStorage-i). AnalyticsPage və nişanlar (utils/badges) eyni hesabı işlədir.
// Ərəb dili kursunun göstəriciləri burada YOXDUR (progress.js bütün dərsləri gətirir —
// ana səhifədə nişan yoxlaması üçün ağırdır): AnalyticsPage onları özü əlavə edir.
// ═══════════════════════════════════════════════════════
import { SURAH_TABLE } from '../data/mushafIndex.js'


// localStorage oxuması: dəyər gözlənilən formada deyilsə (pozuq JSON, null,
// massiv əvəzinə obyekt …) ehtiyat dəyər qaytarılır — səhifə çökməsin
export function safeJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const v = JSON.parse(raw)
    if (Array.isArray(fallback)) return Array.isArray(v) ? v : fallback
    if (fallback && typeof fallback === 'object') return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback
    return v ?? fallback
  } catch { return fallback }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
// Gün açarı YERLİ tarixlə — digər səhifələr (DailyTracker, Prayer) belə yazır.
// toISOString() UTC-dir: Bakıda 00:00–03:59 arası "bu gün" dünən sayılırdı
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function todayStr() { return localDate() }

function getWeekDates() {
  const d = new Date(); const dates = []
  const day = d.getDay() || 7
  const mon = new Date(d); mon.setDate(d.getDate() - day + 1)
  for (let i = 0; i < 7; i++) {
    const dd = new Date(mon); dd.setDate(mon.getDate() + i)
    dates.push(localDate(dd))
  }
  return dates
}

// Gündəlik izləyicidəki fəaliyyətlərin sayı (DailyTrackerPage.jsx → ACTIVITIES)
const TRACKER_ITEMS = 10
const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

function getMonthPrefix() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function calcStreak(dates) {
  if (!dates || !dates.length) return 0
  const sorted = [...new Set(dates)].sort().reverse()
  let streak = 0; const today = new Date()
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today)
    expected.setDate(today.getDate() - i)
    if (sorted[i] === localDate(expected)) streak++
    else break
  }
  return streak
}

export function calcBestStreak(dates) {
  if (!dates || !dates.length) return 0
  const sorted = [...new Set(dates)].filter(d => DATE_RE.test(d)).sort()
  if (!sorted.length) return 0
  let best = 1, cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diff = (curr - prev) / 86400000
    if (diff === 1) { cur++; if (cur > best) best = cur }
    else cur = 1
  }
  return best
}


export function readAnalytics() {
  // 1. Namaz: /prayer ('muslim_cc_prayer_stats' → { 'YYYY-MM-DD_Fajr': true })
  // və /dailytracker ('daily_tracker' → { 'YYYY-MM-DD': { fajr: true } }) birləşdirilir.
  // Əvvəl mövcud olmayan 'prayer_stats' açarı oxunurdu — namaz sayı həmişə 0 idi
  const dailyTracker = safeJSON('daily_tracker', {})
  const prayerByDate = {}
  const markPrayer = (date, p) => { (prayerByDate[date] ||= new Set()).add(p) }
  for (const [k, v] of Object.entries(safeJSON('muslim_cc_prayer_stats', {}))) {
    const m = /^(\d{4}-\d{2}-\d{2})_(Fajr|Dhuhr|Asr|Maghrib|Isha)$/.exec(k)
    if (m && v) markPrayer(m[1], m[2].toLowerCase())
  }
  for (const [date, day] of Object.entries(dailyTracker)) {
    if (!DATE_RE.test(date) || !day || typeof day !== 'object') continue
    for (const p of PRAYER_NAMES) if (day[p] === true) markPrayer(date, p)
  }
  const prayerDates = Object.keys(prayerByDate)
  let totalPrayers = 0
  let weekPrayers = 0
  let monthPrayers = 0
  const weekDates = getWeekDates()
  const monthPfx = getMonthPrefix()
  const maxDaily = 5

  for (const [date, set] of Object.entries(prayerByDate)) {
    const dayCount = set.size
    totalPrayers += dayCount
    if (weekDates.includes(date)) weekPrayers += dayCount
    if (date.startsWith(monthPfx)) monthPrayers += dayCount
  }
  const prayerRate = prayerDates.length > 0 ? Math.round((totalPrayers / (prayerDates.length * maxDaily)) * 100) : 0
  const prayerStreak = calcBestStreak(prayerDates)

  // 2. Quran stats
  const quranStats = safeJSON('quran_stats', { reads: {}, sessions: 0, dates: [] })
  const quranSessions = Number(quranStats.sessions) || 0
  const quranReads = quranStats.reads && typeof quranStats.reads === 'object' ? quranStats.reads : {}
  const uniqueSurahs = Math.min(114, Object.keys(quranReads).length)
  const quranDates = Array.isArray(quranStats.dates) ? quranStats.dates.filter(d => typeof d === 'string' && DATE_RE.test(d)) : []
  const quranStreak = calcStreak(quranDates)

  // 3. Hifz progress
  const hifzProgress = safeJSON('hifz_progress', {})
  let hifzMemorized = 0, hifzInProgress = 0, hifzNotStarted = 0
  const totalSurahs = 114
  for (const v of Object.values(hifzProgress)) {
    if (v === 2) hifzMemorized++
    else if (v === 1) hifzInProgress++
  }
  hifzMemorized = Math.min(hifzMemorized, totalSurahs)
  hifzInProgress = Math.min(hifzInProgress, totalSurahs - hifzMemorized)
  hifzNotStarted = totalSurahs - hifzMemorized - hifzInProgress

  // 4. Hadith favs
  const hadithFavs = safeJSON('hadith_favs', [])

  // 5. Dua favs
  const duaFavs = safeJSON('dua_favs', [])

  // 6. Dua journal
  const duaJournal = safeJSON('dua_journal', { duas: [] })
  const journalDuas = Array.isArray(duaJournal.duas) ? duaJournal.duas.filter(d => d && typeof d === 'object') : []
  const duaActive = journalDuas.filter(d => !d.answered).length
  const duaAnswered = journalDuas.filter(d => d.answered).length

  // 7. Charity log
  const charityLog = safeJSON('charity_log', []).filter(e => e && typeof e === 'object')
  const totalCharity = charityLog.length
  const totalAmount = charityLog.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const charityDates = charityLog.map(e => e.date).filter(d => typeof d === 'string' && DATE_RE.test(d))
  const charityStreak = calcStreak(charityDates)
  const charityByType = {}
  for (const e of charityLog) {
    const tp = typeof e.type === 'string' && e.type ? e.type : 'other'
    charityByType[tp] = (charityByType[tp] || 0) + 1
  }
  const maxTypeCount = Math.max(1, ...Object.values(charityByType))

  // 8. Gündəlik izləyici — faiz 10 fəaliyyətə görə (əvvəl yalnız saxlanmış
  // açarlara bölünürdü: bir qeyd işarələnən kimi "100%" görünürdü).
  // /prayer-də işarələnən namazlar da sayılır (iki səhifə sinxrondur)
  const doneOn = (date) => {
    const dd = dailyTracker[date] && typeof dailyTracker[date] === 'object' ? dailyTracker[date] : {}
    const keys = new Set(Object.keys(dd).filter(k => dd[k] === true))
    prayerByDate[date]?.forEach(p => keys.add(p))
    return Math.min(TRACKER_ITEMS, keys.size)
  }
  const todayKey = todayStr()
  const todayTotal = TRACKER_ITEMS
  const todayDone = doneOn(todayKey)
  const todayPct = Math.round((todayDone / todayTotal) * 100)

  const weekAvgItems = weekDates.map(wd => doneOn(wd) / TRACKER_ITEMS)
  const weekAvg = Math.round((weekAvgItems.reduce((a, b) => a + b, 0) / 7) * 100)

  // 9. Zikr — /dhikr ömürlük sayğacı 'dhikr_count_total'-a yazır (aşağıdakı
  // 'dhikr_count*' dövrü onu oxuyur); 'dhikr_sessions' köhnə formatdır
  let dhikrTotal = 0
  const dhikrSessions = safeJSON('dhikr_sessions', null)
  if (dhikrSessions && typeof dhikrSessions === 'object') {
    if (Array.isArray(dhikrSessions)) {
      dhikrTotal = dhikrSessions.reduce((s, e) => s + (Number(e?.count) || 0), 0)
    } else {
      dhikrTotal = Object.values(dhikrSessions).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0)
    }
  }
  // also check common dhikr keys
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith('dhikr_count')) {
      dhikrTotal += parseInt(localStorage.getItem(k)) || 0
    }
  }

  // 10. Quiz scores
  // Yalnız rəqəm xallar (obyekt/sətir "[object Object]" kimi görünməsin)
  const numbersOnly = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => Number.isFinite(v)))
  const quizScores = numbersOnly(safeJSON('quiz_scores', {}))
  // Quran müsabiqəsi ilk açılışda { complete: 0, surah: 0 } yazır — 0 xal göstərilmir
  const quranGameScores = Object.fromEntries(Object.entries(numbersOnly(safeJSON('quran_game_scores', {}))).filter(([, v]) => v > 0))

  // Collect all unique dates
  const allDatesSet = new Set()
  prayerDates.forEach(d => allDatesSet.add(d))
  quranDates.forEach(d => allDatesSet.add(d))
  Object.keys(dailyTracker).filter(d => DATE_RE.test(d) && doneOn(d) > 0).forEach(d => allDatesSet.add(d))
  charityDates.filter(d => typeof d === 'string' && DATE_RE.test(d)).forEach(d => allDatesSet.add(d))
  const daysActive = allDatesSet.size

  // Any streak >= 7 or 30
  const allStreaks = [prayerStreak, quranStreak, charityStreak, calcBestStreak(Object.keys(dailyTracker).filter(d => doneOn(d) > 0))]
  const maxStreak = Math.max(0, ...allStreaks)

  // ── v3 qrafikləri üçün ──
  // Namazlar üzrə: hər namaz neçə gün işarələnib
  const perPrayer = PRAYER_NAMES.map(p => Object.values(prayerByDate).filter(set => set.has(p)).length)
  // Günün "çəkisi": izləyici əməlləri (namazlar daxil) + Quran + sədəqə
  const quranDateSet = new Set(quranDates)
  const charityPerDay = {}
  for (const d of charityDates) charityPerDay[d] = (charityPerDay[d] || 0) + 1
  const dayScore = (date) => doneOn(date) + (quranDateSet.has(date) ? 1 : 0) + (charityPerDay[date] || 0)
  const weekPct = weekDates.map(wd => Math.round((doneOn(wd) / TRACKER_ITEMS) * 100))
  // Ən çox oxunan surələr (ilk 5) və açılan surələrdəki ayə sayı
  const topSurahs = Object.entries(quranReads)
    .map(([k, v]) => [Number(k), Number(v) || 0])
    .filter(([k, v]) => k >= 1 && k <= 114 && v > 0)
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 5)
  const ayahsOpened = Object.keys(quranReads).map(Number).filter(k => k >= 1 && k <= 114)
    .reduce((s, k) => s + (SURAH_TABLE[k - 1]?.[2] || 0), 0)

  return {
    perPrayer, dayScore, weekPct, topSurahs, ayahsOpened, weekDates,
    daysActive, totalPrayers, weekPrayers, monthPrayers, prayerRate, prayerStreak,
    quranSessions, uniqueSurahs, quranStreak,
    hifzMemorized, hifzInProgress, hifzNotStarted,
    hadithFavs: Array.isArray(hadithFavs) ? hadithFavs.length : 0, duaFavs: Array.isArray(duaFavs) ? duaFavs.length : 0,
    duaActive, duaAnswered, journalTotal: journalDuas.length,
    quizScores, quranGameScores,
    totalCharity, totalAmount, charityStreak, charityByType, maxTypeCount,
    todayPct, todayDone, todayTotal, weekAvg,
    dhikrTotal, maxStreak,
  }
}
