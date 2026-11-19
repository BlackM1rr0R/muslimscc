// Batch Q: surə kartı (məlumatdan doğan rozet + dalğa) → surə səhifəsi (infoqrafika) → gecə səması → divar kağızı PNG
import { test, expect, settle } from './fixtures.js'

test('kart açılır, infoqrafika görünür, gecə səması divar kağızı yükləyir', async ({ page }) => {
  await page.goto('/quran')
  await settle(page)
  const card = page.locator('a.surah-card[data-n="1"]')
  await expect(card.locator('.sg')).toBeVisible()          // lazy rozet yükləndi
  await expect(card.locator('svg.sc-spark path')).toHaveCount(1)
  // Sıralama: nazil olma sırası — ilk kart Ələq (96)
  await page.locator('select.qp-juz__select').nth(1).selectOption('rev')
  await expect(page.locator('a.surah-card').first()).toHaveAttribute('data-n', '96')
  await page.locator('select.qp-juz__select').nth(1).selectOption('mushaf')

  await page.locator('a.surah-card[data-n="1"]').click()
  await expect(page).toHaveURL(/\/quran\/1-al-faatiha$/)
  const info = page.getByTestId('surah-infographic')
  await expect(info).toBeVisible()
  await expect(info.getByRole('img', { name: /Nazil olma sırası: 5 \/ 114/ })).toBeVisible()
  await expect(page.locator('.reader-header .rh-glyph .sg')).toBeVisible()

  const open = page.getByTestId('night-sky-open')
  await open.click()
  const sky = page.getByTestId('night-sky')
  await expect(sky).toBeVisible()
  await expect(sky.getByRole('button', { name: 'Bağla' })).toBeFocused()
  await expect(page.getByTestId('night-sky-status')).toHaveText('Yanan ulduzlar: 0 / 7')
  await sky.getByRole('button', { name: 'Bütün bürcü göstər' }).click()
  await expect(page.getByTestId('night-sky-status')).toContainText('Bürc tamamlandı')
  await expect(sky.getByRole('button', { name: /paylaş/i })).toHaveCount(0)   // yalnız şəxsi yükləmə
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('night-sky-phone').click()])
  expect(dl.suggestedFilename()).toBe('muslims-cc-surah-1-phone-1080x1920.png')
  await page.keyboard.press('Escape')
  await expect(sky).toHaveCount(0)
  await expect(open).toBeFocused()
})
