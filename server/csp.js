// ═══════════════════════════════════════════════════════════════════════
// CSP pozuntu hesabatları (Content-Security-Policy-Report-Only → report-uri)
//
//   POST /api/csp-report        brauzer göndərir (application/csp-report və ya
//                               application/reports+json) → 204
//   GET  /api/admin/csp         → { since, total, dropped, items:[{ directive, blocked, source, sample, count, first, last }] }
//
// Məqsəd: siyasəti BLOKLAMADAN əvvəl real istifadədə nəyin pozulduğunu görmək.
// Saxlama: yalnız yaddaşda (yenidən başlayanda sıfırlanır), açar üzrə birləşdirilir —
// eyni pozuntu min dəfə gəlsə də bir sətir + say. İlk dəfə görüləndə loga yazılır.
// Məxfilik: IP, cookie, tam URL sorğu hissəsi SAXLANMIR (yalnız origin + yol).
// Səs-küy: brauzer genişlənmələri və Cloudflare-in öz inline skripti süzülür.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')

const MAX_KEYS = 300
const str = (v, max = 300) => (typeof v === 'string' ? v.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max) : '')

/** URL → origin + yol (sorğu və fraqment atılır); "inline", "eval" kimi açar sözlər olduğu kimi */
function cleanUrl(u) {
  const s = str(u, 500)
  if (!s || !/^[a-z][a-z0-9+.-]*:/i.test(s)) return s
  try { const x = new URL(s); return /^(https?|wss?):$/.test(x.protocol) ? `${x.origin}${x.pathname}`.slice(0, 300) : `${x.protocol}` } catch { return s.slice(0, 120) }
}

// Bizdən asılı olmayan, siyasəti dəyişməyə səbəb olmamalı pozuntular
const NOISE_SOURCE = /^(chrome|moz|safari(-web)?|ms-browser)-extension:|^(about|webkit-masked-url):/i
const CF_SAMPLE = /__CF\$cv\$params|challenge-platform|function c\(\)\{var b=a\.contentDocument/

/**
 * Brauzerin göndərdiyi bir hesabatı vahid formaya sal → { directive, blocked, source, sample, page } | null
 * Hər iki format: köhnə { "csp-report": {...} } və Reporting API [{ type:'csp-violation', body:{...} }]
 */
function normalizeReport(raw) {
  if (!raw || typeof raw !== 'object') return null
  const r = raw['csp-report'] || (raw.type === 'csp-violation' ? raw.body : null) || null
  if (!r || typeof r !== 'object') return null
  const directive = str(r['effective-directive'] || r.effectiveDirective || r['violated-directive'] || r.violatedDirective, 60).split(' ')[0]
  if (!directive) return null
  const blocked = cleanUrl(r['blocked-uri'] ?? r.blockedURL ?? '')
  const source = cleanUrl(r['source-file'] ?? r.sourceFile ?? '')
  const sample = str(r['script-sample'] ?? r.sample ?? '', 80)
  if (NOISE_SOURCE.test(blocked) || NOISE_SOURCE.test(source)) return null
  if (CF_SAMPLE.test(sample) || /\/cdn-cgi\//.test(blocked)) return null
  const page = (() => { try { return new URL(str(r['document-uri'] ?? r.documentURL ?? '', 500)).pathname.slice(0, 200) } catch { return '' } })()
  return { directive, blocked: blocked || 'inline', source, sample, page }
}

/** Yaddaşda birləşdirici: açar = direktiv + bloklanan + mənbə faylı */
function createStore({ log = console.log, now = () => Date.now() } = {}) {
  const items = new Map()
  const since = now()
  let total = 0, dropped = 0
  return {
    add(rep) {
      total++
      const key = `${rep.directive}|${rep.blocked}|${rep.source}`
      const t = now()
      const cur = items.get(key)
      if (cur) { cur.count++; cur.last = t; return }
      if (items.size >= MAX_KEYS) { dropped++; return }
      items.set(key, { ...rep, pages: rep.page ? [rep.page] : [], count: 1, first: t, last: t })
      log(`[csp] yeni pozuntu: ${rep.directive} ← ${rep.blocked}${rep.source ? ` (mənbə: ${rep.source})` : ''}${rep.page ? ` səhifə: ${rep.page}` : ''}`)
    },
    snapshot() {
      const list = [...items.values()].sort((a, b) => b.count - a.count)
        .map(({ page: _page, ...x }) => ({ ...x, first: new Date(x.first).toISOString(), last: new Date(x.last).toISOString() }))
      return { since: new Date(since).toISOString(), total, dropped, items: list }
    },
  }
}

function createCspRouter({ requireAdmin, store = createStore() } = {}) {
  const r = express.Router()
  const parse = express.json({ limit: '16kb', type: ['application/csp-report', 'application/reports+json', 'application/json'] })
  r.post('/csp-report', parse, (req, res) => {
    const body = req.body
    const list = Array.isArray(body) ? body.slice(0, 20) : [body]
    for (const x of list) { const rep = normalizeReport(x); if (rep) store.add(rep) }
    res.status(204).end()
  })
  if (requireAdmin) r.get('/admin/csp', requireAdmin, (req, res) => res.json(store.snapshot()))
  return r
}

module.exports = { createCspRouter, createStore, normalizeReport, cleanUrl }
