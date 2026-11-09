// ═══════════════════════════════════════════════════════
// "Mənim həftəm" — ana səhifədə "Mənim günüm"ün altında kompakt zolaq:
// son 7 gün vs əvvəlki 7 gün (namaz, aktiv gün, Quran günü, zikr) + mini trend
// + /analytics keçidi. Məlumat YALNIZ bu cihazın localStorage-indən
// (utils/analyticsSeries — /analytics ilə eyni hesab). Son 14 gündə qeyd
// yoxdursa heç nə göstərilmir (boş zolaq yox). MyDay-dən lazy yüklənir.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import { pathFor } from '../../seo/routes'
import { pickUi } from '../../utils/uiText'
import { readStore, buildDays, rangeStats, getDay, catValues, dayScore } from '../../utils/analyticsSeries'
import { toDayKey, pctDelta } from '../viz/scale.js'
import { BentoGrid, KpiCard, makeFormat } from '../viz'
import { PRAYER_SYNC_EVENT } from '../../utils/prayerTracker'
import { isPlainClick } from '../PageLink'
import Icon from '../Icon'

const L = {
  az: { title: 'Mənim həftəm', sub: 'son 7 gün', vs: 'əvvəlki 7 günə görə', prayer: 'Namaz', active: 'Aktiv gün', quran: 'Quran günü', dhikr: 'Zikr', more: 'Ətraflı statistika', trend: 'gündəlik trend' },
  en: { title: 'My week', sub: 'last 7 days', vs: 'vs previous 7 days', prayer: 'Prayers', active: 'Active days', quran: 'Quran days', dhikr: 'Dhikr', more: 'Full statistics', trend: 'daily trend' },
  ru: { title: 'Моя неделя', sub: 'последние 7 дней', vs: 'к предыдущим 7 дням', prayer: 'Намазы', active: 'Активные дни', quran: 'Дни с Кораном', dhikr: 'Зикр', more: 'Подробная статистика', trend: 'тренд по дням' },
  ar: { title: 'أسبوعي', sub: 'آخر 7 أيام', vs: 'مقارنة بالأيام السبعة السابقة', prayer: 'الصلوات', active: 'أيام النشاط', quran: 'أيام القرآن', dhikr: 'الذكر', more: 'الإحصائيات المفصلة', trend: 'الاتجاه اليومي' },
  tr: { title: 'Benim haftam', sub: 'son 7 gün', vs: 'önceki 7 güne göre', prayer: 'Namaz', active: 'Aktif gün', quran: 'Kur’an günü', dhikr: 'Zikir', more: 'Ayrıntılı istatistik', trend: 'günlük eğilim' },
}

/** Saf: həftə göstəriciləri; son 14 gündə heç nə yoxdursa null */
export function weekSummary(days, today) {
  const R = rangeStats(days, today, 7)
  const any = R.cur.score > 0 || R.cur.dhikr > 0 || R.prev.score > 0 || R.prev.dhikr > 0
  if (!any) return null
  const keys = [...R.prevKeys, ...R.keys]
  const per = (fn) => keys.map(k => fn(getDay(days, k)))
  return {
    R,
    spark: {
      prayer: per(d => catValues(d).prayer),
      active: per(d => (dayScore(d) > 0 || d.dhikr > 0 ? 1 : 0)),
      quran: per(d => catValues(d).quran),
      dhikr: per(d => d.dhikr),
    },
  }
}

export default function MyWeek() {
  const { lang } = useLang()
  const l = pickUi(L, lang)
  const f = useMemo(() => makeFormat(lang), [lang])
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const bump = () => setTick(t => t + 1)
    const onVis = () => { if (document.visibilityState === 'visible') bump() }
    window.addEventListener('storage', bump)
    window.addEventListener(PRAYER_SYNC_EVENT, bump)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('storage', bump)
      window.removeEventListener(PRAYER_SYNC_EVENT, bump)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // tick — localStorage dəyişəndə yenidən oxu
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const w = useMemo(() => weekSummary(buildDays(readStore()), toDayKey()), [tick])
  if (!w) return null

  const { cur, prev } = w.R
  const go = (page) => ({
    href: pathFor(page, lang),
    onClick: (e) => { if (isPlainClick(e)) { e.preventDefault(); navigate(pathFor(page, lang)) } },
  })
  const delta = (a, b) => (b > 0 ? { value: pctDelta(a, b), vs: l.vs } : null)
  const kpis = [
    { key: 'p', icon: 'prayer', label: l.prayer, value: f.num(cur.prayers), unit: '/ 35', delta: delta(cur.prayers, prev.prayers), spark: w.spark.prayer, page: 'tracker', tone: 1 },
    { key: 'a', icon: 'calendar', label: l.active, value: f.num(cur.active), unit: '/ 7', delta: delta(cur.active, prev.active), spark: w.spark.active, page: 'dailytracker', tone: 1 },
    { key: 'q', icon: 'quran', label: l.quran, value: f.num(cur.quranDays), unit: '/ 7', delta: delta(cur.quranDays, prev.quranDays), spark: w.spark.quran, page: 'quran', tone: 3 },
    { key: 'z', icon: 'dhikr', label: l.dhikr, value: f.compact(cur.dhikr), delta: delta(cur.dhikr, prev.dhikr), spark: w.spark.dhikr, page: 'dhikr', tone: 2 },
  ]
  const more = go('analytics')

  return (
    <div className="vx-mw" data-testid="my-week" role="group" aria-labelledby="vx-mw-ttl">
      <div className="vx-mw__head">
        <h3 id="vx-mw-ttl" className="vx-mw__title">{l.title} <span className="vx-mw__sub">· {l.sub}</span></h3>
        <a className="ui-link vx-mw__more" {...more}>
          {l.more} <Icon name="arrow" size={14} className="ui-link__arrow ui-flip-rtl" />
        </a>
      </div>
      <BentoGrid className="vx-mw__grid">
        {kpis.map(k => {
          const link = go(k.page)
          return (
            <KpiCard key={k.key} span={3} icon={k.icon} label={k.label} value={k.value} unit={k.unit} lang={lang} tone={k.tone}
              delta={k.delta} spark={k.spark.some(v => v > 0) ? k.spark : null} sparkLabel={`${k.label}: ${l.trend}`}
              href={link.href} onClick={link.onClick} />
          )
        })}
      </BentoGrid>
    </div>
  )
}
