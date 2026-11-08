// ═══════════════════════════════════════════════════════
// Nişan / xətm paylaşma kartı (v5.7) — Instagram story ölçüsü (1080×1920)
//
//   await shareBadgeCard({ tier, iconSvg, eyebrow, title, sub, brand, fileName, rtl })
//
// • Kətanda: tünd yaşıl fon, 8 guşəli ulduz naxışı, böyük medal (rəfdəki ilə eyni
//   rənglər), ikon (rəfdəki SVG elementinin özü — XMLSerializer → şəkil), yazılar.
// • Web Share (fayl) dəstəklənirsə — paylaşma pəncərəsi; yoxsa PNG yüklənir.
// • Qaytarır: 'shared' | 'saved' | 'cancel' | 'error'
// ═══════════════════════════════════════════════════════

export const TIERS = {
  gold: ['#f6e7b0', '#d9b45c', '#a87a26', '#3b2a06'],
  silver: ['#f4f6f8', '#c2c9d1', '#858f9b', '#232a33'],
  bronze: ['#f6d2b0', '#d08a55', '#8f5428', '#331a06'],
}

function star(ctx, cx, cy, r, inner = 0.82) {
  ctx.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2
    const rr = i % 2 ? r * inner : r
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y)
  }
  ctx.closePath()
}

/** Yazını enə sığdır (şrift kiçilir) */
function fitText(ctx, text, maxW, size, weight = 700, family = 'system-ui, sans-serif') {
  let s = size
  do { ctx.font = `${weight} ${s}px ${family}`; s -= 4 } while (ctx.measureText(text).width > maxW && s > 28)
}

export function svgToImage(svgEl, color) {
  return new Promise((resolve) => {
    if (!svgEl) return resolve(null)
    try {
      const c = svgEl.cloneNode(true)
      c.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      c.setAttribute('width', '240'); c.setAttribute('height', '240')
      c.setAttribute('stroke', color)
      c.style.color = color
      const src = new XMLSerializer().serializeToString(c).replace(/currentColor/g, color)
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(src)}`
    } catch { resolve(null) }
  })
}

export function drawBadgeCard(ctx, { W = 1080, H = 1920, tier = 'gold', icon, eyebrow, title, sub, brand, rtl, lang = 'en' }) {
  const [m1, m2, m3] = TIERS[tier] || TIERS.gold
  // Fon
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#0f4a39'); bg.addColorStop(0.55, '#0a3328'); bg.addColorStop(1, '#06201a')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  // Naxış: zəif ulduzlar şəbəkəsi
  ctx.save(); ctx.globalAlpha = 0.07; ctx.strokeStyle = '#e7c77d'; ctx.lineWidth = 2
  for (let y = 120; y < H; y += 220) for (let x = (y / 220) % 2 ? 110 : 0; x < W + 110; x += 220) { star(ctx, x, y, 60, 0.7); ctx.stroke() }
  ctx.restore()
  // İşıq halosu
  const cx = W / 2, cy = H * 0.4
  const halo = ctx.createRadialGradient(cx, cy, 40, cx, cy, 520)
  halo.addColorStop(0, 'rgba(231,199,125,0.35)'); halo.addColorStop(1, 'rgba(231,199,125,0)')
  ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H)
  // Medal: ulduz şüaları + metal dairə
  star(ctx, cx, cy, 300, 0.8)
  const sg = ctx.createLinearGradient(cx - 300, cy - 300, cx + 300, cy + 300)
  sg.addColorStop(0, m2); sg.addColorStop(1, m3)
  ctx.fillStyle = sg; ctx.fill()
  ctx.beginPath(); ctx.arc(cx, cy, 228, 0, Math.PI * 2)
  const cg = ctx.createRadialGradient(cx - 80, cy - 90, 20, cx, cy, 240)
  cg.addColorStop(0, '#ffffff'); cg.addColorStop(0.25, m1); cg.addColorStop(0.75, m2); cg.addColorStop(1, m3)
  ctx.fillStyle = cg; ctx.fill()
  ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.stroke()
  if (icon) ctx.drawImage(icon, cx - 120, cy - 120, 240, 240)
  // Yazılar
  ctx.textAlign = 'center'; ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.fillStyle = '#e7c77d'; ctx.font = '700 44px system-ui, sans-serif'
  // az/tr: i → İ (toLocaleUpperCase)
  ctx.fillText(String(eyebrow || '').toLocaleUpperCase(lang), cx, H * 0.64)
  ctx.fillStyle = '#ffffff'; fitText(ctx, title || '', W - 140, 96)
  ctx.fillText(title || '', cx, H * 0.64 + 120)
  if (sub) { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '500 42px system-ui, sans-serif'; ctx.fillText(sub, cx, H * 0.64 + 200) }
  ctx.fillStyle = 'rgba(231,199,125,0.9)'; ctx.font = '700 40px system-ui, sans-serif'
  ctx.fillText(brand || 'muslims.cc', cx, H - 110)
}

export async function shareBadgeCard({ tier, iconSvg, eyebrow, title, sub, brand, fileName = 'muslims-cc-badge.png', rtl = false, lang = 'en' }) {
  try {
    const ink = (TIERS[tier] || TIERS.gold)[3]
    const icon = await svgToImage(iconSvg, ink)
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920
    drawBadgeCard(c.getContext('2d'), { tier, icon, eyebrow, title, sub, brand, rtl, lang })
    const blob = await new Promise(res => c.toBlob(res, 'image/png'))
    if (!blob) return 'error'
    const file = new File([blob], fileName, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title }); return 'shared' } catch (e) {
        if (e?.name === 'AbortError') return 'cancel'
      }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    return 'saved'
  } catch { return 'error' }
}
