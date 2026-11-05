// ═══════════════════════════════════════════════════════════════════════
// Ümmətin sayğacı — saytda birlikdə deyilən salavat / zikr / oxunan cüz (anonim)
//
//   POST /api/ummah   { kind: 'salawat' | 'dhikr' | 'juz', n: 1…100 }  → 204
//   GET  /api/ummah   → { today: { salawat, dhikr, juz }, total: { … }, day: 'YYYY-MM-DD' }
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

  const r = express.Router()
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
