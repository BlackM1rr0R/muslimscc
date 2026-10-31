// ═══════════════════════════════════════════════════════
// "Əlaqəli bölmələr" — dizayn v3 keçid siyahısı (.ui-list).
// Məzmunu təkrarlamaq əvəzinə başqa bölməyə link verir (DESIGN.md §3).
//   items: [{ to?: 'quran', learn?: 'muhasabah', icon, title: {az,…}, sub?: {az,…} }]
// Həqiqi <a href>: adi klik SPA ilə, Ctrl/orta klik yeni tabda.
// ═══════════════════════════════════════════════════════
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { pathFor } from '../seo/routes'
import { isPlainClick } from './PageLink'
import Icon from './Icon'

const pick = (o, lang) => (o ? (o[lang] ?? o.en ?? o.az ?? '') : '')

export default function RelatedLinks({ items = [], className = '' }) {
  const { lang } = useLang()
  const navigate = useNavigate()
  return (
    <ul className={`ui-list${className ? ' ' + className : ''}`}>
      {items.map((it, i) => {
        const href = it.learn ? pathFor('learn', lang, it.learn) : pathFor(it.to, lang)
        return (
          <li key={i}>
            <a className="ui-list__item" href={href}
              onClick={(e) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(href); window.scrollTo(0, 0) }}>
              <Icon name={it.icon || (it.learn ? 'learn' : it.to)} size={20} />
              <span>{pick(it.title, lang)}{it.sub && <small>{pick(it.sub, lang)}</small>}</span>
              <Icon name="chevron" size={18} className="ui-list__chev ui-flip-rtl" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
