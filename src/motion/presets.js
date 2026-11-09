// ═══════════════════════════════════════════════════════
// Motion tokenləri (dizayn v6, DESIGN.md §7.3) — SAF modul (React/DOM yoxdur,
// tests/unit/motion-presets.test.js yoxlayır).
//
// Bir ritm: giriş (enter) yumşaq, çıxış (exit) ~60–65% qısa və sürətlənən
// (UI UX Pro Max: exit-faster-than-enter, easing, spring-physics, motion-consistency).
// Yalnız transform / opacity / kiçik filter(blur) animasiya olunur.
// motion.css-dəki CSS tokenləri ilə eyni: --dur-1 150 · --dur-2 240 · --dur-3 360 · --dur-4 560 ms.
// ═══════════════════════════════════════════════════════

/** Müddətlər, saniyə ilə (Motion saniyə işlədir). exit = enter × EXIT_RATIO */
export const DUR = Object.freeze({ xs: 0.15, sm: 0.24, md: 0.36, lg: 0.56, xl: 0.8 })
export const EXIT_RATIO = 0.62

/** Çıxış müddəti: girişin ~62%-i, ən az 90 ms */
export function exitDur(enter = DUR.md) {
  return Math.max(0.09, Math.round(enter * EXIT_RATIO * 1000) / 1000)
}

/** Əyrilər (cubic-bezier). out — gələndə yavaşlayır, in — gedəndə sürətlənir. */
export const EASE = Object.freeze({
  out: [0.16, 1, 0.3, 1],        // ease-out-expo (wow.css --wow-ease ilə eyni)
  inOut: [0.65, 0, 0.35, 1],
  in: [0.4, 0, 1, 1],            // çıxış
  linear: [0, 0, 1, 1],          // yalnız sabit sürətli fırlanma/axın
})

/** Yaylar. snappy — indikator/hap, soft — kart/dialoq, gentle — böyük səth, bouncy — kiçik nişan/toast */
export const SPRING = Object.freeze({
  snappy: { type: 'spring', stiffness: 520, damping: 40, mass: 0.8 },
  soft: { type: 'spring', stiffness: 300, damping: 30, mass: 0.9 },
  gentle: { type: 'spring', stiffness: 170, damping: 26, mass: 1 },
  bouncy: { type: 'spring', stiffness: 420, damping: 22, mass: 0.7 },
})

/** Giriş keçidi (tween) */
export const enterT = (d = DUR.lg, delay = 0) => ({ duration: d, ease: EASE.out, delay })
/** Çıxış keçidi — həmişə girişdən qısa, sürətlənən */
export const exitT = (enter = DUR.lg) => ({ duration: exitDur(enter), ease: EASE.in })

/** Növbə (stagger): i-ci uşağın gecikməsi, saniyə. max-dan sonrakılar max-ın gecikməsi ilə. */
export function staggerDelay(i, step = 0.05, max = 10, base = 0) {
  const n = Math.max(0, Math.min(Number(i) || 0, max))
  return Math.round((base + n * step) * 1000) / 1000
}

// ── Variantlar ──
// Hamısının üç vəziyyəti var: hidden (başlanğıc), show (görünür), exit (çıxış).
// "hidden" ANİ qoyulur (duration 0) — Reveal elementi yalnız ekrandan kənarda
// və ya mount-dan dərhal sonra (boyamadan əvvəl) gizlədir; yanıb-sönmə olmur.
const instant = { duration: 0 }

/** from — gizli vəziyyət; show onun "sıfır" halıdır (yalnız from-dakı açarlar) */
function variant(from, enterDur = DUR.lg) {
  const rest = { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }
  const to = Object.fromEntries(Object.keys(from).map(k => [k, rest[k]]))
  return {
    hidden: { ...from, transition: instant },
    // custom: { delay, duration } — Stagger/Reveal ötürür
    show: (custom) => ({ ...to, transition: enterT(custom?.duration ?? enterDur, custom?.delay ?? 0) }),
    exit: { ...from, transition: exitT(enterDur) },
  }
}

export const fadeUp = variant({ opacity: 0, y: 16 })
export const fadeIn = variant({ opacity: 0 }, DUR.md)
export const blurIn = variant({ opacity: 0, y: 10, filter: 'blur(8px)' }, DUR.xl)
export const scaleIn = variant({ opacity: 0, scale: 0.94 }, DUR.md)
export const slideStart = variant({ opacity: 0, x: -24 })   // RTL-də komponent x-in işarəsini çevirir
export const VARIANTS = Object.freeze({ fadeUp, fadeIn, blurIn, scaleIn, slideStart })

/** Telefonda blur yoxdur (bahalıdır) — blurIn → fadeUp */
export function pickVariant(name = 'fadeUp', { coarse = false } = {}) {
  if (name === 'blurIn' && coarse) return fadeUp
  return VARIANTS[name] || fadeUp
}

/** Növbəli konteyner: uşaqlar (StaggerItem) vəziyyət adını miras alır.
 *  Gecikmə staggerDelay ilə — max-dan sonrakı uşaqlar gözləmir (uzun siyahı ləngiməsin). */
export function staggerContainer(step = 0.05, delay = 0, max = 10) {
  return {
    hidden: { transition: instant },
    show: { transition: { delayChildren: (i) => staggerDelay(i, step, max, delay) } },
    exit: { transition: { delayChildren: (i, n) => staggerDelay(n - 1 - i, Math.min(step, 0.03), max) } },
  }
}

/** Səhifə keçidi (PageTransition). custom: { back, still (VT/azaldılmış — ani), leaving (CSS artıq çıxarıb) };
 *  phone — üfüqi (oxu istiqaməti), masaüstü — şaquli. */
export function pageVariants({ phone = false, rtl = false } = {}) {
  const sign = (back) => (rtl ? -1 : 1) * (back ? -1 : 1)
  return {
    enter: ({ back = false, still = false } = {}) => (still
      ? { opacity: 1, x: 0, y: 0, transition: instant }
      : phone ? { opacity: 0, x: 36 * sign(back), y: 0, transition: instant } : { opacity: 0, y: 10, x: 0, transition: instant }),
    center: ({ still = false } = {}) => (still
      ? { opacity: 1, x: 0, y: 0, transition: instant }
      : { opacity: 1, x: 0, y: 0, transition: phone ? { duration: 0.48, ease: [0.22, 1, 0.36, 1] } : enterT(DUR.md) }),
    exit: ({ still = false, leaving = false } = {}) => (still || leaving
      ? { opacity: 0, transition: instant }
      : { opacity: 0, transition: { duration: exitDur(DUR.sm), ease: EASE.in } }),
  }
}

/** Dok böyüməsi: kursorun ikona məsafəsinə görə miqyas (1 … max), range-dən uzaqda 1. */
export function dockScale(distance, { range = 120, max = 1.35 } = {}) {
  const d = Math.abs(Number(distance))
  if (!Number.isFinite(d) || d >= range) return 1
  // kosinus pəncərəsi — kənarda hamar, mərkəzdə max
  const k = (1 + Math.cos(Math.PI * d / range)) / 2
  return Math.round((1 + (max - 1) * k) * 1000) / 1000
}

/** Orbit: n element üçün dairə üzərində mövqelər (px), 0° — yuxarı, saat əqrəbi istiqamətində. */
export function orbitPositions(n, radius, offsetDeg = 0) {
  const out = []
  for (let i = 0; i < n; i++) {
    const a = ((offsetDeg + (360 / Math.max(1, n)) * i) - 90) * Math.PI / 180
    out.push({ x: Math.round(Math.cos(a) * radius * 100) / 100, y: Math.round(Math.sin(a) * radius * 100) / 100, angle: (offsetDeg + (360 / Math.max(1, n)) * i) % 360 })
  }
  return out
}

/** Kart dəstəsi: sürüşdürmə qərarı (px məsafə + px/s sürət) → -1 | 0 | 1 */
// Sola (mənfi x) atmaq — növbəti (1), sağa — əvvəlki (-1); kiçik hərəkət (<12px) sayılmır.
export function swipeDecision(offsetX, velocityX, { distance = 90, velocity = 500 } = {}) {
  const dx = Number(offsetX) || 0
  const vx = Number(velocityX) || 0
  if (Math.abs(dx) < 12) return 0
  if (Math.abs(dx) >= distance || (Math.abs(vx) >= velocity && Math.sign(vx) === Math.sign(dx))) return dx < 0 ? 1 : -1
  return 0
}
