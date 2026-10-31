// The Four Principles (al-Qawa‘id al-Arba‘) — /learn/al-qawaid-al-arba
// Format: src/data/lessons/README.md. Quran text: api.quran.com (Uthmani), hadith numbers checked against fawazahmed0/hadith-api.

export const meta = {
  slug: 'al-qawaid-al-arba',
  cat: 'aqidah',
  order: 20,
  icon: 'list',
  arTitle: 'القواعد الأربع',
  title: {
    az: 'Dörd qayda (əl-Qəvaid əl-Ərbə)',
    en: 'The Four Principles (al-Qawa‘id al-Arba‘)',
    ru: 'Четыре правила (аль-Каваид аль-арба)',
    ar: 'القواعد الأربع',
    tr: 'Dört Kaide (el-Kavâidü’l-Erba‘)',
  },
  summary: {
    az: 'Şeyx Muhəmməd ibn Abdülvəhhabın şirki tövhiddən ayırmağı öyrədən qısa risaləsinin tam tərcüməsi — dəlilləri və izahı ilə.',
    en: 'A full translation of Shaykh Muhammad ibn Abd al-Wahhab’s short treatise on telling shirk apart from tawhid — with its evidence and explanation.',
    ru: 'Полный перевод краткого трактата шейха Мухаммада ибн Абд аль-Ваххаба о том, как отличить ширк от таухида, — с доводами и пояснением.',
    ar: 'ترجمة كاملة لرسالة الشيخ محمد بن عبد الوهاب في التمييز بين التوحيد والشرك، بأدلتها مع شرح مختصر لمعانيها.',
    tr: 'Şeyh Muhammed b. Abdulvehhâb’ın şirki tevhitten ayırmayı öğreten kısa risalesinin tam tercümesi — delilleri ve açıklamasıyla.',
  },
  author: {
    az: 'Şeyx Muhəmməd ibn Abdülvəhhab',
    en: 'Shaykh Muhammad ibn Abd al-Wahhab',
    ru: 'Шейх Мухаммад ибн Абд аль-Ваххаб',
    ar: 'الشيخ محمد بن عبد الوهاب',
    tr: 'Şeyh Muhammed b. Abdulvehhâb',
  },
  minutes: 14,
}

export default {
  sections: [
    {
      id: 'about',
      title: {
        az: 'Risalə haqqında',
        en: 'About the treatise',
        ru: 'О трактате',
        ar: 'عن الرسالة',
        tr: 'Risale hakkında',
      },
      blocks: [
        {
          t: 'p',
          text: {
            az: '«Dörd qayda» Şeyx Muhəmməd ibn Abdülvəhhabın (v. 1206 h.) ən qısa, lakin ən faydalı risalələrindən biridir. O, Quran ayələrinə əsaslanaraq müşriklərin şübhələrini aydınlaşdırır və ibadətin yalnız Allaha aid olduğunu göstərir.',
            en: '“The Four Principles” is one of the shortest yet most beneficial treatises of Shaykh Muhammad ibn Abd al-Wahhab (d. 1206 AH). Built on verses of the Quran, it clears up the doubts of the polytheists and shows that worship belongs to Allah alone.',
            ru: '«Четыре правила» — один из самых кратких, но самых полезных трактатов шейха Мухаммада ибн Абд аль-Ваххаба (ум. в 1206 г. х.). Опираясь на аяты Корана, он разъясняет сомнения многобожников и показывает, что поклонение принадлежит одному Аллаху.',
            ar: 'القواعد الأربع من أقصر رسائل الشيخ محمد بن عبد الوهاب (ت 1206هـ) وأنفعها، بناها على آيات القرآن، فكشف بها شبهات المشركين، وبيّن أن العبادة حق لله وحده.',
            tr: '“Dört Kaide”, Şeyh Muhammed b. Abdulvehhâb’ın (ö. 1206 h.) en kısa fakat en faydalı risalelerinden biridir. Kur’an ayetlerine dayanarak müşriklerin şüphelerini giderir ve ibadetin yalnızca Allah’a ait olduğunu gösterir.',
          },
        },
        {
          t: 'p',
          text: {
            az: 'Aşağıda risalənin tam mətni ardıcıllıqla tərcümə olunub; ərəbcə orijinal «ar» dilində verilir. Yaşıl «İzah» qeydləri risalənin mətni deyil — Sələf alimlərinin (İbn Useymin, Saleh əl-Fəvzan və b.) şərhlərindən götürülmüş qısa açıqlamalardır.',
            en: 'Below, the full text of the treatise is translated in order; the Arabic original is shown in the Arabic version. The “Explanation” notes are not part of the treatise — they are short clarifications drawn from the commentaries of Salafi scholars (Ibn Uthaymin, Salih al-Fawzan and others).',
            ru: 'Ниже полный текст трактата переведён по порядку; арабский оригинал приведён в арабской версии. Заметки «Пояснение» не входят в текст трактата — это краткие разъяснения из комментариев учёных саляфа (Ибн Усаймин, Салих аль-Фаузан и другие).',
            ar: 'فيما يلي نص الرسالة كاملًا بترتيبه. وما عُنون بـ«شرح» فليس من كلام المؤلف، وإنما هو توضيح مختصر مستفاد من شروح علماء السنة كابن عثيمين وصالح الفوزان وغيرهما.',
            tr: 'Aşağıda risalenin tam metni sırasıyla tercüme edilmiştir; Arapça asıl metin Arapça sürümde yer alır. “Açıklama” notları risalenin metni değildir — Selef âlimlerinin (İbn Useymîn, Salih el-Fevzân ve diğerleri) şerhlerinden alınmış kısa izahlardır.',
          },
        },
      ],
    },
    {
      id: 'opening',
      title: {
        az: 'Giriş: ibadət yalnız tövhidlə ibadətdir',
        en: 'Opening: worship is only worship with tawhid',
        ru: 'Вступление: поклонение — только с таухидом',
        ar: 'المقدمة: لا تسمى العبادة عبادة إلا مع التوحيد',
        tr: 'Giriş: ibadet ancak tevhitle ibadettir',
      },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Ərşin Rəbbi olan Kərim Allahdan diləyirəm ki, dünyada və axirətdə sənə dost (vəli) olsun, harada olsan səni mübarək etsin, səni elələrindən etsin ki, ona nemət verildikdə şükür edər, sınağa çəkildikdə səbir edər, günah etdikdə bağışlanma diləyər. Çünki bu üç şey səadətin nişanəsidir.',
            en: 'I ask Allah, the Most Generous, Lord of the Mighty Throne, to take you under His care in this world and the Hereafter, to make you blessed wherever you are, and to make you of those who, when given, are grateful; when tested, are patient; and when they sin, seek forgiveness — for these three are the sign of happiness.',
            ru: 'Прошу Аллаха Щедрого, Господа великого Трона, чтобы Он оказал тебе покровительство в этом мире и в вечном, сделал тебя благословенным, где бы ты ни был, и сделал тебя одним из тех, кто, получив, благодарит; будучи испытан, терпит; а согрешив, просит прощения. Ведь эти три качества — признак счастья.',
            ar: 'أسأل الله الكريم رب العرش العظيم أن يتولاك في الدنيا والآخرة، وأن يجعلك مباركًا أينما كنت، وأن يجعلك ممن إذا أُعطي شكر، وإذا ابتُلي صبر، وإذا أذنب استغفر؛ فإن هؤلاء الثلاث عنوان السعادة.',
            tr: 'Büyük Arş’ın Rabbi olan Kerîm Allah’tan dilerim ki dünyada ve ahirette seni dost edinsin, nerede olursan ol seni mübarek kılsın, seni kendisine verildiğinde şükreden, sınandığında sabreden, günah işlediğinde bağışlanma dileyenlerden eylesin. Çünkü bu üç şey mutluluğun alametidir.',
          },
        },
        {
          t: 'p',
          text: {
            az: 'Bil — Allah səni Ona itaətə yönəltsin — ki, hənifiyyə, yəni İbrahimin milləti, dini Allaha xalis edərək yalnız Ona ibadət etməkdir. Necə ki Uca Allah buyurur:',
            en: 'Know — may Allah guide you to His obedience — that the Hanifiyyah, the religion of Ibrahim, is to worship Allah alone, making the religion sincerely His, as Allah the Exalted said:',
            ru: 'Знай — да направит тебя Аллах к покорности Ему, — что ханифийя, религия Ибрахима, — это поклоняться одному Аллаху, очищая для Него религию, как сказал Всевышний Аллах:',
            ar: 'اعلم أرشدك الله لطاعته أن الحنيفية ملة إبراهيم: أن تعبد الله وحده مخلصًا له الدين، كما قال تعالى:',
            tr: 'Bil ki — Allah seni kendisine itaate yöneltsin — hanîflik, yani İbrahim’in dini, dini yalnızca O’na halis kılarak tek olan Allah’a ibadet etmektir. Nitekim Yüce Allah şöyle buyurur:',
          },
        },
        {
          t: 'ayah',
          ar: 'وَمَا خَلَقْتُ ٱلْجِنَّ وَٱلْإِنسَ إِلَّا لِيَعْبُدُونِ',
          text: {
            az: 'Mən cinləri və insanları yalnız Mənə ibadət etsinlər deyə yaratdım.',
            en: 'I did not create the jinn and mankind except to worship Me.',
            ru: 'Я сотворил джиннов и людей только для того, чтобы они поклонялись Мне.',
            ar: 'وَمَا خَلَقْتُ ٱلْجِنَّ وَٱلْإِنسَ إِلَّا لِيَعْبُدُونِ',
            tr: 'Ben cinleri ve insanları ancak bana ibadet etsinler diye yarattım.',
          },
          ref: '51:56',
        },
        {
          t: 'p',
          text: {
            az: 'Əgər Allahın səni Ona ibadət üçün yaratdığını bildinsə, bil ki, ibadət yalnız tövhidlə birlikdə olduqda ibadət adlanır — necə ki namaz yalnız təharətlə birlikdə olduqda namaz adlanır. Şirk ibadətə qarışdıqda onu pozur, eynilə hədəs (dəstəmazı pozan şey) təharətə daxil olduqda onu pozduğu kimi. Necə ki Uca Allah buyurur:',
            en: 'Once you know that Allah created you to worship Him, then know that worship is not called worship unless it is accompanied by tawhid, just as prayer is not called prayer unless it is accompanied by purification. When shirk enters worship it corrupts it, just as ritual impurity corrupts purification when it occurs. As Allah the Exalted said:',
            ru: 'Если ты узнал, что Аллах сотворил тебя для поклонения Ему, то знай, что поклонение называется поклонением только вместе с таухидом, так же как намаз называется намазом только вместе с очищением. Если в поклонение проникает ширк, он портит его, как осквернение портит очищение. Как сказал Всевышний Аллах:',
            ar: 'فإذا عرفت أن الله خلقك لعبادته، فاعلم أن العبادة لا تسمى عبادة إلا مع التوحيد، كما أن الصلاة لا تسمى صلاة إلا مع الطهارة، فإذا دخل الشرك في العبادة فسدت، كالحدث إذا دخل في الطهارة، كما قال تعالى:',
            tr: 'Allah’ın seni kendisine ibadet için yarattığını öğrendiysen bil ki ibadet, ancak tevhitle birlikte olursa ibadet adını alır; tıpkı namazın ancak abdestle birlikte namaz adını alması gibi. Şirk ibadete karıştığında onu bozar; abdestsizliğin taharete girip onu bozması gibi. Nitekim Yüce Allah şöyle buyurur:',
          },
        },
        {
          t: 'ayah',
          ar: 'مَا كَانَ لِلْمُشْرِكِينَ أَن يَعْمُرُوا۟ مَسَـٰجِدَ ٱللَّهِ شَـٰهِدِينَ عَلَىٰٓ أَنفُسِهِم بِٱلْكُفْرِ ۚ أُو۟لَـٰٓئِكَ حَبِطَتْ أَعْمَـٰلُهُمْ وَفِى ٱلنَّارِ هُمْ خَـٰلِدُونَ',
          text: {
            az: 'Müşriklər öz küfrlərinə özləri şahidlik edə-edə Allahın məscidlərini abad etməyə haqları yoxdur. Onların əməlləri puç olmuşdur və onlar odda əbədi qalacaqlar.',
            en: 'It is not for the polytheists to maintain the mosques of Allah while bearing witness against themselves of disbelief. Those — their deeds have become worthless, and in the Fire they will abide eternally.',
            ru: 'Не подобает многобожникам заботиться о мечетях Аллаха, свидетельствуя против самих себя о неверии. Тщетны их деяния, и в Огне им пребывать вечно.',
            ar: 'مَا كَانَ لِلْمُشْرِكِينَ أَن يَعْمُرُوا۟ مَسَـٰجِدَ ٱللَّهِ شَـٰهِدِينَ عَلَىٰٓ أَنفُسِهِم بِٱلْكُفْرِ ۚ أُو۟لَـٰٓئِكَ حَبِطَتْ أَعْمَـٰلُهُمْ وَفِى ٱلنَّارِ هُمْ خَـٰلِدُونَ',
            tr: 'Müşriklerin, kendi inkârlarına kendileri şahitlik ederken Allah’ın mescitlerini imar etmeleri olacak şey değildir. Onların amelleri boşa gitmiştir ve onlar ateşte ebedî kalacaklardır.',
          },
          ref: '9:17',
        },
        {
          t: 'p',
          text: {
            az: 'Əgər bildinsə ki, şirk ibadətə qarışdıqda onu pozur, əməli puç edir və onun sahibi Cəhənnəmdə əbədi qalanlardan olur, onda anlayarsan ki, sənin üçün ən vacib iş bunu bilməkdir. Bəlkə Allah səni bu tordan — Allaha şirk qoşmaqdan — xilas edər. Uca Allah onun haqqında buyurub:',
            en: 'Once you know that shirk, when it mixes with worship, corrupts it, nullifies the deed, and makes its doer one of those who abide forever in the Fire, you will know that the most important thing for you is to know this — perhaps Allah will free you from this net, which is associating partners with Allah, about which Allah the Exalted said:',
            ru: 'Если ты узнал, что ширк, смешавшись с поклонением, портит его, сводит на нет деяние и делает совершившего его одним из вечно пребывающих в Огне, то поймёшь, что важнее всего для тебя — знать это. Быть может, Аллах избавит тебя от этой сети — придавания Аллаху сотоварищей, — о которой Всевышний Аллах сказал:',
            ar: 'فإذا عرفت أن الشرك إذا خالط العبادة أفسدها، وأحبط العمل، وصار صاحبه من الخالدين في النار، عرفت أن أهم ما عليك معرفة ذلك، لعل الله أن يخلصك من هذه الشبكة، وهي الشرك بالله، الذي قال الله تعالى فيه:',
            tr: 'Şirkin ibadete karıştığında onu bozduğunu, ameli boşa çıkardığını ve sahibini cehennemde ebedî kalanlardan yaptığını öğrendiysen, senin için en önemli şeyin bunu bilmek olduğunu anlarsın. Umulur ki Allah seni bu ağdan, yani Allah’a şirk koşmaktan kurtarır. Yüce Allah onun hakkında şöyle buyurur:',
          },
        },
        {
          t: 'ayah',
          ar: 'إِنَّ ٱللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِۦ وَيَغْفِرُ مَا دُونَ ذَٰلِكَ لِمَن يَشَآءُ ۚ وَمَن يُشْرِكْ بِٱللَّهِ فَقَدِ ٱفْتَرَىٰٓ إِثْمًا عَظِيمًا',
          text: {
            az: 'Həqiqətən, Allah Ona şərik qoşulmasını bağışlamaz, bundan başqasını isə istədiyi kəs üçün bağışlayar.',
            en: 'Indeed, Allah does not forgive that partners be associated with Him, but He forgives what is less than that for whom He wills.',
            ru: 'Воистину, Аллах не прощает, когда к Нему приобщают сотоварищей, но прощает всё, что меньше этого, кому пожелает.',
            ar: 'إِنَّ ٱللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِۦ وَيَغْفِرُ مَا دُونَ ذَٰلِكَ لِمَن يَشَآءُ ۚ وَمَن يُشْرِكْ بِٱللَّهِ فَقَدِ ٱفْتَرَىٰٓ إِثْمًا عَظِيمًا',
            tr: 'Şüphesiz Allah kendisine şirk koşulmasını bağışlamaz; bundan başkasını dilediği kimse için bağışlar.',
          },
          ref: '4:48',
        },
        {
          t: 'p',
          text: {
            az: 'Bu isə Allahın Öz Kitabında zikr etdiyi dörd qaydanı bilməklə olur.',
            en: 'And that is by knowing four principles that Allah the Exalted mentioned in His Book.',
            ru: 'А это достигается знанием четырёх правил, которые Всевышний Аллах упомянул в Своей Книге.',
            ar: 'وذلك بمعرفة أربع قواعد ذكرها الله تعالى في كتابه.',
            tr: 'Bu da Yüce Allah’ın Kitabında zikrettiği dört kaideyi bilmekle olur.',
          },
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Şeyxin duası risalənin ruhunu göstərir: tələbəyə mərhəmətlə yanaşmaq. Şükür, səbir və istiğfar bəndənin üç halına uyğundur — nemət, müsibət və günah. Bənzətmə də aydındır: hədəs təharəti pozduğu kimi, şirk də ibadəti pozur; böyük şirk isə bütün əməlləri puç edir.',
            en: 'Explanation: The Shaykh’s supplication shows the spirit of the treatise: compassion toward the student. Gratitude, patience and seeking forgiveness match the three states of a servant — blessing, trial and sin. The comparison is clear: as impurity voids purification, shirk voids worship, and major shirk nullifies all deeds.',
            ru: 'Пояснение: Мольба шейха показывает дух трактата — милосердие к ученику. Благодарность, терпение и покаяние соответствуют трём состояниям раба: милости, испытанию и греху. Сравнение ясно: как осквернение нарушает очищение, так ширк портит поклонение, а большой ширк сводит на нет все деяния.',
            ar: 'شرح: دعاء الشيخ في أول الرسالة يبيّن روحها: الرفق بالمتعلم. والشكر والصبر والاستغفار تقابل أحوال العبد الثلاثة: النعمة والمصيبة والذنب. والتشبيه واضح: كما يُبطل الحدثُ الطهارة يُفسد الشركُ العبادة، والشرك الأكبر يحبط الأعمال كلها.',
            tr: 'Açıklama: Şeyhin duası risalenin ruhunu gösterir: öğrenciye şefkat. Şükür, sabır ve istiğfar kulun üç hâline karşılık gelir: nimet, musibet ve günah. Benzetme de açıktır: hades tahareti bozduğu gibi şirk de ibadeti bozar; büyük şirk ise bütün amelleri boşa çıkarır.',
          },
        },
      ],
    },
    {
      id: 'rule-1',
      title: {
        az: 'Birinci qayda',
        en: 'The first principle',
        ru: 'Первое правило',
        ar: 'القاعدة الأولى',
        tr: 'Birinci kaide',
      },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Bilməlisən ki, Allahın Elçisinin ﷺ vuruşduğu kafirlər Uca Allahın Yaradan və işləri idarə edən olduğunu etiraf edirdilər, lakin bu etiraf onları İslama daxil etmədi. Dəlil Uca Allahın bu sözüdür:',
            en: 'That you know that the disbelievers whom the Messenger of Allah ﷺ fought affirmed that Allah the Exalted is the Creator and the Disposer of affairs, yet that did not enter them into Islam. The evidence is the saying of Allah the Exalted:',
            ru: 'Знай, что неверные, с которыми сражался Посланник Аллаха ﷺ, признавали, что Всевышний Аллах — Творец и Распорядитель дел, однако это не ввело их в ислам. Довод — слова Всевышнего Аллаха:',
            ar: 'القاعدة الأولى: أن تعلم أن الكفار الذين قاتلهم رسول الله ﷺ مقرّون بأن الله تعالى هو الخالق المدبر، وأن ذلك لم يُدخلهم في الإسلام، والدليل قوله تعالى:',
            tr: 'Bilmelisin ki Allah’ın Resûlü’nün ﷺ savaştığı kâfirler, Yüce Allah’ın yaratan ve işleri yöneten olduğunu kabul ediyorlardı; fakat bu, onları İslam’a sokmadı. Delil Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'قُلْ مَن يَرْزُقُكُم مِّنَ ٱلسَّمَآءِ وَٱلْأَرْضِ أَمَّن يَمْلِكُ ٱلسَّمْعَ وَٱلْأَبْصَـٰرَ وَمَن يُخْرِجُ ٱلْحَىَّ مِنَ ٱلْمَيِّتِ وَيُخْرِجُ ٱلْمَيِّتَ مِنَ ٱلْحَىِّ وَمَن يُدَبِّرُ ٱلْأَمْرَ ۚ فَسَيَقُولُونَ ٱللَّهُ ۚ فَقُلْ أَفَلَا تَتَّقُونَ',
          text: {
            az: 'De: «Sizə göydən və yerdən ruzi verən kimdir? Yaxud qulaqlara və gözlərə malik olan kimdir? Diridən ölünü, ölüdən diri çıxaran kimdir? İşləri idarə edən kimdir?» Onlar: «Allah», – deyəcəklər. De: «Bəs (Ondan) qorxmazsınızmı?»',
            en: 'Say: “Who provides for you from the heaven and the earth? Or who owns hearing and sight? And who brings the living out of the dead and brings the dead out of the living? And who arranges every matter?” They will say: “Allah.” So say: “Will you not then fear Him?”',
            ru: 'Скажи: «Кто наделяет вас уделом с неба и земли? Кто владеет слухом и зрением? Кто выводит живое из мёртвого и мёртвое из живого? Кто управляет делами?» Они скажут: «Аллах». Скажи: «Неужели вы не побоитесь Его?»',
            ar: 'قُلْ مَن يَرْزُقُكُم مِّنَ ٱلسَّمَآءِ وَٱلْأَرْضِ أَمَّن يَمْلِكُ ٱلسَّمْعَ وَٱلْأَبْصَـٰرَ وَمَن يُخْرِجُ ٱلْحَىَّ مِنَ ٱلْمَيِّتِ وَيُخْرِجُ ٱلْمَيِّتَ مِنَ ٱلْحَىِّ وَمَن يُدَبِّرُ ٱلْأَمْرَ ۚ فَسَيَقُولُونَ ٱللَّهُ ۚ فَقُلْ أَفَلَا تَتَّقُونَ',
            tr: 'De ki: “Size gökten ve yerden kim rızık veriyor? Kulaklara ve gözlere kim sahip? Ölüden diriyi kim çıkarıyor, diriden ölüyü kim çıkarıyor? İşleri kim yönetiyor?” “Allah” diyecekler. De ki: “O hâlde O’ndan sakınmaz mısınız?”',
          },
          ref: '10:31',
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Allahın Rəbb, Yaradan və Ruzi verən olduğunu etiraf etmək (rububiyyət tövhidi) vacibdir, amma kifayət deyil. İnsanı müsəlman edən — ibadəti yalnız Allaha yönəltməkdir (uluhiyyət tövhidi). Peyğəmbərlərin dəvətinin əsas mövzusu da məhz budur.',
            en: 'Explanation: Affirming that Allah is the Lord, Creator and Provider (tawhid ar-rububiyyah) is obligatory but not sufficient. What makes a person Muslim is directing worship to Allah alone (tawhid al-uluhiyyah) — and that was the central call of all the prophets.',
            ru: 'Пояснение: Признание того, что Аллах — Господь, Творец и Дарующий удел (таухид ар-рубубийя), обязательно, но недостаточно. Мусульманином человека делает обращение поклонения только к Аллаху (таухид аль-улюхийя) — именно к этому призывали все пророки.',
            ar: 'شرح: الإقرار بأن الله هو الرب الخالق الرازق (توحيد الربوبية) واجب لكنه لا يكفي، وإنما يدخل العبد في الإسلام بإفراد الله بالعبادة (توحيد الألوهية)، وهو الذي دعت إليه الرسل كلهم.',
            tr: 'Açıklama: Allah’ın Rab, Yaratıcı ve Rızık Veren olduğunu kabul etmek (rubûbiyet tevhidi) farzdır ama yeterli değildir. İnsanı Müslüman yapan, ibadeti yalnızca Allah’a yöneltmektir (ulûhiyet tevhidi). Bütün peygamberlerin davetinin özü de budur.',
          },
        },
      ],
    },
    {
      id: 'rule-2',
      title: {
        az: 'İkinci qayda',
        en: 'The second principle',
        ru: 'Второе правило',
        ar: 'القاعدة الثانية',
        tr: 'İkinci kaide',
      },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Onlar deyirlər: «Biz onlara yalnız yaxınlıq və şəfaət diləmək üçün dua edir və üz tuturuq». Yaxınlığın dəlili Uca Allahın bu sözüdür:',
            en: 'They say: “We only call upon them and turn to them seeking nearness and intercession.” The evidence for nearness is the saying of Allah the Exalted:',
            ru: 'Они говорят: «Мы взываем к ним и обращаемся к ним лишь ради приближения и заступничества». Довод о приближении — слова Всевышнего Аллаха:',
            ar: 'القاعدة الثانية: أنهم يقولون: ما دعوناهم وتوجهنا إليهم إلا لطلب القربة والشفاعة. فدليل القربة قوله تعالى:',
            tr: 'Onlar şöyle derler: “Biz onlara ancak yakınlık ve şefaat istemek için dua eder ve yöneliriz.” Yakınlığın delili Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'وَٱلَّذِينَ ٱتَّخَذُوا۟ مِن دُونِهِۦٓ أَوْلِيَآءَ مَا نَعْبُدُهُمْ إِلَّا لِيُقَرِّبُونَآ إِلَى ٱللَّهِ زُلْفَىٰٓ إِنَّ ٱللَّهَ يَحْكُمُ بَيْنَهُمْ فِى مَا هُمْ فِيهِ يَخْتَلِفُونَ ۗ إِنَّ ٱللَّهَ لَا يَهْدِى مَنْ هُوَ كَـٰذِبٌ كَفَّارٌ',
          text: {
            az: 'Ondan başqa övliyalar qəbul edənlər (deyirlər): «Biz onlara ancaq bizi Allaha daha çox yaxınlaşdırsınlar deyə ibadət edirik». Şübhəsiz ki, Allah ixtilafa düşdükləri şey barədə onların arasında hökm verəcək. Allah yalançı, nankor kimsəni doğru yola yönəltməz.',
            en: 'And those who take protectors besides Him [say]: “We only worship them so that they may bring us nearer to Allah.” Indeed, Allah will judge between them concerning that over which they differ. Indeed, Allah does not guide one who is a liar and a disbeliever.',
            ru: 'А те, которые взяли покровителей помимо Него, (говорят): «Мы поклоняемся им только для того, чтобы они приблизили нас к Аллаху». Воистину, Аллах рассудит между ними в том, в чём они расходились. Воистину, Аллах не ведёт прямым путём лжеца и неверного.',
            ar: 'وَٱلَّذِينَ ٱتَّخَذُوا۟ مِن دُونِهِۦٓ أَوْلِيَآءَ مَا نَعْبُدُهُمْ إِلَّا لِيُقَرِّبُونَآ إِلَى ٱللَّهِ زُلْفَىٰٓ إِنَّ ٱللَّهَ يَحْكُمُ بَيْنَهُمْ فِى مَا هُمْ فِيهِ يَخْتَلِفُونَ ۗ إِنَّ ٱللَّهَ لَا يَهْدِى مَنْ هُوَ كَـٰذِبٌ كَفَّارٌ',
            tr: 'O’nu bırakıp başka dostlar edinenler: “Biz onlara, sırf bizi Allah’a daha çok yaklaştırsınlar diye ibadet ediyoruz” derler. Şüphesiz Allah, ayrılığa düştükleri şey hakkında aralarında hüküm verecektir. Allah yalancı ve nankör olanı doğru yola iletmez.',
          },
          ref: '39:3',
        },
        {
          t: 'p',
          text: {
            az: 'Şəfaətin dəlili Uca Allahın bu sözüdür:',
            en: 'The evidence for intercession is the saying of Allah the Exalted:',
            ru: 'Довод о заступничестве — слова Всевышнего Аллаха:',
            ar: 'ودليل الشفاعة قوله تعالى:',
            tr: 'Şefaatin delili Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'وَيَعْبُدُونَ مِن دُونِ ٱللَّهِ مَا لَا يَضُرُّهُمْ وَلَا يَنفَعُهُمْ وَيَقُولُونَ هَـٰٓؤُلَآءِ شُفَعَـٰٓؤُنَا عِندَ ٱللَّهِ',
          text: {
            az: 'Onlar Allahı qoyub onlara nə zərər, nə də fayda verə bilən şeylərə ibadət edir və: «Bunlar Allah yanında bizim şəfaətçilərimizdir», – deyirlər.',
            en: 'And they worship besides Allah that which neither harms them nor benefits them, and they say: “These are our intercessors with Allah.”',
            ru: 'Они поклоняются помимо Аллаха тому, что не вредит им и не приносит пользы, и говорят: «Это — наши заступники перед Аллахом».',
            ar: 'وَيَعْبُدُونَ مِن دُونِ ٱللَّهِ مَا لَا يَضُرُّهُمْ وَلَا يَنفَعُهُمْ وَيَقُولُونَ هَـٰٓؤُلَآءِ شُفَعَـٰٓؤُنَا عِندَ ٱللَّهِ',
            tr: 'Allah’ı bırakıp kendilerine ne zarar ne de fayda veremeyen şeylere ibadet ediyorlar ve: “Bunlar Allah katında bizim şefaatçilerimizdir” diyorlar.',
          },
          ref: '10:18',
        },
        {
          t: 'p',
          text: {
            az: 'Şəfaət iki cürdür: rədd edilən şəfaət və təsdiq edilən şəfaət. Rədd edilən şəfaət — yalnız Allahın gücü çatan bir şeydə Allahdan başqasından istənilən şəfaətdir. Dəlil Uca Allahın bu sözüdür:',
            en: 'Intercession is of two kinds: negated intercession and affirmed intercession. The negated intercession is that which is sought from other than Allah in what none but Allah is able to do. The evidence is the saying of Allah the Exalted:',
            ru: 'Заступничество бывает двух видов: отвергнутое и утверждённое. Отвергнутое — это то, которого просят не у Аллаха в том, что под силу только Аллаху. Довод — слова Всевышнего Аллаха:',
            ar: 'والشفاعة شفاعتان: شفاعة منفية، وشفاعة مثبتة. فالشفاعة المنفية: ما كانت تُطلب من غير الله فيما لا يقدر عليه إلا الله، والدليل قوله تعالى:',
            tr: 'Şefaat ikidir: reddedilen şefaat ve kabul edilen şefaat. Reddedilen şefaat, ancak Allah’ın gücünün yettiği bir şeyde Allah’tan başkasından istenen şefaattir. Delil Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟ أَنفِقُوا۟ مِمَّا رَزَقْنَـٰكُم مِّن قَبْلِ أَن يَأْتِىَ يَوْمٌ لَّا بَيْعٌ فِيهِ وَلَا خُلَّةٌ وَلَا شَفَـٰعَةٌ ۗ وَٱلْكَـٰفِرُونَ هُمُ ٱلظَّـٰلِمُونَ',
          text: {
            az: 'Ey iman gətirənlər! Nə alış-verişin, nə dostluğun, nə də şəfaətin olmadığı bir gün gəlməmişdən əvvəl sizə ruzi olaraq verdiklərimizdən xərcləyin. Kafirlər isə zalımların özləridir.',
            en: 'O you who have believed, spend from what We have provided for you before a Day comes in which there is no exchange, no friendship and no intercession. And the disbelievers — they are the wrongdoers.',
            ru: 'О те, которые уверовали! Расходуйте из того, чем Мы наделили вас, прежде чем наступит День, когда не будет ни торговли, ни дружбы, ни заступничества. А неверные — они и есть беззаконники.',
            ar: 'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟ أَنفِقُوا۟ مِمَّا رَزَقْنَـٰكُم مِّن قَبْلِ أَن يَأْتِىَ يَوْمٌ لَّا بَيْعٌ فِيهِ وَلَا خُلَّةٌ وَلَا شَفَـٰعَةٌ ۗ وَٱلْكَـٰفِرُونَ هُمُ ٱلظَّـٰلِمُونَ',
            tr: 'Ey iman edenler! Ne alışverişin, ne dostluğun, ne de şefaatin olmadığı gün gelmeden önce size verdiğimiz rızıktan infak edin. Kâfirler ise zalimlerin ta kendileridir.',
          },
          ref: '2:254',
        },
        {
          t: 'p',
          text: {
            az: 'Təsdiq edilən şəfaət isə Allahdan istənilən şəfaətdir. Şəfaət edən şəfaətlə ikram olunmuş kəsdir, şəfaət olunan isə — izn verildikdən sonra — Allahın sözündən və əməlindən razı qaldığı kəsdir. Necə ki Uca Allah buyurur:',
            en: 'The affirmed intercession is that which is sought from Allah. The intercessor is honoured with intercession, and the one interceded for is the one whose words and deeds Allah is pleased with — after permission. As Allah the Exalted said:',
            ru: 'Утверждённое заступничество — то, которого просят у Аллаха. Заступник удостоен заступничества, а тот, за кого заступаются, — тот, чьими словами и делами Аллах доволен, — после дозволения. Как сказал Всевышний Аллах:',
            ar: 'والشفاعة المثبتة: هي التي تُطلب من الله، والشافع مُكرَم بالشفاعة، والمشفوع له من رضي الله قوله وعمله، بعد الإذن، كما قال تعالى:',
            tr: 'Kabul edilen şefaat ise Allah’tan istenen şefaattir. Şefaat eden, şefaatle ikram edilmiş kimsedir; şefaat edilen ise — izin verildikten sonra — Allah’ın sözünden ve amelinden razı olduğu kimsedir. Nitekim Yüce Allah şöyle buyurur:',
          },
        },
        {
          t: 'ayah',
          ar: 'مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ',
          text: {
            az: 'Onun izni olmadan Onun yanında kim şəfaət edə bilər?',
            en: 'Who is it that can intercede with Him except by His permission?',
            ru: 'Кто станет заступаться перед Ним без Его позволения?',
            ar: 'مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ',
            tr: 'O’nun izni olmadan katında kim şefaat edebilir?',
          },
          ref: '2:255',
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Şəfaətin iki şərti Quranda birlikdə gəlir: Allahın şəfaətçiyə izn verməsi və şəfaət olunandan razı olması (Nəcm 53:26). Ona görə şəfaəti ölülərdən və ya qeybdəkilərdən deyil, Allahdan istəyirik: «Allahım, Peyğəmbərini mənə şəfaətçi et».',
            en: 'Explanation: The two conditions of intercession come together in the Quran: Allah’s permission to the intercessor and His being pleased with the one interceded for (an-Najm 53:26). That is why intercession is asked of Allah — not of the dead or the absent: “O Allah, make Your Prophet an intercessor for me.”',
            ru: 'Пояснение: Два условия заступничества упомянуты в Коране вместе: дозволение Аллаха заступнику и Его довольство тем, за кого заступаются (ан-Наджм 53:26). Поэтому заступничества просят у Аллаха, а не у умерших или отсутствующих: «О Аллах, сделай Своего Пророка моим заступником».',
            ar: 'شرح: شرطا الشفاعة جاءا معًا في القرآن: إذن الله للشافع، ورضاه عن المشفوع له (النجم: 26). ولهذا تُطلب الشفاعة من الله لا من الأموات ولا من الغائبين، فيقول العبد: اللهم شفّع فيّ نبيك.',
            tr: 'Açıklama: Şefaatin iki şartı Kur’an’da birlikte gelir: Allah’ın şefaatçiye izin vermesi ve şefaat edilenden razı olması (Necm 53:26). Bu yüzden şefaat ölülerden ya da gaipteki kimselerden değil, Allah’tan istenir: “Allah’ım, Peygamberini bana şefaatçi kıl.”',
          },
        },
        {
          t: 'ayah',
          ar: 'وَكَم مِّن مَّلَكٍ فِى ٱلسَّمَـٰوَٰتِ لَا تُغْنِى شَفَـٰعَتُهُمْ شَيْـًٔا إِلَّا مِنۢ بَعْدِ أَن يَأْذَنَ ٱللَّهُ لِمَن يَشَآءُ وَيَرْضَىٰٓ',
          text: {
            az: 'Göylərdə nə qədər mələk var ki, onların şəfaəti heç bir fayda verməz — yalnız Allah dilədiyi və razı olduğu kəs üçün izn verdikdən sonra.',
            en: 'And how many an angel there is in the heavens whose intercession avails nothing except after Allah gives permission to whom He wills and approves.',
            ru: 'Сколько ангелов на небесах, чьё заступничество не поможет ничем, пока Аллах не позволит тому, кому пожелает и кем будет доволен.',
            ar: 'وَكَم مِّن مَّلَكٍ فِى ٱلسَّمَـٰوَٰتِ لَا تُغْنِى شَفَـٰعَتُهُمْ شَيْـًٔا إِلَّا مِنۢ بَعْدِ أَن يَأْذَنَ ٱللَّهُ لِمَن يَشَآءُ وَيَرْضَىٰٓ',
            tr: 'Göklerde nice melek vardır ki, Allah’ın dilediği ve razı olduğu kimseye izin vermesinden sonra olmadıkça onların şefaati hiçbir fayda vermez.',
          },
          ref: '53:26',
        },
      ],
    },
    {
      id: 'rule-3',
      title: {
        az: 'Üçüncü qayda',
        en: 'The third principle',
        ru: 'Третье правило',
        ar: 'القاعدة الثالثة',
        tr: 'Üçüncü kaide',
      },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Peyğəmbər ﷺ ibadətlərində bir-birindən fərqlənən insanların arasında zühur etdi: onların bəziləri mələklərə, bəziləri peyğəmbərlərə və salehlərə, bəziləri daşlara və ağaclara, bəziləri isə günəşə və aya ibadət edirdi. Allahın Elçisi ﷺ onların hamısı ilə vuruşdu və aralarında fərq qoymadı. Dəlil Uca Allahın bu sözüdür:',
            en: 'The Prophet ﷺ appeared among people who differed in their worship: some worshipped angels, some worshipped prophets and righteous people, some worshipped stones and trees, and some worshipped the sun and the moon. The Messenger of Allah ﷺ fought them and did not distinguish between them. The evidence is the saying of Allah the Exalted:',
            ru: 'Пророк ﷺ появился среди людей, различавшихся в поклонении: одни поклонялись ангелам, другие — пророкам и праведникам, третьи — камням и деревьям, четвёртые — солнцу и луне. Посланник Аллаха ﷺ сражался с ними и не делал между ними различия. Довод — слова Всевышнего Аллаха:',
            ar: 'القاعدة الثالثة: أن النبي ﷺ ظهر على أناس متفرقين في عباداتهم؛ منهم من يعبد الملائكة، ومنهم من يعبد الأنبياء والصالحين، ومنهم من يعبد الأحجار والأشجار، ومنهم من يعبد الشمس والقمر، وقاتلهم رسول الله ﷺ ولم يفرّق بينهم، والدليل قوله تعالى:',
            tr: 'Peygamber ﷺ ibadetlerinde birbirinden ayrılan insanlar arasında ortaya çıktı: kimi meleklere, kimi peygamberlere ve salihlere, kimi taşlara ve ağaçlara, kimi de güneşe ve aya ibadet ediyordu. Allah’ın Resûlü ﷺ hepsiyle savaştı ve aralarında ayrım yapmadı. Delil Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'وَقَـٰتِلُوهُمْ حَتَّىٰ لَا تَكُونَ فِتْنَةٌ وَيَكُونَ ٱلدِّينُ كُلُّهُۥ لِلَّهِ',
          text: {
            az: 'Fitnə qalmayana və din tamamilə Allaha məxsus olana qədər onlarla vuruşun.',
            en: 'And fight them until there is no more fitnah and the religion, all of it, is for Allah.',
            ru: 'Сражайтесь с ними, пока не исчезнет смута и религия целиком не будет принадлежать Аллаху.',
            ar: 'وَقَـٰتِلُوهُمْ حَتَّىٰ لَا تَكُونَ فِتْنَةٌ وَيَكُونَ ٱلدِّينُ كُلُّهُۥ لِلَّهِ',
            tr: 'Fitne kalmayıncaya ve din tamamen Allah’ın oluncaya kadar onlarla savaşın.',
          },
          ref: '8:39',
        },
        {
          t: 'p',
          text: {
            az: 'Günəş və ayın dəlili Uca Allahın bu sözüdür:',
            en: 'The evidence for the sun and the moon is the saying of Allah the Exalted:',
            ru: 'Довод о солнце и луне — слова Всевышнего Аллаха:',
            ar: 'ودليل الشمس والقمر قوله تعالى:',
            tr: 'Güneş ve ayın delili Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'وَمِنْ ءَايَـٰتِهِ ٱلَّيْلُ وَٱلنَّهَارُ وَٱلشَّمْسُ وَٱلْقَمَرُ ۚ لَا تَسْجُدُوا۟ لِلشَّمْسِ وَلَا لِلْقَمَرِ وَٱسْجُدُوا۟ لِلَّهِ ٱلَّذِى خَلَقَهُنَّ إِن كُنتُمْ إِيَّاهُ تَعْبُدُونَ',
          text: {
            az: 'Gecə və gündüz, günəş və ay Onun əlamətlərindəndir. Günəşə də, aya da səcdə etməyin; əgər yalnız Ona ibadət edirsinizsə, onları yaradan Allaha səcdə edin.',
            en: 'And of His signs are the night and the day and the sun and the moon. Do not prostrate to the sun or to the moon, but prostrate to Allah who created them, if it is truly Him you worship.',
            ru: 'Среди Его знамений — ночь и день, солнце и луна. Не падайте ниц ни перед солнцем, ни перед луной, а падайте ниц перед Аллахом, Который сотворил их, если вы поклоняетесь только Ему.',
            ar: 'وَمِنْ ءَايَـٰتِهِ ٱلَّيْلُ وَٱلنَّهَارُ وَٱلشَّمْسُ وَٱلْقَمَرُ ۚ لَا تَسْجُدُوا۟ لِلشَّمْسِ وَلَا لِلْقَمَرِ وَٱسْجُدُوا۟ لِلَّهِ ٱلَّذِى خَلَقَهُنَّ إِن كُنتُمْ إِيَّاهُ تَعْبُدُونَ',
            tr: 'Gece ve gündüz, güneş ve ay O’nun ayetlerindendir. Güneşe de aya da secde etmeyin; eğer yalnızca O’na ibadet ediyorsanız, onları yaratan Allah’a secde edin.',
          },
          ref: '41:37',
        },
        {
          t: 'p',
          text: {
            az: 'Mələklərin dəlili Uca Allahın bu sözüdür:',
            en: 'The evidence for the angels is the saying of Allah the Exalted:',
            ru: 'Довод об ангелах — слова Всевышнего Аллаха:',
            ar: 'ودليل الملائكة قوله تعالى:',
            tr: 'Meleklerin delili Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'وَلَا يَأْمُرَكُمْ أَن تَتَّخِذُوا۟ ٱلْمَلَـٰٓئِكَةَ وَٱلنَّبِيِّـۧنَ أَرْبَابًا',
          text: {
            az: 'O, sizə mələkləri və peyğəmbərləri rəbb qəbul etməyi də əmr etməz.',
            en: 'Nor would he command you to take the angels and the prophets as lords.',
            ru: 'И он не стал бы велеть вам считать ангелов и пророков господами.',
            ar: 'وَلَا يَأْمُرَكُمْ أَن تَتَّخِذُوا۟ ٱلْمَلَـٰٓئِكَةَ وَٱلنَّبِيِّـۧنَ أَرْبَابًا',
            tr: 'O, size melekleri ve peygamberleri rabler edinmenizi de emretmez.',
          },
          ref: '3:80',
        },
        {
          t: 'p',
          text: {
            az: 'Peyğəmbərlərin dəlili Uca Allahın bu sözüdür:',
            en: 'The evidence for the prophets is the saying of Allah the Exalted:',
            ru: 'Довод о пророках — слова Всевышнего Аллаха:',
            ar: 'ودليل الأنبياء قوله تعالى:',
            tr: 'Peygamberlerin delili Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'وَإِذْ قَالَ ٱللَّهُ يَـٰعِيسَى ٱبْنَ مَرْيَمَ ءَأَنتَ قُلْتَ لِلنَّاسِ ٱتَّخِذُونِى وَأُمِّىَ إِلَـٰهَيْنِ مِن دُونِ ٱللَّهِ ۖ قَالَ سُبْحَـٰنَكَ مَا يَكُونُ لِىٓ أَنْ أَقُولَ مَا لَيْسَ لِى بِحَقٍّ ۚ إِن كُنتُ قُلْتُهُۥ فَقَدْ عَلِمْتَهُۥ ۚ تَعْلَمُ مَا فِى نَفْسِى وَلَآ أَعْلَمُ مَا فِى نَفْسِكَ ۚ إِنَّكَ أَنتَ عَلَّـٰمُ ٱلْغُيُوبِ',
          text: {
            az: 'Allah buyuracaq: «Ey Məryəm oğlu İsa! Sən insanlara: “Allahı qoyub məni və anamı iki ilah qəbul edin”, – demişdinmi?» O deyəcək: «Sən paksan! Haqqım olmayan bir şeyi demək mənə yaraşmaz. Əgər demişəmsə, Sən onu bilirsən. Sən mənim nəfsimdə olanı bilirsən, mən isə Səndə olanı bilmirəm. Həqiqətən, qeybləri bilən Sənsən».',
            en: 'And when Allah will say: “O Jesus, son of Mary, did you say to the people: ‘Take me and my mother as gods besides Allah’?” He will say: “Glory be to You! It was not for me to say what I had no right to. If I had said it, You would have known it. You know what is within myself, and I do not know what is within Yourself. Indeed, it is You who is the Knower of the unseen.”',
            ru: 'Вот сказал Аллах: «О Иса, сын Марьям! Говорил ли ты людям: “Примите меня и мою мать двумя богами помимо Аллаха”?» Он сказал: «Пречист Ты! Не подобает мне говорить то, на что я не имею права. Если бы я сказал это, Ты бы знал. Ты знаешь то, что в моей душе, а я не знаю того, что у Тебя. Воистину, Ты — Знающий сокровенное».',
            ar: 'وَإِذْ قَالَ ٱللَّهُ يَـٰعِيسَى ٱبْنَ مَرْيَمَ ءَأَنتَ قُلْتَ لِلنَّاسِ ٱتَّخِذُونِى وَأُمِّىَ إِلَـٰهَيْنِ مِن دُونِ ٱللَّهِ ۖ قَالَ سُبْحَـٰنَكَ مَا يَكُونُ لِىٓ أَنْ أَقُولَ مَا لَيْسَ لِى بِحَقٍّ ۚ إِن كُنتُ قُلْتُهُۥ فَقَدْ عَلِمْتَهُۥ ۚ تَعْلَمُ مَا فِى نَفْسِى وَلَآ أَعْلَمُ مَا فِى نَفْسِكَ ۚ إِنَّكَ أَنتَ عَلَّـٰمُ ٱلْغُيُوبِ',
            tr: 'Allah şöyle diyecek: “Ey Meryem oğlu İsa! Sen mi insanlara: ‘Allah’ı bırakıp beni ve annemi iki ilah edinin’ dedin?” O: “Seni tenzih ederim! Hakkım olmayan bir şeyi söylemek bana yakışmaz. Eğer söyleseydim, Sen onu bilirdin. Sen bendekini bilirsin, ben Sendekini bilmem. Şüphesiz gaipleri hakkıyla bilen Sensin” diyecek.',
          },
          ref: '5:116',
        },
        {
          t: 'p',
          text: {
            az: 'Salehlərin dəlili Uca Allahın bu sözüdür:',
            en: 'The evidence for the righteous is the saying of Allah the Exalted:',
            ru: 'Довод о праведниках — слова Всевышнего Аллаха:',
            ar: 'ودليل الصالحين قوله تعالى:',
            tr: 'Salihlerin delili Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'أُو۟لَـٰٓئِكَ ٱلَّذِينَ يَدْعُونَ يَبْتَغُونَ إِلَىٰ رَبِّهِمُ ٱلْوَسِيلَةَ أَيُّهُمْ أَقْرَبُ وَيَرْجُونَ رَحْمَتَهُۥ وَيَخَافُونَ عَذَابَهُۥٓ ۚ إِنَّ عَذَابَ رَبِّكَ كَانَ مَحْذُورًا',
          text: {
            az: 'Onların dua etdikləri o kəslər özləri Rəbbinə — hansı daha yaxın olacaq deyə — vəsilə axtarır, Onun rəhmətini umur və əzabından qorxurlar. Həqiqətən, Rəbbinin əzabı qorxulmalı bir şeydir.',
            en: 'Those whom they invoke themselves seek a means of nearness to their Lord — which of them would be nearest — and they hope for His mercy and fear His punishment. Indeed, the punishment of your Lord is ever to be feared.',
            ru: 'Те, к кому они взывают, сами ищут пути приближения к своему Господу — кто из них будет ближе, — надеются на Его милость и боятся Его наказания. Воистину, наказания твоего Господа следует остерегаться.',
            ar: 'أُو۟لَـٰٓئِكَ ٱلَّذِينَ يَدْعُونَ يَبْتَغُونَ إِلَىٰ رَبِّهِمُ ٱلْوَسِيلَةَ أَيُّهُمْ أَقْرَبُ وَيَرْجُونَ رَحْمَتَهُۥ وَيَخَافُونَ عَذَابَهُۥٓ ۚ إِنَّ عَذَابَ رَبِّكَ كَانَ مَحْذُورًا',
            tr: 'Onların dua ettikleri o kimseler, hangisi daha yakın olacak diye Rablerine vesile ararlar, O’nun rahmetini umar ve azabından korkarlar. Şüphesiz Rabbinin azabı sakınılması gereken bir azaptır.',
          },
          ref: '17:57',
        },
        {
          t: 'p',
          text: {
            az: 'Daş və ağacların dəlili Uca Allahın bu sözüdür:',
            en: 'The evidence for stones and trees is the saying of Allah the Exalted:',
            ru: 'Довод о камнях и деревьях — слова Всевышнего Аллаха:',
            ar: 'ودليل الأحجار والأشجار قوله تعالى:',
            tr: 'Taş ve ağaçların delili Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'أَفَرَءَيْتُمُ ٱللَّـٰتَ وَٱلْعُزَّىٰ ۝ وَمَنَوٰةَ ٱلثَّالِثَةَ ٱلْأُخْرَىٰٓ',
          text: {
            az: 'Lat və Uzza barədə düşünmüsünüzmü? Və üçüncüsü olan digər Mənat barədə?',
            en: 'Have you considered al-Lat and al-‘Uzza, and Manat, the third, the other?',
            ru: 'Видели ли вы Лат и Уззу, и Манат, третью, иную?',
            ar: 'أَفَرَءَيْتُمُ ٱللَّـٰتَ وَٱلْعُزَّىٰ ۝ وَمَنَوٰةَ ٱلثَّالِثَةَ ٱلْأُخْرَىٰٓ',
            tr: 'Gördünüz mü Lât ve Uzzâ’yı? Ve üçüncüleri olan diğer Menât’ı?',
          },
          ref: '53:19-20',
        },
        {
          t: 'p',
          text: {
            az: 'Həmçinin Əbu Vaqid əl-Leysinin (Allah ondan razı olsun) hədisi. O dedi: «Biz küfrdən təzəcə çıxmış halda Peyğəmbərlə ﷺ Hüneynə çıxdıq. Müşriklərin bir sidr ağacı var idi; onun yanında ibadətə qapanır və silahlarını ondan asırdılar, ona Zatu-Ənvat deyilirdi. Bir sidr ağacının yanından keçdik və dedik: “Ey Allahın Elçisi, onların Zatu-Ənvatı olduğu kimi bizə də bir Zatu-Ənvat təyin et”…» (hədisin sonuna qədər).',
            en: 'And the hadith of Abu Waqid al-Laythi (may Allah be pleased with him), who said: “We went out with the Prophet ﷺ to Hunayn while we had only recently left disbelief. The polytheists had a lote tree at which they would devote themselves and on which they hung their weapons; it was called Dhat Anwat. We passed by a lote tree and said: ‘O Messenger of Allah, make for us a Dhat Anwat as they have a Dhat Anwat…’” (to the end of the hadith).',
            ru: 'А также хадис Абу Вакида аль-Лейси (да будет доволен им Аллах): «Мы вышли с Пророком ﷺ к Хунайну, а мы недавно оставили неверие. У многобожников было лотосовое дерево, возле которого они предавались поклонению и на которое вешали своё оружие; его называли Зату-Анват. Мы проходили мимо лотосового дерева и сказали: “О Посланник Аллаха, сделай нам Зату-Анват, как у них есть Зату-Анват”…» (до конца хадиса).',
            ar: 'وحديث أبي واقد الليثي رضي الله عنه قال: خرجنا مع النبي ﷺ إلى حنين ونحن حدثاء عهد بكفر، وللمشركين سدرة يعكفون عندها وينوطون بها أسلحتهم، يقال لها: ذات أنواط، فمررنا بسدرة فقلنا: يا رسول الله، اجعل لنا ذات أنواط كما لهم ذات أنواط… الحديث.',
            tr: 'Ayrıca Ebû Vâkıd el-Leysî’nin (Allah ondan razı olsun) hadisi. O şöyle dedi: “Küfürden yeni çıkmış hâlde Peygamber ﷺ ile birlikte Huneyn’e çıktık. Müşriklerin bir sidre ağacı vardı; yanında ibadete kapanır ve silahlarını ona asarlardı, ona Zâtu Envât denirdi. Bir sidre ağacının yanından geçtik ve: ‘Ey Allah’ın Resûlü, onların Zâtu Envât’ı olduğu gibi bize de bir Zâtu Envât belirle’ dedik…” (hadisin sonuna kadar).',
          },
        },
        {
          t: 'hadith',
          ar: 'مَرَّ بِشَجَرَةٍ لِلْمُشْرِكِينَ يُقَالُ لَهَا ذَاتُ أَنْوَاطٍ يُعَلِّقُونَ عَلَيْهَا أَسْلِحَتَهُمْ، فَقَالُوا: يَا رَسُولَ اللَّهِ اجْعَلْ لَنَا ذَاتَ أَنْوَاطٍ كَمَا لَهُمْ ذَاتُ أَنْوَاطٍ. فَقَالَ النَّبِيُّ ﷺ: «سُبْحَانَ اللَّهِ! هَذَا كَمَا قَالَ قَوْمُ مُوسَى: ﴿اجْعَلْ لَنَا إِلَهًا كَمَا لَهُمْ آلِهَةٌ﴾، وَالَّذِي نَفْسِي بِيَدِهِ لَتَرْكَبُنَّ سُنَّةَ مَنْ كَانَ قَبْلَكُمْ»',
          text: {
            az: 'Peyğəmbər ﷺ müşriklərin Zatu-Ənvat adlanan, silahlarını asdıqları bir ağacının yanından keçdi. Onlar dedilər: «Ey Allahın Elçisi, onların Zatu-Ənvatı olduğu kimi bizə də bir Zatu-Ənvat təyin et». Peyğəmbər ﷺ buyurdu: «Sübhanallah! Bu, Musanın qövmünün dediyi kimidir: “Onların ilahları olduğu kimi, bizə də bir ilah düzəlt”. Canım əlində olana and olsun ki, siz özünüzdən əvvəlkilərin yolunu mütləq tutacaqsınız».',
            en: 'He ﷺ passed by a tree of the polytheists called Dhat Anwat on which they hung their weapons. They said: “O Messenger of Allah, make for us a Dhat Anwat as they have a Dhat Anwat.” The Prophet ﷺ said: “Subhan Allah! This is like what the people of Musa said: ‘Make for us a god just as they have gods.’ By the One in whose hand is my soul, you will surely follow the ways of those before you.”',
            ru: 'Он ﷺ проходил мимо дерева многобожников, называемого Зату-Анват, на которое они вешали своё оружие. Они сказали: «О Посланник Аллаха, сделай нам Зату-Анват, как у них есть Зату-Анват». Пророк ﷺ сказал: «Пречист Аллах! Это подобно тому, что сказал народ Мусы: “Сделай нам бога, подобного их богам”. Клянусь Тем, в Чьей руке моя душа, вы непременно последуете путём тех, кто был до вас».',
            ar: 'مرّ النبي ﷺ بشجرة للمشركين يعلّقون عليها أسلحتهم، فطلب بعض أصحابه مثلها، فأنكر ذلك وشبّهه بقول قوم موسى: اجعل لنا إلهًا كما لهم آلهة.',
            tr: 'Peygamber ﷺ müşriklerin silahlarını astıkları, Zâtu Envât denilen bir ağacın yanından geçti. Onlar: “Ey Allah’ın Resûlü, onların Zâtu Envât’ı olduğu gibi bize de bir Zâtu Envât belirle” dediler. Peygamber ﷺ şöyle buyurdu: “Sübhanallah! Bu, Musa’nın kavminin söylediği gibidir: ‘Onların ilahları olduğu gibi bize de bir ilah yap.’ Canım elinde olana yemin ederim ki, sizden öncekilerin yolunu mutlaka izleyeceksiniz.”',
          },
          src: {
            az: 'Tirmizi 2180',
            en: 'at-Tirmidhi 2180',
            ru: 'ат-Тирмизи 2180',
            ar: 'الترمذي 2180',
            tr: 'Tirmizî 2180',
          },
          grade: {
            az: 'Səhih (əl-Albani)',
            en: 'Sahih (al-Albani)',
            ru: 'Достоверный (аль-Альбани)',
            ar: 'صحيح (الألباني)',
            tr: 'Sahih (el-Elbânî)',
          },
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Bu qayda göstərir ki, şirkin hökmü kimə ibadət edildiyinə görə dəyişmir: ibadət mələyə, peyğəmbərə, övliyaya, daşa və ya ulduza yönəldilsə də, hamısı eyni şirkdir. Zatu-Ənvat hədisindən həm də öyrənirik ki, ağacdan, daşdan və ya qəbirdən bərəkət ummaq şirk qapısıdır və nadan qalan müsəlman da ona düşə bilər.',
            en: 'Explanation: This principle shows that the ruling on shirk does not change according to who is worshipped: whether worship is directed to an angel, a prophet, a saint, a stone or a star, it is the same shirk. The Dhat Anwat hadith also teaches that seeking blessing from a tree, a stone or a grave is a door to shirk, and an uninformed Muslim may fall into it.',
            ru: 'Пояснение: Это правило показывает, что суждение о ширке не меняется в зависимости от объекта поклонения: ангел, пророк, праведник, камень или звезда — это один и тот же ширк. Хадис о Зату-Анват также учит, что поиск благодати от дерева, камня или могилы — дверь к ширку, и несведущий мусульманин может в неё войти.',
            ar: 'شرح: تدل هذه القاعدة على أن حكم الشرك لا يختلف باختلاف المعبود: ملكًا كان أو نبيًا أو وليًا أو حجرًا أو كوكبًا. ويستفاد من حديث ذات أنواط أن التبرك بالأشجار والأحجار والقبور باب إلى الشرك، وأن المسلم قد يقع فيه إذا جهل.',
            tr: 'Açıklama: Bu kaide, şirkin hükmünün kime ibadet edildiğine göre değişmediğini gösterir: ibadet bir meleğe, peygambere, veliye, taşa ya da yıldıza yöneltilse de hepsi aynı şirktir. Zâtu Envât hadisinden ayrıca ağaçtan, taştan veya kabirden bereket ummanın şirke açılan bir kapı olduğunu ve bilgisiz kalan bir Müslümanın da ona düşebileceğini öğreniriz.',
          },
        },
      ],
    },
    {
      id: 'rule-4',
      title: {
        az: 'Dördüncü qayda',
        en: 'The fourth principle',
        ru: 'Четвёртое правило',
        ar: 'القاعدة الرابعة',
        tr: 'Dördüncü kaide',
      },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Bizim zamanımızın müşrikləri şirkdə əvvəlkilərdən daha ağırdır. Çünki əvvəlkilər rahatlıqda şirk qoşur, çətinlikdə isə (duanı Allaha) xalis edirdilər; zamanımızın müşriklərinin şirki isə həm rahatlıqda, həm də çətinlikdə davamlıdır. Dəlil Uca Allahın bu sözüdür:',
            en: 'The polytheists of our time are more severe in their shirk than the earlier ones, because the earlier ones associated partners in times of ease and were sincere [to Allah] in times of hardship, while the shirk of the polytheists of our time is constant, in ease and in hardship. The evidence is the saying of Allah the Exalted:',
            ru: 'Многобожники нашего времени тяжелее в ширке, чем прежние, потому что прежние придавали сотоварищей в благополучии и были искренни (перед Аллахом) в беде, а ширк многобожников нашего времени постоянен — и в благополучии, и в беде. Довод — слова Всевышнего Аллаха:',
            ar: 'القاعدة الرابعة: أن مشركي زماننا أغلظ شركًا من الأولين؛ لأن الأولين يشركون في الرخاء ويخلصون في الشدة، ومشركو زماننا شركهم دائم في الرخاء والشدة، والدليل قوله تعالى:',
            tr: 'Zamanımızın müşrikleri, şirkte öncekilerden daha ağırdır. Çünkü öncekiler bollukta şirk koşar, darlıkta ise (duayı Allah’a) halis kılarlardı; zamanımızın müşriklerinin şirki ise hem bollukta hem darlıkta süreklidir. Delil Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'فَإِذَا رَكِبُوا۟ فِى ٱلْفُلْكِ دَعَوُا۟ ٱللَّهَ مُخْلِصِينَ لَهُ ٱلدِّينَ فَلَمَّا نَجَّىٰهُمْ إِلَى ٱلْبَرِّ إِذَا هُمْ يُشْرِكُونَ',
          text: {
            az: 'Onlar gəmiyə mindikdə dini Allaha xalis edərək Ona dua edirlər. Amma Allah onları xilas edib quruya çıxardıqda dərhal şirk qoşurlar.',
            en: 'And when they board a ship, they call upon Allah, sincere to Him in religion. But when He delivers them to the land, at once they associate others with Him.',
            ru: 'Когда они садятся на корабль, то взывают к Аллаху, очищая перед Ним религию. Когда же Он спасает их и выводит на сушу, они вдруг начинают приобщать сотоварищей.',
            ar: 'فَإِذَا رَكِبُوا۟ فِى ٱلْفُلْكِ دَعَوُا۟ ٱللَّهَ مُخْلِصِينَ لَهُ ٱلدِّينَ فَلَمَّا نَجَّىٰهُمْ إِلَى ٱلْبَرِّ إِذَا هُمْ يُشْرِكُونَ',
            tr: 'Gemiye bindiklerinde dini yalnız Allah’a halis kılarak O’na dua ederler. Fakat Allah onları kurtarıp karaya çıkarınca bir de bakarsın ki şirk koşuyorlar.',
          },
          ref: '29:65',
        },
        {
          t: 'p',
          text: {
            az: 'Allah ən doğrusunu biləndir. Allahın salavatı və salamı Muhəmmədə, onun ailəsinə və səhabələrinə olsun.',
            en: 'And Allah knows best. May Allah send blessings and peace upon Muhammad, his family and his companions.',
            ru: 'А Аллах знает лучше. Да благословит Аллах Мухаммада, его семью и сподвижников и да приветствует.',
            ar: 'والله أعلم، وصلى الله على محمد وعلى آله وصحبه وسلم.',
            tr: 'En doğrusunu Allah bilir. Allah’ın salâtı ve selamı Muhammed’e, ailesine ve ashabına olsun.',
          },
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Müəllif burada öz dövründə gördüyü bir halı təsvir edir: çətinlikdə belə Allahdan başqasına yalvarmaq. Qaydanın məqsədi şirkin ağırlığını göstərmək və bizi ondan çəkindirməkdir. O, bu sözlə müsəlmanlardan müəyyən şəxslərə hökm çıxarmağa icazə vermir; müəyyən bir şəxsi kafir elan etməyin şərtləri və maneələri var, bu da alimlərin işidir — bax: «İslamı pozan on şey» dərsi.',
            en: 'Explanation: Here the author describes something he saw in his own time: calling upon other than Allah even in hardship. The aim of the principle is to show how grave shirk is and to warn us away from it. It does not license passing verdicts on specific Muslims: declaring a specific person a disbeliever has conditions and preventers, and it is the work of scholars — see the lesson “The Ten Nullifiers of Islam”.',
            ru: 'Пояснение: Здесь автор описывает то, что видел в своё время: обращение к другим, помимо Аллаха, даже в беде. Цель правила — показать тяжесть ширка и предостеречь от него. Оно не разрешает выносить приговоры конкретным мусульманам: объявление конкретного человека неверным имеет условия и препятствия и является делом учёных — см. урок «Десять отводящих от ислама».',
            ar: 'شرح: يصف المؤلف هنا حالًا رآها في زمانه، وهي دعاء غير الله حتى في الشدائد، والمقصود بيان غلظ الشرك والتحذير منه، لا الإذن بإطلاق الأحكام على أعيان المسلمين؛ فتكفير المعيّن له شروط وموانع، وهو من شأن العلماء. انظر درس «نواقض الإسلام».',
            tr: 'Açıklama: Müellif burada kendi zamanında gördüğü bir durumu anlatır: darlıkta bile Allah’tan başkasına yalvarmak. Kaidenin amacı şirkin ağırlığını göstermek ve bizi ondan sakındırmaktır. Bu söz, belirli Müslümanlar hakkında hüküm vermeye izin vermez; belirli bir kişiyi tekfir etmenin şartları ve engelleri vardır ve bu, âlimlerin işidir — bkz. “İslam’ı bozan on şey” dersi.',
          },
        },
      ],
    },
    {
      id: 'summary',
      title: {
        az: 'Xülasə',
        en: 'Summary',
        ru: 'Итог',
        ar: 'الخلاصة',
        tr: 'Özet',
      },
      blocks: [
        {
          t: 'table',
          head: [
            {
              az: 'Qayda',
              en: 'Principle',
              ru: 'Правило',
              ar: 'القاعدة',
              tr: 'Kaide',
            },
            {
              az: 'Məzmunu',
              en: 'Content',
              ru: 'Содержание',
              ar: 'مضمونها',
              tr: 'İçeriği',
            },
            {
              az: 'Əsas dəlil',
              en: 'Main evidence',
              ru: 'Главный довод',
              ar: 'الدليل',
              tr: 'Temel delil',
            },
          ],
          rows: [
            [
              {
                az: '1',
                en: '1',
                ru: '1',
                ar: '١',
                tr: '1',
              },
              {
                az: 'Rububiyyəti etiraf etmək insanı İslama daxil etmir',
                en: 'Affirming Lordship alone does not make one Muslim',
                ru: 'Признание господства не делает человека мусульманином',
                ar: 'الإقرار بالربوبية وحده لا يُدخل في الإسلام',
                tr: 'Rubûbiyeti kabul etmek tek başına Müslüman yapmaz',
              },
              {
                az: 'Yunus 10:31',
                en: 'Yunus 10:31',
                ru: 'Юнус 10:31',
                ar: 'يونس: 31',
                tr: 'Yûnus 10:31',
              },
            ],
            [
              {
                az: '2',
                en: '2',
                ru: '2',
                ar: '٢',
                tr: '2',
              },
              {
                az: '«Yaxınlıq» və «şəfaət» bəhanəsi şirki halal etmir; şəfaət yalnız Allahdan istənir',
                en: 'The excuse of “nearness” and “intercession” does not justify shirk; intercession is asked of Allah',
                ru: 'Довод о «приближении» и «заступничестве» не оправдывает ширк; заступничества просят у Аллаха',
                ar: 'التعلل بالقربة والشفاعة لا يبيح الشرك، والشفاعة تُطلب من الله',
                tr: '“Yakınlık” ve “şefaat” bahanesi şirki meşru kılmaz; şefaat Allah’tan istenir',
              },
              {
                az: 'Zümər 39:3; Yunus 10:18',
                en: 'az-Zumar 39:3; Yunus 10:18',
                ru: 'аз-Зумар 39:3; Юнус 10:18',
                ar: 'الزمر: 3؛ يونس: 18',
                tr: 'Zümer 39:3; Yûnus 10:18',
              },
            ],
            [
              {
                az: '3',
                en: '3',
                ru: '3',
                ar: '٣',
                tr: '3',
              },
              {
                az: 'Kimə ibadət edilməsindən asılı olmayaraq şirk birdir',
                en: 'Shirk is one, whoever is worshipped',
                ru: 'Ширк один, кому бы ни поклонялись',
                ar: 'الشرك واحد أيًّا كان المعبود',
                tr: 'Kime ibadet edilirse edilsin şirk birdir',
              },
              {
                az: 'Ənfal 8:39',
                en: 'al-Anfal 8:39',
                ru: 'аль-Анфаль 8:39',
                ar: 'الأنفال: 39',
                tr: 'Enfâl 8:39',
              },
            ],
            [
              {
                az: '4',
                en: '4',
                ru: '4',
                ar: '٤',
                tr: '4',
              },
              {
                az: 'Həm rahatlıqda, həm çətinlikdə davam edən şirk daha ağırdır',
                en: 'Shirk that persists in ease and hardship is graver',
                ru: 'Ширк, длящийся и в благополучии, и в беде, тяжелее',
                ar: 'الشرك الدائم في الرخاء والشدة أغلظ',
                tr: 'Hem bollukta hem darlıkta süren şirk daha ağırdır',
              },
              {
                az: 'Ənkəbut 29:65',
                en: 'al-Ankabut 29:65',
                ru: 'аль-Анкабут 29:65',
                ar: 'العنكبوت: 65',
                tr: 'Ankebût 29:65',
              },
            ],
          ],
        },
        {
          t: 'note',
          kind: 'info',
          text: {
            az: 'Risalədəki ibadət növlərinin (dua, qorxu, ümid, təvəkkül, qurban, nəzir və s.) ətraflı dəlilləri «Üç əsas» dərsindədir; şirkin növləri və qapıları isə «Kitabut-Tövhid» dərsində fəsil-fəsil izah olunur.',
            en: 'The detailed evidence for the kinds of worship (supplication, fear, hope, reliance, sacrifice, vows, etc.) is in the lesson “The Three Fundamental Principles”; the kinds and doors of shirk are explained chapter by chapter in the lesson “Kitab at-Tawhid”.',
            ru: 'Подробные доводы о видах поклонения (мольба, страх, надежда, упование, жертвоприношение, обет и др.) — в уроке «Три основы»; виды и двери ширка разобраны по главам в уроке «Книга единобожия».',
            ar: 'أدلة أنواع العبادة (الدعاء والخوف والرجاء والتوكل والذبح والنذر وغيرها) مفصلة في درس «الأصول الثلاثة»، وأنواع الشرك وذرائعه مشروحة بابًا بابًا في درس «كتاب التوحيد».',
            tr: 'İbadet türlerinin (dua, korku, ümit, tevekkül, kurban, adak vb.) ayrıntılı delilleri “Üç Esas” dersindedir; şirkin türleri ve kapıları ise “Kitâbu’t-Tevhîd” dersinde bab bab açıklanır.',
          },
        },
      ],
    },
  ],
  sources: [
    {
      label: 'Muhammad ibn Abd al-Wahhab — al-Qawa‘id al-Arba‘ (القواعد الأربع)',
    },
    {
      label: 'Quran text (Uthmani): api.quran.com',
      url: 'https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=29',
    },
    {
      label: 'Salih al-Fawzan — Sharh al-Qawa‘id al-Arba‘ (شرح القواعد الأربع)',
    },
    {
      label: 'Muhammad ibn Salih al-Uthaymin — Sharh al-Qawa‘id al-Arba‘',
    },
    {
      label: 'Jami‘ at-Tirmidhi 2180 (hadith-api)',
      url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-tirmidhi/2180.json',
    },
  ],
}
