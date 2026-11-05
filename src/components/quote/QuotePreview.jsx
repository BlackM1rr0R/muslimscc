// ═══════════════════════════════════════════════════════
// Canlı önizləmə — PNG ilə EYNİ funksiya (utils/quoteCard → renderCard)
// çəkir. Kanvas çərçivəyə "contain" kimi sığdırılır: ölçü dəyişəndə
// (kvadrat → hekayə) kart çərçivədən çıxmır. Ekran oxuyucusu üçün
// role="img" + tam mətn (aria-label).
//
// motion=true: kart hərəkətli oynayır (utils/quoteMotion → createScene) —
// videoya yazılan kadrların eynisi, döngüdə. Tab gizli olanda rAF özü dayanır.
// ═══════════════════════════════════════════════════════
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { renderCard, ensureFonts } from '../../utils/quoteCard'
import { createScene } from '../../utils/quoteMotion'

// clockRef — video yazılarkən: { current: t | null }. Verilibsə önizləmə öz
// saatı ilə yox, yazılan videonun saatı ilə oynayır (eyni kadrlar görünür).
// audioDur — qiraətli videoda zaman xətti səsə görə qurulur (önizləmə də eyni).
export default function QuotePreview({ card, format, label, onOverflow, swapKey, motion = false, clockRef = null, audioDur = 0, children }) {
  const frameRef = useRef(null)
  const canvasRef = useRef(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [fontTick, setFontTick] = useState(0)

  // Çərçivənin ölçüsü (ResizeObserver) — kartın göstərilən ölçüsü buradan
  useLayoutEffect(() => {
    const el = frameRef.current
    if (!el) return undefined
    const read = () => {
      const r = el.getBoundingClientRect()
      setBox(b => (Math.abs(b.w - r.width) < 0.5 && Math.abs(b.h - r.height) < 0.5 ? b : { w: r.width, h: r.height }))
    }
    read()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', read)
      return () => window.removeEventListener('resize', read)
    }
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Şriftlər gələndə yenidən çək (ilk çəkiliş ehtiyat şriftlə ola bilər)
  useEffect(() => {
    let alive = true
    ensureFonts(card).then(() => { if (alive) setFontTick(t => t + 1) })
    return () => { alive = false }
  // Yalnız mətn sahələri şriftə təsir edir (rəng/format dəyişəndə şrift yenidən yüklənmir)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.ar, card.text, card.ref, card.kicker, card.lang])

  const scale = box.w && box.h ? Math.min(box.w / format.w, box.h / format.h) : 0
  const cssW = Math.max(1, Math.floor(format.w * scale))
  const cssH = Math.max(1, Math.floor(format.h * scale))

  // useLayoutEffect: yeni kanvas (şablon dəyişəndə) boş halda bir kadr da görünməsin
  useLayoutEffect(() => {
    const c = canvasRef.current
    if (!c || !scale) return
    const dpr = Math.min(3, window.devicePixelRatio || 1)
    const pw = Math.round(cssW * dpr), ph = Math.round(cssH * dpr)
    if (c.width !== pw) c.width = pw
    if (c.height !== ph) c.height = ph
    const ctx = c.getContext('2d')
    ctx.setTransform(pw / format.w, 0, 0, ph / format.h, 0, 0)
    // Hərəkətli rejimdə də statik kadr çəkilir: həm sığma yoxlaması üçün,
    // həm də animasiyanın ilk kadrı gələnə qədər boşluq görünməsin
    const res = renderCard(ctx, card, format.w, format.h)
    onOverflow?.(res.overflow)
  }, [card, format, cssW, cssH, scale, fontTick, onOverflow, swapKey])

  // Hərəkətli önizləmə — videodakı kadrların eynisi, döngüdə
  useEffect(() => {
    const c = canvasRef.current
    if (!motion || !c || !scale) return undefined
    const scene = createScene(card, format, { audioDur })
    const ctx = c.getContext('2d')
    let raf = 0
    const start = performance.now()
    const loop = (now) => {
      ctx.setTransform(c.width / format.w, 0, 0, c.height / format.h, 0, 0)
      const ext = clockRef?.current
      scene.draw(ctx, ext != null ? Math.min(ext, scene.total) : ((now - start) / 1000) % scene.total)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      // Dayananda kart tam (statik) görünüşünə qayıtsın
      ctx.setTransform(c.width / format.w, 0, 0, c.height / format.h, 0, 0)
      renderCard(ctx, card, format.w, format.h)
    }
  }, [motion, card, format, cssW, cssH, scale, fontTick, swapKey, clockRef, audioDur])

  return (
    <div className="qg-frame" ref={frameRef}>
      <canvas
        key={swapKey}
        ref={canvasRef}
        className="qg-canvas"
        role="img"
        aria-label={label}
        data-format={format.id}
        style={{ width: `${cssW}px`, height: `${cssH}px` }}
      />
      {children}
    </div>
  )
}
