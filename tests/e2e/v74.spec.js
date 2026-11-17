// ═══════════════════════════════════════════════════════
// v7.4: müsəlman dünyası atlası, Əndəlus kaşısı, iftar dəvəti, səhabə albomu, hekayə kitabları
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

test('müsəlman dünyası atlası: Azərbaycan kartı, il dəyişir', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/history')
  await settle(page)
  const ma = await reach(page, 'muslim-atlas')
  await expect(ma.locator('[data-iso="AZE"]').first()).toBeAttached({ timeout: 15_000 })
  await ma.locator('[data-iso="AZE"]').first().click({ force: true })
  await expect(ma.getByTestId('ma-card')).toHaveAttribute('data-iso', 'AZE')
  await ma.locator('[data-year-btn="2010"]').click()
  await expect(ma).toHaveAttribute('data-year', '2010')
  expectCleanConsole(consoleProblems)
})

test('Əndəlus kaşısı: çevrilmə sürgüsü, PNG', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/quotes')
  await settle(page)
  const ns = await reach(page, 'nasrid-tile')
  await ns.getByTestId('nt-morph').fill('0')
  await expect(ns).toHaveAttribute('data-morph', '0.00')
  await ns.getByTestId('nt-morph').fill('1')
  await expect(ns).toHaveAttribute('data-morph', '1.00')
  const dl = page.waitForEvent('download')
  await ns.getByTestId('nt-export').click()
  expect((await dl).suggestedFilename()).toMatch(/\.png$/)
  expectCleanConsole(consoleProblems)
})

test('iftar dəvəti: məğrib vaxtı hesablanır, kart yüklənir', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/ramadan')
  await settle(page)
  const ii = await reach(page, 'iftar-invite')
  await ii.getByTestId('ii-date').fill('2027-02-20')
  await expect(ii).toHaveAttribute('data-maghrib', /^1[78]:\d\d$/)
  await ii.locator('[data-design="palm"]').click()
  const dl = page.waitForEvent('download')
  await ii.getByTestId('ii-download').click()
  expect((await dl).suggestedFilename()).toMatch(/\.png$/)
  expectCleanConsole(consoleProblems)
})

test('səhabə albomu: profil oxunanda kart açılır', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/sahaba')
  await page.evaluate(() => { localStorage.removeItem('muslim_cc_sahaba_album'); localStorage.removeItem('muslim_cc_sahaba_album_meta') })
  await page.goto('/sahaba/abu-hurairah')
  await settle(page)
  await expect.poll(() => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('muslim_cc_sahaba_album') || '{}')))).toContain('abu-hurairah')
  await page.goto('/sahaba')
  await settle(page)
  const sa = await reach(page, 'sahaba-album')
  await expect(sa).toHaveAttribute('data-collected', '1')
  await expect(sa.locator('[data-slug="abu-hurairah"]')).toHaveAttribute('data-seen', '1')
  expectCleanConsole(consoleProblems)
})

test('hekayə kitabları: rəf, kitab açılır, vərəqlənir, sonda Quran keçidi', async ({ page, consoleProblems }) => {
  await page.goto('/kids')
  await settle(page)
  await page.getByRole('button', { name: 'Hekayə kitabları' }).click()
  const sb = page.getByTestId('storybooks')
  await expect(sb.locator('[data-book]')).toHaveCount(9)
  await sb.locator('[data-book="nuh"]').click()
  const r = page.getByTestId('sb-reader')
  await expect(r).toHaveAttribute('data-page', '0')
  const pages = Number(await r.getAttribute('data-pages'))
  for (let i = 1; i < pages; i++) await page.getByTestId('sb-next').click()
  await expect(r).toHaveAttribute('data-page', String(pages - 1))
  await expect(r.getByRole('link', { name: /Quran/ }).first()).toHaveAttribute('href', /\/quran\/\d+.*\?a=\d+/)
  await page.getByTestId('sb-close').click()
  await expect(r).toBeHidden()
  expectCleanConsole(consoleProblems)
})
