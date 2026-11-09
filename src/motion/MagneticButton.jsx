// ═══════════════════════════════════════════════════════
// <MagneticButton strength={0.25}><button className="ui-btn ui-btn--primary">…</button></MagneticButton>
// Uşaq element kursora doğru yay ilə "çəkilir" (ən çox `max` px), buraxanda yerinə qayıdır.
// Sarğı (span) hərəkət edir — düymənin öz transform/hover stillərinə toxunulmur.
// Yalnız siçan; toxunuş/hərəkəti azalt → adi düymə. wow.js maqniti bu sarğıda işləmir.
// ═══════════════════════════════════════════════════════
import { m, useMotionValue, useSpring } from 'motion/react'
import { SPRING } from './presets'
import { isFinePointer, isReduced } from './reduced'

export default function MagneticButton({ strength = 0.25, max = 8, className = '', children, ...rest }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, SPRING.soft)
  const sy = useSpring(y, SPRING.soft)
  const move = (e) => {
    if (e.pointerType !== 'mouse' || !isFinePointer() || isReduced()) return
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) * strength
    const dy = (e.clientY - (r.top + r.height / 2)) * strength
    x.set(Math.max(-max, Math.min(max, dx)))
    y.set(Math.max(-max, Math.min(max, dy)))
  }
  const reset = () => { x.set(0); y.set(0) }
  return (
    <m.span className={`mo-magnet${className ? ` ${className}` : ''}`} style={{ x: sx, y: sy }} data-motion-own=""
      onPointerMove={move} onPointerLeave={reset} onBlur={reset} {...rest}>
      {children}
    </m.span>
  )
}
