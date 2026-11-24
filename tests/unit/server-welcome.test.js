// Xoş gəldin məktubu (server/welcome.js, server/mailer.js → welcome, server/scripts/send-welcome.js)
//   • şablon: 5 dil + ikidilli (en + ar), dil prefiksli keçidlər, RTL, mətn variantı, escape
//   • bir dəfəlik göndəriş, sayt dilinin saxlanması (yalnız dəyişəndə), təsdiq qarmağı, Google
//   • skript: --dry-run, --send (N gün sonra, yalnız dili məlum olmayanlara), --to
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const auth = require('../../server/auth.js')
const users = require('../../server/users.js')
const { createMailer, render, renderWelcome } = require('../../server/mailer.js')
const { createWelcome, createWelcomeStore, mailLangOf, siteLang } = require('../../server/welcome.js')
const { run: runScript, mask } = require('../../server/scripts/send-welcome.js')

const ORIGIN = 'https://muslims.cc'
const PASS = 'yaxşı-uzun-şifrə-2026'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }
const DAY = 86400e3

// ── Şablon ──
describe('welcome şablonu', () => {
  const PATHS = ['/prayer', '/quran', '/whats-new']
  it.each([
    ['az', '', 'Muslims.cc-yə xoş gəlmisiniz', 'Əssəlamu aleykum, Əli!'],
    ['en', '/en', 'Welcome to Muslims.cc', 'Assalamu alaykum, Əli!'],
    ['ru', '/ru', 'Добро пожаловать в Muslims.cc', 'Ассаляму алейкум, Əli!'],
    ['tr', '/tr', 'Muslims.cc’ye hoş geldiniz', 'Esselâmü aleyküm, Əli!'],
    ['ar', '/ar', 'أهلاً بك في Muslims.cc', 'السلام عليكم، ⁨Əli⁩!'],
  ])('%s: mövzu, salam, prefiksli keçidlər, şəkil, mətn variantı', (l, prefix, subject, hello) => {
    const m = render('welcome', l, { name: 'Əli', origin: ORIGIN })
    expect(m.subject).toBe(subject)
    expect(m.text.startsWith(hello)).toBe(true)
    for (const p of PATHS) {
      expect(m.html).toContain(`href="${ORIGIN}${prefix}${p}"`)
      expect(m.text).toContain(`${ORIGIN}${prefix}${p}`)
    }
    expect(m.html).toContain(`src="${ORIGIN}/email/welcome-v1.gif"`)
    expect(m.html).toMatch(/<img [^>]*alt="Muslims\.cc — [^"]+"/)
    expect(m.html).toContain('name="color-scheme" content="light dark"')
    expect(m.html).toContain(`<html lang="${l}" dir="${l === 'ar' ? 'rtl' : 'ltr'}"`)
    expect(m.html).toContain('max-width:600px')
    expect(m.html).not.toMatch(/<script|@keyframes|utm_/i)
    expect(m.text).not.toMatch(/<[a-z]/i)
    expect(m.headers).toBeUndefined()           // abunəlik başlığı yoxdur — tək məktubdur
  })

  it('en mətni sözbəsöz; ar RTL və sözbəsöz', () => {
    const en = renderWelcome('en', {})
    for (const s of ['Assalamu alaykum!', 'Thank you for joining Muslims.cc. We’re glad you’re here.', 'A few places to start:',
      'Prayer times for your city, with the adhan reminder', 'The Quran with translation, recitation and tafsir', 'What’s new, plus a one-minute tour of the site',
      'Your account keeps your progress (Quran reading, notes, dhikr) safe and in sync across your devices, end-to-end encrypted.',
      'This is the only email we send you. Reminders and the weekly summary arrive only if you turn them on in your account.', '— The Muslims.cc team']) {
      expect(en.text).toContain(s)
    }
    const ar = renderWelcome('ar', {})
    expect(ar.html).toContain('dir="rtl"')
    expect(ar.html).toContain('border-right:4px')
    for (const s of ['شكرًا لانضمامك إلى Muslims.cc، يسعدنا وجودك معنا.', 'من أين تبدأ:', 'مواقيت الصلاة لمدينتك مع تذكير الأذان',
      'القرآن الكريم مع الترجمة والتلاوة والتفسير', 'ما الجديد وجولة قصيرة في الموقع', 'حسابك يحفظ تقدّمك (القراءة والملاحظات والأذكار) ويزامنه بين أجهزتك بتشفير تام.',
      'هذه هي الرسالة الوحيدة التي نرسلها إليك؛ التذكيرات والملخص الأسبوعي تصلك فقط إذا فعّلتها من حسابك.', '— فريق Muslims.cc']) {
      expect(ar.text).toContain(s)
    }
  })

  it('ikidilli: en + ar blokları, ar bloku RTL, hər iki dilin keçidləri', () => {
    const m = render('welcome', 'bi', { name: 'Sara' })
    expect(m.subject).toBe('Welcome to Muslims.cc · أهلاً بك في Muslims.cc')
    expect(m.html).toContain('<html lang="en" dir="ltr"')
    expect(m.html).toContain('dir="ltr" lang="en"')
    expect(m.html).toContain('dir="rtl" lang="ar"')
    expect(m.html.indexOf('lang="en"')).toBeLessThan(m.html.indexOf('lang="ar"'))
    for (const p of PATHS) { expect(m.html).toContain(`${ORIGIN}/en${p}`); expect(m.html).toContain(`${ORIGIN}/ar${p}`) }
    expect(m.text).toContain('Assalamu alaykum, Sara!')
    expect(m.text).toContain('السلام عليكم، ⁨Sara⁩!')
    expect(m.text.indexOf('— The Muslims.cc team')).toBeLessThan(m.text.indexOf('— فريق Muslims.cc'))
    expect((m.html.match(/welcome-v1\.gif/g) || []).length).toBe(1)
  })

  it('ad escape olunur, idarə simvolları atılır; adsız — ümumi salam; naməlum dil → en; pis origin → muslims.cc', () => {
    const m = renderWelcome('en', { name: '<b>x</b>‮\n', origin: 'javascript:alert(1)' })
    expect(m.html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(m.html).not.toContain('<b>x')
    expect(m.text).not.toContain('‮')
    expect(m.html).toContain(`${ORIGIN}/en/prayer`)
    expect(renderWelcome('xx', {}).subject).toBe('Welcome to Muslims.cc')
    expect(renderWelcome('az', { name: '   ' }).text.startsWith('Əssəlamu aleykum!')).toBe(true)
  })

  it('dil köməkçiləri', () => {
    expect(siteLang('uz')).toBe('uz')
    expect(siteLang('xx')).toBeNull()
    expect(siteLang(['en'])).toBeNull()
    expect(mailLangOf('uz')).toBe('en')
    expect(mailLangOf('ru')).toBe('ru')
    expect(mask('alice@example.com')).toBe('a***@example.com')
  })
})

// ── Mağaza ──
describe('welcome store', () => {
  it('dil yalnız dəyişəndə yazılır; claim bir dəfə; meta started_at sabit', () => {
    const db = openDb(':memory:')
    const us = users.createUsersStore(db)
    let t = 1000
    const st = createWelcomeStore(db, { now: () => t })
    const uid = Number(db.raw.prepare("INSERT INTO users (email, email_verified, pass_hash, display_name, role, created_at, updated_at) VALUES ('a@x.io', 1, NULL, '', 'user', 1, 1)").run().lastInsertRowid)
    expect(us.byId(uid)).toBeTruthy()
    expect(st.startedAt()).toBe(1000)
    t = 2000
    expect(createWelcomeStore(db, { now: () => t }).startedAt()).toBe(1000)
    expect(st.setLang(uid, 'xx')).toBe(false)
    expect(st.setLang(uid, 'en')).toBe(true)
    t = 3000
    expect(st.setLang(uid, 'en')).toBe(false)
    expect(st.prefsOf(uid)).toEqual({ lang: 'en', updated_at: 2000 })
    expect(st.claim(uid, 'en')).toBe(true)
    expect(st.claim(uid, 'en')).toBe(false)
    // hesab silinəndə hər iki sətir də silinir (ON DELETE CASCADE)
    db.raw.prepare('DELETE FROM users WHERE id = ?').run(uid)
    expect(st.sentOf(uid)).toBeNull()
    expect(st.prefsOf(uid)).toBeNull()
  })
})

// ── HTTP axını: təsdiq qarmağı, /me?lang, Google ──
describe('welcome axını (users router)', () => {
  let srv, db, welcome, store
  const mail = []
  let t = Date.UTC(2026, 10, 24)
  let failNext = false
  beforeAll(async () => {
    db = openDb(':memory:')
    const authStore = auth.createAuthStore(db)
    store = users.createUsersStore(db)
    const allowedOrigins = [ORIGIN]
    const base = createMailer({ apiKey: '', onMessage: (m) => mail.push(m) })
    const mailer = { ...base, sendTemplate: (...a) => (failNext && a[0] === 'welcome' ? (failNext = false, Promise.resolve({ ok: false })) : base.sendTemplate(...a)) }
    welcome = createWelcome({ db, mailer, publicOrigin: ORIGIN, now: () => t, gapMs: 0, autoEnabled: true, log: { warn() {}, error() {} } })
    const app = express()
    app.set('trust proxy', 1)
    app.use('/api', users.createUsersRouter({
      db, store, requireAdmin: auth.createRequireAdmin({ legacyLogin: true, store: authStore, allowedOrigins }), allowedOrigins, publicOrigin: ORIGIN,
      googleClientId: 'cid', googleVerify: async (c) => (c === 'good' ? { sub: 'g-1', email: 'google@example.com', name: 'Gülnar' } : null),
      mailer, webauthn: {}, now: () => t,
      hooks: { emailVerified: (id, l) => welcome.onVerified(id, l), seenLang: (id, l) => welcome.onSeenLang(id, l) },
      limits: { loginEmail: 1000, loginIp: 1000, register: 1000, forgotIp: 1000, forgotEmail: 1000, token: 1000, google: 1000, passkeyOpts: 1000, passkeyFail: 1000, userAction: 1000, resend: 1000 },
    }))
    srv = await listen(app)
  })
  afterAll(() => srv && srv.close())

  const call = (p, { method = 'POST', body, cookie, headers = H } = {}) => fetch(srv.url + p, {
    method, headers: { ...headers, ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const cookieOf = (r) => (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith(users.USER_COOKIE + '=')) || ''
  const welcomes = (to) => mail.filter((m) => m.kind === 'welcome' && m.to === to)
  const register = async (email, name = '') => {
    const r = await call('/api/auth/register', { body: { email, password: PASS, lang: 'az', ...(name ? { displayName: name } : {}) } })
    expect(r.status).toBe(201)
    const v = mail.filter((m) => m.kind === 'verify' && m.to === email).pop()
    return { cookie: cookieOf(r), token: /#token=([\w-]+)/.exec(v.text)[1] }
  }
  const idOf = (email) => store.findByEmail(email).id

  it('təsdiq → sorğunun dilində bir dəfə; dil saxlanır; sonrakı /me təkrar göndərmir', async () => {
    const { cookie, token } = await register('v1@example.com', 'Aişə')
    expect(welcomes('v1@example.com')).toHaveLength(0)            // təsdiqdən əvvəl yox
    expect((await call('/api/auth/verify', { body: { token, lang: 'ru' } })).status).toBe(200)
    await welcome.idle()
    const w = welcomes('v1@example.com')
    expect(w).toHaveLength(1)
    expect(w[0].subject).toBe('Добро пожаловать в Muslims.cc')
    expect(w[0].text).toContain('Ассаляму алейкум, Aişə!')
    expect(w[0].html).toContain(`${ORIGIN}/ru/prayer`)
    expect(welcome.store.langOf(idOf('v1@example.com'))).toBe('ru')
    expect(welcome.store.sentOf(idOf('v1@example.com')).lang).toBe('ru')
    expect((await call('/api/auth/me?lang=tr', { method: 'GET', cookie, headers: {} })).status).toBe(200)
    await welcome.idle()
    expect(welcomes('v1@example.com')).toHaveLength(1)
    expect(welcome.store.langOf(idOf('v1@example.com'))).toBe('tr')     // dil yenə də yenilənir
    expect(welcome.exportUser(idOf('v1@example.com'))).toMatchObject({ siteLanguage: 'tr', welcomeEmailSentAt: new Date(t).toISOString() })
    expect(welcome.summaryUser(idOf('v1@example.com'))).toEqual({ siteLanguage: 'tr', welcomeEmailSent: true })
  })

  it('köhnə klient (gövdədə dil yox): Referer yolundan dil; başqa origin nəzərə alınmır', async () => {
    const a = await register('ref@example.com')
    expect((await call('/api/auth/verify', { body: { token: a.token }, headers: { ...H, referer: `${ORIGIN}/en/account/verify` } })).status).toBe(200)
    await welcome.idle()
    expect(welcomes('ref@example.com')[0].subject).toBe('Welcome to Muslims.cc')
    const b = await register('refaz@example.com')
    await call('/api/auth/verify', { body: { token: b.token }, headers: { ...H, referer: `${ORIGIN}/account/verify` } })
    await welcome.idle()
    expect(welcomes('refaz@example.com')[0].subject).toBe('Muslims.cc-yə xoş gəlmisiniz')
    const c = await register('evil@example.com')
    await call('/api/auth/verify', { body: { token: c.token }, headers: { ...H, referer: 'https://evil.example/ru/x' } })
    await welcome.idle()
    expect(welcomes('evil@example.com')).toHaveLength(0)                // dil bilinmir → gözləyir
    expect(store.findByEmail('evil@example.com').email_verified).toBe(1)  // təsdiq pozulmur
    await call('/api/auth/me?lang=ar', { method: 'GET', cookie: c.cookie, headers: {} })
    await welcome.idle()
    const w = welcomes('evil@example.com')
    expect(w).toHaveLength(1)
    expect(w[0].html).toContain('<html lang="ar" dir="rtl"')
  })

  it('köhnə təsdiqli hesab: dilsiz /me göndərmir, etibarsız dil göndərmir, ilk etibarlı dildə göndərir (əlavə dil → en)', async () => {
    const { cookie, token } = await register('old@example.com')
    store.markVerified(store.consumeToken(token, 'verify', t), t)       // təsdiq "funksiyadan əvvəl" — qarmaqsız
    await call('/api/auth/me', { method: 'GET', cookie, headers: {} })
    await call('/api/auth/me?lang=xx', { method: 'GET', cookie, headers: {} })
    await call('/api/auth/me?lang=en&lang=ru', { method: 'GET', cookie, headers: {} })
    await welcome.idle()
    expect(welcomes('old@example.com')).toHaveLength(0)
    expect(welcome.store.langOf(idOf('old@example.com'))).toBeNull()
    await call('/api/auth/me?lang=uz', { method: 'GET', cookie, headers: {} })
    await welcome.idle()
    const w = welcomes('old@example.com')
    expect(w).toHaveLength(1)
    expect(w[0].subject).toBe('Welcome to Muslims.cc')
    expect(welcome.store.langOf(idOf('old@example.com'))).toBe('uz')
  })

  it('təsdiqlənməmiş və bağlanmış hesab almır', async () => {
    const u = await register('unv@example.com')
    await call('/api/auth/me?lang=en', { method: 'GET', cookie: u.cookie, headers: {} })
    await welcome.idle()
    expect(welcomes('unv@example.com')).toHaveLength(0)
    expect(welcome.store.langOf(idOf('unv@example.com'))).toBe('en')   // dil saxlanır
    const d = await register('dis@example.com')
    store.markVerified(idOf('dis@example.com'), t)
    db.raw.prepare('UPDATE users SET disabled = 1 WHERE id = ?').run(idOf('dis@example.com'))
    welcome.onSeenLang(idOf('dis@example.com'), 'en')
    await welcome.idle()
    expect(welcomes('dis@example.com')).toHaveLength(0)
    expect(d.cookie).toBeTruthy()
  })

  it('göndəriş alınmasa: qeyd silinir, 1 saat soyumadan sonra yenidən', async () => {
    const { cookie, token } = await register('fail@example.com')
    failNext = true
    expect((await call('/api/auth/verify', { body: { token, lang: 'en' } })).status).toBe(200)
    await welcome.idle()
    expect(welcomes('fail@example.com')).toHaveLength(0)
    expect(welcome.store.sentOf(idOf('fail@example.com'))).toBeNull()
    await call('/api/auth/me?lang=en', { method: 'GET', cookie, headers: {} })
    await welcome.idle()
    expect(welcomes('fail@example.com')).toHaveLength(0)              // soyuma
    t += 3600e3 + 1
    await call('/api/auth/me?lang=en', { method: 'GET', cookie, headers: {} })
    await welcome.idle()
    expect(welcomes('fail@example.com')).toHaveLength(1)
  })

  it('Google ilə yeni (artıq təsdiqli) hesab — yaradılarkən bir dəfə; təkrar girişdə yox', async () => {
    const r = await call('/api/auth/google', { body: { credential: 'good', lang: 'tr' } })
    expect(r.status).toBe(201)
    await welcome.idle()
    const w = welcomes('google@example.com')
    expect(w).toHaveLength(1)
    expect(w[0].subject).toBe('Muslims.cc’ye hoş geldiniz')
    expect(w[0].text).toContain('Gülnar')
    expect((await call('/api/auth/google', { body: { credential: 'good', lang: 'tr' } })).status).toBe(200)
    await welcome.idle()
    expect(welcomes('google@example.com')).toHaveLength(1)
  })

  it('qarmaq xətası təsdiqi pozmur', async () => {
    const bad = express()
    const db2 = openDb(':memory:')
    const st2 = users.createUsersStore(db2)
    const m2 = []
    bad.use('/api', users.createUsersRouter({
      db: db2, store: st2, allowedOrigins: [ORIGIN], publicOrigin: ORIGIN, webauthn: {}, googleVerify: async () => null,
      mailer: createMailer({ apiKey: '', onMessage: (m) => m2.push(m) }),
      hooks: { emailVerified: () => { throw new Error('boom') } },
    }))
    const s2 = await listen(bad)
    try {
      const r = await fetch(s2.url + '/api/auth/register', { method: 'POST', headers: H, body: JSON.stringify({ email: 'h@example.com', password: PASS }) })
      expect(r.status).toBe(201)
      const token = /#token=([\w-]+)/.exec(m2[0].text)[1]
      const v = await fetch(s2.url + '/api/auth/verify', { method: 'POST', headers: H, body: JSON.stringify({ token }) })
      expect(v.status).toBe(200)
    } finally { await s2.close() }
  })
})

// ── Skript ──
describe('scripts/send-welcome.js', () => {
  let dir, db
  const mail = []
  let t = Date.UTC(2026, 10, 24)
  const lines = []
  const ctx = () => ({ db, mailer: createMailer({ apiKey: '', onMessage: (m) => mail.push(m) }), allowDisabled: true, now: () => t, out: (s) => lines.push(s), err: (s) => lines.push('ERR ' + s), sleep: async () => {} })
  const add = (email, { verified = 1, disabled = 0, name = '' } = {}) => Number(db.raw.prepare(
    "INSERT INTO users (email, email_verified, pass_hash, display_name, role, disabled, created_at, updated_at) VALUES (?, ?, NULL, ?, 'user', ?, 1, 1)",
  ).run(email, verified, name, disabled).lastInsertRowid)

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-welcome-'))
    db = openDb(path.join(dir, 'test.db'))
    users.createUsersStore(db)
    createWelcomeStore(db, { now: () => t })                  // "deploy" anı
    add('nolang@example.com', { name: 'Musa' })
    const withLang = add('withlang@example.com')
    db.raw.prepare('INSERT INTO user_prefs (user_id, lang, updated_at) VALUES (?, ?, ?)').run(withLang, 'ru', t)
    const done = add('done@example.com')
    db.raw.prepare('INSERT INTO welcome_sent (user_id, sent_at, lang) VALUES (?, ?, ?)').run(done, t, 'en')
    add('unverified@example.com', { verified: 0 })
    add('disabled@example.com', { disabled: 1 })
  })
  afterAll(() => { db && db.close(); fs.rmSync(dir, { recursive: true, force: true }) })

  it('səhv arqumentlər → 2', async () => {
    expect(await runScript([], ctx())).toBe(2)
    expect(await runScript(['--all-verified', '--dry-run', '--send'], ctx())).toBe(2)
    expect(await runScript(['--all-verified', '--send'], ctx())).toBe(2)          // N mütləqdir
    expect(await runScript(['--to', 'bad'], ctx())).toBe(2)
    expect(await runScript(['--to', 'a@b.io', '--lang', 'de'], ctx())).toBe(2)
    expect(await runScript(['--all-verified', '--dry-run', '--fallback-after-days', '-1'], ctx())).toBe(2)
    expect(mail).toHaveLength(0)
  })

  it('--dry-run: yalnız dili məlum olmayan namizədlər siyahılanır, ünvan maskalı, heç nə göndərilmir', async () => {
    lines.length = 0
    expect(await runScript(['--all-verified', '--dry-run', '--fallback-after-days', '7'], ctx())).toBe(0)
    const outText = lines.join('\n')
    expect(outText).toContain('Məktub almamış təsdiqli hesab: 2 (dili məlum — növbəti açılışda avtomatik: 1; dili məlum deyil: 1)')
    expect(outText).toContain('n***@example.com')
    expect(outText).not.toContain('nolang@example.com')
    expect(outText).not.toMatch(/withlang|done@|unverified|disabled@/)
    expect(mail).toHaveLength(0)
  })

  it('--send: 7 gün keçməyibsə heç nə; keçibsə ikidilli, qeyd olunur, ikinci dəfə yox', async () => {
    lines.length = 0
    expect(await runScript(['--all-verified', '--send', '--fallback-after-days', '7'], ctx())).toBe(0)
    expect(lines.join('\n')).toContain('Hələ tezdir')
    expect(mail).toHaveLength(0)
    t += 7 * DAY
    expect(await runScript(['--all-verified', '--send', '--fallback-after-days', '7'], ctx())).toBe(0)
    expect(mail).toHaveLength(1)
    expect(mail[0].to).toBe('nolang@example.com')
    expect(mail[0].subject).toBe('Welcome to Muslims.cc · أهلاً بك في Muslims.cc')
    expect(mail[0].text).toContain('Assalamu alaykum, Musa!')
    expect(db.raw.prepare("SELECT lang FROM welcome_sent ws JOIN users u ON u.id = ws.user_id WHERE u.email = 'nolang@example.com'").get().lang).toBe('bi')
    expect(await runScript(['--all-verified', '--send', '--fallback-after-days', '7'], ctx())).toBe(0)
    expect(mail).toHaveLength(1)
  })

  it('--to: bir sınaq məktubu, istənilən dildə, qeyd olunmur', async () => {
    const before = db.raw.prepare('SELECT COUNT(*) AS n FROM welcome_sent').get().n
    expect(await runScript(['--to', 'done@example.com', '--lang', 'az'], ctx())).toBe(0)
    expect(await runScript(['--to', 'Tester@Example.com'], ctx())).toBe(0)
    expect(mail.slice(-2).map((m) => [m.to, m.subject])).toEqual([
      ['done@example.com', 'Muslims.cc-yə xoş gəlmisiniz'],
      ['tester@example.com', 'Welcome to Muslims.cc · أهلاً بك في Muslims.cc'],
    ])
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM welcome_sent').get().n).toBe(before)
  })

  it('açar yoxdursa (allowDisabled-siz) göndərmir', async () => {
    const c = { ...ctx(), allowDisabled: false }
    expect(await runScript(['--to', 'x@example.com'], c)).toBe(1)
  })
})
