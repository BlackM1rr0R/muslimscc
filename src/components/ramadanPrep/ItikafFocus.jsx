// ═══════════════════════════════════════════════════════
// Etikaf rejimi — son 10 gecə üçün sakit tam ekran (FocusPage / QuranZen ideyası)
//
// • Yalnız bu gecənin siyahısı (iri düymələr, aria-pressed), Qədr gecəsinin duası (saytın Ramazan
//   bələdçisindən, mənbəsi ilə — ramadanGuide.js, "laylat-al-qadr" bölməsinin dua bloku) və
//   saxlanılmayan sayğac. Ekran həmişə tünd (gecə), ekran kilidi açıq qalır (useWakeLock).
// • role=dialog + aria-modal, fokus içəridə dövr edir (Tab), Esc və telefonda "Geri" bağlayır
//   (useBackToClose); bağlananda fokus açan düyməyə qayıdır (səhifə edir).
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../Icon'
import useWakeLock from '../../hooks/useWakeLock'
import { useBackToClose } from '../../utils/useBackToClose'
import { pickUi } from '../../utils/uiText'
import { NIGHT_ITEMS, isOddNight } from '../../utils/ramadanPrep'
import { NIGHT_TEXT } from './prepText'
import '../../styles/RamadanPrep.css'

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

export default function ItikafFocus({ t, lang, night, preview, isDone, onToggle, dua, onClose }) {
  const rootRef = useRef(null)
  const headRef = useRef(null)
  const [count, setCount] = useState(0)
  const awake = useWakeLock(true)
  useBackToClose(true, onClose)

  useEffect(() => {
    headRef.current?.focus()
    document.documentElement.classList.add('rpp-focus-open')
    return () => document.documentElement.classList.remove('rpp-focus-open')
  }, [])

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
    if (e.key !== 'Tab') return
    const els = [...(rootRef.current?.querySelectorAll(FOCUSABLE) || [])]
    if (!els.length) return
    const first = els[0], last = els[els.length - 1]
    if (e.shiftKey && (document.activeElement === first || document.activeElement === headRef.current)) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  if (typeof document === 'undefined') return null
  const odd = isOddNight(night)
  return createPortal(
    <div className="rpp-focus" role="dialog" aria-modal="true" aria-labelledby="rpp-focus-h" ref={rootRef} onKeyDown={onKey} data-testid="rpp-focus">
      <div className="rpp-focus__sky" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <header className="rpp-focus__top">
        <div className="rpp-focus__title">
          <h2 id="rpp-focus-h" tabIndex={-1} ref={headRef}>{t.nightN(night)}</h2>
          <div className="rpp-focus__badges">
            {odd && <span className="rpp-badge rpp-badge--odd"><Icon name="star" size={13} /> {t.odd}</span>}
            {preview && <span className="rpp-badge">{t.preview}</span>}
          </div>
        </div>
        <button type="button" className="rpp-focus__x" onClick={onClose} aria-label={t.close} data-testid="rpp-focus-close">
          <Icon name="close" size={20} />
        </button>
      </header>

      <div className="rpp-focus__body">
        <ul className="rpp-focus__items">
          {NIGHT_ITEMS.map((id) => {
            const on = isDone(id)
            return (
              <li key={id}>
                <button type="button" className={`rpp-focus__item${on ? ' is-on' : ''}`} aria-pressed={on} disabled={preview}
                  onClick={() => onToggle(id, !on)} data-testid={`rpp-focus-${id}`}>
                  <span className="rpp-focus__ic" aria-hidden="true"><Icon name={on ? 'check' : NIGHT_TEXT[id].icon} size={22} /></span>
                  <span>{pickUi(NIGHT_TEXT[id].title, lang, 'en')}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {dua && (
          <figure className="rpp-focus__dua" data-testid="rpp-focus-duatext">
            <p className="rpp-focus__ar" lang="ar" dir="rtl">{dua.ar}</p>
            {lang !== 'ar' && dua.translit && <p className="rpp-focus__tl">{pickUi(dua.translit, lang, 'en')}</p>}
            {lang !== 'ar' && dua.text && <p className="rpp-focus__tr">{pickUi(dua.text, lang, 'en')}</p>}
            <figcaption className="rpp-focus__src"><Icon name="learn" size={14} /> {pickUi(dua.src, lang, 'en')}</figcaption>
          </figure>
        )}

        <div className="rpp-focus__counter">
          <button type="button" className="rpp-focus__tap" onClick={() => setCount((c) => c + 1)} data-testid="rpp-focus-tap"
            aria-describedby="rpp-focus-count-note">
            <b className="ui-num" aria-hidden="true">{count}</b>
            <span>{t.tap}</span>
          </button>
          <div className="rpp-focus__cmeta">
            <p className="ui-sr-only" aria-live="polite" aria-atomic="true">{count ? t.count(count) : ''}</p>
            <p id="rpp-focus-count-note" className="rpp-focus__note">{t.counter} · {t.counterNote}</p>
            <button type="button" className="rpp-focus__reset" onClick={() => setCount(0)} disabled={!count}>
              <Icon name="refresh" size={16} /> {t.resetCount}
            </button>
            {awake === 'on' && <p className="rpp-focus__note">{t.awake}</p>}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
