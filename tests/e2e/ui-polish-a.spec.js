// ═══════════════════════════════════════════════════════
// UI cilası (2026-11-24, sahibin seçdiyi maket): Navbar A, Hero A (+ statik ilk ekran),
// Scroll A, Keçid B, İkon A, Footer A, CTA B, Uşaqlar ikonu
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test.describe('Hero A — statik ilk ekran', () => {
  test('prerender HTML-də hero + namaz kartı skeleti var, kritik CSS inline, səhifə CSS-i bloklamır', async ({ request }) => {
    for (const [url, h] of [['/', 'Pulsuz İslami platforma'], ['/en/', 'A free Islamic platform'], ['/ar/', 'منصة إسلامية مجانية']]) {
      const html = await (await request.get(url)).text()
      expect(html, url).toContain('data-home-static=""')
      expect(html, url).toContain(h)
      expect(html.match(/<h1\b/g), url).toHaveLength(1)
      // Kritik CSS inline (yalnız statik blokun qaydaları);
      // səhifənin CSS faylları render-blocking DEYİL (preload), yeganə stylesheet — əsas CSS
      const head = html.slice(0, html.indexOf('</head>'))
      const crit = head.match(/<style data-home-critical="">([\s\S]*?)<\/style>/)
      expect(crit, url).toBeTruthy()
      expect(crit[1], url).toContain('.hp-hero-title')
      expect(crit[1].length, url).toBeLessThan(40000)
      const links = [...head.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"/g)].map(m => m[1])
      expect(links, url).toHaveLength(1)
      expect(head, url).toMatch(/<link rel="preload" as="style" crossorigin href="\/assets\/HomePage-/)
    }
    // Əlavə dildə statik blok yoxdur (interfeys lüğətlə tərcümə olunur)
    const extra = await (await request.get('/id/')).text()
    expect(extra).not.toContain('data-home-static')
  })

  test('React statik bloku əvəz edəndə hero yerindən oynamır', async ({ page, isMobile }) => {
    // Əsas JS saxlanılır: əvvəl statik blok (şriftlər yüklənəndən sonra) ölçülür, sonra React buraxılır
    let release
    const gate = new Promise((r) => { release = r })
    await page.route(/\/assets\/index-[\w-]+\.js$/, async (route) => { await gate; await route.continue() })
    await page.goto('/', { waitUntil: 'commit' })
    await expect(page.locator('[data-home-static] .hp-hero-title')).toBeVisible()
    // statik blokun kritik CSS-i tətbiq olunub, şriftlər yüklənib
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-home-static] .hp-pc')).borderTopLeftRadius !== '0px')
    await page.evaluate(() => document.fonts.ready)
    const measure = (scope) => page.evaluate((sc) => {
      const box = (s) => { const r = document.querySelector(`${sc} ${s}`)?.getBoundingClientRect(); return r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width)] : null }
      return { title: box('.hp-hero-title'), sub: box('.hp-hero-sub'), btns: box('.hp-hero-btns'), card: box('.hp-pc') }
    }, scope)
    const stat = await measure('[data-home-static]')
    release()
    await expect(page.locator('[data-home-static]')).toHaveCount(0, { timeout: 15000 })
    await expect(page.locator('.hp-hero .hp-pc')).toBeVisible()
    const now = await measure('.hp-hero')
    // telefonda düymələr kartın ALTINDADIR — vaxtlar gələndə kart uzanır (statik blokdan asılı deyil)
    for (const k of isMobile ? ['title', 'sub', 'card'] : ['title', 'sub', 'btns', 'card']) {
      expect(stat[k], `statik ${k}`).toBeTruthy()
      expect(Math.abs(now[k][0] - stat[k][0]), `${k} x`).toBeLessThanOrEqual(2)
      expect(Math.abs(now[k][1] - stat[k][1]), `${k} y`).toBeLessThanOrEqual(2)
      expect(Math.abs(now[k][2] - stat[k][2]), `${k} en`).toBeLessThanOrEqual(4)
    }
  })

  test.describe('JS olmadan', () => {
    test.use({ javaScriptEnabled: false })
    test('hero görünür, düymələr həqiqi linkdir', async ({ page }) => {
      await page.goto('/')
      await expect(page.locator('h1.hp-hero-title')).toBeVisible()
      await expect(page.locator('.hp-hero-btns a').first()).toHaveAttribute('href', '/prayer')
      await expect(page.locator('.hp-pc')).toBeVisible()
    })
  })

  test('dekor qatları götürülüb: aurora, axan xətlər, ulduzlar yoxdur; xatəm kartın arxasındadır', async ({ page }) => {
    await page.goto('/')
    await settle(page)
    await expect(page.locator('.hp-aur, .hp-paths, .hp-stars, .hp-khatam, .hp-hero-glow')).toHaveCount(0)
    await expect(page.locator('.hp-hero-visual > .hero-orn.hp-orn')).toHaveCount(1)
  })
})

test.describe('CTA B', () => {
  test('ana səhifədə TƏK CTA: halqa + "Bildirişi aç" bildiriş panelini açır', async ({ page }) => {
    await page.goto('/')
    await settle(page)
    const cta = page.locator('.hp-ctab')
    for (let i = 0; i < 40 && !(await cta.count()); i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(120) }
    await cta.scrollIntoViewIfNeeded()
    await expect(cta.getByRole('heading', { name: 'Azan vaxtını qaçırmayın' })).toBeVisible()
    await expect(cta.getByRole('timer')).toBeVisible()
    await expect(cta.locator('.hp-ctab__ring b')).toHaveText(/^\d\d:\d\d:\d\d$/)
    await expect(page.locator('.hp-ctab, .vx-cta, .vx-ft-band-wrap')).toHaveCount(1)
    await cta.getByRole('button', { name: 'Bildirişi aç' }).click()
    await expect(page.locator('.notif-panel')).toBeVisible()
  })
})

test.describe('Navbar A', () => {
  test.skip(({ isMobile }) => isMobile, 'yalnız kompüter')
  test('aktiv linkin altında qızılı xətt; sürüşəndə başlıq 52px-ə yığılır', async ({ page }) => {
    await page.goto('/quran')
    await settle(page)
    const link = page.locator('.nav-desktop a[aria-current="page"]')
    await expect(link).toHaveAttribute('href', '/quran')
    const ind = page.locator('.nav-desktop .nav-ind.is-on')
    await expect(ind).toHaveCount(1)
    const [l, i] = [await link.boundingBox(), await ind.boundingBox()]
    expect(i.x).toBeGreaterThanOrEqual(l.x - 1)
    expect(i.x + i.width).toBeLessThanOrEqual(l.x + l.width + 1)
    expect(i.y).toBeGreaterThan(l.y + l.height - 4)
    const h = () => page.locator('.header-inner').evaluate(el => Math.round(el.getBoundingClientRect().height))
    expect(await h()).toBe(64)
    await page.evaluate(() => window.scrollTo(0, 400))
    await expect.poll(h).toBe(52)
    await expect(page.locator('html')).toHaveClass(/\bqm-hdr-compact\b/)
  })
})

test.describe('İkon A', () => {
  test.use({ reducedMotion: 'no-preference' })
  test('ana səhifə kafellərində ikonlar görünəndə özünü çəkir və tam görünür qalır', async ({ page }) => {
    await page.goto('/')
    await settle(page)
    const tiles = page.locator('.hp-tiles')
    await tiles.scrollIntoViewIfNeeded()
    await expect(tiles).toHaveAttribute('data-drawn', '')
    await page.waitForTimeout(2600)
    const off = await tiles.locator('.ic-draw path, .ic-draw circle, .ic-draw rect').evaluateAll(els => els.map(e => parseFloat(getComputedStyle(e).strokeDashoffset)))
    expect(off.length).toBeGreaterThan(12)
    expect(Math.max(...off)).toBeLessThan(0.01)
  })

  test('Uşaqlar ikonu üz deyil — oyuncaq kublar', async ({ page, isMobile }) => {
    await page.goto('/kids')
    await settle(page)
    if (isMobile) await page.getByRole('button', { name: 'Menyu', exact: true }).click()
    const row = page.locator(isMobile ? '.qm-sn--drawer a.qm-sn-item[href="/kids"]' : '.qm-sn--rail a.qm-sn-item[href="/kids"]')
    await expect(row.locator('svg rect')).toHaveCount(3)
    await expect(row.locator('svg circle')).toHaveCount(0)
  })
})

test.describe('telefon menyusu (Navbar A)', () => {
  test.skip(({ isMobile }) => !isMobile, 'yalnız telefon')
  test('ikonlar qızılı xətt (fon kafeli yoxdur), cari sətirdə qızılı zolaq', async ({ page }) => {
    await page.goto('/prayer')
    await settle(page)
    await page.getByRole('button', { name: 'Menyu', exact: true }).click()
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    const cur = drawer.locator('a.qm-sn-item[aria-current="page"]').first()
    await expect(cur).toBeVisible()
    const s = await cur.evaluate((el) => {
      const ic = el.querySelector('.qm-sn-item-icon')
      return { bg: getComputedStyle(ic).backgroundColor, bar: getComputedStyle(el, '::before').width }
    })
    expect(s.bg).toBe('rgba(0, 0, 0, 0)')
    expect(s.bar).toBe('3px')
  })
})

test.describe('Keçid B — telefonda kart → səhifə (View Transition yox)', () => {
  test.skip(({ isMobile }) => !isMobile, 'yalnız telefon')
  test.use({ reducedMotion: 'no-preference' })
  test('surə kartının başlığı yeni başlığa FLIP ilə uçur; View Transition işlənmir', async ({ page }) => {
    await page.goto('/quran')
    await settle(page)
    const card = page.locator('.surah-card').first()
    await card.scrollIntoViewIfNeeded()
    await page.evaluate(() => {
      window.__vt = 0
      const o = document.startViewTransition?.bind(document)
      if (o) document.startViewTransition = (...a) => { window.__vt++; return o(...a) }
      new MutationObserver(() => { if (document.querySelector('main h1[data-vt-flip]')) window.__flip = true })
        .observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-vt-flip'] })
    })
    await card.click()
    await expect(page).toHaveURL(/\/quran\/1-/)
    await expect.poll(() => page.evaluate(() => window.__flip === true), { timeout: 3000 }).toBe(true)
    expect(await page.evaluate(() => window.__vt)).toBe(0)
  })
})
