// ═══════════════════════════════════════════════════════
// HƏCC BƏLƏDÇİSİ (/hajjguide) — interaktiv addımlardan əlavə bölmələr:
//   • günbəgün plan (8–13 Zülhiccə) — Timeline
//   • rüknlər və vaciblər — yoxlama siyahısı (cihazda yadda qalır)
//   • ihram: qadağalar və icazələr
//   • həccin üç növü — cədvəl
//
// YOXLANILIB (2026-11-01):
// • Hədislər — fawazahmed0/hadith-api (ara-*; Müslim — Fuad Əbdülbaqi nömrəsi):
//   Buxari 1265, 1521, 1542, 1568, 1679, 1736, 1746, 1751, 1755, 1773, 1829,
//   1835, 1838, 1840; Müslim 1141, 1218, 1298, 1306, 1328, 1409; Tirmizi 889.
// • Ayələr — api.quran.com: 2:196, 2:197, 2:203, 3:97, 5:95.
// • Rüknlər/vaciblər bölgüsü: İbn Baz, «ət-Təhqiq vəl-İzah li-kəsir min
//   məsailil-həcc vəl-ümrə» (Hənbəli məzhəbinin məşhur qövlü, İbn Useymin də).
// • TƏKRARLANMIR: Zülhiccənin on günü və Ərəfə orucu (/learn/dhul-hijjah-ten),
//   qurbanın hökmləri (/learn/udhiyah), səfər namazı (/learn/travel-prayer) —
//   keçid verilir.
// ═══════════════════════════════════════════════════════

export const HX = {
  // Hero
  how: {
    az: 'Aşağıda «Həcc» və ya «Ümrə» seçin — bələdçi sizi addım-addım aparır. Altda isə günbəgün plan, rüknlər siyahısı və ihram qaydaları var.',
    en: 'Pick “Hajj” or “Umrah” below and the guide walks you through it step by step. Further down: a day-by-day plan, a checklist of pillars and the rules of ihram.',
    ru: 'Выберите ниже «Хадж» или «Умра» — руководство проведёт вас шаг за шагом. Ниже: план по дням, список столпов и правила ихрама.',
    ar: 'اختر «الحج» أو «العمرة» أدناه ليأخذك الدليل خطوة خطوة، وتحته خطة الأيام، وقائمة الأركان والواجبات، وأحكام الإحرام.',
    tr: 'Aşağıda “Hac” veya “Umre”yi seçin — rehber sizi adım adım götürür. Daha aşağıda günbegün plan, rükünler listesi ve ihram kuralları var.',
  },
  stats: [
    { v: '8–13', l: { az: 'Zülhiccə — həcc günləri', en: 'Dhul-Hijjah — the Hajj days', ru: 'зуль-хиджа — дни хаджа', ar: 'ذو الحجة — أيام الحج', tr: 'Zilhicce — hac günleri' } },
    { v: '4', l: { az: 'rükn', en: 'pillars', ru: 'столпа', ar: 'أركان', tr: 'rükün' } },
    { v: '7', l: { az: 'vacib', en: 'obligations', ru: 'обязательных', ar: 'واجبات', tr: 'vacip' } },
  ],
  startHajj: { az: 'Həcc addımları', en: 'Hajj steps', ru: 'Шаги хаджа', ar: 'خطوات الحج', tr: 'Hac adımları' },
  startUmrah: { az: 'Ümrə addımları', en: 'Umrah steps', ru: 'Шаги умры', ar: 'خطوات العمرة', tr: 'Umre adımları' },

  // Seçim bölməsi
  pickEyebrow: { az: 'Addım-addım bələdçi', en: 'Interactive guide', ru: 'Интерактивное руководство', ar: 'دليل تفاعلي', tr: 'Etkileşimli rehber' },
  pickTitle: { az: 'Nəyi edirsiniz?', en: 'What are you performing?', ru: 'Что вы совершаете?', ar: 'ماذا تؤدي؟', tr: 'Neyi yapıyorsunuz?' },
  pickLead: {
    az: 'Ümrə ilin istənilən vaxtı edilir; həcc yalnız Zülhiccənin 8–13-ü arasında.',
    en: 'Umrah can be done at any time of the year; Hajj only between 8 and 13 Dhul-Hijjah.',
    ru: 'Умру совершают в любое время года; хадж — только с 8 по 13 зуль-хиджи.',
    ar: 'تُؤدّى العمرة في أي وقت من السنة، والحج في الأيام من ٨ إلى ١٣ من ذي الحجة فقط.',
    tr: 'Umre yılın her zamanı yapılır; hac ise yalnızca Zilhiccenin 8–13’ü arasında.',
  },

  // Günbəgün
  daysEyebrow: { az: 'Günbəgün', en: 'Day by day', ru: 'По дням', ar: 'يومًا بيوم', tr: 'Günbegün' },
  daysTitle: { az: 'Həcc 6 gündə: 8–13 Zülhiccə', en: 'Hajj in 6 days: 8–13 Dhul-Hijjah', ru: 'Хадж за 6 дней: 8–13 зуль-хиджи', ar: 'الحج في ستة أيام: ٨–١٣ ذي الحجة', tr: '6 günde hac: 8–13 Zilhicce' },
  daysLead: {
    az: 'Peyğəmbərin ﷺ Vida həccinə əsasən (Cabirin hədisi, Müslim 1218). Əsas günlər vurğulanıb.',
    en: 'Based on the Prophet’s ﷺ Farewell Hajj (the hadith of Jabir, Muslim 1218). The key days are highlighted.',
    ru: 'По прощальному хаджу Пророка ﷺ (хадис Джабира, Муслим 1218). Главные дни выделены.',
    ar: 'على وفق حجة الوداع (حديث جابر، مسلم ١٢١٨)، والأيام الأهم مميّزة.',
    tr: 'Peygamber’in ﷺ Veda haccına göre (Câbir hadisi, Müslim 1218). Temel günler vurgulanmıştır.',
  },

  // Yoxlama siyahısı
  ritesEyebrow: { az: 'Yoxlama siyahısı', en: 'Checklist', ru: 'Чек-лист', ar: 'قائمة تحقق', tr: 'Kontrol listesi' },
  ritesTitle: { az: 'Rüknlər və vaciblər', en: 'Pillars and obligations', ru: 'Столпы и обязательные действия', ar: 'الأركان والواجبات', tr: 'Rükünler ve vacipler' },
  ritesLead: {
    az: 'Rükn tərk edilsə həcc olmur. Vacib tərk edilsə, həcc keçərlidir, amma alimlərin əksəriyyətinə görə əvəzinə qurban (dəm) kəsilir. Etdiklərinizi işarələyin — qeyd yalnız bu cihazda saxlanır.',
    en: 'If a pillar is left out, the Hajj is not valid. If an obligation is left out, the Hajj stands, but according to most scholars a sacrifice (dam) is due instead. Tick what you have done — it is saved on this device only.',
    ru: 'Без столпа хадж недействителен. Если пропущено обязательное действие, хадж действителен, но, по мнению большинства учёных, вместо него приносят жертву (дам). Отмечайте сделанное — отметки хранятся только на этом устройстве.',
    ar: 'من ترك ركنًا لم يصحّ حجه، ومن ترك واجبًا صحّ حجه وعليه دم عند جمهور العلماء. علِّم ما أدّيته، ويُحفظ ذلك على هذا الجهاز فقط.',
    tr: 'Rükün terk edilirse hac olmaz. Vacip terk edilirse hac geçerlidir, ancak âlimlerin çoğuna göre yerine kurban (dem) kesilir. Yaptıklarınızı işaretleyin — kayıt yalnızca bu cihazda tutulur.',
  },
  rukn: { az: 'Rükn', en: 'Pillar', ru: 'Столп', ar: 'ركن', tr: 'Rükün' },
  wajib: { az: 'Vacib', en: 'Obligation', ru: 'Обязательное', ar: 'واجب', tr: 'Vacip' },
  done: { az: 'edildi', en: 'done', ru: 'сделано', ar: 'تمّ', tr: 'yapıldı' },
  reset: { az: 'Sıfırla', en: 'Reset', ru: 'Сбросить', ar: 'إعادة', tr: 'Sıfırla' },
  ritesSource: {
    az: 'Bölgü: İbn Baz, «ət-Təhqiq vəl-İzah» (həcc və ümrə məsələləri).',
    en: 'Classification: Ibn Baz, “at-Tahqiq wal-Idah” (on the rites of Hajj and Umrah).',
    ru: 'Классификация: Ибн Баз, «ат-Тахкик валь-Идах» (о вопросах хаджа и умры).',
    ar: 'التقسيم: ابن باز، «التحقيق والإيضاح لكثير من مسائل الحج والعمرة».',
    tr: 'Taksim: İbn Bâz, “et-Tahkîk ve’l-Îzâh” (hac ve umre meseleleri).',
  },

  // İhram
  ihramEyebrow: { az: 'İhram', en: 'Ihram', ru: 'Ихрам', ar: 'الإحرام', tr: 'İhram' },
  ihramTitle: { az: 'İhramda: olmaz və olar', en: 'In ihram: not allowed and allowed', ru: 'В ихраме: нельзя и можно', ar: 'في الإحرام: ما يُمنع وما يُباح', tr: 'İhramda: yapılmaz ve yapılır' },
  ihramLead: {
    az: 'İhram — həcc və ya ümrəyə girmək niyyətidir; ağ paltar onun nişanəsidir. Niyyətdən sonra aşağıdakı qadağalar başlayır.',
    en: 'Ihram is the intention of entering Hajj or Umrah; the white garments are its sign. Once you make the intention, the prohibitions below apply.',
    ru: 'Ихрам — это намерение вступить в хадж или умру; белая одежда — его признак. После намерения действуют запреты ниже.',
    ar: 'الإحرام نية الدخول في النسك، والثياب البيض علامته، وبعد النية تبدأ المحظورات الآتية.',
    tr: 'İhram, hacca veya umreye girme niyetidir; beyaz giysi onun alametidir. Niyetten sonra aşağıdaki yasaklar başlar.',
  },
  notAllowed: { az: 'Qadağandır', en: 'Not allowed', ru: 'Запрещено', ar: 'محظور', tr: 'Yasak' },
  allowed: { az: 'İcazəlidir', en: 'Allowed', ru: 'Разрешено', ar: 'مباح', tr: 'Serbest' },

  // Növlər
  typesEyebrow: { az: 'Həccin növləri', en: 'Types of Hajj', ru: 'Виды хаджа', ar: 'أنساك الحج', tr: 'Haccın çeşitleri' },
  typesTitle: { az: 'Təməttü, qiran, ifrad', en: 'Tamattu‘, qiran, ifrad', ru: 'Таматту, киран, ифрад', ar: 'التمتع والقران والإفراد', tr: 'Temettu, kıran, ifrad' },
  typesLead: {
    az: 'Fərq — ihramın niyyətində və qurbanlığın (hədy) vacib olub-olmamasındadır (Bəqərə 2:196).',
    en: 'The difference lies in the intention of ihram and whether a sacrificial animal (hady) is required (al-Baqarah 2:196).',
    ru: 'Разница — в намерении ихрама и в том, обязательна ли жертва (хадй) (аль-Бакара 2:196).',
    ar: 'يكمن الفرق في نية الإحرام ووجوب الهدي (البقرة: ١٩٦).',
    tr: 'Fark, ihramın niyetinde ve kurbanın (hedy) vacip olup olmamasındadır (Bakara 2:196).',
  },
  typeCol: { az: 'Növ', en: 'Type', ru: 'Вид', ar: 'النسك', tr: 'Çeşit' },
  ihramCol: { az: 'İhramın niyyəti', en: 'Intention of ihram', ru: 'Намерение ихрама', ar: 'نية الإحرام', tr: 'İhram niyeti' },
  hadyCol: { az: 'Hədy (qurbanlıq)', en: 'Hady (sacrifice)', ru: 'Хадй (жертва)', ar: 'الهدي', tr: 'Hedy (kurban)' },
  typesNote: {
    az: 'Peyğəmbər ﷺ qurbanlıq gətirməyən səhabələrə ihramlarını ümrəyə çevirməyi əmr etdi (Buxari 1568). Buna görə İbn Baz və İbn Useymin qurbanlıq gətirməyən üçün təməttünü ən fəzilətli sayırlar.',
    en: 'The Prophet ﷺ ordered the Companions who had not brought sacrificial animals to turn their ihram into Umrah (al-Bukhari 1568). For this reason Ibn Baz and Ibn Uthaymin consider tamattu‘ the best for one who has not brought an animal.',
    ru: 'Пророк ﷺ велел сподвижникам, не пригнавшим жертвенных животных, обратить свой ихрам в умру (аль-Бухари 1568). Поэтому Ибн Баз и Ибн Усаймин считают таматту лучшим для того, кто не пригнал животное.',
    ar: 'أمر النبي ﷺ من لم يسق الهدي من أصحابه أن يجعلوها عمرة (البخاري ١٥٦٨)، ولذا رجّح ابن باز وابن عثيمين التمتع لمن لم يسق الهدي.',
    tr: 'Peygamber ﷺ kurbanlık getirmeyen sahabelere ihramlarını umreye çevirmelerini emretti (Buhârî 1568). Bu yüzden İbn Bâz ve İbn Useymîn kurbanlık getirmeyen için temettuyu en faziletli sayar.',
  },

  // Fəzilət
  virtueEyebrow: { az: 'Fəzilət', en: 'Virtue', ru: 'Достоинство', ar: 'الفضل', tr: 'Fazilet' },
  virtueTitle: { az: 'Niyə həcc?', en: 'Why Hajj?', ru: 'Зачем хадж?', ar: 'لماذا الحج؟', tr: 'Neden hac?' },

  // Xəritə alt yazısı
  related: { az: 'Əlaqəli bölmələr', en: 'Related sections', ru: 'Связанные разделы', ar: 'أقسام ذات صلة', tr: 'İlgili bölümler' },
}

/** Həccin fərdi (fərz olma) ayəsi və iki fəzilət hədisi — mətnlər API ilə yoxlanılıb */
export const HAJJ_VIRTUES = [
  { kind: 'ayah', ref: '3:97',
    ar: 'وَلِلَّهِ عَلَى ٱلنَّاسِ حِجُّ ٱلْبَيْتِ مَنِ ٱسْتَطَاعَ إِلَيْهِ سَبِيلًا',
    text: { az: 'İmkanı olan insanların Allah üçün o evi həcc etməsi borcdur.', en: 'Pilgrimage to the House is a duty owed to Allah by people who are able to find a way to it.', ru: 'Люди обязаны перед Аллахом совершить хадж к Дому, если они способны проделать этот путь.', ar: 'فرض الله الحج على المستطيع.', tr: 'Gücü yetenlerin Allah için o Evi haccetmesi bir borçtur.' },
    src: { az: 'Ali-İmran 3:97', en: 'Al ‘Imran 3:97', ru: 'Аль ‘Имран 3:97', ar: 'آل عمران: ٩٧', tr: 'Âl-i İmrân 3:97' } },
  { kind: 'hadith',
    ar: 'مَنْ حَجَّ لِلَّهِ فَلَمْ يَرْفُثْ وَلَمْ يَفْسُقْ رَجَعَ كَيَوْمِ وَلَدَتْهُ أُمُّهُ',
    text: { az: 'Kim Allah üçün həcc edib (həcc əsnasında) çirkin söz-əməldən və günahdan çəkinsə, anasından doğulduğu gündəki kimi qayıdar.', en: 'Whoever performs Hajj for Allah and does not commit obscenity or sin returns like the day his mother bore him.', ru: 'Кто совершит хадж ради Аллаха, не допуская непристойности и нечестия, вернётся таким, каким был в день, когда его родила мать.', ar: 'من حج لله فلم يرفث ولم يفسق رجع كيوم ولدته أمه.', tr: 'Kim Allah için hacceder de kötü söz ve davranıştan ve günahtan sakınırsa, annesinden doğduğu günkü gibi döner.' },
    src: { az: 'Buxari 1521', en: 'al-Bukhari 1521', ru: 'аль-Бухари 1521', ar: 'البخاري ١٥٢١', tr: 'Buhârî 1521' } },
  { kind: 'hadith',
    ar: 'الْعُمْرَةُ إِلَى الْعُمْرَةِ كَفَّارَةٌ لِمَا بَيْنَهُمَا، وَالْحَجُّ الْمَبْرُورُ لَيْسَ لَهُ جَزَاءٌ إِلَّا الْجَنَّةُ',
    text: { az: 'Ümrədən ümrəyə qədər — aradakı (günahlara) kəffarədir; qəbul olunmuş həccin isə mükafatı yalnız Cənnətdir.', en: 'One Umrah to the next is an expiation for what is between them, and an accepted Hajj has no reward but Paradise.', ru: 'Умра до следующей умры — искупление того, что между ними, а за принятый хадж нет иной награды, кроме Рая.', ar: 'العمرة إلى العمرة كفارة لما بينهما، والحج المبرور ليس له جزاء إلا الجنة.', tr: 'Umreden umreye, aradakilere kefarettir; kabul olmuş haccın karşılığı ise ancak Cennettir.' },
    src: { az: 'Buxari 1773', en: 'al-Bukhari 1773', ru: 'аль-Бухари 1773', ar: 'البخاري ١٧٧٣', tr: 'Buhârî 1773' } },
]

/** Günbəgün plan — <Timeline items> */
export const HAJJ_DAYS = [
  { key: 'pre',
    when: { az: '8-dən əvvəl', en: 'Before the 8th', ru: 'До 8-го', ar: 'قبل الثامن', tr: '8’inden önce' },
    title: { az: 'Miqat və ümrə', en: 'Miqat and Umrah', ru: 'Микат и умра', ar: 'الميقات والعمرة', tr: 'Mikat ve umre' },
    text: { az: 'Miqatda ihrama girilir. Təməttü edən Məkkədə ümrəni (təvaf, səy, qısaltma) edib ihramdan çıxır və 8-ə qədər adi halda qalır.', en: 'Ihram is entered at the miqat. One doing tamattu‘ performs Umrah in Mecca (tawaf, sa‘i, trimming), leaves ihram and stays in normal dress until the 8th.', ru: 'Ихрам надевают в микате. Совершающий таматту выполняет в Мекке умру (таваф, саи, подстригание), выходит из ихрама и до 8-го остаётся в обычном состоянии.', ar: 'يُحرم الحاج من الميقات، والمتمتع يؤدي العمرة بمكة (طواف وسعي وتقصير) ثم يحلّ حتى يوم الثامن.', tr: 'Mikatta ihrama girilir. Temettu yapan Mekke’de umreyi (tavaf, say, kısaltma) yapıp ihramdan çıkar ve 8’ine kadar normal hâlde kalır.' } },
  { key: 'd8',
    when: { az: '8 Zülhiccə', en: '8 Dhul-Hijjah', ru: '8 зуль-хиджи', ar: '٨ ذي الحجة', tr: '8 Zilhicce' },
    title: { az: 'Tərviyə günü — Mina', en: 'Day of Tarwiyah — Mina', ru: 'День тарвия — Мина', ar: 'يوم التروية — منى', tr: 'Terviye günü — Mina' },
    text: { az: 'Təməttü edən olduğu yerdə həcc üçün ihrama girir. Hacılar Minaya gedir; zöhr, əsr, məğrib, işa və sübhü orada, hər birini öz vaxtında, dörd rəkətliləri iki rəkət qılır.', en: 'One doing tamattu‘ enters ihram for Hajj from where he is. Pilgrims go to Mina and pray Dhuhr, Asr, Maghrib, Isha and Fajr there, each in its time, shortening the four-rak‘ah prayers to two.', ru: 'Совершающий таматту входит в ихрам для хаджа там, где находится. Паломники идут в Мину и совершают там зухр, аср, магриб, иша и фаджр, каждый в своё время, сокращая четырёхракаатные до двух.', ar: 'يُحرم المتمتع بالحج من مكانه، ويخرج الحجاج إلى منى فيصلّون بها الظهر والعصر والمغرب والعشاء والفجر، كل صلاة في وقتها، ويقصرون الرباعية.', tr: 'Temettu yapan bulunduğu yerden hac için ihrama girer. Hacılar Mina’ya gider; öğle, ikindi, akşam, yatsı ve sabahı orada, her birini kendi vaktinde, dört rekâtlıları iki rekât kılar.' } },
  { key: 'd9', highlight: true,
    when: { az: '9 Zülhiccə', en: '9 Dhul-Hijjah', ru: '9 зуль-хиджи', ar: '٩ ذي الحجة', tr: '9 Zilhicce' },
    title: { az: 'Ərəfə günü — Ərəfat', en: 'Day of Arafah — Arafat', ru: 'День Арафа — Арафат', ar: 'يوم عرفة — عرفات', tr: 'Arefe günü — Arafat' },
    text: { az: 'Günəş çıxandan sonra Ərəfata gedilir. Zöhr və əsr zöhr vaxtında birlikdə, qısaldılmış qılınır, sonra günəş batana qədər dua və zikr. «Həcc Ərəfatdır» (Tirmizi 889).', en: 'After sunrise pilgrims go to Arafat. Dhuhr and Asr are prayed together at Dhuhr time, shortened; then supplication and remembrance until sunset. “Hajj is Arafah” (at-Tirmidhi 889).', ru: 'После восхода паломники отправляются на Арафат. Зухр и аср совершают вместе во время зухра, сокращённо, затем — мольбы и поминание до заката. «Хадж — это Арафат» (ат-Тирмизи 889).', ar: 'بعد طلوع الشمس يسير الحجاج إلى عرفة، فيصلّون الظهر والعصر جمعَ تقديم قصرًا، ثم يدعون ويذكرون الله حتى غروب الشمس. «الحج عرفة» (الترمذي ٨٨٩).', tr: 'Güneş doğduktan sonra Arafat’a gidilir. Öğle ve ikindi öğle vaktinde birlikte, kısaltılarak kılınır; sonra güneş batana kadar dua ve zikir. “Hac Arafat’tır” (Tirmizî 889).' } },
  { key: 'n10',
    when: { az: '9→10 gecəsi', en: 'Night of the 10th', ru: 'Ночь на 10-е', ar: 'ليلة العاشر', tr: '10’una gecesi' },
    title: { az: 'Müzdəlifə', en: 'Muzdalifah', ru: 'Муздалифа', ar: 'مزدلفة', tr: 'Müzdelife' },
    text: { az: 'Günəş batandan sonra Müzdəlifəyə. Məğrib və işa birlikdə qılınır, gecə orada keçirilir; sübhdən sonra hava xeyli işıqlanana qədər dua. Zəiflərə ay batandan sonra Minaya getməyə icazə verilib (Buxari 1679).', en: 'After sunset, on to Muzdalifah. Maghrib and Isha are prayed together and the night is spent there; after Fajr, supplication until it is quite light. The weak were permitted to leave for Mina after the moon sets (al-Bukhari 1679).', ru: 'После заката — в Муздалифу. Магриб и иша совершают вместе, ночь проводят там; после фаджра — мольбы, пока не станет совсем светло. Слабым разрешено уходить в Мину после захода луны (аль-Бухари 1679).', ar: 'بعد الغروب يدفعون إلى مزدلفة، فيصلّون المغرب والعشاء جمعًا ويبيتون بها، ويدعون بعد الفجر حتى يُسفروا جدًّا، وقد أُذن للضعفة في الدفع بعد غياب القمر (البخاري ١٦٧٩).', tr: 'Güneş batınca Müzdelife’ye. Akşam ve yatsı birlikte kılınır, gece orada geçirilir; sabahtan sonra ortalık iyice aydınlanana kadar dua. Zayıflara ay battıktan sonra Mina’ya gitme izni verilmiştir (Buhârî 1679).' } },
  { key: 'd10', highlight: true,
    when: { az: '10 Zülhiccə', en: '10 Dhul-Hijjah', ru: '10 зуль-хиджи', ar: '١٠ ذي الحجة', tr: '10 Zilhicce' },
    title: { az: 'Qurban günü — 4 əməl', en: 'Day of Sacrifice — 4 rites', ru: 'День жертвоприношения — 4 обряда', ar: 'يوم النحر — أربعة أعمال', tr: 'Kurban günü — 4 amel' },
    text: { az: 'Cəmrətül-Əqəbəyə 7 daş → qurban → qırxdırma və ya qısaltma → İfadə təvafı (və səy). Sıranı qarışdıranlara Peyğəmbər ﷺ «Et, eybi yoxdur» dedi (Buxari 1736, Müslim 1306).', en: 'Seven pebbles at Jamrat al-‘Aqabah → sacrifice → shaving or trimming → Tawaf al-Ifadah (and sa‘i). To those who changed the order the Prophet ﷺ said: “Do it, there is no harm” (al-Bukhari 1736, Muslim 1306).', ru: 'Семь камешков в Джамрат аль-Акаба → жертва → бритьё или подстригание → таваф аль-Ифада (и саи). Тем, кто нарушил порядок, Пророк ﷺ сказал: «Делай, нет греха» (аль-Бухари 1736, Муслим 1306).', ar: 'رمي جمرة العقبة بسبع حصيات ← النحر ← الحلق أو التقصير ← طواف الإفاضة (والسعي). وما سُئل النبي ﷺ يومئذ عن شيء قُدِّم ولا أُخِّر إلا قال: «افعل ولا حرج» (البخاري ١٧٣٦، مسلم ١٣٠٦).', tr: 'Cemretü’l-Akabe’ye 7 taş → kurban → tıraş veya kısaltma → İfâda tavafı (ve say). Sırayı değiştirenlere Peygamber ﷺ “Yap, sakıncası yok” dedi (Buhârî 1736, Müslim 1306).' } },
  { key: 'd11',
    when: { az: '11 Zülhiccə', en: '11 Dhul-Hijjah', ru: '11 зуль-хиджи', ar: '١١ ذي الحجة', tr: '11 Zilhicce' },
    title: { az: 'Təşriq günü — 3 cəmrə', en: 'Day of Tashreeq — 3 pillars', ru: 'День ташрика — 3 столба', ar: 'أول أيام التشريق — الجمرات الثلاث', tr: 'Teşrik günü — 3 cemre' },
    text: { az: 'Gecə Minada keçirilir. Zəvaldan sonra üç cəmrəyə 7-şər daş: kiçik, orta, Əqəbə; ilk ikisindən sonra qibləyə dönüb uzun dua (Buxari 1746, 1751).', en: 'The night is spent in Mina. After midday, seven pebbles at each of the three pillars: small, middle, ‘Aqabah; after the first two, face the qiblah and supplicate at length (al-Bukhari 1746, 1751).', ru: 'Ночь проводят в Мине. После полудня — по 7 камешков в каждый из трёх столбов: малый, средний, Акаба; после первых двух — долгая мольба лицом к кибле (аль-Бухари 1746, 1751).', ar: 'يبيت الحاج بمنى، ويرمي بعد الزوال الجمرات الثلاث بسبع سبع: الصغرى ثم الوسطى ثم العقبة، ويقف بعد الأوليين مستقبل القبلة يدعو طويلًا (البخاري ١٧٤٦، ١٧٥١).', tr: 'Gece Mina’da geçirilir. Zevalden sonra üç cemreye yedişer taş: küçük, orta, Akabe; ilk ikisinden sonra kıbleye dönüp uzun dua (Buhârî 1746, 1751).' } },
  { key: 'd12',
    when: { az: '12 Zülhiccə', en: '12 Dhul-Hijjah', ru: '12 зуль-хиджи', ar: '١٢ ذي الحجة', tr: '12 Zilhicce' },
    title: { az: 'Tələsən üçün son gün', en: 'Last day for those who hasten', ru: 'Последний день для спешащих', ar: 'آخر يوم للمتعجل', tr: 'Acele eden için son gün' },
    text: { az: 'Eyni qaydada daş atılır. Tələsən günəş batmazdan əvvəl Minadan çıxa bilər: «Kim iki gündə tələssə, ona günah yoxdur» (Bəqərə 2:203).', en: 'The stoning is repeated. One who hastens may leave Mina before sunset: “Whoever hastens in two days, there is no sin upon him” (al-Baqarah 2:203).', ru: 'Бросание повторяется. Спешащий может покинуть Мину до заката: «Кто поспешит за два дня, на том нет греха» (аль-Бакара 2:203).', ar: 'يرمي كاليوم السابق، ومن تعجّل خرج من منى قبل الغروب: ﴿فَمَن تَعَجَّلَ فِى يَوْمَيْنِ فَلَآ إِثْمَ عَلَيْهِ﴾ (البقرة: ٢٠٣).', tr: 'Aynı şekilde taş atılır. Acele eden güneş batmadan Mina’dan çıkabilir: “Kim iki günde acele ederse ona günah yoktur” (Bakara 2:203).' } },
  { key: 'd13',
    when: { az: '13 Zülhiccə', en: '13 Dhul-Hijjah', ru: '13 зуль-хиджи', ar: '١٣ ذي الحجة', tr: '13 Zilhicce' },
    title: { az: 'Qalan üçün rəmy, sonra Vida təvafı', en: 'Stoning for those who stay, then the Farewell Tawaf', ru: 'Бросание для оставшихся, затем прощальный таваф', ar: 'رمي المتأخر ثم طواف الوداع', tr: 'Kalan için taşlama, sonra Veda tavafı' },
    text: { az: 'Qalan daş atır. Məkkədən çıxmazdan əvvəl son əməl — Vida təvafı; heyzli qadına güzəşt edilib (Buxari 1755, Müslim 1328).', en: 'Those who stayed stone again. Before leaving Mecca the last act is the Farewell Tawaf; a menstruating woman is excused (al-Bukhari 1755, Muslim 1328).', ru: 'Оставшиеся снова бросают камешки. Последнее перед отъездом из Мекки — прощальный таваф; женщине в период менструации сделано послабление (аль-Бухари 1755, Муслим 1328).', ar: 'يرمي المتأخر، ثم يكون آخر عهده بالبيت طواف الوداع، وخُفِّف عن الحائض (البخاري ١٧٥٥، مسلم ١٣٢٨).', tr: 'Kalanlar yine taş atar. Mekke’den ayrılmadan son amel Veda tavafıdır; hayızlı kadına ruhsat verilmiştir (Buhârî 1755, Müslim 1328).' } },
]

/** Rüknlər və vaciblər — yoxlama siyahısı (id-lər localStorage-da saxlanır, dəyişmə) */
export const HAJJ_RITES = [
  { id: 'ihram', kind: 'rukn',
    name: { az: 'İhram (həccə girmək niyyəti)', en: 'Ihram (the intention of entering Hajj)', ru: 'Ихрам (намерение вступить в хадж)', ar: 'الإحرام (نية الدخول في النسك)', tr: 'İhram (hacca girme niyeti)' },
    when: { az: 'miqatda / 8-də', en: 'at the miqat / on the 8th', ru: 'в микате / 8-го', ar: 'من الميقات / يوم الثامن', tr: 'mikatta / 8’inde' } },
  { id: 'arafah', kind: 'rukn',
    name: { az: 'Ərəfatda dayanmaq', en: 'Standing at Arafat', ru: 'Стояние на Арафате', ar: 'الوقوف بعرفة', tr: 'Arafat’ta vakfe' },
    when: { az: '9-u', en: 'the 9th', ru: '9-го', ar: 'التاسع', tr: '9’u' } },
  { id: 'ifadah', kind: 'rukn',
    name: { az: 'İfadə təvafı', en: 'Tawaf al-Ifadah', ru: 'Таваф аль-Ифада', ar: 'طواف الإفاضة', tr: 'İfâda tavafı' },
    when: { az: '10-u və sonra', en: 'the 10th or later', ru: '10-го или позже', ar: 'العاشر فما بعده', tr: '10’u ve sonrası' } },
  { id: 'sai', kind: 'rukn',
    name: { az: 'Həcc səyi (Səfa–Mərvə)', en: 'Sa‘i of Hajj (Safa–Marwah)', ru: 'Саи хаджа (Сафа–Марва)', ar: 'سعي الحج بين الصفا والمروة', tr: 'Hac sayı (Safa–Merve)' },
    when: { az: 'təvafdan sonra', en: 'after tawaf', ru: 'после тавафа', ar: 'بعد الطواف', tr: 'tavaftan sonra' } },
  { id: 'miqat', kind: 'wajib',
    name: { az: 'İhrama miqatdan girmək', en: 'Entering ihram from the miqat', ru: 'Вход в ихрам с миката', ar: 'الإحرام من الميقات', tr: 'İhrama mikattan girmek' },
    when: { az: 'gəlişdə', en: 'on arrival', ru: 'по прибытии', ar: 'عند القدوم', tr: 'gelişte' } },
  { id: 'sunset', kind: 'wajib',
    name: { az: 'Ərəfatda günəş batana qədər qalmaq', en: 'Staying at Arafat until sunset', ru: 'Оставаться на Арафате до заката', ar: 'البقاء بعرفة إلى الغروب', tr: 'Arafat’ta güneş batana kadar kalmak' },
    when: { az: '9-u', en: 'the 9th', ru: '9-го', ar: 'التاسع', tr: '9’u' } },
  { id: 'muzdalifah', kind: 'wajib',
    name: { az: 'Müzdəlifədə gecələmək', en: 'Spending the night at Muzdalifah', ru: 'Ночёвка в Муздалифе', ar: 'المبيت بمزدلفة', tr: 'Müzdelife’de gecelemek' },
    when: { az: '10-a keçən gecə', en: 'night of the 10th', ru: 'ночь на 10-е', ar: 'ليلة العاشر', tr: '10’una gecesi' } },
  { id: 'mina', kind: 'wajib',
    name: { az: 'Təşriq gecələrini Minada keçirmək', en: 'Nights of Tashreeq in Mina', ru: 'Ночи ташрика в Мине', ar: 'المبيت بمنى ليالي التشريق', tr: 'Teşrik gecelerini Mina’da geçirmek' },
    when: { az: '11–12 (13)', en: '11–12 (13)', ru: '11–12 (13)', ar: '١١–١٢ (١٣)', tr: '11–12 (13)' } },
  { id: 'ramy', kind: 'wajib',
    name: { az: 'Cəmrələrə daş atmaq', en: 'Stoning the pillars', ru: 'Бросание камешков в джамараты', ar: 'رمي الجمار', tr: 'Cemrelere taş atmak' },
    when: { az: '10–13', en: '10–13', ru: '10–13', ar: '١٠–١٣', tr: '10–13' } },
  { id: 'halq', kind: 'wajib',
    name: { az: 'Qırxdırmaq və ya qısaltmaq', en: 'Shaving or trimming', ru: 'Бритьё или подстригание', ar: 'الحلق أو التقصير', tr: 'Tıraş veya kısaltma' },
    when: { az: '10-u', en: 'the 10th', ru: '10-го', ar: 'العاشر', tr: '10’u' } },
  { id: 'wada', kind: 'wajib',
    name: { az: 'Vida təvafı', en: 'Farewell Tawaf', ru: 'Прощальный таваф', ar: 'طواف الوداع', tr: 'Veda tavafı' },
    when: { az: 'çıxmazdan əvvəl', en: 'before leaving', ru: 'перед отъездом', ar: 'قبل السفر', tr: 'ayrılmadan önce' } },
]

/** İhram: qadağalar və icazələr (hər birinin dəlili ilə) */
export const IHRAM_NOT = [
  { az: 'Saçı qırxmaq və ya kəsmək', en: 'Shaving or cutting hair', ru: 'Брить или стричь волосы', ar: 'حلق الشعر أو قصّه', tr: 'Saçı tıraş etmek veya kesmek', ref: { az: 'Bəqərə 2:196', en: 'al-Baqarah 2:196', ru: 'аль-Бакара 2:196', ar: 'البقرة: ١٩٦', tr: 'Bakara 2:196' } },
  { az: 'Dırnaq kəsmək — alimlər saça qiyas edir', en: 'Clipping nails — scholars treat it like hair', ru: 'Стричь ногти — учёные приравнивают к волосам', ar: 'تقليم الأظفار قياسًا على الشعر', tr: 'Tırnak kesmek — âlimler saça kıyas eder', ref: null },
  { az: 'Bədənə və ihram paltarına ətir', en: 'Perfume on the body or ihram garments', ru: 'Благовония на теле и одежде ихрама', ar: 'الطيب في البدن وثياب الإحرام', tr: 'Bedene ve ihram giysisine koku', ref: { az: 'Buxari 1542', en: 'al-Bukhari 1542', ru: 'аль-Бухари 1542', ar: 'البخاري ١٥٤٢', tr: 'Buhârî 1542' } },
  { az: 'Kişi: köynək, şalvar, əmmamə, başlıqlı plaş, xuff', en: 'Men: shirts, trousers, turbans, hooded cloaks, khuffs', ru: 'Мужчинам: рубахи, штаны, чалмы, бурнусы, хуффы', ar: 'للرجل: القميص والسراويل والعمائم والبرانس والخفاف', tr: 'Erkek: gömlek, şalvar, sarık, kukuletalı cübbe, mest', ref: { az: 'Buxari 1542', en: 'al-Bukhari 1542', ru: 'аль-Бухари 1542', ar: 'البخاري ١٥٤٢', tr: 'Buhârî 1542' } },
  { az: 'Kişi: başı örtmək', en: 'Men: covering the head', ru: 'Мужчинам: покрывать голову', ar: 'للرجل: تغطية الرأس', tr: 'Erkek: başı örtmek', ref: { az: 'Buxari 1265', en: 'al-Bukhari 1265', ru: 'аль-Бухари 1265', ar: 'البخاري ١٢٦٥', tr: 'Buhârî 1265' } },
  { az: 'Qadın: niqab və əlcək', en: 'Women: niqab and gloves', ru: 'Женщинам: никаб и перчатки', ar: 'للمرأة: النقاب والقفازان', tr: 'Kadın: nikap ve eldiven', ref: { az: 'Buxari 1838', en: 'al-Bukhari 1838', ru: 'аль-Бухари 1838', ar: 'البخاري ١٨٣٨', tr: 'Buhârî 1838' } },
  { az: 'Quru ov heyvanını ovlamaq', en: 'Hunting land game', ru: 'Охота на сухопутную дичь', ar: 'صيد البر', tr: 'Kara avı avlamak', ref: { az: 'Maidə 5:95', en: 'al-Ma’idah 5:95', ru: 'аль-Маида 5:95', ar: 'المائدة: ٩٥', tr: 'Mâide 5:95' } },
  { az: 'Nikah bağlamaq və elçilik', en: 'Contracting or proposing marriage', ru: 'Заключать брак и свататься', ar: 'عقد النكاح والخطبة', tr: 'Nikâh kıymak ve evlilik teklifi', ref: { az: 'Müslim 1409', en: 'Muslim 1409', ru: 'Муслим 1409', ar: 'مسلم ١٤٠٩', tr: 'Müslim 1409' } },
  { az: 'Ər-arvad yaxınlığı və onun müqəddimələri', en: 'Marital relations and what leads to them', ru: 'Супружеская близость и её прелюдии', ar: 'الجماع ومقدماته', tr: 'Karı-koca yakınlığı ve öncülleri', ref: { az: 'Bəqərə 2:197', en: 'al-Baqarah 2:197', ru: 'аль-Бакара 2:197', ar: 'البقرة: ١٩٧', tr: 'Bakara 2:197' } },
]
export const IHRAM_OK = [
  { az: 'Yuyunmaq, başı yumaq', en: 'Bathing and washing the head', ru: 'Купаться и мыть голову', ar: 'الاغتسال وغسل الرأس', tr: 'Yıkanmak, başı yıkamak', ref: { az: 'Buxari 1840', en: 'al-Bukhari 1840', ru: 'аль-Бухари 1840', ar: 'البخاري ١٨٤٠', tr: 'Buhârî 1840' } },
  { az: 'Kölgələnmək — çətir, çadır, örtük', en: 'Seeking shade — umbrella, tent, a raised cloth', ru: 'Укрываться в тени — зонт, шатёр, навес', ar: 'الاستظلال بمظلة أو خيمة أو ثوب', tr: 'Gölgelenmek — şemsiye, çadır, örtü', ref: { az: 'Müslim 1298', en: 'Muslim 1298', ru: 'Муслим 1298', ar: 'مسلم ١٢٩٨', tr: 'Müslim 1298' } },
  { az: 'Hacamat (qan aldırmaq)', en: 'Cupping', ru: 'Кровопускание (хиджама)', ar: 'الحجامة', tr: 'Hacamat', ref: { az: 'Buxari 1835', en: 'al-Bukhari 1835', ru: 'аль-Бухари 1835', ar: 'البخاري ١٨٣٥', tr: 'Buhârî 1835' } },
  { az: 'Zərərli beş canlını öldürmək (qarğa, çalağan, əqrəb, siçan, quduz it)', en: 'Killing the five harmful creatures (crow, kite, scorpion, mouse, rabid dog)', ru: 'Убивать пять вредных существ (ворона, коршун, скорпион, мышь, бешеная собака)', ar: 'قتل الفواسق الخمس: الغراب والحدأة والعقرب والفأرة والكلب العقور', tr: 'Zararlı beş canlıyı öldürmek (karga, çaylak, akrep, fare, kuduz köpek)', ref: { az: 'Buxari 1829', en: 'al-Bukhari 1829', ru: 'аль-Бухари 1829', ar: 'البخاري ١٨٢٩', tr: 'Buhârî 1829' } },
  { az: 'Nəleyn tapmayan kişi xuffu topuqdan aşağı kəsib geyinir', en: 'A man without sandals may wear khuffs cut below the ankles', ru: 'Мужчина без сандалий может надеть хуффы, обрезав их ниже щиколоток', ar: 'من لم يجد نعلين لبس الخفين وقطعهما أسفل من الكعبين', tr: 'Nalın bulamayan erkek mesti topuğun altından kesip giyer', ref: { az: 'Buxari 1542', en: 'al-Bukhari 1542', ru: 'аль-Бухари 1542', ar: 'البخاري ١٥٤٢', tr: 'Buhârî 1542' } },
  { az: 'Qadın niqab və əlcəkdən başqa istədiyi örtülü geyimi geyinir', en: 'A woman wears any modest clothing except niqab and gloves', ru: 'Женщина носит любую закрытую одежду, кроме никаба и перчаток', ar: 'تلبس المرأة ما شاءت من الثياب الساترة إلا النقاب والقفازين', tr: 'Kadın nikap ve eldiven dışında dilediği örtülü giysiyi giyer', ref: { az: 'Buxari 1838', en: 'al-Bukhari 1838', ru: 'аль-Бухари 1838', ar: 'البخاري ١٨٣٨', tr: 'Buhârî 1838' } },
]

/** Həccin növləri — cədvəl */
export const HAJJ_TYPES = [
  { id: 'tamattu',
    name: { az: 'Təməttü', en: 'Tamattu‘', ru: 'Таматту', ar: 'التمتع', tr: 'Temettu' },
    ihram: { az: 'Əvvəl ümrə, ihramdan çıxmaq; 8-də həcc üçün yeni ihram', en: 'Umrah first, then leave ihram; new ihram for Hajj on the 8th', ru: 'Сначала умра и выход из ихрама; 8-го — новый ихрам для хаджа', ar: 'عمرة ثم تحلّل، ثم إحرام بالحج يوم الثامن', tr: 'Önce umre ve ihramdan çıkış; 8’inde hac için yeni ihram' },
    hady: { az: 'Vacib', en: 'Required', ru: 'Обязателен', ar: 'واجب', tr: 'Vacip' }, needs: true },
  { id: 'qiran',
    name: { az: 'Qiran', en: 'Qiran', ru: 'Киран', ar: 'القِران', tr: 'Kıran' },
    ihram: { az: 'Həcc və ümrə üçün birlikdə; qurban gününə qədər ihramda', en: 'Hajj and Umrah together; in ihram until the Day of Sacrifice', ru: 'Хадж и умра вместе; в ихраме до дня жертвоприношения', ar: 'بالحج والعمرة معًا، ويبقى محرمًا إلى يوم النحر', tr: 'Hac ve umre için birlikte; kurban gününe kadar ihramda' },
    hady: { az: 'Vacib', en: 'Required', ru: 'Обязателен', ar: 'واجب', tr: 'Vacip' }, needs: true },
  { id: 'ifrad',
    name: { az: 'İfrad', en: 'Ifrad', ru: 'Ифрад', ar: 'الإفراد', tr: 'İfrad' },
    ihram: { az: 'Yalnız həcc üçün; qurban gününə qədər ihramda', en: 'Hajj only; in ihram until the Day of Sacrifice', ru: 'Только хадж; в ихраме до дня жертвоприношения', ar: 'بالحج وحده، ويبقى محرمًا إلى يوم النحر', tr: 'Yalnız hac için; kurban gününe kadar ihramda' },
    hady: { az: 'Yoxdur', en: 'Not required', ru: 'Не обязателен', ar: 'لا يجب', tr: 'Gerekmez' }, needs: false },
]

/** Əlaqəli bölmələr (məzmun təkrarlanmır — keçid) */
export const HAJJ_RELATED = [
  { to: 'holyplaces', icon: 'holyplaces', title: { az: 'Müqəddəs yerlər', en: 'Holy places', ru: 'Святые места', ar: 'الأماكن المقدسة', tr: 'Kutsal yerler' }, text: { az: 'Kəbə, Mina, Ərəfat, Müzdəlifə — fotolar və dəlillər', en: 'Kaaba, Mina, Arafat, Muzdalifah — photos and evidence', ru: 'Кааба, Мина, Арафат, Муздалифа — фото и доводы', ar: 'الكعبة ومنى وعرفات ومزدلفة — صور وأدلة', tr: 'Kâbe, Mina, Arafat, Müzdelife — fotoğraflar ve deliller' } },
  { learn: 'dhul-hijjah-ten', icon: 'learn', title: { az: 'Zülhiccənin on günü', en: 'The ten days of Dhul-Hijjah', ru: 'Десять дней зуль-хиджи', ar: 'عشر ذي الحجة', tr: 'Zilhiccenin on günü' }, text: { az: 'Hacı olmayan üçün: Ərəfə orucu, təkbir', en: 'For non-pilgrims: the Arafah fast, takbir', ru: 'Для непаломников: пост Арафа, такбир', ar: 'لغير الحاج: صيام عرفة والتكبير', tr: 'Hacı olmayan için: Arefe orucu, tekbir' } },
  { learn: 'udhiyah', icon: 'learn', title: { az: 'Qurban', en: 'Udhiyah (sacrifice)', ru: 'Жертвоприношение', ar: 'الأضحية', tr: 'Kurban' }, text: { az: 'Heyvanın şərtləri, vaxtı, ətin bölünməsi', en: 'Conditions of the animal, timing, sharing the meat', ru: 'Условия животного, время, раздел мяса', ar: 'شروطها ووقتها وتقسيم لحمها', tr: 'Hayvanın şartları, vakti, etin paylaşımı' } },
  { learn: 'travel-prayer', icon: 'learn', title: { az: 'Səfər namazı', en: 'The traveller’s prayer', ru: 'Молитва путника', ar: 'صلاة المسافر', tr: 'Yolcu namazı' }, text: { az: 'Qəsr və cəm qaydaları', en: 'Rules of shortening and combining', ru: 'Правила сокращения и объединения', ar: 'أحكام القصر والجمع', tr: 'Kısaltma ve cem kuralları' } },
]
