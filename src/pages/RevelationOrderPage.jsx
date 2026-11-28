// ═══════════════════════════════════════════════════════
// /quran-revelation-order — "Nazil olma sırası": 114 surə kartı, iki sıra arasında uçuş
//
// • "Mushaf sırası ⇄ Nazil olma sırası": kartlar FLIP ilə yeni yerinə uçur — yalnız
//   transform; bir toplu oxu (köhnə yerlər), DOM dəyişir, bir toplu oxu (yeni yerlər),
//   sonra yalnız yazı. Azaldılmış hərəkətdə animasiya yoxdur.
// • Məkki / Mədəni — iki rəng (+ xətt forması, rəngdən asılı olmasın), say məlumatdan (86/28).
// • Zaman xətti nazil olma sırası ilə: Məkkə → Hicrət → Mədinə; karta hover/fokus —
//   xətdə onun yeri işıqlanır. "Ardıcıllığı göstər" kartları bir-bir açır (yalnız CSS
//   dəyişəni yazılır — React render yoxdur), sonda öz-özünə dayanır.
// • Prerender = ilk render: həmişə mushaf sırası; yaddaş/ünvan oxunmur.
// • Məlumat: data/surahRevelation.js (Quran.com — Misir/Əzhər cədvəli, ictihaddır, qəti deyil).
// ═══════════════════════════════════════════════════════
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import RelatedLinks from '../components/media/RelatedLinks'
import { isPlainClick } from '../components/PageLink'
import { navGroupLabel } from '../data/navigation'
import { getSurahLocal } from '../data/surahNamesAz'
import { pathFor } from '../seo/routes'
import { pickUi } from '../utils/uiText'
import { ayahCountText } from '../utils/quranText'
import {
  REV_SURAHS, REVELATION_SEQ, sequenceFor, placeCounts, timelineSegments, hijraPosition, positionPct, flipDeltas, localName,
} from '../components/quran/revelation/revelationOrder'
import { REV_T } from '../components/quran/revelation/revelationText'
import '../styles/RevelationOrder.css'

// SSR-də useLayoutEffect xəbərdarlığı verməsin
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

const reducedMotion = () => {
  try {
    const c = document.documentElement.classList
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || c.contains('a11y-motion-user') || c.contains('a11y-reduce-motion')
  } catch { return true }
}

const COUNTS = placeCounts()
const SEGMENTS = timelineSegments()
const HIJRA = hijraPosition()
const PLAY_STEP = 70   // ms — 114 surə ≈ 8 s
const FLIP_MS = 620

const RELATED = [
  { page: 'quran', title: { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: 'Kur’an' },
    text: { az: 'Surələri oxu, dinlə, təfsirə bax', en: 'Read, listen and open the tafsir', ru: 'Читайте, слушайте, открывайте тафсир', ar: 'اقرأ واستمع وافتح التفسير', tr: 'Oku, dinle, tefsire bak' } },
  { page: 'mushaf', title: { az: 'Mushaf görünüşü', en: 'Mushaf view', ru: 'Вид мусхафа', ar: 'عرض المصحف', tr: 'Mushaf görünümü' },
    text: { az: '604 səhifə, təcvid rəngləri', en: '604 pages, tajweed colours', ru: '604 страницы, цвета таджвида', ar: '٦٠٤ صفحات بألوان التجويد', tr: '604 sayfa, tecvit renkleri' } },
  { page: 'seerah', title: { az: 'Siyər — Peyğəmbərin ﷺ həyatı', en: 'Seerah — the life of the Prophet ﷺ', ru: 'Сира — жизнь Пророка ﷺ', ar: 'السيرة النبوية', tr: 'Siyer — Peygamber’in ﷺ hayatı' },
    text: { az: 'Məkkə və Mədinə dövrlərinin hadisələri', en: 'The events of the Makkah and Madinah periods', ru: 'События мекканского и мединского периодов', ar: 'أحداث العهدين المكي والمدني', tr: 'Mekke ve Medine dönemlerinin olayları' } },
  { page: 'hifz', title: { az: 'Hifz', en: 'Hifz', ru: 'Хифз', ar: 'الحفظ', tr: 'Hıfz' },
    text: { az: 'Əzbərləmə planı və təkrar', en: 'Memorisation plan and reviews', ru: 'План заучивания и повторения', ar: 'خطة الحفظ والمراجعة', tr: 'Ezber planı ve tekrar' } },
]

/** Kart — memo: hover/oynatma zamanı 114 kart yenidən render olunmur */
const Tile = memo(function Tile({ s, lang, t, href, onOpen }) {
  const name = localName(s.n, lang, getSurahLocal)
  return (
    <li className={`rvo-tile${s.medinan ? ' is-med' : ' is-mk'}`} data-n={s.n} data-testid="rvo-tile"
      data-place={s.medinan ? 'medinan' : 'meccan'} style={{ '--i': s.order - 1 }}>
      <a className="rvo-tile__a" href={href} onClick={onOpen}>
        <span className="rvo-tile__top">
          <span className="rvo-tile__n ui-num">{s.n}</span>
          <span className="rvo-tile__rev ui-num" aria-hidden="true">↓{s.order}</span>
        </span>
        <span className="rvo-tile__ar" lang="ar" dir="rtl">{s.ar}</span>
        {name && <span className="rvo-tile__name">{name}</span>}
        <span className="rvo-tile__ay">{ayahCountText(s.ayahs, lang)}</span>
        <span className="ui-sr-only"> · {s.medinan ? t.medinan : t.meccan} · {t.revN(s.order)}</span>
      </a>
    </li>
  )
})

const SurahGrid = memo(function SurahGrid({ mode, lang, t, playing, gridRef, onHot }) {
  const navigate = useNavigate()
  const seq = sequenceFor(mode)
  const onOpen = useCallback((e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(e.currentTarget.getAttribute('href'))
  }, [navigate])
  // Hover / fokus — bir dinləyici (delegation); karta çatanda xətdə yeri işıqlanır
  const hotFrom = (e) => {
    const li = e.target.closest?.('[data-n]')
    if (li) onHot(Number(li.dataset.n))
  }
  return (
    <ol ref={gridRef} className={`rvo-grid${playing ? ' is-playing' : ''}`} data-mode={mode} data-testid="rvo-grid"
      onPointerOver={hotFrom} onFocus={hotFrom} onPointerLeave={() => onHot(null)} onBlur={() => onHot(null)}>
      {seq.map(n => (
        <Tile key={n} s={REV_SURAHS[n - 1]} lang={lang} t={t} href={pathFor('quran', lang, n)} onOpen={onOpen} />
      ))}
    </ol>
  )
})

function Timeline({ t, lang, hot }) {
  const s = hot ? REV_SURAHS[hot - 1] : null
  const name = s ? (localName(s.n, lang, getSurahLocal) || s.ar) : ''
  return (
    <figure className="rvo-tl" aria-labelledby="rvo-tl-h" data-testid="rvo-timeline">
      <figcaption id="rvo-tl-h" className="rvo-tl__h">{t.tlTitle}</figcaption>
      <div className="rvo-tl__bar" aria-hidden="true">
        {SEGMENTS.map(g => (
          <span key={g.from} className={`rvo-tl__seg ${g.medinan ? 'is-med' : 'is-mk'}`} style={{ flexGrow: g.to - g.from + 1, '--len': g.to - g.from + 1 }} />
        ))}
        {HIJRA && (
          <span className="rvo-tl__hijra" style={{ '--p': ((HIJRA - 1) / REV_SURAHS.length) * 100 }} data-testid="rvo-hijra">
            <span className="rvo-tl__hijra-l">{t.hijra}</span>
          </span>
        )}
        <span className={`rvo-tl__hot${s ? ' is-on' : ''}${s?.medinan ? ' is-med' : ''}`} data-testid="rvo-tl-hot"
          data-pos={s ? s.order : ''} style={{ '--p': s ? positionPct(s.order, REV_SURAHS.length) : 0 }}>
          <span className="rvo-tl__dot" />
        </span>
      </div>
      {/* Seçilmiş surənin yeri (bəzək — oxu proqramı kartın öz mətnini oxuyur) */}
      <p className="rvo-tl__now" aria-hidden="true" data-testid="rvo-tl-now">
        {s ? <><b className="ui-num">{s.n}</b> {name}<span className="rvo-tl__now-sep">·</span>{t.revN(s.order)}</> : ' '}
      </p>
      <div className="rvo-tl__periods">
        {SEGMENTS.map(g => (
          <span key={g.from} className={`rvo-tl__period ${g.medinan ? 'is-med' : 'is-mk'}`} style={{ flexGrow: g.to - g.from + 1 }}>
            <b>{g.medinan ? t.madinahPeriod : t.makkahPeriod}</b>
            <span className="ui-num">{g.from}–{g.to}</span>
          </span>
        ))}
      </div>
      <p className="rvo-tl__sum">{t.tlSummary(COUNTS.meccan, COUNTS.medinan)}</p>
    </figure>
  )
}

export default function RevelationOrderPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(REV_T, lang, 'en')
  const [mode, setMode] = useState('mushaf')
  const [hot, setHot] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [status, setStatus] = useState('')
  const gridRef = useRef(null)
  const firstRef = useRef(null)
  const rafRef = useRef(0)
  const doneRef = useRef(0)

  // Kartların yeri şəbəkəyə nisbətən (transform daxil — uçuş yarımçıq kəsiləndə də düzgün)
  const measure = useCallback(() => {
    const grid = gridRef.current
    const m = new Map()
    if (!grid) return m
    const g = grid.getBoundingClientRect()
    for (const el of grid.children) {
      const r = el.getBoundingClientRect()
      m.set(Number(el.dataset.n), { x: r.left - g.left, y: r.top - g.top })
    }
    return m
  }, [])

  const firstName = useMemo(() => {
    const s = REV_SURAHS[REVELATION_SEQ[0] - 1]
    return lang === 'ar' ? s.ar : `${localName(s.n, lang, getSurahLocal)} (${s.n})`
  }, [lang])

  const changeMode = useCallback((next, { animate = true } = {}) => {
    if (next === mode) return
    setPlaying(false)
    firstRef.current = animate && !reducedMotion() ? measure() : null   // 1) oxu: köhnə yerlər
    setMode(next)
    setStatus(next === 'revelation' ? t.statusRev(firstName) : t.statusMushaf)
  }, [mode, measure, t, firstName])

  // FLIP: DOM yeni sıradadır, boyanmadan əvvəl
  useIsoLayoutEffect(() => {
    const first = firstRef.current
    firstRef.current = null
    const grid = gridRef.current
    if (!first || !grid) return
    cancelAnimationFrame(rafRef.current)
    const els = new Map()
    for (const el of grid.children) {
      els.set(Number(el.dataset.n), el)
      el.style.transition = 'none'   // 2) yaz: yarımçıq uçuşu sıfırla
      el.style.transform = ''
    }
    const moves = flipDeltas(first, measure())   // 3) oxu: yeni yerlər (bir toplu)
    for (const { n, dx, dy } of moves) els.get(n).style.transform = `translate(${dx}px, ${dy}px)`   // 4) yaz: geri çək
    // İki kadr sonra keçid: tərs vəziyyət əvvəlcə boyansın, sonra yerinə uçsun
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        let i = 0
        for (const { n } of moves) {
          const el = els.get(n)
          const delay = Math.min(i++ * 3, 260)
          el.style.transition = `transform ${FLIP_MS}ms cubic-bezier(.2,.75,.2,1) ${delay}ms`
          el.style.transform = ''
        }
        // Uçuş bitəndə keçidi sil — oynatmanın opacity keçidinə mane olmasın
        clearTimeout(doneRef.current)
        doneRef.current = setTimeout(() => { for (const { n } of moves) els.get(n).style.transition = '' }, FLIP_MS + 300)
      })
    })
  }, [mode])
  useEffect(() => () => { cancelAnimationFrame(rafRef.current); clearTimeout(doneRef.current) }, [])

  // Oynatma: kartlar nazil olma sırası ilə bir-bir (yalnız --lit dəyişəni yazılır)
  useEffect(() => {
    if (!playing) return undefined
    const grid = gridRef.current
    if (!grid) return undefined
    let k = 0
    grid.style.setProperty('--lit', '0')
    const id = setInterval(() => {
      k += 1
      grid.style.setProperty('--lit', String(k))
      setHot(REVELATION_SEQ[k - 1])
      if (k >= REVELATION_SEQ.length) {
        clearInterval(id)
        setPlaying(false)
        setHot(null)
        setStatus(t.statusDone)
      }
    }, PLAY_STEP)
    return () => { clearInterval(id); grid.style.removeProperty('--lit') }
  }, [playing]) // eslint-disable-line react-hooks/exhaustive-deps -- t yalnız son statusdadır; dil dəyişəndə oynatma yenidən başlamasın

  const togglePlay = useCallback(() => {
    if (playing) { setPlaying(false); setHot(null); return }
    if (mode !== 'revelation') changeMode('revelation', { animate: false })
    if (reducedMotion()) { setStatus(t.statusDone); return }   // hərəkətsiz: hamısı dərhal
    setPlaying(true)
    setStatus(t.statusPlay)
  }, [playing, mode, changeMode, t])

  const onHot = useCallback((n) => { if (!playing) setHot(n) }, [playing])

  return (
    <div className="rvo-page">
      <header className="ui-page-hero rvo-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel('quran', lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
          <p className="ui-page-hero__how"><Icon name="quran" size={16} /> {t.how}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight rvo-main">
        <div className="ui-container">
          <div className="rvo-bar" data-testid="rvo-bar">
            <div className="rvo-tools">
              <div className="ui-segmented rvo-seg" role="group" aria-label={t.sortLabel} data-wow-off="">
                <button type="button" aria-pressed={mode === 'mushaf'} onClick={() => changeMode('mushaf')} data-testid="rvo-mode-mushaf">
                  {t.mushaf}
                </button>
                <button type="button" aria-pressed={mode === 'revelation'} onClick={() => changeMode('revelation')} data-testid="rvo-mode-revelation">
                  {t.revelation}
                </button>
              </div>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm rvo-play" aria-pressed={playing} onClick={togglePlay} data-testid="rvo-play">
                <Icon name={playing ? 'pause' : 'play'} size={16} /> {playing ? t.stop : t.play}
              </button>
              <ul className="rvo-legend" aria-label={`${t.meccan} / ${t.medinan}`}>
                <li className="rvo-legend__i is-mk" data-testid="rvo-count-meccan"><span className="rvo-sw" aria-hidden="true" />{t.nMeccan(COUNTS.meccan)}</li>
                <li className="rvo-legend__i is-med" data-testid="rvo-count-medinan"><span className="rvo-sw" aria-hidden="true" />{t.nMedinan(COUNTS.medinan)}</li>
              </ul>
            </div>
            <Timeline t={t} lang={lang} hot={hot} />
          </div>
          <p className="ui-sr-only" role="status" aria-live="polite" data-testid="rvo-status">{status}</p>

          <SurahGrid mode={mode} lang={lang} t={t} playing={playing} gridRef={gridRef} onHot={onHot} />

          <aside className="ui-card ui-card--sunken rvo-about" aria-labelledby="rvo-about-h">
            <h2 id="rvo-about-h" className="rvo-about__h"><Icon name="info" size={18} /> {t.noteTitle}</h2>
            <p>{t.note}</p>
            <p className="rvo-src" data-testid="rvo-source">{t.source}</p>
          </aside>
        </div>
      </section>

      <section className="ui-section ui-section--tight" aria-labelledby="rvo-rel-h">
        <div className="ui-container">
          <div className="ui-section-head">
            <span className="ui-eyebrow">{t.relEyebrow}</span>
            <h2 id="rvo-rel-h" className="ui-title ui-title--sm">{t.relTitle}</h2>
          </div>
          <RelatedLinks items={RELATED} />
        </div>
      </section>
    </div>
  )
}
