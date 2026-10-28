// ═══════════════════════════════════════════════════════
// Sürüşəndə görünmə (reveal) — TƏK qlobal IntersectionObserver
//
// İstifadə (səhifələrdə JS lazım deyil — yalnız atribut):
//   <section data-reveal>…</section>                 yumşaq görünmə + 12px qalxma
//   <div data-reveal="fade">…</div>                   yalnız görünmə
//   <div data-reveal="scale">…</div>                  görünmə + .97 → 1
//   <div data-reveal="down|left|right|zoom|blur">     istiqamət / böyümə / bulanıqdan aydınlaşma
//   <ul data-reveal="stagger">…</ul>                  UŞAQLAR növbə ilə (45ms, ən çox 10)
//   <ul data-reveal="stagger-zoom|-fade|-left|-right|-blur">  uşaqlar növbə ilə, uyğun hərəkətlə
//   <div data-reveal data-reveal-delay="120">         əlavə gecikmə (ms, ≤ 400)
//   <span data-count="6236">6 236</span>              RƏQƏM SAYĞACI: görünəndə 0-dan sayır
//       data-count-duration="1600" (ms) — sonda mətn ƏVVƏLKİ KİMİ qalır
// Stillər: motion.css §5 (variantlar), §16 (sayğac). Sənəd: DESIGN.md → "Hərəkət".
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
const COUNT_SELECTOR = '[data-count]:not([data-count-ready])'
const MAX_DELAY = 400
const COUNT_MS = 1200

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

// ── Rəqəm sayğacı ────────────────────────────────────
// React-in idarə etdiyi mətn düyününü ƏVƏZ ETMİRİK (textContent = … yeni
// düyün yaradardı və React sonrakı yeniləməni "itmiş" düyünə yazardı) —
// mövcud düyünün nodeValue-sunu dəyişirik və sonda ilkin mətni qaytarırıq.
let countIo = null

function formatLike(sample, value, decimals) {
  // İlkin mətndəki minlik ayırıcısını və onluq işarəsini saxla ("6 236", "6,236", "4,8")
  const g = sample.match(/\d([\s\u00a0\u202f.,'])\d{3}(?!\d)/)
  const group = g ? g[1] : ''
  const mark = group === ',' ? '.' : group === '.' ? ',' : (sample.includes(',') ? ',' : '.')
  const [int, frac] = value.toFixed(decimals).split('.')
  const grouped = group ? int.replace(/\B(?=(\d{3})+(?!\d))/g, group) : int
  return frac ? grouped + mark + frac : grouped
}

function runCount(el) {
  countIo?.unobserve(el)
  const node = el.firstChild
  const target = parseFloat(el.getAttribute('data-count'))
  if (!node || node.nodeType !== 3 || el.childNodes.length !== 1 || !Number.isFinite(target)) return
  const original = node.nodeValue
  const m = original.match(/^(\D*)([\d\s\u00a0\u202f.,']*\d)(.*)$/s)
  if (!m) return
  const [, pre, numText, post] = m
  const decimals = (String(target).split('.')[1] || '').length
  const dur = Math.min(4000, parseInt(el.getAttribute('data-count-duration'), 10) || COUNT_MS)
  const t0 = performance.now()
  const ease = (t) => 1 - Math.pow(1 - t, 3)
  const step = (now) => {
    if (!el.isConnected || node.parentNode !== el) return
    const t = Math.min(1, (now - t0) / dur)
    if (t >= 1) { node.nodeValue = original; return }
    node.nodeValue = pre + formatLike(numText, target * ease(t), decimals) + post
    requestAnimationFrame(step)
  }
  node.nodeValue = pre + formatLike(numText, 0, decimals) + post
  requestAnimationFrame(step)
}

function trackCount(el) {
  if (!countIo || el.hasAttribute('data-count-ready')) return
  el.setAttribute('data-count-ready', '')
  countIo.observe(el)
}

function scan(root = document) {
  if (!io) return
  root.querySelectorAll?.(SELECTOR).forEach(track)
  root.querySelectorAll?.(COUNT_SELECTOR).forEach(trackCount)
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
    // threshold 0: elementin İSTƏNİLƏN hissəsi görünən kimi aç. Əvvəl 0.08 idi —
    // ekrandan ~12 dəfə hündür element (uzun siyahı, admin cədvəli) heç vaxt
    // 8% görünə bilmirdi və məzmun həmişəlik GİZLİ qalırdı.
    // rootMargin 0: əvvəl ekranın altında -6%-lik "ölü zolaq" vardı — səhifənin
    // ən sonundakı kart o zolağa düşəndə (daha aşağı sürüşmək mümkün deyil)
    // heç vaxt açılmırdı. Hər iki halı tests/e2e/reveal.spec.js tutur.
  }, { rootMargin: '0px', threshold: 0 })

  countIo = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) runCount(e.target)
  }, { threshold: 0.6 })

  document.documentElement.classList.add('qm-reveal-on')

  let raf = 0
  const schedule = () => {
    if (raf) return
    raf = requestAnimationFrame(() => { raf = 0; scan() })
  }
  const mo = new MutationObserver(schedule)
  const attach = () => {
    scan()
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-reveal', 'data-count'] })
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
