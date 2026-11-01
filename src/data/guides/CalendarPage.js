// ═══════════════════════════════════════════════════════
// İSLAMİ TƏQVİM — hadisələrin izahı və hicri aylar bələdçisi (/calendar)
// Bloklar src/data/lessons/README.md formatındadır (LessonBlocks göstərir).
//
// YOXLANILIB (2026-10-31):
// • Ayə — api.quran.com (uthmani): 9:36.
// • Hədislər — fawazahmed0/hadith-api (ara-*; Müslim — Fuad Əbdülbaqi nömrəsi,
//   API-də "arabicnumber"): Buxari 969, 1294, 1909, 1913, 1969, 1778, 1997,
//   2024, 2026, 2697, 3197, 3934, 5473, 5757; Müslim 1134, 1141, 1162, 1163,
//   1164, 1348, 1423, 1977; Tirmizi 3513 (əl-Albani: səhih), 3585 (əl-Albani:
//   həsən).
// • Fətvalar (açılıb oxunub): islamqa.info 21290 (yeni il təbriki — İbn Useymin),
//   4033 (Aşura adətləri — İbn Teymiyyə), 75394 (Rəcəb orucu — İbn Həcər, İbn
//   Teymiyyə, İbn Qeyyim, İbn Useymin). 8907 (15 Şaban) — /learn/bidah dərsində.
// • TƏKRARLANMIR: oruc qaydaları (/learn/sunnah-fasts), Mövlud, Rəğaib, Merac və
//   Bərat gecəsi (/learn/bidah), Ramazan və Qədr gecəsi (/ramadan), bayram namazı
//   (/learn/eid-prayer), Zülhiccə və qurban (/learn/dhul-hijjah-ten, /learn/udhiyah).
//   Burada yalnız qısa izah + dəlil + keçid.
// ═══════════════════════════════════════════════════════

import { localizeSource } from '../../utils/sourceNames.js'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const S = (s) => Object.fromEntries(LANGS.map(l => [l, localizeSource(s, l)]))

const URL = {
  qa21290: 'https://islamqa.info/en/answers/21290',
  qa4033: 'https://islamqa.info/en/answers/4033',
  qa75394: 'https://islamqa.info/en/answers/75394',
}

// Keçid etiketləri (bir neçə hadisədə təkrar olunur)
const L = {
  fasts: { kind: 'lesson', slug: 'sunnah-fasts', label: { az: 'Sünnə orucları — dərs', en: 'Sunnah fasts — lesson', ru: 'Желательные посты — урок', ar: 'صيام التطوع — درس', tr: 'Sünnet oruçlar — ders' } },
  bidah: { kind: 'lesson', slug: 'bidah', label: { az: 'Bidət və yayılmış bidətlər — dərs', en: 'Bid‘ah and common innovations — lesson', ru: 'Бида и распространённые нововведения — урок', ar: 'البدعة وأشهر البدع — درس', tr: 'Bid‘at ve yaygın bid‘atler — ders' } },
  ramadan: { kind: 'page', key: 'ramadan', label: { az: 'Ramazan: imsakiyyə və bələdçi', en: 'Ramadan: timetable and guide', ru: 'Рамадан: расписание и руководство', ar: 'رمضان: الإمساكية والدليل', tr: 'Ramazan: imsakiye ve rehber' } },
  eid: { kind: 'lesson', slug: 'eid-prayer', label: { az: 'Bayram namazı — dərs', en: 'The Eid prayer — lesson', ru: 'Праздничная молитва — урок', ar: 'صلاة العيد — درس', tr: 'Bayram namazı — ders' } },
  ten: { kind: 'lesson', slug: 'dhul-hijjah-ten', label: { az: 'Zülhiccənin on günü — dərs', en: 'The ten days of Dhul-Hijjah — lesson', ru: 'Десять дней зуль-хиджи — урок', ar: 'عشر ذي الحجة — درس', tr: 'Zilhiccenin on günü — ders' } },
  udhiyah: { kind: 'lesson', slug: 'udhiyah', label: { az: 'Qurbanın hökmləri — dərs', en: 'Rulings of the udhiyah — lesson', ru: 'Положения жертвоприношения — урок', ar: 'أحكام الأضحية — درس', tr: 'Kurbanın hükümleri — ders' } },
  hajj: { kind: 'page', key: 'hajjguide', label: { az: 'Həcc bələdçisi', en: 'Hajj guide', ru: 'Руководство по хаджу', ar: 'دليل الحج', tr: 'Hac rehberi' } },
  hijri: { kind: 'page', key: 'hijri', label: { az: 'Tarixi çevir: hicri ↔ miladi', en: 'Convert a date: Hijri ↔ Gregorian', ru: 'Перевести дату: хиджра ↔ григорианская', ar: 'تحويل التاريخ: هجري ↔ ميلادي', tr: 'Tarihi çevir: hicri ↔ miladi' } },
}

// Yuxarıdakı «Tarixi çevir» kartı
export const CAL_HIJRI_LINK = L.hijri

export const CAL_GUIDE_TXT = {
  fatwa: { az: 'Fətvanı oxu', en: 'Read the fatwa', ru: 'Читать фетву', ar: 'اقرأ الفتوى', tr: 'Fetvayı oku' },
  info: { az: 'Nə şəriətdir, nə deyil', en: 'What is legislated, what is not', ru: 'Что узаконено, а что нет', ar: 'المشروع وغير المشروع', tr: 'Ne meşrudur, ne değildir' },
  ok: { az: 'Sünnədə olan', en: 'Established in the Sunnah', ru: 'Установлено Сунной', ar: 'الثابت في السنة', tr: 'Sünnette olan' },
  no: { az: 'Əsli olmayan', en: 'Without basis', ru: 'Не имеет основы', ar: 'ما لا أصل له', tr: 'Aslı olmayan' },
  convert: { az: 'Tarixi çevir', en: 'Convert a date', ru: 'Перевести дату', ar: 'تحويل التاريخ', tr: 'Tarihi çevir' },
  convertSub: { az: 'Hicri ↔ miladi çevirici', en: 'Hijri ↔ Gregorian converter', ru: 'Конвертер хиджра ↔ григорианская', ar: 'محوّل هجري ↔ ميلادي', tr: 'Hicri ↔ miladi tarih dönüştürücü' },
  eyebrow: { az: 'Bələdçi', en: 'Guide', ru: 'Руководство', ar: 'دليل', tr: 'Rehber' },
  title: { az: 'Hicri aylar', en: 'The Hijri months', ru: 'Месяцы хиджры', ar: 'الشهور الهجرية', tr: 'Hicri aylar' },
  lead: { az: 'Haram aylar, ayların hilalla başlaması və hər ayda səhih Sünnəyə görə nəyin xüsusi olduğu — həmçinin yayılmış, amma əsli olmayan adətlər.', en: 'The sacred months, how months begin with the crescent and what is specific to each month according to the authentic Sunnah — as well as popular practices that have no basis.', ru: 'Запретные месяцы, начало месяца по молодому месяцу и что особо для каждого месяца по достоверной Сунне, а также распространённые обычаи, не имеющие основы.', ar: 'الأشهر الحرم، وابتداء الشهر برؤية الهلال، وما يختص به كل شهر في السنة الصحيحة، وما اشتهر من عادات لا أصل لها.', tr: 'Haram aylar, ayların hilalle başlaması ve sahih Sünnete göre her aya özgü olanlar — ayrıca yaygın ama aslı olmayan âdetler.' },
  contents: { az: 'Bölmələr', en: 'Sections', ru: 'Разделы', ar: 'الأقسام', tr: 'Bölümler' },
  sources: { az: 'Mənbələr', en: 'Sources', ru: 'Источники', ar: 'المصادر', tr: 'Kaynaklar' },
}

// ═══ Hadisələrin izahı ═══
// Açar: `${ay(0..11)}-${gün}`; ağ günlər — 'white'; təşriq günləri — 'tashreeq'.
// ok — Sünnədə sabit olan (dəlili ilə); no — əsli olmayan (varsa); links — ətraflı.
export function eventInfoKey(e) {
  if (e.month === 11 && e.day >= 11 && e.day <= 13) return 'tashreeq'
  if (e.day === 13 && e.type === 'sunnah') return 'white'
  return `${e.month}-${e.day}`
}

export const CAL_EVENT_INFO = {
  '0-1': {
    ok: { az: 'Hicri il Peyğəmbərin ﷺ hicrətindən sayılır: səhabələr il hesabını nə peyğəmbərlikdən, nə də vəfatdan, yalnız onun Mədinəyə gəlişindən aparırdılar (Buxari 3934). Məhərrəm «Allahın ayı»dır, Ramazandan sonra ən fəzilətli oruc bu aydadır (Müslim 1163).', en: 'The Hijri year is counted from the Prophet’s ﷺ emigration: the Companions counted neither from his mission nor from his death, but from his arrival in Madinah (al-Bukhari 3934). Muharram is “the month of Allah”; the best fasting after Ramadan is in it (Muslim 1163).', ru: 'Год хиджры отсчитывается от переселения Пророка ﷺ: сподвижники вели счёт не от начала пророчества и не от его кончины, а от его прибытия в Медину (аль-Бухари 3934). Мухаррам — «месяц Аллаха», лучший пост после рамадана — в нём (Муслим 1163).', ar: 'يُؤرَّخ بالهجرة؛ قال سهل بن سعد: ما عدّوا من مبعث النبي ﷺ ولا من وفاته، ما عدّوا إلا من مقدمه المدينة (البخاري 3934). والمحرم شهر الله، وأفضل الصيام بعد رمضان صيامه (مسلم 1163).', tr: 'Hicri yıl Peygamber’in ﷺ hicretinden sayılır: sahabe yılı ne nübüvvetten ne vefattan, yalnızca onun Medine’ye gelişinden sayardı (Buhârî 3934). Muharrem “Allah’ın ayı”dır; Ramazan’dan sonra en faziletli oruç bu aydadır (Müslim 1163).' },
    no: { az: 'Yeni il üçün xüsusi namaz, oruc, «ilin son günü» duası və ya bayram yoxdur. İbn Useymin: Sələfin yeni il münasibətilə bir-birini təbrik etdiyini bilmirəm; təbriki özün başlama, amma təbrik edənə xeyir dua ilə cavab ver (İslamQA 21290).', en: 'There is no special prayer, fast, “end-of-year” dua or celebration for the new year. Ibn Uthaymin: I do not know of the Salaf congratulating one another on the new year; do not initiate such greetings, but answer one who congratulates you with a good dua (IslamQA 21290).', ru: 'Для нового года нет особой молитвы, поста, «молитвы конца года» или праздника. Ибн Усаймин: мне неизвестно, чтобы саляф поздравляли друг друга с новым годом; не начинай поздравление сам, но ответь поздравившему благой мольбой («Ислам: вопрос и ответ», 21290).', ar: 'لا تختص رأس السنة بصلاة ولا صيام ولا دعاء لختام العام ولا احتفال. قال ابن عثيمين: لا أعلم أن السلف كانوا يهنئون بالعام الجديد؛ فلا تبدأ بالتهنئة، ومن هنأك فردّ عليه بدعاء طيب (الإسلام سؤال وجواب 21290).', tr: 'Yeni yıl için özel namaz, oruç, “yıl sonu” duası veya kutlama yoktur. İbn Useymîn: Selefin yeni yıl için birbirini tebrik ettiğini bilmiyorum; tebriki sen başlatma, ama tebrik edene hayır duayla karşılık ver (İslam Soru-Cevap 21290).' },
    url: URL.qa21290,
  },
  '0-9': {
    ok: { az: 'Peyğəmbər ﷺ Aşuranı oruc tutanda ona yəhudi və xristianların bu günə hörmət etdiyi deyildi. O buyurdu: «Gələn il, inşallah, doqquzuncu günü də oruc tutarıq» (Müslim 1134). Ona görə Tasua Aşura ilə birlikdə tutulur.', en: 'When the Prophet ﷺ fasted Ashura he was told that the Jews and Christians venerate this day. He said: “Next year, if Allah wills, we will fast the ninth day” (Muslim 1134). So Tasu‘a is fasted together with Ashura.', ru: 'Когда Пророк ﷺ постился в Ашуру, ему сказали, что иудеи и христиане почитают этот день. Он сказал: «В следующем году, если пожелает Аллах, мы будем поститься и в девятый день» (Муслим 1134). Поэтому Тасуа постятся вместе с Ашурой.', ar: 'لما صام النبي ﷺ عاشوراء قيل له: إنه يوم تعظمه اليهود والنصارى، فقال: «فَإِذَا كَانَ الْعَامُ الْمُقْبِلُ - إِنْ شَاءَ اللَّهُ - صُمْنَا الْيَوْمَ التَّاسِعَ» (مسلم 1134)، فيُصام تاسوعاء مع عاشوراء.', tr: 'Peygamber ﷺ Aşure orucunu tuttuğunda ona Yahudi ve Hristiyanların bu güne saygı gösterdiği söylendi. Buyurdu ki: “Gelecek yıl inşallah dokuzuncu günü de oruç tutarız” (Müslim 1134). Bu yüzden Tasua, Aşure ile birlikte tutulur.' },
    links: [L.fasts],
  },
  '0-10': {
    ok: { az: 'Aşura gününün orucu keçən ilin günahlarına kəffarədir (Müslim 1162). Sünnədə bu günə aid sabit olan yalnız orucdur.', en: 'Fasting the Day of Ashura expiates the sins of the past year (Muslim 1162). The only thing established in the Sunnah for this day is fasting.', ru: 'Пост в день Ашура искупает грехи прошедшего года (Муслим 1162). Единственное, что установлено Сунной для этого дня, — пост.', ar: 'صيام عاشوراء يكفّر السنة الماضية (مسلم 1162)، ولم يثبت في هذا اليوم غير الصيام.', tr: 'Aşure gününün orucu geçen yılın günahlarına kefarettir (Müslim 1162). Sünnette bu güne dair sabit olan yalnızca oruçtur.' },
    no: { az: 'Matəm, özünü döymək, yaxa cırmaq: «Üzünə vuran, yaxasını yırtan və cahiliyyə çağırışı ilə çağıran bizdən deyil» (Buxari 1294). Bu günü bayrama çevirmək də — sürmə, qüsl, xına, xüsusi yemək, ailəyə bolluq «ritualı» — İbn Teymiyyəyə görə heç bir səhih hədisə əsaslanmır və bidətdir (İslamQA 4033).', en: 'Mourning, beating oneself and tearing clothes: “He is not one of us who strikes his cheeks, tears his garment and calls with the call of Jahiliyyah” (al-Bukhari 1294). Turning the day into a festival — kohl, ghusl, henna, special food, a “ritual” of generosity to the family — is, according to Ibn Taymiyyah, based on no authentic hadith and is an innovation (IslamQA 4033).', ru: 'Траур, самоистязание, разрывание одежды: «Не из нас тот, кто бьёт себя по щекам, разрывает ворот и взывает призывом джахилии» (аль-Бухари 1294). Превращать этот день в праздник — сурьма, гусль, хна, особая еда, «обряд» щедрости к семье — по словам Ибн Таймии, не основано ни на одном достоверном хадисе и является нововведением («Ислам: вопрос и ответ», 4033).', ar: 'المآتم ولطم الخدود وشق الجيوب؛ لقوله ﷺ: «لَيْسَ مِنَّا مَنْ لَطَمَ الْخُدُودَ، وَشَقَّ الْجُيُوبَ، وَدَعَا بِدَعْوَى الْجَاهِلِيَّةِ» (البخاري 1294). واتخاذه عيدًا بالاكتحال والاغتسال والخضاب والأطعمة والتوسعة على العيال — قال ابن تيمية: لم يرد في ذلك حديث صحيح، وهو بدعة (الإسلام سؤال وجواب 4033).', tr: 'Matem, kendini dövmek, yaka yırtmak: “Yanaklarına vuran, yakasını yırtan ve cahiliye çağrısıyla çağıran bizden değildir” (Buhârî 1294). Bu günü bayrama çevirmek — sürme, gusül, kına, özel yemek, aileye bolluk “ritüeli” — İbn Teymiyye’ye göre hiçbir sahih hadise dayanmaz ve bid‘attir (İslam Soru-Cevap 4033).' },
    url: URL.qa4033,
    links: [L.fasts],
  },
  '1-1': {
    ok: { az: 'Səfər adi aydır; ona aid xüsusi ibadət yoxdur.', en: 'Safar is an ordinary month; no special worship is tied to it.', ru: 'Сафар — обычный месяц; особых обрядов поклонения для него нет.', ar: 'صفر شهر كسائر الشهور، لا تختص به عبادة.', tr: 'Safer sıradan bir aydır; ona özgü bir ibadet yoktur.' },
    no: { az: 'Səfəri uğursuz saymaq, toy və səfəri təxirə salmaq, «bəladan qorunmaq» üçün xüsusi namaz və adətlər. Peyğəmbər ﷺ buyurdu: «Yoluxma (Allahın izni olmadan), uğursuzluq, bayquş (inancı) və Səfər (uğursuzluğu) yoxdur» (Buxari 5757).', en: 'Regarding Safar as unlucky, postponing weddings and journeys, and special prayers or customs to “ward off calamity”. The Prophet ﷺ said: “There is no contagion (without Allah’s decree), no evil omen, no hamah and no Safar” (al-Bukhari 5757).', ru: 'Считать сафар несчастливым, откладывать свадьбы и поездки, совершать особые молитвы и обряды «для защиты от бед». Пророк ﷺ сказал: «Нет заразы (без предопределения Аллаха), нет дурных примет, нет хамы и нет сафара» (аль-Бухари 5757).', ar: 'التشاؤم بصفر وتأجيل الزواج والسفر فيه، والصلوات والعادات الخاصة لدفع البلاء؛ قال ﷺ: «لاَ عَدْوَى، وَلاَ طِيَرَةَ، وَلاَ هَامَةَ، وَلاَ صَفَرَ» (البخاري 5757).', tr: 'Safer’i uğursuz saymak, düğünleri ve yolculukları ertelemek, “beladan korunmak” için özel namaz ve âdetler. Peygamber ﷺ buyurdu: “Bulaşma (Allah’ın takdiri olmadan), uğursuzluk, baykuş (inancı) ve Safer (uğursuzluğu) yoktur” (Buhârî 5757).' },
  },
  '2-1': {
    ok: { az: 'Bu ayda xüsusi ibadət sabit deyil. Peyğəmbərin ﷺ doğulduğu üçün şükrün sünnə yolu hər həftə bazar ertəsi orucudur: «Bu, doğulduğum gündür» (Müslim 1162).', en: 'No special worship is established in this month. The Sunnah way of giving thanks for the Prophet’s ﷺ birth is the weekly Monday fast: “That is the day I was born” (Muslim 1162).', ru: 'Особого поклонения в этом месяце не установлено. Сунна благодарности за рождение Пророка ﷺ — еженедельный пост в понедельник: «Это день, в который я родился» (Муслим 1162).', ar: 'لم يثبت في هذا الشهر عبادة خاصة، والسنة في شكر نعمة مولده ﷺ صيام الاثنين كل أسبوع: «ذَاكَ يَوْمٌ وُلِدْتُ فِيهِ» (مسلم 1162).', tr: 'Bu ayda özel bir ibadet sabit değildir. Peygamber’in ﷺ doğumuna şükrün sünnet yolu her hafta pazartesi orucudur: “O, doğduğum gündür” (Müslim 1162).' },
    no: { az: 'Mövlud bayramı və ona xas məclislər — nə Peyğəmbər ﷺ, nə səhabələr, nə də ilk nəsillər bunu etməmişlər.', en: 'The Mawlid celebration and gatherings specific to it — neither the Prophet ﷺ, nor the Companions, nor the first generations did this.', ru: 'Празднование мавлида и особые собрания по этому случаю — этого не делали ни Пророк ﷺ, ни сподвижники, ни первые поколения.', ar: 'الاحتفال بالمولد ومجالسه الخاصة؛ لم يفعله النبي ﷺ ولا أصحابه ولا القرون المفضلة.', tr: 'Mevlid kutlaması ve ona özgü meclisler — bunu ne Peygamber ﷺ, ne sahabe, ne de ilk nesiller yapmıştır.' },
    links: [L.bidah],
  },
  '5-1': {
    ok: { az: 'Cəmadiyül-Axirdə xüsusi ibadət yoxdur. Hər ay üçün olan ümumi sünnələr — bazar ertəsi və cümə axşamı orucu, ağ günlər — bu ayda da davam edir.', en: 'There is no special worship in Jumada al-Thani. The general sunnahs of every month — fasting Mondays and Thursdays, the white days — continue in it.', ru: 'В джумада ас-сани нет особого поклонения. Общие сунны каждого месяца — пост по понедельникам и четвергам, белые дни — продолжаются и в нём.', ar: 'لا تختص جمادى الآخرة بعبادة، والسنن العامة في كل شهر — كصيام الاثنين والخميس والأيام البيض — باقية فيه.', tr: 'Cemaziyelahir’de özel bir ibadet yoktur. Her ay için olan genel sünnetler — pazartesi ve perşembe orucu, beyaz günler — bu ayda da devam eder.' },
    links: [L.fasts],
  },
  '6-1': {
    ok: { az: 'Rəcəb dörd haram aydan biridir (Buxari 3197): bu aylarda zülmdən və günahdan xüsusilə çəkinmək lazımdır (Tövbə, 9:36).', en: 'Rajab is one of the four sacred months (al-Bukhari 3197): in these months one must be especially careful to avoid wrongdoing and sin (at-Tawbah 9:36).', ru: 'Раджаб — один из четырёх запретных месяцев (аль-Бухари 3197): в эти месяцы нужно особенно остерегаться несправедливости и грехов (ат-Тауба, 9:36).', ar: 'رجب أحد الأشهر الحرم الأربعة (البخاري 3197)، فيتأكد فيه اجتناب الظلم والمعاصي (التوبة: 36).', tr: 'Recep dört haram aydan biridir (Buhârî 3197): bu aylarda zulümden ve günahtan özellikle sakınmak gerekir (Tevbe 9:36).' },
    no: { az: 'Rəcəbi oruc və gecə namazı ilə xüsusiləşdirmək — İbn Həcər: «Rəcəbin fəziləti barədə dəlil ola biləcək səhih hədis yoxdur»; Rəğaib namazı; 27 Rəcəbi Merac gecəsi kimi qeyd etmək (İbn Useymin: bidətdir) (İslamQA 75394). Cahiliyyədəki Rəcəb qurbanı (ətirə) ləğv edilib: «Fəra da, ətirə də yoxdur» (Buxari 5473).', en: 'Singling out Rajab for fasting and night prayer — Ibn Hajar: “There is no sahih hadith that would count as evidence for the virtue of the month of Rajab”; the Raghaib prayer; celebrating 27 Rajab as the night of the Mi‘raj (Ibn Uthaymin: an innovation) (IslamQA 75394). The pre-Islamic Rajab sacrifice (‘atirah) was abolished: “There is no fara‘ and no ‘atirah” (al-Bukhari 5473).', ru: 'Выделять раджаб постом и ночной молитвой — Ибн Хаджар: «Нет достоверного хадиса, который служил бы доводом о достоинстве месяца раджаб»; молитва рагаиб; отмечать 27 раджаба как ночь мираджа (Ибн Усаймин: нововведение) («Ислам: вопрос и ответ», 75394). Доисламское жертвоприношение раджаба (атира) отменено: «Нет ни фара, ни атиры» (аль-Бухари 5473).', ar: 'تخصيص رجب بصيام أو قيام؛ قال ابن حجر: لم يرد في فضل شهر رجب حديث صحيح يصلح للحجة. وصلاة الرغائب، والاحتفال بليلة السابع والعشرين على أنها ليلة المعراج (قال ابن عثيمين: بدعة) (الإسلام سؤال وجواب 75394). وذبيحة رجب في الجاهلية أُبطلت: «لاَ فَرَعَ وَلاَ عَتِيرَةَ» (البخاري 5473).', tr: 'Recep’i oruç ve gece namazıyla özel kılmak — İbn Hacer: “Recep ayının faziletine dair delil olabilecek sahih bir hadis yoktur”; Regaib namazı; 27 Recep’i Miraç gecesi olarak kutlamak (İbn Useymîn: bid‘attir) (İslam Soru-Cevap 75394). Cahiliyedeki Recep kurbanı (atîre) kaldırılmıştır: “Fera‘ da yoktur, atîre de” (Buhârî 5473).' },
    url: URL.qa75394,
    links: [L.bidah],
  },
  '7-1': {
    ok: { az: 'Peyğəmbər ﷺ Ramazandan başqa heç bir ayda Şabandakı qədər çox oruc tutmazdı (Buxari 1969).', en: 'The Prophet ﷺ did not fast in any month, other than Ramadan, as much as he fasted in Sha‘ban (al-Bukhari 1969).', ru: 'Ни в один месяц, кроме рамадана, Пророк ﷺ не постился так много, как в шабане (аль-Бухари 1969).', ar: 'كان النبي ﷺ لا يصوم في شهر غير رمضان أكثر مما يصوم في شعبان (البخاري 1969).', tr: 'Peygamber ﷺ Ramazan dışında hiçbir ayda Şaban’daki kadar çok oruç tutmazdı (Buhârî 1969).' },
    no: { az: '15 Şaban gecəsini (Bərat) xüsusi namaz, oruc və ya məclislə ayırmaq — bu barədə səhih mərfu hədis yoxdur; Ramazan ehtiyatı ilə şəkk günü (Şabanın 30-u) oruc tutmaq.', en: 'Setting apart the night of 15 Sha‘ban (Barat) with special prayer, fasting or gatherings — there is no sahih marfu‘ hadith about it; fasting the day of doubt (30 Sha‘ban) as a precaution for Ramadan.', ru: 'Выделять ночь 15 шабана (Барат) особой молитвой, постом или собраниями — об этом нет достоверного возведённого к Пророку хадиса; поститься в день сомнения (30 шабана) из предосторожности ради рамадана.', ar: 'تخصيص ليلة النصف من شعبان بصلاة أو صيام أو اجتماع، ولم يصح فيها حديث مرفوع؛ وصوم يوم الشك (الثلاثين من شعبان) احتياطًا لرمضان.', tr: '15 Şaban gecesini (Berat) özel namaz, oruç veya toplantıyla ayırmak — bu konuda sahih merfû hadis yoktur; Ramazan’a ihtiyaten şek günü (Şaban’ın 30’u) oruç tutmak.' },
    links: [L.fasts, L.bidah],
  },
  '8-1': {
    ok: { az: 'Ramazan orucu fərzdir və hilalın görünməsi ilə başlayır: «Onu (hilalı) görəndə oruc tutun, görəndə orucu açın; buludlu olsa, Şabanı otuz günə tamamlayın» (Buxari 1909).', en: 'Fasting Ramadan is obligatory and begins with the sighting of the crescent: “Fast when you see it and end the fast when you see it; if it is hidden from you, complete Sha‘ban as thirty days” (al-Bukhari 1909).', ru: 'Пост рамадана обязателен и начинается с появления молодого месяца: «Начинайте пост, увидев его, и прекращайте, увидев его; если же он скрыт от вас, завершите шабан тридцатью днями» (аль-Бухари 1909).', ar: 'صيام رمضان فرض، ويبدأ برؤية الهلال: «صُومُوا لِرُؤْيَتِهِ، وَأَفْطِرُوا لِرُؤْيَتِهِ، فَإِنْ غُبِّيَ عَلَيْكُمْ فَأَكْمِلُوا عِدَّةَ شَعْبَانَ ثَلاَثِينَ» (البخاري 1909).', tr: 'Ramazan orucu farzdır ve hilalin görülmesiyle başlar: “Onu görünce oruç tutun, onu görünce bayram edin; bulutlu olursa Şaban’ı otuza tamamlayın” (Buhârî 1909).' },
    links: [L.ramadan],
  },
  '8-21': {
    ok: { az: 'Son on gecədə Peyğəmbər ﷺ belini möhkəm bağlayar, gecəni ibadətlə dirildər və ailəsini oyadardı (Buxari 2024); vəfatına qədər bu günlərdə etikafa çəkilərdi (Buxari 2026). Qədr gecəsinin duası: «Allahummə innəkə afuvvun tuhibbul-afvə fəfu anni» (Tirmizi 3513). Qədr gecəsinin tarixi qəti deyil — bütün on gecədə axtarılır.', en: 'In the last ten nights the Prophet ﷺ would tighten his waist-wrapper, give life to the night in worship and wake his family (al-Bukhari 2024); until his death he observed i‘tikaf in them (al-Bukhari 2026). The dua for Laylat al-Qadr: “Allahumma innaka ‘afuwwun tuhibbul-‘afwa fa‘fu ‘anni” (at-Tirmidhi 3513). Its date is not certain — it is sought in all ten nights.', ru: 'В последние десять ночей Пророк ﷺ туго подвязывал изар, оживлял ночь поклонением и будил семью (аль-Бухари 2024); до самой кончины он совершал в эти дни итикаф (аль-Бухари 2026). Мольба Ночи предопределения: «Аллахумма иннака афуввун тухиббуль-афва фа‘фу анни» (ат-Тирмизи 3513). Её дата не определена точно — её ищут во все десять ночей.', ar: 'كان النبي ﷺ إذا دخل العشر شدّ مئزره وأحيا ليله وأيقظ أهله (البخاري 2024)، وكان يعتكفها حتى توفاه الله (البخاري 2026). ودعاء ليلة القدر: «اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي» (الترمذي 3513). ولا يُجزم بتعيينها، بل تُتحرّى في العشر كلها.', tr: 'Son on gecede Peygamber ﷺ kuşağını sıkıca bağlar, geceyi ibadetle ihya eder ve ailesini uyandırırdı (Buhârî 2024); vefatına kadar bu günlerde itikâfa girerdi (Buhârî 2026). Kadir gecesinin duası: “Allâhümme inneke afüvvün tuhibbü’l-afve fa‘fu annî” (Tirmizî 3513). Tarihi kesin değildir — on gecenin hepsinde aranır.' },
    links: [L.ramadan],
  },
  '9-1': {
    ok: { az: 'Bayram namazı, namazdan əvvəl fitrə zəkatını vermək, namaza getməzdən əvvəl tək sayda xurma yemək, təkbir. Bayram günü oruc tutmaq haramdır.', en: 'The Eid prayer, giving zakat al-fitr before the prayer, eating an odd number of dates before going out, and the takbir. Fasting on the day of Eid is haram.', ru: 'Праздничная молитва, выплата закят аль-фитра до молитвы, нечётное число фиников перед выходом, такбир. Поститься в день праздника запрещено.', ar: 'صلاة العيد، وإخراج زكاة الفطر قبل الصلاة، وأكل تمرات وترًا قبل الخروج، والتكبير؛ ويحرم صوم يوم العيد.', tr: 'Bayram namazı, namazdan önce fıtır sadakasını vermek, namaza çıkmadan tek sayıda hurma yemek ve tekbir. Bayram günü oruç tutmak haramdır.' },
    links: [L.eid, L.ramadan],
  },
  '9-2': {
    ok: { az: '«Kim Ramazanı oruc tutub ardınca Şəvvaldan altı gün tutsa, bütün il oruc tutmuş kimidir» (Müslim 1164). Altı gün bayramdan sonra Şəvvalın istənilən günlərində tutula bilər.', en: '“Whoever fasts Ramadan and follows it with six days of Shawwal, it is as if he fasted for a lifetime” (Muslim 1164). The six days may be any days of Shawwal after Eid.', ru: '«Кто постился в рамадан, а затем добавил к нему шесть дней шавваля, тот словно постился всю жизнь» (Муслим 1164). Шесть дней можно поститься в любые дни шавваля после праздника.', ar: '«مَنْ صَامَ رَمَضَانَ ثُمَّ أَتْبَعَهُ سِتًّا مِنْ شَوَّالٍ كَانَ كَصِيَامِ الدَّهْرِ» (مسلم 1164)، وتُصام في أي أيام شوال بعد العيد.', tr: '“Kim Ramazan orucunu tutar, ardından Şevval’den altı gün tutarsa, bütün yılı oruçla geçirmiş gibidir” (Müslim 1164). Altı gün bayramdan sonra Şevval’in herhangi günlerinde tutulabilir.' },
    no: { az: 'Şəvvalda evlənməyi uğursuz saymaq. Aişə deyirdi: «Allahın Elçisi ﷺ mənimlə Şəvvalda evləndi və Şəvvalda zifafa girdi; onun yanında məndən daha xoşbəxt qadını kim idi?» (Müslim 1423).', en: 'Regarding marriage in Shawwal as unlucky. Aishah said: “The Messenger of Allah ﷺ married me in Shawwal and consummated the marriage in Shawwal — which of his wives was more favoured by him than me?” (Muslim 1423).', ru: 'Считать брак в шаввале несчастливым. Аиша говорила: «Посланник Аллаха ﷺ женился на мне в шаввале и вошёл ко мне в шаввале — какая из его жён была ему милее меня?» (Муслим 1423).', ar: 'التشاؤم بالزواج في شوال؛ قالت عائشة: «تَزَوَّجَنِي رَسُولُ اللَّهِ ﷺ فِي شَوَّالٍ وَبَنَى بِي فِي شَوَّالٍ، فَأَيُّ نِسَاءِ رَسُولِ اللَّهِ ﷺ كَانَ أَحْظَى عِنْدَهُ مِنِّي» (مسلم 1423).', tr: 'Şevval’de evlenmeyi uğursuz saymak. Âişe derdi ki: “Allah’ın Resûlü ﷺ benimle Şevval’de evlendi ve Şevval’de gerdeğe girdi; onun yanında benden daha talihli hanımı kimdi?” (Müslim 1423).' },
    links: [L.fasts],
  },
  '11-1': {
    ok: { az: 'İlin ən fəzilətli günləridir: «Bu günlərdəki əməldən daha fəzilətli əməl yoxdur» (Buxari 969). Təkbir, ilk doqquz gündə oruc, çoxlu zikr; qurban kəsmək niyyətində olan saçından və dırnağından heç nə almır (Müslim 1977).', en: 'These are the best days of the year: “No deeds are better than deeds done in these days” (al-Bukhari 969). Takbir, fasting the first nine days, abundant dhikr; one who intends to sacrifice takes nothing from his hair or nails (Muslim 1977).', ru: 'Это лучшие дни года: «Нет дел лучше, чем дела, совершённые в эти дни» (аль-Бухари 969). Такбир, пост в первые девять дней, обильное поминание Аллаха; намеревающийся принести жертву ничего не срезает с волос и ногтей (Муслим 1977).', ar: 'أفضل أيام العام: «مَا الْعَمَلُ فِي أَيَّامٍ أَفْضَلَ مِنْهَا فِي هَذِهِ» (البخاري 969)؛ ففيها التكبير وصيام التسع والإكثار من الذكر، ومن أراد أن يضحي فلا يأخذ من شعره وأظفاره شيئًا (مسلم 1977).', tr: 'Yılın en faziletli günleridir: “Bu günlerde yapılan amelden daha faziletli amel yoktur” (Buhârî 969). Tekbir, ilk dokuz gün oruç, bolca zikir; kurban kesmeye niyetli olan saçından ve tırnağından bir şey almaz (Müslim 1977).' },
    links: [L.ten, L.udhiyah],
  },
  '11-8': {
    ok: { az: 'Tərviyə günü hacılar ihrama girib Minaya gedir və orada namazları qılırlar. Hacı olmayanlar üçün bu gün Zülhiccənin on gününün bir hissəsidir; ona ayrıca aid xüsusi ibadət sabit deyil.', en: 'On the Day of Tarwiyah pilgrims enter ihram, go to Mina and pray there. For those not on Hajj it is part of the ten days of Dhul-Hijjah; no worship specific to this day alone is established.', ru: 'В день Тарвия паломники входят в ихрам, отправляются в Мину и молятся там. Для не совершающих хадж это часть десяти дней зуль-хиджи; особого поклонения именно для этого дня не установлено.', ar: 'يوم التروية يُحرم الحجاج ويخرجون إلى منى ويصلّون بها، وهو لغير الحاج من عشر ذي الحجة، ولم تثبت عبادة يختص بها وحده.', tr: 'Terviye günü hacılar ihrama girer, Mina’ya gider ve orada namazlarını kılar. Hacı olmayanlar için bu gün Zilhiccenin on gününün bir parçasıdır; yalnızca bu güne özgü bir ibadet sabit değildir.' },
    links: [L.hajj, L.ten],
  },
  '11-9': {
    ok: { az: 'Hacı olmayan üçün Ərəfə orucu keçən və gələn ilin günahlarına kəffarədir (Müslim 1162). «Duanın ən xeyirlisi Ərəfə günü edilən duadır» (Tirmizi 3585, əl-Albani: həsən). Allahın Oddan ən çox qul azad etdiyi gün Ərəfə günüdür (Müslim 1348). Bu günün sübhündən təşriq günlərinin sonuna qədər namazlardan sonra təkbir deyilir.', en: 'For those not on Hajj, fasting the Day of Arafah expiates the past and the coming year (Muslim 1162). “The best dua is the dua of the Day of Arafah” (at-Tirmidhi 3585, al-Albani: hasan). There is no day on which Allah frees more servants from the Fire than the Day of Arafah (Muslim 1348). From the Fajr of this day until the end of the days of Tashreeq, takbir is said after the prayers.', ru: 'Для не совершающих хадж пост в день Арафа искупает грехи прошедшего и следующего года (Муслим 1162). «Лучшая мольба — мольба в день Арафа» (ат-Тирмизи 3585, аль-Альбани: хороший). Нет дня, в который Аллах освобождал бы от Огня больше рабов, чем в день Арафа (Муслим 1348). С утра этого дня до конца дней ташрика после молитв произносят такбир.', ar: 'صيام يوم عرفة لغير الحاج يكفّر السنة الماضية والباقية (مسلم 1162)، و«خَيْرُ الدُّعَاءِ دُعَاءُ يَوْمِ عَرَفَةَ» (الترمذي 3585، حسنه الألباني)، وما من يوم أكثر من أن يعتق الله فيه عبدًا من النار من يوم عرفة (مسلم 1348). ويُكبَّر عقب الصلوات من فجره إلى آخر أيام التشريق.', tr: 'Hacı olmayan için Arefe orucu geçmiş ve gelecek yılın günahlarına kefarettir (Müslim 1162). “Duanın en hayırlısı Arefe günü yapılan duadır” (Tirmizî 3585, Elbânî: hasen). Allah’ın ateşten en çok kul azat ettiği gün Arefe günüdür (Müslim 1348). Bu günün sabahından teşrik günlerinin sonuna kadar namazlardan sonra tekbir getirilir.' },
    links: [L.ten],
  },
  '11-10': {
    ok: { az: 'Bayram namazı, sonra qurbanın kəsilməsi — qurban bayram namazından sonra kəsilir. Sünnə budur ki, namazdan əvvəl yeməsin, namazdan sonra (qurbanından) yesin. Bayram günü oruc tutmaq haramdır.', en: 'The Eid prayer, then slaughtering the sacrifice — the udhiyah is slaughtered after the Eid prayer. The Sunnah is not to eat before the prayer and to eat (from one’s sacrifice) after it. Fasting on the day of Eid is haram.', ru: 'Праздничная молитва, затем жертвоприношение — жертву режут после праздничной молитвы. Сунна — не есть до молитвы, а после неё есть (от своей жертвы). Поститься в день праздника запрещено.', ar: 'صلاة العيد ثم ذبح الأضحية بعد الصلاة، والسنة ألا يأكل حتى يصلي ثم يأكل من أضحيته، ويحرم صوم يوم العيد.', tr: 'Bayram namazı, ardından kurbanın kesilmesi — kurban bayram namazından sonra kesilir. Sünnet, namazdan önce yememek, namazdan sonra (kurbanından) yemektir. Bayram günü oruç tutmak haramdır.' },
    links: [L.eid, L.udhiyah],
  },
  tashreeq: {
    ok: { az: '«Təşriq günləri yemək və içmək günləridir» (Müslim 1141) — həm də Allahı zikr və təkbir günləridir. Bu günlərdə oruc tutmaq caiz deyil; yalnız qurbanlıq heyvan tapmayan hacıya icazə verilib (Buxari 1997).', en: '“The days of Tashreeq are days of eating and drinking” (Muslim 1141) — and days of remembering Allah and takbir. Fasting in them is not permitted, except for a pilgrim who could not find a sacrificial animal (al-Bukhari 1997).', ru: '«Дни ташрика — дни еды и питья» (Муслим 1141), а также дни поминания Аллаха и такбира. Поститься в эти дни нельзя; разрешено лишь паломнику, не нашедшему жертвенного животного (аль-Бухари 1997).', ar: '«أَيَّامُ التَّشْرِيقِ أَيَّامُ أَكْلٍ وَشُرْبٍ» (مسلم 1141) وذكر لله وتكبير، ولا يجوز صومها إلا لمن لم يجد الهدي من الحجاج (البخاري 1997).', tr: '“Teşrik günleri yeme ve içme günleridir” (Müslim 1141) — aynı zamanda Allah’ı zikir ve tekbir günleridir. Bu günlerde oruç tutmak caiz değildir; yalnızca kurbanlık bulamayan hacıya izin verilmiştir (Buhârî 1997).' },
    links: [L.ten],
  },
  white: {
    ok: { az: 'Hər ay üç gün oruc tutmaq sünnədir; ən fəzilətlisi ayın 13-ü, 14-ü və 15-idir — ay bu gecələrdə bütöv olduğuna görə «ağ günlər» adlanır.', en: 'Fasting three days every month is Sunnah; best are the 13th, 14th and 15th — called the “white days” because the moon is full on those nights.', ru: 'Пост трёх дней каждого месяца — сунна; лучше всего 13, 14 и 15 числа — «белые дни», названные так потому, что в эти ночи луна полная.', ar: 'صيام ثلاثة أيام من كل شهر سنة، وأفضلها الثالث عشر والرابع عشر والخامس عشر، وتسمى الأيام البيض لاكتمال القمر في لياليها.', tr: 'Her ay üç gün oruç tutmak sünnettir; en faziletlisi ayın 13, 14 ve 15’idir — bu gecelerde ay dolunay olduğu için “beyaz günler” denir.' },
    links: [L.fasts],
  },
}

// ═══ Hicri aylar bələdçisi ═══
export const CAL_MONTHS_GUIDE = [
  {
    id: 'sacred',
    icon: 'star',
    title: {
      az: 'On iki ay və dörd haram ay',
      en: 'Twelve months and four sacred months',
      ru: 'Двенадцать месяцев и четыре запретных',
      ar: 'اثنا عشر شهرًا منها أربعة حرم',
      tr: 'On iki ay ve dört haram ay',
    },
    blocks: [
      {
        t: 'ayah',
        ref: '9:36',
        ar: 'إِنَّ عِدَّةَ ٱلشُّهُورِ عِندَ ٱللَّهِ ٱثْنَا عَشَرَ شَهْرًا فِى كِتَـٰبِ ٱللَّهِ يَوْمَ خَلَقَ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضَ مِنْهَآ أَرْبَعَةٌ حُرُمٌ ۚ ذَٰلِكَ ٱلدِّينُ ٱلْقَيِّمُ ۚ فَلَا تَظْلِمُوا۟ فِيهِنَّ أَنفُسَكُمْ',
        text: {
          az: '«Həqiqətən, Allah yanında ayların sayı göyləri və yeri yaratdığı gün Allahın Kitabında on ikidir. Onlardan dördü haramdır. Bu, doğru dindir. Bu aylarda özünüzə zülm etməyin.»',
          en: '“Indeed, the number of months with Allah is twelve in the Book of Allah, on the day He created the heavens and the earth; of these, four are sacred. That is the upright religion, so do not wrong yourselves during them.”',
          ru: '«Воистину, число месяцев у Аллаха — двенадцать, согласно Писанию Аллаха, в день, когда Он сотворил небеса и землю. Четыре из них — запретные. Такова правая религия, так не поступайте же в них несправедливо по отношению к самим себе».',
          tr: '“Şüphesiz Allah katında ayların sayısı, gökleri ve yeri yarattığı gün Allah’ın Kitabı’nda on ikidir. Bunlardan dördü haram aylardır. İşte dosdoğru din budur. Bu aylarda kendinize zulmetmeyin.”',
        },
      },
      {
        t: 'hadith',
        src: {
          az: 'Buxari 3197',
          en: 'Bukhari 3197',
          ru: 'Бухари 3197',
          ar: 'البخاري 3197',
          tr: 'Buhârî 3197',
        },
        ar: 'السَّنَةُ اثْنَا عَشَرَ شَهْرًا، مِنْهَا أَرْبَعَةٌ حُرُمٌ، ثَلاَثَةٌ مُتَوَالِيَاتٌ ذُو الْقَعْدَةِ وَذُو الْحِجَّةِ وَالْمُحَرَّمُ، وَرَجَبُ مُضَرَ الَّذِي بَيْنَ جُمَادَى وَشَعْبَانَ',
        text: {
          az: '«İl on iki aydır, onlardan dördü haramdır: üçü ardıcıl — Zülqədə, Zülhiccə və Məhərrəm, bir də Cəmadi ilə Şaban arasındakı Mudar qəbiləsinin Rəcəbi.»',
          en: '“The year is twelve months, four of which are sacred: three in succession — Dhul-Qa‘dah, Dhul-Hijjah and Muharram — and the Rajab of Mudar, which comes between Jumada and Sha‘ban.”',
          ru: '«В году двенадцать месяцев, четыре из них запретные: три идут подряд — зуль-каада, зуль-хиджа и мухаррам, а также раджаб мударитов, который между джумада и шабаном».',
          tr: '“Yıl on iki aydır, bunlardan dördü haramdır: üçü art arda — Zilkade, Zilhicce ve Muharrem — bir de Cemaziyelahir ile Şaban arasındaki Mudar’ın Recep’i.”',
        },
      },
      {
        t: 'p',
        text: {
          az: 'Haram aylarda günah daha ağır, saleh əməl isə daha dəyərlidir; ayədəki «özünüzə zülm etməyin» əmri bunu bildirir. Lakin bu aylara aid olan şey — günahdan çəkinməyin vurğulanmasıdır, Sünnədə olmayan xüsusi namaz və mərasimlər deyil.',
          en: 'In the sacred months sins weigh more heavily and good deeds are more valued — this is what “do not wrong yourselves” in the verse indicates. What these months call for is extra care to avoid sin, not special prayers and ceremonies that are not in the Sunnah.',
          ru: 'В запретные месяцы грехи тяжелее, а праведные дела ценнее — на это указывает повеление «не поступайте несправедливо по отношению к себе» в аяте. Эти месяцы требуют особой осторожности в отношении грехов, а не особых молитв и обрядов, которых нет в Сунне.',
          ar: 'الذنب في الأشهر الحرم أعظم، والعمل الصالح فيها أعظم أجرًا، وهو معنى قوله: ﴿فَلَا تَظْلِمُوا فِيهِنَّ أَنفُسَكُمْ﴾، والمشروع فيها مزيد الحذر من المعاصي، لا عبادات وطقوس خاصة لم ترد بها السنة.',
          tr: 'Haram aylarda günah daha ağır, salih amel daha değerlidir; ayetteki “kendinize zulmetmeyin” emri bunu bildirir. Bu ayların gerektirdiği şey günahtan sakınmaya daha çok özen göstermektir; Sünnette olmayan özel namaz ve törenler değil.',
        },
      },
    ],
  },
  {
    id: 'crescent',
    icon: 'moonStar',
    title: {
      az: 'Ay hilalla başlayır',
      en: 'Each month begins with the crescent',
      ru: 'Месяц начинается с молодой луны',
      ar: 'الشهر يبدأ برؤية الهلال',
      tr: 'Ay hilalle başlar',
    },
    blocks: [
      {
        t: 'hadith',
        src: {
          az: 'Buxari 1913',
          en: 'Bukhari 1913',
          ru: 'Бухари 1913',
          ar: 'البخاري 1913',
          tr: 'Buhârî 1913',
        },
        ar: 'إِنَّا أُمَّةٌ أُمِّيَّةٌ، لاَ نَكْتُبُ وَلاَ نَحْسُبُ، الشَّهْرُ هَكَذَا وَهَكَذَا',
        text: {
          az: '«Biz ümmi bir ümmətik, yazmırıq və hesablamırıq. Ay belədir və belədir» — yəni bəzən iyirmi doqquz, bəzən otuz gün.',
          en: '“We are an unlettered nation; we do not write or calculate. The month is like this and like this” — meaning sometimes twenty-nine and sometimes thirty days.',
          ru: '«Мы — неграмотная община, мы не пишем и не считаем. Месяц — вот такой и вот такой», то есть иногда двадцать девять, а иногда тридцать дней.',
          tr: '“Biz ümmî bir ümmetiz; yazmayız ve hesap etmeyiz. Ay şöyle ve şöyledir” — yani bazen yirmi dokuz, bazen otuz gün.',
        },
      },
      {
        t: 'list',
        items: [
          {
            az: 'Hicri ay yeni hilalın görünməsi ilə başlayır və 29 və ya 30 gün olur; hilal görünməzsə, ay 30 günə tamamlanır (Buxari 1909).',
            en: 'A Hijri month begins with the sighting of the new crescent and lasts 29 or 30 days; if the crescent is not seen, the month is completed as 30 days (al-Bukhari 1909).',
            ru: 'Месяц хиджры начинается с появления нового месяца и длится 29 или 30 дней; если молодой месяц не виден, месяц завершают тридцатью днями (аль-Бухари 1909).',
            ar: 'يبدأ الشهر الهجري برؤية الهلال، ويكون تسعة وعشرين أو ثلاثين يومًا، فإن لم يُرَ الهلال أُكمل ثلاثين (البخاري 1909).',
            tr: 'Hicri ay yeni hilalin görülmesiyle başlar ve 29 ya da 30 gündür; hilal görülmezse ay 30 güne tamamlanır (Buhârî 1909).',
          },
          {
            az: 'Hicri il təxminən 354–355 gündür, ona görə bayramlar və Ramazan hər il miladi təqvimdə təxminən 11 gün əvvələ keçir və bütün fəsillərə düşür.',
            en: 'The Hijri year is about 354–355 days, so the Eids and Ramadan move about 11 days earlier in the Gregorian calendar each year and pass through all the seasons.',
            ru: 'Год хиджры длится около 354–355 дней, поэтому праздники и рамадан каждый год смещаются в григорианском календаре примерно на 11 дней раньше и проходят через все времена года.',
            ar: 'السنة الهجرية نحو 354–355 يومًا، فتتقدم الأعياد ورمضان في التقويم الميلادي نحو أحد عشر يومًا كل عام وتدور على الفصول كلها.',
            tr: 'Hicri yıl yaklaşık 354–355 gündür; bu yüzden bayramlar ve Ramazan her yıl miladi takvimde yaklaşık 11 gün öne kayar ve bütün mevsimleri dolaşır.',
          },
          {
            az: 'Bu səhifədəki tarixlər Ümmül-Qura hesablamasına əsaslanır. Oruc və bayramda isə ölkənizdə hilalın görünməsi əsasında verilən rəsmi elana əməl edin — tarix bir gün fərqlənə bilər.',
            en: 'The dates on this page are based on the Umm al-Qura calculation. For fasting and Eid, follow the official announcement in your country based on the sighting of the crescent — the date may differ by a day.',
            ru: 'Даты на этой странице основаны на расчёте Умм аль-Кура. В посте и празднике следуйте официальному объявлению в вашей стране, основанному на наблюдении молодого месяца, — дата может отличаться на день.',
            ar: 'التواريخ في هذه الصفحة مبنية على حساب أم القرى، وأما الصيام والعيد فيُتبع فيهما الإعلان الرسمي في بلدك المبني على رؤية الهلال، وقد يختلف التاريخ بيوم.',
            tr: 'Bu sayfadaki tarihler Ümmü’l-Kurâ hesabına dayanır. Oruç ve bayramda ise ülkenizde hilalin görülmesine dayanan resmî duyuruya uyun — tarih bir gün farklı olabilir.',
          },
          {
            az: 'İl hesabı hicrətdən aparılır: səhabələr il saymağa Peyğəmbərin ﷺ Mədinəyə gəlişindən başlamışlar (Buxari 3934); Məhərrəmin ilin ilk ayı kimi qəbul edilməsi Ömərin xilafəti dövründə olmuşdur.',
            en: 'Years are counted from the Hijrah: the Companions began counting from the Prophet’s ﷺ arrival in Madinah (al-Bukhari 3934); Muharram was adopted as the first month of the year during the caliphate of Umar.',
            ru: 'Годы отсчитываются от хиджры: сподвижники начали счёт с прибытия Пророка ﷺ в Медину (аль-Бухари 3934); мухаррам был принят первым месяцем года во времена халифата Умара.',
            ar: 'التأريخ بالهجرة؛ فالصحابة إنما عدّوا من مقدم النبي ﷺ المدينة (البخاري 3934)، وجُعل المحرم أول السنة في خلافة عمر.',
            tr: 'Yıllar hicretten sayılır: sahabe saymaya Peygamber’in ﷺ Medine’ye gelişinden başlamıştır (Buhârî 3934); Muharrem’in yılın ilk ayı kabul edilmesi Ömer’in hilafeti döneminde olmuştur.',
          },
        ],
      },
    ],
    links: [
      L.hijri,
    ],
  },
  {
    id: 'by-month',
    icon: 'calendar',
    title: {
      az: 'Hər ayda nə var — və nə yoxdur',
      en: 'What each month has — and does not have',
      ru: 'Что есть в каждом месяце — и чего нет',
      ar: 'ما يختص به كل شهر وما لا أصل له',
      tr: 'Her ayda ne var — ve ne yok',
    },
    blocks: [
      {
        t: 'p',
        text: {
          az: 'Aşağıdakı ay kartlarında yalnız səhih Sünnədə sabit olan və geniş yayılmış, amma əsli olmayan əməllər qısa göstərilib. Ətraflı izah və dəlillər üçün təqvimdə hadisənin üzərinə klikləyin və ya müvafiq dərsə keçin.',
          en: 'The month cards below briefly list only what is established in the authentic Sunnah and widespread practices that have no basis. For details and evidence, open the event in the calendar or go to the relevant lesson.',
          ru: 'В карточках месяцев ниже кратко указано лишь то, что установлено достоверной Сунной, и распространённые обычаи, не имеющие основы. Подробности и доводы — в описании события в календаре и в соответствующем уроке.',
          ar: 'تذكر بطاقات الشهور أدناه باختصار ما ثبت في السنة الصحيحة، وما اشتهر مما لا أصل له، والتفصيل والأدلة في شرح الحدث في التقويم وفي الدرس المتعلق به.',
          tr: 'Aşağıdaki ay kartlarında yalnızca sahih Sünnette sabit olanlar ve yaygın ama aslı olmayan uygulamalar kısaca gösterilmiştir. Ayrıntı ve deliller için takvimdeki olayı açın veya ilgili derse geçin.',
        },
      },
      {
        t: 'table',
        head: [
          {
            az: 'Ay',
            en: 'Month',
            ru: 'Месяц',
            ar: 'الشهر',
            tr: 'Ay',
          },
          {
            az: 'Sünnədə sabit olan',
            en: 'Established in the Sunnah',
            ru: 'Установлено Сунной',
            ar: 'الثابت في السنة',
            tr: 'Sünnette sabit olan',
          },
          {
            az: 'Əsli olmayan (yayılmış)',
            en: 'Without basis (popular)',
            ru: 'Без основы (распространено)',
            ar: 'ما لا أصل له (مما اشتهر)',
            tr: 'Aslı olmayan (yaygın)',
          },
        ],
        rows: [
          [
            {
              az: 'Məhərrəm (haram ay)',
              en: 'Muharram (sacred)',
              ru: 'Мухаррам (запретный)',
              ar: 'المحرم (حرام)',
              tr: 'Muharrem (haram ay)',
            },
            {
              az: 'Çox oruc tutmaq; Tasua və Aşura orucu',
              en: 'Fasting much; fasting Tasu‘a and Ashura',
              ru: 'Много поститься; пост Тасуа и Ашуры',
              ar: 'الإكثار من الصيام، وصيام تاسوعاء وعاشوراء',
              tr: 'Çok oruç tutmak; Tasua ve Aşure orucu',
            },
            {
              az: 'Yeni il bayramı və xüsusi duaları; Aşurada matəm və ya bayram adətləri',
              en: 'New-year celebrations and special duas; mourning or festival customs on Ashura',
              ru: 'Празднование нового года и особые мольбы; траурные или праздничные обычаи в Ашуру',
              ar: 'الاحتفال برأس السنة وأدعيته الخاصة، ومآتم عاشوراء أو اتخاذه عيدًا',
              tr: 'Yeni yıl kutlaması ve özel duaları; Aşure’de matem veya bayram âdetleri',
            },
          ],
          [
            {
              az: 'Səfər',
              en: 'Safar',
              ru: 'Сафар',
              ar: 'صفر',
              tr: 'Safer',
            },
            {
              az: '—',
              en: '—',
              ru: '—',
              ar: '—',
              tr: '—',
            },
            {
              az: 'Ayı uğursuz saymaq',
              en: 'Regarding the month as unlucky',
              ru: 'Считать месяц несчастливым',
              ar: 'التشاؤم به',
              tr: 'Ayı uğursuz saymak',
            },
          ],
          [
            {
              az: 'Rəbiül-Əvvəl',
              en: 'Rabi al-Awwal',
              ru: 'Раби аль-авваль',
              ar: 'ربيع الأول',
              tr: 'Rebiülevvel',
            },
            {
              az: '(Hər həftə) bazar ertəsi orucu',
              en: '(Weekly) Monday fasting',
              ru: '(Еженедельный) пост в понедельник',
              ar: 'صيام الاثنين (كل أسبوع)',
              tr: '(Her hafta) pazartesi orucu',
            },
            {
              az: 'Mövlud bayramı',
              en: 'The Mawlid celebration',
              ru: 'Празднование мавлида',
              ar: 'الاحتفال بالمولد',
              tr: 'Mevlid kutlaması',
            },
          ],
          [
            {
              az: 'Rəbiül-Axir',
              en: 'Rabi al-Thani',
              ru: 'Раби ас-сани',
              ar: 'ربيع الآخر',
              tr: 'Rebiülahir',
            },
            {
              az: '—',
              en: '—',
              ru: '—',
              ar: '—',
              tr: '—',
            },
            {
              az: '—',
              en: '—',
              ru: '—',
              ar: '—',
              tr: '—',
            },
          ],
          [
            {
              az: 'Cəmadiyül-Əvvəl',
              en: 'Jumada al-Ula',
              ru: 'Джумада аль-уля',
              ar: 'جمادى الأولى',
              tr: 'Cemaziyelevvel',
            },
            {
              az: '—',
              en: '—',
              ru: '—',
              ar: '—',
              tr: '—',
            },
            {
              az: '—',
              en: '—',
              ru: '—',
              ar: '—',
              tr: '—',
            },
          ],
          [
            {
              az: 'Cəmadiyül-Axir',
              en: 'Jumada al-Thani',
              ru: 'Джумада ас-сани',
              ar: 'جمادى الآخرة',
              tr: 'Cemaziyelahir',
            },
            {
              az: '—',
              en: '—',
              ru: '—',
              ar: '—',
              tr: '—',
            },
            {
              az: '—',
              en: '—',
              ru: '—',
              ar: '—',
              tr: '—',
            },
          ],
          [
            {
              az: 'Rəcəb (haram ay)',
              en: 'Rajab (sacred)',
              ru: 'Раджаб (запретный)',
              ar: 'رجب (حرام)',
              tr: 'Recep (haram ay)',
            },
            {
              az: 'Haram ay kimi günahdan çəkinmək',
              en: 'Avoiding sin, as a sacred month',
              ru: 'Избегать грехов, как в запретный месяц',
              ar: 'اجتناب المعاصي لحرمته',
              tr: 'Haram ay olarak günahtan sakınmak',
            },
            {
              az: 'Rəcəb orucu və gecə namazı xüsusi olaraq; Rəğaib namazı; 27 Rəcəb (Merac) mərasimi; Rəcəb qurbanı',
              en: 'Special Rajab fasting and night prayer; the Raghaib prayer; 27 Rajab (Mi‘raj) ceremonies; the Rajab sacrifice',
              ru: 'Особый пост и ночная молитва в раджаб; молитва рагаиб; обряды 27 раджаба (мирадж); жертвоприношение раджаба',
              ar: 'تخصيصه بصيام وقيام، وصلاة الرغائب، والاحتفال بليلة 27 (المعراج)، وذبيحة رجب',
              tr: 'Recep’e özel oruç ve gece namazı; Regaib namazı; 27 Recep (Miraç) törenleri; Recep kurbanı',
            },
          ],
          [
            {
              az: 'Şaban',
              en: 'Sha‘ban',
              ru: 'Шабан',
              ar: 'شعبان',
              tr: 'Şaban',
            },
            {
              az: 'Çox oruc tutmaq',
              en: 'Fasting much',
              ru: 'Много поститься',
              ar: 'الإكثار من الصيام',
              tr: 'Çok oruç tutmak',
            },
            {
              az: '15 Şaban gecəsini (Bərat) xüsusiləşdirmək; şəkk günü orucu',
              en: 'Singling out the night of 15 Sha‘ban (Barat); fasting the day of doubt',
              ru: 'Выделение ночи 15 шабана (Барат); пост в день сомнения',
              ar: 'تخصيص ليلة النصف، وصوم يوم الشك',
              tr: '15 Şaban gecesini (Berat) özel kılmak; şek günü orucu',
            },
          ],
          [
            {
              az: 'Ramazan',
              en: 'Ramadan',
              ru: 'Рамадан',
              ar: 'رمضان',
              tr: 'Ramazan',
            },
            {
              az: 'Fərz oruc, təravih, son on gecə, etikaf, fitrə zəkatı',
              en: 'Obligatory fast, taraweeh, the last ten nights, i‘tikaf, zakat al-fitr',
              ru: 'Обязательный пост, таравих, последние десять ночей, итикаф, закят аль-фитр',
              ar: 'الصيام الواجب، والتراويح، والعشر الأواخر، والاعتكاف، وزكاة الفطر',
              tr: 'Farz oruç, teravih, son on gece, itikâf, fıtır sadakası',
            },
            {
              az: 'Qədr gecəsini qəti olaraq 27-ci gecəyə bağlamaq',
              en: 'Fixing Laylat al-Qadr with certainty on the 27th night',
              ru: 'Безоговорочно закреплять Ночь предопределения за 27-й ночью',
              ar: 'الجزم بأن ليلة القدر ليلة السابع والعشرين',
              tr: 'Kadir gecesini kesin olarak 27. geceye bağlamak',
            },
          ],
          [
            {
              az: 'Şəvval',
              en: 'Shawwal',
              ru: 'Шавваль',
              ar: 'شوال',
              tr: 'Şevval',
            },
            {
              az: 'Bayram; altı gün oruc',
              en: 'Eid; fasting six days',
              ru: 'Праздник; пост шести дней',
              ar: 'العيد، وصيام ست من شوال',
              tr: 'Bayram; altı gün oruç',
            },
            {
              az: 'Bu ayda evlənməyi uğursuz saymaq',
              en: 'Regarding marriage in this month as unlucky',
              ru: 'Считать брак в этом месяце несчастливым',
              ar: 'التشاؤم بالزواج فيه',
              tr: 'Bu ayda evlenmeyi uğursuz saymak',
            },
          ],
          [
            {
              az: 'Zülqədə (haram ay)',
              en: 'Dhul-Qa‘dah (sacred)',
              ru: 'Зуль-каада (запретный)',
              ar: 'ذو القعدة (حرام)',
              tr: 'Zilkade (haram ay)',
            },
            {
              az: 'Peyğəmbərin ﷺ həcclə olandan başqa ömrələri bu ayda olub (Buxari 1778)',
              en: 'The Prophet’s ﷺ ‘umrahs, other than the one with his Hajj, were in this month (al-Bukhari 1778)',
              ru: '‘Умры Пророка ﷺ, кроме совершённой вместе с хаджем, были в этом месяце (аль-Бухари 1778)',
              ar: 'عُمَر النبي ﷺ — سوى التي مع حجته — كانت في ذي القعدة (البخاري 1778)',
              tr: 'Peygamber’in ﷺ hac ile birlikte olan dışındaki umreleri bu aydaydı (Buhârî 1778)',
            },
            {
              az: '—',
              en: '—',
              ru: '—',
              ar: '—',
              tr: '—',
            },
          ],
          [
            {
              az: 'Zülhiccə (haram ay)',
              en: 'Dhul-Hijjah (sacred)',
              ru: 'Зуль-хиджа (запретный)',
              ar: 'ذو الحجة (حرام)',
              tr: 'Zilhicce (haram ay)',
            },
            {
              az: 'İlk on gün, Ərəfə orucu, Qurban bayramı, qurban, təşriq günləri, təkbir',
              en: 'The first ten days, the Arafah fast, Eid al-Adha, the sacrifice, the days of Tashreeq, takbir',
              ru: 'Первые десять дней, пост Арафы, Курбан-байрам, жертвоприношение, дни ташрика, такбир',
              ar: 'العشر الأوائل، وصيام عرفة، وعيد الأضحى، والأضحية، وأيام التشريق، والتكبير',
              tr: 'İlk on gün, Arefe orucu, Kurban Bayramı, kurban, teşrik günleri, tekbir',
            },
            {
              az: 'Təşriq günlərində oruc (hacıdan başqa)',
              en: 'Fasting in the days of Tashreeq (except for the pilgrim)',
              ru: 'Пост в дни ташрика (кроме паломника)',
              ar: 'صيام أيام التشريق لغير الحاج',
              tr: 'Teşrik günlerinde oruç (hacı dışında)',
            },
          ],
        ],
      },
    ],
  },
  {
    id: 'principle',
    icon: 'shield',
    title: {
      az: 'Əsas qayda',
      en: 'The guiding principle',
      ru: 'Главное правило',
      ar: 'القاعدة',
      tr: 'Temel kural',
    },
    blocks: [
      {
        t: 'hadith',
        src: {
          az: 'Buxari 2697',
          en: 'Bukhari 2697',
          ru: 'Бухари 2697',
          ar: 'البخاري 2697',
          tr: 'Buhârî 2697',
        },
        ar: 'مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ فِيهِ فَهُوَ رَدٌّ',
        text: {
          az: '«Kim bizim bu işimizdə (dinimizdə) ondan olmayan bir şey icad edərsə, o, rədd olunur.»',
          en: '“Whoever introduces into this matter of ours (the religion) something that is not part of it, it is rejected.”',
          ru: '«Кто внесёт в это наше дело (религию) то, что к нему не относится, — это будет отвергнуто».',
          tr: '“Kim bizim bu işimizde (dinimizde) ondan olmayan bir şey ihdas ederse, o reddedilir.”',
        },
      },
      {
        t: 'p',
        text: {
          az: 'Bir günə və ya aya xüsusi fəzilət və ibadət yalnız Quran və səhih Sünnə ilə sabit olur. Peyğəmbərin ﷺ, səhabələrin və ilk nəsillərin etmədiyi mərasimi «yaxşı niyyətlə» əlavə etmək ona savab qazandırmır. Ən yaxşı yol — sabit olanı (oruc, zikr, dua, sədəqə) Sünnədə gəldiyi kimi etmək və gündəlik ibadətləri davamlı saxlamaqdır.',
          en: 'A special virtue or act of worship for a day or month is established only by the Quran and the authentic Sunnah. Adding, “with good intentions”, a ceremony that the Prophet ﷺ, the Companions and the first generations did not do does not earn reward. The best way is to do what is established (fasting, dhikr, dua, charity) as it came in the Sunnah and to keep up one’s daily worship consistently.',
          ru: 'Особое достоинство или поклонение для дня или месяца устанавливается только Кораном и достоверной Сунной. Добавление «с благим намерением» обряда, которого не совершали Пророк ﷺ, сподвижники и первые поколения, не приносит награды. Лучший путь — совершать установленное (пост, поминание, мольбу, милостыню) так, как это пришло в Сунне, и постоянно сохранять повседневное поклонение.',
          ar: 'لا تثبت فضيلة يوم أو شهر ولا عبادة خاصة به إلا بالكتاب والسنة الصحيحة، وإحداث شعيرة لم يفعلها النبي ﷺ ولا أصحابه ولا القرون المفضلة — ولو بنية حسنة — لا يُثاب عليه. والخير في فعل الثابت من صيام وذكر ودعاء وصدقة على ما جاء في السنة، والمداومة على العبادة.',
          tr: 'Bir güne veya aya özel fazilet ve ibadet ancak Kur’an ve sahih Sünnetle sabit olur. Peygamber’in ﷺ, sahabenin ve ilk nesillerin yapmadığı bir töreni “iyi niyetle” eklemek sevap kazandırmaz. En iyi yol, sabit olanı (oruç, zikir, dua, sadaka) Sünnette geldiği gibi yapmak ve günlük ibadetleri sürekli kılmaktır.',
        },
      },
    ],
    links: [
      L.bidah,
      L.fasts,
    ],
  },
]

export const CAL_SOURCES = [
  { label: 'IslamQA — 21290: Congratulations on the Hijri new year (Ibn Uthaymin)', url: URL.qa21290 },
  { label: 'IslamQA — 4033: Celebrating Ashura or taking it as a day of mourning (Ibn Taymiyyah)', url: URL.qa4033 },
  { label: 'IslamQA — 75394: Is fasting in Rajab recommended?', url: URL.qa75394 },
  { label: 'Quran.com — 9:36', url: 'https://quran.com/9/36' },
]
