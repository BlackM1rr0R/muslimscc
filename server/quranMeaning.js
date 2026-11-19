// ═══════════════════════════════════════════════════════
// "Quranda məna ilə axtar" — POST /api/quran-meaning
//
// İstifadəçi öz sözləri ilə mövzu yazır ("səbr haqqında", "valideynə hörmət").
// Model YALNIZ ayə istinadlarını seçir: { s, a }. Server:
//   • cavabdan JSON-u çıxarır, hər istinadı yoxlayır (surə 1–114, ayə həmin surənin
//     ayə sayı daxilində), yararsızı atır, təkrarı silir, ən çox MAX_RESULTS;
//   • modelin yazdığı heç bir dini mətn (ayə, tərcümə, təfsir, hökm) qaytarılmır —
//     klient ayənin mətnini saytın öz Quran mənbəyindən göstərir;
//   • mövzu etiketi YOXDUR: modelin yazdığı heç bir mətn nə istənilir, nə qaytarılır;
//   • eyni sorğu (dil + normallaşdırılmış mətn) qısa müddət yaddaşda keşlənir; eyni anda
//     gələn eyni sorğular bir model çağırışını paylaşır.
// Hesab tələb olunmur; heç nə bazaya yazılmır, sorğu mətni loglanmır.
// CSRF: X-Requested-With + icazəli Origin (server/auth.js → csrfRejected).
// Rate limit — server.js-də (app.use('/api/quran-meaning', …)).
// tests/unit/server-quran-meaning.test.js
// ═══════════════════════════════════════════════════════
'use strict'

const express = require('express')
const { csrfRejected } = require('./auth')

// Hər surənin ayə sayı (Hafs) — server/readTogether.js, daily-ayah.js ilə eyni
const AYAHS = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6]

const MAX_RESULTS = 10
const Q_MIN = 2
const Q_MAX = 200
const TIMEOUT_MS = 25000
const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const normLang = (l) => (LANGS.includes(l) ? l : 'en')

// İdarəetmə və istiqamət (bidi) simvolları
const CTRL_RE = /[\p{Cc}\p{Cf}]/gu

/** İstifadəçi sorğusu → normallaşdırılmış mətn və ya '' (yararsız) */
function normQuery(v) {
  if (typeof v !== 'string') return ''
  const s = v.normalize('NFC').replace(CTRL_RE, ' ').replace(/\s+/g, ' ').trim()
  const n = [...s].length
  if (n < Q_MIN || n > Q_MAX) return ''
  return s
}

const toInt = (v) => {
  const n = typeof v === 'string' && /^\s*\d{1,3}\s*$/.test(v) ? Number(v) : v
  return Number.isInteger(n) ? n : NaN
}

/** Ayə istinadı həqiqidirmi (surə 1–114, ayə həmin surənin sayı daxilində)? */
const validRef = (s, a) => Number.isInteger(s) && s >= 1 && s <= 114 && Number.isInteger(a) && a >= 1 && a <= AYAHS[s - 1]

/** Modelin xam cavabından JSON-u çıxar (```json …``` hasarı, əvvəl/sonra mətn) → massiv | null */
function parseModelReply(text) {
  const raw = String(text || '').trim()
  if (!raw) return null
  const tryParse = (s) => { try { return JSON.parse(s) } catch { return undefined } }
  const pickList = (o) => (Array.isArray(o) ? o : o && typeof o === 'object' && Array.isArray(o.results) ? o.results : null)
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  for (const cand of [raw, fence && fence[1]]) {
    if (!cand) continue
    const l = pickList(tryParse(cand.trim()))
    if (l) return l
  }
  // Mətnin içindəki ilk {…} və ya […] bloku
  for (const [open, close] of [['{', '}'], ['[', ']']]) {
    const i = raw.indexOf(open), j = raw.lastIndexOf(close)
    if (i >= 0 && j > i) {
      const l = pickList(tryParse(raw.slice(i, j + 1)))
      if (l) return l
    }
  }
  return null
}

/** Massiv → [{ s, a }]: yalnız həqiqi istinadlar, təkrarsız, ən çox max */
function validateResults(list, max = MAX_RESULTS) {
  if (!Array.isArray(list)) return []
  const out = []
  const seen = new Set()
  for (const it of list) {
    if (out.length >= max) break
    if (!it || typeof it !== 'object') continue
    let s = toInt(it.s ?? it.surah), a = toInt(it.a ?? it.ayah)
    // "2:153" formasında tək sahə
    if ((Number.isNaN(s) || Number.isNaN(a)) && typeof it.ref === 'string') {
      const m = it.ref.match(/^\s*(\d{1,3})\s*:\s*(\d{1,3})\s*$/)
      if (m) { s = Number(m[1]); a = Number(m[2]) }
    }
    if (!validRef(s, a)) continue
    const k = `${s}:${a}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push({ s, a })
  }
  return out
}

function buildMessages(q) {
  const sys = [
    'You are an index of the Quran. The user describes, in their own words and in any language, a topic, a feeling or a situation.',
    `Choose up to ${MAX_RESULTS} ayahs of the Quran that speak most directly about it, the most relevant first.`,
    'Reply with ONLY this JSON and nothing else: {"results":[{"s":<surah number>,"a":<ayah number>}]}',
    'Output only numbers: never quote, translate, paraphrase or explain any ayah, and never state a ruling.',
    'Use the standard Hafs numbering. Never invent references; if you are not sure, leave the ayah out.',
    'If the request is not something to look up in the Quran, reply {"results":[]}.',
  ].join('\n')
  return [
    { role: 'system', content: sys },
    { role: 'user', content: `Topic: """${q.replace(/"""/g, '"')}"""` },
  ]
}

function createQuranMeaningRouter({ callModel, allowedOrigins = [], now = () => Date.now(), ttlMs = 10 * 60 * 1000, maxCache = 500, timeoutMs = TIMEOUT_MS } = {}) {
  if (typeof callModel !== 'function') throw new Error('callModel lazımdır')
  const router = express.Router()
  const cache = new Map()     // açar → { at, results }
  const inflight = new Map()  // açar → Promise<results>
  const err = (res, status, code) => res.status(status).json({ error: code, code })

  const getCached = (key) => {
    const hit = cache.get(key)
    if (!hit) return null
    if (now() - hit.at > ttlMs) { cache.delete(key); return null }
    return hit.results
  }
  const putCached = (key, results) => {
    cache.delete(key)
    cache.set(key, { at: now(), results })
    while (cache.size > maxCache) cache.delete(cache.keys().next().value)
  }

  async function lookup(q) {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), timeoutMs)
    try {
      const reply = await callModel(buildMessages(q), ac.signal)
      return validateResults(parseModelReply(reply))
    } catch (e) {
      if (ac.signal.aborted) { const t = new Error('timeout'); t.code = 'timeout'; throw t }
      throw e
    } finally {
      clearTimeout(timer)
    }
  }

  router.post('/quran-meaning', express.json({ limit: '4kb' }), async (req, res) => {
    if (csrfRejected(req, allowedOrigins)) return err(res, 403, 'forbidden')
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const lang = normLang(body.lang)
    const q = normQuery(body.q)
    if (!q) return err(res, 400, 'bad_request')
    const key = `${lang}\u0000${q.toLowerCase()}`
    res.set('Cache-Control', 'no-store')
    const hit = getCached(key)
    if (hit) return res.json({ results: hit, cached: true })
    let p = inflight.get(key)
    if (!p) {
      p = lookup(q)
      inflight.set(key, p)
      p.then((results) => putCached(key, results), () => {}).finally(() => inflight.delete(key))
    }
    try {
      const results = await p
      res.json({ results, cached: false })
    } catch (e) {
      if (res.headersSent) return
      if (e && e.code === 'timeout') return err(res, 504, 'timeout')
      console.error('quran-meaning AI xətası:', String(e && e.message || e).slice(0, 200))
      err(res, 502, 'upstream')
    }
  })

  router.cacheSize = () => cache.size
  return router
}

module.exports = {
  createQuranMeaningRouter, parseModelReply, validateResults, normQuery, buildMessages, validRef,
  AYAHS, MAX_RESULTS, Q_MAX,
}
