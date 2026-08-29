// ═══════════════════════════════════════════════════════
// Muslims.cc — Səhifə başına SEO mətnləri
//
// META[key][lang] = { t: <title>, d: <description> }
//
// Hər dil üçün hər səhifə doldurulmayıb; boşluqlar FALLBACK
// zənciri ilə örtülür (bax: pickMeta). Yeni tərcümə əlavə etmək
// üçün sadəcə müvafiq dil açarını yaz — kod dəyişikliyi lazım deyil.
//
// QAYDALAR (Google üçün):
//   • title  ≤ ~60 simvol + " | Muslims.cc" şəkilçisi
//   • description 140-160 simvol, fərqləndirici və hərəkətə çağıran
//   • Hər səhifədə UNİKAL mətn — təkrar = duplicate content
// ═══════════════════════════════════════════════════════

export const SUFFIX = 'Muslims.cc'

// Dil boşluğu olduqda hansı dilə düşmək
const FALLBACK = {
  az: ['az'],
  en: ['en', 'az'],
  ru: ['ru', 'en', 'az'],
  tr: ['tr', 'en', 'az'],
  ar: ['ar', 'en', 'az'],
}

export const META = {
  home: {
    az: { t: 'Quran, Namaz Vaxtları, Hədis və Dua — İslami Platforma',
          d: '5 dildə 31 xidmətli pulsuz İslami platforma. Quran oxu və dinlə, namaz vaxtlarını öyrən, hədis axtar, dua et, zikr say, zəkat hesabla. Reklamsız.' },
    en: { t: 'Quran, Prayer Times, Hadith & Dua — Islamic Platform',
          d: 'Free Islamic platform with 31 tools in 5 languages. Read and listen to the Quran, check prayer times, search hadith, count dhikr, calculate zakat. No ads.' },
    ru: { t: 'Коран, время намаза, хадисы и дуа — исламская платформа',
          d: 'Бесплатная исламская платформа: 31 сервис на 5 языках. Читайте и слушайте Коран, узнавайте время намаза, ищите хадисы, рассчитывайте закят.' },
    tr: { t: 'Kuran, Namaz Vakitleri, Hadis ve Dua — İslami Platform',
          d: '5 dilde 31 hizmetli ücretsiz İslami platform. Kuran oku ve dinle, namaz vakitlerini öğren, hadis ara, dua et, zikir çek, zekât hesapla. Reklamsız.' },
    ar: { t: 'القرآن ومواقيت الصلاة والحديث والدعاء — منصة إسلامية',
          d: 'منصة إسلامية مجانية بها ٣١ خدمة بخمس لغات. اقرأ القرآن واستمع إليه، واعرف مواقيت الصلاة، وابحث في الأحاديث، واحسب الزكاة. بدون إعلانات.' },
  },

  quran: {
    az: { t: 'Quran Oxu — 114 Surə, Tərcümə, Audio və Təfsir',
          d: 'Quranın bütün 114 surəsini onlayn oxu: ərəb mətni, Azərbaycan tərcüməsi, audio qiraət, təfsir, ayə axtarışı və bookmark. Pulsuz və reklamsız.' },
    en: { t: 'Read the Quran Online — 114 Surahs, Translation & Audio',
          d: 'Read all 114 surahs of the Quran online with Arabic text, translation in 5 languages, audio recitation, tafsir, verse search and bookmarks. Free, no ads.' },
    ru: { t: 'Читать Коран онлайн — 114 сур, перевод и аудио',
          d: 'Читайте все 114 сур Корана онлайн: арабский текст, перевод на 5 языков, аудио-чтение, тафсир, поиск по аятам и закладки. Бесплатно и без рекламы.' },
    tr: { t: 'Kuran Oku — 114 Sure, Meal, Dinle ve Tefsir',
          d: 'Kuran-ı Kerim’in 114 suresini online oku: Arapça metin, meal, sesli dinleme, tefsir, ayet arama ve yer imleri. Ücretsiz ve reklamsız.' },
    ar: { t: 'اقرأ القرآن الكريم — ١١٤ سورة مع الترجمة والصوت',
          d: 'اقرأ سور القرآن الكريم كاملة مع النص العربي والترجمة بخمس لغات والتلاوة الصوتية والتفسير والبحث في الآيات والإشارات المرجعية. مجاناً وبدون إعلانات.' },
  },

  prayer: {
    az: { t: 'Namaz Vaxtları — Bakı və 10+ Şəhər, Əzan Bildirişi',
          d: 'Bakı, Gəncə, Sumqayıt və 10+ şəhər üçün dəqiq namaz vaxtları: Sübh, Günorta, Əsr, Məğrib, İşa. Əzan bildirişi, geri sayım və həftəlik statistika.' },
    en: { t: 'Prayer Times — Accurate Salah Times & Adhan Alerts',
          d: 'Accurate daily prayer times for 10+ cities: Fajr, Dhuhr, Asr, Maghrib and Isha. Get adhan notifications, a live countdown to the next salah and weekly stats.' },
    ru: { t: 'Время намаза — точное расписание и уведомления азана',
          d: 'Точное время намаза для 10+ городов: Фаджр, Зухр, Аср, Магриб, Иша. Уведомления азана, обратный отсчёт до следующего намаза и недельная статистика.' },
    tr: { t: 'Namaz Vakitleri — Şehirlere Göre Ezan Saatleri',
          d: '10+ şehir için doğru namaz vakitleri: İmsak, Öğle, İkindi, Akşam, Yatsı. Ezan bildirimi, sonraki vakte geri sayım ve haftalık namaz istatistikleri.' },
    ar: { t: 'مواقيت الصلاة — أوقات دقيقة وتنبيهات الأذان',
          d: 'مواقيت الصلاة الدقيقة لأكثر من ١٠ مدن: الفجر والظهر والعصر والمغرب والعشاء. تنبيهات الأذان والعد التنازلي للصلاة القادمة وإحصاءات أسبوعية.' },
  },

  hadith: {
    az: { t: 'Hədis Toplusu — 500+ Səhih Hədis, 16 Kateqoriya',
          d: '500-dən çox səhih hədisi mövzu üzrə oxu: iman, namaz, əxlaq, ailə, elm və daha çox. Axtarış, favoritlər və paylaşma ilə. Buxari və Müslim mənbələri.' },
    en: { t: 'Hadith Collection — 500+ Authentic Hadith by Topic',
          d: 'Browse over 500 authentic hadith across 16 topics: faith, prayer, character, family, knowledge and more. Full-text search, favourites and one-tap sharing.' },
    ru: { t: 'Сборник хадисов — 500+ достоверных хадисов по темам',
          d: 'Более 500 достоверных хадисов по 16 темам: вера, намаз, нравственность, семья, знание и другое. Поиск по тексту, избранное и быстрый обмен.' },
    tr: { t: 'Hadis Koleksiyonu — 500+ Sahih Hadis, 16 Kategori',
          d: '500’den fazla sahih hadisi konularına göre oku: iman, namaz, ahlak, aile, ilim ve daha fazlası. Arama, favoriler ve paylaşma özellikleriyle.' },
    ar: { t: 'مجموعة الأحاديث — أكثر من ٥٠٠ حديث صحيح',
          d: 'تصفح أكثر من ٥٠٠ حديث صحيح في ١٦ موضوعاً: الإيمان والصلاة والأخلاق والأسرة والعلم وغيرها، مع البحث الكامل والمفضلة والمشاركة.' },
  },

  duas: {
    az: { t: 'Dualar və Əzkar — 100+ Gündəlik Dua',
          d: 'Gündəlik həyat üçün 100+ dua və zikr: səhər-axşam əzkarı, yemək, yuxu, səfər, çətinlik duaları. Ərəb mətni, transkripsiya və tərcümə ilə.' },
    en: { t: 'Duas & Adhkar — 100+ Daily Supplications',
          d: 'Over 100 duas and adhkar for daily life: morning and evening remembrance, food, sleep, travel and hardship. With Arabic text, transliteration and translation.' },
    ru: { t: 'Дуа и азкары — более 100 ежедневных молитв',
          d: 'Более 100 дуа и азкаров на каждый день: утренние и вечерние поминания, еда, сон, путешествие, трудности. С арабским текстом и переводом.' },
    tr: { t: 'Dualar ve Ezkâr — 100+ Günlük Dua',
          d: 'Günlük hayat için 100+ dua ve zikir: sabah-akşam ezkârı, yemek, uyku, yolculuk ve sıkıntı duaları. Arapça metin, okunuşu ve meali ile.' },
    ar: { t: 'الأدعية والأذكار — أكثر من ١٠٠ دعاء يومي',
          d: 'أكثر من ١٠٠ دعاء وذكر للحياة اليومية: أذكار الصباح والمساء، والطعام، والنوم، والسفر، والكرب، مع النص العربي والترجمة.' },
  },

  dhikr: {
    az: { t: 'Zikr Sayğacı — Rəqəmsal Təsbih',
          d: 'Onlayn rəqəmsal təsbih: SubhanAllah, Alhamdulillah, Allahu Əkbər zikrlərini say. Vibrasiya, hədəf təyini və sessiya tarixçəsi ilə.' },
    en: { t: 'Dhikr Counter — Digital Tasbih Online',
          d: 'A digital tasbih counter for SubhanAllah, Alhamdulillah and Allahu Akbar. Set a target, feel haptic feedback on each count and track your session history.' },
    ru: { t: 'Счётчик зикра — электронные чётки онлайн',
          d: 'Электронные чётки для зикра: СубханАллах, Альхамдулиллях, Аллаху Акбар. Установка цели, вибрация при счёте и история сессий.' },
    tr: { t: 'Zikir Sayacı — Dijital Tesbih',
          d: 'Online dijital tesbih: Sübhanallah, Elhamdülillah, Allahu Ekber zikirlerini çek. Hedef belirleme, titreşim ve oturum geçmişi ile.' },
    ar: { t: 'عداد الذكر — سبحة إلكترونية',
          d: 'سبحة إلكترونية للذكر: سبحان الله، والحمد لله، والله أكبر. حدد هدفك، واشعر بالاهتزاز مع كل عدّة، وتابع سجل جلساتك.' },
  },

  names: {
    az: { t: 'Allahın 99 Adı — Əsmaül Hüsna, Məna və Tələffüz',
          d: 'Allahın 99 gözəl adı (Əsmaül Hüsna): ərəb yazılışı, oxunuşu, Azərbaycan dilində mənası və izahı. Axtarış və əzbərləmə rejimi ilə.' },
    en: { t: '99 Names of Allah — Asmaul Husna with Meanings',
          d: 'All 99 beautiful names of Allah (Asmaul Husna) with Arabic script, transliteration, meaning and explanation. Includes search and memorisation mode.' },
    ru: { t: '99 имён Аллаха — Асма уль-Хусна со значениями',
          d: 'Все 99 прекрасных имён Аллаха (Асма уль-Хусна): арабское написание, транскрипция, значение и пояснение. С поиском и режимом заучивания.' },
    tr: { t: 'Allah’ın 99 İsmi — Esmaül Hüsna ve Anlamları',
          d: 'Allah’ın 99 güzel ismi (Esmaül Hüsna): Arapça yazılışı, okunuşu, anlamı ve açıklaması. Arama ve ezberleme modu ile.' },
    ar: { t: 'أسماء الله الحسنى — ٩٩ اسماً مع المعاني',
          d: 'أسماء الله الحسنى التسعة والتسعون مع الرسم العربي والنطق والمعنى والشرح، مع خاصية البحث ووضع الحفظ.' },
  },

  zakat: {
    az: { t: 'Zəkat Kalkulyatoru — Nisab Hesabı, 8 Valyuta',
          d: 'Zəkatını dəqiq hesabla: nağd pul, bank qalığı, qızıl, gümüş və ticarət malı. Nisab həddi avtomatik yoxlanılır, 8 valyuta dəstəklənir.' },
    en: { t: 'Zakat Calculator — Nisab Check in 8 Currencies',
          d: 'Calculate your zakat accurately from cash, bank savings, gold, silver and trade goods. The nisab threshold is checked automatically across 8 currencies.' },
    ru: { t: 'Калькулятор закята — расчёт нисаба в 8 валютах',
          d: 'Точно рассчитайте закят с наличных, банковских сбережений, золота, серебра и товаров. Порог нисаба проверяется автоматически в 8 валютах.' },
    tr: { t: 'Zekât Hesaplama — Nisap Hesabı, 8 Para Birimi',
          d: 'Zekâtını doğru hesapla: nakit, banka birikimi, altın, gümüş ve ticaret malı. Nisap sınırı otomatik kontrol edilir, 8 para birimi desteklenir.' },
    ar: { t: 'حاسبة الزكاة — حساب النصاب بثماني عملات',
          d: 'احسب زكاتك بدقة من النقد والمدخرات البنكية والذهب والفضة وعروض التجارة. يُحتسب حد النصاب تلقائياً بثماني عملات.' },
  },

  qibla: {
    az: { t: 'Qiblə İstiqaməti — GPS və Kompasla Kəbə Yönü',
          d: 'Olduğun yerdən Kəbəyə dəqiq qiblə istiqamətini tap. GPS və telefon kompası ilə işləyir, açı dərəcəsi və Məkkəyə məsafə göstərilir.' },
    en: { t: 'Qibla Direction — Find the Kaaba with GPS Compass',
          d: 'Find the exact qibla direction to the Kaaba from wherever you are. Works with GPS and your phone compass, showing the bearing and distance to Mecca.' },
    ru: { t: 'Направление киблы — компас на Каабу по GPS',
          d: 'Определите точное направление киблы на Каабу из любой точки. Работает с GPS и компасом телефона, показывает угол и расстояние до Мекки.' },
    tr: { t: 'Kıble Yönü — GPS ve Pusula ile Kâbe Yönü',
          d: 'Bulunduğun yerden Kâbe’ye tam kıble yönünü bul. GPS ve telefon pusulası ile çalışır, açı derecesi ve Mekke’ye uzaklık gösterilir.' },
    ar: { t: 'اتجاه القبلة — بوصلة الكعبة عبر GPS',
          d: 'حدد اتجاه القبلة إلى الكعبة بدقة من أي مكان. يعمل بنظام تحديد المواقع وبوصلة الهاتف، ويعرض زاوية الاتجاه والمسافة إلى مكة.' },
  },

  calendar: {
    az: { t: 'İslami Təqvim — Hicri Tarix və Bayram Günləri',
          d: 'Bugünkü hicri tarixi öyrən, miladi təqvimlə müqayisə et. Ramazan, Qurban bayramı, Aşura və digər mübarək günlər üçün xatırlatma qur.' },
    en: { t: 'Islamic Calendar — Hijri Date & Holy Days',
          d: 'See today’s Hijri date alongside the Gregorian calendar. Track Ramadan, Eid al-Fitr, Eid al-Adha, Ashura and other blessed days with reminders.' },
    ru: { t: 'Исламский календарь — дата по хиджре и праздники',
          d: 'Узнайте сегодняшнюю дату по хиджре рядом с григорианским календарём. Отслеживайте Рамадан, Ураза-байрам, Курбан-байрам и Ашуру с напоминаниями.' },
    tr: { t: 'İslami Takvim — Hicri Tarih ve Mübarek Günler',
          d: 'Bugünün hicri tarihini öğren, miladi takvimle karşılaştır. Ramazan, Ramazan Bayramı, Kurban Bayramı ve Aşure için hatırlatma kur.' },
    ar: { t: 'التقويم الهجري — التاريخ الهجري والأيام المباركة',
          d: 'اعرف تاريخ اليوم بالهجري إلى جانب التقويم الميلادي، وتابع رمضان وعيد الفطر وعيد الأضحى وعاشوراء وغيرها مع التذكيرات.' },
  },

  prayerguide: {
    az: { t: 'Namaz Necə Qılınır — Addım-Addım Namaz Öyrən',
          d: 'Namazı sıfırdan öyrən: dəstəmaz, qiyam, rüku, səcdə və təşəhhüd addım-addım. Hər rükət üçün ərəb duaları, oxunuşu və tərcüməsi ilə.' },
    en: { t: 'How to Pray Salah — Step-by-Step Prayer Guide',
          d: 'Learn to pray salah from scratch: wudu, qiyam, ruku, sujud and tashahhud explained step by step, with the Arabic duas, transliteration and translation.' },
    ru: { t: 'Как совершать намаз — пошаговое руководство',
          d: 'Научитесь совершать намаз с нуля: омовение, кыям, руку, суджуд и ташаххуд шаг за шагом, с арабскими дуа, транскрипцией и переводом.' },
    tr: { t: 'Namaz Nasıl Kılınır — Adım Adım Namaz Rehberi',
          d: 'Namazı sıfırdan öğren: abdest, kıyam, rükû, secde ve tahiyyat adım adım. Her rekât için Arapça dualar, okunuşu ve meali ile.' },
    ar: { t: 'كيفية أداء الصلاة — دليل خطوة بخطوة',
          d: 'تعلّم الصلاة من البداية: الوضوء والقيام والركوع والسجود والتشهد خطوة بخطوة، مع الأدعية بالعربية والنطق والترجمة.' },
  },

  hajjguide: {
    az: { t: 'Həcc və Ümrə Rehberi — Addım-Addım Menasik',
          d: 'Həccin 10 və ümrənin 4 addımını sıra ilə öyrən: ihram, təvaf, səy, Ərəfat, Müzdəlifə, qurban. Hər addımın duası və izahı ilə.' },
    en: { t: 'Hajj & Umrah Guide — Step-by-Step Rituals',
          d: 'Follow the 10 steps of Hajj and 4 steps of Umrah in order: ihram, tawaf, sa’i, Arafat, Muzdalifah and sacrifice, each with its dua and explanation.' },
    ru: { t: 'Руководство по хаджу и умре — обряды по шагам',
          d: 'Пройдите 10 шагов хаджа и 4 шага умры по порядку: ихрам, таваф, саи, Арафат, Муздалифа, жертвоприношение — с дуа и пояснениями.' },
    tr: { t: 'Hac ve Umre Rehberi — Adım Adım Menasik',
          d: 'Haccın 10, umrenin 4 adımını sırayla öğren: ihram, tavaf, sa’y, Arafat, Müzdelife, kurban. Her adımın duası ve açıklaması ile.' },
    ar: { t: 'دليل الحج والعمرة — المناسك خطوة بخطوة',
          d: 'اتبع خطوات الحج العشر والعمرة الأربع بالترتيب: الإحرام والطواف والسعي وعرفة ومزدلفة والهدي، مع دعاء كل خطوة وشرحها.' },
  },

  mosques: {
    az: { t: 'Yaxınlıqdakı Məscidlər — GPS ilə Məscid Tap',
          d: 'Olduğun yerdən 5 km radiusda yaxınlıqdakı məscidləri tap. Hər məscid üçün məsafə, ünvan və xəritədə marşrut linki göstərilir.' },
    en: { t: 'Mosques Near Me — Find a Masjid with GPS',
          d: 'Find mosques near you within a 5 km radius. Each masjid shows its distance, address and a direct map link so you can get there for the next salah.' },
    ru: { t: 'Мечети рядом — найти мечеть по GPS',
          d: 'Найдите ближайшие мечети в радиусе 5 км от вас. Для каждой мечети показаны расстояние, адрес и ссылка на маршрут в картах.' },
    tr: { t: 'Yakınımdaki Camiler — GPS ile Cami Bul',
          d: 'Bulunduğun yerden 5 km yarıçapında yakındaki camileri bul. Her cami için mesafe, adres ve haritada yol tarifi bağlantısı gösterilir.' },
    ar: { t: 'المساجد القريبة — ابحث عن مسجد عبر GPS',
          d: 'اعثر على المساجد القريبة منك ضمن نطاق ٥ كيلومترات. يعرض كل مسجد المسافة والعنوان ورابطاً مباشراً للخريطة.' },
  },

  hifz: {
    az: { t: 'Hifz Tracker — Quran Əzbərləmə İzləyicisi',
          d: 'Quran hifzini planla və izlə: əzbərlədiyin surələri qeyd et, təkrar cədvəli qur, gündəlik irəliləyişini və seriya günlərini gör.' },
    en: { t: 'Hifz Tracker — Quran Memorisation Progress',
          d: 'Plan and track your Quran hifz: mark memorised surahs, set a revision schedule and watch your daily progress and streak build up over time.' },
    ru: { t: 'Трекер хифза — заучивание Корана',
          d: 'Планируйте и отслеживайте хифз Корана: отмечайте выученные суры, стройте график повторения и следите за ежедневным прогрессом.' },
    tr: { t: 'Hıfz Takibi — Kuran Ezberleme Takipçisi',
          d: 'Kuran hıfzını planla ve takip et: ezberlediğin sureleri işaretle, tekrar programı kur, günlük ilerlemeni ve seri günlerini gör.' },
  },

  quiz: {
    az: { t: 'İslami Kviz — Quran, Hədis və Din Bilgi Testi',
          d: 'İslami biliyini sına: Quran, hədis, Allahın adları, peyğəmbərlər və İslam tarixi üzrə suallar. Səviyyələr, xal və nəticə paylaşımı ilə.' },
    en: { t: 'Islamic Quiz — Test Your Knowledge of Islam',
          d: 'Test your Islamic knowledge with questions on the Quran, hadith, the names of Allah, the prophets and Islamic history. Levels, scoring and sharing.' },
    ru: { t: 'Исламская викторина — проверьте свои знания',
          d: 'Проверьте знания об исламе: вопросы по Корану, хадисам, именам Аллаха, пророкам и истории ислама. Уровни, очки и обмен результатом.' },
    tr: { t: 'İslami Quiz — Kuran, Hadis ve Din Bilgi Testi',
          d: 'İslami bilgini sına: Kuran, hadis, Allah’ın isimleri, peygamberler ve İslam tarihi soruları. Seviyeler, puan ve sonuç paylaşımı ile.' },
  },

  qurangame: {
    az: { t: 'Quran Oyunu — Ayəni Tamamla, Surəni Tap',
          d: 'Əyləncəli Quran oyunu ilə ayələri möhkəmləndir: yarımçıq ayəni tamamla, surəni tanı, ardıcıllığı düz. Uşaqlar və böyüklər üçün.' },
    en: { t: 'Quran Game — Complete the Verse, Guess the Surah',
          d: 'Strengthen your Quran recall with a playful game: complete the missing verse, identify the surah and put ayahs in order. For children and adults.' },
  },

  glossary: {
    az: { t: 'İslami Lüğət — Dini Terminlərin İzahı',
          d: 'İslami terminləri sadə dildə öyrən: fiqh, sünnə, halal, haram, təqva, sədəqə və 30+ anlayışın izahı, mənşəyi və istifadəsi.' },
    en: { t: 'Islamic Glossary — Key Terms Explained',
          d: 'Understand Islamic terminology in plain language: fiqh, sunnah, halal, haram, taqwa, sadaqah and 30+ more terms with origins and usage explained.' },
    ru: { t: 'Исламский словарь — объяснение терминов',
          d: 'Разберитесь в исламской терминологии простым языком: фикх, сунна, халяль, харам, таква, садака и ещё 30+ понятий с пояснениями.' },
    tr: { t: 'İslami Sözlük — Dini Terimlerin Açıklaması',
          d: 'İslami terimleri sade bir dille öğren: fıkıh, sünnet, helal, haram, takva, sadaka ve 30+ kavramın açıklaması ve kullanımı.' },
  },

  history: {
    az: { t: 'İslam Tarixi — 25 Peyğəmbər və Tarixi Hadisələr',
          d: 'İslam tarixini zaman xətti üzrə oxu: 25 peyğəmbərin həyatı, hicrət, Bədr və Uhud döyüşləri, Məkkənin fəthi və 15 dönüş nöqtəsi.' },
    en: { t: 'Islamic History — 25 Prophets & Key Events',
          d: 'Explore Islamic history on a timeline: the lives of the 25 prophets, the Hijrah, the battles of Badr and Uhud, the conquest of Mecca and more.' },
    ru: { t: 'История ислама — 25 пророков и ключевые события',
          d: 'Изучайте историю ислама по временной шкале: жизнь 25 пророков, хиджра, битвы при Бадре и Ухуде, покорение Мекки и другие события.' },
    tr: { t: 'İslam Tarihi — 25 Peygamber ve Tarihi Olaylar',
          d: 'İslam tarihini zaman çizelgesinde oku: 25 peygamberin hayatı, hicret, Bedir ve Uhud savaşları, Mekke’nin fethi ve 15 dönüm noktası.' },
  },

  sahaba: {
    az: { t: 'Səhabələr — Peyğəmbərin Yoldaşlarının Həyatı',
          d: 'Peyğəmbərimizin səhabələrini tanı: Əbu Bəkr, Ömər, Osman, Əli və digərlərinin həyatı, İslama xidməti və ibrətli hadisələr.' },
    en: { t: 'The Sahaba — Lives of the Prophet’s Companions',
          d: 'Meet the companions of the Prophet ﷺ: the lives of Abu Bakr, Umar, Uthman, Ali and others, their service to Islam and the lessons they left.' },
    ru: { t: 'Сахабы — жизнь сподвижников Пророка',
          d: 'Познакомьтесь со сподвижниками Пророка ﷺ: жизнь Абу Бакра, Умара, Усмана, Али и других, их служение исламу и назидательные истории.' },
    tr: { t: 'Sahabeler — Peygamberimizin Arkadaşlarının Hayatı',
          d: 'Peygamberimizin sahabelerini tanı: Ebû Bekir, Ömer, Osman, Ali ve diğerlerinin hayatı, İslam’a hizmetleri ve ibretli olaylar.' },
  },

  holyplaces: {
    az: { t: 'Müqəddəs Yerlər — Kəbə, Məscidi-Nəbəvi və Digərləri',
          d: 'İslamın müqəddəs məkanlarını tanı: Məscidül-Həram, Məscidi-Nəbəvi, Məscidül-Əqsa, Ərəfat, Hira mağarası və 10 müqəddəs yer.' },
    en: { t: 'Holy Places of Islam — Kaaba, Masjid an-Nabawi & More',
          d: 'Discover Islam’s holiest sites: Masjid al-Haram, Masjid an-Nabawi, Masjid al-Aqsa, Arafat, the cave of Hira and 10 sacred places with maps.' },
  },

  dailytracker: {
    az: { t: 'Gündəlik İbadət İzləyicisi — 10 Əməli İzlə',
          d: '5 vaxt namaz, Quran oxunuşu, zikr, sədəqə və digər gündəlik ibadətlərini qeyd et. Seriya günləri və həftəlik statistika ilə davamlılıq qur.' },
    en: { t: 'Daily Worship Tracker — Build Consistent Ibadah',
          d: 'Log your five daily prayers, Quran reading, dhikr, sadaqah and other acts of worship. Streaks and weekly stats help you stay consistent.' },
  },

  charity: {
    az: { t: 'Sədəqə Gündəliyi — Xeyir Əməllərini Qeyd Et',
          d: 'Verdiyin sədəqə və xeyir əməlləri qeyd et, aylıq və illik cəmi gör. Zəkat öhdəliyindən ayrıca könüllü sədəqəni izlə.' },
    en: { t: 'Sadaqah Journal — Track Your Charitable Giving',
          d: 'Record the charity you give and see monthly and yearly totals. Keep voluntary sadaqah tracked separately from your obligatory zakat.' },
  },

  duajournal: {
    az: { t: 'Dua Gündəliyi — Şəxsi Dualarını Yaz və İzlə',
          d: 'Şəxsi dualarını yaz, tarixlə qeyd et və qəbul olunanları işarələ. Allahın sənə cavab verdiyi anları bir yerdə saxla.' },
    en: { t: 'Dua Journal — Write and Track Your Personal Duas',
          d: 'Write down your personal duas, date them and mark the ones that have been answered. Keep a record of how your prayers were met over time.' },
  },

  quotes: {
    az: { t: 'İslami Sitat Generatoru — Ayə və Hədis Şəkilləri',
          d: 'Ayə və hədislərdən gözəl paylaşım şəkilləri hazırla. Fon, şrift və rəngi seç, yüklə və sosial şəbəkələrdə paylaş.' },
    en: { t: 'Islamic Quote Maker — Verse & Hadith Images',
          d: 'Turn Quran verses and hadith into beautiful shareable images. Pick a background, font and colour, then download and share on social media.' },
  },

  analytics: {
    az: { t: 'Quran Oxu Statistikası — İrəliləyişini Gör',
          d: 'Quran oxu vərdişini rəqəmlərlə gör: oxunan surələr, sərf olunan vaxt, həftəlik qrafik və ən aktiv günlərin.' },
    en: { t: 'Quran Reading Stats — See Your Progress',
          d: 'See your Quran reading habit in numbers: surahs completed, time spent, a weekly chart and the days you read most consistently.' },
  },

  videos: {
    az: { t: 'İslami Videolar — Dərslər, Xütbələr və Qiraət',
          d: 'Seçilmiş İslami videoları izlə: dini dərslər, cümə xütbələri, Quran qiraəti və moizələr. Mövzu üzrə kateqoriyalara bölünüb.' },
    en: { t: 'Islamic Videos — Lectures, Khutbahs & Recitation',
          d: 'Watch a curated library of Islamic videos: lessons, Friday khutbahs, Quran recitation and reminders, organised by topic.' },
    ru: { t: 'Исламские видео — уроки, хутбы и чтение Корана',
          d: 'Смотрите подборку исламских видео: уроки, пятничные хутбы, чтение Корана и напоминания, упорядоченные по темам.' },
    tr: { t: 'İslami Videolar — Dersler, Hutbeler ve Kıraat',
          d: 'Seçilmiş İslami videoları izle: dini dersler, cuma hutbeleri, Kuran kıraati ve sohbetler. Konularına göre kategorilere ayrılmış.' },
  },

  books: {
    az: { t: 'İslami Kitablar — Pulsuz Onlayn Kitabxana',
          d: 'İslami kitabları onlayn oxu və yüklə: təfsir, hədis, fiqh, siyər və əxlaq kitabları. Kateqoriya üzrə axtarış ilə, pulsuz.' },
    en: { t: 'Islamic Books — Free Online Library',
          d: 'Read and download Islamic books online: tafsir, hadith, fiqh, seerah and works on character. Browse by category, completely free.' },
    ru: { t: 'Исламские книги — бесплатная онлайн-библиотека',
          d: 'Читайте и скачивайте исламские книги: тафсир, хадисы, фикх, сира и книги о нравственности. Поиск по категориям, бесплатно.' },
    tr: { t: 'İslami Kitaplar — Ücretsiz Online Kütüphane',
          d: 'İslami kitapları online oku ve indir: tefsir, hadis, fıkıh, siyer ve ahlak kitapları. Kategoriye göre arama ile, ücretsiz.' },
  },

  aichat: {
    az: { t: 'MuslimAI — İslami Suallarına Cavab Al',
          d: 'İslamla bağlı suallarını MuslimAI-a ver: namaz, oruc, halal-haram, Quran və hədis mövzularında izahlı cavablar. 5 dildə.' },
    en: { t: 'MuslimAI — Ask Your Questions About Islam',
          d: 'Ask MuslimAI your questions about Islam: prayer, fasting, halal and haram, the Quran and hadith, answered with explanation in 5 languages.' },
  },

  kids: {
    az: { t: 'Uşaqlar üçün İslam — Əyləncəli Dini Təhsil',
          d: 'Uşaqlara İslamı sevdirərək öyrət: sadə dua və surələr, peyğəmbər hekayələri, əxlaq dərsləri və əyləncəli oyunlar.' },
    en: { t: 'Islam for Kids — Fun Islamic Learning',
          d: 'Teach children about Islam the joyful way: simple duas and surahs, stories of the prophets, lessons in good character and playful games.' },
  },

  about: {
    az: { t: 'Haqqımızda — Muslims.cc Layihəsi',
          d: 'Muslims.cc — pulsuz, reklamsız və açıq İslami rəqəmsal platforma. Missiyamız, xidmətlərimiz və bizimlə əlaqə haqqında.' },
    en: { t: 'About — The Muslims.cc Project',
          d: 'Muslims.cc is a free, ad-free and open Islamic digital platform. Learn about our mission, the services we offer and how to get in touch.' },
  },
}

/**
 * Verilmiş səhifə + dil üçün ən uyğun meta-nı seç.
 * Dil boşluğu FALLBACK zənciri ilə örtülür.
 */
export function pickMeta(key, lang = 'az') {
  const entry = META[key] || META.home
  for (const l of (FALLBACK[lang] || FALLBACK.az)) {
    if (entry[l]) return entry[l]
  }
  return entry.az || entry.en || META.home.az
}

/** Tam <title> — səhifə adı + brend şəkilçisi. */
export function titleFor(key, lang = 'az') {
  const { t } = pickMeta(key, lang)
  return key === 'home' ? `${SUFFIX} — ${t}` : `${t} | ${SUFFIX}`
}

/** Meta description. */
export function descFor(key, lang = 'az') {
  return pickMeta(key, lang).d
}

// ── noscript blokunun interfeys mətnləri ────────────
// Prerender hər səhifəyə öz noscript məzmununu yazır; bunlar onun
// dəyişməyən hissəsidir.
export const UI = {
  az: { nav: 'Bütün bölmələr', js: 'Saytdan tam istifadə üçün JavaScript-i aktivləşdirin.' },
  en: { nav: 'All sections',   js: 'Enable JavaScript to use the full site.' },
  ru: { nav: 'Все разделы',    js: 'Включите JavaScript, чтобы пользоваться сайтом полностью.' },
  tr: { nav: 'Tüm bölümler',   js: 'Siteyi tam kullanmak için JavaScript’i etkinleştirin.' },
  ar: { nav: 'جميع الأقسام',   js: 'فعّل جافاسكريبت لاستخدام الموقع بالكامل.' },
}

/** Qısa ad — menyu və breadcrumb üçün (başlığın ilk hissəsi). */
export function shortName(key, lang = 'az') {
  return pickMeta(key, lang).t.split(' — ')[0].trim()
}
