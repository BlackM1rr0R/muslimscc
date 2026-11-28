// Paralel tərcümə: ərəb + 2–3 tərcümə sütunlarda, ayə sətri bütün sütunlarda vurğulanır, seçim yadda qalır
import { test, expect, settle } from './fixtures.js'

// alquran.cloud — hər nəşrin ÖZ mətni (sütunların qarışmadığını yoxlamaq üçün)
async function mockAlquran(page, seen = []) {
  await page.route(/api\.alquran\.cloud\/v1\/surah\/\d+\/editions\//, route => {
    const eds = decodeURIComponent(route.request().url().split('/editions/')[1].split('?')[0]).split(',')
    seen.push(eds.join(','))
    route.fulfill({ json: { code: 200, status: 'OK', data: eds.map(e => ({
      number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha', englishNameTranslation: 'The Opening', numberOfAyahs: 7, revelationType: 'Meccan',
      ayahs: Array.from({ length: 7 }, (_, i) => ({ number: i + 1, numberInSurah: i + 1, text: `[${e} ${i + 1}]`, juz: 1, page: 1 })),
      edition: { identifier: e, language: e.split('.')[0], type: e.startsWith('ar.') && e !== 'ar.muyassar' ? 'quran' : 'translation', format: 'text' },
    })) } })
  })
}
const SURA_RE = /quranenc\.com\/api\/v1\/translation\/sura\/([a-z_]+)\/(\d+)/
async function mockQuranEnc(page) {
  await page.route(SURA_RE, route => {
    const [, key, sura] = route.request().url().match(SURA_RE)
    route.fulfill({ json: { result: Array.from({ length: 7 }, (_, i) => ({ id: String(i + 1), sura, aya: String(i + 1), arabic_text: 'x', translation: `[${key} ${i + 1}]`, footnotes: '' })) } })
  })
  await page.route(/quranenc\.com\/api\/v1\/translations\/list\//, route => route.fulfill({ json: { translations: [] } }))
}
const noHorizontalScroll = (page) => page.evaluate(() => document.scrollingElement.scrollWidth <= window.innerWidth + 1)

test('Paralel tərcümə: rejim açılır, 2 tərcümə seçilir, sütunlar, ayə vurğusu, seçim yadda qalır', async ({ page }, info) => {
  await mockAlquran(page)
  await mockQuranEnc(page)
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  await expect(page.locator('#ayah-1')).toBeVisible()
  // Adi rejimdə paralel sətir yoxdur
  await expect(page.getByTestId('par-row')).toHaveCount(0)

  const toggle = page.getByTestId('par-toggle')
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  const panel = page.getByTestId('par-panel')
  await expect(panel).toBeVisible()
  // İlkin seçim: Məmmədəliyev (standart) + Musayev (QuranEnc)
  await expect(page.locator('#ayah-1 .par-cell')).toHaveCount(2)

  // Musayev əvəzinə ingiliscə Əsəd
  await panel.locator('input[data-key="azeri_musayev"]').uncheck()
  await panel.locator('input[data-key="en.asad"]').check()
  const rows = page.getByTestId('par-row')
  await expect(rows).toHaveCount(7)
  const r3 = page.locator('#ayah-3 [data-testid="par-row"]')
  await expect(r3.locator('.ayah-arabic')).toHaveAttribute('dir', 'rtl')
  await expect(r3.locator('.par-cell[data-col="az.mammadaliyev"]')).toContainText('[az.mammadaliyev 3]')
  await expect(r3.locator('.par-cell[data-col="en.asad"]')).toContainText('[en.asad 3]')
  await expect(r3.locator('.par-cell[data-col="en.asad"]')).toHaveAttribute('lang', 'en')

  if (info.project.name === 'desktop') {
    // Başlıqda tərcüməçilərin adları; sütunlar yan-yana və bütün sətirlərdə eyni x mövqeyində
    const head = page.getByTestId('par-head')
    await expect(head).toContainText('Məmmədəliyev')
    await expect(head).toContainText('Muhammad Asad')
    const x1 = await page.locator('#ayah-1 .par-cell[data-col="en.asad"]').boundingBox()
    const x5 = await page.locator('#ayah-5 .par-cell[data-col="en.asad"]').boundingBox()
    const a1 = await page.locator('#ayah-1 .par-row .ayah-arabic').boundingBox()
    expect(Math.abs(x1.x - x5.x)).toBeLessThan(1)
    expect(Math.abs(x1.width - x5.width)).toBeLessThan(1)
    expect(Math.abs(a1.y - x1.y)).toBeLessThan(2) // eyni sətirdə
  } else {
    // Telefonda alt-alta: tərcüməçi nişanı görünür, üfüqi sürüşmə yoxdur
    await expect(r3.locator('.par-cell[data-col="en.asad"] .par-cell__by')).toBeVisible()
    await expect(r3.locator('.par-cell[data-col="en.asad"] .par-cell__by')).toHaveText('Muhammad Asad')
    expect(await noHorizontalScroll(page)).toBe(true)
  }

  // Ayəyə toxunuş → həmin sətir (bütün sütunlar) vurğulanır; başqa ayə — vurğu keçir
  await r3.locator('.par-cell[data-col="en.asad"]').click()
  await expect(page.locator('#ayah-3')).toHaveAttribute('data-par-sel', '')
  await expect(page.locator('[data-par-sel]')).toHaveCount(1)
  const bg = await r3.evaluate(el => getComputedStyle(el).backgroundColor)
  expect(bg).not.toBe('rgba(0, 0, 0, 0)')
  await page.locator('#ayah-5 .par-cell[data-col="az.mammadaliyev"]').click()
  await expect(page.locator('#ayah-5')).toHaveAttribute('data-par-sel', '')
  await expect(page.locator('#ayah-3')).not.toHaveAttribute('data-par-sel', '')
  // Ayə düymələri işləyir (saxla)
  const save = page.locator('#ayah-5 .ayah-actions .ayah-tool[aria-pressed]')
  await save.click()
  await expect(save).toHaveAttribute('aria-pressed', 'true')

  // Yenidən yüklə — rejim və seçim yaddadır
  await page.reload()
  await settle(page)
  await expect(page.getByTestId('par-toggle')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('#ayah-2 .par-cell[data-col="en.asad"]')).toContainText('[en.asad 2]')
  await expect(page.locator('#ayah-2 .par-cell')).toHaveCount(2)
  await expect(page.getByTestId('par-panel').locator('input[data-key="azeri_musayev"]')).not.toBeChecked()

  // Söndür — adi oxuma qayıdır
  await page.getByTestId('par-toggle').click()
  await expect(page.getByTestId('par-row')).toHaveCount(0)
  await expect(page.locator('#ayah-1 .ayah-trans')).toContainText('[az.mammadaliyev 1]')
})

test('Paralel tərcümə: üç nəşr bir sorğuda, 3-dən çox seçilmir, ərəb interfeysində RTL', async ({ page }) => {
  const seen = []
  await mockAlquran(page, seen)
  await mockQuranEnc(page)
  await page.addInitScript(() => {
    if (!localStorage.getItem('quran_parallel')) localStorage.setItem('quran_parallel', JSON.stringify({ on: true, keys: ['en.asad', 'ru.kuliev', 'tr.diyanet'] }))
  })
  await page.goto('/ar/quran/1-al-faatiha')
  await settle(page)
  const row = page.locator('#ayah-1 [data-testid="par-row"]')
  await expect(row.locator('.par-cell')).toHaveCount(3)
  await expect(row.locator('.par-cell[data-col="tr.diyanet"]')).toContainText('[tr.diyanet 1]')
  // Seçilmiş nəşrlər vergüllə BİR sorğuda
  expect(seen).toContain('en.asad,ru.kuliev,tr.diyanet')
  // Həddə çatılıb — qalan seçimlər bağlıdır
  await expect(page.getByTestId('par-panel').locator('input[data-key="az.mammadaliyev"]')).toBeDisabled()
  // RTL: sənəd rtl, ərəb sütunu rtl, ingiliscə sütun ltr
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(row.locator('.par-cell[data-col="en.asad"]')).toHaveAttribute('dir', 'ltr')
  await expect(row.locator('.ayah-arabic')).toHaveAttribute('dir', 'rtl')
  expect(await noHorizontalScroll(page)).toBe(true)
})
