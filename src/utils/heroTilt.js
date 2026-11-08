// ═══════════════════════════════════════════════════════
// heroTilt (v5.6) — telefonu əyəndə ana səhifə hero-su 3D kimi canlanır
//
//   const stop = initHeroTilt(sectionEl)
//
// Qatlar müxtəlif dərinlikdə yerini dəyişir (CSS `translate` xassəsi —
// `transform` animasiyaları ilə toqquşmur, üstünə gəlir; kompozitorda):
//   aurora ← yavaş, naxış ← orta, ulduzlar ← dərin, namaz kartı → əks tərəfə
// • Yalnız toxunma ekranı + DeviceOrientation icazəsiz işləyəndə (Android).
//   iOS-də sistem icazə pəncərəsi tələb olunur — orada YOXDUR (narahat edir).
// • Yalnız hero ekrandadırsa dinlənir (IntersectionObserver); kadr başına bir
//   yazma (rAF); telefon necə tutulursa, o vəziyyət "sıfır" sayılır və
//   yavaş-yavaş yenilənir (yatıb oxuyanda da işləyir).
// • Hərəkət azaldılıbsa — heç nə.
// ═══════════════════════════════════════════════════════

const LAYERS = [
  ['.hp-aur', 10],
  ['.hp-hero-pattern', 16],
  ['.hp-stars', 26],
  ['.hp-hero-visual', -7],
]

function reduced() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('a11y-motion-user')
  } catch { return true }
}

export function initHeroTilt(section) {
  if (!section || typeof window === 'undefined') return () => {}
  if (reduced() || !window.matchMedia('(pointer: coarse)').matches) return () => {}
  if (typeof window.DeviceOrientationEvent === 'undefined') return () => {}
  // iOS: hərəkət sensoru sistem icazə pəncərəsi tələb edir — orada söndürülür.
  // (Chrome-da da requestPermission funksiyası var, ona görə cihazı UA ilə tanıyırıq.)
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (ios) return () => {}

  const els = LAYERS.map(([sel, depth]) => [section.querySelector(sel), depth]).filter(([el]) => el)
  if (!els.length) return () => {}

  let base = null          // "sıfır" vəziyyət (beta, gamma)
  let tx = 0, ty = 0       // hədəf (−1..1)
  let cx = 0, cy = 0       // hazırkı (yumşaldılmış)
  let raf = 0
  let listening = false

  const clamp = (v) => Math.max(-1, Math.min(1, v))
  const onOrient = (e) => {
    if (e.beta == null || e.gamma == null) return
    if (!base) base = { b: e.beta, g: e.gamma }
    // Sıfır yavaş-yavaş cari vəziyyətə çəkilir (~10 s)
    base.b += (e.beta - base.b) * 0.006
    base.g += (e.gamma - base.g) * 0.006
    tx = clamp((e.gamma - base.g) / 18)
    ty = clamp((e.beta - base.b) / 18)
    if (!raf) raf = requestAnimationFrame(tick)
  }
  const tick = () => {
    raf = 0
    cx += (tx - cx) * 0.12
    cy += (ty - cy) * 0.12
    for (const [el, d] of els) el.style.translate = `${(cx * d).toFixed(1)}px ${(cy * d).toFixed(1)}px`
    if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) raf = requestAnimationFrame(tick)
  }
  const start = () => { if (!listening) { listening = true; window.addEventListener('deviceorientation', onOrient, { passive: true }) } }
  const pause = () => { if (listening) { listening = false; window.removeEventListener('deviceorientation', onOrient) } }

  let io = null
  if (typeof IntersectionObserver === 'function') {
    io = new IntersectionObserver(([en]) => { if (en?.isIntersecting) start(); else pause() })
    io.observe(section)
  } else start()

  return () => {
    pause()
    io?.disconnect()
    cancelAnimationFrame(raf)
    for (const [el] of els) el.style.removeProperty('translate')
  }
}
