import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { subscribeToAnnouncements, ANNOUNCEMENT_TYPES } from '../data/adminContent'
import '../styles/AnnouncementToast.css'

const LABELS = {
  az: { title:'Elanlar', sub:'Ən son xəbərlər və yeniliklər', count:'elan', readMore:'Daha çox', noItems:'Hələ elan yoxdur' },
  en: { title:'Announcements', sub:'Latest news and updates', count:'announcements', readMore:'Read more', noItems:'No announcements' },
  ru: { title:'Объявления', sub:'Последние новости', count:'объявлений', readMore:'Подробнее', noItems:'Нет объявлений' },
  ar: { title:'الإعلانات', sub:'آخر الأخبار والتحديثات', count:'إعلان', readMore:'المزيد', noItems:'لا توجد إعلانات' },
  tr: { title:'Duyurular', sub:'Son haberler ve güncellemeler', count:'duyuru', readMore:'Devamı', noItems:'Duyuru yok' },
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

  if (items.length === 0) return null

  const handleClick = (a) => {
    if (a.link) window.open(a.link, '_blank', 'noopener')
  }

  return (
    <section className="announcement-section">
      <div className="announcement-section-inner">
        <div className="announcement-section-header">
          <div>
            <h2 className="announcement-section-title">
              📣 {l.title}
            </h2>
            <p className="announcement-section-sub">{l.sub}</p>
          </div>
          <span className="announcement-section-count">
            {items.length} {l.count}
          </span>
        </div>

        <div className="announcement-grid">
          {items.map(a => {
            const type = ANNOUNCEMENT_TYPES.find(t => t.key === a.type) || ANNOUNCEMENT_TYPES[0]
            return (
              <article
                key={a.id}
                className={`announcement-card ${a.link ? 'has-link' : ''} anim-fadeUp`}
                style={{
                  '--accent': type.color,
                  background: `linear-gradient(135deg, ${type.color}08, var(--bg-card))`,
                  borderColor: type.color + '40',
                }}
                onClick={() => handleClick(a)}
              >
                <div style={{ position:'absolute', top:0, left:0, right:0, height:5, background: type.color }} />

                <div className="announcement-card-header">
                  <div
                    className="announcement-card-icon"
                    style={{ background: type.color + '20', color: type.color }}
                  >
                    {type.icon}
                  </div>
                  <span
                    className="announcement-card-type"
                    style={{ background: type.color + '20', color: type.color }}
                  >
                    {type.label[lang] || type.label.en}
                  </span>
                </div>

                <h3 className="announcement-card-title">
                  {a.title?.[lang] || a.title?.en}
                </h3>

                {(a.message?.[lang] || a.message?.en) && (
                  <p className="announcement-card-message">
                    {a.message[lang] || a.message.en}
                  </p>
                )}

                {a.link && (
                  <span
                    className="announcement-card-link"
                    style={{ color: type.color }}
                  >
                    {l.readMore} →
                  </span>
                )}

                {a.createdAt && (
                  <div className="announcement-card-date">
                    {formatDate(a.createdAt)}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
