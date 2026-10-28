import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { getAppSettings, saveAppSettings } from '../../data/adminContent'
import { BRAND, tr } from '../../config/brand'

// Şəhərlər: name/country — saxlanan dəyər (namaz API-si üçün, dəyişmir);
// label/countryLabel — admin siyahısında cari dildə göstərilən ad
const COUNTRY = {
  AZ: {az:'Azərbaycan',en:'Azerbaijan',ru:'Азербайджан',ar:'أذربيجان',tr:'Azerbaycan'},
  TR: {az:'Türkiyə',en:'Türkiye',ru:'Турция',ar:'تركيا',tr:'Türkiye'},
  SA: {az:'Səudiyyə Ərəbistanı',en:'Saudi Arabia',ru:'Саудовская Аравия',ar:'السعودية',tr:'Suudi Arabistan'},
  EG: {az:'Misir',en:'Egypt',ru:'Египет',ar:'مصر',tr:'Mısır'},
  AE: {az:'BƏƏ',en:'UAE',ru:'ОАЭ',ar:'الإمارات',tr:'BAE'},
  RU: {az:'Rusiya',en:'Russia',ru:'Россия',ar:'روسيا',tr:'Rusya'},
  GB: {az:'Böyük Britaniya',en:'United Kingdom',ru:'Великобритания',ar:'بريطانيا',tr:'Birleşik Krallık'},
  US: {az:'ABŞ',en:'USA',ru:'США',ar:'الولايات المتحدة',tr:'ABD'},
}

const CITIES = [
  { name:'Baku', country:'Azerbaijan', label:{az:'Bakı',en:'Baku',ru:'Баку',ar:'باكو',tr:'Bakü'}, countryLabel:COUNTRY.AZ },
  { name:'Istanbul', country:'Turkey', label:{az:'İstanbul',en:'Istanbul',ru:'Стамбул',ar:'إسطنبول',tr:'İstanbul'}, countryLabel:COUNTRY.TR },
  { name:'Makkah', country:'Saudi Arabia', label:{az:'Məkkə',en:'Makkah',ru:'Мекка',ar:'مكة المكرمة',tr:'Mekke'}, countryLabel:COUNTRY.SA },
  { name:'Madinah', country:'Saudi Arabia', label:{az:'Mədinə',en:'Madinah',ru:'Медина',ar:'المدينة المنورة',tr:'Medine'}, countryLabel:COUNTRY.SA },
  { name:'Cairo', country:'Egypt', label:{az:'Qahirə',en:'Cairo',ru:'Каир',ar:'القاهرة',tr:'Kahire'}, countryLabel:COUNTRY.EG },
  { name:'Dubai', country:'UAE', label:{az:'Dubay',en:'Dubai',ru:'Дубай',ar:'دبي',tr:'Dubai'}, countryLabel:COUNTRY.AE },
  { name:'Ankara', country:'Turkey', label:{az:'Ankara',en:'Ankara',ru:'Анкара',ar:'أنقرة',tr:'Ankara'}, countryLabel:COUNTRY.TR },
  { name:'Moscow', country:'Russia', label:{az:'Moskva',en:'Moscow',ru:'Москва',ar:'موسكو',tr:'Moskova'}, countryLabel:COUNTRY.RU },
  { name:'London', country:'UK', label:{az:'London',en:'London',ru:'Лондон',ar:'لندن',tr:'Londra'}, countryLabel:COUNTRY.GB },
  { name:'New York', country:'US', label:{az:'Nyu-York',en:'New York',ru:'Нью-Йорк',ar:'نيويورك',tr:'New York'}, countryLabel:COUNTRY.US },
]

// Namaz vaxtı hesablama metodları (aladhan.com nömrələri) — 5 dildə ad
const PRAYER_METHODS = [
  { value:1, name:{az:'Ümmül-Qura, Məkkə',en:'Umm al-Qura, Makkah',ru:'Умм аль-Кура, Мекка',ar:'أم القرى، مكة المكرمة',tr:"Ümmü'l-Kurâ, Mekke"} },
  { value:2, name:{az:'Misir Ümumi Məsahə İdarəsi',en:'Egyptian General Authority of Survey',ru:'Египетское генеральное управление геодезии',ar:'الهيئة المصرية العامة للمساحة',tr:'Mısır Genel Harita Kurumu'} },
  { value:3, name:{az:'Ümumdünya İslam Liqası',en:'Muslim World League',ru:'Всемирная исламская лига',ar:'رابطة العالم الإسلامي',tr:'Müslüman Dünya Birliği'} },
  { value:4, name:{az:'Kəraçi İslam Elmləri Universiteti',en:'University of Islamic Sciences, Karachi',ru:'Университет исламских наук, Карачи',ar:'جامعة العلوم الإسلامية، كراتشي',tr:'Karaçi İslami İlimler Üniversitesi'} },
  { value:5, name:{az:'Şimali Amerika İslam Cəmiyyəti',en:'Islamic Society of North America',ru:'Исламское общество Северной Америки',ar:'الجمعية الإسلامية لأمريكا الشمالية',tr:'Kuzey Amerika İslam Topluluğu'} },
  { value:13, name:{az:'Diyanət İşləri İdarəsi (Türkiyə)',en:'Diyanet (Türkiye)',ru:'Управление по делам религии (Турция)',ar:'رئاسة الشؤون الدينية (تركيا)',tr:'Diyanet İşleri Başkanlığı (Türkiye)'} },
  { value:14, name:{az:'Rusiya Müsəlmanları Dini İdarəsi',en:'Spiritual Administration of Muslims of Russia',ru:'Духовное управление мусульман России',ar:'الإدارة الدينية لمسلمي روسيا',tr:'Rusya Müslümanları Dini İdaresi'} },
]

const LABELS = {
  az: { title:'Sistem parametrləri', sub:'Bütün tətbiq üçün ümumi tənzimləmələr', general:'Ümumi', display:'Göstərmə', appearance:'Görünüş', defaultCity:'Standart şəhər', defaultLang:'Standart dil', prayerMethod:'Namaz hesablama metodu', showAnn:'Elanları göstər', showVid:'Videoları göstər', showDaily:'Günün məzmununu göstər', autoVid:'Videoları avtomatik oynat', enableNotif:'Bildirişlər', primaryColor:'Əsas rəng', goldColor:'Qızılı rəng', save:'Yadda saxla', saved:'Yadda saxlandı!', aiTitle:'Süni intellekt köməkçisinin ünvanı', apiLabel:'API ünvanı', apiHint:'{name} söhbəti üçün server ünvanı. Boş qalsa, VITE_API_URL və ya app.json-dakı ünvan istifadə olunur. Veb, iOS və Android eyni ünvanı oxuyur.' },
  en: { title:'System Settings', sub:'App-wide configuration', general:'General', display:'Display', appearance:'Appearance', defaultCity:'Default city', defaultLang:'Default language', prayerMethod:'Prayer calculation method', showAnn:'Show announcements', showVid:'Show videos', showDaily:'Show daily content', autoVid:'Autoplay videos', enableNotif:'Notifications', primaryColor:'Primary color', goldColor:'Gold color', save:'Save', saved:'Saved!', aiTitle:'AI assistant endpoint', apiLabel:'API URL', apiHint:'Server address for the {name} chat. If left empty, the address from VITE_API_URL or app.json is used. Web, iOS and Android all read this address.' },
  ru: { title:'Настройки', sub:'Конфигурация приложения', general:'Общие', display:'Отображение', appearance:'Внешний вид', defaultCity:'Город по умолчанию', defaultLang:'Язык по умолчанию', prayerMethod:'Метод расчёта намаза', showAnn:'Показывать объявления', showVid:'Показывать видео', showDaily:'Показывать контент дня', autoVid:'Автовоспроизведение видео', enableNotif:'Уведомления', primaryColor:'Основной цвет', goldColor:'Золотой цвет', save:'Сохранить', saved:'Сохранено!', aiTitle:'Адрес ИИ-помощника', apiLabel:'Адрес API', apiHint:'Адрес сервера для чата «{name}». Если поле пустое, используется адрес из настроек сборки. Сайт и мобильные приложения читают один и тот же адрес.' },
  ar: { title:'إعدادات النظام', sub:'إعدادات التطبيق', general:'عام', display:'العرض', appearance:'المظهر', defaultCity:'المدينة الافتراضية', defaultLang:'اللغة الافتراضية', prayerMethod:'طريقة حساب الصلاة', showAnn:'عرض الإعلانات', showVid:'عرض الفيديوهات', showDaily:'عرض محتوى اليوم', autoVid:'تشغيل الفيديوهات تلقائيًا', enableNotif:'الإشعارات', primaryColor:'اللون الرئيسي', goldColor:'الذهبي', save:'حفظ', saved:'تم الحفظ!', aiTitle:'عنوان مساعد الذكاء الاصطناعي', apiLabel:'عنوان API', apiHint:'عنوان الخادم لمحادثة «{name}». إذا تُرك فارغًا يُستخدم العنوان من إعدادات البناء. يقرأ الموقع وتطبيقات الجوال العنوان نفسه.' },
  tr: { title:'Sistem Ayarları', sub:'Uygulama yapılandırması', general:'Genel', display:'Görüntü', appearance:'Görünüm', defaultCity:'Varsayılan şehir', defaultLang:'Varsayılan dil', prayerMethod:'Namaz hesaplama metodu', showAnn:'Duyuruları göster', showVid:'Videoları göster', showDaily:'Günün içeriğini göster', autoVid:'Videoları otomatik oynat', enableNotif:'Bildirimler', primaryColor:'Ana renk', goldColor:'Altın renk', save:'Kaydet', saved:'Kaydedildi!', aiTitle:'Yapay zekâ asistanı adresi', apiLabel:'API adresi', apiHint:'«{name}» sohbeti için sunucu adresi. Boş bırakılırsa VITE_API_URL veya app.json içindeki adres kullanılır. Web, iOS ve Android aynı adresi okur.' },
}

export default function SettingsManager() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [settings, setSettings] = useState({
    defaultCity: 'Baku', defaultCountry: 'Azerbaijan', defaultLang: 'az', prayerMethod: 13,
    showAnnouncements: true, showVideos: true, showDailyContent: true, autoplayVideos: false,
    enableNotifications: true, primaryColor: '#1a6b3a', goldColor: '#b8860b',
    apiUrl: '',
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
                {CITIES.map(c => <option key={c.name} value={c.name}>{c.label[lang]}, {c.countryLabel[lang]}</option>)}
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
              {PRAYER_METHODS.map(m => <option key={m.value} value={m.value}>{m.name[lang]}</option>)}
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

        {/* AI Chat / Backend URL */}
        <div className="admin-section">
          <h2 className="admin-section-title">
            <span className="admin-section-title-icon">🤖</span>
            {l.aiTitle}
          </h2>
          <div className="admin-input-group">
            <label className="admin-input-label">
              {l.apiLabel}
            </label>
            <input
              type="text"
              className="admin-input"
              value={settings.apiUrl || ''}
              onChange={(e) => update('apiUrl', e.target.value)}
              placeholder="https://muslim-cc.vercel.app"
            />
            <p style={{fontSize:12, color:'var(--text-muted)', marginTop:6, lineHeight:1.5}}>
              {l.apiHint.replace('{name}', tr(BRAND.aiName, lang))}
            </p>
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
