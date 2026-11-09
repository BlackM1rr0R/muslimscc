// ═══════════════════════════════════════════════════════
// HistoryNumbers — "Tarix rəqəmlərlə" (/history)
//
//   <HistoryNumbers lang prophets={PROPHETS} events={EVENTS} eras={HISTORY_ERAS} eraOf={eraOfEvent} yearOf={eventYear} ululAzm={ULUL_AZM} />
//
// Yalnız data/islamicHistory.js-dən: bu səhifədəki hadisələrin miladi ili və dövrü.
// Qrafik bütün tarixi deyil, saytdakı seçilmiş hadisələri sayır — alt yazıda deyilir.
// ═══════════════════════════════════════════════════════
import { useMemo } from 'react'
import NumbersSection from './NumbersSection'
import { KpiCard, ChartCard, AreaChart, MiniTable, InlineBar, useVizFormat } from '../viz'
import { pickUi } from '../../utils/uiText'

const TXT = {
  az: {
    title: 'Tarix rəqəmlərlə', lead: 'Bu səhifədəki peyğəmbərlər və hadisələr — əsrlərə və dövrlərə görə.',
    prophets: 'Peyğəmbər', prophetsHint: 'Quranda adı çəkilən', ulul: 'Ülul-əzm', ululHint: 'Əhzab 33:7, Şura 42:13', events: 'Hadisə', eventsHint: 'bu səhifədə', span: 'Aralıq', years: 'il',
    byCent: 'Hadisələr əsrlər üzrə', byCentSub: 'miladi əsr; saytdakı seçilmiş hadisələr, bütün tarix deyil', cent: (c) => `${c}-ci əsr`, nEv: 'Hadisə',
    eras: 'Dövrlər', erasSub: 'illər və bu səhifədəki hadisələr', colEra: 'Dövr', colEv: 'Hadisə', now: 'bu gün',
  },
  en: {
    title: 'History in numbers', lead: 'The prophets and events on this page — by century and by era.',
    prophets: 'Prophets', prophetsHint: 'named in the Quran', ulul: 'Ulul-ʿazm', ululHint: 'al-Ahzab 33:7, ash-Shura 42:13', events: 'Events', eventsHint: 'on this page', span: 'Span', years: 'years',
    byCent: 'Events by century', byCentSub: 'century CE; the selected events on this site, not all of history', cent: (c) => `Century ${c} CE`, nEv: 'Events',
    eras: 'Eras', erasSub: 'years and events on this page', colEra: 'Era', colEv: 'Events', now: 'today',
  },
  ru: {
    title: 'История в цифрах', lead: 'Пророки и события на этой странице — по векам и эпохам.',
    prophets: 'Пророки', prophetsHint: 'названы в Коране', ulul: 'Улуль-азм', ululHint: 'аль-Ахзаб 33:7, аш-Шура 42:13', events: 'События', eventsHint: 'на этой странице', span: 'Промежуток', years: 'лет',
    byCent: 'События по векам', byCentSub: 'век н. э.; отобранные на сайте события, а не вся история', cent: (c) => `${c} век н. э.`, nEv: 'События',
    eras: 'Эпохи', erasSub: 'годы и события на этой странице', colEra: 'Эпоха', colEv: 'События', now: 'сегодня',
  },
  ar: {
    title: 'التاريخ بالأرقام', lead: 'الأنبياء والأحداث في هذه الصفحة — حسب القرون والعصور.',
    prophets: 'الأنبياء', prophetsHint: 'المذكورون في القرآن', ulul: 'أولو العزم', ululHint: 'الأحزاب ٣٣:٧، الشورى ٤٢:١٣', events: 'الأحداث', eventsHint: 'في هذه الصفحة', span: 'المدى', years: 'سنة',
    byCent: 'الأحداث حسب القرون', byCentSub: 'القرن الميلادي؛ الأحداث المختارة في الموقع لا التاريخ كله', cent: (c) => `القرن ${c} م`, nEv: 'الأحداث',
    eras: 'العصور', erasSub: 'السنوات والأحداث في هذه الصفحة', colEra: 'العصر', colEv: 'الأحداث', now: 'اليوم',
  },
  tr: {
    title: 'Rakamlarla tarih', lead: 'Bu sayfadaki peygamberler ve olaylar — asırlara ve dönemlere göre.',
    prophets: 'Peygamber', prophetsHint: 'Kur’an’da adı geçen', ulul: 'Ülü’l-azm', ululHint: 'Ahzâb 33:7, Şûrâ 42:13', events: 'Olay', eventsHint: 'bu sayfada', span: 'Aralık', years: 'yıl',
    byCent: 'Asırlara göre olaylar', byCentSub: 'miladi asır; sitedeki seçilmiş olaylar, bütün tarih değil', cent: (c) => `Miladi ${c}. asır`, nEv: 'Olay',
    eras: 'Dönemler', erasSub: 'yıllar ve bu sayfadaki olaylar', colEra: 'Dönem', colEv: 'Olay', now: 'bugün',
  },
}
const pick = (o, lang) => (o ? (o[lang] ?? o.en) : '')

export default function HistoryNumbers({ lang = 'az', prophets = [], events = [], eras = [], eraOf, yearOf, ululAzm = [] }) {
  const t = pickUi(TXT, lang, 'en')
  const f = useVizFormat(lang)
  const years = useMemo(() => events.map(yearOf).filter(y => y > 0), [events, yearOf])
  const lo = Math.min(...years), hi = Math.max(...years)
  const cents = useMemo(() => {
    const a = Math.ceil(lo / 100), b = Math.ceil(hi / 100)
    const list = []
    for (let c = a; c <= b; c++) list.push({ c, n: years.filter(y => Math.ceil(y / 100) === c).length })
    return list
  }, [years, lo, hi])
  const eraRows = useMemo(() => eras.map(e => ({ key: e.key, e, n: events.filter(ev => eraOf(ev) === e.key).length })), [eras, events, eraOf])
  const maxN = Math.max(1, ...eraRows.map(r => r.n))
  if (!years.length) return null

  return (
    <NumbersSection id="hx-numbers" lang={lang} title={t.title} lead={t.lead}>
      <KpiCard span={3} icon="history" label={t.prophets} value={f.num(prophets.length)} hint={t.prophetsHint} />
      <KpiCard span={3} icon="star" label={t.ulul} value={f.num(ululAzm.length)} hint={t.ululHint} tone={2} />
      <KpiCard span={3} icon="calendar" label={t.events} value={f.num(events.length)} hint={t.eventsHint} />
      <KpiCard span={3} icon="clock" label={t.span} value={f.num(hi - lo)} unit={t.years} hint={`${lo}–${hi}`} />

      <ChartCard span={7} id="hxn-cent" title={t.byCent} sub={t.byCentSub}>
        <AreaChart integer height={240} dots label={t.byCent} labels={cents.map(c => c.c)} xFormat={(c) => String(c)} tooltipTitle={(c) => t.cent(c)}
          series={[{ key: 'ev', label: t.nEv, values: cents.map(c => c.n), tone: 1 }]} legend={false} />
      </ChartCard>

      <ChartCard span={5} id="hxn-eras" title={t.eras} sub={t.erasSub} flush>
        <MiniTable caption={t.eras} rows={eraRows} columns={[
          { key: 'e', label: t.colEra, render: r => <>{pick(r.e.name, lang)}<span className="nm-sub ui-num">{r.e.from}–{r.e.to ?? t.now}</span></> },
          { key: 'n', label: t.colEv, render: r => <InlineBar value={r.n} max={maxN} label={`${pick(r.e.name, lang)}: ${r.n}`} format={(v) => f.num(v)} /> },
        ]} />
      </ChartCard>
    </NumbersSection>
  )
}
