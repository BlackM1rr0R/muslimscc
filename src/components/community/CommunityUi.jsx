// K mərhələsi — ortaq kiçik UI: bölmə kartı, təsdiq düyməsi, mesaj sətri, tarix formatı
import { useState } from 'react'
import Icon from '../Icon'

export function Card({ id, icon, title, lead, children, testId }) {
  return (
    <section className="ui-card acc-section" aria-labelledby={`${id}-title`} id={id} data-testid={testId}>
      <header className="acc-section__head">
        <span className="ui-icon-tile"><Icon name={icon} size={20} /></span>
        <div>
          <h2 className="acc-section__title" id={`${id}-title`}>{title}</h2>
          {lead && <p className="acc-section__lead">{lead}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

/** İki addımlı təsdiq (t: { confirm, yes, cancel }) */
export function Confirm({ t, label, onYes, testId, disabled = false, icon = null }) {
  const [ask, setAsk] = useState(false)
  if (!ask) {
    return (
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={disabled} onClick={() => setAsk(true)} data-testid={testId}>
        {icon && <Icon name={icon} size={14} />} {label}
      </button>
    )
  }
  return (
    <span className="rt-confirm">
      <span>{t.confirm}</span>
      <button type="button" className="ui-btn ui-btn--sm acc-btn-danger" onClick={() => { setAsk(false); onYes() }} data-testid={testId ? `${testId}-yes` : undefined}>{t.yes}</button>
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAsk(false)}>{t.cancel}</button>
    </span>
  )
}

export function Msg({ msg, testId }) {
  if (!msg) return null
  return <p className={`rt-msg acc-msg--${msg.tone}`} role={msg.tone === 'bad' ? 'alert' : 'status'} data-testid={testId}>{msg.text}</p>
}

const loc = (lang) => (lang === 'az' ? 'az-Latn-AZ' : lang)
export const fmtDay = (key, lang) => {
  try { return new Date(`${key}T12:00:00Z`).toLocaleDateString(loc(lang), { dateStyle: 'medium', timeZone: 'UTC' }) } catch { return key }
}
export const fmtMs = (ms, lang) => {
  try { return new Date(ms).toLocaleDateString(loc(lang), { dateStyle: 'medium' }) } catch { return new Date(ms).toISOString().slice(0, 10) }
}
export const nf = (n, lang) => { try { return new Intl.NumberFormat(loc(lang)).format(n) } catch { return String(n) } }
