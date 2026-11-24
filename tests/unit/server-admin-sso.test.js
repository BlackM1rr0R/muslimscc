// Server: admin paneli — saytın istifadəçi hesabı ilə giriş (SSO, server/adminSso.js + auth.js createRequireAdmin({ siteSso })).
// Yalnız panel rolu (editor/admin/superadmin) + TOTP 2FA (və 2FA-dan sonra açılmış sessiya) keçir; rol xəritəsi;
// 2FA yoxdur → 403 need_2fa; köhnə sessiya → need_reauth; CSRF; jurnal (admin_panel hadisəsi); ixrac sirsizdir;
// hesab silinəndə kölgə admin silinir.
// 2026-11-24: ayrıca admin girişi susmaya görə SÖNÜLÜDÜR (legacyLogin:false — istehsal): /api/admin/login və
// /api/admin/2fa → 403 legacy_login_disabled, köhnə __Host-mcc_admin cookie-si heç nəyi açmır. Break-glass
// (ADMIN_LEGACY_LOGIN=1 → legacyLogin:true) ikinci serverdə: köhnə giriş işləyir, 401-də legacyLogin:true;
// kölgə admin sətri orada da köhnə login-ə yaramır.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { require, express, listen } from './server-helpers.js'

const { openDb } = require('../../server/db.js')
const auth = require('../../server/auth.js')
const users = require('../../server/users.js')
const sec = require('../../server/security.js')
const ssoLib = require('../../server/adminSso.js')
const communityKit = require('../../server/communityKit.js')

const ORIGIN = 'https://muslims.cc'
const H = { 'content-type': 'application/json', 'x-requested-with': 'fetch' }
const ADMIN_PASS = 'admin-paneli-şifrəsi-123'
const silent = { info() {}, error() {}, warn() {} }

describe('admin paneli: sayt hesabı ilə SSO', () => {
  let db, srv, srvLegacy, usersStore, security, sso, authStore, mail
  const T0 = Date.now() - 10 * 60_000

  /** Sayt istifadəçisi: rol + (istəyə görə) 2FA; sessiya 2FA-dan SONRA (fresh) və ya ƏVVƏL */
  async function siteUser(email, role, { twoFactor = true, sessionBefore2fa = false } = {}) {
    const id = usersStore.createUser({ email, passHash: await auth.hashPassword('sayt-şifrəsi-uzun-1', { min: 10 }) }, T0)
    if (role !== 'user') usersStore.setUserRole(id, role, null, { kind: 'script', id: null }, T0)
    let token = null
    if (sessionBefore2fa) token = usersStore.createSession(id, '', T0)
    if (twoFactor) {
      const key = sec.base32Decode(security.store.totpBegin('user', id, T0 + 1000))
      expect(security.store.totpConfirm('user', id, sec.totp(key, T0 + 1000), T0 + 1000)).toBeTruthy()
    }
    if (!token) token = usersStore.createSession(id, '', T0 + 2000)
    return { id, cookie: `${users.USER_COOKIE}=${token}` }
  }

  const get = (path, cookie, headers = {}) => fetch(srv.url + path, { headers: { ...H, cookie, ...headers } })
  const post = (path, cookie, body, headers = H) => fetch(srv.url + path, { method: 'POST', headers: { ...headers, cookie }, body: body === undefined ? undefined : JSON.stringify(body) })

  beforeAll(async () => {
    db = openDb(':memory:')
    authStore = auth.createAuthStore(db)
    usersStore = users.createUsersStore(db)
    mail = []
    security = sec.createSecurity({ db, mailer: { sendTemplate: (...a) => { mail.push(a) } }, log: silent })
    sso = ssoLib.createAdminSso({ db, usersStore, security, log: silent })
    const requireAdmin = auth.createRequireAdmin({ store: authStore, allowedOrigins: [ORIGIN], siteSso: sso })
    const app = express()
    app.set('trust proxy', 1)
    app.use('/api', auth.createAuthRouter({ store: authStore, requireAdmin, allowedOrigins: [ORIGIN], adminRoleOf: usersStore.adminRole, security }))
    app.use('/api', users.createUsersRouter({ db, store: usersStore, requireAdmin, allowedOrigins: [ORIGIN], webauthn: {}, security }))
    const requireEditor = communityKit.createRequireEditor({ requireAdmin, adminRoleOf: usersStore.adminRole })
    app.get('/api/admin/editor-only', requireEditor, (req, res) => res.json({ role: req.adminRole, email: req.adminUser.email }))
    app.post('/api/admin/write', requireAdmin, (req, res) => res.json({ ok: true, id: req.adminUser.id, site: Boolean(req.adminUser.site) }))
    srv = await listen(app)
    // Break-glass serveri (ADMIN_LEGACY_LOGIN=1): eyni baza və SSO, köhnə giriş açıq
    const requireLegacy = auth.createRequireAdmin({ store: authStore, allowedOrigins: [ORIGIN], siteSso: sso, legacyLogin: true })
    const legacyApp = express()
    legacyApp.set('trust proxy', 1)
    legacyApp.use('/api', auth.createAuthRouter({ store: authStore, requireAdmin: requireLegacy, allowedOrigins: [ORIGIN], adminRoleOf: usersStore.adminRole, security, legacyLogin: true }))
    srvLegacy = await listen(legacyApp)
  })
  afterAll(async () => { await srv.close(); await srvLegacy.close() })
  const getL = (path, cookie) => fetch(srvLegacy.url + path, { headers: { ...H, cookie } })
  const postL = (path, cookie, body) => fetch(srvLegacy.url + path, { method: 'POST', headers: { ...H, cookie }, body: JSON.stringify(body) })

  it('cookie yoxdur / adi istifadəçi / mosque_rep → 401 (köhnə davranış)', async () => {
    expect((await get('/api/admin/me', '')).status).toBe(401)
    const u = await siteUser('plain@example.com', 'user')
    expect((await get('/api/admin/me', u.cookie)).status).toBe(401)
    const rep = await siteUser('rep@example.com', 'mosque_rep')
    expect((await get('/api/admin/me', rep.cookie)).status).toBe(401)
  })

  it('panel rolu var, 2FA yoxdur → 403 need_2fa (heç bir məlumat yoxdur)', async () => {
    const u = await siteUser('no2fa@example.com', 'admin', { twoFactor: false })
    for (const path of ['/api/admin/me', '/api/admin/users', '/api/admin/editor-only']) {
      const r = await get(path, u.cookie)
      expect(r.status, path).toBe(403)
      const j = await r.json()
      expect(j.code, path).toBe('need_2fa')
      expect(j.users).toBeUndefined()
    }
    expect((await post('/api/admin/write', u.cookie, {})).status).toBe(403)
    // Kölgə admin hələ yaradılmayıb
    expect(sso.exportUser(u.id)).toBeNull()
  })

  it('2FA-dan ƏVVƏL açılmış sessiya → 403 need_reauth', async () => {
    const u = await siteUser('old-session@example.com', 'superadmin', { sessionBefore2fa: true })
    const r = await get('/api/admin/me', u.cookie)
    expect(r.status).toBe(403)
    expect((await r.json()).code).toBe('need_reauth')
  })

  it('editor → panel rolu editor: /me via:site, editor bölməsi açıq, istifadəçi idarəsi bağlı', async () => {
    const u = await siteUser('editor@example.com', 'editor')
    const r = await get('/api/admin/me', u.cookie)
    expect(r.status).toBe(200)
    expect(r.headers.get('cache-control')).toBe('no-store')
    expect(await r.json()).toEqual({ email: 'editor@example.com', via: 'site', mustChangePassword: false, role: 'editor', twoFactor: true })
    const e = await get('/api/admin/editor-only', u.cookie)
    expect(e.status).toBe(200)
    expect(await e.json()).toEqual({ role: 'editor', email: 'editor@example.com' })
    const us = await get('/api/admin/users', u.cookie)
    expect(us.status).toBe(403)
    expect((await us.json()).code).toBe('forbidden')
  })

  it('admin → istifadəçi idarəsi açıq; admin/superadmin vermək olmur; öz rolunu dəyişmək olmur', async () => {
    const a = await siteUser('site-admin@example.com', 'admin')
    const target = await siteUser('target@example.com', 'user', { twoFactor: false })
    const me = await (await get('/api/admin/me', a.cookie)).json()
    expect(me.role).toBe('admin')
    const list = await get('/api/admin/users?q=target', a.cookie)
    expect(list.status).toBe(200)
    expect((await list.json()).users.map((x) => x.email)).toEqual(['target@example.com'])
    const toAdmin = await post(`/api/admin/users/${target.id}/role`, a.cookie, { role: 'admin' })
    expect(toAdmin.status).toBe(403)
    expect((await toAdmin.json()).code).toBe('superadmin_required')
    const toSuper = await post(`/api/admin/users/${target.id}/role`, a.cookie, { role: 'superadmin' })
    expect((await toSuper.json()).code).toBe('script_only')
    const self = await post(`/api/admin/users/${a.id}/role`, a.cookie, { role: 'editor' })
    expect((await self.json()).code).toBe('self')
    const toEditor = await post(`/api/admin/users/${target.id}/role`, a.cookie, { role: 'editor' })
    expect(toEditor.status).toBe(200)
    // role_audit-də aktor — kölgə admin (FK-li admins sətri)
    const audit = await (await get('/api/admin/role-audit', a.cookie)).json()
    expect(audit.entries[0]).toMatchObject({ actorKind: 'admin', targetEmail: 'target@example.com', newRole: 'editor' })
    expect(ssoLib.isShadowEmail(audit.entries[0].actorEmail)).toBe(true)
  })

  it('superadmin → panel rolu superadmin; superadmin HTTP ilə heç vaxt verilmir', async () => {
    const s = await siteUser('owner@example.com', 'superadmin')
    expect((await (await get('/api/admin/me', s.cookie)).json()).role).toBe('superadmin')
    const t = await siteUser('t2@example.com', 'admin', { twoFactor: false })
    const r = await post(`/api/admin/users/${t.id}/role`, s.cookie, { role: 'superadmin' })
    expect(r.status).toBe(403)
    expect((await r.json()).code).toBe('script_only')
    // superadmin admin verə bilər (köhnə qayda)
    const t3 = await siteUser('t3@example.com', 'user', { twoFactor: false })
    expect((await post(`/api/admin/users/${t3.id}/role`, s.cookie, { role: 'admin' })).status).toBe(200)
  })

  it('rol xəritəsi: sayt rolu dəyişəndə panel rolu da dəyişir; user-ə endirilsə giriş bağlanır', async () => {
    const u = await siteUser('demote@example.com', 'admin')
    expect((await (await get('/api/admin/me', u.cookie)).json()).role).toBe('admin')
    usersStore.setUserRole(u.id, 'editor', null, { kind: 'script', id: null })
    expect((await (await get('/api/admin/me', u.cookie)).json()).role).toBe('editor')
    usersStore.setUserRole(u.id, 'user', null, { kind: 'script', id: null })
    expect((await get('/api/admin/me', u.cookie)).status).toBe(401)
    expect(ssoLib.PANEL_ROLE_OF).toEqual({ editor: 'editor', admin: 'admin', superadmin: 'superadmin' })
  })

  it('CSRF: X-Requested-With yoxdur və ya yad Origin → 403; düzgün sorğu keçir', async () => {
    const u = await siteUser('csrf@example.com', 'editor')
    expect((await post('/api/admin/write', u.cookie, {}, { 'content-type': 'application/json' })).status).toBe(403)
    expect((await post('/api/admin/write', u.cookie, {}, { ...H, origin: 'https://evil.example' })).status).toBe(403)
    const ok = await post('/api/admin/write', u.cookie, {}, { ...H, origin: ORIGIN })
    expect(ok.status).toBe(200)
    expect(await ok.json()).toMatchObject({ ok: true, site: true })
    // need_2fa istifadəçisi də yad Origin-dən 403 Forbidden (kod açılmır)
    const n = await siteUser('csrf-no2fa@example.com', 'editor', { twoFactor: false })
    const r = await post('/api/admin/write', n.cookie, {}, { 'content-type': 'application/json' })
    expect(r.status).toBe(403)
    expect((await r.json()).code).toBeUndefined()
  })

  it('panelin öz şifrə/2FA marşrutları sayt hesabına bağlıdır (site_account)', async () => {
    const u = await siteUser('own@example.com', 'admin')
    for (const [m, path] of [['GET', '/api/admin/2fa'], ['POST', '/api/admin/2fa/setup'], ['POST', '/api/admin/2fa/enable'], ['POST', '/api/admin/2fa/disable'], ['POST', '/api/admin/password']]) {
      const r = m === 'GET' ? await get(path, u.cookie) : await post(path, u.cookie, { password: 'x', currentPassword: 'x', newPassword: 'yeni-şifrə-uzun-123' })
      expect(r.status, path).toBe(403)
      expect((await r.json()).code, path).toBe('site_account')
    }
  })

  it('susmaya görə: ayrıca admin girişi rədd olunur (403 legacy_login_disabled), şifrə yoxlanmır, cookie yoxdur', async () => {
    await authStore.createAdmin('legacy-off@example.com', ADMIN_PASS)
    for (const body of [{ email: 'legacy-off@example.com', password: ADMIN_PASS }, { email: 'legacy-off@example.com', password: 'yanlış-şifrə-123456' }]) {
      const r = await post('/api/admin/login', '', body)
      expect(r.status).toBe(403)
      expect((await r.json()).code).toBe('legacy_login_disabled')
      expect(r.headers.get('set-cookie')).toBeNull()
    }
    const tf = await post('/api/admin/2fa', '', { ticket: 'x'.repeat(43), code: '123456' })
    expect(tf.status).toBe(403)
    expect((await tf.json()).code).toBe('legacy_login_disabled')
    // 401 cavabında break-glass işarəsi yoxdur (panel ayrıca forma göstərmir)
    const anon = await get('/api/admin/me', '')
    expect(anon.status).toBe(401)
    expect((await anon.json()).legacyLogin).toBeUndefined()
  })

  it('susmaya görə: köhnə admin sessiyası (etibarlı cookie) heç nəyi açmır; sayt sessiyası ilə birlikdə — SSO', async () => {
    const a = authStore.findByEmail('legacy-off@example.com')
    expect(a).toBeTruthy()
    const adminCookie = `${auth.COOKIE_NAME}=${authStore.createSession(a.id)}`
    for (const path of ['/api/admin/me', '/api/admin/users', '/api/admin/editor-only']) expect((await get(path, adminCookie)).status, path).toBe(401)
    expect((await post('/api/admin/write', adminCookie, {})).status).toBe(401)
    expect((await post('/api/admin/password', adminCookie, { currentPassword: ADMIN_PASS, newPassword: 'yeni-uzun-şifrə-123' })).status).toBe(401)
    const site = await siteUser('both-off@example.com', 'editor')
    const both = await (await get('/api/admin/me', `${adminCookie}; ${site.cookie}`)).json()
    expect(both).toMatchObject({ email: 'both-off@example.com', via: 'site', role: 'editor' })
  })

  it('break-glass (legacyLogin:true): köhnə giriş işləyir və sayt sessiyasından üstündür; 401-də legacyLogin:true', async () => {
    const anon = await getL('/api/admin/me', '')
    expect(anon.status).toBe(401)
    expect(await anon.json()).toEqual({ error: 'Unauthorized', legacyLogin: true })
    await authStore.createAdmin('legacy@example.com', ADMIN_PASS)
    const login = await postL('/api/admin/login', '', { email: 'legacy@example.com', password: ADMIN_PASS })
    expect(login.status).toBe(200)
    const adminCookie = login.headers.get('set-cookie').split(';')[0]
    const me = await (await getL('/api/admin/me', adminCookie)).json()
    expect(me).toMatchObject({ email: 'legacy@example.com', via: 'session', role: 'admin' })
    const site = await siteUser('both@example.com', 'editor')
    const both = await (await getL('/api/admin/me', `${adminCookie}; ${site.cookie}`)).json()
    expect(both).toMatchObject({ email: 'legacy@example.com', via: 'session' })
    // Etibarsız admin cookie-si + sayt sessiyası → SSO
    const fallback = await (await getL('/api/admin/me', `${auth.COOKIE_NAME}=${'x'.repeat(43)}; ${site.cookie}`)).json()
    expect(fallback).toMatchObject({ email: 'both@example.com', via: 'site' })
    // Eyni cookie break-glass olmayan serverdə — rədd
    expect((await get('/api/admin/me', adminCookie)).status).toBe(401)
  })

  it('break-glass: kölgə admin sətri köhnə login formuna yaramır', async () => {
    const u = await siteUser('shadow@example.com', 'editor')
    await get('/api/admin/me', u.cookie)
    const r = await postL('/api/admin/login', '', { email: ssoLib.shadowEmail(u.id), password: '!sso-site-account-no-password' })
    expect(r.status).toBe(401)
    expect(r.headers.get('set-cookie')).toBeNull()
  })

  it('security hold → 403 security_hold; bloklanmış hesab → 401', async () => {
    const u = await siteUser('hold@example.com', 'admin')
    security.store.setHold(u.id, Date.now())
    expect((await (await get('/api/admin/me', u.cookie)).json()).code).toBe('security_hold')
    security.clearHold(u.id)
    expect((await get('/api/admin/me', u.cookie)).status).toBe(200)
    usersStore.setDisabled(u.id, true, { kind: 'script', id: null })
    expect((await get('/api/admin/me', u.cookie)).status).toBe(401)
  })

  it('jurnal: admin_panel hadisəsi sessiya başına bir dəfə (12 saat), məktubsuz', async () => {
    const u = await siteUser('audit@example.com', 'editor')
    const before = mail.length
    await get('/api/admin/me', u.cookie)
    await get('/api/admin/editor-only', u.cookie)
    await get('/api/admin/me', u.cookie)
    const ev = security.store.events(u.id, 50).filter((e) => e.kind === 'admin_panel')
    expect(ev).toHaveLength(1)
    expect(mail.length).toBe(before)
    expect(sec.EVENT_KINDS).toContain('admin_panel')
  })

  it('ixrac/xülasə sirsizdir; hesab silinəndə kölgə admin də silinir', async () => {
    const u = await siteUser('export@example.com', 'admin')
    await get('/api/admin/me', u.cookie)
    const x = sso.exportUser(u.id)
    expect(x).toMatchObject({ panelRole: 'admin' })
    expect(typeof x.linkedAt).toBe('string')
    expect(JSON.stringify(x)).not.toMatch(/hash|sso\.invalid|token/i)
    expect(sso.summaryUser(u.id)).toEqual({ adminPanelLinked: true })
    const shadow = authStore.findByEmail(ssoLib.shadowEmail(u.id))
    expect(shadow).toBeTruthy()
    sso.deleteUserData(u.id)
    usersStore.deleteUser(u.id)
    expect(authStore.findByEmail(ssoLib.shadowEmail(u.id))).toBeNull()
    expect(sso.exportUser(u.id)).toBeNull()
  })
})
