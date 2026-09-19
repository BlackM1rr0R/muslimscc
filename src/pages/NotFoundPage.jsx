import { useLang } from '../contexts/LangContext'

// ═══════════════════════════════════════════════════════
// 404 — tanınmayan ünvan (/nope, /ru/nope/deeper, /Quran).
// Əvvəl belə ünvanlar səssizcə ana səhifəni göstərirdi ("soft-404").
// Seo.jsx bu səhifəni noindex edir; routes.js-də PAGES-ə DÜŞMÜR,
// ona görə prerender və sitemap-a təsir etmir.
// Yalnız mövcud siniflər (.section, .card, .btn-*) və CSS dəyişənləri.
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
    <section className="section">
      <div
        className="card"
        style={{
          maxWidth: 520,
          margin: '0 auto',
          padding: 'clamp(28px, 6vw, 44px) clamp(20px, 5vw, 36px)',
          textAlign: 'center',
          transform: 'none', // statik kart — .card:hover qalxması lazım deyil
        }}
      >
        <div aria-hidden="true" style={{ fontSize: 44, lineHeight: 1, marginBottom: 14 }}>🧭</div>
        <h1 className="section-title" style={{ marginBottom: 10 }}>{t.h}</h1>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>{t.p}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          <button type="button" className="btn-primary" onClick={() => setPage('home')}>{t.home}</button>
          <button type="button" className="btn-secondary" onClick={() => setPage('jamaat')}>{t.jamaat}</button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))}
          >
            <span aria-hidden="true">🔍</span> {t.search}
          </button>
        </div>
      </div>
    </section>
  )
}
