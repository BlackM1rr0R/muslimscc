// ═══════════════════════════════════════════════════════
// /quran-prophets — "Quranda peyğəmbərlər": 25 peyğəmbər dairə sahəsində
//
// • Dairənin sahəsi adın Quranda keçmə sayına mütənasibdir (kvadrat kök şkalası;
//   components/quranprophets/prophetBubbles.js). Yerləşmə determinikdir, modul yüklənəndə
//   bir dəfə hesablanır — fizika dövrü yoxdur, prerender ilə klient eynidir.
// • Dairələr SVG-də çəkilir, üstündə həqiqi <button>-lar (klaviatura: Tab və ox düymələri).
// • Seçim → panel: ad, say, 114 surəlik "barkod" zolağı və ayə linkləri (?a= — saytın qaydası).
// • Saylar: data/quranProphets.js (scripts/build-quran-prophets.mjs — Quranic Arabic Corpus
//   morfologiyası, hər yer Osmani mətni ilə yoxlanılıb). Əl ilə yazılmış say yoxdur.
// • Prerender = ilk render: heç nə seçilməyib; #<id> (məs. #musa) yalnız mount-dan sonra oxunur.
// • İnsan təsviri yoxdur — yalnız ad, say və həndəsə.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import RelatedLinks from '../components/media/RelatedLinks'
import { isPlainClick } from '../components/PageLink'
import { navGroupLabel } from '../data/navigation'
import { getSurahLocal } from '../data/surahNamesAz'
import { SURAH_TABLE } from '../data/mushafIndex'
import { QURAN_PROPHETS } from '../data/quranProphets'
import { pathFor } from '../seo/routes'
import { pickUi } from '../utils/uiText'
import { decodeLocations } from '../utils/quranRoots'
import { bubbleRadius, packBubbles, surahStrip, groupBySurah, nearestInDirection } from '../components/quranprophets/prophetBubbles'
import { QP_T } from '../components/quranprophets/quranProphetsText'
import '../styles/QuranProphets.css'

// Dairələr — saya görə azalan (Tab sırası da belədir)
const ITEMS = [...QURAN_PROPHETS].sort((a, b) => b.count - a.count || a.num - b.num)
const LAYOUT = packBubbles(ITEMS.map(p => ({ id: p.id, r: bubbleRadius(p.count) })))
const TOTAL = QURAN_PROPHETS.reduce((s, p) => s + p.count, 0)
const MAX = ITEMS[0].count
const KEY_DIR = { ArrowRight: 'right', ArrowLeft: 'left', ArrowDown: 'down', ArrowUp: 'up' }

const reducedMotion = () => {
  try {
    const c = document.documentElement.classList
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || c.contains('a11y-motion-user') || c.contains('a11y-reduce-motion')
  } catch { return true }
}

// "Ibrahim (Abraham)" → "Ibrahim" (dairənin içində qısa ad)
const shortName = (s) => { const i = String(s).indexOf(' ('); return i > 0 ? s.slice(0, i) : s }

const RELATED = [
  { page: 'history', icon: 'history', title: { az: 'Peyğəmbərlər şəcərəsi', en: 'Family tree of the prophets', ru: 'Родословное древо пророков', ar: 'شجرة الأنبياء', tr: 'Peygamberler soy ağacı' },
    text: { az: 'İslam tarixi — peyğəmbərlər və Quranda adı keçən yerlər', en: 'Islamic history — the prophets and the places named in the Quran', ru: 'История ислама — пророки и места, названные в Коране', ar: 'التاريخ الإسلامي — الأنبياء والأماكن المذكورة في القرآن', tr: 'İslam tarihi — peygamberler ve Kur’an’da adı geçen yerler' } },
  { page: 'quranroots', title: { az: 'Kök axtarışı', en: 'Root search', ru: 'Поиск по корню', ar: 'البحث بالجذر', tr: 'Kök araması' },
    text: { az: 'Sözlər hansı kökdən gəlir', en: 'Which root a word comes from', ru: 'От какого корня слово', ar: 'جذور كلمات القرآن', tr: 'Kelimeler hangi kökten gelir' } },
  { page: 'quran', title: { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: 'Kur’an' },
    text: { az: 'Surələri oxu, dinlə, təfsirə bax', en: 'Read, listen and open the tafsir', ru: 'Читайте, слушайте, открывайте тафсир', ar: 'اقرأ واستمع وافتح التفسير', tr: 'Oku, dinle, tefsire bak' } },
]

function Strip({ locs, t, lang }) {
  const counts = useMemo(() => surahStrip(locs), [locs])
  const peak = Math.max(1, ...counts)
  const surah = (s) => getSurahLocal(s, lang)?.name || SURAH_TABLE[s - 1]?.[5] || String(s)
  return (
    <figure className="qpr-strip" data-testid="qpr-strip">
      <figcaption className="qpr-strip__h">{t.stripTitle}</figcaption>
      <svg className="qpr-strip__svg" viewBox="0 0 114 28" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <rect className="qpr-strip__base" x="0" y="26.5" width="114" height="1.5" />
        {counts.map((n, i) => (n > 0 ? (
          <rect key={i} className="qpr-strip__bar" data-s={i + 1} x={i + 0.1} width="0.8"
            y={28 - (6 + (n / peak) * 22)} height={6 + (n / peak) * 22}>
            <title>{`${i + 1}. ${surah(i + 1)} — ${t.times(n)}`}</title>
          </rect>
        ) : null))}
      </svg>
      <div className="qpr-strip__ends" aria-hidden="true"><span>{t.stripStart}</span><span>{t.stripEnd}</span></div>
    </figure>
  )
}

function AyahList({ locs, lang, t, onGo, testId }) {
  const groups = useMemo(() => groupBySurah(locs), [locs])
  const surah = (s) => getSurahLocal(s, lang)?.name || SURAH_TABLE[s - 1]?.[5] || String(s)
  return (
    <ul className="qpr-ayahs" data-testid={testId}>
      {groups.map(g => (
        <li key={g.s} className="qpr-ayahs__g">
          <span className="qpr-ayahs__s"><b className="ui-num">{g.s}</b> {surah(g.s)}</span>
          <span className="qpr-ayahs__refs">
            {g.ayahs.map(({ a, n }) => {
              const href = `${pathFor('quran', lang, g.s)}?a=${a}`
              return (
                <a key={a} className="qpr-ref ui-num" href={href} onClick={onGo} dir="ltr" data-testid="qpr-ref" title={t.open}>
                  {g.s}:{a}{n > 1 && <><span className="qpr-ref__x" aria-hidden="true"> ×{n}</span><span className="ui-sr-only"> ({t.times(n)})</span></>}
                </a>
              )
            })}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function QuranProphetsPage({ setPage }) {
  const { lang } = useLang()
  const navigate = useNavigate()
  const t = pickUi(QP_T, lang, 'en')
  const [sel, setSel] = useState(null)
  const [status, setStatus] = useState('')
  const btnRefs = useRef([])
  const panelRef = useRef(null)

  const nameOf = useCallback((p) => pickUi(p.name, lang, 'en'), [lang])
  const current = sel ? QURAN_PROPHETS.find(p => p.id === sel) : null
  const locs = useMemo(() => (current ? decodeLocations(current.locs) : []), [current])
  const ayahCount = useMemo(() => groupBySurah(locs).reduce((s, g) => s + g.ayahs.length, 0), [locs])
  const surahCount = useMemo(() => new Set(locs.map(l => l[0])).size, [locs])

  const choose = useCallback((id, { reveal = false } = {}) => {
    const p = QURAN_PROPHETS.find(x => x.id === id)
    if (!p) return
    setSel(id)
    setStatus(t.selected(pickUi(p.name, lang, 'en'), p.count))
    try { history.replaceState(history.state, '', `${location.pathname}${location.search}#${id}`) } catch { /* köhnə brauzer */ }
    if (!reveal) return
    // Telefonda panel dairələrin altındadır — görünmürsə ona sürüşdür (bir dəfə oxu)
    requestAnimationFrame(() => {
      const el = panelRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      if (r.top > window.innerHeight - 120) el.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' })
    })
  }, [t, lang])

  // #musa — yalnız mount-dan sonra (prerender = ilk render)
  useEffect(() => {
    const id = decodeURIComponent((location.hash || '').slice(1))
    if (id && QURAN_PROPHETS.some(p => p.id === id)) {
      setSel(id)
    }
  }, [])

  const onKeyDown = (e) => {
    const dir = KEY_DIR[e.key]
    if (!dir) return
    const i = btnRefs.current.indexOf(e.target)
    if (i < 0) return
    const j = nearestInDirection(LAYOUT.circles, i, dir)
    e.preventDefault()
    if (j >= 0) btnRefs.current[j]?.focus()
  }

  const onGo = useCallback((e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(e.currentTarget.getAttribute('href'))
  }, [navigate])

  const pct = (v, of) => `${((v / of) * 100).toFixed(3)}%`

  return (
    <div className="qpr-page">
      <header className="ui-page-hero qpr-hero">
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

      <section className="ui-section ui-section--tight">
        <div className="ui-container">
          <div className="qpr-layout">
            <figure className="qpr-field" aria-labelledby="qpr-field-h">
              <figcaption id="qpr-field-h" className="qpr-field__h">{t.fieldLabel}</figcaption>
              <div className="qpr-stage" style={{ aspectRatio: `${LAYOUT.w} / ${LAYOUT.h}` }} onKeyDown={onKeyDown} data-testid="qpr-stage">
                <svg className="qpr-svg" viewBox={`0 0 ${LAYOUT.w} ${LAYOUT.h}`} aria-hidden="true" focusable="false">
                  <defs>
                    <radialGradient id="qpr-glow" cx="50%" cy="38%" r="65%">
                      <stop offset="0%" className="qpr-glow__a" />
                      <stop offset="100%" className="qpr-glow__b" />
                    </radialGradient>
                  </defs>
                  {LAYOUT.circles.map((c, i) => {
                    const p = ITEMS[i]
                    return (
                      <g key={c.id} className={`qpr-c${sel === c.id ? ' is-on' : ''}${sel && sel !== c.id ? ' is-dim' : ''}`} style={{ '--i': i }}>
                        <circle cx={c.x} cy={c.y} r={c.r} className="qpr-c__disc" style={{ '--w': (0.35 + 0.65 * (p.count / MAX)).toFixed(3) }} />
                        <circle cx={c.x} cy={c.y} r={c.r} className="qpr-c__fill" fill="url(#qpr-glow)" />
                        <circle cx={c.x} cy={c.y} r={Math.max(0, c.r - 3.5)} className="qpr-c__ring" />
                      </g>
                    )
                  })}
                </svg>
                {LAYOUT.circles.map((c, i) => {
                  const p = ITEMS[i]
                  // Ərəbcədə yerli ad ərəb adının təkrarıdır — göstərilmir
                  const big = c.r >= 46 && lang !== 'ar'
                  return (
                    <button key={c.id} type="button" ref={el => { btnRefs.current[i] = el }}
                      className={`qpr-b${big ? ' is-big' : ''}`} data-testid={`qpr-b-${c.id}`} data-count={p.count}
                      aria-pressed={sel === c.id}
                      style={{ left: pct(c.x - c.r, LAYOUT.w), top: pct(c.y - c.r, LAYOUT.h), width: pct(2 * c.r, LAYOUT.w), height: pct(2 * c.r, LAYOUT.h),
                        '--fs': ((c.r / LAYOUT.w) * 100).toFixed(3) }}
                      onClick={() => choose(c.id, { reveal: true })}>
                      <span className="qpr-b__ar" lang="ar" dir="rtl" aria-hidden="true">{p.ar}</span>
                      {big && <span className="qpr-b__nm" aria-hidden="true">{shortName(nameOf(p))}</span>}
                      <span className="qpr-b__n ui-num" aria-hidden="true">{p.count}</span>
                      {/* Ad mətndən gəlir (aria-label yox): səsli idarədə görünən ad "Musa" adın əvvəlindədir */}
                      <span className="ui-sr-only" data-testid="qpr-label">{`${nameOf(p)}: ${t.mentioned(p.count)}`}</span>
                    </button>
                  )
                })}
              </div>
              <p className="qpr-field__keys">{t.keysHint}</p>
              <p className="qpr-field__total" data-testid="qpr-total">{t.total(TOTAL)}</p>
            </figure>

            <div className="ui-card qpr-panel" ref={panelRef} data-testid="qpr-panel">
              {current ? (
                <>
                  <div className="qpr-panel__head">
                    <span className="qpr-panel__ar" lang="ar" dir="rtl">{current.ar}</span>
                    <h2 className="qpr-panel__name" data-testid="qpr-name">{nameOf(current)}</h2>
                  </div>
                  <ul className="qpr-facts">
                    <li className="qpr-fact is-main" data-testid="qpr-count">{t.mentioned(current.count)}</li>
                    <li className="qpr-fact">{t.inAyahs(ayahCount)}</li>
                    <li className="qpr-fact">{t.inSurahs(surahCount)}</li>
                  </ul>
                  <Strip locs={locs} t={t} lang={lang} />
                  {t.notes[current.id] && <p className="qpr-note" data-testid="qpr-note"><Icon name="info" size={15} /> <span>{t.notes[current.id]}</span></p>}
                  <h3 className="qpr-panel__h3">{t.ayahsTitle}</h3>
                  <AyahList locs={locs} lang={lang} t={t} onGo={onGo} testId="qpr-ayahs" />
                  {(current.variants || []).map(v => (
                    <div key={v.id} className="qpr-variant" data-testid={`qpr-variant-${v.id}`}>
                      <h3 className="qpr-panel__h3">{t.variantsTitle}</h3>
                      <p className="qpr-variant__name"><span lang="ar" dir="rtl">{v.ar}</span> — {t.names[v.id]} · <span>{t.mentioned(v.count)}</span></p>
                      <AyahList locs={decodeLocations(v.locs)} lang={lang} t={t} onGo={onGo} testId={`qpr-ayahs-${v.id}`} />
                    </div>
                  ))}
                </>
              ) : (
                <p className="qpr-panel__hint" data-testid="qpr-hint"><Icon name="info" size={18} /> {t.hint}</p>
              )}
            </div>
          </div>
          <p className="ui-sr-only" role="status" aria-live="polite" data-testid="qpr-status">{status}</p>

          <aside className="ui-card ui-card--sunken qpr-about" aria-labelledby="qpr-about-h">
            <h2 id="qpr-about-h" className="qpr-about__h"><Icon name="info" size={18} /> {t.srcTitle}</h2>
            <p className="qpr-src" data-testid="qpr-source">{t.source}</p>
            <p>{t.rule}</p>
            <p>{t.note}</p>
          </aside>
        </div>
      </section>

      <section className="ui-section ui-section--tight" aria-labelledby="qpr-rel-h">
        <div className="ui-container">
          <div className="ui-section-head">
            <span className="ui-eyebrow">{t.relEyebrow}</span>
            <h2 id="qpr-rel-h" className="ui-title ui-title--sm">{t.relTitle}</h2>
          </div>
          <RelatedLinks items={RELATED} />
        </div>
      </section>
    </div>
  )
}
