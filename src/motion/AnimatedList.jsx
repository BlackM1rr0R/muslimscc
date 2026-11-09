// ═══════════════════════════════════════════════════════
// <AnimatedList as="ul" className="…">{items.map(x => <AnimatedItem as="li" key={x.id}>…</AnimatedItem>)}</AnimatedList>
// Bildiriş/lent siyahısı: yeni element yayla gəlir, silinən qısa çıxır, qalanlar yerə
// hamar sürüşür (layout, domMax tənbəl). Mount anında olanlar animasiyasızdır (initial={false}).
// Toast üçün: role="status" / aria-live valideyndə qalsın (bu komponent semantika əlavə etmir).
// ═══════════════════════════════════════════════════════
import { forwardRef } from 'react'
import { AnimatePresence } from 'motion/react'
import LayoutFeatures from './LayoutFeatures'
import { mTag } from './tags'
import { SPRING, exitT, DUR } from './presets'

export function AnimatedList({ as = 'ul', children, ...rest }) {
  const Tag = mTag(as)
  return (
    <LayoutFeatures>
      <Tag data-wow-off="" {...rest}>
        <AnimatePresence initial={false} mode="popLayout">{children}</AnimatePresence>
      </Tag>
    </LayoutFeatures>
  )
}

export const AnimatedItem = forwardRef(function AnimatedItem({ as = 'li', from = 'bottom', children, ...rest }, ref) {
  const Tag = mTag(as)
  const y = from === 'top' ? -14 : 14
  return (
    <Tag ref={ref} layout="position" initial={{ opacity: 0, y, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING.bouncy }}
      exit={{ opacity: 0, scale: 0.96, transition: exitT(DUR.sm) }} {...rest}>
      {children}
    </Tag>
  )
})

export default AnimatedList
