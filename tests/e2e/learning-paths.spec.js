// ═══════════════════════════════════════════════════════
// Dərs yolları (components/lesson/LearningPaths) — /learn
//   • yol çipində oxunan/cəmi, halqa, "Növbəti dərs" ilk oxunmamışa aparır
//   • yol seçimi yadda qalır; bitmiş yolda paylaşma düyməsi
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test('dərs yolları: irəliləyiş, növbəti dərs, seçim yadda qalır', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('lp-init')) return
    sessionStorage.setItem('lp-init', '1')
    localStorage.setItem('learn_progress_v1', JSON.stringify({ read: ['intro-to-islam', 'new-muslim'], last: 'new-muslim' }))
    localStorage.removeItem('learn_path_v1')
  })
  await page.goto('/learn')
  await settle(page)
  const lp = page.getByTestId('learning-paths')
  await lp.scrollIntoViewIfNeeded()
  const first = lp.getByRole('tab').first()
  await expect(first).toHaveAttribute('aria-selected', 'true')
  await expect(first).toContainText('2/6')
  // Növbəti dərs — yolun ilk oxunmamışı (Üç əsas)
  await expect(lp.getByRole('link', { name: /Növbəti dərs/ })).toHaveAttribute('href', /usul-ath-thalatha/)
  // Başqa yol seçilir və yenidən açılışda yadda qalır
  await lp.getByRole('tab', { name: /İbadət mövsümləri/ }).click()
  await expect(lp.getByRole('tab', { name: /İbadət mövsümləri/ })).toHaveAttribute('aria-selected', 'true')
  await page.reload()
  await settle(page)
  await expect(page.getByTestId('learning-paths').getByRole('tab', { name: /İbadət mövsümləri/ })).toHaveAttribute('aria-selected', 'true')
})

test('dərs yolları: bitmiş yolda paylaşma kartı', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('learn_progress_v1', JSON.stringify({ read: ['sunnah-fasts', 'dhul-hijjah-ten', 'udhiyah', 'kaffarah-fidyah'], last: null }))
    localStorage.setItem('learn_path_v1', 'seasons')
  })
  await page.goto('/learn')
  await settle(page)
  const lp = page.getByTestId('learning-paths')
  await lp.scrollIntoViewIfNeeded()
  await expect(lp.getByTestId('path-share')).toBeVisible()
  await expect(lp.getByRole('tab', { name: /İbadət mövsümləri/ })).toContainText('4/4')
})
