// ═══════════════════════════════════════════════════════
// H5 — uşaq rejiminin qabığı (App.jsx yalnız kilid açıq olanda tənbəl yükləyir):
//   • sadə başlıq: loqo yazısı + 3 keçid (Uşaqlar, Quran, Dualar) + "Valideyn: çıxış" (PIN);
//   • adi başlıq, yan panel, footer, üzən düymə (AI), bildiriş / quraşdırma pəncərələri YOXDUR;
//   • xarici linkə klik (başqa origin, mailto, tel …) bloklanır, qısa xəbərdarlıq çıxır;
//   • marşrut qoruyucusu App.jsx-dədir (icazəsiz səhifə → /kids).
// İkonlar — yalnız həndəsi xətti ikonlar (canlı varlıq təsviri yoxdur).
// ═══════════════════════════════════════════════════════
import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import { brandName } from '../../config/brand'
import Icon from '../Icon'
import { KID_TXT } from './kidText'
import '../../styles/My.css'

const PinDialog = lazy(() => import('./PinDialog'))
const LINKS = [['kids', 'kids'], ['quran', 'quran'], ['duas', 'duas']]

/** Xarici ünvan (başqa origin və ya http(s) olmayan sxem) */
function isExternal(a) {
  const href = a.getAttribute('href')
  if (!href || href.startsWith('#')) return false
  try {
    const u = new URL(href, window.location.href)
    return u.origin !== window.location.origin || !/^https?:$/.test(u.protocol)
  } catch { return true }
}

export default function KidShell({ page, mainId, children }) {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(KID_TXT, lang, 'en')
  const navigate = useNavigate()
  const [pin, setPin] = useState(false)
  const [blocked, setBlocked] = useState(false)

  // Xarici keçidlər — klik tutulur (capture: komponentlərin öz onClick-indən əvvəl)
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target?.closest?.('a[href]')
      if (!a || !isExternal(a)) return
      e.preventDefault()
      e.stopPropagation()
      setBlocked(true)
    }
    document.addEventListener('click', onClick, true)
    const html = document.documentElement
    html.classList.add('kid-mode')
    return () => { document.removeEventListener('click', onClick, true); html.classList.remove('kid-mode') }
  }, [])
  useEffect(() => {
    if (!blocked) return undefined
    const id = setTimeout(() => setBlocked(false), 3500)
    return () => clearTimeout(id)
  }, [blocked])

  const go = (key) => (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(pathFor(key, siteLang))
    window.scrollTo(0, 0)
  }

  return (
    <>
      <a className="qm-skip" href={`#${mainId}`}>{t.mode}</a>
      <header className="kid-bar" data-testid="kid-shell">
        <div className="kid-bar__in">
          <span className="kid-bar__brand"><Icon name="star" size={18} /> {brandName(lang)} · <b>{t.mode}</b></span>
          <nav className="kid-bar__nav" aria-label={t.nav}>
            {LINKS.map(([key, icon]) => (
              <a key={key} className={`ui-chip kid-bar__link${page === key ? ' is-on' : ''}`} href={pathFor(key, siteLang)} onClick={go(key)} aria-current={page === key ? 'page' : undefined}>
                <Icon name={icon} size={16} /> {t[key]}
              </a>
            ))}
          </nav>
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm kid-bar__exit" onClick={() => setPin(true)} data-testid="kid-exit">
            <Icon name="lock" className="ui-btn__icon" /> {t.exit}
          </button>
        </div>
      </header>
      <div className="kid-main">{children}</div>
      <p className={`kid-toast${blocked ? ' is-on' : ''}`} role="status" aria-live="polite" data-testid="kid-blocked">{blocked ? t.blocked : ''}</p>
      {pin && (
        <Suspense fallback={null}>
          <PinDialog t={t} onClose={() => setPin(false)} onUnlocked={() => { setPin(false); navigate(pathFor('kids', siteLang)) }} />
        </Suspense>
      )}
    </>
  )
}
