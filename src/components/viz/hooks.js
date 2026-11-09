// ═══════════════════════════════════════════════════════
// viz v2 — ortaq hook-lar
//   useSize(ref)        — elementin eni/hündürlüyü (ResizeObserver)
//   useReducedMotion()  — sistem "hərəkəti azalt" və ya html.a11y-reduce-motion
//   useInView(ref)      — element bir dəfə ekrana girdimi (çəkilmə animasiyası üçün)
//   useVizFormat(lang?) — dil konteksti + makeFormat + vizText
// ═══════════════════════════════════════════════════════
import { useEffect, useId, useMemo, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { makeFormat, vizText } from './format.js'

export function useSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      const r = el.getBoundingClientRect()
      const w = Math.round(r.width), h = Math.round(r.height)
      setSize(s => (s.width === w && s.height === h ? s : { width: w, height: h }))
    }
    read()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', read)
      return () => window.removeEventListener('resize', read)
    }
    let raf = 0
    const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(read) })
    ro.observe(el)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [ref])
  return size
}

export function useReducedMotion() {
  const get = () => {
    if (typeof window === 'undefined') return true
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.classList.contains('a11y-reduce-motion')
    } catch { return false }
  }
  const [reduced, setReduced] = useState(get)
  useEffect(() => {
    let mq
    try { mq = window.matchMedia('(prefers-reduced-motion: reduce)') } catch { return }
    const on = () => setReduced(get())
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return reduced
}

/** Bir dəfə görünəndə true olur (IntersectionObserver yoxdursa — dərhal). */
export function useInView(ref, { rootMargin = '0px 0px -10% 0px' } = {}) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return }
    const io = new IntersectionObserver((ents) => {
      if (ents.some(e => e.isIntersecting)) { setSeen(true); io.disconnect() }
    }, { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, seen, rootMargin])
  return seen
}

/** Dil (prop → kontekst → 'az'), formatlayıcılar və qrafik yazıları. */
export function useVizFormat(langProp) {
  const ctx = useLang()
  const lang = langProp || ctx?.lang || 'az'
  return useMemo(() => ({ ...makeFormat(lang), t: vizText(lang) }), [lang])
}

/** Sabit unikal id (SVG gradient, aria-describedby üçün; ":" url(#…)-da problem yaratmasın). */
export function useUid(prefix = 'vz') {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
}
