// ═══════════════════════════════════════════════════════
// HadithShelf (v6.2) — "Kitab rəfi" (/hadith-library): 3D rəf, kitabı çək — açılsın, vərəqlə
//
//   <HadithShelf books={BOOKS} data={BOOK_DATA} lang="az" onBook={key => …} onSection={(key, sec) => …} />
//
// • Hər kitab — CSS 3D qutu; qalınlığı kitabdakı REAL hədis sayına mütənasibdir (BOOK_DATA.total).
// • Kitaba toxun → rəfdən çıxır, aşağıda açıq kitab: bölmələr (mənbədəki ingiliscə adlar,
//   hədis aralığı ilə) vərəq-vərəq; vərəq çevrilir (3D). Bölməyə toxun → həmin bölmə açılır.
// • Hərəkət azaldılıbsa — vərəq animasiyasız dəyişir. Hamısı düymədir (klaviatura ilə də işləyir).
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import '../styles/HadithShelf.css'

const T = {
  az: { ey: 'Kitab rəfi', title: 'Kitabı rəfdən götür', lead: 'Kitabların qalınlığı içindəki hədis sayına görədir. Kitaba toxunun — açılsın, bölmələri vərəqləyin.', hadiths: 'hədis', page: (a, b) => `${a} / ${b}`, prev: 'Əvvəlki vərəq', next: 'Növbəti vərəq', open: 'Kitabı aç', close: 'Rəfə qaytar', secs: 'bölmə', pick: 'Rəfdən bir kitab seçin.' },
  en: { ey: 'Bookshelf', title: 'Take a book from the shelf', lead: 'Each book’s thickness follows the number of hadiths inside it. Tap a book to open it and leaf through its chapters.', hadiths: 'hadiths', page: (a, b) => `${a} / ${b}`, prev: 'Previous page', next: 'Next page', open: 'Open the book', close: 'Back on the shelf', secs: 'chapters', pick: 'Pick a book from the shelf.' },
  ru: { ey: 'Книжная полка', title: 'Возьмите книгу с полки', lead: 'Толщина каждой книги — по числу хадисов в ней. Коснитесь книги, чтобы открыть её и листать разделы.', hadiths: 'хадисов', page: (a, b) => `${a} / ${b}`, prev: 'Предыдущая страница', next: 'Следующая страница', open: 'Открыть книгу', close: 'Вернуть на полку', secs: 'разделов', pick: 'Выберите книгу на полке.' },
  ar: { ey: 'رفّ الكتب', title: 'خذ كتابًا من الرفّ', lead: 'سُمك كل كتاب بحسب عدد الأحاديث فيه. المس كتابًا ليُفتح، وقلّب أبوابه.', hadiths: 'حديثًا', page: (a, b) => `${a} / ${b}`, prev: 'الصفحة السابقة', next: 'الصفحة التالية', open: 'افتح الكتاب', close: 'أعده إلى الرفّ', secs: 'كتابًا', pick: 'اختر كتابًا من الرفّ.' },
  tr: { ey: 'Kitap rafı', title: 'Raftan bir kitap al', lead: 'Kitapların kalınlığı içindeki hadis sayısına göredir. Bir kitaba dokunun — açılsın, bölümlerini sayfa sayfa çevirin.', hadiths: 'hadis', page: (a, b) => `${a} / ${b}`, prev: 'Önceki sayfa', next: 'Sonraki sayfa', open: 'Kitabı aç', close: 'Rafa geri koy', secs: 'bölüm', pick: 'Raftan bir kitap seçin.' },
}
// Dəri cild rəngləri (kitab sırası ilə)
const LEATHER = ['#1f5d4c', '#7a2832', '#23395d', '#6b4423', '#4a2f5e', '#2f5a6b', '#5c4a1f', '#355e3b', '#6d2f4f']
const PER_PAGE = 7
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const reduced = () => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion'))

export default function HadithShelf({ books, data, lang = 'az', onBook, onSection }) {
  const t = pickUi(T, lang)
  const [open, setOpen] = useState(null)        // kitab açarı
  const [spread, setSpread] = useState(0)       // açıq iki səhifənin nömrəsi
  const [flip, setFlip] = useState(null)        // 'next' | 'prev'
  const timer = useRef(0)
  const max = useMemo(() => Math.max(...books.map(b => data[b.key]?.total || 0)), [books, data])
  const book = books.find(b => b.key === open)
  const secs = useMemo(() => {
    const list = data[open]?.sections || []
    return list.filter(s => s[1])           // adı olmayan "bölməsiz" sətir rəfdə göstərilmir
  }, [data, open])
  const pages = Math.max(1, Math.ceil(secs.length / PER_PAGE))
  const spreads = Math.max(1, Math.ceil(pages / 2))
  const pageItems = (p) => secs.slice(p * PER_PAGE, (p + 1) * PER_PAGE)
  useEffect(() => () => clearTimeout(timer.current), [])

  const take = (k) => { setOpen(o => (o === k ? null : k)); setSpread(0); setFlip(null) }
  const turn = (dir) => {
    const to = spread + (dir === 'next' ? 1 : -1)
    if (to < 0 || to >= spreads || flip) return
    if (reduced()) { setSpread(to); return }
    setFlip(dir)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { setSpread(to); setFlip(null) }, 640)
  }

  const Page = ({ p, side }) => (
    <div className={`hsh__page is-${side}`}>
      {p < pages && (
        <>
          <ol className="hsh__secs">
            {pageItems(p).map(s => (
              <li key={s[0]}>
                <button type="button" className="hsh__sec" onClick={() => onSection?.(open, s[0])} data-testid="hsh-sec">
                  <span className="hsh__secn ui-num">{s[0]}</span>
                  <span className="hsh__sect" lang="en" dir="ltr">{s[1]}</span>
                  {s[3] > 0 && <span className="hsh__secr ui-num">{fmt(s[2])}–{fmt(s[3])}</span>}
                </button>
              </li>
            ))}
          </ol>
          <span className="hsh__pn ui-num">{p + 1}</span>
        </>
      )}
    </div>
  )

  // Vərəq çevriləndə: altda hədəf səhifələr, üstdə çevrilən vərəq (ön — köhnə, arxa — yeni)
  const L = flip === 'prev' ? (spread - 1) * 2 : spread * 2
  const R = flip === 'next' ? (spread + 1) * 2 + 1 : spread * 2 + 1

  return (
    <section className="hsh ui-card" aria-labelledby="hsh-title" data-testid="hadith-shelf">
      <div className="hsh__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h3 id="hsh-title" className="ui-title ui-title--sm">{t.title}</h3>
        <p className="ui-lead">{t.lead}</p>
      </div>
      <div className="hsh__room">
        <ul className="hsh__shelf">
          {books.map((b, i) => {
            const n = data[b.key]?.total || 0
            const w = Math.round(22 + 58 * Math.sqrt(n / max))
            const h = 150 + (i % 3) * 14
            return (
              <li key={b.key} className={`hsh__slot${open === b.key ? ' is-out' : ''}`} style={{ '--w': `${w}px`, '--h': `${h}px`, '--c': LEATHER[i % LEATHER.length], '--i': i }}>
                <button type="button" className="hsh__book" aria-pressed={open === b.key} aria-label={`${pickUi(b.name, lang)} — ${fmt(n)} ${t.hadiths}`}
                  onClick={() => take(b.key)} data-testid={`hsh-${b.key}`}>
                  <span className="hsh__spine">
                    <span className="hsh__band" />
                    <span className="hsh__ar ui-arabic" lang="ar">{b.ar}</span>
                    <span className="hsh__band" />
                    <span className="hsh__count ui-num">{fmt(n)}</span>
                  </span>
                  <span className="hsh__top" />
                  <span className="hsh__side" />
                </button>
              </li>
            )
          })}
        </ul>
        <div className="hsh__plank" aria-hidden="true" />
      </div>

      <div className="hsh__desk" aria-live="polite">
        {!book ? <p className="hsh__pick">{t.pick}</p> : (
          <div className="hsh__open" key={open} style={{ '--c': LEATHER[books.indexOf(book) % LEATHER.length] }} data-testid="hsh-open">
            <div className="hsh__bar">
              <b className="hsh__title">{pickUi(book.name, lang)}</b>
              <span className="hsh__meta ui-num">{fmt(data[open]?.total || 0)} {t.hadiths}{secs.length > 1 ? ` · ${secs.length} ${t.secs}` : ''}</span>
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => onBook?.(open)} data-testid="hsh-openbook">{t.open} <Icon name="chevron" size={14} className="ui-flip-rtl" /></button>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => take(open)}>{t.close}</button>
            </div>
            <div className="hsh__book2" dir="ltr">
              <Page p={L} side="l" />
              <Page p={R} side="r" />
              {flip && (
                <div className={`hsh__leaf is-${flip}`} aria-hidden="true">
                  <div className="hsh__face is-front"><Page p={flip === 'next' ? spread * 2 + 1 : spread * 2} side={flip === 'next' ? 'r' : 'l'} /></div>
                  <div className="hsh__face is-back"><Page p={flip === 'next' ? (spread + 1) * 2 : (spread - 1) * 2 + 1} side={flip === 'next' ? 'l' : 'r'} /></div>
                </div>
              )}
            </div>
            {spreads > 1 && (
              <div className="hsh__nav">
                <button type="button" className="ui-icon-btn" aria-label={t.prev} onClick={() => turn('prev')} disabled={spread === 0 || !!flip} data-testid="hsh-prev"><Icon name="chevron" className="hsh__flipx" /></button>
                <span className="ui-num" data-testid="hsh-spread">{t.page(spread + 1, spreads)}</span>
                <button type="button" className="ui-icon-btn" aria-label={t.next} onClick={() => turn('next')} disabled={spread >= spreads - 1 || !!flip} data-testid="hsh-next"><Icon name="chevron" /></button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
