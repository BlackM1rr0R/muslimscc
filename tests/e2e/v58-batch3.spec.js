// v5.8 (3-cü partiya): Quran qalaktikası, 99 ad səması, Zen vizualizatoru
import { test, expect, settle } from './fixtures.js'

async function scrollTo(page, testId) {
  const el = page.getByTestId(testId)
  for (let i = 0; i < 30 && !(await el.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(200) }
  await el.scrollIntoViewIfNeeded()
  return el
}

test('Quran qalaktikası: yüklənir, nazil olma sırası düyməsi', async ({ page }) => {
  await page.goto('/quran')
  await settle(page)
  const g = await scrollTo(page, 'quran-galaxy')
  await expect(g.locator('canvas, .qgx__nogl').first()).toBeVisible({ timeout: 15000 })
  await g.getByTestId('qgx-order').click()
  await expect(g.getByTestId('qgx-order')).toHaveAttribute('aria-pressed', 'true')
  await expect(g).toContainText('Quran.com')
})

test('99 ad: Səma rejimi açılır, əzbər sayı görünür', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('names99_practice_v1', JSON.stringify({ known: [1, 2, 3] })))
  await page.goto('/names')
  await settle(page)
  const btn = page.getByTestId('np-view-sky')
  await btn.scrollIntoViewIfNeeded()
  await btn.click()
  const sky = page.getByTestId('names-sky')
  await expect(sky).toBeVisible()
  await expect(sky).toContainText('3 / 99')
  await page.getByTestId('np-view-mandala').click()
  await expect(sky).toHaveCount(0)
})

test('Zen: vizualizator halqaları var', async ({ page }) => {
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  await page.getByTestId('zen-open').click()
  await expect(page.locator('.qz-rings i')).toHaveCount(3)
})
