// ═══════════════════════════════════════════════════════════════════════
// "Səhv bildir" — ziyarətçilərin məzmun səhvi bildirişləri
//
//   POST   /api/feedback                    { page, ref?, kind, text, lang?, contact? } → 201 { ok }
//   GET    /api/admin/feedback              → [{ id, page, ref, kind, text, lang, contact, status, createdAt }]
//   PATCH  /api/admin/feedback/:id          { status: 'new'|'done' } → { ok }
//   DELETE /api/admin/feedback/:id          → { ok }
//
// Saxlama: docs cədvəli, collection 'feedback' (ayrıca miqrasiya lazım deyil;
// content.js-in ictimai siyahısında YOXDUR — yalnız admin oxuyur).
// Məxfilik: IP, cookie, brauzer məlumatı SAXLANMIR. "contact" könüllüdür.
// Spam: IP üzrə yaddaşda limit (10 dəqiqədə 5), mətn uzunluğu və sahələr yoxlanır.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')

const COLLECTION = 'feedback'
// 'ai' — AI köməkçinin cavabına 👎 (sual + cavab + səbəb; components/AIRating.jsx)
const KINDS = ['text', 'translation', 'source', 'hadith', 'design', 'other', 'ai']
const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const MAX_TEXT = 2000
const MAX_TEXT_AI = 12000   // AI cavabı uzun ola bilər — sual + cavab birlikdə
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const MAX_STORED = 5000

const str = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max) : '')

/** Gələn bildirişi yoxla → saxlanacaq sənəd | null */
function validFeedback(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return null
  const page = str(b.page, 300)
  const text = str(b.text, b.kind === 'ai' ? MAX_TEXT_AI : MAX_TEXT)
  // Yalnız saytın öz yolu (/…) — kənar URL yox
  if (!/^\/(?![/\\])[^\s]*$/.test(page) || text.length < 5) return null
  return {
    page,
    ref: str(b.ref, 200),
    kind: KINDS.includes(b.kind) ? b.kind : 'other',
    text,
    lang: LANGS.includes(b.lang) ? b.lang : 'az',
    contact: str(b.contact, 200),
    status: 'new',
  }
}

function createFeedbackRouter({ db, requireAdmin, now = () => Date.now() }) {
  const router = express.Router()
  const hits = new Map()   // ip → [ms, …] (yalnız yaddaşda)

  const limited = (ip) => {
    const t = now()
    const list = (hits.get(ip) || []).filter(x => t - x < WINDOW_MS)
    if (list.length >= MAX_PER_WINDOW) { hits.set(ip, list); return true }
    list.push(t)
    hits.set(ip, list)
    if (hits.size > 10000) hits.clear()
    return false
  }

  router.post('/feedback', express.json({ limit: '40kb' }), (req, res) => {
    if (limited(req.ip || '')) return res.status(429).json({ error: 'Limit' })
    const doc = validFeedback(req.body)
    if (!doc) return res.status(400).json({ error: 'invalid' })
    const list = db.listDocs(COLLECTION)
    if (list.length >= MAX_STORED) return res.status(503).json({ error: 'full' })
    db.addDoc(COLLECTION, doc, now())
    res.status(201).json({ ok: true })
  })

  router.get('/admin/feedback', requireAdmin, (req, res) => {
    res.set('Cache-Control', 'no-store')
    res.json(db.listDocs(COLLECTION))
  })

  router.patch('/admin/feedback/:id', requireAdmin, express.json({ limit: '1kb' }), (req, res) => {
    const status = req.body && req.body.status
    if (!['new', 'done'].includes(status)) return res.status(400).json({ error: 'invalid' })
    const r = db.updateDoc(COLLECTION, req.params.id, { status }, now())
    if (!r) return res.status(404).json({ error: 'not found' })
    res.json({ ok: true })
  })

  router.delete('/admin/feedback/:id', requireAdmin, (req, res) => {
    if (!db.deleteDoc(COLLECTION, req.params.id)) return res.status(404).json({ error: 'not found' })
    res.json({ ok: true })
  })

  return router
}

module.exports = { createFeedbackRouter, validFeedback, KINDS }
