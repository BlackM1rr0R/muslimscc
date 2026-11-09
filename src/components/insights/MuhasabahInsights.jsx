// ═══════════════════════════════════════════════════════
// /muhasabah → "Analitika" bento (viz v2)
// Məlumat: səhifənin öz yoxlanmış qeydləri ('muslim_cc_muhasabah_v1') — yalnız bu cihaz.
// Gün "qeydli"dir, əgər ən azı bir işarə və ya qeyd varsa (səhifənin streaks() qaydası).
// ═══════════════════════════════════════════════════════
import { useMemo, useState, useCallback } from 'react'
import { BentoGrid, ChartCard, KpiCard, LineChart, CalendarHeatmap, CompareBars, ActivityFeed, makeFormat } from '../viz'
import { InsightsSection, useInsightPeriod, scrollToSel } from './Insights.jsx'
import { pickUi } from '../../utils/uiText'
import { deltaOf, rolling, weekdayAvg, streakBack, bestRun, earliest } from '../../utils/trackerInsights.js'
import { muhasabahIndex, muhasabahStats } from '../../utils/journalInsights.js'

const T = {
  az: {
    title: 'Mühasəbə analitikası', lead: 'Neçə gün özünüzü hesaba çəkdiniz, hansı əməllər davamlıdır və hansılar unudulur.',
    empty: 'Hələ mühasəbə qeydi yoxdur. Bu günün suallarını işarələyin — dinamika və əməllər üzrə müqayisə burada görünəcək.', start: 'Bu günü yaz',
    kDays: 'Mühasəbə günləri', kAvg: 'Gündə orta bənd', kFull: 'Tam gün', kStreak: 'Ardıcıl gün', bestHint: (n) => `rekord: ${n} gün`,
    chart: 'Gündə işarələnən bəndlər', chartSub: 'hər gün neçə bənd; ştrixli xətt — əvvəlki dövr', marks: 'Bənd',
    items: 'Əməllər üzrə', itemsSub: 'dövrdə neçə gün edilib — bu və əvvəlki dövr',
    heat: 'Mühasəbə təqvimi', heatSub: 'hər xana bir gün — tünd = daha çox bənd', cell: (n) => `${n} bənd`,
    feedSub: 'son yazılan günlər', fTitle: (n, m) => `${n} / ${m} bənd işarələndi`, fNote: 'yalnız qeyd yazılıb', noteMeta: 'qeyd var', missed: (s) => `qalıb: ${s}`, cFull: 'Tam', cDay: 'Mühasəbə',
  },
  en: {
    title: 'Self-reckoning analytics', lead: 'How many days you held yourself to account, which deeds are steady and which get forgotten.',
    empty: 'No self-reckoning yet. Tick today’s questions — trends and a per-deed comparison will appear here.', start: 'Write today',
    kDays: 'Reckoning days', kAvg: 'Items per day', kFull: 'Complete days', kStreak: 'Day streak', bestHint: (n) => `best: ${n} days`,
    chart: 'Items ticked per day', chartSub: 'items each day; dashed line — previous period', marks: 'Items',
    items: 'By deed', itemsSub: 'days done in the period — this and the previous one',
    heat: 'Reckoning calendar', heatSub: 'each square is a day — darker = more items', cell: (n) => `${n} items`,
    feedSub: 'the most recently written days', fTitle: (n, m) => `${n} of ${m} items ticked`, fNote: 'note only', noteMeta: 'has a note', missed: (s) => `not ticked: ${s}`, cFull: 'Complete', cDay: 'Reckoning',
  },
  ru: {
    title: 'Аналитика мухасабы', lead: 'Сколько дней вы спрашивали с себя отчёт, какие дела постоянны, а какие забываются.',
    empty: 'Записей мухасабы пока нет. Отметьте сегодняшние вопросы — здесь появятся динамика и сравнение по делам.', start: 'Записать сегодня',
    kDays: 'Дни мухасабы', kAvg: 'Пунктов в день', kFull: 'Полные дни', kStreak: 'Дней подряд', bestHint: (n) => `рекорд: ${n} дн.`,
    chart: 'Отмечено пунктов за день', chartSub: 'пунктов за день; пунктир — прошлый период', marks: 'Пункты',
    items: 'По делам', itemsSub: 'сколько дней выполнено — этот и прошлый период',
    heat: 'Календарь мухасабы', heatSub: 'каждая клетка — день; темнее = больше пунктов', cell: (n) => `пунктов: ${n}`,
    feedSub: 'последние записанные дни', fTitle: (n, m) => `отмечено ${n} из ${m}`, fNote: 'только заметка', noteMeta: 'есть заметка', missed: (s) => `не отмечено: ${s}`, cFull: 'Полный', cDay: 'Мухасаба',
  },
  ar: {
    title: 'تحليلات المحاسبة', lead: 'كم يومًا حاسبت فيه نفسك، وأي الأعمال ثابتة وأيها يُنسى.',
    empty: 'لا محاسبة مسجّلة بعد. علّم أسئلة اليوم — وستظهر هنا الاتجاهات والمقارنة حسب العمل.', start: 'اكتب اليوم',
    kDays: 'أيام المحاسبة', kAvg: 'البنود في اليوم', kFull: 'أيام كاملة', kStreak: 'أيام متتالية', bestHint: (n) => `الأفضل: ${n} يومًا`,
    chart: 'البنود المعلّمة في اليوم', chartSub: 'البنود كل يوم؛ الخط المتقطع — الفترة السابقة', marks: 'البنود',
    items: 'حسب العمل', itemsSub: 'عدد الأيام في الفترة — هذه والسابقة',
    heat: 'تقويم المحاسبة', heatSub: 'كل مربع يوم — الأغمق = بنود أكثر', cell: (n) => `${n} بنود`,
    feedSub: 'آخر الأيام المكتوبة', fTitle: (n, m) => `علّمت ${n} من ${m} بنود`, fNote: 'ملاحظة فقط', noteMeta: 'فيه ملاحظة', missed: (s) => `لم يُعلَّم: ${s}`, cFull: 'كامل', cDay: 'محاسبة',
  },
  tr: {
    title: 'Muhasebe analizi', lead: 'Kaç gün nefsinizi hesaba çektiniz, hangi ameller süreklidir, hangileri unutuluyor.',
    empty: 'Henüz muhasebe kaydı yok. Bugünün sorularını işaretleyin — seyir ve amellere göre karşılaştırma burada görünecek.', start: 'Bugünü yaz',
    kDays: 'Muhasebe günleri', kAvg: 'Günde ortalama madde', kFull: 'Tam gün', kStreak: 'Gün serisi', bestHint: (n) => `rekor: ${n} gün`,
    chart: 'Günde işaretlenen maddeler', chartSub: 'her gün kaç madde; kesikli çizgi — önceki dönem', marks: 'Madde',
    items: 'Amellere göre', itemsSub: 'dönemde kaç gün yapıldı — bu ve önceki dönem',
    heat: 'Muhasebe takvimi', heatSub: 'her kare bir gün — koyu = daha çok madde', cell: (n) => `${n} madde`,
    feedSub: 'en son yazılan günler', fTitle: (n, m) => `${m} maddeden ${n} işaretlendi`, fNote: 'yalnızca not', noteMeta: 'not var', missed: (s) => `işaretlenmedi: ${s}`, cFull: 'Tam', cDay: 'Muhasebe',
  },
}

/** entries — səhifənin sanitizeEntries() nəticəsi; items — ITEMS; labels — qısa adlar (5 dildə). */
export default function MuhasabahInsights({ entries, today, items, labels, lang }) {
  const t = pickUi(T, lang, 'en')
  const f = useMemo(() => makeFormat(lang), [lang])
  const [range, setRange] = useState(30)
  const P = useInsightPeriod(range, today, f, lang)
  const byDay = useMemo(() => muhasabahIndex(entries), [entries])
  const first = useMemo(() => earliest(Object.keys(byDay)), [byDay])
  const hasData = !!first
  const N = items.length

  const cur = useMemo(() => muhasabahStats(byDay, P.keys, items), [byDay, P.keys, items])
  const prev = useMemo(() => muhasabahStats(byDay, P.prevKeys, items), [byDay, P.prevKeys, items])
  const eff = first ? P.keys.filter(k => k >= first).length : 0
  const has = useCallback((k) => !!byDay[k], [byDay])
  const streak = useMemo(() => streakBack(has, today), [has, today])
  const best = useMemo(() => bestRun(has, first, today), [has, first, today])

  const daySeries = P.keys.map(k => (byDay[k] ? 1 : 0))
  const fullSeries = cur.series.map(n => (n === N ? 1 : 0))
  const avgSeries = P.bucket > 1
    ? P.b(cur.series).map((s, i) => { const d = P.b(daySeries)[i]; return d ? Math.round((s / d) * 10) / 10 : 0 })
    : cur.series
  const kpis = [
    { key: 'd', icon: 'muhasabah', label: t.kDays, value: f.num(cur.days), unit: `/ ${f.num(eff || P.keys.length)}`, delta: deltaOf(cur.days, prev.days, P.vs), spark: P.bucket > 1 ? P.b(daySeries) : rolling(daySeries) },
    { key: 'a', icon: 'list', label: t.kAvg, value: f.num(cur.avg), unit: `/ ${N}`, delta: deltaOf(cur.avg, prev.avg, P.vs), spark: avgSeries, tone: 3 },
    { key: 'f', icon: 'star', label: t.kFull, value: f.num(cur.full), delta: deltaOf(cur.full, prev.full, P.vs), spark: P.bucket > 1 ? P.b(fullSeries) : rolling(fullSeries), tone: 2 },
    { key: 's', icon: 'bolt', label: t.kStreak, value: f.num(streak), unit: P.v.days, hint: t.bestHint(f.num(best)), spark: null },
  ]

  const wdCur = weekdayAvg(P.keys, cur.series)
  const wdPrev = weekdayAvg(P.prevKeys, prev.series)

  const feed = useMemo(() => Object.keys(byDay).filter(k => k <= today).sort().reverse().slice(0, 5).map(k => {
    const d = byDay[k]
    const sameDay = d.u > 1e12 && new Date(d.u).toDateString() === new Date(`${k}T12:00:00`).toDateString()
    const missing = items.filter(id => !d.c.includes(id))
    // Qısa: işarələnməyən 1–2 bənd adı (nə unudulub), daha çoxdursa yalnız say
    const names = d.n && missing.length && missing.length <= 2 ? missing.map(id => labels[id] || id).join(', ') : ''
    return {
      key: k, icon: d.n === N ? 'check' : 'muhasabah', time: sameDay ? d.u : k,
      title: d.n ? t.fTitle(f.num(d.n), N) : t.fNote,
      meta: [names ? t.missed(names) : '', d.note && d.n ? t.noteMeta : ''].filter(Boolean).join(' · ') || undefined,
      chip: d.n === N ? { label: t.cFull, tone: 'accent' } : { label: t.cDay, tone: 'muted' },
    }
  }), [byDay, today, labels, t, f, N, items])

  return (
    <InsightsSection id="mh-ins" title={t.title} lead={t.lead} lang={lang} range={range} onRange={setRange} hasData={hasData}
      empty={{ text: t.empty, action: { label: t.start, icon: 'edit', onClick: scrollToSel('.mh-day') } }}>
      <BentoGrid>
        {kpis.map(k => (
          <KpiCard key={k.key} span={3} icon={k.icon} label={k.label} value={k.value} unit={k.unit} lang={lang}
            delta={k.delta} hint={k.hint || (k.delta ? undefined : P.v.noPrev)} spark={k.spark || undefined}
            sparkLabel={k.spark ? P.v.sparkOf(k.label) : undefined} tone={k.tone || 1} />
        ))}

        <ChartCard span={8} id="mh-ins-chart" title={t.chart} sub={t.chartSub}>
          <LineChart key={`l-${range}`} height={260} integer={P.bucket === 1} label={t.chart} labels={P.labels} xFormat={P.xTick} tooltipTitle={P.tipTitle} lang={lang}
            yMax={P.bucket === 1 ? N : undefined}
            series={[{ key: 'm', label: t.marks, values: P.b(cur.series), compare: P.b(prev.series), tone: 1 }]} />
        </ChartCard>

        <ChartCard span={4} id="mh-ins-items" className="ins-half" title={t.items} sub={t.itemsSub}>
          <CompareBars label={t.items} lang={lang} currentLabel={P.v.ranges[range]} format={(n) => f.num(n)}
            items={items.map(id => ({ key: id, label: labels[id] || id, value: cur.per[id], prev: prev.per[id] }))} />
        </ChartCard>

        <ChartCard span={8} id="mh-ins-heat" title={t.heat} sub={t.heatSub}>
          <CalendarHeatmap data={(k) => byDay[k]?.n || 0} end={today} maxWeeks={26} label={t.heat}
            thresholds={[3, 5, 7]} format={(n) => t.cell(f.num(n))} lang={lang} />
        </ChartCard>

        <ChartCard span={4} id="mh-ins-feed" className="ins-half" title={P.v.feedTitle} sub={t.feedSub}>
          <ActivityFeed items={feed} label={P.v.feedTitle} lang={lang} empty={<p className="vz-empty">{P.v.feedEmpty}</p>} />
        </ChartCard>

        <ChartCard span={12} id="mh-ins-wd" className="ins-wd" title={P.v.wdTitle} sub={P.v.wdSub}>
          <CompareBars label={P.v.wdTitle} lang={lang} currentLabel={P.v.ranges[range]} format={(n) => f.num(n)} max={N}
            items={P.wd.map((w, i) => ({ key: i, label: w, value: wdCur[i], prev: wdPrev[i] }))} />
        </ChartCard>
      </BentoGrid>
    </InsightsSection>
  )
}
