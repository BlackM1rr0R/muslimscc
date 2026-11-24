// ═══════════════════════════════════════════════════════
// /prayer-rooms — namaz otaqları (server/prayerRooms.js; burada server yoxdur — /api saxtası)
//   • girişsiz: siyahı, növ süzgəci serverə ?type= ilə gedir, "yaxınımdakılar" (geolocation saxtası) —
//     radar + məsafə + sıralama, yer serverə GÖNDƏRİLMİR; forma əvəzinə giriş düyməsi; təklif edənin adı yoxdur
//   • girişli: "hazırkı yerimi götür" → koordinat; göndər (X-Requested-With, rəqəm lat/lng) → "Under review"
//   • şikayət: növ + qeyd → /report
//   • ərəbcə RTL, 360px-də üfüqi daşma yoxdur, axe ciddi pozuntu yoxdur
//   • admin paneli (editor): təsdiq / rədd (səbəblə); müəllifin e-poçtu göstərilmir
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'
import { fakeUserSession } from './userAuth.js'
import { fakeAdminSession, ADMIN_PANEL } from './adminAuth.js'

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)

const ROOMS = [
  { id: 1, name: 'Mall prayer room', type: 'mall', city: 'Baku', address: 'Ganjlik Mall', lat: 40.4005, lng: 49.8523, floor: '-1', notes: 'Next to the food court', wudu: true, women: true, updatedAt: 1 },
  { id: 2, name: 'Airport prayer room', type: 'airport', city: 'Baku', address: 'Terminal 1', lat: 40.4675, lng: 50.0467, floor: '2', notes: '', wudu: false, women: false, updatedAt: 1 },
]

async function attach(page, st) {
  await page.route((u) => u.pathname.startsWith('/api/prayer-rooms'), (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const p = url.pathname
    const m = req.method()
    st.calls.push(`${m} ${p}${url.search}`)
    if (m !== 'GET') {
      st.bodies.push({ path: p, body: req.postDataJSON?.() ?? null, xrw: req.headers()['x-requested-with'] })
      if (!req.headers()['x-requested-with']) return route.fulfill({ status: 403, json: { error: 'Forbidden', code: 'forbidden' } })
    }
    if (p === '/api/prayer-rooms' && m === 'GET') {
      const type = url.searchParams.get('type')
      return route.fulfill({ json: { items: ROOMS.filter((r) => !type || r.type === type), cities: [{ name: 'Baku', n: 2 }], types: [] } })
    }
    if (p === '/api/prayer-rooms/mine') return route.fulfill({ json: { items: st.mine, today: st.mine.length, limits: {} } })
    if (p === '/api/prayer-rooms' && m === 'POST') {
      const b = req.postDataJSON()
      const item = { id: 50, ...b, status: 'pending', reason: null, createdAt: Date.now(), updatedAt: Date.now() }
      st.mine.unshift(item)
      return route.fulfill({ status: 201, json: { item } })
    }
    if (/\/report$/.test(p)) return route.fulfill({ status: 202, json: { ok: true } })
    return route.fulfill({ status: 404, json: { error: 'Not found', code: 'not_found' } })
  })
}

test.describe('namaz otaqları (geolocation saxtası)', () => {
  // Bakı, Gənclik metrosu yanında — ticarət mərkəzinə yaxın, hava limanına ~17 km
  test.use({ geolocation: { latitude: 40.4010, longitude: 49.8530 }, permissions: ['geolocation'] })

  test('girişsiz: siyahı, növ süzgəci, yaxınımdakılar (yer serverə getmir), giriş düyməsi', async ({ page, consoleProblems }) => {
    const st = { calls: [], bodies: [], mine: [] }
    await attach(page, st)
    await page.goto('/en/prayer-rooms')
    await settle(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Prayer rooms')
    await expect(page.getByTestId('pr-card')).toHaveCount(2)
    await expect(page.getByTestId('pr-list')).toContainText('Wudu area available')
    await expect(page.getByTestId('pr-form-section').getByRole('link', { name: 'Sign in' })).toBeVisible()

    await page.getByTestId('pr-type-airport').click()
    await expect(page.getByTestId('pr-card')).toHaveCount(1)
    expect(st.calls.some((c) => c === 'GET /api/prayer-rooms?type=airport')).toBe(true)
    await page.getByRole('search').getByRole('button', { name: 'All', exact: true }).click()
    await expect(page.getByTestId('pr-card')).toHaveCount(2)

    const before = st.calls.length
    await page.getByTestId('pr-near').click()
    await expect(page.getByTestId('pr-radar')).toBeVisible()
    await expect(page.getByTestId('pr-card').first()).toContainText('Mall prayer room')
    await expect(page.getByTestId('pr-distance').first()).toContainText('m from you')
    // Yerin koordinatı heç bir sorğuda yoxdur
    expect(st.calls.slice(before).some((c) => /40\.40|49\.85|lat=|lng=/.test(c))).toBe(false)
    expect(await serious(page, ['main'])).toEqual([])
    expect(await noOverflow(page)).toBe(true)
    expectCleanConsole(consoleProblems)
  })

  test('girişli: hazırkı yer → göndər → "Under review"; şikayət', async ({ page, consoleProblems }) => {
    await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
    await page.addInitScript(() => localStorage.setItem('mcc_logged_in', '1'))
    const st = { calls: [], bodies: [], mine: [] }
    await attach(page, st)
    await page.goto('/en/prayer-rooms')
    await settle(page)
    const form = page.getByTestId('pr-form')
    await expect(form).toBeVisible()
    await expect(page.getByTestId('pr-submit')).toBeDisabled()
    await page.getByTestId('pr-name').fill('University prayer room')
    await page.getByTestId('pr-form-type').selectOption('university')
    await page.getByTestId('pr-form-city').fill('Baku')
    await page.getByTestId('pr-use-loc').click()
    await expect(page.getByTestId('pr-lat')).toHaveValue('40.40100')
    await expect(page.getByTestId('pr-lng')).toHaveValue('49.85300')
    await page.getByTestId('pr-wudu').check()
    await page.getByTestId('pr-submit').click()
    await expect(page.getByTestId('pr-msg')).toContainText('It will appear in the list after a moderator checks it')
    const sent = st.bodies.find((b) => b.path === '/api/prayer-rooms')
    expect(sent.xrw).toBe('fetch')
    expect(sent.body).toMatchObject({ name: 'University prayer room', type: 'university', city: 'Baku', lat: 40.401, lng: 49.853, wudu: true, women: false })
    await expect(page.getByTestId('pr-mine-status').first()).toHaveText('Under review')

    await page.getByTestId('pr-report').first().click()
    await page.getByTestId('pr-report-kind').selectOption('closed')
    await page.getByTestId('pr-report-send').click()
    await expect(page.getByText('Thank you, a moderator will check it.')).toBeVisible()
    expect(st.bodies.find((b) => /\/report$/.test(b.path)).body).toEqual({ kind: 'closed', note: '' })
    expectCleanConsole(consoleProblems)
  })
})

test('ərəbcə: RTL, başlıq, boş siyahı', async ({ page, consoleProblems }) => {
  await page.goto('/ar/prayer-rooms')
  await settle(page)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('مصليات')
  await expect(page.getByTestId('pr-empty')).toBeVisible()
  expect(await noOverflow(page)).toBe(true)
  expectCleanConsole(consoleProblems)
})

test('admin paneli: icma lövhələri — namaz otağını təsdiqlə / rədd et (səbəblə); e-poçt göstərilmir', async ({ page, consoleProblems }) => {
  await fakeAdminSession(page, 'site', { role: 'editor' })
  const queue = [
    { ...ROOMS[0], id: 11, status: 'pending', reason: null, createdAt: 1, reported: 0, decidedAt: null, reports: [], email: 'author@example.com' },
    { ...ROOMS[1], id: 12, status: 'pending', reason: null, createdAt: 2, reported: 0, decidedAt: null, reports: [] },
  ]
  const posts = []
  await page.route((u) => /^\/api\/admin\/(prayer-rooms|janaza|volunteers)(\/\d+)?$/.test(u.pathname), (route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (req.method() !== 'GET') {
      if (!req.headers()['x-requested-with']) return route.fulfill({ status: 403, json: { error: 'Forbidden' } })
      const id = Number(url.pathname.split('/').pop())
      posts.push({ id, ...(req.postDataJSON() || {}) })
      const i = queue.findIndex((x) => x.id === id)
      if (i >= 0) queue.splice(i, 1)
      return route.fulfill({ json: { ok: true, counts: {} } })
    }
    if (url.pathname === '/api/admin/prayer-rooms') {
      const items = url.searchParams.get('status') === 'pending' ? queue : []
      return route.fulfill({ json: { items, status: url.searchParams.get('status'), page: 1, counts: { pending: queue.length, approved: 0, rejected: 0, flagged: 0 }, reasons: ['not_found', 'duplicate', 'is_mosque', 'incomplete', 'inappropriate', 'other'] } })
    }
    if (url.pathname === '/api/admin/janaza') return route.fulfill({ json: { items: [], status: 'pending', page: 1, counts: { pending: 0, approved: 0, rejected: 0, flagged: 0 }, reasons: ['other'] } })
    return route.fulfill({ json: { items: [] } })
  })
  await page.goto(ADMIN_PANEL)
  await expect(page.getByRole('heading', { level: 1, name: 'İdarə paneli' })).toBeVisible()
  const toggle = page.locator('.admin-menu-toggle')
  if (await toggle.isVisible()) await toggle.click()
  await page.getByRole('button', { name: 'İcma lövhələri' }).click()
  const box = page.getByTestId('admin-boards')
  await expect(box.getByTestId('cbm-rooms-item')).toHaveCount(2)
  await expect(box).not.toContainText('author@example.com')
  await box.getByTestId('cbm-rooms-approve').first().click()
  await expect(box.getByTestId('cbm-rooms-item')).toHaveCount(1)
  await box.locator('select').first().selectOption('is_mosque')
  await box.getByTestId('cbm-rooms-reject').first().click()
  await expect(box.getByTestId('cbm-rooms-item')).toHaveCount(0)
  expect(posts).toEqual([{ id: 11, action: 'approve' }, { id: 12, action: 'reject', reason: 'is_mosque' }])
  await box.getByTestId('cbm-tab-janaza').click()
  await expect(box.getByTestId('cbm-janaza-pending')).toHaveAttribute('aria-pressed', 'true')
  expect(await serious(page, ['[data-testid="admin-boards"]'])).toEqual([])
  expectCleanConsole(consoleProblems.filter((x) => !/\/api\/admin\//.test(x)))
})
