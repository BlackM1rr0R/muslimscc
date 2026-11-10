// ═══════════════════════════════════════════════════════
// Mushaf: vərəqi barmaqla (siçanla) çevirmək — jest + kadr-kadr çəkmə.
// Riyaziyyat: src/utils/pageCurl.js. Yalnız MushafPage işlədir.
//
// • Pointer Events; səhnədə touch-action: pan-y — şaquli scroll brauzerindir,
//   vərəq yalnız əsasən üfüqi hərəkətdə (slop-dan sonra) qalxır. Qısa toxunuş
//   (sözə, ayəyə) olduğu kimi klik olaraq qalır.
// • Siçan — yalnız xarici kənar zolağından; toxunuş — vərəqin hər yerindən
//   (köhnə "sürüşdürmə" jestini əvəz edir, iki rəqib jest yoxdur).
// • Çəkmə zamanı React render etmir: rAF ilə DOM-a birbaşa clip-path/transform.
// • Buraxanda: 35% və ya sürətli atma → yayla tamamlanır, yoxsa geri qayıdır.
// • Hərəkəti azalt (reduced): heç bir animasiya yoxdur — buraxanda qərar
//   verilir və səhifə dərhal dəyişir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import {
  CURL, curlZone, classifyDrag, curlPointer, turnProgress, shouldComplete, velocityFrom,
  foldGeometry, polygonCss, matrixCss, gradientAt, springStep,
} from '../../utils/pageCurl'

const relRect = (el, base) => {
  const r = el.getBoundingClientRect()
  return { left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height }
}

/**
 * opts: { stageRef, spread, canNext, canPrev, reduced, onBegin(dir, box), onCommit(dir), onCancel() }
 * Layer ref-ləri (under, flap, shade, gloss) — refs obyektində; onBegin-dən sonra
 * React layer-i qurur, birinci rAF kadrı onları tapır.
 */
export default function useMushafCurl(opts) {
  const o = useRef(opts)
  useLayoutEffect(() => { o.current = opts })
  const refs = useRef({ under: null, flap: null, shade: null, gloss: null })
  const g = useRef(null)        // aktiv jest
  const raf = useRef(0)
  const suppress = useRef(0)

  const paint = useCallback(() => {
    raf.current = 0
    const s = g.current
    if (!s || !s.box) return
    const { under, flap, shade, gloss } = refs.current
    if (!under || !flap) { raf.current = requestAnimationFrame(paint); return }
    const { w, h } = s.box.leaf
    const geo = foldGeometry(w, h, s.o, s.p)
    const clip = polygonCss(geo.cut)
    under.style.clipPath = clip
    flap.style.clipPath = clip
    flap.style.transform = matrixCss(geo.matrix)
    if (geo.len > 0) {
      const back = { x: -geo.n.x, y: -geo.n.y }            // qatdan O-ya doğru
      const { deg, at } = gradientAt(w, h, geo.mid, back)
      const half = geo.len / 2
      if (shade) shade.style.backgroundImage = `linear-gradient(${deg}deg, rgba(0,0,0,.32) ${at}px, rgba(0,0,0,.1) ${at + 22}px, rgba(0,0,0,0) ${at + 70}px)`
      if (gloss) gloss.style.backgroundImage = `linear-gradient(${deg}deg, rgba(0,0,0,.2) ${at}px, rgba(255,255,255,.4) ${at + Math.max(4, half * 0.1)}px, rgba(255,255,255,0) ${at + half * 0.5}px, rgba(0,0,0,.12) ${at + half}px)`
    }
  }, [])
  const schedule = useCallback(() => { if (!raf.current) raf.current = requestAnimationFrame(paint) }, [paint])

  const finish = useCallback((complete) => {
    const s = g.current
    g.current = null
    if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0 }
    if (!s) return
    if (complete) o.current.onCommit(s.dir)
    else o.current.onCancel()
  }, [])

  // Yayla tamamlanma / geri qayıtma
  const settle = useCallback((complete, v0) => {
    const s = g.current
    if (!s) return
    s.anim = true
    if (o.current.reduced || !s.box) { finish(complete); return }
    const target = complete ? { x: s.o.x + s.dir * 2 * s.box.leaf.w, y: s.o.y } : { x: s.o.x, y: s.o.y }
    // Atma sürəti yayın başlanğıc sürəti olur (yalnız hərəkət istiqamətinə uyğundursa)
    const forward = v0 * s.dir > 0
    let x = { x: s.p.x, v: forward === complete ? Math.max(-3, Math.min(3, v0)) : 0 }
    let y = { x: s.p.y, v: 0 }
    let last = performance.now()
    const tick = (now) => {
      if (g.current !== s) return
      const dt = Math.max(1, now - last)
      last = now
      x = springStep(x.x, x.v, target.x, dt)
      y = springStep(y.x, y.v, target.y, dt)
      s.p = { x: x.x, y: y.x }
      // Tamamlananda qat cildi keçməsin (sıçrayış yalnız geri qayıdanda)
      const done = Math.abs(x.x - target.x) < 2.5 && Math.abs(y.x - target.y) < 2.5 && Math.abs(x.v) < 0.08
      const passed = complete && (x.x - target.x) * s.dir >= 0
      if (done || passed) { s.p = target; paint(); finish(complete); return }
      paint()
      raf.current = requestAnimationFrame(tick)
    }
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(tick)
  }, [finish, paint])

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current) }, [])

  const onPointerDown = useCallback((e) => {
    if (g.current) { if (!g.current.active) g.current = null; else return }
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
    const t = e.target
    if (!t.closest?.('.mp-book .mp-sheet') || t.closest('.mp-pop, a, input, select, textarea')) return
    const { spread } = o.current
    const stage = o.current.stageRef.current
    const book = stage?.querySelector('.mp-book')
    if (!book) return
    const sheet = t.closest('.mp-sheet')
    const r = sheet.getBoundingClientRect()
    let zone = curlZone(e.clientX - r.left, r.width, e.pointerType)
    if (zone === null) return
    let leaf = sheet
    if (spread) {
      // İki səhifə: növbəti — sol vərəqin sol kənarı, əvvəlki — sağ vərəqin sağ kənarı
      const isLeft = sheet.classList.contains('mp-sheet--left')
      const want = isLeft ? 1 : -1
      if (zone !== 0 && zone !== want) return
      zone = want
    }
    g.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, zone, leaf, book, stage, type: e.pointerType, active: false, samples: [] }
  }, [])

  const onPointerMove = useCallback((e) => {
    const s = g.current
    if (!s || s.id !== e.pointerId || s.anim) return
    const dx = e.clientX - s.x0
    const dy = e.clientY - s.y0
    if (!s.active) {
      const kind = classifyDrag(dx, dy)
      if (kind === 'pending') return
      const dir = dx > 0 ? 1 : -1
      const { canNext, canPrev, reduced, spread } = o.current
      if (kind === 'scroll' || (s.zone !== 0 && s.zone !== dir) || (dir === 1 ? !canNext : !canPrev)) { g.current = null; return }
      s.active = true
      s.dir = dir
      try { s.stage.setPointerCapture(e.pointerId) } catch { /* köhnə brauzer */ }
      try { window.getSelection?.()?.removeAllRanges() } catch { /* */ }
      const stageBox = s.stage.getBoundingClientRect()
      const leafR = relRect(s.leaf, stageBox)
      const clip = spread ? relRect(s.book, stageBox) : leafR
      const leaf = { left: leafR.left - clip.left, top: leafR.top - clip.top, w: leafR.width, h: leafR.height }
      s.box = reduced ? null : { clip, leaf }
      const ly = Math.min(leaf.h, Math.max(0, s.y0 - stageBox.top - leafR.top))
      s.o = { x: dir === 1 ? 0 : leaf.w, y: ly }
      s.leafH = leaf.h
      s.travel = spread ? 2 * leaf.w : leaf.w
      o.current.onBegin(dir, s.box)
    }
    s.samples.push({ x: e.clientX, t: e.timeStamp || performance.now() })
    if (s.samples.length > 8) s.samples.shift()
    s.dx = dx
    s.p = curlPointer({ o: s.o, dx, dy, h: s.leafH, dir: s.dir })
    if (s.box) schedule()
  }, [schedule])

  const onPointerUp = useCallback((e) => {
    const s = g.current
    if (!s || s.id !== e.pointerId || s.anim) return
    if (!s.active) { g.current = null; return }
    try { s.stage.releasePointerCapture(e.pointerId) } catch { /* */ }
    // Toxunuşun ardınca gələn klik (sözə, ayəyə) vərəqləmədən sonra işləməsin
    suppress.current = Date.now()
    // Buraxma anı da nümunədir: dayanıb buraxanda sürət sıfırdır (atma sayılmır)
    s.samples.push({ x: e.clientX, t: e.timeStamp || performance.now() })
    const v = velocityFrom(s.samples) * s.dir
    const progress = turnProgress(s.dx || 0, s.travel, s.dir)
    settle(shouldComplete(progress, v), v * s.dir)
  }, [settle])

  const onPointerCancel = useCallback((e) => {
    const s = g.current
    if (!s || s.id !== e.pointerId || s.anim) return
    if (!s.active) { g.current = null; return }
    settle(false, 0)
  }, [settle])

  const onClickCapture = useCallback((e) => {
    if (suppress.current && Date.now() - suppress.current < 450) {
      suppress.current = 0
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  return { refs, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture } }
}

export { CURL }
