// ═══════════════════════════════════════════════════════
// Borc dəftəri (/debt-ledger) — yalnız bu cihazda, profilə aid, gizli (əl-Bəqərə 2:282 — borcu yazmaq).
// Hesabın E2E şifrəli sinxronizasiyası və ehtiyat nüsxə onu özü daşıyır (utils/userBackup).
//   debt_ledger_v1  { v: 1, l: [{ id, k, p, a, cu, d, du?, w?, no?, r, s?, sd?, rm?, lid?, u }] }
//     k  — 'owe' (mən borcluyam) | 'owed' (mənə borcludurlar)
//     p  — şəxs; a — məbləğ (> 0, 2 onluq); cu — valyuta (ISO 4217, 3 böyük hərf)
//     d  — borc günü; du — qaytarılma günü (istəyə bağlı)
//     w  — şahidlərin adları (ən çox WITNESS_MAX); no — qeyd
//     r  — qismən qaytarmalar [{ id, d, a }]; s — "bağlandı" (sd — həmin gün)
//     rm — qaytarılma günü xatırlatsın (yerli: bildiriş icazəsi VARSA, yoxdursa səhifədə)
//     lid — istifadəçinin razılığı ilə serverdə yaradılmış "gələcəyə məktub"un id-si (api/personal) —
//           orada yalnız gün və ümumi mətn saxlanır (ad, məbləğ YOX)
//     u  — son dəyişiklik anı (ms) — sinxronda eyni qeyd iki cihazda dəyişibsə təzəsi qalır,
//          qaytarmalar isə id üzrə 3 tərəfli birləşir (heç biri itmir)
// Başqaları ilə müqayisə, reytinq YOXDUR — yalnız öz siyahınız və öz açıq qalıqlarınız.
// Birləşdirici: utils/syncMergers → MERGERS[DEBT_KEY]. tests/unit/debt-ledger.test.js
// ═══════════════════════════════════════════════════════
import { cleanText as _clean } from './mosqueVisits'
import { validDay, isObj, safeStorage, parse, localDay } from './journeyStore'

export const DEBT_KEY = 'debt_ledger_v1'
export const DEBT_EVENT = 'mcc-debts'
export const DEBT_KINDS = ['owe', 'owed']
export const PERSON_MAX = 60
export const NOTE_MAX = 300
export const WITNESS_MAX = 4
export const DEBT_MAX = 300
export const REPAY_MAX = 100
export const AMOUNT_MAX = 1e12
// Seçim siyahısı (istifadəçi başqa 3 hərfli kod da yaza bilər)
export const CURRENCIES = ['AZN', 'USD', 'EUR', 'TRY', 'RUB', 'GBP', 'SAR', 'AED', 'KZT', 'UZS', 'EGP', 'PKR', 'INR', 'IDR', 'MYR']
export const SOON_DAYS = 3

const ID_RE = /^d[a-z0-9]{4,23}$/
const RID_RE = /^r[a-z0-9]{4,23}$/
const CUR_RE = /^[A-Z]{3}$/

export { localDay, safeStorage }
const cleanText = (s, max) => [..._clean(s, 10 * max)].slice(0, max).join('').trim()
const emit = () => { try { globalThis.dispatchEvent?.(new CustomEvent(DEBT_EVENT)) } catch { /* */ } }
const round2 = (n) => Math.round(n * 100) / 100

/** Məbləğ → 2 onluqlu müsbət ədəd və ya 0 (yanlış) */
export function cleanMoney(v) {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0 || n > AMOUNT_MAX) return 0
  const r = round2(n)
  return r > 0 ? r : 0
}

const newId = (p, now, rnd) => `${p}${now.toString(36)}${Math.floor(rnd() * 1e6).toString(36)}`.slice(0, 24)
export const newDebtId = (now = Date.now(), rnd = Math.random) => newId('d', now, rnd)
export const newRepayId = (now = Date.now(), rnd = Math.random) => newId('r', now, rnd)

function sanitizeRepay(list) {
  const seen = new Set(), out = []
  for (const x of Array.isArray(list) ? list : []) {
    if (!isObj(x) || typeof x.id !== 'string' || !RID_RE.test(x.id) || seen.has(x.id) || !validDay(x.d)) continue
    const a = cleanMoney(x.a)
    if (!a) continue
    seen.add(x.id)
    out.push({ id: x.id, d: x.d, a })
  }
  out.sort((x, y) => (x.d < y.d ? -1 : x.d > y.d ? 1 : 0))
  return out.slice(-REPAY_MAX)
}

/** Bir qeyd → təmiz forma və ya null */
export function sanitizeDebt(x) {
  if (!isObj(x) || typeof x.id !== 'string' || !ID_RE.test(x.id)) return null
  if (!DEBT_KINDS.includes(x.k) || !validDay(x.d)) return null
  const p = cleanText(x.p, PERSON_MAX)
  const a = cleanMoney(x.a)
  const cu = typeof x.cu === 'string' ? x.cu.trim().toUpperCase() : ''
  if (!p || !a || !CUR_RE.test(cu)) return null
  const out = { id: x.id, k: x.k, p, a, cu, d: x.d }
  if (validDay(x.du)) out.du = x.du
  const w = (Array.isArray(x.w) ? x.w : []).map((n) => cleanText(n, PERSON_MAX)).filter(Boolean)
  if (w.length) out.w = [...new Set(w)].slice(0, WITNESS_MAX)
  const no = cleanText(x.no, NOTE_MAX)
  if (no) out.no = no
  out.r = sanitizeRepay(x.r)
  if (x.s === true) { out.s = true; if (validDay(x.sd)) out.sd = x.sd }
  if (x.rm === true && out.du) out.rm = true
  if (Number.isInteger(x.lid) && x.lid > 0) out.lid = x.lid
  const u = Number(x.u)
  out.u = Number.isFinite(u) && u > 0 ? Math.round(u) : 0
  return out
}

/** Bütün dəyər → { v: 1, l } (təkrarsız, borc gününə görə, ən çox DEBT_MAX) */
export function sanitizeLedger(raw) {
  const list = Array.isArray(raw?.l) ? raw.l : []
  const seen = new Set(), l = []
  for (const x of list) { const e = sanitizeDebt(x); if (e && !seen.has(e.id)) { seen.add(e.id); l.push(e) } }
  l.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.u - b.u))
  return { v: 1, l: l.slice(-DEBT_MAX) }
}

export const readLedger = (storage = safeStorage()) => sanitizeLedger(parse(storage, DEBT_KEY, null))

function writeLedger(data, storage) {
  const v = sanitizeLedger(data)
  try { if (v.l.length) storage?.setItem(DEBT_KEY, JSON.stringify(v)); else storage?.removeItem(DEBT_KEY) } catch { /* yaddaş bağlıdır */ }
  emit()
  return v
}

const find = (data, id) => data.l.find((x) => x.id === id) || null

/** Əlavə et və ya (id varsa) yenilə; qaytarmalar və "bağlandı" köhnə qeyddən qalır → { ok, data, item? } */
export function saveDebt(entry, storage = safeStorage(), now = Date.now()) {
  const cur = readLedger(storage)
  const old = entry?.id ? find(cur, entry.id) : null
  const base = old ? { r: old.r, s: old.s, sd: old.sd, lid: old.lid } : {}
  const item = sanitizeDebt({ ...base, ...entry, id: entry?.id || newDebtId(now), u: now })
  if (!item) return { ok: false, data: cur }
  return { ok: true, data: writeLedger({ l: [...cur.l.filter((x) => x.id !== item.id), item] }, storage), item }
}

/** Qeydin bir hissəsini dəyiş (məs. { s: true, sd }, { rm, lid }) → { ok, data, item? } */
export function patchDebt(id, patch, storage = safeStorage(), now = Date.now()) {
  const cur = readLedger(storage)
  const old = find(cur, id)
  if (!old) return { ok: false, data: cur }
  const next = { ...old, ...patch, u: now }
  for (const k of Object.keys(patch)) if (patch[k] === undefined) delete next[k]
  const item = sanitizeDebt(next)
  if (!item) return { ok: false, data: cur }
  return { ok: true, data: writeLedger({ l: cur.l.map((x) => (x.id === id ? item : x)) }, storage), item }
}

export function removeDebt(id, storage = safeStorage()) {
  const cur = readLedger(storage)
  return writeLedger({ l: cur.l.filter((x) => x.id !== id) }, storage)
}

/** Qismən qaytarma: qalıqdan çox ola bilməz → { ok, data, item?, code? } */
export function addRepayment(id, { d, a }, storage = safeStorage(), now = Date.now()) {
  const cur = readLedger(storage)
  const old = find(cur, id)
  const amt = cleanMoney(a)
  if (!old || !validDay(d) || !amt) return { ok: false, data: cur, code: 'invalid' }
  if (amt > remaining(old) + 1e-9) return { ok: false, data: cur, code: 'tooMuch' }
  if (old.r.length >= REPAY_MAX) return { ok: false, data: cur, code: 'invalid' }
  return patchDebt(id, { r: [...old.r, { id: newRepayId(now), d, a: amt }] }, storage, now)
}

export function removeRepayment(id, rid, storage = safeStorage(), now = Date.now()) {
  const cur = readLedger(storage)
  const old = find(cur, id)
  if (!old) return { ok: false, data: cur }
  return patchDebt(id, { r: old.r.filter((x) => x.id !== rid) }, storage, now)
}

export const paidOf = (e) => round2((e?.r || []).reduce((s, x) => s + x.a, 0))
export const remaining = (e) => Math.max(0, round2((Number(e?.a) || 0) - paidOf(e)))
/** Bağlıdır: əl ilə bağlanıb və ya tam qaytarılıb */
export const isSettled = (e) => Boolean(e?.s) || remaining(e) === 0

const dayNum = (d) => { const [y, m, dd] = d.split('-').map(Number); return Date.UTC(y, m - 1, dd) / 86400000 }
/** Qaytarılma vəziyyəti: 'none' | 'later' | 'soon' (≤ SOON_DAYS) | 'today' | 'overdue' */
export function dueState(e, today) {
  if (!e?.du || isSettled(e) || !validDay(today)) return 'none'
  const diff = dayNum(e.du) - dayNum(today)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  return diff <= SOON_DAYS ? 'soon' : 'later'
}
export const daysUntilDue = (e, today) => (e?.du && validDay(today) ? dayNum(e.du) - dayNum(today) : null)

/** Xatırlatması açıq, bağlanmamış, günü çatmış/keçmiş qeydlər */
export const dueReminders = (data, today) => (data?.l || []).filter((e) => e.rm && ['today', 'overdue'].includes(dueState(e, today)))

/** Açıq qalıqlar — növ və valyuta üzrə (yalnız istifadəçinin özünə; heç kimlə müqayisə yoxdur) */
export function openTotals(data) {
  const out = { owe: {}, owed: {} }
  for (const e of data?.l || []) {
    if (isSettled(e)) continue
    const m = out[e.k]
    m[e.cu] = round2((m[e.cu] || 0) + remaining(e))
  }
  return out
}

/** Əvvəl yazılmış adlar (şəxslər + şahidlər; təkrarsız, son istifadə əvvəldə) — forma təklifi */
export function knownNames(data) {
  const out = []
  for (const e of [...(data?.l || [])].reverse()) {
    for (const n of [e.p, ...(e.w || [])]) if (n && !out.includes(n)) out.push(n)
  }
  return out.slice(0, 30)
}

// ── Sinxronizasiya: 3 tərəfli birləşmə (saf) ──
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
function map3(L, R, B, both) {
  const out = {}
  for (const k of new Set([...Object.keys(L), ...Object.keys(R), ...Object.keys(B)])) {
    const l = L[k], r = R[k], b = B[k]
    let v
    if (same(l, r)) v = l
    else if (same(l, b)) v = r
    else if (same(r, b)) v = l
    else if (l === undefined || r === undefined) v = l === undefined ? r : l
    else v = both(l, r, b)
    if (v !== undefined) out[k] = v
  }
  return out
}
const byId = (list) => Object.fromEntries((list || []).map((x) => [x.id, x]))

/** İki cihaz eyni qeydi dəyişib: sahələr — təzəsi (u), qaytarmalar — id üzrə 3 tərəfli birlik */
function combineDebt(l, r, b) {
  const newer = (Number(r.u) || 0) > (Number(l.u) || 0) ? r : l
  const reps = map3(byId(l.r), byId(r.r), byId(b?.r), (x) => x)
  return { ...newer, r: Object.values(reps) }
}

/** (local, remote, base) — xam obyektlər (JSON.parse) → təmiz dəyər və ya undefined (boş) */
export function mergeLedger(L, R, B) {
  const pick = (o) => byId(sanitizeLedger(o).l)
  const m = map3(pick(L), pick(R), B === undefined ? {} : pick(B), combineDebt)
  const out = sanitizeLedger({ l: Object.values(m) })
  return out.l.length ? out : undefined
}
