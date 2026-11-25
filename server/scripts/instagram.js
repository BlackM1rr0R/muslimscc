#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// Instagram avtoposteri — xidmət əmrləri (server/instagram.js, docs/INSTAGRAM.md)
//
//   Konteynerdə (serverdə, root):
//     cd /opt/muslimscc
//     TAG=$(cat .current_tag) docker compose exec api node scripts/instagram.js status
//         — konfiqurasiya, növbəti yuva, son dərclər (token çap olunmur)
//     TAG=$(cat .current_tag) docker compose exec api node scripts/instagram.js token-info
//         — hesab adı, IG_USER_ID uyğunluğu, 24 saatlıq dərc kvotası, token mənbəyi / bitmə tarixi (token çap olunmur)
//     TAG=$(cat .current_tag) docker compose exec -T api node scripts/instagram.js preview 0 --format story > card.jpg
//         — yuvanın kartı (JPEG stdout-a və ya --out faylına), caption stderr-ə. Dərc ETMİR, bazaya yazmır.
//     TAG=$(cat .current_tag) docker compose exec api node scripts/instagram.js publish-now --slot 1 --yes
//         — bu günün 1-ci yuvasını İNDİ dərc et (gündə yuva başına bir dəfə; IG_ENABLED=1 lazımdır)
//
//   Lokal önizləmə (şəbəkə: yalnız ayə üçün alquran.cloud):
//     node server/scripts/instagram.js preview 1 --format feed --lang az --date 2026-11-25 --out card.jpg
//
// DB yolu: env DB_PATH (susmaya görə /data/muslims.db — server.js ilə eyni). preview bazaya toxunmur (yaddaşdakı baza).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const fs = require('node:fs')
const { createInstagram, LANGS } = require('../instagram')

const USAGE = 'İstifadə:\n' +
  '  node scripts/instagram.js status\n' +
  '  node scripts/instagram.js token-info\n' +
  '  node scripts/instagram.js preview <yuva 0-5> [--format feed|story] [--lang az|en|ru|tr|ar] [--date YYYY-MM-DD] [--out fayl.jpg]\n' +
  '  node scripts/instagram.js publish-now --slot <0-5> --yes'

function parse(argv) {
  const o = { _: [], flags: new Set() }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--yes') o.flags.add('yes')
    else if (/^--(format|lang|date|out|slot)$/.test(a)) o[a.slice(2)] = argv[++i]
    else if (a.startsWith('--')) throw new Error(`Naməlum seçim: ${a}`)
    else o._.push(a)
  }
  return o
}

const iso = (t) => (t ? new Date(t).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '—')

function openDb(memory) {
  if (memory) {
    const { DatabaseSync } = require('node:sqlite')
    return new DatabaseSync(':memory:')
  }
  return require('../db').openDb(process.env.DB_PATH || '/data/muslims.db')
}

async function main() {
  let o
  try { o = parse(process.argv.slice(2)) } catch (e) { console.error(e.message + '\n' + USAGE); return 2 }
  const cmd = o._[0]
  if (!['status', 'token-info', 'preview', 'publish-now'].includes(cmd)) { console.error(USAGE); return 2 }
  const memory = cmd === 'preview'
  const db = openDb(memory)
  const ig = createInstagram({ db, env: process.env, publicOrigin: process.env.PUBLIC_ORIGIN || 'https://muslims.cc' })
  try {
    if (cmd === 'status') {
      const s = ig.status()
      console.log(`Vəziyyət: ${s.enabled ? 'AÇIQ' : `sönülü (${s.reason})`} · dil ${s.lang} · story ${s.stories ? 'bəli' : 'xeyr'} · ${s.host} · ${s.timezone}`)
      console.log(`Yuvalar: ${s.slots.map((x, i) => `${i}) ${x.time} ${x.kind}`).join('  ')}`)
      if (s.next) console.log(`Növbəti: ${s.next.date} ${s.next.time} (${s.next.kind})`)
      if (s.token) console.log(`Token: ${s.token.source}${s.token.refreshedAt ? ` · yenilənib ${iso(s.token.refreshedAt)}` : ''}${s.token.expiresAt ? ` · bitir ${iso(s.token.expiresAt)}` : ''}`)
      console.log('Son dərclər:')
      if (!s.posts.length) console.log('  (yoxdur)')
      for (const p of s.posts) console.log(`  ${p.day} ${p.slot} ${p.format.padEnd(5)} ${p.kind.padEnd(6)} ${String(p.status).padEnd(9)} ${p.item || ''} ${p.ig_media_id || ''}${p.error ? ` — ${p.error}` : ''}`)
      return 0
    }
    if (cmd === 'token-info') {
      const t = await ig.tokenInfo()
      if (t.error && !t.host) { console.error(`Sönülüdür: ${t.error}`); return 1 }
      console.log(`Host: ${t.host} ${t.version} · token: ${t.source}${t.refreshedAt ? ` (yenilənib ${iso(t.refreshedAt)})` : ''}${t.expiresAt ? ` · bitir ${iso(t.expiresAt)}` : ''}`)
      if (t.error) { console.error(`Xəta: ${t.error}`); return 1 }
      console.log(`Hesab: @${t.username || '?'}${t.accountType ? ` (${t.accountType})` : ''} · IG_USER_ID uyğundur: ${t.userIdMatches ? 'bəli' : 'XEYR'}`)
      if (t.quota) console.log(`24 saatlıq dərc kvotası: ${t.quota.usage}${t.quota.total ? ` / ${t.quota.total}` : ''}`)
      return 0
    }
    if (cmd === 'preview') {
      const slot = Number(o._[1])
      const format = o.format || 'feed'
      if (!Number.isInteger(slot) || slot < 0 || slot > 5 || !['feed', 'story'].includes(format)) { console.error(USAGE); return 2 }
      if (o.lang && !LANGS.includes(o.lang)) { console.error(USAGE); return 2 }
      if (o.date && !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) { console.error(USAGE); return 2 }
      const p = await ig.preview(slot, { format, date: o.date || null, lang: o.lang || undefined })
      if (!p) { console.error('Sığan element tapılmadı'); return 1 }
      if (o.out) fs.writeFileSync(o.out, p.jpeg)
      else if (process.stdout.isTTY) { console.error('JPEG terminala yazılmır — --out fayl.jpg və ya "> fayl.jpg"'); return 2 } else process.stdout.write(p.jpeg)
      console.error(`${p.kind} · ${p.item} · ${p.jpeg.length} bayt${o.out ? ` → ${o.out}` : ''}\n--- caption ---\n${p.caption}`)
      return 0
    }
    if (cmd === 'publish-now') {
      const slot = Number(o.slot)
      if (!Number.isInteger(slot) || !o.flags.has('yes')) { console.error('Təsdiq lazımdır: --slot <N> --yes'); return 2 }
      const r = await ig.publishNow(slot)
      if (r.error) { console.error(`Dərc olunmadı: ${r.error}`); return 1 }
      for (const [f, v] of Object.entries(r.results)) console.log(`${f}: ${v}`)
      return Object.values(r.results).every((v) => v !== 'failed') ? 0 : 1
    }
  } finally {
    try { db.close() } catch { /* */ }
  }
  return 0
}

main().then((code) => process.exit(code), (e) => { console.error('Xəta:', e && e.message); process.exit(1) })
