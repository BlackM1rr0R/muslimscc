// ═══════════════════════════════════════════════════════
// /seerah — "Siyər — Peyğəmbərin ﷺ həyatı": Hicaz xəritəsi + zaman xətti
//
// • Məzmun: src/data/seerah.js (hər hadisənin Quran/Səhih hədis mənbəyi ilə; mətn sitat deyil).
// • Masaüstündə xəritə yanda (sticky), telefonda yuxarıda yığcam (sticky); zaman xətti
//   sürüşdürüldükcə hadisənin yeri xəritədə işıqlanır (IntersectionObserver — layout oxunmur).
//   Xəritədə və ya "Siyər yerləri" siyahısında yer seçiləndə həmin yerin hadisəsinə keçir
//   (eyni yer yenə seçilərsə — onun növbəti hadisəsinə), başlığa fokus verilir.
// • "Uşaqlar üçün" — eyni hadisələrin qısa, yumşaq mətni (eyni mənbələr).
// • Prerender = ilk render: aktiv hadisə — birinci, uşaq rejimi — söndürülü; heç bir
//   yaddaş/ünvan oxunmur (hash yalnız mount-dan sonra).
// • Canlı varlığın təsviri yoxdur; xəritə bəzəkdir (aria-hidden), yerlər düymə siyahısındadır.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import RelatedLinks from '../components/media/RelatedLinks'
import SeerahMap from '../components/seerah/SeerahMap'
import { SEERAH_T, yearText, calligraphicYear } from '../components/seerah/seerahText'
import { SEERAH_EVENTS, SEERAH_PLACES, SEERAH_BY_ID, parseSeerahSource, periodOf } from '../data/seerah'
import { navGroupLabel } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { localizeSource } from '../utils/sourceNames'
import { pickUi } from '../utils/uiText'
import '../styles/SeerahPage.css'

const L = (o, lang) => (o && pickUi(o, lang, 'en')) || ''

const RELATED = [
  { page: 'history', title: { az: 'İslam tarixi', en: 'Islamic History', ru: 'История ислама', ar: 'التاريخ الإسلامي', tr: 'İslam Tarihi' },
    text: { az: 'Peyğəmbərlər, hadisələr və siyər xəritələri', en: 'Prophets, events and maps of the Seerah', ru: 'Пророки, события и карты сиры', ar: 'الأنبياء والأحداث وخرائط السيرة', tr: 'Peygamberler, olaylar ve siyer haritaları' } },
  { page: 'holyplaces', title: { az: 'Müqəddəs yerlər', en: 'Holy places', ru: 'Святые места', ar: 'الأماكن المقدسة', tr: 'Kutsal mekânlar' },
    text: { az: 'Məkkə, Mədinə və Qüds — fotolar və tarix', en: 'Makkah, Madinah and Jerusalem — photos and history', ru: 'Мекка, Медина и Иерусалим — фото и история', ar: 'مكة والمدينة والقدس — صور وتاريخ', tr: 'Mekke, Medine ve Kudüs — fotoğraflar ve tarih' } },
  { page: 'sahaba', title: { az: 'Səhabələr', en: 'Companions', ru: 'Сахабы', ar: 'الصحابة', tr: 'Sahabeler' },
    text: { az: 'Bu hadisələrin iştirakçıları — həyatı və fəziləti', en: 'The people of these events — their lives and virtues', ru: 'Участники этих событий — их жизнь и достоинства', ar: 'رجال هذه الأحداث — سيرهم وفضائلهم', tr: 'Bu olayların şahsiyetleri — hayatları ve faziletleri' } },
  { page: 'hijri', title: { az: 'Hicri təqvim', en: 'Hijri calendar', ru: 'Календарь хиджры', ar: 'التقويم الهجري', tr: 'Hicri takvim' },
    text: { az: 'Hicri il hicrətdən başlayır — tarixləri çevirin', en: 'The Hijri year begins with the Hijrah — convert dates', ru: 'Год хиджры отсчитывается от переселения — переводите даты', ar: 'يبدأ التاريخ الهجري بالهجرة — حوّل التواريخ', tr: 'Hicri takvim hicretle başlar — tarihleri çevirin' } },
]

// Yer siyahısının sırası: əvvəl əsas yerlər, sonra ətraflar
const PLACE_ORDER = ['makkah', 'thawr', 'mina', 'arafat', 'hudaybiyyah', 'hunayn', 'taif', 'quba', 'madinah', 'uhud', 'khandaq', 'badr', 'khaybar', 'tabuk', 'habasha', 'aqsa']
// Yerin hadisələri: əvvəl əsas yeri olduğu, yoxdursa "also" ilə bağlı olanlar (Həbəşistan, Əqsa)
const EVENTS_OF = Object.fromEntries(PLACE_ORDER.map(p => {
  const main = SEERAH_EVENTS.filter(e => e.place === p)
  return [p, main.length ? main : SEERAH_EVENTS.filter(e => e.also?.includes(p))]
}))
const reducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-motion-user') } catch { return true }
}

function Sources({ e, lang, t }) {
  return (
    <p className="srh-ev__src">
      <Icon name="learn" size={14} />
      <strong>{t.source}:</strong>{' '}
      {e.src.map((s, i) => {
        const r = parseSeerahSource(s)
        const label = localizeSource(s, lang)
        return (
          <span key={s} className="srh-ev__srci">
            {i > 0 && <span aria-hidden="true"> · </span>}
            {r?.kind === 'quran'
              ? <a href={`${pathFor('quran', lang, r.s)}?a=${r.a}`} dir="ltr" title={t.openAyah}>{label}</a>
              : <span dir="ltr">{label}</span>}
          </span>
        )
      })}
    </p>
  )
}

function EventItem({ e, lang, t, kids, active, setRef }) {
  const y = yearText(e, t)
  const place = SEERAH_PLACES[e.place]
  return (
    <li id={`ev-${e.id}`} ref={setRef} data-id={e.id} data-place={e.place} data-testid="seerah-event"
      className={`srh-ev${active ? ' is-active' : ''}${kids ? ' is-kids' : ''}`}>
      <span className="srh-ev__mark" aria-hidden="true">
        <span className="srh-ev__cal" lang="ar" dir="rtl">{calligraphicYear(e)}</span>
      </span>
      <article className="srh-ev__card" aria-labelledby={`ev-${e.id}-h`}>
        <p className="srh-ev__when">
          <span className="ui-num">{y.hijri}</span>
          <span aria-hidden="true" className="srh-ev__dot">·</span>
          <span className="ui-num">{y.ce}</span>
          {e.differ && <span className="srh-ev__badge">{t.differ}</span>}
        </p>
        <h3 id={`ev-${e.id}-h`} className="srh-ev__title" tabIndex={-1}>{L(e.title, lang)}</h3>
        <p className="srh-ev__place">
          <Icon name="pin" size={14} /> {L(place.name, lang)}
          {place.approx && <span className="srh-ev__approx"> ({t.approxPlace})</span>}
        </p>
        <p className="srh-ev__text">{L(kids ? e.kids : e.text, lang)}</p>
        {e.link && (
          <p className="srh-ev__link">
            <a href={pathFor('history', lang)}><Icon name="history" size={15} /> {e.link === 'isra' ? t.isra : t.letters}</a>
          </p>
        )}
        <Sources e={e} lang={lang} t={t} />
      </article>
    </li>
  )
}

export default function SeerahPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(SEERAH_T, lang, 'en')
  const [active, setActive] = useState(SEERAH_EVENTS[0].id)
  const [kids, setKids] = useState(false)
  const [status, setStatus] = useState('')
  const items = useRef({})
  const pinned = useRef(0)   // klikdən sonra qısa müddət IO aktivi dəyişməsin (hamar sürüşmə zamanı)

  const setRef = useCallback((el) => {
    if (!el) return
    items.current[el.dataset.id] = el
  }, [])

  // Sürüşmə → aktiv hadisə: ekranın ortasındakı nazik zolağa girən hadisə
  useEffect(() => {
    if (typeof IntersectionObserver !== 'function') return undefined
    // Telefonda xəritə yuxarıda yapışıqdır — "oxu zolağı" ondan aşağıda olmalıdır
    let narrow = false
    try { narrow = window.matchMedia('(max-width: 959px)').matches } catch { /* köhnə brauzer */ }
    const io = new IntersectionObserver((entries) => {
      if (Date.now() < pinned.current) return
      const hit = entries.filter(en => en.isIntersecting)
      if (!hit.length) return
      // Bir neçəsi birdən girərsə — sırada sonuncu (aşağı sürüşmə istiqaməti)
      hit.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      setActive(hit[hit.length - 1].target.dataset.id)
    }, { rootMargin: narrow ? '-62% 0px -30% 0px' : '-42% 0px -50% 0px', threshold: 0 })
    Object.values(items.current).forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const goTo = useCallback((id, { focus = true } = {}) => {
    const el = items.current[id]
    if (!el) return
    setActive(id)
    pinned.current = Date.now() + 900
    // block: 'start' + CSS scroll-margin-top — telefonda yapışıq xəritənin altına düşür
    el.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' })
    if (focus) el.querySelector('h3')?.focus({ preventScroll: true })
  }, [])

  // Ünvandakı #ev-<id> (JSON-LD siyahısının linkləri) — mount-dan sonra
  useEffect(() => {
    const m = /^#ev-([a-z]+)$/.exec(window.location.hash || '')
    if (m && SEERAH_BY_ID[m[1]]) {
      const id = m[1]
      const tm = setTimeout(() => goTo(id, { focus: false }), 60)
      return () => clearTimeout(tm)
    }
    return undefined
  }, [goTo])

  // Yer seçimi: həmin yerin hadisəsi; aktiv hadisə artıq oradadırsa — növbəti
  const pickPlace = useCallback((pid) => {
    const list = EVENTS_OF[pid] || []
    if (!list.length) return
    const at = list.findIndex(e => e.id === active)
    const next = list[at >= 0 ? (at + 1) % list.length : 0]
    goTo(next.id)
  }, [active, goTo])
  const toggleKids = () => {
    const next = !kids
    setKids(next)
    setStatus(next ? t.kidsOn : t.kidsOff)
  }

  const ev = SEERAH_BY_ID[active] || SEERAH_EVENTS[0]
  const groups = useMemo(() => ({
    makkah: SEERAH_EVENTS.filter(e => periodOf(e) === 'makkah'),
    madinah: SEERAH_EVENTS.filter(e => periodOf(e) === 'madinah'),
  }), [])
  const activeYear = yearText(ev, t)

  return (
    <div className="srh-page">
      <header className="ui-page-hero srh-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel('knowledge', lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
          <p className="ui-page-hero__how"><Icon name="pin" size={16} /> {t.how}</p>
          <div className="srh-hero__tools">
            <button type="button" className="ui-chip srh-kids" aria-pressed={kids} onClick={toggleKids} data-testid="seerah-kids">
              <Icon name="kids" size={16} /> {t.kids}
            </button>
          </div>
          <p className="ui-sr-only" role="status" aria-live="polite">{status}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight srh-main">
        <div className="ui-container srh-layout">
          <aside className="srh-aside" data-testid="seerah-aside">
            <div className="srh-map" data-testid="seerah-map">
              <SeerahMap lang={lang} t={t} active={ev.place} also={ev.also || []} hijrah={!!ev.hijrah} onPick={pickPlace} />
              <p className="srh-map__now" aria-hidden="true" data-testid="seerah-map-now">
                <Icon name="pin" size={14} />
                <strong>{L(SEERAH_PLACES[ev.place].name, lang)}</strong>
                <span className="srh-map__now-sep">·</span>
                <span className="srh-map__now-t">{L(ev.title, lang)}</span>
                <span className="srh-map__now-y ui-num">{activeYear.ce}</span>
              </p>
            </div>
            <section className="srh-places" aria-labelledby="srh-places-h">
              <h2 id="srh-places-h" className="srh-places__h">{t.places}</h2>
              <p className="srh-places__hint">{t.placesHint}</p>
              <ul className="srh-places__list">
                {PLACE_ORDER.map(p => {
                  const n = EVENTS_OF[p].length
                  const on = ev.place === p
                  return (
                    <li key={p}>
                      <button type="button" className={`srh-place${on ? ' is-on' : ''}`} onClick={() => pickPlace(p)}
                        aria-current={on ? 'location' : undefined} data-testid={`seerah-place-${p}`}>
                        <span className="srh-place__name">{L(SEERAH_PLACES[p].name, lang)}</span>
                        <span className="srh-place__n">{t.nEvents(n)}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <p className="srh-map__note">{t.mapNote}</p>
            </section>
          </aside>

          <div className="srh-tl" data-testid="seerah-timeline">
            {['makkah', 'madinah'].map((g, gi) => (
              <section key={g} className={`srh-period srh-period--${g}`} aria-labelledby={`srh-p-${g}`}>
                <div className="srh-period__head">
                  <h2 id={`srh-p-${g}`} className="srh-period__title">{g === 'makkah' ? t.makkahPeriod : t.madinahPeriod}</h2>
                  <p className="srh-period__span">{g === 'makkah' ? t.makkahSpan : t.madinahSpan}</p>
                </div>
                <ol className="srh-list" start={gi ? groups.makkah.length + 1 : 1}>
                  {groups[g].map(e => (
                    <EventItem key={e.id} e={e} lang={lang} t={t} kids={kids} active={e.id === active} setRef={setRef} />
                  ))}
                </ol>
              </section>
            ))}
            <aside className="ui-card ui-card--sunken srh-about" aria-labelledby="srh-about-h">
              <h2 id="srh-about-h" className="srh-about__h"><Icon name="info" size={18} /> {t.noteTitle}</h2>
              <p>{t.note}</p>
            </aside>
          </div>
        </div>
      </section>

      <section className="ui-section ui-section--tight" aria-labelledby="srh-rel-h">
        <div className="ui-container">
          <div className="ui-section-head">
            <span className="ui-eyebrow">{t.relEyebrow}</span>
            <h2 id="srh-rel-h" className="ui-title ui-title--sm">{t.relTitle}</h2>
          </div>
          <RelatedLinks items={RELATED} />
        </div>
      </section>
    </div>
  )
}
