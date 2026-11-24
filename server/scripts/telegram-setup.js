#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// Telegram botu — webhook-un qurulması (server/telegramBot.js, docs/TELEGRAM-BOT.md)
//
//   Serverdə (root):
//     cd /opt/muslimscc
//     TAG=$(cat .current_tag) docker compose exec -T api node scripts/telegram-setup.js me       — bot kimdir (getMe)
//     TAG=$(cat .current_tag) docker compose exec -T api node scripts/telegram-setup.js set      — webhook + əmrlər menyusu (5 dil)
//     TAG=$(cat .current_tag) docker compose exec -T api node scripts/telegram-setup.js info     — webhook vəziyyəti
//     TAG=$(cat .current_tag) docker compose exec -T api node scripts/telegram-setup.js delete   — webhook-u sil (bot susur)
//
// Env (api.env): TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET; istəyə bağlı PUBLIC_ORIGIN (susmaya görə https://muslims.cc).
// Token və sirr HEÇ VAXT çap olunmur (webhook ünvanında sirr maskalanır).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const { COMMANDS, LANGS, SECRET_RE } = require('../telegramBot')

const USAGE = 'İstifadə: node scripts/telegram-setup.js <me|set|info|delete>'
const TOKEN = String(process.env.TELEGRAM_BOT_TOKEN || '').trim()
const SECRET = String(process.env.TELEGRAM_WEBHOOK_SECRET || '').trim()
const ORIGIN = String(process.env.PUBLIC_ORIGIN || 'https://muslims.cc').replace(/\/+$/, '')

const mask = (s) => String(s || '').split(SECRET || '\u0000').join('<sirr>').split(TOKEN || '\u0000').join('<token>')

async function call(method, payload = {}) {
  let r, j
  try {
    r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
    })
    j = await r.json().catch(() => null)
  } catch (e) {
    throw new Error(`${method}: şəbəkə xətası (${e && e.name})`)
  }
  if (!j || !j.ok) throw new Error(`${method}: ${(j && j.error_code) || r.status} ${mask(j && j.description)}`)
  return j.result
}

async function main() {
  const cmd = process.argv[2]
  if (!['me', 'set', 'info', 'delete'].includes(cmd)) { console.error(USAGE); process.exit(2) }
  if (!TOKEN) { console.error('TELEGRAM_BOT_TOKEN yoxdur (api.env)'); process.exit(1) }

  if (cmd === 'me') {
    const me = await call('getMe')
    console.log(`Bot: @${me.username} (id ${me.id}) — ${me.first_name}`)
    console.log(`.env.public üçün: VITE_TELEGRAM_BOT=${me.username}`)
    return
  }
  if (cmd === 'info') {
    const w = await call('getWebhookInfo')
    console.log(`url: ${mask(w.url) || '(yoxdur)'}`)
    console.log(`gözləyən yeniləmə: ${w.pending_update_count}`)
    if (w.last_error_date) console.log(`son xəta: ${new Date(w.last_error_date * 1000).toISOString()} — ${mask(w.last_error_message)}`)
    return
  }
  if (cmd === 'delete') {
    await call('deleteWebhook', { drop_pending_updates: true })
    console.log('Webhook silindi — bot artıq yeniləmə almır.')
    return
  }
  // set
  if (!SECRET_RE.test(SECRET)) {
    console.error('TELEGRAM_WEBHOOK_SECRET yoxdur və ya yararsızdır: 24–256 simvol, yalnız A-Z a-z 0-9 _ -')
    console.error('Yaratmaq üçün: openssl rand -hex 32')
    process.exit(1)
  }
  await call('setWebhook', {
    url: `${ORIGIN}/api/telegram/webhook`,   // sirr YALNIZ başlıqda — URL jurnallara düşür
    secret_token: SECRET,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
    max_connections: 10,
  })
  console.log(`Webhook quruldu: ${ORIGIN}/api/telegram/webhook`)
  // Əmrlər menyusu: susmaya görə ingiliscə, hər dil üçün öz tərcüməsi
  const list = (l) => COMMANDS[l].map(([command, description]) => ({ command, description }))
  await call('setMyCommands', { commands: list('en') })
  for (const l of LANGS) await call('setMyCommands', { commands: list(l), language_code: l })
  console.log('Əmrlər menyusu yazıldı (en + az/en/ru/tr/ar).')
  const me = await call('getMe')
  console.log(`Bot: @${me.username} — .env.public üçün: VITE_TELEGRAM_BOT=${me.username}`)
}

main().catch((e) => { console.error(mask(e && e.message)); process.exit(1) })
