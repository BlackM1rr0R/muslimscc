// ═══════════════════════════════════════════════════════
// <ScrollProgress target={articleRef} /> — oxu irəliləyişi zolağı (scaleX, yay ilə hamar).
// target verilməsə — bütün səhifə (DİQQƏT: səhifənin yuxarısında wow.js-in öz qlobal zolağı
// var; ikisini birlikdə qoyma — bunu uzun məqalə/dialoq daxilində işlət: container prop).
//   props: target (ref, element boyu irəliləyiş), container (ref, sürüşən qutu), fixed=false,
//          className. Dekordur (aria-hidden) — mövqe məlumatı lazımdırsa ayrıca mətn ver.
// ═══════════════════════════════════════════════════════
import { m, useScroll, useSpring } from 'motion/react'
import { useReduced } from './reduced'

export default function ScrollProgress({ target, container, fixed = false, className = '' }) {
  const reduced = useReduced()
  const { scrollYProgress } = useScroll({
    ...(target ? { target, offset: ['start start', 'end end'] } : {}),
    ...(container ? { container } : {}),
  })
  const smooth = useSpring(scrollYProgress, { stiffness: 200, damping: 34, restDelta: 0.001 })
  return (
    <m.div className={`mo-progress${fixed ? ' is-fixed' : ''}${className ? ` ${className}` : ''}`} aria-hidden="true"
      style={{ scaleX: reduced ? scrollYProgress : smooth }} />
  )
}
