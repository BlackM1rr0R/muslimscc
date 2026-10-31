// ═══════════════════════════════════════════════════════
// "Haqqımızda" (/about) — saytın xəritəsi, redaksiya prinsipləri,
// məxfilik xülasəsi və əlaqə mətnləri.
//
// Xəritənin özü (bölmələr və linklər) src/data/navigation.js → NAV_GROUPS-dan
// qurulur — burada yalnız hər qrupun bir cümləlik təsviri var. Mənhəc mətni
// səhifədəki "Mənhəcimiz" kartındadır, məxfiliyin tam mətni /privacy-dədir —
// burada təkrarlanmır.
// ═══════════════════════════════════════════════════════

// Qrup açarı → qısa təsvir (NAV_GROUPS[].key ilə eyni)
export const GROUP_DESC = {
  main: { az: 'Namaz vaxtları, imsakiyyə, camaat və cümə, məscid ekranı və saytınız üçün namaz bloku.', en: 'Prayer times, the Ramadan timetable, congregation and Friday, a mosque display and a prayer-times widget for your site.', ru: 'Время намаза, расписание на Рамадан, джамаат и джума, экран для мечети и виджет времени намаза для вашего сайта.', ar: 'مواقيت الصلاة وإمساكية رمضان والجماعة والجمعة وشاشة المسجد وأداة المواقيت لموقعك.', tr: 'Namaz vakitleri, imsakiye, cemaat ve cuma, cami ekranı ve siteniz için namaz vakitleri aracı.' },
  quran: { az: 'Quranı tərcümə və təfsirlə oxumaq, mushaf görünüşü, kök axtarışı, hifz və ərəb əlifbası.', en: 'Read the Quran with translation and tafsir, the mushaf view, root search, memorisation and the Arabic alphabet.', ru: 'Чтение Корана с переводом и тафсиром, вид мусхафа, поиск по корню, заучивание и арабский алфавит.', ar: 'قراءة القرآن مع الترجمة والتفسير، وعرض المصحف، والبحث بالجذر، والحفظ، والحروف العربية.', tr: 'Kur’an’ı meal ve tefsirle okumak, mushaf görünümü, kök araması, hıfz ve Arap alfabesi.' },
  knowledge: { az: 'Dərslər, səhih hədislər, ən-Nəvəvinin 40 hədisi, səhabələr, Sələf alimləri, İslam tarixi, lüğət, kitablar və videolar.', en: 'Lessons, authentic hadith, an-Nawawi’s 40 hadith, the Companions, scholars of the Salaf, Islamic history, a glossary, books and videos.', ru: 'Уроки, достоверные хадисы, 40 хадисов ан-Навави, сподвижники, учёные саляфа, история ислама, словарь, книги и видео.', ar: 'الدروس والأحاديث الصحيحة والأربعون النووية والصحابة وعلماء السلف والتاريخ الإسلامي والمعجم والكتب والفيديوهات.', tr: 'Dersler, sahih hadisler, Nevevî’nin 40 hadisi, sahabeler, Selef âlimleri, İslam tarihi, sözlük, kitaplar ve videolar.' },
  worship: { az: 'Namazı addım-addım öyrənmək, qiblə, hicri təqvim və çevirici, namaz, qəza və gündəlik ibadət izləyiciləri.', en: 'Learn the prayer step by step, the qibla, the Hijri calendar and converter, and prayer, qada and daily worship trackers.', ru: 'Пошаговое обучение намазу, кибла, календарь хиджры и конвертер, трекеры намазов, возмещения и ежедневного поклонения.', ar: 'تعلم الصلاة خطوة خطوة، والقبلة، والتقويم الهجري ومحوّله، ومتابعة الصلاة والقضاء والعبادات اليومية.', tr: 'Namazı adım adım öğrenmek, kıble, hicri takvim ve çevirici, namaz, kaza ve günlük ibadet takibi.' },
  duas: { az: 'Quran və Sünnədən dualar, Hisnul-Müslim, zikr sayğacı, Allahın gözəl adları və şəxsi dua gündəliyi.', en: 'Duas from the Quran and Sunnah, Hisn al-Muslim, a dhikr counter, the Beautiful Names of Allah and a private dua journal.', ru: 'Дуа из Корана и Сунны, Хиснуль-муслим, счётчик зикра, прекрасные имена Аллаха и личный дневник дуа.', ar: 'أدعية من القرآن والسنة، وحصن المسلم، وعدّاد الذكر، وأسماء الله الحسنى، ومذكرة دعاء شخصية.', tr: 'Kur’an ve Sünnetten dualar, Hısnu’l-Müslim, zikir sayacı, Allah’ın güzel isimleri ve kişisel dua günlüğü.' },
  hajj: { az: 'Həcc və ümrə bələdçisi, müqəddəs yerlər və yaxınlıqdakı məscidlər xəritəsi.', en: 'A Hajj and Umrah guide, the holy places and a map of nearby mosques.', ru: 'Руководство по хаджу и умре, святые места и карта ближайших мечетей.', ar: 'دليل الحج والعمرة، والأماكن المقدسة، وخريطة المساجد القريبة.', tr: 'Hac ve umre rehberi, kutsal yerler ve yakındaki camiler haritası.' },
  giving: { az: 'Zəkat kalkulyatoru, miras hesablayıcısı və şəxsi sədəqə gündəliyi.', en: 'A zakat calculator, an inheritance calculator and a private sadaqah journal.', ru: 'Калькулятор закята, калькулятор наследства и личный дневник садаки.', ar: 'حاسبة الزكاة وحاسبة المواريث وسجل صدقات شخصي.', tr: 'Zekât hesaplayıcı, miras hesaplayıcı ve kişisel sadaka günlüğü.' },
  other: { az: 'AI köməkçi (fətva deyil), kviz, sitatlar və uşaq bölməsi.', en: 'An AI assistant (not a fatwa service), quizzes, quotes and a kids’ section.', ru: 'ИИ-помощник (не фетвы), викторины, цитаты и детский раздел.', ar: 'مساعد ذكي (ليس للفتوى)، واختبارات، واقتباسات، وقسم للأطفال.', tr: 'Yapay zekâ asistanı (fetva değildir), bilgi yarışması, alıntılar ve çocuk bölümü.' },
}

// Redaksiya prinsipləri
export const EDITORIAL = [
  { icon: 'quran',
    title: { az: 'Mənbələr', en: 'Sources', ru: 'Источники', ar: 'المصادر', tr: 'Kaynaklar' },
    text: { az: 'Quranın ərəb mətni Osmani mushafındandır; tərcümə və təfsirlərin müəllifi hər səhifədə göstərilir. Bütün mənbə və lisenziyaların siyahısı «Mənbələr və lisenziyalar» səhifəsindədir. Yaddaşdan yazılmış ayə və ya istinadsız «hədis» dərc etmirik.', en: 'The Arabic text of the Quran is from the Uthmani mushaf; the author of every translation and tafsir is named on its page. The full list of sources and licences is on the “Sources and licences” page. We do not publish verses written from memory or “hadith” without a reference.', ru: 'Арабский текст Корана — по мусхафу Усмана; автор каждого перевода и тафсира указан на странице. Полный список источников и лицензий — на странице «Источники и лицензии». Мы не публикуем аяты по памяти и «хадисы» без ссылки.', ar: 'نص القرآن العربي من المصحف العثماني، ويُذكر صاحب كل ترجمة وتفسير في صفحته، وقائمة المصادر والتراخيص كاملة في صفحة «المصادر والتراخيص». ولا ننشر آية من الذاكرة ولا «حديثًا» بلا عزو.', tr: 'Kur’an’ın Arapça metni Hz. Osman mushafındandır (Mushaf-ı Osmânî); her meal ve tefsirin sahibi kendi sayfasında belirtilir. Kaynak ve lisansların tam listesi “Kaynaklar ve lisanslar” sayfasındadır. Ezberden yazılmış ayet veya kaynaksız “hadis” yayımlamayız.' } },
  { icon: 'hadith',
    title: { az: 'Hədislərin dərəcəsi', en: 'Hadith grading', ru: 'Степень хадисов', ar: 'درجة الأحاديث', tr: 'Hadislerin derecesi' },
    text: { az: 'Yalnız səhih və həsən hədislər — kitabın adı və nömrəsi ilə. Sələf mühəddislərinin (əl-Albani və b.) hökmünə görə zəif və uydurma olan rəvayətlər saytdan çıxarılıb; yeni məzmun da bu qaydaya əsasən yoxlanılır.', en: 'Only sahih and hasan hadith — with the book name and number. Reports that hadith scholars of the Salafi methodology (al-Albani and others) graded weak or fabricated have been removed from the site, and new content is checked by the same rule.', ru: 'Только достоверные и хорошие хадисы — с названием книги и номером. Предания, признанные слабыми или выдуманными по оценке мухаддисов, следующих пути саляфа (аль-Альбани и др.), удалены с сайта; новые материалы проверяются по тому же правилу.', ar: 'لا نورد إلا الصحيح والحسن مع اسم الكتاب ورقم الحديث، وقد حذفنا ما حكم عليه محدّثو أهل السنة (كالألباني وغيره) بالضعف أو الوضع، ويُراجع كل محتوى جديد على هذه القاعدة.', tr: 'Yalnız sahih ve hasen hadisler — kitap adı ve numarasıyla. Selef yolundaki muhaddislerin (Elbânî ve diğerleri) zayıf veya uydurma dediği rivayetler siteden çıkarıldı; yeni içerik de aynı kurala göre kontrol edilir.' } },
  { icon: 'globe',
    title: { az: 'Tərcümələr və süni intellekt', en: 'Translations and AI', ru: 'Переводы и ИИ', ar: 'الترجمات والذكاء الاصطناعي', tr: 'Çeviriler ve yapay zekâ' },
    text: { az: 'Bəzi tərcümələr (məsələn, «Təfsir əl-Müyəssər»in Azərbaycan dilinə tərcüməsi) süni intellektin köməyi ilə hazırlanıb — onlar səhifədə açıq qeyd olunur, redaktə və yoxlamadan keçir; məna barədə ərəb əsli əsasdır. AI köməkçinin cavabları ümumi məlumatdır, fətva deyil.', en: 'Some translations (for example, the Azerbaijani translation of “Tafsir al-Muyassar”) were prepared with the help of AI — they are clearly labelled on the page and are being edited and reviewed; the Arabic original is the authority on meaning. The AI assistant’s answers are general information, not a fatwa.', ru: 'Некоторые переводы (например, азербайджанский перевод «Тафсира аль-Муяссар») подготовлены с помощью ИИ — это явно отмечено на странице, они редактируются и проверяются; в вопросах смысла опорой служит арабский оригинал. Ответы ИИ-помощника — общая информация, а не фетва.', ar: 'بعض الترجمات (كترجمة «التفسير الميسر» إلى الأذربيجانية) أُعدّت بمساعدة الذكاء الاصطناعي، ويُنبَّه على ذلك في الصفحة وتخضع للمراجعة والتدقيق، والمرجع في المعنى هو الأصل العربي. وإجابات المساعد الذكي معلومات عامة وليست فتوى.', tr: 'Bazı çeviriler (örneğin “Tefsîr el-Müyesser”in Azerbaycan Türkçesine çevirisi) yapay zekâ yardımıyla hazırlandı — sayfada açıkça belirtilir, düzeltilir ve gözden geçirilir; anlam konusunda Arapça asıl esastır. Yapay zekâ asistanının cevapları genel bilgidir, fetva değildir.' } },
  { icon: 'shield',
    title: { az: 'Təmiz mühit', en: 'A clean environment', ru: 'Чистая среда', ar: 'بيئة نقية', tr: 'Temiz bir ortam' },
    text: { az: 'Saytda reklam, musiqi və canlı varlıqların (insan və heyvan) təsviri yoxdur; illüstrasiyalar həndəsi naxış, memarlıq və təbiətdən ibarətdir.', en: 'The site has no ads, no music and no images of living beings (people or animals); illustrations are geometric patterns, architecture and nature.', ru: 'На сайте нет рекламы, музыки и изображений живых существ (людей и животных); иллюстрации — геометрические узоры, архитектура и природа.', ar: 'لا إعلانات في الموقع ولا موسيقى ولا صور لذوات الأرواح (إنسان أو حيوان)، والرسوم زخارف هندسية وعمارة وطبيعة.', tr: 'Sitede reklam, müzik ve canlı (insan ve hayvan) tasviri yoktur; çizimler geometrik desen, mimari ve doğadan oluşur.' } },
  { icon: 'alert',
    title: { az: 'Səhv bildirmək', en: 'Reporting an error', ru: 'Сообщить об ошибке', ar: 'الإبلاغ عن خطأ', tr: 'Hata bildirmek' },
    text: { az: 'Hədis kartlarında, Hisnul-Müslimdə, təfsirdə və dərslərdə «Səhv bildir» düyməsi var: səhvi və düzgün variantı (mümkünsə mənbə ilə) yazın — bildiriş redaktorlara çatır və yoxlanılır. Əlaqə məlumatı könüllüdür, IP ünvanı saxlanmır. Ümumi qeyd üçün aşağıdakı düyməni də işlədə bilərsiniz.', en: 'Hadith cards, Hisn al-Muslim, the tafsir and the lessons have a “Report an error” button: describe the error and the correct version (with a source if possible) — the report reaches the editors and is reviewed. Contact details are optional and your IP address is not stored. For a general note you can also use the button below.', ru: 'В карточках хадисов, в Хиснуль-муслим, тафсире и уроках есть кнопка «Сообщить об ошибке»: опишите ошибку и верный вариант (по возможности с источником) — сообщение получат редакторы и проверят его. Контактные данные необязательны, сетевой адрес не сохраняется. Для общего замечания можно воспользоваться и кнопкой ниже.', ar: 'في بطاقات الأحاديث وحصن المسلم والتفسير والدروس زر «الإبلاغ عن خطأ»: اكتب الخطأ والصواب (مع المصدر إن أمكن) فيصل البلاغ إلى المحررين ويُراجع، ووسيلة التواصل اختيارية ولا نحفظ عنوان الشبكة. ولملاحظة عامة استعمل الزر أدناه.', tr: 'Hadis kartlarında, Hısnu’l-Müslim’de, tefsirde ve derslerde “Hata bildir” düğmesi vardır: hatayı ve doğrusunu (mümkünse kaynağıyla) yazın — bildirim editörlere ulaşır ve incelenir. İletişim bilgisi isteğe bağlıdır, IP adresi saklanmaz. Genel bir not için aşağıdaki düğmeyi de kullanabilirsiniz.' } },
]

export const ABOUT_EXTRA = {
  az: { mapTitle: 'Saytda nə var', mapLead: 'Bütün bölmələr — yan menyudakı qruplar üzrə.', editorialTitle: 'Redaksiya prinsipləri', privacyTitle: 'Məxfilik — qısaca', privacyText: 'Hesab və qeydiyyat yoxdur, kuki və reklam yoxdur. Dua və sədəqə gündəliyi, izləyicilər və seçimləriniz yalnız brauzerinizdə saxlanılır. Serverə yalnız zəruri olan gedir: bildirişləri açsanız — bildiriş ünvanı və şəhər, AI köməkçiyə sual versəniz — sualın mətni.', privacyLink: 'Məxfilik siyasəti', termsLink: 'İstifadə şərtləri', licensesLink: 'Mənbələr və lisenziyalar', contactTitle: 'Əlaqə', contactText: 'Təklif, sual və ya əməkdaşlıq üçün yazın. Məzmun səhvini isə «Səhv bildir» düyməsi ilə göndərmək daha sürətlidir.', email: 'E-poçt', reportRef: 'Haqqımızda — ümumi qeyd' },
  en: { mapTitle: 'What this site offers', mapLead: 'Every section — grouped as in the side menu.', editorialTitle: 'Editorial principles', privacyTitle: 'Privacy in short', privacyText: 'No accounts or sign-up, no cookies and no ads. Your dua and sadaqah journals, trackers and preferences stay only in your browser. Only what is necessary reaches our server: a notification address and city if you turn on notifications, and the text of your question if you ask the AI assistant.', privacyLink: 'Privacy policy', termsLink: 'Terms of use', licensesLink: 'Sources and licences', contactTitle: 'Contact', contactText: 'Write to us with suggestions, questions or offers of help. To report a content error, the “Report an error” button is quicker.', email: 'Email', reportRef: 'About — general note' },
  ru: { mapTitle: 'Что есть на сайте', mapLead: 'Все разделы — по группам бокового меню.', editorialTitle: 'Редакционные принципы', privacyTitle: 'Конфиденциальность — кратко', privacyText: 'Нет учётных записей и регистрации, нет куки и рекламы. Дневники дуа и садаки, трекеры и настройки хранятся только в вашем браузере. На сервер попадает лишь необходимое: адрес для уведомлений и город, если вы их включите, и текст вопроса, если спросите ИИ-помощника.', privacyLink: 'Политика конфиденциальности', termsLink: 'Условия использования', licensesLink: 'Источники и лицензии', contactTitle: 'Контакты', contactText: 'Пишите нам с предложениями, вопросами или желанием помочь. Об ошибке в материалах быстрее сообщить кнопкой «Сообщить об ошибке».', email: 'Эл. почта', reportRef: 'О нас — общее замечание' },
  ar: { mapTitle: 'ماذا يقدّم الموقع', mapLead: 'جميع الأقسام مرتبة كما في القائمة الجانبية.', editorialTitle: 'مبادئ التحرير', privacyTitle: 'الخصوصية باختصار', privacyText: 'لا حسابات ولا تسجيل، ولا ملفات تعريف ارتباط ولا إعلانات. تبقى مذكرة الدعاء وسجل الصدقات وأدوات المتابعة وتفضيلاتك في متصفحك فقط، ولا يصل إلى خادمنا إلا الضروري: عنوان الإشعارات والمدينة إن فعّلت الإشعارات، ونص سؤالك إن سألت المساعد الذكي.', privacyLink: 'سياسة الخصوصية', termsLink: 'شروط الاستخدام', licensesLink: 'المصادر والتراخيص', contactTitle: 'التواصل', contactText: 'راسلنا باقتراح أو سؤال أو رغبة في المساعدة، وللإبلاغ عن خطأ في المحتوى فزر «الإبلاغ عن خطأ» أسرع.', email: 'البريد الإلكتروني', reportRef: 'عن الموقع — ملاحظة عامة' },
  tr: { mapTitle: 'Sitede neler var', mapLead: 'Bütün bölümler — yan menüdeki gruplara göre.', editorialTitle: 'Yayın ilkeleri', privacyTitle: 'Kısaca gizlilik', privacyText: 'Hesap ve kayıt yok, çerez ve reklam yok. Dua ve sadaka günlükleriniz, takip araçlarınız ve tercihleriniz yalnız tarayıcınızda saklanır. Sunucumuza yalnız gerekli olan ulaşır: bildirimleri açarsanız bildirim adresi ve şehir, yapay zekâ asistanına soru sorarsanız sorunun metni.', privacyLink: 'Gizlilik politikası', termsLink: 'Kullanım şartları', licensesLink: 'Kaynaklar ve lisanslar', contactTitle: 'İletişim', contactText: 'Öneri, soru veya yardım teklifi için bize yazın. İçerik hatasını ise “Hata bildir” düğmesiyle göndermek daha hızlıdır.', email: 'E-posta', reportRef: 'Hakkımızda — genel not' },
}

// ── Dizayn v3: hero, "Rəqəmlərlə", mənhəc bəndləri, bölmə başlıqları ──
// Mənhəc bəndləri əvvəlki "Mənhəcimiz" paraqrafının özüdür (Tövbə 9:100;
// Buxari 2652) — yalnız oxunsun deyə dörd bəndə bölünüb, yeni iddia yoxdur.
export const MANHAJ_POINTS = [
  { icon: 'quran',
    title: { az: 'Quran və səhih Sünnə', en: 'The Quran and the authentic Sunnah', ru: 'Коран и достоверная Сунна', ar: 'القرآن والسنة الصحيحة', tr: 'Kur’an ve sahih Sünnet' },
    text: { az: 'Dini məzmun Quran və səhih Sünnəyə — səhabələrin və onlara gözəl şəkildə tabe olan ilk nəsillərin, Sələfi-salehin anlayışına əsaslanır (Tövbə 9:100; Buxari 2652).', en: 'The religious content is based on the Quran and the authentic Sunnah, as understood by the Companions and the early generations who followed them in goodness — the Salaf as-Salih (At-Tawbah 9:100; Bukhari 2652).', ru: 'Религиозное содержание основано на Коране и достоверной Сунне в понимании сподвижников и первых поколений, последовавших за ними в добре, — праведных предшественников (ат-Тауба 9:100; Бухари 2652).', ar: 'يقوم المحتوى الديني على القرآن الكريم والسنة الصحيحة بفهم الصحابة ومن تبعهم بإحسان من القرون الأولى — السلف الصالح (التوبة: 100؛ البخاري 2652).', tr: 'Dinî içerik, Kur’an’a ve sahih Sünnet’e, sahabenin ve onlara güzellikle tabi olan ilk nesillerin — Selef-i Salihin’in anlayışına dayanır (Tevbe 9:100; Buhari 2652).' } },
  { icon: 'shield',
    title: { az: 'Əqidə', en: 'Creed', ru: 'Вероубеждение', ar: 'الاعتقاد', tr: 'Akide' },
    text: { az: 'Allahın adlarını və sifətlərini təhrif, təətil, keyfiyyət soruşmaq və bənzətmə olmadan isbat edirik.', en: 'We affirm Allah’s Names and Attributes without distortion, denial, asking how, or likening Him to creation.', ru: 'Мы утверждаем имена и атрибуты Аллаха без искажения, отрицания, вопроса «как» и уподобления творению.', ar: 'نثبت أسماء الله وصفاته من غير تحريف ولا تعطيل ولا تكييف ولا تمثيل.', tr: 'Allah’ın isim ve sıfatlarını tahrif, tatil, keyfiyet sormak ve benzetme olmadan ispat ederiz.' } },
  { icon: 'prayer',
    title: { az: 'İbadət', en: 'Worship', ru: 'Поклонение', ar: 'العبادة', tr: 'İbadet' },
    text: { az: 'İbadətdə Peyğəmbərin ﷺ sünnəsinə tabe olub bidətlərdən çəkinirik.', en: 'In worship, we follow the Sunnah of the Prophet ﷺ and avoid innovations.', ru: 'В поклонении следуем Сунне Пророка ﷺ и избегаем нововведений.', ar: 'في العبادة نتبع سنة النبي ﷺ ونجتنب البدع.', tr: 'İbadette Peygamber’in ﷺ sünnetine uyar, bidatlerden sakınırız.' } },
  { icon: 'books',
    title: { az: 'Fiqh', en: 'Fiqh', ru: 'Фикх', ar: 'الفقه', tr: 'Fıkıh' },
    text: { az: 'Dəlilə əsaslanan görüşləri İbn Baz, İbn Useymin, Albani və Daimi Fətva Komitəsi kimi alimlərin şərhlərinə istinadla təqdim edirik.', en: 'We present evidence-based positions with reference to the explanations of scholars such as Ibn Baz, Ibn Uthaymeen, al-Albani and the Permanent Committee for Fatwa.', ru: 'Мы приводим мнения, основанные на доводах, со ссылкой на разъяснения таких учёных, как Ибн Баз, Ибн Усеймин, аль-Альбани и Постоянный комитет по фетвам.', ar: 'نعرض الأقوال المبنية على الدليل مع الإحالة إلى شروح العلماء كابن باز وابن عثيمين والألباني واللجنة الدائمة للإفتاء.', tr: 'Delile dayanan görüşleri İbn Baz, İbn Useymin, Elbânî ve Daimî Fetva Komitesi gibi âlimlerin açıklamalarına atıfla sunarız.' } },
]

export const ABOUT_V3 = {
  az: {
    how: 'Bu səhifədə: saytın məqsədi, mənhəci, bütün bölmələr və məzmunun necə yoxlanıldığı.',
    free: 'Pulsuz', noAds: 'Reklamsız', langs: 'dil',
    storyEy: 'Biz kimik', manhajEy: 'Mənhəc', manhajNote: 'Bütün müsəlmanlara hörmətlə yanaşırıq; bir səhvimizi görsəniz, bizə bildirməyinizi xahiş edirik.',
    statsEy: 'Rəqəmlərlə', statsTitle: 'Saytdakı bilik', statsLead: 'Hər rəqəm saytın öz məlumat fayllarından sayılıb — yeni məzmun əlavə olunduqca dəyişir.',
    sLessons: 'Dərs', hLessons: 'saat oxu',
    sHadith: 'Hədis', hHadith: 'səhih və həsən', sNames: 'Allahın adı', hNames: 'İbn Useymin siyahısı',
    sScholars: 'Alim', hScholars: 'Sələf yolunda', sSahaba: 'Səhabə', hSahaba: 'həyat hekayəsi',
    sGlossary: 'Termin', hGlossary: 'İslami lüğətdə', sNawawi: 'Nəvəvi hədisi', hNawawi: '«Əl-Ərbəin» tam', sSections: 'Bölmə', hSections: 'axtarışda açılan',
    chLessons: 'Dərslər mövzulara görə', chScholars: 'Alimlər dövrlərə görə', chUnitL: 'dərs sayı', chUnitS: 'alim sayı',
    chNote: 'Mənbə: saytın məlumat faylları (dərslər, alimlər).',
    mapEy: 'Xəritə', editorialEy: 'Etibar', editorialLead: 'Məzmunu necə seçir, yoxlayır və düzəldirik.',
    infoEy: 'Məxfilik və əlaqə',
  },
  en: {
    how: 'On this page: the site’s purpose, its methodology, every section and how the content is checked.',
    free: 'Free', noAds: 'Ad-free', langs: 'languages',
    storyEy: 'Who we are', manhajEy: 'Methodology', manhajNote: 'We treat all Muslims with respect; if you notice a mistake, please let us know.',
    statsEy: 'In numbers', statsTitle: 'Knowledge on the site', statsLead: 'Every number is counted from the site’s own data files — it grows as new content is added.',
    sLessons: 'Lessons', hLessons: 'hours of reading',
    sHadith: 'Hadith', hHadith: 'sahih and hasan', sNames: 'Names of Allah', hNames: 'Ibn Uthaymeen’s list',
    sScholars: 'Scholars', hScholars: 'on the way of the Salaf', sSahaba: 'Companions', hSahaba: 'life stories',
    sGlossary: 'Terms', hGlossary: 'in the glossary', sNawawi: 'Nawawi hadith', hNawawi: 'the full Arba‘in', sSections: 'Sections', hSections: 'indexed pages',
    chLessons: 'Lessons by topic', chScholars: 'Scholars by era', chUnitL: 'number of lessons', chUnitS: 'number of scholars',
    chNote: 'Source: the site’s data files (lessons, scholars).',
    mapEy: 'Site map', editorialEy: 'Trust', editorialLead: 'How we choose, check and correct the content.',
    infoEy: 'Privacy and contact',
  },
  ru: {
    how: 'На этой странице: цель сайта, его манхадж, все разделы и то, как проверяется содержание.',
    free: 'Бесплатно', noAds: 'Без рекламы', langs: 'языков',
    storyEy: 'Кто мы', manhajEy: 'Манхадж', manhajNote: 'Мы относимся ко всем мусульманам с уважением; если вы заметили ошибку, пожалуйста, сообщите нам.',
    statsEy: 'В цифрах', statsTitle: 'Знания на сайте', statsLead: 'Каждое число подсчитано по файлам данных сайта — оно растёт с новыми материалами.',
    sLessons: 'Уроков', hLessons: 'ч чтения',
    sHadith: 'Хадисов', hHadith: 'сахих и хасан', sNames: 'Имён Аллаха', hNames: 'список Ибн Усеймина',
    sScholars: 'Учёных', hScholars: 'на пути саляфов', sSahaba: 'Сподвижников', hSahaba: 'жизнеописания',
    sGlossary: 'Терминов', hGlossary: 'в словаре', sNawawi: 'Хадисов ан-Навави', hNawawi: '«Сорок» полностью', sSections: 'Разделов', hSections: 'в поиске',
    chLessons: 'Уроки по темам', chScholars: 'Учёные по эпохам', chUnitL: 'число уроков', chUnitS: 'число учёных',
    chNote: 'Источник: файлы данных сайта (уроки, учёные).',
    mapEy: 'Карта сайта', editorialEy: 'Доверие', editorialLead: 'Как мы отбираем, проверяем и исправляем материалы.',
    infoEy: 'Конфиденциальность и связь',
  },
  ar: {
    how: 'في هذه الصفحة: غاية الموقع ومنهجه وجميع أقسامه وكيف يُراجَع محتواه.',
    free: 'مجاني', noAds: 'بلا إعلانات', langs: 'لغات',
    storyEy: 'من نحن', manhajEy: 'المنهج', manhajNote: 'نحترم جميع المسلمين، وإن رأيتم خطأً فنرجو أن تنبهونا إليه.',
    statsEy: 'بالأرقام', statsTitle: 'العلم في الموقع', statsLead: 'كل رقم محسوب من ملفات بيانات الموقع نفسها، ويزداد بإضافة محتوى جديد.',
    sLessons: 'درسًا', hLessons: 'ساعات قراءة',
    sHadith: 'حديث', hHadith: 'صحيح وحسن', sNames: 'اسمًا لله', hNames: 'قائمة ابن عثيمين',
    sScholars: 'عالمًا', hScholars: 'على منهج السلف', sSahaba: 'صحابيًا', hSahaba: 'سير وتراجم',
    sGlossary: 'مصطلحًا', hGlossary: 'في المعجم', sNawawi: 'حديثًا نوويًا', hNawawi: 'الأربعون كاملة', sSections: 'قسمًا', hSections: 'صفحات مفهرسة',
    chLessons: 'الدروس حسب الموضوع', chScholars: 'العلماء حسب العصر', chUnitL: 'عدد الدروس', chUnitS: 'عدد العلماء',
    chNote: 'المصدر: ملفات بيانات الموقع (الدروس، العلماء).',
    mapEy: 'خريطة الموقع', editorialEy: 'الثقة', editorialLead: 'كيف نختار المحتوى ونراجعه ونصحّحه.',
    infoEy: 'الخصوصية والتواصل',
  },
  tr: {
    how: 'Bu sayfada: sitenin amacı, menheci, bütün bölümler ve içeriğin nasıl kontrol edildiği.',
    free: 'Ücretsiz', noAds: 'Reklamsız', langs: 'dil',
    storyEy: 'Biz kimiz', manhajEy: 'Menhec', manhajNote: 'Bütün Müslümanlara saygıyla yaklaşırız; bir hatamızı görürseniz bize bildirmenizi rica ederiz.',
    statsEy: 'Rakamlarla', statsTitle: 'Sitedeki bilgi', statsLead: 'Her rakam sitenin kendi veri dosyalarından sayılmıştır — yeni içerik eklendikçe artar.',
    sLessons: 'Ders', hLessons: 'saat okuma',
    sHadith: 'Hadis', hHadith: 'sahih ve hasen', sNames: 'Allah’ın ismi', hNames: 'İbn Useymin listesi',
    sScholars: 'Âlim', hScholars: 'Selef yolunda', sSahaba: 'Sahabi', hSahaba: 'hayat hikâyesi',
    sGlossary: 'Terim', hGlossary: 'İslami sözlükte', sNawawi: 'Nevevî hadisi', hNawawi: '«Erbaîn» tam', sSections: 'Bölüm', hSections: 'aramada açılan',
    chLessons: 'Konulara göre dersler', chScholars: 'Dönemlere göre âlimler', chUnitL: 'ders sayısı', chUnitS: 'âlim sayısı',
    chNote: 'Kaynak: sitenin veri dosyaları (dersler, âlimler).',
    mapEy: 'Site haritası', editorialEy: 'Güven', editorialLead: 'İçeriği nasıl seçiyor, kontrol ediyor ve düzeltiyoruz.',
    infoEy: 'Gizlilik ve iletişim',
  },
}
