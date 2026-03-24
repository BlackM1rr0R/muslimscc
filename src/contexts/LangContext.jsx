import { createContext, useContext, useState, useEffect } from 'react'

const LANGS = ['az','en','ru','ar','tr']

const LangCtx = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('muslim_cc_lang') || 'az'
  })

  const [dark, setDark] = useState(() => {
    return localStorage.getItem('muslim_cc_theme') === 'dark'
  })

  const setLang = (l) => {
    if (!LANGS.includes(l)) return
    setLangState(l)
    localStorage.setItem('muslim_cc_lang', l)
    document.documentElement.lang = l
    document.documentElement.dir  = l === 'ar' ? 'rtl' : 'ltr'
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
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr'
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
