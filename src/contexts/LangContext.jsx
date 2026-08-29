import { createContext, useContext, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LANGS, DEFAULT_LANG, parsePath, pathFor } from '../seo/routes'

const LangCtx = createContext(null)

export function LangProvider({ children }) {
  const location = useLocation()
  const navigate = useNavigate()

  // Dil artıq URL-dən gəlir (/ru/quran → 'ru'), localStorage-dan yox.
  // Səbəb: Google hər dil variantını ayrıca URL kimi indeksləməlidir —
  // localStorage-a bağlı dil bütün dilləri eyni URL-də gizlədirdi.
  const { lang, key } = parsePath(location.pathname)

  const [dark, setDark] = useState(() => {
    return localStorage.getItem('muslim_cc_theme') === 'dark'
  })

  /** Dili dəyiş = eyni səhifənin başqa dildəki URL-inə keç. */
  const setLang = (l) => {
    if (!LANGS.includes(l)) return
    localStorage.setItem('muslim_cc_lang', l) // növbəti gəlişdə tərcih kimi
    navigate(pathFor(key, l))
  }

  const toggleDark = () => {
    setDark(prev => {
      const next = !prev
      localStorage.setItem('muslim_cc_theme', next ? 'dark' : 'light')
      document.documentElement.setAttribute('data-theme', next ? 'dark' : '')
      return next
    })
  }

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [dark])

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
    const saved = localStorage.getItem('muslim_cc_lang')
    if (!saved || saved === DEFAULT_LANG || !LANGS.includes(saved)) return
    const { lang, key } = parsePath(location.pathname)
    if (lang !== DEFAULT_LANG) return
    if (location.pathname !== pathFor(key, DEFAULT_LANG)) return
    navigate(pathFor(key, saved), { replace: true })
    // Yalnız bir dəfə — sonrakı naviqasiyalarda URL hakimdir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
