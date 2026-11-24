// ═══════════════════════════════════════════════════════
// Admin paneli — saytın hesabı ilə (SSO, server/adminSso.js, docs/ADMIN-SECURITY.md → "Sayt hesabı ilə panel")
//
// • /me → via:'site': panel ayrıca giriş formu OLMADAN açılır; 2FA banneri yoxdur; "Hesab və şifrə" bölməsi
//   hesab səhifəsinə yönləndirir; yan menyuda "Çıxış" əvəzinə "Sayta qayıt"
// • 403 need_2fa → bələdçi ekranı (hesabın 2FA bölməsinə keçid), heç bir panel bölməsi/məlumatı yoxdur
// • 403 need_reauth → "Çıxış və yenidən giriş" → POST /api/auth/logout + /login?next=/account/panel
// • Panel /account/panel-dədir (e2e build-i VITE_ADMIN_PATH-sizdir): hesab menyusunun keçidi oraya aparır;
//   telefondakı çəkmə menyuda — ikon sətrində DEYİL, alt hissədə adlı sətir "İdarə paneli" (yalnız panel rolunda)
// Server yoxdur — cavablar tests/e2e/adminAuth.js və userAuth.js-də saxtadır.
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'
import { fakeAdminSession, SITE_ADMIN_EMAIL, ADMIN_PANEL } from './adminAuth.js'
import { fakeUserSession } from './userAuth.js'

async function openTab(page, name) {
  const toggle = page.locator('.admin-menu-toggle')
  if (await toggle.isVisible()) await toggle.click()
  await page.getByRole('button', { name }).click()
}

test.describe('admin paneli: sayt hesabı ilə', () => {
  test('via:site — giriş formu yoxdur, panel açılır; "Hesab və şifrə" hesab səhifəsinə yönləndirir', async ({ page }) => {
    const state = await fakeAdminSession(page, 'site')
    await page.goto(ADMIN_PANEL)
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
    await page.goto(ADMIN_PANEL)
    const gate = page.getByTestId('admin-site-gate')
    await expect(gate).toBeVisible()
    await expect(gate.getByRole('heading', { level: 1, name: 'İdarə panelindən istifadə üçün iki addımlı yoxlamanı açın' })).toBeVisible()
    await expect(gate.getByRole('link', { name: 'İki addımlı yoxlamanı qur' })).toHaveAttribute('href', '/account#acc-2fa')
    await expect(page.locator('.admin-nav-btn')).toHaveCount(0)
    await expect(page.getByLabel('E-poçt')).toHaveCount(0)
    // Yalnız /me soruşulub — heç bir panel məlumatı yüklənmir
    expect([...new Set(state.requests)]).toEqual(['GET /api/admin/me'])
  })

  test('need_reauth — "Çıxış və yenidən giriş" sayt sessiyasını bağlayıb /login-ə aparır', async ({ page }) => {
    const user = await fakeUserSession(page, { signedIn: true, user: { role: 'superadmin' } })
    await fakeAdminSession(page, 'needReauth')
    await page.goto(ADMIN_PANEL)
    const gate = page.getByTestId('admin-site-gate')
    await expect(gate.getByRole('heading', { level: 1, name: 'Yenidən daxil olun' })).toBeVisible()
    await gate.getByRole('button', { name: 'Çıxış və yenidən giriş' }).click()
    // Yenidən girişdən sonra panelə qayıdır
    await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Fpanel$/)
    expect(user.requests).toContain('POST /api/auth/logout')
  })
})

test.describe('panelin keçidləri (/account/panel)', () => {
  test('hesab menyusunun keçidi /account/panel-ə aparır; /admin 404-dür', async ({ page, isMobile }) => {
    test.skip(isMobile, 'telefonda hesab çəkmə menyudadır (ayrıca test)')
    await fakeUserSession(page, { signedIn: true, user: { role: 'superadmin' } })
    await page.addInitScript(() => { if (!sessionStorage.getItem('hinted')) { sessionStorage.setItem('hinted', '1'); localStorage.setItem('mcc_logged_in', '1') } })
    await page.goto('/')
    const btn = page.getByRole('button', { name: /Hesab menyusu/ })
    await expect(btn).toBeVisible({ timeout: 10_000 })
    await btn.click()
    const link = page.getByTestId('hdr-admin-panel')
    await expect(link).toHaveAttribute('href', ADMIN_PANEL)
    await expect(link).toHaveText(/İdarə paneli/)

    await page.goto('/admin')
    await expect(page.locator('#nf-title')).toBeVisible()
    await expect(page.getByLabel('E-poçt')).toHaveCount(0)
  })

  for (const theme of ['light', 'dark']) {
    test(`telefon: çəkmə menyuda "İdarə paneli" adlı sətir (ikon sətrində yox), yalnız panel rolunda (${theme})`, async ({ page, isMobile }) => {
      test.skip(!isMobile, 'yalnız telefonda')
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await page.addInitScript((t) => { try { localStorage.setItem('muslim_cc_theme', t) } catch { /* */ } }, theme)
      const user = await fakeUserSession(page, { signedIn: true, user: { role: 'editor' } })
      await page.addInitScript(() => { if (!sessionStorage.getItem('hinted')) { sessionStorage.setItem('hinted', '1'); localStorage.setItem('mcc_logged_in', '1') } })
      await page.goto('/')
      await settle(page)
      // boş vaxtda /api/auth/me (whenIdle) — cavabdan sonra rol məlumdur
      await expect.poll(() => user.requests.includes('GET /api/auth/me'), { timeout: 10_000 }).toBe(true)
      await page.getByRole('button', { name: 'Menyu', exact: true }).click()
      const dialog = page.getByRole('dialog')
      const link = dialog.getByTestId('sn-admin-panel')
      await expect(link).toBeVisible()
      await expect(link).toHaveAttribute('href', ADMIN_PANEL)
      await expect(link).toHaveAccessibleName('İdarə paneli')
      await expect(link).toHaveText('İdarə paneli')
      // İkon sətrində panel düyməsi yoxdur; sətir bir cərgədir və 375px-ə sığır
      const bar = dialog.locator('.qm-sn-bar')
      await expect(bar.locator('[href$="/account/panel"]')).toHaveCount(0)
      const tools = await bar.locator(':scope > *').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ top: Math.round(r.top), right: r.right })))
      expect(new Set(tools.map((r) => r.top)).size).toBe(1)
      const vw = await page.evaluate(() => window.innerWidth)
      for (const r of tools) expect(r.right).toBeLessThanOrEqual(vw)
      const box = await link.boundingBox()
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.x + box.width).toBeLessThanOrEqual(vw)
    })
  }

  test('telefon: adi istifadəçidə panel sətri yoxdur; ərəbcə (RTL) panel rolunda görünür', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'yalnız telefonda')
    const user = await fakeUserSession(page, { signedIn: true, user: { role: 'user' } })
    await page.addInitScript(() => { if (!sessionStorage.getItem('hinted')) { sessionStorage.setItem('hinted', '1'); localStorage.setItem('mcc_logged_in', '1') } })
    await page.goto('/')
    await settle(page)
    await expect.poll(() => user.requests.includes('GET /api/auth/me'), { timeout: 10_000 }).toBe(true)
    await page.getByRole('button', { name: 'Menyu', exact: true }).click()
    await expect(page.getByRole('dialog').locator('.qm-sn-bar')).toBeVisible()
    await expect(page.getByTestId('sn-admin-panel')).toHaveCount(0)

    user.user.role = 'admin'
    await page.goto('/ar')
    await settle(page)
    await expect.poll(() => user.requests.filter((r) => r === 'GET /api/auth/me').length, { timeout: 10_000 }).toBeGreaterThan(1)
    await page.getByRole('button', { name: 'القائمة', exact: true }).click()
    const link = page.getByRole('dialog').getByTestId('sn-admin-panel')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', `/ar${ADMIN_PANEL}`)
    await expect(link).toHaveText('لوحة الإدارة')
    await expect(page.locator('.qm-sn--drawer')).toHaveAttribute('dir', 'rtl')
  })
})
