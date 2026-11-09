// ═══════════════════════════════════════════════════════
// /charity → "Analitika" bento (viz v2) — əvvəlki "Xülasə" (6 ay sütunları + növlər) əvəzinə.
// Məlumat: səhifənin öz yoxlanmış qeydləri ('charity_log') — yalnız bu cihaz.
// Məbləğ valyutasız göstərilir (gündəlik valyuta saxlamır); hədəf yoxdur — uydurulmur.
// ═══════════════════════════════════════════════════════
import { useMemo, useState, useCallback } from 'react'
import {
  BentoGrid, ChartCard, KpiCard, RangeTabs, AreaChart, LineChart, CalendarHeatmap, SegmentBreakdown, CompareBars, ActivityFeed, makeFormat,
} from '../viz'
import { InsightsSection, useInsightPeriod } from './Insights.jsx'
import { pickUi } from '../../utils/uiText'
import { deltaOf, rolling, weekdayAvg, streakBack, bestRun, earliest, countPos } from '../../utils/trackerInsights.js'
import { charityIndex, charityStats, topTypes } from '../../utils/journalInsights.js'

// Seyrək günlük qeydlər (0/1) «iynə» kimi görünür — dövr ərzində yığılan say daha oxunaqlıdır
const cumsum = (v) => { let s = 0; return v.map(x => (s += x)) }

const T = {
  az: {
    title: 'Sədəqə analitikası', lead: 'Xeyir əməllərinizin dövr üzrə dinamikası, növlərə görə bölgüsü və həftənin hansı günləri daha bərəkətli keçir.',
    empty: 'Hələ qeyd yoxdur. İlk xeyir əməlinizi əlavə edin — dinamika, növlər və təqvim burada görünəcək.', start: 'Əməl yaz',
    kDeeds: 'Əməllər', kAmount: 'Məbləğ', kActive: 'Xeyirli günlər', kTypes: 'Növ sayı', kStreak: 'Ardıcıl gün', bestHint: (n) => `rekord: ${n} gün`, noCur: 'valyutasız, qeyd etdiyiniz kimi',
    chart: 'Əməllər dinamikası', subTypes: 'dövr ərzində yığılan əməllər — əsas növlər üzrə', subCmp: 'yığılan əməllər; ştrixli xətt — əvvəlki dövr', subAmt: 'yığılan məbləğ; ştrixli xətt — əvvəlki dövr',
    mode: 'Göstərici', mTypes: 'Növlər', mCmp: 'Müqayisə', mAmt: 'Məbləğ', deeds: 'Əməl', amount: 'Məbləğ', others: 'Digər növlər',
    seg: 'Növlərə görə', segSub: 'dövrdəki əməllər və əvvəlki dövrə görə dəyişmə',
    heat: 'Xeyir təqvimi', heatSub: 'hər xana bir gün — tünd = daha çox əməl', cell: (n) => `${n} əməl`,
    wdSub: 'gündə orta əməl — bu dövr və əvvəlki dövr', feedSub: 'son əlavə etdiyiniz əməllər',
  },
  en: {
    title: 'Charity analytics', lead: 'How your good deeds change over the period, their breakdown by type, and which days of the week are most generous.',
    empty: 'Nothing logged yet. Add your first good deed — trends, types and a calendar will appear here.', start: 'Log a deed',
    kDeeds: 'Deeds', kAmount: 'Amount', kActive: 'Days with a deed', kTypes: 'Types', kStreak: 'Day streak', bestHint: (n) => `best: ${n} days`, noCur: 'no currency, as you logged it',
    chart: 'Deeds over time', subTypes: 'running total of deeds in the period — by main type', subCmp: 'running total; dashed line — previous period', subAmt: 'running amount; dashed line — previous period',
    mode: 'Metric', mTypes: 'Types', mCmp: 'Compare', mAmt: 'Amount', deeds: 'Deeds', amount: 'Amount', others: 'Other types',
    seg: 'By type', segSub: 'deeds in the period and change vs the previous period',
    heat: 'Charity calendar', heatSub: 'each square is a day — darker = more deeds', cell: (n) => `${n} deeds`,
    wdSub: 'average deeds per day — this period and the previous one', feedSub: 'the deeds you added most recently',
  },
  ru: {
    title: 'Аналитика садаки', lead: 'Как меняются ваши добрые дела за период, их разбивка по типам и в какие дни недели их больше.',
    empty: 'Записей пока нет. Добавьте первое доброе дело — здесь появятся динамика, типы и календарь.', start: 'Записать дело',
    kDeeds: 'Дела', kAmount: 'Сумма', kActive: 'Дни с делами', kTypes: 'Типов', kStreak: 'Дней подряд', bestHint: (n) => `рекорд: ${n} дн.`, noCur: 'без валюты, как вы записали',
    chart: 'Динамика дел', subTypes: 'дела накопительно за период — по основным типам', subCmp: 'накопительно; пунктир — прошлый период', subAmt: 'сумма накопительно; пунктир — прошлый период',
    mode: 'Показатель', mTypes: 'Типы', mCmp: 'Сравнение', mAmt: 'Сумма', deeds: 'Дела', amount: 'Сумма', others: 'Другие типы',
    seg: 'По типам', segSub: 'дела за период и изменение к прошлому периоду',
    heat: 'Календарь добрых дел', heatSub: 'каждая клетка — день; темнее = больше дел', cell: (n) => `дел: ${n}`,
    wdSub: 'в среднем дел за день — этот и прошлый период', feedSub: 'недавно добавленные дела',
  },
  ar: {
    title: 'تحليلات الصدقة', lead: 'كيف تتغير أعمال الخير خلال الفترة، وتوزيعها حسب النوع، وأي أيام الأسبوع أكثر عطاءً.',
    empty: 'لا سجلات بعد. أضف أول عمل خير — وستظهر هنا الاتجاهات والأنواع والتقويم.', start: 'سجّل عملًا',
    kDeeds: 'الأعمال', kAmount: 'المبلغ', kActive: 'أيام فيها عمل', kTypes: 'الأنواع', kStreak: 'أيام متتالية', bestHint: (n) => `الأفضل: ${n} يومًا`, noCur: 'بلا عملة، كما سجّلته',
    chart: 'الأعمال عبر الزمن', subTypes: 'المجموع التراكمي للأعمال في الفترة — حسب الأنواع الرئيسة', subCmp: 'المجموع التراكمي؛ المتقطع — الفترة السابقة', subAmt: 'المبلغ التراكمي؛ المتقطع — الفترة السابقة',
    mode: 'المؤشر', mTypes: 'الأنواع', mCmp: 'المقارنة', mAmt: 'المبلغ', deeds: 'الأعمال', amount: 'المبلغ', others: 'أنواع أخرى',
    seg: 'حسب النوع', segSub: 'أعمال الفترة والتغير مقارنة بالسابقة',
    heat: 'تقويم الخير', heatSub: 'كل مربع يوم — الأغمق = أعمال أكثر', cell: (n) => `${n} أعمال`,
    wdSub: 'متوسط الأعمال في اليوم — هذه الفترة والسابقة', feedSub: 'آخر الأعمال التي أضفتها',
  },
  tr: {
    title: 'Sadaka analizi', lead: 'Hayır işlerinizin dönem boyunca seyri, türlere göre dağılımı ve haftanın hangi günlerinin daha bereketli geçtiği.',
    empty: 'Henüz kayıt yok. İlk hayır işinizi ekleyin — seyir, türler ve takvim burada görünecek.', start: 'İş kaydet',
    kDeeds: 'İşler', kAmount: 'Tutar', kActive: 'Hayırlı günler', kTypes: 'Tür sayısı', kStreak: 'Gün serisi', bestHint: (n) => `rekor: ${n} gün`, noCur: 'para birimi olmadan, kaydettiğiniz gibi',
    chart: 'İşlerin seyri', subTypes: 'dönem boyunca birikimli işler — ana türlere göre', subCmp: 'birikimli; kesikli çizgi — önceki dönem', subAmt: 'birikimli tutar; kesikli çizgi — önceki dönem',
    mode: 'Gösterge', mTypes: 'Türler', mCmp: 'Karşılaştırma', mAmt: 'Tutar', deeds: 'İş', amount: 'Tutar', others: 'Diğer türler',
    seg: 'Türlere göre', segSub: 'dönemdeki işler ve önceki döneme göre değişim',
    heat: 'Hayır takvimi', heatSub: 'her kare bir gün — koyu = daha çok iş', cell: (n) => `${n} iş`,
    wdSub: 'günde ortalama iş — bu dönem ve önceki dönem', feedSub: 'en son eklediğiniz işler',
  },
}

/** entries — səhifənin yoxlanmış qeydləri; types — [{ key, label, icon }] (DEED_TYPES, dilə görə). */
export default function CharityInsights({ entries, today, types, lang, className = '' }) {
  const t = pickUi(T, lang, 'en')
  const f = useMemo(() => makeFormat(lang), [lang])
  const [range, setRange] = useState(30)
  const [mode, setMode] = useState('types')
  const P = useInsightPeriod(range, today, f, lang)
  const typeKeys = useMemo(() => types.map(x => x.key), [types])
  const labelOf = useCallback((k) => types.find(x => x.key === k)?.label || k, [types])

  // Gələcək tarixli qeydlər (forma buna icazə verir) bu günə qədər sayılmır
  const past = useMemo(() => entries.filter(e => e.date <= today), [entries, today])
  const byDay = useMemo(() => charityIndex(past), [past])
  const first = useMemo(() => earliest(Object.keys(byDay)), [byDay])
  const hasData = !!first
  const hasAmount = past.some(e => e.amount > 0)

  const cur = useMemo(() => charityStats(byDay, P.keys, typeKeys), [byDay, P.keys, typeKeys])
  const prev = useMemo(() => charityStats(byDay, P.prevKeys, typeKeys), [byDay, P.prevKeys, typeKeys])
  const has = useCallback((k) => !!byDay[k], [byDay])
  const streak = useMemo(() => streakBack(has, today), [has, today])
  const best = useMemo(() => bestRun(has, first, today), [has, first, today])
  const eff = first ? P.keys.filter(k => k >= first).length : P.keys.length

  const activeSeries = cur.count.map(n => (n > 0 ? 1 : 0))
  const sp = (v) => (P.bucket > 1 ? P.b(v) : rolling(v))   // seyrək günlük say → 7 günlük sürüşən cəm
  const amt = (v) => f.num(v, { maximumFractionDigits: 2 })
  const kpis = [
    { key: 'n', icon: 'charity', label: t.kDeeds, value: f.num(cur.n), delta: deltaOf(cur.n, prev.n, P.vs), spark: sp(cur.count) },
    hasAmount
      ? { key: 'a', icon: 'zakat', label: t.kAmount, value: amt(cur.amount), delta: deltaOf(cur.amount, prev.amount, P.vs), spark: sp(cur.amt), tone: 2, hintAlways: t.noCur }
      : { key: 't', icon: 'list', label: t.kTypes, value: f.num(countPos(Object.values(cur.per))), unit: `/ ${types.length}`, delta: deltaOf(countPos(Object.values(cur.per)), countPos(Object.values(prev.per)), P.vs), tone: 2 },
    { key: 'd', icon: 'calendar', label: t.kActive, value: f.num(cur.active), unit: `/ ${f.num(eff)}`, delta: deltaOf(cur.active, prev.active, P.vs), spark: P.bucket > 1 ? P.b(activeSeries) : rolling(activeSeries), tone: 3 },
    { key: 's', icon: 'bolt', label: t.kStreak, value: f.num(streak), unit: P.v.days, hintAlways: t.bestHint(f.num(best)) },
  ]

  // Yığma qrafik: ən çox 3 növ + qalanı bir seriyada (4 tondan çox olmasın)
  const top = useMemo(() => topTypes({ ...cur.per }, 3), [cur.per])
  const stackSeries = useMemo(() => {
    const vals = (pred) => P.keys.map(k => { const d = byDay[k]; if (!d) return 0; let s = 0; for (const [tp, c] of Object.entries(d.types)) if (pred(tp)) s += c; return s })
    const norm = (tp) => (typeKeys.includes(tp) ? tp : 'other')
    const out = top.map((tp, i) => ({ key: tp, label: labelOf(tp), values: cumsum(P.b(vals(x => norm(x) === tp))), tone: i + 1 }))
    const restTypes = Object.keys(cur.per).filter(k => cur.per[k] > 0 && !top.includes(k))
    const rest = cumsum(P.b(vals(x => !top.includes(norm(x)))))
    if (rest.some(v => v > 0)) out.push({ key: 'rest', label: restTypes.length === 1 ? labelOf(restTypes[0]) : t.others, values: rest, tone: 4 })
    return out.length ? out : [{ key: 'n', label: t.deeds, values: cumsum(P.b(cur.count)), tone: 1 }]
  }, [P, byDay, top, typeKeys, labelOf, t, cur.count, cur.per])

  const segItems = useMemo(() => {
    const rows = typeKeys.map(k => ({ key: k, label: labelOf(k), value: cur.per[k] || 0, prev: prev.per[k] || 0 }))
      .filter(r => r.value || r.prev).sort((a, b) => b.value - a.value || b.prev - a.prev)
    return rows.map((r, i) => ({ ...r, tone: i < 4 ? i + 1 : 'muted' }))
  }, [typeKeys, labelOf, cur.per, prev.per])

  const wdCur = weekdayAvg(P.keys, cur.count)
  const wdPrev = weekdayAvg(P.prevKeys, prev.count)

  const feed = useMemo(() => [...past].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 5).map(e => {
    const tp = types.find(x => x.key === e.type)
    const ms = Number(e.id)
    const sameDay = ms > 1e12 && new Date(ms).toDateString() === new Date(`${e.date}T12:00:00`).toDateString()
    return {
      key: `c-${e.id}`, icon: tp?.icon || 'charity', time: sameDay ? ms : e.date,
      title: e.description ? e.description.slice(0, 80) : labelOf(e.type),
      meta: e.amount > 0 ? amt(e.amount) : undefined,
      chip: e.description ? { label: labelOf(e.type), tone: e.type === 'money' ? 'accent' : 'muted' } : undefined,
    }
  }), [past, types, labelOf]) // eslint-disable-line react-hooks/exhaustive-deps

  const modes = [{ value: 'types', label: t.mTypes }, { value: 'cmp', label: t.mCmp }, ...(hasAmount ? [{ value: 'amt', label: t.mAmt }] : [])]
  const m = mode === 'amt' && !hasAmount ? 'types' : mode

  return (
    <InsightsSection id="ch-ins" className={className} alt title={t.title} lead={t.lead} lang={lang} range={range} onRange={setRange} hasData={hasData}
      empty={{ text: t.empty, action: { label: t.start, icon: 'plus', href: '#ch-add' } }}>
      <BentoGrid>
        {kpis.map(k => (
          <KpiCard key={k.key} span={3} icon={k.icon} label={k.label} value={k.value} unit={k.unit} lang={lang}
            delta={k.delta || null} hint={k.hintAlways || (k.delta ? undefined : P.v.noPrev)} spark={k.spark}
            sparkLabel={k.spark ? P.v.sparkOf(k.label) : undefined} tone={k.tone || 1} />
        ))}

        <ChartCard span={8} id="ch-ins-chart" title={t.chart} sub={m === 'types' ? t.subTypes : m === 'cmp' ? t.subCmp : t.subAmt}
          actions={<RangeTabs options={modes} value={m} onChange={setMode} label={t.mode} />}>
          {m === 'types' && (
            <AreaChart key={`t-${range}`} mode="stacked" height={260} integer curve="linear" legendValue="last" label={t.chart} labels={P.labels} xFormat={P.xTick} tooltipTitle={P.tipTitle} lang={lang} series={stackSeries} />
          )}
          {m === 'cmp' && (
            <LineChart key={`c-${range}`} height={260} integer curve="linear" legendValue="last" label={t.chart} labels={P.labels} xFormat={P.xTick} tooltipTitle={P.tipTitle} lang={lang}
              series={[{ key: 'n', label: t.deeds, values: cumsum(P.b(cur.count)), compare: cumsum(P.b(prev.count)), tone: 1 }]} />
          )}
          {m === 'amt' && (
            <LineChart key={`a-${range}`} height={260} curve="linear" legendValue="last" label={t.mAmt} labels={P.labels} xFormat={P.xTick} tooltipTitle={P.tipTitle} lang={lang} valueFormat={amt}
              series={[{ key: 'a', label: t.amount, values: cumsum(P.b(cur.amt)), compare: cumsum(P.b(prev.amt)), tone: 2 }]} />
          )}
        </ChartCard>

        <ChartCard span={4} id="ch-ins-seg" className="ins-half" title={t.seg} sub={t.segSub}>
          <SegmentBreakdown label={t.seg} lang={lang} items={segItems} />
          {!segItems.length && <p className="vz-empty">{P.v.feedEmpty}</p>}
        </ChartCard>

        <ChartCard span={8} id="ch-ins-heat" title={t.heat} sub={t.heatSub}>
          <CalendarHeatmap data={(k) => byDay[k]?.n || 0} end={today} maxWeeks={26} label={t.heat} format={(n) => t.cell(f.num(n))} lang={lang} />
        </ChartCard>

        <ChartCard span={4} id="ch-ins-feed" className="ins-half" title={P.v.feedTitle} sub={t.feedSub}>
          <ActivityFeed items={feed} label={P.v.feedTitle} lang={lang} empty={<p className="vz-empty">{P.v.feedEmpty}</p>} />
        </ChartCard>

        <ChartCard span={12} id="ch-ins-wd" className="ins-wd" title={P.v.wdTitle} sub={t.wdSub}>
          <CompareBars label={P.v.wdTitle} lang={lang} currentLabel={P.v.ranges[range]} format={(n) => f.num(n)}
            items={P.wd.map((w, i) => ({ key: i, label: w, value: wdCur[i], prev: wdPrev[i] }))} />
        </ChartCard>
      </BentoGrid>
    </InsightsSection>
  )
}
