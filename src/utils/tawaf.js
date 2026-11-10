// ═══════════════════════════════════════════════════════
// Təvaf simulyatorunun saf məntiqi (components/hajj/TawafSim.jsx)
//
//   • Kəbənin yuxarıdan həndəsəsi (metr; x — şərq, y — şimal, riyazi bucaq)
//   • Bucağın açılması (unwrap): barmağın hər hərəkətində bucaq fərqi (-π, π]
//   • Dövrə sayğacı: yalnız saat əqrəbinin ƏKSİNƏ (Kəbə solda) irəliləyiş sayılır;
//     geri hərəkət nəzərə alınmır (hacı nöqtəsi yerində qalır), irəliləyiş yalnız
//     əvvəlki ən uzaq nöqtə keçiləndə davam edir — dövrə Həcərül-Əsvəd xəttindən
//     yenidən keçəndə tamamlanır.
//   • Seqment: hacı hazırda Kəbənin hansı tərəfindədir (qeydlər üçün)
// ═══════════════════════════════════════════════════════

export const TAU = Math.PI * 2
export const CIRCUITS = 7
const DEG = Math.PI / 180

// ── Həndəsə (təxmini, metrlə) ──
// Divarlar: şimal-şərq (qapı divarı, Həcərül-Əsvəd → İraqi rüknü) ≈ 11.7 m,
// şimal-qərb (Hicr divarı, İraqi → Şami) ≈ 9.9 m. Qapı divarının xarici normalı
// ≈ 35° (şimal-şərq) — künclər təxminən dünya tərəflərinə baxır, Həcərül-Əsvəd
// küncü şərqdən bir az cənuba (≈ -15°).
const HALF_U = 11.7 / 2          // qapı divarı boyunca
const HALF_V = 9.9 / 2           // Hicr divarı boyunca
const NORMAL = 35 * DEG          // qapı divarının xarici normalı (v oxu)
const AXIS_U = NORMAL + Math.PI / 2 // Həcərül-Əsvəddən İraqi rükna doğru (u oxu)

/** Yerli (u, v) → dünya (x şərq, y şimal), metr */
export function local(u, v) {
  return {
    x: u * Math.cos(AXIS_U) + v * Math.cos(NORMAL),
    y: u * Math.sin(AXIS_U) + v * Math.sin(NORMAL),
  }
}

export const CORNERS = {
  stone:  local(-HALF_U, HALF_V),   // Həcərül-Əsvəd (şərq)
  iraqi:  local(HALF_U, HALF_V),    // İraqi rüknü (şimal)
  shami:  local(HALF_U, -HALF_V),   // Şami rüknü (qərb)
  yamani: local(-HALF_U, -HALF_V),  // Yəmani rüknü (cənub)
}

/** Nöqtənin mərkəzdən riyazi bucağı (radian, -π…π) */
export const angleOf = (p) => Math.atan2(p.y, p.x)

/** Həcərül-Əsvəd xəttinin bucağı — dövrələr buradan sayılır */
export const STONE_ANGLE = angleOf(CORNERS.stone)

/** Bucaq fərqini (-π, π] aralığına gətir */
export function wrapDelta(d) {
  let x = ((d + Math.PI) % TAU + TAU) % TAU - Math.PI
  if (x === -Math.PI) x = Math.PI
  return x
}

/** Bucağı [0, 2π) aralığına gətir */
export const norm = (a) => ((a % TAU) + TAU) % TAU

/** Künclərin Həcərül-Əsvəd xəttindən saat əqrəbinin əksinə məsafəsi (dərəcə) */
export const CORNER_OFFSET = Object.fromEntries(
  Object.entries(CORNERS).map(([k, p]) => [k, norm(angleOf(p) - STONE_ANGLE) / DEG]),
)

// Bir hərəkətdə bundan böyük sıçrayış (mərkəzin üstündən keçmək) nəzərə alınmır
const MAX_STEP = 150 * DEG
// Geri hərəkət irəliləyişdən ən çox bu qədər geri qala bilər (qayıtmaq uzun çəkməsin)
const MAX_BACK = 90 * DEG
// Bu qədər geri getdikdə "Kəbə solunuzda olsun" ipucu
export const HINT_BACK = 18 * DEG

/** Yeni simulyator vəziyyəti */
export function createTawaf() {
  return { progress: 0, raw: 0, last: null, back: 0 }
}

/** Dövrə sayı (0…7) — irəliləyişdən */
export const circuitsOf = (progress) => Math.min(CIRCUITS, Math.floor(progress / TAU + 1e-9))

/** Yeni toxunuş: barmaq harda olursa olsun, hacı nöqtəsindən davam edir */
export function grab(state) {
  return { ...state, raw: state.progress, last: null, back: 0 }
}

/**
 * Barmağın yeni bucağı (riyazi, radian). Qaytarır: { state, completed, backward }
 *   completed — bu hərəkətdə tamamlanan dövrələrin nömrələri (1…7)
 *   backward  — geri (saat əqrəbi istiqamətində) hərəkət ipucu göstərilsinmi
 */
export function move(state, angle) {
  if (state.last === null || !Number.isFinite(state.last)) {
    return { state: { ...state, last: angle }, completed: [], backward: false }
  }
  const d = wrapDelta(angle - state.last)
  if (Math.abs(d) > MAX_STEP) {
    return { state: { ...state, last: angle }, completed: [], backward: false }
  }
  return advanceBy({ ...state, last: angle }, d)
}

/** Bucaq qədər irəlilə (mənfi — geri; klaviatura və demo da bunu işlədir) */
export function advanceBy(state, d) {
  const max = CIRCUITS * TAU
  const raw = Math.max(state.progress - MAX_BACK, Math.min(state.raw + d, max))
  const back = d < 0 ? state.back - d : Math.max(0, state.back - d)
  const progress = Math.min(max, Math.max(state.progress, raw))
  const before = circuitsOf(state.progress), after = circuitsOf(progress)
  const completed = []
  for (let c = before + 1; c <= after; c++) completed.push(c)
  return {
    state: { ...state, raw, progress, back },
    completed,
    backward: back >= HINT_BACK,
  }
}

/** Növbəti dövrənin sonuna (Həcərül-Əsvəd xəttinə) qədər */
export function advanceCircuit(state) {
  const c = circuitsOf(state.progress)
  if (c >= CIRCUITS) return { state, completed: [], backward: false }
  const target = (c + 1) * TAU
  return advanceBy({ ...state, raw: state.progress }, target - state.progress)
}

/** Cari dövrədə qət edilən hissə (0…1); 7 tamamlananda 1 */
export function lapFraction(progress) {
  if (progress >= CIRCUITS * TAU) return 1
  return (progress % TAU) / TAU
}

/** Hacının hazırkı riyazi bucağı */
export const markerAngle = (progress) => STONE_ANGLE + (progress % TAU)

/**
 * Hacı Kəbənin hansı tərəfindədir:
 *   stone   — Həcərül-Əsvəd xəttində / ondan sonra az
 *   door    — qapı divarı boyunca (İraqi rüknünə qədər)
 *   hijr    — Hicr İsmailin yanında (İraqi → Şami)
 *   west    — Şami → Yəmani
 *   between — Yəmani rüknü ilə Həcərül-Əsvəd arası
 *   done    — 7 dövrə tamam
 */
export function segmentAt(progress) {
  if (progress >= CIRCUITS * TAU) return 'done'
  const deg = (progress % TAU) / DEG
  if (deg < 14) return 'stone'
  if (deg < CORNER_OFFSET.iraqi) return 'door'
  if (deg < CORNER_OFFSET.shami) return 'hijr'
  if (deg < CORNER_OFFSET.yamani - 6) return 'west'
  return 'between'
}

/** Cari (davam edən) dövrənin nömrəsi 1…7 */
export const currentCircuit = (progress) => Math.min(CIRCUITS, circuitsOf(progress) + 1)
