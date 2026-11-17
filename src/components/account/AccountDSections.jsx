// ═══════════════════════════════════════════════════════
// /account — D mərhələsi: profillər (utils/profiles), ailə dairəsi (server/family.js),
// "Birlikdə Quran oxu" girişi (server/readTogether.js). AccountPage bu faylı tənbəl yükləyir.
// ═══════════════════════════════════════════════════════
import Icon from '../Icon'
import { pathFor } from '../../seo/routes'
import { pickUi } from '../../utils/uiText'
import { RT } from '../readroom/readRoomText'
import ProfilesSection from './ProfilesSection'
import FamilySection from './FamilySection'

export default function AccountDSections({ lang, siteLang, user }) {
  const r = pickUi(RT, lang, 'en')
  return (
    <>
      <ProfilesSection lang={lang} defaultName={user?.displayName || ''} />
      <FamilySection lang={lang} siteLang={siteLang} />
      <section className="ui-card acc-section" aria-labelledby="rt-acc-title" id="read-together" data-testid="rt-account">
        <header className="acc-section__head">
          <span className="ui-icon-tile"><Icon name="mushaf" size={20} /></span>
          <div>
            <h2 className="acc-section__title" id="rt-acc-title">{r.title}</h2>
            <p className="acc-section__lead">{r.lead}</p>
          </div>
        </header>
        <div className="rt-row">
          <a className="ui-btn ui-btn--primary ui-btn--sm" href={pathFor('readtogether', siteLang)}><Icon name="group" className="ui-btn__icon" /> {r.createTitle}</a>
          <a className="ui-btn ui-btn--ghost ui-btn--sm" href={pathFor('mushaf', siteLang)}><Icon name="mushaf" className="ui-btn__icon" /> {r.backMushaf}</a>
        </div>
      </section>
    </>
  )
}
