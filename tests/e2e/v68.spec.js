// v6.8: fidyə və kəffarə hesablayıcısı (/qada)
import AxeBuilder from '@axe-core/playwright'
import { test, expect, settle } from './fixtures.js'

const scrollTo = async (page, loc) => {
  for (let i = 0; i < 80 && !(await loc.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(150) }
  await loc.scrollIntoViewIfNeeded()
}

test('Fidyə/kəffarə: fidyə 30 gün = 30 kasıb ≈ 45 kq; and kəffarəsi 2 and = 20 kasıb; cima — 2 ay → 60 kasıb', async ({ page }) => {
  await page.goto('/qada')
  await settle(page)
  const c = page.getByTestId('kaffarah-calc')
  await scrollTo(page, c)
  await expect(c.getByTestId('kfc-poor')).toHaveText('30')
  await expect(c.getByTestId('kfc-kg')).toContainText('45')
  await c.getByTestId('kfc-price').fill('2')
  await expect(c.getByTestId('kfc-cost')).toContainText('90')
  await c.getByTestId('kfc-oath').click()
  await c.getByTestId('kfc-n').fill('2')
  await expect(c.getByTestId('kfc-poor')).toHaveText('20')
  await c.getByTestId('kfc-jima').click()
  await expect(c.getByTestId('kfc-poor')).toHaveText('60')
  await expect(c).toContainText('2 ay ardıcıl oruc')
  await c.getByTestId('kfc-killing').click()
  await expect(c.getByTestId('kfc-poor')).toHaveCount(0)
  await expect(c.locator('a[href*="kaffarah-fidyah"]')).toBeVisible()
  const { violations } = await new AxeBuilder({ page }).include('[data-testid=kaffarah-calc]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
  expect(violations.filter(v => v.impact === 'critical' || v.impact === 'serious').map(v => v.id)).toEqual([])
})

test('Hədis səhifəsi /en/hadith/8: başlıq, seçilmiş hədis kartı, bütün hədislərə keçid', async ({ page }) => {
  await page.goto('/en/hadith/8')
  await settle(page)
  await expect(page).toHaveTitle(/Actions are by intentions/)
  const f = page.getByTestId('hadith-focus')
  await expect(f).toBeVisible()
  await expect(f).toContainText('Actions are by intentions')
  await f.locator('a.hadith-focus__all').click()
  await expect(page).toHaveURL(/\/en\/hadith$/)
  await expect(page.getByTestId('hadith-focus')).toHaveCount(0)
})
