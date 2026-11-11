// ═══════════════════════════════════════════════════════
// HadithGalaxy (v6.0) — "Hədis qalaktikası" (/hadith): hər hədis bir ulduz, mövzular — bürclər
//
//   <HadithGalaxy list={list} cats={cats} catsEn={CATS_EN} lang="az" sourceOf={s => …} onPickCat={i => …} />
//
// • Məlumat — səhifənin öz təkrarsız siyahısı (dərəcəsi, mənbəyi ilə; yeni mətn yoxdur).
//   Ulduzun parlaqlığı — dərəcə qrupu (utils/hadithGrade: səhih/həsən daha parlaq).
// • Kətan (canvas): mövzu bürcünə toxun → siyahı həmin mövzuya süzülür; ulduza toxun →
//   hədisin mətni və mənbəyi açılır. Animasiya yalnız göstərici hərəkətində (paralaks), sonsuz döngü yoxdur.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { pickUi } from '../utils/uiText'
import { gradeGroup } from '../utils/hadithGrade'
import '../styles/HadithGalaxy.css'

const T = {
  az: { ey: 'Qalaktika', title: 'Hədis qalaktikası', lead: '{n} hədis — hər biri bir ulduz, mövzular bürc kimi. Bürcə toxunun: siyahı həmin mövzuya süzüləcək; ulduza toxunun: hədis açılacaq.', show: 'Bu mövzunu siyahıda göstər', hint: 'Bürcə və ya ulduza toxunun.', bright: 'Parlaq ulduz — səhih və ya həsən', n: '{n} hədis' },
  en: { ey: 'Galaxy', title: 'The hadith galaxy', lead: '{n} hadiths — each a star, the topics as constellations. Tap a constellation to filter the list by that topic; tap a star to open the hadith.', show: 'Show this topic in the list', hint: 'Tap a constellation or a star.', bright: 'Bright star — sahih or hasan', n: '{n} hadiths' },
  ru: { ey: 'Галактика', title: 'Галактика хадисов', lead: '{n} хадисов — каждый звезда, темы — созвездия. Коснитесь созвездия, чтобы отфильтровать список по теме; коснитесь звезды — откроется хадис.', show: 'Показать эту тему в списке', hint: 'Коснитесь созвездия или звезды.', bright: 'Яркая звезда — сахих или хасан', n: 'хадисов: {n}' },
  ar: { ey: 'مجرة', title: 'مجرة الأحاديث', lead: '{n} حديثًا — كل حديث نجمة، والموضوعات كوكبات. المس كوكبة لتصفية القائمة بموضوعها، والمس نجمة ليظهر الحديث.', show: 'اعرض هذا الموضوع في القائمة', hint: 'المس كوكبة أو نجمة.', bright: 'نجمة ساطعة — صحيح أو حسن', n: '{n} حديثًا' },
  tr: { ey: 'Galaksi', title: 'Hadis galaksisi', lead: '{n} hadis — her biri bir yıldız, konular takımyıldız. Bir takımyıldıza dokunun: liste o konuya süzülür; bir yıldıza dokunun: hadis açılır.', show: 'Bu konuyu listede göster', hint: 'Bir takımyıldıza veya yıldıza dokunun.', bright: 'Parlak yıldız — sahih veya hasen', n: '{n} hadis' },
}
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '')
const HUES = [42, 160, 210, 270, 15, 330, 95, 190, 50, 240, 300, 120, 25, 180, 355]

export default function HadithGalaxy({ list, cats, catsEn, lang = 'az', sourceOf, onPickCat }) {
  const t = pickUi(T, lang)
  const cvRef = useRef(null)
  const wrapRef = useRef(null)
  const [sel, setSel] = useState(null)        // { kind: 'cat'|'star', i }
  const par = useRef({ x: 0, y: 0 })
  const [tick, setTick] = useState(0)

  const g = useMemo(() => {
    const groups = catsEn.slice(1).map((c, k) => ({ k: k + 1, en: c.toLowerCase(), items: [] }))
    for (const h of list) {
      const gi = groups.findIndex(x => x.en === String(h.cat || '').toLowerCase())
      if (gi >= 0) groups[gi].items.push(h)
    }
    const used = groups.filter(x => x.items.length)
    // Bürclər 5×3 "üzvi" şəbəkədə (cüt sətirlər sürüşük); ölçüsü — hədis sayına görə, öz xanasına sığır.
    // Koordinatlar: x — enin, y — hündürlüyün payı (−0.5…0.5); r — xana ölçüsünə nisbət.
    const stars = [], COLS = 5, ROWS = Math.ceil(used.length / COLS)
    const maxN = Math.max(...used.map(x => x.items.length))
    used.forEach((gr, j) => {
      const c = j % COLS, rw = Math.floor(j / COLS)
      gr.cx = (c + 0.5 + (rw % 2 ? 0.18 : -0.18)) / COLS - 0.5
      gr.cy = (rw + 0.6) / ROWS - 0.5
      gr.hue = HUES[(gr.k - 1) % HUES.length]
      gr.r = 0.42 * Math.sqrt(gr.items.length / maxN)
      gr.items.forEach((h, i) => {
        const ang = i * 2.39996, rr = gr.r * Math.sqrt((i + 0.5) / gr.items.length)
        stars.push({ dx: Math.cos(ang) * rr, dy: Math.sin(ang) * rr, h, gi: j, ok: gradeGroup(h.g) === 'ok', z: ((i * 37) % 10) / 10 })
      })
    })
    return { groups: used, stars }
  }, [list, catsEn])

  useEffect(() => {
    const cv = cvRef.current, wrap = wrapRef.current
    if (!cv || !wrap) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = wrap.clientWidth, H = Math.max(420, Math.min(620, Math.round(W * 0.58)))
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = `${H}px` }
    const ctx = cv.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    const cell = Math.min(W / 5, H / Math.max(1, Math.ceil(g.groups.length / 5)))
    const X = (x, z = 0.5) => W / 2 + x * W + par.current.x * (z - 0.5) * 14
    const Y = (y, z = 0.5) => H / 2 + y * H + par.current.y * (z - 0.5) * 14
    const SX = (s) => X(g.groups[s.gi].cx, s.z) + s.dx * cell, SY = (s) => Y(g.groups[s.gi].cy, s.z) + s.dy * cell
    const selGi = sel?.kind === 'cat' ? sel.i : sel?.kind === 'star' ? g.stars[sel.i].gi : -1
    // fon tozu
    for (let i = 0; i < 160; i++) { ctx.globalAlpha = 0.25 + ((i * 7) % 10) / 20; ctx.fillStyle = '#fff'; ctx.fillRect(((i * 97.31) % 1) * W, ((i * 61.7) % 1) * H, 1, 1) }
    // bürc halələri
    g.groups.forEach((gr, j) => {
      const gx = X(gr.cx), gy = Y(gr.cy), rr = gr.r * cell * 1.5 + 14
      const grd = ctx.createRadialGradient(gx, gy, 0, gx, gy, rr)
      grd.addColorStop(0, `hsla(${gr.hue},80%,65%,${selGi === j ? 0.32 : 0.14})`); grd.addColorStop(1, 'hsla(0,0%,0%,0)')
      ctx.globalAlpha = 1; ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(gx, gy, rr, 0, Math.PI * 2); ctx.fill()
    })
    // ulduzlar
    g.stars.forEach((s, i) => {
      const dim = selGi >= 0 && s.gi !== selGi
      const on = sel?.kind === 'star' && sel.i === i
      ctx.globalAlpha = dim ? 0.18 : s.ok ? 0.95 : 0.5
      ctx.fillStyle = on ? '#ffffff' : `hsl(${g.groups[s.gi].hue},90%,${s.ok ? 80 : 62}%)`
      const r = on ? 4.5 : s.ok ? 1.8 : 1.2
      ctx.beginPath(); ctx.arc(SX(s), SY(s), r, 0, Math.PI * 2); ctx.fill()
    })
    // adlar
    ctx.globalAlpha = 1; ctx.textAlign = 'center'
    g.groups.forEach((gr, j) => {
      ctx.font = `${selGi === j ? 800 : 700} ${selGi === j ? 15 : 13}px system-ui, sans-serif`
      const gx = X(gr.cx), gy = Y(gr.cy) - gr.r * cell - 12
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(6,10,26,.85)'
      const label = `${cats[gr.k]} · ${gr.items.length}`
      ctx.strokeText(label, gx, gy); ctx.fillStyle = selGi === j ? '#ffd979' : `hsl(${gr.hue},70%,82%)`; ctx.fillText(label, gx, gy)
    })
  }, [g, sel, tick, cats])

  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return undefined
    let raf = 0
    const toLocal = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r.width, r.height] }
    const pick = (e) => {
      const [mx, my, W, H] = toLocal(e)
      const cell = Math.min(W / 5, H / Math.max(1, Math.ceil(g.groups.length / 5)))
      let best = -1, bd = 12 * 12
      g.stars.forEach((s, i) => { const gr = g.groups[s.gi], dx = W / 2 + gr.cx * W + s.dx * cell - mx, dy = H / 2 + gr.cy * H + s.dy * cell - my, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i } })
      if (best >= 0) return { kind: 'star', i: best }
      let gb = -1, gd = Infinity
      g.groups.forEach((gr, j) => { const dx = W / 2 + gr.cx * W - mx, dy = H / 2 + gr.cy * H - my, d = Math.hypot(dx, dy); if (d < gr.r * cell * 1.5 + 30 && d < gd) { gd = d; gb = j } })
      return gb >= 0 ? { kind: 'cat', i: gb } : null
    }
    const click = (e) => { const p = pick(e); setSel(p) }
    const move = (e) => {
      if (e.pointerType !== 'mouse') return
      const [mx, my, W, H] = toLocal(e)
      par.current = { x: (mx / W - 0.5) * 2, y: (my / H - 0.5) * 2 }
      cv.style.cursor = pick(e) ? 'pointer' : 'default'
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; setTick(x => x + 1) })
    }
    cv.addEventListener('click', click); cv.addEventListener('pointermove', move)
    const ro = new ResizeObserver(() => setTick(x => x + 1)); ro.observe(cv.parentElement)
    return () => { cv.removeEventListener('click', click); cv.removeEventListener('pointermove', move); ro.disconnect(); cancelAnimationFrame(raf) }
  }, [g])

  const star = sel?.kind === 'star' ? g.stars[sel.i] : null
  const grp = sel ? g.groups[sel.kind === 'cat' ? sel.i : g.stars[sel.i].gi] : null
  return (
    <section className="ui-section ui-section--tight hgx" aria-labelledby="hgx-title" data-testid="hadith-galaxy">
      <div className="ui-container">
        <div className="ui-section-head">
          <span className="ui-eyebrow">{t.ey}</span>
          <h2 id="hgx-title" className="ui-title">{t.title}</h2>
          <p className="ui-lead">{fill(t.lead, { n: list.length })}</p>
        </div>
        <div className="hgx__frame">
          <div className="hgx__stage" ref={wrapRef}>
            <canvas ref={cvRef} className="hgx__cv" role="img" aria-label={`${t.title}: ${fill(t.lead, { n: list.length })}`} data-testid="hgx-canvas" />
          </div>
          <div className="hgx__chips" role="group" aria-label={t.title}>
            {g.groups.map((gr, j) => (
              <button key={gr.k} type="button" className={sel?.kind === 'cat' && sel.i === j ? 'is-on' : ''} style={{ '--h': gr.hue }} onClick={() => setSel({ kind: 'cat', i: j })}>
                {cats[gr.k]} <b className="ui-num">{gr.items.length}</b>
              </button>
            ))}
          </div>
          <div className="hgx__info" aria-live="polite" data-testid="hgx-info">
            {star ? (
              <div className="hgx__hadith">
                {star.h.ar && <p className="hgx__ar ui-arabic" lang="ar" dir="rtl">{star.h.ar}</p>}
                {star.h.text && <p className="hgx__tr">{star.h.text}</p>}
                <p className="hgx__src">{sourceOf(star.h.source)} · {cats[grp.k]}</p>
                <button type="button" className="ui-btn ui-btn--inverse ui-btn--sm" onClick={() => onPickCat(grp.k)}>{t.show}</button>
              </div>
            ) : grp ? (
              <div className="hgx__grp">
                <b>{cats[grp.k]}</b> <span className="ui-num">{fill(t.n, { n: grp.items.length })}</span>
                <button type="button" className="ui-btn ui-btn--inverse ui-btn--sm" onClick={() => onPickCat(grp.k)} data-testid="hgx-show">{t.show}</button>
              </div>
            ) : <span>{t.hint} <small>· {t.bright}</small></span>}
          </div>
        </div>
      </div>
    </section>
  )
}
