// «Hilyətu talibil-elm» — Şeyx Bəkr ibn Abdullah Əbu Zeyd. Fəsillərə görə xülasə.
// Mətn Dar əl-Asimə nəşrindən (1416) yoxlanıb: usul.ai/t/decorating-the-student-of-knowledge.
// Hədislər fawazahmed0 hadith-api ilə yoxlanıb.

const AGREED = { az: 'Səhih', en: 'Sahih', ru: 'Достоверный', ar: 'صحيح', tr: 'Sahih' }
const SAHIH_ALB = { az: 'Səhih (Albani)', en: 'Sahih (al-Albani)', ru: 'Достоверный (аль-Албани)', ar: 'صحيح (الألباني)', tr: 'Sahih (Elbânî)' }
const HILYA = { az: '«Hilyətu talibil-elm»', en: '“Hilyat Talib al-‘Ilm”', ru: '«Хильят талиб аль-ильм»', ar: 'حلية طالب العلم', tr: '“Hilyetü Tâlibi’l-İlm”' }
const by = (az, en, ru, ar, tr) => ({ az, en, ru, ar, tr })

export const meta = {
  slug: 'hilyat-talib-al-ilm',
  cat: 'knowledge',
  order: 30,
  icon: 'books',
  arTitle: 'حلية طالب العلم',
  title: {
    az: 'Elm tələbəsinin bəzəyi (Bəkr Əbu Zeyd)',
    en: 'The Adornment of the Student of Knowledge',
    ru: 'Украшение ищущего знание (Бакр Абу Зейд)',
    ar: 'حلية طالب العلم (بكر أبو زيد)',
    tr: 'İlim Talebesinin Süsü (Bekir Ebû Zeyd)',
  },
  summary: {
    az: 'Şeyx Bəkr Əbu Zeydin «Hilyətu talibil-elm» kitabının yeddi fəsli və «nəvaqidi» üzrə xülasə: ixlas, elm öyrənmə qaydası, müəllim, dost, əməl və çəkinmələr.',
    en: 'A chapter-by-chapter summary of Shaykh Bakr Abu Zayd’s “Hilyat Talib al-‘Ilm”: sincerity, method of study, teacher, companions, action and warnings.',
    ru: 'Краткое изложение «Хильят талиб аль-ильм» шейха Бакра Абу Зейда по главам: искренность, порядок учёбы, учитель, товарищи, действие и предостережения.',
    ar: 'خلاصة «حلية طالب العلم» للشيخ بكر أبو زيد على فصوله السبعة ونواقضها: الإخلاص، وطريقة الطلب، والشيخ، والزمالة، والعمل، والمحاذير.',
    tr: 'Şeyh Bekir Ebû Zeyd’in “Hilyetü Tâlibi’l-İlm” kitabının yedi bölümü ve bozucuları üzerine özet: ihlas, öğrenme yolu, hoca, arkadaş, amel ve uyarılar.',
  },
  author: {
    az: 'Şeyx Bəkr ibn Abdullah Əbu Zeyd (h. 1429)',
    en: 'Shaykh Bakr ibn ‘Abdullah Abu Zayd (d. 1429 AH)',
    ru: 'Шейх Бакр ибн Абдуллах Абу Зейд (ум. в 1429 г. х.)',
    ar: 'الشيخ بكر بن عبد الله أبو زيد (ت ١٤٢٩هـ)',
    tr: 'Şeyh Bekir b. Abdullah Ebû Zeyd (h. 1429)',
  },
  minutes: 18,
}

export default {
  sections: [
    {
      id: 'intro',
      title: { az: 'Kitab və müəllif', en: 'The book and its author', ru: 'Книга и автор', ar: 'الكتاب ومؤلفه', tr: 'Kitap ve yazarı' },
      blocks: [
        { t: 'p', text: {
          az: 'Şeyx Bəkr ibn Abdullah Əbu Zeyd Səudiyyə Ərəbistanının Böyük Alimlər Şurasının və Daimi Fətva Komitəsinin üzvü olmuş fəqih və mühəddisdir. O, «Hilyətu talibil-elm» kitabını hicri 1408-ci ildə yazıb: məqsədi elm yolunda olan gəncləri əqidə, əxlaq və mənhəc xətalarından qorumaq idi. Kitab yeddi fəsildən və sonda «bu bəzəyi pozan şeylərdən» ibarətdir. Şeyx İbn Useymin onu dərslərində şərh edib.',
          en: 'Shaykh Bakr ibn ‘Abdullah Abu Zayd was a jurist and hadith scholar, a member of Saudi Arabia’s Council of Senior Scholars and its Permanent Committee for fatwa. He wrote “Hilyat Talib al-‘Ilm” in 1408 AH to protect young students from errors in creed, conduct and method. The book has seven chapters and ends with “what nullifies this adornment”. Shaykh Ibn ‘Uthaymin explained it in his lessons.',
          ru: 'Шейх Бакр ибн Абдуллах Абу Зейд — факих и мухаддис, член Совета великих учёных Саудовской Аравии и Постоянного комитета по фетвам. Он написал «Хильят талиб аль-ильм» в 1408 г. х., чтобы уберечь молодых ищущих знание от ошибок в убеждениях, нравах и методе. Книга состоит из семи глав и завершается перечнем того, «что разрушает это украшение». Шейх Ибн Усеймин разъяснил её в своих уроках.',
          ar: 'الشيخ بكر بن عبد الله أبو زيد فقيه محدث، كان عضوًا في هيئة كبار العلماء واللجنة الدائمة للإفتاء، قيّد هذه «الحلية» عام ١٤٠٨هـ صيانةً لشباب الطلب من العثار في العقيدة والسلوك والمنهج. وهي سبعة فصول تختم بـ«نواقض هذه الحلية»، وقد شرحها الشيخ ابن عثيمين.',
          tr: 'Şeyh Bekir b. Abdullah Ebû Zeyd, Suudi Arabistan Büyük Âlimler Heyeti ve Daimî Fetva Komitesi üyesi olmuş bir fakih ve muhaddistir. “Hilyetü Tâlibi’l-İlm”i hicri 1408 yılında, ilim yolundaki gençleri akide, ahlak ve metot hatalarından korumak için yazmıştır. Kitap yedi bölümden oluşur ve sonunda “bu süsü bozan şeyler” yer alır. Şeyh İbn Useymîn onu derslerinde şerh etmiştir.',
        } },
        { t: 'ayah', ar: 'فَتَعَـٰلَى ٱللَّهُ ٱلْمَلِكُ ٱلْحَقُّ ۗ وَلَا تَعْجَلْ بِٱلْقُرْءَانِ مِن قَبْلِ أَن يُقْضَىٰٓ إِلَيْكَ وَحْيُهُۥ ۖ وَقُل رَّبِّ زِدْنِى عِلْمًا', ref: '20:114', text: {
          az: 'Haqq Hökmdar olan Allah ucadır. Quranın vəhyi sənə tamamlanmamış onu (oxumağa) tələsmə və de: «Rəbbim, elmimi artır!»',
          en: 'Exalted is Allah, the True King. Do not hasten with the Quran before its revelation to you is completed, and say: “My Lord, increase me in knowledge.”',
          ru: 'Превыше всего Аллах, Истинный Царь! Не торопись с Кораном, пока его откровение не будет завершено, и говори: «Господи, приумножь мои знания!»',
          ar: 'وَقُل رَّبِّ زِدْنِى عِلْمًا',
          tr: 'Gerçek hükümdar olan Allah yücedir. Kur’an’ın vahyi sana tamamlanmadan onu okumakta acele etme ve “Rabbim, ilmimi artır” de.',
        } },
        { t: 'hadith', ar: 'مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ', src: by('Buxari 71, Müslim 1037', 'al-Bukhari 71, Muslim 1037', 'Бухари 71, Муслим 1037', 'البخاري ٧١، مسلم ١٠٣٧', 'Buhârî 71, Müslim 1037'), grade: AGREED, text: {
          az: 'Muaviyə rəvayət edir ki, Peyğəmbər ﷺ dedi: «Allah kimə xeyir istəsə, onu dində fəqih edər».',
          en: 'Mu‘awiyah reported that the Prophet ﷺ said: “Whomever Allah wishes good for, He gives him understanding of the religion.”',
          ru: 'Муавия передал, что Пророк ﷺ сказал: «Кому Аллах желает блага, тому Он даёт понимание религии».',
          ar: 'عن معاوية قال: سمعت النبي ﷺ يقول: «من يرد الله به خيرًا يفقهه في الدين».',
          tr: 'Muâviye’nin rivayetine göre Peygamber ﷺ şöyle buyurdu: “Allah kime hayır dilerse onu dinde fakih kılar.”',
        } },
        { t: 'note', kind: 'info', text: {
          az: 'Bu dərs kitabın tam tərcüməsi deyil, fəsillərinə görə sadiq xülasəsidir. Dırnaq içindəki sözlər müəllifin və onun nəql etdiyi alimlərin sözləridir.',
          en: 'This lesson is not a full translation but a faithful chapter-by-chapter summary. Words in quotation marks are those of the author or of the scholars he quotes.',
          ru: 'Этот урок — не полный перевод, а точное изложение книги по главам. Слова в кавычках принадлежат автору или учёным, которых он цитирует.',
          ar: 'ليس هذا الدرس ترجمة كاملة، بل خلاصة أمينة على فصول الكتاب، وما بين علامات التنصيص فهو من كلام المؤلف أو من نقل عنهم.',
          tr: 'Bu ders kitabın tam tercümesi değil, bölümlerine göre sadık bir özetidir. Tırnak içindeki sözler yazarın veya onun naklettiği âlimlerin sözleridir.',
        } },
      ],
    },
    {
      id: 'ch1-self',
      title: { az: '1-ci fəsil: tələbənin özü ilə ədəbi', en: 'Chapter 1: The student’s manners with himself', ru: 'Глава 1: этика ищущего по отношению к себе', ar: 'الفصل الأول: آداب الطالب في نفسه', tr: '1. bölüm: Talebenin kendisiyle ilgili edepleri' },
      blocks: [
        { t: 'p', text: {
          az: 'Kitabın «əsasların əsası» budur ki, elm ibadətdir. İbadətin şərti ixlasdır, ona görə də müəllif deyir: elm ixlası itirsə, ən fəzilətli itaətdən ən alçaq xətaya çevrilər; elmi riya və «eşitdirmək» (bildiklərini insanlara car çəkmək) kimi heç nə məhv etməz.',
          en: 'The “foundation of foundations” of the book is that knowledge is worship. The condition of worship is sincerity, so the author says: if knowledge loses sincerity, it turns from the best of obedience into the lowest of offences, and nothing destroys knowledge like showing off and “making others hear” (advertising what one has learned).',
          ru: '«Основа основ» книги: знание — это поклонение. Условие поклонения — искренность, поэтому автор говорит: если знание лишится искренности, оно превратится из лучшего послушания в самый низкий проступок, и ничто так не губит знание, как показуха и желание, «чтобы услышали» (выставлять напоказ выученное).',
          ar: 'أصل الأصول في هذه الحلية أن العلم عبادة، وشرط العبادة إخلاص النية، قال المؤلف: «فإن فقد العلم إخلاص النية، انتقل من أفضل الطاعات إلى أحط المخالفات، ولا شيء يحطم العلم مثل الرياء... ومثل التسميع».',
          tr: 'Kitabın “esasların esası” şudur: ilim ibadettir. İbadetin şartı ihlastır; bu yüzden yazar der ki: ilim ihlası kaybederse en faziletli itaatten en alçak hataya dönüşür ve hiçbir şey ilmi riya ve “duyurma” (öğrendiğini insanlara ilan etme) kadar mahvetmez.',
        } },
        { t: 'ayah', ar: 'وَمَآ أُمِرُوٓا۟ إِلَّا لِيَعْبُدُوا۟ ٱللَّهَ مُخْلِصِينَ لَهُ ٱلدِّينَ حُنَفَآءَ وَيُقِيمُوا۟ ٱلصَّلَوٰةَ وَيُؤْتُوا۟ ٱلزَّكَوٰةَ ۚ وَذَٰلِكَ دِينُ ٱلْقَيِّمَةِ', ref: '98:5', text: {
          az: 'Onlara yalnız dini Allaha xas edərək, haqqa meyl edən kimi Ona ibadət etmək, namaz qılmaq və zəkat vermək əmr olunmuşdu. Doğru din də budur.',
          en: 'They were commanded only to worship Allah, sincere to Him in religion, inclining to truth, to establish prayer and give zakah. That is the upright religion.',
          ru: 'А ведь им было велено лишь поклоняться Аллаху, очищая перед Ним веру, как единобожники, совершать намаз и выплачивать закят. Это — правая вера.',
          ar: 'وَمَآ أُمِرُوٓا۟ إِلَّا لِيَعْبُدُوا۟ ٱللَّهَ مُخْلِصِينَ لَهُ ٱلدِّينَ حُنَفَآءَ',
          tr: 'Hâlbuki onlara ancak dini yalnızca Allah’a has kılarak, hanifler olarak O’na kulluk etmeleri, namazı kılmaları ve zekâtı vermeleri emredilmişti. Dosdoğru din budur.',
        } },
        { t: 'hadith', ar: 'مَنْ تَعَلَّمَ عِلْمًا مِمَّا يُبْتَغَى بِهِ وَجْهُ اللَّهِ عَزَّ وَجَلَّ لاَ يَتَعَلَّمُهُ إِلاَّ لِيُصِيبَ بِهِ عَرَضًا مِنَ الدُّنْيَا لَمْ يَجِدْ عَرْفَ الْجَنَّةِ يَوْمَ الْقِيَامَةِ', src: by('Əbu Davud 3664', 'Abu Dawud 3664', 'Абу Дауд 3664', 'أبو داود ٣٦٦٤', 'Ebû Dâvûd 3664'), grade: SAHIH_ALB, text: {
          az: 'Əbu Hüreyrə rəvayət edir ki, Allahın Elçisi ﷺ dedi: «Kim Allahın rizası üçün öyrənilən bir elmi yalnız dünyalıq əldə etmək üçün öyrənsə, Qiyamət günü Cənnətin qoxusunu belə duymaz».',
          en: 'Abu Hurayrah reported that the Messenger of Allah ﷺ said: “Whoever learns knowledge by which Allah’s Face is sought, learning it only to gain some worldly thing, will not find the fragrance of Paradise on the Day of Resurrection.”',
          ru: 'Абу Хурайра передал, что Посланник Аллаха ﷺ сказал: «Кто изучит знание, которым ищут Лик Аллаха, лишь ради мирской выгоды, тот не почувствует даже благоухания Рая в День воскресения».',
          ar: 'عن أبي هريرة قال: قال رسول الله ﷺ: «من تعلم علمًا مما يبتغى به وجه الله عز وجل لا يتعلمه إلا ليصيب به عرضًا من الدنيا لم يجد عرف الجنة يوم القيامة».',
          tr: 'Ebû Hüreyre’nin rivayetine göre Allah’ın Resûlü ﷺ şöyle buyurdu: “Kim Allah’ın rızası için öğrenilen bir ilmi sırf dünyalık elde etmek için öğrenirse, kıyamet günü cennetin kokusunu bile alamaz.”',
        } },
        { t: 'quote', ar: 'مَا عَالَجْتُ شَيْئًا أَشَدَّ عَلَيَّ مِنْ نِيَّتِي', by: by('Süfyan əs-Sövri', 'Sufyan ath-Thawri', 'Суфьян ас-Саури', 'سفيان الثوري', 'Süfyân es-Sevrî'), ref: HILYA, text: {
          az: '«Niyyətimdən daha çətin bir şeylə mübarizə aparmadım».',
          en: '“I have never dealt with anything harder for me than my intention.”',
          ru: '«Ни с чем я не боролся так тяжело, как со своим намерением».',
          ar: '«ما عالجت شيئًا أشد علي من نيتي».',
          tr: '“Niyetimden daha zor bir şeyle uğraşmadım.”',
        } },
        { t: 'list', items: [
          { az: 'Sələfin yolunda ol: tövhiddə, ibadətdə və bütün din bablarında səhabə və onların ardınca gedənlərin yolu; mübahisə, cədəl və kəlam elmindən uzaq dur (6:153).', en: 'Be on the path of the Salaf: the way of the Companions and those who followed them in tawhid, worship and every area of the religion; keep away from disputation, argument and speculative theology (6:153).', ru: 'Будь на пути саляфа: пути сподвижников и последовавших за ними в таухиде, поклонении и во всех разделах религии; сторонись споров, препирательств и калама (6:153).', ar: 'كن سلفيًا على الجادة، على طريق الصحابة ومن تبعهم في التوحيد والعبادات وسائر أبواب الدين، مع ترك الجدال والمراء والخوض في علم الكلام.', tr: 'Selef’in yolunda ol: tevhidde, ibadette ve dinin bütün konularında sahabenin ve onları izleyenlerin yolu; tartışma, cedel ve kelam ilminden uzak dur (6:153).' },
          { az: 'Allahdan qorxmağı daim saxla: İmam Əhməd deyib: «Elmin əsli Allah qorxusudur» (35:28).', en: 'Hold fast to the fear of Allah: Imam Ahmad said, “The root of knowledge is the fear of Allah” (35:28).', ru: 'Постоянно бойся Аллаха: имам Ахмад сказал: «Основа знания — страх перед Аллахом» (35:28).', ar: 'ملازمة خشية الله؛ قال الإمام أحمد: «أصل العلم خشية الله تعالى».', tr: 'Allah korkusunu daima koru: İmam Ahmed “İlmin aslı Allah korkusudur” demiştir (35:28).' },
          { az: 'Allahın səni gördüyünü daim xatırla — qorxu ilə ümid arasında, quşun iki qanadı kimi.', en: 'Constantly remember that Allah sees you — between fear and hope, like the two wings of a bird.', ru: 'Постоянно помни, что Аллах видит тебя, — между страхом и надеждой, как между двумя крыльями птицы.', ar: 'دوام المراقبة لله، سائرًا بين الخوف والرجاء كالجناحين للطائر.', tr: 'Allah’ın seni gördüğünü sürekli hatırla — korku ile ümit arasında, kuşun iki kanadı gibi.' },
          { az: 'Təvazökar ol, təkəbbür və lovğalıqdan çəkin: «elmi əzizliyi üçün öyrənmənin zilləti»nə dözmək.', en: 'Be humble and shun pride and arrogance: bear “the lowliness of learning for the honour of knowledge”.', ru: 'Будь скромным и сторонись высокомерия: терпи «унижение учёбы ради величия знания».', ar: 'خفض الجناح ونبذ الخيلاء والكبرياء، متحملًا ذل التعلم لعزة العلم.', tr: 'Mütevazı ol, kibir ve böbürlenmeden sakın: “ilmin izzeti için öğrenmenin zilletine” katlan.' },
          { az: 'Qənaət və zöhd: haramdan və şübhəlidən çəkinmək, insanların əlindəkinə göz dikməmək.', en: 'Contentment and abstinence: avoiding the forbidden and the doubtful, and not eyeing what is in people’s hands.', ru: 'Довольство и аскетизм: сторониться запретного и сомнительного и не зариться на то, что в руках людей.', ar: 'القناعة والزهادة: الكف عن الحرام والمشتبهات، وعن التطلع إلى ما في أيدي الناس.', tr: 'Kanaat ve zühd: haramdan ve şüpheliden kaçınmak, insanların elindekine göz dikmemek.' },
          { az: 'Elmin vüqarı, mürüvvət və kişilik xasiyyətləri; həddən artıq rahatlıqdan, boş məclislərdən və hay-küydən uzaq durmaq.', en: 'The dignity of knowledge, decency and manly qualities; avoiding excessive luxury, idle gatherings and commotion.', ru: 'Достоинство знания, благопристойность и мужественные качества; избегать чрезмерной роскоши, пустых собраний и шума.', ar: 'التحلي برونق العلم والمروءة وخصال الرجولة، وهجر الترفه، والإعراض عن مجالس اللغو والهيشات.', tr: 'İlmin vakarı, mürüvvet ve erkeklik hasletleri; aşırı rahatlıktan, boş meclislerden ve gürültüden uzak durmak.' },
          { az: 'Sözdə yumşaqlıq, düşünüb danışmaq və sabitlik: «Sabit qalan kök salar».', en: 'Gentleness in speech, reflection, and steadfastness with verification: “Whoever stands firm takes root.”', ru: 'Мягкость в словах, вдумчивость, стойкость и проверка: «Кто стоек — тот пускает корни».', ar: 'التحلي بالرفق والتأمل والثبات والتثبت، فإن «من ثبت نبت».', tr: 'Sözde yumuşaklık, düşünerek konuşmak, sebat ve teyit: “Sebat eden kök salar.”' },
        ] },
      ],
    },
    {
      id: 'ch2-method',
      title: { az: '2-ci fəsil: elm necə öyrənilir', en: 'Chapter 2: How to seek and receive knowledge', ru: 'Глава 2: как искать и получать знание', ar: 'الفصل الثاني: كيفية الطلب والتلقي', tr: '2. bölüm: İlim nasıl öğrenilir' },
      blocks: [
        { t: 'quote', ar: 'مَنْ لَمْ يُتْقِنِ الأُصُولَ حُرِمَ الوُصُولَ، وَمَنْ رَامَ العِلْمَ جُمْلَةً ذَهَبَ عَنْهُ جُمْلَةً', by: by('Elm əhlinin məşhur sözü', 'A well-known saying of the scholars', 'Известное изречение учёных', 'من أقوال أهل العلم', 'Âlimlerin meşhur sözü'), ref: HILYA, text: {
          az: '«Əsasları mənimsəməyən məqsədə çatmaqdan məhrum olar. Elmi bir dəfəyə bütöv almaq istəyən onu bütövlükdə itirər».',
          en: '“Whoever does not master the foundations is denied arrival. Whoever seeks knowledge all at once loses it all at once.”',
          ru: '«Кто не освоил основ, тот лишён достижения цели. Кто хочет взять знание всё сразу, тот всё сразу и потеряет».',
          ar: '«من لم يتقن الأصول حرم الوصول»، و«من رام العلم جملة ذهب عنه جملة».',
          tr: '“Esasları sağlamlaştırmayan hedefe ulaşmaktan mahrum kalır. İlmi bir seferde bütünüyle almak isteyen onu bütünüyle kaybeder.”',
        } },
        { t: 'steps', items: [
          { title: { az: 'Hər elmdə bir müxtəsər əzbərlə', en: 'Memorise a concise text in each science', ru: 'Выучи краткий текст в каждой науке', ar: 'حفظ مختصر في كل فن', tr: 'Her ilimde bir muhtasar ezberle' }, text: { az: 'Əsas, etibarlı qısa mətnlə başla.', en: 'Start with a reliable, foundational short text.', ru: 'Начни с надёжного базового краткого текста.', ar: 'ابدأ بمتن مختصر معتمد.', tr: 'Temel ve güvenilir kısa bir metinle başla.' } },
          { title: { az: 'Onu mahir bir şeyxin yanında oxu', en: 'Study it with a proficient shaykh', ru: 'Изучи его у знающего шейха', ar: 'ضبطه على شيخ متقن', tr: 'Onu yetkin bir hocanın yanında oku' }, text: { az: 'Yalnız özbaşına oxumaqla deyil — mətnin düzgün başa düşülməsi müəllimlə olur.', en: 'Not by self-study alone — a text is correctly understood with a teacher.', ru: 'Не только самостоятельно: текст правильно понимают с учителем.', ar: 'لا بالتحصيل الذاتي وحده.', tr: 'Sadece kendi başına okuyarak değil — metin hocayla doğru anlaşılır.' } },
          { title: { az: 'Uzun kitablara tələsmə', en: 'Do not rush to the long works', ru: 'Не спеши к объёмным трудам', ar: 'لا تشتغل بالمطولات قبل الضبط', tr: 'Uzun eserlere acele etme' }, text: { az: 'Əsası möhkəmlətmədən böyük və dağınıq əsərlərlə məşğul olma.', en: 'Do not busy yourself with large and scattered works before mastering the basics.', ru: 'Не занимайся большими и разрозненными трудами, пока не укрепил основу.', ar: 'عدم الاشتغال بالمطولات وتفاريق المصنفات قبل الضبط والإتقان لأصله.', tr: 'Esası sağlamlaştırmadan büyük ve dağınık eserlerle uğraşma.' } },
          { title: { az: 'Səbəbsiz mətndən mətnə keçmə', en: 'Do not hop between texts without reason', ru: 'Не перескакивай с текста на текст без причины', ar: 'لا تنتقل من مختصر إلى آخر بلا موجب', tr: 'Sebepsiz metinden metne geçme' }, text: { az: 'Müəllif bunu «darıxmaq» əlaməti sayır.', en: 'The author counts this as a sign of restlessness.', ru: 'Автор считает это признаком нетерпеливости.', ar: 'فهذا من باب الضجر.', tr: 'Yazar bunu bıkkınlık alameti sayar.' } },
          { title: { az: 'Faydaları və qaydaları topla, tədricən yüksəl', en: 'Gather benefits and rules, rise gradually', ru: 'Собирай пользу и правила, поднимайся постепенно', ar: 'اقتناص الفوائد والضوابط، والترقي بالتدرج', tr: 'Faydaları ve kuralları topla, kademeli yüksel' }, text: { az: 'Sonra etibarlı yolla uzun əsərlərə keç.', en: 'Then move on to the longer works along a sound path.', ru: 'Затем переходи к объёмным трудам надёжным путём.', ar: 'حتى تفيض إلى المطولات بسابلة موثقة.', tr: 'Sonra güvenilir bir yolla uzun eserlere geç.' } },
        ] },
        { t: 'p', text: {
          az: 'Müəllif vurğulayır ki, elmin əsli kitab səhifələrindən yox, müəllimlərin dilindən öyrənilməsidir. Yalnız kitabdan oxuyan, xüsusən başlanğıcda, səhv anlamaya və təhrifə düşə bilər.',
          en: 'The author stresses that knowledge is originally taken from the mouths of teachers, not merely from the pages of books. One who learns only from books, especially at the start, is exposed to misunderstanding and distortion.',
          ru: 'Автор подчёркивает, что изначально знание берут из уст учителей, а не только со страниц книг. Тот, кто учится лишь по книгам, особенно в начале, подвержен неверному пониманию и искажению.',
          ar: 'وقرر المؤلف أن الأصل في الطلب أن يكون بطريق التلقي عن الأشياخ، والأخذ من أفواه الرجال لا من الصحف وبطون الكتب.',
          tr: 'Yazar, ilmin aslında kitap sayfalarından değil hocaların ağzından alındığını vurgular. Yalnızca kitaptan öğrenen, özellikle başlangıçta, yanlış anlamaya ve tahrife açık olur.',
        } },
      ],
    },
    {
      id: 'ch3-4-teacher-friends',
      title: { az: '3–4-cü fəsillər: müəllim və yoldaşlar', en: 'Chapters 3–4: The teacher and companions', ru: 'Главы 3–4: учитель и товарищи', ar: 'الفصلان الثالث والرابع: أدب الطالب مع شيخه، وأدب الزمالة', tr: '3–4. bölümler: Hoca ve arkadaşlar' },
      blocks: [
        { t: 'list', items: [
          { az: 'Müəllimə hörmət: onu ehtiramla çağır, onunla nəzakətlə danış, onun yanında ədəbli otur.', en: 'Respect the teacher: address him with honour, speak to him courteously and sit before him with good manners.', ru: 'Уважай учителя: обращайся к нему почтительно, говори вежливо, сиди перед ним благопристойно.', ar: 'رعاية حرمة الشيخ: إجلاله وإكرامه وتوقيره في الخطاب والجلوس.', tr: 'Hocaya saygı: ona hürmetle hitap et, nezaketle konuş, yanında edepli otur.' },
          { az: 'Müəllimin bir səhvi onu gözündən salmasın — kim səhvdən salamat qalıb? Bu, onun elmindən məhrum olmağa səbəb olar.', en: 'Do not let a mistake of the teacher make him fall in your eyes — who is free of error? That would deprive you of his knowledge.', ru: 'Пусть ошибка учителя не уронит его в твоих глазах: кто свободен от ошибок? Иначе ты лишишься его знания.', ar: 'إذا بدا لك خطأ من الشيخ فلا يسقطه ذلك من عينك؛ فإنه سبب لحرمانك من علمه.', tr: 'Hocanın bir hatası onu gözünden düşürmesin — kim hatadan salimdir? Bu, onun ilminden mahrum kalmana sebep olur.' },
          { az: 'Onu sınamaq məqsədi ilə yormaq olmaz; başqa müəllimə keçmək istəsən, ondan icazə al.', en: 'Do not wear him out by testing him; if you want to move to another teacher, ask his permission.', ru: 'Не утомляй его, испытывая; если хочешь перейти к другому учителю, спроси у него разрешения.', ar: 'احذر أن تمارس معه ما يضجره من امتحانه، وإذا أردت الانتقال إلى شيخ آخر فاستأذنه.', tr: 'Onu sınamak için yorma; başka bir hocaya geçmek istersen ondan izin iste.' },
          { az: 'Dərsdə yazmaq müəllimin icazəsi ilə olur; onun dərsə həvəsli olduğu vaxtı qiymətləndir.', en: 'Writing during the lesson is with the teacher’s permission; value the times he is energetic in teaching.', ru: 'Записывать во время урока — с разрешения учителя; цени время, когда он воодушевлён уроком.', ar: 'الكتابة عن الشيخ حال الدرس بإذنه، ومراعاة نشاطه في درسه.', tr: 'Derste yazmak hocanın izniyle olur; derse istekli olduğu vakitleri değerlendir.' },
        ] },
        { t: 'note', kind: 'warn', text: {
          az: 'Müəllif həddi aşan, Şəriətə yad olan ehtiram formalarından çəkindirir: əl yalamaq, çiyin öpmək, salamlaşanda əyilmək və s. — bunu əcəmlərin, təriqətçilərin və bidətçilərin adəti sayır. Həmçinin bidət əhlindən — əqidəsi əyilmiş, nəssi tərk edib hava-həvəsə «ağıl» deyəndən — elm almaqdan çəkindirir.',
          en: 'The author warns against excessive forms of veneration foreign to the Shari‘ah — licking hands, kissing shoulders, bowing when greeting and the like — calling them the custom of foreigners, Sufi orders and innovators. He also warns against taking knowledge from the people of innovation: those whose creed has deviated, who leave the texts and call their desires “reason”.',
          ru: 'Автор предостерегает от чрезмерных, чуждых шариату форм почитания — облизывания рук, целования плеч, поклонов при приветствии и т. п., — называя это обычаем чужеземцев, тарикатов и приверженцев нововведений. Он также предостерегает от получения знания у людей нововведений — тех, чьё убеждение искажено, кто оставляет тексты и называет свои страсти «разумом».',
          ar: 'وحذر المؤلف من صنيع الأعاجم والطرقية والمبتدعة من الخضوع الخارج عن آداب الشرع، كلحس الأيدي وتقبيل الأكتاف والانحناء عند السلام، وحذر من التلقي عن المبتدع الذي مسه زيغ العقيدة، يحكّم الهوى ويسميه العقل ويعدل عن النص.',
          tr: 'Yazar, Şeriata yabancı aşırı hürmet şekillerinden — el yalamak, omuz öpmek, selamlaşırken eğilmek vb. — sakındırır ve bunları acemlerin, tarikatçıların ve bid‘atçilerin âdeti sayar. Ayrıca bid‘at ehlinden — akidesi sapmış, nassı bırakıp hevasına “akıl” diyenden — ilim almaktan sakındırır.',
        } },
        { t: 'p', text: {
          az: 'Yoldaşlıq ədəbi: «Pis tərbiyə gizlicə keçir», çünki təbiətlər bir-birindən oğurlayır. Ona görə məqsədinə kömək edən və səni Rəbbinə yaxınlaşdıran dost seç. Müəllif dostları üç növə bölür: mənfəət dostu, ləzzət dostu və fəzilət dostu. İlk ikisi səbəbi bitəndə bitir; etibar ediləcək dost üçüncüsüdür.',
          en: 'The manners of companionship: “Bad upbringing seeps in unnoticed”, for natures steal from one another. So choose a friend who helps you towards your goal and brings you closer to your Lord. The author divides friends into three: a friend of benefit, a friend of pleasure and a friend of virtue. The first two end when their cause ends; the one to rely on is the third.',
          ru: 'Этика товарищества: «Дурное воспитание проникает незаметно», ведь натуры перенимают друг у друга. Поэтому выбирай друга, который помогает тебе в твоей цели и приближает к Господу. Автор делит друзей на три вида: друг ради выгоды, друг ради удовольствия и друг ради добродетели. Первые двое уходят, когда исчезает их причина; полагаться можно на третьего.',
          ar: 'وفي أدب الزمالة: احذر قرين السوء، فإن «أدب السوء دساس»، والطباع سراقة، فتخير من يعينك على مطلبك ويقربك إلى ربك. والأصدقاء ثلاثة: صديق منفعة، وصديق لذة، وصديق فضيلة؛ فالأولان منقطعان بانقطاع موجبهما، والتعويل على الثالث.',
          tr: 'Arkadaşlık edebi: “Kötü terbiye fark ettirmeden sızar”, çünkü tabiatlar birbirinden çalar. Bu yüzden hedefine yardım eden ve seni Rabbine yaklaştıran arkadaşı seç. Yazar arkadaşları üçe ayırır: menfaat arkadaşı, lezzet arkadaşı ve fazilet arkadaşı. İlk ikisi sebepleri bitince biter; güvenilecek olan üçüncüsüdür.',
        } },
      ],
    },
    {
      id: 'ch5-scholarly-life',
      title: { az: '5-ci fəsil: elmi həyatın ədəbləri', en: 'Chapter 5: Manners in the life of learning', ru: 'Глава 5: этика научной жизни', ar: 'الفصل الخامس: آداب الطالب في حياته العلمية', tr: '5. bölüm: İlmî hayatın edepleri' },
      blocks: [
        { t: 'list', items: [
          { az: 'Yüksək himmət — amma himməti təkəbbürlə qarışdırma: biri peyğəmbər varislərinin bəzəyi, digəri zalımların xəstəliyidir.', en: 'High aspiration — but do not confuse it with arrogance: one is the adornment of the heirs of the prophets, the other the disease of tyrants.', ru: 'Высокие устремления — но не путай их с высокомерием: первое — украшение наследников пророков, второе — болезнь тиранов.', ar: 'كبر الهمة في العلم، ولا تخلط بينه وبين الكبر؛ فكبر الهمة حلية ورثة الأنبياء، والكبر داء الجبابرة.', tr: 'Yüksek himmet — ama onu kibirle karıştırma: biri peygamber vârislerinin süsü, diğeri zorbaların hastalığıdır.' },
          { az: 'Elmə acgözlük, elm üçün səfər, öyrəndiyini yazmaq: əş-Şəbi deyib: «Bir şey eşitsən, divara da olsa yaz».', en: 'Eagerness for knowledge, travelling for it and writing down what you learn: ash-Sha‘bi said, “When you hear something, write it down, even on a wall.”', ru: 'Жажда знания, путешествия ради него и запись выученного: аш-Шаби сказал: «Услышал что-то — запиши, пусть даже на стене».', ar: 'النهمة في الطلب، والرحلة له، وحفظ العلم كتابة؛ قال الشعبي: «إذا سمعت شيئًا فاكتبه ولو في الحائط».', tr: 'İlme düşkünlük, ilim için yolculuk ve öğrendiğini yazmak: Şa‘bî “Bir şey işittiğinde duvara da olsa yaz” demiştir.' },
          { az: 'Hədisi yalnız «rəvayət» üçün yox, «riayət» (əməl və qoruma) üçün əzbərlə; əzbərlədiyini təkrarla.', en: 'Memorise hadith not only to narrate (riwayah) but to observe and act (ri‘ayah); keep reviewing what you have memorised.', ru: 'Заучивай хадисы не только ради передачи (ривая), но ради соблюдения (риая); постоянно повторяй выученное.', ar: 'حفظ الرعاية لا حفظ الرواية، وتعاهد المحفوظات.', tr: 'Hadisi sadece rivayet için değil, riayet (amel ve koruma) için ezberle; ezberlediklerini tekrar et.' },
          { az: 'Fiqhi qaydaları əsaslara bağlayaraq öyrən və anlamadığında Allaha üz tut. İbn Teymiyyə çətin ayədə belə dua edərdi: «Ey Adəmə və İbrahimə öyrədən, mənə öyrət; ey Süleymana anladan, mənə anlat».', en: 'Learn fiqh by linking branches to principles, and turn to Allah when you do not understand. Ibn Taymiyyah, when a verse was hard for him, would pray: “O Teacher of Adam and Ibrahim, teach me; O You who gave understanding to Sulayman, give me understanding.”', ru: 'Изучай фикх, связывая частности с основами, и обращайся к Аллаху, когда не понимаешь. Ибн Таймийя, когда ему было трудно понять аят, молился: «О Обучивший Адама и Ибрахима, обучи меня; о Давший понимание Сулейману, дай мне понимание».', ar: 'التفقه بتخريج الفروع على الأصول، واللجوء إلى الله في الطلب؛ وكان ابن تيمية يقول إذا استعصى عليه تفسير آية: «اللهم يا معلم آدم وإبراهيم علمني، ويا مفهم سليمان فهمني».', tr: 'Fıkhı, fer‘î meseleleri usule bağlayarak öğren ve anlamadığında Allah’a yönel. İbn Teymiyye zor bir ayette şöyle dua ederdi: “Ey Âdem’e ve İbrâhîm’e öğreten, bana öğret; ey Süleymân’a anlatan, bana anlat.”' },
          { az: 'Elmi əmanət və doğruluq: əl-Əvzai deyib: «Elmdən əvvəl doğruluğu öyrən»; Vəki deyib: «Bu sənətdə yalnız doğru danışan yüksəlir».', en: 'Scholarly trustworthiness and truthfulness: al-Awza‘i said, “Learn truthfulness before you learn knowledge”; Waki‘ said, “In this craft only the truthful rise.”', ru: 'Научная честность и правдивость: аль-Авзаи сказал: «Научись правдивости прежде знания»; Ваки сказал: «В этом деле возвышается только правдивый».', ar: 'الأمانة العلمية والصدق؛ قال الأوزاعي: «تعلم الصدق قبل أن تتعلم العلم»، وقال وكيع: «هذه الصنعة لا يرتفع فيها إلا صادق».', tr: 'İlmî emanet ve doğruluk: Evzâî “İlimden önce doğruluğu öğren”, Vekî‘ ise “Bu sanatta ancak doğru olan yükselir” demiştir.' },
          { az: '«Bilmirəm» — alimin qalxanıdır: «Elmin yarısı “bilmirəm”dir».', en: '“I do not know” is the scholar’s shield: “Half of knowledge is ‘I do not know’.”', ru: '«Не знаю» — щит учёного: «Половина знания — это “не знаю”».', ar: '«جُنّة العالم: لا أدري»، و«نصف العلم: لا أدري».', tr: '“Bilmiyorum” âlimin kalkanıdır: “İlmin yarısı ‘bilmiyorum’dur.”' },
          { az: 'Vaxtını — ömrün sərmayəsini — qoru; amma nəfsə də dincəlmək üçün pay ayır.', en: 'Guard your time — the capital of your life — but give the soul its share of rest as well.', ru: 'Береги время — капитал своей жизни, — но давай душе и долю отдыха.', ar: 'المحافظة على رأس مالك: ساعات عمرك، مع إجمام النفس.', tr: 'Vaktini — ömrünün sermayesini — koru; ama nefsine de dinlenme payı ver.' },
          { az: 'Kitabları mahir müəllimin yanında düzəliş və dəqiqlik üçün oxu; uzun əsərləri də başdan-sona oxu.', en: 'Read books with a proficient teacher for correction and precision, and read the long works from cover to cover.', ru: 'Читай книги у знающего учителя ради исправления и точности, а объёмные труды — от начала до конца.', ar: 'قراءة التصحيح والضبط على شيخ متقن، وجرد المطولات.', tr: 'Kitapları yetkin bir hocanın yanında tashih ve zabt için oku; uzun eserleri de baştan sona oku.' },
          { az: 'Sualın gözəlliyi: «müəllim filan başqa cür dedi» deyib alimləri bir-birinə vurma. İbn əl-Qəyyim elmin altı mərtəbəsini sayır: gözəl sual, diqqətlə dinləmək, düzgün anlamaq, əzbərləmək, öyrətmək və onun meyvəsi — ona əməl etmək.', en: 'Good questioning: do not set scholars against each other by saying “but Shaykh so-and-so said otherwise”. Ibn al-Qayyim lists six levels of knowledge: good questioning, attentive listening, sound understanding, memorising, teaching, and its fruit — acting upon it.', ru: 'Хороший вопрос: не сталкивай учёных друг с другом словами «а шейх такой-то сказал иначе». Ибн аль-Кайим перечисляет шесть ступеней знания: хороший вопрос, внимательное слушание, верное понимание, заучивание, обучение и его плод — действие.', ar: 'حسن السؤال، وإياك أن تضرب أهل العلم بعضهم ببعض. قال ابن القيم: «وللعلم ست مراتب: أولها حسن السؤال، الثانية حسن الإنصات والاستماع، الثالثة حسن الفهم، الرابعة الحفظ، الخامسة التعليم، السادسة وهي ثمرته: العمل به ومراعاة حدوده».', tr: 'Güzel soru: “ama falan hoca başka söyledi” diyerek âlimleri birbirine vurma. İbn Kayyim ilmin altı mertebesini sayar: güzel soru, dikkatle dinlemek, doğru anlamak, ezberlemek, öğretmek ve meyvesi olan onunla amel etmek.' },
          { az: 'Mübahisəsiz münazirə və elmi müzakirə; hər elmin alətlərini tamamla.', en: 'Debate without quarrelling, study circles of review, and completing the tools of each science.', ru: 'Диспут без препирательства, совместное повторение и овладение инструментами каждой науки.', ar: 'المناظرة بلا مماراة، ومذاكرة العلم، واستكمال أدوات كل فن.', tr: 'Kavgasız münazara, ilmî müzakere ve her ilmin araçlarını tamamlamak.' },
        ] },
      ],
    },
    {
      id: 'ch6-action',
      title: { az: '6-cı fəsil: elmlə əməl', en: 'Chapter 6: Adorning knowledge with action', ru: 'Глава 6: украшение знания действием', ar: 'الفصل السادس: التحلي بالعمل', tr: '6. bölüm: İlimle amel' },
      blocks: [
        { t: 'p', text: {
          az: 'Müəllif tələbəyə özünü faydalı elmin əlamətlərinə görə yoxlamağı tövsiyə edir:',
          en: 'The author advises the student to examine himself by the signs of beneficial knowledge:',
          ru: 'Автор советует ищущему знание проверять себя по признакам полезного знания:',
          ar: 'قال المؤلف: تساءل مع نفسك عن حظك من علامات العلم النافع، وهي:',
          tr: 'Yazar talebeye kendini faydalı ilmin alametlerine göre sınamasını tavsiye eder:',
        } },
        { t: 'list', ordered: true, items: [
          { az: 'Ona əməl etmək.', en: 'Acting upon it.', ru: 'Действовать по нему.', ar: 'العمل به.', tr: 'Onunla amel etmek.' },
          { az: 'Tərifdən, özünü təmizə çıxarmaqdan və insanlara təkəbbür etməkdən xoşlanmamaq.', en: 'Disliking praise, self-justification and arrogance towards people.', ru: 'Неприязнь к похвале, самовосхвалению и высокомерию перед людьми.', ar: 'كراهية التزكية والمدح والتكبر على الخلق.', tr: 'Övgüden, kendini temize çıkarmaktan ve insanlara kibirlenmekten hoşlanmamak.' },
          { az: 'Elm artdıqca təvazökarlığın da artması.', en: 'Growing in humility the more you grow in knowledge.', ru: 'Чем больше знания, тем больше скромности.', ar: 'تكاثر تواضعك كلما ازددت علمًا.', tr: 'İlim arttıkça tevazunun da artması.' },
          { az: 'Rəhbərlik, şöhrət və dünya sevgisindən qaçmaq.', en: 'Fleeing from love of leadership, fame and the world.', ru: 'Бегство от любви к главенству, славе и мирскому.', ar: 'الهرب من حب الترؤس والشهرة والدنيا.', tr: 'Liderlik, şöhret ve dünya sevgisinden kaçmak.' },
          { az: 'Alimlik iddiasını tərk etmək.', en: 'Abandoning claims of being learned.', ru: 'Отказ от притязаний на учёность.', ar: 'هجر دعوى العلم.', tr: 'Âlimlik iddiasını terk etmek.' },
          { az: 'Özü barədə pis, insanlar barədə yaxşı zənn etmək.', en: 'Thinking ill of oneself and well of others.', ru: 'Думать плохо о себе и хорошо о людях.', ar: 'إساءة الظن بالنفس، وإحسانه بالناس.', tr: 'Kendisi hakkında kötü, insanlar hakkında iyi zan beslemek.' },
        ] },
        { t: 'hadith', ar: 'وَرَجُلٌ تَعَلَّمَ الْعِلْمَ وَعَلَّمَهُ وَقَرَأَ الْقُرْآنَ ... قَالَ: كَذَبْتَ وَلَكِنَّكَ تَعَلَّمْتَ الْعِلْمَ لِيُقَالَ عَالِمٌ، وَقَرَأْتَ الْقُرْآنَ لِيُقَالَ هُوَ قَارِئٌ، فَقَدْ قِيلَ، ثُمَّ أُمِرَ بِهِ فَسُحِبَ عَلَى وَجْهِهِ حَتَّى أُلْقِيَ فِي النَّارِ', src: by('Müslim 1905', 'Muslim 1905', 'Муслим 1905', 'مسلم ١٩٠٥', 'Müslim 1905'), grade: AGREED, text: {
          az: 'Qiyamətdə ilk mühakimə olunanlardan biri: «Elm öyrənib öyrədən və Quran oxuyan bir adam… (Allah) deyəcək: “Yalan dedin, sən elmi ‘alimdir’ desinlər deyə öyrəndin, Quranı ‘qaridir’ desinlər deyə oxudun və bu da deyildi”. Sonra əmr olunacaq və üzüstə sürünərək Oda atılacaq».',
          en: 'Among the first to be judged on the Day of Resurrection: “A man who learned knowledge, taught it and recited the Quran… (Allah) will say: ‘You lied. You learned so that it would be said, “He is a scholar,” and recited so that it would be said, “He is a reciter,” and it was said.’ Then he will be dragged on his face and thrown into the Fire.”',
          ru: 'Среди первых, кого будут судить в День воскресения: «Человек, который изучал знание, обучал ему и читал Коран… (Аллах) скажет: “Ты солгал. Ты учился, чтобы о тебе говорили: «учёный», и читал, чтобы говорили: «чтец», — и так и говорили”. Затем его поволокут лицом вниз и бросят в Огонь».',
          ar: '«ورجل تعلم العلم وعلمه وقرأ القرآن... قال: كذبت، ولكنك تعلمت العلم ليقال عالم، وقرأت القرآن ليقال هو قارئ، فقد قيل، ثم أمر به فسحب على وجهه حتى ألقي في النار».',
          tr: 'Kıyamet günü ilk hesaba çekileceklerden biri: “İlim öğrenip öğreten ve Kur’an okuyan bir adam… (Allah) şöyle der: ‘Yalan söyledin; sen ilmi “âlim” desinler diye öğrendin, Kur’an’ı “kârî” desinler diye okudun ve bu söylendi.’ Sonra emredilir, yüzüstü sürüklenerek ateşe atılır.”',
        } },
        { t: 'list', items: [
          { az: 'Elmin zəkatı: haqqı açıq söyləmək, yaxşılığı əmr edib pislikdən çəkindirmək (fayda və zərəri ölçərək), elmi yaymaq.', en: 'The zakah of knowledge: proclaiming the truth, enjoining good and forbidding evil (weighing benefit and harm), and spreading knowledge.', ru: 'Закят знания: открыто говорить истину, призывать к добру и удерживать от зла (взвешивая пользу и вред), распространять знание.', ar: 'زكاة العلم: الصدع بالحق، والأمر بالمعروف والنهي عن المنكر موازنًا بين المصالح والمضار، ونشر العلم.', tr: 'İlmin zekâtı: hakkı açıkça söylemek, iyiliği emredip kötülükten sakındırmak (fayda ve zararı tartarak), ilmi yaymak.' },
          { az: 'Alimlərin izzəti: elmi dünya əhlinin qapısında alçaltma, onu layiq olmayana satma.', en: 'The dignity of scholars: do not humiliate knowledge at the doors of worldly people or offer it to those unworthy of it.', ru: 'Достоинство учёных: не унижай знание у дверей людей мира и не предлагай его недостойным.', ar: 'عزة العلماء وصيانة العلم: لا تسع به إلى أهل الدنيا ولا تقف به على أعتابهم.', tr: 'Âlimlerin izzeti: ilmi dünya ehlinin kapısında alçaltma, onu layık olmayana sunma.' },
          { az: 'Müdara (yumşaq davranmaq) olar, mudahənə (dinindən güzəştə getmək) olmaz.', en: 'Courteous tact (mudarah) is fine; compromising your religion (mudahanah) is not.', ru: 'Учтивость (мудара) допустима, а уступки в религии (мудахана) — нет.', ar: 'المداراة لا المداهنة.', tr: 'Müdârâ (yumuşak davranmak) olur, müdâhene (dininden taviz vermek) olmaz.' },
          { az: 'Kitab sevgisi: əsas kitablardan başla, kitabxananı boş kitablarla doldurma; xüsusən İbn Teymiyyə və İbn əl-Qəyyimin dəlilə əsaslanan əsərlərinə üstünlük ver.', en: 'Love of books: start with the foundational works and do not fill your library with worthless books; give special place to the evidence-based works of Ibn Taymiyyah and Ibn al-Qayyim.', ru: 'Любовь к книгам: начинай с основных трудов и не забивай библиотеку пустыми книгами; особо цени основанные на доводах труды Ибн Таймийи и Ибн аль-Кайима.', ar: 'الغرام بالكتب: عليك بالأصول، ولا تحشر مكتبتك بالكتب الغثائية، ومن أجلّ الكتب المنسوجة على طريقة الاستدلال كتب الشيخين ابن تيمية وابن القيم.', tr: 'Kitap sevgisi: temel eserlerle başla, kütüphaneni değersiz kitaplarla doldurma; özellikle İbn Teymiyye ve İbn Kayyim’in delile dayalı eserlerine önem ver.' },
        ] },
      ],
    },
    {
      id: 'ch7-warnings',
      title: { az: '7-ci fəsil: çəkinmələr', en: 'Chapter 7: Warnings', ru: 'Глава 7: предостережения', ar: 'الفصل السابع: المحاذير', tr: '7. bölüm: Sakındırmalar' },
      blocks: [
        { t: 'table',
          head: [
            { az: 'Çəkinmə', en: 'Warning', ru: 'Предостережение', ar: 'المحذور', tr: 'Uyarı' },
            { az: 'Mənası', en: 'Meaning', ru: 'Смысл', ar: 'معناه', tr: 'Anlamı' },
          ],
          rows: [
            [{ az: 'Oyaq yuxusu', en: 'Daydreaming', ru: 'Сон наяву', ar: 'حلم اليقظة', tr: 'Uyanıkken rüya' }, { az: 'Bilmədiyin elmi, mənimsəmədiyin bilgini iddia etmək. «Elm üç qarışdır: birinciyə girən təkəbbür edər, ikinciyə girən təvazö edər, üçüncüyə girən heç nə bilmədiyini anlar».', en: 'Claiming knowledge you lack or mastery you do not have. “Knowledge is three spans: whoever enters the first becomes proud, the second becomes humble, and the third realises he knows nothing.”', ru: 'Притязать на знание, которого нет, и на мастерство, которым не владеешь. «Знание — три пяди: вошедший в первую возгордится, во вторую — смирится, в третью — поймёт, что ничего не знает».', ar: 'أن تدعي العلم لما لم تعلم، أو إتقان ما لم تتقن، و«العلم ثلاثة أشبار: من دخل في الشبر الأول تكبر، ومن دخل في الثاني تواضع، ومن دخل في الثالث علم أنه ما يعلم».', tr: 'Bilmediğin ilmi, sağlamlaştırmadığın bilgiyi iddia etmek. “İlim üç karıştır: birincisine giren kibirlenir, ikincisine giren tevazu gösterir, üçüncüsüne giren hiçbir şey bilmediğini anlar.”' }],
            [{ az: 'Hazır olmadan önə keçmək', en: 'Taking the lead before qualifying', ru: 'Лезть вперёд, не будучи готовым', ar: 'التصدر قبل التأهل', tr: 'Ehil olmadan öne geçmek' }, { az: '«Vaxtından əvvəl önə keçən özünü alçaldar».', en: '“Whoever leads before his time exposes himself to humiliation.”', ru: '«Кто выдвинулся раньше срока, тот подставил себя под унижение».', ar: '«من تصدر قبل أوانه فقد تصدى لهوانه».', tr: '“Vaktinden önce öne geçen, kendini zillete maruz bırakır.”' }],
            [{ az: 'Elmlə özünü göstərmək', en: 'Showing off with knowledge', ru: 'Щеголять знанием', ar: 'التنمر بالعلم', tr: 'İlimle gösteriş' }, { az: 'Bir-iki məsələ öyrənib məclisdə alimlərin yanında onu gündəmə gətirmək.', en: 'Revising one or two issues and raising them in a gathering of scholars to display one’s learning.', ru: 'Выучить вопрос-другой и поднимать его в собрании при учёных, чтобы показать себя.', ar: 'أن يراجع مسألة أو مسألتين فإذا كان في مجلس فيه من يشار إليه أثار البحث فيهما ليظهر علمه.', tr: 'Bir iki mesele öğrenip âlimlerin bulunduğu mecliste gündeme getirmek.' }],
            [{ az: 'Vaxtından əvvəl kitab yazmaq', en: 'Writing books too early', ru: 'Писать книги раньше времени', ar: 'تحبير الكاغد', tr: 'Vaktinden önce kitap yazmak' }, { az: 'Alətləri tamamlamadan müəllif olmaq. əl-Xətib: «Kitab yazan ağlını boşqabda insanlara təqdim edir».', en: 'Authoring before completing the tools. Al-Khatib said: “Whoever writes a book has put his mind on a plate and presented it to people.”', ru: 'Писать, не овладев инструментами. Аль-Хатиб сказал: «Кто пишет книгу, тот выкладывает свой ум на блюдо перед людьми».', ar: 'الاشتغال بالتصنيف قبل استكمال أدواته، وقال الخطيب: «من صنف فقد جعل عقله على طبق يعرضه على الناس».', tr: 'Araçları tamamlamadan eser yazmak. Hatîb: “Kitap yazan aklını bir tabağa koyup insanlara sunmuş olur.”' }],
            [{ az: 'Alimin xətasına sevinmək', en: 'Rejoicing at a scholar’s error', ru: 'Радоваться ошибке учёного', ar: 'الفرح بوهم من سبقك', tr: 'Âlimin hatasına sevinmek' }, { az: 'Xətanı alimi alçaltmaq üçün yox, məsələni düzəltmək üçün qeyd et; hər imamın səhvləri var.', en: 'Note the error to correct the issue, not to belittle the scholar; every imam has mistakes.', ru: 'Отмечай ошибку, чтобы исправить вопрос, а не чтобы унизить учёного; у каждого имама есть ошибки.', ar: 'افرح به لتصحيح المسألة لا للحط منه؛ فما من إمام إلا وله أغلاط وأوهام.', tr: 'Hatayı âlimi küçültmek için değil, meseleyi düzeltmek için kaydet; her imamın hataları vardır.' }],
            [{ az: 'Şübhələrə qəlbi açmaq', en: 'Opening the heart to doubts', ru: 'Открывать сердце сомнениям', ar: 'إيراد الشبهات', tr: 'Kalbi şüphelere açmak' }, { az: 'Qəlbin süngər kimi gələni hopdurmasın: şübhələr qapar, qəlblər zəifdir.', en: 'Do not let your heart soak up everything like a sponge: doubts snatch, and hearts are weak.', ru: 'Пусть сердце не впитывает всё, как губка: сомнения цепки, а сердца слабы.', ar: '«لا تجعل قلبك كالسفنجة تتلقى ما يرد عليها... فالشبه خطافة، والقلوب ضعيفة».', tr: 'Kalbin sünger gibi her geleni emmesin: şüpheler kapıcıdır, kalpler zayıftır.' }],
            [{ az: 'Dil xətası (ləhn)', en: 'Errors in Arabic (lahn)', ru: 'Ошибки в арабском (лахн)', ar: 'اللحن', tr: 'Dil hatası (lahn)' }, { az: 'Ərəb dilini öyrən. Ömər: «Ərəbcəni öyrənin, çünki o, mürüvvəti artırır».', en: 'Learn Arabic. ‘Umar said: “Learn Arabic, for it increases manly virtue.”', ru: 'Изучай арабский. Умар сказал: «Учите арабский, ведь он прибавляет благородства».', ar: 'قال عمر: «تعلموا العربية؛ فإنها تزيد في المروءة».', tr: 'Arapçayı öğren. Ömer: “Arapçayı öğrenin, çünkü o mürüvveti artırır.”' }],
            [{ az: 'Fikri vaxtından əvvəl doğmaq', en: 'Premature ideas', ru: 'Преждевременные мысли', ar: 'الإجهاض الفكري', tr: 'Fikri vaktinden önce doğurmak' }, { az: 'Fikri yetişmədən ortaya çıxarmaq.', en: 'Bringing out an idea before it has matured.', ru: 'Выносить мысль на люди, пока она не созрела.', ar: 'إخراج الفكرة قبل نضوجها.', tr: 'Fikri olgunlaşmadan ortaya çıkarmak.' }],
            [{ az: 'Yeni israiliyyat', en: 'The new Isra’iliyyat', ru: 'Новые исраилияты', ar: 'الإسرائيليات الجديدة', tr: 'Yeni İsrâiliyyât' }, { az: 'Şərqşünasların fikirləri müsəlman düşüncəsinə sızanda köhnə israiliyyatdan da təhlükəlidir.', en: 'The ideas of Orientalists seeping into Muslim thought are more dangerous than the old Isra’iliyyat.', ru: 'Идеи востоковедов, проникающие в мусульманскую мысль, опаснее старых исраилиятов.', ar: 'نفثات المستشرقين من يهود ونصارى، وهي أشد خطرًا من الإسرائيليات القديمة.', tr: 'Oryantalistlerin Müslüman düşüncesine sızan fikirleri eski İsrâiliyyât’tan daha tehlikelidir.' }],
            [{ az: 'Faydasız mübahisə', en: 'Fruitless argument', ru: 'Бесплодные споры', ar: 'الجدل العقيم', tr: 'Faydasız tartışma' }, { az: 'Sələfin yolu çox mübahisədən çəkinməkdir. Həsən əl-Bəsri: «Bunlar ibadətdən bezdilər, söz onlara asan gəldi, vərəsləri azaldı və danışdılar».', en: 'The way of the Salaf is to refrain from much disputing. Al-Hasan said: “These people grew tired of worship, speech became easy for them, their scrupulousness lessened, so they talked.”', ru: 'Путь саляфа — воздерживаться от многих споров. Аль-Хасан сказал: «Им наскучило поклонение, речь стала для них лёгкой, богобоязненность уменьшилась — вот они и заговорили».', ar: 'هدي السلف الكف عن كثرة الخصام والجدال؛ قال الحسن: «هؤلاء ملوا العبادة، وخف عليهم القول، وقل ورعهم، فتكلموا».', tr: 'Selef’in yolu çok tartışmadan uzak durmaktır. Hasan: “Bunlar ibadetten usandılar, söz onlara kolay geldi, takvaları azaldı ve konuştular.”' }],
            [{ az: 'Firqəçilik və hizbçilik', en: 'Sectarianism and partisanship', ru: 'Сектантство и партийность', ar: 'لا طائفية ولا حزبية', tr: 'Fırkacılık ve hizipçilik' }, { az: 'Vəla və bəranı (sevgi və uzaqlaşmanı) qrupa bağlama: İslam əhlinin İslamdan başqa nişanı yoxdur, bütün müsəlmanlar camaatdır.', en: 'Do not base loyalty and disavowal on a group: the people of Islam have no badge but Islam, and all Muslims are the Jama‘ah.', ru: 'Не строй дружбу и непричастность на принадлежности к группе: у людей ислама нет иного знака, кроме ислама, и все мусульмане — джамаат.', ar: 'لا تعقد الولاء والبراء على طائفة أو حزب؛ فأهل الإسلام ليس لهم سمة سوى الإسلام والسلام، والمسلمون جميعهم هم الجماعة.', tr: 'Velâ ve berâyı bir gruba bağlama: İslam ehlinin İslam’dan başka nişanı yoktur, bütün Müslümanlar cemaattir.' }],
          ],
        },
      ],
    },
    {
      id: 'nawaqid',
      title: { az: 'Bu bəzəyi pozan şeylər', en: 'What nullifies this adornment', ru: 'Что разрушает это украшение', ar: 'نواقض هذه الحلية', tr: 'Bu süsü bozan şeyler' },
      blocks: [
        { t: 'p', text: {
          az: 'Müəllif kitabı bu bəzəyin «nizamını pozan ən böyük şeylər»in siyahısı ilə bitirir:',
          en: 'The author closes the book with a list of “the greatest things that break the string of this adornment”:',
          ru: 'Автор завершает книгу перечнем «самого тяжкого, что рвёт нить этого украшения»:',
          ar: 'وختم المؤلف كتابه بقوله: «اعلم أن من أعظم خوارمها المفسدة لنظام عقدها»:',
          tr: 'Yazar kitabı bu süsün “dizisini bozan en büyük şeyler”in listesiyle bitirir:',
        } },
        { t: 'list', ordered: true, items: [
          { az: 'Sirri faş etmək.', en: 'Disclosing secrets.', ru: 'Разглашение тайн.', ar: 'إفشاء السر.', tr: 'Sırrı ifşa etmek.' },
          { az: 'Bir qövmün sözünü başqalarına daşımaq (söz gəzdirmək).', en: 'Carrying people’s words to others (talebearing).', ru: 'Переносить слова одних людей другим (сплетни).', ar: 'نقل الكلام من قوم إلى آخرين.', tr: 'Bir topluluğun sözünü başkalarına taşımak (laf getirip götürmek).' },
          { az: 'Təkəbbür və dilavərlik.', en: 'Arrogance and a sharp tongue.', ru: 'Заносчивость и острый язык.', ar: 'الصلف واللسانة.', tr: 'Kibir ve dil uzatmak.' },
          { az: 'Çox zarafat etmək.', en: 'Excessive joking.', ru: 'Чрезмерные шутки.', ar: 'كثرة المزاح.', tr: 'Çok şaka yapmak.' },
          { az: 'İki nəfərin söhbətinə qarışmaq.', en: 'Intruding into a conversation between two people.', ru: 'Вмешиваться в разговор двоих.', ar: 'الدخول في حديث بين اثنين.', tr: 'İki kişinin konuşmasına girmek.' },
          { az: 'Kin.', en: 'Rancour.', ru: 'Злопамятство.', ar: 'الحقد.', tr: 'Kin.' },
          { az: 'Həsəd.', en: 'Envy.', ru: 'Зависть.', ar: 'الحسد.', tr: 'Haset.' },
          { az: 'Pis zənn.', en: 'Bad suspicion.', ru: 'Дурные подозрения.', ar: 'سوء الظن.', tr: 'Su-i zan.' },
          { az: 'Bidət əhli ilə oturub-durmaq.', en: 'Sitting with the people of innovation.', ru: 'Общение с людьми нововведений.', ar: 'مجالسة المبتدعة.', tr: 'Bid‘at ehliyle oturup kalkmak.' },
          { az: 'Haram yerlərə ayaq atmaq.', en: 'Walking towards what is forbidden.', ru: 'Шаги к запретному.', ar: 'نقل الخطى إلى المحارم.', tr: 'Haram yerlere adım atmak.' },
        ] },
        { t: 'note', kind: 'tip', text: {
          az: 'Müəllifin son nəsihəti: bu günahlardan və bənzərlərindən çəkin, addımlarını bütün haramlardan saxla. Əks halda dinin zəif olar və elm tələbəsi kimi örnək ola bilməzsən. Yeni başlayanlara praktik tövsiyə: əvvəl ədəb, sonra elm.',
          en: 'The author’s final advice: beware of these sins and their like, and keep your steps away from everything forbidden; otherwise your religion is thin and you cannot be a student of knowledge others look up to. As practical advice for beginners: manners first, then knowledge.',
          ru: 'Последний совет автора: остерегайся этих грехов и им подобных и удерживай свои шаги от всего запретного; иначе твоя религиозность слаба, и ты не станешь ищущим знание, на которого равняются. Практический совет начинающим: сначала нравы, затем знание.',
          ar: 'قال المؤلف: «فاحذر هذه الآثام وأخواتها، واقصر خطاك عن جميع المحرمات، فإن فعلت وإلا فاعلم أنك رقيق الديانة...». فالأدب أولًا ثم العلم.',
          tr: 'Yazarın son nasihati: bu günahlardan ve benzerlerinden sakın, adımlarını bütün haramlardan uzak tut; aksi hâlde dinin zayıftır ve örnek alınan bir ilim talebesi olamazsın. Yeni başlayanlara pratik tavsiye: önce edep, sonra ilim.',
        } },
      ],
    },
  ],
  sources: [
    { label: 'Bakr Abu Zayd, Hilyat Talib al-‘Ilm (Dar al-‘Asimah, Riyadh, 1416 AH)', url: 'https://usul.ai/t/decorating-the-student-of-knowledge' },
    { label: 'Ibn ‘Uthaymin, Sharh Hilyat Talib al-‘Ilm' },
    { label: 'Sahih al-Bukhari, Sahih Muslim, Sunan Abi Dawud — fawazahmed0 hadith-api', url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions.json' },
    { label: 'Quran.com — Uthmani text', url: 'https://quran.com' },
  ],
}
