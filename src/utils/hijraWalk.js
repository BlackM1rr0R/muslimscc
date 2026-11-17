// ═══════════════════════════════════════════════════════
// hijraWalk — "Hicrət yolunu piyada qət et" üçün saf hesab (components/HijraWalk.jsx)
//
// • Yolun uzunluğu — verilmiş nöqtələr (enlik, uzunluq) arası böyük dairə (haversine) məsafələrinin cəmi.
// • pointAt(route, km) — xətt boyunca km məsafədəki nöqtə (seqment daxilində xətti).
// • Saxlama: { days: { 'YYYY-MM-DD': km }, startedAt, stride, log: [{ d, km, w }], walkers: [{ id, name, days }] }
//   days/startedAt — əsas yolçu ("mən"); walkers — ailə rejimində əlavə yolçular (adlar yalnız cihazda).
// ═══════════════════════════════════════════════════════

// Məxfi rejimdə localStorage-a müraciətin özü xəta atır — default parametr try-dan kənardadır
const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }

export const STORE_KEY = 'muslim_cc_hijra_walk'
export const DEFAULT_STRIDE = 0.75 // m
export const MAX_DAY_KM = 200
const R_EARTH = 6371.0088

const round1 = (x) => Math.round(x * 10) / 10

/** İki nöqtə ([lat, lon]) arası məsafə, km */
export function haversine(a, b) {
  const r = Math.PI / 180
  const dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Hər nöqtəyə qədər yığılmış məsafə (km); cum[0] = 0 */
export function cumulative(route) {
  const out = [0]
  for (let i = 1; i < route.length; i++) out.push(out[i - 1] + haversine(route[i - 1], route[i]))
  return out
}

export const routeLength = (route) => { const c = cumulative(route); return c[c.length - 1] || 0 }

/** Xətt boyunca km məsafədəki nöqtə [lat, lon] (0 … uzunluq arası sıxılır) */
export function pointAt(route, km, cum = cumulative(route)) {
  if (!route.length) return null
  const total = cum[cum.length - 1]
  const d = Math.max(0, Math.min(total, Number(km) || 0))
  for (let i = 1; i < route.length; i++) {
    if (d <= cum[i]) {
      const seg = cum[i] - cum[i - 1]
      const f = seg > 0 ? (d - cum[i - 1]) / seg : 0
      return [route[i - 1][0] + (route[i][0] - route[i - 1][0]) * f, route[i - 1][1] + (route[i][1] - route[i - 1][1]) * f]
    }
  }
  return route[route.length - 1].slice()
}

/** Addım → km (stride metrlə) */
export function stepsToKm(steps, stride = DEFAULT_STRIDE) {
  const s = Number(steps), m = Number(stride)
  if (!(s > 0) || !(m > 0)) return 0
  return round1((s * m) / 1000)
}

/** Yerli tarix açarı YYYY-MM-DD */
export function dateKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
const KEY_RE = /^\d{4}-\d{2}-\d{2}$/
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d) }
/** İki tarix açarı arası gün fərqi (b − a) */
export const dayDiff = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000)
export const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d) }

function cleanDays(days) {
  const out = {}
  if (days && typeof days === 'object') {
    for (const [k, v] of Object.entries(days)) {
      const n = Number(v)
      if (KEY_RE.test(k) && n > 0 && Number.isFinite(n)) out[k] = round1(Math.min(n, 10000))
    }
  }
  return out
}

/** Saxlanmış (və ya korlanmış) obyekti təmiz vəziyyətə çevirir */
export function sanitize(raw) {
  const o = raw && typeof raw === 'object' ? raw : {}
  const stride = Number(o.stride)
  const walkers = Array.isArray(o.walkers)
    ? o.walkers.filter(w => w && typeof w.id === 'string' && w.id !== 'me').slice(0, 8)
      .map(w => ({ id: w.id, name: String(w.name || '').slice(0, 24), days: cleanDays(w.days) }))
    : []
  const ids = new Set(['me', ...walkers.map(w => w.id)])
  const log = Array.isArray(o.log)
    ? o.log.filter(e => e && KEY_RE.test(e.d) && Number(e.km) > 0 && ids.has(e.w || 'me')).slice(-200)
      .map(e => ({ d: e.d, km: round1(Number(e.km)), w: e.w || 'me' }))
    : []
  return {
    days: cleanDays(o.days),
    startedAt: typeof o.startedAt === 'string' && KEY_RE.test(o.startedAt) ? o.startedAt : null,
    stride: stride >= 0.3 && stride <= 1.5 ? stride : DEFAULT_STRIDE,
    log,
    walkers,
  }
}

export function load(storage = safeStorage()) {
  try { return sanitize(JSON.parse(storage?.getItem(STORE_KEY) || 'null')) } catch { return sanitize(null) }
}
export function save(state, storage = safeStorage()) {
  try { storage?.setItem(STORE_KEY, JSON.stringify(state)) } catch { /* yaddaş dolu / bağlı */ }
}

/** Yolçunun gün xəritəsi ('me' — əsas) */
export const daysOf = (state, w = 'me') => (w === 'me' ? state.days : state.walkers.find(x => x.id === w)?.days) || {}
export const totalKm = (days) => round1(Object.values(days || {}).reduce((s, v) => s + (Number(v) || 0), 0))

function withDays(state, w, days) {
  if (w === 'me') return { ...state, days }
  return { ...state, walkers: state.walkers.map(x => (x.id === w ? { ...x, days } : x)) }
}

/** Gündəlik km əlavə edir (eyni günə yığılır). Səhv dəyərdə vəziyyət dəyişmir. */
export function addEntry(state, date, km, w = 'me') {
  const n = round1(Number(km))
  if (!(n > 0) || n > MAX_DAY_KM || !KEY_RE.test(date)) return state
  if (w !== 'me' && !state.walkers.some(x => x.id === w)) return state
  const days = { ...daysOf(state, w) }
  days[date] = round1((days[date] || 0) + n)
  const next = withDays(state, w, days)
  const startedAt = !state.startedAt || date < state.startedAt ? date : state.startedAt
  return { ...next, startedAt, log: [...state.log, { d: date, km: n, w }].slice(-200) }
}

/** Sonuncu yazını geri alır */
export function undoLast(state) {
  const last = state.log[state.log.length - 1]
  if (!last) return state
  const days = { ...daysOf(state, last.w) }
  const left = round1((days[last.d] || 0) - last.km)
  if (left > 0) days[last.d] = left
  else delete days[last.d]
  const next = withDays(state, last.w, days)
  const log = state.log.slice(0, -1)
  const all = [next.days, ...next.walkers.map(x => x.days)].flatMap(d => Object.keys(d)).sort()
  return { ...next, log, startedAt: all[0] || null }
}

export function addWalker(state, name, id = `w${Date.now().toString(36)}`) {
  const nm = String(name || '').trim().slice(0, 24)
  if (!nm || state.walkers.length >= 8) return state
  return { ...state, walkers: [...state.walkers, { id, name: nm, days: {} }] }
}
export function removeWalker(state, id) {
  return { ...state, walkers: state.walkers.filter(w => w.id !== id), log: state.log.filter(e => e.w !== id) }
}

/** Ardıcıl günlər: bu gün (və ya bu gün hələ yazılmayıbsa — dünən) bitən zəncir */
export function streak(days, today = dateKey()) {
  let k = (days?.[today] > 0) ? today : addDays(today, -1)
  let n = 0
  while (days?.[k] > 0) { n++; k = addDays(k, -1) }
  return n
}

/**
 * Proqnoz: başlanğıcdan bu günə qədər orta sürətlə (km/gün, təqvim günləri) qalan yol neçə günə gedilir.
 * → { pace, daysLeft, finish } (bitibsə daysLeft = 0; sürət yoxdursa null)
 */
export function estimate(days, startedAt, total, today = dateKey()) {
  const done = totalKm(days)
  if (done >= total) return { pace: null, daysLeft: 0, finish: today }
  if (!startedAt || !(done > 0)) return null
  const span = Math.max(1, dayDiff(startedAt, today) + 1)
  const pace = done / span
  const daysLeft = Math.ceil((total - done) / pace)
  return { pace: round1(pace), daysLeft, finish: addDays(today, daysLeft) }
}

/** Dayanacaqların km-i (stop.at — marşrut nöqtəsinin indeksi) */
export const stopKms = (stops, cum) => stops.map(s => cum[Math.min(cum.length - 1, s.at)] || 0)
