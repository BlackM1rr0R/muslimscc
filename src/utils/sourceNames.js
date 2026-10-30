// ═══════════════════════════════════════════════════════
// Mənbə adlarının dilə uyğun yazılışı
//
// src/data/*.js fayllarında mənbələr Azərbaycan yazılışındadır: "Buxari 645",
// "Əbu Davud, Ədəb 32", "Quran 112:2", "Bəqərə 2:127", "Bəqərə 155". Bu fayllar
// DƏYİŞMİR — göstərərkən mənbə sətri cari dilə çevrilir:
//
//   localizeSource('Buxari 450', 'en')            → 'Bukhari 450'
//   localizeSource('Buxari, Ədəb 32', 'ru')       → 'Бухари, Адаб 32'
//   localizeSource('Tirmizi 2516', 'ar')          → 'الترمذي 2516'
//   localizeSource('İmam Əli', 'tr')              → 'İmam Ali'
//   localizeSource('Nəsai, Taharat 3', 'en')      → "An-Nasa'i, Taharah 3"
//   localizeSource('Quran 112:2', 'ar')           → 'القرآن 112:2'
//   localizeSource('Bəqərə 2:127', 'en')          → 'Quran 2:127'
//   localizeSource('Bəqərə 155', 'tr')            → "Kur'an 2:155"
//
// QAYDALAR
// • az-da mətn olduğu kimi qaytarılır.
// • Yalnız ADLAR dəyişir: toplu/müəllif adı ("Buxari"), kitab fəsli ("Ədəb")
//   və mötərizədəki qeyd ("məna ilə"). Rəqəmlər (645, 2/381, 1-3) toxunulmur,
//   ərəbcədə də Qərb rəqəmləri qalır.
// • Surə adı + ayə: surə nömrəsi SURAH_AZ-dan tapılır və "Quran s:a" kimi
//   yazılır (surə adlarının 4 dilə tərcüməsi yoxdur — nömrə hər dildə aydındır).
// • Bütün adlar BİR keçiddə, ən uzun ifadə birinci əvəzlənir: "Fəzailul-Quran"
//   bütöv fəsil adıdır, içindəki "Quran" ayrıca çevrilmir; "Müttəfiq" →
//   "Bukhari & Muslim" sonra yenidən "Muslim" kimi emal olunmur.
// • \b Ə/İ kimi hərflərdə işləmir, lookbehind isə köhnə Safari-də yoxdur — ona
//   görə sərhəd "(^|hərf olmayan)" qrupu və (?![\p{L}']) ilə yoxlanılır.
// • Cədvəldə olmayan söz olduğu kimi qalır (təxmini tərcümə edilmir).
// ═══════════════════════════════════════════════════════

import { SURAH_AZ } from '../data/surahNamesAz.js'

export const QURAN_WORD = { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: "Kur'an" }

// ── Hədis topluları, müəlliflər və sitat müəllifləri ──
// [Azərbaycan yazılış(lar)ı — "|" ilə, tərcümələr]
const NAMES = [
  ['Müttəfiq ələyh|Müttəfiq', { en: 'Bukhari & Muslim', ru: 'Бухари и Муслим', tr: 'Buhârî ve Müslim', ar: 'متفق عليه' }],
  ['Buxari', { en: 'Bukhari', ru: 'Бухари', tr: 'Buhârî', ar: 'البخاري' }],
  ['Muslim|Müslim', { en: 'Muslim', ru: 'Муслим', tr: 'Müslim', ar: 'مسلم' }],
  ['Tirmizi', { en: 'Tirmidhi', ru: 'Тирмизи', tr: 'Tirmizî', ar: 'الترمذي' }],
  ['Əbu Davud', { en: 'Abu Dawud', ru: 'Абу Дауд', tr: 'Ebû Dâvûd', ar: 'أبو داود' }],
  ['İbn Macə|Ibn Macə', { en: 'Ibn Majah', ru: 'Ибн Маджа', tr: 'İbn Mâce', ar: 'ابن ماجه' }],
  ['Nəsai|Nasai', { en: "an-Nasa'i", ru: 'ан-Насаи', tr: 'Nesâî', ar: 'النسائي' }],
  ['Əhməd', { en: 'Ahmad', ru: 'Ахмад', tr: 'Ahmed', ar: 'أحمد' }],
  ['Beyhəqi', { en: 'al-Bayhaqi', ru: 'аль-Байхаки', tr: 'Beyhakî', ar: 'البيهقي' }],
  ['Taberani|Təbərani', { en: 'at-Tabarani', ru: 'ат-Табарани', tr: 'Taberânî', ar: 'الطبراني' }],
  ['Hakim', { en: 'al-Hakim', ru: 'аль-Хаким', tr: 'Hâkim', ar: 'الحاكم' }],
  ['Darimi', { en: 'ad-Darimi', ru: 'ад-Дарими', tr: 'Dârimî', ar: 'الدارمي' }],
  ['Bəzzar', { en: 'al-Bazzar', ru: 'аль-Баззар', tr: 'Bezzâr', ar: 'البزار' }],
  ['Daraqutni', { en: 'ad-Daraqutni', ru: 'ад-Даракутни', tr: 'Dârekutnî', ar: 'الدارقطني' }],
  // "İbn Hibbан" — data faylında son iki hərf kirilcədir (а, н); fayl dəyişmir, ona görə hər iki yazılış
  ['İbn Hibban|İbn Hibbан', { en: 'Ibn Hibban', ru: 'Ибн Хиббан', tr: 'İbn Hibbân', ar: 'ابن حبان' }],
  ['İbn Əbu Dünya', { en: "Ibn Abi'd-Dunya", ru: 'Ибн Аби ад-Дунья', tr: "İbn Ebi'd-Dünyâ", ar: 'ابن أبي الدنيا' }],
  ['İbn Əsakir', { en: 'Ibn Asakir', ru: 'Ибн Асакир', tr: 'İbn Asâkir', ar: 'ابن عساكر' }],
  ['İbn Abdil Berr', { en: 'Ibn Abd al-Barr', ru: 'Ибн Абд аль-Барр', tr: 'İbn Abdilber', ar: 'ابن عبد البر' }],
  ['İbn Sunniy', { en: 'Ibn as-Sunni', ru: 'Ибн ас-Сунни', tr: "İbnü's-Sünnî", ar: 'ابن السني' }],
  ['İbn Sad', { en: "Ibn Sa'd", ru: 'Ибн Саад', tr: "İbn Sa'd", ar: 'ابن سعد' }],
  ['Əbu Yala', { en: "Abu Ya'la", ru: 'Абу Яла', tr: "Ebû Ya'lâ", ar: 'أبو يعلى' }],
  ['Əbu Nuaym', { en: "Abu Nu'aym", ru: 'Абу Нуайм', tr: 'Ebû Nuaym', ar: 'أبو نعيم' }],
  ['Muvatta', { en: "al-Muwatta'", ru: 'аль-Муватта', tr: 'Muvatta', ar: 'الموطأ' }],
  // Hədis toplusunda olmayan məşhur sözlər (hadiths.js)
  ['Məşhur', { en: 'Popular saying', ru: 'Известное изречение', tr: 'Meşhur söz', ar: 'قول مشهور' }],
  ['Dua', { en: 'Dua', ru: 'Дуа', tr: 'Dua', ar: 'دعاء' }],
  // Sitat müəllifləri (quotes.js)
  ['Ömər ibn Xəttab', { en: 'Umar ibn al-Khattab', ru: 'Умар ибн аль-Хаттаб', tr: 'Ömer bin Hattâb', ar: 'عمر بن الخطاب' }],
  ['Həsən əl-Bəsri', { en: 'al-Hasan al-Basri', ru: 'аль-Хасан аль-Басри', tr: 'Hasan-ı Basrî', ar: 'الحسن البصري' }],
  ['İbn Qeyyim', { en: 'Ibn al-Qayyim', ru: 'Ибн аль-Каййим', tr: "İbnü'l-Kayyim", ar: 'ابن القيم' }],
  ['İbn Teymiyyə', { en: 'Ibn Taymiyyah', ru: 'Ибн Таймия', tr: 'İbn Teymiyye', ar: 'ابن تيمية' }],
  ['İbn Kəsir|İbn Kesir', { en: 'Ibn Kathir', ru: 'Ибн Касир', tr: 'İbn Kesîr', ar: 'ابن كثير' }],
  ['İbn Məsud', { en: "Ibn Mas'ud", ru: 'Ибн Масуд', tr: "İbn Mes'ûd", ar: 'ابن مسعود' }],
  ['İbn Ömər', { en: 'Ibn Umar', ru: 'Ибн Умар', tr: 'İbn Ömer', ar: 'ابن عمر' }],
  ['İsa əleyhissəlam', { en: 'Isa (peace be upon him)', ru: 'Иса (мир ему)', tr: 'Hz. İsa (a.s.)', ar: 'عيسى عليه السلام' }],
  ['Loğman Həkim', { en: 'Luqman the Wise', ru: 'Лукман Мудрый', tr: 'Lokman Hekim', ar: 'لقمان الحكيم' }],
  ['Əbu Bəkr', { en: 'Abu Bakr', ru: 'Абу Бакр', tr: 'Ebû Bekir', ar: 'أبو بكر' }],
  ['Ğəzali', { en: 'al-Ghazali', ru: 'аль-Газали', tr: 'Gazâlî', ar: 'الغزالي' }],
  ['Şafii', { en: "ash-Shafi'i", ru: 'аш-Шафии', tr: 'Şâfiî', ar: 'الشافعي' }],
  ['Malik', { en: 'Malik', ru: 'Малик', tr: 'Mâlik', ar: 'مالك' }],
  ['Əli', { en: 'Ali', ru: 'Али', tr: 'Ali', ar: 'علي' }],
  ['İmam', { en: 'Imam', ru: 'Имам', tr: 'İmam', ar: 'الإمام' }],
  ['Quran', QURAN_WORD],
]

// ── Kitab fəsilləri və əsər adları (vergüldən sonra gələn hissə) ──
// Hədis toplularındakı "Kitab ..." adlarıdır; ərəbcədə kitabın öz adı yazılır.
const CHAPTERS = [
  ['Ədəb əl-Müfrəd', { en: 'al-Adab al-Mufrad', ru: 'аль-Адаб аль-Муфрад', tr: "el-Edebü'l-Müfred", ar: 'الأدب المفرد' }],
  ['Mucəm əl-Kəbir', { en: "al-Mu'jam al-Kabir", ru: 'аль-Муджам аль-Кабир', tr: "el-Mu'cemü'l-Kebîr", ar: 'المعجم الكبير' }],
  ['Mucəm əl-Əvsət', { en: "al-Mu'jam al-Awsat", ru: 'аль-Муджам аль-Аусат', tr: "el-Mu'cemü'l-Evsat", ar: 'المعجم الأوسط' }],
  ['Sünənül-Kübra', { en: 'as-Sunan al-Kubra', ru: 'ас-Сунан аль-Кубра', tr: "es-Sünenü'l-Kübrâ", ar: 'السنن الكبرى' }],
  ['Şüabul-İman', { en: "Shu'ab al-Iman", ru: 'Шуаб аль-Иман', tr: "Şuabü'l-Îmân", ar: 'شعب الإيمان' }],
  ['Müstədrək', { en: 'al-Mustadrak', ru: 'аль-Мустадрак', tr: 'el-Müstedrek', ar: 'المستدرك' }],
  ['Müsnəd', { en: 'Musnad', ru: 'Муснад', tr: 'Müsned', ar: 'المسند' }],
  ['Tabaqat', { en: 'at-Tabaqat', ru: 'ат-Табакат', tr: 'Tabakât', ar: 'الطبقات' }],
  ['Əməlul-yəvm', { en: "'Amal al-Yawm wal-Layla", ru: 'Амаль аль-Яум валь-Лейля', tr: "Amelü'l-Yevm ve'l-Leyle", ar: 'عمل اليوم والليلة' }],
  ['Fəzailul-Quran', { en: "Fada'il al-Qur'an", ru: 'Фадаиль аль-Куран', tr: "Fezâilü'l-Kur'ân", ar: 'فضائل القرآن' }],
  ['Fəzailus-Sahaba', { en: "Fada'il as-Sahabah", ru: 'Фадаиль ас-Сахаба', tr: "Fezâilü's-Sahâbe", ar: 'فضائل الصحابة' }],
  ['Fəzlu Leylətil-Qadr', { en: 'Fadl Laylat al-Qadr', ru: 'Фадль Лейлят аль-Кадр', tr: "Fazlu Leyleti'l-Kadr", ar: 'فضل ليلة القدر' }],
  ['Səhihul-Cami', { en: 'Sahih al-Jami', ru: 'Сахих аль-Джами', tr: "Sahîhu'l-Câmi'", ar: 'صحيح الجامع' }],
  ['əl-Əfrad', { en: 'al-Afrad', ru: 'аль-Афрад', tr: 'el-Efrâd', ar: 'الأفراد' }],
  ['Müqəddimə', { en: 'Introduction', ru: 'Введение', tr: 'Mukaddime', ar: 'المقدمة' }],
  ['Kəffaratül-Əyman', { en: 'Kaffarat al-Ayman', ru: 'Каффарат аль-Айман', tr: "Keffârâtü'l-Eymân", ar: 'كفارات الأيمان' }],
  ['Bədül-Xalq', { en: "Bad' al-Khalq", ru: 'Бад аль-Халк', tr: "Bed'ü'l-Halk", ar: 'بدء الخلق' }],
  ['Bədül-Vahy', { en: "Bad' al-Wahy", ru: 'Бад аль-Вахй', tr: "Bed'ü'l-Vahy", ar: 'بدء الوحي' }],
  ['Cəza əs-Sayd', { en: "Jaza' as-Sayd", ru: 'Джаза ас-Сайд', tr: "Cezâü's-Sayd", ar: 'جزاء الصيد' }],
  ['Salat əl-Xovf', { en: 'Salat al-Khawf', ru: 'Салят аль-Хауф', tr: "Salâtü'l-Havf", ar: 'صلاة الخوف' }],
  ['Salat ət-Təravih', { en: 'Salat at-Tarawih', ru: 'Салят ат-Таравих', tr: "Salâtü't-Terâvîh", ar: 'صلاة التراويح' }],
  ['Təfsir Bəqərə', { en: 'Tafsir al-Baqarah', ru: 'Тафсир аль-Бакара', tr: 'Tefsîr el-Bakara', ar: 'تفسير سورة البقرة' }],
  ['Təfsir', { en: 'Tafsir', ru: 'Тафсир', tr: 'Tefsîr', ar: 'التفسير' }],
  ['Ədəb', { en: 'Adab', ru: 'Адаб', tr: 'Edeb', ar: 'الأدب' }],
  ['Birr', { en: 'Birr', ru: 'Бирр', tr: 'Birr', ar: 'البر والصلة' }],
  ['İman', { en: 'Iman', ru: 'Иман', tr: 'İman', ar: 'الإيمان' }],
  ['Dəavat', { en: "Da'awat", ru: 'Даават', tr: 'Deavât', ar: 'الدعوات' }],
  ['Zəkat', { en: 'Zakat', ru: 'Закят', tr: 'Zekât', ar: 'الزكاة' }],
  ['Zühd', { en: 'Zuhd', ru: 'Зухд', tr: 'Zühd', ar: 'الزهد' }],
  ['Cənaiz', { en: "Jana'iz", ru: 'Джанаиз', tr: 'Cenâiz', ar: 'الجنائز' }],
  ['Nikah', { en: 'Nikah', ru: 'Никах', tr: 'Nikâh', ar: 'النكاح' }],
  ['Taharat', { en: 'Taharah', ru: 'Тахара', tr: 'Tahâret', ar: 'الطهارة' }],
  ['İlm', { en: 'Ilm', ru: 'Ильм', tr: 'İlim', ar: 'العلم' }],
  ['Salat', { en: 'Salah', ru: 'Салят', tr: 'Salât', ar: 'الصلاة' }],
  ['Riqaq', { en: 'Riqaq', ru: 'Рикак', tr: 'Rikâk', ar: 'الرقاق' }],
  ['Zikr', { en: 'Dhikr', ru: 'Зикр', tr: 'Zikir', ar: 'الذكر' }],
  ["Büyu'", { en: "Buyu'", ru: 'Буйу', tr: "Büyû'", ar: 'البيوع' }],
  ['Müsafirin', { en: 'Musafirin', ru: 'Мусафирин', tr: 'Müsâfirîn', ar: 'صلاة المسافرين' }],
  ['Qiyamə', { en: 'Qiyamah', ru: 'Кийама', tr: 'Kıyâmet', ar: 'صفة القيامة' }],
  ['Vüdu', { en: 'Wudu', ru: 'Вуду', tr: 'Vudû', ar: 'الوضوء' }],
  ['Cümə', { en: "Jumu'ah", ru: 'Джума', tr: 'Cuma', ar: 'الجمعة' }],
  ['Salam', { en: 'Salam', ru: 'Салям', tr: 'Selâm', ar: 'السلام' }],
  ['Məzalim', { en: 'Mazalim', ru: 'Мазалим', tr: 'Mezâlim', ar: 'المظالم' }],
  ["Tə'bir", { en: "Ta'bir", ru: 'Табир', tr: "Ta'bîr", ar: 'التعبير' }],
  ['Cihad', { en: 'Jihad', ru: 'Джихад', tr: 'Cihâd', ar: 'الجهاد' }],
  ['Müsaqat', { en: 'Musaqah', ru: 'Мусака', tr: 'Müsâkât', ar: 'المساقاة' }],
  ['Əzan', { en: 'Adhan', ru: 'Азан', tr: 'Ezan', ar: 'الأذان' }],
  ["İsti'zan", { en: "Isti'dhan", ru: 'Истизан', tr: "İsti'zân", ar: 'الاستئذان' }],
  ['Əhkam', { en: 'Ahkam', ru: 'Ахкам', tr: 'Ahkâm', ar: 'الأحكام' }],
  ['Libas', { en: 'Libas', ru: 'Либас', tr: 'Libâs', ar: 'اللباس' }],
  ['Sayd', { en: 'Sayd', ru: 'Сайд', tr: 'Sayd', ar: 'الصيد' }],
  ['Savm', { en: 'Sawm', ru: 'Саум', tr: 'Savm', ar: 'الصوم' }],
  ['Siyam', { en: 'Siyam', ru: 'Сыям', tr: 'Sıyâm', ar: 'الصيام' }],
  ['Təhəccüd', { en: 'Tahajjud', ru: 'Тахаджуд', tr: 'Teheccüd', ar: 'التهجد' }],
  ['Küsuf', { en: 'Kusuf', ru: 'Кусуф', tr: 'Küsûf', ar: 'الكسوف' }],
  ['İstisqa', { en: "Istisqa'", ru: 'Истиска', tr: 'İstiskâ', ar: 'الاستسقاء' }],
  ['Hayz', { en: 'Hayd', ru: 'Хайд', tr: 'Hayız', ar: 'الحيض' }],
  ['İmarat', { en: 'Imarah', ru: 'Имара', tr: 'İmâre', ar: 'الإمارة' }],
  ['Həcc', { en: 'Hajj', ru: 'Хадж', tr: 'Hac', ar: 'الحج' }],
  ['Vasaya|Vəsaya', { en: 'Wasaya', ru: 'Васая', tr: 'Vesâyâ', ar: 'الوصايا' }],
  ['Vasiyyə', { en: 'Wasiyyah', ru: 'Васыя', tr: 'Vasiyyet', ar: 'الوصية' }],
  ['Mesacid', { en: 'Masajid', ru: 'Масаджид', tr: 'Mesâcid', ar: 'المساجد' }],
  ['Mərdha', { en: 'Marda', ru: 'Марда', tr: 'Merdâ', ar: 'المرضى' }],
  ['Şürut', { en: 'Shurut', ru: 'Шурут', tr: 'Şurût', ar: 'الشروط' }],
  ['Hars', { en: 'Harth', ru: 'Харс', tr: 'Hars', ar: 'الحرث والمزارعة' }],
  ['Dahaya', { en: 'Dahaya', ru: 'Дахая', tr: 'Dahâyâ', ar: 'الضحايا' }],
  ['Ənbiya', { en: "Anbiya'", ru: 'Анбия', tr: 'Enbiyâ', ar: 'أحاديث الأنبياء' }],
  ['Zəbaih', { en: "Dhaba'ih", ru: 'Забаих', tr: 'Zebâih', ar: 'الذبائح والصيد' }],
  ['Rida', { en: "Rada'", ru: 'Рада', tr: 'Radâ', ar: 'الرضاع' }],
  ['Vitir', { en: 'Witr', ru: 'Витр', tr: 'Vitir', ar: 'الوتر' }],
  ['Əqdiyə', { en: 'Aqdiyah', ru: 'Акдыя', tr: 'Akdiye', ar: 'الأقضية' }],
  ["İ'tisam", { en: "I'tisam", ru: 'Итисам', tr: "İ'tisâm", ar: 'الاعتصام بالكتاب والسنة' }],
  ["İ'tikaf", { en: "I'tikaf", ru: 'Итикаф', tr: "İ'tikâf", ar: 'الاعتكاف' }],
  ['Tövhid', { en: 'Tawhid', ru: 'Таухид', tr: 'Tevhîd', ar: 'التوحيد' }],
  ['Cənnət', { en: 'Jannah', ru: 'Джанна', tr: 'Cennet', ar: 'الجنة' }],
  ['Sünnə', { en: 'Sunnah', ru: 'Сунна', tr: 'Sünnet', ar: 'السنة' }],
  ['Talaq', { en: 'Talaq', ru: 'Талак', tr: 'Talâk', ar: 'الطلاق' }],
  ['Umrə', { en: 'Umrah', ru: 'Умра', tr: 'Umre', ar: 'العمرة' }],
  ['Tövbə', { en: 'Tawbah', ru: 'Тауба', tr: 'Tevbe', ar: 'التوبة' }],
  ['Qədər', { en: 'Qadar', ru: 'Кадар', tr: 'Kader', ar: 'القدر' }],
  ['Tibb', { en: 'Tibb', ru: 'Тибб', tr: 'Tıb', ar: 'الطب' }],
  ["Rü'ya", { en: "Ru'ya", ru: 'Руйа', tr: "Rü'yâ", ar: 'الرؤيا' }],
  ['Əşribə', { en: 'Ashribah', ru: 'Ашриба', tr: 'Eşribe', ar: 'الأشربة' }],
  ['Məğazi', { en: 'Maghazi', ru: 'Магази', tr: 'Meğâzî', ar: 'المغازي' }],
  ['İstiazə', { en: "Isti'adhah", ru: 'Истиаза', tr: 'İstiâze', ar: 'الاستعاذة' }],
  ['Alfaz', { en: 'Alfaz', ru: 'Альфаз', tr: 'Elfâz', ar: 'الألفاظ' }],
  ['Mənaqib', { en: 'Manaqib', ru: 'Манакиб', tr: 'Menâkıb', ar: 'المناقب' }],
  ['İqamə', { en: 'Iqamah', ru: 'Икама', tr: 'İkâme', ar: 'إقامة الصلاة' }],
  ["Şüf'ə", { en: "Shuf'ah", ru: 'Шуфа', tr: "Şuf'a", ar: 'الشفعة' }],
  ['Diyat', { en: 'Diyat', ru: 'Дият', tr: 'Diyât', ar: 'الديات' }],
  ['Təqsir', { en: 'Taqsir', ru: 'Таксир', tr: 'Taksîr', ar: 'تقصير الصلاة' }],
  ['Vəkala', { en: 'Wakalah', ru: 'Вакаля', tr: 'Vekâlet', ar: 'الوكالة' }],
  ['Ticarət', { en: 'Tijarat', ru: 'Тиджарат', tr: 'Ticârât', ar: 'التجارات' }],
  ['Havaləl|Havalə', { en: 'Hawalah', ru: 'Хаваля', tr: 'Havâle', ar: 'الحوالات' }],
  ['Rühun', { en: 'Ruhun', ru: 'Рухун', tr: 'Ruhûn', ar: 'الرهون' }],
  ['Müqaddimə|Müqəddimə', { en: 'Muqaddimah', ru: 'Мукаддима', tr: 'Mukaddime', ar: 'المقدمة' }],
  ['Fitən', { en: 'Fitan', ru: 'Фитан', tr: 'Fiten', ar: 'الفتن' }],
  ['Sulh', { en: 'Sulh', ru: 'Сульх', tr: 'Sulh', ar: 'الصلح' }],
  ['Məlahim', { en: 'Malahim', ru: 'Малахим', tr: 'Melâhim', ar: 'الملاحم' }],
  ['Nüzur', { en: 'Nudhur', ru: 'Нузур', tr: 'Nüzûr', ar: 'النذور' }],
  ['Əyman', { en: 'Ayman', ru: 'Айман', tr: 'Eymân', ar: 'الأيمان' }],
]

// ── Mötərizədəki qeydlər: "(məna ilə)", "(İbn Ömər rəvayəti)" ──
const NOTES = [
  ['məna ilə', { en: 'by meaning', ru: 'по смыслу', tr: 'mânâ olarak', ar: 'بالمعنى' }],
  ['hədis təfsiri', { en: 'explained in hadith', ru: 'толкование в хадисе', tr: 'hadis tefsiri', ar: 'تفسير بالحديث' }],
  ['Quran ayəsi ilə', { en: 'with a Quran verse', ru: 'с аятом Корана', tr: "Kur'an ayetiyle", ar: 'مع آية من القرآن' }],
  ['təfsir', { en: 'tafsir', ru: 'тафсир', tr: 'tefsir', ar: 'تفسير' }],
]
// "X ilə" / "X rəvayəti" — X ayrıca çevrilir
const NOTE_FORMS = [
  [/^(.+)\s+ilə$/u, { en: x => `with ${x}`, ru: x => `вместе с ${x}`, tr: x => `${x} ile`, ar: x => `مع ${x}` }],
  [/^(.+)\s+rəvayəti$/u, { en: x => `narrated by ${x}`, ru: x => `передал ${x}`, tr: x => `${x} rivayeti`, ar: x => `رواية ${x}` }],
]

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Bütün ifadələr bir lüğətdə; regex-də ən uzunu birinci gəlir
const PHRASES = new Map()
for (const [az, names] of [...NAMES, ...CHAPTERS]) {
  for (const form of az.split('|')) PHRASES.set(form, names)
}
const PHRASE_RE = new RegExp(
  `(^|[^\\p{L}'])(${[...PHRASES.keys()].sort((a, b) => b.length - a.length).map(escapeRe).join('|')})(?![\\p{L}'])`,
  'gu',
)
const NOTE_MAP = new Map(NOTES)

/** Mətndəki bütün tanınan adları bir keçiddə dəyiş. */
function replacePhrases(text, lang) {
  return text.replace(PHRASE_RE, (m, pre, word) => {
    const name = PHRASES.get(word)?.[lang]
    return name ? pre + name : m
  })
}

/** Mötərizənin içi: sabit qeyd, "X ilə" forması və ya sadəcə adlar. */
function localizeNote(note, lang) {
  const t = note.trim()
  const fixed = NOTE_MAP.get(t)?.[lang]
  if (fixed) return fixed
  for (const [re, forms] of NOTE_FORMS) {
    const m = re.exec(t)
    if (m && forms[lang]) return forms[lang](replacePhrases(m[1], lang))
  }
  return replacePhrases(t, lang)
}

// ── Surələr ──

// Surə adının müqayisə forması: kiçik hərf, diakritiksiz, defis/boşluqsuz
function surahKey(name) {
  return String(name || '')
    .replace(/İ/g, 'i')
    .toLowerCase()
    .replace(/ə/g, 'e')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z]/g, '')
}

// SURAH_AZ adları + data fayllarında rast gələn başqa yazılışlar
const SURAH_ALIASES = {
  insirah: 94, muzzemmil: 73, qasas: 28, cin: 72, rad: 13, aliimran: 3, fatiha: 1,
  mutaffifin: 83, zuxruf: 43,
}
const SURAH_BY_KEY = (() => {
  const map = new Map()
  for (const [n, s] of Object.entries(SURAH_AZ)) map.set(surahKey(s.name), Number(n))
  for (const [k, n] of Object.entries(SURAH_ALIASES)) if (!map.has(k)) map.set(k, n)
  return map
})()

/** Surənin Azərbaycan adı (və ya yazılış variantı) → nömrə | null */
export function surahNumberOf(name) {
  const k = surahKey(name)
  if (!k) return null
  return SURAH_BY_KEY.get(k) || null
}

// "Bəqərə 2:127", "Bəqərə 155", "Ali İmran 3:8", "İnşirah 5-6"
const SURAH_REF = /^([^\d,()]+?)\s+(\d{1,3})(?:\s*:\s*(\d{1,3}))?((?:\s*[-–]\s*\d{1,3})?)$/

/**
 * Mənbə sətri surə adı + ayə formasındadırsa { s, a, rest } qaytarır.
 * "Quran 112:2" də bura düşür. Hədis mənbələri ("Buxari 645") — null.
 */
export function parseSurahRef(source) {
  const m = SURAH_REF.exec(String(source || '').trim())
  if (!m) return null
  const name = m[1].trim()
  const isQuran = /^quran$/i.test(name)
  const sn = isQuran ? null : surahNumberOf(name)
  if (m[3]) {
    // "Ad s:a" — nömrə mətndə var
    if (!isQuran && !sn) return null
    return { s: Number(m[2]), a: Number(m[3]), rest: m[4] || '' }
  }
  if (!sn) return null
  // "Ad a" — surə nömrəsi addan
  return { s: sn, a: Number(m[2]), rest: m[4] || '' }
}

const NOTE_RE = /\s*\(([^()]*)\)/g

// Nəticə keşi: /hadith axtarışı hər hərfdə ~1400 mənbəni yoxlayır
const cache = new Map()
const CACHE_MAX = 10000

/**
 * Mənbə sətrini cari dilə uyğunlaşdır (az-da dəyişmir).
 * Tanınmayan hissələr olduğu kimi qalır; rəqəmlərə toxunulmur.
 */
export function localizeSource(source, lang = 'az') {
  const src = String(source || '')
  if (!src || !lang || lang === 'az') return src
  const key = lang + '|' + src
  let out = cache.get(key)
  if (out === undefined) {
    if (cache.size >= CACHE_MAX) cache.clear()
    out = localizeUncached(src, lang)
    cache.set(key, out)
  }
  return out
}

function localizeUncached(src, lang) {
  // Mötərizədəki qeydləri ayır: "Tirmizi, Zühd 53 (məna ilə)"
  const notes = []
  const base = src.replace(NOTE_RE, (_, n) => { notes.push(n); return '' }).trim()
  const tail = notes.map(n => ` (${localizeNote(n, lang)})`).join('')

  // Quran ayəsi: "Bəqərə 2:127", "Quran 112:2", "Quran, Hucurat 13"
  const quranComma = /^Quran\s*,\s*/u
  const ref = parseSurahRef(quranComma.test(base) ? base.replace(quranComma, '') : base)
  let out
  if (ref) {
    out = `${QURAN_WORD[lang] || QURAN_WORD.en} ${ref.s}:${ref.a}${ref.rest.replace(/\s+/g, '')}`
  } else {
    out = replacePhrases(base, lang)
    // İngiliscə sətrin əvvəlindəki artikl böyük hərflə: "an-Nasa'i" → "An-Nasa'i"
    if (lang === 'en') out = out.replace(/^(a[a-z]?[a-z]?)-/, (m) => m[0].toUpperCase() + m.slice(1))
  }
  out += tail
  return lang === 'ar' ? out.replace(/, /g, '، ') : out
}
