// v6.0 (1-ci partiya): elm zənciri, anlayışlar xəritəsi
import { test, expect, settle } from './fixtures.js'

const scrollTo = async (page, loc) => {
  for (let i = 0; i < 40 && !(await loc.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(150) }
  await loc.scrollIntoViewIfNeeded()
}

test('Elm zənciri: alimlər ulduz, xətlər; üzərinə gələndə/toxunanda zəncir, sonra kart açılır', async ({ page }, info) => {
  await page.goto('/scholars')
  await settle(page)
  const c = page.getByTestId('scholar-chain')
  await scrollTo(page, c)
  expect(await c.locator('.sch__node').count()).toBeGreaterThan(30)
  expect(await c.locator('.sch__edge').count()).toBeGreaterThan(25)
  const ahmad = c.locator('.sch__node', { hasText: 'Əhməd ibn Hənbəl' })
  if (info.project.name === 'mobile') await ahmad.tap(); else await ahmad.hover()
  await expect(c.locator('.sch__info')).toContainText('Əhməd ibn Hənbəl')
  expect(await c.locator('.sch__edge.is-on').count()).toBeGreaterThan(3)
  await expect(page).toHaveURL(/\/scholars$/)
  if (info.project.name === 'mobile') await ahmad.tap(); else await ahmad.click()
  await expect(page).toHaveURL(/\/scholars\/ahmad-ibn-hanbal/)
})

test('Anlayışlar xəritəsi: kətan, axtarış termini seçir və qonşuları göstərir, kateqoriya filtri', async ({ page }) => {
  await page.goto('/glossary')
  await settle(page)
  const m = page.getByTestId('concept-map')
  await scrollTo(page, m)
  await expect(m.getByTestId('cmap-canvas')).toBeVisible()
  await m.getByTestId('cmap-search').fill('Səcdə')
  await expect(m.getByTestId('cmap-info')).toContainText('Səcdə')
  await expect(m.getByTestId('cmap-info')).toContainText('əlaqə')
  await m.getByRole('radio', { name: 'İbadət' }).click()
  await expect(m.getByRole('radio', { name: 'İbadət' })).toHaveAttribute('aria-checked', 'true')
})
