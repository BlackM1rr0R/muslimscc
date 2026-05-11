import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { getDailyContent, saveDailyContent } from '../../data/adminContent'

const LABELS = {
  az: { title:'Günün Məzmunu', sub:'Hər gün ana səhifədə göstəriləcək məzmun', ayah:'Günün Ayəsi', dhikr:'Günün Zikri', quote:'Günün Sitatı', arabic:'Ərəbcə', translit:'Transliterasiya', translation:'Tərcümə', source:'Mənbə', count:'Hədəf say', save:'Yadda saxla', saved:'Yadda saxlandı!' },
  en: { title:'Daily Content', sub:'Content shown on home page each day', ayah:'Daily Ayah', dhikr:'Daily Dhikr', quote:'Daily Quote', arabic:'Arabic', translit:'Transliteration', translation:'Translation', source:'Source', count:'Target count', save:'Save', saved:'Saved!' },
  ru: { title:'Контент дня', sub:'Контент на главной странице каждый день', ayah:'Аят дня', dhikr:'Зикр дня', quote:'Цитата дня', arabic:'Арабский', translit:'Транслитерация', translation:'Перевод', source:'Источник', count:'Цель', save:'Сохранить', saved:'Сохранено!' },
  ar: { title:'محتوى اليوم', sub:'المحتوى المعروض كل يوم', ayah:'آية اليوم', dhikr:'ذكر اليوم', quote:'اقتباس اليوم', arabic:'العربية', translit:'النطق', translation:'الترجمة', source:'المصدر', count:'الهدف', save:'حفظ', saved:'تم الحفظ!' },
  tr: { title:'Günün İçeriği', sub:'Her gün ana sayfada gösterilecek içerik', ayah:'Günün Ayeti', dhikr:'Günün Zikri', quote:'Günün Sözü', arabic:'Arapça', translit:'Okunuş', translation:'Çeviri', source:'Kaynak', count:'Hedef sayı', save:'Kaydet', saved:'Kaydedildi!' },
}

const LANGS = ['az','en','ru','ar','tr']

export default function DailyContentManager() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [content, setContent] = useState({
    ayah: { ar:'', text:{az:'',en:'',ru:'',ar:'',tr:''}, source:'' },
    dhikr: { ar:'', translit:'', text:{az:'',en:'',ru:'',ar:'',tr:''}, count:33 },
    quote: { ar:'', text:{az:'',en:'',ru:'',ar:'',tr:''}, source:'' },
  })
  const [formLang, setFormLang] = useState(lang)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getDailyContent().then(c => setContent(c))
  }, [])

  const updateField = (section, field, value) => {
    setContent({
      ...content,
      [section]: { ...content[section], [field]: value }
    })
  }

  const updateText = (section, langCode, value) => {
    setContent({
      ...content,
      [section]: {
        ...content[section],
        text: { ...content[section].text, [langCode]: value }
      }
    })
  }

  const handleSave = async () => {
    await saveDailyContent(content)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge" style={{background:'linear-gradient(135deg,#fbbf24,#d97706)'}}>🌟</div>
          <div className="admin-header-info">
            <h1>{l.title}</h1>
            <p>{l.sub}</p>
          </div>
        </div>
      </div>

      {/* Language tabs */}
      <div className="admin-section" style={{padding:14}}>
        <div className="admin-lang-tabs" style={{margin:0}}>
          {LANGS.map(L => (
            <button key={L} type="button" className={`admin-lang-tab ${formLang === L ? 'active' : ''}`} onClick={() => setFormLang(L)}>
              {L.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Ayah */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon" style={{background:'#10b98118'}}>📖</span>
          {l.ayah}
        </h2>

        <div className="admin-form">
          <div className="admin-input-group">
            <label className="admin-input-label">{l.arabic}</label>
            <textarea
              className="admin-input admin-textarea"
              value={content.ayah.ar}
              onChange={(e) => updateField('ayah', 'ar', e.target.value)}
              placeholder="فَإِنَّ مَعَ الْعُسْرِ يُسْرًا..."
              style={{textAlign:'right', fontSize:18, fontFamily:'Amiri, serif', lineHeight:1.8}}
              dir="rtl"
            />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.translation} ({formLang.toUpperCase()})</label>
            <textarea
              className="admin-input admin-textarea"
              value={content.ayah.text[formLang]}
              onChange={(e) => updateText('ayah', formLang, e.target.value)}
              placeholder={l.translation}
            />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.source}</label>
            <input
              type="text"
              className="admin-input"
              value={content.ayah.source}
              onChange={(e) => updateField('ayah', 'source', e.target.value)}
              placeholder="Şərh, 94:6"
            />
          </div>
        </div>
      </div>

      {/* Daily Dhikr */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon" style={{background:'#06b6d418'}}>📿</span>
          {l.dhikr}
        </h2>

        <div className="admin-form">
          <div className="admin-input-group">
            <label className="admin-input-label">{l.arabic}</label>
            <input
              type="text"
              className="admin-input"
              value={content.dhikr.ar}
              onChange={(e) => updateField('dhikr', 'ar', e.target.value)}
              placeholder="سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"
              style={{textAlign:'right', fontSize:18, fontFamily:'Amiri, serif'}}
              dir="rtl"
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.translit}</label>
              <input
                type="text"
                className="admin-input"
                value={content.dhikr.translit}
                onChange={(e) => updateField('dhikr', 'translit', e.target.value)}
                placeholder="SubhanAllahi wa bihamdihi"
              />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.count}</label>
              <input
                type="number"
                className="admin-input"
                value={content.dhikr.count}
                onChange={(e) => updateField('dhikr', 'count', parseInt(e.target.value) || 33)}
                min="1"
                max="1000"
              />
            </div>
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.translation} ({formLang.toUpperCase()})</label>
            <input
              type="text"
              className="admin-input"
              value={content.dhikr.text[formLang]}
              onChange={(e) => updateText('dhikr', formLang, e.target.value)}
              placeholder={l.translation}
            />
          </div>
        </div>
      </div>

      {/* Daily Quote */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon" style={{background:'#a855f718'}}>💬</span>
          {l.quote}
        </h2>

        <div className="admin-form">
          <div className="admin-input-group">
            <label className="admin-input-label">{l.arabic}</label>
            <textarea
              className="admin-input admin-textarea"
              value={content.quote.ar}
              onChange={(e) => updateField('quote', 'ar', e.target.value)}
              placeholder="لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا..."
              style={{textAlign:'right', fontSize:18, fontFamily:'Amiri, serif', lineHeight:1.8}}
              dir="rtl"
            />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.translation} ({formLang.toUpperCase()})</label>
            <textarea
              className="admin-input admin-textarea"
              value={content.quote.text[formLang]}
              onChange={(e) => updateText('quote', formLang, e.target.value)}
              placeholder={l.translation}
            />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.source}</label>
            <input
              type="text"
              className="admin-input"
              value={content.quote.source}
              onChange={(e) => updateField('quote', 'source', e.target.value)}
              placeholder="Hz. Əli, İmam Şafi..."
            />
          </div>
        </div>
      </div>

      {/* Save button (sticky) */}
      <div style={{position:'sticky', bottom:20, marginTop:20}}>
        <button onClick={handleSave} className="admin-submit-btn" style={{width:'100%', padding:'18px', fontSize:15, background:'linear-gradient(135deg,#fbbf24,#d97706)'}}>
          <span>💾</span> {saved ? '✅ ' + l.saved : l.save}
        </button>
      </div>
    </div>
  )
}
