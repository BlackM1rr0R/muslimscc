// ═══════════════════════════════════════════════════════════════════════
// P3.1 "Gizli dua dostu" — iki könüllü hesab 30 günlük dövr üçün təsadüfi cütlənir; kimliyi heç vaxt açılmır
//
// • Qoşulma könüllüdür (e-poçt təsdiqli hesab — requireVerified) + açıq razılıq (consent: true):
//   serverdə yalnız "qoşulub", dil, saat qurşağı, cüt və toxunulan günlər saxlanır.
// • Cütləmə saatlıq tick-dədir (dərhal yox — eyni anda qoşulan iki nəfər bir-birini tanımasın):
//   eyni dil üstündür, tək qalanlar dillər arası; əvvəlki dostla mümkünsə təkrar cütlənmir. pairUp() saf funksiyadır.
// • Hər gün (öz yerli günündə) bir dəfə "Bu gün gizli dostum üçün dua etdim" → dostun gələn qutusuna
//   "Bu gün kimsə sizin üçün dua etdi" sətri; push abunəsi varsa bildiriş (≥ 10 dəq gecikmə ilə, yerli
//   08–21 arası — vaxta görə tanımaq çətinləşsin, gecə oyatmasın). Sayğac, müqayisə, seriya YOXDUR.
// • Sərbəst mətn YOXDUR (heç bir sahə) — sui-istifadə, moderasiya ehtiyacı yoxdur.
// • Dosta HEÇ VAXT ad, e-poçt, id, dil, saat qurşağı göstərilmir. Cavablarda yalnız dövrün tarixləri və günlər.
// • İstənilən vaxt çıxmaq olar: üzvlük və cari cüt silinir (işarələr CASCADE); dost növbəti tick-də
//   yeni dövrə yenidən cütlənir. Dövr bitəndə cüt və işarələri silinir (purge), üzvlər yenidən cütlənir.
//
// Cədvəllər MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS); users(id) ON DELETE CASCADE.
//
// Endpoint-lər (requireUser — cookie + CSRF; /api/dua-friend limiti):
//   GET    /api/dua-friend          → { joined, verified, pair: null | { startedAt, endsAt, prayedToday, forMeToday }, inbox:[{ day }] }
//   POST   /api/dua-friend/join     { consent: true, lang?, tz? } → { ok } (təsdiqli e-poçt; təkrar — dil/qurşaq yenilənir)
//   POST   /api/dua-friend/pray     → { ok, already }
//   POST   /api/dua-friend/seen     → { ok } (gələn qutusu oxundu)
//   DELETE /api/dua-friend          → { ok } (çıx)
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')
const kit = require('./communityKit')
const { validTz, localNow } = require('./personal')

const ROUND_MS = 30 * 86400000
const PUSH_DELAY_MS = 10 * 60e3
const PUSH_GIVE_UP_MS = 20 * 3600e3
const PUSH_HOURS = [8, 21]           // alıcının yerli saatı [başlanğıc, son)
const MAX_INBOX = 30
const LANG_RE = /^[a-z]{2,3}$/
const PUSH_LANGS = ['az', 'en', 'ru', 'tr', 'ar']

const SCHEMA = `
CREATE TABLE IF NOT EXISTS dua_friend_members (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  lang       TEXT NOT NULL,
  tz         TEXT NOT NULL,
  prev_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  consent_at INTEGER NOT NULL,
  joined_at  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS dua_friend_pairs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  a_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  b_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at INTEGER NOT NULL,
  ends_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS dua_friend_pairs_a ON dua_friend_pairs(a_id, ends_at);
CREATE INDEX IF NOT EXISTS dua_friend_pairs_b ON dua_friend_pairs(b_id, ends_at);
CREATE TABLE IF NOT EXISTS dua_friend_marks (
  pair_id    INTEGER NOT NULL REFERENCES dua_friend_pairs(id) ON DELETE CASCADE,
  from_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day        TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  pushed_at  INTEGER,
  seen_at    INTEGER,
  PRIMARY KEY (pair_id, from_id, day)
);
CREATE INDEX IF NOT EXISTS dua_friend_marks_push ON dua_friend_marks(pushed_at, created_at);
`

const PUSH = {
  az: { title: 'Gizli dua dostu', body: 'Bu gün kimsə sizin üçün dua etdi.' },
  en: { title: 'Secret dua friend', body: 'Someone made dua for you today.' },
  ru: { title: 'Тайный друг по дуа', body: 'Сегодня кто-то сделал дуа за вас.' },
  tr: { title: 'Gizli dua arkadaşı', body: 'Bugün biri sizin için dua etti.' },
  ar: { title: 'صديق الدعاء الخفي', body: 'دعا لك أحدهم اليوم.' },
}
const langPrefix = (lang) => (lang === 'az' ? '' : `/${PUSH_LANGS.includes(lang) ? lang : 'en'}`)

function shuffle(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Bir hovuzu cütlə: əvvəlki dostdan qaçır (alternativ yoxdursa yenə cütləyir). → { pairs, left } */
function pairPool(list, rnd) {
  const pool = shuffle([...list], rnd)
  const pairs = []
  while (pool.length >= 2) {
    const a = pool.shift()
    let k = pool.findIndex((b) => b.id !== a.prev && b.prev !== a.id)
    if (k < 0) k = 0
    const [b] = pool.splice(k, 1)
    pairs.push([a.id, b.id])
  }
  return { pairs, left: pool }
}

/**
 * Saf cütləmə: members [{ id, lang, prev? }] → { pairs: [[idA, idB]…], waiting: [id…] }
 * Əvvəl eyni dil daxilində, sonra hər dildən tək qalanlar bir-biri ilə. Ən çox bir nəfər gözləyir.
 */
function pairUp(members, rnd = Math.random) {
  const seen = new Set()
  const groups = new Map()
  for (const m of members || []) {
    if (!m || !Number.isInteger(m.id) || seen.has(m.id)) continue
    seen.add(m.id)
    const g = groups.get(m.lang) || []
    g.push({ id: m.id, lang: m.lang, prev: m.prev == null ? null : m.prev })
    groups.set(m.lang, g)
  }
  const pairs = []
  const rest = []
  for (const key of [...groups.keys()].sort()) {
    const r = pairPool(groups.get(key), rnd)
    pairs.push(...r.pairs)
    rest.push(...r.left)
  }
  const r = pairPool(rest, rnd)
  pairs.push(...r.pairs)
  return { pairs, waiting: r.left.map((m) => m.id) }
}

function createDuaFriendRouter({
  db, requireUser, now = () => Date.now(), rnd = Math.random,
  pushSubsOf = () => [], pushSend = null, icons = {}, log = console,
}) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const tx = db.tx || ((fn) => fn())
  const p = (sql) => raw.prepare(sql)
  const st = {
    member: p('SELECT * FROM dua_friend_members WHERE user_id = ?'),
    upsert: p(`INSERT INTO dua_friend_members (user_id, lang, tz, consent_at, joined_at) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET lang = excluded.lang, tz = excluded.tz`),
    leave: p('DELETE FROM dua_friend_members WHERE user_id = ?'),
    pairOf: p('SELECT * FROM dua_friend_pairs WHERE (a_id = ? OR b_id = ?) AND ends_at > ? ORDER BY id DESC LIMIT 1'),
    delPairsOf: p('DELETE FROM dua_friend_pairs WHERE a_id = ? OR b_id = ?'),
    ended: p('SELECT * FROM dua_friend_pairs WHERE ends_at <= ?'),
    delEnded: p('DELETE FROM dua_friend_pairs WHERE ends_at <= ?'),
    setPrev: p('UPDATE dua_friend_members SET prev_id = ? WHERE user_id = ?'),
    unpaired: p(`SELECT user_id, lang, prev_id FROM dua_friend_members m WHERE NOT EXISTS
      (SELECT 1 FROM dua_friend_pairs x WHERE (x.a_id = m.user_id OR x.b_id = m.user_id) AND x.ends_at > ?)`),
    addPair: p('INSERT INTO dua_friend_pairs (a_id, b_id, started_at, ends_at) VALUES (?, ?, ?, ?)'),
    mark: p('INSERT OR IGNORE INTO dua_friend_marks (pair_id, from_id, day, created_at) VALUES (?, ?, ?, ?)'),
    myMark: p('SELECT 1 FROM dua_friend_marks WHERE pair_id = ? AND from_id = ? AND day = ?'),
    toMe: p('SELECT created_at, seen_at FROM dua_friend_marks WHERE pair_id = ? AND from_id != ? ORDER BY created_at DESC LIMIT 200'),
    seen: p('UPDATE dua_friend_marks SET seen_at = ? WHERE pair_id = ? AND from_id != ? AND seen_at IS NULL'),
    toPush: p(`SELECT k.rowid AS rid, k.pair_id, k.from_id, k.created_at, x.a_id, x.b_id FROM dua_friend_marks k
      JOIN dua_friend_pairs x ON x.id = k.pair_id WHERE k.pushed_at IS NULL AND k.created_at <= ? ORDER BY k.created_at LIMIT 500`),
    pushed: p('UPDATE dua_friend_marks SET pushed_at = ? WHERE rowid = ? AND pushed_at IS NULL'),
    myMarksAll: p(`SELECT k.day FROM dua_friend_marks k WHERE k.from_id = ? ORDER BY k.day`),
    receivedAll: p(`SELECT k.created_at FROM dua_friend_marks k JOIN dua_friend_pairs x ON x.id = k.pair_id
      WHERE (x.a_id = ? OR x.b_id = ?) AND k.from_id != ? ORDER BY k.created_at`),
  }
  const router = express.Router()
  const json = express.json({ limit: '2kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const tzOf = (m) => (m && validTz(m.tz) ? m.tz : 'UTC')
  const dayIn = (ms, tz) => localNow(ms, tz).date

  function state(uid) {
    const t = now()
    const m = st.member.get(uid)
    if (!m) return { joined: false, pair: null, inbox: [] }
    const pr = st.pairOf.get(uid, uid, t)
    if (!pr) return { joined: true, pair: null, inbox: [] }
    const tz = tzOf(m)
    const today = dayIn(t, tz)
    const recv = st.toMe.all(pr.id, uid)
    const inboxDays = []
    for (const r of recv) {
      if (r.seen_at != null) continue
      const d = dayIn(r.created_at, tz)
      if (!inboxDays.includes(d)) inboxDays.push(d)
      if (inboxDays.length >= MAX_INBOX) break
    }
    return {
      joined: true,
      pair: {
        startedAt: pr.started_at, endsAt: pr.ends_at,
        prayedToday: Boolean(st.myMark.get(pr.id, uid, today)),
        forMeToday: recv.some((r) => dayIn(r.created_at, tz) === today),
      },
      inbox: inboxDays.map((day) => ({ day })),
    }
  }

  router.use('/dua-friend', (req, res, next) => { res.set('Cache-Control', 'no-store'); next() })

  router.get('/dua-friend', auth, (req, res) => {
    res.json({ ...state(req.user.id), verified: kit.isVerified(req.user), roundDays: ROUND_MS / 86400000 })
  })

  router.post('/dua-friend/join', auth, kit.requireVerified, json, (req, res) => {
    const b = req.body || {}
    const uid = req.user.id
    const existing = st.member.get(uid)
    if (!existing && b.consent !== true) return err(res, 400, 'consent_required', 'Consent required')
    if (b.lang != null && (typeof b.lang !== 'string' || !LANG_RE.test(b.lang))) return err(res, 400, 'bad_request', 'Invalid language')
    if (b.tz != null && !validTz(b.tz)) return err(res, 400, 'bad_request', 'Invalid time zone')
    const lang = b.lang || (existing && existing.lang) || 'en'
    const tz = b.tz || (existing && existing.tz) || 'UTC'
    const t = now()
    st.upsert.run(uid, lang, tz, t, t)
    res.json({ ok: true })
  })

  router.post('/dua-friend/pray', auth, kit.requireVerified, (req, res) => {
    const uid = req.user.id
    const m = st.member.get(uid)
    if (!m) return err(res, 404, 'not_joined', 'Not joined')
    const t = now()
    const pr = st.pairOf.get(uid, uid, t)
    if (!pr) return err(res, 409, 'not_paired', 'Waiting for a secret friend')
    const changes = st.mark.run(pr.id, uid, dayIn(t, tzOf(m)), t).changes
    res.json({ ok: true, already: changes === 0 })
  })

  router.post('/dua-friend/seen', auth, (req, res) => {
    const uid = req.user.id
    const pr = st.pairOf.get(uid, uid, now())
    if (pr) st.seen.run(now(), pr.id, uid)
    res.json({ ok: true })
  })

  router.delete('/dua-friend', auth, (req, res) => {
    const uid = req.user.id
    tx(() => {
      st.delPairsOf.run(uid, uid)
      st.leave.run(uid)
    })
    res.json({ ok: true })
  })

  // eslint-disable-next-line no-unused-vars
  router.use('/dua-friend', (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    log.error('dua friend error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  /** Bitmiş dövrlər silinir (işarələr CASCADE), əvvəlki dost yadda qalır; cütsüzlər cütlənir. → { ended, paired } */
  router.pairTick = () => {
    const t = now()
    return tx(() => {
      const ended = st.ended.all(t)
      for (const pr of ended) {
        st.setPrev.run(pr.b_id, pr.a_id)
        st.setPrev.run(pr.a_id, pr.b_id)
      }
      if (ended.length) st.delEnded.run(t)
      const members = st.unpaired.all(t).map((r) => ({ id: r.user_id, lang: r.lang, prev: r.prev_id }))
      const { pairs } = pairUp(members, rnd)
      for (const [a, b] of pairs) st.addPair.run(a, b, t, t + ROUND_MS)
      return { ended: ended.length, paired: pairs.length }
    })
  }
  router.purge = () => router.pairTick().ended

  /** Push: gecikmə ilə, alıcının yerli 08–21 saatlarında; abunə yoxdursa — yalnız gələn qutusu. → göndərilən say */
  let busy = false
  router.tick = async () => {
    if (busy) return 0
    busy = true
    let sent = 0
    try {
      const t = now()
      for (const r of st.toPush.all(t - PUSH_DELAY_MS)) {
        const to = r.from_id === r.a_id ? r.b_id : r.a_id
        const m = st.member.get(to)
        if (!m || !pushSend) { st.pushed.run(t, r.rid); continue }
        const hour = localNow(t, tzOf(m)).hour
        const inHours = hour >= PUSH_HOURS[0] && hour < PUSH_HOURS[1]
        if (!inHours) { if (t - r.created_at > PUSH_GIVE_UP_MS) st.pushed.run(t, r.rid); continue }
        // Əvvəlcə ATOM işarə — deploy zamanı yanaşı işləyən ikinci proses təkrar göndərməsin
        if (st.pushed.run(t, r.rid).changes !== 1) continue
        const subs = pushSubsOf(to) || []
        if (!subs.length) continue
        const T = PUSH[m.lang] || PUSH.en
        try {
          await pushSend(subs, {
            notification: { title: T.title, body: T.body },
            webpush: { notification: { ...icons, tag: 'dua-friend' }, link: `${langPrefix(m.lang)}/secret-dua-friend` },
          }, 'dua friend')
          sent++
        } catch (e) { log.error('dua friend push:', e && e.message) }
      }
    } finally { busy = false }
    return sent
  }

  /** "Mənim məlumatlarım": üzvlük, cari dövr, öz toxunduğum günlər, mənim üçün dua edilən anlar (dostun kimliyi YOX) */
  router.exportUser = (uid) => {
    const m = st.member.get(uid)
    const pr = st.pairOf.get(uid, uid, now())
    return {
      member: m ? { lang: m.lang, tz: m.tz, consentAt: m.consent_at, joinedAt: m.joined_at } : null,
      round: pr ? { startedAt: pr.started_at, endsAt: pr.ends_at } : null,
      myDuaDays: st.myMarksAll.all(uid).map((r) => r.day),
      duaForMeAt: st.receivedAll.all(uid, uid, uid).map((r) => r.created_at),
    }
  }
  router.summaryUser = (uid) => ({ joined: Boolean(st.member.get(uid)), paired: Boolean(st.pairOf.get(uid, uid, now())) })
  return router
}

module.exports = { createDuaFriendRouter, pairUp, ROUND_MS, PUSH_DELAY_MS, PUSH_HOURS, MAX_INBOX }
