// ═══════════════════════════════════════════════════════════════════════
// Ailə Ramazan lövhəsi — ailə dairəsinin (server/family.js) Ramazan əlavəsi (I3)
//
// • Yalnız Ramazan mövsümündə açıqdır (Ümmül-Qura — server/hijri.js): Şəbanın 20-sindən Şəvvalın
//   7-sinə qədər (hazırlıq + bayram həftəsi). Mövsüm hicri ilə (hyear) bağlanır; keçən ilin məlumatı
//   növbəti mövsümdə silinir.
// • Hər üzv RAZILIQLA öz rəqəmlərini paylaşır: tutduğu oruc sayı, bu Ramazan oxuduğu səhifə sayı
//   (klient hesablayır / üzv özü yazır). İstənilən vaxt gizlədə bilər — rəqəmlər silinir.
// • Ailə xətmi: 30 cüz üzvlər arasında — üzv cüzü götürür, oxuyanda "oxudum" deyir (ailədə kimin hansı
//   cüzü götürdüyü görünür — UI bunu əvvəlcədən deyir).
// • İftar növbəsi: üzvlər Ramazan günlərindən birini "mən qonaq edirəm" kimi seçir (tarix → ad).
// • Son on gecənin tək gecələri (21, 23, 25, 27, 29): sadəcə ortaq siyahı — hər üzv "bu gecə ibadətdə
//   olacağam / oldum" işarəsi qoyur; lövhədə gecə üzrə say. Dini iddia yoxdur.
// • Reytinq YOXDUR. Sərbəst mətn YOXDUR.
//
// Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS, user_version artmır); users(id) və
// family_circles(id) ON DELETE CASCADE. Dairədən çıxan üzvün sətirləri lövhədə görünmür (üzvlüklə
// JOIN) və təmizləmədə silinir.
//
//   GET    /api/family/ramadan                 → { season, circle?, … }
//   PUT    /api/family/ramadan/share           { consent?, fasts, pages } → lövhə
//   DELETE /api/family/ramadan/share           → gizlət (rəqəmlər silinir)
//   POST   /api/family/ramadan/juz             { juz, action: take|release|done|undone }
//   POST   /api/family/ramadan/iftar           { day, on }
//   POST   /api/family/ramadan/qadr            { night, on }
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')
const hijri = require('./hijri')
const { personLabel } = require('./family')

const NIGHTS = [21, 23, 25, 27, 29]
const MAX_PAGES = 10000
const MAX_JUZ_OPEN = 5

const SCHEMA = `
CREATE TABLE IF NOT EXISTS family_ramadan (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  circle_id  INTEGER NOT NULL REFERENCES family_circles(id) ON DELETE CASCADE,
  hyear      INTEGER NOT NULL,
  fasts      INTEGER NOT NULL DEFAULT 0,
  pages      INTEGER NOT NULL DEFAULT 0,
  consent_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS family_ramadan_juz (
  circle_id INTEGER NOT NULL REFERENCES family_circles(id) ON DELETE CASCADE,
  hyear     INTEGER NOT NULL,
  juz       INTEGER NOT NULL CHECK (juz BETWEEN 1 AND 30),
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  done_at   INTEGER,
  PRIMARY KEY (circle_id, hyear, juz)
);
CREATE TABLE IF NOT EXISTS family_ramadan_iftar (
  circle_id INTEGER NOT NULL REFERENCES family_circles(id) ON DELETE CASCADE,
  hyear     INTEGER NOT NULL,
  day       TEXT NOT NULL,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (circle_id, day)
);
CREATE TABLE IF NOT EXISTS family_ramadan_qadr (
  circle_id INTEGER NOT NULL REFERENCES family_circles(id) ON DELETE CASCADE,
  hyear     INTEGER NOT NULL,
  night     INTEGER NOT NULL,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (circle_id, hyear, night, user_id)
);
`

const keyOf = (ms) => new Date(ms).toISOString().slice(0, 10)

/**
 * 'YYYY-MM-DD' (UTC günü) → Ramazan mövsümü:
 *   { open, hyear, start, end, days:[…], today, phase: 'before'|'ramadan'|'after' | null, next? }
 * Açıq pəncərə: 20 Şəban — 7 Şəvval.
 */
function seasonOf(todayKey) {
  const g = hijri.parseGKey(todayKey)
  if (!g) return { open: false }
  const h = hijri.gregorianToHijri(g)
  const hyear = h.month <= 9 || (h.month === 10 && h.day <= 7) ? h.year : h.year + 1
  const startG = hijri.hijriToGregorian({ year: hyear, month: 9, day: 1 })
  const len = hijri.hijriMonthLength(hyear, 9)
  const days = []
  for (let i = 0; i < len; i++) days.push(hijri.gKey(hijri.addGDays(startG, i)))
  const open = (h.month === 8 && h.day >= 20) || h.month === 9 || (h.month === 10 && h.day <= 7)
  const phase = !open ? null : h.month === 8 ? 'before' : h.month === 9 ? 'ramadan' : 'after'
  return { open, hyear, start: days[0], end: days[days.length - 1], days, today: todayKey, phase, hijriDay: h.month === 9 ? h.day : null }
}

function createFamilyRamadanRouter({ db, requireUser, now = () => Date.now(), log = console }) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const p = (sql) => raw.prepare(sql)
  const st = {
    membership: p('SELECT circle_id, role FROM family_members WHERE user_id = ?'),
    members: p(`SELECT m.user_id, m.role, u.email, u.display_name, r.fasts, r.pages, r.updated_at
      FROM family_members m JOIN users u ON u.id = m.user_id
      LEFT JOIN family_ramadan r ON r.user_id = m.user_id AND r.circle_id = m.circle_id AND r.hyear = ?
      WHERE m.circle_id = ? ORDER BY m.role DESC, m.joined_at`),
    share: p('SELECT * FROM family_ramadan WHERE user_id = ?'),
    upsert: p(`INSERT INTO family_ramadan (user_id, circle_id, hyear, fasts, pages, consent_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        consent_at = CASE WHEN family_ramadan.circle_id <> excluded.circle_id OR family_ramadan.hyear <> excluded.hyear THEN excluded.consent_at ELSE family_ramadan.consent_at END,
        circle_id = excluded.circle_id, hyear = excluded.hyear, fasts = excluded.fasts, pages = excluded.pages, updated_at = excluded.updated_at`),
    unshare: p('DELETE FROM family_ramadan WHERE user_id = ?'),
    juz: p(`SELECT j.juz, j.user_id, j.done_at FROM family_ramadan_juz j
      JOIN family_members m ON m.user_id = j.user_id AND m.circle_id = j.circle_id WHERE j.circle_id = ? AND j.hyear = ?`),
    juzOne: p('SELECT * FROM family_ramadan_juz WHERE circle_id = ? AND hyear = ? AND juz = ?'),
    juzTake: p('INSERT INTO family_ramadan_juz (circle_id, hyear, juz, user_id) VALUES (?, ?, ?, ?) ON CONFLICT(circle_id, hyear, juz) DO UPDATE SET user_id = excluded.user_id, done_at = NULL'),
    juzRelease: p('DELETE FROM family_ramadan_juz WHERE circle_id = ? AND hyear = ? AND juz = ? AND user_id = ?'),
    juzDone: p('UPDATE family_ramadan_juz SET done_at = ? WHERE circle_id = ? AND hyear = ? AND juz = ? AND user_id = ?'),
    myOpenJuz: p('SELECT COUNT(*) AS n FROM family_ramadan_juz WHERE circle_id = ? AND hyear = ? AND user_id = ? AND done_at IS NULL'),
    isMember: p('SELECT 1 AS x FROM family_members WHERE circle_id = ? AND user_id = ?'),
    iftar: p(`SELECT f.day, f.user_id FROM family_ramadan_iftar f
      JOIN family_members m ON m.user_id = f.user_id AND m.circle_id = f.circle_id WHERE f.circle_id = ? AND f.hyear = ? ORDER BY f.day`),
    iftarOne: p('SELECT * FROM family_ramadan_iftar WHERE circle_id = ? AND day = ?'),
    iftarSet: p('INSERT INTO family_ramadan_iftar (circle_id, hyear, day, user_id) VALUES (?, ?, ?, ?) ON CONFLICT(circle_id, day) DO UPDATE SET user_id = excluded.user_id, hyear = excluded.hyear'),
    iftarDel: p('DELETE FROM family_ramadan_iftar WHERE circle_id = ? AND day = ? AND user_id = ?'),
    qadr: p(`SELECT q.night, q.user_id FROM family_ramadan_qadr q
      JOIN family_members m ON m.user_id = q.user_id AND m.circle_id = q.circle_id WHERE q.circle_id = ? AND q.hyear = ?`),
    qadrSet: p('INSERT OR IGNORE INTO family_ramadan_qadr (circle_id, hyear, night, user_id) VALUES (?, ?, ?, ?)'),
    qadrDel: p('DELETE FROM family_ramadan_qadr WHERE circle_id = ? AND hyear = ? AND night = ? AND user_id = ?'),
    purge: [
      'DELETE FROM family_ramadan WHERE hyear < ?',
      'DELETE FROM family_ramadan_juz WHERE hyear < ?',
      'DELETE FROM family_ramadan_iftar WHERE hyear < ?',
      'DELETE FROM family_ramadan_qadr WHERE hyear < ?',
    ].map(p),
    orphans: [
      'DELETE FROM family_ramadan WHERE NOT EXISTS (SELECT 1 FROM family_members m WHERE m.user_id = family_ramadan.user_id AND m.circle_id = family_ramadan.circle_id)',
      'DELETE FROM family_ramadan_juz WHERE NOT EXISTS (SELECT 1 FROM family_members m WHERE m.user_id = family_ramadan_juz.user_id AND m.circle_id = family_ramadan_juz.circle_id)',
      'DELETE FROM family_ramadan_iftar WHERE NOT EXISTS (SELECT 1 FROM family_members m WHERE m.user_id = family_ramadan_iftar.user_id AND m.circle_id = family_ramadan_iftar.circle_id)',
      'DELETE FROM family_ramadan_qadr WHERE NOT EXISTS (SELECT 1 FROM family_members m WHERE m.user_id = family_ramadan_qadr.user_id AND m.circle_id = family_ramadan_qadr.circle_id)',
    ].map(p),
  }
  const router = express.Router()
  const json = express.json({ limit: '2kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const season = () => seasonOf(keyOf(now()))

  function boardOf(uid) {
    const s = season()
    const m = st.membership.get(uid)
    const seasonOut = { open: s.open, hyear: s.hyear, start: s.start, end: s.end, phase: s.phase, today: s.today, hijriDay: s.hijriDay }
    if (!m) return { season: seasonOut, circle: null }
    if (!s.open) return { season: seasonOut, circle: { id: m.circle_id } }
    const rows = st.members.all(s.hyear, m.circle_id)
    const label = new Map(rows.map((r) => [r.user_id, personLabel(r)]))
    const mine = st.share.get(uid)
    const myShare = mine && mine.circle_id === m.circle_id && mine.hyear === s.hyear ? mine : null
    const juz = new Map(st.juz.all(m.circle_id, s.hyear).map((r) => [r.juz, r]))
    const iftar = new Map(st.iftar.all(m.circle_id, s.hyear).map((r) => [r.day, r]))
    const qadr = st.qadr.all(m.circle_id, s.hyear)
    return {
      season: seasonOut,
      circle: { id: m.circle_id, role: m.role },
      members: rows.map((r) => ({
        id: r.user_id, label: label.get(r.user_id), self: r.user_id === uid,
        share: r.updated_at != null ? { fasts: r.fasts, pages: r.pages, updatedAt: r.updated_at } : null,
      })),
      consent: Boolean(myShare),
      mine: myShare ? { fasts: myShare.fasts, pages: myShare.pages } : null,
      juz: Array.from({ length: 30 }, (_, i) => {
        const r = juz.get(i + 1)
        return { juz: i + 1, by: r ? label.get(r.user_id) : null, mine: Boolean(r && r.user_id === uid), done: Boolean(r && r.done_at) }
      }),
      iftar: s.days.map((d, i) => {
        const r = iftar.get(d)
        return { day: d, n: i + 1, by: r ? label.get(r.user_id) : null, mine: Boolean(r && r.user_id === uid) }
      }),
      qadr: NIGHTS.map((n) => ({ night: n, count: qadr.filter((q) => q.night === n).length, mine: qadr.some((q) => q.night === n && q.user_id === uid) })),
      total: rows.length,
    }
  }
  /** Yazı üçün: dairə + açıq mövsüm */
  const ctx = (req, res) => {
    const m = st.membership.get(req.user.id)
    if (!m) { err(res, 404, 'not_found', 'Not in a family circle'); return null }
    const s = season()
    if (!s.open) { err(res, 409, 'not_ramadan', 'The Ramadan board is closed'); return null }
    return { circle: m.circle_id, s }
  }

  router.use('/family/ramadan', (req, res, next) => { res.set('Cache-Control', 'no-store'); next() })

  router.get('/family/ramadan', auth, (req, res) => res.json(boardOf(req.user.id)))

  router.put('/family/ramadan/share', auth, json, (req, res) => {
    const c = ctx(req, res); if (!c) return
    const b = req.body || {}
    const cur = st.share.get(req.user.id)
    const fresh = !cur || cur.circle_id !== c.circle || cur.hyear !== c.s.hyear
    if (fresh && b.consent !== true) return err(res, 400, 'consent_required', 'Consent required')
    const { fasts, pages } = b
    if (!Number.isInteger(fasts) || fasts < 0 || fasts > 30 || !Number.isInteger(pages) || pages < 0 || pages > MAX_PAGES) return err(res, 400, 'bad_request', 'Invalid numbers')
    st.upsert.run(req.user.id, c.circle, c.s.hyear, fasts, pages, now(), now())
    res.json(boardOf(req.user.id))
  })

  router.delete('/family/ramadan/share', auth, (req, res) => {
    st.unshare.run(req.user.id)
    res.json(boardOf(req.user.id))
  })

  router.post('/family/ramadan/juz', auth, json, (req, res) => {
    const c = ctx(req, res); if (!c) return
    const uid = req.user.id
    const { juz, action } = req.body || {}
    if (!Number.isInteger(juz) || juz < 1 || juz > 30 || !['take', 'release', 'done', 'undone'].includes(action)) return err(res, 400, 'bad_request', 'Invalid juz')
    const r = tx(() => {
      const cur = st.juzOne.get(c.circle, c.s.hyear, juz)
      // Dairədən çıxmış üzvün cüzü sərbəstdir
      const holder = cur && st.isMember.get(c.circle, cur.user_id) ? cur.user_id : null
      if (action === 'take') {
        if (holder) return holder === uid ? 'ok' : 'taken'
        if (st.myOpenJuz.get(c.circle, c.s.hyear, uid).n >= MAX_JUZ_OPEN) return 'too_many'
        st.juzTake.run(c.circle, c.s.hyear, juz, uid)
        return 'ok'
      }
      if (holder !== uid) return 'not_mine'
      if (action === 'release') st.juzRelease.run(c.circle, c.s.hyear, juz, uid)
      else st.juzDone.run(action === 'done' ? now() : null, c.circle, c.s.hyear, juz, uid)
      return 'ok'
    })
    if (r === 'taken') return err(res, 409, 'taken', 'Already taken')
    if (r === 'too_many') return err(res, 409, 'too_many', 'Finish your juz first')
    if (r === 'not_mine') return err(res, 403, 'not_mine', 'Not your juz')
    res.json(boardOf(uid))
  })

  router.post('/family/ramadan/iftar', auth, json, (req, res) => {
    const c = ctx(req, res); if (!c) return
    const uid = req.user.id
    const { day, on } = req.body || {}
    if (typeof on !== 'boolean' || !c.s.days.includes(day)) return err(res, 400, 'bad_request', 'Invalid day')
    const r = tx(() => {
      const cur = st.iftarOne.get(c.circle, day)
      const holder = cur && st.isMember.get(c.circle, cur.user_id) ? cur.user_id : null
      if (on) {
        if (holder && holder !== uid) return 'taken'
        st.iftarSet.run(c.circle, c.s.hyear, day, uid)
      } else if (holder === uid) st.iftarDel.run(c.circle, day, uid)
      return 'ok'
    })
    if (r === 'taken') return err(res, 409, 'taken', 'Someone is already hosting')
    res.json(boardOf(uid))
  })

  router.post('/family/ramadan/qadr', auth, json, (req, res) => {
    const c = ctx(req, res); if (!c) return
    const { night, on } = req.body || {}
    if (!NIGHTS.includes(night) || typeof on !== 'boolean') return err(res, 400, 'bad_request', 'Invalid night')
    if (on) st.qadrSet.run(c.circle, c.s.hyear, night, req.user.id)
    else st.qadrDel.run(c.circle, c.s.hyear, night, req.user.id)
    res.json(boardOf(req.user.id))
  })

  // eslint-disable-next-line no-unused-vars
  router.use('/family/ramadan', (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    log.error('family ramadan error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  /** Keçən mövsümlər (hyear < cari) və dairədən çıxmış üzvlərin sətirləri */
  router.purge = () => {
    const s = season()
    let n = 0
    tx(() => {
      for (const q of st.purge) n += q.run(s.hyear).changes
      for (const q of st.orphans) n += q.run().changes
    })
    return n
  }
  router.exportUser = (uid) => {
    const mine = st.share.get(uid)
    const own = (sql) => raw.prepare(sql).all(uid)
    return {
      share: mine ? { hyear: mine.hyear, fasts: mine.fasts, pages: mine.pages, consentAt: mine.consent_at, updatedAt: mine.updated_at } : null,
      juz: own('SELECT hyear, juz, done_at AS doneAt FROM family_ramadan_juz WHERE user_id = ?'),
      iftar: own('SELECT hyear, day FROM family_ramadan_iftar WHERE user_id = ?'),
      qadr: own('SELECT hyear, night FROM family_ramadan_qadr WHERE user_id = ?'),
    }
  }
  router.summaryUser = (uid) => {
    const e = router.exportUser(uid)
    return { sharing: Boolean(e.share), juz: e.juz.length, iftar: e.iftar.length, qadr: e.qadr.length }
  }
  return router
}

module.exports = { createFamilyRamadanRouter, seasonOf, NIGHTS }
