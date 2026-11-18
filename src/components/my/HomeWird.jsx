// H2 — ana səhifədə "Mənim virdim" kartı (H1 sırası ilə yerləşir). Vird boşdursa heç nə göstərmir
// (yer tutmur — CLS yoxdur, çünki boş vaxtda yüklənir və ekranın altındadır).
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import { isPlainClick } from '../PageLink'
import Icon from '../Icon'
import { WIRD_TXT } from './wirdText'
import { WirdChecklist } from './WirdPanel'
import useWird from './useWird'

export default function HomeWird() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(WIRD_TXT, lang, 'en')
  const navigate = useNavigate()
  const state = useWird()
  if (!state.w.items.length) return null
  const href = `${pathFor('dailytracker', siteLang)}#wird`
  return (
    <section className="ui-section ui-section--tight my-home-wird" aria-labelledby="hw-ttl" data-testid="home-wird">
      <div className="ui-container">
        <div className="ui-card my-wird__card">
          <div className="my-home-wird__head">
            <div>
              <span className="ui-eyebrow">{t.ey}</span>
              <h2 id="hw-ttl" className="ui-title ui-title--sm">{t.title}</h2>
            </div>
            <a className="ui-link" href={href} onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); navigate(href) } }}>
              {t.toPage} <Icon name="arrow" size={14} className="ui-link__arrow ui-flip-rtl" />
            </a>
          </div>
          <WirdChecklist state={state} compact />
        </div>
      </div>
    </section>
  )
}
