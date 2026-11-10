// ═══════════════════════════════════════════════════════
// "Adın ərəb xəttilə" paylaşma kartı (1080×1350, kətan) — /name-in-arabic
// Zümrüd fon, qızılı həndəsi (8 guşəli ulduz) haşiyə, ortada ərəbcə ad,
// altında latın yazılışı və muslims.cc. İnsan təsviri yoxdur.
// ═══════════════════════════════════════════════════════

const GOLD = '#e7c77d', GOLD_D = '#c9a24e'

// 8 guşəli ulduz (iki kvadrat — Rub əl-Hizb)
function star(ctx, cx, cy, r) {
  ctx.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 8
    const rr = i % 2 === 0 ? r : r * 0.66
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

/** Haşiyə zolağı boyunca ulduz zənciri */
function border(ctx, W, H, m, band) {
  ctx.save()
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2.2; ctx.globalAlpha = 0.85
  const step = band * 0.92, r = band * 0.34
  const run = (x0, y0, x1, y1) => {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / step))
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n
      star(ctx, x, y, r); ctx.stroke()
      if (i < n) { ctx.beginPath(); ctx.arc(x + ((x1 - x0) / n) / 2, y + ((y1 - y0) / n) / 2, r * 0.18, 0, Math.PI * 2); ctx.fillStyle = GOLD; ctx.fill() }
    }
  }
  const c = m + band / 2
  run(c, c, W - c, c); run(c, H - c, W - c, H - c)
  run(c, c, c, H - c); run(W - c, c, W - c, H - c)
  ctx.restore()
  // İkiqat qızılı xətt
  ctx.save(); ctx.strokeStyle = GOLD_D; ctx.lineWidth = 3
  ctx.strokeRect(m, m, W - 2 * m, H - 2 * m)
  ctx.strokeRect(m + band, m + band, W - 2 * (m + band), H - 2 * (m + band))
  ctx.lineWidth = 1.2; ctx.strokeStyle = GOLD
  ctx.strokeRect(m + band + 10, m + band + 10, W - 2 * (m + band + 10), H - 2 * (m + band + 10))
  ctx.restore()
}

export function drawNameCard(ctx, { W = 1080, H = 1350, ar, latin, family = "'Amiri', serif", weight = 400, eyebrow = '' }) {
  const bg = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H / 2, H * 0.75)
  bg.addColorStop(0, '#13705a'); bg.addColorStop(0.55, '#0b4a3a'); bg.addColorStop(1, '#062a21')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  border(ctx, W, H, 36, 64)

  // Mərkəzdə zəif böyük ulduz (fon)
  ctx.save(); ctx.globalAlpha = 0.08; ctx.strokeStyle = GOLD; ctx.lineWidth = 3
  star(ctx, W / 2, H * 0.44, W * 0.36); ctx.stroke(); ctx.restore()

  if (eyebrow) {
    ctx.save(); ctx.fillStyle = 'rgba(243,230,181,.78)'; ctx.font = '600 34px system-ui, sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(eyebrow, W / 2, 230); ctx.restore()
  }

  // Ərəbcə ad — sığdır
  ctx.save()
  ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.font = `${weight} 100px ${family}`
  const m = ctx.measureText(ar)
  const wid = (m.actualBoundingBoxLeft || m.width / 2) + (m.actualBoundingBoxRight || m.width / 2)
  const asc = m.actualBoundingBoxAscent || 80, desc = m.actualBoundingBoxDescent || 30
  const s = Math.min((W - 300) / Math.max(1, wid), 520 / Math.max(1, asc + desc), 4.2)
  const off = ((m.actualBoundingBoxRight || 0) - (m.actualBoundingBoxLeft || 0)) / 2 * s
  ctx.font = `${weight} ${100 * s}px ${family}`
  const y = H * 0.46 + ((asc - desc) / 2) * s
  const g = ctx.createLinearGradient(0, y - asc * s, 0, y + desc * s)
  g.addColorStop(0, '#f8ecc4'); g.addColorStop(0.5, GOLD); g.addColorStop(1, GOLD_D)
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6
  ctx.fillStyle = g; ctx.fillText(ar, W / 2 - off, y)
  ctx.restore()

  // Ayırıcı
  ctx.save(); ctx.strokeStyle = GOLD; ctx.globalAlpha = 0.7; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(W / 2 - 170, H * 0.72); ctx.lineTo(W / 2 - 30, H * 0.72); ctx.moveTo(W / 2 + 30, H * 0.72); ctx.lineTo(W / 2 + 170, H * 0.72); ctx.stroke()
  star(ctx, W / 2, H * 0.72, 14); ctx.fillStyle = GOLD; ctx.fill(); ctx.restore()

  // Latın yazılışı
  ctx.save(); ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.direction = 'ltr'
  let fs = 78
  ctx.font = `700 ${fs}px system-ui, sans-serif`
  while (ctx.measureText(latin).width > W - 320 && fs > 34) { fs -= 4; ctx.font = `700 ${fs}px system-ui, sans-serif` }
  ctx.fillText(latin, W / 2, H * 0.8)
  ctx.restore()

  ctx.save(); ctx.fillStyle = 'rgba(231,199,125,.92)'; ctx.font = '700 38px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.direction = 'ltr'
  ctx.fillText('muslims.cc', W / 2, H - 150); ctx.restore()
}
