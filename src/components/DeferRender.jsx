// ═══════════════════════════════════════════════════════
// DeferRender (v5.4) — ekranın altındakı bölməni sonra render et
//
//   <DeferRender height="1500px">…ağır bölmə…</DeferRender>
//
// NİYƏ: ana səhifənin ilk React render-i (CPU ×4 telefon ölçüsü) bir 1 s-lik
// tapşırıq idi — 10+ bölmənin hamısı eyni anda qurulurdu, sonra bütöv səhifə
// bir dəfəyə yerləşdirilirdi (Layout ~0.8 s). İndi yalnız ilk ekran dərhal
// qurulur; qalan bölmələr ekrana 600 px yaxınlaşanda və ya yükləmədən sonra
// boş vaxtda (whenIdle) — hər biri ayrıca kiçik tapşırıqda — render olunur.
// Yer tutucu bölmənin təxmini hündürlüyündədir (səhifə tullanmır, sürüşmə
// mövqeyi qorunur). SEO-ya təsiri yoxdur: robotlar üçün məzmun prerender
// HTML-indədir (scripts/seo-body.mjs), React onu onsuz da əvəz edir.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { whenIdle } from '../utils/idle'

export default function DeferRender({ children, height = '400px', rootMargin = '600px 0px', delay = 300 }) {
  const [on, setOn] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (on) return undefined
    let alive = true
    const go = () => { if (alive) setOn(true) }
    let io = null
    if (typeof IntersectionObserver === 'function' && ref.current) {
      io = new IntersectionObserver((es) => { if (es.some(e => e.isIntersecting)) go() }, { rootMargin })
      io.observe(ref.current)
    } else go()
    whenIdle({ delay }).then(go)
    return () => { alive = false; io?.disconnect() }
  }, [on, rootMargin, delay])
  if (on) return children
  return <div ref={ref} className="defer-ph" style={{ minHeight: height }} aria-hidden="true" />
}
