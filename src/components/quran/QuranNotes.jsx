// ═══════════════════════════════════════════════════════
// «Qeydlərim» — Quran səhifəsinin «Saxlanılanlar» bölməsində (v7)
// Ayə qeydləri və rəngli vurğular (utils/quranNotes): rəngə görə süzgəc,
// axtarış (mətn, söz, «2:255», surə adı), ayəni açmaq, silmək.
// ═══════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import Icon from '../Icon'
import { isPlainClick } from '../PageLink'
import { pickUi } from '../../utils/uiText'
import { NOTE_COLORS, listNotes, countByColor } from '../../utils/quranNotes'

const T = {
  az: {
    title: 'Qeydlərim', lead: 'Ayədə sözə uzun basın (və ya «…» düyməsi) → «Qeyd» — rəngli vurğu və qeyd burada toplanır.',
    all: 'Hamısı', search: 'Qeydlərdə axtar', none: 'Hələ qeyd yoxdur.', notFound: 'Bu süzgəcə uyğun qeyd tapılmadı.',
    remove: 'Qeydi sil', filter: 'Rəngə görə süzgəc',
    colors: { gold: 'Qızılı', green: 'Yaşıl', blue: 'Mavi', rose: 'Çəhrayı', violet: 'Bənövşəyi' },
  },
  en: {
    title: 'My notes', lead: 'Long-press a word in a verse (or use the “…” button) → “Note” — highlights and notes gather here.',
    all: 'All', search: 'Search notes', none: 'No notes yet.', notFound: 'No notes match this filter.',
    remove: 'Delete note', filter: 'Filter by colour',
    colors: { gold: 'Gold', green: 'Green', blue: 'Blue', rose: 'Rose', violet: 'Violet' },
  },
  ru: {
    title: 'Мои заметки', lead: 'Удерживайте слово в аяте (или кнопка «…») → «Заметка» — выделения и заметки собираются здесь.',
    all: 'Все', search: 'Поиск по заметкам', none: 'Заметок пока нет.', notFound: 'Под этот фильтр заметок нет.',
    remove: 'Удалить заметку', filter: 'Фильтр по цвету',
    colors: { gold: 'Золотой', green: 'Зелёный', blue: 'Синий', rose: 'Розовый', violet: 'Фиолетовый' },
  },
  ar: {
    title: 'ملاحظاتي', lead: 'اضغط مطوّلًا على كلمة في الآية (أو زر «…») ← «ملاحظة» — تجتمع هنا الألوان والملاحظات.',
    all: 'الكل', search: 'ابحث في الملاحظات', none: 'لا ملاحظات بعد.', notFound: 'لا ملاحظات توافق هذا التصفية.',
    remove: 'احذف الملاحظة', filter: 'تصفية حسب اللون',
    colors: { gold: 'ذهبي', green: 'أخضر', blue: 'أزرق', rose: 'وردي', violet: 'بنفسجي' },
  },
  tr: {
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
export default function QuranNotes({ notes, onRemove, labelOf, nameOf, hrefOf, onOpen, lang = 'az' }) {
  const t = pickUi(T, lang, 'en')
  const [color, setColor] = useState('')
  const [q, setQ] = useState('')
  const list = useMemo(() => listNotes(notes, { color, q, nameOf }), [notes, color, q, nameOf])
  const counts = useMemo(() => countByColor(notes), [notes])
  const total = Object.keys(notes || {}).length

  return (
    <section className="qn" aria-labelledby="qn-title" data-testid="quran-notes">
      <h2 id="qn-title" className="qn__title"><Icon name="edit" size={18} />{t.title}{total ? <span className="qp-views__n ui-num">{total}</span> : null}</h2>
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
