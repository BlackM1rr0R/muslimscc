// ═══════════════════════════════════════════════════════
// /fatwa — Fətvalar və elm mənbələri (yalnız keçid kataloqu):
//   • mənbə kartları, mövzu kataloqu, şərhlər; dil/mövzu çipləri, axtarış, boş vəziyyət
//   • hədis yoxlayıcısı yalnız kənar axtarış URL-i qurur (dorar.net, yeni vərəq)
//   • bütün kənar keçidlər target=_blank + rel="noopener noreferrer"
//   • bizdəki eyni mətnin dərsinə daxili keçid; /ar — RTL
// Kənar saytlara sorğu getmir — ehtiyat üçün hamısı bloklanır.
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const EXT = /binbaz\.org\.sa|binothaimeen\.net|alifta\.gov\.sa|islamqa\.info|islamhouse\.com|dorar\.net|sunnah\.com|al-badr\.net|muqbel\.net/

test('fətva mənbələri: kartlar, süzgəclər, hədis yoxlayıcısı, keçidlər', async ({ page, consoleProblems }) => {
  await page.route(EXT, route => route.abort())
  await page.goto('/fatwa')
  await settle(page)
  await expect(page.locator('h1')).toHaveText('Fətvalar və elm mənbələri')

  // Mənbələr, mövzular, şərhlər
  await expect(page.locator('.fw-src')).toHaveCount(8)
  await expect(page.locator('.fw-topic')).toHaveCount(16)
  await expect(page.locator('.fw-matn')).toHaveCount(8)

  // Bütün kənar keçidlər təhlükəsiz açılır
  const bad = await page.locator('a[href^="http"]').evaluateAll(as => as
    .filter(a => !a.closest('header.site-header, footer'))
    .filter(a => a.target !== '_blank' || !/noopener/.test(a.rel) || !/noreferrer/.test(a.rel))
    .map(a => a.href))
  expect(bad).toEqual([])

  // Hədis yoxlayıcısı: mətn yazılmayıb → düymə deaktiv; yazılıb → dorar.net axtarış URL-i
  const checker = page.locator('#fw-checker')
  await expect(checker.getByRole('button', { name: /ad-Durar/ })).toBeDisabled()
  await page.locator('#fw-hq').fill('إنما الأعمال بالنيات')
  const dorar = checker.getByRole('link', { name: /Axtar: ad-Durar/ })
  await expect(dorar).toHaveAttribute('href', 'https://dorar.net/hadith/search?q=' + encodeURIComponent('إنما الأعمال بالنيات'))
  await expect(dorar).toHaveAttribute('target', '_blank')
  await expect(checker.getByRole('link', { name: /Axtar: Sunnah\.com/ })).toHaveAttribute('href', /^https:\/\/sunnah\.com\/search\?q=/)

  // Dil süzgəci: rusca — yalnız rus versiyası olan mənbələr, mövzularda yalnız RU keçidlər
  await page.locator('.fw-filters').first().getByRole('button', { name: 'Rusca' }).click()
  await expect(page.locator('.fw-src')).toHaveCount(2) // IslamQA, IslamHouse
  const langs = await page.locator('.fw-tlink__lang').allTextContents()
  expect(langs.length).toBeGreaterThan(0)
  expect(new Set(langs)).toEqual(new Set(['RU']))
  await expect(page.locator('#fw-mutun')).toHaveCount(0) // şərhlər yalnız ərəbcədir

  // Mövzu süzgəci
  await page.locator('.fw-filters').first().getByRole('button', { name: 'Hamısı' }).click()
  await page.locator('.fw-filters').nth(1).getByRole('button', { name: 'Oruc' }).click()
  await expect(page.locator('.fw-topic')).toHaveCount(1)
  await expect(page.locator('.fw-topic')).toContainText('Oruc')

  // Axtarış + boş vəziyyət + sıfırla
  await page.getByPlaceholder('Mənbə, mövzu və ya kitab axtar...').fill('qwertyzzz')
  await expect(page.locator('.fw-empty')).toContainText('heç nə tapılmadı')
  await page.getByRole('button', { name: 'Süzgəci sıfırla' }).click()
  await expect(page.locator('.fw-topic')).toHaveCount(16)

  // Bizdəki dərsə daxili keçid (SPA ilə)
  const ours = page.locator('.fw-matn', { hasText: 'Kitabut-Tövhid' }).getByRole('link', { name: 'Bizdə bu mətnin dərsi' })
  await expect(ours).toHaveAttribute('href', '/learn/kitab-at-tawhid')
  await ours.click()
  await expect(page).toHaveURL(/\/learn\/kitab-at-tawhid$/)

  expectCleanConsole(consoleProblems)
})

test('fətva mənbələri: ərəbcə RTL', async ({ page, consoleProblems }) => {
  await page.route(EXT, route => route.abort())
  await page.goto('/ar/fatwa')
  await settle(page)
  await expect(page.locator('h1')).toHaveText('الفتاوى ومصادر العلم')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  expectCleanConsole(consoleProblems)
})
