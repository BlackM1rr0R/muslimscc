// İstixarə namazı — dəlilləri ilə. Hədis nömrələri fawazahmed0/hadith-api ilə yoxlanılıb.
// Fətvalar (İslamQA, binbaz.org.sa) açılıb yoxlanılıb.

export const meta = {
  slug: 'istikhara',
  cat: 'tahara',
  order: 30,
  icon: 'compass',
  arTitle: 'صَلَاةُ الاسْتِخَارَة',
  title: {
    az: 'İstixarə namazı: Allahdan xeyir istəmək',
    en: 'Salat al-Istikhara: asking Allah for the best',
    ru: 'Намаз истихара: просьба к Аллаху о благом выборе',
    ar: 'صلاة الاستخارة: طلب الخيرة من الله',
    tr: 'İstihare namazı: Allah’tan hayırlısını istemek',
  },
  summary: {
    az: 'İstixarə nədir, nə vaxt və necə qılınır, duasının mətni və mənası, ondan sonra nə etməli və bu mövzuda yayılmış yanlışlıqlar — səhih Sünnə əsasında.',
    en: 'What istikhara is, when and how it is prayed, the text and meaning of its du‘a, what to do afterwards and common mistakes — based on the authentic Sunnah.',
    ru: 'Что такое истихара, когда и как её совершать, текст и смысл мольбы, что делать после неё и распространённые ошибки — по достоверной Сунне.',
    ar: 'معنى الاستخارة ومتى تشرع وكيف تصلى، ونص دعائها ومعناه، وما يفعله المستخير بعدها، وأخطاء شائعة، على ضوء السنة الصحيحة.',
    tr: 'İstihare nedir, ne zaman ve nasıl kılınır, duasının metni ve anlamı, sonrasında ne yapılmalı ve yaygın hatalar — sahih Sünnet ışığında.',
  },
  author: {
    az: 'Cabirin hədisi (Buxari); İbn Baz, İbn Useymin və Daimi Komitənin fətvaları',
    en: 'The hadith of Jabir (Bukhari); fatwas of Ibn Baz, Ibn Uthaymin and the Permanent Committee',
    ru: 'Хадис Джабира (Бухари); фетвы Ибн База, Ибн Усаймина и Постоянного комитета',
    ar: 'حديث جابر في صحيح البخاري؛ فتاوى ابن باز وابن عثيمين واللجنة الدائمة',
    tr: 'Câbir hadisi (Buhârî); İbn Baz, İbn Useymin ve Daimi Komite’nin fetvaları',
  },
  minutes: 8,
}

export default {
  sections: [
    {
      id: 'intro',
      title: { az: 'İstixarə nədir?', en: 'What is istikhara?', ru: 'Что такое истихара?', ar: 'ما الاستخارة؟', tr: 'İstihare nedir?' },
      blocks: [
        { t: 'p', text: {
          az: 'İstixarə — Allahdan iki iş arasında xeyirlisini seçməyi və onu asan etməyi istəməkdir. Bu, qulun öz acizliyini etiraf etməsi və işini bilən və qadir olan Rəbbinə həvalə etməsidir. Alimlər istixarənin sünnə olduğunda yekdildirlər.',
          en: 'Istikhara is asking Allah to choose what is best between two matters and to make it easy. It is the servant admitting his own weakness and entrusting his affair to his Lord, who knows and is able. The scholars agree that istikhara is sunnah.',
          ru: 'Истихара — это просьба к Аллаху выбрать лучшее из двух дел и облегчить его. В ней раб признаёт свою немощь и вверяет своё дело Господу, Который знает и всемогущ. Учёные единогласны в том, что истихара — сунна.',
          ar: 'الاستخارة طلب الخيرة من الله في أمرين، وأن ييسر العبد للخير منهما، وفيها إظهار العجز والتفويض إلى العليم القدير، وقد أجمع العلماء على أنها سنة.',
          tr: 'İstihare, iki iş arasında hayırlı olanı seçmesini ve onu kolaylaştırmasını Allah’tan istemektir. Bu, kulun acizliğini itiraf edip işini bilen ve gücü yeten Rabbine havale etmesidir. Âlimler istiharenin sünnet olduğunda ittifak etmiştir.',
        } },
        { t: 'ayah', ar: 'وَشَاوِرْهُمْ فِى ٱلْأَمْرِ ۖ فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى ٱللَّهِ ۚ إِنَّ ٱللَّهَ يُحِبُّ ٱلْمُتَوَكِّلِينَ', ref: '3:159', text: {
          az: '“…İşlərdə onlarla məsləhətləş. Qərara gəldikdə isə Allaha təvəkkül et. Həqiqətən, Allah təvəkkül edənləri sevir.”',
          en: '“…And consult them in the matter. Then, when you have decided, put your trust in Allah. Indeed, Allah loves those who rely upon Him.”',
          ru: '«…и советуйся с ними о делах. А когда примешь решение, уповай на Аллаха. Воистину, Аллах любит уповающих».',
          ar: 'وشاورهم في الأمر فإذا عزمت فتوكل على الله إن الله يحب المتوكلين.',
          tr: '“…İşlerde onlarla istişare et. Karar verdiğin zaman da Allah’a tevekkül et. Şüphesiz Allah tevekkül edenleri sever.”',
        } },
        { t: 'p', text: {
          az: 'Möminin yolu iki şeyi birləşdirir: bilən insanlarla məsləhətləşmək və Rəbbindən istixarə etmək.',
          en: 'The believer’s way combines two things: consulting people of knowledge and experience, and seeking guidance from his Lord through istikhara.',
          ru: 'Путь верующего сочетает две вещи: совет со знающими и опытными людьми и обращение к Господу с истихарой.',
          ar: 'فالمؤمن يجمع بين استشارة أهل العلم والخبرة والاستخارة لربه.',
          tr: 'Müminin yolu iki şeyi birleştirir: bilgi ve tecrübe sahipleriyle istişare etmek ve Rabbinden istihare etmek.',
        } },
      ],
    },
    {
      id: 'hadith',
      title: { az: 'Əsas dəlil — Cabirin hədisi', en: 'The main evidence — the hadith of Jabir', ru: 'Главный довод — хадис Джабира', ar: 'الأصل في الباب: حديث جابر', tr: 'Temel delil — Câbir hadisi' },
      blocks: [
        { t: 'hadith', ar: 'كَانَ رَسُولُ اللَّهِ ﷺ يُعَلِّمُنَا الاِسْتِخَارَةَ فِي الأُمُورِ كَمَا يُعَلِّمُنَا السُّورَةَ مِنَ الْقُرْآنِ، يَقُولُ: إِذَا هَمَّ أَحَدُكُمْ بِالأَمْرِ فَلْيَرْكَعْ رَكْعَتَيْنِ مِنْ غَيْرِ الْفَرِيضَةِ، ثُمَّ لِيَقُلْ...', text: {
          az: 'Cabir ibn Abdullah deyir: “Allahın Elçisi ﷺ bizə bütün işlərdə istixarəni Qurandan surə öyrətdiyi kimi öyrədərdi. O deyərdi: «Sizdən biriniz bir işə qəsd etdikdə fərzdən başqa iki rükət namaz qılsın, sonra desin…»”',
          en: 'Jabir ibn ‘Abdullah said: “The Messenger of Allah ﷺ used to teach us istikhara in all matters as he taught us a surah of the Quran. He would say: «When one of you intends a matter, let him pray two rak‘ahs other than the obligatory prayer, then say…»”',
          ru: 'Джабир ибн Абдуллах сказал: «Посланник Аллаха ﷺ учил нас истихаре во всех делах так же, как учил суре из Корана. Он говорил: «Когда кто-то из вас намерен совершить дело, пусть совершит два ракаата помимо обязательного намаза, а затем скажет…»».',
          ar: 'حديث جابر بن عبد الله في تعليم النبي ﷺ أصحابه الاستخارة.',
          tr: 'Câbir b. Abdullah der ki: “Allah’ın Resûlü ﷺ bize Kur’an’dan bir sure öğretir gibi bütün işlerde istihareyi öğretirdi. Şöyle derdi: «Biriniz bir işe niyetlendiğinde farz dışında iki rekât namaz kılsın, sonra şöyle desin…»”',
        }, src: { az: 'Buxari 1166, 6382, 7390', en: 'Bukhari 1166, 6382, 7390', ru: 'Бухари 1166, 6382, 7390', ar: 'البخاري 1166، 6382، 7390', tr: 'Buhârî 1166, 6382, 7390' } },
        { t: 'dua', ar: 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلاَ أَقْدِرُ، وَتَعْلَمُ وَلاَ أَعْلَمُ، وَأَنْتَ عَلاَّمُ الْغُيُوبِ. اللَّهُمَّ إِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الأَمْرَ خَيْرٌ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي، فَاقْدُرْهُ لِي وَيَسِّرْهُ لِي ثُمَّ بَارِكْ لِي فِيهِ، وَإِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الأَمْرَ شَرٌّ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي، فَاصْرِفْهُ عَنِّي وَاصْرِفْنِي عَنْهُ، وَاقْدُرْ لِيَ الْخَيْرَ حَيْثُ كَانَ، ثُمَّ أَرْضِنِي بِهِ',
          translit: {
            az: 'Allahummə inni əstəxirukə bi-ilmikə, və əstəqdirukə bi-qudrətikə, və əs’əlukə min fədlikəl-azim. Fə innəkə təqdiru və la əqdir, və tə’ləmu və la ə’ləm, və əntə alləmul-ğuyub. Allahummə in kuntə tə’ləmu ənnə hazəl-əmrə xayrun li fi dini və mə’aşi və aqibəti əmri, fəqdurhu li və yəssirhu li, summə barik li fih. Və in kuntə tə’ləmu ənnə hazəl-əmrə şərrun li fi dini və mə’aşi və aqibəti əmri, fəsrifhu ənni vəsrifni ənh, vəqdur liyəl-xayra haysu kan, summə ərdini bih.',
            en: 'Allahumma inni astakhiruka bi‘ilmika, wa astaqdiruka biqudratika, wa as’aluka min fadlika-l-‘azim. Fa innaka taqdiru wa la aqdir, wa ta‘lamu wa la a‘lam, wa anta ‘allamu-l-ghuyub. Allahumma in kunta ta‘lamu anna hadha-l-amra khayrun li fi dini wa ma‘ashi wa ‘aqibati amri, faqdurhu li wa yassirhu li thumma barik li fih. Wa in kunta ta‘lamu anna hadha-l-amra sharrun li fi dini wa ma‘ashi wa ‘aqibati amri, fasrifhu ‘anni wasrifni ‘anh, waqdur liya-l-khayra haythu kan, thumma ardini bih.',
            ru: 'Аллахумма инни астахыру-кя би-‘ильми-кя, ва астакдиру-кя би-кудрати-кя, ва ас’алю-кя мин фадли-кя-ль-‘азым. Фа инна-кя такдиру ва ля акдиру, ва та‘ляму ва ля а‘ляму, ва Анта ‘аллямуль-гуюб. Аллахумма ин кунта та‘ляму анна хазаль-амра хайрун ли фи дини ва ма‘аши ва ‘акыбати амри, фа-кдур-ху ли ва йассир-ху ли, сумма барик ли фи-хи. Ва ин кунта та‘ляму анна хазаль-амра шаррун ли фи дини ва ма‘аши ва ‘акыбати амри, фа-сриф-ху ‘анни ва-сриф-ни ‘ан-ху, ва-кдур лия-ль-хайра хайсу кяна, сумма арды-ни би-хи.',
            ar: 'يُقرأ الدعاء بنصه العربي كما ورد.',
            tr: 'Allâhümme innî estehîruke bi-ilmike ve estakdiruke bi-kudretike ve es’elüke min fadlike’l-azîm. Fe inneke takdiru ve lâ akdiru ve ta’lemu ve lâ a’lemu ve ente allâmü’l-guyûb. Allâhümme in künte ta’lemu enne hâze’l-emra hayrun lî fî dînî ve meâşî ve âkıbeti emrî, fakdurhü lî ve yessirhü lî sümme bârik lî fîh. Ve in künte ta’lemu enne hâze’l-emra şerrun lî fî dînî ve meâşî ve âkıbeti emrî, fasrifhü annî vasrifnî anh, vakdur liye’l-hayra haysü kân, sümme erdınî bih.',
          },
          text: {
            az: '“Allahım! Elminlə Səndən xeyirlisini istəyirəm, qüdrətinlə Səndən güc diləyirəm və Sənin böyük lütfündən istəyirəm. Çünki Sən qadirsən, mən isə aciz; Sən bilirsən, mən isə bilmirəm; Sən qeybləri ən yaxşı biləndən. Allahım! Əgər bilirsənsə ki, bu iş (işin adını çəkir) mənim dinim, dolanışığım və işimin sonu üçün xeyirlidir, onu mənə müqəddər et, asanlaşdır, sonra onu mənim üçün bərəkətli et. Əgər bilirsənsə ki, bu iş mənim dinim, dolanışığım və işimin sonu üçün şərdir, onu məndən, məni də ondan uzaqlaşdır, harada olursa olsun xeyiri mənə müqəddər et, sonra məni ondan razı sal.”',
            en: '“O Allah, I seek Your guidance by Your knowledge, and I seek ability from Your power, and I ask You of Your great bounty. For You are able and I am not; You know and I do not; and You are the Knower of the unseen. O Allah, if You know that this matter (he names it) is good for me in my religion, my livelihood and the outcome of my affairs, then decree it for me, make it easy for me, then bless me in it. And if You know that this matter is bad for me in my religion, my livelihood and the outcome of my affairs, then turn it away from me and turn me away from it, and decree for me the good wherever it may be, then make me content with it.”',
            ru: '«О Аллах, я прошу Тебя выбрать для меня лучшее по Твоему знанию, прошу Тебя придать мне сил Твоим могуществом и прошу Тебя о Твоей великой милости. Ведь Ты можешь, а я не могу; Ты знаешь, а я не знаю; и Ты — Знающий сокрытое. О Аллах, если Ты знаешь, что это дело (называет его) — благо для меня в моей религии, моей жизни и исходе моих дел, то предопредели его для меня, облегчи его мне и благослови меня в нём. А если Ты знаешь, что это дело — зло для меня в моей религии, моей жизни и исходе моих дел, то отврати его от меня и отврати меня от него, предопредели мне благо, где бы оно ни было, а затем сделай меня довольным им».',
            ar: 'دعاء الاستخارة كما علّمه النبي ﷺ أصحابه.',
            tr: '“Allah’ım! İlminle Senden hayırlısını istiyorum, kudretinle Senden güç diliyorum ve büyük lütfundan istiyorum. Çünkü Sen güç yetirirsin, ben yetiremem; Sen bilirsin, ben bilmem; gaybları hakkıyla bilen Sensin. Allah’ım! Eğer bu işin (işin adını söyler) dinim, geçimim ve işimin sonu bakımından benim için hayırlı olduğunu biliyorsan onu bana takdir et, kolaylaştır, sonra onu bana mübarek kıl. Eğer bu işin dinim, geçimim ve işimin sonu bakımından benim için şer olduğunu biliyorsan onu benden, beni de ondan uzaklaştır; hayır nerede ise onu bana takdir et, sonra beni ondan razı kıl.”',
          },
          src: { az: 'Buxari 1166', en: 'Bukhari 1166', ru: 'Бухари 1166', ar: 'البخاري 1166', tr: 'Buhârî 1166' },
        },
        { t: 'note', kind: 'info', text: {
          az: 'Rəvayətdə “dinim, dolanışığım və işimin sonu” əvəzinə “işimin yaxın və uzaq aqibəti” (‘acili əmri və acilihi) sözləri də keçir — ikisindən birini demək olar. “Bu iş” deyilən yerdə istəyin özünü adlandırmaq olar: məsələn, “bu evi almaq”, “bu işə girmək”.',
          en: 'The narration also has “in my affairs of now and later” (‘ajili amri wa ajilihi) in place of “my religion, my livelihood and the outcome of my affairs” — either may be said. Where it says “this matter”, you may name the matter itself: e.g. “buying this house”, “taking this job”.',
          ru: 'В передаче вместо «в моей религии, моей жизни и исходе моих дел» встречается также «в ближайших и отдалённых моих делах» («‘аджили амри ва аджилихи») — можно сказать любой вариант. На месте «это дело» можно назвать само дело: например, «покупку этого дома», «эту работу».',
          ar: 'ورد في الرواية: «أو قال: عاجل أمري وآجله» بدل «في ديني ومعاشي وعاقبة أمري»، فيقول أيهما شاء، ويسمي حاجته مكان «هذا الأمر» كأن يقول: شراء هذا البيت، أو هذا العمل.',
          tr: 'Rivayette “dinim, geçimim ve işimin sonu” yerine “işimin yakın ve uzak sonucu” (âcili emrî ve âcilihî) ifadesi de geçer — ikisinden biri söylenebilir. “Bu iş” denen yerde ihtiyacın kendisi söylenebilir: mesela “bu evi almak”, “bu işe girmek”.',
        } },
      ],
    },
    {
      id: 'when',
      title: { az: 'Nə vaxt istixarə edilir?', en: 'When is istikhara done?', ru: 'Когда совершают истихару?', ar: 'متى تشرع الاستخارة؟', tr: 'Ne zaman istihare yapılır?' },
      blocks: [
        { t: 'list', items: [
          {
            az: 'Mübah işlərdə: evlilik, iş, səfər, ev almaq, təhsil və s.',
            en: 'In permissible matters: marriage, work, travel, buying a house, study and so on.',
            ru: 'В дозволенных делах: брак, работа, поездка, покупка жилья, учёба и т. д.',
            ar: 'في الأمور المباحة كالزواج والعمل والسفر وشراء البيت والدراسة ونحوها.',
            tr: 'Mubah işlerde: evlilik, iş, yolculuk, ev almak, eğitim vb.',
          },
          {
            az: 'İki müstəhəb iş arasında seçim olduqda — hansını əvvəl etməli və ya necə etməli.',
            en: 'When choosing between two recommended deeds — which to do first, or how to do it.',
            ru: 'При выборе между двумя желательными делами — какое совершить первым или как.',
            ar: 'عند التردد بين أمرين مستحبين: أيهما يقدم، أو في كيفية فعله.',
            tr: 'İki müstehap iş arasında seçim yaparken — hangisini önce yapmalı veya nasıl yapmalı.',
          },
          {
            az: 'Vacib işi (məs. fərz namaz, valideynə yaxşılıq) etmək və ya haramı (məs. faiz, zina) tərk etmək üçün istixarə edilmir — onların hökmü artıq bəllidir.',
            en: 'Istikhara is not made about doing an obligation (e.g. the prescribed prayer, honouring parents) or leaving something forbidden (e.g. usury, zina) — their ruling is already clear.',
            ru: 'Истихару не совершают о том, выполнять ли обязанность (например, обязательный намаз, почтение к родителям) или оставлять ли запретное (например, ростовщичество, прелюбодеяние), — их положение уже ясно.',
            ar: 'لا يُستخار في فعل الواجب كالصلاة المفروضة وبر الوالدين، ولا في ترك المحرم كالربا والزنا، فحكمها معلوم.',
            tr: 'Farzı (mesela farz namaz, anne-babaya iyilik) yapmak veya haramı (mesela faiz, zina) terk etmek için istihare yapılmaz — bunların hükmü zaten bellidir.',
          },
        ] },
        { t: 'note', kind: 'tip', text: {
          az: 'İstixarə qərar hələ tam verilmədən, ürək açıq olduğu halda edilir. Hədisdəki “bir işə qəsd etdikdə” sözləri buna işarədir.',
          en: 'Istikhara is made before the decision is firmly settled, while the heart is still open. The words of the hadith “when one of you intends a matter” point to this.',
          ru: 'Истихару совершают до того, как решение окончательно принято, пока сердце ещё открыто. На это указывают слова хадиса «когда кто-то из вас намерен совершить дело».',
          ar: 'تكون الاستخارة عند الهمّ بالأمر قبل العزم عليه، والقلب لم يمل بعد، وهو معنى قوله: إذا هم أحدكم بالأمر.',
          tr: 'İstihare, karar kesinleşmeden, kalp henüz açıkken yapılır. Hadisteki “biriniz bir işe niyetlendiğinde” sözleri buna işaret eder.',
        } },
      ],
    },
    {
      id: 'how',
      title: { az: 'İstixarə necə edilir?', en: 'How istikhara is done', ru: 'Как совершается истихара', ar: 'صفة صلاة الاستخارة', tr: 'İstihare nasıl yapılır?' },
      blocks: [
        { t: 'steps', items: [
          {
            title: { az: 'Dəstəmaz', en: 'Wudu', ru: 'Омовение', ar: 'الوضوء', tr: 'Abdest' },
            text: { az: 'Adi namaz üçün olduğu kimi dəstəmaz alın.', en: 'Make wudu as for any prayer.', ru: 'Совершите омовение, как для любого намаза.', ar: 'توضأ كوضوئك للصلاة.', tr: 'Her namazda olduğu gibi abdest alın.' },
          },
          {
            title: { az: 'İki rükət nafilə', en: 'Two voluntary rak‘ahs', ru: 'Два добровольных ракаата', ar: 'ركعتان من غير الفريضة', tr: 'İki rekât nafile' },
            text: { az: 'İstixarə niyyəti ilə fərzdən başqa iki rükət qılın. Fatihədən sonra istədiyiniz surəni oxuyun — bu namaz üçün xüsusi surə səhih Sünnədə təyin edilməyib.', en: 'Pray two rak‘ahs other than an obligatory prayer, intending istikhara. After al-Fatihah recite whatever you wish — no specific surah for this prayer is set in the authentic Sunnah.', ru: 'Совершите два ракаата помимо обязательного намаза с намерением истихары. После «аль-Фатихи» читайте любую суру — в достоверной Сунне для этого намаза особая сура не установлена.', ar: 'صلّ ركعتين من غير الفريضة بنية الاستخارة، واقرأ بعد الفاتحة ما تيسر، إذ لم يثبت في السنة تعيين سورة لها.', tr: 'İstihare niyetiyle farz dışında iki rekât kılın. Fatiha’dan sonra dilediğiniz sureyi okuyun — bu namaz için sahih Sünnette özel bir sure belirlenmemiştir.' },
          },
          {
            title: { az: 'Salamdan sonra dua', en: 'The du‘a after the salam', ru: 'Мольба после таслима', ar: 'الدعاء بعد السلام', tr: 'Selamdan sonra dua' },
            text: { az: 'Salam verdikdən sonra istixarə duasını oxuyun və “bu iş” deyilən yerdə istəyinizi adlandırın. Şeyx İbn Baz deyir ki, salamdan sonra əllər qaldırılıb istixarə edilir.', en: 'After the salam, recite the du‘a of istikhara, naming your matter where it says “this matter”. Shaykh Ibn Baz said that after the salam one raises the hands and makes istikhara.', ru: 'После таслима прочитайте мольбу истихары, называя своё дело на месте слов «это дело». Шейх Ибн Баз сказал, что после таслима поднимают руки и совершают истихару.', ar: 'بعد السلام ادعُ بدعاء الاستخارة، وسمّ حاجتك مكان «هذا الأمر». قال الشيخ ابن باز: ثم بعد السلام يرفع يديه ويستخير.', tr: 'Selam verdikten sonra istihare duasını okuyun ve “bu iş” denen yerde ihtiyacınızı söyleyin. Şeyh İbn Baz, selamdan sonra ellerin kaldırılıp istihare edileceğini söyler.' },
          },
          {
            title: { az: 'Məsləhət və təvəkkül', en: 'Consultation and reliance', ru: 'Совет и упование', ar: 'الاستشارة والتوكل', tr: 'İstişare ve tevekkül' },
            text: { az: 'Dindar və təcrübəli insanlarla məsləhətləşin, sonra ürəyinizin meyl etdiyi və asanlaşan işi Allaha təvəkkül edərək görün.', en: 'Consult pious and experienced people, then go ahead with what your heart inclines to and what becomes easy, relying on Allah.', ru: 'Посоветуйтесь с благочестивыми и опытными людьми, затем приступайте к тому, к чему склонится сердце и что облегчится, уповая на Аллаха.', ar: 'استشر أهل الدين والخبرة، ثم امضِ فيما انشرح له صدرك وتيسر لك متوكلًا على الله.', tr: 'Dindar ve tecrübeli insanlarla istişare edin, sonra kalbinizin meylettiği ve kolaylaşan işi Allah’a tevekkül ederek yapın.' },
          },
        ] },
        { t: 'quote', ar: 'دعاء الاستخارة بعد السلام؛ لأن النبي عليه الصلاة والسلام قال: «فليصل ركعتين ثم ليقل»', text: {
          az: '“İstixarə duası salamdan sonradır, çünki Peyğəmbər ﷺ: «İki rükət qılsın, sonra desin» — buyurmuşdur.”',
          en: '“The du‘a of istikhara is after the salam, because the Prophet ﷺ said: «Let him pray two rak‘ahs, then say…»”',
          ru: '«Мольба истихары — после таслима, ведь Пророк ﷺ сказал: «Пусть совершит два ракаата, а затем скажет…»».',
          ar: 'دعاء الاستخارة بعد السلام لقوله ﷺ: فليصل ركعتين ثم ليقل.',
          tr: '“İstihare duası selamdan sonradır; çünkü Peygamber ﷺ: «İki rekât kılsın, sonra desin» buyurmuştur.”',
        }, by: { az: 'Şeyx İbn Useymin', en: 'Shaykh Ibn Uthaymin', ru: 'Шейх Ибн Усаймин', ar: 'الشيخ ابن عثيمين', tr: 'Şeyh İbn Useymin' }, ref: { az: 'İslamQA 164728-də nəql olunub', en: 'quoted in IslamQA 164728', ru: 'приведено в IslamQA 164728', ar: 'نقلًا عن الإسلام سؤال وجواب 164728', tr: 'IslamQA 164728’de nakledilmiştir' } }, // lang-ok[IslamQA]: saytın xüsusi adı
        { t: 'p', text: {
          az: 'Dörd məzhəbin, Daimi Komitənin, İbn Baz və İbn Useyminin rəyi budur ki, dua salamdan sonra edilir. Şeyxulislam İbn Teymiyyə isə onun salamdan əvvəl də caiz olduğunu, hətta bunu üstün tutduğunu demişdir. Hədisin zahiri birinci rəyi dəstəkləyir.',
          en: 'The view of the four schools, the Permanent Committee, Ibn Baz and Ibn Uthaymin is that the du‘a is made after the salam. Shaykh al-Islam Ibn Taymiyyah held it is also permissible before the salam and even preferred that. The apparent wording of the hadith supports the first view.',
          ru: 'Мнение четырёх мазхабов, Постоянного комитета, Ибн База и Ибн Усаймина — мольбу читают после таслима. Шейх аль-ислам Ибн Таймия же считал допустимым читать её и до таслима и даже предпочитал это. Внешний смысл хадиса поддерживает первое мнение.',
          ar: 'مذهب الأئمة الأربعة واللجنة الدائمة وابن باز وابن عثيمين أن الدعاء بعد السلام، ورأى شيخ الإسلام ابن تيمية جوازه قبل السلام بل استحبه، وظاهر الحديث يؤيد القول الأول.',
          tr: 'Dört mezhebin, Daimi Komite’nin, İbn Baz ve İbn Useymin’in görüşü duanın selamdan sonra yapılmasıdır. Şeyhülislam İbn Teymiyye ise selamdan önce de caiz olduğunu, hatta bunu daha üstün gördüğünü söylemiştir. Hadisin zahiri birinci görüşü destekler.',
        } },
        { t: 'note', kind: 'info', text: {
          az: 'Bəzi alimlər (İbn Həcər və başqaları) deyiblər ki, rəvatib sünnə və ya təhiyyətul-məscid namazına istixarə niyyəti də qatılarsa, sonra dua oxunsa, kifayət edər; əgər niyyət edilməyibsə, kifayət etməz. Ayrıca iki rükət qılmaq daha ehtiyatlıdır.',
          en: 'Some scholars (Ibn Hajar and others) said that if one intends istikhara together with a regular sunnah prayer or tahiyyat al-masjid and then makes the du‘a, it suffices; if it was not intended, it does not. Praying two separate rak‘ahs is more cautious.',
          ru: 'Некоторые учёные (Ибн Хаджар и другие) сказали, что если совместить намерение истихары с регулярной сунной или приветствием мечети и после этого прочитать мольбу, то этого достаточно; если же не было намерения — недостаточно. Отдельные два ракаата — осторожнее.',
          ar: 'ذكر بعض العلماء كابن حجر أنه لو نوى بالراتبة أو تحية المسجد الاستخارة معها ثم دعا أجزأ، وإن لم ينوِ لم يجزئ، والأحوط أن يصلي ركعتين مستقلتين.',
          tr: 'Bazı âlimler (İbn Hacer ve başkaları), revâtib sünnet veya tahiyyetü’l-mescid namazına istihare niyeti de katılıp sonra dua edilirse yeterli olacağını, niyet edilmezse yetmeyeceğini söylemiştir. Ayrı iki rekât kılmak daha ihtiyatlıdır.',
        } },
      ],
    },
    {
      id: 'after',
      title: { az: 'İstixarədən sonra', en: 'After istikhara', ru: 'После истихары', ar: 'ما بعد الاستخارة', tr: 'İstihareden sonra' },
      blocks: [
        { t: 'p', text: {
          az: 'İstixarədən sonra yuxu görmək və ya xüsusi bir əlamət gözləmək şərt deyil. Kim səmimi qəlbdən istixarə edib, məsləhətləşib, araşdırıb sonra işə başlayarsa, ümid olunur ki, bu onun üçün xeyirdir — hətta əvvəlcə ürəyi tam rahatlanmasa belə. İş asanlaşırsa, bu, xeyir əlamətidir; çətinləşib əngəllənirsə, Allah onu ondan döndərmişdir.',
          en: 'After istikhara there is no need to see a dream or wait for a special sign. Whoever sincerely makes istikhara, consults, investigates and then proceeds, it is hoped this is good for him — even if his heart was not fully at ease at first. If the matter becomes easy, that is a sign of good; if it becomes hard and blocked, Allah has turned him away from it.',
          ru: 'После истихары не требуется видеть сон или ждать особого знака. Кто искренне совершил истихару, посоветовался, изучил дело и приступил к нему — можно надеяться, что это для него благо, даже если сначала сердце не было полностью спокойно. Если дело облегчается — это признак блага; если оно затрудняется и встречает препятствия — значит, Аллах отвратил его от этого.',
          ar: 'لا يشترط بعد الاستخارة أن يرى رؤيا أو ينتظر علامة، فمن استخار بصدق واستشار وتحرى ثم مضى فيرجى أن يكون ذلك خيرًا له ولو لم ينشرح صدره ابتداءً؛ فإن تيسر الأمر فهو علامة الخير، وإن تعسر فقد صرفه الله عنه.',
          tr: 'İstihareden sonra rüya görmek veya özel bir işaret beklemek şart değildir. Samimiyetle istihare edip istişare eden, araştırıp sonra işe başlayan kişi için bunun hayırlı olması umulur — başta kalbi tam rahatlamasa bile. İş kolaylaşırsa bu hayır alametidir; zorlaşıp engellenirse Allah onu ondan çevirmiştir.',
        } },
        { t: 'quote', ar: 'لا يشترط أن يرى المستخير شيئاً يدله على أن هذا هو الأفضل له', text: {
          az: '“İstixarə edənin, bunun onun üçün daha yaxşı olduğunu göstərən bir şey görməsi şərt deyil.”',
          en: '“It is not a condition that the one who makes istikhara sees something showing him that this is best for him.”',
          ru: '«Не является условием, чтобы совершивший истихару увидел что-то, указывающее, что это для него лучше».',
          ar: 'لا يشترط أن يرى المستخير شيئًا يدله على الأفضل.',
          tr: '“İstihare edenin, bunun kendisi için daha hayırlı olduğunu gösteren bir şey görmesi şart değildir.”',
        }, by: { az: 'Şeyx İbn Useymin', en: 'Shaykh Ibn Uthaymin', ru: 'Шейх Ибн Усаймин', ar: 'الشيخ ابن عثيمين', tr: 'Şeyh İbn Useymin' }, ref: { az: 'İslamQA 109105-də nəql olunub', en: 'quoted in IslamQA 109105', ru: 'приведено в IslamQA 109105', ar: 'نقلًا عن الإسلام سؤال وجواب 109105', tr: 'IslamQA 109105’te nakledilmiştir' } }, // lang-ok[IslamQA]: saytın xüsusi adı
        { t: 'p', text: {
          az: 'Nəticə gözlənildiyi kimi olmasa belə, mömin razı qalır: o, Allahdan xeyir istəmiş və işini Ona həvalə etmişdir. Duanın sonundakı “sonra məni ondan razı sal” sözləri məhz bunu öyrədir.',
          en: 'Even if the outcome is not what was expected, the believer is content: he asked Allah for the good and entrusted his affair to Him. The closing words of the du‘a, “then make me content with it”, teach exactly this.',
          ru: 'Даже если итог не таков, как ожидалось, верующий доволен: он просил у Аллаха блага и вверил Ему своё дело. Именно этому учат заключительные слова мольбы: «а затем сделай меня довольным им».',
          ar: 'وإن جاءت النتيجة على غير ما يتوقع رضي المؤمن، فقد سأل ربه الخير وفوّض إليه أمره، وهذا معنى قوله في آخر الدعاء: ثم أرضني به.',
          tr: 'Sonuç beklendiği gibi olmasa bile mümin razı olur: Allah’tan hayır istemiş ve işini O’na havale etmiştir. Duanın sonundaki “sonra beni ondan razı kıl” sözleri tam da bunu öğretir.',
        } },
      ],
    },
    {
      id: 'mistakes',
      title: { az: 'Yayılmış yanlışlıqlar', en: 'Common mistakes', ru: 'Распространённые ошибки', ar: 'أخطاء شائعة', tr: 'Yaygın hatalar' },
      blocks: [
        { t: 'list', items: [
          {
            az: 'İstixarədən sonra mütləq yuxu gözləmək və yuxunu qəti cavab saymaq. Yaxşı yuxu ən çoxu müjdədir, hökm deyil.',
            en: 'Insisting on waiting for a dream after istikhara and treating a dream as the decisive answer. A good dream is at most glad tidings, not a ruling.',
            ru: 'Обязательно ждать сна после истихары и считать сон окончательным ответом. Хороший сон — в лучшем случае благая весть, а не решение.',
            ar: 'اشتراط الرؤيا بعد الاستخارة واعتبارها الجواب الفاصل، والرؤيا الصالحة غايتها أن تكون بشرى لا حكمًا.',
            tr: 'İstihareden sonra mutlaka rüya beklemek ve rüyayı kesin cevap saymak. Güzel rüya en fazla müjdedir, hüküm değildir.',
          },
          {
            az: 'Uydurma üsullar: müəyyən surələri yeddi dəfə oxumaq, yeddi gecə ardıcıl etmək, sonra heç kimlə danışmamaq və s. İslamQA bunun bidət olduğunu bildirir (109105).',
            en: 'Invented methods: reciting certain surahs seven times, doing it for seven nights in a row, not speaking to anyone afterwards, etc. IslamQA states this is a bid‘ah (109105).',
            ru: 'Выдуманные способы: читать определённые суры по семь раз, делать это семь ночей подряд, после ни с кем не разговаривать и т. п. Сайт «Ислам: вопрос и ответ» указывает, что это нововведение (109105).',
            ar: 'الطرق المحدثة كقراءة سور معينة سبع مرات، والمداومة سبع ليال، وترك الكلام بعدها، وقد بيّن موقع الإسلام سؤال وجواب أنها بدعة (109105).',
            tr: 'Uydurma yöntemler: belirli sureleri yedi kez okumak, yedi gece üst üste yapmak, sonra kimseyle konuşmamak vb. İslam Soru-Cevap sitesi bunun bid‘at olduğunu bildirir (109105).',
          },
          {
            az: 'Başqasına “mənim üçün istixarə et” demək və falçı, “yuxu yozan” şarlatanlara müraciət etmək. Sünnədəki istixarə — insanın özünün Rəbbinə duasıdır.',
            en: 'Asking someone else to “do istikhara for me”, or turning to fortune-tellers and charlatan “dream interpreters”. The istikhara of the Sunnah is a person’s own du‘a to his Lord.',
            ru: 'Просить другого «сделать за меня истихару» или обращаться к гадалкам и шарлатанам-«толкователям снов». Истихара по Сунне — это собственная мольба человека к своему Господу.',
            ar: 'تكليف غيره بالاستخارة عنه، أو الذهاب إلى العرافين والمشعوذين ومدعي تعبير الرؤى، والاستخارة المشروعة دعاء العبد ربه بنفسه.',
            tr: 'Başkasına “benim için istihare yap” demek ve falcılara, şarlatan “rüya tabircilerine” gitmek. Sünnetteki istihare, kişinin kendisinin Rabbine duasıdır.',
          },
          {
            az: 'Artıq qəti qərar verdikdən sonra yalnız “rəsmiyyət üçün” istixarə etmək.',
            en: 'Making istikhara only “as a formality” after having already firmly decided.',
            ru: 'Совершать истихару лишь «для галочки», когда решение уже окончательно принято.',
            ar: 'الاستخارة صورةً بعد الجزم بالقرار.',
            tr: 'Kesin karar verdikten sonra sadece “şeklen” istihare yapmak.',
          },
        ] },
      ],
    },
    {
      id: 'faq',
      title: { az: 'Suallar və cavablar', en: 'Questions and answers', ru: 'Вопросы и ответы', ar: 'أسئلة وأجوبة', tr: 'Sorular ve cevaplar' },
      blocks: [
        { t: 'qa', items: [
          {
            q: { az: 'İstixarə duası salamdan əvvəl, yoxsa sonra oxunur?', en: 'Is the istikhara du‘a said before or after the salam?', ru: 'Мольбу истихары читают до или после таслима?', ar: 'هل دعاء الاستخارة قبل السلام أم بعده؟', tr: 'İstihare duası selamdan önce mi, sonra mı okunur?' },
            a: {
              az: 'Salamdan sonra. Şeyx İbn Baz deyir: hədisdə “iki rükət qılır, sonra deyir” gəlib, deməli dua iki rükətdən sonradır.',
              en: 'After the salam. Shaykh Ibn Baz said: the hadith says “he prays two rak‘ahs, then says”, so the du‘a comes after the two rak‘ahs.',
              ru: 'После таслима. Шейх Ибн Баз сказал: в хадисе сказано «совершает два ракаата, затем говорит», значит, мольба — после двух ракаатов.',
              ar: 'بعد السلام؛ قال الشيخ ابن باز: جاء في الحديث: يصلي ركعتين ثم يقول، فالدعاء يكون بعد صلاة ركعتين.',
              tr: 'Selamdan sonra. Şeyh İbn Baz der ki: Hadiste “iki rekât kılar, sonra der” buyrulmuştur; dolayısıyla dua iki rekâttan sonradır.',
            },
            ref: { az: 'İbn Baz, fətva 25310', en: 'Ibn Baz, fatwa 25310', ru: 'Ибн Баз, фетва 25310', ar: 'ابن باز، فتوى 25310', tr: 'İbn Baz, fetva 25310' },
            url: 'https://binbaz.org.sa/fatwas/25310/%D9%87%D9%84-%D9%8A%D9%83%D9%88%D9%86-%D8%AF%D8%B9%D8%A7%D8%A1-%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%AE%D8%A7%D8%B1%D8%A9-%D9%82%D8%A8%D9%84-%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85-%D8%A7%D9%85-%D8%A8%D8%B9%D8%AF%D9%87',
          },
          {
            q: { az: 'İstixarədən sonra yuxu görməsəm nə etməliyəm?', en: 'What if I see no dream after istikhara?', ru: 'Что делать, если после истихары я не увидел сна?', ar: 'ماذا أفعل إن لم أرَ رؤيا بعد الاستخارة؟', tr: 'İstihareden sonra rüya görmezsem ne yapmalıyım?' },
            a: {
              az: 'Yuxu şərt deyil. Məsləhətləşin, araşdırın və işi görün; əgər asanlaşırsa — bu xeyir əlamətidir.',
              en: 'A dream is not a condition. Consult, investigate and proceed; if the matter becomes easy, that is a sign of good.',
              ru: 'Сон не является условием. Посоветуйтесь, изучите дело и приступайте; если оно облегчается — это признак блага.',
              ar: 'الرؤيا ليست شرطًا، فاستشر وتحرَّ وامضِ، فإن تيسر الأمر فهو علامة الخير.',
              tr: 'Rüya şart değildir. İstişare edin, araştırın ve işe başlayın; kolaylaşırsa bu hayır alametidir.',
            },
            ref: { az: 'İslamQA 72255', en: 'IslamQA 72255', ru: 'IslamQA 72255', ar: 'الإسلام سؤال وجواب 72255', tr: 'IslamQA 72255' }, // lang-ok[IslamQA]: saytın xüsusi adı
            url: 'https://islamqa.info/ar/answers/72255',
          },
          {
            q: { az: 'İstixarədən sonra məsləhətləşmək lazımdırmı?', en: 'Should I consult people after istikhara?', ru: 'Нужно ли советоваться с людьми после истихары?', ar: 'هل يستشير بعد الاستخارة؟', tr: 'İstihareden sonra istişare etmeli miyim?' },
            a: {
              az: 'Bəli, bu müstəhəbdir. Şeyx İbn Baz deyir ki, namazdan sonra xeyir əhli və səmimi nəsihətçilərlə məsləhətləşmək müstəhəbdir, ürəyi iki işdən birinə rahatlandıqda onu edər.',
              en: 'Yes, it is recommended. Shaykh Ibn Baz said it is recommended to consult good and sincere people after the prayer, and when the heart settles on one of the options, to do it.',
              ru: 'Да, это желательно. Шейх Ибн Баз сказал, что после намаза желательно посоветоваться с добрыми и искренними людьми, а когда сердце успокоится на одном из вариантов — совершить его.',
              ar: 'نعم، قال الشيخ ابن باز: ويستحب له أن يستشير أهل الخير وأهل النصح بعد الصلاة، فإذا اطمأن قلبه إلى أحد الأمرين فعل ذلك.',
              tr: 'Evet, müstehaptır. Şeyh İbn Baz, namazdan sonra hayır ehli ve samimi nasihatçilerle istişare etmenin müstehap olduğunu, kalp iki işten birine yatışınca onu yapacağını söyler.',
            },
            ref: { az: 'İbn Baz, fətva 15204', en: 'Ibn Baz, fatwa 15204', ru: 'Ибн Баз, фетва 15204', ar: 'ابن باز، فتوى 15204', tr: 'İbn Baz, fetva 15204' },
            url: 'https://binbaz.org.sa/fatwas/15204/%D8%AD%D9%83%D9%85-%D8%B5%D9%84%D8%A7%D8%A9-%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%AE%D8%A7%D8%B1%D8%A9-%D9%88%D9%83%D9%8A%D9%81%D9%8A%D8%AA%D9%87%D8%A7',
          },
        ] },
      ],
    },
  ],
  sources: [
    { label: 'Səhih əl-Buxari, Kitab ət-Təhəccüd və Kitab əd-Dəavat — İmam əl-Buxari' },
    { label: 'Fəthul-Bari — İbn Həcər əl-Əsqəlani' },
    { label: 'İslamQA 2217 — Sifətu salat əl-istixarə', url: 'https://islamqa.info/ar/answers/2217' },
    { label: 'İslamQA 11981 — Istikharah prayer', url: 'https://islamqa.info/en/answers/11981' },
    { label: 'İslamQA 164728 — Mətə yəkunu-d-dua fi salat əl-istixarə', url: 'https://islamqa.info/ar/answers/164728' },
    { label: 'İslamQA 109105 — Təriqə mubtədəə li-tələbi-r-ru’ya bə‘də-l-istixarə', url: 'https://islamqa.info/ar/answers/109105' },
    { label: 'İslamQA 72255 — Salat əl-istixarədən düzgün faydalanmaq', url: 'https://islamqa.info/ar/answers/72255' },
    { label: 'İbn Baz — Hökmu salat əl-istixarə və keyfiyyətuha (15204)', url: 'https://binbaz.org.sa/fatwas/15204/%D8%AD%D9%83%D9%85-%D8%B5%D9%84%D8%A7%D8%A9-%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%AE%D8%A7%D8%B1%D8%A9-%D9%88%D9%83%D9%8A%D9%81%D9%8A%D8%AA%D9%87%D8%A7' },
    { label: 'İbn Baz — Dua salamdan əvvəl, yoxsa sonra? (25310)', url: 'https://binbaz.org.sa/fatwas/25310/%D9%87%D9%84-%D9%8A%D9%83%D9%88%D9%86-%D8%AF%D8%B9%D8%A7%D8%A1-%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%AE%D8%A7%D8%B1%D8%A9-%D9%82%D8%A8%D9%84-%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85-%D8%A7%D9%85-%D8%A8%D8%B9%D8%AF%D9%87' },
  ],
}
