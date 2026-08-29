#!/usr/bin/env node
// ═══════════════════════════════════════════════════════
// Gündəlik Instagram postu — orkestrator
//
// Axın:  məzmun seç → şəkil çək → caption yaz → paylaş → jurnala yaz
//
// İSTİFADƏ:
//   node run.mjs                 — bir post hazırla və paylaş
//   node run.mjs --dry           — paylaşma, yalnız hazırla (test üçün)
//   node run.mjs --type=hadith   — məzmun növünü məcbur et
//   node run.mjs --check         — hesab və kvota yoxlaması
//   node run.mjs --stats         — məzmun hovuzunun vəziyyəti
//
// CRON (gündə 3 dəfə — 09:00, 14:00, 20:00):
//   0 9,14,20 * * * cd /var/www/muslim-cc-api/social && /usr/bin/node run.mjs >> log/cron.log 2>&1
//
// ENV: bax .env.example
// ═══════════════════════════════════════════════════════

import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { pickNext, stats, TYPES, STATE_DIR } from './content.mjs'
import { generateCaption, composeCaption } from './caption.mjs'
import { publishPhoto, checkAccount, hasCredentials } from './publish.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const LOG_DIR = path.join(HERE, 'log')

// .env-i özümüz oxuyuruq: node --env-file yalnız Node 20.6+-dadır və
// cron mühitində hansı versiyanın işlədiyi əvvəlcədən məlum deyil.
// Mövcud mühit dəyişənləri üstün tutulur.
function loadEnv() {
  const f = path.join(HERE, '.env')
  if (!fs.existsSync(f)) return
  for (const rawLine of fs.readFileSync(f, 'utf8').split(String.fromCharCode(10))) {
    const t = rawLine.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 1) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (process.env[k] === undefined && v !== '') process.env[k] = v
  }
}
loadEnv()

// Şəkillər Instagram-ın oxuya biləcəyi public qovluğa yazılır
const PUBLIC_DIR = process.env.SOCIAL_PUBLIC_DIR || path.join(HERE, 'out')
const PUBLIC_BASE = process.env.SOCIAL_PUBLIC_BASE || 'https://muslims.cc/posts'
const PYTHON = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3')

const argv = process.argv.slice(2)
const has = f => argv.includes(f)
const arg = k => (argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1] || ''

function log(...m) {
  console.log(`[${new Date().toISOString()}]`, ...m)
}

/** Bir sətir JSONL jurnalı — sonradan nəyin paylaşıldığını yoxlamaq üçün. */
function journal(entry) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
  fs.appendFileSync(
    path.join(LOG_DIR, 'posts.jsonl'),
    JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n',
    'utf8',
  )
}

/** Gündə neçənci postdur — növü ona görə seçirik. */
function typeForSlot() {
  const forced = arg('type')
  if (forced) {
    if (!TYPES.includes(forced)) throw new Error(`Naməlum növ: ${forced}`)
    return forced
  }
  // Saata görə növbələ: səhər Quran, günorta hədis, axşam dua/ad
  const h = new Date().getHours()
  if (h < 12) return 'quran'
  if (h < 18) return 'hadith'
  return Math.random() < 0.5 ? 'dua' : 'name'
}

function renderImage(item, outPath) {
  return new Promise((resolve, reject) => {
    const py = spawn(PYTHON, [path.join(HERE, 'render.py')])
    let out = '', err = ''
    py.stdout.on('data', d => (out += d))
    py.stderr.on('data', d => (err += d))
    py.on('error', reject)
    py.on('close', code => {
      if (code !== 0) return reject(new Error(`render.py çıxış ${code}: ${err.slice(-400)}`))
      try {
        const r = JSON.parse(out)
        r.ok ? resolve(r) : reject(new Error(r.error))
      } catch {
        reject(new Error(`render.py cavabı oxunmadı: ${out.slice(0, 200)}`))
      }
    })
    py.stdin.end(JSON.stringify({ ...item, out: outPath }), 'utf8')
  })
}

async function main() {
  if (has('--stats')) {
    const s = stats()
    for (const [t, v] of Object.entries(s)) {
      console.log(`${t.padEnd(8)} ${String(v.used).padStart(5)} / ${v.total} istifadə olunub`)
    }
    const total = Object.values(s).reduce((a, v) => a + v.total, 0)
    const used = Object.values(s).reduce((a, v) => a + v.used, 0)
    console.log(`${'CƏMİ'.padEnd(8)} ${String(used).padStart(5)} / ${total}`)
    console.log(`Gündə 3 post → təxminən ${Math.floor((total - used) / 3)} gün təkrarsız məzmun`)
    return
  }

  if (has('--check')) {
    const info = await checkAccount()
    console.log(JSON.stringify(info, null, 2))
    return
  }

  const dry = has('--dry') || !hasCredentials()
  if (dry && !has('--dry')) {
    log('XƏBƏRDARLIQ: IG açarları yoxdur — quru rejimə keçildi')
  }

  const type = typeForSlot()
  // Quru rejimdə elementi "istifadə olunmuş" kimi qeyd etmirik
  const item = pickNext(type, !dry)
  log(`məzmun: ${item.key} | ${item.source || 'istinadsız'}`)

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const fileName = `${stamp}-${item.type}.jpg`
  const imgPath = path.join(PUBLIC_DIR, fileName)

  await renderImage(item, imgPath)
  log(`şəkil: ${imgPath}`)

  const cap = await generateCaption(item)
  if (cap.fallback) log(`XƏBƏRDARLIQ: ehtiyat caption istifadə olundu — ${cap.reason}`)
  const caption = composeCaption(item, cap)

  if (dry) {
    log('QURU REJİM — paylaşılmadı')
    console.log('\n' + '─'.repeat(60) + '\n' + caption + '\n' + '─'.repeat(60))
    journal({ mode: 'dry', key: item.key, type: item.type, image: imgPath, fallback: !!cap.fallback })
    return
  }

  const imageUrl = `${PUBLIC_BASE.replace(/\/$/, '')}/${fileName}`
  log(`paylaşılır: ${imageUrl}`)
  const res = await publishPhoto(imageUrl, caption)
  log(`paylaşıldı: ${res.permalink || res.id}`)

  journal({
    mode: 'live',
    key: item.key,
    type: item.type,
    source: item.source,
    image: imageUrl,
    mediaId: res.id,
    permalink: res.permalink,
    fallback: !!cap.fallback,
    captionReason: cap.reason,
  })
}

main().catch(err => {
  log('XƏTA:', err.message)
  journal({ mode: 'error', error: err.message })
  process.exit(1)
})
