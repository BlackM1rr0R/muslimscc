// 3D Məscidül-Haram (components/media/Kaaba3D) — /holyplaces
//   • bölmə ekrana yaxınlaşanda yüklənir; WebGL varsa kətan, yoxdursa izah mətni
//   • gündüz/gecə düyməsi
import { test, expect, settle, reach } from './fixtures.js'

test('3D model: yüklənir, gecə rejiminə keçir', async ({ page }) => {
  await page.goto('/holyplaces')
  await settle(page)
  // DeferRender: kor mouse.wheel dövrü səhifə hələ qurularkən footer-ə düşürdü (scroll anchoring) — bölmə heç yüklənmirdi
  const k = await reach(page, 'kaaba-3d')
  await expect(k).toBeVisible()
  await expect(k.locator('canvas, .k3d__nogl').first()).toBeVisible({ timeout: 15000 })
  const night = k.getByRole('button', { name: /Gecə/ })
  await night.click()
  await expect(night).toHaveAttribute('aria-pressed', 'true')
  await expect(k).toContainText('Həcərül-Əsvəd')
})
