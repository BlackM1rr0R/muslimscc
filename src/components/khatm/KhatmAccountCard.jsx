// ═══════════════════════════════════════════════════════
// /account — "Ümmətin Canlı Xətmi": iştirak etdiyiniz xətmlər (server/globalKhatm.js → GET /api/khatm/me).
// Push bildirişi olmayanlar dövrün tamamlandığını burada (növbəti girişdə) görür; yaddaşa
// (utils/worldKhatm) yazılır → "Ümmət xətmində iştirak" möhürü. "Yeni" nişanı bir dəfə göstərilir.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import Icon from '../Icon'
import { pathFor } from '../../seo/routes'
import { pickUi } from '../../utils/uiText'
import { khatmMe } from '../../api/khatm'
import { syncRounds, readKhatm, unseenRounds, markSeen } from '../../utils/worldKhatm'
import { KT } from './khatmText'

export default function KhatmAccountCard({ lang, siteLang }) {
  const t = pickUi(KT, lang, 'en')
  const [rounds, setRounds] = useState(null)
  const [fresh, setFresh] = useState([])
  useEffect(() => {
    let alive = true
    khatmMe().then((m) => {
      if (!alive) return
      syncRounds(m.rounds)
      const unseen = unseenRounds(readKhatm())
      setFresh(unseen)
      if (unseen.length) markSeen(unseen)
      setRounds(m.rounds || [])
    }).catch(() => { if (alive) setRounds([]) })
    return () => { alive = false }
  }, [])
  return (
    <section className="ui-card acc-section" aria-labelledby="kt-acc-title" id="khatm" data-testid="khatm-account">
      <header className="acc-section__head">
        <span className="ui-icon-tile"><Icon name="globe" size={20} /></span>
        <div>
          <h2 className="acc-section__title" id="kt-acc-title">{t.title}</h2>
          <p className="acc-section__lead">{t.accLead}</p>
        </div>
      </header>
      {fresh.length > 0 && <p className="acc-section__lead" role="status" data-testid="khatm-account-new"><Icon name="sparkle" size={16} /> {t.accNew}</p>}
      {rounds && rounds.length === 0 && <p className="acc-section__lead">{t.accNone}</p>}
      {rounds && rounds.length > 0 && (
        <ul className="acc-list">
          {rounds.slice(0, 6).map((r) => (
            <li key={r.no} className="acc-list__item">{t.accRound(r.no, r.myPages)} · <b>{r.completedAt ? t.accDone : t.accOpen}</b></li>
          ))}
        </ul>
      )}
      <div>
        <a className="ui-btn ui-btn--primary ui-btn--sm" href={pathFor('khatm', siteLang)}><Icon name="mushaf" className="ui-btn__icon" /> {t.accGo}</a>
      </div>
    </section>
  )
}
