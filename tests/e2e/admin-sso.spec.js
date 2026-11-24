// ═══════════════════════════════════════════════════════
// Admin paneli — saytın hesabı ilə (SSO, server/adminSso.js, docs/ADMIN-SECURITY.md → "Sayt hesabı ilə panel")
//
// • /me → via:'site': panel ayrıca giriş formu OLMADAN açılır; 2FA banneri yoxdur; "Hesab və şifrə" bölməsi
//   hesab səhifəsinə yönləndirir; yan menyuda "Çıxış" əvəzinə "Sayta qayıt"
// • 403 need_2fa → bələdçi ekranı (hesabın 2FA bölməsinə keçid), heç bir panel bölməsi/məlumatı yoxdur
// • 403 need_reauth → "Çıxış və yenidən giriş" → POST /api/auth/logout + /login
// • VITE_ADMIN_PATH verilməyib (e2e build-i) → hər şey əvvəlki kimidir: panel /admin-də, hesab menyusunun
//   və telefondakı çəkmə menyunun keçidi /admin-ə aparır, /admin 404 deyil
// Server yoxdur — cavablar tests/e2e/adminAuth.js və userAuth.js-də saxtadır.
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'
import { fakeAdminSession, SITE_ADMIN_EMAIL } from './adminAuth.js'
import { fakeUserSession } from './userAuth.js'

async function openTab(page, name) {
  const toggle = page.locator('.admin-menu-toggle')
  if (await toggle.isVisible()) await toggle.click()
  await page.getByRole('button', { name }).click()
}

test.describe('admin paneli: sayt hesabı ilə', () => {
  test('via:site — giriş formu yoxdur, panel açılır; "Hesab və şifrə" hesab səhifəsinə yönləndirir', async ({ page }) => {
    const state = await fakeAdminSession(page, 'site')
    await page.goto('/admin')
    await expect(page.getByRole('heading', { level: 1, name: 'İdarə paneli' })).toBeVisible()
    await expect(page.getByLabel('Şifrə', { exact: true })).toHaveCount(0)
    await expect(page.getByTestId('admin-role')).toContainText('Baş admin')
    // Sayt hesabında 2FA mütləqdir — "2FA bağlıdır" banneri görünmür
    await expect(page.locator('.admin-2fa-banner')).toHaveCount(0)
    expect(state.requests).not.toContain('POST /api/admin/login')

    await openTab(page, 'Hesab və şifrə')
    const note = page.getByTestId('admin-site-account')
    await expect(note).toBeVisible()
    await expect(note).toContainText(SITE_ADMIN_EMAIL)
    await expect(note.getByRole('link', { name: 'Hesabın təhlükəsizliyi' })).toHaveAttribute('href', '/account#acc-2fa')
    // Panelin öz şifrə/2FA forması (AccountManager) yoxdur
    await expect(page.getByLabel('Cari şifrə')).toHaveCount(0)
    expect(state.requests.filter((r) => r.includes('/api/admin/2fa') || r.includes('/api/admin/password'))).toEqual([])

    const toggle = page.locator('.admin-menu-toggle')
    if (await toggle.isVisible()) await toggle.click()
    await page.getByRole('button', { name: 'Sayta qayıt' }).click()
    await expect(page).toHaveURL(/\/$/)
    // Sayt hesabından və ya paneldən çıxış sorğusu getmir
    expect(state.requests).not.toContain('POST /api/admin/logout')
  })

  test('need_2fa — bələdçi ekranı, panel bölmələri yoxdur', async ({ page }) => {
    const state = await fakeAdminSession(page, 'need2fa')
    await page.goto('/admin')
    const gate = page.getByTestId('admin-site-gate')
    await expect(gate).toBeVisible()
    await expect(gate.getByRole('heading', { level: 1, name: 'İdarə panelindən istifadə üçün iki addımlı yoxlamanı açın' })).toBeVisible()
    await expect(gate.getByRole('link', { name: 'İki addımlı yoxlamanı qur' })).toHaveAttribute('href', '/account#acc-2fa')
    await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
    await expect(page.getByLabel('E-poçt')).toHaveCount(0)
    // Yalnız /me soruşulub — heç bir panel məlumatı yüklənmir
    expect([...new Set(state.requests)]).toEqual(['GET /api/admin/me'])
  })

  test('köhnə giriş səhifəsi need_2fa-da da bələdçiyə keçir', async ({ page }) => {
    await fakeAdminSession(page, 'need2fa')
    await page.goto('/adminlogin')
    await expect(page.getByTestId('admin-site-gate')).toBeVisible()
    await expect(page).toHaveURL(/\/admin$/)
  })

  test('need_reauth — "Çıxış və yenidən giriş" sayt sessiyasını bağlayıb /login-ə aparır', async ({ page }) => {
    const user = await fakeUserSession(page, { signedIn: true, user: { role: 'superadmin' } })
    await fakeAdminSession(page, 'needReauth')
    await page.goto('/admin')
    const gate = page.getByTestId('admin-site-gate')
    await expect(gate.getByRole('heading', { level: 1, name: 'Yenidən daxil olun' })).toBeVisible()
    await gate.getByRole('button', { name: 'Çıxış və yenidən giriş' }).click()
    await expect(page).toHaveURL(/\/login$/)
    expect(user.requests).toContain('POST /api/auth/logout')
  })
})

test.describe('VITE_ADMIN_PATH verilməyib — dəyişiklik yoxdur', () => {
  test('/admin 404 deyil; hesab menyusunun keçidi /admin-ə aparır', async ({ page, isMobile }) => {
    test.skip(isMobile, 'telefonda hesab çəkmə menyudadır (ayrıca test)')
    await fakeUserSession(page, { signedIn: true, user: { role: 'superadmin' } })
    await page.addInitScript(() => { if (!sessionStorage.getItem('hinted')) { sessionStorage.setItem('hinted', '1'); localStorage.setItem('mcc_logged_in', '1') } })
    await page.goto('/')
    const btn = page.getByRole('button', { name: /Hesab menyusu/ })
    await expect(btn).toBeVisible({ timeout: 10_000 })
    await btn.click()
    const link = page.getByTestId('hdr-admin-panel')
    await expect(link).toHaveAttribute('href', '/admin')
    await expect(link).toHaveText(/İdarə paneli/)

    await page.goto('/admin')
    await settle(page)
    await expect(page.getByRole('heading', { name: 'Səhifə tapılmadı' })).toHaveCount(0)
    await expect(page.getByLabel('E-poçt')).toBeVisible()
  })

  test('telefon: çəkmə menyuda panel qısayolu /admin-ə aparır (yalnız panel rolunda)', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'yalnız telefonda')
    const user = await fakeUserSession(page, { signedIn: true, user: { role: 'editor' } })
    await page.addInitScript(() => { if (!sessionStorage.getItem('hinted')) { sessionStorage.setItem('hinted', '1'); localStorage.setItem('mcc_logged_in', '1') } })
    await page.goto('/')
    await settle(page)
    // boş vaxtda /api/auth/me (whenIdle) — cavabdan sonra rol məlumdur
    await expect.poll(() => user.requests.includes('GET /api/auth/me'), { timeout: 10_000 }).toBe(true)
    await page.getByRole('button', { name: 'Menyu', exact: true }).click()
    const link = page.getByRole('dialog').getByTestId('sn-admin-panel')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', '/admin')
    await expect(link).toHaveAccessibleName('İdarə paneli')
  })
})
