// Qamış qələm (components/QalamPen.jsx) — enli ucluq həndəsəsi və nöqtə ölçü sistemi (saf; tests/unit/qalam.test.js)
//
// Koordinatlar ekrandakı kimidir: x sağa, y AŞAĞI. Bucaqlar isə adi riyazi
// qaydada — üfüqidən saat əqrəbinin əksinə (dərəcə): 70° ucluq "/" kimi dayanır.
//
// • Enli ucluq — uzunluğu w olan düz kəsik. Ucluq p0 → p1 sürüşəndə iz
//   ucluq kəsiyi ilə hərəkət vektorunun Minkovski cəmidir (paraleloqram),
//   ona görə xəttin qalınlığı = w · |sin(istiqamət − ucluq bucağı)|.
//   Ucluğa paralel hərəkət — saç kimi nazik, perpendikulyar — tam en.
// • Nöqtə (nuqta) — ucluğu basıb öz eni qədər çəkməklə alınan romb; xəttatlıqda
//   hərflərin ölçü vahidi. Əlifin hündürlüyü üst-üstə qoyulmuş nöqtələrlə ölçülür.
// • Əlif dairəsi — diametri əlifə bərabər çevrə; mütənasib hərflər onunla ölçülür.

export const DEG = Math.PI / 180
export const NIB_DEFAULT = 70
export const NIB_MIN = 0
export const NIB_MAX = 90
/** Ucluğun eni — kətanın eninə nisbətən */
export const WIDTH_MIN = 0.02
export const WIDTH_MAX = 0.06
export const WIDTH_DEFAULT = 0.04
/** Ucluğun özünün qalınlığı (paralel hərəkətdə xətt tam itməsin) — w-nin payı */
export const HAIRLINE = 0.06

/**
 * Əlif neçə nöqtədir — "çox vaxt belə öyrədilir", mütləq qayda deyil:
 * nəsxdə təxminən 5, süls xəttində məktəbdən asılı olaraq 7–9.
 */
export const ALIF_DOTS = Object.freeze({ naskh: 5, thuluth: Object.freeze([7, 8, 9]) })

/** Seçilə bilən hərflər (təkcə forma) */
export const LETTERS = Object.freeze(['ا', 'ب', 'ج', 'د', 'ر', 'س', 'ع', 'ف', 'ن', 'ه', 'و'])

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

/** Ucluq kəsiyinin yarım vektoru (ekran koordinatlarında) */
export function nibVector(angleDeg, w) {
  const a = angleDeg * DEG
  return { x: (w / 2) * Math.cos(a), y: -(w / 2) * Math.sin(a) }
}

/** Hərəkət istiqaməti (dərəcə, riyazi qayda, −180..180] */
export function dirAngle(p0, p1) {
  return Math.atan2(-(p1.y - p0.y), p1.x - p0.x) / DEG
}

/** İstiqamətə görə xəttin qalınlığı (ucluğun özünün qalınlığı ilə birgə) */
export function nibWidth(dirDeg, nibDeg, w) {
  return w * Math.max(HAIRLINE, Math.abs(Math.sin((dirDeg - nibDeg) * DEG)))
}

/** Xəttin nisbi qalınlığı 0..1 (oxunuş üçün) */
export function nibRatio(dirDeg, nibDeg) {
  return nibWidth(dirDeg, nibDeg, 1)
}

/**
 * p0 → p1 seqmentinin izi: dördbucaqlı [p0+n0, p1+n1, p1−n1, p0−n0].
 * w0/w1 — uclardakı en (təzyiq dəyişə bilər). Kəsiklər paralel olduğu üçün
 * ardıcıl seqmentlər boşluqsuz birləşir.
 */
export function nibQuad(p0, p1, angleDeg, w0, w1 = w0) {
  const a = nibVector(angleDeg, w0), b = nibVector(angleDeg, w1)
  return [
    { x: p0.x + a.x, y: p0.y + a.y },
    { x: p1.x + b.x, y: p1.y + b.y },
    { x: p1.x - b.x, y: p1.y - b.y },
    { x: p0.x - a.x, y: p0.y - a.y },
  ]
}

/** Nöqtə (romb): ucluq kəsiyi öz eni qədər ona perpendikulyar sürüşdürülür */
export function dotRhombus(cx, cy, angleDeg, w) {
  const a = angleDeg * DEG
  const n = { x: w * Math.cos(a), y: -w * Math.sin(a) } // ucluq boyunca
  const s = { x: w * Math.sin(a), y: w * Math.cos(a) } // ona perpendikulyar (aşağı-sağa)
  return [
    { x: cx + (n.x + s.x) / 2, y: cy + (n.y + s.y) / 2 },
    { x: cx + (n.x - s.x) / 2, y: cy + (n.y - s.y) / 2 },
    { x: cx - (n.x + s.x) / 2, y: cy - (n.y + s.y) / 2 },
    { x: cx - (n.x - s.x) / 2, y: cy - (n.y - s.y) / 2 },
  ]
}

/** Nöqtənin hündürlüyü və eni (şaquli/üfüqi ölçü) */
export function dotExtent(angleDeg, w) {
  const a = angleDeg * DEG
  const e = w * (Math.abs(Math.sin(a)) + Math.abs(Math.cos(a)))
  return { h: e, w: e }
}

/** Əlifin hündürlüyü: dots nöqtə üst-üstə */
export function alifHeight(dots, angleDeg, w) {
  return Math.max(1, dots) * dotExtent(angleDeg, w).h
}

/** Üst-üstə nöqtələr sütunu: [{ cx, cy, pts }] — yuxarıdan aşağı */
export function dotColumn(n, cx, yTop, angleDeg, w) {
  const h = dotExtent(angleDeg, w).h
  return Array.from({ length: Math.max(0, n) }, (_, i) => {
    const cy = yTop + h * (i + 0.5)
    return { cx, cy, pts: dotRhombus(cx, cy, angleDeg, w) }
  })
}

/** Göstərici hamarlaşdırma: əvvəlki nöqtədən xam nöqtəyə k payı qədər */
export function smoothPoint(prev, raw, k = 0.5) {
  if (!prev) return { ...raw }
  const out = { x: prev.x + (raw.x - prev.x) * k, y: prev.y + (raw.y - prev.y) * k }
  if (raw.w != null) out.w = (prev.w ?? raw.w) + (raw.w - (prev.w ?? raw.w)) * k
  return out
}

/** Təzyiq: yalnız qələm (stylus) üçün; siçan/toxunuşda 1 */
export function pressureScale(pointerType, pressure) {
  if (pointerType !== 'pen' || !(pressure > 0)) return 1
  return clamp(0.45 + 0.75 * pressure, 0.45, 1.2)
}

/**
 * Şablonun yerləşməsi (normal vahidlərdə). Ölçülər şriftdən gəlir:
 * alifM / letterM — 1000px şriftdə measureText nəticələri (actualBoundingBox*).
 * Hərf elə böyüdülür ki, şriftdəki əlif = alifH olsun; hərf qutusu (cx, cy)-də ortalanır.
 */
export function layoutGlyph(alifM, letterM, alifH, cx, cy) {
  const aH = (alifM.ascent + alifM.descent) || 1
  const size = (alifH / aH) * 1000
  const f = size / 1000
  const left = letterM.left * f, right = letterM.right * f
  const ascent = letterM.ascent * f, descent = letterM.descent * f
  const x = cx - (right - left) / 2
  const y = cy - (descent - ascent) / 2
  return {
    size, x, y,
    box: { minX: x - left, maxX: x + right, minY: y - ascent, maxY: y + descent },
  }
}

/** Faiz (0..100, tam) */
export const pct = (v) => Math.round(clamp(v || 0, 0, 1) * 100)
