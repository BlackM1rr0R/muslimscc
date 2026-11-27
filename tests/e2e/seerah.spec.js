// ═══════════════════════════════════════════════════════
// /seerah — Siyər: Hicaz xəritəsi + zaman xətti
//   • sürüşmə → xəritədə yer işıqlanır (IntersectionObserver); hicrət hadisəsində yol çəkilir
//   • yer siyahısı / xəritə nöqtəsi → həmin hadisəyə keçid, başlığa fokus
//   • "Uşaqlar üçün" — sadə mətn, aria-pressed, status
//   • mənbə sətri (Quran linki, hədis nömrəsi), statik prerender bloku + JSON-LD ItemList
//   • axe (açıq + tünd), ərəbcə RTL, 360px-də üfüqi daşma yoxdur
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}

// Hadisəni səhifənin "oxu zolağına" gətir (səhifədəki IO ilə eyni: telefonda ~64%, masaüstündə ~44%)
async function scrollToEvent(page, id) {
  await page.locator(`#ev-${id}`).evaluate((el) => {
    const narrow = window.innerWidth < 960
    const y = el.getBoundingClientRect().top - window.innerHeight * (narrow ? 0.64 : 0.44)
    window.scrollBy(0, y)
  })
}

async function open(page, path = '/en/seerah') {
  await page.goto(path)
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByTestId('seerah-event')).toHaveCount(27)
}

test('sürüşmə xəritədə yeri işıqlandırır; hicrətdə yol çəkilir', async ({ page, consoleProblems }) => {
  await open(page)
  const svg = page.getByTestId('seerah-map-svg')
  // İlk render: birinci hadisə (doğum, Məkkə)
  await expect(svg).toHaveAttribute('data-active', 'makkah')

  await scrollToEvent(page, 'badr')
  await expect(svg).toHaveAttribute('data-active', 'badr')
  await expect(page.locator('#ev-badr')).toHaveClass(/is-active/)
  await expect(svg.locator('g.srh-pt[data-place="badr"]')).toHaveClass(/is-active/)
  await expect(svg).not.toHaveClass(/is-hijrah/)

  await scrollToEvent(page, 'hijrah')
  await expect(svg).toHaveAttribute('data-active', 'thawr')
  await expect(svg).toHaveClass(/is-hijrah/)
  // Sevr Məkkə ətrafındadır — əsas xəritədə Məkkə nöqtəsi də işıqlanır
  await expect(svg.locator('g.srh-pt--area[data-place="makkah"]')).toHaveClass(/is-active/)

  await scrollToEvent(page, 'tabuk')
  await expect(svg).toHaveAttribute('data-active', 'tabuk')
  await expect(page.getByTestId('seerah-map-now')).toContainText('Tabuk')
  expectCleanConsole(consoleProblems)
})

test('yer seçimi hadisəyə aparır və başlığa fokus verir; təkrar seçim — növbəti hadisə', async ({ page }) => {
  await open(page)
  await page.getByTestId('seerah-place-khaybar').click()
  await expect(page.locator('#ev-khaybar-h')).toBeFocused()
  await expect(page.locator('#ev-khaybar')).toHaveClass(/is-active/)
  await expect(page.getByTestId('seerah-map-svg')).toHaveAttribute('data-active', 'khaybar')
  await expect(page.getByTestId('seerah-place-khaybar')).toHaveAttribute('aria-current', 'location')

  // Taif: iki hadisə — ikinci seçim növbətisinə keçir
  await page.getByTestId('seerah-place-taif').click()
  await expect(page.locator('#ev-taif-h')).toBeFocused()
  await page.getByTestId('seerah-place-taif').click()
  await expect(page.locator('#ev-taifsiege-h')).toBeFocused()

  // Xəritədəki nöqtə (siçan/toxunuş qısayolu)
  await page.getByTestId('seerah-map-svg').locator('g.srh-pt[data-place="badr"]').click({ force: true })
  await expect(page.locator('#ev-badr-h')).toBeFocused()

  // Klaviatura: yer düyməsi Enter ilə
  await page.getByTestId('seerah-place-hudaybiyyah').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#ev-hudaybiyyah-h')).toBeFocused()
})

test('uşaqlar üçün rejimi sadə mətni göstərir, mənbələr qalır', async ({ page }) => {
  await open(page)
  const kids = page.getByTestId('seerah-kids')
  await expect(kids).toHaveAttribute('aria-pressed', 'false')
  const birth = page.locator('#ev-birth')
  await expect(birth).toContainText('Historians differ on the exact date')
  await kids.click()
  await expect(kids).toHaveAttribute('aria-pressed', 'true')
  await expect(birth).toContainText('born in the city of Makkah, on a Monday')
  await expect(birth).not.toContainText('Historians differ')
  await expect(birth).toContainText('Muslim 1162')
  await expect(page.getByRole('status').filter({ hasText: 'simple text for kids' })).toHaveCount(1)
  await kids.click()
  await expect(birth).toContainText('Historians differ on the exact date')
})

test('mənbə sətri: Quran linki oxuyucuya, hədis nömrəsi; İsra — tarix bölməsinə keçid', async ({ page }) => {
  await open(page)
  const badr = page.locator('#ev-badr')
  await expect(badr.getByRole('link', { name: 'Quran 3:123' })).toHaveAttribute('href', /\/en\/quran\/3-[a-z-]+\?a=123$/)
  await expect(badr).toContainText('Muslim 1763')
  await expect(page.locator('#ev-isra').getByRole('link', { name: /al-Isra and al-Mi‘raj/ })).toHaveAttribute('href', '/en/history')
  // Hər hadisədə mənbə sətri var
  await expect(page.locator('.srh-ev__src')).toHaveCount(27)
})

test('prerender: statik blok və JSON-LD ItemList', async ({ page }) => {
  const res = await page.request.get('/en/seerah/index.html')
  expect(res.ok()).toBe(true)
  const html = await res.text()
  expect(html).toContain('id="ev-badr"')
  expect(html).toContain('The Battle of Badr')
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]))
  const pageLd = ld.find(x => x['@type'] === 'WebPage')
  expect(pageLd.mainEntity['@type']).toBe('ItemList')
  expect(pageLd.mainEntity.itemListElement).toHaveLength(27)
  expect(pageLd.mainEntity.itemListElement[0].item).toBe('https://muslims.cc/en/seerah#ev-birth')
})

for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): ingiliscə və ərəbcə (RTL)`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.addInitScript((th) => { localStorage.setItem('muslim_cc_theme', th) }, theme)
    for (const base of ['/en', '/ar']) {
      await open(page, `${base}/seerah`)
      if (base === '/ar') {
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
        await expect(page.getByRole('heading', { level: 1 })).toContainText('السيرة النبوية')
      }
      expect(await serious(page, ['.srh-page']), `${base}/seerah (${theme})`).toEqual([])
    }
  })
}

test('360px: üfüqi daşma yoxdur, xəritə və zaman xətti görünür', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  for (const path of ['/en/seerah', '/ar/seerah', '/seerah']) {
    await open(page, path)
    await expect(page.getByTestId('seerah-map-svg')).toBeVisible()
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(over, path).toBeLessThanOrEqual(1)
  }
})
