// Qələmlə yazılış (components/InkText) — /names pəncərəsi
//   • ad ölçülür (viewBox), SVG göstərilir; əsl mətn ekran oxuyucusu üçün qalır
import { test, expect, settle } from './fixtures.js'

test('99 ad: pəncərədə ad SVG ilə "yazılır", mətn əlçatandır', async ({ page }) => {
  await page.goto('/names')
  await settle(page)
  await page.getByRole('button', { name: /təsadüfi|Təsadüfi/ }).first().click().catch(() => {})
  if (!(await page.locator('.names-modal-card').count())) await page.locator('button:has(.ui-arabic)').first().click()
  const ink = page.locator('.names-modal-ar--ink')
  await expect(ink).toHaveClass(/is-ready/)
  await expect(ink.locator('svg')).toHaveAttribute('viewBox', /^-?\d/)
  const sr = (await ink.locator('.ink__text').textContent()).trim()
  expect(sr.length).toBeGreaterThan(1)
  expect(await ink.locator('svg text').textContent()).toBe(sr)
})
