import { useLang } from '../contexts/LangContext'
import { EXTRA_LANGS, EXTRA_CODES } from '../seo/langs'
import LegalDocument from '../components/LegalDocument'
import { ARABIC_AUDIO_SOURCES } from '../data/arabicCourseCredits'
import { AUDIO_CREDITS, CREDIT_ORDER } from '../data/prayerGuideCredits'
import { IMAGE_CREDITS } from '../data/imageCredits'
import { PLACE_PHOTOS } from '../data/placeImages'
import { pickUi } from '../utils/uiText'

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
// Kart sahələri (name / by / note / license) ya sətir, ya 5 dilli obyektdir.
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
  // Quranın əlavə dillərdəki tərcümələri (/id/quran …) — src/seo/langs.js-dən
  {
    name: { az: 'Quranın digər dillərə məna tərcümələri', en: 'Translations of the meaning of the Quran into other languages', ru: 'Переводы смыслов Корана на другие языки', ar: 'ترجمات معاني القرآن إلى لغات أخرى', tr: 'Kur’an’ın diğer dillere mealleri' },
    url: 'https://alquran.cloud/translations',
    by: { az: 'Hər dildə bir rəsmi nəşr, mətn dəyişdirilmədən göstərilir', en: 'One published edition per language, shown unchanged', ru: 'По одному опубликованному изданию на каждый язык, текст показан без изменений', ar: 'إصدار منشور واحد لكل لغة، يُعرض النص دون تعديل', tr: 'Her dil için yayımlanmış bir meal, metin değiştirilmeden gösterilir' },
    // Latın yazılışı ilə (dilin ingiliscə adı + tərcüməçi) — 5 dilin hamısında oxunur
    note: EXTRA_CODES.map(c => `${EXTRA_LANGS[c].en}: ${EXTRA_LANGS[c].byLatin || EXTRA_LANGS[c].by}`).join(" · "),
  },
  // Oxuyucudakı tərcümə seçicisi — utils/quranEnc.js
  {
    name: 'QuranEnc.com (API v1)', url: 'https://quranenc.com/',
    by: { az: 'Oxuyucuda seçilə bilən yoxlanılmış tərcümələr (Rəvvad Tərcümə Mərkəzi və başqaları)', en: 'Reviewed translations selectable in the reader (Rowwad Translation Center and others)', ru: 'Проверенные переводы, доступные для выбора в читалке (Центр переводов «Руввад» и другие)', ar: 'تراجم وتفاسير محكَّمة يمكن اختيارها في القارئ (مركز رواد الترجمة وغيره)', tr: 'Okuyucuda seçilebilen incelenmiş mealler (Rowwad Tercüme Merkezi ve diğerleri)' },
    note: {
      az: 'Oxucu standart tərcümə əvəzinə QuranEnc tərcüməsini seçəndə mətn və haşiyələr bu saytın açıq API-sindən canlı yüklənir və dəyişdirilmədən göstərilir. Onun şərtlərinə uyğun olaraq: mətnə əlavə edilmir, ondan heç nə silinmir; naşir və mənbə (QuranEnc.com) linklə, versiya nömrəsi və son yenilənmə tarixi ilə göstərilir; həmişə son versiya işlədilir; qeydləri saytın özünə bildirmək olar.',
      en: 'When a reader chooses a QuranEnc translation instead of the default one, the text and footnotes are loaded live from this site’s open API and shown unchanged. In line with its terms: nothing is added to or removed from the text, the publisher and the source (QuranEnc.com) are credited with a link, the version number and last update date, the latest version is always used, and notes can be sent to the site itself.',
      ru: 'Когда читатель выбирает перевод QuranEnc вместо перевода по умолчанию, текст и примечания загружаются напрямую из открытого интерфейса этого сайта и показываются без изменений. Согласно его условиям: в текст ничего не добавляется и из него ничего не удаляется, издатель и источник (QuranEnc.com) указаны со ссылкой, номером версии и датой последнего обновления, всегда используется последняя версия, замечания можно отправить самому сайту.', // lang-ok[QuranEnc]: saytın adı (brend)
      ar: 'إذا اختار القارئ ترجمة من QuranEnc بدل الترجمة الافتراضية حُمِّل النص والحواشي مباشرة من الواجهة البرمجية المفتوحة لهذا الموقع وعُرضت دون تعديل، التزامًا بشروطه: لا يُزاد على النص ولا يُحذف منه، ويُذكر الناشر والمصدر (QuranEnc.com) برابط مع رقم الإصدار وتاريخ آخر تحديث، وتُستعمل أحدث نسخة دائمًا، ويمكن إرسال الملاحظات إلى الموقع نفسه.', // lang-ok[QuranEnc]: saytın adı (brend)
      tr: 'Okuyucu varsayılan meal yerine bir QuranEnc meali seçtiğinde metin ve dipnotlar bu sitenin açık API’sinden canlı yüklenir ve değiştirilmeden gösterilir. Şartlarına uygun olarak: metne ekleme yapılmaz, metinden bir şey silinmez; yayıncı ve kaynak (QuranEnc.com) bağlantıyla, sürüm numarası ve son güncelleme tarihiyle belirtilir; her zaman son sürüm kullanılır; notlar sitenin kendisine iletilebilir.', // lang-ok[QuranEnc]: saytın adı (brend)
    },
  },
]

// Ayə təfsirləri — Quran.com API v4 (yalnız Sələf / Əhli-sünnə təfsirləri;
// kataloq: src/utils/tafsir.js). Hüquqlar müəlliflərə, tərcüməçilərə və naşirlərə məxsusdur.
const TAFSIR_SOURCES = [
  {
    name: 'Quran.com API', url: 'https://api-docs.quran.foundation/',
    by: 'Quran.com · Quran Foundation',
    note: {
      az: 'Ayələrin altındakı təfsir mətni bu API vasitəsilə yüklənir və dəyişdirilmədən (yalnız təhlükəsizlik üçün HTML təmizlənərək) göstərilir. Hər paneldə quran.com-a mənbə linki var.',
      en: 'The tafsir shown under the verses is loaded through this API and displayed unchanged (the HTML is only cleaned for safety). Every panel links to its source on quran.com.',
      ru: 'Тафсир под аятами загружается через этот интерфейс и показывается без изменений (HTML лишь очищается ради безопасности). В каждой панели есть ссылка на источник на quran.com.',
      ar: 'يُحمَّل التفسير المعروض تحت الآيات عبر هذه الواجهة ويُعرض دون تعديل (مع تنقية الشيفرة لأجل الأمان فقط)، وفي كل لوحة رابط إلى مصدره على quran.com.',
      tr: 'Ayetlerin altındaki tefsir metni bu API üzerinden yüklenir ve değiştirilmeden gösterilir (HTML yalnızca güvenlik için temizlenir). Her panelde quran.com’daki kaynağa bağlantı vardır.',
    },
  },
  {
    name: { az: 'Təfsir İbn Kəsir', en: 'Tafsir Ibn Kathir', ru: 'Тафсир Ибн Касира', ar: 'تفسير ابن كثير', tr: 'İbn Kesîr Tefsiri' },
    url: 'https://quran.com/1:1/tafsirs/ar-tafsir-ibn-kathir',
    by: { az: 'İsmail ibn Kəsir (vəfatı 774 h.) · ərəbcə tam mətn; ingiliscə ixtisarlı tərcümə — Darussalam', en: 'Isma’il ibn Kathir (d. 774 AH) · full Arabic text; abridged English translation by Darussalam', ru: 'Исмаил ибн Касир (ум. 774 г. х.) · полный арабский текст; сокращённый английский перевод — «Даруссалам»', ar: 'إسماعيل بن كثير (ت ٧٧٤هـ) · النص العربي الكامل، والترجمة الإنجليزية المختصرة لدار السلام', tr: 'İsmâil b. Kesîr (vefatı 774 h.) · Arapça tam metin; İngilizce muhtasar tercüme — Darussalam' },
  },
  {
    name: { az: 'Təfsir əs-Sədi', en: 'Tafsir al-Sa’di', ru: 'Тафсир ас-Саади', ar: 'تفسير السعدي', tr: 'Sa’dî Tefsiri' },
    url: 'https://quran.com/1:1/tafsirs/ar-tafseer-al-saddi',
    by: { az: 'Əbdürrəhman əs-Sədi (vəfatı 1376 h.) · ərəbcə mətn və rus dilinə tərcümə', en: 'Abd al-Rahman al-Sa’di (d. 1376 AH) · Arabic text and Russian translation', ru: 'Абдуррахман ас-Саади (ум. 1376 г. х.) · арабский текст и перевод на русский язык', ar: 'عبد الرحمن السعدي (ت ١٣٧٦هـ) · النص العربي والترجمة الروسية', tr: 'Abdurrahman es-Sa’dî (vefatı 1376 h.) · Arapça metin ve Rusça tercüme' },
  },
  {
    name: { az: 'Əl-Təfsir əl-Müyəssər', en: 'Al-Tafsir al-Muyassar', ru: 'Тафсир аль-Муяссар', ar: 'التفسير الميسر', tr: 'Tefsîr-i Müyesser' },
    url: 'https://quran.com/1:1/tafsirs/ar-tafsir-muyassar',
    by: { az: 'Kral Fəhd Quran Çap Kompleksinin alimlər heyəti · ərəbcə', en: 'A committee of scholars, King Fahd Quran Printing Complex · Arabic', ru: 'Коллектив учёных Комплекса короля Фахда · на арабском', ar: 'نخبة من العلماء — مجمع الملك فهد لطباعة المصحف الشريف', tr: 'Kral Fahd Kur’an Basım Kompleksi âlimler heyeti · Arapça' },
  },
  {
    name: { az: 'Təfsir əl-Bəğəvi', en: 'Tafsir al-Baghawi', ru: 'Тафсир аль-Багави', ar: 'تفسير البغوي', tr: 'Begavî Tefsiri' },
    url: 'https://quran.com/1:1/tafsirs/ar-tafsir-al-baghawi',
    by: { az: 'Hüseyn ibn Məsud əl-Bəğəvi (vəfatı 516 h.) · ərəbcə', en: 'Al-Husayn ibn Mas’ud al-Baghawi (d. 516 AH) · Arabic', ru: 'Аль-Хусейн аль-Багави (ум. 516 г. х.) · на арабском', ar: 'الحسين بن مسعود البغوي (ت ٥١٦هـ)', tr: 'Hüseyin b. Mes’ûd el-Begavî (vefatı 516 h.) · Arapça' },
  },
  {
    name: { az: 'Təfsir ət-Təbəri', en: 'Tafsir al-Tabari', ru: 'Тафсир ат-Табари', ar: 'تفسير الطبري', tr: 'Taberî Tefsiri' },
    url: 'https://quran.com/1:1/tafsirs/ar-tafsir-al-tabari',
    by: { az: 'Muhəmməd ibn Cərir ət-Təbəri (vəfatı 310 h.) · ərəbcə', en: 'Muhammad ibn Jarir al-Tabari (d. 310 AH) · Arabic', ru: 'Мухаммад ибн Джарир ат-Табари (ум. 310 г. х.) · на арабском', ar: 'محمد بن جرير الطبري (ت ٣١٠هـ)', tr: 'Muhammed b. Cerîr et-Taberî (vefatı 310 h.) · Arapça' },
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
  {
    // Commons-dakı əsl ad: "The Adhan - Muslim Call to Prayer - Aaqib Azeez" (link onu açır)
    name: 'Adhan — Aaqib Azeez',
    url: 'https://commons.wikimedia.org/wiki/File:The_Adhan_-_Muslim_Call_to_Prayer_-_Aaqib_Azeez.mp3',
    license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    by: 'Aaqib Azeez · Wikimedia Commons (Atcovi)',
    note: {
      az: 'Sayt açıq olanda namaz vaxtı oxunan əzan səsi. Fayl dəyişdirilmədən istifadə olunur.',
      en: 'The adhan recording played at prayer time while the site is open. The file is used unmodified.',
      ru: 'Запись азана, которая звучит во время намаза, когда сайт открыт. Файл используется без изменений.',
      ar: 'تسجيل الأذان الذي يُشغَّل عند دخول وقت الصلاة والموقع مفتوح. يُستخدم الملف دون تعديل.',
      tr: 'Site açıkken namaz vaktinde çalan ezan kaydı. Dosya değiştirilmeden kullanılır.',
    },
  },
]

// ── Xəritə və yer ──
// Ərəb kursu və namaz bələdçisindəki səs yazıları (Wikimedia Commons / Lingua Libre)
AUDIO.push(
  ...ARABIC_AUDIO_SOURCES,
  ...CREDIT_ORDER.filter((k) => AUDIO_CREDITS[k] && AUDIO_CREDITS[k].license).map((k) => {
    const c = AUDIO_CREDITS[k]
    return { name: `${c.title} — ${c.site}`, url: c.url, license: c.license, licenseUrl: c.licenseUrl, by: c.author }
  }),
)

const MAPS = [
  {
    name: 'Natural Earth (world-atlas)', url: 'https://www.naturalearthdata.com/', license: { az: 'İctimai mülkiyyət', en: 'Public domain', ru: 'Общественное достояние', ar: 'ملكية عامة', tr: 'Kamu malı' }, licenseUrl: 'https://www.naturalearthdata.com/about/terms-of-use/',
    by: 'Natural Earth; world-atlas — Mike Bostock (ISC)',
    note: {
      az: 'Qiblə səhifəsindəki qlobusda quru ərazilərinin konturları (1:110 milyon miqyas).',
      en: 'Land outlines on the globe on the Qibla page (1:110 million scale).',
      ru: 'Контуры суши на глобусе на странице киблы (масштаб 1:110 млн).',
      ar: 'حدود اليابسة على الكرة الأرضية في صفحة القبلة (مقياس 1:110 مليون).',
      tr: 'Kıble sayfasındaki küredeki kara sınırları (1:110 milyon ölçek).',
    },
  },
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

// ── Yer fotoşəkilləri (Wikimedia Commons) — src/data/imageCredits.js ──
// Səhifələrdə (müqəddəs yerlər, həcc, İslam tarixi) şəklin altında da göstərilir
const PHOTOS = Object.values(IMAGE_CREDITS).map((c) => ({
  name: PLACE_PHOTOS[c.key]?.name || c.file,
  url: c.page,
  license: c.license,
  licenseUrl: c.licenseUrl || undefined,
  by: c.author,
}))

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
  {
    name: 'Hisn al-Muslim (حصن المسلم)', url: 'https://github.com/rn0x/hisn_almuslim_json',
    by: 'Sa‘id ibn Ali ibn Wahf al-Qahtani',
    note: {
      az: 'Hisnul-Müslim bölməsinin ərəb mətni və təxrici kitabdandır. Müəllif kitabın pulsuz yayılmasına icazə verib; tərcümələr Muslims.cc tərəfindən süni intellektin köməyi ilə hazırlanıb.',
      en: 'The Arabic text and takhrij of the Hisn al-Muslim section come from the book. The author permits free distribution; translations were prepared by Muslims.cc with the help of AI.',
      ru: 'Арабский текст и тахридж раздела «Хиснуль-муслим» взяты из книги. Автор разрешил бесплатное распространение; переводы подготовлены Muslims.cc с помощью ИИ.',
      ar: 'النص العربي والتخريج في قسم حصن المسلم من الكتاب، وقد أذن المؤلف بنشره مجانًا، والترجمات من إعداد Muslims.cc بمساعدة الذكاء الاصطناعي.',
      tr: 'Hısnu’l-Müslim bölümünün Arapça metni ve tahrici kitaptandır. Yazar ücretsiz dağıtıma izin vermiştir; çeviriler Muslims.cc tarafından yapay zekâ yardımıyla hazırlanmıştır.',
    },
  },
  {
    name: 'Hadith API (fawazahmed0)', url: 'https://github.com/fawazahmed0/hadith-api',
    by: 'Fawaz Ahmed',
    note: {
      az: 'Ən-Nəvəvinin 40 hədisinin ərəb mətni, hədis nömrələrinin yoxlanması və «Hədis kitabxanası» bölməsi (kitabların ərəbcə mətni, tərcümələri və alimlərin dərəcələri, olduğu kimi) üçün istifadə olunur; lisenziyası ictimai mülkiyyətdir.',
      en: 'Used for the Arabic text of an-Nawawi’s Forty Hadith, to verify hadith numbers, and for the Hadith Library (the books’ Arabic text, translations and scholars’ grades, unchanged); Unlicense — public domain.',
      ru: 'Используется для арабского текста 40 хадисов ан-Навави, проверки номеров хадисов и в «Библиотеке хадисов» (арабский текст книг, переводы и оценки учёных без изменений); лицензия — общественное достояние.',
      ar: 'يُستخدم لنص الأربعين النووية العربي وللتحقق من أرقام الأحاديث، وفي «مكتبة الحديث» (نصوص الكتب وترجماتها وأحكام أهل العلم كما هي)، وهو ملك عام بحسب ترخيصه.',
      tr: 'Nevevî’nin Kırk Hadis’inin Arapça metni, hadis numaralarının doğrulanması ve «Hadis Kütüphanesi» bölümü (kitapların Arapça metni, tercümeleri ve âlimlerin hükümleri, olduğu gibi) için kullanılır; Unlicense — kamu malı.',
    },
  },
  {
    name: 'HadeethEnc.com (API v1)', url: 'https://hadeethenc.com/',
    // lang-ok[ensiklopediyası]: Azərbaycan sözüdür (ensiklopediya)
    by: { az: 'Hədis ensiklopediyası bölməsi', en: 'Hadith Encyclopedia section', ru: 'Раздел «Энциклопедия хадисов»', ar: 'قسم موسوعة الأحاديث', tr: 'Hadis Ansiklopedisi bölümü' },
    note: {
      az: 'Hədislər, tərcümələr, dərəcə, mənbə, şərh və faydalar bu saytın açıq API-sindən canlı yüklənir və dəyişdirilmədən göstərilir. Onun şərtlərinə uyğun olaraq: mətnə əlavə edilmir, ondan heç nə silinmir; mənbə hər hədisdə linklə göstərilir; həmişə son versiya işlədilir; səhvləri saytın özünə bildirmək olar.',
      en: 'Hadiths, translations, grades, references, explanations and benefits are loaded live from this encyclopedia’s open API and shown unchanged. In line with its terms: nothing is added to or removed from the text, the source is credited with a link on every hadith, the latest version is always used, and mistakes can be reported to the site itself.',
      ru: 'Хадисы, переводы, степень достоверности, источник, разъяснение и польза загружаются напрямую из открытого интерфейса этой энциклопедии и показываются без изменений. Согласно её условиям: в текст ничего не добавляется и из него ничего не удаляется, источник указан со ссылкой у каждого хадиса, всегда используется последняя версия, об ошибках можно сообщить самому сайту.',
      ar: 'تُحمَّل الأحاديث وترجماتها ودرجتها وتخريجها وشرحها وفوائدها مباشرة من الواجهة البرمجية المفتوحة لهذه الموسوعة وتُعرض دون تعديل، التزامًا بشروطها: لا يُزاد على النص ولا يُحذف منه، ويُذكر المصدر برابط عند كل حديث، وتُستعمل أحدث نسخة دائمًا، ويمكن إبلاغ الموقع نفسه بأي خطأ.',
      tr: 'Hadisler, tercümeler, derece, kaynak, şerh ve faydalar bu ansiklopedinin açık API’sinden canlı yüklenir ve değiştirilmeden gösterilir. Şartlarına uygun olarak: metne ekleme yapılmaz, metinden bir şey silinmez; kaynak her hadiste bağlantıyla belirtilir; her zaman son sürüm kullanılır; hatalar sitenin kendisine bildirilebilir.',
    },
  },
  {
    name: 'binbaz.org.sa · binothaimeen.net · alifta.gov.sa · islamqa.info · islamhouse.com · dorar.net · sunnah.com', url: 'https://binbaz.org.sa/',
    by: { az: 'Fətvalar və elm mənbələri bölməsi', en: 'Fatwas & scholarly sources section', ru: 'Раздел «Фетвы и источники знаний»', ar: 'قسم الفتاوى ومصادر العلم', tr: 'Fetvalar ve ilim kaynakları bölümü' },
    note: {
      az: 'Bu saytlardan heç bir mətn köçürülmür və saxlanmır — yalnız onların mövzu səhifələrinə keçid verilir, hədis axtarışı isə sorğunu birbaşa həmin sayta göndərir. Fətvaların mətni və bütün hüquqlar müvafiq alimlərə və saytlara məxsusdur.',
      en: 'No text is copied or stored from these sites — we only link to their topic pages, and the hadith search sends the query straight to the chosen site. The text of the fatwas and all rights belong to the respective scholars and sites.',
      ru: 'С этих сайтов ничего не копируется и не хранится — мы лишь ссылаемся на их тематические страницы, а поиск хадиса отправляет запрос прямо на выбранный сайт. Тексты фетв и все права принадлежат соответствующим учёным и сайтам.',
      ar: 'لا يُنقل من هذه المواقع نص ولا يُخزَّن، وإنما نحيل إلى صفحات موضوعاتها، ويُرسَل البحث عن الحديث مباشرة إلى الموقع المختار. ونصوص الفتاوى وجميع الحقوق لأصحابها من العلماء والمواقع.',
      tr: 'Bu sitelerden hiçbir metin kopyalanmaz ve saklanmaz — yalnızca konu sayfalarına bağlantı verilir, hadis araması ise sorguyu doğrudan seçilen siteye gönderir. Fetvaların metni ve tüm hakları ilgili âlimlere ve sitelere aittir.',
    },
  },
  {
    name: 'Quranic Arabic Corpus', url: 'https://corpus.quran.com/',
    by: 'corpus.quran.com · GNU GPL v3',
    note: {
      az: 'Kök axtarışı bölməsindəki söz kökləri və morfologiya bu korpusdan götürülüb; GPL lisenziyası ilə.',
      en: 'The word roots and morphology in the root search come from this corpus, under the GNU GPL v3.',
      ru: 'Корни слов и морфология в поиске по корню взяты из этого корпуса; свободная лицензия ГПЛ.',
      ar: 'جذور الكلمات وصرفها في البحث بالجذر مأخوذة من هذه المدونة بترخيص حر.',
      tr: 'Kök aramasındaki kelime kökleri ve morfoloji bu derlemden alınmıştır; GPL lisansıyla.',
    },
  },
  {
    name: 'Open Food Facts', url: 'https://world.openfoodfacts.org/',
    by: 'Open Food Facts · ODbL',
    note: {
      az: 'Halal yoxlamasındakı qida əlavələri (E-kodlar) siyahısı və barkodla məhsul məlumatı; məlumat könüllülər tərəfindən toplanır, açıq məlumat bazası lisenziyası ilə.',
      en: 'The food-additive (E-number) list and barcode product data in the halal check; the data is collected by volunteers (Open Database License).',
      ru: 'Список пищевых добавок (E-коды) и данные о продуктах по штрихкоду в халяль-проверке; данные собирают добровольцы, открытая лицензия базы данных.',
      ar: 'قائمة المضافات الغذائية (أرقام E) وبيانات المنتجات بالباركود في فحص الحلال؛ يجمعها متطوعون، بترخيص قاعدة بيانات مفتوح.',
      tr: 'Helal kontrolündeki gıda katkı maddeleri (E-kodları) listesi ve barkodla ürün bilgisi; veriler gönüllüler tarafından toplanır, açık veritabanı lisansıyla.',
    },
  },
]

// ── Şriftlər (öz serverimizdən verilir) ──
const FONTS = [
  { name: 'Inter', url: 'https://rsms.me/inter/', license: 'SIL OFL 1.1', licenseUrl: OFL, by: 'Rasmus Andersson' },
  { name: 'Amiri', url: 'https://www.amirifont.org/', license: 'SIL OFL 1.1', licenseUrl: OFL, by: 'Khaled Hosny' },
  { name: 'Scheherazade New', url: 'https://software.sil.org/scheherazade/', license: 'SIL OFL 1.1', licenseUrl: OFL, by: 'SIL International' },
  { name: 'Noto Naskh Arabic', url: 'https://notofonts.github.io/', license: 'SIL OFL 1.1', licenseUrl: OFL, by: 'Google / Noto' },
  { name: 'IBM Plex Sans Arabic', url: 'https://github.com/IBM/plex', license: 'SIL OFL 1.1', licenseUrl: OFL, by: 'IBM Corp.' },
  { name: 'Aref Ruqaa', url: 'https://github.com/aliftype/aref-ruqaa', license: 'SIL OFL 1.1', licenseUrl: OFL, by: 'Khaled Hosny / Abdullah Aref' },
  { name: 'Reem Kufi', url: 'https://github.com/aliftype/reem-kufi', license: 'SIL OFL 1.1', licenseUrl: OFL, by: 'Khaled Hosny / Santiago Orozco' },
]

// ── Açıq mənbə proqram təminatı (package.json-dakı əsas asılılıqlar) ──
const SOFTWARE = [
  { name: 'React, React DOM', url: 'https://react.dev/', license: MIT, licenseUrl: 'https://github.com/facebook/react/blob/main/LICENSE', by: 'Meta Platforms, Inc.' },
  { name: 'React Router', url: 'https://reactrouter.com/', license: MIT, licenseUrl: 'https://github.com/remix-run/react-router/blob/main/LICENSE.md', by: 'Remix Software Inc.' },
  { name: 'Firebase JavaScript SDK', url: 'https://github.com/firebase/firebase-js-sdk', license: APACHE, licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0', by: 'Google LLC' },
  { name: 'd3-geo, topojson-client', url: 'https://d3js.org/d3-geo', license: 'ISC', licenseUrl: 'https://github.com/d3/d3-geo/blob/main/LICENSE', by: 'Mike Bostock' },
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
        'Ayələrin altındakı təfsir (Sələf alimlərinin təfsirləri) Quran.com vasitəsilə yüklənir. Azərbaycan dilindəki əl-Təfsir əl-Müyəssər (Kral Fəhd Kompleksinin alimlər heyəti) ərəb əslindən Muslims.cc tərəfindən süni intellektin köməyi ilə tərcümə olunub və saytın özündə saxlanılır; tərcümə redaktə olunur və panel bunu açıq qeyd edir.',
        { credits: TAFSIR_SOURCES },
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
      photos: { h: 'Yer fotoşəkilləri', body: [
        // lang-ok[Wikimedia]: Wikimedia Commons — layihənin rəsmi adı
        'Müqəddəs yerlərin fotoşəkilləri Wikimedia Commons-dan açıq lisenziya ilə götürülüb və kəsilərək kiçildilib. Siyər və həcc xəritələri, səhabə adlarının xəttatlıq lövhələri {brand} tərəfindən hazırlanıb.',
        { credits: PHOTOS },
      ] },
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
        'The tafsir under the verses (commentaries by scholars of the Salaf methodology) is loaded through Quran.com.',
        { credits: TAFSIR_SOURCES },
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
      photos: { h: 'Photographs of places', body: [
        'Photographs of the holy places come from Wikimedia Commons under open licences and have been cropped and resized. The Sirah and Hajj maps and the calligraphy plaques of the Companions’ names are made by {brand}.',
        { credits: PHOTOS },
      ] },
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
        // lang-ok[Quran]: Quran.com — saytın rəsmi adı (domen)
        'Тафсир под аятами (толкования учёных, следовавших пути саляфов) загружается через Quran.com.',
        { credits: TAFSIR_SOURCES },
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
      photos: { h: 'Фотографии мест', body: [
        'Фотографии святых мест взяты с Викисклада по открытым лицензиям, обрезаны и уменьшены. Карты сиры и хаджа, а также каллиграфические таблички с именами сподвижников подготовлены {brand}.',
        { credits: PHOTOS },
      ] },
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
        // lang-ok[Quran]: Quran.com — saytın rəsmi adı (domen)
        'يُحمَّل التفسير المعروض تحت الآيات (من تفاسير أهل العلم على منهج السلف) عبر Quran.com.',
        { credits: TAFSIR_SOURCES },
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
      photos: { h: 'صور الأماكن', body: [
        'صور الأماكن المقدسة مأخوذة من ويكيميديا كومنز بتراخيص مفتوحة، وقد قُصّت وصُغّرت. أما خرائط السيرة والحج ولوحات أسماء الصحابة الخطية فمن إعداد {brand}.',
        { credits: PHOTOS },
      ] },
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
        // lang-ok[Quran]: Quran.com — saytın rəsmi adı (domen)
        'Ayetlerin altındaki tefsir (Selef âlimlerinin tefsirleri) Quran.com üzerinden yüklenir. Bu tefsirlerin güvenilir Türkçe metni bulunmadığından makine çevirisi gösterilmez; Arapça, Rusça veya İngilizce metin seçilir.',
        { credits: TAFSIR_SOURCES },
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
      photos: { h: 'Mekân fotoğrafları', body: [
        'Kutsal mekânların fotoğrafları açık lisanslarla Wikimedia Commons’tan alınmış, kırpılıp küçültülmüştür. Siyer ve hac haritaları ile sahabe adlarının hat levhaları {brand} tarafından hazırlanmıştır.',
        { credits: PHOTOS },
      ] },
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
  return <LegalDocument docKey="licenses" doc={pickUi(DOC, lang)} setPage={setPage} />
}
