import { useState } from 'react'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import '../styles/NotFoundPage.css'
import PageLink from '../components/PageLink'
import { navLabel } from '../data/navigation'

// ═══════════════════════════════════════════════════════
// 404 — tanınmayan ünvan (/nope, /ru/nope/deeper, /Quran).
// Əvvəl belə ünvanlar səssizcə ana səhifəni göstərirdi ("soft-404").
// Seo.jsx bu səhifəni noindex edir; routes.js-də PAGES-ə DÜŞMÜR,
// ona görə prerender və sitemap-a təsir etmir.
// Dizayn v3: kiçik kompas + 404 nişanı, bir cümlə izah, axtarış sahəsi
// (Header.jsx-in axtarış dialoqunu yazılan sözlə açır — "qm-open-search"
// hadisəsi, detail.q), 3 düymə və "Ən çox açılan bölmələr" kafelləri.
// Test qarmaqları: #nf-title, .nf-actions (1-ci link — ana səhifə,
// 2-ci link — camaat vaxtları). Stil: styles/NotFoundPage.css.
// ═══════════════════════════════════════════════════════

const T = {
  az: { h: 'Səhifə tapılmadı', p: 'Axtardığınız səhifə yoxdur və ya ünvanı dəyişib. Aşağıdan axtarın və ya məşhur bölmələrdən birini açın.', home: 'Ana səhifə', jamaat: 'Camaat vaxtları', search: 'Saytda axtar', ph: 'Məsələn: dəstəmaz, Fatihə, zəkat', go: 'Axtar', popular: 'Ən çox açılan bölmələr', popularLead: 'Bəlkə bunlardan birini axtarırdınız?' },
  en: { h: 'Page not found', p: 'The page you are looking for does not exist or has moved. Search below or open one of the popular sections.', home: 'Home', jamaat: 'Congregation times', search: 'Search the site', ph: 'For example: wudu, al-Fatiha, zakat', go: 'Search', popular: 'Popular sections', popularLead: 'Perhaps you were looking for one of these?' },
  ru: { h: 'Страница не найдена', p: 'Такой страницы нет, или её адрес изменился. Воспользуйтесь поиском или откройте один из популярных разделов.', home: 'Главная', jamaat: 'Время джамаата', search: 'Поиск по сайту', ph: 'Например: омовение, аль-Фатиха, закят', go: 'Найти', popular: 'Популярные разделы', popularLead: 'Возможно, вы искали один из них?' },
  ar: { h: 'الصفحة غير موجودة', p: 'الصفحة التي تبحث عنها غير موجودة أو تغيّر عنوانها. ابحث في الأسفل أو افتح أحد الأقسام الأكثر زيارة.', home: 'الرئيسية', jamaat: 'مواقيت الجماعة', search: 'ابحث في الموقع', ph: 'مثلًا: الوضوء، الفاتحة، الزكاة', go: 'بحث', popular: 'الأقسام الأكثر زيارة', popularLead: 'لعلك كنت تبحث عن أحدها؟' },
  tr: { h: 'Sayfa bulunamadı', p: 'Aradığınız sayfa yok ya da adresi değişti. Aşağıdan arayın veya popüler bölümlerden birini açın.', home: 'Ana sayfa', jamaat: 'Cemaat vakitleri', search: 'Sitede ara', ph: 'Örneğin: abdest, Fatiha, zekât', go: 'Ara', popular: 'En çok açılan bölümler', popularLead: 'Belki bunlardan birini arıyordunuz?' },
}

// Axtarış pəncərəsini Header.jsx açır — bu hadisəni dinləyir (detail.q — ilkin söz)
const OPEN_SEARCH_EVENT = 'qm-open-search'

// Məşhur bölmələr — ad və ikon navigation.js-dən (tək mənbə)
const POPULAR = ['prayer', 'quran', 'hadith', 'learn', 'duas', 'qibla', 'names', 'zakat']

export default function NotFoundPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang] || T.az
  const [q, setQ] = useState('')

  const openSearch = (query = '') => window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT, { detail: { q: query } }))
  const onSubmit = (e) => { e.preventDefault(); openSearch(q.trim()) }

  return (
    <div className="nf-root">
      <section className="nf-hero" aria-labelledby="nf-title">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
        <div className="nf-inner ui-container ui-container--narrow">
          {/* Kompas: halqa + 8 guşəli ulduz + yellənib dayanan əqrəb */}
          <div className="nf-art" aria-hidden="true">
            <svg viewBox="0 0 160 160" width="160" height="160" fill="none">
              <circle className="nf-ring" cx="80" cy="80" r="70" />
              <circle className="nf-ring nf-ring--in" cx="80" cy="80" r="56" />
              <path className="nf-star" d="M50 50h60v60H50zM80 37.6 122.4 80 80 122.4 37.6 80z" />
              <g className="nf-ticks">
                <path d="M80 6v10M80 144v10M6 80h10M144 80h10" />
              </g>
              <g className="nf-needle">
                <path className="nf-needle-n" d="M80 34 89 80H71z" />
                <path className="nf-needle-s" d="M80 126 71 80h18z" />
                <circle className="nf-hub" cx="80" cy="80" r="5" />
              </g>
            </svg>
            <span className="nf-code ui-num">404</span>
          </div>
          <h1 id="nf-title" className="ui-display nf-title">{t.h}</h1>
          <p className="ui-lead nf-lead">{t.p}</p>

          <form className="nf-search" role="search" onSubmit={onSubmit}>
            <label className="ui-sr-only" htmlFor="nf-q">{t.search}</label>
            <Icon name="search" size={18} className="nf-search__icon" />
            <input
              id="nf-q"
              type="search"
              className="ui-input nf-search__input"
              placeholder={t.ph}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
              enterKeyHint="search"
            />
            <button type="submit" className="ui-btn ui-btn--primary nf-search__btn">{t.go}</button>
          </form>

          <div className="nf-actions">
            <PageLink className="ui-btn ui-btn--secondary ui-btn--sm" to="home" setPage={setPage}>
              <Icon name="home" className="ui-btn__icon" /> {t.home}
            </PageLink>
            <PageLink className="ui-btn ui-btn--ghost ui-btn--sm" to="jamaat" setPage={setPage}>
              <Icon name="jamaat" className="ui-btn__icon" /> {t.jamaat}
            </PageLink>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => openSearch('')}>
              <Icon name="search" className="ui-btn__icon" /> {t.search}
            </button>
          </div>
        </div>
      </section>

      <section className="ui-section ui-section--tight nf-popular" aria-labelledby="nf-pop-title">
        <div className="ui-container ui-container--narrow">
          <div className="ui-section-head ui-section-head--center">
            <h2 id="nf-pop-title" className="ui-title ui-title--sm">{t.popular}</h2>
            <p className="ui-lead">{t.popularLead}</p>
          </div>
          <ul className="ui-tiles nf-tiles" style={{ '--ui-tiles-min': '150px' }}>
            {POPULAR.map(k => (
              <li key={k}>
                <PageLink className="ui-tile ui-tile--row" to={k} setPage={setPage}>
                  <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={k} size={18} /></span>
                  <span className="ui-tile__title">{navLabel(k, lang)}</span>
                </PageLink>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
