// ═══════════════════════════════════════════════════════
// HeroDust (v5.8) — ana səhifə: sürüşdükcə "Muslims.cc" qızılı ulduz tozuna çevrilib
// hilal və ulduz şəklinə toplanır (HomePage → hero, yalnız masaüstü)
//
//   <HeroDust heroRef={heroRef} />
//
// • Yalnız ≥1024px, dəqiq göstərici (siçan), hərəkət azaldılmayıb, Save-Data yox —
//   telefonda heç yüklənmir (mobile-perf dərsləri). Boş vaxtda yüklənir (lazyWhenIdle).
// • Başlıq mətni əvvəlcə adi HTML-dir (LCP, SEO — dəyişmir). Sürüşmə başlayanda başlığın
//   hərfləri gizli kətanda (offscreen canvas) eyni şriftlə çəkilir, piksellərdən ~1400 zərrə
//   götürülür; hədəf — hilal və səkkizguşəli ulduz konturu heronun görünən hissəsinin ortasında.
// • Sürüşmə irəlilədikcə (p: 0 → 1, hero hündürlüyünün ~55%-i) başlıq solur, zərrələr
//   dalğalı yolla hədəfə uçur. Kadr yalnız sürüşmə dəyişəndə çəkilir — sonsuz animasiya yox.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef } from 'react'
import '../../styles/HeroDust.css'

const N_MAX = 1400
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function sampleText(el, dpr) {
  const r = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  const w = Math.ceil(r.width), h = Math.ceil(r.height)
  if (!w || !h) return []
  const c = document.createElement('canvas')
  c.width = w * dpr; c.height = h * dpr
  const x = c.getContext('2d', { willReadFrequently: true })
  x.scale(dpr, dpr)
  x.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  x.textBaseline = 'alphabetic'
  x.fillStyle = '#000'
  // Hər hərf öz yerində (letter-spacing və span-lar dəqiq olsun)
  el.querySelectorAll('.hp-ht-ch, .hp-ht-2').forEach(s => {
    const sr = s.getBoundingClientRect()
    const fs = parseFloat(getComputedStyle(s).fontSize)
    x.fillText(s.textContent, sr.left - r.left, sr.top - r.top + fs * 0.86)
  })
  const d = x.getImageData(0, 0, c.width, c.height).data
  const pts = []
  const step = Math.max(2, Math.round(Math.sqrt((w * h * dpr * dpr) / (N_MAX * 9))))
  for (let yy = 0; yy < c.height; yy += step) {
    for (let xx = 0; xx < c.width; xx += step) {
      if (d[(yy * c.width + xx) * 4 + 3] > 140) pts.push([r.left + xx / dpr, r.top + yy / dpr])
    }
  }
  return pts
}

// Hilal (iki dairənin fərqi) + səkkizguşəli ulduz — kontur nöqtələri
function shapePoints(n, cx, cy, R) {
  const out = []
  const nm = Math.round(n * 0.62)
  for (let i = 0; i < nm; i++) {
    const t = i / nm
    // xarici qövs (sağa baxan hilal) və daxili qövs
    if (t < 0.6) {
      const a = -Math.PI * 0.78 + (t / 0.6) * Math.PI * 1.56
      out.push([cx + Math.cos(a + Math.PI) * R, cy + Math.sin(a + Math.PI) * R])
    } else {
      const a = -Math.PI * 0.62 + ((t - 0.6) / 0.4) * Math.PI * 1.24
      out.push([cx - R * 0.42 + Math.cos(a + Math.PI) * R * 0.78, cy + Math.sin(a + Math.PI) * R * 0.78])
    }
  }
  const sx = cx + R * 0.32, sy = cy - R * 0.05, sr = R * 0.3
  const ns = n - nm
  for (let i = 0; i < ns; i++) {
    const t = (i / ns) * 16, k = Math.floor(t), f = t - k
    const rad = (j) => (j % 2 ? sr * 0.55 : sr)
    const ang = (j) => -Math.PI / 2 + (j * Math.PI) / 8
    const x0 = sx + Math.cos(ang(k)) * rad(k), y0 = sy + Math.sin(ang(k)) * rad(k)
    const x1 = sx + Math.cos(ang(k + 1)) * rad(k + 1), y1 = sy + Math.sin(ang(k + 1)) * rad(k + 1)
    out.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f])
  }
  return out
}

export default function HeroDust({ heroRef }) {
  const cvRef = useRef(null)
  useEffect(() => {
    const hero = heroRef?.current, cv = cvRef.current
    const title = hero?.querySelector('.hp-hero-title')
    if (!hero || !cv || !title) return undefined
    const ctx = cv.getContext('2d')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    let parts = null, W = 0, H = 0, last = -1, raf = 0, CX = 0

    const build = () => {
      const hr = hero.getBoundingClientRect()
      W = Math.ceil(hr.width); H = Math.ceil(hr.height)
      cv.width = W * dpr; cv.height = H * dpr
      cv.style.width = `${W}px`; cv.style.height = `${H}px`
      const src = sampleText(title, dpr).map(([x, y]) => [x - hr.left, y - hr.top])
      if (!src.length) { parts = []; return }
      const n = Math.min(N_MAX, src.length)
      const pick = src.length > n ? src.filter((_, i) => i % Math.ceil(src.length / n) === 0) : src
      const tr = title.getBoundingClientRect()
      const R = Math.min(tr.height * 1.15, 120)
      CX = tr.left - hr.left + tr.width * 0.5
      const tgt = shapePoints(pick.length, 0, 0, R)
      parts = pick.map(([x, y], i) => ({
        x, y, tx: tgt[i][0], ty: tgt[i][1],
        d: (i * 0.618) % 1,                     // hər zərrənin öz gecikməsi
        w: (Math.sin(i * 12.9898) * 43758.5453) % 1,
        s: 0.7 + ((i * 7) % 10) / 12,
      }))
      last = -1
    }

    const draw = () => {
      raf = 0
      const hr = hero.getBoundingClientRect()
      const p = Math.max(0, Math.min(1, -hr.top / (hr.height * 0.55)))
      if (Math.abs(p - last) < 0.002) return
      last = p
      if (p > 0 && !parts) build()
      title.style.opacity = p > 0 ? String(Math.max(0, 1 - p * 2.4)) : ''
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      if (p <= 0 || !parts?.length) return
      const gold = ctx.createLinearGradient(0, 0, W, 0)
      gold.addColorStop(0, '#f6d77a'); gold.addColorStop(1, '#d4a437')
      ctx.fillStyle = gold
      // Hədəf — heronun ekranda görünən hissəsinin ortası (başlıq yuxarı çıxsa da şəkil görünsün)
      const CY = (H - hr.top) / 2
      for (const q of parts) {
        const k = ease(Math.max(0, Math.min(1, (p - q.d * 0.25) / 0.75)))
        const swirl = Math.sin(k * Math.PI) * (40 + q.w * 60)
        const x = q.x + (q.tx + CX - q.x) * k + Math.cos(q.d * 6.28) * swirl
        const y = q.y + (q.ty + CY - q.y) * k + Math.sin(q.d * 6.28) * swirl * 0.6
        ctx.globalAlpha = Math.min(1, p * 4) * (0.55 + 0.45 * q.s)
        const sz = q.s * (1.6 + (1 - Math.abs(k - 0.5) * 2) * 1.0)
        ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz)
      }
      ctx.globalAlpha = 1
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(draw) }
    const onResize = () => { parts = null; onScroll() }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    // Şrift sonradan yüklənsə — zərrələri yenidən götür
    document.fonts?.ready?.then(() => { parts = null; onScroll() })
    onScroll()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      title.style.opacity = ''
    }
  }, [heroRef])
  return <canvas ref={cvRef} className="hp-dust" aria-hidden="true" />
}
