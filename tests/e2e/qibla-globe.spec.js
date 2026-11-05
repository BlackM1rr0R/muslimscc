// ═══════════════════════════════════════════════════════
// Qiblə qlobusu (components/QiblaGlobe) — məkan icazəsi ilə /qibla
//   • qlobus və quru xəritəsi yalnız bu səhifədə yüklənir; məsafə dilə görə formatlanır
//   • sürüşdürmə qlobusu fırladır (kanvas dəyişir)
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test.use({ geolocation: { latitude: 40.4093, longitude: 49.8671 }, permissions: ['geolocation'] })

test('qlobus: yol, məsafə, fırlatma', async ({ page }) => {
  const landReq = page.waitForRequest(/land-110m.*\.json/)
  await page.goto('/qibla')
  await settle(page)
  await landReq
  const sec = page.locator('.qgl-sec')
  await expect(sec).toBeVisible()
  await expect(sec.locator('.qgl-dist')).toHaveText(/^2 \d{3}\s*km$/)
  const canvas = sec.locator('.qgl-canvas')
  await expect(canvas).toHaveAttribute('aria-label', /Kəbəyə ən qısa yolu/)
  await page.waitForTimeout(500)
  const before = await canvas.evaluate(c => c.toDataURL())
  const bb = await canvas.boundingBox()
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2)
  await page.mouse.down()
  await page.mouse.move(bb.x + bb.width / 2 + 120, bb.y + bb.height / 2, { steps: 6 })
  await page.mouse.up()
  await page.keyboard.press('Tab')
  await canvas.focus()
  await page.keyboard.press('ArrowLeft')
  expect(await canvas.evaluate(c => c.toDataURL())).not.toBe(before)
})
