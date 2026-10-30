// ═══════════════════════════════════════════════════════
// /quotes — sitat kartı generatoru
//   • telefonda idarəni dəyişəndə önizləmə görünüş sahəsində qalır (yapışqan)
//   • şablon və ölçü dəyişir, PNG yüklənir
//   • ?ayah=2:255 — ayə API-dən gəlir, istinad ("Bəqərə 2:255") kartda görünür
//   • öz mətnində mənbə boşdursa istinad göstərilmir
// alquran.cloud /v1/ayah sorğusu sabit cavabla əvəzlənir (fixtures.js-də yoxdur).
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const AYAH = {
  code: 200,
  status: 'OK',
  data: [
    { number: 262, text: '[test ayə 2:255]', numberInSurah: 255, edition: { identifier: 'quran-uthmani', type: 'quran' }, surah: { number: 2, name: 'سُورَةُ البَقَرَةِ', englishName: 'Al-Baqara' } },
    { number: 262, text: '[test tərcümə 2:255]', numberInSurah: 255, edition: { identifier: 'az.mammadaliyev', type: 'translation', name: 'Məmmədəliyev' }, surah: { number: 2, name: 'سُورَةُ البَقَرَةِ', englishName: 'Al-Baqara' } },
  ],
}

test.beforeEach(async ({ page }) => {
  await page.route(/api\.alquran\.cloud\/v1\/ayah\//, route => route.fulfill({ json: AYAH }))
  // Əvvəlki testin seçimləri (şablon, ölçü) yadda qalmasın
  await page.addInitScript(() => { try { localStorage.removeItem('qm_qcard_prefs') } catch { /* */ } })
})

const canvas = (page) => page.locator('canvas.qg-canvas')
const studio = (page) => page.locator('.qg-studio')

test('telefonda nəzarət dəyişəndə önizləmə ekranda qalır', async ({ page, consoleProblems }, info) => {
  test.skip(info.project.name !== 'mobile', 'yalnız telefon')
  await page.goto('/quotes')
  await settle(page)
  await expect(canvas(page)).toBeVisible()

  // Şablon: aşağıdakı sonuncu şablona qədər sürüşdür və seç
  await page.getByRole('tab', { name: 'Şablon' }).click()
  const last = page.locator('.qg-tpl').last()
  await last.scrollIntoViewIfNeeded()
  await last.click()
  await expect(studio(page)).toHaveAttribute('data-template', 'aurora')
  await expect(canvas(page)).toBeInViewport({ ratio: 0.9 })

  // Üslub: ən aşağıdakı idarə (fon şəffaflığı) — sürüşdürüb dəyiş
  await page.getByRole('tab', { name: 'Üslub' }).click()
  const opacity = page.locator('#qg-opacity')
  await opacity.scrollIntoViewIfNeeded()
  await opacity.fill('60')
  await expect(canvas(page)).toBeInViewport({ ratio: 0.9 })
  await page.getByRole('button', { name: 'Yumru' }).click()
  await expect(canvas(page)).toBeInViewport({ ratio: 0.9 })
  // Sekmələr də görünür qalır
  await expect(page.getByRole('tab', { name: 'Mətn' })).toBeInViewport()
  // Paylaş / Yüklə düymələri aşağıda yapışqandır
  await expect(page.getByRole('button', { name: 'Paylaş' })).toBeInViewport()

  expectCleanConsole(consoleProblems)
})

test('şablon və ölçü dəyişir, PNG yüklənir', async ({ page, consoleProblems }) => {
  await page.goto('/quotes')
  await settle(page)
  await expect(canvas(page)).toBeVisible()

  await page.getByRole('tab', { name: 'Şablon' }).click()
  await page.locator('.qg-tpl[data-template-id="night"]').click()
  await expect(studio(page)).toHaveAttribute('data-template', 'night')
  await expect(page.locator('.qg-tpl[data-template-id="night"]')).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('tab', { name: 'Ölçü' }).click()
  await page.getByRole('button', { name: /Hekayə/ }).click()
  await expect(studio(page)).toHaveAttribute('data-format', 'story')
  await expect(canvas(page)).toHaveAttribute('data-format', 'story')
  // Kartın nisbəti 9:16
  await expect.poll(async () => {
    const b = await canvas(page).boundingBox()
    return b ? Math.round((b.height / b.width) * 100) / 100 : 0
  }).toBeGreaterThan(1.7)
  await expect(canvas(page)).toBeInViewport({ ratio: 0.9 })

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Şəkil kimi yüklə' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^muslims-cc-.+-story\.png$/)
  // Fayl həqiqətən PNG-dir və 1080×1920 ölçüdədir
  const path = await download.path()
  const fs = await import('node:fs')
  const buf = fs.readFileSync(path)
  expect(buf.subarray(1, 4).toString()).toBe('PNG')
  expect(buf.readUInt32BE(16)).toBe(1080)
  expect(buf.readUInt32BE(20)).toBe(1920)

  expectCleanConsole(consoleProblems)
})

test('ayə istinadı kartda görünür (?ayah=2:255)', async ({ page, consoleProblems }) => {
  await page.goto('/quotes?ayah=2:255')
  await settle(page)
  await expect(studio(page)).toHaveAttribute('data-source', 'ayah')
  await expect(page.getByTestId('quote-ref')).toHaveText(/Bəqərə 2:255/)
  await expect(canvas(page)).toHaveAttribute('aria-label', /\[test ayə 2:255\].*Bəqərə 2:255/)
  await expect(canvas(page)).toBeInViewport()

  // Başqa ayə — tez seçim
  await page.getByRole('button', { name: '94:5' }).click()
  await expect(page.getByTestId('quote-ref')).toHaveText(/94:5/)
  expectCleanConsole(consoleProblems)
})

test('öz mətni: mənbə boşdursa istinad göstərilmir', async ({ page, consoleProblems }) => {
  await page.goto('/quotes')
  await settle(page)
  await page.getByRole('button', { name: 'Öz mətnim' }).click()
  await page.getByLabel('Mətniniz', { exact: true }).fill('Bu gün yaxşı bir iş gör')
  await expect(canvas(page)).toHaveAttribute('aria-label', /Bu gün yaxşı bir iş gör$/)
  await expect(page.getByTestId('quote-ref')).toHaveCount(0)
  await page.getByLabel('Mənbə (istəyə görə)').fill('Atalar sözü')
  await expect(page.getByTestId('quote-ref')).toHaveText(/Atalar sözü/)
  expectCleanConsole(consoleProblems)
})

test('/ar/quotes — RTL və ərəbcə interfeys', async ({ page, consoleProblems }) => {
  await page.goto('/ar/quotes?ayah=2:255')
  await settle(page)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByRole('tab', { name: 'القالب' })).toBeVisible()
  await expect(page.getByTestId('quote-ref')).toHaveText(/2:255/)
  expectCleanConsole(consoleProblems)
})
