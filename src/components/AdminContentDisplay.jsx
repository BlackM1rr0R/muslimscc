import { useState, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { subscribeToAnnouncements, subscribeToDailyContent, ANNOUNCEMENT_TYPES } from '../data/adminContent'
// Admin mənbəni Azərbaycanca yazır ("Bəqərə 2:255", "Buxari 1") — tanınan adlar dilə çevrilir
import { localizeSource } from '../utils/sourceNames'
// Admin mətni cari dildə yoxdursa başqa dilə (ingiliscə daxil) düşmür — göstərilmir
import { pickLang } from '../utils/pickLang'

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
    <div style={{padding:'0 20px', marginTop:20, display:'flex', flexDirection:'column', gap:10}}>
      {visible.map(a => {
        const type = ANNOUNCEMENT_TYPES.find(t => t.key === a.type) || ANNOUNCEMENT_TYPES[0]
        return (
          <div key={a.id} style={{
            background: `linear-gradient(135deg, ${type.color}18, ${type.color}08)`,
            border: `1.5px solid ${type.color}40`,
            borderLeft: `5px solid ${type.color}`,
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            position: 'relative',
            animation: 'fadeUp .5s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <div style={{fontSize:28, flexShrink:0}}>{type.icon}</div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:15, fontWeight:800, color:'var(--text)', marginBottom:4, letterSpacing:-0.2}}>
                {pickLang(a.title, lang)}
              </div>
              {pickLang(a.message, lang, { warn: false }) && (
                <div style={{fontSize:13, color:'var(--text-dim)', lineHeight:1.5}}>
                  {pickLang(a.message, lang, { warn: false })}
                </div>
              )}
              {a.link && (
                <a href={a.link} target="_blank" rel="noopener noreferrer" style={{display:'inline-block', marginTop:6, fontSize:12, fontWeight:700, color:type.color}}>
                  {lang==='az'?'Daha çox →':lang==='ru'?'Подробнее →':lang==='ar'?'المزيد ←':lang==='tr'?'Daha fazla →':'Learn more →'}
                </a>
              )}
            </div>
            <button
              onClick={() => setClosed([...closed, a.id])}
              style={{
                background: 'rgba(0,0,0,0.06)',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                width: 28,
                height: 28,
                borderRadius: '50%',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >✕</button>
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
    az: { ayah:'Günün Ayəsi', dhikr:'Günün Zikri', quote:'Günün Sözü', target:'Hədəf' },
    en: { ayah:'Daily Ayah', dhikr:'Daily Dhikr', quote:'Daily Quote', target:'Target' },
    ru: { ayah:'Аят дня', dhikr:'Зикр дня', quote:'Цитата дня', target:'Цель' },
    ar: { ayah:'آية اليوم', dhikr:'ذكر اليوم', quote:'اقتباس اليوم', target:'الهدف' },
    tr: { ayah:'Günün Ayeti', dhikr:'Günün Zikri', quote:'Günün Sözü', target:'Hedef' },
  }
  const l = LABELS[lang] || LABELS.az

  return (
    <section className="section">
      <div className="section-inner">
        <h2 style={{fontSize:'clamp(24px,4vw,32px)', fontWeight:800, color:'var(--text)', margin:'0 0 20px', letterSpacing:-0.5}}>
          🌟 {lang==='az'?'Bugünkü Məzmun':lang==='ru'?'Контент дня':lang==='ar'?'محتوى اليوم':lang==='tr'?'Bugünün İçeriği':"Today's Content"}
        </h2>

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16}}>

          {content.hasAyah && (
            <div style={{background:'linear-gradient(135deg, #10b98112, #10b98103)', border:'1.5px solid #10b98140', borderRadius:'var(--radius-lg)', padding:24, overflow:'hidden'}}>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14}}>
                <span style={{fontSize:24}}>📖</span>
                <span style={{fontSize:11, fontWeight:800, color:'#10b981', textTransform:'uppercase', letterSpacing:1}}>{l.ayah}</span>
              </div>
              {content.ayah.ar && <div style={{fontSize:20, lineHeight:1.9, textAlign:'right', color:'var(--text)', marginBottom:10, fontFamily:'Amiri, serif'}}>{content.ayah.ar}</div>}
              {pickLang(content.ayah.text, lang) && <div style={{fontSize:14, color:'var(--text-dim)', lineHeight:1.6, marginBottom:10}}>{pickLang(content.ayah.text, lang)}</div>}
              {content.ayah.source && <div style={{fontSize:12, color:'#10b981', fontWeight:700}}>— <bdi>{localizeSource(content.ayah.source, lang)}</bdi></div>}
            </div>
          )}

          {content.hasDhikr && (
            <div style={{background:'linear-gradient(135deg, #06b6d412, #06b6d403)', border:'1.5px solid #06b6d440', borderRadius:'var(--radius-lg)', padding:24}}>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14}}>
                <span style={{fontSize:24}}>📿</span>
                <span style={{fontSize:11, fontWeight:800, color:'#06b6d4', textTransform:'uppercase', letterSpacing:1}}>{l.dhikr}</span>
              </div>
              {content.dhikr.ar && <div style={{fontSize:20, lineHeight:1.9, textAlign:'right', color:'var(--text)', marginBottom:10, fontFamily:'Amiri, serif'}}>{content.dhikr.ar}</div>}
              {content.dhikr.translit && <div style={{fontSize:13, fontStyle:'italic', color:'#0891b2', marginBottom:8}}>{content.dhikr.translit}</div>}
              {pickLang(content.dhikr.text, lang) && <div style={{fontSize:13, color:'var(--text-dim)', lineHeight:1.5, marginBottom:10}}>{pickLang(content.dhikr.text, lang)}</div>}
              {content.dhikr.count && (
                <div style={{display:'inline-block', background:'#06b6d418', color:'#06b6d4', padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:800}}>
                  🎯 {l.target}: ×{content.dhikr.count}
                </div>
              )}
            </div>
          )}

          {content.hasQuote && (
            <div style={{background:'linear-gradient(135deg, #a855f712, #a855f703)', border:'1.5px solid #a855f740', borderRadius:'var(--radius-lg)', padding:24}}>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14}}>
                <span style={{fontSize:24}}>💬</span>
                <span style={{fontSize:11, fontWeight:800, color:'#a855f7', textTransform:'uppercase', letterSpacing:1}}>{l.quote}</span>
              </div>
              {content.quote.ar && <div style={{fontSize:18, lineHeight:1.9, textAlign:'right', color:'var(--text)', marginBottom:10, fontFamily:'Amiri, serif'}}>{content.quote.ar}</div>}
              {pickLang(content.quote.text, lang) && <div style={{fontSize:14, color:'var(--text-dim)', lineHeight:1.6, marginBottom:10, fontStyle:'italic'}}>"{pickLang(content.quote.text, lang)}"</div>}
              {content.quote.source && <div style={{fontSize:12, color:'#a855f7', fontWeight:700}}>— <bdi>{localizeSource(content.quote.source, lang)}</bdi></div>}
            </div>
          )}

        </div>
      </div>
    </section>
  )
}
