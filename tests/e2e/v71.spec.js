// ═══════════════════════════════════════════════════════
// v7.1: rəqəmlərin səyahəti, İbn Bəttutənin səyahəti, Quran bitkiləri bağı, Ay mənzilləri
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

async function reach(page, testId) {
  const el = page.getByTestId(testId)
  for (let i = 0; i < 80 && !(await el.count()); i++) {
    await page.evaluate(() => window.scrollBy(0, 600))
    await page.waitForTimeout(150)
  }
  await el.scrollIntoViewIfNeeded()
  return el
}
const axe = async (page, sel) => {
  const { violations } = await new AxeBuilder({ page }).include(sel)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.id} · ${n.target.join(' ')}`))
}

test('rəqəmlərin səyahəti: dayanacaqlar, çevirici (şərqi ərəb, Roma, sıfır)', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/history#elm')
  await settle(page)
  const nj = await reach(page, 'numerals-journey')
  await expect(nj).toHaveAttribute('data-step', '0')
  await nj.getByTestId('nj-next').click()
  await expect(nj).toHaveAttribute('data-step', '1')
  await expect(nj.locator('.nj__card')).toContainText('Xarəzmi')
  await nj.getByTestId('nj-input').fill('1994')
  await expect(nj.locator('[data-sys="arab"]')).toHaveText('١٩٩٤')
  await expect(nj.locator('[data-sys="roman"]')).toHaveText('MCMXCIV')
  await nj.getByTestId('nj-input').fill('0')
  await expect(nj.locator('[data-sys="roman"]')).toContainText('sıfır')
  expect(await axe(page, '[data-testid="numerals-journey"]')).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('İbn Bəttutə: Tancadan başlayır, növbəti dayanacaq, km sayğacı', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/history')
  await settle(page)
  const ib = await reach(page, 'ibn-battuta')
  const s0 = Number(await ib.getAttribute('data-stop'))
  await ib.getByTestId('ibj-next').click()
  await expect.poll(async () => Number(await ib.getAttribute('data-stop'))).toBeGreaterThan(s0)
  await expect(ib.getByTestId('ibj-km')).toHaveText(/≈\s?\d/)
  expectCleanConsole(consoleProblems)
})

test('Quran bitkiləri: bağ, kart — ayənin ərəbcə mətni və tərcümə, oyun', async ({ page, consoleProblems }) => {
  await page.goto('/kids')
  await settle(page)
  await page.getByRole('button', { name: 'Quran bitkiləri' }).click()
  const g = page.getByTestId('quran-plants')
  await expect(g.locator('[data-plant]').first()).toBeVisible()
  expect(await g.locator('[data-plant]').count()).toBe(13)
  await g.locator('[data-plant="olive"]').click()
  const card = page.getByTestId('plant-card')
  await expect(card).toBeVisible()
  await expect(card).toContainText('95:1')
  await expect(card).toContainText('Məmmədəliyev & Bünyadov')
  expect((await card.textContent()).normalize('NFC').replace(/[ً-ْٰ]/g, '')).toContain('زيتون')
  await expect(card.getByRole('link').first()).toHaveAttribute('href', /\/quran\/\d+.*\?a=\d+/)
  expectCleanConsole(consoleProblems)
})

test('Ay mənzilləri: 28 mənzil, sürgü Ayı növbəti mənzilə aparır, Yasin 36:39', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/qibla#sema')
  await settle(page)
  const lm = await reach(page, 'lunar-mansions')
  const m0 = Number(await lm.getAttribute('data-mansion'))
  expect(m0).toBeGreaterThanOrEqual(0)
  expect(m0).toBeLessThan(28)
  const lon0 = Number(await lm.getAttribute('data-moon-lon'))
  await lm.locator('input[type="range"]').fill('3')
  await expect.poll(async () => Number(await lm.getAttribute('data-moon-lon'))).not.toBe(lon0)
  await expect.poll(async () => Number(await lm.getAttribute('data-mansion'))).not.toBe(m0)
  await expect(lm.locator('a[href*="?a=39"]').first()).toBeVisible()
  expect(await axe(page, '[data-testid="lunar-mansions"]')).toEqual([])
  expectCleanConsole(consoleProblems)
})
