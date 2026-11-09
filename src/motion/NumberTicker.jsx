// ═══════════════════════════════════════════════════════
// <NumberTicker value={6236} lang={lang} /> — görünəndə `from`-dan dəyərə YAYLA sayır.
//   props: value, lang, from=0, decimals=0, prefix, suffix, compact, className, delay (san)
//
// • İlk render-də (və JS/animasiya yoxdursa) SON dəyər yazılıb — prerender, ekran
//   oxuyucu, kopyalama həmişə düzgün rəqəmi görür; sayğac hissəsi aria-hidden.
// • React yenidən render olunmur: rəqəm ref-ə birbaşa yazılır, yalnız dəyişəndə,
//   tabular-nums ilə (en "titrəmir"). Dəyər sonradan dəyişsə — köhnədən yeniyə yaylanır.
// • İlk açılışda ekranda olan rəqəm saymır (LCP/yanıb-sönmə); hərəkəti azalt → statik.
// ═══════════════════════════════════════════════════════
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useSpring } from 'motion/react'
import { formatTicker } from './format'
import { isReduced } from './reduced'
import { inFirstPaint } from '../utils/wow'

export default function NumberTicker({ value, lang = 'az', from = 0, decimals = 0, prefix = '', suffix = '', compact = false, delay = 0, className = '', ...rest }) {
  const target = Number(value) || 0
  const fmt = (v) => formatTicker(v, { lang, decimals, prefix, suffix, compact })
  const ref = useRef(null)
  const started = useRef(false)
  const spring = useSpring(target, { stiffness: 70, damping: 22, mass: 1, restDelta: 10 ** -(decimals + 1) })
  const fmtRef = useRef(fmt)
  fmtRef.current = fmt

  // Mətni React yox, bu komponent yazır (React mətn düyünü ilə toqquşmasın).
  // Boyamadan əvvəl cari dəyər — ilk kadrda son rəqəm görünür.
  const final = fmt(target)
  useLayoutEffect(() => {
    const el = ref.current
    if (el) el.textContent = fmtRef.current(started.current ? spring.get() : target)
  }, [final, spring, target])

  // Spring dəyişdikcə mətni yaz (yalnız fərqlidirsə)
  useEffect(() => spring.on('change', (v) => {
    const el = ref.current
    if (!el) return
    const s = fmtRef.current(v)
    if (el.textContent !== s) el.textContent = s
  }), [spring])

  // Görünəndə from → target; sonra dəyər dəyişəndə köhnədən yeniyə.
  // Layout effekti: gözləmə vəziyyəti (from) boyamadan əvvəl yazılır — "son rəqəm → 0" sıçrayışı yoxdur.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (started.current) { spring.set(target); return undefined }
    const skip = isReduced() || typeof IntersectionObserver !== 'function'
    const r = el.getBoundingClientRect()
    if (skip || (inFirstPaint() && r.top < window.innerHeight && r.bottom > 0)) {
      started.current = true
      spring.jump(target)
      return undefined
    }
    let t = 0
    el.textContent = fmtRef.current(from)
    const io = new IntersectionObserver((es) => {
      if (!es.some(e => e.isIntersecting)) return
      io.disconnect()
      started.current = true
      spring.jump(from)
      t = setTimeout(() => spring.set(target), Math.max(0, delay * 1000))
    }, { rootMargin: '0px 0px -10% 0px' })
    io.observe(el)
    return () => { io.disconnect(); clearTimeout(t) }
  }, [target, from, delay, spring])

  return (
    <span className={`mo-ticker${className ? ` ${className}` : ''}`} {...rest}>
      <span className="mo-sr">{final}</span>
      <span ref={ref} aria-hidden="true" />
    </span>
  )
}
