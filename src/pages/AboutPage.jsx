import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { BRAND, brandName, tr } from '../config/brand'
import { HADITH_COUNT } from '../data/siteStats'
import { INDEXABLE } from '../seo/routes'
import Icon, { BrandMark } from '../components/Icon'
import '../styles/AboutPage.css'
import PageLink from '../components/PageLink'
import ReportErrorButton from '../components/ReportErrorButton'
import { NAV_GROUPS, navLabel } from '../data/navigation'
import { GROUP_DESC, EDITORIAL, ABOUT_EXTRA, ABOUT_V3, MANHAJ_POINTS } from '../data/pageGuides/AboutPage'
import { LIBRARY, LESSONS_BY_CAT, SCHOLARS_BY_ERA, ERA_SHORT } from '../data/pageGuides/aboutStats'
import { LESSON_CATS } from '../data/lessons/cats'
import { StatTile, ChartFigure, BarChart } from '../components/viz'

// Xəritədə göstərilməyən marşrutlar: ana səhifə (loqo) və bu səhifənin özü
const MAP_SKIP = new Set(['home', 'about'])

// ── Ayə: api.alquran.cloud-dan gətirilir (yaddaşdan yazılmır) ──
// Nəşrlər QuranPage/JamaatPage ilə eyni; ərəbcədə yalnız ərəb mətni.
// Keş açarı və formatı JamaatPage ilə eynidir — eyni sessiyada bir dəfə yüklənir.
const CTA_AYAH = '11:88'
const VERSE_EDITIONS = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet' }
const ARABIC_EDITION = 'quran-uthmani'
const VERSE_CACHE_PREFIX = 'qm_ayah_'
const VERSE_TIMEOUT_MS = 15000

function readVerse(key) {
  try {
    const raw = sessionStorage.getItem(VERSE_CACHE_PREFIX + key)
    if (!raw) return null
    const d = JSON.parse(raw)
    return d && typeof d.ar === 'string' && d.ar ? d : null
  } catch {
    return null
  }
}

function writeVerse(key, data) {
  try { sessionStorage.setItem(VERSE_CACHE_PREFIX + key, JSON.stringify(data)) } catch { /* yaddaş bağlıdır */ }
}

/** Ayəni ərəbcə + cari dilin tərcüməsi ilə qaytarır; xəta olarsa failed:true */
function useVerse(ref, lang) {
  const edition = lang === 'ar' ? '' : (VERSE_EDITIONS[lang] || VERSE_EDITIONS.en)
  const key = `${ref}_${edition || 'ar'}`
  const [state, setState] = useState(() => ({ key, data: readVerse(key), failed: false }))

  useEffect(() => {
    const cached = readVerse(key)
    if (cached) { setState({ key, data: cached, failed: false }); return undefined }
    setState({ key, data: null, failed: false })

    let alive = true
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), VERSE_TIMEOUT_MS)
    const eds = edition ? `${ARABIC_EDITION},${edition}` : ARABIC_EDITION
    fetch(`https://api.alquran.cloud/v1/ayah/${ref}/editions/${eds}`, { signal: ctrl.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(json => {
        const list = Array.isArray(json?.data) ? json.data : []
        const arabic = list.find(a => a?.edition?.identifier === ARABIC_EDITION)
        const trans = edition ? list.find(a => a?.edition?.identifier === edition) : null
        if (!arabic?.text || (edition && !trans?.text)) throw new Error('bad response')
        const data = {
          ar: arabic.text,
          text: trans?.text || '',
          tname: trans ? (lang === 'en' ? trans.edition?.englishName : trans.edition?.name) || '' : '',
        }
        writeVerse(key, data)
        if (alive) setState({ key, data, failed: false })
      })
      .catch(() => { if (alive) setState({ key, data: null, failed: true }) })
      .finally(() => clearTimeout(timer))

    return () => {
      alive = false
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [key, ref, edition, lang])

  return state.key === key ? state : { key, data: readVerse(key), failed: false }
}

// Ayənin "وَمَا تَوْفِيقِيٓ إِلَّا بِٱللَّهِ" hissəsini vurğulamaq üçün: mətn vəqf
// işarələrinə görə bölünür, hərəkələr atılıb "توفيق" sözü olan parça seçilir.
// Mətnin özü dəyişmir — yalnız həmin parça <span>-a alınır.
const HARAKAT = /[ً-ٰٟۖ-ۭ]/g
function splitMotto(ar) {
  const parts = ar.split(/(\s*[ۖ-ۜ]\s*)/)
  const idx = parts.findIndex(p => p.replace(HARAKAT, '').includes('توفيق'))
  return { parts, idx }
}

// Surə adı dillərə görə (ayə mətni deyil — yalnız istinad)
const SURAH_HUD = { az: 'Hud', en: 'Hud', ru: 'Худ', ar: 'هود', tr: 'Hûd' }

// "Haqqımızda" mətnləri — Muslims.cc platforması haqqında (konkret məscid yox).
// Əvvəl i18n.js-dən (T.about) gəlirdi; orada məscid dövrünün ifadələri
// qalmışdı və az mətnində "Missiyanız" səhvi var idi — ona görə mətnlər
// burada, 5 dilin hamısında saxlanılır. {brand} — brend adı (config/brand.js).
const ABOUT = {
  az: {
    title: 'Haqqımızda', subtitle: '{brand} — pulsuz və reklamsız İslami platforma',
    mission: 'Missiyamız',
    missionText: 'Hər müsəlmana — harada yaşamasından asılı olmayaraq — Quranı, namaz vaxtlarını, hədis və duaları öz dilində, gözəl və diqqəti dağıtmayan mühitdə çatdırmaq.',
    manhaj: 'Mənhəcimiz',
    values: 'Dəyərlərimiz',
    v1t: 'Etibarlılıq', v1d: 'Quran, hədis mənbələri və alimlərin əsərlərinə əsaslanan məzmun.',
    v2t: 'Pulsuz', v2d: 'Heç bir abunə, reklam və ya ödəniş yoxdur.',
    v3t: '5 dil', v3d: 'Azərbaycan, ingilis, rus, ərəb və türk dillərində.',
    v4t: 'Hər cihazda', v4d: 'Telefonda, planşetdə və kompüterdə işləyir; tətbiq kimi quraşdırmaq olar.',
  },
  en: {
    title: 'About Us', subtitle: '{brand} — a free, ad-free Islamic platform',
    mission: 'Our Mission',
    missionText: 'To bring the Quran, prayer times, hadith and duas to every Muslim — wherever they live — in their own language, in a beautiful, distraction-free environment.',
    manhaj: 'Our Methodology',
    values: 'Our Values',
    v1t: 'Reliability', v1d: 'Content based on the Quran, hadith collections and the works of scholars.',
    v2t: 'Free', v2d: 'No subscriptions, no ads, no payments.',
    v3t: '5 languages', v3d: 'In Azerbaijani, English, Russian, Arabic and Turkish.',
    v4t: 'On every device', v4d: 'Works on phones, tablets and computers, and can be installed as an app.',
  },
  ru: {
    title: 'О нас', subtitle: '{brand} — бесплатная исламская платформа без рекламы',
    mission: 'Наша миссия',
    missionText: 'Донести Коран, время намаза, хадисы и дуа до каждого мусульманина — где бы он ни жил — на его родном языке, в красивой среде без отвлечений.',
    manhaj: 'Наш путь (манхадж)',
    values: 'Наши ценности',
    v1t: 'Достоверность', v1d: 'Содержание основано на Коране, сборниках хадисов и трудах учёных.',
    v2t: 'Бесплатно', v2d: 'Без подписок, рекламы и платежей.',
    v3t: '5 языков', v3d: 'На азербайджанском, английском, русском, арабском и турецком.',
    v4t: 'На любом устройстве', v4d: 'Работает на телефоне, планшете и компьютере; можно установить как приложение.',
  },
  ar: {
    title: 'عن الموقع', subtitle: '{brand} — منصة إسلامية مجانية بلا إعلانات',
    mission: 'رسالتنا',
    missionText: 'إيصال القرآن ومواقيت الصلاة والأحاديث والأدعية إلى كل مسلم — أينما كان — بلغته، في بيئة جميلة خالية من المشتتات.',
    manhaj: 'منهجنا',
    values: 'قيمنا',
    v1t: 'الموثوقية', v1d: 'محتوى مبني على القرآن وكتب الحديث ومؤلفات العلماء.',
    v2t: 'مجاني', v2d: 'لا اشتراكات ولا إعلانات ولا مدفوعات.',
    v3t: '5 لغات', v3d: 'بالأذربيجانية والإنجليزية والروسية والعربية والتركية.',
    v4t: 'على كل جهاز', v4d: 'يعمل على الهاتف واللوحي والحاسوب، ويمكن تثبيته كتطبيق.',
  },
  tr: {
    title: 'Hakkımızda', subtitle: '{brand} — ücretsiz ve reklamsız İslami platform',
    mission: 'Misyonumuz',
    missionText: 'Kur’an’ı, namaz vakitlerini, hadisleri ve duaları her Müslümana — nerede yaşarsa yaşasın — kendi dilinde, güzel ve dikkat dağıtmayan bir ortamda ulaştırmak.',
    manhaj: 'Menhecimiz',
    values: 'Değerlerimiz',
    v1t: 'Güvenilirlik', v1d: 'Kur’an, hadis kaynakları ve âlimlerin eserlerine dayanan içerik.',
    v2t: 'Ücretsiz', v2d: 'Abonelik, reklam veya ödeme yok.',
    v3t: '5 dil', v3d: 'Azerbaycan Türkçesi, İngilizce, Rusça, Arapça ve Türkçe.',
    v4t: 'Her cihazda', v4d: 'Telefonda, tablette ve bilgisayarda çalışır; uygulama olarak yüklenebilir.',
  },
}

// Saytı hazırlayan — bir nəfər; əvvəl eyni ad üç fərqli vəzifə ilə üç dəfə
// göstərilirdi. Bir nəfər, bir vəzifə.
const BUILT_BY = {
  az: 'Saytı hazırlayan', en: 'Built by', ru: 'Сайт подготовил', ar: 'أعدّ الموقع', tr: 'Siteyi hazırlayan',
}
const DEV_ROLE = {
  az: 'Saytın tərtibatçısı', en: 'Website developer', ru: 'Разработчик сайта', ar: 'مطوّر الموقع', tr: 'Site geliştiricisi',
}

const READ_QURAN = { az: 'Quran oxu', en: 'Read the Quran', ru: 'Читать Коран', ar: 'اقرأ القرآن', tr: "Kur'an oku" }


// Xəritə qruplarının ikonu (navigation.js-də emoji var — burada xətti ikon)
const GROUP_ICON = { main: 'prayer', quran: 'quran', knowledge: 'learn', worship: 'qibla', duas: 'duas', hajj: 'hajjguide', giving: 'zakat', other: 'sparkle' }

// ═══════════════════════════════════════════════════════
// Dizayn v3 — yuxarıdan aşağı:
//   kompakt hero (nə + necə + 3 açar rəqəm; yanda brend lövhəsi) →
//   "Biz kimik": missiya + üstünlüklər | mənhəc (4 bənd) →
//   "Rəqəmlərlə": 8 StatTile + 2 zolaq qrafiki (dərslər mövzuya, alimlər
//   dövrə görə — rəqəmlər aboutStats.js, unit testlə yoxlanılır) →
//   saytın xəritəsi (qrup başına çiplər) → redaksiya prinsipləri →
//   məxfilik + əlaqə (+ saytı hazırlayan) → ayə (CTA).
// ═══════════════════════════════════════════════════════
export function AboutPage({ setPage }) {
  const { lang } = useLang()
  const t = ABOUT[lang] || ABOUT.en
  const x = ABOUT_EXTRA[lang] || ABOUT_EXTRA.en
  const v3 = ABOUT_V3[lang] || ABOUT_V3.en
  const brand = brandName(lang)
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const pickL = (o) => (o && (o[lang] || o.en || o.az)) || ''
  const verse = useVerse(CTA_AYAH, lang)

  // Üstünlüklər — xətti ikonlar (Icon.jsx), hamısı eyni brend tonunda
  const values = [
    { icon:'quran',  title:t.v1t, desc:t.v1d },
    { icon:'donate', title:t.v2t, desc:t.v2d },
    { icon:'globe',  title:t.v3t, desc:t.v3d },
    { icon:'phone',  title:t.v4t, desc:t.v4d },
  ]

  // Ad hüquqi səhifələrdəki ilə eyni mənbədən (brand.js → legal.operator)
  const memberName = tr(BRAND.legal.operator, lang) || 'Elchin Abdullayev'
  const initials = memberName.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const member = { initials, name: memberName, role: DEV_ROLE[lang] || DEV_ROLE.en }

  // Bölmə sayı — sitemap-a düşən (indekslənən) səhifələr, seo/routes.js-dən
  const sections = INDEXABLE.length
  const hours = Math.round(LIBRARY.lessonMinutes / 60)

  // Kitabxana kafelləri — hər biri öz bölməsinə aparır
  const tiles = [
    { to: 'learn',    icon: 'learn',    value: LIBRARY.lessons,   label: v3.sLessons,  hint: `~${hours} ${v3.hLessons}` },
    { to: 'hadith',   icon: 'hadith',   value: HADITH_COUNT, plus: true, label: v3.sHadith, hint: v3.hHadith },
    { to: 'names',    icon: 'names',    value: LIBRARY.names,     label: v3.sNames,    hint: v3.hNames },
    { to: 'nawawi40', icon: 'nawawi40', value: LIBRARY.nawawi,    label: v3.sNawawi,   hint: v3.hNawawi },
    { to: 'scholars', icon: 'scholars', value: LIBRARY.scholars,  label: v3.sScholars, hint: v3.hScholars },
    { to: 'sahaba',   icon: 'sahaba',   value: LIBRARY.sahaba,    label: v3.sSahaba,   hint: v3.hSahaba },
    { to: 'glossary', icon: 'glossary', value: LIBRARY.glossary,  label: v3.sGlossary, hint: v3.hGlossary },
    { to: null,       icon: 'list',     value: sections,          label: v3.sSections, hint: v3.hSections },
  ]

  const lessonBars = LESSON_CATS.map(c => ({ key: c.key, label: pickL(c.label), value: LESSONS_BY_CAT[c.key] || 0 }))
  const eraBars = Object.keys(SCHOLARS_BY_ERA).map(k => ({ key: k, label: pickL(ERA_SHORT[k]), value: SCHOLARS_BY_ERA[k] }))

  const ayahRef = lang === 'ar' ? `${SURAH_HUD.ar} ١١:٨٨` : `${SURAH_HUD[lang] || SURAH_HUD.en} 11:88`
  const motto = verse.data ? splitMotto(verse.data.ar) : null
  const arrow = <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />

  return (
    <div className="ab-root">
      <header className="ui-page-hero ui-page-hero--split ab-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="ui-container">
          <div className="ui-page-hero__text">
            {/* Latın brend adı BÖYÜK hərflə az/tr lokalında "MUSLİMS.CC" (nöqtəli İ) olurdu — lang="en" */}
            <span className="ui-eyebrow ab-brand" lang={/^[A-Za-z]/.test(brand) ? 'en' : undefined}>{brand}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.subtitle.replace('{brand}', brand)}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {v3.how}</p>
            <ul className="ui-page-hero__stats">
              <li><b>{sections}</b><span>{v3.sSections}</span></li>
              <li><b>5</b><span>{v3.langs}</span></li>
              <li><b>{LIBRARY.lessons}</b><span>{v3.sLessons}</span></li>
            </ul>
          </div>
          <div className="ui-page-hero__aside ab-hero-aside" aria-hidden="true">
            <div className="ab-plaque">
              <BrandMark size={56} className="ab-plaque__mark" />
              {/* Ərəbcə dekorativ şüar ar dilində h1-i təkrarlamasın */}
              {lang !== 'ar' && <p className="ab-plaque__ar ui-arabic" lang="ar" dir="rtl">{BRAND.arabicMotto}</p>}
              <span className="ab-plaque__chips">
                <span>{v3.free}</span><span>{v3.noAds}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Biz kimik: missiya + üstünlüklər | mənhəc (Tövbə 9:100; Buxari 2652) */}
      <section className="ui-section ab-story" aria-labelledby="ab-mission-title">
        <div className="ui-container ab-story-grid">
          <div className="ab-mission" data-reveal>
            <span className="ui-eyebrow">{v3.storyEy}</span>
            <h2 id="ab-mission-title" className="ui-title">{t.mission}</h2>
            <p className="ab-mission-text">{t.missionText}</p>
            <ul className="ab-values">
              {values.map((v, i) => (
                <li key={i} className="ab-value">
                  <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={v.icon} size={18} /></span>
                  <span className="ab-value__body"><b>{v.title}</b><small>{v.desc}</small></span>
                </li>
              ))}
            </ul>
          </div>

          <section className="ui-card ab-manhaj" data-reveal aria-labelledby="ab-manhaj-title">
            <span className="ui-eyebrow">{v3.manhajEy}</span>
            <h2 id="ab-manhaj-title" className="ui-title ui-title--sm">{t.manhaj}</h2>
            <ol className="ab-manhaj-list">
              {MANHAJ_POINTS.map((m, i) => (
                <li key={i}>
                  <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={m.icon} size={18} /></span>
                  <div>
                    <h3 className="ab-manhaj-t">{pickL(m.title)}</h3>
                    <p>{pickL(m.text)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="ab-manhaj-note">{v3.manhajNote}</p>
          </section>
        </div>
      </section>

      {/* Rəqəmlərlə — saytdakı bilik */}
      <section className="ui-section ui-section--alt ab-lib" aria-labelledby="ab-lib-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{v3.statsEy}</span>
            <h2 id="ab-lib-title" className="ui-title">{v3.statsTitle}</h2>
            <p className="ui-lead">{v3.statsLead}</p>
          </div>
          <ul className="ab-tiles" data-reveal="stagger">
            {tiles.map((s, i) => {
              const tile = (
                <StatTile icon={s.icon} label={s.label} hint={s.hint}
                  value={s.plus ? `${s.value}+` : String(s.value)} count={s.plus ? undefined : s.value} />
              )
              return (
                <li key={i}>
                  {s.to
                    ? <PageLink to={s.to} setPage={setPage} onNavigate={toTop} className="ab-tile-link">{tile}</PageLink>
                    : tile}
                </li>
              )
            })}
          </ul>
          <div className="ab-charts">
            <ChartFigure title={v3.chLessons} sub={v3.chUnitL}>
              <BarChart data={lessonBars} label={v3.chLessons} labelWidth="44%" />
              <PageLink to="learn" setPage={setPage} onNavigate={toTop} className="ui-link ab-chart-link">
                {navLabel('learn', lang)} {arrow}
              </PageLink>
            </ChartFigure>
            <ChartFigure title={v3.chScholars} sub={v3.chUnitS} note={v3.chNote}>
              <BarChart data={eraBars} label={v3.chScholars} tone={2} labelWidth="34%" />
              <PageLink to="scholars" setPage={setPage} onNavigate={toTop} className="ui-link ab-chart-link">
                {navLabel('scholars', lang)} {arrow}
              </PageLink>
            </ChartFigure>
          </div>
        </div>
      </section>

      {/* Saytın xəritəsi — bütün bölmələr navigation.js → NAV_GROUPS-dan (yeni bölmə özü düşür) */}
      <section className="ui-section ab-map-sec" aria-labelledby="ab-map-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{v3.mapEy}</span>
            <h2 id="ab-map-title" className="ui-title">{x.mapTitle}</h2>
            <p className="ui-lead">{x.mapLead}</p>
          </div>
          <div className="ab-map">
            {NAV_GROUPS.map(g => {
              const items = g.items.filter(it => !MAP_SKIP.has(it.key))
              if (!items.length) return null
              return (
                <section key={g.key} className="ab-map-group" aria-labelledby={`ab-map-${g.key}`}>
                  <div className="ab-map-head">
                    <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={GROUP_ICON[g.key] || 'list'} size={18} /></span>
                    <h3 id={`ab-map-${g.key}`} className="ab-map-title">{pickL(g.label)}</h3>
                    <span className="ab-map-count ui-num" aria-hidden="true">{items.length}</span>
                  </div>
                  {GROUP_DESC[g.key] && <p className="ab-map-desc">{pickL(GROUP_DESC[g.key])}</p>}
                  <ul className="ab-map-list">
                    {items.map(it => (
                      <li key={it.key}>
                        <PageLink to={it.key} setPage={setPage} onNavigate={toTop} className="ab-map-link">
                          <Icon name={it.key} size={15} />
                          <span>{pickL(it.label)}</span>
                        </PageLink>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        </div>
      </section>

      {/* Redaksiya prinsipləri — mənbələr, hədis dərəcəsi, AI tərcümələr, səhv bildirmək */}
      <section className="ui-section ui-section--alt ab-editorial-sec" aria-labelledby="ab-editorial-title">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <span className="ui-eyebrow">{v3.editorialEy}</span>
            <h2 id="ab-editorial-title" className="ui-title">{x.editorialTitle}</h2>
            <p className="ui-lead">{v3.editorialLead}</p>
          </div>
          <ol className="ab-editorial" data-reveal="stagger">
            {EDITORIAL.map((e, i) => (
              <li key={i} className="ab-principle">
                <span className="ui-icon-tile" aria-hidden="true"><Icon name={e.icon} /></span>
                <div className="ab-principle-body">
                  <h3 className="ui-card__title">{pickL(e.title)}</h3>
                  <p className="ui-card__text">{pickL(e.text)}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="ab-report">
            <ReportErrorButton refText={x.reportRef} kind="other" />
          </div>
        </div>
      </section>

      {/* Məxfilik xülasəsi + əlaqə (tam mətn /privacy-də) */}
      <section className="ui-section ab-info-sec" aria-label={`${x.privacyTitle} · ${x.contactTitle}`}>
        <div className="ui-container ab-info-grid">
          <article className="ui-card ab-info-card" aria-labelledby="ab-privacy-title">
            <div className="ab-info-head">
              <span className="ui-icon-tile" aria-hidden="true"><Icon name="shield" /></span>
              <h2 id="ab-privacy-title" className="ui-title ui-title--sm">{x.privacyTitle}</h2>
            </div>
            <p>{x.privacyText}</p>
            <ul className="ui-list ab-legal-list">
              {[['privacy', x.privacyLink, 'shield'], ['terms', x.termsLink, 'list'], ['licenses', x.licensesLink, 'books']].map(([k, label, ic]) => (
                <li key={k}>
                  <PageLink to={k} setPage={setPage} onNavigate={toTop} className="ui-list__item">
                    <Icon name={ic} /><span>{label}</span>
                    <Icon name="chevron" className="ui-list__chev ui-flip-rtl" />
                  </PageLink>
                </li>
              ))}
            </ul>
          </article>
          <article className="ui-card ab-info-card" aria-labelledby="ab-contact-title">
            <div className="ab-info-head">
              <span className="ui-icon-tile ui-icon-tile--accent" aria-hidden="true"><Icon name="send" /></span>
              <h2 id="ab-contact-title" className="ui-title ui-title--sm">{x.contactTitle}</h2>
            </div>
            <p>{x.contactText}</p>
            <dl className="ab-contact-list">
              {BRAND.legal?.email && (
                <div>
                  <dt>{x.email}</dt>
                  <dd><a href={`mailto:${BRAND.legal.email}`} className="ui-link" dir="ltr">{BRAND.legal.email}</a></dd>
                </div>
              )}
              {BRAND.instagram && (
                <div>
                  <dt>Instagram</dt>
                  <dd><a href={`https://instagram.com/${BRAND.instagram}`} className="ui-link" target="_blank" rel="noopener noreferrer" dir="ltr">@{BRAND.instagram} <Icon name="external" size={14} /></a></dd>
                </div>
              )}
            </dl>
            {/* Saytı hazırlayan — bir nəfər, bir vəzifə */}
            <div className="ab-team">
              <h3 className="ui-eyebrow">{BUILT_BY[lang] || BUILT_BY.en}</h3>
              <div className="ab-team-card">
                <div className="ab-avatar" aria-hidden="true">{member.initials}</div>
                <div>
                  <div className="ab-team-name">{member.name}</div>
                  <div className="ab-team-role">{member.role}</div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* CTA — ayə API-dən; alınmasa ayə sətirləri gizlənir, düymə qalır */}
      <section className="ui-section ab-end" aria-label={READ_QURAN[lang] || READ_QURAN.en}>
        <div className="ui-container">
          <div className="ui-card ui-card--inverse ab-cta" data-reveal>
            <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
            {verse.data ? (
              <figure className="ab-cta-verse">
                <blockquote className="ab-cta-arabic" lang="ar" dir="rtl">
                  {motto.idx >= 0
                    ? motto.parts.map((p, i) => (i === motto.idx ? <span key={i} className="ab-cta-motto">{p}</span> : p))
                    : verse.data.ar}
                </blockquote>
                {verse.data.text && <p className="ab-cta-translation">{verse.data.text}</p>}
                <figcaption className="ab-cta-ref">
                  — {ayahRef}{verse.data.tname ? ` · ${verse.data.tname}` : ''}
                </figcaption>
              </figure>
            ) : !verse.failed ? (
              <div className="ab-cta-skeleton" aria-hidden="true">
                <span className="skeleton skeleton--text" /><span className="skeleton skeleton--text" /><span className="skeleton skeleton--text" />
              </div>
            ) : null}
            <PageLink className="ui-btn ui-btn--inverse" to="quran" setPage={setPage} onNavigate={toTop}>
              <Icon name="quran" className="ui-btn__icon" /> {READ_QURAN[lang] || READ_QURAN.en}
            </PageLink>
          </div>
        </div>
      </section>
    </div>
  )
}
