// ═══════════════════════════════════════════════════════════════════════
// İctimai / paylaşılan mətn üçün ortaq təmizləmə (K mərhələsi: açıq profil, ailə dua siyahısı,
// dua divarı, məscid nümayəndəsinin elanları). Asılılıqsız, saf funksiyalar.
//
//   cleanLine(v, max)  — tək sətir: NFC, idarə/bidi simvolları atılır, boşluqlar sıxılır
//   cleanText(v, max)  — çoxsətirli: sətir sonları qalır (≤ 3 ardıcıl)
//   hasLink(s)         — URL, "www.", domen (example.com), t.me/…, e-poçt
//   hasPhone(s)        — telefon nömrəsinə oxşayan ≥ 8 rəqəm
//   stripLinks(s)      — keçid olan "söz"ləri silir (qalan mətn qalır)
//   bannedHit(s, list) — qadağan söz siyahısı (söz üzrə; çoxsözlü ifadə — alt sətir kimi)
//   foldConfusables(s) — 。．｡ → ".", tam enli → ASCII, Latın görünüşlü kiril → Latın (hasLink/bannedHit işlədir)
//   requireVerified    — middleware (requireUser-dən SONRA): təsdiqsiz e-poçt → 403 { code:'verify_email' }
//   createRequireEditor({ requireAdmin, adminRoleOf }) — admin PANELİ sessiyası + rol ≥ editor
//                      (moderasiya admin panelinin işidir: server/auth.js → admin_roles)
//   createOptionalUser({ usersStore }) — req → girişli istifadəçi | null (cookie varsa; 401 vermir)
// React çıxışı özü escape edir; e-poçtda server/mailer.js esc() edir — burada HTML YOXDUR.
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const CTRL_RE = /[\p{Cc}‪-‮⁦-⁩﻿]/gu
const TLD = 'com|net|org|info|io|ru|az|tr|me|ly|co|app|xyz|site|online|link|biz|shop|top|cc|tk|gg|to|us|uk|de|fr|uz|kz|pk|in|id|my|ir|sa|ae|eg|ma|dz|pro|club|live|store|vip|ws|ga|ml|cf|gq|su|ua|by|am|ge|edu|gov|tv|fm|ai|dev|page|blog|news|one|world|space|website|click|today|icu|cn'
const LINK_RE = new RegExp(
  '(?:[a-z][a-z0-9+.-]*:\\/\\/|\\bwww\\.|\\b(?:t\\.me|wa\\.me|bit\\.ly|goo\\.gl)\\/|' +
  // "example .com" (nöqtədən ƏVVƏL boşluq) — "help me. In sha Allah" isə keçid deyil
  '\\b[a-z0-9-]{1,63}(?:\\.[a-z0-9-]{1,63})*(?:[ \\t]+\\.|\\.|\\s?\\[\\.\\]\\s?|\\s?\\(\\.\\)\\s?| dot )(?:' + TLD + ')\\b|' +
  '[^\\s@]+@[^\\s@]+\\.[a-z]{2,})', 'i')
const PHONE_RE = /\+?\d(?:[\s().-]?\d){7,}/

function cleanLine(v, max, { required = false } = {}) {
  if (v == null) return required ? null : ''
  if (typeof v !== 'string') return null
  const s = v.normalize('NFC').replace(CTRL_RE, '').replace(/\s+/g, ' ').trim()
  if (required && !s) return null
  return [...s].length <= max ? s : null
}

function cleanText(v, max, { required = false } = {}) {
  if (v == null) return required ? null : ''
  if (typeof v !== 'string') return null
  const s = v.normalize('NFC').replace(/\r\n?/g, '\n')
    .replace(/[\p{Cc}‪-‮⁦-⁩﻿]/gu, (c) => (c === '\n' ? c : c === '\t' ? ' ' : ''))
    .replace(/[ ]{2,}/g, ' ').replace(/\n{4,}/g, '\n\n\n').trim()
  if (required && !s) return null
  return [...s].length <= max ? s : null
}

// Latın hərfinə oxşayan kiril hərfləri (kiçik və böyük) → Latın
const CYR_LATIN = {
  'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x', 'у': 'y', 'і': 'i', 'ј': 'j', 'ѕ': 's',
  'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X', 'У': 'Y', 'І': 'I', 'Ј': 'J', 'Ѕ': 'S',
}
const CYR_RE = /\p{Script=Cyrillic}/u
/**
 * Keçid / qadağan söz yoxlaması üçün 1:1 (uzunluğu saxlayan) çevirmə: 。．｡ → ".", tam enli ASCII → ASCII;
 * kiril oxşarlar → Latın, AMMA yalnız bütün kiril hərfləri oxşar olan sözdə ("cаsino", "ехаmрlе") —
 * adi kiril mətni ("Привет. Как дела?") toxunulmur.
 */
function foldConfusables(s) {
  const str = String(s || '').replace(/[。．｡]/g, '.')
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
  if (!CYR_RE.test(str)) return str
  return str.replace(/[\p{L}\p{M}\p{N}]+/gu, (w) => {
    if (!CYR_RE.test(w)) return w
    for (const c of w) if (CYR_RE.test(c) && !CYR_LATIN[c]) return w
    return w.replace(/./gu, (c) => CYR_LATIN[c] || c)
  })
}

const hasLink = (s) => LINK_RE.test(foldConfusables(s))
const hasPhone = (s) => PHONE_RE.test(String(s || ''))

/** Keçid olan sözləri sil; boşluqlar sıxılır, sətir sonları qalır. */
function stripLinks(s) {
  const str = String(s || '')
  if (!hasLink(str)) return str
  const kept = str.split(/(\s+)/).map((tok) => (/\s/.test(tok) || !hasLink(tok) ? tok : '')).join('')
  // "example [.] com", "example .com", "example dot com" — bir neçə sözə bölünür, bütöv sətirdə də yoxla.
  // foldConfusables uzunluğu saxlayır — tapılan aralıqlar orijinal mətndən kəsilir.
  const folded = foldConfusables(kept)
  const re = new RegExp(LINK_RE.source, 'gi')
  let out = '', last = 0, m
  while ((m = re.exec(folded))) {
    out += kept.slice(last, m.index)
    last = m.index + m[0].length
    if (!m[0].length) re.lastIndex++
  }
  out += kept.slice(last)
  return out.replace(/[ \t]{2,}/g, ' ').replace(/ *\n */g, '\n').trim()
}

const normWord = (s) => foldConfusables(String(s || '').normalize('NFKC')).toLowerCase()
/** Mətn qadağan sözdən birini ehtiva edirmi? list — kiçik hərfli sözlər / ifadələr */
function bannedHit(text, list) {
  if (!list || !list.length) return false
  const t = normWord(text)
  const words = new Set(t.split(/[^\p{L}\p{N}]+/u).filter(Boolean))
  const flat = ' ' + t.replace(/[^\p{L}\p{N}]+/gu, ' ') + ' '
  for (const raw of list) {
    const w = normWord(raw).trim()
    if (!w) continue
    if (/\s/.test(w)) { if (flat.includes(' ' + w.replace(/\s+/g, ' ') + ' ')) return true }
    else if (words.has(w)) return true
  }
  return false
}

const PANEL_RANK = { editor: 1, admin: 2, superadmin: 3 }
/**
 * Admin paneli (server/auth.js) sessiyası + panel rolu ≥ editor. Yalnız sessiya cookie-si ilə işləyir
 * (users.js-dəki istifadəçi idarəsi kimi). req.adminRole qoyulur.
 */
function createRequireEditor({ requireAdmin, adminRoleOf }) {
  const gate = (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    if (!req.adminUser || req.adminUser.via !== 'session') return res.status(403).json({ error: 'Session required', code: 'session_required' })
    const role = adminRoleOf ? adminRoleOf(req.adminUser.id) : 'admin'
    if (!PANEL_RANK[role]) return res.status(403).json({ error: 'Forbidden', code: 'forbidden' })
    req.adminRole = role
    next()
  }
  return [requireAdmin, gate]
}

/** Cookie varsa sessiyanın istifadəçisi (bloklanmamış), yoxdursa null. Sessiyanı yeniləmir (Set-Cookie yox). */
function createOptionalUser({ usersStore, cookieName = '__Host-mcc_user', now = () => Date.now() }) {
  const { parseCookies } = require('./auth')
  return (req) => {
    try {
      const token = parseCookies(req.headers.cookie)[cookieName]
      const s = token && usersStore ? usersStore.sessionUser(token, now()) : null
      return s && s.user && !s.user.disabled ? s.user : null
    } catch { return null }
  }
}

/**
 * requireUser()-dən SONRA: e-poçtu təsdiqlənməmiş hesab ictimai / paylaşılan məzmun yarada bilməz
 * (dua divarı, şikayət, açıq profil, ümmət xətmi). Google ilə açılan hesablar artıq təsdiqlidir.
 * Klient müqaviləsi: 403 { code: 'verify_email' } → "E-poçtunuzu təsdiqləyin" + yenidən göndər.
 */
const isVerified = (user) => Boolean(user && user.email_verified === 1)
function requireVerified(req, res, next) {
  if (!isVerified(req.user)) return res.status(403).json({ error: 'Email not verified', code: 'verify_email' })
  next()
}

module.exports = {
  cleanLine, cleanText, hasLink, hasPhone, stripLinks, bannedHit, foldConfusables, LINK_RE, createRequireEditor, createOptionalUser,
  requireVerified, isVerified,
}
