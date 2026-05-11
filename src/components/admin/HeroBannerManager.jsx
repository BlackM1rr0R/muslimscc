import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { getHeroBanner, saveHeroBanner, HERO_GRADIENTS } from '../../data/adminContent'

const LABELS = {
  az: { title:'Hero Banner', sub:'Ana səhifədə üstdə görünəcək xüsusi banner', active:'Aktivdir', titleField:'Başlıq', subtitle:'Alt başlıq', ctaText:'Düymə mətni', ctaLink:'Düymə linki', gradient:'Rəng sxemi', save:'Yadda saxla', saved:'Yadda saxlandı!', preview:'Önbaxış' },
  en: { title:'Hero Banner', sub:'Special banner on top of home page', active:'Active', titleField:'Title', subtitle:'Subtitle', ctaText:'Button text', ctaLink:'Button link', gradient:'Color scheme', save:'Save', saved:'Saved!', preview:'Preview' },
  ru: { title:'Hero Баннер', sub:'Особый баннер на главной', active:'Активен', titleField:'Заголовок', subtitle:'Подзаголовок', ctaText:'Текст кнопки', ctaLink:'Ссылка', gradient:'Цветовая схема', save:'Сохранить', saved:'Сохранено!', preview:'Предпросмотр' },
  ar: { title:'بانر رئيسي', sub:'بانر خاص في الصفحة الرئيسية', active:'نشط', titleField:'العنوان', subtitle:'العنوان الفرعي', ctaText:'نص الزر', ctaLink:'رابط الزر', gradient:'مخطط الألوان', save:'حفظ', saved:'تم الحفظ!', preview:'معاينة' },
  tr: { title:'Hero Banner', sub:'Ana sayfa üst banner', active:'Aktif', titleField:'Başlık', subtitle:'Alt başlık', ctaText:'Düğme metni', ctaLink:'Düğme bağlantısı', gradient:'Renk şeması', save:'Kaydet', saved:'Kaydedildi!', preview:'Önizleme' },
}

const LANGS = ['az','en','ru','ar','tr']

export default function HeroBannerManager() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [hero, setHero] = useState({
    active: false,
    title: {az:'',en:'',ru:'',ar:'',tr:''},
    subtitle: {az:'',en:'',ru:'',ar:'',tr:''},
    ctaText: {az:'',en:'',ru:'',ar:'',tr:''},
    ctaLink: '',
    gradient: 'green',
  })
  const [formLang, setFormLang] = useState(lang)
  const [saved, setSaved] = useState(false)

  useEffect(() => { getHeroBanner().then(h => setHero(h)) }, [])

  const handleSave = async () => {
    await saveHeroBanner(hero)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const updateText = (field, langCode, value) => {
    setHero({ ...hero, [field]: { ...hero[field], [langCode]: value } })
  }

  const selectedGradient = HERO_GRADIENTS.find(g => g.key === hero.gradient) || HERO_GRADIENTS[0]

  return (
    <div>
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge" style={{background:'linear-gradient(135deg,#06b6d4,#0891b2)'}}>🎨</div>
          <div className="admin-header-info"><h1>{l.title}</h1><p>{l.sub}</p></div>
        </div>
      </div>

      {/* Preview */}
      <div className="admin-section" style={{padding:0, overflow:'hidden'}}>
        <div style={{padding:16, borderBottom:'1px solid var(--border)'}}>
          <span style={{fontSize:11, fontWeight:800, letterSpacing:1, textTransform:'uppercase', color:'var(--text-muted)'}}>{l.preview}</span>
        </div>
        <div style={{
          background:`linear-gradient(135deg, ${selectedGradient.colors[0]}, ${selectedGradient.colors[1]}, ${selectedGradient.colors[2]})`,
          padding:'40px 24px',
          color:'#fff',
          textAlign:'center',
          opacity: hero.active ? 1 : 0.5,
        }}>
          <h2 style={{fontSize:28, fontWeight:800, margin:'0 0 8px', letterSpacing:-0.5}}>
            {hero.title[lang] || hero.title.en || (hero.active ? '(Boş)' : '(Deaktiv)')}
          </h2>
          <p style={{fontSize:15, opacity:0.9, margin:'0 0 16px'}}>
            {hero.subtitle[lang] || hero.subtitle.en || ''}
          </p>
          {(hero.ctaText[lang] || hero.ctaText.en) && (
            <button style={{background:'#fff', color:selectedGradient.colors[1], border:'none', padding:'10px 24px', borderRadius:999, fontWeight:800, fontSize:14}}>
              {hero.ctaText[lang] || hero.ctaText.en}
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon">⚙️</span>
          {l.title}
        </h2>

        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
          <input type="checkbox" id="hero-active" checked={hero.active} onChange={(e) => setHero({...hero, active:e.target.checked})} style={{width:20, height:20, accentColor:'var(--primary)'}} />
          <label htmlFor="hero-active" style={{fontSize:14, fontWeight:700, color:'var(--text-dim)', cursor:'pointer'}}>{l.active}</label>
        </div>

        <div className="admin-lang-tabs">
          {LANGS.map(L => (
            <button key={L} type="button" className={`admin-lang-tab ${formLang === L ? 'active' : ''}`} onClick={() => setFormLang(L)}>
              {L.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="admin-form">
          <div className="admin-input-group">
            <label className="admin-input-label">{l.titleField} ({formLang.toUpperCase()})</label>
            <input type="text" className="admin-input" value={hero.title[formLang]} onChange={(e) => updateText('title', formLang, e.target.value)} placeholder={l.titleField} />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.subtitle} ({formLang.toUpperCase()})</label>
            <input type="text" className="admin-input" value={hero.subtitle[formLang]} onChange={(e) => updateText('subtitle', formLang, e.target.value)} placeholder={l.subtitle} />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.ctaText} ({formLang.toUpperCase()})</label>
              <input type="text" className="admin-input" value={hero.ctaText[formLang]} onChange={(e) => updateText('ctaText', formLang, e.target.value)} placeholder={l.ctaText} />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.ctaLink}</label>
              <input type="text" className="admin-input" value={hero.ctaLink} onChange={(e) => setHero({...hero, ctaLink:e.target.value})} placeholder="quran, hadith, https://..." />
            </div>
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.gradient}</label>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:10}}>
              {HERO_GRADIENTS.map(g => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setHero({...hero, gradient:g.key})}
                  style={{
                    padding:0,
                    height:60,
                    borderRadius:10,
                    background:`linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]}, ${g.colors[2]})`,
                    border: hero.gradient === g.key ? '3px solid var(--primary)' : '2px solid transparent',
                    cursor:'pointer',
                    position:'relative',
                  }}
                >
                  {hero.gradient === g.key && (
                    <span style={{position:'absolute', top:4, right:6, background:'#fff', color:'var(--primary)', width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800}}>
                      ✓
                    </span>
                  )}
                  <span style={{position:'absolute', bottom:6, left:0, right:0, color:'#fff', fontSize:11, fontWeight:800, textShadow:'0 1px 2px rgba(0,0,0,0.3)'}}>
                    {g.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSave} className="admin-submit-btn" style={{background:'linear-gradient(135deg,#06b6d4,#0891b2)'}}>
            <span>💾</span> {saved ? '✅ ' + l.saved : l.save}
          </button>
        </div>
      </div>
    </div>
  )
}
