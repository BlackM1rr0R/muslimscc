#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// SQLite ehtiyat nüsxəsi — konteynerin İÇİNDƏ (hostda sqlite3 olmaya bilər)
//
//   docker compose exec -T api node scripts/backup-db.js > muslims.db
//
// İşləyən serveri dayandırmadan VACUUM INTO ilə ardıcıl (consistent) surət
// çıxarır, PRAGMA integrity_check ilə yoxlayır və surəti stdout-a verir;
// müvəqqəti fayl (DB ilə eyni qovluqda — /data volume) dərhal silinir.
// Host tərəfi: infra/backup.sh (gzip, 14 gün saxlama).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { DatabaseSync } = require('node:sqlite')

const src = process.env.DB_PATH || '/data/muslims.db'
if (process.stdout.isTTY) {
  console.error('stdout terminal deyil, fayla yönləndirin: ... backup-db.js > muslims.db')
  process.exit(2)
}
if (!fs.existsSync(src)) { console.error(`XƏTA: ${src} yoxdur`); process.exit(1) }

const tmp = path.join(path.dirname(src), `.backup-${crypto.randomBytes(6).toString('hex')}.db`)
let code = 0
try {
  const db = new DatabaseSync(src, { readOnly: true })
  db.exec('PRAGMA busy_timeout = 10000')
  db.prepare('VACUUM INTO ?').run(tmp)
  db.close()

  const copy = new DatabaseSync(tmp, { readOnly: true })
  const ok = copy.prepare('PRAGMA integrity_check').get()
  const ver = copy.prepare('PRAGMA user_version').get().user_version
  copy.close()
  if (!ok || Object.values(ok)[0] !== 'ok') throw new Error('integrity_check alınmadı')

  const fd = fs.openSync(tmp, 'r')
  const buf = Buffer.allocUnsafe(1 << 20)
  let n, total = 0
  while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) {
    fs.writeSync(1, buf, 0, n)
    total += n
  }
  fs.closeSync(fd)
  console.error(`OK: ${total} bayt, sxem v${ver}`)
} catch (e) {
  console.error('XƏTA:', e && e.message ? e.message : e)
  code = 1
} finally {
  try { fs.unlinkSync(tmp) } catch { /* */ }
}
process.exit(code)
