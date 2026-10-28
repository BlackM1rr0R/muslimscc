// ═══════════════════════════════════════════════════════
// Naviqasiya: yan panel (kompüter), burger menyu (telefon), axtarış,
// dil dəyişmə, tema, yönləndirmələr və 404.
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

test.describe('kompüter', () => {
  test.skip(({ isMobile }) => isMobile, 'yalnız geniş ekran')

  test('yan paneldə bütün bölmələr açıqdır və keçid işləyir', async ({ page, consoleProblems }) => {
    await page.goto('/')
    await settle(page)
    const rail = page.getByRole('navigation', { name: 'Bölmələr', exact: true })
    await expect(rail).toBeVisible()
    const groups = rail.locator('button[aria-expanded]')
    expect(await groups.count()).toBeGreaterThan(3)
    for (const g of await groups.all()) await expect(g).toHaveAttribute('aria-expanded', 'true')

    await rail.getByRole('link', { name: 'Quran', exact: true }).click()
    await expect(page).toHaveURL(/\/quran$/)
    await expect(page.locator('h1').first()).toBeVisible()
    expectCleanConsole(consoleProblems)
  })

  test('Ctrl+K axtarışı açır, Esc bağlayır', async ({ page, consoleProblems }) => {
    await page.goto('/')
    await settle(page)
    await page.keyboard.press('Control+k')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page.keyboard.type('səbr')
    await expect(dialog.getByRole('option').or(dialog.getByRole('link')).first()).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    expectCleanConsole(consoleProblems)
  })
})

test.describe('telefon', () => {
  test.skip(({ isMobile }) => !isMobile, 'yalnız telefon')

  test('burger menyu açılır, bağlanır, keçid edir', async ({ page, consoleProblems }) => {
    await page.goto('/')
    await settle(page)
    const burger = page.getByRole('button', { name: 'Menyu', exact: true })
    await burger.click()
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    await expect(burger).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()

    await burger.click()
    await drawer.getByRole('link', { name: 'Hədis', exact: true }).click()
    await expect(page).toHaveURL(/\/hadith$/)
    await expect(drawer).toBeHidden()
    expectCleanConsole(consoleProblems)
  })
})

// Telefonda dil və tema düymələri başlıqda yox, ☰ menyunun içindədir
async function openSettings(page, isMobile) {
  if (!isMobile) return page
  await page.getByRole('button', { name: 'Menyu', exact: true }).click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  return drawer
}

test('dil dəyişəndə eyni səhifə başqa dildə açılır', async ({ page, isMobile, consoleProblems }) => {
  await page.goto('/quran')
  await settle(page)
  const scope = await openSettings(page, isMobile)
  if (!isMobile) await page.getByRole('button', { name: /Dili dəyiş/ }).first().click()
  await scope.getByRole('option', { name: /English/ })
    .or(scope.getByRole('menuitem', { name: /English/ }))
    .or(scope.getByRole('button', { name: /English/ })).first().click()
  await expect(page).toHaveURL(/\/en\/quran$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  expectCleanConsole(consoleProblems)
})

test('tema düyməsi qaranlıq rejimi açıb-bağlayır', async ({ page, isMobile }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await settle(page)
  const html = page.locator('html')
  await expect(html).not.toHaveAttribute('data-theme', 'dark')
  const scope = await openSettings(page, isMobile)
  await scope.getByRole('button', { name: 'Qaranlıq rejim' }).first().click()
  await expect(html).toHaveAttribute('data-theme', 'dark')
})

test('köhnə /mosque ünvanı Haqqımızda-ya yönləndirilir', async ({ page }) => {
  await page.goto('/ru/mosque')
  await expect(page).toHaveURL(/\/ru\/about$/)
})

test('naməlum ünvan "tapılmadı" səhifəsini noindex ilə göstərir', async ({ page, consoleProblems }) => {
  await page.goto('/bu-sehife-yoxdur')
  await settle(page)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await expect(page.locator('h1').first()).toBeVisible()
  expectCleanConsole(consoleProblems)
})
