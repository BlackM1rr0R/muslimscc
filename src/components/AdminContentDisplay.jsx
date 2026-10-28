import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { subscribeToAnnouncements, subscribeToDailyContent, ANNOUNCEMENT_TYPES } from '../data/adminContent'
// Admin mənbəni Azərbaycanca yazır ("Bəqərə 2:255", "Buxari 1") — tanınan adlar dilə çevrilir
import { localizeSource } from '../utils/sourceNames'
// Admin mətni cari dildə yoxdursa başqa dilə (ingiliscə daxil) düşmür — göstərilmir
import { pickLang } from '../utils/pickLang'
import Icon from './Icon'
import '../styles/AdminContentDisplay.css'

// Elan növü → ikon + ton (emoji və hex rənglərin yerinə)
const TYPE_STYLE = {
  info:     { icon: 'info',     tone: 'brand' },
  urgent:   { icon: 'alert',    tone: 'bad' },
  event:    { icon: 'calendar', tone: 'accent' },
  success:  { icon: 'star',     tone: 'ok' },
  reminder: { icon: 'bell',     tone: 'accent' },
}
const MORE = { az: 'Daha çox', en: 'Learn more', ru: 'Подробнее', ar: 'المزيد', tr: 'Devamı' }
const CLOSE = { az: 'Bağla', en: 'Close', ru: 'Закрыть', ar: 'إغلاق', tr: 'Kapat' }

// ═══ ANNOUNCEMENTS BANNER ═══
export function AnnouncementBanner() {
  const { lang } = useLang()
  const [items, setItems] = useState([])
  const [closed, setClosed] = useState([])

  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements((all) => {
      setItems(all.filter(a => a.active !== false))
    })
    return () => unsubscribe?.()
  }, [])

  // Başlığı cari dildə olmayan elan bu dildə göstərilmir
  const visible = items.filter(a => !closed.includes(a.id) && pickLang(a.title, lang))
  if (visible.length === 0) return null

  return (
    <div className="ui-container qm-ann-banners">
      {visible.map(a => {
        const type = ANNOUNCEMENT_TYPES.find(t => t.key === a.type) || ANNOUNCEMENT_TYPES[0]
        const look = TYPE_STYLE[type.key] || TYPE_STYLE.info
        const msg = pickLang(a.message, lang, { warn: false })
        const link = typeof a.link === 'string' && /^https?:\/\//i.test(a.link.trim()) ? a.link.trim() : ''
        return (
          <div key={a.id} className={`ui-card qm-ann-banner tone-${look.tone}`} data-reveal>
            <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={look.icon} /></span>
            <div className="qm-ann-banner__body">
              <div className="ui-card__title">{pickLang(a.title, lang)}</div>
              {msg && <div className="ui-card__text">{msg}</div>}
              {link && (
                <a className="ui-link" href={link} target="_blank" rel="noopener noreferrer">
                  {MORE[lang] || MORE.en}
                  <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
                </a>
              )}
            </div>
            <button
              type="button"
              className="ui-icon-btn"
              onClick={() => setClosed([...closed, a.id])}
              aria-label={CLOSE[lang] || CLOSE.en}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ═══ DAILY CONTENT DISPLAY ═══
export function DailyContentDisplay() {
  const { lang } = useLang()
  const [content, setContent] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToDailyContent((c) => {
      if (!c) { setContent(null); return }
      // Ərəbcə orijinal hər dildə göstərilir; tərcümə yalnız cari dildə
      const hasAyah = c.ayah?.ar || pickLang(c.ayah?.text, lang)
      const hasDhikr = c.dhikr?.ar || pickLang(c.dhikr?.text, lang)
      const hasQuote = c.quote?.ar || pickLang(c.quote?.text, lang)
      if (hasAyah || hasDhikr || hasQuote) {
        setContent({ ...c, hasAyah, hasDhikr, hasQuote })
      } else {
        setContent(null)
      }
    })
    return () => unsubscribe?.()
  }, [lang])

  if (!content) return null

  const LABELS = {
    az: { ayah:'Günün ayəsi', dhikr:'Günün zikri', quote:'Günün sözü', target:'Hədəf' },
    en: { ayah:'Daily Ayah', dhikr:'Daily Dhikr', quote:'Daily Quote', target:'Target' },
    ru: { ayah:'Аят дня', dhikr:'Зикр дня', quote:'Цитата дня', target:'Цель' },
    ar: { ayah:'آية اليوم', dhikr:'ذكر اليوم', quote:'اقتباس اليوم', target:'الهدف' },
    tr: { ayah:'Günün Ayeti', dhikr:'Günün Zikri', quote:'Günün Sözü', target:'Hedef' },
  }
  const l = LABELS[lang] || LABELS.az

  const HEAD = {
    az: { eyebrow: 'Bu gün', title: 'Bugünkü məzmun' },
    en: { eyebrow: 'Today', title: "Today's content" },
    ru: { eyebrow: 'Сегодня', title: 'Контент дня' },
    ar: { eyebrow: 'اليوم', title: 'محتوى اليوم' },
    tr: { eyebrow: 'Bugün', title: 'Bugünün içeriği' },
  }
  const h = HEAD[lang] || HEAD.az

  return (
    <section className="ui-section ui-section--tight qm-daily">
      <div className="ui-container">
        <div className="ui-section-head" data-reveal>
          <span className="ui-eyebrow">{h.eyebrow}</span>
          <h2 className="ui-title">{h.title}</h2>
        </div>

        <div className="ui-grid" style={{ '--ui-grid-min': '280px' }} data-reveal="stagger">
          {content.hasAyah && (
            <article className="ui-card qm-daily-card">
              <div className="ui-card__head">
                <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name="quran" /></span>
                <span className="qm-daily-card__label">{l.ayah}</span>
              </div>
              <figure className="ui-quote">
                <blockquote>
                  {content.ayah.ar && <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{content.ayah.ar}</p>}
                  {pickLang(content.ayah.text, lang) && <p className="ui-quote__text">{pickLang(content.ayah.text, lang)}</p>}
                </blockquote>
                {content.ayah.source && <figcaption className="ui-quote__src">— <bdi>{localizeSource(content.ayah.source, lang)}</bdi></figcaption>}
              </figure>
            </article>
          )}

          {content.hasDhikr && (
            <article className="ui-card qm-daily-card">
              <div className="ui-card__head">
                <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name="dhikr" /></span>
                <span className="qm-daily-card__label">{l.dhikr}</span>
              </div>
              <figure className="ui-quote">
                <blockquote>
                  {content.dhikr.ar && <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{content.dhikr.ar}</p>}
                  {content.dhikr.translit && <p className="qm-daily-card__translit">{content.dhikr.translit}</p>}
                  {pickLang(content.dhikr.text, lang) && <p className="ui-quote__text">{pickLang(content.dhikr.text, lang)}</p>}
                </blockquote>
              </figure>
              {content.dhikr.count && (
                <span className="ui-badge ui-badge--accent qm-daily-card__count">
                  <Icon name="target" size={14} />
                  {l.target}: <span className="ui-num">×{content.dhikr.count}</span>
                </span>
              )}
            </article>
          )}

          {content.hasQuote && (
            <article className="ui-card qm-daily-card">
              <div className="ui-card__head">
                <span className="ui-icon-tile ui-icon-tile--sm ui-icon-tile--accent" aria-hidden="true"><Icon name="quotes" /></span>
                <span className="qm-daily-card__label">{l.quote}</span>
              </div>
              <figure className="ui-quote">
                <blockquote>
                  {content.quote.ar && <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{content.quote.ar}</p>}
                  {pickLang(content.quote.text, lang) && <p className="ui-quote__text">{pickLang(content.quote.text, lang)}</p>}
                </blockquote>
                {content.quote.source && <figcaption className="ui-quote__src">— <bdi>{localizeSource(content.quote.source, lang)}</bdi></figcaption>}
              </figure>
            </article>
          )}
        </div>
      </div>
    </section>
  )
}
