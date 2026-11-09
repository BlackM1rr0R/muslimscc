// ═══════════════════════════════════════════════════════
// useTilt() — kart üçün yüngül 3D əyilmə (yalnız siçan; toxunuş / hərəkəti azalt → yoxdur).
//   const tilt = useTilt({ max: 6 })
//   <SpotlightCard {...tilt} className="… pfx-tilt">  (və ya istənilən element)
// React render etmir: --pfx-rx / --pfx-ry CSS dəyişənləri rAF ilə yazılır; transform
// pagefx.css-dədir (.pfx-tilt). Valideyndən gələn onPointerMove/Leave saxlanılır.
// ═══════════════════════════════════════════════════════
import { useRef } from 'react'
import { isFinePointer, isReduced } from '../../motion/reduced'

export default function useTilt({ max = 6, onPointerMove, onPointerLeave } = {}) {
  const raf = useRef(0)
  const move = (e) => {
    onPointerMove?.(e)
    if (e.pointerType !== 'mouse' || !isFinePointer() || isReduced()) return
    const n = e.currentTarget
    const { clientX, clientY } = e
    if (raf.current) return
    raf.current = requestAnimationFrame(() => {
      raf.current = 0
      const r = n.getBoundingClientRect()
      if (!r.width || !r.height) return
      const px = (clientX - r.left) / r.width - 0.5
      const py = (clientY - r.top) / r.height - 0.5
      n.style.setProperty('--pfx-ry', `${(px * max * 2).toFixed(2)}deg`)
      n.style.setProperty('--pfx-rx', `${(-py * max * 2).toFixed(2)}deg`)
      n.setAttribute('data-tilt-on', '')
    })
  }
  const leave = (e) => {
    onPointerLeave?.(e)
    cancelAnimationFrame(raf.current); raf.current = 0
    const n = e.currentTarget
    n.style.removeProperty('--pfx-rx')
    n.style.removeProperty('--pfx-ry')
    n.removeAttribute('data-tilt-on')
  }
  return { onPointerMove: move, onPointerLeave: leave }
}
