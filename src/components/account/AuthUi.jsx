// ═══════════════════════════════════════════════════════
// Hesab səhifələrinin ortaq hissələri: səhifə qabığı, şifrə sahəsi (göstər/gizlət +
// güc zolağı), xəta/məlumat qutusu (aria-live). Stillər: src/styles/Account.css
// ═══════════════════════════════════════════════════════
import { useId, useState } from 'react'
import Icon, { BrandMark } from '../Icon'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { AUTH_TEXT, fillText } from './authText'
import { MIN_PASSWORD, passwordStrength } from '../../api/userAuth'
import '../../styles/Account.css'

/** Mərkəzdə kart; aside — geniş ekranda yanda (telefonda kartın altında) izah bloku. */
export function AuthShell({ children, aside = null, wide = false }) {
  return (
    <div className={`acc-page${aside ? ' acc-page--split' : ''}${wide ? ' acc-page--wide' : ''}`}>
      <div className="ui-pattern ui-pattern--fade acc-page__pattern" aria-hidden="true" />
      <div className="acc-shell">
        <div className="acc-card ui-card">{children}</div>
        {aside}
      </div>
    </div>
  )
}

/** Kartın başı: brend işarəsi, başlıq, alt mətn. */
export function AuthHead({ title, sub, icon = null }) {
  return (
    <div className="acc-head">
      <span className="acc-head__mark" aria-hidden="true">
        {icon ? <span className="ui-icon-tile ui-icon-tile--lg"><Icon name={icon} size={26} /></span> : <BrandMark size={48} />}
      </span>
      <h1 className="acc-head__title">{title}</h1>
      {sub && <p className="acc-head__sub">{sub}</p>}
    </div>
  )
}

/**
 * Xəta / məlumat. msg: { tone: 'bad'|'ok'|'note', text } və ya null.
 * Qab həmişə DOM-dadır (aria-live) — ekran oxuyucusu yeni mətni oxusun.
 */
export function AuthMessage({ msg, id }) {
  return (
    <div className="acc-msg-live" aria-live="polite" id={id}>
      {msg && (
        <div className={`ui-callout ui-callout--${msg.tone === 'bad' ? 'bad' : msg.tone === 'ok' ? 'ok' : 'note'} acc-msg${msg.tone === 'bad' ? ' acc-msg--bad' : ''}`}
          role={msg.tone === 'bad' ? 'alert' : 'status'} key={msg.seq || 0}>
          <Icon name={msg.tone === 'bad' ? 'alert' : msg.tone === 'ok' ? 'check' : 'info'} />
          <div>
            {msg.title && <strong className="ui-callout__title">{msg.title}</strong>}
            <p>{msg.text}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/** Güc zolağı (4 hissə) + mətn. Ekran oxuyucusu üçün mətn kifayətdir — zolaq aria-hidden. */
export function StrengthMeter({ value, email }) {
  const { lang } = useLang()
  const t = pickUi(AUTH_TEXT, lang)
  if (!value) return null
  const { score, short } = passwordStrength(value, email)
  const level = short ? 0 : score
  return (
    <div className={`acc-strength acc-strength--${level}`}>
      <span className="acc-strength__bars" aria-hidden="true">
        {[1, 2, 3, 4].map(i => <span key={i} className={`acc-strength__bar${i <= Math.max(1, level) ? ' is-on' : ''}`} />)}
      </span>
      <span className="acc-strength__text">{t.strengthLabel}: {t.strength[level]}</span>
    </div>
  )
}

/**
 * Şifrə sahəsi. autoComplete: 'current-password' | 'new-password'.
 * withHint — "ən azı N simvol" ipucu və güc zolağı (yeni şifrə üçün).
 */
export function PasswordField({ label, value, onChange, autoComplete = 'current-password', withHint = false, email = '', invalid = false, name = 'password', autoFocus = false, required = true, describedBy }) {
  const { lang } = useLang()
  const t = pickUi(AUTH_TEXT, lang)
  const [reveal, setReveal] = useState(false)
  const id = useId()
  const hintId = `${id}-hint`
  const desc = [withHint ? hintId : null, describedBy].filter(Boolean).join(' ') || undefined
  return (
    <div className="ui-field acc-field">
      <label className="ui-field__label" htmlFor={id}>{label}</label>
      <span className="acc-input-wrap">
        <Icon name="lock" size={18} className="acc-input-icon" />
        <input
          id={id}
          name={name}
          type={reveal ? 'text' : 'password'}
          className="ui-input acc-input acc-input--pw"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          required={required}
          minLength={withHint ? MIN_PASSWORD : undefined}
          maxLength={1024}
          aria-invalid={invalid || undefined}
          aria-describedby={desc}
          autoFocus={autoFocus}
        />
        <button
          type="button"
          className="ui-icon-btn acc-reveal"
          onClick={() => setReveal(v => !v)}
          aria-label={reveal ? t.hide : t.show}
          aria-pressed={reveal}
          aria-controls={id}
        >
          <Icon name={reveal ? 'close' : 'eye'} size={18} />
        </button>
      </span>
      {withHint && (
        <span className="ui-field__hint" id={hintId}>
          {fillText(t.pwHint, lang, { n: MIN_PASSWORD })}
        </span>
      )}
      {withHint && <StrengthMeter value={value} email={email} />}
    </div>
  )
}

/** E-poçt sahəsi (ikonlu). autoComplete: girişdə "username webauthn" (passkey avtomatik doldurma). */
export function EmailField({ label, value, onChange, autoComplete = 'email', invalid = false, autoFocus = false, describedBy }) {
  const id = useId()
  return (
    <div className="ui-field acc-field">
      <label className="ui-field__label" htmlFor={id}>{label}</label>
      <span className="acc-input-wrap">
        <Icon name="mail" size={18} className="acc-input-icon" />
        <input
          id={id}
          name="email"
          type="email"
          className="ui-input acc-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={254}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          autoFocus={autoFocus}
        />
      </span>
    </div>
  )
}

/** Xəta açarı → mətn ({n} doldurulmuş). */
export function useAuthText() {
  const { lang } = useLang()
  const t = pickUi(AUTH_TEXT, lang)
  const errText = (key) => fillText(t[key] || t.errUnknown, lang, { n: MIN_PASSWORD })
  return { t, errText, lang }
}
