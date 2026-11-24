// Server: baş adminin istifadəçilərə məktubu (server/mailCampaigns.js) + admin istifadəçi siyahısı (server/users.js)
//   • icazə: editor/admin → 403, yalnız superadmin; CSRF; sessiyasız 401
//   • alıcılar: təsdiqlənməmiş, bloklanmış, imtina etmiş — HEÇ VAXT; seçilmiş / bir nəfər
//   • dillərə görə versiya (user_prefs) + ehtiyat dil; tək versiya
//   • növbə: atomik tutma, ikiqat göndəriş yoxdur (təkrar tick, iki "proses", yarımçıq 'sending'), ləğv, saatlıq hədd, ≥ 700 ms
//   • imtina tokeni (HMAC, başqa sahənin tokeni keçmir), RFC 8058 bir klik, ixrac/xülasə
//   • təmizləmə: formadan HTML keçmir, yalnız https keçidləri, düymə yalnız muslims.cc
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const auth = require('../../server/auth.js')
const users = require('../../server/users.js')
const { createMailer, renderCampaign, formatCampaignBody } = require('../../server/mailer.js')
const mc = require('../../server/mailCampaigns.js')

const ORIGIN = 'https://muslims.cc'
const ADMIN_PASS = 'admin-paneli-şifrəsi-123'
const SECRET = 'test-secret-0123456789abcdef'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }

const single = (over = {}) => ({ mode: 'single', header: 'gif', versions: { az: { subject: 'Salam', body: 'Mətn **qalın**', ctaLabel: '', ctaUrl: '' } }, ...over })
const perLang = () => ({
  mode: 'perLang', header: 'text', fallback: 'en',
  versions: {
    az: { subject: 'AZ mövzu', body: 'AZ mətn', ctaLabel: 'Aç', ctaUrl: '/quran' },
    en: { subject: 'EN subject', body: 'EN body', ctaLabel: 'Open', ctaUrl: '/quran' },
    ru: { subject: 'RU тема', body: 'RU текст' },
  },
})

describe('validContent / validRecipients / versionFor', () => {
  it('düzgün məzmun normallaşır; düymə yalnız muslims.cc, yol dil prefiksi alır', () => {
    const v = mc.validContent(perLang(), ORIGIN)
    expect(v.error).toBeUndefined()
    expect(v.content.versions.az.ctaUrl).toBe('https://muslims.cc/quran')
    expect(v.content.versions.en.ctaUrl).toBe('https://muslims.cc/en/quran')
    expect(v.content.versions.ru).toEqual({ subject: 'RU тема', body: 'RU текст', ctaLabel: '', ctaUrl: '' })
    const en = (u) => mc.validContent({ mode: 'single', versions: { en: { subject: 's', body: 'b', ctaLabel: 'Go', ctaUrl: u } } }, ORIGIN)
    expect(en('/en/quran').content.versions.en.ctaUrl).toBe('https://muslims.cc/en/quran')
    expect(en('https://muslims.cc/en/x?y=1').content.versions.en.ctaUrl).toBe('https://muslims.cc/en/x?y=1')
    for (const bad of ['https://evil.com/', 'http://muslims.cc/', 'javascript:alert(1)', '//evil.com', 'https://muslims.cc@evil.com/', 'https://user:p@muslims.cc/']) {
      expect(en(bad).error, bad).toBe('bad_cta')
    }
    // label olmadan URL (və əksinə) — xəta
    expect(mc.validContent({ mode: 'single', versions: { en: { subject: 's', body: 'b', ctaLabel: '', ctaUrl: '/x' } } }, ORIGIN).error).toBe('bad_cta')
  })

  it('pis məzmun: rejim, dil, ehtiyat, uzunluq, tiplər', () => {
    const v = (c) => mc.validContent(c, ORIGIN).error
    expect(v(null)).toBe('bad_request')
    expect(v({ ...single(), mode: 'x' })).toBe('bad_mode')
    expect(v({ mode: 'single', versions: { fr: { subject: 's', body: 'b' } } })).toBe('bad_lang')
    expect(v({ mode: 'single', versions: { az: { subject: 's', body: 'b' }, en: { subject: 's', body: 'b' } } })).toBe('bad_lang')
    expect(v({ ...perLang(), fallback: 'tr' })).toBe('bad_fallback')
    expect(v({ mode: 'single', versions: { az: { subject: '', body: 'b' } } })).toBe('bad_subject')
    expect(v({ mode: 'single', versions: { az: { subject: 'x'.repeat(151), body: 'b' } } })).toBe('bad_subject')
    expect(v({ mode: 'single', versions: { az: { subject: 's', body: 'x'.repeat(10001) } } })).toBe('bad_body')
    expect(v({ mode: 'single', versions: { az: { subject: 1, body: 'b' } } })).toBe('bad_request')
    expect(v({ ...single(), header: '<img>' })).toBe('bad_request')
    // başlıq inyeksiyası: idarə simvolları atılır
    expect(mc.validContent({ mode: 'single', versions: { az: { subject: 'a\r\nBcc: x@y.z', body: 'b' } } }, ORIGIN).content.versions.az.subject).toBe('a Bcc: x@y.z')
  })

  it('alıcı seçimi və dil versiyası', () => {
    expect(mc.validRecipients({ mode: 'all' })).toEqual({ mode: 'all', ids: [] })
    expect(mc.validRecipients({ mode: 'selected', ids: [3, 3, 5] })).toEqual({ mode: 'selected', ids: [3, 5] })
    expect(mc.validRecipients({ mode: 'one', ids: [1, 2] })).toBeNull()
    expect(mc.validRecipients({ mode: 'selected', ids: [] })).toBeNull()
    expect(mc.validRecipients({ mode: 'selected', ids: ['1'] })).toBeNull()
    expect(mc.validRecipients({ mode: 'selected', ids: [1.5] })).toBeNull()
    expect(mc.validRecipients(null)).toBeNull()
    const c = mc.validContent(perLang(), ORIGIN).content
    expect(mc.versionFor(c, 'az')).toBe('az')
    expect(mc.versionFor(c, 'ru')).toBe('ru')
    expect(mc.versionFor(c, 'tr')).toBe('en')      // versiya yoxdur → ehtiyat
    expect(mc.versionFor(c, 'fr')).toBe('en')
    expect(mc.versionFor(c, null)).toBe('en')
    expect(mc.versionFor(mc.validContent(single(), ORIGIN).content, 'en')).toBe('az')
  })
})

describe('renderCampaign — təmizləmə', () => {
  it('HTML escape olunur, **qalın**, yalnız https keçidləri, mətn variantı, imtina başlıqları', () => {
    const m = renderCampaign('en', {
      subject: 'Hi <b>there</b>', header: 'gif', origin: ORIGIN,
      body: 'Hello **friend** <script>alert(1)</script> <img src=x onerror=alert(1)>\nline two https://muslims.cc/quran.\n\n[Read](https://example.org/a) [x](javascript:alert(1)) https://u:p@evil.com "><a href=x>',
      ctaLabel: 'Open', ctaUrl: 'https://muslims.cc/en/quran', unsubUrl: 'https://muslims.cc/api/mail/unsubscribe?t=1.news.x&l=en',
    })
    expect(m.html).not.toMatch(/<script|<img src=x|href="javascript|<a href=x|<b>there/i)
    expect(m.html).not.toMatch(/<[a-z]+ [^>]*onerror=/i)
    expect(m.html).toContain('&lt;script&gt;')
    expect(m.html).toContain('<strong>friend</strong>')
    expect(m.html).toContain('href="https://muslims.cc/quran"')
    expect(m.html).toContain('>https://muslims.cc/quran</a>.')
    expect(m.html).toContain('href="https://example.org/a"')
    expect(m.html).not.toContain('href="https://u:p@evil.com')
    expect(m.html).toContain('<br>')
    expect(m.html).toContain(`src="${ORIGIN}/email/welcome-v1.gif"`)
    expect(m.html).toContain('name="color-scheme" content="light dark"')
    expect(m.html).toContain('href="https://muslims.cc/en/quran"')
    expect(m.html).toContain('You receive this because you have a Muslims.cc account.')
    expect(m.html).toContain('Unsubscribe from these emails')
    expect(m.text).toContain('Hello friend')
    expect(m.text).toContain('Read (https://example.org/a)')
    expect(m.text).toContain('Open: https://muslims.cc/en/quran')
    expect(m.text).toContain('Unsubscribe from these emails: https://muslims.cc/api/mail/unsubscribe?t=1.news.x&l=en')
    expect(m.headers).toEqual({ 'List-Unsubscribe': '<https://muslims.cc/api/mail/unsubscribe?t=1.news.x&l=en>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' })
  })

  it('ar — RTL, statik başlıq, 5 dildə altlıq', () => {
    const ar = renderCampaign('ar', { subject: 's', body: 'b', header: 'text', unsubUrl: 'https://muslims.cc/u' })
    expect(ar.html).toContain('<html lang="ar" dir="rtl"')
    expect(ar.html).not.toContain('welcome-v1.gif')
    expect(ar.html).toContain('تصلك هذه الرسالة لأن لديك حسابًا في Muslims.cc.')
    for (const [l, s] of [['az', 'Bu məktubu Muslims.cc hesabınız olduğu üçün alırsınız.'], ['ru', 'потому что у вас есть аккаунт'], ['tr', 'hesabınız olduğu için']]) {
      expect(renderCampaign(l, { subject: 's', body: 'b' }).text).toContain(s)
    }
    expect(renderCampaign('en', { subject: 's', body: 'b', test: true }).subject).toBe('[Test] s')
  })

  it('formatCampaignBody: boş sətir = abzas, idarə simvolları və bidi atılır', () => {
    const f = formatCampaignBody('a\r\n\r\n\r\nb‮c\u0007d')
    expect(f.text).toEqual(['a', 'bc d'])
    expect(f.html).toEqual(['a', 'bc d'])
  })
})

describe('HTTP + növbə', () => {
  let srv, db, store, authStore, router, clock = Date.UTC(2026, 10, 24, 10)
  const mail = []
  const ids = {}
  const now = () => clock
  beforeAll(async () => {
    db = openDb(':memory:')
    authStore = auth.createAuthStore(db)
    store = users.createUsersStore(db)
    for (const [k, email] of [['super', 'owner@muslims.cc'], ['admin', 'admin@muslims.cc'], ['editor', 'editor@muslims.cc']]) ids[k] = await authStore.createAdmin(email, ADMIN_PASS)
    store.setAdminRole('owner@muslims.cc', 'superadmin')
    store.setAdminRole('editor@muslims.cc', 'editor')
    const allowedOrigins = [ORIGIN]
    const requireAdmin = auth.createRequireAdmin({ store: authStore, allowedOrigins })
    const mailer = createMailer({ apiKey: '', onMessage: (m) => mail.push(m) })
    const app = express()
    app.use('/api', auth.createAuthRouter({ store: authStore, requireAdmin, allowedOrigins, adminRoleOf: store.adminRole }))
    app.use('/api', users.createUsersRouter({ db, store, requireAdmin, allowedOrigins, publicOrigin: ORIGIN, mailer }))
    router = mc.createMailCampaignsRouter({
      db, requireAdmin, adminRoleOf: store.adminRole, mailer, secret: SECRET, publicOrigin: ORIGIN, now,
      gapMs: 0, allowFastGap: true, allowDisabledMailer: true, sleep: async () => {}, log: { error() {}, info() {}, warn() {} },
    })
    app.use('/api', router)
    srv = await listen(app)
    // İstifadəçilər: dil (user_prefs), təsdiq, blok, imtina
    const ins = db.raw.prepare(`INSERT INTO users (email, email_verified, display_name, created_at, updated_at, disabled) VALUES (?, ?, ?, ?, ?, ?)`)
    const pref = db.raw.prepare('INSERT INTO user_prefs (user_id, lang, updated_at) VALUES (?, ?, 0)')
    const add = (key, email, verified, lang, disabled = 0, t = 1) => {
      ids[key] = Number(ins.run(email, verified, key, t, t, disabled).lastInsertRowid)
      if (lang) pref.run(ids[key], lang)
    }
    add('az1', 'az1@example.com', 1, 'az', 0, 10)
    add('en1', 'en1@example.com', 1, 'en', 0, 20)
    add('ru1', 'ru1@example.com', 1, 'ru', 0, 30)
    add('fr1', 'fr1@example.com', 1, 'fr', 0, 40)
    add('nolang', 'nolang@example.com', 1, null, 0, 50)
    add('unver', 'unver@example.com', 0, 'az', 0, 60)
    add('blocked', 'blocked@example.com', 1, 'az', 1, 70)
    add('opted', 'opted@example.com', 1, 'en', 0, 80)
    router.store.optout(ids.opted, 1)
  })
  afterAll(() => srv && srv.close())

  const call = (path, { method = 'POST', body, cookie, headers = H } = {}) => fetch(srv.url + path, {
    method, headers: { ...headers, ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith(auth.COOKIE_NAME + '=')) || ''
  const login = async (email) => cookieOf(await call('/api/admin/login', { body: { email, password: ADMIN_PASS } }))
  const sentTo = () => mail.filter((m) => m.kind === 'campaign').map((m) => m.to).sort()

  it('admin siyahısı: dil, xoş gəldin, imtina sahələri; filtr, sıralama, say; editor 403', async () => {
    const ad = await login('admin@muslims.cc')
    const ed = await login('editor@muslims.cc')
    const get = (qs, cookie = ad) => call(`/api/admin/users${qs}`, { method: 'GET', cookie, headers: {} })
    expect((await get('', ed)).status).toBe(403)
    const all = await (await get('')).json()
    expect(all.total).toBe(8)
    expect(all.users[0].email).toBe('opted@example.com')         // köhnə sıralama: id DESC
    expect(all.users.find((u) => u.email === 'opted@example.com')).toMatchObject({ siteLang: 'en', emailOptOut: true, welcomeSentAt: null })
    expect(all.users.find((u) => u.email === 'nolang@example.com').siteLang).toBeNull()
    expect(all.facets).toMatchObject({ users: 8, verified: 7, unverified: 1, optedOut: 1 })
    expect(all.facets.langs).toEqual(expect.arrayContaining([{ lang: 'az', n: 3 }, { lang: 'none', n: 1 }]))
    const unv = await (await get('?verified=0')).json()
    expect(unv.users.map((u) => u.email)).toEqual(['unver@example.com'])
    const az = await (await get('?lang=az&sort=email&dir=asc')).json()
    expect(az.users.map((u) => u.email)).toEqual(['az1@example.com', 'blocked@example.com', 'unver@example.com'])
    expect((await (await get('?lang=none')).json()).users.map((u) => u.email)).toEqual(['nolang@example.com'])
    const created = await (await get('?sort=created&dir=asc')).json()
    expect(created.users[0].email).toBe('az1@example.com')
    // allowlist-dən kənar sıralama / SQL — susmaya görə
    const evil = await (await get('?sort=email;DROP%20TABLE%20users&dir=x&lang=%27')).json()
    expect(evil.total).toBe(8)
    expect(evil.sort).toBe('id')
  })

  it('icazə: sessiyasız 401, editor/admin 403, CSRF 403; superadmin OK', async () => {
    const sa = await login('owner@muslims.cc')
    const ad = await login('admin@muslims.cc')
    const ed = await login('editor@muslims.cc')
    const body = { recipients: { mode: 'all' } }
    expect((await call('/api/admin/mail/audience', { body })).status).toBe(401)
    for (const c of [ad, ed]) {
      for (const [path, method] of [['/api/admin/mail/audience', 'POST'], ['/api/admin/mail/preview', 'POST'], ['/api/admin/mail/test', 'POST'], ['/api/admin/mail/campaigns', 'POST'], ['/api/admin/mail/campaigns', 'GET']]) {
        const r = await call(path, { method, cookie: c, body: method === 'GET' ? undefined : body, headers: method === 'GET' ? {} : H })
        expect(r.status, path).toBe(403)
        expect((await r.json()).code).toBe('superadmin_required')
      }
    }
    expect((await call('/api/admin/mail/audience', { cookie: sa, body, headers: { 'content-type': 'application/json' } })).status).toBe(403)       // X-Requested-With yox
    expect((await call('/api/admin/mail/audience', { cookie: sa, body, headers: { ...H, origin: 'https://evil.example' } })).status).toBe(403)
    expect((await call('/api/admin/mail/audience', { cookie: sa, body })).status).toBe(200)
    // boş / pis gövdə
    expect((await (await call('/api/admin/mail/audience', { cookie: sa })).json()).code).toBe('bad_recipients')
    expect((await call('/api/admin/mail/preview', { cookie: sa, body: { content: { mode: 'single', versions: { az: { subject: 's', body: '' } } } } })).status).toBe(400)
  })

  it('auditoriya: təsdiqlənməmiş, bloklanmış, imtina etmiş həmişə kənarda; versiyalar üzrə say', async () => {
    const sa = await login('owner@muslims.cc')
    const a = await (await call('/api/admin/mail/audience', { cookie: sa, body: { recipients: { mode: 'all' }, content: perLang() } })).json()
    expect(a.count).toBe(5)
    expect(a.excluded).toEqual({ unverified: 1, disabled: 1, optedOut: 1, missing: 0 })
    expect(a.byVersion).toEqual({ az: 1, en: 3, ru: 1 })        // en: en1 + fr1 + nolang (ehtiyat)
    const s = await (await call('/api/admin/mail/audience', { cookie: sa, body: { recipients: { mode: 'selected', ids: [ids.az1, ids.unver, ids.blocked, ids.opted, 99999] } } })).json()
    expect(s).toMatchObject({ count: 1, excluded: { unverified: 1, disabled: 1, optedOut: 1, missing: 1 } })
  })

  it('önizləmə + özünə sınaq məktubu (yalnız admin e-poçtuna)', async () => {
    const sa = await login('owner@muslims.cc')
    const pv = await (await call('/api/admin/mail/preview', { cookie: sa, body: { content: perLang(), lang: 'ru' } })).json()
    expect(pv.lang).toBe('ru')
    expect(pv.subject).toBe('RU тема')
    expect(pv.html).toContain('<html lang="ru" dir="ltr"')
    mail.length = 0
    const r = await call('/api/admin/mail/test', { cookie: sa, body: { content: perLang(), to: 'victim@example.com' } })
    expect(await r.json()).toEqual({ ok: true, sent: 3 })
    expect(mail.map((m) => m.to)).toEqual(['owner@muslims.cc', 'owner@muslims.cc', 'owner@muslims.cc'])
    expect(mail.every((m) => m.subject.startsWith('[Test] '))).toBe(true)
    mail.length = 0
  })

  it('kampaniya: təsdiq sayı tələb olunur, növbə hər alıcıya bir dəfə, dilinə görə; ikiqat sorğu yeni kampaniya yaratmır', async () => {
    const sa = await login('owner@muslims.cc')
    const body = { content: perLang(), recipients: { mode: 'all' } }
    expect((await (await call('/api/admin/mail/campaigns', { cookie: sa, body })).json()).code).toBe('confirm_required')
    const wrong = await call('/api/admin/mail/campaigns', { cookie: sa, body: { ...body, confirmCount: 4 } })
    expect(wrong.status).toBe(409)
    expect(await wrong.json()).toMatchObject({ code: 'count_changed', count: 5 })
    const r = await call('/api/admin/mail/campaigns', { cookie: sa, body: { ...body, confirmCount: 5, requestId: 'req-abcdef-1' } })
    expect(r.status).toBe(201)
    const { campaign } = await r.json()
    expect(campaign).toMatchObject({ status: 'sending', recipientCount: 5, sent: 0, pending: 5, createdBy: 'owner@muslims.cc', mode: 'perLang' })
    const dup = await (await call('/api/admin/mail/campaigns', { cookie: sa, body: { ...body, confirmCount: 5, requestId: 'req-abcdef-1' } })).json()
    expect(dup).toMatchObject({ duplicate: true, campaign: { id: campaign.id } })

    // İki "proses" eyni anda: tutma atomikdir — hər alıcıya bir məktub
    await Promise.all([router.tick(), router.tick()])
    await router.tick()
    expect(sentTo()).toEqual(['az1@example.com', 'en1@example.com', 'fr1@example.com', 'nolang@example.com', 'ru1@example.com'])
    const byTo = Object.fromEntries(mail.filter((m) => m.kind === 'campaign').map((m) => [m.to, m]))
    expect(byTo['az1@example.com'].subject).toBe('AZ mövzu')
    expect(byTo['ru1@example.com'].subject).toBe('RU тема')
    expect(byTo['fr1@example.com'].subject).toBe('EN subject')
    expect(byTo['nolang@example.com'].subject).toBe('EN subject')
    expect(byTo['az1@example.com'].html).toContain('href="https://muslims.cc/quran"')
    expect(byTo['en1@example.com'].html).toContain('href="https://muslims.cc/en/quran"')
    expect(byTo['en1@example.com'].headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
    expect(byTo['en1@example.com'].headers['List-Unsubscribe']).toContain(`/api/mail/unsubscribe?t=${mc.unsubToken(SECRET, ids.en1)}&l=en`)

    const done = await (await call(`/api/admin/mail/campaigns/${campaign.id}`, { method: 'GET', cookie: sa, headers: {} })).json()
    expect(done.campaign).toMatchObject({ status: 'done', sent: 5, failed: 0, pending: 0 })
    // Yenidən tick / "yenidən başlatma" — heç kimə ikinci məktub yoxdur
    const before = mail.length
    await router.tick()
    expect(mail.length).toBe(before)
    const audit = db.raw.prepare("SELECT action, campaign_id, admin_id FROM campaign_audit WHERE action = 'create'").all()
    expect(audit).toEqual([{ action: 'create', campaign_id: campaign.id, admin_id: ids.super }])
    const list = await (await call('/api/admin/mail/campaigns', { method: 'GET', cookie: sa, headers: {} })).json()
    expect(list.queue).toMatchObject({ maxPerHour: 300, sentLastHour: 5 })
    mail.length = 0
  })

  it('yarımçıq "sending" sətri (proses çöküb) təkrar göndərilmir; növbədə ikən imtina edən kənarda qalır; ləğv', async () => {
    const sa = await login('owner@muslims.cc')
    const create = async (rcp, n) => (await (await call('/api/admin/mail/campaigns', { cookie: sa, body: { content: single(), recipients: rcp, confirmCount: n } })).json()).campaign
    const c = await create({ mode: 'selected', ids: [ids.az1, ids.en1, ids.ru1] }, 3)
    // az1 "göndərilir" vəziyyətində qalıb (köhnə proses öldü)
    db.raw.prepare("UPDATE campaign_sends SET status = 'sending', updated_at = ? WHERE campaign_id = ? AND user_id = ?").run(clock - 11 * 60e3, c.id, ids.az1)
    router.store.optout(ids.en1)                                       // növbədə ikən imtina etdi
    await router.tick()
    expect(sentTo()).toEqual(['ru1@example.com'])
    const st = await (await call(`/api/admin/mail/campaigns/${c.id}`, { method: 'GET', cookie: sa, headers: {} })).json()
    expect(st.campaign).toMatchObject({ status: 'done', sent: 2, skipped: 1 })
    db.raw.prepare('DELETE FROM email_optout WHERE user_id = ?').run(ids.en1)
    mail.length = 0

    const c2 = await create({ mode: 'one', ids: [ids.ru1] }, 1)
    const x = await (await call(`/api/admin/mail/campaigns/${c2.id}/cancel`, { cookie: sa })).json()
    expect(x.campaign).toMatchObject({ status: 'cancelled', cancelled: 1, pending: 0 })
    await router.tick()
    expect(mail.length).toBe(0)
    expect((await call(`/api/admin/mail/campaigns/${c2.id}/cancel`, { cookie: sa })).status).toBe(409)
    expect((await call('/api/admin/mail/campaigns/abc/cancel', { cookie: sa })).status).toBe(404)
  })

  it('saatlıq hədd və məktublar arası boşluq DB-də (iki proses birlikdə də aşmır)', async () => {
    const r2 = mc.createMailCampaignsRouter({ db, requireAdmin: (q, s, n) => n(), adminRoleOf: () => 'superadmin', mailer: createMailer({ apiKey: '', onMessage: () => {} }), secret: SECRET, now, maxPerHour: 2, gapMs: 700 })
    expect(r2.store.claimNext).toBeTypeOf('function')
    db.raw.prepare('UPDATE campaign_meta SET v = 0').run()
    const sa = await login('owner@muslims.cc')
    const c = (await (await call('/api/admin/mail/campaigns', { cookie: sa, body: { content: single(), recipients: { mode: 'selected', ids: [ids.az1, ids.en1, ids.ru1, ids.fr1] }, confirmCount: 4 } })).json()).campaign
    clock += 2 * 3600e3                                              // əvvəlki göndərişlər saatdan kənarda
    const t = clock
    expect(r2.store.claimNext(t)).toMatchObject({ campaign_id: c.id })
    expect(r2.store.claimNext(t + 100)).toBeNull()                   // < 700 ms
    expect(r2.store.claimNext(t + 700)).toMatchObject({ campaign_id: c.id })
    expect(r2.store.claimNext(t + 5000)).toBeNull()                  // saatda 2
    expect(r2.store.claimNext(t + 3600e3 + 1)).toMatchObject({ campaign_id: c.id })
    // minimum boşluq 700 ms-dən az ola bilməz
    const r3 = mc.createMailCampaignsRouter({ db, requireAdmin: (q, s, n) => n(), adminRoleOf: () => 'superadmin', mailer: null, secret: SECRET, now, gapMs: 10 })
    db.raw.prepare('UPDATE campaign_meta SET v = ?').run(t + 3600e3 + 1)
    expect(r3.store.claimNext(t + 3600e3 + 300)).toBeNull()
    await call(`/api/admin/mail/campaigns/${c.id}/cancel`, { cookie: sa })
  })

  it('imtina tokeni: GET təsdiq səhifəsi, POST imtina, bir klik; saxta / başqa sahənin tokeni keçmir; ixrac', async () => {
    const tok = mc.unsubToken(SECRET, ids.ru1)
    expect(mc.verifyUnsub(SECRET, tok)).toEqual({ userId: ids.ru1 })
    expect(mc.verifyUnsub('other-secret', tok)).toBeNull()
    expect(mc.verifyUnsub(SECRET, tok.replace(/^\d+/, String(ids.az1)))).toBeNull()
    expect(mc.verifyUnsub(SECRET, `${ids.ru1}.weekly.${tok.split('.')[2]}`)).toBeNull()
    expect(mc.verifyUnsub('', tok)).toBeNull()
    const g = await fetch(`${srv.url}/api/mail/unsubscribe?t=${tok}&l=az`)
    expect(g.status).toBe(200)
    const html = await g.text()
    expect(html).toContain('İmtina et')
    expect(g.headers.get('content-security-policy')).toContain("default-src 'none'")
    expect((await fetch(`${srv.url}/api/mail/unsubscribe?t=1.news.${'A'.repeat(32)}`)).status).toBe(400)
    // GET heç nə dəyişmir
    expect(router.summaryUser(ids.ru1).optedOut).toBe(false)
    const one = await fetch(`${srv.url}/api/mail/unsubscribe?t=${tok}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' })
    expect(await one.json()).toEqual({ ok: true })
    expect(router.summaryUser(ids.ru1)).toMatchObject({ optedOut: true })
    const ex = router.exportUser(ids.ru1)
    expect(ex.emailOptOutAt).toMatch(/^\d{4}-/)
    expect(ex.campaignEmails.length).toBeGreaterThan(0)
    expect(JSON.stringify(ex)).not.toMatch(/token|secret|hash/i)
    // imtina edən növbəti kampaniyaya düşmür
    const sa = await login('owner@muslims.cc')
    const a = await (await call('/api/admin/mail/audience', { cookie: sa, body: { recipients: { mode: 'one', ids: [ids.ru1] } } })).json()
    expect(a).toMatchObject({ count: 0, excluded: { optedOut: 1 } })
    expect((await (await call('/api/admin/mail/campaigns', { cookie: sa, body: { content: single(), recipients: { mode: 'one', ids: [ids.ru1] }, confirmCount: 1 } })).json()).code).toBe('no_recipients')
  })

  it('Resend xətası: təkrar cəhd gecikmə ilə, 3 cəhddən sonra "failed"; uğurlu cəhd bir dəfə sayılır', async () => {
    let calls = 0
    const failing = createMailer({ apiKey: 'k', log: { error() {}, warn() {} }, fetchImpl: async () => { calls++; return { ok: false, status: 500 } } })
    const r4 = mc.createMailCampaignsRouter({ db, requireAdmin: (q, s, n) => n(), adminRoleOf: () => 'superadmin', mailer: failing, secret: SECRET, now, gapMs: 0, allowFastGap: true, sleep: async () => {}, log: { error() {}, info() {} } })
    db.raw.prepare("UPDATE campaigns SET status = 'cancelled' WHERE status = 'sending'").run()
    const t = clock
    const cid = Number(db.raw.prepare(`INSERT INTO campaigns (subject, content, created_by, created_at, recipient_count, status, updated_at) VALUES ('s', ?, NULL, ?, 1, 'sending', ?)`)
      .run(JSON.stringify(mc.validContent(single(), ORIGIN).content), t, t).lastInsertRowid)
    db.raw.prepare(`INSERT INTO campaign_sends (campaign_id, user_id, lang, status, updated_at) VALUES (?, ?, 'az', 'pending', ?)`).run(cid, ids.az1, t)
    const row = () => db.raw.prepare('SELECT status, attempts, next_try_at FROM campaign_sends WHERE campaign_id = ?').get(cid)
    await r4.tick()
    expect(row()).toMatchObject({ status: 'pending', attempts: 1 })
    await r4.tick()                                                   // hələ vaxtı çatmayıb
    expect(calls).toBe(1)
    clock += 6 * 60e3; await r4.tick()
    clock += 11 * 60e3; await r4.tick()
    expect(row()).toMatchObject({ status: 'failed', attempts: 3 })
    expect(calls).toBe(3)
    expect(db.raw.prepare('SELECT status, failed, sent FROM campaigns WHERE id = ?').get(cid)).toEqual({ status: 'done', failed: 1, sent: 0 })
  })

  it('hesab silinəndə imtina və göndəriş qeydləri də silinir (CASCADE)', () => {
    db.raw.prepare('DELETE FROM users WHERE id = ?').run(ids.ru1)
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM email_optout WHERE user_id = ?').get(ids.ru1).n).toBe(0)
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM campaign_sends WHERE user_id = ?').get(ids.ru1).n).toBe(0)
    const names = db.raw.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name)
    for (const t of ['campaigns', 'campaign_sends', 'email_optout', 'campaign_audit', 'campaign_meta']) expect(names).toContain(t)
  })
})
