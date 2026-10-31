// ═══════════════════════════════════════════════════════
// Qəza izləyicisi (/qada) — saf köməkçilər
//
// Hər şey YALNIZ bu cihazda: localStorage 'muslim_cc_qada_v1'. Serverə,
// Firestore-a heç nə getmir; ehtiyat nüsxə — istifadəçinin özünün yüklədiyi
// JSON faylı.
//
// Vəziyyət:
//   { v: 1,
//     prayers: { fajr: { owed, done }, dhuhr, asr, maghrib, isha },
//     fasts:   { owed, done },
//     goal:    gündəlik hədəf (qılınan qəza namazı sayı),
//     log:     { 'YYYY-MM-DD': { p: namaz sayı, f: oruc sayı } } }
// "owed" — qalan borc, "done" — bu alətlə qeyd olunmuş qəza (irəliləyiş üçün).
// ═══════════════════════════════════════════════════════

export const QADA_V1_KEY = 'muslim_cc_qada_v1'
export const LEGACY_QADA_KEY = 'muslim_cc_qada'   // /prayer-tracker-in sayğacı (yalnız köçürmə təklifi üçün)
export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
export const MAX_COUNT = 200000
export const MAX_GOAL = 100
export const DEFAULT_GOAL = 5
const LOG_KEEP_DAYS = 400
const BACKUP_APP = 'muslims.cc/qada'

const int = (v, max = MAX_COUNT) => {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0
}
const isKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s)
const pad = (n) => String(n).padStart(2, '0')

/** Yerli tarixin açarı 'YYYY-MM-DD' */
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
function shiftKey(key, n) {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n, 12)
  return dayKey(dt)
}

export function emptyQada() {
  const prayers = {}
  for (const p of PRAYERS) prayers[p] = { owed: 0, done: 0 }
  return { v: 1, prayers, fasts: { owed: 0, done: 0 }, goal: DEFAULT_GOAL, log: {} }
}

/** Hər hansı girişi (köhnə, zədəli, idxal olunmuş) etibarlı vəziyyətə çevir */
export function normQada(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const out = emptyQada()
  for (const p of PRAYERS) {
    const x = r.prayers?.[p] || {}
    out.prayers[p] = { owed: int(x.owed), done: int(x.done) }
  }
  out.fasts = { owed: int(r.fasts?.owed), done: int(r.fasts?.done) }
  const g = Math.floor(Number(r.goal))
  out.goal = Number.isFinite(g) && g >= 1 ? Math.min(g, MAX_GOAL) : DEFAULT_GOAL
  if (r.log && typeof r.log === 'object') {
    for (const [k, v] of Object.entries(r.log)) {
      if (!isKey(k) || !v || typeof v !== 'object') continue
      const p = int(v.p, 10000), f = int(v.f, 1000)
      if (p || f) out.log[k] = { p, f }
    }
  }
  return out
}

const kindOk = (kind) => kind === 'fast' || PRAYERS.includes(kind)
const getSlot = (s, kind) => (kind === 'fast' ? s.fasts : s.prayers[kind])
function withSlot(s, kind, slot) {
  return kind === 'fast' ? { ...s, fasts: slot } : { ...s, prayers: { ...s.prayers, [kind]: slot } }
}

/** Borcu dəyiş (+1 / −1); 0-dan aşağı düşmür */
export function adjustOwed(s, kind, delta) {
  if (!kindOk(kind)) return s
  const cur = getSlot(s, kind)
  return withSlot(s, kind, { ...cur, owed: Math.max(0, Math.min(MAX_COUNT, cur.owed + Math.trunc(delta))) })
}

/** Borcu birbaşa yaz */
export function setOwed(s, kind, n) {
  if (!kindOk(kind)) return s
  return withSlot(s, kind, { ...getSlot(s, kind), owed: int(n) })
}

/** "Birini qıldım / tutdum": borc −1, qılınan +1, bugünkü qeyd +1 */
export function makeUp(s, kind, today = dayKey()) {
  if (!kindOk(kind)) return s
  const cur = getSlot(s, kind)
  if (cur.owed <= 0) return s
  const next = withSlot(s, kind, { owed: cur.owed - 1, done: Math.min(MAX_COUNT, cur.done + 1) })
  const day = s.log[today] || { p: 0, f: 0 }
  const field = kind === 'fast' ? 'f' : 'p'
  return { ...next, log: pruneLog({ ...s.log, [today]: { ...day, [field]: day[field] + 1 } }, today) }
}

/** Son "qıldım"ı geri al (səhv toxunuş üçün) */
export function undoMakeUp(s, kind, today = dayKey()) {
  if (!kindOk(kind)) return s
  const cur = getSlot(s, kind)
  if (cur.done <= 0) return s
  const next = withSlot(s, kind, { owed: Math.min(MAX_COUNT, cur.owed + 1), done: cur.done - 1 })
  const field = kind === 'fast' ? 'f' : 'p'
  const day = s.log[today]
  const log = { ...s.log }
  if (day && day[field] > 0) {
    const d = { ...day, [field]: day[field] - 1 }
    if (d.p || d.f) log[today] = d
    else delete log[today]
  }
  return { ...next, log }
}

function pruneLog(log, today) {
  const min = shiftKey(today, -LOG_KEEP_DAYS)
  const out = {}
  for (const [k, v] of Object.entries(log)) if (k >= min) out[k] = v
  return out
}

/** Təxmini hesabın nəticəsini əlavə et (mode 'add') və ya yaz (mode 'set') */
export function applyEstimate(s, { prayers = 0, fasts = 0, which = PRAYERS, mode = 'add' } = {}) {
  let next = s
  const pn = int(prayers), fn = int(fasts)
  for (const p of which) {
    if (!PRAYERS.includes(p)) continue
    next = mode === 'set' ? setOwed(next, p, pn) : adjustOwed(next, p, pn)
  }
  next = mode === 'set' ? setOwed(next, 'fast', fn) : adjustOwed(next, 'fast', fn)
  return next
}

export function setGoal(s, n) {
  const g = Math.floor(Number(n))
  return { ...s, goal: Number.isFinite(g) && g >= 1 ? Math.min(g, MAX_GOAL) : s.goal }
}

/** Ümumi göstəricilər */
export function qadaTotals(s) {
  let owed = 0, done = 0
  for (const p of PRAYERS) { owed += s.prayers[p].owed; done += s.prayers[p].done }
  const pct = owed + done ? Math.floor((done / (owed + done)) * 1000) / 10 : 0
  const f = s.fasts
  const fPct = f.owed + f.done ? Math.floor((f.done / (f.owed + f.done)) * 1000) / 10 : 0
  return { owed, done, pct, fastsOwed: f.owed, fastsDone: f.done, fastsPct: fPct }
}

/** Slotun irəliləyişi (0–100) */
export const slotPct = (x) => (x.owed + x.done ? Math.min(100, (x.done / (x.owed + x.done)) * 100) : 0)

/** Son n gün (köhnədən yeniyə): [{ key, p, f }] */
export function lastDays(s, today = dayKey(), n = 30) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const key = shiftKey(today, -i)
    const d = s.log[key] || { p: 0, f: 0 }
    out.push({ key, p: d.p, f: d.f })
  }
  return out
}

/** Bugün qılınan qəza namazları */
export const todayCount = (s, today = dayKey()) => s.log[today]?.p || 0

/**
 * Hədəf tempi ilə borcun neçə günə bitəcəyi (gündə `goal` namaz).
 * 0 — borc yoxdur.
 */
export const daysToFinish = (owed, goal) => (owed > 0 ? Math.ceil(owed / Math.max(1, goal)) : 0)

/**
 * Təxmini hesab: iki tarix arasındakı gün sayı (hər ikisi daxil), çıxılan günlər
 * (bilinən qılınmış günlər, qadınlar üçün heyz/nifas günləri) çıxılır.
 * from/to: 'YYYY-MM-DD'. Nəticə hər fərz namaz üçün eyni saydır.
 */
export function estimateDays(from, to, subtract = 0) {
  if (!isKey(from) || !isKey(to)) return 0
  const a = new Date(`${from}T12:00:00Z`), b = new Date(`${to}T12:00:00Z`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0
  const days = Math.round((b - a) / 86400000) + 1
  return Math.max(0, Math.min(MAX_COUNT, days - int(subtract)))
}

// ── Ehtiyat nüsxə (JSON) ──
export function toBackup(s, now = new Date()) {
  return JSON.stringify({ app: BACKUP_APP, version: 1, exportedAt: now.toISOString(), data: normQada(s) }, null, 2)
}

/** JSON mətnindən vəziyyət; tanınmırsa null */
export function fromBackup(text) {
  let j
  try { j = JSON.parse(text) } catch { return null }
  if (!j || typeof j !== 'object') return null
  const data = j.app === BACKUP_APP ? j.data : (j.prayers || j.fasts ? j : null)
  if (!data || typeof data !== 'object') return null
  return normQada(data)
}

/** /prayer-tracker-in köhnə sayğacı ({ prayers: { fajr: { debt, done } }, fasts: { debt, done } }) */
export function fromLegacy(raw) {
  if (!raw || typeof raw !== 'object') return null
  const s = emptyQada()
  let any = false
  for (const p of PRAYERS) {
    const x = raw.prayers?.[p] || {}
    s.prayers[p] = { owed: int(x.debt), done: int(x.done) }
    if (s.prayers[p].owed || s.prayers[p].done) any = true
  }
  s.fasts = { owed: int(raw.fasts?.debt), done: int(raw.fasts?.done) }
  if (s.fasts.owed || s.fasts.done) any = true
  return any ? s : null
}

export const isEmpty = (s) => PRAYERS.every(p => !s.prayers[p].owed && !s.prayers[p].done)
  && !s.fasts.owed && !s.fasts.done

// ── localStorage (try/catch — gizli rejim, dolu yaddaş) ──
export function loadQada(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(QADA_V1_KEY)
    return raw ? normQada(JSON.parse(raw)) : emptyQada()
  } catch { return emptyQada() }
}
export function saveQada(s, storage = globalThis.localStorage) {
  try { storage?.setItem(QADA_V1_KEY, JSON.stringify(normQada(s))); return true } catch { return false }
}
export function loadLegacy(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(LEGACY_QADA_KEY)
    return raw ? fromLegacy(JSON.parse(raw)) : null
  } catch { return null }
}
