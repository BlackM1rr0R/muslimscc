// ═══════════════════════════════════════════════════════
// NamesNumbers — "Adlar rəqəmlərlə" (/names)
//
//   <NamesNumbers lang names={NAMES_99} surahName={n => …} />
//
// Yalnız data/names99.js → proof: q 'surə:ayə' (Quranda ad kimi gəlir) və
// s 'kitab nömrə' (səhih Sünnədə). Sünnə adlarının bölgüsü ilk göstərilən
// mənbəyə görədir.
// ═══════════════════════════════════════════════════════
import { useMemo } from 'react'
import NumbersSection from './NumbersSection'
import { KpiCard, ChartCard, SegmentBreakdown, MiniTable, InlineBar, useVizFormat } from '../viz'
import { pickUi } from '../../utils/uiText'

const BOOK = {
  Bukhari: { az: 'Buxari', en: 'al-Bukhari', ru: 'аль-Бухари', ar: 'البخاري', tr: 'Buhârî' },
  Muslim: { az: 'Müslim', en: 'Muslim', ru: 'Муслим', ar: 'مسلم', tr: 'Müslim' },
  'Abu Dawud': { az: 'Əbu Davud', en: 'Abu Dawud', ru: 'Абу Дауд', ar: 'أبو داود', tr: 'Ebû Dâvûd' },
  Tirmidhi: { az: 'Tirmizi', en: 'at-Tirmidhi', ru: 'ат-Тирмизи', ar: 'الترمذي', tr: 'Tirmizî' },
  Tabarani: { az: 'Təbərani', en: 'at-Tabarani', ru: 'ат-Табарани', ar: 'الطبراني', tr: 'Taberânî' },
}
const TXT = {
  az: {
    title: 'Adlar rəqəmlərlə', lead: 'Hər adın Quranda və ya səhih Sünnədə ad kimi gəldiyi yer — siyahının öz dəlillərindən sayılıb.',
    names: 'Ad', quran: 'Qurandan', sunnah: 'Sünnədən', surahs: 'Surə', surahsHint: 'dəlil gələn surələr', ofAll: (n) => `${n} addan`,
    bySurah: 'Ən çox ad gələn surələr', bySurahSub: 'Quran dəlilinin surəsinə görə', colSurah: 'Surə', colN: 'Ad',
    byBook: 'Sünnədən gələn adlar', byBookSub: 'ilk göstərilən mənbəyə görə',
  },
  en: {
    title: 'The names in numbers', lead: 'Where each name is established as a name in the Quran or the authentic Sunnah — counted from the list’s own evidence.',
    names: 'Names', quran: 'From the Quran', sunnah: 'From the Sunnah', surahs: 'Surahs', surahsHint: 'surahs cited as evidence', ofAll: (n) => `of ${n} names`,
    bySurah: 'Surahs with the most names', bySurahSub: 'by the surah of the Quranic evidence', colSurah: 'Surah', colN: 'Names',
    byBook: 'Names from the Sunnah', byBookSub: 'by the first source given',
  },
  ru: {
    title: 'Имена в цифрах', lead: 'Где каждое имя утверждено как имя в Коране или достоверной Сунне — подсчитано по доводам самого списка.',
    names: 'Имена', quran: 'Из Корана', sunnah: 'Из Сунны', surahs: 'Суры', surahsHint: 'суры, приведённые как довод', ofAll: (n) => `из ${n} имён`,
    bySurah: 'Суры с наибольшим числом имён', bySurahSub: 'по суре коранического довода', colSurah: 'Сура', colN: 'Имена',
    byBook: 'Имена из Сунны', byBookSub: 'по первому указанному источнику',
  },
  ar: {
    title: 'الأسماء بالأرقام', lead: 'موضع ثبوت كل اسم في القرآن أو السنة الصحيحة — محسوب من أدلة القائمة نفسها.',
    names: 'الأسماء', quran: 'من القرآن', sunnah: 'من السنة', surahs: 'السور', surahsHint: 'سور ورد فيها الدليل', ofAll: (n) => `من ${n} اسمًا`,
    bySurah: 'أكثر السور أسماءً', bySurahSub: 'بحسب سورة الدليل القرآني', colSurah: 'السورة', colN: 'الأسماء',
    byBook: 'الأسماء الثابتة بالسنة', byBookSub: 'بحسب أول مصدر مذكور',
  },
  tr: {
    title: 'Rakamlarla isimler', lead: 'Her ismin Kur’an’da veya sahih Sünnette isim olarak geçtiği yer — listenin kendi delillerinden sayıldı.',
    names: 'İsim', quran: 'Kur’an’dan', sunnah: 'Sünnetten', surahs: 'Sure', surahsHint: 'delil olarak geçen sureler', ofAll: (n) => `${n} isimden`,
    bySurah: 'En çok isim geçen sureler', bySurahSub: 'Kur’an delilinin suresine göre', colSurah: 'Sure', colN: 'İsim',
    byBook: 'Sünnetten gelen isimler', byBookSub: 'ilk gösterilen kaynağa göre',
  },
}

export default function NamesNumbers({ lang = 'az', names = [], surahName = (n) => String(n) }) {
  const t = pickUi(TXT, lang, 'en')
  const f = useVizFormat(lang)
  const d = useMemo(() => {
    const surah = new Map(), book = new Map()
    let q = 0
    for (const x of names) {
      if (x.proof?.q) {
        q++
        const s = Number(String(x.proof.q).split(':')[0])
        surah.set(s, (surah.get(s) || 0) + 1)
      } else if (x.proof?.s) {
        const k = Object.keys(BOOK).find(b => String(x.proof.s).startsWith(b)) || 'other'
        book.set(k, (book.get(k) || 0) + 1)
      }
    }
    const surahs = [...surah.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])
    const books = [...book.entries()].sort((a, b) => b[1] - a[1])
    return { q, s: names.length - q, surahs, books }
  }, [names])
  const top = d.surahs.slice(0, 8)
  const bookItems = d.books.map(([k, v], i) => ({ key: k, label: BOOK[k] ? pickUi(BOOK[k], lang, 'en') : k, value: v, tone: i < 4 ? i + 1 : 'muted' }))

  return (
    <NumbersSection id="np-numbers" lang={lang} title={t.title} lead={t.lead}>
      <KpiCard span={3} icon="names" label={t.names} value={f.num(names.length)} />
      <KpiCard span={3} icon="quran" label={t.quran} value={f.num(d.q)} hint={t.ofAll(names.length)} />
      <KpiCard span={3} icon="hadith" label={t.sunnah} value={f.num(d.s)} hint={t.ofAll(names.length)} tone={2} />
      <KpiCard span={3} icon="mushaf" label={t.surahs} value={f.num(d.surahs.length)} hint={t.surahsHint} />

      <ChartCard span={7} id="npn-surah" title={t.bySurah} sub={t.bySurahSub} flush>
        <MiniTable caption={t.bySurah} rows={top.map(([s, n]) => ({ key: s, s, n }))} columns={[
          { key: 's', label: t.colSurah, render: r => <><span className="ui-num">{r.s}.</span> {surahName(r.s)}</> },
          { key: 'n', label: t.colN, render: r => <InlineBar value={r.n} max={top[0]?.[1] || 1} label={`${surahName(r.s)}: ${r.n}`} format={(v) => f.num(v)} /> },
        ]} />
      </ChartCard>

      <ChartCard span={5} id="npn-book" title={t.byBook} sub={t.byBookSub}>
        <SegmentBreakdown label={t.byBook} items={bookItems} lang={lang} />
      </ChartCard>
    </NumbersSection>
  )
}
