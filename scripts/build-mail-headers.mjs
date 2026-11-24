// ═══════════════════════════════════════════════════════════════════════
// Admin məktublarının (server/mailer.js renderCampaign) animasiyalı başlıqları — hər rəng mövzusuna bir GIF
//
//   node scripts/build-mail-headers.mjs [--theme dawn] [--frames-dir <qovluq>]
//
// Çıxış:
//   public/email/header-<mövzu>-v1.gif   — 600×220, ≤ 350 KB, tikişsiz dövr (dawn | night | festive | sand)
//   public/email/thumb-<mövzu>-v1.webp   — 300×110, 1-ci kadr (admin paneldə şablon kartının şəkli)
//   emerald mövzusu = mövcud public/email/welcome-v1.gif (scripts/build-welcome-gif.mjs) — onun yalnız
//   kiçik şəkli buradan çıxarılır.
//
// • Yanaşma build-welcome-gif.mjs ilə eynidir: SVG → Playwright (Chromium) kadrları (t ∈ [0,1) JS ilə
//   qurulur, deterministik) → sharp animasiyalı GIF. Əlavə asılılıq yoxdur.
// • Bütün hərəkətlər t-yə görə dövridir (ulduz 45° fırlanır — 8 guşəli simmetriya, fənərlər sin(2πt)
//   ilə yırğalanır, parıltılar faza ilə sayrışır) → tikişsiz dövr.
// • Outlook yalnız 1-ci kadrı göstərir — t=0 tam görünüşdür (söz nişanının parıltısı kənardadır).
// • CANLI VARLIQ YOXDUR: yalnız 8 guşəli ulduz, aypara, abstrakt fənərlər, ulduzcuqlar, qızılı işıq.
// • Versiyalı ad (-v1): dizayn dəyişsə v2 et, köhnə məktublar köhnə şəkli göstərməyə davam etsin.
// ═══════════════════════════════════════════════════════════════════════
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdir, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null }
const ONLY = arg('--theme')
const FRAMES_DIR = arg('--frames-dir')
const OUT_DIR = path.join(ROOT, 'public/email')

const W = 600, H = 220
const FRAMES = 36            // 36 × 84 ms ≈ 3.0 s
const DELAY = 84
const MAX_BYTES = 350 * 1024
const THUMB_W = 300, THUMB_H = 110

// Mövzular: fon, qızılı (emblem), söz nişanının parıltısı, bəzək növü
const THEMES = {
  // Qızılı şəfəq — Ramazan: tünd gavalı → kəhrəba üfüq, yırğalanan abstrakt fənərlər
  dawn: {
    bg: { type: 'linear', stops: [[0, '#1d0f2b'], [0.55, '#4a2213'], [1, '#9a5622']] },
    horizon: '#f2b65a', lattice: '#d9a24e', gold: ['#fbe3a2', '#eabf62', '#c08a35'],
    shine: ['#e9bd62', '#f2cd7a', '#fff4d2'], glow: '#f4d58a', twinkle: '#fbe7b8',
    decor: 'lanterns', twinkles: 9,
  },
  // Tünd göy, ulduzlu gecə — Cümə
  night: {
    bg: { type: 'radial', stops: [[0, '#1a2f6b'], [0.55, '#0e1c45'], [1, '#070f29']] },
    lattice: '#3c5aa8', gold: ['#f6e2a4', '#e3bf66', '#b98f3e'],
    shine: ['#e3bf66', '#ecca78', '#fff7dc'], glow: '#f1d68e', twinkle: '#f3ecd0',
    decor: 'stars', twinkles: 34,
  },
  // Bayram — firuzəyi + qızılı: çələng, parıldayan ulduzcuqlar
  festive: {
    bg: { type: 'radial', stops: [[0, '#0f7476'], [0.55, '#08494d'], [1, '#042d31']] },
    lattice: '#3fa59c', gold: ['#fbe7a8', '#efc766', '#c49536'],
    shine: ['#efc766', '#f6d887', '#fffbe6'], glow: '#f7dc8e', twinkle: '#fff0c2',
    decor: 'garland', twinkles: 12,
  },
  // Yumşaq qum — sadə məktub: açıq fon, qəhvəyi söz nişanı
  sand: {
    bg: { type: 'radial', stops: [[0, '#f8f0e2'], [0.6, '#f0e4cf'], [1, '#e6d5ba']] },
    lattice: '#b88f58', gold: ['#a57636', '#8a5f2a', '#6e4a20'],
    shine: ['#6b4a26', '#7d5830', '#c99a5e'], glow: '#e8c792', twinkle: '#b98a4e',
    decor: 'none', twinkles: 0, light: true,
  },
}

const sq = (r) => `M${-r},${-r}H${r}V${r}H${-r}Z`
const star4 = (r) => `M0,${-r} L${r * 0.22},${-r * 0.22} L${r},0 L${r * 0.22},${r * 0.22} L0,${r} L${-r * 0.22},${r * 0.22} L${-r},0 L${-r * 0.22},${-r * 0.22} Z`
const star8 = (r) => {
  const pts = []
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2
    const rr = i % 2 ? r * 0.55 : r
    pts.push(`${(rr * Math.cos(a)).toFixed(2)},${(rr * Math.sin(a)).toFixed(2)}`)
  }
  return `M${pts.join(' L')} Z`
}

// Psevdo-təsadüfi, amma sabit (hər qurulumda eyni GIF)
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32) }

function twinkleList(n, seed) {
  const r = rng(seed)
  const out = []
  // söz nişanı (x 225–575, y 70–150) və emblem (x 20–215) üzərinə düşməsin
  while (out.length < n) {
    const x = 8 + r() * (W - 16), y = 8 + r() * (H - 16)
    const onWord = x > 222 && x < 580 && y > 66 && y < 156
    const onEmblem = x < 220 && y > 12 && y < 208
    if (onWord || onEmblem) continue
    out.push([Math.round(x), Math.round(y), Number(r().toFixed(2)), Number((0.9 + r() * 0.9).toFixed(2))])
  }
  return out
}

function decorSvg(th) {
  if (th.decor === 'lanterns') {
    // Abstrakt fənərlər: ip + qapaq + altıbucaqlı gövdə + içində işıq (canlı varlıq deyil)
    const L = [[258, 18, 0.0], [334, 6, 0.33], [536, 24, 0.66], [584, 10, 0.15]]
    return L.map(([x, len, ph], i) => `
      <g class="lantern" data-ph="${ph}" transform="translate(${x} 0)">
        <line x1="0" y1="0" x2="0" y2="${len}" stroke="url(#gold)" stroke-width="1.2"/>
        <g transform="translate(0 ${len})">
          <path d="M-5,0 H5 L7,4 H-7 Z" fill="url(#gold)"/>
          <path d="M-7,4 L-10,12 L-10,26 L-7,34 H7 L10,26 L10,12 L7,4 Z" fill="#3a1c0c" stroke="url(#gold)" stroke-width="1.4"/>
          <ellipse class="lglow" cx="0" cy="19" rx="5" ry="9" fill="#f6c76a" opacity="0.85"/>
          <path d="M-10,19 H10 M0,4 V34" stroke="url(#gold)" stroke-width="0.6" opacity="0.6"/>
          <path d="M-5,34 H5 L2,39 H-2 Z" fill="url(#gold)"/>
          ${i % 2 ? '' : '<circle cx="0" cy="42" r="1.6" fill="url(#gold)"/>'}
        </g>
      </g>`).join('')
  }
  if (th.decor === 'stars') {
    // Uzaqda iki böyük 8 guşəli ulduz konturu (sabit — fırlanma GIF-i 350 KB-dan böyüdürdü)
    return `
      <g transform="translate(600 0)" opacity="0.22"><g class="bigstar" data-dir="0">
        <path d="${star8(120)}" fill="none" stroke="#8fa6e6" stroke-width="1"/>
        <path d="${star8(84)}" fill="none" stroke="#8fa6e6" stroke-width="0.8"/></g></g>
      <g transform="translate(330 214)" opacity="0.14"><g class="bigstar" data-dir="0">
        <path d="${star8(70)}" fill="none" stroke="#8fa6e6" stroke-width="0.9"/></g></g>`
  }
  if (th.decor === 'garland') {
    // Yuxarıda çələng (zəncir əyrisi) + asılı kiçik 8 guşəli ulduzlar
    const pts = []
    for (let i = 0; i <= 12; i++) {
      const x = 236 + i * 30
      const y = 14 + 16 * Math.sin((Math.PI * i) / 12)
      pts.push([x, y])
    }
    const curve = 'M' + pts.map(([x, y]) => `${x},${y.toFixed(1)}`).join(' L')
    return `<path d="${curve}" fill="none" stroke="url(#gold)" stroke-width="1.3" opacity="0.9"/>` +
      pts.map(([x, y], i) => i % 2
        ? `<g transform="translate(${x} ${(y + 3).toFixed(1)})"><path d="${sq(2.6)}" transform="rotate(45)" fill="url(#gold)"/></g>`
        : `<g class="gstar" data-ph="${(i / 12).toFixed(2)}" transform="translate(${x} ${(y + 12).toFixed(1)})"><line x1="0" y1="-12" x2="0" y2="-5" stroke="url(#gold)" stroke-width="0.8"/><path d="${star8(5.5)}" fill="url(#gold)"/></g>`).join('') +
      // Parıltı partlayışları (4 guşəli)
      [[30, 30, 0.1], [196, 196, 0.45], [578, 186, 0.75], [252, 196, 0.3], [520, 170, 0.9]].map(([x, y, ph]) =>
        `<g transform="translate(${x} ${y})"><path class="spark" data-ph="${ph}" d="${star4(9)}" fill="#fff3c4"/></g>`).join('')
  }
  return ''
}

function html(th) {
  const g = th.bg
  const bgDef = g.type === 'linear'
    ? `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">${g.stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`
    : `<radialGradient id="bg" cx="30%" cy="45%" r="85%">${g.stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`
  const tw = twinkleList(th.twinkles, th.decor.length * 97 + th.twinkles)
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:${g.stops[1][1]}}
  svg{display:block}
</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${bgDef}
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${th.glow}" stop-opacity="${th.light ? 0.6 : 0.55}"/>
      <stop offset="0.45" stop-color="${th.glow}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="${th.glow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="hz" cx="0.5" cy="1" r="0.75">
      <stop offset="0" stop-color="${th.horizon || th.glow}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${th.horizon || th.glow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${th.gold[0]}"/><stop offset="0.5" stop-color="${th.gold[1]}"/><stop offset="1" stop-color="${th.gold[2]}"/>
    </linearGradient>
    <linearGradient id="shine" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="120" y2="0">
      <stop offset="0" stop-color="${th.shine[0]}"/><stop offset="0.38" stop-color="${th.shine[1]}"/>
      <stop offset="0.5" stop-color="${th.shine[2]}"/><stop offset="0.62" stop-color="${th.shine[1]}"/>
      <stop offset="1" stop-color="${th.shine[0]}"/>
    </linearGradient>
    <pattern id="lattice" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M22 4 L26 18 L40 22 L26 26 L22 40 L18 26 L4 22 L18 18 Z" fill="none" stroke="${th.lattice}" stroke-width="0.8" opacity="${th.light ? 0.32 : 0.3}"/>
    </pattern>
    <mask id="fade">
      <linearGradient id="fadeG" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.25"/><stop offset="1" stop-color="#fff" stop-opacity="0.6"/>
      </linearGradient>
      <rect width="${W}" height="${H}" fill="url(#fadeG)"/>
    </mask>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${th.horizon ? `<ellipse id="horizon" cx="${W / 2}" cy="${H + 30}" rx="${W * 0.7}" ry="150" fill="url(#hz)"/>` : ''}
  <rect width="${W}" height="${H}" fill="url(#lattice)" mask="url(#fade)"/>
  <g id="twinkles" fill="${th.twinkle}"></g>
  ${decorSvg(th)}

  <g transform="translate(118 110)">
    <circle id="halo" r="96" fill="url(#glow)"/>
    <g id="star">
      <g fill="none" stroke="url(#gold)" stroke-width="3" stroke-linejoin="round">
        <path d="${sq(46)}"/><path d="${sq(46)}" transform="rotate(45)"/>
      </g>
      <g fill="none" stroke="${th.gold[1]}" stroke-width="1.2" opacity="0.75">
        <path d="${sq(33)}"/><path d="${sq(33)}" transform="rotate(45)"/>
      </g>
      <circle r="22" fill="none" stroke="url(#gold)" stroke-width="2"/>
    </g>
    <mask id="bite"><rect x="-30" y="-30" width="60" height="60" fill="#fff"/><circle cx="6.5" cy="-3.5" r="12.5" fill="#000"/></mask>
    <circle r="15" fill="url(#gold)" mask="url(#bite)"/>
  </g>

  <g>
    <text x="232" y="122" font-family="Georgia, 'Times New Roman', serif" font-size="58" font-weight="700"
      letter-spacing="0.5" fill="url(#shine)">Muslims<tspan fill="url(#shine)" opacity="0.92">.cc</tspan></text>
    <rect x="234" y="144" width="250" height="1.5" fill="url(#gold)" opacity="0.55"/>
    <g transform="translate(496 145) rotate(45)"><rect x="-3.2" y="-3.2" width="6.4" height="6.4" fill="${th.gold[1]}"/></g>
  </g>
</svg>
<script>
  const TW = ${JSON.stringify(tw)}
  const tw = document.getElementById('twinkles')
  const nodes = TW.map(([x, y, , r]) => {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', r)
    tw.appendChild(c); return c
  })
  const q = (s) => Array.from(document.querySelectorAll(s))
  window.frame = (t) => {
    const TAU = Math.PI * 2
    document.getElementById('star').setAttribute('transform', 'rotate(' + (t * 45).toFixed(3) + ')')
    const pulse = 0.5 + 0.5 * Math.cos(TAU * t)
    const halo = document.getElementById('halo')
    halo.setAttribute('opacity', (0.7 + 0.3 * pulse).toFixed(3)); halo.setAttribute('r', (90 + 8 * pulse).toFixed(2))
    const hz = document.getElementById('horizon')
    if (hz) hz.setAttribute('opacity', (0.75 + 0.25 * pulse).toFixed(3))
    // Söz nişanının parıltısı: dövrün ilk 55%-ində sola→sağa, t=0 — kənarda
    const p = Math.min(1, t / 0.55), e = p * p * (3 - 2 * p)
    const x = 72 + e * (562 - 72)
    const g = document.getElementById('shine')
    g.setAttribute('x1', (x - 60).toFixed(2)); g.setAttribute('x2', (x + 60).toFixed(2))
    nodes.forEach((n, i) => {
      const v = 0.5 + 0.5 * Math.cos(TAU * (t - TW[i][2]))
      n.setAttribute('opacity', (0.25 + 0.7 * v).toFixed(3))
      n.setAttribute('r', (TW[i][3] * (0.7 + 0.5 * v)).toFixed(2))
    })
    q('.lantern').forEach((el) => {
      const ph = Number(el.dataset.ph)
      const base = el.getAttribute('transform').replace(/ rotate\\([^)]*\\)/, '')
      el.setAttribute('transform', base + ' rotate(' + (4 * Math.sin(TAU * (t - ph))).toFixed(3) + ')')
    })
    q('.lglow').forEach((el, i) => el.setAttribute('opacity', (0.65 + 0.3 * (0.5 + 0.5 * Math.cos(TAU * (t - i * 0.25)))).toFixed(3)))
    q('.bigstar').forEach((el) => el.setAttribute('transform', 'rotate(' + (Number(el.dataset.dir) * t * 45).toFixed(3) + ')'))
    q('.gstar').forEach((el) => {
      const base = el.getAttribute('transform').replace(/ rotate\\([^)]*\\)/, '')
      el.setAttribute('transform', base + ' rotate(' + (6 * Math.sin(TAU * (t - Number(el.dataset.ph)))).toFixed(3) + ')')
    })
    q('.spark').forEach((el) => {
      const s = Math.max(0, Math.sin(TAU * (t - Number(el.dataset.ph))))
      el.setAttribute('transform', 'scale(' + (0.15 + 0.85 * s * s).toFixed(3) + ') rotate(' + (t * 90).toFixed(2) + ')')
      el.setAttribute('opacity', (0.2 + 0.8 * s).toFixed(3))
    })
  }
  window.frame(0)
</script>
</body></html>`
}

async function thumbFrom(input, name) {
  const out = path.join(OUT_DIR, `thumb-${name}-v1.webp`)
  await sharp(input, { page: 0 }).resize(THUMB_W, THUMB_H).webp({ quality: 78 }).toFile(out)
  const { size } = await stat(out)
  console.log(`${path.relative(ROOT, out)}: ${(size / 1024).toFixed(1)} KB`)
}

async function build(page, name, th) {
  await page.setContent(html(th), { waitUntil: 'load' })
  await page.evaluate('document.fonts.ready')
  const frames = []
  for (let i = 0; i < FRAMES; i++) {
    await page.evaluate(`window.frame(${i / FRAMES})`)
    const png = await page.screenshot({ clip: { x: 0, y: 0, width: W, height: H }, type: 'png' })
    frames.push(png)
    if (FRAMES_DIR) {
      await mkdir(path.join(FRAMES_DIR, name), { recursive: true })
      await writeFile(path.join(FRAMES_DIR, name, `f${String(i).padStart(2, '0')}.png`), png)
    }
  }
  const gif = await sharp(frames, { join: { animated: true } })
    .gif({ loop: 0, delay: new Array(FRAMES).fill(DELAY), colours: 96, effort: 10, dither: 0.5, interFrameMaxError: 10, interPaletteMaxError: 12 })
    .toBuffer()
  const out = path.join(OUT_DIR, `header-${name}-v1.gif`)
  await writeFile(out, gif)
  const { size } = await stat(out)
  const meta = await sharp(out, { animated: true }).metadata()
  console.log(`${path.relative(ROOT, out)}: ${(size / 1024).toFixed(1)} KB, ${meta.width}×${meta.pageHeight}, ${meta.pages} kadr, ${FRAMES * DELAY} ms dövr`)
  if (size > MAX_BYTES) { console.error(`✗ ${name}: ${MAX_BYTES / 1024} KB həddi aşılıb`); process.exitCode = 1 }
  await thumbFrom(frames[0], name)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const names = Object.keys(THEMES).filter((n) => !ONLY || n === ONLY)
  if (!ONLY || ONLY === 'emerald') await thumbFrom(path.join(OUT_DIR, 'welcome-v1.gif'), 'emerald')
  if (!names.length) return
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
    for (const n of names) await build(page, n, THEMES[n])
  } finally {
    await browser.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
