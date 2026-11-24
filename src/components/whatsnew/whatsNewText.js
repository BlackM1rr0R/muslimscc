// ═══════════════════════════════════════════════════════
// "Yeniliklər" sətirlərinin mətni — 5 dildə (src/data/whatsNew.js-in id-ləri ilə)
//
// Ayrıca faylda: data faylı menyu ilə əsas paketə düşür, mətnlər isə yalnız /whats-new
// səhifəsinin chunk-ında. scripts/extract-ui-strings.mjs src/components-i oxuyur — "en"
// mətnləri 44 əlavə dilin lüğətinə avtomatik düşür. Dini mətn YOXDUR — yalnız funksiyanın təsviri.
// t — başlıq, d — bir cümlə.
// ═══════════════════════════════════════════════════════

export const WHATS_NEW_TEXT = {
  prayerrooms: {
    t: { az: 'Namaz otaqları', en: 'Prayer rooms', ru: 'Комнаты для намаза', ar: 'المصليات', tr: 'Mescit ve namaz odaları' },
    d: { az: 'Hava limanı, ticarət mərkəzi, universitet və xəstəxanalarda namaz otaqları — şəhər və növ süzgəci, «yaxınımdakılar» yalnız brauzerdə; yerləri istifadəçilər təklif edir, nəzarətçi yoxlayır.', en: 'Prayer rooms at airports, malls, universities and hospitals — filter by city and type, “near me” computed only in your browser; users suggest places and moderators check them.', ru: 'Комнаты для намаза в аэропортах, торговых центрах, университетах и больницах — фильтр по городу и типу, «рядом со мной» считается только в браузере; места предлагают пользователи, проверяют модераторы.', ar: 'مصليات في المطارات والمراكز التجارية والجامعات والمستشفيات — تصفية حسب المدينة والنوع، و«بالقرب مني» يُحسب في متصفحك فقط؛ يقترح المستخدمون الأماكن ويراجعها المشرفون.', tr: 'Havalimanı, AVM, üniversite ve hastanelerde namaz odaları — şehir ve türe göre filtre, “yakınımdakiler” yalnızca tarayıcıda hesaplanır; yerleri kullanıcılar önerir, moderatörler kontrol eder.' },
  },
  janaza: {
    t: { az: 'Cənazə elanı', en: 'Janaza notice', ru: 'Объявление о джаназе', ar: 'إعلان جنازة', tr: 'Cenaze ilanı' },
    d: { az: 'Cənazə namazının vaxtı və yeri gizli keçidlə; istəsəniz, yoxlamadan sonra ictimai siyahıda. «Dua etdim» sayını yalnız ailə görür; dualar Hisnul-Müslimdən.', en: 'The time and place of the funeral prayer via a private link, or in the public list after review if you wish. Only the family sees the “I made dua” count; duas from Hisn al-Muslim.', ru: 'Время и место заупокойной молитвы по закрытой ссылке или, по желанию, в общем списке после проверки. Число «Сделал(а) дуа» видит только семья; дуа из «Хиснуль-муслим».', ar: 'موعد صلاة الجنازة ومكانها برابط خاص، أو في القائمة العامة بعد المراجعة إن شئت. لا ترى عدد «دعوتُ للميت» إلا الأسرة؛ والأدعية من حصن المسلم.', tr: 'Cenaze namazının vakti ve yeri gizli bağlantıyla; dilerseniz incelemeden sonra açık listede. “Dua ettim” sayısını yalnızca aile görür; dualar Hısnu’l-Müslim’den.' },
  },
  volunteers: {
    t: { az: 'Məscid könüllüləri', en: 'Mosque volunteers', ru: 'Волонтёры мечетей', ar: 'متطوعو المساجد', tr: 'Cami gönüllüleri' },
    d: { az: 'Məscid nümayəndələri iftar, təmizlik və tədbirlər üçün könüllü axtarır; yazılın və ya ləğv edin. Siyahıda yalnız dolu yerlərin sayı var — ad və reytinq yoxdur.', en: 'Mosque representatives ask for help with iftar, cleaning and events; sign up or cancel. The list shows only how many slots are filled — no names or rankings.', ru: 'Представители мечетей ищут помощников для ифтаров, уборки и мероприятий; записывайтесь или отменяйте запись. В списке только число занятых мест — без имён и рейтингов.', ar: 'يطلب ممثلو المساجد العون في الإفطار والتنظيف والفعاليات؛ سجّل أو ألغِ تسجيلك. تعرض القائمة عدد الأماكن المشغولة فقط، بلا أسماء ولا ترتيب.', tr: 'Cami temsilcileri iftar, temizlik ve etkinlikler için gönüllü arıyor; kaydolun veya iptal edin. Listede yalnızca dolan yer sayısı var; isim ve sıralama yok.' },
  },
  ramadanprep: {
    t: { az: 'Ramazana hazırlıq yolu', en: 'Road to Ramadan', ru: 'Путь к Рамадану', ar: 'الطريق إلى رمضان', tr: 'Ramazan’a hazırlık yolu' },
    d: { az: 'Ramazana qədər hər gün bir kiçik addım: qəza orucları, Quran planı, sədəqə, yuxu rejimi, iftar duası — geri sayımla.', en: 'One small step a day until Ramadan: missed fasts, a Quran plan, sadaqah, sleep and the iftar dua — with a countdown.', ru: 'По одному небольшому шагу в день до Рамадана: пропущенные посты, план Корана, садака, сон и дуа ифтара — с обратным отсчётом.', ar: 'خطوة صغيرة كل يوم حتى رمضان: قضاء الصيام، وخطة القرآن، والصدقة، والنوم، ودعاء الإفطار — مع عدّ تنازلي.', tr: 'Ramazan’a kadar her gün küçük bir adım: kaza oruçları, Kur’an planı, sadaka, uyku ve iftar duası — geri sayımla.' },
  },
  lastten: {
    t: { az: 'Son 10 gecə', en: 'Last ten nights', ru: 'Последние десять ночей', ar: 'العشر الأواخر', tr: 'Son on gece' },
    d: { az: 'Gecə-gecə siyahı (qiyam, Quran, dua, sədəqə, istiğfar), tək gecələr vurğulanır, sakit etikaf rejimi və Qədr gecəsinin duası mənbəsi ilə.', en: 'A night-by-night checklist (qiyam, Quran, dua, sadaqah, istighfar), odd nights highlighted, a calm i’tikaf mode and the Laylat al-Qadr dua with its source.', ru: 'Список на каждую ночь (кыям, Коран, дуа, садака, истигфар), выделенные нечётные ночи, спокойный режим итикафа и дуа Ночи предопределения с источником.', ar: 'قائمة لكل ليلة (القيام، والقرآن، والدعاء، والصدقة، والاستغفار)، مع تمييز الليالي الوترية، ووضع اعتكاف هادئ، ودعاء ليلة القدر بمصدره.', tr: 'Gece gece liste (kıyam, Kur’an, dua, sadaka, istiğfar), tek geceler vurgulu, sakin itikâf modu ve kaynağıyla Kadir gecesi duası.' },
  },
  trustbox: {
    t: { az: 'Əmanət qutusu', en: 'Trust box', ru: 'Ящик доверия', ar: 'صندوق الأمانة', tr: 'Emanet kutusu' },
    d: { az: 'Vəsiyyət istəkləri, borclar, sənədlərin yeri və ailəyə son sözlər — uçdan-uca şifrəli; yalnız etibar etdiyiniz şəxs keçid və parolla oxuya bilər.', en: 'Will wishes, debts, where your documents are and last words to your family — end-to-end encrypted; only the person you trust can read them, with a link and a passphrase.', ru: 'Пожелания по завещанию, долги, где лежат документы и последние слова семье — со сквозным шифрованием; прочитать может только доверенный человек по ссылке и фразе.', ar: 'ما توصي به، والديون، وأماكن الوثائق، وكلماتك الأخيرة لأهلك — مشفّرة من طرف إلى طرف؛ لا يقرؤها إلا من تثق به بالرابط وعبارة المرور.', tr: 'Vasiyet istekleri, borçlar, belgelerin yeri ve ailenize son sözler — uçtan uca şifreli; yalnızca güvendiğiniz kişi bağlantı ve parolayla okuyabilir.' },
  },
  'telegram-bot': {
    // lang-ok[Telegram]: xidmətin adı
    t: { az: 'Telegram botu', en: 'Telegram bot', ru: 'Telegram-бот', ar: 'بوت تيليجرام', tr: 'Telegram botu' },
    // lang-ok[Telegram]: xidmətin adı
    d: { az: 'Namaz vaxtları, növbəti namaz, günün ayəsi və hədisi Telegram-da; istəsəniz hər azan vaxtında xatırlatma.', en: 'Prayer times, the next prayer, the verse and hadith of the day in Telegram; reminders at every adhan time if you like.', ru: 'Время намаза, следующий намаз, аят и хадис дня в Telegram; по желанию — напоминание в каждое время азана.', ar: 'مواقيت الصلاة والصلاة القادمة وآية اليوم وحديث اليوم في تيليجرام، مع تذكير عند كل أذان إن شئت.', tr: 'Namaz vakitleri, sonraki namaz, günün ayeti ve hadisi Telegram’da; dilerseniz her ezan vaktinde hatırlatma.' },
  },
  'share-target': {
    t: { az: '«Paylaş → Muslims.cc»', en: '“Share → Muslims.cc”', ru: '«Поделиться → Muslims.cc»', ar: '«مشاركة ← Muslims.cc»', tr: '“Paylaş → Muslims.cc”' },
    d: { az: 'Quraşdırılmış tətbiqə başqa tətbiqdən mətn paylaşın: ərəbcəni Quranda tapın, məna ilə ayə axtarın, E-kodları halal yoxlayın və ya dua gündəliyinə yazın.', en: 'Share text to the installed app from any other app: find Arabic in the Quran, search verses by meaning, check E-numbers for halal or save it to your dua journal.', ru: 'Делитесь текстом из любого приложения с установленным приложением: найдите арабский текст в Коране, ищите аяты по смыслу, проверьте E-коды на халяль или сохраните в дневник дуа.', ar: 'شارك نصًا من أي تطبيق إلى التطبيق المثبَّت: ابحث عن العربية في القرآن، أو عن الآيات بالمعنى، أو افحص رموز E للحلال، أو احفظه في مذكرة الدعاء.', tr: 'Herhangi bir uygulamadan yüklü uygulamaya metin paylaşın: Arapçayı Kur’an’da bulun, anlamla ayet arayın, E-kodlarını helal için kontrol edin veya dua günlüğüne kaydedin.' },
  },
  'letter-trace-forms': {
    t: { az: 'Hərfləri barmaqla yaz: formalar və səs', en: 'Trace the letters: forms and sound', ru: 'Пишите буквы пальцем: формы и звук', ar: 'اكتب الحروف بإصبعك: الأشكال والنطق', tr: 'Harfleri parmakla yaz: biçimler ve ses' },
    d: { az: 'Ərəb kursundakı yazma məşqində indi hər hərfin dörd mövqe forması, transliterasiyası və tələffüz səsi var.', en: 'The tracing practice in the Arabic course now has each letter’s four positional forms, its transliteration and its pronunciation.', ru: 'В упражнении по письму в курсе арабского теперь есть четыре позиционные формы каждой буквы, транслитерация и произношение.', ar: 'صار تمرين الكتابة في دورة العربية يضم الأشكال الأربعة لكل حرف ونقحرته ونطقه.', tr: 'Arapça kursundaki yazma alıştırmasında artık her harfin dört konum biçimi, transliterasyonu ve telaffuz sesi var.' },
  },
  'whats-new': {
    t: { az: 'Yeniliklər və bələdçi tur', en: 'What’s new and a guided tour', ru: 'Что нового и обзорный тур', ar: 'ما الجديد وجولة إرشادية', tr: 'Yenilikler ve rehberli tur' },
    d: { az: 'Son əlavələrin tarixli siyahısı, menyuda «Yeni» nişanları və saytı bir dəqiqəyə tanıdan tur.', en: 'A dated list of recent additions, “New” badges in the menu and a one-minute tour of the site.', ru: 'Список последних добавлений по датам, метки «Новое» в меню и тур по сайту за одну минуту.', ar: 'قائمة مؤرَّخة بأحدث الإضافات، وشارات «جديد» في القائمة، وجولة في الموقع خلال دقيقة واحدة.', tr: 'Son eklemelerin tarihli listesi, menüde “Yeni” etiketleri ve siteyi bir dakikada tanıtan tur.' },
  },
  bedtime: {
    t: { az: 'Yatmazdan əvvəl sünnə', en: 'Bedtime Sunnah routine', ru: 'Сунна перед сном', ar: 'سنن النوم', tr: 'Yatmadan önce sünnet' },
    d: { az: 'Yatmazdan əvvəlki zikrlər və sünnələr addım-addım, Hisnul-Müslim və hədislərdən, mənbələri ilə.', en: 'The bedtime remembrances and Sunnah acts step by step, from Hisn al-Muslim and the hadith, with sources.', ru: 'Поминания и сунны перед сном шаг за шагом — из «Хиснуль-муслим» и хадисов, с источниками.', ar: 'أذكار النوم وسننه خطوة خطوة من حصن المسلم والأحاديث مع مصادرها.', tr: 'Yatmadan önceki zikirler ve sünnetler adım adım, Hısnu’l-Müslim ve hadislerden, kaynaklarıyla.' },
  },
  waking: {
    t: { az: 'Səhər oyanışı', en: 'Morning waking routine', ru: 'Утреннее пробуждение', ar: 'الاستيقاظ صباحًا', tr: 'Sabah uyanışı' },
    d: { az: 'Oyananda oxunan dualar və səhər sünnələri sakit, ardıcıl sıra ilə.', en: 'The duas on waking and the morning Sunnah acts in a calm, ordered sequence.', ru: 'Дуа при пробуждении и утренние сунны в спокойной последовательности.', ar: 'أدعية الاستيقاظ وسنن الصباح في ترتيب هادئ متسلسل.', tr: 'Uyanınca okunan dualar ve sabah sünnetleri sakin, sıralı bir düzenle.' },
  },
  halaqa: {
    t: { az: 'Həftəlik ailə halqası', en: 'Weekly family halaqa', ru: 'Семейный халяк недели', ar: 'الحلقة الأسرية الأسبوعية', tr: 'Haftalık aile halkası' },
    d: { az: 'Hər həftə ailə ilə birlikdə oxumaq üçün hazır dəst: bir ayə, bir hədis, qısa dərs və müzakirə sualları.', en: 'A ready set to read together each week: one verse, one hadith, a short lesson and discussion questions.', ru: 'Готовый набор для совместного чтения каждую неделю: аят, хадис, короткий урок и вопросы для беседы.', ar: 'مجموعة جاهزة للقراءة مع الأسرة كل أسبوع: آية وحديث ودرس قصير وأسئلة للنقاش.', tr: 'Her hafta aileyle birlikte okumak için hazır set: bir ayet, bir hadis, kısa bir ders ve sohbet soruları.' },
  },
  sickvisit: {
    t: { az: 'Xəstəni ziyarət', en: 'Visiting the sick', ru: 'Посещение больного', ar: 'عيادة المريض', tr: 'Hasta ziyareti' },
    d: { az: 'Ziyarətin fəziləti, ədəbi və duaları mənbələri ilə, üstəlik şəxsi ziyarət xatırlatmaları.', en: 'The virtue, manners and duas of visiting the sick with their sources, plus personal visit reminders.', ru: 'Достоинство, этикет и дуа посещения больного с источниками, а также личные напоминания о визитах.', ar: 'فضل عيادة المريض وآدابها وأدعيتها بمصادرها، مع تذكيرات شخصية بالزيارة.', tr: 'Hasta ziyaretinin fazileti, adabı ve duaları kaynaklarıyla; ayrıca kişisel ziyaret hatırlatmaları.' },
  },
  travelkit: {
    t: { az: 'Səyyahın dəsti', en: 'Traveller kit', ru: 'Набор путешественника', ar: 'حقيبة المسافر', tr: 'Yolcu çantası' },
    d: { az: 'Təyinatı seçin: oradakı qiblə, namaz vaxtları və evlə saat fərqi bir səhifədə.', en: 'Pick a destination: its qibla, prayer times and the time difference from home on one page.', ru: 'Выберите пункт назначения: кибла, время намаза и разница во времени с домом на одной странице.', ar: 'اختر وجهتك: القبلة هناك ومواقيت الصلاة وفارق التوقيت عن بلدك في صفحة واحدة.', tr: 'Varış yerini seçin: oradaki kıble, namaz vakitleri ve evle saat farkı tek sayfada.' },
  },
  yearbook: {
    t: { az: '«Mənim ilim» kitabı', en: '“My year” book', ru: 'Книга «Мой год»', ar: 'كتاب «عامي»', tr: '“Benim yılım” kitabı' },
    d: { az: 'Seçdiyiniz ilin şəxsi qeydlərindən çap edilə bilən kitab — yalnız cihazınızdakı məlumatla.', en: 'A printable book made from your personal notes for the year you choose — only from data on your device.', ru: 'Книга для печати из ваших личных записей за выбранный год — только из данных на устройстве.', ar: 'كتاب قابل للطباعة من ملاحظاتك الشخصية للعام الذي تختاره — من بيانات جهازك فقط.', tr: 'Seçtiğiniz yılın kişisel notlarından yazdırılabilir bir kitap — yalnızca cihazınızdaki verilerle.' },
  },
  debts: {
    t: { az: 'Borc dəftəri', en: 'Debt ledger', ru: 'Книга долгов', ar: 'سجل الديون', tr: 'Borç defteri' },
    d: { az: 'Kimə borclu olduğunuzu və kimin sizə borclu olduğunu gizli qeyd edin: məbləğ, gün, şahidlər, qaytarmalar.', en: 'Privately record what you owe and what is owed to you: amount, date, witnesses and repayments.', ru: 'Личный учёт: кому вы должны и кто должен вам — сумма, дата, свидетели, возвраты.', ar: 'سجّل بخصوصية ما عليك من ديون وما لك: المبلغ والتاريخ والشهود والسداد.', tr: 'Kime borçlu olduğunuzu ve kimin size borçlu olduğunu gizlice kaydedin: tutar, tarih, şahitler, ödemeler.' },
  },
  haid: {
    t: { az: 'Qadın təqvimi', en: 'Women’s calendar', ru: 'Женский календарь', ar: 'تقويم المرأة', tr: 'Kadın takvimi' },
    d: { az: 'Heyz və nifas günlərinin şəxsi qeydi; Ramazana düşən qəza günləri avtomatik göstərilir.', en: 'A private log of hayd and nifas days; Ramadan days to make up are shown automatically.', ru: 'Личный учёт дней хайда и нифаса; пропущенные дни Рамадана для возмещения показываются сами.', ar: 'سجل خاص لأيام الحيض والنفاس، وتظهر أيام رمضان الواجب قضاؤها تلقائيًا.', tr: 'Hayız ve nifas günlerinin kişisel kaydı; kaza edilecek Ramazan günleri otomatik gösterilir.' },
  },
  simple: {
    t: { az: 'Sadə rejim', en: 'Simple mode', ru: 'Простой режим', ar: 'الوضع البسيط', tr: 'Sade mod' },
    d: { az: 'Yaşlılar və az görənlər üçün iri yazı və üç iri düymə: növbəti namaz, Quran dinlə, zikr.', en: 'Large text and three big buttons for older and low-vision users: next prayer, listen to the Quran, dhikr.', ru: 'Крупный шрифт и три большие кнопки для пожилых и слабовидящих: следующий намаз, слушать Коран, зикр.', ar: 'خط كبير وثلاثة أزرار كبيرة لكبار السن وضعاف البصر: الصلاة القادمة، والاستماع إلى القرآن، والذكر.', tr: 'Yaşlılar ve az görenler için iri yazı ve üç büyük düğme: sıradaki namaz, Kur’an dinle, zikir.' },
  },
  units: {
    t: { az: 'Şəri ölçü vahidləri', en: 'Sharia units converter', ru: 'Шариатские меры', ar: 'المقادير الشرعية', tr: 'Şer’î ölçü birimleri' },
    d: { az: 'Sa’, mudd, dinar, dirhəm, nisab, mil və fərsəx — metrik ölçülərə, mənbəyi göstərilməklə.', en: 'Sa’, mudd, dinar, dirham, nisab, mile and farsakh converted to metric, with where each value comes from.', ru: 'Са‘, мудд, динар, дирхам, нисаб, миля и фарсах в метрических мерах — с указанием источника.', ar: 'الصاع والمد والدينار والدرهم والنصاب والميل والفرسخ بالمقاييس المترية مع بيان مصدر كل قيمة.', tr: 'Sa’, müd, dinar, dirhem, nisap, mil ve fersah metrik ölçülere, her değerin kaynağıyla.' },
  },
  newborn: {
    t: { az: 'Yeni doğulan körpə: Sünnə planı', en: 'Newborn Sunnah plan', ru: 'Сунна для новорождённого', ar: 'سنن المولود', tr: 'Yeni doğan bebek: Sünnet planı' },
    d: { az: 'Doğum gününü yazın: təhnik, ad seçmək, yeddinci gün əqiqə — dərsdən, mənbələri ilə.', en: 'Enter the birth date: tahnik, choosing a name, the seventh-day aqiqah — from the lesson, with sources.', ru: 'Укажите дату рождения: тахник, выбор имени, акыка на седьмой день — по уроку, с источниками.', ar: 'أدخل تاريخ الولادة: التحنيك واختيار الاسم والعقيقة في اليوم السابع — من الدرس بمصادره.', tr: 'Doğum tarihini yazın: tahnik, isim seçmek, yedinci gün akika — dersten, kaynaklarıyla.' },
  },
  bereavement: {
    t: { az: 'Yaxınınız vəfat edəndə', en: 'When a loved one passes away', ru: 'Когда уходит близкий', ar: 'عند وفاة عزيز', tr: 'Bir yakınınız vefat ettiğinde' },
    d: { az: 'Ailə üçün ilk saat, ilk gün və ilk həftənin addımları — saytın dərslərindən.', en: 'Steps for the family for the first hour, day and week — from the site’s lessons.', ru: 'Шаги для семьи на первый час, день и неделю — по урокам сайта.', ar: 'خطوات الأسرة في الساعة الأولى واليوم الأول والأسبوع الأول — من دروس الموقع.', tr: 'Aile için ilk saat, ilk gün ve ilk haftanın adımları — sitenin derslerinden.' },
  },
  nikahprep: {
    t: { az: 'Nikaha hazırlıq', en: 'Preparing for nikah', ru: 'Подготовка к никяху', ar: 'الاستعداد للنكاح', tr: 'Nikâha hazırlık' },
    d: { az: 'Mehr, vəli, şahidlər, danışılacaq suallar və vəlimə üçün yoxlama siyahısı.', en: 'A checklist for the mahr, wali, witnesses, questions to discuss and the walimah.', ru: 'Чек-лист: махр, опекун, свидетели, вопросы для обсуждения и валима.', ar: 'قائمة تحقق للمهر والولي والشاهدين والأسئلة المطروحة والوليمة.', tr: 'Mehir, velî, şahitler, konuşulacak sorular ve velime için kontrol listesi.' },
  },
  duafriend: {
    t: { az: 'Gizli dua dostu', en: 'Secret dua friend', ru: 'Тайный друг по дуа', ar: 'صديق الدعاء الخفي', tr: 'Gizli dua arkadaşı' },
    d: { az: 'Könüllü cütləşmə: hər gün adı bilinməyən bir müsəlman üçün dua edin — kimlik və mesaj yoxdur.', en: 'Opt-in pairing: pray each day for an unnamed fellow Muslim — no identities, no messages.', ru: 'Добровольная пара: каждый день делайте дуа за неизвестного брата или сестру — без имён и сообщений.', ar: 'اقتران اختياري: ادعُ كل يوم لمسلم لا تعرف اسمه — بلا هويات ولا رسائل.', tr: 'Gönüllü eşleşme: her gün adını bilmediğiniz bir Müslüman için dua edin — kimlik ve mesaj yok.' },
  },
  hajjtracker: {
    t: { az: 'Həcc ailə izləyicisi', en: 'Hajj family tracker', ru: 'Хадж: трекер для семьи', ar: 'متابعة الحج للعائلة', tr: 'Hac aile takipçisi' },
    d: { az: 'Zəvvar Həcc mərhələsini qeyd edir, ailəsi canlı görür — yer heç vaxt soruşulmur.', en: 'The pilgrim marks each Hajj stage and the family follows live — location is never asked for.', ru: 'Паломник отмечает этапы хаджа, а семья видит их вживую — местоположение не запрашивается.', ar: 'يسجّل الحاج كل منسك وتتابعه أسرته مباشرة — دون طلب الموقع أبدًا.', tr: 'Hacı her aşamayı işaretler, ailesi canlı izler — konum asla sorulmaz.' },
  },
  gravevisit: {
    t: { az: 'Qəbir ziyarəti xəritəsi', en: 'Grave visit map', ru: 'Карта посещения могил', ar: 'خريطة زيارة القبور', tr: 'Kabir ziyareti haritası' },
    d: { az: 'Yaxınlarınızın qəbirlərini şəxsi xəritədə işarələyin — məlumat yalnız cihazınızda qalır.', en: 'Mark the graves of your loved ones on a private map — the data stays only on your device.', ru: 'Отмечайте могилы близких на личной карте — данные остаются только на устройстве.', ar: 'علّم قبور أحبّتك على خريطة خاصة — تبقى البيانات على جهازك فقط.', tr: 'Yakınlarınızın kabirlerini kişisel bir haritada işaretleyin — veriler yalnızca cihazınızda kalır.' },
  },
  'kaaba-history': {
    t: { az: 'Kəbənin tarixi', en: 'History of the Kaaba', ru: 'История Каабы', ar: 'تاريخ الكعبة', tr: 'Kâbe’nin tarihi' },
    d: { az: 'Müqəddəs yerlər səhifəsində Kəbənin tikilişi və yenilənmələri altı mərhələdə.', en: 'The building and rebuildings of the Kaaba in six stages, on the Holy Places page.', ru: 'Строительство и перестройки Каабы в шести этапах — на странице святых мест.', ar: 'بناء الكعبة وتجديداتها في ست مراحل في صفحة الأماكن المقدسة.', tr: 'Kutsal Yerler sayfasında Kâbe’nin inşası ve yenilenmeleri altı aşamada.' },
  },
  'road-trip': {
    t: { az: 'Yol səfəri üçün namaz planı', en: 'Road trip prayer plan', ru: 'План намазов в дороге', ar: 'خطة الصلاة في رحلة الطريق', tr: 'Yol yolculuğu namaz planı' },
    d: { az: 'Yola çıxış və çatış vaxtını yazın — yolda hansı namazların düşdüyünü görün.', en: 'Enter your departure and arrival — see which prayers fall during the journey.', ru: 'Укажите время выезда и прибытия — узнайте, какие намазы придутся на дорогу.', ar: 'أدخل وقت الانطلاق والوصول لترى الصلوات التي تقع أثناء الطريق.', tr: 'Çıkış ve varış zamanını yazın — yolda hangi namazların denk geldiğini görün.' },
  },
  onroad: {
    t: { az: '«Yolda» rejimi', en: '“On the road” mode', ru: 'Режим «В дороге»', ar: 'وضع «في الطريق»', tr: '“Yolda” modu' },
    d: { az: 'Maşın və səfər üçün iri düymələr: Quran dinlə, zikr, növbəti namaz və qiblə.', en: 'Big buttons for the car and travel: listen to the Quran, dhikr, the next prayer and the qibla.', ru: 'Крупные кнопки для машины и поездок: слушать Коран, зикр, следующий намаз и кибла.', ar: 'أزرار كبيرة للسيارة والسفر: الاستماع إلى القرآن والذكر والصلاة القادمة والقبلة.', tr: 'Araba ve yolculuk için büyük düğmeler: Kur’an dinle, zikir, sıradaki namaz ve kıble.' },
  },
  focus: {
    t: { az: 'Quranla diqqət seansı', en: 'Focus session with the Quran', ru: 'Сосредоточение с Кораном', ar: 'جلسة تركيز مع القرآن', tr: 'Kur’an ile odak oturumu' },
    d: { az: 'Sakit diqqət sayğacı; hər fasilədə Qurandan bir ayə — tərcümə və qiraətlə.', en: 'A calm focus timer; each break brings one verse of the Quran with translation and recitation.', ru: 'Спокойный таймер сосредоточения; в каждом перерыве — аят Корана с переводом и чтением.', ar: 'مؤقّت تركيز هادئ، وفي كل استراحة آية من القرآن مع الترجمة والتلاوة.', tr: 'Sakin bir odak zamanlayıcısı; her molada Kur’an’dan bir ayet, meal ve tilavetle.' },
  },
  quranmeaning: {
    t: { az: 'Quranda məna ilə axtarış', en: 'Search the Quran by meaning', ru: 'Поиск в Коране по смыслу', ar: 'البحث في القرآن بالمعنى', tr: 'Kur’an’da anlamla arama' },
    d: { az: 'Axtardığınızı öz sözlərinizlə yazın; ayələrin mətni və tərcüməsi saytın Quran mənbəyindəndir.', en: 'Describe what you are looking for in your own words; verse text and translation come from the site’s Quran source.', ru: 'Опишите своими словами, что ищете; текст и перевод аятов — из источника Корана на сайте.', ar: 'صِف ما تبحث عنه بكلماتك، ونصوص الآيات وترجمتها من مصدر القرآن في الموقع.', tr: 'Aradığınızı kendi sözlerinizle yazın; ayet metni ve meali sitenin Kur’an kaynağındandır.' },
  },
  newmuslim: {
    t: { az: 'Yeni müsəlmanın yolu', en: 'New Muslim path', ru: 'Путь нового мусульманина', ar: 'طريق المسلم الجديد', tr: 'Yeni Müslüman yolu' },
    d: { az: 'İlk 40 gün üçün sakit yol: hər addım saytın hazır bələdçisinə aparır.', en: 'A calm path for the first 40 days: each step leads to a guide already on the site.', ru: 'Спокойный путь на первые 40 дней: каждый шаг ведёт к готовому руководству на сайте.', ar: 'طريق هادئ للأيام الأربعين الأولى: كل خطوة تقودك إلى دليل موجود في الموقع.', tr: 'İlk 40 gün için sakin bir yol: her adım sitedeki hazır bir rehbere götürür.' },
  },
  jariyah: {
    t: { az: 'Davamlı sədəqə gündəliyi', en: 'Sadaqah jariyah journal', ru: 'Дневник садака джария', ar: 'سجل الصدقة الجارية', tr: 'Sadaka-i câriye günlüğü' },
    d: { az: 'Bağışlanan Mushaf, əkilən ağac, öyrədilən elm — davamlı sədəqələrinizin gizli qeydi.', en: 'A donated Quran, a tree planted, knowledge taught — a private record of your ongoing charity.', ru: 'Подаренный Коран, посаженное дерево, переданное знание — личный учёт постоянной садаки.', ar: 'مصحف موهوب وشجرة مغروسة وعلم معلَّم — سجل خاص لصدقاتك الجارية.', tr: 'Bağışlanan Mushaf, dikilen ağaç, öğretilen ilim — sadaka-i câriyelerinizin gizli kaydı.' },
  },
  'tafsir-compare': {
    t: { az: 'Təfsirləri müqayisə', en: 'Compare tafsirs', ru: 'Сравнение тафсиров', ar: 'مقارنة التفاسير', tr: 'Tefsirleri karşılaştır' },
    d: { az: 'Quran oxuyucusunda bir ayənin bir neçə təfsirini yan-yana oxuyun.', en: 'Read several tafsirs of one verse side by side in the Quran reader.', ru: 'Читайте несколько тафсиров одного аята рядом в чтении Корана.', ar: 'اقرأ عدة تفاسير لآية واحدة جنبًا إلى جنب في قارئ القرآن.', tr: 'Kur’an okuyucusunda bir ayetin birkaç tefsirini yan yana okuyun.' },
  },
  khatm: {
    t: { az: 'Ümmətin canlı xətmi', en: 'The Ummah’s live khatm', ru: 'Живой хатм уммы', ar: 'ختمة الأمة الحيّة', tr: 'Ümmetin canlı hatmi' },
    d: { az: 'Bir səhifə götürün və dünya üzrə müsəlmanlarla birlikdə Quranı xətm edin.', en: 'Take a page and complete the Quran together with Muslims around the world.', ru: 'Возьмите страницу и завершите Коран вместе с мусульманами всего мира.', ar: 'خذ صفحة واختم القرآن مع المسلمين حول العالم.', tr: 'Bir sayfa alın ve dünyanın dört bir yanındaki Müslümanlarla birlikte Kur’an’ı hatmedin.' },
  },
  'ramadan-wrapped': {
    t: { az: 'Ramazanınızın xülasəsi', en: 'Your Ramadan in review', ru: 'Ваш Рамадан: итоги', ar: 'حصاد رمضانك', tr: 'Ramazanınızın özeti' },
    d: { az: 'Ramazan albomunda oruc, xətm və təravihinizin şəxsi hekayə kartları — yalnız sizin üçün.', en: 'Personal story cards of your fasts, khatm and taraweeh in the Ramadan album — just for you.', ru: 'Личные карточки-истории о вашем посте, хатме и таравихе в альбоме Рамадана — только для вас.', ar: 'بطاقات قصة شخصية لصيامك وختمتك وتراويحك في ألبوم رمضان — لك وحدك.', tr: 'Ramazan albümünde oruç, hatim ve teravihinizin kişisel hikâye kartları — yalnızca sizin için.' },
  },
  'account-security': {
    t: { az: 'Hesab təhlükəsizliyi', en: 'Account security', ru: 'Безопасность аккаунта', ar: 'أمان الحساب', tr: 'Hesap güvenliği' },
    d: { az: 'İki addımlı giriş, yeni giriş xəbərdarlığı və məlumatlarınızın ixracı.', en: 'Two-step sign-in, new sign-in alerts and exporting your data.', ru: 'Двухэтапный вход, оповещения о новых входах и экспорт ваших данных.', ar: 'تسجيل الدخول بخطوتين، وتنبيهات الدخول الجديد، وتصدير بياناتك.', tr: 'İki adımlı giriş, yeni giriş uyarıları ve verilerinizi dışa aktarma.' },
  },
  'accounts-sync': {
    t: { az: 'Hesablar və şifrəli sinxronizasiya', en: 'Accounts and encrypted sync', ru: 'Аккаунты и зашифрованная синхронизация', ar: 'الحسابات والمزامنة المشفّرة', tr: 'Hesaplar ve şifreli eşitleme' },
    d: { az: 'Daxil olun — Quran, zikr və gündəlikləriniz cihazlar arasında şifrəli şəkildə keçsin.', en: 'Sign in so your Quran, dhikr and journals move between devices, end-to-end encrypted.', ru: 'Войдите — Коран, зикр и дневники будут переноситься между устройствами со сквозным шифрованием.', ar: 'سجّل الدخول لتنتقل بيانات القرآن والذكر والمذكرات بين أجهزتك مشفّرة من طرف إلى طرف.', tr: 'Giriş yapın — Kur’an, zikir ve günlükleriniz cihazlar arasında uçtan uca şifreli taşınsın.' },
  },
  'flight-prayer': {
    t: { az: 'Təyyarədə namaz vaxtları', en: 'Prayer times on a flight', ru: 'Время намаза в самолёте', ar: 'مواقيت الصلاة في الطائرة', tr: 'Uçakta namaz vakitleri' },
    d: { az: 'Uçuşu yazın — yol boyu hansı namazın harada və nə vaxt düşdüyünü görün.', en: 'Enter your flight — see when and where each prayer falls along the route.', ru: 'Укажите рейс — узнайте, когда и где в пути наступает каждый намаз.', ar: 'أدخل رحلتك لترى متى وأين يحين وقت كل صلاة على طول الطريق.', tr: 'Uçuşunuzu yazın — yol boyunca her namazın ne zaman ve nerede denk geldiğini görün.' },
  },
  'story-books': {
    t: { az: 'Uşaqlar üçün hekayə kitabları', en: 'Story books for children', ru: 'Книжки-истории для детей', ar: 'كتب قصص للأطفال', tr: 'Çocuklar için hikâye kitapları' },
    d: { az: 'Uşaqlar bölməsindəki peyğəmbər hekayələri indi vərəqlənən şəkilli kitablardır.', en: 'The prophet stories in the Kids section, now as illustrated page-turning books.', ru: 'Истории о пророках из детского раздела — теперь иллюстрированные листаемые книжки.', ar: 'قصص الأنبياء في قسم الأطفال صارت كتبًا مصوّرة تُقلَّب صفحاتها.', tr: 'Çocuklar bölümündeki peygamber hikâyeleri artık sayfaları çevrilen resimli kitaplar.' },
  },
  'prophet-letters': {
    t: { az: 'Peyğəmbərin ﷺ krallara məktubları', en: 'The Prophet’s ﷺ letters to kings', ru: 'Письма Пророка ﷺ правителям', ar: 'رسائل النبي ﷺ إلى الملوك', tr: 'Peygamber’in ﷺ krallara mektupları' },
    d: { az: 'İslam tarixi səhifəsində məktubların xəritəsi və hekayəsi.', en: 'A map and the story of the letters, on the Islamic History page.', ru: 'Карта и история писем — на странице истории ислама.', ar: 'خريطة الرسائل وقصتها في صفحة التاريخ الإسلامي.', tr: 'İslam Tarihi sayfasında mektupların haritası ve hikâyesi.' },
  },
  'iftar-invite': {
    t: { az: 'İftar dəvət kartı', en: 'Iftar invitation card', ru: 'Приглашение на ифтар', ar: 'بطاقة دعوة إلى الإفطار', tr: 'İftar davet kartı' },
    d: { az: 'Ramazan səhifəsində iftar vaxtı ilə gözəl dəvət kartı hazırlayıb paylaşın.', en: 'Make and share a beautiful invitation with the iftar time, on the Ramadan page.', ru: 'Создайте и отправьте красивое приглашение со временем ифтара — на странице Рамадана.', ar: 'صمّم بطاقة دعوة جميلة بموعد الإفطار وشاركها من صفحة رمضان.', tr: 'Ramazan sayfasında iftar vaktiyle güzel bir davet kartı hazırlayıp paylaşın.' },
  },
  'daily-sunnah': {
    t: { az: 'Günün sünnəsi', en: 'Sunnah of the day', ru: 'Сунна дня', ar: 'سنة اليوم', tr: 'Günün sünneti' },
    d: { az: 'Gündəlik ibadət səhifəsində hər gün bir sünnə və onun mənbəyi.', en: 'One Sunnah each day with its source, on the Daily Worship page.', ru: 'Каждый день одна сунна с источником — на странице ежедневного ибадата.', ar: 'سنة واحدة كل يوم مع مصدرها في صفحة العبادات اليومية.', tr: 'Günlük İbadet sayfasında her gün bir sünnet ve kaynağı.' },
  },
  'halal-places': {
    t: { az: 'Halal yerlər', en: 'Halal places', ru: 'Халяльные места', ar: 'أماكن حلال', tr: 'Helal mekânlar' },
    d: { az: 'Halal qida yoxlaması səhifəsində yaxınlıqdakı halal yeməkxana və qəssablar — OpenStreetMap qeydlərindən.', en: 'Nearby halal restaurants and butchers from OpenStreetMap tags, on the halal food check page.', ru: 'Ближайшие халяльные рестораны и мясные лавки по открытым картографическим данным — на странице проверки на халяль.', ar: 'المطاعم والملاحم الحلال القريبة من بيانات الخرائط المفتوحة في صفحة فحص الأطعمة الحلال.', tr: 'Helal gıda kontrolü sayfasında yakındaki helal lokanta ve kasaplar — OpenStreetMap etiketlerinden.' },
  },
  'dua-capsule': {
    t: { az: 'Dua kapsulu', en: 'Dua capsule', ru: 'Капсула дуа', ar: 'كبسولة الدعاء', tr: 'Dua kapsülü' },
    d: { az: 'Dua gündəliyində bu günün dualarını möhürləyib gələcəkdə açın.', en: 'Seal today’s duas in the dua journal and open them in the future.', ru: 'Запечатайте сегодняшние дуа в дневнике и откройте их в будущем.', ar: 'اختم أدعية اليوم في مذكرة الدعاء وافتحها في المستقبل.', tr: 'Dua günlüğünde bugünün dualarını mühürleyin ve gelecekte açın.' },
  },
  'lunar-mansions': {
    t: { az: 'Ay mənzilləri', en: 'The lunar mansions', ru: 'Лунные стоянки', ar: 'منازل القمر', tr: 'Ay menzilleri' },
    d: { az: 'Qiblə səhifəsində Ayın 28 mənzili və onların ərəbcə adları.', en: 'The Moon’s 28 mansions and their Arabic names, on the Qibla page.', ru: '28 стоянок Луны и их арабские названия — на странице киблы.', ar: 'منازل القمر الثماني والعشرون بأسمائها العربية في صفحة القبلة.', tr: 'Kıble sayfasında Ay’ın 28 menzili ve Arapça adları.' },
  },
  'ibn-battuta': {
    t: { az: 'İbn Bəttutənin səyahəti', en: 'Ibn Battuta’s journey', ru: 'Путешествие Ибн Баттуты', ar: 'رحلة ابن بطوطة', tr: 'İbn Battûta’nın yolculuğu' },
    d: { az: 'İslam tarixi səhifəsində böyük səyyahın yolu fırlanan qlobusda, mərhələ-mərhələ.', en: 'The great traveller’s route on a turning globe, stage by stage, on the Islamic History page.', ru: 'Маршрут великого путешественника на вращающемся глобусе, этап за этапом, — на странице истории ислама.', ar: 'مسار الرحّالة الكبير على كرة أرضية دوّارة مرحلة مرحلة في صفحة التاريخ الإسلامي.', tr: 'İslam Tarihi sayfasında büyük seyyahın yolu dönen bir kürede, aşama aşama.' },
  },
  planetarium: {
    t: { az: '«Sizin səmanız indi» planetarisi', en: '“Your sky now” planetarium', ru: 'Планетарий «Ваше небо сейчас»', ar: 'قبة «سماؤك الآن» الفلكية', tr: '“Şu an gökyüzünüz” planetaryumu' },
    d: { az: 'Qiblə səhifəsində ulduzlar, Ay və planetlər sizin yerinizdən, qiblə istiqaməti ilə.', en: 'Stars, the Moon and planets from where you are, with the qibla direction, on the Qibla page.', ru: 'Звёзды, Луна и планеты из вашего места с направлением киблы — на странице киблы.', ar: 'النجوم والقمر والكواكب من موقعك مع اتجاه القبلة في صفحة القبلة.', tr: 'Kıble sayfasında bulunduğunuz yerden yıldızlar, Ay ve gezegenler, kıble yönüyle.' },
  },
  astrolabe: {
    t: { az: 'İşləyən usturlab', en: 'A working astrolabe', ru: 'Действующая астролябия', ar: 'أسطرلاب يعمل', tr: 'Çalışan usturlap' },
    d: { az: 'İslam tarixi səhifəsində öz enliyiniz üçün usturlab — Günəşi çevirib namaz vaxtlarını tapın.', en: 'An astrolabe for your latitude on the Islamic History page — turn the Sun to find prayer times.', ru: 'Астролябия для вашей широты на странице истории ислама — вращайте Солнце и находите время намаза.', ar: 'أسطرلاب لخط عرضك في صفحة التاريخ الإسلامي — أدِر الشمس لتجد مواقيت الصلاة.', tr: 'İslam Tarihi sayfasında enleminize göre usturlap — Güneş’i çevirip namaz vakitlerini bulun.' },
  },
  'ambient-sound': {
    t: { az: 'Sakit fon səsi', en: 'Calm background sound', ru: 'Спокойный фоновый звук', ar: 'صوت خلفية هادئ', tr: 'Sakin arka plan sesi' },
    d: { az: 'Quran, Mushaf və zikr üçün yağış, külək və dəniz səsi — musiqisiz, cihazda yaranır.', en: 'Rain, wind and sea sounds for the Quran, Mushaf and dhikr — no music, generated on your device.', ru: 'Звуки дождя, ветра и моря для Корана, мусхафа и зикра — без музыки, создаются на устройстве.', ar: 'أصوات المطر والريح والبحر للقرآن والمصحف والذكر — بلا موسيقى، تُولَّد على جهازك.', tr: 'Kur’an, Mushaf ve zikir için yağmur, rüzgâr ve deniz sesi — müziksiz, cihazınızda üretilir.' },
  },
  'hadith-memorize': {
    t: { az: 'Hədis əzbərləmə', en: 'Memorise hadith', ru: 'Заучивание хадисов', ar: 'حفظ الأحاديث', tr: 'Hadis ezberleme' },
    d: { az: 'Hədis səhifəsində sevimli hədislərinizi aralıqlı təkrarla əzbərləyin — yalnız bu cihazda.', en: 'Memorise your favourite hadith with spaced repetition on the Hadith page — stored only on this device.', ru: 'Заучивайте любимые хадисы с интервальным повторением на странице хадисов — только на этом устройстве.', ar: 'احفظ أحاديثك المفضلة بالتكرار المتباعد في صفحة الحديث — على هذا الجهاز فقط.', tr: 'Hadis sayfasında sevdiğiniz hadisleri aralıklı tekrarla ezberleyin — yalnızca bu cihazda.' },
  },
  kaffarah: {
    t: { az: 'Fidyə və kəffarə hesablayıcısı', en: 'Fidyah and kaffarah calculator', ru: 'Калькулятор фидьи и каффары', ar: 'حاسبة الفدية والكفارة', tr: 'Fidye ve kefaret hesaplayıcı' },
    d: { az: 'Qəza səhifəsində fidyə və kəffarə hesabı — hökmlər saytın dərsindən, mənbəsi ilə.', en: 'Fidyah and kaffarah worked out on the Qada page — rulings from the site’s lesson, with sources.', ru: 'Расчёт фидьи и каффары на странице возмещения — положения из урока сайта, с источниками.', ar: 'حساب الفدية والكفارة في صفحة القضاء — الأحكام من درس الموقع بمصادرها.', tr: 'Kaza sayfasında fidye ve kefaret hesabı — hükümler sitenin dersinden, kaynağıyla.' },
  },
  'world-cities': {
    t: { az: 'Dünya şəhərlərinin namaz vaxtları', en: 'Prayer times for world cities', ru: 'Время намаза в городах мира', ar: 'مواقيت الصلاة لمدن العالم', tr: 'Dünya şehirlerinin namaz vakitleri' },
    d: { az: 'Məkkə, Mədinə, İstanbul, London və digər şəhərlər üçün aylıq cədvəllər.', en: 'Monthly timetables for Makkah, Madinah, Istanbul, London and other cities.', ru: 'Месячные расписания для Мекки, Медины, Стамбула, Лондона и других городов.', ar: 'جداول شهرية لمكة والمدينة وإسطنبول ولندن ومدن أخرى.', tr: 'Mekke, Medine, İstanbul, Londra ve diğer şehirler için aylık takvimler.' },
  },
  babynames: {
    t: { az: 'Müsəlman uşaq adları', en: 'Muslim baby names', ru: 'Мусульманские имена для детей', ar: 'أسماء المواليد المسلمين', tr: 'Müslüman bebek isimleri' },
    d: { az: 'Yoxlanmış 125 ad: ərəbcə yazılış, məna və Quranda keçdiyi yer.', en: '125 checked names: Arabic spelling, meaning and where the name appears in the Quran.', ru: '125 проверенных имён: арабское написание, значение и где имя встречается в Коране.', ar: '١٢٥ اسمًا موثّقًا: الكتابة العربية والمعنى وموضع ورود الاسم في القرآن.', tr: 'Doğrulanmış 125 isim: Arapça yazılış, anlam ve Kur’an’da geçtiği yer.' },
  },
  scientists: {
    t: { az: 'İslam sivilizasiyasının alimləri', en: 'Scholars of Islamic civilisation', ru: 'Учёные исламской цивилизации', ar: 'علماء الحضارة الإسلامية', tr: 'İslam medeniyetinin bilginleri' },
    d: { az: 'İslam tarixi səhifəsində 14 alim xəritədə, zaman xəttində və canlı nümayişlərlə.', en: '14 scholars on a map and timeline with live demonstrations, on the Islamic History page.', ru: '14 учёных на карте и шкале времени с живыми демонстрациями — на странице истории ислама.', ar: '١٤ عالمًا على الخريطة والخط الزمني مع عروض حيّة في صفحة التاريخ الإسلامي.', tr: 'İslam Tarihi sayfasında 14 bilgin haritada, zaman çizelgesinde ve canlı gösterimlerle.' },
  },
  'rakat-counter': {
    t: { az: 'Rəkət sayğacı', en: 'Rak’ah counter', ru: 'Счётчик ракаатов', ar: 'عدّاد الركعات', tr: 'Rekât sayacı' },
    d: { az: 'Namaz öyrən səhifəsində səcdələri toxunuşla və ya işığın dəyişməsi ilə sayan köməkçi — görüntü saxlanmır.', en: 'A helper on the Learn Prayer page that counts prostrations by touch or camera — no image is stored.', ru: 'Помощник на странице обучения намазу считает земные поклоны касанием или камерой — изображение не сохраняется.', ar: 'مساعد في صفحة تعلّم الصلاة يعدّ السجدات باللمس أو بالكاميرا — دون حفظ أي صورة.', tr: 'Namaz Öğren sayfasında secdeleri dokunuşla veya kamerayla sayan yardımcı — görüntü saklanmaz.' },
  },
  'solar-eclipses': {
    t: { az: 'Günəş və Ay tutulmaları', en: 'Solar and lunar eclipses', ru: 'Солнечные и лунные затмения', ar: 'الكسوف والخسوف', tr: 'Güneş ve Ay tutulmaları' },
    d: { az: 'Təqvim səhifəsində şəhərinizdən görünəcək tutulmalar, vaxtları və küsuf dərsinə keçid.', en: 'Eclipses visible from your city with their times and a link to the eclipse prayer lesson, on the Calendar page.', ru: 'Затмения, видимые из вашего города, их время и ссылка на урок о молитве затмения — на странице календаря.', ar: 'الكسوف والخسوف المرئيان من مدينتك وأوقاتهما مع رابط لدرس صلاة الكسوف في صفحة التقويم.', tr: 'Takvim sayfasında şehrinizden görünecek tutulmalar, saatleri ve küsuf dersine bağlantı.' },
  },
  'star-qibla': {
    t: { az: 'Ulduzlarla qiblə', en: 'Qibla by the stars', ru: 'Кибла по звёздам', ar: 'القبلة بالنجوم', tr: 'Yıldızlarla kıble' },
    d: { az: 'Qiblə səhifəsində bu gecə hansı ulduzun qiblə tərəfdən keçdiyini görün.', en: 'See which star passes over the qibla direction tonight, on the Qibla page.', ru: 'Узнайте, какая звезда сегодня ночью проходит над направлением киблы, — на странице киблы.', ar: 'اعرف أي نجم يمرّ فوق اتجاه القبلة الليلة في صفحة القبلة.', tr: 'Kıble sayfasında bu gece hangi yıldızın kıble yönünden geçtiğini görün.' },
  },
  'quran-animals': {
    t: { az: 'Quranda heyvanlar', en: 'Animals in the Quran', ru: 'Животные в Коране', ar: 'الحيوانات في القرآن', tr: 'Kur’an’da hayvanlar' },
    d: { az: 'Uşaqlar bölməsində Quranda adı keçən 21 heyvan, ayələri və kiçik oyun.', en: '21 animals named in the Quran with their verses and a small game, in the Kids section.', ru: '21 животное, упомянутое в Коране, с аятами и небольшой игрой — в детском разделе.', ar: '٢١ حيوانًا ورد ذكرها في القرآن مع آياتها ولعبة صغيرة في قسم الأطفال.', tr: 'Çocuklar bölümünde Kur’an’da adı geçen 21 hayvan, ayetleri ve küçük bir oyun.' },
  },
  'asr-shadow': {
    t: { az: 'Əsrin kölgəsi', en: 'The shadow of Asr', ru: 'Тень времени асра', ar: 'ظل العصر', tr: 'İkindinin gölgesi' },
    d: { az: 'Namaz səhifəsində çubuğun kölgəsi sizin şəhərinizdə bu gün — əsr vaxtının əyani izahı.', en: 'A stick’s shadow in your city today on the Prayer page — Asr time made visible.', ru: 'Тень шеста в вашем городе сегодня на странице намаза — наглядное объяснение времени асра.', ar: 'ظل العصا في مدينتك اليوم في صفحة الصلاة — شرح مرئي لوقت العصر.', tr: 'Namaz sayfasında bugün şehrinizde çubuğun gölgesi — ikindi vaktinin görsel açıklaması.' },
  },
  'rasd-qibla': {
    t: { az: 'Rəsdül-qiblə', en: 'Sun over the Kaaba', ru: 'Солнце над Каабой', ar: 'رصد القبلة', tr: 'Kıble tespiti günü' },
    d: { az: 'Qiblə səhifəsində Günəşin Kəbənin üstündə olduğu anlara geri sayım — kölgə qibləni göstərir.', en: 'A countdown on the Qibla page to the moments the Sun is over the Kaaba — shadows point to the qibla.', ru: 'Обратный отсчёт на странице киблы до моментов, когда Солнце над Каабой, — тени указывают на киблу.', ar: 'عدّ تنازلي في صفحة القبلة للحظات تعامد الشمس على الكعبة — فتدل الظلال على القبلة.', tr: 'Kıble sayfasında Güneş’in Kâbe’nin üzerinde olduğu anlara geri sayım — gölgeler kıbleyi gösterir.' },
  },
  'fasting-map': {
    t: { az: 'Dünyada oruc müddəti xəritəsi', en: 'World fasting-hours map', ru: 'Карта продолжительности поста', ar: 'خريطة ساعات الصيام في العالم', tr: 'Dünyada oruç süresi haritası' },
    d: { az: 'Ramazan səhifəsində Ramazanın hər günü dünyanın müxtəlif şəhərlərində oruc nə qədər çəkir.', en: 'How long the fast lasts in cities around the world on each day of Ramadan, on the Ramadan page.', ru: 'Сколько длится пост в городах мира в каждый день Рамадана — на странице Рамадана.', ar: 'كم تطول ساعات الصيام في مدن العالم في كل يوم من رمضان، في صفحة رمضان.', tr: 'Ramazan sayfasında Ramazan’ın her günü dünyanın farklı şehirlerinde orucun ne kadar sürdüğü.' },
  },
}
