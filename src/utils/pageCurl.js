// ═══════════════════════════════════════════════════════
// Mushafda vərəqi barmaqla çevirmək — saf riyaziyyat (DOM-suz, testlənir)
//
// Model: vərəq (leaf) w×h düzbucaqlıdır, öz koordinatlarında (0,0 — sol üst).
//   O — barmağın tutduğu XARİCİ kənardakı nöqtə (cildin əks tərəfi),
//   P — kağızın tutulan nöqtəsinin indiki yeri (barmaq).
// Qatlanma xətti OP parçasının orta perpendikulyarıdır (kağızı qatlayanda
// O nöqtəsi P-yə düşür). Xəttin O tərəfindəki hissə (cut) "qalxır":
//   • altdakı səhifə həmin hissədə görünür (clip-path: cut);
//   • qalxan qanad (flap) — cut hissəsinin qatlanma xəttinə görə əks
//     inikası (CSS matrix). Əks inikas involyusiyadır, ona görə qanadın öz
//     clip-path-ı da elə cut çoxbucaqlısıdır.
// Mushaf sağdan sola oxunur: NÖVBƏTİ səhifə SOLDADIR — sol kənardan sağa
// çəkmək (dir=+1) növbəti, sağ kənardan sola (dir=-1) əvvəlki səhifədir.
// ═══════════════════════════════════════════════════════

export const CURL = {
  threshold: 0.35,     // yolun 35%-i keçilibsə — vərəq çevrilir
  fling: 0.5,          // px/ms (≈500 px/s) — sürətli atma
  slop: 10,            // px — bundan az hərəkət toxunuşdur (söz/ayə kliki işləsin)
  horiz: 1.2,          // |dx| > |dy|·1.2 — əsasən üfüqi hərəkət (şaquli scroll pozulmasın)
  edgeFrac: 0.2,       // siçan: kənar zolağı vərəq eninin 20%-i…
  edgeMin: 48,         // …ən azı 48px
  tilt: 0.2,           // küncdən tutanda qatın avtomatik əyilməsi
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

/**
 * Göstəricinin harada başladığına görə vərəqləməni başlatmaq olarmı.
 * x — vərəq qutusuna nisbətən (0..w). Siçan: yalnız xarici kənar zolağı
 * (mətn seçimi, sözə klik toxunulmaz qalsın). Toxunuş/qələm: hər yer —
 * istiqaməti sonra hərəkət müəyyən edir (köhnə "sürüşdürmə" jesti bununla əvəzlənir).
 * Qaytarır: +1 (yalnız növbəti), -1 (yalnız əvvəlki), 0 (hər ikisi — hərəkətə görə), null (yox).
 */
export function curlZone(x, w, pointerType = 'mouse', { edgeFrac = CURL.edgeFrac, edgeMin = CURL.edgeMin } = {}) {
  if (!(w > 0) || x < 0 || x > w) return null
  if (pointerType !== 'mouse') return 0
  const edge = Math.min(w / 2, Math.max(edgeMin, w * edgeFrac))
  if (x <= edge) return 1
  if (x >= w - edge) return -1
  return null
}

/**
 * Jest vərəqləmədirmi? dx,dy — başlanğıcdan sürüşmə.
 * 'pending' — hələ qərar yoxdur, 'scroll' — şaquli (brauzerə burax), 'curl' — başla.
 */
export function classifyDrag(dx, dy, { slop = CURL.slop, horiz = CURL.horiz } = {}) {
  if (Math.hypot(dx, dy) < slop) return 'pending'
  return Math.abs(dx) > Math.abs(dy) * horiz ? 'curl' : 'scroll'
}

/**
 * Barmağın sürüşməsindən kağızın tutulan nöqtəsini (P) hesablayır.
 * dir: +1 (sağa çəkilir), -1 (sola). Geri (kənardan çölə) çəkmək olmaz;
 * şaquli əyilmə məhduddur (qat həddindən çox maili olmasın), küncə yaxın
 * tutanda qat azca maili düşür — kağız küncdən qalxır.
 */
export function curlPointer({ o, dx, dy, h, dir, tilt = CURL.tilt }) {
  const ax = Math.max(0, dx * dir)
  const bias = h > 0 ? -((o.y - h / 2) / (h / 2)) * ax * tilt : 0
  const ey = clamp(dy + bias, -0.5 * ax, 0.5 * ax)
  return { x: o.x + dir * ax, y: o.y + ey }
}

/** Yolun neçə faizi keçilib (0..1+). travel — tam çevrilmə üçün barmaq yolu. */
export function turnProgress(dx, travel, dir) {
  if (!(travel > 0)) return 0
  return Math.max(0, (dx * dir) / travel)
}

/** Buraxanda: tamamla (true) və ya yerinə qaytar (false). v — px/ms, çevrilmə istiqamətində müsbət. */
export function shouldComplete(progress, v = 0, { threshold = CURL.threshold, fling = CURL.fling } = {}) {
  if (v <= -fling) return false              // geri atıldı
  if (v >= fling && progress > 0.03) return true
  return progress >= threshold
}

/** Son nümunələrdən sürət (px/ms) — [{x, t}] , ən çox son 100ms */
export function velocityFrom(samples, windowMs = 100) {
  if (!samples || samples.length < 2) return 0
  const last = samples[samples.length - 1]
  // Pəncərə daxilindəki ən köhnə nümunə (dayanıb sonra atmaq da "atma" sayılsın)
  let i = samples.length - 2
  while (i > 0 && last.t - samples[i - 1].t <= windowMs) i--
  const first = samples[i]
  const dt = last.t - first.t
  return dt > 0 ? (last.x - first.x) / dt : 0
}

/**
 * Qatlanma həndəsəsi. w,h — vərəq; o — tutulan kənar nöqtəsi; p — indiki yer.
 * Qaytarır: { cut, rest, matrix, mid, n, len }
 *   cut  — O tərəfdəki hissə (çoxbucaqlı, [[x,y]…]) — qalxır;
 *   rest — qalan hissə; matrix — [a,b,c,d,e,f] (CSS matrix, transform-origin 0 0)
 *          qatlanma xəttinə görə əks inikas; n — xəttin normalı (O-dan P-yə),
 *   len — |OP|.
 */
export function foldGeometry(w, h, o, p) {
  const vx = p.x - o.x
  const vy = p.y - o.y
  const len = Math.hypot(vx, vy)
  const rect = [[0, 0], [w, 0], [w, h], [0, h]]
  if (len < 1e-6) {
    return { cut: [], rest: rect, matrix: [1, 0, 0, 1, 0, 0], mid: { x: o.x, y: o.y }, n: { x: 0, y: 0 }, len: 0 }
  }
  const n = { x: vx / len, y: vy / len }
  const mid = { x: (o.x + p.x) / 2, y: (o.y + p.y) / 2 }
  const side = ([x, y]) => (x - mid.x) * n.x + (y - mid.y) * n.y  // < 0 — O tərəfi
  const cut = clipPolygon(rect, pt => -side(pt))
  const rest = clipPolygon(rect, side)
  // Əks inikas: R = I − 2·n·nᵀ, t = 2·(mid·n)·n
  const a = 1 - 2 * n.x * n.x
  const b = -2 * n.x * n.y
  const d = 1 - 2 * n.y * n.y
  const k = 2 * (mid.x * n.x + mid.y * n.y)
  return { cut, rest, matrix: [a, b, b, d, k * n.x, k * n.y], mid, n, len }
}

/** Sutherland–Hodgman: çoxbucaqlının f(pt) ≥ 0 olan hissəsi */
export function clipPolygon(poly, f) {
  const out = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const fa = f(a)
    const fb = f(b)
    if (fa >= 0) out.push(a)
    if ((fa >= 0) !== (fb >= 0)) {
      const t = fa / (fa - fb)
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
    }
  }
  return out
}

/** Nöqtəni matrislə çevirir (testlər və kölgə üçün) */
export function applyMatrix([a, b, c, d, e, f], [x, y]) {
  return [a * x + c * y + e, b * x + d * y + f]
}

const r1 = v => Math.round(v * 10) / 10
export function polygonCss(pts) {
  if (!pts || pts.length < 3) return 'polygon(0 0, 0 0, 0 0)'
  return `polygon(${pts.map(([x, y]) => `${r1(x)}px ${r1(y)}px`).join(', ')})`
}
export function matrixCss(m) {
  return `matrix(${m.map(v => Math.round(v * 10000) / 10000).join(', ')})`
}

/**
 * CSS linear-gradient-in bucağı və M nöqtəsinin gradient xəttindəki yeri (px).
 * g — gradientin istiqaməti (vahid vektor). CSS: 0deg — yuxarı, 90deg — sağa;
 * rəng dayanacağı px ilə başlanğıc nöqtəsindən ölçülür.
 */
export function gradientAt(w, h, m, g) {
  const ang = Math.atan2(g.x, -g.y)
  const L = Math.abs(w * Math.sin(ang)) + Math.abs(h * Math.cos(ang))
  const at = L / 2 + (m.x - w / 2) * g.x + (m.y - h / 2) * g.y
  return { deg: r1((ang * 180) / Math.PI), at: r1(at), L }
}

/** Kritik sönümlü yay: bir addım (yarı-implisit Eyler). v — px/ms, dt — ms */
export function springStep(x, v, target, dt, { k = 0.0004, c = 0.038 } = {}) {
  const step = Math.min(dt, 32)
  const a = -k * (x - target) - c * v
  const nv = v + a * step
  return { x: x + nv * step, v: nv }
}
