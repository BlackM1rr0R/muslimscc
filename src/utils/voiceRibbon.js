// ═══════════════════════════════════════════════════════
// voiceRibbon — "Səs heykəli" üçün saf funksiyalar (components/VoiceRibbon.jsx)
//
// • Səs TANINMIR və YAZILMIR: yalnız hər kadrın gücü (RMS) və tonu (əsas tezlik,
//   avtokorrelyasiya ilə) hesablanır, sonra lent həndəsəsinə çevrilir.
// • Lent sağdan sola (ərəb yazısı istiqaməti) gedir; şaquli mövqe — ton,
//   qalınlıq — güc, kənar forması — ~70° tutulmuş qələm ucu (qələmin enli ucu).
// • DOM, Web Audio, canvas yoxdur — vitest ilə sintetik sinus kadrlarında yoxlanır.
// ═══════════════════════════════════════════════════════

export const MIN_HZ = 70
export const MAX_HZ = 1000
/** Lentin şaquli diapazonu (log miqyas): kişi səsinin altı → uşaq/qadın səsinin yuxarısı */
export const LOW_HZ = 80
export const HIGH_HZ = 700
/** Qələm ucunun üfüqə bucağı (dərəcə) — xəttatın qələmi ~70° tutması kimi */
export const NIB_DEG = 70
/** Səssizlik həddi (RMS) — bundan aşağısı sıfır amplitudadır */
export const SILENCE_RMS = 0.008

/** Kadrın orta kvadratik gücü (0…1, Float32 −1…1 nümunələr üçün) */
export function rms(frame) {
  const n = frame?.length || 0
  if (!n) return 0
  let s = 0
  for (let i = 0; i < n; i++) s += frame[i] * frame[i]
  return Math.sqrt(s / n)
}

/**
 * Əsas tezlik (Hz) — normallaşdırılmış avtokorrelyasiya.
 * Qaytarır 0 — səssizlik və ya tonsuz (küy) kadr.
 * Oktava xətasının qarşısı: ilk çuxurdan sonra ən yüksək zirvənin 90%-nə
 * çatan İLK zirvə götürülür (subharmonik 2T yox, T).
 */
export function estimatePitch(frame, sampleRate, opts = {}) {
  const minHz = opts.minHz || MIN_HZ
  const maxHz = opts.maxHz || MAX_HZ
  const clarity = opts.clarity ?? 0.6
  const n = frame?.length || 0
  if (!n || !sampleRate) return 0
  if (rms(frame) < (opts.silence ?? SILENCE_RMS)) return 0
  const minLag = Math.max(2, Math.floor(sampleRate / maxHz))
  const maxLag = Math.min(Math.floor(sampleRate / minHz), Math.floor(n / 2))
  if (maxLag <= minLag + 2) return 0
  const win = n - maxLag // sabit pəncərə — bütün gecikmələr eyni sayda nümunə ilə
  let r0 = 0
  for (let i = 0; i < win; i++) r0 += frame[i] * frame[i]
  if (r0 <= 0) return 0
  const r = new Float64Array(maxLag + 2)
  for (let lag = minLag - 1; lag <= maxLag + 1 && lag < n; lag++) {
    let s = 0, e = 0
    for (let i = 0; i < win; i++) { const b = frame[i + lag] || 0; s += frame[i] * b; e += b * b }
    r[lag] = e > 0 ? s / Math.sqrt(r0 * e) : 0
  }
  // ilk çuxur (korrelyasiya enməyi dayandıranadək)
  let lag = minLag
  while (lag < maxLag && r[lag + 1] < r[lag]) lag++
  let best = -1
  for (let l = lag; l <= maxLag; l++) if (r[l] > best) best = r[l]
  if (best < clarity) return 0
  let pick = -1
  for (let l = Math.max(lag, minLag); l <= maxLag; l++) {
    if (r[l] >= 0.9 * best && r[l] >= r[l - 1] && r[l] >= r[l + 1]) { pick = l; break }
  }
  if (pick < 0) return 0
  // parabolik interpolyasiya — yarım-nümunə dəqiqliyi
  const a = r[pick - 1], b = r[pick], c = r[pick + 1]
  const den = a - 2 * b + c
  const shift = den !== 0 ? Math.max(-0.5, Math.min(0.5, 0.5 * (a - c) / den)) : 0
  return sampleRate / (pick + shift)
}

/** Eksponensial hamarlama: alpha — yeni dəyərin payı (0…1) */
export function smooth(prev, next, alpha) {
  if (!Number.isFinite(prev)) return next
  return prev + (next - prev) * alpha
}

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v)

/** Güc → amplituda (0…1). Səssizlik → 0; yuxarı hədd yumşaq doyur. */
export function loudnessToAmp(value, floor = SILENCE_RMS, ceil = 0.25) {
  if (!(value > floor)) return 0
  const t = clamp01((value - floor) / (ceil - floor))
  return Math.sqrt(t) // pıçıltı da görünsün
}

/** Ton → şaquli mövqe (0 — yuxarı, 1 — aşağı), log miqyas. hz ≤ 0 → null */
export function pitchToY(hz, low = LOW_HZ, high = HIGH_HZ, margin = 0.14) {
  if (!(hz > 0)) return null
  const t = clamp01(Math.log(hz / low) / Math.log(high / low))
  return margin + (1 - t) * (1 - 2 * margin)
}

/** Ton → rəng qarışığı (0 — qızılı, 1 — firuzəyi) */
export function pitchToHue(hz, low = LOW_HZ, high = HIGH_HZ) {
  if (!(hz > 0)) return 0.5
  return clamp01(Math.log(hz / low) / Math.log(high / low))
}

/**
 * Enli qələm: xəttin görünən qalınlığı xəttin istiqamətindən asılıdır.
 * strokeRad — xəttin bucağı (radian), width — ucun eni.
 * Qələm ucuna paralel xətt — saç kimi incə (minRatio), perpendikulyar — tam en.
 */
export function nibWidth(strokeRad, width, nibDeg = NIB_DEG, minRatio = 0.12) {
  const nib = (nibDeg * Math.PI) / 180
  const k = Math.abs(Math.sin(strokeRad - nib))
  return width * (minRatio + (1 - minRatio) * k)
}

/**
 * Seqment üçün qələm dördbucaqlısı: a, b — {x, y, w}; sabit bucaqlı uc
 * hər nöqtədə ±w/2 qədər sürüşdürülür (xəttatlıqda qalın/incə keçid budur).
 * Qaytarır [x0,y0, x1,y1, x2,y2, x3,y3].
 */
export function nibQuad(a, b, nibDeg = NIB_DEG) {
  const nib = (nibDeg * Math.PI) / 180
  const ux = Math.cos(nib) / 2, uy = -Math.sin(nib) / 2
  return [
    a.x + ux * a.w, a.y + uy * a.w,
    b.x + ux * b.w, b.y + uy * b.w,
    b.x - ux * b.w, b.y - uy * b.w,
    a.x - ux * a.w, a.y - uy * a.w,
  ]
}

/**
 * Lent qələmi — vəziyyət: x sağdan sola gedir, y ton ilə, en güc ilə.
 * step({hz, amp, dt}) → {x, y, w, hue, ink} ; ink=false — qələm qaldırılıb (səssizlik).
 * x 0…1 (1 — sağ kənar), y 0…1; sola çatanda wrap=true ilə yenidən sağdan başlayır.
 */
export function createPen(opts = {}) {
  const speed = opts.speed || 0.075 // vərəq eni / saniyə (~12 s bir sətir)
  const maxW = opts.maxW || 0.11 // vərəq hündürlüyünə nisbətən
  const start = 0.94, end = 0.06
  let x = start, y = 0.5, w = 0, hue = 0.5, logHz = NaN
  return {
    step({ hz = 0, amp = 0, dt = 1 / 60 }) {
      const d = Math.min(0.1, Math.max(0, dt))
      let wrap = false
      x -= speed * d
      if (x < end) { x = start; wrap = true }
      if (hz > 0) {
        logHz = smooth(logHz, Math.log(hz), Math.min(1, d * 9))
        const ty = pitchToY(Math.exp(logHz))
        y = smooth(y, ty, Math.min(1, d * 7))
        hue = smooth(hue, pitchToHue(Math.exp(logHz)), Math.min(1, d * 4))
      }
      w = smooth(w, amp * maxW, Math.min(1, d * (amp > w / maxW ? 14 : 6)))
      return { x, y, w, hue, ink: w > maxW * 0.02, wrap }
    },
  }
}

/**
 * Demo melodiyası (səs çalınmır): təkbirə bənzər ton konturu —
 * ifadələr, aralarda nəfəs (səssizlik). t — saniyə. Qaytarır {hz, amp}.
 */
const PHRASES = [
  // [müddət s, başlanğıc Hz, son Hz, vibrato]  — "Al-lā-hu ak-bar" kimi qalxıb enən xətlər
  [0.55, 160, 190, 0], [1.4, 190, 240, 1], [0.6, 240, 210, 0], [1.1, 210, 175, 1], [0.7, 0, 0, 0],
  [0.5, 175, 210, 0], [1.6, 210, 290, 1], [0.9, 290, 230, 1], [1.2, 230, 165, 0], [0.9, 0, 0, 0],
  [0.8, 150, 200, 1], [1.8, 200, 330, 1], [1.4, 330, 200, 1], [0.8, 200, 160, 0], [1.2, 0, 0, 0],
]
const PHRASE_TOTAL = PHRASES.reduce((s, p) => s + p[0], 0)

export function demoSample(t) {
  let u = ((t % PHRASE_TOTAL) + PHRASE_TOTAL) % PHRASE_TOTAL
  for (const [dur, a, b, vib] of PHRASES) {
    if (u < dur) {
      if (!a) return { hz: 0, amp: 0 }
      const k = u / dur
      const ease = k * k * (3 - 2 * k)
      const hz = a + (b - a) * ease + (vib ? Math.sin(t * 2 * Math.PI * 5.5) * 6 : 0)
      const env = Math.min(1, k * 6, (1 - k) * 5 + 0.25)
      const amp = Math.max(0, 0.55 + 0.35 * Math.sin(t * 1.7) * env) * Math.min(1, k * 8)
      return { hz, amp }
    }
    u -= dur
  }
  return { hz: 0, amp: 0 }
}

/** Qızılı (0) ↔ firuzəyi (1) rəng qarışığı — "r,g,b" sətri */
export function ribbonRgb(hue) {
  const g = [233, 190, 98], q = [64, 214, 200]
  const h = clamp01(hue)
  return g.map((c, i) => Math.round(c + (q[i] - c) * h)).join(',')
}
