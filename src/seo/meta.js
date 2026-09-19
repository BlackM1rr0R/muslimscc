// ═══════════════════════════════════════════════════════
// Qaraçuxur Məscidi — Səhifə başına SEO mətnləri
//
// META[key][lang] = { t: <title>, d: <description> }
//
// Hər dil üçün hər səhifə doldurulmayıb; boşluqlar FALLBACK
// zənciri ilə örtülür (bax: pickMeta). Açarı ümumiyyətlə olmayan
// səhifə ana səhifənin mətnini alır — ona görə noindex səhifələrin
// (admin, adminlogin, notfound) da burada öz girişi var. Yeni tərcümə əlavə etmək
// üçün sadəcə müvafiq dil açarını yaz — kod dəyişikliyi lazım deyil.
//
// QAYDALAR (Google üçün):
//   • title  ≤ ~60 simvol + " | <brend adı>" şəkilçisi (dilə görə)
//   • description 140-160 simvol, fərqləndirici və hərəkətə çağıran
//   • Hər səhifədə UNİKAL mətn — təkrar = duplicate content
//
// Brend adı src/config/mosque.js-dən gəlir. İmport yolunda .js
// uzantısı vacibdir — prerender bu faylı adi Node ilə yükləyir.
// ═══════════════════════════════════════════════════════

import { BRAND, brandName } from '../config/mosque.js'

// Uyğunluq üçün saxlanılıb — dilə görə ad üçün brandName(lang) istifadə et
export const SUFFIX = BRAND.name.az

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
    az: { t: 'Namaz Vaxtları, Camaat Namazı və Elanlar',
          d: 'Qaraçuxur Məscidinin saytı (Qaraçuxur, Bakı): gündəlik namaz vaxtları, camaat namazı və elanlar. Quran oxu və dinlə, hədis, dua, zikr, zəkat — 5 dildə.' },
    en: { t: 'Prayer & Congregation Times, Announcements',
          d: 'The website of Garachukhur Mosque in Baku: daily prayer times, congregational prayers and announcements, plus the Quran, hadith, duas and dhikr in 5 languages.' },
    ru: { t: 'Время намаза, коллективные молитвы и объявления',
          d: 'Сайт мечети Карачухур (Баку): ежедневное время намаза, коллективные молитвы и объявления, а также Коран, хадисы, дуа и зикр на 5 языках.' },
    tr: { t: 'Namaz Vakitleri, Cemaat Namazı ve Duyurular',
          d: 'Karaçuhur Camii’nin web sitesi (Bakü): günlük namaz vakitleri, cemaat namazı ve duyurular. Kuran oku ve dinle, hadis, dua, zikir, zekât — 5 dilde.' },
    ar: { t: 'مواقيت الصلاة وصلاة الجماعة والإعلانات',
          d: 'موقع مسجد قاراچوخور في باكو: مواقيت الصلاة اليومية وصلاة الجماعة والإعلانات، إلى جانب القرآن الكريم والحديث والأدعية والأذكار بخمس لغات.' },
  },

  // ── Məscid bölmələri ──
  // Yalnız bu gün səhifədə HƏQİQƏTƏN olanı vəd edirik. Namaz vaxtları
  // məscidin öz koordinatına görə hesablanır; camaat vaxtları MOSQUE.jamaat-dan
  // gəlir (azandan +N dəqiqə — sahibin təsdiqi ilə; admin dəyişə bilər), ona
  // görə təsvirlərdə dəqiqə rəqəmi yazılmır. Ünvan, imam, telefon və ianə
  // rekvizitləri hələ doldurulmayıb (src/config/mosque.js) — vəd edilmir.
  mosque: {
    az: { t: 'Məscid Haqqında — Qaraçuxur, Bakı',
          d: 'Qaraçuxur Məscidi haqqında səhifə (Qaraçuxur, Bakı): məscidin yeri, bugünkü namaz vaxtları, məscidin elanları və ianə bölməsinə keçidlər bir yerdə.' },
    en: { t: 'About the Mosque — Garachukhur, Baku',
          d: 'About Garachukhur Mosque in Garachukhur, Baku: where it is, plus quick links to today’s prayer times, the mosque’s announcements and how to support it.' },
    ru: { t: 'О мечети — Карачухур, Баку',
          d: 'О мечети Карачухур (Карачухур, Баку): где она находится, а также быстрые ссылки на сегодняшнее время намаза, объявления мечети и помощь мечети.' },
    tr: { t: 'Cami Hakkında — Karaçuhur, Bakü',
          d: 'Karaçuhur Camii hakkında (Karaçuhur, Bakü): caminin yeri ile bugünkü namaz vakitleri, cami duyuruları ve camiye destek sayfalarına hızlı bağlantılar.' },
    ar: { t: 'عن المسجد — قاراچوخور، باكو',
          d: 'صفحة عن مسجد قاراچوخور في قاراچوخور بباكو: موقع المسجد وروابط سريعة إلى مواقيت الصلاة لهذا اليوم وإعلانات المسجد وطريقة دعم المسجد بالتبرع.' },
  },

  jamaat: {
    az: { t: 'Namaz və Camaat Vaxtları — Qaraçuxur',
          d: 'Qaraçuxur Məscidində bugünkü azan və camaat namazı vaxtları: Sübh, Zöhr, Əsr, Məğrib, İşa, növbəti camaata geri sayım, cümə namazı vaxtı və fəzilətləri.' },
    en: { t: 'Prayer & Congregation Times — Garachukhur',
          d: 'Today’s adhan and congregational (jamaat) prayer times at Garachukhur Mosque in Baku, a countdown to the next jamaat, the Friday prayer time and its virtues.' },
    ru: { t: 'Время намаза и джамаата — Карачухур',
          d: 'Время азана и коллективной молитвы (джамаата) в мечети Карачухур на сегодня: отсчёт до следующего джамаата, время пятничного намаза и его достоинства.' },
    tr: { t: 'Namaz ve Cemaat Vakitleri — Karaçuhur',
          d: 'Karaçuhur Camii’nde bugünkü ezan ve cemaat namazı vakitleri: sonraki cemaate geri sayım, cuma namazı saati ve cemaatle kılınan namazın faziletleri.' },
    ar: { t: 'مواقيت الصلاة والجماعة — قاراچوخور',
          d: 'مواقيت الأذان وإقامة صلاة الجماعة اليوم في مسجد قاراچوخور بباكو، مع عدّ تنازلي للجماعة القادمة وموعد صلاة الجمعة وفضل صلاة الجماعة.' },
  },

  announcements: {
    az: { t: 'Elanlar — Məscidin Xəbər və Bildirişləri',
          d: 'Qaraçuxur Məscidinin elan lövhəsi: məscidin dərc etdiyi xəbər və elanlar burada toplanır. Yeni elanı qaçırmamaq üçün bildirişləri aktivləşdirin.' },
    en: { t: 'Announcements — News from the Mosque',
          d: 'The notice board of Garachukhur Mosque in Baku: news and announcements published by the mosque appear here. Turn on notifications so you never miss one.' },
    ru: { t: 'Объявления — новости мечети',
          d: 'Доска объявлений мечети Карачухур в Баку: здесь собраны новости и объявления, которые публикует мечеть. Включите уведомления, чтобы не пропустить новое.' },
    tr: { t: 'Duyurular — Caminin Haberleri',
          d: 'Karaçuhur Camii’nin duyuru panosu: caminin yayımladığı haber ve duyurular burada toplanır. Yeni duyuruları kaçırmamak için bildirimleri açın.' },
    ar: { t: 'الإعلانات — أخبار المسجد',
          d: 'لوحة إعلانات مسجد قاراچوخور في باكو: تُجمع هنا الأخبار والإعلانات التي ينشرها المسجد. فعّل الإشعارات حتى لا يفوتك أي إعلان جديد.' },
  },

  donate: {
    az: { t: 'Məscidə İanə — Məscidə Dəstək Olun',
          d: 'Qaraçuxur Məscidinə dəstək olmaq istəyənlər üçün: məscid tikməyin fəziləti haqqında hədis (Buxari 450), zəkat kalkulyatoru və şəxsi sədəqə gündəliyi.' },
    en: { t: 'Donate — Support the Mosque',
          d: 'For those who wish to support Garachukhur Mosque in Baku: the hadith on the reward for building a mosque, a zakat calculator and a personal sadaqah journal.' },
    ru: { t: 'Пожертвование — поддержите мечеть',
          d: 'Для тех, кто хочет поддержать мечеть Карачухур в Баку: хадис о награде за строительство мечети, калькулятор закята и личный дневник садаки.' },
    tr: { t: 'Bağış — Camiye Destek Olun',
          d: 'Karaçuhur Camii’ne destek olmak isteyenler için: cami yapmanın fazileti hakkında hadis, zekât hesaplama aracı ve kişisel sadaka günlüğü bir arada.' },
    ar: { t: 'التبرع — ادعم المسجد',
          d: 'لمن يرغب في دعم مسجد قاراچوخور في باكو: حديث في فضل بناء المساجد، وحاسبة الزكاة، وسجل شخصي للصدقات، وكل ذلك في صفحة واحدة.' },
  },

  quran: {
    az: { t: 'Quran Oxu — 114 Surə, Tərcümə, Audio və Təfsir',
          d: 'Quranın bütün 114 surəsini onlayn oxu: ərəb mətni, Azərbaycan tərcüməsi, audio qiraət, təfsir, ayə axtarışı və bookmark. Pulsuz və reklamsız.' },
    en: { t: 'Read the Quran — 114 Surahs, Translation & Audio',
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
          d: 'Bakı, Gəncə, Şəki, Lənkəran və daha 16 şəhər üçün dəqiq namaz vaxtları: Sübh, Günorta, Əsr, Məğrib, İşa. Əzan bildirişi, geri sayım və həftəlik statistika.' },
    en: { t: 'Prayer Times — Salah Times & Adhan Alerts',
          d: 'Accurate daily prayer times for 10+ cities: Fajr, Dhuhr, Asr, Maghrib and Isha. Get adhan notifications, a live countdown to the next salah and weekly stats.' },
    ru: { t: 'Время намаза — расписание и уведомления азана',
          d: 'Точное время намаза для 10+ городов: Фаджр, Зухр, Аср, Магриб, Иша. Уведомления азана, обратный отсчёт до следующего намаза и недельная статистика.' },
    tr: { t: 'Namaz Vakitleri — Şehirlere Göre Ezan Saatleri',
          d: '10+ şehir için doğru namaz vakitleri: İmsak, Öğle, İkindi, Akşam, Yatsı. Ezan bildirimi, sonraki vakte geri sayım ve haftalık namaz istatistikleri.' },
    ar: { t: 'مواقيت الصلاة — أوقات دقيقة وتنبيهات الأذان',
          d: 'مواقيت الصلاة الدقيقة لأكثر من ١٠ مدن: الفجر والظهر والعصر والمغرب والعشاء. تنبيهات الأذان والعد التنازلي للصلاة القادمة وإحصاءات أسبوعية.' },
  },

  // Say: təkrarsız 1394 hədis (Quran ayələri və "Məşhur" sözlər sayılmır) →
  // "1350+" — data/siteStats.js-dəki HADITH_COUNT ilə eyni. 15 mövzu.
  // "Səhih" yazılmır — toplu yalnız səhih hədislərdən ibarət deyil.
  hadith: {
    az: { t: 'Hədis Toplusu — 1350+ Hədis, 15 Mövzu',
          d: '1350-dən çox hədisi mövzu üzrə oxu: iman, namaz, əxlaq, ailə, elm və daha çox. Axtarış, favoritlər və paylaşma ilə. Buxari və Müslim mənbələri.' },
    en: { t: 'Hadith Collection — 1350+ Hadith by Topic',
          d: 'Browse over 1350 hadith across 15 topics: faith, prayer, character, family, knowledge and more. Full-text search, favourites and one-tap sharing.' },
    ru: { t: 'Сборник хадисов — 1350+ хадисов по темам',
          d: 'Более 1350 хадисов по 15 темам: вера, намаз, нравственность, семья, знание и другое. Поиск по тексту, избранное и быстрый обмен.' },
    tr: { t: 'Hadis Koleksiyonu — 1350+ Hadis, 15 Konu',
          d: '1350’den fazla hadisi konularına göre oku: iman, namaz, ahlak, aile, ilim ve daha fazlası. Arama, favoriler ve paylaşma özellikleriyle.' },
    ar: { t: 'مجموعة الأحاديث — أكثر من ١٣٥٠ حديثًا',
          d: 'تصفح أكثر من ١٣٥٠ حديثًا في ١٥ موضوعاً: الإيمان والصلاة والأخلاق والأسرة والعلم وغيرها، مع البحث الكامل والمفضلة والمشاركة.' },
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
    az: { t: 'Həcc və Ümrə Bələdçisi — Addım-Addım Mənasik',
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
          d: 'Olduğun yerdən 10 km radiusda yaxınlıqdakı məscidləri tap. Hər məscid üçün məsafə, ünvan və xəritədə marşrut linki göstərilir.' },
    en: { t: 'Mosques Near Me — Find a Masjid with GPS',
          d: 'Find mosques near you within a 10 km radius. Each masjid shows its distance, address and a direct map link so you can get there for the next salah.' },
    ru: { t: 'Мечети рядом — найти мечеть по GPS',
          d: 'Найдите ближайшие мечети в радиусе 10 км от вас. Для каждой мечети показаны расстояние, адрес и ссылка на маршрут в картах.' },
    tr: { t: 'Yakınımdaki Camiler — GPS ile Cami Bul',
          d: 'Bulunduğun yerden 10 km yarıçapında yakındaki camileri bul. Her cami için mesafe, adres ve haritada yol tarifi bağlantısı gösterilir.' },
    ar: { t: 'المساجد القريبة — ابحث عن مسجد عبر GPS',
          d: 'اعثر على المساجد القريبة منك ضمن نطاق ١٠ كيلومترات. يعرض كل مسجد المسافة والعنوان ورابطاً مباشراً للخريطة.' },
  },

  hifz: {
    az: { t: 'Hifz İzləyicisi — Quranı Əzbərləmə Planı',
          d: 'Quran hifzini planla və izlə: əzbərlədiyin surələri qeyd et, təkrar cədvəli qur, gündəlik irəliləyişini və seriya günlərini gör.' },
    en: { t: 'Hifz Tracker — Quran Memorisation Progress',
          d: 'Plan and track your Quran hifz: mark memorised surahs, set a revision schedule and watch your daily progress and streak build up over time.' },
    ru: { t: 'Трекер хифза — заучивание Корана',
          d: 'Планируйте и отслеживайте хифз Корана: отмечайте выученные суры, стройте график повторения и следите за ежедневным прогрессом.' },
    tr: { t: 'Hıfz Takibi — Kuran Ezberleme Takipçisi',
          d: 'Kuran hıfzını planla ve takip et: ezberlediğin sureleri işaretle, tekrar programı kur, günlük ilerlemeni ve seri günlerini gör.' },
    ar: { t: 'متابعة الحفظ — تتبّع حفظ القرآن الكريم',
          d: 'خطّط لحفظ القرآن وتابعه: علّم السور التي حفظتها، وضع جدولاً للمراجعة، وشاهد تقدّمك اليومي وأيام المواظبة المتتالية.' },
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
    ar: { t: 'اختبار إسلامي — اختبر معلوماتك عن الإسلام',
          d: 'اختبر معلوماتك الإسلامية بأسئلة عن القرآن والحديث وأسماء الله الحسنى والأنبياء والتاريخ الإسلامي، مع مستويات ونقاط ومشاركة النتيجة.' },
  },

  qurangame: {
    az: { t: 'Quran Oyunu — Ayəni Tamamla, Surəni Tap',
          d: 'Əyləncəli Quran oyunu ilə ayələri möhkəmləndir: yarımçıq ayəni tamamla, surəni tanı, ardıcıllığı düz. Uşaqlar və böyüklər üçün.' },
    en: { t: 'Quran Game — Complete the Verse, Guess the Surah',
          d: 'Strengthen your Quran recall with a playful game: complete the missing verse, identify the surah and put ayahs in order. For children and adults.' },
    ru: { t: 'Игра по Корану — дополни аят, угадай суру',
          d: 'Закрепляйте знание Корана в увлекательной игре: дополните пропущенный аят, узнайте суру и расставьте аяты по порядку. Для детей и взрослых.' },
    tr: { t: 'Kuran Oyunu — Ayeti Tamamla, Sureyi Bul',
          d: 'Eğlenceli Kuran oyunuyla ayetleri pekiştir: eksik ayeti tamamla, sureyi tanı ve ayetleri sıraya koy. Çocuklar ve yetişkinler için.' },
    ar: { t: 'لعبة القرآن — أكمل الآية وخمّن السورة',
          d: 'رسّخ حفظك للقرآن بلعبة ممتعة: أكمل الآية الناقصة، وتعرّف على السورة، ورتّب الآيات بالترتيب الصحيح. للأطفال والكبار.' },
  },

  glossary: {
    az: { t: 'İslami Lüğət — Dini Terminlərin İzahı',
          d: 'İslami terminləri sadə dildə öyrən: fiqh, sünnə, halal, haram, təqva, sədəqə və 100-dən çox anlayışın izahı, mənşəyi və istifadəsi.' },
    en: { t: 'Islamic Glossary — Key Terms Explained',
          d: 'Understand Islamic terminology in plain language: fiqh, sunnah, halal, haram, taqwa, sadaqah and 100+ terms with origins and usage explained.' },
    ru: { t: 'Исламский словарь — объяснение терминов',
          d: 'Разберитесь в исламской терминологии простым языком: фикх, сунна, халяль, харам, таква, садака и более 100 понятий с пояснениями.' },
    tr: { t: 'İslami Sözlük — Dini Terimlerin Açıklaması',
          d: 'İslami terimleri sade bir dille öğren: fıkıh, sünnet, helal, haram, takva, sadaka ve 100’den fazla kavramın açıklaması ve kullanımı.' },
    ar: { t: 'معجم المصطلحات الإسلامية — شرح المفاهيم',
          d: 'تعرّف على المصطلحات الإسلامية بلغة بسيطة: الفقه والسنة والحلال والحرام والتقوى والصدقة وأكثر من ١٠٠ مصطلح مع شرح أصلها واستعمالها.' },
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
    ar: { t: 'التاريخ الإسلامي — ٢٥ نبياً وأحداث بارزة',
          d: 'تصفّح التاريخ الإسلامي على خط زمني: حياة الأنبياء الخمسة والعشرين، والهجرة، وغزوتا بدر وأحد، وفتح مكة وغيرها من الأحداث.' },
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
    ar: { t: 'الصحابة — سير أصحاب النبي ﷺ',
          d: 'تعرّف على صحابة النبي ﷺ: حياة أبي بكر وعمر وعثمان وعلي وغيرهم، وخدمتهم للإسلام والدروس المستفادة من سيرهم.' },
  },

  holyplaces: {
    az: { t: 'Müqəddəs Yerlər — Kəbə, Məscidi-Nəbəvi və s.',
          d: 'İslamın müqəddəs məkanlarını tanı: Məscidül-Həram, Məscidi-Nəbəvi, Məscidül-Əqsa, Ərəfat, Hira mağarası və 10 müqəddəs yer.' },
    en: { t: 'Holy Places — Kaaba, Masjid an-Nabawi & More',
          d: 'Discover Islam’s holiest sites: Masjid al-Haram, Masjid an-Nabawi, Masjid al-Aqsa, Arafat, the cave of Hira and 10 sacred places with maps.' },
    ru: { t: 'Святые места — Кааба, Мечеть Пророка и другие',
          d: 'Познакомьтесь со святынями ислама: Масджид аль-Харам, Мечеть Пророка, Масджид аль-Акса, Арафат, пещера Хира — всего 10 святых мест с картами.' },
    tr: { t: 'Kutsal Yerler — Kâbe, Mescid-i Nebevî ve Dahası',
          d: 'İslam’ın kutsal mekânlarını tanı: Mescid-i Haram, Mescid-i Nebevî, Mescid-i Aksâ, Arafat, Hira mağarası — haritalarıyla toplam 10 kutsal yer.' },
    ar: { t: 'الأماكن المقدسة — الكعبة والمسجد النبوي وغيرها',
          d: 'تعرّف على أقدس الأماكن في الإسلام: المسجد الحرام والمسجد النبوي والمسجد الأقصى وعرفات وغار حراء، في ١٠ أماكن مقدسة مع الخرائط.' },
  },

  dailytracker: {
    az: { t: 'Gündəlik İbadət İzləyicisi — 10 Əməli İzlə',
          d: '5 vaxt namaz, Quran oxunuşu, zikr, sədəqə və digər gündəlik ibadətlərini qeyd et. Seriya günləri və həftəlik statistika ilə davamlılıq qur.' },
    en: { t: 'Daily Worship Tracker — Build Consistent Ibadah',
          d: 'Log your five daily prayers, Quran reading, dhikr, sadaqah and other acts of worship. Streaks and weekly stats help you stay consistent.' },
    ru: { t: 'Трекер ибадата — ежедневные поклонения',
          d: 'Отмечайте пять ежедневных намазов, чтение Корана, зикр, садаку и другие поклонения. Серии дней и недельная статистика помогают быть постоянным.' },
    tr: { t: 'Günlük İbadet Takibi — 10 Ameli Takip Et',
          d: 'Beş vakit namaz, Kuran okuma, zikir, sadaka ve diğer günlük ibadetlerini işaretle. Seri günleri ve haftalık istatistiklerle istikrar kazan.' },
    ar: { t: 'متابعة العبادات اليومية — ١٠ أعمال',
          d: 'سجّل صلواتك الخمس وتلاوة القرآن والذكر والصدقة وغيرها من العبادات اليومية، مع سلاسل الأيام والإحصاءات الأسبوعية لتبقى مواظباً.' },
  },

  charity: {
    az: { t: 'Sədəqə Gündəliyi — Xeyir Əməllərini Qeyd Et',
          d: 'Verdiyin sədəqə və xeyir əməlləri qeyd et, aylıq və illik cəmi gör. Zəkat öhdəliyindən ayrıca könüllü sədəqəni izlə.' },
    en: { t: 'Sadaqah Journal — Track Your Charitable Giving',
          d: 'Record the charity you give and see monthly and yearly totals. Keep voluntary sadaqah tracked separately from your obligatory zakat.' },
    ru: { t: 'Дневник садаки — учёт благих дел',
          d: 'Записывайте садаку и добрые дела, смотрите итоги за месяц и год. Добровольная садака учитывается отдельно от обязательного закята.' },
    tr: { t: 'Sadaka Günlüğü — Hayırlarını Kaydet',
          d: 'Verdiğin sadaka ve hayırları kaydet, aylık ve yıllık toplamları gör. Gönüllü sadakayı farz olan zekâttan ayrı takip et.' },
    ar: { t: 'سجل الصدقات — دوّن أعمال الخير',
          d: 'سجّل ما تتصدق به من صدقات وأعمال خير، واطّلع على المجموع الشهري والسنوي، وتابع صدقة التطوع بمعزل عن الزكاة الواجبة.' },
  },

  duajournal: {
    az: { t: 'Dua Gündəliyi — Şəxsi Dualarını Yaz və İzlə',
          d: 'Şəxsi dualarını yaz, tarixlə qeyd et və qəbul olunanları işarələ. Allahın sənə cavab verdiyi anları bir yerdə saxla.' },
    en: { t: 'Dua Journal — Write and Track Your Personal Duas',
          d: 'Write down your personal duas, date them and mark the ones that have been answered. Keep a record of how your prayers were met over time.' },
    ru: { t: 'Дневник дуа — записывайте свои мольбы',
          d: 'Записывайте личные дуа, отмечайте дату и те, что были приняты. Храните в одном месте историю того, как ваши мольбы получали ответ.' },
    tr: { t: 'Dua Günlüğü — Dualarını Yaz ve Takip Et',
          d: 'Kişisel dualarını yaz, tarihle kaydet ve kabul olanları işaretle. Allah’ın dualarına karşılık verdiği anları tek yerde sakla.' },
    ar: { t: 'مذكرة الدعاء — اكتب أدعيتك وتابعها',
          d: 'اكتب أدعيتك الشخصية وسجّل تاريخها وعلّم على ما استُجيب منها، واحفظ في مكان واحد لحظات استجابة الله لدعائك.' },
  },

  quotes: {
    az: { t: 'İslami Sitat Generatoru — Ayə və Hədis Şəkilləri',
          d: 'Ayə və hədislərdən gözəl paylaşım şəkilləri hazırla. Fon, şrift və rəngi seç, yüklə və sosial şəbəkələrdə paylaş.' },
    en: { t: 'Islamic Quote Maker — Verse & Hadith Images',
          d: 'Turn Quran verses and hadith into beautiful shareable images. Pick a background, font and colour, then download and share on social media.' },
    ru: { t: 'Генератор цитат — картинки с аятами и хадисами',
          d: 'Превращайте аяты Корана и хадисы в красивые картинки: выберите фон, шрифт и цвет, затем скачайте и поделитесь в соцсетях.' },
    tr: { t: 'İslami Alıntı Oluşturucu — Ayet ve Hadis Görselleri',
          d: 'Ayet ve hadislerden paylaşılabilir güzel görseller hazırla. Arka planı, yazı tipini ve rengi seç; indir ve sosyal medyada paylaş.' },
    ar: { t: 'صانع الاقتباسات — صور الآيات والأحاديث',
          d: 'حوّل آيات القرآن والأحاديث إلى صور جميلة قابلة للمشاركة: اختر الخلفية والخط واللون، ثم حمّلها وشاركها على وسائل التواصل.' },
  },

  analytics: {
    az: { t: 'Quran Oxu Statistikası — İrəliləyişini Gör',
          d: 'Quran oxu vərdişini rəqəmlərlə gör: oxunan surələr, sərf olunan vaxt, həftəlik qrafik və ən aktiv günlərin.' },
    en: { t: 'Quran Reading Stats — See Your Progress',
          d: 'See your Quran reading habit in numbers: surahs completed, time spent, a weekly chart and the days you read most consistently.' },
    ru: { t: 'Статистика чтения Корана — ваш прогресс',
          d: 'Ваша привычка читать Коран в цифрах: прочитанные суры, затраченное время, недельный график и дни, когда вы читаете чаще всего.' },
    tr: { t: 'Kuran Okuma İstatistikleri — İlerlemeni Gör',
          d: 'Kuran okuma alışkanlığını rakamlarla gör: okunan sureler, harcanan süre, haftalık grafik ve en düzenli okuduğun günler.' },
    ar: { t: 'إحصائيات قراءة القرآن — تابع تقدّمك',
          d: 'شاهد عادتك في قراءة القرآن بالأرقام: السور المقروءة والوقت المستغرق ورسم بياني أسبوعي والأيام الأكثر مواظبة على القراءة.' },
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
    ar: { t: 'فيديوهات إسلامية — دروس وخطب وتلاوات',
          d: 'شاهد مكتبة مختارة من الفيديوهات الإسلامية: دروس دينية وخطب الجمعة وتلاوات القرآن ومواعظ، مرتبة حسب الموضوع.' },
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
    ar: { t: 'كتب إسلامية — مكتبة مجانية على الإنترنت',
          d: 'اقرأ الكتب الإسلامية وحمّلها: التفسير والحديث والفقه والسيرة والأخلاق، مع التصفح حسب التصنيف، وكل ذلك مجاناً.' },
  },

  aichat: {
    az: { t: `${BRAND.aiName.az} — İslami Suallarına Cavab Al`,
          d: 'İslamla bağlı suallarını AI köməkçiyə ver: namaz, oruc, halal-haram, Quran və hədis mövzularında izahlı cavablar. Fətva deyil — hökmlər üçün imama müraciət edin.' },
    en: { t: `${BRAND.aiName.en} — Ask Your Questions About Islam`,
          d: 'Ask the AI assistant about Islam: prayer, fasting, halal and haram, the Quran and hadith, explained in 5 languages. Not a fatwa — consult the imam for rulings.' },
    ru: { t: `${BRAND.aiName.ru} — ответы на вопросы об исламе`,
          d: 'Задайте ИИ-помощнику вопросы об исламе: намаз, пост, халяль и харам, Коран и хадисы — с пояснениями на 5 языках. Это не фетва — по решениям обращайтесь к имаму.' },
    tr: { t: `${BRAND.aiName.tr} — İslam Hakkında Sorular`,
          d: 'İslam hakkındaki sorularını yapay zekâ asistanına sor: namaz, oruç, helal-haram, Kuran ve hadis üzerine açıklamalar. Fetva değildir — hükümler için imama danışın.' },
    ar: { t: `${BRAND.aiName.ar} — أجوبة عن أسئلتك في الإسلام`,
          d: 'اسأل المساعد الذكي عن الإسلام: الصلاة والصيام والحلال والحرام والقرآن والحديث، مع الشرح بخمس لغات. ليست فتوى — للأحكام يُرجى الرجوع إلى الإمام.' },
  },

  kids: {
    az: { t: 'Uşaqlar üçün İslam — Əyləncəli Dini Təhsil',
          d: 'Uşaqlara İslamı sevdirərək öyrət: sadə dua və surələr, peyğəmbər hekayələri, əxlaq dərsləri və əyləncəli oyunlar.' },
    en: { t: 'Islam for Kids — Fun Islamic Learning',
          d: 'Teach children about Islam the joyful way: simple duas and surahs, stories of the prophets, lessons in good character and playful games.' },
    ru: { t: 'Ислам для детей — увлекательное обучение',
          d: 'Учите детей исламу с радостью: простые дуа и суры, истории пророков, уроки хорошего нрава и весёлые игры.' },
    tr: { t: 'Çocuklar İçin İslam — Eğlenceli Din Eğitimi',
          d: 'Çocuklara İslam’ı sevdirerek öğret: kolay dualar ve sureler, peygamber kıssaları, ahlak dersleri ve eğlenceli oyunlar.' },
    ar: { t: 'الإسلام للأطفال — تعلّم ممتع',
          d: 'علّم الأطفال الإسلام بطريقة محببة: أدعية وسور قصيرة، وقصص الأنبياء، ودروس في الأخلاق، وألعاب ممتعة.' },
  },

  about: {
    az: { t: 'Haqqımızda — Məscid və Sayt Haqqında',
          d: 'Qaraçuxur Məscidinin saytı haqqında: namaz vaxtları, camaat namazı, elanlar və İslami bilik bir yerdə. Saytda nələr var və necə istifadə olunur.' },
    en: { t: 'About — The Mosque and This Website',
          d: 'About the website of Garachukhur Mosque in Baku: prayer times, congregational prayers, announcements and Islamic knowledge gathered in one place.' },
    ru: { t: 'О нас — о мечети и сайте',
          d: 'О сайте мечети Карачухур в Баку: время намаза, коллективные молитвы, объявления и исламские знания в одном месте.' },
    tr: { t: 'Hakkımızda — Cami ve Site Hakkında',
          d: 'Karaçuhur Camii’nin web sitesi hakkında: namaz vakitleri, cemaat namazı, duyurular ve İslami bilgi bir arada.' },
    ar: { t: 'من نحن — عن المسجد والموقع',
          d: 'عن موقع مسجد قاراچوخور في باكو: مواقيت الصلاة وصلاة الجماعة والإعلانات والمعرفة الإسلامية في مكان واحد.' },
  },

  // ── İdarəetmə (noindex) ──
  // Axtarışa düşmür (routes.js → noindex, robots.txt → Disallow), amma
  // brauzer tabında və prerender edilmiş HTML-də ana səhifənin başlığı
  // görünməsin deyə öz adları var.
  adminlogin: {
    az: { t: 'Admin girişi',
          d: 'Saytın idarəetmə bölməsinə giriş — yalnız səlahiyyətli istifadəçilər üçün.' },
    en: { t: 'Admin sign-in',
          d: 'Sign in to the site administration area — for authorised users only.' },
    ru: { t: 'Вход для администратора',
          d: 'Вход в раздел управления сайтом — только для уполномоченных пользователей.' },
    tr: { t: 'Yönetici girişi',
          d: 'Site yönetim bölümüne giriş — yalnızca yetkili kullanıcılar için.' },
    ar: { t: 'دخول المشرف',
          d: 'الدخول إلى قسم إدارة الموقع — للمستخدمين المخوّلين فقط.' },
  },

  admin: {
    az: { t: 'Admin paneli',
          d: 'Saytın idarəetmə paneli — yalnız səlahiyyətli istifadəçilər üçün.' },
    en: { t: 'Admin panel',
          d: 'The site administration panel — for authorised users only.' },
    ru: { t: 'Панель администратора',
          d: 'Панель управления сайтом — только для уполномоченных пользователей.' },
    tr: { t: 'Yönetim paneli',
          d: 'Site yönetim paneli — yalnızca yetkili kullanıcılar için.' },
    ar: { t: 'لوحة الإدارة',
          d: 'لوحة إدارة الموقع — للمستخدمين المخوّلين فقط.' },
  },

  // Tanınmayan ünvan (404) — PAGES-də yoxdur, ona görə sitemap-a düşmür;
  // Seo.jsx bu səhifəni noindex edir, prerender isə ondan dist/404.html
  // yazır (server naməlum ünvana HTTP 404 ilə bu faylı qaytarır)
  notfound: {
    az: { t: 'Səhifə tapılmadı',
          d: 'Axtardığınız səhifə yoxdur və ya ünvanı dəyişib. Ana səhifəyə qayıdın, camaat vaxtlarına baxın və ya saytda axtarın.' },
    en: { t: 'Page not found',
          d: 'The page you are looking for does not exist or has moved. Go back to the home page, check the congregation times or search the site.' },
    ru: { t: 'Страница не найдена',
          d: 'Такой страницы нет, или её адрес изменился. Вернитесь на главную, посмотрите время коллективных молитв или воспользуйтесь поиском.' },
    tr: { t: 'Sayfa bulunamadı',
          d: 'Aradığınız sayfa yok ya da adresi değişti. Ana sayfaya dönün, cemaat vakitlerine bakın veya sitede arayın.' },
    ar: { t: 'الصفحة غير موجودة',
          d: 'الصفحة التي تبحث عنها غير موجودة أو تغيّر عنوانها. عُد إلى الصفحة الرئيسية، أو اطّلع على أوقات صلاة الجماعة، أو ابحث في الموقع.' },
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
  const brand = brandName(lang)
  return key === 'home' ? `${brand} — ${t}` : `${t} | ${brand}`
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
