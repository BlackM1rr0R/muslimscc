// Quran Zen (components/quran/QuranZen) — tam ekran, ayə-ayə; ←/→, yuxu taymeri, Esc
import { test, expect, settle } from './fixtures.js'

test('Zen: açılır, ayə dəyişir, taymer seçilir, Esc ilə bağlanır', async ({ page }) => {
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  await page.getByTestId('zen-open').click()
  const z = page.getByTestId('quran-zen')
  await expect(z).toBeVisible()
  await expect(z.locator('.qz-title span')).toHaveText('1 / 7')
  await expect(z.locator('.qz-ar')).toContainText('﴿')
  await page.keyboard.press('ArrowRight')
  await expect(z.locator('.qz-title span')).toHaveText('2 / 7')
  await z.getByRole('button', { name: '15 dəq' }).click()
  await expect(z.locator('.qz-chip.is-on').last()).toContainText('qalıb')
  await page.keyboard.press('Escape')
  await expect(z).toHaveCount(0)
})
