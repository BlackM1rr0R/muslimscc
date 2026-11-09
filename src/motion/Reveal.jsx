// ═══════════════════════════════════════════════════════
// <Reveal> — görünüş sahəsinə girəndə BİR dəfə açılır (fadeUp | fadeIn | blurIn | scaleIn | slideStart).
// Prerender/ilk açılış təhlükəsiz: useEntrance (məzmun yalnız ekrandan kənarda və ya
// mount-dan dərhal sonra gizlədilir). wow.js-in qlobal girişi bu elementə toxunmur (data-wow-off).
//   <Reveal as="section" variant="blurIn" delay={0.1}>…</Reveal>
// ═══════════════════════════════════════════════════════
import { forwardRef, useRef } from 'react'
import { mTag } from './tags'
import { pickVariant, slideStart } from './presets'
import useEntrance from './useEntrance'
import { isFinePointer } from './reduced'

const flipX = (v) => ({ ...v, hidden: { ...v.hidden, x: -v.hidden.x }, exit: { ...v.exit, x: -v.exit.x } })

export function variantFor(name) {
  const coarse = typeof window !== 'undefined' && !isFinePointer()
  const v = pickVariant(name, { coarse })
  const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl'
  return v === slideStart && rtl ? flipX(v) : v
}

const Reveal = forwardRef(function Reveal({ as = 'div', variant = 'fadeUp', delay = 0, duration, margin, children, ...rest }, outer) {
  const inner = useRef(null)
  const phase = useEntrance(inner, { margin })
  const Tag = mTag(as)
  const setRef = (el) => {
    inner.current = el
    if (typeof outer === 'function') outer(el); else if (outer) outer.current = el
  }
  return (
    <Tag ref={setRef} data-wow-off="" initial={false} variants={variantFor(variant)}
      animate={phase === 'hidden' ? 'hidden' : 'show'} custom={{ delay, duration }} {...rest}>
      {children}
    </Tag>
  )
})
export default Reveal
