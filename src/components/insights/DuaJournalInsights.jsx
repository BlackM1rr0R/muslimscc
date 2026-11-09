// ═══════════════════════════════════════════════════════
// /duajournal → "Analitika" bento (viz v2)
// Məlumat: səhifənin öz yoxlanmış dua siyahısı ('dua_journal') — yalnız bu cihaz.
// "Qəbul oldu" istifadəçinin öz işarəsidir (qeybi hökm deyil) — mətnlər bunu belə adlandırır.
// ═══════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import {
  BentoGrid, ChartCard, KpiCard, AreaChart, CalendarHeatmap, FunnelChart, SegmentBreakdown, CompareBars, ActivityFeed, makeFormat,
} from '../viz'
import { InsightsSection, useInsightPeriod, scrollToSel } from './Insights.jsx'
import { pickUi } from '../../utils/uiText'
import { deltaOf, weekdayAvg, rolling } from '../../utils/trackerInsights.js'
import { duaIndex, duaAnswerLag, duaByCategory } from '../../utils/journalInsights.js'

// Rəng kateqoriyaya bağlıdır (səhifənin Donut-u ilə eyni)
const CAT_TONE = { personal: 1, family: 2, health: 3, work: 4, ummah: 'muted' }

const T = {
  az: {
    title: 'Dua gündəliyi analitikası', lead: 'Nə vaxt dua yazdığınız, neçəsini «qəbul oldu» kimi işarələdiyiniz və hansı mövzular üçün daha çox dua etdiyiniz.',
    empty: 'Hələ dua yazılmayıb. İlk duanızı əlavə edin — dinamika və kateqoriyalar burada görünəcək.', start: 'İlk duanı yaz',
    kNew: 'Yazılan dua', kAns: '«Qəbul oldu» işarəsi', kRate: 'Qəbul işarəsi payı', kActive: 'Davam edən dualar',
    rateHint: (a, n) => `bütün vaxt: ${a} / ${n}`, lagHint: (d) => `orta gözləmə: ${d} gün`, noLag: 'hələ qəbul işarəsi yoxdur',
    chart: 'Dualar dinamikası', chartSub: 'dövr ərzində yığılan say: yazılan və «qəbul oldu» kimi işarələnən', sNew: 'Yazılan', sAns: 'Qəbul oldu',
    fn: 'Yazılandan qəbula', fnSub: 'bu dövrdə yazılan duaların neçəsi işarələnib; ştrix — əvvəlki dövr', fnSteps: ['Yazılan', 'Qəbul oldu'],
    seg: 'Kateqoriyalar', segSub: 'bu dövrdə yazılan dualar və əvvəlki dövrə görə dəyişmə',
    heat: 'Dua təqvimi', heatSub: 'hər xana bir gün: yazılan + qəbul olunan', cell: (n) => `${n} qeyd`,
    wdSub: 'gündə orta yazılan dua — bu dövr və əvvəlki dövr',
    feedSub: 'son yazılan və qəbul olunan dualar', fNew: 'Yeni dua yazıldı', fAns: 'Dua «qəbul oldu» kimi işarələndi',
  },
  en: {
    title: 'Dua journal analytics', lead: 'When you write duas, how many you marked as answered, and which topics you pray for most.',
    empty: 'No duas written yet. Add your first dua — trends and categories will appear here.', start: 'Write your first dua',
    kNew: 'Duas written', kAns: 'Marked answered', kRate: 'Share marked answered', kActive: 'Ongoing duas',
    rateHint: (a, n) => `all time: ${a} / ${n}`, lagHint: (d) => `average wait: ${d} days`, noLag: 'none marked answered yet',
    chart: 'Duas over time', chartSub: 'running total in the period: written and marked answered', sNew: 'Written', sAns: 'Answered',
    fn: 'From written to answered', fnSub: 'how many duas written in this period were marked; dashed — previous period', fnSteps: ['Written', 'Answered'],
    seg: 'Categories', segSub: 'duas written in this period and change vs the previous period',
    heat: 'Dua calendar', heatSub: 'each square is a day: written + answered', cell: (n) => `${n} entries`,
    wdSub: 'average duas written per day — this period and the previous one',
    feedSub: 'recently written and answered duas', fNew: 'A new dua was written', fAns: 'A dua was marked as answered',
  },
  ru: {
    title: 'Аналитика дневника дуа', lead: 'Когда вы записываете дуа, сколько отметили как принятые и о чём просите чаще всего.',
    empty: 'Дуа пока не записаны. Добавьте первое — здесь появятся динамика и категории.', start: 'Записать первое дуа',
    kNew: 'Записано дуа', kAns: 'Отмечено «принято»', kRate: 'Доля «принятых»', kActive: 'Текущие дуа',
    rateHint: (a, n) => `за всё время: ${a} / ${n}`, lagHint: (d) => `в среднем ждали: ${d} дн.`, noLag: 'отметок «принято» пока нет',
    chart: 'Динамика дуа', chartSub: 'накопительно за период: записано и отмечено «принято»', sNew: 'Записано', sAns: 'Принято',
    fn: 'От записи к принятию', fnSub: 'сколько дуа этого периода отмечено; пунктир — прошлый период', fnSteps: ['Записано', 'Принято'],
    seg: 'Категории', segSub: 'дуа этого периода и изменение к прошлому',
    heat: 'Календарь дуа', heatSub: 'каждая клетка — день: записано + принято', cell: (n) => `записей: ${n}`,
    wdSub: 'в среднем записано за день — этот и прошлый период',
    feedSub: 'недавно записанные и принятые дуа', fNew: 'Записано новое дуа', fAns: 'Дуа отмечено как принятое',
  },
  ar: {
    title: 'تحليلات مذكرة الدعاء', lead: 'متى تكتب أدعيتك، وكم منها علّمته بأنه استُجيب، وفي أي المواضيع تدعو أكثر.',
    empty: 'لم تكتب أي دعاء بعد. أضف دعاءك الأول — وستظهر هنا الاتجاهات والفئات.', start: 'اكتب أول دعاء',
    kNew: 'الأدعية المكتوبة', kAns: 'علامات «استُجيب»', kRate: 'نسبة «استُجيب»', kActive: 'أدعية مستمرة',
    rateHint: (a, n) => `منذ البداية: ${a} / ${n}`, lagHint: (d) => `متوسط الانتظار: ${d} يومًا`, noLag: 'لا علامات استجابة بعد',
    chart: 'الأدعية عبر الزمن', chartSub: 'المجموع التراكمي في الفترة: المكتوبة والمعلّمة بأنها استُجيبت', sNew: 'مكتوبة', sAns: 'استُجيبت',
    fn: 'من الكتابة إلى الاستجابة', fnSub: 'كم من أدعية هذه الفترة عُلّم؛ المتقطع — الفترة السابقة', fnSteps: ['مكتوبة', 'استُجيبت'],
    seg: 'الفئات', segSub: 'أدعية هذه الفترة والتغير مقارنة بالسابقة',
    heat: 'تقويم الدعاء', heatSub: 'كل مربع يوم: المكتوبة + المستجابة', cell: (n) => `${n} تسجيلات`,
    wdSub: 'متوسط الأدعية المكتوبة في اليوم — هذه الفترة والسابقة',
    feedSub: 'آخر الأدعية المكتوبة والمستجابة', fNew: 'كُتب دعاء جديد', fAns: 'عُلّم دعاء بأنه استُجيب',
  },
  tr: {
    title: 'Dua günlüğü analizi', lead: 'Ne zaman dua yazdığınız, kaçını «kabul oldu» olarak işaretlediğiniz ve en çok hangi konular için dua ettiğiniz.',
    empty: 'Henüz dua yazılmadı. İlk duanızı ekleyin — seyir ve kategoriler burada görünecek.', start: 'İlk duayı yaz',
    kNew: 'Yazılan dua', kAns: '«Kabul oldu» işareti', kRate: 'Kabul işareti oranı', kActive: 'Süren dualar',
    rateHint: (a, n) => `tüm zamanlar: ${a} / ${n}`, lagHint: (d) => `ortalama bekleme: ${d} gün`, noLag: 'henüz kabul işareti yok',
    chart: 'Duaların seyri', chartSub: 'dönem boyunca birikimli: yazılan ve «kabul oldu» olarak işaretlenen', sNew: 'Yazılan', sAns: 'Kabul oldu',
    fn: 'Yazılandan kabule', fnSub: 'bu dönemde yazılan duaların kaçı işaretlendi; kesikli — önceki dönem', fnSteps: ['Yazılan', 'Kabul oldu'],
    seg: 'Kategoriler', segSub: 'bu dönemde yazılan dualar ve önceki döneme göre değişim',
    heat: 'Dua takvimi', heatSub: 'her kare bir gün: yazılan + kabul olan', cell: (n) => `${n} kayıt`,
    wdSub: 'günde ortalama yazılan dua — bu dönem ve önceki dönem',
    feedSub: 'son yazılan ve kabul olan dualar', fNew: 'Yeni dua yazıldı', fAns: 'Bir dua «kabul oldu» olarak işaretlendi',
  },
}

const cumsum = (v) => { let s = 0; return v.map(x => (s += x)) }
const clip = (s, n = 70) => { const x = String(s || '').replace(/\s+/g, ' ').trim(); return x.length > n ? `${x.slice(0, n - 1)}…` : x }
const dayOfMs = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
// Səhifə id-ni Date.now().toString(36) + 4 təsadüfi simvol kimi yaradır — dəqiq vaxt yalnız gün üst-üstə düşəndə
const msOf = (d) => { const n = parseInt(String(d.id || '').slice(0, -4), 36); return Number.isFinite(n) && n > 1e12 && dayOfMs(n) === d.date ? n : null }

/** duas — səhifənin loadData() siyahısı; categories — CATEGORIES; catLabels — { personal: 'Şəxsi', … } */
export default function DuaJournalInsights({ duas, today, categories, catLabels, lang }) {
  const t = pickUi(T, lang, 'en')
  const f = useMemo(() => makeFormat(lang), [lang])
  const [range, setRange] = useState(30)
  const P = useInsightPeriod(range, today, f, lang)
  const idx = useMemo(() => duaIndex(duas), [duas])
  const hasData = duas.length > 0

  const series = useMemo(() => {
    const w = (keys) => keys.map(k => idx.written[k] || 0)
    const a = (keys) => keys.map(k => idx.answered[k] || 0)
    return { w: w(P.keys), a: a(P.keys), wp: w(P.prevKeys), ap: a(P.prevKeys) }
  }, [idx, P.keys, P.prevKeys])
  const sum = (v) => v.reduce((x, y) => x + y, 0)
  const inCur = (k) => k >= P.keys[0] && k <= today
  const inPrev = (k) => k >= P.prevKeys[0] && k <= P.prevKeys[P.prevKeys.length - 1]
  const cohort = (inR) => { const ds = duas.filter(d => inR(d.date)); return [ds.length, ds.filter(d => d.answered).length] }
  const fnCur = cohort(inCur), fnPrev = cohort(inPrev)

  const allAns = duas.filter(d => d.answered).length
  const active = duas.length - allAns
  const lag = useMemo(() => duaAnswerLag(duas), [duas])
  const nW = sum(series.w), nA = sum(series.a)
  // Seyrək günlük say — mini trend 7 günlük sürüşən cəm (il rejimində həftəlik)
  const sp = (v) => (P.bucket > 1 ? P.b(v) : rolling(v))
  const kpis = [
    { key: 'w', icon: 'duajournal', label: t.kNew, value: f.num(nW), delta: deltaOf(nW, sum(series.wp), P.vs), spark: sp(series.w) },
    { key: 'a', icon: 'check', label: t.kAns, value: f.num(nA), delta: deltaOf(nA, sum(series.ap), P.vs), spark: sp(series.a), tone: 2 },
    { key: 'r', icon: 'target', label: t.kRate, value: f.pct(duas.length ? (allAns / duas.length) * 100 : 0, 0), hint: t.rateHint(f.num(allAns), f.num(duas.length)), tone: 3 },
    { key: 'o', icon: 'clock', label: t.kActive, value: f.num(active), hint: lag == null ? t.noLag : t.lagHint(f.num(lag)) },
  ]

  const catCur = duaByCategory(duas, categories, inCur)
  const catPrev = duaByCategory(duas, categories, inPrev)
  const segItems = categories.map(c => ({ key: c, label: catLabels[c] || c, value: catCur[c], prev: catPrev[c], tone: CAT_TONE[c] || 'muted' }))

  const heat = (k) => (idx.written[k] || 0) + (idx.answered[k] || 0)
  const wdCur = weekdayAvg(P.keys, series.w)
  const wdPrev = weekdayAvg(P.prevKeys, series.wp)

  const feed = useMemo(() => {
    const ev = []
    for (const d of duas) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(d.date) && d.date <= today) ev.push({ key: `n-${d.id}`, icon: 'duajournal', time: msOf(d) || d.date, sort: msOf(d) || +new Date(`${d.date}T12:00:00`), title: t.fNew, meta: `${catLabels[d.category] || ''} · ${clip(d.text, 32)}`, chip: { label: t.sNew, tone: 'muted' } })
      if (d.answered && /^\d{4}-\d{2}-\d{2}$/.test(d.answeredDate || '')) ev.push({ key: `a-${d.id}`, icon: 'check', time: d.answeredDate, sort: +new Date(`${d.answeredDate}T13:00:00`), title: t.fAns, meta: clip(d.text, 32), chip: { label: t.sAns, tone: 'accent' } })
    }
    return ev.sort((a, b) => b.sort - a.sort).slice(0, 5).map(({ sort: _s, ...e }) => e)
  }, [duas, today, t, catLabels])

  return (
    <InsightsSection id="dj-ins" title={t.title} lead={t.lead} lang={lang} range={range} onRange={setRange} hasData={hasData}
      empty={{ text: t.empty, action: { label: t.start, icon: 'plus', onClick: scrollToSel('.dua-add-btn') } }}>
      <BentoGrid>
        {kpis.map(k => (
          <KpiCard key={k.key} span={3} icon={k.icon} label={k.label} value={k.value} unit={k.unit} lang={lang}
            delta={k.delta || null} hint={k.hint || (k.delta ? undefined : P.v.noPrev)} spark={k.spark}
            sparkLabel={k.spark ? P.v.sparkOf(k.label) : undefined} tone={k.tone || 1} />
        ))}

        <ChartCard span={8} id="dj-ins-chart" title={t.chart} sub={t.chartSub}>
          {/* Dualar seyrək yazılır — günlük sütun "iynə" kimi görünür; dövr ərzində yığılan say daha oxunaqlıdır
              (iki xətt arasındakı fərq — hələ davam edən dualar) */}
          <AreaChart key={`a-${range}`} mode="overlay" height={260} integer label={t.chart} labels={P.labels} xFormat={P.xTick} tooltipTitle={P.tipTitle} lang={lang}
            curve="linear" legendValue="last"
            series={[
              { key: 'w', label: t.sNew, values: cumsum(P.b(series.w)), tone: 1 },
              { key: 'a', label: t.sAns, values: cumsum(P.b(series.a)), tone: 2 },
            ]} />
        </ChartCard>

        <ChartCard span={4} id="dj-ins-seg" className="ins-half" title={t.seg} sub={t.segSub}>
          <SegmentBreakdown label={t.seg} lang={lang} items={segItems.some(s => s.value || s.prev) ? segItems : []} />
          {!segItems.some(s => s.value || s.prev) && <p className="vz-empty">{P.v.feedEmpty}</p>}
        </ChartCard>

        <ChartCard span={8} id="dj-ins-heat" title={t.heat} sub={t.heatSub}>
          <CalendarHeatmap data={heat} end={today} maxWeeks={26} label={t.heat} format={(n) => t.cell(f.num(n))} lang={lang} />
        </ChartCard>

        <ChartCard span={4} id="dj-ins-fn" className="ins-half" title={t.fn} sub={t.fnSub}>
          <FunnelChart label={t.fn} lang={lang} height={130} compare={fnPrev}
            steps={t.fnSteps.map((s, i) => ({ key: i, label: s, value: fnCur[i] }))} />
        </ChartCard>

        <ChartCard span={7} id="dj-ins-wd" title={P.v.wdTitle} sub={t.wdSub}>
          <CompareBars label={P.v.wdTitle} lang={lang} currentLabel={P.v.ranges[range]} format={(n) => f.num(n)}
            items={P.wd.map((w, i) => ({ key: i, label: w, value: wdCur[i], prev: wdPrev[i] }))} />
        </ChartCard>

        <ChartCard span={5} id="dj-ins-feed" title={P.v.feedTitle} sub={t.feedSub}>
          <ActivityFeed items={feed} label={P.v.feedTitle} lang={lang} empty={<p className="vz-empty">{P.v.feedEmpty}</p>} />
        </ChartCard>
      </BentoGrid>
    </InsightsSection>
  )
}
