// ═══════════════════════════════════════════════════════
// /rabbana-duas — "Rabbanā duaları" + dua küpü
//   • səhifə: 38 kart, ərəbcə dua hissəsi, bütün ayənin tərcüməsi (saytın nəşri), Quran linki, səs düyməsi
//   • küp: klik / Enter → kağız çıxır; "Başqa dua" — ardıcıl iki dəfə eyni yox; aria-live status
//   • azaldılmış hərəkət → uçuş yoxdur, sadə solma; hərəkətə icazə → uçan kağız + açılma
//   • silkələmə (yalnız toxunma ekranı): devicemotion → yeni dua
//   • Dualar səhifəsindən keçid; axe (açıq + tünd, en + ar RTL); 360px-də daşma yoxdur
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'
import { RABBANA_ITEMS } from '../../src/data/rabbanaSpans.gen.js'

const N = 38
const SPAN = Object.fromEntries(RABBANA_ITEMS.map(it => [it.ref, it.ayah.slice(it.start, it.end)]))

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}

async function open(page, path = '/en/rabbana-duas') {
  await page.goto(path)
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByTestId('rbn-card')).toHaveCount(N)
}

test('səhifə: kartlar, ərəbcə mətn, tərcümə, kim dedi, Quran linki, səs düyməsi', async ({ page, consoleProblems }) => {
  await open(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rabbanā duas')
  await expect(page.getByTestId('rbn-count')).toHaveText(`${N} duas`)
  const first = page.locator('[data-testid="rbn-card"][data-ref="2:127"]')
  await expect(first.locator('.rbn-card__ar')).toHaveText(SPAN['2:127'])
  await expect(first.getByTestId('rbn-who')).toContainText('Ibrahim and Ismail')
  // Tərcümə mount-dan sonra yüklənir (Asad)
  await expect(first.locator('.rbn-tr p')).not.toBeEmpty()
  await expect(first.locator('.rbn-tr small')).toContainText('Translation of the whole ayah')
  await expect(first.getByTestId('rbn-ref')).toHaveAttribute('href', /\/en\/quran\/2-[a-z-]+\?a=127$/)
  await expect(first.locator('.vx-listen')).toHaveCount(1)
  // Bütün ayə (span ayədən qısadır) — details içində, işarələnmiş
  await first.locator('.rbn-full summary').click()
  await expect(first.locator('.rbn-full .rbn-mark')).toBeVisible()
  // Kafirlərin / cəhənnəm əhlinin sözləri yoxdur
  for (const r of ['23:106', '23:107', '14:44', '7:38', '40:11']) await expect(page.locator(`[data-ref="${r}"]`)).toHaveCount(0)
  await expect(page.locator('[role="alert"]:empty')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('küp: klik və Enter kağız çıxarır; "Başqa dua" ardıcıl təkrar vermir', async ({ page, consoleProblems }) => {
  await open(page)
  await expect(page.getByTestId('rbn-slip')).toHaveCount(0)
  const jar = page.getByTestId('rbn-jar')
  await expect(jar).toHaveAccessibleName('Draw a dua from the jar')
  await jar.click()
  const slip = page.getByTestId('rbn-slip')
  await expect(slip).toBeVisible()
  await expect(page.getByTestId('rbn-status')).toContainText('A dua came out of the jar')
  // azaldılmış hərəkət (config defoltu) → uçuş yoxdur, sadə solma
  await expect(page.locator('.rbn-fly')).toHaveCount(0)
  await expect(slip).toHaveClass(/is-fade/)
  await expect(slip.locator('.rbn-slip__ar')).toHaveText(SPAN[await slip.getAttribute('data-ref')])
  await expect(slip.getByTestId('rbn-slip-ref')).toHaveAttribute('href', /\/en\/quran\/\d+-[a-z-]+\?a=\d+$/)
  let last = await slip.getAttribute('data-ref')
  const another = page.getByTestId('rbn-another')
  for (let i = 0; i < 12; i++) {
    await another.click()
    await expect(page.getByTestId('rbn-slip')).not.toHaveAttribute('data-ref', last)
    last = await page.getByTestId('rbn-slip').getAttribute('data-ref')
  }
  await expect(another).toBeFocused()
  // Klaviatura
  await jar.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('rbn-slip')).not.toHaveAttribute('data-ref', last)
  await page.keyboard.press('Space')
  await expect(page.getByTestId('rbn-slip')).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test.describe('hərəkətə icazə', () => {
  test.use({ reducedMotion: 'no-preference' })
  test('uçan kağız və açılma animasiyası', async ({ page }) => {
    await open(page)
    await page.getByTestId('rbn-jar').click()
    await expect(page.locator('.rbn-fly')).toHaveCount(1)
    const slip = page.getByTestId('rbn-slip')
    await expect(slip).not.toHaveClass(/is-fade/)
    expect(await slip.evaluate(el => getComputedStyle(el).animationName)).toBe('rbn-unfold')
    await expect(slip).toBeVisible()
  })
})

test('silkələmə: yalnız toxunma ekranında; devicemotion yeni dua çıxarır', async ({ page, context, isMobile }) => {
  // Chromium-da DeviceMotionEvent.requestPermission sensor icazəsinə baxır
  await context.grantPermissions(['accelerometer', 'gyroscope'])
  await open(page)
  if (!isMobile) {
    await expect(page.getByTestId('rbn-shake')).toHaveCount(0)
    return
  }
  const btn = page.getByTestId('rbn-shake')
  await expect(btn).toHaveAttribute('aria-pressed', 'false')
  await btn.click()
  await expect(btn).toHaveAttribute('aria-pressed', 'true')
  await page.evaluate(() => {
    const fire = (x, y, z) => window.dispatchEvent(new DeviceMotionEvent('devicemotion', { accelerationIncludingGravity: { x, y, z } }))
    fire(0, 9.8, 0)
    fire(20, -8, 6)
  })
  await expect(page.getByTestId('rbn-slip')).toBeVisible()
})

test('Dualar səhifəsindən keçid', async ({ page }) => {
  await page.goto('/en/duas')
  await settle(page)
  const link = page.locator('a[href="/en/rabbana-duas"]').first()
  await link.scrollIntoViewIfNeeded()
  await link.click()
  await expect(page.getByRole('heading', { level: 1, name: 'Rabbanā duas' })).toBeVisible()
  await expect(page).toHaveURL(/\/en\/rabbana-duas$/)
})

for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): ingiliscə və ərəbcə (RTL)`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.addInitScript((th) => { localStorage.setItem('muslim_cc_theme', th) }, theme)
    for (const base of ['/en', '/ar']) {
      await open(page, `${base}/rabbana-duas`)
      await page.getByTestId('rbn-jar').click()
      await expect(page.getByTestId('rbn-slip')).toBeVisible()
      if (base === '/ar') {
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('أدعية «ربنا» في القرآن')
        await expect(page.locator('.rbn-tr')).toHaveCount(0)
      }
      expect(await serious(page, ['.rbn-page']), `${base}/rabbana-duas (${theme})`).toEqual([])
    }
  })
}

test('360px: üfüqi daşma yoxdur (az, en, ar)', async ({ page }) => {
  test.slow()
  await page.setViewportSize({ width: 360, height: 740 })
  for (const path of ['/rabbana-duas', '/en/rabbana-duas', '/ar/rabbana-duas']) {
    await open(page, path)
    await page.getByTestId('rbn-jar').click()
    await expect(page.getByTestId('rbn-slip')).toBeVisible()
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(over, path).toBeLessThanOrEqual(0)
  }
})
