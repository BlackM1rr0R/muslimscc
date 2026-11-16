// ═══════════════════════════════════════════════════════════════════════
// Ümmətin sayğacı — saytda birlikdə deyilən salavat / zikr / oxunan cüz (anonim)
//
//   POST /api/ummah   { kind: 'salawat' | 'dhikr' | 'juz', n: 1…100 }  → 204
//   GET  /api/ummah   → { today: { salawat, dhikr, juz }, total: { … }, day: 'YYYY-MM-DD' }
//   POST /api/ummah/here { lat, lng }  → 204   — "indi zikr edənlər" xəritəsi (v7.2)
//   GET  /api/ummah/here → { cells: [{ lat, lng, n }], window: 600 }
//
// "İndi" xəritəsi: koordinat SERVERDƏ 2°-lik xanaya yuvarlaqlaşır (~200 km), yalnız YADDAŞDA,
// 10 dəqiqədən köhnə qeydlər silinir; cədvəl, IP, şəxs yoxdur. Bir sorğu = xanaya +1.
//
// • Heç bir şəxsi məlumat saxlanmır: yalnız gün (UTC) + növ + say. Kimin nə etdiyi yoxdur.
// • Cədvəl MİQRASİYASIZ yaradılır (CREATE TABLE IF NOT EXISTS, user_version artmır):
//   köhnə kod bu cədvələ toxunmur — deploy.sh geri qaytarması pozulmur (2026-11-04 dərsi).
// • Sui-istifadəyə qarşı: IP üzrə dəqiqədə 30 sorğu (yaddaşda, IP saxlanmır — yalnız heşi,
//   dəqiqə bitəndə silinir), bir sorğuda ən çox 100, GET cavabı 15 s keşlənir.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')

const KINDS = ['salawat', 'dhikr', 'juz']
const MAX_N = { salawat: 100, dhikr: 100, juz: 1 }
const WINDOW_MS = 60 * 1000
const MAX_PER_WINDOW = 30
const CACHE_MS = 15 * 1000

const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10)

function createUmmahRouter({ db, now = () => Date.now() }) {
  const raw = db.raw || db
  raw.exec(`CREATE TABLE IF NOT EXISTS ummah_counts (
    day  TEXT NOT NULL,
    kind TEXT NOT NULL,
    n    INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, kind)
  )`)
  const q = {
    add: raw.prepare('INSERT INTO ummah_counts (day, kind, n) VALUES (?, ?, ?) ON CONFLICT(day, kind) DO UPDATE SET n = n + excluded.n'),
    day: raw.prepare('SELECT kind, n FROM ummah_counts WHERE day = ?'),
    total: raw.prepare('SELECT kind, SUM(n) AS n FROM ummah_counts GROUP BY kind'),
  }

  const hits = new Map()
  let windowStart = now()
  const allow = (ip) => {
    const t = now()
    if (t - windowStart > WINDOW_MS) { hits.clear(); windowStart = t }
    const k = crypto.createHash('sha256').update(String(ip || '')).digest('base64url').slice(0, 16)
    const c = (hits.get(k) || 0) + 1
    hits.set(k, c)
    return c <= MAX_PER_WINDOW
  }

  let cache = null, cacheAt = 0
  const snapshot = () => {
    const t = now()
    if (cache && t - cacheAt < CACHE_MS) return cache
    const day = dayOf(t)
    const pick = (rows) => Object.fromEntries(KINDS.map(k => [k, Number(rows.find(r => r.kind === k)?.n || 0)]))
    cache = { day, today: pick(q.day.all(day)), total: pick(q.total.all()) }
    cacheAt = t
    return cache
  }

  // ── "İndi" xəritəsi (yaddaşda) ──
  const HERE_MS = 10 * 60 * 1000
  const GRID = 2
  const here = new Map()   // "lat,lng" → [zaman damğaları]
  const cellOf = (lat, lng) => {
    const a = Math.round(lat / GRID) * GRID, b = ((Math.round(lng / GRID) * GRID + 540) % 360) - 180
    return `${a},${b}`
  }
  const prune = (t) => {
    for (const [k, arr] of here) {
      const kept = arr.filter(x => t - x < HERE_MS)
      if (kept.length) here.set(k, kept); else here.delete(k)
    }
  }
  let hereCache = null, hereAt = 0

  const r = express.Router()
  r.get('/ummah/here', (req, res) => {
    const t = now()
    if (!hereCache || t - hereAt > CACHE_MS) {
      prune(t)
      hereCache = { window: HERE_MS / 1000, cells: [...here].map(([k, arr]) => { const [lat, lng] = k.split(',').map(Number); return { lat, lng, n: arr.length } }) }
      hereAt = t
    }
    res.set('Cache-Control', 'public, max-age=15')
    res.json(hereCache)
  })
  r.post('/ummah/here', express.json({ limit: '1kb' }), (req, res) => {
    const lat = Number(req.body?.lat), lng = Number(req.body?.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return res.status(400).json({ error: 'coords' })
    if (!allow(req.ip)) return res.status(429).json({ error: 'rate' })
    const t = now(), k = cellOf(lat, lng)
    const arr = here.get(k) || []
    arr.push(t)
    if (arr.length > 500) arr.splice(0, arr.length - 500)
    here.set(k, arr)
    if (here.size > 5000) prune(t)
    res.status(204).end()
  })
  r.get('/ummah', (req, res) => {
    res.set('Cache-Control', 'public, max-age=15')
    res.json(snapshot())
  })
  r.post('/ummah', express.json({ limit: '1kb' }), (req, res) => {
    const { kind, n } = req.body || {}
    if (!KINDS.includes(kind)) return res.status(400).json({ error: 'kind' })
    const v = Math.floor(Number(n))
    if (!Number.isFinite(v) || v < 1) return res.status(400).json({ error: 'n' })
    if (!allow(req.ip)) return res.status(429).json({ error: 'rate' })
    q.add.run(dayOf(now()), kind, Math.min(v, MAX_N[kind]))
    cache = null
    res.status(204).end()
  })
  return r
}

module.exports = { createUmmahRouter, KINDS }
