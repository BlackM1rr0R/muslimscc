// ═══════════════════════════════════════════════════════
// Günəş tutulmasının yerli hesabı (v6.6) — Bessel elementlərindən (data/solarEclipses.js).
//
// Üsul — "Explanatory Supplement to the Astronomical Almanac" və Meeus, "Elements of Solar
// Eclipses": müşahidəçinin fundamental müstəvidəki koordinatları (ξ, η, ζ), Ay kölgəsinin
// mərkəzinə məsafə Δ = √(u² + v²), yarımkölgə / kölgə radiusları L1′, L2′. Ən böyük an —
// Δ-nın minimumu (Nyuton), təmaslar — Δ = L1′ (C1, C4) və Δ = |L2′| (C2, C3).
// Faza = (L1′ − Δ) / (L1′ + L2′); örtülmə — iki dairənin kəsişmə sahəsi.
// Mərkəzi xətt — kölgə oxunun Yer ellipsoidi ilə kəsişməsi.
// Saf funksiyalar — tests/unit/solar-eclipse.test.js (NASA cədvəlinin ən böyük anı və fazası ilə).
// ═══════════════════════════════════════════════════════
const RAD = Math.PI / 180
const EARTH_R = 6378137
const norm180 = (x) => ((((x + 180) % 360) + 360) % 360) - 180

/** Elementlərin t0 anı (TD) — epoch ms və ΔT */
export function epoch(e) {
  const jd0 = Math.floor(e[0] - 0.5) + 0.5 + e[1] / 24
  return { tdMs: (jd0 - 2440587.5) * 86400000, dT: e[5] }
}
/** UT epoch ms → t (saat, t0-dan) */
export const tOf = (e, ms) => { const { tdMs, dT } = epoch(e); return (ms + dT * 1000 - tdMs) / 3600000 }
/** t (saat) → UT epoch ms */
export const msOf = (e, t) => { const { tdMs, dT } = epoch(e); return Math.round(tdMs + t * 3600000 - dT * 1000) }

/** t anında elementlər və saatlıq törəmələr */
function at(e, t) {
  const p3 = (i) => ((e[i + 3] * t + e[i + 2]) * t + e[i + 1]) * t + e[i]
  const d3 = (i) => (3 * e[i + 3] * t + 2 * e[i + 2]) * t + e[i + 1]
  const p2 = (i) => (e[i + 2] * t + e[i + 1]) * t + e[i]
  const d2 = (i) => 2 * e[i + 2] * t + e[i + 1]
  return { x: p3(6), y: p3(10), d: p2(14), mu: p2(17), l1: p2(20), l2: p2(23), dx: d3(6), dy: d3(10), dd: d2(14), dmu: d2(17), f1: e[26], f2: e[27], dT: e[5] }
}

/** Müşahidəçi sabitləri: ρ sin φ′, ρ cos φ′ */
function observer(lat, h = 0) {
  const u1 = Math.atan(0.99664719 * Math.tan(lat * RAD))
  return { rs: 0.99664719 * Math.sin(u1) + (h / EARTH_R) * Math.sin(lat * RAD), rc: Math.cos(u1) + (h / EARTH_R) * Math.cos(lat * RAD) }
}

/** t anında müşahidəçi üçün: u, v, törəmələr, L1′, L2′, Δ, Günəşin hündürlüyü (°) */
function local(e, t, o, lat, lng) {
  const a = at(e, t)
  const H = (a.mu + lng - 0.00417807 * a.dT) * RAD
  const d = a.d * RAD
  const xi = o.rc * Math.sin(H)
  const eta = o.rs * Math.cos(d) - o.rc * Math.cos(H) * Math.sin(d)
  const zeta = o.rs * Math.sin(d) + o.rc * Math.cos(H) * Math.cos(d)
  const dxi = a.dmu * RAD * o.rc * Math.cos(H)
  const deta = a.dmu * RAD * xi * Math.sin(d) - zeta * a.dd * RAD
  const u = a.x - xi, v = a.y - eta
  const L1 = a.l1 - zeta * a.f1, L2 = a.l2 - zeta * a.f2
  const sinAlt = Math.sin(lat * RAD) * Math.sin(d) + Math.cos(lat * RAD) * Math.cos(d) * Math.cos(H)
  return { u, v, a: a.dx - dxi, b: a.dy - deta, L1, L2, m: Math.hypot(u, v), alt: Math.asin(Math.max(-1, Math.min(1, sinAlt))) / RAD }
}

/** İki dairənin (R = 1 və r) c məsafəsində kəsişmə sahəsinin Günəş diskinə nisbəti */
export function obscuration(r, c) {
  if (c >= 1 + r) return 0
  if (c <= Math.abs(1 - r)) return Math.min(1, r * r)
  const a1 = Math.acos((c * c + 1 - r * r) / (2 * c))
  const a2 = Math.acos((c * c + r * r - 1) / (2 * c * r))
  const k = Math.sqrt((-c + 1 + r) * (c + 1 - r) * (c - 1 + r) * (c + 1 + r))
  return (a1 + r * r * a2 - 0.5 * k) / Math.PI
}

/** t anında faza və örtülmə (Günəş üfüqdən aşağı olsa da) */
export function phaseAt(e, ms, lat, lng, h = 0) {
  const s = local(e, tOf(e, ms), observer(lat, h), lat, lng)
  const mag = (s.L1 - s.m) / (s.L1 + s.L2)
  if (mag <= 0) return { mag: 0, obsc: 0, alt: s.alt }
  const r = (s.L1 - s.L2) / (s.L1 + s.L2), c = (2 * s.m) / (s.L1 + s.L2)
  return { mag, obsc: obscuration(r, c), alt: s.alt }
}

function contact(e, t, o, lat, lng, which, sign) {
  for (let k = 0; k < 8; k++) {
    const s = local(e, t, o, lat, lng)
    const L = which === 1 ? s.L1 : Math.abs(s.L2)
    const n2 = s.a * s.a + s.b * s.b, n = Math.sqrt(n2)
    const S = (s.a * s.v - s.u * s.b) / (n * L)
    if (Math.abs(S) > 1) return null
    const tau = -(s.u * s.a + s.v * s.b) / n2 + sign * (L / n) * Math.sqrt(1 - S * S)
    t += tau
    if (Math.abs(tau) < 1e-7) break
  }
  return t
}

/**
 * Yerli şərait: { c1, max, c4, c2?, c3?, mag, obsc, alt, kind: 'T'|'A'|'P', visible, seenMag, seenObsc, seenMs }
 * (vaxtlar — UT epoch ms). Tutulma bu yerə düşmürsə — null.
 * seen* — Günəş üfüqdən yuxarı olan hissədə ən böyük faza (məs. Günəş tutulu doğanda).
 */
export function localCircumstances(e, lat, lng, h = 0) {
  const o = observer(lat, h)
  let t = 0
  for (let k = 0; k < 12; k++) {
    const s = local(e, t, o, lat, lng)
    const tau = -(s.u * s.a + s.v * s.b) / (s.a * s.a + s.b * s.b)
    t += tau
    if (Math.abs(tau) < 1e-7) break
  }
  const sm = local(e, t, o, lat, lng)
  const mag = (sm.L1 - sm.m) / (sm.L1 + sm.L2)
  if (!(mag > 0)) return null
  const c1 = contact(e, t, o, lat, lng, 1, -1), c4 = contact(e, t, o, lat, lng, 1, 1)
  if (c1 == null || c4 == null) return null
  let kind = 'P', c2 = null, c3 = null
  if (sm.m < Math.abs(sm.L2)) {
    kind = sm.L2 < 0 ? 'T' : 'A'
    c2 = contact(e, t, o, lat, lng, 2, -1); c3 = contact(e, t, o, lat, lng, 2, 1)
  }
  const r = (sm.L1 - sm.L2) / (sm.L1 + sm.L2), c = (2 * sm.m) / (sm.L1 + sm.L2)
  const res = { c1: msOf(e, c1), max: msOf(e, t), c4: msOf(e, c4), c2: c2 == null ? null : msOf(e, c2), c3: c3 == null ? null : msOf(e, c3),
    mag, obsc: obscuration(r, c), alt: sm.alt, kind }
  // Görünən hissə: Günəş üfüqdən yuxarı (alt > 0) olduğu anlar
  if (sm.alt > 0) return { ...res, visible: true, seenMag: mag, seenObsc: res.obsc, seenMs: res.max }
  let best = null
  for (let i = 0; i <= 240; i++) {
    const ms = res.c1 + ((res.c4 - res.c1) * i) / 240
    const p = phaseAt(e, ms, lat, lng, h)
    if (p.alt > 0 && p.mag > 0 && (!best || p.mag > best.mag)) best = { ...p, ms }
  }
  return best ? { ...res, visible: true, seenMag: best.mag, seenObsc: best.obsc, seenMs: best.ms } : { ...res, visible: false, seenMag: 0, seenObsc: 0, seenMs: null }
}

/** t anında kölgə oxunun Yerə düşdüyü nöqtə: { lat, lng } və ya null (ox Yerdən yan keçir) */
export function centralPoint(e, ms) {
  const a = at(e, tOf(e, ms))
  const d = a.d * RAD
  const w = 1 / Math.sqrt(1 - 0.00669438 * Math.cos(d) ** 2)
  const y1 = w * a.y, b1 = w * Math.sin(d), b2 = 0.99664719 * w * Math.cos(d)
  const B2 = 1 - a.x * a.x - y1 * y1
  if (B2 < 0) return null
  const B = Math.sqrt(B2)
  const phi1 = Math.asin(B * b1 + y1 * b2)
  const H = Math.atan2(a.x, B * b2 - y1 * b1) / RAD
  const lat = Math.atan(1.00336409 * Math.tan(phi1)) / RAD
  return { lat, lng: norm180(H - a.mu + 0.00417807 * a.dT) }
}

/** Mərkəzi xətt: [[lng, lat], …] (stepMin dəqiqədən bir), kəsintilər ayrı hissələrdə */
export function centralLine(e, stepMin = 2) {
  const parts = []; let cur = []
  for (let t = e[2]; t <= e[3]; t += stepMin / 60) {
    const p = centralPoint(e, msOf(e, t))
    if (p) cur.push([p.lng, p.lat]); else if (cur.length) { parts.push(cur); cur = [] }
  }
  if (cur.length) parts.push(cur)
  return parts.filter(p => p.length > 1)
}

/** Yarımkölgənin Yerə düşdüyü zaman aralığı (UT ms): [ilk, son] — xəritə animasiyası üçün */
export function penumbraSpan(e, grid) {
  let first = null, last = null
  for (let t = e[2]; t <= e[3]; t += 5 / 60) {
    const ms = msOf(e, t)
    if (grid.some(([lng, lat]) => { const p = phaseAt(e, ms, lat, lng); return p.mag > 0 && p.alt > 0 })) { if (first == null) first = ms; last = ms }
  }
  return first == null ? null : [first, last]
}
