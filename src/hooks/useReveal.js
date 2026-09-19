// ═══════════════════════════════════════════════════════
// Sürüşəndə görünmə (reveal) — TƏK qlobal IntersectionObserver
//
// İstifadə (səhifələrdə JS lazım deyil — yalnız atribut):
//   <section data-reveal>…</section>                 yumşaq görünmə + 12px qalxma
//   <div data-reveal="fade">…</div>                   yalnız görünmə
//   <div data-reveal="scale">…</div>                  görünmə + .97 → 1
//   <ul data-reveal="stagger">…</ul>                  UŞAQLAR növbə ilə (40ms, ən çox 8)
//   <div data-reveal data-reveal-delay="120">         əlavə gecikmə (ms, ≤ 400)
//
// Təhlükəsizlik: element ƏVVƏLCƏ görünür. Gizli başlanğıc vəziyyəti
// (motion.css → [data-reveal-ready]:not([data-revealed])) yalnız müşahidəçi
// elementi həqiqətən izləməyə başlayanda qoyulur — JS işləməsə, brauzer
// IntersectionObserver bilməsə və ya "hərəkəti azalt" seçilibsə məzmun
// heç vaxt gizli qalmır. Hər element bir dəfə açılır və izlənmədən çıxır.
// Vəziyyət SİNİFLƏ yox, atributla (data-revealed) yazılır: React className-i
// yeniləyəndə sinfi silərdi və element yenidən gizlənərdi.
//
// Yeni əlavə olunan elementləri (tənbəl yüklənən səhifələr) MutationObserver
// tapır; yoxlama requestAnimationFrame ilə bir kadra yığılır.
//
// Komponent daxilində ref ilə:
//   const ref = useReveal('stagger');  <ul ref={ref}>…</ul>
// ═══════════════════════════════════════════════════════

import { useCallback } from 'react'

const SELECTOR = '[data-reveal]:not([data-reveal-ready])'
const MAX_DELAY = 400

let io = null
let started = false

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function reveal(el) {
  el.setAttribute('data-revealed', '')
  io?.unobserve(el)
}

/** Bir elementi izləməyə götür (artıq götürülübsə heç nə etmir) */
function track(el) {
  if (!io || !el || el.hasAttribute('data-reveal-ready')) return
  const d = parseInt(el.getAttribute('data-reveal-delay'), 10)
  if (d > 0) el.style.setProperty('--reveal-delay', `${Math.min(d, MAX_DELAY)}ms`)
  // Artıq ekranın YUXARISINDA qalıbsa (geri qayıdış, lövbər) — animasiyasız göstər
  const r = el.getBoundingClientRect()
  if (r.bottom < 0) {
    el.setAttribute('data-reveal-ready', '')
    el.setAttribute('data-revealed', 'static')
    return
  }
  el.setAttribute('data-reveal-ready', '')
  io.observe(el)
}

function scan(root = document) {
  if (!io) return
  root.querySelectorAll?.(SELECTOR).forEach(track)
}

/**
 * Qlobal müşahidəçini bir dəfə işə sal (main.jsx çağırır).
 * Hərəkət azaldılıbsa və ya brauzer dəstəkləmirsə heç nə etmir — məzmun görünür qalır.
 */
export function initReveal() {
  if (started || typeof window === 'undefined') return
  started = true
  if (!('IntersectionObserver' in window) || prefersReducedMotion()) return

  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting || e.boundingClientRect.bottom < 0) reveal(e.target)
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 })

  document.documentElement.classList.add('qm-reveal-on')

  let raf = 0
  const schedule = () => {
    if (raf) return
    raf = requestAnimationFrame(() => { raf = 0; scan() })
  }
  const mo = new MutationObserver(schedule)
  const attach = () => {
    scan()
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-reveal'] })
  }
  if (document.body) attach()
  else window.addEventListener('DOMContentLoaded', attach, { once: true })
}

/**
 * Ref hook: elementə data-reveal qoyur və dərhal izləməyə götürür.
 *   const ref = useReveal()            // 'up'
 *   const ref = useReveal('stagger')
 */
export function useReveal(variant = 'up', delayMs = 0) {
  return useCallback((el) => {
    if (!el) return
    if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', variant)
    if (delayMs > 0 && !el.hasAttribute('data-reveal-delay')) el.setAttribute('data-reveal-delay', String(delayMs))
    track(el)
  }, [variant, delayMs])
}

export default useReveal
