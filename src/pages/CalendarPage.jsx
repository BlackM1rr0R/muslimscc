import { useState, useMemo, useEffect, useCallback } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import '../styles/CalendarPage.css'

// ── Gregorian → Hicri çevirmə (Kuwaiti alqoritmi) ──
function gregorianToHijri(gDate) {
  const gy = gDate.getFullYear()
  const gm = gDate.getMonth() + 1
  const gd = gDate.getDate()

  let jd = Math.floor((11 * gy + 3) / 30) + 354 * gy + 30 * gm
    - Math.floor((gm - 1) / 2) + gd + 1948440 - 385

  if (gm <= 2) {
    jd -= Math.floor((gy - 1) / 4) - Math.floor((gy - 1) / 100) + Math.floor((gy - 1) / 400)
  } else {
    jd -= Math.floor(gy / 4) - Math.floor(gy / 100) + Math.floor(gy / 400)
  }

  // Julian Day → Gregorian JD
  const a = Math.floor((14 - gm) / 12)
  const y = gy + 4800 - a
  const m = gm + 12 * a - 3
  const julianDay = gd + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045

  // Julian Day → Hicri
  const l = julianDay - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  const l2 = l - 10631 * n + 354
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
    + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238)
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29
  const hm = Math.floor((24 * l3) / 709)
  const hd = l3 - Math.floor((709 * hm) / 24)
  const hy = 30 * n + j - 30

  return { year: hy, month: hm, day: hd }
}

const HIJRI_MONTHS = {
  az: ['Məhərrəm','Səfər','Rəbiül-Əvvəl','Rəbiül-Axir','Cəmadiyül-Əvvəl','Cəmadiyül-Axir','Rəcəb','Şaban','Ramazan','Şəvval','Zülqədə','Zülhiccə'],
  en: ['Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Ula','Jumada al-Thani','Rajab','Shaban','Ramadan','Shawwal','Dhu al-Qadah','Dhu al-Hijjah'],
  ru: ['Мухаррам','Сафар','Раби аль-Авваль','Раби ас-Сани','Джумада аль-Уля','Джумада ас-Сани','Раджаб','Шабан','Рамадан','Шавваль','Зуль-Каада','Зуль-Хиджа'],
  ar: ['مُحَرَّم','صَفَر','رَبِيع الأَوَّل','رَبِيع الثَّانِي','جُمَادَى الأُولَى','جُمَادَى الآخِرَة','رَجَب','شَعْبَان','رَمَضَان','شَوَّال','ذُو القَعْدَة','ذُو الحِجَّة'],
  tr: ['Muharrem','Safer','Rebiülevvel','Rebiülahir','Cemaziyelevvel','Cemaziyelahir','Recep','Şaban','Ramazan','Şevval','Zilkade','Zilhicce'],
}

const EVENTS = [
  { month:0, day:1,  en:'Islamic New Year 1447 AH',         az:'İslam Yeni İli 1447 H',          ru:'Исламский Новый Год 1447 г.х.', ar:'رأس السنة الهجرية ١٤٤٧', tr:'İslam Yılbaşı 1447 H', icon:'🌙', type:'major' },
  { month:0, day:9,  en:'Tasu\'a (9th Muharram)',           az:'Tasua (9 Məhərrəm)',             ru:'Тасуа (9 Мухаррам)',            ar:'تاسوعاء',                  tr:'Taşua (9 Muharrem)',     icon:'📿', type:'sunnah' },
  { month:0, day:10, en:'Day of Ashura',                     az:'Aşura Günü',                     ru:'День Ашура',                     ar:'يوم عاشوراء',              tr:'Aşure Günü',            icon:'⭐', type:'major' },
  { month:1, day:1,  en:'First of Safar',                    az:'Səfər ayının başlanğıcı',        ru:'Начало месяца Сафар',           ar:'غرة صفر',                  tr:'Safer ayı başlangıcı',  icon:'📅', type:'month' },
  { month:2, day:1,  en:'First of Rabi al-Awwal',           az:'Rəbiül-Əvvəl başlanğıcı',       ru:'Начало Раби аль-Авваль',        ar:'غرة ربيع الأول',           tr:'Rebiülevvel başlangıcı', icon:'📅', type:'month' },
  { month:2, day:12, en:'Mawlid al-Nabi ﷺ',                 az:'Mövlud Bayramı',                 ru:'Мавлид ан-Наби ﷺ',             ar:'المولد النبوي الشريف ﷺ',   tr:'Mevlid Kandili',        icon:'🌸', type:'major' },
  { month:5, day:1,  en:'First of Jumada al-Thani',         az:'Cəmadiyül-Axir başlanğıcı',     ru:'Начало Джумада ас-Сани',        ar:'غرة جمادى الآخرة',         tr:'Cemaziyelahir başlangıcı', icon:'📅', type:'month' },
  { month:6, day:1,  en:'First of Rajab',                    az:'Rəcəb ayının başlanğıcı',        ru:'Начало месяца Раджаб',          ar:'غرة رجب',                  tr:'Recep ayı başlangıcı',  icon:'🌙', type:'month' },
  { month:6, day:13, en:'Birth of Imam Ali (a.s.)',          az:'İmam Əlinin doğum günü',        ru:'Рождение Имама Али',            ar:'ولادة الإمام علي',          tr:'İmam Ali doğum günü',   icon:'🌟', type:'minor' },
  { month:6, day:27, en:'Laylat al-Miraj',                   az:'Merac Gecəsi',                   ru:'Лейлят аль-Мирадж',            ar:'ليلة الإسراء والمعراج',    tr:'Miraç Kandili',         icon:'✨', type:'night' },
  { month:7, day:1,  en:'First of Shaban',                   az:'Şaban ayının başlanğıcı',        ru:'Начало месяца Шабан',           ar:'غرة شعبان',                tr:'Şaban ayı başlangıcı',  icon:'🌙', type:'month' },
  { month:7, day:15, en:'Laylat al-Baraat',                  az:'Bərat Gecəsi',                   ru:'Лейлят аль-Бараат',            ar:'ليلة البراءة',             tr:'Berat Kandili',         icon:'💫', type:'night' },
  { month:8, day:1,  en:'First Day of Ramadan',              az:'Ramazanın Birinci Günü',         ru:'Первый день Рамадана',          ar:'أول رمضان',                tr:'Ramazan Başlangıcı',    icon:'🌙', type:'major' },
  { month:8, day:15, en:'Mid-Ramadan',                       az:'Ramazanın ortası',               ru:'Середина Рамадана',             ar:'نصف رمضان',                tr:'Ramazan ortası',        icon:'📿', type:'minor' },
  { month:8, day:21, en:'Laylat al-Qadr (estimated)',        az:'Qədr Gecəsi (təxmini)',          ru:'Лейлят аль-Кадр (примерно)',   ar:'ليلة القدر (تقديرية)',     tr:'Kadir Gecesi (tahmini)', icon:'💎', type:'night' },
  { month:8, day:23, en:'Laylat al-Qadr (estimated)',        az:'Qədr Gecəsi (təxmini)',          ru:'Лейлят аль-Кадр (примерно)',   ar:'ليلة القدر (تقديرية)',     tr:'Kadir Gecesi (tahmini)', icon:'💎', type:'night' },
  { month:8, day:25, en:'Laylat al-Qadr (estimated)',        az:'Qədr Gecəsi (təxmini)',          ru:'Лейлят аль-Кадр (примерно)',   ar:'ليلة القدر (تقديرية)',     tr:'Kadir Gecesi (tahmini)', icon:'💎', type:'night' },
  { month:8, day:27, en:'Laylat al-Qadr (most likely)',      az:'Qədr Gecəsi (ən ehtimallı)',     ru:'Лейлят аль-Кадр (наиболее вероятно)', ar:'ليلة القدر (الأرجح)', tr:'Kadir Gecesi (en muhtemel)', icon:'💎', type:'night' },
  { month:8, day:29, en:'Laylat al-Qadr (estimated)',        az:'Qədr Gecəsi (təxmini)',          ru:'Лейлят аль-Кадр (примерно)',   ar:'ليلة القدر (تقديرية)',     tr:'Kadir Gecesi (tahmini)', icon:'💎', type:'night' },
  { month:9, day:1,  en:'Eid al-Fitr',                       az:'Ramazan Bayramı',                ru:'Праздник Разговения',           ar:'عيد الفطر',                tr:'Ramazan Bayramı',       icon:'🎉', type:'major' },
  { month:9, day:2,  en:'Eid al-Fitr (Day 2)',               az:'Ramazan Bayramı (2-ci gün)',     ru:'Ид аль-Фитр (день 2)',         ar:'عيد الفطر (اليوم ٢)',      tr:'Ramazan Bayramı (2. gün)', icon:'🎉', type:'major' },
  { month:9, day:3,  en:'Eid al-Fitr (Day 3)',               az:'Ramazan Bayramı (3-cü gün)',     ru:'Ид аль-Фитр (день 3)',         ar:'عيد الفطر (اليوم ٣)',      tr:'Ramazan Bayramı (3. gün)', icon:'🎉', type:'major' },
  { month:9, day:6,  en:'Fasting 6 Days of Shawwal begins',  az:'Şəvval orucunun başlanğıcı',    ru:'Пост 6 дней Шавваля',          ar:'بدء صيام ست من شوال',      tr:'Şevval orucunun başlangıcı', icon:'📿', type:'sunnah' },
  { month:11,day:1,  en:'First of Dhu al-Hijjah',            az:'Zülhiccə ayının başlanğıcı',     ru:'Начало Зуль-Хиджа',            ar:'غرة ذو الحجة',             tr:'Zilhicce ayı başlangıcı', icon:'🕌', type:'month' },
  { month:11,day:8,  en:'Day of Tarwiyah',                   az:'Tərviyə Günü',                   ru:'День Тарвия',                   ar:'يوم التروية',              tr:'Terviye Günü',          icon:'🕌', type:'hajj' },
  { month:11,day:9,  en:'Day of Arafah',                     az:'Ərəfə Günü',                     ru:'День Арафа',                    ar:'يوم عرفة',                 tr:'Arefe Günü',            icon:'🕌', type:'major' },
  { month:11,day:10, en:'Eid al-Adha',                       az:'Qurban Bayramı',                 ru:'Праздник Жертвоприношения',     ar:'عيد الأضحى',               tr:'Kurban Bayramı',        icon:'🐑', type:'major' },
  { month:11,day:11, en:'Days of Tashreeq (1)',              az:'Təşriq günləri (1)',              ru:'Дни Ташрика (1)',               ar:'أيام التشريق (١)',          tr:'Teşrik günleri (1)',     icon:'🐑', type:'hajj' },
  { month:11,day:12, en:'Days of Tashreeq (2)',              az:'Təşriq günləri (2)',              ru:'Дни Ташрика (2)',               ar:'أيام التشريق (٢)',          tr:'Teşrik günleri (2)',     icon:'🐑', type:'hajj' },
  { month:11,day:13, en:'Days of Tashreeq (3)',              az:'Təşriq günləri (3)',              ru:'Дни Ташрика (3)',               ar:'أيام التشريق (٣)',          tr:'Teşrik günleri (3)',     icon:'🐑', type:'hajj' },
]

const NOTIFY_LABELS = {
  az: { remind:'Xatırlat', reminded:'Xatırladılacaq', today:'Bu gün!', upcoming:'Yaxınlaşır', removeReminder:'Ləğv et' },
  en: { remind:'Remind me', reminded:'Reminder set', today:'Today!', upcoming:'Upcoming', removeReminder:'Remove' },
  ru: { remind:'Напомнить', reminded:'Напоминание установлено', today:'Сегодня!', upcoming:'Скоро', removeReminder:'Удалить' },
  ar: { remind:'ذكرني', reminded:'تم التذكير', today:'اليوم!', upcoming:'قادم', removeReminder:'إلغاء' },
  tr: { remind:'Hatırlat', reminded:'Hatırlatma ayarlandı', today:'Bugün!', upcoming:'Yaklaşıyor', removeReminder:'Kaldır' },
}

export function CalendarPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.calendar || T.az.calendar
  const [selMonth, setSelMonth] = useState(new Date().getMonth())
  const [reminders, setReminders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('calendar_reminders')) || [] } catch { return [] }
  })
  const nl = NOTIFY_LABELS[lang] || NOTIFY_LABELS.en

  const toggleReminder = useCallback((e) => {
    const key = `${e.month}-${e.day}`
    setReminders(prev => {
      const exists = prev.some(r => r.key === key)
      let next
      if (exists) {
        next = prev.filter(r => r.key !== key)
      } else {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          Notification.requestPermission()
        }
        next = [...prev, { key, month: e.month, day: e.day, name: e[lang] || e.en }]
      }
      localStorage.setItem('calendar_reminders', JSON.stringify(next))
      return next
    })
  }, [lang])

  const isReminded = useCallback((e) => {
    const key = `${e.month}-${e.day}`
    return reminders.some(r => r.key === key)
  }, [reminders])

  // Check for today's reminders and show notifications
  useEffect(() => {
    if (reminders.length === 0) return
    const today = new Date()
    const hijriToday = gregorianToHijri(today)
    reminders.forEach(r => {
      // month in EVENTS is 0-indexed, hijri.month is 1-indexed
      if (r.month === (hijriToday.month - 1) && r.day === hijriToday.day) {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(r.name, { body: nl.today, icon: '🕌' })
        }
      }
    })
  }, []) // only on mount

  const [typeFilter, setTypeFilter] = useState('all')
  const today = new Date()
  const hijri = useMemo(() => gregorianToHijri(today), [today.toDateString()])
  const hijriMonthNames = HIJRI_MONTHS[lang] || HIJRI_MONTHS.en
  const hijriStr = `${hijri.day} ${hijriMonthNames[hijri.month - 1]} ${hijri.year}`

  // Növbəti hadisəyə geri sayım
  const nextEvent = useMemo(() => {
    const hm = hijri.month - 1
    const hd = hijri.day
    for (const e of EVENTS) {
      if (e.month > hm || (e.month === hm && e.day > hd)) return e
    }
    return EVENTS[0] // növbəti il
  }, [hijri])

  const monthEvents = EVENTS.filter(e => e.month === selMonth && (typeFilter === 'all' || e.type === typeFilter))

  const TYPE_LABELS = {
    all:    { az:'Hamısı',     en:'All',        ru:'Все',       ar:'الكل',     tr:'Tümü' },
    major:  { az:'Əsas',       en:'Major',      ru:'Основные',  ar:'رئيسية',   tr:'Büyük' },
    night:  { az:'Gecələr',    en:'Nights',     ru:'Ночи',      ar:'ليالي',    tr:'Geceler' },
    sunnah: { az:'Sünnə',      en:'Sunnah',     ru:'Сунна',     ar:'سنة',      tr:'Sünnet' },
    hajj:   { az:'Həcc',       en:'Hajj',       ru:'Хадж',      ar:'حج',       tr:'Hac' },
  }
  const tl = lang && TYPE_LABELS.all[lang] ? lang : 'en'

  return (
    <>
      <div className="page-hero theme-calendar">
        <div className="page-hero-arabic">التَّقۡوِيمُ ٱلۡإِسۡلَامِيّ</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner">
          {/* Current date card */}
          <div className="cal-date-card">
            <div className="cal-date-item">
              <span className="cal-date-label">{t.hijriDate}</span>
              <span className="cal-date-val">{hijriStr}</span>
            </div>
            <div className="cal-date-divider" />
            <div className="cal-date-item">
              <span className="cal-date-label">{t.gregorianDate}</span>
              <span className="cal-date-val">{today.toLocaleDateString(lang==='ar'?'ar-SA':lang==='ru'?'ru-RU':lang==='tr'?'tr-TR':'az-AZ',{day:'numeric',month:'long',year:'numeric'})}</span>
            </div>
          </div>

          {/* Növbəti hadisə */}
          {nextEvent && (
            <div className="cal-next-event">
              <span className="cal-next-icon">{nextEvent.icon}</span>
              <div className="cal-next-info">
                <div className="cal-next-label">{lang==='az'?'Növbəti hadisə':lang==='ru'?'Следующее событие':lang==='ar'?'الحدث التالي':lang==='tr'?'Sonraki olay':'Next event'}</div>
                <div className="cal-next-name">{nextEvent[lang] || nextEvent.en}</div>
                <div className="cal-next-date">{hijriMonthNames[nextEvent.month]} {nextEvent.day}</div>
              </div>
            </div>
          )}

          {/* Type filter */}
          <div className="cal-type-filter">
            {Object.keys(TYPE_LABELS).map(k => (
              <button key={k} className={`tag-btn ${typeFilter === k ? 'active' : ''}`} onClick={() => setTypeFilter(k)}>
                {TYPE_LABELS[k][tl]}
              </button>
            ))}
          </div>

          {/* Month tabs */}
          <div className="cal-months">
            {t.months.map((m, i) => {
              const hasEvent = EVENTS.some(e => e.month === i)
              return (
                <button key={i} className={`cal-month-btn ${selMonth===i?'active':''}`} onClick={() => setSelMonth(i)}>
                  {m}
                  {hasEvent && <span className="cal-event-dot" />}
                </button>
              )
            })}
          </div>

          <div className="cal-main">
            <div className="cal-selected-month">
              <h2>{t.months[selMonth]}</h2>
              <span className="cal-month-num">{selMonth + 1} / 12</span>
            </div>

            {monthEvents.length > 0 ? (
              <div className="cal-events">
                <div className="cal-events-label">{t.events}</div>
                {monthEvents.map((e, i) => {
                  const reminded = isReminded(e)
                  return (
                    <div key={i} className="cal-event-card anim-fadeIn">
                      <span className="cal-event-icon">{e.icon}</span>
                      <div className="cal-event-body">
                        <div className="cal-event-name">{e[lang] || e.en}</div>
                        <div className="cal-event-date">{t.months[e.month]} {e.day}</div>
                      </div>
                      <button className={`cal-remind-btn ${reminded ? 'active' : ''}`} onClick={() => toggleReminder(e)}>
                        {reminded ? '🔔' : '🔕'}
                        <span>{reminded ? nl.reminded : nl.remind}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="cal-no-events">{t.noEvents}</div>
            )}
          </div>

          {/* All events list */}
          <div className="cal-all-events">
            <div className="section-header" style={{marginBottom:24}}>
              <div className="section-eyebrow">{hijri.year} AH</div>
              <h2 className="section-title" style={{fontSize:24}}>
                {lang==='az'?'Bütün Hadisələr': lang==='ru'?'Все события': lang==='ar'?'جميع الأحداث': lang==='tr'?'Tüm Olaylar':'All Events'}
              </h2>
            </div>
            <div className="cal-timeline">
              {EVENTS.map((e, i) => {
                const reminded = isReminded(e)
                return (
                  <div key={i} className="cal-timeline-item">
                    <div className="cal-tl-icon">{e.icon}</div>
                    <div className="cal-tl-body">
                      <div className="cal-tl-name">{e[lang] || e.en}</div>
                      <div className="cal-tl-date">{t.months[e.month]} {e.day}, {hijri.year}</div>
                    </div>
                    <button className={`cal-remind-btn ${reminded ? 'active' : ''}`} onClick={() => toggleReminder(e)}>
                      {reminded ? '🔔' : '🔕'}
                      <span>{reminded ? nl.reminded : nl.remind}</span>
                    </button>
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
