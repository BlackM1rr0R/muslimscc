// Ekrandan çıxanda / tab gizli olanda dövri animasiyanı dayandırmaq üçün:
// const running = useOffscreenPause(ref)  → false olanda CSS-də animation-play-state: paused
import { useEffect, useState } from 'react'

export default function useOffscreenPause(ref, rootMargin = '120px') {
  const [visible, setVisible] = useState(false)
  const [tabOn, setTabOn] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver !== 'function') { setVisible(true); return undefined }
    const io = new IntersectionObserver((es) => setVisible(es.some(e => e.isIntersecting)), { rootMargin })
    io.observe(el)
    const vis = () => setTabOn(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', vis)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', vis) }
  }, [ref, rootMargin])
  return visible && tabOn
}
