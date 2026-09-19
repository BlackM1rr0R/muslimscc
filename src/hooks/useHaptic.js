// ═══════════════════════════════════════════════════════
// Yüngül titrəmə (haptic) — toxunuşun "hiss" olunması üçün
//
//   import { haptic } from '../hooks/useHaptic'
//   onClick={() => { haptic(); … }}
//
// • Yalnız toxunma ekranında və navigator.vibrate varsa (Android Chrome);
//   iOS Safari-də API yoxdur — səssizcə heç nə etmir.
// • "Hərəkəti azalt" seçilibsə titrəmir.
// • Həmişə try/catch — bəzi brauzerlər icazəsiz çağırışda xəta atır.
// ═══════════════════════════════════════════════════════

export function haptic(ms = 8) {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
    if (!window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Həqiqi toxunuş olmadan (proqramla klik) brauzer çağırışı bloklayıb
    // konsola xəta yazır — belə halda heç çağırmırıq
    if (navigator.userActivation && !navigator.userActivation.isActive) return
    navigator.vibrate(ms)
  } catch {
    /* dəstəklənmir — heç nə */
  }
}

export default haptic
