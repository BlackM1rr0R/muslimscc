// ═══════════════════════════════════════════════════════
// celebrate (v5.6) — uğur anı: qızılı 8 guşəli (xatəm) ulduzların partlayışı
//
//   celebrate()                 — orta ölçü, son toxunuş nöqtəsindən (yoxsa ekranın ortası)
//   celebrate({ size: 'big' })  — 5 namaz, xətm, hədəf zikr, dərs yolu
//   celebrate({ size: 'small', x, y })
//
// • Bir canvas (position: fixed, pointer-events: none), ~1.3 s, sonra silinir.
//   DOM-a 1 element, layout yoxdur. DPR ≤ 2, hissəcik sayı telefonda az.
// • Telefon titrəyir (navigator.vibrate — dəstəkləyirsə).
// • Hərəkət azaldılıbsa (sistem / əlçatanlıq paneli) — yalnız titrəmə.
// • Eyni anda ikinci partlayış birincini əvəz etmir — üst-üstə düşür (ucuzdur).
// ═══════════════════════════════════════════════════════

let lastPointer = null
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => { lastPointer = { x: e.clientX, y: e.clientY, t: Date.now() } }, { passive: true, capture: true })
}

const SIZES = { small: 22, medium: 44, big: 80 }
const COLORS = ['#e7c77d', '#d8b46a', '#f3e6b5', '#c9a24e', '#ffffff', '#3fb68e']

function reduced() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('a11y-motion-user')
  } catch { return true }
}

function vibrate(pattern) {
  try { navigator.vibrate?.(pattern) } catch { /* dəstək yoxdur */ }
}

// 8 guşəli ulduz (iki üst-üstə kvadrat — Rub əl-Hizb) yolu
function starPath(ctx, r) {
  ctx.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i
    const rr = i % 2 === 0 ? r : r * 0.62
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

export function celebrate({ size = 'medium', x, y } = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  vibrate(size === 'big' ? [40, 60, 40, 60, 120] : size === 'small' ? 25 : [40, 50, 80])
  if (reduced() || document.visibilityState !== 'visible') return
  const W = window.innerWidth, H = window.innerHeight
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    if (lastPointer && Date.now() - lastPointer.t < 1500) { x = lastPointer.x; y = lastPointer.y }
    else { x = W / 2; y = H * 0.42 }
  }
  const coarse = window.matchMedia?.('(pointer: coarse)').matches
  const n = Math.round((SIZES[size] || SIZES.medium) * (coarse ? 0.7 : 1))
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const cv = document.createElement('canvas')
  cv.setAttribute('aria-hidden', 'true')
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:3000'
  document.body.appendChild(cv)
  const ctx = cv.getContext('2d')
  if (!ctx) { cv.remove(); return }
  ctx.scale(dpr, dpr)
  const power = size === 'big' ? 1 : size === 'small' ? 0.55 : 0.8
  const parts = Array.from({ length: n }, (_, i) => {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.5
    const v = (2.6 + Math.random() * 4.2) * power
    return {
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - (2 + Math.random() * 2.2) * power,
      r: (Math.random() < 0.7 ? 5 + Math.random() * 6 : 2 + Math.random() * 2) * (size === 'small' ? 0.8 : 1),
      star: Math.random() < 0.7,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: COLORS[i % COLORS.length],
    }
  })
  const DUR = size === 'big' ? 1500 : 1150
  const t0 = performance.now()
  let last = t0
  const frame = (now) => {
    const k = (now - t0) / DUR
    // Zamana bağlı fizika (60/120 Hz ekranda eyni sürət); 16.7 ms = 1 addım
    const dt = Math.min(3, (now - last) / 16.7)
    last = now
    ctx.clearRect(0, 0, W, H)
    if (k >= 1) { cv.remove(); return }
    // İlk anlarda yumşaq qızılı halqa (dalğa)
    if (k < 0.45) {
      const rk = k / 0.45
      ctx.globalAlpha = (1 - rk) * 0.5
      ctx.strokeStyle = '#e7c77d'
      ctx.lineWidth = 3 * (1 - rk) + 1
      ctx.beginPath(); ctx.arc(x, y, 12 + rk * 140 * power, 0, Math.PI * 2); ctx.stroke()
    }
    for (const p of parts) {
      p.vy += 0.12 * dt
      const drag = Math.pow(0.975, dt)
      p.vx *= drag; p.vy *= drag
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt
      ctx.globalAlpha = Math.max(0, 1 - k * k)
      ctx.fillStyle = p.c
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot)
      if (p.star) starPath(ctx, p.r); else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2) }
      ctx.fill(); ctx.restore()
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

/** Bir dəfəlik bayram (məs. dərs yolu bitdi) — açar localStorage-də yadda qalır */
export function celebrateOnce(key, opts) {
  try {
    const k = 'qm_celebrated_' + key
    if (localStorage.getItem(k)) return
    localStorage.setItem(k, '1')
  } catch { /* yaddaş bağlıdır — yenə də bayram et */ }
  celebrate(opts)
}
