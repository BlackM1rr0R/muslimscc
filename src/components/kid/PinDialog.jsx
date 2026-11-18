// ═══════════════════════════════════════════════════════
// H5 — valideyn PIN dialoqu: uşaq rejimindən çıxış (utils/kidLock → disableWithPin).
// Səhv cəhdlər sayılır; 3-dən sonra gözləmə (geri sayım, aria-live). <dialog>: fokus tələsi, Esc.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import Icon from '../Icon'
import { disableWithPin, readLock, FREE_TRIES } from '../../utils/kidLock'

export default function PinDialog({ t, onClose, onUnlocked, action = disableWithPin, title, lead, submit }) {
  const ref = useRef(null)
  const inputRef = useRef(null)
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [until, setUntil] = useState(() => { const l = readLock(); return l.u > Date.now() ? l.u : 0 })
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const d = ref.current
    if (d && !d.open) { try { d.showModal() } catch { d.setAttribute('open', '') } }
    const onCancel = (e) => { e.preventDefault(); onClose() }
    d?.addEventListener('cancel', onCancel)
    inputRef.current?.focus()
    return () => d?.removeEventListener('cancel', onCancel)
  }, [onClose])
  // Gözləmə geri sayımı — yalnız gözləmə varsa, saniyədə bir
  useEffect(() => {
    if (!until) return undefined
    const id = setInterval(() => { const n = Date.now(); setNow(n); if (n >= until) { setUntil(0); setErr('') } }, 1000)
    return () => clearInterval(id)
  }, [until])
  const waitS = until > now ? Math.ceil((until - now) / 1000) : 0

  const onSubmit = async (e) => {
    e.preventDefault()
    if (busy || waitS) return
    setBusy(true)
    try {
      const r = await action(pin)
      if (r.ok) { onUnlocked(); return }
      setPin('')
      if (r.wait) { setUntil(Date.now() + r.wait); setNow(Date.now()); setErr(t.wait(Math.ceil(r.wait / 1000))) }
      else setErr(t.wrong(Math.max(0, FREE_TRIES - (r.fails || 0))))
      inputRef.current?.focus()
    } catch { setErr(t.noCrypto) } finally { setBusy(false) }
  }

  return (
    <dialog ref={ref} className="ui-dialog kid-pin" aria-labelledby="kid-pin-t" aria-describedby="kid-pin-l" data-testid="kid-pin-dialog"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <form onSubmit={onSubmit}>
        <div className="ui-dialog__head">
          <h2 id="kid-pin-t" className="ui-dialog__title"><Icon name="lock" size={20} /> {title || t.pinTitle}</h2>
          <button type="button" className="ui-icon-btn" onClick={onClose} aria-label={t.cancel} title={t.cancel}><Icon name="close" size={18} /></button>
        </div>
        <div className="ui-dialog__body">
          <p id="kid-pin-l">{lead || t.pinLead}</p>
          <label className="ui-field" htmlFor="kid-pin-in">
            <span className="ui-field__label">{t.pinLabel}</span>
            <input ref={inputRef} id="kid-pin-in" className="ui-input ui-num kid-pin__in" type="password" inputMode="numeric" autoComplete="off"
              pattern="[0-9]{4,6}" minLength={4} maxLength={6} required value={pin} disabled={Boolean(waitS)}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} aria-describedby="kid-pin-err" data-testid="kid-pin-input" />
          </label>
          {/* aria-describedby üçün element həmişə var; role="alert" yalnız mətn olanda (boş alert a11y xətasıdır) */}
          <p id="kid-pin-err" className="kid-pin__err" role={waitS || err ? 'alert' : undefined} aria-live="assertive" data-testid="kid-pin-error">{waitS ? t.wait(waitS) : err}</p>
        </div>
        <div className="ui-dialog__foot">
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={onClose}>{t.cancel}</button>
          <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy || Boolean(waitS) || pin.length < 4} data-testid="kid-pin-submit">
            {busy ? t.checking : (submit || t.unlock)}
          </button>
        </div>
      </form>
    </dialog>
  )
}
