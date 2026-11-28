// ═══════════════════════════════════════════════════════
// /rabbana-duas — "Rabbanā duaları": Quranda «رَبَّنَا» ilə başlayan dualar
//
// • Siyahı: data/rabbanaSpans.gen.js (scripts/build-rabbana.mjs) — ərəbcə hissə saytın Quran
//   mətnindən hərfi-hərfinə kəsilib; qərarlar (daxil/xaric) data/rabbanaDuas.js-də.
// • Tərcümə: bütün ayənin tərcüməsi, saytın oxuyucusundakı nəşr (public/data/rabbana/<dil>.json);
//   mount-dan sonra yüklənir (prerender = ilk render). Ərəbcədə tərcümə yoxdur.
// • Səs: AyahAudio (saytın qarisi). Hər kart Quran oxuyucusunda həmin ayəyə aparır.
// • Dua küpü: components/rabbana/DuaJar.jsx.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import AyahAudio from '../components/AyahAudio'
import RelatedLinks from '../components/media/RelatedLinks'
import { isPlainClick } from '../components/PageLink'
import DuaJar from '../components/rabbana/DuaJar'
import { RB_T, RB_WHO } from '../components/rabbana/rabbanaText'
import { refLabel, splitAyah } from '../components/rabbana/rabbanaJar'
import { RABBANA_ITEMS } from '../data/rabbanaSpans.gen'
import { navGroupLabel } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { pickUi, uiDictLang } from '../utils/uiText'
import '../styles/RabbanaPage.css'

const RELATED = [
  { page: 'duas', title: { az: 'Dualar', en: 'Duas', ru: 'Дуа', ar: 'الأدعية', tr: 'Dualar' },
    text: { az: 'Hər vəziyyət üçün dualar və peyğəmbərlərin duaları', en: 'Duas for every situation and the duas of the prophets', ru: 'Дуа на любой случай и мольбы пророков', ar: 'أدعية لكل حال وأدعية الأنبياء', tr: 'Her durum için dualar ve peygamberlerin duaları' } },
  { page: 'hisn', title: { az: 'Hisnul-Müslim', en: 'Hisn al-Muslim', ru: 'Хиснуль-муслим', ar: 'حصن المسلم', tr: 'Hısnu’l-Müslim' },
    text: { az: 'Kitab tam: 133 fəsil', en: 'The complete book: 133 chapters', ru: 'Полная книга: 133 главы', ar: 'الكتاب كاملًا: 133 بابًا', tr: 'Kitabın tamamı: 133 bölüm' } },
  { page: 'quran', title: { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: 'Kur’an' },
    text: { az: 'Surələri oxu, dinlə, təfsirə bax', en: 'Read, listen and open the tafsir', ru: 'Читайте, слушайте, открывайте тафсир', ar: 'اقرأ واستمع وافتح التفسير', tr: 'Oku, dinle, tefsire bak' } },
  { page: 'duajournal', title: { az: 'Dua gündəliyi', en: 'Dua journal', ru: 'Дневник дуа', ar: 'دفتر الدعاء', tr: 'Dua günlüğü' },
    text: { az: 'Duanın ədəbi və qəbul olunma vaxtları', en: 'Etiquette of dua and times of acceptance', ru: 'Этикет дуа и время принятия', ar: 'آداب الدعاء وأوقات الإجابة', tr: 'Duanın edebi ve kabul vakitleri' } },
]

// Tərcümə faylı (dil → Promise) — bir dəfə yüklənir
const trCache = new Map()
function loadTr(f) {
  if (!trCache.has(f)) {
    trCache.set(f, fetch(`/data/rabbana/${f}.json`).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
      .catch(e => { trCache.delete(f); throw e }))
  }
  return trCache.get(f)
}

export default function RabbanaPage({ setPage }) {
  const { lang } = useLang()
  const navigate = useNavigate()
  const t = pickUi(RB_T, lang, 'en')
  const [tr, setTr] = useState(null)
  const [trErr, setTrErr] = useState(false)

  // Tərcümə — yalnız mount-dan sonra (əlavə dildə həmin dilin nəşri)
  useEffect(() => {
    if (lang === 'ar') { setTr(null); return undefined }
    let alive = true
    const f = (lang === 'en' && uiDictLang()) || lang
    setTrErr(false)
    loadTr(f).catch(() => loadTr('en')).then(d => { if (alive) setTr(d) }).catch(() => { if (alive) setTrErr(true) })
    return () => { alive = false }
  }, [lang])

  const hrefFor = (it) => `${pathFor('quran', lang, it.s)}?a=${it.a}`
  const onOpen = (e, href) => { if (isPlainClick(e)) { e.preventDefault(); navigate(href) } }
  const who = (k) => (k && RB_WHO[k] ? pickUi(RB_WHO[k], lang, 'en') : '')

  return (
    <div className="rbn-page">
      <header className="ui-page-hero rbn-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel('duas', lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
          <p className="ui-page-hero__how"><Icon name="rabbana" size={16} /> {t.how}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container">
          <DuaJar items={RABBANA_ITEMS} t={t} lang={lang} tr={tr} hrefFor={hrefFor} onOpen={onOpen} />
        </div>
      </section>

      <section className="ui-section ui-section--tight" aria-labelledby="rbn-list-h">
        <div className="ui-container">
          <div className="ui-section-head rbn-list-head">
            <h2 id="rbn-list-h" className="ui-title ui-title--sm">{t.listTitle}</h2>
            <span className="rbn-count" data-testid="rbn-count">{t.nDuas(RABBANA_ITEMS.length)}</span>
          </div>
          {trErr && lang !== 'ar' ? <p className="rbn-err" role="status" data-testid="rbn-tr-err">{t.loadErr}</p> : null}
          <ol className="rbn-list" data-testid="rbn-list">
            {RABBANA_ITEMS.map((it) => {
              const { pre, span, post } = splitAyah(it)
              const label = refLabel(it, lang)
              const href = hrefFor(it)
              const w = who(it.who)
              const trText = lang !== 'ar' ? tr?.tr?.[it.ref] : ''
              return (
                <li key={it.ref} id={`d-${it.s}-${it.a}`} className="ui-card rbn-card" data-testid="rbn-card" data-ref={it.ref}>
                  <p className="ui-arabic rbn-card__ar" lang="ar" dir="rtl">{span}</p>
                  {(pre || post) && (
                    <details className="rbn-full">
                      <summary>{t.fullAyah}</summary>
                      <p className="ui-arabic rbn-full__ar" lang="ar" dir="rtl">
                        {pre}<mark className="rbn-mark">{span}</mark>{post}
                      </p>
                    </details>
                  )}
                  {w && <p className="rbn-who" data-testid="rbn-who"><span>{t.who}:</span> {w}</p>}
                  {lang !== 'ar' && (
                    trText
                      ? <div className="rbn-tr"><p>{trText}</p><small>{t.trOf(tr.by)}</small></div>
                      : (!trErr && <p className="rbn-tr rbn-tr--wait" aria-hidden="true">{t.loading}</p>)
                  )}
                  <div className="rbn-card__foot">
                    <a href={href} onClick={(e) => onOpen(e, href)} className="rbn-ref" data-testid="rbn-ref">
                      <Icon name="quran" size={16} /> <bdi>{label}</bdi>
                      <span className="ui-sr-only"> — {t.open}</span>
                    </a>
                    <AyahAudio s={it.s} a={it.a} />
                  </div>
                </li>
              )
            })}
          </ol>
          <aside className="ui-card ui-card--sunken rbn-about" aria-labelledby="rbn-about-h">
            <h2 id="rbn-about-h" className="rbn-about__h"><Icon name="info" size={18} /> {t.noteTitle}</h2>
            <p>{t.note}</p>
            <p className="rbn-src">{t.source}</p>
          </aside>
        </div>
      </section>

      <section className="ui-section ui-section--tight" aria-labelledby="rbn-rel-h">
        <div className="ui-container">
          <h2 id="rbn-rel-h" className="ui-title ui-title--sm">{t.relTitle}</h2>
          <RelatedLinks items={RELATED} />
        </div>
      </section>
    </div>
  )
}
