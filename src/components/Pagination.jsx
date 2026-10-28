import { useLang } from '../contexts/LangContext'
import Icon from './Icon'
import '../styles/Pagination.css'

const A11Y = {
  az: { pagination:'Səhifələmə', prev:'Əvvəlki səhifə', next:'Növbəti səhifə', page:'Səhifə' },
  en: { pagination:'Pagination',  prev:'Previous page', next:'Next page',      page:'Page' },
  ru: { pagination:'Страницы',    prev:'Предыдущая',    next:'Следующая',      page:'Страница' },
  ar: { pagination:'الترقيم',     prev:'السابق',         next:'التالي',          page:'صفحة' },
  tr: { pagination:'Sayfalama',   prev:'Önceki sayfa',  next:'Sonraki sayfa',  page:'Sayfa' },
}

// Sadə, kompakt pagination komponenti.
// v2: rəng həmişə brend tokenidir (--brand) — köhnə `color` prop-u qəbul
// olunur, amma nəzərə alınmır (səhifələr göy qurşağı rəngi ötürürdü).
// eslint-disable-next-line no-unused-vars
export default function Pagination({ current, total, onChange, color }) {
  const { lang } = useLang()
  const a = A11Y[lang] || A11Y.az
  if (total <= 1) return null

  // Hansı səhifə nömrələrini göstərək?
  // Hər zaman: ilk, son, cari və ona yaxın 2 səhifə. Arada "…"
  const pages = []
  const add = (p) => { if (!pages.includes(p) && p >= 1 && p <= total) pages.push(p) }

  add(1)
  for (let i = current - 1; i <= current + 1; i++) add(i)
  add(total)

  // Sıralamaq və "…" yerləri tapmaq
  pages.sort((a, b) => a - b)
  const out = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push('…')
    out.push(p)
  })

  return (
    <nav className="pagination" aria-label={a.pagination}>
      <button
        type="button"
        className="pg-btn pg-prev"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        aria-label={a.prev}
      >
        <Icon name="chevronLeft" size={18} className="ui-flip-rtl" />
      </button>

      {out.map((item, i) =>
        item === '…' ? (
          <span key={`dot-${i}`} className="pg-dots">…</span>
        ) : (
          <button
            key={item}
            type="button"
            className={`pg-btn pg-num ui-num ${item === current ? 'active' : ''}`}
            onClick={() => onChange(item)}
            aria-label={`${a.page} ${item}`}
            aria-current={item === current ? 'page' : undefined}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        className="pg-btn pg-next"
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        aria-label={a.next}
      >
        <Icon name="chevron" size={18} className="ui-flip-rtl" />
      </button>
    </nav>
  )
}
