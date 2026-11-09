// ═══════════════════════════════════════════════════════
// PeopleNumbers — "Alimlər rəqəmlərlə" (/scholars) və "Səhabələr rəqəmlərlə" (/sahaba)
//
//   <ScholarsNumbers scholars={SCHOLARS} eras={ERAS} lang eraLabel={k => …} nameOf={s => …} hrefOf={s => …} onOpen={(s, e) => …} />
//   <SahabaNumbers rows={[{ key, name, h, approx, href, onClick }]} band={{ from, to }} lang />
//
// İllər — data/scholars.js (born/died hicri) və data/sahabaYears.js (vəfat ili).
// Doğum ili məlum olmayanlar ömür hesabına daxil edilmir (təxmin yox).
// ═══════════════════════════════════════════════════════
import { useMemo } from 'react'
import NumbersSection from './NumbersSection'
import { KpiCard, ChartCard, AreaChart, SegmentBreakdown, CompareBars, MiniTable, InlineBar, useVizFormat } from '../viz'
import { scholarsByCentury, lifespans, decadeBuckets } from '../../utils/numbersData'
import { pickUi } from '../../utils/uiText'

const TXT = {
  az: {
    sTitle: 'Alimlər rəqəmlərlə', sLead: 'Bu siyahıdakı alimlərin dövrlərə və hicri əsrlərə bölgüsü, ömür uzunluğu — kartlardakı tarixlərdən hesablanıb.',
    count: 'Alim', eras: 'Dövr', avgLife: 'Orta ömür', longest: 'Ən uzun ömür', years: 'il', ofKnown: (n) => `doğum ili məlum olan ${n} alim`,
    byCent: 'Hicri əsrlər üzrə', byCentSub: 'vəfat (sağdırsa — doğum) əsrinə görə', cent: (c) => `${c}-ci əsr`, centAxis: (c) => `${c}`,
    byEra: 'Dövrlər üzrə', byEraSub: 'siyahıdakı alimlərin sayı',
    lifeEra: 'Dövrlərə görə orta ömür', lifeEraSub: 'hicri il; boz — bütün siyahının ortası', all: 'Hamısı',
    lives: 'Ən uzun ömürlər', livesSub: 'hicri təqvimlə', colName: 'Alim', colYears: 'Ömür', approx: 'təxminən',
    aTitle: 'Səhabələr rəqəmlərlə', aLead: 'Bu siyahıdakı səhabələrin vəfat illəri onilliklərə görə və raşid xəlifələr dövrünə nisbətən.',
    aCount: 'Səhabə', first: 'İlk vəfat', last: 'Son vəfat', span: 'Aralıq',
    byDec: 'Vəfat illəri onilliklərlə', byDecSub: 'hicri il; neçə səhabə', decade: (a, b) => `h. ${a}–${b}`,
    phase: 'Xilafətə nisbətən', phaseSub: 'raşid xəlifələr dövrü: h. {a}–{b}', before: 'Ondan əvvəl', during: 'Raşid xəlifələr dövründə', after: 'Ondan sonra',
    hYear: (h) => (h < 0 ? `hicrətdən ${-h} il əvvəl` : `h. ${h}`),
    bh: 'il hicrətdən əvvəl',
  },
  en: {
    sTitle: 'The scholars in numbers', sLead: 'How the scholars in this list spread across eras and Hijri centuries, and how long they lived — calculated from the dates on the cards.',
    count: 'Scholars', eras: 'Eras', avgLife: 'Average lifespan', longest: 'Longest life', years: 'years', ofKnown: (n) => `${n} scholars with a known birth year`,
    byCent: 'By Hijri century', byCentSub: 'century of death (of birth, if living)', cent: (c) => `Century ${c} AH`, centAxis: (c) => `${c}`,
    byEra: 'By era', byEraSub: 'number of scholars in the list',
    lifeEra: 'Average lifespan by era', lifeEraSub: 'Hijri years; grey — the whole list’s average', all: 'All',
    lives: 'Longest lives', livesSub: 'by the Hijri calendar', colName: 'Scholar', colYears: 'Lifespan', approx: 'approx.',
    aTitle: 'The Companions in numbers', aLead: 'The death years of the Companions in this list by decade and relative to the era of the rightly guided caliphs.',
    aCount: 'Companions', first: 'First to pass away', last: 'Last to pass away', span: 'Span',
    byDec: 'Death years by decade', byDecSub: 'Hijri years; number of Companions', decade: (a, b) => `${a}–${b} AH`,
    phase: 'Relative to the caliphate', phaseSub: 'era of the rightly guided caliphs: {a}–{b} AH', before: 'Before it', during: 'During the caliphate', after: 'After it',
    hYear: (h) => (h < 0 ? `${-h} years before the Hijrah` : `${h} AH`),
    bh: 'years before the Hijrah',
  },
  ru: {
    sTitle: 'Учёные в цифрах', sLead: 'Как учёные этого списка распределены по эпохам и векам хиджры и сколько они прожили — по датам на карточках.',
    count: 'Учёные', eras: 'Эпохи', avgLife: 'Средняя жизнь', longest: 'Самая долгая жизнь', years: 'лет', ofKnown: (n) => `учёных с известным годом рождения: ${n}`,
    byCent: 'По векам хиджры', byCentSub: 'век смерти (рождения, если жив)', cent: (c) => `${c} век хиджры`, centAxis: (c) => `${c}`,
    byEra: 'По эпохам', byEraSub: 'число учёных в списке',
    lifeEra: 'Средняя жизнь по эпохам', lifeEraSub: 'годы хиджры; серым — среднее по всему списку', all: 'Все',
    lives: 'Самые долгие жизни', livesSub: 'по календарю хиджры', colName: 'Учёный', colYears: 'Жизнь', approx: 'ок.',
    aTitle: 'Сподвижники в цифрах', aLead: 'Годы смерти сподвижников этого списка по десятилетиям и относительно эпохи праведных халифов.',
    aCount: 'Сподвижники', first: 'Первым скончался', last: 'Последним скончался', span: 'Промежуток',
    byDec: 'Годы смерти по десятилетиям', byDecSub: 'годы хиджры; число сподвижников', decade: (a, b) => `${a}–${b} г. х.`,
    phase: 'Относительно халифата', phaseSub: 'эпоха праведных халифов: {a}–{b} г. х.', before: 'До неё', during: 'Во время халифата', after: 'После неё',
    hYear: (h) => (h < 0 ? `за ${-h} г. до хиджры` : `${h} г. х.`),
    bh: 'г. до хиджры',
  },
  ar: {
    sTitle: 'العلماء بالأرقام', sLead: 'توزّع علماء هذه القائمة على العصور والقرون الهجرية وأعمارهم — محسوبة من التواريخ في البطاقات.',
    count: 'العلماء', eras: 'العصور', avgLife: 'متوسط العمر', longest: 'أطول عمر', years: 'سنة', ofKnown: (n) => `${n} عالمًا معروف سنة المولد`,
    byCent: 'حسب القرن الهجري', byCentSub: 'قرن الوفاة (أو المولد للأحياء)', cent: (c) => `القرن ${c} هـ`, centAxis: (c) => `${c}`,
    byEra: 'حسب العصر', byEraSub: 'عدد العلماء في القائمة',
    lifeEra: 'متوسط العمر حسب العصر', lifeEraSub: 'بالسنين الهجرية؛ الرمادي متوسط القائمة كلها', all: 'الكل',
    lives: 'أطول الأعمار', livesSub: 'بالتقويم الهجري', colName: 'العالم', colYears: 'العمر', approx: 'نحو',
    aTitle: 'الصحابة بالأرقام', aLead: 'سنوات وفاة الصحابة في هذه القائمة حسب العقود، وموقعها من عهد الخلفاء الراشدين.',
    aCount: 'الصحابة', first: 'أول من توفي', last: 'آخر من توفي', span: 'المدى',
    byDec: 'سنوات الوفاة حسب العقود', byDecSub: 'بالسنين الهجرية؛ عدد الصحابة', decade: (a, b) => `${a}–${b} هـ`,
    phase: 'بالنسبة إلى الخلافة', phaseSub: 'عهد الخلفاء الراشدين: {a}–{b} هـ', before: 'قبله', during: 'في عهد الخلفاء الراشدين', after: 'بعده',
    hYear: (h) => (h < 0 ? `قبل الهجرة بـ${-h} سنين` : `${h} هـ`),
    bh: 'سنوات قبل الهجرة',
  },
  tr: {
    sTitle: 'Rakamlarla âlimler', sLead: 'Bu listedeki âlimlerin dönemlere ve hicri asırlara dağılımı ve ömürleri — kartlardaki tarihlerden hesaplandı.',
    count: 'Âlim', eras: 'Dönem', avgLife: 'Ortalama ömür', longest: 'En uzun ömür', years: 'yıl', ofKnown: (n) => `doğum yılı bilinen ${n} âlim`,
    byCent: 'Hicri asırlara göre', byCentSub: 'vefat (hayattaysa doğum) asrına göre', cent: (c) => `Hicri ${c}. asır`, centAxis: (c) => `${c}`,
    byEra: 'Dönemlere göre', byEraSub: 'listedeki âlim sayısı',
    lifeEra: 'Dönemlere göre ortalama ömür', lifeEraSub: 'hicri yıl; gri — bütün listenin ortalaması', all: 'Tümü',
    lives: 'En uzun ömürler', livesSub: 'hicri takvimle', colName: 'Âlim', colYears: 'Ömür', approx: 'yak.',
    aTitle: 'Rakamlarla sahabeler', aLead: 'Bu listedeki sahabelerin vefat yılları on yıllara göre ve Râşid halifeler dönemine göre.',
    aCount: 'Sahabe', first: 'İlk vefat', last: 'Son vefat', span: 'Aralık',
    byDec: 'On yıllara göre vefat yılları', byDecSub: 'hicri yıl; sahabe sayısı', decade: (a, b) => `h. ${a}–${b}`,
    phase: 'Hilafete göre', phaseSub: 'Râşid halifeler dönemi: h. {a}–{b}', before: 'Ondan önce', during: 'Râşid halifeler döneminde', after: 'Ondan sonra',
    hYear: (h) => (h < 0 ? `hicretten ${-h} yıl önce` : `h. ${h}`),
    bh: 'yıl hicretten önce',
  },
}

export function ScholarsNumbers({ scholars = [], eras = [], lang = 'az', eraLabel = (k) => k, nameOf = (s) => s.slug, hrefOf, onOpen }) {
  const t = pickUi(TXT, lang, 'en')
  const f = useVizFormat(lang)
  const cent = useMemo(() => scholarsByCentury(scholars, eras), [scholars, eras])
  const lives = useMemo(() => lifespans(scholars), [scholars])
  const avg = lives.length ? Math.round(lives.reduce((s, l) => s + l.years, 0) / lives.length) : null
  const eraAvg = eras.map((k, i) => {
    const ls = lives.filter(l => l.s.era === k)
    return { key: k, label: eraLabel(k), value: ls.length ? Math.round(ls.reduce((s, l) => s + l.years, 0) / ls.length) : 0, prev: avg, tone: i + 1 }
  }).filter(r => r.value > 0)
  const top = lives.slice(0, 6)
  const best = lives[0]

  return (
    <NumbersSection id="sc-numbers" lang={lang} title={t.sTitle} lead={t.sLead}>
      <KpiCard span={3} icon="scholars" label={t.count} value={f.num(scholars.length)} count={scholars.length} hint={`${eras.length} ${t.eras.toLowerCase()}`} />
      <KpiCard span={3} icon="clock" label={t.avgLife} value={avg != null ? f.num(avg) : '—'} unit={t.years} hint={t.ofKnown(lives.length)} />
      <KpiCard span={6} icon="star" label={t.longest} value={best ? f.num(best.years) : '—'} unit={t.years} hint={best ? nameOf(best.s) : ''} tone={2} />

      <ChartCard span={8} id="scn-cent" title={t.byCent} sub={t.byCentSub}>
        <AreaChart mode="stacked" integer height={240} label={t.byCent} labels={cent.centuries}
          xFormat={(c) => t.centAxis(c)} tooltipTitle={(c) => t.cent(c)}
          series={eras.map((k, i) => ({ key: k, label: eraLabel(k), values: cent.byEra[k], tone: i + 1 }))} />
      </ChartCard>

      <ChartCard span={4} id="scn-era" title={t.byEra} sub={t.byEraSub}>
        <SegmentBreakdown label={t.byEra} lang={lang}
          items={eras.map((k, i) => ({ key: k, label: eraLabel(k), value: scholars.filter(s => s.era === k).length, tone: i + 1 }))} />
      </ChartCard>

      <ChartCard span={5} id="scn-life" title={t.lifeEra} sub={t.lifeEraSub}>
        <CompareBars label={t.lifeEra} lang={lang} items={eraAvg} currentLabel={t.avgLife} prevLabel={`${t.all} (${avg})`} format={(v) => f.num(v)} />
      </ChartCard>

      <ChartCard span={7} id="scn-lives" title={t.lives} sub={t.livesSub} flush>
        <MiniTable caption={t.lives} rows={top.map(l => ({ key: l.s.slug, ...l }))} columns={[
          { key: 'name', label: t.colName, render: r => (
            <a className="nm-link" href={hrefOf ? hrefOf(r.s) : undefined} onClick={onOpen ? (e) => onOpen(r.s, e) : undefined}>
              {nameOf(r.s)}<span className="nm-sub">{eraLabel(r.s.era)} · {t.decade(r.s.born.h, r.s.died.h)}</span>
            </a>
          ) },
          { key: 'years', label: t.colYears, render: r => (
            <InlineBar value={r.years} max={top[0]?.years || 1} tone={eras.indexOf(r.s.era) + 1}
              label={`${nameOf(r.s)}: ${r.years} ${t.years}`} format={(v) => `${r.approx ? `${t.approx} ` : ''}${f.num(v)} ${t.years}`} />
          ) },
        ]} />
      </ChartCard>
    </NumbersSection>
  )
}

export function SahabaNumbers({ rows = [], band = { from: 11, to: 40 }, lang = 'az' }) {
  const t = pickUi(TXT, lang, 'en')
  const f = useVizFormat(lang)
  const years = rows.map(r => r.h)
  const buckets = useMemo(() => decadeBuckets(years), [years.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!rows.length) return null
  const sorted = rows.slice().sort((a, b) => a.h - b.h)
  const first = sorted[0], last = sorted[sorted.length - 1]
  const phase = [
    { key: 'before', label: t.before, value: rows.filter(r => r.h < band.from).length, tone: 3 },
    { key: 'during', label: t.during, value: rows.filter(r => r.h >= band.from && r.h <= band.to).length, tone: 2 },
    { key: 'after', label: t.after, value: rows.filter(r => r.h > band.to).length, tone: 1 },
  ]
  return (
    <NumbersSection id="sp-numbers" lang={lang} title={t.aTitle} lead={t.aLead}>
      <KpiCard span={3} icon="sahaba" label={t.aCount} value={f.num(rows.length)} />
      <KpiCard span={3} icon="moon" label={t.first} value={first.h < 0 ? f.num(-first.h) : t.hYear(first.h)} unit={first.h < 0 ? t.bh : undefined} hint={first.name} />
      <KpiCard span={3} icon="moonStar" label={t.last} value={last.h < 0 ? f.num(-last.h) : t.hYear(last.h)} unit={last.h < 0 ? t.bh : undefined} hint={last.name} tone={2} />
      <KpiCard span={3} icon="clock" label={t.span} value={f.num(last.h - first.h)} unit={t.years} />

      <ChartCard span={8} id="spn-dec" title={t.byDec} sub={t.byDecSub}>
        <AreaChart integer height={220} curve="linear" dots label={t.byDec} labels={buckets.map(b => b.from)}
          xFormat={(a) => String(a)} tooltipTitle={(a) => t.decade(a, a + 9)}
          series={[{ key: 'n', label: t.aCount, values: buckets.map(b => b.count), tone: 1 }]} legend={false} />
      </ChartCard>

      <ChartCard span={4} id="spn-phase" title={t.phase} sub={t.phaseSub.replace('{a}', band.from).replace('{b}', band.to)}>
        <SegmentBreakdown label={t.phase} items={phase} lang={lang} />
      </ChartCard>
    </NumbersSection>
  )
}
