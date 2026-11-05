// ═══════════════════════════════════════════════════════════════════════
// Brauzer xətaları (monitorinq) — src/utils/errorReport.js göndərir
//
//   POST /api/client-error     { kind, message, source, line, col, stack, page }  → 204
//   GET  /api/admin/errors     → { since, total, dropped, items:[{ kind, message, source, line, count, first, last, pages }] }
//
// Məqsəd: yeni kod canlıda brauzerdə sınanda bunu görmək (CSP hesabatları kimi).
// Saxlama: yalnız yaddaşda, açar üzrə birləşdirilir (eyni xəta min dəfə — bir sətir + say);
// ilk dəfə görüləndə loga "[client-error] …" yazılır.
// Məxfilik: IP, cookie, istifadəçi agenti, URL sorğu hissəsi SAXLANMIR; mesaj və stack qısaldılır,
// içindəki e-poçt / uzun rəqəm ardıcıllığı ("token") maskalanır.
// Səs-küy: brauzer genişlənmələri, "Script error." (kənar skript), ResizeObserver xəbərdarlığı.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')

const MAX_KEYS = 300
const str = (v, max = 300) => (typeof v === 'string' ? v.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max) : '')
const mask = (s) => s.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '<email>').replace(/\b[A-Za-z0-9_-]{24,}\b/g, '<token>').replace(/\d{6,}/g, '<n>')

/** URL → yol (öz saytımız) və ya origin+yol (kənar); sorğu və fraqment atılır */
function cleanUrl(u) {
  const s = str(u, 500)
  if (!s) return ''
  try {
    const x = new URL(s, 'https://muslims.cc')
    if (!/^https?:$/.test(x.protocol)) return x.protocol
    return (x.host === 'muslims.cc' || x.host === 'www.muslims.cc' ? x.pathname : `${x.origin}${x.pathname}`).slice(0, 200)
  } catch { return s.slice(0, 120) }
}

const NOISE = /^(chrome|moz|safari(-web)?|ms-browser)-extension:|^webkit-masked-url:/i
const NOISE_MSG = /^Script error\.?$|ResizeObserver loop|^Non-Error promise rejection captured/i

/** Göndərilən bir hesabatı vahid formaya sal → obyekt | null (səs-küy və ya pozuq) */
function normalizeError(raw) {
  if (!raw || typeof raw !== 'object') return null
  const message = mask(str(raw.message, 300))
  if (!message || NOISE_MSG.test(message)) return null
  const source = cleanUrl(raw.source)
  const stackRaw = str(raw.stack, 2000)
  if (NOISE.test(source) || /(chrome|moz|safari(-web)?)-extension:\/\//i.test(stackRaw)) return null
  const stack = mask(stackRaw.split('\n').slice(0, 4).map(l => l.replace(/https?:\/\/(www\.)?muslims\.cc/g, '').replace(/\?[^\s:)]*/g, '').trim()).join('\n')).slice(0, 600)
  const kind = ['error', 'rejection', 'boundary'].includes(raw.kind) ? raw.kind : 'error'
  const n = (v) => (Number.isInteger(v) && v >= 0 && v < 1e7 ? v : 0)
  return { kind, message, source, line: n(raw.line), col: n(raw.col), stack, page: cleanUrl(raw.page) }
}

function createStore({ log = console.log, now = () => Date.now() } = {}) {
  const items = new Map()
  const since = now()
  let total = 0, dropped = 0
  return {
    add(e) {
      total++
      const key = `${e.kind}|${e.message}|${e.source}|${e.line}`
      const t = now()
      const cur = items.get(key)
      if (cur) {
        cur.count++; cur.last = t
        if (e.page && cur.pages.length < 5 && !cur.pages.includes(e.page)) cur.pages.push(e.page)
        return
      }
      if (items.size >= MAX_KEYS) { dropped++; return }
      items.set(key, { kind: e.kind, message: e.message, source: e.source, line: e.line, col: e.col, stack: e.stack, pages: e.page ? [e.page] : [], count: 1, first: t, last: t })
      log(`[client-error] yeni: ${e.kind} · ${e.message}${e.source ? ` (${e.source}:${e.line})` : ''}${e.page ? ` səhifə: ${e.page}` : ''}`)
    },
    snapshot() {
      const list = [...items.values()].sort((a, b) => b.last - a.last)
        .map(x => ({ ...x, first: new Date(x.first).toISOString(), last: new Date(x.last).toISOString() }))
      return { since: new Date(since).toISOString(), total, dropped, items: list }
    },
  }
}

function createClientErrorRouter({ requireAdmin, store = createStore() } = {}) {
  const r = express.Router()
  // sendBeacon text/plain göndərir — hər ikisi qəbul olunur
  const parse = express.json({ limit: '8kb', type: ['application/json', 'text/plain'] })
  r.post('/client-error', parse, (req, res) => {
    const body = req.body
    const list = Array.isArray(body) ? body.slice(0, 10) : [body]
    for (const x of list) { const e = normalizeError(x); if (e) store.add(e) }
    res.status(204).end()
  })
  if (requireAdmin) r.get('/admin/errors', requireAdmin, (req, res) => res.json(store.snapshot()))
  return r
}

module.exports = { createClientErrorRouter, createStore, normalizeError, cleanUrl }
