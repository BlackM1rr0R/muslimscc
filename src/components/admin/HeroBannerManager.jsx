import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { AdminHeader, SectionTitle, LangTabs, AdminToast, SAVE_FAILED } from './AdminUi'
import Icon from '../Icon'
import { getHeroBanner, saveHeroBanner, HERO_GRADIENTS } from '../../data/adminContent'
import { pickLang } from '../../utils/pickLang'

// Admin siyahısında əskik dil yer tutucu ilə göstərilir — konsol xəbərdarlığı lazım deyil
const NOWARN = { warn: false }

const LABELS = {
  az: { title:'Ana səhifə lövhəsi', sub:'Ana səhifənin yuxarısında görünəcək xüsusi lövhə', empty:'(Boş)', inactive:'(Deaktiv)', noText:'(bu dildə mətn yoxdur)', active:'Aktivdir', titleField:'Başlıq', subtitle:'Alt başlıq', ctaText:'Düymə mətni', ctaLink:'Düymə linki', gradient:'Rəng sxemi', save:'Yadda saxla', saved:'Yadda saxlandı!', preview:'Önbaxış' },
  en: { title:'Hero banner', sub:'Special banner at the top of the home page', empty:'(Empty)', inactive:'(Inactive)', noText:'(no text in this language)', active:'Active', titleField:'Title', subtitle:'Subtitle', ctaText:'Button text', ctaLink:'Button link', gradient:'Color scheme', save:'Save', saved:'Saved!', preview:'Preview' },
  ru: { title:'Главный баннер', sub:'Особый баннер вверху главной страницы', empty:'(Пусто)', inactive:'(Неактивен)', noText:'(нет текста на этом языке)', active:'Активен', titleField:'Заголовок', subtitle:'Подзаголовок', ctaText:'Текст кнопки', ctaLink:'Ссылка', gradient:'Цветовая схема', save:'Сохранить', saved:'Сохранено!', preview:'Предпросмотр' },
  ar: { title:'بانر رئيسي', sub:'بانر خاص في أعلى الصفحة الرئيسية', empty:'(فارغ)', inactive:'(غير نشط)', noText:'(لا يوجد نص بهذه اللغة)', active:'نشط', titleField:'العنوان', subtitle:'العنوان الفرعي', ctaText:'نص الزر', ctaLink:'رابط الزر', gradient:'مخطط الألوان', save:'حفظ', saved:'تم الحفظ!', preview:'معاينة' },
  tr: { title:'Ana afiş', sub:'Ana sayfanın üstünde görünecek özel afiş', empty:'(Boş)', inactive:'(Pasif)', noText:'(bu dilde metin yok)', active:'Aktif', titleField:'Başlık', subtitle:'Alt başlık', ctaText:'Düğme metni', ctaLink:'Düğme bağlantısı', gradient:'Renk şeması', save:'Kaydet', saved:'Kaydedildi!', preview:'Önizleme' },
}


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

  useEffect(() => { getHeroBanner().then(h => h && setHero(h)).catch(() => { /* şəbəkə yoxdur */ }) }, [])

  // Saxlama nəticəsi üzən bildirişdə (AdminToast); xəta da tutulur
  const [saveErr, setSaveErr] = useState(false)
  const handleSave = async () => {
    setSaveErr(false)
    try {
      await saveHeroBanner(hero)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveErr(true)
      setTimeout(() => setSaveErr(false), 4000)
    }
  }

  const updateText = (field, langCode, value) => {
    setHero({ ...hero, [field]: { ...hero[field], [langCode]: value } })
  }

  const selectedGradient = HERO_GRADIENTS.find(g => g.key === hero.gradient) || HERO_GRADIENTS[0]
  const heroTitle = pickLang(hero.title, lang, NOWARN)
  // Başqa dildə başlıq varsa "boş" deyil — bu dildə mətn yoxdur
  const filled = Object.values(hero.title || {}).some(v => typeof v === 'string' && v.trim())

  return (
    <div>
      <AdminHeader icon="palette" title={l.title} sub={l.sub} />

      {/* Önbaxış — rənglər admin seçdiyi qradiyentdir (məlumat), sayt tokeni deyil */}
      <div className="admin-section admin-section--flush" data-reveal="scale">
        <div className="admin-preview-label">{l.preview}</div>
        <div
          className="admin-hero-preview"
          style={{
            background:`linear-gradient(135deg, ${selectedGradient.colors[0]}, ${selectedGradient.colors[1]}, ${selectedGradient.colors[2]})`,
            opacity: hero.active ? 1 : 0.5,
          }}
        >
          <h2>
            {/* Önbaxış yalnız cari dildə — başqa dilin mətni göstərilmir */}
            {heroTitle || (!hero.active ? l.inactive : filled ? l.noText : l.empty)}
          </h2>
          {pickLang(hero.subtitle, lang, NOWARN) && <p>{pickLang(hero.subtitle, lang, NOWARN)}</p>}
          {pickLang(hero.ctaText, lang, NOWARN) && (
            <span className="admin-hero-preview-cta" style={{ color: selectedGradient.colors[1] }}>
              {pickLang(hero.ctaText, lang, NOWARN)}
            </span>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="admin-section" data-reveal>
        <SectionTitle icon="image">{l.title}</SectionTitle>

        <label className="admin-check" htmlFor="hero-active">
          <input type="checkbox" id="hero-active" checked={hero.active} onChange={(e) => setHero({...hero, active:e.target.checked})} />
          {l.active}
        </label>

        <LangTabs value={formLang} onChange={setFormLang} />

        <div className="admin-form">
          <div className="admin-input-group">
            <label className="admin-input-label">{l.titleField} ({formLang.toUpperCase()})</label>
            <input type="text" className="admin-input" value={hero.title?.[formLang] || ''} onChange={(e) => updateText('title', formLang, e.target.value)} placeholder={l.titleField} />
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.subtitle} ({formLang.toUpperCase()})</label>
            <input type="text" className="admin-input" value={hero.subtitle?.[formLang] || ''} onChange={(e) => updateText('subtitle', formLang, e.target.value)} placeholder={l.subtitle} />
          </div>

          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.ctaText} ({formLang.toUpperCase()})</label>
              <input type="text" className="admin-input" value={hero.ctaText?.[formLang] || ''} onChange={(e) => updateText('ctaText', formLang, e.target.value)} placeholder={l.ctaText} />
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.ctaLink}</label>
              <input type="text" className="admin-input" value={hero.ctaLink} onChange={(e) => setHero({...hero, ctaLink:e.target.value})} placeholder="quran, hadith, https://..." />
            </div>
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.gradient}</label>
            <div className="admin-swatches" role="group" aria-label={l.gradient}>
              {HERO_GRADIENTS.map(g => (
                <button
                  key={g.key}
                  type="button"
                  className="admin-swatch"
                  aria-pressed={hero.gradient === g.key}
                  onClick={() => setHero({...hero, gradient:g.key})}
                  style={{ background:`linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]}, ${g.colors[2]})` }}
                >
                  {hero.gradient === g.key && (
                    <span className="admin-swatch-check" aria-hidden="true"><Icon name="check" size={14} strokeWidth={2.4} /></span>
                  )}
                  <span className="admin-swatch-name">{g.label[lang]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="admin-form-actions">
            <button type="button" onClick={handleSave} className="admin-submit-btn">
              <Icon name="check" /> {saved ? l.saved : l.save}
            </button>
          </div>
        </div>
      </div>
      <AdminToast message={saved ? l.saved : saveErr ? SAVE_FAILED[lang] : ''} tone={saveErr ? 'bad' : 'ok'} />
    </div>
  )
}
