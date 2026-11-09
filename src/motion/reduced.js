// ═══════════════════════════════════════════════════════
// Hərəkəti azalt — saytın İKİ pilləsi (utils/a11yPrefs.js, utils/liteDevice.js):
//   'all'   — sistem (prefers-reduced-motion) və ya istifadəçinin öz seçimi
//             (html.a11y-motion-user) → heç bir hərəkət yoxdur, məzmun dərhal görünür.
//   'decor' — yuxarıdakılar + html.a11y-reduce-motion (zəif cihaz da bura düşür) →
//             dövri dekor (axan xətlər, qlobus fırlanması, marquee, orbit) dayanır;
//             menyu, dialoq, giriş kimi UI hərəkətləri işləyir (v5.5 qaydası).
// useReduced() / useReduced('decor') — dəyişəndə (panel, sistem ayarı) yenidən render.
// ═══════════════════════════════════════════════════════
import { useSyncExternalStore } from 'react'

const MQ = '(prefers-reduced-motion: reduce)'

function htmlHas(cls) {
  try { return document.documentElement.classList.contains(cls) } catch { return false }
}
function osReduced() {
  try { return window.matchMedia(MQ).matches } catch { return false }
}

/** Saf olmayan, amma sinxron oxu — hook-suz yerlər üçün (wow.js ilə eyni meyar) */
export function isReduced(kind = 'all') {
  if (typeof window === 'undefined') return false
  if (osReduced() || htmlHas('a11y-motion-user')) return true
  return kind === 'decor' && htmlHas('a11y-reduce-motion')
}

/** İncə göstərici (siçan) — spotlight, maqnit, dok böyüməsi yalnız burada */
export function isFinePointer() {
  try { return window.matchMedia('(hover: hover) and (pointer: fine)').matches } catch { return false }
}

const listeners = new Set()
let wired = false
function wire() {
  if (wired || typeof window === 'undefined') return
  wired = true
  const emit = () => listeners.forEach(fn => fn())
  try { window.matchMedia(MQ).addEventListener('change', emit) } catch { /* köhnə brauzer */ }
  try { new MutationObserver(emit).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }) } catch { /* */ }
}
function subscribe(fn) {
  wire()
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** true → animasiya etmə (kind: 'all' | 'decor') */
export function useReduced(kind = 'all') {
  return useSyncExternalStore(subscribe, () => isReduced(kind), () => false)
}
