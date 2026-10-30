const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const admin = require('firebase-admin')

const app = express()
// nginx-in arxasındayıq — real IP-ni X-Forwarded-For-dan oxu (rate-limit üçün vacib)
app.set('trust proxy', 1)

// ─── Config (env-dən oxunur — heç bir açar kodda yoxdur) ─────────────
const PORT = process.env.PORT || 3001
const OPENROUTER_KEY = process.env.OPENROUTER_KEY
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL
const FIREBASE_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash'
const DB_PATH = process.env.DB_PATH || '/data/muslims.db'
const envOff = (v) => /^(0|false|no|off)$/i.test(String(v || '').trim())

// Vacib env dəyişənləri yoxdursa serveri başlatma (səssiz sınıqdan yaxşıdır)
if (!OPENROUTER_KEY) { console.error('FATAL: env dəyişəni yoxdur → OPENROUTER_KEY'); process.exit(1) }

// ─── Firebase — KEÇİD DÖVRÜ (docs/FIREBASE-EXIT.md) ──────────────────
// Firebase env-i yoxdursa server yenə işləyir: FCM göndərişi və köhnə admin
// tokeni (Firebase ID token) sönür, qalan hər şey (SQLite, Web Push) işləyir.
//   FCM_ENABLED=false            — FCM tokenlərinə göndərmə (və Firestore oxuması) dayanır
//   LEGACY_FIREBASE_AUTH=false   — admin API-si Firebase ID tokenini qəbul etmir
const FIREBASE_READY = Boolean(FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY)
const FCM_ON = FIREBASE_READY && !envOff(process.env.FCM_ENABLED)
const LEGACY_AUTH_ON = FIREBASE_READY && !envOff(process.env.LEGACY_FIREBASE_AUTH)
if (!FIREBASE_READY) console.warn('XƏBƏRDARLIQ: Firebase env-i yoxdur — FCM və köhnə admin tokeni sönülüdür')
else console.log(`Firebase: FCM ${FCM_ON ? 'açıq' : 'sönülü'}, köhnə admin tokeni ${LEGACY_AUTH_ON ? 'qəbul olunur' : 'qəbul olunmur'}`)

// ─── Verilənlər bazası (SQLite, node:sqlite) ─────────────────────────
const { openDb } = require('./db')
let db
try {
  db = openDb(DB_PATH)
} catch (e) {
  console.error(`FATAL: verilənlər bazası açılmadı (${DB_PATH}):`, e.message)
  if (e && /readonly|EACCES|EROFS|unable to open/i.test(String(e.message))) {
    console.error('İpucu: /data volume-u yazıla bilən olmalıdır (docs/FIREBASE-EXIT.md → "Volume icazəsi")')
  }
  process.exit(1)
}

// ─── CORS: yalnız icazəli origin-lər (localhost daxil) ───────────────
const ALLOWED = (process.env.ALLOWED_ORIGINS || 'https://muslims.cc,https://www.muslims.cc')
  .split(',').map(s => s.trim()).filter(Boolean)
app.use(cors({
  origin(origin, cb) {
    // origin yoxdur (server-to-server / curl) → icazə ver
    if (!origin) return cb(null, true)
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    if (ALLOWED.includes(origin) || isLocalhost) return cb(null, true)
    return cb(null, false)
  },
}))

const limit = (windowMs, max) => rateLimit({ windowMs, max, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Limit' } })
app.use('/api/ask-ai', rateLimit({ windowMs: 60000, max: 10, message: { error: 'Cox sorgu. 1 deqiqe gozleyin.' } }))
app.use('/api/send-notification', limit(60000, 5))
// Admin məzmun yazıları (məs. SeedManager 50 sənədi ardıcıl yazır) — daha geniş limit
app.use(/^\/api\/admin\/(content|singletons)(\/|$)/, limit(60000, 300))
app.use(/^\/api\/admin(?!\/(content|singletons)(\/|$))/, limit(60000, 30))
app.use('/api/content', limit(60000, 300))
app.use('/api/singletons', limit(60000, 300))
app.use('/api/push', limit(60000, 30))

// ─── Admin girişi (server/auth.js) ───────────────────────────────────
const authLib = require('./auth')
const authStore = authLib.createAuthStore(db)
let verifyFirebaseToken = null   // aşağıda Firebase işə düşəndə təyin olunur
const requireAdmin = authLib.createRequireAdmin({
  store: authStore,
  allowedOrigins: ALLOWED,
  verifyFirebaseToken: (t) => (verifyFirebaseToken ? verifyFirebaseToken(t) : Promise.reject(new Error('legacy auth off'))),
})
app.use('/api', authLib.createAuthRouter({ store: authStore, requireAdmin, allowedOrigins: ALLOWED }))
// Vaxtı keçmiş sessiyaları saatda bir təmizlə
setInterval(() => { try { authStore.purgeExpired() } catch { /* */ } }, 3600e3).unref()

// ─── Məzmun API-si (server/content.js) — öz JSON parser-i (1 MB) var ──
const content = require('./content')
app.use('/api', content.createContentRouter({
  db, requireAdmin,
  onChange: ({ collection, id, action, admin }) => console.log(`content ${action} ${collection}/${id} (${admin || '?'})`),
}))

// ─── Web Push (server/push.js) ───────────────────────────────────────
const push = require('./push')
const pushStore = push.createPushStore(db)
let webPush
try {
  webPush = push.createWebPushSender({
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT,
  })
} catch (e) {
  console.error('XƏBƏRDARLIQ: VAPID açarları yararsızdır — Web Push sönülüdür:', e.message)
  webPush = push.createWebPushSender({})
}
if (!webPush.enabled) console.warn('XƏBƏRDARLIQ: VAPID_* env yoxdur — Web Push göndərişi sönülüdür')
const PUSH_EXTRA_HOSTS = (process.env.PUSH_EXTRA_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean)
app.use('/api', push.createPushRouter({
  store: pushStore,
  publicKey: webPush.enabled ? process.env.VAPID_PUBLIC_KEY : '',
  extraHosts: PUSH_EXTRA_HOSTS,
  onChange: () => { tokensLoadedAt = 0 },   // planlayıcı siyahını növbəti dövrdə təzələsin
}))

app.use(express.json())

// AI sistem promptları (hər dil öz dilində) — server/prompts.js
const { SYSTEM_PROMPTS } = require('./prompts')


const ai = require('./ai-utils')
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || ai.OPENROUTER_URL
const OPENROUTER_REASONING = process.env.OPENROUTER_REASONING || ''
const AI_MAX_TOKENS = Number(process.env.OPENROUTER_MAX_TOKENS) || ai.LIMITS.maxTokens

// Modelin reasoning imkanları (mandatory / supported_efforts) — OpenRouter-in
// açıq /models siyahısından bir dəfə oxunur (açar lazım deyil), 6 saatlıq keş.
let modelMeta = null
let modelMetaAt = 0
async function refreshModelMeta() {
  if (Date.now() - modelMetaAt < 6 * 3600e3) return
  modelMetaAt = Date.now()
  try {
    const r = await fetch(ai.OPENROUTER_MODELS_URL, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) throw new Error('models ' + r.status)
    const j = await r.json()
    const m = (j.data || []).find(x => x.id === OPENROUTER_MODEL)
    modelMeta = m ? (m.reasoning || { mandatory: false }) : null
    console.log('AI model:', OPENROUTER_MODEL, 'reasoning →', JSON.stringify(ai.pickReasoning(OPENROUTER_MODEL, modelMeta, OPENROUTER_REASONING)))
  } catch {
    // şəbəkə yoxdur — ad üzrə təxmin istifadə olunur; 5 dəqiqədən sonra yenə cəhd
    modelMetaAt = Date.now() - 6 * 3600e3 + 5 * 60e3
  }
}
refreshModelMeta()

// OpenRouter-ə sorğu; reasoning parametrinə 400 cavabı gəlsə, bir dəfə onsuz təkrarla
async function callOpenRouter(messages, stream, signal) {
  const send = (reasoning) => fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + OPENROUTER_KEY,
      'HTTP-Referer': 'https://muslims.cc',
      'X-Title': 'Muslims.cc',
    },
    body: JSON.stringify(ai.buildOpenRouterBody({ model: OPENROUTER_MODEL, messages, stream, reasoning, maxTokens: AI_MAX_TOKENS })),
    signal,
  })
  const reasoning = ai.pickReasoning(OPENROUTER_MODEL, modelMeta, OPENROUTER_REASONING)
  let r = await send(reasoning)
  if (r.status === 400 && reasoning) {
    const t = await r.text().catch(() => '')
    console.error('AI 400 (reasoning ilə), onsuz təkrar:', t.slice(0, 300))
    r = await send(undefined)
  }
  return r
}

app.post('/api/ask-ai', async (req, res) => {
  const body = req.body || {}
  const lang = ai.normLang(body.lang)
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const stream = ai.wantsStream(body, req.headers.accept)
  if (!message) return res.status(400).json({ error: ai.errorText('bad_request', lang), code: 'bad_request' })
  refreshModelMeta()

  const messages = ai.buildMessages({ message, history: body.history, lang, prompts: SYSTEM_PROMPTS })
  // Klient bağlantını kəsəndə (Dayandır / səhifədən çıxdı) yuxarı axını da kəs
  const ac = new AbortController()
  let timedOut = false
  let timer = setTimeout(() => { timedOut = true; ac.abort() }, ai.TIMEOUTS.firstTokenMs)
  res.on('close', () => { if (!res.writableFinished) ac.abort() })
  const t0 = Date.now()

  if (!stream) {
    // ─── Köhnə JSON rejimi (mobil tətbiq) ───
    try {
      const r = await callOpenRouter(messages, false, ac.signal)
      if (!r.ok) {
        const e = await r.text().catch(() => '')
        console.error('AI error:', r.status, e.slice(0, 300))
        return res.status(502).json({ error: ai.errorText('upstream', lang), code: 'upstream' })
      }
      const data = await r.json()
      const reply = data?.choices?.[0]?.message?.content
      if (!reply || !String(reply).trim()) return res.status(502).json({ error: ai.errorText('empty', lang), code: 'empty' })
      res.json({ reply })
    } catch (e) {
      if (res.headersSent || res.destroyed) return
      const code = timedOut ? 'timeout' : 'upstream'
      if (!timedOut) console.error('AI error:', e?.message)
      res.status(code === 'timeout' ? 504 : 502).json({ error: ai.errorText(code, lang), code })
    } finally {
      clearTimeout(timer)
      console.log(`AI json ${Date.now() - t0}ms`)
    }
    return
  }

  // ─── Axın (SSE) rejimi ───
  let started = false
  let ttft = 0
  let total = ''
  const start = () => {
    if (started) return
    started = true
    res.status(200).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    res.flushHeaders()
    res.write(': ok\n\n')
  }
  const fail = (code, status) => {
    if (res.writableEnded || res.destroyed) return
    if (!started) return res.status(status).json({ error: ai.errorText(code, lang), code })
    res.write(ai.sseEvent({ error: ai.errorText(code, lang), code }))
    res.end()
  }

  try {
    const r = await callOpenRouter(messages, true, ac.signal)
    if (!r.ok || !r.body) {
      const e = await r.text().catch(() => '')
      console.error('AI error:', r.status, e.slice(0, 300))
      return fail('upstream', 502)
    }
    start()
    let upstreamError = ''
    const parser = ai.createSSEParser((ev) => {
      if (ev.error) upstreamError = ev.error
      if (ev.delta) {
        if (!ttft) {
          ttft = Date.now() - t0
          // İlk tokendən sonra: parçalar arası boşluq + ümumi hədd
          clearTimeout(timer)
        }
        total += ev.delta
        res.write(ai.sseEvent({ t: ev.delta }))
      }
    })
    const decoder = new TextDecoder()
    const deadline = t0 + ai.TIMEOUTS.totalMs
    for await (const chunk of r.body) {
      parser.push(decoder.decode(chunk, { stream: true }))
      if (ttft) {
        clearTimeout(timer)
        const left = Math.min(ai.TIMEOUTS.idleMs, deadline - Date.now())
        timer = setTimeout(() => { timedOut = true; ac.abort() }, Math.max(0, left))
      }
    }
    parser.end()
    // Axının ortasında xəta (finish_reason: "error") — yarımçıq cavabı tam kimi göstərmə
    if (upstreamError) { console.error('AI stream error:', upstreamError.slice(0, 300)); return fail('upstream', 502) }
    if (!total.trim()) return fail('empty', 502)
    res.write(ai.sseEvent({ done: true }))
    res.end()
  } catch (e) {
    if (res.destroyed) return // klient özü kəsdi
    if (timedOut) return fail('timeout', 504)
    console.error('AI stream error:', e?.message)
    fail('upstream', 502)
  } finally {
    clearTimeout(timer)
    console.log(`AI stream ttft=${ttft}ms total=${Date.now() - t0}ms chars=${total.length}`)
  }
})

app.get('/api/health', (req, res) => {
  // Healthcheck (Dockerfile) DB-ni də yoxlayır: baza açılmırsa konteyner "unhealthy"
  let dbOk = false
  try { dbOk = db.ping() } catch { dbOk = false }
  if (!dbOk) return res.status(503).json({ status: 'error', db: 'down' })
  res.json({ status: 'ok', db: 'ok', time: new Date().toISOString() })
})

// ─── Firebase Admin SDK — yalnız KEÇİD DÖVRÜ üçün ────────────────────
let adminDb = null    // Firestore (fcm_tokens oxuması) — FCM_ON olanda
let adminMsg = null   // FCM göndərişi — FCM_ON olanda
if (FIREBASE_READY) {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY,
      }) })
    }
    if (FCM_ON) { adminDb = admin.firestore(); adminMsg = admin.messaging() }
    // Köhnə admin paneli: Firebase ID tokeni + `admin: true` custom claim
    // (server/scripts/set-admin.js). checkRevoked=true — ləğv olunmuş token keçmir.
    if (LEGACY_AUTH_ON) {
      verifyFirebaseToken = async (idToken) => {
        const decoded = await admin.auth().verifyIdToken(idToken, true)
        return decoded.admin === true ? { uid: decoded.uid, email: decoded.email || '' } : null
      }
    }
  } catch (e) {
    console.error('XƏBƏRDARLIQ: Firebase işə düşmədi — FCM və köhnə admin tokeni sönülüdür:', e.message)
    adminDb = null; adminMsg = null; verifyFirebaseToken = null
  }
}
// Bildirişin ikonu və nişanı (public/sw.js parsePush oxuyur) — saytın loqosu
const WEBPUSH_ICONS = push.DEFAULT_ICONS
const FCM_DEAD = /registration-token-not-registered|invalid-registration-token|invalid-argument/

// ═══ ABUNƏÇİLƏR — İKİ MƏNBƏ ═══════════════════════════════════════════
// (a) push_subs (SQLite) — standart Web Push, VAPID ilə (yeni klient)
// (b) fcm_tokens (Firestore) — KEÇİD DÖVRÜ: köhnə klient hələ ora yazır.
//     FCM_ENABLED=false olanda (b) tam sönür — Firestore oxunmur.
// Eyni cihaz iki mənbədə OLMAMALIDIR: 2-ci mərhələdə klient Web Push-a
// keçəndə köhnə FCM tokenini özü silir (fcm_tokens/<token> → delete).

let fcmCache = []     // son uğurlu Firestore oxuması (Firestore əlçatmaz olanda istifadə olunur)

/** Bütün abunəçilər (xam): [{ kind:'wp'|'fcm', id, sub?, token?, lang, loc, azan, daily, checkin }] */
async function loadAllSubscribers() {
  const out = []
  for (const s of pushStore.all()) {
    out.push({
      kind: 'wp', id: s.endpoint, sub: { endpoint: s.endpoint, keys: s.keys },
      lang: s.lang, loc: s.loc, azan: s.prefs.azan, daily: s.prefs.daily, checkin: s.prefs.checkin,
    })
  }
  if (adminDb) {
    try {
      const snap = await adminDb.collection('fcm_tokens').get()
      fcmCache = []
      for (const doc of snap.docs) {
        const d = doc.data()
        if (!d.token) continue
        fcmCache.push({ kind: 'fcm', id: doc.id, token: d.token, lang: d.lang, loc: d.loc, azan: d.azan, daily: d.daily, checkin: d.checkin })
      }
    } catch (e) {
      console.error('Firestore fcm_tokens oxunmadı — əvvəlki siyahı istifadə olunur:', e.message)
    }
    out.push(...fcmCache)
  }
  return out
}

/** Ölü abunəlikləri sil (hər iki mənbədə). */
async function removeDead(deadTokens, deadEndpoints) {
  for (const id of deadTokens) {
    try { await adminDb.collection('fcm_tokens').doc(id).delete() } catch { /* boş ver */ }
  }
  for (const ep of deadEndpoints) {
    try { pushStore.remove(ep) } catch { /* boş ver */ }
  }
  if (deadTokens.length) fcmCache = fcmCache.filter((e) => !deadTokens.includes(e.id))
  const n = deadTokens.length + deadEndpoints.length
  if (n) {
    console.log(`${n} ölü abunəlik silindi (FCM ${deadTokens.length}, Web Push ${deadEndpoints.length})`)
    tokensLoadedAt = 0   // siyahı növbəti dövrdə təzələnsin
  }
}

/**
 * Bir mesajı (FCM formatında — notification/data/webpush) abunəçilərə göndər:
 * FCM tokenlərinə Admin SDK ilə, Web Push abunəliklərinə web-push ilə
 * (push.toWebPush eyni mesajı sw.js-in oxuduğu formata çevirir).
 */
async function deliver(entries, msg, label) {
  const fcm = adminMsg ? entries.filter((e) => e.kind === 'fcm') : []
  const wp = webPush.enabled ? entries.filter((e) => e.kind === 'wp') : []
  const deadTokens = [], deadEndpoints = []
  const r = { fcmOk: 0, fcmFail: 0, wpOk: 0, wpFail: 0 }
  for (let i = 0; i < fcm.length; i += 500) {
    const chunk = fcm.slice(i, i + 500)
    try {
      const result = await adminMsg.sendEachForMulticast({ tokens: chunk.map((e) => e.token), ...msg })
      r.fcmOk += result.successCount
      r.fcmFail += result.failureCount
      result.responses.forEach((x, j) => {
        if (FCM_DEAD.test((x.error && x.error.code) || '')) deadTokens.push(chunk[j].id)
      })
    } catch (e) {
      r.fcmFail += chunk.length
      console.error(`FCM xəta (${label}):`, e.message)
    }
  }
  if (wp.length) {
    try {
      const res = await webPush.sendMany(wp.map((e) => e.sub), msg)
      r.wpOk = res.successCount
      r.wpFail = res.failureCount
      deadEndpoints.push(...res.dead)
    } catch (e) {
      r.wpFail += wp.length
      console.error(`Web Push xəta (${label}):`, e.message)
    }
  }
  if (fcm.length || wp.length) {
    console.log(`Push ${label}: FCM ${r.fcmOk} çatdı/${r.fcmFail} alınmadı · Web Push ${r.wpOk} çatdı/${r.wpFail} alınmadı`)
  }
  await removeDead(deadTokens, deadEndpoints)
  return { successCount: r.fcmOk + r.wpOk, failureCount: r.fcmFail + r.wpFail, ...r }
}

// Abunəçi sayı (admin paneli)
app.get('/api/admin/subscribers', requireAdmin, async (req, res) => {
  let fcm = 0
  if (adminDb) {
    try {
      fcm = (await adminDb.collection('fcm_tokens').count().get()).data().count
    } catch (e) {
      console.error('Subscribers count error:', e.message)
    }
  }
  const webpush = pushStore.count()
  res.set('Cache-Control', 'no-store')
  res.json({ count: fcm + webpush, fcm, webpush })
})

// ─── Bildiriş tarixçəsi (notification_history) ───────────────────────
const historyInsert = db.raw.prepare(`INSERT INTO notification_history
  (id, title, body, url, priority, sent_to, failed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
const historyList = db.raw.prepare(`SELECT id, title, body, url, priority, sent_to, failed, created_at
  FROM notification_history ORDER BY created_at DESC LIMIT 200`)

// Firestore-dakı notification_history sənədləri ilə eyni forma
app.get('/api/admin/notification-history', requireAdmin, (req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json(historyList.all().map((h) => ({
    id: h.id, title: h.title, body: h.body, url: h.url, priority: h.priority,
    sentTo: h.sent_to, failed: h.failed, createdAt: h.created_at,
  })))
})

/** Admin bildirişinin "url"-i: yalnız saytın öz yolu (/...) və ya https://muslims.cc/... */
function safePushUrl(u) {
  if (u == null || u === '') return '/'
  if (typeof u !== 'string' || u.length > 500) return null
  if (/^\/(?![/\\])/.test(u)) return u
  try {
    const x = new URL(u)
    if (x.protocol === 'https:' && /^(www\.)?muslims\.cc$/.test(x.hostname)) return x.pathname + x.search + x.hash
  } catch { /* */ }
  return null
}

app.post('/api/send-notification', requireAdmin, async (req, res) => {
  try {
    const { title, body, url, priority } = req.body || {}
    if (typeof title !== 'string' || typeof body !== 'string' || !title.trim() || !body.trim()) {
      return res.status(400).json({ error: 'title and body required' })
    }
    if (title.length > 200 || body.length > 1000) return res.status(400).json({ error: 'title/body too long' })
    const link = safePushUrl(url)
    if (!link) return res.status(400).json({ error: 'invalid url' })
    const high = priority === 'high'
    const msg = {
      notification: { title: title.trim(), body: body.trim() },
      webpush: {
        ...(high ? { headers: { Urgency: 'high' } } : {}),
        notification: { ...WEBPUSH_ICONS, tag: 'muslim-cc' },
        fcmOptions: { link },
      },
    }
    const entries = await loadAllSubscribers()
    const result = await deliver(entries, msg, 'admin')
    // Tarixçə: köhnə admin paneli (Firebase tokeni) onu özü Firestore-a yazır —
    // ikiqat olmasın deyə yalnız yeni sessiya ilə gələn göndərişlər burada yazılır
    let historyId
    if (req.adminUser && req.adminUser.via === 'session') {
      historyId = newId()
      historyInsert.run(historyId, title.trim(), body.trim(), link, high ? 'high' : 'normal',
        result.successCount, result.failureCount, Date.now())
    }
    res.json({ ...result, ...(historyId ? { historyId } : {}) })
  } catch (e) {
    console.error('Push error:', e)
    res.status(500).json({ error: 'Push failed' })
  }
})

// ═══ NAMAZ VAXTI PUSH PLANLAYICISI ═══════════════════════════════════
// Hər abunəçiyə ÖZ şəhərinin azan vaxtında push göndərir (telefon kilidli,
// sayt bağlı olanda da). iPhone-da şərt: iOS 16.4+, sayt ana ekrana əlavə
// edilib və icazə PWA-nın içindən verilib.
//
// • Yer: abunəlikdəki loc = { lat, lng, tz, method, city:{az..} } — sayt şəhər
//   seçiləndə yazır (src/utils/prayerLocation.js). loc-u olmayan köhnə
//   abunələr standart yerə (Bakı) düşür.
// • Abunəçilər (Web Push + keçid dövründə FCM) eyni yerə görə qruplaşdırılır;
//   hər yer üçün gündə bir aladhan sorğusu (o yerin öz saat qurşağında).
// • Bildirişdə növbəti namaz və şəhər adı da yazılır (kilid ekranında görünsün).
// • Ölü abunəliklər (tətbiq silinib, icazə geri alınıb) silinir.

const { LANGS, PRAYERS, PUSH_TEXTS, normLoc, locKey, nowIn, addDay } = require('./prayer-utils')
const dailyAyah = require('./daily-ayah')   // "Günün ayəsi" planlayıcısı (aşağıda)
const { normDaily } = dailyAyah
const checkin = require('./checkin')       // "Qıldınızmı?" xatırlatması (aşağıda)
const { newId } = require('./db')
const TOKENS_TTL_MS = 10 * 60 * 1000   // abunəçi siyahısı 10 dəqiqədə bir təzələnir

/** aladhan-dan bir yerin bir günlük vaxtları → { fajr:'05:32', ... } | null */
async function fetchTimings(loc, ddmmyyyy) {
  const url = `https://api.aladhan.com/v1/timings/${ddmmyyyy}` +
    `?latitude=${loc.lat}&longitude=${loc.lng}&method=${loc.method}&timezonestring=${encodeURIComponent(loc.tz)}`
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!r.ok) return null
    const t = (await r.json())?.data?.timings
    if (!t) return null
    const out = {}
    for (const [key, api] of PRAYERS) out[key] = String(t[api] || '').slice(0, 5)
    return out
  } catch (e) {
    console.error('aladhan fetch failed:', e.message)
    return null
  }
}

// ── Keşlər ──
let tokenGroups = new Map()      // locKey → { loc, entries:[{kind, id, token|sub, lang, ...}] }
let tokensLoadedAt = 0
const dayTimes = new Map()       // `${locKey}|${dateKey}` → { times, tomorrowFajr } | { failedAt }
const sentKeys = new Set()       // `${locKey}|${dateKey}|${prayer}`

async function loadTokens() {
  const groups = new Map()
  for (const d of await loadAllSubscribers()) {
    const loc = normLoc(d.loc)
    const key = locKey(loc)
    if (!groups.has(key)) groups.set(key, { loc, entries: [] })
    groups.get(key).entries.push({
      kind: d.kind, id: d.id, token: d.token, sub: d.sub,
      lang: LANGS.includes(d.lang) ? d.lang : 'az',
      daily: normDaily(d.daily),   // "Günün ayəsi" seçimi — aşağıdakı planlayıcı üçün
      azan: d.azan !== false,      // ayarlarda "Namaz vaxtı" söndürülübsə azan göndərilmir
      checkin: checkin.normCheckin(d.checkin),   // "Qıldınızmı?" — susmaya görə sönülü
    })
  }
  tokenGroups = groups
  tokensLoadedAt = Date.now()
}

async function timesFor(key, loc, now) {
  const ck = `${key}|${now.dateKey}`
  const c = dayTimes.get(ck)
  if (c && c.times) return c
  if (c && c.failedAt && Date.now() - c.failedAt < 5 * 60 * 1000) return null  // 5 dəq gözlə
  const times = await fetchTimings(loc, now.ddmmyyyy)
  if (!times) { dayTimes.set(ck, { failedAt: Date.now() }); return null }
  const tomorrow = await fetchTimings(loc, addDay(now.ddmmyyyy))
  const entry = { times, tomorrowFajr: tomorrow ? tomorrow.fajr : '' }
  dayTimes.set(ck, entry)
  // Köhnə günlərin keşini təmizlə (yaddaş böyüməsin)
  for (const k of dayTimes.keys()) if (k.startsWith(key + '|') && k !== ck) dayTimes.delete(k)
  for (const k of sentKeys) if (k.startsWith(key + '|') && !k.startsWith(ck)) sentKeys.delete(k)
  return entry
}

const groupByLang = (list) => {
  const m = new Map()
  for (const e of list) {
    if (!m.has(e.lang)) m.set(e.lang, [])
    m.get(e.lang).push(e)
  }
  return m
}

async function sendPrayerPush(group, prayer, now, day) {
  const { loc, entries } = group
  const adhan = day.times[prayer]
  const isJumua = prayer === 'dhuhr' && now.friday
  const idx = PRAYERS.findIndex(([k]) => k === prayer)
  const last = idx === PRAYERS.length - 1
  const nextKey = last ? 'fajr' : PRAYERS[idx + 1][0]
  const nextTime = last ? day.tomorrowFajr : day.times[nextKey]

  for (const [lang, list] of groupByLang(entries.filter(e => e.azan))) {
    const T = PUSH_TEXTS[lang]
    const title = isJumua ? T.jumuaTitle(adhan) : T.title(T.names[prayer], adhan)
    const parts = []
    if (nextTime) parts.push(`${T.next}: ${T.names[nextKey]}${last ? ` (${T.tomorrow})` : ''} ${nextTime}`)
    const cityName = loc.city[lang]
    if (cityName) parts.push(cityName)
    const body = parts.join(' · ')
    const link = lang === 'az' ? '/prayer' : `/${lang}/prayer`
    await deliver(list, {
      notification: { title, body },
      webpush: {
        // 20 dəqiqədən gec çatan azan bildirişinin mənası yoxdur
        headers: { Urgency: 'high', TTL: '1200' },
        notification: { ...WEBPUSH_ICONS, tag: `azan-${prayer}` },
        fcmOptions: { link },
      },
    }, `${prayer} [${lang} · ${loc.tz}]`)
  }
}

// ── "Qıldınızmı?" xatırlatması ──
// Azandan 20 dəqiqə sonra (server/checkin.js), yalnız checkin:true olanlara.
// Əlavə oxuma yoxdur: abunəçilər və vaxtlar azan planlayıcısının keşindən
// (tokenGroups, dayTimes) götürülür. Qeyd serverə QAYITMIR — "Qıldım"
// düyməsi cihazda (IndexedDB → localStorage) yazılır.
async function sendCheckinPush(group, prayer, now) {
  const subs = group.entries.filter(e => e.checkin)
  if (!subs.length) return
  for (const [lang, list] of groupByLang(subs)) {
    const msg = checkin.buildCheckinMessage(lang, prayer, now.dateKey, WEBPUSH_ICONS)
    await deliver(list, msg, `checkin ${prayer} [${lang} · ${group.loc.tz}]`)
  }
}

let tickBusy = false
async function prayerTick() {
  if (tickBusy) return
  tickBusy = true
  try {
    if (Date.now() - tokensLoadedAt > TOKENS_TTL_MS) await loadTokens()
    for (const [key, group] of tokenGroups) {
      const now = nowIn(group.loc.tz)
      const day = await timesFor(key, group.loc, now)
      if (!day) continue
      for (const [prayer] of PRAYERS) {
        const sk = `${key}|${now.dateKey}|${prayer}`
        if (day.times[prayer] === now.hhmm && !sentKeys.has(sk)) {
          sentKeys.add(sk)
          await sendPrayerPush(group, prayer, now, day)
        }
      }
      // "Qıldınızmı?" — açarın prefiksi azanla eynidir (timesFor köhnə günləri təmizləyir)
      if (group.entries.some(e => e.checkin)) {
        for (const prayer of checkin.dueCheckins(day.times, now.hhmm)) {
          const ck = `${key}|${now.dateKey}|checkin-${prayer}`
          if (sentKeys.has(ck)) continue
          sentKeys.add(ck)
          await sendCheckinPush(group, prayer, now)
        }
      }
    }
  } catch (e) {
    console.error('prayerTick error:', e)
  } finally {
    tickBusy = false
  }
}

// Hər 20 saniyədən bir yoxla (dəqiqə dəyişən kimi tutsun); başlanğıcda da bir dəfə
setInterval(prayerTick, 20000)
prayerTick()

// ═══ GÜNÜN AYƏSİ PUSH PLANLAYICISI ═══════════════════════════════════
// İstifadəçi bildiriş ayarlarında "Günün ayəsi"ni açıb saat seçəndə abunəliyə
// daily:{ ayah:true, hour:8 } yazılır (susmaya görə sönülü).
// • Abunəçilər namaz planlayıcısının yer qruplarından (tokenGroups) götürülür;
//   hər qrupda yerli saat hour:00 olanda həmin saatı seçənlərə push gedir.
// • Ayə: yerli tarixə görə deterministik (server/daily-ayah.js → ayahForDate).
// • Mətn alquran.cloud-dan (hər ayə üçün bir sorğu bütün dilləri gətirir),
//   keşlənir; API çatmasa həmin gün o saat üçün göndərilmir (uydurma mətn yox).
// • tag 'daily-ayah' — eyni dəqiqədə gələn azan bildirişini əvəz etməsin.

const ayahCache = new Map()      // ref → { data, at } | { failedAt }
const ayahSentKeys = new Set()   // `${locKey}|${dateKey}|${hour}`

async function fetchAyahPart(s, a) {
  try {
    const r = await fetch(dailyAyah.ayahApiUrl(s, a), { signal: AbortSignal.timeout(15000) })
    if (!r.ok) return null
    return dailyAyah.parseAyahResponse(await r.json(), s, a)
  } catch (e) {
    console.error('alquran.cloud fetch failed:', e.message)
    return null
  }
}

/** Günün ayəsinin mətnləri (keşdən və ya API-dən) | null */
async function ayahDataFor(pick) {
  const c = ayahCache.get(pick.ref)
  if (c && c.data) return c.data
  if (c && c.failedAt && Date.now() - c.failedAt < 2 * 60 * 1000) return null  // 2 dəq gözlə
  const parts = []
  for (let a = pick.a; a <= pick.to; a++) parts.push(await fetchAyahPart(pick.s, a))
  const data = dailyAyah.mergeAyahParts(parts)
  ayahCache.set(pick.ref, data ? { data, at: Date.now() } : { failedAt: Date.now() })
  // 2 gündən köhnə keşi at (yaddaş böyüməsin; müxtəlif saat qurşaqları üçün 2 gün kifayətdir)
  for (const [k, v] of ayahCache) if (v.at && Date.now() - v.at > 2 * 86400000) ayahCache.delete(k)
  return data
}

async function sendAyahPush(group, list, pick, data) {
  for (const [lang, entries] of groupByLang(list)) {
    const title = dailyAyah.ayahTitle(lang, pick, data.names)
    const body = dailyAyah.truncateWords(data.texts[lang] || data.texts.ar)
    const link = dailyAyah.ayahLink(lang, pick)
    await deliver(entries, {
      notification: { title, body },
      // sw.js öz bildirişini data.tag/data.url ilə göstərir
      data: { tag: 'daily-ayah', url: link },
      webpush: {
        headers: { TTL: '21600' },   // 6 saatdan gec çatsa da mənalıdır
        notification: { ...WEBPUSH_ICONS, tag: 'daily-ayah' },
        fcmOptions: { link },
      },
    }, `ayah ${pick.ref} [${lang} · ${group.loc.tz}]`)
  }
}

let ayahBusy = false
async function dailyAyahTick() {
  if (ayahBusy) return
  ayahBusy = true
  try {
    for (const [key, group] of tokenGroups) {
      const subs = group.entries.filter(e => e.daily)
      if (!subs.length) continue
      const now = nowIn(group.loc.tz)
      const pick = dailyAyah.ayahForDate(now.dateKey)
      // Mətni əvvəlcədən çək (gün başlayan kimi) — göndərmə dəqiqəsində API ləngiməsin
      const data = await ayahDataFor(pick)
      const hours = [...new Set(subs.map(e => e.daily.hour))]
      for (const hour of hours) {
        if (!dailyAyah.isDueNow(now.hhmm, hour)) continue
        const sk = `${key}|${now.dateKey}|${hour}`
        if (ayahSentKeys.has(sk)) continue
        ayahSentKeys.add(sk)
        if (!data) { console.warn(`Ayah ${pick.ref} [${group.loc.tz} ${hour}:00]: mətn alınmadı — göndərilmədi`); continue }
        await sendAyahPush(group, subs.filter(e => e.daily.hour === hour), pick, data)
      }
      for (const k of ayahSentKeys) if (k.startsWith(key + '|') && !k.startsWith(`${key}|${now.dateKey}|`)) ayahSentKeys.delete(k)
    }
  } catch (e) {
    console.error('dailyAyahTick error:', e)
  } finally {
    ayahBusy = false
  }
}

// Abunəçi siyahısını prayerTick yükləyir; bu planlayıcı da hər 20 saniyədə yoxlayır
setInterval(dailyAyahTick, 20000)

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on port ${PORT} (DB: ${DB_PATH})`)
})

// docker stop → SIGTERM: yeni sorğu qəbul etmə, bazanı səliqəli bağla (WAL checkpoint)
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.once(sig, () => {
    server.close()
    try { db.raw.exec('PRAGMA wal_checkpoint(TRUNCATE)'); db.close() } catch { /* */ }
    process.exit(0)
  })
}
