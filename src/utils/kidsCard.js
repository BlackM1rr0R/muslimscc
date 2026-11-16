// ═══════════════════════════════════════════════════════
// Uşaq təbrik kartı (components/KidsCertificate) — A4 albom nisbəti (1600×1131),
// çap üçün də kifayət qədər iti. Kağız rəngli fon, qızılı səkkizguşəli ulduz
// haşiyəsi, hilal, uşağın adı, nailiyyəti, tarix və "بارك الله فيك" duası.
// Şəbəkə yoxdur — hamısı kətanda çəkilir.
// ═══════════════════════════════════════════════════════
const GOLD = '#b8862b', GOLD2 = '#e2c27a', INK = '#1d2b25', GREEN = '#1f5a4a'

function star8(ctx, x, y, r, inner = 0.72) {
  ctx.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2, rr = i % 2 ? r * inner : r
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  ctx.closePath()
}

/** Mətni enə görə sətirlərə böl */
export function wrapLines(measure, text, maxW) {
  const words = String(text || '').split(/\s+/).filter(Boolean), lines = []
  let line = ''
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (measure(t) > maxW && line) { lines.push(line); line = w } else line = t
  }
  if (line) lines.push(line)
  return lines
}

/** Şriftin ölçüsünü mətn enə sığana qədər kiçilt (ad uzun olanda) */
export function fitSize(measureAt, text, maxW, start, min = 40) {
  let s = start
  while (s > min && measureAt(s, text) > maxW) s -= 4
  return s
}

export function drawKidsCard(ctx, { W = 1600, H = 1131, title, name, deed, date, dua, brand = 'muslims.cc', rtl = false }) {
  // kağız
  const bg = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H / 2, W * 0.75)
  bg.addColorStop(0, '#fffdf6'); bg.addColorStop(1, '#f3e7c9')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  // ikiqat qızılı çərçivə
  ctx.strokeStyle = GOLD; ctx.lineWidth = 6; ctx.strokeRect(40, 40, W - 80, H - 80)
  ctx.strokeStyle = GOLD2; ctx.lineWidth = 2; ctx.strokeRect(62, 62, W - 124, H - 124)
  // haşiyə boyunca kiçik ulduzlar
  ctx.fillStyle = GOLD2
  for (let x = 120; x < W - 80; x += 80) { star8(ctx, x, 51, 7); ctx.fill(); star8(ctx, x, H - 51, 7); ctx.fill() }
  for (let y = 120; y < H - 80; y += 80) { star8(ctx, 51, y, 7); ctx.fill(); star8(ctx, W - 51, y, 7); ctx.fill() }
  // künclərdə böyük səkkizguşəli ulduz
  for (const [x, y] of [[62, 62], [W - 62, 62], [62, H - 62], [W - 62, H - 62]]) {
    ctx.fillStyle = GREEN; star8(ctx, x, y, 34); ctx.fill()
    ctx.fillStyle = GOLD2; star8(ctx, x, y, 18); ctx.fill()
  }
  // hilal və ulduz (yuxarıda)
  const cx = W / 2, cy = 190
  ctx.fillStyle = GOLD
  ctx.beginPath(); ctx.arc(cx, cy, 58, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(cx + 24, cy - 12, 52, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = GOLD; star8(ctx, cx + 52, cy - 34, 16, 0.5); ctx.fill()

  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.direction = rtl ? 'rtl' : 'ltr'
  const sans = 'system-ui, -apple-system, "Segoe UI", sans-serif'
  // başlıq
  ctx.fillStyle = GREEN; ctx.font = `800 64px ${sans}`
  ctx.fillText(title, cx, 340)
  // ad
  const nameSize = fitSize((s, t) => { ctx.font = `800 ${s}px ${sans}`; return ctx.measureText(t).width }, name, W - 360, 132)
  ctx.font = `800 ${nameSize}px ${sans}`; ctx.fillStyle = INK
  ctx.fillText(name, cx, 340 + 40 + nameSize)
  const lineY = 340 + 70 + nameSize
  ctx.strokeStyle = GOLD; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(cx - 320, lineY); ctx.lineTo(cx + 320, lineY); ctx.stroke()
  ctx.fillStyle = GOLD; star8(ctx, cx, lineY, 12); ctx.fill()
  // nailiyyət
  ctx.font = `600 52px ${sans}`; ctx.fillStyle = INK
  const dl = wrapLines((t) => ctx.measureText(t).width, deed, W - 400)
  dl.forEach((l, i) => ctx.fillText(l, cx, lineY + 90 + i * 64))
  // dua (ərəbcə)
  const duaY = lineY + 90 + dl.length * 64 + 70
  ctx.direction = 'rtl'; ctx.font = `700 64px "Amiri", "Noto Naskh Arabic", serif`; ctx.fillStyle = GREEN
  ctx.fillText(dua, cx, duaY)
  // tarix və brend
  ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.font = `500 34px ${sans}`; ctx.fillStyle = '#6b5a35'
  ctx.fillText(date, cx, H - 130)
  ctx.direction = 'ltr'; ctx.font = `700 28px ${sans}`; ctx.fillStyle = GOLD
  ctx.fillText(brand, cx, H - 88)
}
