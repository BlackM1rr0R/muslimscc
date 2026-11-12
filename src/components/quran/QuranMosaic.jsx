// ═══════════════════════════════════════════════════════
// QuranMosaic (v6.4) — "Quranın mozaikası": 6236 ayə bir şəkildə, 4 görünüş (/quran)
//
//   <QuranMosaic lang="az" surahName={n => '…'} onOpen={(s, a) => …} />
//
// • Görünüşlər: Məkki/Mədəni · ayənin uzunluğu (söz sayı, data/ayahWords.js — Tanzil mətni) ·
//   15 səcdə ayəsi (utils/quranMosaic → SAJDAH) · 30 cüz. Hesab — utils/quranMosaic.js.
// • Canvas (6236 DOM elementi yox). Göstərici → ayə; toxunuş/klik → seçilir, "Ayəni aç".
//   Klaviatura: kətan fokusdadırsa ← → ↑ ↓ ilə ayədən ayəyə, Enter — açılır.
// • /hifz-dəki QuranMap əzbər irəliləyişi üçündür; bu — Quranın quruluşu üçün.
// • Açılış bir dəfəlik "dolma" (hərəkət azaldılıbsa — dərhal). Stillər: src/styles/QuranMosaic.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { TOTAL, refAt, indexOf, SAJDAH, SAJDAH_IDX, JUZ_OF, wordsAt, isMadani, lengthT, longestAyahs, TOTAL_WORDS } from '../../utils/quranMosaic'
import '../../styles/QuranMosaic.css'

const T = {
  az: {
    ey: 'Quranın mozaikası', title: '6236 ayə — bir şəkildə', lead: 'Hər nöqtə bir ayədir, Fatihədən Nas surəsinə qədər oxu sırası ilə. Görünüşü dəyişin — Quranın quruluşu başqa tərəfdən açılır.',
    modes: { type: 'Məkki / Mədəni', length: 'Ayənin uzunluğu', sajdah: 'Səcdə ayələri', juz: '30 cüz' },
    mk: 'Məkki', md: 'Mədəni', short: 'qısa', long: 'uzun', words: 'söz', juz: 'cüz', open: 'Ayəni aç', hint: 'Nöqtəyə toxunun və ya üstünə gəlin',
    longest: 'Ən uzun ayələr', sajList: 'Quranda 15 səcdə ayəsi', sajNote: 'Səcdə ayələrinin siyahısı — Tanzil məlumatı. 22:77 bəzi məzhəblərdə səcdə yeri sayılmır.',
    lenNote: (n) => `Söz sayı — Tanzil mətninə görə (boşluqla ayrılan sözlər; cəmi ${n}). Hesablama üsuluna görə başqa mənbələrdə bir qədər fərqli ola bilər.`,
    juzNote: 'Cüz sərhədləri — Quran.com məlumatı.', sum: 'Quranın 6236 ayəsi rəngli nöqtələr şəklində',
  },
  en: {
    ey: 'Mosaic of the Quran', title: '6236 verses — one picture', lead: 'Each dot is one verse, in reading order from al-Fatiha to an-Nas. Switch the view and the structure of the Quran opens from another side.',
    modes: { type: 'Meccan / Medinan', length: 'Verse length', sajdah: 'Verses of prostration', juz: '30 juz' },
    mk: 'Meccan', md: 'Medinan', short: 'short', long: 'long', words: 'words', juz: 'juz', open: 'Open the verse', hint: 'Tap or hover over a dot',
    longest: 'The longest verses', sajList: 'The 15 verses of prostration', sajNote: 'List of prostration verses: Tanzil data. Some schools do not count 22:77 as a place of prostration.',
    lenNote: (n) => `Word count from the Tanzil text (words separated by spaces; ${n} in total). Other sources may differ slightly depending on how words are counted.`,
    juzNote: 'Juz boundaries: Quran.com data.', sum: 'The 6236 verses of the Quran as coloured dots',
  },
  ru: {
    ey: 'Мозаика Корана', title: '6236 аятов — одна картина', lead: 'Каждая точка — один аят, по порядку чтения от аль-Фатихи до ан-Нас. Смените вид — и строение Корана откроется с другой стороны.',
    modes: { type: 'Мекканские / мединские', length: 'Длина аята', sajdah: 'Аяты земного поклона', juz: '30 джузов' },
    mk: 'Мекканская', md: 'Мединская', short: 'короткий', long: 'длинный', words: 'слов', juz: 'джуз', open: 'Открыть аят', hint: 'Коснитесь точки или наведите на неё',
    longest: 'Самые длинные аяты', sajList: '15 аятов земного поклона', sajNote: 'Список аятов поклона — данные Tanzil. 22:77 в некоторых мазхабах не считается местом поклона.', // lang-ok[Tanzil,Quran]: mənbə adları (xüsusi ad)
    lenNote: (n) => `Число слов — по тексту Tanzil (слова, разделённые пробелами; всего ${n}). В других источниках может немного отличаться из-за способа подсчёта.`, // lang-ok[Tanzil,Quran]: mənbə adları (xüsusi ad)
    juzNote: 'Границы джузов — данные Quran.com.', sum: '6236 аятов Корана в виде цветных точек', // lang-ok[Tanzil,Quran]: mənbə adları (xüsusi ad)
  },
  ar: {
    ey: 'فسيفساء القرآن', title: '6236 آية في صورة واحدة', lead: 'كل نقطة آية، على ترتيب التلاوة من الفاتحة إلى الناس. غيّر العرض لترى بناء القرآن من جهة أخرى.',
    modes: { type: 'مكي / مدني', length: 'طول الآية', sajdah: 'آيات السجدة', juz: 'الأجزاء الثلاثون' },
    mk: 'مكية', md: 'مدنية', short: 'قصيرة', long: 'طويلة', words: 'كلمة', juz: 'الجزء', open: 'افتح الآية', hint: 'المس نقطة أو مرّر فوقها',
    longest: 'أطول الآيات', sajList: 'آيات السجدة الخمس عشرة', sajNote: 'قائمة آيات السجدة من بيانات Tanzil. ولا تَعُدّ بعض المذاهب 22:77 موضع سجود.', // lang-ok[Tanzil,Quran]: mənbə adları (xüsusi ad)
    lenNote: (n) => `عدد الكلمات بحسب نص Tanzil (الكلمات المفصولة بمسافة؛ المجموع ${n}). وقد يختلف قليلًا في مصادر أخرى لاختلاف طريقة العدّ.`, // lang-ok[Tanzil,Quran]: mənbə adları (xüsusi ad)
    juzNote: 'حدود الأجزاء من بيانات Quran.com.', sum: 'آيات القرآن الـ6236 نقاطًا ملوّنة', // lang-ok[Tanzil,Quran]: mənbə adları (xüsusi ad)
  },
  tr: {
    ey: 'Kur’an mozaiği', title: '6236 ayet — tek bir resimde', lead: 'Her nokta bir ayettir, Fatiha’dan Nas’a okuma sırasıyla. Görünümü değiştirin — Kur’an’ın yapısı başka bir yönden açılır.',
    modes: { type: 'Mekki / Medeni', length: 'Ayetin uzunluğu', sajdah: 'Secde ayetleri', juz: '30 cüz' },
    mk: 'Mekki', md: 'Medeni', short: 'kısa', long: 'uzun', words: 'kelime', juz: 'cüz', open: 'Ayeti aç', hint: 'Bir noktaya dokunun veya üzerine gelin',
    longest: 'En uzun ayetler', sajList: 'Kur’an’daki 15 secde ayeti', sajNote: 'Secde ayetleri listesi — Tanzil verisi. 22:77 bazı mezheplerde secde yeri sayılmaz.',
    lenNote: (n) => `Kelime sayısı — Tanzil metnine göre (boşlukla ayrılan kelimeler; toplam ${n}). Sayım yöntemine göre başka kaynaklarda biraz farklı olabilir.`,
    juzNote: 'Cüz sınırları — Quran.com verisi.', sum: 'Kur’an’ın 6236 ayeti renkli noktalar hâlinde', // lang-ok[Tanzil,Quran]: mənbə adları (xüsusi ad)
  },
}
const MODES = ['type', 'length', 'sajdah', 'juz']
const css = (el, name, fb) => (getComputedStyle(el).getPropertyValue(name).trim() || fb)
const hex = (h) => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(h); return m ? [1, 2, 3].map(i => parseInt(m[i], 16)) : [128, 128, 128] }
const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`
const reduced = () => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion'))
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

export default function QuranMosaic({ lang = 'az', surahName = (s) => String(s), onOpen }) {
  const t = pickUi(T, lang)
  const [mode, setMode] = useState('type')
  const [sel, setSel] = useState(null)   // ümumi indeks
  const [hover, setHover] = useState(null)
  const wrapRef = useRef(null), cvRef = useRef(null)
  const geo = useRef({ cols: 96, cell: 4, gap: 1 })
  const shown = useRef(false)
  const longest = useMemo(() => longestAyahs(5), [])

  useEffect(() => {
    const wrap = wrapRef.current, cv = cvRef.current
    if (!wrap || !cv) return undefined
    let raf = 0, alive = true, io = null
    const draw = (upto = TOTAL) => {
      const ctx = cv.getContext('2d')
      if (!ctx) return
      const { cols, cell, gap } = geo.current
      const dpr = window.devicePixelRatio || 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cv.width, cv.height)
      const c = {
        mk: css(wrap, '--qmo-mk', '#d8c79f'), md: css(wrap, '--qmo-md', '#6fb8a0'),
        lo: hex(css(wrap, '--qmo-lo', '#f3ead3')), mid: hex(css(wrap, '--qmo-mid', '#5fae95')), hi: hex(css(wrap, '--qmo-hi', '#1d3f7a')),
        dim: css(wrap, '--qmo-dim', '#e7e1d4'), saj: css(wrap, '--qmo-saj', '#d9a92e'),
        j1: css(wrap, '--qmo-j1', '#cfd9e8'), j2: css(wrap, '--qmo-j2', '#a8bcd8'),
        sel: css(wrap, '--qmo-sel', '#c2410c'),
      }
      const big = Math.max(cell * 2.2, 7)
      for (let i = 0; i < upto; i++) {
        let col
        if (mode === 'type') col = isMadani(i) ? c.md : c.mk
        else if (mode === 'length') { const q = lengthT(wordsAt(i)); col = q < 0.5 ? mix(c.lo, c.mid, q * 2) : mix(c.mid, c.hi, q * 2 - 1) }
        else if (mode === 'sajdah') col = c.dim
        else col = JUZ_OF[i] % 2 ? c.j1 : c.j2
        ctx.fillStyle = col
        ctx.fillRect((i % cols) * (cell + gap), Math.floor(i / cols) * (cell + gap), cell, cell)
      }
      if (mode === 'sajdah' && upto >= TOTAL) {
        ctx.fillStyle = c.saj
        for (const i of SAJDAH_IDX) {
          const x = (i % cols) * (cell + gap) + cell / 2, y = Math.floor(i / cols) * (cell + gap) + cell / 2
          ctx.beginPath(); ctx.arc(x, y, big / 2, 0, Math.PI * 2); ctx.fill()
        }
      }
      if (sel != null && upto >= TOTAL) {
        ctx.strokeStyle = c.sel; ctx.lineWidth = 2
        ctx.strokeRect((sel % cols) * (cell + gap) - 1.5, Math.floor(sel / cols) * (cell + gap) - 1.5, cell + 3, cell + 3)
      }
    }
    const layout = () => {
      const w = wrap.clientWidth
      const cols = w < 520 ? 64 : w < 900 ? 96 : 128
      const gap = 1, cell = Math.max(2, (w - gap * (cols - 1)) / cols)
      geo.current = { cols, cell, gap }
      const h = Math.ceil(TOTAL / cols) * (cell + gap) - gap
      const dpr = window.devicePixelRatio || 1
      cv.style.width = `${w}px`; cv.style.height = `${h}px`
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
    }
    layout()
    let upto = shown.current || reduced() ? TOTAL : 0
    const play = () => {
      shown.current = true
      const t0 = performance.now()
      const step = (now) => {
        if (!alive) return
        const k = Math.min(1, (now - t0) / 1100)
        upto = Math.floor(TOTAL * (1 - (1 - k) ** 3)); draw(upto)
        if (k < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }
    draw(upto)
    if (upto < TOTAL) {
      if (typeof IntersectionObserver === 'undefined') play()
      else { io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); play() } }, { threshold: 0.2 }); io.observe(wrap) }
    } else shown.current = true
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { layout(); draw(upto) }) : null
    ro?.observe(wrap)
    return () => { alive = false; cancelAnimationFrame(raf); ro?.disconnect(); io?.disconnect() }
  }, [mode, sel])

  const idxAt = (e) => {
    const r = cvRef.current.getBoundingClientRect(), { cols, cell, gap } = geo.current
    const col = Math.floor((e.clientX - r.left) / (cell + gap)), row = Math.floor((e.clientY - r.top) / (cell + gap))
    if (col < 0 || col >= cols || row < 0) return null
    const i = row * cols + col
    return i < TOTAL ? i : null
  }
  const onKey = (e) => {
    const { cols } = geo.current
    const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key]
    if (d) { e.preventDefault(); setSel(v => Math.min(TOTAL - 1, Math.max(0, (v ?? -d) + d))) }
    else if (e.key === 'Enter' && sel != null) { const r = refAt(sel); onOpen?.(r.s, r.a) }
  }
  const pickSajdah = (k) => { const [s, a] = k.split(':').map(Number); setSel(indexOf(s, a)) }
  const pickRef = (s, a) => setSel(indexOf(s, a))

  const cur = hover ?? sel
  const ref = cur != null ? refAt(cur) : null

  return (
    <section className="ui-card qmo" data-testid="quran-mosaic" aria-labelledby="qmo-title">
      <div className="qmo__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 id="qmo-title" className="ui-title ui-title--sm">{t.title}</h2>
        <p className="ui-lead">{t.lead}</p>
      </div>
      <div className="qmo__modes" role="tablist" aria-label={t.ey}>
        {MODES.map(m => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} className={`qmo__mode${mode === m ? ' is-on' : ''}`}
            onClick={() => setMode(m)} data-testid={`qmo-mode-${m}`}>{t.modes[m]}</button>
        ))}
      </div>
      <div className="qmo__wrap" ref={wrapRef}>
        <canvas ref={cvRef} className="qmo__cv" role="img" aria-label={`${t.sum} — ${t.modes[mode]}`} tabIndex={0} data-testid="qmo-canvas"
          onPointerMove={e => setHover(idxAt(e))} onPointerLeave={() => setHover(null)}
          onPointerDown={e => { const i = idxAt(e); if (i != null) setSel(i) }} onKeyDown={onKey} />
      </div>
      <div className="qmo__foot">
        <div className="qmo__legend" aria-hidden="true">
          {mode === 'type' && <><span><i className="qmo__sw qmo__sw--mk" />{t.mk}</span><span><i className="qmo__sw qmo__sw--md" />{t.md}</span></>}
          {mode === 'length' && <span className="qmo__ramp">{t.short}<i />{t.long}</span>}
          {mode === 'sajdah' && <span><i className="qmo__sw qmo__sw--saj" />{t.modes.sajdah} — 15</span>}
          {mode === 'juz' && <span><i className="qmo__sw qmo__sw--j1" /><i className="qmo__sw qmo__sw--j2" />{t.modes.juz}</span>}
        </div>
        <p className="qmo__info" aria-live="polite" data-testid="qmo-info">
          {ref ? <>
            <b>{surahName(ref.s)}</b> <span className="ui-num" dir="ltr">{ref.s}:{ref.a}</span>
            {' · '}<span className="ui-num">{wordsAt(cur)}</span> {t.words}
            {' · '}{t.juz} <span className="ui-num">{JUZ_OF[cur]}</span>
            {' · '}{isMadani(cur) ? t.md : t.mk}
            {SAJDAH_IDX.has(cur) && <> · <span className="qmo__saj-tag">{t.modes.sajdah}</span></>}
          </> : t.hint}
        </p>
        {sel != null && onOpen && (
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { const r = refAt(sel); onOpen(r.s, r.a) }} data-testid="qmo-open">
            {t.open} <Icon name="chevron" size={14} className="ui-flip-rtl" />
          </button>
        )}
      </div>
      {mode === 'sajdah' && (
        <div className="qmo__extra">
          <h3 className="qmo__h3">{t.sajList}</h3>
          <ol className="qmo__chips" data-testid="qmo-sajdah-list">
            {SAJDAH.map(k => {
              const [s] = k.split(':').map(Number)
              const on = sel != null && k === `${refAt(sel).s}:${refAt(sel).a}`
              return <li key={k}><button type="button" className={on ? 'is-on' : ''} onClick={() => pickSajdah(k)}><b>{surahName(s)}</b> <span className="ui-num" dir="ltr">{k}</span></button></li>
            })}
          </ol>
          <p className="qmo__note"><Icon name="info" size={14} /> {t.sajNote}</p>
        </div>
      )}
      {mode === 'length' && (
        <div className="qmo__extra">
          <h3 className="qmo__h3">{t.longest}</h3>
          <ol className="qmo__chips" data-testid="qmo-longest">
            {longest.map(r => <li key={`${r.s}:${r.a}`}><button type="button" onClick={() => pickRef(r.s, r.a)}><b>{surahName(r.s)}</b> <span className="ui-num" dir="ltr">{r.s}:{r.a}</span> · <span className="ui-num">{r.w}</span> {t.words}</button></li>)}
          </ol>
          <p className="qmo__note"><Icon name="info" size={14} /> {t.lenNote(fmt(TOTAL_WORDS))}</p>
        </div>
      )}
      {mode === 'juz' && <p className="qmo__note"><Icon name="info" size={14} /> {t.juzNote}</p>}
    </section>
  )
}
