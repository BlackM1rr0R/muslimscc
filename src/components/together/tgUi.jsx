// I mərhələsi — ortaq kiçik UI hissələri (təsdiq düyməsi, tarix, şablon adı)
import { useState } from 'react'

export const LOC = (lang) => (lang === 'az' ? 'az-Latn-AZ' : lang)
/** 'YYYY-MM-DD' → "18 noy 2026" */
export function fmtDay(key, lang, opts = { dateStyle: 'medium' }) {
  if (!key) return ''
  try { return new Date(`${key}T12:00:00Z`).toLocaleDateString(LOC(lang), { ...opts, timeZone: 'UTC' }) } catch { return key }
}
export function fmtMs(ms, lang) {
  try { return new Date(ms).toLocaleDateString(LOC(lang), { dateStyle: 'medium' }) } catch { return new Date(ms).toISOString().slice(0, 10) }
}
export const nf = (n, lang) => { try { return new Intl.NumberFormat(LOC(lang)).format(n) } catch { return String(n) } }

/** Çağırışın göstərilən adı (şablondan; "custom" — öz başlığı) */
export function challengeName(c, t) {
  if (!c) return ''
  if (c.template === 'custom') return c.title || t.ch.template
  if (c.template === 'quran_pages') return t.ch.pagesN(c.n || 1)
  return t.ch.templates[c.template] || t.ch.template
}

export function Confirm({ t, label, onYes, testId, disabled = false }) {
  const [ask, setAsk] = useState(false)
  if (!ask) return <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={disabled} onClick={() => setAsk(true)} data-testid={testId}>{label}</button>
  return (
    <span className="rt-confirm">
      <span>{t.common.confirm}</span>
      <button type="button" className="ui-btn ui-btn--sm acc-btn-danger" onClick={() => { setAsk(false); onYes() }} data-testid={testId ? `${testId}-yes` : undefined}>{t.common.yes}</button>
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAsk(false)}>{t.common.cancel}</button>
    </span>
  )
}

/** Mesaj sətri (uğur / xəta) */
export function Msg({ msg }) {
  if (!msg) return null
  return <p className={`rt-msg acc-msg--${msg.tone}`} role={msg.tone === 'bad' ? 'alert' : 'status'}>{msg.text}</p>
}
