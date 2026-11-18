// ═══════════════════════════════════════════════════════════════════════
// K4. Məscid nümayəndəsinin paneli + məscid ekranının "məscidə qoşul" rejimi
//
// • Saytın İSTİFADƏÇİ hesabında rolu `mosque_rep` və bağlı `mosque_id` olan şəxs (server/users.js — rolu
//   admin paneli verir) YALNIZ ÖZ məscidini idarə edir: iqamə (hər namaz: azandan N dəq. və ya sabit saat),
//   Cümə xütbəsinin vaxtı + mövzusu, elanlar (≤500, son tarixlə), Ramazan iftar proqramı qeydi.
//   mosque_id heç vaxt sorğudan götürülmür — həmişə req.user.mosque_id.
// • İctimai: GET /api/mosques/:id/live — məscid ekranı (/mosque-tv?m=<id>) 60 saniyədə bir soruşur;
//   ETag (W/"<versiya>-<gün>") → 304. Aktiv nümayəndəsi olmayan məscid → 404 (ekran yerli rejimdə qalır).
//   GET /api/mosques/verified?ids=… — məscid axtarışında "təsdiqlənmiş nümayəndə" nişanı (≤60 id).
// • Admin paneli (editor+): bütün məscid məlumatına baxır, elanı və ya məlumatı silir.
// • Mətnlərdən keçidlər silinir (communityKit.stripLinks); hamısı düz mətndir.
//
// Cədvəllər MİQRASİYASIZ: mosque_info (məscid üzrə; updated_by → users ON DELETE SET NULL — bir
// nümayəndənin hesabı silinəndə məscidin cədvəli qalır), mosque_announcements (author → CASCADE).
//
// Endpoint-lər:
//   GET    /api/mosque-rep                       (mosque_rep) → { mosqueId, info, announcements, limits }
//   PUT    /api/mosque-rep                       (mosque_rep) { name?, iqama, jumuah, ramadanNote } → { info }
//   POST   /api/mosque-rep/announcements         (mosque_rep) { body, expiresOn } → 201 { announcement }
//   DELETE /api/mosque-rep/announcements/:id     (mosque_rep, öz məscidi) → { ok }
//   GET    /api/mosques/:id/live                 (girişsiz, ETag)
//   GET    /api/mosques/verified?ids=            (girişsiz)
//   GET    /api/admin/mosques                    (panel, editor+)
//   DELETE /api/admin/mosques/:id                (panel, editor+) — məlumat + elanlar
//   DELETE /api/admin/mosques/:id/announcements/:aid
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')
const kit = require('./communityKit')

const MOSQUE_RE = /^[A-Za-z0-9_-]{1,64}$/
const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_OFFSET = 180
const MAX_ANN = 500
const MAX_ACTIVE_ANN = 10
const MAX_ANN_PER_DAY = 20
const MAX_ANN_DAYS = 60
const MAX_TOPIC = 120
const MAX_NOTE = 500
const MAX_NAME = 80
const DAY = 86400000

const SCHEMA = `
CREATE TABLE IF NOT EXISTS mosque_info (
  mosque_id    TEXT PRIMARY KEY,
  name         TEXT NOT NULL DEFAULT '',
  iqama        TEXT NOT NULL DEFAULT '{}',
  jumuah_time  TEXT NOT NULL DEFAULT '',
  jumuah_topic TEXT NOT NULL DEFAULT '',
  ramadan_note TEXT NOT NULL DEFAULT '',
  updated_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  version      INTEGER NOT NULL DEFAULT 1,
  updated_at   INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS mosque_announcements (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  mosque_id  TEXT NOT NULL,
  author_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  expires_on TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS mosque_announcements_by_mosque ON mosque_announcements(mosque_id, expires_on);
CREATE INDEX IF NOT EXISTS mosque_announcements_by_author ON mosque_announcements(author_id, created_at);
`

const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10)
const addDays = (key, n) => isoDay(Date.parse(key + 'T12:00:00Z') + n * DAY)
const parse = (s, fb) => { try { return JSON.parse(s) } catch { return fb } }

/** İqamə qaydası: null (qoyulmayıb) | 0…180 dəq. | 'HH:MM' */
function validRule(v) {
  if (v == null || v === '') return { ok: true, v: null }
  if (Number.isInteger(v) && v >= 0 && v <= MAX_OFFSET) return { ok: true, v }
  if (typeof v === 'string' && TIME_RE.test(v)) return { ok: true, v }
  return { ok: false }
}
function validInfo(b) {
  if (!b || typeof b !== 'object') return null
  const iq = b.iqama && typeof b.iqama === 'object' && !Array.isArray(b.iqama) ? b.iqama : {}
  const iqama = {}
  for (const k of PRAYERS) {
    const r = validRule(iq[k])
    if (!r.ok) return null
    if (r.v != null) iqama[k] = r.v
  }
  const j = b.jumuah && typeof b.jumuah === 'object' ? b.jumuah : {}
  const time = j.time == null || j.time === '' ? '' : (typeof j.time === 'string' && TIME_RE.test(j.time) ? j.time : null)
  if (time == null) return null
  const line = (v, max) => { const s = kit.cleanLine(v, max * 2); if (s == null) return null; const t = kit.stripLinks(s); return [...t].length <= max ? t : null }
  const topic = line(j.topic, MAX_TOPIC)
  const name = line(b.name, MAX_NAME)
  const noteRaw = kit.cleanText(b.ramadanNote, MAX_NOTE * 2)
  const note = noteRaw == null ? null : kit.stripLinks(noteRaw)
  if (topic == null || name == null || note == null || [...note].length > MAX_NOTE) return null
  return { name, iqama, jumuahTime: time, jumuahTopic: topic, ramadanNote: note }
}

function createMosqueRepRouter({ db, requireUser, requireEditor = null, now = () => Date.now() }) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const p = (sql) => raw.prepare(sql)
  const st = {
    info: p('SELECT * FROM mosque_info WHERE mosque_id = ?'),
    upsert: p(`INSERT INTO mosque_info (mosque_id, name, iqama, jumuah_time, jumuah_topic, ramadan_note, updated_by, version, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?) ON CONFLICT(mosque_id) DO UPDATE SET name = excluded.name, iqama = excluded.iqama,
      jumuah_time = excluded.jumuah_time, jumuah_topic = excluded.jumuah_topic, ramadan_note = excluded.ramadan_note,
      updated_by = excluded.updated_by, version = mosque_info.version + 1, updated_at = excluded.updated_at`),
    touch: p(`INSERT INTO mosque_info (mosque_id, updated_by, version, updated_at) VALUES (?, ?, 1, ?)
      ON CONFLICT(mosque_id) DO UPDATE SET version = mosque_info.version + 1, updated_at = excluded.updated_at`),
    // İctimai: yalnız bloklanmamış (disabled = 0) müəlliflərin elanları
    active: p(`SELECT id, body, expires_on, created_at FROM mosque_announcements WHERE mosque_id = ? AND expires_on >= ?
      AND author_id IN (SELECT id FROM users WHERE disabled = 0) ORDER BY created_at DESC LIMIT ?`),
    all: p('SELECT id, body, expires_on, created_at FROM mosque_announcements WHERE mosque_id = ? ORDER BY created_at DESC LIMIT 50'),
    activeCount: p('SELECT COUNT(*) AS n FROM mosque_announcements WHERE mosque_id = ? AND expires_on >= ?'),
    todayBy: p('SELECT COUNT(*) AS n FROM mosque_announcements WHERE author_id = ? AND created_at > ?'),
    addAnn: p('INSERT INTO mosque_announcements (mosque_id, author_id, body, expires_on, created_at) VALUES (?, ?, ?, ?, ?)'),
    delAnn: p('DELETE FROM mosque_announcements WHERE id = ? AND mosque_id = ?'),
    delInfo: p('DELETE FROM mosque_info WHERE mosque_id = ?'),
    delAnnsOf: p('DELETE FROM mosque_announcements WHERE mosque_id = ?'),
    reps: p("SELECT COUNT(*) AS n FROM users WHERE role = 'mosque_rep' AND mosque_id = ? AND disabled = 0"),
    list: p(`SELECT i.*, (SELECT COUNT(*) FROM users u WHERE u.role = 'mosque_rep' AND u.mosque_id = i.mosque_id AND u.disabled = 0) AS reps
      FROM mosque_info i ORDER BY i.updated_at DESC LIMIT 200`),
    purge: p('DELETE FROM mosque_announcements WHERE expires_on < ?'),
    annsBy: p('SELECT id, mosque_id, body, expires_on, created_at FROM mosque_announcements WHERE author_id = ? ORDER BY created_at DESC'),
    infosBy: p('SELECT mosque_id, updated_at FROM mosque_info WHERE updated_by = ?'),
  }
  const router = express.Router()
  const json = express.json({ limit: '8kb' })
  const rep = requireUser('mosque_rep')
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const today = () => isoDay(now())

  const infoOut = (r) => (r ? {
    name: r.name, iqama: parse(r.iqama, {}), jumuah: { time: r.jumuah_time, topic: r.jumuah_topic },
    ramadanNote: r.ramadan_note, updatedAt: r.updated_at, version: r.version,
  } : null)
  const annOut = (a) => ({ id: a.id, body: a.body, expiresOn: a.expires_on, createdAt: a.created_at })

  /** Nümayəndənin məscidi (rol ≥ mosque_rep + bağlı mosque_id) */
  const mosqueOf = (req, res) => {
    const id = req.user.role === 'mosque_rep' ? req.user.mosque_id : null
    if (!id || !MOSQUE_RE.test(id)) { err(res, 403, 'no_mosque', 'No mosque is linked to this account'); return null }
    return id
  }

  router.get('/mosque-rep', rep, (req, res) => {
    const id = mosqueOf(req, res); if (!id) return
    res.json({
      mosqueId: id, info: infoOut(st.info.get(id)), announcements: st.all.all(id).map(annOut), today: today(),
      limits: { announcement: MAX_ANN, active: MAX_ACTIVE_ANN, days: MAX_ANN_DAYS, topic: MAX_TOPIC, note: MAX_NOTE, name: MAX_NAME, offset: MAX_OFFSET },
    })
  })

  router.put('/mosque-rep', rep, json, (req, res) => {
    const id = mosqueOf(req, res); if (!id) return
    const v = validInfo(req.body)
    if (!v) return err(res, 400, 'bad_request', 'Invalid mosque info')
    st.upsert.run(id, v.name, JSON.stringify(v.iqama), v.jumuahTime, v.jumuahTopic, v.ramadanNote, req.user.id, now())
    res.json({ info: infoOut(st.info.get(id)) })
  })

  router.post('/mosque-rep/announcements', rep, json, (req, res) => {
    const id = mosqueOf(req, res); if (!id) return
    const b = req.body || {}
    const rawBody = kit.cleanText(b.body, MAX_ANN * 2, { required: true })
    const body = rawBody == null ? null : kit.stripLinks(rawBody)
    if (!body || [...body].length > MAX_ANN) return err(res, 400, 'bad_request', 'Invalid text')
    const d = today()
    if (typeof b.expiresOn !== 'string' || !DATE_RE.test(b.expiresOn) || b.expiresOn < d || b.expiresOn > addDays(d, MAX_ANN_DAYS)) {
      return err(res, 400, 'bad_date', 'Invalid expiry date')
    }
    const t = now()
    if (st.todayBy.get(req.user.id, t - DAY).n >= MAX_ANN_PER_DAY) return err(res, 429, 'rate_limited', 'Too many today')
    if (st.activeCount.get(id, d).n >= MAX_ACTIVE_ANN) return err(res, 409, 'too_many', 'Too many active announcements')
    const aid = tx(() => {
      const r = Number(st.addAnn.run(id, req.user.id, body, b.expiresOn, t).lastInsertRowid)
      st.touch.run(id, req.user.id, t)
      return r
    })
    res.status(201).json({ announcement: { id: aid, body, expiresOn: b.expiresOn, createdAt: t } })
  })

  router.delete('/mosque-rep/announcements/:id', rep, (req, res) => {
    const id = mosqueOf(req, res); if (!id) return
    const aid = /^\d{1,12}$/.test(req.params.id) ? Number(req.params.id) : 0
    const n = tx(() => { const c = aid ? st.delAnn.run(aid, id).changes : 0; if (c) st.touch.run(id, req.user.id, now()); return c })
    if (!n) return err(res, 404, 'not_found', 'Not found')
    res.json({ ok: true })
  })

  // ── İctimai ──
  const live = (id) => {
    if (!MOSQUE_RE.test(id || '') || !st.reps.get(id).n) return null
    const r = st.info.get(id)
    if (!r) return null
    return { r, anns: st.active.all(id, today(), MAX_ACTIVE_ANN) }
  }
  router.get('/mosques/verified', (req, res) => {
    const ids = String(req.query.ids || '').split(',').filter((x) => MOSQUE_RE.test(x)).slice(0, 60)
    const out = {}
    for (const id of new Set(ids)) {
      const l = live(id)
      if (l) out[id] = { name: l.r.name, jumuah: { time: l.r.jumuah_time, topic: l.r.jumuah_topic }, ramadanNote: l.r.ramadan_note, announcements: l.anns.map(annOut) }
    }
    res.set('Cache-Control', 'public, max-age=60')
    res.json({ mosques: out })
  })
  router.get('/mosques/:id/live', (req, res) => {
    const l = live(req.params.id)
    if (!l) { res.set('Cache-Control', 'public, max-age=60'); return err(res, 404, 'not_found', 'Not found') }
    // Elan siyahısı da daxildir: müəllif bloklananda versiya dəyişmir, amma elanlar yox olur
    const etag = `W/"m${l.r.version}-${today()}-${l.anns.map((a) => a.id).join('.')}"`
    res.set({ ETag: etag, 'Cache-Control': 'no-cache' })
    if (String(req.headers['if-none-match'] || '').split(/\s*,\s*/).includes(etag)) return res.status(304).end()
    res.json({ mosqueId: req.params.id, verified: true, ...infoOut(l.r), announcements: l.anns.map(annOut) })
  })

  // ── Admin paneli (editor+) ──
  if (requireEditor) {
    router.get('/admin/mosques', ...requireEditor, (req, res) => {
      res.json({ items: st.list.all().map((r) => ({ mosqueId: r.mosque_id, reps: r.reps, ...infoOut(r), announcements: st.all.all(r.mosque_id).map(annOut) })) })
    })
    router.delete('/admin/mosques/:id', ...requireEditor, (req, res) => {
      const id = req.params.id
      if (!MOSQUE_RE.test(id)) return err(res, 400, 'bad_request', 'Bad id')
      const n = tx(() => st.delInfo.run(id).changes + st.delAnnsOf.run(id).changes)
      if (!n) return err(res, 404, 'not_found', 'Not found')
      res.json({ ok: true })
    })
    router.delete('/admin/mosques/:id/announcements/:aid', ...requireEditor, (req, res) => {
      const id = req.params.id
      const aid = /^\d{1,12}$/.test(req.params.aid) ? Number(req.params.aid) : 0
      if (!MOSQUE_RE.test(id) || !aid) return err(res, 400, 'bad_request', 'Bad id')
      const n = tx(() => { const c = st.delAnn.run(aid, id).changes; if (c) st.touch.run(id, null, now()); return c })
      if (!n) return err(res, 404, 'not_found', 'Not found')
      res.json({ ok: true })
    })
  }

  // eslint-disable-next-line no-unused-vars
  router.use(['/mosque-rep', '/mosques', '/admin/mosques'], (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    console.error('mosque rep error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  /** Vaxtı 30 gündən çox keçmiş elanlar */
  router.purge = () => st.purge.run(addDays(today(), -30)).changes
  router.exportUser = (uid) => ({
    announcements: st.annsBy.all(uid).map((a) => ({ id: a.id, mosqueId: a.mosque_id, body: a.body, expiresOn: a.expires_on, createdAt: a.created_at })),
    mosqueInfoUpdated: st.infosBy.all(uid).map((r) => ({ mosqueId: r.mosque_id, updatedAt: r.updated_at })),
  })
  router.summaryUser = (uid) => ({ announcements: st.annsBy.all(uid).length, mosques: st.infosBy.all(uid).length })
  return router
}

module.exports = { createMosqueRepRouter, validInfo, validRule, MOSQUE_RE, MAX_ANN, MAX_ACTIVE_ANN, MAX_ANN_DAYS }
