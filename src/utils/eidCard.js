// Bayram təbrik kartı (components/EidMode) — 1080×1920 story; yazı: təbrik, bayramın adı və ili,
// təkbirin ərəbcə mətni (src/data/eidTakbir.js) və istəyə görə "Kimdən: ad" sətri.
// 3 sakit palitra: night (tünd yaşıl), dawn (səhər qumu), ink (mürəkkəb və qızıl).
// Fon: ulduzlar, hilal, qandillər; təkbir yuxarı çəkilib, arada 8 guşəli ulduz ayırıcısı. Canlı varlıq təsviri yoxdur.
export const EID_PALETTES = {
  night: { bg: ['#04140f', '#0b3327', '#061c15'], star: '#e7c77d', star2: '#fff', title: '#fff', gold: '#e7c77d', moon: '#f3e6b5', glow: 'rgba(243,230,181,.8)', arText: 'rgba(255,248,230,.92)', lamp: '#d9b45c', soft: 'rgba(231,199,125,.6)' },
  dawn: { bg: ['#fbf1dc', '#f1dcb3', '#e4c48f'], star: '#b9853a', star2: '#fffaf0', title: '#3a2708', gold: '#8a5a00', moon: '#fffaf0', glow: 'rgba(255,236,190,.95)', arText: '#3a2708', lamp: '#b9853a', soft: 'rgba(138,90,0,.45)' },
  ink: { bg: ['#06081a', '#141a3a', '#090c1f'], star: '#d9b45c', star2: '#c9d2ff', title: '#f4efe2', gold: '#d9b45c', moon: '#f4efe2', glow: 'rgba(217,180,92,.7)', arText: 'rgba(244,239,226,.92)', lamp: '#d9b45c', soft: 'rgba(217,180,92,.55)' },
}

function star(ctx, x, y, r, inner = 0.6) {
  ctx.beginPath()
  for (let i = 0; i < 16; i++) { const t = (Math.PI / 8) * i - Math.PI / 2, rr = i % 2 ? r * inner : r; ctx.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr) }
  ctx.closePath()
}
export function wrap(ctx, text, maxW) {
  const words = String(text).split(' '), lines = []
  let line = ''
  for (const w of words) { const tt = line ? `${line} ${w}` : w; if (ctx.measureText(tt).width > maxW && line) { lines.push(line); line = w } else line = tt }
  if (line) lines.push(line)
  return lines
}
export function drawEidCard(ctx, { W = 1080, H = 1920, greet, name, ar, rtl, from = '', palette = 'night' }) {
  const P = EID_PALETTES[palette] || EID_PALETTES.night
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, P.bg[0]); bg.addColorStop(0.5, P.bg[1]); bg.addColorStop(1, P.bg[2])
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  let s = 11; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
  for (let i = 0; i < 70; i++) { ctx.globalAlpha = 0.2 + rnd() * 0.6; ctx.fillStyle = rnd() > 0.7 ? P.star : P.star2; star(ctx, rnd() * W, rnd() * H * 0.5, 3 + rnd() * 9); ctx.fill() }
  ctx.globalAlpha = 1
  // qandillər
  for (let i = 0; i < 5; i++) {
    const x = W * (0.14 + i * 0.18), len = 160 + (i % 2) * 120
    ctx.strokeStyle = P.soft; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke()
    const g = ctx.createRadialGradient(x, len + 40, 4, x, len + 40, 80); g.addColorStop(0, 'rgba(255,214,120,.55)'); g.addColorStop(1, 'rgba(255,214,120,0)')
    ctx.fillStyle = g; ctx.fillRect(x - 80, len - 40, 160, 160)
    ctx.fillStyle = P.lamp; ctx.beginPath(); ctx.moveTo(x, len); ctx.lineTo(x + 26, len + 30); ctx.lineTo(x + 18, len + 76); ctx.lineTo(x - 18, len + 76); ctx.lineTo(x - 26, len + 30); ctx.closePath(); ctx.fill()
  }
  // hilal (ayrıca kətanda kəsilir)
  const mr = 150, mc = document.createElement('canvas'); mc.width = mc.height = mr * 4
  const m = mc.getContext('2d'); m.fillStyle = P.moon; m.beginPath(); m.arc(mr * 2, mr * 2, mr, 0, Math.PI * 2); m.fill()
  m.globalCompositeOperation = 'destination-out'; m.beginPath(); m.arc(mr * 2 + mr * 0.42, mr * 2 - mr * 0.18, mr * 0.86, 0, Math.PI * 2); m.fill()
  ctx.save(); ctx.shadowColor = P.glow; ctx.shadowBlur = 80; ctx.drawImage(mc, W / 2 - mr * 2, H * 0.33 - mr * 2); ctx.restore()

  ctx.textAlign = 'center'; ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.fillStyle = P.title; ctx.font = '800 96px system-ui, sans-serif'
  const gl = wrap(ctx, greet, W - 160)
  const y0 = H * 0.5
  gl.forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * 108))
  const yName = y0 + (gl.length - 1) * 108 + 90
  ctx.fillStyle = P.gold; ctx.font = '700 46px system-ui, sans-serif'; ctx.fillText(name, W / 2, yName)

  // Ayırıcı: incə xətlər arasında 8 guşəli ulduz (ulduz yağışı ilə eyni motiv)
  const yDiv = yName + 80
  ctx.strokeStyle = P.soft; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(W / 2 - 220, yDiv); ctx.lineTo(W / 2 - 34, yDiv); ctx.moveTo(W / 2 + 34, yDiv); ctx.lineTo(W / 2 + 220, yDiv); ctx.stroke()
  ctx.fillStyle = P.gold; star(ctx, W / 2, yDiv, 18, 0.55); ctx.fill()

  ctx.direction = 'rtl'; ctx.fillStyle = P.arText; ctx.font = '500 52px "Amiri", serif'
  const arLines = wrap(ctx, ar, W - 180)
  const yAr = yDiv + 110
  arLines.forEach((l, i) => ctx.fillText(l, W / 2, yAr + i * 86))

  if (from) {
    ctx.direction = rtl ? 'rtl' : 'ltr'; ctx.fillStyle = P.title; ctx.globalAlpha = 0.85; ctx.font = '600 44px system-ui, sans-serif'
    ctx.fillText(from, W / 2, Math.min(H - 220, yAr + arLines.length * 86 + 90))
    ctx.globalAlpha = 1
  }
  ctx.direction = 'ltr'; ctx.fillStyle = P.gold; ctx.font = '700 40px system-ui, sans-serif'; ctx.fillText('muslims.cc', W / 2, H - 110)
}
