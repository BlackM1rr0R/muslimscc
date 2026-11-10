// Hərfi barmaqla yazma məşqi (components/arabic/LetterTrace.jsx, v7: components/trace/*) — qiymətləndirmə
// (saf; tests/unit/trace-score.test.js, tests/unit/trace-engine.test.js)
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

// ═══════════════════════════════════════════════════════
// v7 iz mühərriki (components/trace/*) — eyni saf riyaziyyat, əlavələr:
//  • evaluate — örtük istifadəçi xəttinin GENİŞLƏNDİRİLMİŞ maskası ilə (fırça
//    hərfdən nazik olsa da örtük ədalətli olsun), kənara çıxma isə xam xətlə.
//  • groupRTL — sözü bitişik hərf qruplarına bölür və sağdan sola sıralayır
//    (kiçik hissələr — nöqtələr, həmzə — ən yaxın böyük qrupa qoşulur).
//  • checkOrder — qruplar ilk dəfə sağdan sola ardıcıllıqla başlanıbmı
//    (geri qayıdıb düzəltmək, nöqtə qoymaq qadağan deyil).
//  • LETTER_STROKES + checkLetterStart — 28 hərfdən yalnız yazılışı dəqiq
//    bilinənlər üçün başlanğıc tərəfi və ilk istiqamət; qalanlarında sıra
//    yoxlanılmır (uydurulmur), yalnız forma.
// ═══════════════════════════════════════════════════════

/** coverage — glyph-in neçə faizi (genişləndirilmiş) xətlə örtülüb; spill — xam xəttin neçə faizi "near"dan kənardadır */
export function evaluate(glyph, near, ink, w, h, r = 1) {
  const fat = r > 0 ? dilate(ink, w, h, r) : ink
  let g = 0, gHit = 0, inkN = 0, out = 0
  for (let i = 0; i < glyph.length; i++) {
    if (glyph[i]) { g++; if (fat[i]) gHit++ }
    if (ink[i]) { inkN++; if (!near[i]) out++ }
  }
  const coverage = g ? gHit / g : 0
  const spill = inkN ? out / inkN : 0
  return { coverage, spill, stars: starsFor(coverage, spill) }
}

/** Tamamlanma həddi (uşaq rejimi daha yumşaq) */
export const THRESHOLDS = Object.freeze({
  normal: { coverage: 0.78, spill: 0.3 },
  kid: { coverage: 0.62, spill: 0.45 },
})
export function isComplete(score, th = THRESHOLDS.normal) {
  return !!score && score.coverage >= th.coverage && score.spill <= th.spill
}

/** 8-qonşulu bağlı hissələr. Qaytarır: labels (0 — boş, 1..n), comps [{n,minX,maxX,minY,maxY,sx,sy}] */
export function components(mask, w, h) {
  const labels = new Int32Array(w * h)
  const comps = []
  const stack = []
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || labels[i]) continue
    const id = comps.length + 1
    const c = { n: 0, minX: w, maxX: -1, minY: h, maxY: -1, sx: 0, sy: 0 }
    labels[i] = id; stack.push(i)
    while (stack.length) {
      const p = stack.pop(), x = p % w, y = (p - x) / w
      c.n++; c.sx += x; c.sy += y
      if (x < c.minX) c.minX = x
      if (x > c.maxX) c.maxX = x
      if (y < c.minY) c.minY = y
      if (y > c.maxY) c.maxY = y
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy
        if (yy < 0 || yy >= h) continue
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          if (xx < 0 || xx >= w) continue
          const q = yy * w + xx
          if (mask[q] && !labels[q]) { labels[q] = id; stack.push(q) }
        }
      }
    }
    comps.push(c)
  }
  return { labels, comps }
}

/**
 * Sözü yazılış sırası ilə qruplara böl (ərəbcə: sağdan sola).
 * Böyük hissə (ən böyüyün ≥ minShare payı) — ayrıca qrup; kiçiklər (nöqtə,
 * həmzə, hərəkə) üfüqi mərkəzi ən yaxın böyük qrupa qoşulur.
 * Qaytarır: { labels: Int16Array (0 — boş, 1..k qrup nömrəsi sıra ilə), groups: [{minX,maxX,minY,maxY,n}] }
 */
export function groupRTL(mask, w, h, { minShare = 0.12 } = {}) {
  const { labels, comps } = components(mask, w, h)
  if (!comps.length) return { labels: new Int16Array(w * h), groups: [] }
  const big = Math.max(...comps.map(c => c.n))
  const majors = comps.map((c, i) => ({ c, i })).filter(({ c }) => c.n >= big * minShare)
  // Sağdan sola: sağ kənarı (maxX) böyük olan əvvəl; bərabərdirsə mərkəz
  majors.sort((a, b) => (b.c.maxX - a.c.maxX) || (b.c.sx / b.c.n - a.c.sx / a.c.n))
  const groupOf = new Int16Array(comps.length + 1)
  const groups = majors.map(({ c, i }, k) => { groupOf[i + 1] = k + 1; return { minX: c.minX, maxX: c.maxX, minY: c.minY, maxY: c.maxY, n: c.n } })
  comps.forEach((c, i) => {
    if (groupOf[i + 1]) return
    const cx = c.sx / c.n
    let best = 0, bestD = Infinity
    groups.forEach((g, k) => {
      const d = cx < g.minX ? g.minX - cx : cx > g.maxX ? cx - g.maxX : 0
      if (d < bestD) { bestD = d; best = k }
    })
    groupOf[i + 1] = best + 1
    const g = groups[best]
    g.minX = Math.min(g.minX, c.minX); g.maxX = Math.max(g.maxX, c.maxX)
    g.minY = Math.min(g.minY, c.minY); g.maxY = Math.max(g.maxY, c.maxY); g.n += c.n
  })
  const out = new Int16Array(w * h)
  for (let p = 0; p < labels.length; p++) if (labels[p]) out[p] = groupOf[labels[p]]
  return { labels: out, groups }
}

/** Etiketləri r qədər genişləndir (boş xana ən yaxın etiketi alır) — xətt hərfin kənarından keçəndə də qrup tapılsın */
export function spreadLabels(labels, w, h, r) {
  const out = Int16Array.from(labels)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x
    if (labels[i]) continue
    let best = 0, bd = Infinity
    for (let dy = -r; dy <= r; dy++) {
      const yy = y + dy
      if (yy < 0 || yy >= h) continue
      for (let dx = -r; dx <= r; dx++) {
        const xx = x + dx
        if (xx < 0 || xx >= w) continue
        const l = labels[yy * w + xx]
        if (l) { const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = l } }
      }
    }
    out[i] = best
  }
  return out
}

/** Xəttin ən çox keçdiyi qrup (1..k) və ya 0. points — [{x,y}] maska koordinatlarında */
export function strokeGroup(points, groupLabels, w, h) {
  const votes = new Map()
  for (const p of points) {
    const x = Math.round(p.x), y = Math.round(p.y)
    if (x < 0 || y < 0 || x >= w || y >= h) continue
    const g = groupLabels[y * w + x]
    if (g) votes.set(g, (votes.get(g) || 0) + 1)
  }
  let best = 0, n = 0
  for (const [g, c] of votes) if (c > n || (c === n && g < best)) { best = g; n = c }
  return best
}

/** Xəttin BAŞLADIĞI qrup (ilk etiketli nöqtə) — "sağdakı hissədən başla" qaydası üçün; 0 — heç bir qrupa toxunmayıb */
export function strokeStartGroup(points, groupLabels, w, h) {
  for (const p of points) {
    const x = Math.round(p.x), y = Math.round(p.y)
    if (x < 0 || y < 0 || x >= w || y >= h) continue
    const g = groupLabels[y * w + x]
    if (g) return g
  }
  return 0
}

/**
 * Sıra yoxlaması: hər qrup İLK DƏFƏ sağdan sola ardıcıllıqla başlanmalıdır.
 * strokes — [{ group, len }] (zaman sırası ilə); len < minLen — nöqtə/toxunuş, sayılmır.
 * Qaytarır: { ok, wrongAt } — wrongAt: sırası pozulan ilk xəttin indeksi və ya -1
 */
export function checkOrder(strokes, minLen = 0) {
  let maxSeen = 0
  const seen = new Set()
  for (let i = 0; i < strokes.length; i++) {
    const s = strokes[i]
    if (!s.group || s.len < minLen || seen.has(s.group)) continue
    if (s.group < maxSeen) return { ok: false, wrongAt: i }
    seen.add(s.group); maxSeen = s.group
  }
  return { ok: true, wrongAt: -1 }
}

/** Xəttin uzunluğu */
export function pathLength(points) {
  let L = 0
  for (let i = 1; i < points.length; i++) L += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  return L
}

/**
 * Tək hərflərin əsas xətti: hansı tərəfdən başlanır və ilk hərəkət hansı istiqamətdədir.
 * side: 'top' — hərfin yuxarı yarısından, 'right' — sağ yarısından; dir: [dx, dy] (ekran: y aşağı).
 * Yalnız yazılışı şübhəsiz olanlar: əlif, lam (yuxarıdan aşağı); be/te/se, sin/şin (sağdan sola);
 * nun (sağ ucdan aşağı əyilərək); dal/zal, ra/ze (yuxarıdan aşağı). Nöqtələr əsas xətdən sonra qoyulur.
 * Qalan hərflərdə (ج ح ص ط ع ف ق ك م ه و ي …) sıra yoxlanılmır — yalnız forma.
 */
export const LETTER_STROKES = Object.freeze({
  'ا': { side: 'top', dir: [0, 1] },
  'ل': { side: 'top', dir: [0, 1] },
  'ب': { side: 'right', dir: [-1, 0.25] },
  'ت': { side: 'right', dir: [-1, 0.25] },
  'ث': { side: 'right', dir: [-1, 0.25] },
  'س': { side: 'right', dir: [-1, 0.25] },
  'ش': { side: 'right', dir: [-1, 0.25] },
  'ن': { side: 'right', dir: [-0.4, 1] },
  'د': { side: 'top', dir: [0.3, 1] },
  'ذ': { side: 'top', dir: [0.3, 1] },
  'ر': { side: 'top', dir: [-0.5, 1] },
  'ز': { side: 'top', dir: [-0.5, 1] },
})

/**
 * Hərfin əsas xətti düzgün başlanıbmı. points — ilk uzun xəttin nöqtələri;
 * box — hərfin çərçivəsi {minX,maxX,minY,maxY} (eyni koordinatlarda).
 * Qaytarır: { checked, ok, sideOk, dirOk }
 */
export function checkLetterStart(points, box, spec) {
  if (!spec || !points || points.length < 2) return { checked: false, ok: true, sideOk: true, dirOk: true }
  const bw = Math.max(1, box.maxX - box.minX), bh = Math.max(1, box.maxY - box.minY)
  const p0 = points[0]
  const nx = (p0.x - box.minX) / bw, ny = (p0.y - box.minY) / bh
  const sideOk = spec.side === 'top' ? ny <= 0.45 : spec.side === 'right' ? nx >= 0.55 : true
  // İlk hərəkət — yolun ilk ~30%-i
  const L = pathLength(points)
  let acc = 0, k = 1
  for (; k < points.length; k++) {
    acc += Math.hypot(points[k].x - points[k - 1].x, points[k].y - points[k - 1].y)
    if (acc >= L * 0.3) break
  }
  const q = points[Math.min(k, points.length - 1)]
  const vx = q.x - p0.x, vy = q.y - p0.y, vl = Math.hypot(vx, vy)
  const [dx, dy] = spec.dir, dl = Math.hypot(dx, dy)
  const dirOk = vl > 0 && (vx * dx + vy * dy) / (vl * dl) > 0.25
  return { checked: true, ok: sideOk && dirOk, sideOk, dirOk }
}

/** Hərf xəttinin orta qalınlığı (maska pikselində): 2 × sahə / kənar piksellər — fırçanı şriftə uyğunlaşdırmaq üçün */
export function strokeWidth(mask, w, h) {
  let area = 0, edge = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x
    if (!mask[i]) continue
    area++
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !mask[i - 1] || !mask[i + 1] || !mask[i - w] || !mask[i + w]) edge++
  }
  return edge ? (2 * area) / edge : 0
}

/** "Göstər" animasiyası üçün qələm yolu: hər sütunda glyph piksellərinin orta y-i, sağdan sola */
export function penPath(mask, w, h, box = { minX: 0, maxX: w - 1, minY: 0, maxY: h - 1 }) {
  const pts = []
  for (let x = box.maxX; x >= box.minX; x--) {
    let s = 0, n = 0
    for (let y = box.minY; y <= box.maxY; y++) if (mask[y * w + x]) { s += y; n++ }
    if (n) pts.push({ x, y: s / n })
  }
  return pts
}
