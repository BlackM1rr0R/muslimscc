// ═══════════════════════════════════════════════════════
// Heyz və nifas təqvimi (/private-calendar) — yalnız bu cihazda, profilə aid, gizli, noindex.
// Hesabın E2E şifrəli sinxronizasiyası və ehtiyat nüsxə onu özü daşıyır (utils/userBackup).
//   haid_log_v1  { v: 1, l: [{ id, k, s, e?, no?, q?, u }], p?: { n, t } }
//     k  — 'hayd' (heyz) | 'nifas'
//     s  — başlanğıc günü; e — son günü (yoxdursa — davam edir)
//     q  — bu dövrdən qəza izləyicisinə (utils/qada) əlavə olunmuş oruc sayı (təkrar əlavə olunmasın)
//     u  — son dəyişiklik anı (ms); p.n — neytral başlıq (başqası ekranı görəndə), p.t — dəyişmə anı
// HÖKM VERİLMİR: istihazə, ən az / ən çox müddət məzhəbə görə fərqlidir — burada yalnız istifadəçinin
// öz yazdığı uzunluqlar göstərilir. Ramazan günləri Ümmül-Qura təqvimi ilə (utils/hijri) TƏXMİNİ
// sayılır — istifadəçi qəzaya əlavə etməzdən əvvəl sayı özü düzəldir.
// Ramazan hesabı ayrıca faylda (utils/haidRamadan — hicri təqvimi sinxronizasiya paketinə düşməsin).
// Bildiriş YOXDUR. Birləşdirici: utils/syncMergers → MERGERS[HAID_KEY]. tests/unit/haid-log.test.js
// ═══════════════════════════════════════════════════════
import { cleanText as _clean } from './mosqueVisits'
import { validDay, isObj, safeStorage, parse, localDay } from './journeyStore'

export const HAID_KEY = 'haid_log_v1'
export const HAID_EVENT = 'mcc-haid'
export const HAID_KINDS = ['hayd', 'nifas']
export const NOTE_MAX = 200
export const HAID_MAX = 400
// Texniki hədd (fiqh deyil): yanlış yazılmış ili tutmaq üçün
export const SPAN_MAX_DAYS = 366
const ID_RE = /^h[a-z0-9]{4,23}$/

export { localDay, safeStorage }
const cleanText = (s, max) => [..._clean(s, 10 * max)].slice(0, max).join('').trim()
const emit = () => { try { globalThis.dispatchEvent?.(new CustomEvent(HAID_EVENT)) } catch { /* */ } }
const dayNum = (d) => { const [y, m, dd] = d.split('-').map(Number); return Date.UTC(y, m - 1, dd) / 86400000 }

/** Bir qeyd → təmiz forma və ya null */
export function sanitizeHaidEntry(x) {
  if (!isObj(x) || typeof x.id !== 'string' || !ID_RE.test(x.id)) return null
  if (!HAID_KINDS.includes(x.k) || !validDay(x.s)) return null
  const out = { id: x.id, k: x.k, s: x.s }
  if (validDay(x.e)) {
    const span = dayNum(x.e) - dayNum(x.s)
    if (span < 0 || span >= SPAN_MAX_DAYS) return null
    out.e = x.e
  }
  const no = cleanText(x.no, NOTE_MAX)
  if (no) out.no = no
  if (Number.isInteger(x.q) && x.q > 0 && x.q <= 60) out.q = x.q
  const u = Number(x.u)
  out.u = Number.isFinite(u) && u > 0 ? Math.round(u) : 0
  return out
}

function sanitizePrefs(p) {
  if (!isObj(p)) return null
  const t = Number(p.t)
  return { n: p.n === true, t: Number.isFinite(t) && t > 0 ? Math.round(t) : 0 }
}

/** Bütün dəyər → { v: 1, l, p? } (təkrarsız, başlanğıca görə, ən çox HAID_MAX) */
export function sanitizeHaid(raw) {
  const list = Array.isArray(raw?.l) ? raw.l : []
  const seen = new Set(), l = []
  for (const x of list) { const e = sanitizeHaidEntry(x); if (e && !seen.has(e.id)) { seen.add(e.id); l.push(e) } }
  l.sort((a, b) => (a.s < b.s ? -1 : a.s > b.s ? 1 : a.u - b.u))
  const out = { v: 1, l: l.slice(-HAID_MAX) }
  const p = sanitizePrefs(raw?.p)
  if (p && (p.n || p.t)) out.p = p
  return out
}

export const readHaid = (storage = safeStorage()) => sanitizeHaid(parse(storage, HAID_KEY, null))
const isEmpty = (v) => !v.l.length && !v.p?.n

function writeHaid(data, storage) {
  const v = sanitizeHaid(data)
  try { if (isEmpty(v)) storage?.removeItem(HAID_KEY); else storage?.setItem(HAID_KEY, JSON.stringify(v)) } catch { /* yaddaş bağlıdır */ }
  emit()
  return v
}

export const newHaidId = (now = Date.now(), rnd = Math.random) => `h${now.toString(36)}${Math.floor(rnd() * 1e6).toString(36)}`.slice(0, 24)

/** Əlavə et və ya (id varsa) yenilə → { ok, data, item?, code? }; son gün bu gündən sonra ola bilməz */
export function saveHaidEntry(entry, storage = safeStorage(), now = Date.now(), today = localDay()) {
  const cur = readHaid(storage)
  if (!validDay(entry?.s) || entry.s > today) return { ok: false, data: cur, code: 'start' }
  if (entry.e && (!validDay(entry.e) || entry.e < entry.s || entry.e > today)) return { ok: false, data: cur, code: 'end' }
  const old = entry?.id ? cur.l.find((x) => x.id === entry.id) : null
  const item = sanitizeHaidEntry({ ...(old ? { q: old.q } : {}), ...entry, id: entry?.id || newHaidId(now), u: now })
  if (!item) return { ok: false, data: cur, code: 'end' }
  return { ok: true, data: writeHaid({ ...cur, l: [...cur.l.filter((x) => x.id !== item.id), item] }, storage), item }
}

export function removeHaidEntry(id, storage = safeStorage()) {
  const cur = readHaid(storage)
  return writeHaid({ ...cur, l: cur.l.filter((x) => x.id !== id) }, storage)
}

/** Qəza izləyicisinə əlavə olunan oruc sayını qeyd et */
export function markAdded(id, n, storage = safeStorage(), now = Date.now()) {
  const cur = readHaid(storage)
  return writeHaid({ ...cur, l: cur.l.map((x) => (x.id === id ? { ...x, q: (x.q || 0) + n, u: now } : x)) }, storage)
}

export function setNeutral(on, storage = safeStorage(), now = Date.now()) {
  const cur = readHaid(storage)
  return writeHaid({ ...cur, p: { n: on === true, t: now } }, storage)
}

/** Dövrün uzunluğu (günlərlə, hər iki gün daxil); davam edirsə — bu günə qədər */
export function spanDays(e, today = localDay()) {
  const end = e?.e || (validDay(today) && today >= e?.s ? today : e?.s)
  if (!validDay(e?.s) || !validDay(end)) return 0
  return dayNum(end) - dayNum(e.s) + 1
}

/** Öz yazılmış uzunluqlar: növ üzrə son N bitmiş dövr (hökm deyil — yalnız müşahidə) */
export function lengthsByKind(data, k, n = 6) {
  return (data?.l || []).filter((e) => e.k === k && e.e).slice(-n).map((e) => ({ id: e.id, s: e.s, days: spanDays(e) }))
}

// ── Sinxronizasiya (saf): qeyd üzrə 3 tərəfli; eyni qeyd iki cihazda dəyişibsə — təzəsi (u) ──
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const byId = (list) => Object.fromEntries((list || []).map((x) => [x.id, x]))
export function mergeHaid(L, R, B) {
  const l = sanitizeHaid(L), r = sanitizeHaid(R), b = B === undefined ? { l: [] } : sanitizeHaid(B)
  const Lm = byId(l.l), Rm = byId(r.l), Bm = byId(b.l)
  const m = {}
  for (const k of new Set([...Object.keys(Lm), ...Object.keys(Rm), ...Object.keys(Bm)])) {
    const x = Lm[k], y = Rm[k], z = Bm[k]
    let v
    if (same(x, y)) v = x
    else if (same(x, z)) v = y
    else if (same(y, z)) v = x
    else if (x === undefined || y === undefined) v = x === undefined ? y : x
    else v = (Number(y.u) || 0) > (Number(x.u) || 0) ? y : x
    if (v !== undefined) m[k] = v
  }
  const lp = l.p, rp = r.p
  const p = !lp ? rp : !rp ? lp : ((rp.t || 0) > (lp.t || 0) ? rp : lp)
  const out = sanitizeHaid({ l: Object.values(m), ...(p ? { p } : {}) })
  return isEmpty(out) ? undefined : out
}
