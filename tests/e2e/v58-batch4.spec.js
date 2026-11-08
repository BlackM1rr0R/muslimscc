// v5.8 (4-cü partiya): Hilal AR, AR Kəbə düyməsi
import { test, expect, settle } from './fixtures.js'

test('Hilal AR: açılır, Ayın istiqaməti və hündürlüyü göstərilir, tuşlananda "Ay buradadır"', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'yalnız toxunma ekranı')
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => { const c = document.createElement('canvas'); c.width = 4; c.height = 4; return c.captureStream(1) }
  })
  await page.goto('/calendar')
  await settle(page)
  await page.getByTestId('hilal-open').click()
  const ar = page.getByTestId('hilal-ar')
  await expect(ar).toBeVisible()
  await expect(ar.getByTestId('hlr-data')).toContainText('°')
  // Ayın hesablanan yerinə tuşla (üfüqdən yuxarıdadırsa)
  const txt = await ar.getByTestId('hlr-data').textContent()
  const [az, alt] = [...txt.matchAll(/(-?\d+)°/g)].map(m => Number(m[1]))
  if (alt > 0) {
    for (let i = 0; i < 40; i++) {
      await page.evaluate(([a, b]) => window.dispatchEvent(Object.assign(new Event('deviceorientationabsolute'), { alpha: (360 - a) % 360, beta: 90 + b, gamma: 0, absolute: true })), [az, alt])
    }
    await expect(ar).toContainText('Ay buradadır', { timeout: 5000 })
  }
  await ar.getByRole('button', { name: 'Bağla' }).click()
  await expect(ar).toHaveCount(0)
})

test('AR Kəbə: Android-də Scene Viewer keçidi, model faylları verilir', async ({ page, request }, info) => {
  test.skip(info.project.name !== 'mobile', 'yalnız telefon')
  await page.goto('/holyplaces')
  await settle(page)
  const k = page.getByTestId('kaaba-3d')
  for (let i = 0; i < 20 && !(await k.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(250) }
  await k.scrollIntoViewIfNeeded()
  await expect(k.getByTestId('k3d-ar')).toHaveAttribute('href', /^intent:\/\/arvr\.google\.com\/scene-viewer.*kaaba\.glb/)
  expect((await request.get('/models/kaaba.glb')).status()).toBe(200)
  expect((await request.get('/models/kaaba.usdz')).status()).toBe(200)
})

test('3D Həcc yolu: addımlar, kamera uçuşu, mətn dəyişir', async ({ page }) => {
  await page.goto('/hajjguide')
  await settle(page)
  const h = page.getByTestId('hajj-3d')
  for (let i = 0; i < 30 && !(await h.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(250) }
  await h.scrollIntoViewIfNeeded()
  await expect(h.locator('canvas')).toHaveCount(1)
  const text = h.getByTestId('hj3-text')
  const before = await text.textContent()
  await h.getByTestId('hj3-next').click()
  await expect(text).not.toHaveText(before)
  await expect(h.locator('.hj3__label.is-on')).toHaveCount(1)
  await h.locator('.hj3__dots button').nth(5).click()
  await expect(h.getByTestId('hj3-next')).toBeDisabled()
})
