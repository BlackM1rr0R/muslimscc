// ═══════════════════════════════════════════════════════════════════════
// TikTok yükləyicisi — günün reel videosunu (Instagram-la EYNİ MP4) @muslimscc TikTok hesabına göndərir (docs/TIKTOK.md)
//
// • Rəsmi TikTok Content Posting API (open.tiktokapis.com, 2026-11 sənədləri):
//     inbox (susmaya görə, scope video.upload): POST /v2/post/publish/inbox/video/init/ → video sahibin TikTok
//       "Gələnlər"inə (qaralama) düşür, sahib tətbiqdə mətni yapışdırıb "Post" basır (inbox API caption qəbul ETMİR —
//       hazır mətn admin panelindədir).
//     direct (scope video.publish, TIKTOK_MODE=direct): POST /v2/post/publish/creator_info/query/ (məxfilik seçimləri,
//       max müddət) → POST /v2/post/publish/video/init/ (post_info.title = caption, privacy_level). AUDİTDƏN KEÇMƏMİŞ
//       tətbiq yalnız SELF_ONLY (yalnız mən) dərc edə bilər — TIKTOK_PRIVACY susmaya görə SELF_ONLY.
//     Fayl: FILE_UPLOAD (susmaya görə; domen təsdiqi lazım deyil) — upload_url-ə PUT, Content-Range ilə hissə-hissə
//       (< 5 MB və ya < hissə ölçüsü — bütöv; hər hissə 5–64 MB, sonuncu ≤ 128 MB, ardıcıl; 206 → növbəti, 201 → bitdi).
//       TIKTOK_SOURCE=url — PULL_FROM_URL: TikTok faylı https://muslims.cc/api/tiktok/media/<tarix>-reel.mp4-dən çəkir
//       (developer portalda URL prefiksi https://muslims.cc/api/tiktok/media/ TƏSDİQLƏNMƏLİDİR).
//     Status: POST /v2/post/publish/status/fetch/ (PROCESSING_UPLOAD → SEND_TO_USER_INBOX | PUBLISH_COMPLETE | FAILED).
// • OAuth v2 (Login Kit, veb): yalnız baş admin bir dəfə "TikTok-u qoş" basır → GET /api/tiktok/connect (admin sessiyası,
//   superadmin) → https://www.tiktok.com/v2/auth/authorize/ (state = HMAC imzalı, 10 dəq, bir dəfəlik + SameSite=Lax
//   kuki ilə brauzerə bağlı) → GET /api/tiktok/callback (admin kukisi SameSite=Strict-dir, TikTok-dan qayıdanda
//   GƏLMİR — ona görə yoxlama state + kuki + bazadakı bir dəfəlik nonce ilədir) → POST /v2/oauth/token/.
//   access_token (sənəd: 2 saat) + refresh_token (180 gün; HƏR yeniləmədə dəyişir — rotasiya) bazada AES-256-GCM ilə
//   (açar TIKTOK_CLIENT_SECRET-dən törəmə — instagram.js kimi). Müddətlər cavabdakı expires_in / refresh_expires_in-dən.
//   Yeniləmə istifadədən əvvəl (≤ 10 dəq qalıbsa) + gündə bir dəfə; iki proses (kəsintisiz deploy) eyni anda yeniləməsin
//   deyə bazada kilid. Token, kod, client secret heç vaxt loglanmır və brauzerə göndərilmir.
// • TAM SÖNÜLÜ: TIKTOK_ENABLED=1 + TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET yoxdursa — şəbəkə sorğusu yoxdur, /api/tiktok/*
//   → 404, planlayıcı işləmir; admin bölməsi yalnız "sönülüdür" göstərir.
// • Gündə 3 video (2026-11-27; TIKTOK_TIMES, susmaya görə "09:00,14:00,18:30" Asia/Baku — sıra ilə yuvalar):
//     hadith — günün hədis videosu (<tarix>-reel-hadith.mp4), extra — dua / Allahın adı (<tarix>-reel-dua|name.mp4),
//     ayah — Quran passajı (<tarix>-reel.mp4, tilavətlə). Yuvanı söndürmək: həmin yerdə "off" ("off,14:00,18:30").
//   Köhnə TIKTOK_TIME (tək vaxt) TIKTOK_TIMES yoxdursa ayə yuvasının vaxtıdır. Fayllar <DB qovluğu>/ig-cards/-dədir — CI
//   (.github/workflows/ig-reel.yml) yazır, bu modul yalnız OXUYUR. tiktok_slot_posts (day, slot) UNIQUE — INSERT OR IGNORE
//   ilə "tutan" proses göndərir (köhnə tiktok_posts cədvəlindəki günlük sətir ayə yuvası sayılır — ikinci dəfə getmir).
//   Inbox rejimində TikTok-un limiti (24 saatda ≤ 5 gözləyən qaralama) — sayılır, dolubsa yuva atlanır (bir dəfə loglanır). Xəta → 2 / 5 / 15 / 30 dəq fasilə (≤ 5 cəhd); avtorizasiya xətası → planlayıcı dayanır,
//   BİR dəfə loglanır, bazada qeyd olunur (yenidən qoşulana qədər). Gündəlik limit / konfiqurasiya xətası → o gün atlanır.
// • Məzmun: yalnız saytın açıq məzmunu (ayə mətni alquran.cloud-dan, dəyişdirilmir) — caption instagram.js-in reel
//   caption-u ilə eyni qayda (ingiliscə, mənbə, qari, keçid, ≤ 5 heşteq). İstifadəçi məlumatı YOXDUR (cədvəllər users-ə
//   bağlı deyil, ixraca / xülasəyə düşmür).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const express = require('express')
const dailyAyah = require('./daily-ayah')
const REEL = require('./instagramReel')
const { nowAt } = require('./telegramBot')
const { parseCookies } = require('./auth')

const TZ = 'Asia/Baku'
const API = 'https://open.tiktokapis.com'
const AUTHORIZE_URL = 'https://www.tiktok.com/v2/auth/authorize/'
const MODES = ['inbox', 'direct']
const PRIVACY = ['SELF_ONLY', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'PUBLIC_TO_EVERYONE']
const SOURCES = ['file', 'url']
const INTERACTIONS = ['comment', 'duet', 'stitch']
const DEFAULT_TIME = '18:30'
// Yuvalar (sıra TIKTOK_TIMES ilə eynidir): hadith 09:00, extra (dua / ad) 14:00, ayah 18:30
const SLOT_KEYS = ['hadith', 'extra', 'ayah']
const DEFAULT_TIMES = ['09:00', '14:00', DEFAULT_TIME]
const PENDING_MAX = 5                          // TikTok inbox: 24 saatda ən çox 5 gözləyən paylaşım
const PENDING_WINDOW_MS = 24 * 3600e3
const CAPTION_LANG = 'en'
const SCOPES = { inbox: ['user.info.basic', 'video.upload'], direct: ['user.info.basic', 'video.publish'] }
const CATCHUP_MIN = 240                        // server vaxtında işləmirdisə, 4 saat ərzində tutur (yuvalar ≥ 4.5 saat aralı)
const STALE_CLAIM_MS = 15 * 60e3
const BACKOFF_MIN = [2, 5, 15, 30]
const MAX_ATTEMPTS = BACKOFF_MIN.length + 1
const STATE_TTL_MS = 10 * 60e3
const REFRESH_BEFORE_MS = 10 * 60e3            // access token ≤ 10 dəq qalıbsa — yenilə
const KEEPALIVE_MS = 20 * 3600e3               // gündə bir dəfə yeniləmə (refresh token zəncirini təzə saxlayır)
const LOCK_MS = 60e3
const ROW_TTL_MS = 180 * 864e5
const FOLLOW_MS = 3 * 864e5                    // processing / inbox sətirlərinin statusunu 3 gün izlə
const FOLLOW_EVERY_MS = 30 * 60e3
const MIN_CHUNK = 5 * 1024 * 1024
const CHUNK = 10 * 1024 * 1024
const MAX_CHUNK = 64 * 1024 * 1024
const POLL_SEC = [5, 5, 10, 10, 15, 15, 20, 20, 30, 30, 30, 30]   // ~3.7 dəq
const CHUNK_TRIES = 3
const CAPTION_MAX = 2200
const KEY_RE = /^[A-Za-z0-9_-]{8,64}$/
const SECRET_RE = /^[\x21-\x7e]{16,256}$/
const TOKEN_RE = /^[\x21-\x7e]{10,2048}$/
const CODE_RE = /^[\x21-\x7e]{4,2048}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const STATE_RE = /^([A-Za-z0-9_-]{22})\.(\d{13})\.([A-Za-z0-9_-]{1,40})\.([A-Za-z0-9_-]{43})$/
const COOKIE = '__Host-mcc_tt'

// ── Konfiqurasiya (env) ──
function parseHHMM(raw, def) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(raw || '').trim())
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return def
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

/**
 * TIKTOK_TIMES "09:00,14:00,18:30" → [{ key: 'hadith', time }, { key: 'extra', time }, { key: 'ayah', time }] (time: null —
 * "off"). Düz 3 element olmalıdır, əks halda susmaya görə (ayə yuvası ayahTime — köhnə TIKTOK_TIME).
 */
function parseTimes(raw, ayahTime = DEFAULT_TIME) {
  const def = SLOT_KEYS.map((key, i) => ({ key, time: i === 2 ? ayahTime : DEFAULT_TIMES[i] }))
  if (raw == null || String(raw).trim() === '') return def
  const parts = String(raw).split(',').map((x) => x.trim())
  if (parts.length !== SLOT_KEYS.length) return def
  const out = []
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].toLowerCase() === 'off') { out.push({ key: SLOT_KEYS[i], time: null }); continue }
    const t = parseHHMM(parts[i], null)
    if (!t) return def
    out.push({ key: SLOT_KEYS[i], time: t })
  }
  return out
}

function parseConfig(env = {}, publicOrigin = 'https://muslims.cc') {
  const clientKey = String(env.TIKTOK_CLIENT_KEY || '').trim()
  const clientSecret = String(env.TIKTOK_CLIENT_SECRET || '').trim()
  const mode = MODES.includes(String(env.TIKTOK_MODE || '').trim()) ? String(env.TIKTOK_MODE).trim() : 'inbox'
  const privacy = PRIVACY.includes(String(env.TIKTOK_PRIVACY || '').trim()) ? String(env.TIKTOK_PRIVACY).trim() : 'SELF_ONLY'
  const source = SOURCES.includes(String(env.TIKTOK_SOURCE || '').trim()) ? String(env.TIKTOK_SOURCE).trim() : 'file'
  const time = parseHHMM(env.TIKTOK_TIME, DEFAULT_TIME)
  const slots = parseTimes(env.TIKTOK_TIMES, time)
  // Direct Post: icazə verilən qarşılıqlı əlaqə (susmaya görə yalnız şərh; duet / stitch — Quran tilavəti üzərində montaj yox)
  const rawAllow = env.TIKTOK_ALLOW == null ? 'comment' : String(env.TIKTOK_ALLOW)
  const allow = [...new Set(rawAllow.split(',').map((s) => s.trim()).filter((s) => INTERACTIONS.includes(s)))]
  const origin = String(publicOrigin || 'https://muslims.cc').replace(/\/+$/, '')
  const ru = String(env.TIKTOK_REDIRECT_URI || '').trim()
  const redirectUri = /^https:\/\/[a-z0-9.-]+(:\d+)?\/[\x21-\x7e]{0,200}$/i.test(ru) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/[\x21-\x7e]{0,200}$/.test(ru)
    ? ru : `${origin}/api/tiktok/callback`
  const configured = Boolean(clientKey || clientSecret)
  let reason = null
  if (env.TIKTOK_ENABLED !== '1') reason = 'disabled'
  else if (!clientKey || !clientSecret) reason = 'missing_credentials'
  else if (!KEY_RE.test(clientKey) || !SECRET_RE.test(clientSecret)) reason = 'bad_format'
  return {
    enabled: !reason, reason, configured, clientKey, clientSecret, mode, privacy, source, allow, redirectUri,
    scopes: SCOPES[mode], slots,
    // geriyə uyğunluq: "time" — ayə yuvasının vaxtı (söndürülübsə köhnə TIKTOK_TIME / 18:30)
    time: (slots.find((x) => x.key === 'ayah') || {}).time || time,
  }
}

// ── Vaxt ──
const toMin = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + m }

// ── Hissələr (Media Transfer Guide): < 5 MB və ya < CHUNK → bütöv; əks halda floor(size / chunk) hissə, qalıq sonuncuya ──
function chunkPlan(size, chunk = CHUNK) {
  const n = Number(size)
  if (!Number.isSafeInteger(n) || n <= 0) return null
  const c = Math.min(MAX_CHUNK, Math.max(MIN_CHUNK, Number(chunk) || CHUNK))
  if (n < MIN_CHUNK || n < c) return { videoSize: n, chunkSize: n, count: 1, ranges: [[0, n - 1]] }
  const count = Math.floor(n / c)
  if (count > 1000) return null
  const ranges = []
  for (let i = 0; i < count; i++) ranges.push([i * c, i === count - 1 ? n - 1 : (i + 1) * c - 1])
  return { videoSize: n, chunkSize: c, count, ranges }
}

// ── Xətaların növü ──
const AUTH_CODES = new Set(['access_token_invalid', 'scope_not_authorized', 'invalid_grant', 'auth_removed', 'token_not_authorized_for_specified_publish_id'])
const LIMIT_CODES = new Set(['spam_risk_too_many_posts', 'spam_risk_too_many_pending_share', 'reached_active_user_cap'])
const CONFIG_CODES = new Set(['unaudited_client_can_only_post_to_private_accounts', 'privacy_level_option_mismatch', 'url_ownership_unverified',
  'spam_risk_user_banned_from_posting', 'spam_risk_text', 'spam_risk', 'invalid_client', 'unauthorized_client', 'privacy_unavailable', 'duration_too_long'])
const RETRY_FAIL = new Set(['internal', 'video_pull_failed'])
function classify(code, status) {
  const c = String(code || '')
  if (AUTH_CODES.has(c) || status === 401) return 'auth'
  if (LIMIT_CODES.has(c)) return 'limit'
  if (CONFIG_CODES.has(c)) return 'config'
  if (c === 'rate_limit_exceeded' || status === 429) return 'rate'
  if (c === 'internal_error' || RETRY_FAIL.has(c) || !status || status >= 500) return 'transient'
  return 'fatal'
}
class TikTokError extends Error {
  constructor(kind, code, status) {
    super(`tiktok ${kind} (${code || '-'}, status ${status || '-'})`)
    this.kind = kind; this.code = code || null; this.status = status || null
  }
}
const failure = (kind, code) => new TikTokError(kind, code, null)

// ── Token qeydi (AES-256-GCM, açar client secret-dən) ──
const tokenKey = (secret) => crypto.createHash('sha256').update('mcc-tt-token-v1|' + secret).digest()
const stateKey = (secret) => crypto.createHash('sha256').update('mcc-tt-state-v1|' + secret).digest()
function seal(secret, obj) {
  const iv = crypto.randomBytes(12)
  const c = crypto.createCipheriv('aes-256-gcm', tokenKey(secret), iv)
  const ct = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64url')
}
function unseal(secret, sealed) {
  try {
    const b = Buffer.from(String(sealed || ''), 'base64url')
    if (b.length < 29) return null
    const d = crypto.createDecipheriv('aes-256-gcm', tokenKey(secret), b.subarray(0, 12))
    d.setAuthTag(b.subarray(12, 28))
    const o = JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'))
    return o && typeof o.a === 'string' && TOKEN_RE.test(o.a) && typeof o.r === 'string' && TOKEN_RE.test(o.r) ? o : null
  } catch { return null }
}

// ── OAuth state: <nonce>.<bitmə ms>.<admin id>.<HMAC> — imzalı, qısaömürlü, bir dəfəlik (nonce bazada) ──
function signState(secret, nonce, exp, adminId) {
  const payload = `${nonce}.${exp}.${adminId}`
  return `${payload}.${crypto.createHmac('sha256', stateKey(secret)).update(payload).digest('base64url')}`
}
/** → { nonce, exp, adminId } | null (format / imza / müddət) */
function verifyState(secret, state, now = Date.now()) {
  const m = STATE_RE.exec(String(state || ''))
  if (!m) return null
  const want = crypto.createHmac('sha256', stateKey(secret)).update(`${m[1]}.${m[2]}.${m[3]}`).digest()
  const got = Buffer.from(m[4], 'base64url')
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null
  const exp = Number(m[2])
  if (!(exp > now) || exp - now > STATE_TTL_MS) return null
  return { nonce: m[1], exp, adminId: m[3] }
}
const sameStr = (a, b) => {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''))
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y)
}

/**
 * opts: { db, env?, publicOrigin?, adminPath?, cardDir?, fetchImpl?, now?, sleep?, log?, pollMs?: number[] }
 */
function createTikTok(opts = {}) {
  const {
    db, env = process.env, publicOrigin = 'https://muslims.cc', fetchImpl = (...a) => fetch(...a), now = () => Date.now(),
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)), log = console,
  } = opts
  const cfg = parseConfig(env, publicOrigin)
  const origin = String(publicOrigin || 'https://muslims.cc').replace(/\/+$/, '')
  const adminPath = typeof opts.adminPath === 'string' && /^\/[a-z0-9/-]{2,60}$/.test(opts.adminPath) ? opts.adminPath : '/account/panel'
  const cardDir = opts.cardDir || path.join(path.dirname(path.resolve(env.DB_PATH || '/data/muslims.db')), 'ig-cards')
  const pollMs = Array.isArray(opts.pollMs) ? opts.pollMs : POLL_SEC.map((s) => s * 1000)
  const chunkSize = Number(opts.chunkSize) || CHUNK
  if (cfg.configured && !cfg.enabled) log.warn(`TikTok: yükləyici sönülüdür (${cfg.reason})`)

  const raw = db.raw || db
  raw.exec(`CREATE TABLE IF NOT EXISTS tiktok_posts (
    id INTEGER PRIMARY KEY,
    day TEXT NOT NULL UNIQUE,
    mode TEXT NOT NULL,
    item TEXT,
    caption TEXT,
    publish_id TEXT,
    status TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    error TEXT,
    next_at INTEGER,
    checked_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`)
  // 2026-11-27: gündə 3 yuva — (day, slot) UNIQUE. Köhnə tiktok_posts (day UNIQUE) yalnız oxunur (ayə yuvası) və təmizlənir.
  raw.exec(`CREATE TABLE IF NOT EXISTS tiktok_slot_posts (
    id INTEGER PRIMARY KEY,
    day TEXT NOT NULL,
    slot TEXT NOT NULL,
    kind TEXT NOT NULL,
    mode TEXT NOT NULL,
    item TEXT,
    caption TEXT,
    publish_id TEXT,
    status TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    error TEXT,
    next_at INTEGER,
    checked_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE (day, slot)
  )`)
  raw.exec('CREATE TABLE IF NOT EXISTS tiktok_state (k TEXT PRIMARY KEY, v TEXT NOT NULL, at INTEGER NOT NULL) WITHOUT ROWID')
  const q = {
    claim: raw.prepare(`INSERT OR IGNORE INTO tiktok_slot_posts (day, slot, kind, mode, status, attempts, created_at, updated_at) VALUES (?, ?, ?, ?, 'claimed', 1, ?, ?)`),
    get: raw.prepare('SELECT * FROM tiktok_slot_posts WHERE day = ? AND slot = ?'),
    legacy: raw.prepare('SELECT * FROM tiktok_posts WHERE day = ?'),
    retake: raw.prepare(`UPDATE tiktok_slot_posts SET status = 'claimed', mode = ?, attempts = attempts + 1, updated_at = ?
      WHERE id = ? AND ((status = 'retry' AND next_at <= ?) OR (status = 'claimed' AND updated_at < ?)) AND attempts < ?`),
    touch: raw.prepare('UPDATE tiktok_slot_posts SET updated_at = ? WHERE id = ?'),
    started: raw.prepare('UPDATE tiktok_slot_posts SET publish_id = ?, item = ?, caption = ?, updated_at = ? WHERE id = ?'),
    setStatus: raw.prepare('UPDATE tiktok_slot_posts SET status = ?, error = ?, next_at = ?, checked_at = ?, updated_at = ? WHERE id = ?'),
    setItem: raw.prepare('UPDATE tiktok_slot_posts SET item = COALESCE(?, item), caption = COALESCE(?, caption) WHERE id = ?'),
    follow: raw.prepare(`SELECT * FROM tiktok_slot_posts WHERE status IN ('processing', 'sent') AND publish_id IS NOT NULL AND created_at > ?
      AND (checked_at IS NULL OR checked_at < ?) ORDER BY id LIMIT 5`),
    // Gözləyən inbox paylaşımları (TikTok limiti): göndərilib (sent), emal olunur, və ya init edilib hələ bitməyib
    pending: raw.prepare(`SELECT COUNT(*) AS n FROM tiktok_slot_posts WHERE mode = 'inbox' AND created_at > ?
      AND (status IN ('processing', 'sent') OR (status = 'claimed' AND publish_id IS NOT NULL))`),
    pendingLegacy: raw.prepare(`SELECT COUNT(*) AS n FROM tiktok_posts WHERE mode = 'inbox' AND created_at > ? AND status IN ('processing', 'sent')`),
    recent: raw.prepare('SELECT day, slot, kind, mode, item, caption, status, attempts, error, created_at, updated_at FROM tiktok_slot_posts ORDER BY day DESC, id DESC LIMIT ?'),
    purge: raw.prepare('DELETE FROM tiktok_slot_posts WHERE created_at < ?'),
    purgeLegacy: raw.prepare('DELETE FROM tiktok_posts WHERE created_at < ?'),
    stGet: raw.prepare('SELECT v, at FROM tiktok_state WHERE k = ?'),
    stSet: raw.prepare('INSERT INTO tiktok_state (k, v, at) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, at = excluded.at'),
    stClaim: raw.prepare('INSERT OR IGNORE INTO tiktok_state (k, v, at) VALUES (?, ?, ?)'),
    stDel: raw.prepare('DELETE FROM tiktok_state WHERE k = ?'),
    stDelOld: raw.prepare('DELETE FROM tiktok_state WHERE k = ? AND at < ?'),
    stPurge: raw.prepare("DELETE FROM tiktok_state WHERE (k LIKE 'oauth:%' OR k LIKE 'missing:%' OR k LIKE 'pending:%') AND at < ?"),
  }

  // ── Token ──
  function tokenRecord() {
    const r = q.stGet.get('token')
    return r ? unseal(cfg.clientSecret, r.v) : null
  }
  function saveToken(j, t) {
    const a = String((j && j.access_token) || ''), r = String((j && j.refresh_token) || '')
    if (!TOKEN_RE.test(a) || !TOKEN_RE.test(r)) return null
    const rec = {
      a, r,
      aExp: t + Math.max(60, Number(j.expires_in) || 7200) * 1000,
      rExp: Number(j.refresh_expires_in) > 0 ? t + Number(j.refresh_expires_in) * 1000 : null,
      scope: String(j.scope || '').slice(0, 300),
      openId: typeof j.open_id === 'string' ? j.open_id.slice(0, 100) : null,
      at: t,
    }
    q.stSet.run('token', seal(cfg.clientSecret, rec), t)
    return rec
  }
  const scopeOk = (rec) => Boolean(rec) && cfg.scopes.filter((s) => s !== 'user.info.basic').every((s) => String(rec.scope || '').split(/[ ,]+/).includes(s))

  // Avtorizasiya xətası: bazada (iki proses də görür), BİR dəfə loglanır; yeni qoşulma təmizləyir
  let authLogged = false
  function blockAuth(where, code) {
    q.stSet.run('auth_error', JSON.stringify({ where: String(where).slice(0, 40), code: String(code || '').slice(0, 60) }), now())
    if (!authLogged) { authLogged = true; log.error(`TikTok: avtorizasiya xətası (${where}${code ? `, ${code}` : ''}) — planlayıcı dayandı; admin panelində "TikTok-u qoş" ilə yenidən qoşun`) }
  }
  const authBlocked = () => Boolean(q.stGet.get('auth_error'))

  // ── HTTP ──
  async function readJson(r) { try { return await r.json() } catch { return null } }
  /** OAuth (form) — /v2/oauth/token/, /v2/oauth/revoke/. Xəta → TikTokError (kod: error sahəsi). */
  async function oauth(pathname, form) {
    let r
    try {
      r = await fetchImpl(`${API}${pathname}`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' },
        body: new URLSearchParams({ client_key: cfg.clientKey, client_secret: cfg.clientSecret, ...form }).toString(),
        signal: AbortSignal.timeout(20000),
      })
    } catch { throw new TikTokError('transient', 'network', 0) }
    const j = await readJson(r)
    if (!r.ok || !j || (j.error && typeof j.error === 'string')) {
      const code = j && typeof j.error === 'string' ? j.error : null
      throw new TikTokError(r.status >= 500 ? 'transient' : classify(code, r.status), code, r.status)
    }
    return j
  }
  /** Content API (JSON, Bearer): { data, error: { code } } — code 'ok' deyilsə TikTokError. */
  async function call(pathname, body, token) {
    let r
    try {
      r = await fetchImpl(`${API}${pathname}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
        body: body == null ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000),
      })
    } catch { throw new TikTokError('transient', 'network', 0) }
    const j = await readJson(r)
    const code = j && j.error && typeof j.error === 'object' ? String(j.error.code || '') : (j && typeof j.error === 'string' ? j.error : '')
    if (r.ok && j && (code === 'ok' || code === '')) return j.data || {}
    throw new TikTokError(classify(code, r.status), code || null, r.status)
  }
  async function getJson(pathname, token) {
    let r
    try {
      r = await fetchImpl(`${API}${pathname}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000) })
    } catch { throw new TikTokError('transient', 'network', 0) }
    const j = await readJson(r)
    const code = j && j.error && typeof j.error === 'object' ? String(j.error.code || '') : ''
    if (r.ok && j && (code === 'ok' || code === '')) return j.data || {}
    throw new TikTokError(classify(code, r.status), code || null, r.status)
  }

  // ── Yeniləmə (rotasiya!): bazada kilid — iki proses eyni refresh_token-i göndərsə, ikincisi invalid_grant alardı ──
  async function refresh(force = false) {
    const rec = tokenRecord()
    if (!rec) throw failure('auth', 'not_connected')
    const t = now()
    if (!force && rec.aExp - t > REFRESH_BEFORE_MS) return rec
    q.stDelOld.run('refresh_lock', t - LOCK_MS)
    if (q.stClaim.run('refresh_lock', '1', t).changes !== 1) {
      // Digər proses yeniləyir — qısa gözlə və onun yazdığını götür
      for (let i = 0; i < 10; i++) {
        await sleep(1000)
        const r2 = tokenRecord()
        if (r2 && r2.at > rec.at && r2.aExp - now() > 60e3) return r2
        if (!q.stGet.get('refresh_lock')) break
      }
      const r3 = tokenRecord()
      if (r3 && r3.aExp - now() > 60e3) return r3
      throw failure('transient', 'refresh_busy')
    }
    try {
      const cur = tokenRecord() || rec
      if (!force && cur.at > rec.at && cur.aExp - now() > REFRESH_BEFORE_MS) return cur
      if (cur.rExp && cur.rExp <= now()) { blockAuth('refresh', 'refresh_expired'); throw failure('auth', 'refresh_expired') }
      let j
      try {
        j = await oauth('/v2/oauth/token/', { grant_type: 'refresh_token', refresh_token: cur.r })
      } catch (e) {
        if (e && e.kind === 'auth') {
          // Bəlkə digər proses artıq yeniləyib (rotasiya) — bazadakı daha təzədirsə, onu işlət
          const r4 = tokenRecord()
          if (r4 && r4.r !== cur.r) return r4
          blockAuth('refresh', e.code)
        }
        throw e
      }
      const saved = saveToken(j, now())
      if (!saved) throw failure('transient', 'bad_token_response')
      return saved
    } finally { q.stDel.run('refresh_lock') }
  }
  /** Etibarlı access token (lazım olsa yeniləyir). */
  async function accessToken() { return (await refresh(false)).a }
  /** Bearer çağırışı: 401 / access_token_invalid → bir dəfə məcburi yeniləmə və təkrar; yenə də → avtorizasiya bloku. */
  async function authed(fn) {
    const tok = await accessToken()                    // yeniləmə xətası (invalid_grant) refresh()-də bloklanır
    try { return await fn(tok) } catch (e) {
      if (!(e && e.kind === 'auth')) throw e
      if (e.code && e.code !== 'access_token_invalid') { blockAuth('api', e.code); throw e }
    }
    const tok2 = (await refresh(true)).a
    try { return await fn(tok2) } catch (e) {
      if (e && e.kind === 'auth') blockAuth('api', e.code)
      throw e
    }
  }

  // ── Günün video faylları (CI yazır, instagram.js ilə eyni yer; burada yalnız oxunur) ──
  const reelPath = (day, ext) => path.join(cardDir, `${day}-reel.${ext}`)
  /** Faylın başı (moov) → müddət (ms) | null */
  function headDuration(file, size) {
    let head
    try {
      const fd = fs.openSync(file, 'r')
      try { head = Buffer.alloc(Math.min(size, 512 * 1024)); fs.readSync(fd, head, 0, head.length, 0) } finally { fs.closeSync(fd) }
    } catch { return null }
    const d = REEL.mp4DurationMs(head)
    return d && d >= 3000 && d <= 600e3 ? d : null
  }
  /** Hədis / dua / ad videosu → { kind, item, file, size, audio, lang, durationMs } | null */
  function textInfo(day, kind) {
    if (!DATE_RE.test(String(day || '')) || !REEL.TEXT_KINDS.includes(kind)) return null
    const base = REEL.videoBase(day, kind)
    let st, meta
    try { st = fs.statSync(path.join(cardDir, `${base}.mp4`)) } catch { return null }
    if (!st.isFile() || st.size < 1024 || st.size > REEL.REEL_MAX_BYTES) return null
    try { meta = REEL.parseTextMeta(fs.readFileSync(path.join(cardDir, `${base}.json`), 'utf8'), kind) } catch { return null }
    if (!meta) return null
    const durationMs = headDuration(path.join(cardDir, `${base}.mp4`), st.size)
    if (!durationMs) return null
    return { kind, item: meta.item, file: `${base}.mp4`, size: st.size, audio: meta.audio, lang: meta.lang, durationMs }
  }
  /** Yuvanın günü üçün növü: extra — tək gün ad, cüt gün dua (instagram.js kindFor, 20:00 kartı ilə eyni). */
  const slotKind = (slot, day) => (slot === 'extra' ? require('./instagram').kindFor(2, day) : slot)
  /** Yuvanın faylı → info (kind, file daxil) | null. extra: günün növü (dua / ad); yoxdursa digəri də yoxlanır. */
  function mediaInfo(day, slot) {
    if (slot === 'ayah') { const r = reelInfo(day); return r ? { ...r, kind: 'ayah', file: `${day}-reel.mp4` } : null }
    if (slot === 'hadith') return textInfo(day, 'hadith')
    if (slot === 'extra') {
      const k = slotKind('extra', day)
      return textInfo(day, k) || textInfo(day, k === 'dua' ? 'name' : 'dua')
    }
    return null
  }
  /** → { size, ref, audio, durationMs } | null */
  function reelInfo(day) {
    if (!DATE_RE.test(String(day || ''))) return null
    let st, meta, head
    try { st = fs.statSync(reelPath(day, 'mp4')) } catch { return null }
    if (!st.isFile() || st.size < 1024 || st.size > REEL.REEL_MAX_BYTES) return null
    try { meta = REEL.parseMeta(fs.readFileSync(reelPath(day, 'json'), 'utf8')) } catch { return null }
    if (!meta || !dailyAyah.parseRef(meta.ref)) return null
    try {
      const fd = fs.openSync(reelPath(day, 'mp4'), 'r')
      try { head = Buffer.alloc(Math.min(st.size, 512 * 1024)); fs.readSync(fd, head, 0, head.length, 0) } finally { fs.closeSync(fd) }
    } catch { return null }
    const durationMs = REEL.mp4DurationMs(head)
    if (!durationMs || durationMs < 3000 || durationMs > 600e3) return null
    return { size: st.size, ref: meta.ref, audio: meta.audio, lang: meta.lang || null, durationMs }
  }

  // ── Caption: instagram.js reel caption-u ilə eyni qayda, ingiliscə (mətn alquran.cloud-dan, dəyişdirilmir) ──
  const ayahCache = new Map()
  async function ayahData(ref) {
    const c = ayahCache.get(ref)
    if (c && c.data) return c.data
    if (c && c.failedAt && now() - c.failedAt < 2 * 60e3) return null
    const pick = dailyAyah.parseRef(ref)
    if (!pick) return null
    const parts = []
    for (let a = pick.a; a <= pick.to; a++) {
      try {
        const r = await fetchImpl(dailyAyah.ayahApiUrl(pick.s, a), { signal: AbortSignal.timeout(15000) })
        parts.push(r.ok ? dailyAyah.parseAyahResponse(await r.json(), pick.s, a) : null)
      } catch { parts.push(null) }
    }
    const data = dailyAyah.mergeAyahParts(parts)
    if (ayahCache.size > 20) ayahCache.clear()
    ayahCache.set(ref, data ? { data } : { failedAt: now() })
    return data
  }
  async function captionFor(day, info) {
    const IG = require('./instagram')
    if (info.kind && info.kind !== 'ayah') {
      // Hədis / dua / ad: instagram.js-in kart caption-u ilə eyni qayda (saytın verbatim mətni, mənbə, "Sahih" yalnız qaydaya görə)
      const content = IG.contentById(info.kind, info.item, CAPTION_LANG, origin)
      if (!content) throw failure('fatal', 'no_content')
      const caption = IG.buildCaption(content, CAPTION_LANG, { day, tagKind: info.kind })
      if (!caption || caption.length > CAPTION_MAX) throw failure('fatal', 'caption_too_long')
      return { caption, item: content.key }
    }
    const pick = { ...dailyAyah.parseRef(info.ref), ref: info.ref }
    const data = await ayahData(info.ref)
    if (!data) throw failure('transient', 'ayah_source_unavailable')
    const content = IG.ayahContent(CAPTION_LANG, pick, data, origin)
    if (!content) throw failure('fatal', 'no_content')
    // Passaj (67:1-5) — başlıq "Verses of the Quran" (videodakı kimi, instagramReel.reelTitle varsa); tək ayə — "Verse of the day"
    if (typeof REEL.reelTitle === 'function') content.title = REEL.reelTitle(CAPTION_LANG, pick) || content.title
    const opts = { day, tagKind: 'reel' }
    const fits = (c) => (c && c.length <= CAPTION_MAX ? c : null)
    // Uzun passajda (ərəbcə + tərcümə 2200-ü keçir) — mətnsiz qısa variant (başlıq, istinad, keçid, heşteqlər; mətn videodadır)
    const caption = fits(REEL.reelCaption(IG.buildCaption(content, CAPTION_LANG, opts), info.audio, [CAPTION_LANG]))
      || fits(REEL.reelCaption(IG.buildCaption({ ...content, ar: '', text: '' }, CAPTION_LANG, opts), info.audio, [CAPTION_LANG]))
    if (!caption) throw failure('fatal', 'caption_too_long')
    return { caption, item: content.key }
  }

  // ── Yükləmə ──
  const validUploadUrl = (u) => {
    try { const x = new URL(String(u)); return x.protocol === 'https:' && /(^|\.)tiktokapis\.com$/.test(x.hostname) } catch { return false }
  }
  async function putChunks(uploadUrl, file, plan) {
    const fd = await fs.promises.open(file, 'r')
    try {
      for (let i = 0; i < plan.ranges.length; i++) {
        const [a, b] = plan.ranges[i]
        const buf = Buffer.alloc(b - a + 1)
        const { bytesRead } = await fd.read(buf, 0, buf.length, a)
        if (bytesRead !== buf.length) throw failure('fatal', 'file_changed')
        const last = i === plan.ranges.length - 1
        let ok = false
        for (let tryN = 0; tryN < CHUNK_TRIES && !ok; tryN++) {
          if (tryN) await sleep(2000 * tryN)
          let r
          try {
            r = await fetchImpl(uploadUrl, {
              method: 'PUT', body: buf, signal: AbortSignal.timeout(120000),
              headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(buf.length), 'Content-Range': `bytes ${a}-${b}/${plan.videoSize}` },
            })
          } catch { continue }
          if (r.status === 201 || (r.status === 206 && !last) || (r.ok && last)) { ok = true; break }
          if (r.status === 206 && last) throw failure('transient', 'upload_incomplete')
          if (r.status >= 500) continue
          throw new TikTokError(r.status === 403 || r.status === 404 ? 'transient' : 'fatal', `upload_${r.status}`, r.status)
        }
        if (!ok) throw failure('transient', 'upload_failed')
      }
    } finally { await fd.close() }
  }

  async function creatorInfo(token) {
    const d = await call('/v2/post/publish/creator_info/query/', null, token)
    return {
      privacyOptions: Array.isArray(d.privacy_level_options) ? d.privacy_level_options.filter((x) => PRIVACY.includes(x)) : [],
      maxSec: Number(d.max_video_post_duration_sec) || null,
      commentDisabled: d.comment_disabled === true, duetDisabled: d.duet_disabled === true, stitchDisabled: d.stitch_disabled === true,
      nickname: typeof d.creator_nickname === 'string' ? d.creator_nickname.slice(0, 80) : null,
      username: typeof d.creator_username === 'string' ? d.creator_username.slice(0, 80) : null,
    }
  }

  /** init → (FILE_UPLOAD: PUT hissələr) → publish_id. */
  async function initUpload(day, info, caption) {
    const file = path.join(cardDir, info.file || `${day}-reel.mp4`)
    const plan = cfg.source === 'file' ? chunkPlan(info.size, chunkSize) : null
    if (cfg.source === 'file' && !plan) throw failure('fatal', 'bad_size')
    const source_info = cfg.source === 'file'
      ? { source: 'FILE_UPLOAD', video_size: plan.videoSize, chunk_size: plan.chunkSize, total_chunk_count: plan.count }
      : { source: 'PULL_FROM_URL', video_url: `${origin}/api/tiktok/media/${info.file || `${day}-reel.mp4`}` }
    return authed(async (token) => {
      let pathname, body
      if (cfg.mode === 'direct') {
        const ci = await creatorInfo(token)
        if (ci.nickname || ci.username) q.stSet.run('account', JSON.stringify({ name: ci.nickname, username: ci.username }), now())
        if (!ci.privacyOptions.includes(cfg.privacy)) throw failure('config', 'privacy_unavailable')
        if (ci.maxSec && info.durationMs / 1000 > ci.maxSec) throw failure('config', 'duration_too_long')
        pathname = '/v2/post/publish/video/init/'
        body = {
          post_info: {
            title: caption, privacy_level: cfg.privacy,
            disable_comment: ci.commentDisabled || !cfg.allow.includes('comment'),
            disable_duet: ci.duetDisabled || !cfg.allow.includes('duet'),
            disable_stitch: ci.stitchDisabled || !cfg.allow.includes('stitch'),
            video_cover_timestamp_ms: Math.max(0, info.durationMs - 1000),
            brand_content_toggle: false, brand_organic_toggle: false, is_aigc: false,
          },
          source_info,
        }
      } else {
        pathname = '/v2/post/publish/inbox/video/init/'
        body = { source_info }
      }
      const d = await call(pathname, body, token)
      const publishId = typeof d.publish_id === 'string' && /^[\x21-\x7e]{1,64}$/.test(d.publish_id) ? d.publish_id : null
      if (!publishId) throw failure('transient', 'bad_init_response')
      if (cfg.source === 'file') {
        if (!validUploadUrl(d.upload_url) || String(d.upload_url).length > 2048) throw failure('transient', 'bad_upload_url')
        return { publishId, upload: () => putChunks(d.upload_url, file, plan) }
      }
      return { publishId, upload: async () => {} }
    })
  }

  /** Status: → { state: 'done' | 'sent' | 'processing' | 'failed', reason? } */
  async function fetchStatus(publishId) {
    const d = await authed((token) => call('/v2/post/publish/status/fetch/', { publish_id: publishId }, token))
    const s = String(d.status || '')
    if (s === 'PUBLISH_COMPLETE') return { state: 'done' }
    if (s === 'SEND_TO_USER_INBOX') return { state: 'sent' }
    if (s === 'FAILED') return { state: 'failed', reason: String(d.fail_reason || 'failed').slice(0, 60) }
    return { state: 'processing' }
  }
  async function pollStatus(publishId) {
    let last = { state: 'processing' }
    for (const ms of pollMs) {
      await sleep(ms)
      try { last = await fetchStatus(publishId) } catch (e) {
        if (e && e.kind === 'auth') throw e
        continue
      }
      if (last.state !== 'processing') return last
    }
    return last
  }

  const configLogged = new Set()
  function recordFailure(row, e, day) {
    const kind = (e && e.kind) || 'transient'
    const code = (e && (e.code || e.kind)) || 'error'
    const t = now()
    const retryable = (kind === 'transient' || kind === 'rate') && row.attempts < MAX_ATTEMPTS
    const next = retryable ? t + BACKOFF_MIN[Math.min(row.attempts - 1, BACKOFF_MIN.length - 1)] * 60e3 : null
    q.setStatus.run(retryable ? 'retry' : 'failed', String(code).slice(0, 120), next, null, t, row.id)
    if (kind === 'config' || kind === 'limit') {
      if (!configLogged.has(code)) { configLogged.add(code); log.error(`TikTok: ${day} göndərilmədi — ${code} (docs/TIKTOK.md → "Xətalar")`) }
    } else log.warn(`TikTok: ${day} — ${kind} (${code})${retryable ? `, təkrar ${BACKOFF_MIN[Math.min(row.attempts - 1, BACKOFF_MIN.length - 1)]} dəq sonra` : ''}`)
    return false
  }

  function applyStatus(row, st, day) {
    const t = now()
    if (st.state === 'done') {
      q.setStatus.run('published', null, null, t, t, row.id)
      log.log(`TikTok: ${day} dərc olundu (${cfg.mode === 'direct' ? cfg.privacy : 'inbox'})`)
      return true
    }
    if (st.state === 'sent') {
      q.setStatus.run('sent', null, null, t, t, row.id)
      log.log(`TikTok: ${day} videosu TikTok-un Gələnlər qutusuna göndərildi — tətbiqdə mətni yapışdırıb dərc edin`)
      return true
    }
    if (st.state === 'failed') {
      const kind = classify(st.reason, 200)
      if (kind === 'auth') blockAuth('status', st.reason)
      return recordFailure(row, new TikTokError(kind, st.reason, 200), day)
    }
    q.setStatus.run('processing', null, null, t, t, row.id)
    return true
  }

  async function runPost(row, day, slot = 'ayah') {
    try {
      const info = mediaInfo(day, slot)
      if (!info) throw failure('fatal', 'reel_file_missing')
      const { caption, item } = await captionFor(day, info)
      q.setItem.run(item, caption, row.id)
      const { publishId, upload } = await initUpload(day, info, caption)
      q.started.run(publishId, item, caption, now(), row.id)
      await upload()
      q.touch.run(now(), row.id)
      const st = await pollStatus(publishId)
      return applyStatus(row, st, day)
    } catch (e) {
      return recordFailure(q.get.get(day, slot) || row, e, `${day} ${slot}`)
    }
  }

  /**
   * Sətri "tut": yeni — INSERT; retry vaxtı çatıb və ya yarımçıq qalıb — atom UPDATE. Ayə yuvası: köhnə tiktok_posts-da
   * həmin günün sətri varsa (köhnə versiya göndərib) — tutulmur.
   */
  function claimRow(day, slot = 'ayah') {
    const t = now()
    if (slot === 'ayah' && q.legacy.get(day)) return null
    if (q.claim.run(day, slot, slotKind(slot, day), cfg.mode, t, t).changes === 1) return q.get.get(day, slot)
    const row = q.get.get(day, slot)
    if (!row || !['retry', 'claimed'].includes(row.status)) return null
    if (q.retake.run(cfg.mode, t, row.id, t, t - STALE_CLAIM_MS, MAX_ATTEMPTS).changes === 1) return q.get.get(day, slot)
    return null
  }
  /** Inbox rejimində son 24 saatda gözləyən paylaşımlar (TikTok: ≤ 5). */
  function pendingCount() {
    const since = now() - PENDING_WINDOW_MS
    let n = q.pending.get(since).n
    try { n += q.pendingLegacy.get(since).n } catch { /* */ }
    return n
  }
  const pendingFull = () => cfg.mode === 'inbox' && pendingCount() >= PENDING_MAX

  const connected = () => Boolean(tokenRecord())
  const ready = () => cfg.enabled && connected() && !authBlocked()

  let busy = false
  async function tick() {
    if (!cfg.enabled || busy) return 0
    if (!connected() || authBlocked()) return 0
    busy = true
    try {
      await followTick()
      const t = nowAt(TZ, now())
      const cur = toMin(t.hhmm)
      let n = 0
      for (const { key: slot, time } of cfg.slots) {
        if (!time || authBlocked()) continue
        const sm = toMin(time)
        if (cur < sm || cur > sm + CATCHUP_MIN) continue
        const done = q.get.get(t.dateKey, slot)
        if (done && !['retry', 'claimed'].includes(done.status)) continue
        if (!mediaInfo(t.dateKey, slot)) {
          // Fayl yoxdur (CI işləməyib?) — gündə / yuvada bir dəfə loglanır (iki proses arasında da)
          const mk = slot === 'ayah' ? `missing:${t.dateKey}` : `missing:${t.dateKey}:${slot}`
          if (q.stClaim.run(mk, '1', now()).changes === 1) log.warn(`TikTok: ${t.dateKey} ${slot} reel faylı yoxdur və ya yararsızdır — atlandı (.github/workflows/ig-reel.yml)`)
          continue
        }
        // TikTok inbox limiti: 24 saatda ≤ 5 gözləyən paylaşım — dolubsa bu yuva atlanır (sətir tutulmur, bir dəfə loglanır)
        if (!done && pendingFull()) {
          if (q.stClaim.run(`pending:${t.dateKey}:${slot}`, '1', now()).changes === 1) log.warn(`TikTok: ${t.dateKey} ${slot} — Gələnlər qutusunda ${PENDING_MAX} gözləyən video var (TikTok limiti), yuva atlandı; qaralamaları tətbiqdə dərc edin`)
          continue
        }
        const row = claimRow(t.dateKey, slot)
        if (row && await runPost(row, t.dateKey, slot)) n++
      }
      return n
    } catch (e) {
      log.error('TikTok tick:', e && (e.code || e.message))
      return 0
    } finally { busy = false }
  }

  /** Emalı bitməmiş / inbox-a göndərilmiş sətirlərin statusu (30 dəqdən bir, 3 gün). */
  async function followTick() {
    const t = now()
    for (const row of q.follow.all(t - FOLLOW_MS, t - FOLLOW_EVERY_MS)) {
      if (authBlocked()) return
      try {
        const st = await fetchStatus(row.publish_id)
        if (st.state === 'processing' || (st.state === 'sent' && row.status === 'sent')) q.setStatus.run(row.status, null, null, now(), now(), row.id)
        // Sonradan gələn FAILED (məs. inbox qaralaması) — təkrar YOX (ikinci qaralama göndərilməsin)
        else if (st.state === 'failed') q.setStatus.run('failed', st.reason, null, now(), now(), row.id)
        else applyStatus(row, st, row.day)
      } catch (e) {
        if (e && e.kind === 'auth') return
        q.setStatus.run(row.status, row.error, null, now(), now(), row.id)
      }
    }
  }

  /** Əl ilə (admin): yuvanın bu günkü videosunu indi göndər — gündə / yuvada bir dəfə (eyni sətir). */
  async function postNow(slot = 'ayah') {
    if (!SLOT_KEYS.includes(slot)) return { error: 'bad_slot' }
    if (!cfg.enabled) return { error: 'disabled' }
    if (!connected()) return { error: 'not_connected' }
    if (authBlocked()) return { error: 'auth_error' }
    const day = nowAt(TZ, now()).dateKey
    if (!mediaInfo(day, slot)) return { error: 'reel_missing' }
    if (!q.get.get(day, slot) && pendingFull()) return { error: 'pending_limit' }
    const row = claimRow(day, slot)
    if (!row) return { error: 'already' }
    return { ok: await runPost(row, day, slot) }
  }

  /** Saatda bir: gündə bir dəfə token yeniləməsi (refresh zənciri təzə qalsın) + köhnə sətirlər. */
  async function refreshTick() {
    if (!cfg.enabled || authBlocked()) return false
    const rec = tokenRecord()
    if (!rec || now() - rec.at < KEEPALIVE_MS) return false
    try { await refresh(true); return true } catch (e) {
      if (!(e && e.kind === 'auth')) log.warn('TikTok: token yenilənmədi —', e && (e.code || e.kind))
      return false
    }
  }
  function purge(t = now()) {
    let n = 0
    try { n += q.purge.run(t - ROW_TTL_MS).changes + q.purgeLegacy.run(t - ROW_TTL_MS).changes } catch (e) { log.error('TikTok purge:', e && e.message) }
    try { n += q.stPurge.run(t - 3 * 864e5).changes } catch { /* */ }
    return n
  }

  // ── OAuth ──
  function connectUrl(adminId) {
    const nonce = crypto.randomBytes(16).toString('base64url')
    const exp = now() + STATE_TTL_MS
    const id = String(adminId).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || '0'
    q.stSet.run(`oauth:${crypto.createHash('sha256').update(nonce).digest('base64url')}`, id, now())
    const u = new URL(AUTHORIZE_URL)
    u.searchParams.set('client_key', cfg.clientKey)
    u.searchParams.set('scope', cfg.scopes.join(','))
    u.searchParams.set('response_type', 'code')
    u.searchParams.set('redirect_uri', cfg.redirectUri)
    u.searchParams.set('state', signState(cfg.clientSecret, nonce, exp, id))
    u.searchParams.set('disable_auto_auth', '1')
    return { url: u.toString(), nonce }
  }
  /** Callback yoxlaması + kod mübadiləsi → 'connected' | xəta kodu. */
  async function handleCallback({ code, state, error, cookieNonce }) {
    const st = verifyState(cfg.clientSecret, state, now())
    if (!st) return 'bad_state'
    // Bir dəfəlik: imzası düzgün state-in nonce-u İLK cəhddə bazadan silinir (kuki uyğun gəlməsə də) — təkrar → bad_state
    const k = `oauth:${crypto.createHash('sha256').update(st.nonce).digest('base64url')}`
    const row = q.stGet.get(k)
    q.stDel.run(k)
    if (!row || row.v !== st.adminId || now() - row.at > STATE_TTL_MS) return 'bad_state'
    // Brauzerə bağlılıq (login CSRF): connect-də qoyulan SameSite=Lax kuki eyni nonce-u daşımalıdır
    if (!sameStr(cookieNonce, st.nonce)) return 'bad_state'
    if (error) return 'denied'
    if (typeof code !== 'string' || !CODE_RE.test(code)) return 'bad_request'
    let j
    try {
      j = await oauth('/v2/oauth/token/', { code, grant_type: 'authorization_code', redirect_uri: cfg.redirectUri })
    } catch (e) {
      log.warn('TikTok: kod mübadiləsi alınmadı —', e && (e.code || e.kind))
      return 'exchange_failed'
    }
    const rec = saveToken(j, now())
    if (!rec) return 'exchange_failed'
    q.stDel.run('auth_error')
    authLogged = false
    log.log(`TikTok: hesab qoşuldu (scope: ${rec.scope || '-'})`)
    // Hesabın görünən adı (yalnız admin panelində göstərmək üçün) — alınmasa da qoşulma uğurludur
    try {
      const d = await getJson('/v2/user/info/?fields=open_id,display_name', rec.a)
      const u = d && d.user
      if (u && typeof u.display_name === 'string') q.stSet.run('account', JSON.stringify({ name: u.display_name.slice(0, 80), username: null }), now())
    } catch { /* */ }
    return scopeOk(rec) ? 'connected' : 'scope_missing'
  }
  async function disconnect() {
    const rec = tokenRecord()
    if (rec) { try { await oauth('/v2/oauth/revoke/', { token: rec.a }) } catch { /* yerli silmə yenə də */ } }
    q.stDel.run('token'); q.stDel.run('account'); q.stDel.run('auth_error'); q.stDel.run('refresh_lock')
    log.log('TikTok: hesab ayrıldı')
    return true
  }

  // ── Status (admin; token yoxdur) ──
  function status() {
    const rec = cfg.enabled ? tokenRecord() : null
    const day = nowAt(TZ, now()).dateKey
    const info = cfg.enabled ? reelInfo(day) : null
    const row = q.get.get(day, 'ayah') || q.legacy.get(day)
    const postOf = (r) => (r ? { status: r.status, error: r.error ? String(r.error).slice(0, 120) : null, attempts: r.attempts, caption: r.caption || null } : null)
    const slots = cfg.slots.map(({ key, time }) => {
      const mi = cfg.enabled ? mediaInfo(day, key) : null
      const r = key === 'ayah' ? row : q.get.get(day, key)
      return {
        key, time, kind: (mi && mi.kind) || slotKind(key, day),
        file: mi ? { size: mi.size, durationMs: mi.durationMs, audio: mi.audio, ref: mi.ref || null, item: mi.item ? `${mi.kind}:${mi.item}` : null } : null,
        post: postOf(r),
      }
    })
    const ae = q.stGet.get('auth_error')
    let account = null
    try { const a = q.stGet.get('account'); account = a ? JSON.parse(a.v) : null } catch { /* */ }
    const t = now()
    return {
      enabled: cfg.enabled, reason: cfg.reason, configured: cfg.configured, mode: cfg.mode, privacy: cfg.mode === 'direct' ? cfg.privacy : null,
      source: cfg.source, time: cfg.time, timezone: TZ, slots, pending: cfg.mode === 'inbox' ? { count: pendingCount(), max: PENDING_MAX } : null, scopes: cfg.scopes, redirectUri: cfg.enabled ? cfg.redirectUri : null,
      mediaPrefix: cfg.enabled && cfg.source === 'url' ? `${origin}/api/tiktok/media/` : null,
      connected: Boolean(rec), account: rec ? account : null,
      authError: ae ? (() => { try { return JSON.parse(ae.v).code || 'auth_error' } catch { return 'auth_error' } })() : null,
      token: rec ? {
        connectedScope: rec.scope || null, scopeOk: scopeOk(rec), refreshedAt: rec.at, accessExpiresAt: rec.aExp, refreshExpiresAt: rec.rExp,
        refreshSoon: Boolean(rec.rExp && rec.rExp - t < 14 * 864e5),
      } : null,
      today: {
        date: day,
        file: info ? { size: info.size, ref: info.ref, audio: info.audio, durationMs: info.durationMs } : null,
        post: postOf(row),
      },
      posts: q.recent.all(21).map((r, i) => ({ ...r, caption: i < 3 ? r.caption : null, error: r.error ? String(r.error).slice(0, 120) : null })),
    }
  }

  // ── HTTP ──
  const notFound = (res) => res.status(404).set('Cache-Control', 'no-store').json({ error: 'Not found' })
  const router = express.Router()
  router.get('/tiktok/callback', async (req, res) => {
    res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' })
    if (!cfg.enabled) return notFound(res)
    const qy = req.query || {}
    const str = (v, max) => (typeof v === 'string' && v.length <= max ? v : '')
    const cookieNonce = parseCookies(req.headers.cookie)[COOKIE] || ''
    let result
    try {
      result = await handleCallback({ code: str(qy.code, 2048), state: str(qy.state, 200), error: str(qy.error, 100), cookieNonce })
    } catch (e) {
      log.error('TikTok callback:', e && (e.code || e.message))
      result = 'error'
    }
    res.append('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`)
    return res.redirect(303, `${adminPath}?tiktok=${encodeURIComponent(result)}`)
  })
  // PULL_FROM_URL (TIKTOK_SOURCE=url): TikTok videonu buradan çəkir — yalnız sərt ad regex-i, qovluq keçidi yoxdur
  router.get('/tiktok/media/:name', (req, res) => {
    if (!cfg.enabled || cfg.source !== 'url') return notFound(res)
    const name = String(req.params.name || '')
    const m = REEL.VIDEO_MP4_RE.exec(name)
    if (!m || !(m[2] ? textInfo(m[1], m[2]) : reelInfo(m[1]))) return notFound(res)
    return res.sendFile(name, {
      root: cardDir, dotfiles: 'deny', acceptRanges: true, cacheControl: false, etag: true, lastModified: true,
      headers: { 'Content-Type': 'video/mp4', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff' },
    }, (e) => { if (e && !res.headersSent) notFound(res) })
  })

  /** Admin marşrutları: requireAdmin + rol (server.js ötürür). */
  function adminRouter({ requireAdmin, adminRoleOf }) {
    const r = express.Router()
    const json = express.json({ limit: '1kb' })
    const err = (res, st, code) => res.status(st).json({ error: 'Request failed', code })
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
      if (buckets.size > 200) buckets.clear()
      if (!b || t - b.start >= 3600e3) { buckets.set(k, { start: t, n: 1 }); return true }
      if (b.n >= max) return false
      b.n++
      return true
    }
    const bodyOf = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {})

    r.get('/admin/tiktok', requireAdmin, adminOnly, (req, res) => res.json(status()))

    // Bir dəfəlik qoşulma: brauzer naviqasiyası (admin kukisi SameSite=Strict — başqa saytdan keçiddə gəlmir; üstəlik
    // Sec-Fetch-Site: cross-site rədd edilir) → TikTok-un razılıq səhifəsinə 302
    const live = (req, res, next) => (cfg.enabled ? next() : notFound(res))     // sönülüdürsə — 404 (admin yoxlamasından əvvəl)
    r.get('/tiktok/connect', live, requireAdmin, adminOnly, superOnly, (req, res) => {
      const sfs = String(req.headers['sec-fetch-site'] || '')
      if (sfs === 'cross-site') return err(res, 403, 'cross_site')
      if (!allow(`c:${req.adminUser.id}`, 10)) return err(res, 429, 'rate_limited')
      const { url, nonce } = connectUrl(req.adminUser.id)
      res.append('Set-Cookie', `${COOKIE}=${nonce}; Path=/; Max-Age=${Math.floor(STATE_TTL_MS / 1000)}; HttpOnly; Secure; SameSite=Lax`)
      res.set('Referrer-Policy', 'no-referrer')
      return res.redirect(302, url)
    })

    r.post('/admin/tiktok/post', requireAdmin, adminOnly, superOnly, json, (req, res) => {
      const b = bodyOf(req)
      if (b.confirm !== true) return err(res, 400, 'confirm_required')
      // slot — istəyə bağlı (köhnə klient göndərmir → ayə yuvası)
      const slot = b.slot == null ? 'ayah' : (typeof b.slot === 'string' && SLOT_KEYS.includes(b.slot) ? b.slot : null)
      if (!slot) return err(res, 400, 'bad_slot')
      if (!cfg.enabled) return err(res, 409, 'disabled')
      if (!connected()) return err(res, 409, 'not_connected')
      if (authBlocked()) return err(res, 409, 'auth_error')
      const day = nowAt(TZ, now()).dateKey
      if (!mediaInfo(day, slot)) return err(res, 409, 'reel_missing')
      if (!q.get.get(day, slot) && pendingFull()) return err(res, 409, 'pending_limit')
      if (!allow(`p:${req.adminUser.id}`, 6)) return err(res, 429, 'rate_limited')
      // Yükləmə + emal dəqiqələrlə çəkə bilər — arxa planda; nəticə statusda görünür
      postNow(slot).catch((e) => log.error('TikTok post-now:', e && (e.code || e.message)))
      return res.status(202).json({ ok: true })
    })

    r.post('/admin/tiktok/disconnect', requireAdmin, adminOnly, superOnly, json, async (req, res) => {
      if (bodyOf(req).confirm !== true) return err(res, 400, 'confirm_required')
      if (!cfg.enabled) return err(res, 409, 'disabled')
      if (!allow(`d:${req.adminUser.id}`, 6)) return err(res, 429, 'rate_limited')
      await disconnect()
      return res.json({ ok: true })
    })
    return r
  }

  return {
    enabled: cfg.enabled, config: cfg, router, adminRouter, tick, followTick, refreshTick, purge, postNow, status, reelInfo, mediaInfo, textInfo, captionFor, pendingCount,
    connectUrl, handleCallback, disconnect, ready, cardDir, _q: q, _refresh: refresh, _tokenRecord: tokenRecord,
  }
}

module.exports = {
  createTikTok, parseConfig, parseTimes, SLOT_KEYS, DEFAULT_TIMES, PENDING_MAX, chunkPlan, classify, seal, unseal, signState, verifyState, SCOPES, PRIVACY, MODES, COOKIE, DEFAULT_TIME,
}
