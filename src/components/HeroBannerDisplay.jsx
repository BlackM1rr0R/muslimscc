import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { subscribeToHero, HERO_GRADIENTS } from '../data/adminContent'
import Icon from './Icon'
import '../styles/AdminContentDisplay.css'
// Admin mətni cari dildə yoxdursa başqa dilə düşmür — lövhə bu dildə göstərilmir
import { pickLang } from '../utils/pickLang'

// v2: adminin seçdiyi "göy qurşağı" qradiyentləri saytın hero ailələrinə
// bağlanır (heroes.css ilə eyni tonlar) — lövhə həmişə palitraya uyğundur
const FAMILY = {
  green: 'emerald', teal: 'teal', ocean: 'teal', dark: 'night', purple: 'night',
  gold: 'bronze', sunset: 'umber', rose: 'umber',
}

export default function HeroBannerDisplay({ setPage }) {
  const { lang } = useLang()
  const [hero, setHero] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToHero((data) => {
      if (data?.active) setHero(data)
      else setHero(null)
    })
    return () => unsubscribe?.()
  }, [])

  if (!hero) return null

  const gradient = HERO_GRADIENTS.find(g => g.key === hero.gradient) || HERO_GRADIENTS[0]
  const title = pickLang(hero.title, lang)
  const subtitle = pickLang(hero.subtitle, lang, { warn: false })
  const ctaText = pickLang(hero.ctaText, lang, { warn: false })

  const handleCta = () => {
    if (!hero.ctaLink) return
    // Daxili route (məs. 'quran', 'hadith')
    if (!hero.ctaLink.startsWith('http')) {
      setPage?.(hero.ctaLink)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.open(hero.ctaLink, '_blank', 'noopener')
    }
  }

  if (!title) return null

  const family = FAMILY[gradient.key] || 'emerald'

  return (
    <section className="ui-section ui-section--tight qm-banner-section">
      <div className="ui-container">
        <div className={`qm-banner qm-banner--${family}`} data-reveal="zoom">
          <div className="ui-pattern qm-banner__pattern" aria-hidden="true" />
          <span className="ui-ornament qm-banner__ornament" aria-hidden="true"><span className="ui-ornament__star" /></span>
          <h2 className="qm-banner__title">{title}</h2>
          {subtitle && <p className="qm-banner__text">{subtitle}</p>}
          {ctaText && (
            <button type="button" className="ui-btn ui-btn--inverse ui-btn--lg qm-banner__cta" onClick={handleCta}>
              {ctaText}
              <Icon name="arrow" size={18} className="ui-btn__icon ui-btn__icon--end ui-flip-rtl" />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
