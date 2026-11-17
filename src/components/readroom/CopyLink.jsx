// Keçidi göstər + kopyala + (varsa) sistem paylaşması — "Birlikdə oxu", ailə dəvəti, "Məni yoxla" üçün ortaq
import { useId, useState } from 'react'
import Icon from '../Icon'

export default function CopyLink({ link, label, copyText, copiedText, shareText, title, testId }) {
  const id = useId()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2500) } catch { document.getElementById(id)?.select() }
  }
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  return (
    <div className="rt-copy">
      <label className="ui-field" htmlFor={id}>
        <span className="ui-field__label">{label}</span>
        <input id={id} className="ui-input rt-copy__input" readOnly value={link} dir="ltr" onFocus={(e) => e.target.select()} data-testid={testId} />
      </label>
      <div className="rt-copy__row">
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={copy}>
          <Icon name={copied ? 'check' : 'copy'} className="ui-btn__icon" /> {copied ? copiedText : copyText}
        </button>
        {canShare && (
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => navigator.share({ title, url: link }).catch(() => {})}>
            <Icon name="share" className="ui-btn__icon" /> {shareText}
          </button>
        )}
        <span className="ui-sr-only" aria-live="polite">{copied ? copiedText : ''}</span>
      </div>
    </div>
  )
}
