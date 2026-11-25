// ═══════════════════════════════════════════════════════
// Hisnul-Müslim zikrinin ərəbcə səhifəsi: /ar/hisnul-muslim/<fəsil>-<bənd> (2026-11-24)
//   • xam prerender HTML: index, canonical özünə, hreflang yalnız ar + x-default, Quotation sxemi, rtl mətn
//   • tətbiqdə: başlıq, ərəb mətni, təkrar sayı, təxric, fəslə və növbəti zikrə keçid, a11y
//   • başqa dil: fayl yaradılmır, ünvan həmin dildə siyahıya keçir (indekslənən surət yoxdur)
//   • ərəbcə oxu pəncərəsində zikr səhifəsinə link
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

// vite preview qovluğun index.html-ini yalnız sonda "/" olanda verir (seo-detail.spec.js ilə eyni)
const rawRes = (request, url) => request.get(url.replace(/\/?$/, '/'))

test('xam HTML /ar/hisnul-muslim/28-10: index, canonical, yalnız ar hreflang, Quotation, rtl mətn', async ({ request }) => {
  const res = await rawRes(request, '/ar/hisnul-muslim/28-10')
  expect(res.status()).toBe(200)
  const html = await res.text()
  expect(html).toMatch(/<html[^>]*lang="ar" dir="rtl"/)
  expect(html).toContain('<link rel="canonical" href="https://muslims.cc/ar/hisnul-muslim/28-10"')
  const alts = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m => `${m[1]}=${m[2]}`)
  expect(alts.sort()).toEqual(['ar=https://muslims.cc/ar/hisnul-muslim/28-10', 'x-default=https://muslims.cc/ar/hisnul-muslim/28-10'])
  expect(html).toMatch(/<meta name="robots" content="index/)
  expect(html).toContain('<title>أذكار الصباح والمساء:')
  expect(html).toContain('"@type":"Quotation"')
  expect(html).toContain('"author":{"@type":"Person","name":"سعيد بن علي بن وهف القحطاني"}')
  expect(html).toContain('<blockquote lang="ar" dir="rtl" class="seo-static__ar">')
  expect(html).toContain('<dt>عدد المرات</dt><dd>7 مرات</dd>')
  expect(html).toContain('href="/ar/hisnul-muslim#hs-28"')
})

test('başqa dildə zikr səhifəsi yaradılmır: az/en ünvanında indekslənən surət yoxdur', async ({ request }) => {
  for (const url of ['/hisnul-muslim/28-10', '/en/hisnul-muslim/28-10', '/tr/hisnul-muslim/28-10']) {
    const html = await (await rawRes(request, url)).text()
    // Server 404 qabığı və ya SPA qabığı verir — heç biri bu ünvanı kanonik göstərmir
    expect(html, url).not.toContain(`href="https://muslims.cc${url}"`)
    expect(html, url).not.toContain('"@type":"Quotation"')
  }
})

test('tətbiq: ərəb mətni, təkrar sayı, təxric; növbəti zikrə və fəslə keçid', async ({ page, consoleProblems }) => {
  await page.goto('/ar/hisnul-muslim/28-10')
  await settle(page)
  const h1 = page.getByRole('heading', { level: 1 })
  await expect(h1).toHaveText('أذكار الصباح والمساء (10)')
  const card = page.locator('.hs-dua__card')
  await expect(card.locator('p.hs-dua__ar[lang="ar"][dir="rtl"]')).toContainText('حسبي الله')
  await expect(card).toContainText('7 مرات')
  await expect(card).toContainText('التخريج')
  await expect(card).toContainText('ابن السني')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

  const { violations } = await new AxeBuilder({ page }).include('.hs-dua').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(violations.filter(v => v.impact === 'critical' || v.impact === 'serious').map(v => v.id)).toEqual([])

  await page.locator('a[rel="next"]').click()
  await expect(page).toHaveURL(/\/ar\/hisnul-muslim\/28-11$/)
  await expect(h1).toHaveText('أذكار الصباح والمساء (11)')
  await expect(page).toHaveTitle(/^أذكار الصباح والمساء: /)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://muslims.cc/ar/hisnul-muslim/28-11')

  // Fəslə keçid → siyahı, həmin fəslin oxu pəncərəsi açılır
  await page.locator('.hs-dua__book a').click()
  await expect(page).toHaveURL(/\/ar\/hisnul-muslim(#hs-28)?$/)
  await expect(page.getByRole('dialog')).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('başqa dildə ünvan siyahıya keçir; yoxlanmamış bənd 404-dür', async ({ page }) => {
  await page.goto('/en/hisnul-muslim/28-10')
  await expect(page).toHaveURL(/\/en\/hisnul-muslim$/)
  await expect(page.locator('.hs-dua')).toHaveCount(0)
  // 2-3 hisnmuslim.com mətni ilə tutuşmur (Dice 0.68) — səhifəsi yoxdur
  await page.goto('/ar/hisnul-muslim/2-3')
  await settle(page)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await expect(page.locator('.hs-dua')).toHaveCount(0)
})

test('ərəbcə oxu pəncərəsi: yoxlanmış zikrin səhifəsinə link (SPA keçidi)', async ({ page, consoleProblems }) => {
  await page.goto('/ar/hisnul-muslim#hs-28')
  await settle(page)
  const dlg = page.getByRole('dialog')
  await expect(dlg).toBeVisible()
  // 28-1 hisnmuslim.com-da yoxdur — linki yoxdur; 28-2 var
  await expect(dlg.locator('a[href="/ar/hisnul-muslim/28-1"]')).toHaveCount(0)
  const link = dlg.locator('a[href="/ar/hisnul-muslim/28-2"]')
  await expect(link).toHaveAttribute('aria-label', 'صفحة هذا الذكر')
  await link.click()
  await expect(page).toHaveURL(/\/ar\/hisnul-muslim\/28-2$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('أذكار الصباح والمساء (2)')
  expectCleanConsole(consoleProblems)
})

test('360px: zikr səhifəsində üfüqi daşma yoxdur (uzun təxric, istixarə duası)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 })
  await page.goto('/ar/hisnul-muslim/27-1')
  await settle(page)
  await expect(page.locator('.hs-dua__card')).toBeVisible()
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(over).toBeLessThanOrEqual(0)
})
