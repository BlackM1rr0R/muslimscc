// ═══════════════════════════════════════════════════════
// Məşrəbiyyə — günəş işığı (components/MashrabiyaLight.jsx) — saf həndəsə, DOM yoxdur
// tests/unit/mashrabiya.test.js
//
// Otağın koordinatları (metr): x — pəncərəli divar boyunca (içəridən pəncərəyə baxana görə sağa),
// y — yuxarı, z — divardan otağın içinə. Pəncərəli divar z = 0, döşəmə y = 0.
// Divar ekvatora baxır (şimal yarımkürəsində cənuba, cənubda şimala) — işıq günün çoxunda düşür.
//
// Şəbəkənin hər deşiyi (z = 0 müstəvisində çoxbucaqlı) Günəşin istiqamətində paralel
// proyeksiya ilə döşəməyə (y = 0), yan divarlara (x = ±w/2) və arxa divara (z = d) salınır:
// şüa P + t·D, müstəvi kəsişməsi t = (v − P_k) / D_k. Hər səthdə öz düzbucaqlısına kəsilir
// (Sutherland–Hodgman) — şüa hansı səthə əvvəl dəyirsə, ləkə yalnız orada qalır.
// Günəşin yeri: utils/rasdQibla.js (Meeus, refraksiyasız).
// ═══════════════════════════════════════════════════════
import { sunHorizontal } from './rasdQibla'

const RAD = Math.PI / 180

export const ROOM = { w: 4.4, h: 2.9, d: 5 }
export const WINDOW = { x0: -0.8, x1: 0.8, y0: 0.75, y1: 2.35, cells: 8 }

/** Pəncərəli divarın xarici normalının azimutu: şimal yarımkürəsi → 180 (cənub), cənub → 0 */
export const wallAzimuth = (lat) => (lat >= 0 ? 180 : 0)

const wrap180 = (x) => ((((x + 180) % 360) + 360) % 360) - 180

/**
 * Günəş (alt, az) → otaqda işığın istiqaməti (vahid vektor, Günəşdən otağa).
 * Günəş üfüqdən aşağıdadırsa və ya divarın arxasındadırsa null.
 * rel — Günəşin divar normalına görə azimutu (−90…90 — qarşıda).
 */
export function lightDir(alt, az, wallAz) {
  const rel = wrap180(az - wallAz)
  if (!(alt > 0)) return null
  const ca = Math.cos(alt * RAD)
  const dz = ca * Math.cos(rel * RAD)
  if (dz <= 1e-3) return null
  return { x: -ca * Math.sin(rel * RAD), y: -Math.sin(alt * RAD), z: dz, rel }
}

/** Günəşin anlıq yeri və otaqdakı istiqamət — { alt, az, rel, dir|null } */
export function sunInRoom(ms, lat, lng, wallAz = wallAzimuth(lat)) {
  const s = sunHorizontal(ms, lat, lng)
  const dir = lightDir(s.alt, s.az, wallAz)
  return { alt: s.alt, az: s.az, rel: wrap180(s.az - wallAz), dir }
}

const AX = ['x', 'y', 'z']

/** Nöqtəni (x, y, z) d istiqamətində k oxu = v müstəvisinə sal; t < 0 → null */
export function projectToPlane(p, d, k, v) {
  const dk = d[AX[k]]
  if (Math.abs(dk) < 1e-9) return null
  const t = (v - p[k]) / dk
  if (t < 0) return null
  return [p[0] + t * d.x, p[1] + t * d.y, p[2] + t * d.z]
}

/** Çoxbucaqlını k oxu üzrə [min, max] zolağına kəs (Sutherland–Hodgman, iki yarımmüstəvi) */
export function clipPoly(poly, k, min, max) {
  const half = (pts, inside, cut) => {
    const out = []
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length]
      const ia = inside(a), ib = inside(b)
      if (ia) out.push(a)
      if (ia !== ib) {
        const t = (cut - a[k]) / (b[k] - a[k])
        out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])])
      }
    }
    return out
  }
  let r = half(poly, (p) => p[k] >= min, min)
  if (r.length) r = half(r, (p) => p[k] <= max, max)
  return r
}

/** Otağın işıq tuta bilən səthləri: [ad, ox, dəyər, [ox1, min, max], [ox2, min, max]] */
function surfaces(room, d) {
  const { w, h, d: depth } = room
  const s = [
    ['floor', 1, 0, [0, -w / 2, w / 2], [2, 0, depth]],
    ['back', 2, depth, [0, -w / 2, w / 2], [1, 0, h]],
  ]
  if (d.x > 0) s.push(['right', 0, w / 2, [1, 0, h], [2, 0, depth]])
  if (d.x < 0) s.push(['left', 0, -w / 2, [1, 0, h], [2, 0, depth]])
  return s
}

/**
 * Deşiklərin (z = 0 üzərində [[x, y], …]) otaqdakı işıq ləkələri.
 * → [{ surface: 'floor'|'back'|'left'|'right', poly: [[x, y, z], …] }]; d null → []
 */
export function lightPatches(openings, d, room = ROOM) {
  if (!d) return []
  const out = []
  const surf = surfaces(room, d)
  for (const o of openings) {
    const p3 = o.map(([x, y]) => [x, y, 0])
    for (const [name, k, v, c1, c2] of surf) {
      const proj = []
      for (const p of p3) {
        const q = projectToPlane(p, d, k, v)
        if (!q) { proj.length = 0; break }
        proj.push(q)
      }
      if (proj.length < 3) continue
      let poly = clipPoly(proj, c1[0], c1[1], c1[2])
      if (poly.length >= 3) poly = clipPoly(poly, c2[0], c2[1], c2[2])
      if (poly.length >= 3) out.push({ surface: name, poly })
    }
  }
  return out
}

/** Şüanın otaqda ilk dəydiyi nöqtə (z = 0-dakı p nöqtəsindən) */
export function firstHit(p, d, room = ROOM) {
  let best = null, bt = Infinity
  for (const [, k, v, c1, c2] of surfaces(room, d)) {
    const q = projectToPlane(p, d, k, v)
    if (!q) continue
    const t = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2])
    const eps = 1e-6
    if (q[c1[0]] < c1[1] - eps || q[c1[0]] > c1[2] + eps || q[c2[0]] < c2[1] - eps || q[c2[0]] > c2[2] + eps) continue
    if (t < bt) { bt = t; best = q }
  }
  return best
}

/** Çoxbucaqlının sahəsi və ağırlıq mərkəzi (müstəvi oxları a, b) */
export function polyCentroid(poly, a = 0, b = 2) {
  let A = 0, cx = 0, cy = 0
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length]
    const cr = p[a] * q[b] - q[a] * p[b]
    A += cr; cx += (p[a] + q[a]) * cr; cy += (p[b] + q[b]) * cr
  }
  if (Math.abs(A) < 1e-12) return { area: 0, c: [poly[0][a], poly[0][b]] }
  return { area: Math.abs(A / 2), c: [cx / (3 * A), cy / (3 * A)] }
}

/** Döşəmədəki işığın ümumi sahəsi və orta məsafəsi divardan (z) */
export function floorStats(patches) {
  let area = 0, zs = 0
  for (const p of patches) {
    if (p.surface !== 'floor') continue
    const { area: a, c } = polyCentroid(p.poly, 0, 2)
    area += a; zs += a * c[1]
  }
  return { area, meanZ: area ? zs / area : null }
}

/**
 * Səkkizguşəli ulduz şəbəkəsi (xatəm): hər xananın mərkəzində 8 guşəli ulduz,
 * xanaların künclərində kiçik romb. → deşiklər [[x, y], …] (z = 0 müstəvisində)
 */
export function latticeOpenings(win = WINDOW) {
  const { x0, x1, y0, y1, cells } = win
  const L = (x1 - x0) / cells
  const rows = Math.max(1, Math.round((y1 - y0) / L))
  const R = 0.43 * L, r = R * 0.8
  const out = []
  for (let j = 0; j < rows; j++) for (let i = 0; i < cells; i++) {
    const cx = x0 + (i + 0.5) * L, cy = y0 + (j + 0.5) * L
    const star = []
    for (let k = 0; k < 16; k++) {
      const a = (k * Math.PI) / 8, rr = k % 2 ? r : R
      star.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)])
    }
    out.push(star)
  }
  const q = 0.13 * L
  for (let j = 1; j < rows; j++) for (let i = 1; i < cells; i++) {
    const cx = x0 + i * L, cy = y0 + j * L
    out.push([[cx + q, cy], [cx, cy + q], [cx - q, cy], [cx, cy - q]])
  }
  return out
}

/** Saat qurşağında yerli gecəyarısı (epoch ms) — həmin anın yerli tarixi */
export function localMidnight(ms, tz) {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(ms)).map(x => [x.type, x.value]))
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second)
    const off = asUtc - Math.floor(ms / 1000) * 1000
    return Date.UTC(+p.year, +p.month - 1, +p.day) - off
  } catch {
    const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime()
  }
}

/** "HH:MM" → epoch ms (gecəyarısından); səhv sətir → null */
export function hhmmToMs(hhmm, midnight) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ''))
  return m ? midnight + (+m[1] * 60 + +m[2]) * 60000 : null
}
