// ═══════════════════════════════════════════════════════
// K mərhələsi — UI axınları (server yoxdur: aşağıdakı yaddaş saxtası, server/*.js-in cavab formaları ilə):
//   • açıq profil: aç → ləqəb + razılıq → saxla → /u/<ləqəb> görünür; naməlum ləqəb → 404 səhifəsi
//   • ailə dua siyahısı: istək yaz → siyahıda; başqasının istəyinə "Sizin üçün dua etdim" → say
//   • dua divarı: göndər → "Baxılır" → admin paneli (moderasiya) təsdiqləyir → divarda → "Dua etdim"
//   • məscid nümayəndəsi: iqamə qaydası saxla → /mosque-tv?m=<id> qoşulu rejim: ad, iqamə, elan
//   • həftəlik hesabat: razılıqla aç → prefs + həftənin rəqəmləri göndərilir
//   • /en: azərbaycanca yazı yoxdur; axe (işıqlı/qaranlıq), admin bölməsi daxil
//   • açıq profildə ibadət sayı / ibadət möhürü yoxdur (sahibin qərarı); 403 verify_email və 409 moderated qeydləri
//   • boş divar — mərkəzdə kart + düymə; iki sütunun yuxarısı eyni xətdə
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, expectCleanConsole, settle } from './fixtures.js'
import { fakeUserSession, setLoginHint } from './userAuth.js'
import { fakeAdminSession, adminSignIn } from './adminAuth.js'

/** Yaddaşda K serveri — bir testin bütün səhifələri arasında ortaq */
function createK() {
  return {
    profile: null, bodies: [],
    duas: [{ id: 1, author: 'Ana', self: false, body: 'Atam üçün şəfa duası edin', answered: false, answeredAt: null, createdAt: Date.UTC(2026, 10, 17), prayed: 0, prayedByMe: false }],
    wall: [], mine: [], nextId: 100,
    mosque: { info: null, announcements: [] },
    weekly: { prefs: null, stats: [] },
  }
}

async function attachK(page, S, { owner = true } = {}) {
  const json = (route, body, status = 200) => route.fulfill({ status, json: body })
  await page.route((u) => /^\/api\/(profile|u|dua-wall|mosque-rep|mosques|weekly|family|admin\/(dua-wall|moderation|mosques))(\/|$)/.test(u.pathname), async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const p = url.pathname
    const m = req.method()
    let b = {}
    try { b = req.postDataJSON() || {} } catch { /* */ }
    S.bodies.push(`${m} ${p}`)
    if (m !== 'GET' && !req.headers()['x-requested-with']) return json(route, { error: 'Forbidden', code: 'forbidden' }, 403)

    // ── Ailə dairəsi (yalnız bu test üçün sadə dairə) ──
    if (p === '/api/family' && m === 'GET') {
      return json(route, { circle: { id: 1, role: owner ? 'owner' : 'member', max: 8, invites: [], members: [
        { id: 12, label: 'Əli', role: 'owner', joinedAt: 1, self: true, share: null },
        { id: 13, label: 'Ana', role: 'member', joinedAt: 2, self: false, share: null },
      ] }, cards: [], share: null, consent: false, limits: {} })
    }
    if (p === '/api/family/duas' && m === 'GET') return json(route, { owner, duas: S.duas, limits: { body: 300, perDay: 10 } })
    if (p === '/api/family/duas' && m === 'POST') {
      const d = { id: S.nextId++, author: 'Əli', self: true, body: b.body, answered: false, answeredAt: null, createdAt: Date.now(), prayed: 0, prayedByMe: false }
      S.duas.unshift(d)
      return json(route, { dua: d }, 201)
    }
    let mm = /^\/api\/family\/duas\/(\d+)\/pray$/.exec(p)
    if (mm) { const d = S.duas.find((x) => x.id === Number(mm[1])); d.prayed++; d.prayedByMe = true; return json(route, { prayed: d.prayed, prayedByMe: true }) }
    if (p.startsWith('/api/family')) return json(route, { error: 'unauthenticated', code: 'unauthenticated' }, 401)

    // ── Açıq profil ──
    if (p === '/api/profile/public' && m === 'GET') return json(route, { profile: S.profile, limits: {} })
    if (p === '/api/profile/public' && m === 'PUT') {
      if (S.profileError) return json(route, { error: S.profileError.code, code: S.profileError.code }, S.profileError.status)
      if (!S.profile && b.consent !== true) return json(route, { error: 'Consent required', code: 'consent_required' }, 400)
      S.profile = { handle: b.handle, enabled: b.enabled, allowIndex: Boolean(b.allowIndex), fields: b.fields, data: b.data, consentAt: 1, moderatedAt: null, updatedAt: 2 }
      return json(route, { profile: S.profile })
    }
    if (p === '/api/profile/handle') return json(route, { available: url.searchParams.get('h') !== 'taken_one' })
    mm = /^\/api\/u\/([a-z0-9_]+)$/.exec(p)
    if (mm) {
      if (!S.profile || !S.profile.enabled || S.profile.handle !== mm[1]) return json(route, { error: 'Not found', code: 'not_found' }, 404)
      return json(route, { handle: S.profile.handle, fields: S.profile.fields, data: S.profile.data, allowIndex: S.profile.allowIndex })
    }

    // ── Dua divarı ──
    if (p === '/api/dua-wall' && m === 'GET') return json(route, { items: S.wall.filter((x) => x.status === 'approved').map(({ id, body, name, lang, prayed, at }) => ({ id, body, name, lang, prayed, at })), next: null })
    if (p === '/api/dua-wall' && m === 'POST') {
      if (S.unverified) return json(route, { error: 'verify_email', code: 'verify_email' }, 403)
      const it = { id: S.nextId++, body: b.body, name: b.name || '', lang: b.lang, status: 'pending', reason: null, prayed: 0, createdAt: Date.now(), at: Date.now(), reported: 0, reports: [] }
      S.wall.push(it)
      return json(route, { item: it }, 201)
    }
    if (p === '/api/dua-wall/mine') return json(route, { items: S.wall.map((x) => ({ ...x })), today: S.wall.length, limits: { perDay: 3 } })
    if (/^\/api\/dua-wall\/\d+\/report$/.test(p)) return S.unverified ? json(route, { error: 'verify_email', code: 'verify_email' }, 403) : json(route, { ok: true })
    mm = /^\/api\/dua-wall\/(\d+)\/pray$/.exec(p)
    if (mm) { const it = S.wall.find((x) => x.id === Number(mm[1])); it.prayed++; return json(route, { prayed: it.prayed, already: false }) }
    if (p === '/api/admin/dua-wall' && m === 'GET') {
      const st = url.searchParams.get('status') || 'pending'
      return json(route, { items: S.wall.filter((x) => x.status === st), counts: { pending: S.wall.filter((x) => x.status === 'pending').length }, page: 1, reasons: ['personal_info', 'not_dua', 'inappropriate', 'duplicate', 'commercial', 'other'] })
    }
    mm = /^\/api\/admin\/dua-wall\/(\d+)$/.exec(p)
    if (mm) {
      const it = S.wall.find((x) => x.id === Number(mm[1]))
      if (b.action === 'approve') { it.status = 'approved'; it.at = Date.now() }
      if (b.action === 'reject') { it.status = 'rejected'; it.reason = b.reason }
      return json(route, { ok: true, counts: {} })
    }
    if (p === '/api/admin/dua-wall/banned') return json(route, { words: ['casino'] })
    if (p === '/api/admin/moderation/profiles') return json(route, { items: [] })
    if (p === '/api/admin/mosques') return json(route, { items: [] })

    // ── Məscid nümayəndəsi ──
    if (p === '/api/mosque-rep' && m === 'GET') return json(route, { mosqueId: 'n123', info: S.mosque.info, announcements: S.mosque.announcements, today: '2026-11-18', limits: {} })
    if (p === '/api/mosque-rep' && m === 'PUT') {
      S.mosque.info = { name: b.name, iqama: b.iqama, jumuah: b.jumuah, ramadanNote: b.ramadanNote, updatedAt: Date.now(), version: 2 }
      return json(route, { info: S.mosque.info })
    }
    if (p === '/api/mosque-rep/announcements' && m === 'POST') {
      const a = { id: S.nextId++, body: b.body, expiresOn: b.expiresOn, createdAt: Date.now() }
      S.mosque.announcements.unshift(a)
      return json(route, { announcement: a }, 201)
    }
    if (p === '/api/mosques/n123/live') {
      if (!S.mosque.info) return json(route, { error: 'Not found', code: 'not_found' }, 404)
      return json(route, { mosqueId: 'n123', verified: true, ...S.mosque.info, announcements: S.mosque.announcements })
    }
    if (p === '/api/mosques/verified') return json(route, { mosques: {} })

    // ── Həftəlik hesabat ──
    if (p === '/api/weekly' && m === 'GET') return json(route, { prefs: S.weekly.prefs, emailVerified: true, stats: S.weekly.stats, nextReport: S.weekly.prefs?.enabled ? '2026-11-20' : null })
    if (p === '/api/weekly/prefs') {
      if (!S.weekly.prefs && b.consent !== true) return json(route, { error: 'Consent required', code: 'consent_required' }, 400)
      S.weekly.prefs = { enabled: b.enabled, weekday: b.weekday, tz: b.tz, lang: b.lang, consentAt: 1 }
      return json(route, { prefs: S.weekly.prefs, nextReport: '2026-11-20' })
    }
    if (p === '/api/weekly/stats') { S.weekly.stats.unshift({ ...b, updatedAt: Date.now() }); return json(route, { ok: true }) }
    return json(route, { error: 'Not found', code: 'not_found' }, 404)
  })
}

/** Admin panelində "Dua divarına nəzarət" (telefonda menyu əvvəlcə açılır) */
async function openModeration(page) {
  // Panel çəkilənə qədər gözlə — yoxsa mobildə menyu düyməsi hələ yoxdur və açılmır
  await expect(page.getByRole('heading', { level: 1, name: 'İdarə paneli' })).toBeVisible()
  const toggle = page.locator('.admin-menu-toggle')
  if (await toggle.isVisible()) await toggle.click()
  await page.getByRole('button', { name: 'Dua divarına nəzarət' }).click()
}
// Admin panelinin icmal bölməsi (girişdən əvvəl /me → 401, saxtası olmayan analitika) — bu testin mövzusu deyil
const notAdminNoise = (list) => list.filter((x) => !/\/api\/admin\//.test(x))

const signedIn = async (page, user = {}) => {
  await fakeUserSession(page, { signedIn: true, user: { displayName: 'Əli', emailVerified: true, ...user } })
  await setLoginHint(page)
}

test('açıq profil: susmaya görə bağlı → aç, ləqəb, razılıq → /u/<ləqəb>; naməlum → 404', async ({ page, consoleProblems }) => {
  const S = createK()
  await signedIn(page)
  await attachK(page, S)
  await page.goto('/account')
  const sec = page.getByTestId('public-profile-section')
  await expect(sec.getByRole('heading', { name: 'Açıq profil' })).toBeVisible()
  await expect(sec.getByTestId('pp-handle')).toHaveCount(0)   // bağlıdır
  await sec.getByTestId('pp-enabled').check()
  await sec.getByTestId('pp-handle').fill('Ali_K')
  await expect(sec.getByTestId('pp-handle')).toHaveValue('ali_k')
  await sec.getByTestId('pp-field-bio').check()
  await sec.getByTestId('pp-bio').fill('Quran tələbəsi')
  await sec.getByTestId('pp-save').click()
  await expect(sec.getByTestId('pp-msg')).toContainText('razılıq')
  await sec.getByTestId('pp-consent').check()
  await sec.getByTestId('pp-save').click()
  await expect(sec.getByTestId('pp-msg')).toContainText('Yadda saxlanıldı')
  expect(S.profile).toMatchObject({ handle: 'ali_k', enabled: true, fields: ['displayName', 'bio'], data: { displayName: 'Əli', bio: 'Quran tələbəsi' } })
  await expect(sec.getByTestId('pp-view')).toHaveAttribute('href', /\/u\/ali_k$/)

  await page.goto('/u/ali_k')
  const card = page.getByTestId('public-profile')
  await expect(card.getByRole('heading', { level: 1, name: 'Əli' })).toBeVisible()
  await expect(card.getByTestId('public-bio')).toHaveText('Quran tələbəsi')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await page.goto('/u/yoxdur_bele')
  await expect(page.locator('#nf-title')).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('açıq profil: icazə varsa index + canonical /u/<ləqəb> + başlıq; icazə yoxdursa / naməlum — noindex', async ({ page, consoleProblems }) => {
  const S = createK()
  S.profile = { handle: 'ali_k', enabled: true, allowIndex: true, fields: ['displayName', 'bio'], data: { displayName: 'Əli', bio: 'Quran tələbəsi' }, consentAt: 1, moderatedAt: null, updatedAt: 2 }
  await attachK(page, S)
  const robots = page.locator('meta[name="robots"]')
  const canonical = page.locator('link[rel="canonical"]')

  for (const path of ['/u/ali_k', '/en/u/ali_k']) {
    await page.goto(path)
    await expect(page.getByTestId('public-profile').getByRole('heading', { level: 1, name: 'Əli' })).toBeVisible()
    await expect(robots).toHaveAttribute('content', /^index, follow/)
    await expect(canonical).toHaveAttribute('href', 'https://muslims.cc/u/ali_k')
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0)
    await expect(page).toHaveTitle(/^Əli — /)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'Əli: Quran tələbəsi')
  }

  // Sahibi icazəni geri alıb — eyni ünvan noindex, canonical yoxdur
  S.profile = { ...S.profile, allowIndex: false }
  await page.goto('/u/ali_k')
  await expect(page.getByTestId('public-profile')).toBeVisible()
  await expect(robots).toHaveAttribute('content', /noindex/)
  await expect(canonical).toHaveCount(0)

  // Naməlum ləqəb — 404 səhifəsi, noindex
  await page.goto('/u/yoxdur_bele')
  await expect(page.locator('#nf-title')).toBeVisible()
  await expect(robots).toHaveAttribute('content', /noindex/)
  await expect(canonical).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('ailə dua siyahısı: istək yaz; başqasının istəyinə "dua etdim" — yalnız say', async ({ page, consoleProblems }) => {
  const S = createK()
  await signedIn(page)
  await attachK(page, S)
  await page.goto('/account')
  const box = page.getByTestId('family-duas')
  await expect(box.locator('.rt-card__title')).toHaveText('Ailə dua siyahısı')
  await box.getByTestId('family-dua-text').fill('Sabahkı imtahanım üçün dua edin')
  await box.getByTestId('family-dua-post').click()
  await expect(box.getByTestId('family-dua-list').locator('li').first()).toContainText('Sabahkı imtahanım üçün dua edin')
  const other = box.getByTestId('family-dua-list').locator('li', { hasText: 'Atam üçün' })
  await other.getByTestId('family-dua-pray').click()
  await expect(other.getByTestId('family-dua-count')).toHaveText('1 nəfər dua etdi')
  await expect(other.getByTestId('family-dua-pray')).toBeDisabled()
  expectCleanConsole(consoleProblems)
})

test('dua divarı: göndər → baxılır → admin təsdiqləyir → divarda → "Dua etdim"', async ({ page, consoleProblems }) => {
  const S = createK()
  await signedIn(page)
  await fakeAdminSession(page, 'admin')
  await attachK(page, S)
  await page.goto('/dua-wall')
  await expect(page.getByRole('heading', { level: 1, name: 'Dua divarı' })).toBeVisible()
  const empty = page.getByTestId('dw-empty')
  await expect(empty).toContainText('Divar hələ boşdur')
  await expect(empty.getByTestId('dw-empty-cta')).toHaveText(/İstək yaz/)
  await empty.getByTestId('dw-empty-cta').click()
  await expect(page.getByTestId('dw-body')).toBeFocused()
  await page.getByTestId('dw-body').fill('Anam üçün şəfa duası edin, xahiş edirəm')
  await page.getByTestId('dw-name').fill('Aynur')
  await page.getByTestId('dw-submit').click()
  await expect(page.getByTestId('dw-msg')).toContainText('Göndərildi')
  await expect(page.getByTestId('dw-mine-status')).toHaveText('Baxılır')
  expect(S.wall[0]).toMatchObject({ body: 'Anam üçün şəfa duası edin, xahiş edirəm', name: 'Aynur', lang: 'az', status: 'pending' })

  await page.goto('/admin')
  await adminSignIn(page)
  await openModeration(page)
  const mod = page.getByTestId('admin-moderation')
  await expect(mod.getByTestId('mod-wall-item')).toContainText('Anam üçün şəfa duası')
  await mod.getByTestId('mod-approve').click()
  await expect(mod.getByTestId('mod-wall-item')).toHaveCount(0)

  await page.goto('/dua-wall')
  const card = page.getByTestId('dw-card').first()
  await expect(card).toContainText('Anam üçün şəfa duası')
  await expect(card).toContainText('Aynur')
  await card.getByTestId('dw-pray').click()
  await expect(card.getByTestId('dw-count')).toHaveText('1 dua')
  await expect(card.getByTestId('dw-pray')).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => localStorage.getItem('mcc_dua_wall_prayed'))).toContain(String(S.wall[0].id))
  expectCleanConsole(notAdminNoise(consoleProblems))
})

test('məscid nümayəndəsi: iqamə + elan saxla → məscid ekranı qoşulu rejimdə göstərir', async ({ page, consoleProblems }) => {
  const S = createK()
  await signedIn(page, { role: 'mosque_rep', mosqueId: 'n123' })
  await attachK(page, S)
  await page.goto('/account')
  const sec = page.getByTestId('mosque-rep-section')
  await expect(sec.getByRole('heading', { name: /nümayəndə paneli/ })).toBeVisible()
  await sec.getByTestId('mr-name').fill('Təzəpir məscidi')
  await sec.getByTestId('mr-mode-fajr').selectOption('offset')
  await sec.getByTestId('mr-value-fajr').fill('25')
  await sec.getByTestId('mr-save').click()
  await expect(sec.getByTestId('mr-msg')).toContainText('Yadda saxlanıldı')
  expect(S.mosque.info.iqama).toEqual({ fajr: 25 })
  await sec.getByTestId('mr-ann').fill('Cümə günü dərs 18:00-da')
  await sec.getByTestId('mr-ann-add').click()
  await expect(sec.getByTestId('mr-announcements')).toContainText('Cümə günü dərs')
  await expect(sec.getByTestId('mr-tv-link')).toHaveValue(/\/mosque-tv\?m=n123&kiosk=1$/)

  await page.goto('/mosque-tv?m=n123')
  await expect(page.getByTestId('mtv-live')).toBeVisible()
  await expect(page.locator('.mtv-name')).toHaveText('Təzəpir məscidi')
  await expect(page.getByTestId('mtv-announce')).toContainText('Cümə günü dərs 18:00-da')
  const fajr = page.locator('.mtv-cell').first()
  const adhan = (await fajr.locator('.mtv-cell-adhan').innerText()).match(/\d{2}:\d{2}/)[0]
  const [h, mi] = adhan.split(':').map(Number)
  const t = h * 60 + mi + 25
  await expect(fajr.locator('.mtv-cell-iq')).toContainText(`${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`)
  expect(S.bodies.filter((x) => x === 'GET /api/mosques/n123/live').length).toBeGreaterThan(0)
  expectCleanConsole(consoleProblems)
})

test('həftəlik hesabat: razılıqla aç → seçimlər və həftənin rəqəmləri göndərilir', async ({ page, consoleProblems }) => {
  const S = createK()
  // Bakı günü (UTC deyil): 20:00 UTC-dən sonra UTC tarixi bir gün geri qalırdı
  await page.addInitScript(() => { try { localStorage.setItem('dhikr_daily_v1', JSON.stringify({ [new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku' }).format(new Date())]: 33 })) } catch { /* */ } })
  await signedIn(page)
  await attachK(page, S)
  await page.goto('/account')
  const sec = page.getByTestId('weekly-section')
  await expect(sec.getByRole('heading', { name: 'Həftəlik hesabat' })).toBeVisible()
  await expect(sec.getByTestId('weekly-preview')).toContainText('Zikr')
  await sec.getByTestId('weekly-enabled').check()
  await sec.getByTestId('weekly-weekday').selectOption('5')
  await sec.getByTestId('weekly-save').click()
  await expect(sec.getByTestId('weekly-msg')).toContainText('razılıq')
  await sec.getByTestId('weekly-consent').check()
  await sec.getByTestId('weekly-save').click()
  await expect(sec.getByTestId('weekly-msg')).toContainText('Yadda saxlanıldı')
  await expect(sec.getByTestId('weekly-next')).toBeVisible()
  expect(S.weekly.prefs).toMatchObject({ enabled: true, weekday: 5, tz: 'Asia/Baku', lang: 'az' })
  await expect.poll(() => S.weekly.stats.length).toBeGreaterThan(0)
  expect(S.weekly.stats[0].weekEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  expect(new Date(S.weekly.stats[0].weekEnd + 'T12:00:00Z').getUTCDay()).toBe(5)
  expect(await page.evaluate(() => localStorage.getItem('mcc_weekly'))).toBe(JSON.stringify({ on: true, wd: 5 }))
  expectCleanConsole(consoleProblems)
})

test('/en: K bölmələrində azərbaycanca yazı yoxdur', async ({ page, consoleProblems }) => {
  const S = createK()
  S.profile = { handle: 'ali_k', enabled: true, allowIndex: false, fields: ['displayName', 'khatms'], data: { displayName: 'Ali', khatms: 2 }, consentAt: 1, moderatedAt: null, updatedAt: 2 }
  S.wall.push({ id: 5, body: 'Please pray for my mother', name: '', lang: 'en', status: 'approved', prayed: 3, at: Date.now() })
  S.duas = [{ id: 1, author: 'Mum', self: false, body: 'Please pray for my exam', answered: false, answeredAt: null, createdAt: Date.UTC(2026, 10, 17), prayed: 0, prayedByMe: false }]
  await signedIn(page, { displayName: 'Ali', role: 'mosque_rep', mosqueId: 'n123' })
  await attachK(page, S)
  await page.goto('/en/account')
  await expect(page.getByRole('heading', { name: 'Public profile' })).toBeVisible()
  for (const id of ['public-profile-section', 'weekly-section', 'mosque-rep-section', 'family-duas']) {
    expect(await page.getByTestId(id).innerText(), id).not.toMatch(/[əƏ]|Açıq profil|Həftəlik|Məscid|Ailə/)
  }
  // İbadət sayı formada təklif olunmur; yazılar "made dua" (namaz kimi oxunmasın)
  await expect(page.getByTestId('pp-field-khatms')).toHaveCount(0)
  await expect(page.getByTestId('pp-field-ummahKhatms')).toHaveCount(0)
  await expect(page.getByTestId('pp-worship-note')).toHaveText('Worship stays between you and Allah, so it is not shown.')
  await page.goto('/en/dua-wall')
  await expect(page.getByRole('heading', { level: 1, name: 'Dua wall' })).toBeVisible()
  await expect(page.getByTestId('dw-card')).toContainText('Anonymous')
  await expect(page.getByTestId('dw-pray')).toHaveText('I made dua')
  await expect(page.getByTestId('dw-count')).toHaveText('3 people made dua')
  expect(await page.locator('main').innerText()).not.toMatch(/\bprayed\b/i)
  expect(await page.locator('main').innerText()).not.toMatch(/[əƏ]/)
  await page.goto('/en/u/ali_k')
  // Köhnə yazıda khatms qalıb — səhifə onu göstərmir
  await expect(page.getByTestId('public-profile').getByRole('heading', { level: 1, name: 'Ali' })).toBeVisible()
  await expect(page.getByTestId('public-profile')).not.toContainText(/Khatm/)
  expect(await page.locator('main').innerText()).not.toMatch(/[əƏ]/)
  expectCleanConsole(consoleProblems)
})

for (const theme of ['light', 'dark']) {
  test(`axe: K bölmələri, dua divarı, açıq profil, admin moderasiyası (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => { try { localStorage.setItem('muslim_cc_theme', t) } catch { /* */ } }, theme)
    const S = createK()
    S.profile = { handle: 'ali_k', enabled: true, allowIndex: false, fields: ['displayName', 'bio', 'khatms', 'favSurah'], data: { displayName: 'Əli', bio: 'Salam', khatms: 1, favSurah: 18 }, consentAt: 1, moderatedAt: null, updatedAt: 2 }
    S.wall.push({ id: 5, body: 'Anam üçün dua edin', name: 'Aynur', lang: 'az', status: 'approved', prayed: 3, at: Date.now() })
    S.wall.push({ id: 6, body: 'Gözləyən istək mətni', name: '', lang: 'az', status: 'pending', prayed: 0, at: Date.now(), createdAt: Date.now(), reported: 1, reports: [{ reason: 'spam', at: 1 }] })
    await signedIn(page, { role: 'mosque_rep', mosqueId: 'n123' })
    await fakeAdminSession(page, 'admin')
    await attachK(page, S)
    const axe = async (include) => {
      await settle(page)
      let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      for (const sel of include) b = b.include(sel)
      const { violations } = await b.analyze()
      return violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').flatMap((v) => v.nodes.map((n) => `${v.id} · ${n.target.join(' ')}`))
    }
    await page.goto('/account')
    await page.getByTestId('mosque-rep-section').waitFor()
    await page.getByTestId('family-duas').waitFor()
    expect(await axe(['#public-profile', '#weekly', '#mosque-rep', '[data-testid="family-duas"]'])).toEqual([])
    await page.goto('/dua-wall')
    await page.getByTestId('dw-card').first().waitFor()
    expect(await axe(['main'])).toEqual([])
    await page.goto('/u/ali_k')
    await page.getByTestId('public-profile').waitFor()
    expect(await axe(['main'])).toEqual([])
    await page.goto('/admin')
    await adminSignIn(page)
    await openModeration(page)
    await page.getByTestId('mod-wall-item').first().waitFor()
    expect(await axe(['[data-testid="admin-moderation"]'])).toEqual([])
  })
}

test('açıq profil: ibadət möhürləri təklif olunmur; köhnə ibadət sahələri göstərilmir; 409 moderated', async ({ page, consoleProblems }) => {
  const S = createK()
  // Bu cihazda bir öyrənmə (names_99) və iki ibadət möhürü (fajr_40, kahf_4)
  await page.addInitScript(() => { try { localStorage.setItem('muslim_cc_passport_v1', JSON.stringify({ names_99: '2026-10-01', fajr_40: '2026-10-02', kahf_4: '2026-10-03' })) } catch { /* */ } })
  S.profile = { handle: 'ali_k', enabled: true, allowIndex: false, fields: ['displayName', 'stamps', 'khatms', 'ummahKhatms'], data: { displayName: 'Əli', stamps: ['names_99', 'fajr_40'], khatms: 3, ummahKhatms: 2 }, consentAt: 1, moderatedAt: null, updatedAt: 2 }
  await signedIn(page)
  await attachK(page, S)

  await page.goto('/u/ali_k')
  const card = page.getByTestId('public-profile')
  await expect(card.getByRole('heading', { level: 1, name: 'Əli' })).toBeVisible()
  await expect(card.locator('.pub-stamps li')).toHaveCount(1)
  await expect(card).not.toContainText(/Xətm|Ümmət xətmi/)

  await page.goto('/account')
  const sec = page.getByTestId('public-profile-section')
  await expect(sec.getByTestId('pp-field-stamps')).toBeChecked()
  await expect(sec.getByTestId('pp-field-khatms')).toHaveCount(0)
  await expect(sec.locator('.cm-chips input[type="checkbox"]')).toHaveCount(1)   // yalnız names_99
  await expect(sec.getByTestId('pp-worship-note')).toBeVisible()
  await sec.getByTestId('pp-save').click()
  await expect(sec.getByTestId('pp-msg')).toContainText('Yadda saxlanıldı')
  // Göndərilən yazıda ibadət sahəsi və ibadət möhürü yoxdur
  expect(S.profile.fields).toEqual(['displayName', 'stamps'])
  expect(S.profile.data).toEqual({ displayName: 'Əli', stamps: ['names_99'] })

  // Nəzarətçi gizlədib — server yenidən açmağa icazə vermir (409 moderated)
  S.profileError = { status: 409, code: 'moderated' }
  await sec.getByTestId('pp-save').click()
  await expect(sec.getByTestId('pp-msg')).toHaveText('Nəzarətçi bu profili gizlədib.')
  expectCleanConsole(consoleProblems)
})

test('e-poçt təsdiqlənməyib (403 verify_email): dua divarı və açıq profil qeydi + məktubu yenidən göndər', async ({ page, consoleProblems }) => {
  const S = createK()
  S.unverified = true
  S.profileError = { status: 403, code: 'verify_email' }
  S.wall.push({ id: 5, body: 'Anam üçün dua edin', name: 'Aynur', lang: 'az', status: 'approved', prayed: 0, at: Date.now() })
  await signedIn(page, { emailVerified: false })
  await attachK(page, S)
  await page.goto('/dua-wall')
  await page.getByTestId('dw-body').fill('Anam üçün şəfa duası edin, xahiş edirəm')
  await page.getByTestId('dw-submit').click()
  const note = page.getByTestId('dw-verify')
  await expect(note).toContainText('e-poçtunuzu təsdiqləyin')
  await expect(page.getByTestId('dw-msg')).toHaveCount(0)
  await note.getByTestId('dw-verify-resend').click()
  await expect(note).toContainText('Təsdiq məktubu göndərildi')
  // Şikayət də eyni qeydi göstərir
  const card = page.getByTestId('dw-card').first()
  await card.getByRole('button', { name: 'Şikayət et' }).click()
  await card.getByRole('button', { name: 'Göndər' }).click()
  await expect(card.getByTestId('dw-report-verify')).toBeVisible()
  // Boş role="alert" yoxdur
  for (const el of await page.locator('[role="alert"]').all()) expect((await el.innerText()).trim()).not.toBe('')

  await page.goto('/account')
  const sec = page.getByTestId('public-profile-section')
  await sec.getByTestId('pp-enabled').check()
  await sec.getByTestId('pp-handle').fill('ali_k')
  await sec.getByTestId('pp-consent').check()
  await sec.getByTestId('pp-save').click()
  await expect(sec.getByTestId('pp-verify')).toContainText('e-poçtunuzu təsdiqləyin')
  await expect(sec.getByTestId('pp-msg')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('ümmət xətmi: təsdiqlənməmiş e-poçt (403 verify_email) — səhifə götürmə əvəzinə qeyd', async ({ page, consoleProblems }) => {
  await signedIn(page, { emailVerified: false })
  await page.route((u) => u.pathname === '/api/khatm/claim', (route) => route.fulfill({ status: 403, json: { error: 'verify_email', code: 'verify_email' } }))
  await page.goto('/khatm')
  await settle(page)
  const take = page.getByTestId('khatm-take')
  await take.getByTestId('khatm-take-btn').click()
  await expect(take.getByTestId('khatm-verify')).toContainText('e-poçtunuzu təsdiqləyin')
  await expect(take.locator('.kt-msg')).toHaveCount(0)
  // Gözlənilən 403 — brauzer onu "Failed to load resource" kimi yazır
  expectCleanConsole(consoleProblems.filter((x) => !/status of 403.*\/api\/khatm\/claim/.test(x)))
})

test('dua divarı (1280): boş divar kartı, iki sütunun yuxarısı eyni xətdə', async ({ page, isMobile }) => {
  test.skip(isMobile, 'iki sütun yalnız geniş ekranda')
  await page.setViewportSize({ width: 1280, height: 900 })
  const S = createK()
  await attachK(page, S)
  await page.goto('/dua-wall')
  const empty = page.getByTestId('dw-empty')
  await expect(empty).toBeVisible()
  await expect(empty.getByTestId('dw-empty-cta')).toHaveAttribute('href', /\/login\?next=/)
  const left = await page.locator('.dw-layout > .acc-sections').boundingBox()
  const right = await page.getByTestId('dw-wall').boundingBox()
  expect(Math.abs(left.y - right.y)).toBeLessThanOrEqual(2)
})

test('admin moderasiyası: şikayət olunan dualar (saxla / rədd et) və gizlədilmiş profillər (gizlətməni qaldır)', async ({ page, consoleProblems }) => {
  const S = createK()
  await fakeAdminSession(page, 'admin')
  await attachK(page, S)
  // Bu testin saxtaları: ?status=reported (divarda qalan, şikayət olunmuş) və ?status=hidden (gizlədilmiş profillər).
  // E-poçt / id cavabda olsa da, panel onları göstərməməlidir.
  const at = Date.UTC(2026, 10, 17, 9)
  const flagged = [
    { id: 7, body: 'Qardaşım üçün iş tapmağa dua edin', name: 'Kamal', lang: 'az', status: 'approved', reported: 2, prayed: 4, createdAt: at, decidedAt: at, expired: false,
      reports: [{ reason: 'commercial', at }, { reason: 'other', at }], flagged: true, reportsSinceApproval: 2, email: 'author@example.com', userId: 4242 },
    { id: 8, body: 'Burada reklam mətni var', name: null, lang: 'az', status: 'approved', reported: 1, prayed: 0, createdAt: at, decidedAt: at, expired: false,
      reports: [{ reason: 'commercial', at }], flagged: true, reportsSinceApproval: 1 },
  ]
  const hidden = [{ handle: 'gizli_biri', enabled: false, fields: [], data: {}, moderatedAt: at, reports: [], count: 0, email: 'owner@example.com', userId: 99 }]
  const posts = []
  await page.route((u) => /^\/api\/admin\/(dua-wall(\/\d+)?|moderation\/profiles(\/[a-z0-9_]+)?)$/.test(u.pathname), async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const p = url.pathname
    const m = req.method()
    if (m !== 'GET' && !req.headers()['x-requested-with']) return route.fulfill({ status: 403, json: { error: 'Forbidden', code: 'forbidden' } })
    if (p === '/api/admin/dua-wall' && m === 'GET' && url.searchParams.get('status') === 'reported') {
      return route.fulfill({ json: { items: flagged, counts: { pending: 0, approved: 2, rejected: 0, reported: 0, flagged: flagged.length }, page: 1,
        reasons: ['personal_info', 'not_dua', 'inappropriate', 'duplicate', 'commercial', 'other'] } })
    }
    let mm = /^\/api\/admin\/dua-wall\/(\d+)$/.exec(p)
    if (mm && m === 'POST') {
      const b = req.postDataJSON() || {}
      posts.push(`${mm[1]} ${b.action}${b.reason ? ` ${b.reason}` : ''}`)
      const i = flagged.findIndex((x) => x.id === Number(mm[1]))
      if (i >= 0) flagged.splice(i, 1)
      return route.fulfill({ json: { ok: true, counts: {} } })
    }
    if (p === '/api/admin/moderation/profiles' && m === 'GET' && url.searchParams.get('status') === 'hidden') return route.fulfill({ json: { status: 'hidden', items: hidden } })
    mm = /^\/api\/admin\/moderation\/profiles\/([a-z0-9_]+)$/.exec(p)
    if (mm && m === 'POST') {
      posts.push(`@${mm[1]} ${(req.postDataJSON() || {}).action}`)
      const i = hidden.findIndex((x) => x.handle === mm[1])
      if (i >= 0) hidden.splice(i, 1)
      return route.fulfill({ json: { ok: true } })
    }
    return route.fallback()
  })

  await page.goto('/admin')
  await adminSignIn(page)
  await openModeration(page)
  const mod = page.getByTestId('admin-moderation')

  // ── Şikayət olunan dualar ──
  await expect(mod.getByTestId('mod-status-pending')).toHaveAttribute('aria-pressed', 'true')
  await mod.getByTestId('mod-status-reported').click()
  await expect(mod.getByTestId('mod-status-reported')).toHaveAttribute('aria-pressed', 'true')
  await expect(mod.getByTestId('mod-status-reported')).toHaveText('Şikayət olunan (2)')
  await expect(mod.getByTestId('mod-reported-lead')).toContainText('3 şikayətə qədər divarda qalır')
  const items = mod.getByTestId('mod-wall-item')
  await expect(items).toHaveCount(2)
  const first = items.filter({ hasText: 'Qardaşım üçün iş' })
  await expect(first.getByTestId('mod-flag-reports')).toContainText('Təsdiqdən sonra şikayət: 2')
  await expect(first.getByTestId('mod-flag-reports')).toContainText('Reklam')
  await expect(first.getByTestId('mod-flag-reports')).toContainText('Başqa')
  await expect(first.getByTestId('mod-approve')).toHaveCount(0)
  await expect(mod).not.toContainText('author@example.com')
  await expect(mod).not.toContainText('4242')
  await first.getByTestId('mod-keep').click()
  await expect(items).toHaveCount(1)
  await expect(page.locator('.admin-toast').filter({ hasText: 'Yadda saxlanıldı' })).toBeVisible()
  const second = items.filter({ hasText: 'Burada reklam' })
  await second.getByRole('combobox', { name: 'Səbəb' }).selectOption('commercial')
  await second.getByTestId('mod-reject').click()
  await expect(items).toHaveCount(0)
  await expect(mod.getByText('Burada heç nə yoxdur')).toBeVisible()
  expect(posts).toEqual(['7 approve', '8 reject commercial'])

  // ── Gizlədilmiş profillər ──
  await mod.getByTestId('mod-tab-profiles').click()
  await expect(mod.getByTestId('mod-profiles-view-reports')).toHaveAttribute('aria-pressed', 'true')
  await mod.getByTestId('mod-profiles-view-hidden').click()
  const hiddenItem = mod.getByTestId('mod-hidden-item')
  await expect(hiddenItem).toHaveCount(1)
  await expect(hiddenItem).toContainText('@gizli_biri')
  await expect(hiddenItem).toContainText('Gizlədilib:')
  await expect(mod).toContainText('profili açmır')
  await expect(mod).not.toContainText('owner@example.com')
  await hiddenItem.getByRole('button', { name: 'Gizlətməni qaldır: @gizli_biri' }).click()
  await expect(hiddenItem).toHaveCount(0)
  await expect(page.locator('.admin-toast').filter({ hasText: 'Gizlətmə qaldırıldı' })).toBeVisible()
  expect(posts.at(-1)).toBe('@gizli_biri unhide')
  // Boş role="alert" qalmır
  await expect(page.locator('[role="alert"]:empty')).toHaveCount(0)
  expectCleanConsole(notAdminNoise(consoleProblems))
})
