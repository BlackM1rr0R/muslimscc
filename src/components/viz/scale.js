// ═══════════════════════════════════════════════════════
// viz v2 — saf hesab funksiyaları (React-sız, DOM-suz; tests/unit/viz-scale.test.js)
//
//   niceTicks(min, max, count)   — "gözəl" ox addımları (0, 5, 10 … / 0, 0.2 …)
//   linear(domain, range)        — xətti miqyas (+ .invert)
//   stackSeries(seriesValues)    — yığma sahə üçün [y0, y1] cütləri
//   linePath / areaPath          — SVG yolları (düz və ya "monotone" əyri — aşmır)
//   pctDelta(cur, prev)          — dəyişmə faizi (prev = 0 → null)
//   bucketSum(values, size)      — günlük sıranı həftəyə/aya yığmaq
//   quantileThresholds / levelOf — istilik xəritəsinin pillələri
//   relUnit(then, now)           — "7 dəq əvvəl" üçün vahid və dəyər
//   nearestIndex(px, xs)         — kursora ən yaxın nöqtə
//   dayKeys(endKey, n)           — 'YYYY-MM-DD' günləri (yerli)
// ═══════════════════════════════════════════════════════

/** Ədədin "gözəl" yuvarlaqlaşdırılması (1, 2, 2.5, 5, 10 × 10ⁿ). */
export function niceNum(range, round) {
  if (!(range > 0) || !Number.isFinite(range)) return 1
  const exp = Math.floor(Math.log10(range))
  const f = range / 10 ** exp
  let nf
  if (round) nf = f < 1.5 ? 1 : f < 2.25 ? 2 : f < 3.5 ? 2.5 : f < 7.5 ? 5 : 10
  else nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nf * 10 ** exp
}

// Üzən nöqtə xətasını təmizlə (0.30000000000000004 → 0.3)
const clean = (v, step) => {
  const dec = Math.max(0, -Math.floor(Math.log10(step)) + 1)
  return Number(v.toFixed(Math.min(10, dec)))
}

/**
 * Ox üçün gözəl addımlar. count — təxmini addım sayı (susma 4).
 * integer: true — addım tam ədəd olsun (sayğaclar: 0.5 namaz olmur).
 * → { min, max, step, ticks: number[] }
 */
export function niceTicks(min, max, count = 4, { integer = false } = {}) {
  let lo = Number.isFinite(min) ? min : 0
  let hi = Number.isFinite(max) ? max : 0
  if (lo > hi) [lo, hi] = [hi, lo]
  if (lo === hi) {
    if (hi === 0) hi = 1
    else if (hi > 0) lo = 0
    else hi = 0
  }
  const n = Math.max(1, Math.round(count))
  let step = niceNum(niceNum(hi - lo, false) / n, true)
  if (integer && step < 1) step = 1
  if (integer && !Number.isInteger(step)) step = Math.floor(step)   // 2.5 → 2 (sayğacda yarım yoxdur)
  const nMin = Math.floor(lo / step) * step
  const nMax = Math.ceil(hi / step) * step
  const ticks = []
  for (let v = nMin, i = 0; v <= nMax + step / 2 && i < 100; v += step, i++) ticks.push(clean(v, step))
  return { min: clean(nMin, step), max: clean(nMax, step), step, ticks }
}

/** Xətti miqyas. linear([0, 10], [0, 200])(5) → 100; .invert(100) → 5 */
export function linear([d0, d1], [r0, r1]) {
  const span = d1 - d0
  const f = (v) => (span === 0 ? (r0 + r1) / 2 : r0 + ((v - d0) / span) * (r1 - r0))
  f.invert = (px) => (r1 === r0 ? d0 : d0 + ((px - r0) / (r1 - r0)) * span)
  f.domain = [d0, d1]
  f.range = [r0, r1]
  return f
}

/** Massivin [min, max]-ı (rəqəm olmayanlar atılır). Boş → [0, 0] */
export function extent(values) {
  let lo = Infinity, hi = -Infinity
  for (const v of values || []) {
    if (typeof v !== 'number' || !Number.isFinite(v)) continue
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  return lo === Infinity ? [0, 0] : [lo, hi]
}

export const sum = (arr) => (arr || []).reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0)

/**
 * Yığma: seriyaların dəyərləri ([[…], […]]) → hər seriya üçün [y0, y1] cütləri.
 * Mənfi/rəqəm olmayan dəyər 0 sayılır (yığma sahədə mənfi mənasızdır).
 */
export function stackSeries(seriesValues) {
  const n = Math.max(0, ...seriesValues.map(v => v.length))
  const base = new Array(n).fill(0)
  return seriesValues.map((vals) => {
    const out = []
    for (let i = 0; i < n; i++) {
      const v = Math.max(0, Number(vals[i]) || 0)
      out.push([base[i], base[i] + v])
      base[i] += v
    }
    return out
  })
}

const f1 = (v) => (Math.round(v * 10) / 10).toString()

/**
 * Nöqtələrdən SVG xətti. points: [[x, y], …]; curve: 'linear' | 'monotone'.
 * "monotone" (Fritsch–Carlson) — hamar, amma dəyərlərin arasından "aşıb" yalançı
 * zirvə çəkmir (0-a enən gün mənfiyə düşmür).
 */
export function linePath(points, curve = 'monotone') {
  const p = points.filter(pt => pt && Number.isFinite(pt[0]) && Number.isFinite(pt[1]))
  if (!p.length) return ''
  if (p.length === 1) return `M${f1(p[0][0])},${f1(p[0][1])}`
  if (curve !== 'monotone' || p.length < 3) return 'M' + p.map(([x, y]) => `${f1(x)},${f1(y)}`).join('L')
  const n = p.length
  const dx = [], m = [], t = new Array(n)
  for (let i = 0; i < n - 1; i++) {
    dx[i] = p[i + 1][0] - p[i][0]
    m[i] = dx[i] === 0 ? 0 : (p[i + 1][1] - p[i][1]) / dx[i]
  }
  t[0] = m[0]; t[n - 1] = m[n - 2]
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue }
    const a = t[i] / m[i], b = t[i + 1] / m[i]
    const s = a * a + b * b
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i] }
  }
  let d = `M${f1(p[0][0])},${f1(p[0][1])}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3
    d += `C${f1(p[i][0] + h)},${f1(p[i][1] + t[i] * h)} ${f1(p[i + 1][0] - h)},${f1(p[i + 1][1] - t[i + 1] * h)} ${f1(p[i + 1][0])},${f1(p[i + 1][1])}`
  }
  return d
}

/** Sahə: üst xətt (top) + alt xətt (bottom, tərsinə) qapalı yol. */
export function areaPath(top, bottom, curve = 'monotone') {
  if (!top.length) return ''
  const up = linePath(top, curve)
  const rev = [...bottom].reverse()
  const down = linePath(rev, curve).replace(/^M/, 'L')
  return `${up}${down}Z`
}

/** Dəyişmə faizi: (cur − prev) / prev × 100, bir onluq dəqiqliklə. prev ≤ 0 → null */
export function pctDelta(cur, prev) {
  if (!Number.isFinite(cur) || !Number.isFinite(prev) || prev <= 0) return null
  return Math.round(((cur - prev) / prev) * 1000) / 10
}

/** Ardıcıl dəyərləri size-lik qruplara yığır (sonuncu natamam ola bilər). */
export function bucketSum(values, size) {
  const s = Math.max(1, Math.floor(size))
  const out = []
  for (let i = 0; i < values.length; i += s) out.push(sum(values.slice(i, i + s)))
  return out
}

/**
 * İstilik xəritəsi pillələri: müsbət dəyərlərin kvantilləri → artan, təkrarsız
 * hədlər. levels = 4 → [t1, t2, t3] (0 ayrıca pillədir). Boş → [1, 2, 3].
 */
export function quantileThresholds(values, levels = 4) {
  const pos = (values || []).filter(v => Number.isFinite(v) && v > 0).sort((a, b) => a - b)
  const k = Math.max(1, levels - 1)
  if (!pos.length) return Array.from({ length: k }, (_, i) => i + 1)
  const out = []
  for (let i = 1; i <= k; i++) {
    const q = pos[Math.min(pos.length - 1, Math.floor((i / (k + 1)) * pos.length))]
    out.push(q)
  }
  // təkrarsız və ciddi artan olsun
  for (let i = 1; i < out.length; i++) if (out[i] <= out[i - 1]) out[i] = out[i - 1] + 1e-9
  return out
}

/** Dəyərin pilləsi: 0 → 0; ≤ t[0] → 1; … ; > t[last] → t.length + 1 */
export function levelOf(v, thresholds) {
  if (!(v > 0)) return 0
  for (let i = 0; i < thresholds.length; i++) if (v <= thresholds[i]) return i + 1
  return thresholds.length + 1
}

/** Ən yaxın nöqtənin indeksi (xs artan və ya azalan ola bilər — RTL). */
export function nearestIndex(px, xs) {
  let best = -1, bd = Infinity
  for (let i = 0; i < xs.length; i++) {
    const d = Math.abs(xs[i] - px)
    if (d < bd) { bd = d; best = i }
  }
  return best
}

const MIN = 60e3, HOUR = 36e5, DAY = 864e5

/**
 * Nisbi vaxt vahidi. then/now — Date | ms. dayOnly — yalnız gün dəqiqliyi
 * (tarixi 'YYYY-MM-DD' olan qeydlər: "bu gün", "dünən", "3 gün əvvəl").
 * → { value (mənfi = keçmiş), unit: 'second'|'minute'|'hour'|'day'|'week'|'month'|'year' }
 */
export function relUnit(then, now = Date.now(), { dayOnly = false } = {}) {
  const t = +then, n = +now
  if (dayOnly) {
    const a = new Date(t); a.setHours(12, 0, 0, 0)
    const b = new Date(n); b.setHours(12, 0, 0, 0)
    const days = Math.round((a - b) / DAY)
    if (Math.abs(days) < 7) return { value: days, unit: 'day' }
    if (Math.abs(days) < 30) return { value: Math.trunc(days / 7), unit: 'week' }
    if (Math.abs(days) < 365) return { value: Math.trunc(days / 30), unit: 'month' }
    return { value: Math.trunc(days / 365), unit: 'year' }
  }
  const diff = t - n
  const a = Math.abs(diff)
  const r = (u) => Math.round(diff / u) || 0
  if (a < MIN) return { value: 0, unit: 'second' }
  if (a < HOUR) return { value: r(MIN), unit: 'minute' }
  if (a < DAY) return { value: r(HOUR), unit: 'hour' }
  if (a < 7 * DAY) return { value: r(DAY), unit: 'day' }
  if (a < 30 * DAY) return { value: Math.trunc(diff / (7 * DAY)), unit: 'week' }
  if (a < 365 * DAY) return { value: Math.trunc(diff / (30 * DAY)), unit: 'month' }
  return { value: Math.trunc(diff / (365 * DAY)), unit: 'year' }
}

// ── Gün açarları (YERLİ tarix; toISOString UTC-dir) ──
export function toDayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function fromDayKey(k) {
  const [y, m, d] = String(k).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1, 12)
}
export function addDayKey(k, n) {
  const d = fromDayKey(k); d.setDate(d.getDate() + n); return toDayKey(d)
}
/** endKey daxil olmaqla son n gün, köhnədən yeniyə. */
export function dayKeys(endKey, n) {
  const out = []
  for (let i = n - 1; i >= 0; i--) out.push(addDayKey(endKey, -i))
  return out
}

/**
 * Hədəfə çatma tarixi: qalan / gündəlik temp. pace ≤ 0 → null.
 * → { days, date: Date }
 */
export function etaFromPace(remaining, pacePerDay, now = new Date()) {
  if (!(remaining > 0)) return { days: 0, date: new Date(+now) }
  if (!(pacePerDay > 0)) return null
  const days = Math.ceil(remaining / pacePerDay)
  const d = new Date(+now); d.setDate(d.getDate() + days)
  return { days, date: d }
}
