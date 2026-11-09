// ═══════════════════════════════════════════════════════
// /dailytracker → "Analitika" bento (viz v2)
// Məlumat: səhifənin öz `data` obyekti (daily_tracker + /prayer statistikası
// birləşmiş) — { 'YYYY-MM-DD': { fajr, …, sadaqah: true } }. Yalnız bu cihaz.
// ═══════════════════════════════════════════════════════
import { useMemo, useState, useCallback } from 'react'
import {
  BentoGrid, ChartCard, KpiCard, RangeTabs, AreaChart, LineChart, CalendarHeatmap,
  SegmentBreakdown, CompareBars, GoalRing, MiniTable, InlineBar, TrendCell, Delta, makeFormat,
} from '../viz'
import { InsightsSection, useInsightPeriod, scrollToSel } from './Insights.jsx'
import { pickUi } from '../../utils/uiText'
import { pctDelta, dayKeys } from '../viz/scale.js'
import { deltaOf, rolling, weekdayAvg, earliest, bestRun, streakBack, trackerGroupsOf, TRACKER_GROUPS } from '../../utils/trackerInsights.js'

const T = {
  az: {
    title: 'Gündəlik ibadət analitikası', lead: 'İşarələdiyiniz 10 əməlin dövr üzrə dinamikası, hansı əməlin daha davamlı olduğu və həftənin günləri.',
    empty: 'Hələ qeyd yoxdur. Bu günün əməllərini işarələyin — dinamika və davamlılıq burada görünəcək.', start: 'Bu günü işarələ',
    kDeeds: 'Edilən əməl', kAvg: 'Orta tamamlanma', kFull: 'Tam gün (10/10)', kStreak: 'Ardıcıl tam gün', best: (n) => `Rekord: ${n}`,
    chart: 'Əməllər dinamikası', chartSub: 'gündə: namaz, Quran, zikr və əzkar, sədəqə', chartCmp: 'gündə edilən əməl; ştrixli xətt — əvvəlki dövr',
    mode: 'Görünüş', mMix: 'Bölgü', mCmp: 'Müqayisə', total: 'Əməllər',
    groups: { prayer: 'Namaz', quran: 'Quran', adhkar: 'Zikr və əzkar', sadaqah: 'Sədəqə' },
    goal: 'Bu gün', goalSub: '10 əməldən neçəsi edilib', center: 'bu gün', now: 'Edilib', left: 'Qalıb', week: 'Son 7 gün ortası',
    heat: 'Əməl təqvimi', heatSub: 'hər xana bir gün — tünd = daha çox əməl', cell: (n) => `${n}/10 əməl`,
    seg: 'Bölgü', segSub: 'dövrdəki əməllər qruplar üzrə və əvvəlki dövrə görə dəyişmə',
    tbl: 'Əməllər üzrə', tblSub: 'neçə gün edilib, davamlılıq və son 8 həftə', cols: { deed: 'Əməl', days: 'Gün', rate: 'Davamlılıq', trend: 'Trend', delta: 'Dəyişmə' },
    trendOf: (s) => `${s}: son 8 həftə`,
  },
  en: {
    title: 'Daily worship analytics', lead: 'How the 10 deeds you mark change over the period, which deed is most consistent, and the days of the week.',
    empty: 'Nothing logged yet. Mark today’s deeds — trends and consistency will appear here.', start: 'Mark today',
    kDeeds: 'Deeds done', kAvg: 'Average completion', kFull: 'Complete days (10/10)', kStreak: 'Complete-day streak', best: (n) => `Best: ${n}`,
    chart: 'Deeds over time', chartSub: 'per day: prayer, Quran, dhikr and adhkar, charity', chartCmp: 'deeds per day; dashed line — previous period',
    mode: 'View', mMix: 'Breakdown', mCmp: 'Compare', total: 'Deeds',
    groups: { prayer: 'Prayer', quran: 'Quran', adhkar: 'Dhikr and adhkar', sadaqah: 'Charity' },
    goal: 'Today', goalSub: 'how many of the 10 deeds are done', center: 'today', now: 'Done', left: 'Remaining', week: 'Last 7 days average',
    heat: 'Deeds calendar', heatSub: 'each square is a day — darker = more deeds', cell: (n) => `${n}/10 deeds`,
    seg: 'Breakdown', segSub: 'deeds in the period by group and change vs the previous period',
    tbl: 'By deed', tblSub: 'days done, consistency and the last 8 weeks', cols: { deed: 'Deed', days: 'Days', rate: 'Consistency', trend: 'Trend', delta: 'Change' },
    trendOf: (s) => `${s}: last 8 weeks`,
  },
  ru: {
    title: 'Аналитика ежедневных поклонений', lead: 'Как меняются 10 отмечаемых дел за период, какое дело самое постоянное и дни недели.',
    empty: 'Записей пока нет. Отметьте сегодняшние дела — здесь появятся динамика и постоянство.', start: 'Отметить сегодня',
    kDeeds: 'Сделано дел', kAvg: 'Среднее выполнение', kFull: 'Полные дни (10/10)', kStreak: 'Полных дней подряд', best: (n) => `Рекорд: ${n}`,
    chart: 'Динамика дел', chartSub: 'за день: намаз, Коран, зикр и азкары, садака', chartCmp: 'дел за день; пунктир — прошлый период',
    mode: 'Вид', mMix: 'Структура', mCmp: 'Сравнение', total: 'Дела',
    groups: { prayer: 'Намаз', quran: 'Коран', adhkar: 'Зикр и азкары', sadaqah: 'Садака' },
    goal: 'Сегодня', goalSub: 'сколько из 10 дел сделано', center: 'сегодня', now: 'Сделано', left: 'Осталось', week: 'Среднее за 7 дней',
    heat: 'Календарь дел', heatSub: 'каждая клетка — день; темнее = больше дел', cell: (n) => `${n}/10 дел`,
    seg: 'Структура', segSub: 'дела периода по группам и изменение к прошлому периоду',
    tbl: 'По делам', tblSub: 'сколько дней, постоянство и последние 8 недель', cols: { deed: 'Дело', days: 'Дни', rate: 'Постоянство', trend: 'Тренд', delta: 'Изменение' },
    trendOf: (s) => `${s}: последние 8 недель`,
  },
  ar: {
    title: 'تحليلات العبادات اليومية', lead: 'كيف تتغير الأعمال العشرة التي تسجّلها خلال الفترة، وأيها أدوم، وأيام الأسبوع.',
    empty: 'لا تسجيلات بعد. سجّل أعمال اليوم — وستظهر هنا الاتجاهات والمداومة.', start: 'سجّل اليوم',
    kDeeds: 'الأعمال المنجزة', kAvg: 'متوسط الإتمام', kFull: 'أيام كاملة (10/10)', kStreak: 'أيام كاملة متتالية', best: (n) => `الأفضل: ${n}`,
    chart: 'الأعمال عبر الزمن', chartSub: 'في اليوم: الصلاة، والقرآن، والذكر والأذكار، والصدقة', chartCmp: 'الأعمال في اليوم؛ الخط المتقطع — الفترة السابقة',
    mode: 'العرض', mMix: 'التوزيع', mCmp: 'المقارنة', total: 'الأعمال',
    groups: { prayer: 'الصلاة', quran: 'القرآن', adhkar: 'الذكر والأذكار', sadaqah: 'الصدقة' },
    goal: 'اليوم', goalSub: 'كم أُنجز من الأعمال العشرة', center: 'اليوم', now: 'أُنجز', left: 'المتبقي', week: 'متوسط آخر 7 أيام',
    heat: 'تقويم الأعمال', heatSub: 'كل مربع يوم — الأغمق = أعمال أكثر', cell: (n) => `${n}/10 أعمال`,
    seg: 'التوزيع', segSub: 'أعمال الفترة حسب المجموعة والتغير مقارنة بالسابقة',
    tbl: 'حسب العمل', tblSub: 'عدد الأيام والمداومة وآخر 8 أسابيع', cols: { deed: 'العمل', days: 'الأيام', rate: 'المداومة', trend: 'الاتجاه', delta: 'التغير' },
    trendOf: (s) => `${s}: آخر 8 أسابيع`,
  },
  tr: {
    title: 'Günlük ibadet analizi', lead: 'İşaretlediğiniz 10 amelin dönem boyunca seyri, hangi amelin daha düzenli olduğu ve haftanın günleri.',
    empty: 'Henüz kayıt yok. Bugünün amellerini işaretleyin — seyir ve süreklilik burada görünecek.', start: 'Bugünü işaretle',
    kDeeds: 'Yapılan amel', kAvg: 'Ortalama tamamlama', kFull: 'Tam gün (10/10)', kStreak: 'Ardışık tam gün', best: (n) => `Rekor: ${n}`,
    chart: 'Amellerin seyri', chartSub: 'günde: namaz, Kur’an, zikir ve ezkar, sadaka', chartCmp: 'günde yapılan amel; kesikli çizgi — önceki dönem',
    mode: 'Görünüm', mMix: 'Dağılım', mCmp: 'Karşılaştırma', total: 'Ameller',
    groups: { prayer: 'Namaz', quran: 'Kur’an', adhkar: 'Zikir ve ezkar', sadaqah: 'Sadaka' },
    goal: 'Bugün', goalSub: '10 amelden kaçı yapıldı', center: 'bugün', now: 'Yapıldı', left: 'Kalan', week: 'Son 7 gün ortalaması',
    heat: 'Amel takvimi', heatSub: 'her kare bir gün — koyu = daha çok amel', cell: (n) => `${n}/10 amel`,
    seg: 'Dağılım', segSub: 'dönemdeki ameller gruplara göre ve önceki döneme göre değişim',
    tbl: 'Amellere göre', tblSub: 'kaç gün yapıldı, süreklilik ve son 8 hafta', cols: { deed: 'Amel', days: 'Gün', rate: 'Süreklilik', trend: 'Eğilim', delta: 'Değişim' },
    trendOf: (s) => `${s}: son 8 hafta`,
  },
}

/** activities: [{ key, label }] — səhifənin ACTIVITIES siyahısı (10 əməl, dilə görə ad) */
export default function DailyTrackerInsights({ data, activities, today, lang }) {
  const t = pickUi(T, lang, 'en')
  const f = useMemo(() => makeFormat(lang), [lang])
  const [range, setRange] = useState(30)
  const [mode, setMode] = useState('mix')
  const P = useInsightPeriod(range, today, f, lang)
  const keys10 = useMemo(() => activities.map(a => a.key), [activities])
  const N = keys10.length

  const first = useMemo(() => earliest(Object.keys(data || {}).filter(k => keys10.some(a => data[k]?.[a] === true))), [data, keys10])
  const countOf = useCallback((k) => (k > today ? 0 : keys10.filter(a => data?.[k]?.[a] === true).length), [data, keys10, today])

  const calc = useCallback((keys) => {
    const per = keys.map(countOf)
    const groups = Object.fromEntries(TRACKER_GROUPS.map(g => [g, keys.map(k => trackerGroupsOf(data?.[k])[g])]))
    const eff = first ? keys.filter(k => k >= first && k <= today).length : 0
    const perDeed = Object.fromEntries(keys10.map(a => [a, keys.filter(k => data?.[k]?.[a] === true).length]))
    const total = per.reduce((s, v) => s + v, 0)
    return { per, groups, eff, perDeed, total, full: per.filter(v => v === N).length,
      avgPct: eff ? (total / (eff * N)) * 100 : 0,
      gTotal: Object.fromEntries(TRACKER_GROUPS.map(g => [g, groups[g].reduce((s, v) => s + v, 0)])) }
  }, [countOf, data, first, keys10, N, today])

  const cur = useMemo(() => calc(P.keys), [calc, P.keys])
  const prev = useMemo(() => calc(P.prevKeys), [calc, P.prevKeys])

  const isFull = useCallback((k) => countOf(k) === N, [countOf, N])
  const streak = useMemo(() => streakBack(isFull, today), [isFull, today])
  const best = useMemo(() => (first ? bestRun(isFull, first, today) : 0), [isFull, first, today])

  const fullSeries = cur.per.map(v => (v === N ? 1 : 0))
  const pctSeries = cur.per.map(v => Math.round((v / N) * 100))
  const kpis = [
    { key: 'd', icon: 'dailytracker', label: t.kDeeds, value: f.num(cur.total), delta: deltaOf(cur.total, prev.total, P.vs), spark: P.b(cur.per) },
    { key: 'a', icon: 'target', label: t.kAvg, value: f.pct(cur.avgPct, 0), delta: deltaOf(cur.avgPct, prev.avgPct, P.vs), spark: P.bucket > 1 ? P.b(pctSeries) : pctSeries, tone: 2 },
    { key: 'f', icon: 'star', label: t.kFull, value: f.num(cur.full), unit: `/ ${f.num(cur.eff)}`, delta: deltaOf(cur.full, prev.full, P.vs), spark: P.bucket > 1 ? P.b(fullSeries) : rolling(fullSeries), tone: 3 },
    { key: 's', icon: 'bolt', label: t.kStreak, value: f.num(streak), hint: t.best(f.num(best)), tone: 1 },
  ]

  const todayN = countOf(today)
  const last7 = P.keys.slice(-7).map(countOf)
  const avg7 = Math.round((last7.reduce((s, v) => s + v, 0) / (7 * N)) * 100)

  const heat = useCallback((k) => countOf(k), [countOf])
  const wdCur = weekdayAvg(P.keys, cur.per)
  const wdPrev = weekdayAvg(P.prevKeys, prev.per)

  const rows = useMemo(() => {
    const keys56 = dayKeys(today, 56)
    return activities.map(a => {
      const daily = keys56.map(k => (data?.[k]?.[a.key] === true ? 1 : 0))
      const trend = []
      for (let i = 0; i < 8; i++) trend.push(daily.slice(i * 7, i * 7 + 7).reduce((s, v) => s + v, 0))
      return { key: a.key, label: a.label, days: cur.perDeed[a.key], prev: prev.perDeed[a.key], rate: cur.eff ? (cur.perDeed[a.key] / cur.eff) * 100 : 0, trend }
    })
  }, [activities, data, cur, prev, today])

  return (
    <InsightsSection id="dt-ins" title={t.title} lead={t.lead} lang={lang} range={range} onRange={setRange} hasData={!!first}
      empty={{ text: t.empty, action: { label: t.start, icon: 'check', onClick: scrollToSel('.tracker-top') } }}>
      <BentoGrid>
        {kpis.map(k => (
          <KpiCard key={k.key} span={3} icon={k.icon} label={k.label} value={k.value} unit={k.unit}
            delta={k.delta} hint={k.hint || (k.delta ? undefined : P.v.noPrev)} spark={k.spark} sparkLabel={k.spark ? P.v.sparkOf(k.label) : undefined} tone={k.tone || 1} lang={lang} />
        ))}

        <ChartCard span={8} id="dt-ins-chart" title={t.chart} sub={mode === 'mix' ? t.chartSub : t.chartCmp}
          actions={<RangeTabs options={[{ value: 'mix', label: t.mMix }, { value: 'cmp', label: t.mCmp }]} value={mode} onChange={setMode} label={t.mode} />}>
          {mode === 'mix' ? (
            <AreaChart key={`m-${range}`} mode="stacked" height={280} integer label={t.chart} labels={P.labels} xFormat={P.xTick} tooltipTitle={P.tipTitle} lang={lang}
              series={TRACKER_GROUPS.map((g, i) => ({ key: g, label: t.groups[g], values: P.b(cur.groups[g]), tone: i + 1 }))} />
          ) : (
            <LineChart key={`c-${range}`} height={280} integer label={t.chart} labels={P.labels} xFormat={P.xTick} tooltipTitle={P.tipTitle} lang={lang}
              series={[{ key: 'd', label: t.total, values: P.b(cur.per), compare: P.b(prev.per), tone: 1 }]} />
          )}
        </ChartCard>

        <ChartCard span={4} id="dt-ins-goal" className="ins-half ins-center" icon="dailytracker" title={t.goal} sub={t.goalSub}>
          <GoalRing value={todayN} goal={N} centerLabel={t.center} label={t.goal} lang={lang}
            rows={[
              { label: t.now, value: `${f.num(todayN)} / ${f.num(N)}` },
              { label: t.left, value: f.num(N - todayN) },
              { label: t.week, value: f.pct(avg7, 0), strong: true },
            ]} />
        </ChartCard>

        <ChartCard span={8} id="dt-ins-heat" title={t.heat} sub={t.heatSub}>
          <CalendarHeatmap data={heat} end={today} maxWeeks={26} label={t.heat} thresholds={[3, 6, 9]} format={(n) => t.cell(f.num(n))} lang={lang} />
        </ChartCard>

        <ChartCard span={4} id="dt-ins-seg" className="ins-half" title={t.seg} sub={t.segSub}>
          <SegmentBreakdown label={t.seg} lang={lang}
            items={TRACKER_GROUPS.map((g, i) => ({ key: g, label: t.groups[g], value: cur.gTotal[g], prev: prev.gTotal[g], tone: i + 1 }))} />
        </ChartCard>

        <ChartCard span={7} id="dt-ins-tbl" title={t.tbl} sub={t.tblSub} flush>
          <MiniTable caption={t.tbl} rows={rows} columns={[
            { key: 'label', label: t.cols.deed },
            { key: 'days', label: t.cols.days, align: 'end', render: r => <span className="ui-num">{f.num(r.days)}</span> },
            { key: 'rate', label: t.cols.rate, render: r => <InlineBar value={Math.round(r.rate)} max={100} label={`${r.label}: ${f.pct(r.rate, 0)}`} lang={lang} /> },
            { key: 'trend', label: t.cols.trend, hideSm: true, render: r => <TrendCell values={r.trend} label={t.trendOf(r.label)} /> },
            { key: 'delta', label: t.cols.delta, align: 'end', render: r => (pctDelta(r.days, r.prev) == null ? <span className="vz-trend--none">—</span> : <Delta value={pctDelta(r.days, r.prev)} vs={false} lang={lang} />) },
          ]} />
        </ChartCard>

        <ChartCard span={5} id="dt-ins-wd" className="ins-half" title={P.v.wdTitle} sub={P.v.wdSub}>
          <CompareBars label={P.v.wdTitle} lang={lang} currentLabel={P.v.ranges[range]} format={(n) => f.num(n)} max={N}
            items={P.wd.map((w, i) => ({ key: i, label: w, value: wdCur[i], prev: wdPrev[i] }))} />
        </ChartCard>
      </BentoGrid>
    </InsightsSection>
  )
}
