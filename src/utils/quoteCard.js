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
  { id: 'post',     w: 1200, h: 630 },
]
export const formatById = (id) => FORMATS.find(f => f.id === id) || FORMATS[0]

// ── Şriftlər (layihədə öz serverimizdədir — src/assets/fonts) ──
const F_AR = '"Amiri", "Noto Naskh Arabic", "Scheherazade New", serif'
const F_SERIF = '"Literata", Georgia, "Times New Roman", serif'
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
    box(W, H) {
      const a = archRect(W, H)
      const spring = a.y + Math.min(a.w * 0.42, a.h * 0.38)
      const top = a.y + (spring - a.y) * 0.55
      return { x: a.x + a.w * 0.1, y: top, w: a.w * 0.8, h: a.y + a.h - top - a.h * 0.12 }
    },
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
]
export const templateById = (id) => TEMPLATES.find(t => t.id === id) || TEMPLATES[0]

// ── Üslubun susma dəyərləri ──
export const DEFAULT_STYLE = Object.freeze({
  font: 'serif',      // tərcümə şrifti: serif (Literata) | sans (Inter)
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
  if (tpl.box) return tpl.box(W, H)
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
  const k = Math.min(1, Math.max(f, 0.72))
  const parts = []
  const rtlUi = card.lang === 'ar'
  if (card.kicker) {
    const size = 21 * u * k
    parts.push({ type: 'kicker', size, h: size * 1.3, gap: 18 * u * k })
  }
  parts.push({ type: 'ornament', size: 13 * u * k, h: 26 * u * k, gap: 40 * u * f })
  if (card.ar) {
    const size = 60 * u * (st.arScale / 100) * f
    setFont(ctx, 400, size, F_AR)
    const lines = wrapLines(ctx, card.ar, box.w)
    parts.push({ type: 'ar', size, lines, lh: size * 1.85, h: lines.length * size * 1.85, gap: 26 * u * f })
  }
  if (card.text) {
    const serif = st.font !== 'sans'
    const size = (serif ? 40 : 38) * u * (st.trScale / 100) * f * (card.ar ? 1 : 1.15)
    const fam = isArabicScript(card.text) ? F_AR : (serif ? F_SERIF : F_SANS)
    setFont(ctx, serif ? 400 : 450, size, fam)
    const lines = wrapLines(ctx, card.text, box.w)
    parts.push({ type: 'tr', size, fam, weight: serif ? 400 : 450, lines, lh: size * 1.48, h: lines.length * size * 1.48, gap: 0 })
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
 * Qaytarır: { overflow } — mətn ən kiçik ölçüdə də sığmayıbsa true.
 */
export function renderCard(ctx, card, W, H) {
  const tpl = card.template || TEMPLATES[0]
  const st = { ...DEFAULT_STYLE, ...(card.style || {}) }
  const u = unitOf(W, H)
  const ink = st.textColor || tpl.ink
  const sub = st.textColor || tpl.sub
  const accent = tpl.accent

  ctx.save()
  ctx.clearRect(0, 0, W, H)
  if (st.corners === 'round') {
    roundRect(ctx, 0, 0, W, H, Math.min(W, H) * 0.06)
    ctx.clip()
  }

  // ── Fon (şəffaflıq yalnız fona aiddir) ──
  ctx.save()
  ctx.globalAlpha = Math.min(1, Math.max(0.3, st.opacity / 100))
  if (st.bgColor) fill(ctx, W, H, st.bgColor)
  else tpl.paint(ctx, W, H)
  ctx.restore()
  if (tpl.decor) {
    ctx.save()
    if (st.bgColor) ctx.globalAlpha = 0.85
    tpl.decor(ctx, W, H, tpl, u)
    ctx.restore()
  }
  if (st.border > 0) {
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

  ctx.textBaseline = 'middle'
  let y = box.y + Math.max(0, (box.h - lay.total) / 2)
  lay.parts.forEach((p, i) => {
    y += p.before || 0
    if (p.type === 'kicker') {
      const label = rtlUi ? card.kicker : card.kicker.toLocaleUpperCase(card.lang || 'az')
      setFont(ctx, 600, p.size, rtlUi ? F_AR_UI : F_SANS)
      trySet(ctx, 'letterSpacing', rtlUi ? '0px' : `${(p.size * 0.22).toFixed(1)}px`)
      ctx.direction = rtlUi ? 'rtl' : 'ltr'
      ctx.textAlign = alignFor(rtlUi)
      ctx.fillStyle = accent
      ctx.globalAlpha = 0.95
      ctx.fillText(label, xFor(rtlUi), y + p.h / 2)
      ctx.globalAlpha = 1
      trySet(ctx, 'letterSpacing', '0px')
    } else if (p.type === 'ornament') {
      // Xatəm ulduzu və iki tərəfə incə xətlər (kənara düzləndikdə — bir tərəfə)
      const startRtl = rtlUi || (!body.text && Boolean(body.ar))
      const cx = center ? box.x + box.w / 2 : startRtl ? box.x + box.w - p.size : box.x + p.size
      const cy = y + p.h / 2
      ctx.save()
      ctx.fillStyle = accent; ctx.strokeStyle = accent
      starPath(ctx, cx, cy, p.size); ctx.fill()
      ctx.globalAlpha = 0.7; ctx.lineWidth = 1.6 * u
      const len = 70 * u, gap = p.size + 12 * u
      ctx.beginPath()
      if (center || startRtl) { ctx.moveTo(cx - gap, cy); ctx.lineTo(cx - gap - len, cy) }
      if (center || !startRtl) { ctx.moveTo(cx + gap, cy); ctx.lineTo(cx + gap + len, cy) }
      ctx.stroke()
      ctx.restore()
    } else if (p.type === 'ar') {
      setFont(ctx, 400, p.size, F_AR)
      ctx.direction = 'rtl'
      ctx.textAlign = alignFor(true)
      ctx.fillStyle = ink
      p.lines.forEach((ln, j) => ctx.fillText(ln, xFor(true), y + j * p.lh + p.lh / 2))
    } else if (p.type === 'tr') {
      const rtl = rtlUi || isArabicScript(body.text)
      setFont(ctx, p.weight, p.size, p.fam)
      ctx.direction = rtl ? 'rtl' : 'ltr'
      ctx.textAlign = alignFor(rtl)
      ctx.fillStyle = body.ar ? sub : ink
      p.lines.forEach((ln, j) => ctx.fillText(ln, xFor(rtl), y + j * p.lh + p.lh / 2))
    } else if (p.type === 'divider') {
      const w = 56 * u
      const x = center ? box.x + box.w / 2 - w / 2 : rtlUi ? box.x + box.w - w : box.x
      ctx.fillStyle = accent
      ctx.globalAlpha = 0.85
      ctx.fillRect(x, y, w, p.h)
      ctx.globalAlpha = 1
    } else if (p.type === 'ref') {
      setFont(ctx, 600, p.size, rtlUi ? F_AR_UI : F_SANS)
      trySet(ctx, 'letterSpacing', rtlUi ? '0px' : `${(p.size * 0.04).toFixed(1)}px`)
      ctx.direction = rtlUi ? 'rtl' : 'ltr'
      ctx.textAlign = alignFor(rtlUi)
      ctx.fillStyle = st.textColor || (tpl.dark ? accent : tpl.sub)
      p.lines.forEach((ln, j) => ctx.fillText(ln, xFor(rtlUi), y + j * p.lh + p.lh / 2))
      trySet(ctx, 'letterSpacing', '0px')
    }
    y += p.h + (i < lay.parts.length - 1 ? p.gap : 0)
  })

  // ── muslims.cc işarəsi (kartın altında, kiçik) ──
  if (card.watermark) {
    const story = H / W > 1.6
    const size = 22 * u
    setFont(ctx, 600, size, F_SANS)
    trySet(ctx, 'letterSpacing', `${(size * 0.16).toFixed(1)}px`)
    ctx.direction = 'ltr'
    ctx.textAlign = 'center'
    ctx.fillStyle = tpl.id === 'mihrab' && !st.bgColor ? '#f7f1e3' : sub
    ctx.globalAlpha = 0.72
    const wy = story ? H - H * 0.11 : tpl.id === 'mihrab' ? H - H * 0.035 : H - Math.max(Math.min(W, H) * 0.075, 44 * u)
    ctx.fillText(card.watermark, W / 2, wy)
    ctx.globalAlpha = 1
    trySet(ctx, 'letterSpacing', '0px')
  }
  ctx.restore()
  return { overflow: lay.overflow, scale: lay.f }
}

/** Şablon miniatürü: yalnız fon + iki "mətn" zolağı (seçicidə). */
export function renderThumb(ctx, tpl, W, H) {
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
  const jobs = [
    document.fonts.load('400 40px Amiri', card.ar || 'بسم'),
    document.fonts.load('400 40px Literata', card.text || 'Aa'),
    document.fonts.load('450 40px Inter', `${card.text || ''} ${card.ref || ''} muslims.cc`),
    document.fonts.load('600 40px Inter', `${card.ref || ''}${card.kicker || ''} muslims.cc`),
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
