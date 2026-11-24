// ═══════════════════════════════════════════════════════════════════════
// Admin paneli — saytın istifadəçi hesabı ilə giriş (SSO), docs/ADMIN-SECURITY.md → "Sayt hesabı ilə"
//
// • Sayt sessiyası (__Host-mcc_user, server/users.js) admin API-lərində də qəbul olunur, əgər:
//   1) hesabın rolu ADMIN_PANEL_ROLES-dadır (editor / admin / superadmin) — rol yalnız serverdə:
//      editor/admin-i panel verir (users.js roleChangeError qaydaları), superadmin-i YALNIZ CLI
//      (scripts/admin-user.js user-role <email> superadmin) — HTTP ilə heç vaxt;
//   2) hesabda iki addımlı yoxlama (TOTP, server/security.js → user_totp) AÇIQDIR — yoxsa 403 need_2fa;
//   3) sessiya 2FA açılandan SONRA yaradılıb (ikinci addımı keçib və ya passkey ilə) — yoxsa
//      403 need_reauth: 2FA-dan əvvəl (məs. oğurlanmış şifrə ilə) açılmış sessiya panelə çatmasın;
//   4) hesab "security hold"-da deyil ("Bu mən deyildim") — yoxsa 403 security_hold.
// • Panelin bütün köhnə kodu req.adminUser.id ilə admins cədvəlinə bağlıdır (admin_roles, FK-lar:
//   mailCampaigns.created_by …, role_audit actor). Ona görə hər sayt hesabına bir "kölgə" admins sətri
//   açılır: e-poçt site-user-<id>@sso.invalid, şifrə heşi istifadəyə yararsız ('!sso…' —
//   verifyPassword həmişə false) → köhnə login formu ilə ona girmək olmur. admin_roles sətri hər
//   sorğuda sayt roluna bərabərləşdirilir (editor→editor, admin→admin, superadmin→superadmin).
//   Bağlantı: admin_sso_links (user_id → admin_id), istifadəçi silinəndə kölgə admin də silinir.
// • Jurnal: panelə SSO ilə giriş istifadəçinin təhlükəsizlik hadisələrinə ('admin_panel') yazılır —
//   sessiya başına ən çox 12 saatda bir (yaddaşda; IP saxlanmır). Konsola yalnız istifadəçi id-si.
// • Cədvəl MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS, user_version artmır).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const auth = require('./auth')
const users = require('./users')

const SCHEMA = `
CREATE TABLE IF NOT EXISTS admin_sso_links (
  user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  admin_id     INTEGER NOT NULL UNIQUE REFERENCES admins(id) ON DELETE CASCADE,
  created_at   INTEGER NOT NULL,
  last_used_at INTEGER
);
`
const SHADOW_DOMAIN = 'sso.invalid'
const shadowEmail = (userId) => `site-user-${userId}@${SHADOW_DOMAIN}`
const isShadowEmail = (e) => typeof e === 'string' && /^site-user-\d+@sso\.invalid$/i.test(e)
// scrypt$… formatında deyil → auth.verifyPassword false qaytarır (köhnə login ilə giriş mümkün deyil)
const UNUSABLE_HASH = '!sso-site-account-no-password'
const AUDIT_EVERY_MS = 12 * 3600 * 1000
const MAX_AUDIT_KEYS = 5000
// Sayt rolu → panel rolu (eyni adlar; cədvəl aydınlıq və gələcək dəyişikliklər üçün)
const PANEL_ROLE_OF = { editor: 'editor', admin: 'admin', superadmin: 'superadmin' }

/**
 * opts: { db, usersStore, security?, now?, log? }
 * Qaytarır: { resolve(req, res), store, exportUser, summaryUser, deleteUserData }
 *   resolve → null (sayt sessiyası yoxdur / panel rolu yoxdur — köhnə davranış: 401)
 *           | { ok:false, status, code }  (need_2fa | need_reauth | security_hold)
 *           | { ok:true, admin: { id, email, role, userId } }
 */
function createAdminSso(opts) {
  const { db, usersStore, security = null, now = () => Date.now(), log = console } = opts
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const p = (sql) => raw.prepare(sql)
  const st = {
    link: p('SELECT user_id, admin_id, created_at, last_used_at FROM admin_sso_links WHERE user_id = ?'),
    addLink: p('INSERT INTO admin_sso_links (user_id, admin_id, created_at) VALUES (?, ?, ?)'),
    delLink: p('DELETE FROM admin_sso_links WHERE user_id = ?'),
    touch: p('UPDATE admin_sso_links SET last_used_at = ? WHERE user_id = ?'),
    adminByEmail: p('SELECT id FROM admins WHERE email = ?'),
    adminById: p('SELECT id FROM admins WHERE id = ?'),
    addAdmin: p('INSERT INTO admins (email, pass_hash, must_change, created_at, updated_at) VALUES (?, ?, 0, ?, ?)'),
    delAdmin: p('DELETE FROM admins WHERE id = ?'),
    role: p('SELECT role FROM admin_roles WHERE admin_id = ?'),
    setRole: p('INSERT INTO admin_roles (admin_id, role) VALUES (?, ?) ON CONFLICT(admin_id) DO UPDATE SET role = excluded.role'),
    sessionCreated: p('SELECT created_at FROM user_sessions WHERE id_hash = ?'),
  }
  const audited = new Map()   // sessiya heşi → son jurnal anı

  /** Kölgə admin sətri (yoxdursa yaradılır) + admin_roles = panel rolu. → admin id */
  function shadowAdmin(userId, role, t) {
    return tx(() => {
      let l = st.link.get(userId)
      if (l && !st.adminById.get(l.admin_id)) l = null      // kölgə admin CLI ilə silinib — yenidən aç
      let adminId = l ? l.admin_id : null
      if (!adminId) {
        const email = shadowEmail(userId)
        const ex = st.adminByEmail.get(email)
        adminId = ex ? ex.id : Number(st.addAdmin.run(email, UNUSABLE_HASH, t, t).lastInsertRowid)
        st.delLink.run(userId)
        st.addLink.run(userId, adminId, t)
      }
      const r = st.role.get(adminId)
      if (!r || r.role !== role) st.setRole.run(adminId, role)
      return adminId
    })
  }

  function audit(req, user, sessionHash, role, t) {
    const last = audited.get(sessionHash)
    if (last && t - last < AUDIT_EVERY_MS) return
    if (audited.size >= MAX_AUDIT_KEYS) {
      for (const [k, v] of audited) if (t - v >= AUDIT_EVERY_MS) audited.delete(k)
      if (audited.size >= MAX_AUDIT_KEYS) audited.clear()
    }
    audited.set(sessionHash, t)
    try { st.touch.run(t, user.id) } catch { /* */ }
    if (security) security.userEvent(req, user, 'admin_panel', {})
    log.info(`admin panel via site account: user ${user.id} (${role})`)
  }

  function resolve(req, res) {
    const token = auth.parseCookies(req.headers.cookie)[users.USER_COOKIE]
    if (!token) return null
    const t = now()
    const s = usersStore.sessionUser(token, t)
    if (!s) return null
    const u = s.user
    const role = PANEL_ROLE_OF[u.role]
    if (!role || !users.ADMIN_PANEL_ROLES.includes(u.role)) return null
    // Sürüşən sessiya uzadılıbsa cookie də yenilənsin (users.js requireUser kimi)
    if (s.renewed && res) {
      res.append('Set-Cookie', `${users.USER_COOKIE}=${token}; Path=/; Max-Age=${Math.floor(users.SESSION_TTL_MS / 1000)}; HttpOnly; Secure; SameSite=Strict`)
    }
    if (security && security.onHold(u.id)) return { ok: false, status: 403, code: 'security_hold' }
    if (!security || !security.twoFactorEnabled('user', u.id)) return { ok: false, status: 403, code: 'need_2fa' }
    const tf = security.store.totpStatus('user', u.id)
    const sc = st.sessionCreated.get(s.sessionHash)
    if (!sc || !tf.enabledAt || sc.created_at < tf.enabledAt) return { ok: false, status: 403, code: 'need_reauth' }
    let adminId
    try { adminId = shadowAdmin(u.id, role, t) } catch (e) {
      log.error('admin sso link:', e && e.message)
      return { ok: false, status: 500, code: 'server_error' }
    }
    return { ok: true, admin: { id: adminId, email: u.email || shadowEmail(u.id), role, userId: u.id }, sessionHash: s.sessionHash, user: u }
  }

  return {
    resolve,
    /** requireAdmin uğurlu SSO-dan sonra çağırır (CSRF yoxlamasından SONRA) — jurnal */
    audit: (req, r) => { try { audit(req, r.user, r.sessionHash, r.admin.role, now()) } catch (e) { log.error('admin sso audit:', e && e.message) } },
    isShadowEmail,
    // "Mənim məlumatlarım" (server/security.js sources) — sirr yoxdur
    exportUser(userId) {
      const l = st.link.get(userId)
      if (!l) return null
      const r = st.role.get(l.admin_id)
      return {
        linkedAt: new Date(l.created_at).toISOString(),
        lastUsedAt: l.last_used_at ? new Date(l.last_used_at).toISOString() : null,
        panelRole: r ? r.role : null,
      }
    },
    summaryUser(userId) {
      const l = st.link.get(userId)
      return l ? { adminPanelLinked: true } : null
    },
    /** Hesab silinir (users.js hooks.beforeDeleteUser) — kölgə admin də silinsin (rolu, sessiyaları CASCADE) */
    deleteUserData(userId) {
      const l = st.link.get(userId)
      if (l) st.delAdmin.run(l.admin_id)
    },
  }
}

module.exports = { SCHEMA, SHADOW_DOMAIN, PANEL_ROLE_OF, shadowEmail, isShadowEmail, createAdminSso }
