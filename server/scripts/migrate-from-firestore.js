#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// Firestore → SQLite köçürmə (docs/FIREBASE-EXIT.md)
//
//   TAG=$(cat .current_tag) docker compose exec api node scripts/migrate-from-firestore.js --dry-run
//   TAG=$(cat .current_tag) docker compose exec api node scripts/migrate-from-firestore.js
//   TAG=$(cat .current_tag) docker compose exec api node scripts/migrate-from-firestore.js --prune   # yalnız keçid anında!
//
// Nə köçürülür:
//   • videos, books, hadiths, duas, quotes, announcements, events, places → docs
//   • singletons/{daily,hero,settings} → docs (collection='singletons')
//   • notification_history → notification_history cədvəli
// Nə köçürülMÜR:
//   • fcm_tokens — yalnız sayılır. KEÇİD DÖVRÜNDƏ server onları birbaşa
//     Firestore-dan oxumağa davam edir (köhnə klient hələ ora yazır: yeni
//     abunə, şəhər/ayar dəyişikliyi). SQLite surəti dərhal köhnələrdi, FCM
//     isə onsuz da Firebase-dir — Firebase bağlananda o tokenlərin mənası qalmır.
//   • Firebase Auth istifadəçiləri — şifrə hash-ini köçürmək mümkün deyil;
//     admin `scripts/admin-user.js create <email>` ilə yeni şifrə qoyur.
//
// İdempotentdir: təkrar işlədəndə dublikat yaranmır; sənəd yalnız Firestore-dakı
// updateTime SQLite-dakı updated_at-dən YENİDİRSƏ yenilənir. Firestore-da
// silinmiş sənədlər SQLite-da qalır — onları --prune silir (yalnız keçid anında
// işlədin: keçiddən sonra yeni admin paneli SQLite-a yazanda --prune o yazıları silərdi).
// Vaxtlar: Firestore Timestamp → millisaniyə (rəqəm).
// Kimlik: server.js ilə eyni env (FIREBASE_PROJECT_ID / _CLIENT_EMAIL / _PRIVATE_KEY).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const { PUBLIC_COLLECTIONS, SINGLETONS, SINGLETON_COLLECTION, ID_RE } = require('../content')

/** Firestore Timestamp-ə bənzəyirmi? (SDK obyekti və ya JSON ehtiyat nüsxəsindəki forma) */
function timestampMillis(v) {
  if (!v || typeof v !== 'object') return null
  if (typeof v.toMillis === 'function') return v.toMillis()
  const keys = Object.keys(v).sort().join(',')
  if (keys === 'nanoseconds,seconds' && Number.isFinite(v.seconds) && Number.isFinite(v.nanoseconds)) {
    return v.seconds * 1000 + Math.floor(v.nanoseconds / 1e6)
  }
  if (keys === '_nanoseconds,_seconds' && Number.isFinite(v._seconds) && Number.isFinite(v._nanoseconds)) {
    return v._seconds * 1000 + Math.floor(v._nanoseconds / 1e6)
  }
  return null
}

/** Firestore dəyərini JSON-a çevir: Timestamp → ms, GeoPoint → {lat,lng}, Ref → yol, Bytes → base64. */
function convertValue(v) {
  if (v === null || v === undefined) return null
  if (typeof v !== 'object') return typeof v === 'number' && !Number.isFinite(v) ? null : v
  const ms = timestampMillis(v)
  if (ms !== null) return ms
  if (v instanceof Date) return v.getTime()
  if (Array.isArray(v)) return v.map(convertValue)
  if (Buffer.isBuffer(v) || v instanceof Uint8Array) return Buffer.from(v).toString('base64')
  if (typeof v.toBase64 === 'function') return v.toBase64()                         // Firestore Bytes
  if (typeof v.latitude === 'number' && typeof v.longitude === 'number' && Object.keys(v).length <= 2) {
    return { lat: v.latitude, lng: v.longitude }                                     // GeoPoint
  }
  if (typeof v.path === 'string' && v.firestore) return v.path                       // DocumentReference
  const out = {}
  for (const [k, x] of Object.entries(v)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue
    out[k] = convertValue(x)
  }
  return out
}

/**
 * Firestore sənədi → { id, data, createdAt, updatedAt } (ms).
 * snap: { id, data(), createTime?, updateTime? } — DocumentSnapshot və ya test obyekti.
 */
function convertDoc(snap) {
  const data = convertValue(snap.data() || {})
  delete data.id   // id sətir kimi ayrıca saxlanır (cavabda { id, ...data })
  const createTime = timestampMillis(snap.createTime)
  const updateTime = timestampMillis(snap.updateTime)
  const createdAt = typeof data.createdAt === 'number' ? data.createdAt : (createTime || updateTime || Date.now())
  const updatedAt = Math.max(updateTime || 0, typeof data.updatedAt === 'number' ? data.updatedAt : 0, createdAt)
  return { id: snap.id, data, createdAt, updatedAt }
}

function initFirebase() {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL } = process.env
  const FIREBASE_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error('FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY env-də yoxdur')
  }
  const admin = require('firebase-admin')
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY,
    }) })
  }
  return admin.firestore()
}

async function main() {
  const args = process.argv.slice(2)
  const dry = args.includes('--dry-run')
  const prune = args.includes('--prune')
  if (args.some((a) => !['--dry-run', '--prune'].includes(a))) {
    console.error('İstifadə: node scripts/migrate-from-firestore.js [--dry-run] [--prune]')
    process.exit(2)
  }

  const { openDb } = require('../db')
  const fs = initFirebase()
  const db = openDb()
  const report = []
  const add = (name, r) => report.push({ name, ...r })

  try {
    // ── Kolleksiyalar ──
    for (const col of PUBLIC_COLLECTIONS) {
      const snap = await fs.collection(col).get()
      const r = { total: snap.size, inserted: 0, updated: 0, skipped: 0, invalid: 0, pruned: 0 }
      const seen = new Set()
      for (const d of snap.docs) {
        if (!ID_RE.test(d.id)) { r.invalid++; continue }
        seen.add(d.id)
        const c = convertDoc(d)
        if (dry) {
          const prev = db.getDocMeta(col, c.id)
          if (!prev) r.inserted++; else if (c.updatedAt > prev.updated_at) r.updated++; else r.skipped++
        } else {
          r[db.importDoc(col, c.id, c.data, c.createdAt, c.updatedAt)]++
        }
      }
      if (prune) {
        for (const id of db.docIds(col)) {
          if (seen.has(id)) continue
          r.pruned++
          if (!dry) db.deleteDoc(col, id)
        }
      }
      add(col, r)
    }

    // ── Tək sənədlər ──
    {
      const r = { total: 0, inserted: 0, updated: 0, skipped: 0, invalid: 0, pruned: 0 }
      for (const id of SINGLETONS) {
        const d = await fs.collection(SINGLETON_COLLECTION).doc(id).get()
        if (!d.exists) continue
        r.total++
        const c = convertDoc(d)
        if (dry) {
          const prev = db.getDocMeta(SINGLETON_COLLECTION, id)
          if (!prev) r.inserted++; else if (c.updatedAt > prev.updated_at) r.updated++; else r.skipped++
        } else {
          r[db.importDoc(SINGLETON_COLLECTION, id, c.data, c.createdAt, c.updatedAt)]++
        }
      }
      add('singletons', r)
    }

    // ── Bildiriş tarixçəsi ──
    {
      const snap = await fs.collection('notification_history').get()
      const r = { total: snap.size, inserted: 0, updated: 0, skipped: 0, invalid: 0, pruned: 0 }
      const ins = db.raw.prepare(`INSERT OR IGNORE INTO notification_history
        (id, title, body, url, priority, sent_to, failed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      const exists = db.raw.prepare('SELECT 1 FROM notification_history WHERE id = ?')
      for (const d of snap.docs) {
        const c = convertDoc(d)
        const x = c.data
        if (exists.get(c.id)) { r.skipped++; continue }
        r.inserted++
        if (!dry) {
          ins.run(c.id, String(x.title || '').slice(0, 500), String(x.body || '').slice(0, 2000),
            String(x.url || '/').slice(0, 500), x.priority === 'high' ? 'high' : 'normal',
            Number.isFinite(x.sentTo) ? x.sentTo : 0, Number.isFinite(x.failed) ? x.failed : 0, c.createdAt)
        }
      }
      add('notification_history', r)
    }

    // ── Yalnız saylar ──
    const tokens = await fs.collection('fcm_tokens').count().get()
    const known = new Set([...PUBLIC_COLLECTIONS, SINGLETON_COLLECTION, 'notification_history', 'fcm_tokens'])
    const others = (await fs.listCollections()).map((c) => c.id).filter((id) => !known.has(id))

    console.log(dry ? '\nQURU İŞLƏMƏ (--dry-run) — heç nə yazılmadı\n' : '\nKöçürmə bitdi\n')
    console.log('kolleksiya'.padEnd(22) + 'cəmi  yeni  yenilənən  eyni  yararsız  silinən')
    for (const r of report) {
      console.log(r.name.padEnd(22) + [r.total, r.inserted, r.updated, r.skipped, r.invalid, r.pruned]
        .map((n, i) => String(n).padStart([4, 6, 11, 6, 10, 9][i])).join(''))
    }
    console.log(`\nfcm_tokens: ${tokens.data().count} (köçürülmür — keçid dövründə server Firestore-dan oxuyur)`)
    if (others.length) console.log(`Tanınmayan kolleksiyalar (köçürülmədi): ${others.join(', ')}`)
  } finally {
    db.close()
  }
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch((e) => {
    console.error('XƏTA:', e && e.message ? e.message : e)
    process.exit(1)
  })
}

module.exports = { timestampMillis, convertValue, convertDoc }
