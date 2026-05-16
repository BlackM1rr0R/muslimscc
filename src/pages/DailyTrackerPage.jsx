import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/DailyTrackerPage.css'

// ── i18n Labels ──
const LABELS = {
  az: { title:'Gündəlik İbadət', subtitle:'Gündəlik ibadətlərinizi izləyin', today:'Bu gün', streak:'Ardıcıl gün', weekView:'Həftəlik baxış', completed:'Tamamlandı', reset:'Sıfırla', resetConfirm:'Bu günün məlumatlarını sıfırlamaq istəyirsiniz?', percent:'%', noData:'Məlumat yoxdur', mon:'B.e', tue:'Ç.a', wed:'Ç.', thu:'C.a', fri:'C.', sat:'Ş.', sun:'B.' },
  en: { title:'Daily Worship', subtitle:'Track your daily worship activities', today:'Today', streak:'Day streak', weekView:'Weekly view', completed:'Completed', reset:'Reset', resetConfirm:'Reset today\'s data?', percent:'%', noData:'No data', mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' },
  ru: { title:'Ежедневные Ибадаты', subtitle:'Отслеживайте ваши ежедневные поклонения', today:'Сегодня', streak:'Дней подряд', weekView:'Неделя', completed:'Завершено', reset:'Сбросить', resetConfirm:'Сбросить данные за сегодня?', percent:'%', noData:'Нет данных', mon:'Пн', tue:'Вт', wed:'Ср', thu:'Чт', fri:'Пт', sat:'Сб', sun:'Вс' },
  ar: { title:'العبادات اليومية', subtitle:'تتبع عباداتك اليومية', today:'اليوم', streak:'أيام متتالية', weekView:'عرض أسبوعي', completed:'مكتمل', reset:'إعادة تعيين', resetConfirm:'إعادة تعيين بيانات اليوم؟', percent:'٪', noData:'لا توجد بيانات', mon:'إث', tue:'ث', wed:'أر', thu:'خ', fri:'ج', sat:'س', sun:'أح' },
  tr: { title:'Günlük İbadet', subtitle:'Günlük ibadetlerinizi takip edin', today:'Bugün', streak:'Gün serisi', weekView:'Haftalık görünüm', completed:'Tamamlandı', reset:'Sıfırla', resetConfirm:'Bugünün verilerini sıfırlamak istiyor musunuz?', percent:'%', noData:'Veri yok', mon:'Pzt', tue:'Sal', wed:'Çar', thu:'Per', fri:'Cum', sat:'Cmt', sun:'Paz' },
}

const ACTIVITIES = [
  { key:'fajr', icon:'🌅', az:'Sübh namazı', en:'Fajr prayer', ru:'Фаджр', ar:'صلاة الفجر', tr:'Sabah namazı' },
  { key:'dhuhr', icon:'☀️', az:'Zöhr namazı', en:'Dhuhr prayer', ru:'Зухр', ar:'صلاة الظهر', tr:'Öğle namazı' },
  { key:'asr', icon:'🌤️', az:'Əsr namazı', en:'Asr prayer', ru:'Аср', ar:'صلاة العصر', tr:'İkindi namazı' },
  { key:'maghrib', icon:'🌅', az:'Məğrib namazı', en:'Maghrib prayer', ru:'Магриб', ar:'صلاة المغرب', tr:'Akşam namazı' },
  { key:'isha', icon:'🌙', az:'İşa namazı', en:'Isha prayer', ru:'Иша', ar:'صلاة العشاء', tr:'Yatsı namazı' },
  { key:'quran', icon:'📖', az:'Quran oxumaq', en:'Read Quran', ru:'Чтение Корана', ar:'قراءة القرآن', tr:'Kuran okumak' },
  { key:'morning', icon:'🌄', az:'Səhər əzkarları', en:'Morning adhkar', ru:'Утренние азкары', ar:'أذكار الصباح', tr:'Sabah ezkarları' },
  { key:'evening', icon:'🌆', az:'Axşam əzkarları', en:'Evening adhkar', ru:'Вечерние азкары', ar:'أذكار المساء', tr:'Akşam ezkarları' },
  { key:'dhikr', icon:'📿', az:'Zikr', en:'Dhikr', ru:'Зикр', ar:'ذكر', tr:'Zikir' },
  { key:'sadaqah', icon:'💚', az:'Sədəqə', en:'Charity', ru:'Садака', ar:'صدقة', tr:'Sadaka' },
]

const STORAGE_KEY = 'daily_tracker'

function getDateStr(d = new Date()) {
  return d.toISOString().split('T')[0]
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(getDateStr(d))
  }
  return days
}

function getDayLabel(dateStr, t) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  const labels = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat]
  return labels[day]
}

function calcStreak(data) {
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = getDateStr(d)
    const dayData = data[key]
    if (!dayData) break
    const allDone = ACTIVITIES.every(a => dayData[a.key])
    if (allDone) streak++
    else if (i > 0) break // today can be incomplete, only break for past days
    else break
  }
  return streak
}

const CIRC = 2 * Math.PI * 54

export default function DailyTrackerPage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.az
  const today = getDateStr()

  const [data, setData] = useState(loadData)

  useEffect(() => { saveData(data) }, [data])

  const todayData = data[today] || {}
  const doneCount = ACTIVITIES.filter(a => todayData[a.key]).length
  const totalCount = ACTIVITIES.length
  const percent = Math.round((doneCount / totalCount) * 100)
  const streak = calcStreak(data)
  const last7 = getLast7Days()

  const toggle = useCallback((key) => {
    setData(prev => {
      const dayData = { ...(prev[today] || {}) }
      dayData[key] = !dayData[key]
      return { ...prev, [today]: dayData }
    })
  }, [today])

  const resetToday = useCallback(() => {
    if (!window.confirm(t.resetConfirm)) return
    setData(prev => {
      const next = { ...prev }
      delete next[today]
      return next
    })
  }, [today, t.resetConfirm])

  return (
    <>
      <div className="page-hero theme-dailytracker">
        <div className="breadcrumb">
          <button onClick={() => setPage('home')}>Muslims.cc</button>
          <span>/</span>
          <span>{t.title}</span>
        </div>
        <div className="page-hero-arabic">العبادات اليومية</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner tracker-layout">

          {/* Circular Progress */}
          <div className="tracker-progress-section anim-fadeUp">
            <div className="tracker-circle-wrap">
              <svg className="tracker-circle" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="var(--surface)" strokeWidth="8" />
                <circle cx="60" cy="60" r="54" fill="none"
                  stroke={percent === 100 ? 'var(--success)' : 'var(--primary)'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC - (CIRC * percent / 100)}
                  className="tracker-circle-progress"
                />
              </svg>
              <div className="tracker-circle-text">
                <span className="tracker-circle-pct">{percent}{t.percent}</span>
                <span className="tracker-circle-label">{doneCount}/{totalCount}</span>
              </div>
            </div>

            <div className="tracker-stats">
              <div className="tracker-stat">
                <span className="tracker-stat-value">{streak}</span>
                <span className="tracker-stat-label">{t.streak}</span>
              </div>
              <div className="tracker-stat">
                <span className="tracker-stat-value">{doneCount}</span>
                <span className="tracker-stat-label">{t.completed}</span>
              </div>
            </div>
          </div>

          {/* Today's Activities */}
          <div className="tracker-today anim-fadeUp d2">
            <div className="tracker-section-header">
              <h2>{t.today}</h2>
              <button className="btn-ghost" onClick={resetToday}>{t.reset}</button>
            </div>

            <div className="tracker-list">
              {ACTIVITIES.map((act, i) => {
                const done = !!todayData[act.key]
                return (
                  <button
                    key={act.key}
                    className={`tracker-item ${done ? 'done' : ''}`}
                    onClick={() => toggle(act.key)}
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <span className="tracker-item-icon">{act.icon}</span>
                    <span className="tracker-item-label">{act[lang] || act.en}</span>
                    <span className={`tracker-item-check ${done ? 'checked' : ''}`}>
                      {done ? '✓' : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Weekly View */}
          <div className="tracker-week anim-fadeUp d3">
            <h2>{t.weekView}</h2>
            <div className="tracker-week-grid">
              {last7.map(dateStr => {
                const dayData = data[dateStr] || {}
                const dayDone = ACTIVITIES.filter(a => dayData[a.key]).length
                const dayPct = Math.round((dayDone / totalCount) * 100)
                const isToday = dateStr === today
                const dayNum = dateStr.split('-')[2]
                return (
                  <div key={dateStr} className={`tracker-week-day ${isToday ? 'today' : ''} ${dayPct === 100 ? 'complete' : ''}`}>
                    <span className="tracker-week-label">{getDayLabel(dateStr, t)}</span>
                    <span className="tracker-week-num">{dayNum}</span>
                    <div className="tracker-week-bar-wrap">
                      <div className="tracker-week-bar" style={{ height: `${dayPct}%` }} />
                    </div>
                    <span className="tracker-week-pct">{dayPct > 0 ? `${dayPct}%` : '-'}</span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
