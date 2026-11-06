// ═══════════════════════════════════════════════════════
// "Əlaqəli bölmələr" — namaz/təqvim səhifələrinin sonundakı keçid kafelləri
// (/prayerguide, /qibla, /calendar, /hijri-converter, /prayer-tracker).
// Məzmunu təkrarlamır — başqa bölməyə və ya dərsə (/learn/<slug>) keçid verir.
// Keçidlər həqiqi <a href>-dir: adi klik SPA ilə, Ctrl/orta klik yeni tabda.
//   items: [{ key: 'qibla' } | { lesson: 'ghusl', icon? }, title: {az,…}, text: {az,…}]
// ═══════════════════════════════════════════════════════
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import { isPlainClick } from '../PageLink'
import { pathFor } from '../../seo/routes'
import { pickUi } from '../../utils/uiText'

const TXT = {
  eyebrow: { az: 'Davamı', en: 'Keep going', ru: 'Дальше', ar: 'للمتابعة', tr: 'Devamı' },
  title: { az: 'Əlaqəli bölmələr', en: 'Related sections', ru: 'Связанные разделы', ar: 'أقسام ذات صلة', tr: 'İlgili bölümler' },
}
const pick = (o, lang) => (o ? pickUi(o, lang, 'en') || '' : '')

export default function RelatedLinks({ items, lang, title, eyebrow, id = 'related' }) {
  const navigate = useNavigate()
  return (
    <section className="ui-section ui-section--tight qm-related" aria-labelledby={`${id}-title`}>
      <div className="ui-container">
        <div className="ui-section-head">
          <span className="ui-eyebrow">{eyebrow || pick(TXT.eyebrow, lang)}</span>
          <h2 id={`${id}-title`} className="ui-title ui-title--sm">{title || pick(TXT.title, lang)}</h2>
        </div>
        <ul className="ui-tiles" style={{ '--ui-tiles-min': '240px' }}>
          {items.map((it) => {
            const href = it.lesson ? pathFor('learn', lang, it.lesson) : pathFor(it.key, lang)
            const onClick = (e) => {
              if (!isPlainClick(e)) return
              e.preventDefault()
              navigate(href)
              window.scrollTo(0, 0)
            }
            return (
              <li key={href}>
                <a className="ui-tile ui-tile--row" href={href} onClick={onClick}>
                  <span className="ui-icon-tile" aria-hidden="true"><Icon name={it.icon || (it.lesson ? 'learn' : it.key)} fallback={<Icon name="learn" />} /></span>
                  <span className="ui-tile__body">
                    <span className="ui-tile__title">{pick(it.title, lang)}</span>
                    {it.text && <span className="ui-tile__text">{pick(it.text, lang)}</span>}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
