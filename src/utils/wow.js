// ═══════════════════════════════════════════════════════
// "VAU 2" qatı — JS hissəsi (stillər: src/styles/wow.css, sənəd: DESIGN.md §7)
//
// Səhifələrə toxunmadan bütün sayta işləyir (ortaq .ui-* siniflərinə):
//   1) Kursor işığı + 3D əyilmə + haşiyə parıltısı (kart), maqnit düymə:
//      TƏK delegə olunmuş pointermove dinləyicisi, rAF ilə kadra bir dəfə.
//      Yalnız siçan (hover: hover + pointer: fine).
//   2) Sürüşəndə giriş (blur + qalxma + növbə): .ui-card, .ui-tile, .ui-stat,
//      .ui-step, .ui-section-head … TƏK IntersectionObserver; yeni gələnləri
//      MutationObserver tapır. [data-reveal] / [data-anim] altına toxunmur.
//   3) data-anim="rise|fade|zoom|blur|slide-start|slide-end|ink"
//      (+ data-anim-delay="ms"), data-anim-stagger (uşaqlar növbə ilə),
//      data-parallax="0.15" (scroll × əmsal, telefonda söndürülür).
//      (data-count — hooks/useReveal.js; hero rəqəmlərinə burada avtomatik qoyulur)
//   4) Hero (.ui-page-hero): aurora + fırlanan 8-guşəli ulduz + parallaks
//      qatlar; başlıq sözbəsöz; ərəbcə yazı "mürəkkəblə"; rəqəmlər sayılır.
//      Ekrandan çıxan hero-nun animasiyası dayanır.
//   5) Sekmə/seqment altında sürüşən indikator (.ui-tabs, .ui-segmented).
//   6) Oxu irəliləyişi zolağı; mövsüm (hicri) — html[data-season].
//
// TƏHLÜKƏSİZLİK: gizli başlanğıc vəziyyəti yalnız html.wow-ready altında və
// yalnız JS elementi həqiqətən izləyəndə qoyulur — JS gəlməsə (prerender
// HTML), "hərəkəti azalt" (sistem və ya html.a11y-reduce-motion) seçilibsə
// məzmun HEÇ VAXT gizli qalmır. Hər element bir dəfə açılır; sonda atributlar
// silinir və kartın öz stilləri (hover və s.) qayıdır.
// PERFORMANS: yalnız transform/opacity (blur — yalnız geniş ekranda);
// scroll dinləyiciləri passive + rAF; layout oxunuşu kadra bir dəfə.
// ═══════════════════════════════════════════════════════

const CARD = '.ui-card, .ui-tile, .ui-stat, .surah-card'
// Əyilmə yalnız kiçik, kliklənən kartlarda (iri məzmun panelləri əyilməsin)
const TILT = '.ui-card--interactive, a.ui-card, button.ui-card, .ui-tile, .surah-card'
// Haşiyə parıltısı — kliklənən kartlar
const GLOW = '.ui-card--interactive, a.ui-card, button.ui-card, .ui-tile'
const MAGNET = '.ui-btn--primary, .ui-btn--accent, .ui-btn--lg, [data-magnetic]'
const TILT_MAX_W = 560
// Bu konteynerlərin içində giriş animasiyası yoxdur (studiya, dialoq, menyu,
// səhifə agentinin öz sistemi)
// + öz giriş animasiyası olan səhifə bölmələri (iki dəfə animasiya olmasın):
//   Quiz (.quiz-*), Kids (.kids-*), About qrafikləri, Qrup, Statistika
const NO_ENTER = '[data-reveal], [data-anim], [data-anim-stagger], [role="dialog"], dialog, .m-sheet, header:not(.ui-page-hero), nav, .qg-studio, [data-wow-off], .ui-page-hero, ' +
  '[class*="quiz-"], [class*="kids-"], .ab-charts, .gp-root, .analytics-page'
const ENTER = '.ui-card, .ui-tile, .ui-stat, .ui-step, .ui-section-head, .ui-callout, .ui-quote, .ui-table-wrap'
const STAGGER_MS = 55
const STAGGER_MAX = 10
const ANIMS = ['rise', 'fade', 'zoom', 'blur', 'slide-start', 'slide-end', 'ink']

let started = false
// İlk açılışda (prerender HTML artıq boyanıb) ekranda olanı gizlətmirik —
// "yanıb-sönmə" və LCP gecikməsi olmasın. Sonrakı naviqasiyalarda animasiya var.
let firstPaintWindow = true

const html = () => document.documentElement

function reduced() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      html().classList.contains('a11y-reduce-motion')
  } catch { return false }
}
const mq = (q) => { try { return window.matchMedia(q) } catch { return { matches: false } } }

/** rAF ilə bir kadra yığılan MutationObserver */
function onDomChange(fn) {
  let queued = false
  const mo = new MutationObserver(() => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => { queued = false; fn() })
  })
  mo.observe(document.body, { childList: true, subtree: true })
  fn()
}

/* ── 1. Kursor işığı + əyilmə + haşiyə parıltısı + maqnit düymə ── */
function initPointer() {
  const fine = mq('(hover: hover) and (pointer: fine)')
  let hot = null
  let mag = null
  let pending = null
  let raf = 0

  const clear = () => {
    if (!hot) return
    hot.removeAttribute('data-wow-hot')
    hot.style.removeProperty('--wow-rx')
    hot.style.removeProperty('--wow-ry')
    hot = null
  }
  const clearMag = () => {
    if (!mag) return
    mag.style.removeProperty('--wow-mx')
    mag.style.removeProperty('--wow-my')
    mag.removeAttribute('data-wow-mag-on')
    mag = null
  }

  const apply = () => {
    raf = 0
    const e = pending
    if (!e) return
    const t = e.target instanceof Element ? e.target : null

    // Maqnit düymə: kursora doğru ən çox 4px (translate — transform-a toxunmur)
    const b = t ? t.closest(MAGNET) : null
    if (b !== mag) clearMag()
    if (b && !b.disabled && !reduced()) {
      const r = b.getBoundingClientRect()
      if (r.width <= 360) {
        mag = b
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
        b.style.setProperty('--wow-mx', `${(dx * 4).toFixed(1)}px`)
        b.style.setProperty('--wow-my', `${(dy * 3).toFixed(1)}px`)
        b.style.setProperty('--wow-bx', `${(e.clientX - r.left).toFixed(0)}px`)
        b.setAttribute('data-wow-mag-on', '')
      }
    }

    const el = t ? t.closest(CARD) : null
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
      // Haşiyə parıltısı ::after ilə — kartın öz ::after-i yoxdursa
      if (el.matches(GLOW) && (cs.position === 'relative' || cs.position === 'static') && getComputedStyle(el, '::after').content === 'none') el.setAttribute('data-wow-glow', '')
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
    if (e.pointerType !== 'mouse' || !fine.matches) return
    pending = e
    if (!raf) raf = requestAnimationFrame(apply)
  }, { passive: true })
  // Pəncərədən çıxanda / sürüşəndə (kart kursorun altından qaçır)
  document.addEventListener('pointerout', (e) => { if (!e.relatedTarget) { clear(); clearMag() } }, { passive: true })
  window.addEventListener('scroll', () => { if (hot) clear(); if (mag) clearMag() }, { passive: true })
}

/* ── 2. Sürüşəndə giriş (blur + qalxma + növbə) ── */
function initEnter() {
  if (typeof IntersectionObserver === 'undefined') return
  const cleanup = (el) => {
    el.removeAttribute('data-wow-ready')
    el.removeAttribute('data-wow-in')
    el.style.removeProperty('--wow-d')
  }
  const io = new IntersectionObserver((entries) => {
    // Eyni anda görünənlər növbə ilə (sıra — sənəddəki yerinə görə)
    const shown = entries.filter(en => en.isIntersecting || en.boundingClientRect.bottom < 0).map(en => en.target)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    shown.forEach((el, i) => {
      io.unobserve(el)
      el.style.setProperty('--wow-d', `${Math.min(i, STAGGER_MAX) * STAGGER_MS}ms`)
      el.setAttribute('data-wow-in', '')
      let timer = 0
      const onEnd = (ev) => { if (ev.target === el && ev.propertyName === 'opacity') done() }
      const done = () => {
        clearTimeout(timer)
        el.removeEventListener('transitionend', onEnd)
        cleanup(el)
      }
      el.addEventListener('transitionend', onEnd)
      timer = setTimeout(done, 1400 + i * STAGGER_MS)
    })
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0 })

  const scan = () => {
    if (reduced()) return
    const vh = window.innerHeight
    document.querySelectorAll(ENTER).forEach(el => {
      if (el.hasAttribute('data-wow-seen')) return
      el.setAttribute('data-wow-seen', '')
      if (el.closest(NO_ENTER)) return
      // İç-içə kart: valideyn artıq girirsə, uşaq ayrıca girməsin
      if (el.parentElement?.closest('[data-wow-ready]')) return
      const r = el.getBoundingClientRect()
      if (r.height === 0 || r.bottom < 0) return
      // İlk açılışda ekranda olan — dərhal görünür
      if (firstPaintWindow && r.top < vh * 0.92) return
      // Çox hündür blok (uzun cədvəl) — yalnız yüngül görünmə, qalxma yox
      if (r.height > vh * 1.5) el.setAttribute('data-wow-tall', '')
      el.setAttribute('data-wow-ready', '')
      io.observe(el)
    })
  }
  onDomChange(scan)
}

/* ── 3. data-anim / data-anim-stagger / data-parallax ── */
function initAnim() {
  if (typeof IntersectionObserver === 'undefined') return
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting && en.boundingClientRect.bottom >= 0) continue
      const el = en.target
      io.unobserve(el)
      el.setAttribute('data-anim-in', '')
    }
  }, { rootMargin: '0px 0px -4% 0px', threshold: 0 })

  const SEL = '[data-anim]:not([data-anim-seen]), [data-anim-stagger]:not([data-anim-seen])'
  const scan = () => {
    const vh = window.innerHeight
    const red = reduced()
    document.querySelectorAll(SEL).forEach(el => {
      el.setAttribute('data-anim-seen', '')
      if (red) return
      const v = el.getAttribute('data-anim')
      if (v && !ANIMS.includes(v)) el.setAttribute('data-anim', 'rise')
      const d = parseInt(el.getAttribute('data-anim-delay'), 10)
      if (d > 0) el.style.setProperty('--anim-delay', `${Math.min(d, 1200)}ms`)
      const st = parseInt(el.getAttribute('data-anim-stagger'), 10)
      if (st > 0) el.style.setProperty('--anim-step', `${Math.min(st, 200)}ms`)
      const r = el.getBoundingClientRect()
      if (r.bottom < 0) return
      if (firstPaintWindow && r.top < vh && r.bottom > 0) return
      el.setAttribute('data-anim-ready', '')
      io.observe(el)
    })
  }
  onDomChange(scan)
}

function initParallax() {
  const off = mq('(max-width: 767.98px), (pointer: coarse)')
  const items = new Set()
  const visible = new Set()
  const io = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) visible.add(en.target)
        else visible.delete(en.target)
      }
      schedule()
    }, { rootMargin: '20% 0px' })
    : null
  let raf = 0
  const update = () => {
    raf = 0
    const disabled = off.matches || reduced()
    const vh = window.innerHeight
    // Əvvəl hamısını oxu, sonra yaz (layout thrash yoxdur)
    const writes = []
    for (const el of visible) {
      if (!el.isConnected) { visible.delete(el); items.delete(el); continue }
      if (disabled) { writes.push([el, '']); continue }
      const f = Math.max(-0.6, Math.min(0.6, parseFloat(el.getAttribute('data-parallax')) || 0.15))
      const cur = parseFloat(el.dataset.wowPy || '0')
      const r = el.getBoundingClientRect()
      const center = r.top - cur + r.height / 2
      const ty = (vh / 2 - center) * f
      writes.push([el, ty])
    }
    for (const [el, ty] of writes) {
      if (ty === '') { el.style.removeProperty('translate'); delete el.dataset.wowPy; continue }
      el.dataset.wowPy = ty.toFixed(1)
      el.style.translate = `0 ${ty.toFixed(1)}px`
    }
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(update) }
  const scan = () => {
    document.querySelectorAll('[data-parallax]').forEach(el => {
      if (items.has(el)) return
      items.add(el)
      if (io) io.observe(el)
    })
  }
  onDomChange(scan)
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
}

/* ── 4. Hero: aurora + ulduz + parallaks, başlıq sözbəsöz, rəqəmlər ── */
// "6 236", "1250+", "114", "100%" → 6236 / 1250 / 114 / 100. Kəsr və tarixə bənzəyən ("12:30", "1/2") — yox
export function parseCount(text) {
  const s = String(text || '').trim()
  if (!s || s.length > 16) return null
  const m = s.match(/^([^\d]{0,3})(\d{1,3}(?:[\s  .,']\d{3})+|\d+)([^\d]{0,4})$/)
  if (!m || /[:/]/.test(m[1] + m[3])) return null
  const n = parseInt(m[2].replace(/[^\d]/g, ''), 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

function splitWords(h) {
  // Yalnız TƏK mətn düyünlü başlıq. React həmin düyünü tutur — onu yaddaşda
  // saxlayırıq və animasiyadan sonra QAYTARIRIQ (React yeniləməsi itməsin).
  if (h.hasAttribute('data-wow-split') || h.childNodes.length !== 1) return
  const node = h.firstChild
  if (!node || node.nodeType !== 3) return
  const text = node.nodeValue
  const words = text.split(/(\s+)/)
  const real = words.filter(w => w.trim())
  if (real.length < 1 || real.length > 14) return
  h.setAttribute('data-wow-split', '')
  const frag = document.createDocumentFragment()
  let i = 0
  for (const w of words) {
    if (!w.trim()) { frag.appendChild(document.createTextNode(w)); continue }
    const s = document.createElement('span')
    s.className = 'wow-w'
    s.setAttribute('aria-hidden', 'true')
    s.style.setProperty('--wi', String(i++))
    s.textContent = w
    frag.appendChild(s)
  }
  // Ekran oxuyucusu üçün tam mətn bir dəfə
  const sr = document.createElement('span')
  sr.className = 'ui-sr-only'
  sr.textContent = text
  frag.appendChild(sr)
  h.replaceChildren(frag)
  const restore = () => {
    if (!h.isConnected) return
    // React bu arada başlığı özü yeniləyibsə (textContent) — dəyməyirik
    if (h.querySelector(':scope > .wow-w')) h.replaceChildren(node)
    h.removeAttribute('data-wow-split')
    h.setAttribute('data-wow-split-done', '')
  }
  setTimeout(restore, 600 + i * 70 + 700)
}

function initHero() {
  const fineWide = mq('(min-width: 768px)')
  const io = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((entries) => {
      for (const en of entries) en.target.toggleAttribute('data-wow-paused', !en.isIntersecting)
    })
    : null
  const add = () => {
    const red = reduced()
    // Öz hero-su olan səhifələr (ana səhifə): data-wow-pause — ekrandan çıxanda pauza
    document.querySelectorAll('[data-wow-pause]:not([data-wow-pause-on])').forEach(el => {
      el.setAttribute('data-wow-pause-on', '')
      io?.observe(el)
    })
    document.querySelectorAll('.ui-page-hero:not([data-wow-aurora])').forEach(h => {
      h.setAttribute('data-wow-aurora', '')
      const a = document.createElement('div')
      a.className = 'wow-aurora'
      a.setAttribute('aria-hidden', 'true')
      // 1–3: aurora ləkələri; ulduz; 4-cü və 5-ci: mövsüm bəzəkləri (data-season)
      a.innerHTML = '<i></i><i></i><i></i><b class="wow-star"></b><b class="wow-star wow-star--sm"></b><b class="wow-crescent"></b><b class="wow-sparkles"></b>'
      if (fineWide.matches) {
        a.children[0].setAttribute('data-parallax', '0.12')
        a.children[1].setAttribute('data-parallax', '0.22')
        a.children[3].setAttribute('data-parallax', '0.3')
      }
      h.appendChild(a)
      io?.observe(h)
      if (red) return
      const h1 = h.querySelector('h1')
      if (h1 && !firstPaintWindow && h.closest('.page-enter')) splitWords(h1)
      // Hero rəqəmləri: görünəndə 0-dan sayır (useReveal.js → data-count)
      h.querySelectorAll('.ui-page-hero__stats b, .ui-page-hero__stats strong, .ui-num').forEach(n => {
        if (n.hasAttribute('data-count') || n.childNodes.length !== 1 || n.firstChild.nodeType !== 3) return
        const v = parseCount(n.textContent)
        if (v != null && v >= 3) n.setAttribute('data-count', String(v))
      })
    })
  }
  onDomChange(add)
}

/* ── 5. Sekmə / seqment indikatoru ── */
const IND_WRAP = '.ui-tabs, .ui-segmented'
const IND_ACTIVE = ':scope > [aria-selected="true"], :scope > [aria-checked="true"], :scope > [aria-pressed="true"], :scope > .is-active'
function initIndicator() {
  const wraps = new Set()
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => schedule()) : null
  let raf = 0
  const measure = () => {
    raf = 0
    const reads = []
    for (const w of wraps) {
      if (!w.isConnected) { wraps.delete(w); ro?.unobserve(w); continue }
      const act = w.querySelector(IND_ACTIVE)
      reads.push([w, act ? { x: act.offsetLeft, y: act.offsetTop, w: act.offsetWidth, h: act.offsetHeight } : null])
    }
    for (const [w, m] of reads) {
      if (!m || !m.w) { w.removeAttribute('data-wow-ind'); continue }
      w.style.setProperty('--ind-x', `${m.x}px`)
      w.style.setProperty('--ind-y', `${m.y}px`)
      w.style.setProperty('--ind-w', `${m.w}px`)
      w.style.setProperty('--ind-h', `${m.h}px`)
      // İlk ölçüdə keçid yoxdur (indikator yerində doğulur)
      if (!w.hasAttribute('data-wow-ind')) {
        w.setAttribute('data-wow-ind', 'init')
        requestAnimationFrame(() => requestAnimationFrame(() => { if (w.isConnected) w.setAttribute('data-wow-ind', '') }))
      }
    }
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(measure) }
  const scan = () => {
    document.querySelectorAll(IND_WRAP).forEach(w => {
      if (wraps.has(w)) return
      wraps.add(w)
      ro?.observe(w)
    })
    schedule()
  }
  onDomChange(scan)
  // React seçimi yeniləyəndən sonra (bir kadr sonra) ölç
  const later = (e) => {
    if (e.target instanceof Element && e.target.closest(IND_WRAP)) requestAnimationFrame(schedule)
  }
  document.addEventListener('click', later, { passive: true })
  document.addEventListener('keyup', later, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
}

/* ── 6. Mövsüm (hicri təqvim) ── */
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
  const root = html()
  let forced = ''
  try { forced = new URLSearchParams(window.location.search).get('season') || '' } catch { /* */ }
  if (SEASONS.includes(forced)) { root.setAttribute('data-season', forced); return }
  // Hicri köməkçi əsas paketə düşməsin — boş vaxtda yüklənir
  const run = () => import('./hijri').then(({ gregorianToHijri, fromLocalDate }) => {
    const s = seasonOf(gregorianToHijri(fromLocalDate(new Date())))
    if (s) root.setAttribute('data-season', s)
  }).catch(() => { /* mövsüm sadəcə bəzəkdir */ })
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 })
  else setTimeout(run, 1200)
}

/* ── 7. Oxu irəliləyişi ── */
function initProgress() {
  if (document.querySelector('.wow-progress')) return
  const bar = document.createElement('div')
  bar.className = 'wow-progress'
  bar.setAttribute('aria-hidden', 'true')
  document.body.appendChild(bar)
}

/* ── 8. Səhifə yüklənmə zolağı (App.jsx → markRouteLoading) ── */
let loading = 0
let loadTimer = 0
export function markRouteLoading(promise) {
  if (typeof document === 'undefined' || !promise?.finally) return promise
  loading++
  clearTimeout(loadTimer)
  html().classList.add('qm-route-loading')
  html().classList.remove('qm-route-done')
  const end = () => {
    loading = Math.max(0, loading - 1)
    if (loading) return
    html().classList.remove('qm-route-loading')
    html().classList.add('qm-route-done')
    loadTimer = setTimeout(() => html().classList.remove('qm-route-done'), 500)
  }
  promise.then(end, end)
  return promise
}

/* ── 9. Səhifə keçidi: View Transitions API (App.jsx → navigate) ── */
let vtResolve = null
/** Yeni səhifə commit olunanda App çağırır — keçid yeni kadrı çəkir */
export function routeCommitted() {
  const r = vtResolve
  vtResolve = null
  r?.()
}
/**
 * go() — naviqasiya. Dəstək varsa View Transition içində (köhnə kadr → yeni
 * kadr, yumşaq çarpaz keçid + qalxma); yoxsa adi (.page-enter solması işləyir).
 */
export function withViewTransition(go) {
  if (typeof document === 'undefined' || typeof document.startViewTransition !== 'function' ||
    reduced() || document.visibilityState !== 'visible' || mq('(max-width: 767.98px)').matches) { go(); return }
  try {
    const root = html()
    root.classList.add('qm-vt')
    const vt = document.startViewTransition(() => new Promise((resolve) => {
      vtResolve = resolve
      go()
      // Səhifə ilişsə belə keçid gözləməsin
      setTimeout(() => { if (vtResolve === resolve) routeCommitted() }, 900)
    }))
    vt.finished.catch(() => {}).finally(() => root.classList.remove('qm-vt'))
    vt.ready?.catch?.(() => {})
    vt.updateCallbackDone?.catch?.(() => {})
  } catch {
    go()
  }
}

export function initWow() {
  if (started || typeof window === 'undefined' || typeof document === 'undefined') return
  started = true
  const go = () => {
    // Gizli başlanğıc vəziyyətləri yalnız bu sinif altında (wow.css)
    if (!reduced()) html().classList.add('wow-ready')
    // content-visibility (ui.css → .ui-cv) avtomatlaşdırılmış brauzerdə
    // (tam səhifə ekran şəkli) bölmələri boş göstərirdi — orada söndürülür
    try { if (navigator.webdriver) html().classList.add('no-cv') } catch { /* */ }
    initPointer()
    initEnter()
    initAnim()
    initParallax()
    initHero()
    initIndicator()
    initProgress()
    initSeason()
    // İlk boyamadan ~0.9 san sonra ekrandakı elementlər də animasiya ilə girir
    setTimeout(() => { firstPaintWindow = false }, 900)
    // "Hərəkəti azalt" sonradan açılsa — sinif götürülür, heç nə gizli qalmır
    const sync = () => html().classList.toggle('wow-ready', !reduced())
    try { window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', sync) } catch { /* */ }
    new MutationObserver(sync).observe(html(), { attributes: true, attributeFilter: ['class'] })
  }
  if (document.body) go()
  else document.addEventListener('DOMContentLoaded', go, { once: true })
}
