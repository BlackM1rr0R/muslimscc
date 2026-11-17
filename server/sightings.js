// ═══════════════════════════════════════════════════════════════════════
// Hilal müşahidələri — "Hilalı gördüm / baxdım, görmədim" xəritəsi (anonim)
//
//   POST /api/sightings  { lat, lng, seen: true|false, method: 'eye'|'binoculars'|'telescope'|'camera' } → 204
//   GET  /api/sightings?date=YYYY-MM-DD
//        → { date, from, to, cells: [{ lat, lng, seen, notSeen, methods: { eye, binoculars, telescope, camera } }] }
//
// • Saxlanan: yalnız 1°-lik xana (≈110 km), müşahidə AXŞAMININ tarixi (UTC 'YYYY-MM-DD'),
//   gördü/görmədi, üsul və saat dəqiqliyində zaman ('YYYY-MM-DDTHH'). IP, şəxs, dəqiq yer YOXDUR.
// • Axşamın tarixi xananın uzunluğundan hesablanır: yerli günəş vaxtı = UTC + lng/15 saat;
//   yerli günortadan növbəti günortaya qədər olan hər şey həmin günün axşamına aiddir
//   (Amerikada axşam UTC-də artıq ertəsi gün olur — belə qeydlər düzgün axşama düşür).
// • Bir IP heşi → gündə bir qeyd (yaddaşda, gün dəyişəndə silinir; IP-nin özü saxlanmır).
// • Cədvəl MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS, user_version artmır) — geri qaytarma
//   pozulmur (2026-11-04 dərsi). GET: seçilmiş tarix ±1 gün, cavab 30 s keşlənir.
// • Bu, müşahidə xəritəsidir, hökm deyil: ayın başlanğıcını yerli dini qurum elan edir.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')

const METHODS = ['eye', 'binoculars', 'telescope', 'camera']
const CACHE_MS = 30 * 1000
const DAY_MS = 86400000
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10)
/** 1°-lik xana: enlik [−90, 90], uzunluq [−180, 179] */
const cellOf = (lat, lng) => [Math.round(lat), ((Math.round(lng) + 540) % 360) - 180]
/** Müşahidə axşamının tarixi: yerli günəş vaxtı − 12 saat (günortadan günortaya) */
const eveningOf = (ms, lng) => dayOf(ms + lng * 240000 - 12 * 3600000)

function createSightingsRouter({ db, now = () => Date.now() }) {
  const raw = db.raw || db
  raw.exec(`CREATE TABLE IF NOT EXISTS hilal_sightings (
    day    TEXT NOT NULL,
    lat    INTEGER NOT NULL,
    lng    INTEGER NOT NULL,
    seen   INTEGER NOT NULL,
    method TEXT NOT NULL,
    hour   TEXT NOT NULL
  )`)
  raw.exec('CREATE INDEX IF NOT EXISTS hilal_sightings_day ON hilal_sightings (day)')
  const q = {
    add: raw.prepare('INSERT INTO hilal_sightings (day, lat, lng, seen, method, hour) VALUES (?, ?, ?, ?, ?, ?)'),
    range: raw.prepare(`SELECT lat, lng, seen, method, COUNT(*) AS n FROM hilal_sightings
      WHERE day >= ? AND day <= ? GROUP BY lat, lng, seen, method`),
  }

  // Gündə bir qeyd: IP heşi → (UTC günü dəyişəndə hamısı silinir)
  const once = new Set()
  let onceDay = dayOf(now())
  const firstToday = (ip) => {
    const d = dayOf(now())
    if (d !== onceDay) { once.clear(); onceDay = d }
    const k = crypto.createHash('sha256').update(`hr:${String(ip || '')}`).digest('base64url').slice(0, 16)
    if (once.has(k)) return false
    once.add(k)
    return true
  }

  const cache = new Map()   // date → { at, body }
  const aggregate = (date) => {
    const t = now()
    const hit = cache.get(date)
    if (hit && t - hit.at < CACHE_MS) return hit.body
    const mid = Date.parse(`${date}T00:00:00Z`)
    const from = dayOf(mid - DAY_MS), to = dayOf(mid + DAY_MS)
    const byCell = new Map()
    for (const r of q.range.all(from, to)) {
      const k = `${r.lat},${r.lng}`
      let c = byCell.get(k)
      if (!c) { c = { lat: Number(r.lat), lng: Number(r.lng), seen: 0, notSeen: 0, methods: Object.fromEntries(METHODS.map(m => [m, 0])) }; byCell.set(k, c) }
      const n = Number(r.n)
      if (Number(r.seen)) c.seen += n; else c.notSeen += n
      if (METHODS.includes(r.method)) c.methods[r.method] += n
    }
    const body = { date, from, to, cells: [...byCell.values()] }
    if (cache.size > 50) cache.clear()
    cache.set(date, { at: t, body })
    return body
  }

  const r = express.Router()
  r.get('/sightings', (req, res) => {
    const date = req.query.date == null ? dayOf(now()) : String(req.query.date)
    if (!DATE_RE.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`))) return res.status(400).json({ error: 'date' })
    res.set('Cache-Control', 'public, max-age=30')
    res.json(aggregate(date))
  })
  r.post('/sightings', express.json({ limit: '1kb' }), (req, res) => {
    const b = req.body || {}
    const lat = Number(b.lat), lng = Number(b.lng)
    if (b.lat == null || b.lng == null || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return res.status(400).json({ error: 'coords' })
    if (typeof b.seen !== 'boolean') return res.status(400).json({ error: 'seen' })
    if (!METHODS.includes(b.method)) return res.status(400).json({ error: 'method' })
    if (!firstToday(req.ip)) return res.status(429).json({ error: 'once' })
    const t = now()
    const [clat, clng] = cellOf(lat, lng)
    q.add.run(eveningOf(t, clng), clat, clng, b.seen ? 1 : 0, b.method, new Date(t).toISOString().slice(0, 13))
    cache.clear()
    res.status(204).end()
  })
  return r
}

module.exports = { createSightingsRouter, METHODS, eveningOf, cellOf }
