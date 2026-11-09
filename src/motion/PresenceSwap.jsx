// ═══════════════════════════════════════════════════════
// <PresenceSwap swapKey={tab} variant="fade|blur|slide" dir={1}>{panel}</PresenceSwap>
// Eyni yerdə məzmun dəyişəndə: köhnə qısa çıxır, sonra yeni gəlir (AnimatePresence mode="wait").
// Çıxış girişdən qısadır (presets.exitT). İlk render animasiyasızdır (initial={false}).
// slide: dir=1 irəli (LTR-də sağdan), -1 geri; RTL-də güzgü. Hərəkəti azalt → ani.
// ═══════════════════════════════════════════════════════
import { AnimatePresence } from 'motion/react'
import { mTag } from './tags'
import { DUR, EASE, enterT, exitDur } from './presets'
import { useReduced } from './reduced'

const VARS = {
  fade: { hidden: { opacity: 0 }, show: { opacity: 1, transition: enterT(DUR.sm) }, exit: { opacity: 0, transition: { duration: exitDur(DUR.sm), ease: EASE.in } } },
  blur: { hidden: { opacity: 0, filter: 'blur(6px)' }, show: { opacity: 1, filter: 'blur(0px)', transition: enterT(DUR.md) }, exit: { opacity: 0, filter: 'blur(4px)', transition: { duration: exitDur(DUR.md), ease: EASE.in } } },
  slide: {
    hidden: (d = 1) => ({ opacity: 0, x: 24 * d }),
    show: { opacity: 1, x: 0, transition: enterT(DUR.md) },
    exit: (d = 1) => ({ opacity: 0, x: -16 * d, transition: { duration: exitDur(DUR.md), ease: EASE.in } }),
  },
}

export default function PresenceSwap({ swapKey, variant = 'fade', dir = 1, as = 'div', mode = 'wait', children, ...rest }) {
  // Hərəkəti azalt: heç bir keçid yox (MotionConfig yalnız transform-u söndürür, opacity
  // keçidi qalırdı — köhnə panel yarımşəffaf görünür, axe kontrast xətası verirdi)
  const reduced = useReduced()
  const Tag = mTag(as)
  if (reduced) {
    const Plain = typeof as === 'string' ? as : 'div'
    return <Plain {...rest}>{children}</Plain>
  }
  const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl'
  const d = (rtl ? -1 : 1) * (dir < 0 ? -1 : 1)
  return (
    <AnimatePresence mode={mode} initial={false} custom={d}>
      <Tag key={swapKey} custom={d} variants={VARS[variant] || VARS.fade} initial="hidden" animate="show" exit="exit" {...rest}>
        {children}
      </Tag>
    </AnimatePresence>
  )
}
