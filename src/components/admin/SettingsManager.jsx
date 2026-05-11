import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { getAppSettings, saveAppSettings } from '../../data/adminContent'

const CITIES = [
  { name:'Baku', country:'Azerbaijan' },
  { name:'Istanbul', country:'Turkey' },
  { name:'Makkah', country:'Saudi Arabia' },
  { name:'Madinah', country:'Saudi Arabia' },
  { name:'Cairo', country:'Egypt' },
  { name:'Dubai', country:'UAE' },
  { name:'Ankara', country:'Turkey' },
  { name:'Moscow', country:'Russia' },
  { name:'London', country:'UK' },
  { name:'New York', country:'US' },
]

const PRAYER_METHODS = [
  { value:1, name:'Umm Al-Qura, Makkah' },
  { value:2, name:'Egyptian General Authority' },
  { value:3, name:'Muslim World League' },
  { value:4, name:'University of Karachi' },
  { value:5, name:'Islamic Society of North America' },
  { value:13, name:'Diyanet (Turkey)' },
  { value:14, name:'Spiritual Administration of Russia' },
]

const LABELS = {
  az: { title:'Sistem Parametrləri', sub:'App-wide konfiqurasiya', general:'Ümumi', display:'Göstərmə', appearance:'Görünüş', defaultCity:'Default şəhər', defaultLang:'Default dil', prayerMethod:'Namaz hesablama metodu', showAnn:'Elanları göstər', showVid:'Videoları göstər', showDaily:'Günün məzmunu göstər', autoVid:'Video avtomatik oynat', enableNotif:'Bildirişlər', primaryColor:'Əsas rəng', goldColor:'Qızılı rəng', save:'Yadda saxla', saved:'Yadda saxlandı!' },
  en: { title:'System Settings', sub:'App-wide configuration', general:'General', display:'Display', appearance:'Appearance', defaultCity:'Default city', defaultLang:'Default language', prayerMethod:'Prayer calculation method', showAnn:'Show announcements', showVid:'Show videos', showDaily:'Show daily content', autoVid:'Autoplay videos', enableNotif:'Notifications', primaryColor:'Primary color', goldColor:'Gold color', save:'Save', saved:'Saved!' },
  ru: { title:'Настройки', sub:'Конфигурация приложения', general:'Общие', display:'Отображение', appearance:'Внешний вид', defaultCity:'Город по умолчанию', defaultLang:'Язык по умолчанию', prayerMethod:'Метод расчёта намаза', showAnn:'Объявления', showVid:'Видео', showDaily:'Контент дня', autoVid:'Автовоспроизведение', enableNotif:'Уведомления', primaryColor:'Основной цвет', goldColor:'Золотой цвет', save:'Сохранить', saved:'Сохранено!' },
  ar: { title:'إعدادات النظام', sub:'إعدادات التطبيق', general:'عام', display:'العرض', appearance:'المظهر', defaultCity:'المدينة الافتراضية', defaultLang:'اللغة الافتراضية', prayerMethod:'طريقة حساب الصلاة', showAnn:'عرض الإعلانات', showVid:'عرض الفيديوهات', showDaily:'محتوى اليوم', autoVid:'تشغيل تلقائي', enableNotif:'الإشعارات', primaryColor:'اللون الرئيسي', goldColor:'الذهبي', save:'حفظ', saved:'تم الحفظ!' },
  tr: { title:'Sistem Ayarları', sub:'Uygulama yapılandırması', general:'Genel', display:'Görüntü', appearance:'Görünüm', defaultCity:'Varsayılan şehir', defaultLang:'Varsayılan dil', prayerMethod:'Namaz hesaplama metodu', showAnn:'Duyuruları göster', showVid:'Videoları göster', showDaily:'Günün içeriği', autoVid:'Otomatik oynat', enableNotif:'Bildirimler', primaryColor:'Ana renk', goldColor:'Altın renk', save:'Kaydet', saved:'Kaydedildi!' },
}

export default function SettingsManager() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [settings, setSettings] = useState({
    defaultCity: 'Baku', defaultCountry: 'Azerbaijan', defaultLang: 'az', prayerMethod: 13,
    showAnnouncements: true, showVideos: true, showDailyContent: true, autoplayVideos: false,
    enableNotifications: true, primaryColor: '#1a6b3a', goldColor: '#b8860b',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => { getAppSettings().then(s => setSettings(s)) }, [])

  const update = (key, value) => setSettings({ ...settings, [key]: value })

  const handleSave = async () => {
    await saveAppSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const Toggle = ({ label, value, onChange }) => (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', marginBottom:8}}>
      <span style={{fontSize:14, fontWeight:600, color:'var(--text)'}}>{label}</span>
      <label style={{position:'relative', display:'inline-block', width:48, height:26}}>
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} style={{opacity:0, width:0, height:0}} />
        <span style={{
          position:'absolute', cursor:'pointer', top:0, left:0, right:0, bottom:0,
          background: value ? 'var(--primary)' : '#cbd5e1',
          transition:'.3s', borderRadius:13,
        }}>
          <span style={{
            position:'absolute', content:'""', height:20, width:20,
            left: value ? 25 : 3, bottom:3, background:'#fff', transition:'.3s', borderRadius:'50%',
            display:'block',
          }} />
        </span>
      </label>
    </div>
  )

  return (
    <div>
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge" style={{background:'linear-gradient(135deg,#64748b,#475569)'}}>⚙️</div>
          <div className="admin-header-info"><h1>{l.title}</h1><p>{l.sub}</p></div>
        </div>
      </div>

      {/* General */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon">🌍</span>
          {l.general}
        </h2>

        <div className="admin-form">
          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.defaultCity}</label>
              <select className="admin-input admin-select" value={settings.defaultCity} onChange={(e) => {
                const city = CITIES.find(c => c.name === e.target.value)
                if (city) setSettings({...settings, defaultCity:city.name, defaultCountry:city.country})
              }}>
                {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}, {c.country}</option>)}
              </select>
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.defaultLang}</label>
              <select className="admin-input admin-select" value={settings.defaultLang} onChange={(e) => update('defaultLang', e.target.value)}>
                <option value="az">🇦🇿 Azərbaycan</option>
                <option value="en">🇬🇧 English</option>
                <option value="ru">🇷🇺 Русский</option>
                <option value="ar">🇸🇦 العربية</option>
                <option value="tr">🇹🇷 Türkçe</option>
              </select>
            </div>
          </div>

          <div className="admin-input-group">
            <label className="admin-input-label">{l.prayerMethod}</label>
            <select className="admin-input admin-select" value={settings.prayerMethod} onChange={(e) => update('prayerMethod', parseInt(e.target.value))}>
              {PRAYER_METHODS.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Display options */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon">👁️</span>
          {l.display}
        </h2>

        <Toggle label={l.showAnn} value={settings.showAnnouncements} onChange={(v) => update('showAnnouncements', v)} />
        <Toggle label={l.showVid} value={settings.showVideos} onChange={(v) => update('showVideos', v)} />
        <Toggle label={l.showDaily} value={settings.showDailyContent} onChange={(v) => update('showDailyContent', v)} />
        <Toggle label={l.autoVid} value={settings.autoplayVideos} onChange={(v) => update('autoplayVideos', v)} />
        <Toggle label={l.enableNotif} value={settings.enableNotifications} onChange={(v) => update('enableNotifications', v)} />
      </div>

      {/* Appearance */}
      <div className="admin-section">
        <h2 className="admin-section-title">
          <span className="admin-section-title-icon">🎨</span>
          {l.appearance}
        </h2>

        <div className="admin-form">
          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.primaryColor}</label>
              <div style={{display:'flex', gap:10, alignItems:'center'}}>
                <input type="color" value={settings.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} style={{width:60, height:42, borderRadius:8, border:'1.5px solid var(--border)', cursor:'pointer'}} />
                <input type="text" className="admin-input" value={settings.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} style={{flex:1}} />
              </div>
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.goldColor}</label>
              <div style={{display:'flex', gap:10, alignItems:'center'}}>
                <input type="color" value={settings.goldColor} onChange={(e) => update('goldColor', e.target.value)} style={{width:60, height:42, borderRadius:8, border:'1.5px solid var(--border)', cursor:'pointer'}} />
                <input type="text" className="admin-input" value={settings.goldColor} onChange={(e) => update('goldColor', e.target.value)} style={{flex:1}} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{position:'sticky', bottom:20}}>
        <button onClick={handleSave} className="admin-submit-btn" style={{width:'100%', padding:'18px', fontSize:15}}>
          <span>💾</span> {saved ? '✅ ' + l.saved : l.save}
        </button>
      </div>
    </div>
  )
}
