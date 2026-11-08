// ═══════════════════════════════════════════════════════
// Ana ekran vidceti (components/prayer/HomeScreenWidget) — /prayer
//   • önizləmə bu günün 5 vaxtını göstərir
//   • "Skripti kopyala" — şəhərin /api/prayer.json ünvanı ilə Scriptable skripti
//   • Android tabı — təqvim vidceti izahı
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test('ana ekran vidceti: önizləmə, skript kopyalanır, Android izahı', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/prayer')
  await settle(page)
  const w = page.getByTestId('home-widget')
  await w.scrollIntoViewIfNeeded()
  await expect(w.locator('.hsw__w-list li')).toHaveCount(5)
  await expect(w.locator('.hsw__w-list li').first()).toContainText(/\d{2}:\d{2}/)
  await w.getByRole('button', { name: 'iPhone' }).click()
  await w.getByTestId('hsw-copy').click()
  await expect(w.getByTestId('hsw-copy')).toContainText('Kopyalandı')
  const script = await page.evaluate(() => navigator.clipboard.readText())
  expect(script).toContain('https://muslims.cc/api/prayer.json?')
  expect(script).toContain('Script.setWidget')
  await w.getByRole('button', { name: 'Android' }).click()
  await expect(w).toContainText('Google Təqvim')
})
