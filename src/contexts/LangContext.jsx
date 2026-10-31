import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LANGS, DEFAULT_LANG, parsePath, pathFor } from '../seo/routes'

const LangCtx = createContext(null)

// ── Tema ──────────────────────────────────────────────
// Qayda (sahibin qərarı): istifadəçi ay/günəş düyməsi ilə özü seçməyibsə,
// sayt telefonun/sistemin rejimini izləyir (ilk gələn, telefonu qaranlıq
// rejimdə olan ziyarətçi qaranlıq saytı görür) və sistem dəyişəndə canlı
// dəyişir. Düyməyə basılan andan saxlanmış seçim ('dark' | 'light') qalib gəlir.
// index.html-in <head>-indəki kiçik skript EYNİ qaydanı React yüklənməmiş
// tətbiq edir (açıq temanın bir anlıq yanıb-sönməsi olmasın) — biri dəyişsə,
// o biri də dəyişməlidir.
const THEME_KEY = 'muslim_cc_theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Saxlanmış seçim: 'dark' | 'light' | null (seçilməyib və ya yaddaş bağlıdır). */
function readStoredTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch { /* yaddaş bağlıdır */ return null }
}

/** Sistemin qaranlıq rejim sorğusu (dəstəklənmirsə null). */
function darkQuery() {
  try { return window.matchMedia ? window.matchMedia(DARK_QUERY) : null } catch { return null }
}

/** Saytın effektiv teması: saxlanmış seçim, yoxdursa sistemin rejimi. */
export function resolveSiteDark() {
  const stored = readStoredTheme()
  if (stored) return stored === 'dark'
  return Boolean(darkQuery()?.matches)
}

export function LangProvider({ children }) {
  const location = useLocation()
  const navigate = useNavigate()

  // Dil artıq URL-dən gəlir (/ru/quran → 'ru'), localStorage-dan yox.
  // Səbəb: Google hər dil variantını ayrıca URL kimi indeksləməlidir —
  // localStorage-a bağlı dil bütün dilləri eyni URL-də gizlədirdi.
  const { lang, key, param } = parsePath(location.pathname)

  // Yaddaş bağlı ola bilər (brauzer sayt məlumatını bloklayır) — o halda
  // localStorage xəta atır; kök provayder çökməsin deyə hər müraciət qorunur.
  const [dark, setDark] = useState(resolveSiteDark)
  // Bu sessiyada düyməyə basılıbmı — yaddaş bağlı olsa belə seçim sistemə uduzmasın
  const userChoseRef = useRef(false)
  // MutationObserver-in görməsi üçün cari tema (bax aşağıda)
  const darkRef = useRef(dark)

  /** Dili dəyiş = eyni səhifənin (detal səhifəsində — eyni surənin/adın/səhabənin) başqa dildəki URL-inə keç. */
  const setLang = (l) => {
    if (!LANGS.includes(l)) return
    try { localStorage.setItem('muslim_cc_lang', l) } catch { /* yaddaş bağlıdır */ } // növbəti gəlişdə tərcih kimi
    navigate(pathFor(key, l, param))
    // Push açıqdırsa, serverdəki abunəlik də yeni dilə keçsin — azan
    // bildirişi istifadəçinin indiki dilində gəlsin. Abunəlik yoxdursa
    // push modulu ümumiyyətlə yüklənmir (açarlar: src/api/push.js)
    let hasToken = false
    try { hasToken = Boolean(localStorage.getItem('muslim_cc_push_endpoint') || localStorage.getItem('muslim_cc_fcm_token')) } catch { /* yaddaş bağlıdır */ }
    if (hasToken) {
      import('../api/push')
        .then(m => m.updateTokenLocation?.())
        .catch(() => { /* şəbəkə yoxdur — növbəti yazılışda yenilənəcək */ })
    }
  }

  const toggleDark = () => {
    userChoseRef.current = true
    setDark(prev => {
      const next = !prev
      try { localStorage.setItem(THEME_KEY, next ? 'dark' : 'light') } catch { /* yaddaş bağlıdır */ }
      document.documentElement.setAttribute('data-theme', next ? 'dark' : '')
      return next
    })
  }

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  useEffect(() => {
    darkRef.current = dark
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    // Brauzer zolağının rəngi başlıqla eyni olsun — səhifə fonu (--surface-0):
    // işıqlı #f7f5ef (fil sümüyü), qaranlıq #0a1016. index.html skripti ilə EYNİ.
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a1016' : '#f7f5ef')
  }, [dark])

  // Sistem rejimi canlı dəyişəndə (telefon axşam avtomatik qaranlığa keçir)
  // izlə — amma yalnız istifadəçi hələ özü seçməyibsə. Seçimi hər dəfə
  // yaddaşdan oxuyuruq: başqa vərəqdə edilən seçim də nəzərə alınır.
  useEffect(() => {
    const mq = darkQuery()
    if (!mq) return undefined
    const onChange = (e) => {
      if (userChoseRef.current || readStoredTheme()) return
      setDark(e.matches)
    }
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else mq.addListener?.(onChange) // köhnə Safari (<14)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange)
      else mq.removeListener?.(onChange)
    }
  }, [])

  // Əlçatanlıq panelinin "Avto" teması data-theme-i yalnız saxlanmış seçimə
  // baxaraq qoyur/silir — sistemdən gələn qaranlığı bilmir və hər hansı ayar
  // dəyişəndə atributu silirdi (sayt açığa keçir, düymə isə "qaranlıq" qalırdı).
  // Atributun silinməsi "saytın öz seçimi qalsın" deməkdir: sayt qaranlıqdırsa,
  // geri qoyuruq. Panelin açıq "light"/"sepia" seçimlərinə toxunulmur.
  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return undefined
    const root = document.documentElement
    const mo = new MutationObserver(() => {
      if (darkRef.current && !root.hasAttribute('data-theme')) root.setAttribute('data-theme', 'dark')
    })
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [])

  return (
    <LangCtx.Provider value={{ lang, setLang, dark, toggleDark }}>
      {children}
    </LangCtx.Provider>
  )
}

export const useLang = () => useContext(LangCtx)

/**
 * İlk gəlişdə saxlanmış dil tərcihini tətbiq et.
 * Yalnız prefiksiz kök URL-də işləyir ki, paylaşılan /en/quran kimi
 * linklər istifadəçinin köhnə tərcihi ilə oğurlanmasın.
 */
export function useStoredLangRedirect() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    let saved = null
    try { saved = localStorage.getItem('muslim_cc_lang') } catch { /* yaddaş bağlıdır */ }
    if (!saved || saved === DEFAULT_LANG || !LANGS.includes(saved)) return
    const { lang, key, param } = parsePath(location.pathname)
    if (lang !== DEFAULT_LANG) return
    if (location.pathname !== pathFor(key, DEFAULT_LANG, param)) return
    navigate(pathFor(key, saved, param), { replace: true })
    // Yalnız bir dəfə — sonrakı naviqasiyalarda URL hakimdir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
