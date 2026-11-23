#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// Xoş gəldin məktubu — əl ilə göndəriş (server/welcome.js, şablon server/mailer.js → welcome)
//
//   Konteynerdə (serverdə, root):
//     cd /opt/muslimscc
//     TAG=$(cat .current_tag) docker compose exec api node scripts/send-welcome.js --to <email> [--lang az|en|ru|tr|ar|bi]
//         — BİR sınaq məktubu (welcome_sent-ə baxılmır və yazılmır). Susmaya görə --lang bi (en + ar).
//     TAG=$(cat .current_tag) docker compose exec api node scripts/send-welcome.js --all-verified --dry-run [--fallback-after-days 7]
//         — kim gözləyir: dili saxlanmış (növbəti açılışda avtomatik alacaq) və dili məlum olmayan
//           (ehtiyat göndərişinin namizədləri). Heç nə göndərilmir.
//     TAG=$(cat .current_tag) docker compose exec api node scripts/send-welcome.js --all-verified --send --fallback-after-days 7 [--limit N]
//         — funksiyanın işə düşməsindən (welcome_meta.started_at) N gün keçibsə: təsdiqlənmiş, bağlanmamış,
//           məktub almamış VƏ dili hələ də məlum olmayan hər hesaba ikidilli (en + ar) məktub; hər biri
//           welcome_sent-ə yazılır; saniyədə 1 məktub. N gün keçməyibsə heç nə göndərmir.
//
// Açarlar (RESEND_API_KEY) heç vaxt çap olunmur. Ünvanlar maskalanır (a***@example.com).
// DB yolu: env DB_PATH (susmaya görə /data/muslims.db — server.js ilə eyni).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const { createWelcome, DAY } = require('../welcome')
const { createMailer } = require('../mailer')

const USAGE = 'İstifadə:\n' +
  '  node scripts/send-welcome.js --to <email> [--lang az|en|ru|tr|ar|bi]\n' +
  '  node scripts/send-welcome.js --all-verified --dry-run [--fallback-after-days N]\n' +
  '  node scripts/send-welcome.js --all-verified --send --fallback-after-days N [--limit N]'
const TEST_LANGS = ['az', 'en', 'ru', 'tr', 'ar', 'bi']
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/

const mask = (e) => {
  const [u, d] = String(e).split('@')
  return `${(u || '').slice(0, 1)}***@${d || ''}`
}
const iso = (t) => new Date(t).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'

function parse(argv) {
  const o = { flags: new Set() }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--to' || a === '--lang' || a === '--fallback-after-days' || a === '--limit') { o[a.slice(2)] = argv[++i]; continue }
    if (a.startsWith('--')) { o.flags.add(a.slice(2)); continue }
    o.bad = a
  }
  return o
}

/**
 * Test edilə bilən giriş nöqtəsi. ctx: { db, mailer, now?, out?, err?, sleep?, publicOrigin? } → çıxış kodu
 */
async function run(argv, ctx) {
  const out = ctx.out || ((s) => console.log(s))
  const errOut = ctx.err || ((s) => console.error(s))
  const now = ctx.now || (() => Date.now())
  const sleep = ctx.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)))
  const o = parse(argv)
  const known = new Set(['all-verified', 'dry-run', 'send', 'enable-auto', 'disable-auto', 'status'])
  if (o.bad || [...o.flags].some((f) => !known.has(f))) { errOut(USAGE); return 2 }

  const welcome = createWelcome({ db: ctx.db, mailer: ctx.mailer, publicOrigin: ctx.publicOrigin || 'https://muslims.cc', now, gapMs: 0 })
  const { store } = welcome

  // ── Avtomatik göndəriş açarı (susmaya görə sönük; sahib sınaq məktubunu bəyənəndən sonra yandırılır) ──
  if (o.flags.has('enable-auto') || o.flags.has('disable-auto') || o.flags.has('status')) {
    if (o.flags.has('enable-auto')) store.setAuto(true)
    if (o.flags.has('disable-auto')) store.setAuto(false)
    out(`avtomatik xoş gəldin məktubu: ${store.autoEnabled() ? 'YANDIRILIB' : 'SÖNÜK'}`)
    return 0
  }

  // ── Bir sınaq məktubu ──
  if (o.to != null) {
    if (o.flags.size) { errOut(USAGE); return 2 }
    const email = String(o.to).trim().toLowerCase()
    const lang = o.lang == null ? 'bi' : o.lang
    if (!EMAIL_RE.test(email) || !TEST_LANGS.includes(lang)) { errOut(USAGE); return 2 }
    if (!ctx.mailer.enabled && !ctx.allowDisabled) { errOut('RESEND_API_KEY təyin olunmayıb — göndəriş mümkün deyil'); return 1 }
    const row = (ctx.db.raw || ctx.db).prepare('SELECT id, display_name FROM users WHERE email = ?').get(email)
    const r = await welcome.sendNow({ id: row ? row.id : 0, email, display_name: row ? row.display_name : '' }, lang, { record: false })
    if (!r.ok) { errOut(`✗ göndərilmədi (${r.reason})`); return 1 }
    out(`✓ sınaq məktubu göndərildi: ${mask(email)} (${lang}); welcome_sent-ə yazılmadı`)
    return 0
  }

  if (!o.flags.has('all-verified') || o.flags.has('dry-run') === o.flags.has('send')) { errOut(USAGE); return 2 }
  const days = o['fallback-after-days'] == null ? null : Number(o['fallback-after-days'])
  if (days != null && !(Number.isInteger(days) && days >= 0 && days <= 365)) { errOut('--fallback-after-days: 0..365 tam ədəd'); return 2 }
  const limit = o.limit == null ? Infinity : Number(o.limit)
  if (!(limit === Infinity || (Number.isInteger(limit) && limit > 0))) { errOut('--limit: müsbət tam ədəd'); return 2 }

  const started = store.startedAt()
  const pending = store.pending()
  const withLang = pending.filter((u) => u.lang)
  const noLang = pending.filter((u) => !u.lang)
  const eligibleAt = days == null ? null : started + days * DAY
  out(`Funksiyanın başlanğıcı: ${iso(started)}`)
  out(`Məktub almamış təsdiqli hesab: ${pending.length} (dili məlum — növbəti açılışda avtomatik: ${withLang.length}; dili məlum deyil: ${noLang.length})`)
  if (eligibleAt != null) out(`Ehtiyat (ikidilli) göndəriş: ${eligibleAt <= now() ? 'İNDİ mümkündür' : `${iso(eligibleAt)} tarixindən`}`)

  if (o.flags.has('dry-run')) {
    for (const u of noLang) out(`  #${u.id}  ${mask(u.email)}  qeydiyyat ${iso(u.created_at)}  → bi (en + ar)`)
    return 0
  }

  // ── --send ──
  if (days == null) { errOut('--send üçün --fallback-after-days N mütləqdir'); return 2 }
  if (eligibleAt > now()) { out('Hələ tezdir — heç nə göndərilmədi.'); return 0 }
  if (!ctx.mailer.enabled && !ctx.allowDisabled) { errOut('RESEND_API_KEY təyin olunmayıb — göndəriş mümkün deyil'); return 1 }
  let ok = 0, fail = 0
  for (const u of noLang.slice(0, limit === Infinity ? undefined : limit)) {
    const r = await welcome.sendNow(u, 'bi')
    if (r.ok) { ok++; out(`  ✓ #${u.id} ${mask(u.email)}`) } else { fail++; out(`  ✗ #${u.id} ${mask(u.email)} (${r.reason})`) }
    await sleep(1000)                                   // saniyədə 1 məktub
  }
  out(`Göndərildi: ${ok}, alınmadı: ${fail}`)
  return fail ? 1 : 0
}

if (require.main === module) {
  const { openDb } = require('../db')
  const db = openDb(process.env.DB_PATH || '/data/muslims.db')
  const mailer = createMailer({ apiKey: process.env.RESEND_API_KEY })
  const publicOrigin = (process.env.PUBLIC_ORIGIN || 'https://muslims.cc').replace(/\/+$/, '')
  run(process.argv.slice(2), { db, mailer, publicOrigin })
    .then((code) => { db.close(); process.exit(code) })
    .catch((e) => { console.error('xəta:', e && e.message); process.exit(1) })
}

module.exports = { run, mask }
