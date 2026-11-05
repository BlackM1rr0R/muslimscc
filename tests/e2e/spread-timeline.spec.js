// ═══════════════════════════════════════════════════════
// İslamın yayılması — zaman xəttli xəritə (components/media/SpreadTimeline) — /history
//   • ilkin: bütün hadisələr görünür (son — 1453 İstanbul)
//   • sürgü: istənilən hadisəyə keçid; ondan sonrakılar gizlənir
//   • Oynat: əvvəldən başlayır və irəliləyir
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test('yayılma xəritəsi: sahil xətti, sürgü, oynat', async ({ page }) => {
  await page.goto('/history')
  await settle(page)
  const map = page.getByTestId('spread-timeline')
  await map.scrollIntoViewIfNeeded()
  await expect(map.locator('.st__land')).toHaveCount(1)
  const total = await map.locator('.st__city').count()
  expect(total).toBe(16)
  await expect(map.locator('.st__city.is-on')).toHaveCount(total)
  await expect(page.getByTestId('spread-now')).toContainText('1453')

  const range = map.locator('.st__range')
  await range.fill('0')
  await expect(page.getByTestId('spread-now')).toContainText('630')
  await expect(map.locator('.st__city.is-on')).toHaveCount(1)

  await range.fill('7')
  await expect(page.getByTestId('spread-now')).toContainText('711')

  // Oynat: 711-dən irəliləyir, sonda özü dayanır
  const play = page.getByTestId('spread-play')
  await play.click()
  await expect(play).toHaveAttribute('aria-pressed', 'true')
  await expect(map.locator('.st__city.is-on')).toHaveCount(total, { timeout: 10000 })
  await expect(play).toHaveAttribute('aria-pressed', 'false')
  // Sonda yenidən Oynat — əvvəldən başlayır
  await play.click()
  await expect.poll(() => map.locator('.st__city.is-on').count()).toBeLessThan(5)
  await play.click()
  await expect(play).toHaveAttribute('aria-pressed', 'false')
})
