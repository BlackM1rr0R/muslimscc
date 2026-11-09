// ═══════════════════════════════════════════════════════
// MotionProvider — bütün sayt üçün TƏK Motion konteksti (App.jsx-də bir dəfə).
//
// • LazyMotion strict: yalnız `m.*` komponentləri (tam `motion.*` import ETMƏ —
//   strict rejim xəta verir). Animasiya xüsusiyyətləri (domAnimation, ~15 KB gzip)
//   ayrıca chunk-dır və "load"-dan sonra boş vaxtda gəlir — ilk render/LCP-yə təsiri yox.
//   Gələnə qədər `m.*` elementi animate dəyərində statik çəkilir (initial={false}).
//   AnimatePresence xüsusiyyətsiz də "ilişmir": çıxış animasiyası qeydə alınmayıbsa
//   element dərhal çıxarılır (PresenceChild). initial="hidden" ilə YENİ gələn element isə
//   xüsusiyyətlər gələnə qədər gizli qalır — ona görə yükləmə ilk toxunuşda da başlayır.
// • MotionConfig reducedMotion: sistem ayarı ('user') + saytın öz paneli
//   (html.a11y-motion-user → 'always': transform/layout animasiyası yox, yalnız opacity).
// • layout/layoutId/drag lazımdırsa — <LayoutFeatures> (domMax, tənbəl).
// ═══════════════════════════════════════════════════════
import { useSyncExternalStore } from 'react'
import { LazyMotion, MotionConfig } from 'motion/react'
import { useReduced } from './reduced'
import { whenIdle } from '../utils/idle'

function firstInput() {
  if (typeof window === 'undefined') return new Promise(() => {})
  const TYPES = ['pointerdown', 'keydown', 'touchstart']
  return new Promise((resolve) => {
    const on = () => { TYPES.forEach(t => window.removeEventListener(t, on, true)); resolve() }
    TYPES.forEach(t => window.addEventListener(t, on, { capture: true, passive: true }))
  })
}

let ready = false
let promise = null
const subs = new Set()

/** Xüsusiyyətləri yüklə (bir dəfə). Kənardan erkən çağırmaq olar (məs. naviqasiyada). */
export function loadFeatures() {
  if (!promise) {
    // Boş vaxt VƏ YA ilk toxunuş/klaviatura — hansı tez olsa (interaksiya animasiyası gecikməsin)
    promise = Promise.race([whenIdle({ delay: 0, timeout: 900 }), firstInput()])
      .then(() => import('./features.js'))
      .then((m) => { ready = true; subs.forEach(fn => fn()); return m.default })
    promise.catch(() => { promise = null })
  }
  return promise
}

/** true — animasiya xüsusiyyətləri yüklənib (Reveal yalnız bundan sonra gizlədir) */
export function isMotionReady() { return ready }
export function useMotionReady() {
  return useSyncExternalStore((fn) => { subs.add(fn); return () => subs.delete(fn) }, () => ready, () => false)
}

export default function MotionProvider({ children }) {
  const reduced = useReduced()
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}

