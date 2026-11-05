// ═══════════════════════════════════════════════════════
// Nəfəsli zikr (components/dhikr/BreathDhikr) — /dhikr, 4-cü rejim
//   • "Tez" temp (3+3 san): bir nəfəsdən sonra say 1; dayandır → say dayanır
//   • zikr dəyişəndə say sıfırlanır, hədəf zikrin öz hədəfidir (100)
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test('nəfəsli zikr: başla, bir nəfəs = 1, dayandır, zikr dəyiş', async ({ page }) => {
  test.setTimeout(45000)
  await page.goto('/dhikr')
  await settle(page)
  await page.getByTestId('dhikr-mode-breath').click()
  const box = page.getByTestId('breath-dhikr')
  await expect(box).toBeVisible()
  await box.getByRole('button', { name: 'Tez' }).click()
  await page.getByTestId('breath-toggle').click()
  await expect(box.getByRole('status')).toHaveText('Nəfəs alın')
  await expect(page.getByTestId('breath-count')).toContainText('1', { timeout: 9000 })
  await page.getByTestId('breath-toggle').click()        // dayandır
  const n = await page.getByTestId('breath-count').innerText()
  await page.waitForTimeout(3500)
  expect(await page.getByTestId('breath-count').innerText()).toBe(n)
  // "La ilahə illəllah" — hədəf 100, say sıfırdan
  await box.getByRole('button', { name: /La ilahə illəllah/ }).click()
  await expect(page.getByTestId('breath-count')).toHaveText('0 / 100')
})

test('səs açarı: susmaya görə sönülü, seçim yadda qalır (zikr və mushaf ortaq)', async ({ page }) => {
  await page.goto('/dhikr')
  await settle(page)
  const t = page.getByTestId('sound-toggle')
  await expect(t).toHaveAttribute('aria-pressed', 'false')
  await t.click()
  await expect(t).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => localStorage.getItem('muslim_cc_sounds'))).toBe('1')
  await page.goto('/mushaf')
  await settle(page)
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true')
})
