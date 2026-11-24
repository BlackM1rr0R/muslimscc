// "Hərfləri barmaqla yaz" (components/trace/TracePractice) — mövqe formaları, transliterasiya, səs düyməsi
//   • forma seçimi (tək / əvvəldə / ortada / sonda) kətandakı yazını dəyişir
//   • son formanı siçanla şablonun üstündən yazmaq tamamlayır; irəliləyiş "<id>@final" açarı ilə,
//     sayğac yalnız əsas (tək) formanı sayır
//   • uşaq rejimində forma seçimi yoxdur
// (Əsas iz mühərriki — tests/e2e/trace-name.spec.js)
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

/** Şablon kətanında hərfin piksellərini sətir-sətir tap və hər "parçanı" siçanla soldan sağa yaz */
async function traceGuide(page, tc) {
  const runs = await tc.locator('.trc__layer').first().evaluate((cv) => {
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data
    const rows = 70, cols = 140, out = []
    for (let r = 0; r < rows; r++) {
      const y = Math.round(((r + 0.5) / rows) * cv.height)
      let start = -1
      for (let c = 0; c <= cols; c++) {
        const x = Math.round(((c + 0.5) / cols) * cv.width)
        const on = c < cols && d[(y * cv.width + Math.min(cv.width - 1, x)) * 4 + 3] > 12
        if (on && start < 0) start = c
        if (!on && start >= 0) { out.push([start / cols, (c - 1) / cols, y / cv.height]); start = -1 }
      }
    }
    return out
  })
  expect(runs.length).toBeGreaterThan(5)
  const b = await tc.locator('.trc__ink').boundingBox()
  for (const [x0, x1, y] of runs) {
    await page.mouse.move(b.x + x0 * b.width, b.y + y * b.height)
    await page.mouse.down()
    for (let i = 1; i <= 3; i++) await page.mouse.move(b.x + (x0 + ((x1 - x0) * i) / 3) * b.width + 0.5, b.y + y * b.height)
    await page.mouse.up()
  }
}

test('formalar: "Final" seçilir, siçanla yazmaq tamamlayır, sayğac dəyişmir', async ({ page, consoleProblems }) => {
  await page.goto('/en/learn-arabic')
  await settle(page)
  const box = page.locator('[data-testid=trace-practice]')
  await box.scrollIntoViewIfNeeded()
  await expect(box.getByTestId('trace-tl')).toContainText('ʾalif')
  await expect(box.getByRole('button', { name: 'Listen' })).toBeVisible()

  // Be hərfi → "Final" forması
  await box.locator('.trp__grid button[aria-label^="Bāʾ"]').click()
  await expect(box.getByTestId('trace-tl')).toContainText('bāʾ')
  const forms = box.getByRole('group', { name: 'Form' })
  await expect(forms.getByRole('button')).toHaveCount(4)
  await expect(forms.getByRole('button', { name: /Isolated/ })).toHaveAttribute('aria-pressed', 'true')
  await forms.getByRole('button', { name: /Final/ }).click()
  await expect(forms.getByRole('button', { name: /Final/ })).toHaveAttribute('aria-pressed', 'true')
  const tc = box.locator('[data-testid=trace-canvas]')
  await expect(tc.locator('.trc__ink')).toHaveAttribute('aria-label', /Bāʾ — Final/)
  await expect(tc).toHaveAttribute('data-ready', '1')

  await traceGuide(page, tc)
  await expect(tc).toHaveClass(/is-done/)
  await expect(forms.getByRole('button', { name: /Final ✓/ })).toBeVisible()
  // Sayğac yalnız tək formaları sayır
  await expect(box.locator('.trp__count')).toHaveText('0 / 33 completed')
  const prog = await page.evaluate(() => JSON.parse(localStorage.getItem('arabic_trace_v1') || '{}'))
  expect(Object.keys(prog)).toEqual(['ba@final'])

  // Tək forma hələ tamamlanmayıb
  await forms.getByRole('button', { name: /Isolated/ }).click()
  await expect(tc).not.toHaveClass(/is-done/)
  await expectCleanConsole(consoleProblems)
})

test('uşaqlar: forma seçimi yoxdur, transliterasiya və səs düyməsi var', async ({ page, consoleProblems }) => {
  await page.goto('/kids')
  await settle(page)
  await page.locator('.kids-tab', { hasText: 'Barmaqla yaz' }).click()
  const box = page.locator('[data-testid=kids-trace]')
  await expect(box.locator('[data-testid=trace-canvas]')).toHaveAttribute('data-ready', '1')
  await expect(box.locator('.trp__forms')).toHaveCount(0)
  await expect(box.getByTestId('trace-tl')).toContainText('ʾalif')
  await expect(box.getByRole('button', { name: 'Dinlə' })).toBeVisible()
  await expectCleanConsole(consoleProblems)
})

test('mobil eni (360px): forma düymələri sığır, üfüqi sürüşmə yoxdur', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 })
  await page.goto('/learn-arabic')
  await settle(page)
  const box = page.locator('[data-testid=trace-practice]')
  await box.scrollIntoViewIfNeeded()
  await expect(box.locator('.trp__forms button')).toHaveCount(4)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})
