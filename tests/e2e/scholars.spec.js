// ═══════════════════════════════════════════════════════
// Sələf alimləri: /scholars siyahısı ↔ /scholars/<slug> profili
//   • siyahı dövr üzrə qruplaşdırılıb, axtarış və dövr filtri işləyir
//   • kartdan profilə keçid, h1, İçindəkilər, mənbə linkləri; geri siyahıya
//   • Əvvəlki / Növbəti alim, "Eyni dövrdən" linkləri
//   • /ar (RTL) profili, naməlum slug → 404 (noindex)
//   • şəkil yoxdur — xəttatlıq kartı (ərəbcə ad) göstərilir
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const canonical = (page) => page.locator('link[rel="canonical"]')

test('siyahı: dövr qrupları, axtarış və filtr', async ({ page, consoleProblems }) => {
  await page.goto('/scholars')
  await settle(page)
  await expect(page.locator('h1')).toHaveText('Sələf alimləri')
  await expect(page.locator('h1')).toHaveCount(1)
  // 4 dövr başlığı
  await expect(page.locator('.sc-group__title')).toHaveCount(4)
  const total = await page.locator('a.sc-card').count()
  expect(total).toBeGreaterThanOrEqual(30)
  // Şəkil yoxdur — yalnız xəttatlıq kartı
  await expect(page.locator('.sc-list img')).toHaveCount(0)
  await expect(page.locator('a.sc-card .sc-callig__name').first()).toHaveAttribute('lang', 'ar')

  // Axtarış: "Teymiyyə"
  await page.getByRole('searchbox', { name: 'Alim axtar...' }).fill('Teymiyyə')
  await expect(page.locator('a.sc-card')).toHaveCount(1)
  await expect(page.locator('a.sc-card')).toHaveAttribute('href', '/scholars/ibn-taymiyyah')
  await page.getByRole('button', { name: 'Axtarışı təmizlə' }).click()
  await expect(page.locator('a.sc-card')).toHaveCount(total)

  // Dövr filtri: "Müasir" — yalnız müasir alimlər, qrup başlıqları yox
  const filter = page.getByRole('group', { name: 'Dövr' })
  await filter.getByRole('button', { name: /Müasir/ }).click()
  await expect(filter.getByRole('button', { name: /Müasir/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.sc-group__title')).toHaveCount(0)
  await expect(page.locator('a.sc-card[href="/scholars/ibn-baz"]')).toBeVisible()
  await expect(page.locator('a.sc-card[href="/scholars/al-bukhari"]')).toHaveCount(0)
  await filter.getByRole('button', { name: /Hamısı/ }).click()
  await expect(page.locator('a.sc-card')).toHaveCount(total)
  expectCleanConsole(consoleProblems)
})

test('kartdan profilə, bölmələr və mənbələr; geri siyahıya', async ({ page, consoleProblems }) => {
  await page.goto('/scholars')
  await settle(page)
  await page.locator('a.sc-card[href="/scholars/ahmad-ibn-hanbal"]').click()
  await expect(page).toHaveURL(/\/scholars\/ahmad-ibn-hanbal$/)
  await expect(page.locator('h1')).toHaveText('Əhməd ibn Hənbəl')
  await expect(page.locator('h1')).toHaveCount(1)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5)
  await expect(page.getByRole('navigation', { name: 'İçindəkilər' })).toBeVisible()
  for (const h of ['Bir baxışda', 'Həyatı', 'Elmə töhfəsi', 'Mənbələr']) {
    await expect(page.getByRole('heading', { level: 2, name: h })).toBeVisible()
  }
  // Mənbə linkləri xaricidir (yeni tab)
  const src = page.locator('.sc-sources__list a').first()
  await expect(src).toHaveAttribute('href', /^https:\/\//)
  await expect(src).toHaveAttribute('target', '_blank')
  await expect(canonical(page)).toHaveAttribute('href', 'https://muslims.cc/scholars/ahmad-ibn-hanbal')
  await expect(page).toHaveTitle(/^Əhməd ibn Hənbəl — .* \| Muslims\.cc$/)

  await page.goBack()
  await expect(page).toHaveURL(/\/scholars$/)
  await expect(page.locator('h1')).toHaveText('Sələf alimləri')
  expectCleanConsole(consoleProblems)
})

test('əvvəlki / növbəti alim və "Eyni dövrdən"', async ({ page, consoleProblems }) => {
  await page.goto('/scholars/al-bukhari')
  await settle(page)
  await expect(page.locator('h1')).toHaveText('əl-Buxari')
  const next = page.getByRole('link', { name: /Növbəti alim/ })
  const nextHref = await next.getAttribute('href')
  await next.click()
  await expect(page).toHaveURL(new RegExp(`${nextHref}$`))
  await page.getByRole('link', { name: /Əvvəlki alim/ }).click()
  await expect(page).toHaveURL(/\/scholars\/al-bukhari$/)

  // Eyni dövrdən: Sələf dövrünün digər alimi
  await page.locator('.sc-same__list a[href="/scholars/malik-ibn-anas"]').click()
  await expect(page).toHaveURL(/\/scholars\/malik-ibn-anas$/)
  await expect(page.locator('h1')).toHaveText(/Malik/)

  // Birinci alimdə "Əvvəlki" yoxdur
  await page.goto('/scholars/said-ibn-al-musayyib')
  await settle(page)
  await expect(page.getByRole('link', { name: /Əvvəlki alim/ })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Növbəti alim/ })).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('ərəbcə profil RTL-dir, əqidə qeydi göstərilir', async ({ page, consoleProblems }) => {
  await page.goto('/ar/scholars/ibn-hajar')
  await settle(page)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('h1')).toHaveText('ابن حجر العسقلاني')
  await expect(page.getByRole('heading', { level: 2, name: /تنبيه/ })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'المحتويات' })).toBeVisible()
  await expect(canonical(page)).toHaveAttribute('href', 'https://muslims.cc/ar/scholars/ibn-hajar')
  expectCleanConsole(consoleProblems)
})

test('naməlum alim → 404 (noindex)', async ({ page }) => {
  for (const url of ['/scholars/yoxdur', '/en/scholars/ibn-baz/extra']) {
    await page.goto(url)
    await settle(page)
    await expect(page.locator('#nf-title'), url).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  }
})
