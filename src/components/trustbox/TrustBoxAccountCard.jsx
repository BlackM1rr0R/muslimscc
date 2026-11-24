// Hesab səhifəsində "Əmanət qutusu" kartı — /trust-box səhifəsinə keçid (məzmun orada, uçdan-uca şifrəli)
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import { TB } from './trustBoxText'

export default function TrustBoxAccountCard({ lang, siteLang }) {
  const t = pickUi(TB, lang, 'en')
  return (
    <section className="ui-card acc-section" aria-labelledby="acc-trustbox" data-testid="acc-trustbox">
      <header className="acc-section__head">
        <span className="ui-icon-tile"><Icon name="trustbox" size={20} /></span>
        <div>
          <h2 className="acc-section__title" id="acc-trustbox">{t.title}</h2>
          <p className="acc-section__lead">{t.accountLead}</p>
        </div>
      </header>
      <p><a className="ui-btn ui-btn--secondary ui-btn--sm" href={pathFor('trustbox', siteLang)}><Icon name="lock" className="ui-btn__icon" /> {t.accountBtn}</a></p>
    </section>
  )
}
