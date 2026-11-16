// ═══════════════════════════════════════════════════════
// IbnBattutaJourney — "İbn Bəttutənin səyahəti (1325–1354)" fırlanan qlobusda (/history)
//
//   <IbnBattutaJourney />            — dil LangContext-dən
//   <IbnBattutaJourney lang="en" />  — dil açıq verilə bilər
//
// • Məlumat: data/ibnBattuta.js — 52 əsas dayanacaq (Rihla; Dunn, Gibb), mübahisəlilər çıxarılıb.
// • d3-geo ortoqrafik proyeksiya, canvas 2D (QiblaGlobe kimi): quru, paralel/meridianlar,
//   yol — böyük dairə qövsləri ilə, "səyyah" cari dayanacağa doğru irəliləyir; qlobus
//   cari nöqtəni yumşaq şəkildə mərkəzə gətirir. Barmaq/siçanla fırlatmaq olar.
// • İdarə: oynat/dayandır, əvvəlki/növbəti, il sürgüsü (1325–1354); kart — il, yer, qeyd;
//   "indiyədək N km" — dayanacaqlar arası düz xətt (böyük dairə) məsafələrinin cəmi.
// • Hərəkəti azalt: avtomatik başlama və animasiya yoxdur, dayanacaqlar dərhal dəyişir.
//   Ekrandan kənarda (IntersectionObserver) və vərəq gizlinəndə çəkiliş dayanır.
// Stillər: src/styles/IbnBattutaJourney.css
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import { geoOrthographic, geoPath, geoGraticule10, geoInterpolate, geoDistance } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { useLang } from '../contexts/LangContext'
import { useReduced } from '../motion/reduced'
import { IBN_BATTUTA_STOPS as STOPS, IBN_BATTUTA_CUM_KM as CUM } from '../data/ibnBattuta'
import '../styles/IbnBattutaJourney.css'

const T = {
  az: { ey: 'Səyyahlar', title: 'İbn Bəttutənin səyahəti (1325–1354)', lead: 'Təncədən həccə yola düşən gənc qazi 29 il ərzində Əndəlüsdən Çinə, Qızıl Ordadan Maliyə qədər İslam dünyasını gəzdi. Qlobusda onun əsas dayanacaqlarını izləyin.',
    play: 'Oynat', pause: 'Dayandır', prev: 'Əvvəlki dayanacaq', next: 'Növbəti dayanacaq', year: 'İl', c: 'təq.', stop: 'Dayanacaq',
    km: 'km indiyədək', kmNote: 'dayanacaqlar arası düz xətt (böyük dairə) üzrə təqribi hesab', total: 'Bütün yol, R. Dunn-a görə, təqribən 117 000 km-dir.',
    globe: 'İbn Bəttutənin yolu qlobusda', drag: 'Qlobusu barmaqla fırladın',
    src: 'Mənbə: İbn Bəttutə, «Tuhfat ən-Nuzzar» (Rihla); R. E. Dunn, The Adventures of Ibn Battuta. Mübahisəli dayanacaqlar (Pekin, Bulqar) göstərilmir.' }, // lang-ok[Dunn,The,Adventures,of,Ibn,Battuta,Dunn-a]: kitabın və müəllifin adı
  en: { ey: 'Travellers', title: 'The journey of Ibn Battuta (1325–1354)', lead: 'Setting out from Tangier for the hajj, the young qāḍī spent 29 years crossing the Muslim world — from al-Andalus to China, from the Golden Horde to Mali. Follow his main stops on the globe.',
    play: 'Play', pause: 'Pause', prev: 'Previous stop', next: 'Next stop', year: 'Year', c: 'c.', stop: 'Stop',
    km: 'km so far', kmNote: 'straight-line (great-circle) approximation between stops', total: 'The whole journey is commonly estimated at about 117,000 km (R. Dunn).',
    globe: 'Ibn Battuta’s route on a globe', drag: 'Drag the globe to rotate it',
    src: 'Source: Ibn Battuta, Tuḥfat al-Nuẓẓār (the Riḥla); R. E. Dunn, The Adventures of Ibn Battuta. Disputed stops (Beijing, Bulghar) are not shown.' },
  ru: { ey: 'Путешественники', title: 'Путешествие Ибн Баттуты (1325–1354)', lead: 'Отправившись из Танжера в хадж, молодой кади 29 лет странствовал по мусульманскому миру — от аль-Андалуса до Китая, от Золотой Орды до Мали. Следите за его главными остановками на глобусе.',
    play: 'Пуск', pause: 'Пауза', prev: 'Предыдущая остановка', next: 'Следующая остановка', year: 'Год', c: 'ок.', stop: 'Остановка',
    km: 'км пройдено', kmNote: 'приблизительно: по прямой (по дуге большого круга) между остановками', total: 'Весь путь, по оценке Р. Данна, составил около 117 000 км.',
    globe: 'Маршрут Ибн Баттуты на глобусе', drag: 'Вращайте глобус пальцем',
    src: 'Источник: Ибн Баттута, «Тухфат ан-нуззар» («Рихла»); Р. Э. Данн, «Приключения Ибн Баттуты». Спорные остановки (Пекин, Булгар) не показаны.' },
  ar: { ey: 'الرحّالة', title: 'رحلة ابن بطوطة (1325–1354)', lead: 'خرج من طنجة حاجًّا، فجاب القاضي الشاب العالم الإسلامي تسعًا وعشرين سنة — من الأندلس إلى الصين، ومن القبيلة الذهبية إلى مالي. تتبّع أهم محطاته على الكرة الأرضية.',
    play: 'تشغيل', pause: 'إيقاف', prev: 'المحطة السابقة', next: 'المحطة التالية', year: 'السنة', c: 'نحو', stop: 'المحطة',
    km: 'كم حتى الآن', kmNote: 'تقدير بخط مستقيم (قوس دائرة عظمى) بين المحطات', total: 'يُقدَّر طول الرحلة كلها بنحو 117000 كم (روس دن).',
    globe: 'طريق ابن بطوطة على الكرة الأرضية', drag: 'اسحب الكرة لتدويرها',
    src: 'المصدر: ابن بطوطة، «تحفة النظار في غرائب الأمصار وعجائب الأسفار» (الرحلة)؛ روس دن، «مغامرات ابن بطوطة». المحطات المختلف فيها (خان بالق، بلغار) غير معروضة.' },
  tr: { ey: 'Seyyahlar', title: 'İbn Battûta’nın seyahati (1325–1354)', lead: 'Tanca’dan hacca yola çıkan genç kadı 29 yıl boyunca Endülüs’ten Çin’e, Altın Orda’dan Mali’ye kadar İslam dünyasını dolaştı. Küre üzerinde başlıca duraklarını izleyin.',
    play: 'Oynat', pause: 'Durdur', prev: 'Önceki durak', next: 'Sonraki durak', year: 'Yıl', c: 'y.', stop: 'Durak',
    km: 'km şimdiye dek', kmNote: 'duraklar arası düz çizgi (büyük daire) üzerinden yaklaşık hesap', total: 'Yolculuğun tamamı, R. Dunn’a göre yaklaşık 117.000 km’dir.',
    globe: 'İbn Battûta’nın yolu küre üzerinde', drag: 'Küreyi parmağınızla döndürün',
    src: 'Kaynak: İbn Battûta, Tuhfetü’n-Nuzzâr (Rihle); R. E. Dunn, The Adventures of Ibn Battuta. Tartışmalı duraklar (Pekin, Bulgar) gösterilmez.' }, // lang-ok[The,of]: kitabın İngilizcə adı
}

const N = STOPS.length
const Y0 = 1325, Y1 = 1354
const SEG_MS = 1500     // bir hissəni keçmə vaxtı
const DWELL_MS = 1400   // dayanacaqda gözləmə
const REDUCED_STEP_MS = 3000

let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then(r => r.json()).then(topo => feature(topo, topo.objects.land)))

const COORDS = STOPS.map(s => [s.lon, s.lat])
const INTERPS = COORDS.slice(1).map((b, i) => geoInterpolate(COORDS[i], b))
// Təkrar olmayan yerlər — nöqtə bir dəfə çəkilsin; ilk gəliş indeksi ilə
const PLACES = STOPS.reduce((acc, s) => { if (!acc.some(p => p.place === s.place)) acc.push({ place: s.place, at: [s.lon, s.lat], first: s.i }); return acc }, [])

const travelerAt = (pos) => {
  const k = Math.min(N - 2, Math.floor(pos))
  return pos >= N - 1 ? COORDS[N - 1] : INTERPS[k](pos - k)
}
// Minlik ayırıcısı (QiblaGlobe kimi): Chrome-da az məlumatı yoxdur — dillərə görə özümüz
const sepFor = (lang) => (lang === 'tr' ? '.' : lang === 'en' ? ',' : lang === 'ar' ? '٬' : ' ')
const wrap180 = (x) => ((((x + 180) % 360) + 360) % 360) - 180
const idxForYear = (y) => { let k = 0; STOPS.forEach((s, i) => { if (s.year <= y) k = i }); return k }

export default function IbnBattutaJourney({ lang: langProp }) {
  const ctx = useLang()
  const lang = langProp || ctx?.lang || 'az'
  const t = pickUi(T, lang)
  const reduced = useReduced()
  const rootRef = useRef(null)
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const [land, setLand] = useState(null)
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [active, setActive] = useState(false)       // ekranda və vərəq görünür
  const autoStarted = useRef(false)
  const s = useRef({ pos: 0, target: 0, rot: [-COORDS[0][0], -COORDS[0][1] * 0.8], drag: null, userMoved: false, arrivedAt: 0, raf: 0, last: 0 })
  const kickRef = useRef(() => {})
  const drawRef = useRef(() => {})
  const live = useRef({ playing, reduced, active })
  live.current = { playing, reduced, active }

  useEffect(() => { let ok = true; loadLand().then(l => { if (ok) setLand(l) }).catch(() => {}); return () => { ok = false } }, [])

  // ── Ekranda görünmə + vərəq gizliliyi ──
  useEffect(() => {
    const el = rootRef.current
    let onscreen = typeof IntersectionObserver !== 'function'
    let shown = typeof document === 'undefined' || document.visibilityState !== 'hidden'
    const upd = () => setActive(onscreen && shown)
    let io = null
    if (el && typeof IntersectionObserver === 'function') {
      io = new IntersectionObserver(([e]) => { onscreen = !!e?.isIntersecting; upd() }, { rootMargin: '60px' })
      io.observe(el)
    }
    const onVis = () => { shown = document.visibilityState !== 'hidden'; upd() }
    document.addEventListener('visibilitychange', onVis)
    upd()
    return () => { io?.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  // İlk dəfə görünəndə avtomatik başla (hərəkəti azaltda yox)
  useEffect(() => {
    if (active && land && !reduced && !autoStarted.current) { autoStarted.current = true; setPlaying(true) }
  }, [active, land, reduced])

  // ── Qlobus: çəkiliş, döngə, fırlatma ──
  useEffect(() => {
    const cv = canvasRef.current
    const wrap = wrapRef.current
    if (!cv || !wrap || !land) return undefined
    const st = s.current
    const proj = geoOrthographic().clipAngle(90).precision(0.5)
    const graticule = geoGraticule10()
    let size = 0, dpr = 1, colors = null

    const readColors = () => {
      const cs = getComputedStyle(wrap)
      const v = (n, f) => cs.getPropertyValue(n).trim() || f
      colors = { accent: v('--accent', '#c9a24a'), text: v('--text-strong', '#111'), muted: v('--text-muted', '#777'),
        ocean: v('--ibj-ocean', '#e4eef2'), ocean2: v('--ibj-ocean-2', '#b8cfd8'), land: v('--ibj-land', '#d9c9a3'), landEdge: v('--ibj-land-edge', '#b49a66'),
        grid: v('--ibj-grid', '#8aa0aa'), route: v('--ibj-route', '#b5462f'), halo: v('--ibj-halo', 'rgba(255,255,255,.85)') }
    }
    const resize = () => {
      const w = Math.max(200, Math.min(wrap.clientWidth, 500))
      dpr = Math.min(2, window.devicePixelRatio || 1)
      size = w
      cv.width = Math.round(w * dpr); cv.height = Math.round(w * dpr)
      cv.style.width = `${w}px`; cv.style.height = `${w}px`
      draw()
    }

    function draw() {
      if (!size || !colors) return
      const c = cv.getContext('2d')
      if (!c) return
      const r = size / 2 - 8
      proj.rotate(st.rot).scale(r).translate([size / 2, size / 2])
      const path = geoPath(proj, c)
      const center = [-st.rot[0], -st.rot[1]]
      const front = (p) => geoDistance(p, center) < Math.PI / 2 - 0.02
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.clearRect(0, 0, size, size)
      // Okean
      const oc = c.createRadialGradient(size / 2 - r * 0.35, size / 2 - r * 0.4, r * 0.1, size / 2, size / 2, r)
      oc.addColorStop(0, colors.ocean); oc.addColorStop(1, colors.ocean2)
      c.beginPath(); path({ type: 'Sphere' }); c.fillStyle = oc; c.fill()
      c.beginPath(); path(graticule); c.strokeStyle = colors.grid; c.globalAlpha = 0.3; c.lineWidth = 0.5; c.stroke(); c.globalAlpha = 1
      c.beginPath(); path(land); c.fillStyle = colors.land; c.fill(); c.strokeStyle = colors.landEdge; c.lineWidth = 0.6; c.stroke()
      // Bütün yol — solğun qırıq xətt
      c.setLineDash([3, 4]); c.beginPath(); path({ type: 'LineString', coordinates: COORDS })
      c.strokeStyle = colors.route; c.globalAlpha = 0.28; c.lineWidth = 1; c.stroke(); c.globalAlpha = 1; c.setLineDash([])
      // Keçilmiş yol
      const k = Math.floor(st.pos)
      const done = COORDS.slice(0, k + 1)
      if (st.pos > k) done.push(travelerAt(st.pos))
      if (done.length > 1) {
        c.beginPath(); path({ type: 'LineString', coordinates: done })
        c.lineCap = 'round'; c.lineJoin = 'round'
        c.strokeStyle = colors.route; c.globalAlpha = 0.22; c.lineWidth = 5; c.stroke()
        c.globalAlpha = 1; c.lineWidth = 2; c.stroke()
      }
      // Şəhərlər
      for (const p of PLACES) {
        if (!front(p.at)) continue
        const [x, y] = proj(p.at)
        const seen = p.first <= st.target
        c.beginPath(); c.arc(x, y, seen ? 3.2 : 2.4, 0, Math.PI * 2)
        c.fillStyle = seen ? colors.route : colors.muted; c.globalAlpha = seen ? 1 : 0.55; c.fill(); c.globalAlpha = 1
      }
      // Cari dayanacaq + səyyah
      const cur = COORDS[st.target]
      if (front(cur)) {
        const [x, y] = proj(cur)
        c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.strokeStyle = colors.accent; c.lineWidth = 2; c.stroke()
        c.beginPath(); c.arc(x, y, 4.5, 0, Math.PI * 2); c.fillStyle = colors.accent; c.fill()
        const label = pickUi(STOPS[st.target].name, lang)
        c.font = '600 12px Inter, system-ui, sans-serif'; c.textBaseline = 'middle'
        const tw = c.measureText(label).width
        const left = x + 14 + tw > size - 4
        c.textAlign = left ? 'right' : 'left'
        const tx = left ? x - 14 : x + 14
        c.lineWidth = 3.5; c.strokeStyle = colors.halo; c.strokeText(label, tx, y)
        c.fillStyle = colors.text; c.fillText(label, tx, y)
      }
      if (st.pos !== st.target) {
        const tp = travelerAt(st.pos)
        if (front(tp)) {
          const [x, y] = proj(tp)
          c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fillStyle = colors.accent; c.fill()
          c.strokeStyle = colors.halo; c.lineWidth = 1.5; c.stroke()
        }
      }
    }
    drawRef.current = draw

    const aimRot = () => { const p = travelerAt(st.pos); return [-p[0], Math.max(-60, Math.min(60, -p[1] * 0.8))] }

    // Döngə: yalnız nəsə dəyişəndə işləyir, sonra özü dayanır
    const loop = (now) => {
      st.raf = 0
      const L = live.current
      if (!L.active || L.reduced) return
      const dt = Math.min(64, now - (st.last || now)); st.last = now
      let busy = false
      if (st.pos < st.target) {
        st.pos = Math.min(st.target, st.pos + dt / SEG_MS)
        busy = true
        if (st.pos === st.target) st.arrivedAt = now
      }
      if (!st.drag && !st.userMoved) {
        const aim = aimRot()
        const d0 = wrap180(aim[0] - st.rot[0]), d1 = aim[1] - st.rot[1]
        if (Math.abs(d0) > 0.05 || Math.abs(d1) > 0.05) {
          const kk = 1 - Math.exp(-dt / 260)
          st.rot = [st.rot[0] + d0 * kk, st.rot[1] + d1 * kk]
          busy = true
        }
      }
      if (L.playing && st.pos === st.target) {
        if (st.target >= N - 1) setPlaying(false)
        else if (now - st.arrivedAt >= DWELL_MS) { st.arrivedAt = now + 1e9; setIdx(i => Math.min(N - 1, i + 1)) }
        busy = true
      }
      draw()
      if (busy || st.drag) st.raf = requestAnimationFrame(loop)
      else st.last = 0
    }
    const kick = () => {
      if (live.current.reduced) { st.pos = st.target; if (!st.userMoved) st.rot = aimRot(); draw(); return }
      if (!st.raf && live.current.active) { st.last = 0; st.raf = requestAnimationFrame(loop) }
    }
    kickRef.current = kick

    readColors()
    resize()
    kick()
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null
    ro?.observe(wrap)
    const mo = new MutationObserver(() => { readColors(); draw() })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })

    // Fırlatma (barmaq / siçan)
    const down = (e) => { st.drag = { x: e.clientX, y: e.clientY, rot: [...st.rot] }; st.userMoved = true; cv.setPointerCapture?.(e.pointerId) }
    const move = (e) => {
      if (!st.drag) return
      const kk = 180 / size
      st.rot = [st.drag.rot[0] + (e.clientX - st.drag.x) * kk, Math.max(-80, Math.min(80, st.drag.rot[1] - (e.clientY - st.drag.y) * kk))]
      if (live.current.reduced || !st.raf) draw()
    }
    const up = () => { st.drag = null }
    const key = (e) => {
      const d = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] }[e.key]
      if (!d) return
      e.preventDefault(); st.userMoved = true
      st.rot = [st.rot[0] + d[0], Math.max(-80, Math.min(80, st.rot[1] + d[1]))]
      draw()
    }
    cv.addEventListener('pointerdown', down)
    cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerup', up)
    cv.addEventListener('pointercancel', up)
    cv.addEventListener('keydown', key)
    return () => {
      cancelAnimationFrame(st.raf); st.raf = 0
      ro?.disconnect(); mo.disconnect()
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move)
      cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); cv.removeEventListener('keydown', key)
      kickRef.current = () => {}; drawRef.current = () => {}
    }
  }, [land, lang])

  // Dayanacaq dəyişəndə: irəli bir addım — animasiya, qalan hallar — dərhal
  useEffect(() => {
    const st = s.current
    const prev = st.target
    st.target = idx
    st.userMoved = false
    st.pos = reduced || idx !== prev + 1 ? idx : prev
    st.arrivedAt = performance.now()
    kickRef.current()
  }, [idx, reduced])

  useEffect(() => { kickRef.current() }, [active, playing])

  // Hərəkəti azaltda "oynat" — animasiyasız, bir neçə saniyədən bir növbəti dayanacaq
  useEffect(() => {
    if (!reduced || !playing || !active) return undefined
    const iv = setInterval(() => {
      setIdx(i => { if (i >= N - 1) { setPlaying(false); return i } return i + 1 })
    }, REDUCED_STEP_MS)
    return () => clearInterval(iv)
  }, [reduced, playing, active])

  const go = useCallback((i) => { setPlaying(false); setIdx(Math.max(0, Math.min(N - 1, i))) }, [])
  const togglePlay = () => {
    if (playing) { setPlaying(false); return }
    if (idx >= N - 1) { s.current.pos = 0; s.current.target = 0; setIdx(0) }
    setPlaying(true)
  }

  const cur = STOPS[idx]
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sepFor(lang))
  const km = Math.round(CUM[idx] / 10) * 10
  const yearTxt = (st) => `${st.approx ? `${t.c} ` : ''}${st.year}`
  const rtl = lang === 'ar'

  return (
    <section ref={rootRef} className="ui-card ibj" data-testid="ibn-battuta" data-stop={idx} aria-labelledby="ibj-title">
      <div className="ibj__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 id="ibj-title" className="ui-title ui-title--sm">{t.title}</h2>
        <p className="ui-lead">{t.lead}</p>
      </div>
      <div className="ibj__grid">
        <figure className="ibj__stage" ref={wrapRef}>
          <canvas ref={canvasRef} className="ibj__globe" tabIndex={0} role="img" aria-label={`${t.globe}: ${pickUi(cur.name, lang)}, ${yearTxt(cur)}`} />
          {!land && <div className="ibj__ph" aria-hidden="true" />}
          <figcaption className="ibj__hint">{t.drag}</figcaption>
        </figure>
        <div className="ibj__panel">
          <article className="ibj__card" aria-live="polite" data-testid="ibj-card">
            <div className="ibj__meta">
              <span className="ibj__year ui-num">{yearTxt(cur)}</span>
              <span className="ibj__count ui-num">{t.stop} {fmt(idx + 1)} / {fmt(N)}</span>
            </div>
            <h3 className="ibj__place">{pickUi(cur.name, lang)}</h3>
            {lang !== 'ar' && <p className="ibj__arname ui-arabic" lang="ar" dir="rtl">{cur.name.ar}</p>}
            <p className="ibj__note">{pickUi(cur.note, lang)}</p>
          </article>
          <div className="ibj__ctrls">
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm ibj__ib" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label={t.prev} title={t.prev} data-testid="ibj-prev">
              <Icon name={rtl ? 'chevron' : 'chevronLeft'} size={18} />
            </button>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm ibj__play" onClick={togglePlay} aria-pressed={playing} data-testid="ibj-play">
              <Icon name={playing ? 'pause' : 'play'} size={16} /> {playing ? t.pause : t.play}
            </button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm ibj__ib" onClick={() => go(idx + 1)} disabled={idx === N - 1} aria-label={t.next} title={t.next} data-testid="ibj-next">
              <Icon name={rtl ? 'chevronLeft' : 'chevron'} size={18} />
            </button>
          </div>
          <label className="ibj__range">
            <span>{t.year}: <b className="ui-num">{cur.year}</b></span>
            <input type="range" min={Y0} max={Y1} step="1" value={cur.year} onChange={e => go(idxForYear(+e.target.value))} aria-label={t.year} aria-valuetext={yearTxt(cur)} data-testid="ibj-year" />
            <span className="ibj__ends ui-num" aria-hidden="true"><span>{Y0}</span><span>{Y1}</span></span>
          </label>
          <div className="ibj__km">
            <p><b className="ui-num" data-testid="ibj-km">≈ {fmt(km)}</b> {t.km}</p>
            <p className="ibj__small">{t.kmNote}. {t.total}</p>
          </div>
        </div>
      </div>
      <p className="ibj__src">{t.src}</p>
    </section>
  )
}
