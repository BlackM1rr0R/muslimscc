// ═══════════════════════════════════════════════════════
// whenIdle() — ilk boyamadan / səhifə yüklənməsindən SONRA, brauzer boş
// olanda həll olunan vəd.
//
// NƏ: ilk ekran üçün vacib olmayan ağır işləri (Firebase SDK ~90 KB gzip +
// Firestore abunəlikləri, ekranın altındakı admin bölmələri, elan bildirişi)
// "load" hadisəsindən sonra, kiçik gecikmə ilə, requestIdleCallback ilə
// başladır (Safari-də requestIdleCallback yoxdur — setTimeout ehtiyatı).
// Gecikmə NİYƏ lazımdır: "load" modul skriptləri icra olunan kimi gəlir —
// səhifə chunk-ları hələ yüklənərkən əsas axın boşdur və requestIdleCallback
// dərhal işləyərdi (Lighthouse izində Firebase yenə LCP-dən əvvəl idi).
// NİYƏ: əvvəl bunlar ana səhifənin ilk render-ində yüklənirdi və LCP
// resursları (şrift, hero) ilə şəbəkə / əsas axın uğrunda yarışırdı.
// ═══════════════════════════════════════════════════════

let loaded = null

/** window "load" hadisəsi (artıq olubsa — dərhal). */
function afterLoad() {
  if (!loaded) {
    loaded = new Promise((resolve) => {
      if (typeof document === 'undefined' || document.readyState === 'complete') resolve()
      else window.addEventListener('load', () => resolve(), { once: true })
    })
  }
  return loaded
}

/**
 * @param {{ delay?: number, timeout?: number }} [opts]
 *   delay   — "load"-dan sonra ən azı bu qədər ms gözlə
 *   timeout — sonra boş vaxt gəlməsə, ən gec bu qədər ms sonra
 * @returns {Promise<void>}
 */
export function whenIdle({ delay = 1200, timeout = 2000 } = {}) {
  if (typeof window === 'undefined') return Promise.resolve()
  return afterLoad()
    .then(() => new Promise((resolve) => setTimeout(resolve, delay)))
    .then(() => new Promise((resolve) => {
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => resolve(), { timeout })
      else setTimeout(resolve, 200)
    }))
}

/** React.lazy fabriki üçün: modulu yalnız boş vaxtda yüklə. */
export const lazyWhenIdle = (factory, opts) => () => whenIdle(opts).then(factory)
