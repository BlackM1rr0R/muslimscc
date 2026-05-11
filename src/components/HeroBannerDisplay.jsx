import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { subscribeToHero, HERO_GRADIENTS } from '../data/adminContent'

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
  const title = hero.title?.[lang] || hero.title?.en
  const subtitle = hero.subtitle?.[lang] || hero.subtitle?.en
  const ctaText = hero.ctaText?.[lang] || hero.ctaText?.en

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

  return (
    <section style={{
      background: `linear-gradient(135deg, ${gradient.colors[0]}, ${gradient.colors[1]}, ${gradient.colors[2]})`,
      padding: '60px 24px',
      color: '#fff',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* Dekorativ dairələr */}
      <div style={{
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        top: -150,
        right: -100,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        bottom: -100,
        left: -80,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto', zIndex: 2 }}>
        <h2 style={{
          fontSize: 'clamp(28px, 5vw, 48px)',
          fontWeight: 800,
          margin: '0 0 16px',
          letterSpacing: -0.8,
          lineHeight: 1.15,
          textShadow: '0 2px 12px rgba(0,0,0,0.18)',
        }}>
          {title}
        </h2>

        {subtitle && (
          <p style={{
            fontSize: 'clamp(15px, 2.5vw, 18px)',
            opacity: 0.95,
            margin: '0 0 28px',
            lineHeight: 1.6,
            maxWidth: 600,
            marginInline: 'auto',
          }}>
            {subtitle}
          </p>
        )}

        {ctaText && (
          <button
            onClick={handleCta}
            style={{
              background: '#fff',
              color: gradient.colors[1],
              border: 'none',
              padding: '14px 36px',
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              letterSpacing: 0.3,
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
              transition: 'all 0.25s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 38px rgba(0,0,0,0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)' }}
          >
            {ctaText} →
          </button>
        )}
      </div>
    </section>
  )
}
