// ═══════════════════════════════════════════════════════
// Hava + dua (components/home/WeatherDua) — ana səhifə
//   • aydın hava — kart yoxdur, html[data-weather] yoxdur
//   • yağış (Open-Meteo kodu 61) — hero effekti + Hisnul-Müslimin yağış duası (fəsil 65)
//   • bağla — bu gün üçün gizlənir
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test('aydın havada kart göstərilmir', async ({ page }) => {
  await page.goto('/')
  await settle(page)
  await page.waitForTimeout(1500)
  await expect(page.getByTestId('weather-dua')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.dataset.weather || '')).toBe('')
})

test('yağışda: dua kartı Hisnul-Müslimdən, bağlananda gizlənir', async ({ page }) => {
  await page.route(/api\.open-meteo\.com\/v1\/forecast/, route => route.fulfill({ json: { current: { weather_code: 61, wind_speed_10m: 8, temperature_2m: 9 } } }))
  await page.goto('/')
  await settle(page)
  const c = page.getByTestId('weather-dua')
  await expect(c).toBeVisible({ timeout: 10000 })
  await expect(c).toContainText('yağış yağır')
  await expect(c.locator('.wxd__ar')).toContainText('اللهم صيباً نافعاً')
  await expect(c).toContainText('Buxari')
  await expect(c.getByRole('link')).toHaveAttribute('href', /hisnul-muslim#hs-65$/)
  expect(await page.evaluate(() => document.documentElement.dataset.weather)).toBe('rain')
  await c.getByRole('button').click()
  await expect(c).toHaveCount(0)
  await page.reload()
  await settle(page)
  await page.waitForTimeout(1500)
  await expect(page.getByTestId('weather-dua')).toHaveCount(0)
})
