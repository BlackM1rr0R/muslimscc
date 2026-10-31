// ═══════════════════════════════════════════════════════
// /dhikr — yeni sayğac rejimləri:
//   • "Namazdan sonra": 3 istiğfar → "Allahummə əntəs-saləm" → 33/33/33 → təhlil
//     (Muslim 591, 597); say tamamlananda növbəti addıma özü keçir
//   • "Sərbəst təsbeh": hədəfsiz sayğac, localStorage 'dhikr_free_v1'
// Köhnə "Zikr seçimi" sayğacı qa-a.spec.js-də yoxlanılır.
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

test('namazdan sonra: ardıcıllıq avtomatik irəliləyir və tamamlanır', async ({ page, consoleProblems }) => {
  await page.goto('/dhikr')
  await settle(page)
  await page.getByTestId('dhikr-mode-after').click()
  const tap = page.getByTestId('after-prayer-tap')
  const step = page.getByTestId('after-prayer-step')
  const count = page.getByTestId('after-prayer-count')
  await expect(step).toHaveText('Addım 1 / 6')
  await expect(count).toHaveText('0 / 3')

  for (let i = 0; i < 3; i++) await tap.click()
  await expect(step).toHaveText('Addım 2 / 6')
  await expect(tap).toContainText('أَنْتَ السَّلَامُ')
  await tap.click()
  await expect(step).toHaveText('Addım 3 / 6')
  await expect(count).toHaveText('0 / 33')
  for (let i = 0; i < 99; i++) await tap.click()
  await expect(step).toHaveText('Addım 6 / 6')
  await expect(tap).toContainText('وَحْدَهُ لَا شَرِيكَ لَهُ')
  await tap.click()
  await expect(page.getByTestId('after-prayer').locator('.dhikr-complete-badge')).toBeVisible()
  await expect(count).toHaveText('1 / 1')
  // 3 + 1 + 99 + 1 = 104 toxunuş ömürlük sayğaca yazılır
  expect(await page.evaluate(() => localStorage.getItem('dhikr_count_total'))).toBe('104')

  // Bir geri → son addım yenidən açılır; "Yenidən başla" → 1-ci addım
  await page.getByRole('button', { name: 'Bir geri' }).click()
  await expect(count).toHaveText('0 / 1')
  await page.getByRole('button', { name: 'Yenidən başla' }).click()
  await expect(step).toHaveText('Addım 1 / 6')
  expectCleanConsole(consoleProblems)
})

test('sərbəst təsbeh: say saxlanılır, köhnə rejim standartdır', async ({ page, consoleProblems }) => {
  await page.goto('/dhikr')
  await settle(page)
  await expect(page.getByTestId('dhikr-mode-select')).toHaveAttribute('aria-pressed', 'true')
  await page.getByTestId('dhikr-mode-free').click()
  for (let i = 0; i < 5; i++) await page.getByTestId('free-tap').click()
  await expect(page.getByTestId('free-count')).toHaveText('5')

  await page.reload()
  await settle(page)
  await expect(page.locator('.dhikr-tap-btn')).toBeVisible()
  await page.getByTestId('dhikr-mode-free').click()
  await expect(page.getByTestId('free-count')).toHaveText('5')
  expect(await page.evaluate(() => localStorage.getItem('dhikr_free_v1'))).toBe('5')
  expectCleanConsole(consoleProblems)
})
