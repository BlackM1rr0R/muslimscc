// ═══════════════════════════════════════════════════════
// Hüquqi səhifələr (2026-11-25 yenilənməsi): /en/privacy, /privacy, /ar/privacy, /en/terms
//   • yeni bölmələr (hesab, sinxronizasiya, kukilər, məktublar, serverdə oxunan funksiyalar, xəta hesabatları,
//     vidcetlər) görünür; köhnə "hesab yoxdur" iddiası yoxdur; iki giriş kukisi adı ilə göstərilir
//   • son yenilənmə tarixi; daxili lövbər keçidi (#sync) bölməyə aparır
//   • axe (ciddi/kritik yoxdur), ərəbcə RTL, 360px-də üfüqi daşma yoxdur
// Şəbəkə: yeni /api YOXDUR.
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .include(include)
    .analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')}`))
}

test('məxfilik (en): yeni bölmələr, tarix, kukilər, lövbər keçidi, köhnə iddia yoxdur, axe', async ({ page, consoleProblems }) => {
  await page.goto('/en/privacy')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy Policy')
  await expect(page.locator('.lg-updated time')).toHaveAttribute('datetime', '2026-11-25')
  const article = page.locator('.lg-article')
  for (const h of ['Your account', 'Sync and backups', 'Emails', 'Account features that store readable data', 'Error reports and feedback', 'Widgets, sharing and Instagram']) {
    await expect(article.getByRole('heading', { level: 2, name: h, exact: true })).toHaveCount(1)
  }
  await expect(page.locator('#summary')).toContainText('An account is optional.')
  await expect(page.locator('#summary')).not.toContainText('No accounts')
  await expect(page.locator('#cookies')).toContainText('__Host-mcc_user')
  await expect(page.locator('#cookies')).toContainText('__Host-mcc_dev')
  await expect(page.locator('#accountdata tbody tr')).toHaveCount(13)

  // "Sync and backups" keçidi (yerli yaddaş qeydində) — eyni səhifədə bölməyə gedir
  await page.locator('#local').getByRole('link', { name: 'Sync and backups' }).click()
  await expect(page).toHaveURL(/#sync$/)
  await expect(page.locator('#sync')).toBeFocused()

  expect(await serious(page, '.lg-article')).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('məxfilik: ərəbcə RTL, azərbaycanca tarix; 360px-də daşma yoxdur', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 })
  await page.goto('/ar/privacy')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('سياسة الخصوصية')
  expect(await page.evaluate(() => document.documentElement.dir)).toBe('rtl')
  await expect(page.locator('#account')).toContainText('الحساب اختياري.')
  let over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(over, 'ar 360px').toBeLessThanOrEqual(1)

  await page.goto('/privacy')
  await settle(page)
  await expect(page.locator('.lg-updated time')).toHaveText('25 noyabr 2026')
  await expect(page.locator('#summary')).toContainText('Hesab istəyə bağlıdır.')
  over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(over, 'az 360px').toBeLessThanOrEqual(1)
})

test('şərtlər (en): hesab və dərc olunan məzmun bölməsi; "hesab lazım deyil" iddiası yoxdur', async ({ page, consoleProblems }) => {
  await page.goto('/en/terms')
  await settle(page)
  const acc = page.locator('#accounts')
  await expect(acc.getByRole('heading', { level: 2 })).toHaveText(/Your account and what you publish/)
  await expect(acc).toContainText('Moderators may approve, reject, hide or delete such content')
  await expect(page.locator('#about')).not.toContainText('no account is needed')
  await expect(acc.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/en/privacy')
  expectCleanConsole(consoleProblems)
})
