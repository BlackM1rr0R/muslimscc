// ═══════════════════════════════════════════════════════
// useSurahGridFx — surə şəbəkəsinin "canlılığı" (/quran)
//
//   const gridRef = useRef(null)
//   useSurahGridFx(gridRef, filtered.map(s => s.number).join(','))
//
// 1) TƏK IntersectionObserver: ekrandakı kartlara data-vis (boş dayananda rozetin
//    yavaş fırlanması yalnız onlarda), ilk dəfə görünəndə data-seen (rozet "çəkilir").
//    Ekrandan çıxan kartın animasiyası dayanır — 114 kartda da yüngül.
// 2) Süzgəc / sıralama dəyişəndə kartlar yeni yerinə SÜRÜŞÜR (FLIP, Web Animations,
//    yalnız transform/opacity). Ölçülər bir dəfəyə oxunur, sonra bir dəfəyə yazılır —
//    düzülüş "döyünməsi" (layout thrash) yoxdur. Hərəkət azaldılıbsa — yoxdur.
// ═══════════════════════════════════════════════════════
import { useEffect, useLayoutEffect, useRef } from 'react'

const reduced = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('a11y-reduce-motion')
  } catch { return true }
}

export default function useSurahGridFx(gridRef, signature) {
  const rectsRef = useRef(null)

  // 1) Görünmə
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return undefined
    const cards = grid.querySelectorAll('.surah-card')
    if (typeof IntersectionObserver !== 'function') {
      cards.forEach(c => { c.setAttribute('data-seen', ''); c.setAttribute('data-vis', '') })
      return undefined
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target
        if (e.isIntersecting) { el.setAttribute('data-vis', ''); el.setAttribute('data-seen', '') }
        else el.removeAttribute('data-vis')
      }
    }, { rootMargin: '80px 0px' })
    cards.forEach(c => io.observe(c))
    return () => io.disconnect()
  }, [gridRef, signature])

  // Ölçü dəyişəndə köhnə yerlər etibarsızdır (növbəti dəyişiklikdə sürüşmə olmasın)
  useEffect(() => {
    const drop = () => { rectsRef.current = null }
    window.addEventListener('resize', drop, { passive: true })
    return () => window.removeEventListener('resize', drop)
  }, [])

  // 2) FLIP
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid || !signature) { rectsRef.current = null; return }
    const cards = [...grid.querySelectorAll('.surah-card[data-n]')]
    // OXU (bir dəfəyə)
    const g = grid.getBoundingClientRect()
    const vh = window.innerHeight
    const now = new Map()
    for (const c of cards) {
      const r = c.getBoundingClientRect()
      now.set(c.dataset.n, { x: r.left - g.left, y: r.top - g.top, top: r.top, bottom: r.bottom })
    }
    const prev = rectsRef.current
    rectsRef.current = now
    // İlk yüklənmə (əvvəl kart yox idi) — girişi data-reveal="stagger" edir
    if (!prev || !prev.size || reduced() || typeof Element.prototype.animate !== 'function') return
    // YAZI (bir dəfəyə) — yalnız ekranda olanlar
    let fresh = 0
    for (const c of cards) {
      const r = now.get(c.dataset.n)
      if (r.bottom < -40 || r.top > vh + 40) continue
      const o = prev.get(c.dataset.n)
      if (o) {
        const dx = o.x - r.x, dy = o.y - r.y
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue
        c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
          { duration: 460, easing: 'cubic-bezier(.22, 1, .36, 1)' })
      } else {
        c.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }],
          { duration: 380, delay: Math.min(fresh++, 12) * 22, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' })
      }
    }
  }, [gridRef, signature])
}
