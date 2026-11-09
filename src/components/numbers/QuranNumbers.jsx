// ═══════════════════════════════════════════════════════
// QuranNumbers — "Quran rəqəmlərlə" (/quran siyahısının altında)
//
//   <QuranNumbers lang="az" stats={{ reads, dates }} surahName={n => …} onOpen={n => …} hrefOf={n => …} />
//
// Ümumi: data/mushafIndex (ayə sayları), data/surahRevelation (Məkki/Mədəni,
// nazil olma sırası), data/juzMap (cüzlər) — utils/numbersData.js.
// Şəxsi: yalnız "quran_stats" (bu cihazda açılan surələr və oxu günləri).
// ═══════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import NumbersSection from './NumbersSection'
import {
  KpiCard, ChartCard, RangeTabs, AreaChart, SegmentBreakdown, CompareBars, MiniTable, InlineBar,
  GoalRing, CalendarHeatmap, useVizFormat,
} from '../viz'
import { pickUi } from '../../utils/uiText'
import { quranTotals, surahSeries, juzAyahs, readCoverage } from '../../utils/numbersData'

const TXT = {
  az: {
    title: 'Quran rəqəmlərlə', lead: 'Surələrin həcmi, Məkki və Mədəni surələr, cüzlər — mushafın öz cədvəllərindən hesablanıb.',
    surahs: 'Surə', ayahs: 'Ayə', makki: 'Məkki', madani: 'Mədəni', nSurahs: (n) => `${n} surə`, nAyahs: (n) => `${n} ayə`,
    perSurah: 'Surələrin ayə sayı', subM: 'mushaf sırası ilə (1 → 114)', subR: 'nazil olma sırası ilə (məşhur cədvəl, qəti deyil)',
    order: 'Sıra', oMushaf: 'Mushaf', oRev: 'Nazil olma', surahN: (n) => `Surə ${n}`,
    split: 'Məkki və Mədəni', splitSub: 'ayələrin payı; sətirdə — surə sayı',
    juz: 'Cüzlər', juzSub: 'hər cüzdəki ayə sayı; boz — orta', juzN: (n) => `${n}-ci cüz`, avg: 'Orta',
    len: 'Ən uzun və ən qısa', lenSub: 'ayə sayına görə', longest: 'Ən uzun', shortest: 'Ən qısa', colSurah: 'Surə', colAyahs: 'Ayə',
    mine: 'Sizin oxunuz', mineSub: 'bu cihazda açılan surələrin ayələri', mineCenter: 'Quranın', days: 'Oxu günləri', daysSub: 'Quran oxucusunu açdığınız günlər',
    dayN: (n) => (n ? 'oxunub' : 'oxunmayıb'), startTitle: 'Oxuya başlayın', startText: 'Surə açdıqca burada oxu günləriniz və Quranın nə qədərini açdığınız görünəcək. Məlumat yalnız bu cihazda saxlanılır.', start: 'əl-Fatihəni aç',
  },
  en: {
    title: 'The Quran in numbers', lead: 'The size of the surahs, Meccan and Medinan surahs, the juz’ — calculated from the mushaf tables themselves.',
    surahs: 'Surahs', ayahs: 'Ayahs', makki: 'Meccan', madani: 'Medinan', nSurahs: (n) => `${n} surahs`, nAyahs: (n) => `${n} ayahs`,
    perSurah: 'Ayahs per surah', subM: 'in mushaf order (1 → 114)', subR: 'in order of revelation (the well-known table, not definitive)',
    order: 'Order', oMushaf: 'Mushaf', oRev: 'Revelation', surahN: (n) => `Surah ${n}`,
    split: 'Meccan and Medinan', splitSub: 'share of the ayahs; number of surahs in each row',
    juz: 'The juz’', juzSub: 'ayahs in each juz’; grey — the average', juzN: (n) => `Juz’ ${n}`, avg: 'Average',
    len: 'Longest and shortest', lenSub: 'by number of ayahs', longest: 'Longest', shortest: 'Shortest', colSurah: 'Surah', colAyahs: 'Ayahs',
    mine: 'Your reading', mineSub: 'ayahs in the surahs opened on this device', mineCenter: 'of the Quran', days: 'Reading days', daysSub: 'days you opened the Quran reader',
    dayN: (n) => (n ? 'read' : 'not read'), startTitle: 'Start reading', startText: 'As you open surahs, your reading days and how much of the Quran you have opened will appear here. The data stays on this device.', start: 'Open al-Fatihah',
  },
  ru: {
    title: 'Коран в цифрах', lead: 'Объём сур, мекканские и мединские суры, джузы — подсчитано по таблицам самого мусхафа.',
    surahs: 'Суры', ayahs: 'Аяты', makki: 'Мекканские', madani: 'Мединские', nSurahs: (n) => `сур: ${n}`, nAyahs: (n) => `аятов: ${n}`,
    perSurah: 'Число аятов в сурах', subM: 'в порядке мусхафа (1 → 114)', subR: 'в порядке ниспослания (известная таблица, не окончательная)',
    order: 'Порядок', oMushaf: 'Мусхаф', oRev: 'Ниспослание', surahN: (n) => `Сура ${n}`,
    split: 'Мекканские и мединские', splitSub: 'доля аятов; в строке — число сур',
    juz: 'Джузы', juzSub: 'аятов в каждом джузе; серым — среднее', juzN: (n) => `Джуз ${n}`, avg: 'Среднее',
    len: 'Самые длинные и короткие', lenSub: 'по числу аятов', longest: 'Длинные', shortest: 'Короткие', colSurah: 'Сура', colAyahs: 'Аяты',
    mine: 'Ваше чтение', mineSub: 'аяты сур, открытых на этом устройстве', mineCenter: 'Корана', days: 'Дни чтения', daysSub: 'дни, когда вы открывали читалку Корана',
    dayN: (n) => (n ? 'читали' : 'не читали'), startTitle: 'Начните чтение', startText: 'Когда вы будете открывать суры, здесь появятся дни чтения и то, какую часть Корана вы открыли. Данные хранятся только на этом устройстве.', start: 'Открыть аль-Фатиху',
  },
  ar: {
    title: 'القرآن بالأرقام', lead: 'أطوال السور، والسور المكية والمدنية، والأجزاء — محسوبة من جداول المصحف نفسه.',
    surahs: 'السور', ayahs: 'الآيات', makki: 'مكية', madani: 'مدنية', nSurahs: (n) => `${n} سورة`, nAyahs: (n) => `${n} آية`,
    perSurah: 'عدد آيات كل سورة', subM: 'بترتيب المصحف (١ ← ١١٤)', subR: 'بترتيب النزول (الجدول المشهور، وليس قطعيًا)',
    order: 'الترتيب', oMushaf: 'المصحف', oRev: 'النزول', surahN: (n) => `السورة ${n}`,
    split: 'المكي والمدني', splitSub: 'نسبة الآيات، وعدد السور في كل سطر',
    juz: 'الأجزاء', juzSub: 'عدد الآيات في كل جزء؛ الرمادي هو المتوسط', juzN: (n) => `الجزء ${n}`, avg: 'المتوسط',
    len: 'الأطول والأقصر', lenSub: 'بحسب عدد الآيات', longest: 'الأطول', shortest: 'الأقصر', colSurah: 'السورة', colAyahs: 'الآيات',
    mine: 'قراءتك', mineSub: 'آيات السور التي فتحتها على هذا الجهاز', mineCenter: 'من القرآن', days: 'أيام القراءة', daysSub: 'الأيام التي فتحت فيها قارئ القرآن',
    dayN: (n) => (n ? 'قرأت' : 'لم تقرأ'), startTitle: 'ابدأ القراءة', startText: 'كلما فتحت سورة ظهرت هنا أيام قراءتك ومقدار ما فتحته من القرآن. تبقى البيانات على هذا الجهاز فقط.', start: 'افتح الفاتحة',
  },
  tr: {
    title: 'Rakamlarla Kur’an', lead: 'Surelerin hacmi, Mekkî ve Medenî sureler, cüzler — mushafın kendi tablolarından hesaplandı.',
    surahs: 'Sure', ayahs: 'Ayet', makki: 'Mekkî', madani: 'Medenî', nSurahs: (n) => `${n} sure`, nAyahs: (n) => `${n} ayet`,
    perSurah: 'Surelerin ayet sayısı', subM: 'mushaf sırasıyla (1 → 114)', subR: 'iniş sırasıyla (meşhur tablo, kesin değil)',
    order: 'Sıra', oMushaf: 'Mushaf', oRev: 'İniş', surahN: (n) => `Sure ${n}`,
    split: 'Mekkî ve Medenî', splitSub: 'ayetlerin payı; satırda sure sayısı',
    juz: 'Cüzler', juzSub: 'her cüzdeki ayet sayısı; gri — ortalama', juzN: (n) => `${n}. cüz`, avg: 'Ortalama',
    len: 'En uzun ve en kısa', lenSub: 'ayet sayısına göre', longest: 'En uzun', shortest: 'En kısa', colSurah: 'Sure', colAyahs: 'Ayet',
    mine: 'Okumanız', mineSub: 'bu cihazda açılan surelerin ayetleri', mineCenter: 'Kur’an’ın', days: 'Okuma günleri', daysSub: 'Kur’an okuyucuyu açtığınız günler',
    dayN: (n) => (n ? 'okundu' : 'okunmadı'), startTitle: 'Okumaya başlayın', startText: 'Sure açtıkça okuma günleriniz ve Kur’an’ın ne kadarını açtığınız burada görünecek. Veriler yalnızca bu cihazda saklanır.', start: 'Fâtiha’yı aç',
  },
}

export default function QuranNumbers({ lang = 'az', stats, surahName = (n) => String(n), onOpen, hrefOf }) {
  const t = pickUi(TXT, lang, 'en')
  const f = useVizFormat(lang)
  const [order, setOrder] = useState('mushaf')
  const [lenMode, setLenMode] = useState('long')
  const tot = useMemo(() => quranTotals(), [])
  const ser = useMemo(() => surahSeries(order), [order])
  const juz = useMemo(() => juzAyahs(), [])
  const juzAvg = Math.round(tot.ayahs / juz.length)
  const cov = useMemo(() => readCoverage(stats?.reads || {}), [stats?.reads])
  const heat = useMemo(() => Object.fromEntries((stats?.dates || []).map(d => [d, 1])), [stats?.dates])
  const hasMine = cov.surahs > 0

  const open = (n) => (e) => { if (!onOpen || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return; e.preventDefault(); onOpen(n) }
  const lenRows = (lenMode === 'long' ? tot.longest : tot.shortest).map(r => ({ key: r.n, ...r }))
  const topLen = tot.longest[0].ayahs

  return (
    <NumbersSection id="qp-numbers" lang={lang} title={t.title} lead={t.lead} alt>
      <KpiCard span={3} icon="quran" label={t.surahs} value={f.num(tot.surahs)} count={tot.surahs} hint={t.nAyahs(f.num(tot.ayahs))} />
      <KpiCard span={3} icon="mushaf" label={t.ayahs} value={f.num(tot.ayahs)} count={tot.ayahs} hint={t.nSurahs(f.num(tot.surahs))} />
      <KpiCard span={3} icon="holyplaces" label={t.makki} value={f.num(tot.makki.surahs)} count={tot.makki.surahs} unit={t.surahs.toLowerCase()} hint={t.nAyahs(f.num(tot.makki.ayahs))} />
      <KpiCard span={3} icon="mosques" label={t.madani} value={f.num(tot.madani.surahs)} count={tot.madani.surahs} unit={t.surahs.toLowerCase()} hint={t.nAyahs(f.num(tot.madani.ayahs))} tone={2} />

      <ChartCard span={8} id="qn-ayahs" title={t.perSurah} sub={order === 'revelation' ? t.subR : t.subM}
        actions={<RangeTabs label={t.order} value={order} onChange={setOrder}
          options={[{ value: 'mushaf', label: t.oMushaf }, { value: 'revelation', label: t.oRev }]} />}>
        <AreaChart key={order} integer height={260} curve="linear" label={t.perSurah} legend={false}
          labels={ser.nums} xFormat={(n) => String(n)}
          tooltipTitle={(n, i) => `${n}. ${surahName(n)} · ${ser.madani[i] ? t.madani : t.makki}`}
          series={[{ key: 'ayahs', label: t.ayahs, values: ser.nums.map((_, i) => ser.makki[i] + ser.madani[i]), tone: 1 }]} />
      </ChartCard>

      <ChartCard span={4} id="qn-split" title={t.split} sub={t.splitSub}>
        <SegmentBreakdown label={t.split} lang={lang} items={[
          { key: 'makki', label: t.makki, value: tot.makki.ayahs, hint: t.nSurahs(f.num(tot.makki.surahs)), tone: 1 },
          { key: 'madani', label: t.madani, value: tot.madani.ayahs, hint: t.nSurahs(f.num(tot.madani.surahs)), tone: 2 },
        ]} />
      </ChartCard>

      <ChartCard span={7} id="qn-juz" title={t.juz} sub={t.juzSub} className="nm-juz">
        <CompareBars label={t.juz} lang={lang} currentLabel={t.ayahs} prevLabel={`${t.avg} (${f.num(juzAvg)})`}
          items={juz.map((v, i) => ({ key: i + 1, label: t.juzN(i + 1), value: v, prev: juzAvg, tone: 3 }))} />
      </ChartCard>

      <ChartCard span={5} id="qn-len" title={t.len} sub={t.lenSub} flush
        actions={<RangeTabs label={t.len} value={lenMode} onChange={setLenMode}
          options={[{ value: 'long', label: t.longest }, { value: 'short', label: t.shortest }]} />}>
        <MiniTable caption={`${t.len}: ${lenMode === 'long' ? t.longest : t.shortest}`} rows={lenRows} columns={[
          { key: 'n', label: t.colSurah, render: r => (
            <a className="nm-link" href={hrefOf ? hrefOf(r.n) : undefined} onClick={open(r.n)}>
              <span className="ui-num">{r.n}.</span> {surahName(r.n)}
              <span className="nm-sub">{r.madani ? t.madani : t.makki}</span>
            </a>
          ) },
          { key: 'ayahs', label: t.colAyahs, render: r => (
            <InlineBar value={r.ayahs} max={topLen} tone={r.madani ? 2 : 1} label={`${surahName(r.n)}: ${t.nAyahs(r.ayahs)}`} format={(v) => f.num(v)} />
          ) },
        ]} />
      </ChartCard>

      {hasMine ? (
        <>
          <ChartCard span={4} id="qn-mine" icon="hifz" title={t.mine} sub={t.mineSub}>
            <GoalRing value={cov.ayahs} goal={tot.ayahs} unit={t.ayahs.toLowerCase()} centerLabel={t.mineCenter} label={t.mine} lang={lang}
              rows={[
                { label: t.surahs, value: `⁦${f.num(cov.surahs)} / ${f.num(tot.surahs)}⁩` },
                { label: t.ayahs, value: `⁦${f.num(cov.ayahs)} / ${f.num(tot.ayahs)}⁩` },
                { label: t.days, value: f.num((stats?.dates || []).length) },
              ]} />
          </ChartCard>
          <ChartCard span={8} id="qn-days" title={t.days} sub={t.daysSub}>
            <CalendarHeatmap data={heat} maxWeeks={26} levels={1} label={t.days} lang={lang} format={(n) => t.dayN(n)} legend={false} />
          </ChartCard>
        </>
      ) : (
        <ChartCard span={12} id="qn-start" icon="hifz" title={t.startTitle}>
          <p className="nm-note">{t.startText}</p>
          {onOpen && (
            <p style={{ margin: '12px 0 0' }}>
              <a className="ui-btn ui-btn--secondary ui-btn--sm" href={hrefOf ? hrefOf(1) : undefined} onClick={open(1)}>{t.start}</a>
            </p>
          )}
        </ChartCard>
      )}
    </NumbersSection>
  )
}
