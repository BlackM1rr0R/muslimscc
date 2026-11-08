// v5.8 (1-ci partiya): seçib paylaş, divar kağızı, yan ekran lövhəsi, 404 Qibləsi, Məkkə canlı yayımı
import { test, expect, settle } from './fixtures.js'

test('seçib paylaş: ayə mətnini seçəndə menyu, "Şəkil kartı" sitat generatoruna aparır', async ({ page }) => {
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  // saxta ayə mətni qısadır — bütün kartı (ərəbcə + tərcümə) seçirik; menyu boş vaxtda yüklənir
  const card = page.locator('#ayah-2 .ayah-body')
  await card.scrollIntoViewIfNeeded()
  const box = page.getByTestId('select-share')
  await expect.poll(async () => {
    await card.evaluate((el) => {
      const r = document.createRange(); r.selectNodeContents(el)
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r)
    })
    await page.waitForTimeout(400)
    return box.count()
  }, { timeout: 10000 }).toBe(1)
  await box.getByTestId('ssh-card').click()
  await expect(page).toHaveURL(/\/quotes\?.*src=Quran(\+|%20)1%3A2/)
})

test('divar kağızı: PNG yüklənir', async ({ page }) => {
  await page.goto('/prayer')
  await settle(page)
  const w = page.getByTestId('prayer-wallpaper')
  await w.scrollIntoViewIfNeeded()
  await page.evaluate(() => { navigator.canShare = () => false })
  const [dl] = await Promise.all([page.waitForEvent('download'), w.getByTestId('pwp-make').click()])
  expect(dl.suggestedFilename()).toMatch(/^namaz-vaxtlari-day\.png$/)
})

test('404: kompas Qibləni göstərir (Bakı → 207°)', async ({ page }) => {
  await page.goto('/bele-sehife-yoxdur')
  await settle(page)
  await expect(page.getByTestId('nf-qibla')).toContainText('207°')
  await expect(page.locator('.nf-qibla')).toHaveAttribute('style', /rotate\(207/)
})

test('Məkkə canlı: önizləmə → YouTube iframe (rəsmi kanal)', async ({ page }) => {
  await page.route(/youtube-nocookie\.com/, (r) => r.fulfill({ body: '<html></html>', contentType: 'text/html' }))
  await page.goto('/holyplaces')
  await settle(page)
  const live = page.getByTestId('makkah-live')
  for (let i = 0; i < 20 && !(await live.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(250) }
  await live.scrollIntoViewIfNeeded()
  await expect(live.locator('iframe')).toHaveCount(0)
  await live.getByTestId('mkl-watch').click()
  await expect(live.locator('iframe')).toHaveAttribute('src', /live_stream\?channel=UCos52azQNBgW63_9uDJoPDA/)
})

test.describe('yan ekran', () => {
  test.use({ viewport: { width: 915, height: 412 }, hasTouch: true, isMobile: true })
  test('telefonu yan çevirəndə məscid lövhəsi açılır, Bağla ilə gizlənir', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'yalnız telefon')
    await page.goto('/prayer')
    await settle(page)
    const b = page.getByTestId('landscape-board')
    await expect(b).toBeVisible()
    await expect(b.locator('li')).toHaveCount(6)
    await b.getByRole('button').click()
    await expect(b).toHaveCount(0)
  })
})
