// ═══════════════════════════════════════════════════════
// KhatmGlobe — "Ümmətin Canlı Xətmi" vizualı: mərkəzində Kəbə olan Yer kürəsi + 604 bölməli qızıl halqa
//
// • QiblaGlobe ilə eyni yanaşma: d3-geo ortoqrafik proyeksiya, canvas 2D (WebGL/three.js yox),
//   quru — world-atlas land-110m (yalnız bu komponent yüklənəndə; /khatm səhifəsində tənbəl).
// • Halqanın hər bölməsi Mushafın bir səhifəsidir (yuxarıdan saat əqrəbi istiqamətində 1 → 604);
//   oxunan səhifə qızılı parlayır.
// • Canlı oxunuşda: oxucunun 1°-lik xanası məlumdursa, oradan Kəbəyə işıq qövsü axır (~1.6 s);
//   yeni bölmə qısa müddət parlaq yanır.
// • ÇƏKİLİŞ TƏLƏBLƏ: hər kadr yox — yalnız vəziyyət dəyişəndə, ölçü/tema dəyişəndə, fırladanda və
//   qısa animasiyalar müddətində (əvvəlki dərs: hər kadr çəkilən qlobus telefonda düyməni qeyri-sabit edirdi).
// • Hərəkət azaldılıbsa — qövs və parıltı yoxdur, yalnız halqa dolur.
// • Klaviatura: oxlarla fırlatmaq; canvas role="img" + aria-label (oxunan bölmə sayı).
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { geoOrthographic, geoPath, geoGraticule10, geoInterpolate, geoDistance } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import { useReduced } from '../../motion/reduced'

const KAABA = [39.8262, 21.4225]
const TOTAL = 604
const ARC_MS = 1600
const FLASH_MS = 1400

let landCache = null
function loadLand() {
  if (!landCache) landCache = fetch(landUrl).then((r) => r.json()).then((topo) => feature(topo, topo.objects.land))
  return landCache
}
const lit = (bits, p) => Boolean(bits) && ((bits[(p - 1) >> 3] >> ((p - 1) & 7)) & 1) === 1
const ease = (t) => 1 - Math.pow(1 - t, 3)

/**
 * bits    — Uint8Array (səhifə p → bit p-1)
 * pulse   — { seq, page, cell?: { lat, lon } } — son canlı oxunuş (seq dəyişəndə animasiya)
 * label   — aria-label
 */
export default function KhatmGlobe({ bits, readCount = 0, pulse = null, label = '' }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const [land, setLand] = useState(null)
  const reduced = useReduced('decor')
  const api = useRef(null)

  useEffect(() => { let on = true; loadLand().then((l) => { if (on) setLand(l) }, () => { if (on) setLand(false) }); return () => { on = false } }, [])

  // Çəkiliş mühərriki — bir dəfə qurulur; məlumat ref ilə ötürülür
  useEffect(() => {
    const cv = canvasRef.current, wrap = wrapRef.current
    if (!cv || !wrap) return undefined
    const s = { rot: [-KAABA[0], -KAABA[1] * 0.55], size: 0, dpr: 1, colors: null, bits: null, land: null, arcs: [], flashes: [], raf: 0, drag: null, reduced: false }
    const proj = geoOrthographic().clipAngle(90).precision(0.5)
    const graticule = geoGraticule10()

    const readColors = () => {
      const cs = getComputedStyle(wrap)
      const v = (n, f) => cs.getPropertyValue(n).trim() || f
      s.colors = {
        ocean: v('--kg-ocean', '#dfeef0'), ocean2: v('--kg-ocean-2', '#b7d6dc'), land: v('--kg-land', '#9cc7a6'), landEdge: v('--kg-land-edge', '#6aa07a'),
        line: v('--kg-line', 'rgba(0,0,0,.12)'), ring: v('--kg-ring', 'rgba(150,120,60,.22)'), gold: v('--kg-gold', '#c9a24e'), glow: v('--kg-glow', '#f3d68c'),
      }
    }
    function draw(t = performance.now()) {
      const { size, dpr, colors } = s
      if (!size || !colors) return
      const ctx = cv.getContext('2d')
      const cx = size / 2, cy = size / 2
      const R = size / 2 - 6
      const ringOuter = R, ringInner = R * 0.86, ringMid = (ringOuter + ringInner) / 2, ringW = ringOuter - ringInner
      const r = ringInner * 0.86
      proj.rotate(s.rot).scale(r).translate([cx, cy])
      const path = geoPath(proj, ctx)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)
      // Okean
      const oc = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r)
      oc.addColorStop(0, colors.ocean); oc.addColorStop(1, colors.ocean2)
      ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = oc; ctx.fill()
      ctx.beginPath(); path(graticule); ctx.strokeStyle = colors.line; ctx.lineWidth = 0.6; ctx.stroke()
      if (s.land) { ctx.beginPath(); path(s.land); ctx.fillStyle = colors.land; ctx.fill(); ctx.strokeStyle = colors.landEdge; ctx.lineWidth = 0.6; ctx.stroke() }

      // Halqa: 604 bölmə
      const step = (Math.PI * 2) / TOTAL
      const gap = Math.min(step * 0.28, 0.004)
      const seg = (p) => { const a0 = -Math.PI / 2 + (p - 1) * step + gap / 2; return [a0, a0 + step - gap] }
      ctx.lineCap = 'butt'
      ctx.lineWidth = ringW
      ctx.beginPath()
      for (let p = 1; p <= TOTAL; p++) if (!lit(s.bits, p)) { const [a0, a1] = seg(p); ctx.moveTo(cx + Math.cos(a0) * ringMid, cy + Math.sin(a0) * ringMid); ctx.arc(cx, cy, ringMid, a0, a1) }
      ctx.strokeStyle = colors.ring; ctx.stroke()
      ctx.beginPath()
      for (let p = 1; p <= TOTAL; p++) if (lit(s.bits, p)) { const [a0, a1] = seg(p); ctx.moveTo(cx + Math.cos(a0) * ringMid, cy + Math.sin(a0) * ringMid); ctx.arc(cx, cy, ringMid, a0, a1) }
      ctx.save(); ctx.shadowColor = colors.glow; ctx.shadowBlur = 6; ctx.strokeStyle = colors.gold; ctx.stroke(); ctx.restore()
      // İncə kənar xətləri
      ctx.lineWidth = 1; ctx.strokeStyle = colors.ring
      ctx.beginPath(); ctx.arc(cx, cy, ringOuter + 2, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx, cy, ringInner - 2, 0, Math.PI * 2); ctx.stroke()

      // Yeni bölmələrin parıltısı
      s.flashes = s.flashes.filter((f) => t - f.t0 < FLASH_MS)
      for (const f of s.flashes) {
        const k = 1 - (t - f.t0) / FLASH_MS
        const [a0, a1] = seg(f.page)
        ctx.save(); ctx.globalAlpha = k; ctx.shadowColor = colors.glow; ctx.shadowBlur = 18; ctx.strokeStyle = colors.glow; ctx.lineWidth = ringW + 6 * k
        ctx.beginPath(); ctx.arc(cx, cy, ringMid, a0 - step, a1 + step); ctx.stroke(); ctx.restore()
      }

      // Oxucudan Kəbəyə işıq
      s.arcs = s.arcs.filter((a) => t - a.t0 < ARC_MS + 400)
      for (const a of s.arcs) {
        const k = Math.min(1, (t - a.t0) / ARC_MS)
        const e = ease(k)
        const fade = t - a.t0 > ARC_MS ? 1 - (t - a.t0 - ARC_MS) / 400 : 1
        const n = 48, pts = []
        for (let i = 0; i <= n * e; i++) pts.push(a.interp(i / n))
        pts.push(a.interp(e))
        ctx.save(); ctx.globalAlpha = Math.max(0, fade)
        ctx.beginPath(); path({ type: 'LineString', coordinates: pts })
        ctx.strokeStyle = colors.glow; ctx.lineWidth = 5; ctx.globalAlpha *= 0.3; ctx.lineCap = 'round'; ctx.stroke()
        ctx.globalAlpha = Math.max(0, fade); ctx.lineWidth = 1.8; ctx.strokeStyle = colors.gold; ctx.stroke()
        const head = a.interp(e)
        if (geoDistance(head, [-s.rot[0], -s.rot[1]]) < Math.PI / 2) {
          const [x, y] = proj(head)
          const g = ctx.createRadialGradient(x, y, 0, x, y, 9)
          g.addColorStop(0, 'rgba(255,244,210,0.95)'); g.addColorStop(1, 'rgba(255,215,120,0)')
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill()
        }
        ctx.restore()
      }

      // Kəbə
      if (geoDistance(KAABA, [-s.rot[0], -s.rot[1]]) < Math.PI / 2) {
        const [x, y] = proj(KAABA)
        ctx.save(); ctx.translate(x, y)
        ctx.shadowColor = colors.glow; ctx.shadowBlur = 10
        ctx.fillStyle = '#1b1b1b'; ctx.fillRect(-6, -6, 12, 12)
        ctx.shadowBlur = 0; ctx.strokeStyle = colors.gold; ctx.lineWidth = 1.6; ctx.strokeRect(-6, -6, 12, 12)
        ctx.fillStyle = colors.gold; ctx.fillRect(-6, -2.5, 12, 2)
        ctx.restore()
      }
    }
    // Animasiya yalnız qövs / parıltı varkən; sonra dayanır
    const loop = (t) => {
      s.raf = 0
      draw(t)
      if (s.arcs.length || s.flashes.length) s.raf = requestAnimationFrame(loop)
      else draw()
    }
    const request = () => { if (!s.raf) s.raf = requestAnimationFrame(loop) }
    const resize = () => {
      const w = Math.max(200, Math.min(wrap.clientWidth, 560))
      if (w === s.size) return
      s.dpr = Math.min(2, window.devicePixelRatio || 1)
      s.size = w
      cv.width = Math.round(w * s.dpr); cv.height = Math.round(w * s.dpr)
      cv.style.width = `${w}px`; cv.style.height = `${w}px`
      draw()
    }
    readColors()
    resize()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    ro?.observe(wrap)
    const mo = new MutationObserver(() => { readColors(); draw() })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })

    const down = (e) => { s.drag = { x: e.clientX, y: e.clientY, rot: [...s.rot] }; cv.setPointerCapture?.(e.pointerId) }
    const move = (e) => {
      if (!s.drag) return
      const k = 180 / s.size
      s.rot = [s.drag.rot[0] + (e.clientX - s.drag.x) * k, Math.max(-80, Math.min(80, s.drag.rot[1] - (e.clientY - s.drag.y) * k))]
      request()
    }
    const up = () => { s.drag = null }
    const key = (e) => {
      const d = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] }[e.key]
      if (!d) return
      e.preventDefault()
      s.rot = [s.rot[0] + d[0], Math.max(-80, Math.min(80, s.rot[1] + d[1]))]
      request()
    }
    cv.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    cv.addEventListener('keydown', key)

    api.current = {
      set(next) { Object.assign(s, next); request() },
      pulse(p) {
        if (s.reduced) { request(); return }
        const t0 = performance.now()
        if (p.page) s.flashes.push({ page: p.page, t0 })
        if (p.cell && Number.isFinite(p.cell.lat) && Number.isFinite(p.cell.lon)) s.arcs.push({ t0, interp: geoInterpolate([p.cell.lon, p.cell.lat], KAABA) })
        if (s.arcs.length > 12) s.arcs.splice(0, s.arcs.length - 12)
        request()
      },
    }
    return () => {
      cancelAnimationFrame(s.raf); s.raf = 0
      ro?.disconnect(); mo.disconnect()
      cv.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up); cv.removeEventListener('keydown', key)
      api.current = null
    }
  }, [])

  useEffect(() => { api.current?.set({ bits, land: land || null, reduced }) }, [bits, land, reduced])
  useEffect(() => { if (pulse && pulse.seq) api.current?.pulse(pulse) }, [pulse])

  return (
    <div className="kg-wrap" ref={wrapRef}>
      <canvas ref={canvasRef} className="kg-canvas" role="img" aria-label={label} tabIndex={0}
        data-testid="khatm-ring" data-read={readCount} data-last={pulse?.page || undefined} />
    </div>
  )
}
