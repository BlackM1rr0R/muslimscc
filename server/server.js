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
const ADMIN_TOKEN = process.env.ADMIN_TOKEN
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL
const FIREBASE_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash'

// Vacib env dəyişənləri yoxdursa serveri başlatma (səssiz sınıqdan yaxşıdır)
for (const [k, v] of Object.entries({ OPENROUTER_KEY, ADMIN_TOKEN, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY })) {
  if (!v) { console.error(`FATAL: env dəyişəni yoxdur → ${k}`); process.exit(1) }
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
app.use(express.json())

app.use('/api/ask-ai', rateLimit({ windowMs: 60000, max: 10, message: { error: 'Cox sorgu. 1 deqiqe gozleyin.' } }))
app.use('/api/send-notification', rateLimit({ windowMs: 60000, max: 5, message: { error: 'Limit' } }))

// AI sistem promptları (hər dil öz dilində) — server/prompts.js
const { SYSTEM_PROMPTS } = require('./prompts')


app.post('/api/ask-ai', async (req, res) => {
  try {
    const { message, history = [], lang = 'az' } = req.body
    if (!message) return res.status(400).json({ error: 'message required' })
    const msgs = [{ role: 'system', content: SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS.az }]
    const prev = history.slice(0, -1).slice(-8)
    for (const m of prev) {
      if (m.role === 'user' || m.role === 'assistant') {
        msgs.push({ role: m.role, content: String(m.content || '').slice(0, 2000) })
      }
    }
    msgs.push({ role: 'user', content: message })
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENROUTER_KEY,
        'HTTP-Referer': 'https://muslims.cc'
      },
      body: JSON.stringify({ model: OPENROUTER_MODEL, messages: msgs, max_tokens: 1024 })
    })
    if (!r.ok) {
      const e = await r.text()
      console.error('AI error:', r.status, e)
      return res.status(502).json({ error: 'AI xetasi' })
    }
    const data = await r.json()
    const reply = data?.choices?.[0]?.message?.content
    if (!reply) return res.status(502).json({ error: 'Bos cavab' })
    res.json({ reply })
  } catch (e) {
    console.error('Error:', e)
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

const serviceAccount = {
  projectId: FIREBASE_PROJECT_ID,
  clientEmail: FIREBASE_CLIENT_EMAIL,
  privateKey: FIREBASE_PRIVATE_KEY,
}
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}
const adminDb = admin.firestore()
const adminMsg = admin.messaging()

app.post('/api/send-notification', async (req, res) => {
  try {
    const { title, body, url } = req.body
    const adminToken = req.headers['x-admin-token'] || req.body.adminToken
    if (adminToken !== ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!title || !body) return res.status(400).json({ error: 'title and body required' })
    const snap = await adminDb.collection('fcm_tokens').get()
    const tokens = snap.docs.map(d => d.data().token).filter(Boolean)
    if (tokens.length === 0) return res.json({ successCount: 0, failureCount: 0 })
    let successCount = 0, failureCount = 0
    for (let i = 0; i < tokens.length; i += 500) {
      const chunk = tokens.slice(i, i + 500)
      const result = await adminMsg.sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        webpush: { fcmOptions: { link: url || '/' } }
      })
      successCount += result.successCount
      failureCount += result.failureCount
    }
    res.json({ successCount, failureCount })
  } catch (e) {
    console.error('Push error:', e)
    res.status(500).json({ error: e.message })
  }
})

// ═══ NAMAZ VAXTI PUSH PLANLAYICISI ═══════════════════════════════════
// Hər abunəçiyə ÖZ şəhərinin azan vaxtında push göndərir (telefon kilidli,
// sayt bağlı olanda da). iPhone-da şərt: iOS 16.4+, sayt ana ekrana əlavə
// edilib və icazə PWA-nın içindən verilib.
//
// • Yer: fcm_tokens/<token>.loc = { lat, lng, tz, method, city:{az..} } —
//   sayt şəhər seçiləndə yazır (src/utils/prayerLocation.js). loc-u olmayan
//   köhnə abunələr standart yerə (Bakı) düşür.
// • Abunəçilər eyni yerə görə qruplaşdırılır; hər yer üçün gündə bir
//   aladhan sorğusu (o yerin öz saat qurşağında).
// • Bildirişdə növbəti namaz və şəhər adı da yazılır (kilid ekranında görünsün).
// • Ölü tokenlər (tətbiq silinib, icazə geri alınıb) Firestore-dan silinir.

const { DEFAULT_LOC, LANGS, PRAYERS, PUSH_TEXTS, normLoc, locKey, nowIn, addDay } = require('./prayer-utils')
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
let tokenGroups = new Map()      // locKey → { loc, entries:[{id, token, lang}] }
let tokensLoadedAt = 0
const dayTimes = new Map()       // `${locKey}|${dateKey}` → { times, tomorrowFajr } | { failedAt }
const sentKeys = new Set()       // `${locKey}|${dateKey}|${prayer}`

async function loadTokens() {
  const snap = await adminDb.collection('fcm_tokens').get()
  const groups = new Map()
  for (const doc of snap.docs) {
    const d = doc.data()
    if (!d.token) continue
    const loc = normLoc(d.loc)
    const key = locKey(loc)
    if (!groups.has(key)) groups.set(key, { loc, entries: [] })
    groups.get(key).entries.push({ id: doc.id, token: d.token, lang: LANGS.includes(d.lang) ? d.lang : 'az' })
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

async function sendPrayerPush(group, prayer, now, day) {
  const { loc, entries } = group
  const adhan = day.times[prayer]
  const isJumua = prayer === 'dhuhr' && now.friday
  const idx = PRAYERS.findIndex(([k]) => k === prayer)
  const last = idx === PRAYERS.length - 1
  const nextKey = last ? 'fajr' : PRAYERS[idx + 1][0]
  const nextTime = last ? day.tomorrowFajr : day.times[nextKey]

  const byLang = new Map()
  for (const e of entries) {
    if (!byLang.has(e.lang)) byLang.set(e.lang, [])
    byLang.get(e.lang).push(e)
  }

  const dead = []
  for (const [lang, list] of byLang) {
    const T = PUSH_TEXTS[lang]
    const title = isJumua ? T.jumuaTitle(adhan) : T.title(T.names[prayer], adhan)
    const parts = []
    if (nextTime) parts.push(`${T.next}: ${T.names[nextKey]}${last ? ` (${T.tomorrow})` : ''} ${nextTime}`)
    const cityName = loc.city[lang]
    if (cityName) parts.push(cityName)
    const body = parts.join(' · ')
    const link = lang === 'az' ? '/prayer' : `/${lang}/prayer`

    for (let i = 0; i < list.length; i += 500) {
      const chunk = list.slice(i, i + 500)
      const result = await adminMsg.sendEachForMulticast({
        tokens: chunk.map(e => e.token),
        notification: { title, body },
        webpush: {
          // 20 dəqiqədən gec çatan azan bildirişinin mənası yoxdur
          headers: { Urgency: 'high', TTL: '1200' },
          fcmOptions: { link },
        },
      })
      result.responses.forEach((r, j) => {
        const code = (r.error && r.error.code) || ''
        if (/registration-token-not-registered|invalid-registration-token|invalid-argument/.test(code)) dead.push(chunk[j].id)
      })
      console.log(`Push ${prayer} [${lang} · ${loc.tz}]: ${result.successCount} çatdı, ${result.failureCount} alınmadı`)
    }
  }

  for (const id of dead) {
    try { await adminDb.collection('fcm_tokens').doc(id).delete() } catch { /* boş ver */ }
  }
  if (dead.length) {
    console.log(`${dead.length} ölü token silindi`)
    tokensLoadedAt = 0   // siyahı növbəti dövrdə təzələnsin
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on port ${PORT}`)
})
