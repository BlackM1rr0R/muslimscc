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
// Surəti stdout-a ötür. DİQQƏT: fs.writeSync(1, …) boruya (pipe) yazanda
// məlumatın yalnız bir HİSSƏSİNİ yaza və ya EAGAIN ata bilər — əvvəlki versiya
// qaytarılan bayt sayını yoxlamırdı və systemd altında arxiv kəsik çıxırdı
// (2026-10-31). İndi axın (stream) ilə yazılır və bitməsi gözlənilir.
function streamToStdout(file) {
  return new Promise((resolve, reject) => {
    let total = 0
    const rs = fs.createReadStream(file)
    rs.on('data', (c) => { total += c.length })
    rs.on('error', reject)
    process.stdout.on('error', reject)
    rs.pipe(process.stdout, { end: false })
    rs.on('end', () => {
      // Boruya yazılmamış qalıq yoxdursa — dərhal, varsa 'drain'-dən sonra
      if (!process.stdout.writableNeedDrain) resolve(total)
      else process.stdout.once('drain', () => resolve(total))
    })
  })
}

async function main() {
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

    const size = fs.statSync(tmp).size
    const total = await streamToStdout(tmp)
    if (total !== size) throw new Error(`yarımçıq oxundu: ${total}/${size} bayt`)
    // backup.sh bu sətri oxuyur və açılmış arxivin ölçüsü ilə tutuşdurur
    console.error(`OK: ${total} bayt, sxem v${ver}`)
  } catch (e) {
    console.error('XƏTA:', e && e.message ? e.message : e)
    code = 1
  } finally {
    try { fs.unlinkSync(tmp) } catch { /* */ }
  }
  // process.exit stdout boşalmadan prosesi kəsə bilər — təbii çıxış gözlənilir
  process.exitCode = code
}
main()
