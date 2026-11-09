// ═══════════════════════════════════════════════════════
// <Stagger> + <StaggerItem> — uşaqlar növbə ilə açılır (30–60 ms addım, max-dan sonra gözləmədən).
//   <Stagger as="ul" className="ui-tiles" step={0.045} variant="scaleIn">
//     {items.map(x => <StaggerItem as="li" key={x.id}>…</StaggerItem>)}
//   </Stagger>
// Konteyner görünəndə açılır (useEntrance); StaggerItem vəziyyəti valideyndən miras alır.
// ═══════════════════════════════════════════════════════
import { createContext, useContext, useMemo, useRef } from 'react'
import { mTag } from './tags'
import { staggerContainer } from './presets'
import useEntrance from './useEntrance'
import { variantFor } from './Reveal'

const Ctx = createContext('fadeUp')

export function Stagger({ as = 'div', step = 0.05, delay = 0, max = 10, variant = 'fadeUp', margin, children, ...rest }) {
  const ref = useRef(null)
  const phase = useEntrance(ref, { margin })
  const Tag = mTag(as)
  const variants = useMemo(() => staggerContainer(step, delay, max), [step, delay, max])
  return (
    <Ctx.Provider value={variant}>
      <Tag ref={ref} data-wow-off="" initial={false} variants={variants} animate={phase === 'hidden' ? 'hidden' : 'show'} {...rest}>
        {children}
      </Tag>
    </Ctx.Provider>
  )
}

export function StaggerItem({ as = 'div', variant, children, ...rest }) {
  const inherited = useContext(Ctx)
  const Tag = mTag(as)
  return <Tag variants={variantFor(variant || inherited)} {...rest}>{children}</Tag>
}

export default Stagger
