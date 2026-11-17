// ═══════════════════════════════════════════════════════
// Rəqəmlər kartı (PNG) — Ramazan albomu və sədəqə hesabatı üçün kətan çəkimi
//
//   drawStatCard(ctx, { W, H, eyebrow, title, sub, stats: [{ v, l }], foot, brand, rtl, tone })
//   await statCardBlob(opts) → Blob | null
//
// Yalnız həndəsə: səkkizguşəli ulduz naxışı, hilal, tağ — canlı varlıq təsviri YOXDUR.
// tone: 'night' (Ramazan — gecə göyü) | 'emerald' (sədəqə — yaşıl)
// ═══════════════════════════════════════════════════════
const TONES = {
  night: { bg: ['#0b1f3a', '#122c4f', '#071426'], ink: '#f7f1de', soft: 'rgba(247,241,222,.72)', gold: '#e3b955', line: 'rgba(227,185,85,.16)' },
  emerald: { bg: ['#0b3b2e', '#0f5240', '#06261d'], ink: '#f5f1e4', soft: 'rgba(245,241,228,.74)', gold: '#e6c069', line: 'rgba(230,192,105,.15)' },
}

function star8(ctx, cx, cy, r) {
  ctx.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i
    const rr = i % 2 ? r * 0.62 : r
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y)
  }
  ctx.closePath()
}

function fit(ctx, text, maxW, size, weight = 700, min = 24) {
  let s = size
  ctx.font = `${weight} ${s}px system-ui, "Segoe UI", "Noto Sans", sans-serif`
  while (ctx.measureText(text).width > maxW && s > min) {
    s -= 2
    ctx.font = `${weight} ${s}px system-ui, "Segoe UI", "Noto Sans", sans-serif`
  }
  return s
}

export function drawStatCard(ctx, { W = 1080, H = 1350, eyebrow = '', title = '', sub = '', stats = [], foot = '', brand = 'muslims.cc', rtl = false, tone = 'night' } = {}) {
  const c = TONES[tone] || TONES.night
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H)
  g.addColorStop(0, c.bg[0]); g.addColorStop(0.55, c.bg[1]); g.addColorStop(1, c.bg[2])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // Naxış: səkkizguşəli ulduz şəbəkəsi
  ctx.strokeStyle = c.line
  ctx.lineWidth = 2
  const step = 120
  for (let y = step / 2; y < H + step; y += step) {
    for (let x = (y / step) % 2 ? step : step / 2; x < W + step; x += step) { star8(ctx, x, y, 34); ctx.stroke() }
  }

  // Çərçivə: tağ formalı daxili haşiyə
  const m = 54
  ctx.strokeStyle = c.gold
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(m, H - m)
  ctx.lineTo(m, 300)
  ctx.quadraticCurveTo(m, m + 40, W / 2, m)
  ctx.quadraticCurveTo(W - m, m + 40, W - m, 300)
  ctx.lineTo(W - m, H - m)
  ctx.closePath()
  ctx.stroke()

  // Hilal + ulduz
  const cx = W / 2, cy = 200
  ctx.fillStyle = c.gold
  ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.fill()
  // hilal: ikinci dairə fonun öz qradiyenti ilə (mövqeyə bağlıdır — tikiş görünmür)
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(cx + 22, cy - 12, 46, 0, Math.PI * 2); ctx.fill()
  star8(ctx, cx + 40, cy - 30, 13)
  ctx.fillStyle = c.gold
  ctx.fill()

  ctx.textAlign = 'center'
  ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.textBaseline = 'alphabetic'
  if (eyebrow) {
    ctx.fillStyle = c.gold
    fit(ctx, eyebrow.toUpperCase(), W - 2 * m - 80, 30, 700)
    ctx.fillText(eyebrow.toUpperCase(), W / 2, 330)
  }
  ctx.fillStyle = c.ink
  fit(ctx, title, W - 2 * m - 80, 84, 800, 40)
  ctx.fillText(title, W / 2, 425)
  if (sub) {
    ctx.fillStyle = c.soft
    fit(ctx, sub, W - 2 * m - 80, 32, 500, 20)
    ctx.fillText(sub, W / 2, 480)
  }

  // Rəqəmlər: 2 sütun
  const list = stats.slice(0, 8)
  const cols = 2, rows = Math.ceil(list.length / cols) || 1
  const top = 545, bottom = H - 190
  const rowH = Math.min(190, (bottom - top) / rows)
  const colW = (W - 2 * m - 60) / cols
  list.forEach((s, i) => {
    const col = rtl ? cols - 1 - (i % cols) : i % cols
    const row = Math.floor(i / cols)
    const x = m + 30 + colW * col + colW / 2
    const y = top + rowH * row
    ctx.fillStyle = 'rgba(255,255,255,.06)'
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(x - colW / 2 + 12, y, colW - 24, rowH - 22, 22); else ctx.rect(x - colW / 2 + 12, y, colW - 24, rowH - 22)
    ctx.fill()
    ctx.fillStyle = c.ink
    fit(ctx, String(s.v), colW - 60, 64, 800, 28)
    ctx.fillText(String(s.v), x, y + rowH * 0.48)
    ctx.fillStyle = c.soft
    fit(ctx, String(s.l), colW - 60, 28, 500, 16)
    ctx.fillText(String(s.l), x, y + rowH * 0.48 + 44)
  })

  if (foot) {
    ctx.fillStyle = c.soft
    fit(ctx, foot, W - 2 * m - 80, 26, 500, 16)
    ctx.fillText(foot, W / 2, H - 130)
  }
  ctx.fillStyle = c.gold
  ctx.font = '700 30px system-ui, "Segoe UI", sans-serif'
  ctx.direction = 'ltr'
  ctx.fillText(brand, W / 2, H - 82)
}

/** Kartı PNG Blob kimi (brauzerdə) */
export function statCardBlob(opts) {
  if (typeof document === 'undefined') return Promise.resolve(null)
  const cv = document.createElement('canvas')
  cv.width = opts.W || 1080
  cv.height = opts.H || 1350
  const ctx = cv.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  drawStatCard(ctx, opts)
  return new Promise((ok) => { try { cv.toBlob(ok, 'image/png') } catch { ok(null) } })
}
