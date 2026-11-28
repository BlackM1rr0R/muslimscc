// ═══════════════════════════════════════════════════════
// /quran-revelation-order — Nazil olma sırası: 114 surə kartı
//   • ilk render — mushaf sırası; keçid → Ələq (96) birinci, Qələm (68) ikinci; geri qayıdış
//   • FLIP: keçid anında kartlar transform ilə geri çəkilir (yalnız hərəkət açıq olanda)
//   • Məkki / Mədəni sayı (86 / 28), mənbə sətri, statik blok
//   • fokus/hover → zaman xəttində yeri; "Ardıcıllığı göstər" azaldılmış hərəkətdə dərhal
//   • kart surə səhifəsinə aparır; Quran səhifəsində keçid kartı
//   • axe (açıq + tünd), ərəbcə RTL, 360px-də üfüqi daşma yoxdur
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole, reach } from './fixtures.js'

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}

async function open(page, path = '/en/quran-revelation-order') {
  await page.goto(path)
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByTestId('rvo-tile')).toHaveCount(114)
}
const order = (page) => page.getByTestId('rvo-tile').evaluateAll(els => els.map(el => Number(el.dataset.n)))

test('keçid: nazil olma sırasında Ələq (96) birincidir; geri — mushaf sırası', async ({ page, consoleProblems }) => {
  await open(page)
  const grid = page.getByTestId('rvo-grid')
  await expect(grid).toHaveAttribute('data-mode', 'mushaf')
  expect((await order(page)).slice(0, 3)).toEqual([1, 2, 3])

  const rev = page.getByTestId('rvo-mode-revelation')
  await rev.click()
  await expect(rev).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('rvo-mode-mushaf')).toHaveAttribute('aria-pressed', 'false')
  await expect(grid).toHaveAttribute('data-mode', 'revelation')
  const seq = await order(page)
  expect(seq.slice(0, 2)).toEqual([96, 68])
  expect(seq[86]).toBe(2)      // hicrətdən sonra ilk — Bəqərə
  expect(seq[113]).toBe(110)
  await expect(page.getByTestId('rvo-tile').first()).toContainText('العلق')
  await expect(page.getByTestId('rvo-status')).toContainText('order of revelation')

  await page.getByTestId('rvo-mode-mushaf').click()
  await expect(grid).toHaveAttribute('data-mode', 'mushaf')
  expect((await order(page)).slice(0, 3)).toEqual([1, 2, 3])
  await expect(page.getByTestId('rvo-status')).toContainText('mushaf order')
  expectCleanConsole(consoleProblems)
})

test('FLIP: hərəkət açıq olanda kartlar köhnə yerindən uçur, sonda transform qalmır', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await open(page)
  // React sinxron yeniləməni mikrotapşırıqda render edir; layout effekti boyanmadan (rAF-dan) əvvəl
  // geri çəkmə transform-unu yazır
  const moved = await page.evaluate(async () => {
    document.querySelector('[data-testid="rvo-mode-revelation"]').click()
    for (let i = 0; i < 3; i++) await Promise.resolve()
    return [...document.querySelectorAll('[data-testid="rvo-tile"]')].filter(li => /translate\(/.test(li.style.transform)).length
  })
  expect(moved).toBeGreaterThan(100)
  await expect.poll(() => page.getByTestId('rvo-tile').evaluateAll(els => els.filter(li => li.style.transform).length), { timeout: 5000 }).toBe(0)
  expect((await order(page))[0]).toBe(96)
})

test('Məkki / Mədəni sayı və rəngi, mənbə sətri', async ({ page }) => {
  await open(page)
  await expect(page.getByTestId('rvo-count-meccan')).toHaveText('86 Meccan surahs')
  await expect(page.getByTestId('rvo-count-medinan')).toHaveText('28 Medinan surahs')
  await expect(page.locator('[data-testid="rvo-tile"][data-place="medinan"]')).toHaveCount(28)
  await expect(page.locator('[data-testid="rvo-tile"][data-place="meccan"]')).toHaveCount(86)
  // İki fərqli rəng (kartın kənar xətti)
  const colors = await page.evaluate(() => ['1', '2'].map(n => getComputedStyle(document.querySelector(`[data-n="${n}"] a`)).borderInlineStartColor))
  expect(colors[0]).not.toBe(colors[1])
  await expect(page.getByTestId('rvo-source')).toContainText('Quran.com API (revelation_order)')
  await expect(page.getByTestId('rvo-source')).toContainText('not definitive')
  await expect(page.getByTestId('rvo-hijra')).toContainText('Hijrah')
})

test('fokus kartın yerini zaman xəttində göstərir; oynatma azaldılmış hərəkətdə dərhal bitir', async ({ page }) => {
  await open(page)
  const hot = page.getByTestId('rvo-tl-hot')
  await page.locator('[data-n="96"] a').focus()
  await expect(hot).toHaveAttribute('data-pos', '1')
  await expect(hot).toHaveClass(/is-on/)
  await expect(page.getByTestId('rvo-tl-now')).toContainText('revelation order: 1')
  await page.locator('[data-n="2"] a').hover()
  await expect(hot).toHaveAttribute('data-pos', '87')
  await expect(hot).toHaveClass(/is-med/)

  await page.getByTestId('rvo-play').click()
  await expect(page.getByTestId('rvo-grid')).toHaveAttribute('data-mode', 'revelation')
  await expect(page.getByTestId('rvo-grid')).not.toHaveClass(/is-playing/)
  await expect(page.getByTestId('rvo-status')).toContainText('All 114 surahs')
  expect((await order(page))[0]).toBe(96)
})

test('oynatma (hərəkət açıq): kartlar bir-bir açılır və öz-özünə dayanır', async ({ page }) => {
  test.setTimeout(45_000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await open(page)
  const play = page.getByTestId('rvo-play')
  await play.click()
  await expect(page.getByTestId('rvo-grid')).toHaveClass(/is-playing/)
  await expect(play).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('rvo-grid')).not.toHaveClass(/is-playing/, { timeout: 20_000 })
  await expect(play).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByTestId('rvo-status')).toContainText('All 114 surahs')
})

test('kart surə səhifəsini açır; Quran səhifəsində keçid kartı var', async ({ page }) => {
  test.slow() // iki ağır səhifə (114 kart + Quran indeksi)
  await open(page)
  await page.getByTestId('rvo-mode-revelation').click()
  const first = page.getByTestId('rvo-tile').first().getByRole('link')
  await expect(first).toHaveAttribute('href', /^\/en\/quran\/96-[a-z-]+$/)
  await first.click()
  await expect(page).toHaveURL(/\/en\/quran\/96-/)

  await page.goto('/en/quran')
  await settle(page)
  // bölmələr tənbəl qurulur (DeferRender) — reach yer tutucunu ekrana gətirir, element sürüşməsin
  const card = (await reach(page, page.locator('main a[href="/en/quran-revelation-order"]'))).first()
  await card.click()
  await expect(page).toHaveURL(/\/en\/quran-revelation-order$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Order of revelation' })).toBeVisible()
})

for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): ingiliscə və ərəbcə (RTL)`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.addInitScript((th) => { localStorage.setItem('muslim_cc_theme', th) }, theme)
    for (const base of ['/en', '/ar']) {
      await open(page, `${base}/quran-revelation-order`)
      if (base === '/ar') {
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
        await expect(page.getByRole('heading', { level: 1 })).toContainText('ترتيب النزول')
      }
      expect(await serious(page, ['.rvo-page']), `${base} (${theme})`).toEqual([])
    }
  })
}

test('360px: üfüqi daşma yoxdur, 3 sütun', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  for (const path of ['/en/quran-revelation-order', '/ar/quran-revelation-order', '/quran-revelation-order']) {
    await open(page, path)
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(over, path).toBeLessThanOrEqual(1)
    const cols = await page.getByTestId('rvo-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)
    expect(cols, path).toBe(3)
  }
})
