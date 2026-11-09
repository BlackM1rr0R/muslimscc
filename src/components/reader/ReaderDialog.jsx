import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, m } from 'motion/react'
import { SPRING, DUR, enterT, exitT } from '../../motion/presets'
import useMedia from '../../hooks/useMedia'
import Icon from '../Icon'
import { useBackToClose } from '../../utils/useBackToClose'
import '../../styles/ReaderDialog.css'

/* ══════════════════════════════════════════════════════════════════
   ReaderDialog — kart grid-lərindən açılan oxu pəncərəsi (dizayn v3.2)
   İşlədənlər: Nawawi40Page, HisnPage, DuasPage (yalnız hədis/dua qrupu).

   • Portal ilə <body>-yə; role="dialog" + aria-modal + aria-labelledby
   • Fokus tələsi (Tab dövrü), açılanda pəncərəyə, bağlananda əvvəlki
     elementə qayıdır; Esc bağlayır; ←/→ əvvəlki/növbəti (RTL-də əksinə);
     telefonda sola/sağa sürüşdürmə də keçir
   • Səhifə sürüşməsi kilidlənir; Geri düyməsi pəncərəni bağlayır
     (utils/useBackToClose — URL dəyişmir, hash-i səhifə özü idarə edir)
   • v6 (src/motion): açılış/bağlanış Motion yayı ilə (AnimatePresence — bağlanarkən son
     məzmun qalır); fon solur. layoutId verilsə (src/motion/ExpandableCard → useMorphId)
     pəncərə kartdan "böyüyür" və bağlananda karta qayıdır. Telefonda aşağıdan qalxan vərəq.
   ══════════════════════════════════════════════════════════════════ */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function ReaderDialog({
  open, onClose, onPrev, onNext, labelledBy, position, labels = {},
  head = null, footer = null, children, className = '', contentKey, layoutId,
}) {
  const panelRef = useRef(null)
  const bodyRef = useRef(null)
  const returnRef = useRef(null)
  const cbs = useRef({})
  // v5.6: əvvəlki/növbəti istiqaməti — məzmun həmin tərəfdən sürüşüb gəlir
  const dirRef = useRef(0)
  const wrap = (fn, d) => (fn ? () => { dirRef.current = d; fn() } : undefined)
  cbs.current = { onClose, onPrev: wrap(onPrev, -1), onNext: wrap(onNext, 1) }

  const sheet = useMedia('(max-width: 639.98px)', false)
  // Yeni açılışda istiqamət sıfırlanır (məzmun sürüşmədən görünür)
  useEffect(() => { if (open) dirRef.current = 0 }, [open])

  useBackToClose(open, onClose)

  // Açılış: fokus, sürüşmə kilidi; bağlanış: fokusu geri qaytar
  useEffect(() => {
    if (!open) return undefined
    returnRef.current = document.activeElement
    const root = document.documentElement
    const prevOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }))
    return () => {
      root.style.overflow = prevOverflow
      const el = returnRef.current
      if (el && document.contains(el)) el.focus?.({ preventScroll: true })
    }
  }, [open])

  // Yeni məzmun (növbəti/əvvəlki) — oxu sahəsini başa qaytar
  useEffect(() => { if (open && bodyRef.current) bodyRef.current.scrollTop = 0 }, [open, contentKey])

  // Klaviatura: Esc, ←/→, Tab tələsi
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      const panel = panelRef.current
      if (!panel) return
      // Üstdə başqa (native) dialoq açıqdır — məs. «Səhv bildir»; ona mane olma
      if (document.querySelector('dialog[open]')) return
      if (e.key === 'Escape') { e.preventDefault(); cbs.current.onClose?.(); return }
      if (e.key === 'Tab') {
        const items = [...panel.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null || el === document.activeElement)
        if (!items.length) { e.preventDefault(); return }
        const first = items[0]; const last = items[items.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
        return
      }
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      const t = e.target
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const rtl = getComputedStyle(panel).direction === 'rtl'
      const forward = (e.key === 'ArrowRight') !== rtl
      const fn = forward ? cbs.current.onNext : cbs.current.onPrev
      if (fn) { e.preventDefault(); fn() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Telefonda üfüqi sürüşdürmə → əvvəlki/növbəti
  const touch = useRef(null)
  const onTouchStart = (e) => { const p = e.touches[0]; touch.current = { x: p.clientX, y: p.clientY } }
  const onTouchEnd = (e) => {
    const s = touch.current; touch.current = null
    if (!s) return
    const p = e.changedTouches[0]
    const dx = p.clientX - s.x; const dy = p.clientY - s.y
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return
    const rtl = panelRef.current && getComputedStyle(panelRef.current).direction === 'rtl'
    const forward = (dx < 0) !== rtl
    const fn = forward ? cbs.current.onNext : cbs.current.onPrev
    fn?.()
  }

  if (typeof document === 'undefined') return null
  const swap = dirRef.current > 0 ? ' rd-body--next' : dirRef.current < 0 ? ' rd-body--prev' : ''
  const panelMotion = layoutId
    ? { layoutId, transition: SPRING.soft, exit: { opacity: 0, transition: exitT(DUR.sm) } }
    : sheet
      ? { initial: { opacity: 0, y: 48 }, animate: { opacity: 1, y: 0, transition: SPRING.soft }, exit: { opacity: 0, y: 64, transition: exitT(DUR.md) } }
      : { initial: { opacity: 0, y: 14, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1, transition: SPRING.soft }, exit: { opacity: 0, y: 10, scale: 0.98, transition: exitT(DUR.md) } }
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div key="rd" className="rd-backdrop" data-wow-off=""
          initial={{ opacity: 0 }} animate={{ opacity: 1, transition: enterT(DUR.sm) }} exit={{ opacity: 0, transition: exitT(DUR.sm) }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
          <m.div ref={panelRef} className={`rd-panel ${className || ''}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}
            onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} {...panelMotion}>
            <div className="rd-head">
              <div className="rd-head__main">{head}</div>
              {position && <span className="rd-pos ui-num" dir="ltr">{position}</span>}
              <button type="button" className="ui-icon-btn rd-close" onClick={onClose} aria-label={labels.close} title={labels.close}>
                <Icon name="close" />
              </button>
            </div>
            <div ref={bodyRef} className={`rd-body${swap}`} key={contentKey}>{children}</div>
            <div className="rd-foot">
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm rd-nav" onClick={cbs.current.onPrev} disabled={!onPrev} aria-label={labels.prev}>
                <Icon name="chevronLeft" className="ui-btn__icon ui-flip-rtl" /><span className="rd-nav__label">{labels.prev}</span>
              </button>
              <div className="rd-foot__mid">{footer}</div>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm rd-nav" onClick={cbs.current.onNext} disabled={!onNext} aria-label={labels.next}>
                <span className="rd-nav__label">{labels.next}</span><Icon name="chevron" className="ui-btn__icon ui-flip-rtl" />
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
