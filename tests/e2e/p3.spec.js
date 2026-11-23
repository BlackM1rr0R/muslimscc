// ═══════════════════════════════════════════════════════
// P3: gizli dua dostu (/secret-dua-friend), Həcc ailə izləyicisi (/hajj-tracker), qəbir ziyarəti xəritəsi (/grave-visits).
//   • dua dostu: girişsiz — giriş kartı; girişli — razılıqsız qoşulmaq olmur, qoşulma gövdəsi (consent, dil, qurşaq),
//     cütlənib — "dua etdim" bir dəfə; gələn qutusu "Someone made dua for you today" + /seen; kimlik yoxdur
//   • Həcc: gizli keçid (#h=…) girişsiz baxış — mərhələ + Hisn duası (mənbə ilə); fasilə; etibarsız keçid → mesaj;
//     zəvvar — mərhələyə toxunma PUT /stage; yer sahəsi göndərilmir
//   • qəbirlər: əlavə et (əl ilə koordinat) → grave_visits_v1; yaxınlıq (geolocation saxtası) → Hisn fəsil 61
//   • axe (ciddi pozuntu yoxdur), ərəbcə RTL, 360px-də üfüqi daşma yoxdur
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
const TOKEN = 'h'.repeat(43)

// ── 1. Gizli dua dostu ──
test('dua dostu: girişsiz — giriş kartı', async ({ page, consoleProblems }) => {
  await page.goto('/en/secret-dua-friend')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Secret dua friend')
  await expect(page.getByTestId('df-signin')).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('dua dostu: razılıq, qoşulma, gündə bir dua, gələn qutusu; kimlik göstərilmir', async ({ page, consoleProblems }) => {
  await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
  await page.addInitScript(() => localStorage.setItem('mcc_logged_in', '1'))
  const st = { joined: false, pair: null, inbox: [], prayed: false }
  const bodies = []
  await page.route((u) => u.pathname.startsWith('/api/dua-friend'), (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    if (req.method() !== 'GET') bodies.push({ path: pathname, body: req.postDataJSON?.() ?? null, xrw: req.headers()['x-requested-with'] })
    if (pathname === '/api/dua-friend/join') { st.joined = true; return route.fulfill({ json: { ok: true } }) }
    if (pathname === '/api/dua-friend/pray') { st.prayed = true; return route.fulfill({ json: { ok: true, already: false } }) }
    if (pathname === '/api/dua-friend/seen') { st.inbox = []; return route.fulfill({ json: { ok: true } }) }
    const pair = st.joined ? { startedAt: Date.now() - 86400000, endsAt: Date.now() + 29 * 86400000, prayedToday: st.prayed, forMeToday: true } : null
    if (st.joined && !st.prayed) st.inbox = [{ day: new Date().toISOString().slice(0, 10) }]
    return route.fulfill({ json: { joined: st.joined, verified: true, pair, inbox: st.inbox, roundDays: 30 } })
  })
  await page.goto('/en/secret-dua-friend')
  await settle(page)
  await page.getByTestId('df-join').click()
  await expect(page.getByRole('alert')).toHaveText('Please confirm your consent first.')
  await page.getByTestId('df-consent').check()
  await page.getByTestId('df-join').click()
  await expect(page.getByTestId('df-pray')).toBeVisible()
  const join = bodies.find((b) => b.path === '/api/dua-friend/join')
  expect(join.xrw).toBe('fetch')
  expect(join.body).toMatchObject({ consent: true, lang: 'en' })
  expect(typeof join.body.tz).toBe('string')
  await expect(page.getByTestId('df-inbox')).toContainText('Someone made dua for you today')
  await expect(page.getByText('29 days left in this round', { exact: false })).toBeVisible()
  await page.getByTestId('df-pray').click()
  await expect(page.getByTestId('df-prayed')).toBeVisible()
  await expect(page.getByTestId('df-pray')).toHaveCount(0)
  expect(bodies.some((b) => b.path === '/api/dua-friend/seen')).toBe(true)
  expect(await serious(page, ['main'])).toEqual([])
  expectCleanConsole(consoleProblems)
})

// ── 2. Həcc ailə izləyicisi ──
test('Həcc: gizli keçid — mərhələ və Hisn duası (mənbə), ETag ilə polling, fasilə', async ({ page, consoleProblems }) => {
  let n = 0
  let paused = false
  await page.route((u) => u.pathname === '/api/hajj-journey/view', (route) => {
    const req = route.request()
    n++
    expect(req.postDataJSON()).toEqual({ token: TOKEN })
    const journey = paused ? { kind: 'hajj', name: 'Dad', paused: true, expiresAt: Date.now() + 86400000 }
      : { kind: 'hajj', name: 'Dad', paused: false, stage: 'arafah', stageAt: Date.now() - 60000, history: [{ s: 'ihram', at: 1 }, { s: 'arafah', at: 2 }], expiresAt: Date.now() + 86400000 }
    return route.fulfill({ json: { journey }, headers: { ETag: `W/"hl1-${n}"` } })
  })
  await page.goto(`/en/hajj-tracker#h=${TOKEN}`)
  await settle(page)
  const view = page.getByTestId('ht-link-view')
  await expect(view).toContainText('Dad')
  await expect(view).toContainText('Day of Arafah')
  await expect(page.getByTestId('ht-hisn').locator('.p3-hisn__ar').first()).toHaveAttribute('dir', 'rtl')
  await expect(page.getByTestId('ht-hisn').locator('.p3-hisn__src').first()).not.toBeEmpty()
  await expect(page.locator('[aria-current="step"]')).toHaveText('Day of Arafah')
  expect(await serious(page, ['main'])).toEqual([])
  paused = true
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(page.getByTestId('ht-paused')).toBeVisible()
  await expect(view).not.toContainText('Day of Arafah')
  expectCleanConsole(consoleProblems)
})

test('Həcc: etibarsız keçid → aydın mesaj', async ({ page, consoleProblems }) => {
  await page.goto(`/en/hajj-tracker#h=${TOKEN}`)
  await settle(page)
  await expect(page.getByTestId('ht-link-error')).toHaveText('This link is no longer valid (it was revoked or has expired).')
  expectCleanConsole(consoleProblems)
})

test('Həcc: zəvvar mərhələyə toxunur — yalnız { stage } göndərilir; Hisnda dua yoxdursa deyilir', async ({ page, consoleProblems }) => {
  await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
  await page.addInitScript(() => localStorage.setItem('mcc_logged_in', '1'))
  let journey = { kind: 'hajj', name: '', stage: null, stageAt: null, history: [], family: false, paused: false, link: false, createdAt: 1, expiresAt: Date.now() + 20 * 86400000 }
  const stageBodies = []
  await page.route((u) => u.pathname.startsWith('/api/hajj-journey'), (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    if (pathname === '/api/hajj-journey/family') return route.fulfill({ json: { inCircle: false, journeys: [] } })
    if (pathname === '/api/hajj-journey/stage') {
      const b = req.postDataJSON()
      stageBodies.push(b)
      journey = { ...journey, stage: b.stage, stageAt: Date.now(), history: [...journey.history, { s: b.stage, at: Date.now() }] }
      return route.fulfill({ json: { journey } })
    }
    return route.fulfill({ json: { journey, stages: {}, inCircle: false } })
  })
  await page.goto('/en/hajj-tracker')
  await settle(page)
  await page.getByTestId('ht-stage-arrive_makkah').click()
  await expect(page.getByTestId('ht-stage-arrive_makkah')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('ht-nodua')).toContainText('Hisn al-Muslim has no specific dua for this stage.')
  await page.getByTestId('ht-stage-ihram').click()
  await expect(page.getByTestId('ht-hisn')).toBeVisible()
  expect(stageBodies).toEqual([{ stage: 'arrive_makkah' }, { stage: 'ihram' }])
  expectCleanConsole(consoleProblems)
})

// ── 3. Qəbir ziyarəti xəritəsi ──
test.describe('qəbirlər (geolocation saxtası)', () => {
  test.use({ geolocation: { latitude: 40.4093, longitude: 49.8671 }, permissions: ['geolocation'] })

  test('əlavə et → grave_visits_v1; yaxınlıqda Hisn 61 duası; heç bir /api sorğusu yoxdur', async ({ page, consoleProblems }) => {
    const api = []
    page.on('request', (r) => { if (new URL(r.url()).pathname.startsWith('/api/')) api.push(r.url()) })
    await page.goto('/en/grave-visits')
    await settle(page)
    await expect(page.getByTestId('gv-empty')).toBeVisible()
    await page.getByTestId('gv-add').click()
    await page.getByLabel('Whose grave').fill('Grandmother')
    await page.getByLabel('Coordinates (latitude, longitude)').fill('40.4094, 49.8672')
    await page.getByTestId('gv-save').click()
    await expect(page.getByTestId('gv-item')).toHaveCount(1)
    const v = await page.evaluate(() => JSON.parse(localStorage.getItem('grave_visits_v1') || 'null'))
    expect(v.l[0]).toMatchObject({ n: 'Grandmother', la: 40.4094, lo: 49.8672 })
    await page.getByTestId('gv-check').click()
    await expect(page.getByTestId('gv-near')).toContainText('You are near the grave of Grandmother')
    await expect(page.getByTestId('gv-dua').locator('.p3-hisn__src').first()).toContainText('Muslim')
    // /api/content/announcements — saytın ümumi elan bildirişi (App → AnnouncementToast, boş vaxtda yüklənir), bu səhifənin sorğusu deyil
    expect(api.filter((u) => !/\/api\/(a|client-error|csp-report|content\/announcements)\b/.test(u))).toEqual([])
    expect(await serious(page, ['main'])).toEqual([])
    expectCleanConsole(consoleProblems)
  })

  test('ərəbcə RTL və 360px: üfüqi daşma yoxdur', async ({ page, consoleProblems }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.addInitScript(() => localStorage.setItem('grave_visits_v1', JSON.stringify({ v: 1, l: [{ id: 'gabc123', n: 'جدتي', la: 40.4094, lo: 49.8672, u: 1 }] })))
    await page.goto('/ar/grave-visits')
    await settle(page)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByTestId('gv-item')).toHaveCount(1)
    expect(await noOverflow(page)).toBe(true)
    await page.goto('/ar/hajj-tracker')
    await settle(page)
    expect(await noOverflow(page)).toBe(true)
    expectCleanConsole(consoleProblems)
  })
})
