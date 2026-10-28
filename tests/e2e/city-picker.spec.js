// ═══════════════════════════════════════════════════════
// Namaz şəhəri seçicisi (components/CityPicker):
//   • ana səhifənin namaz kartında şəhər adı → seçici açılır
//   • "seki" yazanda Şəki çıxır (diakritikasız axtarış)
//   • seçəndə kartdakı ad dəyişir və aladhan sorğusu yeni koordinatla gedir
//   • Esc bağlayır, reload-dan sonra seçim qalır
//   • siyahıda olmayan şəhər — Open-Meteo geocoding (saxta cavab) ilə
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

// Open-Meteo geocoding — sabit cavab (Vyana)
const VIENNA = { id: 2761369, name: 'Vyana', latitude: 48.20849, longitude: 16.37208, feature_code: 'PPLC', country_code: 'AT', country: 'Avstriya', admin1: 'Vyana', timezone: 'Europe/Vienna' }

test.beforeEach(async ({ page }) => {
  await page.route(/geocoding-api\.open-meteo\.com\/v1\/search/, route => route.fulfill({ json: { results: [VIENNA] } }))
  await page.route(/geocoding-api\.open-meteo\.com\/v1\/get/, route => {
    const lang = new URL(route.request().url()).searchParams.get('language')
    const names = { en: 'Vienna', ru: 'Вена', ar: 'فيينا', tr: 'Viyana', az: 'Vyana' }
    route.fulfill({ json: { ...VIENNA, name: names[lang] || VIENNA.name } })
  })
})

const card = (page) => page.locator('.hp-pc')
const trigger = (page) => card(page).getByRole('button', { name: /Şəhəri dəyiş/ })

test('ana səhifədə şəhər seçilir, vaxtlar yeni koordinatla gəlir, seçim qalır', async ({ page, consoleProblems }) => {
  await page.goto('/')
  await settle(page)
  await expect(trigger(page)).toContainText('Bakı')

  await trigger(page).click()
  const dialog = page.getByRole('dialog', { name: 'Şəhər seçin' })
  await expect(dialog).toBeVisible()
  const box = dialog.getByRole('combobox')
  await expect(box).toBeFocused()
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true')

  await box.fill('seki')
  const option = dialog.getByRole('option', { name: /^Şəki/ })
  await expect(option).toBeVisible()
  // Birinci nəticə aktivdir (aria-activedescendant)
  await expect(box).toHaveAttribute('aria-activedescendant', await option.getAttribute('id'))

  const req = page.waitForRequest(r => r.url().includes('api.aladhan.com') && r.url().includes('latitude=41.1919') && r.url().includes('longitude=47.1706'))
  await box.press('Enter')
  await req
  await expect(dialog).toBeHidden()
  await expect(trigger(page)).toContainText('Şəki')
  await expect(trigger(page)).toBeFocused()
  await expect(page.getByText('05:32', { exact: true }).first()).toBeVisible()

  await page.reload()
  await settle(page)
  await expect(trigger(page)).toContainText('Şəki')
  expectCleanConsole(consoleProblems)
})

test('Esc bağlayır, klaviatura ilə seçim, /prayer ilə ortaq seçim', async ({ page, consoleProblems }) => {
  await page.goto('/prayer')
  await settle(page)
  const open = page.getByRole('button', { name: /Şəhəri dəyiş/ }).first()
  await open.click()
  const dialog = page.getByRole('dialog', { name: 'Şəhər seçin' })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(open).toHaveAttribute('aria-expanded', 'false')

  // Qrup başlıqları və ↓ ilə gəzmək
  await open.click()
  await expect(dialog.getByRole('group', { name: 'Azərbaycan' })).toBeVisible()
  const box = dialog.getByRole('combobox')
  await box.fill('gence')
  await box.press('ArrowDown')
  await box.press('ArrowUp')
  await box.press('Enter')
  await expect(dialog).toBeHidden()
  await expect(open).toContainText('Gəncə')

  // Ana səhifə eyni şəhəri göstərir
  await page.goto('/')
  await settle(page)
  await expect(trigger(page)).toContainText('Gəncə')
  expectCleanConsole(consoleProblems)
})

test('siyahıda olmayan şəhər — dünyada axtarış (Open-Meteo)', async ({ page, consoleProblems }) => {
  await page.goto('/prayer')
  await settle(page)
  const open = page.getByRole('button', { name: /Şəhəri dəyiş/ }).first()
  await open.click()
  const dialog = page.getByRole('dialog', { name: 'Şəhər seçin' })
  const box = dialog.getByRole('combobox')
  await box.fill('Vyana')
  // Siyahıda yoxdur → axtarış özü başlayır
  const result = dialog.getByRole('option', { name: /^Vyana/ })
  await expect(result).toBeVisible()
  const req = page.waitForRequest(r => r.url().includes('api.aladhan.com') && r.url().includes('latitude=48.2085') && r.url().includes('timezonestring=Europe%2FVienna'))
  await result.click()
  await req
  await expect(dialog).toBeHidden()
  await expect(open).toContainText('Vyana')

  // Saxlanılmış xüsusi yer — 5 dildə ad, reload-dan sonra da
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('muslim_cc_custom_city')))
  expect(saved).toMatchObject({ lat: 48.2085, lng: 16.3721, tz: 'Europe/Vienna', country: 'AT' })
  expect(saved.label).toMatchObject({ az: 'Vyana', en: 'Vienna', ru: 'Вена', tr: 'Viyana' })
  await page.reload()
  await settle(page)
  await expect(page.getByRole('button', { name: /Şəhəri dəyiş/ }).first()).toContainText('Vyana')
  expectCleanConsole(consoleProblems)
})
