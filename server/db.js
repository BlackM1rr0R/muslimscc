// ═══════════════════════════════════════════════════════════════════════
// Verilənlər bazası — node:sqlite (Node 22-də daxili, əlavə asılılıq yoxdur)
//
// Fayl: env DB_PATH (susmaya görə /data/muslims.db — docker-compose-da named
// volume). WAL rejimi: oxumalar yazmanı gözləmir, ehtiyat nüsxə (VACUUM INTO)
// işləyən serveri dayandırmır.
//
// Sxem Firestore-a bənzəyir ki, klient keçidi asan olsun:
//   docs(collection, id, data JSON, created_at, updated_at) — ictimai məzmun
//     (videos, books, ...) və tək sənədlər (collection='singletons', id=daily|hero|settings)
//   push_subs            — standart Web Push abunəlikləri (FCM-siz)
//   admins, sessions     — admin girişi (server/auth.js)
//   notification_history — admin panelindən göndərilmiş bildirişlər
//
// Miqrasiyalar: PRAGMA user_version — hər yeni versiya MIGRATIONS-a sona
// əlavə olunur, köhnələr DƏYİŞMİR. Bütün sorğular parametrlidir.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { DatabaseSync } = require('node:sqlite')

const MIGRATIONS = [
  // 1 — ilkin sxem
  `
  CREATE TABLE docs (
    collection TEXT NOT NULL,
    id         TEXT NOT NULL,
    data       TEXT NOT NULL CHECK (json_valid(data)),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (collection, id)
  ) WITHOUT ROWID;
  CREATE INDEX docs_by_created ON docs(collection, created_at DESC);
  CREATE INDEX docs_by_updated ON docs(updated_at);

  CREATE TABLE push_subs (
    endpoint    TEXT PRIMARY KEY,
    keys_p256dh TEXT NOT NULL,
    keys_auth   TEXT NOT NULL,
    lang        TEXT NOT NULL DEFAULT 'az',
    loc         TEXT CHECK (loc IS NULL OR json_valid(loc)),
    prefs       TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(prefs)),
    user_agent  TEXT NOT NULL DEFAULT '',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE admins (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    pass_hash  TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE sessions (
    id_hash    TEXT PRIMARY KEY,
    admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX sessions_by_admin ON sessions(admin_id);
  CREATE INDEX sessions_by_expiry ON sessions(expires_at);

  CREATE TABLE notification_history (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    body       TEXT NOT NULL,
    url        TEXT NOT NULL DEFAULT '/',
    priority   TEXT NOT NULL DEFAULT 'normal',
    sent_to    INTEGER NOT NULL DEFAULT 0,
    failed     INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX history_by_created ON notification_history(created_at DESC);
  `,
  // 2 — müvəqqəti şifrə: admin-user.js (create / set-password) ilə qoyulan şifrə
  // ilk girişdə panelin "Şifrəni dəyiş" formasında dəyişdirilməlidir
  `
  ALTER TABLE admins ADD COLUMN must_change INTEGER NOT NULL DEFAULT 0;
  `,
]

const SCHEMA_VERSION = MIGRATIONS.length

/** Firestore avtomatik ID-sinə bənzər 20 simvollu təsadüfi ID. */
const ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
function newId(len = 20) {
  const bytes = crypto.randomBytes(len)
  let s = ''
  // 62-yə bölünmə ilə kiçik meyl qalır — ID üçün əhəmiyyətsizdir (sirr deyil)
  for (let i = 0; i < len; i++) s += ID_ALPHABET[bytes[i] % ID_ALPHABET.length]
  return s
}

function migrate(db) {
  const cur = db.prepare('PRAGMA user_version').get().user_version
  if (cur > SCHEMA_VERSION) {
    throw new Error(`DB sxemi (${cur}) koddan (${SCHEMA_VERSION}) yenidir — köhnə versiya ilə açmaq olmaz`)
  }
  for (let v = cur; v < SCHEMA_VERSION; v++) {
    db.exec('BEGIN IMMEDIATE')
    try {
      db.exec(MIGRATIONS[v])
      db.exec(`PRAGMA user_version = ${v + 1}`)   // pragma parametr qəbul etmir; v — öz rəqəmimizdir
      db.exec('COMMIT')
    } catch (e) {
      db.exec('ROLLBACK')
      throw e
    }
  }
}

/**
 * Bazanı aç (yoxdursa yarat) və sxemi son versiyaya çatdır.
 * file — yol və ya ':memory:' (testlər).
 */
function openDb(file = process.env.DB_PATH || '/data/muslims.db') {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true })
  const db = new DatabaseSync(file)
  db.exec('PRAGMA busy_timeout = 5000')
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA synchronous = NORMAL')
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db)
  return wrap(db)
}

/** JSON sətrini təhlükəsiz oxu. */
function parseJson(s, fallback = null) {
  if (s == null) return fallback
  try { return JSON.parse(s) } catch { return fallback }
}

function wrap(db) {
  const st = {
    list: db.prepare('SELECT id, data FROM docs WHERE collection = ? ORDER BY created_at DESC, id ASC'),
    get: db.prepare('SELECT id, data, created_at, updated_at FROM docs WHERE collection = ? AND id = ?'),
    insert: db.prepare('INSERT INTO docs (collection, id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'),
    upsert: db.prepare(`INSERT INTO docs (collection, id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(collection, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`),
    // Köçürmə: yalnız mənbə daha yenidirsə yenilə (idempotent təkrar işləmə)
    upsertIfNewer: db.prepare(`INSERT INTO docs (collection, id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(collection, id) DO UPDATE SET data = excluded.data, created_at = excluded.created_at,
        updated_at = excluded.updated_at
      WHERE excluded.updated_at > docs.updated_at`),
    update: db.prepare('UPDATE docs SET data = ?, updated_at = ? WHERE collection = ? AND id = ?'),
    del: db.prepare('DELETE FROM docs WHERE collection = ? AND id = ?'),
    ids: db.prepare('SELECT id FROM docs WHERE collection = ?'),
    count: db.prepare('SELECT COUNT(*) AS n FROM docs WHERE collection = ?'),
    version: db.prepare('SELECT MAX(updated_at) AS v FROM docs WHERE collection = ?'),
    versionAll: db.prepare('SELECT MAX(updated_at) AS v FROM docs'),
  }

  const tx = (fn) => {
    db.exec('BEGIN IMMEDIATE')
    try {
      const r = fn()
      db.exec('COMMIT')
      return r
    } catch (e) {
      db.exec('ROLLBACK')
      throw e
    }
  }

  const toDoc = (row) => (row ? { id: row.id, ...parseJson(row.data, {}) } : null)

  return {
    raw: db,
    tx,
    close: () => db.close(),
    ping: () => db.prepare('SELECT 1 AS ok').get().ok === 1,

    // ── Sənədlər (Firestore-a bənzər) ──
    listDocs: (collection) => st.list.all(collection).map(toDoc),
    getDoc: (collection, id) => toDoc(st.get.get(collection, id)),
    getDocMeta: (collection, id) => st.get.get(collection, id) || null,
    countDocs: (collection) => st.count.get(collection).n,
    docIds: (collection) => st.ids.all(collection).map((r) => r.id),
    /** Kolleksiyada (və ya hamısında) son dəyişiklik vaxtı (ms) — klientin ucuz yoxlaması. */
    version: (collection) => (collection ? st.version.get(collection).v : st.versionAll.get().v) || 0,

    /** addDoc: yeni ID, createdAt = indi (ms). */
    addDoc(collection, data, now = Date.now()) {
      const id = newId()
      const doc = { ...data, createdAt: now }
      st.insert.run(collection, id, JSON.stringify(doc), now, now)
      return { id, ...doc }
    },
    /** setDoc (merge YOX): sənəd tam əvəz olunur; createdAt (varsa) qorunur. */
    setDoc(collection, id, data, now = Date.now()) {
      return tx(() => {
        const prev = st.get.get(collection, id)
        const prevData = prev ? parseJson(prev.data, {}) : {}
        const doc = { ...data, updatedAt: now }
        if (prevData.createdAt !== undefined && doc.createdAt === undefined) doc.createdAt = prevData.createdAt
        else if (!prev && doc.createdAt === undefined) doc.createdAt = now
        st.upsert.run(collection, id, JSON.stringify(doc), prev ? prev.created_at : now, now)
        return { id, ...doc }
      })
    },
    /** updateDoc: üst səviyyə sahələr birləşir; sənəd yoxdursa null. */
    updateDoc(collection, id, patch, now = Date.now()) {
      return tx(() => {
        const prev = st.get.get(collection, id)
        if (!prev) return null
        const doc = { ...parseJson(prev.data, {}), ...patch, updatedAt: now }
        st.update.run(JSON.stringify(doc), now, collection, id)
        return { id, ...doc }
      })
    },
    deleteDoc: (collection, id) => st.del.run(collection, id).changes > 0,
    /** Köçürmə üçün: verilən vaxtlarla yaz, yalnız daha yenidirsə yenilə. → 'inserted'|'updated'|'skipped' */
    importDoc(collection, id, data, createdAt, updatedAt) {
      const prev = st.get.get(collection, id)
      const r = st.upsertIfNewer.run(collection, id, JSON.stringify(data), createdAt, updatedAt)
      if (!prev) return 'inserted'
      return r.changes > 0 ? 'updated' : 'skipped'
    },
  }
}

module.exports = { openDb, newId, parseJson, SCHEMA_VERSION, MIGRATIONS }
