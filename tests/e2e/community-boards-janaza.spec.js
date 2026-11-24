// ═══════════════════════════════════════════════════════
// /janaza — cənazə elanı (server/janaza.js; burada server yoxdur — /api saxtası)
//   • gizli keçid (#n=…): token YALNIZ POST gövdəsində; əlaqə görünür, "dua etdim" sayı görünmür;
//     "Dua etdim" → bir dəfə; Hisnul-Müslimdən mərhum üçün dualar (ərəbcə + mənbə); robots noindex
//   • köhnə keçid → mesaj
//   • girişli: razılıqsız göndərmək olmur; yaradılır → gizli keçid qutusu; "Elanlarım"da say (yalnız sahibinə)
//   • ictimai siyahıda əlaqə yoxdur; axe, 360px daşma yoxdur, ərəbcə RTL
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'
import { fakeUserSession } from './userAuth.js'

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
const TOKEN = 'n'.repeat(43)
const bakuToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku' }).format(new Date())
const NOTICE = () => ({ id: 7, deceased: 'Rahim Aliyev', date: bakuToday(), time: '14:00', place: 'Tazapir mosque', city: 'Baku', burial: 'Shikhlar cemetery', lang: 'en' })

async function attach(page, st) {
  await page.route((u) => u.pathname.startsWith('/api/janaza'), (route) => {
    const req = route.request()
    const p = new URL(req.url()).pathname
    const m = req.method()
    st.calls.push(`${m} ${p}${new URL(req.url()).search}`)
    let body = null
    if (m !== 'GET') {
      body = req.postDataJSON?.() ?? null
      st.bodies.push({ path: p, body, xrw: req.headers()['x-requested-with'] })
      if (!req.headers()['x-requested-with']) return route.fulfill({ status: 403, json: { error: 'Forbidden', code: 'forbidden' } })
    }
    if (p === '/api/janaza/view') {
      if (body?.token !== TOKEN) return route.fulfill({ status: 404, json: { error: 'Invalid link', code: 'invalid_token' } })
      return route.fulfill({ json: { notice: { ...NOTICE(), contact: 'Son Elvin +994 50 000 00 00', listed: false } } })
    }
    if (p === '/api/janaza/dua') return route.fulfill({ json: { ok: true, already: false } })
    if (p === '/api/janaza/public') return route.fulfill({ json: { items: st.public } })
    if (p === '/api/janaza/mine') return route.fulfill({ json: { items: st.mine, today: bakuToday(), limits: {} } })
    if (p === '/api/janaza' && m === 'POST') {
      const notice = { ...NOTICE(), ...body, id: 8, contact: body.contact, listed: false, publicStatus: body.public ? 'pending' : 'none', reason: null, duas: 0, createdAt: Date.now(), expired: false }
      st.mine.unshift({ ...notice, duas: 2 })
      return route.fulfill({ status: 201, json: { notice, token: 'T'.repeat(43) } })
    }
    return route.fulfill({ status: 404, json: { error: 'Not found', code: 'not_found' } })
  })
}

test('gizli keçid: əlaqə var, say yoxdur; "Dua etdim" bir dəfə; Hisn duaları mənbə ilə; noindex', async ({ page, consoleProblems }) => {
  const st = { calls: [], bodies: [], public: [], mine: [] }
  await attach(page, st)
  await page.goto(`/en/janaza#n=${TOKEN}`)
  await settle(page)
  const card = page.getByTestId('jz-notice')
  await expect(card).toContainText('Rahim Aliyev')
  await expect(page.getByTestId('jz-contact')).toHaveText('Son Elvin +994 50 000 00 00')
  // Token URL-də (sorğu sətrində) deyil, yalnız POST gövdəsində
  expect(st.calls.some((c) => c.includes(TOKEN))).toBe(false)
  expect(st.bodies.find((b) => b.path === '/api/janaza/view')).toMatchObject({ body: { token: TOKEN }, xrw: 'fetch' })
  await expect(card).not.toContainText(/people made dua|person made dua/)
  await page.getByTestId('jz-dua').click()
  await expect(page.getByTestId('jz-dua-done')).toContainText('The family sees only the number')
  await expect(page.getByTestId('jz-dua')).toBeDisabled()
  expect(st.bodies.filter((b) => b.path === '/api/janaza/dua')).toHaveLength(1)
  const duas = page.getByTestId('jz-duas')
  await expect(duas).toContainText('Supplication for the deceased in the funeral prayer')
  await expect(duas.locator('[lang="ar"]').first()).toBeVisible()
  await expect(duas.locator('cite').first()).toContainText('Muslim')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  expect(await serious(page, ['main'])).toEqual([])
  expect(await noOverflow(page)).toBe(true)
  expectCleanConsole(consoleProblems)
})

test('köhnə və ya yanlış keçid → mesaj', async ({ page, consoleProblems }) => {
  const st = { calls: [], bodies: [], public: [], mine: [] }
  await attach(page, st)
  await page.goto(`/en/janaza#n=${'x'.repeat(43)}`)
  await settle(page)
  await expect(page.getByTestId('jz-missing')).toContainText('Ask the person who shared it for a new link')
  expectCleanConsole(consoleProblems)
})

test('ictimai siyahı: əlaqə və say yoxdur; girişsiz — forma əvəzinə giriş', async ({ page, consoleProblems }) => {
  const st = { calls: [], bodies: [], public: [NOTICE()], mine: [] }
  await attach(page, st)
  await page.goto('/en/janaza')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Janaza notice')
  const pub = page.getByTestId('jz-public')
  await expect(pub.getByTestId('jz-card')).toHaveCount(1)
  await expect(pub).not.toContainText('+994')
  await expect(pub.getByTestId('jz-contact')).toHaveCount(0)
  await expect(page.getByTestId('jz-form-section').getByRole('link', { name: 'Sign in' })).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('girişli: razılıqla yaradılır → gizli keçid; say yalnız "Elanlarım"da', async ({ page, consoleProblems }) => {
  await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
  await page.addInitScript(() => localStorage.setItem('mcc_logged_in', '1'))
  const st = { calls: [], bodies: [], public: [], mine: [] }
  await attach(page, st)
  await page.goto('/en/janaza')
  await settle(page)
  await page.getByTestId('jz-deceased').fill('Rahim Aliyev')
  await page.getByTestId('jz-time').fill('14:00')
  await page.getByTestId('jz-place').fill('Tazapir mosque')
  await page.getByTestId('jz-contact-input').fill('Son Elvin')
  await expect(page.getByTestId('jz-submit')).toBeDisabled()
  await page.getByTestId('jz-consent').check()
  await page.getByTestId('jz-submit').click()
  await expect(page.getByTestId('jz-link-url')).toHaveValue(/\/en\/janaza#n=T{43}$/)
  const sent = st.bodies.find((b) => b.path === '/api/janaza')
  expect(sent.xrw).toBe('fetch')
  expect(sent.body).toMatchObject({ deceased: 'Rahim Aliyev', date: bakuToday(), time: '14:00', place: 'Tazapir mosque', contact: 'Son Elvin', public: false, consent: true, lang: 'en' })
  await expect(page.getByTestId('jz-mine-duas').first()).toHaveText('2 people made dua')
  await expect(page.getByTestId('jz-mine-public').first()).toHaveText('Private link only')
  expect(await serious(page, ['main'])).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('ərəbcə: RTL və başlıq', async ({ page, consoleProblems }) => {
  await page.goto('/ar/janaza')
  await settle(page)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('إعلان جنازة')
  await expect(page.getByTestId('jz-public-empty')).toBeVisible()
  expect(await noOverflow(page)).toBe(true)
  expectCleanConsole(consoleProblems)
})
