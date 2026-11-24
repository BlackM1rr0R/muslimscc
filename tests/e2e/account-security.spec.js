// ═══════════════════════════════════════════════════════
// Hesab təhlükəsizliyi (server/security.js, docs/ACCOUNT-SECURITY.md) — UI axını:
//   • /account: iki addımlı yoxlamanı aç (şifrə → QR + açar → kod → ehtiyat kodları bir dəfə)
//   • /login: 2FA açıq hesabda şifrədən sonra kod addımı (one-time-code, numeric); yanlış kod — xəta
//   • /account: təhlükəsizlik fəaliyyəti siyahısı; qorunma rejimi bildirişi
//   • "Bütün məlumatımı yüklə" — bir JSON (server + bu cihaz)
//   • admin paneli: 2FA açıq admin girişində kod addımı
//   • /en/account — azərbaycanca yazı yoxdur; axe
// Server yoxdur: tests/e2e/userAuth.js + securityApi.js saxtadır.
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import { test, expect, expectCleanConsole } from './fixtures.js'
import { fakeUserSession, USER_EMAIL, USER_PASSWORD } from './userAuth.js'
import { fakeAdminSession, ADMIN_EMAIL, ADMIN_PANEL } from './adminAuth.js'
import { fakeSecurityApi, fakeAdminTwoFactor, TOTP_CODE, TOTP_SECRET, BACKUP } from './securityApi.js'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('2FA-nı aç: şifrə → QR + açar → kod → ehtiyat kodları; status "Açıqdır"', async ({ page, consoleProblems }) => {
  const user = await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
  const api = await fakeSecurityApi(page, user)
  await page.goto('/account')
  const sec = page.locator('section[aria-labelledby="acc-2fa"]')
  await expect(sec.getByRole('heading', { name: /İki addımlı yoxlama/ })).toBeVisible()
  await expect(sec.getByTestId('twofa-status')).toHaveText('Bağlıdır')
  await sec.getByRole('button', { name: 'İki addımlı yoxlamanı aç' }).click()
  await sec.getByLabel('Davam etmək üçün cari şifrənizi yazın').fill(USER_PASSWORD)
  await sec.getByRole('button', { name: 'Davam et' }).click()
  await expect(sec.getByRole('img', { name: 'İki addımlı yoxlama üçün QR kod' })).toBeVisible()
  await expect(sec.getByTestId('totp-secret')).toHaveText(TOTP_SECRET.match(/.{4}/g).join(' '))
  await expect(sec.getByRole('link', { name: 'Bu cihazdakı tətbiqdə aç' })).toHaveAttribute('href', /^otpauth:\/\/totp\//)
  const code = sec.getByLabel('Kod', { exact: true })
  await expect(code).toHaveAttribute('autocomplete', 'one-time-code')
  await expect(code).toHaveAttribute('inputmode', 'numeric')
  await code.fill('000000')
  await sec.getByRole('button', { name: 'Təsdiqlə və aç' }).click()
  await expect(sec.getByRole('alert')).toContainText('Kod yanlışdır')
  await code.fill(TOTP_CODE)
  await sec.getByRole('button', { name: 'Təsdiqlə və aç' }).click()
  const codes = sec.getByTestId('backup-codes')
  await expect(codes).toBeVisible()
  await expect(codes.locator('li')).toHaveCount(10)
  await expect(codes).toContainText(BACKUP[0])
  // Yüklə (.txt)
  const [dl] = await Promise.all([page.waitForEvent('download'), codes.getByRole('button', { name: 'Yüklə' }).click()])
  expect(dl.suggestedFilename()).toMatch(/^muslims-cc-backup-codes-\d{4}-\d{2}-\d{2}\.txt$/)
  expect(fs.readFileSync(await dl.path(), 'utf8')).toContain(BACKUP[9])
  await codes.getByRole('button', { name: 'Saxladım' }).click()
  await expect(sec.getByTestId('backup-codes')).toHaveCount(0)
  await expect(sec.getByTestId('twofa-status')).toHaveText('Açıqdır')
  await expect(sec.getByTestId('backup-left')).toContainText('10')
  expect(api.bodies['POST /api/auth/2fa/setup']).toEqual({ password: USER_PASSWORD })
  expect(api.bodies['POST /api/auth/2fa/enable']).toMatchObject({ code: TOTP_CODE })
  expectCleanConsole(consoleProblems)
})

test('giriş: 2FA açıq hesabda şifrədən sonra kod soruşulur; yanlış kod xəta, düzgün kod → /account', async ({ page, consoleProblems }) => {
  const user = await fakeUserSession(page)
  const api = await fakeSecurityApi(page, user, { twoFactor: true })
  await page.goto('/login')
  await page.getByLabel('E-poçt').fill(USER_EMAIL)
  await page.getByLabel('Şifrə', { exact: true }).fill(USER_PASSWORD)
  await page.getByRole('button', { name: 'Daxil ol', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'İki addımlı yoxlama' })).toBeVisible()
  const code = page.getByLabel('Kod', { exact: true })
  await expect(code).toHaveAttribute('autocomplete', 'one-time-code')
  await expect(code).toHaveAttribute('inputmode', 'numeric')
  await expect(code).toBeFocused()
  await code.fill('111111')
  await page.getByRole('button', { name: 'Təsdiqlə' }).click()
  await expect(page.getByRole('alert')).toContainText('Qalan cəhd: 4')
  await code.fill(TOTP_CODE)
  await page.getByRole('button', { name: 'Təsdiqlə' }).click()
  await expect(page).toHaveURL(/\/account$/)
  expect(api.bodies['POST /api/auth/2fa']).toMatchObject({ code: TOTP_CODE, ticket: expect.any(String) })
  expect(api.bodies['POST /api/auth/login']).toMatchObject({ lang: 'az' })
  expectCleanConsole(consoleProblems)
})

test('giriş: ehtiyat kodu ilə', async ({ page }) => {
  const user = await fakeUserSession(page)
  const api = await fakeSecurityApi(page, user, { twoFactor: true })
  await page.goto('/login')
  await page.getByLabel('E-poçt').fill(USER_EMAIL)
  await page.getByLabel('Şifrə', { exact: true }).fill(USER_PASSWORD)
  await page.getByRole('button', { name: 'Daxil ol', exact: true }).click()
  await page.getByRole('button', { name: 'Ehtiyat kodu işlət' }).click()
  await page.getByLabel('Ehtiyat kodu').fill(BACKUP[3])
  await page.getByRole('button', { name: 'Təsdiqlə' }).click()
  await expect(page).toHaveURL(/\/account$/)
  expect(api.bodies['POST /api/auth/2fa']).toMatchObject({ backupCode: BACKUP[3] })
})

test('təhlükəsizlik fəaliyyəti: hadisələr (vaxt, növ, cihaz, ölkə); qorunma rejimini açmaq', async ({ page, consoleProblems }) => {
  const user = await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
  const api = await fakeSecurityApi(page, user, { hold: true })
  await page.goto('/account')
  const list = page.getByTestId('security-events')
  await expect(list.locator('li')).toHaveCount(3)
  await expect(list.locator('li').first()).toContainText('Yeni cihazdan giriş')
  await expect(list.locator('li').first()).toContainText('Safari · iOS')
  await expect(list.locator('li').first()).toContainText('şifrə + kod')
  await expect(list.locator('li').first()).toContainText(/Türkiyə|Türkiye|Turkey/)
  await expect(list.locator('li').nth(1)).toContainText('Şifrə dəyişdirildi')
  const hold = page.getByTestId('security-hold')
  await expect(hold).toContainText('Hesab qorunma rejimindədir')
  await hold.getByRole('button', { name: /rejimi aç/ }).click()
  await expect(page.getByText('Qorunma rejimi açıldı.')).toBeVisible()
  await expect(page.getByTestId('security-hold')).toHaveCount(0)
  expect(api.requests).toContain('POST /api/auth/security/hold/release')
  expectCleanConsole(consoleProblems)
})

test('Mənim məlumatlarım: bu cihaz / sinxron / server; "Bütün məlumatımı yüklə" — bir JSON', async ({ page, consoleProblems }) => {
  await page.addInitScript(() => { try { localStorage.setItem('hifz_progress', '{"1":[1,2,3]}'); localStorage.setItem('qm_ptimes_baku', 'x') } catch { /* */ } })
  const user = await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
  await fakeSecurityApi(page, user)
  await page.goto('/account')
  const sec = page.locator('section[aria-labelledby="acc-mydata"]')
  await expect(sec.getByRole('heading', { name: 'Mənim məlumatlarım' })).toBeVisible()
  await expect(sec.getByTestId('local-data')).toContainText('Hifz')
  await expect(sec.getByTestId('local-data')).toContainText('Keş və texniki açarlar')
  await expect(sec.getByTestId('server-data')).toContainText('Gələcəyə məktublar')
  const [dl] = await Promise.all([page.waitForEvent('download'), sec.getByRole('button', { name: 'Bütün məlumatımı yüklə' }).click()])
  expect(dl.suggestedFilename()).toMatch(/^muslims-cc-my-data-\d{4}-\d{2}-\d{2}\.json$/)
  const j = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'))
  expect(j.kind).toBe('muslims.cc/my-data')
  expect(j.server.kind).toBe('muslims.cc/account-export')
  expect(j.device.kind).toBe('muslims.cc/user-backup')
  expect(j.device.data.hifz_progress).toBe('{"1":[1,2,3]}')
  expect(j.device.data.qm_ptimes_baku).toBeUndefined()            // keş daxil deyil
  expect(JSON.stringify(j)).not.toContain('mcc_logged_in')
  await expect(sec.getByText('Fayl yükləndi.')).toBeVisible()
  expectCleanConsole(consoleProblems)
})

// Break-glass (serverdə ADMIN_LEGACY_LOGIN=1): ayrıca admin hesabının girişi panelin öz ünvanında
test('admin paneli (break-glass): 2FA açıq hesabda şifrədən sonra kod addımı', async ({ page }) => {
  const admin = await fakeAdminSession(page, 'admin')
  const api = await fakeAdminTwoFactor(page, admin)
  await page.goto(ADMIN_PANEL)
  await page.getByLabel('E-poçt').fill(ADMIN_EMAIL)
  await page.getByLabel('Şifrə', { exact: true }).fill('test-password')
  await page.getByRole('button', { name: 'Daxil ol' }).click()
  const form = page.getByTestId('admin-2fa')
  await expect(form).toBeVisible()
  const code = form.getByLabel('Kod', { exact: true })
  await expect(code).toHaveAttribute('autocomplete', 'one-time-code')
  await code.fill('999999')
  await form.getByRole('button', { name: 'Təsdiqlə' }).click()
  await expect(page.getByRole('alert')).toContainText('Kod yanlışdır')
  await code.fill(TOTP_CODE)
  await form.getByRole('button', { name: 'Təsdiqlə' }).click()
  await expect(page.getByTestId('admin-role')).toBeVisible({ timeout: 10_000 })
  expect(api.requests).toContain('POST /api/admin/2fa')
  // konsol yoxlanmır: panel açılanda saxtalaşdırılmamış admin API-ləri (analytics, feedback) 404 verir — admin-auth.spec.js kimi
})

test('/en/account: təhlükəsizlik bölmələrində azərbaycanca yazı yoxdur', async ({ page, consoleProblems }) => {
  const user = await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
  await fakeSecurityApi(page, user, { hold: true })
  await page.goto('/en/account')
  await expect(page.getByRole('heading', { name: /Two-step verification/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Security activity' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'My data' })).toBeVisible()
  await expect(page.getByTestId('security-events').locator('li')).toHaveCount(3)
  await expect(page.getByTestId('server-data')).toBeVisible()
  for (const id of ['acc-2fa', 'acc-activity', 'acc-mydata']) {
    const text = await page.locator(`section[aria-labelledby="${id}"]`).innerText()
    expect(text, id).not.toMatch(/[əƏ]|yoxlama|Məlumat|Giriş/)
  }
  await page.locator('section[aria-labelledby="acc-2fa"]').getByRole('button', { name: 'Turn on two-step verification' }).click()
  await expect(page.locator('section[aria-labelledby="acc-2fa"]').getByLabel('Enter your current password to continue')).toBeVisible()
  expectCleanConsole(consoleProblems)
})

for (const theme of ['light', 'dark']) {
  test(`axe: /account təhlükəsizlik bölmələri (${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.addInitScript((t) => { try { localStorage.setItem('muslim_cc_theme', t) } catch { /* */ } }, theme)
    const user = await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
    await fakeSecurityApi(page, user, { hold: true })
    await page.goto('/account')
    await expect(page.getByTestId('security-events')).toBeVisible()
    await expect(page.getByTestId('server-data')).toBeVisible()
    // QR qurulum görünüşü də yoxlansın
    const sec = page.locator('section[aria-labelledby="acc-2fa"]')
    await sec.getByRole('button', { name: 'İki addımlı yoxlamanı aç' }).click()
    await sec.getByLabel('Davam etmək üçün cari şifrənizi yazın').fill(USER_PASSWORD)
    await sec.getByRole('button', { name: 'Davam et' }).click()
    await expect(sec.getByTestId('totp-qr')).toBeVisible()
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .include('section[aria-labelledby="acc-2fa"]').include('section[aria-labelledby="acc-activity"]').include('section[aria-labelledby="acc-mydata"]').analyze()
    const bad = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
      .flatMap((v) => v.nodes.map((n) => `${v.id} · ${n.target.join(' ')}`))
    expect(bad).toEqual([])
  })
}

test('axe: /login kod addımı', async ({ page }) => {
  const user = await fakeUserSession(page)
  await fakeSecurityApi(page, user, { twoFactor: true })
  await page.goto('/login')
  await page.getByLabel('E-poçt').fill(USER_EMAIL)
  await page.getByLabel('Şifrə', { exact: true }).fill(USER_PASSWORD)
  await page.getByRole('button', { name: 'Daxil ol', exact: true }).click()
  await expect(page.getByLabel('Kod', { exact: true })).toBeVisible()
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).include('.acc-card').analyze()
  expect(violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').map((v) => v.id)).toEqual([])
})
