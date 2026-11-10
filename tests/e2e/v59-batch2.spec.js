// v5.9 (2-ci partiya): İslam həndəsi naxışı, Hicrət 3D, səhifənin öz paylaşma şəkli
import { test, expect, settle } from './fixtures.js'

const scrollTo = async (page, loc) => {
  for (let i = 0; i < 40 && !(await loc.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(150) }
  await loc.scrollIntoViewIfNeeded()
}

test('Naxış generatoru: kətan çəkilir, ulduz növü və bucaq dəyişir, divar kağızı yüklənir', async ({ page }) => {
  await page.goto('/quotes')
  await settle(page)
  const ps = page.getByTestId('pattern-studio')
  await scrollTo(page, ps)
  const cv = ps.getByTestId('ps-canvas')
  const sig = () => cv.evaluate(c => c.toDataURL().length)
  await expect.poll(sig).toBeGreaterThan(5000)
  const a = await sig()
  await ps.getByTestId('ps-kind-12').click()
  await expect(ps.getByTestId('ps-kind-12')).toHaveAttribute('aria-checked', 'true')
  await expect.poll(sig).not.toBe(a)
  await ps.getByTestId('ps-angle').fill('45')
  await expect(ps).toContainText('45°')
  const dl = page.waitForEvent('download')
  await ps.getByTestId('ps-save').click()
  expect((await dl).suggestedFilename()).toMatch(/pattern-12\.png$/)
})

test('Hicrət 3D: kətan, addımlar, mənbə və növbəti', async ({ page }) => {
  await page.goto('/history')
  await settle(page)
  const h = page.getByTestId('hijra-3d')
  await scrollTo(page, h)
  await expect(h.locator('canvas')).toHaveCount(1)
  const text = h.getByTestId('hijra3d-text')
  await expect(text).toContainText('Buxari 3905')
  const before = await text.textContent()
  await h.getByTestId('hijra3d-next').click()
  await expect(text).not.toHaveText(before)
  await h.locator('.hj3__dots button').last().click()
  await expect(h.getByTestId('hijra3d-next')).toBeDisabled()
})

test('Paylaşma şəkli: surə və ad səhifələrində öz kartı, şəkil verilir', async ({ request }) => {
  for (const [url, img] of [['/quran/2-al-baqara', '/og/quran-2.png'], ['/en/names/2-al-ahad', '/og/names-2.png']]) {
    const res = await request.get(`${url}/index.html`)   // vite preview kataloq index-ini vermir (nginx verir)
    if (res.status() !== 200) continue        // prerender yoxdursa (yalnız vite build) — keç
    const html = await res.text()
    expect(html).toContain(img)
    expect((await request.get(img)).status()).toBe(200)
  }
  const home = await (await request.get('/')).text()
  expect(home).toMatch(/og-image\.png/)
})
