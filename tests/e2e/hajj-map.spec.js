// ═══════════════════════════════════════════════════════
// Həcc səyahəti xəritəsi (components/HajjMap) — /hajjguide, "Həcc" rejimi
//   • 5 məkan; cari məkan addımla dəyişir; məkana toxunuş addımı açır
//   • Ümrə rejimində xəritə yoxdur (hamısı Haramdadır)
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test('həcc xəritəsi: məkanlar, addımla hərəkət, toxunuşla keçid', async ({ page }) => {
  await page.goto('/hajjguide')
  await settle(page)
  await page.locator('.hg-select-btn').first().click()
  const map = page.getByTestId('hajj-map')
  await expect(map).toBeVisible()
  await expect(map.locator('.hm__place')).toHaveCount(5)
  await expect(page.getByTestId('hajj-map-here')).toHaveText('Məscidül-Haram')

  await map.locator('.hm__place--arafat button').click()
  await expect(page.locator('.hg-step-name')).toHaveText('Ərəfat')
  await expect(page.getByTestId('hajj-map-here')).toHaveText('Ərəfat')
  await expect(map.locator('.hm__place--arafat')).toHaveClass(/is-here/)

  // Addım çipi ilə: Müzdəlifə (6-cı addım) → xəritə də ora keçir
  await page.locator('.hg-step-chip').nth(5).click()
  await expect(page.getByTestId('hajj-map-here')).toHaveText('Müzdəlifə')
})

test('ümrə rejimində xəritə göstərilmir', async ({ page }) => {
  await page.goto('/hajjguide')
  await settle(page)
  await page.locator('.hg-select-btn').nth(1).click()
  await expect(page.locator('.hg-step-name')).toBeVisible()
  await expect(page.getByTestId('hajj-map')).toHaveCount(0)
})
