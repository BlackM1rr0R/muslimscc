// Qələmlə yazılış (components/InkText) — /names pəncərəsi
//   • ad ölçülür (viewBox), SVG göstərilir; əsl mətn ekran oxuyucusu üçün qalır
import { test, expect, settle } from './fixtures.js'

test('99 ad: pəncərədə ad SVG ilə "yazılır", mətn əlçatandır', async ({ page }) => {
  await page.goto('/names')
  await settle(page)
  // "Təsadüfi ad" — hidrasiyadan əvvəl klik itə bilər (CI ləngdir): pəncərə açılana qədər təkrar
  const random = page.getByRole('button', { name: /təsadüfi|Təsadüfi/ }).first()
  await expect(random).toBeVisible()
  await expect(async () => {
    if (!(await page.locator('.names-modal-card').count())) await random.click()
    await expect(page.locator('.names-modal-card')).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 15000 })
  const ink = page.locator('.names-modal-ar--ink')
  await expect(ink).toHaveClass(/is-ready/)
  await expect(ink.locator('svg')).toHaveAttribute('viewBox', /^-?\d/)
  const sr = (await ink.locator('.ink__text').textContent()).trim()
  expect(sr.length).toBeGreaterThan(1)
  expect(await ink.locator('svg text').textContent()).toBe(sr)
})
