// H3 — /account: "Mənim kitabxanam" — üç rəf (oxuyuram, oxumaq istəyirəm, oxudum), hər kitab
// kitabxanada öz pəncərəsini açır (/books?book=<id>). Məlumat — utils/bookShelf.
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import { isPlainClick } from '../PageLink'
import Icon from '../Icon'
import { SHELVES, onShelf } from '../../utils/bookShelf'
import { SHELF_TXT } from './shelfText'
import useBookShelf from './useBookShelf'
import '../../styles/My.css'

export default function MyLibrary() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(SHELF_TXT, lang, 'en')
  const navigate = useNavigate()
  const { shelf } = useBookShelf()
  const go = (href) => (e) => { if (isPlainClick(e)) { e.preventDefault(); navigate(href); window.scrollTo(0, 0) } }
  const booksHref = pathFor('books', siteLang)
  const any = Object.keys(shelf.b).length > 0
  return (
    <div className="my-lib" data-testid="my-library">
      {!any && <p className="my-lib__empty">{t.emptyShelf}</p>}
      {any && (
        <div className="my-lib__cols">
          {SHELVES.map((s) => {
            const list = onShelf(shelf, s)
            return (
              <section key={s} className="my-lib__col" aria-labelledby={`ml-${s}`}>
                <h3 className="my-lib__h" id={`ml-${s}`}>{t[s]} <span className="ui-badge ui-num">{list.length}</span></h3>
                {list.length ? (
                  <ul className="my-lib__list">
                    {list.map((b) => {
                      const href = `${booksHref}?book=${encodeURIComponent(b.id)}`
                      return (
                        <li key={b.id}>
                          <a className="my-lib__item" href={href} onClick={go(href)} data-testid="my-lib-item">
                            <span className="my-lib__t">{b.t || t.book}</span>
                            {b.p && <span className="my-lib__p ui-num">{t.pageN(b.p)}</span>}
                            {b.n && <span className="my-lib__n">{b.n}</span>}
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                ) : <p className="my-lib__none">—</p>}
              </section>
            )
          })}
        </div>
      )}
      <a className="ui-link" href={booksHref} onClick={go(booksHref)}>{t.toBooks} <Icon name="arrow" size={14} className="ui-link__arrow ui-flip-rtl" /></a>
      <p className="my-lib__private"><Icon name="shield" size={14} /> {t.private}</p>
    </div>
  )
}
