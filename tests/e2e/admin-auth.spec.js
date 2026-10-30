// ═══════════════════════════════════════════════════════
// Admin girişi — Firebase Authentication (docs/ADMIN-SECURITY.md)
//
// • Auth-suz admin paneli açılmır (köhnə sessionStorage bayrağı da işləmir)
// • Giriş formu: e-poçt, şifrə, "Şifrəni unutmusunuz?"
// • Yanlış parol / admin claim-i olmayan hesab — xəta, panel açılmır
// • admin: true — panel açılır, "Çıxış" sessiyanı bağlayır
// Firebase şəbəkəsi testdə bağlıdır; Auth cavabları adminAuth.js-də saxtadır.
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'
import { fakeFirebaseAuth, adminSignIn } from './adminAuth.js'

test.describe('admin girişi', () => {
  test('Auth-suz /admin açılmır — giriş formu görünür', async ({ page }) => {
    await page.goto('/admin')
    await settle(page)
    await expect(page.getByRole('heading', { name: 'Admin paneli' })).toBeVisible()
    await expect(page.getByLabel('E-poçt')).toBeVisible()
    await expect(page.getByLabel('Şifrə', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Şifrəni unutmusunuz?' })).toBeVisible()
    await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
  })

  test('köhnə sessionStorage bayrağı paneli açmır', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('muslim_cc_admin', 'true'))
    await page.goto('/admin')
    await settle(page)
    await expect(page.getByLabel('E-poçt')).toBeVisible()
    await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
  })

  test('yanlış parol — xəta, panel açılmır', async ({ page }) => {
    await fakeFirebaseAuth(page, 'wrong')
    await page.goto('/admin')
    await adminSignIn(page)
    await expect(page.getByRole('alert')).toContainText('E-poçt və ya şifrə yanlışdır')
    await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
  })

  test('admin claim-i olmayan hesab — "admin icazəsi yoxdur"', async ({ page }) => {
    await fakeFirebaseAuth(page, 'user')
    await page.goto('/admin')
    await adminSignIn(page)
    await expect(page.getByRole('alert')).toContainText('admin icazəsi yoxdur')
    await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
  })

  test('e-poçtsuz "Şifrəni unutmusunuz?" — əvvəlcə ünvan istənir; sonra link göndərilir', async ({ page }) => {
    await fakeFirebaseAuth(page, 'admin')
    await page.goto('/admin')
    await page.getByRole('button', { name: 'Şifrəni unutmusunuz?' }).click()
    await expect(page.getByRole('alert')).toContainText('e-poçt ünvanını')
    await page.getByLabel('E-poçt').fill('admin@example.com')
    await page.getByRole('button', { name: 'Şifrəni unutmusunuz?' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'link' })).toBeVisible()
  })

  test('admin — panel açılır, "Çıxış"dan sonra yenidən bağlıdır', async ({ page }, info) => {
    await fakeFirebaseAuth(page, 'admin')
    await page.goto('/admin')
    await adminSignIn(page)
    // Panel açıldı (telefonda yan menyu gizlidir — ona görə başlığa baxırıq)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('.admin-nav-btn').first()).toBeAttached()
    // Telefonda yan menyu düymə ilə açılır
    if (info.project.name === 'mobile') await page.locator('.admin-menu-toggle').click()
    await page.getByRole('button', { name: 'Çıxış' }).click()
    await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
    await page.goto('/admin')
    await expect(page.getByLabel('E-poçt')).toBeVisible()
    await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
  })
})
