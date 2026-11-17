// ═══════════════════════════════════════════════════════
// Ad tuğrası — prosedur kompozisiya (components/NameTughra.jsx)
//
// Osmanlı tuğrasının quruluşu (bədii üslub, dini mətn deyil):
//   • sere  — altda ad (rüq‘ə şrifti), kompozisiyanın gövdəsi;
//   • tuğ   — serədən yuxarı qalxan üç uca şaquli xətt;
//   • zülfe — tuğların başından sağa-aşağı enən S şəkilli bayraqcıqlar;
//   • beyze — sola uzanan iki iç-içə ilmə (içi qızılı nəbati bəzəkli);
//   • kol   — ilmələrin davamı olan, sağa uzanan iki uzun qol.
// Bütün ölçülər 1000×760 vahidlik "tuğra qutusu"ndadır; enli qələm
// (nib) effekti — xəttin istiqamətindən asılı qalınlıq.
// Kətan (canvas) API-dən başqa heç nədən asılı deyil — ixrac və önizləmə
// eyni funksiya ilə çəkilir. Təsadüf yoxdur (deterministik) — önizləmə və
// PNG tam eynidir.
// ═══════════════════════════════════════════════════════

export const BOX_W = 1000
export const BOX_H = 760
export const SQUARE = 2048
export const STORY_W = 1080
export const STORY_H = 1920

export const SCHEMES = [
  {
    id: 'navy',
    bg: ['#17295a', '#0b1736', '#060d22'],
    ink: ['#fbebb8', '#e2bd6a', '#b88a35'],
    fill: 'rgba(52, 86, 170, 0.32)',
    orn: '#d9b464',
    accent: '#6fb7c9',
    frame: '#c9a24e',
    latin: '#f3e3b4',
    mark: 'rgba(243, 227, 180, 0.72)',
    speck: null,
  },
  {
    id: 'ivory',
    bg: ['#fbf4e2', '#f2e6c9', '#e5d3a8'],
    ink: ['#2b4392', '#1d2f6e', '#121f4c'],
    fill: 'rgba(196, 150, 62, 0.13)',
    orn: '#b48a35',
    accent: '#b5473a',
    frame: '#b48a35',
    latin: '#1d2f6e',
    mark: 'rgba(29, 47, 110, 0.66)',
    speck: 'rgba(120, 90, 40, 0.06)',
  },
  {
    id: 'crimson',
    bg: ['#6b1824', '#4a0f19', '#2c070e'],
    ink: ['#fbebb8', '#e2bd6a', '#b88a35'],
    fill: 'rgba(150, 36, 52, 0.45)',
    orn: '#d9b464',
    accent: '#e9d7b0',
    frame: '#c9a24e',
    latin: '#f3e3b4',
    mark: 'rgba(243, 227, 180, 0.72)',
    speck: null,
  },
]
export const schemeById = (id) => SCHEMES.find(s => s.id === id) || SCHEMES[0]

export const FONT_FAMILY = "'Aref Ruqaa', 'Amiri', serif"

// ── Həndəsə ──
const P = (x, y) => ({ x, y })
const line = (a, b) => [a, P(a.x + (b.x - a.x) / 3, a.y + (b.y - a.y) / 3), P(a.x + (2 * (b.x - a.x)) / 3, a.y + (2 * (b.y - a.y)) / 3), b]

/** Kub Bezye nöqtəsi */
export function cubic(p0, p1, p2, p3, t) {
  const m = 1 - t
  const a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t
  return P(a * p0.x + b * p1.x + c * p2.x + d * p3.x, a * p0.y + b * p1.y + c * p2.y + d * p3.y)
}

/** Seqmentlər ([p0,p1,p2,p3]) → sıx nöqtələr; addım ~step vahid */
export function samplePath(segs, step = 4) {
  const out = []
  segs.forEach((s, si) => {
    let L = 0, prev = s[0]
    for (let i = 1; i <= 16; i++) { const q = cubic(s[0], s[1], s[2], s[3], i / 16); L += Math.hypot(q.x - prev.x, q.y - prev.y); prev = q }
    const n = Math.max(2, Math.ceil(L / step))
    for (let i = si === 0 ? 0 : 1; i <= n; i++) out.push(cubic(s[0], s[1], s[2], s[3], i / n))
  })
  return out
}

/**
 * Lent (ribbon): nöqtələr boyu dəyişən enli zolaq.
 * widthAt(u, angle) — u ∈ [0,1] yol boyu, angle — toxunanın bucağı.
 * Qaytarır: { left, right } — iki kənarın nöqtələri.
 */
export function ribbon(pts, widthAt) {
  const n = pts.length
  const left = [], right = []
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]
    const ang = Math.atan2(b.y - a.y, b.x - a.x)
    const w = widthAt(n > 1 ? i / (n - 1) : 0, ang) / 2
    const nx = -Math.sin(ang), ny = Math.cos(ang)
    left.push(P(pts[i].x + nx * w, pts[i].y + ny * w))
    right.push(P(pts[i].x - nx * w, pts[i].y - ny * w))
  }
  return { left, right }
}

const NIB = -0.7   // qələmin bucağı (radian; ~40°, sağa-yuxarı)
/** Enli qələm: istiqamətə görə qalınlıq + uclarda incəlmə */
export function nibWidth(maxW, { head = 0.06, tail = 0.12, min = 0.12, flat = 0.35 } = {}) {
  return (u, ang) => {
    const nib = flat + (1 - flat) * Math.abs(Math.sin(ang - NIB))
    const tp = Math.max(min, Math.min(1, head > 0 ? u / head : 1, tail > 0 ? (1 - u) / tail : 1))
    return maxW * nib * Math.pow(tp, 0.7)
  }
}

// Kompozisiyanın skeleti (tuğra qutusu vahidlərində)
export function tughraGeometry() {
  // Tuğlar — üç uca xətt, azca sağa meylli; başları bir qədər pilləli
  const staffs = [
    { x0: 548, y0: 596, x1: 540, y1: 96 },
    { x0: 600, y0: 600, x1: 592, y1: 78 },
    { x0: 652, y0: 596, x1: 644, y1: 104 },
  ]
  // Zülfələr — tuğun başından sağa-aşağı S
  const flags = staffs.map((s, i) => {
    const x = s.x1 + 2, y = s.y1 + 34 + i * 4
    return [P(x, y), P(x + 92, y - 30), P(x - 4, y + 150), P(x + 150, y + 236)]
  })
  // Xarici beyze + üst kol (sağdan sola, ilmə, serəyə qayıdış)
  const outer = [
    [P(978, 404), P(900, 430), P(760, 452), P(600, 462)],
    [P(600, 462), P(470, 470), P(420, 278), P(250, 262)],
    [P(250, 262), P(96, 248), P(28, 380), P(52, 482)],
    [P(52, 482), P(80, 612), P(260, 678), P(420, 650)],
    [P(420, 650), P(480, 640), P(520, 618), P(552, 584)],
  ]
  // Daxili beyze + alt kol
  const inner = [
    [P(946, 488), P(870, 508), P(740, 520), P(610, 524)],
    [P(610, 524), P(500, 528), P(452, 380), P(320, 372)],
    [P(320, 372), P(206, 366), P(160, 452), P(186, 520)],
    [P(186, 520), P(214, 598), P(330, 626), P(450, 598)],
    [P(450, 598), P(500, 586), P(530, 566), P(556, 540)],
  ]
  // İlmələrin içi (bəzək sahəsi) — qapalı kontur
  const outerFill = [outer[1], outer[2], outer[3], [P(420, 650), P(480, 640), P(520, 618), P(544, 592)], line(P(544, 592), P(541, 462)), line(P(541, 462), P(600, 462))]
  const innerFill = [inner[1], inner[2], inner[3], [P(450, 598), P(500, 586), P(526, 568), P(543, 550)], line(P(543, 550), P(542, 525)), line(P(542, 525), P(610, 524))]
  // Kol ucları — kiçik qarmaq
  const hooks = [
    [P(978, 404), P(1000, 396), P(996, 372), P(978, 376)],
    [P(946, 488), P(968, 482), P(970, 460), P(952, 462)],
  ]
  return { staffs, flags, outer, inner, outerFill, innerFill, hooks, sere: { cx: 604, cy: 650, maxW: 380, maxH: 200 } }
}

/** Adı serəyə sığdırmaq: bir və ya iki sətir (çox sözlü uzun ad) */
export function splitSere(ar, measure, maxW) {
  const words = String(ar || '').trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return [words.join(' ')]
  const one = words.join(' ')
  if (measure(one) <= maxW * 1.35) return [one]
  // ən balanslı bölgü (iki sətrin enlisi minimum olsun)
  let best = null
  for (let k = 1; k < words.length; k++) {
    const a = words.slice(0, k).join(' '), b = words.slice(k).join(' ')
    const w = Math.max(measure(a), measure(b))
    if (!best || w < best.w) best = { w, lines: [a, b] }
  }
  return best.lines
}

/** Qutunun kətanda yeri: { x, y, s } — sol-yuxarı künc və miqyas */
export function placeBox(W, H, { latin = false, story = false } = {}) {
  if (story) {
    const s = (W * 0.88) / BOX_W
    const y = H * 0.44 - (BOX_H * s) / 2
    return { x: (W - BOX_W * s) / 2, y, s }
  }
  const room = latin ? 0.15 : 0.06
  const s = Math.min((W * 0.84) / BOX_W, (H * (0.86 - room)) / BOX_H)
  const y = H * 0.07 + (H * (0.86 - room) - BOX_H * s) / 2 + H * 0.01
  return { x: (W - BOX_W * s) / 2, y, s }
}

/** Fayl adı: tughra-<latın>-muslims-cc.png */
export function fileName(latin, kind = 'square') {
  const slug = String(latin || '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[əƏ]/g, 'e').replace(/ı/g, 'i').toLowerCase()
    .replace(/[^a-z0-9а-яё]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32)
  return `tughra-${slug || 'name'}${kind === 'story' ? '-story' : ''}-muslims-cc.png`
}

// ── Çəkmə ──
function pathOf(ctx, pts, close = false) {
  ctx.beginPath()
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  if (close) ctx.closePath()
}

/** Lenti hissə-hissə doldur (öz-özünü kəsən ilmədə "deşik" qalmasın) */
function fillRibbon(ctx, pts, widthAt) {
  const { left, right } = ribbon(pts, widthAt)
  const CH = 24
  for (let i = 0; i < pts.length - 1; i += CH) {
    const j = Math.min(pts.length - 1, i + CH + 1)
    ctx.beginPath()
    for (let k = i; k <= j; k++) (k === i ? ctx.moveTo(left[k].x, left[k].y) : ctx.lineTo(left[k].x, left[k].y))
    for (let k = j; k >= i; k--) ctx.lineTo(right[k].x, right[k].y)
    ctx.closePath()
    ctx.fill()
  }
  // Yumru uclar
  const capR = (k) => Math.hypot(left[k].x - right[k].x, left[k].y - right[k].y) / 2
  for (const k of [0, pts.length - 1]) {
    const r = capR(k)
    if (r > 0.6) { ctx.beginPath(); ctx.arc(pts[k].x, pts[k].y, r, 0, Math.PI * 2); ctx.fill() }
  }
}

function inkGradient(ctx, sc, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1)
  g.addColorStop(0, sc.ink[0]); g.addColorStop(0.55, sc.ink[1]); g.addColorStop(1, sc.ink[2])
  return g
}

// Kiçik çiçək (5–8 ləçək)
function rosette(ctx, cx, cy, r, n = 6, rot = 0) {
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const a = rot + (Math.PI * 2 * i) / n
    const tx = cx + Math.cos(a) * r, ty = cy + Math.sin(a) * r
    const a1 = a - Math.PI / n, a2 = a + Math.PI / n
    ctx.moveTo(cx, cy)
    ctx.quadraticCurveTo(cx + Math.cos(a1) * r * 0.9, cy + Math.sin(a1) * r * 0.9, tx, ty)
    ctx.quadraticCurveTo(cx + Math.cos(a2) * r * 0.9, cy + Math.sin(a2) * r * 0.9, cx, cy)
  }
}

// Badam yarpaq (rumi) — p nöqtəsində, ang istiqamətində
function leaf(ctx, x, y, ang, len, wid) {
  const c = Math.cos(ang), s = Math.sin(ang)
  const tx = x + c * len, ty = y + s * len
  const mx = x + c * len * 0.5, my = y + s * len * 0.5
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.quadraticCurveTo(mx - s * wid, my + c * wid, tx, ty)
  ctx.quadraticCurveTo(mx + s * wid * 0.4, my - c * wid * 0.4, x, y)
}

/** Nəbati bəzək (arabesk): ilmənin içində sarmaşıq + qıvrımlar + çiçəklər */
function arabesque(ctx, sc, cx, cy, rx, ry, tilt, seed) {
  ctx.save()
  ctx.strokeStyle = sc.orn
  ctx.fillStyle = sc.orn
  ctx.lineCap = 'round'
  // Ana sarmaşıq — ellipsin içində dalğalı halqa
  const ring = []
  const N = 160
  for (let i = 0; i <= N; i++) {
    const t = (Math.PI * 2 * i) / N
    const wob = 1 + 0.035 * Math.sin(t * 6 + seed)
    const ex = Math.cos(t) * rx * wob, ey = Math.sin(t) * ry * wob
    ring.push(P(cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), cy + ex * Math.sin(tilt) + ey * Math.cos(tilt)))
  }
  ctx.globalAlpha = 0.9
  ctx.lineWidth = 2.6
  pathOf(ctx, ring, true); ctx.stroke()
  // Qıvrımlar: sarmaşıqdan növbə ilə içə/çölə burulan budaqlar (tısbağa üsulu)
  const K = 14
  for (let k = 0; k < K; k++) {
    const i0 = Math.round((N * k) / K) % N
    const a = ring[i0], b = ring[(i0 + 1) % N]
    const dir = k % 2 ? 1 : -1
    let h = Math.atan2(b.y - a.y, b.x - a.x) + dir * 0.5
    let x = a.x, y = a.y
    const sp = [P(x, y)]
    const L = Math.min(rx, ry) * (k % 2 ? 0.95 : 0.7)
    const n = 46
    for (let j = 1; j <= n; j++) {
      const u = j / n
      h += dir * (0.02 + 0.16 * u * u)
      const ds = (L / n) * (1.25 - 0.75 * u)
      x += Math.cos(h) * ds; y += Math.sin(h) * ds
      sp.push(P(x, y))
    }
    ctx.globalAlpha = 0.9
    ctx.lineWidth = 2
    pathOf(ctx, sp); ctx.stroke()
    const e = sp[sp.length - 1]
    if (k % 2) {
      ctx.globalAlpha = 0.9
      rosette(ctx, e.x, e.y, 8, 6, seed + k); ctx.fill()
      ctx.globalAlpha = 1; ctx.fillStyle = sc.accent
      ctx.beginPath(); ctx.arc(e.x, e.y, 2.2, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = sc.orn
    } else {
      ctx.globalAlpha = 0.85
      ctx.beginPath(); ctx.arc(e.x, e.y, 2.4, 0, Math.PI * 2); ctx.fill()
    }
    // budağın ortasından çıxan yarpaq
    const m = sp[Math.round(n * 0.35)], m2 = sp[Math.round(n * 0.35) + 1]
    ctx.globalAlpha = 0.75
    leaf(ctx, m.x, m.y, Math.atan2(m2.y - m.y, m2.x - m.x) - dir * 0.9, 15, 5); ctx.fill()
    // sarmaşıq üzərində kiçik yarpaq
    const v = ring[(i0 + Math.round(N / K / 2)) % N], v2 = ring[(i0 + Math.round(N / K / 2) + 1) % N]
    ctx.globalAlpha = 0.6
    leaf(ctx, v.x, v.y, Math.atan2(v2.y - v.y, v2.x - v.x) + dir * 0.6, 12, 4); ctx.fill()
  }
  ctx.restore()
}

/** Ərəbcə adı serəyə yaz */
function drawSere(ctx, sc, ar, g, family) {
  const { cx, cy, maxW, maxH } = g.sere
  if (!ar) return
  ctx.save()
  ctx.direction = 'rtl'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `400 100px ${family}`
  const meas = (t) => {
    const m = ctx.measureText(t)
    const w = (m.actualBoundingBoxLeft || m.width / 2) + (m.actualBoundingBoxRight || m.width / 2)
    return { w, asc: m.actualBoundingBoxAscent || 70, desc: m.actualBoundingBoxDescent || 30, off: ((m.actualBoundingBoxRight || 0) - (m.actualBoundingBoxLeft || 0)) / 2 }
  }
  const lines = splitSere(ar, (t) => meas(t).w * 1.2, maxW)
  const ms = lines.map(meas)
  const lineH = lines.length > 1 ? maxH * 0.6 : maxH
  ctx.fillStyle = inkGradient(ctx, sc, cy - maxH / 2, cy + maxH / 2)
  ctx.shadowColor = sc.id === 'ivory' ? 'rgba(18, 31, 76, 0.18)' : 'rgba(0, 0, 0, 0.35)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 2
  // hər iki sətir eyni ölçüdə
  const s = Math.min(...ms.map(m => Math.min(maxW / Math.max(1, m.w), (lineH * 0.98) / Math.max(1, m.asc + m.desc))), 3.4)
  lines.forEach((t, i) => {
    const m = ms[i]
    ctx.font = `400 ${100 * s}px ${family}`
    const yc = lines.length > 1 ? cy + 14 + lineH * (i - 0.5) : cy
    ctx.fillText(t, cx - m.off * s, yc + ((m.asc - m.desc) / 2) * s)
  })
  ctx.restore()
}

/** Tuğranı (qutu koordinatlarında) çək */
export function drawTughraBox(ctx, { ar, scheme = 'navy', family = FONT_FAMILY }) {
  const sc = schemeById(scheme)
  const g = tughraGeometry()
  const ink = inkGradient(ctx, sc, 60, 700)

  // 1) İlmələrin içi: zəif rəng + arabesk
  const of = samplePath(g.outerFill, 5), inf = samplePath(g.innerFill, 5)
  ctx.save()
  pathOf(ctx, of, true)
  ctx.fillStyle = sc.fill; ctx.fill()
  ctx.clip()
  arabesque(ctx, sc, 270, 465, 175, 130, -0.12, 1.3)
  ctx.restore()
  ctx.save()
  pathOf(ctx, inf, true)
  ctx.fillStyle = sc.fill; ctx.fill()
  ctx.clip()
  // daxili ilmənin mərkəzində böyük gül
  ctx.fillStyle = sc.orn
  ctx.globalAlpha = 0.85
  rosette(ctx, 330, 488, 36, 8, 0.2); ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = sc.id === 'ivory' ? sc.bg[1] : sc.bg[1]
  rosette(ctx, 330, 488, 20, 8, 0.2 + Math.PI / 8); ctx.fill()
  ctx.fillStyle = sc.accent
  ctx.beginPath(); ctx.arc(330, 488, 6, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = sc.orn; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.6
  ctx.beginPath(); ctx.arc(330, 488, 52, 0, Math.PI * 2); ctx.stroke()
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI * 2 * i) / 16
    ctx.globalAlpha = 0.75
    leaf(ctx, 330 + Math.cos(a) * 54, 488 + Math.sin(a) * 54, a, 18, 5); ctx.fillStyle = sc.orn; ctx.fill()
  }
  ctx.restore()

  ctx.fillStyle = ink
  // 2) Beyze + kol
  fillRibbon(ctx, samplePath(g.outer, 3), nibWidth(27, { head: 0.04, tail: 0.05, min: 0.2 }))
  fillRibbon(ctx, samplePath(g.inner, 3), nibWidth(23, { head: 0.04, tail: 0.05, min: 0.2 }))
  g.hooks.forEach(h => fillRibbon(ctx, samplePath([h], 2), nibWidth(10, { head: 0, tail: 0.6, min: 0.1 })))
  // 3) Tuğlar
  g.staffs.forEach(s => {
    const pts = samplePath([[P(s.x0, s.y0), P(s.x0, s.y0 - 150), P(s.x1, s.y1 + 150), P(s.x1, s.y1)]], 3)
    fillRibbon(ctx, pts, (u) => 15 * (1 - 0.45 * u) * Math.min(1, (1 - u) / 0.05 + 0.15))
  })
  // 4) Zülfələr
  g.flags.forEach(f => fillRibbon(ctx, samplePath([f], 2), nibWidth(13, { head: 0.08, tail: 0.3, min: 0.12, flat: 0.25 })))
  // 5) Sere — ad
  drawSere(ctx, sc, ar, g, family)
}

/** Fon + incə haşiyə */
function drawBackground(ctx, sc, W, H) {
  const bg = ctx.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.05, W / 2, H / 2, Math.max(W, H) * 0.75)
  bg.addColorStop(0, sc.bg[0]); bg.addColorStop(0.6, sc.bg[1]); bg.addColorStop(1, sc.bg[2])
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  if (sc.speck) {
    // kağız dənələri (deterministik)
    ctx.fillStyle = sc.speck
    let z = 7
    const rnd = () => { z = (z * 16807) % 2147483647; return z / 2147483647 }
    const n = Math.round((W * H) / 900)
    for (let i = 0; i < n; i++) ctx.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd() * 2)
  }
  const u = Math.min(W, H) / 1000
  const m = 34 * u
  ctx.save()
  ctx.strokeStyle = sc.frame
  ctx.globalAlpha = 0.85
  ctx.lineWidth = 2.4 * u
  ctx.strokeRect(m, m, W - 2 * m, H - 2 * m)
  ctx.lineWidth = 1 * u
  ctx.strokeRect(m + 9 * u, m + 9 * u, W - 2 * (m + 9 * u), H - 2 * (m + 9 * u))
  // künclərdə gül
  ctx.fillStyle = sc.frame
  for (const [x, y] of [[m, m], [W - m, m], [m, H - m], [W - m, H - m]]) {
    rosette(ctx, x, y, 13 * u, 8, Math.PI / 8); ctx.fill()
    ctx.fillStyle = sc.bg[1]; ctx.beginPath(); ctx.arc(x, y, 3.4 * u, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = sc.frame
  }
  ctx.restore()
}

/**
 * Tam şəkil: fon, tuğra, (istəyə görə) latın adı, muslims.cc nişanı.
 * opts: { ar, latin, showLatin, scheme, family, story }
 */
export function renderTughra(ctx, W, H, { ar, latin = '', showLatin = true, scheme = 'navy', family = FONT_FAMILY, story = false } = {}) {
  const sc = schemeById(scheme)
  const withLatin = Boolean(showLatin && String(latin).trim())
  ctx.save()
  drawBackground(ctx, sc, W, H)
  const { x, y, s } = placeBox(W, H, { latin: withLatin, story })
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  drawTughraBox(ctx, { ar, scheme, family })
  ctx.restore()

  const u = Math.min(W, H) / 1000
  if (withLatin) {
    const ly = story ? y + BOX_H * s + 150 * u : y + BOX_H * s + (H - (y + BOX_H * s)) * 0.42
    ctx.save()
    ctx.fillStyle = sc.latin
    ctx.textAlign = 'center'
    ctx.direction = 'ltr'
    let fs = 54 * u
    const font = (f) => `600 ${f}px 'Amiri', Georgia, 'Times New Roman', serif`
    ctx.font = font(fs)
    const txt = String(latin).trim()
    while (ctx.measureText(txt).width > W * 0.7 && fs > 22 * u) { fs -= 2 * u; ctx.font = font(fs) }
    ctx.fillText(txt, W / 2, ly)
    // ayırıcı çizgi + nöqtə
    ctx.strokeStyle = sc.frame; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.6 * u
    const sy = ly - fs * 1.05
    ctx.beginPath(); ctx.moveTo(W / 2 - 110 * u, sy); ctx.lineTo(W / 2 - 16 * u, sy); ctx.moveTo(W / 2 + 16 * u, sy); ctx.lineTo(W / 2 + 110 * u, sy); ctx.stroke()
    ctx.globalAlpha = 1; ctx.fillStyle = sc.frame
    rosette(ctx, W / 2, sy, 8 * u, 6, 0); ctx.fill()
    ctx.restore()
  }

  // muslims.cc
  ctx.save()
  ctx.fillStyle = sc.mark
  ctx.font = `600 ${22 * u}px Inter, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.direction = 'ltr'
  ctx.fillText('muslims.cc', W / 2, H - (story ? 96 : 54) * u)
  ctx.restore()
  ctx.restore()
}
