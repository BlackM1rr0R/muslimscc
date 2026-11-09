// ═══════════════════════════════════════════════════════
// <SpotlightCard as="a" href=… className="ui-tile"> — kursoru izləyən yumşaq işıq +
// haşiyə parıltısı (21st.dev "spotlight card" ideyası, öz kodumuz).
// • Yalnız incə göstərici (siçan) — toxunuşda heç nə; hərəkəti azalt → işıq yox.
// • React render etmir: --mo-sx/--mo-sy CSS dəyişənləri rAF ilə yazılır (yalnız kadra bir dəfə).
// • İşıq ::before / ::after ilə (motion-kit.css) — kartın öz ::before/::after-i varsa
//   `glow={false}` ver və ya öz CSS-ində --mo-spot-* dəyişənlərini işlət.
// • wow.js-in kart işığı/əyilməsi bu elementə toxunmur (data-motion-own).
//   props: as='div', glow=true, radius=260 (px), tone='brand'|'accent', + istənilən atribut
// ═══════════════════════════════════════════════════════
import { forwardRef, useRef } from 'react'
import { isFinePointer, isReduced } from './reduced'

const SpotlightCard = forwardRef(function SpotlightCard({ as: Tag = 'div', glow = true, radius = 260, tone = 'brand', className = '', style, onPointerMove, onPointerLeave, children, ...rest }, outer) {
  const el = useRef(null)
  const raf = useRef(0)
  const pt = useRef(null)
  const setRef = (n) => { el.current = n; if (typeof outer === 'function') outer(n); else if (outer) outer.current = n }

  const move = (e) => {
    onPointerMove?.(e)
    if (e.pointerType !== 'mouse' || !isFinePointer() || isReduced()) return
    pt.current = [e.clientX, e.clientY]
    if (raf.current) return
    raf.current = requestAnimationFrame(() => {
      raf.current = 0
      const n = el.current
      if (!n || !pt.current) return
      const r = n.getBoundingClientRect()
      n.style.setProperty('--mo-sx', `${Math.round(pt.current[0] - r.left)}px`)
      n.style.setProperty('--mo-sy', `${Math.round(pt.current[1] - r.top)}px`)
      if (!n.hasAttribute('data-spot-on')) n.setAttribute('data-spot-on', '')
    })
  }
  const leave = (e) => {
    onPointerLeave?.(e)
    cancelAnimationFrame(raf.current); raf.current = 0
    el.current?.removeAttribute('data-spot-on')
  }
  return (
    <Tag ref={setRef} className={`mo-spot mo-spot--${tone}${glow ? ' mo-spot--glow' : ''}${className ? ` ${className}` : ''}`}
      style={{ ...style, '--mo-spot-r': `${radius}px` }} data-motion-own="" onPointerMove={move} onPointerLeave={leave} {...rest}>
      {children}
    </Tag>
  )
})
export default SpotlightCard
