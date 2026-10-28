import { useState, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'
import { AdminHeader, SectionTitle, AdminSwitch, AdminToast, SAVE_FAILED } from './AdminUi'
import Icon from '../Icon'
import { getAppSettings, saveAppSettings } from '../../data/adminContent'
import { BRAND, tr } from '../../config/brand'
import { PRAYER_CITIES, COUNTRY_NAMES } from '../../utils/prayerLocation'

// Standart şəhər: saytın namaz şəhərləri siyahısı (src/utils/prayerLocation.js —
// 98 şəhər). Əvvəl burada ayrıca 11 şəhərlik siyahı vardı; id-ləri fərqli idi
// (məs. 'Makkah' ↔ 'Mecca') və seçilən standart səssizcə nəzərə alınmırdı.
// Saxlanan dəyər şəhərin id-sidir (namaz kodu setAdminDefaultCity-yə ötürür).
const CITY_GROUPS = [
  { key: 'AZ', cities: PRAYER_CITIES.filter(c => c.country === 'AZ') },
  { key: 'WORLD', cities: PRAYER_CITIES.filter(c => c.country !== 'AZ') },
]
const WORLD_LABEL = { az: 'Dünya', en: 'World', ru: 'Мир', ar: 'العالم', tr: 'Dünya' }

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

  useEffect(() => { getAppSettings().then(s => s && setSettings(s)).catch(() => { /* şəbəkə yoxdur */ }) }, [])

  const update = (key, value) => setSettings({ ...settings, [key]: value })

  // Saxlama nəticəsi üzən bildirişdə (AdminToast); xəta da tutulur
  const [saveErr, setSaveErr] = useState(false)
  const handleSave = async () => {
    setSaveErr(false)
    try {
      await saveAppSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveErr(true)
      setTimeout(() => setSaveErr(false), 4000)
    }
  }

  return (
    <div>
      <AdminHeader icon="list" title={l.title} sub={l.sub} />

      {/* General */}
      <div className="admin-section" data-reveal>
        <SectionTitle icon="globe">{l.general}</SectionTitle>

        <div className="admin-form">
          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.defaultCity}</label>
              <select className="admin-input admin-select" value={settings.defaultCity} onChange={(e) => {
                const city = PRAYER_CITIES.find(c => c.id === e.target.value)
                if (city) setSettings({ ...settings, defaultCity: city.id, defaultCountry: COUNTRY_NAMES[city.country]?.en || city.country })
              }}>
                {CITY_GROUPS.map(g => (
                  <optgroup key={g.key} label={g.key === 'AZ' ? COUNTRY_NAMES.AZ[lang] : WORLD_LABEL[lang]}>
                    {g.cities.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label[lang]}{g.key === 'AZ' ? '' : `, ${COUNTRY_NAMES[c.country]?.[lang] || c.country}`}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.defaultLang}</label>
              <select className="admin-input admin-select" value={settings.defaultLang} onChange={(e) => update('defaultLang', e.target.value)}>
                <option value="az">Azərbaycan</option>
                <option value="en">English</option>
                <option value="ru">Русский</option>
                <option value="ar">العربية</option>
                <option value="tr">Türkçe</option>
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
      <div className="admin-section" data-reveal>
        <SectionTitle icon="eye">{l.display}</SectionTitle>

        <div className="admin-switch-list">
        <AdminSwitch id="set-showAnnouncements" label={l.showAnn} checked={settings.showAnnouncements} onChange={(v) => update('showAnnouncements', v)} />
        <AdminSwitch id="set-showVideos" label={l.showVid} checked={settings.showVideos} onChange={(v) => update('showVideos', v)} />
        <AdminSwitch id="set-showDailyContent" label={l.showDaily} checked={settings.showDailyContent} onChange={(v) => update('showDailyContent', v)} />
        <AdminSwitch id="set-autoplayVideos" label={l.autoVid} checked={settings.autoplayVideos} onChange={(v) => update('autoplayVideos', v)} />
        <AdminSwitch id="set-enableNotifications" label={l.enableNotif} checked={settings.enableNotifications} onChange={(v) => update('enableNotifications', v)} />
        </div>
      </div>

      {/* Appearance */}
      <div className="admin-section" data-reveal>
        <SectionTitle icon="palette">{l.appearance}</SectionTitle>

        <div className="admin-form">
          <div className="admin-form-row">
            <div className="admin-input-group">
              <label className="admin-input-label">{l.primaryColor}</label>
              <div className="admin-color-row">
                <input type="color" value={settings.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} className="admin-color" aria-label={l.primaryColor} />
                <input type="text" className="admin-input" value={settings.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} />
              </div>
            </div>
            <div className="admin-input-group">
              <label className="admin-input-label">{l.goldColor}</label>
              <div className="admin-color-row">
                <input type="color" value={settings.goldColor} onChange={(e) => update('goldColor', e.target.value)} className="admin-color" aria-label={l.goldColor} />
                <input type="text" className="admin-input" value={settings.goldColor} onChange={(e) => update('goldColor', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI söhbət — server ünvanı (əvvəl "Görünüş" kartının İÇİNDƏ idi) */}
      <div className="admin-section" data-reveal>
          <SectionTitle icon="aichat">{l.aiTitle}</SectionTitle>
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
            <p className="admin-hint">
              {l.apiHint.replace('{name}', tr(BRAND.aiName, lang))}
            </p>
          </div>
      </div>

      <div className="admin-savebar">
        <button type="button" onClick={handleSave} className="admin-submit-btn">
          <Icon name="check" /> {saved ? l.saved : l.save}
        </button>
      </div>
      <AdminToast message={saved ? l.saved : saveErr ? SAVE_FAILED[lang] : ''} tone={saveErr ? 'bad' : 'ok'} />
    </div>
  )
}
