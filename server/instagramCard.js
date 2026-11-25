// ═══════════════════════════════════════════════════════════════════════
// Instagram kartı — server tərəfində JPEG (server/instagram.js, scripts/instagram.js)
//
//   renderCard(content, { format: 'feed'|'story', theme: 'day'|'night', lang }) → Promise<Buffer|null>
//     feed 1080×1350 (4:5), story 1080×1920 (9:16). null — mətn oxunaqlı ölçüdə sığmır (çağıran başqa
//     element seçir; mətn heç vaxt qısaldılmır və dəyişdirilmir).
//
// • sharp (libvips + pango/harfbuzz). Quran mətni (ayə, Allahın adları — Uthmani işarələri: ۡ ۚ ٰ ۭ …) — "Amiri Quran"
//   (Amiri layihəsinin Quran üçün variantı: dayanma işarələri, kiçik hərflər, xəncər əlif düzgün oturur); hədis / dua —
//   Amiri; latın/kiril — MccInter (saytın Inter-i, "ə" daxil). Şriftlər server/fonts/ (OFL 1.1). Fon — fiqurlu SVG.
// • Ərəb mətninin yoxlanması (arabicIssues): şriftdə olmayan simvol (→ "tofu") və ya sətir / söz əvvəlində duran hərəkə
//   (HarfBuzz ona ◌ — U+25CC — qoyur) varsa kart ÇƏKİLMİR (null), çağıran sıradakı elementi götürür. Mətn dəyişdirilmir.
//   Yeganə görüntü normallaşdırması (displayArabic): alquran.cloud dayanma işarəsini (U+06D6–U+06DC) sözdən BOŞLUQLA
//   ayırır ("ٱللَّهِ ۚ"); Tanzil / mushafdakı kimi sözə bitişik çəkilir ("ٱللَّهِۚ") — hərf və işarələr eynidir, yalnız
//   aradakı boşluq kartda göstərilmir (caption-da mətn olduğu kimidir). Əks halda işarə sətrin üstündə "uçur" və ya
//   sətir sonunda tək qalır.
// • sharp TƏNBƏL yüklənir: IG sönülüdürsə API prosesi libvips-i heç yükləmir (konteyner mem_limit 320m).
// • Dizayn: saytın palitrası (zümrüd #0f5a47 / qum #e6cc95, gecə variantı), xatəm ornamenti, "muslims.cc".
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const path = require('node:path')

const FONT_DIR = path.join(__dirname, 'fonts')
const FONT = {
  quran: { family: 'Amiri Quran', file: 'AmiriQuran.ttf' },
  ar: { family: 'Amiri', file: 'Amiri-Regular.ttf' },
  arBold: { family: 'Amiri Bold', file: 'Amiri-Bold.ttf' },
  ui: { family: 'MccInter', file: 'MccInter-Regular.ttf' },
  uiSemi: { family: 'MccInterSemi', file: 'MccInter-SemiBold.ttf' },
}

const SIZES = { feed: { w: 1080, h: 1350 }, story: { w: 1080, h: 1920 } }
// Story-də yuxarı / aşağı ~250 px Instagram-ın öz düymələri altındadır — mətn ora düşmür
const FRAME = {
  feed: { top: 92, bottom: 92, padX: 120, ar: 64, arMin: 40, tr: 40, trMin: 30, name: 170, nameMin: 110 },
  story: { top: 270, bottom: 280, padX: 110, ar: 72, arMin: 44, tr: 44, trMin: 32, name: 190, nameMin: 120 },
}
const SCALES = [1, 0.92, 0.85, 0.78, 0.72, 0.66, 0.6, 0.55]
const MAX_TEXT = 650   // bundan uzun mətn kartda oxunmur — dərhal rədd (render cəhdi də yoxdur)

const THEMES = {
  day: { bg1: '#146a53', bg2: '#0a3a2e', gold: '#e6cc95', text: '#f8f3e6', soft: '#d5e6dc', ar: '#f6e7c3' },
  night: { bg1: '#132634', bg2: '#060d14', gold: '#e6cc95', text: '#f3efe6', soft: '#bcc8d2', ar: '#f1e2bd' },
}

let sharpLib = null
function loadSharp() {
  if (sharpLib) return sharpLib
  // Konteynerdə sistem şrifti / fontconfig konfiqi yoxdur: yalnız bizim qovluq (keş /tmp-də). Windows-da lazım deyil.
  if (process.platform !== 'win32' && !process.env.FONTCONFIG_FILE) process.env.FONTCONFIG_FILE = path.join(FONT_DIR, 'fonts.conf')
  sharpLib = require('sharp')
  sharpLib.concurrency(1)
  sharpLib.cache(false)
  return sharpLib
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const clean = (s) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()
const HAS_ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/

// ── Şriftin cmap-ı (format 4 / 12) — hansı simvolların qlifi var ──
const cmapCache = new Map()
function fontCoverage(file) {
  if (cmapCache.has(file)) return cmapCache.get(file)
  const b = require('node:fs').readFileSync(path.join(FONT_DIR, file))
  const n = b.readUInt16BE(4)
  let cmap = -1
  for (let i = 0; i < n; i++) if (b.toString('latin1', 12 + i * 16, 16 + i * 16) === 'cmap') cmap = b.readUInt32BE(12 + i * 16 + 8)
  if (cmap < 0) throw new Error(`cmap yoxdur: ${file}`)
  const subs = []
  for (let i = 0, k = b.readUInt16BE(cmap + 2); i < k; i++) {
    const o = cmap + 4 + i * 8
    subs.push({ pid: b.readUInt16BE(o), eid: b.readUInt16BE(o + 2), off: cmap + b.readUInt32BE(o + 4) })
  }
  const pick = subs.find((x) => x.pid === 3 && x.eid === 10) || subs.find((x) => x.pid === 0 && b.readUInt16BE(x.off) === 12) ||
    subs.find((x) => x.pid === 3 && x.eid === 1) || subs.find((x) => x.pid === 0)
  const ranges = []   // [start, end] — qlif id 0 olmayan aralıqlar (format 4-də idRangeOffset nəzərə alınır)
  const fmt = b.readUInt16BE(pick.off)
  if (fmt === 12) {
    for (let i = 0, g = b.readUInt32BE(pick.off + 12); i < g; i++) {
      const o = pick.off + 16 + i * 12
      ranges.push([b.readUInt32BE(o), b.readUInt32BE(o + 4)])
    }
  } else if (fmt === 4) {
    const seg = b.readUInt16BE(pick.off + 6) / 2
    const ends = pick.off + 14, starts = ends + seg * 2 + 2, deltas = starts + seg * 2, ros = deltas + seg * 2
    for (let i = 0; i < seg; i++) {
      const end = b.readUInt16BE(ends + i * 2), start = b.readUInt16BE(starts + i * 2)
      const delta = b.readInt16BE(deltas + i * 2), ro = b.readUInt16BE(ros + i * 2)
      if (start === 0xffff) continue
      for (let c = start; c <= end; c++) {
        let g
        if (!ro) g = (c + delta) & 0xffff
        else { g = b.readUInt16BE(ros + i * 2 + ro + (c - start) * 2); if (g) g = (g + delta) & 0xffff }
        if (g) { const last = ranges[ranges.length - 1]; if (last && last[1] === c - 1) last[1] = c; else ranges.push([c, c]) }
      }
    }
  } else throw new Error(`cmap formatı ${fmt}: ${file}`)
  const has = (cp) => { for (const [a, z] of ranges) if (cp >= a && cp <= z) return true; return false }
  cmapCache.set(file, has)
  return has
}

// Quran dayanma işarələri U+06D6–U+06DC (ۖ ۗ ۘ ۙ ۚ ۛ ۜ)
const PAUSE_BEFORE_RE = /\s+([ۖ-ۜ])/gu
/** Kartda göstərmə: sözdən boşluqla ayrılmış dayanma işarəsini sözə bitişdir (hərf / işarə dəyişmir). */
const displayArabic = (s) => clean(s).replace(PAUSE_BEFORE_RE, '$1')
const MARK_RE = /\p{M}/u
const IGNORABLE = new Set([0x20, 0xa0, 0x200c, 0x200d, 0x200e, 0x200f, 0x2060])

/**
 * Ərəb mətni kartda düzgün çəkilə bilərmi? → problemlərin siyahısı (boş — hər şey qaydasındadır).
 *   missing:U+XXXX — şriftdə qlif yoxdur (tofu / başqa şriftə düşmə → hərəkə öz hərfinə bağlanmır);
 *   orphan-mark:U+XXXX — hərəkə mətnin / sözün əvvəlindədir (HarfBuzz ◌ U+25CC qoyur).
 */
function arabicIssues(text, font = 'ar') {
  const f = FONT[font] || FONT.ar
  const has = fontCoverage(f.file)
  const out = new Set()
  const s = displayArabic(text)
  const cps = [...s]
  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i].codePointAt(0)
    const hex = 'U+' + cp.toString(16).toUpperCase().padStart(4, '0')
    if (!IGNORABLE.has(cp) && !has(cp)) out.add(`missing:${hex}`)
    if (MARK_RE.test(cps[i]) && (i === 0 || /\s/u.test(cps[i - 1]))) out.add(`orphan-mark:${hex}`)
  }
  return [...out]
}

/** Bir mətn qatı (şəffaf PNG) → { data, w, h } */
async function textLayer({ text, font, size, color, width, spacing, letter = 0 }) {
  const sharp = loadSharp()
  const f = FONT[font]
  const arabic = font === 'ar' || font === 'arBold' || font === 'quran'
  const attrs = `foreground="${color}"${arabic ? ' lang="ar"' : ''}${letter ? ` letter_spacing="${Math.round(letter * 1024)}"` : ''}`
  const { data, info } = await sharp({
    text: {
      text: `<span ${attrs}>${esc(text)}</span>`,
      font: `${f.family} ${size}`,
      fontfile: path.join(FONT_DIR, f.file),
      width, align: 'centre', rgba: true, wrap: 'word', dpi: 72,
      ...(spacing ? { spacing: Math.round(spacing) } : {}),
    },
  }).png().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}

// ── Xatəm (8 guşəli ulduz: iki kvadrat) ──
function starPoints(cx, cy, r, rot) {
  const pts = []
  for (let k = 0; k < 4; k++) {
    const a = rot + (k * Math.PI) / 2
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}
function khatam(cx, cy, r, { stroke, width = 2, opacity = 1, fill = 'none', dot = 0, dotColor = stroke }) {
  return `<g fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-opacity="${opacity}" stroke-linejoin="round">` +
    `<polygon points="${starPoints(cx, cy, r, -Math.PI / 4)}"/><polygon points="${starPoints(cx, cy, r, 0)}"/></g>` +
    (dot ? `<circle cx="${cx}" cy="${cy}" r="${dot}" fill="${dotColor}"/>` : '')
}

function background(fmt, theme, { sepY = null, footY }) {
  const { w: W, h: H } = SIZES[fmt]
  const t = THEMES[theme] || THEMES.day
  const fr = FRAME[fmt]
  const starY = fr.top + 44
  const sep = sepY == null ? '' : (
    `<line x1="${W / 2 - 150}" y1="${sepY}" x2="${W / 2 - 28}" y2="${sepY}" stroke="${t.gold}" stroke-opacity="0.55" stroke-width="2"/>` +
    `<line x1="${W / 2 + 28}" y1="${sepY}" x2="${W / 2 + 150}" y2="${sepY}" stroke="${t.gold}" stroke-opacity="0.55" stroke-width="2"/>` +
    khatam(W / 2, sepY, 13, { stroke: t.gold, width: 2, opacity: 0.85 }))
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${t.bg1}"/><stop offset="1" stop-color="${t.bg2}"/></linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.42" r="0.62"><stop offset="0" stop-color="${t.gold}" stop-opacity="0.13"/><stop offset="1" stop-color="${t.gold}" stop-opacity="0"/></radialGradient>
  <pattern id="p" width="135" height="135" patternUnits="userSpaceOnUse">${khatam(67.5, 67.5, 38, { stroke: t.gold, width: 1.4, opacity: 0.075 })}${khatam(0, 0, 18, { stroke: t.gold, width: 1.2, opacity: 0.06 })}${khatam(135, 0, 18, { stroke: t.gold, width: 1.2, opacity: 0.06 })}${khatam(0, 135, 18, { stroke: t.gold, width: 1.2, opacity: 0.06 })}${khatam(135, 135, 18, { stroke: t.gold, width: 1.2, opacity: 0.06 })}</pattern>
</defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>
<rect width="${W}" height="${H}" fill="url(#p)"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
<rect x="38" y="38" width="${W - 76}" height="${H - 76}" rx="30" fill="none" stroke="${t.gold}" stroke-opacity="0.5" stroke-width="2"/>
<rect x="52" y="52" width="${W - 104}" height="${H - 104}" rx="22" fill="none" stroke="${t.gold}" stroke-opacity="0.2" stroke-width="1"/>
${[[52, 52], [W - 52, 52], [52, H - 52], [W - 52, H - 52]].map(([x, y]) => khatam(x, y, 11, { stroke: t.gold, width: 1.6, opacity: 0.7, fill: t.bg2 })).join('')}
${khatam(W / 2, starY, 40, { stroke: t.gold, width: 2.6, opacity: 0.95, dot: 7 })}
<circle cx="${W / 2}" cy="${starY}" r="21" fill="none" stroke="${t.gold}" stroke-opacity="0.55" stroke-width="1.4"/>
${sep}
<line x1="${W / 2 - 60}" y1="${footY}" x2="${W / 2 + 60}" y2="${footY}" stroke="${t.gold}" stroke-opacity="0.45" stroke-width="1.5"/>
</svg>`)
}

/**
 * content: { kind, title, ar, text, ref, tl? } — text: tərcümə (boş ola bilər: ar dili), tl: ad kartında transliterasiya.
 * Kart sığmırsa null.
 */
async function renderCard(content, { format = 'feed', theme = 'day', lang = 'az' } = {}) {
  const fmt = SIZES[format] ? format : 'feed'
  const { w: W, h: H } = SIZES[fmt]
  const fr = FRAME[fmt]
  const t = THEMES[theme] || THEMES.day
  const width = W - 2 * fr.padX
  const isAr = lang === 'ar'
  const ui = isAr ? 'ar' : 'ui', uiSemi = isAr ? 'arBold' : 'uiSemi'
  const ar = displayArabic(content && content.ar), text = clean(content && content.text)
  if (!ar || ar.length > MAX_TEXT || text.length > MAX_TEXT) return null
  const isName = content.kind === 'name'
  const arFont = arabicFontFor(content.kind)
  // Şriftdə olmayan simvol / yetim hərəkə — kart çəkilmir (çağıran loglayır və sıradakını götürür)
  if (arabicIssues(ar, arFont).length) return null

  // ── Başlıq, istinad, nişan ──
  const titleText = isAr ? clean(content.title) : clean(content.title).toLocaleUpperCase(lang === 'tr' || lang === 'az' ? 'tr' : lang)
  const title = await textLayer({ text: titleText, font: uiSemi, size: isAr ? 38 : 28, color: t.gold, width, letter: isAr ? 0 : 4 })
  const ref = content.ref ? await textLayer({ text: clean(content.ref), font: uiSemi, size: isAr ? 36 : 30, color: t.gold, width }) : null
  const mark = await textLayer({ text: 'muslims.cc', font: 'uiSemi', size: 34, color: t.gold, width, letter: 3 })

  const titleY = fr.top + 44 + 40 + 30
  const markY = H - fr.bottom - mark.h
  const footY = markY - 26
  const refY = ref ? footY - 34 - ref.h : footY
  const areaTop = titleY + title.h + 48
  const areaBottom = refY - 44
  const avail = areaBottom - areaTop

  // Qeyd: sharp-ın "spacing"-i sətirlər ARASINA əlavə olunan boşluqdur (px, dpi 72), sətir hündürlüyü deyil.
  // ── Əsas mətn: ölçünü kiçildərək sığdır; ən kiçik oxunaqlı ölçüdə də sığmırsa — null ──
  let blocks = null
  for (const s of SCALES) {
    const parts = []
    if (isName) {
      const size = Math.round(fr.name * s)
      if (size < fr.nameMin) break
      parts.push({ layer: await textLayer({ text: ar, font: arFont, size, color: t.ar, width }), gap: 34 })
      if (content.tl) parts.push({ layer: await textLayer({ text: clean(content.tl), font: 'uiSemi', size: Math.round(46 * Math.max(s, 0.8)), color: t.gold, width, letter: 1 }), gap: 30 })
      if (text) parts.push({ layer: await textLayer({ text, font: ui, size: Math.max(Math.round(fr.tr * s), fr.trMin), color: t.text, width, spacing: Math.max(Math.round(fr.tr * s), fr.trMin) * 0.3 }), gap: 0 })
    } else {
      const arSize = Math.round(fr.ar * (text ? s : Math.min(1.15, s * 1.15)))
      if (arSize < fr.arMin) break
      parts.push({ layer: await textLayer({ text: ar, font: arFont, size: arSize, color: t.ar, width }), gap: 0, sepAfter: Boolean(text) })
      if (text) {
        const trSize = Math.max(Math.round(fr.tr * s), fr.trMin)
        parts.push({ layer: await textLayer({ text, font: ui, size: trSize, color: t.text, width, spacing: isAr ? 0 : trSize * 0.3 }), gap: 0 })
      }
    }
    const SEP = 96   // ayırıcı xətt + boşluqlar
    const total = parts.reduce((n, p, i) => n + p.layer.h + (p.sepAfter ? SEP : 0) + (i < parts.length - 1 ? p.gap : 0), 0)
    if (total <= avail && parts.every((p) => p.layer.w <= width + 2)) { blocks = { parts, total, SEP }; break }
  }
  if (!blocks) return null

  // ── Yerləşdirmə ──
  const comps = []
  const center = (layer, y) => ({ input: layer.data, top: Math.round(y), left: Math.round((W - layer.w) / 2) })
  comps.push(center(title, titleY))
  let y = areaTop + Math.max(0, Math.floor((avail - blocks.total) / 2))
  let sepY = null
  for (let i = 0; i < blocks.parts.length; i++) {
    const p = blocks.parts[i]
    comps.push(center(p.layer, y))
    y += p.layer.h
    if (p.sepAfter) { sepY = Math.round(y + blocks.SEP / 2); y += blocks.SEP }
    if (i < blocks.parts.length - 1) y += p.gap
  }
  if (ref) comps.push(center(ref, refY))
  comps.push(center(mark, markY))

  const sharp = loadSharp()
  const bg = await sharp(background(fmt, theme, { sepY, footY })).png().toBuffer()
  return sharp(bg).composite(comps).flatten({ background: t.bg2 }).toColourspace('srgb')
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4' }).toBuffer()
}

/** Kartın ölçüsü (testlər, CLI). */
const sizeOf = (format) => SIZES[format] || SIZES.feed

/** Ərəb mətninin şrifti: Quran mətni (ayə, Allahın adları — Uthmani yazılışı) — Amiri Quran; hədis / dua — Amiri. */
const arabicFontFor = (kind) => (kind === 'ayah' || kind === 'name' ? 'quran' : 'ar')

/** content → problemlər (boş — çəkilə bilər). instagram.js atlananı loglamaq üçün çağırır. */
const contentIssues = (content) => arabicIssues(content && content.ar, arabicFontFor(content && content.kind))

/**
 * Şrift seçiminin özünü yoxlama (CLI check-glyphs, testlər): fontconfig hər ailə adına HƏQİQƏTƏN fərqli üz verirmi?
 * Eyni nümunə üç ərəb ailəsi ilə çəkilir — çıxışlar cüt-cüt fərqli olmalıdır (eynidirsə — bir ailə başqasına düşüb).
 */
async function fontSelfTest() {
  const probe = 'وَكَفَىٰ بِٱللَّهِۚ'
  const hash = async (font) => {
    const l = await textLayer({ text: probe, font, size: 60, color: '#000000', width: 900 })
    return require('node:crypto').createHash('sha256').update(l.data).digest('hex')
  }
  const r = { quran: await hash('quran'), ar: await hash('ar'), arBold: await hash('arBold') }
  const lat = { ui: await textLayer({ text: 'Hamburgefonstiv əğış', font: 'ui', size: 40, color: '#000000', width: 900 }),
    ar: await textLayer({ text: 'Hamburgefonstiv əğış', font: 'ar', size: 40, color: '#000000', width: 900 }) }
  const ok = r.quran !== r.ar && r.quran !== r.arBold && r.ar !== r.arBold && !lat.ui.data.equals(lat.ar.data)
  return { ok, distinct: { quranVsAmiri: r.quran !== r.ar, quranVsBold: r.quran !== r.arBold, amiriVsBold: r.ar !== r.arBold, interVsAmiri: !lat.ui.data.equals(lat.ar.data) } }
}

module.exports = {
  renderCard, sizeOf, SIZES, THEMES, HAS_ARABIC, loadSharp, arabicIssues, contentIssues, displayArabic, arabicFontFor, fontSelfTest,
  fontCoverage, FONT, _textLayer: textLayer, _esc: esc, _clean: clean,
}
