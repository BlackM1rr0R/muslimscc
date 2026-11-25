// ═══════════════════════════════════════════════════════
// Ortaq görünmə müşahidəçisi (Scroll A, 2026-11-24) — bütün sayt üçün TƏK IntersectionObserver
//
// Əvvəl üç ayrı müşahidəçi vardı: hooks/useReveal.js ([data-reveal]), utils/wow.js §2
// (.ui-card/.ui-tile … avtomatik giriş) və §3 ([data-anim]). İndi hamısı bu modulu paylaşır:
//
//   watch(el, owner)   — elementi izlə; owner = { entry(IntersectionObserverEntry), flush?() }
//   unwatch(el, owner) — bu sahibi çıxar (element bir dəfə açılır və buraxılır); owner verilməsə — hamısı
// Bir elementin bir neçə sahibi ola bilər (məs. <ul data-anim-stagger data-draw> — wow.js + İkon A).
//
// Bir callback-dəki girişlər əvvəlcə owner.entry-yə, sonra hər owner üçün bir dəfə flush()-a
// verilir — wow.js növbəni (70 ms addım) bir partiyanın içində qura bilsin.
// rootMargin 0 / threshold 0: elementin İSTƏNİLƏN hissəsi görünən kimi (çox hündür blok və
// səhifənin ən sonundakı kart da açılır — tests/e2e/reveal.spec.js).
// PERFORMANS: ölçü oxunmur — qərarlar IO-nun öz boundingClientRect-i ilə verilir (layout məcbur edilmir).
// ═══════════════════════════════════════════════════════

const owners = new WeakMap()
let io = null

function get() {
  if (io) return io
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return null
  io = new IntersectionObserver((entries) => {
    const touched = new Set()
    for (const e of entries) {
      const set = owners.get(e.target)
      if (!set || !set.size) { io.unobserve(e.target); continue }
      for (const o of [...set]) { o.entry(e); touched.add(o) }
    }
    for (const o of touched) o.flush?.()
  }, { rootMargin: '0px', threshold: 0 })
  return io
}

/** Elementi ortaq müşahidəçiyə ver. IntersectionObserver yoxdursa false (məzmun görünür qalır). */
export function watch(el, owner) {
  const o = get()
  if (!o || !el) return false
  let set = owners.get(el)
  if (!set) owners.set(el, (set = new Set()))
  else if (set.size) o.unobserve(el)   // yeni sahib də ilk ("probe") cavabı alsın — yenidən müşahidə
  set.add(owner)
  o.observe(el)
  return true
}

/** Sahibi (və ya bütün sahibləri) çıxar; sahib qalmayanda element izlənmir. */
export function unwatch(el, owner) {
  if (!el) return
  const set = owners.get(el)
  if (set && owner) set.delete(owner)
  if (!owner || !set || !set.size) { owners.delete(el); io?.unobserve(el) }
}
