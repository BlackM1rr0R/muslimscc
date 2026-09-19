// ═══════════════════════════════════════════════════════
// useScrollDirection — başlığın "aşağı sürüşəndə gizlən, yuxarıda qayıt"
// davranışı üçün yüngül hook.
//
//   const { hidden, scrolled } = useScrollDirection({ threshold: 8, disabled })
//
// • hidden   — istifadəçi aşağı sürüşür (ən az `threshold` px) və səhifənin
//              lap yuxarısında deyil (`topOffset`-dən aşağıda)
// • scrolled — səhifə `scrolledAt` px-dən çox sürüşüb (nazik xətt/kölgə üçün)
//
// 60 kadr/san üçün: tək passive dinləyici, iş requestAnimationFrame-də,
// state yalnız dəyər DƏYİŞƏNDƏ yenilənir (React eyni dəyəri atlayır).
// Scroll kilidi (açıq vərəq, axtarış, panel, ☰ menyu — body/html
// overflow:hidden və ya body.panel-open) zamanı və `disabled` olanda heç
// vaxt gizlənmir.
// ═══════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'

/** Arxa səhifə kilidlidirmi? (vərəq / dialoq açıqdır) */
function isScrollLocked() {
  const b = document.body
  const root = document.documentElement
  if (!b) return false
  return b.style.overflow === 'hidden' ||
    root.style.overflow === 'hidden' ||   // ☰ çəkmə menyu (SideNav.jsx) kilidi <html>-dədir
    b.classList.contains('panel-open') ||
    root.classList.contains('qm-overlay-open')
}

export function useScrollDirection({ threshold = 8, topOffset = 64, scrolledAt = 8, disabled = false } = {}) {
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled

  // Söndürüləndə (məs. axtarış açılır) başlıq dərhal geri gəlsin
  useEffect(() => {
    if (disabled) setHidden(false)
  }, [disabled])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    let lastY = window.scrollY
    let raf = 0

    const update = () => {
      raf = 0
      const y = Math.max(0, window.scrollY)
      setScrolled(y > scrolledAt)

      if (disabledRef.current || isScrollLocked()) {
        // Kilid zamanı bəzi brauzerlər scrollY-ni sıfırlayır — müqayisə nöqtəsini yenilə
        lastY = y
        setHidden(false)
        return
      }
      if (y <= topOffset) {
        lastY = y
        setHidden(false)
        return
      }
      const dy = y - lastY
      if (Math.abs(dy) < threshold) return   // kiçik titrəmələrə reaksiya yoxdur
      setHidden(dy > 0)
      lastY = y
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [threshold, topOffset, scrolledAt])

  return { hidden: hidden && !disabled, scrolled }
}

export default useScrollDirection
