import { useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/AnalyticsPage.css'

const LABELS = {
  az: { title:'Statistika', subtitle:'Fəaliyyətinizin ümumi icmalı', overview:'Ümumi Baxış', daysActive:'Aktiv gün', prayers:'Namaz', quranSessions:'Quran', favHadiths:'Sevimli hədis', duasSaved:'Dua', charityDeeds:'Sədəqə', prayerStats:'Namaz Statistikası', total:'Ümumi', thisWeek:'Bu həftə', thisMonth:'Bu ay', rate:'Tamamlanma', streak:'Ardıcıl gün', quranStats:'Quran Statistikası', sessions:'Sessiya', surahs:'Surə', hifzProgress:'Hifz İrəliləyişi', memorized:'Əzbər', inProgress:'Davam edir', notStarted:'Başlanmayıb', hadithDua:'Hədis & Dua', favs:'Sevimlilər', duaJournal:'Dua Gündəliyi', active:'Aktiv', answered:'Qəbul olunan', quizScores:'Kviz Xalları', charityStats:'Sədəqə', totalAmount:'Ümumi məbləğ', byType:'Növə görə', dailyTracker:'Gündəlik Tracker', today:'Bu gün', weekAvg:'Həftəlik orta', achievements:'Nailiyyətlər', achieved:'Qazanıldı', locked:'Kilidli', bestScore:'Ən yaxşı', noData:'Hələ məlumat yoxdur. Tətbiqi istifadə etdikcə statistikanız burada görünəcək.' },
  en: { title:'Analytics', subtitle:'Your complete activity summary', overview:'Overview', daysActive:'Days active', prayers:'Prayers', quranSessions:'Quran', favHadiths:'Fav hadiths', duasSaved:'Duas', charityDeeds:'Charity', prayerStats:'Prayer Statistics', total:'Total', thisWeek:'This week', thisMonth:'This month', rate:'Completion', streak:'Day streak', quranStats:'Quran Statistics', sessions:'Sessions', surahs:'Surahs', hifzProgress:'Hifz Progress', memorized:'Memorized', inProgress:'In progress', notStarted:'Not started', hadithDua:'Hadith & Dua', favs:'Favorites', duaJournal:'Dua Journal', active:'Active', answered:'Answered', quizScores:'Quiz Scores', charityStats:'Charity', totalAmount:'Total amount', byType:'By type', dailyTracker:'Daily Tracker', today:'Today', weekAvg:'Week average', achievements:'Achievements', achieved:'Achieved', locked:'Locked', bestScore:'Best', noData:'No data yet. Your statistics will appear here as you use the app.' },
  ru: { title:'Аналитика', subtitle:'Полная сводка вашей активности', overview:'Обзор', daysActive:'Дней активности', prayers:'Намазы', quranSessions:'Коран', favHadiths:'Избранные хадисы', duasSaved:'Дуа', charityDeeds:'Садака', prayerStats:'Статистика намаза', total:'Всего', thisWeek:'Эта неделя', thisMonth:'Этот месяц', rate:'Выполнение', streak:'Дней подряд', quranStats:'Статистика Корана', sessions:'Сессии', surahs:'Суры', hifzProgress:'Прогресс хифза', memorized:'Выучено', inProgress:'В процессе', notStarted:'Не начато', hadithDua:'Хадисы и дуа', favs:'Избранное', duaJournal:'Дневник дуа', active:'Активные', answered:'Отвеченные', quizScores:'Баллы викторины', charityStats:'Садака', totalAmount:'Общая сумма', byType:'По типу', dailyTracker:'Ежедневный трекер', today:'Сегодня', weekAvg:'Среднее за неделю', achievements:'Достижения', achieved:'Получено', locked:'Заблокировано', bestScore:'Лучший', noData:'Пока нет данных. Статистика появится по мере использования.' },
  ar: { title:'الإحصائيات', subtitle:'ملخص نشاطك الكامل', overview:'نظرة عامة', daysActive:'أيام النشاط', prayers:'الصلوات', quranSessions:'القرآن', favHadiths:'أحاديث مفضلة', duasSaved:'أدعية', charityDeeds:'صدقات', prayerStats:'إحصائيات الصلاة', total:'الإجمالي', thisWeek:'هذا الأسبوع', thisMonth:'هذا الشهر', rate:'الإتمام', streak:'أيام متتالية', quranStats:'إحصائيات القرآن', sessions:'جلسات', surahs:'سور', hifzProgress:'تقدم الحفظ', memorized:'محفوظ', inProgress:'قيد التقدم', notStarted:'لم يبدأ', hadithDua:'الحديث والدعاء', favs:'المفضلة', duaJournal:'مذكرة الدعاء', active:'نشط', answered:'مستجاب', quizScores:'نتائج الاختبار', charityStats:'الصدقة', totalAmount:'المبلغ الإجمالي', byType:'حسب النوع', dailyTracker:'المتابعة اليومية', today:'اليوم', weekAvg:'متوسط الأسبوع', achievements:'الإنجازات', achieved:'تم', locked:'مقفل', bestScore:'الأفضل', noData:'لا بيانات بعد. ستظهر إحصائياتك هنا مع الاستخدام.' },
  tr: { title:'İstatistikler', subtitle:'Aktivite özetiniz', overview:'Genel Bakış', daysActive:'Aktif gün', prayers:'Namazlar', quranSessions:'Kuran', favHadiths:'Favori hadisler', duasSaved:'Dualar', charityDeeds:'Sadaka', prayerStats:'Namaz İstatistikleri', total:'Toplam', thisWeek:'Bu hafta', thisMonth:'Bu ay', rate:'Tamamlanma', streak:'Ardışık gün', quranStats:'Kuran İstatistikleri', sessions:'Oturum', surahs:'Sure', hifzProgress:'Hıfz İlerlemesi', memorized:'Ezber', inProgress:'Devam ediyor', notStarted:'Başlanmadı', hadithDua:'Hadis & Dua', favs:'Favoriler', duaJournal:'Dua Günlüğü', active:'Aktif', answered:'Kabul edilen', quizScores:'Quiz Puanları', charityStats:'Sadaka', totalAmount:'Toplam tutar', byType:'Türe göre', dailyTracker:'Günlük Takip', today:'Bugün', weekAvg:'Hafta ortalaması', achievements:'Başarılar', achieved:'Kazanıldı', locked:'Kilitli', bestScore:'En iyi', noData:'Henüz veri yok. İstatistikleriniz kullandıkça görünecek.' },
}

function safeJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function getWeekDates() {
  const d = new Date(); const dates = []
  const day = d.getDay() || 7
  const mon = new Date(d); mon.setDate(d.getDate() - day + 1)
  for (let i = 0; i < 7; i++) {
    const dd = new Date(mon); dd.setDate(mon.getDate() + i)
    dates.push(dd.toISOString().slice(0, 10))
  }
  return dates
}

function getMonthPrefix() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function calcStreak(dates) {
  if (!dates || !dates.length) return 0
  const sorted = [...new Set(dates)].sort().reverse()
  let streak = 0; const today = new Date()
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today)
    expected.setDate(today.getDate() - i)
    if (sorted[i] === expected.toISOString().slice(0, 10)) streak++
    else break
  }
  return streak
}

function calcBestStreak(dates) {
  if (!dates || !dates.length) return 0
  const sorted = [...new Set(dates)].sort()
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

export default function AnalyticsPage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az

  const data = useMemo(() => {
    // 1. Prayer stats
    const prayerStats = safeJSON('prayer_stats', {})
    const prayerDates = Object.keys(prayerStats)
    let totalPrayers = 0
    let weekPrayers = 0
    let monthPrayers = 0
    const weekDates = getWeekDates()
    const monthPfx = getMonthPrefix()
    const maxDaily = 5

    for (const [date, vals] of Object.entries(prayerStats)) {
      const dayCount = Object.values(vals).filter(v => v === 1 || v === true).length
      totalPrayers += dayCount
      if (weekDates.includes(date)) weekPrayers += dayCount
      if (date.startsWith(monthPfx)) monthPrayers += dayCount
    }
    const prayerRate = prayerDates.length > 0 ? Math.round((totalPrayers / (prayerDates.length * maxDaily)) * 100) : 0
    const prayerStreak = calcBestStreak(prayerDates)

    // 2. Quran stats
    const quranStats = safeJSON('quran_stats', { reads: {}, sessions: 0, dates: [] })
    const quranSessions = quranStats.sessions || 0
    const quranReads = quranStats.reads || {}
    const uniqueSurahs = Object.keys(quranReads).length
    const quranDates = quranStats.dates || []
    const quranStreak = calcStreak(quranDates)

    // 3. Hifz progress
    const hifzProgress = safeJSON('hifz_progress', {})
    let hifzMemorized = 0, hifzInProgress = 0, hifzNotStarted = 0
    const totalSurahs = 114
    for (const v of Object.values(hifzProgress)) {
      if (v === 2) hifzMemorized++
      else if (v === 1) hifzInProgress++
    }
    hifzNotStarted = totalSurahs - hifzMemorized - hifzInProgress

    // 4. Hadith favs
    const hadithFavs = safeJSON('hadith_favs', [])

    // 5. Dua favs
    const duaFavs = safeJSON('dua_favs', [])

    // 6. Dua journal
    const duaJournal = safeJSON('dua_journal', { duas: [] })
    const journalDuas = duaJournal.duas || []
    const duaActive = journalDuas.filter(d => !d.answered).length
    const duaAnswered = journalDuas.filter(d => d.answered).length

    // 7. Charity log
    const charityLog = safeJSON('charity_log', [])
    const totalCharity = charityLog.length
    const totalAmount = charityLog.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
    const charityDates = charityLog.map(e => e.date).filter(Boolean)
    const charityStreak = calcStreak(charityDates)
    const charityByType = {}
    for (const e of charityLog) {
      const tp = e.type || 'other'
      charityByType[tp] = (charityByType[tp] || 0) + 1
    }
    const maxTypeCount = Math.max(1, ...Object.values(charityByType))

    // 8. Daily tracker
    const dailyTracker = safeJSON('daily_tracker', {})
    const todayKey = todayStr()
    const todayData = dailyTracker[todayKey] || {}
    const todayItems = Object.values(todayData)
    const todayTotal = todayItems.length
    const todayDone = todayItems.filter(v => v === true).length
    const todayPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0

    const weekAvgItems = weekDates.map(wd => {
      const dd = dailyTracker[wd] || {}
      const items = Object.values(dd)
      return items.length > 0 ? items.filter(v => v === true).length / items.length : 0
    })
    const weekAvg = Math.round((weekAvgItems.reduce((a, b) => a + b, 0) / 7) * 100)

    // 9. Dhikr
    let dhikrTotal = 0
    const dhikrSessions = safeJSON('dhikr_sessions', null)
    if (dhikrSessions && typeof dhikrSessions === 'object') {
      if (Array.isArray(dhikrSessions)) {
        dhikrTotal = dhikrSessions.reduce((s, e) => s + (e.count || 0), 0)
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
    const quizScores = safeJSON('quiz_scores', {})
    const quranGameScores = safeJSON('quran_game_scores', {})

    // Collect all unique dates
    const allDatesSet = new Set()
    prayerDates.forEach(d => allDatesSet.add(d))
    quranDates.forEach(d => allDatesSet.add(d))
    Object.keys(dailyTracker).forEach(d => allDatesSet.add(d))
    charityDates.forEach(d => allDatesSet.add(d))
    const daysActive = allDatesSet.size

    // Any streak >= 7 or 30
    const allStreaks = [prayerStreak, quranStreak, charityStreak, calcBestStreak(Object.keys(dailyTracker))]
    const maxStreak = Math.max(0, ...allStreaks)

    return {
      daysActive, totalPrayers, weekPrayers, monthPrayers, prayerRate, prayerStreak,
      quranSessions, uniqueSurahs, quranStreak,
      hifzMemorized, hifzInProgress, hifzNotStarted,
      hadithFavs: hadithFavs.length, duaFavs: duaFavs.length,
      duaActive, duaAnswered, journalTotal: journalDuas.length,
      quizScores, quranGameScores,
      totalCharity, totalAmount, charityStreak, charityByType, maxTypeCount,
      todayPct, todayDone, todayTotal, weekAvg,
      dhikrTotal, maxStreak,
    }
  }, [])

  const hasData = data.daysActive > 0

  // Achievements
  const achievements = useMemo(() => [
    { icon: '🏅', name: { az:'İlk addım', en:'First step', ru:'Первый шаг', ar:'الخطوة الأولى', tr:'İlk adım' }, check: data.totalPrayers >= 1 },
    { icon: '📖', name: { az:'Quran sevər', en:'Quran lover', ru:'Любитель Корана', ar:'محب القرآن', tr:'Kuran sever' }, check: data.uniqueSurahs >= 10 },
    { icon: '📿', name: { az:'Zikr ustası', en:'Dhikr master', ru:'Мастер зикра', ar:'سيد الذكر', tr:'Zikir ustası' }, check: data.dhikrTotal >= 1000 },
    { icon: '💚', name: { az:'Əliaçıq', en:'Generous', ru:'Щедрый', ar:'كريم', tr:'Cömert' }, check: data.totalCharity >= 10 },
    { icon: '🧠', name: { az:'Alim', en:'Scholar', ru:'Учёный', ar:'عالم', tr:'Âlim' }, check: Object.values(data.quizScores).some(v => v >= 10) },
    { icon: '🌟', name: { az:'Hifz yolçusu', en:'Hifz traveler', ru:'Путник хифза', ar:'مسافر الحفظ', tr:'Hıfz yolcusu' }, check: data.hifzMemorized >= 5 },
    { icon: '📚', name: { az:'Hədis kolleksiyaçısı', en:'Hadith collector', ru:'Коллекционер хадисов', ar:'جامع الأحاديث', tr:'Hadis koleksiyoncusu' }, check: data.hadithFavs >= 20 },
    { icon: '🤲', name: { az:'Dua edən', en:'Supplicator', ru:'Молящийся', ar:'الداعي', tr:'Dua eden' }, check: data.journalTotal >= 10 },
    { icon: '🔥', name: { az:'7 gün ardıcıl', en:'7 day streak', ru:'7 дней подряд', ar:'٧ أيام متتالية', tr:'7 gün ardışık' }, check: data.maxStreak >= 7 },
    { icon: '🏆', name: { az:'Müntəzəm', en:'Consistent', ru:'Постоянный', ar:'مثابر', tr:'Düzenli' }, check: data.maxStreak >= 30 },
  ], [data])

  const achievedCount = achievements.filter(a => a.check).length

  return (
    <div className="analytics-page">
      <div className="page-hero">
        <div className="breadcrumb">
          <button onClick={() => setPage('home')}>🏠</button>
          <span>›</span>
          <span>{t.title}</span>
        </div>
        <h1>📊 {t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner">

          {!hasData && (
            <div className="analytics-nodata">
              <span className="analytics-nodata-icon">📊</span>
              {t.noData}
            </div>
          )}

          {/* ── Overview Cards ── */}
          <div className="analytics-overview">
            {[
              { icon: '📅', value: data.daysActive, label: t.daysActive },
              { icon: '🕌', value: data.totalPrayers, label: t.prayers },
              { icon: '📖', value: data.quranSessions, label: t.quranSessions },
              { icon: '📚', value: data.hadithFavs, label: t.favHadiths },
              { icon: '🤲', value: data.duaFavs, label: t.duasSaved },
              { icon: '💚', value: data.totalCharity, label: t.charityDeeds },
            ].map((c, i) => (
              <div key={i} className={`analytics-ov-card d${i + 1}`} style={{ animationDelay: `${i * 80}ms` }}>
                <div className="analytics-ov-icon">{c.icon}</div>
                <div className="analytics-ov-value">{c.value}</div>
                <div className="analytics-ov-label">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="analytics-sections">

            {/* ── Namaz Statistics ── */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-header-icon">🕌</span>
                <h3>{t.prayerStats}</h3>
              </div>
              <div className="analytics-card-body">
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.total}</span>
                  <span className="analytics-stat-value highlight">{data.totalPrayers}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.thisWeek}</span>
                  <span className="analytics-stat-value">{data.weekPrayers}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.thisMonth}</span>
                  <span className="analytics-stat-value">{data.monthPrayers}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.streak}</span>
                  <span className="analytics-stat-value">{data.prayerStreak} 🔥</span>
                </div>
                <div className="analytics-progress-wrap">
                  <div className="analytics-progress-label">
                    <span>{t.rate}</span>
                    <span>{data.prayerRate}%</span>
                  </div>
                  <div className="analytics-progress-bar">
                    <div className="analytics-progress-fill" style={{ width: `${data.prayerRate}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Quran Statistics ── */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-header-icon">📖</span>
                <h3>{t.quranStats}</h3>
              </div>
              <div className="analytics-card-body">
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.sessions}</span>
                  <span className="analytics-stat-value highlight">{data.quranSessions}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.surahs}</span>
                  <span className="analytics-stat-value">{data.uniqueSurahs} / 114</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.streak}</span>
                  <span className="analytics-stat-value">{data.quranStreak} 🔥</span>
                </div>

                <div className="analytics-progress-wrap">
                  <div className="analytics-progress-label">
                    <span>{t.hifzProgress}</span>
                    <span>{data.hifzMemorized} / 114</span>
                  </div>
                  <div className="analytics-progress-bar">
                    <div className="analytics-progress-fill" style={{ width: `${Math.round((data.hifzMemorized / 114) * 100)}%` }} />
                  </div>
                </div>

                <div className="analytics-hifz-bars">
                  <div className="analytics-hifz-item">
                    <span className="analytics-hifz-dot memorized" />
                    <span className="analytics-hifz-label">{t.memorized}</span>
                    <span className="analytics-hifz-count">{data.hifzMemorized}</span>
                  </div>
                  <div className="analytics-hifz-item">
                    <span className="analytics-hifz-dot in-progress" />
                    <span className="analytics-hifz-label">{t.inProgress}</span>
                    <span className="analytics-hifz-count">{data.hifzInProgress}</span>
                  </div>
                  <div className="analytics-hifz-item">
                    <span className="analytics-hifz-dot not-started" />
                    <span className="analytics-hifz-label">{t.notStarted}</span>
                    <span className="analytics-hifz-count">{data.hifzNotStarted}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Hadith & Dua ── */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-header-icon">📚</span>
                <h3>{t.hadithDua}</h3>
              </div>
              <div className="analytics-card-body">
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.favHadiths}</span>
                  <span className="analytics-stat-value highlight">{data.hadithFavs}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.duasSaved}</span>
                  <span className="analytics-stat-value">{data.duaFavs}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.duaJournal} — {t.active}</span>
                  <span className="analytics-stat-value">{data.duaActive}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.duaJournal} — {t.answered}</span>
                  <span className="analytics-stat-value">{data.duaAnswered}</span>
                </div>
                {Object.keys(data.quizScores).length > 0 && (
                  <>
                    <div style={{ marginTop: 12, marginBottom: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-dim)' }}>{t.quizScores}</div>
                    {Object.entries(data.quizScores).map(([k, v]) => (
                      <div className="analytics-stat-row" key={k}>
                        <span className="analytics-stat-label">{k}</span>
                        <span className="analytics-stat-value">{t.bestScore}: {v}</span>
                      </div>
                    ))}
                  </>
                )}
                {Object.keys(data.quranGameScores).length > 0 && (
                  <>
                    {Object.entries(data.quranGameScores).map(([k, v]) => (
                      <div className="analytics-stat-row" key={`qg-${k}`}>
                        <span className="analytics-stat-label">Quran Game — {k}</span>
                        <span className="analytics-stat-value">{t.bestScore}: {v}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* ── Charity ── */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-header-icon">💚</span>
                <h3>{t.charityStats}</h3>
              </div>
              <div className="analytics-card-body">
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.total}</span>
                  <span className="analytics-stat-value highlight">{data.totalCharity}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.totalAmount}</span>
                  <span className="analytics-stat-value">{data.totalAmount.toFixed(2)}</span>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.streak}</span>
                  <span className="analytics-stat-value">{data.charityStreak} 🔥</span>
                </div>

                {Object.keys(data.charityByType).length > 0 && (
                  <>
                    <div style={{ marginTop: 12, marginBottom: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-dim)' }}>{t.byType}</div>
                    <div className="analytics-bar-chart">
                      {Object.entries(data.charityByType).map(([type, count]) => (
                        <div className="analytics-bar-item" key={type}>
                          <span className="analytics-bar-label">{type}</span>
                          <div className="analytics-bar-track">
                            <div className="analytics-bar-fill" style={{ width: `${Math.round((count / data.maxTypeCount) * 100)}%` }}>
                              {count}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Daily Tracker ── */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-header-icon">📋</span>
                <h3>{t.dailyTracker}</h3>
              </div>
              <div className="analytics-card-body">
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.today}</span>
                  <span className="analytics-stat-value highlight">{data.todayPct}%</span>
                </div>
                <div className="analytics-progress-wrap">
                  <div className="analytics-progress-label">
                    <span>{data.todayDone} / {data.todayTotal}</span>
                    <span>{data.todayPct}%</span>
                  </div>
                  <div className="analytics-progress-bar">
                    <div className="analytics-progress-fill" style={{ width: `${data.todayPct}%` }} />
                  </div>
                </div>
                <div className="analytics-stat-row">
                  <span className="analytics-stat-label">{t.weekAvg}</span>
                  <span className="analytics-stat-value">{data.weekAvg}%</span>
                </div>
                <div className="analytics-progress-wrap">
                  <div className="analytics-progress-bar">
                    <div className="analytics-progress-fill" style={{ width: `${data.weekAvg}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Achievements ── */}
            <div className="analytics-card full-width">
              <div className="analytics-card-header">
                <span className="analytics-card-header-icon">🏆</span>
                <h3>{t.achievements} ({achievedCount}/{achievements.length})</h3>
              </div>
              <div className="analytics-card-body">
                <div className="analytics-achievements">
                  {achievements.map((a, i) => (
                    <div key={i} className={`analytics-badge ${a.check ? 'achieved' : 'locked'}`}>
                      <div className="analytics-badge-icon">{a.icon}</div>
                      <span className="analytics-badge-name">{a.name[lang] || a.name.az}</span>
                      <span className="analytics-badge-status">{a.check ? t.achieved : t.locked}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
