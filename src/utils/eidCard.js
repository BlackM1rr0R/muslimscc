// Bayram təbrik kartı (components/EidMode) — 1080×1920 story; yazı: təbrik, bayramın adı və ili,
// təkbirin ərəbcə mətni (src/data/eidTakbir.js). Fon: tünd yaşıl, qızılı ulduzlar, hilal, qandillər.
function star(ctx, x, y, r, inner = 0.6) {
  ctx.beginPath()
  for (let i = 0; i < 16; i++) { const t = (Math.PI / 8) * i - Math.PI / 2, rr = i % 2 ? r * inner : r; ctx.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr) }
  ctx.closePath()
}
function wrap(ctx, text, maxW) {
  const words = String(text).split(' '), lines = []
  let line = ''
  for (const w of words) { const tt = line ? `${line} ${w}` : w; if (ctx.measureText(tt).width > maxW && line) { lines.push(line); line = w } else line = tt }
  if (line) lines.push(line)
  return lines
}
export function drawEidCard(ctx, { W = 1080, H = 1920, greet, name, ar, rtl }) {
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#04140f'); bg.addColorStop(0.5, '#0b3327'); bg.addColorStop(1, '#061c15')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  let s = 11; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
  for (let i = 0; i < 70; i++) { ctx.globalAlpha = 0.2 + rnd() * 0.6; ctx.fillStyle = rnd() > 0.7 ? '#e7c77d' : '#fff'; star(ctx, rnd() * W, rnd() * H * 0.55, 3 + rnd() * 9); ctx.fill() }
  ctx.globalAlpha = 1
  // qandillər
  for (let i = 0; i < 5; i++) {
    const x = W * (0.14 + i * 0.18), len = 160 + (i % 2) * 120
    ctx.strokeStyle = 'rgba(231,199,125,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke()
    const g = ctx.createRadialGradient(x, len + 40, 4, x, len + 40, 80); g.addColorStop(0, 'rgba(255,214,120,.55)'); g.addColorStop(1, 'rgba(255,214,120,0)')
    ctx.fillStyle = g; ctx.fillRect(x - 80, len - 40, 160, 160)
    ctx.fillStyle = '#d9b45c'; ctx.beginPath(); ctx.moveTo(x, len); ctx.lineTo(x + 26, len + 30); ctx.lineTo(x + 18, len + 76); ctx.lineTo(x - 18, len + 76); ctx.lineTo(x - 26, len + 30); ctx.closePath(); ctx.fill()
  }
  // hilal (ayrıca kətanda kəsilir)
  const mr = 150, mc = document.createElement('canvas'); mc.width = mc.height = mr * 4
  const m = mc.getContext('2d'); m.fillStyle = '#f3e6b5'; m.beginPath(); m.arc(mr * 2, mr * 2, mr, 0, Math.PI * 2); m.fill()
  m.globalCompositeOperation = 'destination-out'; m.beginPath(); m.arc(mr * 2 + mr * 0.42, mr * 2 - mr * 0.18, mr * 0.86, 0, Math.PI * 2); m.fill()
  ctx.save(); ctx.shadowColor = 'rgba(243,230,181,.8)'; ctx.shadowBlur = 80; ctx.drawImage(mc, W / 2 - mr * 2, H * 0.36 - mr * 2); ctx.restore()
  ctx.textAlign = 'center'; ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.fillStyle = '#fff'; ctx.font = '800 96px system-ui, sans-serif'
  const gl = wrap(ctx, greet, W - 160)
  gl.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.56 + i * 108))
  ctx.fillStyle = '#e7c77d'; ctx.font = '700 46px system-ui, sans-serif'; ctx.fillText(name, W / 2, H * 0.56 + (gl.length - 1) * 108 + 90)
  ctx.direction = 'rtl'; ctx.fillStyle = 'rgba(255,248,230,.9)'; ctx.font = '500 52px "Amiri", serif'
  wrap(ctx, ar, W - 180).forEach((l, i) => ctx.fillText(l, W / 2, H * 0.74 + i * 86))
  ctx.direction = 'ltr'; ctx.fillStyle = 'rgba(231,199,125,.9)'; ctx.font = '700 40px system-ui, sans-serif'; ctx.fillText('muslims.cc', W / 2, H - 110)
}
