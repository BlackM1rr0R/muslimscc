// ═══════════════════════════════════════════════════════
// <PressedGlide containerRef={ref} deps={[value]} /> — mövcud aria-pressed çip/düymə
// qrupunda (süzgəclər) seçilmiş elementin arxasında YAYLA sürüşən hap (21st.dev
// "animated tabs" ideyası, öz kodumuz). Semantika dəyişmir: düymələr aria-pressed qalır
// (testlər və ekran oxuyucu üçün), yalnız vizual göstərici əlavə olunur.
// • Yalnız transform (x/y) + opacity; ölçü dərhal qoyulur (en animasiya olunmur).
// • Çox sətrə bölünən çiplərdə də işləyir (x və y). İlk ölçüdə yerində doğulur.
// • Hərəkəti azalt → hap ani keçir (MotionConfig reducedMotion).
// • Konteyner position: relative; CSS: `.pfx-glide` (pagefx.css) + səhifə öz düyməsinin
//   seçilmiş fonunu `[data-glide-on] > [aria-pressed="true"]` ilə şəffaf edir.
//   props: containerRef, selector='[aria-pressed="true"]', deps, className
// ═══════════════════════════════════════════════════════
import { useLayoutEffect, useState } from 'react'
import { m } from 'motion/react'
import { SPRING } from '../../motion/presets'
import './pagefx.css'

function offsetIn(el, box) {
  let x = 0, y = 0, n = el
  while (n && n !== box) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent }
  return n === box ? { x, y } : null
}

export default function PressedGlide({ containerRef, selector = '[aria-pressed="true"]', deps = [], className = '' }) {
  const [st, setSt] = useState({ on: false, x: 0, y: 0, w: 0, h: 0, jump: true })
  useLayoutEffect(() => {
    const box = containerRef.current
    if (!box) return undefined
    const measure = () => {
      const a = box.querySelector(selector)
      const o = a && a.offsetWidth ? offsetIn(a, box) : null
      if (!o) {
        box.removeAttribute('data-glide-on')
        setSt(p => (p.on ? { ...p, on: false, jump: true } : p))
        return
      }
      box.setAttribute('data-glide-on', '')
      setSt(p => (p.on && p.x === o.x && p.y === o.y && p.w === a.offsetWidth && p.h === a.offsetHeight
        ? p : { on: true, x: o.x, y: o.y, w: a.offsetWidth, h: a.offsetHeight, jump: !p.on }))
    }
    measure()
    if (typeof ResizeObserver !== 'function') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    return () => ro.disconnect()
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <m.span aria-hidden="true" className={`pfx-glide${className ? ` ${className}` : ''}`} initial={false}
      style={{ width: st.w, height: st.h }}
      animate={{ x: st.x, y: st.y, opacity: st.on ? 1 : 0 }}
      transition={st.jump ? { duration: 0 } : { ...SPRING.snappy, opacity: { duration: 0.15 } }} />
  )
}
