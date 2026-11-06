import { useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import { pathFor } from '../../seo/routes'
import { isPlainClick } from '../PageLink'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'

/* ═══════════════════════════════════════════════════════
   "Əlaqəli bölmələr" — .ui-list (DESIGN.md §4): məzmunu təkrarlamaq
   əvəzinə saytın başqa bölmələrinə keçid. Həqiqi <a href>: adi klik SPA
   ilə, Ctrl/orta klik yeni tabda.
   items: [{ page, icon?, title: {az,en,…}, text: {az,en,…} }]
   ═══════════════════════════════════════════════════════ */
export default function RelatedLinks({ items = [], className = '' }) {
  const { lang } = useLang()
  const navigate = useNavigate()
  const t = (o) => (o && (pickUi(o, lang, 'en'))) || ''
  return (
    <ul className={`ui-list ui-list--tiles${className ? ' ' + className : ''}`} data-reveal="stagger">
      {items.map(it => {
        const href = pathFor(it.page, lang, it.param)
        return (
          <li key={`${it.page}${it.param || ''}`}>
            <a className="ui-list__item" href={href}
              onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); navigate(href) } }}>
              <Icon name={it.icon || it.page} size={20} />
              <span>{t(it.title)}<small>{t(it.text)}</small></span>
              <Icon name="chevron" size={18} className="ui-list__chev ui-flip-rtl" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
