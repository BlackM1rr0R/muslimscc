// ═══════════════════════════════════════════════════════
// /hifz → "Analitika" bento (viz v2)
// Məlumat: 'hifz_srs' jurnalı (gündə təkrar + yeni ayə), SRS ayələri və köhnə
// 'hifz_progress' surə statusları. Yalnız bu cihaz; heç nə uydurulmur.
// ═══════════════════════════════════════════════════════
import { useMemo, useState, useCallback } from 'react'
import {
  BentoGrid, ChartCard, KpiCard, RangeTabs, AreaChart, LineChart, CalendarHeatmap,
  SegmentBreakdown, CompareBars, GoalRing, ActivityFeed, makeFormat,
} from '../viz'
import { toDayKey } from '../viz/scale.js'
import { InsightsSection, useInsightPeriod, scrollToSel } from './Insights.jsx'
import { pickUi } from '../../utils/uiText'
import { deltaOf, rolling, weekdayAvg, sumOf, countPos, paceFrom, streakBack } from '../../utils/trackerInsights.js'
import { hifzSeries, newByDay, ayahBreakdown, recentLogDays } from '../../utils/hifzInsights.js'

const QURAN_AYAHS = 6236

const T = {
  az: {
    title: 'Hifz analitikası', lead: 'Təkrar və yeni ayələrin dövr üzrə dinamikası, əzbərin ümumi irəliləyişi və hansı günlər daha çox çalışdığınız.',
    empty: 'Hələ hifz qeydi yoxdur. Bu günün planından ilk ayələri öyrənin və ya təkrar edin — dinamika, temp və bitmə tarixi burada görünəcək.', start: 'Bu günün planına keç',
    kReviews: 'Təkrar', kNew: 'Yeni ayə', kActive: 'Aktiv gün', kMem: 'Əzbərdə ayə', memHint: (p) => `Quranın ${p}-i`,
    chart: 'Hifz dinamikası', chartSub: 'gündə: təkrar olunan və yeni öyrənilən ayələr', chartCmp: 'gündə cəmi; ştrixli xətt — əvvəlki dövr',
    mode: 'Görünüş', mMix: 'Bölgü', mCmp: 'Müqayisə', sReviews: 'Təkrar', sNew: 'Yeni ayə', sTotal: 'Cəmi',
    goal: 'Bütün Quran', goalSub: '6236 ayə — temp son 30 gündəki yeni ayələrdən', unit: 'ayə', center: 'əzbər', daily: 'Gündəlik hədəfiniz', perDay: (n) => `${n} yeni ayə`,
    heat: 'Hifz təqvimi', heatSub: 'hər xana bir gün — tünd = daha çox ayə', cell: (n) => `${n} ayə`,
    seg: 'Ayələr üzrə', segSub: 'əzbər, davam edən surələrin qalan ayələri və başlanmamış', sMem: 'Əzbər', sProg: 'Davam edən surələrdə', sRest: 'Başlanmayıb',
    feedSub: 'son çalışdığınız günlər', fDay: (r, n) => [r ? `${r} təkrar` : '', n ? `${n} yeni ayə` : ''].filter(Boolean).join(' · '), cNew: 'Yeni', cRev: 'Təkrar', streak: 'Ardıcıl gün',
  },
  en: {
    title: 'Hifz analytics', lead: 'Reviews and new ayahs over the period, your overall memorisation progress and which days you practise most.',
    empty: 'No hifz records yet. Learn or review your first ayahs in today’s plan — trends, pace and a finish date will appear here.', start: 'Go to today’s plan',
    kReviews: 'Reviews', kNew: 'New ayahs', kActive: 'Active days', kMem: 'Ayahs memorised', memHint: (p) => `${p} of the Quran`,
    chart: 'Hifz over time', chartSub: 'per day: ayahs reviewed and newly learned', chartCmp: 'total per day; dashed line — previous period',
    mode: 'View', mMix: 'Breakdown', mCmp: 'Compare', sReviews: 'Reviews', sNew: 'New ayahs', sTotal: 'Total',
    goal: 'The whole Quran', goalSub: '6236 ayahs — pace from new ayahs in the last 30 days', unit: 'ayahs', center: 'memorised', daily: 'Your daily goal', perDay: (n) => `${n} new ayahs`,
    heat: 'Hifz calendar', heatSub: 'each square is a day — darker = more ayahs', cell: (n) => `${n} ayahs`,
    seg: 'By ayah', segSub: 'memorised, the rest of surahs in progress, and not started', sMem: 'Memorised', sProg: 'In surahs in progress', sRest: 'Not started',
    feedSub: 'the days you practised most recently', fDay: (r, n) => [r ? `${r} reviews` : '', n ? `${n} new ayahs` : ''].filter(Boolean).join(' · '), cNew: 'New', cRev: 'Review', streak: 'Day streak',
  },
  ru: {
    title: 'Аналитика хифза', lead: 'Повторения и новые аяты за период, общий прогресс заучивания и дни, когда вы занимаетесь больше.',
    empty: 'Записей хифза пока нет. Выучите или повторите первые аяты в плане на сегодня — здесь появятся динамика, темп и дата завершения.', start: 'К плану на сегодня',
    kReviews: 'Повторения', kNew: 'Новые аяты', kActive: 'Активные дни', kMem: 'Выучено аятов', memHint: (p) => `${p} Корана`,
    chart: 'Динамика хифза', chartSub: 'за день: повторённые и новые аяты', chartCmp: 'всего за день; пунктир — прошлый период',
    mode: 'Вид', mMix: 'Структура', mCmp: 'Сравнение', sReviews: 'Повторения', sNew: 'Новые аяты', sTotal: 'Всего',
    goal: 'Весь Коран', goalSub: '6236 аятов — темп по новым аятам за 30 дней', unit: 'аят.', center: 'выучено', daily: 'Ваша цель на день', perDay: (n) => `новых аятов: ${n}`,
    heat: 'Календарь хифза', heatSub: 'каждая клетка — день; темнее = больше аятов', cell: (n) => `аятов: ${n}`,
    seg: 'По аятам', segSub: 'выучено, остаток начатых сур и не начато', sMem: 'Выучено', sProg: 'В начатых сурах', sRest: 'Не начато',
    feedSub: 'последние дни занятий', fDay: (r, n) => [r ? `повторений: ${r}` : '', n ? `новых аятов: ${n}` : ''].filter(Boolean).join(' · '), cNew: 'Новые', cRev: 'Повтор', streak: 'Дней подряд',
  },
  ar: {
    title: 'تحليلات الحفظ', lead: 'المراجعة والآيات الجديدة خلال الفترة، وتقدّم حفظك الإجمالي، والأيام التي تراجع فيها أكثر.',
    empty: 'لا سجلات حفظ بعد. احفظ أو راجع أولى الآيات في خطة اليوم — وستظهر هنا الاتجاهات والوتيرة وموعد الإتمام.', start: 'اذهب إلى خطة اليوم',
    kReviews: 'المراجعات', kNew: 'آيات جديدة', kActive: 'أيام النشاط', kMem: 'الآيات المحفوظة', memHint: (p) => `${p} من القرآن`,
    chart: 'الحفظ عبر الزمن', chartSub: 'في اليوم: الآيات المراجَعة والجديدة', chartCmp: 'المجموع في اليوم؛ الخط المتقطع — الفترة السابقة',
    mode: 'العرض', mMix: 'التوزيع', mCmp: 'المقارنة', sReviews: 'المراجعات', sNew: 'آيات جديدة', sTotal: 'المجموع',
    goal: 'القرآن كله', goalSub: '6236 آية — الوتيرة من الآيات الجديدة في آخر 30 يومًا', unit: 'آية', center: 'محفوظ', daily: 'هدفك اليومي', perDay: (n) => `${n} آيات جديدة`,
    heat: 'تقويم الحفظ', heatSub: 'كل مربع يوم — الأغمق = آيات أكثر', cell: (n) => `${n} آية`,
    seg: 'حسب الآيات', segSub: 'المحفوظ، وباقي السور قيد الحفظ، وما لم يبدأ', sMem: 'محفوظ', sProg: 'في سور قيد الحفظ', sRest: 'لم يبدأ',
    feedSub: 'آخر الأيام التي راجعت فيها', fDay: (r, n) => [r ? `${r} مراجعة` : '', n ? `${n} آيات جديدة` : ''].filter(Boolean).join(' · '), cNew: 'جديد', cRev: 'مراجعة', streak: 'أيام متتالية',
  },
  tr: {
    title: 'Hıfz analizi', lead: 'Dönem boyunca tekrar ve yeni ayetler, ezberin genel ilerleyişi ve en çok çalıştığınız günler.',
    empty: 'Henüz hıfz kaydı yok. Bugünün planında ilk ayetleri öğrenin veya tekrar edin — seyir, tempo ve bitiş tarihi burada görünecek.', start: 'Bugünün planına git',
    kReviews: 'Tekrar', kNew: 'Yeni ayet', kActive: 'Aktif gün', kMem: 'Ezberdeki ayet', memHint: (p) => `Kur’an’ın ${p} kadarı`,
    chart: 'Hıfzın seyri', chartSub: 'günde: tekrar edilen ve yeni öğrenilen ayetler', chartCmp: 'günde toplam; kesikli çizgi — önceki dönem',
    mode: 'Görünüm', mMix: 'Dağılım', mCmp: 'Karşılaştırma', sReviews: 'Tekrar', sNew: 'Yeni ayet', sTotal: 'Toplam',
    goal: 'Kur’an’ın tamamı', goalSub: '6236 ayet — tempo son 30 gündeki yeni ayetlerden', unit: 'ayet', center: 'ezber', daily: 'Günlük hedefiniz', perDay: (n) => `${n} yeni ayet`,
    heat: 'Hıfz takvimi', heatSub: 'her kare bir gün — koyu = daha çok ayet', cell: (n) => `${n} ayet`,
    seg: 'Ayetlere göre', segSub: 'ezber, devam eden surelerin kalan ayetleri ve başlanmamış', sMem: 'Ezber', sProg: 'Devam eden surelerde', sRest: 'Başlanmadı',
    feedSub: 'en son çalıştığınız günler', fDay: (r, n) => [r ? `${r} tekrar` : '', n ? `${n} yeni ayet` : ''].filter(Boolean).join(' · '), cNew: 'Yeni', cRev: 'Tekrar', streak: 'Gün serisi',
  },
}

/** surahs: [{ num, ayahs }]; srs: hifzSrs vəziyyəti; progress: { num: 1|2 }; counts: perSurahCounts(srs); memAyahs: səhifənin hesabı */
export default function HifzInsights({ srs, progress, surahs, counts, memAyahs, lang }) {
  const t = pickUi(T, lang, 'en')
  const f = useMemo(() => makeFormat(lang), [lang])
  const today = toDayKey()
  const [range, setRange] = useState(30)
  const [mode, setMode] = useState('mix')
  const P = useInsightPeriod(range, today, f, lang)
  const rawLog = srs?.log
  const log = useMemo(() => rawLog || {}, [rawLog])

  const cur = useMemo(() => hifzSeries(log, P.keys), [log, P.keys])
  const prev = useMemo(() => hifzSeries(log, P.prevKeys), [log, P.prevKeys])
  const seg = useMemo(() => ayahBreakdown(surahs, progress, counts), [surahs, progress, counts])
  const hasLog = Object.keys(log).length > 0
  const hasData = hasLog || memAyahs > 0

  const pace = useMemo(() => paceFrom(newByDay(log), today, 30), [log, today])
  const active = useCallback((k) => { const d = log[k]; return !!d && ((d.reviews || 0) + (d.new || 0)) > 0 }, [log])
  const streak = useMemo(() => streakBack(active, today), [active, today])

  const activeCur = cur.total.map(v => (v > 0 ? 1 : 0))
  const kpis = [
    { key: 'r', icon: 'refresh', label: t.kReviews, value: f.num(sumOf(cur.reviews)), delta: deltaOf(sumOf(cur.reviews), sumOf(prev.reviews), P.vs), spark: P.b(cur.reviews) },
    { key: 'n', icon: 'plus', label: t.kNew, value: f.num(sumOf(cur.added)), delta: deltaOf(sumOf(cur.added), sumOf(prev.added), P.vs), spark: P.b(cur.added), tone: 2 },
    { key: 'a', icon: 'calendar', label: t.kActive, value: f.num(countPos(cur.total)), unit: `/ ${f.num(P.keys.length)}`, delta: deltaOf(countPos(cur.total), countPos(prev.total), P.vs), spark: P.bucket > 1 ? P.b(activeCur) : rolling(activeCur), tone: 3 },
    { key: 'm', icon: 'hifz', label: t.kMem, value: f.num(memAyahs), unit: `/ ${f.num(QURAN_AYAHS)}`, hint: t.memHint(f.pct((memAyahs / QURAN_AYAHS) * 100, memAyahs && memAyahs < 63 ? 1 : 0)) },
  ]

  const heat = useCallback((k) => { const d = log[k]; return d ? (d.reviews || 0) + (d.new || 0) : 0 }, [log])
  const wdCur = weekdayAvg(P.keys, cur.total)
  const wdPrev = weekdayAvg(P.prevKeys, prev.total)

  const feed = useMemo(() => recentLogDays(log, 6).map(d => ({
    key: d.day, icon: d.added ? 'plus' : 'refresh', time: d.day, title: t.fDay(d.reviews, d.added),
    chip: d.added ? { label: t.cNew, tone: 'accent' } : { label: t.cRev, tone: 'muted' },
  })), [log, t])

  return (
    <InsightsSection id="hifz-ins" title={t.title} lead={t.lead} lang={lang} range={range} onRange={setRange} hasData={hasData}
      empty={{ text: t.empty, action: { label: t.start, icon: 'target', onClick: scrollToSel('#hifz-plan') } }}>
      <BentoGrid>
        {kpis.map(k => (
          <KpiCard key={k.key} span={3} icon={k.icon} label={k.label} value={k.value} unit={k.unit}
            delta={k.delta} hint={k.delta ? undefined : (k.hint || P.v.noPrev)} spark={k.spark} sparkLabel={k.spark ? P.v.sparkOf(k.label) : undefined} tone={k.tone || 1} lang={lang} />
        ))}

        <ChartCard span={8} id="hifz-ins-chart" title={t.chart} sub={mode === 'mix' ? t.chartSub : t.chartCmp}
          actions={<RangeTabs options={[{ value: 'mix', label: t.mMix }, { value: 'cmp', label: t.mCmp }]} value={mode} onChange={setMode} label={t.mode} />}>
          {mode === 'mix' ? (
            <AreaChart key={`m-${range}`} mode="stacked" height={280} integer label={t.chart} labels={P.labels} xFormat={P.xTick} tooltipTitle={P.tipTitle} lang={lang}
              series={[
                { key: 'r', label: t.sReviews, values: P.b(cur.reviews), tone: 1 },
                { key: 'n', label: t.sNew, values: P.b(cur.added), tone: 2 },
              ]} />
          ) : (
            <LineChart key={`c-${range}`} height={280} integer label={t.chart} labels={P.labels} xFormat={P.xTick} tooltipTitle={P.tipTitle} lang={lang}
              series={[{ key: 't', label: t.sTotal, values: P.b(cur.total), compare: P.b(prev.total), tone: 1 }]} />
          )}
        </ChartCard>

        <ChartCard span={4} id="hifz-ins-goal" className="ins-half ins-center" icon="target" title={t.goal} sub={t.goalSub}>
          <GoalRing value={memAyahs} goal={QURAN_AYAHS} pace={pace} unit={t.unit} centerLabel={t.center} label={t.goal} lang={lang}
            extraRows={[
              { label: t.daily, value: t.perDay(f.num(srs?.goal || 0)) },
              { label: t.streak, value: `${f.num(streak)} ${P.v.days}` },
            ]} />
        </ChartCard>

        <ChartCard span={8} id="hifz-ins-heat" title={t.heat} sub={t.heatSub}>
          <CalendarHeatmap data={heat} end={today} maxWeeks={26} label={t.heat} format={(n) => t.cell(f.num(n))} lang={lang} />
        </ChartCard>

        <ChartCard span={4} id="hifz-ins-seg" className="ins-half" title={t.seg} sub={t.segSub}>
          <SegmentBreakdown label={t.seg} lang={lang} items={[
            { key: 'm', label: t.sMem, value: seg.memorised, tone: 1 },
            { key: 'p', label: t.sProg, value: seg.inProgress, tone: 2 },
            { key: 'r', label: t.sRest, value: seg.notStarted, tone: 'muted' },
          ]} />
        </ChartCard>

        <ChartCard span={6} id="hifz-ins-wd" className="ins-half" title={P.v.wdTitle} sub={P.v.wdSub}>
          <CompareBars label={P.v.wdTitle} lang={lang} currentLabel={P.v.ranges[range]} format={(n) => f.num(n)}
            items={P.wd.map((w, i) => ({ key: i, label: w, value: wdCur[i], prev: wdPrev[i] }))} />
        </ChartCard>

        <ChartCard span={6} id="hifz-ins-feed" className="ins-half" title={P.v.feedTitle} sub={t.feedSub}>
          <ActivityFeed items={feed} label={P.v.feedTitle} lang={lang} empty={<p className="vz-empty">{P.v.feedEmpty}</p>} />
        </ChartCard>
      </BentoGrid>
    </InsightsSection>
  )
}
