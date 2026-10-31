// The Ten Nullifiers of Islam (Nawaqid al-Islam) — /learn/nawaqid-al-islam
// Format: src/data/lessons/README.md. Quran text: api.quran.com (Uthmani), hadith numbers checked against fawazahmed0/hadith-api.

export const meta = {
  slug: 'nawaqid-al-islam',
  cat: 'aqidah',
  order: 30,
  icon: 'alert',
  arTitle: 'نواقض الإسلام',
  title: {
    az: 'İslamı pozan on şey (Nəvaqidul-İslam)',
    en: 'The Ten Nullifiers of Islam (Nawaqid al-Islam)',
    ru: 'Десять отводящих от ислама (Наваким аль-ислям)',
    ar: 'نواقض الإسلام العشرة',
    tr: 'İslam’ı bozan on şey (Nevâkızu’l-İslâm)',
  },
  summary: {
    az: 'Şeyx Muhəmməd ibn Abdülvəhhabın risaləsinin tam mətni və izahı, həmçinin təkfirin şərtləri və maneələri barədə vacib qeyd.',
    en: 'The full text of Shaykh Muhammad ibn Abd al-Wahhab’s treatise with explanation, plus an essential note on the conditions and preventers of takfir.',
    ru: 'Полный текст трактата шейха Мухаммада ибн Абд аль-Ваххаба с пояснением и важное замечание об условиях и препятствиях такфира.',
    ar: 'النص الكامل لرسالة الشيخ محمد بن عبد الوهاب مع شرح مختصر، وتنبيه مهم على شروط التكفير وموانعه.',
    tr: 'Şeyh Muhammed b. Abdulvehhâb’ın risalesinin tam metni ve açıklaması, ayrıca tekfirin şartları ve engelleri hakkında önemli bir not.',
  },
  author: {
    az: 'Şeyx Muhəmməd ibn Abdülvəhhab',
    en: 'Shaykh Muhammad ibn Abd al-Wahhab',
    ru: 'Шейх Мухаммад ибн Абд аль-Ваххаб',
    ar: 'الشيخ محمد بن عبد الوهاب',
    tr: 'Şeyh Muhammed b. Abdulvehhâb',
  },
  minutes: 15,
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
            az: '«Nəvaqid» — «pozanlar» deməkdir: dəstəmazı pozan şeylər olduğu kimi, insanı İslamdan çıxaran söz, əməl və etiqadlar da var. Şeyx Muhəmməd ibn Abdülvəhhab bu qısa risalədə alimlərin mürtəd hökmləri fəslində zikr etdikləri pozanlardan ən təhlükəlilərini və ən çox rast gəlinənlərini on maddədə toplayıb.',
            en: '“Nawaqid” means “nullifiers”: just as there are things that nullify wudu, there are words, deeds and beliefs that take a person out of Islam. In this short treatise Shaykh Muhammad ibn Abd al-Wahhab gathered in ten points the most dangerous and most common of the nullifiers that the scholars mention in the chapter on apostasy.',
            ru: '«Наваким» означает «нарушители»: как есть то, что нарушает омовение, так есть слова, дела и убеждения, выводящие человека из ислама. В этом кратком трактате шейх Мухаммад ибн Абд аль-Ваххаб собрал в десяти пунктах самые опасные и самые распространённые из нарушителей, которые учёные упоминают в главе о вероотступничестве.',
            ar: 'النواقض جمع ناقض، وهو المُفسد؛ فكما أن للوضوء نواقض فللإسلام نواقض من الأقوال والأفعال والاعتقادات. وقد جمع الشيخ محمد بن عبد الوهاب في هذه الرسالة عشرة منها، هي أخطرها وأكثرها وقوعًا مما ذكره العلماء في باب حكم المرتد.',
            tr: '“Nevâkız”, “bozanlar” demektir: abdesti bozan şeyler olduğu gibi, insanı İslam’dan çıkaran söz, amel ve inançlar da vardır. Şeyh Muhammed b. Abdulvehhâb bu kısa risalede, âlimlerin mürtet bahsinde zikrettikleri bozanların en tehlikeli ve en sık görülenlerini on maddede toplamıştır.',
          },
        },
        {
          t: 'note',
          kind: 'warn',
          text: {
            az: 'Bu dərsin məqsədi müsəlmanın özünü qorumasıdır, başqalarını mühakimə etmək deyil. Bir əməlin küfr olması ilə onu edən müəyyən şəxsin kafir olması eyni şey deyil — aradakı fərq aşağıdakı «Təkfirin şərtləri və maneələri» bölməsində izah olunur.',
            en: 'The aim of this lesson is for a Muslim to protect himself, not to judge others. An act being disbelief and the specific person who does it being a disbeliever are not the same thing — the difference is explained below in “Conditions and preventers of takfir”.',
            ru: 'Цель этого урока — чтобы мусульманин оберегал себя, а не судил других. То, что поступок является неверием, и то, что совершивший его конкретный человек — неверный, не одно и то же; разница объяснена ниже в разделе «Условия и препятствия такфира».',
            ar: 'المقصود من هذا الدرس أن يحذر المسلم على نفسه، لا أن يحكم على غيره؛ فكون الفعل كفرًا شيء، وكون فاعله المعيّن كافرًا شيء آخر، والفرق مبيّن في فصل «شروط التكفير وموانعه» أدناه.',
            tr: 'Bu dersin amacı, Müslümanın kendini korumasıdır, başkalarını yargılamak değil. Bir amelin küfür olmasıyla onu yapan belirli kişinin kâfir olması aynı şey değildir — aradaki fark aşağıdaki “Tekfirin şartları ve engelleri” bölümünde açıklanmıştır.',
          },
        },
        {
          t: 'p',
          text: {
            az: 'Risalənin mətni ərəbcə orijinala sadiq qalaraq tərcümə olunub. «İzah» qeydləri isə mətnin bir hissəsi deyil — Şeyx İbn Baz və Şeyx Saleh əl-Fəvzanın bu risaləyə yazdıqları şərhlərdən istifadə ilə verilmiş qısa açıqlamalardır.',
            en: 'The text of the treatise is translated faithfully to the Arabic original. The “Explanation” notes are not part of the text — they are short clarifications drawing on the commentaries of Shaykh Ibn Baz and Shaykh Salih al-Fawzan on this treatise.',
            ru: 'Текст трактата переведён близко к арабскому оригиналу. Заметки «Пояснение» не являются частью текста — это краткие разъяснения на основе комментариев шейха Ибн База и шейха Салиха аль-Фаузана к этому трактату.',
            ar: 'نص الرسالة مترجم بأمانة عن الأصل العربي. وما عُنون بـ«شرح» فليس من المتن، وإنما هو توضيح مختصر مستفاد من شرح الشيخ ابن باز والشيخ صالح الفوزان لهذه الرسالة.',
            tr: 'Risalenin metni Arapça aslına sadık kalınarak tercüme edilmiştir. “Açıklama” notları metnin parçası değildir — Şeyh İbn Bâz ve Şeyh Salih el-Fevzân’ın bu risaleye yazdıkları şerhlerden yararlanılarak verilmiş kısa izahlardır.',
          },
        },
      ],
    },
    {
      id: 'n1-3',
      title: {
        az: '1–3: şirk, vasitəçilər, müşrikləri kafir saymamaq',
        en: '1–3: shirk, intermediaries, not deeming polytheists disbelievers',
        ru: '1–3: ширк, посредники, непризнание многобожников неверными',
        ar: '١–٣: الشرك، والوسائط، وعدم تكفير المشركين',
        tr: '1–3: şirk, aracılar, müşrikleri kâfir saymamak',
      },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Bil ki, İslamı pozan şeylər ondur. Birincisi: Uca Allaha ibadətdə şirk. Uca Allah buyurur:',
            en: 'Know that the nullifiers of Islam are ten. The first: shirk in the worship of Allah the Exalted. Allah the Exalted said:',
            ru: 'Знай, что отводящих от ислама — десять. Первое: ширк в поклонении Всевышнему Аллаху. Всевышний Аллах сказал:',
            ar: 'اعلم أن نواقض الإسلام عشرة نواقض: الأول: الشرك في عبادة الله تعالى، قال الله تعالى:',
            tr: 'Bil ki İslam’ı bozan şeyler ondur. Birincisi: Yüce Allah’a ibadette şirk. Yüce Allah şöyle buyurur:',
          },
        },
        {
          t: 'ayah',
          ar: 'إِنَّ ٱللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِۦ وَيَغْفِرُ مَا دُونَ ذَٰلِكَ لِمَن يَشَآءُ',
          text: {
            az: 'Həqiqətən, Allah Ona şərik qoşulmasını bağışlamaz, bundan başqasını isə istədiyi kəs üçün bağışlayar.',
            en: 'Indeed, Allah does not forgive that partners be associated with Him, but He forgives what is less than that for whom He wills.',
            ru: 'Воистину, Аллах не прощает, когда к Нему приобщают сотоварищей, но прощает всё, что меньше этого, кому пожелает.',
            ar: 'إِنَّ ٱللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِۦ وَيَغْفِرُ مَا دُونَ ذَٰلِكَ لِمَن يَشَآءُ',
            tr: 'Şüphesiz Allah kendisine şirk koşulmasını bağışlamaz; bundan başkasını dilediği kimse için bağışlar.',
          },
          ref: '4:116',
        },
        {
          t: 'p',
          text: {
            az: 'Və buyurur:',
            en: 'And He said:',
            ru: 'И сказал:',
            ar: 'وقال تعالى:',
            tr: 'Ve şöyle buyurur:',
          },
        },
        {
          t: 'ayah',
          ar: 'إِنَّهُۥ مَن يُشْرِكْ بِٱللَّهِ فَقَدْ حَرَّمَ ٱللَّهُ عَلَيْهِ ٱلْجَنَّةَ وَمَأْوَىٰهُ ٱلنَّارُ ۖ وَمَا لِلظَّـٰلِمِينَ مِنْ أَنصَارٍ',
          text: {
            az: 'Kim Allaha şərik qoşarsa, şübhəsiz ki, Allah ona Cənnəti haram edər, onun yeri oddur. Zalımların heç bir köməkçisi yoxdur.',
            en: 'Indeed, whoever associates partners with Allah — Allah has forbidden him Paradise, and his refuge is the Fire. And for the wrongdoers there are no helpers.',
            ru: 'Воистину, кто приобщает к Аллаху сотоварищей, тому Аллах запретил Рай; его пристанищем будет Огонь, и у беззаконников не будет помощников.',
            ar: 'إِنَّهُۥ مَن يُشْرِكْ بِٱللَّهِ فَقَدْ حَرَّمَ ٱللَّهُ عَلَيْهِ ٱلْجَنَّةَ وَمَأْوَىٰهُ ٱلنَّارُ ۖ وَمَا لِلظَّـٰلِمِينَ مِنْ أَنصَارٍ',
            tr: 'Kim Allah’a şirk koşarsa, şüphesiz Allah ona cenneti haram kılar ve onun varacağı yer ateştir. Zalimlerin hiçbir yardımcısı yoktur.',
          },
          ref: '5:72',
        },
        {
          t: 'p',
          text: {
            az: 'Bura Allahdan başqası üçün qurban kəsmək də daxildir; məsələn, cinlər və ya qəbir üçün qurban kəsən kimi.',
            en: 'Included in this is sacrificing to other than Allah, such as one who sacrifices for the jinn or for a grave.',
            ru: 'Сюда относится и жертвоприношение не ради Аллаха, например ради джиннов или ради могилы.',
            ar: 'ومنه الذبح لغير الله، كمن يذبح للجن أو للقبر.',
            tr: 'Allah’tan başkası için kurban kesmek de buna dahildir; cinler veya bir kabir için kurban kesen kimse gibi.',
          },
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Burada böyük şirk nəzərdə tutulur: ibadətin hər hansı növünü — dua, qurban, nəzir, istiğasə — Allahdan başqasına yönəltmək. Məsələn, ölüdən və ya qeybdəki birindən şəfa, övlad, ruzi istəmək. Riya kimi kiçik şirk isə böyük günahdır, amma insanı dindən çıxarmır.',
            en: 'Explanation: What is meant is major shirk: directing any act of worship — supplication, sacrifice, vows, seeking rescue — to other than Allah, such as asking the dead or the absent for cure, children or provision. Minor shirk, like showing off, is a grave sin but does not take a person out of the religion.',
            ru: 'Пояснение: Имеется в виду большой ширк — обращение любого вида поклонения (мольбы, жертвы, обета, просьбы о спасении) к кому-либо, помимо Аллаха, например просьба к умершему или отсутствующему об исцелении, детях или уделе. Малый ширк, как показуха, — тяжкий грех, но не выводит из религии.',
            ar: 'شرح: المراد الشرك الأكبر: صرف شيء من العبادة كالدعاء والذبح والنذر والاستغاثة لغير الله، كسؤال الأموات أو الغائبين الشفاء أو الولد أو الرزق. أما الشرك الأصغر كالرياء فكبيرة عظيمة لكنه لا يُخرج من الملة.',
            tr: 'Açıklama: Burada kastedilen büyük şirktir: dua, kurban, adak, istiğase gibi herhangi bir ibadeti Allah’tan başkasına yöneltmek; örneğin ölüden ya da gaipteki birinden şifa, çocuk veya rızık istemek. Riya gibi küçük şirk ise büyük bir günahtır ama insanı dinden çıkarmaz.',
          },
        },
        {
          t: 'p',
          text: {
            az: 'İkincisi: Kim özü ilə Allah arasında vasitəçilər qoyub onlara dua edərsə, onlardan şəfaət istəyərsə və onlara təvəkkül edərsə, icma ilə kafir olar.',
            en: 'The second: whoever sets up intermediaries between himself and Allah, calling upon them, asking them for intercession and relying upon them, has disbelieved by consensus.',
            ru: 'Второе: кто ставит между собой и Аллахом посредников, взывает к ним, просит у них заступничества и уповает на них, тот стал неверным по единогласному мнению.',
            ar: 'الثاني: من جعل بينه وبين الله وسائط يدعوهم ويسألهم الشفاعة ويتوكل عليهم، كفر إجماعًا.',
            tr: 'İkincisi: Kim kendisiyle Allah arasında aracılar koyar, onlara dua eder, onlardan şefaat ister ve onlara tevekkül ederse, icmayla kâfir olur.',
          },
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Bu, Məkkə müşriklərinin etdiyi şirkin eynisidir: onlar «bunlar bizi Allaha yaxınlaşdırır» deyirdilər (Zümər 39:3). Diri və yanında olan bir müsəlmandan «mənim üçün dua et» deyə xahiş etmək isə bu qəbildən deyil, icazəlidir. Ətraflı: «Dörd qayda» dərsi, ikinci qayda.',
            en: 'Explanation: This is the very shirk of the polytheists of Makkah, who said: “they bring us nearer to Allah” (az-Zumar 39:3). Asking a living, present Muslim to “make du‘a for me” is not of this kind; it is permissible. In detail: the lesson “The Four Principles”, second principle.',
            ru: 'Пояснение: Это тот самый ширк мекканских многобожников, которые говорили: «Они приближают нас к Аллаху» (аз-Зумар 39:3). Просьба к живому присутствующему мусульманину «помолись за меня» к этому не относится — она дозволена. Подробно: урок «Четыре правила», второе правило.',
            ar: 'شرح: هذا عين شرك مشركي مكة الذين قالوا: ﴿مَا نَعْبُدُهُمْ إِلَّا لِيُقَرِّبُونَا إِلَى اللَّهِ زُلْفَى﴾. أما طلب الدعاء من المسلم الحي الحاضر فليس من هذا، بل هو جائز. وتفصيله في درس «القواعد الأربع»، القاعدة الثانية.',
            tr: 'Açıklama: Bu, Mekke müşriklerinin şirkinin ta kendisidir: “Bunlar bizi Allah’a yaklaştırır” diyorlardı (Zümer 39:3). Hayatta ve yanında olan bir Müslümandan “benim için dua et” diye istemek ise bu türden değildir, caizdir. Ayrıntısı: “Dört Kaide” dersi, ikinci kaide.',
          },
        },
        {
          t: 'p',
          text: {
            az: 'Üçüncüsü: Kim müşrikləri kafir saymazsa, ya onların küfrünə şübhə edərsə, ya da onların yolunu doğru sayarsa, kafir olar.',
            en: 'The third: whoever does not deem the polytheists disbelievers, or doubts their disbelief, or considers their way correct, has disbelieved.',
            ru: 'Третье: кто не считает многобожников неверными, или сомневается в их неверии, или признаёт их путь правильным, тот стал неверным.',
            ar: 'الثالث: من لم يكفّر المشركين، أو شكّ في كفرهم، أو صحّح مذهبهم، كفر.',
            tr: 'Üçüncüsü: Kim müşrikleri kâfir saymaz, ya da onların küfründe şüphe eder, ya da onların yolunu doğru sayarsa kâfir olur.',
          },
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Bu, Allahın və Rəsulunun açıq şəkildə kafir adlandırdığı kəslərə aiddir — məsələn, bütpərəstlər, İslamı qəbul etməyən yəhudi və xristianlar. Quranın xəbərini yalanlamaq və ya bütün dinlərin eyni dərəcədə doğru olduğunu iddia etmək bu maddəyə daxildir. Barəsində ixtilaf olan müsəlmanlara aid deyil.',
            en: 'Explanation: This concerns those whom Allah and His Messenger explicitly called disbelievers — such as idol-worshippers, and Jews and Christians who do not accept Islam. Rejecting this Quranic verdict, or claiming that all religions are equally true, falls under this point. It does not concern Muslims about whom there is dispute.',
            ru: 'Пояснение: Речь о тех, кого Аллах и Его Посланник прямо назвали неверными, — идолопоклонниках, а также иудеях и христианах, не принявших ислам. Сюда входит отрицание этого коранического суждения или утверждение, что все религии одинаково истинны. К мусульманам, о которых есть разногласие, это не относится.',
            ar: 'شرح: المراد من نصّ الله ورسوله على كفرهم كعبّاد الأوثان واليهود والنصارى الذين لم يدخلوا في الإسلام؛ فمن ردّ هذا الحكم أو زعم أن الأديان كلها حق فقد كذّب القرآن. ولا يدخل في ذلك من اختُلف فيه من أهل القبلة.',
            tr: 'Açıklama: Bu, Allah’ın ve Resûlü’nün açıkça kâfir olarak nitelediği kimselerle ilgilidir — putperestler, İslam’ı kabul etmeyen Yahudiler ve Hristiyanlar gibi. Kur’an’ın bu hükmünü reddetmek ya da bütün dinlerin eşit derecede doğru olduğunu iddia etmek bu maddeye girer. Hakkında ihtilaf bulunan Müslümanları kapsamaz.',
          },
        },
        {
          t: 'ayah',
          ar: 'إِنَّ ٱلَّذِينَ كَفَرُوا۟ مِنْ أَهْلِ ٱلْكِتَـٰبِ وَٱلْمُشْرِكِينَ فِى نَارِ جَهَنَّمَ خَـٰلِدِينَ فِيهَآ ۚ أُو۟لَـٰٓئِكَ هُمْ شَرُّ ٱلْبَرِيَّةِ',
          text: {
            az: 'Həqiqətən, Kitab əhlindən və müşriklərdən olan kafirlər Cəhənnəm odundadırlar, orada əbədi qalacaqlar. Onlar məxluqların ən pisləridir.',
            en: 'Indeed, those who disbelieved among the People of the Book and the polytheists will be in the fire of Hell, abiding therein eternally. Those are the worst of creatures.',
            ru: 'Воистину, неверующие из людей Писания и многобожники окажутся в огне Геенны и пребудут там вечно. Они — худшие из созданий.',
            ar: 'إِنَّ ٱلَّذِينَ كَفَرُوا۟ مِنْ أَهْلِ ٱلْكِتَـٰبِ وَٱلْمُشْرِكِينَ فِى نَارِ جَهَنَّمَ خَـٰلِدِينَ فِيهَآ ۚ أُو۟لَـٰٓئِكَ هُمْ شَرُّ ٱلْبَرِيَّةِ',
            tr: 'Kitap ehlinden ve müşriklerden inkâr edenler, içinde ebedî kalmak üzere cehennem ateşindedirler. İşte onlar yaratılmışların en kötüsüdür.',
          },
          ref: '98:6',
        },
      ],
    },
    {
      id: 'n4-6',
      title: {
        az: '4–6: başqa hökmü üstün tutmaq, nifrət, məsxərə',
        en: '4–6: preferring other rulings, hatred, mockery',
        ru: '4–6: предпочтение иных законов, ненависть, насмешка',
        ar: '٤–٦: تفضيل غير حكم النبي، والبغض، والاستهزاء',
        tr: '4–6: başka hükmü üstün tutmak, nefret, alay',
      },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Dördüncüsü: Kim Peyğəmbərin ﷺ yolundan başqa bir yolun onun yolundan daha kamil olduğuna, yaxud başqasının hökmünün onun hökmündən daha gözəl olduğuna inanarsa — tağutların hökmünü onun hökmündən üstün tutanlar kimi — o, kafirdir.',
            en: 'The fourth: whoever believes that guidance other than that of the Prophet ﷺ is more complete than his guidance, or that the ruling of someone else is better than his ruling — like those who prefer the rule of the taghut to his rule — is a disbeliever.',
            ru: 'Четвёртое: кто убеждён, что чьё-то руководство совершеннее руководства Пророка ﷺ или что чьё-то решение лучше его решения, — как те, кто предпочитает суд тагутов его суду, — тот неверный.',
            ar: 'الرابع: من اعتقد أن غير هدي النبي ﷺ أكمل من هديه، أو أن حكم غيره أحسن من حكمه، كالذين يفضّلون حكم الطواغيت على حكمه، فهو كافر.',
            tr: 'Dördüncüsü: Kim Peygamber’in ﷺ yolundan başka bir yolun onun yolundan daha mükemmel olduğuna ya da başkasının hükmünün onun hükmünden daha güzel olduğuna inanırsa — tağutların hükmünü onun hükmüne tercih edenler gibi — o kâfirdir.',
          },
        },
        {
          t: 'ayah',
          ar: 'أَفَحُكْمَ ٱلْجَـٰهِلِيَّةِ يَبْغُونَ ۚ وَمَنْ أَحْسَنُ مِنَ ٱللَّهِ حُكْمًا لِّقَوْمٍ يُوقِنُونَ',
          text: {
            az: 'Yoxsa onlar cahiliyyə hökmünü istəyirlər? Qəti iman gətirən bir qövm üçün hökmdə Allahdan daha gözəl kim ola bilər?',
            en: 'Then is it the judgement of [the time of] ignorance they desire? And who is better than Allah in judgement for a people who are certain [in faith]?',
            ru: 'Неужели они ищут суда времён невежества? Чей суд может быть лучше суда Аллаха для людей убеждённых?',
            ar: 'أَفَحُكْمَ ٱلْجَـٰهِلِيَّةِ يَبْغُونَ ۚ وَمَنْ أَحْسَنُ مِنَ ٱللَّهِ حُكْمًا لِّقَوْمٍ يُوقِنُونَ',
            tr: 'Yoksa onlar cahiliye hükmünü mü istiyorlar? Kesin inanan bir topluluk için hüküm bakımından Allah’tan daha güzel kim olabilir?',
          },
          ref: '5:50',
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Şeyx İbn Baz şərhində qeyd edir ki, bu maddəyə insanların qoyduğu qanunların İslam şəriətindən üstün olduğuna, ona bərabər olduğuna və ya onlarla hökm etməyin caiz olduğuna inanmaq da daxildir. Etiqad olmadan şəhvət və ya zəiflik ucbatından Allahın hökmünə müxalif hökm vermək barədə alimlər təfsilat verirlər; bu, alimlərin və məhkəmələrin araşdırdığı məsələdir.',
            en: 'Explanation: Shaykh Ibn Baz notes in his commentary that this point includes believing that man-made laws are better than the Shari‘ah of Islam, equal to it, or that ruling by them is permissible. Scholars give details regarding one who rules contrary to Allah’s law out of desire or weakness without such a belief; that is a matter examined by scholars and courts.',
            ru: 'Пояснение: Шейх Ибн Баз в комментарии отмечает, что сюда входит убеждение, будто законы, созданные людьми, лучше шариата ислама, равны ему или что судить по ним дозволено. Относительно того, кто выносит решение вопреки закону Аллаха из-за страсти или слабости без такого убеждения, учёные дают подробности; это вопрос для учёных и судов.',
            ar: 'شرح: نبّه الشيخ ابن باز في شرحه على أنه يدخل في هذا الناقض من اعتقد أن الأنظمة والقوانين التي يسنّها الناس أفضل من شريعة الإسلام، أو مساوية لها، أو أنه يجوز التحاكم إليها. أما من حكم بغير ما أنزل الله لهوى أو ضعف دون هذا الاعتقاد ففيه تفصيل عند أهل العلم.',
            tr: 'Açıklama: Şeyh İbn Bâz şerhinde, insanların koyduğu kanunların İslam şeriatından üstün olduğuna, ona eşit olduğuna ya da onlarla hükmetmenin caiz olduğuna inanmanın da bu maddeye girdiğini belirtir. Böyle bir inanç olmaksızın heva veya zaaf yüzünden Allah’ın hükmüne aykırı hüküm veren hakkında âlimler ayrıntı verir; bu, âlimlerin ve mahkemelerin inceleyeceği bir meseledir.',
          },
        },
        {
          t: 'p',
          text: {
            az: 'Beşincisi: Kim Peyğəmbərin ﷺ gətirdiyi bir şeyə nifrət edərsə, hətta ona əməl etsə belə, kafir olar. Dəlil Uca Allahın bu sözüdür:',
            en: 'The fifth: whoever hates anything that the Messenger ﷺ brought, even if he acts upon it, has disbelieved. The evidence is the saying of Allah the Exalted:',
            ru: 'Пятое: кто ненавидит что-либо из того, с чем пришёл Посланник ﷺ, даже если поступает согласно этому, тот стал неверным. Довод — слова Всевышнего Аллаха:',
            ar: 'الخامس: من أبغض شيئًا مما جاء به الرسول ﷺ ولو عمل به كفر، والدليل قوله تعالى:',
            tr: 'Beşincisi: Kim Peygamber’in ﷺ getirdiği bir şeyden nefret ederse, onunla amel etse bile kâfir olur. Delil Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'ذَٰلِكَ بِأَنَّهُمْ كَرِهُوا۟ مَآ أَنزَلَ ٱللَّهُ فَأَحْبَطَ أَعْمَـٰلَهُمْ',
          text: {
            az: 'Bu ona görədir ki, onlar Allahın nazil etdiyini xoşlamadılar, O da onların əməllərini puç etdi.',
            en: 'That is because they disliked what Allah revealed, so He rendered their deeds worthless.',
            ru: 'Это — потому, что они возненавидели то, что ниспослал Аллах, и Он сделал тщетными их деяния.',
            ar: 'ذَٰلِكَ بِأَنَّهُمْ كَرِهُوا۟ مَآ أَنزَلَ ٱللَّهُ فَأَحْبَطَ أَعْمَـٰلَهُمْ',
            tr: 'Bu, onların Allah’ın indirdiğinden hoşlanmamaları sebebiyledir; O da amellerini boşa çıkarmıştır.',
          },
          ref: '47:9',
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Söhbət şəriətin özünə — məsələn, namaza, hicaba, çoxarvadlılığa icazəyə, cəzalara — nifrət etməkdən gedir. Nəfsin bir əməli ağır hiss etməsi (məsələn, soyuq səhər dəstəmaz almaq) isə nifrət deyil, insan təbiətidir.',
            en: 'Explanation: What is meant is hatred of the Shari‘ah itself — for example of the prayer, the hijab, the permission of polygyny, or the legal punishments. The soul finding a deed heavy (such as making wudu on a cold morning) is not hatred; it is human nature.',
            ru: 'Пояснение: Речь о ненависти к самому шариату — например, к намазу, хиджабу, дозволенности многожёнства, наказаниям. Когда же душе тяжело какое-то дело (например, омовение холодным утром), это не ненависть, а человеческая природа.',
            ar: 'شرح: المراد بغض الشرع نفسه كالصلاة أو الحجاب أو إباحة التعدد أو الحدود. أما استثقال النفس لبعض الأعمال كالوضوء في البرد فليس بغضًا، بل هو من طبيعة البشر.',
            tr: 'Açıklama: Kastedilen, şeriatın kendisinden nefret etmektir — örneğin namazdan, tesettürden, çok eşliliğin mubahlığından ya da cezalardan. Nefsin bir ameli ağır bulması (örneğin soğuk bir sabah abdest almak) ise nefret değil, insan tabiatıdır.',
          },
        },
        {
          t: 'p',
          text: {
            az: 'Altıncısı: Kim Peyğəmbərin ﷺ dinindən bir şeyi, yaxud onun savabını və ya cəzasını məsxərəyə qoyarsa, kafir olar. Dəlil Uca Allahın bu sözüdür:',
            en: 'The sixth: whoever mocks anything of the religion of the Messenger ﷺ, or its reward or its punishment, has disbelieved. The evidence is the saying of Allah the Exalted:',
            ru: 'Шестое: кто насмехается над чем-либо из религии Посланника ﷺ, или над наградой, или над наказанием, тот стал неверным. Довод — слова Всевышнего Аллаха:',
            ar: 'السادس: من استهزأ بشيء من دين الرسول ﷺ، أو ثوابه، أو عقابه، كفر، والدليل قوله تعالى:',
            tr: 'Altıncısı: Kim Peygamber’in ﷺ dininden bir şeyle ya da onun sevabıyla veya cezasıyla alay ederse kâfir olur. Delil Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'قُلْ أَبِٱللَّهِ وَءَايَـٰتِهِۦ وَرَسُولِهِۦ كُنتُمْ تَسْتَهْزِءُونَ ۝ لَا تَعْتَذِرُوا۟ قَدْ كَفَرْتُم بَعْدَ إِيمَـٰنِكُمْ',
          text: {
            az: 'De: «Allahı, Onun ayələrini və Elçisini məsxərəyə qoyurdunuz? Üzr istəməyin! Siz iman gətirdikdən sonra kafir oldunuz».',
            en: 'Say: “Was it Allah and His verses and His Messenger that you were mocking?” Make no excuse; you have disbelieved after your belief.',
            ru: 'Скажи: «Неужели вы насмехались над Аллахом, Его аятами и Его Посланником?» Не оправдывайтесь! Вы стали неверными после того, как уверовали.',
            ar: 'قُلْ أَبِٱللَّهِ وَءَايَـٰتِهِۦ وَرَسُولِهِۦ كُنتُمْ تَسْتَهْزِءُونَ ۝ لَا تَعْتَذِرُوا۟ قَدْ كَفَرْتُم بَعْدَ إِيمَـٰنِكُمْ',
            tr: 'De ki: “Allah ile, O’nun ayetleriyle ve Resûlü ile mi alay ediyordunuz?” Özür dilemeyin; imanınızdan sonra kâfir oldunuz.',
          },
          ref: '9:65-66',
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Ayə Təbuk səfərində Peyğəmbəri ﷺ və səhabələri lağa qoyan, sonra isə «biz sadəcə zarafat edirdik» deyən kəslər haqqında nazil olub. Deməli, dinlə zarafat və lağ da ciddi sözün hökmündədir. Dinə hörmətlə yanaşmaq, onunla bağlı zarafatlardan uzaq durmaq lazımdır.',
            en: 'Explanation: The verse was revealed about those who mocked the Prophet ﷺ and the Companions on the expedition of Tabuk and then said “we were only joking”. So joking about and ridiculing the religion has the ruling of serious speech. One must treat the religion with reverence and stay away from jokes about it.',
            ru: 'Пояснение: Аят ниспослан о тех, кто во время похода на Табук насмехался над Пророком ﷺ и сподвижниками, а потом сказал: «Мы лишь шутили». Значит, шутка и насмешка над религией имеют то же суждение, что и серьёзные слова. К религии нужно относиться с почтением и избегать шуток о ней.',
            ar: 'شرح: نزلت الآية في قوم استهزؤوا بالنبي ﷺ وأصحابه في غزوة تبوك ثم قالوا: إنما كنا نخوض ونلعب، فدلّ على أن الهزل بالدين كالجدّ في الحكم، فالواجب تعظيم الدين واجتناب المزاح به.',
            tr: 'Açıklama: Ayet, Tebük seferinde Peygamber ﷺ ve ashabıyla alay eden, sonra da “biz sadece şakalaşıyorduk” diyen kimseler hakkında inmiştir. Demek ki dinle şaka ve alay, ciddi söz hükmündedir. Dine saygıyla yaklaşmak ve onunla ilgili şakalardan uzak durmak gerekir.',
          },
        },
      ],
    },
    {
      id: 'n7-10',
      title: {
        az: '7–10: sehr, müşriklərə dəstək, şəriətdən çıxmaq, üz çevirmək',
        en: '7–10: sorcery, aiding polytheists, exemption from the Shari‘ah, turning away',
        ru: '7–10: колдовство, помощь многобожникам, выход из шариата, отворачивание',
        ar: '٧–١٠: السحر، والمظاهرة، والخروج عن الشريعة، والإعراض',
        tr: '7–10: sihir, müşriklere destek, şeriattan çıkmak, yüz çevirmek',
      },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Yeddincisi: Sehr. Ona «sarf» (sevən iki insanı bir-birindən soyutmaq) və «atf» (insanı istəmədiyi birinə meyl etdirmək) də daxildir. Kim onu edərsə və ya ona razı olarsa, kafir olar. Dəlil Uca Allahın bu sözüdür:',
            en: 'The seventh: sorcery, including as-sarf (turning a person away from one he loves) and al-‘atf (drawing a person to one he does not love). Whoever does it or is pleased with it has disbelieved. The evidence is the saying of Allah the Exalted:',
            ru: 'Седьмое: колдовство, в том числе «сарф» (отвращение человека от того, кого он любит) и «атф» (привлечение человека к тому, кого он не любит). Кто занимается им или доволен им, тот стал неверным. Довод — слова Всевышнего Аллаха:',
            ar: 'السابع: السحر، ومنه الصَّرف والعَطف، فمن فعله أو رضي به كفر، والدليل قوله تعالى:',
            tr: 'Yedincisi: Sihir. “Sarf” (kişiyi sevdiğinden soğutmak) ve “atf” (kişiyi sevmediği birine meylettirmek) de buna dahildir. Kim onu yapar ya da ona razı olursa kâfir olur. Delil Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'وَمَا يُعَلِّمَانِ مِنْ أَحَدٍ حَتَّىٰ يَقُولَآ إِنَّمَا نَحْنُ فِتْنَةٌ فَلَا تَكْفُرْ',
          text: {
            az: 'Onlar (iki mələk) heç kəsə: «Biz ancaq bir sınağıq, kafir olma!» – deməmiş heç nə öyrətmirdilər.',
            en: 'But the two [angels] do not teach anyone unless they say: “We are only a trial, so do not disbelieve.”',
            ru: 'Но они (два ангела) никого не обучали, не сказав: «Мы — лишь искушение, не становись же неверующим!»',
            ar: 'وَمَا يُعَلِّمَانِ مِنْ أَحَدٍ حَتَّىٰ يَقُولَآ إِنَّمَا نَحْنُ فِتْنَةٌ فَلَا تَكْفُرْ',
            tr: 'O ikisi (iki melek) “Biz ancak bir imtihanız, sakın kâfir olma!” demedikçe kimseye bir şey öğretmezlerdi.',
          },
          ref: '2:102',
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Sehr şeytanlara yaxınlaşmadan və onlara ibadətdən ayrılmır. Sehrbaza müraciət edib ondan sehr açdırmaq və ya kiməsə sehr etdirmək də haramdır; sehrdən qorunmaq və müalicə üçün şəri rüqyə ilə bağlı «Rüqyə» dərsinə bax.',
            en: 'Explanation: Sorcery cannot be separated from seeking closeness to devils and worshipping them. Going to a sorcerer to undo magic or to have magic done to someone is also forbidden; for protection and treatment with the Shar‘i ruqyah, see the lesson “Ruqyah”.',
            ru: 'Пояснение: Колдовство неотделимо от приближения к шайтанам и поклонения им. Обращение к колдуну, чтобы снять колдовство или навести его на кого-то, также запрещено; о защите и лечении шариатской рукьей см. урок «Рукья».',
            ar: 'شرح: السحر لا يتأتّى إلا بالتقرب إلى الشياطين وعبادتهم، ويحرم الذهاب إلى السحرة لحلّ السحر أو لعمله. وللوقاية والعلاج بالرقية الشرعية انظر درس «الرقية».',
            tr: 'Açıklama: Sihir, şeytanlara yaklaşmak ve onlara ibadet etmekten ayrı düşünülemez. Büyüyü bozdurmak ya da birine büyü yaptırmak için büyücüye gitmek de haramdır; korunma ve şer‘î rukye ile tedavi için “Rukye” dersine bakınız.',
          },
        },
        {
          t: 'p',
          text: {
            az: 'Səkkizincisi: Müşriklərə arxa durmaq və müsəlmanlara qarşı onlara kömək etmək. Dəlil Uca Allahın bu sözüdür:',
            en: 'The eighth: backing the polytheists and helping them against the Muslims. The evidence is the saying of Allah the Exalted:',
            ru: 'Восьмое: поддержка многобожников и помощь им против мусульман. Довод — слова Всевышнего Аллаха:',
            ar: 'الثامن: مظاهرة المشركين ومعاونتهم على المسلمين، والدليل قوله تعالى:',
            tr: 'Sekizincisi: Müşriklere arka çıkmak ve Müslümanlara karşı onlara yardım etmek. Delil Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'وَمَن يَتَوَلَّهُم مِّنكُمْ فَإِنَّهُۥ مِنْهُمْ ۗ إِنَّ ٱللَّهَ لَا يَهْدِى ٱلْقَوْمَ ٱلظَّـٰلِمِينَ',
          text: {
            az: 'Sizdən kim onları dost tutarsa, o da onlardandır. Həqiqətən, Allah zalım qövmü doğru yola yönəltməz.',
            en: 'And whoever is an ally to them among you — then indeed, he is of them. Indeed, Allah does not guide the wrongdoing people.',
            ru: 'Кто из вас берёт их в покровители, тот сам из них. Воистину, Аллах не ведёт прямым путём несправедливых людей.',
            ar: 'وَمَن يَتَوَلَّهُم مِّنكُمْ فَإِنَّهُۥ مِنْهُمْ ۗ إِنَّ ٱللَّهَ لَا يَهْدِى ٱلْقَوْمَ ٱلظَّـٰلِمِينَ',
            tr: 'Sizden kim onları dost edinirse, o da onlardandır. Şüphesiz Allah zalimler topluluğunu doğru yola iletmez.',
          },
          ref: '5:51',
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Alimlər burada fərq qoyurlar: kafirlərə dinlərinə sevgi ilə müsəlmanlara qarşı kömək etmək bu pozandır; ticarət, müqavilə, ədalətli rəftar və yaxşılıq isə buraya daxil deyil. Hatib ibn Əbi Bəltəənin hadisəsi (Buxari 3007) göstərir ki, hər səhv addım dərhal küfr hökmü almır — Peyğəmbər ﷺ onun üzrünü dinlədi.',
            en: 'Explanation: Scholars distinguish here: helping the disbelievers against the Muslims out of love for their religion is this nullifier, while trade, treaties, just dealing and kindness are not included. The incident of Hatib ibn Abi Balta‘ah (al-Bukhari 3007) shows that not every wrong step immediately takes the ruling of disbelief — the Prophet ﷺ heard his excuse.',
            ru: 'Пояснение: Учёные проводят различие: помощь неверным против мусульман из любви к их религии — это нарушитель, а торговля, договоры, справедливое отношение и доброта сюда не входят. Случай Хатыба ибн Абу Бальтаа (аль-Бухари 3007) показывает, что не всякий неверный шаг сразу получает суждение о неверии: Пророк ﷺ выслушал его оправдание.',
            ar: 'شرح: يفرّق العلماء هنا: فمظاهرة الكفار على المسلمين محبةً لدينهم هي هذا الناقض، أما البيع والشراء والعهود والعدل والإحسان فليست منه. وفي قصة حاطب بن أبي بلتعة (البخاري 3007) أن النبي ﷺ استفصل منه وقبل عذره، فليس كل خطأ يُحكم على صاحبه بالكفر مباشرة.',
            tr: 'Açıklama: Âlimler burada ayrım yapar: Kâfirlere dinlerini sevdiği için Müslümanlara karşı yardım etmek bu bozandır; ticaret, antlaşma, adaletli muamele ve iyilik ise buna girmez. Hâtıb b. Ebî Belte’a olayı (Buhârî 3007), her yanlış adımın hemen küfür hükmü almadığını gösterir — Peygamber ﷺ onun mazeretini dinlemiştir.',
          },
        },
        {
          t: 'p',
          text: {
            az: 'Doqquzuncusu: Kim bəzi insanların Muhəmmədin ﷺ şəriətindən çıxa biləcəyinə inanarsa — Xızırın Musanın (əleyhissəlam) şəriətindən kənarda qala bildiyi kimi — o, kafirdir.',
            en: 'The ninth: whoever believes that some people may go outside the Shari‘ah of Muhammad ﷺ, just as al-Khidr was able to be outside the Shari‘ah of Musa (peace be upon him), is a disbeliever.',
            ru: 'Девятое: кто считает, что некоторым людям позволено выйти за пределы шариата Мухаммада ﷺ, как аль-Хидру было позволено быть вне шариата Мусы (мир ему), тот неверный.',
            ar: 'التاسع: من اعتقد أن بعض الناس يسعه الخروج عن شريعة محمد ﷺ، كما وسع الخضرَ الخروجُ عن شريعة موسى عليه السلام، فهو كافر.',
            tr: 'Dokuzuncusu: Kim bazı insanların Muhammed’in ﷺ şeriatından çıkabileceğine inanırsa — Hızır’ın Musa’nın (aleyhisselam) şeriatı dışında kalabildiği gibi — o kâfirdir.',
          },
        },
        {
          t: 'ayah',
          ar: 'قُلْ يَـٰٓأَيُّهَا ٱلنَّاسُ إِنِّى رَسُولُ ٱللَّهِ إِلَيْكُمْ جَمِيعًا',
          text: {
            az: 'De: «Ey insanlar! Mən sizin hamınıza Allahın Elçisiyəm».',
            en: 'Say: “O mankind, indeed I am the Messenger of Allah to you all.”',
            ru: 'Скажи: «О люди! Я — Посланник Аллаха ко всем вам».',
            ar: 'قُلْ يَـٰٓأَيُّهَا ٱلنَّاسُ إِنِّى رَسُولُ ٱللَّهِ إِلَيْكُمْ جَمِيعًا',
            tr: 'De ki: “Ey insanlar! Şüphesiz ben, Allah’ın hepinize gönderdiği elçisiyim.”',
          },
          ref: '7:158',
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Musa (əleyhissəlam) yalnız öz qövmünə göndərilmişdi, ona görə Xızır onun şəriətinə tabe olmağa borclu deyildi. Muhəmməd ﷺ isə bütün insanlara və cinlərə göndərilib; heç bir «övliya», «şeyx» və ya «arif» namazdan, orucdan və ya halal-haram hökmlərindən azad deyil.',
            en: 'Explanation: Musa (peace be upon him) was sent only to his own people, so al-Khidr was not obliged to follow his law. Muhammad ﷺ, however, was sent to all mankind and jinn; no “saint”, “shaykh” or “gnostic” is exempt from prayer, fasting, or the rulings of halal and haram.',
            ru: 'Пояснение: Муса (мир ему) был послан только к своему народу, поэтому аль-Хидр не был обязан следовать его закону. Мухаммад ﷺ же послан ко всем людям и джиннам; ни один «святой», «шейх» или «познавший» не освобождён от намаза, поста или от положений дозволенного и запретного.',
            ar: 'شرح: كان موسى عليه السلام مبعوثًا إلى قومه خاصة، فلم يلزم الخضرَ اتباعُه، أما محمد ﷺ فمبعوث إلى الثقلين عامة، فلا يخرج أحد — وليًّا أو شيخًا أو «عارفًا» — عن الصلاة والصيام وأحكام الحلال والحرام.',
            tr: 'Açıklama: Musa (aleyhisselam) sadece kendi kavmine gönderilmişti; bu yüzden Hızır onun şeriatına uymakla yükümlü değildi. Muhammed ﷺ ise bütün insanlara ve cinlere gönderilmiştir; hiçbir “veli”, “şeyh” veya “ârif” namazdan, oruçtan ya da helal-haram hükümlerinden muaf değildir.',
          },
        },
        {
          t: 'p',
          text: {
            az: 'Onuncusu: Allahın dinindən üz çevirmək — onu öyrənməmək və ona əməl etməmək. Dəlil Uca Allahın bu sözüdür:',
            en: 'The tenth: turning away from the religion of Allah, neither learning it nor acting upon it. The evidence is the saying of Allah the Exalted:',
            ru: 'Десятое: отворачивание от религии Аллаха — когда человек не изучает её и не следует ей. Довод — слова Всевышнего Аллаха:',
            ar: 'العاشر: الإعراض عن دين الله، لا يتعلمه ولا يعمل به، والدليل قوله تعالى:',
            tr: 'Onuncusu: Allah’ın dininden yüz çevirmek — onu öğrenmemek ve onunla amel etmemek. Delil Yüce Allah’ın şu sözüdür:',
          },
        },
        {
          t: 'ayah',
          ar: 'وَمَنْ أَظْلَمُ مِمَّن ذُكِّرَ بِـَٔايَـٰتِ رَبِّهِۦ ثُمَّ أَعْرَضَ عَنْهَآ ۚ إِنَّا مِنَ ٱلْمُجْرِمِينَ مُنتَقِمُونَ',
          text: {
            az: 'Rəbbinin ayələri ilə öyüd-nəsihət verildikdən sonra onlardan üz çevirəndən daha zalım kim ola bilər? Həqiqətən, Biz günahkarlardan intiqam alacağıq.',
            en: 'And who is more unjust than one who is reminded of the verses of his Lord, then turns away from them? Indeed, We will take retribution from the criminals.',
            ru: 'Кто может быть несправедливее того, кому напомнили об аятах его Господа, а он отвернулся от них? Воистину, Мы отомстим грешникам.',
            ar: 'وَمَنْ أَظْلَمُ مِمَّن ذُكِّرَ بِـَٔايَـٰتِ رَبِّهِۦ ثُمَّ أَعْرَضَ عَنْهَآ ۚ إِنَّا مِنَ ٱلْمُجْرِمِينَ مُنتَقِمُونَ',
            tr: 'Rabbinin ayetleriyle öğüt verildikten sonra onlardan yüz çevirenden daha zalim kim olabilir? Şüphesiz biz suçlulardan intikam alacağız.',
          },
          ref: '32:22',
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Burada insanı müsəlman edən əsaslardan — tövhiddən və dinin əsasından — tamamilə üz çevirmək nəzərdə tutulur; dinin təfərrüatlarını bilməmək deyil. Hər müsəlman ən azı imanının əsaslarını və vacib əməllərini öyrənməlidir; bunun üçün «Üç əsas» dərsi yaxşı başlanğıcdır.',
            en: 'Explanation: What is meant is turning away completely from the foundations that make a person Muslim — tawhid and the basis of the religion — not ignorance of its details. Every Muslim must learn at least the foundations of his faith and his obligatory deeds; the lesson “The Three Fundamental Principles” is a good start.',
            ru: 'Пояснение: Имеется в виду полное отворачивание от основ, делающих человека мусульманином, — таухида и основы религии, — а не незнание её подробностей. Каждый мусульманин должен изучить хотя бы основы своей веры и обязательные дела; хорошее начало — урок «Три основы».',
            ar: 'شرح: المراد الإعراض التام عن أصل الدين الذي يصير به العبد مسلمًا، وهو التوحيد، لا الجهل بتفاصيل الشرائع. والواجب على كل مسلم أن يتعلم أصول إيمانه وما يلزمه من الواجبات، ومن أحسن البدايات درس «الأصول الثلاثة».',
            tr: 'Açıklama: Kastedilen, insanı Müslüman yapan esaslardan — tevhitten ve dinin aslından — tamamen yüz çevirmektir; dinin ayrıntılarını bilmemek değil. Her Müslüman en azından imanının esaslarını ve farz amellerini öğrenmelidir; bunun için “Üç Esas” dersi iyi bir başlangıçtır.',
          },
        },
      ],
    },
    {
      id: 'closing',
      title: {
        az: 'Risalənin sonu',
        en: 'Conclusion of the treatise',
        ru: 'Завершение трактата',
        ar: 'خاتمة الرسالة',
        tr: 'Risalenin sonu',
      },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Bütün bu pozanlarda zarafat edənlə ciddi olan və qorxan arasında fərq yoxdur — yalnız məcbur edilən istisnadır. Bunların hamısı təhlükəsi ən böyük olan və ən çox baş verən şeylərdəndir. Müsəlman onlardan çəkinməli və özü üçün onlardan qorxmalıdır. Allahın qəzəbinə və ağrılı əzabına səbəb olan şeylərdən Allaha sığınırıq. Allahın salavatı və salamı məxluqatının ən xeyirlisi Muhəmmədə, onun ailəsinə və səhabələrinə olsun.',
            en: 'In all of these nullifiers there is no difference between one who jokes, one who is serious, and one who is afraid — except the one who is coerced. All of them are among the gravest in danger and the most frequent in occurrence, so a Muslim should beware of them and fear them for himself. We seek refuge in Allah from what brings His anger and His painful punishment. May Allah send blessings and peace upon the best of His creation, Muhammad, his family and his companions.',
            ru: 'Во всех этих нарушителях нет разницы между шутящим, говорящим всерьёз и боящимся — кроме принуждённого. Все они — из самого опасного и самого частого, поэтому мусульманину следует остерегаться их и бояться их для себя. Прибегаем к Аллаху от того, что навлекает Его гнев и мучительное наказание. Да благословит Аллах лучшего из Своих творений — Мухаммада, его семью и сподвижников — и да приветствует.',
            ar: 'ولا فرق في جميع هذه النواقض بين الهازل والجادّ والخائف، إلا المُكرَه. وكلها من أعظم ما يكون خطرًا، وأكثر ما يكون وقوعًا، فينبغي للمسلم أن يحذرها ويخاف منها على نفسه. نعوذ بالله من موجبات غضبه وأليم عقابه، وصلى الله على خير خلقه محمد وعلى آله وصحبه وسلم.',
            tr: 'Bütün bu bozanlarda şaka yapanla ciddi olan ve korkan arasında fark yoktur — yalnızca zorlanan müstesnadır. Bunların hepsi tehlikesi en büyük ve en sık meydana gelen şeylerdendir. Müslüman onlardan sakınmalı ve kendisi için onlardan korkmalıdır. Allah’ın gazabını ve elem verici azabını gerektiren şeylerden Allah’a sığınırız. Allah’ın salâtı ve selamı yaratılmışların en hayırlısı Muhammed’e, ailesine ve ashabına olsun.',
          },
        },
        {
          t: 'ayah',
          ar: 'مَن كَفَرَ بِٱللَّهِ مِنۢ بَعْدِ إِيمَـٰنِهِۦٓ إِلَّا مَنْ أُكْرِهَ وَقَلْبُهُۥ مُطْمَئِنٌّۢ بِٱلْإِيمَـٰنِ',
          text: {
            az: 'İman gətirdikdən sonra Allahı inkar edən — qəlbi imanla rahat olduğu halda məcbur edilən istisna olmaqla…',
            en: 'Whoever disbelieves in Allah after his belief — except one who is forced while his heart is secure in faith…',
            ru: 'Кто отрёкся от Аллаха после того, как уверовал, — кроме того, кого принудили, тогда как его сердце спокойно в вере…',
            ar: 'مَن كَفَرَ بِٱللَّهِ مِنۢ بَعْدِ إِيمَـٰنِهِۦٓ إِلَّا مَنْ أُكْرِهَ وَقَلْبُهُۥ مُطْمَئِنٌّۢ بِٱلْإِيمَـٰنِ',
            tr: 'İman ettikten sonra Allah’ı inkâr eden — kalbi imanla dolu olduğu hâlde zorlanan müstesna…',
          },
          ref: '16:106',
        },
        {
          t: 'note',
          kind: 'tip',
          text: {
            az: 'İzah: Ayə məcbur edilənin istisna olduğuna dəlildir: həyatına real təhlükə ilə küfr sözü deməyə vadar edilən, qəlbi isə imanla rahat olan şəxs kafir olmur. «Qorxan» dedikdə müəllif mal, vəzifə və ya insanların danlağından qorxaraq küfrə razılaşan şəxsi nəzərdə tutur — bu qorxu üzr deyil.',
            en: 'Explanation: The verse is evidence that the coerced is excepted: one forced under real threat to his life to utter words of disbelief, while his heart is at rest with faith, does not become a disbeliever. By “one who is afraid” the author means one who agrees to disbelief fearing for his wealth, position or people’s blame — that fear is not an excuse.',
            ru: 'Пояснение: Аят — довод того, что принуждённый исключён: тот, кого под реальной угрозой жизни заставили произнести слова неверия, а сердце его спокойно в вере, не становится неверным. Под «боящимся» автор имеет в виду того, кто соглашается на неверие, опасаясь за имущество, положение или упрёки людей, — такой страх не оправдание.',
            ar: 'شرح: الآية دليل على استثناء المُكرَه، وهو من أُكره بتهديد حقيقي على قول الكفر وقلبه مطمئن بالإيمان. والمراد بـ«الخائف» من وافق على الكفر خوفًا على ماله أو جاهه أو من لوم الناس، فهذا ليس بعذر.',
            tr: 'Açıklama: Ayet, zorlananın istisna olduğuna delildir: canına yönelik gerçek bir tehditle küfür sözü söylemeye zorlanan ve kalbi imanla huzurlu olan kişi kâfir olmaz. Müellifin “korkan” sözüyle kastettiği, malını, makamını ya da insanların kınamasını düşünerek küfre razı olan kimsedir — bu korku mazeret değildir.',
          },
        },
      ],
    },
    {
      id: 'takfir',
      title: {
        az: 'Təkfirin şərtləri və maneələri',
        en: 'Conditions and preventers of takfir',
        ru: 'Условия и препятствия такфира',
        ar: 'شروط التكفير وموانعه',
        tr: 'Tekfirin şartları ve engelleri',
      },
      blocks: [
        {
          t: 'p',
          text: {
            az: 'Əhli-Sünnə alimləri iki şeyi ayırırlar: 1) ümumi hökm — «filan söz və ya əməl küfrdür»; 2) müəyyən şəxsə hökm — «filan adam kafirdir». Birincisi dəlillərlə sabitdir; ikincisi isə şərtlərin tapılmasını və maneələrin olmamasını tələb edir. Şeyxülislam İbn Teymiyyə və ondan sonrakı alimlər bunu dəfələrlə vurğulayıblar.',
            en: 'The scholars of Ahl as-Sunnah distinguish two things: 1) the general ruling — “such a word or deed is disbelief”; 2) the ruling on a specific person — “so-and-so is a disbeliever”. The first is established by the evidence; the second requires that the conditions be met and the preventers be absent. Shaykh al-Islam Ibn Taymiyyah and the scholars after him stressed this repeatedly.',
            ru: 'Учёные ахлю-с-сунна различают две вещи: 1) общее суждение — «такое слово или дело является неверием»; 2) суждение о конкретном человеке — «такой-то — неверный». Первое установлено доводами; второе требует наличия условий и отсутствия препятствий. Шейх аль-ислам Ибн Таймийя и учёные после него неоднократно подчёркивали это.',
            ar: 'يفرّق علماء أهل السنة بين أمرين: الحكم العام بأن هذا القول أو الفعل كفر، والحكم على المعيّن بأنه كافر. فالأول ثابت بالأدلة، والثاني لا يكون إلا بتحقق الشروط وانتفاء الموانع، كما قرّره شيخ الإسلام ابن تيمية ومن بعده من العلماء.',
            tr: 'Ehl-i Sünnet âlimleri iki şeyi birbirinden ayırır: 1) genel hüküm — “şu söz veya amel küfürdür”; 2) belirli kişi hakkında hüküm — “falanca kâfirdir”. Birincisi delillerle sabittir; ikincisi ise şartların bulunmasını ve engellerin olmamasını gerektirir. Şeyhülislam İbn Teymiyye ve ondan sonraki âlimler bunu defalarca vurgulamıştır.',
          },
        },
        {
          t: 'table',
          head: [
            {
              az: 'Maneə',
              en: 'Preventer',
              ru: 'Препятствие',
              ar: 'المانع',
              tr: 'Engel',
            },
            {
              az: 'Mənası',
              en: 'Meaning',
              ru: 'Смысл',
              ar: 'معناه',
              tr: 'Anlamı',
            },
            {
              az: 'Dəlil',
              en: 'Evidence',
              ru: 'Довод',
              ar: 'الدليل',
              tr: 'Delil',
            },
          ],
          rows: [
            [
              {
                az: 'Cəhalət',
                en: 'Ignorance',
                ru: 'Незнание',
                ar: 'الجهل',
                tr: 'Cehalet',
              },
              {
                az: 'Hökmü öyrənmək imkanı olmayan, ona dəlil çatmamış şəxs',
                en: 'One to whom the proof has not reached and who had no means to learn the ruling',
                ru: 'Тот, до кого не дошёл довод и у кого не было возможности узнать суждение',
                ar: 'من لم تبلغه الحجة ولم يتمكن من معرفة الحكم',
                tr: 'Kendisine delil ulaşmamış ve hükmü öğrenme imkânı olmamış kişi',
              },
              {
                az: 'İsra 17:15',
                en: 'al-Isra 17:15',
                ru: 'аль-Исра 17:15',
                ar: 'الإسراء: 15',
                tr: 'İsrâ 17:15',
              },
            ],
            [
              {
                az: 'Xəta',
                en: 'Error',
                ru: 'Ошибка',
                ar: 'الخطأ',
                tr: 'Hata',
              },
              {
                az: 'Dilinin sürüşməsi və ya niyyət etmədən deyilən söz',
                en: 'A slip of the tongue or words said without intending them',
                ru: 'Оговорка или слова, сказанные без намерения',
                ar: 'سبق اللسان أو القول بلا قصد',
                tr: 'Dil sürçmesi ya da kastetmeden söylenen söz',
              },
              {
                az: 'Əhzab 33:5; Müslim 2747',
                en: 'al-Ahzab 33:5; Muslim 2747',
                ru: 'аль-Ахзаб 33:5; Муслим 2747',
                ar: 'الأحزاب: 5؛ مسلم 2747',
                tr: 'Ahzâb 33:5; Müslim 2747',
              },
            ],
            [
              {
                az: 'Məcburiyyət',
                en: 'Coercion',
                ru: 'Принуждение',
                ar: 'الإكراه',
                tr: 'Zorlama',
              },
              {
                az: 'Real təhlükə altında, qəlbi imanla rahat olaraq',
                en: 'Under real threat, while the heart is at rest with faith',
                ru: 'Под реальной угрозой, когда сердце спокойно в вере',
                ar: 'تحت تهديد حقيقي مع اطمئنان القلب بالإيمان',
                tr: 'Gerçek tehdit altında, kalp imanla huzurluyken',
              },
              {
                az: 'Nəhl 16:106',
                en: 'an-Nahl 16:106',
                ru: 'ан-Нахль 16:106',
                ar: 'النحل: 106',
                tr: 'Nahl 16:106',
              },
            ],
            [
              {
                az: 'Təvil',
                en: 'Interpretation (ta’wil)',
                ru: 'Толкование (таъвиль)',
                ar: 'التأويل',
                tr: 'Te’vil',
              },
              {
                az: 'Dəlili səhv anlamaqdan doğan, inadsız şübhə',
                en: 'A doubt arising from misunderstanding evidence, without obstinacy',
                ru: 'Сомнение из-за неверного понимания довода, без упрямства',
                ar: 'شبهة ناشئة عن فهم خاطئ للدليل من غير عناد',
                tr: 'Delili yanlış anlamaktan doğan, inatsız şüphe',
              },
              {
                az: 'Əhzab 33:5',
                en: 'al-Ahzab 33:5',
                ru: 'аль-Ахзаб 33:5',
                ar: 'الأحزاب: 5',
                tr: 'Ahzâb 33:5',
              },
            ],
          ],
        },
        {
          t: 'ayah',
          ar: 'وَمَا كُنَّا مُعَذِّبِينَ حَتَّىٰ نَبْعَثَ رَسُولًا',
          text: {
            az: 'Biz bir elçi göndərməyincə (heç kəsə) əzab vermərik.',
            en: 'And never would We punish until We sent a messenger.',
            ru: 'Мы не наказываем, пока не отправим посланника.',
            ar: 'وَمَا كُنَّا مُعَذِّبِينَ حَتَّىٰ نَبْعَثَ رَسُولًا',
            tr: 'Biz bir peygamber göndermedikçe (kimseye) azap etmeyiz.',
          },
          ref: '17:15',
        },
        {
          t: 'ayah',
          ar: 'وَلَيْسَ عَلَيْكُمْ جُنَاحٌ فِيمَآ أَخْطَأْتُم بِهِۦ وَلَـٰكِن مَّا تَعَمَّدَتْ قُلُوبُكُمْ',
          text: {
            az: 'Səhv etdiyiniz şeydə sizə günah yoxdur, lakin qəlblərinizin qəsdən etdiyi şeydə (günah var).',
            en: 'And there is no blame upon you for that in which you have erred, but [only for] what your hearts intended.',
            ru: 'Нет на вас греха в том, в чём вы ошиблись, но есть в том, что умышляли ваши сердца.',
            ar: 'وَلَيْسَ عَلَيْكُمْ جُنَاحٌ فِيمَآ أَخْطَأْتُم بِهِۦ وَلَـٰكِن مَّا تَعَمَّدَتْ قُلُوبُكُمْ',
            tr: 'Yanıldığınız şeyde size bir günah yoktur; fakat kalplerinizin kasten yaptığında (günah vardır).',
          },
          ref: '33:5',
        },
        {
          t: 'hadith',
          ar: 'لَلَّهُ أَشَدُّ فَرَحًا بِتَوْبَةِ عَبْدِهِ… ثُمَّ قَالَ مِنْ شِدَّةِ الْفَرَحِ: اللَّهُمَّ أَنْتَ عَبْدِي وَأَنَا رَبُّكَ. أَخْطَأَ مِنْ شِدَّةِ الْفَرَحِ',
          text: {
            az: 'Səhrada itmiş dəvəsini tapan adam haqqında Peyğəmbər ﷺ buyurdu: «…sonra sevincin şiddətindən dedi: “Allahım, Sən mənim qulumsan, mən də Sənin Rəbbinəm!” Sevincin şiddətindən səhv etdi».',
            en: 'About the man who found his lost camel in the desert, the Prophet ﷺ said: “…then, out of intense joy, he said: ‘O Allah, You are my servant and I am Your lord!’ He erred out of intense joy.”',
            ru: 'О человеке, нашедшем в пустыне свою потерянную верблюдицу, Пророк ﷺ сказал: «…и от сильной радости он сказал: “О Аллах, Ты — мой раб, а я — Твой господь!” Он ошибся от сильной радости».',
            ar: 'في الرجل الذي وجد راحلته بعد أن أيس منها، فأخطأ من شدة الفرح.',
            tr: 'Çölde kaybettiği devesini bulan adam hakkında Peygamber ﷺ şöyle buyurdu: “…sonra sevincinin şiddetinden: ‘Allah’ım, Sen benim kulumsun, ben de Senin rabbinim!’ dedi. Sevincin şiddetinden yanıldı.”',
          },
          src: {
            az: 'Müslim 2747',
            en: 'Muslim 2747',
            ru: 'Муслим 2747',
            ar: 'مسلم 2747',
            tr: 'Müslim 2747',
          },
          grade: {
            az: 'Səhih',
            en: 'Sahih',
            ru: 'Достоверный',
            ar: 'صحيح',
            tr: 'Sahih',
          },
        },
        {
          t: 'hadith',
          ar: 'أَيُّمَا رَجُلٍ قَالَ لِأَخِيهِ: يَا كَافِرُ، فَقَدْ بَاءَ بِهَا أَحَدُهُمَا',
          text: {
            az: '«Hansı bir adam qardaşına “Ey kafir!” desə, bu (söz) ikisindən birinə qayıdar».',
            en: '“Whoever says to his brother, ‘O disbeliever!’, then it returns upon one of them.”',
            ru: '«Если человек скажет своему брату: “О неверный!”, — то это вернётся к одному из них».',
            ar: 'تحذير شديد من رمي المسلم بالكفر بغير حق.',
            tr: '“Kim kardeşine ‘Ey kâfir!’ derse, bu söz ikisinden birine döner.”',
          },
          src: {
            az: 'Buxari 6104, Müslim 60',
            en: 'al-Bukhari 6104, Muslim 60',
            ru: 'аль-Бухари 6104, Муслим 60',
            ar: 'البخاري 6104، مسلم 60',
            tr: 'Buhârî 6104, Müslim 60',
          },
          grade: {
            az: 'Səhih',
            en: 'Sahih',
            ru: 'Достоверный',
            ar: 'صحيح',
            tr: 'Sahih',
          },
        },
        {
          t: 'note',
          kind: 'warn',
          text: {
            az: 'Müəyyən bir şəxsi və ya qrupu kafir elan etmək adi müsəlmanın işi deyil — bu, dəlilləri və şəraiti araşdıran alimlərin və şəri məhkəmənin işidir. Bu dərsin məqsədi özümüzü qorumaq, tövhidi öyrənmək və başqalarına hikmətlə nəsihət etməkdir.',
            en: 'Declaring a specific person or group to be disbelievers is not the job of an ordinary Muslim — it belongs to scholars who examine the evidence and circumstances, and to a Shari‘ah court. The purpose of this lesson is to protect ourselves, to learn tawhid, and to advise others with wisdom.',
            ru: 'Объявлять конкретного человека или группу неверными — не дело обычного мусульманина; это дело учёных, изучающих доводы и обстоятельства, и шариатского суда. Цель этого урока — оберегать себя, изучать таухид и мудро наставлять других.',
            ar: 'تكفير المعيّن من الأشخاص أو الجماعات ليس من شأن آحاد المسلمين، وإنما هو من شأن العلماء الذين ينظرون في الأدلة والأحوال، ومن شأن القضاء الشرعي. والمقصود من هذا الدرس أن نحذر على أنفسنا، ونتعلم التوحيد، وننصح غيرنا بالحكمة.',
            tr: 'Belirli bir kişiyi veya grubu tekfir etmek sıradan bir Müslümanın işi değildir — bu, delilleri ve şartları inceleyen âlimlerin ve şer‘î mahkemenin işidir. Bu dersin amacı kendimizi korumak, tevhidi öğrenmek ve başkalarına hikmetle nasihat etmektir.',
          },
        },
      ],
    },
    {
      id: 'faq',
      title: {
        az: 'Tez-tez verilən suallar',
        en: 'Frequently asked questions',
        ru: 'Частые вопросы',
        ar: 'أسئلة شائعة',
        tr: 'Sık sorulan sorular',
      },
      blocks: [
        {
          t: 'qa',
          items: [
            {
              q: {
                az: 'Bu pozanlardan birinə düşən şəxs nə etməlidir?',
                en: 'What should someone who fell into one of these nullifiers do?',
                ru: 'Что делать тому, кто впал в один из этих нарушителей?',
                ar: 'ماذا يفعل من وقع في شيء من هذه النواقض؟',
                tr: 'Bu bozanlardan birine düşen kişi ne yapmalıdır?',
              },
              a: {
                az: 'Dərhal səmimi tövbə etməli, o əməli tərk etməli və iki şəhadəti təzələməlidir. Allah tövbə edənin tövbəsini qəbul edir; şirk də daxil olmaqla, ölümdən əvvəl edilən səmimi tövbə bütün günahları silir. Ətraflı: «Tövbə» dərsi.',
                en: 'He should immediately make sincere repentance, abandon the act and renew the two testimonies. Allah accepts the repentance of the one who repents; sincere repentance before death wipes out every sin, including shirk. In detail: the lesson “Repentance”.',
                ru: 'Ему следует немедленно искренне покаяться, оставить этот поступок и обновить два свидетельства. Аллах принимает покаяние кающегося; искреннее покаяние до смерти стирает любой грех, включая ширк. Подробно: урок «Покаяние».',
                ar: 'عليه أن يبادر بالتوبة النصوح، ويترك ذلك العمل، ويجدد الشهادتين، والله يقبل التوبة من عباده، والتوبة الصادقة قبل الموت تمحو كل ذنب حتى الشرك. وتفصيله في درس «التوبة».',
                tr: 'Hemen samimi bir tövbe etmeli, o ameli bırakmalı ve kelime-i şehadeti yenilemelidir. Allah tövbe edenin tövbesini kabul eder; ölümden önce yapılan samimi tövbe, şirk dahil bütün günahları siler. Ayrıntısı: “Tövbe” dersi.',
              },
            },
            {
              q: {
                az: 'Böyük günah işləyən müsəlman kafir olurmu?',
                en: 'Does a Muslim who commits a major sin become a disbeliever?',
                ru: 'Становится ли неверным мусульманин, совершивший тяжкий грех?',
                ar: 'هل يكفر المسلم بفعل الكبيرة؟',
                tr: 'Büyük günah işleyen Müslüman kâfir olur mu?',
              },
              a: {
                az: 'Xeyr. Əhli-Sünnəyə görə zina, içki, oğurluq kimi böyük günahlar — onları halal saymadıqca — insanı İslamdan çıxarmır; onların sahibi imanı azalmış günahkar möminidir. Böyük günaha görə təkfir xəvaricin yoludur.',
                en: 'No. According to Ahl as-Sunnah, major sins like fornication, drinking and theft — as long as one does not deem them lawful — do not take a person out of Islam; the one who commits them is a sinful believer with deficient faith. Takfir for major sins is the way of the Khawarij.',
                ru: 'Нет. Согласно ахлю-с-сунна, тяжкие грехи, такие как прелюбодеяние, пьянство и воровство, если человек не считает их дозволенными, не выводят из ислама; совершающий их — грешный верующий с ослабленной верой. Такфир за тяжкие грехи — путь хариджитов.',
                ar: 'لا؛ فعند أهل السنة لا يخرج مرتكب الكبيرة كالزنا وشرب الخمر والسرقة من الإسلام ما لم يستحلّها، بل هو مؤمن ناقص الإيمان فاسق بكبيرته، والتكفير بالكبائر مذهب الخوارج.',
                tr: 'Hayır. Ehl-i Sünnet’e göre zina, içki, hırsızlık gibi büyük günahlar — helal saymadıkça — insanı İslam’dan çıkarmaz; bunları işleyen, imanı eksik günahkâr bir mümindir. Büyük günah sebebiyle tekfir, Hâricîlerin yoludur.',
              },
            },
          ],
        },
      ],
    },
  ],
  sources: [
    {
      label: 'Muhammad ibn Abd al-Wahhab — Nawaqid al-Islam (نواقض الإسلام)',
    },
    {
      label: 'Abd al-Aziz ibn Baz — Sharh Nawaqid al-Islam (شرح نواقض الإسلام)',
    },
    {
      label: 'Salih al-Fawzan — Sharh Nawaqid al-Islam',
    },
    {
      label: 'Quran text (Uthmani): api.quran.com',
      url: 'https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=5',
    },
    {
      label: 'Sahih al-Bukhari 6104 (hadith-api)',
      url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari/6104.json',
    },
    {
      label: 'Sahih Muslim 2747 (hadith-api)',
      url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-muslim.min.json',
    },
  ],
}
