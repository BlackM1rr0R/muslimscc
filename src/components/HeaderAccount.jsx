// ═══════════════════════════════════════════════════════
// Başlıqda hesab düyməsi (≥1440px; 1024–1439px — yan paneldə, <1024px — çəkmə menyuda: SideNav)
//
// • Anonim: "Daxil ol" ikon-linki (/login). Heç bir sorğu getmir.
// • localStorage-da "mcc_logged_in" ipucu varsa (src/api/userSession.js): boş vaxtda bir dəfə
//   GET /api/auth/me; cavab gələnə qədər ümumi istifadəçi ikonu, sonra adın hərfi (avatar).
//   Avatar menyunu açır: ad/e-poçt, "Hesabım", (panel rolu üçün) "Admin paneli", "Çıxış".
// • Prerender HTML-də React yoxdur (createRoot) — ilk çəkiliş anonim/ipucu vəziyyətindədir.
// ═══════════════════════════════════════════════════════
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { pathFor } from '../seo/routes'
import { pickUi } from '../utils/uiText'
import { whenIdle } from '../utils/idle'
import { useAuthUser, refreshMe, logoutUser, initialOf, syncLinkedHere } from '../api/userSession'
import Icon from './Icon'

// "Bu cihazda məlumat qalsın?" — yalnız sinxronizasiya hesaba bağlı olanda (tənbəl chunk)
const LogoutDialog = lazy(() => import('./account/LogoutDialog'))
// Profil seçicisi (utils/profiles) — yalnız profillər açıqdırsa, menyu açılanda (tənbəl chunk)
const ProfileMenu = lazy(() => import('./account/ProfileMenu'))
// J7: avatarın həndəsi çərçivəsi (yol mərhələsi) — yalnız daxil olmuş istifadəçidə (tənbəl chunk)
const HeaderJourney = lazy(() => import('./account/HeaderJourney'))
const hasProfiles = () => { try { return Boolean(globalThis.localStorage?.getItem('mcc_profiles')) } catch { return false } }

const LABELS = {
  az: { signIn: 'Daxil ol', account: 'Hesabım', menu: 'Hesab menyusu', panel: 'Admin paneli', logout: 'Çıxış' },
  en: { signIn: 'Sign in', account: 'My account', menu: 'Account menu', panel: 'Admin panel', logout: 'Sign out' },
  ru: { signIn: 'Войти', account: 'Мой аккаунт', menu: 'Меню аккаунта', panel: 'Админ-панель', logout: 'Выйти' },
  tr: { signIn: 'Giriş yap', account: 'Hesap ayarları', menu: 'Hesap menüsü', panel: 'Yönetim paneli', logout: 'Çıkış yap' },
  ar: { signIn: 'دخول', account: 'حسابي', menu: 'قائمة الحساب', panel: 'لوحة الإدارة', logout: 'تسجيل الخروج' },
}

const PANEL_ROLES = new Set(['editor', 'admin', 'superadmin'])

/** İpucu varsa /me-ni boş vaxtda bir dəfə yoxla (bütün səhifələr üçün ortaq). */
let idleChecked = false
export function useLazyMe(status) {
  useEffect(() => {
    if (status !== 'unknown' || idleChecked) return
    idleChecked = true
    whenIdle().then(() => refreshMe()).catch(() => {})
  }, [status])
}

const isPlain = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

export default function HeaderAccount({ currentPage }) {
  const { lang, siteLang = lang } = useLang()
  const l = pickUi(LABELS, lang)
  const navigate = useNavigate()
  const { status, user } = useAuthUser()
  const [open, setOpen] = useState(false)
  const [askLogout, setAskLogout] = useState(false)
  const wrapRef = useRef(null)
  const btnRef = useRef(null)
  useLazyMe(status)

  useEffect(() => { setOpen(false) }, [currentPage])
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus() } }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const go = (key) => (e) => {
    if (!isPlain(e)) return
    e.preventDefault()
    setOpen(false)
    navigate(pathFor(key, siteLang))
  }

  const logoutDialog = askLogout && (
    <Suspense fallback={null}>
      <LogoutDialog onClose={() => setAskLogout(false)}
        onSignedOut={(wiped) => {
          setAskLogout(false)
          if (wiped) window.location.assign(pathFor('home', siteLang))   // silinmiş məlumatla açıq səhifə qalmasın
          else if (currentPage === 'account') navigate(pathFor('home', siteLang))
        }} />
    </Suspense>
  )

  // Anonim (və ya hələ yoxlanmamış ipucu) — /login və ya /account-a sadə keçid
  if (status !== 'user' || !user) {
    const key = status === 'unknown' ? 'account' : 'login'
    const label = status === 'unknown' ? l.account : l.signIn
    return (
      <div className="hdr-account-wrap">
        <a className="hdr-btn hdr-account" href={pathFor(key, siteLang)} onClick={go(key)} aria-label={label} title={label}
          aria-current={currentPage === key ? 'page' : undefined} data-testid="hdr-account">
          <Icon name="user" size={20} strokeWidth={2} />
        </a>
        {logoutDialog}
      </div>
    )
  }

  const onLogout = async () => {
    setOpen(false)
    if (syncLinkedHere()) { setAskLogout(true); return }
    try { await logoutUser() } catch { /* ipucu onsuz da silindi */ }
    if (currentPage === 'account') navigate(pathFor('home', siteLang))
  }

  return (
    <div className="hdr-account-wrap" ref={wrapRef}>
      <button ref={btnRef} type="button" className="hdr-btn hdr-account" onClick={() => setOpen(o => !o)}
        aria-label={`${l.menu}: ${user.displayName || user.email}`} title={l.menu}
        aria-expanded={open} aria-controls="hdr-account-menu" data-testid="hdr-account">
        {/* J7: yol mərhələsinin çərçivəsi + ildönümü / ad günü işarəsi (tənbəl chunk) */}
        <Suspense fallback={<span className="hdr-avatar" aria-hidden="true">{initialOf(user)}</span>}>
          <HeaderJourney user={user} lang={lang}><span className="hdr-avatar" aria-hidden="true">{initialOf(user)}</span></HeaderJourney>
        </Suspense>
      </button>
      {open && (
        <div className="hdr-account-menu" id="hdr-account-menu" role="group" aria-label={l.menu}>
          <div className="hdr-account-menu__who">
            {user.displayName && <strong><bdi>{user.displayName}</bdi></strong>}
            <span><bdi>{user.email}</bdi></span>
          </div>
          <a className="hdr-account-menu__item" href={pathFor('account', siteLang)} onClick={go('account')}>
            <Icon name="user" size={18} /> {l.account}
          </a>
          {hasProfiles() && (
            <Suspense fallback={null}>
              <ProfileMenu lang={lang} manageHref={`${pathFor('account', siteLang)}#profiles`} onManage={() => setOpen(false)} />
            </Suspense>
          )}
          {PANEL_ROLES.has(user.role) && (
            <a className="hdr-account-menu__item" href={pathFor('admin', siteLang)}>
              <Icon name="shield" size={18} /> {l.panel}
            </a>
          )}
          <button type="button" className="hdr-account-menu__item" onClick={onLogout}>
            <Icon name="logout" size={18} className="ui-flip-rtl" /> {l.logout}
          </button>
        </div>
      )}
      {logoutDialog}
    </div>
  )
}
