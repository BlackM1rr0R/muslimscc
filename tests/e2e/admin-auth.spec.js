// ═══════════════════════════════════════════════════════
// Admin girişi — öz serverimiz (server/auth.js, docs/FIREBASE-EXIT.md)
//
// • Sessiyasız admin paneli açılmır (köhnə sessionStorage bayrağı da işləmir)
// • Giriş formu: e-poçt, şifrə, "Şifrəni unutmusunuz?" (e-poçt xidməti yoxdur —
//   şifrənin serverdə dəyişdirilməsini izah edir)
// • Yanlış şifrə — xəta, panel açılmır
// • Müvəqqəti şifrə — panel əvəzinə "Şifrəni dəyiş"; dəyişəndən sonra panel
// • Panel → "Hesab və şifrə" bölməsi; "Çıxış" sessiyanı bağlayır
// Server API-si testdə yoxdur — cavablar adminAuth.js-də saxtadır.
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'
import { fakeAdminSession, adminSignIn } from './adminAuth.js'

test.describe('admin girişi', () => {
  test('sessiyasız /admin açılmır — giriş formu görünür', async ({ page }) => {
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

  test('yanlış şifrə — xəta, panel açılmır', async ({ page }) => {
    await fakeAdminSession(page, 'wrong')
    await page.goto('/admin')
    await adminSignIn(page)
    await expect(page.getByRole('alert')).toContainText('E-poçt və ya şifrə yanlışdır')
    await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
  })

  test('"Şifrəni unutmusunuz?" — link göndərmir, serverdə dəyişməyi izah edir', async ({ page }) => {
    const state = await fakeAdminSession(page, 'admin')
    await page.goto('/admin')
    await page.getByRole('button', { name: 'Şifrəni unutmusunuz?' }).click()
    const info = page.getByRole('status').filter({ hasText: 'set-password' })
    await expect(info).toBeVisible()
    await expect(info).toContainText('E-poçtla bərpa yoxdur')
    // Heç bir "sıfırlama" sorğusu getmir
    expect(state.requests.filter(r => !r.endsWith('/api/admin/me'))).toEqual([])
  })

  test('müvəqqəti şifrə — əvvəlcə "Şifrəni dəyiş", sonra panel', async ({ page }) => {
    const state = await fakeAdminSession(page, 'temp')
    await page.goto('/admin')
    await adminSignIn(page)
    await expect(page.getByRole('heading', { name: 'Müvəqqəti şifrəni dəyişin' })).toBeVisible()
    await expect(page.locator('.admin-nav-btn')).toHaveCount(0)

    // Uyğunsuz təkrar — klient özü dayandırır
    await page.getByLabel('Cari şifrə').fill('test-password')
    await page.getByLabel('Yeni şifrə', { exact: true }).fill('yeni-uzun-şifrə-123')
    await page.getByLabel('Yeni şifrə (təkrar)').fill('başqa-uzun-şifrə-123')
    await page.getByRole('button', { name: 'Şifrəni dəyiş' }).click()
    await expect(page.getByRole('alert')).toContainText('uyğun gəlmir')
    expect(state.requests).not.toContain('POST /api/admin/password')

    await page.getByLabel('Yeni şifrə (təkrar)').fill('yeni-uzun-şifrə-123')
    await page.getByRole('button', { name: 'Şifrəni dəyiş' }).click()
    await expect(page.locator('.admin-nav-btn').first()).toBeAttached()
    expect(state.requests).toContain('POST /api/admin/password')
  })

  test('admin — panel açılır, "Hesab və şifrə" bölməsi var, "Çıxış"dan sonra yenidən bağlıdır', async ({ page }, info) => {
    await fakeAdminSession(page, 'admin')
    await page.goto('/admin')
    await adminSignIn(page)
    // Panel açıldı (telefonda yan menyu gizlidir — ona görə başlığa baxırıq)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('.admin-nav-btn').first()).toBeAttached()
    // Telefonda yan menyu düymə ilə açılır
    if (info.project.name === 'mobile') await page.locator('.admin-menu-toggle').click()
    await page.getByRole('button', { name: 'Hesab və şifrə' }).click()
    await expect(page.getByRole('heading', { name: 'Hesab', exact: true })).toBeVisible()
    await page.getByLabel('Cari şifrə').fill('səhv-şifrə-xxxx')
    await page.getByLabel('Yeni şifrə', { exact: true }).fill('yeni-uzun-şifrə-123')
    await page.getByLabel('Yeni şifrə (təkrar)').fill('yeni-uzun-şifrə-123')
    await page.getByRole('button', { name: 'Şifrəni dəyiş' }).click()
    await expect(page.getByRole('alert')).toContainText('Cari şifrə yanlışdır')

    if (info.project.name === 'mobile') await page.locator('.admin-menu-toggle').click()
    await page.getByRole('button', { name: 'Çıxış' }).click()
    await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
    await page.goto('/admin')
    await expect(page.getByLabel('E-poçt')).toBeVisible()
    await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
  })
})
