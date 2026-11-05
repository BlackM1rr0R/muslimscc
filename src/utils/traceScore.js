// Hərfi barmaqla yazma məşqi (components/arabic/LetterTrace.jsx) — qiymətləndirmə (saf; tests/unit/trace-score.test.js)
//
// Giriş: iki eyni ölçülü maska (Uint8 / boolean massiv):
//   glyph — hərfin piksellər (şablon), ink — istifadəçinin xətti (qalın fırça ilə)
// coverage — hərfin neçə faizi örtülüb; spill — mürəkkəbin neçə faizi hərfdən kənardadır
// (kənar yoxlanılarkən hərf bir az genişləndirilmiş sayılır — "near" maskası).

export function traceScore(glyph, near, ink) {
  let g = 0, gHit = 0, inkN = 0, out = 0
  for (let i = 0; i < glyph.length; i++) {
    if (glyph[i]) { g++; if (ink[i]) gHit++ }
    if (ink[i]) { inkN++; if (!near[i]) out++ }
  }
  const coverage = g ? gHit / g : 0
  const spill = inkN ? out / inkN : 0
  return { coverage, spill, stars: starsFor(coverage, spill) }
}

/** 0–3 ulduz: örtük çox, kənara çıxma az olmalıdır */
export function starsFor(coverage, spill) {
  if (coverage >= 0.8 && spill <= 0.22) return 3
  if (coverage >= 0.62 && spill <= 0.35) return 2
  if (coverage >= 0.4 && spill <= 0.5) return 1
  return 0
}

/** Maskanı r piksel genişləndir (kvadrat pəncərə, sadə və kifayət qədər sürətli) */
export function dilate(mask, w, h, r) {
  const out = new Uint8Array(mask.length)
  // Əvvəl üfüqi, sonra şaquli keçid (ayrıla bilən)
  const tmp = new Uint8Array(mask.length)
  for (let y = 0; y < h; y++) {
    let run = -1e9
    for (let x = 0; x < w; x++) { if (mask[y * w + x]) run = x; if (x - run <= r) tmp[y * w + x] = 1 }
    run = 1e9
    for (let x = w - 1; x >= 0; x--) { if (mask[y * w + x]) run = x; if (run - x <= r) tmp[y * w + x] = 1 }
  }
  for (let x = 0; x < w; x++) {
    let run = -1e9
    for (let y = 0; y < h; y++) { if (tmp[y * w + x]) run = y; if (y - run <= r) out[y * w + x] = 1 }
    run = 1e9
    for (let y = h - 1; y >= 0; y--) { if (tmp[y * w + x]) run = y; if (run - y <= r) out[y * w + x] = 1 }
  }
  return out
}
