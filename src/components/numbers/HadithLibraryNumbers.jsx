// ═══════════════════════════════════════════════════════
// HadithLibraryNumbers — "Kitabxana rəqəmlərlə" (/hadith-library)
//
//   <HadithLibraryNumbers books={BOOKS} data={BOOK_DATA} lang="az" onOpen={(book) => …} />
//
// Hamısı data/hadithLibrary.js-dən: hədis sayı (mənbənin nömrələməsi),
// bölmələr, tərcümə nəşrləri. Dərəcə bölgüsü burada YOXDUR — dərəcələr yalnız
// bölmə açılanda yüklənir (HadithBooksChart-dakı kimi, təxmin göstərilmir).
// ═══════════════════════════════════════════════════════
import { useMemo } from 'react'
import NumbersSection from './NumbersSection'
import { KpiCard, ChartCard, SegmentBreakdown, MiniTable, InlineBar, useVizFormat } from '../viz'
import { secCount } from '../HadithBooksChart'
import { bookSectionStats } from '../../utils/numbersData'
import { pickUi } from '../../utils/uiText'

const TXT = {
  az: {
    title: 'Kitabxana rəqəmlərlə', lead: 'Doqquz kitabın həcmi, növü və bölmələri — mənbə nəşrinin öz nömrələməsinə görə.',
    hadiths: 'Hədis', books: 'Kitab', chapters: 'Bölmə', langs: 'Tərcümə dili', inBooks: (n) => `${n} kitabda`, avail: 'kitabxanada mövcud',
    kinds: 'Kitabların növü', kindsSub: 'hədis sayının payı; sətirdə — kitablar',
    table: 'Kitablar və bölmələr', tableSub: 'bölmələr, bölmədə orta hədis sayı və ən böyük bölmə',
    colBook: 'Kitab', colHadiths: 'Hədis', colSecs: 'Bölmə', colAvg: 'Orta', colTop: 'Ən böyük bölmə',
  },
  en: {
    title: 'The library in numbers', lead: 'The size, type and chapters of the nine books — by the source edition’s own numbering.',
    hadiths: 'Hadiths', books: 'Books', chapters: 'Chapters', langs: 'Translation languages', inBooks: (n) => `in ${n} books`, avail: 'available in the library',
    kinds: 'Types of books', kindsSub: 'share of the hadiths; books in each row',
    table: 'Books and chapters', tableSub: 'chapters, average hadiths per chapter and the largest chapter',
    colBook: 'Book', colHadiths: 'Hadiths', colSecs: 'Chapters', colAvg: 'Average', colTop: 'Largest chapter',
  },
  ru: {
    title: 'Библиотека в цифрах', lead: 'Объём, вид и разделы девяти книг — по нумерации исходного издания.',
    hadiths: 'Хадисы', books: 'Книги', chapters: 'Разделы', langs: 'Языки перевода', inBooks: (n) => `в ${n} книгах`, avail: 'доступно в библиотеке',
    kinds: 'Виды книг', kindsSub: 'доля хадисов; в строке — книги',
    table: 'Книги и разделы', tableSub: 'разделы, в среднем хадисов в разделе и самый большой раздел',
    colBook: 'Книга', colHadiths: 'Хадисы', colSecs: 'Разделы', colAvg: 'В среднем', colTop: 'Самый большой раздел',
  },
  ar: {
    title: 'المكتبة بالأرقام', lead: 'حجم الكتب التسعة ونوعها وكتبها الداخلية — بحسب ترقيم النسخة المصدر نفسها.',
    hadiths: 'الأحاديث', books: 'الكتب', chapters: 'الكتب الداخلية', langs: 'لغات الترجمة', inBooks: (n) => `في ${n} كتب`, avail: 'متاحة في المكتبة',
    kinds: 'أنواع الكتب', kindsSub: 'نسبة الأحاديث؛ والكتب في كل سطر',
    table: 'الكتب وأبوابها', tableSub: 'عدد الكتب الداخلية، ومتوسط الأحاديث في كل منها، وأكبرها',
    colBook: 'الكتاب', colHadiths: 'الأحاديث', colSecs: 'الكتب الداخلية', colAvg: 'المتوسط', colTop: 'أكبر كتاب داخلي',
  },
  tr: {
    title: 'Rakamlarla kütüphane', lead: 'Dokuz eserin hacmi, türü ve bölümleri — kaynak neşrin kendi numaralandırmasına göre.',
    hadiths: 'Hadis', books: 'Eser', chapters: 'Bölüm', langs: 'Çeviri dili', inBooks: (n) => `${n} eserde`, avail: 'kütüphanede mevcut',
    kinds: 'Eserlerin türü', kindsSub: 'hadis sayısının payı; satırda eserler',
    table: 'Eserler ve bölümler', tableSub: 'bölümler, bölüm başına ortalama hadis ve en büyük bölüm',
    colBook: 'Eser', colHadiths: 'Hadis', colSecs: 'Bölüm', colAvg: 'Ortalama', colTop: 'En büyük bölüm',
  },
}
const pick = (o, lang) => (o ? (o[lang] ?? o.en) : '')

export default function HadithLibraryNumbers({ books = [], data = {}, lang = 'az', onOpen }) {
  const t = pickUi(TXT, lang, 'en')
  const f = useVizFormat(lang)
  const rows = useMemo(() => books.filter(b => data[b.key]).map(b => ({ key: b.key, b, d: data[b.key], ...bookSectionStats(data[b.key], secCount) }))
    .sort((x, y) => y.d.total - x.d.total), [books, data])
  const total = rows.reduce((s, r) => s + r.d.total, 0)
  const chapters = rows.reduce((s, r) => s + r.sections, 0)
  const langs = useMemo(() => new Set(rows.flatMap(r => Object.keys(r.d.editions || {}))).size, [rows])
  // Növlər: kitabın öz "kind" sahəsinə görə (Səhih, Sünən, Cami, Müvətta, Ərbəin) — 4-dən çoxdursa sonuncular birləşmir, boz olur
  const kinds = useMemo(() => {
    const m = new Map()
    for (const r of rows) {
      const k = r.b.kind?.en || r.key
      const cur = m.get(k) || { key: k, label: pick(r.b.kind, lang), value: 0, names: [] }
      cur.value += r.d.total
      cur.names.push(pick(r.b.name, lang))
      m.set(k, cur)
    }
    return [...m.values()].sort((a, b) => b.value - a.value)
      .map((k, i) => ({ ...k, hint: k.names.join(', '), tone: i < 4 ? i + 1 : 'muted' }))
  }, [rows, lang])
  const max = rows[0]?.d.total || 1

  return (
    <NumbersSection id="hl-numbers" lang={lang} title={t.title} lead={t.lead} tight className="hl-numbers">
      <KpiCard span={3} icon="hadithbooks" label={t.hadiths} value={f.num(total)} count={total} hint={t.inBooks(rows.length)} />
      <KpiCard span={3} icon="books" label={t.books} value={f.num(rows.length)} hint={t.avail} />
      <KpiCard span={3} icon="list" label={t.chapters} value={f.num(chapters)} count={chapters} hint={t.inBooks(rows.filter(r => r.sections > 1).length)} />
      <KpiCard span={3} icon="globe" label={t.langs} value={f.num(langs)} hint={t.avail} tone={2} />

      <ChartCard span={5} id="hln-kinds" title={t.kinds} sub={t.kindsSub}>
        <SegmentBreakdown label={t.kinds} items={kinds} lang={lang} />
      </ChartCard>

      <ChartCard span={7} id="hln-table" title={t.table} sub={t.tableSub} flush>
        <MiniTable caption={t.table} rows={rows} columns={[
          { key: 'b', label: t.colBook, render: r => <button type="button" className="nm-link nm-btn" onClick={() => onOpen?.(r.key)}>{pick(r.b.name, lang)}</button> },
          { key: 'total', label: t.colHadiths, render: r => <InlineBar value={r.d.total} max={max} label={`${pick(r.b.name, lang)}: ${f.num(r.d.total)}`} format={(v) => f.num(v)} /> },
          { key: 'secs', label: t.colSecs, align: 'end', render: r => <span className="ui-num">{r.sections > 1 ? f.num(r.sections) : '—'}</span> },
          { key: 'avg', label: t.colAvg, align: 'end', hideSm: true, render: r => <span className="ui-num">{r.sections > 1 ? f.num(r.avg) : '—'}</span> },
          { key: 'top', label: t.colTop, hideSm: true, render: r => (r.top && r.sections > 1
            ? <span><span lang="en" dir="ltr">{r.top.name}</span> <span className="nm-sub ui-num">{f.num(r.top.count)}</span></span>
            : '—') },
        ]} />
      </ChartCard>
    </NumbersSection>
  )
}
