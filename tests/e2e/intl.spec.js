// Əlavə dillər (src/seo/langs.js): /id/quran — interfeys ingiliscə, tərcümə
// həmin dilin rəsmi nəşrindən; bu dildə olmayan səhifə ingiliscəyə keçir
import { test, expect, expectCleanConsole, settle } from './fixtures.js'
import { EXTRA_LANGS, EXTRA_CODES } from '../../src/seo/langs.js'

// İnterfeysi hələ tərcümə olunmamış əlavə dillər (yalnız Quran) — lüğətlər artdıqca testlər sınmasın
const QONLY = EXTRA_CODES.filter(c => !EXTRA_LANGS[c].ui)

test('indoneziyaca surə: nəşr, dil atributları, başlıq və tərcüməçi', async ({ page, consoleProblems }) => {
  const editions = []
  page.on('request', (r) => {
    const m = /\/surah\/\d+\/editions\/([^?]+)/.exec(r.url())
    if (m) editions.push(decodeURIComponent(m[1]))
  })
  await page.goto('/id/quran/1-al-faatiha')
  await settle(page)
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  await expect(page).toHaveTitle(/^Surat Al-Faatiha/)
  await expect(page.locator('.ayah-card').first()).toBeVisible()
  expect(editions.some(e => e.split(',').includes('id.indonesian'))).toBe(true)
  await expect(page.locator('.ayah-trans').first()).toHaveAttribute('lang', 'id')
  await expect(page.locator('.qp-trans-src__meta')).toContainText('Kementerian Agama RI')
  // Dil düyməsi URL-in dilini göstərir; hreflang 25 dil + x-default
  await expect(page.locator('.lang-btn .lang-code')).toHaveText('ID')
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(26)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://muslims.cc/id/quran/1-al-faatiha')
  // Növbəti surə linki də indoneziyacadır
  await expect(page.locator('.reader-pager-btn.next')).toHaveAttribute('href', /^\/id\/quran\/2-/)
  expectCleanConsole(consoleProblems)
})

test('urduca surə: interfeys urducadır (ui: true) — səhifə və tərcümə rtl', async ({ page, consoleProblems }) => {
  await page.goto('/ur/quran/1-al-faatiha')
  await settle(page)
  await expect(page.locator('html')).toHaveAttribute('lang', 'ur')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('nav.qm-sn--rail, .qm-sn').first()).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('.ayah-trans').first()).toHaveAttribute('dir', 'rtl')
  expectCleanConsole(consoleProblems)
})

test('əlavə dildə olmayan səhifə ingiliscə variantına keçir', async ({ page }) => {
  test.skip(!QONLY.length, 'bütün dillərin interfeysi tərcümə olunub')
  // interfeysi hələ tərcümə olunmamış dil (yalnız Quran); id-də bütün səhifələr var
  await page.goto(`/${QONLY[0]}/prayer`)
  await expect(page).toHaveURL(/\/en\/prayer$/)
  await page.goto(`/${QONLY[0]}`)
  await expect(page).toHaveURL(/\/en$/)
})

test('dil menyusu: "Digər dillər" → həmin dildə Quran / eyni səhifə', async ({ page, consoleProblems }) => {
  // 4 dil keçidi, hər birində lüğət chunk-ı yüklənir — yüklü CI-da 30 san. azdır
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/prayer')
  await settle(page)
  await page.locator('.lang-btn').click()
  await expect(page.locator('.lang-more-head')).toHaveText('Digər dillər')
  await expect(page.locator('.lang-more .lang-option')).toHaveCount(20)
  // Yalnız Quranı olan dil → həmin dildə Quran; interfeysi tərcümə olunmuş dil → eyni səhifə
  if (QONLY.length) {
    await page.locator('.lang-more .lang-option', { hasText: EXTRA_LANGS[QONLY[0]].name }).click()
    await expect(page).toHaveURL(new RegExp(`/${QONLY[0]}/quran$`))
  }
  await page.goto('/quran')
  await settle(page)
  await page.locator('.lang-btn').click()
  await page.locator('.lang-more .lang-option', { hasText: 'Deutsch' }).click()
  await expect(page).toHaveURL(/\/de\/quran$/)
  await expect(page).toHaveTitle(/Koran/)
  // Lüğət yüklənəndə ağac yenidən qurulur (LangContext) — sakitləşsin
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  await settle(page)
  // Quran səhifəsində başqa əlavə dilə — eyni səhifə
  await page.locator('.lang-btn').click()
  await page.locator('.lang-more .lang-option', { hasText: 'Français' }).click()
  await expect(page).toHaveURL(/\/fr\/quran$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  await settle(page)
  // Əsas dilə qayıdış
  await page.locator('.lang-btn').click()
  await page.locator('.lang-option', { hasText: 'Русский' }).click()
  await expect(page).toHaveURL(/\/ru\/quran$/)
  expectCleanConsole(consoleProblems)
})

test('indoneziyaca interfeys (ui: true): menyu, başlıq və səhifə yazıları lüğətdən', async ({ page, consoleProblems }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/id/prayer')
  await settle(page)
  await expect(page).toHaveURL(/\/id\/prayer$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  await expect(page).toHaveTitle(/Waktu Salat/)
  await expect(page.locator('h1')).toHaveText('Waktu Salat')
  await expect(page.locator('.qm-sn').getByText('Beranda').first()).toBeVisible()
  // Hədis Ensiklopediyası məzmunu HadeethEnc-in indoneziyaca nəşrindən (hazır mənbə)
  await page.goto('/id/hadith-encyclopedia')
  await settle(page)
  await expect(page.locator('.he-lang [role="radio"][aria-checked="true"]')).toHaveText('ID')
  // Əsas dilə qayıdanda tərcümə qalmır
  await page.goto('/en/prayer')
  await settle(page)
  await expect(page.locator('h1')).toHaveText('Prayer Times')
  expectCleanConsole(consoleProblems)
})
