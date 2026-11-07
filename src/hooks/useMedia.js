// ═══════════════════════════════════════════════════════
// useMedia(query) — CSS media sorğusu React-da (dəyişəndə yenidən render)
// PERFORMANS (v5.4): telefonda display:none olan yan paneli (SideNav "rail",
// ~490 DOM düyünü + 60 SVG ikon) ümumiyyətlə render etməmək üçün — App.jsx.
// İlk render-də sinxron oxunur (layout tullanması olmur).
// ═══════════════════════════════════════════════════════
import { useSyncExternalStore } from 'react'

export default function useMedia(query, serverValue = true) {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const mq = window.matchMedia(query)
      mq.addEventListener?.('change', cb)
      return () => mq.removeEventListener?.('change', cb)
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : serverValue),
    () => serverValue,
  )
}
