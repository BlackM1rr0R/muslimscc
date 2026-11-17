// ═══════════════════════════════════════════════════════
// v7.3: Nəbəvi çətirləri, əl-İdrisi, Hicrət yolu, bir mudd su, ulduzlu gecə kartı, ad tuğrası,
// Quranın yazı tarixi, günün sünnəsi, hilal müşahidələri, krossvord, yaddaş oyunu
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

test('Nəbəvi çətirləri: günorta açıq, gecə bağlı', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/holyplaces')
  await settle(page)
  const nu = await reach(page, 'nabawi-umbrellas')
  await nu.getByTestId('nu-time').fill('780')
  await expect(nu).toHaveAttribute('data-open', '1')
  await nu.getByTestId('nu-time').fill('60')
  await expect(nu).toHaveAttribute('data-open', '0')
  expectCleanConsole(consoleProblems)
})

test('əl-İdrisi: cənub yuxarı → müasir xəritə, şəhər seçimi', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/history#elm')
  await settle(page)
  const w = await reach(page, 'idrisi-world')
  await expect(w).toHaveAttribute('data-view', 'idrisi')
  await w.getByTestId('idrisi-toggle').click()
  await expect(w).toHaveAttribute('data-view', 'modern')
  await w.locator('[data-city="palermo"]').first().click()
  await expect(w.getByTestId('idr-info')).toHaveAttribute('data-city', 'palermo')
  expectCleanConsole(consoleProblems)
})

test('Hicrət yolu: km əlavə olunur, geri alınır', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/history')
  await page.evaluate(() => localStorage.removeItem('muslim_cc_hijra_walk'))
  await page.reload()
  await settle(page)
  const hw = await reach(page, 'hijra-walk')
  await hw.getByTestId('hw-km').fill('60')
  await hw.getByTestId('hw-add').click()
  await expect(hw).toHaveAttribute('data-km', '60.0')
  await hw.getByTestId('hw-undo').click()
  await expect(hw).toHaveAttribute('data-km', '0.0')
  expectCleanConsole(consoleProblems)
})

test('bir mudd su: saniyə ilə hesab, mənbə göstərilir', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/prayerguide')
  await settle(page)
  const mw = await reach(page, 'mudd-water')
  await mw.locator('[data-flow="normal"]').click()
  await mw.getByTestId('mw-seconds').fill('60')
  await mw.getByRole('button', { name: 'Hesabla' }).click()
  await expect.poll(async () => Number(await mw.getAttribute('data-litres'))).toBeGreaterThan(7)
  await expect(mw.getByTestId('mw-hadith')).toContainText('Hayz 51')
  expectCleanConsole(consoleProblems)
})

test('ulduzlu gecə kartı: tarix və ayə seçimi, PNG yüklənir', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/quotes')
  await settle(page)
  const np = await reach(page, 'night-poster')
  await np.getByTestId('np-date').fill('2020-05-23')
  await np.locator('[data-ayah="6:97"]').click()
  const dl = page.waitForEvent('download')
  await np.getByTestId('np-download').click()
  expect((await dl).suggestedFilename()).toMatch(/\.png$/)
  expectCleanConsole(consoleProblems)
})

test('ad tuğrası: ad yazılır, ərəb yazılışı və PNG', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/name-in-arabic')
  await settle(page)
  const nt = await reach(page, 'name-tughra')
  await nt.getByTestId('nt-name').fill('Məhəmməd')
  await expect(nt).toHaveAttribute('data-ar', /\p{Script=Arabic}/u)
  const dl = page.waitForEvent('download')
  await nt.getByTestId('nt-download').click()
  expect((await dl).suggestedFilename()).toMatch(/\.png$/)
  expectCleanConsole(consoleProblems)
})

test('Quranın yazı tarixi: 3 qat, 3-cü qat tam mətndir', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/quran')
  await settle(page)
  const sl = await reach(page, 'script-layers')
  await sl.locator('[data-layer-btn="3"]').click()
  await expect(sl).toHaveAttribute('data-layer', '3')
  const full = await sl.getByTestId('sl-text').textContent()
  await sl.locator('[data-layer-btn="1"]').click()
  await expect(sl).toHaveAttribute('data-layer', '1')
  const rasm = await sl.getByTestId('sl-text').textContent()
  expect(rasm.split(/\s+/).filter(Boolean).length).toBe(full.split(/\s+/).filter(Boolean).length)
  expect(rasm).not.toMatch(/[ً-ْ]/)
  expectCleanConsole(consoleProblems)
})

test('günün sünnəsi: hədis mənbəli, "etdim" təqvimdə qeyd olunur', async ({ page, consoleProblems }) => {
  await page.goto('/dailytracker')
  await page.evaluate(() => localStorage.removeItem('muslim_cc_daily_sunnah'))
  await page.reload()
  await settle(page)
  const ds = page.getByTestId('daily-sunnah')
  await ds.scrollIntoViewIfNeeded()
  await expect(ds.getByRole('link').first()).toHaveAttribute('href', /\/hadith\/\d+/)
  await ds.getByTestId('ds-done').click()
  await expect(ds.locator('[data-day].is-done')).toHaveCount(1)
  expectCleanConsole(consoleProblems)
})

test('hilal müşahidələri (?sightings=1): xəritə xanaları', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/calendar?sightings=1')
  await settle(page)
  const hr = await reach(page, 'hilal-reports')
  await expect(hr).toHaveAttribute('data-cells', '3')
  await expect(hr.getByTestId('hr-note')).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('krossvord və yaddaş oyunu (/kids)', async ({ page, consoleProblems }) => {
  await page.goto('/kids')
  await settle(page)
  await page.getByRole('button', { name: 'Krossvord' }).click()
  const cw = page.getByTestId('crossword')
  expect(Number(await cw.getAttribute('data-words'))).toBeGreaterThanOrEqual(8)
  await cw.getByTestId('cw-reveal').click()
  await cw.getByTestId('cw-check').click()
  await page.getByRole('button', { name: 'Yaddaş oyunu' }).click()
  const mp = page.getByTestId('memory-pairs')
  const first = mp.locator('[data-card]').first()
  const pid = await first.getAttribute('data-pair')
  await first.click()
  await mp.locator(`[data-pair="${pid}"]`).nth(1).click()
  await expect(mp).toHaveAttribute('data-matched', '1')
  expectCleanConsole(consoleProblems)
})

test('kağız qiblə kompası: şəhərin enliyi və qibləsi, A4 PNG', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/qibla')
  await settle(page)
  const pd = await reach(page, 'paper-dial')
  await expect(pd).toHaveAttribute('data-lat', '40')
  await expect(pd).toHaveAttribute('data-qibla', '207')
  const dl = page.waitForEvent('download')
  await pd.getByTestId('pd-download').click()
  expect((await dl).suggestedFilename()).toMatch(/\.png$/)
  expectCleanConsole(consoleProblems)
})
