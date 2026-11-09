// ═══════════════════════════════════════════════════════
// <LimelightNav items={[{ key, label, href, onClick, icon }]} current="quran" label="Əsas bölmələr" />
// Üfüqi naviqasiya: aktiv bəndin üstündə "projektor" — nazik qızılı zolaq + aşağı düşən
// yumşaq işıq konusu; bənddən bəndə YAYLA sürüşür (21st.dev "limelight nav" ideyası).
// • Yalnız transform (x + scaleX) — domAnimation kifayətdir (layout/domMax lazım deyil).
// • İlk ölçüdə yerində doğulur (initial={false}); Motion yüklənməyibsə də keçid düzgündür.
// • Linklər <a href> (Ctrl/orta klik yeni tab); aria-current="page". Hərəkəti azalt → ani.
//   props: items, current, label, className, linkClassName, ariaCurrent='page', navRef
// ═══════════════════════════════════════════════════════
import { useLayoutEffect, useRef, useState } from 'react'
import { m } from 'motion/react'
import { SPRING } from './presets'

const BASE_W = 100   // indikatorun öz eni (px) — scaleX = bəndin eni / BASE_W

export function useSlideIndicator(boxRef, selector, deps, axis = 'x') {
  const [ind, setInd] = useState({ pos: 0, size: 0, on: false })
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return undefined
    const measure = () => {
      const a = box.querySelector(selector)
      if (!a || !a.offsetWidth) { setInd(p => (p.on ? { ...p, on: false } : p)); return }
      const pos = axis === 'x' ? a.offsetLeft : a.offsetTop
      const size = axis === 'x' ? a.offsetWidth : a.offsetHeight
      setInd(p => (p.pos === pos && p.size === size && p.on ? p : { pos, size, on: true }))
    }
    measure()
    if (typeof ResizeObserver !== 'function') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    return () => ro.disconnect()
  }, deps)  // eslint-disable-line react-hooks/exhaustive-deps
  return ind
}

export default function LimelightNav({ items = [], current, label, className = '', linkClassName = '', ariaCurrent = 'page', navRef, ...rest }) {
  const own = useRef(null)
  const box = navRef || own
  const ind = useSlideIndicator(box, '[data-limelight-on]', [current, items.length])
  return (
    <nav ref={box} aria-label={label} className={`mo-lime${className ? ` ${className}` : ''}`} {...rest}>
      <m.span className="mo-lime__light" aria-hidden="true" initial={false}
        animate={{ x: ind.pos + ind.size / 2 - BASE_W / 2, scaleX: Math.max(0.2, ind.size / BASE_W), opacity: ind.on ? 1 : 0 }}
        transition={SPRING.snappy} style={{ width: BASE_W }} />
      {items.map((it) => {
        const on = it.key === current
        return (
          <a key={it.key} href={it.href} onClick={it.onClick} aria-current={on ? ariaCurrent : undefined}
            data-limelight-on={on ? '' : undefined} className={`mo-lime__link${on ? ' active' : ''}${linkClassName ? ` ${linkClassName}` : ''}`}>
            {it.icon}{it.label}
          </a>
        )
      })}
    </nav>
  )
}
