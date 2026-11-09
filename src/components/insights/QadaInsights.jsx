// ═══════════════════════════════════════════════════════
// /qada → "Analitika" bento (viz v2)
// Məlumat: utils/qada.js vəziyyəti ('muslim_cc_qada_v1') — namazlar üzrə qalan
// borc və qılınan qəza (owed/done), oruc, gündəlik hədəf və günlük qeyd (log).
// Temp yalnız istifadəçinin öz qeydlərindən (son 30 gün); keçmiş borc bərpa olunmur.
// ═══════════════════════════════════════════════════════
import { useMemo, useState, useCallback } from 'react'
import {
  BentoGrid, ChartCard, KpiCard, RangeTabs, LineChart, CalendarHeatmap, RadialBars,
  SegmentBreakdown, CompareBars, GoalRing, ActivityFeed, makeFormat,
} from '../viz'
import { InsightsSection, useInsightPeriod, scrollToSel } from './Insights.jsx'
import { pickUi } from '../../utils/uiText'
import { PRAYERS, qadaTotals } from '../../utils/qada'
import { deltaOf, rolling, weekdayAvg } from '../../utils/trackerInsights.js'
import { qadaSeries, qadaPeriod, qadaPace, qadaRecent, finishDate } from '../../utils/qadaInsights.js'

const T = {
  az: {
    title: 'Qəza analitikası', lead: 'Qəza qılınma tempiniz, borcun nə vaxt bitəcəyi və hansı namazda daha çox borc qaldığı — yalnız öz qeydlərinizdən.',
    empty: 'Hələ qəza qeydi yoxdur. Əvvəlcə borcunuzu yazın, sonra hər qəza namazından sonra «Birini qıldım» düyməsinə toxunun — temp və bitmə tarixi burada görünəcək.', start: 'Borcu qeyd et',
    kPrayers: 'Qılınan qəza', kFasts: 'Tutulan qəza orucu', kOwed: 'Qalan borc', kActive: 'Qəza qılınan gün',
    owedHint: (f) => `namaz · üstəlik ${f} oruc`, owedHintNoFast: 'namaz',
    chart: 'Qəza dinamikası', chartSubP: 'gündə qılınan qəza namazı; ştrixli xətt — əvvəlki dövr', chartSubF: 'gündə tutulan qəza orucu; ştrixli xətt — əvvəlki dövr',
    mode: 'Göstərici', mP: 'Namaz', mF: 'Oruc', sP: 'Qəza namazı', sF: 'Qəza orucu', noLog: 'Bu dövrdə qəza qeydi yoxdur.',
    goal: 'Borcun bağlanması', goalSub: 'qılınan qəza / bütün borc', unit: 'namaz', centerLabel: 'qılınıb',
    byGoal: (g) => `Gündə ${g} ilə (hədəfiniz)`, goalNone: '—',
    heat: 'Qəza təqvimi', heatSub: 'hər xana bir gün — tünd = daha çox qəza namazı', cell: (n) => `${n} qəza namazı`,
    rad: 'Namazlara görə', radSub: 'hər namazın borcundan nə qədəri qılınıb',
    seg: 'Qalan borcun bölgüsü', segSub: 'namazlar üzrə qalan qəza', segEmpty: 'Qalan borc yoxdur — Allah qəbul etsin.',
    wdSub: 'gündə orta qəza namazı — bu dövr və əvvəlki dövr',
    feedSub: 'qəza qılınan son günlər', fP: (n) => `${n} qəza namazı qılındı`, fF: (n) => `${n} qəza orucu tutuldu`, fBoth: (p, f) => `${p} qəza namazı · ${f} oruc`,
    cGoal: 'Hədəf', cDay: 'Qeyd',
  },
  en: {
    title: 'Qada analytics', lead: 'Your make-up pace, when the debt would be cleared and which prayer has the most left — from your own records only.',
    empty: 'No make-up records yet. First enter what you owe, then tap “I prayed one” after each make-up prayer — your pace and finish date will appear here.', start: 'Enter your debt',
    kPrayers: 'Prayers made up', kFasts: 'Fasts made up', kOwed: 'Remaining debt', kActive: 'Days with make-up',
    owedHint: (f) => `prayers · plus ${f} fasts`, owedHintNoFast: 'prayers',
    chart: 'Make-up over time', chartSubP: 'make-up prayers per day; dashed line — previous period', chartSubF: 'make-up fasts per day; dashed line — previous period',
    mode: 'Metric', mP: 'Prayers', mF: 'Fasts', sP: 'Make-up prayers', sF: 'Make-up fasts', noLog: 'No make-up logged in this period.',
    goal: 'Clearing the debt', goalSub: 'made up / total debt', unit: 'prayers', centerLabel: 'made up',
    byGoal: (g) => `At ${g} a day (your goal)`, goalNone: '—',
    heat: 'Make-up calendar', heatSub: 'each square is a day — darker = more make-up prayers', cell: (n) => `${n} make-up prayers`,
    rad: 'By prayer', radSub: 'how much of each prayer’s debt is made up',
    seg: 'Remaining debt', segSub: 'make-up prayers still owed, by prayer', segEmpty: 'Nothing left to make up — may Allah accept.',
    wdSub: 'make-up prayers per day on average — this period and the previous one',
    feedSub: 'the latest days with make-up', fP: (n) => `${n} make-up prayers performed`, fF: (n) => `${n} make-up fasts kept`, fBoth: (p, f) => `${p} make-up prayers · ${f} fasts`,
    cGoal: 'Goal', cDay: 'Logged',
  },
  ru: {
    title: 'Аналитика каза', lead: 'Темп восполнения, когда долг будет погашен и по какому намазу осталось больше всего — только по вашим записям.',
    empty: 'Записей каза пока нет. Сначала укажите долг, затем после каждого восполненного намаза нажимайте «Восполнил один» — здесь появятся темп и дата завершения.', start: 'Указать долг',
    kPrayers: 'Восполнено намазов', kFasts: 'Восполнено постов', kOwed: 'Остаток долга', kActive: 'Дни с каза',
    owedHint: (f) => `намазов · и ещё постов: ${f}`, owedHintNoFast: 'намазов',
    chart: 'Динамика каза', chartSubP: 'восполненные намазы за день; пунктир — прошлый период', chartSubF: 'восполненные посты за день; пунктир — прошлый период',
    mode: 'Показатель', mP: 'Намазы', mF: 'Посты', sP: 'Намазы каза', sF: 'Посты каза', noLog: 'За этот период записей каза нет.',
    goal: 'Погашение долга', goalSub: 'восполнено / весь долг', unit: 'нам.', centerLabel: 'восполнено',
    byGoal: (g) => `По ${g} в день (ваша цель)`, goalNone: '—',
    heat: 'Календарь каза', heatSub: 'каждая клетка — день; темнее = больше восполненных намазов', cell: (n) => `намазов каза: ${n}`,
    rad: 'По намазам', radSub: 'какая часть долга каждого намаза восполнена',
    seg: 'Остаток долга', segSub: 'невосполненные намазы по видам', segEmpty: 'Долга не осталось — да примет Аллах.',
    wdSub: 'восполненных намазов в среднем за день — этот и прошлый период',
    feedSub: 'последние дни с каза', fP: (n) => `восполнено намазов: ${n}`, fF: (n) => `восполнено постов: ${n}`, fBoth: (p, f) => `намазов каза: ${p} · постов: ${f}`,
    cGoal: 'Цель', cDay: 'Запись',
  },
  ar: {
    title: 'تحليلات القضاء', lead: 'وتيرة قضائك، ومتى ينتهي الدَّين، وأي صلاة بقي منها أكثر — من سجلاتك أنت فقط.',
    empty: 'لا سجلات قضاء بعد. سجّل أولًا ما عليك، ثم اضغط «قضيتُ واحدة» بعد كل صلاة مقضية — وستظهر هنا الوتيرة وتاريخ الإتمام.', start: 'سجّل ما عليك',
    kPrayers: 'الصلوات المقضية', kFasts: 'الأيام المقضية من الصيام', kOwed: 'المتبقي من الدَّين', kActive: 'أيام فيها قضاء',
    owedHint: (f) => `صلاة · ومعها ${f} يومًا من الصيام`, owedHintNoFast: 'صلاة',
    chart: 'القضاء عبر الزمن', chartSubP: 'الصلوات المقضية في اليوم؛ الخط المتقطع — الفترة السابقة', chartSubF: 'أيام الصيام المقضية في اليوم؛ الخط المتقطع — الفترة السابقة',
    mode: 'المؤشر', mP: 'الصلاة', mF: 'الصيام', sP: 'صلوات مقضية', sF: 'صيام مقضي', noLog: 'لا قضاء مسجّل في هذه الفترة.',
    goal: 'سداد الدَّين', goalSub: 'المقضي / كل الدَّين', unit: 'صلاة', centerLabel: 'مقضي',
    byGoal: (g) => `بمعدل ${g} يوميًا (هدفك)`, goalNone: '—',
    heat: 'تقويم القضاء', heatSub: 'كل مربع يوم — الأغمق = صلوات مقضية أكثر', cell: (n) => `${n} صلوات مقضية`,
    rad: 'حسب الصلاة', radSub: 'كم قُضي من دَين كل صلاة',
    seg: 'المتبقي من الدَّين', segSub: 'الصلوات التي لم تُقضَ بعد، حسب الصلاة', segEmpty: 'لم يبقَ شيء — تقبّل الله.',
    wdSub: 'متوسط الصلوات المقضية في اليوم — هذه الفترة والسابقة',
    feedSub: 'آخر الأيام التي فيها قضاء', fP: (n) => `قُضيت ${n} صلوات`, fF: (n) => `قُضي ${n} من أيام الصيام`, fBoth: (p, f) => `${p} صلوات مقضية · ${f} صيام`,
    cGoal: 'الهدف', cDay: 'مسجّل',
  },
  tr: {
    title: 'Kaza analizi', lead: 'Kaza temponuz, borcun ne zaman biteceği ve hangi namazda en çok borç kaldığı — yalnızca kendi kayıtlarınızdan.',
    empty: 'Henüz kaza kaydı yok. Önce borcunuzu girin, sonra her kaza namazından sonra «Birini kıldım» düğmesine dokunun — tempo ve bitiş tarihi burada görünecek.', start: 'Borcu gir',
    kPrayers: 'Kılınan kaza', kFasts: 'Tutulan kaza orucu', kOwed: 'Kalan borç', kActive: 'Kaza kılınan gün',
    owedHint: (f) => `namaz · ayrıca ${f} oruç`, owedHintNoFast: 'namaz',
    chart: 'Kazanın seyri', chartSubP: 'günde kılınan kaza namazı; kesikli çizgi — önceki dönem', chartSubF: 'günde tutulan kaza orucu; kesikli çizgi — önceki dönem',
    mode: 'Gösterge', mP: 'Namaz', mF: 'Oruç', sP: 'Kaza namazı', sF: 'Kaza orucu', noLog: 'Bu dönemde kaza kaydı yok.',
    goal: 'Borcun kapanması', goalSub: 'kılınan kaza / tüm borç', unit: 'namaz', centerLabel: 'kılındı',
    byGoal: (g) => `Günde ${g} ile (hedefiniz)`, goalNone: '—',
    heat: 'Kaza takvimi', heatSub: 'her kare bir gün — koyu = daha çok kaza namazı', cell: (n) => `${n} kaza namazı`,
    rad: 'Namazlara göre', radSub: 'her namazın borcunun ne kadarı kılındı',
    seg: 'Kalan borcun dağılımı', segSub: 'namazlara göre kalan kaza', segEmpty: 'Kalan borç yok — Allah kabul etsin.',
    wdSub: 'günde ortalama kaza namazı — bu dönem ve önceki dönem',
    feedSub: 'kaza kılınan son günler', fP: (n) => `${n} kaza namazı kılındı`, fF: (n) => `${n} kaza orucu tutuldu`, fBoth: (p, f) => `${p} kaza namazı · ${f} oruç`,
    cGoal: 'Hedef', cDay: 'Kayıt',
  },
}

export default function QadaInsights({ state, today, lang, names }) {
  const t = pickUi(T, lang, 'en')
  const f = useMemo(() => makeFormat(lang), [lang])
  const [range, setRange] = useState(30)
  const [mode, setMode] = useState('p')
  const P = useInsightPeriod(range, today, f, lang)
  const log = state.log || {}
  const totals = useMemo(() => qadaTotals(state), [state])

  const cur = useMemo(() => ({ ...qadaPeriod(log, P.keys), s: qadaSeries(log, P.keys) }), [log, P.keys])
  const prev = useMemo(() => ({ ...qadaPeriod(log, P.prevKeys), s: qadaSeries(log, P.prevKeys) }), [log, P.prevKeys])
  const pace = useMemo(() => qadaPace(log, today, 30), [log, today])
  const hasData = totals.owed + totals.done + totals.fastsOwed + totals.fastsDone > 0 || Object.keys(log).length > 0

  const activeSeries = cur.s.p.map((v, i) => (v || cur.s.f[i] ? 1 : 0))
  const kpis = [
    { key: 'p', icon: 'qada', label: t.kPrayers, value: f.num(cur.p), delta: deltaOf(cur.p, prev.p, P.vs), spark: P.b(cur.s.p) },
    { key: 'f', icon: 'ramadan', label: t.kFasts, value: f.num(cur.f), delta: deltaOf(cur.f, prev.f, P.vs), spark: P.b(cur.s.f), tone: 2 },
    { key: 'o', icon: 'target', label: t.kOwed, value: f.num(totals.owed), hint: totals.fastsOwed ? t.owedHint(f.num(totals.fastsOwed)) : t.owedHintNoFast, tone: 4 },
    { key: 'a', icon: 'calendar', label: t.kActive, value: f.num(cur.active), unit: `/ ${f.num(P.keys.length)}`, delta: deltaOf(cur.active, prev.active, P.vs), spark: P.bucket > 1 ? P.b(activeSeries) : rolling(activeSeries), tone: 3 },
  ]

  const heat = useCallback((k) => Number(log[k]?.p) || 0, [log])
  const wdCur = weekdayAvg(P.keys, cur.s.p)
  const wdPrev = weekdayAvg(P.prevKeys, prev.s.p)

  const byGoal = finishDate(totals.owed, state.goal)
  const all = totals.owed + totals.done

  const feed = useMemo(() => qadaRecent(log, today, 6).map(e => ({
    key: e.key, time: e.key, icon: e.p ? 'qada' : 'ramadan',
    title: e.p && e.f ? t.fBoth(f.num(e.p), f.num(e.f)) : e.p ? t.fP(f.num(e.p)) : t.fF(f.num(e.f)),
    chip: e.p >= state.goal ? { label: t.cGoal, tone: 'accent' } : { label: t.cDay, tone: 'muted' },
  })), [log, today, t, f, state.goal])

  const debtItems = PRAYERS.map((p, i) => ({ key: p, label: names[p], value: state.prayers[p].owed, tone: [1, 2, 3, 4, 'muted'][i] }))

  const series = mode === 'p'
    ? [{ key: 'p', label: t.sP, values: P.b(cur.s.p), compare: P.b(prev.s.p), tone: 1 }]
    : [{ key: 'f', label: t.sF, values: P.b(cur.s.f), compare: P.b(prev.s.f), tone: 2 }]

  return (
    <InsightsSection id="qd-ins" title={t.title} lead={t.lead} lang={lang} range={range} onRange={setRange} hasData={hasData}
      empty={{ text: t.empty, action: { label: t.start, icon: 'plus', onClick: scrollToSel('.qd-counters') } }}>
      <BentoGrid>
        {kpis.map(k => (
          <KpiCard key={k.key} span={3} icon={k.icon} label={k.label} value={k.value} unit={k.unit}
            delta={k.delta || null} hint={k.hint || (k.delta ? undefined : P.v.noPrev)} spark={k.spark} sparkLabel={k.spark ? P.v.sparkOf(k.label) : undefined} tone={k.tone || 1} lang={lang} />
        ))}

        <ChartCard span={8} id="qd-ins-chart" title={t.chart} sub={mode === 'p' ? t.chartSubP : t.chartSubF}
          actions={<RangeTabs options={[{ value: 'p', label: t.mP }, { value: 'f', label: t.mF }]} value={mode} onChange={setMode} label={t.mode} />}>
          <LineChart key={`${mode}-${range}`} height={280} integer label={t.chart} labels={P.labels} xFormat={P.xTick} tooltipTitle={P.tipTitle}
            lang={lang} series={series} emptyText={t.noLog} />
        </ChartCard>

        <ChartCard span={4} id="qd-ins-goal" className="ins-half ins-center" icon="target" title={t.goal} sub={t.goalSub}>
          <GoalRing value={totals.done} goal={Math.max(1, all)} pace={pace} unit={t.unit} centerLabel={t.centerLabel} label={t.goal} lang={lang}
            extraRows={totals.owed > 0 ? [{ label: t.byGoal(f.num(state.goal)), value: byGoal ? f.date(byGoal, { day: 'numeric', month: 'short', year: 'numeric' }) : t.goalNone }] : undefined} />
        </ChartCard>

        <ChartCard span={8} id="qd-ins-heat" title={t.heat} sub={t.heatSub}>
          <CalendarHeatmap data={heat} end={today} maxWeeks={26} label={t.heat} format={(n) => t.cell(f.num(n))} lang={lang} />
        </ChartCard>

        <ChartCard span={4} id="qd-ins-rad" className="ins-half ins-center ins-rad5" icon="prayer" title={t.rad} sub={t.radSub}>
          <RadialBars size={56} thickness={6} label={t.rad} lang={lang} format={(v, m) => `${f.compact(v)}/${f.compact(m)}`}
            items={PRAYERS.map(p => ({ key: p, label: names[p], value: state.prayers[p].done, max: state.prayers[p].owed + state.prayers[p].done }))} />
        </ChartCard>

        <ChartCard span={4} id="qd-ins-seg" className="ins-half" title={t.seg} sub={t.segSub}>
          {totals.owed > 0
            ? <SegmentBreakdown label={t.seg} lang={lang} items={debtItems} />
            : <p className="vz-empty">{t.segEmpty}</p>}
        </ChartCard>

        <ChartCard span={4} id="qd-ins-wd" className="ins-half" title={P.v.wdTitle} sub={t.wdSub}>
          <CompareBars label={P.v.wdTitle} lang={lang} currentLabel={P.v.ranges[range]} format={(n) => f.num(n)}
            items={P.wd.map((w, i) => ({ key: i, label: w, value: wdCur[i], prev: wdPrev[i] }))} />
        </ChartCard>

        <ChartCard span={4} id="qd-ins-feed" title={P.v.feedTitle} sub={t.feedSub}>
          <ActivityFeed items={feed} label={P.v.feedTitle} lang={lang} empty={<p className="vz-empty">{P.v.feedEmpty}</p>} />
        </ChartCard>
      </BentoGrid>
    </InsightsSection>
  )
}
