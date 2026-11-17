// ═══════════════════════════════════════════════════════
// v7.6: təyyarədə namaz vaxtları, qamış qələm, Ay kraterləri, Quranda su dövranı
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

test('təyyarədə namaz: hesabla → namaz anları, qiblə istiqaməti', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/prayer')
  await settle(page)
  const fp = await reach(page, 'flight-prayer')
  await fp.getByTestId('fp-go').click()
  await expect.poll(async () => Number(await fp.getAttribute('data-events'))).toBeGreaterThan(0)
  await expect(fp.locator('[data-testid="fp-event"]').first()).toContainText('°')
  expectCleanConsole(consoleProblems)
})

test('qamış qələm: hərf şablonu, çəkmək strok yaradır, PNG', async ({ page, consoleProblems }, info) => {
  test.setTimeout(60_000)
  test.skip(info.project.name === 'mobile', 'siçanla çəkmə — telefon emulyasiyasında toxunuş hadisəsi yaranmır')
  await page.goto('/name-in-arabic')
  await settle(page)
  const qp = await reach(page, 'qalam-pen')
  await qp.locator('[data-letter]').nth(1).click()
  const cv = qp.getByTestId('qp-canvas')
  const b = await cv.boundingBox()
  await page.mouse.move(b.x + b.width * 0.3, b.y + b.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width * 0.7, b.y + b.height * 0.45, { steps: 8 })
  await page.mouse.up()
  await expect.poll(async () => Number(await qp.getAttribute('data-strokes'))).toBeGreaterThan(0)
  const dl = page.waitForEvent('download')
  await qp.getByTestId('qp-export').click()
  expect((await dl).suggestedFilename()).toMatch(/\.png$/)
  expectCleanConsole(consoleProblems)
})

test('Ay kraterləri: Alhazen kartı, gözəgörünməyən tərəf', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/history#elm')
  await settle(page)
  const mc = await reach(page, 'moon-craters')
  await expect(mc).toHaveAttribute('data-count', '25')
  await mc.locator('.mcr__chip', { hasText: 'Alhazen' }).click()
  await expect(mc.getByTestId('mc-card')).toContainText('Alhazen')
  await mc.getByTestId('mc-side').click()
  await expect(mc.getByTestId('mc-side')).toHaveAttribute('data-side', /far|near/)
  expectCleanConsole(consoleProblems)
})

test('Quranda su dövranı: buludlar → Nur 24:43', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/quran')
  await settle(page)
  const qw = await reach(page, 'quran-water')
  await qw.locator('button[data-stage="clouds"]').click()
  const card = qw.getByTestId('qw-card')
  await expect(card).toHaveAttribute('data-id', 'clouds')
  await expect(card).toContainText('24:43')
  expectCleanConsole(consoleProblems)
})
