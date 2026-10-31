import { useState, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import { navGroupLabel } from '../data/navigation'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import usePrayerTracker from '../hooks/usePrayerTracker'
import RelatedLinks from '../components/prayer/RelatedLinks'
import { BarChart, ChartFigure, ProgressRing } from '../components/viz'
import {
  PRAYERS, prayerStatus, dayState, computeStreak, bestStreak, rangeSummary, lastNDays, addDays,
  monthDays, fromKey, daysBetween, estimateMissedDays, qadaTotals, ramadanDaysIn,
  excusedPeriod, isDateKey,
} from '../utils/prayerTracker'
import { TRACKER_TEXT, PRAYER_NAMES, WEEKDAYS_SUN, fill, formatDay, formatMonth } from '../data/prayerTrackerText'
import '../styles/PrayerTrackerPage.css'

// ═══════════════════════════════════════════════════════
// /prayer-tracker — Namaz izləyicisi
//
// NİYƏ AYRICA SƏHİFƏ (/dailytracker genişlənmədi): /dailytracker 10 əməlin
// ikili (✓/—) siyahısıdır; burada isə yalnız 5 fərz, üç vəziyyət (qıldım /
// qəza / qılmadım), keçmiş günlərin düzəlişi, təqvim, qəza sayğacı və heyz
// qeydi var — bir səhifədə hamısı qarışardı. MƏLUMAT isə ortaqdır: hər iki
// səhifə və /prayer eyni açarları oxuyur (utils/prayerTracker.js) — dublikat
// sistem yoxdur. Hər şey yalnız bu cihazda (localStorage) qalır.
// ═══════════════════════════════════════════════════════

const PRAYER_ICONS = { fajr: 'sunrise', dhuhr: 'sun', asr: 'sunLow', maghrib: 'sunset', isha: 'moon' }
const STATUS_BTNS = ['prayed', 'qada', 'missed']
const HEAT_WEEKS = 12

// ── Dizayn v3: idarə panelinin əlavə mətnləri (5 dil) ──
const EX = {
  az: {
    how: 'Necə işlədilir: hər namazdan sonra «Qıldım» düyməsinə toxunun. Keçmiş günü aylıq təqvimdən və ya xəritədən seçib düzəldə bilərsiniz.',
    overview: 'Ümumi baxış', todayRing: 'Bu gün', d30: 'Son 30 gün', vsBest: 'rekordun {p}%-i',
    reportEy: 'Hesabat', reportTitle: 'Vərdişiniz bir baxışda', reportLead: 'Son həftələrin xəritəsi, hansı namazın daha çox buraxıldığı və aylıq təqvim.',
    heatTitle: 'Son 12 həftə', heatSub: 'Hər xana bir gündür: rəng tünd olduqca o gün daha çox namaz qılınıb.',
    heatAria: 'Son {w} həftə: {n} gündən {c} gün tam qılınıb', less: 'Az', more: 'Çox', cellNone: '{d}: qeyd yoxdur',
    perTitle: 'Namazlara görə', perSub: 'Son 30 gündə qılınma faizi (vaxtında + qəza)', perEmpty: 'Hələ qeyd yoxdur — bu gündən başlayın.',
    toolsEy: 'Borc və ayarlar', toolsTitle: 'Qəza və şəxsi qeydlər', toolsLead: 'Qəza namaz və oruc sayğacı, qadınlar üçün heyz/nifas qeydi — hamısı yalnız bu cihazda.',
  },
  en: {
    how: 'How to use: tap “Prayed” after each prayer. Pick a past day in the monthly calendar or the map to correct it.',
    overview: 'Overview', todayRing: 'Today', d30: 'Last 30 days', vsBest: '{p}% of your best',
    reportEy: 'Report', reportTitle: 'Your habit at a glance', reportLead: 'A map of recent weeks, which prayer is missed most, and the monthly calendar.',
    heatTitle: 'Last 12 weeks', heatSub: 'Each square is a day: the darker it is, the more prayers were performed.',
    heatAria: 'Last {w} weeks: {c} of {n} days complete', less: 'Less', more: 'More', cellNone: '{d}: not logged',
    perTitle: 'By prayer', perSub: 'Share performed in the last 30 days (on time + made up)', perEmpty: 'Nothing logged yet — start today.',
    toolsEy: 'Debt and settings', toolsTitle: 'Qada and private logs', toolsLead: 'Qada prayer and fast counter, and an optional menstruation/postpartum log — all on this device only.',
  },
  ru: {
    how: 'Как пользоваться: после каждого намаза нажимайте «Совершил». Прошедший день можно выбрать в месячном календаре или на карте и исправить.',
    overview: 'Обзор', todayRing: 'Сегодня', d30: 'Последние 30 дней', vsBest: '{p}% от рекорда',
    reportEy: 'Отчёт', reportTitle: 'Ваша привычка с одного взгляда', reportLead: 'Карта последних недель, какой намаз пропускается чаще и месячный календарь.',
    heatTitle: 'Последние 12 недель', heatSub: 'Каждая клетка — день: чем темнее, тем больше намазов совершено.',
    heatAria: 'Последние {w} недель: полных дней {c} из {n}', less: 'Меньше', more: 'Больше', cellNone: '{d}: нет записей',
    perTitle: 'По намазам', perSub: 'Доля совершённых за 30 дней (вовремя + каза)', perEmpty: 'Записей пока нет — начните сегодня.',
    toolsEy: 'Долг и настройки', toolsTitle: 'Каза и личные записи', toolsLead: 'Счётчик возмещаемых намазов и постов и необязательный учёт хайда и нифаса — только на этом устройстве.',
  },
  ar: {
    how: 'طريقة الاستعمال: اضغط «صلّيت» بعد كل صلاة، ويمكنك اختيار يوم سابق من تقويم الشهر أو الخريطة لتصحيحه.',
    overview: 'نظرة عامة', todayRing: 'اليوم', d30: 'آخر 30 يومًا', vsBest: '{p}% من أفضل سلسلة',
    reportEy: 'التقرير', reportTitle: 'عادتك في لمحة', reportLead: 'خريطة الأسابيع الأخيرة، وأي صلاة تفوتك أكثر، وتقويم الشهر.',
    heatTitle: 'آخر 12 أسبوعًا', heatSub: 'كل مربع يوم: كلما كان اللون أغمق كانت الصلوات المؤداة أكثر.',
    heatAria: 'آخر {w} أسبوعًا: {c} يومًا مكتملًا من {n}', less: 'أقل', more: 'أكثر', cellNone: '{d}: لا تسجيل',
    perTitle: 'بحسب الصلاة', perSub: 'نسبة الأداء في آخر 30 يومًا (في الوقت + قضاء)', perEmpty: 'لا تسجيلات بعد — ابدأ اليوم.',
    toolsEy: 'الدَّين والإعدادات', toolsTitle: 'القضاء والسجلات الخاصة', toolsLead: 'عدّاد قضاء الصلوات والصيام، وسجل اختياري للحيض والنفاس — على هذا الجهاز فقط.',
  },
  tr: {
    how: 'Nasıl kullanılır: her namazdan sonra «Kıldım» düğmesine dokunun. Geçmiş bir günü aylık takvimden veya haritadan seçip düzeltebilirsiniz.',
    overview: 'Genel bakış', todayRing: 'Bugün', d30: 'Son 30 gün', vsBest: 'rekorun %{p} kadarı',
    reportEy: 'Rapor', reportTitle: 'Alışkanlığınız bir bakışta', reportLead: 'Son haftaların haritası, hangi namazın daha çok kaçırıldığı ve aylık takvim.',
    heatTitle: 'Son 12 hafta', heatSub: 'Her kare bir gündür: renk koyulaştıkça o gün daha çok namaz kılınmıştır.',
    heatAria: 'Son {w} hafta: {n} günün {c} günü tam', less: 'Az', more: 'Çok', cellNone: '{d}: kayıt yok',
    perTitle: 'Namazlara göre', perSub: 'Son 30 günde kılınma oranı (vaktinde + kaza)', perEmpty: 'Henüz kayıt yok — bugün başlayın.',
    toolsEy: 'Borç ve ayarlar', toolsTitle: 'Kaza ve özel kayıtlar', toolsLead: 'Kaza namaz ve oruç sayacı, kadınlar için isteğe bağlı hayız/nifas kaydı — hepsi yalnızca bu cihazda.',
  },
}

// Əlaqəli bölmələr (məzmun təkrarlanmır — keçid)
const RELATED = [
  { key: 'prayer', title: { az: 'Namaz vaxtları', en: 'Prayer times', ru: 'Время намаза', ar: 'مواقيت الصلاة', tr: 'Namaz vakitleri' }, text: { az: 'Bu günün azan vaxtları', en: 'Today’s adhan times', ru: 'Время азана на сегодня', ar: 'أوقات الأذان اليوم', tr: 'Bugünün ezan vakitleri' } },
  { key: 'qada', title: { az: 'Qəza izləyicisi', en: 'Qada tracker', ru: 'Учёт каза', ar: 'متابعة القضاء', tr: 'Kaza takibi' }, text: { az: 'Borcun ətraflı planı', en: 'A detailed plan for your debt', ru: 'Подробный план возмещения', ar: 'خطة مفصلة للقضاء', tr: 'Borç için ayrıntılı plan' } },
  { key: 'prayerguide', title: { az: 'Namaz necə qılınır', en: 'How to pray', ru: 'Как совершать намаз', ar: 'كيف تصلي', tr: 'Namaz nasıl kılınır' }, text: { az: 'Addım-addım, dəlilləri ilə', en: 'Step by step, with evidence', ru: 'Шаг за шагом, с доводами', ar: 'خطوة بخطوة مع الدليل', tr: 'Adım adım, delilleriyle' } },
  { key: 'dailytracker', title: { az: 'Gündəlik ibadət', en: 'Daily worship', ru: 'Ежедневные поклонения', ar: 'العبادات اليومية', tr: 'Günlük ibadet' }, text: { az: 'Zikr, Quran və digər əməllər', en: 'Dhikr, Quran and other deeds', ru: 'Зикр, Коран и другие дела', ar: 'الذكر والقرآن وغيرها', tr: 'Zikir, Kur’an ve diğer ameller' } },
  { lesson: 'adhkar-after-salah', title: { az: 'Namazdan sonrakı zikrlər', en: 'Adhkar after prayer', ru: 'Зикры после намаза', ar: 'الأذكار بعد الصلاة', tr: 'Namazdan sonraki zikirler' }, text: { az: 'Dərs', en: 'Lesson', ru: 'Урок', ar: 'درس', tr: 'Ders' } },
  { lesson: 'travel-prayer', title: { az: 'Səfər namazı', en: 'Prayer while travelling', ru: 'Намаз в пути', ar: 'صلاة المسافر', tr: 'Yolculuk namazı' }, text: { az: 'Qəsr və cəm', en: 'Shortening and combining', ru: 'Сокращение и объединение', ar: 'القصر والجمع', tr: 'Kısaltma ve birleştirme' } },
]

export default function PrayerTrackerPage({ setPage }) {
  const { lang } = useLang()
  const lk = TRACKER_TEXT[lang] ? lang : 'en'
  const t = TRACKER_TEXT[lk]
  const x = EX[lk]
  const names = PRAYER_NAMES[lk]
  const { snap, qada, hayd, today, setStatus, setQada, setHayd } = usePrayerTracker()
  const periods = hayd.periods

  // Redaktə olunan gün (təqvimdən və ya xəritədən keçmiş gün seçilə bilər)
  const [selected, setSelected] = useState(null)
  const day = selected && selected <= today ? selected : today
  const pickDay = (d) => { haptic(); setSelected(d === today ? null : d) }

  const streak = useMemo(() => computeStreak(snap, periods, today), [snap, periods, today])
  const best = useMemo(() => bestStreak(snap, periods, today), [snap, periods, today])
  const week = useMemo(() => lastNDays(today, 7), [today])
  const weekSum = useMemo(() => rangeSummary(snap, periods, week, today), [snap, periods, week, today])
  const days30 = useMemo(() => lastNDays(today, 30), [today])
  const sum30 = useMemo(() => rangeSummary(snap, periods, days30, today), [snap, periods, days30, today])
  const todayState = dayState(snap, periods, today, today)
  const excusedToday = todayState.state === 'excused'

  return (
    <div className="pt-root">
      <header className="ui-page-hero pt-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel('worship', lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> {x.how}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight pt-main" aria-label={x.overview}>
        <div className="ui-container pt-layout">
          <DayCard t={t} names={names} lang={lk} snap={snap} periods={periods} day={day} today={today}
            setStatus={setStatus} setQada={setQada} onBack={() => setSelected(null)} />

          <div className="pt-side">
            <div className="pt-overview ui-card" data-reveal>
              <h2 className="pt-card-title">{x.overview}</h2>
              <div className="pt-overview-grid">
                <div className="pt-ring">
                  <ProgressRing value={excusedToday ? 0 : todayState.performed} max={5} size={88} thickness={8}
                    showPercent={false} label={x.todayRing} />
                  <span className="pt-ring-in" aria-hidden="true">
                    <span className="pt-ring-num ui-num">{excusedToday ? '—' : `${todayState.performed}/5`}</span>
                  </span>
                  <span className="pt-ring-label">{x.todayRing}</span>
                </div>
                <div className="pt-ring">
                  <ProgressRing value={streak} max={Math.max(best, 1)} size={88} thickness={8} tone={2}
                    showPercent={false} label={t.streak} />
                  <span className="pt-ring-in">
                    <span className="pt-ring-num ui-num" data-testid="pt-streak">{streak}</span>
                  </span>
                  <span className="pt-ring-label">{t.streak}</span>
                </div>
                <dl className="pt-kpis">
                  <div><dt>{t.best}</dt><dd className="ui-num">{best}</dd></div>
                  <div><dt>{t.week}</dt><dd className="ui-num">{weekSum.pct}%</dd></div>
                  <div><dt>{x.d30}</dt><dd className="ui-num">{sum30.pct}%</dd></div>
                </dl>
              </div>
              <p className="pt-note"><Icon name="bolt" size={15} /> <span>{t.streakHint}{best > 0 ? ` · ${fill(x.vsBest, { p: Math.round((streak / best) * 100) })}` : ''}</span></p>
            </div>

            <WeekReport t={t} lang={lk} snap={snap} periods={periods} week={week} today={today} sum={weekSum} />
          </div>
        </div>
      </section>

      <section className="ui-section ui-section--tight ui-section--alt pt-report" aria-labelledby="pt-report-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{x.reportEy}</span>
            <h2 id="pt-report-title" className="ui-title">{x.reportTitle}</h2>
            <p className="ui-lead">{x.reportLead}</p>
          </div>
          <div className="pt-report-grid">
            <Heatmap t={t} x={x} lang={lk} snap={snap} periods={periods} today={today} selected={day}
              onPick={(d) => { pickDay(d); document.querySelector('.pt-day')?.scrollIntoView({ block: 'nearest' }) }} />
            <PerPrayer x={x} names={names} snap={snap} periods={periods} dates={days30} today={today} />
            <MonthReport t={t} lang={lk} snap={snap} periods={periods} today={today} selected={day} onPick={pickDay} />
          </div>
        </div>
      </section>

      <section className="ui-section ui-section--tight pt-tools" aria-labelledby="pt-tools-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{x.toolsEy}</span>
            <h2 id="pt-tools-title" className="ui-title">{x.toolsTitle}</h2>
            <p className="ui-lead">{x.toolsLead}</p>
          </div>
          <div className="pt-tools-grid">
            <QadaCounter t={t} names={names} qada={qada} setQada={setQada} />
            <div className="pt-tools-side">
              {hayd.enabled && (
                <HaydLog t={t} lang={lk} hayd={hayd} setHayd={setHayd} setQada={setQada} today={today} />
              )}
              <div className="pt-settings ui-card" data-reveal>
                <h3 className="pt-card-title">{t.settingsTitle}</h3>
                <button type="button" className={`pt-switch${hayd.enabled ? ' is-on' : ''}`} role="switch" aria-checked={hayd.enabled}
                  onClick={() => { haptic(); setHayd(h => ({ ...h, enabled: !h.enabled })) }}>
                  <span className="pt-switch-text">
                    <span className="pt-switch-label">{t.haydToggle}</span>
                    <span className="pt-switch-sub">{t.haydToggleSub}</span>
                  </span>
                  <span className="pt-switch-track" aria-hidden="true"><span className="pt-switch-knob" /></span>
                </button>
                <div className="pt-notif-hint">
                  <Icon name="bell" size={18} />
                  <span>{t.notifHint}</span>
                  <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-notifications'))}>{t.openNotif}</button>
                </div>
                <p className="pt-note"><Icon name="shield" size={15} /> <span>{t.dataNote}</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RelatedLinks items={RELATED} lang={lk} id="pt-related" />
    </div>
  )
}

// ── İstilik xəritəsi: son 12 həftə (sütun — həftə, sətir — B.e…Baz) ──
function Heatmap({ t, x, lang, snap, periods, today, selected, onPick }) {
  const cols = useMemo(() => {
    const dow = (fromKey(today).getDay() + 6) % 7   // bazar ertəsi = 0
    const start = addDays(today, -dow - (HEAT_WEEKS - 1) * 7)
    return Array.from({ length: HEAT_WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))
  }, [today])
  const wdMon = [1, 2, 3, 4, 5, 6, 0].map(i => WEEKDAYS_SUN[lang][i])
  let n = 0, c = 0
  const cells = cols.map(wk => wk.map(d => {
    if (d > today) return { d, cls: 'is-future' }
    const s = dayState(snap, periods, d, today)
    if (s.state === 'excused') return { d, cls: 'is-excused', title: fill(t.dayAriaEx, { d: formatDay(d, lang) }) }
    n++
    if (s.state === 'complete') c++
    if (s.state === 'none') return { d, cls: 'lv-none', title: fill(x.cellNone, { d: formatDay(d, lang) }) }
    return { d, cls: `lv-${s.performed}`, title: fill(t.dayAria, { d: formatDay(d, lang), n: s.performed }) }
  }))
  return (
    <div className="pt-heat ui-card" data-reveal>
      <h3 className="pt-card-title">{x.heatTitle}</h3>
      <p className="pt-card-lead">{x.heatSub}</p>
      <div className="pt-heat-wrap">
        <div className="pt-heat-wd" aria-hidden="true">{wdMon.map((w, i) => <span key={i}>{i % 2 === 0 ? w : ''}</span>)}</div>
        <div className="pt-heat-grid" role="group" aria-label={fill(x.heatAria, { w: HEAT_WEEKS, n, c })}>
          {cells.map((wk, wi) => (
            <div key={wi} className="pt-heat-col">
              {wk.map(cell => cell.cls === 'is-future'
                ? <span key={cell.d} className="pt-heat-cell is-future" aria-hidden="true" />
                : <button key={cell.d} type="button"
                    className={`pt-heat-cell ${cell.cls}${cell.d === today ? ' is-today' : ''}${cell.d === selected ? ' is-selected' : ''}`}
                    title={cell.title} aria-label={cell.title} onClick={() => onPick(cell.d)} />)}
            </div>
          ))}
        </div>
      </div>
      <div className="pt-heat-legend" aria-hidden="true">
        <span>{x.less}</span>
        {['none', 1, 2, 3, 4, 5].map(l => <span key={l} className={`pt-heat-cell lv-${l}`} />)}
        <span>{x.more}</span>
        <span className="pt-heat-cell is-excused pt-heat-gap" /><span>{t.lgExcused}</span>
      </div>
    </div>
  )
}

// ── Namazlara görə: son 30 gündə hər namazın qılınma faizi ──
function PerPrayer({ x, names, snap, periods, dates, today }) {
  const rows = PRAYERS.map(p => {
    let possible = 0, done = 0, marked = 0
    for (const d of dates) {
      if (d > today) continue
      const s = dayState(snap, periods, d, today)
      if (s.state === 'excused') continue
      possible++
      const st = s.statuses[p]
      if (st) marked++
      if (st === 'prayed' || st === 'qada') done++
    }
    return { key: p, label: names[p], value: possible ? Math.round((done / possible) * 100) : 0, marked }
  })
  const any = rows.some(r => r.marked)
  const minV = Math.min(...rows.map(r => r.value))
  return (
    <div className="pt-per ui-card" data-reveal>
      <ChartFigure title={x.perTitle} sub={x.perSub} plain>
        {any
          ? <BarChart data={rows.map(r => ({ ...r, tone: r.value === minV && minV < 100 ? 2 : 1 }))} max={100}
              format={v => `${v}%`} label={`${x.perTitle} — ${x.perSub}`} labelWidth="30%" />
          : <p className="pt-note">{x.perEmpty}</p>}
      </ChartFigure>
    </div>
  )
}

// ── Günün 5 namazı: Qıldım / Qəza / Qılmadım ──
function DayCard({ t, names, lang, snap, periods, day, today, setStatus, setQada, onBack }) {
  const ds = dayState(snap, periods, day, today)
  const isToday = day === today
  // "Qılmadım"dan sonra bir dəfəlik "+1 qəza" təklifi (bu açılış üçün)
  const [debtAdded, setDebtAdded] = useState({})

  const pick = (p, s) => {
    haptic()
    const cur = prayerStatus(snap, day, p)
    setStatus(day, p, cur === s ? null : s)
  }
  const addDebt = (p) => {
    setQada(q => ({ ...q, prayers: { ...q.prayers, [p]: { ...q.prayers[p], debt: q.prayers[p].debt + 1 } } }))
    setDebtAdded(a => ({ ...a, [`${day}|${p}`]: true }))
  }

  return (
    <div className={`pt-day ui-card${ds.state === 'complete' ? ' is-complete' : ''}`} data-reveal>
      <div className="pt-day-head">
        <div>
          <h2 className="pt-card-title">{isToday ? t.today : formatDay(day, lang, { weekday: true })}</h2>
          {isToday && <span className="pt-day-date">{formatDay(day, lang)}</span>}
        </div>
        <div className="pt-day-head-r">
          {ds.state !== 'excused' && (
            <span className="ui-badge ui-badge--brand ui-num" data-testid="pt-day-count">{fill(t.countDone, { n: ds.performed })}</span>
          )}
          {!isToday && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={onBack}>{t.backToday}</button>}
        </div>
      </div>

      {ds.state === 'excused' ? (
        <p className="pt-excused" data-testid="pt-excused">
          <Icon name="moon" size={18} /> {ds.type === 'nifas' ? t.exNifas : t.exHayd}
        </p>
      ) : (
        <ul className="pt-prayers">
          {PRAYERS.map(p => {
            const s = ds.statuses[p]
            return (
              <li key={p} className={`pt-prayer${s ? ` is-${s}` : ''}`}>
                <span className="pt-prayer-name">
                  <span className="pt-prayer-ic" aria-hidden="true"><Icon name={PRAYER_ICONS[p]} size={18} /></span>
                  {names[p]}
                </span>
                <span className="pt-seg" role="group" aria-label={fill(t.statusGroup, { p: names[p] })}>
                  {STATUS_BTNS.map(b => (
                    <button key={b} type="button" className={`pt-seg-btn pt-seg-btn--${b}`} aria-pressed={s === b}
                      onClick={() => pick(p, b)}>
                      {b === 'prayed' && <Icon name="check" size={15} strokeWidth={2.2} />}
                      {t[b]}
                    </button>
                  ))}
                </span>
                {s === 'missed' && (
                  debtAdded[`${day}|${p}`]
                    ? <span className="pt-debt-added" role="status">{t.debtAdded}</span>
                    : <button type="button" className="pt-debt-btn ui-link" onClick={() => addDebt(p)}>{t.addDebt}</button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <p className="pt-day-msg" aria-live="polite">{ds.state === 'complete' && isToday ? t.allDone : ''}</p>
    </div>
  )
}

// ── Həftəlik hesabat: yığılmış sütun qrafiki (öz SVG) ──
function WeekReport({ t, lang, snap, periods, week, today, sum }) {
  const W = 350, H = 176, top = 22, base = 142, unit = (base - top) / 5, bw = 24
  const days = week.map(d => ({ d, s: dayState(snap, periods, d, today) }))
  const aria = days.map(({ d, s }) => s.state === 'excused'
    ? fill(t.dayAriaEx, { d: formatDay(d, lang) })
    : fill(t.dayAria, { d: formatDay(d, lang), n: s.performed })).join('; ')
  return (
    <div className="pt-week ui-card" data-reveal>
      <h3 className="pt-card-title">{t.weekTitle}</h3>
      <svg className="pt-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${t.weekTitle}: ${aria}`}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <line key={i} className="pt-grid" x1="8" x2={W - 8} y1={base - i * unit} y2={base - i * unit} />
        ))}
        {days.map(({ d, s }, i) => {
          const cx = 25 + i * 50
          const x = cx - bw / 2
          const isToday = d === today
          const wd = WEEKDAYS_SUN[lang][fromKey(d).getDay()]
          let y = base
          const seg = (n, cls) => {
            if (!n) return null
            const h = n * unit
            y -= h
            return <rect key={cls} className={`pt-bar pt-bar--${cls}`} x={x} y={y} width={bw} height={h} rx="3" />
          }
          return (
            <g key={d}>
              <rect className="pt-bar-track" x={x} y={top} width={bw} height={base - top} rx="4" />
              {s.state === 'excused'
                ? <rect className="pt-bar pt-bar--excused" x={x} y={top} width={bw} height={base - top} rx="4" />
                : <>{seg(s.prayed, 'prayed')}{seg(s.qada, 'qada')}{seg(s.missed, 'missed')}</>}
              <text className={`pt-chart-num${isToday ? ' is-today' : ''}`} x={cx} y={top - 7} textAnchor="middle">
                {s.state === 'excused' ? '·' : s.performed}
              </text>
              <text className={`pt-chart-day${isToday ? ' is-today' : ''}`} x={cx} y={base + 16} textAnchor="middle">{wd}</text>
              <text className="pt-chart-date" x={cx} y={base + 30} textAnchor="middle">{Number(d.slice(8))}</text>
            </g>
          )
        })}
      </svg>
      <Legend t={t} />
      <SummaryRow t={t} sum={sum} />
    </div>
  )
}

function Legend({ t }) {
  return (
    <ul className="pt-legend">
      <li><span className="pt-dot pt-dot--prayed" />{t.lgPrayed}</li>
      <li><span className="pt-dot pt-dot--qada" />{t.lgQada}</li>
      <li><span className="pt-dot pt-dot--missed" />{t.lgMissed}</li>
      <li><span className="pt-dot pt-dot--excused" />{t.lgExcused}</li>
    </ul>
  )
}

function SummaryRow({ t, sum }) {
  return (
    <dl className="pt-sum">
      <div><dt>{t.lgPrayed}</dt><dd className="ui-num">{sum.prayed}</dd></div>
      <div><dt>{t.lgQada}</dt><dd className="ui-num">{sum.qada}</dd></div>
      <div><dt>{t.lgMissed}</dt><dd className="ui-num">{sum.missed}</dd></div>
      <div><dt>{t.lgUnmarked}</dt><dd className="ui-num">{sum.unmarked}</dd></div>
      <div><dt>{t.completeDays}</dt><dd className="ui-num">{sum.completeDays}</dd></div>
    </dl>
  )
}

// ── Aylıq hesabat: təqvim şəbəkəsi (gün → 5 nöqtə) + yığılmış zolaq ──
function MonthReport({ t, lang, snap, periods, today, selected, onPick }) {
  const now = fromKey(today)
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const dates = useMemo(() => monthDays(ym.y, ym.m), [ym])
  const sum = useMemo(() => rangeSummary(snap, periods, dates, today), [snap, periods, dates, today])
  const isCurrent = ym.y === now.getFullYear() && ym.m === now.getMonth()
  // Həftə bazar ertəsindən: boş xanalar
  const lead = (fromKey(dates[0]).getDay() + 6) % 7
  const wdMon = [1, 2, 3, 4, 5, 6, 0].map(i => WEEKDAYS_SUN[lang][i])
  const shift = (n) => setYm(({ y, m }) => {
    const d = new Date(y, m + n, 1)
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const total = Math.max(1, sum.possible)
  const segs = [['prayed', sum.prayed], ['qada', sum.qada], ['missed', sum.missed]]
  let acc = 0

  return (
    <div className="pt-month ui-card" data-reveal>
      <div className="pt-month-head">
        <h3 className="pt-card-title">{t.monthTitle}</h3>
        <div className="pt-month-nav">
          <button type="button" className="ui-icon-btn" aria-label={t.prevMonth} onClick={() => shift(-1)}>
            <Icon name="chevronLeft" size={18} className="ui-flip-rtl" />
          </button>
          <span className="pt-month-name" aria-live="polite">{formatMonth(ym.y, ym.m, lang)}</span>
          <button type="button" className="ui-icon-btn" aria-label={t.nextMonth} onClick={() => shift(1)} disabled={isCurrent}>
            <Icon name="chevron" size={18} className="ui-flip-rtl" />
          </button>
        </div>
      </div>

      <div className="pt-cal" role="group" aria-label={`${t.monthTitle} — ${t.pickDay}`}>
        <div className="pt-cal-row pt-cal-wd" aria-hidden="true">
          {wdMon.map((w, i) => <span key={i}>{w}</span>)}
        </div>
        <div className="pt-cal-grid">
          {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} className="pt-cal-empty" aria-hidden="true" />)}
          {dates.map(d => {
            const future = d > today
            const s = future ? null : dayState(snap, periods, d, today)
            const label = !s ? formatDay(d, lang)
              : s.state === 'excused' ? fill(t.dayAriaEx, { d: formatDay(d, lang) })
              : fill(t.dayAria, { d: formatDay(d, lang), n: s.performed })
            return (
              <button key={d} type="button" disabled={future}
                className={`pt-cal-day${s ? ` is-${s.state}` : ''}${d === today ? ' is-today' : ''}${d === selected ? ' is-selected' : ''}`}
                aria-label={label} aria-pressed={d === selected} data-date={d}
                onClick={() => onPick(d)}>
                <span className="pt-cal-num ui-num">{Number(d.slice(8))}</span>
                {s && s.state !== 'excused' && (
                  <span className="pt-cal-dots" aria-hidden="true">
                    {PRAYERS.map(p => <span key={p} className={`pt-dot pt-dot--sm pt-dot--${s.statuses[p] || 'none'}`} />)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <svg className="pt-month-bar" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true">
        <rect className="pt-bar-track" x="0" y="0" width="300" height="12" rx="6" />
        {segs.map(([k, n]) => {
          if (!n) return null
          const w = (n / total) * 300
          const r = <rect key={k} className={`pt-bar pt-bar--${k}`} x={acc} y="0" width={w} height="12" />
          acc += w
          return r
        })}
      </svg>
      <p className="pt-month-pct"><span className="ui-num">{sum.pct}%</span> {isCurrent ? t.month : formatMonth(ym.y, ym.m, lang)}</p>
      <SummaryRow t={t} sum={sum} />
      <p className="pt-note">{t.pickDay}</p>
    </div>
  )
}

// ── Qəza sayğacı ──
function QadaCounter({ t, names, qada, setQada }) {
  const totals = qadaTotals(qada)
  const [bulk, setBulk] = useState({ years: '', months: '', days: '' })
  const [proposal, setProposal] = useState(null)   // { n, which: Set }

  const change = (p, dDebt, dDone = 0) => {
    haptic()
    setQada(q => {
      const cur = q.prayers[p]
      if (dDebt < 0 && cur.debt <= 0) return q
      return { ...q, prayers: { ...q.prayers, [p]: { debt: Math.max(0, cur.debt + dDebt), done: Math.max(0, cur.done + dDone) } } }
    })
  }
  const changeFast = (dDebt, dDone = 0) => {
    haptic()
    setQada(q => {
      if (dDebt < 0 && q.fasts.debt <= 0) return q
      return { ...q, fasts: { debt: Math.max(0, q.fasts.debt + dDebt), done: Math.max(0, q.fasts.done + dDone) } }
    })
  }
  const calc = () => {
    const n = estimateMissedDays({ years: bulk.years, months: bulk.months, days: bulk.days })
    setProposal(n ? { n, which: [...PRAYERS] } : null)
  }
  const confirmBulk = () => {
    const n = Math.max(0, Math.floor(Number(proposal.n)) || 0)
    if (n) {
      setQada(q => {
        const prayers = { ...q.prayers }
        for (const p of proposal.which) prayers[p] = { ...prayers[p], debt: prayers[p].debt + n }
        return { ...q, prayers }
      })
    }
    setProposal(null)
    setBulk({ years: '', months: '', days: '' })
  }
  const reset = () => {
    if (!window.confirm(t.resetConfirm)) return
    setQada({})
  }

  return (
    <div className="pt-qada ui-card" data-reveal id="qada">
      <h3 className="pt-card-title"><Icon name="refresh" size={18} /> {t.qadaTitle}</h3>
      <p className="pt-card-lead">{t.qadaLead}</p>

      <ul className="pt-qada-list">
        {PRAYERS.map(p => {
          const x = qada.prayers[p]
          return (
            <li key={p} className="pt-qada-row" data-prayer={p}>
              <span className="pt-qada-name">{names[p]}</span>
              <span className="pt-qada-stepper">
                <button type="button" className="ui-icon-btn" aria-label={fill(t.dec, { p: names[p] })}
                  onClick={() => change(p, -1)} disabled={!x.debt}><Icon name="minus" size={16} /></button>
                <span className="pt-qada-num ui-num" data-testid={`qada-${p}`}>{x.debt}</span>
                <button type="button" className="ui-icon-btn" aria-label={fill(t.inc, { p: names[p] })}
                  onClick={() => change(p, 1)}><Icon name="plus" size={16} /></button>
              </span>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm pt-qada-done" disabled={!x.debt}
                onClick={() => change(p, -1, 1)}>
                <Icon name="check" className="ui-btn__icon" /> {t.qadaPrayed}
              </button>
            </li>
          )
        })}
        <li className="pt-qada-row pt-qada-row--fast">
          <span className="pt-qada-name">{t.fastTitle}</span>
          <span className="pt-qada-stepper">
            <button type="button" className="ui-icon-btn" aria-label={fill(t.dec, { p: t.fastTitle })}
              onClick={() => changeFast(-1)} disabled={!qada.fasts.debt}><Icon name="minus" size={16} /></button>
            <span className="pt-qada-num ui-num" data-testid="qada-fasts">{qada.fasts.debt}</span>
            <button type="button" className="ui-icon-btn" aria-label={fill(t.inc, { p: t.fastTitle })}
              onClick={() => changeFast(1)}><Icon name="plus" size={16} /></button>
          </span>
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm pt-qada-done" disabled={!qada.fasts.debt}
            onClick={() => changeFast(-1, 1)}>
            <Icon name="check" className="ui-btn__icon" /> {t.fastDone}
          </button>
        </li>
      </ul>

      <div className="pt-qada-progress">
        <div className="pt-qada-progress-head">
          <span>{t.progress}</span>
          <span className="ui-num">{totals.pct}%</span>
        </div>
        <span className="pt-progress" aria-hidden="true"><span style={{ transform: `scaleX(${totals.pct / 100})` }} /></span>
        <div className="pt-qada-progress-foot">
          <span>{fill(t.doneTotal, { n: totals.done })}</span>
          <span>{fill(t.remaining, { n: totals.debt })}</span>
        </div>
      </div>

      <details className="pt-bulk">
        <summary>{t.bulkTitle}</summary>
        <p className="pt-note">{t.bulkHint}</p>
        <div className="pt-bulk-fields">
          {['years', 'months', 'days'].map(k => (
            <label key={k} className="ui-field">
              <span className="ui-field__label">{t[k]}</span>
              <input className="ui-input" type="number" inputMode="numeric" min="0" value={bulk[k]}
                onChange={e => { setBulk(b => ({ ...b, [k]: e.target.value })); setProposal(null) }} />
            </label>
          ))}
          <button type="button" className="ui-btn ui-btn--secondary" onClick={calc}>{t.calc}</button>
        </div>
        {proposal && (
          <div className="pt-proposal" role="region" aria-label={t.bulkTitle}>
            <p>{fill(t.bulkResult, { n: proposal.n, t: proposal.n * proposal.which.length })}</p>
            <p className="pt-note">{t.bulkNote}</p>
            <label className="ui-field pt-proposal-n">
              <span className="ui-field__label">{t.perPrayer}</span>
              <input className="ui-input" type="number" min="0" value={proposal.n}
                onChange={e => setProposal(pr => ({ ...pr, n: e.target.value }))} />
            </label>
            <div className="pt-proposal-which" role="group" aria-label={t.perPrayer}>
              {PRAYERS.map(p => {
                const on = proposal.which.includes(p)
                return (
                  <button key={p} type="button" className="ui-chip" aria-pressed={on}
                    onClick={() => setProposal(pr => ({ ...pr, which: on ? pr.which.filter(x => x !== p) : [...pr.which, p] }))}>
                    {names[p]}
                  </button>
                )
              })}
            </div>
            <div className="pt-actions">
              <button type="button" className="ui-btn ui-btn--primary" onClick={confirmBulk} disabled={!proposal.which.length}>{t.confirmAdd}</button>
              <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setProposal(null)}>{t.cancel}</button>
            </div>
          </div>
        )}
      </details>

      <div className="pt-rulings">
        <h4 className="pt-rulings-title">{t.rulingsTitle}</h4>
        <p>{t.ruleForgot} <cite className="pt-src">— {t.ruleForgotSrc}</cite></p>
        <p className="pt-ask"><Icon name="info" size={15} /> {t.ruleOther}</p>
      </div>

      {(totals.debt > 0 || totals.done > 0 || qada.fasts.debt > 0 || qada.fasts.done > 0) && (
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm pt-reset" onClick={reset}>
          <Icon name="refresh" className="ui-btn__icon" /> {t.resetQada}
        </button>
      )}
    </div>
  )
}

// ── Heyz / nifas qeydi (yalnız cihazda) ──
function HaydLog({ t, lang, hayd, setHayd, setQada, today }) {
  const active = hayd.periods.find(p => !p.end) || null
  const [type, setType] = useState('hayd')
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(today)
  const [offerN, setOfferN] = useState({})

  const typeName = (x) => (x === 'nifas' ? t.typeNifas : t.typeHayd)
  const startPeriod = () => {
    if (!isDateKey(start) || start > today) return
    haptic()
    setHayd(h => ({ ...h, periods: [{ id: `${start}-${Date.now().toString(36)}`, type, start, end: null }, ...h.periods] }))
  }
  const endPeriod = () => {
    if (!active || !isDateKey(end)) return
    haptic()
    const e = end < active.start ? active.start : end > today ? today : end
    setHayd(h => ({ ...h, periods: h.periods.map(p => (p.id === active.id ? { ...p, end: e } : p)) }))
  }
  const remove = (id) => {
    if (!window.confirm(t.delConfirm)) return
    setHayd(h => ({ ...h, periods: h.periods.filter(p => p.id !== id), handled: h.handled.filter(x => x !== id) }))
  }
  const clearAll = () => {
    if (!window.confirm(t.clearConfirm)) return
    setHayd(h => ({ ...h, periods: [], handled: [] }))
  }

  // Bitmiş dövrlər üçün Ramazan orucu təklifi (istifadəçi təsdiqi ilə)
  const offers = hayd.periods
    .filter(p => p.end && !hayd.handled.includes(p.id))
    .map(p => ({ p, days: ramadanDaysIn(p, today).length }))
    .filter(o => o.days > 0)
  const handle = (id, add) => {
    if (add > 0) setQada(q => ({ ...q, fasts: { ...q.fasts, debt: q.fasts.debt + add } }))
    setHayd(h => ({ ...h, handled: [...h.handled, id] }))
  }
  const excusedToday = excusedPeriod(hayd.periods, today, today)

  return (
    <div className="pt-hayd ui-card" data-reveal id="hayd">
      <h3 className="pt-card-title"><Icon name="moon" size={18} /> {t.haydTitle}</h3>
      <p className="pt-privacy" role="note"><Icon name="shield" size={16} /> {t.privacy}</p>

      {active ? (
        <div className="pt-hayd-active">
          <p><strong>{fill(t.active, { type: typeName(active.type), d: formatDay(active.start, lang) })}</strong>
            {' · '}{fill(t.daysN, { n: daysBetween(active.start, today) + 1 })}</p>
          <div className="pt-hayd-form">
            <label className="ui-field">
              <span className="ui-field__label">{t.endLabel}</span>
              <input className="ui-input" type="date" value={end} min={active.start} max={today} onChange={e => setEnd(e.target.value)} />
            </label>
            <button type="button" className="ui-btn ui-btn--primary" onClick={endPeriod}>{t.endBtn}</button>
          </div>
        </div>
      ) : (
        <div className="pt-hayd-form">
          <div className="ui-field">
            <span className="ui-field__label" id="pt-hayd-type">{t.typeLabel}</span>
            <div className="pt-type" role="group" aria-labelledby="pt-hayd-type">
              {['hayd', 'nifas'].map(x => (
                <button key={x} type="button" className="ui-chip" aria-pressed={type === x} onClick={() => setType(x)}>{typeName(x)}</button>
              ))}
            </div>
          </div>
          <label className="ui-field">
            <span className="ui-field__label">{t.startLabel}</span>
            <input className="ui-input" type="date" value={start} max={today} onChange={e => setStart(e.target.value)} />
          </label>
          <button type="button" className="ui-btn ui-btn--primary" onClick={startPeriod}>{t.startBtn}</button>
        </div>
      )}
      {excusedToday && <span className="ui-badge" data-testid="pt-hayd-today">{excusedToday.type === 'nifas' ? t.exNifas : t.exHayd}</span>}

      {offers.map(({ p, days }) => {
        const n = offerN[p.id] ?? days
        return (
          <div key={p.id} className="pt-offer" role="region" aria-label={t.fastTitle}>
            <p>{fill(t.ramadanOffer, { n: days })}</p>
            <p className="pt-note">{t.ramadanNote}</p>
            <div className="pt-actions">
              <input className="ui-input pt-offer-n" type="number" min="0" max="30" value={n} aria-label={t.fastTitle}
                onChange={e => setOfferN(o => ({ ...o, [p.id]: e.target.value }))} />
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => handle(p.id, Math.max(0, Math.floor(Number(n)) || 0))}>{t.addFasts}</button>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => handle(p.id, 0)}>{t.skip}</button>
            </div>
          </div>
        )
      })}

      <h4 className="pt-sub-title">{t.history}</h4>
      {hayd.periods.length === 0 ? <p className="pt-note">{t.none}</p> : (
        <ul className="pt-hayd-list">
          {hayd.periods.slice(0, 24).map(p => (
            <li key={p.id}>
              <span className="pt-hayd-type">{typeName(p.type)}</span>
              <span className="pt-hayd-range">
                {formatDay(p.start, lang)} – {p.end ? formatDay(p.end, lang) : t.ongoing}
                {' · '}{fill(t.daysN, { n: daysBetween(p.start, p.end || today) + 1 })}
              </span>
              <button type="button" className="ui-icon-btn" aria-label={`${t.del}: ${formatDay(p.start, lang)}`} onClick={() => remove(p.id)}>
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-rulings">
        <h4 className="pt-rulings-title">{t.rulingsTitle}</h4>
        <p>{t.haydRule} <cite className="pt-src">— {t.haydRuleSrc}</cite></p>
        <p>{t.nifasRule} <cite className="pt-src">— {t.nifasRuleSrc}</cite></p>
        <p className="pt-ask"><Icon name="info" size={15} /> {t.askImam}</p>
      </div>

      {hayd.periods.length > 0 && (
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm pt-reset" onClick={clearAll}>
          <Icon name="trash" className="ui-btn__icon" /> {t.clearAll}
        </button>
      )}
    </div>
  )
}
