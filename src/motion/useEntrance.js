// ═══════════════════════════════════════════════════════
// useEntrance — "prerender-safe" giriş: məzmun HEÇ VAXT səbəbsiz gizli qalmır.
//
//   'static' → element olduğu kimi görünür (animasiya yoxdur)
//   'hidden' → ani gizlədilib (boyamadan ƏVVƏL, useLayoutEffect) — görünəndə açılacaq
//   'shown'  → görünüş sahəsinə girdi, giriş animasiyası gedir/bitib
//
// Gizlətmə yalnız bu hallarda: Motion xüsusiyyətləri artıq yüklənib (yoxsa animasiya
// edə bilməzdik), hərəkət azaldılmayıb, və element ya ekrandan kənardadır, ya da ilk
// boyama pəncərəsi (~0.9 san, wow.js ilə eyni) keçib. İlk açılışda ekranda olan məzmun
// (LCP) toxunulmaz qalır. Hündür element (ekrandan uzun) threshold 0 ilə də açılır.
// ═══════════════════════════════════════════════════════
import { useEffect, useLayoutEffect, useState } from 'react'
import { isMotionReady } from './MotionProvider'
import { isReduced } from './reduced'
import { inFirstPaint } from '../utils/wow'

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect

export default function useEntrance(ref, { margin = '0px 0px -8% 0px', disabled = false } = {}) {
  const [phase, setPhase] = useState('static')

  useIso(() => {
    const el = ref.current
    if (disabled || !el || !isMotionReady() || isReduced() || typeof IntersectionObserver !== 'function') return
    const r = el.getBoundingClientRect()
    const onScreen = r.top < window.innerHeight && r.bottom > 0
    if (onScreen && inFirstPaint()) return
    setPhase('hidden')   // boyamadan əvvəl, bir dəfə
  }, [disabled, ref])

  useEffect(() => {
    if (phase !== 'hidden') return undefined
    const el = ref.current
    if (!el) { setPhase('shown'); return undefined }
    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); setPhase('shown') }
    }, { rootMargin: margin, threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [phase, margin, ref])

  return phase
}
