// ═══════════════════════════════════════════════════════════════════════
// Instagram avtoposteri — gündə 3 dəfə (Asia/Baku) FEED postu + STORY: günün ayəsi / hədisi / duası və ya Allahın adı
//
// • Rəsmi Instagram Graph API (Content Publishing; docs/INSTAGRAM.md): POST /{ig-user-id}/media (image_url [+caption]
//   və ya media_type=STORIES) → GET /{container}?fields=status_code (FINISHED) → POST /{ig-user-id}/media_publish.
//   Susmaya görə "Instagram API with Instagram Login" (graph.instagram.com, Facebook Page lazım deyil);
//   IG_API_HOST=graph.facebook.com — "Facebook Login" / Unified variantı.
// • TAM SÖNÜLÜ (şəbəkə sorğusu, fayl, libvips yükü yoxdur), əgər api.env-də IG_ENABLED=1, IG_ACCESS_TOKEN, IG_USER_ID
//   yoxdursa və ya formatı yararsızdırsa: /api/ig/* → 404, planlayıcı heç nə etmir. Admin önizləməsi işləyir (dərc etmir).
// • Məzmun YALNIZ saytın öz məlumatıdır, dəyişdirilmir və qısaldılmır: ayə — daily-ayah.js (alquran.cloud, push ilə eyni),
//   hədis — daily-hadith-data.js (səhih siyahı), dua / ad — instagram-data.js (src/data/duas.js, names99.js).
//   "Səhih" yazısı yalnız Buxari / Müslim mənbəsində (utils/hadithGrade.js → gradeOf, 1-ci qayda); qalanında yalnız mənbə.
//   Kartda sığmayan element atlanır, sıradakı element götürülür.
// • Kartlar: <DB qovluğu>/ig-cards/<YYYY-MM-DD>-<yuva>-<feed|story>.jpg → GET /api/ig/card/<ad>.jpg (Instagram buradan
//   çəkir; yalnız sərt regex, qovluq keçidi yoxdur). 7 gündən köhnələr silinir.
// • Bir dəfə dərc: instagram_posts (day, slot, format) UNIQUE — INSERT OR IGNORE ilə "tutan" proses dərc edir
//   (kəsintisiz deploy-da yanaşı işləyən iki proses eyni postu iki dəfə atmır). Yarımçıq "claimed" sətir 10 dəq sonra
//   yenidən götürülür. Xəta → 2 / 5 / 15 / 30 dəq fasilə ilə təkrar (≤ 5 cəhd); avtorizasiya xətası (190 və s.) → planlayıcı
//   dayanır, BİR dəfə loglanır (token heç vaxt loglanmır, URL çap olunmur — token Authorization başlığındadır).
// • Token: Instagram Login tokeni 60 gündür — həftədə bir refresh_access_token; yenilənmiş token bazada AES-256-GCM ilə
//   (açar = env tokenindən törəmə: baza ehtiyat nüsxəsi tək başına tokeni açmır; env dəyişəndə köhnə qeyd avtomatik
//   etibarsızdır). İstifadəçi məlumatı YOXDUR (cədvəllər users-ə bağlı deyil, ixrac/xülasəyə düşmür).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const express = require('express')
const dailyAyah = require('./daily-ayah')
const dailyHadith = require('./daily-hadith')
const IG_DATA = require('./instagram-data')
const { nowAt } = require('./telegramBot')

const LANGS = ['az', 'en', 'ru', 'tr', 'ar']
const TZ = 'Asia/Baku'
const DEFAULT_SLOTS = ['08:00', '13:00', '20:00']
const SLOT_KINDS = ['ayah', 'hadith', 'extra']          // 3-cü yuva: tək gün — ad, cüt gün — dua
const HOSTS = ['graph.instagram.com', 'graph.facebook.com']
const DEFAULT_VERSION = 'v27.0'
const CATCHUP_MIN = 90                                    // server yuva vaxtı işləmirdisə, 90 dəq ərzində tutur
const STALE_CLAIM_MS = 10 * 60e3
const BACKOFF_MIN = [2, 5, 15, 30]
const MAX_ATTEMPTS = BACKOFF_MIN.length + 1
const CARD_TTL_MS = 7 * 864e5
const ROW_TTL_MS = 180 * 864e5
const REFRESH_EVERY_MS = 7 * 864e5
const REFRESH_MIN_AGE_MS = 2 * 864e5                     // Meta: token ən azı 24 saatlıq olmalıdır
const MAX_PICK_TRIES = 8
const CARD_NAME_RE = /^(\d{4}-\d{2}-\d{2})-([0-5])-(feed|story)\.jpg$/
const TOKEN_RE = /^[A-Za-z0-9._|-]{20,2048}$/
const USER_ID_RE = /^\d{5,30}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const SAHIH = { az: 'Səhih', en: 'Sahih', ru: 'Сахих', ar: 'صحيح', tr: 'Sahih' }
const TITLES = {
  ayah: dailyAyah.TITLE_PREFIX,
  hadith: dailyHadith.TITLE,
  dua: { az: 'Günün duası', en: 'Dua of the day', ru: 'Дуа дня', tr: 'Günün duası', ar: 'دعاء اليوم' },
  name: { az: 'Allahın gözəl adları', en: 'The Beautiful Names of Allah', ru: 'Прекрасные имена Аллаха', tr: "Allah'ın güzel isimleri", ar: 'أسماء الله الحسنى' },
}
const PROOF = { az: 'Dəlil', en: 'Proof', ru: 'Доказательство', tr: 'Delil', ar: 'الدليل' }
const READ_MORE = { az: 'Saytda oxuyun', en: 'Read on the site', ru: 'Читать на сайте', tr: 'Sitede okuyun', ar: 'اقرأ في الموقع' }
const HASHTAGS = {
  az: { ayah: ['#quran', '#ayə', '#islam'], hadith: ['#hədis', '#sünnə', '#islam'], dua: ['#dua', '#zikr', '#islam'], name: ['#əsmaülhüsna', '#allahınadları', '#islam'] },
  en: { ayah: ['#quran', '#verseoftheday', '#islam'], hadith: ['#hadith', '#sunnah', '#islam'], dua: ['#dua', '#dhikr', '#islam'], name: ['#asmaulhusna', '#namesofallah', '#islam'] },
  ru: { ayah: ['#коран', '#аят', '#ислам'], hadith: ['#хадис', '#сунна', '#ислам'], dua: ['#дуа', '#зикр', '#ислам'], name: ['#асмаульхусна', '#именааллаха', '#ислам'] },
  tr: { ayah: ['#kuran', '#ayet', '#islam'], hadith: ['#hadis', '#sünnet', '#islam'], dua: ['#dua', '#zikir', '#islam'], name: ['#esmaülhüsna', '#allahınisimleri', '#islam'] },
  ar: { ayah: ['#قرآن', '#آية', '#إسلام'], hadith: ['#حديث', '#سنة', '#إسلام'], dua: ['#دعاء', '#ذكر', '#إسلام'], name: ['#أسماء_الله_الحسنى', '#إسلام'] },
}
const CAPTION_MAX = 2200

// ── Konfiqurasiya (env) ──
function parseSlots(raw) {
  const out = []
  for (const s of String(raw || '').split(',').map((x) => x.trim()).filter(Boolean)) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(s)
    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return DEFAULT_SLOTS.slice()
    const v = `${m[1].padStart(2, '0')}:${m[2]}`
    if (!out.includes(v)) out.push(v)
  }
  if (!out.length || out.length > 6) return DEFAULT_SLOTS.slice()
  return out.sort()
}

function parseConfig(env = {}) {
  const token = String(env.IG_ACCESS_TOKEN || '').trim()
  const userId = String(env.IG_USER_ID || '').trim()
  const host = HOSTS.includes(String(env.IG_API_HOST || '').trim()) ? String(env.IG_API_HOST).trim() : HOSTS[0]
  const version = /^v\d{1,3}\.\d{1,2}$/.test(String(env.IG_API_VERSION || '')) ? env.IG_API_VERSION : DEFAULT_VERSION
  const lang = LANGS.includes(env.IG_LANG) ? env.IG_LANG : 'az'
  const slots = parseSlots(env.IG_SLOTS || DEFAULT_SLOTS.join(','))
  const stories = String(env.IG_STORIES == null ? '1' : env.IG_STORIES) !== '0'
  const configured = Boolean(token || userId)
  let reason = null
  if (env.IG_ENABLED !== '1') reason = 'disabled'
  else if (!token || !userId) reason = 'missing_credentials'
  else if (!TOKEN_RE.test(token) || !USER_ID_RE.test(userId)) reason = 'bad_format'
  return { enabled: !reason, reason, configured, token, userId, host, version, lang, slots, stories }
}

// ── Vaxt ──
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }
function addDays(dateKey, n) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}
/** Yuva → məzmun növü (3-cü yuva: tək gün ad, cüt gün dua). */
function kindFor(slotIndex, dateKey) {
  const k = SLOT_KINDS[slotIndex % SLOT_KINDS.length]
  if (k !== 'extra') return k
  return dailyAyah.dayNumber(dateKey) % 2 ? 'name' : 'dua'
}
const themeFor = (hhmm) => { const h = Number(String(hhmm).slice(0, 2)); return h >= 18 || h < 5 ? 'night' : 'day' }
function nextSlot(slots, now) {
  const t = nowAt(TZ, now)
  const cur = toMin(t.hhmm)
  const i = slots.findIndex((s) => toMin(s) > cur)
  if (i >= 0) return { date: t.dateKey, time: slots[i], index: i, kind: kindFor(i, t.dateKey) }
  const d = addDays(t.dateKey, 1)
  return { date: d, time: slots[0], index: 0, kind: kindFor(0, d) }
}

// ── Seçim: gün üzrə deterministik, sığmayanda sıradakı ──
const gcd = (a, b) => (b ? gcd(b, a % b) : a)
function rotIndex(dateKey, n, step, k) {
  const s = gcd(step, n) === 1 ? step : 1
  return ((((dailyAyah.dayNumber(dateKey) * s) % n) + n + k) % n)
}
/** Hədis: "Səhih" yalnız Buxari / Müslim (telegramBot.js ilə eyni ifadə — gradeOf-un 1-ci qaydası). */
const isBukhariMuslim = (srcAz) => /^(Buxari|Muslim|Müslim)\b/.test(String(srcAz || '')) && !/Ədəb əl-Müfrəd/.test(String(srcAz || ''))
const linkFor = (origin, lang, p) => `${origin}${lang === 'az' ? '' : `/${lang}`}${p}`

function hadithContent(lang, h, origin) {
  const ar = h.t && h.t.ar
  if (!ar) return null
  const text = lang === 'ar' ? '' : (h.t[lang] || '')
  if (lang !== 'ar' && !text) return null
  const src = h.src[lang] || h.src.en
  const sahih = isBukhariMuslim(h.src.az)
  return { kind: 'hadith', key: `hadith:${h.id}`, title: TITLES.hadith[lang], ar, text, ref: sahih ? `${src} · ${SAHIH[lang]}` : src, link: linkFor(origin, lang, `/hadith/${h.id}`) }
}
function duaContent(lang, d, origin) {
  const text = lang === 'ar' ? '' : (d.t[lang] || '')
  if (lang !== 'ar' && !text) return null
  const src = d.src[lang] || d.src.en
  return { kind: 'dua', key: `dua:${d.id}`, title: TITLES.dua[lang], ar: d.ar, text, ref: d.sahih ? `${src} · ${SAHIH[lang]}` : src, link: linkFor(origin, lang, '/duas') }
}
function nameContent(lang, n, origin) {
  const text = lang === 'ar' ? '' : (n.m[lang] || '')
  if (lang !== 'ar' && !text) return null
  return { kind: 'name', key: `name:${n.n}`, title: TITLES.name[lang], ar: n.ar, tl: lang === 'ar' ? '' : n.tl, text, ref: `${PROOF[lang]}: ${n.proof[lang] || n.proof.en}`, link: linkFor(origin, lang, `/names/${n.n}-${n.slug}`) }
}
function ayahContent(lang, pick, data, origin) {
  const ar = data.texts.ar
  const text = lang === 'ar' ? '' : data.texts[lang]
  if (!ar || (lang !== 'ar' && !text)) return null
  const num = `${pick.s}:${pick.a}${pick.to && pick.to !== pick.a ? `-${pick.to}` : ''}`
  return { kind: 'ayah', key: `ayah:${pick.ref}`, title: TITLES.ayah[lang], ar, text, ref: `${dailyAyah.surahLabel(lang, pick.s, data.names)} ${num}`, link: linkFor(origin, lang, dailyAyah.ayahLink('az', pick)) }
}

// ── Caption (mətn + mənbə + keçid + bir neçə heşteq; reytinq / riya dili yoxdur) ──
function buildCaption(c, lang, { withArabic = true } = {}) {
  const L = LANGS.includes(lang) ? lang : 'az'
  const tags = ['#muslimscc', ...((HASHTAGS[L] || HASHTAGS.az)[c.kind] || [])]
  const parts = [c.title]
  if (c.kind === 'name') parts.push([c.ar, c.tl, c.text].filter(Boolean).join('\n'))
  else {
    if (withArabic || !c.text) parts.push(c.ar)
    if (c.text) parts.push(c.text)
  }
  parts.push(`— ${c.ref}`)
  parts.push(`${READ_MORE[L]}: ${c.link}`)
  parts.push(tags.join(' '))
  const out = parts.filter(Boolean).join('\n\n')
  if (out.length <= CAPTION_MAX) return out
  return withArabic && c.text && c.kind !== 'name' ? buildCaption(c, lang, { withArabic: false }) : null
}

// ── Graph API xətalarının növü ──
function classifyError(err, status) {
  const code = Number(err && err.code), sub = Number(err && err.error_subcode)
  if (code === 190 || code === 102 || code === 10 || (code >= 200 && code <= 299) || status === 401) return 'auth'
  if (code === 9 && sub === 2207042) return 'limit'                                   // 24 saatlıq dərc limiti
  if ([4, 17, 32, 613, 80002].includes(code) || status === 429) return 'rate'
  if (code === 2 || code === 1 || status >= 500 || !status) return 'transient'
  if (sub >= 2207000 && sub < 2208000) return 'media'                               // şəkli çəkə bilmədi və s.
  return 'fatal'
}
/** Graph-dan kənar xəta (məs. ayə mənbəyi əlçatmazdır) — eyni "kind" sahəsi ilə. */
const failure = (kind, msg) => Object.assign(new Error(msg), { kind })
class GraphError extends Error {
  constructor(kind, status, code, sub) {
    super(`instagram graph ${kind} (status ${status || '-'}, code ${code || '-'}${sub ? `/${sub}` : ''})`)
    this.kind = kind; this.status = status; this.code = code; this.sub = sub
  }
}

// ── Token qeydi (AES-256-GCM, açar env tokenindən) ──
function tokenKey(envToken) { return crypto.createHash('sha256').update('mcc-ig-token-v1|' + envToken).digest() }
function sealToken(envToken, obj) {
  const iv = crypto.randomBytes(12)
  const c = crypto.createCipheriv('aes-256-gcm', tokenKey(envToken), iv)
  const ct = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64url')
}
function openToken(envToken, sealed) {
  try {
    const b = Buffer.from(String(sealed || ''), 'base64url')
    if (b.length < 29) return null
    const d = crypto.createDecipheriv('aes-256-gcm', tokenKey(envToken), b.subarray(0, 12))
    d.setAuthTag(b.subarray(12, 28))
    const o = JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'))
    return o && typeof o.t === 'string' && TOKEN_RE.test(o.t) ? o : null
  } catch { return null }
}

/**
 * opts: { db, env?, publicOrigin?, cardDir?, fetchImpl?, now?, sleep?, log?, render?, pollMs?, pollTries? }
 *   render(content, { format, theme, lang }) → Promise<Buffer|null>  (susmaya görə instagramCard.renderCard)
 */
function createInstagram(opts = {}) {
  const {
    db, env = process.env, publicOrigin = 'https://muslims.cc', fetchImpl = (...a) => fetch(...a), now = () => Date.now(),
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)), log = console, pollMs = 4000, pollTries = 20,
  } = opts
  const cfg = parseConfig(env)
  const origin = String(publicOrigin || 'https://muslims.cc').replace(/\/+$/, '')
  const cardDir = opts.cardDir || path.join(path.dirname(path.resolve(env.DB_PATH || '/data/muslims.db')), 'ig-cards')
  const render = opts.render || ((c, o) => require('./instagramCard').renderCard(c, o))
  if (cfg.configured && !cfg.enabled) log.warn(`Instagram: avtoposter sönülüdür (${cfg.reason})`)

  const raw = db.raw || db
  raw.exec(`CREATE TABLE IF NOT EXISTS instagram_posts (
    id INTEGER PRIMARY KEY,
    day TEXT NOT NULL,
    slot TEXT NOT NULL,
    format TEXT NOT NULL,
    kind TEXT NOT NULL,
    item TEXT,
    ig_media_id TEXT,
    status TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    error TEXT,
    next_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE (day, slot, format)
  )`)
  raw.exec('CREATE TABLE IF NOT EXISTS instagram_state (k TEXT PRIMARY KEY, v TEXT NOT NULL, at INTEGER NOT NULL) WITHOUT ROWID')
  const q = {
    claim: raw.prepare(`INSERT OR IGNORE INTO instagram_posts (day, slot, format, kind, status, attempts, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'claimed', 1, ?, ?)`),
    get: raw.prepare('SELECT * FROM instagram_posts WHERE day = ? AND slot = ? AND format = ?'),
    retake: raw.prepare(`UPDATE instagram_posts SET status = 'claimed', attempts = attempts + 1, updated_at = ?
      WHERE id = ? AND ((status = 'retry' AND next_at <= ?) OR (status = 'claimed' AND updated_at < ?)) AND attempts < ?`),
    done: raw.prepare(`UPDATE instagram_posts SET status = 'published', ig_media_id = ?, item = ?, error = NULL, next_at = NULL, updated_at = ? WHERE id = ?`),
    fail: raw.prepare('UPDATE instagram_posts SET status = ?, error = ?, item = COALESCE(?, item), next_at = ?, updated_at = ? WHERE id = ?'),
    recent: raw.prepare('SELECT day, slot, format, kind, item, ig_media_id, status, attempts, error, created_at, updated_at FROM instagram_posts ORDER BY id DESC LIMIT ?'),
    purge: raw.prepare('DELETE FROM instagram_posts WHERE created_at < ?'),
    stGet: raw.prepare('SELECT v, at FROM instagram_state WHERE k = ?'),
    stSet: raw.prepare('INSERT INTO instagram_state (k, v, at) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, at = excluded.at'),
    stClaim: raw.prepare('INSERT OR IGNORE INTO instagram_state (k, v, at) VALUES (?, ?, ?)'),
  }

  let authBlocked = false
  let authLogged = false
  const blockAuth = (where) => {
    authBlocked = true
    if (!authLogged) { authLogged = true; log.error(`Instagram: avtorizasiya xətası (${where}) — avtoposter dayandı. Yeni token → api.env, sonra restart (docs/INSTAGRAM.md)`) }
  }

  // ── Token ──
  function tokenRecord() {
    if (!cfg.token) return null
    const r = q.stGet.get('token')
    return r ? openToken(cfg.token, r.v) : null
  }
  const currentToken = () => { const r = tokenRecord(); return r ? r.t : cfg.token }

  // ── Graph API (token yalnız Authorization başlığında; URL və token loglanmır) ──
  async function graph(method, pathname, params = {}, { token = currentToken(), host = cfg.host, versioned = true } = {}) {
    const url = new URL(`https://${host}${versioned ? `/${cfg.version}` : ''}${pathname}`)
    const headers = { Authorization: `Bearer ${token}` }
    let body
    if (method === 'GET') for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
    else { body = new URLSearchParams(params).toString(); headers['Content-Type'] = 'application/x-www-form-urlencoded' }
    let r, j
    try {
      r = await fetchImpl(url.toString(), { method, headers, body, signal: AbortSignal.timeout(30000) })
      j = await r.json().catch(() => null)
    } catch (e) {
      throw new GraphError('transient', 0, 0, 0)
    }
    if (r.ok && j && !j.error) return j
    const e = (j && j.error) || {}
    throw new GraphError(classifyError(e, r.status), r.status, Number(e.code) || 0, Number(e.error_subcode) || 0)
  }

  async function publishImage(imageUrl, { story = false, caption = '' } = {}) {
    const params = story ? { image_url: imageUrl, media_type: 'STORIES' } : { image_url: imageUrl, caption }
    const c = await graph('POST', `/${cfg.userId}/media`, params)
    const cid = String((c && c.id) || '')
    if (!/^\d{1,40}$/.test(cid)) throw new GraphError('fatal', 200, 0, 0)
    let ready = false
    for (let i = 0; i < pollTries; i++) {
      const s = await graph('GET', `/${cid}`, { fields: 'status_code' })
      const st = s && s.status_code
      if (st === 'FINISHED') { ready = true; break }
      if (st === 'ERROR' || st === 'EXPIRED') throw new GraphError('media', 200, 0, 0)
      if (st === 'PUBLISHED') throw new GraphError('fatal', 200, 0, 0)
      await sleep(pollMs)
    }
    if (!ready) throw new GraphError('transient', 200, 0, 0)
    const p = await graph('POST', `/${cfg.userId}/media_publish`, { creation_id: cid })
    const mid = String((p && p.id) || '')
    if (!/^\d{1,40}$/.test(mid)) throw new GraphError('fatal', 200, 0, 0)
    return mid
  }

  // ── Məzmun ──
  const ayahCache = new Map()   // ref → { data, at } | { failedAt }
  async function ayahData(pick) {
    const c = ayahCache.get(pick.ref)
    if (c && c.data) return c.data
    if (c && c.failedAt && now() - c.failedAt < 2 * 60e3) return null
    const parts = []
    for (let a = pick.a; a <= pick.to; a++) {
      try {
        const r = await fetchImpl(dailyAyah.ayahApiUrl(pick.s, a), { signal: AbortSignal.timeout(15000) })
        parts.push(r.ok ? dailyAyah.parseAyahResponse(await r.json(), pick.s, a) : null)
      } catch { parts.push(null) }
    }
    const data = dailyAyah.mergeAyahParts(parts)
    ayahCache.set(pick.ref, data ? { data, at: now() } : { failedAt: now() })
    if (ayahCache.size > 50) for (const [k, v] of ayahCache) if (now() - (v.at || v.failedAt) > 2 * 864e5) ayahCache.delete(k)
    return data
  }

  /** k-cı namizəd (0 — günün öz elementi). null — bu namizəd yararsızdır; throw — şəbəkə (ayə). */
  async function candidate(kind, dateKey, k, lang) {
    if (kind === 'ayah') {
      const refs = dailyAyah.AYAH_REFS
      const ref = refs[rotIndex(dateKey, refs.length, 37, k)]
      const pick = { ...dailyAyah.parseRef(ref), ref }
      const data = await ayahData(pick)
      if (!data) throw failure('transient', 'ayah source unavailable')
      return ayahContent(lang, pick, data, origin)
    }
    if (kind === 'hadith') {
      const list = dailyHadith.LIST
      return list.length ? hadithContent(lang, list[rotIndex(dateKey, list.length, 389, k)], origin) : null
    }
    // dua / ad: hər 2 gündən biri — gün nömrəsinin yarısı ilə sırala
    const half = addDays('1970-01-01', Math.floor(dailyAyah.dayNumber(dateKey) / 2))
    if (kind === 'dua') return IG_DATA.duas.length ? duaContent(lang, IG_DATA.duas[rotIndex(half, IG_DATA.duas.length, 31, k)], origin) : null
    if (kind === 'name') return IG_DATA.names.length ? nameContent(lang, IG_DATA.names[(Math.floor(dailyAyah.dayNumber(dateKey) / 2) + k) % IG_DATA.names.length], origin) : null
    return null
  }

  /** Yuvanın məzmunu + kartları (feed və story EYNİ elementdir). → { content, caption, cards: { feed, story } } | null */
  async function prepare(dateKey, slotIndex, { formats = ['feed', 'story'], lang = cfg.lang, slots = cfg.slots } = {}) {
    const kind = kindFor(slotIndex, dateKey)
    const theme = themeFor(slots[slotIndex] || '08:00')
    for (let k = 0; k < MAX_PICK_TRIES; k++) {
      const content = await candidate(kind, dateKey, k, lang)
      if (!content) continue
      const caption = buildCaption(content, lang)
      if (!caption) continue
      const cards = {}
      let ok = true
      for (const f of formats) {
        cards[f] = await render(content, { format: f, theme, lang })
        if (!cards[f]) { ok = false; break }
      }
      if (ok) return { content, caption, cards }
    }
    return null
  }

  // ── Kart faylları ──
  const cardName = (dateKey, slotIndex, format) => `${dateKey}-${slotIndex}-${format}.jpg`
  function writeCard(name, buf) {
    if (!CARD_NAME_RE.test(name)) throw new Error('bad card name')
    fs.mkdirSync(cardDir, { recursive: true, mode: 0o700 })
    const tmp = path.join(cardDir, `.${name}.${process.pid}.tmp`)
    fs.writeFileSync(tmp, buf, { mode: 0o644 })
    fs.renameSync(tmp, path.join(cardDir, name))
  }
  function purgeCards(t = now()) {
    let n = 0
    let list = []
    try { list = fs.readdirSync(cardDir) } catch { return 0 }
    for (const f of list) {
      const m = CARD_NAME_RE.exec(f)
      const p = path.join(cardDir, f)
      try {
        const old = m ? Date.parse(`${m[1]}T00:00:00Z`) < t - CARD_TTL_MS : (f.endsWith('.tmp') && fs.statSync(p).mtimeMs < t - 3600e3)
        if (old) { fs.unlinkSync(p); n++ }
      } catch { /* */ }
    }
    return n
  }

  // ── Bir yuvanın dərci (feed + story) ──
  const prepared = new Map()   // `${day}|${slotKey}` → prepare() nəticəsi (bu proses daxilində)
  async function runFormat(row, dateKey, slotIndex, slotKey, format) {
    const pk = `${dateKey}|${slotKey}`
    try {
      let prep = prepared.get(pk)
      if (!prep) {
        prep = await prepare(dateKey, slotIndex, { formats: cfg.stories ? ['feed', 'story'] : ['feed'] })
        if (!prep) throw failure('fatal', 'no fitting item')
        prepared.set(pk, prep)
        for (const k of prepared.keys()) if (!k.startsWith(dateKey + '|')) prepared.delete(k)
      }
      const name = cardName(dateKey, slotIndex, format)
      writeCard(name, prep.cards[format])
      const url = `${origin}/api/ig/card/${name}`
      const mid = await publishImage(url, { story: format === 'story', caption: prep.caption })
      q.done.run(mid, prep.content.key, now(), row.id)
      log.log(`Instagram: ${format} dərc olundu — ${dateKey} ${slotKey} ${prep.content.key}`)
      return true
    } catch (e) {
      const kind = (e && e.kind) || 'transient'
      if (!(e && e.kind)) log.error('Instagram:', e && e.message)
      const attempts = Number(row.attempts) || 1
      if (kind === 'auth') blockAuth(format)
      const retry = (kind === 'transient' || kind === 'rate' || kind === 'media') && attempts < MAX_ATTEMPTS
      const nextAt = retry ? now() + BACKOFF_MIN[Math.min(attempts - 1, BACKOFF_MIN.length - 1)] * 60e3 : null
      q.fail.run(retry ? 'retry' : 'failed', String(e && e.message || kind).slice(0, 200), null, nextAt, now(), row.id)
      if (kind !== 'auth') log.warn(`Instagram: ${format} ${dateKey} ${slotKey} — ${kind}${retry ? `, təkrar ${Math.round((nextAt - now()) / 60e3)} dəq sonra` : ', dayandı'}`)
      return false
    }
  }

  /** Sətri bu proses üçün "tut": yeni — INSERT; retry vaxtı çatıb və ya yarımçıq qalıb — atom UPDATE. */
  function claimRow(day, slotKey, format, kind) {
    const t = now()
    if (q.claim.run(day, slotKey, format, kind, t, t).changes === 1) return q.get.get(day, slotKey, format)
    const row = q.get.get(day, slotKey, format)
    if (!row || row.status === 'published' || row.status === 'failed') return null
    if (q.retake.run(t, row.id, t, t - STALE_CLAIM_MS, MAX_ATTEMPTS).changes === 1) return q.get.get(day, slotKey, format)
    return null
  }

  let busy = false
  async function tick() {
    if (!cfg.enabled || authBlocked || busy) return 0
    busy = true
    let n = 0
    try {
      const t = nowAt(TZ, now())
      const cur = toMin(t.hhmm)
      for (let i = 0; i < cfg.slots.length; i++) {
        const sm = toMin(cfg.slots[i])
        if (cur < sm || cur > sm + CATCHUP_MIN) continue
        for (const format of cfg.stories ? ['feed', 'story'] : ['feed']) {
          if (authBlocked) break
          const row = claimRow(t.dateKey, cfg.slots[i], format, kindFor(i, t.dateKey))
          if (row && await runFormat(row, t.dateKey, i, cfg.slots[i], format)) n++
        }
      }
    } catch (e) {
      log.error('Instagram tick:', e && e.message)
    } finally { busy = false }
    return n
  }

  /** Əl ilə dərhal dərc (admin / CLI): bu gün, yuva i — gündə bir dəfə (slot = 'manual-<i>'). */
  async function publishNow(slotIndex) {
    if (!cfg.enabled) return { error: 'disabled' }
    if (authBlocked) return { error: 'auth_error' }
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= cfg.slots.length) return { error: 'bad_slot' }
    const t = nowAt(TZ, now())
    const slotKey = `manual-${slotIndex}`
    const results = {}
    for (const format of cfg.stories ? ['feed', 'story'] : ['feed']) {
      const row = claimRow(t.dateKey, slotKey, format, kindFor(slotIndex, t.dateKey))
      if (!row) { results[format] = 'already'; continue }
      results[format] = (await runFormat(row, t.dateKey, slotIndex, slotKey, format)) ? 'published' : 'failed'
    }
    return { results }
  }

  // ── Tokenin yenilənməsi (yalnız graph.instagram.com; həftədə bir, iki proses arasında gündə bir dəfə) ──
  async function refreshTick() {
    if (!cfg.enabled || authBlocked || cfg.host !== 'graph.instagram.com') return false
    const t = now()
    const rec = tokenRecord()
    let since = rec ? rec.refreshedAt : null
    if (!since) {
      // env tokeninin yaşı bilinmir: ilk dəfə görüldüyü an (env dəyişəndə həş dəyişir → yenidən sayılır)
      const seenKey = 'env_seen:' + crypto.createHash('sha256').update(cfg.token).digest('base64url').slice(0, 16)
      q.stClaim.run(seenKey, '1', t)
      since = q.stGet.get(seenKey).at
      if (t - since < REFRESH_MIN_AGE_MS) return false
    } else if (t - since < REFRESH_EVERY_MS) return false
    const day = nowAt(TZ, t).dateKey
    // Bir dəfə: iki proses (kəsintisiz deploy) eyni gün yalnız biri yeniləyir
    if (q.stClaim.run(`refresh:${day}`, '1', t).changes !== 1) return false
    try {
      const j = await graph('GET', '/refresh_access_token', { grant_type: 'ig_refresh_token', access_token: currentToken() }, { versioned: false })
      const nt = String((j && j.access_token) || '')
      if (!TOKEN_RE.test(nt)) { log.error('Instagram: token yenilənmədi (cavab yararsızdır)'); return false }
      const exp = Number(j.expires_in) > 0 ? t + Number(j.expires_in) * 1000 : null
      q.stSet.run('token', sealToken(cfg.token, { t: nt, refreshedAt: t, expiresAt: exp }), t)
      log.log(`Instagram: token yeniləndi${exp ? ` (bitir ~${new Date(exp).toISOString().slice(0, 10)})` : ''}`)
      return true
    } catch (e) {
      if (e && e.kind === 'auth') blockAuth('token refresh')
      else log.warn('Instagram: token yenilənmədi —', e && e.kind)
      return false
    }
  }

  function purge(t = now()) {
    let n = 0
    try { n += q.purge.run(t - ROW_TTL_MS).changes } catch (e) { log.error('Instagram purge:', e && e.message) }
    try { raw.prepare("DELETE FROM instagram_state WHERE (k LIKE 'refresh:%') AND at < ?").run(t - 30 * 864e5) } catch { /* */ }
    return n + purgeCards(t)
  }

  /** Hesab məlumatı (CLI token-info, admin): token çap olunmur. */
  async function tokenInfo() {
    if (!cfg.enabled) return { error: cfg.reason }
    const out = { host: cfg.host, version: cfg.version, source: tokenRecord() ? 'refreshed' : 'env' }
    const rec = tokenRecord()
    if (rec) { out.refreshedAt = rec.refreshedAt; out.expiresAt = rec.expiresAt || null }
    try {
      const me = cfg.host === 'graph.instagram.com'
        ? await graph('GET', '/me', { fields: 'user_id,username,account_type' })
        : await graph('GET', `/${cfg.userId}`, { fields: 'id,username' })
      out.username = me.username || null
      out.accountType = me.account_type || null
      out.userIdMatches = String(me.user_id || me.id || '') === cfg.userId
      const lim = await graph('GET', `/${cfg.userId}/content_publishing_limit`, { fields: 'quota_usage,config' })
      const d = lim && Array.isArray(lim.data) ? lim.data[0] : null
      if (d) out.quota = { usage: Number(d.quota_usage) || 0, total: Number(d.config && d.config.quota_total) || null }
    } catch (e) {
      out.error = (e && e.kind) || 'error'
      if (e && e.kind === 'auth') blockAuth('token-info')
    }
    return out
  }

  function status() {
    const rec = cfg.token ? tokenRecord() : null
    return {
      enabled: cfg.enabled, reason: authBlocked ? 'auth_error' : cfg.reason, configured: cfg.configured,
      lang: cfg.lang, stories: cfg.stories, host: cfg.host, timezone: TZ,
      slots: cfg.slots.map((s, i) => ({ time: s, kind: SLOT_KINDS[i % SLOT_KINDS.length] })),
      next: cfg.enabled ? nextSlot(cfg.slots, now()) : null,
      token: cfg.enabled ? { source: rec ? 'refreshed' : 'env', refreshedAt: rec ? rec.refreshedAt : null, expiresAt: rec ? (rec.expiresAt || null) : null } : null,
      posts: q.recent.all(30).map((r) => ({ ...r, error: r.error ? String(r.error).slice(0, 120) : null })),
    }
  }

  /** Önizləmə (dərc etmir, fayl yazmır). */
  async function preview(slotIndex, { format = 'feed', date = null, lang = cfg.lang } = {}) {
    const d = date && DATE_RE.test(date) ? date : nowAt(TZ, now()).dateKey
    const i = Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < Math.max(3, cfg.slots.length) ? slotIndex : 0
    const slots = cfg.slots.length > i ? cfg.slots : DEFAULT_SLOTS
    const prep = await prepare(d, i, { formats: [format], lang, slots })
    return prep ? { jpeg: prep.cards[format], caption: prep.caption, item: prep.content.key, kind: prep.content.kind } : null
  }

  // ── HTTP ──
  const router = express.Router()
  router.get('/ig/card/:name', (req, res) => {
    if (!cfg.enabled) return res.status(404).json({ error: 'Not found' })
    const name = String(req.params.name || '')
    if (!CARD_NAME_RE.test(name)) return res.status(404).json({ error: 'Not found' })
    let buf
    try { buf = fs.readFileSync(path.join(cardDir, name)) } catch { return res.status(404).json({ error: 'Not found' }) }
    res.set({ 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff' })
    res.send(buf)
  })

  /** Admin marşrutları: requireAdmin + rol (server.js ötürür). */
  function adminRouter({ requireAdmin, adminRoleOf }) {
    const r = express.Router()
    const json = express.json({ limit: '2kb' })
    const err = (res, status, code) => res.status(status).json({ error: 'Request failed', code })
    const role = (req) => (adminRoleOf && req.adminUser ? adminRoleOf(req.adminUser.id) : null)
    const adminOnly = (req, res, next) => {
      res.set('Cache-Control', 'no-store')
      if (!req.adminUser || req.adminUser.via !== 'session') return err(res, 403, 'session_required')
      if (!['admin', 'superadmin'].includes(role(req))) return err(res, 403, 'admin_required')
      next()
    }
    const superOnly = (req, res, next) => (role(req) === 'superadmin' ? next() : err(res, 403, 'superadmin_required'))
    const buckets = new Map()
    const allow = (k, max) => {
      const t = now(), b = buckets.get(k)
      if (!b || t - b.start >= 3600e3) { buckets.set(k, { start: t, n: 1 }); return true }
      if (b.n >= max) return false
      b.n++
      return true
    }
    const bodyOf = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {})

    r.get('/admin/instagram', requireAdmin, adminOnly, (req, res) => res.json(status()))

    r.post('/admin/instagram/preview', requireAdmin, adminOnly, superOnly, json, async (req, res) => {
      const b = bodyOf(req)
      const slot = Number(b.slot)
      const format = b.format === 'story' ? 'story' : b.format === 'feed' || b.format == null ? 'feed' : null
      if (!Number.isInteger(slot) || slot < 0 || slot > 5 || !format) return err(res, 400, 'bad_request')
      const lang = b.lang == null ? cfg.lang : (LANGS.includes(b.lang) ? b.lang : null)
      if (!lang) return err(res, 400, 'bad_lang')
      if (!allow(`p:${req.adminUser.id}`, 30)) return err(res, 429, 'rate_limited')
      try {
        const p = await preview(slot, { format, lang })
        if (!p) return err(res, 422, 'no_fitting_item')
        res.set({ 'Content-Type': 'image/jpeg', 'X-Ig-Item': encodeURIComponent(p.item), 'X-Ig-Caption': encodeURIComponent(p.caption).slice(0, 7000) })
        return res.send(p.jpeg)
      } catch (e) {
        log.error('Instagram preview:', e && (e.kind || e.message))
        return err(res, 502, e && e.kind === 'transient' ? 'source_unavailable' : 'render_failed')
      }
    })

    r.post('/admin/instagram/publish', requireAdmin, adminOnly, superOnly, json, async (req, res) => {
      const b = bodyOf(req)
      const slot = Number(b.slot)
      if (b.confirm !== true) return err(res, 400, 'confirm_required')
      if (!Number.isInteger(slot) || slot < 0 || slot >= cfg.slots.length) return err(res, 400, 'bad_slot')
      if (!cfg.enabled) return err(res, 409, 'disabled')
      if (authBlocked) return err(res, 409, 'auth_error')
      if (!allow(`m:${req.adminUser.id}`, 6)) return err(res, 429, 'rate_limited')
      // Dərc dəqiqələrlə çəkə bilər (konteyner hazırlığı) — arxa planda; nəticə statusda görünür
      publishNow(slot).catch((e) => log.error('Instagram publish-now:', e && e.message))
      return res.status(202).json({ ok: true })
    })
    return r
  }

  return {
    enabled: cfg.enabled, config: cfg, router, adminRouter, tick, refreshTick, purge, purgeCards, publishNow, preview, status,
    tokenInfo, prepare, cardDir, _q: q, _graph: graph, _publishImage: publishImage,
  }
}

module.exports = {
  createInstagram, parseConfig, parseSlots, kindFor, themeFor, nextSlot, buildCaption, classifyError, isBukhariMuslim,
  hadithContent, duaContent, nameContent, ayahContent, sealToken, openToken, CARD_NAME_RE, SLOT_KINDS, DEFAULT_SLOTS, LANGS,
}
