// 3D Məscidül-Haram (components/media/Kaaba3D) — /holyplaces
//   • bölmə ekrana yaxınlaşanda yüklənir; WebGL varsa kətan, yoxdursa izah mətni
//   • gündüz/gecə düyməsi
import { test, expect, settle } from './fixtures.js'

test('3D model: yüklənir, gecə rejiminə keçir', async ({ page }) => {
  await page.goto('/holyplaces')
  await settle(page)
  const k = page.getByTestId('kaaba-3d')
  for (let i = 0; i < 20 && !(await k.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(250) }
  await k.scrollIntoViewIfNeeded()
  await expect(k).toBeVisible()
  await expect(k.locator('canvas, .k3d__nogl').first()).toBeVisible({ timeout: 15000 })
  const night = k.getByRole('button', { name: /Gecə/ })
  await night.click()
  await expect(night).toHaveAttribute('aria-pressed', 'true')
  await expect(k).toContainText('Həcərül-Əsvəd')
})
