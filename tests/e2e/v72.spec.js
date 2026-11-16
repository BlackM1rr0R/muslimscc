// ═══════════════════════════════════════════════════════
// v7.2: İznik kaşısı, fotodan naxış, Quran şəhəri, dua kapsulu, hərf tutma, səs heykəli,
// indi zikr edənlər, ayə yarışı, rasd — dünyada kölgələr və təqvim
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

test('İznik kaşısı: çəkmək simmetrik strok yaradır, divar görünüşü', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/quotes')
  await settle(page)
  const iz = await reach(page, 'iznik')
  const cv = iz.getByTestId('iznik-canvas')
  const b = await cv.boundingBox()
  await page.mouse.move(b.x + b.width * 0.3, b.y + b.height * 0.3)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width * 0.45, b.y + b.height * 0.25, { steps: 6 })
  await page.mouse.up()
  await expect.poll(async () => Number(await iz.getAttribute('data-strokes'))).toBeGreaterThan(0)
  await iz.getByTestId('iznik-wall').click()
  await expect(cv).toHaveAttribute('data-wall', '1')
  expectCleanConsole(consoleProblems)
})

test('fotodan naxış: hazır palitra, 12 guşə, rəng xanaları', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/quotes')
  await settle(page)
  const pp = await reach(page, 'photo-pattern')
  await expect(pp.getByTestId('pp-swatch').first()).toBeVisible()
  expect(Number(await pp.getAttribute('data-colors'))).toBeGreaterThanOrEqual(5)
  await pp.getByTestId('pp-kind-12').click()
  await expect(pp.getByTestId('pp-canvas')).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('Quran şəhəri: oxunan surələrin pəncərələri yanır, qülləyə toxunanda kart', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/quran')
  await page.evaluate(() => localStorage.setItem('quran_stats', JSON.stringify({ reads: { 1: 3, 18: 1, 36: 2 }, sessions: 6 })))
  await page.reload()
  await settle(page)
  const qc = await reach(page, 'quran-city')
  await expect(qc).toHaveAttribute('data-lit', '3')
  await qc.locator('[data-surah="18"]').click()
  await expect(qc.getByTestId('qc-card')).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('dua kapsulu: yaz → möhürlə → rəfdə bağlı kapsul, mətn görünmür', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/duajournal')
  await page.evaluate(() => localStorage.removeItem('muslim_cc_dua_capsules'))
  await page.reload()
  await settle(page)
  const dc = await reach(page, 'dua-capsule')
  await dc.locator('#dc-text').fill('Ailəm üçün hidayət')
  await dc.getByTestId('dc-seal').click()
  const item = dc.getByTestId('dc-item').first()
  await expect(item).toHaveAttribute('data-state', 'sealed')
  await expect(item).not.toContainText('Ailəm üçün hidayət')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('muslim_cc_dua_capsules')))
  expect(saved[0].text).toBe('Ailəm üçün hidayət')
  expectCleanConsole(consoleProblems)
})

test('hərf tutma: oyun başlayır, söz göstərilir, hərflər düşür', async ({ page, consoleProblems }) => {
  await page.addInitScript(() => { window.__lcSlow = true })
  await page.goto('/kids')
  await settle(page)
  await page.getByRole('button', { name: 'Hərf tutma' }).click()
  const lc = page.getByTestId('letter-catch')
  await lc.getByTestId('lc-start').click()
  await expect(lc).toHaveAttribute('data-state', 'playing')
  await expect(lc.getByTestId('lc-word')).toHaveAttribute('data-word', /\S/)
  await expect(lc.locator('[data-letter]').first()).toBeVisible({ timeout: 10_000 })
  expectCleanConsole(consoleProblems)
})

test('səs heykəli və indi zikr edənlər (/dhikr): nümayiş rejimi, qlobusda bölgələr', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/dhikr')
  await settle(page)
  const zn = await reach(page, 'zikr-now')
  await expect(zn).toHaveAttribute('data-cells', '3')
  await expect(zn).toContainText('3')
  const vr = await reach(page, 'voice-ribbon')
  await vr.getByTestId('vr-demo').click()
  await expect(vr).toHaveAttribute('data-state', 'demo')
  await vr.getByTestId('vr-stop').click()
  await expect(vr).toHaveAttribute('data-state', 'idle')
  expectCleanConsole(consoleProblems)
})

test('ayə yarışı: düz sırada toxunmaq səviyyəni bitirir, xal artır', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  // Fikstürün "[test ayə]" mətnində ərəb sözü yoxdur — bu test üçün ərəbcə sözlər
  await page.route(/api\.alquran\.cloud\/v1\/surah\/\d+\/editions\//, (route) => route.fulfill({ json: { code: 200, status: 'OK', data: [{
    number: 112, numberOfAyahs: 4,
    ayahs: ['قُلْ هُوَ ٱللَّهُ أَحَدٌ', 'ٱللَّهُ ٱلصَّمَدُ لَمْ', 'لَمْ يَلِدْ وَلَمْ يُولَدْ', 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ'].map((text, i) => ({ number: 6222 + i, numberInSurah: i + 1, text })),
  }] } }))
  await page.goto('/hifz')
  await settle(page)
  const r = await reach(page, 'ayah-race')
  await r.getByTestId('ar-start').click()
  await expect(r).toHaveAttribute('data-phase', 'playing')
  // növbəti söz (data-next) ilə eyni mətnli ilk açıq düyməyə toxun
  for (let i = 0; i < 40 && (await r.getAttribute('data-phase')) === 'playing'; i++) {
    const next = await r.getAttribute('data-next')
    await r.locator('.ar-race__w:not([disabled])').getByText(next, { exact: true }).first().click()
  }
  await expect(r).toHaveAttribute('data-phase', 'cleared')
  expect(Number(await r.getAttribute('data-score'))).toBeGreaterThan(0)
  expectCleanConsole(consoleProblems)
})

test('rasd: dünyada kölgələr xəritəsi, təqvimə əlavə — .ics', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/qibla')
  await settle(page)
  const w = await reach(page, 'rasd-world')
  await expect(w.locator('svg.rqw__map')).toBeVisible()
  const dl = page.waitForEvent('download')
  await w.getByTestId('rasd-cal').click()
  expect((await dl).suggestedFilename()).toMatch(/^muslims-cc-rasd-\d{4}-\d{2}-\d{2}\.ics$/)
  expectCleanConsole(consoleProblems)
})
