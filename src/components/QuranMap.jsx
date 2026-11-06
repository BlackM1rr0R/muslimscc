// ═══════════════════════════════════════════════════════
// QuranMap — Quranın bütöv xəritəsi: 6236 ayə bir şəbəkədə (/hifz)
//
//   <QuranMap progress={{ 112: 2 }} srsItems={srs.items} lang="az" surahName={(s) => '…'} surahHref={(s) => '/quran/…'} />
//
// • Oxu sırası ilə (Fatihədən Nasa), hər xana bir ayə. Fon: Məkki / Mədəni
//   surələr iki solğun tonda, qonşu surələr bir az fərqli (sərhəd görünsün).
// • Əzbərlənən ayələr qızılı, "öyrənirəm" surələri yaşıl — xətm irəlilədikcə
//   bütün xəritə nura bürünür.
// • Canvas (6236 DOM elementi yox). Göstərici / toxunuş → ayə və surə adı;
//   "Surəni aç" keçidi. Əlçatanlıq: canvas role="img" + mətn xülasəsi.
// • Açılış bir dəfəlik: xanalar yuxarıdan aşağı "dolur" (~0.9 s; hərəkət
//   azaldılıbsa dərhal). Stillər: src/styles/QuranMap.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { TOTAL, MADANI, SURAH_START, refAt, mapStates, countStates } from '../utils/quranMap'
import '../styles/QuranMap.css'
import { pickUi } from '../utils/uiText'

const T = {
  az: { title: 'Quranın xəritəsi', lead: 'Hər xana bir ayədir — Fatihədən Nas surəsinə qədər. Əzbərlədikcə xəritə nura bürünür.', mem: 'əzbər', learn: 'öyrənilir', mk: 'Məkki', md: 'Mədəni', open: 'Surəni aç', hint: 'Xanaya toxunun', sum: (m, l) => `6236 ayədən ${m} əzbər, ${l} öyrənilir` },
  en: { title: 'Map of the Quran', lead: 'Each cell is one verse — from al-Fatiha to an-Nas. The map fills with light as you memorise.', mem: 'memorised', learn: 'learning', mk: 'Meccan', md: 'Medinan', open: 'Open the surah', hint: 'Tap a cell', sum: (m, l) => `${m} of 6236 verses memorised, ${l} in progress` },
  ru: { title: 'Карта Корана', lead: 'Каждая клетка — один аят, от аль-Фатихи до ан-Нас. По мере заучивания карта наполняется светом.', mem: 'выучено', learn: 'учится', mk: 'Мекканская', md: 'Мединская', open: 'Открыть суру', hint: 'Коснитесь клетки', sum: (m, l) => `выучено ${m} из 6236 аятов, в процессе ${l}` },
  tr: { title: 'Kur’an haritası', lead: 'Her kare bir ayettir — Fatiha’dan Nas’a kadar. Ezberledikçe harita nurla dolar.', mem: 'ezber', learn: 'öğreniliyor', mk: 'Mekki', md: 'Medeni', open: 'Sureyi aç', hint: 'Bir kareye dokunun', sum: (m, l) => `6236 ayetten ${m} ezber, ${l} öğreniliyor` },
  ar: { title: 'خريطة القرآن', lead: 'كل خانة آية، من الفاتحة إلى الناس. وكلما حفظت امتلأت الخريطة نورًا.', mem: 'محفوظ', learn: 'قيد الحفظ', mk: 'مكية', md: 'مدنية', open: 'افتح السورة', hint: 'المس خانة', sum: (m, l) => `حُفظ ${m} من 6236 آية، و${l} قيد الحفظ` },
}

const css = (el, name, fb) => (getComputedStyle(el).getPropertyValue(name).trim() || fb)
const reduced = () => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion'))

export default function QuranMap({ progress, srsItems, lang = 'az', surahName = (s) => String(s), surahHref }) {
  const t = pickUi(T, lang)
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const geo = useRef({ cols: 96, cell: 4, gap: 1 })
  const [hover, setHover] = useState(null) // { s, a }
  const states = useMemo(() => mapStates(progress, srsItems), [progress, srsItems])
  const [, learn, mem] = useMemo(() => countStates(states), [states])
  const animated = useRef(false)

  useEffect(() => {
    const wrap = wrapRef.current, cv = canvasRef.current
    if (!wrap || !cv) return undefined
    let raf = 0, alive = true
    const draw = (upto = TOTAL) => {
      const { cols, cell, gap } = geo.current
      const ctx = cv.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cv.width, cv.height)
      const c = {
        mk: [css(wrap, '--qmap-mk-1', '#e9e1cf'), css(wrap, '--qmap-mk-2', '#ddd3bd')],
        md: [css(wrap, '--qmap-md-1', '#cfe3dc'), css(wrap, '--qmap-md-2', '#bcd7ce')],
        mem: css(wrap, '--qmap-mem', '#d9a92e'), learn: css(wrap, '--qmap-learn', '#2e9a73'),
      }
      let s = 0
      for (let i = 0; i < upto; i++) {
        while (s < 113 && SURAH_START[s + 1] <= i) s++
        const v = states[i]
        ctx.fillStyle = v === 2 ? c.mem : v === 1 ? c.learn : (MADANI[s] ? c.md : c.mk)[s % 2]
        const x = (i % cols) * (cell + gap), y = Math.floor(i / cols) * (cell + gap)
        ctx.fillRect(x, y, cell, cell)
      }
    }
    const layout = () => {
      const w = wrap.clientWidth
      const cols = w < 520 ? 64 : w < 900 ? 96 : 128
      const gap = 1
      const cell = Math.max(2, (w - gap * (cols - 1)) / cols)
      geo.current = { cols, cell, gap }
      const rows = Math.ceil(TOTAL / cols)
      const h = rows * (cell + gap) - gap
      const dpr = window.devicePixelRatio || 1
      cv.style.width = `${w}px`; cv.style.height = `${h}px`
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
    }
    layout()
    // Dolma animasiyası xəritə EKRANA GƏLƏNDƏ başlayır (əvvəl yüklənəndə oynayırdı — aşağıda
    // olanda görünmürdü); ölçü dəyişəndə də hazırkı irəliləyiş saxlanılır
    let upto = animated.current || reduced() ? TOTAL : 0
    let io = null
    const play = () => {
      animated.current = true
      const t0 = performance.now()
      const step = (now) => {
        if (!alive) return
        const k = Math.min(1, (now - t0) / 1100)
        upto = Math.floor(TOTAL * (1 - (1 - k) ** 3))
        draw(upto)
        if (k < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }
    draw(upto)
    if (upto < TOTAL) {
      if (typeof IntersectionObserver === 'undefined') play()
      else {
        io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); play() } }, { threshold: 0.25 })
        io.observe(wrap)
      }
    }
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { layout(); draw(upto) }) : null
    ro?.observe(wrap)
    return () => { alive = false; cancelAnimationFrame(raf); ro?.disconnect(); io?.disconnect() }
  }, [states])

  const pick = (e) => {
    const cv = canvasRef.current
    if (!cv) return
    const r = cv.getBoundingClientRect()
    const { cols, cell, gap } = geo.current
    const col = Math.floor((e.clientX - r.left) / (cell + gap)), row = Math.floor((e.clientY - r.top) / (cell + gap))
    if (col < 0 || col >= cols) return
    const ref = refAt(row * cols + col)
    if (ref) setHover(ref)
  }

  return (
    <section className="ui-card qmap" data-testid="quran-map" aria-labelledby="qmap-title">
      <div className="qmap__head">
        <h2 id="qmap-title" className="ui-title ui-title--sm">{t.title}</h2>
        <p className="qmap__lead">{t.lead}</p>
      </div>
      <div className="qmap__wrap" ref={wrapRef}>
        <canvas ref={canvasRef} className="qmap__cv" role="img" aria-label={t.sum(mem, learn)}
          onPointerMove={pick} onPointerDown={pick} />
      </div>
      <div className="qmap__foot">
        <ul className="qmap__legend">
          <li><i className="qmap__sw qmap__sw--mem" /> {t.mem} <b className="ui-num" data-count={mem}>{mem}</b></li>
          <li><i className="qmap__sw qmap__sw--learn" /> {t.learn} <b className="ui-num" data-count={learn}>{learn}</b></li>
          <li><i className="qmap__sw qmap__sw--mk" /> {t.mk}</li>
          <li><i className="qmap__sw qmap__sw--md" /> {t.md}</li>
        </ul>
        <p className="qmap__info" aria-live="polite">
          {hover
            ? <><b>{surahName(hover.s)}</b> <span className="ui-num" dir="ltr">{hover.s}:{hover.a}</span>
                {surahHref && <> · <a href={surahHref(hover.s, hover.a)}>{t.open}</a></>}</>
            : t.hint}
        </p>
      </div>
    </section>
  )
}
