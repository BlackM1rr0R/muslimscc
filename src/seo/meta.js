// ═══════════════════════════════════════════════════════
// Muslims.cc — Səhifə başına SEO mətnləri
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
//   • DİL QAYDASI: hər mətn TAMAMİLƏ öz dilində — az mətnində türkcə
//     söz ("ve", "ile", "için") və türkcə apostrof şəkilçisi ("Allah'ın")
//     olmur; tr mətnində "ə" hərfi olmur.
//
// Brend adı src/config/brand.js-dən gəlir. İmport yolunda .js
// uzantısı vacibdir — prerender bu faylı adi Node ilə yükləyir.
//
// Tarixçə: 2026-09 — 2026-10 arası sayt bir məscidin saytı idi; məscidə
// aid səhifə (/mosque) silindi (server onu /about-a 301 ilə yönləndirir),
// camaat/elanlar/ianə səhifələri isə ümumi platforma mətnləri ilə qaldı.
// ═══════════════════════════════════════════════════════

import { BRAND, brandName } from '../config/brand.js'

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
    az: { t: 'Quran, Namaz Vaxtları, Hədis və Dua — İslami Platforma',
          d: '5 dildə 30-dan çox bölməli pulsuz İslami platforma: Quran oxu və dinlə, namaz vaxtları, 1250+ hədis, dua, zikr sayğacı, zəkat və qiblə. Reklamsız.' },
    en: { t: 'Quran, Prayer Times, Hadith & Dua — Islamic Platform',
          d: 'A free Islamic platform with 30+ sections in 5 languages: read and listen to the Quran, prayer times, 1250+ hadith, duas, dhikr, zakat and qibla. No ads.' },
    ru: { t: 'Коран, время намаза, хадисы и дуа — исламская платформа',
          d: 'Бесплатная исламская платформа: более 30 разделов на 5 языках. Читайте и слушайте Коран, время намаза, 1250+ хадисов, дуа, зикр, закят и кибла.' },
    tr: { t: 'Kuran, Namaz Vakitleri, Hadis ve Dua — İslami Platform',
          d: '5 dilde 30’dan fazla bölümlü ücretsiz İslami platform: Kuran oku ve dinle, namaz vakitleri, 1250+ hadis, dua, zikir, zekât ve kıble. Reklamsız.' },
    ar: { t: 'القرآن ومواقيت الصلاة والحديث والدعاء — منصة إسلامية',
          d: 'منصة إسلامية مجانية بأكثر من ٣٠ قسماً بخمس لغات: اقرأ القرآن واستمع إليه، ومواقيت الصلاة، وأكثر من ١٢٥٠ حديثاً، والأدعية والأذكار والزكاة والقبلة. بلا إعلانات.' },
  },

  // ── Camaat, elanlar, ianə ──
  // Məscid dövründən qalan, indi ÜMUMİ olan səhifələr: konkret məscid adı,
  // ünvanı və ya ianə rekvizitləri vəd edilmir (saytda ödəniş qəbul olunmur).
  jamaat: {
    az: { t: 'Camaat və Cümə Namazı — Fəziləti və Vaxtları',
          d: 'Camaat və cümə namazının fəziləti haqqında ayə və hədislər, bugünkü namaz vaxtları və yaxınlıqdakı məscidi tapmaq üçün keçid — hamısı bir səhifədə.' },
    en: { t: 'Congregational & Friday Prayer — Virtues and Times',
          d: 'Verses and hadith on the virtues of praying in congregation and the Friday prayer, today’s prayer times and a quick way to find a mosque near you.' },
    ru: { t: 'Коллективный и пятничный намаз — достоинства и время',
          d: 'Аяты и хадисы о достоинстве коллективного и пятничного намаза, сегодняшнее время намаза и быстрый поиск ближайшей мечети — на одной странице.' },
    tr: { t: 'Cemaat ve Cuma Namazı — Fazileti ve Vakitleri',
          d: 'Cemaatle ve cuma namazı kılmanın fazileti hakkında ayet ve hadisler, bugünkü namaz vakitleri ve yakınınızdaki camiyi bulmak için bağlantı bir arada.' },
    ar: { t: 'صلاة الجماعة والجمعة — فضلها ومواقيتها',
          d: 'آيات وأحاديث في فضل صلاة الجماعة وصلاة الجمعة، مع مواقيت الصلاة لهذا اليوم ورابط سريع للعثور على أقرب مسجد إليك، في صفحة واحدة.' },
  },

  announcements: {
    az: { t: 'Elanlar — Muslims.cc Yenilikləri və İslami Günlər',
          d: 'Muslims.cc elanları: saytdakı yeniliklər, mübarək günlər və İslami tarixlər haqqında xatırlatmalar. Yeni elanı qaçırmamaq üçün bildirişləri aktivləşdirin.' },
    en: { t: 'Announcements — Muslims.cc News & Islamic Days',
          d: 'Muslims.cc announcements: what is new on the site, plus reminders of blessed days and Islamic dates. Turn on notifications so you never miss one.' },
    ru: { t: 'Объявления — новости Muslims.cc и исламские дни',
          d: 'Объявления Muslims.cc: новое на сайте, а также напоминания о благословенных днях и исламских датах. Включите уведомления, чтобы не пропустить новое.' },
    tr: { t: 'Duyurular — Muslims.cc Haberleri ve Mübarek Günler',
          d: 'Muslims.cc duyuruları: sitedeki yenilikler, mübarek günler ve İslami tarihler hakkında hatırlatmalar. Yeni duyuruları kaçırmamak için bildirimleri açın.' },
    ar: { t: 'الإعلانات — أخبار Muslims.cc والأيام الإسلامية',
          d: 'إعلانات Muslims.cc: الجديد في الموقع، مع التذكير بالأيام المباركة والمناسبات الإسلامية. فعّل الإشعارات حتى لا يفوتك أي إعلان جديد.' },
  },

  donate: {
    az: { t: 'Xeyriyyə və ianə — sədəqə bələdçisi',
          d: 'Sədəqə və ianənin fəziləti, kimə və necə vermək haqqında bələdçi, zəkat kalkulyatoru və şəxsi sədəqə gündəliyi. Saytda ödəniş rekvizitləri yoxdur.' },
    en: { t: 'Charity & Giving — A Guide to Sadaqah',
          d: 'A guide to the virtue of sadaqah and giving, who to give to and how, plus a zakat calculator and a personal sadaqah journal. No payment details here.' },
    ru: { t: 'Благотворительность — путеводитель по садаке',
          d: 'Достоинство садаки и пожертвований, кому и как давать, калькулятор закята и личный дневник садаки. Платёжных реквизитов на сайте нет.' },
    tr: { t: 'Hayır ve Bağış — Sadaka Rehberi',
          d: 'Sadaka ve bağışın fazileti, kime ve nasıl verileceğine dair rehber, zekât hesaplama aracı ve kişisel sadaka günlüğü. Sitede ödeme bilgisi yoktur.' },
    ar: { t: 'الصدقة والتبرع — دليل العطاء',
          d: 'دليل لفضل الصدقة والتبرع، ولمن تُعطى وكيف، مع حاسبة الزكاة وسجل شخصي للصدقات. لا توجد في الموقع أي بيانات للدفع.' },
  },

  quran: {
    az: { t: 'Quran Oxu — 114 Surə, Tərcümə, Audio və Təfsir',
          d: 'Quranın bütün 114 surəsini onlayn oxu: ərəb mətni, Azərbaycan tərcüməsi, audio qiraət, təfsir, ayə axtarışı və əlfəcinlər. Pulsuz və reklamsız.' },
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
    az: { t: 'Namaz Vaxtları — Azərbaycanın 75 Şəhəri, Əzan Bildirişi',
          d: 'Bakı, Gəncə, Şəki, Lənkəran və Azərbaycanın daha 70+ şəhəri üçün dəqiq namaz vaxtları: Sübh, Günorta, Əsr, Məğrib, İşa. Əzan bildirişi, geri sayım və həftəlik statistika.' },
    en: { t: 'Prayer Times — Salah Times & Adhan Alerts',
          d: 'Accurate daily prayer times for 98 cities worldwide, including 75 in Azerbaijan: Fajr, Dhuhr, Asr, Maghrib and Isha. Get adhan notifications, a live countdown to the next salah and weekly stats.' },
    ru: { t: 'Время намаза — расписание и уведомления азана',
          d: 'Точное время намаза для 98 городов, из них 75 в Азербайджане: Фаджр, Зухр, Аср, Магриб, Иша. Уведомления азана, обратный отсчёт до следующего намаза и недельная статистика.' },
    tr: { t: 'Namaz Vakitleri — Şehirlere Göre Ezan Saatleri',
          d: 'Azerbaycan’ın 75 şehri dahil 98 şehir için doğru namaz vakitleri: İmsak, Öğle, İkindi, Akşam, Yatsı. Ezan bildirimi, sonraki vakte geri sayım ve haftalık namaz istatistikleri.' },
    ar: { t: 'مواقيت الصلاة — أوقات دقيقة وتنبيهات الأذان',
          d: 'مواقيت الصلاة الدقيقة لـ ٩٨ مدينة، منها ٧٥ في أذربيجان: الفجر والظهر والعصر والمغرب والعشاء. تنبيهات الأذان والعد التنازلي للصلاة القادمة وإحصاءات أسبوعية.' },
  },

  ramadan: {
    az: { t: 'İmsakiyyə — Ramazan təqvimi, səhur və iftar vaxtları',
          d: 'Seçdiyiniz şəhər üçün Ramazan ayının imsakiyyəsi: hər gün imsak (səhur), namaz vaxtları və iftar. İftara canlı geri sayım, çap üçün cədvəl.' },
    en: { t: 'Ramadan Timetable — Suhoor and Iftar Times',
          d: 'The full Ramadan timetable for your city: imsak (end of suhoor), prayer times and iftar for every day, a live countdown to iftar and a printable table.' },
    ru: { t: 'Расписание на Рамадан — время сухура и ифтара',
          d: 'Расписание Рамадана для вашего города: имсак (окончание сухура), время намазов и ифтар на каждый день, обратный отсчёт до ифтара и таблица для печати.' },
    tr: { t: 'İmsakiye — Ramazan Sahur ve İftar Vakitleri',
          d: 'Seçtiğiniz şehir için Ramazan imsakiyesi: her gün imsak (sahur), namaz vakitleri ve iftar. İftara canlı geri sayım ve yazdırılabilir tablo.' },
    ar: { t: 'إمساكية رمضان — مواعيد السحور والإفطار',
          d: 'إمساكية شهر رمضان لمدينتك: وقت الإمساك ومواقيت الصلاة والإفطار لكل يوم، مع عدّ تنازلي حتى الإفطار وجدول قابل للطباعة.' },
  },

  // Say: təkrarsız 1394 hədis (Quran ayələri və "Məşhur" sözlər sayılmır) →
  // "1250+" — data/siteStats.js-dəki HADITH_COUNT ilə eyni. 15 mövzu.
  // "Səhih" yazılmır — toplu yalnız səhih hədislərdən ibarət deyil.
  hadith: {
    az: { t: 'Hədis Toplusu — 1250+ Hədis, 15 Mövzu',
          d: '1250-dən çox hədisi mövzu üzrə oxu: iman, namaz, əxlaq, ailə, elm və daha çox. Axtarış, favoritlər və paylaşma ilə. Buxari və Müslim mənbələri.' },
    en: { t: 'Hadith Collection — 1250+ Hadith by Topic',
          d: 'Browse over 1250 hadith across 15 topics: faith, prayer, character, family, knowledge and more. Full-text search, favourites and one-tap sharing.' },
    ru: { t: 'Сборник хадисов — 1250+ хадисов по темам',
          d: 'Более 1250 хадисов по 15 темам: вера, намаз, нравственность, семья, знание и другое. Поиск по тексту, избранное и быстрый обмен.' },
    tr: { t: 'Hadis Koleksiyonu — 1250+ Hadis, 15 Konu',
          d: '1250’den fazla hadisi konularına göre oku: iman, namaz, ahlak, aile, ilim ve daha fazlası. Arama, favoriler ve paylaşma özellikleriyle.' },
    ar: { t: 'مجموعة الأحاديث — أكثر من ١٢٥٠ حديثًا',
          d: 'تصفح أكثر من ١٢٥٠ حديثًا في ١٥ موضوعاً: الإيمان والصلاة والأخلاق والأسرة والعلم وغيرها، مع البحث الكامل والمفضلة والمشاركة.' },
  },

  duas: {
    az: { t: 'Dualar və Əzkar — 80+ Səhih Gündəlik Dua',
          d: 'Quran və səhih sünnədən gündəlik həyat üçün 80+ dua və zikr: səhər-axşam əzkarı, yemək, yuxu, səfər, çətinlik duaları. Ərəb mətni, transkripsiya və tərcümə ilə.' },
    en: { t: 'Duas & Adhkar — 80+ Authentic Daily Supplications',
          d: 'Over 80 duas and adhkar from the Quran and authentic Sunnah for daily life: morning and evening remembrance, food, sleep, travel and hardship. With Arabic text, transliteration and translation.' },
    ru: { t: 'Дуа и азкары — более 80 достоверных ежедневных мольб',
          d: 'Более 80 дуа и азкаров из Корана и достоверной Сунны на каждый день: утренние и вечерние поминания, еда, сон, путешествие, трудности. С арабским текстом и переводом.' },
    tr: { t: 'Dualar ve Ezkâr — 80+ Sahih Günlük Dua',
          d: 'Kuran ve sahih sünnetten günlük hayat için 80+ dua ve zikir: sabah-akşam ezkârı, yemek, uyku, yolculuk ve sıkıntı duaları. Arapça metin, okunuşu ve meali ile.' },
    ar: { t: 'الأدعية والأذكار — أكثر من ٨٠ دعاءً يوميًا صحيحًا',
          d: 'أكثر من ٨٠ دعاءً وذكرًا من القرآن والسنة الصحيحة للحياة اليومية: أذكار الصباح والمساء، والطعام، والنوم، والسفر، والكرب، مع النص العربي والترجمة.' },
  },

  dhikr: {
    az: { t: 'Zikr sayğacı — rəqəmsal təsbih',
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

  tracker: {
    az: { t: 'Namaz İzləyicisi — Seriya, Hesabat və Qəza Sayğacı',
          d: 'Beş vaxt namazı qeyd et: vaxtında, qəza və ya qılınmayıb. Ardıcıl gün seriyası, həftəlik və aylıq hesabat, qəza sayğacı. Məlumat yalnız cihazında qalır.' },
    en: { t: 'Prayer Tracker — Streaks, Reports & Qada Counter',
          d: 'Log the five daily prayers as on time, made up or missed. Day streaks, weekly and monthly reports and a qada counter. Your data stays on your device.' },
    ru: { t: 'Трекер намазов — серии, отчёты и счётчик каза',
          d: 'Отмечайте пять намазов: вовремя, каза или пропущен. Серии дней, недельный и месячный отчёт, счётчик каза. Данные остаются на вашем устройстве.' },
    tr: { t: 'Namaz Takibi — Seri, Rapor ve Kaza Sayacı',
          d: 'Beş vakit namazı işaretle: vaktinde, kaza veya kılınmadı. Gün serisi, haftalık ve aylık rapor, kaza sayacı. Verilerin cihazında kalır.' },
    ar: { t: 'متابعة الصلاة — السلاسل والتقارير وعدّاد القضاء',
          d: 'سجّل الصلوات الخمس: في وقتها أو قضاءً أو فائتة. أيام متتالية وتقرير أسبوعي وشهري وعدّاد للقضاء. تبقى بياناتك على جهازك.' },
  },

  arabic: {
    az: { t: 'Ərəb əlifbası və Quran oxumağı öyrən — pulsuz kurs',
          d: 'Yeni müsəlmanlar və uşaqlar üçün addım-addım: 28 hərf və səsləri, hərəkələr, hecalar, Fatihə və qısa surələr söz-söz, təcvidin əsasları və yoxlama oyunları.' },
    en: { t: 'Learn the Arabic Alphabet and Quran Reading — Free Course',
          d: 'A step-by-step course for new Muslims and kids: the 28 letters with audio, vowel marks, syllables, Al-Fatiha and short surahs word by word, tajweed basics and quizzes.' },
    ru: { t: 'Арабский алфавит и чтение Корана — бесплатный курс',
          d: 'Пошаговый курс для новых мусульман и детей: 28 букв с озвучкой, огласовки, слоги, Аль-Фатиха и короткие суры слово за словом, основы таджвида и проверочные тесты.' },
    ar: { t: 'تعلّم الحروف العربية وقراءة القرآن — دورة مجانية',
          d: 'دورة متدرجة للمسلمين الجدد والأطفال: الحروف الثمانية والعشرون بالصوت، والحركات، والمقاطع، والفاتحة والسور القصيرة كلمةً كلمة، وأساسيات التجويد واختبارات قصيرة.' },
    tr: { t: 'Arap Alfabesi ve Kur’an Okumayı Öğren — Ücretsiz Kurs',
          d: 'Yeni Müslümanlar ve çocuklar için adım adım: sesli 28 harf, harekeler, heceler, Fâtiha ve kısa sureler kelime kelime, tecvidin temelleri ve kısa sınavlar.' },
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
    az: { t: 'Hifz izləyicisi — Quranı əzbərləmə planı',
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
    tr: { t: 'İslami Bilgi Yarışması — Kuran, Hadis ve Din Testi',
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
    az: { t: 'İslami lüğət — dini terminlərin izahı',
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
    az: { t: 'Səhabələr — Peyğəmbərin yoldaşlarının həyatı',
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

  scholars: {
    az: { t: 'Sələf alimləri — İslam alimlərinin həyatı və əsərləri',
          d: 'Sələf yolunun alimlərini tanı: İmam Əhməd, əl-Buxari, İbn Teymiyyə, İbn Baz, İbn Useymin və başqalarının həyatı, müəllimləri, əsərləri və elmə töhfəsi.' },
    en: { t: 'Scholars of the Salaf — Lives and Works',
          d: 'Meet the scholars of the Salaf: Imam Ahmad, al-Bukhari, Ibn Taymiyyah, Ibn Baz, Ibn Uthaymin and others — their lives, teachers, works and legacy, with sources.' },
    ru: { t: 'Учёные саляфа — жизнь и труды',
          d: 'Познакомьтесь с учёными саляфа: имам Ахмад, аль-Бухари, Ибн Таймия, Ибн Баз, Ибн Усаймин и другие — их жизнь, учителя, труды и вклад в науку, с источниками.' },
    tr: { t: 'Selef Âlimleri — Hayatları ve Eserleri',
          d: 'Selef yolunun âlimlerini tanı: İmam Ahmed, Buhârî, İbn Teymiyye, İbn Bâz, İbn Useymîn ve diğerlerinin hayatı, hocaları, eserleri ve ilme katkıları.' },
    ar: { t: 'علماء السلف — سيرهم ومؤلفاتهم',
          d: 'تعرّف على علماء السلف: الإمام أحمد والبخاري وابن تيمية وابن باز وابن عثيمين وغيرهم؛ سيرهم وشيوخهم وتلاميذهم ومؤلفاتهم وأثرهم في العلم، مع المصادر.' },
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
    az: { t: 'Quran oxu statistikası — irəliləyişini gör',
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
    az: { t: 'İslami kitablar — pulsuz onlayn kitabxana',
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
          d: 'İslamla bağlı suallarını AI köməkçiyə ver: namaz, oruc, halal-haram, Quran və hədis mövzularında izahlı cavablar. Fətva deyil — dini hökm üçün etibarlı alimə müraciət edin.' },
    en: { t: `${BRAND.aiName.en} — Ask Your Questions About Islam`,
          d: 'Ask the AI assistant about Islam: prayer, fasting, halal and haram, the Quran and hadith, explained in 5 languages. Not a fatwa — consult a trusted scholar for rulings.' },
    ru: { t: `${BRAND.aiName.ru} — ответы на вопросы об исламе`,
          d: 'Задайте ИИ-помощнику вопросы об исламе: намаз, пост, халяль и харам, Коран и хадисы — с пояснениями на 5 языках. Это не фетва — за решениями обращайтесь к надёжному учёному.' },
    tr: { t: `${BRAND.aiName.tr} — İslam Hakkında Sorular`,
          d: 'İslam hakkındaki sorularını yapay zekâ asistanına sor: namaz, oruç, helal-haram, Kuran ve hadis üzerine açıklamalar. Fetva değildir — hükümler için güvenilir bir âlime danışın.' },
    ar: { t: `${BRAND.aiName.ar} — أجوبة عن أسئلتك في الإسلام`,
          d: 'اسأل المساعد الذكي عن الإسلام: الصلاة والصيام والحلال والحرام والقرآن والحديث، مع الشرح بخمس لغات. ليست فتوى — للأحكام الشرعية يُرجى الرجوع إلى عالم موثوق.' },
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

  // ── Hüquqi sənədlər (PrivacyPage, TermsPage, LicensesPage) ──
  privacy: {
    az: { t: 'Məxfilik siyasəti — Hansı məlumat, harada və nə üçün',
          d: 'Muslims.cc hesab tələb etmir, reklam və izləmə kukisi işlətmir. Hansı məlumatın brauzerdə qaldığını, nəyin serverə getdiyini və necə silindiyini öyrənin.' },
    en: { t: 'Privacy Policy — What Data, Where and Why',
          d: 'Muslims.cc needs no account and uses no ads or tracking cookies. Learn what stays in your browser, what reaches our server and how you can delete it.' },
    ru: { t: 'Политика конфиденциальности — какие данные и зачем',
          d: 'Muslims.cc не требует регистрации, не показывает рекламу и не ставит отслеживающих куки. Что хранится в браузере, что попадает на сервер и как это удалить.' },
    ar: { t: 'سياسة الخصوصية — ما البيانات وأين ولماذا',
          d: 'لا يتطلب Muslims.cc إنشاء حساب ولا يستخدم إعلانات أو ملفات تتبّع. تعرّف على ما يبقى في متصفحك وما يصل إلى خادمنا وكيف يمكنك حذفه بنفسك.' },
    tr: { t: 'Gizlilik Politikası — Hangi Veri, Nerede ve Neden',
          d: 'Muslims.cc hesap istemez, reklam ve takip çerezi kullanmaz. Tarayıcınızda neyin kaldığını, sunucumuza neyin ulaştığını ve nasıl silineceğini öğrenin.' },
  },
  terms: {
    az: { t: 'İstifadə şərtləri — Pulsuz İslami platformanın qaydaları',
          d: 'Muslims.cc istifadə şərtləri: xidmət pulsuzdur və "olduğu kimi" verilir, AI cavabı fətva deyil, namaz vaxtı hesablamadır, Quran tərcüməsi məna tərcüməsidir.' },
    en: { t: 'Terms of Use — Rules of a Free Islamic Platform',
          d: 'Muslims.cc terms of use: a free service provided as is. AI answers are not fatwas, prayer times are calculations and Quran translations convey the meaning.' },
    ru: { t: 'Условия использования — правила бесплатной платформы',
          d: 'Условия использования Muslims.cc: бесплатный сервис «как есть»; ответ ИИ — не фетва, время намаза — расчёт, а переводы Корана — это переводы смыслов.' },
    ar: { t: 'شروط الاستخدام — قواعد منصة إسلامية مجانية',
          d: 'شروط استخدام Muslims.cc: خدمة مجانية تُقدَّم كما هي؛ إجابات المساعد الذكي ليست فتوى، ومواقيت الصلاة حساب فلكي، وترجمات القرآن ترجمات لمعانيه.' },
    tr: { t: 'Kullanım Şartları — Ücretsiz İslami Platformun Kuralları',
          d: 'Muslims.cc kullanım şartları: hizmet ücretsizdir ve “olduğu gibi” sunulur; yapay zekâ cevabı fetva değildir, namaz vakti hesaplamadır, meal anlam tercümesidir.' },
  },
  licenses: {
    az: { t: 'Mənbələr və lisenziyalar — Quran mətni, tərcümələr, xəritə',
          d: 'Muslims.cc-nin mənbələri: Tanzil Quran mətni, tərcümələr, qiraət səsləri, AlAdhan namaz vaxtları, OpenStreetMap, şriftlər və açıq mənbə kitabxanaları.' },
    en: { t: 'Sources & Licenses — Quran Text, Translations, Maps',
          d: 'Sources used on Muslims.cc: the Tanzil Quran text, translations, recitations, AlAdhan prayer times, OpenStreetMap data, fonts and open-source libraries.' },
    ru: { t: 'Источники и лицензии — текст Корана, переводы, карты',
          d: 'Источники Muslims.cc: текст Корана проекта Танзиль, переводы смыслов, аудио чтецов, время намаза, данные OpenStreetMap, шрифты и открытые библиотеки.' },
    ar: { t: 'المصادر والتراخيص — نص القرآن والترجمات والخرائط',
          d: 'مصادر Muslims.cc: نص القرآن من مشروع تنزيل، والترجمات، وتسجيلات التلاوة، ومواقيت الصلاة، وبيانات OpenStreetMap، والخطوط والمكتبات مفتوحة المصدر.' },
    tr: { t: 'Kaynaklar ve Lisanslar — Kur’an Metni, Mealler, Harita',
          d: 'Muslims.cc’nin kaynakları: Tanzil Kur’an metni, mealler, kıraat kayıtları, AlAdhan namaz vakitleri, OpenStreetMap verileri, yazı tipleri ve açık kaynak kütüphaneler.' },
  },

  about: {
    az: { t: 'Haqqımızda — Muslims.cc Layihəsi',
          d: 'Muslims.cc — pulsuz, reklamsız və açıq İslami rəqəmsal platforma. Missiyamız, dəyərlərimiz, saytdakı bölmələr və bizimlə əlaqə haqqında.' },
    en: { t: 'About — The Muslims.cc Project',
          d: 'Muslims.cc is a free, ad-free and open Islamic digital platform. Learn about our mission and values, the sections we offer and how to get in touch.' },
    ru: { t: 'О нас — проект Muslims.cc',
          d: 'Muslims.cc — бесплатная, открытая исламская цифровая платформа без рекламы. О нашей миссии и ценностях, разделах сайта и о том, как с нами связаться.' },
    tr: { t: 'Hakkımızda — Muslims.cc Projesi',
          d: 'Muslims.cc ücretsiz, reklamsız ve açık bir İslami dijital platformdur. Misyonumuz, değerlerimiz, sitedeki bölümler ve bize nasıl ulaşacağınız hakkında.' },
    ar: { t: 'من نحن — مشروع Muslims.cc',
          d: 'Muslims.cc منصة إسلامية رقمية مجانية ومفتوحة وبلا إعلانات. تعرّف على رسالتنا وقيمنا وأقسام الموقع وكيفية التواصل معنا.' },
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
          d: 'Axtardığınız səhifə yoxdur və ya ünvanı dəyişib. Ana səhifəyə qayıdın, namaz vaxtlarına baxın və ya saytda axtarın.' },
    en: { t: 'Page not found',
          d: 'The page you are looking for does not exist or has moved. Go back to the home page, check the prayer times or search the site.' },
    ru: { t: 'Страница не найдена',
          d: 'Такой страницы нет, или её адрес изменился. Вернитесь на главную, посмотрите время намаза или воспользуйтесь поиском.' },
    tr: { t: 'Sayfa bulunamadı',
          d: 'Aradığınız sayfa yok ya da adresi değişti. Ana sayfaya dönün, namaz vakitlerine bakın veya sitede arayın.' },
    ar: { t: 'الصفحة غير موجودة',
          d: 'الصفحة التي تبحث عنها غير موجودة أو تغيّر عنوانها. عُد إلى الصفحة الرئيسية، أو اطّلع على مواقيت الصلاة، أو ابحث في الموقع.' },
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

// ── Sosial paylaşım kartı (og:image) ────────────────
// Hər dilin öz kartı var (scripts/gen-og-image.py yaradır): /en/... linki
// paylaşılanda kartda azərbaycanca yazı görünməsin. az = og-image.png
// (index.html və manifest də onu göstərir), digərləri og-image-<dil>.png.
export const OG_ALT = {
  az: 'Muslims.cc — İslami platforma: Quran, namaz vaxtları, hədis, dua və zikr',
  en: 'Muslims.cc — Islamic platform: Quran, prayer times, hadith, duas and dhikr',
  ru: 'Muslims.cc — исламская платформа: Коран, время намаза, хадисы, дуа и зикр',
  tr: 'Muslims.cc — İslami platform: Kur’an, namaz vakitleri, hadis, dua ve zikir',
  ar: 'Muslims.cc — منصة إسلامية: القرآن ومواقيت الصلاة والحديث والأدعية والأذكار',
}

/** Dilə uyğun OG şəklinin tam URL-i. */
export function ogImageFor(lang = 'az') {
  const file = lang === 'az' || !OG_ALT[lang] ? 'og-image.png' : `og-image-${lang}.png`
  return `${BRAND.url}/${file}`
}

/** Qısa ad — menyu və breadcrumb üçün (başlığın ilk hissəsi). */
export function shortName(key, lang = 'az') {
  return pickMeta(key, lang).t.split(' — ')[0].trim()
}
