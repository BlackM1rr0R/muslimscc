// ═══════════════════════════════════════════════════════
// /widget → "WordPress plagini" bölməsi (src/components/widget/WpPluginSection.jsx)
//   • endirmə düyməsi build-də yığılan zip-ə aparır (scripts/build-wp-plugin.mjs → dist/downloads/)
//   • 3 addım, 3-cü addımda seçimə uyğun qısa kod (şəhər/dil/görünüş dəyişəndə yenilənir)
//   • istinad linkinin susmaya görə sönük olduğu deyilir; axe; ərəbcə RTL; 360px-də daşma yoxdur
// Şəbəkə: yeni /api YOXDUR.
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .include(include)
    .analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')}`))
}

test('WordPress bölməsi: endirmə, 3 addım, seçimə uyğun qısa kod, istinad linki sönük', async ({ page, consoleProblems }) => {
  await page.goto('/en/widget')
  await settle(page)
  const sec = page.getByTestId('wg-wp')
  await sec.scrollIntoViewIfNeeded()
  await expect(sec.getByRole('heading', { level: 2, name: 'WordPress plugin' })).toBeVisible()

  const dl = sec.getByTestId('wg-wp-download')
  await expect(dl).toHaveAttribute('href', '/downloads/muslimscc-prayer-times.zip')
  await expect(dl).toHaveAttribute('download', '')
  await expect(sec.getByRole('list', { name: 'Install in three steps' }).getByRole('listitem')).toHaveCount(3)
  await expect(sec).toContainText('Plugins → Add New Plugin → Upload Plugin')
  await expect(sec).toContainText('never adds a link to your site on its own')

  const code = page.locator('#wg-code-wp')
  await expect(code).toHaveText('[muslimscc_prayer city="baku" lang="en"]')
  // Seçim dəyişəndə qısa kod da dəyişir
  await page.getByRole('combobox', { name: 'City' }).selectOption('New York')
  await page.getByRole('radiogroup', { name: 'Appearance' }).getByRole('radio', { name: 'Dark' }).click()
  await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'Türkçe' }).click()
  await expect(code).toHaveText('[muslimscc_prayer city="new-york" lang="tr" theme="dark"]')

  expect(await serious(page, '[data-testid="wg-wp"]')).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('zip build-də yığılıb və verilir (PK imzası)', async ({ page }) => {
  const res = await page.request.get('/downloads/muslimscc-prayer-times.zip')
  expect(res.status()).toBe(200)
  const body = await res.body()
  expect(body.subarray(0, 4).toString('hex')).toBe('504b0304')
  expect(body.includes(Buffer.from('muslimscc-prayer-times/muslimscc-prayer-times.php'))).toBe(true)
})

test('ərəbcə RTL və 360px-də üfüqi daşma yoxdur', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  for (const base of ['/ar', '/ru', '']) {
    await page.goto(`${base}/widget`)
    await settle(page)
    const sec = page.getByTestId('wg-wp')
    await sec.scrollIntoViewIfNeeded()
    await expect(sec.getByTestId('wg-wp-download')).toBeVisible()
    if (base === '/ar') {
      expect(await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="wg-wp"]')).direction)).toBe('rtl')
      await expect(sec.getByRole('heading', { level: 2 })).toHaveText('إضافة ووردبريس')
    }
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(over, `${base || '/az'} 360px`).toBeLessThanOrEqual(1)
  }
})
