import { useLang } from '../contexts/LangContext'
import LegalDocument from '../components/LegalDocument'

// ═══════════════════════════════════════════════════════
// Mənbələr və lisenziyalar (atribusiya)
//
// Məcburi atribusiyalar: Tanzil (CC BY 3.0 — mənbə + tanzil.net linki,
// mətn dəyişdirilmir), OpenStreetMap (ODbL — "© OpenStreetMap contributors"),
// Open-Meteo və GeoNames (CC BY 4.0), ExchangeRate-API ("Rates By Exchange
// Rate API"). Şriftlər SIL OFL 1.1; kitabxanalar MIT / Apache-2.0.
// Tərcümə və qiraət səslərinin hüquqlarını İDDİA ETMİRİK — "müvafiq müəlliflərə
// və naşirlərə məxsusdur".
// Yeni xarici mənbə (API, səs CDN-i, şrift, kitabxana) əlavə olunanda bura da yaz.
// Kart sahələri (name / by / note) ya sətir, ya 5 dilli obyektdir.
// ═══════════════════════════════════════════════════════

const CC_BY_3 = 'https://creativecommons.org/licenses/by/3.0/'
const CC_BY_4 = 'https://creativecommons.org/licenses/by/4.0/'
const OFL = 'https://openfontlicense.org/'
const MIT = 'MIT'
const APACHE = 'Apache-2.0'

// ── Quran ──
const QURAN_TEXT = [
  {
    name: 'Tanzil Quran Text', url: 'https://tanzil.net/', license: 'CC BY 3.0', licenseUrl: CC_BY_3,
    by: 'Copyright © 2007–2021 Tanzil Project',
    note: {
      az: 'Quranın ərəbcə mətni (Osmani və sadə yazılış) Tanzil layihəsindən götürülüb və dəyişdirilmədən göstərilir. Yeniliklər üçün: tanzil.net.',
      en: 'The Arabic text of the Quran (Uthmani and simple script) comes from the Tanzil Project and is shown unchanged. For updates, see tanzil.net.',
      ru: 'Арабский текст Корана (османское и упрощённое написание) взят из проекта {tanzil} и показывается без изменений. Обновления: tanzil.net.',
      ar: 'النص العربي للقرآن (بالرسم العثماني والإملائي) مأخوذ من مشروع {tanzil} ويُعرض دون أي تعديل. وللتحديثات: tanzil.net.',
      tr: 'Kur’an’ın Arapça metni (Osmanî ve sade yazım) Tanzil projesinden alınmıştır ve değiştirilmeden gösterilir. Güncellemeler için: tanzil.net.',
    },
  },
  {
    name: 'AlQuran Cloud API', url: 'https://alquran.cloud/',
    note: {
      az: 'Quran mətni, tərcümələr, təfsir və ayə axtarışı bu açıq API vasitəsilə yüklənir.',
      en: 'The Quran text, translations, tafsir and verse search are loaded through this open API.',
      ru: 'Текст Корана, переводы, тафсир и поиск по аятам загружаются через этот открытый интерфейс.',
      ar: 'يُحمَّل نص القرآن والترجمات والتفسير والبحث في الآيات عبر هذه الواجهة البرمجية المفتوحة.',
      tr: 'Kur’an metni, mealler, tefsir ve ayet arama bu açık API üzerinden yüklenir.',
    },
  },
]

const TRANSLATIONS = [
  {
    name: { az: 'Vasim Məmmədəliyev və Ziya Bünyadov', en: 'Vasim Mammadaliyev and Ziya Bunyadov', ru: 'Васим Мамедалиев и Зия Буниятов', ar: 'واسم محمد علييف وضياء بنيادوف', tr: 'Vasim Memmedaliyev ve Ziya Bünyadov' },
    url: 'https://alquran.cloud/translations',
    by: { az: 'Azərbaycan dilinə məna tərcüməsi', en: 'Translation of the meaning into Azerbaijani', ru: 'Перевод смыслов на азербайджанский язык', ar: 'ترجمة معاني القرآن إلى اللغة الأذربيجانية', tr: 'Azerbaycan Türkçesine meal' },
  },
  {
    name: { az: 'Məhəmməd Əsəd', en: 'Muhammad Asad', ru: 'Мухаммад Асад', ar: 'محمد أسد', tr: 'Muhammed Esed' },
    url: 'https://alquran.cloud/translations',
    by: { az: 'İngilis dilinə məna tərcüməsi', en: '“The Message of the Qur’an” — English translation of the meaning', ru: 'Перевод смыслов на английский язык', ar: 'ترجمة معاني القرآن إلى اللغة الإنجليزية', tr: 'İngilizce meal' },
  },
  {
    name: { az: 'Elmir Quliyev', en: 'Elmir Kuliev', ru: 'Эльмир Кулиев', ar: 'إلمير قلييف', tr: 'Elmir Kuliyev' },
    url: 'https://alquran.cloud/translations',
    by: { az: 'Rus dilinə məna tərcüməsi', en: 'Russian translation of the meaning', ru: 'Перевод смыслов на русский язык', ar: 'ترجمة معاني القرآن إلى اللغة الروسية', tr: 'Rusça meal' },
  },
  {
    name: { az: 'Türkiyə Diyanət İşləri Başqanlığı', en: 'Presidency of Religious Affairs of Türkiye (Diyanet)', ru: 'Управление по делам религии Турции (Диянет)', ar: 'رئاسة الشؤون الدينية التركية', tr: 'Diyanet İşleri Başkanlığı' },
    url: 'https://alquran.cloud/translations',
    by: { az: 'Türk dilinə məna tərcüməsi', en: 'Turkish translation of the meaning', ru: 'Перевод смыслов на турецкий язык', ar: 'ترجمة معاني القرآن إلى اللغة التركية', tr: 'Türkçe meal' },
  },
  {
    name: { az: 'Əl-Təfsir əl-Müyəssər', en: 'Al-Tafsir al-Muyassar', ru: 'Тафсир аль-Муяссар', ar: 'التفسير الميسر', tr: 'Tefsîr-i Müyesser' },
    url: 'https://alquran.cloud/translations',
    by: { az: 'Kral Fəhd Quran Çap Kompleksi — ərəb dilində qısa təfsir', en: 'King Fahd Glorious Quran Printing Complex — a concise tafsir in Arabic', ru: 'Комплекс короля Фахда по изданию Корана — краткий тафсир на арабском языке', ar: 'مجمع الملك فهد لطباعة المصحف الشريف', tr: 'Kral Fahd Kur’an-ı Kerim Basım Kompleksi — Arapça muhtasar tefsir' },
  },
]

const AUDIO = [
  {
    name: 'Islamic Network CDN', url: 'https://islamic.network/',
    note: {
      az: 'Qiraət səslərinin əsas mənbəyi (AlQuran Cloud-un səs serveri).',
      en: 'The main source of the recitation audio (the AlQuran Cloud audio server).',
      ru: 'Основной источник аудиозаписей чтения (аудиосервер {alquran}).',
      ar: 'المصدر الرئيسي لتسجيلات التلاوة (خادم الصوت التابع لـ {alquran}).',
      tr: 'Kıraat kayıtlarının ana kaynağı ({alquran} ses sunucusu).',
    },
  },
  {
    name: 'Quran.com', url: 'https://quran.com/',
    note: {
      az: 'Bəzi qarilər üçün əlavə və ehtiyat səs mənbəyi.',
      en: 'An additional and fallback audio source for some reciters.',
      ru: 'Дополнительный и резервный источник аудио для некоторых чтецов.',
      ar: 'مصدر صوتي إضافي واحتياطي لبعض القرّاء.',
      tr: 'Bazı kâriler için ek ve yedek ses kaynağı.',
    },
  },
]

// ── Namaz vaxtları ──
const PRAYER = [
  {
    name: 'AlAdhan Prayer Times API', url: 'https://aladhan.com/prayer-times-api',
    note: {
      az: 'Namaz vaxtları, imsakiyyə və hicri tarixlər seçilmiş yerin koordinatlarına görə hesablanır (standart metod — Türkiyə Diyanət İşləri Başqanlığı).',
      en: 'Prayer times, the imsakiyah and Hijri dates are calculated from the chosen location’s coordinates (default method: Presidency of Religious Affairs of Türkiye).',
      ru: 'Время намаза, имсакия и даты хиджры рассчитываются по координатам выбранного места (метод по умолчанию — Управление по делам религии Турции).',
      ar: 'تُحسب مواقيت الصلاة والإمساكية والتواريخ الهجرية بحسب إحداثيات الموقع المختار (الطريقة الافتراضية: رئاسة الشؤون الدينية التركية).',
      tr: 'Namaz vakitleri, imsakiye ve hicri tarihler seçilen konumun koordinatlarına göre hesaplanır (varsayılan yöntem: Diyanet İşleri Başkanlığı).',
    },
  },
]

// ── Xəritə və yer ──
const MAPS = [
  {
    name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/copyright', license: 'ODbL 1.0', licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
    by: { az: '© OpenStreetMap iştirakçıları', en: '© OpenStreetMap contributors', ru: '© участники OpenStreetMap', ar: '© المساهمون في OpenStreetMap', tr: '© OpenStreetMap katkıda bulunanlar' },
    note: {
      az: 'Yaxınlıqdakı məscidlər haqqında məlumat (ad, yer, ünvan) OpenStreetMap verilənlər bazasındandır.',
      en: 'Information about nearby mosques (name, location, address) comes from the OpenStreetMap database.',
      ru: 'Сведения о ближайших мечетях (название, расположение, адрес) взяты из базы данных OpenStreetMap.',
      ar: 'معلومات المساجد القريبة (الاسم والموقع والعنوان) مأخوذة من قاعدة بيانات OpenStreetMap.',
      tr: 'Yakındaki camilere ait bilgiler (ad, konum, adres) OpenStreetMap veri tabanından alınır.',
    },
  },
  {
    name: 'Overpass API', url: 'https://overpass-api.de/',
    note: {
      az: 'OpenStreetMap məlumatlarında axtarış xidməti (ehtiyat server: {overpassmirror}).',
      en: 'The search service for OpenStreetMap data (fallback server: {overpassmirror}).',
      ru: 'Сервис поиска по данным OpenStreetMap (резервный сервер — {overpassmirror}).',
      ar: 'خدمة البحث في بيانات OpenStreetMap (الخادم الاحتياطي: {overpassmirror}).',
      tr: 'OpenStreetMap verilerinde arama hizmeti (yedek sunucu: {overpassmirror}).',
    },
  },
  {
    name: 'Open-Meteo Geocoding API', url: 'https://open-meteo.com/', license: 'CC BY 4.0', licenseUrl: CC_BY_4,
    by: 'Open-Meteo.com',
    note: {
      az: 'Dünya şəhərlərinin axtarışı (ad, koordinatlar, saat qurşağı).',
      en: 'Worldwide city search (name, coordinates, time zone).',
      ru: 'Поиск городов мира (название, координаты, часовой пояс).',
      ar: 'البحث عن مدن العالم (الاسم والإحداثيات والمنطقة الزمنية).',
      tr: 'Dünya şehirlerinde arama (ad, koordinatlar, saat dilimi).',
    },
  },
  {
    name: 'GeoNames', url: 'https://www.geonames.org/', license: 'CC BY 4.0', licenseUrl: CC_BY_4,
    note: {
      az: 'Şəhər axtarışının əsasında duran coğrafi adlar bazası.',
      en: 'The geographical names database behind the city search.',
      ru: 'База географических названий, на которой основан поиск городов.',
      ar: 'قاعدة بيانات الأسماء الجغرافية التي يعتمد عليها البحث عن المدن.',
      tr: 'Şehir aramasının dayandığı coğrafi adlar veri tabanı.',
    },
  },
]

// ── Digər məlumat ──
const OTHER = [
  {
    name: 'ExchangeRate-API', url: 'https://www.exchangerate-api.com/',
    by: 'Rates By Exchange Rate API',
    note: {
      az: 'Zəkat kalkulyatorunda valyuta məzənnələri.',
      en: 'Currency exchange rates in the zakat calculator.',
      ru: 'Курсы валют в калькуляторе закята.',
      ar: 'أسعار صرف العملات في حاسبة الزكاة.',
      tr: 'Zekât hesaplayıcısındaki döviz kurları.',
    },
  },
  {
    name: 'YouTube', url: 'https://www.youtube.com/t/terms',
    note: {
      az: 'Videolar YouTube vasitəsilə göstərilir; hüquqları müəlliflərinə və kanallarına məxsusdur.',
      en: 'Videos are shown through YouTube; their rights belong to their creators and channels.',
      ru: 'Видео показываются через {youtube}; права на них принадлежат авторам и каналам.',
      ar: 'تُعرض الفيديوهات عبر {youtube}، وحقوقها لأصحابها وقنواتهم.',
      tr: 'Videolar YouTube üzerinden gösterilir; hakları sahiplerine ve kanallarına aittir.',
    },
  },
]

// ── Şriftlər (öz serverimizdən verilir) ──
const FONTS = [
  { name: 'Inter', url: 'https://rsms.me/inter/', license: 'SIL OFL 1.1', licenseUrl: OFL, by: 'Rasmus Andersson' },
  { name: 'Literata', url: 'https://github.com/googlefonts/literata', license: 'SIL OFL 1.1', licenseUrl: OFL, by: 'TypeTogether' },
  { name: 'Amiri', url: 'https://www.amirifont.org/', license: 'SIL OFL 1.1', licenseUrl: OFL, by: 'Khaled Hosny' },
  { name: 'IBM Plex Sans Arabic', url: 'https://github.com/IBM/plex', license: 'SIL OFL 1.1', licenseUrl: OFL, by: 'IBM Corp.' },
]

// ── Açıq mənbə proqram təminatı (package.json-dakı əsas asılılıqlar) ──
const SOFTWARE = [
  { name: 'React, React DOM', url: 'https://react.dev/', license: MIT, licenseUrl: 'https://github.com/facebook/react/blob/main/LICENSE', by: 'Meta Platforms, Inc.' },
  { name: 'React Router', url: 'https://reactrouter.com/', license: MIT, licenseUrl: 'https://github.com/remix-run/react-router/blob/main/LICENSE.md', by: 'Remix Software Inc.' },
  { name: 'Firebase JavaScript SDK', url: 'https://github.com/firebase/firebase-js-sdk', license: APACHE, licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0', by: 'Google LLC' },
  { name: 'Vite', url: 'https://vite.dev/', license: MIT, licenseUrl: 'https://github.com/vitejs/vite/blob/main/LICENSE', by: 'VoidZero Inc. & Vite contributors' },
  { name: 'Express, cors, express-rate-limit', url: 'https://expressjs.com/', license: MIT, licenseUrl: 'https://github.com/expressjs/express/blob/master/LICENSE' },
  { name: 'Firebase Admin SDK', url: 'https://github.com/firebase/firebase-admin-node', license: APACHE, licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0', by: 'Google LLC' },
  { name: 'Expo, React Native', url: 'https://expo.dev/', license: MIT, licenseUrl: 'https://github.com/expo/expo/blob/main/LICENSE' },
]

const DOC = {
  az: {
    title: 'Mənbələr və lisenziyalar',
    lead: '{brand} bir çox açıq mənbəyə və xidmətə əsaslanır. Bu səhifədə onları və lisenziyalarını göstəririk — müəlliflərə təşəkkür edirik.',
    sections: {
      intro: { h: 'Ümumi qeyd', body: [
        'Aşağıda adı çəkilən mətnlərin, səslərin, məlumatların, şriftlərin və proqramların hüquqları **müvafiq müəlliflərə, naşirlərə və hüquq sahiblərinə məxsusdur**. {brand} onlara sahiblik iddia etmir və onlardan lisenziya şərtlərinə uyğun istifadə edir.',
        'Hüquq sahibisinizsə və atribusiyada xəta görürsünüzsə, [bizə yazın]({toContact}) — tez bir zamanda düzəldəcəyik.',
      ] },
      quran: { h: 'Quran mətni', body: [{ credits: QURAN_TEXT }] },
      translations: { h: 'Quran tərcümələri və təfsir', body: [
        'Tərcümələr {alquran} vasitəsilə yüklənir və **məna tərcüməsidir**. Müəllif hüquqları tərcüməçilərə və naşirlərə məxsusdur.',
        { credits: TRANSLATIONS },
      ] },
      audio: { h: 'Qiraət səsləri', body: [
        'Qiraət səs yazılarının hüquqları qarilərə və ya onların hüquq varislərinə məxsusdur; onlar pulsuz, qeyri-kommersiya yayımı üçün təqdim olunub.',
        { credits: AUDIO },
      ] },
      hadith: { h: 'Hədislər', body: [
        'Hədislər klassik məcmuələrdən götürülüb, mənbəyi hər hədisin altında göstərilir. Əsas mənbələr: Səhih əl-Buxari, Səhih Müslim, Sünən ət-Tirmizi, Sünən Əbu Davud, Müsnəd Əhməd, Sünən İbn Macə, Sünən ən-Nəsai və Müvatta Malik.',
      ] },
      prayer: { h: 'Namaz vaxtları və təqvim', body: [
        { credits: PRAYER },
        'Təqvim səhifəsindəki hicri tarix brauzerin daxili Ümmül-Qura təqvimi ilə hesablanır.',
      ] },
      maps: { h: 'Xəritə və yer məlumatı', body: [{ credits: MAPS }] },
      other: { h: 'Digər məlumatlar və videolar', body: [{ credits: OTHER }] },
      fonts: { h: 'Şriftlər', body: [
        'Bütün şriftlər {ofl} ilə yayılır və saytın öz serverindən verilir.',
        { credits: FONTS },
      ] },
      software: { h: 'Açıq mənbə proqram təminatı', body: [
        'Sayt, server və mobil tətbiq aşağıdakı açıq mənbə layihələri ilə qurulub. Lisenziya mətnləri layihələrin öz səhifələrindədir.',
        { credits: SOFTWARE },
      ] },
      contact: { h: 'Əlaqə', body: [{ contact: true }] },
    },
  },

  en: {
    title: 'Sources & Licenses',
    lead: '{brand} is built on many open sources and services. This page lists them and their licenses — with our thanks to their authors.',
    sections: {
      intro: { h: 'General note', body: [
        'Rights to the texts, recordings, data, fonts and software listed below **belong to their respective authors, publishers and rights holders**. {brand} claims no ownership of them and uses them in accordance with their licence terms.',
        'If you are a rights holder and notice an error in the attribution, [write to us]({toContact}) and we will correct it promptly.',
      ] },
      quran: { h: 'Quran text', body: [{ credits: QURAN_TEXT }] },
      translations: { h: 'Quran translations and tafsir', body: [
        'Translations are loaded through {alquran} and are **translations of the meaning**. Copyright belongs to the translators and publishers.',
        { credits: TRANSLATIONS },
      ] },
      audio: { h: 'Recitations', body: [
        'Rights to the recitation recordings belong to the reciters or their successors in title; they are made available for free, non-commercial distribution.',
        { credits: AUDIO },
      ] },
      hadith: { h: 'Hadith', body: [
        'Hadith are taken from the classical collections, and the source is shown under each one. Main sources: Sahih al-Bukhari, Sahih Muslim, Sunan al-Tirmidhi, Sunan Abi Dawud, Musnad Ahmad, Sunan Ibn Majah, Sunan al-Nasa’i and Muwatta Malik.',
      ] },
      prayer: { h: 'Prayer times and calendar', body: [
        { credits: PRAYER },
        'The Hijri date on the calendar page is calculated with the browser’s built-in Umm al-Qura calendar.',
      ] },
      maps: { h: 'Maps and location data', body: [{ credits: MAPS }] },
      other: { h: 'Other data and videos', body: [{ credits: OTHER }] },
      fonts: { h: 'Fonts', body: [
        'All fonts are distributed under the {ofl} and are served from the site’s own server.',
        { credits: FONTS },
      ] },
      software: { h: 'Open-source software', body: [
        'The website, server and mobile app are built with the open-source projects below. The licence texts are available on each project’s own page.',
        { credits: SOFTWARE },
      ] },
      contact: { h: 'Contact', body: [{ contact: true }] },
    },
  },

  ru: {
    title: 'Источники и лицензии',
    lead: '{brand} опирается на множество открытых источников и сервисов. На этой странице мы перечисляем их и их лицензии — с благодарностью авторам.',
    sections: {
      intro: { h: 'Общее примечание', body: [
        'Права на перечисленные ниже тексты, аудиозаписи, данные, шрифты и программы **принадлежат соответствующим авторам, издателям и правообладателям**. {brand} не претендует на них и использует их в соответствии с условиями лицензий.',
        'Если вы правообладатель и заметили ошибку в указании авторства, [напишите нам]({toContact}) — мы быстро её исправим.',
      ] },
      quran: { h: 'Текст Корана', body: [{ credits: QURAN_TEXT }] },
      translations: { h: 'Переводы Корана и тафсир', body: [
        'Переводы загружаются через {alquran} и являются **переводами смыслов**. Авторские права принадлежат переводчикам и издателям.',
        { credits: TRANSLATIONS },
      ] },
      audio: { h: 'Аудиозаписи чтения', body: [
        'Права на аудиозаписи чтения принадлежат чтецам или их правопреемникам; записи предоставлены для бесплатного некоммерческого распространения.',
        { credits: AUDIO },
      ] },
      hadith: { h: 'Хадисы', body: [
        'Хадисы взяты из классических сборников, источник указан под каждым хадисом. Основные источники: «Сахих» аль-Бухари, «Сахих» Муслима, «Сунан» ат-Тирмизи, «Сунан» Абу Дауда, «Муснад» Ахмада, «Сунан» Ибн Маджи, «Сунан» ан-Насаи и «Муватта» Малика.',
      ] },
      prayer: { h: 'Время намаза и календарь', body: [
        { credits: PRAYER },
        'Дата по хиджре на странице календаря рассчитывается встроенным в браузер календарём Умм аль-Кура.',
      ] },
      maps: { h: 'Карты и данные о местоположении', body: [{ credits: MAPS }] },
      other: { h: 'Прочие данные и видео', body: [{ credits: OTHER }] },
      fonts: { h: 'Шрифты', body: [
        'Все шрифты распространяются по лицензии {ofl} и загружаются с собственного сервера сайта.',
        { credits: FONTS },
      ] },
      software: { h: 'Программное обеспечение с открытым кодом', body: [
        'Сайт, сервер и мобильное приложение построены на перечисленных ниже открытых проектах. Тексты лицензий доступны на страницах самих проектов.',
        { credits: SOFTWARE },
      ] },
      contact: { h: 'Контакты', body: [{ contact: true }] },
    },
  },

  ar: {
    title: 'المصادر والتراخيص',
    lead: 'يعتمد {brand} على كثير من المصادر والخدمات المفتوحة. نذكرها في هذه الصفحة مع تراخيصها — شاكرين لأصحابها.',
    sections: {
      intro: { h: 'ملاحظة عامة', body: [
        'حقوق النصوص والتسجيلات والبيانات والخطوط والبرمجيات المذكورة أدناه **محفوظة لأصحابها من المؤلفين والناشرين وأصحاب الحقوق**. ولا يدّعي {brand} ملكيتها، ويستخدمها وفق شروط تراخيصها.',
        'إذا كنت صاحب حق ولاحظت خطأً في نسبة العمل إلى صاحبه [فراسلنا]({toContact})، وسنصحّحه سريعاً.',
      ] },
      quran: { h: 'نص القرآن', body: [{ credits: QURAN_TEXT }] },
      translations: { h: 'ترجمات معاني القرآن والتفسير', body: [
        'تُحمَّل الترجمات عبر {alquran}، وهي **ترجمات لمعاني القرآن**. وحقوقها محفوظة للمترجمين والناشرين.',
        { credits: TRANSLATIONS },
      ] },
      audio: { h: 'تسجيلات التلاوة', body: [
        'حقوق تسجيلات التلاوة محفوظة للقرّاء أو لورثتهم، وقد أُتيحت للنشر المجاني غير التجاري.',
        { credits: AUDIO },
      ] },
      hadith: { h: 'الأحاديث', body: [
        'الأحاديث مأخوذة من كتب السنة المعتمدة، ويُذكر مصدر كل حديث تحته. أهم المصادر: صحيح البخاري، وصحيح مسلم، وسنن الترمذي، وسنن أبي داود، ومسند أحمد، وسنن ابن ماجه، وسنن النسائي، وموطأ مالك.',
      ] },
      prayer: { h: 'مواقيت الصلاة والتقويم', body: [
        { credits: PRAYER },
        'يُحسب التاريخ الهجري في صفحة التقويم بتقويم أم القرى المدمج في المتصفح.',
      ] },
      maps: { h: 'الخرائط وبيانات الموقع', body: [{ credits: MAPS }] },
      other: { h: 'بيانات أخرى ومقاطع الفيديو', body: [{ credits: OTHER }] },
      fonts: { h: 'الخطوط', body: [
        'تُوزَّع جميع الخطوط بموجب رخصة الخطوط المفتوحة ({ofl})، وتُقدَّم من خادم الموقع نفسه.',
        { credits: FONTS },
      ] },
      software: { h: 'البرمجيات مفتوحة المصدر', body: [
        'بُني الموقع والخادم وتطبيق الهاتف بالمشاريع مفتوحة المصدر التالية. ونصوص التراخيص متاحة في صفحات المشاريع نفسها.',
        { credits: SOFTWARE },
      ] },
      contact: { h: 'التواصل', body: [{ contact: true }] },
    },
  },

  tr: {
    title: 'Kaynaklar ve Lisanslar',
    lead: '{brand} birçok açık kaynak ve hizmete dayanır. Bu sayfada onları ve lisanslarını listeliyoruz — emeği geçenlere teşekkür ederiz.',
    sections: {
      intro: { h: 'Genel not', body: [
        'Aşağıda adı geçen metinlerin, kayıtların, verilerin, yazı tiplerinin ve yazılımların hakları **ilgili yazarlara, yayıncılara ve hak sahiplerine aittir**. {brand} bunlar üzerinde sahiplik iddia etmez ve bunları lisans şartlarına uygun olarak kullanır.',
        'Hak sahibiyseniz ve atıfta bir hata görürseniz [bize yazın]({toContact}); en kısa sürede düzeltiriz.',
      ] },
      quran: { h: 'Kur’an metni', body: [{ credits: QURAN_TEXT }] },
      translations: { h: 'Kur’an mealleri ve tefsir', body: [
        'Mealler {alquran} üzerinden yüklenir ve **anlam tercümesidir**. Telif hakları mütercimlere ve yayıncılara aittir.',
        { credits: TRANSLATIONS },
      ] },
      audio: { h: 'Kıraat kayıtları', body: [
        'Kıraat kayıtlarının hakları kârilere veya onların hak sahiplerine aittir; ücretsiz ve ticari olmayan yayın için sunulmuştur.',
        { credits: AUDIO },
      ] },
      hadith: { h: 'Hadisler', body: [
        'Hadisler klasik hadis kitaplarından alınmıştır; kaynağı her hadisin altında belirtilir. Başlıca kaynaklar: Sahîh-i Buhârî, Sahîh-i Müslim, Sünen-i Tirmizî, Sünen-i Ebû Dâvûd, Müsned-i Ahmed, Sünen-i İbn Mâce, Sünen-i Nesâî ve Muvatta’.',
      ] },
      prayer: { h: 'Namaz vakitleri ve takvim', body: [
        { credits: PRAYER },
        'Takvim sayfasındaki hicri tarih, tarayıcının yerleşik Ümmü’l-Kurâ takvimiyle hesaplanır.',
      ] },
      maps: { h: 'Harita ve konum verileri', body: [{ credits: MAPS }] },
      other: { h: 'Diğer veriler ve videolar', body: [{ credits: OTHER }] },
      fonts: { h: 'Yazı tipleri', body: [
        'Tüm yazı tipleri {ofl} ile dağıtılır ve sitenin kendi sunucusundan sunulur.',
        { credits: FONTS },
      ] },
      software: { h: 'Açık kaynak yazılımlar', body: [
        'Site, sunucu ve mobil uygulama aşağıdaki açık kaynak projelerle geliştirilmiştir. Lisans metinleri projelerin kendi sayfalarındadır.',
        { credits: SOFTWARE },
      ] },
      contact: { h: 'İletişim', body: [{ contact: true }] },
    },
  },
}

export default function LicensesPage({ setPage }) {
  const { lang } = useLang()
  return <LegalDocument docKey="licenses" doc={DOC[lang] || DOC.az} setPage={setPage} />
}
