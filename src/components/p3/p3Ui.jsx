// P3 — ortaq kiçik UI: təsdiq düyməsi, mesaj sətri, tarix formatı, giriş kartı, yüklənir.
import { useState } from 'react'
import Icon from '../Icon'
import { pathFor } from '../../seo/routes'

export const LOC = (lang) => (lang === 'az' ? 'az-Latn-AZ' : lang)
/** 'YYYY-MM-DD' → yerli tarix */
export function fmtDay(key, lang) {
  if (!key) return ''
  try { return new Date(`${key}T12:00:00Z`).toLocaleDateString(LOC(lang), { day: 'numeric', month: 'long', timeZone: 'UTC' }) } catch { return key }
}
export function fmtDate(ms, lang) {
  try { return new Date(ms).toLocaleDateString(LOC(lang), { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return new Date(ms).toISOString().slice(0, 10) }
}
export function fmtTime(ms, lang) {
  try { return new Date(ms).toLocaleString(LOC(lang), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return new Date(ms).toISOString().slice(0, 16).replace('T', ' ') }
}

/** İki addımlı təsdiq: düymə → "Əminsiniz?" + Bəli / Ləğv */
export function Confirm({ label, ask: askText, yes, cancel, onYes, testId, disabled = false, icon = 'trash' }) {
  const [ask, setAsk] = useState(false)
  if (!ask) {
    return (
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={disabled} onClick={() => setAsk(true)} data-testid={testId}>
        <Icon name={icon} className="ui-btn__icon" /> {label}
      </button>
    )
  }
  return (
    <span className="rt-confirm p3-confirm">
      <span>{askText}</span>
      <button type="button" className="ui-btn ui-btn--sm acc-btn-danger" onClick={() => { setAsk(false); onYes() }} data-testid={testId ? `${testId}-yes` : undefined}>{yes}</button>
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAsk(false)}>{cancel}</button>
    </span>
  )
}

/** Mesaj sətri; boş olanda HEÇ NƏ render olunmur (boş role="alert" olmasın) */
export function Msg({ msg }) {
  if (!msg) return null
  return <p className={`rt-msg acc-msg--${msg.tone}`} role={msg.tone === 'bad' ? 'alert' : 'status'}>{msg.text}</p>
}

export function Loading({ label }) {
  return <div className="spinner-wrap" role="status"><div className="spinner" /><span className="ui-sr-only">{label}</span></div>
}

export function SignInCard({ text, btn, pageKey, siteLang, testId }) {
  const next = `${pathFor(pageKey, siteLang)}${typeof window === 'undefined' ? '' : window.location.hash}`
  return (
    <div className="ui-card acc-section" data-testid={testId}>
      <p>{text}</p>
      <a className="ui-btn ui-btn--primary ui-btn--sm" href={`${pathFor('login', siteLang)}?next=${encodeURIComponent(next)}`}>
        <Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {btn}
      </a>
    </div>
  )
}
