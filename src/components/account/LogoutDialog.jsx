// ═══════════════════════════════════════════════════════
// Çıxış dialoqu — yalnız bu cihazın sinxronizasiyası hesaba bağlı olanda (userSession →
// syncLinkedHere) göstərilir: "Bu cihazda məlumat qalsın?" (susmaya görə — saxla).
//   saxla  → adi çıxış (kod və məlumat qalır; növbəti girişdə yenə sinxronlanır)
//   sil    → bərpa kodu bu cihazda unudulur (utils/accountSync → forgetOnThisDevice);
//            istəyə bağlı: sinxronlanan bütün məlumat da silinir (aydın xəbərdarlıqla)
// Brauzerin <dialog> elementi: fokus tələsi, ESC ilə bağlanma (BackupDialog kimi). Tənbəl chunk.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import Icon from '../Icon'
import { logoutUser } from '../../api/userSession'
import { forgetOnThisDevice } from '../../utils/accountSync'
import { LOGOUT_TXT } from './syncText'
import '../../styles/Account.css'

export default function LogoutDialog({ onClose, onSignedOut }) {
  const { lang } = useLang()
  const l = pickUi(LOGOUT_TXT, lang, 'en')
  const ref = useRef(null)
  const [choice, setChoice] = useState('keep')
  const [wipe, setWipe] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const d = ref.current
    if (d && !d.open) { try { d.showModal() } catch { d.setAttribute('open', '') } }
    const onCancel = (e) => { e.preventDefault(); if (!busy) onClose() }
    d?.addEventListener('cancel', onCancel)
    return () => d?.removeEventListener('cancel', onCancel)
  }, [onClose, busy])

  const onConfirm = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    if (choice === 'remove') forgetOnThisDevice({ wipe })
    try { await logoutUser() } catch { /* ipucu onsuz da silindi */ }
    onSignedOut(choice === 'remove' && wipe)
  }

  return (
    <dialog ref={ref} className="acc-dialog" aria-labelledby="lo-title" aria-describedby="lo-lead" data-testid="logout-dialog"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <form className="acc-dialog__body" onSubmit={onConfirm}>
        <h2 id="lo-title" className="acc-dialog__title"><Icon name="logout" size={20} className="ui-flip-rtl" /> {l.title}</h2>
        <p id="lo-lead" className="acc-dialog__lead">{l.lead}</p>
        <fieldset className="acc-choices">
          <legend className="ui-sr-only">{l.title}</legend>
          <label className={`acc-choice${choice === 'keep' ? ' is-on' : ''}`}>
            <input type="radio" name="lo-choice" value="keep" checked={choice === 'keep'} onChange={() => { setChoice('keep'); setWipe(false) }} />
            <span><b>{l.keep}</b><small>{l.keepHint}</small></span>
          </label>
          <label className={`acc-choice${choice === 'remove' ? ' is-on' : ''}`}>
            <input type="radio" name="lo-choice" value="remove" checked={choice === 'remove'} onChange={() => setChoice('remove')} />
            <span><b>{l.remove}</b><small>{l.removeHint}</small></span>
          </label>
        </fieldset>
        {choice === 'remove' && (
          <label className="acc-check">
            <input type="checkbox" checked={wipe} onChange={(e) => setWipe(e.target.checked)} data-testid="logout-wipe" />
            <span>{l.wipe}</span>
          </label>
        )}
        {choice === 'remove' && wipe && <p className="ui-callout ui-callout--warn acc-dialog__warn" role="alert"><Icon name="alert" /> <span>{l.wipeWarn}</span></p>}
        <div className="acc-row acc-dialog__actions">
          <button type="submit" className={`ui-btn ${wipe ? 'acc-btn-danger' : 'ui-btn--primary'}`} disabled={busy}>
            <Icon name="logout" className="ui-btn__icon ui-flip-rtl" /> {l.confirm}
          </button>
          <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose} disabled={busy}>{l.cancel}</button>
        </div>
      </form>
    </dialog>
  )
}
