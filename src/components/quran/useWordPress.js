// ═══════════════════════════════════════════════════════
// Quran oxuyucusunda sözə uzun basma (v7) — jestin tanınması (WordMenu.jsx açır)
//
//   useWordPress(listRef, onOpen, { prefetch, active })
//
// • Toxunma/qələm: barmaq ~450 ms yerində qalsa (≤ 8 px) — titrəmə + menyu,
//   barmaq ekrandan qaldırılmadan düyməyə sürüşdürülüb buraxılır (və ya toxunulur).
//   Jest vaxtı yalnız HƏMİN sözün mətnində user-select söndürülür (.is-pressing) —
//   sistemin seçmə/kopyala menyusu (iOS callout) çıxmasın; sürüşmə (scroll) işləyir.
// • Siçan: sağ klik (seçilmiş mətnin üstündə — brauzerin öz menyusu qalır) və ya
//   yerində uzun basma. Adi sürüşdürüb seçmə toxunulmazdır.
// • Klaviatura: hər ayədə «…» düyməsi (QuranPage → AyahCard) — eyni menyu, siyahı kimi.
// • DOM dəyişmir: söz <span>-a bükülmür — sözün yeri Range ilə ölçülür.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef } from 'react'
import { haptic } from '../../hooks/useHaptic'
import { RADIAL, movedBeyond } from '../../utils/radialMenu'
import { ayahWordTokens } from '../../utils/ayahWords'

/** Elementin mətnində [start, end) aralığı üçün Range (bir neçə mətn düyünü ola bilər) */
export function rangeFor(el, start, end) {
  if (!el || typeof document === 'undefined') return null
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const r = document.createRange()
  let pos = 0, node, began = false
  while ((node = walker.nextNode())) {
    const len = node.nodeValue.length
    if (!began && start <= pos + len) { r.setStart(node, Math.max(0, start - pos)); began = true }
    if (began && end <= pos + len) { r.setEnd(node, Math.max(0, end - pos)); return r }
    pos += len
  }
  return began ? r : null
}

/** Sözün ekrandakı düzbucaqlıları (viewport px) */
export function wordRects(el, token) {
  const r = token ? rangeFor(el, token.start, token.end) : null
  if (!r) return []
  return [...r.getClientRects()].filter(x => x.width > 0 && x.height > 0)
    .map(x => ({ left: x.left, top: x.top, right: x.right, bottom: x.bottom, width: x.width, height: x.height }))
}

/** Nöqtənin altındakı (və ya ən yaxın) söz: { token, rects } | null */
export function wordAtPoint(el, x, y) {
  const tokens = ayahWordTokens(el?.textContent || '')
  let best = null, bd = Infinity
  for (const t of tokens) {
    for (const rc of wordRects(el, t)) {
      const dx = x < rc.left ? rc.left - x : x > rc.right ? x - rc.right : 0
      const dy = y < rc.top ? rc.top - y : y > rc.bottom ? y - rc.bottom : 0
      const d = dx * dx + dy * dy * 4   // sətirlər arası səhvə daha həssas
      if (d < bd) { bd = d; best = t }
      if (d === 0) return { token: t, tokens }
    }
  }
  return best ? { token: best, tokens } : null
}

const ayahOf = el => Number(el?.closest('[data-ayah]')?.getAttribute('data-ayah')) || 0
// Əzbər rejimində bulanmış (açılmamış) ayədə menyu açılmır — sözün mənası "ipucu" olmasın
const hidden = el => !!el?.closest('.is-memorize') && !el.closest('[data-revealed]')

export default function useWordPress(listRef, onOpen, { prefetch, active = true } = {}) {
  const openRef = useRef(onOpen)
  openRef.current = onOpen
  const prefetchRef = useRef(prefetch)
  prefetchRef.current = prefetch

  useEffect(() => {
    if (!active) return undefined
    // Dinləyicilər sənəddədir (siyahı elementi sonradan yarana/dəyişə bilər) — hədəf listRef-in içində olmalıdır
    const inList = el => !!el && !!listRef.current?.contains(el)
    let g = null            // gedən jest
    let lastTouch = 0       // son toxunuşun vaxtı (Android uzun basmada contextmenu da göndərir)

    const clear = () => {
      if (!g) return
      clearTimeout(g.timer)
      g.el.classList.remove('is-pressing')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
      g = null
    }
    const fire = () => {
      if (!g) return
      const cur = g
      const hit = wordAtPoint(cur.el, cur.x, cur.y)
      const a = ayahOf(cur.el)
      if (!hit || !a) { clear(); return }
      haptic(10)
      try { window.getSelection()?.removeAllRanges() } catch { /* */ }
      // Jestin davamı (barmağın hərəkəti, buraxılması) artıq WordMenu-dadır;
      // menyu yüklənənə qədər buraxılıbsa — gesture.up deyir
      const gesture = { pointerId: cur.pointerId, up: false, x: cur.x, y: cur.y }
      cur.gesture = gesture
      cur.fired = true
      openRef.current?.({ mode: 'radial', x: cur.x, y: cur.y, el: cur.el, a, pos: hit.token.pos, tracking: true, gesture, touch: cur.type !== 'mouse' })
    }
    function onMove(e) {
      if (!g || e.pointerId !== g.pointerId) return
      if (g.fired) { if (g.gesture) { g.gesture.x = e.clientX; g.gesture.y = e.clientY } return }
      if (movedBeyond({ x: g.x, y: g.y }, { x: e.clientX, y: e.clientY }, RADIAL.slop)) clear()
    }
    function onEnd(e) {
      if (!g || e.pointerId !== g.pointerId) return
      if (g.gesture) g.gesture.up = true
      clear()
    }
    const onDown = (e) => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
      const el = e.target?.closest?.('.ayah-arabic')
      if (!inList(el) || hidden(el)) return
      clear()
      if (e.pointerType !== 'mouse') { lastTouch = Date.now(); el.classList.add('is-pressing') }
      prefetchRef.current?.()
      g = { el, x: e.clientX, y: e.clientY, pointerId: e.pointerId, type: e.pointerType, fired: false, gesture: null }
      g.timer = setTimeout(fire, RADIAL.holdMs)
      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('pointerup', onEnd)
      window.addEventListener('pointercancel', onEnd)
    }
    const onContext = (e) => {
      const el = e.target?.closest?.('.ayah-arabic')
      if (!inList(el)) return
      // Toxunuşla uzun basma — sistemin menyusu yox, bizimki (artıq açılıb və ya açılacaq)
      if (Date.now() - lastTouch < 1500) { e.preventDefault(); return }
      if (hidden(el)) return
      // Sağ klik: mətn seçilibsə — brauzerin öz menyusu (Kopyala) qalır
      const sel = window.getSelection?.()
      if (sel && !sel.isCollapsed && el.contains(sel.anchorNode)) return
      const hit = wordAtPoint(el, e.clientX, e.clientY)
      const a = ayahOf(el)
      if (!hit || !a) return
      e.preventDefault()
      clear()
      prefetchRef.current?.()
      openRef.current?.({ mode: 'radial', x: e.clientX, y: e.clientY, el, a, pos: hit.token.pos, tracking: false, focus: true })
    }
    document.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('contextmenu', onContext)
    return () => {
      clear()
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('contextmenu', onContext)
    }
  }, [listRef, active])
}
