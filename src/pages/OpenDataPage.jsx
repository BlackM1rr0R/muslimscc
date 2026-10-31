// ═══════════════════════════════════════════════════════
// AÇIQ MƏLUMAT — /open-data
//
// scripts/build-open-data.mjs-in yazdığı statik JSON fayllarını (dist/open-data/)
// sənədləşdirir: fayllar, sahələr, lisenziya/atribusiya, daxil EDİLMƏYƏNLƏR
// (üçüncü tərəfin müəllif hüquqlu tərcümələri) və namaz vaxtı bloku (/widget).
// Fayl siyahısı və sahələr skriptdəki ilə eyni saxlanılmalıdır.
// ═══════════════════════════════════════════════════════
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import PageLink from '../components/PageLink'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import '../styles/OpenDataPage.css'

const BASE = 'https://muslims.cc/open-data/'
const LICENSE = { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' }

// Fayllar (skriptdəki sıra ilə). langs: true — hər dil üçün ayrıca fayl
const FILES = [
  { key: 'index', file: 'index.json', fields: ['dataset', 'license', 'attribution', 'files', 'notIncluded'] },
  { key: 'hadiths', file: 'hadiths-{lang}.json', langs: true, fields: ['id', 'category', 'source', 'arabic', 'url'] },
  { key: 'duas', file: 'duas-{lang}.json', langs: true, fields: ['id', 'category', 'arabic', 'transliteration', 'text', 'source'] },
  { key: 'names', file: 'names99.json', fields: ['n', 'arabic', 'transliteration', 'meaning', 'proof'] },
  { key: 'nawawi', file: 'nawawi40.json', fields: ['n', 'title', 'arabic', 'text', 'source', 'benefits'] },
  { key: 'lessons', file: 'lessons-index.json', fields: ['slug', 'category', 'title', 'arabicTitle', 'summary', 'author', 'minutes', 'url'] },
]

const T = {
  az: {
    title: 'Açıq məlumat',
    eyebrow: 'Tərtibatçılar üçün',
    lead: 'Saytdakı hədislər, dualar, Allahın 99 adı, Nəvəvinin qırx hədisi və dərslərin siyahısı — pulsuz, statik JSON faylları kimi. Tətbiqinizdə, saytınızda və ya araşdırmanızda istifadə edin, yalnız mənbəni göstərin.',
    filesTitle: 'Fayllar',
    fileCol: 'Fayl', descCol: 'Nə var', fieldsCol: 'Sahələr',
    langsNote: '{lang} — {langs}. Ərəbcə faylda {textField} sahəsi yoxdur (mətn {arabicField} sahəsindədir).',
    desc: {
      index: 'Bütün faylların siyahısı, ölçüsü, lisenziya və atribusiya.',
      hadiths: 'Səhih hədislər: ərəbcə mətn, mənbə (kitab + nömrə, faylın dilində) və mövzu. Təkrarlar çıxarılıb; id hər faylda eynidir. Tərcümə daxil deyil.',
      duas: 'Quran və səhih Sünnədən dualar: ərəbcə, transliterasiya, tərcümə və mənbə.',
      names: 'Allahın 99 adı — Şeyx İbn Useyminin «əl-Qəvaid əl-Musla» kitabındakı siyahı və sırası, hər adın Quran/Sünnədəki yeri.',
      nawawi: 'İmam Nəvəvinin 42 hədisi: ərəbcə, az/ru/tr tərcümə, mənbələr, faydalar. İngiliscə hədis mətni daxil deyil.',
      lessons: 'Dərslərin siyahısı: başlıq, qısa məzmun, müəllif/mənbə, oxuma vaxtı və linklər (dərs mətnləri saytdadır).',
    },
    licenseTitle: 'Lisenziya və atribusiya',
    license: 'Muslims.cc-nin hazırladığı məlumatlar (tərcümələr, transliterasiya, qeydlər, faydalar) {license} lisenziyası ilə paylaşılır. Klassik ərəbcə mətnlər (Quran ayələri, hədislər) heç kimin mülkü deyil.',
    attribution: 'İstifadə edəndə belə göstərin:',
    attrSample: 'Mənbə: Muslims.cc — {siteUrl}',
    attrRules: [
      'Mənbə linkini görünən yerdə saxlayın (tətbiqdə — «Haqqında» bölməsində).',
      'Mətni dəyişsəniz, bunu qeyd edin; dəyişdirilmiş mətni Muslims.cc-nin sözü kimi təqdim etməyin.',
      'Hədisin mənbəsini (kitab və nömrə) mətnlə birlikdə göstərin.',
    ],
    excludedTitle: 'Daxil edilməyənlər',
    excludedLead: 'Aşağıdakılar saytda göstərilir, amma onları yenidən yaymaq hüququmuz yoxdur və ya təsdiqlənməyib — ona görə açıq məlumata daxil deyil:',
    excluded: [
      'Quranın məna tərcümələri (Məmmədəliyev–Bünyadov, Məhəmməd Əsəd, Elmir Quliyev, Diyanət, {saheeh}) — hüquqlar tərcüməçilərə və naşirlərə məxsusdur.',
      'Təfsir mətnləri ({quranCom} vasitəsilə yüklənir), qiraət səsləri, fotolar və xəritə məlumatları.',
      'Nəvəvinin qırx hədisinin ingiliscə mətni — müəllif hüquqlu tərcüməyə çox yaxın olduğu üçün.',
      'Hədislərin tərcümələri — istifadə şərtlərinə görə hüquqları müvafiq sahiblərinə məxsusdur.',
    ],
    licensesLink: 'Bütün mənbələr və lisenziyalar',
    useTitle: 'İstifadə',
    useText: 'Fayllar adi statik fayllardır: açar, qeydiyyat və limit yoxdur. Başqa saytın brauzerindən oxumaq üçün server {cors} başlığı ({corsHeader}) ilə verir. Faylları öz serverinizdə saxlamaq daha etibarlıdır — vaxtaşırı yeniləyin.',
    updated: 'Fayllar hər sayt yeniləməsində yenidən yaradılır; {generatedField} sahəsində tarix var.',
    widgetTitle: 'Namaz vaxtı bloku',
    widgetText: 'Saytınızda namaz vaxtlarını göstərmək üçün hazır bloku (bir sətir skript və ya {iframe}) istifadə edin.',
    widgetLink: 'Bloku qur',
  },
  en: {
    title: 'Open Data',
    eyebrow: 'For developers',
    lead: 'The hadith, duas, 99 Names of Allah, an-Nawawi’s forty hadith and the lesson index from this site — as free, static JSON files. Use them in your app, website or research; just credit the source.',
    filesTitle: 'Files',
    fileCol: 'File', descCol: 'Contents', fieldsCol: 'Fields',
    langsNote: '{lang} — {langs}. The Arabic file has no {textField} field (the text is in {arabicField}).',
    desc: {
      index: 'List of all files with size, licence and attribution.',
      hadiths: 'Authentic hadith: Arabic text, source (collection + number, in the file’s language) and topic. Duplicates removed; the id is the same in every file. Translations are not included.',
      duas: 'Supplications from the Quran and authentic Sunnah: Arabic, transliteration, translation and source.',
      names: 'The 99 Names of Allah — the list and order from Shaykh Ibn Uthaymin’s al-Qawa‘id al-Muthla, with where each name is established in the Quran or Sunnah.',
      nawawi: 'Imam an-Nawawi’s 42 hadith: Arabic, az/ru/tr translation, references and benefits. The English hadith text is not included.',
      lessons: 'Lesson index: title, summary, author/sources, reading time and links (the lesson texts stay on the site).',
    },
    licenseTitle: 'Licence and attribution',
    license: 'Data prepared by Muslims.cc (translations, transliterations, notes, benefits) is shared under the {license} licence. The classical Arabic texts (Quran verses, hadith) belong to no one.',
    attribution: 'When you use it, credit it like this:',
    attrSample: 'Source: Muslims.cc — {siteUrl}',
    attrRules: [
      'Keep the source link visible (in an app — in the “About” section).',
      'If you change the text, say so; don’t present changed text as Muslims.cc’s wording.',
      'Show the hadith reference (collection and number) together with the text.',
    ],
    excludedTitle: 'Not included',
    excludedLead: 'The following are shown on the site, but we do not have — or have not confirmed — the right to redistribute them, so they are not part of the open data:',
    excluded: [
      'Translations of the meaning of the Quran (Mammadaliyev–Bunyadov, Muhammad Asad, Elmir Kuliev, Diyanet, {saheeh}) — rights belong to the translators and publishers.',
      'Tafsir texts (loaded through {quranCom}), recitation audio, photographs and map data.',
      'The English text of an-Nawawi’s forty hadith, because it closely follows a copyrighted translation.',
      'Translations of the hadith collection — under our terms of use their rights belong to their respective holders.',
    ],
    licensesLink: 'All sources and licences',
    useTitle: 'Usage',
    useText: 'The files are plain static files: no key, no sign-up, no rate limit. The server sends a {cors} header ({corsHeader}) so they can be read from a browser on another site. Keeping a copy on your own server is more reliable — refresh it from time to time.',
    updated: 'The files are regenerated with every site update; the date is in the {generatedField} field.',
    widgetTitle: 'Prayer times widget',
    widgetText: 'To show prayer times on your website, use the ready-made widget (a one-line script or an {iframe}).',
    widgetLink: 'Set up the widget',
  },
  ru: {
    title: 'Открытые данные',
    eyebrow: 'Для разработчиков',
    lead: 'Хадисы, дуа, 99 имён Аллаха, сорок хадисов ан-Навави и список уроков с этого сайта — в виде бесплатных статических файлов JSON. Используйте их в приложении, на сайте или в исследовании, указав источник.',
    filesTitle: 'Файлы',
    fileCol: 'Файл', descCol: 'Содержание', fieldsCol: 'Поля',
    langsNote: '{lang} — {langs}. В арабском файле нет поля {textField} (текст — в поле {arabicField}).',
    desc: {
      index: 'Список всех файлов с размером, лицензией и указанием авторства.',
      hadiths: 'Достоверные хадисы: арабский текст, источник (сборник и номер на языке файла) и тема. Повторы удалены; идентификатор одинаков во всех файлах. Переводы не включены.',
      duas: 'Мольбы из Корана и достоверной Сунны: арабский текст, транслитерация, перевод и источник.',
      names: '99 имён Аллаха — список и порядок из книги шейха Ибн Усаймина «аль-Каваид аль-мусла» с указанием, где каждое имя установлено в Коране или Сунне.',
      nawawi: '42 хадиса имама ан-Навави: арабский текст, перевод (az/ru/tr), источники и уроки. Английский текст хадисов не включён.',
      lessons: 'Список уроков: заголовок, краткое содержание, автор и источники, время чтения и ссылки (тексты уроков — на сайте).',
    },
    licenseTitle: 'Лицензия и указание авторства',
    license: 'Данные, подготовленные Muslims.cc (переводы, транслитерация, примечания, уроки), распространяются по лицензии {license}. Классические арабские тексты (аяты Корана, хадисы) никому не принадлежат.',
    attribution: 'При использовании укажите источник так:',
    attrSample: 'Источник: Muslims.cc — {siteUrl}',
    attrRules: [
      'Ссылка на источник должна быть видна (в приложении — в разделе «О приложении»).',
      'Если вы изменили текст, укажите это и не выдавайте изменённый текст за формулировку Muslims.cc.',
      'Указывайте источник хадиса (сборник и номер) вместе с текстом.',
    ],
    excludedTitle: 'Что не включено',
    excludedLead: 'Следующее показывается на сайте, но права на его распространение у нас нет или оно не подтверждено, поэтому в открытые данные оно не входит:',
    excluded: [
      'Переводы смыслов Корана (Мамедалиев–Буниятов, Мухаммад Асад, Эльмир Кулиев, Диянет, «Сахих Интернешнл») — права принадлежат переводчикам и издателям.',
      'Тексты тафсиров (загружаются через {quranCom}), аудиозаписи чтения, фотографии и картографические данные.',
      'Английский текст сорока хадисов ан-Навави — он близок к переводу, защищённому авторским правом.',
      'Переводы хадисов из сборника — по нашим условиям использования права на них принадлежат их владельцам.',
    ],
    licensesLink: 'Все источники и лицензии',
    useTitle: 'Использование',
    useText: 'Это обычные статические файлы: без ключа, регистрации и ограничений. Сервер отдаёт заголовок {cors} ({corsHeader}), поэтому их можно читать из браузера на другом сайте. Надёжнее хранить копию на своём сервере и периодически обновлять её.',
    updated: 'Файлы создаются заново при каждом обновлении сайта; дата — в поле {generatedField}.',
    widgetTitle: 'Виджет времени намаза',
    widgetText: 'Чтобы показать время намаза на своём сайте, используйте готовый виджет (одна строка скрипта или {iframe}).',
    widgetLink: 'Настроить виджет',
  },
  ar: {
    title: 'البيانات المفتوحة',
    eyebrow: 'للمطورين',
    lead: 'الأحاديث والأدعية وأسماء الله الحسنى والأربعون النووية وفهرس الدروس في هذا الموقع، في ملفات JSON ثابتة مجانية. استعملها في تطبيقك أو موقعك أو بحثك مع ذكر المصدر.',
    filesTitle: 'الملفات',
    fileCol: 'الملف', descCol: 'المحتوى', fieldsCol: 'الحقول',
    langsNote: '{lang}: {langs}. لا يوجد حقل {textField} في الملف العربي (النص في حقل {arabicField}).',
    desc: {
      index: 'قائمة بجميع الملفات مع حجمها والترخيص وطريقة نسبة المصدر.',
      hadiths: 'أحاديث صحيحة: النص العربي والمصدر (الكتاب والرقم بلغة الملف) والموضوع. حُذف المكرر، والمعرّف واحد في كل الملفات. الترجمات غير مضمّنة.',
      duas: 'أدعية من القرآن والسنة الصحيحة: النص العربي والنقحرة والترجمة والمصدر.',
      names: 'أسماء الله الحسنى التسعة والتسعون بحسب ما جمعه الشيخ ابن عثيمين في «القواعد المثلى» وبترتيبه، مع موضع ثبوت كل اسم في القرآن أو السنة.',
      nawawi: 'الأحاديث الاثنان والأربعون للإمام النووي: النص العربي والترجمة (az وru وtr) والمصادر والفوائد. لا يتضمن النص الإنجليزي للأحاديث.',
      lessons: 'فهرس الدروس: العنوان والملخص والمؤلف والمصادر ومدة القراءة والروابط (نصوص الدروس في الموقع).',
    },
    licenseTitle: 'الترخيص ونسبة المصدر',
    license: 'البيانات التي أعدّها Muslims.cc (الترجمات والنقحرة والتعليقات والفوائد) منشورة بترخيص {license}. أما النصوص العربية الأصلية (آيات القرآن والأحاديث) فليست ملكًا لأحد.',
    attribution: 'عند الاستعمال اذكر المصدر هكذا:',
    attrSample: 'المصدر: Muslims.cc — {siteUrl}',
    attrRules: [
      'اجعل رابط المصدر ظاهرًا (في التطبيق: في قسم «حول»).',
      'إذا غيّرت النص فاذكر ذلك، ولا تنسب النص المعدَّل إلى Muslims.cc.',
      'اذكر مصدر الحديث (الكتاب والرقم) مع نصه.',
    ],
    excludedTitle: 'ما لم يُدرج',
    excludedLead: 'ما يلي معروض في الموقع، لكن ليس لدينا حق إعادة نشره أو لم يتأكد لنا ذلك، فلم يُدرج في البيانات المفتوحة:',
    excluded: [
      'ترجمات معاني القرآن (محمد علييف وبنيادوف، ومحمد أسد، وإلمير قلييف، ورئاسة الشؤون الدينية التركية، وصحيح إنترناشونال)، فحقوقها لمترجميها وناشريها.',
      'نصوص التفاسير (تُحمَّل عبر {quranCom}) وتسجيلات التلاوة والصور وبيانات الخرائط.',
      'النص الإنجليزي للأربعين النووية لقربه من ترجمة محفوظة الحقوق.',
      'ترجمات الأحاديث — حقوقها لأصحابها وفق شروط الاستخدام لدينا.',
    ],
    licensesLink: 'جميع المصادر والتراخيص',
    useTitle: 'طريقة الاستعمال',
    useText: 'الملفات ثابتة عادية: بلا مفتاح ولا تسجيل ولا حدود. يرسل الخادم ترويسة {cors} ({corsHeader}) لتمكين قراءتها من متصفح في موقع آخر. والأوثق أن تحفظ نسخة على خادمك وتحدّثها بين حين وآخر.',
    updated: 'تُنشأ الملفات من جديد مع كل تحديث للموقع، والتاريخ في حقل {generatedField}.',
    widgetTitle: 'أداة مواقيت الصلاة',
    widgetText: 'لعرض مواقيت الصلاة في موقعك استعمل الأداة الجاهزة (سطر برمجي واحد أو إطار {iframe}).',
    widgetLink: 'إعداد الأداة',
  },
  tr: {
    title: 'Açık Veri',
    eyebrow: 'Geliştiriciler için',
    lead: 'Bu sitedeki hadisler, dualar, Allah’ın 99 ismi, Nevevî’nin kırk hadisi ve ders listesi — ücretsiz, statik JSON dosyaları olarak. Uygulamanızda, sitenizde veya araştırmanızda kullanın; yalnızca kaynağı belirtin.',
    filesTitle: 'Dosyalar',
    fileCol: 'Dosya', descCol: 'İçerik', fieldsCol: 'Alanlar',
    langsNote: '{lang} — {langs}. Arapça dosyada {textField} alanı yoktur (metin {arabicField} alanındadır).',
    desc: {
      index: 'Tüm dosyaların listesi, boyutu, lisansı ve kaynak gösterme bilgisi.',
      hadiths: 'Sahih hadisler: Arapça metin, kaynak (dosyanın dilinde eser + numara) ve konu. Tekrarlar çıkarıldı; kimlik numarası her dosyada aynıdır. Tercümeler dahil değildir.',
      duas: 'Kur’an ve sahih Sünnet’ten dualar: Arapça, transliterasyon, tercüme ve kaynak.',
      names: 'Allah’ın 99 ismi — Şeyh İbn Useymin’in «el-Kavâidü’l-Müslâ» kitabındaki liste ve sıra; her ismin Kur’an veya Sünnet’teki yeri.',
      nawawi: 'İmam Nevevî’nin 42 hadisi: Arapça, az/ru/tr tercüme, kaynaklar ve faydalar. İngilizce hadis metni dahil değildir.',
      lessons: 'Ders listesi: başlık, özet, yazar/kaynaklar, okuma süresi ve bağlantılar (ders metinleri sitededir).',
    },
    licenseTitle: 'Lisans ve kaynak gösterme',
    license: 'Muslims.cc’nin hazırladığı veriler (tercümeler, transliterasyon, notlar, faydalar) {license} lisansıyla paylaşılır. Klasik Arapça metinler (Kur’an ayetleri, hadisler) kimsenin mülkü değildir.',
    attribution: 'Kullanırken kaynağı şöyle belirtin:',
    attrSample: 'Kaynak: Muslims.cc — {siteUrl}',
    attrRules: [
      'Kaynak bağlantısını görünür bir yerde tutun (uygulamada — «Hakkında» bölümünde).',
      'Metni değiştirirseniz bunu belirtin; değiştirilmiş metni Muslims.cc’nin ifadesi gibi sunmayın.',
      'Hadisin kaynağını (eser ve numara) metinle birlikte gösterin.',
    ],
    excludedTitle: 'Dahil edilmeyenler',
    excludedLead: 'Aşağıdakiler sitede gösterilir, ancak bunları yeniden dağıtma hakkımız yoktur veya teyit edilmemiştir; bu yüzden açık veriye dahil değildir:',
    excluded: [
      'Kur’an meâlleri (Memmedaliyev–Bünyadov, Muhammed Esed, Elmir Kuliyev, Diyanet, {saheeh}) — haklar mütercimlere ve yayıncılara aittir.',
      'Tefsir metinleri ({quranCom} üzerinden yüklenir), kıraat kayıtları, fotoğraflar ve harita verileri.',
      'Nevevî’nin kırk hadisinin İngilizce metni — telif hakkıyla korunan bir tercümeye çok yakın olduğu için.',
      'Hadislerin tercümeleri — kullanım şartlarımıza göre hakları ilgili sahiplerine aittir.',
    ],
    licensesLink: 'Tüm kaynaklar ve lisanslar',
    useTitle: 'Kullanım',
    useText: 'Dosyalar sıradan statik dosyalardır: anahtar, kayıt ve sınır yoktur. Sunucu, başka bir sitedeki tarayıcıdan okunabilmeleri için {cors} başlığı ({corsHeader}) gönderir. Bir kopyayı kendi sunucunuzda tutmak daha güvenilirdir — ara sıra güncelleyin.',
    updated: 'Dosyalar her site güncellemesinde yeniden oluşturulur; tarih {generatedField} alanındadır.',
    widgetTitle: 'Namaz vakitleri aracı',
    widgetText: 'Sitenizde namaz vakitlerini göstermek için hazır aracı (tek satırlık betik veya {iframe}) kullanın.',
    widgetLink: 'Aracı kur',
  },
}

const SAMPLE = `fetch('${BASE}hadiths-en.json')
  .then(r => r.json())
  .then(d => console.log(d.license, d.items.length))`

// Mətndəki texniki adlar ({x}) — dildən asılı deyil, kod/ad kimi göstərilir
const ext = (href, label) => <a href={href} target="_blank" rel="noopener noreferrer" dir="ltr">{label}</a>
const code = (s) => <code dir="ltr">{s}</code>
const TOKENS = {
  license: ext(LICENSE.url, LICENSE.name),
  lang: code('{lang}'),
  langs: <span dir="ltr">az, en, ru, ar, tr</span>,
  textField: code('text'),
  arabicField: code('arabic'),
  generatedField: code('generated'),
  cors: <span dir="ltr">CORS</span>,
  corsHeader: code('Access-Control-Allow-Origin: *'),
  iframe: code('iframe'),
  quranCom: ext('https://quran.com/', 'Quran.com'),
  siteUrl: <span dir="ltr">https://muslims.cc/open-data</span>,
  saheeh: <span dir="ltr">Saheeh International</span>,
}

/** "{token}" yer tutucularını TOKENS elementləri ilə əvəz et. */
function fmt(text) {
  return String(text).split(/(\{\w+\})/).map((part, i) => {
    const m = /^\{(\w+)\}$/.exec(part)
    return m && TOKENS[m[1]] ? <span key={i} className="od-token">{TOKENS[m[1]]}</span> : part
  })
}

export default function OpenDataPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang] || T.az
  const group = navGroupLabel(navGroupOf('opendata'), lang)

  return (
    <div className="od-page">
      <header className="ui-page-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container" data-reveal="stagger">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{group || t.eyebrow}</span>
          <h1 className="ui-display">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
          <div className="ui-page-hero__actions">
            <a className="ui-btn ui-btn--primary" href={`${BASE}index.json`} target="_blank" rel="noopener noreferrer">
              <Icon name="download" className="ui-btn__icon" /> <span dir="ltr">index.json</span>
            </a>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container od-layout">
          <h2 className="ui-title" data-reveal>{t.filesTitle}</h2>
          <div className="od-table-wrap ui-card ui-card--flush" tabIndex={0}>
            <table className="od-table">
              <thead>
                <tr><th scope="col">{t.fileCol}</th><th scope="col">{t.descCol}</th><th scope="col">{t.fieldsCol}</th></tr>
              </thead>
              <tbody>
                {FILES.map(f => (
                  <tr key={f.key}>
                    <th scope="row">
                      {f.langs
                        ? <code dir="ltr">{f.file}</code>
                        : <a href={BASE + f.file} target="_blank" rel="noopener noreferrer"><code dir="ltr">{f.file}</code></a>}
                      {f.langs && (
                        <span className="od-langs" dir="ltr">
                          {['az', 'en', 'ru', 'ar', 'tr'].map(l => (
                            <a key={l} href={BASE + f.file.replace('{lang}', l)} target="_blank" rel="noopener noreferrer" className="ui-badge ui-badge--brand">{l}</a>
                          ))}
                        </span>
                      )}
                    </th>
                    <td>{fmt(t.desc[f.key])}</td>
                    <td><span className="od-fields" dir="ltr">{f.fields.map(x => <code key={x}>{x}</code>)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="od-note">{fmt(t.langsNote)}</p>

          <div className="ui-grid od-grid" style={{ '--ui-grid-min': '300px' }}>
            <div className="ui-card od-card">
              <h2 className="ui-title ui-title--sm">{t.licenseTitle}</h2>
              <p>{fmt(t.license)}</p>
              <p>{t.attribution}</p>
              <pre className="od-pre" dir="auto" tabIndex={0}><code>{fmt(t.attrSample)}</code></pre>
              <ul className="od-list">{t.attrRules.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
            <div className="ui-card od-card">
              <h2 className="ui-title ui-title--sm">{t.excludedTitle}</h2>
              <p>{t.excludedLead}</p>
              <ul className="od-list">{t.excluded.map((r, i) => <li key={i}>{fmt(r)}</li>)}</ul>
              <PageLink to="licenses" setPage={setPage} className="ui-link">
                {t.licensesLink} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
              </PageLink>
            </div>
          </div>

          <div className="ui-card od-card">
            <h2 className="ui-title ui-title--sm">{t.useTitle}</h2>
            <p>{fmt(t.useText)}</p>
            <pre className="od-pre" dir="ltr" tabIndex={0}><code>{SAMPLE}</code></pre>
            <p className="od-note">{fmt(t.updated)}</p>
          </div>

          <div className="ui-card ui-card--sunken od-card od-widget">
            <span className="ui-icon-tile" aria-hidden="true"><Icon name="widget" /></span>
            <div>
              <h2 className="ui-title ui-title--sm">{t.widgetTitle}</h2>
              <p>{fmt(t.widgetText)}</p>
              <PageLink to="widget" setPage={setPage} className="ui-link">
                {t.widgetLink} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
              </PageLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
