// v7 "Toxunma": "Adın ərəb xəttilə" (/name-in-arabic) və "Barmaqla yaz" məşqi (/learn-arabic, /kids)
//   • ad lüğətdən (standart) / təxmini / "Əbd" qeydi / hərf-hərf düzəliş
//   • iz mühərriki: siçan / toxunuşla yazmaq, tamamlanma, "Yazmadan tamamla", irəliləyiş yaddaşı
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

// Kətanın üstündən xətt: from/to — kətan ölçüsünə nisbətdə [x, y]
async function stroke(page, canvas, from, to, steps = 24) {
  const b = await canvas.boundingBox()
  await page.mouse.move(b.x + b.width * from[0], b.y + b.height * from[1])
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(b.x + b.width * (from[0] + ((to[0] - from[0]) * i) / steps), b.y + b.height * (from[1] + ((to[1] - from[1]) * i) / steps))
  }
  await page.mouse.up()
}

test('ad: lüğətdən standart yazılış, məna, üslub və hərf-hərf düzəliş', async ({ page, consoleProblems }) => {
  await page.goto('/name-in-arabic')
  await settle(page)
  await page.fill('#ncal-input', 'Məhəmməd')
  await page.locator('.ncal-form button[type=submit]').click()
  await expect(page.locator('[data-testid=ncal-status]')).toHaveAttribute('data-kind', 'dict')
  await expect(page.locator('.nink .ui-sr-only')).toHaveText('محمد')
  await expect(page.locator('.nink')).toHaveClass(/is-ready/)
  await expect(page.locator('[data-testid=ncal-meaning]')).toBeVisible()
  await page.getByRole('radio', { name: /Kufi/ }).click()
  await expect(page.getByRole('radio', { name: /Kufi/ })).toHaveAttribute('aria-checked', 'true')

  // Hərf-hərf düzəliş: birinci hərfi dəyiş → "sizin düzəlişinizlə"
  await page.getByRole('button', { name: /Hərf-hərf/ }).click()
  await page.locator('.ncal-edit__picker button', { hasText: 'ب' }).first().click()
  await expect(page.locator('[data-testid=ncal-status]')).toHaveAttribute('data-kind', 'edited')
  await expect(page.locator('.nink .ui-sr-only')).toHaveText('بحمد')
  await expectCleanConsole(consoleProblems)
})

test('ad: lüğətdə olmayan — təxmini; "Əbd" + Allahdan başqası — mənbəli qeyd', async ({ page, consoleProblems }) => {
  await page.goto('/en/name-in-arabic')
  await settle(page)
  await page.fill('#ncal-input', 'Elnur')
  await page.locator('.ncal-form button[type=submit]').click()
  await expect(page.locator('[data-testid=ncal-status]')).toHaveAttribute('data-kind', 'approx')
  await expect(page.locator('[data-testid=ncal-status]')).toContainText('Approximate')
  await expect(page.locator('[data-testid=ncal-meaning]')).toHaveCount(0)
  await page.fill('#ncal-input', 'Abdunnabi')
  await page.locator('.ncal-form button[type=submit]').click()
  await expect(page.locator('[data-testid=ncal-abd-note]')).toContainText('Ibn Hazm')
  await expect(page.locator('[data-testid=ncal-abd-note]')).toContainText('Tuhfat al-Mawdud')
  await expectCleanConsole(consoleProblems)
})

test('ad: "Özün yaz" — iz kətanı açılır, yazmadan tamamlamaq olur', async ({ page, consoleProblems }) => {
  await page.goto('/name-in-arabic')
  await settle(page)
  await page.locator('.ncal-examples .ui-chip', { hasText: 'Məhəmməd' }).click()
  await page.getByRole('button', { name: /Özün yaz/ }).click()
  const tc = page.locator('[data-testid=trace-canvas]')
  await expect(tc).toHaveAttribute('data-ready', '1')
  await tc.getByRole('button', { name: 'Göstər' }).click()
  await expect(tc.locator('[data-testid=trace-result]')).toContainText('Sağdan sola')
  await tc.getByRole('button', { name: 'Yazmadan tamamla' }).click()
  await expect(tc).toHaveClass(/is-done/)
  await expectCleanConsole(consoleProblems)
})

test('məşq: əlifi yuxarıdan aşağı yazmaq tamamlayır, irəliləyiş saxlanır', async ({ page, consoleProblems }) => {
  await page.goto('/en/learn-arabic')
  await settle(page)
  const box = page.locator('[data-testid=trace-practice]')
  await box.scrollIntoViewIfNeeded()
  const tc = box.locator('[data-testid=trace-canvas]')
  await expect(tc).toHaveAttribute('data-ready', '1')
  // Əlifin xətti kətanın ortasındadır — yuxarıdan aşağı bir neçə dəfə
  const ink = tc.locator('.trc__ink')
  for (const dx of [-0.012, 0, 0.012]) await stroke(page, ink, [0.5 + dx, 0.15], [0.5 + dx, 0.88])
  await expect(tc).toHaveClass(/is-done/)
  await expect(box.locator('.trp__count')).toHaveText('1 / 33 completed')

  // Növbəti (be) — yazmadan tamamla; yenidən yükləyəndə irəliləyiş qalır
  await tc.getByRole('button', { name: 'Next' }).click()
  await box.getByRole('button', { name: 'Complete without drawing' }).click()
  await expect(box.locator('.trp__count')).toHaveText('2 / 33 completed')
  await page.reload()
  await settle(page)
  await expect(page.locator('[data-testid=trace-practice] .trp__count')).toHaveText('2 / 33 completed')
  await expectCleanConsole(consoleProblems)
})

test('məşq: əlifi aşağıdan yuxarı yazmaq — istiqamət xəbərdarlığı', async ({ page }) => {
  await page.goto('/en/learn-arabic')
  await settle(page)
  const tc = page.locator('[data-testid=trace-practice] [data-testid=trace-canvas]')
  await tc.scrollIntoViewIfNeeded()
  await expect(tc).toHaveAttribute('data-ready', '1')
  const ink = tc.locator('.trc__ink')
  for (const dx of [-0.012, 0, 0.012]) await stroke(page, ink, [0.5 + dx, 0.88], [0.5 + dx, 0.15])
  await expect(tc.locator('[data-testid=trace-result]')).toContainText('top down')
  await expect(tc).not.toHaveClass(/is-done/)
})

test('uşaqlar: "Barmaqla yaz" bölməsi', async ({ page, consoleProblems }) => {
  await page.goto('/kids')
  await settle(page)
  await page.locator('.kids-tab', { hasText: 'Barmaqla yaz' }).click()
  const box = page.locator('[data-testid=kids-trace]')
  await expect(box.locator('.trp__grid button')).toHaveCount(28)
  await expect(box.locator('[data-testid=trace-canvas]')).toHaveAttribute('data-ready', '1')
  await expectCleanConsole(consoleProblems)
})
