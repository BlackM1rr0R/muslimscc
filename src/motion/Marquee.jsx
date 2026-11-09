// ═══════════════════════════════════════════════════════
// <Marquee label="Dillər" speed={40}>{chips}</Marquee> — sonsuz axan zolaq (yalnız transform).
// • Siçan üstündə / klaviatura fokusu içində — DAYANIR (WAI: auto-rotation-controls).
// • Ekrandan kənarda və tab gizli olanda dayanır. Hərəkəti azalt ('decor', zəif cihaz da) →
//   statik, sətirlərə bölünən siyahı (heç nə gizlənmir, təkrar nüsxə yoxdur).
// • Təkrar nüsxə aria-hidden + inert (fokus ikinci dəfə gəlmir). RTL-də əks istiqamət.
//   props: speed (px/s), reverse, gap (px), label (region aria-label), className, as='div'
// ═══════════════════════════════════════════════════════
import { useLayoutEffect, useRef, useState } from 'react'
import { useReduced } from './reduced'
import useOffscreenPause from './useOffscreenPause'

export default function Marquee({ children, speed = 40, reverse = false, gap = 12, label, className = '' }) {
  const decorOff = useReduced('decor')
  const root = useRef(null)
  const track = useRef(null)
  const running = useOffscreenPause(root)
  const [dur, setDur] = useState(0)
  useLayoutEffect(() => {
    const t = track.current
    if (!t || decorOff) return undefined
    const measure = () => setDur(Math.max(8, (t.scrollWidth / 2) / Math.max(5, speed)))
    measure()
    if (typeof ResizeObserver !== 'function') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(t)
    return () => ro.disconnect()
  }, [speed, decorOff])

  if (decorOff) {
    return <div className={`mo-marquee is-static${className ? ` ${className}` : ''}`} role={label ? 'region' : undefined} aria-label={label} style={{ '--mq-gap': `${gap}px` }}><div className="mo-marquee__group">{children}</div></div>
  }
  return (
    <div ref={root} className={`mo-marquee${reverse ? ' is-reverse' : ''}${running ? '' : ' is-paused'}${className ? ` ${className}` : ''}`}
      role={label ? 'region' : undefined} aria-label={label} data-wow-off=""
      style={{ '--mq-gap': `${gap}px`, '--mq-dur': `${dur || 30}s` }}>
      <div ref={track} className="mo-marquee__track">
        <div className="mo-marquee__group">{children}</div>
        <div className="mo-marquee__group" aria-hidden="true" inert="">{children}</div>
      </div>
    </div>
  )
}
