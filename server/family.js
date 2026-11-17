// ═══════════════════════════════════════════════════════════════════════
// Ailə dairəsi — hesablar arası kiçik, könüllü "ailə lövhəsi"
//
// • Bir hesab dairə yaradır (sahib, məs. valideyn) və dəvət keçidi ilə başqa HESABLARI
//   (həyat yoldaşı, öz hesabı olan böyük uşaq) çağırır. Hər hesab ən çox bir dairədədir.
// • Lövhə: hər üzv hansı XÜLASƏ rəqəmlərini paylaşacağını özü seçir (ömür boyu oxunan
//   ayələr, oxunan nağıl kitabları, namaz ulduzları …). Hesabın qalan məlumatı uçdan-uca
//   şifrəlidir — server onu oxuya bilmir; ona görə rəqəmləri KLİENT hesablayır və yalnız
//   seçilmiş rəqəmləri göndərir (ilk dəfə açıq razılıq: consent: true, vaxtı saxlanır).
// • Təşviq kartı: yalnız SABİT ŞABLONLAR (id + istəyə bağlı kiçik rəqəm), 5 dildə klientdə.
//   Sərbəst mətn YOXDUR — uşağa yad/zərərli mətn getməsin, moderasiya lazım olmasın.
// • Dəvət tokeni: 32 bayt (256 bit), bazada yalnız SHA-256, birdəfəlik, 7 gün.
//
// Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS, user_version artmır); hamısı
// users(id) ON DELETE CASCADE — hesab silinəndə üzvlük, paylaşma, kartlar silinir;
// sahibin hesabı silinəndə bütün dairə silinir.
//
// Endpoint-lər (hamısı requireUser — cookie + CSRF):
//   GET    /api/family                    → { circle | null, cards, share, limits }
//   POST   /api/family                    → 201 { circle } (dairə yarat)
//   DELETE /api/family                    → sahib: dairəni sil · üzv: dairədən çıx
//   POST   /api/family/invites            → 201 { id, token, expiresAt } (yalnız sahib)
//   DELETE /api/family/invites/:id        → ləğv (yalnız sahib)
//   POST   /api/family/join/preview       { token } → { ownerLabel, members, inCircle }
//   POST   /api/family/join               { token } → { circle }
//   DELETE /api/family/members/:id        → sahib üzvü çıxarır
//   PUT    /api/family/share              { consent?, fields:[…], stats:{…} } → { share }
//   DELETE /api/family/share              → paylaşmanı dayandır (rəqəmlər silinir)
//   POST   /api/family/cards              { to, template, n? } → 201 { card }
//   POST   /api/family/cards/seen         { ids:[…] } → { ok }
//   DELETE /api/family/cards/:id          → alıcı kartı silir
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')

const MAX_MEMBERS = 8
const MAX_INVITES = 5
const INVITE_TTL_MS = 7 * 24 * 3600e3
const CARD_TTL_MS = 60 * 24 * 3600e3
const MAX_CARDS_PER_DAY = 30
const MAX_CARDS_KEPT = 50
const MAX_STAT = 1_000_000
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/
// Paylaşıla bilən xülasə rəqəmləri (klient hesablayır — src/utils/familyStats.js)
const STAT_FIELDS = ['quranAyahsTotal', 'quranDaysWeek', 'storybooksRead', 'prayerStarsWeek', 'hifzAyahs', 'dhikrWeek']
// Təşviq kartı şablonları (mətn klientdə 5 dildə — src/components/account/familyText.js)
const CARD_TEMPLATES = ['mashallah', 'letters', 'quran', 'prayer', 'story', 'hifz', 'dua', 'proud']
const CARD_N_TEMPLATES = new Set(['letters', 'quran', 'hifz'])   // rəqəmli şablonlar ("Bu gün 3 hərf öyrəndin")

const SCHEMA = `
CREATE TABLE IF NOT EXISTS family_circles (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id   INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS family_members (
  circle_id INTEGER NOT NULL REFERENCES family_circles(id) ON DELETE CASCADE,
  user_id   INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL CHECK (role IN ('owner','member')),
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (circle_id, user_id)
);
CREATE TABLE IF NOT EXISTS family_invites (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  circle_id  INTEGER NOT NULL REFERENCES family_circles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS family_invites_by_circle ON family_invites(circle_id);
CREATE TABLE IF NOT EXISTS family_shares (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  fields     TEXT NOT NULL,
  stats      TEXT NOT NULL,
  consent_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS family_cards (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  circle_id  INTEGER NOT NULL REFERENCES family_circles(id) ON DELETE CASCADE,
  from_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template   TEXT NOT NULL,
  n          INTEGER,
  created_at INTEGER NOT NULL,
  seen_at    INTEGER
);
CREATE INDEX IF NOT EXISTS family_cards_to ON family_cards(to_id, created_at);
CREATE INDEX IF NOT EXISTS family_cards_from ON family_cards(from_id, created_at);
`

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex')
const parse = (s, fb) => { try { return JSON.parse(s) } catch { return fb } }

/** Başqasına göstəriləcək ad: display_name, yoxdursa maskalı e-poçt (a•••@g•••.com) */
function personLabel(u) {
  if (!u) return ''
  if (u.display_name) return u.display_name
  const [a, d = ''] = String(u.email || '').split('@')
  const dot = d.lastIndexOf('.')
  const host = dot > 0 ? d.slice(0, dot) : d
  return a ? `${a[0]}•••@${host ? host[0] + '•••' : ''}${dot > 0 ? d.slice(dot) : ''}` : ''
}

/** Paylaşma gövdəsi → { fields, stats } | null. Yalnız seçilmiş sahələr, tam ədədlər. */
function validShare(b) {
  if (!b || !Array.isArray(b.fields) || b.fields.length > STAT_FIELDS.length) return null
  const fields = [...new Set(b.fields)]
  if (fields.some((f) => !STAT_FIELDS.includes(f))) return null
  const src = b.stats && typeof b.stats === 'object' && !Array.isArray(b.stats) ? b.stats : {}
  const stats = {}
  for (const f of fields) {
    const v = src[f]
    if (!Number.isInteger(v) || v < 0 || v > MAX_STAT) return null
    stats[f] = v
  }
  return { fields, stats }
}

function createFamilyStore(db) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const p = (sql) => raw.prepare(sql)
  const st = {
    user: p('SELECT id, email, display_name FROM users WHERE id = ?'),
    membership: p('SELECT m.circle_id, m.role, c.owner_id FROM family_members m JOIN family_circles c ON c.id = m.circle_id WHERE m.user_id = ?'),
    members: p(`SELECT m.user_id, m.role, m.joined_at, u.email, u.display_name, s.fields, s.stats, s.updated_at AS share_at
      FROM family_members m JOIN users u ON u.id = m.user_id LEFT JOIN family_shares s ON s.user_id = m.user_id
      WHERE m.circle_id = ? ORDER BY m.role DESC, m.joined_at`),
    memberCount: p('SELECT COUNT(*) AS n FROM family_members WHERE circle_id = ?'),
    createCircle: p('INSERT INTO family_circles (owner_id, created_at) VALUES (?, ?)'),
    addMember: p('INSERT INTO family_members (circle_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)'),
    removeMember: p("DELETE FROM family_members WHERE circle_id = ? AND user_id = ? AND role = 'member'"),
    deleteCircle: p('DELETE FROM family_circles WHERE id = ? AND owner_id = ?'),
    invites: p('SELECT id, created_at, expires_at FROM family_invites WHERE circle_id = ? AND expires_at > ? ORDER BY created_at'),
    inviteCount: p('SELECT COUNT(*) AS n FROM family_invites WHERE circle_id = ? AND expires_at > ?'),
    addInvite: p('INSERT INTO family_invites (circle_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?)'),
    inviteByHash: p('SELECT i.id, i.circle_id, i.expires_at, c.owner_id FROM family_invites i JOIN family_circles c ON c.id = i.circle_id WHERE i.token_hash = ?'),
    deleteInvite: p('DELETE FROM family_invites WHERE id = ? AND circle_id = ?'),
    purgeInvites: p('DELETE FROM family_invites WHERE expires_at <= ?'),
    share: p('SELECT fields, stats, consent_at, updated_at FROM family_shares WHERE user_id = ?'),
    upsertShare: p(`INSERT INTO family_shares (user_id, fields, stats, consent_at, updated_at) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET fields = excluded.fields, stats = excluded.stats, updated_at = excluded.updated_at`),
    deleteShare: p('DELETE FROM family_shares WHERE user_id = ?'),
    cardsFor: p(`SELECT c.id, c.from_id, c.template, c.n, c.created_at, c.seen_at, u.email, u.display_name
      FROM family_cards c JOIN users u ON u.id = c.from_id WHERE c.to_id = ? ORDER BY c.created_at DESC, c.id DESC LIMIT ?`),
    cardsSentToday: p('SELECT COUNT(*) AS n FROM family_cards WHERE from_id = ? AND created_at > ?'),
    addCard: p('INSERT INTO family_cards (circle_id, from_id, to_id, template, n, created_at) VALUES (?, ?, ?, ?, ?, ?)'),
    card: p('SELECT * FROM family_cards WHERE id = ?'),
    seen: p('UPDATE family_cards SET seen_at = ? WHERE id = ? AND to_id = ? AND seen_at IS NULL'),
    deleteCard: p('DELETE FROM family_cards WHERE id = ? AND to_id = ?'),
    trimCards: p(`DELETE FROM family_cards WHERE to_id = ? AND id NOT IN
      (SELECT id FROM family_cards WHERE to_id = ? ORDER BY created_at DESC, id DESC LIMIT ?)`),
    purgeCards: p('DELETE FROM family_cards WHERE created_at <= ?'),
    // Dairədən çıxanın kartları (köhnə dairədə göndərilən/alınan) silinir
    dropCardsOf: p('DELETE FROM family_cards WHERE circle_id = ? AND (from_id = ? OR to_id = ?)'),
  }
  return { st, tx, user: (id) => st.user.get(id) }
}

function createFamilyRouter({ db, store: givenStore, requireUser, now = () => Date.now() }) {
  const store = givenStore || createFamilyStore(db)
  const { st, tx } = store
  const router = express.Router()
  const json = express.json({ limit: '4kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const idOf = (req) => (/^\d{1,12}$/.test(req.params.id || '') ? Number(req.params.id) : 0)

  const shareOut = (row) => (row ? { fields: parse(row.fields, []), stats: parse(row.stats, {}), updatedAt: row.updated_at } : null)

  function view(uid) {
    const m = st.membership.get(uid)
    if (!m) return null
    const t = now()
    const owner = m.role === 'owner'
    return {
      id: m.circle_id, role: m.role, max: MAX_MEMBERS,
      members: st.members.all(m.circle_id).map((r) => ({
        id: r.user_id, label: personLabel(r), role: r.role, joinedAt: r.joined_at, self: r.user_id === uid,
        share: r.fields ? { fields: parse(r.fields, []), stats: parse(r.stats, {}), updatedAt: r.share_at } : null,
      })),
      invites: owner ? st.invites.all(m.circle_id, t).map((i) => ({ id: i.id, createdAt: i.created_at, expiresAt: i.expires_at })) : [],
    }
  }
  const cardsOut = (uid) => st.cardsFor.all(uid, MAX_CARDS_KEPT).map((c) => ({
    id: c.id, from: personLabel(c), fromId: c.from_id, template: c.template, n: c.n, createdAt: c.created_at, seen: c.seen_at != null,
  }))

  router.use('/family', (req, res, next) => { res.set('Cache-Control', 'no-store'); next() })

  router.get('/family', auth, (req, res) => {
    const uid = req.user.id
    const s = st.share.get(uid)
    res.json({
      circle: view(uid), cards: cardsOut(uid), share: shareOut(s), consent: Boolean(s),
      limits: { members: MAX_MEMBERS, invites: MAX_INVITES, fields: STAT_FIELDS, templates: CARD_TEMPLATES },
    })
  })

  router.post('/family', auth, (req, res) => {
    const uid = req.user.id
    const ok = tx(() => {
      if (st.membership.get(uid)) return false
      const id = Number(st.createCircle.run(uid, now()).lastInsertRowid)
      st.addMember.run(id, uid, 'owner', now())
      return true
    })
    if (!ok) return err(res, 409, 'in_circle', 'Already in a family circle')
    res.status(201).json({ circle: view(uid) })
  })

  router.delete('/family', auth, (req, res) => {
    const uid = req.user.id
    const m = st.membership.get(uid)
    if (!m) return err(res, 404, 'not_found', 'Not found')
    tx(() => {
      if (m.role === 'owner') st.deleteCircle.run(m.circle_id, uid)
      else { st.dropCardsOf.run(m.circle_id, uid, uid); st.removeMember.run(m.circle_id, uid) }
    })
    res.json({ ok: true })
  })

  const ownerCircle = (req, res) => {
    const m = st.membership.get(req.user.id)
    if (!m || m.role !== 'owner') { err(res, 403, 'owner_only', 'Only the circle owner can do this'); return null }
    return m
  }

  router.post('/family/invites', auth, (req, res) => {
    const m = ownerCircle(req, res); if (!m) return
    const t = now()
    if (st.memberCount.get(m.circle_id).n >= MAX_MEMBERS) return err(res, 409, 'circle_full', 'Circle is full')
    if (st.inviteCount.get(m.circle_id, t).n >= MAX_INVITES) return err(res, 409, 'too_many', 'Too many open invites')
    const token = crypto.randomBytes(32).toString('base64url')
    const id = Number(st.addInvite.run(m.circle_id, sha256(token), t, t + INVITE_TTL_MS).lastInsertRowid)
    res.status(201).json({ id, token, expiresAt: t + INVITE_TTL_MS })
  })

  router.delete('/family/invites/:id', auth, (req, res) => {
    const m = ownerCircle(req, res); if (!m) return
    const id = idOf(req)
    if (!id || !st.deleteInvite.run(id, m.circle_id).changes) return err(res, 404, 'not_found', 'Not found')
    res.json({ ok: true })
  })

  const inviteOf = (b) => {
    const t = b && typeof b.token === 'string' && TOKEN_RE.test(b.token) ? st.inviteByHash.get(sha256(b.token)) : null
    return t && t.expires_at > now() ? t : null
  }
  router.post('/family/join/preview', auth, json, (req, res) => {
    const inv = inviteOf(req.body)
    if (!inv) return err(res, 404, 'invalid_token', 'Invalid or expired invite')
    const mine = st.membership.get(req.user.id)
    res.json({
      ownerLabel: personLabel(st.user.get(inv.owner_id)), members: st.memberCount.get(inv.circle_id).n,
      inCircle: Boolean(mine), same: Boolean(mine && mine.circle_id === inv.circle_id),
    })
  })

  router.post('/family/join', auth, json, (req, res) => {
    const uid = req.user.id
    const inv = inviteOf(req.body)
    if (!inv) return err(res, 404, 'invalid_token', 'Invalid or expired invite')
    const r = tx(() => {
      const mine = st.membership.get(uid)
      if (mine) return mine.circle_id === inv.circle_id ? 'same' : 'in_circle'
      if (st.memberCount.get(inv.circle_id).n >= MAX_MEMBERS) return 'circle_full'
      st.deleteInvite.run(inv.id, inv.circle_id)   // birdəfəlik
      st.addMember.run(inv.circle_id, uid, 'member', now())
      return 'ok'
    })
    if (r === 'in_circle') return err(res, 409, 'in_circle', 'Already in a family circle')
    if (r === 'circle_full') return err(res, 409, 'circle_full', 'Circle is full')
    res.json({ circle: view(uid), already: r === 'same' })
  })

  router.delete('/family/members/:id', auth, (req, res) => {
    const m = ownerCircle(req, res); if (!m) return
    const id = idOf(req)
    if (!id || id === req.user.id) return err(res, 400, 'bad_request', 'Invalid member')
    const n = tx(() => {
      const c = st.removeMember.run(m.circle_id, id).changes
      if (c) st.dropCardsOf.run(m.circle_id, id, id)
      return c
    })
    if (!n) return err(res, 404, 'not_found', 'Not found')
    res.json({ ok: true })
  })

  router.put('/family/share', auth, json, (req, res) => {
    const uid = req.user.id
    const b = req.body || {}
    const cur = st.share.get(uid)
    if (!cur && b.consent !== true) return err(res, 400, 'consent_required', 'Consent required')
    const v = validShare(b)
    if (!v) return err(res, 400, 'bad_request', 'Invalid summary')
    const t = now()
    st.upsertShare.run(uid, JSON.stringify(v.fields), JSON.stringify(v.stats), cur ? cur.consent_at : t, t)
    res.json({ share: shareOut(st.share.get(uid)) })
  })

  router.delete('/family/share', auth, (req, res) => {
    st.deleteShare.run(req.user.id)
    res.json({ ok: true })
  })

  router.post('/family/cards', auth, json, (req, res) => {
    const uid = req.user.id
    const b = req.body || {}
    const m = st.membership.get(uid)
    if (!m) return err(res, 404, 'not_found', 'Not in a family circle')
    const to = Number(b.to)
    const target = Number.isInteger(to) && to !== uid ? st.membership.get(to) : null
    if (!target || target.circle_id !== m.circle_id) return err(res, 404, 'not_found', 'Unknown member')
    if (!CARD_TEMPLATES.includes(b.template)) return err(res, 400, 'bad_template', 'Unknown card')
    let n = null
    if (CARD_N_TEMPLATES.has(b.template) && b.n != null) {
      if (!Number.isInteger(b.n) || b.n < 1 || b.n > 999) return err(res, 400, 'bad_request', 'Invalid number')
      n = b.n
    }
    const t = now()
    if (st.cardsSentToday.get(uid, t - 24 * 3600e3).n >= MAX_CARDS_PER_DAY) return err(res, 429, 'rate_limited', 'Too many cards today')
    const id = tx(() => {
      const r = Number(st.addCard.run(m.circle_id, uid, to, b.template, n, t).lastInsertRowid)
      st.trimCards.run(to, to, MAX_CARDS_KEPT)
      return r
    })
    res.status(201).json({ card: { id, to, template: b.template, n, createdAt: t } })
  })

  router.post('/family/cards/seen', auth, json, (req, res) => {
    const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids.slice(0, MAX_CARDS_KEPT) : null
    if (!ids || ids.some((x) => !Number.isInteger(x) || x < 1)) return err(res, 400, 'bad_request', 'Invalid ids')
    const t = now()
    tx(() => { for (const id of ids) st.seen.run(t, id, req.user.id) })
    res.json({ ok: true })
  })

  router.delete('/family/cards/:id', auth, (req, res) => {
    const id = idOf(req)
    if (!id || !st.deleteCard.run(id, req.user.id).changes) return err(res, 404, 'not_found', 'Not found')
    res.json({ ok: true })
  })

  // eslint-disable-next-line no-unused-vars
  router.use('/family', (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    console.error('family error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  /** Köhnə dəvətlər və 60 gündən köhnə kartlar */
  router.purge = () => {
    const t = now()
    return st.purgeInvites.run(t).changes + st.purgeCards.run(t - CARD_TTL_MS).changes
  }
  router.store = store
  return router
}

module.exports = {
  createFamilyRouter, createFamilyStore, validShare, personLabel,
  STAT_FIELDS, CARD_TEMPLATES, MAX_MEMBERS, MAX_INVITES, INVITE_TTL_MS, MAX_CARDS_PER_DAY, MAX_CARDS_KEPT,
}
