#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// WordPress.org kataloq şəkilləri → wordpress/assets/ — node scripts/gen-wp-assets.mjs
//
// • icon-128x128.png, icon-256x256.png, banner-772x250.png, banner-1544x500.png — burada yazılan
//   HTML/SVG-dən (sayt palitrası: zümrüd #0f5a47 + qum, xatəm naxışı). Canlı varlıq, günbəz yoxdur.
// • screenshot-1..4.png — readme.txt "== Screenshots ==" başlıqlarına uyğun:
//     1) yığcam görünüş (açıq tema) yan paneldə — PROD muslims.cc /en/mosque-tv?…&compact=1 iframe-i
//     2) tam görünüş (tünd tema) — PROD /en/mosque-tv?…&kiosk=1 iframe-i
//     3) blok redaktorunda ayarlar paneli — HTML maketi (etiketlər blocks/prayer-times/index.js-dən),
//        kətanda isə real iframe
//     4) Settings → Muslims.cc — HTML maketi (etiketlər includes/settings.php-dən)
// • wordpress/assets/ plagin zip-inə DÜŞMÜR (yalnız SVN assets/ qovluğu üçün) — unit test yoxlayır.
// • PNG-lər sharp ilə palitralı PNG-yə sıxılır (cəmi < 1.5 MB, tests/unit/wp-assets.test.js).
// • Saatı sabitləyirik (Bakı 13:20) — hər dəfə eyni "növbəti namaz" vəziyyəti.
// • CI-da işləmir (şəbəkə + prod lazımdır); şəkil dəyişəndə əl ilə işlədilir və commit olunur.
// ═══════════════════════════════════════════════════════

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import sharp from 'sharp'
/* global document */
import { wpWidgetUrl, WP_COMPACT_HEIGHT } from '../src/utils/wpPlugin.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'wordpress', 'assets')
const ORIGIN = 'https://wp-demo.example'   // saxta sayt — iframe-in valideyni (frame-ancestors * https tələb edir)
const FIXED_TIME = new Date('2026-11-25T13:20:00+04:00')

const font = (f) => fs.readFileSync(path.join(ROOT, 'src/assets/fonts', f)).toString('base64')
const FONTS = `
@font-face{font-family:Inter;font-weight:100 900;src:url(data:font/woff2;base64,${font('inter-latin-var.woff2')}) format('woff2')}
@font-face{font-family:Amiri;font-weight:700;src:url(data:font/woff2;base64,${font('amiri-latin-700.woff2')}) format('woff2')}
`

// Xatəm (HeroOrnament.jsx ilə eyni həndəsə): iki kvadrat → səkkizguşəli ulduz, dairə, kiçik ulduz
const KHATAM = (stroke, w = 1.6, extra = '') => `
<g fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" ${extra}>
  <path d="M50 6 L61 39 L94 50 L61 61 L50 94 L39 61 L6 50 L39 39 Z"/>
  <path d="M18.9 18.9 L50 30 L81.1 18.9 L70 50 L81.1 81.1 L50 70 L18.9 81.1 L30 50 Z"/>
  <path d="M50 22 A28 28 0 1 1 49.9 22 Z"/>
  <path d="M50 1 A49 49 0 1 1 49.9 1 Z" opacity=".55"/>
</g>`

const page = (body, css = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
${FONTS}
*{box-sizing:border-box}html,body{margin:0;padding:0}
body{font-family:Inter,'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
${css}</style></head><body>${body}</body></html>`

// ── İkon: xatəm + saat əqrəbləri (namaz vaxtı) ──
const iconHtml = (s) => page(`
<div class="ic">
  <svg viewBox="0 0 100 100" width="${s}" height="${s}" aria-hidden="true">
    <defs>
      <radialGradient id="bg" cx="32%" cy="26%" r="85%">
        <stop offset="0" stop-color="#1d8a6e"/><stop offset=".55" stop-color="#0f5a47"/><stop offset="1" stop-color="#062a21"/>
      </radialGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f0e2c2"/><stop offset=".5" stop-color="#d8b46a"/><stop offset="1" stop-color="#c09445"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#bg)"/>
    <g transform="translate(9 9) scale(.82)">
      <path d="M50 6 L61 39 L94 50 L61 61 L50 94 L39 61 L6 50 L39 39 Z" fill="#d8b46a" fill-opacity=".10"/>
      ${KHATAM('url(#gold)', s <= 128 ? 3.2 : 2.6)}
    </g>
    <circle cx="50" cy="50" r="16.5" fill="#062a21" fill-opacity=".55" stroke="url(#gold)" stroke-width="${s <= 128 ? 2.6 : 2}"/>
    <g stroke="#f7efdc" stroke-width="${s <= 128 ? 3.2 : 2.6}" stroke-linecap="round">
      <line x1="50" y1="50" x2="50" y2="39"/><line x1="50" y1="50" x2="58" y2="54"/>
    </g>
    <circle cx="50" cy="50" r="2.2" fill="#d8b46a"/>
  </svg>
</div>`, `.ic{width:${s}px;height:${s}px;overflow:hidden}svg{display:block}`)

// ── Banner (772×250; 1544×500 = eyni HTML, deviceScaleFactor 2) ──
const bannerHtml = () => page(`
<div class="bn">
  <svg class="pat" viewBox="0 0 772 250" width="772" height="250" aria-hidden="true">
    <defs><pattern id="p" width="50" height="50" patternUnits="userSpaceOnUse">
      <g transform="scale(.5)">${KHATAM('#e6cc95', 1.2)}</g></pattern>
      <linearGradient id="fade" x1="0" x2="1"><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>
      <mask id="m"><rect width="772" height="250" fill="url(#fade)"/></mask>
    </defs>
    <rect width="772" height="250" fill="url(#p)" opacity=".09" mask="url(#m)"/>
  </svg>
  <svg class="big" viewBox="0 0 100 100" width="300" height="300" aria-hidden="true">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f0e2c2"/><stop offset=".55" stop-color="#d8b46a"/><stop offset="1" stop-color="#a57a22"/></linearGradient></defs>
    <path d="M50 6 L61 39 L94 50 L61 61 L50 94 L39 61 L6 50 L39 39 Z" fill="#d8b46a" fill-opacity=".07"/>
    ${KHATAM('url(#g)', 1.1)}
    <circle cx="50" cy="50" r="15" fill="#062a21" fill-opacity=".5" stroke="url(#g)" stroke-width="1"/>
    <g stroke="#f7efdc" stroke-width="1.6" stroke-linecap="round"><line x1="50" y1="50" x2="50" y2="40"/><line x1="50" y1="50" x2="57" y2="54"/></g>
    <circle cx="50" cy="50" r="1.4" fill="#d8b46a"/>
  </svg>
  <div class="tx">
    <div class="eb">WordPress plugin · free · no ads</div>
    <h1>Prayer Times</h1>
    <div class="by">by <b>muslims.cc</b></div>
    <ul class="chips">
      <li>Fajr</li><li>Dhuhr</li><li class="on">Asr <span>in 1:38</span></li><li>Maghrib</li><li>Isha</li>
    </ul>
  </div>
</div>`, `
.bn{position:relative;width:772px;height:250px;overflow:hidden;color:#f7efdc;
  background:radial-gradient(120% 140% at 85% 30%,#13705a 0,#0f5a47 30%,#0a3d31 62%,#062a21 100%)}
.pat{position:absolute;inset:0}
.big{position:absolute;right:28px;top:-25px}
.tx{position:absolute;left:44px;top:34px}
.eb{font:600 12px/1 Inter;letter-spacing:.14em;text-transform:uppercase;color:#e6cc95;opacity:.9}
h1{margin:10px 0 0;font:700 64px/1 Amiri,serif;letter-spacing:-.01em;color:#fff8e8}
.by{margin-top:6px;font:400 20px/1.2 Inter;color:#d8f1e6}.by b{font-weight:700;color:#e6cc95}
.chips{display:flex;gap:8px;margin:24px 0 0;padding:0;list-style:none}
.chips li{font:600 13px/1 Inter;padding:8px 12px;border-radius:999px;color:#d8f1e6;
  background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(230,204,149,.28)}
.chips li.on{background:#d8b46a;color:#062a21;box-shadow:none}.chips li.on span{font-weight:500;opacity:.8}`)

// ── Ekran şəkli 1: adi sayt, yan paneldə yığcam vidcet ──
const shot1Html = (src) => page(`
<header class="hd"><div class="logo"></div><b>Al-Noor Community Centre</b><nav><span>Home</span><span>Events</span><span>Classes</span><span>Contact</span></nav></header>
<div class="wrap">
  <main>
    <h2>Welcome to our community</h2>
    <div class="ln w9"></div><div class="ln w8"></div><div class="ln w9"></div><div class="ln w6"></div>
    <div class="img"></div>
    <div class="ln w9"></div><div class="ln w7"></div><div class="ln w8"></div><div class="ln w5"></div>
  </main>
  <aside>
    <h3>Prayer times</h3>
    <div class="muslimscc-prayer muslimscc-prayer--compact">
      <iframe src="${src}" title="Prayer times — Baku" style="display:block;width:100%;height:${WP_COMPACT_HEIGHT}px;border:0;border-radius:12px"></iframe>
    </div>
    
  </aside>
</div>`, `
body{background:#fbfaf7;color:#1f2a27;width:1200px;height:800px;overflow:hidden}
.hd{display:flex;align-items:center;gap:12px;height:68px;padding:0 48px;background:#fff;border-bottom:1px solid #e7e2d6;font-size:18px}
.logo{width:30px;height:30px;border-radius:8px;background:#0f5a47}
nav{margin-left:auto;display:flex;gap:28px;font-size:15px;color:#4b5a55}
.wrap{display:grid;grid-template-columns:1fr 360px;gap:48px;padding:36px 48px}
h2{margin:0 0 18px;font-size:28px}h3{margin:0 0 12px;font-size:17px}.mt{margin-top:26px}
.ln{height:12px;border-radius:6px;background:#e9e5db;margin:0 0 12px}
.w9{width:94%}.w8{width:84%}.w7{width:72%}.w6{width:60%}.w5{width:46%}
.img{height:230px;border-radius:14px;margin:22px 0;background:linear-gradient(135deg,#e6dcc4,#d8ccb0)}
aside{background:#fff;border:1px solid #e7e2d6;border-radius:16px;padding:20px}`)

// ── Ekran şəkli 2: tam görünüş (tünd), 16:9 ──
const shot2Html = (src) => page(
  `<iframe src="${src}" title="Prayer times — Baku" style="display:block;width:1280px;height:720px;border:0"></iframe>`,
  'body{width:1280px;height:720px;overflow:hidden;background:#0b0f0e}')

// ── Ekran şəkli 3: blok redaktoru (maket) — etiketlər index.js / block.json ilə eyni ──
const sel = (label, value) => `<div class="fld"><label>${label}</label><div class="sel">${value}<i></i></div></div>`
const shot3Html = (src) => page(`
<div class="top">
  <div class="sq"><svg viewBox="0 0 24 24" width="22" height="22"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#fff" stroke-width="1.6"/></svg></div>
  <div class="plus">+</div><span class="tool">⟲</span><span class="tool">⟳</span>
  <div class="doc">Prayer times · Page</div>
  <div class="right"><span class="lnk">Save draft</span><span class="btn">Publish</span></div>
</div>
<div class="main">
  <div class="canvas">
    <div class="paper">
      <h1>Prayer times</h1>
      <p>Our daily prayer times for Baku. Congregation (iqamah) times are shown under each adhan.</p>
      <div class="blk">
        <div class="bt"><svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="8" fill="none" stroke="#1e1e1e" stroke-width="1.6"/><path d="M12 7v5l3 2" fill="none" stroke="#1e1e1e" stroke-width="1.6" stroke-linecap="round"/></svg><span>⋮</span></div>
        <iframe src="${src}" title="Prayer times — Baku" style="display:block;width:100%;height:${WP_COMPACT_HEIGHT}px;border:0;border-radius:12px;pointer-events:none"></iframe>
      </div>
    </div>
  </div>
  <aside class="side">
    <div class="tabs"><span>Page</span><span class="on">Block</span></div>
    <div class="card">
      <svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="8" fill="none" stroke="#1e1e1e" stroke-width="1.6"/><path d="M12 7v5l3 2" fill="none" stroke="#1e1e1e" stroke-width="1.6" stroke-linecap="round"/></svg>
      <div><b>Prayer Times (muslims.cc)</b><p>Today's prayer times and a countdown to the next prayer from muslims.cc.</p></div>
    </div>
    <div class="panel">
      <div class="ph">Settings <i class="up"></i></div>
      ${sel('City', 'Baku — Azerbaijan')}
      ${sel('Language', 'English')}
      ${sel('Theme', 'Light')}
      ${sel('Layout', 'Compact')}
      <div class="fld"><label>Mosque name (optional)</label><div class="inp"></div></div>
    </div>
    <div class="panel closed"><div class="ph">Advanced <i></i></div></div>
  </aside>
</div>`, `
body{width:1280px;height:880px;overflow:hidden;background:#fff;color:#1e1e1e;font:13px/1.4 -apple-system,'Segoe UI',Roboto,sans-serif}
.top{height:60px;display:flex;align-items:center;gap:14px;border-bottom:1px solid #e0e0e0;padding-right:16px}
.sq{width:60px;height:60px;background:#1e1e1e;display:grid;place-items:center}
.plus{width:32px;height:32px;border-radius:2px;background:#3858e9;color:#fff;font-size:22px;display:grid;place-items:center}
.tool{color:#949494;font-size:18px}
.doc{margin:0 auto;background:#f0f0f0;border-radius:4px;padding:7px 80px;color:#1e1e1e}
.right{display:flex;gap:14px;align-items:center}.lnk{color:#3858e9}
.btn{background:#3858e9;color:#fff;border-radius:2px;padding:9px 14px}
.main{display:grid;grid-template-columns:1fr 280px;height:820px}
.canvas{background:#f0f0f0;padding:28px 40px;overflow:hidden}
.paper{background:#fff;max-width:680px;margin:0 auto;padding:40px 52px;min-height:100%}
.paper h1{font:700 38px/1.15 Inter,sans-serif;margin:0 0 16px}
.paper p{font:16px/1.6 Inter,sans-serif;color:#333;margin:0 0 20px}
.blk{position:relative;margin-top:62px;outline:2px solid #3858e9;outline-offset:6px;border-radius:2px}
.bt{position:absolute;top:-50px;left:-8px;display:flex;gap:10px;align-items:center;background:#fff;border:1px solid #1e1e1e;border-radius:2px;padding:6px 10px;font-size:16px}
.side{border-left:1px solid #e0e0e0;overflow:hidden}
.tabs{display:flex;border-bottom:1px solid #e0e0e0;height:48px}
.tabs span{padding:0 16px;display:flex;align-items:center;font-weight:500}
.tabs .on{box-shadow:inset 0 -3px 0 #3858e9}
.card{display:flex;gap:12px;padding:16px;border-bottom:1px solid #e0e0e0}
.card b{font-size:13px}.card p{margin:4px 0 0;color:#444}
.panel{border-bottom:1px solid #e0e0e0;padding:0 16px 16px}.panel.closed{padding-bottom:0}
.ph{display:flex;justify-content:space-between;align-items:center;height:48px;font-weight:500}
.ph i{width:8px;height:8px;border-right:1.5px solid #1e1e1e;border-bottom:1.5px solid #1e1e1e;transform:rotate(45deg);margin-right:4px}
.ph i.up{transform:rotate(-135deg)}
.fld{margin:0 0 16px}.fld label{display:block;font-size:11px;font-weight:500;text-transform:uppercase;margin:0 0 8px}
.sel,.inp{height:40px;border:1px solid #949494;border-radius:2px;padding:0 12px;display:flex;align-items:center;justify-content:space-between}
.sel i{width:7px;height:7px;border-right:1.5px solid #1e1e1e;border-bottom:1.5px solid #1e1e1e;transform:rotate(45deg);margin-top:-4px}`)

// ── Ekran şəkli 4: Settings → Muslims.cc (maket) — mətnlər includes/settings.php ilə eyni ──
const MENU = ['Dashboard', 'Posts', 'Media', 'Pages', 'Comments', 'Appearance', 'Plugins', 'Users', 'Tools']
const SUB = ['General', 'Writing', 'Reading', 'Discussion', 'Media', 'Permalinks', 'Privacy', 'Muslims.cc']
const shot4Html = () => page(`
<div class="bar"><span class="home">⌂ Al-Noor Community Centre</span><span class="me">Howdy, admin</span></div>
<div class="lay">
  <nav class="menu">
    ${MENU.map(m => `<div class="mi">${m}</div>`).join('')}
    <div class="mi cur">Settings</div>
    <div class="sub">${SUB.map(s => `<div class="si${s === 'Muslims.cc' ? ' on' : ''}">${s}</div>`).join('')}</div>
  </nav>
  <main class="wrap">
    <h1>Muslims.cc Prayer Times</h1>
    <p>These are the defaults for the block, the classic widget and the shortcode. Each block or shortcode can override them.</p>
    <table class="ft">
      <tr><th>City</th><td><div class="s">Baku — Azerbaijan</div></td></tr>
      <tr><th>Language</th><td><div class="s">English</div></td></tr>
      <tr><th>Theme</th><td><div class="s">Light</div></td></tr>
      <tr><th>Layout</th><td><div class="s">Compact — prayer times and countdown</div></td></tr>
      <tr><th>Height (px)</th><td><div class="n"></div><p class="d">Leave empty for automatic height (300 px for compact, 16:9 for full).</p></td></tr>
      <tr class="hl"><th>Credit link</th><td><label><span class="cb"></span>Show a "Prayer times by muslims.cc" link under the widget on my site</label>
        <p class="d">Off by default. Turn it on if you would like to thank muslims.cc — the widget works the same either way.</p></td></tr>
    </table>
    <span class="pb">Save Changes</span>
    <h2>How to add the widget</h2>
    <ul>
      <li>Block editor: add the "Prayer Times (muslims.cc)" block.</li>
      <li>Classic widgets: Appearance → Widgets → "Prayer Times (muslims.cc)".</li>
      <li>Anywhere else, use the shortcode: <code>[muslimscc_prayer city="baku" lang="en" theme="light" layout="compact"]</code></li>
    </ul>
    <p>Times are calculated astronomically. Please confirm congregation times with your mosque.</p>
  </main>
</div>`, `
body{width:1280px;height:800px;overflow:hidden;background:#f0f0f1;color:#3c434a;font:13px/1.4 -apple-system,'Segoe UI',Roboto,sans-serif}
.bar{height:32px;background:#1d2327;color:#f0f0f1;display:flex;align-items:center;justify-content:space-between;padding:0 12px}
.lay{display:grid;grid-template-columns:160px 1fr;height:768px}
.menu{background:#1d2327;color:#f0f0f1;padding-top:12px}
.mi{padding:8px 12px;font-size:14px}.mi.cur{background:#2271b1;color:#fff;font-weight:500}
.sub{background:#2c3338;padding:7px 0}.si{padding:5px 12px;color:#c3c4c7}.si.on{color:#fff;font-weight:600}
.wrap{padding:10px 20px 0 22px;max-width:1000px}
h1{font:400 23px/1.3 inherit;color:#1d2327;margin:12px 0 10px}
h2{font-size:1.3em;color:#1d2327;margin:28px 0 10px}
.ft{border-collapse:collapse;margin-top:6px}
.ft th{width:200px;text-align:left;vertical-align:top;padding:20px 10px 20px 0;color:#1d2327;font-weight:600;font-size:14px}
.ft td{padding:15px 10px;vertical-align:top;font-size:14px}
.s{min-width:300px;display:inline-flex;justify-content:space-between;gap:24px;border:1px solid #8c8f94;border-radius:4px;background:#fff;padding:5px 8px 5px 10px;color:#2c3338}
.s::after{content:"";width:7px;height:7px;border-right:1.5px solid #50575e;border-bottom:1.5px solid #50575e;transform:rotate(45deg);margin:3px 4px 0 0}
.n{width:72px;height:30px;border:1px solid #8c8f94;border-radius:4px;background:#fff}
.d{margin:6px 0 0;color:#646970;font-size:13px}
.hl td,.hl th{background:#fcf9e8}
.hl label{display:flex;gap:8px;align-items:center}
.cb{width:16px;height:16px;border:1px solid #8c8f94;border-radius:4px;background:#fff;display:inline-block}
.pb{display:inline-block;margin-top:14px;background:#2271b1;color:#fff;border-radius:3px;padding:6px 12px}
ul{list-style:disc;padding-left:22px;margin:0}li{margin:0 0 6px}
code{background:rgba(0,0,0,.07);padding:3px 5px;font-size:13px}`)

async function optimize(buf) {
  return sharp(buf).png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 }).toBuffer()
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  // Cloudflare "HeadlessChrome" UA-nı bloklayır (403) — adi Chrome UA
  const probe = await browser.newPage()
  const ua = (await probe.evaluate(() => navigator.userAgent)).replace('HeadlessChrome', 'Chrome')
  await probe.close()

  const written = []
  async function shoot(name, html, { width, height, scale = 1, wait = 0 }) {
    const ctx = await browser.newContext({
      viewport: { width, height }, deviceScaleFactor: scale, userAgent: ua,
      timezoneId: 'Asia/Baku', locale: 'en-US', reducedMotion: 'reduce', serviceWorkers: 'block',
    })
    await ctx.clock.setFixedTime(FIXED_TIME)
    await ctx.route(`${ORIGIN}/**`, r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: html }))
    const p = await ctx.newPage()
    await p.goto(`${ORIGIN}/`, { waitUntil: 'load' })
    await p.evaluate(() => document.fonts.ready)
    if (wait) await p.waitForTimeout(wait)
    const png = await optimize(await p.screenshot({ type: 'png' }))
    fs.writeFileSync(path.join(OUT, name), png)
    written.push([name, png.length])
    await ctx.close()
  }

  const compact = wpWidgetUrl({ cityId: 'Baku', lang: 'en', theme: 'light', layout: 'compact' })
  const full = wpWidgetUrl({ cityId: 'Baku', lang: 'en', theme: 'dark', layout: 'full' })

  await shoot('icon-128x128.png', iconHtml(128), { width: 128, height: 128 })
  await shoot('icon-256x256.png', iconHtml(256), { width: 256, height: 256 })
  await shoot('banner-772x250.png', bannerHtml(), { width: 772, height: 250 })
  await shoot('banner-1544x500.png', bannerHtml(), { width: 772, height: 250, scale: 2 })
  await shoot('screenshot-1.png', shot1Html(compact), { width: 1200, height: 800, wait: 7000 })
  await shoot('screenshot-2.png', shot2Html(full), { width: 1280, height: 720, wait: 7000 })
  await shoot('screenshot-3.png', shot3Html(compact), { width: 1280, height: 880, wait: 7000 })
  await shoot('screenshot-4.png', shot4Html(), { width: 1280, height: 800 })
  await browser.close()

  let total = 0
  for (const [n, b] of written) { total += b; console.log(`${n.padEnd(22)} ${(b / 1024).toFixed(1)} KB`) }
  console.log(`cəmi ${(total / 1024).toFixed(1)} KB → ${path.relative(ROOT, OUT)}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
