import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { AdminHeader, SectionTitle, LangTabs, AdminToast, SAVE_FAILED } from './AdminUi'
import Icon from '../Icon'
import { getDailyContent, saveDailyContent } from '../../data/adminContent'

const LABELS = {
  az: { title:'Günün məzmunu', sub:'Hər gün ana səhifədə göstəriləcək məzmun', ayah:'Günün ayəsi', dhikr:'Günün zikri', quote:'Günün sitatı', arabic:'Ərəbcə', translit:'Transliterasiya', translation:'Tərcümə', source:'Mənbə', count:'Hədəf say', save:'Yadda saxla', saved:'Yadda saxlandı!', ayahSrcPh:'Şərh, 94:6', quoteSrcPh:'Həzrət Əli, İmam Şafii...' },
  en: { title:'Daily Content', sub:'Content shown on home page each day', ayah:'Daily Ayah', dhikr:'Daily Dhikr', quote:'Daily Quote', arabic:'Arabic', translit:'Transliteration', translation:'Translation', source:'Source', count:'Target count', save:'Save', saved:'Saved!', ayahSrcPh:'Ash-Sharh, 94:6', quoteSrcPh:'Ali ibn Abi Talib, Imam al-Shafi‘i...' },
  ru: { title:'Контент дня', sub:'Контент на главной странице каждый день', ayah:'Аят дня', dhikr:'Зикр дня', quote:'Цитата дня', arabic:'Арабский', translit:'Транслитерация', translation:'Перевод', source:'Источник', count:'Цель', save:'Сохранить', saved:'Сохранено!', ayahSrcPh:'Аш-Шарх, 94:6', quoteSrcPh:'Али ибн Абу Талиб, имам аш-Шафии...' },
  ar: { title:'محتوى اليوم', sub:'المحتوى المعروض كل يوم', ayah:'آية اليوم', dhikr:'ذكر اليوم', quote:'اقتباس اليوم', arabic:'العربية', translit:'النطق', translation:'الترجمة', source:'المصدر', count:'الهدف', save:'حفظ', saved:'تم الحفظ!', ayahSrcPh:'الشرح، 94:6', quoteSrcPh:'علي بن أبي طالب، الإمام الشافعي...' },
  tr: { title:'Günün İçeriği', sub:'Her gün ana sayfada gösterilecek içerik', ayah:'Günün Ayeti', dhikr:'Günün Zikri', quote:'Günün Sözü', arabic:'Arapça', translit:'Okunuş', translation:'Çeviri', source:'Kaynak', count:'Hedef sayı', save:'Kaydet', saved:'Kaydedildi!', ayahSrcPh:'İnşirah, 94:6', quoteSrcPh:'Hz. Ali, İmam Şâfiî...' },
}


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
    getDailyContent().then(c => c && setContent(c)).catch(() => { /* şəbəkə yoxdur — boş forma qalır */ })
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

  // Saxlama nəticəsi üzən bildirişdə (AdminToast) göstərilir; xəta da tutulur
  const [saveErr, setSaveErr] = useState(false)
  const handleSave = async () => {
    setSaveErr(false)
    try {
      await saveDailyContent(content)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveErr(true)
      setTimeout(() => setSaveErr(false), 4000)
    }
  }

  return (
    <div>
      <AdminHeader icon="sparkle" title={l.title} sub={l.sub} />

      {/* Language tabs */}
      <div className="admin-section admin-section--tight" data-reveal="fade">
        <LangTabs value={formLang} onChange={setFormLang} className="admin-lang-tabs--block" />
      </div>

      {/* Daily Ayah */}
      <div className="admin-section" data-reveal>
        <SectionTitle icon="quran">{l.ayah}</SectionTitle>

        <div className="admin-form">
          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-dailycontent-1">{l.arabic}</label>
            <textarea id="adm-dailycontent-1"
              className="admin-input admin-textarea admin-input--arabic"
              value={content.ayah.ar}
              onChange={(e) => updateField('ayah', 'ar', e.target.value)}
              placeholder="فَإِنَّ مَعَ الْعُسْرِ يُسْرًا..."
              dir="rtl"
            />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-dailycontent-2">{l.translation} ({formLang.toUpperCase()})</label>
            <textarea id="adm-dailycontent-2"
              className="admin-input admin-textarea"
              value={content.ayah.text[formLang]}
              onChange={(e) => updateText('ayah', formLang, e.target.value)}
              placeholder={l.translation}
            />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-dailycontent-3">{l.source}</label>
            <input id="adm-dailycontent-3"
              type="text"
              className="admin-input"
              value={content.ayah.source}
              onChange={(e) => updateField('ayah', 'source', e.target.value)}
              placeholder={l.ayahSrcPh}
            />
          </div>
        </div>
      </div>

      {/* Daily Dhikr */}
      <div className="admin-section" data-reveal>
        <SectionTitle icon="dhikr">{l.dhikr}</SectionTitle>

        <div className="admin-form">
          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-dailycontent-4">{l.arabic}</label>
            <input id="adm-dailycontent-4"
              type="text"
              className="admin-input admin-input--arabic"
              value={content.dhikr.ar}
              onChange={(e) => updateField('dhikr', 'ar', e.target.value)}
              placeholder="سُبْحَانَ اللَّهِ وَبِحَمْدِهِ"
              dir="rtl"
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-dailycontent-5">{l.translit}</label>
              <input id="adm-dailycontent-5"
                type="text"
                className="admin-input"
                value={content.dhikr.translit}
                onChange={(e) => updateField('dhikr', 'translit', e.target.value)}
                placeholder="SubhanAllahi wa bihamdihi"
              />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label" htmlFor="adm-dailycontent-6">{l.count}</label>
              <input id="adm-dailycontent-6"
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
            <label className="admin-input-label" htmlFor="adm-dailycontent-7">{l.translation} ({formLang.toUpperCase()})</label>
            <input id="adm-dailycontent-7"
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
      <div className="admin-section" data-reveal>
        <SectionTitle icon="quotes">{l.quote}</SectionTitle>

        <div className="admin-form">
          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-dailycontent-8">{l.arabic}</label>
            <textarea id="adm-dailycontent-8"
              className="admin-input admin-textarea admin-input--arabic"
              value={content.quote.ar}
              onChange={(e) => updateField('quote', 'ar', e.target.value)}
              placeholder="لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا..."
              dir="rtl"
            />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-dailycontent-9">{l.translation} ({formLang.toUpperCase()})</label>
            <textarea id="adm-dailycontent-9"
              className="admin-input admin-textarea"
              value={content.quote.text[formLang]}
              onChange={(e) => updateText('quote', formLang, e.target.value)}
              placeholder={l.translation}
            />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label" htmlFor="adm-dailycontent-10">{l.source}</label>
            <input id="adm-dailycontent-10"
              type="text"
              className="admin-input"
              value={content.quote.source}
              onChange={(e) => updateField('quote', 'source', e.target.value)}
              placeholder={l.quoteSrcPh}
            />
          </div>
        </div>
      </div>

      {/* Yapışqan saxla paneli */}
      <div className="admin-savebar">
        <button type="button" onClick={handleSave} className="admin-submit-btn">
          <Icon name="check" /> {saved ? l.saved : l.save}
        </button>
      </div>
      <AdminToast message={saved ? l.saved : saveErr ? SAVE_FAILED[lang] : ''} tone={saveErr ? 'bad' : 'ok'} />
    </div>
  )
}
