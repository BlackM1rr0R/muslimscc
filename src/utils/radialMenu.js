// ═══════════════════════════════════════════════════════
// Dairəvi menyu (Quranda sözə uzun basma — components/quran/WordMenu.jsx)
// SAF həndəsə: qövsdə düymələrin yeri, ekrana sığdırma, barmağın altındakı
// düymə, uzun basmanın "yerində qalma" həddi, info pəncərəsinin yeri.
// Bucaqlar ekran koordinatındadır: 0° — sağ, 90° — aşağı, −90° — yuxarı.
// tests/unit/radialMenu.test.js
// ═══════════════════════════════════════════════════════

export const RADIAL = Object.freeze({
  radius: 78,   // barmaqdan düymənin mərkəzinə qədər
  item: 48,     // düymənin diametri (toxunma hədəfi ≥ 44px)
  margin: 12,   // ekran kənarından ən az məsafə
  spread: 150,  // qövsün açısı (dərəcə)
  slop: 8,      // uzun basma: barmaq bu qədər (px) tərpənsə — sürüşmədir, menyu yox
  holdMs: 450,  // uzun basmanın müddəti
  tilt: 35,     // ekranın yan kənarında qövs içəri tərəfə bu qədər dönür (və 120°-yə daralır —
                //   düymələr barmağın altına düşməsin)
})

const rad = d => (d * Math.PI) / 180

/** Barmaq başlanğıc nöqtədən `slop` px-dən çox tərpənibmi */
export function movedBeyond(a, b, slop = RADIAL.slop) {
  if (!a || !b) return false
  return Math.hypot(b.x - a.x, b.y - a.y) > slop
}

/**
 * n düymənin bucaqları. Qövs `center` istiqamətində, `spread` açısında.
 * Soldan sağa düzülür (yuxarı qövsdə də, aşağıda da); rtl — sağdan sola
 * (birinci düymə sağda olur, oxuma istiqaməti ilə).
 */
export function arcAngles(n, { center = -90, spread = RADIAL.spread, up = true, rtl = false } = {}) {
  if (!(n > 0)) return []
  if (n === 1) return [center]
  const step = spread / (n - 1)
  const out = Array.from({ length: n }, (_, i) => (up ? center - spread / 2 + i * step : center + spread / 2 - i * step))
  return rtl ? out.reverse() : out
}

/**
 * Menyunun düzülüşü. x, y — barmağın yeri (viewport px); vw, vh — ekranın ölçüsü.
 * Qaydalar: düymələr barmağın ÜSTÜNDƏ (barmaq altını örtür); yuxarıda yer yoxdursa
 * — altında. Yan kənarda qövs içəri dönür. Sonda bütün qrup ekrana sığdırılır
 * (dx, dy — sürüşmə; barmağın özü yerində qalır).
 * Qaytarır: { items: [{ x, y, angle }], up, dx, dy }
 */
export function layoutRadial({ x, y, count, vw, vh, rtl = false, radius = RADIAL.radius, item = RADIAL.item, margin = RADIAL.margin, spread = RADIAL.spread, tilt = RADIAL.tilt }) {
  const reach = radius + item / 2
  const roomAbove = y - reach >= margin
  const roomBelow = y + reach <= vh - margin
  const up = roomAbove ? true : roomBelow ? false : y > vh / 2
  let center = up ? -90 : 90
  const nearLeft = x - reach < margin
  const nearRight = x + reach > vw - margin
  if (nearLeft !== nearRight) {
    center += (nearLeft ? 1 : -1) * (up ? tilt : -tilt)
    spread = Math.min(spread, 120)
  }
  const angles = arcAngles(count, { center, spread, up, rtl })
  let items = angles.map(a => ({ x: x + radius * Math.cos(rad(a)), y: y + radius * Math.sin(rad(a)), angle: a }))
  const half = item / 2
  const minX = Math.min(...items.map(p => p.x)) - half, maxX = Math.max(...items.map(p => p.x)) + half
  const minY = Math.min(...items.map(p => p.y)) - half, maxY = Math.max(...items.map(p => p.y)) + half
  const dx = minX < margin ? margin - minX : maxX > vw - margin ? vw - margin - maxX : 0
  const dy = minY < margin ? margin - minY : maxY > vh - margin ? vh - margin - maxY : 0
  if (dx || dy) items = items.map(p => ({ ...p, x: p.x + dx, y: p.y + dy }))
  const r1 = v => Math.round(v * 10) / 10
  return { items: items.map(p => ({ x: r1(p.x), y: r1(p.y), angle: r1(p.angle) })), up, dx: r1(dx), dy: r1(dy) }
}

const angDiff = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d }

/**
 * Barmağın (px, py) altındakı düymənin indeksi, yoxdursa −1.
 * 1) düymənin öz dairəsi (bir az geniş) — birbaşa üstündədirsə;
 * 2) barmaq mərkəzdən radiusun yarısından çox uzaqlaşıbsa — istiqamətə görə
 *    ən yaxın düymə (barmaqla "atmaq" kifayətdir, düymənin üstünə çatmaq şərt deyil).
 * Mərkəzə yaxın (dead) — heç biri: barmağı geri gətirib buraxmaq = seçməmək.
 */
export function pickIndex(items, px, py, { origin, item = RADIAL.item, radius = RADIAL.radius, dead = 22 } = {}) {
  if (!items?.length) return -1
  let best = -1, bd = Infinity
  items.forEach((it, i) => { const d = Math.hypot(px - it.x, py - it.y); if (d < bd) { bd = d; best = i } })
  if (bd <= item * 0.75) return best
  if (!origin) return -1
  const dist = Math.hypot(px - origin.x, py - origin.y)
  if (dist < Math.max(dead, radius * 0.5)) return -1
  const a = (Math.atan2(py - origin.y, px - origin.x) * 180) / Math.PI
  let bi = -1, ba = Infinity
  items.forEach((it, i) => {
    const ia = (Math.atan2(it.y - origin.y, it.x - origin.x) * 180) / Math.PI
    const d = angDiff(a, ia)
    if (d < ba) { ba = d; bi = i }
  })
  const step = items.length > 1 ? RADIAL.spread / (items.length - 1) : 90
  return ba <= step / 2 + 8 ? bi : -1
}

/**
 * Info pəncərəsinin yeri: hədəfin (söz/düymə) altında, yer yoxdursa üstündə;
 * üfüqi — hədəfin ortasına, ekrana sığdırılır. Hamısı viewport px.
 * anchor: { left, top, right, bottom }, size: { w, h } → { left, top, side: 'below'|'above' }
 */
export function placePopover(anchor, size, vw, vh, { margin = RADIAL.margin, gap = 10 } = {}) {
  const w = Math.min(size.w, vw - margin * 2)
  const cx = (anchor.left + anchor.right) / 2
  const left = Math.max(margin, Math.min(cx - w / 2, vw - margin - w))
  const below = anchor.bottom + gap
  const above = anchor.top - gap - size.h
  let side = 'below', top = below
  if (below + size.h > vh - margin && above >= margin) { side = 'above'; top = above }
  else if (below + size.h > vh - margin) top = Math.max(margin, vh - margin - size.h)
  return { left: Math.round(left), top: Math.round(top), side }
}

/** Siyahıda ox düymələri ilə gəzmək: indeks dövr edir */
export function cycleIndex(i, delta, n) {
  if (!(n > 0)) return -1
  return (((i + delta) % n) + n) % n
}
