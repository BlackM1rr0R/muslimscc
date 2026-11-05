// Malın axını (components/ZakatFlow.jsx) — saf düzülüş hesabı (React-sız; tests/unit/zakat-flow.test.js)
export const W = 420, H = 250, PAD = 14, GAP = 10, NODE = 9
export const XL = 120, XM = 206, XR = 292 // sütunların sol kənarı

/** Sol kənardan sağa lent: (x1, a0..a1) → (x2, b0..b1) */
export function ribbon(x1, a0, a1, x2, b0, b1) {
  const m = (x1 + x2) / 2
  return `M${x1},${a0} C${m},${a0} ${m},${b0} ${x2},${b0} L${x2},${b1} C${m},${b1} ${m},${a1} ${x1},${a1} Z`
}

/** Etiket mərkəzləri: ardıcıl, ən azı `gap` aralıqla, [lo, hi] daxilində (iki sətirli etiketlər üst-üstə düşməsin) */
export function spreadLabels(centers, gap = 36, lo = 18, hi = H - 14) {
  const out = centers.slice()
  for (let i = 0; i < out.length; i++) out[i] = Math.max(out[i], i ? out[i - 1] + gap : lo)
  for (let i = out.length - 1; i >= 0; i--) out[i] = Math.min(out[i], i < out.length - 1 ? out[i + 1] - gap : hi)
  return out
}

/** Saf hesab — testlənir: qovşaqların və lentlərin mövqeləri */
export function flowLayout({ sources, debt = 0, net, zakat }) {
  const src = sources.filter(s => s.value > 0)
  const assets = src.reduce((a, s) => a + s.value, 0)
  if (!(assets > 0)) return null
  const debtV = Math.min(Math.max(0, debt), assets)
  const avail = H - 2 * PAD - GAP * Math.max(0, src.length - 1)
  const k = avail / assets
  // Sol qovşaqlar
  let y = PAD
  const left = src.map(s => { const h = s.value * k; const n = { ...s, y, h }; y += h + GAP; return n })
  // Orta qovşaq — bütün varlıq, şaquli mərkəzdə
  const midH = assets * k
  const midY = (H - midH) / 2
  // Sağ: borc (yuxarı) · zəkat · qalan
  const zakatV = Math.max(0, Math.min(zakat || 0, net))
  const restV = Math.max(0, net - zakatV)
  const parts = [
    debtV > 0 && { key: 'debt', value: debtV },
    zakatV > 0 && { key: 'zakat', value: zakatV },
    restV > 0 && { key: 'rest', value: restV },
  ].filter(Boolean)
  const minH = (p) => (p.key === 'zakat' ? Math.max(3, p.value * k) : p.value * k)
  const rightTotal = parts.reduce((a, p) => a + minH(p), 0) + GAP * Math.max(0, parts.length - 1)
  let ry = (H - rightTotal) / 2
  let my = midY
  const right = parts.map(p => {
    const h = minH(p), hm = p.value * k
    const n = { ...p, y: ry, h, my, mh: hm }
    ry += h + GAP; my += hm
    return n
  })
  // Sol → orta lentlər (orta qovşaqda üst-üstə yığılır)
  let acc = midY
  const inLinks = left.map(n => { const l = { key: n.key, tone: n.tone, d: ribbon(XL + NODE, n.y, n.y + n.h, XM, acc, acc + n.h) }; acc += n.h; return l })
  const outLinks = right.map(n => ({ key: n.key, d: ribbon(XM + NODE, n.my, n.my + n.mh, XR, n.y, n.y + n.h) }))
  spreadLabels(left.map(n => n.y + n.h / 2)).forEach((v, i) => { left[i].ly = v })
  spreadLabels(right.map(n => n.y + n.h / 2)).forEach((v, i) => { right[i].ly = v })
  return { left, mid: { y: midY, h: midH }, right, inLinks, outLinks, assets }
}

