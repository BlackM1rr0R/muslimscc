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
// Bildirişi brauzerdə Firebase SDK göstərir (firebase-messaging-sw.js) — ikon
// və nişan buradan gəlir; mobil bildiriş zolağında saytın loqosu görünsün.
const WEBPUSH_ICONS = { icon: '/android-chrome-192x192.png?v=2', badge: '/badge-96x96.png?v=2' }

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
        webpush: { notification: { ...WEBPUSH_ICONS, tag: 'muslim-cc' }, fcmOptions: { link: url || '/' } }
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
const dailyAyah = require('./daily-ayah')   // "Günün ayəsi" planlayıcısı (aşağıda)
const { normDaily } = dailyAyah
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
    groups.get(key).entries.push({
      id: doc.id, token: d.token, lang: LANGS.includes(d.lang) ? d.lang : 'az',
      daily: normDaily(d.daily),   // "Günün ayəsi" seçimi — aşağıdakı planlayıcı üçün
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
          notification: { ...WEBPUSH_ICONS, tag: `azan-${prayer}` },
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

// ═══ GÜNÜN AYƏSİ PUSH PLANLAYICISI ═══════════════════════════════════
// İstifadəçi bildiriş ayarlarında "Günün ayəsi"ni açıb saat seçəndə token
// sənədinə daily:{ ayah:true, hour:8 } yazılır (susmaya görə sönülü).
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
  const byLang = new Map()
  for (const e of list) {
    if (!byLang.has(e.lang)) byLang.set(e.lang, [])
    byLang.get(e.lang).push(e)
  }
  const dead = []
  for (const [lang, entries] of byLang) {
    const title = dailyAyah.ayahTitle(lang, pick, data.names)
    const body = dailyAyah.truncateWords(data.texts[lang] || data.texts.ar)
    const link = dailyAyah.ayahLink(lang, pick)
    for (let i = 0; i < entries.length; i += 500) {
      const chunk = entries.slice(i, i + 500)
      const result = await adminMsg.sendEachForMulticast({
        tokens: chunk.map(e => e.token),
        notification: { title, body },
        // firebase-messaging-sw.js öz bildirişini data.tag/data.url ilə göstərir
        data: { tag: 'daily-ayah', url: link },
        webpush: {
          headers: { TTL: '21600' },   // 6 saatdan gec çatsa da mənalıdır
          notification: { ...WEBPUSH_ICONS, tag: 'daily-ayah' },
          fcmOptions: { link },
        },
      })
      result.responses.forEach((r, j) => {
        const code = (r.error && r.error.code) || ''
        if (/registration-token-not-registered|invalid-registration-token|invalid-argument/.test(code)) dead.push(chunk[j].id)
      })
      console.log(`Push ayah ${pick.ref} [${lang} · ${group.loc.tz}]: ${result.successCount} çatdı, ${result.failureCount} alınmadı`)
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on port ${PORT}`)
})
