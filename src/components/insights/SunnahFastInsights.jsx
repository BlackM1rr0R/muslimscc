// ═══════════════════════════════════════════════════════
// Təqvim → Sünnə orucları: "Analitika" bento (viz v2)
// Məlumat: istifadəçinin qeyd etdiyi oruc günləri ('muslim_cc_sunnah_fasts_v1').
// Günün növü CalSunnahFasts.fastStatus (hicri tarix + həftə günü) ilə — yeni
// fiqh hökmü əlavə olunmur, yalnız mövcud siyahının səbəbləri sayılır.
// CalSunnahFasts bölməsinin içində göstərilir (ayrıca <section> deyil).
// ═══════════════════════════════════════════════════════
import { useMemo, useState, useCallback } from 'react'
import {
  BentoGrid, ChartCard, KpiCard, RangeTabs, LineChart, CalendarHeatmap,
  SegmentBreakdown, CompareBars, ActivityFeed, makeFormat,
} from '../viz'
import { fromDayKey, addDayKey } from '../viz/scale.js'
import { insText } from './Insights.jsx'
import { pickUi } from '../../utils/uiText'
import { RANGES, periodKeys, bucketEnd, bucketLabels, deltaOf, weekdayNames } from '../../utils/trackerInsights.js'
import { FAST_GROUPS, fastGroup, fastStats } from '../../utils/sunnahFastInsights.js'
import '../../styles/Insights.css'

const T = {
  az: {
    title: 'Oruclarınızın analitikası', lead: 'Qeyd etdiyiniz könüllü orucların dinamikası, sünnə günlərindən neçəsini tutduğunuz və həftənin günləri.',
    empty: 'Hələ oruc qeydi yoxdur. Yuxarıdakı «Bu gün oruc tuturam» düyməsi və ya son 7 günün xanaları ilə qeyd edin — analiz burada görünəcək.', start: 'Bu günü qeyd et',
    kQada: 'Ramazan qəzası qalıb', kQadaHint: 'gün · qəza izləyicisindən', kFasts: 'Tutulan oruc', kKept: 'Tutulan sünnə günü', kWeeks: 'Oruclu həftə',
    chart: 'Oruc dinamikası', chartSubW: 'həftədə tutulan oruc; ştrixli xətt — əvvəlki dövr', chartSubD: 'gündə tutulan oruc; ştrixli xətt — əvvəlki dövr', sFasts: 'Oruc',
    heat: 'Oruc təqvimi', heatSub: 'tünd xana — sünnə günündə tutulan oruc', cellSunnah: 'sünnə günündə oruc', cellOther: 'könüllü oruc',
    seg: 'Oruc növləri', segSub: 'dövrdə tutulanlar və əvvəlki dövrə görə dəyişmə',
    groups: { monthu: 'Bazar ertəsi, cümə axşamı', bid: 'Ağ günlər (13–15)', special: 'Aşura, Tasua, Ərəfə, Şəvval', other: 'Digər günlər' },
    wdSub: 'dövrdə tutulan oruc — bazar ertəsi və cümə axşamı sünnə günləridir (Tirmizi 747)',
    feedSub: 'son qeyd olunan oruclar', cSunnah: 'Sünnə', cVol: 'Könüllü', fOther: 'Könüllü oruc',
  },
  en: {
    title: 'Your fasting analytics', lead: 'How your logged voluntary fasts change over time, how many Sunnah days you kept, and the days of the week.',
    empty: 'No fasts logged yet. Use “I am fasting today” above or the last-7-days squares — the analysis will appear here.', start: 'Log today',
    kQada: 'Ramadan fasts to make up', kQadaHint: 'days · from the qada tracker', kFasts: 'Fasts kept', kKept: 'Sunnah days kept', kWeeks: 'Weeks with a fast',
    chart: 'Fasting over time', chartSubW: 'fasts per week; dashed line — previous period', chartSubD: 'fasts per day; dashed line — previous period', sFasts: 'Fasts',
    heat: 'Fasting calendar', heatSub: 'dark square — a fast kept on a Sunnah day', cellSunnah: 'fast on a Sunnah day', cellOther: 'voluntary fast',
    seg: 'Types of fast', segSub: 'kept in the period and change vs the previous period',
    groups: { monthu: 'Monday, Thursday', bid: 'White days (13–15)', special: 'Ashura, Tasu‘a, Arafah, Shawwal', other: 'Other days' },
    wdSub: 'fasts kept in the period — Monday and Thursday are Sunnah days (at-Tirmidhi 747)',
    feedSub: 'your latest logged fasts', cSunnah: 'Sunnah', cVol: 'Voluntary', fOther: 'Voluntary fast',
  },
  ru: {
    title: 'Аналитика ваших постов', lead: 'Динамика отмеченных добровольных постов, сколько желательных дней вы соблюли и дни недели.',
    empty: 'Постов пока не отмечено. Нажмите «Сегодня я пощусь» выше или клетки последних 7 дней — здесь появится анализ.', start: 'Отметить сегодня',
    kQada: 'Осталось восполнить постов', kQadaHint: 'дн. · из трекера каза', kFasts: 'Соблюдено постов', kKept: 'Соблюдено дней сунны', kWeeks: 'Недели с постом',
    chart: 'Динамика постов', chartSubW: 'постов в неделю; пунктир — прошлый период', chartSubD: 'постов в день; пунктир — прошлый период', sFasts: 'Посты',
    heat: 'Календарь постов', heatSub: 'тёмная клетка — пост в день сунны', cellSunnah: 'пост в день сунны', cellOther: 'добровольный пост',
    seg: 'Виды постов', segSub: 'соблюдено за период и изменение к прошлому периоду',
    groups: { monthu: 'Понедельник, четверг', bid: 'Белые дни (13–15)', special: 'Ашура, Тасуа, Арафа, шавваль', other: 'Другие дни' },
    wdSub: 'постов за период — понедельник и четверг относятся к сунне (ат-Тирмизи 747)',
    feedSub: 'последние отмеченные посты', cSunnah: 'Сунна', cVol: 'Добровольный', fOther: 'Добровольный пост',
  },
  ar: {
    title: 'تحليلات صيامك', lead: 'كيف يتغير صيام التطوع الذي سجّلته، وكم صمت من أيام السنة، وأيام الأسبوع.',
    empty: 'لا صيام مسجّل بعد. استخدم «أنا صائم اليوم» أعلاه أو مربعات آخر 7 أيام — وسيظهر التحليل هنا.', start: 'سجّل اليوم',
    kQada: 'المتبقي من قضاء رمضان', kQadaHint: 'يوم · من متتبّع القضاء', kFasts: 'الأيام المصومة', kKept: 'أيام السنة المصومة', kWeeks: 'أسابيع فيها صيام',
    chart: 'الصيام عبر الزمن', chartSubW: 'الصيام في الأسبوع؛ الخط المتقطع — الفترة السابقة', chartSubD: 'الصيام في اليوم؛ الخط المتقطع — الفترة السابقة', sFasts: 'الصيام',
    heat: 'تقويم الصيام', heatSub: 'المربع الأغمق — صيام في يوم من أيام السنة', cellSunnah: 'صيام في يوم سنة', cellOther: 'صيام تطوع',
    seg: 'أنواع الصيام', segSub: 'ما صمته في الفترة والتغير مقارنة بالسابقة',
    groups: { monthu: 'الاثنين والخميس', bid: 'الأيام البيض (13–15)', special: 'عاشوراء وتاسوعاء وعرفة وشوال', other: 'أيام أخرى' },
    wdSub: 'الصيام في الفترة — الاثنين والخميس من أيام السنة (الترمذي 747)',
    feedSub: 'آخر ما سجّلته من صيام', cSunnah: 'سنة', cVol: 'تطوع', fOther: 'صيام تطوع',
  },
  tr: {
    title: 'Oruç analiziniz', lead: 'İşaretlediğiniz nafile oruçların seyri, sünnet günlerinin kaçında oruç tuttuğunuz ve haftanın günleri.',
    empty: 'Henüz oruç kaydı yok. Yukarıdaki «Bugün oruçluyum» düğmesini veya son 7 günün karelerini kullanın — analiz burada görünecek.', start: 'Bugünü işaretle',
    kQada: 'Kalan Ramazan kazası', kQadaHint: 'gün · kaza takibinden', kFasts: 'Tutulan oruç', kKept: 'Tutulan sünnet günü', kWeeks: 'Oruçlu hafta',
    chart: 'Oruçların seyri', chartSubW: 'haftada tutulan oruç; kesikli çizgi — önceki dönem', chartSubD: 'günde tutulan oruç; kesikli çizgi — önceki dönem', sFasts: 'Oruç',
    heat: 'Oruç takvimi', heatSub: 'koyu kare — sünnet gününde tutulan oruç', cellSunnah: 'sünnet gününde oruç', cellOther: 'nafile oruç',
    seg: 'Oruç türleri', segSub: 'dönemde tutulanlar ve önceki döneme göre değişim',
    groups: { monthu: 'Pazartesi, perşembe', bid: 'Beyaz günler (13–15)', special: 'Aşure, Tasua, Arefe, Şevval', other: 'Diğer günler' },
    wdSub: 'dönemde tutulan oruç — pazartesi ve perşembe sünnet günleridir (Tirmizî 747)',
    feedSub: 'en son işaretlenen oruçlar', cSunnah: 'Sünnet', cVol: 'Nafile', fOther: 'Nafile oruç',
  },
}
const GROUP_TONE = { monthu: 1, bid: 2, special: 3, other: 'muted' }

/**
 * log: Set<'YYYY-MM-DD'>; statusOf(key) → fastStatus(...); reasonName(r) → səbəbin adı (dilə görə)
 * onStart — boş vəziyyətdə "bu günü qeyd et"
 */
export default function SunnahFastInsights({ log, today, lang, statusOf, reasonName, onStart, qadaOwed = 0 }) {
  const t = pickUi(T, lang, 'en')
  const v = insText(lang)
  const f = useMemo(() => makeFormat(lang), [lang])
  const [range, setRange] = useState(90)

  // Hicri hesab bahalıdır — gün başına bir dəfə
  const cache = useMemo(() => new Map(), [])
  const st = useCallback((k) => { if (!cache.has(k)) cache.set(k, statusOf(k)); return cache.get(k) }, [cache, statusOf])

  const { keys, prevKeys } = useMemo(() => periodKeys(today, range), [today, range])
  const cur = useMemo(() => fastStats(log, keys, st), [log, keys, st])
  const prev = useMemo(() => fastStats(log, prevKeys, st), [log, prevKeys, st])
  const bucket = range === 7 ? 1 : 7
  const b = (vals) => bucketEnd(vals, bucket)
  const labels = bucketLabels(keys, bucket)
  const xTick = (k) => (k ? f.date(fromDayKey(k), range === 364 ? { month: 'short' } : { day: 'numeric', month: 'short' }) : '')
  const tipTitle = (k) => {
    if (!k) return ''
    if (bucket === 1) return f.date(fromDayKey(k), { weekday: 'short', day: 'numeric', month: 'long' })
    return `${f.date(fromDayKey(k), { day: 'numeric', month: 'short' })} – ${f.date(fromDayKey(addDayKey(k, bucket - 1)), { day: 'numeric', month: 'short', year: 'numeric' })}`
  }
  const vs = v.vs(range)
  const wd = weekdayNames(f.date)
  const hasData = log.size > 0
  const weeksN = Math.ceil(range / 7)

  const kpis = [
    { key: 'f', icon: 'ramadan', label: t.kFasts, value: f.num(cur.fasts), delta: deltaOf(cur.fasts, prev.fasts, vs), spark: b(cur.perDay).length > 1 ? b(cur.perDay) : undefined },
    { key: 'k', icon: 'star', label: t.kKept, value: f.num(cur.kept), unit: `/ ${f.num(cur.sunnahDays)}`, delta: deltaOf(cur.kept, prev.kept, vs), tone: 3 },
    { key: 'w', icon: 'calendar', label: t.kWeeks, value: f.num(cur.weeks), unit: `/ ${f.num(weeksN)}`, delta: deltaOf(cur.weeks, prev.weeks, vs), tone: 2 },
    { key: 'q', icon: 'qada', label: t.kQada, value: f.num(qadaOwed), hint: t.kQadaHint, tone: 4 },
  ]

  const heat = useCallback((k) => {
    if (!log.has(k)) return 0
    const s = st(k)
    return Array.isArray(s) && s.length ? 4 : 2
  }, [log, st])

  const feed = useMemo(() => [...log].filter(k => k <= today).sort().reverse().slice(0, 6).map(k => {
    const s = st(k)
    const reasons = Array.isArray(s) ? s : []
    const g = fastGroup(s)
    return {
      key: k, time: k, icon: reasons.length ? 'star' : 'ramadan',
      title: reasons.length ? reasons.map(reasonName).join(' · ') : t.fOther,
      chip: g === 'other' ? { label: t.cVol, tone: 'muted' } : { label: t.cSunnah, tone: g === 'special' ? 'accent' : undefined },
    }
  }), [log, today, st, reasonName, t])

  if (!hasData) {
    return (
      <div className="ins cal-sf-ins" data-testid="sunnah-insights">
        <div className="ins-head">
          <div className="ins-head__text">
            <span className="ui-eyebrow">{v.eyebrow}</span>
            <h3 className="cal-sf__h">{t.title}</h3>
          </div>
        </div>
        <div className="ins-empty ui-card" role="status">
          <div className="ins-empty__body">
            <p className="ins-empty__text">{t.empty}</p>
            {onStart && <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={onStart}>{t.start}</button>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ins cal-sf-ins" data-testid="sunnah-insights" role="group" aria-labelledby="cal-sf-ins-h">
      <div className="ins-head">
        <div className="ins-head__text">
          <span className="ui-eyebrow">{v.eyebrow}</span>
          <h3 className="cal-sf__h" id="cal-sf-ins-h">{t.title}</h3>
          <p className="ins-private">{t.lead}</p>
        </div>
        <div className="ins-head__tools">
          <RangeTabs options={RANGES.map(n => ({ value: n, label: v.ranges[n] }))} value={range} onChange={setRange} label={v.period} />
        </div>
      </div>
      <BentoGrid>
        {kpis.map(k => (
          <KpiCard key={k.key} span={3} icon={k.icon} label={k.label} value={k.value} unit={k.unit}
            delta={k.delta || null} hint={k.hint || (k.delta ? undefined : v.noPrev)} spark={k.spark} sparkLabel={k.spark ? v.sparkOf(k.label) : undefined} tone={k.tone || 1} lang={lang} />
        ))}

        <ChartCard span={8} id="sf-ins-chart" headingLevel="h4" title={t.chart} sub={bucket > 1 ? t.chartSubW : t.chartSubD}>
          <LineChart key={range} height={240} integer label={t.chart} labels={labels} xFormat={xTick} tooltipTitle={tipTitle} lang={lang}
            series={[{ key: 'f', label: t.sFasts, values: b(cur.perDay), compare: b(prev.perDay), tone: 1 }]} />
        </ChartCard>

        <ChartCard span={4} id="sf-ins-seg" className="ins-half" headingLevel="h4" title={t.seg} sub={t.segSub}>
          <SegmentBreakdown label={t.seg} lang={lang}
            items={FAST_GROUPS.map(g => ({ key: g, label: t.groups[g], value: cur.groups[g], prev: prev.groups[g], tone: GROUP_TONE[g] }))} />
        </ChartCard>

        <ChartCard span={4} id="sf-ins-wd" className="ins-half ins-wd-sf" headingLevel="h4" title={v.wdTitle} sub={t.wdSub}>
          <CompareBars label={v.wdTitle} lang={lang} currentLabel={v.ranges[range]} format={(n) => f.num(n)}
            items={wd.map((w, i) => ({ key: i, label: w, value: cur.weekday[i], prev: prev.weekday[i] }))} />
        </ChartCard>

        <ChartCard span={4} id="sf-ins-heat" className="ins-half" headingLevel="h4" title={t.heat} sub={t.heatSub}>
          <CalendarHeatmap data={heat} end={today} maxWeeks={26} thresholds={[1, 2, 3]} label={t.heat}
            format={(n) => (n >= 4 ? t.cellSunnah : t.cellOther)} lang={lang} />
        </ChartCard>

        <ChartCard span={4} id="sf-ins-feed" className="ins-half" headingLevel="h4" title={v.feedTitle} sub={t.feedSub}>
          <ActivityFeed items={feed} label={v.feedTitle} lang={lang} empty={<p className="vz-empty">{v.feedEmpty}</p>} />
        </ChartCard>
      </BentoGrid>
    </div>
  )
}
