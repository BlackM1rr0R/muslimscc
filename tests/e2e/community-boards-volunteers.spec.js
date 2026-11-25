// ═══════════════════════════════════════════════════════
// /volunteers — məscid könüllüləri (server/volunteers.js; burada server yoxdur — /api saxtası)
//   • girişsiz: yalnız "N of M slots filled" — ad yoxdur; "Sign up" → giriş keçidi
//   • girişli: yazıl (ad, e-poçt yalnız razılıqla) → "You are signed up" → ləğv (DELETE)
//   • e-poçtu təsdiqlənməmiş hesab: server 403 verify_email → forma bağlanır, qeyd (fokus onda) +
//     "məktubu yenidən göndər" + "Hesabıma keç"; yazılış olmur, ümumi xəta göstərilmir
//   • nümayəndə (mosque_rep): ehtiyac yerləşdir (mosqueId GÖNDƏRİLMİR), yazılanların adları yalnız burada
//   • axe, 360px daşma yoxdur
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
const bakuDay = (n = 0) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku' }).format(new Date(Date.now() + n * 86400000))

async function attach(page, st) {
  await page.route((u) => u.pathname.startsWith('/api/volunteers'), (route) => {
    const req = route.request()
    const p = new URL(req.url()).pathname
    const m = req.method()
    let body = null
    if (m !== 'GET') {
      body = req.postDataJSON?.() ?? null
      st.bodies.push({ m, path: p, body, xrw: req.headers()['x-requested-with'] })
      if (!req.headers()['x-requested-with']) return route.fulfill({ status: 403, json: { error: 'Forbidden', code: 'forbidden' } })
    }
    const pub = (n) => ({ id: n.id, mosqueId: n.mosqueId, mosqueName: n.mosqueName, title: n.title, description: n.description, date: n.date, time: n.time, slots: n.slots, filled: n.signups.length, archived: false })
    if (p === '/api/volunteers' && m === 'GET') return route.fulfill({ json: { items: st.needs.map((n) => ({ ...pub(n), ...(st.signedIn ? { signedUp: n.signups.some((s) => s.me) } : {}) })), mosques: [{ id: 'n100', name: 'Abu Bakr mosque', open: st.needs.length }] } })
    if (p === '/api/volunteers/mine') return route.fulfill({ json: { items: st.needs.filter((n) => n.signups.some((s) => s.me)).map((n) => ({ ...pub(n), myName: 'Ali', shareEmail: false, signedAt: 1 })) } })
    if (p === '/api/volunteers/manage') {
      if (!st.rep) return route.fulfill({ status: 403, json: { error: 'Forbidden', code: 'forbidden' } })
      return route.fulfill({ json: { mosqueId: 'n100', canPickMosque: false, today: bakuDay(), items: st.needs.map((n) => ({ ...pub(n), createdAt: 1, signups: n.signups.map((s) => ({ name: s.name, email: s.email || null, at: 1 })) })), limits: {} } })
    }
    if (p === '/api/volunteers' && m === 'POST') {
      const n = { id: 30 + st.needs.length, mosqueId: 'n100', ...body, signups: [] }
      st.needs.push(n)
      return route.fulfill({ status: 201, json: { item: { ...pub(n), signups: [] } } })
    }
    const mm = /^\/api\/volunteers\/(\d+)\/signup$/.exec(p)
    if (mm) {
      const n = st.needs.find((x) => x.id === Number(mm[1]))
      // server/volunteers.js: təsdiqlənməmiş e-poçtla yazılış → 403 { code: 'verify_email' }
      if (m === 'POST' && st.unverified) return route.fulfill({ status: 403, json: { error: 'verify_email', code: 'verify_email' } })
      if (m === 'POST') n.signups.push({ name: body.name, email: body.shareEmail ? 'user@example.com' : null, me: true })
      else n.signups = n.signups.filter((s) => !s.me)
      return route.fulfill({ json: { item: { ...pub(n), signedUp: m === 'POST' } } })
    }
    return route.fulfill({ status: 404, json: { error: 'Not found', code: 'not_found' } })
  })
}
const NEED = () => ({ id: 21, mosqueId: 'n100', mosqueName: 'Abu Bakr mosque', title: 'Iftar tables', description: 'Setting up tables', date: bakuDay(2), time: '17:00', slots: 5, signups: [{ name: 'Kamal' }, { name: 'Nigar', email: 'n@example.com' }] })

test('girişsiz: yalnız say, ad yoxdur; yazılmaq üçün giriş', async ({ page, consoleProblems }) => {
  const st = { bodies: [], needs: [NEED()], signedIn: false, rep: false }
  await attach(page, st)
  await page.goto('/en/volunteers')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mosque volunteers')
  await expect(page.getByTestId('vo-slots').first()).toHaveText('2 of 5 slots filled')
  await expect(page.locator('main')).not.toContainText('Kamal')
  await expect(page.getByTestId('vo-card').getByRole('link', { name: 'Sign up' })).toBeVisible()
  expect(await serious(page, ['main'])).toEqual([])
  expect(await noOverflow(page)).toBe(true)
  expectCleanConsole(consoleProblems)
})

test('girişli: yazıl (e-poçt yalnız razılıqla) → ləğv', async ({ page, consoleProblems }) => {
  await fakeUserSession(page, { signedIn: true, user: { emailVerified: true, displayName: 'Ali' } })
  await page.addInitScript(() => localStorage.setItem('mcc_logged_in', '1'))
  const st = { bodies: [], needs: [NEED()], signedIn: true, rep: false }
  await attach(page, st)
  await page.goto('/en/volunteers')
  await settle(page)
  await page.getByTestId('vo-signup').click()
  await expect(page.getByTestId('vo-name')).toHaveValue('Ali')
  await page.getByTestId('vo-share').check()
  await expect(page.getByTestId('vo-confirm')).toBeDisabled()
  await page.getByTestId('vo-consent').check()
  await page.getByTestId('vo-confirm').click()
  await expect(page.getByTestId('vo-signed')).toHaveText('You are signed up')
  await expect(page.getByTestId('vo-slots').first()).toHaveText('3 of 5 slots filled')
  const s = st.bodies.find((b) => b.path === '/api/volunteers/21/signup')
  expect(s).toMatchObject({ m: 'POST', xrw: 'fetch', body: { name: 'Ali', shareEmail: true, consent: true } })
  await expect(page.getByTestId('vo-mine')).toContainText('Iftar tables')
  await page.getByTestId('vo-cancel').click()
  await expect(page.getByTestId('vo-signup')).toBeVisible()
  expect(st.bodies.some((b) => b.m === 'DELETE' && b.path === '/api/volunteers/21/signup')).toBe(true)
  // Nümayəndə deyil — idarə bölməsi yoxdur
  await expect(page.getByTestId('vo-manage')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('e-poçt təsdiqlənməyib (403 verify_email): qeyd + məktubu yenidən göndər + hesab keçidi', async ({ page, consoleProblems }) => {
  const auth = await fakeUserSession(page, { signedIn: true, user: { emailVerified: false, displayName: 'Ali' } })
  await page.addInitScript(() => localStorage.setItem('mcc_logged_in', '1'))
  const st = { bodies: [], needs: [NEED()], signedIn: true, rep: false, unverified: true }
  await attach(page, st)
  await page.goto('/en/volunteers')
  await settle(page)
  await page.getByTestId('vo-signup').click()
  await page.getByTestId('vo-confirm').click()
  const note = page.getByTestId('vo-verify')
  await expect(note).toContainText('Confirm your email to use this.')
  // Forma bağlanıb, ümumi "alınmadı" xətası yoxdur; fokus qeyddədir (ekran oxuyucu oxuyur)
  await expect(page.getByTestId('vo-name')).toHaveCount(0)
  await expect(page.getByTestId('vo-msg')).toHaveCount(0)
  await expect(page.locator('.vo-verify')).toBeFocused()
  await expect(note.getByTestId('vo-verify-account')).toHaveAttribute('href', '/en/account')
  await note.getByTestId('vo-verify-resend').click()
  await expect(note).toContainText('Confirmation email sent. Check your inbox.')
  expect(auth.requests).toContain('POST /api/auth/verify/resend')
  // Yazılış olmadı — say dəyişmir
  await expect(page.getByTestId('vo-slots').first()).toHaveText('2 of 5 slots filled')
  expect(await serious(page, ['main'])).toEqual([])
  expect(await noOverflow(page)).toBe(true)
  expectCleanConsole(consoleProblems)
})

test('nümayəndə: ehtiyac yerləşdirir (mosqueId göndərilmir), yazılanların adlarını görür', async ({ page, consoleProblems }) => {
  await fakeUserSession(page, { signedIn: true, user: { emailVerified: true, role: 'mosque_rep', mosqueId: 'n100' } })
  await page.addInitScript(() => localStorage.setItem('mcc_logged_in', '1'))
  const st = { bodies: [], needs: [NEED()], signedIn: true, rep: true }
  await attach(page, st)
  await page.goto('/en/volunteers')
  await settle(page)
  const manage = page.getByTestId('vo-manage')
  await expect(manage).toBeVisible()
  await manage.locator('summary').first().click()
  await expect(manage.getByTestId('vo-signups').first()).toContainText('Kamal')
  await expect(manage.getByTestId('vo-signups').first()).toContainText('n@example.com')
  await page.getByTestId('vo-f-mosque').fill('Abu Bakr mosque')
  await page.getByTestId('vo-f-title').fill('Cleaning after Jumuah')
  await page.getByTestId('vo-f-date').fill(bakuDay(3))
  await page.getByTestId('vo-f-slots').fill('4')
  await page.getByTestId('vo-post').click()
  await expect(page.getByTestId('vo-form-msg')).toHaveText('Posted.')
  const post = st.bodies.find((b) => b.m === 'POST' && b.path === '/api/volunteers')
  expect(post.xrw).toBe('fetch')
  expect(post.body).toMatchObject({ title: 'Cleaning after Jumuah', mosqueName: 'Abu Bakr mosque', date: bakuDay(3), slots: 4 })
  expect(post.body).not.toHaveProperty('mosqueId')
  await expect(page.getByTestId('vo-manage-item')).toHaveCount(2)
  expect(await serious(page, ['main'])).toEqual([])
  expectCleanConsole(consoleProblems)
})
