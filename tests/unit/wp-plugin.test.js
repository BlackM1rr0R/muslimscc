// WordPress plagini (wordpress/muslimscc-prayer-times): zip yığıcısı, URL qurucusu,
// generasiya olunan fayllar (cities.php, .pot) köhnəlməyib, versiya hər yerdə eynidir.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import { execFileSync } from 'node:child_process'
import {
  createZip, readZip, crc32, collectFiles, buildPluginZip, readPluginVersion,
  renderCitiesPhp, renderPot, pluginCities, CITIES_PHP, POT_FILE, PLUGIN_DIR,
} from '../../scripts/build-wp-plugin.mjs'
import { wpWidgetUrl, wpShortcode, citySlug, WP_PLUGIN_VERSION, WP_PLUGIN_SLUG, WP_COMPACT_HEIGHT } from '../../src/utils/wpPlugin.js'
import { PRAYER_CITIES } from '../../src/data/prayerCities.js'

const ROOT = path.resolve(__dirname, '../..')
const rd = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')

describe('zip yazıcısı', () => {
  it('crc32 standart nümunə ilə uyğundur', () => {
    expect(crc32(Buffer.from('123456789'))).toBe(0xCBF43926)
    if (typeof zlib.crc32 === 'function') expect(crc32(Buffer.from('salam'))).toBe(zlib.crc32('salam'))
  })

  it('yazılan zip geri oxunur (deflate + saxlama, UTF-8 adlar)', () => {
    const big = Buffer.from('namaz vaxtları '.repeat(200))
    const tiny = Buffer.from('x')
    const zip = createZip([{ name: 'a/böyük.txt', data: big }, { name: 'a/b/kiçik.txt', data: tiny }])
    expect(zip.subarray(0, 4).toString('hex')).toBe('504b0304')
    const back = readZip(zip)
    expect(back.map(e => e.name)).toEqual(['a/böyük.txt', 'a/b/kiçik.txt'])
    expect(back[0].data.equals(big)).toBe(true)
    expect(back[1].data.equals(tiny)).toBe(true)
    expect(zip.length).toBeLessThan(big.length)   // sıxılıb
  })

  it('təkrarlanan: eyni məzmun → eyni bayt', () => {
    expect(buildPluginZip().equals(buildPluginZip())).toBe(true)
  })

  it('plagin zip-i: hamısı slug qovluğunda, lazımi fayllar var, gizli/test faylları yoxdur', () => {
    const names = readZip(buildPluginZip()).map(e => e.name)
    expect(names.every(n => n.startsWith(`${WP_PLUGIN_SLUG}/`))).toBe(true)
    for (const f of [
      'muslimscc-prayer-times.php', 'readme.txt', 'uninstall.php', 'includes/render.php', 'includes/settings.php',
      'includes/cities.php', 'includes/class-muslimscc-prayer-widget.php',
      'blocks/prayer-times/block.json', 'blocks/prayer-times/index.js', 'blocks/prayer-times/index.asset.php',
      'blocks/prayer-times/render.php', 'languages/muslimscc-prayer-times.pot',
    ]) expect(names).toContain(`${WP_PLUGIN_SLUG}/${f}`)
    expect(names.some(n => /\/\.|desktop\.ini|Thumbs\.db/i.test(n))).toBe(false)
  })

  it('CLI zip-i --out qovluğuna yazır (dist/downloads/…)', () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'wpzip-'))
    try {
      execFileSync(process.execPath, [path.join(ROOT, 'scripts/build-wp-plugin.mjs'), '--out', out], { cwd: ROOT, stdio: 'pipe' })
      const file = path.join(out, 'downloads', `${WP_PLUGIN_SLUG}.zip`)
      expect(fs.existsSync(file)).toBe(true)
      const entries = readZip(fs.readFileSync(file))
      expect(entries.length).toBe(collectFiles().length)
      // Ölçü həddi — index.html kimi böyüməsin (deploy təhlükəsizliyi)
      expect(fs.statSync(file).size).toBeLessThan(60 * 1024)
    } finally {
      fs.rmSync(out, { recursive: true, force: true })
    }
  })
})

describe('plagin faylları', () => {
  it('cities.php src/data/prayerCities.js ilə sinxrondur (node scripts/build-wp-plugin.mjs --sync)', () => {
    expect(rd(CITIES_PHP)).toBe(renderCitiesPhp())
    expect(pluginCities().length).toBe(PRAYER_CITIES.length)
  })

  it('.pot faylı köhnəlməyib (node scripts/build-wp-plugin.mjs --sync)', () => {
    expect(rd(POT_FILE)).toBe(renderPot())
  })

  it('versiya: plagin başlığı = sabit = readme Stable tag = block.json', () => {
    const php = rd(path.join(PLUGIN_DIR, 'muslimscc-prayer-times.php'))
    const readme = rd(path.join(PLUGIN_DIR, 'readme.txt'))
    const block = JSON.parse(rd(path.join(PLUGIN_DIR, 'blocks/prayer-times/block.json')))
    expect(readPluginVersion()).toBe(WP_PLUGIN_VERSION)
    expect(php).toContain(`define( 'MUSLIMSCC_PRAYER_VERSION', '${WP_PLUGIN_VERSION}' );`)
    expect(readme).toMatch(new RegExp(`^Stable tag: ${WP_PLUGIN_VERSION.replace(/\./g, '\\.')}$`, 'm'))
    expect(block.version).toBe(WP_PLUGIN_VERSION)
    expect(rd(path.join(PLUGIN_DIR, 'blocks/prayer-times/index.asset.php'))).toContain(`'version'      => '${WP_PLUGIN_VERSION}'`)
  })

  it('WordPress.org: GPL lisenziyası, hər PHP faylında birbaşa giriş qadağandır', () => {
    expect(rd(path.join(PLUGIN_DIR, 'muslimscc-prayer-times.php'))).toMatch(/License:\s+GPL-2\.0-or-later/)
    expect(rd(path.join(PLUGIN_DIR, 'readme.txt'))).toMatch(/^License: GPL-2\.0-or-later$/m)
    for (const f of collectFiles().filter(f => f.endsWith('.php'))) {
      const src = rd(path.join(PLUGIN_DIR, f))
      expect(src, f).toMatch(f === 'uninstall.php' ? /WP_UNINSTALL_PLUGIN/ : /defined\( 'ABSPATH' \) \|\| exit;/)
    }
  })

  it('yığcam görünüşün susmaya görə hündürlüyü: PHP = JS, dar yan paneldə 6 sıra sığır (≥ 500), override işləyir', () => {
    const render = rd(path.join(PLUGIN_DIR, 'includes/render.php'))
    const m = /const MUSLIMSCC_PRAYER_COMPACT_HEIGHT = (\d+);/.exec(render)
    expect(m).not.toBe(null)
    expect(Number(m[1])).toBe(WP_COMPACT_HEIGHT)
    expect(WP_COMPACT_HEIGHT).toBeGreaterThanOrEqual(500)
    // İstifadəçinin hündürlüyü (200–1200) üstündür, boşdursa standart
    expect(render).toContain("( $o['height'] ? $o['height'] : MUSLIMSCC_PRAYER_COMPACT_HEIGHT )")
    expect(render).not.toMatch(/: 300 \)/)
    const settings = rd(path.join(PLUGIN_DIR, 'includes/settings.php'))
    expect(settings).toContain(`(${WP_COMPACT_HEIGHT} px for compact, 16:9 for full)`)
    expect(rd(path.join(PLUGIN_DIR, 'readme.txt'))).toContain(`compact layout is ${WP_COMPACT_HEIGHT} px high`)
  })

  it('istinad linki susmaya görə SÖNÜKDÜR (qayda 10) və iframe çıxışı qaçırılır', () => {
    const render = rd(path.join(PLUGIN_DIR, 'includes/render.php'))
    expect(render).toMatch(/'credit' => false/)
    expect(render).toMatch(/if \( \$o\['credit'\] \)/)
    expect(render).toMatch(/esc_url\( \$url \)/)
    expect(render).toMatch(/esc_attr\( \$title \)/)
    expect(render).toMatch(/loading="lazy"/)
  })
})

describe('wpWidgetUrl / wpShortcode (PHP muslimscc_prayer_url güzgüsü)', () => {
  it('az — prefikssiz, yığcam', () => {
    expect(wpWidgetUrl({ cityId: 'Baku', lang: 'az' }))
      .toBe('https://muslims.cc/mosque-tv?city=Baku&lang=az&theme=light&compact=1')
  })

  it('digər dillər — dil prefiksi; tam görünüş → kiosk; boşluqlu id kodlanır; ad əlavə olunur', () => {
    expect(wpWidgetUrl({ cityId: 'New York', lang: 'en', theme: 'dark', layout: 'full', name: ' Masjid Al-Noor ' }))
      .toBe('https://muslims.cc/en/mosque-tv?city=New%20York&lang=en&theme=dark&name=Masjid%20Al-Noor&kiosk=1')
  })

  it('icazəsiz dəyərlər standarta düşür; adda HTML/idarəetmə simvolu qalmır', () => {
    const u = wpWidgetUrl({ cityId: 'Baku', lang: 'xx', theme: 'neon', layout: 'huge', name: '<script>' })
    expect(u).toBe('https://muslims.cc/mosque-tv?city=Baku&lang=az&theme=light&name=script&compact=1')
  })

  it('nginx yalnız bu yolda iframe-ə icazə verir', () => {
    const conf = rd(path.join(ROOT, 'infra/nginx/muslims.cc.conf'))
    expect(conf).toContain('location ~ ^/(?:(?:en|ru|ar|tr)/)?mosque-tv$ {')
    for (const l of ['az', 'en', 'ru', 'ar', 'tr']) {
      const p = new URL(wpWidgetUrl({ lang: l })).pathname
      expect(p).toMatch(/^\/(?:(?:en|ru|ar|tr)\/)?mosque-tv$/)
    }
  })

  it('şəhər açarı: kiçik hərf, boşluq → tire; hamısı unikal', () => {
    expect(citySlug('Saint Petersburg')).toBe('saint-petersburg')
    expect(citySlug('Baku')).toBe('baku')
    const keys = PRAYER_CITIES.map(c => citySlug(c.id))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('shortcode — yalnız standartdan fərqli dəyərlər', () => {
    expect(wpShortcode({ cityId: 'Baku', lang: 'az' })).toBe('[muslimscc_prayer city="baku" lang="az"]')
    expect(wpShortcode({ cityId: 'Kuala Lumpur', lang: 'ar', theme: 'dark', layout: 'full' }))
      .toBe('[muslimscc_prayer city="kuala-lumpur" lang="ar" theme="dark" layout="full"]')
  })
})

describe('WpPluginSection (serverdə render, 5 dil)', () => {
  it('endirmə linki, 3 addım, qısa kod yeri; ərəbcə mətn; boş role="alert" yoxdur', async () => {
    const React = (await import('react')).default
    const { renderToString } = await import('react-dom/server')
    globalThis.React = React   // vitest-də JSX klassik rejimdədir
    const { default: WpPluginSection } = await import('../../src/components/widget/WpPluginSection.jsx')
    for (const lang of ['az', 'en', 'ru', 'ar', 'tr']) {
      const html = renderToString(React.createElement(WpPluginSection, { lang, shortcodeBox: React.createElement('pre', { id: 'sc' }, 'SC') }))
      expect(html, lang).toContain('href="/downloads/muslimscc-prayer-times.zip"')
      expect(html, lang).toContain('download=""')
      expect((html.match(/class="ui-step"/g) || []).length, lang).toBe(3)
      expect(html, lang).toContain('<pre id="sc">SC</pre>')
      expect(html, lang).toContain(WP_PLUGIN_VERSION)
      expect(html, lang).not.toMatch(/role="alert"/)
    }
    const ar = renderToString(React.createElement(WpPluginSection, { lang: 'ar', shortcodeBox: null }))
    expect(ar).toContain('إضافة ووردبريس')
  })
})
