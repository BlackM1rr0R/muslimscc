// ═══════════════════════════════════════════════════════
// Kamera ilə Qiblə (components/QiblaAR) — /qibla, telefonda
//   kamera və sensor saxtadır: getUserMedia boş axın, deviceorientationabsolute əl ilə
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test.use({ geolocation: { latitude: 40.4093, longitude: 49.8671 }, permissions: ['geolocation'] })

test('AR: açılır, tuşlananda "Qiblə istiqamətindəsiniz", bağlananda kamera dayanır', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'yalnız toxunma ekranı')
  await page.addInitScript(() => {
    window.__stopped = 0
    const fake = () => {
      const c = document.createElement('canvas'); c.width = 4; c.height = 4
      const s = c.captureStream(1)
      s.getTracks().forEach(tr => { const st = tr.stop.bind(tr); tr.stop = () => { window.__stopped++; st() } })
      return s
    }
    navigator.mediaDevices.getUserMedia = async () => fake()
  })
  await page.goto('/qibla')
  await settle(page)
  const btn = page.getByTestId('qibla-ar-open')
  await expect(btn).toBeVisible()
  await btn.click()
  const ar = page.getByTestId('qibla-ar')
  await expect(ar).toBeVisible()
  await expect(ar).toContainText('km')
  // Bakıdan Qiblə ≈ 240.9°; dik telefon: bucaq = 360 − alpha
  const deg = await page.locator('.qibla-angle-val [data-count]').getAttribute('data-count')
  const alpha = (360 - Number(deg)) % 360
  for (let i = 0; i < 40; i++) {
    await page.evaluate((a) => window.dispatchEvent(Object.assign(new Event('deviceorientationabsolute'), { alpha: a, beta: 90, gamma: 0, absolute: true })), alpha)
  }
  await expect(ar).toContainText('Qiblə istiqamətindəsiniz', { timeout: 5000 })
  // v5.7: sabit oxunuşlar — kompas dəqiqdir
  await expect(ar.getByTestId('qar-acc')).toContainText('Kompas dəqiqdir')
  // səpələnən oxunuşlar — dəqiq deyil
  for (let i = 0; i < 40; i++) {
    await page.evaluate(([a, i]) => window.dispatchEvent(Object.assign(new Event('deviceorientationabsolute'), { alpha: (a + (i % 2 ? 60 : -60) + 360) % 360, beta: 90, gamma: 0, absolute: true })), [alpha, i])
  }
  await expect(ar.getByTestId('qar-acc')).toContainText('dəqiq deyil')
  // telefon üfüqi (beta ≈ 0) — dik tutma xəbərdarlığı
  await page.evaluate((a) => window.dispatchEvent(Object.assign(new Event('deviceorientationabsolute'), { alpha: a, beta: 5, gamma: 0, absolute: true })), alpha)
  await expect(ar).toContainText('Telefonu dik tutun')
  // 90° sağa dönəndə — kənarda ox
  for (let i = 0; i < 60; i++) {
    await page.evaluate((a) => window.dispatchEvent(Object.assign(new Event('deviceorientationabsolute'), { alpha: a, beta: 90, gamma: 0, absolute: true })), (alpha + 90) % 360)
  }
  await expect(ar.locator('.qar__edge')).toBeVisible()
  await ar.getByRole('button', { name: 'Bağla' }).click()
  await expect(ar).toHaveCount(0)
  expect(await page.evaluate(() => window.__stopped)).toBeGreaterThan(0)
})
