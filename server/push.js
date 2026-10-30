// ═══════════════════════════════════════════════════════════════════════
// Standart Web Push (FCM-siz) — `web-push` paketi, VAPID açarları env-dən
//
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  — server/scripts/gen-vapid.js yaradır
//   VAPID_SUBJECT                        — mailto:<sahibin e-poçtu> (kodda YOX)
//
// API:
//   GET   /api/push/vapid-public-key  → { key }   (klient pushManager.subscribe üçün)
//   POST  /api/push/subscribe         { subscription:{endpoint,keys:{p256dh,auth}}, lang, loc, prefs, userAgent? }
//   PATCH /api/push/subscription      { endpoint, lang?, loc?, prefs? }   (yalnız verilən sahələr)
//   POST  /api/push/unsubscribe       { endpoint }
// Endpoint ünvanını bilən öz abunəliyini idarə edir (Firestore-dakı
// fcm_tokens/<token> modeli ilə eyni) — siyahı/oxuma API-si YOXDUR.
//
// Payload formatı public/sw.js → parsePush() ilə uyğundur (sw.js dəyişmir):
//   { notification:{ title, body, tag, icon, badge }, data:{ url, tag, ... } }
// Planlayıcılar FCM formatında mesaj qurur (checkin.buildCheckinMessage və s.);
// toWebPush() onu bu formata + TTL/Urgency başlıqlarına çevirir.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const express = require('express')
const { LANGS } = require('./prayer-utils')

const DEFAULT_ICONS = { icon: '/android-chrome-192x192.png?v=2', badge: '/badge-96x96.png?v=2' }

// Brauzerlərin push xidmətləri. Başqa host qəbul edilmir (SSRF / zibil yazı).
// Əlavə lazım olsa: env PUSH_EXTRA_HOSTS="a.example.com,.b.example.com" ('.' ilə başlayan — alt domenlər).
const PUSH_HOSTS = [
  'fcm.googleapis.com',                  // Chrome, Edge (Android), Opera, Samsung, Brave
  'updates.push.services.mozilla.com',   // Firefox
  'web.push.apple.com',                  // Safari / iOS 16.4+ PWA
  '.push.apple.com',
  '.notify.windows.com',                 // Edge (Windows, WNS)
]

const MAX_ENDPOINT = 1024
const MAX_PAYLOAD_BYTES = 3000          // şifrələnmiş limit ~4 KB; ehtiyatla
const DAILY_HOURS_MAX = 23

function hostAllowed(host, extra = []) {
  const h = String(host || '').toLowerCase()
  for (const rule of [...PUSH_HOSTS, ...extra]) {
    if (!rule) continue
    if (rule.startsWith('.') ? h.endsWith(rule) && h.length > rule.length : h === rule) return true
  }
  return false
}

const b64uBytes = (s) => (typeof s === 'string' && /^[A-Za-z0-9_-]+={0,2}$/.test(s) ? Buffer.from(s, 'base64url') : null)

/** Endpoint URL-i yoxla → normallaşdırılmış sətir | null */
function validEndpoint(raw, extraHosts = []) {
  if (typeof raw !== 'string' || raw.length > MAX_ENDPOINT) return null
  let u
  try { u = new URL(raw) } catch { return null }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return null
  if (!hostAllowed(u.hostname, extraHosts)) return null
  return raw
}

/** PushSubscription açarları: p256dh — 65 bayt sıxılmamış P-256 nöqtəsi, auth — 16 bayt. */
function validKeys(keys) {
  if (!keys || typeof keys !== 'object') return null
  const p = b64uBytes(keys.p256dh), a = b64uBytes(keys.auth)
  if (!p || p.length !== 65 || p[0] !== 0x04) return null
  if (!a || a.length !== 16) return null
  return { p256dh: keys.p256dh, auth: keys.auth }
}

const strMax = (v, n) => typeof v === 'string' && v.length <= n

/** firestore.rules → validLoc ilə eyni qaydalar. Yararsızdırsa undefined. */
function validLoc(l) {
  if (l == null) return null
  if (typeof l !== 'object' || Array.isArray(l)) return undefined
  const allowed = ['lat', 'lng', 'tz', 'method', 'city']
  if (Object.keys(l).some((k) => !allowed.includes(k))) return undefined
  const out = {}
  if ('lat' in l) { if (typeof l.lat !== 'number' || !(l.lat >= -90 && l.lat <= 90)) return undefined; out.lat = l.lat }
  if ('lng' in l) { if (typeof l.lng !== 'number' || !(l.lng >= -180 && l.lng <= 180)) return undefined; out.lng = l.lng }
  if ('tz' in l) { if (!strMax(l.tz, 64)) return undefined; out.tz = l.tz }
  if ('method' in l) { if (typeof l.method !== 'number' || !(l.method >= 0 && l.method <= 99)) return undefined; out.method = l.method }
  if ('city' in l) {
    const c = l.city
    if (!c || typeof c !== 'object' || Array.isArray(c)) return undefined
    out.city = {}
    for (const [k, v] of Object.entries(c)) {
      if (!LANGS.includes(k) || !strMax(v, 120)) return undefined
      out.city[k] = v
    }
  }
  return out
}

/** prefs: { azan:bool, checkin:bool, daily:{ ayah:bool, hour:0..23 } } — yararsızdırsa undefined. */
function validPrefs(p) {
  if (p == null) return {}
  if (typeof p !== 'object' || Array.isArray(p)) return undefined
  if (Object.keys(p).some((k) => !['azan', 'checkin', 'daily'].includes(k))) return undefined
  const out = {}
  if ('azan' in p) { if (typeof p.azan !== 'boolean') return undefined; out.azan = p.azan }
  if ('checkin' in p) { if (typeof p.checkin !== 'boolean') return undefined; out.checkin = p.checkin }
  if ('daily' in p) {
    const d = p.daily
    if (!d || typeof d !== 'object' || Array.isArray(d) || Object.keys(d).some((k) => !['ayah', 'hour'].includes(k))) return undefined
    out.daily = {}
    if ('ayah' in d) { if (typeof d.ayah !== 'boolean') return undefined; out.daily.ayah = d.ayah }
    if ('hour' in d) { if (!Number.isInteger(d.hour) || d.hour < 0 || d.hour > DAILY_HOURS_MAX) return undefined; out.daily.hour = d.hour }
  }
  return out
}

const validLang = (l) => (LANGS.includes(l) ? l : null)

/**
 * POST /subscribe gövdəsi → { ok:true, value } | { ok:false, error }.
 * Klient həm { subscription:{...} }, həm də düz PushSubscription.toJSON() göndərə bilər.
 */
function validateSubscribeBody(body, extraHosts = []) {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Bad request' }
  const sub = body.subscription && typeof body.subscription === 'object' ? body.subscription : body
  const endpoint = validEndpoint(sub.endpoint, extraHosts)
  if (!endpoint) return { ok: false, error: 'Invalid endpoint' }
  const keys = validKeys(sub.keys)
  if (!keys) return { ok: false, error: 'Invalid keys' }
  const lang = body.lang == null ? 'az' : validLang(body.lang)
  if (!lang) return { ok: false, error: 'Invalid lang' }
  const loc = validLoc(body.loc)
  if (loc === undefined) return { ok: false, error: 'Invalid loc' }
  const prefs = validPrefs(body.prefs)
  if (prefs === undefined) return { ok: false, error: 'Invalid prefs' }
  const ua = typeof body.userAgent === 'string' ? body.userAgent.slice(0, 512) : ''
  return { ok: true, value: { endpoint, keys, lang, loc, prefs, userAgent: ua } }
}

/** PATCH gövdəsi → { ok, value:{ endpoint, lang?, loc?, prefs? } } */
function validatePatchBody(body, extraHosts = []) {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Bad request' }
  const endpoint = validEndpoint(body.endpoint, extraHosts)
  if (!endpoint) return { ok: false, error: 'Invalid endpoint' }
  const value = { endpoint }
  if ('lang' in body) { if (!validLang(body.lang)) return { ok: false, error: 'Invalid lang' }; value.lang = body.lang }
  if ('loc' in body) { const l = validLoc(body.loc); if (l === undefined) return { ok: false, error: 'Invalid loc' }; value.loc = l }
  if ('prefs' in body) { const p = validPrefs(body.prefs); if (p === undefined) return { ok: false, error: 'Invalid prefs' }; value.prefs = p }
  return { ok: true, value }
}

// ─── Saxlama (push_subs) ──────────────────────────────────────────────
function createPushStore(db) {
  const raw = db.raw
  const st = {
    get: raw.prepare('SELECT * FROM push_subs WHERE endpoint = ?'),
    upsert: raw.prepare(`INSERT INTO push_subs (endpoint, keys_p256dh, keys_auth, lang, loc, prefs, user_agent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET keys_p256dh = excluded.keys_p256dh, keys_auth = excluded.keys_auth,
        lang = excluded.lang, loc = excluded.loc, prefs = excluded.prefs, user_agent = excluded.user_agent,
        updated_at = excluded.updated_at`),
    update: raw.prepare('UPDATE push_subs SET lang = ?, loc = ?, prefs = ?, updated_at = ? WHERE endpoint = ?'),
    del: raw.prepare('DELETE FROM push_subs WHERE endpoint = ?'),
    all: raw.prepare('SELECT endpoint, keys_p256dh, keys_auth, lang, loc, prefs FROM push_subs'),
    count: raw.prepare('SELECT COUNT(*) AS n FROM push_subs'),
  }
  const parse = (s, fb) => { try { return s == null ? fb : JSON.parse(s) } catch { return fb } }
  return {
    get(endpoint) {
      const r = st.get.get(endpoint)
      return r ? { ...r, loc: parse(r.loc, null), prefs: parse(r.prefs, {}) } : null
    },
    upsert(v, now = Date.now()) {
      st.upsert.run(v.endpoint, v.keys.p256dh, v.keys.auth, v.lang, v.loc ? JSON.stringify(v.loc) : null,
        JSON.stringify(v.prefs || {}), v.userAgent || '', now, now)
    },
    /** Yalnız verilən sahələr; prefs üst səviyyədə birləşir (daily tam əvəz olunur). */
    patch(v, now = Date.now()) {
      return db.tx(() => {
        const cur = st.get.get(v.endpoint)
        if (!cur) return false
        const lang = v.lang || cur.lang
        const loc = 'loc' in v ? (v.loc ? JSON.stringify(v.loc) : null) : cur.loc
        const prefs = 'prefs' in v ? JSON.stringify({ ...parse(cur.prefs, {}), ...v.prefs }) : cur.prefs
        st.update.run(lang, loc, prefs, now, v.endpoint)
        return true
      })
    },
    remove: (endpoint) => st.del.run(endpoint).changes > 0,
    count: () => st.count.get().n,
    /** Planlayıcı üçün: hamısı, JSON sahələri açılmış. */
    all: () => st.all.all().map((r) => ({
      endpoint: r.endpoint, keys: { p256dh: r.keys_p256dh, auth: r.keys_auth },
      lang: r.lang, loc: parse(r.loc, null), prefs: parse(r.prefs, {}),
    })),
  }
}

// ─── Mesaj çevrilməsi: FCM formatı → Web Push ─────────────────────────
const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)

/**
 * FCM sendEachForMulticast mesajı (tokens-suz) → { payload: string, options:{ TTL, urgency } }.
 *   msg = { notification:{title,body}, data?:{...}, webpush?:{ headers:{TTL,Urgency}, notification:{tag,icon,badge}, fcmOptions:{link} } }
 */
function toWebPush(msg) {
  const n = msg.notification || {}
  const wp = msg.webpush || {}
  const wn = wp.notification || {}
  const headers = wp.headers || {}
  const data = { ...(msg.data || {}) }
  const url = data.url || (wp.fcmOptions && wp.fcmOptions.link) || '/'
  const tag = wn.tag || data.tag || 'muslims-cc'
  data.url = url
  data.tag = tag
  const notification = {
    title: String(n.title || 'Muslims.cc'),
    body: String(n.body || ''),
    tag,
    icon: wn.icon || DEFAULT_ICONS.icon,
    badge: wn.badge || DEFAULT_ICONS.badge,
  }
  let payload = JSON.stringify({ notification, data })
  // Çox uzun mətn (admin bildirişi) — gövdəni qısalt ki, push xidməti rədd etməsin
  while (Buffer.byteLength(payload) > MAX_PAYLOAD_BYTES && notification.body.length > 20) {
    notification.body = truncate(notification.body, Math.floor(notification.body.length * 0.8))
    payload = JSON.stringify({ notification, data })
  }
  const ttl = Number(headers.TTL)
  const urgency = String(headers.Urgency || 'normal').toLowerCase()
  return {
    payload,
    options: {
      TTL: Number.isInteger(ttl) && ttl >= 0 ? ttl : 86400,
      urgency: ['very-low', 'low', 'normal', 'high'].includes(urgency) ? urgency : 'normal',
    },
  }
}

/**
 * Göndərici. sendFn — test üçün əvəz oluna bilər (susmaya görə web-push.sendNotification).
 * sendMany(subs, msg) → { successCount, failureCount, dead:[endpoint] }
 */
function createWebPushSender({ publicKey, privateKey, subject, sendFn, concurrency = 16, timeoutMs = 15000 } = {}) {
  const enabled = Boolean(publicKey && privateKey && subject)
  let send = sendFn
  if (!send && enabled) {
    const webpush = require('web-push')
    // Açarları və subject-i yoxlayır (format səhvdirsə başlanğıcda atır)
    webpush.setVapidDetails(subject, publicKey, privateKey)
    send = (sub, payload, options) => webpush.sendNotification(sub, payload, options)
  }
  return {
    enabled: enabled || Boolean(sendFn),
    publicKey: publicKey || '',
    async sendMany(subs, msg) {
      const out = { successCount: 0, failureCount: 0, dead: [] }
      if (!send || !subs.length) return out
      const { payload, options } = toWebPush(msg)
      let i = 0
      const worker = async () => {
        while (i < subs.length) {
          const s = subs[i++]
          try {
            await send({ endpoint: s.endpoint, keys: s.keys }, payload, { ...options, timeout: timeoutMs })
            out.successCount++
          } catch (e) {
            out.failureCount++
            const code = e && e.statusCode
            // 404/410 — abunəlik yoxdur (icazə geri alınıb, brauzer silinib)
            if (code === 404 || code === 410) out.dead.push(s.endpoint)
            else if (out.failureCount <= 3) console.warn('webpush xəta:', code || (e && e.message))
          }
        }
      }
      await Promise.all(Array.from({ length: Math.min(concurrency, subs.length) }, worker))
      return out
    },
  }
}

// ─── Router ───────────────────────────────────────────────────────────
function createPushRouter({ store, publicKey = '', extraHosts = [], onChange = () => {} }) {
  const router = express.Router()
  const json = express.json({ limit: '8kb' })

  router.get('/push/vapid-public-key', (req, res) => {
    if (!publicKey) return res.status(503).json({ error: 'Web Push not configured' })
    res.set('Cache-Control', 'public, max-age=3600')
    res.json({ key: publicKey })
  })

  router.post('/push/subscribe', json, (req, res) => {
    const v = validateSubscribeBody(req.body, extraHosts)
    if (!v.ok) return res.status(400).json({ error: v.error })
    store.upsert(v.value)
    onChange()
    res.status(201).json({ ok: true })
  })

  router.patch('/push/subscription', json, (req, res) => {
    const v = validatePatchBody(req.body, extraHosts)
    if (!v.ok) return res.status(400).json({ error: v.error })
    if (!store.patch(v.value)) return res.status(404).json({ error: 'Not found' })
    onChange()
    res.json({ ok: true })
  })

  router.post('/push/unsubscribe', json, (req, res) => {
    const endpoint = validEndpoint(req.body && req.body.endpoint, extraHosts)
    if (!endpoint) return res.status(400).json({ error: 'Invalid endpoint' })
    const removed = store.remove(endpoint)
    if (removed) onChange()
    res.json({ ok: true, removed })
  })

  // eslint-disable-next-line no-unused-vars
  router.use((err, req, res, next) => {
    const status = err && (err.status || err.statusCode)
    if (status === 413) return res.status(413).json({ error: 'Payload too large' })
    if (status === 400) return res.status(400).json({ error: 'Invalid JSON' })
    console.error('push error:', err && err.message)
    res.status(500).json({ error: 'Server error' })
  })

  return router
}

module.exports = {
  PUSH_HOSTS, DEFAULT_ICONS, MAX_PAYLOAD_BYTES,
  hostAllowed, validEndpoint, validKeys, validLoc, validPrefs,
  validateSubscribeBody, validatePatchBody,
  createPushStore, toWebPush, createWebPushSender, createPushRouter,
}
