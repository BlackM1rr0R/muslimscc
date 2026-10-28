import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import '../styles/NotFoundPage.css'

// ═══════════════════════════════════════════════════════
// 404 — tanınmayan ünvan (/nope, /ru/nope/deeper, /Quran).
// Əvvəl belə ünvanlar səssizcə ana səhifəni göstərirdi ("soft-404").
// Seo.jsx bu səhifəni noindex edir; routes.js-də PAGES-ə DÜŞMÜR,
// ona görə prerender və sitemap-a təsir etmir.
// Dizayn v2: sakit kağız fon + xatəm naxışı, ortada kompas illüstrasiyası
// (əqrəb bir dəfə "yol axtarıb" yerinə oturur — dövri animasiya yoxdur),
// .ui-btn düymələri. Stil: styles/NotFoundPage.css.
// ═══════════════════════════════════════════════════════

const T = {
  az: { h: 'Səhifə tapılmadı', p: 'Axtardığınız səhifə yoxdur və ya ünvanı dəyişib.', home: 'Ana səhifə', jamaat: 'Camaat vaxtları', search: 'Saytda axtar' },
  en: { h: 'Page not found', p: 'The page you are looking for does not exist or has moved.', home: 'Home', jamaat: 'Congregation times', search: 'Search the site' },
  ru: { h: 'Страница не найдена', p: 'Такой страницы нет, или её адрес изменился.', home: 'Главная', jamaat: 'Время джамаата', search: 'Поиск по сайту' },
  ar: { h: 'الصفحة غير موجودة', p: 'الصفحة التي تبحث عنها غير موجودة أو تغيّر عنوانها.', home: 'الرئيسية', jamaat: 'مواقيت الجماعة', search: 'ابحث في الموقع' },
  tr: { h: 'Sayfa bulunamadı', p: 'Aradığınız sayfa yok ya da adresi değişti.', home: 'Ana sayfa', jamaat: 'Cemaat vakitleri', search: 'Sitede ara' },
}

// Axtarış pəncərəsini Header.jsx açır — bu hadisəni dinləyir
const OPEN_SEARCH_EVENT = 'qm-open-search'

export default function NotFoundPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang] || T.az

  return (
    <section className="nf-root" aria-labelledby="nf-title">
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
        <div className="nf-actions">
          <button type="button" className="ui-btn ui-btn--primary" onClick={() => setPage('home')}>
            <Icon name="home" className="ui-btn__icon" /> {t.home}
          </button>
          <button type="button" className="ui-btn ui-btn--secondary" onClick={() => setPage('jamaat')}>
            <Icon name="jamaat" className="ui-btn__icon" /> {t.jamaat}
          </button>
          <button
            type="button"
            className="ui-btn ui-btn--ghost"
            onClick={() => window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))}
          >
            <Icon name="search" className="ui-btn__icon" /> {t.search}
          </button>
        </div>
      </div>
    </section>
  )
}
