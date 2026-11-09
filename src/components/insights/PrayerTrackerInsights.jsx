// ═══════════════════════════════════════════════════════
// /prayer-tracker → "Analitika" bento (viz v2)
// Məlumat: utils/prayerTracker snapshot (qıldım / qəza / qılmadım) + heyz/nifas
// dövrləri (üzrlü günlər sayılmır və seriyanı qırmır). Yalnız bu cihaz.
// ═══════════════════════════════════════════════════════
import { useMemo, useState, useCallback } from 'react'
import {
  BentoGrid, ChartCard, KpiCard, RangeTabs, AreaChart, LineChart, CalendarHeatmap, RadialBars,
  SegmentBreakdown, CompareBars, GoalRing, ActivityFeed, makeFormat,
} from '../viz'
import { InsightsSection, useInsightPeriod, scrollToSel } from './Insights.jsx'
import { pickUi } from '../../utils/uiText'
import { PRAYERS, dayState, earliestDate, computeStreak, bestStreak } from '../../utils/prayerTracker'
import { PRAYER_NAMES } from '../../data/prayerTrackerText'
import { deltaOf, rolling, weekdayAvg, sumOf } from '../../utils/trackerInsights.js'
import { addDayKey } from '../viz/scale.js'

const MILESTONES = [3, 7, 14, 30, 60, 100]
const nextMilestone = (n) => MILESTONES.find(m => m > n) || Math.ceil((n + 1) / 100) * 100

const T = {
  az: {
    title: 'Namaz analitikası', lead: 'Qeyd etdiyiniz namazların dövr üzrə dinamikası, hansı namazın daha çox buraxıldığı və həftənin günləri.',
    empty: 'Hələ qeyd yoxdur. Bu günün namazlarını işarələyin — dinamika, faizlər və seriya burada görünəcək.', start: 'Bu günü qeyd et',
    kDone: 'Qılınan namaz', kOnTime: 'Vaxtında', kFull: 'Tam gün (5/5)', kMissed: 'Buraxılan',
    chart: 'Namazlar dinamikası', chartSub: 'gündə: vaxtında, qəza və qılınmayan', chartCmp: 'gündə qılınan; ştrixli xətt — əvvəlki dövr',
    mode: 'Görünüş', mMix: 'Bölgü', mCmp: 'Müqayisə',
    sPrayed: 'Vaxtında', sQada: 'Qəza ilə', sMissed: 'Qılınmayıb', sUnmarked: 'Qeyd yoxdur', performed: 'Qılınan',
    goal: 'Növbəti mərhələ', goalSub: (n) => `${n} günlük ardıcıl seriyaya qədər`, now: 'İndi', left: 'Qalıb', best: 'Rekord', eta: 'Hər gün davam etsəniz',
    unitDays: 'gün', heat: 'Namaz təqvimi', heatSub: 'hər xana bir gün — tünd = daha çox namaz', cell: (n) => `${n}/5 namaz`,
    rad: 'Namazlara görə', radSub: (n) => `dövrün ${n} günündə neçəsi qılınıb`,
    seg: 'Vəziyyətlər', segSub: 'dövrdəki bütün namaz yerləri və əvvəlki dövrə görə dəyişmə',
    feedSub: 'son qeyd olunan günlər', fFull: '5 namazın hamısı qılındı', fPart: (a, q, m) => [`${a} vaxtında`, q ? `${q} qəza` : '', m ? `${m} qılınmayıb` : ''].filter(Boolean).join(' · '),
    cFull: 'Tam', cPart: 'Yarımçıq', cEx: 'Üzrlü', fEx: 'Üzrlü gün (heyz/nifas)',
  },
  en: {
    title: 'Prayer analytics', lead: 'How your logged prayers change over the period, which prayer is missed most, and the days of the week.',
    empty: 'Nothing logged yet. Mark today’s prayers — trends, rates and your streak will appear here.', start: 'Log today',
    kDone: 'Prayers performed', kOnTime: 'On time', kFull: 'Complete days (5/5)', kMissed: 'Missed',
    chart: 'Prayers over time', chartSub: 'per day: on time, made up and missed', chartCmp: 'performed per day; dashed line — previous period',
    mode: 'View', mMix: 'Breakdown', mCmp: 'Compare',
    sPrayed: 'On time', sQada: 'Made up', sMissed: 'Missed', sUnmarked: 'Not logged', performed: 'Performed',
    goal: 'Next milestone', goalSub: (n) => `up to a ${n}-day streak`, now: 'Now', left: 'Remaining', best: 'Best', eta: 'If you keep going daily',
    unitDays: 'days', heat: 'Prayer calendar', heatSub: 'each square is a day — darker = more prayers', cell: (n) => `${n}/5 prayers`,
    rad: 'By prayer', radSub: (n) => `how many of the period’s ${n} days it was performed`,
    seg: 'Statuses', segSub: 'all prayer slots in the period and change vs the previous period',
    feedSub: 'the most recently logged days', fFull: 'All 5 prayers performed', fPart: (a, q, m) => [`${a} on time`, q ? `${q} made up` : '', m ? `${m} missed` : ''].filter(Boolean).join(' · '),
    cFull: 'Complete', cPart: 'Partial', cEx: 'Excused', fEx: 'Excused day (menstruation/postpartum)',
  },
  ru: {
    title: 'Аналитика намазов', lead: 'Как меняются отмеченные намазы за период, какой пропускается чаще и дни недели.',
    empty: 'Записей пока нет. Отметьте сегодняшние намазы — здесь появятся динамика, проценты и серия.', start: 'Отметить сегодня',
    kDone: 'Совершено намазов', kOnTime: 'Вовремя', kFull: 'Полные дни (5/5)', kMissed: 'Пропущено',
    chart: 'Динамика намазов', chartSub: 'за день: вовремя, каза и пропущенные', chartCmp: 'совершено за день; пунктир — прошлый период',
    mode: 'Вид', mMix: 'Структура', mCmp: 'Сравнение',
    sPrayed: 'Вовремя', sQada: 'Каза', sMissed: 'Пропущено', sUnmarked: 'Нет записи', performed: 'Совершено',
    goal: 'Следующий этап', goalSub: (n) => `до серии в ${n} дн.`, now: 'Сейчас', left: 'Осталось', best: 'Рекорд', eta: 'Если продолжать ежедневно',
    unitDays: 'дн.', heat: 'Календарь намазов', heatSub: 'каждая клетка — день; темнее = больше намазов', cell: (n) => `${n}/5 намазов`,
    rad: 'По намазам', radSub: (n) => `в скольких из ${n} дней периода совершён`,
    seg: 'Статусы', segSub: 'все намазы периода и изменение к прошлому периоду',
    feedSub: 'последние отмеченные дни', fFull: 'Совершены все 5 намазов', fPart: (a, q, m) => [`вовремя: ${a}`, q ? `каза: ${q}` : '', m ? `пропущено: ${m}` : ''].filter(Boolean).join(' · '),
    cFull: 'Полный', cPart: 'Неполный', cEx: 'Уважительный', fEx: 'День хайда/нифаса',
  },
  ar: {
    title: 'تحليلات الصلاة', lead: 'كيف تتغير صلواتك المسجّلة خلال الفترة، وأي صلاة تفوتك أكثر، وأيام الأسبوع.',
    empty: 'لا تسجيلات بعد. سجّل صلوات اليوم — وستظهر هنا الاتجاهات والنسب والسلسلة.', start: 'سجّل اليوم',
    kDone: 'الصلوات المؤداة', kOnTime: 'في وقتها', kFull: 'أيام كاملة (5/5)', kMissed: 'الفائتة',
    chart: 'الصلوات عبر الزمن', chartSub: 'في اليوم: في الوقت، وقضاءً، وفائتة', chartCmp: 'المؤداة في اليوم؛ الخط المتقطع — الفترة السابقة',
    mode: 'العرض', mMix: 'التوزيع', mCmp: 'المقارنة',
    sPrayed: 'في وقتها', sQada: 'قضاءً', sMissed: 'فائتة', sUnmarked: 'غير مسجّلة', performed: 'المؤداة',
    goal: 'المرحلة التالية', goalSub: (n) => `حتى سلسلة ${n} يومًا`, now: 'الآن', left: 'المتبقي', best: 'الأفضل', eta: 'إن واظبت يوميًا',
    unitDays: 'يوم', heat: 'تقويم الصلاة', heatSub: 'كل مربع يوم — الأغمق = صلوات أكثر', cell: (n) => `${n}/5 صلوات`,
    rad: 'حسب الصلاة', radSub: (n) => `في كم يومًا من أيام الفترة الـ${n} أُدّيت`,
    seg: 'الحالات', segSub: 'كل الصلوات في الفترة والتغير مقارنة بالسابقة',
    feedSub: 'آخر الأيام المسجّلة', fFull: 'أُدّيت الصلوات الخمس كلها', fPart: (a, q, m) => [`${a} في الوقت`, q ? `${q} قضاءً` : '', m ? `${m} فائتة` : ''].filter(Boolean).join(' · '),
    cFull: 'كامل', cPart: 'ناقص', cEx: 'عذر', fEx: 'يوم عذر (حيض/نفاس)',
  },
  tr: {
    title: 'Namaz analizi', lead: 'İşaretlediğiniz namazların dönem boyunca seyri, hangi namazın daha çok kaçırıldığı ve haftanın günleri.',
    empty: 'Henüz kayıt yok. Bugünün namazlarını işaretleyin — seyir, oranlar ve seri burada görünecek.', start: 'Bugünü işaretle',
    kDone: 'Kılınan namaz', kOnTime: 'Vaktinde', kFull: 'Tam gün (5/5)', kMissed: 'Kaçırılan',
    chart: 'Namazların seyri', chartSub: 'günde: vaktinde, kaza ve kılınmayan', chartCmp: 'günde kılınan; kesikli çizgi — önceki dönem',
    mode: 'Görünüm', mMix: 'Dağılım', mCmp: 'Karşılaştırma',
    sPrayed: 'Vaktinde', sQada: 'Kaza', sMissed: 'Kılınmadı', sUnmarked: 'Kayıt yok', performed: 'Kılınan',
    goal: 'Sonraki aşama', goalSub: (n) => `${n} günlük seriye kadar`, now: 'Şimdi', left: 'Kalan', best: 'Rekor', eta: 'Her gün devam ederseniz',
    unitDays: 'gün', heat: 'Namaz takvimi', heatSub: 'her kare bir gün — koyu = daha çok namaz', cell: (n) => `${n}/5 namaz`,
    rad: 'Namazlara göre', radSub: (n) => `dönemin ${n} gününün kaçında kılındı`,
    seg: 'Durumlar', segSub: 'dönemdeki tüm namaz vakitleri ve önceki döneme göre değişim',
    feedSub: 'en son işaretlenen günler', fFull: '5 vaktin hepsi kılındı', fPart: (a, q, m) => [`${a} vaktinde`, q ? `${q} kaza` : '', m ? `${m} kılınmadı` : ''].filter(Boolean).join(' · '),
    cFull: 'Tam', cPart: 'Eksik', cEx: 'Mazeretli', fEx: 'Mazeretli gün (hayız/nifas)',
  },
}

export default function PrayerTrackerInsights({ snap, periods, today, lang }) {
  const t = pickUi(T, lang, 'en')
  const names = PRAYER_NAMES[lang] || PRAYER_NAMES.en
  const f = useMemo(() => makeFormat(lang), [lang])
  const [range, setRange] = useState(30)
  const [mode, setMode] = useState('mix')
  const P = useInsightPeriod(range, today, f, lang)
  const first = useMemo(() => earliestDate(snap), [snap])

  // Gün → { prayed, qada, missed, performed, excused, statuses }
  const dayOf = useCallback((k) => {
    if (!first || k < first || k > today) return null
    return dayState(snap, periods, k, today)
  }, [snap, periods, today, first])

  const calc = useCallback((keys) => {
    const out = { prayed: 0, qada: 0, missed: 0, unmarked: 0, full: 0, eff: 0, per: Object.fromEntries(PRAYERS.map(p => [p, 0])),
      perPrayed: [], perQada: [], perMissed: [], perDone: [] }
    for (const k of keys) {
      const s = dayOf(k)
      const ex = !s || s.state === 'excused'
      if (!ex) {
        out.eff++
        out.prayed += s.prayed; out.qada += s.qada; out.missed += s.missed
        out.unmarked += PRAYERS.length - s.prayed - s.qada - s.missed
        if (s.state === 'complete') out.full++
        for (const p of PRAYERS) if (s.statuses[p] === 'prayed' || s.statuses[p] === 'qada') out.per[p]++
      }
      out.perPrayed.push(ex ? 0 : s.prayed); out.perQada.push(ex ? 0 : s.qada); out.perMissed.push(ex ? 0 : s.missed)
      out.perDone.push(ex ? 0 : s.performed)
    }
    out.done = out.prayed + out.qada
    out.onTimePct = out.eff ? (out.prayed / (out.eff * 5)) * 100 : 0
    return out
  }, [dayOf])

  const cur = useMemo(() => calc(P.keys), [calc, P.keys])
  const prev = useMemo(() => calc(P.prevKeys), [calc, P.prevKeys])
  const hasData = !!first

  const streak = useMemo(() => computeStreak(snap, periods, today), [snap, periods, today])
  const best = useMemo(() => bestStreak(snap, periods, today), [snap, periods, today])
  const goalN = nextMilestone(streak)

  const fullSeries = cur.perDone.map(v => (v === 5 ? 1 : 0))
  const kpis = [
    { key: 'd', icon: 'prayer', label: t.kDone, value: f.num(cur.done), unit: cur.eff ? `/ ${f.num(cur.eff * 5)}` : undefined, delta: deltaOf(cur.done, prev.done, P.vs), spark: P.b(cur.perDone) },
    { key: 'o', icon: 'clock', label: t.kOnTime, value: f.pct(cur.onTimePct, 0), delta: deltaOf(cur.prayed, prev.prayed, P.vs), spark: P.b(cur.perPrayed), tone: 1 },
    { key: 'f', icon: 'star', label: t.kFull, value: f.num(cur.full), unit: `/ ${f.num(cur.eff)}`, delta: deltaOf(cur.full, prev.full, P.vs), spark: P.bucket > 1 ? P.b(fullSeries) : rolling(fullSeries), tone: 3 },
    { key: 'm', icon: 'alert', label: t.kMissed, value: f.num(cur.missed), delta: deltaOf(cur.missed, prev.missed, P.vs, false), spark: P.b(cur.perMissed), tone: 4 },
  ]

  const heat = useCallback((k) => { const s = dayOf(k); return s && s.state !== 'excused' ? s.performed : 0 }, [dayOf])

  const wdCur = weekdayAvg(P.keys, cur.perDone)
  const wdPrev = weekdayAvg(P.prevKeys, prev.perDone)

  const feed = useMemo(() => {
    const out = []
    for (let i = 0; i < 60 && out.length < 6; i++) {
      const k = addDayKey(today, -i)
      const s = dayOf(k)
      if (!s) continue
      if (s.state === 'excused') { if (s.type) out.push({ key: k, icon: 'moonStar', time: k, title: t.fEx, chip: { label: t.cEx, tone: 'muted' } }); continue }
      if (!s.prayed && !s.qada && !s.missed) continue
      out.push({ key: k, icon: s.state === 'complete' ? 'check' : 'prayer', time: k,
        title: s.state === 'complete' ? t.fFull : t.fPart(f.num(s.prayed), s.qada, s.missed),
        meta: s.state === 'complete' && (s.qada || s.missed) ? t.fPart(f.num(s.prayed), s.qada, s.missed) : undefined,
        chip: s.state === 'complete' ? { label: t.cFull, tone: 'accent' } : { label: t.cPart, tone: 'muted' } })
    }
    return out
  }, [dayOf, today, t, f])

  const segItems = [
    { key: 'p', label: t.sPrayed, value: cur.prayed, prev: prev.prayed, tone: 1 },
    { key: 'q', label: t.sQada, value: cur.qada, prev: prev.qada, tone: 2 },
    { key: 'm', label: t.sMissed, value: cur.missed, prev: prev.missed, tone: 4 },
    { key: 'u', label: t.sUnmarked, value: cur.unmarked, prev: prev.unmarked, tone: 'muted' },
  ]

  return (
    <InsightsSection id="pt-ins" title={t.title} lead={t.lead} lang={lang} range={range} onRange={setRange} hasData={hasData}
      empty={{ text: t.empty, action: { label: t.start, icon: 'check', onClick: scrollToSel('.pt-day') } }}>
      <BentoGrid>
        {kpis.map(k => (
          <KpiCard key={k.key} span={3} icon={k.icon} label={k.label} value={k.value} unit={k.unit}
            delta={k.delta} hint={k.delta ? undefined : P.v.noPrev} spark={k.spark} sparkLabel={P.v.sparkOf(k.label)} tone={k.tone || 1} lang={lang} />
        ))}

        <ChartCard span={8} id="pt-ins-chart" title={t.chart} sub={mode === 'mix' ? t.chartSub : t.chartCmp}
          actions={<RangeTabs options={[{ value: 'mix', label: t.mMix }, { value: 'cmp', label: t.mCmp }]} value={mode} onChange={setMode} label={t.mode} />}>
          {mode === 'mix' ? (
            <AreaChart key={`m-${range}`} mode="stacked" height={280} integer label={t.chart} labels={P.labels} xFormat={P.xTick} tooltipTitle={P.tipTitle} lang={lang}
              series={[
                { key: 'p', label: t.sPrayed, values: P.b(cur.perPrayed), tone: 1 },
                { key: 'q', label: t.sQada, values: P.b(cur.perQada), tone: 2 },
                { key: 'm', label: t.sMissed, values: P.b(cur.perMissed), tone: 4 },
              ]} />
          ) : (
            <LineChart key={`c-${range}`} height={280} integer label={t.chart} labels={P.labels} xFormat={P.xTick} tooltipTitle={P.tipTitle} lang={lang}
              series={[{ key: 'd', label: t.performed, values: P.b(cur.perDone), compare: P.b(prev.perDone), tone: 1 }]} />
          )}
        </ChartCard>

        <ChartCard span={4} id="pt-ins-goal" className="ins-half ins-center" icon="target" title={t.goal} sub={t.goalSub(goalN)}>
          <GoalRing value={streak} goal={goalN} centerLabel={t.unitDays} label={t.goal} lang={lang}
            rows={[
              { label: t.now, value: `${f.num(streak)} ${t.unitDays}` },
              { label: t.left, value: `${f.num(goalN - streak)} ${t.unitDays}` },
              { label: t.best, value: `${f.num(best)} ${t.unitDays}` },
              { label: t.eta, value: f.date(new Date(Date.now() + (goalN - streak) * 864e5), { day: 'numeric', month: 'short', year: 'numeric' }), strong: true },
            ]} />
        </ChartCard>

        <ChartCard span={8} id="pt-ins-heat" title={t.heat} sub={t.heatSub}>
          <CalendarHeatmap data={heat} end={today} maxWeeks={26} label={t.heat} thresholds={[2, 4, 5]} format={(n) => t.cell(f.num(n))} lang={lang} />
        </ChartCard>

        <ChartCard span={4} id="pt-ins-rad" className="ins-half ins-center ins-rad5" icon="prayer" title={t.rad} sub={t.radSub(f.num(cur.eff))}>
          <RadialBars size={56} thickness={6} label={t.rad} lang={lang}
            items={PRAYERS.map(p => ({ key: p, label: names[p], value: cur.per[p], max: cur.eff }))} />
        </ChartCard>

        <ChartCard span={4} id="pt-ins-wd" className="ins-half" title={P.v.wdTitle} sub={P.v.wdSub}>
          <CompareBars label={P.v.wdTitle} lang={lang} currentLabel={P.v.ranges[range]} format={(n) => f.num(n)} max={5}
            items={P.wd.map((w, i) => ({ key: i, label: w, value: wdCur[i], prev: wdPrev[i] }))} />
        </ChartCard>

        <ChartCard span={4} id="pt-ins-seg" className="ins-half" title={t.seg} sub={t.segSub}>
          <SegmentBreakdown label={t.seg} lang={lang} items={sumOf(segItems.map(s => s.value + s.prev)) ? segItems : []} />
        </ChartCard>

        <ChartCard span={4} id="pt-ins-feed" className="ins-half" title={P.v.feedTitle} sub={t.feedSub}>
          <ActivityFeed items={feed} label={P.v.feedTitle} lang={lang} empty={<p className="vz-empty">{P.v.feedEmpty}</p>} />
        </ChartCard>
      </BentoGrid>
    </InsightsSection>
  )
}
