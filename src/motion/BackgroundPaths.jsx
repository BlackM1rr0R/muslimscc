// ═══════════════════════════════════════════════════════
// <BackgroundPaths count={18} tone="gold" /> — fonda yavaş axan incə SVG xətlər (dekor, aria-hidden).
// Valideyn position: relative olmalıdır; komponent inset:0 ilə bütün sahəni tutur, kliki ötürür.
// • Aşağı CPU: xətlər bir dəfə çəkilir; dövri hərəkət yalnız iki <svg> qatının transform-u
//   (kompozitor). Ekrandan kənarda / tab gizli → pauza. Hərəkəti azalt ('decor') → statik.
// • İlk kadrda görünməz (opacity 0) → yumşaq çıxır: LCP elementi deyil.
//   props: count (≤32), tone 'brand'|'gold'|'muted', className, density (0.6…1.4)
// ═══════════════════════════════════════════════════════
import { memo, useMemo, useRef } from 'react'
import { useReduced } from './reduced'
import useOffscreenPause from './useOffscreenPause'
import { flowPath } from './format'

const Layer = memo(function Layer({ n, offset, className }) {
  return (
    <svg className={className} viewBox="0 0 1200 400" preserveAspectRatio="none" focusable="false">
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={flowPath(i + offset, n * 2)} pathLength="1" style={{ '--pi': i, '--po': (0.08 + 0.32 * ((i * 7) % n) / n).toFixed(2) }} />
      ))}
    </svg>
  )
})

export default function BackgroundPaths({ count = 18, tone = 'gold', className = '' }) {
  const ref = useRef(null)
  const decorOff = useReduced('decor')
  const running = useOffscreenPause(ref)
  const n = Math.max(4, Math.min(32, Math.round(count / 2)))
  const layers = useMemo(() => [0, n], [n])
  return (
    <div ref={ref} aria-hidden="true" className={`mo-paths mo-paths--${tone}${decorOff ? ' is-static' : ''}${running ? '' : ' is-paused'}${className ? ` ${className}` : ''}`}>
      <Layer n={n} offset={layers[0]} className="mo-paths__l mo-paths__l--a" />
      <Layer n={n} offset={layers[1]} className="mo-paths__l mo-paths__l--b" />
    </div>
  )
}
