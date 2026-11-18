// ═══════════════════════════════════════════════════════
// Girişin ikinci addımı (/login): şifrə və ya Google düz olandan sonra server { twoFactor, ticket }
// qaytarır (server/users.js → POST /api/auth/2fa). Bilet 5 dəqiqə, 5 cəhd. Kod sahəsi
// autocomplete="one-time-code" + inputmode="numeric"; "Ehtiyat kodu işlət" keçidi.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import Icon from '../Icon'
import { AuthHead, AuthMessage, useAuthText } from './AuthUi'
import { errorKey, verifyTwoFactor } from '../../api/userAuth'
import '../../styles/AccountSecurity.css'

const LABELS = {
  az: { title: 'İki addımlı yoxlama', sub: 'Kod tətbiqindəki 6 rəqəmli kodu yazın.', subBackup: 'Ehtiyat kodlarınızdan birini yazın (hər kod bir dəfə işləyir).', code: 'Kod', backupCode: 'Ehtiyat kodu', verify: 'Təsdiqlə', useBackup: 'Ehtiyat kodu işlət', useApp: 'Tətbiqdəki kodu işlət', back: 'Girişə qayıt', left: 'Qalan cəhd: {n}' },
  en: { title: 'Two-step verification', sub: 'Enter the 6-digit code from your authenticator app.', subBackup: 'Enter one of your backup codes (each code works once).', code: 'Code', backupCode: 'Backup code', verify: 'Verify', useBackup: 'Use a backup code', useApp: 'Use the code from the app', back: 'Back to sign in', left: 'Attempts left: {n}' },
  ru: { title: 'Двухэтапная проверка', sub: 'Введите 6-значный код из приложения-аутентификатора.', subBackup: 'Введите один из резервных кодов (каждый код работает один раз).', code: 'Код', backupCode: 'Резервный код', verify: 'Подтвердить', useBackup: 'Использовать резервный код', useApp: 'Использовать код из приложения', back: 'Вернуться ко входу', left: 'Осталось попыток: {n}' },
  tr: { title: 'İki adımlı doğrulama', sub: 'Doğrulama uygulamanızdaki 6 haneli kodu girin.', subBackup: 'Yedek kodlarınızdan birini girin (her kod bir kez çalışır).', code: 'Kod', backupCode: 'Yedek kod', verify: 'Doğrula', useBackup: 'Yedek kod kullan', useApp: 'Uygulamadaki kodu kullan', back: 'Girişe dön', left: 'Kalan deneme: {n}' },
  ar: { title: 'التحقق بخطوتين', sub: 'أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة.', subBackup: 'أدخل أحد رموزك الاحتياطية (كل رمز يعمل مرة واحدة).', code: 'الرمز', backupCode: 'رمز احتياطي', verify: 'تحقّق', useBackup: 'استخدم رمزًا احتياطيًا', useApp: 'استخدم الرمز من التطبيق', back: 'العودة إلى تسجيل الدخول', left: 'المحاولات المتبقية: {n}' },
}

/** onDone(user) — sessiya açıldı; onCancel(msgKey?) — formaya qayıt (bilet bitəndə 'errTicket'). */
export default function TwoFactorStep({ ticket, onDone, onCancel }) {
  const { lang } = useLang()
  const l = pickUi(LABELS, lang)
  const { t, errText } = useAuthText()
  const [backup, setBackup] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const seq = useRef(0)
  const input = useRef(null)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => { input.current && input.current.focus() }, [backup])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    const v = code.trim()
    if (!v) return
    setBusy(true)
    setMsg(null)
    try {
      const user = await verifyTwoFactor({ ticket, ...(backup ? { backupCode: v } : { code: v }), lang })
      if (alive.current) onDone(user)
    } catch (err) {
      if (!alive.current) return
      const k = errorKey(err)
      if (k === 'errTicket') { onCancel('errTicket'); return }
      const left = err && err.body && err.body.attemptsLeft
      setMsg({ tone: 'bad', text: errText(k) + (left ? ` ${l.left.replace('{n}', left)}` : ''), seq: ++seq.current })
      setCode('')
    } finally { if (alive.current) setBusy(false) }
  }

  return (
    <div className="acc-2fa-step">
      <AuthHead icon="shield" title={l.title} sub={backup ? l.subBackup : l.sub} />
      <AuthMessage msg={msg} />
      <form className="acc-form" onSubmit={onSubmit} noValidate aria-busy={busy || undefined}>
        <div className="ui-field acc-field">
          <label className="ui-field__label" htmlFor="acc-2fa-code">{backup ? l.backupCode : l.code}</label>
          <input id="acc-2fa-code" ref={input} className="ui-input acc-sec-code" name={backup ? 'backup-code' : 'otp'} value={code}
            onChange={(e) => setCode(backup ? e.target.value : e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
            inputMode={backup ? 'text' : 'numeric'} autoComplete="one-time-code" pattern={backup ? undefined : '[0-9]{6}'}
            maxLength={backup ? 11 : 6} spellCheck={false} autoCapitalize="off" dir="ltr" required />
        </div>
        <button type="submit" className="ui-btn ui-btn--primary ui-btn--lg ui-btn--block" disabled={busy || (!backup && code.length !== 6) || (backup && !code.trim())}>
          <Icon name="check" className="ui-btn__icon" /> {busy ? t.busy : l.verify}
        </button>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm acc-linkbtn" onClick={() => { setBackup((b) => !b); setCode(''); setMsg(null) }}>
          {backup ? l.useApp : l.useBackup}
        </button>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm acc-linkbtn" onClick={() => onCancel()}>{l.back}</button>
      </form>
    </div>
  )
}
