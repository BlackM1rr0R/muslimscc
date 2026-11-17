// ═══════════════════════════════════════════════════════
// «Qeydlərim» — Quran səhifəsinin «Saxlanılanlar» bölməsində (v7)
// Ayə qeydləri və rəngli vurğular (utils/quranNotes): rəngə görə süzgəc,
// axtarış (mətn, söz, «2:255», surə adı), ayəni açmaq, silmək.
// vB "Quran dəftəri": sıralama (tarix / surə), yazılma günü, .md / .txt ixracı; /account-da da.
// ═══════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import Icon from '../Icon'
import { isPlainClick } from '../PageLink'
import '../../styles/QuranNotes.css'
import { pickUi } from '../../utils/uiText'
import { NOTE_COLORS, listNotes, countByColor, exportNotes, notesFileName, noteDay } from '../../utils/quranNotes'

function downloadText(text, name, type) {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url; a.download = name; a.rel = 'noopener'
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

const T = {
  az: {
    sort: 'Sıralama', byDate: 'Ən yeni əvvəldə', bySurah: 'Surə sırası ilə', exp: 'Dəftəri yüklə', md: 'Markdown', txt: 'Mətn', fileTitle: 'Quran dəftərim', wrote: 'Yazılıb', edited: 'Dəyişib',
    title: 'Qeydlərim', lead: 'Ayədə sözə uzun basın (və ya «…» düyməsi) → «Qeyd» — rəngli vurğu və qeyd burada toplanır.',
    all: 'Hamısı', search: 'Qeydlərdə axtar', none: 'Hələ qeyd yoxdur.', notFound: 'Bu süzgəcə uyğun qeyd tapılmadı.',
    remove: 'Qeydi sil', filter: 'Rəngə görə süzgəc',
    colors: { gold: 'Qızılı', green: 'Yaşıl', blue: 'Mavi', rose: 'Çəhrayı', violet: 'Bənövşəyi' },
  },
  en: {
    sort: 'Sort', byDate: 'Newest first', bySurah: 'In surah order', exp: 'Download the notebook', md: 'Markdown', txt: 'Plain text', fileTitle: 'My Quran notebook', wrote: 'Written', edited: 'Edited',
    title: 'My notes', lead: 'Long-press a word in a verse (or use the “…” button) → “Note” — highlights and notes gather here.',
    all: 'All', search: 'Search notes', none: 'No notes yet.', notFound: 'No notes match this filter.',
    remove: 'Delete note', filter: 'Filter by colour',
    colors: { gold: 'Gold', green: 'Green', blue: 'Blue', rose: 'Rose', violet: 'Violet' },
  },
  ru: {
    sort: 'Сортировка', byDate: 'Сначала новые', bySurah: 'По порядку сур', exp: 'Скачать тетрадь', md: 'Markdown', txt: 'Текст', fileTitle: 'Моя тетрадь по Корану', wrote: 'Написано', edited: 'Изменено', // lang-ok[Markdown]: fayl formatının adı
    title: 'Мои заметки', lead: 'Удерживайте слово в аяте (или кнопка «…») → «Заметка» — выделения и заметки собираются здесь.',
    all: 'Все', search: 'Поиск по заметкам', none: 'Заметок пока нет.', notFound: 'Под этот фильтр заметок нет.',
    remove: 'Удалить заметку', filter: 'Фильтр по цвету',
    colors: { gold: 'Золотой', green: 'Зелёный', blue: 'Синий', rose: 'Розовый', violet: 'Фиолетовый' },
  },
  ar: {
    sort: 'الترتيب', byDate: 'الأحدث أولًا', bySurah: 'بترتيب السور', exp: 'نزّل الدفتر', md: 'ماركداون', txt: 'نص عادي', fileTitle: 'دفتري القرآني', wrote: 'كُتبت', edited: 'عُدّلت',
    title: 'ملاحظاتي', lead: 'اضغط مطوّلًا على كلمة في الآية (أو زر «…») ← «ملاحظة» — تجتمع هنا الألوان والملاحظات.',
    all: 'الكل', search: 'ابحث في الملاحظات', none: 'لا ملاحظات بعد.', notFound: 'لا ملاحظات توافق هذا التصفية.',
    remove: 'احذف الملاحظة', filter: 'تصفية حسب اللون',
    colors: { gold: 'ذهبي', green: 'أخضر', blue: 'أزرق', rose: 'وردي', violet: 'بنفسجي' },
  },
  tr: {
    sort: 'Sıralama', byDate: 'En yeni önce', bySurah: 'Sure sırasıyla', exp: 'Defteri indir', md: 'Markdown', txt: 'Düz metin', fileTitle: 'Kur’an defterim', wrote: 'Yazıldı', edited: 'Değiştirildi',
    title: 'Notlarım', lead: 'Ayetteki bir kelimeye uzun basın (veya «…» düğmesi) → «Not» — renkli vurgular ve notlar burada toplanır.',
    all: 'Tümü', search: 'Notlarda ara', none: 'Henüz not yok.', notFound: 'Bu filtreye uyan not bulunamadı.',
    remove: 'Notu sil', filter: 'Renge göre filtre',
    colors: { gold: 'Altın', green: 'Yeşil', blue: 'Mavi', rose: 'Pembe', violet: 'Mor' },
  },
}

/**
 * notes — { '2:255': { c, t, u, w } } · onRemove(key) · labelOf(s, a) — «Bəqərə, 255-ci ayə»
 * nameOf(s) — surə adı (axtarış üçün) · hrefOf(s, a) · onOpen(s, a)
 */
export default function QuranNotes({ notes, onRemove, labelOf, nameOf, hrefOf, onOpen, lang = 'az', bare = false }) {
  const t = pickUi(T, lang, 'en')
  const [color, setColor] = useState('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('date')
  const list = useMemo(() => listNotes(notes, { color, q, nameOf, sort }), [notes, color, q, nameOf, sort])
  const counts = useMemo(() => countByColor(notes), [notes])
  const total = Object.keys(notes || {}).length
  const doExport = (fmt) => {
    const text = exportNotes(list, fmt, { title: t.fileTitle, labelOf, colorName: c => t.colors[c], wrote: t.wrote, edited: t.edited })
    downloadText(text, notesFileName(fmt), fmt === 'md' ? 'text/markdown' : 'text/plain')
  }
  const H = bare ? 'h3' : 'h2'

  return (
    <section className={`qn${bare ? ' qn--bare' : ''}`} aria-labelledby={bare ? 'qn-title-b' : 'qn-title'} data-testid="quran-notes">
      <H id={bare ? 'qn-title-b' : 'qn-title'} className="qn__title"><Icon name="edit" size={18} />{t.title}{total ? <span className="qp-views__n ui-num">{total}</span> : null}</H>
      <p className="qn__lead">{t.lead}</p>
      {total > 0 && (
        <div className="qn__tools">
          <div className="qp-chips" role="group" aria-label={t.filter}>
            <button type="button" className="ui-chip" aria-pressed={!color} onClick={() => setColor('')}>{t.all}</button>
            {NOTE_COLORS.filter(c => counts[c]).map(c => (
              <button key={c} type="button" className="ui-chip qn__chip" data-note={c} aria-pressed={color === c} onClick={() => setColor(color === c ? '' : c)}>
                <span className="qn__dot" aria-hidden="true" />{t.colors[c]} <span className="ui-num">{counts[c]}</span>
              </button>
            ))}
          </div>
          <label className="qn__search">
            <span className="ui-sr-only">{t.search}</span>
            <Icon name="search" size={16} />
            <input type="search" className="ui-input" value={q} onChange={e => setQ(e.target.value)} placeholder={t.search} />
          </label>
          <div className="qn__row">
            <label className="qn__sort">
              <span className="qn__sort-l">{t.sort}</span>
              <select className="ui-select ui-select--sm" value={sort} onChange={e => setSort(e.target.value)} data-testid="qn-sort">
                <option value="date">{t.byDate}</option>
                <option value="surah">{t.bySurah}</option>
              </select>
            </label>
            <span className="qn__exp" role="group" aria-label={t.exp}>
              <Icon name="download" size={16} />
              <button type="button" className="ui-chip" onClick={() => doExport('md')} disabled={!list.length} data-testid="qn-export-md">{t.md} <span className="ui-num">.md</span></button>
              <button type="button" className="ui-chip" onClick={() => doExport('txt')} disabled={!list.length} data-testid="qn-export-txt">{t.txt} <span className="ui-num">.txt</span></button>
            </span>
          </div>
        </div>
      )}
      {!total ? <p className="qn__empty">{t.none}</p> : !list.length ? <p className="qn__empty" role="status">{t.notFound}</p> : (
        <ul className="qn__list" role="list">
          {list.map(n => {
            const label = labelOf(n.s, n.a)
            return (
              <li key={n.key} className="qn__card" data-note={n.c || undefined}>
                <a className="qn__open" href={hrefOf(n.s, n.a)} onClick={e => { if (!isPlainClick(e)) return; e.preventDefault(); onOpen(n.s, n.a) }}>
                  <span className="qn__head">
                    <span className="qn__label">{label}</span>
                    <span className="qn__ref ui-num" dir="ltr">{n.key}</span>
                  </span>
                  {n.w && <span className="qn__word" lang="ar" dir="rtl">{n.w}</span>}
                  {n.t && <span className="qn__text">{n.t}</span>}
                  {(n.d || n.u) ? (
                    <span className="qn__when ui-num">
                      {n.d ? <>{t.wrote}: <time dateTime={noteDay(n.d)}>{noteDay(n.d)}</time></> : null}
                      {n.u && (!n.d || noteDay(n.u) !== noteDay(n.d)) ? <>{n.d ? ' · ' : ''}{t.edited}: <time dateTime={noteDay(n.u)}>{noteDay(n.u)}</time></> : null}
                    </span>
                  ) : null}
                </a>
                <button type="button" className="qp-saved-card__del" onClick={() => onRemove(n.key)} aria-label={`${t.remove} — ${label}`} title={t.remove}>
                  <Icon name="trash" size={16} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
