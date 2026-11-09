// ═══════════════════════════════════════════════════════
// Kart → dialoq "morph" (layoutId, domMax tənbəl). Mövcud ReaderDialog ilə işləyir
// (fokus tələsi, Esc, Geri düyməsi, sürüşmə kilidi ReaderDialog-dadır):
//
//   <ExpandableGroup>
//     {items.map(it => (
//       <ExpandableCard key={it.id} id={it.id} as="button" className="ui-card" onClick={() => setOpen(it.id)}>…</ExpandableCard>
//     ))}
//     <ReaderDialog open={!!open} layoutId={open ? morphId(open) : undefined} … />
//   </ExpandableGroup>
//
// • Kart və pəncərə eyni layoutId daşıyır → açılanda kart pəncərəyə "böyüyür", bağlananda geri qayıdır.
// • Hərəkəti azalt → layoutId verilmir (adi açılış). Telefonda (≤767px) morph yox — ReaderDialog-un
//   öz aşağıdan qalxması daha təbiidir.
// • Kartın kliklənən semantikası sənindir: as="button" və ya içində <a>/<button>.
// ═══════════════════════════════════════════════════════
import { forwardRef } from 'react'
import { LayoutGroup } from 'motion/react'
import LayoutFeatures from './LayoutFeatures'
import { mTag } from './tags'
import { SPRING } from './presets'
import { useReduced } from './reduced'
import useMedia from '../hooks/useMedia'

export const morphId = (id) => `mo-xc-${id}`

/** layoutId-ni yalnız morph mümkün olanda qaytarır (dialoq tərəfində də istifadə et) */
export function useMorphId(id) {
  const reduced = useReduced()
  const phone = useMedia('(max-width: 767.98px)', false)
  return reduced || phone || id == null ? undefined : morphId(id)
}

export function ExpandableGroup({ id = 'mo-xc', children }) {
  return (
    <LayoutFeatures>
      <LayoutGroup id={id}>{children}</LayoutGroup>
    </LayoutFeatures>
  )
}

export const ExpandableCard = forwardRef(function ExpandableCard({ id, as = 'div', children, ...rest }, ref) {
  const Tag = mTag(as)
  const layoutId = useMorphId(id)
  return (
    <Tag ref={ref} layoutId={layoutId} transition={SPRING.soft} data-wow-off="" data-no-morph="" {...(as === 'button' && !rest.type ? { type: 'button' } : {})} {...rest}>
      {children}
    </Tag>
  )
})

export default ExpandableCard
