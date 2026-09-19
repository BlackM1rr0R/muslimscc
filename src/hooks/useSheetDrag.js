// ═══════════════════════════════════════════════════════
// useSheetDrag — aşağıdan qalxan vərəqi tutacaqdan aşağı çəkib bağlamaq
//
//   const panelRef = useRef(null)
//   const drag = useSheetDrag(panelRef, onClose)
//   <div className="m-sheet-grab" {...drag}>…tutacaq + başlıq…</div>
//
// • Barmaq/siçan (Pointer Events), pointer capture ilə — barmaq tutacaqdan
//   çıxsa da izləmə davam edir. Tutacaq elementində touch-action:none olmalıdır
//   (motion.css → .m-sheet-grab, SideNav.css → .qm-sn-grab).
// • 80px-dən çox çəkmək və ya sürətli "atma" (≥ 0.5 px/ms) vərəqi bağlayır;
//   az çəkiləndə vərəq yay kimi yerinə qayıdır (CSS keçidi).
// • Yuxarı çəkəndə "rezin" müqaviməti: hərəkət kök qanunu ilə azalır, ən çox 24px.
// • Çəkmə irəlilədikcə vərəqin valideyninə --sheet-drag (0…1) yazılır —
//   CSS arxa fonun şəffaflığını onunla azalda bilər.
// • İş yalnız transform ilə (layout yoxdur); düymələrdən başlayan toxunuş
//   (✕ və s.) çəkmə sayılmır.
// ═══════════════════════════════════════════════════════

import { useMemo, useRef } from 'react'

const CLOSE_PX = 80
const FLICK_PX = 24
const FLICK_SPEED = 0.5 // px/ms
const RUBBER_MAX = 24

export function useSheetDrag(panelRef, onClose) {
  const stateRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  return useMemo(() => {
    const setProgress = (panel, p) => {
      panel.parentElement?.style.setProperty('--sheet-drag', String(p))
    }

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      if (e.target.closest?.('button, a, input, select, textarea')) return
      const panel = panelRef.current
      if (!panel) return
      stateRef.current = {
        id: e.pointerId, y0: e.clientY, dy: 0,
        lastY: e.clientY, lastT: performance.now(), v: 0,
        h: panel.getBoundingClientRect().height || 1,
      }
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* köhnə brauzer */ }
      panel.style.transition = 'none'
      panel.parentElement?.classList.add('is-dragging')
    }

    const onPointerMove = (e) => {
      const s = stateRef.current
      if (!s || s.id !== e.pointerId) return
      const raw = e.clientY - s.y0
      // Yuxarı: rezin müqaviməti; aşağı: barmağı birbaşa izlə
      s.dy = raw >= 0 ? raw : -Math.min(RUBBER_MAX, Math.sqrt(-raw) * 2.2)
      const now = performance.now()
      const dt = Math.max(1, now - s.lastT)
      s.v = (e.clientY - s.lastY) / dt
      s.lastY = e.clientY
      s.lastT = now
      const panel = panelRef.current
      if (!panel) return
      panel.style.transform = `translate3d(0, ${s.dy}px, 0)`
      setProgress(panel, Math.max(0, Math.min(1, s.dy / s.h)))
    }

    const onPointerEnd = (e) => {
      const s = stateRef.current
      if (!s || s.id !== e.pointerId) return
      stateRef.current = null
      const panel = panelRef.current
      if (!panel) return
      panel.style.transition = ''
      panel.parentElement?.classList.remove('is-dragging')
      setProgress(panel, 0)
      const shouldClose = s.dy > CLOSE_PX || (s.dy > FLICK_PX && s.v > FLICK_SPEED)
      if (shouldClose) {
        closeRef.current?.()
        // "is-open" götürüləndən sonra inline transform silinir — vərəq olduğu
        // yerdən aşağı sürüşüb gedir (əvvəlcə yuxarı sıçramır)
        requestAnimationFrame(() => { panel.style.transform = '' })
      } else {
        panel.style.transform = ''
      }
    }

    return {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    }
  }, [panelRef])
}

export default useSheetDrag
