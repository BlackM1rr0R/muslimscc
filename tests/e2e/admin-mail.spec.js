// ═══════════════════════════════════════════════════════
// Admin paneli → "E-poçt göndər" (server/mailCampaigns.js) + "İstifadəçilər" siyahısının yeni sahələri
//
// • Bölmə yalnız baş adminə görünür (admin/editor görmür; server də 403 qaytarır)
// • İstifadəçilər: sayt dili, xoş gəldin, imtina nişanı; təsdiqlənməmiş/imtina etmiş seçilə bilmir
// • Seçilənlər → məktub bölməsi; canlı önizləmə (sandbox iframe); "Özümə sınaq"
// • "Göndərməyə hazırla" → say göstərilir → "Bəli, N nəfərə göndər" → növbə + irəliləyiş + dayandırma
// Server yoxdur — /api/admin/* cavabları burada saxtadır (fixtures.js ümumi 401-dən SONRA qeyd olunur).
// ═══════════════════════════════════════════════════════
import { test, expect } from './fixtures.js'
import { fakeAdminSession, adminSignIn, ADMIN_EMAIL } from './adminAuth.js'

const USERS = [
  { id: 1, email: 'zeyneb@example.com', emailVerified: true, displayName: 'Zeynəb', role: 'user', mosqueId: null, disabled: false, createdAt: Date.UTC(2026, 10, 1), lastLoginAt: null, siteLang: 'az', welcomeSentAt: Date.UTC(2026, 10, 2), emailOptOut: false },
  { id: 2, email: 'omar@example.com', emailVerified: true, displayName: 'Omar', role: 'user', mosqueId: null, disabled: false, createdAt: Date.UTC(2026, 10, 3), lastLoginAt: null, siteLang: 'ar', welcomeSentAt: null, emailOptOut: false },
  { id: 3, email: 'new@example.com', emailVerified: false, displayName: '', role: 'user', mosqueId: null, disabled: false, createdAt: Date.UTC(2026, 10, 4), lastLoginAt: null, siteLang: null, welcomeSentAt: null, emailOptOut: false },
  { id: 4, email: 'quiet@example.com', emailVerified: true, displayName: '', role: 'user', mosqueId: null, disabled: false, createdAt: Date.UTC(2026, 10, 5), lastLoginAt: null, siteLang: 'en', welcomeSentAt: null, emailOptOut: true },
]

async function fakeMailApi(page, role) {
  const admin = await fakeAdminSession(page, 'admin')
  const state = { bodies: [], campaigns: [], tests: 0 }
  await page.route((u) => u.pathname === '/api/admin/me' || u.pathname.startsWith('/api/admin/users') || u.pathname === '/api/admin/role-audit' || u.pathname.startsWith('/api/admin/mail/'), async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const method = req.method()
    if (!admin.signedIn) return route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    if (url.pathname === '/api/admin/me') return route.fulfill({ json: { email: ADMIN_EMAIL, via: 'session', mustChangePassword: false, role, twoFactor: true } })
    if (method !== 'GET' && !req.headers()['x-requested-with']) return route.fulfill({ status: 403, json: { error: 'Forbidden', code: 'forbidden' } })
    if (url.pathname === '/api/admin/role-audit') return route.fulfill({ json: { entries: [], page: 1, pageSize: 50 } })
    if (url.pathname === '/api/admin/users') {
      const v = url.searchParams.get('verified')
      const list = USERS.filter((u) => v == null || (v === '1') === u.emailVerified)
      return route.fulfill({ json: { users: list, page: 1, pageSize: 50, total: list.length, facets: { users: 4, verified: 3, unverified: 1, optedOut: 1, langs: [{ lang: 'az', n: 1 }, { lang: 'ar', n: 1 }, { lang: 'en', n: 1 }, { lang: 'none', n: 1 }] } } })
    }
    if (url.pathname.startsWith('/api/admin/mail/') && role !== 'superadmin') return route.fulfill({ status: 403, json: { error: 'Forbidden', code: 'superadmin_required' } })
    const body = method === 'GET' ? null : (req.postDataJSON() || {})
    if (body) state.bodies.push({ path: url.pathname, body })
    if (url.pathname === '/api/admin/mail/preview') {
      const lang = body.lang && body.content.versions[body.lang] ? body.lang : Object.keys(body.content.versions)[0]
      const v = body.content.versions[lang]
      return route.fulfill({ json: { lang, subject: v.subject, text: v.body, html: `<!doctype html><html><body><h1>${v.subject.replace(/</g, '&lt;')}</h1></body></html>` } })
    }
    if (url.pathname === '/api/admin/mail/test') { state.tests++; return route.fulfill({ json: { ok: true, sent: Object.keys(body.content.versions).length } }) }
    if (url.pathname === '/api/admin/mail/audience') {
      const n = body.recipients.mode === 'all' ? 2 : body.recipients.ids.length
      return route.fulfill({ json: { count: n, byVersion: { az: n }, excluded: { unverified: 1, disabled: 0, optedOut: 1, missing: 0 } } })
    }
    if (url.pathname === '/api/admin/mail/campaigns' && method === 'GET') {
      return route.fulfill({ json: { campaigns: state.campaigns, mailEnabled: true, queue: { sentLastHour: 0, maxPerHour: 300, gapMs: 700 } } })
    }
    if (url.pathname === '/api/admin/mail/campaigns' && method === 'POST') {
      const c = { id: state.campaigns.length + 1, subject: body.content.versions[Object.keys(body.content.versions)[0]].subject, status: 'sending', createdAt: Date.UTC(2026, 10, 24), createdBy: ADMIN_EMAIL, recipientCount: body.confirmCount, sent: 0, failed: 0, skipped: 0, pending: body.confirmCount, cancelled: 0, finishedAt: null, mode: body.content.mode, langs: Object.keys(body.content.versions) }
      state.campaigns.unshift(c)
      return route.fulfill({ status: 201, json: { campaign: c } })
    }
    const m = /^\/api\/admin\/mail\/campaigns\/(\d+)\/cancel$/.exec(url.pathname)
    if (m) {
      const c = state.campaigns.find((x) => x.id === Number(m[1]))
      Object.assign(c, { status: 'cancelled', cancelled: c.pending, pending: 0 })
      return route.fulfill({ json: { campaign: c } })
    }
    return route.fulfill({ status: 404, json: { error: 'Not found', code: 'not_found' } })
  })
  return state
}

async function openTab(page, name) {
  await expect(page.getByRole('heading', { level: 1, name: 'İdarə paneli' })).toBeVisible()
  const toggle = page.locator('.admin-menu-toggle')
  if (await toggle.isVisible()) await toggle.click()
  await page.locator('.admin-nav-btn', { hasText: name }).click()
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
}

test.describe('admin paneli: e-poçt göndər', () => {
  test('admin: "E-poçt göndər" bölməsi görünmür, seçim qutucuqları yoxdur', async ({ page }) => {
    await fakeMailApi(page, 'admin')
    await page.goto('/admin')
    await adminSignIn(page)
    await openTab(page, 'İstifadəçilər')
    await expect(page.locator('.admin-nav-btn', { hasText: 'E-poçt göndər' })).toHaveCount(0)
    await expect(page.getByTestId('user-pick')).toHaveCount(0)
    // yeni sahələr adminə də görünür
    const row = page.locator('[data-testid="admin-user"][data-email="zeyneb@example.com"]')
    await expect(row.getByTestId('user-extra')).toContainText('AZ')
    await expect(page.locator('[data-testid="admin-user"][data-email="quiet@example.com"]').getByTestId('user-optout')).toBeVisible()
  })

  test('baş admin: seçim → önizləmə → sınaq → təsdiq → növbə → dayandır', async ({ page }) => {
    const state = await fakeMailApi(page, 'superadmin')
    await page.goto('/admin')
    await adminSignIn(page)
    await openTab(page, 'İstifadəçilər')

    // təsdiqlənməmiş və imtina etmiş seçilə bilmir
    await expect(page.locator('[data-testid="admin-user"][data-email="new@example.com"]').getByTestId('user-pick')).toBeDisabled()
    await expect(page.locator('[data-testid="admin-user"][data-email="quiet@example.com"]').getByTestId('user-pick')).toBeDisabled()
    await page.locator('[data-testid="admin-user"][data-email="zeyneb@example.com"]').getByTestId('user-pick').check()
    await page.locator('[data-testid="admin-user"][data-email="omar@example.com"]').getByTestId('user-pick').check()
    await expect(page.getByTestId('pick-bar')).toContainText('Seçilib: 2')
    await page.getByRole('button', { name: 'Seçilənlərə məktub yaz' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'E-poçt göndər' })).toBeVisible()
    await expect(page.getByTestId('mail-targets')).toContainText('zeyneb@example.com')
    await page.getByLabel('Mövzu').fill('Ramazan mübarək')
    await page.getByRole('textbox', { name: 'Mətn', exact: true }).fill('Əziz dostlar,\n\n**Ramazan** yaxınlaşır.')
    await expect(page.getByTestId('mail-preview-subject')).toHaveText('Ramazan mübarək')
    await expect(page.getByTestId('mail-preview')).toHaveAttribute('sandbox', '')

    await page.getByRole('button', { name: 'Özümə sınaq göndər' }).click()
    await expect(page.getByText('Sınaq məktubu panel e-poçtunuza göndərildi')).toBeVisible()
    expect(state.tests).toBe(1)

    await page.getByRole('button', { name: 'Göndərməyə hazırla' }).click()
    const confirm = page.getByTestId('mail-confirm')
    await expect(confirm).toContainText('Bu məktub 2 nəfərə göndəriləcək.')
    await confirm.getByTestId('mail-confirm-send').click()
    await expect(page.getByTestId('mail-campaign').first()).toContainText('Ramazan mübarək')
    const create = state.bodies.find((b) => b.path === '/api/admin/mail/campaigns')
    expect(create.body).toMatchObject({ recipients: { mode: 'selected', ids: [1, 2] }, confirmCount: 2, content: { mode: 'single', versions: { az: { subject: 'Ramazan mübarək' } } } })
    expect(create.body.requestId).toMatch(/^[A-Za-z0-9_-]{8,64}$/)
    // formadan HTML/əlavə sahə getmir — yalnız düz mətn
    expect(Object.keys(create.body.content.versions.az).sort()).toEqual(['body', 'ctaLabel', 'ctaUrl', 'subject'])

    await page.getByRole('button', { name: 'Dayandır' }).click()
    await expect(page.getByTestId('mail-campaign').first()).toContainText('Dayandırılıb')
  })

  test('baş admin: hər dilə ayrı versiya — ehtiyat dil göndərilir', async ({ page }) => {
    const state = await fakeMailApi(page, 'superadmin')
    await page.goto('/admin')
    await adminSignIn(page)
    await openTab(page, 'E-poçt göndər')
    await page.getByRole('radio', { name: 'Hər dilə ayrı versiya' }).click()
    await page.getByLabel('Mövzu').fill('Salam')
    await page.getByRole('textbox', { name: 'Mətn', exact: true }).fill('Mətn')
    await page.locator('.admin-lang-tab', { hasText: 'EN' }).click()
    await page.getByLabel('Mövzu').fill('Hello')
    await page.getByRole('textbox', { name: 'Mətn', exact: true }).fill('Body')
    await page.getByTestId('mail-fallback').selectOption('en')
    await page.getByRole('button', { name: 'Göndərməyə hazırla' }).click()
    await expect(page.getByTestId('mail-confirm')).toContainText('2 nəfərə')
    const aud = state.bodies.find((b) => b.path === '/api/admin/mail/audience')
    expect(aud.body).toMatchObject({ recipients: { mode: 'all' }, content: { mode: 'perLang', fallback: 'en', versions: { az: { subject: 'Salam' }, en: { subject: 'Hello' } } } })
  })
})
