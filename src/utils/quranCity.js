// ═══════════════════════════════════════════════════════
// Quran şəhəri — saf tərtibat məntiqi (components/QuranCity.jsx)
//
// • 114 surə = 114 bina. Gövdənin hündürlüyü ayə sayının kvadrat kökü ilə
//   artır (286 ayəli Bəqərə ilə 3 ayəli Kövsər eyni şəkildə oxunsun).
// • Tac (günbəz, minarə, sivri tağ, soğanvari günbəz, qoşa minarə) qəti
//   qaydadır: (n·5 + ayə sayı) mod 5 — hər açılışda eyni şəhər.
// • Siluet və pəncərələr SVG path sətiri kimi qurulur — həm SVG-də, həm
//   PNG ixracında (canvas Path2D) eyni forma çəkilir.
// • Oxunan surələr: localStorage 'quran_stats'.reads (QuranPage.jsx yazır) —
//   burada YALNIZ oxunur.
// ═══════════════════════════════════════════════════════

export const GROUND = 400          // yer xətti (SVG vahidi)
export const SKY_H = 430           // SVG hündürlüyü
export const GAP = 5               // binalar arası məsafə
export const PAD = 14              // şəhərin kənar boşluğu
export const CROWNS = ['dome', 'minaret', 'arch', 'onion', 'twin']
export const STATS_KEY = 'quran_stats'

const r1 = (v) => Math.round(v * 10) / 10

/** Gövdə hündürlüyü — ayə sayına görə ciddi artan (sqrt miqyası) */
export const bodyHeight = (ayahs) => 30 + 15 * Math.sqrt(Math.max(1, ayahs))
/** Gövdə eni — uzun surə bir az enli olur */
export const bodyWidth = (ayahs) => r1(16 + 1.3 * Math.sqrt(Math.max(1, ayahs)))
/** Tac növü — qəti qayda */
export const crownOf = (n, ayahs) => CROWNS[(n * 5 + ayahs) % CROWNS.length]

/** Tac (və gövdə) siluetinin path-i; ən uca nöqtənin y-i ilə */
export function silhouette(x, w, h, crown, ground = GROUND) {
  const top = r1(ground - h), cx = r1(x + w / 2), R = x + w
  const p = []
  let tip
  switch (crown) {
    case 'dome': {
      const r = w / 2
      p.push(`M${x} ${ground}V${top}A${r1(r)} ${r1(r * 0.95)} 0 0 1 ${R} ${top}V${ground}Z`)
      tip = top - r * 0.95
      break
    }
    case 'onion': {
      const r = w / 2
      const peak = r1(top - r * 1.7)
      p.push(`M${x} ${ground}V${top}C${r1(x - 2)} ${r1(top - r * 0.7)} ${r1(cx - 1)} ${r1(top - r * 1.15)} ${cx} ${peak}` +
        `C${r1(cx + 1)} ${r1(top - r * 1.15)} ${r1(R + 2)} ${r1(top - r * 0.7)} ${R} ${top}V${ground}Z`)
      tip = peak
      break
    }
    case 'arch': {
      // Sivri (iki mərkəzli) tağ
      const peak = r1(top - w * 0.75)
      p.push(`M${x} ${ground}V${top}Q${x} ${r1(top - w * 0.55)} ${cx} ${peak}Q${R} ${r1(top - w * 0.55)} ${R} ${top}V${ground}Z`)
      tip = peak
      break
    }
    case 'minaret': {
      // Gövdə + şərəfə (eyvan) + nazik lülə + konus
      const sw = Math.max(5, w * 0.42), sx = r1(cx - sw / 2), shaft = Math.min(46, 16 + h * 0.12)
      const bal = r1(top - 3), sTop = r1(bal - shaft), cone = r1(sTop - sw * 1.4)
      p.push(`M${x} ${ground}V${top}H${r1(x + w * 0.1)}V${bal}H${sx}V${sTop}H${r1(sx - 1.5)}L${cx} ${cone}L${r1(sx + sw + 1.5)} ${sTop}H${r1(sx + sw)}V${bal}H${r1(R - w * 0.1)}V${top}H${R}V${ground}Z`)
      // şərəfə çıxıntısı
      p.push(`M${r1(sx - 2)} ${r1(bal - shaft * 0.45)}h${r1(sw + 4)}v2.4h${r1(-(sw + 4))}Z`)
      tip = cone
      break
    }
    default: { // twin — yastı dam, iki künc minarəsi
      const mw = Math.max(3, w * 0.2), mh = Math.min(30, 10 + h * 0.1)
      const mt = r1(top - mh)
      p.push(`M${x} ${ground}V${mt}L${r1(x + mw / 2)} ${r1(mt - mw * 1.6)}L${r1(x + mw)} ${mt}V${r1(top - 4)}` +
        `Q${cx} ${r1(top - w * 0.38)} ${r1(R - mw)} ${r1(top - 4)}V${mt}L${r1(R - mw / 2)} ${r1(mt - mw * 1.6)}L${R} ${mt}V${ground}Z`)
      tip = Math.min(mt - mw * 1.6, top - w * 0.38)
    }
  }
  // Uc (şiş) — bütün taclarda
  const t = r1(tip)
  p.push(`M${r1(cx - 0.6)} ${t}V${r1(t - 7)}H${r1(cx + 0.6)}V${t}Z`)
  return { d: p.join(''), tipY: r1(t - 7) }
}

// Pəncərə şəbəkəsi qlobal addımlara bağlıdır (WX × WY): SVG-də bir <pattern> ilə
// (hər binaya bir <rect>, yüngül DOM), PNG-də eyni yerlərdə path ilə çəkilir.
export const WX = 6, WY = 10
/** Bir kafes daxilində pəncərənin (tağlı) forması — kafesin sol-üst küncündən */
export const WINDOW_TILE = 'M1.8 8V3l1.3-1.3L4.4 3v5Z'

/** Bina üçün pəncərə şəbəkəsi: ilk sütun (qlobal), sütun və sıra sayı, rect */
export function windowGrid(x, w, h, ground = GROUND) {
  const c0 = Math.ceil((x + 0.7) / WX)
  const c1 = Math.floor((x + w - 6.9) / WX)
  const cols = Math.max(1, c1 - c0 + 1)
  const rows = Math.max(1, Math.floor((h - 24.3) / WY) + 1)
  return { c0, cols, rows, x: c0 * WX, y: ground - WY - rows * WY, w: cols * WX, h: rows * WY }
}

/** Pəncərələr path kimi (PNG ixracı üçün) + sayı */
export function windowsPath(x, w, h, ground = GROUND) {
  const g = windowGrid(x, w, h, ground)
  const parts = []
  for (let r = 0; r < g.rows; r++) {
    const y = g.y + r * WY
    for (let c = 0; c < g.cols; c++) parts.push(`M${r1((g.c0 + c) * WX + 1.8)} ${y + 8}v-5l1.3 -1.3l1.3 1.3v5Z`)
  }
  return { d: parts.join(''), count: g.rows * g.cols, grid: g }
}

/** Tağlı qapı */
export function doorPath(x, w, ground = GROUND) {
  const dw = r1(Math.min(6, w * 0.3)), dx = r1(x + w / 2 - dw / 2)
  return `M${dx} ${ground}v-7q${r1(dw / 2)} -4 ${dw} 0v7Z`
}

/**
 * Şəhəri qur.
 * @param {Array} table   SURAH_TABLE (mushafIndex: [.., .., ayə sayı, .., ərəb, latın])
 * @param {Array} place   REVELATION_PLACE (0 Məkki, 1 Mədəni)
 * @param {number[]} [only] yalnız bu surələr (1-dən), sırası ilə — ixracın sıraları üçün
 */
export function buildCity(table, place, only = null) {
  const nums = only || table.map((_, i) => i + 1)
  let x = PAD
  const towers = nums.map((n) => {
    const ayahs = table[n - 1][2]
    const w = bodyWidth(ayahs), h = bodyHeight(ayahs), crown = crownOf(n, ayahs)
    const sil = silhouette(r1(x), w, h, crown)
    const win = windowsPath(r1(x), w, h)
    const t = { n, ayahs, medinan: place[n - 1] === 1, x: r1(x), w, h, crown, d: sil.d, tipY: sil.tipY, win: win.d, grid: win.grid, door: doorPath(r1(x), w), windows: win.count }
    x += w + GAP
    return t
  })
  const width = r1(x - GAP + PAD)
  const top = Math.min(...towers.map(t => t.tipY))
  return { towers, width, height: SKY_H, top }
}

/** Oxunan surələr (Set) — 'quran_stats'.reads açarları; pozuq yaddaş → boş */
export function readLitSurahs(storage) {
  const out = new Set()
  try {
    const st = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null)
    if (!st) return out
    const v = JSON.parse(st.getItem(STATS_KEY))
    const reads = v && typeof v === 'object' && !Array.isArray(v) ? v.reads : null
    if (!reads || typeof reads !== 'object' || Array.isArray(reads)) return out
    for (const [k, c] of Object.entries(reads)) {
      const n = Number(k)
      if (Number.isInteger(n) && n >= 1 && n <= 114 && Number(c) > 0) out.add(n)
    }
  } catch { /* pozuq JSON və ya bağlı yaddaş */ }
  return out
}

/** Qəti psevdo-təsadüfi ulduzlar (mulberry32) */
export function makeStars(count, w, h, seed = 114) {
  let a = seed >>> 0
  const rnd = () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return Array.from({ length: count }, (_, i) => ({
    x: r1(rnd() * w), y: r1(rnd() * h), r: r1(0.5 + rnd() * 1.3), tw: i % 3 === 0, delay: r1(rnd() * 4),
  }))
}

/** Surələri ixrac üçün sıralara böl (bərabər say) */
export function splitRows(total = 114, rows = 3) {
  const per = Math.ceil(total / rows)
  return Array.from({ length: rows }, (_, r) => Array.from({ length: Math.min(per, total - r * per) }, (_, i) => r * per + i + 1))
}
