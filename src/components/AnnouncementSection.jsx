import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { subscribeToAnnouncements, ANNOUNCEMENT_TYPES } from '../data/adminContent'
import Icon from './Icon'
import '../styles/AnnouncementToast.css'

// v2: emoji + göy qurşağı rəngləri əvəzinə xətti ikon + palitra tokeni.
// Kartlar .ui-card, şəbəkə növbə ilə görünür (data-reveal="stagger").
const TYPE_STYLE = {
  info:     { icon: 'info',     tone: 'brand' },
  urgent:   { icon: 'alert',    tone: 'bad' },
  event:    { icon: 'calendar', tone: 'accent' },
  success:  { icon: 'star',     tone: 'ok' },
  reminder: { icon: 'bell',     tone: 'accent' },
}

const LABELS = {
  az: { eyebrow:'Məsciddən', title:'Elanlar', sub:'Ən son xəbərlər və yeniliklər', count:'elan', readMore:'Daha çox', noItems:'Hələ elan yoxdur' },
  en: { eyebrow:'From the mosque', title:'Announcements', sub:'Latest news and updates', count:'announcements', readMore:'Read more', noItems:'No announcements' },
  ru: { eyebrow:'Из мечети', title:'Объявления', sub:'Последние новости', count:'объявлений', readMore:'Подробнее', noItems:'Нет объявлений' },
  ar: { eyebrow:'من المسجد', title:'الإعلانات', sub:'آخر الأخبار والتحديثات', count:'إعلان', readMore:'المزيد', noItems:'لا توجد إعلانات' },
  tr: { eyebrow:'Camiden', title:'Duyurular', sub:'Son haberler ve güncellemeler', count:'duyuru', readMore:'Devamı', noItems:'Duyuru yok' },
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  try {
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return d.toLocaleDateString()
  } catch { return '' }
}

export default function AnnouncementSection() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az
  const [items, setItems] = useState([])

  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements((all) => {
      setItems(all.filter(a => a.active !== false))
    })
    return () => unsubscribe?.()
  }, [])

  // Yalnız cari dildə başlığı və ya mətni olan elanlar (dil qaydası —
  // /announcements ilə eyni: başqa dilin mətni göstərilmir)
  const pick = (v) => (typeof v === 'string' ? v : (v && typeof v[lang] === 'string' ? v[lang] : ''))
  const shown = items.filter(a => pick(a.title) || pick(a.message))
  if (shown.length === 0) return null

  return (
    <section className="ui-section ui-section--tight announcement-section">
      <div className="ui-container">
        <div className="ui-section-head ui-section-head--row" data-reveal>
          <div className="ui-stack" style={{ '--ui-stack-gap': '8px' }}>
            <span className="ui-eyebrow">{l.eyebrow}</span>
            <h2 className="ui-title">{l.title}</h2>
            <p className="ui-lead announcement-section-sub">{l.sub}</p>
          </div>
          <span className="ui-badge ui-badge--brand announcement-section-count">
            <span className="ui-num">{shown.length}</span> {l.count}
          </span>
        </div>

        <div className="ui-grid announcement-grid" style={{ '--ui-grid-min': '300px' }} data-reveal="stagger">
          {shown.map(a => {
            const type = ANNOUNCEMENT_TYPES.find(t => t.key === a.type) || ANNOUNCEMENT_TYPES[0]
            const look = TYPE_STYLE[type.key] || TYPE_STYLE.info
            // Yalnız http(s) keçidləri — "javascript:" və s. açılmasın
            const link = typeof a.link === 'string' && /^https?:\/\//i.test(a.link.trim()) ? a.link.trim() : ''
            const Tag = link ? 'a' : 'article'
            const linkProps = link ? { href: link, target: '_blank', rel: 'noopener noreferrer' } : {}
            return (
              <Tag
                key={a.id}
                className={`ui-card announcement-card tone-${look.tone}${link ? ' ui-card--interactive' : ''}`}
                {...linkProps}
              >
                <div className="ui-card__head">
                  <span className={`ui-icon-tile ui-icon-tile--sm announcement-card-icon${look.tone === 'accent' ? ' ui-icon-tile--accent' : ''}`} aria-hidden="true">
                    <Icon name={look.icon} />
                  </span>
                  <span className="announcement-card-type">{type.label[lang] || type.label.en}</span>
                </div>

                <h3 className="ui-card__title announcement-card-title">{pick(a.title)}</h3>

                {pick(a.message) && (
                  <p className="ui-card__text announcement-card-message">{pick(a.message)}</p>
                )}

                {(link || a.createdAt) && (
                  <div className="ui-card__foot">
                    {a.createdAt ? <span className="announcement-card-date ui-num">{formatDate(a.createdAt)}</span> : <span />}
                    {link && (
                      <span className="ui-link">
                        {l.readMore}
                        <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
                      </span>
                    )}
                  </div>
                )}
              </Tag>
            )
          })}
        </div>
      </div>
    </section>
  )
}
