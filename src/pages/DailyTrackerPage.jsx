import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import '../styles/DailyTrackerPage.css'
import Breadcrumb from '../components/Breadcrumb'

// ── i18n Labels ──
const LABELS = {
  az: { title:'Gündəlik İbadət', subtitle:'Gündəlik ibadətlərinizi izləyin', today:'Bu gün', streak:'Ardıcıl gün', weekView:'Həftəlik baxış', completed:'Tamamlandı', reset:'Sıfırla', resetConfirm:'Bu günün məlumatlarını sıfırlamaq istəyirsiniz?', percent:'%', noData:'Məlumat yoxdur', groupPrayers:'Namazlar', groupDeeds:'Zikr və əməllər', mon:'B.e', tue:'Ç.a', wed:'Çər', thu:'C.a', fri:'Cümə', sat:'Şən', sun:'Baz' },
  en: { title:'Daily Worship', subtitle:'Track your daily worship activities', today:'Today', streak:'Day streak', weekView:'Weekly view', completed:'Completed', reset:'Reset', resetConfirm:'Reset today\'s data?', percent:'%', noData:'No data', groupPrayers:'Prayers', groupDeeds:'Dhikr & good deeds', mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' },
  ru: { title:'Ежедневные Ибадаты', subtitle:'Отслеживайте ваши ежедневные поклонения', today:'Сегодня', streak:'Дней подряд', weekView:'Неделя', completed:'Завершено', reset:'Сбросить', resetConfirm:'Сбросить данные за сегодня?', percent:'%', noData:'Нет данных', groupPrayers:'Намазы', groupDeeds:'Зикр и благие дела', mon:'Пн', tue:'Вт', wed:'Ср', thu:'Чт', fri:'Пт', sat:'Сб', sun:'Вс' },
  ar: { title:'العبادات اليومية', subtitle:'تتبع عباداتك اليومية', today:'اليوم', streak:'أيام متتالية', weekView:'عرض أسبوعي', completed:'مكتمل', reset:'إعادة تعيين', resetConfirm:'إعادة تعيين بيانات اليوم؟', percent:'٪', noData:'لا توجد بيانات', groupPrayers:'الصلوات', groupDeeds:'الأذكار والأعمال', mon:'إث', tue:'ث', wed:'أر', thu:'خ', fri:'ج', sat:'س', sun:'أح' },
  tr: { title:'Günlük İbadet', subtitle:'Günlük ibadetlerinizi takip edin', today:'Bugün', streak:'Gün serisi', weekView:'Haftalık görünüm', completed:'Tamamlandı', reset:'Sıfırla', resetConfirm:'Bugünün verilerini sıfırlamak istiyor musunuz?', percent:'%', noData:'Veri yok', groupPrayers:'Namazlar', groupDeeds:'Zikir ve ameller', mon:'Pzt', tue:'Sal', wed:'Çar', thu:'Per', fri:'Cum', sat:'Cmt', sun:'Paz' },
}

// tone — telefonda ikon kafelinin rəngi (motion.css → .icon-tile--*); '' = yaşıl
const ACTIVITIES = [
  { key:'fajr', icon:'🌙', tone:'blue', az:'Sübh namazı', en:'Fajr prayer', ru:'Фаджр', ar:'صلاة الفجر', tr:'Sabah namazı' },
  { key:'dhuhr', icon:'☀️', tone:'gold', az:'Zöhr namazı', en:'Dhuhr prayer', ru:'Зухр', ar:'صلاة الظهر', tr:'Öğle namazı' },
  { key:'asr', icon:'🌤️', tone:'teal', az:'Əsr namazı', en:'Asr prayer', ru:'Аср', ar:'صلاة العصر', tr:'İkindi namazı' },
  { key:'maghrib', icon:'🌇', tone:'rose', az:'Məğrib namazı', en:'Maghrib prayer', ru:'Магриб', ar:'صلاة المغرب', tr:'Akşam namazı' },
  { key:'isha', icon:'🌃', tone:'violet', az:'İşa namazı', en:'Isha prayer', ru:'Иша', ar:'صلاة العشاء', tr:'Yatsı namazı' },
  { key:'quran', icon:'📖', tone:'', az:'Quran oxumaq', en:'Read Quran', ru:'Чтение Корана', ar:'قراءة القرآن', tr:'Kuran okumak' },
  { key:'morning', icon:'🌄', tone:'gold', az:'Səhər əzkarları', en:'Morning adhkar', ru:'Утренние азкары', ar:'أذكار الصباح', tr:'Sabah ezkarları' },
  { key:'evening', icon:'🌆', tone:'slate', az:'Axşam əzkarları', en:'Evening adhkar', ru:'Вечерние азкары', ar:'أذكار المساء', tr:'Akşam ezkarları' },
  { key:'dhikr', icon:'📿', tone:'blue', az:'Zikr', en:'Dhikr', ru:'Зикр', ar:'ذكر', tr:'Zikir' },
  { key:'sadaqah', icon:'💚', tone:'teal', az:'Sədəqə', en:'Charity', ru:'Садака', ar:'صدقة', tr:'Sadaka' },
]

// Siyahı iki qrupda göstərilir (telefonda başlıqlı "inset" siyahılar;
// masaüstündə başlıqlar gizlidir və görünüş əvvəlki kimi tək siyahıdır)
const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const GROUPS = [
  { key:'prayers', title:'groupPrayers', items: ACTIVITIES.filter(a => PRAYER_KEYS.includes(a.key)) },
  { key:'deeds',   title:'groupDeeds',   items: ACTIVITIES.filter(a => !PRAYER_KEYS.includes(a.key)) },
]

const STORAGE_KEY = 'daily_tracker'

// /prayer səhifəsinin "Bu Ay Namaz" kartı eyni 5 namazı öz açarında saxlayır
// ('YYYY-MM-DD_Fajr': true). İki səhifə bir-birini görsün deyə bu namazlar
// hər iki yerə yazılır, oxuyanda isə birləşdirilir. Açar adları dəyişmir.
const PRAYER_STATS_KEY = 'muslim_cc_prayer_stats'
const PRAYER_STAT_NAMES = { fajr:'Fajr', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha' }
const PRAYER_SYNC_EVENT = 'qm-prayer-sync' // PrayerPage.jsx ilə eyni ad

// Gün açarı YERLİ tarixlə (toISOString UTC-dir: Bakıda 00:00–03:59 arası
// işarələnən namaz dünənə düşürdü). Format dəyişmir: 'YYYY-MM-DD'.
function getDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    const v = raw ? JSON.parse(raw) : {}
    return v && typeof v === 'object' ? v : {}
  } catch { return {} }
}

/** daily_tracker + /prayer statistikasındakı qılınmış namazlar (birləşmə). */
function loadData() {
  const data = readJSON(STORAGE_KEY)
  const stats = readJSON(PRAYER_STATS_KEY)
  for (const k of Object.keys(stats)) {
    const m = k.match(/^(\d{4}-\d{2}-\d{2})_(Fajr|Dhuhr|Asr|Maghrib|Isha)$/)
    if (!m || !stats[k]) continue
    const act = m[2].toLowerCase()
    data[m[1]] = { ...(data[m[1]] || {}), [act]: true }
  }
  return data
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

/** Namaz işarəsini /prayer statistikasına da yaz və o səhifəyə xəbər ver. */
function syncPrayerStat(dateStr, key, done) {
  const name = PRAYER_STAT_NAMES[key]
  if (!name) return
  try {
    const stats = readJSON(PRAYER_STATS_KEY)
    const k = `${dateStr}_${name}`
    if (done) stats[k] = true
    else delete stats[k]
    localStorage.setItem(PRAYER_STATS_KEY, JSON.stringify(stats))
    window.dispatchEvent(new Event(PRAYER_SYNC_EVENT))
  } catch { /* yaddaş bağlıdır */ }
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

  // /prayer (və ya başqa tab) namazı işarələyəndə yenidən oxu
  useEffect(() => {
    const reload = () => setData(loadData())
    const onStorage = (e) => { if (e.key === PRAYER_STATS_KEY || e.key === STORAGE_KEY) reload() }
    window.addEventListener(PRAYER_SYNC_EVENT, reload)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(PRAYER_SYNC_EVENT, reload)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const todayData = data[today] || {}
  const doneCount = ACTIVITIES.filter(a => todayData[a.key]).length
  const totalCount = ACTIVITIES.length
  const percent = Math.round((doneCount / totalCount) * 100)
  const streak = calcStreak(data)
  const last7 = getLast7Days()

  const toggle = useCallback((key) => {
    haptic() // telefonda yüngül titrəmə (yalnız həqiqi toxunuşda)
    const done = !(data[today] || {})[key]
    // Əvvəl /prayer statistikası (onun hadisəsi loadData ilə yenidən oxuyur),
    // sonra bu səhifənin öz vəziyyəti
    syncPrayerStat(today, key, done)
    setData(prev => ({ ...prev, [today]: { ...(prev[today] || {}), [key]: done } }))
  }, [data, today])

  const resetToday = useCallback(() => {
    if (!window.confirm(t.resetConfirm)) return
    // Bu günün namaz işarələri /prayer statistikasından da silinir
    Object.keys(PRAYER_STAT_NAMES).forEach(k => syncPrayerStat(today, k, false))
    setData(prev => {
      const next = { ...prev }
      delete next[today]
      return next
    })
  }, [today, t.resetConfirm])

  return (
    <>
      <div className="page-hero hero-compact theme-dailytracker">
        <Breadcrumb setPage={setPage} current={t.title} />
        {/* Ərəbcə dekorativ başlıq ar dilində h1-i təkrarlamasın */}
        {lang !== 'ar' && <div className="page-hero-arabic">العبادات اليومية</div>}
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
                {/* key: faiz dəyişəndə rəqəm yüngülcə "sıçrayır" (yalnız transform) */}
                <span className="tracker-circle-pct" key={percent}>{percent}{t.percent}</span>
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

          {/* Bu günün ibadətləri — telefonda iki qruplu "inset" siyahı
              (ikon kafeli + animasiyalı dairəvi işarə), masaüstündə əvvəlki
              ayrı-ayrı sətirlər. Sətirlər növbə ilə görünür (data-reveal). */}
          <div className="tracker-today">
            <div className="tracker-section-header">
              <h2>{t.today}</h2>
              <button type="button" className="btn-ghost tracker-reset" onClick={resetToday}>{t.reset}</button>
            </div>

            <div className="tracker-groups">
              {GROUPS.map(g => (
                <div key={g.key} className="tracker-group">
                  <h3 className="m-list-title tracker-group-title">{t[g.title]}</h3>
                  <ul className="tracker-list m-list" data-reveal="stagger">
                    {g.items.map(act => {
                      const done = !!todayData[act.key]
                      return (
                        <li key={act.key}>
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={done}
                            className={`tracker-item m-row${done ? ' done' : ''}`}
                            onClick={() => toggle(act.key)}
                          >
                            <span className={`tracker-item-icon icon-tile${act.tone ? ` icon-tile--${act.tone}` : ''}`} aria-hidden="true">{act.icon}</span>
                            <span className="tracker-item-label m-row-body">
                              <span className="m-row-title">{act[lang] || act.en}</span>
                            </span>
                            <span className="m-row-trail">
                              <span className="m-check tracker-item-check" aria-hidden="true">
                                <svg viewBox="0 0 24 24"><path d="M6.5 12.5l3.8 3.8L17.5 8.5" /></svg>
                              </span>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly View */}
          <div className="tracker-week">
            <h2>{t.weekView}</h2>
            <div className="tracker-week-grid" data-reveal="stagger">
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
                      {/* Hündürlük transform ilə (scaleY) — layout animasiyası yoxdur */}
                      <div className="tracker-week-bar" style={{ '--p': dayPct / 100 }} />
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
