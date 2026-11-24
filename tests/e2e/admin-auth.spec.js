// ═══════════════════════════════════════════════════════
// İdarə paneli — giriş qaydaları (docs/ADMIN-SECURITY.md, 2026-11-24 sahibin qərarı)
//
// • /admin, /adminlogin (dil prefiksliləri də) və "#admin" qısayolu — 404 / heç nə açmır (daxil olmuş baş admin üçün də)
// • Panel /account/panel-dədir və YALNIZ saytın hesabı ilə açılır:
//   – daxil olmayıb → /login?next=/account/panel (girişdən sonra panelə qayıdır)
//   – daxil olub, panel rolu yoxdur → 404 səhifəsi
//   – köhnə sessionStorage bayrağı heç nə açmır; ayrıca admin giriş forması görünmür
// • BREAK-GLASS (serverdə ADMIN_LEGACY_LOGIN=1 → /me 401 legacyLogin:true): panelin ünvanında ayrıca forma —
//   yanlış şifrə, "Şifrəni unutmusunuz?", müvəqqəti şifrə, "Hesab və şifrə" + "Çıxış"
// Server API-si testdə yoxdur — cavablar adminAuth.js / userAuth.js-də saxtadır.
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'
import { fakeAdminSession, adminSignIn, ADMIN_PANEL } from './adminAuth.js'
import { fakeUserSession, USER_EMAIL, USER_PASSWORD } from './userAuth.js'

const notFound = (page) => page.locator('#nf-title')

test.describe('köhnə admin ünvanları silinib', () => {
  for (const path of ['/admin', '/adminlogin', '/en/admin', '/ru/adminlogin']) {
    test(`${path} — 404 (baş admin daxil olsa belə)`, async ({ page }) => {
      await fakeUserSession(page, { signedIn: true, user: { role: 'superadmin' } })
      const admin = await fakeAdminSession(page, 'site')
      await page.goto(path)
      await expect(notFound(page)).toBeVisible()
      await expect(page.getByLabel('Şifrə', { exact: true })).toHaveCount(0)
      await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
      expect(admin.requests).toEqual([])
    })
  }

  test('"#admin" qısayolu heç nə açmır', async ({ page }) => {
    await page.goto('/#admin')
    await settle(page)
    await expect(page.getByLabel('Şifrə', { exact: true })).toHaveCount(0)
    await expect(page.locator('.admin-login-card')).toHaveCount(0)
    await expect(page.locator('.admin-page')).toHaveCount(0)
  })
})

test.describe('panel yalnız sayt hesabı ilə', () => {
  test('daxil olmayıb → /login?next=/account/panel; girişdən sonra panel açılır', async ({ page }) => {
    const user = await fakeUserSession(page, { user: { role: 'superadmin', email: USER_EMAIL } })
    await fakeAdminSession(page, 'site', { user, email: USER_EMAIL })
    await page.goto(ADMIN_PANEL)
    await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Fpanel$/)
    await expect(page.getByLabel('Şifrə', { exact: true })).toBeVisible()
    await page.getByLabel('E-poçt').fill(USER_EMAIL)
    await page.getByLabel('Şifrə', { exact: true }).fill(USER_PASSWORD)
    await page.getByRole('button', { name: 'Daxil ol', exact: true }).click()
    await expect(page).toHaveURL(/\/account\/panel$/)
    await expect(page.getByTestId('admin-role')).toContainText('Baş admin')
  })

  test('dil prefiksi saxlanılır: /en/account/panel → /en/login?next=…', async ({ page }) => {
    await page.goto(`/en${ADMIN_PANEL}`)
    await expect(page).toHaveURL(/\/en\/login\?next=%2Fen%2Faccount%2Fpanel$/)
  })

  test('daxil olub, panel rolu yoxdur → 404; panel məlumatı yüklənmir', async ({ page }) => {
    for (const role of ['user', 'mosque_rep']) {
      await fakeUserSession(page, { signedIn: true, user: { role } })
      await page.goto(ADMIN_PANEL)
      await expect(notFound(page), role).toBeVisible()
      await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
      await expect(page).toHaveURL(/\/account\/panel$/)
    }
  })

  test('köhnə sessionStorage bayrağı paneli açmır; ayrıca giriş forması yoxdur', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('muslim_cc_admin', 'true'))
    await page.goto(ADMIN_PANEL)
    await expect(page).toHaveURL(/\/login\?next=/)
    await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
    await expect(page.locator('.admin-login-card')).toHaveCount(0)
  })
})

test.describe('break-glass: ayrıca admin girişi (ADMIN_LEGACY_LOGIN=1)', () => {
  test('forma panelin ünvanında görünür; yanlış şifrə — xəta, panel açılmır', async ({ page }) => {
    await fakeAdminSession(page, 'wrong')
    await page.goto(ADMIN_PANEL)
    await expect(page.getByRole('heading', { name: 'Admin paneli' })).toBeVisible()
    await expect(page).toHaveURL(/\/account\/panel$/)
    await adminSignIn(page)
    await expect(page.getByRole('alert')).toContainText('E-poçt və ya şifrə yanlışdır')
    await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
  })

  test('"Şifrəni unutmusunuz?" — link göndərmir, serverdə dəyişməyi izah edir', async ({ page }) => {
    const state = await fakeAdminSession(page, 'admin')
    await page.goto(ADMIN_PANEL)
    await page.getByRole('button', { name: 'Şifrəni unutmusunuz?' }).click()
    const info = page.getByRole('status').filter({ hasText: 'set-password' })
    await expect(info).toBeVisible()
    await expect(info).toContainText('E-poçtla bərpa yoxdur')
    // Heç bir "sıfırlama" sorğusu getmir
    expect(state.requests.filter(r => !r.endsWith('/api/admin/me'))).toEqual([])
  })

  test('müvəqqəti şifrə — əvvəlcə "Şifrəni dəyiş", sonra panel', async ({ page }) => {
    const state = await fakeAdminSession(page, 'temp')
    await page.goto(ADMIN_PANEL)
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

  test('panel açılır, "Hesab və şifrə" bölməsi var, "Çıxış"dan sonra yenidən bağlıdır', async ({ page }, info) => {
    await fakeAdminSession(page, 'admin')
    await page.goto(ADMIN_PANEL)
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
    await page.goto(ADMIN_PANEL)
    await expect(page.getByLabel('E-poçt')).toBeVisible()
    await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
  })
})
