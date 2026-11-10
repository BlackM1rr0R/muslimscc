// Zəkat: vergüllü/boşluqlu məbləğ (iPhone az klaviaturası), maaşdan yığım sahəsi, canlı qızıl/gümüş qiyməti
import { test, expect, settle } from './fixtures.js'

test('Zəkat: "1 500,50" yazılır, maaş yığımı cəmə düşür, nisab canlı qiymətlə', async ({ page }) => {
  // 1 USD = 1.7 AZN; qızıl 3000 $/unsiya (≈96.45 $/q), gümüş 31.1034768 $/unsiya (1 $/q)
  await page.route(/currency-api@latest\/v1\/currencies\/usd\.json/, route => route.fulfill({
    json: { date: '2026-11-10', usd: { azn: 1.7, eur: 0.9, rub: 90, try: 40, sar: 3.75, gbp: 0.8, aed: 3.67, xau: 1 / 3000, xag: 1 / 31.1034768 } },
  }))
  await page.goto('/zakat')
  await settle(page)
  const field = (name) => page.getByRole('textbox', { name })
  await expect(page.getByText('2026-11-10 bazar qiyməti').first()).toBeVisible()
  await field('Yığım / bank hesabı').fill('1 500,50')
  await expect(field('Yığım / bank hesabı')).toHaveValue('1 500,50')
  await field('Maaşdan yığılan pul (bu gün əlinizdə)').fill('500')
  await expect(page.getByTestId('zakat-salary')).toContainText('Maaşla yaşayırsınız?')
  // Cəm: 2000,50 ₼; gümüş nisabı 595 q × 1 $ × 1.7 = 1011,50 ₼ → zəkat 2,5% = 50,01 ₼
  await expect(page.locator('.zakat-due-amount, .zakat-sticky-amount').first()).toHaveText(/50[.,]01/)
  await field('Yığım / bank hesabı').fill('abc')
  await expect(field('Yığım / bank hesabı')).toHaveValue('')
})

test('Zəkat: maaşdan aylıq — zəkat ÷ 12 (əvvəlcədən), könüllü sədəqə faizlə', async ({ page }) => {
  await page.route(/currency-api@latest\/v1\/currencies\/usd\.json/, route => route.fulfill({
    json: { date: '2026-11-10', usd: { azn: 1.7, eur: 0.9, rub: 90, try: 40, sar: 3.75, gbp: 0.8, aed: 3.67, xau: 1 / 3000, xag: 1 / 31.1034768 } },
  }))
  await page.goto('/zakat')
  await settle(page)
  const mg = page.getByTestId('monthly-giving')
  await expect(mg).toContainText('Əvvəlcə yuxarıda yığımınızı yazın')
  await page.getByRole('textbox', { name: 'Yığım / bank hesabı' }).fill('2400')
  // illik 60,00 ₼ → ayda 5,00 ₼
  await expect(mg.getByTestId('mg-zakat')).toContainText(/5[.,]00/)
  await expect(mg.getByTestId('mg-zakat')).toContainText(/60[.,]00/)
  await mg.getByTestId('mg-tab-s').click()
  await mg.getByTestId('mg-salary').fill('1 000')
  await expect(mg.getByTestId('mg-sadaqa')).toContainText(/25[.,]00/)
  await mg.getByRole('radio', { name: '10%' }).click()
  await expect(mg.getByTestId('mg-sadaqa')).toContainText(/100[.,]00/)
  await expect(mg).toContainText('zəkat deyil')
})
