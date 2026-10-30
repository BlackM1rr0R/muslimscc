#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// VAPID açar cütü yarat (standart Web Push üçün) — BİR DƏFƏ
//
//   node scripts/gen-vapid.js <gizli-açar-faylı>
//
// • AÇIQ açar stdout-a çıxır (sirr deyil — brauzerə də gedir).
// • GİZLİ açar YALNIZ göstərilən fayla yazılır (icazə 0600), ekrana çıxmır.
//   Fayl artıq varsa skript onu əzmir (açarı dəyişmək bütün abunəlikləri öldürür!).
//
// Sonra api.env-ə əlavə et (docs/FIREBASE-EXIT.md → "VAPID açarları"):
//   VAPID_PUBLIC_KEY=<stdout-dakı açar>
//   VAPID_PRIVATE_KEY=<fayldakı açar>
//   VAPID_SUBJECT=mailto:<sahibin e-poçtu>
// və gizli açar faylını sil (shred -u).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const fs = require('node:fs')
const crypto = require('node:crypto')

const out = process.argv[2]
if (!out || out.startsWith('-')) {
  console.error('İstifadə: node scripts/gen-vapid.js <gizli-açar-faylı>')
  process.exit(2)
}

// P-256 açar cütü (web-push.generateVAPIDKeys() ilə eyni format: base64url,
// açıq — 65 bayt sıxılmamış nöqtə, gizli — 32 bayt skalyar)
const ecdh = crypto.createECDH('prime256v1')
ecdh.generateKeys()
const publicKey = ecdh.getPublicKey().toString('base64url')
const priv = ecdh.getPrivateKey()   // başdakı sıfır baytlar düşə bilər — 32 bayta tamamla
const privateKey = Buffer.concat([Buffer.alloc(32 - priv.length), priv]).toString('base64url')

try {
  // 'wx' — fayl varsa xəta (köhnə açar təsadüfən əzilməsin); mode 0600
  const fd = fs.openSync(out, 'wx', 0o600)
  fs.writeSync(fd, privateKey + '\n')
  fs.closeSync(fd)
  try { fs.chmodSync(out, 0o600) } catch { /* Windows */ }
} catch (e) {
  console.error(`XƏTA: ${out} yazılmadı (${e.code === 'EEXIST' ? 'fayl artıq var' : e.code || e.message})`)
  process.exit(1)
}

process.stdout.write(publicKey + '\n')
console.error(`Gizli açar → ${out} (0600). api.env-ə köçürüb faylı silin.`)
