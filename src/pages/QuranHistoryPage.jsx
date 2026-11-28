// ═══════════════════════════════════════════════════════
// /quran-history — "Quran necə toplandı": tam ekran scrollytelling (6 mərhələ)
//
// • Məzmun: src/data/quranCompilation.js (ayə və hədis sitatları saytın mənbələrindən hərfbəhərf,
//   qalanı mənbələrin xülasəsi). UI yazıları: components/quranhistory/quranHistoryText.js.
// • Masaüstündə şəkil yanda yapışıqdır (sticky), mətn digər tərəfdə; telefonda şəkil yuxarıda.
//   Aktiv mərhələni IntersectionObserver seçir (sürüşmə dinləyicisi, layout oxunuşu yoxdur);
//   hərəkət yalnız transform/opacity (CSS). İrəliləyiş: yuxarıda nöqtə düymələri + zolaq.
// • Azaldılmış hərəkət (prefers-reduced-motion, html.a11y-reduce-motion, html.a11y-motion-user):
//   yalnız CSS ilə statik ardıcıl düzülüş — hər mərhələnin öz şəkli mətnin üstündə.
// • Prerender = ilk render: aktiv mərhələ — birinci; ünvan (#step-…) yalnız mount-dan sonra oxunur.
// • Canlı varlığın təsviri yoxdur.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { isPlainClick } from '../components/PageLink'
import RelatedLinks from '../components/media/RelatedLinks'
import { SceneArt } from '../components/quranhistory/QuranHistoryArt'
import { QH_T } from '../components/quranhistory/quranHistoryText'
import { QH_SCENES, QH_BY_ID, QH_CITIES, parseQhSource, bukhariLinks } from '../data/quranCompilation'
import { navGroupLabel } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { localizeSource } from '../utils/sourceNames'
import { pickUi } from '../utils/uiText'
import '../styles/QuranHistoryPage.css'

const L = (o, lang) => (o && (o[lang] || o.en)) || ''
const N = QH_SCENES.length
// Ayə nömrəsi ərəb-hind rəqəmi ilə (1–5; Intl lazım deyil)
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'

const RELATED = [
  { page: 'quran', title: { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: 'Kur’an' },
    text: { az: 'Ərəb mətni, tərcümə, təfsir və qiraət', en: 'Arabic text, translation, tafsir and recitation', ru: 'Арабский текст, перевод, тафсир и чтение', ar: 'النص والتفسير والتلاوة', tr: 'Arapça metin, meal, tefsir ve kıraat' } },
  { page: 'mushaf', title: { az: 'Mushaf görünüşü', en: 'Mushaf view', ru: 'Вид мусхафа', ar: 'عرض المصحف', tr: 'Mushaf görünümü' },
    text: { az: '604 səhifə, təcvid rəngləri', en: '604 pages, tajweed colours', ru: '604 страницы, цвета таджвида', ar: '٦٠٤ صفحات بألوان التجويد', tr: '604 sayfa, tecvit renkleri' } },
  { page: 'seerah', title: { az: 'Siyər — Peyğəmbərin ﷺ həyatı', en: 'Seerah — the life of the Prophet ﷺ', ru: 'Сира — жизнь Пророка ﷺ', ar: 'السيرة النبوية', tr: 'Siyer — Peygamber’in ﷺ hayatı' },
    text: { az: 'İlk vəhydən vəfata qədər — xəritədə', en: 'From the first revelation to his passing — on a map', ru: 'От первого откровения до кончины — на карте', ar: 'من بدء الوحي إلى الوفاة على الخريطة', tr: 'İlk vahiyden vefata — haritada' } },
  { page: 'hadithbooks', title: { az: 'Hədis kitabxanası', en: 'Hadith library', ru: 'Библиотека хадисов', ar: 'مكتبة الحديث', tr: 'Hadis kütüphanesi' },
    text: { az: 'Səhih əl-Buxari və digər kitablar', en: 'Sahih al-Bukhari and other collections', ru: '«Сахих» аль-Бухари и другие сборники', ar: 'صحيح البخاري وغيره', tr: 'Sahîh-i Buhârî ve diğer eserler' } },
  { page: 'hifz', title: { az: 'Hifz', en: 'Hifz', ru: 'Хифз', ar: 'الحفظ', tr: 'Hıfz' },
    text: { az: 'Səhabələr kimi əzbərləyin — plan və təkrar', en: 'Memorise like the Companions — plan and reviews', ru: 'Заучивайте, как сподвижники — план и повторения', ar: 'احفظ كما حفظ الصحابة: خطة ومراجعة', tr: 'Sahabe gibi ezberleyin — plan ve tekrar' } },
]

// Səhabə səhifəsinin adı (yalnız keçid mətni)
const PEOPLE = {
  'abu-bakr-as-siddiq': { az: 'Əbu Bəkr əs-Siddiq', en: 'Abu Bakr as-Siddiq', ru: 'Абу Бакр ас-Сиддик', ar: 'أبو بكر الصديق', tr: 'Ebû Bekir es-Sıddîk' },
  'umar-ibn-al-khattab': { az: 'Ömər ibn Xəttab', en: '‘Umar ibn al-Khattab', ru: 'Умар ибн аль-Хаттаб', ar: 'عمر بن الخطاب', tr: 'Ömer b. Hattâb' },
  'uthman-ibn-affan': { az: 'Osman ibn Affan', en: '‘Uthman ibn ‘Affan', ru: 'Усман ибн Аффан', ar: 'عثمان بن عفان', tr: 'Osman b. Affân' },
}
const GLOSSARY = {
  mushaf: { az: 'Mushaf', en: 'Mushaf', ru: 'Мусхаф', ar: 'المصحف', tr: 'Mushaf' },
  'rasm-uthmani': { az: 'Osmani rəsm', en: '‘Uthmani rasm', ru: 'Османский расм', ar: 'الرسم العثماني', tr: 'Resm-i Osmânî' },
}

const reducedMotion = () => {
  try {
    const c = document.documentElement.classList
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || c.contains('a11y-reduce-motion') || c.contains('a11y-motion-user')
  } catch { return true }
}

// Daxili link: adi klik SPA ilə, Ctrl/orta klik yeni tabda
function useGo() {
  const navigate = useNavigate()
  return useCallback((href) => (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(href)
  }, [navigate])
}

function Sources({ scene, lang, t }) {
  return (
    <p className="qh-src" data-testid="qh-sources">
      <Icon name="learn" size={14} />
      <strong>{t.source}:</strong>{' '}
      {scene.src.map((s, i) => {
        const r = parseQhSource(s)
        const label = localizeSource(s, lang)
        return (
          <span key={s} className="qh-src__i">
            {i > 0 && <span aria-hidden="true"> · </span>}
            {r?.kind === 'quran'
              ? <a href={`${pathFor('quran', lang, r.s)}?a=${r.a}`} dir="ltr">{label}</a>
              : r?.kind === 'bukhari'
                ? <a href={bukhariLinks(r.n).sunnah} target="_blank" rel="noopener noreferrer" dir="ltr"
                    title={`${t.bukhari} ${r.n} — ${t.sunnah}`}>{label}<Icon name="external" size={12} className="qh-src__ext" /></a>
                : <span dir="ltr">{label}</span>}
          </span>
        )
      })}
    </p>
  )
}

function HadithQuote({ q, lang, t, go }) {
  const r = parseQhSource(q.src)
  const lib = r ? bukhariLinks(r.n) : null
  const libHref = lib?.library ? pathFor('hadithbooks', lang) + lib.library : null
  return (
    <figure className="ui-quote qh-quote" data-testid="qh-quote">
      <blockquote>
        <p className="ui-quote__ar ui-arabic qh-quote__ar" lang="ar" dir="rtl">«{q.ar}»</p>
      </blockquote>
      <figcaption className="ui-quote__src">
        {t.quoteFrom} · <cite>{t.bukhari} <span className="ui-num">{r?.n}</span></cite>
        {libHref && <> · <a href={libHref} onClick={go(libHref)}>{t.library}</a></>}
      </figcaption>
    </figure>
  )
}

function Scene({ s, i, lang, t, active, setRef, go }) {
  const on = active === s.id
  return (
    <li id={`step-${s.id}`} ref={setRef} data-id={s.id} data-testid="qh-scene"
      className={`qh-scene qh-scene--${s.id}${on ? ' is-active' : ''}`}>
      {/* Statik düzülüşdə (azaldılmış hərəkət) hər mərhələnin öz şəkli */}
      <div className="qh-scene__fig" aria-hidden="true">
        <svg viewBox="0 0 400 400" className="qh-art" focusable="false"><SceneArt scene={s} lang={lang} on /></svg>
      </div>
      <article className="qh-card" aria-labelledby={`step-${s.id}-h`}>
        <p className="qh-card__meta">
          <span className="qh-card__n ui-num">{t.stepOf(i + 1, N)}</span>
          {s.when && <><span aria-hidden="true" className="qh-card__dot">·</span><span className="qh-card__when">{L(s.when, lang)}</span></>}
        </p>
        <h2 id={`step-${s.id}-h`} className="qh-card__title" tabIndex={-1}>{L(s.title, lang)}</h2>
        <p className="qh-card__text">{L(s.text, lang)}</p>

        {s.ayahs && (
          <figure className="ui-quote qh-ayahs" data-testid="qh-ayahs">
            <blockquote>
              <p className="ui-arabic qh-ayahs__ar" lang="ar" dir="rtl">
                {s.ayahs.map(a => (
                  <span key={a.n}>{a.ar} <span className="qh-ayahs__n" aria-hidden="true">﴿{AR_DIGITS[a.n]}﴾</span>{' '}</span>
                ))}
              </p>
            </blockquote>
            <figcaption className="ui-quote__src">
              {t.quran}, <a href={`${pathFor('quran', lang, s.surah)}?a=1`} onClick={go(`${pathFor('quran', lang, s.surah)}?a=1`)} dir="ltr">96:1–5</a>
              {' · '}<a href={`${pathFor('quran', lang, s.surah)}?a=1`} onClick={go(`${pathFor('quran', lang, s.surah)}?a=1`)}>{t.readSurah}</a>
            </figcaption>
          </figure>
        )}

        {s.materials && (
          <div className="qh-block">
            <h3 className="qh-block__h">{t.materials}</h3>
            <ul className="qh-mat">
              {s.materials.map(m => (
                <li key={m.ar}>
                  <span className="ui-arabic qh-mat__ar" lang="ar" dir="rtl">{m.ar}</span>
                  <span className="qh-mat__name">{L(m.name, lang)}</span>
                  <span className="qh-mat__src" dir="ltr">{localizeSource(m.src, lang)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {s.quotes?.map(q => <HadithQuote key={q.ar} q={q} lang={lang} t={t} go={go} />)}

        {s.keepers && (
          <div className="qh-block">
            <h3 className="qh-block__h">{t.keepers}</h3>
            <ol className="qh-keepers">
              {s.keepers.map((k, ki) => (
                <li key={ki}><span className="qh-keepers__n ui-num" aria-hidden="true">{ki + 1}</span>
                  <span><strong>{L(k.name, lang)}</strong> — {L(k.note, lang)}</span></li>
              ))}
            </ol>
          </div>
        )}

        {s.cities && (
          <div className="qh-block" data-testid="qh-cities">
            <h3 className="qh-block__h">{t.cities}</h3>
            <ul className="qh-cities">
              {s.cities.map(c => <li key={c}><Icon name="pin" size={14} /> {L(QH_CITIES[c].name, lang)}</li>)}
            </ul>
            <p className="qh-block__note">{t.citiesNote}</p>
          </div>
        )}

        {s.verse && (
          <figure className="ui-quote qh-verse">
            <blockquote>
              <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{s.verse.ar}</p>
              {lang !== 'ar' && <p className="ui-quote__text">{L(s.verse.text, lang)}</p>}
            </blockquote>
            <figcaption className="ui-quote__src">
              {t.quran}, <a href={`${pathFor('quran', lang, 15)}?a=9`} onClick={go(`${pathFor('quran', lang, 15)}?a=9`)} dir="ltr">{s.verse.ref}</a>
            </figcaption>
          </figure>
        )}

        {s.id === 'today' && (
          <p className="qh-cta">
            <a className="ui-btn ui-btn--primary" href={pathFor('quran', lang)} onClick={go(pathFor('quran', lang))} data-testid="qh-open-quran">
              <Icon name="quran" size={18} /> {t.openQuran}
            </a>
            <a className="ui-btn ui-btn--secondary" href={pathFor('mushaf', lang)} onClick={go(pathFor('mushaf', lang))} data-testid="qh-open-mushaf">
              <Icon name="mushaf" size={18} /> {t.openMushaf}
            </a>
          </p>
        )}

        {(s.people || s.glossary) && (
          <p className="qh-links">
            {s.people?.map(p => {
              const href = pathFor('sahaba', lang, p)
              return <a key={p} className="ui-chip" href={href} onClick={go(href)}><Icon name="sahaba" size={14} /> {L(PEOPLE[p], lang)}</a>
            })}
            {s.glossary?.map(g => {
              const href = pathFor('glossary', lang, g)
              return <a key={g} className="ui-chip" href={href} onClick={go(href)}><Icon name="glossary" size={14} /> {L(GLOSSARY[g], lang)}</a>
            })}
          </p>
        )}

        {s.approx && <p className="qh-approx">{t.approxNote}</p>}
        <Sources scene={s} lang={lang} t={t} />
      </article>
    </li>
  )
}

export default function QuranHistoryPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(QH_T, lang, 'en')
  const go = useGo()
  const [active, setActive] = useState(QH_SCENES[0].id)
  const items = useRef({})
  const pinned = useRef(0)   // düymə ilə keçiddən sonra qısa müddət IO aktivi dəyişməsin

  const setRef = useCallback((el) => {
    if (el) items.current[el.dataset.id] = el
  }, [])

  // Sürüşmə → aktiv mərhələ: ekranın "oxu xəttinə" girən mərhələ (layout oxunmur)
  useEffect(() => {
    if (typeof IntersectionObserver !== 'function') return undefined
    let narrow = false
    try { narrow = window.matchMedia('(max-width: 899px)').matches } catch { /* köhnə brauzer */ }
    const io = new IntersectionObserver((entries) => {
      if (Date.now() < pinned.current) return
      const hit = entries.filter(en => en.isIntersecting)
      if (!hit.length) return
      hit.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      setActive(hit[hit.length - 1].target.dataset.id)
    }, { rootMargin: narrow ? '-66% 0px -32% 0px' : '-48% 0px -50% 0px', threshold: 0 })
    Object.values(items.current).forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const goTo = useCallback((id, { focus = true } = {}) => {
    const el = items.current[id]
    if (!el) return
    setActive(id)
    pinned.current = Date.now() + 900
    el.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' })
    if (focus) el.querySelector('h2')?.focus({ preventScroll: true })
  }, [])

  // Ünvandakı #step-<id> (statik blokun linkləri) — mount-dan sonra
  useEffect(() => {
    const m = /^#step-([a-z]+)$/.exec(window.location.hash || '')
    if (m && QH_BY_ID[m[1]]) {
      const id = m[1]
      const tm = setTimeout(() => goTo(id, { focus: false }), 60)
      return () => clearTimeout(tm)
    }
    return undefined
  }, [goTo])

  const ai = Math.max(0, QH_SCENES.findIndex(s => s.id === active))
  const cur = QH_SCENES[ai]

  return (
    <div className="qh-page">
      <header className="ui-page-hero qh-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel('quran', lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
          <p className="ui-page-hero__how"><Icon name="arrowDown" size={16} /> {t.how}</p>
        </div>
      </header>

      <section className="qh-story" data-testid="qh-story" aria-label={t.title}>
        <nav className="qh-progress" aria-label={t.progress} data-testid="qh-progress">
          <div className="ui-container qh-progress__in">
            <p className="qh-progress__now" data-testid="qh-progress-now">
              <span className="qh-progress__n ui-num">{t.stepOf(ai + 1, N)}</span>
              <span className="qh-progress__t">{L(cur.title, lang)}</span>
            </p>
            <ol className="qh-progress__dots">
              {QH_SCENES.map((s, i) => (
                <li key={s.id}>
                  <button type="button" className={`qh-dot${i <= ai ? ' is-done' : ''}${i === ai ? ' is-on' : ''}`}
                    aria-current={i === ai ? 'step' : undefined} aria-label={t.goTo(i + 1, L(s.title, lang))}
                    onClick={() => goTo(s.id)} data-testid={`qh-dot-${s.id}`}>
                    <span className="qh-dot__n ui-num" aria-hidden="true">{i + 1}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <span className="qh-progress__bar" aria-hidden="true">
            <span className="qh-progress__fill" style={{ transform: `scaleX(${(ai + 1) / N})` }} />
          </span>
        </nav>

        <div className="ui-container qh-layout">
          <div className="qh-stage" aria-hidden="true" data-testid="qh-stage">
            <svg viewBox="0 0 400 400" className="qh-art qh-stage__svg" data-active={active} focusable="false" data-testid="qh-stage-svg">
              {QH_SCENES.map(s => <SceneArt key={s.id} scene={s} lang={lang} on={s.id === active} />)}
            </svg>
          </div>
          <ol className="qh-scenes">
            {QH_SCENES.map((s, i) => (
              <Scene key={s.id} s={s} i={i} lang={lang} t={t} active={active} setRef={setRef} go={go} />
            ))}
          </ol>
        </div>
      </section>

      <section className="ui-section ui-section--tight" aria-labelledby="qh-about-h">
        <div className="ui-container qh-narrow">
          <aside className="ui-card ui-card--sunken qh-about">
            <h2 id="qh-about-h" className="qh-about__h"><Icon name="info" size={18} /> {t.noteTitle}</h2>
            <p>{t.note}</p>
          </aside>
        </div>
      </section>

      <section className="ui-section ui-section--tight" aria-labelledby="qh-rel-h">
        <div className="ui-container">
          <div className="ui-section-head">
            <span className="ui-eyebrow">{t.relEyebrow}</span>
            <h2 id="qh-rel-h" className="ui-title ui-title--sm">{t.relTitle}</h2>
          </div>
          <RelatedLinks items={RELATED} />
        </div>
      </section>
    </div>
  )
}
