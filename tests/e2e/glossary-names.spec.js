// İslami lüğət (/glossary) və Allahın adları (/names): yeni bölmələr
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

test('lüğət: kateqoriya süzgəci, əlaqəli termin keçidi, dərs linki', async ({ page, consoleProblems }) => {
  await page.goto('/glossary')
  await settle(page)
  await expect(page.locator('h1')).toHaveCount(1)
  const count = page.locator('.glossary-count')
  await expect(count).toContainText('341')
  await page.locator('.glossary-cat-btn', { hasText: 'Hədis elmi' }).click()
  await expect(count).not.toContainText('341')
  await expect(page.locator('.glossary-card').first().locator('.glossary-cat-badge')).toHaveText('Hədis elmi')
  // Əlaqəli terminə keçid: #id — termin və onun əlaqəli terminləri
  await page.goto('/glossary#istiwa')
  await settle(page)
  await expect(page.locator('.glossary-card.is-focus h2')).toHaveText('İstiva')
  await expect(page.locator('.glossary-focus-bar')).toBeVisible()
  await page.locator('.glossary-card.is-focus .glossary-rel__chip').first().click()
  await expect(page).not.toHaveURL(/#istiwa$/)
  await page.locator('.glossary-focus-bar .ui-btn').click()
  await expect(page.locator('.glossary-focus-bar')).toHaveCount(0)
  // Dərs keçidi (bidət → /learn/bidah)
  await page.goto('/glossary#bidah')
  await settle(page)
  await expect(page.locator('.glossary-card.is-focus .glossary-lesson')).toHaveAttribute('href', /\/learn\/bidah$/)
  expectCleanConsole(consoleProblems)
})

test('99 ad: qaydalar, kartlar və yoxlama; irəliləyiş yaddaşda', async ({ page, consoleProblems }) => {
  await page.goto('/names')
  await settle(page)
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('.name-card')).toHaveCount(99)
  await expect(page.locator('.np-ihsa__item')).toHaveCount(3)
  await expect(page.locator('.np-rule')).toHaveCount(14)
  await page.locator('#name-rule-1 summary').click()
  await expect(page.locator('#name-rule-1 .np-ayah__ref')).toContainText('7:180')
  // Kart: çevir → məna, "Bilirəm" → irəliləyiş
  const card = page.locator('.np-flash')
  await card.click()
  await expect(card.locator('.np-flash__meaning')).toBeVisible()
  await page.getByRole('button', { name: 'Bilirəm', exact: true }).click()
  await expect(page.locator('.np-meter__label')).toContainText('1 / 99')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('names99_practice_v1')))
  expect(saved.known).toEqual([1])
  // Yoxlama: 10 sual
  await page.locator('.np-seg .ui-chip', { hasText: 'Yoxlama' }).click()
  await page.getByRole('button', { name: 'Yoxlamaya başla' }).click()
  for (let i = 0; i < 10; i++) {
    await page.locator('.np-option').first().click()
    await expect(page.locator('.np-option.is-correct')).toHaveCount(1)
    await page.locator('.np-quiz__actions .ui-btn').click()
  }
  await expect(page.locator('.np-quiz__result')).toBeVisible()
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('names99_practice_v1')))
  expect(after.best).toBeGreaterThanOrEqual(0)
  expectCleanConsole(consoleProblems)
})
