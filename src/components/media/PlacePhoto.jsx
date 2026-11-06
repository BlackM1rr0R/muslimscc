import { useEffect, useRef, useState } from 'react'
import { placePhoto, PHOTO_LABEL } from '../../data/placeImages'
import './media.css'
import { pickUi } from '../../utils/uiText'

/* ═══════════════════════════════════════════════════════
   Yer fotoşəkli — <figure> + srcset (800w / ~1600w) + atribusiya
   • width/height həmişə verilir və CSS aspect-ratio 3/2 — CLS yoxdur
   • loading="lazy" (hero-da eager + fetchpriority="high")
   • yükləndikdə yumşaq görünür (opacity + kiçik miqyas; reduced-motion-da yox)
   • altında "Foto: müəllif · lisenziya" (CC BY / BY-SA tələbidir) —
     müəllif adı Commons səhifəsinə, lisenziya adı lisenziya mətninə keçid;
     creditLinks={false} — düymə/keçid içində (iç-içə interaktiv element
     olmasın) yalnız mətn; keçidlər /licenses səhifəsindədir
   ═══════════════════════════════════════════════════════ */
export default function PlacePhoto({ id, lang = 'az', sizes = '(min-width: 1024px) 400px, 100vw', eager = false, className = '', credit = true, creditLinks = true, ratio }) {
  const p = placePhoto(id)
  const imgRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  // Brauzer şəkli React-dan əvvəl yükləyibsə (keş), onLoad gəlməyə bilər
  useEffect(() => { if (imgRef.current?.complete) setLoaded(true) }, [id])
  const parallax = /(^|\s)ph--parallax(\s|$)/.test(className)
  const figRef = useRef(null)
  useEffect(() => {
    if (!parallax || typeof IntersectionObserver === 'undefined') return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const fig = figRef.current
    if (!fig) return undefined
    let raf = 0, on = false
    const update = () => {
      raf = 0
      const r = fig.getBoundingClientRect(), vh = window.innerHeight || 1
      const k = Math.max(-1, Math.min(1, ((r.top + r.height / 2) / vh - 0.5) * 2)) // −1 yuxarı … 1 aşağı
      fig.style.setProperty('--ph-par', `${(k * 6).toFixed(2)}%`)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !on) { on = true; window.addEventListener('scroll', onScroll, { passive: true }); update() }
      else if (!e.isIntersecting && on) { on = false; window.removeEventListener('scroll', onScroll) }
    })
    io.observe(fig)
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [parallax])
  if (!p) return null

  const small = p.sizes[800]
  const big = p.sizes[1600]
  const alt = pickUi(p.alt, lang, 'en')
  const style = ratio ? { '--ph-ratio': ratio } : undefined
  return (
    <figure ref={figRef} className={`ph${loaded ? ' is-loaded' : ''}${className ? ` ${className}` : ''}`} style={style}>
      <span className="ph__frame">
        <img
          ref={imgRef}
          className="ph__img"
          src={`/images/places/${id}-800.webp`}
          srcSet={`/images/places/${id}-800.webp ${small.w}w, /images/places/${id}-1600.webp ${big.w}w`}
          sizes={sizes}
          width={small.w}
          height={small.h}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          {...(eager ? { fetchpriority: 'high' } : {})}
          onLoad={() => setLoaded(true)}
        />
      </span>
      {credit && (
        <figcaption className="ph__credit">
          <span>{pickUi(PHOTO_LABEL, lang, 'en')}: </span>
          {creditLinks
            ? <a href={p.page} target="_blank" rel="noopener noreferrer" dir="auto">{p.author}</a>
            : <span dir="auto">{p.author}</span>}
          <span aria-hidden="true"> · </span>
          {creditLinks && p.licenseUrl
            ? <a href={p.licenseUrl} target="_blank" rel="noopener noreferrer license" dir="ltr">{p.license}</a>
            : <span dir="ltr">{p.license}</span>}
        </figcaption>
      )}
    </figure>
  )
}
