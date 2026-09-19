import { useLang } from '../contexts/LangContext'
import { pathFor } from '../seo/routes'
import '../styles/Breadcrumb.css'

// ═══════════════════════════════════════════════════════
// Çörək qırıntısı (breadcrumb) — səhifə hero-larında ortaq komponent
//
// Əvvəl hər səhifə öz izini yazırdı: bəzisi "Ana Səhifə ›", bəzisi
// "Qaraçuxur Məscidi ›", bəzisi "Qaraçuxur Məscidi /". İndi hamısı eynidir:
//   Ana səhifə › Cari səhifə        (ərəbcədə sağdan sola: ‹)
//
// Kök — həqiqi link (href = ana səhifənin ünvanı): Ctrl/orta klik yeni
// tabda açır, adi klik SPA ilə keçir (setPage('home')).
// Konteyner .breadcrumb sinfini saxlayır: globals.css-dəki görünüş (mərkəz,
// hero içində ağ) və motion.css-dəki "telefonda .hero-compact-da gizlət"
// qaydası olduğu kimi işləyir.
// ═══════════════════════════════════════════════════════

const HOME = {
  az: 'Ana səhifə',
  en: 'Home',
  ru: 'Главная',
  ar: 'الرئيسية',
  tr: 'Ana Sayfa',
}

/** Adi sol klikdirmi? (Ctrl/⌘/Shift/orta klik — brauzer linki özü açsın) */
function isPlainClick(e) {
  return !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
}

/**
 * @param {{ setPage?: (key: string) => void, current: import('react').ReactNode }} props
 *   current — cari səhifənin adı (hero başlığı və ya qısa ad)
 */
export default function Breadcrumb({ setPage, current }) {
  const { lang } = useLang()
  const rtl = lang === 'ar'

  const goHome = (e) => {
    if (!setPage || !isPlainClick(e)) return
    e.preventDefault()
    setPage('home')
  }

  return (
    <nav className="breadcrumb bc" aria-label="breadcrumb">
      <ol className="bc-list">
        <li className="bc-item">
          <a className="bc-home" href={pathFor('home', lang)} onClick={goHome}>
            {HOME[lang] || HOME.az}
          </a>
        </li>
        <li className="bc-item">
          {/* Ayırıcı cari səhifəyə baxır: LTR-də ›, RTL-də ‹.
              dir="ltr" — brauzerin bidi "güzgü" əvəzləməsi simvolu
              ikinci dəfə çevirməsin (hər brauzerdə eyni görünsün). */}
          <span className="bc-sep" aria-hidden="true" dir="ltr">{rtl ? '‹' : '›'}</span>
          <span className="bc-current" aria-current="page">{current}</span>
        </li>
      </ol>
    </nav>
  )
}
