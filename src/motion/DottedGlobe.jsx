// ═══════════════════════════════════════════════════════
// <DottedGlobe size={320} label="Məkkə — Qiblə istiqaməti" /> — nöqtəli fırlanan qlobus
// (canvas 2D), vurğulanan nöqtə (susmaya görə Məkkə) yumşaq "nəbz" halqası ilə.
// • Aşağı CPU: ~520 nöqtə, ≤30 kadr/san, DPR ≤2; ekrandan kənarda / tab gizli → dayanır.
// • Hərəkəti azalt ('decor') → bir statik kadr, vurğulanan nöqtə mərkəzdə.
// • Rənglər saytın tokenlərindən (--brand, --accent, --text-tertiary) — qaranlıq rejimdə də.
// • role="img" + aria-label (label prop). Dekordursa label={null} → aria-hidden.
//   props: size (px, CSS-də max-width:100%), points, highlight {lat, lon}, speed (°/s), tilt (°),
//          land=false (yalnız sfera nöqtələri — xəritə məlumatı yüklənmir), className
// ═══════════════════════════════════════════════════════
import { useEffect, useRef } from 'react'
import { spherePoints, projectPoint, MAKKAH } from './format'
import { useReduced } from './reduced'
import useOffscreenPause from './useOffscreenPause'

const css = (el, name, fb) => (getComputedStyle(el).getPropertyValue(name).trim() || fb)

export default function DottedGlobe({ size = 320, points = 520, highlight = MAKKAH, speed = 6, tilt = 18, label, className = '' }) {
  const ref = useRef(null)
  const lonRef = useRef(null)   // fırlanma bucağı pauzadan sonra davam etsin
  const wrap = useRef(null)
  const decorOff = useReduced('decor')
  const running = useOffscreenPause(wrap)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return undefined
    const ctx = cv.getContext('2d')
    if (!ctx) return undefined
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const px = Math.round(size * dpr)
    cv.width = px; cv.height = px
    const pts = spherePoints(points)
    const colors = { dot: css(cv, '--text-tertiary', '#8a8f87'), brand: css(cv, '--brand', '#0f766e'), accent: css(cv, '--accent', '#c8a24a') }
    const R = px * 0.44
    const c = px / 2
    let lon0 = lonRef.current ?? highlight.lon - 40     // nöqtə əvvəlcə bir az soldan gəlir
    let raf = 0, last = 0, t0 = performance.now()

    const draw = (now) => {
      ctx.clearRect(0, 0, px, px)
      // Sfera konturu
      ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2)
      ctx.strokeStyle = colors.brand; ctx.globalAlpha = 0.18; ctx.lineWidth = dpr; ctx.stroke()
      ctx.fillStyle = colors.dot
      for (const p of pts) {
        const q = projectPoint(p.lat, p.lon, lon0, tilt)
        if (q.z <= 0) continue
        ctx.globalAlpha = 0.15 + 0.55 * q.z
        const r = (0.6 + 0.9 * q.z) * dpr
        ctx.fillRect(c + q.x * R - r / 2, c + q.y * R - r / 2, r, r)
      }
      const h = projectPoint(highlight.lat, highlight.lon, lon0, tilt)
      if (h.z > 0) {
        const x = c + h.x * R, y = c + h.y * R
        const pulse = decorOff ? 0.5 : ((now - t0) / 1800) % 1
        ctx.globalAlpha = (1 - pulse) * 0.55
        ctx.beginPath(); ctx.arc(x, y, (4 + 14 * pulse) * dpr, 0, Math.PI * 2)
        ctx.strokeStyle = colors.accent; ctx.lineWidth = 1.5 * dpr; ctx.stroke()
        ctx.globalAlpha = 1
        ctx.beginPath(); ctx.arc(x, y, 3.2 * dpr, 0, Math.PI * 2)
        ctx.fillStyle = colors.accent; ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    if (decorOff || !running) {
      if (decorOff) lon0 = highlight.lon
      draw(performance.now())
      return undefined
    }
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      if (now - last < 33) return     // ≤30 kadr/san
      const dt = last ? Math.min(100, now - last) : 16
      last = now
      lon0 += speed * dt / 1000
      lonRef.current = lon0
      draw(now)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [size, points, highlight.lat, highlight.lon, speed, tilt, decorOff, running])

  return (
    <div ref={wrap} className={`mo-globe${className ? ` ${className}` : ''}`} style={{ '--globe': `${size}px` }}>
      <canvas ref={ref} className="mo-globe__cv" width={size} height={size}
        {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' })} />
    </div>
  )
}
