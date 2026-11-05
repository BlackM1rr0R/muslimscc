// ═══════════════════════════════════════════════════════
// Sitat kartının ÇƏKİLMƏSİ (Canvas 2D API) — /quotes səhifəsi
//
// Bir funksiya (renderCard) həm canlı önizləməni, həm də yüklənən PNG-ni
// çəkir: ekranda görünən kart ilə şəkil eynidir (WYSIWYG). Xarici kitabxana
// və CDN yoxdur — naxışlar, kağız teksturası, ay və ulduzlar burada çəkilir.
//
// • Ölçülər "məntiqi" pikseldədir (1080×1080, 1080×1920, 1200×630 …);
//   önizləmə eyni koordinatları ctx.setTransform ilə kiçildir.
// • Mətn uzunluğuna görə ölçü avtomatik kiçilir (fitText) — sığmasa
//   şrift addım-addım azalır; mətnin özü heç vaxt kəsilmir/dəyişmir.
// • Mənbə (ref) boşdursa kartda istinad sətri və növ etiketi çəkilmir —
//   istifadəçinin öz mətni dini sitat kimi təqdim olunmur.
// ═══════════════════════════════════════════════════════

// ── Kart ölçüləri (Instagram / sosial şəbəkə) ──
export const FORMATS = [
  { id: 'square',   w: 1080, h: 1080 },
  { id: 'portrait', w: 1080, h: 1250 },
  { id: 'story',    w: 1080, h: 1920 },
  // Telefon fonu (kilid ekranı): mətn saat/tarix və kilid düymələrinin arasında (contentBox)
  { id: 'wallpaper', w: 1080, h: 2340 },
  { id: 'post',     w: 1200, h: 630 },
]
export const formatById = (id) => FORMATS.find(f => f.id === id) || FORMATS[0]

// ── Şriftlər (layihədə öz serverimizdədir — src/assets/fonts) ──
const F_AR = '"Amiri", "Noto Naskh Arabic", "Scheherazade New", serif'
// "Kitab" üslubu Amiri-nin latın hərfləridir (kiril üçün sistem serif-i).
// Dizayn v3.1: Ubuntu/Literata yoxdur — kartda yalnız Inter, Amiri, IBM Plex Sans Arabic
const F_SERIF = '"Amiri", Georgia, "Times New Roman", serif'
const F_SANS = '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif'
const F_AR_UI = '"IBM Plex Sans Arabic", "Noto Sans Arabic", Tahoma, sans-serif'

// ── Determinist təsadüfi ədədlər: ulduzlar/tekstura hər çəkilişdə eyni yerdə ──
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hasDoc = typeof document !== 'undefined'
function offscreen(w, h) {
  if (!hasDoc) return null
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}

// ── Kağız teksturası (bir dəfə yaradılır, sonra pattern kimi təkrarlanır) ──
let noiseTile = null
function paperNoise() {
  if (noiseTile || !hasDoc) return noiseTile
  const c = offscreen(180, 180)
  const x = c.getContext('2d')
  const img = x.createImageData(180, 180)
  const r = rng(7)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = r()
    const dark = v < 0.5
    img.data[i] = img.data[i + 1] = img.data[i + 2] = dark ? 60 : 255
    img.data[i + 3] = Math.round((dark ? 0.07 : 0.05) * 255 * r())
  }
  x.putImageData(img, 0, 0)
  // Lifli səth: bir neçə incə üfüqi "lif"
  x.globalAlpha = 0.05
  x.strokeStyle = '#6b5a3a'
  for (let i = 0; i < 26; i++) {
    const y = r() * 180
    x.beginPath(); x.moveTo(r() * 180, y); x.lineTo(r() * 180, y + (r() - 0.5) * 6); x.stroke()
  }
  noiseTile = c
  return noiseTile
}

// ── 8 guşəli ulduz (xatəm) — iki kvadratın birləşməsi ──
function starPath(ctx, cx, cy, r, rot = 0) {
  const ri = r * Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8)
  ctx.beginPath()
  for (let i = 0; i < 16; i++) {
    const rr = i % 2 ? ri : r
    const a = rot + (i * Math.PI) / 8 - Math.PI / 2
    const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a)
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y)
  }
  ctx.closePath()
}

// İslami həndəsi şəbəkə: xatəm ulduzları + aralarında kiçik romblar
function lattice(ctx, W, H, size, color, lw, alpha) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = lw
  const cols = Math.ceil(W / size) + 1, rows = Math.ceil(H / size) + 1
  const ox = (W - (cols - 1) * size) / 2, oy = (H - (rows - 1) * size) / 2
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ox + c * size, y = oy + r * size
      starPath(ctx, x, y, size * 0.36)
      ctx.stroke()
      // Ulduzlar arasındakı romb
      const dx = x + size / 2, dy = y + size / 2, d = size * 0.14
      ctx.beginPath(); ctx.moveTo(dx, dy - d); ctx.lineTo(dx + d, dy); ctx.lineTo(dx, dy + d); ctx.lineTo(dx - d, dy); ctx.closePath(); ctx.stroke()
      // Ulduzdan rombalara gedən incə xətlər
      ctx.beginPath()
      ctx.moveTo(x + size * 0.36, y); ctx.lineTo(x + size - size * 0.36, y)
      ctx.moveTo(x, y + size * 0.36); ctx.lineTo(x, y + size - size * 0.36)
      ctx.stroke()
    }
  }
  ctx.restore()
}

function linear(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  stops.forEach(([o, c]) => g.addColorStop(o, c))
  return g
}
function radial(ctx, x, y, r, stops) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  stops.forEach(([o, c]) => g.addColorStop(o, c))
  return g
}
function fill(ctx, W, H, style) { ctx.fillStyle = style; ctx.fillRect(0, 0, W, H) }

// Çərçivə (bir və ya iki xətt)
function frame(ctx, W, H, color, u, { double = false, alpha = 0.6 } = {}) {
  const m = Math.min(W, H) * 0.04
  ctx.save()
  ctx.strokeStyle = color
  ctx.globalAlpha = alpha
  ctx.lineWidth = 2.2 * u
  ctx.strokeRect(m, m, W - 2 * m, H - 2 * m)
  if (double) {
    const m2 = m + 12 * u
    ctx.globalAlpha = alpha * 0.55
    ctx.lineWidth = 1.2 * u
    ctx.strokeRect(m2, m2, W - 2 * m2, H - 2 * m2)
    // Künclərdə kiçik ulduzlar
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    for (const [x, y] of [[m, m], [W - m, m], [m, H - m], [W - m, H - m]]) { starPath(ctx, x, y, 9 * u); ctx.fill() }
  }
  ctx.restore()
}

// Hilal — kənar kanvasda dairədən dairə çıxılır, sonra kartın üstünə qoyulur
function crescent(ctx, cx, cy, r, color) {
  const s = Math.ceil(r * 2.4)
  const c = offscreen(s, s)
  if (!c) return
  const x = c.getContext('2d')
  x.fillStyle = color
  x.beginPath(); x.arc(s / 2, s / 2, r, 0, Math.PI * 2); x.fill()
  x.globalCompositeOperation = 'destination-out'
  x.beginPath(); x.arc(s / 2 + r * 0.42, s / 2 - r * 0.18, r * 0.86, 0, Math.PI * 2); x.fill()
  ctx.save()
  ctx.shadowColor = 'rgba(255, 236, 190, 0.45)'
  ctx.shadowBlur = r * 0.5
  ctx.drawImage(c, cx - s / 2, cy - s / 2)
  ctx.restore()
}

// Mehrab tağı (sivri tağ) — yol
function archPath(ctx, x, y, w, h) {
  const spring = y + Math.min(w * 0.42, h * 0.38)
  const cx = x + w / 2
  ctx.beginPath()
  ctx.moveTo(x, y + h)
  ctx.lineTo(x, spring)
  ctx.bezierCurveTo(x, spring - (spring - y) * 0.55, cx - w * 0.18, y + (spring - y) * 0.12, cx, y)
  ctx.bezierCurveTo(cx + w * 0.18, y + (spring - y) * 0.12, x + w, spring - (spring - y) * 0.55, x + w, spring)
  ctx.lineTo(x + w, y + h)
  ctx.closePath()
  return spring
}
function archRect(W, H) {
  const mx = W * (W > H ? 0.2 : 0.1), my = H * 0.07
  return { x: mx, y: my, w: W - 2 * mx, h: H - 2 * my }
}

// ── Dizayn v3.1: əlavə həndəsi elementlər (yalnız fiqurlar — canlı varlıq yoxdur) ──
// n guşəli ulduz (xarici/daxili radius)
function polyStar(ctx, cx, cy, n, rOut, rIn, rot = -Math.PI / 2) {
  ctx.beginPath()
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? rIn : rOut
    const a = rot + (i * Math.PI) / n
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a)
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y)
  }
  ctx.closePath()
}
function rhombus(ctx, cx, cy, d) {
  ctx.beginPath(); ctx.moveTo(cx, cy - d); ctx.lineTo(cx + d, cy); ctx.lineTo(cx, cy + d); ctx.lineTo(cx - d, cy); ctx.closePath()
}
// Şəmsə (rozet): iki xatəm + daxili xatəmlər + halqalar
function rosette(ctx, cx, cy, r, color, lw, alpha = 1) {
  ctx.save()
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.globalAlpha = alpha
  for (const k of [1, 0.64]) {
    starPath(ctx, cx, cy, r * k); ctx.stroke()
    starPath(ctx, cx, cy, r * k, Math.PI / 8); ctx.stroke()
  }
  for (const k of [1.12, 1.18, 0.3]) { ctx.beginPath(); ctx.arc(cx, cy, r * k, 0, Math.PI * 2); ctx.stroke() }
  ctx.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8 - Math.PI / 2
    ctx.moveTo(cx + Math.cos(a) * r * 0.3, cy + Math.sin(a) * r * 0.3)
    ctx.lineTo(cx + Math.cos(a) * r * 0.46, cy + Math.sin(a) * r * 0.46)
  }
  ctx.stroke()
  ctx.restore()
}
// Yumşaq rəng ləkəsi (qradiyent "mesh" üçün). rgb — 'r,g,b', a — mərkəzdə şəffaflıq
function blob(ctx, W, H, x, y, r, rgb, a) {
  fill(ctx, W, H, radial(ctx, x, y, r, [[0, `rgba(${rgb},${a})`], [1, `rgba(${rgb},0)`]]))
}
// İncə dən (müasir qradiyentlərdə "plastik" görünüşü aradan qaldırır)
function grain(ctx, W, H, alpha) {
  const tile = paperNoise()
  if (!tile) return
  ctx.save(); ctx.globalAlpha = alpha
  fill(ctx, W, H, ctx.createPattern(tile, 'repeat'))
  ctx.restore()
}
// Künc işarələri (redaksiya üslubu)
function cornerMarks(ctx, W, H, color, len, m, lw, alpha) {
  ctx.save()
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.globalAlpha = alpha; ctx.lineCap = 'square'
  ctx.beginPath()
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
    ctx.moveTo(x, y + sy * len); ctx.lineTo(x, y); ctx.lineTo(x + sx * len, y)
  }
  ctx.stroke()
  ctx.restore()
}
// Qum təpələri — aşağıda, bir neçə qat
function dunes(ctx, W, H, layers) {
  ctx.save()
  for (const l of layers) {
    ctx.beginPath()
    ctx.moveTo(0, H)
    for (let i = 0; i <= 64; i++) {
      const t = i / 64
      const y = H - l.top + l.amp * Math.sin(t * Math.PI * 2 * l.freq + l.phase) + l.amp * 0.45 * Math.sin(t * Math.PI * 2 * l.freq * 2.3 + l.phase * 1.7)
      ctx.lineTo(t * W, y)
    }
    ctx.lineTo(W, H)
    ctx.closePath()
    ctx.fillStyle = l.color
    ctx.fill()
  }
  ctx.restore()
}
// Kaşı zolağı: göy fonda xatəm ulduzları və romblar
function tileBand(ctx, x, y, w, h, u, top) {
  ctx.save()
  ctx.fillStyle = '#1d4e89'; ctx.fillRect(x, y, w, h)
  const n = Math.max(3, Math.round(w / (h * 1.15))), tw = w / n, cy = y + h / 2
  for (let i = 0; i < n; i++) {
    const cx = x + tw * (i + 0.5)
    starPath(ctx, cx, cy, h * 0.34)
    ctx.fillStyle = '#3f86c6'; ctx.fill()
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6 * u; ctx.stroke()
    starPath(ctx, cx, cy, h * 0.14, Math.PI / 8)
    ctx.fillStyle = '#ffffff'; ctx.fill()
  }
  ctx.fillStyle = '#e9f2fb'
  for (let i = 0; i <= n; i++) { rhombus(ctx, x + tw * i, cy, h * 0.15); ctx.fill() }
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y + h * 0.08, w, 1.6 * u)
  ctx.fillRect(x, y + h * 0.92 - 1.6 * u, w, 1.6 * u)
  ctx.fillStyle = '#2fa3b5'
  ctx.fillRect(x, top ? y + h : y - 5 * u, w, 5 * u)
  ctx.restore()
}
// Tağın içindəki mətn sahəsi (mehrab, tağlar)
function archBox(a) {
  const spring = a.y + Math.min(a.w * 0.42, a.h * 0.38)
  const top = a.y + (spring - a.y) * 0.55
  return { x: a.x + a.w * 0.1, y: top, w: a.w * 0.8, h: a.y + a.h - top - a.h * 0.12 }
}
// Ümumi sahənin kənarlarını ən azı verilən qədər içəri çəkir
function insetBox(W, H, m = {}) {
  const b = baseBox(W, H)
  const left = Math.max(b.x, m.left || 0), right = Math.max(W - b.x - b.w, m.right || 0)
  const top = Math.max(b.y, m.top || 0), bottom = Math.max(H - b.y - b.h, m.bottom || 0)
  return { x: left, y: top, w: W - left - right, h: H - top - bottom }
}
const minSide = (W, H) => Math.min(W, H)
// Şablon geometriyaları (bəzək və mətn sahəsi eyni ölçüləri işlədir)
const ornateGeo = (W, H) => { const m = minSide(W, H); return { m: m * 0.035, bw: m * 0.065 } }
const arch2Rect = (W, H) => {
  const wide = W / H > 1.3
  const mx = W * (wide ? 0.2 : 0.13), top = H * 0.08, bottom = H * 0.1
  return { x: mx, y: top, w: W - 2 * mx, h: H - top - bottom }
}
const splitGeo = (W, H) => {
  const m = minSide(W, H)
  return W / H > 1.3 ? { wide: true, p: W * 0.34, r: m * 0.11 } : { wide: false, p: H * 0.27, r: m * 0.08 }
}
const glassRect = (W, H) => {
  const m = minSide(W, H), story = H / W > 1.6
  const px = m * 0.07, py = story ? H * 0.1 : px
  return { x: px, y: py, w: W - 2 * px, h: H - 2 * py, r: m * 0.05 }
}
const tileH = (W, H) => minSide(W, H) * 0.115

// ═══ ŞABLONLAR ═══
// ink — əsas mətn, sub — ikinci dərəcəli mətn, accent — qızılı detal.
// paint — fon (istifadəçi öz fon rəngini seçəndə çəkilmir),
// decor — naxış/çərçivə (fon rəngi dəyişsə də qalır),
// box — mətn sahəsi (susma ilə kənarlardan boşluq).
export const TEMPLATES = [
  {
    id: 'emerald', dark: true, ink: '#f7f0e1', sub: 'rgba(247,240,225,0.80)', accent: '#d9b56b',
    paint(ctx, W, H) {
      fill(ctx, W, H, linear(ctx, 0, 0, W, H, [[0, '#0e5a47'], [1, '#05281f']]))
      fill(ctx, W, H, radial(ctx, W * 0.5, 0, Math.max(W, H) * 0.8, [[0, 'rgba(48,140,110,0.38)'], [1, 'rgba(48,140,110,0)']]))
    },
    decor(ctx, W, H, t, u) { frame(ctx, W, H, t.accent, u, { double: true, alpha: 0.55 }) },
  },
  {
    id: 'sand', ink: '#113c30', sub: '#3d4a42', accent: '#8a6418',
    paint(ctx, W, H) {
      fill(ctx, W, H, linear(ctx, 0, 0, 0, H, [[0, '#f6ecd4'], [1, '#e7cf9c']]))
    },
    decor(ctx, W, H, t, u) {
      lattice(ctx, W, H, 150 * u, '#8a6418', 1.3 * u, 0.13)
      fill(ctx, W, H, radial(ctx, W / 2, H / 2, Math.min(W, H) * 0.55, [[0, 'rgba(246,236,212,0.96)'], [0.75, 'rgba(246,236,212,0.75)'], [1, 'rgba(246,236,212,0)']]))
      frame(ctx, W, H, t.accent, u, { alpha: 0.5 })
    },
  },
  {
    id: 'paper', ink: '#2b2418', sub: '#574b39', accent: '#94692a',
    paint(ctx, W, H) {
      fill(ctx, W, H, '#f4ede0')
      const tile = paperNoise()
      if (tile) fill(ctx, W, H, ctx.createPattern(tile, 'repeat'))
      fill(ctx, W, H, radial(ctx, W / 2, H / 2, Math.max(W, H) * 0.75, [[0.55, 'rgba(120,90,40,0)'], [1, 'rgba(120,90,40,0.16)']]))
    },
    decor(ctx, W, H, t, u) {
      const m = Math.min(W, H) * 0.055
      ctx.save()
      ctx.strokeStyle = t.accent; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.4 * u
      ctx.strokeRect(m, m, W - 2 * m, H - 2 * m)
      ctx.globalAlpha = 0.7; ctx.fillStyle = t.accent
      for (const [x, y] of [[m, m], [W - m, m], [m, H - m], [W - m, H - m]]) {
        ctx.beginPath(); ctx.moveTo(x, y - 9 * u); ctx.lineTo(x + 9 * u, y); ctx.lineTo(x, y + 9 * u); ctx.lineTo(x - 9 * u, y); ctx.closePath(); ctx.fill()
      }
      ctx.restore()
    },
  },
  {
    id: 'minimal', ink: '#10201b', sub: '#4a5752', accent: '#a57a22',
    paint(ctx, W, H) { fill(ctx, W, H, '#ffffff') },
  },
  {
    id: 'ink', dark: true, ink: '#f3efe6', sub: 'rgba(243,239,230,0.74)', accent: '#d8b46a',
    paint(ctx, W, H) {
      fill(ctx, W, H, '#0e1418')
      fill(ctx, W, H, radial(ctx, W / 2, H * 0.42, Math.max(W, H) * 0.7, [[0, 'rgba(216,180,106,0.10)'], [1, 'rgba(216,180,106,0)']]))
    },
  },
  {
    id: 'geometry', dark: true, ink: '#f7f0e1', sub: 'rgba(247,240,225,0.82)', accent: '#e0c07c',
    paint(ctx, W, H) { fill(ctx, W, H, linear(ctx, 0, 0, W, H, [[0, '#0f5a47'], [1, '#0a4234']])) },
    decor(ctx, W, H, t, u) {
      lattice(ctx, W, H, 120 * u, '#e0c07c', 1.6 * u, 0.24)
      // Mətnin arxasında naxış solur — oxunaqlıq üçün
      fill(ctx, W, H, radial(ctx, W / 2, H / 2, Math.min(W, H) * 0.62, [[0, 'rgba(12,77,61,0.97)'], [0.7, 'rgba(12,77,61,0.82)'], [1, 'rgba(12,77,61,0)']]))
    },
  },
  {
    id: 'turquoise', dark: true, ink: '#f4f8f6', sub: 'rgba(244,248,246,0.82)', accent: '#e6cc95',
    paint(ctx, W, H) { fill(ctx, W, H, linear(ctx, 0, 0, W * 0.3, H, [[0, '#0d5f69'], [1, '#062f36']])) },
    decor(ctx, W, H, t, u) {
      lattice(ctx, W, H, 96 * u, '#ffffff', 1.2 * u, 0.09)
      fill(ctx, W, H, radial(ctx, W / 2, H / 2, Math.min(W, H) * 0.6, [[0, 'rgba(9,72,80,0.92)'], [1, 'rgba(9,72,80,0)']]))
    },
  },
  {
    id: 'night', dark: true, ink: '#f5efe2', sub: 'rgba(245,239,226,0.80)', accent: '#e6cc95',
    paint(ctx, W, H) {
      fill(ctx, W, H, linear(ctx, 0, 0, 0, H, [[0, '#0a1228'], [0.6, '#132447'], [1, '#1d335c']]))
    },
    decor(ctx, W, H, t, u) {
      const r = rng(11)
      ctx.save()
      ctx.fillStyle = '#fff6dc'
      for (let i = 0; i < 70; i++) {
        const x = r() * W, y = r() * H * 0.92, s = (0.6 + r() * 1.8) * u
        ctx.globalAlpha = 0.25 + r() * 0.55
        ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 0.85
      for (let i = 0; i < 4; i++) { starPath(ctx, r() * W, r() * H * 0.8, (5 + r() * 4) * u); ctx.fill() }
      ctx.restore()
      const mr = Math.min(W, H) * 0.075
      crescent(ctx, W - mr * 2.4, mr * 2.3 + (H > W * 1.5 ? H * 0.06 : 0), mr, '#f3dfa8')
    },
  },
  {
    id: 'mihrab', ink: '#16332b', sub: '#44514a', accent: '#a57a22',
    paint(ctx, W, H) { fill(ctx, W, H, linear(ctx, 0, 0, W, H, [[0, '#0d4a3b'], [1, '#072a22']])) },
    decor(ctx, W, H, t, u) {
      lattice(ctx, W, H, 110 * u, '#d9b56b', 1.3 * u, 0.16)
      const a = archRect(W, H)
      ctx.save()
      archPath(ctx, a.x, a.y, a.w, a.h)
      ctx.fillStyle = '#f7f1e3'; ctx.fill()
      ctx.strokeStyle = '#d9b56b'; ctx.lineWidth = 4 * u; ctx.stroke()
      const i = 14 * u
      archPath(ctx, a.x + i, a.y + i * 1.6, a.w - 2 * i, a.h - 2 * i)
      ctx.strokeStyle = 'rgba(165,122,34,0.45)'; ctx.lineWidth = 1.4 * u; ctx.stroke()
      ctx.restore()
    },
    box(W, H) { return archBox(archRect(W, H)) },
    mark: { y: (W, H) => H - H * 0.035, color: (st) => (st.bgColor ? '' : '#f7f1e3') },
  },
  {
    id: 'dawn', ink: '#3a1f1b', sub: '#5c3a32', accent: '#9a5a2a',
    paint(ctx, W, H) {
      fill(ctx, W, H, linear(ctx, 0, 0, 0, H, [[0, '#fcebd5'], [0.55, '#f4c7a6'], [1, '#e4a294']]))
      fill(ctx, W, H, radial(ctx, W / 2, H * 1.02, Math.max(W, H) * 0.55, [[0, 'rgba(255,240,214,0.85)'], [1, 'rgba(255,240,214,0)']]))
    },
    decor(ctx, W, H, t, u) { frame(ctx, W, H, '#9a5a2a', u, { alpha: 0.35 }) },
  },
  {
    id: 'gold', dark: true, ink: '#fff8e9', sub: 'rgba(255,248,233,0.84)', accent: '#ffe3a3',
    paint(ctx, W, H) {
      fill(ctx, W, H, linear(ctx, 0, 0, W, H, [[0, '#4e340a'], [0.5, '#8d6620'], [1, '#5a3d0e']]))
      fill(ctx, W, H, linear(ctx, 0, H * 0.2, W, H * 0.8, [[0.35, 'rgba(255,230,170,0)'], [0.5, 'rgba(255,230,170,0.12)'], [0.65, 'rgba(255,230,170,0)']]))
    },
    decor(ctx, W, H, t, u) { frame(ctx, W, H, '#ffe3a3', u, { double: true, alpha: 0.45 }) },
  },
  {
    id: 'aurora', dark: true, ink: '#ffffff', sub: 'rgba(255,255,255,0.84)', accent: '#f1d79c',
    paint(ctx, W, H) {
      fill(ctx, W, H, linear(ctx, 0, 0, W, H, [[0, '#0a3d31'], [0.55, '#13705b'], [1, '#b8924a']]))
      fill(ctx, W, H, radial(ctx, W * 0.2, H * 0.15, Math.max(W, H) * 0.6, [[0, 'rgba(95,200,165,0.28)'], [1, 'rgba(95,200,165,0)']]))
    },
  },
  // ═══ Dizayn v3.1 — yeni şablonlar ═══
  {
    // Sadə işıqlı: ağ kağız, künc işarələri, xətt ornamenti
    id: 'pure', ink: '#14201c', sub: '#4b5853', accent: '#0f6b55', ornament: 'bar', trWeight: 500,
    paint(ctx, W, H) {
      fill(ctx, W, H, '#fbfaf7')
      fill(ctx, W, H, radial(ctx, W / 2, H * 0.45, Math.max(W, H) * 0.8, [[0, 'rgba(255,255,255,0.9)'], [1, 'rgba(232,226,212,0.55)']]))
    },
    decor(ctx, W, H, t, u) { cornerMarks(ctx, W, H, t.accent, 46 * u, minSide(W, H) * 0.05, 2.4 * u, 0.6) },
  },
  {
    // Müasir qradiyent ("mesh") + incə dən
    id: 'mesh', dark: true, ink: '#ffffff', sub: 'rgba(255,255,255,0.86)', accent: '#ffd9a0', ornament: 'bar', trWeight: 500,
    paint(ctx, W, H) {
      const M = Math.max(W, H)
      fill(ctx, W, H, linear(ctx, 0, 0, W, H, [[0, '#1d2b6b'], [0.55, '#173f7a'], [1, '#0d5c63']]))
      blob(ctx, W, H, W * 0.1, H * 0.08, M * 0.7, '140,90,220', 0.55)
      blob(ctx, W, H, W * 0.95, H * 0.95, M * 0.65, '30,190,160', 0.5)
      blob(ctx, W, H, W * 0.08, H * 0.98, M * 0.5, '245,160,90', 0.38)
      blob(ctx, W, H, W * 0.92, H * 0.12, M * 0.45, '230,110,150', 0.26)
      grain(ctx, W, H, 0.6)
    },
  },
  {
    // Naxışlı çərçivə: yaşıl haşiyə zolağında qızılı xatəmlər
    id: 'ornate', ink: '#1a2f28', sub: '#45524c', accent: '#a37a26',
    paint(ctx, W, H) {
      fill(ctx, W, H, '#f7f2e6')
      fill(ctx, W, H, radial(ctx, W / 2, H / 2, Math.max(W, H) * 0.7, [[0.5, 'rgba(163,122,38,0)'], [1, 'rgba(163,122,38,0.12)']]))
    },
    decor(ctx, W, H, t, u) {
      const { m, bw } = ornateGeo(W, H)
      ctx.save()
      ctx.beginPath(); ctx.rect(m, m, W - 2 * m, H - 2 * m); ctx.rect(m + bw, m + bw, W - 2 * (m + bw), H - 2 * (m + bw))
      ctx.fillStyle = '#12493c'; ctx.fill('evenodd')
      ctx.strokeStyle = '#d9b56b'; ctx.lineWidth = 2 * u
      ctx.strokeRect(m + 6 * u, m + 6 * u, W - 2 * (m + 6 * u), H - 2 * (m + 6 * u))
      ctx.strokeRect(m + bw - 6 * u, m + bw - 6 * u, W - 2 * (m + bw - 6 * u), H - 2 * (m + bw - 6 * u))
      ctx.lineWidth = 1.2 * u; ctx.globalAlpha = 0.7
      ctx.strokeRect(m + bw + 10 * u, m + bw + 10 * u, W - 2 * (m + bw + 10 * u), H - 2 * (m + bw + 10 * u))
      ctx.globalAlpha = 1
      const c = bw / 2
      const along = (x0, y0, x1, y1) => {
        const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / (bw * 1.35)))
        for (let i = 0; i <= n; i++) {
          const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n
          ctx.fillStyle = '#d9b56b'; starPath(ctx, x, y, bw * 0.25); ctx.fill()
          if (i < n) {
            ctx.fillStyle = 'rgba(217,181,107,0.7)'
            rhombus(ctx, x + (x1 - x0) / n / 2, y + (y1 - y0) / n / 2, bw * 0.09); ctx.fill()
          }
        }
      }
      along(m + c, m + c, W - m - c, m + c)
      along(m + c, H - m - c, W - m - c, H - m - c)
      along(m + c, m + c, m + c, H - m - c)
      along(W - m - c, m + c, W - m - c, H - m - c)
      ctx.restore()
    },
    box(W, H) {
      const { m, bw } = ornateGeo(W, H), k = m + bw + minSide(W, H) * 0.06
      return insetBox(W, H, { top: k, bottom: k + 40 * unitOf(W, H), left: k, right: k })
    },
    mark: { y: (W, H, u) => { const { m, bw } = ornateGeo(W, H); return H - m - bw - 34 * u } },
  },
  {
    // Əlyazma: köhnə kağız + cədvəl (qızılı, qırmızı, lacivərd xətlər)
    id: 'manuscript', ink: '#2a1d12', sub: '#4f3b28', accent: '#8b3a2b',
    paint(ctx, W, H) {
      fill(ctx, W, H, '#efe2c4')
      const tile = paperNoise()
      if (tile) { const p = ctx.createPattern(tile, 'repeat'); fill(ctx, W, H, p); fill(ctx, W, H, p) }
      fill(ctx, W, H, radial(ctx, W / 2, H / 2, Math.max(W, H) * 0.72, [[0.45, 'rgba(110,70,20,0)'], [1, 'rgba(110,70,20,0.34)']]))
    },
    decor(ctx, W, H, t, u) {
      const m = minSide(W, H) * 0.06
      ctx.save()
      const line = (o, color, lw) => { ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.strokeRect(m + o, m + o, W - 2 * (m + o), H - 2 * (m + o)) }
      line(0, '#b58a2e', 7 * u)
      line(12 * u, '#8b3a2b', 1.8 * u)
      line(18 * u, '#2d4a7a', 1.8 * u)
      line(25 * u, '#b58a2e', 1.2 * u)
      ctx.fillStyle = '#b58a2e'
      for (const [x, y] of [[m, m], [W - m, m], [m, H - m], [W - m, H - m]]) { rhombus(ctx, x, y, 14 * u); ctx.fill() }
      ctx.restore()
    },
    box(W, H) {
      const u = unitOf(W, H), k = minSide(W, H) * 0.06 + 25 * u + minSide(W, H) * 0.05
      return insetBox(W, H, { top: k, bottom: k + 30 * u, left: k, right: k })
    },
  },
  {
    // Səhra gecəsi: ulduzlar, hilal və qum təpələri
    id: 'desert', dark: true, ink: '#f6efe0', sub: 'rgba(246,239,224,0.84)', accent: '#f0c987',
    paint(ctx, W, H) {
      fill(ctx, W, H, linear(ctx, 0, 0, 0, H, [[0, '#060a1c'], [0.55, '#18204a'], [0.82, '#4a3360'], [1, '#7a4a5c']]))
    },
    decor(ctx, W, H, t, u) {
      const r = rng(23)
      ctx.save()
      ctx.fillStyle = '#fff6dc'
      for (let i = 0; i < 130; i++) {
        ctx.globalAlpha = 0.2 + r() * 0.6
        ctx.beginPath(); ctx.arc(r() * W, r() * H * 0.78, (0.5 + r() * 1.6) * u, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 0.9
      for (let i = 0; i < 6; i++) { polyStar(ctx, r() * W, r() * H * 0.6, 4, (7 + r() * 6) * u, 1.6 * u); ctx.fill() }
      ctx.restore()
      const mr = minSide(W, H) * 0.06
      crescent(ctx, W * 0.17, mr * 2.4 + (H > W * 1.5 ? H * 0.06 : 0), mr, '#f6dfa4')
      const m = minSide(W, H)
      dunes(ctx, W, H, [
        { top: m * 0.25, amp: m * 0.025, freq: 1.3, phase: 0.5, color: '#2c2047' },
        { top: m * 0.18, amp: m * 0.03, freq: 0.9, phase: 2.1, color: '#1b1432' },
        { top: m * 0.1, amp: m * 0.02, freq: 1.7, phase: 4, color: '#0f0b1e' },
      ])
    },
    box(W, H) { return insetBox(W, H, { bottom: minSide(W, H) * 0.29 }) },
    mark: { y: (W, H) => H - minSide(W, H) * 0.05 },
  },
  {
    // Tağlar: işıqlı fonda iç-içə sivri tağ və aşağıda tağlı sıra
    id: 'arches', ink: '#3b2016', sub: '#5e3d2e', accent: '#a5532c',
    paint(ctx, W, H) { fill(ctx, W, H, linear(ctx, 0, 0, 0, H, [[0, '#f6e9dc'], [1, '#ecd2bb']])) },
    decor(ctx, W, H, t, u) {
      const ch = minSide(W, H) * 0.17, n = Math.max(5, Math.round(W / (ch * 0.75))), cw = W / n
      ctx.save()
      ctx.fillStyle = 'rgba(181,100,60,0.13)'
      for (let i = 0; i < n; i++) { archPath(ctx, i * cw + cw * 0.14, H - ch, cw * 0.72, ch); ctx.fill() }
      const a = arch2Rect(W, H)
      for (const [k, al] of [[2, 0.22], [1, 0.42]]) {
        const i = k * 16 * u
        archPath(ctx, a.x - i, a.y - i * 1.2, a.w + 2 * i, a.h + i * 1.2)
        ctx.strokeStyle = `rgba(181,100,60,${al})`; ctx.lineWidth = 1.6 * u; ctx.stroke()
      }
      archPath(ctx, a.x, a.y, a.w, a.h)
      ctx.fillStyle = '#fbf4ec'; ctx.fill()
      ctx.strokeStyle = '#b5643c'; ctx.lineWidth = 3 * u; ctx.stroke()
      ctx.restore()
    },
    box(W, H) { return archBox(arch2Rect(W, H)) },
    mark: { y: (W, H) => H - H * 0.05 },
  },
  {
    // İri yazı: tünd fon, qalın Inter, böyük kontur ulduz
    id: 'bold', dark: true, ink: '#ffffff', sub: 'rgba(255,255,255,0.8)', accent: '#e9c46a', ornament: 'bar', trWeight: 800, trBoost: 1.12, kickerPill: true,
    paint(ctx, W, H) {
      fill(ctx, W, H, '#0b1f1a')
      fill(ctx, W, H, radial(ctx, 0, 0, Math.max(W, H) * 0.9, [[0, 'rgba(233,196,106,0.14)'], [1, 'rgba(233,196,106,0)']]))
    },
    decor(ctx, W, H, t, u) {
      const m = minSide(W, H)
      ctx.save()
      ctx.strokeStyle = t.accent; ctx.lineWidth = 3 * u
      ctx.globalAlpha = 0.16
      starPath(ctx, W * 0.94, H * 0.92, m * 0.42); ctx.stroke()
      starPath(ctx, W * 0.94, H * 0.92, m * 0.3, Math.PI / 8); ctx.stroke()
      ctx.globalAlpha = 0.1
      starPath(ctx, W * 0.04, H * 0.06, m * 0.2); ctx.stroke()
      ctx.globalAlpha = 0.95; ctx.fillStyle = t.accent
      ctx.fillRect(0, 0, W, 10 * u)
      ctx.restore()
    },
  },
  {
    // İki hissə (diptix): naxışlı yaşıl panel + medalyon, mətn açıq hissədə
    id: 'split', ink: '#16332b', sub: '#45524c', accent: '#94691c',
    paint(ctx, W, H) { fill(ctx, W, H, '#f6f0e3') },
    decor(ctx, W, H, t, u) {
      const g = splitGeo(W, H)
      ctx.save()
      ctx.beginPath()
      if (g.wide) ctx.rect(0, 0, g.p, H); else ctx.rect(0, 0, W, g.p)
      ctx.clip()
      fill(ctx, W, H, linear(ctx, 0, 0, W, H, [[0, '#0f5a47'], [1, '#07362b']]))
      lattice(ctx, W, H, 100 * u, '#e0c07c', 1.4 * u, 0.3)
      ctx.restore()
      ctx.save()
      ctx.fillStyle = '#d9b56b'
      if (g.wide) ctx.fillRect(g.p - 2 * u, 0, 4 * u, H); else ctx.fillRect(0, g.p - 2 * u, W, 4 * u)
      const cx = g.wide ? g.p : W / 2, cy = g.wide ? H / 2 : g.p
      ctx.beginPath(); ctx.arc(cx, cy, g.r, 0, Math.PI * 2)
      ctx.fillStyle = '#f6f0e3'; ctx.fill()
      ctx.strokeStyle = '#d9b56b'; ctx.lineWidth = 4 * u; ctx.stroke()
      ctx.beginPath(); ctx.arc(cx, cy, g.r * 0.82, 0, Math.PI * 2)
      ctx.globalAlpha = 0.6; ctx.lineWidth = 1.4 * u; ctx.stroke(); ctx.globalAlpha = 1
      starPath(ctx, cx, cy, g.r * 0.55); ctx.fillStyle = '#0f5a47'; ctx.fill()
      starPath(ctx, cx, cy, g.r * 0.22, Math.PI / 8); ctx.fillStyle = '#d9b56b'; ctx.fill()
      ctx.restore()
    },
    box(W, H) {
      const g = splitGeo(W, H), u = unitOf(W, H)
      return g.wide ? insetBox(W, H, { left: g.p + g.r + 40 * u }) : insetBox(W, H, { top: g.p + g.r + 34 * u })
    },
    mark: {
      x: (W, H) => { const g = splitGeo(W, H); return g.wide ? g.p / 2 : undefined },
      y: (W, H, u) => (splitGeo(W, H).wide ? H - 44 * u : undefined),
      color: (st, W, H) => (splitGeo(W, H).wide ? '#f6f0e3' : ''),
    },
  },
  {
    // Pastel: yumşaq rəng ləkələri üstündə şüşə panel
    id: 'pastel', ink: '#2d2a3e', sub: '#55506b', accent: '#6f5fa3', trWeight: 500,
    paint(ctx, W, H) {
      const M = Math.max(W, H)
      fill(ctx, W, H, '#f6efe9')
      blob(ctx, W, H, W * 0.1, H * 0.1, M * 0.6, '170,220,200', 0.8)
      blob(ctx, W, H, W * 0.95, H * 0.32, M * 0.55, '205,190,240', 0.8)
      blob(ctx, W, H, W * 0.45, H * 1.05, M * 0.6, '250,200,175', 0.75)
    },
    decor(ctx, W, H, t, u) {
      const g = glassRect(W, H)
      ctx.save()
      roundRect(ctx, g.x, g.y, g.w, g.h, g.r)
      ctx.shadowColor = 'rgba(80,60,120,0.14)'; ctx.shadowBlur = 50 * u; ctx.shadowOffsetY = 12 * u
      ctx.fillStyle = 'rgba(255,255,255,0.46)'; ctx.fill()
      ctx.shadowColor = 'transparent'
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2.5 * u; ctx.stroke()
      ctx.restore()
    },
    box(W, H) {
      const g = glassRect(W, H), u = unitOf(W, H)
      return insetBox(W, H, { left: g.x + 56 * u, right: g.x + 56 * u, top: g.y + 64 * u, bottom: g.y + 104 * u })
    },
    mark: { y: (W, H, u) => { const g = glassRect(W, H); return g.y + g.h - 48 * u } },
  },
  {
    // Qara-qızılı: künclərdə qızılı şəmsələr, incə qoşa çərçivə
    id: 'noir', dark: true, ink: '#f5ead2', sub: 'rgba(245,234,210,0.8)', accent: '#d9b44a',
    paint(ctx, W, H) {
      fill(ctx, W, H, '#0c0b0a')
      fill(ctx, W, H, radial(ctx, W / 2, H / 2, Math.max(W, H) * 0.6, [[0, 'rgba(60,48,24,0.55)'], [1, 'rgba(60,48,24,0)']]))
    },
    decor(ctx, W, H, t, u) {
      const m = minSide(W, H)
      const gold = linear(ctx, 0, 0, W, H, [[0, '#f3d98b'], [0.5, '#b8892d'], [1, '#f0d27e']])
      for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H]]) rosette(ctx, x, y, m * 0.17, gold, 1.8 * u, 0.6)
      ctx.save()
      ctx.strokeStyle = gold
      const f = m * 0.035
      ctx.lineWidth = 1.8 * u; ctx.strokeRect(f, f, W - 2 * f, H - 2 * f)
      ctx.globalAlpha = 0.55; ctx.lineWidth = 1 * u
      ctx.strokeRect(f + 10 * u, f + 10 * u, W - 2 * (f + 10 * u), H - 2 * (f + 10 * u))
      ctx.restore()
    },
    box(W, H) { const k = minSide(W, H) * 0.14; return insetBox(W, H, { left: k, right: k }) },
  },
  {
    // Kaşı: ağ fon, yuxarıda və aşağıda göy kaşı zolaqları
    id: 'azure', ink: '#12304f', sub: '#3c5670', accent: '#1d4e89',
    paint(ctx, W, H) {
      fill(ctx, W, H, '#fbfdff')
      fill(ctx, W, H, radial(ctx, W / 2, H / 2, Math.max(W, H) * 0.7, [[0.4, 'rgba(29,78,137,0)'], [1, 'rgba(29,78,137,0.08)']]))
    },
    decor(ctx, W, H, t, u) {
      const h = tileH(W, H)
      tileBand(ctx, 0, 0, W, h, u, true)
      tileBand(ctx, 0, H - h, W, h, u, false)
    },
    box(W, H) {
      const h = tileH(W, H), m = minSide(W, H)
      return insetBox(W, H, { top: h + m * 0.08, bottom: h + m * 0.11 })
    },
    mark: { y: (W, H, u) => H - tileH(W, H) - 38 * u },
  },
  {
    // Medalyon: adaçayı yaşılı fonda böyük şəmsə
    id: 'medallion', ink: '#1f3a2f', sub: '#46594f', accent: '#4a7340',
    paint(ctx, W, H) { fill(ctx, W, H, linear(ctx, 0, 0, W, H, [[0, '#eef3ec'], [1, '#d3e1d1']])) },
    decor(ctx, W, H, t, u) {
      const m = minSide(W, H)
      rosette(ctx, W / 2, H / 2, m * 0.4, '#3f6b55', 2.2 * u, 0.17)
      frame(ctx, W, H, '#4f7a45', u, { alpha: 0.4 })
    },
  },
]
export const templateById = (id) => TEMPLATES.find(t => t.id === id) || TEMPLATES[0]

// ── Üslubun susma dəyərləri ──
export const DEFAULT_STYLE = Object.freeze({
  font: 'sans',       // tərcümə şrifti: sans (Inter, susma) | serif ("Kitab" — Amiri)
  arScale: 100,       // ərəb mətni ölçüsü, %
  trScale: 100,       // tərcümə ölçüsü, %
  align: 'center',    // center | start
  show: 'both',       // both | ar | tr
  bgColor: '',        // öz fon rəngi ('' = şablonun fonu)
  textColor: '',      // öz yazı rəngi
  border: 0,          // çərçivə qalınlığı (1080 px-lik kartda px)
  borderColor: '#d9b56b',
  corners: 'square',  // square | round
  opacity: 100,       // fon şəffaflığı, %
})

const isArabicScript = (s) => /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/.test(s || '')
/** Mətndə hərflərin yarıdan çoxu ərəb əlifbasındadırmı (istifadəçinin öz mətni üçün). */
export function mostlyArabic(s) {
  const letters = String(s || '').match(/\p{L}/gu) || []
  if (!letters.length) return false
  return letters.filter(isArabicScript).length / letters.length > 0.5
}

// ── Sətirlərə bölmə (sözlərlə; \n — yeni abzas) ──
export function wrapLines(ctx, text, maxW) {
  const out = []
  for (const para of String(text || '').split(/\n+/)) {
    const words = para.trim().split(/\s+/).filter(Boolean)
    let line = ''
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (line && ctx.measureText(test).width > maxW) { out.push(line); line = w } else line = test
    }
    if (line) out.push(line)
  }
  return out
}

const setFont = (ctx, weight, size, family) => { ctx.font = `${weight} ${Math.round(size * 100) / 100}px ${family}` }
const trySet = (ctx, key, val) => { try { if (key in ctx) ctx[key] = val } catch { /* köhnə brauzer */ } }

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Kartın vahidi: 1080 px-lik kartda 1. "Yazı" (1200×630) üçün bir az kiçik. */
export const unitOf = (W, H) => Math.min(W, H * 1.4) / 1080

/** Mətn sahəsi — şablonun öz sahəsi, yoxdursa kənarlardan boşluq. Hekayədə
 *  Instagram-ın üst/alt düymələri üçün təhlükəsiz zona saxlanılır. */
export function contentBox(tpl, W, H) {
  const b = tpl?.box ? tpl.box(W, H) : baseBox(W, H)
  if (H / W > 2) {
    // Telefon fonu: yuxarı ~34% — kilid ekranının saatı və tarixi, aşağı ~16% —
    // bildirişlər, fənər/kamera düymələri. Mətn yalnız aradakı sahəyə yerləşir.
    const top = H * 0.34, bottom = H * 0.84
    const y = Math.max(b.y, top)
    const y2 = Math.min(b.y + b.h, bottom)
    return { ...b, y, h: Math.max(H * 0.2, y2 - y) }
  }
  return b
}
function baseBox(W, H) {
  const story = H / W > 1.6
  const wide = W / H > 1.6
  const px = W * (wide ? 0.09 : 0.115)
  const top = story ? H * 0.15 : H * (wide ? 0.1 : 0.1)
  const bottom = story ? H * 0.17 : H * (wide ? 0.15 : 0.13)
  return { x: px, y: top, w: W - 2 * px, h: H - top - bottom }
}

/**
 * Mətn bloklarını ölçür: verilmiş f əmsalında ümumi hündürlük və sətirlər.
 * Bloklar: [növ etiketi] → ornament → ərəbcə → tərcümə → xətt → istinad.
 */
function measure(ctx, card, box, u, f) {
  const st = card.style
  const tpl = card.template || {}
  const k = Math.min(1, Math.max(f, 0.72))
  const parts = []
  const rtlUi = card.lang === 'ar'
  if (card.kicker) {
    const size = 21 * u * k
    parts.push({ type: 'kicker', size, h: size * (tpl.kickerPill ? 2 : 1.3), gap: 18 * u * k })
  }
  if (tpl.ornament !== 'none') parts.push({ type: 'ornament', size: 13 * u * k, h: 26 * u * k, gap: 40 * u * f })
  if (card.ar) {
    const size = 60 * u * (st.arScale / 100) * f
    setFont(ctx, 400, size, F_AR)
    const lines = wrapLines(ctx, card.ar, box.w)
    parts.push({ type: 'ar', size, lines, lh: size * 1.85, h: lines.length * size * 1.85, gap: 26 * u * f })
  }
  if (card.text) {
    const serif = st.font === 'serif'
    const arText = isArabicScript(card.text)
    // Amiri-nin latın hərfləri Inter-dən kiçik görünür — bir az iri
    const size = (serif || arText ? 43 : 38) * u * (st.trScale / 100) * f * (card.ar ? 1 : 1.15) * (tpl.trBoost || 1)
    const fam = arText ? F_AR : (serif ? F_SERIF : F_SANS)
    const weight = arText || serif ? ((tpl.trWeight || 0) >= 700 ? 700 : 400) : (tpl.trWeight || 450)
    setFont(ctx, weight, size, fam)
    const lines = wrapLines(ctx, card.text, box.w)
    const lh = size * (serif || arText ? 1.55 : (weight >= 700 ? 1.32 : 1.45))
    parts.push({ type: 'tr', size, fam, weight, lines, lh, h: lines.length * lh, gap: 0 })
  }
  if (card.ref) {
    const size = 25 * u * k
    setFont(ctx, 600, size, rtlUi ? F_AR_UI : F_SANS)
    const lines = wrapLines(ctx, card.ref, box.w)
    parts.push({ type: 'divider', h: 2 * u, gap: 26 * u * k, before: 38 * u * k })
    parts.push({ type: 'ref', size, lines, lh: size * 1.35, h: lines.length * size * 1.35, gap: 0 })
  }
  let total = 0
  parts.forEach((p, i) => { total += (p.before || 0) + p.h + (i < parts.length - 1 ? p.gap : 0) })
  return { parts, total }
}

/** Ən böyük sığan ölçünü tapır (f: 1 → 0.3). overflow: ən kiçikdə də sığmır. */
export function fitText(ctx, card, box, u) {
  // Qısa mətn bir az iri başlayır (kart boş görünməsin), sonra sığana qədər
  // kiçilir. Hekayədə (9:16) şaquli yer çoxdur — başlanğıc daha iri
  let f = box.h / box.w > 1.4 ? 1.5 : 1.25
  let m = measure(ctx, card, box, u, f)
  while (m.total > box.h && f > 0.3) {
    f = Math.max(0.3, f * 0.93)
    m = measure(ctx, card, box, u, f)
    if (f === 0.3) break
  }
  return { ...m, f, overflow: m.total > box.h + 1 }
}

/**
 * Kartı çəkir. ctx-in koordinatları W×H məntiqi pikseldədir.
 * card = { template, style, ar, text, ref, kicker, lang, watermark }
 *
 * opts (hərəkətli kart üçün — utils/quoteMotion; PNG/önizləmə onsuz çağırır):
 *   bg      — fon + naxış (susmaya görə true)
 *   paint   — yalnız fon (susmaya görə bg ilə eyni)
 *   decor   — yalnız şablonun naxışı/çərçivəsi/ayı (susmaya görə bg ilə eyni)
 *   border  — istifadəçinin çərçivə xətti (susmaya görə bg ilə eyni)
 *   text    — mətn + işarə (susmaya görə true)
 *   clear   — əvvəlcə kanvası təmizlə (susmaya görə true)
 *   reveal  — (i, kind) => { a, dy } | null: i-ci mətn elementinin şəffaflığı
 *             və şaquli sürüşməsi. Elementlər: kicker, ornament, ərəbcə və
 *             tərcümənin HƏR SƏTRİ, divider, istinadın hər sətri, watermark.
 *
 * Qaytarır: { overflow, scale, items } — items: çəkilən mətn elementləri
 * ardıcıllıqla [{ kind, len }] (len — simvol sayı; animasiyanın tempi üçün).
 */
export function renderCard(ctx, card, W, H, opts = {}) {
  const { bg = true, paint = bg, decor = bg, border = bg, text = true, clear = true, reveal = null } = opts
  const tpl = card.template || TEMPLATES[0]
  const st = { ...DEFAULT_STYLE, ...(card.style || {}) }
  const u = unitOf(W, H)
  const ink = st.textColor || tpl.ink
  const sub = st.textColor || tpl.sub
  const accent = tpl.accent

  ctx.save()
  if (clear) ctx.clearRect(0, 0, W, H)
  if (st.corners === 'round') {
    roundRect(ctx, 0, 0, W, H, Math.min(W, H) * 0.06)
    ctx.clip()
  }

  // ── Fon (şəffaflıq yalnız fona aiddir) ──
  if (paint) {
    ctx.save()
    ctx.globalAlpha = Math.min(1, Math.max(0.3, st.opacity / 100))
    if (st.bgColor) fill(ctx, W, H, st.bgColor)
    else tpl.paint(ctx, W, H)
    ctx.restore()
  }
  if (decor && tpl.decor) {
    ctx.save()
    if (st.bgColor) ctx.globalAlpha = 0.85
    tpl.decor(ctx, W, H, tpl, u)
    ctx.restore()
  }
  if (border && st.border > 0) {
    const bw = st.border * u
    ctx.save()
    ctx.strokeStyle = st.borderColor
    ctx.lineWidth = bw
    if (st.corners === 'round') { roundRect(ctx, bw / 2, bw / 2, W - bw, H - bw, Math.min(W, H) * 0.06 - bw / 2); ctx.stroke() } else ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw)
    ctx.restore()
  }

  // ── Mətn ──
  const box = contentBox(tpl, W, H)
  const show = card.ar && card.text ? st.show : 'both'
  const body = {
    ...card,
    template: tpl,
    style: st,
    ar: show === 'tr' ? '' : card.ar,
    text: show === 'ar' ? '' : card.text,
  }
  const lay = fitText(ctx, body, box, u)
  const rtlUi = card.lang === 'ar'
  const center = st.align !== 'start'
  // Başlanğıc kənarı: ərəbcə həmişə sağdan; tərcümə interfeys dilinin istiqamətində
  const xFor = (rtl) => (center ? box.x + box.w / 2 : rtl ? box.x + box.w : box.x)
  const alignFor = (rtl) => (center ? 'center' : rtl ? 'right' : 'left')

  // Hər mətn elementi step()-dən keçir: reveal verilibsə şəffaflıq (A) və
  // şaquli sürüşmə (dy) tətbiq olunur; yoxdursa element olduğu kimi çəkilir.
  const items = []
  let A = 1
  const step = (kind, len, draw) => {
    const idx = items.length
    items.push({ kind, len })
    if (!text) return
    const r = reveal ? reveal(idx, kind) : null
    A = r ? Math.max(0, Math.min(1, r.a)) : 1
    if (A <= 0.002) return
    ctx.save()
    ctx.globalAlpha = A
    if (r?.dy) ctx.translate(0, r.dy)
    draw()
    ctx.restore()
  }

  ctx.textBaseline = 'middle'
  let y = box.y + Math.max(0, (box.h - lay.total) / 2)
  lay.parts.forEach((p, i) => {
    y += p.before || 0
    const y0 = y
    if (p.type === 'kicker') {
      const label = rtlUi ? card.kicker : card.kicker.toLocaleUpperCase(card.lang || 'az')
      step('kicker', label.length, () => {
        setFont(ctx, 600, p.size, rtlUi ? F_AR_UI : F_SANS)
        trySet(ctx, 'letterSpacing', rtlUi ? '0px' : `${(p.size * 0.16).toFixed(1)}px`)
        ctx.direction = rtlUi ? 'rtl' : 'ltr'
        ctx.textAlign = alignFor(rtlUi)
        ctx.fillStyle = accent
        ctx.globalAlpha = 0.95 * A
        if (tpl.kickerPill) {
          // Hap şəklində etiket (İri yazı şablonu)
          const tw = ctx.measureText(label).width, ph = p.size * 1.85, padX = p.size * 0.9
          const x0 = center ? box.x + box.w / 2 - tw / 2 : rtlUi ? box.x + box.w - tw : box.x
          ctx.save()
          roundRect(ctx, x0 - padX, y0 + (p.h - ph) / 2, tw + padX * 2, ph, ph / 2)
          ctx.globalAlpha = 0.16 * A; ctx.fill()
          ctx.globalAlpha = 0.9 * A; ctx.strokeStyle = accent; ctx.lineWidth = 1.5 * u; ctx.stroke()
          ctx.restore()
        }
        ctx.fillText(label, xFor(rtlUi) + (tpl.kickerPill && !center ? (rtlUi ? -1 : 1) * p.size * 0.9 : 0), y0 + p.h / 2)
        trySet(ctx, 'letterSpacing', '0px')
      })
    } else if (p.type === 'ornament') {
      // Xatəm ulduzu və iki tərəfə incə xətlər (kənara düzləndikdə — bir tərəfə)
      const startRtl = rtlUi || (!body.text && Boolean(body.ar))
      if (tpl.ornament === 'bar') {
        // Qısa qalın xətt (müasir şablonlar)
        step('ornament', 0, () => {
          const bw = 64 * u, bh = 6 * u
          const bx = center ? box.x + box.w / 2 - bw / 2 : startRtl ? box.x + box.w - bw : box.x
          ctx.fillStyle = accent
          roundRect(ctx, bx, y0 + p.h / 2 - bh / 2, bw, bh, bh / 2); ctx.fill()
        })
        y += p.h + p.gap
        return
      }
      step('ornament', 0, () => {
        const cx = center ? box.x + box.w / 2 : startRtl ? box.x + box.w - p.size : box.x + p.size
        const cy = y0 + p.h / 2
        ctx.fillStyle = accent; ctx.strokeStyle = accent
        starPath(ctx, cx, cy, p.size); ctx.fill()
        ctx.globalAlpha = 0.7 * A; ctx.lineWidth = 1.6 * u
        const len = 70 * u, gap = p.size + 12 * u
        ctx.beginPath()
        if (center || startRtl) { ctx.moveTo(cx - gap, cy); ctx.lineTo(cx - gap - len, cy) }
        if (center || !startRtl) { ctx.moveTo(cx + gap, cy); ctx.lineTo(cx + gap + len, cy) }
        ctx.stroke()
      })
    } else if (p.type === 'ar') {
      p.lines.forEach((ln, j) => step('ar', ln.length, () => {
        setFont(ctx, 400, p.size, F_AR)
        ctx.direction = 'rtl'
        ctx.textAlign = alignFor(true)
        ctx.fillStyle = ink
        ctx.fillText(ln, xFor(true), y0 + j * p.lh + p.lh / 2)
      }))
    } else if (p.type === 'tr') {
      const rtl = rtlUi || isArabicScript(body.text)
      p.lines.forEach((ln, j) => step('tr', ln.length, () => {
        setFont(ctx, p.weight, p.size, p.fam)
        ctx.direction = rtl ? 'rtl' : 'ltr'
        ctx.textAlign = alignFor(rtl)
        ctx.fillStyle = body.ar ? sub : ink
        ctx.fillText(ln, xFor(rtl), y0 + j * p.lh + p.lh / 2)
      }))
    } else if (p.type === 'divider') {
      step('divider', 0, () => {
        const w = 56 * u
        const x = center ? box.x + box.w / 2 - w / 2 : rtlUi ? box.x + box.w - w : box.x
        ctx.fillStyle = accent
        ctx.globalAlpha = 0.85 * A
        ctx.fillRect(x, y0, w, p.h)
      })
    } else if (p.type === 'ref') {
      p.lines.forEach((ln, j) => step('ref', ln.length, () => {
        setFont(ctx, 600, p.size, rtlUi ? F_AR_UI : F_SANS)
        trySet(ctx, 'letterSpacing', rtlUi ? '0px' : `${(p.size * 0.04).toFixed(1)}px`)
        ctx.direction = rtlUi ? 'rtl' : 'ltr'
        ctx.textAlign = alignFor(rtlUi)
        ctx.fillStyle = st.textColor || (tpl.dark ? accent : tpl.sub)
        ctx.fillText(ln, xFor(rtlUi), y0 + j * p.lh + p.lh / 2)
        trySet(ctx, 'letterSpacing', '0px')
      }))
    }
    y += p.h + (i < lay.parts.length - 1 ? p.gap : 0)
  })

  // ── muslims.cc işarəsi (kartın altında, kiçik) ──
  if (card.watermark) {
    step('watermark', 0, () => {
      const story = H / W > 1.6
      const size = 22 * u
      setFont(ctx, 600, size, F_SANS)
      trySet(ctx, 'letterSpacing', `${(size * 0.16).toFixed(1)}px`)
      ctx.direction = 'ltr'
      ctx.textAlign = 'center'
      // Şablon öz yerini/rəngini verə bilər (tağ, zolaq, panel — mətnin üstünə düşməsin)
      const mk = tpl.mark || {}
      ctx.fillStyle = mk.color?.(st, W, H) || sub
      ctx.globalAlpha = 0.72 * A
      // Telefon fonunda işarə kilid düymələrinin üstündə, mətnin altında
    const wy = H / W > 2 ? H * 0.875 : (mk.y?.(W, H, u) ?? (story ? H - H * 0.11 : H - Math.max(Math.min(W, H) * 0.075, 44 * u)))
      ctx.fillText(card.watermark, mk.x?.(W, H, u) ?? W / 2, wy)
      trySet(ctx, 'letterSpacing', '0px')
    })
  }
  ctx.restore()
  return { overflow: lay.overflow, scale: lay.f, items }
}

/** Şablon miniatürü. card verilibsə — HƏMİN mətnlə tam kart (seçicidə istifadəçi
 *  öz sitatını hər şablonda görür); yoxdursa fon + iki "mətn" zolağı. */
export function renderThumb(ctx, tpl, W, H, card = null) {
  if (card) return renderCard(ctx, { ...card, template: tpl, style: { ...DEFAULT_STYLE, ...(card.style || {}), bgColor: '' } }, W, H)
  const u = unitOf(W, H)
  ctx.save()
  ctx.clearRect(0, 0, W, H)
  tpl.paint(ctx, W, H)
  if (tpl.decor) tpl.decor(ctx, W, H, tpl, u)
  const box = contentBox(tpl, W, H)
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2
  ctx.fillStyle = tpl.accent
  starPath(ctx, cx, cy - 150 * u, 20 * u); ctx.fill()
  ctx.fillStyle = tpl.ink
  roundRect(ctx, cx - box.w * 0.36, cy - 60 * u, box.w * 0.72, 46 * u, 23 * u); ctx.fill()
  ctx.globalAlpha = 0.6
  roundRect(ctx, cx - box.w * 0.26, cy + 30 * u, box.w * 0.52, 34 * u, 17 * u); ctx.fill()
  ctx.restore()
}

/** Kartdakı şriftlər yüklənsin (unicode-range alt dəstləri mətnə görə seçilir). */
export function ensureFonts(card) {
  if (!hasDoc || !document.fonts?.load) return Promise.resolve()
  const txt = `${card.text || ''} ${card.ref || ''}${card.kicker || ''} muslims.cc`
  // Inter dəyişən şriftdir (bir fayl — bütün qalınlıqlar); Amiri 400 və 700 ayrıdır
  const jobs = [
    document.fonts.load('400 40px Amiri', card.ar || 'بسم'),
    document.fonts.load('400 40px Amiri', card.text || 'Aa'),
    document.fonts.load('700 40px Amiri', card.text || 'Aa'),
    document.fonts.load('450 40px Inter', txt),
    document.fonts.load('800 40px Inter', txt),
  ]
  if (card.lang === 'ar') jobs.push(document.fonts.load('600 40px "IBM Plex Sans Arabic"', `${card.ref || ''}${card.kicker || ''}`))
  return Promise.all(jobs).then(() => undefined, () => undefined)
}

/** Tam ölçülü PNG (Blob). */
export async function renderPng(card, format) {
  await ensureFonts(card)
  const c = offscreen(format.w, format.h)
  renderCard(c.getContext('2d'), card, format.w, format.h)
  return new Promise((resolve, reject) => {
    if (c.toBlob) c.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png')
    else {
      // Çox köhnə brauzer: data URL → Blob
      const bin = atob(c.toDataURL('image/png').split(',')[1])
      const arr = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
      resolve(new Blob([arr], { type: 'image/png' }))
    }
  })
}

// ── Yükləmə / paylaşma ──
export const isIOS = () => typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
const isStandalone = () => typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)

/**
 * iOS-da ana ekrana əlavə olunmuş tətbiqdə (standalone) <a download> işləmir —
 * şəkil yeni tabda açılır (basıb saxlayıb "Şəkli saxla"). Pəncərə klik anında
 * (await-dən ƏVVƏL) açılmalıdır, yoxsa brauzer onu bloklayır.
 */
export function preopenWindow() {
  if (!isIOS() || !isStandalone()) return null
  try { return window.open('', '_blank') } catch { return null }
}

/** Blob-u fayl kimi saxla. Qaytarır: 'download' | 'tab'. */
export function saveBlob(blob, filename, win = null) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const canDownload = 'download' in a
  if (win || !canDownload) {
    if (win) win.location.href = url
    else window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 120_000)
    return 'tab'
  }
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return 'download'
}

/** Web Share API Level 2: faylla paylaşmaq mümkündürmü. */
export function canShareFile(file) {
  try { return Boolean(navigator.share && navigator.canShare?.({ files: [file] })) } catch { return false }
}
