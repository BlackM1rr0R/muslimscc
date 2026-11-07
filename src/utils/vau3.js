// VAU 3 (vau3.css) üçün kiçik JS: [data-spotlight] panelində kursoru izləyən
// işıq ləkəsi (--mx / --my). Yalnız dəqiq göstərici (siçan), kadr başına bir
// yazma (rAF), hərəkəti azalt — heç nə etmir. Tək qlobal dinləyici (delegasiya),
// ona görə SPA naviqasiyasında yeni panellər avtomatik işləyir.
let raf = 0
let pending = null

function reduced() {
  return document.documentElement.classList.contains('a11y-reduce-motion') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function onMove(e) {
  if (e.pointerType && e.pointerType !== 'mouse') return
  const el = e.target instanceof Element ? e.target.closest('[data-spotlight]') : null
  if (!el) return
  pending = { el, x: e.clientX, y: e.clientY }
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    const p = pending
    if (!p || reduced()) return
    const r = p.el.getBoundingClientRect()
    p.el.style.setProperty('--mx', `${Math.round(p.x - r.left)}px`)
    p.el.style.setProperty('--my', `${Math.round(p.y - r.top)}px`)
  })
}

// Günün vaxtı (html[data-daypart]): gecə (20:00–05:00, cihazın yerli saatı) —
// qaranlıq rejimdə səthlər zümrüd-qaradan gecə mavisinə keçir, işıqlı rejimdə
// hero/footer işıqları axşam tonuna dönür (vau3.css §12). Test: ?daypart=night|day
function initDaypart() {
  const root = document.documentElement
  let forced = ''
  try { forced = new URLSearchParams(window.location.search).get('daypart') || '' } catch { /* */ }
  const apply = () => {
    const h = new Date().getHours()
    const part = forced === 'night' || forced === 'day' ? forced : (h >= 20 || h < 5 ? 'night' : 'day')
    if (root.getAttribute('data-daypart') !== part) root.setAttribute('data-daypart', part)
  }
  apply()
  setInterval(apply, 10 * 60 * 1000)
}

export function initVau3() {
  if (typeof window === 'undefined') return
  initDaypart()
  if (!window.matchMedia('(pointer: fine)').matches) return
  document.addEventListener('pointermove', onMove, { passive: true })
}
