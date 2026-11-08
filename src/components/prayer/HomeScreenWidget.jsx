// ═══════════════════════════════════════════════════════
// HomeScreenWidget (v5.7) — namaz vaxtları telefonun ANA EKRANINDA vidcet kimi (/prayer#home-widget)
//
//   <HomeScreenWidget location={pt.location} lang="az" city="Bakı" />
//
// • iOS ana ekrana əlavə olunmuş sayta (PWA) vidcet icazəsi vermir. Pulsuz
//   Scriptable tətbiqi isə skripti əsl iOS vidceti kimi göstərir: skript bu
//   şəhər üçün hazırlanır (utils/scriptableWidget → /api/prayer.json — vaxtlar
//   sayt və təqvimlə eynidir). "Kopyala" və ya ".js faylı" ilə köçürülür.
// • Alternativ (heç bir tətbiqsiz): təqvim abunəliyi (CalendarSubscribe) +
//   iOS / Android-in öz Təqvim vidceti — növbəti namazı göstərir.
// • Önizləmə — vidcetin necə görünəcəyi (bu günün real vaxtları ilə).
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import Icon from '../Icon'
import { icsUrl } from '../../utils/icsUrl'
import { buildScriptableWidget, widgetJsonUrl } from '../../utils/scriptableWidget'
import { pickUi } from '../../utils/uiText'
import '../../styles/HomeScreenWidget.css'

const SCRIPTABLE = 'https://apps.apple.com/app/scriptable/id1405459188'
const TXT = {
  az: {
    // lang-ok[vidceti]: tətbiqin adı / fayl növü; vidcet — saytda işlənən söz (/widget)
    ey: 'Ana ekran', title: 'Namaz vaxtları vidceti', lead: 'Növbəti namaz və geri sayım telefonun ana ekranında — saytı açmadan.',
    ios: 'iPhone', android: 'Android', next: 'Növbəti', left: 'qalıb',
    // lang-ok[Scriptable]: tətbiqin adı / fayl növü; vidcet — saytda işlənən söz (/widget)
    s1: 'App Store-dan pulsuz «Scriptable» tətbiqini yükləyin.', s1b: 'App Store-da aç',
    s2: 'Bu düymə ilə şəhəriniz üçün hazır skripti kopyalayın.', copy: 'Skripti kopyala', copied: 'Kopyalandı', file: '.js faylı',
    // lang-ok[Scriptable]: tətbiqin adı / fayl növü; vidcet — saytda işlənən söz (/widget)
    s3: 'Scriptable-ı açın → sağ yuxarıda «+» → mətni yapışdırın → adını «Namaz vaxtları» qoyun.',
    // lang-ok[Scriptable]: tətbiqin adı / fayl növü; vidcet — saytda işlənən söz (/widget)
    s4: 'Ana ekranı basıb saxlayın → sol yuxarıda «+» → Scriptable → ölçü seçin → vidceti basın → Script: «Namaz vaxtları».',
    lock: 'Kilid ekranına da əlavə etmək olur (iOS 16+).',
    // lang-ok[vidcetini]: tətbiqin adı / fayl növü; vidcet — saytda işlənən söz (/widget)
    alt: 'Heç bir tətbiq yükləmədən: yuxarıdakı təqvim abunəliyini edin və telefonun öz «Təqvim» vidcetini ana ekrana əlavə edin — növbəti namaz orada görünəcək.',
    // lang-ok[vidcet]: tətbiqin adı / fayl növü; vidcet — saytda işlənən söz (/widget)
    andr: 'Android-də sayt vidcet yarada bilmir. Yuxarıdakı «Google Təqvim» abunəliyini edin, sonra ana ekrana Google Təqvimin «Gündəm» vidcetini əlavə edin.',
  },
  en: {
    ey: 'Home screen', title: 'Prayer times widget', lead: 'The next prayer and a countdown on your phone’s home screen — without opening the site.',
    ios: 'iPhone', android: 'Android', next: 'Next', left: 'left',
    s1: 'Install the free “Scriptable” app from the App Store.', s1b: 'Open in App Store',
    s2: 'Copy the ready-made script for your city with this button.', copy: 'Copy script', copied: 'Copied', file: '.js file',
    s3: 'Open Scriptable → “+” at the top right → paste the text → name it “Prayer times”.',
    s4: 'Touch and hold the home screen → “+” at the top left → Scriptable → choose a size → tap the widget → Script: “Prayer times”.',
    lock: 'You can add it to the Lock Screen too (iOS 16+).',
    alt: 'Without installing any app: subscribe to the calendar above and add your phone’s own “Calendar” widget to the home screen — the next prayer will show there.',
    andr: 'On Android a website cannot create widgets. Subscribe with “Google Calendar” above, then add Google Calendar’s “Schedule” widget to the home screen.',
  },
  ru: {
    ey: 'Главный экран', title: 'Виджет времени намаза', lead: 'Следующий намаз и обратный отсчёт на главном экране телефона — без открытия сайта.',
    ios: 'iPhone', android: 'Android', next: 'Следующий', left: 'осталось',
    // lang-ok[Scriptable]: tətbiqin adı / fayl növü; vidcet — saytda işlənən söz (/widget)
    s1: 'Установите бесплатное приложение «Scriptable» из App Store.', s1b: 'Открыть в App Store',
    // lang-ok[js]: tətbiqin adı / fayl növü; vidcet — saytda işlənən söz (/widget)
    s2: 'Скопируйте готовый скрипт для вашего города этой кнопкой.', copy: 'Скопировать скрипт', copied: 'Скопировано', file: 'Файл .js',
    // lang-ok[Scriptable]: tətbiqin adı / fayl növü; vidcet — saytda işlənən söz (/widget)
    s3: 'Откройте Scriptable → «+» вверху справа → вставьте текст → назовите «Время намаза».',
    // lang-ok[Scriptable,Script]: tətbiqin adı / fayl növü; vidcet — saytda işlənən söz (/widget)
    s4: 'Нажмите и удерживайте главный экран → «+» вверху слева → Scriptable → выберите размер → нажмите на виджет → Script: «Время намаза».',
    lock: 'Можно добавить и на экран блокировки (iOS 16+).',
    alt: 'Без установки приложений: подпишитесь на календарь выше и добавьте на главный экран встроенный виджет «Календарь» — там появится следующий намаз.',
    andr: 'На Android сайт не может создавать виджеты. Подпишитесь через «Google Календарь» выше и добавьте на главный экран виджет «Расписание» Google Календаря.',
  },
  ar: {
    ey: 'الشاشة الرئيسية', title: 'أداة مواقيت الصلاة', lead: 'الصلاة القادمة والعدّ التنازلي على الشاشة الرئيسية لهاتفك — دون فتح الموقع.',
    ios: 'آيفون', android: 'أندرويد', next: 'التالية', left: 'متبقٍّ',
    // lang-ok[Scriptable]: tətbiqin adı / fayl növü; vidcet — saytda işlənən söz (/widget)
    s1: 'ثبّت تطبيق «Scriptable» المجاني من App Store.', s1b: 'افتح في App Store',
    // lang-ok[js]: tətbiqin adı / fayl növü; vidcet — saytda işlənən söz (/widget)
    s2: 'انسخ السكربت الجاهز لمدينتك بهذا الزر.', copy: 'انسخ السكربت', copied: 'تم النسخ', file: 'ملف ‎.js',
    // lang-ok[Scriptable]: tətbiqin adı / fayl növü; vidcet — saytda işlənən söz (/widget)
    s3: 'افتح Scriptable ← «+» أعلى اليمين ← الصق النص ← سمّه «مواقيت الصلاة».',
    // lang-ok[Scriptable,Script]: tətbiqin adı / fayl növü; vidcet — saytda işlənən söz (/widget)
    s4: 'اضغط مطولًا على الشاشة الرئيسية ← «+» أعلى اليسار ← Scriptable ← اختر الحجم ← اضغط الأداة ← Script: «مواقيت الصلاة».',
    lock: 'يمكن إضافتها إلى شاشة القفل أيضًا (iOS 16+).',
    alt: 'دون تثبيت أي تطبيق: اشترك في التقويم أعلاه وأضف أداة «التقويم» المدمجة إلى الشاشة الرئيسية — ستظهر الصلاة القادمة فيها.',
    andr: 'في أندرويد لا يستطيع الموقع إنشاء أدوات. اشترك عبر «تقويم Google» أعلاه ثم أضف أداة «الجدول» من تقويم Google إلى الشاشة الرئيسية.',
  },
  tr: {
    ey: 'Ana ekran', title: 'Namaz vakitleri widget’ı', lead: 'Sıradaki namaz ve geri sayım telefonunuzun ana ekranında — siteyi açmadan.',
    ios: 'iPhone', android: 'Android', next: 'Sıradaki', left: 'kaldı',
    s1: 'App Store’dan ücretsiz «Scriptable» uygulamasını indirin.', s1b: 'App Store’da aç',
    s2: 'Şehriniz için hazır betiği bu düğmeyle kopyalayın.', copy: 'Betiği kopyala', copied: 'Kopyalandı', file: '.js dosyası',
    s3: 'Scriptable’ı açın → sağ üstte «+» → metni yapıştırın → adını «Namaz vakitleri» koyun.',
    s4: 'Ana ekrana basılı tutun → sol üstte «+» → Scriptable → boyut seçin → widget’a dokunun → Script: «Namaz vakitleri».',
    lock: 'Kilit ekranına da eklenebilir (iOS 16+).',
    alt: 'Hiçbir uygulama yüklemeden: yukarıdaki takvim aboneliğini yapın ve telefonun kendi «Takvim» widget’ını ana ekrana ekleyin — sıradaki namaz orada görünür.',
    andr: 'Android’de site widget oluşturamaz. Yukarıdan «Google Takvim» aboneliği yapın, ardından Google Takvim’in «Program» widget’ını ana ekrana ekleyin.',
  },
}

const KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

/**
 * times — { fajr:'05:38', … } (bu gün), names — namaz adları,
 * next — { key, time, left: 'S:DD' } (önizləmə üçün)
 */
export default function HomeScreenWidget({ location, lang = 'az', city, times, names, next }) {
  const t = pickUi(TXT, lang)
  const [os, setOs] = useState(() => (typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent) ? 'android' : 'ios'))
  const [copied, setCopied] = useState(false)
  if (!location || !Number.isFinite(location.lat) || !location.tz) return null
  const coreLang = ['az', 'en', 'ru', 'ar', 'tr'].includes(lang) ? lang : 'en'
  const url = widgetJsonUrl(icsUrl('https://muslims.cc', location, coreLang, city))
  const script = () => buildScriptableWidget({ url, lang: coreLang })
  const copy = async () => {
    try { await navigator.clipboard.writeText(script()); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* */ }
  }
  const download = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([script()], { type: 'text/javascript' }))
    a.download = 'namaz-vaxtlari.js'
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }
  const nm = (k) => names?.[k] || k

  return (
    <div className="ui-card hsw" id="home-widget" data-testid="home-widget" data-reveal>
      <div className="hsw__intro">
        <span className="ui-eyebrow"><Icon name="widget" size={14} /> {t.ey}</span>
        <h3 className="hsw__title">{t.title}</h3>
        <p className="hsw__lead">{t.lead}</p>
        <div className="hsw__tabs" role="group">
          {['ios', 'android'].map(k => (
            <button key={k} type="button" className={`hsw__tab${os === k ? ' is-on' : ''}`} aria-pressed={os === k} onClick={() => setOs(k)}>{t[k]}</button>
          ))}
        </div>
      </div>

      {/* Önizləmə — orta ölçülü iOS vidceti */}
      <div className="hsw__phone" aria-hidden="true">
        <div className="hsw__w">
          <div className="hsw__w-city"><Icon name="moonStar" size={12} /> {city || 'muslims.cc'}</div>
          <div className="hsw__w-body">
            <div className="hsw__w-next">
              <small>{t.next}</small>
              <b>{next ? nm(next.key) : '—'}</b>
              <strong className="ui-num">{next?.time || '--:--'}</strong>
              {next?.left && <span className="ui-num">{next.left} {t.left}</span>}
            </div>
            <ul className="hsw__w-list">
              {KEYS.map(k => (
                <li key={k} className={next?.key === k ? 'is-on' : ''}><span>{nm(k)}</span><span className="ui-num">{times?.[k] || '--:--'}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {os === 'ios' ? (
        <ol className="hsw__steps">
          <li><span>{t.s1}</span> <a className="ui-btn ui-btn--secondary ui-btn--sm" href={SCRIPTABLE} target="_blank" rel="noopener noreferrer"><Icon name="external" className="ui-btn__icon" />{t.s1b}</a></li>
          <li><span>{t.s2}</span>
            <span className="hsw__btns">
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={copy} data-testid="hsw-copy"><Icon name={copied ? 'check' : 'copy'} className="ui-btn__icon" />{copied ? t.copied : t.copy}</button>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={download}><Icon name="download" className="ui-btn__icon" />{t.file}</button>
            </span>
          </li>
          <li><span>{t.s3}</span></li>
          <li><span>{t.s4}</span> <small className="hsw__note">{t.lock}</small></li>
        </ol>
      ) : (
        <p className="hsw__alt">{t.andr}</p>
      )}
      {os === 'ios' && <p className="hsw__alt"><Icon name="calendar" size={14} /> {t.alt}</p>}
    </div>
  )
}
