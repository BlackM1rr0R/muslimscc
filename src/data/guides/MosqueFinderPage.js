// ═══════════════════════════════════════════════════════
// MƏSCİD ƏDƏBLƏRİ — /mosques səhifəsində axtarışın altında
// Bloklar src/data/lessons/README.md formatındadır (LessonBlocks göstərir).
//
// YOXLANILIB (2026-10-31):
// • Hədislər — fawazahmed0/hadith-api (ara-*; Müslim — Fuad Əbdülbaqi nömrəsi,
//   API-də "arabicnumber"): Buxari 415, 426, 444, 509, 510, 636, 651, 662, 855,
//   880, 881, 883, 900, 931, 934, 935; Müslim 251, 440, 443, 564, 568, 665,
//   666, 710, 713, 714, 875, 881; Əbu Davud 561, 567, 1047, 1118 (hamısı
//   əl-Albani: səhih).
// • Fətva (açılıb oxunub): binbaz.org.sa 7799 — qadağan vaxtda təhiyyətul-məscid.
// • TƏKRARLANMIR: camaat və cümə namazının fəziləti (Buxari 645, Müslim 854,
//   857, Buxari 877 — /jamaat səhifəsində), məscidə gedərkən və girərkən
//   oxunan digər dualar (Hisnul-Müslim, 13–15-ci fəsillər) — keçid verilir.
// ═══════════════════════════════════════════════════════

import { localizeSource } from '../../utils/sourceNames.js'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const S = (s) => Object.fromEntries(LANGS.map(l => [l, localizeSource(s, l)]))
const SAHIH = { az: 'səhih (əl-Albani)', en: 'sahih (al-Albani)', ru: 'достоверный (аль-Альбани)', ar: 'صحيح (الألباني)', tr: 'sahih (Elbânî)' }

const URL_BAZ7799 = 'https://binbaz.org.sa/fatwas/7799/%D9%87%D9%84-%D8%AA%D8%AC%D9%88%D8%B2-%D8%AA%D8%AD%D9%8A%D8%A9-%D8%A7%D9%84%D9%85%D8%B3%D8%AC%D8%AF-%D9%88%D9%82%D8%AA-%D8%A7%D9%84%D9%86%D9%87%D9%8A'

export const MOSQUE_GUIDE_TXT = {
  eyebrow: { az: 'Ədəblər və fəzilətlər', en: 'Etiquette and virtues', ru: 'Этикет и достоинства', ar: 'آداب وفضائل', tr: 'Âdâb ve faziletler' },
  title: { az: 'Məscidə gedərkən', en: 'Going to the mosque', ru: 'Отправляясь в мечеть', ar: 'آداب الذهاب إلى المسجد', tr: 'Camiye giderken' },
  lead: { az: 'Məscidə girmək və çıxmaq duaları, təhiyyətul-məscid, namaz qılanın önündən keçməmək, qadınlar və məscid, məscidə piyada getməyin fəziləti və cümə günü ədəbləri — səhih Sünnədən dəlilləri ilə.', en: 'The duas for entering and leaving, tahiyyat al-masjid, not passing in front of one who is praying, women and the mosque, the virtue of walking to the mosque and the etiquette of Friday — with evidence from the authentic Sunnah.', ru: 'Мольбы при входе и выходе, приветствие мечети, запрет проходить перед молящимся, женщины и мечеть, достоинство пешего пути в мечеть и этикет пятницы — с доводами из достоверной Сунны.', ar: 'دعاء الدخول والخروج، وتحية المسجد، والنهي عن المرور بين يدي المصلي، والمرأة والمسجد، وفضل المشي إلى المساجد، وآداب الجمعة — بأدلتها من السنة الصحيحة.', tr: 'Camiye giriş ve çıkış duaları, tahiyyetü’l-mescid, namaz kılanın önünden geçmemek, kadınlar ve cami, camiye yürümenin fazileti ve cuma âdâbı — sahih Sünnetten delilleriyle.' },
  contents: { az: 'Bölmələr', en: 'Sections', ru: 'Разделы', ar: 'الأقسام', tr: 'Bölümler' },
  sources: { az: 'Mənbələr', en: 'Sources', ru: 'Источники', ar: 'المصادر', tr: 'Kaynaklar' },
}

export const MOSQUE_GUIDE = [
  // ── 1. Giriş və çıxış ──
  {
    id: 'enter', icon: 'enter',
    title: { az: 'Məscidə giriş və çıxış', en: 'Entering and leaving the mosque', ru: 'Вход в мечеть и выход из неё', ar: 'دخول المسجد والخروج منه', tr: 'Camiye giriş ve çıkış' },
    blocks: [
      { t: 'p', text: {
        az: 'Peyğəmbər ﷺ hər işində sağdan başlamağı sevirdi (Buxari 426). Alimlər buna əsasən məscidə sağ ayaqla girməyi, sol ayaqla çıxmağı müstəhəb sayırlar. Girəndə və çıxanda isə Peyğəmbərin ﷺ öyrətdiyi dualar oxunur:',
        en: 'The Prophet ﷺ loved to begin with the right in all his affairs (al-Bukhari 426). On this basis scholars consider it recommended to enter the mosque with the right foot and leave with the left. On entering and leaving one says the duas the Prophet ﷺ taught:',
        ru: 'Пророк ﷺ любил начинать с правого во всех своих делах (аль-Бухари 426). Исходя из этого, учёные считают желательным входить в мечеть с правой ноги, а выходить с левой. При входе и выходе произносят мольбы, которым учил Пророк ﷺ:',
        ar: 'كان النبي ﷺ يحب التيمن في شأنه كله (البخاري 426)، ولذا استحب العلماء تقديم الرجل اليمنى عند دخول المسجد واليسرى عند الخروج، ويقول عند الدخول والخروج ما علّمه النبي ﷺ:',
        tr: 'Peygamber ﷺ bütün işlerinde sağdan başlamayı severdi (Buhârî 426). Âlimler buna dayanarak camiye sağ ayakla girip sol ayakla çıkmayı müstehap saymıştır. Girerken ve çıkarken Peygamber’in ﷺ öğrettiği dualar okunur:',
      } },
      { t: 'dua', src: S('Müslim 713'),
        ar: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
        translit: { az: 'Allahumməftəh li əbvabə rahmətik', en: 'Allahumma-ftah li abwaba rahmatik', ru: 'Аллахумма-фтах ли абваба рахматик', tr: 'Allâhümme’ftah lî ebvâbe rahmetik' },
        text: { az: 'Girəndə: «Allahım, mənə rəhmətinin qapılarını aç.»', en: 'On entering: “O Allah, open for me the gates of Your mercy.”', ru: 'При входе: «О Аллах, открой мне врата Твоей милости».', ar: 'عند الدخول.', tr: 'Girerken: “Allah’ım, bana rahmetinin kapılarını aç.”' } },
      { t: 'dua', src: S('Müslim 713'),
        ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
        translit: { az: 'Allahummə inni əs’əlukə min fadlik', en: 'Allahumma inni as’aluka min fadlik', ru: 'Аллахумма инни ас’алюка мин фадлик', tr: 'Allâhümme innî es’elüke min fadlik' },
        text: { az: 'Çıxanda: «Allahım, Səndən lütfündən istəyirəm.»', en: 'On leaving: “O Allah, I ask You of Your bounty.”', ru: 'При выходе: «О Аллах, прошу у Тебя Твоей щедрости».', ar: 'عند الخروج.', tr: 'Çıkarken: “Allah’ım, senden lütfunu istiyorum.”' } },
      { t: 'note', kind: 'tip', text: {
        az: 'Məscidə gedərkən oxunan «nur duası», girişdə Peyğəmbərə ﷺ salavat və şeytandan sığınma kimi başqa səhih formalar Hisnul-Müslimin 13–15-ci fəsillərindədir.',
        en: 'Other authentic forms — the “dua of light” said on the way to the mosque, sending blessings on the Prophet ﷺ and seeking refuge from Shaytan on entering — are in chapters 13–15 of Hisn al-Muslim.',
        ru: 'Другие достоверные формы — «мольба о свете» по пути в мечеть, благословение Пророка ﷺ и прибегание к защите от шайтана при входе — приведены в главах 13–15 «Крепости мусульманина».',
        ar: 'وصيغ أخرى ثابتة — كدعاء النور عند الخروج إلى المسجد، والصلاة على النبي ﷺ والاستعاذة عند دخوله — في الأبواب 13–15 من حصن المسلم.',
        tr: 'Camiye giderken okunan “nur duası”, girişte Peygamber’e ﷺ salavat ve şeytandan sığınma gibi diğer sahih şekiller Hısnü’l-Müslim’in 13–15. bölümlerindedir.',
      } },
    ],
    links: [{ kind: 'page', key: 'hisn', label: { az: 'Məscid duaları — Hisnul-Müslim', en: 'Mosque duas — Hisn al-Muslim', ru: 'Мольбы мечети — «Крепость мусульманина»', ar: 'أذكار المسجد — حصن المسلم', tr: 'Cami duaları — Hısnü’l-Müslim' } }],
  },

  // ── 2. Təhiyyətul-məscid ──
  {
    id: 'tahiyyah', icon: 'prayer',
    title: { az: 'Təhiyyətul-məscid (məscidi salamlama namazı)', en: 'Tahiyyat al-masjid (greeting the mosque)', ru: 'Тахийят аль-масджид (приветствие мечети)', ar: 'تحية المسجد', tr: 'Tahiyyetü’l-mescid (camiyi selamlama namazı)' },
    blocks: [
      { t: 'hadith', src: S('Buxari 444'),
        ar: 'إِذَا دَخَلَ أَحَدُكُمُ الْمَسْجِدَ فَلْيَرْكَعْ رَكْعَتَيْنِ قَبْلَ أَنْ يَجْلِسَ',
        text: { az: '«Biriniz məscidə girəndə oturmazdan əvvəl iki rükət namaz qılsın.»', en: '“When one of you enters the mosque, let him pray two rak‘ahs before sitting.”', ru: '«Когда кто-нибудь из вас входит в мечеть, пусть совершит два ракаата, прежде чем сесть».', tr: '“Biriniz camiye girdiğinde oturmadan önce iki rekât namaz kılsın.”' } },
      { t: 'list', items: [
        { az: 'Bu iki rükət oturmazdan əvvəl qılınır. Məscidə girən şəxs sünnə namazı (məsələn, sübhün sünnəsini) və ya fərzi qılırsa, o da təhiyyənin yerini tutur.', en: 'These two rak‘ahs are prayed before sitting down. If the one entering prays a sunnah prayer (e.g. the sunnah of Fajr) or the obligatory prayer, that takes the place of the greeting.', ru: 'Эти два ракаата совершаются до того, как сесть. Если входящий совершает сунну (например, сунну утренней молитвы) или обязательную молитву, она заменяет приветствие.', ar: 'تُصلّى قبل الجلوس، فإن صلى الداخل راتبة كسنة الفجر أو الفريضة أجزأت عن التحية.', tr: 'Bu iki rekât oturmadan önce kılınır. Camiye giren kişi bir sünnet (ör. sabahın sünneti) veya farz kılarsa, o da tahiyyenin yerini tutar.' },
        { az: 'İqamə oxunubsa, təhiyyə qılınmır — camaata qoşulun: «Namaz üçün iqamə oxunanda fərzdən başqa namaz yoxdur» (Müslim 710).', en: 'If the iqamah has been called, the greeting is not prayed — join the congregation: “When the iqamah for prayer is called, there is no prayer except the obligatory one” (Muslim 710).', ru: 'Если прозвучала икама, приветствие не совершают — присоединитесь к общине: «Когда объявлена икама, нет молитвы, кроме обязательной» (Муслим 710).', ar: 'إذا أقيمت الصلاة فلا تُصلّى التحية بل يدخل مع الإمام؛ لقوله ﷺ: «إِذَا أُقِيمَتِ الصَّلاَةُ فَلاَ صَلاَةَ إِلاَّ الْمَكْتُوبَةُ» (مسلم 710).', tr: 'Kamet getirildiyse tahiyye kılınmaz — cemaate katılın: “Namaz için kamet getirildiğinde farzdan başka namaz yoktur” (Müslim 710).' },
        { az: 'Cümə xütbəsi əsnasında girən şəxs də iki yüngül rükət qılıb oturur — aşağıda, cümə bölməsində.', en: 'One who enters during the Friday khutbah also prays two light rak‘ahs and sits — see the Friday section below.', ru: 'Вошедший во время пятничной проповеди тоже совершает два лёгких ракаата и садится — см. раздел о пятнице ниже.', ar: 'ومن دخل والإمام يخطب يوم الجمعة صلاها ركعتين خفيفتين ثم جلس، وسيأتي في قسم الجمعة.', tr: 'Cuma hutbesi sırasında giren kişi de iki hafif rekât kılıp oturur — aşağıdaki cuma bölümüne bakın.' },
      ] },
      { t: 'qa', items: [
        { q: { az: 'Əsrdən və ya sübhdən sonra (qadağan vaxtda) məscidə girdim. Təhiyyə qılımmı?', en: 'I entered the mosque after Asr or Fajr (a forbidden time). Do I pray the greeting?', ru: 'Я вошёл в мечеть после асра или утренней молитвы (в запретное время). Совершать ли приветствие?', ar: 'دخلت المسجد بعد العصر أو بعد الفجر (وقت نهي)، فهل أصلي التحية؟', tr: 'İkindiden veya sabahtan sonra (yasak vakitte) camiye girdim. Tahiyye kılayım mı?' },
          a: { az: 'İbn Baz: səbəbli namazlar (təhiyyətul-məscid, təvaf namazı, küsuf namazı) qadağan vaxtda da qılınır. Əsrdən və ya sübhdən sonra məscidə girən üçün daha yaxşısı iki rükət qılmaq və onlardan əvvəl oturmamaqdır.', en: 'Ibn Baz: prayers with a cause (tahiyyat al-masjid, the prayer after tawaf, the eclipse prayer) may be prayed even at the forbidden times. For one who enters after Asr or Fajr, the better course is to pray two rak‘ahs and not sit before them.', ru: 'Ибн Баз: молитвы, имеющие причину (приветствие мечети, молитва после тавафа, молитва при затмении), совершаются и в запретное время. Тому, кто вошёл после асра или утренней молитвы, лучше совершить два ракаата и не садиться до них.', ar: 'قال ابن باز: ذوات الأسباب كتحية المسجد وركعتي الطواف وصلاة الكسوف لا نهي عنها، فمن دخل المسجد بعد العصر أو بعد الفجر فالأفضل أن يصلي ركعتين ولا يجلس قبلهما.', tr: 'İbn Bâz: sebebe bağlı namazlar (tahiyyetü’l-mescid, tavaf namazı, küsuf namazı) yasak vakitlerde de kılınır. İkindiden veya sabahtan sonra camiye giren için daha iyisi iki rekât kılmak ve onlardan önce oturmamaktır.' },
          ref: { az: 'İbn Baz — «Qadağan vaxtda təhiyyətul-məscid caizdirmi?»', en: 'Ibn Baz — “Is tahiyyat al-masjid permitted at a forbidden time?”', ru: 'Ибн Баз — «Можно ли совершать приветствие мечети в запретное время?»', ar: 'ابن باز — هل تجوز تحية المسجد وقت النهي؟', tr: 'İbn Bâz — “Yasak vakitte tahiyyetü’l-mescid caiz midir?”' },
          url: URL_BAZ7799 },
      ] },
    ],
  },

  // ── 3. Namaz qılanın önü ──
  {
    id: 'sutrah', icon: 'shield',
    title: { az: 'Namaz qılanın önündən keçməmək', en: 'Not passing in front of one who is praying', ru: 'Не проходить перед молящимся', ar: 'النهي عن المرور بين يدي المصلي', tr: 'Namaz kılanın önünden geçmemek' },
    blocks: [
      { t: 'hadith', src: S('Buxari 510'),
        ar: 'لَوْ يَعْلَمُ الْمَارُّ بَيْنَ يَدَىِ الْمُصَلِّي مَاذَا عَلَيْهِ لَكَانَ أَنْ يَقِفَ أَرْبَعِينَ خَيْرًا لَهُ مِنْ أَنْ يَمُرَّ بَيْنَ يَدَيْهِ',
        text: { az: '«Namaz qılanın önündən keçən adam bunun ona nə (günah) gətirdiyini bilsəydi, onun önündən keçməkdənsə qırx (gün, ay və ya il — ravi əmin deyil) dayanması onun üçün daha xeyirli olardı.»', en: '“If the one who passes in front of a person praying knew what (sin) is upon him, it would be better for him to stand still for forty than to pass in front of him.” (The narrator was unsure whether he said forty days, months or years.)', ru: '«Если бы проходящий перед молящимся знал, что ему за это будет, то ему было бы лучше простоять сорок, чем пройти перед ним». (Передатчик не был уверен, сказал ли он сорок дней, месяцев или лет.)', tr: '“Namaz kılanın önünden geçen kişi bunun kendisine ne (günah) getirdiğini bilseydi, onun önünden geçmektense kırk (gün, ay veya yıl — râvi emin değil) beklemesi kendisi için daha hayırlı olurdu.”' } },
      { t: 'hadith', src: S('Buxari 509'),
        ar: 'إِذَا صَلَّى أَحَدُكُمْ إِلَى شَىْءٍ يَسْتُرُهُ مِنَ النَّاسِ، فَأَرَادَ أَحَدٌ أَنْ يَجْتَازَ بَيْنَ يَدَيْهِ فَلْيَدْفَعْهُ',
        text: { az: '«Biriniz onu insanlardan pərdələyən bir şeyə (sütrəyə) tərəf namaz qılarkən kimsə onun önündən keçmək istəsə, onu geri itsin.»', en: '“When one of you prays towards something that screens him from people (a sutrah) and someone wants to pass in front of him, let him push him back.”', ru: '«Если кто-нибудь из вас молится, обратившись к чему-то, что заслоняет его от людей (сутре), и кто-то хочет пройти перед ним, пусть он отстранит его».', tr: '“Biriniz kendisini insanlardan perdeleyen bir şeye (sütreye) doğru namaz kılarken biri önünden geçmek isterse onu geri itsin.”' } },
      { t: 'list', items: [
        { az: 'Namaz qılanla onun sütrəsi (divar, sütun, əşya) arasından keçməyin; arxasından və ya kifayət qədər uzaqdan keçin.', en: 'Do not pass between a person praying and his sutrah (a wall, pillar or object); pass behind him or at a sufficient distance.', ru: 'Не проходите между молящимся и его сутрой (стеной, колонной, предметом); проходите позади или на достаточном расстоянии.', ar: 'لا تمرّ بين المصلي وسترته (جدار أو سارية أو شيء)، بل مُرّ من خلفه أو بعيدًا عنه.', tr: 'Namaz kılan ile sütresi (duvar, sütun, eşya) arasından geçmeyin; arkasından veya yeterince uzaktan geçin.' },
        { az: 'Özünüz tək qılanda divara, sütuna və ya qarşınıza qoyduğunuz bir əşyaya tərəf qılın — bu, namazınızı qoruyur və başqalarına keçmək üçün yer saxlayır.', en: 'When you pray alone, pray towards a wall, a pillar or an object placed in front of you — this protects your prayer and leaves room for others to pass.', ru: 'Когда молитесь в одиночку, становитесь лицом к стене, колонне или поставленному перед собой предмету — это оберегает вашу молитву и оставляет место для прохода другим.', ar: 'إذا صليت منفردًا فصلِّ إلى جدار أو سارية أو شيء تضعه أمامك؛ فذلك يحفظ صلاتك ويترك للناس ممرًّا.', tr: 'Tek başınıza kıldığınızda bir duvara, sütuna veya önünüze koyduğunuz bir eşyaya doğru kılın — bu namazınızı korur ve başkalarına geçecek yer bırakır.' },
        { az: 'Camaat namazında imamın sütrəsi arxadakılar üçün də sütrədir; ehtiyac olanda səflərin önündən keçmək məsələsində alimlər yumşaqlıq göstərmişlər.', en: 'In congregational prayer the imam’s sutrah is a sutrah for those behind him; scholars have been lenient about passing in front of the rows when needed.', ru: 'В коллективной молитве сутра имама является сутрой и для стоящих позади; учёные проявляют снисхождение к проходу перед рядами при необходимости.', ar: 'وفي الجماعة سترة الإمام سترة لمن خلفه، وقد رخّص العلماء في المرور بين يدي الصفوف للحاجة.', tr: 'Cemaatle namazda imamın sütresi arkasındakiler için de sütredir; âlimler gerektiğinde safların önünden geçme konusunda hoşgörü göstermiştir.' },
      ] },
    ],
  },

  // ── 4. Sarımsaq, soğan, pis qoxu ──
  {
    id: 'smell', icon: 'leaf',
    title: { az: 'Sarımsaq, soğan və pis qoxu', en: 'Garlic, onion and bad smells', ru: 'Чеснок, лук и неприятный запах', ar: 'الثوم والبصل والروائح الكريهة', tr: 'Sarımsak, soğan ve kötü koku' },
    blocks: [
      { t: 'hadith', src: S('Buxari 855'),
        ar: 'مَنْ أَكَلَ ثُومًا أَوْ بَصَلاً فَلْيَعْتَزِلْنَا ـ أَوْ قَالَ ـ فَلْيَعْتَزِلْ مَسْجِدَنَا، وَلْيَقْعُدْ فِي بَيْتِهِ',
        text: { az: '«Kim sarımsaq və ya soğan yeyibsə, bizdən — yaxud dedi: məscidimizdən — uzaq dursun və evində otursun.»', en: '“Whoever has eaten garlic or onion, let him keep away from us — or he said: from our mosque — and stay in his house.”', ru: '«Кто поел чеснока или лука, пусть держится от нас подальше — или он сказал: от нашей мечети — и остаётся дома».', tr: '“Kim sarımsak veya soğan yerse bizden — yahut: mescidimizden — uzak dursun ve evinde otursun.”' } },
      { t: 'hadith', src: S('Müslim 564'),
        ar: 'مَنْ أَكَلَ مِنْ هَذِهِ الشَّجَرَةِ الْمُنْتِنَةِ فَلاَ يَقْرَبَنَّ مَسْجِدَنَا فَإِنَّ الْمَلاَئِكَةَ تَأَذَّى مِمَّا يَتَأَذَّى مِنْهُ الإِنْسُ',
        text: { az: '«Kim bu pis qoxulu bitkidən yeyibsə, məscidimizə yaxınlaşmasın, çünki insanları narahat edən şey mələkləri də narahat edir.»', en: '“Whoever eats from this foul-smelling plant should not come near our mosque, for the angels are harmed by what harms human beings.”', ru: '«Кто поел этого дурно пахнущего растения, пусть не приближается к нашей мечети, ибо ангелам досаждает то же, что досаждает людям».', tr: '“Kim bu kötü kokulu bitkiden yerse mescidimize yaklaşmasın; çünkü insanları rahatsız eden şey melekleri de rahatsız eder.”' } },
      { t: 'p', text: {
        // lang-ok[siqaret]: Azərbaycan dilində düzgün sözdür (türkcə "sigara")
        az: 'Sarımsaq və soğan yemək haram deyil; qadağa qoxu qalarkən məscidə gəlməyə aiddir. Hədisdəki səbəb (insanları və mələkləri narahat etmək) göstərir ki, tütün və siqaret qoxusu, tər, kirli corab kimi hər pis qoxu da eyni hökmdədir. Məscidə təmiz, mümkünsə ətirli gəlmək Sünnəyə uyğundur.',
        en: 'Eating garlic and onion is not haram; the prohibition concerns coming to the mosque while the smell remains. The reason given in the hadith — harming people and angels — shows that every bad smell, such as tobacco, sweat or dirty socks, takes the same ruling. Coming to the mosque clean, and perfumed where possible, is in line with the Sunnah.',
        ru: 'Есть чеснок и лук не запрещено; запрет касается прихода в мечеть, пока сохраняется запах. Причина, указанная в хадисе, — беспокойство людей и ангелов — показывает, что любой неприятный запах, например табака, пота или грязных носков, имеет то же положение. Приходить в мечеть чистым и, по возможности, надушенным — соответствует Сунне.',
        ar: 'أكل الثوم والبصل ليس حرامًا، وإنما النهي عن إتيان المسجد ورائحته باقية، والعلة المذكورة — أذى الناس والملائكة — تدل على أن كل رائحة كريهة كالدخان والعرق والجوارب المتسخة لها الحكم نفسه، والمشروع أن يأتي المسجد نظيفًا متطيبًا ما أمكن.',
        tr: 'Sarımsak ve soğan yemek haram değildir; yasak koku devam ederken camiye gelmekle ilgilidir. Hadiste belirtilen sebep — insanları ve melekleri rahatsız etmek — tütün, ter, kirli çorap gibi her kötü kokunun aynı hükümde olduğunu gösterir. Camiye temiz ve mümkünse güzel kokulu gelmek Sünnete uygundur.',
      } },
    ],
  },

  // ── 5. Qadınlar ──
  {
    id: 'women', icon: 'user',
    title: { az: 'Qadınlar və məscid', en: 'Women and the mosque', ru: 'Женщины и мечеть', ar: 'المرأة والمسجد', tr: 'Kadınlar ve cami' },
    blocks: [
      { t: 'hadith', src: S('Buxari 900'),
        ar: 'لاَ تَمْنَعُوا إِمَاءَ اللَّهِ مَسَاجِدَ اللَّهِ',
        text: { az: '«Allahın qullarını (qadınları) Allahın məscidlərindən çəkindirməyin.»', en: '“Do not prevent the female servants of Allah from the mosques of Allah.”', ru: '«Не препятствуйте рабыням Аллаха посещать мечети Аллаха».', tr: '“Allah’ın kadın kullarını Allah’ın mescitlerinden alıkoymayın.”' } },
      { t: 'hadith', src: S('Əbu Davud 567'), grade: SAHIH,
        ar: 'لاَ تَمْنَعُوا نِسَاءَكُمُ الْمَسَاجِدَ وَبُيُوتُهُنَّ خَيْرٌ لَهُنَّ',
        text: { az: '«Qadınlarınızı məscidlərdən çəkindirməyin, amma evləri onlar üçün daha xeyirlidir.»', en: '“Do not prevent your women from the mosques, but their houses are better for them.”', ru: '«Не запрещайте вашим женщинам ходить в мечети, но их дома лучше для них».', tr: '“Kadınlarınızı mescitlerden alıkoymayın; ama evleri onlar için daha hayırlıdır.”' } },
      { t: 'list', items: [
        { az: 'Qadının məscidə getməsi caizdir və ərinin, şərtlərə əməl olunarsa, onu çəkindirməməsi tələb olunur; evində qılması isə onun üçün daha fəzilətlidir.', en: 'It is permissible for a woman to go to the mosque, and her husband should not prevent her when the conditions are met; praying at home is more virtuous for her.', ru: 'Женщине разрешено ходить в мечеть, и муж не должен препятствовать ей при соблюдении условий; молиться дома для неё достойнее.', ar: 'يجوز للمرأة الخروج إلى المسجد، ولا يمنعها زوجها إذا تحققت الشروط، وصلاتها في بيتها أفضل لها.', tr: 'Kadının camiye gitmesi caizdir ve şartlar yerine getirildiğinde kocası ona engel olmamalıdır; evinde kılması ise onun için daha faziletlidir.' },
        { az: 'Ətirlənməmək: «Biriniz məscidə gələndə ətirə toxunmasın» (Müslim 443).', en: 'No perfume: “When one of you attends the mosque, she should not touch perfume” (Muslim 443).', ru: 'Без благовоний: «Когда кто-нибудь из вас (женщин) приходит в мечеть, пусть не касается благовоний» (Муслим 443).', ar: 'ألا تتطيب؛ لقوله ﷺ: «إِذَا شَهِدَتْ إِحْدَاكُنَّ الْمَسْجِدَ فَلاَ تَمَسَّ طِيبًا» (مسلم 443).', tr: 'Koku sürünmemek: “Biriniz camiye geldiğinde koku sürünmesin” (Müslim 443).' },
        { az: 'Şəri örtüyə riayət etmək və kişilərlə qarışmamaq. Qadınlar kişilərin arxasında səf tutur: «Qadın səflərinin ən xeyirlisi sonuncusudur» (Müslim 440).', en: 'Observing proper hijab and not mixing with men. Women form rows behind the men: “The best rows for women are the last ones” (Muslim 440).', ru: 'Соблюдать шариатское покрытие и не смешиваться с мужчинами. Женщины становятся рядами позади мужчин: «Лучшие ряды женщин — последние» (Муслим 440).', ar: 'الالتزام بالحجاب الشرعي وعدم الاختلاط بالرجال، وتكون صفوفهن خلف الرجال؛ لقوله ﷺ: «وَخَيْرُ صُفُوفِ النِّسَاءِ آخِرُهَا» (مسلم 440).', tr: 'Şer‘î örtüye uymak ve erkeklerle karışmamak. Kadınlar erkeklerin arkasında saf tutar: “Kadın saflarının en hayırlısı en sondakidir” (Müslim 440).' },
      ] },
    ],
    links: [{ kind: 'lesson', slug: 'hijab', label: { az: 'Hicab və övrət — dərs', en: 'Hijab and the awrah — lesson', ru: 'Хиджаб и аурат — урок', ar: 'الحجاب والعورة — درس', tr: 'Tesettür ve avret — ders' } }],
  },

  // ── 6. Məsciddə ədəb ──
  {
    id: 'inside', icon: 'mosques',
    title: { az: 'Məscidin içində', en: 'Inside the mosque', ru: 'Внутри мечети', ar: 'داخل المسجد', tr: 'Caminin içinde' },
    blocks: [
      { t: 'list', items: [
        { az: 'Məscid itmiş əşya elan etmək yeri deyil: «Kim məsciddə itmiş əşyasını axtarıb car çəkən birini eşitsə, desin: “Allah onu sənə qaytarmasın!” — çünki məscidlər bunun üçün tikilməyib» (Müslim 568).', en: 'The mosque is not a place for announcing lost property: “Whoever hears a man calling out in the mosque for a lost item, let him say: ‘May Allah not return it to you!’ — for the mosques were not built for this” (Muslim 568).', ru: 'Мечеть — не место для объявлений о потерянных вещах: «Кто услышит, как человек в мечети ищет пропажу, пусть скажет: “Да не вернёт её тебе Аллах!” — ибо мечети построены не для этого» (Муслим 568).', ar: 'المسجد ليس موضعًا لنشد الضالة؛ قال ﷺ: «مَنْ سَمِعَ رَجُلاً يَنْشُدُ ضَالَّةً فِي الْمَسْجِدِ فَلْيَقُلْ لاَ رَدَّهَا اللَّهُ عَلَيْكَ فَإِنَّ الْمَسَاجِدَ لَمْ تُبْنَ لِهَذَا» (مسلم 568).', tr: 'Cami kayıp eşya ilan etme yeri değildir: “Kim camide kaybını arayıp seslenen birini duyarsa ‘Allah onu sana geri vermesin!’ desin; çünkü camiler bunun için yapılmamıştır” (Müslim 568).' },
        { az: 'Təmizliyi qorumaq: «Məsciddə tüpürmək günahdır, kəffarəsi onu basdırmaqdır» (Buxari 415) — bu gün bu, məscidi çirkləndirən hər şeydən çəkinmək deməkdir.', en: 'Keeping it clean: “Spitting in the mosque is a sin, and its expiation is burying it” (al-Bukhari 415) — today this means avoiding anything that soils the mosque.', ru: 'Беречь чистоту: «Плевок в мечети — грех, и искупление его — закопать его» (аль-Бухари 415); сегодня это означает избегать всего, что загрязняет мечеть.', ar: 'المحافظة على نظافته؛ قال ﷺ: «الْبُزَاقُ فِي الْمَسْجِدِ خَطِيئَةٌ، وَكَفَّارَتُهَا دَفْنُهَا» (البخاري 415)، ويدخل فيه اليوم اجتناب كل ما يقذّر المسجد.', tr: 'Temizliği korumak: “Camide tükürmek günahtır, kefareti onu gömmektir” (Buhârî 415) — bugün bu, camiyi kirleten her şeyden sakınmak demektir.' },
        { az: 'Səsi ucaltmamaq, namaz qılanları və Quran oxuyanları narahat etməmək; telefonu səssiz rejimə keçirmək.', en: 'Not raising your voice or disturbing those praying and reciting Quran; switching your phone to silent.', ru: 'Не повышать голос и не мешать молящимся и читающим Коран; переводить телефон в беззвучный режим.', ar: 'عدم رفع الصوت والتشويش على المصلين والقرّاء، وإسكات الهاتف.', tr: 'Sesi yükseltmemek, namaz kılanları ve Kur’an okuyanları rahatsız etmemek; telefonu sessize almak.' },
        { az: 'Namaza sakit və təmkinlə gəlmək, qaçmamaq: «İqaməni eşidəndə namaza sakitlik və təmkinlə yeriyin, tələsməyin; çatdığınızı qılın, qaçırdığınızı tamamlayın» (Buxari 636).', en: 'Coming to the prayer calmly and with dignity, without running: “When you hear the iqamah, walk to the prayer with tranquillity and dignity and do not hurry; pray what you catch and complete what you missed” (al-Bukhari 636).', ru: 'Приходить на молитву спокойно и степенно, не бегом: «Услышав икаму, идите на молитву со спокойствием и достоинством, не спешите; что застанете — совершите, а что упустите — восполните» (аль-Бухари 636).', ar: 'المجيء إلى الصلاة بسكينة ووقار دون إسراع؛ لقوله ﷺ: «إِذَا سَمِعْتُمُ الإِقَامَةَ فَامْشُوا إِلَى الصَّلاَةِ، وَعَلَيْكُمْ بِالسَّكِينَةِ وَالْوَقَارِ وَلاَ تُسْرِعُوا، فَمَا أَدْرَكْتُمْ فَصَلُّوا وَمَا فَاتَكُمْ فَأَتِمُّوا» (البخاري 636).', tr: 'Namaza sükûnet ve vakarla gelmek, koşmamak: “Kameti duyduğunuzda namaza sükûnet ve vakarla yürüyün, acele etmeyin; yetiştiğinizi kılın, kaçırdığınızı tamamlayın” (Buhârî 636).' },
      ] },
    ],
  },

  // ── 7. Məscidə piyada getməyin fəziləti ──
  {
    id: 'walking', icon: 'sparkle',
    title: { az: 'Məscidə piyada getməyin fəziləti', en: 'The virtue of walking to the mosque', ru: 'Достоинство пешего пути в мечеть', ar: 'فضل المشي إلى المساجد', tr: 'Camiye yürümenin fazileti' },
    blocks: [
      { t: 'hadith', src: S('Müslim 666'),
        ar: 'مَنْ تَطَهَّرَ فِي بَيْتِهِ ثُمَّ مَشَى إِلَى بَيْتٍ مِنْ بُيُوتِ اللَّهِ لِيَقْضِيَ فَرِيضَةً مِنْ فَرَائِضِ اللَّهِ كَانَتْ خَطْوَتَاهُ إِحْدَاهُمَا تَحُطُّ خَطِيئَةً وَالأُخْرَى تَرْفَعُ دَرَجَةً',
        text: { az: '«Kim evində təharət alıb Allahın fərzlərindən birini yerinə yetirmək üçün Allahın evlərindən birinə yeriyərsə, addımlarından biri bir xətanı silər, digəri bir dərəcə ucaldar.»', en: '“Whoever purifies himself in his house, then walks to one of the houses of Allah to fulfil one of the obligations of Allah, one of his steps removes a sin and the other raises him a degree.”', ru: '«Кто очистился у себя дома, а затем пошёл в один из домов Аллаха, чтобы исполнить одну из обязанностей перед Аллахом, то один его шаг стирает прегрешение, а другой возвышает на ступень».', tr: '“Kim evinde temizlenip Allah’ın farzlarından birini eda etmek için Allah’ın evlerinden birine yürürse, adımlarından biri bir hatayı siler, diğeri bir derece yükseltir.”' } },
      { t: 'hadith', src: S('Buxari 662'),
        ar: 'مَنْ غَدَا إِلَى الْمَسْجِدِ وَرَاحَ أَعَدَّ اللَّهُ لَهُ نُزُلَهُ مِنَ الْجَنَّةِ كُلَّمَا غَدَا أَوْ رَاحَ',
        text: { az: '«Kim səhər və axşam məscidə gedərsə, Allah hər gedişi üçün ona Cənnətdə qonaqlıq hazırlayar.»', en: '“Whoever goes to the mosque in the morning and the evening, Allah prepares for him a place of hospitality in Paradise every time he goes, morning or evening.”', ru: '«Кто ходит в мечеть утром и вечером, тому Аллах приготовит угощение в Раю всякий раз, когда он идёт утром или вечером».', tr: '“Kim sabah ve akşam mescide giderse, Allah her gidişinde onun için cennette bir ikram hazırlar.”' } },
      { t: 'hadith', src: S('Buxari 651'),
        ar: 'أَعْظَمُ النَّاسِ أَجْرًا فِي الصَّلاَةِ أَبْعَدُهُمْ فَأَبْعَدُهُمْ مَمْشًى',
        text: { az: '«Namazda savabı ən böyük olan insanlar (məscidə) ən uzaqdan yeriyənlərdir.»', en: '“The people with the greatest reward for prayer are those who walk the farthest distance (to it).”', ru: '«Наибольшую награду за молитву получают те, кто проходит до неё самый дальний путь».', tr: '“Namazda sevabı en büyük olanlar, (camiye) en uzaktan yürüyenlerdir.”' } },
      { t: 'hadith', src: S('Əbu Davud 561'), grade: SAHIH,
        ar: 'بَشِّرِ الْمَشَّائِينَ فِي الظُّلَمِ إِلَى الْمَسَاجِدِ بِالنُّورِ التَّامِّ يَوْمَ الْقِيَامَةِ',
        text: { az: '«Qaranlıqda məscidlərə gedənlərə Qiyamət günü tam nur müjdələ.»', en: '“Give glad tidings to those who walk to the mosques in the darkness of complete light on the Day of Resurrection.”', ru: '«Обрадуй тех, кто ходит в мечети во мраке, полным светом в День воскресения».', tr: '“Karanlıklarda mescitlere yürüyenleri kıyamet günü tam bir nurla müjdele.”' } },
      { t: 'list', items: [
        { az: 'Bəni Sələmə məscidə yaxın köçmək istəyəndə Peyğəmbər ﷺ dedi: «Evlərinizdə qalın, izləriniz (addımlarınız) yazılır» (Müslim 665).', en: 'When Banu Salimah wanted to move close to the mosque, the Prophet ﷺ said: “Stay in your homes; your footsteps are being written” (Muslim 665).', ru: 'Когда Бану Салима захотели переселиться поближе к мечети, Пророк ﷺ сказал: «Оставайтесь в своих домах — ваши следы записываются» (Муслим 665).', ar: 'لما أراد بنو سلمة أن ينتقلوا قرب المسجد قال ﷺ: «يَا بَنِي سَلِمَةَ دِيَارَكُمْ تُكْتَبْ آثَارُكُمْ» (مسلم 665).', tr: 'Selimeoğulları mescide yakın taşınmak istediğinde Peygamber ﷺ: “Evlerinizde kalın, izleriniz (adımlarınız) yazılıyor” buyurdu (Müslim 665).' },
        { az: '«Allahın xətaları silib dərəcələri ucaltdığı şeyi sizə deyimmi?» — «Çətinliklərə baxmayaraq dəstəmazı kamil almaq, məscidlərə çox addım atmaq və bir namazdan sonra digərini gözləmək. Bu, ribatdır» (Müslim 251).', en: '“Shall I not tell you of that by which Allah erases sins and raises degrees?” — “Performing ablution thoroughly despite difficulties, taking many steps to the mosques, and waiting for the next prayer after a prayer. That is the ribat” (Muslim 251).', ru: '«Не указать ли вам на то, чем Аллах стирает прегрешения и возвышает степени?» — «Тщательное омовение, несмотря на трудности, много шагов к мечетям и ожидание следующей молитвы после молитвы. Это и есть рибат» (Муслим 251).', ar: 'قال ﷺ: «أَلاَ أَدُلُّكُمْ عَلَى مَا يَمْحُو اللَّهُ بِهِ الْخَطَايَا وَيَرْفَعُ بِهِ الدَّرَجَاتِ؟ ... إِسْبَاغُ الْوُضُوءِ عَلَى الْمَكَارِهِ، وَكَثْرَةُ الْخُطَا إِلَى الْمَسَاجِدِ، وَانْتِظَارُ الصَّلاَةِ بَعْدَ الصَّلاَةِ، فَذَلِكُمُ الرِّبَاطُ» (مسلم 251).', tr: '“Allah’ın günahları silip dereceleri yükselttiği şeyi size haber vereyim mi?” — “Zorluklara rağmen abdesti güzel almak, mescitlere çok adım atmak ve namazdan sonra namazı beklemek. İşte ribat budur” (Müslim 251).' },
      ] },
      { t: 'note', kind: 'info', text: {
        az: 'Camaat namazının 27 dərəcə üstünlüyü, işa və sübhü camaatla qılmağın fəziləti və cümə gününün fəzilətləri «Camaat və cümə namazı» səhifəsindədir.',
        en: 'The 27-fold superiority of congregational prayer, the virtue of praying Isha and Fajr in congregation and the virtues of Friday are on the “Congregational and Friday prayer” page.',
        ru: 'Превосходство коллективной молитвы в 27 степеней, достоинство ночной и утренней молитв в общине и достоинства пятницы — на странице «Коллективный и пятничный намаз».',
        ar: 'فضل صلاة الجماعة بسبع وعشرين درجة، وفضل العشاء والفجر في جماعة، وفضائل يوم الجمعة — في صفحة «صلاة الجماعة والجمعة».',
        tr: 'Cemaatle namazın 27 derece üstünlüğü, yatsı ve sabahı cemaatle kılmanın fazileti ve cuma gününün faziletleri “Cemaat ve cuma namazı” sayfasındadır.',
      } },
    ],
    links: [{ kind: 'page', key: 'jamaat', label: { az: 'Camaat və cümə namazı — vaxtlar və fəzilətlər', en: 'Congregational and Friday prayer — times and virtues', ru: 'Коллективный и пятничный намаз — время и достоинства', ar: 'صلاة الجماعة والجمعة — المواقيت والفضائل', tr: 'Cemaat ve cuma namazı — vakitler ve faziletler' } }],
  },

  // ── 8. Cümə ədəbləri ──
  {
    id: 'jumuah', icon: 'holyplaces',
    title: { az: 'Cümə günü ədəbləri', en: 'Etiquette of Friday (Jumu‘ah)', ru: 'Этикет пятницы (джума)', ar: 'آداب يوم الجمعة', tr: 'Cuma günü âdâbı' },
    blocks: [
      { t: 'steps', items: [
        { title: { az: 'Qüsl, misvak, ətir', en: 'Ghusl, siwak and perfume', ru: 'Гусль, сивак и благовония', ar: 'الغسل والسواك والطيب', tr: 'Gusül, misvak ve güzel koku' },
          text: { az: '«Cümə günü qüsl hər həddi-büluğa çatmış şəxsə vacibdir; həmçinin dişlərini misvakla təmizləməsi və tapırsa ətirlənməsi» (Buxari 880).', en: '“Ghusl on Friday is obligatory for everyone who has reached puberty, and that he cleans his teeth with siwak and applies perfume if he finds any” (al-Bukhari 880).', ru: '«Гусль в пятницу обязателен для каждого достигшего зрелости, а также почистить зубы сиваком и надушиться, если найдёт благовоние» (аль-Бухари 880).', ar: 'قال ﷺ: «الْغُسْلُ يَوْمَ الْجُمُعَةِ وَاجِبٌ عَلَى كُلِّ مُحْتَلِمٍ، وَأَنْ يَسْتَنَّ، وَأَنْ يَمَسَّ طِيبًا إِنْ وَجَدَ» (البخاري 880).', tr: '“Cuma günü gusül her ergen kişiye vaciptir; ayrıca dişlerini misvaklaması ve bulursa güzel koku sürünmesi” (Buhârî 880).' } },
        { title: { az: 'Tez getmək', en: 'Going early', ru: 'Приходить пораньше', ar: 'التبكير', tr: 'Erken gitmek' },
          text: { az: 'Birinci saatda gedən dəvə, ikincidə inək, üçüncüdə buynuzlu qoç, dördüncüdə toyuq, beşincidə yumurta qurban etmiş kimidir; imam çıxanda mələklər zikri (xütbəni) dinləməyə gəlirlər (Buxari 881).', en: 'Whoever goes in the first hour is like one who offered a camel, in the second a cow, in the third a horned ram, in the fourth a hen, in the fifth an egg; when the imam comes out, the angels come to listen to the reminder (al-Bukhari 881).', ru: 'Пришедший в первый час подобен принёсшему в жертву верблюда, во второй — корову, в третий — рогатого барана, в четвёртый — курицу, в пятый — яйцо; когда выходит имам, ангелы приходят слушать напоминание (аль-Бухари 881).', ar: 'من راح في الساعة الأولى فكأنما قرّب بدنة، وفي الثانية بقرة، وفي الثالثة كبشًا أقرن، وفي الرابعة دجاجة، وفي الخامسة بيضة، فإذا خرج الإمام حضرت الملائكة يستمعون الذكر (البخاري 881).', tr: 'Birinci saatte giden deve, ikincide sığır, üçüncüde boynuzlu koç, dördüncüde tavuk, beşincide yumurta kurban etmiş gibidir; imam çıkınca melekler zikri dinlemeye gelir (Buhârî 881).' } },
        { title: { az: 'İnsanları aralamamaq, çiyinlərdən aşmamaq', en: 'Not separating people or stepping over them', ru: 'Не разделять людей и не перешагивать через них', ar: 'لا يفرّق بين اثنين ولا يتخطّى الرقاب', tr: 'İnsanları ayırmamak, omuzlarından aşmamak' },
          text: { az: 'Peyğəmbər ﷺ xütbə zamanı insanların çiyinlərindən aşıb keçən adama dedi: «Otur, sən (insanlara) əziyyət verdin» (Əbu Davud 1118, səhih). Yanaşı oturan iki nəfərin arasına soxulmaq da qadağandır (Buxari 883).', en: 'The Prophet ﷺ said to a man stepping over people’s shoulders during the khutbah: “Sit down, you have caused harm” (Abu Dawud 1118, sahih). Squeezing in between two people sitting together is also to be avoided (al-Bukhari 883).', ru: 'Пророк ﷺ сказал человеку, перешагивавшему через плечи людей во время проповеди: «Сядь, ты причинил беспокойство» (Абу Дауд 1118, достоверный). Также не следует втискиваться между двумя сидящими рядом (аль-Бухари 883).', ar: 'قال ﷺ لرجل يتخطى رقاب الناس وهو يخطب: «اجْلِسْ فَقَدْ آذَيْتَ» (أبو داود 1118، صحيح)، ولا يفرّق بين اثنين (البخاري 883).', tr: 'Peygamber ﷺ hutbe sırasında insanların omuzlarından aşan adama: “Otur, (insanlara) eziyet ettin” buyurdu (Ebû Dâvûd 1118, sahih). Yan yana oturan iki kişinin arasına girmek de yasaktır (Buhârî 883).' } },
        { title: { az: 'Xütbə zamanı girəndə iki rükət', en: 'Two rak‘ahs if you enter during the khutbah', ru: 'Два ракаата, если вошли во время проповеди', ar: 'ركعتان لمن دخل والإمام يخطب', tr: 'Hutbe sırasında girince iki rekât' },
          text: { az: 'Peyğəmbər ﷺ xütbə oxuyarkən bir adam girib oturdu. O soruşdu: «Namaz qıldınmı?» — «Xeyr». — «Qalx, iki rükət qıl» (Buxari 931, Müslim 875). Bu iki rükət yüngül qılınır.', en: 'While the Prophet ﷺ was giving the khutbah a man came in and sat. He asked: “Have you prayed?” — “No.” — “Then pray two rak‘ahs” (al-Bukhari 931, Muslim 875). These two rak‘ahs are kept light.', ru: 'Когда Пророк ﷺ читал проповедь, вошёл человек и сел. Он спросил: «Ты помолился?» — «Нет». — «Тогда соверши два ракаата» (аль-Бухари 931, Муслим 875). Эти два ракаата совершают облегчённо.', ar: 'دخل رجل يوم الجمعة والنبي ﷺ يخطب فقال: «أَصَلَّيْتَ؟» قال: لا، قال: «فَصَلِّ رَكْعَتَيْنِ» (البخاري 931، مسلم 875)، ويخففهما.', tr: 'Peygamber ﷺ hutbe okurken bir adam girip oturdu. “Namaz kıldın mı?” diye sordu. “Hayır.” “Kalk, iki rekât kıl” buyurdu (Buhârî 931, Müslim 875). Bu iki rekât hafif kılınır.' } },
        { title: { az: 'Xütbəni səssizcə dinləmək', en: 'Listening to the khutbah in silence', ru: 'Слушать проповедь молча', ar: 'الإنصات للخطبة', tr: 'Hutbeyi sessizce dinlemek' },
          text: { az: '«İmam xütbə oxuyarkən yanındakına “sus” desən, boş söz demiş olarsan» (Buxari 934). Telefonla məşğul olmaq və söhbət etmək də bu qəbildəndir.', en: '“If you say to your companion ‘Be quiet’ on Friday while the imam is speaking, you have engaged in idle talk” (al-Bukhari 934). Busying yourself with a phone or chatting falls under the same.', ru: '«Если в пятницу, когда имам читает проповедь, ты скажешь соседу “Молчи”, то ты сказал пустое» (аль-Бухари 934). Занятие телефоном и разговоры относятся к тому же.', ar: 'قال ﷺ: «إِذَا قُلْتَ لِصَاحِبِكَ يَوْمَ الْجُمُعَةِ أَنْصِتْ وَالإِمَامُ يَخْطُبُ فَقَدْ لَغَوْتَ» (البخاري 934)، ويدخل فيه الانشغال بالهاتف والحديث.', tr: '“İmam hutbe okurken yanındakine ‘Sus’ dersen boş söz söylemiş olursun” (Buhârî 934). Telefonla uğraşmak ve sohbet etmek de bu kapsamdadır.' } },
        { title: { az: 'Salavat və dua saatı', en: 'Blessings on the Prophet ﷺ and the hour of response', ru: 'Благословения Пророку ﷺ и час ответа', ar: 'الصلاة على النبي ﷺ وساعة الإجابة', tr: 'Salavat ve icabet saati' },
          text: { az: '«Cümə günü mənə çoxlu salavat gətirin, çünki salavatınız mənə təqdim olunur» (Əbu Davud 1047, səhih). Bu gündə elə bir saat var ki, müsəlman qul ona təsadüf edib Allahdan bir şey istəsə, Allah ona verər (Buxari 935).', en: '“Send abundant blessings upon me on Friday, for your blessings are presented to me” (Abu Dawud 1047, sahih). On this day there is an hour in which no Muslim servant asks Allah for something but He gives it to him (al-Bukhari 935).', ru: '«Чаще произносите благословения в мой адрес в пятницу, ибо ваши благословения представляются мне» (Абу Дауд 1047, достоверный). В этот день есть час, в который Аллах даст мусульманину то, что он попросит (аль-Бухари 935).', ar: 'قال ﷺ: «فَأَكْثِرُوا عَلَيَّ مِنَ الصَّلاَةِ فِيهِ فَإِنَّ صَلاَتَكُمْ مَعْرُوضَةٌ عَلَيَّ» (أبو داود 1047، صحيح)، وفيه ساعة لا يوافقها عبد مسلم يسأل الله شيئًا إلا أعطاه إياه (البخاري 935).', tr: '“Cuma günü bana çokça salavat getirin; çünkü salavatınız bana arz olunur” (Ebû Dâvûd 1047, sahih). Bu günde bir saat vardır ki Müslüman kul ona denk gelip Allah’tan bir şey isterse Allah ona verir (Buhârî 935).' } },
        { title: { az: 'Cümədən sonra', en: 'After Jumu‘ah', ru: 'После джума', ar: 'بعد الجمعة', tr: 'Cumadan sonra' },
          text: { az: '«Biriniz cümə namazını qılanda ondan sonra dörd (rükət) qılsın» (Müslim 881).', en: '“When one of you prays Jumu‘ah, let him pray four (rak‘ahs) after it” (Muslim 881).', ru: '«Когда кто-нибудь из вас совершит пятничную молитву, пусть после неё совершит четыре (ракаата)» (Муслим 881).', ar: 'قال ﷺ: «إِذَا صَلَّى أَحَدُكُمُ الْجُمُعَةَ فَلْيُصَلِّ بَعْدَهَا أَرْبَعًا» (مسلم 881).', tr: '“Biriniz cuma namazını kıldığında ondan sonra dört (rekât) kılsın” (Müslim 881).' } },
      ] },
    ],
    links: [{ kind: 'page', key: 'jamaat', label: { az: 'Növbəti cümə və zöhr azanı — Camaat səhifəsi', en: 'Next Friday and the Dhuhr adhan — Congregation page', ru: 'Ближайшая пятница и азан зухра — страница «Коллективный намаз»', ar: 'الجمعة القادمة وأذان الظهر — صفحة الجماعة', tr: 'Sıradaki cuma ve öğle ezanı — Cemaat sayfası' } }],
  },
]

export const MOSQUE_SOURCES = [
  { label: 'ابن باز — هل تجوز تحية المسجد وقت النهي؟', url: URL_BAZ7799 },
  { label: 'Sunnah.com — Sahih al-Bukhari, Sahih Muslim, Sunan Abi Dawud', url: 'https://sunnah.com/' },
]
