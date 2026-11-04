// ═══════════════════════════════════════════════════════
// AI cavabına 👍/👎 (components/AIRating.jsx)
//   • 👍 — yalnız "Təşəkkürlər", heç bir sorğu getmir
//   • 👎 → səbəb + qeyd → POST /api/feedback { kind:'ai' } — sual və cavab mətndədir
//   • salamlama mesajında (sualsız) qiymət düymələri yoxdur
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const sse = (parts) => parts.map(t => `data: ${JSON.stringify({ t })}\n\n`).join('') + 'data: {"done":true}\n\n'

test('👎: səbəb və qeyd ilə sual + cavab yoxlamaya göndərilir', async ({ page, consoleProblems }, info) => {
  test.skip(info.project.name !== 'desktop', 'yalnız masaüstü (AI səhifəsi eynidir)')
  await page.route(/\/api\/ask-ai/, r => r.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body: sse(['Sübh namazı 2 rükətdir.']) }))
  const sent = []
  await page.route(/\/api\/feedback$/, r => { sent.push(r.request().postDataJSON()); return r.fulfill({ status: 201, json: { ok: true } }) })

  await page.goto('/aichat')
  await settle(page)
  const box = page.locator('.aic-input')
  await box.fill('Sübh neçə rükətdir?')
  await box.press('Enter')
  const answer = page.locator('.aic-msg-assistant').filter({ hasText: 'Sübh namazı 2 rükətdir.' })
  await expect(answer).toBeVisible()

  // 👎 → forma
  await answer.getByRole('button', { name: 'Cavabda problem var' }).click()
  await answer.getByText('Mənbə yoxdur və ya səhvdir').click()
  await answer.getByRole('textbox').fill('Buxari 1172-yə baxın')
  await expect(answer.getByText('sualınız və bu cavab göndəriləcək')).toBeVisible()
  await answer.getByRole('button', { name: 'Göndər' }).click()
  await expect(answer.getByRole('status')).toContainText('cavab yoxlanılacaq')

  expect(sent).toHaveLength(1)
  expect(sent[0]).toMatchObject({ kind: 'ai', ref: 'ai', lang: 'az', page: '/aichat' })
  expect(sent[0].text).toContain('[source] Buxari 1172-yə baxın')
  expect(sent[0].text).toContain('Sübh neçə rükətdir?')
  expect(sent[0].text).toContain('Sübh namazı 2 rükətdir.')

  expectCleanConsole(consoleProblems)
})

// Ayrıca test: saytın öz sürət limiti ardıcıl ikinci sualı gecikdirir
test('👍: yalnız "Təşəkkürlər", heç bir sorğu getmir', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'yalnız masaüstü')
  await page.route(/\/api\/ask-ai/, r => r.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body: sse(['Bəli, düzgündür.']) }))
  const sent = []
  await page.route(/\/api\/feedback$/, r => { sent.push(1); return r.fulfill({ status: 201, json: { ok: true } }) })
  await page.goto('/aichat')
  await settle(page)
  await page.locator('.aic-input').fill('Sual')
  await page.locator('.aic-input').press('Enter')
  const answer = page.locator('.aic-msg-assistant').filter({ hasText: 'Bəli, düzgündür.' })
  await answer.getByRole('button', { name: 'Faydalı cavab' }).click()
  await expect(answer.getByRole('status')).toContainText('Təşəkkürlər')
  expect(sent).toHaveLength(0)
})
