// ═══════════════════════════════════════════════════════
// v7.5: səccadə dizayneri, tağlar, Quranda rənglər, krallara məktublar
// (ailə dua lövhəsi — tests/e2e/group-dua.spec.js)
// ═══════════════════════════════════════════════════════
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

test('səccadə dizayneri: tağ növü dəyişir, PNG yüklənir', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/quotes')
  await settle(page)
  const rg = await reach(page, 'rug-designer')
  const arches = rg.locator('[data-arch-btn]')
  const second = await arches.nth(1).getAttribute('data-arch-btn')
  await arches.nth(1).click()
  await expect(rg).toHaveAttribute('data-arch', second)
  const dl = page.waitForEvent('download')
  await rg.getByTestId('rug-export').click()
  expect((await dl).suggestedFilename()).toMatch(/\.png$/)
  expectCleanConsole(consoleProblems)
})

test('tağlar: at nalı tağı addım-addım, Osmanlı tağına keçid', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/history#elm')
  await settle(page)
  const ab = await reach(page, 'arch-builder')
  await ab.locator('[data-arch-btn="horseshoe"]').click()
  await expect(ab).toHaveAttribute('data-arch', 'horseshoe')
  // Testlər "hərəkəti azalt" rejimindədir — komponent son addımı göstərir; geri addım işləyir
  const s0 = Number(await ab.getAttribute('data-step'))
  await ab.getByTestId('ab-prev').click()
  await expect.poll(async () => Number(await ab.getAttribute('data-step'))).toBe(s0 - 1)
  await ab.getByTestId('ab-next').click()
  await expect.poll(async () => Number(await ab.getAttribute('data-step'))).toBe(s0)
  await ab.locator('[data-arch-btn="ottoman"]').click()
  await expect(ab).toHaveAttribute('data-arch', 'ottoman')
  expectCleanConsole(consoleProblems)
})

test('Quranda rənglər: sarı → Bəqərə 2:69, mətn və tərcümə', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/quran')
  await settle(page)
  const qc = await reach(page, 'quran-colors')
  await qc.locator('[data-color="yellow"]').click()
  const card = qc.getByTestId('qc-color-card')
  await expect(card).toBeVisible()
  await expect(card).toContainText('2:69')
  await expect(card).toContainText('Məmmədəliyev')
  expectCleanConsole(consoleProblems)
})

test('krallara məktublar: Heraklius → Buxari 7, Kisra kartı', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/history')
  await settle(page)
  const pl = await reach(page, 'prophet-letters')
  await pl.locator('[data-letter="heraclius"]').first().click()
  await expect(pl.getByTestId('pl-card')).toHaveAttribute('data-letter', 'heraclius')
  await expect(pl.getByTestId('pl-card')).toContainText('7')
  await pl.locator('[data-letter="khosrow"]').first().click()
  await expect(pl.getByTestId('pl-card')).toHaveAttribute('data-letter', 'khosrow')
  expectCleanConsole(consoleProblems)
})
