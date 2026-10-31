// AVTOMATİK YARADILIB: node scripts/gen-lessons-index.mjs — əl ilə dəyişmə.
// Dərslərin meta məlumatı (siyahı, axtarış, SEO). Mətnlər — ayrı fayllarda (load.js).
export { LESSON_CATS, CAT_BY_KEY } from './cats.js'

export const LESSONS = [
 {
  "slug": "usul-ath-thalatha",
  "cat": "aqidah",
  "order": 10,
  "icon": "books",
  "arTitle": "ثلاثة الأصول وأدلتها",
  "title": {
   "az": "Üç əsas və onların dəlilləri (Üsulus-Sələsə)",
   "en": "The Three Fundamental Principles and Their Evidence",
   "ru": "Три основы и их доказательства (Усуль ас-саляса)",
   "ar": "ثلاثة الأصول وأدلتها",
   "tr": "Üç Esas ve Delilleri (Üsûlü’s-Selâse)"
  },
  "summary": {
   "az": "Rəbbini, dinini və Peyğəmbərini tanımaq — Şeyx Muhəmməd ibn Abdülvəhhabın risaləsinin dəlilləri ilə tam tərcüməsi və qısa izahı.",
   "en": "Knowing your Lord, your religion and your Prophet — a full translation of Shaykh Muhammad ibn Abd al-Wahhab’s treatise with its evidence and brief notes.",
   "ru": "Знать своего Господа, свою религию и своего Пророка — полный перевод трактата шейха Мухаммада ибн Абд аль-Ваххаба с доводами и пояснениями.",
   "ar": "معرفة العبد ربه ودينه ونبيه: النص الكامل لرسالة الشيخ محمد بن عبد الوهاب بأدلتها، مع ترجمة أمينة وشرح مختصر لمعانيها.",
   "tr": "Rabbini, dinini ve Peygamberini tanımak — Şeyh Muhammed b. Abdulvehhâb’ın risalesinin delilleriyle tam tercümesi ve kısa açıklaması."
  },
  "author": {
   "az": "Şeyx Muhəmməd ibn Abdülvəhhab",
   "en": "Shaykh Muhammad ibn Abd al-Wahhab",
   "ru": "Шейх Мухаммад ибн Абд аль-Ваххаб",
   "ar": "الشيخ محمد بن عبد الوهاب",
   "tr": "Şeyh Muhammed b. Abdulvehhâb"
  },
  "minutes": 35
 },
 {
  "slug": "al-qawaid-al-arba",
  "cat": "aqidah",
  "order": 20,
  "icon": "list",
  "arTitle": "القواعد الأربع",
  "title": {
   "az": "Dörd qayda (əl-Qəvaid əl-Ərbə)",
   "en": "The Four Principles (al-Qawa‘id al-Arba‘)",
   "ru": "Четыре правила (аль-Каваид аль-арба)",
   "ar": "القواعد الأربع",
   "tr": "Dört Kaide (el-Kavâidü’l-Erba‘)"
  },
  "summary": {
   "az": "Şeyx Muhəmməd ibn Abdülvəhhabın şirki tövhiddən ayırmağı öyrədən qısa risaləsinin tam tərcüməsi — dəlilləri və izahı ilə.",
   "en": "A full translation of Shaykh Muhammad ibn Abd al-Wahhab’s short treatise on telling shirk apart from tawhid — with its evidence and explanation.",
   "ru": "Полный перевод краткого трактата шейха Мухаммада ибн Абд аль-Ваххаба о том, как отличить ширк от таухида, — с доводами и пояснением.",
   "ar": "ترجمة كاملة لرسالة الشيخ محمد بن عبد الوهاب في التمييز بين التوحيد والشرك، بأدلتها مع شرح مختصر لمعانيها.",
   "tr": "Şeyh Muhammed b. Abdulvehhâb’ın şirki tevhitten ayırmayı öğreten kısa risalesinin tam tercümesi — delilleri ve açıklamasıyla."
  },
  "author": {
   "az": "Şeyx Muhəmməd ibn Abdülvəhhab",
   "en": "Shaykh Muhammad ibn Abd al-Wahhab",
   "ru": "Шейх Мухаммад ибн Абд аль-Ваххаб",
   "ar": "الشيخ محمد بن عبد الوهاب",
   "tr": "Şeyh Muhammed b. Abdulvehhâb"
  },
  "minutes": 14
 },
 {
  "slug": "nawaqid-al-islam",
  "cat": "aqidah",
  "order": 30,
  "icon": "alert",
  "arTitle": "نواقض الإسلام",
  "title": {
   "az": "İslamı pozan on şey (Nəvaqidul-İslam)",
   "en": "The Ten Nullifiers of Islam (Nawaqid al-Islam)",
   "ru": "Десять отводящих от ислама (Наваким аль-ислям)",
   "ar": "نواقض الإسلام العشرة",
   "tr": "İslam’ı bozan on şey (Nevâkızu’l-İslâm)"
  },
  "summary": {
   "az": "Şeyx Muhəmməd ibn Abdülvəhhabın risaləsinin tam mətni və izahı, həmçinin təkfirin şərtləri və maneələri barədə vacib qeyd.",
   "en": "The full text of Shaykh Muhammad ibn Abd al-Wahhab’s treatise with explanation, plus an essential note on the conditions and preventers of takfir.",
   "ru": "Полный текст трактата шейха Мухаммада ибн Абд аль-Ваххаба с пояснением и важное замечание об условиях и препятствиях такфира.",
   "ar": "النص الكامل لرسالة الشيخ محمد بن عبد الوهاب مع شرح مختصر، وتنبيه مهم على شروط التكفير وموانعه.",
   "tr": "Şeyh Muhammed b. Abdulvehhâb’ın risalesinin tam metni ve açıklaması, ayrıca tekfirin şartları ve engelleri hakkında önemli bir not."
  },
  "author": {
   "az": "Şeyx Muhəmməd ibn Abdülvəhhab",
   "en": "Shaykh Muhammad ibn Abd al-Wahhab",
   "ru": "Шейх Мухаммад ибн Абд аль-Ваххаб",
   "ar": "الشيخ محمد بن عبد الوهاب",
   "tr": "Şeyh Muhammed b. Abdulvehhâb"
  },
  "minutes": 15
 },
 {
  "slug": "kitab-at-tawhid",
  "cat": "aqidah",
  "order": 40,
  "icon": "shield",
  "arTitle": "كتاب التوحيد",
  "title": {
   "az": "Kitabut-Tövhid — bütün fəsillər",
   "en": "Kitab at-Tawhid — all chapters",
   "ru": "Книга единобожия — все главы",
   "ar": "كتاب التوحيد — جميع الأبواب",
   "tr": "Kitâbu’t-Tevhîd — bütün bablar"
  },
  "summary": {
   "az": "Şeyx Muhəmməd ibn Abdülvəhhabın «Kitabut-Tövhid» əsərinin 67 fəsli: hər fəslin başlığı, əsas dəlili və əsas dərsləri qısa şəkildə.",
   "en": "The 67 chapters of Shaykh Muhammad ibn Abd al-Wahhab’s Kitab at-Tawhid: each chapter’s title, main evidence and key lessons, concisely.",
   "ru": "67 глав «Книги единобожия» шейха Мухаммада ибн Абд аль-Ваххаба: название каждой главы, главный довод и основные уроки — кратко.",
   "ar": "أبواب «كتاب التوحيد» للشيخ محمد بن عبد الوهاب كلها: عنوان كل باب، وأبرز أدلته، وأهم مسائله، باختصار.",
   "tr": "Şeyh Muhammed b. Abdulvehhâb’ın “Kitâbu’t-Tevhîd” eserinin 67 babı: her babın başlığı, temel delili ve temel dersleri kısaca."
  },
  "author": {
   "az": "Şeyx Muhəmməd ibn Abdülvəhhab",
   "en": "Shaykh Muhammad ibn Abd al-Wahhab",
   "ru": "Шейх Мухаммад ибн Абд аль-Ваххаб",
   "ar": "الشيخ محمد بن عبد الوهاب",
   "tr": "Şeyh Muhammed b. Abdulvehhâb"
  },
  "minutes": 40
 },
 {
  "slug": "ghusl",
  "cat": "tahara",
  "order": 10,
  "icon": "drop",
  "arTitle": "الغُسْل",
  "title": {
   "az": "Qüsl: nə vaxt vacibdir və necə alınır",
   "en": "Ghusl: when it is required and how to do it",
   "ru": "Гусль: когда он обязателен и как его совершать",
   "ar": "الغسل: متى يجب وكيف يكون",
   "tr": "Gusül: ne zaman farz olur ve nasıl alınır"
  },
  "summary": {
   "az": "Qüslü vacib edən hallar, kifayət edən və kamil qüslün qaydası, qadınlara aid hökmlər və sünnə qüslləri — Quran və səhih Sünnə əsasında.",
   "en": "What makes ghusl obligatory, the minimum valid and the complete ghusl, rulings for women and the recommended baths — from the Quran and authentic Sunnah.",
   "ru": "Что делает гусль обязательным, достаточный и полный гусль, положения для женщин и желательные омовения — по Корану и достоверной Сунне.",
   "ar": "موجبات الغسل، وصفة الغسل المجزئ والكامل، وأحكام تخص المرأة، والأغسال المستحبة، من القرآن والسنة الصحيحة.",
   "tr": "Guslü farz kılan durumlar, yeterli ve kâmil gusül, kadınlara özel hükümler ve sünnet gusüller — Kur’an ve sahih Sünnet ışığında."
  },
  "author": {
   "az": "Səhih hədislər; İbn Baz və İbn Useyminin fətvaları",
   "en": "Authentic hadith; fatwas of Ibn Baz and Ibn Uthaymin",
   "ru": "Достоверные хадисы; фетвы Ибн База и Ибн Усаймина",
   "ar": "الأحاديث الصحيحة؛ فتاوى ابن باز وابن عثيمين",
   "tr": "Sahih hadisler; İbn Baz ve İbn Useymin’in fetvaları"
  },
  "minutes": 11
 },
 {
  "slug": "tayammum",
  "cat": "tahara",
  "order": 20,
  "icon": "leaf",
  "arTitle": "التَّيَمُّم",
  "title": {
   "az": "Təyəmmüm: suyun yerinə torpaqla təharət",
   "en": "Tayammum: purification with earth instead of water",
   "ru": "Таяммум: очищение землёй вместо воды",
   "ar": "التيمم: الطهارة بالصعيد بدل الماء",
   "tr": "Teyemmüm: su yerine toprakla temizlik"
  },
  "summary": {
   "az": "Təyəmmüm nə vaxt icazəlidir, Ammar hədisinə görə necə edilir, nə ilə edilir və nə onu pozur — Quran, səhih Sünnə və alimlərin fətvaları ilə.",
   "en": "When tayammum is allowed, how to do it according to the hadith of ‘Ammar, what it may be done with and what breaks it — with Quran, Sunnah and fatwas.",
   "ru": "Когда разрешён таяммум, как его совершать по хадису Аммара, чем его делают и что его нарушает — по Корану, Сунне и фетвам учёных.",
   "ar": "متى يشرع التيمم، وصفته من حديث عمار، وبماذا يُتيمم، ونواقضه، بأدلة القرآن والسنة وفتاوى العلماء.",
   "tr": "Teyemmüm ne zaman caizdir, Ammâr hadisine göre nasıl yapılır, neyle yapılır ve onu ne bozar — Kur’an, Sünnet ve fetvalar ışığında."
  },
  "author": {
   "az": "Səhih hədislər; İbn Baz və İbn Useyminin fətvaları",
   "en": "Authentic hadith; fatwas of Ibn Baz and Ibn Uthaymin",
   "ru": "Достоверные хадисы; фетвы Ибн База и Ибн Усаймина",
   "ar": "الأحاديث الصحيحة؛ فتاوى ابن باز وابن عثيمين",
   "tr": "Sahih hadisler; İbn Baz ve İbn Useymin’in fetvaları"
  },
  "minutes": 9
 },
 {
  "slug": "istikhara",
  "cat": "tahara",
  "order": 30,
  "icon": "compass",
  "arTitle": "صَلَاةُ الاسْتِخَارَة",
  "title": {
   "az": "İstixarə namazı: Allahdan xeyir istəmək",
   "en": "Salat al-Istikhara: asking Allah for the best",
   "ru": "Намаз истихара: просьба к Аллаху о благом выборе",
   "ar": "صلاة الاستخارة: طلب الخيرة من الله",
   "tr": "İstihare namazı: Allah’tan hayırlısını istemek"
  },
  "summary": {
   "az": "İstixarə nədir, nə vaxt və necə qılınır, duasının mətni və mənası, ondan sonra nə etməli və bu mövzuda yayılmış yanlışlıqlar — səhih Sünnə əsasında.",
   "en": "What istikhara is, when and how it is prayed, the text and meaning of its du‘a, what to do afterwards and common mistakes — based on the authentic Sunnah.",
   "ru": "Что такое истихара, когда и как её совершать, текст и смысл мольбы, что делать после неё и распространённые ошибки — по достоверной Сунне.",
   "ar": "معنى الاستخارة ومتى تشرع وكيف تصلى، ونص دعائها ومعناه، وما يفعله المستخير بعدها، وأخطاء شائعة، على ضوء السنة الصحيحة.",
   "tr": "İstihare nedir, ne zaman ve nasıl kılınır, duasının metni ve anlamı, sonrasında ne yapılmalı ve yaygın hatalar — sahih Sünnet ışığında."
  },
  "author": {
   "az": "Cabirin hədisi (Buxari); İbn Baz, İbn Useymin və Daimi Komitənin fətvaları",
   "en": "The hadith of Jabir (Bukhari); fatwas of Ibn Baz, Ibn Uthaymin and the Permanent Committee",
   "ru": "Хадис Джабира (Бухари); фетвы Ибн База, Ибн Усаймина и Постоянного комитета",
   "ar": "حديث جابر في صحيح البخاري؛ فتاوى ابن باز وابن عثيمين واللجنة الدائمة",
   "tr": "Câbir hadisi (Buhârî); İbn Baz, İbn Useymin ve Daimi Komite’nin fetvaları"
  },
  "minutes": 8
 },
 {
  "slug": "eid-prayer",
  "cat": "tahara",
  "order": 40,
  "icon": "moonStar",
  "arTitle": "صلاة العيدين",
  "title": {
   "az": "Bayram namazı: hökmü, qaydası və sünnələri",
   "en": "The Eid Prayer: Ruling, Method and Sunnahs",
   "ru": "Праздничный намаз: положение, порядок и сунны",
   "ar": "صلاة العيدين: حكمها وصفتها وسننها",
   "tr": "Bayram Namazı: Hükmü, Kılınışı ve Sünnetleri"
  },
  "summary": {
   "az": "Ramazan və Qurban bayramı namazının hökmü, vaxtı, addım-addım qılınma qaydası, xütbə, təkbirlər və bayram gününün sünnələri — dəlilləri ilə.",
   "en": "The ruling, time and step-by-step method of the Eid al-Fitr and Eid al-Adha prayer, the khutbah, the takbirs and the Sunnahs of the day of Eid — with evidence.",
   "ru": "Положение, время и пошаговый порядок праздничного намаза в Ид аль-Фитр и Ид аль-Адха, хутба, такбиры и сунны дня праздника — с доводами.",
   "ar": "حكم صلاة عيد الفطر وعيد الأضحى ووقتها وصفتها خطوةً بخطوة، والخطبة والتكبير وسنن يوم العيد، مع الأدلة من الكتاب والسنة.",
   "tr": "Ramazan ve Kurban bayramı namazının hükmü, vakti, adım adım kılınışı, hutbe, tekbirler ve bayram gününün sünnetleri — delilleriyle."
  },
  "author": {
   "az": "Səhih Sünnə əsasında; İbn Useymin, İbn Baz və Daimi Komitənin fətvaları",
   "en": "Based on the authentic Sunnah; fatwas of Ibn Uthaymin, Ibn Baz and the Permanent Committee",
   "ru": "На основе достоверной Сунны; фетвы Ибн Усаймина, Ибн База и Постоянного комитета",
   "ar": "من السنة الصحيحة، مع فتاوى ابن عثيمين وابن باز واللجنة الدائمة",
   "tr": "Sahih Sünnet esas alınarak; İbn Useymin, İbn Baz ve Daimi Komite fetvaları"
  },
  "minutes": 12
 },
 {
  "slug": "kusuf-prayer",
  "cat": "tahara",
  "order": 50,
  "icon": "sun",
  "arTitle": "صلاة الكسوف والخسوف",
  "title": {
   "az": "Günəş və ay tutulması namazı (küsuf)",
   "en": "The Eclipse Prayer (Solar and Lunar)",
   "ru": "Намаз при солнечном и лунном затмении",
   "ar": "صلاة الكسوف والخسوف",
   "tr": "Güneş ve Ay Tutulması Namazı (Küsûf)"
  },
  "summary": {
   "az": "Günəş və ay tutulmasında nə etməli: küsuf namazının hökmü, vaxtı, iki rükuli rükətlərlə qılınma qaydası, xütbə, dua, sədəqə və yayğın səhvlər.",
   "en": "What to do in a solar or lunar eclipse: the ruling, time and method of the prayer with two bowings per rak‘ah, the khutbah, du‘a, charity and common mistakes.",
   "ru": "Что делать при солнечном и лунном затмении: положение, время и порядок намаза с двумя поясными поклонами в ракаате, хутба, мольба, милостыня и частые ошибки.",
   "ar": "ما يشرع عند كسوف الشمس وخسوف القمر: حكم صلاة الكسوف ووقتها وصفتها بركوعين في كل ركعة، والخطبة والدعاء والصدقة، والأخطاء الشائعة.",
   "tr": "Güneş ve ay tutulmasında ne yapılır: küsûf namazının hükmü, vakti, her rekâtta iki rükûlu kılınışı, hutbe, dua, sadaka ve yaygın hatalar."
  },
  "author": {
   "az": "Səhih əl-Buxari əsasında; İbn Baz və İbn Useyminin izahları",
   "en": "Based on Sahih al-Bukhari; explanations of Ibn Baz and Ibn Uthaymin",
   "ru": "На основе «Сахиха» аль-Бухари; разъяснения Ибн База и Ибн Усаймина",
   "ar": "من صحيح البخاري، مع شروح ابن باز وابن عثيمين",
   "tr": "Sahîh-i Buhârî esas alınarak; İbn Baz ve İbn Useymin’in açıklamaları"
  },
  "minutes": 10
 },
 {
  "slug": "istisqa-prayer",
  "cat": "tahara",
  "order": 60,
  "icon": "drop",
  "arTitle": "صلاة الاستسقاء",
  "title": {
   "az": "Yağış diləmə (istisqa) namazı",
   "en": "The Prayer for Rain (Istisqa’)",
   "ru": "Намаз с просьбой о дожде (истиска)",
   "ar": "صلاة الاستسقاء",
   "tr": "Yağmur Duası (İstiskâ) Namazı"
  },
  "summary": {
   "az": "Quraqlıqda yağış diləməyin yolları: istisqa namazının qaydası, xütbə və dua, cübbəni çevirmək, yağış yağanda və çox yağanda oxunan səhih dualar.",
   "en": "How to seek rain in drought: the method of the istisqa’ prayer, the khutbah and du‘a, turning the cloak, and the authentic du‘as when rain falls or is heavy.",
   "ru": "Как просить дождя во время засухи: порядок намаза истиска, хутба и мольба, переворачивание накидки, достоверные мольбы, когда идёт дождь и когда он чрезмерен.",
   "ar": "طرق طلب السقيا عند الجدب: صفة صلاة الاستسقاء والخطبة والدعاء وتحويل الرداء، والأدعية الصحيحة عند نزول المطر وعند كثرته.",
   "tr": "Kuraklıkta yağmur istemenin yolları: istiskâ namazının kılınışı, hutbe ve dua, ridâyı çevirmek, yağmur yağınca ve çok yağınca okunan sahih dualar."
  },
  "author": {
   "az": "Səhih Sünnə əsasında; İbn Baz, İbn Useymin və İbn Teymiyyənin izahları",
   "en": "Based on the authentic Sunnah; explanations of Ibn Baz, Ibn Uthaymin and Ibn Taymiyyah",
   "ru": "На основе достоверной Сунны; разъяснения Ибн База, Ибн Усаймина и Ибн Таймии",
   "ar": "من السنة الصحيحة، مع كلام ابن باز وابن عثيمين وابن تيمية",
   "tr": "Sahih Sünnet esas alınarak; İbn Baz, İbn Useymin ve İbn Teymiyye’nin açıklamaları"
  },
  "minutes": 10
 },
 {
  "slug": "adhkar-after-salah",
  "cat": "tahara",
  "order": 70,
  "icon": "dhikr",
  "arTitle": "الأَذْكَارُ بَعْدَ الصَّلَاة",
  "title": {
   "az": "Fərz namazdan sonrakı zikrlər",
   "en": "Remembrance after the obligatory prayer",
   "ru": "Поминания после обязательного намаза",
   "ar": "الأذكار بعد الصلاة المكتوبة",
   "tr": "Farz namazdan sonraki zikirler"
  },
  "summary": {
   "az": "Salamdan sonra deyilən bütün səhih zikrlər: istiğfar, təhlil, təsbih növləri, Ayətül-Kürsi, müəvvizat və dualar — ərəbcə mətn, say və mənbə ilə.",
   "en": "Every authentic dhikr after the salam: istighfar, tahlil, the forms of tasbih, Ayat al-Kursi, the Mu‘awwidhat and du‘as — with Arabic, counts and sources.",
   "ru": "Все достоверные поминания после таслима: истигфар, тахлиль, виды тасбиха, аят аль-Курси, суры-защитницы и мольбы — с арабским текстом, числом и источником.",
   "ar": "جميع الأذكار الصحيحة بعد السلام: الاستغفار والتهليل وصيغ التسبيح وآية الكرسي والمعوذات والأدعية، بنصها العربي وعددها ومصدرها.",
   "tr": "Selamdan sonra söylenen bütün sahih zikirler: istiğfar, tehlil, tesbih çeşitleri, Âyetü’l-Kürsî, muavvizât ve dualar — Arapça metin, sayı ve kaynakla."
  },
  "author": {
   "az": "Səhih hədislər; İbn Baz və əl-Albaninin hökmləri",
   "en": "Authentic hadith; rulings of Ibn Baz and al-Albani",
   "ru": "Достоверные хадисы; положения Ибн База и аль-Альбани",
   "ar": "الأحاديث الصحيحة؛ أحكام ابن باز والألباني",
   "tr": "Sahih hadisler; İbn Baz ve el-Albânî’nin hükümleri"
  },
  "minutes": 12
 },
 {
  "slug": "travel-prayer",
  "cat": "tahara",
  "order": 80,
  "icon": "compass",
  "arTitle": "صلاة المسافر",
  "title": {
   "az": "Səfər namazı: qəsr (qısaltma) və cəm (birləşdirmə)",
   "en": "The Traveller’s Prayer: Shortening and Combining",
   "ru": "Намаз путника: сокращение (каср) и объединение",
   "ar": "صلاة المسافر: القصر والجمع",
   "tr": "Yolcu Namazı: Kasr (Kısaltma) ve Cem (Birleştirme)"
  },
  "summary": {
   "az": "Müsafir namazı necə qılır: qəsr və cəmin hökmü, səfər məsafəsi və qalma müddəti haqqında alimlərin rəyləri, səfərdə sünnələr və müsafir üçün cümə.",
   "en": "How a traveller prays: shortening and combining, scholars’ views on distance and length of stay, Sunnah prayers on a journey, and Jumu‘ah for the traveller.",
   "ru": "Как молится путник: сокращение и объединение, мнения учёных о расстоянии поездки и сроке пребывания, сунны в пути и пятничный намаз для путника.",
   "ar": "كيف يصلي المسافر: أحكام القصر والجمع، وأقوال العلماء في مسافة السفر ومدة الإقامة، والسنن الرواتب في السفر، وحكم الجمعة للمسافر.",
   "tr": "Yolcu nasıl namaz kılar: kasr ve cem hükümleri, yolculuk mesafesi ve kalış süresi hakkında âlimlerin görüşleri, yolculukta sünnetler ve yolcu için cuma."
  },
  "author": {
   "az": "Səhih Sünnə əsasında; İbn Teymiyyə, İbn Baz, İbn Useymin və Daimi Komitənin rəyləri",
   "en": "Based on the authentic Sunnah; views of Ibn Taymiyyah, Ibn Baz, Ibn Uthaymin and the Permanent Committee",
   "ru": "На основе достоверной Сунны; мнения Ибн Таймии, Ибн База, Ибн Усаймина и Постоянного комитета",
   "ar": "من السنة الصحيحة، مع أقوال ابن تيمية وابن باز وابن عثيمين واللجنة الدائمة",
   "tr": "Sahih Sünnet esas alınarak; İbn Teymiyye, İbn Baz, İbn Useymin ve Daimi Komite’nin görüşleri"
  },
  "minutes": 15
 },
 {
  "slug": "sunnah-fasts",
  "cat": "seasons",
  "order": 10,
  "icon": "calendar",
  "arTitle": "صيام التطوع",
  "title": {
   "az": "Sünnə orucları: nə vaxt və necə tutulur",
   "en": "Sunnah Fasts: When and How",
   "ru": "Желательные посты: когда и как",
   "ar": "صيام التطوع: متى وكيف",
   "tr": "Nafile Oruçlar: Ne Zaman ve Nasıl"
  },
  "summary": {
   "az": "Bazar ertəsi və cümə axşamı, ağ günlər, Şəvvalın altı günü, Ərəfə, Aşura, Davud orucu, eləcə də oruc tutmaq qadağan və məkruh olan günlər.",
   "en": "Mondays and Thursdays, the white days, six of Shawwal, Arafah, Ashura, the fast of Dawud — and the days on which fasting is forbidden or disliked.",
   "ru": "Понедельник и четверг, белые дни, шесть дней шавваля, Арафа, Ашура, пост Давуда, а также дни, в которые поститься запрещено или нежелательно.",
   "ar": "صيام الاثنين والخميس والأيام البيض وست شوال وعرفة وعاشوراء وصيام داود، والأيام التي يحرم صومها أو يكره، بأدلتها.",
   "tr": "Pazartesi ve perşembe, eyyâm-ı bîz, Şevval’in altı günü, Arefe, Aşure, Davud orucu ve oruç tutmanın yasak ya da mekruh olduğu günler."
  },
  "author": {
   "az": "Quran, səhih Sünnə; İbn Baz, İbn Useymin, Daimi Komitə",
   "en": "Quran, authentic Sunnah; Ibn Baz, Ibn Uthaymin, the Permanent Committee",
   "ru": "Коран, достоверная Сунна; Ибн Баз, Ибн Усеймин, Постоянный комитет",
   "ar": "القرآن والسنة الصحيحة؛ ابن باز وابن عثيمين واللجنة الدائمة",
   "tr": "Kur’an, sahih Sünnet; İbn Baz, İbn Useymin, Daimi Komite"
  },
  "minutes": 14
 },
 {
  "slug": "dhul-hijjah-ten",
  "cat": "seasons",
  "order": 20,
  "icon": "moonStar",
  "arTitle": "عشر ذي الحجة",
  "title": {
   "az": "Zülhiccənin on günü: fəzilət və əməllər",
   "en": "The Ten Days of Dhul-Hijjah: Virtues and Deeds",
   "ru": "Десять дней зуль-хиджи: достоинства и дела",
   "ar": "عشر ذي الحجة: فضلها وأعمالها",
   "tr": "Zilhicce’nin On Günü: Fazileti ve Amelleri"
  },
  "summary": {
   "az": "İlin ən fəzilətli günləri: nə üçün üstündürlər, hansı əməllər tövsiyə olunur, təkbirin vaxtı, Ərəfə günü və qurban kəsəcək şəxsin saç-dırnaq hökmü.",
   "en": "The best days of the year: their virtue, recommended deeds, the takbir, the Day of Arafah and the hair-and-nails rule for one who will sacrifice.",
   "ru": "Лучшие дни года: чем они превосходят, какие дела желательны, время такбира, день Арафа и запрет на стрижку волос и ногтей для приносящего жертву.",
   "ar": "أفضل أيام السنة: سبب فضلها، والأعمال المستحبة فيها، ووقت التكبير المطلق والمقيد، ويوم عرفة، وحكم الشعر والأظفار لمن أراد أن يضحي.",
   "tr": "Yılın en faziletli günleri: neden üstündürler, hangi ameller tavsiye edilir, tekbirin vakti, Arefe günü ve kurban kesecek kişinin saç ve tırnak hükmü."
  },
  "author": {
   "az": "Quran, səhih Sünnə; İbn Teymiyyə, İbn Baz, İbn Useymin",
   "en": "Quran, authentic Sunnah; Ibn Taymiyyah, Ibn Baz, Ibn Uthaymin",
   "ru": "Коран, достоверная Сунна; Ибн Таймия, Ибн Баз, Ибн Усеймин",
   "ar": "القرآن والسنة الصحيحة؛ ابن تيمية وابن باز وابن عثيمين",
   "tr": "Kur’an, sahih Sünnet; İbn Teymiyye, İbn Baz, İbn Useymin"
  },
  "minutes": 12
 },
 {
  "slug": "udhiyah",
  "cat": "seasons",
  "order": 30,
  "icon": "gift",
  "arTitle": "أحكام الأضحية",
  "title": {
   "az": "Qurban (udhiyyə): hökmləri və qaydası",
   "en": "Udhiyah: Rulings of the Eid Sacrifice",
   "ru": "Удхия: положения праздничной жертвы",
   "ar": "أحكام الأضحية",
   "tr": "Kurban (Udhiye): Hükümleri ve Usulü"
  },
  "summary": {
   "az": "Qurbanın hökmü, hansı heyvanlar və hansı yaşda kəsilir, qəbul olunmayan eyiblər, kəsilmə vaxtı, ətin paylanması və dəvə ilə inəkdə yeddi nəfərin şərikliyi.",
   "en": "The ruling of the sacrifice, eligible animals and ages, disqualifying defects, time of slaughter, distributing the meat and seven sharing a camel or cow.",
   "ru": "Положение жертвы, какие животные и какого возраста подходят, недопустимые изъяны, время заклания, раздача мяса и участие семерых в верблюде или корове.",
   "ar": "حكم الأضحية، وما يجزئ من بهيمة الأنعام وأسنانها، والعيوب المانعة، ووقت الذبح، وتوزيع اللحم، والاشتراك في البدنة والبقرة عن سبعة.",
   "tr": "Kurbanın hükmü, hangi hayvanların hangi yaşta kesileceği, geçerli olmayan kusurlar, kesim vakti, etin dağıtımı ve deve ile sığırda yedi kişinin ortaklığı."
  },
  "author": {
   "az": "Quran, səhih Sünnə; İbn Useymin («Əhkamul-udhiyyə»), İbn Baz, Daimi Komitə",
   "en": "Quran, authentic Sunnah; Ibn Uthaymin (Ahkam al-Udhiyah), Ibn Baz, the Permanent Committee",
   "ru": "Коран, достоверная Сунна; Ибн Усеймин («Ахкам аль-удхия»), Ибн Баз, Постоянный комитет",
   "ar": "القرآن والسنة الصحيحة؛ ابن عثيمين (أحكام الأضحية والذكاة)، ابن باز، اللجنة الدائمة",
   "tr": "Kur’an, sahih Sünnet; İbn Useymin (Ahkâmu’l-Udhiye), İbn Baz, Daimi Komite"
  },
  "minutes": 14
 },
 {
  "slug": "aqiqah",
  "cat": "seasons",
  "order": 40,
  "icon": "gift",
  "arTitle": "أحكام العقيقة والمولود",
  "title": {
   "az": "Əqiqə və yeni doğulan uşağın sünnələri",
   "en": "Aqiqah and the Sunnahs of the Newborn",
   "ru": "Акыка и сунны новорождённого",
   "ar": "العقيقة وسنن المولود",
   "tr": "Akika ve Yeni Doğanın Sünnetleri"
  },
  "summary": {
   "az": "Əqiqənin hökmü, oğlan və qız üçün heyvan sayı, yeddinci gün, gözəl ad qoymaq, başın qırxılması və gümüş sədəqəsi, təhnik və zəif əsaslı adətlər.",
   "en": "Aqiqah’s ruling, animals for a boy and a girl, the seventh day, choosing a good name, shaving the head and silver charity, tahnik, and unfounded customs.",
   "ru": "Положение акыки, число животных за мальчика и девочку, седьмой день, хорошее имя, бритьё головы и милостыня серебром, тахник и обычаи без основы.",
   "ar": "حكم العقيقة، وعدد ما يُذبح عن الغلام والجارية، واليوم السابع، والتسمية الحسنة، وحلق الرأس والتصدق بوزنه فضة، والتحنيك، وما لم يثبت من العادات.",
   "tr": "Akikanın hükmü, erkek ve kız için hayvan sayısı, yedinci gün, güzel isim koymak, başın tıraşı ve gümüş sadakası, tahnik ve zayıf dayanaklı âdetler."
  },
  "author": {
   "az": "Səhih Sünnə; İbn əl-Qəyyim («Tuhfətul-məvdud»), İbn Baz, İbn Useymin, Daimi Komitə",
   "en": "Authentic Sunnah; Ibn al-Qayyim (Tuhfat al-Mawdud), Ibn Baz, Ibn Uthaymin, the Permanent Committee",
   "ru": "Достоверная Сунна; Ибн аль-Кайим («Тухфат аль-маудуд»), Ибн Баз, Ибн Усеймин, Постоянный комитет",
   "ar": "السنة الصحيحة؛ ابن القيم (تحفة المودود)، ابن باز، ابن عثيمين، اللجنة الدائمة",
   "tr": "Sahih Sünnet; İbn Kayyim (Tuhfetü’l-Mevdûd), İbn Baz, İbn Useymin, Daimi Komite"
  },
  "minutes": 11
 },
 {
  "slug": "kaffarah-fidyah",
  "cat": "seasons",
  "order": 50,
  "icon": "charity",
  "arTitle": "الكفارات والفدية",
  "title": {
   "az": "Kəffarə və fidyə: növləri, miqdarı, qəza",
   "en": "Expiation and Fidyah: Types, Amounts, Make-up",
   "ru": "Искупление и фидья: виды, размер, возмещение",
   "ar": "الكفارات والفدية وقضاء الصيام",
   "tr": "Kefaret ve Fidye: Türleri, Miktarı, Kaza"
  },
  "summary": {
   "az": "And, Ramazanda cima, zihar və xəta ilə öldürmə kəffarələri; qoca və sağalmaz xəstənin fidyəsi; buraxılmış orucların qəzası — miqdarlar cədvəllə.",
   "en": "Expiation for oaths, intercourse in Ramadan, zihar and accidental killing; fidyah for the elderly and chronically ill; making up fasts — with tables.",
   "ru": "Искупление за клятву, близость в рамадан, зихар и убийство по ошибке; фидья для пожилых и неизлечимо больных; возмещение пропущенных постов — с таблицами.",
   "ar": "كفارة اليمين والجماع في نهار رمضان والظهار والقتل الخطأ، وفدية الكبير والمريض الذي لا يُرجى برؤه، وقضاء الصيام، مع جداول المقادير.",
   "tr": "Yemin, Ramazan’da cinsel ilişki, zıhar ve hata ile öldürme kefaretleri; yaşlı ve iyileşmez hastanın fidyesi; kaçırılan oruçların kazası — tablolarla."
  },
  "author": {
   "az": "Quran, səhih Sünnə; İbn Qudamə («əl-Muğni»), İbn Baz, İbn Useymin, Daimi Komitə",
   "en": "Quran, authentic Sunnah; Ibn Qudamah (al-Mughni), Ibn Baz, Ibn Uthaymin, the Permanent Committee",
   "ru": "Коран, достоверная Сунна; Ибн Кудама («аль-Мугни»), Ибн Баз, Ибн Усеймин, Постоянный комитет",
   "ar": "القرآن والسنة الصحيحة؛ ابن قدامة (المغني)، ابن باز، ابن عثيمين، اللجنة الدائمة",
   "tr": "Kur’an, sahih Sünnet; İbn Kudâme (el-Muğnî), İbn Baz, İbn Useymin, Daimi Komite"
  },
  "minutes": 15
 },
 {
  "slug": "nikah",
  "cat": "family",
  "order": 10,
  "icon": "heart",
  "arTitle": "أحكام النكاح",
  "title": {
   "az": "Nikah: şərtləri, vəli, mehr və ər-arvad haqları",
   "en": "Nikah: Conditions, Wali, Mahr and Spousal Rights",
   "ru": "Никях: условия, опекун, махр и права супругов",
   "ar": "النكاح: شروطه والولي والمهر وحقوق الزوجين",
   "tr": "Nikâh: Şartları, Velî, Mehir ve Eşlerin Hakları"
  },
  "summary": {
   "az": "Nikahın rüknləri və şərtləri, vəli və şahidlər, mehr, xütbətul-hacə, ər-arvadın haqları, toyda sünnə olanlar və qadağanlar — dəlilləri ilə.",
   "en": "Pillars and conditions of marriage, the wali and witnesses, mahr, khutbat al-hajah, spousal rights, and what is Sunnah or forbidden at weddings — with evidence.",
   "ru": "Столпы и условия брака, опекун и свидетели, махр, хутбат аль-хаджа, права супругов, что сунна и что запрещено на свадьбе — с доказательствами.",
   "ar": "أركان النكاح وشروطه، والولي والشهود، والمهر، وخطبة الحاجة، وحقوق الزوجين، وما يُسنّ ويُحرَّم في العرس، بالأدلة.",
   "tr": "Nikâhın rükün ve şartları, velî ve şahitler, mehir, hutbetü’l-hâce, eşlerin hakları, düğünde sünnet olanlar ve yasaklar — delilleriyle."
  },
  "author": {
   "az": "Quran, səhih Sünnə; İbn Baz, İbn Useymin, əl-Albani, Daimi Komitə",
   "en": "Quran, authentic Sunnah; Ibn Baz, Ibn Uthaymin, al-Albani, the Permanent Committee",
   "ru": "Коран, достоверная Сунна; Ибн Баз, Ибн Усеймин, аль-Албани, Постоянный комитет",
   "ar": "القرآن والسنة الصحيحة؛ ابن باز وابن عثيمين والألباني واللجنة الدائمة",
   "tr": "Kur’an, sahih Sünnet; İbn Bâz, İbn Useymîn, Elbânî, Daimi Komite"
  },
  "minutes": 18
 },
 {
  "slug": "hijab",
  "cat": "family",
  "order": 20,
  "icon": "shield",
  "arTitle": "الحجاب واللباس",
  "title": {
   "az": "Hicab: qadının və kişinin geyimi, övrət",
   "en": "Hijab: Dress of Women and Men, and the Awrah",
   "ru": "Хиджаб: одежда женщины и мужчины, аурат",
   "ar": "الحجاب: لباس المرأة والرجل والعورة",
   "tr": "Tesettür: Kadın ve Erkeğin Giyimi, Avret"
  },
  "summary": {
   "az": "Qadın geyiminin dəlilli şərtləri, üz örtüyü barədə Sələf alimlərinin iki görüşü, kimin yanında açılmaq olar, kişinin övrəti və geyim qaydaları.",
   "en": "The conditions of a woman’s dress with evidence, the two Salafi views on the face veil, before whom she may uncover, and the man’s awrah and dress.",
   "ru": "Условия женской одежды с доказательствами, два мнения учёных саляфа о покрытии лица, перед кем можно открываться, аурат и одежда мужчины.",
   "ar": "شروط لباس المرأة بأدلتها، وقولا علماء السلف في تغطية الوجه، ومن تبدي زينتها أمامهم، وعورة الرجل ولباسه.",
   "tr": "Kadın giyiminin delilli şartları, peçe konusunda Selef âlimlerinin iki görüşü, kimlerin yanında açılabileceği, erkeğin avreti ve giyimi."
  },
  "author": {
   "az": "Quran, səhih Sünnə; əl-Albani, İbn Baz, İbn Useymin, əş-Şənqiti",
   "en": "Quran, authentic Sunnah; al-Albani, Ibn Baz, Ibn Uthaymin, ash-Shanqiti",
   "ru": "Коран, достоверная Сунна; аль-Албани, Ибн Баз, Ибн Усеймин, аш-Шанкыти",
   "ar": "القرآن والسنة الصحيحة؛ الألباني وابن باز وابن عثيمين والشنقيطي",
   "tr": "Kur’an, sahih Sünnet; Elbânî, İbn Bâz, İbn Useymîn, Şinkîtî"
  },
  "minutes": 15
 },
 {
  "slug": "ruqyah",
  "cat": "family",
  "order": 30,
  "icon": "quran",
  "arTitle": "الرقية الشرعية",
  "title": {
   "az": "Şəri rüqyə: ayələr, dualar və çəkinilənlər",
   "en": "Shar‘i Ruqyah: Verses, Duas and What to Avoid",
   "ru": "Шариатская рукья: аяты, мольбы и запретное",
   "ar": "الرقية الشرعية: الآيات والأدعية وما يُجتنب",
   "tr": "Şer‘î Rukye: Âyetler, Dualar ve Sakınılacaklar"
  },
  "summary": {
   "az": "Rüqyənin şərtləri, oxunan ayələr və səhih dualar, özünə necə rüqyə etmək, göz dəyməsinin müalicəsi, muska, falçı və «cin ovçuları» kimi şirk və aldatmalar.",
   "en": "Conditions of ruqyah, the verses and authentic duas, self-ruqyah, curing the evil eye, and the shirk and fraud to avoid: amulets, sorcerers, “jinn hunters”.",
   "ru": "Условия рукьи, аяты и достоверные мольбы, как читать рукью самому, лечение сглаза, ширк и обман: амулеты, колдуны и «охотники на джиннов».",
   "ar": "شروط الرقية، والآيات والأدعية الصحيحة، وكيف يرقي المرء نفسه، وعلاج العين، وما يُجتنب من الشرك والدجل كالتمائم والسحرة.",
   "tr": "Rukyenin şartları, okunan âyetler ve sahih dualar, kişinin kendine rukye yapması, nazarın tedavisi, muska, büyücü ve “cin avcıları” gibi şirk ve aldatmalar."
  },
  "author": {
   "az": "Quran, səhih Sünnə; İbn Teymiyyə, İbn Həcər, İbn Baz, Daimi Komitə",
   "en": "Quran, authentic Sunnah; Ibn Taymiyyah, Ibn Hajar, Ibn Baz, the Permanent Committee",
   "ru": "Коран, достоверная Сунна; Ибн Таймия, Ибн Хаджар, Ибн Баз, Постоянный комитет",
   "ar": "القرآن والسنة الصحيحة؛ ابن تيمية وابن حجر وابن باز واللجنة الدائمة",
   "tr": "Kur’an, sahih Sünnet; İbn Teymiyye, İbn Hacer, İbn Bâz, Daimi Komite"
  },
  "minutes": 17
 },
 {
  "slug": "sick-fiqh",
  "cat": "family",
  "order": 40,
  "icon": "heart",
  "arTitle": "أحكام المريض",
  "title": {
   "az": "Xəstənin fiqhi: təharət, namaz, oruc və ziyarət",
   "en": "Rulings for the Sick: Purity, Prayer, Fasting, Visits",
   "ru": "Фикх больного: очищение, намаз, пост и посещение",
   "ar": "أحكام المريض: طهارته وصلاته وصيامه وعيادته",
   "tr": "Hastanın Fıkhı: Taharet, Namaz, Oruç ve Ziyaret"
  },
  "summary": {
   "az": "Xəstə necə dəstəmaz alır və namaz qılır (oturaraq, uzanaraq), namazları birləşdirmək, xəstənin orucu, xəstəni ziyarətin ədəbi və duaları, səbrin savabı.",
   "en": "How the sick purify and pray (sitting or lying), combining prayers, fasting when ill, visiting the sick with its duas, and the reward of patience.",
   "ru": "Как больной совершает омовение и намаз (сидя, лёжа), объединение намазов, пост больного, этикет и мольбы при посещении больного, награда за терпение.",
   "ar": "كيف يتطهر المريض ويصلي قاعدًا أو على جنب، والجمع بين الصلاتين، وصيام المريض، وآداب العيادة وأدعيتها، وأجر الصبر.",
   "tr": "Hasta nasıl abdest alır ve namaz kılar (oturarak, yatarak), namazları cem etmek, hastanın orucu, hasta ziyaretinin adabı ve duaları, sabrın sevabı."
  },
  "author": {
   "az": "Quran, səhih Sünnə; İbn Teymiyyə, İbn Baz, İbn Useymin, Daimi Komitə",
   "en": "Quran, authentic Sunnah; Ibn Taymiyyah, Ibn Baz, Ibn Uthaymin, the Permanent Committee",
   "ru": "Коран, достоверная Сунна; Ибн Таймия, Ибн Баз, Ибн Усеймин, Постоянный комитет",
   "ar": "القرآن والسنة الصحيحة؛ ابن تيمية وابن باز وابن عثيمين واللجنة الدائمة",
   "tr": "Kur’an, sahih Sünnet; İbn Teymiyye, İbn Bâz, İbn Useymîn, Daimi Komite"
  },
  "minutes": 15
 },
 {
  "slug": "wasiyyah",
  "cat": "family",
  "order": 50,
  "icon": "list",
  "arTitle": "الوصية",
  "title": {
   "az": "Vəsiyyət: hökmü, qaydaları və nümunə mətn",
   "en": "The Islamic Will: Rulings and a Template",
   "ru": "Завещание в исламе: положения и образец",
   "ar": "الوصية: أحكامها ونموذج لكتابتها",
   "tr": "Vasiyet: Hükmü, Kuralları ve Örnek Metin"
  },
  "summary": {
   "az": "Vəsiyyətin hökmü, üçdə bir həddi, varisə vəsiyyət olmaması, borcların önə keçməsi və köçürüb doldurmaq üçün hazır nümunə mətn.",
   "en": "The ruling on the will, the one-third limit, no bequest to an heir, debts first — and a ready template you can copy and fill in.",
   "ru": "Положение о завещании, предел в одну треть, нет завещания наследнику, долги прежде всего — и готовый образец для заполнения.",
   "ar": "حكم الوصية، وحدّ الثلث، ولا وصية لوارث، وتقديم الدَّين، مع نموذج جاهز للوصية تنسخه وتملؤه.",
   "tr": "Vasiyetin hükmü, üçte bir sınırı, mirasçıya vasiyet olmaması, borçların önceliği ve kopyalayıp doldurulacak hazır örnek metin."
  },
  "author": {
   "az": "Quran, səhih Sünnə; Şeyx İbn Baz və Daimi Komitənin fətvaları",
   "en": "The Quran, authentic Sunnah; fatwas of Shaykh Ibn Baz and the Permanent Committee",
   "ru": "Коран, достоверная Сунна; фетвы шейха Ибн База и Постоянного комитета",
   "ar": "القرآن والسنة الصحيحة؛ فتاوى الشيخ ابن باز واللجنة الدائمة",
   "tr": "Kur’an, sahih Sünnet; Şeyh İbn Baz ve Daimi Komite fetvaları"
  },
  "minutes": 12
 },
 {
  "slug": "janazah",
  "cat": "family",
  "order": 60,
  "icon": "prayer",
  "arTitle": "أحكام الجنائز",
  "title": {
   "az": "Cənazə: ölüm ayağından dəfnə qədər",
   "en": "The Funeral: From the Deathbed to the Grave",
   "ru": "Похороны: от смертного одра до могилы",
   "ar": "الجنائز: من الاحتضار إلى الدفن",
   "tr": "Cenaze: Ölüm Döşeğinden Defne Kadar"
  },
  "summary": {
   "az": "Təlqin, gözləri bağlamaq, yuyulma, kəfən, cənazə namazı və duaları, dəfn, təziyə, yas müddəti və çəkinilməli bidətlər — dəlilləri ilə.",
   "en": "Talqin, closing the eyes, washing, the shroud, the funeral prayer and its duas, burial, condolence, mourning and innovations to avoid.",
   "ru": "Наставление умирающего, омовение, саван, погребальная молитва и её мольбы, погребение, соболезнование, траур и нововведения.",
   "ar": "التلقين وإغماض العينين والغسل والكفن وصلاة الجنازة وأدعيتها والدفن والتعزية والإحداد، والبدع التي ينبغي اجتنابها، بالأدلة.",
   "tr": "Telkin, gözleri kapamak, yıkama, kefen, cenaze namazı ve duaları, defin, taziye, yas süresi ve kaçınılması gereken bid‘atler."
  },
  "author": {
   "az": "Səhih Sünnə; Şeyx əl-Albaninin «Əhkamul-cənaiz» kitabı və İbn Bazın fətvaları",
   "en": "The authentic Sunnah; al-Albani’s Ahkam al-Jana’iz and the fatwas of Ibn Baz",
   "ru": "Достоверная Сунна; «Ахкам аль-джанаиз» аль-Альбани и фетвы Ибн База",
   "ar": "السنة الصحيحة؛ «أحكام الجنائز» للألباني وفتاوى ابن باز",
   "tr": "Sahih Sünnet; Elbânî’nin “Ahkâmu’l-Cenâiz” kitabı ve İbn Baz’ın fetvaları"
  },
  "minutes": 18
 },
 {
  "slug": "tawbah",
  "cat": "heart",
  "order": 10,
  "icon": "leaf",
  "arTitle": "التوبة",
  "title": {
   "az": "Tövbə: Allaha qayıdışın yolu",
   "en": "Repentance: The Way Back to Allah",
   "ru": "Покаяние: путь возвращения к Аллаху",
   "ar": "التوبة: طريق الرجوع إلى الله",
   "tr": "Tövbe: Allah’a Dönüşün Yolu"
  },
  "summary": {
   "az": "Tövbənin şərtləri, insan haqlarının qaytarılması, ümid ilə qorxu arasında tarazlıq və tövbəyə çağıran ayə və səhih hədislər.",
   "en": "The conditions of repentance, returning people’s rights, balancing hope and fear, and the verses and authentic hadith that call to it.",
   "ru": "Условия покаяния, возвращение прав людей, равновесие надежды и страха, аяты и достоверные хадисы, призывающие к покаянию.",
   "ar": "شروط التوبة، ورد حقوق العباد، والتوازن بين الرجاء والخوف، مع الآيات والأحاديث الصحيحة الداعية إلى التوبة.",
   "tr": "Tövbenin şartları, kul haklarının iadesi, ümit ile korku arasındaki denge ve tövbeye çağıran ayetler ve sahih hadisler."
  },
  "author": {
   "az": "Quran və səhih Sünnə; ən-Nəvəvi və İbn Bazın izahları",
   "en": "The Quran and authentic Sunnah; explanations of an-Nawawi and Ibn Baz",
   "ru": "Коран и достоверная Сунна; разъяснения ан-Навави и Ибн База",
   "ar": "القرآن والسنة الصحيحة؛ وشروح النووي وابن باز",
   "tr": "Kur’an ve sahih Sünnet; Nevevî ve İbn Baz’ın açıklamaları"
  },
  "minutes": 14
 },
 {
  "slug": "adab-al-mufrad",
  "cat": "heart",
  "order": 20,
  "icon": "hadith",
  "arTitle": "الأدب المفرد",
  "title": {
   "az": "əl-Ədəb əl-Müfrəd: seçilmiş fəsillər",
   "en": "Al-Adab al-Mufrad: Selected Chapters",
   "ru": "Аль-Адаб аль-Муфрад: избранные главы",
   "ar": "الأدب المفرد: أبواب مختارة",
   "tr": "el-Edebü’l-Müfred: Seçme Bölümler"
  },
  "summary": {
   "az": "İmam Buxarinin ədəb kitabından seçmələr: yumşaqlıq, söz, salam, kiçiyə mərhəmət, şükür, həya və qəzəb — Albaninin səhih saydığı hədislərlə.",
   "en": "Selections from al-Bukhari’s book of manners: gentleness, speech, greeting, mercy, gratitude, modesty and anger — only hadith al-Albani graded authentic.",
   "ru": "Избранное из книги аль-Бухари о нравах: мягкость, речь, приветствие, милость, благодарность, стыдливость и гнев — только достоверные хадисы.",
   "ar": "مختارات من كتاب الأدب للإمام البخاري: الرفق والكلام والسلام ورحمة الصغير والشكر والحياء والغضب، بما صححه الألباني أو حسّنه.",
   "tr": "Buhârî’nin edep kitabından seçmeler: yumuşaklık, söz, selam, küçüğe merhamet, şükür, hayâ ve öfke — Elbânî’nin sahih saydığı hadislerle."
  },
  "author": {
   "az": "İmam Buxari; hədislərin dərəcəsi — Şeyx Albani",
   "en": "Imam al-Bukhari; hadith grading by Shaykh al-Albani",
   "ru": "Имам аль-Бухари; оценка хадисов — шейх аль-Албани",
   "ar": "الإمام البخاري؛ والحكم على الأحاديث للشيخ الألباني",
   "tr": "İmam Buhârî; hadislerin derecesi — Şeyh Elbânî"
  },
  "minutes": 14
 },
 {
  "slug": "birr-al-walidayn",
  "cat": "heart",
  "order": 30,
  "icon": "jamaat",
  "arTitle": "بر الوالدين وصلة الرحم وحق الجار",
  "title": {
   "az": "Valideynə yaxşılıq, qohumluq və qonşuluq",
   "en": "Dutifulness to Parents, Kinship and Neighbours",
   "ru": "Почтение к родителям, родство и соседи",
   "ar": "بر الوالدين وصلة الرحم وحق الجار",
   "tr": "Anne-Babaya İyilik, Akrabalık ve Komşuluk"
  },
  "summary": {
   "az": "Valideynin haqları (vəfatından sonra da), ananın üstünlüyü, ataya-anaya üsyanın günahı, qohumluq əlaqəsi və qonşu haqqı — ayə və səhih hədislərlə.",
   "en": "Rights of parents (also after death), the mother’s precedence, the sin of disobedience, ties of kinship and neighbours’ rights — from Quran and Sunnah.",
   "ru": "Права родителей (и после их смерти), первенство матери, грех непочтительности, родственные связи и права соседа — по Корану и достоверной Сунне.",
   "ar": "حقوق الوالدين في الحياة وبعد الممات، وتقديم الأم، وإثم العقوق، وصلة الرحم، وحق الجار، بأدلة الكتاب والسنة الصحيحة.",
   "tr": "Anne-babanın hakları (vefatlarından sonra da), annenin önceliği, anne-babaya isyanın günahı, akrabalık bağı ve komşu hakkı — ayet ve sahih hadislerle."
  },
  "author": {
   "az": "Quran, səhih Sünnə; İmam Buxarinin «əl-Ədəb əl-Müfrəd» kitabı (Albaninin dərəcəsi ilə)",
   "en": "Quran, authentic Sunnah; al-Bukhari’s “al-Adab al-Mufrad” (with al-Albani’s grading)",
   "ru": "Коран, достоверная Сунна; «аль-Адаб аль-Муфрад» аль-Бухари (с оценкой аль-Албани)",
   "ar": "القرآن والسنة الصحيحة؛ و«الأدب المفرد» للبخاري بتحقيق الألباني",
   "tr": "Kur’an, sahih Sünnet; Buhârî’nin “el-Edebü’l-Müfred” kitabı (Elbânî’nin derecelendirmesiyle)"
  },
  "minutes": 15
 },
 {
  "slug": "muhasabah",
  "cat": "heart",
  "order": 40,
  "icon": "check",
  "arTitle": "محاسبة النفس",
  "title": {
   "az": "Nəfsi hesaba çəkmək (mühasəbə)",
   "en": "Self-Accounting (Muhasabah)",
   "ru": "Отчёт перед собой (мухасаба)",
   "ar": "محاسبة النفس",
   "tr": "Nefis Muhasebesi"
  },
  "summary": {
   "az": "Quran və Sələfin — Ömər, Həsən əl-Bəsri, İbn Qeyyimin — sözləri əsasında nəfsi hesaba çəkmək və hər gün üçün praktik suallar siyahısı.",
   "en": "Self-accounting from the Quran and the words of the Salaf — Umar, al-Hasan al-Basri, Ibn al-Qayyim — with a practical set of daily questions.",
   "ru": "Отчёт перед собой по Корану и словам саляфа — Умара, аль-Хасана аль-Басри, Ибн аль-Каййима — с практическим списком вопросов на каждый день.",
   "ar": "محاسبة النفس من القرآن وأقوال السلف — عمر والحسن البصري وابن القيم — مع أسئلة عملية للمحاسبة اليومية.",
   "tr": "Kur’an ve Selefin — Ömer, Hasan-ı Basrî, İbnü’l-Kayyim — sözlerine göre nefis muhasebesi ve her gün için pratik sorular listesi."
  },
  "author": {
   "az": "Quran, səhih Sünnə; İbn Kəsirin təfsiri və İbn Qeyyimin «İğasətul-ləhfan» kitabı",
   "en": "The Quran, authentic Sunnah; Tafsir Ibn Kathir and Ibn al-Qayyim’s Ighathat al-Lahfan",
   "ru": "Коран, достоверная Сунна; тафсир Ибн Касира и «Игасат аль-ляхфан» Ибн аль-Каййима",
   "ar": "القرآن والسنة الصحيحة؛ تفسير ابن كثير و«إغاثة اللهفان» لابن القيم",
   "tr": "Kur’an, sahih Sünnet; İbn Kesîr tefsiri ve İbnü’l-Kayyim’in “İğâsetü’l-Lehfân” kitabı"
  },
  "minutes": 11
 },
 {
  "slug": "mustalah",
  "cat": "knowledge",
  "order": 10,
  "icon": "hadith",
  "arTitle": "مبادئ علم مصطلح الحديث",
  "title": {
   "az": "Hədis elminin əsasları",
   "en": "Basics of Hadith Science",
   "ru": "Основы науки о хадисах",
   "ar": "مبادئ علم مصطلح الحديث",
   "tr": "Hadis Usulünün Esasları"
  },
  "summary": {
   "az": "İsnad və mətn, səhih, həsən, zəif və mövzu hədisin şərtləri, hədisi necə yoxlamalı, məşhur kitablar, Albaninin əməyi və saytın zəif hədisləri niyə çıxardığı.",
   "en": "Isnad and matn; sahih, hasan, weak and fabricated hadith; how to check a hadith; the main collections, al-Albani’s work and why this site removed weak hadith.",
   "ru": "Иснад и матн; достоверный, хороший, слабый и выдуманный хадис; как проверить хадис; главные сборники, труд аль-Албани и почему сайт убрал слабые хадисы.",
   "ar": "الإسناد والمتن، وشروط الصحيح والحسن، والضعيف والموضوع، وكيف تتحقق من الحديث، وأشهر الكتب وجهود الألباني، ولماذا حذف الموقع الضعيف.",
   "tr": "İsnad ve metin; sahih, hasen, zayıf ve mevzu hadis; hadis nasıl kontrol edilir; meşhur kitaplar, Elbânî’nin emeği ve sitenin zayıf hadisleri neden çıkardığı."
  },
  "author": {
   "az": "İbn əs-Səlah, İbn Həcər, İbn Useymin («Mustələhul-hədis»), Albani",
   "en": "Ibn as-Salah, Ibn Hajar, Ibn ‘Uthaymin (“Mustalah al-Hadith”), al-Albani",
   "ru": "Ибн ас-Салах, Ибн Хаджар, Ибн Усеймин («Мусталах аль-хадис»), аль-Албани",
   "ar": "ابن الصلاح، ابن حجر، ابن عثيمين («مصطلح الحديث»)، الألباني",
   "tr": "İbnü’s-Salâh, İbn Hacer, İbn Useymîn (“Mustalahu’l-Hadîs”), Elbânî"
  },
  "minutes": 16
 },
 {
  "slug": "bidah",
  "cat": "knowledge",
  "order": 20,
  "icon": "alert",
  "arTitle": "البدعة وخطرها",
  "title": {
   "az": "Bidət: tərifi və geniş yayılmış bidətlər",
   "en": "Bid‘ah: Definition and Common Innovations",
   "ru": "Бида: определение и распространённые нововведения",
   "ar": "البدعة: تعريفها وأشهر البدع المنتشرة",
   "tr": "Bid‘at: Tanımı ve Yaygın Bid‘atler"
  },
  "summary": {
   "az": "Bidət nədir, niyə hər bidət zəlalətdir və Mövlud, Rəğaib, Bərat gecəsi, qəbir və yas məclisləri haqqında dəlillər və alimlərin fətvaları.",
   "en": "What bid‘ah is, why every innovation is misguidance, and the evidence and fatwas on Mawlid, Raghaib, mid-Sha‘ban, graves and mourning gatherings.",
   "ru": "Что такое бида, почему всякое нововведение — заблуждение, и доводы с фетвами о мавлиде, ночи Рагаиб, середине шаабана, могилах и поминках.",
   "ar": "ما البدعة، ولماذا كل بدعة ضلالة، مع الأدلة وفتاوى العلماء في المولد والرغائب ونصف شعبان والقبور ومجالس العزاء.",
   "tr": "Bid‘at nedir, neden her bid‘at sapıklıktır; Mevlid, Regaib, Berat gecesi, kabirler ve taziye toplantıları hakkında deliller ve fetvalar."
  },
  "author": {
   "az": "Quran, səhih Sünnə; əş-Şatibi, İbn Teymiyyə, İbn Baz, İbn Useymin",
   "en": "Quran and authentic Sunnah; al-Shatibi, Ibn Taymiyyah, Ibn Baz, Ibn Uthaymin",
   "ru": "Коран и достоверная Сунна; аш-Шатыби, Ибн Таймийя, Ибн Баз, Ибн Усеймин",
   "ar": "القرآن والسنة الصحيحة؛ الشاطبي، ابن تيمية، ابن باز، ابن عثيمين",
   "tr": "Kur’an ve sahih Sünnet; Şâtıbî, İbn Teymiyye, İbn Baz, İbn Useymin"
  },
  "minutes": 18
 },
 {
  "slug": "hilyat-talib-al-ilm",
  "cat": "knowledge",
  "order": 30,
  "icon": "books",
  "arTitle": "حلية طالب العلم",
  "title": {
   "az": "Elm tələbəsinin bəzəyi (Bəkr Əbu Zeyd)",
   "en": "The Adornment of the Student of Knowledge",
   "ru": "Украшение ищущего знание (Бакр Абу Зейд)",
   "ar": "حلية طالب العلم (بكر أبو زيد)",
   "tr": "İlim Talebesinin Süsü (Bekir Ebû Zeyd)"
  },
  "summary": {
   "az": "Şeyx Bəkr Əbu Zeydin «Hilyətu talibil-elm» kitabının yeddi fəsli və «nəvaqidi» üzrə xülasə: ixlas, elm öyrənmə qaydası, müəllim, dost, əməl və çəkinmələr.",
   "en": "A chapter-by-chapter summary of Shaykh Bakr Abu Zayd’s “Hilyat Talib al-‘Ilm”: sincerity, method of study, teacher, companions, action and warnings.",
   "ru": "Краткое изложение «Хильят талиб аль-ильм» шейха Бакра Абу Зейда по главам: искренность, порядок учёбы, учитель, товарищи, действие и предостережения.",
   "ar": "خلاصة «حلية طالب العلم» للشيخ بكر أبو زيد على فصوله السبعة ونواقضها: الإخلاص، وطريقة الطلب، والشيخ، والزمالة، والعمل، والمحاذير.",
   "tr": "Şeyh Bekir Ebû Zeyd’in “Hilyetü Tâlibi’l-İlm” kitabının yedi bölümü ve bozucuları üzerine özet: ihlas, öğrenme yolu, hoca, arkadaş, amel ve uyarılar."
  },
  "author": {
   "az": "Şeyx Bəkr ibn Abdullah Əbu Zeyd (h. 1429)",
   "en": "Shaykh Bakr ibn ‘Abdullah Abu Zayd (d. 1429 AH)",
   "ru": "Шейх Бакр ибн Абдуллах Абу Зейд (ум. в 1429 г. х.)",
   "ar": "الشيخ بكر بن عبد الله أبو زيد (ت ١٤٢٩هـ)",
   "tr": "Şeyh Bekir b. Abdullah Ebû Zeyd (h. 1429)"
  },
  "minutes": 18
 },
 {
  "slug": "doubts-youth",
  "cat": "knowledge",
  "order": 40,
  "icon": "compass",
  "arTitle": "جواب الشبهات",
  "title": {
   "az": "Gənclərin şübhələrinə cavablar",
   "en": "Answers to Common Doubts of Young People",
   "ru": "Ответы на сомнения молодёжи",
   "ar": "أجوبة عن شبهات الشباب",
   "tr": "Gençlerin Şüphelerine Cevaplar"
  },
  "summary": {
   "az": "Yaradanın varlığı, şər və əziyyətin hikməti, niyə məhz İslam, hədisin höccət olması və elm ilə Quran haqqında sakit, dəlilli cavablar.",
   "en": "Calm, evidence-based answers on the existence of the Creator, why evil and suffering exist, why Islam, the authority of hadith, and science and the Quran.",
   "ru": "Спокойные доказательные ответы о бытии Творца, мудрости зла и страданий, о том, почему ислам, о доказательной силе хадисов и о науке и Коране.",
   "ar": "أجوبة هادئة مؤصلة عن وجود الخالق، وحكمة الشر والمصائب، ولماذا الإسلام، وحجية السنة، والعلم والقرآن.",
   "tr": "Yaratıcının varlığı, kötülük ve acının hikmeti, neden İslam, hadisin delil oluşu ve bilim ile Kur’an hakkında sakin, delilli cevaplar."
  },
  "author": {
   "az": "Quran, səhih Sünnə; İbn Teymiyyə, İbn Qəyyim, İbn Useymin",
   "en": "Quran and authentic Sunnah; Ibn Taymiyyah, Ibn al-Qayyim, Ibn Uthaymin",
   "ru": "Коран и достоверная Сунна; Ибн Таймийя, Ибн аль-Кайим, Ибн Усеймин",
   "ar": "القرآن والسنة الصحيحة؛ ابن تيمية، ابن القيم، ابن عثيمين",
   "tr": "Kur’an ve sahih Sünnet; İbn Teymiyye, İbnü’l-Kayyim, İbn Useymin"
  },
  "minutes": 16
 },
 {
  "slug": "fiqh-faq",
  "cat": "knowledge",
  "order": 50,
  "icon": "list",
  "arTitle": "أسئلة وأجوبة فقهية",
  "title": {
   "az": "Fiqh sual-cavabları: fətva nömrələri ilə",
   "en": "Fiqh Q&A with fatwa numbers",
   "ru": "Вопросы и ответы по фикху с номерами фетв",
   "ar": "أسئلة وأجوبة فقهية بأرقام الفتاوى",
   "tr": "Fetva numaralarıyla fıkıh soru-cevapları"
  },
  "summary": {
   "az": "Təharət, namaz, oruc, zəkat, ailə, pul, yemək və gündəlik həyat barədə ən çox verilən suallar — hər cavab fətva nömrəsi və linki ilə.",
   "en": "The most common questions on purification, prayer, fasting, zakat, family, money, food and daily life — each answer with its fatwa number and link.",
   "ru": "Самые частые вопросы об очищении, намазе, посте, закяте, семье, деньгах, еде и быту — каждый ответ с номером фетвы и ссылкой.",
   "ar": "أكثر الأسئلة شيوعًا في الطهارة والصلاة والصيام والزكاة والأسرة والمال والطعام والحياة اليومية، مع رقم الفتوى ورابطها لكل جواب.",
   "tr": "Taharet, namaz, oruç, zekât, aile, para, yiyecek ve günlük hayat hakkında en sık sorulan sorular — her cevap fetva numarası ve bağlantısıyla."
  },
  "author": {
   "az": "İslam sual-cavab (islamqa.info) fətvaları əsasında; İbn Baz, İbn Useymin və Daimi Komitənin sözləri ilə",
   "en": "Based on the fatwas of Islam Q&A (islamqa.info), quoting Ibn Baz, Ibn Uthaymin and the Permanent Committee",
   "ru": "По фетвам сайта «Ислам: вопросы и ответы» с цитатами ибн База, ибн Усеймина и Постоянного комитета",
   "ar": "مبني على فتاوى موقع الإسلام سؤال وجواب، مع نقول عن ابن باز وابن عثيمين واللجنة الدائمة",
   "tr": "İslam Soru-Cevap sitesinin fetvalarına dayanır; İbn Baz, İbn Useymin ve Daimi Komite’nin sözleriyle"
  },
  "minutes": 30
 },
 {
  "slug": "intro-to-islam",
  "cat": "dawah",
  "order": 10,
  "icon": "globe",
  "arTitle": "تعريف بالإسلام",
  "title": {
   "az": "İslamla tanışlıq",
   "en": "Introduction to Islam",
   "ru": "Знакомство с исламом",
   "ar": "تعريف بالإسلام",
   "tr": "İslam’a Giriş"
  },
  "summary": {
   "az": "Qeyri-müsəlmanlar üçün sadə giriş: Allah kimdir, Peyğəmbər ﷺ, Quran, İslamın və imanın rüknləri, ölümdən sonrakı həyat və müsəlman olmaq.",
   "en": "A simple introduction for non-Muslims: who Allah is, the Prophet ﷺ, the Quran, the pillars of Islam and faith, life after death and how to become Muslim.",
   "ru": "Простое введение для немусульман: кто такой Аллах, Пророк ﷺ, Коран, столпы ислама и веры, жизнь после смерти и как стать мусульманином.",
   "ar": "مدخل ميسّر لغير المسلمين: من هو الله، والنبي ﷺ، والقرآن، وأركان الإسلام والإيمان، والحياة بعد الموت، وكيف يصبح المرء مسلمًا.",
   "tr": "Gayrimüslimler için sade bir giriş: Allah kimdir, Peygamber ﷺ, Kur’an, İslam’ın ve imanın şartları, ölümden sonraki hayat ve Müslüman olmak."
  },
  "author": {
   "az": "Quran və səhih Sünnə",
   "en": "The Quran and the authentic Sunnah",
   "ru": "Коран и достоверная Сунна",
   "ar": "القرآن والسنة الصحيحة",
   "tr": "Kur’an ve sahih Sünnet"
  },
  "minutes": 12
 },
 {
  "slug": "new-muslim",
  "cat": "dawah",
  "order": 20,
  "icon": "leaf",
  "arTitle": "خطوات المسلم الجديد",
  "title": {
   "az": "Yeni müsəlmanın ilk addımları",
   "en": "First Steps for a New Muslim",
   "ru": "Первые шаги нового мусульманина",
   "ar": "أولى خطوات المسلم الجديد",
   "tr": "Yeni Müslümanın İlk Adımları"
  },
  "summary": {
   "az": "Şəhadətin mənası, İslamdan sonra qüsl, namazı mərhələ-mərhələ öyrənmək, ilk surələr, öncəliklər, ailə ilə münasibət və suallarını kimə verməli.",
   "en": "The meaning of the shahadah, ghusl after Islam, learning prayer step by step, first surahs, priorities, dealing with family and where to ask.",
   "ru": "Смысл шахады, гусль после принятия ислама, поэтапное изучение намаза, первые суры, приоритеты, отношения с семьёй и к кому обращаться с вопросами.",
   "ar": "معنى الشهادتين، والغسل بعد الإسلام، وتعلم الصلاة خطوة خطوة، وأول السور، وأولويات التعلم، والتعامل مع الأهل، وممن تسأل.",
   "tr": "Şehadetin anlamı, İslam’dan sonra gusül, namazı adım adım öğrenmek, ilk sureler, öncelikler, aileyle ilişkiler ve sorularını kime soracağın."
  },
  "author": {
   "az": "Quran və səhih Sünnə; Sələf alimlərinin izahları",
   "en": "The Quran and authentic Sunnah; explanations of the scholars of the Salaf",
   "ru": "Коран и достоверная Сунна; разъяснения учёных саляфа",
   "ar": "القرآن والسنة الصحيحة؛ وشروح علماء السلف",
   "tr": "Kur’an ve sahih Sünnet; Selef âlimlerinin açıklamaları"
  },
  "minutes": 14
 }
]

export const lessonBySlug = (slug) => LESSONS.find(l => l.slug === slug) || null
