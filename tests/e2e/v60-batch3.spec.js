// v6.0 (3-cü partiya): duaların səsi (hisnmuslim.com), səhabə ailə ağacı
import { test, expect, settle } from './fixtures.js'

test('Dua səsi: Dualar səhifəsində "Dinlə" — hisnmuslim.com faylı istənir, mənbə göstərilir', async ({ page }) => {
  await page.route(/hisnmuslim\.com\/audio\//, route => route.fulfill({ status: 200, contentType: 'audio/mpeg', body: Buffer.alloc(0) }))
  await page.goto('/duas')
  await settle(page)
  const btn = page.getByTestId('dua-listen').first()
  await expect(btn).toBeVisible()
  await expect(page.locator('.dua-listen__src').first()).toContainText('hisnmuslim.com')
  const req = page.waitForRequest(/hisnmuslim\.com\/audio\/ar\/\d+\.mp3/)
  await btn.click()
  expect((await req).url()).toMatch(/^https:\/\/www\.hisnmuslim\.com\/audio\/ar\/\d+\.mp3$/)
})

test('Səhabə ağacı: Peyğəmbər ﷺ mərkəzdə, kart əlaqələri, toxunanda/üzərinə gələndə izah', async ({ page }, info) => {
  await page.goto('/sahaba')
  await settle(page)
  const tr = page.getByTestId('sahaba-tree')
  for (let i = 0; i < 40 && !(await tr.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(150) }
  await tr.scrollIntoViewIfNeeded()
  await expect(tr).toContainText('Peyğəmbər ﷺ')
  const abuBakr = tr.locator('a', { hasText: 'Əbu Bəkr' }).first()
  if (info.project.name === 'mobile') await abuBakr.tap(); else await abuBakr.hover()
  const infoBox = tr.getByTestId('sct-info')
  await expect(infoBox).toContainText('qayınatası')
  await expect(infoBox).toContainText('satın alıb azad etdi')
  await expect(page).toHaveURL(/\/sahaba$/)
  await expect(tr.locator('.sct__others .ui-chip').first()).toBeVisible()
})
