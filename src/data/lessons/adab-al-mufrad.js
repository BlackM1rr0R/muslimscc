// əl-Ədəb əl-Müfrəd (İmam Buxari) — seçilmiş fəsillər.
// Yalnız Albaninin "Səhih əl-Ədəb əl-Müfrəd"də səhih/həsən saydığı rəvayətlər.
// Nömrələr kitabın geniş yayılmış nömrələnməsinə görədir (prophetmuhammad.com/adab/<n> — dərəcəsi ilə yoxlanıb).

const SAHIH = { az: 'Səhih (Albani)', en: 'Sahih (al-Albani)', ru: 'Достоверный (аль-Албани)', ar: 'صحيح (الألباني)', tr: 'Sahih (Elbânî)' }
const HASAN = { az: 'Həsən (Albani)', en: 'Hasan (al-Albani)', ru: 'Хороший (аль-Албани)', ar: 'حسن (الألباني)', tr: 'Hasen (Elbânî)' }
const AGREED = { az: 'Səhih', en: 'Sahih', ru: 'Достоверный', ar: 'صحيح', tr: 'Sahih' }
const AM = (n) => ({ az: `əl-Ədəb əl-Müfrəd ${n}`, en: `al-Adab al-Mufrad ${n}`, ru: `аль-Адаб аль-Муфрад ${n}`, ar: `الأدب المفرد ${n}`, tr: `el-Edebü’l-Müfred ${n}` })
const AMB = (n, b) => ({ az: `əl-Ədəb əl-Müfrəd ${n}; Buxari ${b}`, en: `al-Adab al-Mufrad ${n}; al-Bukhari ${b}`, ru: `аль-Адаб аль-Муфрад ${n}; Бухари ${b}`, ar: `الأدب المفرد ${n}؛ البخاري ${b}`, tr: `el-Edebü’l-Müfred ${n}; Buhârî ${b}` })

export const meta = {
  slug: 'adab-al-mufrad',
  cat: 'heart',
  order: 20,
  icon: 'hadith',
  arTitle: 'الأدب المفرد',
  title: {
    az: 'əl-Ədəb əl-Müfrəd: seçilmiş fəsillər',
    en: 'Al-Adab al-Mufrad: Selected Chapters',
    ru: 'Аль-Адаб аль-Муфрад: избранные главы',
    ar: 'الأدب المفرد: أبواب مختارة',
    tr: 'el-Edebü’l-Müfred: Seçme Bölümler',
  },
  summary: {
    az: 'İmam Buxarinin ədəb kitabından seçmələr: yumşaqlıq, söz, salam, kiçiyə mərhəmət, şükür, həya və qəzəb — Albaninin səhih saydığı hədislərlə.',
    en: 'Selections from al-Bukhari’s book of manners: gentleness, speech, greeting, mercy, gratitude, modesty and anger — only hadith al-Albani graded authentic.',
    ru: 'Избранное из книги аль-Бухари о нравах: мягкость, речь, приветствие, милость, благодарность, стыдливость и гнев — только достоверные хадисы.',
    ar: 'مختارات من كتاب الأدب للإمام البخاري: الرفق والكلام والسلام ورحمة الصغير والشكر والحياء والغضب، بما صححه الألباني أو حسّنه.',
    tr: 'Buhârî’nin edep kitabından seçmeler: yumuşaklık, söz, selam, küçüğe merhamet, şükür, hayâ ve öfke — Elbânî’nin sahih saydığı hadislerle.',
  },
  author: {
    az: 'İmam Buxari; hədislərin dərəcəsi — Şeyx Albani',
    en: 'Imam al-Bukhari; hadith grading by Shaykh al-Albani',
    ru: 'Имам аль-Бухари; оценка хадисов — шейх аль-Албани',
    ar: 'الإمام البخاري؛ والحكم على الأحاديث للشيخ الألباني',
    tr: 'İmam Buhârî; hadislerin derecesi — Şeyh Elbânî',
  },
  minutes: 14,
}

export default {
  sections: [
    {
      id: 'intro',
      title: { az: 'Kitab haqqında', en: 'About the book', ru: 'О книге', ar: 'التعريف بالكتاب', tr: 'Kitap hakkında' },
      blocks: [
        { t: 'p', text: {
          az: '«əl-Ədəb əl-Müfrəd» İmam Muhəmməd ibn İsmail əl-Buxarinin (h. 256-cı ildə vəfat edib) «Səhih»indən ayrı yazdığı kitabdır. Adı «ayrıca toplanmış ədəb» deməkdir: içində valideynə yaxşılıq, qohumluq, qonşu, salam, söz, mərhəmət və digər əxlaq mövzularında min üç yüzdən çox rəvayət var — həm Peyğəmbərin ﷺ sözləri, həm də səhabə və tabiinlərin sözləri.',
          en: '“Al-Adab al-Mufrad” is a book that Imam Muhammad ibn Isma‘il al-Bukhari (d. 256 AH) compiled separately from his “Sahih”. Its name means “manners gathered on their own”: it holds more than thirteen hundred narrations on dutifulness to parents, kinship, neighbours, greeting, speech, mercy and other matters of character — sayings of the Prophet ﷺ as well as statements of the Companions and their students.',
          ru: '«Аль-Адаб аль-Муфрад» — книга, которую имам Мухаммад ибн Исмаиль аль-Бухари (ум. в 256 г. х.) составил отдельно от своего «Сахиха». Название означает «нравы, собранные отдельно»: в ней более тысячи трёхсот преданий о почтении к родителям, родственных связях, соседях, приветствии, речи, милости и других сторонах нрава — слова Пророка ﷺ, а также высказывания сподвижников и их учеников.',
          ar: '«الأدب المفرد» كتاب صنّفه الإمام محمد بن إسماعيل البخاري (ت ٢٥٦هـ) مستقلًّا عن «صحيحه»، وسمّاه بذلك لأنه أفرد فيه الآداب. وفيه أكثر من ألف وثلاثمئة رواية في بر الوالدين وصلة الرحم والجار والسلام والكلام والرحمة وسائر الأخلاق، من أحاديث النبي ﷺ وآثار الصحابة والتابعين.',
          tr: '“el-Edebü’l-Müfred”, İmam Muhammed b. İsmâil el-Buhârî’nin (h. 256’da vefat etti) “Sahih”inden ayrı olarak derlediği kitaptır. Adı “ayrıca toplanmış edep” demektir: içinde anne-babaya iyilik, akrabalık, komşu, selam, söz, merhamet ve diğer ahlak konularında bin üç yüzden fazla rivayet bulunur — Peygamber’in ﷺ sözleri yanında sahabe ve tâbiînin sözleri de.',
        } },
        { t: 'note', kind: 'warn', text: {
          az: 'Bu kitab «Səhih əl-Buxari» deyil: içində zəif rəvayətlər də var. Şeyx Albani (h. 1420) onu iki hissəyə ayırıb: «Səhih əl-Ədəb əl-Müfrəd» və «Zəif əl-Ədəb əl-Müfrəd». Bu dərsdə yalnız onun səhih və ya həsən saydığı rəvayətlər götürülüb; nömrələr kitabın geniş yayılmış nömrələnməsinə görədir.',
          en: 'This book is not “Sahih al-Bukhari”: it also contains weak narrations. Shaykh al-Albani (d. 1420 AH) divided it into “Sahih al-Adab al-Mufrad” and “Da‘if al-Adab al-Mufrad”. This lesson uses only what he graded sahih or hasan; numbers follow the widely used numbering of the book.',
          ru: 'Эта книга — не «Сахих аль-Бухари»: в ней есть и слабые предания. Шейх аль-Албани (ум. в 1420 г. х.) разделил её на «Сахих аль-Адаб аль-Муфрад» и «Даиф аль-Адаб аль-Муфрад». В этом уроке взяты только предания, которые он признал достоверными или хорошими; номера даны по общепринятой нумерации книги.',
          ar: 'ليس هذا الكتاب «صحيح البخاري»؛ ففيه روايات ضعيفة أيضًا. وقد قسمه الشيخ الألباني (ت ١٤٢٠هـ) إلى «صحيح الأدب المفرد» و«ضعيف الأدب المفرد». ولم نأخذ في هذا الدرس إلا ما صححه أو حسّنه، والأرقام على الترقيم المشهور للكتاب.',
          tr: 'Bu kitap “Sahîh-i Buhârî” değildir: içinde zayıf rivayetler de vardır. Şeyh Elbânî (h. 1420) onu “Sahîhu’l-Edebi’l-Müfred” ve “Zaîfu’l-Edebi’l-Müfred” olarak ikiye ayırmıştır. Bu derste yalnızca onun sahih veya hasen saydığı rivayetler alınmıştır; numaralar kitabın yaygın numaralandırmasına göredir.',
        } },
        { t: 'ayah', ar: 'وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ', ref: '68:4', text: {
          az: 'Həqiqətən, sən böyük bir əxlaq üzərindəsən.',
          en: 'And indeed, you are of a great moral character.',
          ru: 'Воистину, ты обладаешь великим нравом.',
          ar: 'وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ',
          tr: 'Şüphesiz sen yüce bir ahlak üzeresin.',
        } },
        { t: 'hadith', ar: 'إِنَّمَا بُعِثْتُ لِأُتَمِّمَ صَالِحَ الأَخْلاقِ', src: AM(273), grade: SAHIH, text: {
          az: 'Əbu Hüreyrə rəvayət edir ki, Allahın Elçisi ﷺ dedi: «Mən yalnız gözəl əxlaqı tamamlamaq üçün göndərildim».',
          en: 'Abu Hurayrah reported that the Messenger of Allah ﷺ said: “I was sent only to perfect good character.”',
          ru: 'Абу Хурайра передал, что Посланник Аллаха ﷺ сказал: «Я послан лишь для того, чтобы довести до совершенства благие нравы».',
          ar: 'عن أبي هريرة أن رسول الله ﷺ قال: «إنما بعثت لأتمم صالح الأخلاق».',
          tr: 'Ebû Hüreyre’nin rivayetine göre Allah’ın Resûlü ﷺ şöyle buyurdu: “Ben ancak güzel ahlakı tamamlamak için gönderildim.”',
        } },
        { t: 'p', text: {
          az: 'Valideyn, qohum və qonşu haqları ayrıca «Valideynə yaxşılıq, qohumluq və qonşuluq» dərsindədir; burada isə gündəlik ünsiyyətin ədəbləri — yumşaqlıq, söz, salam, mərhəmət, şükür, həya və qəzəb — toplanıb.',
          en: 'The rights of parents, relatives and neighbours are covered in the separate lesson “Dutifulness to Parents, Kinship and Neighbours”; here we gather the manners of everyday dealings — gentleness, speech, greeting, mercy, gratitude, modesty and anger.',
          ru: 'Права родителей, родственников и соседей разобраны в отдельном уроке «Почтение к родителям, родственные связи и соседи»; здесь собраны нравы повседневного общения — мягкость, речь, приветствие, милость, благодарность, стыдливость и гнев.',
          ar: 'أما حقوق الوالدين والأقارب والجيران ففي درس مستقل بعنوان «بر الوالدين وصلة الرحم وحق الجار»، وجمعنا هنا آداب المعاملة اليومية: الرفق والكلام والسلام والرحمة والشكر والحياء والغضب.',
          tr: 'Anne-baba, akraba ve komşu hakları ayrı bir derste, “Anne-Babaya İyilik, Akrabalık ve Komşuluk” dersinde ele alınmıştır; burada ise günlük ilişkilerin edepleri — yumuşaklık, söz, selam, merhamet, şükür, hayâ ve öfke — toplanmıştır.',
        } },
      ],
    },
    {
      id: 'gentleness',
      title: { az: 'Yumşaqlıq (rifq)', en: 'Gentleness (rifq)', ru: 'Мягкость (рифк)', ar: 'الرفق', tr: 'Yumuşaklık (rifk)' },
      blocks: [
        { t: 'hadith', ar: 'لاَ يَكُونُ الْخُرْقُ فِي شَيْءٍ إِلاَّ شَانَهُ، وَإِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ', src: AM(466), grade: SAHIH, text: {
          az: 'Ənəs rəvayət edir ki, Peyğəmbər ﷺ dedi: «Kobudluq nəyə girərsə, onu eybəcər edər. Həqiqətən, Allah Rəfiqdir, yumşaqlığı sevir».',
          en: 'Anas reported that the Prophet ﷺ said: “Harshness is never in anything except that it disfigures it. Allah is Gentle and loves gentleness.”',
          ru: 'Анас передал, что Пророк ﷺ сказал: «Грубость, оказавшись в чём-либо, непременно обезобразит это. Поистине, Аллах мягок и любит мягкость».',
          ar: 'عن أنس عن النبي ﷺ قال: «لا يكون الخرق في شيء إلا شانه، وإن الله رفيق يحب الرفق».',
          tr: 'Enes’in rivayetine göre Peygamber ﷺ şöyle buyurdu: “Kabalık neye girerse onu çirkinleştirir. Şüphesiz Allah Refîk’tir, yumuşaklığı sever.”',
        } },
        { t: 'hadith', ar: 'مَنْ يُحْرَمُ الرِّفْقَ يُحْرَمُ الْخَيْرَ', src: AM(463), grade: SAHIH, text: {
          az: 'Cərir ibn Abdullah rəvayət edir ki, Allahın Elçisi ﷺ dedi: «Yumşaqlıqdan məhrum olan xeyirdən məhrum olar».',
          en: 'Jarir ibn ‘Abdullah reported that the Messenger of Allah ﷺ said: “Whoever is deprived of gentleness is deprived of good.”',
          ru: 'Джарир ибн Абдуллах передал, что Посланник Аллаха ﷺ сказал: «Тот, кто лишён мягкости, лишён блага».',
          ar: 'عن جرير بن عبد الله قال: قال رسول الله ﷺ: «من يحرم الرفق يحرم الخير».',
          tr: 'Cerîr b. Abdullah’ın rivayetine göre Allah’ın Resûlü ﷺ şöyle buyurdu: “Yumuşaklıktan mahrum olan hayırdan mahrum olur.”',
        } },
        { t: 'hadith', ar: 'فَخَدَمْتُهُ فِي السَّفَرِ وَالْحَضَرِ ... مَا قَالَ لِي لِشَيْءٍ صَنَعْتُ: لِمَ صَنَعْتَ هَذَا هَكَذَا؟ وَلاَ قَالَ لِي لِشَيْءٍ لَمْ أَصْنَعْهُ: أَلاَ صَنَعْتَ هَذَا هَكَذَا؟', src: AM(164), grade: SAHIH, text: {
          az: 'Ənəs deyir: «Səfərdə də, evdə də Peyğəmbərə ﷺ xidmət etdim. Etdiyim bir iş üçün heç vaxt “Bunu niyə belə etdin?”, etmədiyim bir iş üçün də “Niyə bunu belə etmədin?” demədi».',
          en: 'Anas said: “I served him ﷺ on journeys and at home. He never said to me about something I had done, ‘Why did you do it like this?’, nor about something I had not done, ‘Why did you not do it like this?’”',
          ru: 'Анас сказал: «Я служил ему ﷺ и в поездках, и дома. Ни разу он не сказал мне о сделанном: “Почему ты сделал так?”, и ни разу о несделанном: “Почему ты не сделал так?”»',
          ar: 'قال أنس: «فخدمته في السفر والحضر... ما قال لي لشيء صنعته: لم صنعت هذا هكذا؟ ولا لشيء لم أصنعه: ألا صنعت هذا هكذا؟».',
          tr: 'Enes şöyle dedi: “Yolculukta da evde de ona ﷺ hizmet ettim. Yaptığım bir şey için bana asla ‘Bunu niçin böyle yaptın?’, yapmadığım bir şey için de ‘Bunu niçin böyle yapmadın?’ demedi.”',
        } },
        { t: 'list', items: [
          { az: 'Ailədə, işdə və ticarətdə səsi qaldırmadan, təhqirsiz danışmaq.', en: 'Speaking at home, at work and in trade without raising your voice or insulting.', ru: 'Говорить дома, на работе и в торговле, не повышая голоса и не оскорбляя.', ar: 'أن تتكلم في البيت والعمل والتجارة بلا رفع صوت ولا إهانة.', tr: 'Evde, işte ve ticarette sesi yükseltmeden, hakaret etmeden konuşmak.' },
          { az: 'Öyrədəndə asanlaşdırmaq: Peyğəmbər ﷺ «Öyrədin, asanlaşdırın, çətinləşdirməyin» buyurub (əl-Ədəb əl-Müfrəd 245).', en: 'Making things easy when teaching: the Prophet ﷺ said, “Teach, make things easy and do not make them hard” (al-Adab al-Mufrad 245).', ru: 'Облегчать, когда учишь: Пророк ﷺ сказал: «Обучайте, облегчайте и не усложняйте» (аль-Адаб аль-Муфрад 245).', ar: 'التيسير في التعليم؛ قال النبي ﷺ: «علموا ويسروا ولا تعسروا» (الأدب المفرد ٢٤٥).', tr: 'Öğretirken kolaylaştırmak: Peygamber ﷺ “Öğretin, kolaylaştırın, zorlaştırmayın” buyurmuştur (el-Edebü’l-Müfred 245).' },
          { az: 'Xidmətçiyə, işçiyə və uşağa səhvinə görə dərhal danlamamaq — Ənəsin sözündə olduğu kimi.', en: 'Not rushing to rebuke a worker, servant or child for a mistake — as in the words of Anas.', ru: 'Не спешить упрекать работника, слугу или ребёнка за ошибку — как в словах Анаса.', ar: 'ألا تعجل بلوم الخادم والعامل والصبي على خطئه، كما في كلام أنس.', tr: 'Hizmetçiyi, işçiyi ve çocuğu hatası yüzünden hemen azarlamamak — Enes’in sözünde olduğu gibi.' },
        ] },
      ],
    },
    {
      id: 'speech',
      title: { az: 'Dil və söz', en: 'The tongue and speech', ru: 'Язык и речь', ar: 'اللسان والكلام', tr: 'Dil ve söz' },
      blocks: [
        { t: 'ayah', ar: 'وَقُل لِّعِبَادِى يَقُولُوا۟ ٱلَّتِى هِىَ أَحْسَنُ ۚ إِنَّ ٱلشَّيْطَـٰنَ يَنزَغُ بَيْنَهُمْ ۚ إِنَّ ٱلشَّيْطَـٰنَ كَانَ لِلْإِنسَـٰنِ عَدُوًّا مُّبِينًا', ref: '17:53', text: {
          az: 'Qullarıma de ki, ən gözəl sözü desinlər. Şübhəsiz, şeytan onların arasını vurur. Həqiqətən, şeytan insanın açıq düşmənidir.',
          en: 'Tell My servants to say that which is best. Indeed, Satan sows discord among them. Satan is ever, to mankind, a clear enemy.',
          ru: 'Скажи Моим рабам, чтобы они говорили наилучшее. Воистину, шайтан сеет между ними раздор. Воистину, шайтан для человека — явный враг.',
          ar: 'وَقُل لِّعِبَادِى يَقُولُوا۟ ٱلَّتِى هِىَ أَحْسَنُ',
          tr: 'Kullarıma söyle, en güzel sözü söylesinler. Çünkü şeytan aralarını bozar. Şüphesiz şeytan insanın apaçık düşmanıdır.',
        } },
        { t: 'hadith', ar: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيُحْسِنْ إِلَى جَارِهِ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيُكْرِمْ ضَيْفَهُ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ', src: AM(102), grade: SAHIH, text: {
          az: 'Əbu Şureyh əl-Xuzai rəvayət edir ki, Peyğəmbər ﷺ dedi: «Allaha və Axirət gününə iman gətirən qonşusuna yaxşılıq etsin; Allaha və Axirət gününə iman gətirən qonağına hörmət etsin; Allaha və Axirət gününə iman gətirən ya xeyir danışsın, ya da sussun».',
          en: 'Abu Shurayh al-Khuza‘i reported that the Prophet ﷺ said: “Whoever believes in Allah and the Last Day, let him be good to his neighbour; whoever believes in Allah and the Last Day, let him honour his guest; and whoever believes in Allah and the Last Day, let him say good or remain silent.”',
          ru: 'Абу Шурайх аль-Хузаи передал, что Пророк ﷺ сказал: «Кто верует в Аллаха и в Последний день, пусть делает добро соседу; кто верует в Аллаха и в Последний день, пусть почитает гостя; кто верует в Аллаха и в Последний день, пусть говорит благое или молчит».',
          ar: 'عن أبي شريح الخزاعي عن النبي ﷺ قال: «من كان يؤمن بالله واليوم الآخر فليحسن إلى جاره، ومن كان يؤمن بالله واليوم الآخر فليكرم ضيفه، ومن كان يؤمن بالله واليوم الآخر فليقل خيرًا أو ليصمت».',
          tr: 'Ebû Şüreyh el-Huzâî’nin rivayetine göre Peygamber ﷺ şöyle buyurdu: “Allah’a ve ahiret gününe iman eden komşusuna iyilik etsin; Allah’a ve ahiret gününe iman eden misafirine ikram etsin; Allah’a ve ahiret gününe iman eden ya hayır söylesin ya da sussun.”',
        } },
        { t: 'hadith', ar: 'لَيْسَ الْمُؤْمِنُ بِالطَّعَّانِ، وَلاَ اللِّعَانِ، وَلاَ الْفَاحِشِ وَلاَ الْبَذِي', src: AM(312), grade: SAHIH, text: {
          az: 'Abdullah (ibn Məsud) rəvayət edir ki, Peyğəmbər ﷺ dedi: «Mömin tənə vuran, lənət oxuyan, çirkin danışan və ədəbsiz deyil».',
          en: '‘Abdullah (ibn Mas‘ud) reported that the Prophet ﷺ said: “The believer is not a slanderer, nor one who curses, nor obscene, nor foul-mouthed.”',
          ru: 'Абдуллах (ибн Масуд) передал, что Пророк ﷺ сказал: «Верующий не поносит, не проклинает, не сквернословит и не бывает бесстыдным в речи».',
          ar: 'عن عبد الله بن مسعود عن النبي ﷺ قال: «ليس المؤمن بالطعان، ولا اللعان، ولا الفاحش، ولا البذيء».',
          tr: 'Abdullah’ın (b. Mes‘ûd) rivayetine göre Peygamber ﷺ şöyle buyurdu: “Mümin, kötüleyen, lanet eden, çirkin söz söyleyen ve hayâsızca konuşan biri değildir.”',
        } },
        { t: 'steps', items: [
          { title: { az: 'Danışmazdan əvvəl ölç', en: 'Weigh it before you speak', ru: 'Взвесь, прежде чем сказать', ar: 'زن الكلمة قبل أن تقولها', tr: 'Konuşmadan önce tart' }, text: { az: 'Söz xeyirdirsə de, xeyir deyilsə sus — hədisin ölçüsü budur.', en: 'If the word is good, say it; if not, stay silent — this is the measure of the hadith.', ru: 'Если слово благое — скажи, если нет — промолчи: таково мерило хадиса.', ar: 'إن كانت خيرًا فقلها، وإلا فاصمت؛ هذا ميزان الحديث.', tr: 'Söz hayırsa söyle, değilse sus — hadisin ölçüsü budur.' } },
          { title: { az: 'Lənət və söyüşdən uzaq dur', en: 'Keep away from cursing and abuse', ru: 'Сторонись проклятий и брани', ar: 'اجتنب اللعن والسب', tr: 'Lanet ve sövgüden uzak dur' }, text: { az: 'Hirsli vaxtda belə insana, heyvana, günə və havaya lənət oxuma.', en: 'Even when angry, do not curse a person, an animal, the day or the weather.', ru: 'Даже в гневе не проклинай ни человека, ни животное, ни день, ни погоду.', ar: 'لا تلعن إنسانًا ولا دابة ولا يومًا ولا ريحًا ولو كنت غاضبًا.', tr: 'Öfkeliyken bile insana, hayvana, güne ve havaya lanet etme.' } },
          { title: { az: 'Ən gözəl ifadəni seç', en: 'Choose the best expression', ru: 'Выбирай лучшее выражение', ar: 'اختر أحسن العبارة', tr: 'En güzel ifadeyi seç' }, text: { az: 'Haqqı söyləyəndə də yumşaq söz seç; ayə «ən gözəl sözü» əmr edir.', en: 'Even when saying what is right, choose gentle words; the verse commands “that which is best”.', ru: 'Даже говоря истину, выбирай мягкие слова: аят велит говорить «наилучшее».', ar: 'حتى إذا قلت الحق فاختر الكلمة اللينة؛ فالآية تأمر بالتي هي أحسن.', tr: 'Hakkı söylerken bile yumuşak söz seç; ayet “en güzel sözü” emreder.' } },
        ] },
      ],
    },
    {
      id: 'salam',
      title: { az: 'Salam', en: 'The greeting of salam', ru: 'Приветствие (салям)', ar: 'السلام', tr: 'Selam' },
      blocks: [
        { t: 'ayah', ar: 'وَإِذَا حُيِّيتُم بِتَحِيَّةٍ فَحَيُّوا۟ بِأَحْسَنَ مِنْهَآ أَوْ رُدُّوهَآ ۗ إِنَّ ٱللَّهَ كَانَ عَلَىٰ كُلِّ شَىْءٍ حَسِيبًا', ref: '4:86', text: {
          az: 'Sizə bir salam veriləndə ondan daha gözəli ilə və ya onun eynisi ilə cavab verin. Şübhəsiz, Allah hər şeyin hesabını aparandır.',
          en: 'When you are greeted with a greeting, greet in return with one better than it, or return it. Indeed, Allah is ever, over all things, an Accountant.',
          ru: 'Когда вас приветствуют, отвечайте лучшим приветствием или таким же. Воистину, Аллах ведёт счёт всякой вещи.',
          ar: 'وَإِذَا حُيِّيتُم بِتَحِيَّةٍ فَحَيُّوا۟ بِأَحْسَنَ مِنْهَآ أَوْ رُدُّوهَآ',
          tr: 'Bir selamla selamlandığınızda, ondan daha güzeliyle karşılık verin veya aynısıyla iade edin. Şüphesiz Allah her şeyin hesabını görendir.',
        } },
        { t: 'hadith', ar: 'لاَ تَدْخُلُوا الْجَنَّةَ حَتَّى تُؤْمِنُوا، وَلاَ تُؤْمِنُوا حَتَّى تَحَابُّوا، أَلاَ أَدُلُّكُمْ عَلَى مَا تَحَابُّونَ بِهِ؟ قَالُوا: بَلَى، يَا رَسُولَ اللهِ، قَالَ: أَفْشُوا السَّلامَ بَيْنَكُمْ', src: AM(980), grade: SAHIH, text: {
          az: 'Əbu Hüreyrə rəvayət edir ki, Peyğəmbər ﷺ dedi: «İman gətirməyincə Cənnətə girməzsiniz, bir-birinizi sevməyincə iman gətirmiş olmazsınız. Sizə bir-birinizi sevdirəcək şeyi deyimmi?» Dedilər: «Bəli, ey Allahın Elçisi». Buyurdu: «Aranızda salamı yayın».',
          en: 'Abu Hurayrah reported that the Prophet ﷺ said: “You will not enter Paradise until you believe, and you will not believe until you love one another. Shall I show you what will make you love one another?” They said: “Yes, O Messenger of Allah.” He said: “Spread the salam among yourselves.”',
          ru: 'Абу Хурайра передал, что Пророк ﷺ сказал: «Вы не войдёте в Рай, пока не уверуете, и не уверуете, пока не полюбите друг друга. Указать ли вам на то, благодаря чему вы полюбите друг друга?» Сказали: «Да, о Посланник Аллаха». Он сказал: «Распространяйте между собой салям».',
          ar: 'عن أبي هريرة عن النبي ﷺ قال: «لا تدخلوا الجنة حتى تؤمنوا، ولا تؤمنوا حتى تحابوا، ألا أدلكم على ما تحابون به؟» قالوا: بلى يا رسول الله، قال: «أفشوا السلام بينكم».',
          tr: 'Ebû Hüreyre’nin rivayetine göre Peygamber ﷺ şöyle buyurdu: “İman etmedikçe cennete giremezsiniz, birbirinizi sevmedikçe de iman etmiş olmazsınız. Size birbirinizi sevmenizi sağlayacak şeyi göstereyim mi?” “Evet, ey Allah’ın Resûlü” dediler. “Aranızda selamı yayın” buyurdu.',
        } },
        { t: 'hadith', ar: 'يُسَلِّمُ الصَّغِيرُ عَلَى الْكَبِيرِ، وَالْمَاشِي عَلَى الْقَاعِدِ، وَالْقَلِيلُ عَلَى الْكَثِيرِ', src: AM(1001), grade: SAHIH, text: {
          az: 'Əbu Hüreyrə rəvayət edir ki, Allahın Elçisi ﷺ dedi: «Kiçik böyüyə, yeriyən oturana, az olan çox olana salam verir».',
          en: 'Abu Hurayrah reported that the Messenger of Allah ﷺ said: “The young greets the old, the one walking greets the one sitting, and the few greet the many.”',
          ru: 'Абу Хурайра передал, что Посланник Аллаха ﷺ сказал: «Младший приветствует старшего, идущий — сидящего, а малочисленные — многочисленных».',
          ar: 'عن أبي هريرة قال: قال رسول الله ﷺ: «يسلم الصغير على الكبير، والماشي على القاعد، والقليل على الكثير».',
          tr: 'Ebû Hüreyre’nin rivayetine göre Allah’ın Resûlü ﷺ şöyle buyurdu: “Küçük büyüğe, yürüyen oturana, az olan çok olana selam verir.”',
        } },
        { t: 'table',
          head: [
            { az: 'Salam forması', en: 'Form of greeting', ru: 'Форма приветствия', ar: 'صيغة السلام', tr: 'Selam şekli' },
            { az: 'Savab (əl-Ədəb əl-Müfrəd 986)', en: 'Reward (al-Adab al-Mufrad 986)', ru: 'Награда (аль-Адаб аль-Муфрад 986)', ar: 'الأجر (الأدب المفرد ٩٨٦)', tr: 'Sevap (el-Edebü’l-Müfred 986)' },
          ],
          rows: [
            [{ az: 'əs-Səlamu aleykum', en: 'as-Salamu ‘alaykum', ru: 'ас-Саляму алейкум', ar: 'السلام عليكم', tr: 'es-Selâmu aleyküm' }, { az: 'on həsənə', en: 'ten good deeds', ru: 'десять благих дел', ar: 'عشر حسنات', tr: 'on sevap' }],
            [{ az: '… və rahmətullah', en: '… wa rahmatullah', ru: '… ва рахматуллах', ar: '… ورحمة الله', tr: '… ve rahmetullah' }, { az: 'iyirmi həsənə', en: 'twenty good deeds', ru: 'двадцать благих дел', ar: 'عشرون حسنة', tr: 'yirmi sevap' }],
            [{ az: '… və rahmətullahi və bərəkatuh', en: '… wa rahmatullahi wa barakatuh', ru: '… ва рахматуллахи ва баракятух', ar: '… ورحمة الله وبركاته', tr: '… ve rahmetullahi ve berekâtüh' }, { az: 'otuz həsənə', en: 'thirty good deeds', ru: 'тридцать благих дел', ar: 'ثلاثون حسنة', tr: 'otuz sevap' }],
          ],
        },
        { t: 'note', kind: 'tip', text: {
          az: 'Həmin hədisdə (əl-Ədəb əl-Müfrəd 986, səhih) Peyğəmbər ﷺ məclisə gələndə də, oradan qalxanda da salam verməyi əmr edib: «Birinci salam sonuncudan daha haqlı deyil».',
          en: 'In the same hadith (al-Adab al-Mufrad 986, sahih) the Prophet ﷺ commanded giving salam both on arriving at a gathering and on leaving it: “The first is not more deserving than the last.”',
          ru: 'В том же хадисе (аль-Адаб аль-Муфрад 986, достоверный) Пророк ﷺ велел приветствовать и придя в собрание, и покидая его: «Первое приветствие не важнее последнего».',
          ar: 'وفي الحديث نفسه (الأدب المفرد ٩٨٦، صحيح) أمر النبي ﷺ بالسلام عند القدوم على المجلس وعند القيام منه: «ما الأولى بأحق من الآخرة».',
          tr: 'Aynı hadiste (el-Edebü’l-Müfred 986, sahih) Peygamber ﷺ meclise gelirken de oradan kalkarken de selam vermeyi emretmiştir: “İlk selam sonuncusundan daha önemli değildir.”',
        } },
      ],
    },
    {
      id: 'mercy',
      title: { az: 'Kiçiyə mərhəmət, böyüyə hörmət', en: 'Mercy to the young, respect for elders', ru: 'Милость к младшим, уважение к старшим', ar: 'رحمة الصغير وتوقير الكبير', tr: 'Küçüğe merhamet, büyüğe saygı' },
      blocks: [
        { t: 'hadith', ar: 'مَنْ لَمْ يَرْحَمْ صَغِيرَنَا، وَيَعْرِفْ حَقَّ كَبِيرِنَا، فَلَيْسَ مِنَّا', src: AM(353), grade: SAHIH, text: {
          az: 'Əbu Hüreyrə rəvayət edir ki, Peyğəmbər ﷺ dedi: «Kiçiyimizə rəhm etməyən və böyüyümüzün haqqını tanımayan bizdən deyil».',
          en: 'Abu Hurayrah reported that the Prophet ﷺ said: “Whoever does not show mercy to our young and does not recognise the right of our elders is not one of us.”',
          ru: 'Абу Хурайра передал, что Пророк ﷺ сказал: «Не из нас тот, кто не милосерден к нашим младшим и не признаёт права наших старших».',
          ar: 'عن أبي هريرة عن النبي ﷺ قال: «من لم يرحم صغيرنا، ويعرف حق كبيرنا، فليس منا».',
          tr: 'Ebû Hüreyre’nin rivayetine göre Peygamber ﷺ şöyle buyurdu: “Küçüğümüze merhamet etmeyen ve büyüğümüzün hakkını tanımayan bizden değildir.”',
        } },
        { t: 'hadith', ar: 'قَبَّلَ رَسُولُ اللهِ ﷺ حَسَنَ بْنَ عَلِيٍّ وَعِنْدَهُ الأَقْرَعُ بْنُ حَابِسٍ التَّمِيمِيُّ جَالِسٌ، فَقَالَ الأَقْرَعُ: إِنَّ لِي عَشَرَةً مِنَ الْوَلَدِ مَا قَبَّلْتُ مِنْهُمْ أَحَدًا، فَنَظَرَ إِلَيْهِ رَسُولُ اللهِ ﷺ ثُمَّ قَالَ: مَنْ لا يَرْحَمُ لا يُرْحَمُ', src: AM(91), grade: SAHIH, text: {
          az: 'Əbu Hüreyrə deyir: Allahın Elçisi ﷺ Həsən ibn Əlini öpdü. Yanında oturan əl-Əqra ibn Habis dedi: «Mənim on uşağım var, heç birini öpməmişəm». Allahın Elçisi ﷺ ona baxıb dedi: «Rəhm etməyənə rəhm edilməz».',
          en: 'Abu Hurayrah said: The Messenger of Allah ﷺ kissed al-Hasan ibn ‘Ali while al-Aqra‘ ibn Habis was sitting with him. Al-Aqra‘ said: “I have ten children and I have never kissed any of them.” The Messenger of Allah ﷺ looked at him and said: “Whoever does not show mercy will not be shown mercy.”',
          ru: 'Абу Хурайра сказал: Посланник Аллаха ﷺ поцеловал аль-Хасана ибн Али, а рядом сидел аль-Акра ибн Хабис. Аль-Акра сказал: «У меня десять детей, и я ни одного из них не целовал». Посланник Аллаха ﷺ посмотрел на него и сказал: «Кто не милосерден, к тому не будет милости».',
          ar: 'عن أبي هريرة قال: قبّل رسول الله ﷺ الحسن بن علي وعنده الأقرع بن حابس، فقال الأقرع: إن لي عشرة من الولد ما قبلت منهم أحدًا، فنظر إليه رسول الله ﷺ ثم قال: «من لا يرحم لا يرحم».',
          tr: 'Ebû Hüreyre şöyle dedi: Allah’ın Resûlü ﷺ Hasan b. Ali’yi öptü; yanında Akra‘ b. Hâbis oturuyordu. Akra‘ “Benim on çocuğum var, hiçbirini öpmedim” dedi. Allah’ın Resûlü ﷺ ona bakıp “Merhamet etmeyene merhamet edilmez” buyurdu.',
        } },
        { t: 'list', items: [
          { az: 'Uşaqları öpmək, oxşamaq və onlarla mehriban danışmaq sünnədir — kobudluq «kişilik» deyil.', en: 'Kissing children, caressing them and speaking kindly to them is Sunnah — harshness is not “manliness”.', ru: 'Целовать детей, ласкать их и мягко с ними говорить — Сунна; грубость — это не «мужественность».', ar: 'تقبيل الأولاد وملاطفتهم والكلام اللين معهم سنة، وليست الغلظة رجولة.', tr: 'Çocukları öpmek, okşamak ve onlarla şefkatle konuşmak sünnettir — kabalık “erkeklik” değildir.' },
          { az: 'Yaşlılara yer vermək, söz kəsməmək, əvvəlcə onlara salam vermək — «böyüyün haqqını tanımaq»dandır.', en: 'Giving elders a seat, not interrupting them and greeting them first are part of “recognising the right of our elders”.', ru: 'Уступать старшим место, не перебивать их и первым приветствовать — это часть «признания права старших».', ar: 'إفساح المجلس للكبير، وعدم مقاطعته، وابتداؤه بالسلام: من معرفة حق الكبير.', tr: 'Yaşlılara yer vermek, sözlerini kesmemek, önce onlara selam vermek “büyüğün hakkını tanımak”tandır.' },
        ] },
      ],
    },
    {
      id: 'gratitude',
      title: { az: 'Şükür və hədiyyə', en: 'Gratitude and gifts', ru: 'Благодарность и подарки', ar: 'الشكر والهدية', tr: 'Şükür ve hediye' },
      blocks: [
        { t: 'ayah', ar: 'وَإِذْ تَأَذَّنَ رَبُّكُمْ لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ ۖ وَلَئِن كَفَرْتُمْ إِنَّ عَذَابِى لَشَدِيدٌ', ref: '14:7', text: {
          az: 'Rəbbiniz belə bildirmişdi: «Əgər şükür etsəniz, sizə (nemətimi) artıraram, nankorluq etsəniz, əzabım şiddətlidir».',
          en: 'And when your Lord proclaimed: “If you are grateful, I will surely increase you; but if you are ungrateful, indeed My punishment is severe.”',
          ru: 'И вот возвестил ваш Господь: «Если вы будете благодарны, Я непременно дам вам больше, а если будете неблагодарны, то наказание Моё сурово».',
          ar: 'وَإِذْ تَأَذَّنَ رَبُّكُمْ لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
          tr: 'Hani Rabbiniz şöyle bildirmişti: “Şükrederseniz size mutlaka artırırım; nankörlük ederseniz azabım çok şiddetlidir.”',
        } },
        { t: 'hadith', ar: 'لاَ يَشْكُرُ اللَّهَ مَنْ لاَ يَشْكُرُ النَّاسَ', src: AM(218), grade: SAHIH, text: {
          az: 'Əbu Hüreyrə rəvayət edir ki, Peyğəmbər ﷺ dedi: «İnsanlara təşəkkür etməyən Allaha şükür etməz».',
          en: 'Abu Hurayrah reported that the Prophet ﷺ said: “Whoever does not thank people does not thank Allah.”',
          ru: 'Абу Хурайра передал, что Пророк ﷺ сказал: «Не благодарит Аллаха тот, кто не благодарит людей».',
          ar: 'عن أبي هريرة عن النبي ﷺ قال: «لا يشكر الله من لا يشكر الناس».',
          tr: 'Ebû Hüreyre’nin rivayetine göre Peygamber ﷺ şöyle buyurdu: “İnsanlara teşekkür etmeyen Allah’a şükretmez.”',
        } },
        { t: 'hadith', ar: 'تَهَادُوا تَحَابُّوا', src: AM(594), grade: HASAN, text: {
          az: 'Əbu Hüreyrə rəvayət edir ki, Peyğəmbər ﷺ dedi: «Bir-birinizə hədiyyə verin ki, bir-birinizi sevəsiniz».',
          en: 'Abu Hurayrah reported that the Prophet ﷺ said: “Give gifts to one another and you will love one another.”',
          ru: 'Абу Хурайра передал, что Пророк ﷺ сказал: «Дарите друг другу подарки — и полюбите друг друга».',
          ar: 'عن أبي هريرة عن النبي ﷺ قال: «تهادوا تحابوا».',
          tr: 'Ebû Hüreyre’nin rivayetine göre Peygamber ﷺ şöyle buyurdu: “Birbirinize hediye verin ki birbirinizi sevesiniz.”',
        } },
        { t: 'list', items: [
          { az: 'Yaxşılıq edənə dil ilə təşəkkür et, imkanın varsa əvəzini ver, yoxdursa ona dua et.', en: 'Thank whoever does you good with your tongue, repay him if you can, and if you cannot, make du‘a for him.', ru: 'Благодари сделавшего тебе добро словами, воздай ему, если можешь, а если не можешь — сделай за него дуа.', ar: 'اشكر من أحسن إليك بلسانك، وكافئه إن استطعت، وإلا فادع له.', tr: 'Sana iyilik edene diliyle teşekkür et, imkânın varsa karşılığını ver, yoksa ona dua et.' },
          { az: 'Kiçik hədiyyəni də xor görmə; hədiyyə qəlbləri yaxınlaşdırır.', en: 'Do not belittle even a small gift; gifts bring hearts together.', ru: 'Не пренебрегай даже малым подарком: подарки сближают сердца.', ar: 'لا تحقر الهدية ولو قلّت؛ فإنها تؤلف القلوب.', tr: 'Küçük hediyeyi de küçümseme; hediye kalpleri yakınlaştırır.' },
        ] },
      ],
    },
    {
      id: 'haya',
      title: { az: 'Həya', en: 'Modesty (haya’)', ru: 'Стыдливость (хайя)', ar: 'الحياء', tr: 'Hayâ' },
      blocks: [
        { t: 'hadith', ar: 'مَا كَانَ الْحَيَاءُ فِي شَيْءٍ إِلاَّ زَانَهُ، وَلاَ كَانَ الْفُحْشُ فِي شَيْءٍ إِلا شَانَهُ', src: AM(601), grade: SAHIH, text: {
          az: 'Ənəs ibn Malik rəvayət edir ki, Peyğəmbər ﷺ dedi: «Həya nəyə girərsə, onu bəzəyər; çirkinlik nəyə girərsə, onu eybəcər edər».',
          en: 'Anas ibn Malik reported that the Prophet ﷺ said: “Modesty is never in anything except that it adorns it, and obscenity is never in anything except that it disfigures it.”',
          ru: 'Анас ибн Малик передал, что Пророк ﷺ сказал: «Стыдливость, оказавшись в чём-либо, непременно украсит это, а непристойность непременно обезобразит».',
          ar: 'عن أنس بن مالك عن النبي ﷺ قال: «ما كان الحياء في شيء إلا زانه، ولا كان الفحش في شيء إلا شانه».',
          tr: 'Enes b. Mâlik’in rivayetine göre Peygamber ﷺ şöyle buyurdu: “Hayâ neye girerse onu süsler; çirkinlik neye girerse onu çirkinleştirir.”',
        } },
        { t: 'hadith', ar: 'مَرَّ النَّبِيُّ ﷺ عَلَى رَجُلٍ يُعَاتِبُ أَخَاهُ فِي الْحَيَاءِ، كَأَنَّهُ يَقُولُ: أَضَرَّ بِكَ، فَقَالَ: دَعْهُ، فَإِنَّ الْحَيَاءَ مِنَ الإِيمَانِ', src: AM(602), grade: SAHIH, text: {
          az: 'İbn Ömər deyir: Peyğəmbər ﷺ qardaşını həyasına görə danlayan — sanki «bu sənə ziyan verdi» deyən — bir adamın yanından keçdi və dedi: «Onu burax, çünki həya imandandır».',
          en: 'Ibn ‘Umar said: The Prophet ﷺ passed by a man who was reproaching his brother for his modesty, as if saying, “It has harmed you.” He said: “Leave him, for modesty is part of faith.”',
          ru: 'Ибн Умар сказал: Пророк ﷺ проходил мимо человека, который упрекал брата за стыдливость, словно говоря: «Она тебе вредит». Он сказал: «Оставь его, ведь стыдливость — от веры».',
          ar: 'عن ابن عمر قال: مر النبي ﷺ على رجل يعاتب أخاه في الحياء، كأنه يقول: أضر بك، فقال: «دعه، فإن الحياء من الإيمان».',
          tr: 'İbn Ömer şöyle dedi: Peygamber ﷺ, kardeşini hayâsı yüzünden kınayan — sanki “bu sana zarar verdi” diyen — bir adamın yanından geçti ve “Onu bırak, çünkü hayâ imandandır” buyurdu.',
        } },
        { t: 'hadith', ar: 'إِنَّ فِيكَ لَخُلُقَيْنِ يُحِبُّهُمَا اللَّهُ، قُلْتُ: وَمَا هُمَا يَا رَسُولَ اللهِ؟ قَالَ: الْحِلْمُ وَالْحَيَاءُ', src: AM(584), grade: SAHIH, text: {
          az: 'Əşəcc Abdulqeys deyir: Peyğəmbər ﷺ mənə dedi: «Səndə Allahın sevdiyi iki xasiyyət var». Soruşdum: «Onlar nədir, ey Allahın Elçisi?» Buyurdu: «Həlimlik və həya».',
          en: 'Ashajj ‘Abd al-Qays said: The Prophet ﷺ said to me: “You have two traits that Allah loves.” I asked: “What are they, O Messenger of Allah?” He said: “Forbearance and modesty.”',
          ru: 'Ашадж Абд аль-Кайс сказал: Пророк ﷺ сказал мне: «В тебе есть два качества, которые любит Аллах». Я спросил: «Какие, о Посланник Аллаха?» Он сказал: «Сдержанность и стыдливость».',
          ar: 'عن أشج عبد القيس قال: قال لي النبي ﷺ: «إن فيك لخلقين يحبهما الله»، قلت: وما هما يا رسول الله؟ قال: «الحلم والحياء».',
          tr: 'Eşecc Abdülkays şöyle dedi: Peygamber ﷺ bana “Sende Allah’ın sevdiği iki haslet var” buyurdu. “Nedir onlar, ey Allah’ın Resûlü?” dedim. “Yumuşak huyluluk ve hayâ” buyurdu.',
        } },
        { t: 'note', kind: 'info', text: {
          az: 'Şəri həya insanı pis işdən saxlayan utancdır. Haqqı soruşmaqdan, elm öyrənməkdən və yaxşılığı əmr etməkdən çəkindirən utancaqlıq isə tərifli həya deyil, acizlikdir.',
          en: 'Shar‘i modesty is the shame that holds a person back from what is bad. Shyness that stops you from asking about the truth, learning knowledge or enjoining good is not praiseworthy modesty but weakness.',
          ru: 'Шариатская стыдливость — это стыд, удерживающий человека от дурного. Робость же, мешающая спросить об истине, учиться или призывать к добру, — не похвальная стыдливость, а слабость.',
          ar: 'الحياء الشرعي خُلق يبعث على ترك القبيح، أما الخجل الذي يمنع من السؤال عن الحق وطلب العلم والأمر بالمعروف فليس حياءً محمودًا بل عجز.',
          tr: 'Şer‘î hayâ, insanı kötü işten alıkoyan utançtır. Hakkı sormaktan, ilim öğrenmekten ve iyiliği emretmekten alıkoyan çekingenlik ise övülen hayâ değil, acizliktir.',
        } },
      ],
    },
    {
      id: 'anger',
      title: { az: 'Qəzəbə hakim olmaq', en: 'Controlling anger', ru: 'Обуздание гнева', ar: 'ملك النفس عند الغضب', tr: 'Öfkeye hâkim olmak' },
      blocks: [
        { t: 'ayah', ar: 'ٱلَّذِينَ يُنفِقُونَ فِى ٱلسَّرَّآءِ وَٱلضَّرَّآءِ وَٱلْكَـٰظِمِينَ ٱلْغَيْظَ وَٱلْعَافِينَ عَنِ ٱلنَّاسِ ۗ وَٱللَّهُ يُحِبُّ ٱلْمُحْسِنِينَ', ref: '3:134', text: {
          az: 'O kəslər ki, bolluqda da, darlıqda da (Allah yolunda) xərcləyir, qəzəblərini udur və insanları bağışlayırlar. Allah yaxşılıq edənləri sevir.',
          en: 'Those who spend in ease and hardship, who restrain anger and pardon people — and Allah loves the doers of good.',
          ru: 'Тех, которые расходуют и в достатке, и в нужде, сдерживают гнев и прощают людей. Аллах любит творящих добро.',
          ar: 'ٱلَّذِينَ يُنفِقُونَ فِى ٱلسَّرَّآءِ وَٱلضَّرَّآءِ وَٱلْكَـٰظِمِينَ ٱلْغَيْظَ وَٱلْعَافِينَ عَنِ ٱلنَّاسِ',
          tr: 'Onlar bollukta da darlıkta da infak ederler, öfkelerini yutarlar ve insanları affederler. Allah iyilik edenleri sever.',
        } },
        { t: 'hadith', ar: 'لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ', src: AMB(1317, 6114), grade: AGREED, text: {
          az: 'Əbu Hüreyrə rəvayət edir ki, Allahın Elçisi ﷺ dedi: «Güclü o deyil ki, güləşdə yıxar; güclü odur ki, qəzəb anında özünə hakim olar».',
          en: 'Abu Hurayrah reported that the Messenger of Allah ﷺ said: “The strong one is not the one who overcomes others in wrestling; the strong one is he who controls himself when angry.”',
          ru: 'Абу Хурайра передал, что Посланник Аллаха ﷺ сказал: «Силён не тот, кто одолевает в борьбе; силён тот, кто владеет собой в гневе».',
          ar: 'عن أبي هريرة أن رسول الله ﷺ قال: «ليس الشديد بالصرعة، إنما الشديد الذي يملك نفسه عند الغضب».',
          tr: 'Ebû Hüreyre’nin rivayetine göre Allah’ın Resûlü ﷺ şöyle buyurdu: “Güçlü, güreşte yenen değildir; güçlü, öfke anında kendine hâkim olandır.”',
        } },
        { t: 'hadith', ar: 'عَلِّمُوا وَيَسِّرُوا وَلاَ تُعَسِّرُوا، وَإِذَا غَضِبَ أَحَدُكُمْ فَلْيَسْكُتْ', src: AM(245), grade: SAHIH, text: {
          az: 'İbn Abbas rəvayət edir ki, Allahın Elçisi ﷺ dedi: «Öyrədin, asanlaşdırın, çətinləşdirməyin. Biriniz qəzəblənəndə sussun».',
          en: 'Ibn ‘Abbas reported that the Messenger of Allah ﷺ said: “Teach, make things easy and do not make them hard. When one of you becomes angry, let him be silent.”',
          ru: 'Ибн Аббас передал, что Посланник Аллаха ﷺ сказал: «Обучайте, облегчайте и не усложняйте. А если кто-то из вас разгневается, пусть молчит».',
          ar: 'عن ابن عباس قال: قال رسول الله ﷺ: «علموا ويسروا ولا تعسروا، وإذا غضب أحدكم فليسكت».',
          tr: 'İbn Abbâs’ın rivayetine göre Allah’ın Resûlü ﷺ şöyle buyurdu: “Öğretin, kolaylaştırın, zorlaştırmayın. Biriniz öfkelenince sussun.”',
        } },
        { t: 'hadith', ar: 'إِنِّي لَأَعْلَمُ كَلِمَةً لَوْ قَالَهَا لَذَهَبَ هَذَا عَنْهُ: أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', src: AM(1319), grade: SAHIH, text: {
          az: 'Süleyman ibn Surad deyir: Peyğəmbərin ﷺ yanında iki nəfər söyüşdü, birinin üzü qəzəbdən qızardı. Peyğəmbər ﷺ ona baxıb dedi: «Mən elə bir söz bilirəm ki, onu desə, bu hal ondan gedər: “Əuzu billəhi minəş-şeytanir-racim”».',
          en: 'Sulayman ibn Surad said: Two men insulted each other in the presence of the Prophet ﷺ and one of them grew angry and his face reddened. The Prophet ﷺ looked at him and said: “I know a word which, if he said it, this would leave him: A‘udhu billahi min ash-shaytan ar-rajim (I seek refuge with Allah from the accursed devil).”',
          ru: 'Сулейман ибн Сурад сказал: двое бранились при Пророке ﷺ, один из них разгневался, и лицо его покраснело. Пророк ﷺ посмотрел на него и сказал: «Я знаю слово, скажи он которое, это ушло бы от него: “Аузу билляхи мина-ш-шайтани-р-раджим” (Прибегаю к Аллаху от проклятого шайтана)».',
          ar: 'عن سليمان بن صرد قال: استب رجلان عند النبي ﷺ، فجعل أحدهما يغضب ويحمر وجهه، فنظر إليه النبي ﷺ فقال: «إني لأعلم كلمة لو قالها لذهب هذا عنه: أعوذ بالله من الشيطان الرجيم».',
          tr: 'Süleyman b. Surad şöyle dedi: Peygamber’in ﷺ yanında iki kişi birbirine sövdü; biri öfkelenip yüzü kızardı. Peygamber ﷺ ona bakıp şöyle buyurdu: “Ben bir söz biliyorum ki, onu söylese bu hâli geçer: Eûzu billâhi mineş-şeytânir-racîm.”',
        } },
        { t: 'steps', items: [
          { title: { az: 'Allaha sığın', en: 'Seek refuge with Allah', ru: 'Прибегни к Аллаху', ar: 'استعذ بالله', tr: 'Allah’a sığın' }, text: { az: '«Əuzu billəhi minəş-şeytanir-racim» de (əl-Ədəb əl-Müfrəd 1319).', en: 'Say “A‘udhu billahi min ash-shaytan ar-rajim” (al-Adab al-Mufrad 1319).', ru: 'Скажи: «Аузу билляхи мина-ш-шайтани-р-раджим» (аль-Адаб аль-Муфрад 1319).', ar: 'قل: أعوذ بالله من الشيطان الرجيم (الأدب المفرد ١٣١٩).', tr: '“Eûzu billâhi mineş-şeytânir-racîm” de (el-Edebü’l-Müfred 1319).' } },
          { title: { az: 'Sus', en: 'Be silent', ru: 'Замолчи', ar: 'اسكت', tr: 'Sus' }, text: { az: 'Qəzəb anındakı söz çox vaxt peşmanlıq gətirir; hədis susmağı əmr edir (əl-Ədəb əl-Müfrəd 245).', en: 'Words spoken in anger usually bring regret; the hadith commands silence (al-Adab al-Mufrad 245).', ru: 'Слова, сказанные в гневе, обычно приносят сожаление; хадис велит молчать (аль-Адаб аль-Муфрад 245).', ar: 'كلام الغضبان كثيرًا ما يعقبه الندم، والحديث أمر بالسكوت (الأدب المفرد ٢٤٥).', tr: 'Öfke anındaki söz çoğu zaman pişmanlık getirir; hadis susmayı emreder (el-Edebü’l-Müfred 245).' } },
          { title: { az: 'Bağışla', en: 'Pardon', ru: 'Прости', ar: 'اعف', tr: 'Affet' }, text: { az: 'Qəzəbi udmaq və bağışlamaq Allahın sevdiyi «möhsinlərin» sifətidir (3:134).', en: 'Swallowing anger and pardoning are traits of the “doers of good” whom Allah loves (3:134).', ru: 'Сдерживать гнев и прощать — качества «творящих добро», которых любит Аллах (3:134).', ar: 'كظم الغيظ والعفو من صفات المحسنين الذين يحبهم الله (آل عمران ١٣٤).', tr: 'Öfkeyi yutmak ve affetmek, Allah’ın sevdiği “muhsinlerin” vasfıdır (3:134).' } },
        ] },
        { t: 'hadith', ar: 'أَنَّ رَجُلاً قَالَ لِلنَّبِيِّ ﷺ: أَوْصِنِي. قَالَ: لاَ تَغْضَبْ. فَرَدَّدَ مِرَارًا، قَالَ: لاَ تَغْضَبْ', src: { az: 'Buxari 6116', en: 'al-Bukhari 6116', ru: 'Бухари 6116', ar: 'البخاري ٦١١٦', tr: 'Buhârî 6116' }, grade: AGREED, text: {
          az: 'Bir nəfər Peyğəmbərə ﷺ dedi: «Mənə nəsihət et». Buyurdu: «Qəzəblənmə». O, bunu bir neçə dəfə təkrarladı, hər dəfə də «Qəzəblənmə» dedi.',
          en: 'A man said to the Prophet ﷺ: “Advise me.” He said: “Do not become angry.” The man repeated his request several times, and each time he said: “Do not become angry.”',
          ru: 'Один человек сказал Пророку ﷺ: «Дай мне наставление». Он ответил: «Не гневайся». Тот повторил просьбу несколько раз, и каждый раз он говорил: «Не гневайся».',
          ar: 'أن رجلًا قال للنبي ﷺ: أوصني، قال: «لا تغضب»، فردد مرارًا، قال: «لا تغضب».',
          tr: 'Bir adam Peygamber’e ﷺ “Bana öğüt ver” dedi. “Öfkelenme” buyurdu. Adam isteğini birkaç kez tekrarladı; her defasında “Öfkelenme” buyurdu.',
        } },
      ],
    },
    {
      id: 'faq',
      title: { az: 'Suallar', en: 'Questions', ru: 'Вопросы', ar: 'أسئلة', tr: 'Sorular' },
      blocks: [
        { t: 'qa', items: [
          {
            q: { az: '«əl-Ədəb əl-Müfrəd»dəki hər rəvayət səhihdirmi?', en: 'Is every narration in al-Adab al-Mufrad authentic?', ru: 'Все ли предания в «аль-Адаб аль-Муфрад» достоверны?', ar: 'هل كل ما في الأدب المفرد صحيح؟', tr: 'el-Edebü’l-Müfred’deki her rivayet sahih midir?' },
            a: { az: 'Xeyr. Buxari bu kitabda «Səhih»indəki şərtləri tətbiq etməyib. Məsələn, valideyn öləndən sonra onlara yaxşılıq barədə Əbu Useyd hədisini (əl-Ədəb əl-Müfrəd 35) Albani zəif sayıb. Ona görə hər rəvayəti dərəcəsi ilə birlikdə oxumaq lazımdır.', en: 'No. Al-Bukhari did not apply the conditions of his “Sahih” in this book. For example, al-Albani graded weak the hadith of Abu Usayd about honouring parents after their death (al-Adab al-Mufrad 35). So each narration should be read together with its grade.', ru: 'Нет. В этой книге аль-Бухари не применял условия своего «Сахиха». Например, хадис Абу Усайда о почтении к родителям после их смерти (аль-Адаб аль-Муфрад 35) аль-Албани признал слабым. Поэтому каждое предание нужно читать вместе с его оценкой.', ar: 'لا؛ فلم يلتزم البخاري فيه شرط «صحيحه». ومن ذلك حديث أبي أسيد في البر بالوالدين بعد موتهما (الأدب المفرد ٣٥) ضعفه الألباني. فينبغي قراءة كل رواية مع الحكم عليها.', tr: 'Hayır. Buhârî bu kitapta “Sahih”indeki şartları uygulamamıştır. Örneğin anne-babaya ölümlerinden sonra iyilik hakkındaki Ebû Üseyd hadisini (el-Edebü’l-Müfred 35) Elbânî zayıf saymıştır. Bu yüzden her rivayeti derecesiyle birlikte okumak gerekir.' },
          },
          {
            q: { az: 'Səhabə sözləri də dəlildirmi?', en: 'Are the statements of the Companions also evidence?', ru: 'Являются ли слова сподвижников доводом?', ar: 'هل آثار الصحابة حجة؟', tr: 'Sahabe sözleri de delil midir?' },
            a: { az: 'Kitabdakı səhabə sözləri (məsələn, İbn Ömərin sözləri) Sünnəni necə başa düşdüklərini göstərir və onların anlayışı ən doğru anlayışdır. Lakin Quran və səhih Sünnə ilə ziddiyyət olarsa, üstünlük vəhyindir.', en: 'The statements of the Companions in the book (such as those of Ibn ‘Umar) show how they understood the Sunnah, and their understanding is the soundest. But where something conflicts with the Quran and authentic Sunnah, revelation takes precedence.', ru: 'Слова сподвижников в книге (например, Ибн Умара) показывают, как они понимали Сунну, а их понимание — самое верное. Но если что-то противоречит Корану и достоверной Сунне, преимущество за откровением.', ar: 'آثار الصحابة في الكتاب ككلام ابن عمر تبين فهمهم للسنة، وفهمهم أصح الفهوم، فإن خالف شيء منها الكتاب والسنة الصحيحة قُدّم الوحي.', tr: 'Kitaptaki sahabe sözleri (örneğin İbn Ömer’in sözleri) Sünneti nasıl anladıklarını gösterir ve onların anlayışı en doğru anlayıştır. Ancak Kur’an ve sahih Sünnet ile çelişen bir şey olursa öncelik vahyindir.' },
          },
        ] },
      ],
    },
  ],
  sources: [
    { label: 'al-Bukhari, al-Adab al-Mufrad', url: 'https://www.prophetmuhammad.com/adab' },
    { label: 'al-Albani, Sahih al-Adab al-Mufrad / Da‘if al-Adab al-Mufrad', url: 'https://www.prophetmuhammad.com/adab/245' },
    { label: 'al-Bukhari, al-Jami‘ as-Sahih (6114, 6116)', url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari.min.json' },
    { label: 'Quran.com — Uthmani text', url: 'https://quran.com' },
  ],
}
