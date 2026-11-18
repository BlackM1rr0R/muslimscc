// ═══════════════════════════════════════════════════════
// Miras hesablayıcısı (/inheritance, utils/faraid.js) — UI axını
//   • boş: "malın məbləğini yazın…" ipucu; nəticə cədvəli yoxdur
//   • mal + varislər → paylar və məbləğlər tests/unit/faraid.test.js-in klassik məsələləri ilə eynidir,
//     məbləğlərin cəmi = varislərə qalan mal
//   • Öməriyyə (ər + ana + ata) — qeyd göstərilir; "Sıfırla" boş vəziyyətə qaytarır
//   • /ar: RTL, kəsrlər soldan sağa (bdi dir=ltr)
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const ESTATE = 2400
const money = (s) => Number(String(s).replace(/[^\d.-]/g, ''))     // en-US: "1,400.00" → 1400

/** Cədvəl sətri varisin adı ilə (ad dəqiq — "Son" ≠ "Grandson") */
const row = (page, name) => page.locator('.inh-table tbody tr').filter({
  has: page.locator('.inh-table__name', { hasText: new RegExp(`^${name}( × \\d+)?$`) }),
})

async function shareOf(page, name) {
  const r = row(page, name)
  await expect(r).toHaveCount(1)
  return {
    fraction: (await r.locator('td').first().locator('.inh-frac').first().innerText()).trim(),
    total: money(await r.locator('.inh-table__total').innerText()),
  }
}

test('/en: arvad + oğul + qız (faraid.test #1) — 1/8, 7/12, 7/24; cəm = mal', async ({ page, consoleProblems }) => {
  await page.goto('/en/inheritance')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Inheritance calculator' })).toBeVisible()
  await expect(page.locator('.inh-empty')).toContainText('Enter the estate value and select at least one heir')
  await expect(page.locator('.inh-table')).toHaveCount(0)

  await page.getByLabel('Total estate').fill(String(ESTATE))
  await page.getByRole('radio', { name: 'Man', exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Man', exact: true })).toHaveAttribute('aria-checked', 'true')
  // Kişi vəfat edib — "Husband" seçimi yoxdur
  await expect(page.getByRole('button', { name: 'Husband', exact: true })).toHaveCount(0)
  // Arvad — sayğac (4-ə qədər), ər/ata/ana — açar düymə
  await page.getByRole('button', { name: 'Increase: Wife', exact: true }).click()
  await page.getByRole('button', { name: 'Increase: Son', exact: true }).click()
  await page.getByRole('button', { name: 'Increase: Daughter', exact: true }).click()

  await expect(page.locator('.inh-table')).toBeVisible()
  expect(await shareOf(page, 'Wife')).toEqual({ fraction: '1/8', total: 300 })
  expect(await shareOf(page, 'Son')).toEqual({ fraction: '7/12', total: 1400 })
  expect(await shareOf(page, 'Daughter')).toEqual({ fraction: '7/24', total: 700 })
  // Ümumi mal = varislərə qalan (çıxılan yoxdur), məbləğlərin cəmi də eyni
  await expect(page.locator('.inh-summary__net dd')).toHaveText('2,400.00')
  const totals = await page.locator('.inh-table tbody .inh-table__total').allInnerTexts()
  expect(totals.map(money).reduce((a, b) => a + b, 0)).toBe(ESTATE)

  // Sıfırla → boş vəziyyət
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(page.locator('.inh-table')).toHaveCount(0)
  await expect(page.getByLabel('Total estate')).toHaveValue('')
  expectCleanConsole(consoleProblems)
})

test("/en: Öməriyyə — ər + ana + ata (faraid.test #2) → 1/2, 1/6, 1/3 və qeyd", async ({ page, consoleProblems }) => {
  await page.goto('/en/inheritance')
  await settle(page)
  await page.getByLabel('Total estate').fill(String(ESTATE))
  await page.getByRole('radio', { name: 'Woman', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Increase: Wife', exact: true })).toHaveCount(0)
  for (const h of ['Husband', 'Mother', 'Father']) await page.getByRole('button', { name: h, exact: true }).click()

  expect(await shareOf(page, 'Husband')).toEqual({ fraction: '1/2', total: 1200 })
  expect(await shareOf(page, 'Mother')).toEqual({ fraction: '1/6', total: 400 })
  expect(await shareOf(page, 'Father')).toEqual({ fraction: '1/3', total: 800 })
  await expect(page.locator('.inh-notes')).toContainText('ʿUmariyyah')
  expectCleanConsole(consoleProblems)
})

test('/ar: RTL, kəsr soldan sağa, məbləğ ərəb dilində', async ({ page, consoleProblems }) => {
  await page.goto('/ar/inheritance')
  await settle(page)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByRole('heading', { level: 1, name: 'حاسبة المواريث' })).toBeVisible()
  await page.getByLabel('إجمالي التركة').fill(String(ESTATE))
  await page.getByRole('button', { name: 'زيادة: الزوجة', exact: true }).click()
  await page.getByRole('button', { name: 'زيادة: الابن', exact: true }).click()
  const wifeRow = row(page, 'الزوجة')
  await expect(wifeRow).toHaveCount(1)
  const frac = wifeRow.locator('td').first().locator('.inh-frac').first()
  await expect(frac).toHaveText('1/8')
  await expect(frac).toHaveAttribute('dir', 'ltr')
  // ar-u-nu-latn: latın rəqəmləri
  expect(money(await wifeRow.locator('.inh-table__total').innerText())).toBe(300)
  await expect(page.locator('main')).not.toContainText(/[əƏ]/)
  expectCleanConsole(consoleProblems)
})
