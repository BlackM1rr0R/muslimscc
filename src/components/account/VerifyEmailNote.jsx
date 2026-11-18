// ═══════════════════════════════════════════════════════
// "E-poçtu təsdiqləyin" qeydi — server 403 verify_email qaytaranda (dua divarı, açıq profil,
// ümmət xətmi). Təsdiq məktubunu yenidən göndərmək düyməsi də buradadır (POST /api/auth/verify/resend).
// Nəticə aria-live sahəsində; boş role="alert" heç vaxt göstərilmir.
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { resendVerification } from '../../api/userAuth'
import { VE } from './verifyEmailText'
import '../../styles/Account.css'

export default function VerifyEmailNote({ lang, testId = 'verify-email-note' }) {
  const t = pickUi(VE, lang, 'en')
  const [state, setState] = useState('')   // '' | 'busy' | 'sent' | 'failed'
  const send = async () => {
    setState('busy')
    try { await resendVerification(lang); setState('sent') } catch { setState('failed') }
  }
  return (
    <div className="ui-callout ui-callout--warn acc-verify-note" data-testid={testId}>
      <Icon name="mail" size={18} />
      <div>
        <p className="acc-verify-note__text">{t.need}</p>
        {state !== 'sent' && (
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={state === 'busy'} onClick={send} data-testid={`${testId}-resend`}>
            <Icon name="send" className="ui-btn__icon ui-flip-rtl" /> {t.resend}
          </button>
        )}
        <p className="rt-note" aria-live="polite">{state === 'sent' ? t.resent : state === 'failed' ? t.failed : ''}</p>
      </div>
    </div>
  )
}
