// ═══════════════════════════════════════════════════════
// /dhikr → "Analitika" bento (viz v2)
// Məlumat: 'dhikr_daily_v1' (gündəlik say, utils/myDay — son 60 gün saxlanılır)
// və 'dhikr_session'.log (son 10 tamamlanmış dövrə). Yalnız bu cihaz.
// ═══════════════════════════════════════════════════════
import { useMemo, useState, useCallback } from 'react'
import {
  BentoGrid, ChartCard, KpiCard, LineChart, CalendarHeatmap, RadialBars,
  SegmentBreakdown, CompareBars, ActivityFeed, makeFormat,
} from '../viz'
import { toDayKey, dayKeys } from '../viz/scale.js'
import { InsightsSection, useInsightPeriod, scrollToSel } from './Insights.jsx'
import { pickUi } from '../../utils/uiText'
import { DHIKRS } from '../../data/dhikr'
import { deltaOf, rolling, weekdayAvg, sumOf, countPos, streakBack, bestRun, earliest } from '../../utils/trackerInsights.js'
import { readDhikrDaily, byDhikr, topN } from '../../utils/dhikrInsights.js'

const T = {
  az: {
    title: 'Zikr analitikası', lead: 'Gündəlik zikr sayınızın dinamikası, davamlılıq və hansı zikrləri daha çox etdiyiniz. Gündəlik saylar son 60 gün saxlanılır.',
    empty: 'Hələ zikr qeydi yoxdur. Sayğaca toxunun — hər deyiş bu günün sayına yazılır və dinamika burada görünəcək.', start: 'Sayğaca keç',
    kTotal: 'Zikr', kActive: 'Aktiv gün', kAvg: 'Aktiv gündə orta', kStreak: 'Ardıcıl gün', bestHint: (n) => `ən uzun seriya: ${n} gün`,
    chart: 'Zikr dinamikası', chartSub: 'gündə deyilən zikr; ştrixli xətt — əvvəlki dövr', sCount: 'Zikr',
    rad: 'Davamlılıq', radSub: 'son günlərin neçəsində zikr edilib', r7: 'Son 7 gün', r30: 'Son 30 gün', r60: 'Son 60 gün',
    heat: 'Zikr təqvimi', heatSub: 'hər xana bir gün — tünd = daha çox zikr', cell: (n) => `${n} zikr`,
    seg: 'Zikrlərə görə', segSub: 'son tamamlanmış dövrələr (jurnal son 10 dövrəni saxlayır)', other: 'Digər', segEmpty: 'Hələ tamamlanmış dövrə yoxdur.', rounds: (n) => `${n} dövrə`,
    feedSub: 'tamamlanan dövrələr', cRound: 'Dövrə',
  },
  en: {
    title: 'Dhikr analytics', lead: 'How your daily dhikr count changes, your consistency and which dhikr you say most. Daily counts are kept for 60 days.',
    empty: 'No dhikr logged yet. Tap the counter — each tap is added to today’s count and the trend will appear here.', start: 'Go to the counter',
    kTotal: 'Dhikr', kActive: 'Active days', kAvg: 'Average per active day', kStreak: 'Day streak', bestHint: (n) => `best streak: ${n} days`,
    chart: 'Dhikr over time', chartSub: 'dhikr said per day; dashed line — previous period', sCount: 'Dhikr',
    rad: 'Consistency', radSub: 'on how many recent days you did dhikr', r7: 'Last 7 days', r30: 'Last 30 days', r60: 'Last 60 days',
    heat: 'Dhikr calendar', heatSub: 'each square is a day — darker = more dhikr', cell: (n) => `${n} dhikr`,
    seg: 'By dhikr', segSub: 'recently completed rounds (the log keeps the last 10)', other: 'Other', segEmpty: 'No completed round yet.', rounds: (n) => `${n} rounds`,
    feedSub: 'completed rounds', cRound: 'Round',
  },
  ru: {
    title: 'Аналитика зикра', lead: 'Динамика ежедневного зикра, постоянство и какие зикры вы произносите чаще. Дневные суммы хранятся 60 дней.',
    empty: 'Записей зикра пока нет. Нажимайте на счётчик — каждое нажатие добавляется к сегодняшней сумме, и здесь появится динамика.', start: 'К счётчику',
    kTotal: 'Зикр', kActive: 'Активные дни', kAvg: 'В среднем за активный день', kStreak: 'Дней подряд', bestHint: (n) => `лучшая серия: ${n} дн.`,
    chart: 'Динамика зикра', chartSub: 'зикров за день; пунктир — прошлый период', sCount: 'Зикр',
    rad: 'Постоянство', radSub: 'в скольких из последних дней был зикр', r7: 'Последние 7 дней', r30: 'Последние 30 дней', r60: 'Последние 60 дней',
    heat: 'Календарь зикра', heatSub: 'каждая клетка — день; темнее = больше зикра', cell: (n) => `зикров: ${n}`,
    seg: 'По зикрам', segSub: 'последние завершённые круги (журнал хранит 10)', other: 'Другое', segEmpty: 'Завершённых кругов пока нет.', rounds: (n) => `кругов: ${n}`,
    feedSub: 'завершённые круги', cRound: 'Круг',
  },
  ar: {
    title: 'تحليلات الذكر', lead: 'كيف يتغير عدد ذكرك اليومي، ومداومتك، وأي الأذكار تقولها أكثر. تُحفظ الأعداد اليومية 60 يومًا.',
    empty: 'لا تسجيلات ذكر بعد. اضغط العدّاد — تُضاف كل ضغطة إلى عدد اليوم وسيظهر الاتجاه هنا.', start: 'اذهب إلى العدّاد',
    kTotal: 'الذكر', kActive: 'أيام النشاط', kAvg: 'المتوسط في يوم النشاط', kStreak: 'أيام متتالية', bestHint: (n) => `أطول سلسلة: ${n} يومًا`,
    chart: 'الذكر عبر الزمن', chartSub: 'الذكر في اليوم؛ الخط المتقطع — الفترة السابقة', sCount: 'الذكر',
    rad: 'المداومة', radSub: 'في كم يومًا من الأيام الأخيرة ذكرت', r7: 'آخر 7 أيام', r30: 'آخر 30 يومًا', r60: 'آخر 60 يومًا',
    heat: 'تقويم الذكر', heatSub: 'كل مربع يوم — الأغمق = ذكر أكثر', cell: (n) => `${n} ذكر`,
    seg: 'حسب الذكر', segSub: 'الدورات المكتملة مؤخرًا (يحفظ السجل آخر 10)', other: 'أخرى', segEmpty: 'لا دورة مكتملة بعد.', rounds: (n) => `${n} دورات`,
    feedSub: 'الدورات المكتملة', cRound: 'دورة',
  },
  tr: {
    title: 'Zikir analizi', lead: 'Günlük zikir sayınızın seyri, süreklilik ve en çok hangi zikirleri yaptığınız. Günlük sayılar 60 gün saklanır.',
    empty: 'Henüz zikir kaydı yok. Sayaca dokunun — her dokunuş bugünün sayısına eklenir ve seyir burada görünecek.', start: 'Sayaca git',
    kTotal: 'Zikir', kActive: 'Aktif gün', kAvg: 'Aktif günde ortalama', kStreak: 'Gün serisi', bestHint: (n) => `en uzun seri: ${n} gün`,
    chart: 'Zikrin seyri', chartSub: 'günde yapılan zikir; kesikli çizgi — önceki dönem', sCount: 'Zikir',
    rad: 'Süreklilik', radSub: 'son günlerin kaçında zikir yapıldı', r7: 'Son 7 gün', r30: 'Son 30 gün', r60: 'Son 60 gün',
    heat: 'Zikir takvimi', heatSub: 'her kare bir gün — koyu = daha çok zikir', cell: (n) => `${n} zikir`,
    seg: 'Zikirlere göre', segSub: 'son tamamlanan turlar (günlük son 10 turu saklar)', other: 'Diğer', segEmpty: 'Henüz tamamlanan tur yok.', rounds: (n) => `${n} tur`,
    feedSub: 'tamamlanan turlar', cRound: 'Tur',
  },
}

/** log — səhifənin dövrə jurnalı (canlı); version — hər toxunuşda dəyişən say (gündəlik xəritəni yenidən oxumaq üçün) */
export default function DhikrInsights({ log = [], version, lang }) {
  const t = pickUi(T, lang, 'en')
  const f = useMemo(() => makeFormat(lang), [lang])
  const today = toDayKey()
  const [range, setRange] = useState(30)
  const P = useInsightPeriod(range, today, f, lang)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const daily = useMemo(() => readDhikrDaily(), [version])

  const cur = useMemo(() => P.keys.map(k => daily[k] || 0), [daily, P.keys])
  const prev = useMemo(() => P.prevKeys.map(k => daily[k] || 0), [daily, P.prevKeys])
  const hasData = Object.keys(daily).length > 0 || log.length > 0

  const active = useCallback((k) => (daily[k] || 0) > 0, [daily])
  const streak = useMemo(() => streakBack(active, today, { max: 400 }), [active, today])
  const best = useMemo(() => bestRun(active, earliest(Object.keys(daily)), today), [active, daily, today])

  const sCur = sumOf(cur), sPrev = sumOf(prev)
  const aCur = countPos(cur), aPrev = countPos(prev)
  const avgCur = aCur ? Math.round(sCur / aCur) : 0
  const avgPrev = aPrev ? Math.round(sPrev / aPrev) : 0
  const activeSeries = cur.map(v => (v > 0 ? 1 : 0))
  const kpis = [
    { key: 's', icon: 'dhikr', label: t.kTotal, value: f.compact(sCur), delta: deltaOf(sCur, sPrev, P.vs), spark: P.b(cur) },
    { key: 'a', icon: 'calendar', label: t.kActive, value: f.num(aCur), unit: `/ ${f.num(P.keys.length)}`, delta: deltaOf(aCur, aPrev, P.vs), spark: P.bucket > 1 ? P.b(activeSeries) : rolling(activeSeries), tone: 3 },
    { key: 'v', icon: 'target', label: t.kAvg, value: f.num(avgCur), delta: deltaOf(avgCur, avgPrev, P.vs), tone: 2 },
    { key: 'k', icon: 'bolt', label: t.kStreak, value: f.num(streak), unit: P.v.days, hint: t.bestHint(f.num(best)), tone: 1 },
  ]

  const consist = [7, 30, 60].map(n => ({ key: n, label: t[`r${n}`], value: countPos(dayKeys(today, n).map(k => daily[k] || 0)), max: n }))
  const heat = useCallback((k) => daily[k] || 0, [daily])
  const wdCur = weekdayAvg(P.keys, cur)
  const wdPrev = weekdayAvg(P.prevKeys, prev)

  const nameOf = useCallback((e) => DHIKRS[e.idx]?.[lang] || DHIKRS[e.idx]?.en || e.name, [lang])
  const segItems = useMemo(() => topN(byDhikr(log, nameOf), 4, t.other)
    .map((it, i) => ({ key: it.label, label: it.label, value: it.value, hint: t.rounds(f.num(it.rounds)), tone: i + 1 })), [log, nameOf, t, f])
  const feed = useMemo(() => log.filter(e => Number(e?.id) > 1e12).slice(0, 6).map(e => ({
    key: e.id, icon: 'dhikr', time: Number(e.id), title: nameOf(e), meta: `×${f.num(Number(e.count) || 0)}`, chip: { label: t.cRound, tone: 'muted' },
  })), [log, nameOf, f, t])

  return (
    <InsightsSection id="dk-ins" title={t.title} lead={t.lead} lang={lang} range={range} onRange={setRange} hasData={hasData}
      empty={{ text: t.empty, action: { label: t.start, icon: 'dhikr', onClick: scrollToSel('.dk-modes-wrap') } }}>
      <BentoGrid>
        {kpis.map(k => (
          <KpiCard key={k.key} span={3} icon={k.icon} label={k.label} value={k.value} unit={k.unit}
            delta={k.delta} hint={k.delta ? undefined : (k.hint || P.v.noPrev)} spark={k.spark} sparkLabel={k.spark ? P.v.sparkOf(k.label) : undefined} tone={k.tone || 1} lang={lang} />
        ))}

        <ChartCard span={8} id="dk-ins-chart" title={t.chart} sub={t.chartSub}>
          <LineChart key={`z-${range}`} height={280} integer label={t.chart} labels={P.labels} xFormat={P.xTick} tooltipTitle={P.tipTitle} lang={lang}
            series={[{ key: 'z', label: t.sCount, values: P.b(cur), compare: P.b(prev), tone: 1 }]} />
        </ChartCard>

        <ChartCard span={4} id="dk-ins-rad" className="ins-half ins-center" icon="target" title={t.rad} sub={t.radSub}>
          <RadialBars layout="concentric" label={t.rad} lang={lang} items={consist.map((it, i) => ({ ...it, tone: i + 1 }))} />
        </ChartCard>

        <ChartCard span={4} id="dk-ins-heat" className="ins-half" title={t.heat} sub={t.heatSub}>
          <CalendarHeatmap data={heat} end={today} maxWeeks={10} label={t.heat} format={(n) => t.cell(f.num(n))} lang={lang} />
        </ChartCard>

        <ChartCard span={4} id="dk-ins-seg" className="ins-half" title={t.seg} sub={t.segSub}>
          {segItems.length ? <SegmentBreakdown label={t.seg} lang={lang} items={segItems} /> : <p className="vz-empty">{t.segEmpty}</p>}
        </ChartCard>

        <ChartCard span={4} id="dk-ins-feed" className="ins-half" title={P.v.feedTitle} sub={t.feedSub}>
          <ActivityFeed items={feed} label={P.v.feedTitle} lang={lang} empty={<p className="vz-empty">{P.v.feedEmpty}</p>} />
        </ChartCard>
        <ChartCard span={12} id="dk-ins-wd" className="ins-wd" title={P.v.wdTitle} sub={P.v.wdSub}>
          <CompareBars label={P.v.wdTitle} lang={lang} currentLabel={P.v.ranges[range]} format={(n) => f.num(n)}
            items={P.wd.map((w, i) => ({ key: i, label: w, value: wdCur[i], prev: wdPrev[i] }))} />
        </ChartCard>

      </BentoGrid>
    </InsightsSection>
  )
}
