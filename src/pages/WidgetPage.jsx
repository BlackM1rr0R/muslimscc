// ═══════════════════════════════════════════════════════
// Vidcet — /widget: başqa saytlara yerləşdirilən namaz vaxtları vidceti
//
// • Canlı görünüş: public/widget.js (başqa saytların yüklədiyi EYNİ fayl)
//   səhifəyə data-manual ilə bir dəfə yüklənir, sonra
//   window.MuslimsWidget.mount(el, opts) ilə seçimə görə yenidən çəkilir.
// • Generator: şəhər, dil, mövzu → <script> kodu (kopyala).
//   Azərbaycan şəhəri — data-city (vidcet özü hesablayır, prayCalc ilə eyni);
//   digər şəhərlər — data-lat/data-lng/data-tz (aladhan, Diyanət metodu).
// • Alternativ: iframe — məscid ekranının yığcam görünüşü (/mosque-tv?compact=1).
// Vidcetin mənbəyi: src/widget/widget.src.js → node scripts/build-widget.mjs
// ═══════════════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { PRAYER_CITIES, COUNTRY_NAMES, getPrayerLocation } from '../utils/prayerLocation'
import { serializeConfig } from '../utils/iqamah'
import { SITE } from '../seo/routes'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import '../styles/WidgetPage.css'

// Məscid ekranının yolu (seo/routes.js-də 'mosquetv' → 'mosque-tv')
const TV_PATH = '/mosque-tv'
const SCRIPT_SRC = '/widget.js'

// Dizayn v3: "necə işlədilir", açar rəqəmlər və 3 addım (5 dil)
const V3 = {
  how: {
    az: 'Necə işlədilir: aşağıda şəhəri, dili və görünüşü seçin — canlı görünüş dərhal dəyişir. Sonra hazır kodu kopyalayıb saytınızın HTML-inə yapışdırın.',
    en: 'How to use: pick the city, language and look below — the live preview updates at once. Then copy the ready code into your site’s HTML.',
    ru: 'Как пользоваться: выберите ниже город, язык и оформление — превью сразу обновится. Затем скопируйте готовый код в HTML вашего сайта.',
    ar: 'طريقة الاستخدام: اختر المدينة واللغة والمظهر أدناه فتتحدّث المعاينة فورًا، ثم انسخ الشيفرة الجاهزة إلى HTML موقعك.',
    tr: 'Nasıl kullanılır: aşağıdan şehri, dili ve görünümü seçin — canlı önizleme hemen değişir. Sonra hazır kodu kopyalayıp sitenizin HTML’ine yapıştırın.',
  },
  stats: [
    { v: '< 6 KB', l: { az: 'fayl ölçüsü', en: 'file size', ru: 'размер файла', ar: 'حجم الملف', tr: 'dosya boyutu' } },
    { v: '0', l: { az: 'kuki və izləmə', en: 'cookies and trackers', ru: 'куки и трекеров', ar: 'ملفات تعريف وتتبّع', tr: 'çerez ve izleme' } },
    { v: '5', l: { az: 'dil', en: 'languages', ru: 'языков', ar: 'لغات', tr: 'dil' } },
  ],
  steps: [
    { t: { az: 'Seçin', en: 'Choose', ru: 'Выберите', ar: 'اختر', tr: 'Seçin' }, d: { az: 'Şəhər, dil və işıqlı/qaranlıq görünüş.', en: 'City, language and light/dark look.', ru: 'Город, язык и светлое/тёмное оформление.', ar: 'المدينة واللغة والمظهر الفاتح أو الداكن.', tr: 'Şehir, dil ve açık/koyu görünüm.' } },
    { t: { az: 'Kopyalayın', en: 'Copy', ru: 'Скопируйте', ar: 'انسخ', tr: 'Kopyalayın' }, d: { az: '“Kopyala” düyməsi kodu panoya yazır.', en: 'The “Copy” button puts the code on your clipboard.', ru: 'Кнопка «Копировать» помещает код в буфер обмена.', ar: 'زر «نسخ» يضع الشيفرة في الحافظة.', tr: '“Kopyala” düğmesi kodu panoya alır.' } },
    { t: { az: 'Yapışdırın', en: 'Paste', ru: 'Вставьте', ar: 'الصق', tr: 'Yapıştırın' }, d: { az: 'Saytınızın HTML-ində blokun görünəcəyi yerə.', en: 'Into your site’s HTML where the widget should appear.', ru: 'В HTML сайта — туда, где должен быть блок.', ar: 'في HTML موقعك حيث تريد ظهور الأداة.', tr: 'Sitenizin HTML’inde bloğun görüneceği yere.' } },
  ],
  stepsLabel: { az: 'Üç addımda', en: 'In three steps', ru: 'В три шага', ar: 'في ثلاث خطوات', tr: 'Üç adımda' },
  colAttr: { az: 'Atribut', en: 'Attribute', ru: 'Атрибут', ar: 'الخاصية', tr: 'Öznitelik' },
  colMeaning: { az: 'Mənası və nümunə', en: 'Meaning and example', ru: 'Значение и пример', ar: 'المعنى والمثال', tr: 'Anlamı ve örnek' },
}

const LABELS = {
  az: {
    eyebrow: 'Saytlar üçün',
    title: 'Sayt üçün namaz vaxtları bloku',
    lead: 'Öz saytınıza bir sətirlik kodla bugünkü namaz vaxtlarını və növbəti namaza geri sayımı əlavə edin. Pulsuzdur, reklamsızdır, kukisiz işləyir.',
    genTitle: 'Kodu hazırlayın',
    city: 'Şəhər', language: 'Dil', theme: 'Görünüş', light: 'İşıqlı', dark: 'Qaranlıq',
    preview: 'Canlı görünüş', previewLoading: 'Yüklənir...', previewError: 'Bloku yükləmək alınmadı.',
    codeTitle: 'Yerləşdirmə kodu',
    codeHint: 'Bu kodu saytınızın HTML-ində blokun görünəcəyi yerə yapışdırın.',
    copy: 'Kopyala', copied: 'Kopyalandı',
    featTitle: 'Üstünlükləri',
    feats: [
      { title: 'Yüngül', text: 'Bir fayl, 6 KB-dan az, heç bir kitabxana yoxdur. Saytınızın üslubuna toxunmur — təcrid olunmuş blokda işləyir.' },
      { title: 'Dəqiq', text: 'Azərbaycan şəhərləri üçün vaxtlar Bakıdakı Əbu Bəkr məscidinin cədvəli ilə eyni üsulla birbaşa brauzerdə hesablanır. Digər şəhərlər üçün aladhan.com xidməti (Diyanət metodu) istifadə olunur.' },
      { title: 'Məxfi', text: 'Kuki yoxdur, izləmə yoxdur, ziyarətçilərinizin məlumatı toplanmır.' },
    ],
    attrsTitle: 'Parametrlər',
    attrs: {
      city: 'Azərbaycan şəhərinin kodu',
      coords: 'İstənilən yer üçün enlik, uzunluq və saat qurşağı',
      label: 'Blokda göstəriləcək ad',
      lang: 'Dil',
      theme: 'Görünüş: işıqlı və ya qaranlıq',
    },
    iframeTitle: 'Başqa yol:',
    iframeText: 'Saytınıza skript əlavə etmək mümkün deyilsə, məscid ekranının yığcam görünüşünü çərçivə kodu ilə yerləşdirin. Orada iqamə vaxtları da göstərilir.',
    iframeTitleAttr: 'Namaz vaxtları',
    tvTitle: 'Məscid televizoru üçün',
    tvText: 'Məscidinizdəki ekranda böyük saat, azan və iqamə vaxtları, cümə xütbəsi, ayə və zikrlər göstərin. Bütün ayarlar linkin içində saxlanılır.',
    tvBtn: 'Məscid ekranını aç',
    note: 'Vaxtlar astronomik hesablanır. Camaat namazının dəqiq vaxtını məscidinizdən öyrənin.',
  },
  en: {
    eyebrow: 'For websites',
    title: 'Prayer times widget',
    lead: 'Add today’s prayer times and a countdown to the next prayer to your own website with a single line of code. Free, ad-free and cookie-free.',
    genTitle: 'Build your code',
    city: 'City', language: 'Language', theme: 'Appearance', light: 'Light', dark: 'Dark',
    preview: 'Live preview', previewLoading: 'Loading...', previewError: 'Couldn’t load the widget.',
    codeTitle: 'Embed code',
    codeHint: 'Paste this code into your site’s HTML where the widget should appear.',
    copy: 'Copy', copied: 'Copied',
    featTitle: 'Why this widget',
    feats: [
      { title: 'Lightweight', text: 'One file, under 6 KB, no libraries. It doesn’t touch your site’s styles — it runs in an isolated block.' },
      { title: 'Accurate', text: 'For cities in Azerbaijan, times are calculated right in the browser using the same method as the Abu Bakr mosque timetable in Baku. Other cities use the aladhan.com service (Diyanet method).' },
      { title: 'Private', text: 'No cookies, no tracking, no data collected about your visitors.' },
    ],
    attrsTitle: 'Options',
    attrs: {
      city: 'City code in Azerbaijan',
      coords: 'Latitude, longitude and time zone for any place',
      label: 'Name shown in the widget',
      lang: 'Language',
      theme: 'Appearance: light or dark',
    },
    iframeTitle: 'Alternative:',
    iframeText: 'If you can’t add a script to your site, embed the compact view of the mosque display with an iframe. It also shows iqamah times.',
    iframeTitleAttr: 'Prayer times',
    tvTitle: 'For the mosque TV',
    tvText: 'Show a large clock, adhan and iqamah times, the Friday khutbah, verses and remembrance on your mosque’s screen. All settings are stored in the link.',
    tvBtn: 'Open the mosque display',
    note: 'Times are astronomically calculated. Check the exact congregation time with your mosque.',
  },
  ru: {
    eyebrow: 'Для сайтов',
    title: 'Виджет времени намаза',
    lead: 'Добавьте на свой сайт сегодняшнее время намаза и обратный отсчёт до следующего намаза одной строкой кода. Бесплатно, без рекламы и без файлов куки.',
    genTitle: 'Подготовьте код',
    city: 'Город', language: 'Язык', theme: 'Оформление', light: 'Светлое', dark: 'Тёмное',
    preview: 'Предпросмотр', previewLoading: 'Загрузка...', previewError: 'Не удалось загрузить виджет.',
    codeTitle: 'Код для вставки',
    codeHint: 'Вставьте этот код в HTML вашего сайта там, где должен появиться виджет.',
    copy: 'Копировать', copied: 'Скопировано',
    featTitle: 'Почему этот виджет',
    feats: [
      { title: 'Лёгкий', text: 'Один файл меньше 6 КБ, без библиотек. Не затрагивает стили вашего сайта — работает в изолированном блоке.' },
      // lang-ok[aladhan.com]: название сервиса
      { title: 'Точный', text: 'Для городов Азербайджана время рассчитывается прямо в браузере тем же методом, что и расписание мечети Абу Бакр в Баку. Для других городов используется сервис aladhan.com (метод Диянет).' },
      { title: 'Конфиденциальный', text: 'Без файлов куки и отслеживания, данные посетителей не собираются.' },
    ],
    attrsTitle: 'Параметры',
    attrs: {
      city: 'Код города в Азербайджане',
      coords: 'Широта, долгота и часовой пояс для любого места',
      label: 'Название, показываемое в виджете',
      lang: 'Язык',
      theme: 'Оформление: светлое или тёмное',
    },
    iframeTitle: 'Альтернатива:',
    iframeText: 'Если на сайт нельзя добавить скрипт, встройте компактный вид экрана мечети через встроенный фрейм. В нём также показывается время икамы.',
    iframeTitleAttr: 'Время намаза',
    tvTitle: 'Для телевизора в мечети',
    tvText: 'Показывайте на экране мечети большие часы, время азана и икамы, пятничную хутбу, аяты и зикры. Все настройки хранятся в ссылке.',
    tvBtn: 'Открыть экран мечети',
    note: 'Время рассчитано астрономически. Точное время коллективного намаза уточняйте в своей мечети.',
  },
  ar: {
    eyebrow: 'للمواقع',
    title: 'أداة مواقيت الصلاة',
    lead: 'أضف مواقيت الصلاة لهذا اليوم والعدّ التنازلي للصلاة القادمة إلى موقعك بسطر واحد من الشيفرة. مجانية، بلا إعلانات، وبلا ملفات تعريف الارتباط.',
    genTitle: 'جهّز الشيفرة',
    city: 'المدينة', language: 'اللغة', theme: 'المظهر', light: 'فاتح', dark: 'داكن',
    preview: 'معاينة مباشرة', previewLoading: 'جارٍ التحميل...', previewError: 'تعذّر تحميل الأداة.',
    codeTitle: 'شيفرة التضمين',
    codeHint: 'الصق هذه الشيفرة في صفحة موقعك حيث تريد أن تظهر الأداة.',
    copy: 'نسخ', copied: 'تم النسخ',
    featTitle: 'لماذا هذه الأداة',
    feats: [
      { title: 'خفيفة', text: 'ملف واحد أقل من 6 كيلوبايت، بلا مكتبات. لا تمسّ تنسيق موقعك، فهي تعمل في كتلة معزولة.' },
      // lang-ok[aladhan.com]: اسم الخدمة
      { title: 'دقيقة', text: 'لمدن أذربيجان تُحسب الأوقات في المتصفح نفسه بالطريقة نفسها التي يُعدّ بها جدول مسجد أبي بكر في باكو. وللمدن الأخرى تُستخدم خدمة aladhan.com (طريقة ديانت).' },
      { title: 'خصوصية', text: 'لا ملفات تعريف ارتباط، ولا تتبّع، ولا جمع لبيانات زوار موقعك.' },
    ],
    attrsTitle: 'الخيارات',
    attrs: {
      city: 'رمز المدينة في أذربيجان',
      coords: 'خط العرض وخط الطول والمنطقة الزمنية لأي مكان',
      label: 'الاسم الظاهر في الأداة',
      lang: 'اللغة',
      theme: 'المظهر: فاتح أو داكن',
    },
    iframeTitle: 'بديل:',
    iframeText: 'إن لم يكن بالإمكان إضافة سكربت إلى موقعك، فضمّن العرض المختصر لشاشة المسجد بإطار مضمّن. ويعرض أيضًا أوقات الإقامة.',
    iframeTitleAttr: 'مواقيت الصلاة',
    tvTitle: 'لشاشة المسجد',
    tvText: 'اعرض على شاشة مسجدك ساعة كبيرة وأوقات الأذان والإقامة وخطبة الجمعة وآيات وأذكارًا. جميع الإعدادات محفوظة في الرابط.',
    tvBtn: 'افتح شاشة المسجد',
    note: 'الأوقات محسوبة فلكيًا. تحقّق من وقت صلاة الجماعة في مسجدك.',
  },
  tr: {
    eyebrow: 'Web siteleri için',
    title: 'Namaz vakitleri aracı',
    lead: 'Kendi sitenize tek satır kodla bugünün namaz vakitlerini ve sıradaki namaza geri sayımı ekleyin. Ücretsiz, reklamsız ve çerezsiz.',
    genTitle: 'Kodu hazırlayın',
    city: 'Şehir', language: 'Dil', theme: 'Görünüm', light: 'Açık', dark: 'Koyu',
    preview: 'Canlı önizleme', previewLoading: 'Yükleniyor...', previewError: 'Araç yüklenemedi.',
    codeTitle: 'Yerleştirme kodu',
    codeHint: 'Bu kodu sitenizin HTML’inde aracın görüneceği yere yapıştırın.',
    copy: 'Kopyala', copied: 'Kopyalandı',
    featTitle: 'Neden bu araç',
    feats: [
      { title: 'Hafif', text: 'Tek dosya, 6 KB’tan küçük, hiçbir kütüphane yok. Sitenizin stiline dokunmaz; yalıtılmış bir blokta çalışır.' },
      { title: 'Hassas', text: 'Azerbaycan şehirleri için vakitler, Bakü’deki Ebu Bekir Camii takvimiyle aynı yöntemle doğrudan tarayıcıda hesaplanır. Diğer şehirlerde aladhan.com hizmeti (Diyanet yöntemi) kullanılır.' },
      { title: 'Gizli', text: 'Çerez yok, takip yok, ziyaretçilerinizin verisi toplanmaz.' },
    ],
    attrsTitle: 'Parametreler',
    attrs: {
      city: 'Azerbaycan şehrinin kodu',
      coords: 'Herhangi bir yer için enlem, boylam ve saat dilimi',
      label: 'Araçta gösterilecek ad',
      lang: 'Dil',
      theme: 'Görünüm: açık ya da koyu',
    },
    iframeTitle: 'Alternatif:',
    iframeText: 'Sitenize betik eklemek mümkün değilse cami ekranının sade görünümünü iframe ile yerleştirin. Orada kamet vakitleri de gösterilir.',
    iframeTitleAttr: 'Namaz vakitleri',
    tvTitle: 'Cami televizyonu için',
    tvText: 'Caminizin ekranında büyük saat, ezan ve kamet vakitleri, cuma hutbesi, ayet ve zikirler gösterin. Tüm ayarlar bağlantının içinde saklanır.',
    tvBtn: 'Cami ekranını aç',
    note: 'Vakitler astronomik olarak hesaplanır. Cemaat namazının kesin saatini caminizden öğrenin.',
  },
}

// Üstünlük kartlarının ikonları (LABELS.*.feats ilə eyni sırada)
const FEAT_ICONS = ['bolt', 'target', 'shield']

const LANG_NAMES = { az: 'Azərbaycanca', en: 'English', ru: 'Русский', ar: 'العربية', tr: 'Türkçe' }

// Parametr cədvəli: kod və nümunə dildən asılı deyil
const ATTRS = [
  { key: 'city', code: 'data-city', ex: 'Baku · Ganja · Sheki · Lankaran' },
  { key: 'coords', code: 'data-lat · data-lng · data-tz', ex: '41.0082 · 28.9784 · Europe/Istanbul' },
  { key: 'label', code: 'data-label', ex: 'Bakı' },
  { key: 'lang', code: 'data-lang', ex: 'az · en · ru · ar · tr' },
  { key: 'theme', code: 'data-theme', ex: 'light · dark' },
]

const CITY_BY_ID = new Map(PRAYER_CITIES.map(c => [c.id, c]))
const attrEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Seçimdən vidcetin parametrləri. */
function widgetOpts(cityId, lang, theme) {
  const c = CITY_BY_ID.get(cityId) || CITY_BY_ID.get('Baku')
  const label = c.label[lang] || c.label.en
  return c.country === 'AZ'
    ? { city: c.id, lang, theme, label }
    : { lat: String(c.lat), lng: String(c.lng), tz: c.tz, lang, theme, label }
}

function embedCode(opts) {
  const order = ['city', 'lat', 'lng', 'tz', 'label', 'lang', 'theme']
  const attrs = order.filter(k => opts[k]).map(k => `data-${k}="${attrEsc(opts[k])}"`).join(' ')
  return `<script src="${SITE}${SCRIPT_SRC}" ${attrs} async></script>`
}

function iframeQuery(cityId, lang, theme) {
  return serializeConfig({ city: cityId, lang, theme }, { compact: true })
}

/** Vidcet skriptini səhifəyə bir dəfə yüklə (data-manual — özü göstərmir). */
let scriptPromise = null
function loadWidgetScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('ssr'))
  if (window.MuslimsWidget) return Promise.resolve(window.MuslimsWidget)
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.setAttribute('data-manual', '')
    s.onload = () => (window.MuslimsWidget ? resolve(window.MuslimsWidget) : reject(new Error('no api')))
    s.onerror = () => { scriptPromise = null; reject(new Error('load')) }
    document.head.appendChild(s)
  })
  return scriptPromise
}

function CopyBox({ code, l, id }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* panoya yazmaq olmadı — mətn seçilə bilir */ }
  }
  return (
    <div className="wg-code">
      <pre id={id} className="wg-pre" dir="ltr" tabIndex={0}><code>{code}</code></pre>
      <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm wg-copy" onClick={copy} aria-describedby={id}>
        <Icon name={copied ? 'check' : 'copy'} className="ui-btn__icon" /> {copied ? l.copied : l.copy}
      </button>
      <span className="ui-sr-only" role="status">{copied ? l.copied : ''}</span>
    </div>
  )
}

export default function WidgetPage({ setPage }) {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.en
  const P = (o) => o[lang] || o.en

  const [city, setCity] = useState(() => {
    try { const loc = getPrayerLocation(); return CITY_BY_ID.has(loc?.id) ? loc.id : 'Baku' } catch { return 'Baku' }
  })
  const [wLang, setWLang] = useState(lang)
  const [theme, setTheme] = useState('light')
  useEffect(() => { setWLang(lang) }, [lang])

  const opts = useMemo(() => widgetOpts(city, wLang, theme), [city, wLang, theme])
  const code = useMemo(() => embedCode(opts), [opts])
  const tvQuery = useMemo(() => iframeQuery(city, wLang, theme), [city, wLang, theme])
  const iframeCode = `<iframe src="${SITE}${TV_PATH}?${attrEsc(tvQuery)}" width="100%" height="280" style="border:0;border-radius:12px" title="${attrEsc(l.iframeTitleAttr)}" loading="lazy"></iframe>`

  // ── Canlı görünüş ──
  const previewRef = useRef(null)
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    let alive = true
    let destroy = null
    loadWidgetScript()
      .then(api => {
        if (!alive || !previewRef.current) return
        destroy = api.mount(previewRef.current, opts)
        setStatus('ready')
      })
      .catch(() => { if (alive) setStatus('error') })
    return () => { alive = false; if (typeof destroy === 'function') destroy() }
  }, [opts])

  const groups = useMemo(() => {
    const map = new Map()
    for (const c of PRAYER_CITIES) {
      if (!map.has(c.country)) map.set(c.country, [])
      map.get(c.country).push(c)
    }
    return [...map.entries()]
  }, [])

  return (
    <div className="wg-page">
      <header className="ui-page-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <Breadcrumb setPage={setPage} current={l.title} />
          <span className="ui-eyebrow">{l.eyebrow}</span>
          <h1 className="ui-display">{l.title}</h1>
          <p className="ui-lead">{l.lead}</p>
          <p className="ui-page-hero__how"><Icon name="info" size={16} /> {P(V3.how)}</p>
          <ul className="ui-page-hero__stats">
            {V3.stats.map(st => <li key={st.v}><b dir="ltr">{st.v}</b><span>{P(st.l)}</span></li>)}
          </ul>
        </div>
      </header>

      <div className="ui-container wg-wrap">
        {/* ── 3 addım ── */}
        <ol className="ui-steps ui-steps--row wg-steps" aria-label={P(V3.stepsLabel)} data-reveal="stagger">
          {V3.steps.map((st, i) => (
            <li key={i} className="ui-step">
              <span className="ui-step__n" aria-hidden="true">{i + 1}</span>
              <div className="ui-step__body">
                <p className="ui-step__title">{P(st.t)}</p>
                <p className="ui-step__text">{P(st.d)}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* ── Generator + canlı görünüş ── */}
        <section className="wg-gen ui-card" aria-labelledby="wg-gen-title" data-reveal>
          <div className="wg-form">
            <h2 id="wg-gen-title" className="ui-title ui-title--sm">{l.genTitle}</h2>

            <label className="ui-field">
              <span className="ui-field__label">{l.city}</span>
              <select className="ui-select" value={city} onChange={(e) => setCity(e.target.value)}>
                {groups.map(([cc, list]) => (
                  <optgroup key={cc} label={COUNTRY_NAMES[cc]?.[lang] || cc}>
                    {list.map(c => <option key={c.id} value={c.id}>{c.label[lang] || c.label.en}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>

            <div className="ui-field">
              <span className="ui-field__label" id="wg-lang-l">{l.language}</span>
              <div className="wg-chips" role="group" aria-labelledby="wg-lang-l">
                {Object.keys(LANG_NAMES).map(code => (
                  <button key={code} type="button" className="ui-chip" lang={code} aria-pressed={wLang === code} onClick={() => setWLang(code)}>
                    {LANG_NAMES[code]}
                  </button>
                ))}
              </div>
            </div>

            <div className="ui-field">
              <span className="ui-field__label" id="wg-theme-l">{l.theme}</span>
              <div className="ui-segmented wg-seg" role="radiogroup" aria-labelledby="wg-theme-l">
                <button type="button" role="radio" aria-checked={theme === 'light'} onClick={() => setTheme('light')}>
                  <Icon name="sun" size={16} /> {l.light}
                </button>
                <button type="button" role="radio" aria-checked={theme === 'dark'} onClick={() => setTheme('dark')}>
                  <Icon name="moon" size={16} /> {l.dark}
                </button>
              </div>
            </div>
          </div>

          <div className="wg-preview">
            <span className="wg-preview-label">{l.preview}</span>
            <div className="wg-preview-stage" aria-live="polite">
              <div ref={previewRef} className="wg-preview-host" />
              {status === 'loading' && <p className="wg-preview-msg">{l.previewLoading}</p>}
              {status === 'error' && <p className="wg-preview-msg" role="alert">{l.previewError}</p>}
            </div>
          </div>

          <div className="wg-embed">
            <h3 className="wg-h3">{l.codeTitle}</h3>
            <p className="wg-hint">{l.codeHint}</p>
            <CopyBox code={code} l={l} id="wg-code-script" />
          </div>
        </section>

        {/* ── Üstünlüklər ── */}
        <section className="wg-section" aria-labelledby="wg-feat-title">
          <h2 id="wg-feat-title" className="ui-title ui-title--sm" data-reveal>{l.featTitle}</h2>
          <ul className="ui-tiles wg-feats" style={{ '--ui-tiles-min': '240px' }} data-reveal="stagger">
            {l.feats.map((f, i) => (
              <li key={f.title} className="ui-tile wg-feat">
                <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={FEAT_ICONS[i]} /></span>
                <h3 className="ui-tile__title">{f.title}</h3>
                <p className="ui-tile__text">{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Parametrlər ── */}
        <section className="wg-section" aria-labelledby="wg-attrs-title">
          <h2 id="wg-attrs-title" className="ui-title ui-title--sm" data-reveal>{l.attrsTitle}</h2>
          <div className="ui-table-wrap" tabIndex={0} role="region" aria-labelledby="wg-attrs-title" data-reveal>
            <table className="ui-table wg-table">
              <thead>
                <tr><th scope="col">{P(V3.colAttr)}</th><th scope="col">{P(V3.colMeaning)}</th></tr>
              </thead>
              <tbody>
                {ATTRS.map(a => (
                  <tr key={a.key}>
                    <th scope="row"><code dir="ltr">{a.code}</code></th>
                    <td>
                      {l.attrs[a.key]}
                      <span className="wg-ex" dir="ltr">{a.ex}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── iframe ── */}
        <section className="wg-section wg-iframe" aria-labelledby="wg-iframe-title">
          <h2 id="wg-iframe-title" className="ui-title ui-title--sm" data-reveal>{l.iframeTitle} <code dir="ltr" className="wg-tag">iframe</code></h2>
          <p className="wg-hint">{l.iframeText}</p>
          <CopyBox code={iframeCode} l={l} id="wg-code-iframe" />
          <div className="wg-iframe-frame">
            <iframe
              key={tvQuery}
              src={`${TV_PATH}?${tvQuery}`}
              title={l.iframeTitleAttr}
              loading="lazy"
            />
          </div>
        </section>

        {/* ── Məscid ekranı ── */}
        <section className="ui-card ui-card--inverse wg-tv" aria-labelledby="wg-tv-title" data-reveal>
          <div className="ui-pattern" aria-hidden="true" />
          <span className="ui-icon-tile ui-icon-tile--lg wg-tv-icon" aria-hidden="true"><Icon name="mosques" /></span>
          <div className="wg-tv-text">
            <h2 id="wg-tv-title" className="wg-tv-title">{l.tvTitle}</h2>
            <p>{l.tvText}</p>
          </div>
          {/* Adi link (SPA keçidi deyil): ayarlar URL sorğusunda ötürülür */}
          <a className="ui-btn ui-btn--inverse" href={`${TV_PATH}?${serializeConfig({ city, lang: wLang, theme: 'dark' })}`}>
            {l.tvBtn} <Icon name="arrow" className="ui-btn__icon ui-btn__icon--end ui-flip-rtl" />
          </a>
        </section>

        <p className="wg-note" role="note">{l.note}</p>
      </div>
    </div>
  )
}
