// ═══════════════════════════════════════════════════════
// <Swap swapKey={k} variant="slide" dir={1}> — PresenceSwap ilə eyni, amma "hərəkəti azalt"
// açıq olanda (sistem və ya panel) heç bir keçid YOXDUR: köhnə məzmun dərhal yenisi ilə
// əvəzlənir. (MotionConfig reducedMotion yalnız transform-u söndürür, opacity keçidi
// qalırdı — axe/ekran oxuyucu yarımşəffaf köhnə paneli görürdü.)
// ═══════════════════════════════════════════════════════
import PresenceSwap from '../../motion/PresenceSwap'
import { useReduced } from '../../motion/reduced'

export default function Swap({ as: Tag = 'div', swapKey, variant, dir, mode, children, ...rest }) {
  const reduced = useReduced()
  if (reduced) return <Tag {...rest}>{children}</Tag>
  return <PresenceSwap as={Tag} swapKey={swapKey} variant={variant} dir={dir} mode={mode} {...rest}>{children}</PresenceSwap>
}
