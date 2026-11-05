// ═══════════════════════════════════════════════════════
// CSP yoxlaması: index.html-dəki inline skriptlərin sha256 hash-i
// infra/nginx/security-headers.conf-dakı script-src-də olmalıdır.
// Tema skripti dəyişib hash yenilənməsə, siyasət tətbiq rejimində saytı
// qaranlıq temasız açar — CI bunu əvvəlcədən tutur.
// ═══════════════════════════════════════════════════════
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const html = readFileSync('index.html', 'utf8')
const conf = readFileSync('infra/nginx/security-headers.conf', 'utf8')
const m = /Content-Security-Policy(?:-Report-Only)? "([^"]+)"/.exec(conf)
if (!m) { console.error('✗ security-headers.conf-da CSP başlığı tapılmadı'); process.exit(1) }
const scriptSrc = (/(?:^|;\s*)script-src ([^;]+)/.exec(m[1]) || [])[1] || ''

const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter(x => !/application\/ld\+json/.test(x[1]))
const missing = inline.map(x => `'sha256-${createHash('sha256').update(x[2]).digest('base64')}'`).filter(h => !scriptSrc.includes(h))
const bad = []
if (missing.length) bad.push(`index.html inline skripti üçün hash yoxdur: ${missing.join(' ')}`)
if (/'unsafe-inline'|'unsafe-eval'/.test(scriptSrc)) bad.push("script-src-də 'unsafe-inline'/'unsafe-eval' olmamalıdır")
if (!/report-uri \/api\/csp-report/.test(m[1])) bad.push('report-uri /api/csp-report yoxdur')
if (/ on[a-z]+="/i.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) bad.push('index.html-də inline hadisə atributu (on…="") var — CSP bloklayar')

if (bad.length) { for (const b of bad) console.error('✗ ' + b); process.exit(1) }
console.log(`✓ CSP: ${inline.length} inline skript hash-i siyasətdədir`)
