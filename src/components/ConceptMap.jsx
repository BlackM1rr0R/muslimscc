// ═══════════════════════════════════════════════════════
// ConceptMap (v5.9) — "Anlayışlar xəritəsi" (/glossary): 341 termin, lüğətin öz əlaqələri ilə şəbəkə
//
//   <ConceptMap terms={GLOSSARY} cats={GLOSSARY_CATS} lang="az" nameOf={x => …} catLabel={k => …} hrefOf={x => …} onOpen={(x, e) => …} />
//
// • Əlaqələr — hər terminin "rel" sahəsi (data/glossary*.js, tests/unit/glossary.test.js). Yeni əlaqə yoxdur.
// • Yerləşmə: kateqoriya mərkəzləri ətrafında sadə qüvvə modeli (sabit toxum — hər dəfə eyni şəkil).
// • Kətan (canvas): sürüşdür (barmaq/siçan), böyüt/kiçilt (təkər, iki barmaq, +/−), axtar.
//   Terminə toxunanda/üzərinə gələndə qonşuları parlayır; ikinci toxunuş — terminin səhifəsi.
// • Kateqoriya düymələri — həmin bölmə önə çıxır, qalanları solur.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import '../styles/ConceptMap.css'

const T = {
  az: { ey: 'Xəritə', title: 'Anlayışlar xəritəsi', lead: '{n} termin və aralarındakı {e} əlaqə — lüğətin öz "əlaqəli terminlər" siyahısından. Bir terminə toxunun: qonşuları parlayacaq; ikinci toxunuş onun səhifəsini açır.', search: 'Termin axtar…', all: 'Hamısı', reset: 'Mərkəzə qayıt', zin: 'Böyüt', zout: 'Kiçilt', links: '{n} əlaqə', open: 'Aç', hint: 'Sürüşdürün, böyüdün, terminə toxunun.' },
  en: { ey: 'Map', title: 'Map of concepts', lead: '{n} terms and the {e} links between them — from the glossary’s own “related terms” lists. Tap a term to light up its neighbours; tap again to open its page.', search: 'Search a term…', all: 'All', reset: 'Back to centre', zin: 'Zoom in', zout: 'Zoom out', links: '{n} links', open: 'Open', hint: 'Drag, zoom and tap a term.' },
  ru: { ey: 'Карта', title: 'Карта понятий', lead: '{n} терминов и {e} связей между ними — из собственных списков «связанных терминов» словаря. Коснитесь термина — загорятся соседние; повторное касание откроет его страницу.', search: 'Найти термин…', all: 'Все', reset: 'К центру', zin: 'Приблизить', zout: 'Отдалить', links: 'связей: {n}', open: 'Открыть', hint: 'Двигайте, масштабируйте, коснитесь термина.' },
  ar: { ey: 'خريطة', title: 'خريطة المفاهيم', lead: '{n} مصطلحًا و{e} رابطًا بينها — من قوائم «مصطلحات ذات صلة» في المعجم نفسه. المس مصطلحًا لتضيء جيرانه، والمس ثانية لتفتح صفحته.', search: 'ابحث عن مصطلح…', all: 'الكل', reset: 'إلى المركز', zin: 'تكبير', zout: 'تصغير', links: '{n} رابطًا', open: 'افتح', hint: 'اسحب وكبّر والمس مصطلحًا.' },
  tr: { ey: 'Harita', title: 'Kavramlar haritası', lead: '{n} terim ve aralarındaki {e} bağlantı — sözlüğün kendi “ilgili terimler” listelerinden. Bir terime dokunun: komşuları parlar; ikinci dokunuş sayfasını açar.', search: 'Terim ara…', all: 'Hepsi', reset: 'Merkeze dön', zin: 'Yakınlaştır', zout: 'Uzaklaştır', links: '{n} bağlantı', open: 'Aç', hint: 'Sürükleyin, yakınlaştırın, bir terime dokunun.' },
}
const COLORS = ['#f0c75e', '#5fd3a8', '#7db7ff', '#c79bff', '#ff9f7a', '#ffd1e3', '#9fd36a']
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '')

function layout(terms, cats, edges) {
  let seed = 11
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  const n = terms.length
  const ci = terms.map(t => Math.max(0, cats.indexOf(t.cat)))
  const centers = cats.map((_, i) => { const a = (i / cats.length) * Math.PI * 2 - Math.PI / 2; return [Math.cos(a) * 520, Math.sin(a) * 380] })
  const x = new Float32Array(n), y = new Float32Array(n), vx = new Float32Array(n), vy = new Float32Array(n)
  for (let i = 0; i < n; i++) { x[i] = centers[ci[i]][0] + (rnd() - 0.5) * 260; y[i] = centers[ci[i]][1] + (rnd() - 0.5) * 260 }
  for (let it = 0; it < 260; it++) {
    const cool = 1 - it / 260
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = x[j] - x[i], dy = y[j] - y[i], d2 = dx * dx + dy * dy + 30
        if (d2 > 90000) continue
        const f = 900 / d2
        vx[i] -= dx * f; vy[i] -= dy * f; vx[j] += dx * f; vy[j] += dy * f
      }
    }
    for (const [a, b] of edges) {
      const dx = x[b] - x[a], dy = y[b] - y[a], d = Math.sqrt(dx * dx + dy * dy) || 1, f = (d - 70) * 0.004
      vx[a] += dx / d * f * 10; vy[a] += dy / d * f * 10; vx[b] -= dx / d * f * 10; vy[b] -= dy / d * f * 10
    }
    for (let i = 0; i < n; i++) {
      const c = centers[ci[i]]
      vx[i] += (c[0] - x[i]) * 0.006; vy[i] += (c[1] - y[i]) * 0.006
      x[i] += vx[i] * 0.4 * cool; y[i] += vy[i] * 0.4 * cool
      vx[i] *= 0.55; vy[i] *= 0.55
    }
  }
  return { x, y, ci }
}

export default function ConceptMap({ terms, cats, lang = 'az', nameOf, catLabel, hrefOf, onOpen }) {
  const t = pickUi(T, lang)
  const cvRef = useRef(null)
  const wrapRef = useRef(null)
  const view = useRef({ s: 0.55, ox: 0, oy: 0 })
  const [focus, setFocus] = useState(-1)
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [tick, setTick] = useState(0)
  const redraw = useCallback(() => setTick(x => x + 1), [])

  const g = useMemo(() => {
    const idx = new Map(terms.map((x, i) => [x.id, i]))
    const set = new Set(), edges = []
    terms.forEach((x, i) => (x.rel || []).forEach(r => {
      const j = idx.get(r); if (j == null || j === i) return
      const k = i < j ? `${i}-${j}` : `${j}-${i}`
      if (!set.has(k)) { set.add(k); edges.push([Math.min(i, j), Math.max(i, j)]) }
    }))
    const deg = new Uint16Array(terms.length), nb = terms.map(() => [])
    for (const [a, b] of edges) { deg[a]++; deg[b]++; nb[a].push(b); nb[b].push(a) }
    const pos = layout(terms, cats, edges)
    const names = terms.map(x => nameOf(x))
    return { edges, deg, nb, names, ...pos }
  }, [terms, cats, nameOf])

  // Çəkmə
  useEffect(() => {
    const cv = cvRef.current, wrap = wrapRef.current
    if (!cv || !wrap) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = wrap.clientWidth, H = Math.max(420, Math.min(680, Math.round(W * 0.62)))
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = `${H}px` }
    const ctx = cv.getContext('2d')
    const { s, ox, oy } = view.current
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    const X = (i) => W / 2 + ox + g.x[i] * s, Y = (i) => H / 2 + oy + g.y[i] * s
    const lit = focus >= 0 ? new Set([focus, ...g.nb[focus]]) : null
    const catI = cat ? cats.indexOf(cat) : -1
    const qn = q.trim().toLocaleLowerCase()
    const match = qn ? new Set(g.names.map((n, i) => (n.toLocaleLowerCase().includes(qn) || String(terms[i].translit).toLowerCase().includes(qn) ? i : -1)).filter(i => i >= 0)) : null
    // xətlər
    ctx.lineWidth = 1
    for (const [a, b] of g.edges) {
      const on = lit ? (a === focus || b === focus) : false
      const dim = (lit && !on) || (catI >= 0 && g.ci[a] !== catI && g.ci[b] !== catI)
      ctx.globalAlpha = on ? 0.9 : dim ? 0.04 : 0.16
      ctx.strokeStyle = on ? '#ffe39a' : COLORS[g.ci[a] % COLORS.length]
      ctx.lineWidth = on ? 2 : 1
      ctx.beginPath(); ctx.moveTo(X(a), Y(a)); ctx.lineTo(X(b), Y(b)); ctx.stroke()
    }
    // nöqtələr
    for (let i = 0; i < terms.length; i++) {
      const on = lit ? lit.has(i) : true
      const inCat = catI < 0 || g.ci[i] === catI
      const hit = match ? match.has(i) : false
      const r = (2.5 + Math.sqrt(g.deg[i]) * 1.6) * Math.max(0.8, Math.min(1.6, s * 1.4))
      ctx.globalAlpha = (lit && !on) || (!lit && !inCat) || (!lit && match && !hit) ? 0.15 : 1
      ctx.fillStyle = i === focus ? '#ffffff' : COLORS[g.ci[i] % COLORS.length]
      ctx.beginPath(); ctx.arc(X(i), Y(i), hit ? r + 3 : r, 0, Math.PI * 2); ctx.fill()
      const label = i === focus || (lit && on) || hit || (s > 1.1 && inCat && !lit && !match) || (g.deg[i] >= 9 && inCat && !lit && !match)
      if (label) {
        ctx.font = `${i === focus ? 800 : 600} ${i === focus ? 14 : 12}px system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(8,14,32,.9)'; ctx.strokeText(g.names[i], X(i), Y(i) - r - 5)
        ctx.fillStyle = i === focus ? '#ffd979' : '#eef0f7'; ctx.fillText(g.names[i], X(i), Y(i) - r - 5)
      }
    }
    ctx.globalAlpha = 1
  }, [g, focus, cat, q, tick, terms, cats])

  // Toxunuş: sürüşdür, böyüt, seç
  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return undefined
    let drag = null, pinch = null, moved = false
    const pts = new Map()
    const nearest = (cx, cy) => {
      const r = cv.getBoundingClientRect(), W = r.width, H = r.height, { s, ox, oy } = view.current
      let best = -1, bd = 22 * 22
      for (let i = 0; i < g.x.length; i++) {
        const dx = W / 2 + ox + g.x[i] * s - (cx - r.left), dy = H / 2 + oy + g.y[i] * s - (cy - r.top), d = dx * dx + dy * dy
        if (d < bd) { bd = d; best = i }
      }
      return best
    }
    const down = (e) => { cv.setPointerCapture?.(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = false
      if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, ox: view.current.ox, oy: view.current.oy }
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: view.current.s }; drag = null } }
    const move = (e) => {
      if (!pts.has(e.pointerId)) { if (e.pointerType === 'mouse') { const i = nearest(e.clientX, e.clientY); cv.style.cursor = i >= 0 ? 'pointer' : 'grab' } return }
      pts.set(e.pointerId, [e.clientX, e.clientY])
      if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; view.current.s = Math.max(0.3, Math.min(3, pinch.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d)); moved = true; redraw(); return }
      if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) moved = true; view.current.ox = drag.ox + dx; view.current.oy = drag.oy + dy; redraw() }
    }
    const up = (e) => {
      const was = pts.has(e.pointerId); pts.delete(e.pointerId)
      if (pts.size < 2) pinch = null
      if (!was) return
      if (!moved && pts.size === 0) {
        const i = nearest(e.clientX, e.clientY)
        if (i < 0) setFocus(-1)
        else setFocus(f => { if (f === i) { onOpen?.(terms[i], e); return f } return i })
      }
      if (pts.size === 0) drag = null
    }
    const wheel = (e) => { e.preventDefault(); view.current.s = Math.max(0.3, Math.min(3, view.current.s * (e.deltaY < 0 ? 1.12 : 0.89))); redraw() }
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up)
    cv.addEventListener('wheel', wheel, { passive: false })
    const ro = new ResizeObserver(redraw); ro.observe(cv.parentElement)
    return () => { cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); cv.removeEventListener('wheel', wheel); ro.disconnect() }
  }, [g, terms, onOpen, redraw])

  // Axtarış — ilk uyğun termini mərkəzə gətir
  useEffect(() => {
    const qn = q.trim().toLocaleLowerCase()
    if (qn.length < 2) return
    const i = g.names.findIndex((n, k) => n.toLocaleLowerCase().includes(qn) || String(terms[k].translit).toLowerCase().includes(qn))
    if (i < 0) return
    view.current = { s: 1.3, ox: -g.x[i] * 1.3, oy: -g.y[i] * 1.3 }
    setFocus(i)
  }, [q, g, terms])

  const zoom = (k) => { view.current.s = Math.max(0.3, Math.min(3, view.current.s * k)); redraw() }
  const reset = () => { view.current = { s: 0.55, ox: 0, oy: 0 }; setFocus(-1); setCat(''); setQ(''); redraw() }
  const f = focus >= 0 ? terms[focus] : null

  return (
    <section className="ui-section cmap" aria-labelledby="cmap-title" data-testid="concept-map">
      <div className="ui-container">
        <div className="ui-section-head">
          <span className="ui-eyebrow">{t.ey}</span>
          <h2 id="cmap-title" className="ui-title">{t.title}</h2>
          <p className="ui-lead">{fill(t.lead, { n: terms.length, e: g.edges.length })}</p>
        </div>
        <div className="cmap__frame">
          <div className="cmap__tools">
            <label className="cmap__search"><Icon name="search" size={16} />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} aria-label={t.search} data-testid="cmap-search" />
            </label>
            <div className="cmap__cats" role="radiogroup" aria-label={t.title}>
              <button type="button" role="radio" aria-checked={!cat} className={!cat ? 'is-on' : ''} onClick={() => setCat('')}>{t.all}</button>
              {cats.map((k, i) => (
                <button key={k} type="button" role="radio" aria-checked={cat === k} className={cat === k ? 'is-on' : ''} onClick={() => setCat(c => (c === k ? '' : k))} style={{ '--c': COLORS[i % COLORS.length] }}>
                  <i aria-hidden="true" />{catLabel(k)}
                </button>
              ))}
            </div>
          </div>
          <div className="cmap__stage" ref={wrapRef}>
            <canvas ref={cvRef} className="cmap__cv" role="img" aria-label={`${t.title}: ${fill(t.lead, { n: terms.length, e: g.edges.length })}`} data-testid="cmap-canvas" />
            <div className="cmap__zoom">
              <button type="button" onClick={() => zoom(1.25)} aria-label={t.zin}><Icon name="plus" size={18} /></button>
              <button type="button" onClick={() => zoom(0.8)} aria-label={t.zout}><Icon name="minus" size={18} /></button>
              <button type="button" onClick={reset} aria-label={t.reset}><Icon name="refresh" size={16} /></button>
            </div>
          </div>
          <div className="cmap__info" aria-live="polite" data-testid="cmap-info">
            {f ? (
              <>
                <b>{nameOf(f)}</b>
                <span className="cmap__ar ui-arabic" lang="ar" dir="rtl">{f.ar}</span>
                <span className="cmap__tag" style={{ '--c': COLORS[Math.max(0, cats.indexOf(f.cat)) % COLORS.length] }}>{catLabel(f.cat)}</span>
                <span className="ui-num">{fill(t.links, { n: g.deg[focus] })}</span>
                <a className="ui-link" href={hrefOf(f)} onClick={(e) => onOpen?.(f, e)}>{t.open} →</a>
              </>
            ) : <span>{t.hint}</span>}
          </div>
        </div>
      </div>
    </section>
  )
}
