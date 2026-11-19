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
  const st = z.getByTestId('sleep-timer-zen')
  await expect(st).toContainText('Yuxu saatı')
  await st.getByRole('button', { name: '15 dəq' }).click()
  // Taymer qurulanda sıra bir düyməyə çevrilir: "15 dəq qalıb · Söndür"; gecə qaralması başlayır
  await expect(st.locator('.slt__pill')).toContainText('qalıb')
  await expect(z).toHaveClass(/is-night/)
  await page.keyboard.press('Escape')
  await expect(z).toHaveCount(0)
  // Taymer pleyerdədir — Zen bağlansa da qalır; pleyer panelində söndürülür
  await expect(page.getByTestId('qpl-sleep-badge')).toHaveCount(1)
  await page.getByRole('button', { name: 'Səs ayarları' }).click()
  const panel = page.getByTestId('sleep-timer-panel')
  await expect(panel.locator('.slt__pill')).toContainText('qalıb')
  await panel.locator('.slt__pill').click()
  await expect(page.getByTestId('qpl-sleep-badge')).toHaveCount(0)
  await expect(panel.getByRole('button', { name: 'Surənin sonu' })).toBeVisible()
})
