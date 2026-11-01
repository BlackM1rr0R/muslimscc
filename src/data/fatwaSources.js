// ═══════════════════════════════════════════════════════
// FƏTVALAR VƏ ELM MƏNBƏLƏRİ — /fatwa səhifəsinin məlumatı
//
// Burada BİZİM fətva mətnimiz YOXDUR — yalnız Sələf alimlərinin rəsmi
// saytlarına və etibarlı hədis bazalarına keçidlər kataloqu. Cavablar
// müvafiq alimlərə məxsusdur; keçidlər kənar saytı yeni vərəqdə açır.
//
// URL yoxlaması: hər URL 2026-11-01 tarixində əl ilə yoxlanıb — HTTP 200 və
// səhifə başlığı (<title>) gözlənən mövzu/kitab adı ilə üst-üstə düşür.
// SPA saytlarda (binothaimeen.net, alifta.gov.sa) başlıq brauzerdə (Playwright)
// render olunduqdan sonra oxunub. dorar.net və sunnah.com Cloudflare arxasındadır:
// curl ilə 200 + başlıq yoxlanıb.
// Yoxlana BİLMƏYƏNLƏR əlavə edilməyib: alfawzan.af.org.sa (SSL sertifikatının
// müddəti bitib), alalbany.net (domen açılmır), sahab.net (cavab yoxdur),
// binothaimeen.net-in mövzu indeksləri (sabit URL-i yoxdur).
// Yeni keçid əlavə edəndə: əvvəl yoxla, sonra VERIFIED_ON-u yenilə.
// ═══════════════════════════════════════════════════════

/** Bütün URL-lərin son yoxlanma tarixi */
export const VERIFIED_ON = '2026-11-01'

/** Sayt dilləri (keçid süzgəci) — saytın öz dilinə görə */
export const FATWA_LANGS = ['az', 'en', 'ru', 'ar', 'tr']
export const LANG_LABELS = {
  az: { az: 'Azərbaycanca', en: 'Azerbaijani', ru: 'Азербайджанский', ar: 'الأذربيجانية', tr: 'Azerbaycanca' },
  en: { az: 'İngiliscə', en: 'English', ru: 'Английский', ar: 'الإنجليزية', tr: 'İngilizce' },
  ru: { az: 'Rusca', en: 'Russian', ru: 'Русский', ar: 'الروسية', tr: 'Rusça' },
  ar: { az: 'Ərəbcə', en: 'Arabic', ru: 'Арабский', ar: 'العربية', tr: 'Arapça' },
  tr: { az: 'Türkcə', en: 'Turkish', ru: 'Турецкий', ar: 'التركية', tr: 'Türkçe' },
}

// HadeethEnc axtarış interfeysi: ərəb dilində ərəbcə, qalanlarda ingiliscə
const HE_SEARCH_UI = { ar: 'ar' }

// ── 1) Hədis yoxlayıcısı — yalnız kənar axtarışa keçid (scraping/API yoxdur) ──
// search(q, lang) → URL; lang — saytın interfeys dili (dəstəklənirsə)
export const HADITH_TOOLS = [
  {
    id: 'dorar',
    name: 'ad-Durar as-Saniyyah',
    nameAr: 'الموسوعة الحديثية — الدرر السنية',
    langs: ['ar'],
    home: 'https://dorar.net/hadith',
    search: (q) => `https://dorar.net/hadith/search?q=${encodeURIComponent(q)}`,
    desc: {
      az: 'Ərəbcə mətnin bir hissəsini yazın: hər rəvayətin yanında mühəddisin adı, mənbə kitab və «خلاصة حكم المحدث» — onun hökmü göstərilir.',
      en: 'Type part of the Arabic text: each narration shows the hadith scholar, the source book and “خلاصة حكم المحدث” — his verdict.',
      ru: 'Введите часть арабского текста: у каждого предания указаны мухаддис, книга-источник и «خلاصة حكم المحدث» — его оценка.',
      ar: 'اكتب جزءًا من نص الحديث، فتظهر لكل رواية: المحدِّث، والمصدر، وخلاصة حكم المحدِّث.',
      tr: 'Arapça metnin bir kısmını yazın: her rivayetin yanında muhaddisin adı, kaynak kitap ve «خلاصة حكم المحدث» — onun hükmü gösterilir.',
    },
  },
  {
    id: 'hadeethenc',
    name: 'HadeethEnc',
    nameAr: 'موسوعة الأحاديث النبوية',
    langs: ['ar', 'en'],
    home: 'https://hadeethenc.com/ar/home',
    homes: { az: 'https://hadeethenc.com/az/home', ru: 'https://hadeethenc.com/ru/home', tr: 'https://hadeethenc.com/tr/home', en: 'https://hadeethenc.com/en/home', ar: 'https://hadeethenc.com/ar/home' },
    // Axtarış səhifəsi yalnız ərəb və ingilis interfeysində var (az/ru/tr — 404)
    search: (q, lang) => `https://hadeethenc.com/${HE_SEARCH_UI[lang] || 'en'}/hybrid-search?query=${encodeURIComponent(q)}`,
    desc: {
      // lang-ok[ensiklopediyanın]: Azərbaycan sözüdür (ensiklopediya)
      az: 'Səhih hədislərin şərhli tərcüməsi; axtarış ingilis və ərəb dilində işləyir, ensiklopediyanın özü Azərbaycan dilində də var.',
      en: 'Translated authentic hadith with explanations; search works in English and Arabic, and the encyclopedia itself is available in many languages.',
      ru: 'Переводы достоверных хадисов с разъяснениями; поиск работает на английском и арабском, сама энциклопедия есть и на русском.',
      ar: 'ترجمة الأحاديث الصحيحة مع شرحها؛ البحث متاح بالعربية والإنجليزية، والموسوعة مترجمة إلى لغات كثيرة.',
      tr: 'Sahih hadislerin şerhli tercümesi; arama İngilizce ve Arapça çalışır, ansiklopedinin kendisi Türkçe de mevcuttur.',
    },
  },
  {
    id: 'sunnah',
    name: 'Sunnah.com',
    nameAr: 'سنة دوت كوم',
    langs: ['en', 'ar'],
    home: 'https://sunnah.com/',
    search: (q) => `https://sunnah.com/search?q=${encodeURIComponent(q)}`,
    desc: {
      az: 'Əsas hədis toplularının ərəbcə mətni və ingiliscə tərcüməsi; Sünən kitablarında hədisin altında dərəcəsi (məs. Albaninin hökmü) yazılır.',
      en: 'The main hadith collections in Arabic with English translation; in the Sunan books the grade (e.g. al-Albani’s verdict) is shown under the hadith.',
      ru: 'Основные сборники хадисов на арабском с английским переводом; в Сунанах под хадисом указана степень (например, оценка аль-Албани).',
      ar: 'كتب الحديث الأصول بنصها العربي وترجمتها الإنجليزية، وفي السنن يُذكر تحت الحديث حكمه (كحكم الألباني).',
      tr: 'Temel hadis kitaplarının Arapça metni ve İngilizce tercümesi; Sünenlerde hadisin altında derecesi (ör. Elbânî’nin hükmü) yazılır.',
    },
  },
]

// ── 2) Hədis dərəcələri — qısa, neytral təriflər (src/data/lessons/mustalah.js ilə uyğun) ──
export const GRADES = [
  {
    id: 'sahih', ar: 'صحيح', tone: 'ok',
    label: { az: 'Səhih', en: 'Sahih (authentic)', ru: 'Сахих (достоверный)', ar: 'الصحيح', tr: 'Sahih' },
    def: {
      az: 'İsnad bitişikdir, ravilər ədalətli və dəqiqdir, şaz və gizli qüsur (illət) yoxdur.',
      en: 'A connected chain of upright, precise narrators, with no irregularity (shudhudh) and no hidden defect (‘illah).',
      ru: 'Непрерывный иснад, правдивые и точные передатчики, нет противоречия (шузуз) и скрытого изъяна (‘илля).',
      ar: 'ما اتصل سنده بنقل العدل الضابط عن مثله إلى منتهاه، من غير شذوذ ولا علة.',
      tr: 'Senedi kesintisizdir, râviler âdil ve zabtlıdır, şâz ve gizli kusur (illet) yoktur.',
    },
    rule: { az: 'Dəlildir, ona əməl edilir.', en: 'Evidence; acted upon.', ru: 'Довод, по нему действуют.', ar: 'حجة يعمل به.', tr: 'Delildir, onunla amel edilir.' },
  },
  {
    id: 'hasan', ar: 'حسن', tone: 'ok',
    label: { az: 'Həsən', en: 'Hasan (good)', ru: 'Хасан (хороший)', ar: 'الحسن', tr: 'Hasen' },
    def: {
      az: 'Şərtlər səhihdəki kimidir, amma ravilərdən birinin dəqiqliyi bir az aşağıdır.',
      en: 'The same conditions as sahih, but one narrator’s precision is slightly lower.',
      ru: 'Те же условия, что у сахиха, но точность одного из передатчиков немного ниже.',
      ar: 'كالصحيح إلا أن ضبط بعض رواته خفّ.',
      tr: 'Şartlar sahihteki gibidir, ancak râvilerden birinin zabtı biraz daha düşüktür.',
    },
    rule: { az: 'Dəlildir, ona əməl edilir.', en: 'Evidence; acted upon.', ru: 'Довод, по нему действуют.', ar: 'حجة يعمل به.', tr: 'Delildir, onunla amel edilir.' },
  },
  {
    id: 'daif', ar: 'ضعيف', tone: 'warn',
    label: { az: 'Zəif', en: 'Da‘if (weak)', ru: 'Даиф (слабый)', ar: 'الضعيف', tr: 'Zayıf' },
    def: {
      az: 'Həsənin şərtlərindən biri yoxdur: isnad qırıqdır və ya ravi zəif, yaxud naməlumdur.',
      en: 'One of the conditions of hasan is missing: a broken chain, or a weak or unknown narrator.',
      ru: 'Отсутствует одно из условий хасана: разрыв в иснаде либо слабый или неизвестный передатчик.',
      ar: 'ما فقد شرطًا من شروط الحسن، كانقطاع السند أو ضعف الراوي أو جهالته.',
      tr: 'Hasenin şartlarından biri eksiktir: sened kopuktur ya da râvi zayıf veya meçhuldür.',
    },
    rule: { az: 'Hökm onun üzərində qurulmur.', en: 'No ruling is built on it.', ru: 'На нём не строят положений.', ar: 'لا يبنى عليه حكم.', tr: 'Hüküm onun üzerine kurulmaz.' },
  },
  {
    id: 'mawdu', ar: 'موضوع', tone: 'bad',
    label: { az: 'Mövzu (uydurma)', en: 'Mawdu‘ (fabricated)', ru: 'Мауду (выдуманный)', ar: 'الموضوع', tr: 'Mevzu (uydurma)' },
    def: {
      az: 'Peyğəmbərə ﷺ yalan olaraq aid edilmiş, uydurulmuş söz.',
      en: 'A fabricated lie attributed to the Prophet ﷺ.',
      ru: 'Ложь, выдуманная и приписанная Пророку ﷺ.',
      ar: 'المكذوب المختلق المنسوب إلى النبي ﷺ.',
      tr: 'Peygamber’e ﷺ yalan olarak isnat edilmiş uydurma söz.',
    },
    rule: { az: 'Ona əməl etmək haramdır; yalnız yalan olduğunu bildirmək üçün zikr olunur.', en: 'Acting on it is forbidden; it is mentioned only to expose it.', ru: 'Действовать по нему запрещено; его упоминают лишь для разоблачения.', ar: 'يحرم العمل به، ولا تجوز روايته إلا مع بيان حاله.', tr: 'Onunla amel etmek haramdır; yalnızca uydurma olduğunu bildirmek için zikredilir.' },
  },
]

/** Dərəcəni oxuyarkən qısa qeydlər */
export const GRADE_TIPS = [
  {
    az: '«إسناده صحيح» (isnadı səhihdir) yalnız zəncir haqqındadır; hədisin bütövlükdə səhih olması üçün şaz və illət olmaması da lazımdır.',
    en: '“إسناده صحيح” (its chain is sound) speaks of the chain only; for the hadith as a whole to be sahih it must also be free of irregularity and hidden defects.',
    ru: '«إسناده صحيح» (иснад достоверен) говорит только о цепочке; чтобы весь хадис был сахих, нужно ещё отсутствие шузуза и ‘илля.',
    ar: 'قولهم «إسناده صحيح» حكم على السند وحده، ولا يلزم منه صحة الحديث حتى يسلم من الشذوذ والعلة.',
    tr: '«إسناده صحيح» (senedi sahihtir) yalnızca zincir hakkındadır; hadisin bütünüyle sahih olması için şâz ve illetin bulunmaması da gerekir.',
  },
  {
    az: '«li-ğeyrihi» (başqa yollarla) — yüngül zəif yollar bir-birini gücləndirib, hədis həsən və ya səhih dərəcəsinə yüksəlib.',
    en: '“li-ghayrihi” (through other routes) — mildly weak routes strengthen each other and raise the hadith to hasan or sahih.',
    ru: '«ли-гайрихи» (благодаря другим путям) — слегка слабые пути укрепляют друг друга и поднимают хадис до хасана или сахиха.',
    ar: '«لغيره»: أي تقوّى بتعدد طرقه الضعيفة ضعفًا يسيرًا فارتقى إلى الحسن أو الصحيح.',
    tr: '«li-gayrihî» (başka yollarla) — hafif zayıf yollar birbirini güçlendirir ve hadis hasen veya sahih derecesine yükselir.',
  },
  {
    az: 'Eyni hədis haqqında alimlərin hökmü fərqli ola bilər — mühəddisin adına və mənbəyə baxın. Məşhur olmaq və ya gözəl məna hədisi səhih etmir.',
    en: 'Scholars may differ on the same hadith — look at who graded it and where. Being famous or having a beautiful meaning does not make a hadith authentic.',
    ru: 'Оценки учёных об одном хадисе могут различаться — смотрите, кто и где его оценил. Известность или красивый смысл не делают хадис достоверным.',
    ar: 'قد تختلف أحكام العلماء على الحديث الواحد، فانظر من حكم عليه وأين. والشهرة وحسن المعنى لا يصححان الحديث.',
    tr: 'Aynı hadis hakkında âlimlerin hükmü farklı olabilir — kimin ve nerede hüküm verdiğine bakın. Meşhur olmak veya güzel anlam hadisi sahih yapmaz.',
  },
]

// ── 3) Rəsmi fətva və elm mənbələri ──
// urls — saytın dil versiyaları (hamısı yoxlanıb); url — əsas ünvan
export const SOURCES = [
  {
    id: 'binbaz', kind: 'official',
    name: { az: 'Şeyx İbn Bazın rəsmi saytı', en: 'Official site of Shaykh Ibn Baz', ru: 'Официальный сайт шейха Ибн База', ar: 'الموقع الرسمي لسماحة الشيخ ابن باز', tr: 'Şeyh İbn Bâz’ın resmî sitesi' },
    scholar: { az: 'Şeyx Əbdüləziz ibn Baz (vəf. h. 1420)', en: 'Shaykh ‘Abd al-‘Aziz ibn Baz (d. 1420 AH)', ru: 'Шейх Абд аль-Азиз ибн Баз (ум. 1420 г. х.)', ar: 'الشيخ عبد العزيز بن عبد الله بن باز (ت 1420هـ)', tr: 'Şeyh Abdulazîz b. Bâz (v. h. 1420)' },
    host: 'binbaz.org.sa',
    url: 'https://binbaz.org.sa/',
    urls: { ar: 'https://binbaz.org.sa/' },
    extra: [
      { label: { az: 'Fətvalar toplusu', en: 'Collected fatwas', ru: 'Сборник фетв', ar: 'مجموع الفتاوى', tr: 'Fetvalar külliyatı' }, url: 'https://binbaz.org.sa/fatwas/kind/1' },
      { label: { az: 'Görüşlər', en: 'Meetings', ru: 'Встречи', ar: 'اللقاءات', tr: 'Sohbetler' }, url: 'https://binbaz.org.sa/discussions' },
    ],
    desc: {
      az: 'Şeyxin fətvaları, məqalələri, kitabları və dərs şərhləri — fiqh və mövzu bölmələri üzrə.',
      en: 'The Shaykh’s fatwas, articles, books and lesson commentaries, arranged by fiqh chapter and topic.',
      ru: 'Фетвы, статьи, книги и разъяснения шейха, разделённые по главам фикха и темам.',
      ar: 'فتاوى الشيخ ومقالاته وكتبه وشروحه مرتبة على الأبواب الفقهية والموضوعية.',
      tr: 'Şeyhin fetvaları, makaleleri, kitapları ve ders şerhleri — fıkıh ve konu bölümlerine göre.',
    },
  },
  {
    id: 'binothaimeen', kind: 'official',
    name: { az: 'Şeyx İbn Useyminin rəsmi saytı', en: 'Official site of Shaykh Ibn ‘Uthaymin', ru: 'Официальный сайт шейха Ибн Усеймина', ar: 'الموقع الرسمي لفضيلة الشيخ ابن عثيمين', tr: 'Şeyh İbn Useymîn’in resmî sitesi' },
    scholar: { az: 'Şeyx Muhəmməd ibn Salih əl-Useymin (vəf. h. 1421)', en: 'Shaykh Muhammad ibn Salih al-‘Uthaymin (d. 1421 AH)', ru: 'Шейх Мухаммад ибн Салих аль-Усеймин (ум. 1421 г. х.)', ar: 'الشيخ محمد بن صالح العثيمين (ت 1421هـ)', tr: 'Şeyh Muhammed b. Sâlih el-Useymîn (v. h. 1421)' },
    host: 'binothaimeen.net',
    url: 'https://binothaimeen.net/',
    urls: { ar: 'https://binothaimeen.net/' },
    extra: [
      { label: { az: 'Fətvalar', en: 'Fatwas', ru: 'Фетвы', ar: 'الفتاوى', tr: 'Fetvalar' }, url: 'https://binothaimeen.net/ar/blog/الفتاوى/3d02e372-dd97-49bd-b5db-f1eacc3f623c/الفتاوى' },
      { label: { az: 'Elmi şərhlər (audio)', en: 'Scholarly commentaries (audio)', ru: 'Научные разъяснения (аудио)', ar: 'الشروحات العلمية', tr: 'İlmî şerhler (ses)' }, url: 'https://binothaimeen.net/ar/voice_library/الشروحات العلمية/df9776db-d45c-4318-a839-1910140b2cd2' },
      { label: { az: 'Görüşlər və fətvalar (audio)', en: 'Meetings and fatwas (audio)', ru: 'Встречи и фетвы (аудио)', ar: 'اللقاءات والفتاوى', tr: 'Sohbetler ve fetvalar (ses)' }, url: 'https://binothaimeen.net/ar/voice_library/اللقاءات والفتاوى/59d21fb4-6758-4c4a-9240-440aca48eb59' },
    ],
    desc: {
      az: 'Şeyxin kitabları, minlərlə audio dərs, mətnlərin şərhləri və fətvaları; tərcümə olunmuş kitablar bölməsi də var.',
      en: 'The Shaykh’s books, thousands of audio lessons, commentaries on the classical texts and fatwas, plus a section of translated books.',
      ru: 'Книги шейха, тысячи аудиоуроков, разъяснения классических текстов и фетвы; есть раздел переведённых книг.',
      ar: 'مؤلفات الشيخ ومكتبته الصوتية وشروحه للمتون وفتاواه، مع قسم للكتب المترجمة.',
      tr: 'Şeyhin kitapları, binlerce sesli ders, metin şerhleri ve fetvalar; tercüme edilmiş kitaplar bölümü de vardır.',
    },
  },
  {
    id: 'alifta', kind: 'official',
    name: { az: 'Elmi Araşdırmalar və Fətva İdarəsi', en: 'General Presidency of Islamic Research and Ifta', ru: 'Управление научных исследований и фетв', ar: 'الرئاسة العامة للبحوث العلمية والإفتاء', tr: 'İlmî Araştırmalar ve İftâ Başkanlığı' },
    scholar: { az: 'Daimi Fətva Komitəsi və Böyük Alimlər Heyəti (Səudiyyə Ərəbistanı)', en: 'The Permanent Committee for Fatwa and the Council of Senior Scholars (Saudi Arabia)', ru: 'Постоянный комитет по фетвам и Совет старших учёных (Саудовская Аравия)', ar: 'اللجنة الدائمة للفتوى وهيئة كبار العلماء', tr: 'Daimi Fetva Komitesi ve Büyük Âlimler Heyeti (Suudi Arabistan)' },
    host: 'alifta.gov.sa',
    url: 'https://alifta.gov.sa/ar/home',
    urls: { ar: 'https://alifta.gov.sa/ar/home', en: 'https://alifta.gov.sa/en/home' },
    extra: [
      { label: { az: 'Fətvalar cildlər üzrə', en: 'Fatwas by volume', ru: 'Фетвы по томам', ar: 'الفتاوى بالمجلدات', tr: 'Ciltlere göre fetvalar' }, url: 'https://alifta.gov.sa/ar/Fatawa-chapters' },
      { label: { az: 'Elmi məzmun', en: 'Scholarly content', ru: 'Научные материалы', ar: 'المحتوى العلمي', tr: 'İlmî içerik' }, url: 'https://alifta.gov.sa/ar/scientific-content' },
      { label: { az: 'Daimi Fətva Komitəsi', en: 'Permanent Committee', ru: 'Постоянный комитет', ar: 'اللجنة الدائمة للفتوى', tr: 'Daimi Fetva Komitesi' }, url: 'https://alifta.gov.sa/ar/fatwa-committee' },
    ],
    desc: {
      az: 'Daimi Komitənin fətvaları (Şeyx İbn Baz onun sədri olub) və Böyük Alimlər Heyətinin qərarları üçün rəsmi mənbə.',
      en: 'The official source for the Permanent Committee’s fatwas (once chaired by Shaykh Ibn Baz) and the Council of Senior Scholars’ resolutions.',
      ru: 'Официальный источник фетв Постоянного комитета (его возглавлял шейх Ибн Баз) и решений Совета старших учёных.',
      ar: 'المرجع الرسمي لفتاوى اللجنة الدائمة (وقد رأسها الشيخ ابن باز) وقرارات هيئة كبار العلماء.',
      tr: 'Daimi Komitenin fetvaları (Şeyh İbn Bâz başkanlığını yapmıştır) ve Büyük Âlimler Heyeti kararları için resmî kaynak.',
    },
  },
  {
    id: 'islamqa', kind: 'qa',
    // lang-ok[IslamQA]: saytın adıdır (brend)
    name: { az: 'İslam: sual və cavab (IslamQA)', en: 'Islam Question & Answer (IslamQA)', ru: 'Ислам: вопрос и ответ (IslamQA)', ar: 'موقع الإسلام سؤال وجواب', tr: 'İslam Soru-Cevap (IslamQA)' },
    scholar: { az: 'Şeyx Muhəmməd Salih əl-Münəccidin nəzarəti ilə', en: 'Supervised by Shaykh Muhammad Salih al-Munajjid', ru: 'Под руководством шейха Мухаммада Салиха аль-Мунаджжида', ar: 'بإشراف الشيخ محمد صالح المنجد', tr: 'Şeyh Muhammed Sâlih el-Müneccid’in gözetiminde' },
    host: 'islamqa.info',
    url: 'https://islamqa.info/ar',
    urls: { ar: 'https://islamqa.info/ar', en: 'https://islamqa.info/en', ru: 'https://islamqa.info/ru', tr: 'https://islamqa.info/tr' },
    desc: {
      az: 'Dəlilləri və alimlərin sözləri ilə verilən on minlərlə sual-cavab; mövzu kataloqu bir çox dildə eynidir.',
      en: 'Tens of thousands of answers with evidence and scholars’ statements; the same topic catalogue across many languages.',
      ru: 'Десятки тысяч ответов с доводами и словами учёных; единый каталог тем на многих языках.',
      ar: 'عشرات الآلاف من الأجوبة المؤصلة بالأدلة وأقوال أهل العلم، بفهرس موضوعي موحد في لغات كثيرة.',
      tr: 'Deliller ve âlimlerin sözleriyle verilmiş on binlerce soru-cevap; konu kataloğu birçok dilde aynıdır.',
    },
  },
  {
    id: 'islamhouse', kind: 'library',
    // lang-ok[IslamHouse]: saytın adıdır (brend)
    name: { az: 'İslamHouse — çoxdilli kitabxana', en: 'IslamHouse — multilingual library', ru: 'IslamHouse — многоязычная библиотека', ar: 'دار الإسلام', tr: 'IslamHouse — çok dilli kütüphane' },
    scholar: { az: 'Alimlərin kitab, audio və şərhləri — Azərbaycan dilində də', en: 'Scholars’ books, audio and commentaries — in dozens of languages', ru: 'Книги, аудио и разъяснения учёных — на десятках языков', ar: 'كتب العلماء ومحاضراتهم وشروحهم بلغات العالم', tr: 'Âlimlerin kitapları, ses kayıtları ve şerhleri — onlarca dilde' },
    host: 'islamhouse.com',
    url: 'https://islamhouse.com/az/main',
    urls: { az: 'https://islamhouse.com/az/main', en: 'https://islamhouse.com/en', ru: 'https://islamhouse.com/ru', ar: 'https://islamhouse.com/ar/', tr: 'https://islamhouse.com/tr' },
    desc: {
      az: 'Pulsuz kitab, məqalə və audio; Azərbaycan dilindəki kitab və yazılar mövzu kateqoriyaları üzrə düzülüb.',
      en: 'Free books, articles and audio; materials in each language are arranged by topic categories.',
      ru: 'Бесплатные книги, статьи и аудио; материалы на каждом языке разложены по тематическим категориям.',
      ar: 'كتب ومقالات وصوتيات مجانية مرتبة على تصنيف موضوعي لكل لغة.',
      tr: 'Ücretsiz kitap, makale ve ses kayıtları; her dildeki materyaller konu kategorilerine göre düzenlenmiştir.',
    },
  },
  {
    id: 'dorar', kind: 'library',
    name: { az: 'əd-Durər əs-Səniyyə', en: 'ad-Durar as-Saniyyah', ru: 'ад-Дурар ас-Санийя', ar: 'الدرر السنية', tr: 'ed-Dürerü’s-Seniyye' },
    // lang-ok[ensiklopediyaları]: Azərbaycan sözüdür (ensiklopediya)
    scholar: { az: 'Hədis, əqidə və fiqh ensiklopediyaları', en: 'Encyclopedias of hadith, creed and fiqh', ru: 'Энциклопедии хадисов, акыды и фикха', ar: 'موسوعات الحديث والعقيدة والفقه', tr: 'Hadis, akide ve fıkıh ansiklopedileri' },
    host: 'dorar.net',
    url: 'https://dorar.net/',
    urls: { ar: 'https://dorar.net/' },
    extra: [
      // lang-ok[ensiklopediyası]: Azərbaycan sözüdür (ensiklopediya)
      { label: { az: 'Hədis ensiklopediyası', en: 'Hadith encyclopedia', ru: 'Энциклопедия хадисов', ar: 'الموسوعة الحديثية', tr: 'Hadis ansiklopedisi' }, url: 'https://dorar.net/hadith' },
    ],
    desc: {
      // lang-ok[ensiklopediyalar]: Azərbaycan sözüdür (ensiklopediya)
      az: 'Hədislərin mühəddislərin hökmü ilə axtarışı və əqidə, fiqh mövzularında ərəbcə ensiklopediyalar.',
      en: 'Hadith search with the hadith scholars’ verdicts, and Arabic encyclopedias on creed and fiqh.',
      ru: 'Поиск хадисов с оценками мухаддисов и арабские энциклопедии по акыде и фикху.',
      ar: 'البحث في الأحاديث مع أحكام المحدثين، وموسوعات عقدية وفقهية.',
      tr: 'Muhaddislerin hükümleriyle hadis araması ve akide, fıkıh konularında Arapça ansiklopediler.',
    },
  },
  {
    id: 'albadr', kind: 'scholar',
    name: { az: 'Şeyx Əbdürrəzzaq əl-Bədrin saytı', en: 'Site of Shaykh ‘Abd ar-Razzaq al-Badr', ru: 'Сайт шейха Абд ар-Раззака аль-Бадра', ar: 'موقع الشيخ عبد الرزاق البدر', tr: 'Şeyh Abdurrezzâk el-Bedr’in sitesi' },
    scholar: { az: 'Şeyx Əbdürrəzzaq ibn Əbdülmuhsin əl-Bədr', en: 'Shaykh ‘Abd ar-Razzaq ibn ‘Abd al-Muhsin al-Badr', ru: 'Шейх Абд ар-Раззак ибн Абд аль-Мухсин аль-Бадр', ar: 'الشيخ عبد الرزاق بن عبد المحسن البدر', tr: 'Şeyh Abdurrezzâk b. Abdilmuhsin el-Bedr' },
    host: 'al-badr.net',
    url: 'https://www.al-badr.net/',
    urls: { ar: 'https://www.al-badr.net/' },
    desc: {
      az: 'Mədinədə dərs deyən şeyxin dərsləri, mətn şərhləri, məqalə və kitabları.',
      en: 'Lessons, commentaries on texts, articles and books of the Shaykh, who teaches in Madinah.',
      ru: 'Уроки, разъяснения текстов, статьи и книги шейха, преподающего в Медине.',
      ar: 'دروس الشيخ وشروحه للمتون ومقالاته وكتبه.',
      tr: 'Medine’de ders veren şeyhin dersleri, metin şerhleri, makale ve kitapları.',
    },
  },
  {
    id: 'muqbel', kind: 'scholar',
    name: { az: 'Şeyx Muqbil əl-Vadiinin səhifələri', en: 'Pages of Shaykh Muqbil al-Wadi‘i', ru: 'Страницы шейха Мукбиля аль-Вади‘и', ar: 'صفحات الشيخ مقبل بن هادي الوادعي', tr: 'Şeyh Mukbil el-Vâdiî’nin sayfaları' },
    scholar: { az: 'Şeyx Muqbil ibn Hadi əl-Vadii (vəf. h. 1422)', en: 'Shaykh Muqbil ibn Hadi al-Wadi‘i (d. 1422 AH)', ru: 'Шейх Мукбиль ибн Хади аль-Вади‘и (ум. 1422 г. х.)', ar: 'الشيخ مقبل بن هادي الوادعي (ت 1422هـ)', tr: 'Şeyh Mukbil b. Hâdî el-Vâdiî (v. h. 1422)' },
    host: 'muqbel.net',
    url: 'https://muqbel.net/',
    urls: { ar: 'https://muqbel.net/' },
    desc: {
      az: 'Yəmənli mühəddisin fətvaları, audio dərsləri və kitabları.',
      en: 'Fatwas, audio lessons and books of the Yemeni hadith scholar.',
      ru: 'Фетвы, аудиоуроки и книги йеменского мухаддиса.',
      ar: 'فتاوى المحدث اليمني ودروسه الصوتية وكتبه.',
      tr: 'Yemenli muhaddisin fetvaları, sesli dersleri ve kitapları.',
    },
  },
]

// Mənbə adının qısa forması (mövzu keçidlərində nişan kimi)
export const SOURCE_SHORT = { binbaz: 'binbaz.org.sa', islamqa: 'IslamQA', islamhouse: 'IslamHouse', binothaimeen: 'binothaimeen.net', alifta: 'alifta.gov.sa', dorar: 'dorar.net' }

// ── 4) Mövzu kataloqu — hər mövzunun mənbə saytlardakı İNDEKS səhifəsi ──
// link: [mənbə, sayt dili, url, alt bölmənin ərəbcə adı (olarsa)]
const IQ = (id) => ['en', 'ar', 'ru', 'tr'].map(l => ['islamqa', l, `https://islamqa.info/${l}/categories/topics/${id}`])
const IH = (id) => ['az', 'ru', 'tr'].map(l => ['islamhouse', l, `https://islamhouse.com/${l}/category/${id}/showall/showall/1/`])
const BB = (path, sub) => [['binbaz', 'ar', `https://binbaz.org.sa/categories/${path}`, sub]]

export const TOPICS = [
  { id: 'aqidah', icon: 'shield', ar: 'العقيدة',
    label: { az: 'Əqidə', en: 'Creed (‘aqidah)', ru: 'Вероубеждение (акыда)', ar: 'العقيدة', tr: 'Akide' },
    links: [...BB('objective/204'), ...BB('objective/209', 'نواقض الإسلام'), ...IQ(3), ...IH(192525)] },
  { id: 'taharah', icon: 'drop', ar: 'الطهارة',
    label: { az: 'Təharət', en: 'Purification', ru: 'Очищение', ar: 'الطهارة', tr: 'Taharet' },
    links: [...BB('fiqhi/9'), ...IQ(58), ...IH(192809)] },
  { id: 'salah', icon: 'prayer', ar: 'الصلاة',
    label: { az: 'Namaz', en: 'Prayer', ru: 'Молитва', ar: 'الصلاة', tr: 'Namaz' },
    links: [...BB('fiqhi/22'), ...IQ(70), ...IH(192812)] },
  { id: 'janaiz', icon: 'leaf', ar: 'الجنائز',
    label: { az: 'Cənazə', en: 'Funerals', ru: 'Похороны', ar: 'الجنائز', tr: 'Cenaze' },
    links: [...BB('fiqhi/59'), ...IQ(142), ...IH(192818)] },
  { id: 'zakat', icon: 'zakat', ar: 'الزكاة',
    label: { az: 'Zəkat', en: 'Zakat', ru: 'Закят', ar: 'الزكاة', tr: 'Zekât' },
    links: [...BB('fiqhi/68'), ...IQ(99), ...IH(461271)] },
  { id: 'siyam', icon: 'ramadan', ar: 'الصيام',
    label: { az: 'Oruc', en: 'Fasting', ru: 'Пост', ar: 'الصيام', tr: 'Oruç' },
    links: [...BB('fiqhi/77'), ...IQ(108), ...IH(316761)] },
  { id: 'hajj', icon: 'hajjguide', ar: 'الحج والعمرة',
    label: { az: 'Həcc və ümrə', en: 'Hajj & ‘Umrah', ru: 'Хадж и умра', ar: 'الحج والعمرة', tr: 'Hac ve umre' },
    links: [...BB('fiqhi/96'), ...IQ(126), ...IH(461274)] },
  { id: 'family', icon: 'group', ar: 'فقه الأسرة',
    label: { az: 'Ailə və nikah', en: 'Family & marriage', ru: 'Семья и брак', ar: 'فقه الأسرة', tr: 'Aile ve nikâh' },
    links: [...BB('fiqhi/155'), ...IQ(34), ...IH(398209)] },
  { id: 'women', icon: 'user', ar: 'قضايا المرأة',
    label: { az: 'Qadın məsələləri', en: 'Women’s issues', ru: 'Женские вопросы', ar: 'قضايا المرأة', tr: 'Kadınlarla ilgili meseleler' },
    links: [...BB('objective/252')] },
  { id: 'muamalat', icon: 'charity', ar: 'المعاملات',
    label: { az: 'Alış-veriş və maliyyə', en: 'Transactions & finance', ru: 'Торговля и финансы', ar: 'المعاملات', tr: 'Muamelat ve ticaret' },
    links: [...BB('fiqhi/121'), ...IQ(145), ...IH(313570)] },
  { id: 'faraid', icon: 'inheritance', ar: 'الفرائض',
    label: { az: 'Miras', en: 'Inheritance', ru: 'Наследство', ar: 'الفرائض', tr: 'Miras' },
    links: [...BB('fiqhi/153'), ...IQ(205)] },
  { id: 'food', icon: 'flask', ar: 'الأطعمة والأشربة',
    label: { az: 'Yemək və içki', en: 'Food & drink', ru: 'Еда и напитки', ar: 'الأطعمة والأشربة', tr: 'Yiyecek ve içecek' },
    links: [...BB('fiqhi/181'), ...IQ(192), ...IH(193753)] },
  { id: 'adab', icon: 'star', ar: 'الآداب والأخلاق',
    label: { az: 'Ədəb və əxlaq', en: 'Manners & character', ru: 'Этикет и нрав', ar: 'الآداب والأخلاق', tr: 'Adap ve ahlak' },
    links: [...BB('objective/225'), ...IQ(223), ...IH(192527)] },
  { id: 'adhkar', icon: 'duas', ar: 'الأدعية والأذكار',
    label: { az: 'Dua və zikr', en: 'Du‘a & dhikr', ru: 'Дуа и зикр', ar: 'الأدعية والأذكار', tr: 'Dua ve zikir' },
    links: [...BB('objective/239'), ...IH(728014)] },
  { id: 'bidah', icon: 'alert', ar: 'البدع والمحدثات',
    label: { az: 'Bidətlər', en: 'Innovations (bid‘ah)', ru: 'Нововведения (бид‘а)', ar: 'البدع والمحدثات', tr: 'Bid’atler' },
    links: [...BB('objective/217'), ...IH(729040)] },
  { id: 'hadith', icon: 'hadith', ar: 'الحديث وعلومه',
    label: { az: 'Hədis və elmləri', en: 'Hadith & its sciences', ru: 'Хадис и его науки', ar: 'الحديث وعلومه', tr: 'Hadis ve hadis ilimleri' },
    links: [...BB('objective/200'), ...BB('objective/203', 'الحكم على الأحاديث'), ...IQ(25), ...IH(132381)] },
]

// ── 5) Mətnlərin (mütun) şərhləri — audio dərslər və kitablar ──
// lesson — bizdə eyni mətnin dərsi (/learn/<slug>); page — bizdə olan səhifə (routes.js açarı)
// links: [mənbə, şərh edən (5 dil), növ: audio|book, url]
const IBN_BAZ = { az: 'Şeyx İbn Baz', en: 'Shaykh Ibn Baz', ru: 'Шейх Ибн Баз', ar: 'الشيخ ابن باز', tr: 'Şeyh İbn Bâz' }
const IBN_UTH = { az: 'Şeyx İbn Useymin', en: 'Shaykh Ibn ‘Uthaymin', ru: 'Шейх Ибн Усеймин', ar: 'الشيخ ابن عثيمين', tr: 'Şeyh İbn Useymîn' }
const FAWZAN = { az: 'Şeyx Salih əl-Fövzan', en: 'Shaykh Salih al-Fawzan', ru: 'Шейх Салих аль-Фаузан', ar: 'الشيخ صالح الفوزان', tr: 'Şeyh Sâlih el-Fevzân' }

export const COMMENTARIES = [
  {
    id: 'kitab-at-tawhid', ar: 'كتاب التوحيد', lesson: 'kitab-at-tawhid', topic: 'aqidah',
    title: { az: 'Kitabut-Tövhid', en: 'Kitab at-Tawhid', ru: 'Книга единобожия', ar: 'كتاب التوحيد', tr: 'Kitâbu’t-Tevhîd' },
    author: { az: 'Muhəmməd ibn Abdülvəhhab', en: 'Muhammad ibn ‘Abd al-Wahhab', ru: 'Мухаммад ибн Абд аль-Ваххаб', ar: 'محمد بن عبد الوهاب', tr: 'Muhammed b. Abdilvehhâb' },
    links: [
      ['binbaz', IBN_BAZ, 'audio', 'https://binbaz.org.sa/audios/series/83/شرح-كتاب-التوحيد'],
      ['binbaz', IBN_BAZ, 'audio', 'https://binbaz.org.sa/audios/series/84/شرح-كتاب-التوحيد-الشرح-الجديد-عام-1415هـ', { az: '1415-ci il şərhi', en: '1415 AH commentary', ru: 'разъяснение 1415 г. х.', ar: 'الشرح الجديد 1415هـ', tr: '1415 yılı şerhi' }],
      ['binothaimeen', IBN_UTH, 'audio', 'https://binothaimeen.net/ar/voice_library/sectionDetails/الشروحات العلمية/العقيدة/شرح كتاب التوحيد/81e72c36-9e26-415d-9af4-405f4fbe853a'],
      ['islamhouse', FAWZAN, 'audio', 'https://islamhouse.com/ar/audios/2832250'],
    ],
  },
  {
    id: 'usul-ath-thalatha', ar: 'ثلاثة الأصول', lesson: 'usul-ath-thalatha', topic: 'aqidah',
    title: { az: 'Üç əsas (əl-Üsul əs-Sələsə)', en: 'The Three Fundamental Principles', ru: 'Три основы', ar: 'ثلاثة الأصول وأدلتها', tr: 'Üç Esas (el-Usûlü’s-Selâse)' },
    author: { az: 'Muhəmməd ibn Abdülvəhhab', en: 'Muhammad ibn ‘Abd al-Wahhab', ru: 'Мухаммад ибн Абд аль-Ваххаб', ar: 'محمد بن عبد الوهاب', tr: 'Muhammed b. Abdilvehhâb' },
    links: [
      ['binbaz', IBN_BAZ, 'audio', 'https://binbaz.org.sa/audios/series/98/شرح-الاصول-الثلاثة-الشرح-الاول'],
      ['islamhouse', IBN_BAZ, 'book', 'https://islamhouse.com/ar/books/2380'],
      ['binothaimeen', IBN_UTH, 'audio', 'https://binothaimeen.net/ar/voice_library/sectionDetails/الشروحات العلمية/العقيدة/شرح ثلاثة الأصول/3c3e2497-c5ad-4383-8675-f475994f7521'],
      ['islamhouse', FAWZAN, 'audio', 'https://islamhouse.com/ar/audios/2774966'],
    ],
  },
  {
    id: 'al-qawaid-al-arba', ar: 'القواعد الأربع', lesson: 'al-qawaid-al-arba', topic: 'aqidah',
    title: { az: 'Dörd qayda', en: 'The Four Principles', ru: 'Четыре правила', ar: 'القواعد الأربع', tr: 'Dört Kural' },
    author: { az: 'Muhəmməd ibn Abdülvəhhab', en: 'Muhammad ibn ‘Abd al-Wahhab', ru: 'Мухаммад ибн Абд аль-Ваххаб', ar: 'محمد بن عبد الوهاب', tr: 'Muhammed b. Abdilvehhâb' },
    links: [
      ['islamhouse', IBN_BAZ, 'audio', 'https://islamhouse.com/ar/audios/2828142'],
      ['islamhouse', FAWZAN, 'book', 'https://islamhouse.com/ar/books/2403'],
    ],
  },
  {
    id: 'nawaqid-al-islam', ar: 'نواقض الإسلام', lesson: 'nawaqid-al-islam', topic: 'aqidah',
    title: { az: 'İslamı pozan on şey', en: 'The Nullifiers of Islam', ru: 'Десять отменяющих Ислам', ar: 'نواقض الإسلام', tr: 'İslam’ı Bozan Şeyler' },
    author: { az: 'Muhəmməd ibn Abdülvəhhab', en: 'Muhammad ibn ‘Abd al-Wahhab', ru: 'Мухаммад ибн Абд аль-Ваххаб', ar: 'محمد بن عبد الوهاب', tr: 'Muhammed b. Abdilvehhâb' },
    links: [
      ['islamhouse', IBN_BAZ, 'book', 'https://islamhouse.com/ar/books/2826050'],
      ['islamhouse', FAWZAN, 'audio', 'https://islamhouse.com/ar/audios/2828187'],
      ['islamhouse', FAWZAN, 'book', 'https://islamhouse.com/ar/books/314803'],
    ],
  },
  {
    id: 'kashf-ash-shubuhat', ar: 'كشف الشبهات', topic: 'aqidah',
    title: { az: 'Şübhələrin aradan qaldırılması', en: 'Removal of the Doubts', ru: 'Устранение сомнений', ar: 'كشف الشبهات', tr: 'Şüphelerin Giderilmesi' },
    author: { az: 'Muhəmməd ibn Abdülvəhhab', en: 'Muhammad ibn ‘Abd al-Wahhab', ru: 'Мухаммад ибн Абд аль-Ваххаб', ar: 'محمد بن عبد الوهاب', tr: 'Muhammed b. Abdilvehhâb' },
    links: [
      ['binbaz', IBN_BAZ, 'audio', 'https://binbaz.org.sa/audios/series/99/شرح-كتاب-كشف-الشبهات'],
    ],
  },
  {
    id: 'wasitiyyah', ar: 'العقيدة الواسطية', topic: 'aqidah',
    title: { az: 'əl-Əqidə əl-Vasitiyyə', en: 'al-‘Aqidah al-Wasitiyyah', ru: 'аль-Акыда аль-Васитыйя', ar: 'العقيدة الواسطية', tr: 'el-Akîdetü’l-Vâsıtıyye' },
    author: { az: 'İbn Teymiyyə', en: 'Ibn Taymiyyah', ru: 'Ибн Таймийя', ar: 'ابن تيمية', tr: 'İbn Teymiyye' },
    links: [
      ['binbaz', IBN_BAZ, 'audio', 'https://binbaz.org.sa/audios/series/95/شرح-العقيدة-الواسطية'],
      ['binothaimeen', IBN_UTH, 'audio', 'https://binothaimeen.net/ar/voice_library/sectionDetails/الشروحات العلمية/العقيدة/شرح العقيدة الواسطية (الشرح الأول)/7313c5b5-b898-4c3c-8ab4-4a05ec4c1ec5'],
    ],
  },
  {
    id: 'umdat-al-ahkam', ar: 'عمدة الأحكام', topic: 'hadith',
    title: { az: 'Umdətul-Əhkam', en: '‘Umdat al-Ahkam', ru: '‘Умдат аль-ахкам', ar: 'عمدة الأحكام', tr: 'Umdetü’l-Ahkâm' },
    author: { az: 'Əbdülğəni əl-Məqdisi', en: '‘Abd al-Ghani al-Maqdisi', ru: 'Абд аль-Гани аль-Макдиси', ar: 'عبد الغني المقدسي', tr: 'Abdülganî el-Makdisî' },
    links: [
      ['binbaz', IBN_BAZ, 'audio', 'https://binbaz.org.sa/audios/series/125/عمدة-الاحكام'],
      ['binothaimeen', IBN_UTH, 'audio', 'https://binothaimeen.net/ar/voice_library/sectionDetails/الشروحات العلمية/الحديث/عمدة الأحكام/c943f3cf-1ca1-4854-b71e-072048e95b2d'],
    ],
  },
  {
    id: 'arbain-nawawi', ar: 'الأربعون النووية', page: 'nawawi40', topic: 'hadith',
    title: { az: 'Ən-Nəvəvinin 40 hədisi', en: 'An-Nawawi’s Forty Hadith', ru: '40 хадисов ан-Навави', ar: 'الأربعون النووية', tr: 'Nevevî’nin Kırk Hadisi' },
    author: { az: 'Yəhya ibn Şərəf ən-Nəvəvi', en: 'Yahya ibn Sharaf an-Nawawi', ru: 'Яхья ибн Шараф ан-Навави', ar: 'يحيى بن شرف النووي', tr: 'Yahyâ b. Şeref en-Nevevî' },
    links: [
      ['binothaimeen', IBN_UTH, 'audio', 'https://binothaimeen.net/ar/voice_library/sectionDetails/الشروحات العلمية/الحديث/شرح الأربعين النووية/24996a56-f88a-4f44-b74e-3d5a2a0f1909'],
      ['binbaz', IBN_BAZ, 'audio', 'https://binbaz.org.sa/audios/series/61/اجزاء-من-الاربعين-النووية', { az: 'bəzi hissələr', en: 'selected parts', ru: 'отдельные части', ar: 'أجزاء منها', tr: 'bazı bölümler' }],
    ],
  },
]

/** Bütün kənar URL-lər (yoxlama skripti üçün) */
export function allFatwaUrls() {
  const out = new Set()
  for (const t of HADITH_TOOLS) { out.add(t.home); Object.values(t.homes || {}).forEach(u => out.add(u)) }
  for (const s of SOURCES) { out.add(s.url); Object.values(s.urls || {}).forEach(u => out.add(u)); (s.extra || []).forEach(e => out.add(e.url)) }
  for (const t of TOPICS) t.links.forEach(l => out.add(l[2]))
  for (const c of COMMENTARIES) c.links.forEach(l => out.add(l[3]))
  return [...out]
}
