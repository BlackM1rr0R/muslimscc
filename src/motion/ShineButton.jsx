// ═══════════════════════════════════════════════════════
// <ShineButton variant="primary" size="lg" icon={<Icon name="quran" className="ui-btn__icon" />}>Quran</ShineButton>
// .ui-btn + üstündən bir dəfə keçən işıq zolağı (hover/fokus, yalnız transform) +
// basılanda yay kimi sıxılma (whileTap 0.97). as="a" — link kimi. Hərəkəti azalt → adi düymə.
//   props: as='button'|'a', variant='primary'|'accent'|'secondary', size='sm'|'md'|'lg', icon
// ═══════════════════════════════════════════════════════
import { forwardRef } from 'react'
import { m } from 'motion/react'
import { SPRING } from './presets'

const ShineButton = forwardRef(function ShineButton({ as = 'button', variant = 'primary', size = 'md', icon = null, className = '', children, ...rest }, ref) {
  const Tag = as === 'a' ? m.a : m.button
  const cls = ['ui-btn', `ui-btn--${variant}`, size !== 'md' ? `ui-btn--${size}` : '', 'mo-shine', className].filter(Boolean).join(' ')
  return (
    <Tag ref={ref} className={cls} whileTap={{ scale: 0.97 }} transition={SPRING.snappy} data-motion-own=""
      {...(as === 'button' && !rest.type ? { type: 'button' } : {})} {...rest}>
      {icon}{children}
      <span className="mo-shine__beam" aria-hidden="true" />
    </Tag>
  )
})
export default ShineButton
