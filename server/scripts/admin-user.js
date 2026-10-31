#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// Admin istifadəçiləri (SQLite, server/auth.js) — Firebase Auth-un əvəzi
//
//   Konteynerdə (serverdə, root):
//     cd /opt/muslimscc
//     TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js create <email>
//     TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js set-password <email>
//     TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js list
//     TAG=$(cat .current_tag) docker compose exec api node scripts/admin-user.js delete <email>
//
// Şifrə HEÇ VAXT arqumentdə və ya logda olmur:
//   • terminalda (TTY) — gizli soruşulur (ekranda görünmür), iki dəfə;
//   • --password-stdin — stdin-in ilk sətri (məs. parol menecerindən boru ilə):
//       pass show muslimscc/admin | docker compose exec -T api node scripts/admin-user.js create <email> --password-stdin
// set-password və delete həmin adminin BÜTÜN sessiyalarını ləğv edir.
// create və set-password ilə qoyulan şifrə MÜVƏQQƏTİDİR: ilk girişdə admin
// paneli yalnız "Şifrəni dəyiş" formasını göstərir (server/auth.js → must_change).
// --permanent — şifrə müvəqqəti sayılmasın (məs. parol menecerindən gələn güclü şifrə).
// DB yolu: env DB_PATH (susmaya görə /data/muslims.db — server.js ilə eyni).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const { openDb } = require('../db')
const auth = require('../auth')

const USAGE = 'İstifadə: node scripts/admin-user.js <create|set-password|list|delete> [email] [--password-stdin] [--permanent]'

/** Terminalda gizli oxu (simvollar ekrana çıxmır). */
function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    const { stdin, stderr } = process
    stderr.write(prompt)
    let buf = ''
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    const done = (err) => {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener('data', onData)
      stderr.write('\n')
      if (err) reject(err); else resolve(buf)
    }
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n' || ch === '\u0004') return done()
        if (ch === '\u0003') return done(new Error('ləğv edildi'))
        if (ch === '\u007f' || ch === '\b') buf = buf.slice(0, -1)
        else if (ch >= ' ') buf += ch
      }
    }
    stdin.on('data', onData)
  })
}

/** stdin-in ilk sətri (sonundakı \r\n atılır). */
function readStdinLine() {
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (c) => { data += c; if (data.length > 4096) reject(new Error('stdin çox uzundur')) })
    process.stdin.on('end', () => resolve(data.split(/\r?\n/)[0]))
    process.stdin.on('error', reject)
  })
}

async function readPassword(fromStdin) {
  if (fromStdin || !process.stdin.isTTY) return readStdinLine()
  const a = await readHidden('Yeni şifrə (ən azı ' + auth.MIN_PASSWORD + ' simvol): ')
  const b = await readHidden('Təkrar: ')
  if (a !== b) throw new Error('şifrələr uyğun gəlmir')
  return a
}

async function main() {
  const args = process.argv.slice(2)
  const cmd = args[0]
  const email = args.find((a, i) => i > 0 && !a.startsWith('--'))
  const fromStdin = args.includes('--password-stdin')
  const temporary = !args.includes('--permanent')
  // Şifrəni arqument kimi verməyə cəhdin qarşısını al (shell tarixçəsinə düşür)
  if (args.some((a) => /^--pass(word)?=/.test(a))) {
    console.error('XƏTA: şifrə arqumentdə verilmir — stdin və ya gizli sorğu istifadə edin')
    process.exit(2)
  }
  if (!['create', 'set-password', 'list', 'delete'].includes(cmd)) { console.error(USAGE); process.exit(2) }
  if (cmd !== 'list' && !auth.validEmail(auth.normEmail(email || ''))) { console.error(USAGE); process.exit(2) }

  const db = openDb()
  const store = auth.createAuthStore(db)
  try {
    if (cmd === 'list') {
      const rows = store.listAdmins()
      if (!rows.length) console.log('Admin yoxdur.')
      for (const r of rows) {
        console.log(`${r.email}  (yaradılıb ${new Date(r.created_at).toISOString().slice(0, 10)}, ` +
          `şifrə ${new Date(r.updated_at).toISOString().slice(0, 10)}, aktiv sessiya: ${r.sessions})`)
      }
      return
    }
    if (cmd === 'delete') {
      const ok = store.deleteAdmin(email)
      console.log(ok ? `OK: ${auth.normEmail(email)} silindi (sessiyaları da).` : `"${auth.normEmail(email)}" tapılmadı.`)
      if (!ok) process.exitCode = 1
      return
    }
    if (cmd === 'create' && store.findByEmail(email)) {
      console.error(`XƏTA: "${auth.normEmail(email)}" artıq var — şifrəni dəyişmək üçün: set-password`)
      process.exitCode = 1
      return
    }
    if (cmd === 'set-password' && !store.findByEmail(email)) {
      console.error(`XƏTA: "${auth.normEmail(email)}" tapılmadı — əvvəlcə: create`)
      process.exitCode = 1
      return
    }
    const password = await readPassword(fromStdin)
    if (cmd === 'create') {
      await store.createAdmin(email, password, Date.now(), { temporary })
      console.log(`OK: admin yaradıldı → ${auth.normEmail(email)}` +
        (temporary ? ' (şifrə müvəqqətidir — ilk girişdə paneldə dəyişdirilməlidir)' : ''))
    } else {
      await store.setPassword(email, password, Date.now(), { temporary })
      console.log(`OK: ${auth.normEmail(email)} — şifrə dəyişdi, bütün sessiyalar ləğv edildi.` +
        (temporary ? ' Şifrə müvəqqətidir — ilk girişdə paneldə dəyişdirilməlidir.' : ''))
    }
  } finally {
    db.close()
  }
}

main().catch((e) => {
  console.error('XƏTA:', e && e.message ? e.message : e)
  process.exit(1)
})
