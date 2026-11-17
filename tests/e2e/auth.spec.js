// ═══════════════════════════════════════════════════════
// Saytın istifadəçi hesabı (server/users.js, docs/USER-ACCOUNTS.md) — klient axınları
//
// • Başlıq: anonim ziyarətçidə /api/auth/me ÇAĞIRILMIR; ipucu varsa — avatar
// • /signup: zəif şifrə klientdə dayanır, 201 → /account; 202 → "e-poçtunuzu yoxlayın"
// • /login: yanlış şifrə — xəta (aria-live), düzgün — /account; ?next qorunur
// • "Şifrəni unutmusunuz?" — həmişə neytral cavab
// • Google (saxta GIS) — 409 link_requires_verification aydın mesajla
// • /account: sessiyalar, passkey-lər, rol nişanı, çıxış; girişsiz → /login?next=/account
// • /account/reset və /account/verify — token fraqmentdən oxunur və DƏRHAL ünvandan silinir
// • Admin paneli → "İstifadəçilər": rol dəyişmə, 403 kodlarının mətni, rol tarixçəsi
// Server yoxdur — cavablar tests/e2e/userAuth.js və adminAuth.js-də saxtadır.
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'
import { fakeUserSession, USER_EMAIL, USER_PASSWORD, RESET_TOKEN, VERIFY_TOKEN } from './userAuth.js'
import { fakeAdminSession, adminSignIn, ADMIN_EMAIL } from './adminAuth.js'

const meCalls = (state) => state.requests.filter(r => r === 'GET /api/auth/me').length

test.describe('başlıq', () => {
  test('anonim: "Daxil ol" linki, /api/auth/me sorğusu yoxdur', async ({ page, consoleProblems, isMobile }) => {
    test.skip(isMobile, 'telefonda hesab çəkmə menyudadır (ayrıca test)')
    const state = await fakeUserSession(page)
    await page.goto('/')
    await settle(page)
    await page.waitForTimeout(2600)   // boş vaxt yoxlaması (whenIdle) keçsin
    const link = page.getByTestId('hdr-account')
    await expect(link).toHaveAttribute('href', '/login')
    await expect(link).toHaveAccessibleName('Daxil ol')
    expect(meCalls(state)).toBe(0)
    expectCleanConsole(consoleProblems)
  })

  test('ipucu varsa: /me bir dəfə, avatar menyusu, çıxış', async ({ page, consoleProblems, isMobile }) => {
    test.skip(isMobile, 'telefonda hesab çəkmə menyudadır')
    const state = await fakeUserSession(page, { signedIn: true })
    await page.addInitScript(() => { if (!sessionStorage.getItem('hinted')) { sessionStorage.setItem('hinted', '1'); localStorage.setItem('mcc_logged_in', '1') } })
    await page.goto('/')
    const btn = page.getByRole('button', { name: /Hesab menyusu/ })
    await expect(btn).toBeVisible({ timeout: 10_000 })
    await expect(btn).toHaveText('Ə')
    expect(meCalls(state)).toBe(1)
    await btn.click()
    await expect(page.getByRole('link', { name: 'Hesabım' })).toBeVisible()
    await page.getByRole('button', { name: 'Çıxış' }).click()
    await expect(page.getByTestId('hdr-account')).toHaveAttribute('href', '/login')
    expect(await page.evaluate(() => localStorage.getItem('mcc_logged_in'))).toBeNull()
    expect(state.requests).toContain('POST /api/auth/logout')
    expectCleanConsole(consoleProblems)
  })

  test('1280px: hesab keçidi yan paneldədir (başlıq düyməsi yalnız ≥1440px — naviqasiya üst-üstə düşməsin)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'yan panel yalnız ≥1024px')
    await fakeUserSession(page)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await settle(page)
    await expect(page.getByTestId('hdr-account')).toBeHidden()
    const link = page.locator('.qm-sn--rail').getByRole('link', { name: 'Daxil ol' })
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('telefon: çəkmə menyuda "Daxil ol" kafeli', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'yalnız telefonda')
    await fakeUserSession(page)
    await page.goto('/')
    await settle(page)
    await page.getByRole('button', { name: 'Menyu', exact: true }).click()
    const tile = page.getByRole('dialog').getByRole('link', { name: 'Daxil ol' })
    await expect(tile).toBeVisible()
    await tile.click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Hesaba daxil olun' })).toBeVisible()
  })
})

test.describe('qeydiyyat', () => {
  test('zəif şifrə klientdə dayanır; 201 → hesab səhifəsi', async ({ page, consoleProblems }) => {
    const state = await fakeUserSession(page)
    await page.goto('/signup')
    await expect(page.getByRole('heading', { level: 1, name: 'Hesab yaradın' })).toBeVisible()
    await expect(page.getByLabel('E-poçt')).toHaveAttribute('autocomplete', 'email')
    await expect(page.getByLabel('Şifrə', { exact: true })).toHaveAttribute('autocomplete', 'new-password')
    await page.getByLabel('E-poçt').fill('new@example.com')
    await page.getByLabel('Ad (istəyə bağlı)').fill('Zeynəb')
    await page.getByLabel('Şifrə', { exact: true }).fill('qisa')
    await expect(page.getByText(/Şifrənin gücü: Çox qısa/)).toBeVisible()
    await page.getByRole('button', { name: 'Hesab yarat' }).click()
    await expect(page.getByRole('alert')).toContainText('Şifrə zəifdir')
    expect(state.requests).not.toContain('POST /api/auth/register')

    await page.getByLabel('Şifrə', { exact: true }).fill('Bakı-Şəki 2026 yol!')
    await expect(page.getByText(/Şifrənin gücü: Güclü/)).toBeVisible()
    await page.getByRole('button', { name: 'Hesab yarat' }).click()
    await expect(page).toHaveURL(/\/account$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Zeynəb' })).toBeVisible()
    expect(state.bodies['POST /api/auth/register']).toMatchObject({ email: 'new@example.com', displayName: 'Zeynəb', lang: 'az' })
    expect(await page.evaluate(() => localStorage.getItem('mcc_logged_in'))).toBe('1')
    await expect(page.getByTestId('verify-banner')).toBeVisible()
    expect(state.csrfMissing).toEqual([])
    expectCleanConsole(consoleProblems)
  })

  test('mövcud e-poçt (202) — neytral "e-poçtunuzu yoxlayın", giriş yoxdur', async ({ page, consoleProblems }) => {
    await fakeUserSession(page)
    await page.goto('/signup')
    await page.getByLabel('E-poçt').fill(USER_EMAIL)
    await page.getByLabel('Şifrə', { exact: true }).fill('Bakı-Şəki 2026 yol!')
    await page.getByRole('button', { name: 'Hesab yarat' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'E-poçtunuzu yoxlayın' })).toBeVisible()
    await expect(page.getByRole('status')).toContainText(USER_EMAIL)
    await expect(page).toHaveURL(/\/signup$/)
    expect(await page.evaluate(() => localStorage.getItem('mcc_logged_in'))).toBeNull()
    expectCleanConsole(consoleProblems)
  })
})

test.describe('giriş', () => {
  test('yanlış şifrə — xəta; düzgün — ?next ünvanına', async ({ page, consoleProblems }) => {
    const state = await fakeUserSession(page)
    await page.goto('/login?next=%2Faccount')
    await expect(page.getByRole('heading', { level: 1, name: 'Hesaba daxil olun' })).toBeVisible()
    await expect(page.getByLabel('E-poçt')).toHaveAttribute('autocomplete', 'username webauthn')
    await expect(page.getByLabel('Şifrə', { exact: true })).toHaveAttribute('autocomplete', 'current-password')
    await expect(page.getByRole('button', { name: 'Passkey ilə daxil ol' })).toBeVisible()

    await page.getByLabel('E-poçt').fill(USER_EMAIL)
    await page.getByLabel('Şifrə', { exact: true }).fill('yanlış-şifrə')
    await page.getByRole('button', { name: 'Daxil ol', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('E-poçt və ya şifrə yanlışdır')
    await expect(page.getByLabel('Şifrə', { exact: true })).toHaveAttribute('aria-invalid', 'true')
    await expect(page).toHaveURL(/\/login\?next=/)

    await page.getByLabel('Şifrə', { exact: true }).fill(USER_PASSWORD)
    await page.getByRole('button', { name: 'Daxil ol', exact: true }).click()
    await expect(page).toHaveURL(/\/account$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Əli' })).toBeVisible()
    expect(state.csrfMissing).toEqual([])
    expectCleanConsole(consoleProblems)
  })

  test('"Şifrəni unutmusunuz?" — həmişə neytral cavab', async ({ page, consoleProblems }) => {
    const state = await fakeUserSession(page)
    await page.goto('/login')
    await page.getByRole('button', { name: 'Şifrəni unutmusunuz?' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Şifrəni bərpa edin' })).toBeVisible()
    await page.getByLabel('E-poçt').fill('nobody@example.com')
    await page.getByRole('button', { name: 'Keçidi göndər' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Bu ünvanla hesab varsa' })).toBeVisible()
    expect(state.bodies['POST /api/auth/forgot']).toMatchObject({ email: 'nobody@example.com', lang: 'az' })
    expectCleanConsole(consoleProblems)
  })

  test('Google: 409 — e-poçt təsdiqi lazım olduğu aydın deyilir', async ({ page, consoleProblems }) => {
    const state = await fakeUserSession(page, { google: 'conflict' })
    await page.goto('/login')
    await page.locator('[data-gis-stub="signin_with"]').click()
    await expect(page.getByRole('alert')).toContainText('e-poçt hələ təsdiqlənməyib')
    expect(state.bodies['POST /api/auth/google']).toEqual({ credential: 'test-google-credential' })
    await expect(page).toHaveURL(/\/login$/)
    expectCleanConsole(consoleProblems)
  })

  test('Google: uğurlu giriş → hesab', async ({ page }) => {
    await fakeUserSession(page, { google: 'ok' })
    await page.goto('/signup')
    await page.locator('[data-gis-stub="signup_with"]').click()
    await expect(page).toHaveURL(/\/account$/)
    await expect(page.getByText('Google', { exact: true })).toBeVisible()
  })
})

test.describe('hesab səhifəsi', () => {
  test('girişsiz → /login?next=/account', async ({ page, consoleProblems }) => {
    await fakeUserSession(page)
    await page.goto('/account')
    await expect(page).toHaveURL(/\/login\?next=%2Faccount$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Hesaba daxil olun' })).toBeVisible()
    expectCleanConsole(consoleProblems)
  })

  test('sessiyalar, passkey-lər, rol; digər sessiyanı bağla; çıxış', async ({ page, consoleProblems }) => {
    const state = await fakeUserSession(page, { signedIn: true, user: { role: 'mosque_rep', mosqueId: 'baku-taza-pir' } })
    await page.goto('/account')
    await expect(page.getByRole('heading', { level: 1, name: 'Əli' })).toBeVisible()
    await expect(page.getByTestId('role-badge')).toHaveText('Məscid nümayəndəsi')
    await expect(page.getByText('baku-taza-pir')).toBeVisible()
    await expect(page.getByText(/məscidinizin məlumatlarını idarə etmək — tezliklə/)).toBeVisible()

    const passkeys = page.getByTestId('passkey-list')
    await expect(page.getByRole('heading', { name: 'Passkey-lər' })).toBeVisible()
    await expect(passkeys).toContainText('Chrome · Android')
    await expect(page.getByRole('button', { name: 'Passkey əlavə et' })).toBeVisible()

    const sessions = page.getByTestId('session-list')
    await expect(sessions.locator('li')).toHaveCount(2)
    await expect(sessions).toContainText('Bu cihaz')
    await sessions.getByRole('button', { name: /Bağla: Safari/ }).click()
    await expect(sessions.locator('li')).toHaveCount(1)
    expect(state.bodies['POST /api/auth/sessions/revoke']).toEqual({ id: 'oth0000000000000' })

    // passkey silmə — səhifədə təsdiq
    await passkeys.getByRole('button', { name: /Sil: Chrome/ }).click()
    await passkeys.getByRole('button', { name: 'Bəli, sil' }).click()
    await expect(page.getByText('Hələ passkey yoxdur.')).toBeVisible()

    await page.getByRole('button', { name: 'Çıxış' }).first().click()
    await expect(page).toHaveURL(/\/$/)
    expect(await page.evaluate(() => localStorage.getItem('mcc_logged_in'))).toBeNull()
    expect(state.csrfMissing).toEqual([])
    expectCleanConsole(consoleProblems)
  })

  test('hesabı sil — səhifədə şifrə ilə təsdiq', async ({ page, consoleProblems }) => {
    const state = await fakeUserSession(page, { signedIn: true })
    await page.goto('/account')
    await page.getByRole('button', { name: 'Hesabı sil' }).click()
    await page.getByLabel('Təsdiq üçün şifrənizi yazın').fill('yanlış')
    await page.getByRole('button', { name: 'Birdəfəlik sil' }).click()
    await expect(page.getByRole('alert')).toContainText('Cari şifrə yanlışdır')
    await page.getByLabel('Təsdiq üçün şifrənizi yazın').fill(USER_PASSWORD)
    await page.getByRole('button', { name: 'Birdəfəlik sil' }).click()
    await expect(page).toHaveURL(/\/$/)
    expect(state.requests).toContain('POST /api/auth/delete')
    expectCleanConsole(consoleProblems)
  })
})

test.describe('e-poçt keçidləri', () => {
  test('/account/reset — token ünvandan dərhal silinir, yeni şifrə → giriş', async ({ page, consoleProblems }) => {
    const state = await fakeUserSession(page)
    await page.goto(`/account/reset#token=${RESET_TOKEN}`)
    await expect(page.getByRole('heading', { level: 1, name: 'Yeni şifrə təyin edin' })).toBeVisible()
    expect(await page.evaluate(() => window.location.hash)).toBe('')
    expect(page.url()).not.toContain(RESET_TOKEN)
    await page.getByLabel('Yeni şifrə', { exact: true }).fill('Yeni-uzun-şifrə 77')
    await page.getByRole('button', { name: 'Şifrəni yadda saxla' }).click()
    await expect(page).toHaveURL(/\/login\?reset=done$/)
    await expect(page.getByRole('status').filter({ hasText: 'Şifrəniz dəyişdirildi' })).toBeVisible()
    expect(state.bodies['POST /api/auth/reset']).toEqual({ token: RESET_TOKEN, password: 'Yeni-uzun-şifrə 77' })
    expectCleanConsole(consoleProblems)
  })

  test('/account/reset — köhnə keçid: aydın xəta, yenisini istəmək olur', async ({ page }) => {
    await fakeUserSession(page)
    await page.goto(`/account/reset#token=${'X'.repeat(43)}`)
    await page.getByLabel('Yeni şifrə', { exact: true }).fill('Yeni-uzun-şifrə 77')
    await page.getByRole('button', { name: 'Şifrəni yadda saxla' }).click()
    await expect(page.getByRole('alert')).toContainText('Keçid etibarsızdır')
    await page.getByRole('link', { name: 'Yeni keçid istə' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Şifrəni bərpa edin' })).toBeVisible()
  })

  test('/account/verify — təsdiq; hash silinir', async ({ page, consoleProblems }) => {
    const state = await fakeUserSession(page)
    await page.goto(`/account/verify#token=${VERIFY_TOKEN}`)
    await expect(page.getByRole('status').filter({ hasText: 'E-poçt ünvanınız təsdiqləndi' })).toBeVisible()
    expect(await page.evaluate(() => window.location.hash)).toBe('')
    expect(state.bodies['POST /api/auth/verify']).toEqual({ token: VERIFY_TOKEN })
    expect(state.requests.filter(r => r === 'POST /api/auth/verify')).toHaveLength(1)
    expectCleanConsole(consoleProblems)
  })

  test('saxlanmış dil yönləndirməsi tokeni itirmir (/account/verify → /en/account/verify)', async ({ page }) => {
    const state = await fakeUserSession(page)
    await page.addInitScript(() => { try { localStorage.setItem('muslim_cc_lang', 'en') } catch { /* */ } })
    await page.goto(`/account/verify#token=${VERIFY_TOKEN}`)
    await expect(page).toHaveURL(/\/en\/account\/verify$/)
    await expect(page.getByRole('status').filter({ hasText: 'Your email address is confirmed' })).toBeVisible()
    expect(state.bodies['POST /api/auth/verify']).toEqual({ token: VERIFY_TOKEN })
  })
})

test.describe('əlçatanlıq (axe)', () => {
  for (const theme of ['light', 'dark']) {
    test(`/account və /account/reset (${theme}): ciddi pozuntu yoxdur`, async ({ page }, info) => {
      test.skip(info.project.name === 'mobile', 'kompüterdə')
      await page.emulateMedia({ colorScheme: theme })
      await fakeUserSession(page, { signedIn: true, user: { role: 'superadmin' } })
      const { default: AxeBuilder } = await import('@axe-core/playwright')
      const serious = async () => (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze())
        .violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
        .flatMap(v => v.nodes.slice(0, 3).map(n => `${v.id} · ${n.target.join(' ')}`))
      await page.goto('/account')
      await expect(page.getByTestId('session-list')).toBeVisible()
      expect(await serious()).toEqual([])
      await page.goto(`/account/reset#token=${RESET_TOKEN}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(await serious()).toEqual([])
    })
  }
})

test.describe('dillər', () => {
  for (const [url, lang, h1, bad] of [
    ['/en/login', 'en', 'Sign in to your account', /[əƏ]|[а-яё]{3,}/iu],
    ['/ru/signup', 'ru', 'Создайте аккаунт', /[əƏ]/u],
    ['/tr/login', 'tr', 'Hesabınıza giriş yapın', /[əƏ]/u],
    ['/ar/signup', 'ar', 'أنشئ حسابًا', /[əƏ]/u],
  ]) {
    test(`${url}: interfeys öz dilindədir`, async ({ page, consoleProblems }) => {
      await fakeUserSession(page)
      await page.goto(url)
      await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
      const text = await page.locator('main').innerText()
      expect(text).not.toMatch(bad)
      expect(await page.locator('meta[name="robots"]').getAttribute('content')).toBe('noindex, nofollow')
      expectCleanConsole(consoleProblems)
    })
  }
})

/** Admin paneli + "İstifadəçilər" API-si (server/users.js → /api/admin/users*, /api/admin/role-audit). */
async function fakeAdminUsers(page, role) {
  const admin = await fakeAdminSession(page, 'admin')
  const state = {
    users: [
      { id: 1, email: 'zeyneb@example.com', emailVerified: true, displayName: 'Zeynəb', role: 'user', mosqueId: null, disabled: false, createdAt: Date.UTC(2026, 10, 1), lastLoginAt: null },
      { id: 2, email: 'boss@example.com', emailVerified: true, displayName: '', role: 'superadmin', mosqueId: null, disabled: false, createdAt: Date.UTC(2026, 9, 1), lastLoginAt: null },
      { id: 3, email: 'ops@example.com', emailVerified: false, displayName: '', role: 'admin', mosqueId: null, disabled: false, createdAt: Date.UTC(2026, 9, 3), lastLoginAt: null },
      // Serverdə rolu bu arada "admin"-ə dəyişib (UI hələ köhnə siyahını göstərir) — server 403 qaytarır
      { id: 4, email: 'race@example.com', emailVerified: true, displayName: '', role: 'editor', mosqueId: null, disabled: false, createdAt: Date.UTC(2026, 9, 4), lastLoginAt: null },
    ],
    audit: [],
    bodies: [],
  }
  await page.route((u) => u.pathname === '/api/admin/me' || u.pathname.startsWith('/api/admin/users') || u.pathname === '/api/admin/role-audit', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (!admin.signedIn) return route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    if (url.pathname === '/api/admin/me') return route.fulfill({ json: { email: ADMIN_EMAIL, via: 'session', mustChangePassword: false, role } })
    if (role !== 'admin' && role !== 'superadmin') return route.fulfill({ status: 403, json: { error: 'Forbidden', code: 'forbidden' } })
    if (url.pathname === '/api/admin/role-audit') return route.fulfill({ json: { entries: state.audit, page: 1, pageSize: 50 } })
    if (url.pathname === '/api/admin/users') {
      const q = (url.searchParams.get('q') || '').toLowerCase()
      const list = state.users.filter(u => !q || u.email.includes(q) || u.displayName.toLowerCase().includes(q))
      return route.fulfill({ json: { users: list, page: 1, pageSize: 50, total: list.length } })
    }
    if (!req.headers()['x-requested-with']) return route.fulfill({ status: 403, json: { error: 'Forbidden', code: 'forbidden' } })
    const m = /^\/api\/admin\/users\/(\d+)\/(role|disable)$/.exec(url.pathname)
    const body = req.postDataJSON() || {}
    state.bodies.push({ path: url.pathname, body })
    const target = m && state.users.find(u => u.id === Number(m[1]))
    if (!target) return route.fulfill({ status: 404, json: { error: 'Not found', code: 'not_found' } })
    if (target.role === 'superadmin') return route.fulfill({ status: 403, json: { error: 'Forbidden', code: 'script_only' } })
    if (target.email === 'race@example.com' && role !== 'superadmin') return route.fulfill({ status: 403, json: { error: 'Forbidden', code: 'superadmin_required' } })
    if (m[2] === 'role') {
      if (body.role === 'admin' && role !== 'superadmin') return route.fulfill({ status: 403, json: { error: 'Forbidden', code: 'superadmin_required' } })
      state.audit.unshift({ id: state.audit.length + 1, actorKind: 'admin', actorId: 1, actorEmail: ADMIN_EMAIL, targetKind: 'user', targetId: target.id, targetEmail: target.email, action: 'role', oldRole: target.role, newRole: body.role, at: Date.UTC(2026, 10, 17) })
      Object.assign(target, { role: body.role, mosqueId: body.mosqueId || null })
    } else {
      target.disabled = body.disabled
    }
    return route.fulfill({ json: { ok: true, user: target } })
  })
  return state
}

async function openUsersTab(page) {
  const toggle = page.locator('.admin-menu-toggle')
  if (await toggle.isVisible()) await toggle.click()
  await page.getByRole('button', { name: 'İstifadəçilər' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'İstifadəçilər' })).toBeVisible()
}

test.describe('admin paneli: istifadəçilər', () => {
  test('superadmin: nişan, rol dəyişmə (məscid ID-si ilə), tarixçə; superadmin rolu təklif olunmur', async ({ page, consoleProblems }) => {
    const state = await fakeAdminUsers(page, 'superadmin')
    await page.goto('/admin')
    await adminSignIn(page)
    await expect(page.getByTestId('admin-role')).toContainText('Baş admin')
    await expect(page.getByTestId('admin-role')).toHaveClass(/admin-role-badge--super/)
    await openUsersTab(page)

    const row = page.locator('[data-testid="admin-user"][data-email="zeyneb@example.com"]')
    const select = row.getByTestId('role-select')
    const values = await select.locator('option:not([disabled])').evaluateAll(os => os.map(o => o.value))
    expect(values).toEqual(['user', 'mosque_rep', 'editor', 'admin'])
    // superadmin hesabı — yalnız oxumaq üçün
    await expect(page.locator('[data-testid="admin-user"][data-email="boss@example.com"]')).toContainText('dəyişmək olmaz')

    await select.selectOption('mosque_rep')
    await row.getByLabel('Məscidin ID-si').fill('Bakı məscidi')
    await row.getByRole('button', { name: 'Rolu saxla' }).click()
    await expect(page.getByRole('alert')).toContainText('Məscidin ID-si')
    expect(state.bodies).toEqual([])
    await row.getByLabel('Məscidin ID-si').fill('baku-taza-pir')
    await row.getByRole('button', { name: 'Rolu saxla' }).click()
    await expect(row).toContainText('Məscid nümayəndəsi')
    expect(state.bodies[0]).toEqual({ path: '/api/admin/users/1/role', body: { role: 'mosque_rep', mosqueId: 'baku-taza-pir' } })
    await expect(page.getByTestId('role-audit')).toContainText('zeyneb@example.com')
    await expect(page.getByTestId('role-audit')).toContainText('İstifadəçi → Məscid nümayəndəsi')
    // Panelin digər bölmələri (statistika, bildirişlər) testdə saxtalaşdırılmayıb — onların 401/404-ü bu testə aid deyil
    expect(consoleProblems.filter(x => !/Failed to load resource/.test(x))).toEqual([])
  })

  test('admin: admin rolu təklif olunmur, digər admin yalnız oxunur; server 403 kodu mətnlə', async ({ page }) => {
    await fakeAdminUsers(page, 'admin')
    await page.goto('/admin')
    await adminSignIn(page)
    await expect(page.getByTestId('admin-role')).not.toHaveClass(/admin-role-badge--super/)
    await openUsersTab(page)
    const row = page.locator('[data-testid="admin-user"][data-email="zeyneb@example.com"]')
    const values = await row.getByTestId('role-select').locator('option:not([disabled])').evaluateAll(os => os.map(o => o.value))
    expect(values).toEqual(['user', 'mosque_rep', 'editor'])
    await expect(page.locator('[data-testid="admin-user"][data-email="ops@example.com"]')).toContainText('dəyişmək olmaz')
    await row.getByRole('button', { name: 'Blokla' }).click()
    await expect(row).toContainText('Bloklanıb')

    const race = page.locator('[data-testid="admin-user"][data-email="race@example.com"]')
    await race.getByTestId('role-select').selectOption('user')
    await race.getByRole('button', { name: 'Rolu saxla' }).click()
    await expect(page.getByRole('alert')).toContainText('yalnız baş admin edə bilər')
  })

  test('editor: "İstifadəçilər" bölməsi görünmür', async ({ page }) => {
    await fakeAdminUsers(page, 'editor')
    await page.goto('/admin')
    await adminSignIn(page)
    await expect(page.locator('.admin-nav-btn').first()).toBeAttached()
    await expect(page.getByRole('button', { name: 'İstifadəçilər' })).toHaveCount(0)
  })
})
