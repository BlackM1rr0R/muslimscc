// ═══════════════════════════════════════════════════════
// SegPill (dizayn v6, src/motion) — seqment / süzgəc qrupunda seçilmiş "hap"
// düymədən düyməyə yayla sürüşür (21st.dev "animated tabs" ideyası, öz kodumuz).
// Semantika dəyişmir: düymələr aria-pressed qrupu olaraq qalır.
//
//   <SegGroup id="qp-views">
//     <div className="ui-segmented seg-pill-host" role="group">
//       {items.map(v => <button aria-pressed={on}><SegPill on={on} />…</button>)}
//     </div>
//   </SegGroup>
//
// • layoutId → domMax (LayoutFeatures, tənbəl). Xüsusiyyətlər gələnə qədər hap
//   adi span kimi yerində görünür (prerender / JS-siz düzgün).
// • Hərəkəti azalt → MotionProvider (reducedMotion) hapı dərhal yerinə qoyur.
// • Stil: SegPill.css (.seg-pill-host / .seg-pill; .seg-line-host / .seg-pill--line).
//   İstifadə: Quran, Zikr, Dua dəftəri səhifələri.
// ═══════════════════════════════════════════════════════
import { LayoutGroup, m } from 'motion/react'
import LayoutFeatures from '../../motion/LayoutFeatures'
import { SPRING } from '../../motion/presets'
import './SegPill.css'

export function SegGroup({ id, children }) {
  return (
    <LayoutFeatures>
      <LayoutGroup id={id}>{children}</LayoutGroup>
    </LayoutFeatures>
  )
}

/** variant: 'pill' (seqment fonu, .seg-pill-host) | 'line' (sekmə alt xətti, .seg-line-host) */
export function SegPill({ on, variant = 'pill', className = '' }) {
  if (!on) return null
  const cls = variant === 'line' ? 'seg-pill--line' : 'seg-pill'
  return <m.span layoutId="seg-pill" className={`${cls}${className ? ` ${className}` : ''}`} transition={SPRING.snappy} aria-hidden="true" />
}

export default SegPill
