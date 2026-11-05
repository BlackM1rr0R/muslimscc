// ═══════════════════════════════════════════════════════
// QiblaGlobe — fırladıla bilən Yer kürəsi: sizin yerinizdən Kəbəyə ən qısa yol
//
//   <QiblaGlobe from={{ lat, lon }} kaaba={{ lat, lon }} lang="az" distanceKm={2134} />
//
// • d3-geo ortoqrafik proyeksiya (üfüqdə düzgün kəsmə), canvas 2D — WebGL/three.js yox.
// • Quru: world-atlas land-110m (Natural Earth, ictimai mülkiyyət) — yalnız bu
//   komponent yüklənəndə gəlir (Vite ?url aktivi).
// • Böyük dairə qövsü (ən qısa yol) çəkilərək görünür, üzərindən işıq "axır".
// • Barmaq / siçanla fırlanır; klaviatura: oxlar. Hərəkət azaldılıbsa / zəif
//   cihazda — statik (yalnız sürüşdürəndə yenidən çəkilir).
// • Animasiya yalnız qlobus ekrandadırsa işləyir (IntersectionObserver).
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { geoOrthographic, geoPath, geoGraticule10, geoInterpolate, geoDistance } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import '../styles/QiblaGlobe.css'

const TXT = {
  az: { title: 'Qibləyə ən qısa yol', lead: 'Qiblə istiqaməti Yer kürəsi üzərində Kəbəyə gedən ən qısa yoldur (böyük dairə) — xəritədəki düz xətt deyil.', drag: 'Qlobusu barmaqla və ya siçanla fırladın', you: 'Siz', kaaba: 'Kəbə', km: 'km', label: 'Sizin yerinizdən Kəbəyə ən qısa yolu göstərən Yer kürəsi' },
  en: { title: 'The shortest path to the qibla', lead: 'The qibla direction is the shortest path to the Kaaba over the globe (a great circle) — not a straight line on a flat map.', drag: 'Rotate the globe with your finger or mouse', you: 'You', kaaba: 'Kaaba', km: 'km', label: 'A globe showing the shortest path from your location to the Kaaba' },
  ru: { title: 'Кратчайший путь к кибле', lead: 'Направление киблы — это кратчайший путь к Каабе по поверхности Земли (большой круг), а не прямая линия на плоской карте.', drag: 'Вращайте глобус пальцем или мышью', you: 'Вы', kaaba: 'Кааба', km: 'км', label: 'Глобус с кратчайшим путём от вашего места до Каабы' },
  ar: { title: 'أقصر طريق إلى القبلة', lead: 'اتجاه القبلة هو أقصر طريق إلى الكعبة على سطح الأرض (دائرة عظمى)، وليس خطًا مستقيمًا على خريطة مسطحة.', drag: 'أدِر الكرة الأرضية بإصبعك أو بالفأرة', you: 'أنت', kaaba: 'الكعبة', km: 'كم', label: 'كرة أرضية تُظهر أقصر طريق من موقعك إلى الكعبة' },
  tr: { title: 'Kıbleye en kısa yol', lead: 'Kıble yönü, dünya üzerinde Kâbe’ye giden en kısa yoldur (büyük daire) — düz haritadaki düz çizgi değil.', drag: 'Küreyi parmağınızla veya fareyle döndürün', you: 'Siz', kaaba: 'Kâbe', km: 'km', label: 'Bulunduğunuz yerden Kâbe’ye en kısa yolu gösteren dünya küresi' },
}

// Minlik ayırıcısı: Chrome-da az-AZ məlumatı yoxdur ("2,317") — dillərə görə özümüz
const sepFor = (lang) => (lang === 'tr' ? '.' : lang === 'en' ? ',' : lang === 'ar' ? '\u066c' : '\u00a0')
export const fmtKm = (n, lang) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sepFor(lang))

let landCache = null
function loadLand() {
  if (!landCache) landCache = fetch(landUrl).then(r => r.json()).then(topo => feature(topo, topo.objects.land))
  return landCache
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const reducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion') } catch { return true }
}

export default function QiblaGlobe({ from, kaaba, lang = 'az', distanceKm }) {
  const t = TXT[lang] || TXT.az
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const [land, setLand] = useState(null)
  const [failed, setFailed] = useState(false)
  const state = useRef({ rot: [0, 0], progress: 0, comet: -1, drag: null, raf: 0, visible: true })

  useEffect(() => { loadLand().then(setLand, () => setFailed(true)) }, [])

  useEffect(() => {
    const cv = canvasRef.current
    const wrap = wrapRef.current
    if (!cv || !wrap || !land || !from) return undefined
    const s = state.current
    const A = [from.lon, from.lat]
    const B = [kaaba.lon, kaaba.lat]
    const interp = geoInterpolate(A, B)
    const mid = interp(0.5)
    const target = [-mid[0], -mid[1] * 0.85]
    const start = [-A[0] + 40, -A[1] + 10]
    const reduced = reducedMotion()
    const proj = geoOrthographic().clipAngle(90).precision(0.4)
    const graticule = geoGraticule10()
    let size = 0, dpr = 1, colors = null

    const readColors = () => {
      const cs = getComputedStyle(wrap)
      const v = (n, f) => cs.getPropertyValue(n).trim() || f
      colors = { brand: v('--brand', '#0f5a47'), accent: v('--accent', '#d9b56b'), line: v('--line-strong', '#c9c3b4'), text: v('--text-strong', '#111'),
        ocean: v('--qgl-ocean', '#dfeef0'), ocean2: v('--qgl-ocean-2', '#b7d6dc'), land: v('--qgl-land', '#9cc7a6'), landEdge: v('--qgl-land-edge', '#6aa07a') }
    }
    const resize = () => {
      const w = Math.min(wrap.clientWidth, 520)
      dpr = Math.min(2, window.devicePixelRatio || 1)
      size = w
      cv.width = Math.round(w * dpr); cv.height = Math.round(w * dpr)
      cv.style.width = `${w}px`; cv.style.height = `${w}px`
      draw()
    }

    function draw() {
      if (!size || !colors) return
      const ctx = cv.getContext('2d')
      const r = size / 2 - 14
      proj.rotate(s.rot).scale(r).translate([size / 2, size / 2])
      const path = geoPath(proj, ctx)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)
      // Atmosfer halqası
      const atm = ctx.createRadialGradient(size / 2, size / 2, r * 0.9, size / 2, size / 2, r * 1.12)
      atm.addColorStop(0, 'rgba(120,190,200,0)'); atm.addColorStop(0.55, 'rgba(120,190,200,0.28)'); atm.addColorStop(1, 'rgba(120,190,200,0)')
      ctx.fillStyle = atm; ctx.beginPath(); ctx.arc(size / 2, size / 2, r * 1.12, 0, Math.PI * 2); ctx.fill()
      // Okean
      const oc = ctx.createRadialGradient(size / 2 - r * 0.35, size / 2 - r * 0.4, r * 0.1, size / 2, size / 2, r)
      oc.addColorStop(0, colors.ocean); oc.addColorStop(1, colors.ocean2)
      ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = oc; ctx.fill()
      // Paralel və meridianlar
      ctx.beginPath(); path(graticule); ctx.strokeStyle = colors.line; ctx.globalAlpha = 0.35; ctx.lineWidth = 0.6; ctx.stroke(); ctx.globalAlpha = 1
      // Quru
      ctx.beginPath(); path(land); ctx.fillStyle = colors.land; ctx.fill(); ctx.strokeStyle = colors.landEdge; ctx.lineWidth = 0.6; ctx.stroke()
      // Yol (böyük dairə) — çəkilərək
      if (s.progress > 0) {
        const n = 64, pts = []
        for (let i = 0; i <= n * s.progress; i++) pts.push(interp(i / n))
        if (s.progress < 1) pts.push(interp(s.progress))
        ctx.beginPath(); path({ type: 'LineString', coordinates: pts })
        ctx.strokeStyle = colors.accent; ctx.lineWidth = 6; ctx.globalAlpha = 0.25; ctx.lineCap = 'round'; ctx.stroke()
        ctx.globalAlpha = 1; ctx.lineWidth = 2.4; ctx.stroke()
      }
      // İşıq "kometası" yol boyu
      if (s.comet >= 0) {
        const p = interp(s.comet)
        if (geoDistance(p, [-s.rot[0], -s.rot[1]]) < Math.PI / 2) {
          const [x, y] = proj(p)
          const g = ctx.createRadialGradient(x, y, 0, x, y, 11)
          g.addColorStop(0, 'rgba(255,240,200,0.95)'); g.addColorStop(1, 'rgba(255,215,120,0)')
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill()
        }
      }
      // Nişanlar
      const marker = (pt, kind) => {
        if (geoDistance(pt, [-s.rot[0], -s.rot[1]]) >= Math.PI / 2) return
        const [x, y] = proj(pt)
        if (kind === 'kaaba') {
          ctx.save(); ctx.translate(x, y)
          ctx.fillStyle = '#1b1b1b'; ctx.strokeStyle = colors.accent; ctx.lineWidth = 2
          ctx.fillRect(-6, -6, 12, 12); ctx.strokeRect(-6, -6, 12, 12)
          ctx.fillStyle = colors.accent; ctx.fillRect(-6, -2.5, 12, 2)
          ctx.restore()
        } else {
          ctx.fillStyle = colors.brand; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill()
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
        }
        ctx.font = '600 12px Inter, system-ui, sans-serif'; ctx.fillStyle = colors.text
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
        ctx.fillText(kind === 'kaaba' ? t.kaaba : t.you, x + 11, y - 1)
      }
      marker(A, 'you'); marker(B, 'kaaba')
    }

    // Giriş: başlanğıcdan yolun ortasına "uçuş", sonra yol çəkilir, sonra işıq axır
    readColors()
    resize()
    const t0 = performance.now()
    const loop = (now) => {
      s.raf = 0
      if (!s.visible) return
      const e = now - t0
      if (!s.drag) {
        const k = easeInOut(Math.min(1, e / 1800))
        if (!s.userMoved) s.rot = [start[0] + (target[0] - start[0]) * k, start[1] + (target[1] - start[1]) * k]
      }
      s.progress = Math.min(1, Math.max(0, (e - 700) / 1500))
      s.comet = s.progress >= 1 ? ((e - 2200) % 3200) / 3200 : -1
      draw()
      s.raf = requestAnimationFrame(loop)
    }
    if (reduced) { s.rot = target; s.progress = 1; s.comet = -1; draw() } else s.raf = requestAnimationFrame(loop)

    const io = new IntersectionObserver(([en]) => {
      s.visible = en.isIntersecting
      if (s.visible && !reduced && !s.raf) s.raf = requestAnimationFrame(loop)
    })
    io.observe(cv)
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    const mo = new MutationObserver(() => { readColors(); draw() })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    // Fırlatma (barmaq / siçan)
    const down = (e) => { s.drag = { x: e.clientX, y: e.clientY, rot: [...s.rot] }; s.userMoved = true; cv.setPointerCapture?.(e.pointerId) }
    const move = (e) => {
      if (!s.drag) return
      const k = 180 / size
      s.rot = [s.drag.rot[0] + (e.clientX - s.drag.x) * k, Math.max(-80, Math.min(80, s.drag.rot[1] - (e.clientY - s.drag.y) * k))]
      if (reduced) draw()
    }
    const up = () => { s.drag = null }
    const key = (e) => {
      const d = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] }[e.key]
      if (!d) return
      e.preventDefault(); s.userMoved = true
      s.rot = [s.rot[0] + d[0], Math.max(-80, Math.min(80, s.rot[1] + d[1]))]
      draw()
    }
    cv.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    cv.addEventListener('keydown', key)
    return () => {
      cancelAnimationFrame(s.raf); s.raf = 0
      io.disconnect(); ro.disconnect(); mo.disconnect()
      cv.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up); cv.removeEventListener('keydown', key)
    }
  }, [land, from, kaaba, t])

  if (failed || !from) return null
  return (
    <section className="ui-section ui-section--tight qgl-sec" aria-labelledby="qglobe-title">
      <div className="ui-container qgl-layout">
        <div className="qgl-text">
          <h2 id="qglobe-title" className="ui-title">{t.title}</h2>
          <p className="ui-lead">{t.lead}</p>
          {Number.isFinite(distanceKm) && (
            <p className="qgl-dist"><b className="ui-num">{fmtKm(distanceKm, lang)}</b> {t.km}</p>
          )}
          <p className="qgl-hint">{t.drag}</p>
        </div>
        <div className="qgl-globe" ref={wrapRef}>
          <canvas ref={canvasRef} className="qgl-canvas" role="img" aria-label={t.label} tabIndex={0} />
          {!land && <div className="qgl-skel ui-skeleton" aria-hidden="true" />}
        </div>
      </div>
    </section>
  )
}
