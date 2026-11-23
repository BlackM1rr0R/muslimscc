// ═══════════════════════════════════════════════════════════════════════
// Xoş gəldin məktubunun animasiyalı başlığı → public/email/welcome-v1.gif
//
//   node scripts/build-welcome-gif.mjs [--out <fayl>] [--frames-dir <qovluq>]
//
// • E-poçt proqramları (Gmail) CSS animasiyasını silir — yeganə etibarlı yol GIF-dir.
// • Kadrlar Playwright (Chromium) ilə SVG-dən çəkilir: hər kadr üçün t ∈ [0,1) vəziyyəti
//   JS ilə qurulur (CSS vaxtına bağlı deyil → deterministik), sonra sharp (libvips + cgif)
//   onları animasiyalı GIF-ə yığır. Heç bir əlavə asılılıq yoxdur.
// • Fırlanan 8 guşəli ulduz (Rub əl-Hizb, 45° simmetriya → 1 dövrdə 45° = tikişsiz dövr),
//   yumşaq qızılı işıq, aypara, "Muslims.cc" yazısı üzərindən keçən qızılı parıltı.
//   CANLI VARLIQ YOXDUR.
// • Outlook yalnız 1-ci kadrı göstərir — t=0 kadrı tam görünüşdür (parıltı kənardadır).
// • Ölçü həddi: 350 KB (aşılsa skript xəta ilə bitir).
// • Məktubdakı ünvan: https://muslims.cc/email/welcome-v1.gif (versiyalı ad — dəyişsə v2 et,
//   köhnə məktublar köhnə şəkli göstərməyə davam etsin).
// ═══════════════════════════════════════════════════════════════════════
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdir, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null }
const OUT = path.resolve(arg('--out') || path.join(ROOT, 'public/email/welcome-v1.gif'))
const FRAMES_DIR = arg('--frames-dir')

const W = 600, H = 220
const FRAMES = 36            // 36 × 84 ms ≈ 3.0 s
const DELAY = 84
const MAX_BYTES = 350 * 1024

// 8 guşəli ulduz: iki üst-üstə kvadrat (45° fırlanmış)
const sq = (r) => `M${-r},${-r}H${r}V${r}H${-r}Z`

const HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:#062a20}
  svg{display:block}
</style></head><body>
<svg id="s" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="30%" cy="45%" r="85%">
      <stop offset="0" stop-color="#0d4434"/>
      <stop offset="0.55" stop-color="#083326"/>
      <stop offset="1" stop-color="#04211a"/>
    </radialGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#f4d58a" stop-opacity="0.55"/>
      <stop offset="0.45" stop-color="#d9a84a" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#d9a84a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f6dc96"/>
      <stop offset="0.5" stop-color="#e0b65c"/>
      <stop offset="1" stop-color="#b9893a"/>
    </linearGradient>
    <!-- Parıltı: hərəkət edən açıq zolaq (x1/x2 hər kadrda yerini dəyişir) -->
    <linearGradient id="shine" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="120" y2="0">
      <stop offset="0" stop-color="#e0b65c"/>
      <stop offset="0.38" stop-color="#e8c16a"/>
      <stop offset="0.5" stop-color="#fff6d8"/>
      <stop offset="0.62" stop-color="#e8c16a"/>
      <stop offset="1" stop-color="#e0b65c"/>
    </linearGradient>
    <pattern id="lattice" width="44" height="44" patternUnits="userSpaceOnUse">
      <g fill="none" stroke="#2f7a5f" stroke-width="0.8" opacity="0.35">
        <path d="M22 4 L26 18 L40 22 L26 26 L22 40 L18 26 L4 22 L18 18 Z"/>
      </g>
    </pattern>
    <mask id="fade">
      <linearGradient id="fadeG" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0.9"/>
        <stop offset="0.5" stop-color="#fff" stop-opacity="0.25"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0.6"/>
      </linearGradient>
      <rect width="${W}" height="${H}" fill="url(#fadeG)"/>
    </mask>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#lattice)" mask="url(#fade)"/>

  <!-- Kiçik ulduzcuqlar (göy cisimləri; dövrə uyğun sayrışır) -->
  <g id="twinkles" fill="#f6e3ad"></g>

  <!-- Emblem: işıq + fırlanan ulduz -->
  <g transform="translate(118 110)">
    <circle id="halo" r="96" fill="url(#glow)"/>
    <g id="star">
      <g fill="none" stroke="url(#gold)" stroke-width="3" stroke-linejoin="round">
        <path d="${sq(46)}"/>
        <path d="${sq(46)}" transform="rotate(45)"/>
      </g>
      <g fill="none" stroke="#e8c16a" stroke-width="1.2" opacity="0.75">
        <path d="${sq(33)}"/>
        <path d="${sq(33)}" transform="rotate(45)"/>
      </g>
      <circle r="22" fill="none" stroke="url(#gold)" stroke-width="2"/>
    </g>
    <!-- Aypara (sabit; ulduzun mərkəzində) -->
    <mask id="bite"><rect x="-30" y="-30" width="60" height="60" fill="#fff"/><circle cx="6.5" cy="-3.5" r="12.5" fill="#000"/></mask>
    <circle id="crescent" r="15" fill="url(#gold)" mask="url(#bite)"/>
  </g>

  <!-- Söz nişanı -->
  <g id="word">
    <text x="232" y="122" font-family="Georgia, 'Times New Roman', serif" font-size="58" font-weight="700"
      letter-spacing="0.5" fill="url(#shine)" id="wm">Muslims<tspan fill="url(#shine)" opacity="0.92">.cc</tspan></text>
    <rect x="234" y="144" width="250" height="1.5" fill="url(#gold)" opacity="0.55"/>
    <g transform="translate(496 145) rotate(45)"><rect x="-3.2" y="-3.2" width="6.4" height="6.4" fill="#e0b65c"/></g>
  </g>
</svg>
<script>
  const TW = [[24,28,0.0],[214,34,0.35],[318,22,0.7],[548,30,0.15],[580,92,0.55],[262,188,0.85],[452,196,0.25],[560,180,0.6],[30,190,0.45],[402,40,0.9],[506,62,0.05]]
  const tw = document.getElementById('twinkles')
  const nodes = TW.map(([x, y]) => {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 1.4)
    tw.appendChild(c); return c
  })
  window.frame = (t) => {
    const TAU = Math.PI * 2
    document.getElementById('star').setAttribute('transform', 'rotate(' + (t * 45).toFixed(3) + ')')
    const pulse = 0.5 + 0.5 * Math.cos(TAU * t)           // t=0 → tam işıq
    document.getElementById('halo').setAttribute('opacity', (0.7 + 0.3 * pulse).toFixed(3))
    document.getElementById('halo').setAttribute('r', (90 + 8 * pulse).toFixed(2))
    // Parıltı: dövrün ilk 55%-ində sola→sağa keçir, sonra kənarda gözləyir (t=0 — kənarda)
    const p = Math.min(1, t / 0.55)
    const e = p * p * (3 - 2 * p)
    const x = 232 - 160 + e * (232 + 330 - (232 - 160))
    const g = document.getElementById('shine')
    g.setAttribute('x1', (x - 60).toFixed(2)); g.setAttribute('x2', (x + 60).toFixed(2))
    nodes.forEach((n, i) => {
      const ph = TW[i][2]
      const v = 0.5 + 0.5 * Math.cos(TAU * (t - ph))
      n.setAttribute('opacity', (0.25 + 0.7 * v).toFixed(3))
      n.setAttribute('r', (1 + 0.8 * v).toFixed(2))
    })
  }
  window.frame(0)
</script>
</body></html>`

async function main() {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
    await page.setContent(HTML, { waitUntil: 'load' })
    await page.evaluate('document.fonts.ready')
    const frames = []
    for (let i = 0; i < FRAMES; i++) {
      await page.evaluate(`window.frame(${i / FRAMES})`)
      const png = await page.screenshot({ clip: { x: 0, y: 0, width: W, height: H }, type: 'png' })
      frames.push(png)
      if (FRAMES_DIR) {
        await mkdir(FRAMES_DIR, { recursive: true })
        await writeFile(path.join(FRAMES_DIR, `f${String(i).padStart(2, '0')}.png`), png)
      }
    }
    const gif = await sharp(frames, { join: { animated: true } })
      .gif({ loop: 0, delay: new Array(FRAMES).fill(DELAY), colours: 96, effort: 10, dither: 0.5, interFrameMaxError: 10, interPaletteMaxError: 12 })
      .toBuffer()
    await mkdir(path.dirname(OUT), { recursive: true })
    await writeFile(OUT, gif)
    const { size } = await stat(OUT)
    const meta = await sharp(OUT, { animated: true }).metadata()
    console.log(`${path.relative(ROOT, OUT)}: ${(size / 1024).toFixed(1)} KB, ${meta.width}×${meta.pageHeight}, ${meta.pages} kadr, ${FRAMES * DELAY} ms dövr`)
    if (size > MAX_BYTES) { console.error(`✗ ${MAX_BYTES / 1024} KB həddi aşılıb`); process.exitCode = 1 }
  } finally {
    await browser.close()
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
