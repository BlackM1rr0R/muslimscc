// ═══════════════════════════════════════════════════════
// "VAU" qatı — JS hissəsi (stillər: src/styles/wow.css)
//
// Səhifələrə toxunmadan bütün sayta işləyir:
//   1) Kursor işığı + 3D əyilmə: TƏK delegə olunmuş pointermove dinləyicisi,
//      rAF ilə kadra bir dəfə. Yalnız siçan (toxunuşda yox).
//   2) Kartların sürüşəndə növbə ilə qalxması: TƏK IntersectionObserver;
//      yeni gələn kartları (tənbəl siyahılar, "Daha çox") MutationObserver tapır.
//      Artıq [data-reveal] sistemi altında olan elementlərə toxunmur.
//   3) Hero aurora: hər .ui-page-hero-ya bir dekor elementi əlavə olunur.
//   4) Oxu irəliləyişi zolağı (CSS scroll-timeline ilə hərəkət edir).
//   5) Mövsüm: hicri tarixə görə <html data-season="ramadan|eid|hajj">
//      (aurora rəngləri, hilal, bayram parıltısı). Önizləmə: ?season=ramadan
//
// "Hərəkəti azalt" (sistem və ya saytın əlçatanlıq paneli) — 2 və 3 söndürülür,
// əyilmə yox; yalnız kursor işığı qalır (hərəkət deyil, rəng).
// ═══════════════════════════════════════════════════════

const CARD = '.ui-card, .ui-tile, .ui-stat, .surah-card'
// Əyilmə yalnız kiçik, kliklənən kartlarda (iri məzmun panelləri əyilməsin)
const TILT = '.ui-card--interactive, a.ui-card, button.ui-card, .ui-tile, .surah-card'
const TILT_MAX_W = 560
// Bu konteynerlərin içində qalxma animasiyası yoxdur (studiya, dialoq, menyu)
const NO_ENTER = '[data-reveal], [role="dialog"], dialog, .m-sheet, header, nav, .qg-studio, [data-wow-off]'
const ENTER = '.ui-card, .ui-tile, .ui-stat, .ui-step'
const STAGGER_MS = 70
const STAGGER_MAX = 8

let started = false

function reduced() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('a11y-reduce-motion')
  } catch { return false }
}

/* ── 1. Kursor işığı + əyilmə ── */
function initPointer() {
  const fine = window.matchMedia?.('(hover: hover) and (pointer: fine)')
  let hot = null
  let pending = null
  let raf = 0

  const clear = () => {
    if (!hot) return
    hot.removeAttribute('data-wow-hot')
    hot.style.removeProperty('--wow-rx')
    hot.style.removeProperty('--wow-ry')
    hot = null
  }

  const apply = () => {
    raf = 0
    const e = pending
    if (!e) return
    const el = e.target instanceof Element ? e.target.closest(CARD) : null
    if (el !== hot) clear()
    if (!el) return
    hot = el
    const r = el.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    el.style.setProperty('--wow-x', `${x.toFixed(0)}px`)
    el.style.setProperty('--wow-y', `${y.toFixed(0)}px`)
    if (!el.hasAttribute('data-wow-probed')) {
      el.setAttribute('data-wow-probed', '')
      // İşıq yalnız öz fon şəkli olmayan kartda (qradiyentli kartın fonunu əzməsin)
      const cs = getComputedStyle(el)
      if (cs.backgroundImage === 'none') el.setAttribute('data-wow-spot', '')
      if (el.matches(TILT) && r.width <= TILT_MAX_W && cs.position !== 'fixed') el.setAttribute('data-wow-tilt', '')
    }
    if (el.hasAttribute('data-wow-tilt') && !reduced()) {
      const px = x / r.width - 0.5
      const py = y / r.height - 0.5
      el.style.setProperty('--wow-rx', `${(-py * 6).toFixed(2)}deg`)
      el.style.setProperty('--wow-ry', `${(px * 7).toFixed(2)}deg`)
    }
    el.setAttribute('data-wow-hot', '')
  }

  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || (fine && !fine.matches)) return
    pending = e
    if (!raf) raf = requestAnimationFrame(apply)
  }, { passive: true })
  // Pəncərədən çıxanda / sürüşəndə (kart kursorun altından qaçır)
  document.addEventListener('pointerout', (e) => { if (!e.relatedTarget) clear() }, { passive: true })
  window.addEventListener('scroll', () => { if (hot) clear() }, { passive: true })
}

/* ── 2. Sürüşəndə qalxma ── */
function initEnter() {
  if (typeof IntersectionObserver === 'undefined') return
  const cleanup = (el) => {
    el.removeAttribute('data-wow-ready')
    el.removeAttribute('data-wow-in')
    el.style.removeProperty('--wow-d')
  }
  const io = new IntersectionObserver((entries) => {
    // Eyni anda görünənlər növbə ilə (sıra — sənəddəki yerinə görə)
    const shown = entries.filter(en => en.isIntersecting).map(en => en.target)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    shown.forEach((el, i) => {
      io.unobserve(el)
      el.style.setProperty('--wow-d', `${Math.min(i, STAGGER_MAX) * STAGGER_MS}ms`)
      el.setAttribute('data-wow-in', '')
      let timer = 0
      const onEnd = (ev) => { if (ev.target === el && ev.propertyName === 'transform') done() }
      const done = () => {
        clearTimeout(timer)
        el.removeEventListener('transitionend', onEnd)
        cleanup(el)
      }
      el.addEventListener('transitionend', onEnd)
      timer = setTimeout(done, 1600 + i * STAGGER_MS)
    })
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })

  const scan = () => {
    if (reduced()) return
    const vh = window.innerHeight
    document.querySelectorAll(`${ENTER}`).forEach(el => {
      if (el.hasAttribute('data-wow-seen')) return
      el.setAttribute('data-wow-seen', '')
      if (el.closest(NO_ENTER)) return
      // Ekranda və ya yuxarıda olan — dərhal görünür (səhifə keçidi onsuz da animasiyalıdır)
      const r = el.getBoundingClientRect()
      if (r.top < vh * 0.92 || r.height === 0) return
      el.setAttribute('data-wow-ready', '')
      io.observe(el)
    })
  }

  let queued = false
  const queue = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => { queued = false; scan() })
  }
  new MutationObserver(queue).observe(document.body, { childList: true, subtree: true })
  queue()
}

/* ── 3. Hero aurora ── */
function initAurora() {
  const add = () => {
    document.querySelectorAll('.ui-page-hero:not([data-wow-aurora])').forEach(h => {
      h.setAttribute('data-wow-aurora', '')
      const a = document.createElement('div')
      a.className = 'wow-aurora'
      a.setAttribute('aria-hidden', 'true')
      // 4-cü və 5-ci: mövsüm bəzəkləri (hilal, bayram parıltısı) — yalnız data-season-da görünür
      a.innerHTML = '<i></i><i></i><i></i><b class="wow-crescent"></b><b class="wow-sparkles"></b>'
      h.appendChild(a)
    })
  }
  let queued = false
  new MutationObserver(() => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => { queued = false; add() })
  }).observe(document.body, { childList: true, subtree: true })
  add()
}

/* ── 5. Mövsüm (hicri təqvim) ── */
/** Hicri tarixdən mövsüm (saf funksiya — test olunur) */
export function seasonOf(h) {
  if (!h) return ''
  if (h.month === 9) return 'ramadan'
  if (h.month === 10 && h.day <= 3) return 'eid'
  if (h.month === 12 && h.day >= 10 && h.day <= 13) return 'eid'
  if (h.month === 12 && h.day <= 9) return 'hajj'
  return ''
}
const SEASONS = ['ramadan', 'eid', 'hajj']
function initSeason() {
  const html = document.documentElement
  let forced = ''
  try { forced = new URLSearchParams(window.location.search).get('season') || '' } catch { /* */ }
  if (SEASONS.includes(forced)) { html.setAttribute('data-season', forced); return }
  // Hicri köməkçi əsas paketə düşməsin — boş vaxtda yüklənir
  const run = () => import('./hijri').then(({ gregorianToHijri, fromLocalDate }) => {
    const s = seasonOf(gregorianToHijri(fromLocalDate(new Date())))
    if (s) html.setAttribute('data-season', s)
  }).catch(() => { /* mövsüm sadəcə bəzəkdir */ })
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 })
  else setTimeout(run, 1200)
}

/* ── 4. Oxu irəliləyişi ── */
function initProgress() {
  if (document.querySelector('.wow-progress')) return
  const bar = document.createElement('div')
  bar.className = 'wow-progress'
  bar.setAttribute('aria-hidden', 'true')
  document.body.appendChild(bar)
}

export function initWow() {
  if (started || typeof window === 'undefined' || typeof document === 'undefined') return
  started = true
  const go = () => {
    initPointer()
    initEnter()
    initAurora()
    initProgress()
    initSeason()
  }
  if (document.body) go()
  else document.addEventListener('DOMContentLoaded', go, { once: true })
}
