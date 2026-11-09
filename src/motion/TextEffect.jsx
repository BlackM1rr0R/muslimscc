// ═══════════════════════════════════════════════════════
// <TextEffect> — mətn söz-söz (per="word") və ya hərf-hərf (per="char") bulanıqdan açılır.
//   <TextEffect as="p" className="hp-hero-sub" preset="blur" per="word">{text}</TextEffect>
//
// • Əlçatanlıq: həqiqi mətn ekran oxuyucu üçün bir parçada (.mo-sr); bölünmüş
//   hissələr aria-hidden. Kopyalama/axtarış üçün görünən mətn də eynidir.
// • LCP: ilk açılışda (ekranda) opacity HƏMİŞƏ 1 — yalnız transform + kiçik blur
//   (mətn ilk kadrdan boyanır). Sonrakı naviqasiyada və ekrandan aşağıda — tam giriş.
// • CSS ilə işləyir (motion-kit.css → .mo-te): Motion xüsusiyyətlərini gözləmir,
//   ilk kadrda da işləyir; bir dəfə, sonsuz deyil. Hərəkəti azalt → statik.
// • Ərəbcə mətn hərf-hərf BÖLÜNMƏZ (birləşən hərflər qırılar) — per="char" avtomatik "word" olur.
// ═══════════════════════════════════════════════════════
import { useLayoutEffect, useEffect, useRef, useState } from 'react'
import { isReduced } from './reduced'
import { inFirstPaint } from '../utils/wow'
import { splitText } from './format'

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect
export default function TextEffect({ as: Tag = 'span', children, per = 'word', preset = 'blur', step, delay = 0, className = '', style, ...rest }) {
  const text = typeof children === 'string' || typeof children === 'number' ? String(children) : ''
  const ref = useRef(null)
  // static | lcp (ilk kadr: opacity 1) | armed (gizli, görünəndə açılır) | in
  const [mode, setMode] = useState('static')

  useIso(() => {
    const el = ref.current
    if (!el || !text || isReduced()) return undefined
    const r = el.getBoundingClientRect()
    const onScreen = r.top < window.innerHeight && r.bottom > 0
    if (onScreen && inFirstPaint()) { setMode('lcp'); return undefined }
    setMode('armed')
    if (typeof IntersectionObserver !== 'function') { setMode('in'); return undefined }
    const io = new IntersectionObserver((es) => {
      if (es.some(e => e.isIntersecting)) { io.disconnect(); setMode('in') }
    }, { rootMargin: '0px 0px -6% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [text])

  if (!text) return <Tag className={className} style={style} {...rest}>{children}</Tag>
  const parts = splitText(text, per)
  const stepMs = Math.round((step ?? (per === 'char' ? 0.028 : 0.06)) * 1000)
  let n = 0
  return (
    <Tag ref={ref} className={`mo-te mo-te--${preset}${mode !== 'static' ? ` is-${mode}` : ''}${className ? ` ${className}` : ''}`}
      style={{ ...style, '--te-step': `${stepMs}ms`, '--te-delay': `${Math.round(delay * 1000)}ms` }} data-wow-off="" {...rest}>
      <span className="mo-sr">{text}</span>
      <span aria-hidden="true">
        {parts.map((p, i) => (/^\s+$/.test(p) ? p : <span key={i} className="mo-te__p" style={{ '--i': Math.min(n++, 24) }}>{p}</span>))}
      </span>
    </Tag>
  )
}
