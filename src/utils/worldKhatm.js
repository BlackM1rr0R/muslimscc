// ═══════════════════════════════════════════════════════
// Ümmətin Canlı Xətmi — bu istifadəçinin iştirak yaddaşı (server/globalKhatm.js, pages/KhatmPage)
//
// Açar: world_khatm_v1 (ehtiyat nüsxəyə və hesab sinxronizasiyasına düşür; profilə aiddir —
// utils/profileCore PROFILE_KEYS; birləşdirici — utils/syncMergers). Format:
//   { v: 1, r: { '<dövr №>': { p: [səhifələr], d?: 'YYYY-MM-DD' (dövr tamamlandı), s?: 1 (hesabda göstərildi) } } }
// • p — bu cihazda / hesabda oxuduğunuz səhifələr (ömürlük mozaikada "ümmət səhifələri" üçün);
// • d — iştirak etdiyiniz dövrün tamamlandığı gün: "Ümmət xətmində iştirak" möhürü (utils/passport).
// Server iştirakı /me → rounds ilə də qaytarır (başqa cihazda oxunubsa) — syncRounds birləşdirir.
// Hər şey saf funksiyadır (storage parametri) — tests/unit/world-khatm.test.js
// ═══════════════════════════════════════════════════════
export const KHATM_KEY = 'world_khatm_v1'
export const KHATM_EVENT = 'world-khatm-change'
export const KHATM_PAGES = 604
const MAX_ROUNDS = 500
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
export const dayOf = (ms) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Xam obyekt → { v: 1, r: { no: { p, d?, s? } } } (pozuq hissələr atılır) */
export function sanitizeKhatm(raw) {
  const out = { v: 1, r: {} }
  const r = isObj(raw) && isObj(raw.r) ? raw.r : {}
  const keys = Object.keys(r).filter((k) => /^\d{1,9}$/.test(k) && Number(k) >= 1).sort((a, b) => Number(a) - Number(b)).slice(-MAX_ROUNDS)
  for (const k of keys) {
    const x = isObj(r[k]) ? r[k] : {}
    const p = [...new Set((Array.isArray(x.p) ? x.p : []).filter((n) => Number.isInteger(n) && n >= 1 && n <= KHATM_PAGES))].sort((a, b) => a - b)
    const e = { p }
    if (typeof x.d === 'string' && DATE_RE.test(x.d)) e.d = x.d
    if (x.s === 1) e.s = 1
    out.r[String(Number(k))] = e
  }
  return out
}

/** İki tərəfin birləşməsi (kommutativ): səhifələr — birlik, tamamlanma günü — ən erkən, "göstərildi" — hər hansı */
export function mergeKhatm(a, b) {
  const A = sanitizeKhatm(a), B = sanitizeKhatm(b)
  const r = {}
  for (const k of new Set([...Object.keys(A.r), ...Object.keys(B.r)])) {
    const x = A.r[k], y = B.r[k]
    if (!x || !y) { r[k] = { ...(x || y) }; continue }
    const e = { p: [...new Set([...x.p, ...y.p])].sort((m, n) => m - n) }
    const d = [x.d, y.d].filter(Boolean).sort()[0]
    if (d) e.d = d
    if (x.s || y.s) e.s = 1
    r[k] = e
  }
  return sanitizeKhatm({ r })
}

export function readKhatm(storage = safeStorage()) {
  try { return sanitizeKhatm(JSON.parse(storage?.getItem(KHATM_KEY) || 'null')) } catch { return sanitizeKhatm(null) }
}
function write(st, storage) {
  try { storage?.setItem(KHATM_KEY, JSON.stringify(st)) } catch { return false }
  try { globalThis.dispatchEvent?.(new CustomEvent(KHATM_EVENT)) } catch { /* köhnə brauzer */ }
  return true
}

/** Oxunan səhifəni qeyd et (dövr №, səhifə) */
export function addPage(roundNo, page, storage = safeStorage()) {
  const st = readKhatm(storage)
  const k = String(roundNo)
  const cur = st.r[k] || { p: [] }
  if (cur.p.includes(page)) return st
  return write(sanitizeKhatm({ r: { ...st.r, [k]: { ...cur, p: [...cur.p, page] } } }), storage) ? readKhatm(storage) : st
}

/** Dövr tamamlandı — yalnız iştirak etdiyiniz dövr (yaddaşda varsa) və ya force (server təsdiqləyib) */
export function markDone(roundNo, day, { storage = safeStorage(), force = false } = {}) {
  const st = readKhatm(storage)
  const k = String(roundNo)
  const cur = st.r[k]
  if (!cur && !force) return false
  if (cur && cur.d && cur.d <= day) return false
  write(sanitizeKhatm({ r: { ...st.r, [k]: { ...(cur || { p: [] }), d: day } } }), storage)
  return true
}

/** Serverin /me → rounds siyahısı ilə birləşdir (başqa cihazdakı iştirak da). Qaytarır: yeni tamamlananlar [no] */
export function syncRounds(rounds, storage = safeStorage()) {
  const st = readKhatm(storage)
  const fresh = []
  const r = { ...st.r }
  for (const x of Array.isArray(rounds) ? rounds : []) {
    if (!x || !Number.isInteger(x.no) || x.no < 1) continue
    const k = String(x.no)
    const cur = r[k] || { p: [] }
    const d = Number.isFinite(x.completedAt) ? dayOf(x.completedAt) : null
    if (d && !cur.d) fresh.push(x.no)
    r[k] = d && (!cur.d || d < cur.d) ? { ...cur, d } : cur
  }
  const next = sanitizeKhatm({ r })
  if (JSON.stringify(next) !== JSON.stringify(st)) write(next, storage)
  return fresh
}

/** Hesabda göstərildi — "yeni tamamlandı" nişanı bir dəfə */
export function markSeen(nos, storage = safeStorage()) {
  const st = readKhatm(storage)
  let changed = false
  const r = { ...st.r }
  for (const no of nos || []) {
    const k = String(no)
    if (r[k] && r[k].d && !r[k].s) { r[k] = { ...r[k], s: 1 }; changed = true }
  }
  if (changed) write(sanitizeKhatm({ r }), storage)
  return changed
}

/** Tamamlanmış (iştirak etdiyiniz) dövrlərin sayı — möhür üçün */
export const doneRounds = (st) => Object.values(st.r).filter((x) => x.d).length
/** İştirak edilmiş, tamamlanmış, amma hələ hesabda göstərilməmiş dövrlər */
export const unseenRounds = (st) => Object.keys(st.r).filter((k) => st.r[k].d && !st.r[k].s).map(Number)
/** Bütün dövrlərdə oxuduğunuz səhifələr (ömürlük mozaika üçün) */
export const ummahPages = (st) => new Set(Object.values(st.r).flatMap((x) => x.p))
