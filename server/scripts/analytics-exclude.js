#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// Sayt statistikası (server/analytics.js) — anomal günləri (bot hücumu) sayından çıxar
//
//   Konteynerdə (serverdə):
//     docker compose exec -T api node scripts/analytics-exclude.js add 2026-11-23 --reason="bot hücumu"
//     docker compose exec -T api node scripts/analytics-exclude.js remove 2026-11-23
//     docker compose exec -T api node scripts/analytics-exclude.js list
//
// Heç nə silinmir: gün analytics_excluded_days cədvəlinə yazılır, admin statistikası
// (GET /api/admin/analytics — "Sayt statistikası" və İdarə paneli icmalı) həmin günü
// cəmlərdən, səhifə/ölçü siyahılarından çıxarır və "sayılmır" kimi işarələyir.
// "remove" günü geri qaytarır. Bir əmrdə bir neçə gün: add 2026-11-23 2026-11-24
// DB yolu: env DB_PATH (susmaya görə /data/muslims.db — server.js ilə eyni).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const { openDb } = require('../db')
const analytics = require('../analytics')

const USAGE = 'İstifadə: node scripts/analytics-exclude.js <add|remove|list> [YYYY-MM-DD ...] [--reason="səbəb"]'

function main(argv) {
  const [cmd, ...rest] = argv
  const days = rest.filter((a) => !a.startsWith('--'))
  const reasonArg = rest.find((a) => a.startsWith('--reason='))
  const reason = reasonArg ? reasonArg.slice('--reason='.length) : 'bot hücumu'
  if (!['add', 'remove', 'list'].includes(cmd)) { console.error(USAGE); return 2 }
  if (cmd !== 'list' && (!days.length || !days.every(analytics.validDay))) { console.error(USAGE); return 2 }
  if (rest.some((a) => a.startsWith('--') && !a.startsWith('--reason='))) { console.error(USAGE); return 2 }

  const db = openDb()
  try {
    if (cmd === 'add') for (const d of days) { analytics.excludeDay(db, d, reason); console.log(`OK: ${d} statistikadan çıxarıldı`) }
    if (cmd === 'remove') {
      for (const d of days) console.log(analytics.includeDay(db, d) ? `OK: ${d} geri qaytarıldı` : `${d} siyahıda yox idi`)
    }
    const list = analytics.listExcluded(db)
    if (!list.length) console.log('Çıxarılmış gün yoxdur.')
    for (const r of list) console.log(`${r.day}  qeydə alınıb: ${r.views} baxış, ${r.visitors} ziyarətçi (sayılmır)  — ${r.reason || '-'}`)
    return 0
  } finally {
    try { (db.raw || db).close() } catch { /* artıq bağlıdır */ }
  }
}

if (require.main === module) {
  try { process.exitCode = main(process.argv.slice(2)) } catch (e) { console.error('XƏTA:', e && e.message); process.exitCode = 1 }
}

module.exports = { main }
