// ═══════════════════════════════════════════════════════
// <HoverPill containerRef={ref} selector=".qm-sn-item" className="qm-sn-hover" />
// Konteyner daxilində siçanın üstündə olduğu sətrin arxasında yumşaq "hap" — sətirdən sətrə
// YAYLA sürüşür (x/y transform), çıxanda solur. Yalnız siçan; toxunuş/hərəkəti azalt → yoxdur.
// Konteyner position: relative olmalıdır; hap z-index-i sətirdən aşağı (CSS sənindir).
//   props: containerRef, selector, className
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { m } from 'motion/react'
import { SPRING } from './presets'
import { isFinePointer, isReduced } from './reduced'

function offsetIn(el, box) {
  let x = 0, y = 0, n = el
  while (n && n !== box) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent }
  return n === box ? { x, y } : null
}

export default function HoverPill({ containerRef, selector, className = '' }) {
  const [st, setSt] = useState({ on: false, x: 0, y: 0, w: 0, h: 0, jump: true })
  useEffect(() => {
    const box = containerRef.current
    if (!box) return undefined
    const over = (e) => {
      if (e.pointerType !== 'mouse' || !isFinePointer() || isReduced()) return
      const it = e.target.closest?.(selector)
      if (!it || !box.contains(it)) return
      const o = offsetIn(it, box)
      if (!o) return
      setSt(p => ({ on: true, x: o.x, y: o.y, w: it.offsetWidth, h: it.offsetHeight, jump: !p.on }))
    }
    const leave = () => setSt(p => (p.on ? { ...p, on: false } : p))
    box.addEventListener('pointerover', over)
    box.addEventListener('pointerleave', leave)
    return () => { box.removeEventListener('pointerover', over); box.removeEventListener('pointerleave', leave) }
  }, [containerRef, selector])
  // Ölçü (en/hündürlük) animasiya olunmur — yalnız mövqe (transform) və opacity
  return (
    <m.span aria-hidden="true" className={`mo-hover-pill${className ? ` ${className}` : ''}`} initial={false}
      style={{ width: st.w, height: st.h }}
      animate={{ x: st.x, y: st.y, opacity: st.on ? 1 : 0 }}
      transition={st.jump ? { duration: 0, opacity: { duration: 0.15 } } : { ...SPRING.snappy, opacity: { duration: 0.15 } }} />
  )
}
