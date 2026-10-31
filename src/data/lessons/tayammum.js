// Təyəmmüm — dəlilləri ilə. Hədis nömrələri fawazahmed0/hadith-api ilə yoxlanılıb
// (Müslim — Fuad Abdülbaqi nömrələnməsi). Fətvalar açılıb yoxlanılıb.

export const meta = {
  slug: 'tayammum',
  cat: 'tahara',
  order: 20,
  icon: 'leaf',
  arTitle: 'التَّيَمُّم',
  title: {
    az: 'Təyəmmüm: suyun yerinə torpaqla təharət',
    en: 'Tayammum: purification with earth instead of water',
    ru: 'Таяммум: очищение землёй вместо воды',
    ar: 'التيمم: الطهارة بالصعيد بدل الماء',
    tr: 'Teyemmüm: su yerine toprakla temizlik',
  },
  summary: {
    az: 'Təyəmmüm nə vaxt icazəlidir, Ammar hədisinə görə necə edilir, nə ilə edilir və nə onu pozur — Quran, səhih Sünnə və alimlərin fətvaları ilə.',
    en: 'When tayammum is allowed, how to do it according to the hadith of ‘Ammar, what it may be done with and what breaks it — with Quran, Sunnah and fatwas.',
    ru: 'Когда разрешён таяммум, как его совершать по хадису Аммара, чем его делают и что его нарушает — по Корану, Сунне и фетвам учёных.',
    ar: 'متى يشرع التيمم، وصفته من حديث عمار، وبماذا يُتيمم، ونواقضه، بأدلة القرآن والسنة وفتاوى العلماء.',
    tr: 'Teyemmüm ne zaman caizdir, Ammâr hadisine göre nasıl yapılır, neyle yapılır ve onu ne bozar — Kur’an, Sünnet ve fetvalar ışığında.',
  },
  author: {
    az: 'Səhih hədislər; İbn Baz və İbn Useyminin fətvaları',
    en: 'Authentic hadith; fatwas of Ibn Baz and Ibn Uthaymin',
    ru: 'Достоверные хадисы; фетвы Ибн База и Ибн Усаймина',
    ar: 'الأحاديث الصحيحة؛ فتاوى ابن باز وابن عثيمين',
    tr: 'Sahih hadisler; İbn Baz ve İbn Useymin’in fetvaları',
  },
  minutes: 9,
}

export default {
  sections: [
    {
      id: 'intro',
      title: { az: 'Təyəmmüm — Allahın asanlığı', en: 'Tayammum — an ease from Allah', ru: 'Таяммум — облегчение от Аллаха', ar: 'التيمم رخصة من الله', tr: 'Teyemmüm — Allah’ın kolaylığı' },
      blocks: [
        { t: 'p', text: {
          az: 'Təyəmmüm — su olmadıqda və ya ondan istifadə etmək mümkün olmadıqda, təharət niyyəti ilə pak torpaqla üzü və əlləri məsh etməkdir. O, həm dəstəmazın, həm də qüslün yerini tutur və bu ümmətə verilmiş xüsusiyyətlərdəndir.',
          en: 'Tayammum is wiping the face and hands with clean earth, with the intention of purification, when there is no water or it cannot be used. It replaces both wudu and ghusl, and it is one of the special gifts given to this Ummah.',
          ru: 'Таяммум — это обтирание лица и кистей рук чистой землёй с намерением очищения, когда нет воды или её невозможно использовать. Он заменяет и малое омовение, и гусль, и является одной из особенностей, дарованных этой общине.',
          ar: 'التيمم هو مسح الوجه والكفين بالصعيد الطيب بنية التطهر عند فقد الماء أو العجز عن استعماله، وهو يقوم مقام الوضوء والغسل، ومن خصائص هذه الأمة.',
          tr: 'Teyemmüm, su bulunmadığında veya kullanılamadığında, temizlenme niyetiyle temiz toprakla yüzü ve elleri mesh etmektir. Hem abdestin hem guslün yerini tutar ve bu ümmete verilmiş özelliklerdendir.',
        } },
        { t: 'ayah', ar: 'وَإِن كُنتُم مَّرْضَىٰٓ أَوْ عَلَىٰ سَفَرٍ أَوْ جَآءَ أَحَدٌ مِّنكُم مِّنَ ٱلْغَآئِطِ أَوْ لَـٰمَسْتُمُ ٱلنِّسَآءَ فَلَمْ تَجِدُوا۟ مَآءً فَتَيَمَّمُوا۟ صَعِيدًا طَيِّبًا فَٱمْسَحُوا۟ بِوُجُوهِكُمْ وَأَيْدِيكُم مِّنْهُ ۚ مَا يُرِيدُ ٱللَّهُ لِيَجْعَلَ عَلَيْكُم مِّنْ حَرَجٍ وَلَـٰكِن يُرِيدُ لِيُطَهِّرَكُمْ وَلِيُتِمَّ نِعْمَتَهُۥ عَلَيْكُمْ لَعَلَّكُمْ تَشْكُرُونَ', ref: '5:6', text: {
          az: '“Əgər xəstə və ya səfərdə olsanız, yaxud sizdən biriniz ayaqyolundan gəlsə və ya qadınlara toxunmuş olsanız və su tapmasanız, pak torpaqla təyəmmüm edin: ondan üzünüzə və əllərinizə məsh edin. Allah sizə çətinlik yaratmaq istəmir, lakin sizi təmizləmək və sizə nemətini tamamlamaq istəyir ki, bəlkə şükür edəsiniz.”',
          en: '“But if you are ill, or on a journey, or one of you comes from relieving himself, or you have touched women and you find no water, then seek clean earth and wipe your faces and hands with it. Allah does not intend to make difficulty for you, but He intends to purify you and complete His favour upon you, that you may be grateful.”',
          ru: '«Если же вы больны или в пути, или кто-нибудь из вас пришёл из отхожего места, или вы касались женщин и не нашли воды, то обратитесь к чистой земле и оботрите ею ваши лица и руки. Аллах не желает создавать для вас трудности, но желает очистить вас и довести до конца Свою милость к вам, — быть может, вы будете благодарны».',
          ar: 'آية التيمم من سورة المائدة.',
          tr: '“Eğer hasta veya yolculukta iseniz, yahut biriniz ayak yolundan gelmişse veya kadınlara dokunmuşsanız ve su bulamamışsanız, temiz bir toprakla teyemmüm edin; ondan yüzlerinize ve ellerinize mesh edin. Allah size bir güçlük çıkarmak istemez; fakat sizi temizlemek ve size olan nimetini tamamlamak ister ki şükredesiniz.”',
        } },
        { t: 'hadith', ar: 'وَجُعِلَتْ لِيَ الأَرْضُ مَسْجِدًا وَطَهُورًا، فَأَيُّمَا رَجُلٍ مِنْ أُمَّتِي أَدْرَكَتْهُ الصَّلاَةُ فَلْيُصَلِّ', text: {
          az: '“…Yer mənim üçün səcdəgah və təmizləyici edildi; ümmətimdən kimə namaz vaxtı çatsa, (olduğu yerdə) namazını qılsın.”',
          en: '“…The earth has been made for me a place of prayer and a means of purification, so whenever the time of prayer reaches any man of my Ummah, let him pray.”',
          ru: '«…Земля сделана для меня местом для молитвы и средством очищения, и кого бы из моей общины ни застало время намаза, пусть молится».',
          ar: 'وجعلت لي الأرض مسجدًا وطهورًا، فأيما رجل من أمتي أدركته الصلاة فليصل.',
          tr: '“…Yeryüzü bana mescit ve temizleyici kılındı; ümmetimden kime namaz vakti gelirse (olduğu yerde) kılsın.”',
        }, src: { az: 'Buxari 335, Müslim 521', en: 'Bukhari 335, Muslim 521', ru: 'Бухари 335, Муслим 521', ar: 'البخاري 335، مسلم 521', tr: 'Buhârî 335, Müslim 521' } },
        { t: 'p', text: {
          az: 'Təyəmmüm ayəsi Aişənin (Allah ondan razı olsun) boyunbağısı itdiyi səfərdə, səhabələr susuz yerdə qaldıqda nazil olmuşdur (Buxari 334).',
          en: 'The verse of tayammum was revealed on the journey when ‘A’ishah lost her necklace and the Companions were stopped at a place without water (Bukhari 334).',
          ru: 'Аят о таяммуме был ниспослан в поездке, когда Аиша потеряла ожерелье, а сподвижники остановились в месте без воды (Бухари 334).',
          ar: 'نزلت آية التيمم في السفر الذي انقطع فيه عقد عائشة رضي الله عنها، والناس على غير ماء (البخاري 334).',
          tr: 'Teyemmüm âyeti, Âişe’nin (r.anha) gerdanlığının kaybolduğu ve sahabenin susuz bir yerde kaldığı yolculukta inmiştir (Buhârî 334).',
        } },
      ],
    },
    {
      id: 'when',
      title: { az: 'Təyəmmüm nə vaxt icazəlidir?', en: 'When is tayammum allowed?', ru: 'Когда разрешён таяммум?', ar: 'متى يشرع التيمم؟', tr: 'Teyemmüm ne zaman caizdir?' },
      blocks: [
        { t: 'list', ordered: true, items: [
          {
            az: 'Su olmadıqda — evdə və ya səfərdə, axtardıqdan sonra tapılmadıqda və ya içmək üçün lazım olan qədər az olduqda.',
            en: 'When there is no water — at home or travelling — after searching for it, or when the little there is is needed for drinking.',
            ru: 'Когда нет воды — дома или в пути — после её поиска, или когда её мало и она нужна для питья.',
            ar: 'عند فقد الماء بعد طلبه، في الحضر أو السفر، أو إذا كان قليلًا يحتاجه للشرب.',
            tr: 'Su bulunmadığında — evde veya yolculukta, aradıktan sonra bulunamazsa ya da içmek için gereken kadar az ise.',
          },
          {
            az: 'Sudan istifadə xəstəliyi artırarsa və ya sağalmanı gecikdirərsə (həkim və ya təcrübə ilə bilinir).',
            en: 'When using water would worsen an illness or delay recovery (known through a doctor or experience).',
            ru: 'Когда использование воды усилит болезнь или замедлит выздоровление (это знают от врача или по опыту).',
            ar: 'إذا كان استعمال الماء يزيد المرض أو يؤخر البرء، ويُعرف ذلك بقول الطبيب أو بالتجربة.',
            tr: 'Su kullanmak hastalığı artıracak veya iyileşmeyi geciktirecekse (doktor veya tecrübe ile bilinir).',
          },
          {
            az: 'Şiddətli soyuqda suyu qızdırmaq imkanı olmadıqda və ondan istifadə həlak və ya ciddi zərər qorxusu yaratdıqda — Əmr ibn əl-Asın hadisəsində olduğu kimi.',
            en: 'In severe cold, when there is no way to heat the water and using it threatens death or serious harm — as in the incident of ‘Amr ibn al-‘As.',
            ru: 'В сильный холод, когда нет возможности нагреть воду и её использование грозит гибелью или серьёзным вредом, — как в случае с Амром ибн аль-Асом.',
            ar: 'في البرد الشديد إذا لم يمكن تسخين الماء وخشي الهلاك أو الضرر، كما في قصة عمرو بن العاص.',
            tr: 'Şiddetli soğukta suyu ısıtma imkânı yoksa ve kullanmak ölüm ya da ciddi zarar korkusu doğuruyorsa — Amr b. Âs’ın olayında olduğu gibi.',
          },
          {
            az: 'Su yaxında olsa da, ona çatmaq mümkün olmadıqda (düşmən, təhlükəli heyvan, həbs və s.).',
            en: 'When water is nearby but cannot be reached (an enemy, a dangerous animal, imprisonment, etc.).',
            ru: 'Когда вода рядом, но до неё невозможно добраться (враг, опасное животное, заключение и т. п.).',
            ar: 'إذا كان الماء قريبًا لكن حال دونه عدو أو سبع أو حبس ونحو ذلك.',
            tr: 'Su yakında olsa da ona ulaşmak mümkün değilse (düşman, tehlikeli hayvan, hapis vb.).',
          },
        ] },
        { t: 'hadith', ar: 'احْتَلَمْتُ فِي لَيْلَةٍ بَارِدَةٍ فِي غَزْوَةِ ذَاتِ السَّلاَسِلِ، فَأَشْفَقْتُ إِنِ اغْتَسَلْتُ أَنْ أَهْلِكَ، فَتَيَمَّمْتُ ثُمَّ صَلَّيْتُ بِأَصْحَابِي الصُّبْحَ... فَضَحِكَ رَسُولُ اللَّهِ ﷺ وَلَمْ يَقُلْ شَيْئًا', text: {
          az: 'Əmr ibn əl-As deyir: “Zatus-Səlasil döyüşündə soyuq bir gecədə ehtilam oldum. Qüsl alsam həlak olacağımdan qorxdum, təyəmmüm edib yoldaşlarıma sübh namazı qıldırdım…” (Peyğəmbərə ﷺ bunu dedikdə və Əmr “Özünüzü öldürməyin” ayəsini xatırlatdıqda) Allahın Elçisi ﷺ güldü və heç nə demədi.',
          en: '‘Amr ibn al-‘As said: “I had a wet dream on a cold night during the expedition of Dhat as-Salasil. I feared that if I bathed I would perish, so I made tayammum and led my companions in the Fajr prayer…” (When this was mentioned to the Prophet ﷺ and ‘Amr cited the verse “Do not kill yourselves”), the Messenger of Allah ﷺ laughed and said nothing.',
          ru: 'Амр ибн аль-Ас сказал: «Во время похода Зат ас-Саласиль холодной ночью у меня была поллюция. Я побоялся погибнуть, если искупаюсь, совершил таяммум и руководил своими товарищами в утреннем намазе…» (Когда об этом рассказали Пророку ﷺ и Амр привёл аят «Не убивайте самих себя»), Посланник Аллаха ﷺ засмеялся и ничего не сказал.',
          ar: 'قصة عمرو بن العاص في التيمم من شدة البرد وإقرار النبي ﷺ له.',
          tr: 'Amr b. Âs der ki: “Zâtü’s-Selâsil gazvesinde soğuk bir gecede ihtilam oldum. Yıkanırsam helak olmaktan korktum, teyemmüm edip arkadaşlarıma sabah namazını kıldırdım…” (Bu, Peygamber’e ﷺ anlatılınca ve Amr “Kendinizi öldürmeyin” âyetini hatırlatınca) Allah’ın Resûlü ﷺ güldü ve bir şey demedi.',
        }, src: { az: 'Əbu Davud 334', en: 'Abu Dawud 334', ru: 'Абу Дауд 334', ar: 'أبو داود 334', tr: 'Ebû Dâvûd 334' }, grade: { az: 'səhih (əl-Albani)', en: 'sahih (al-Albani)', ru: 'достоверный (аль-Альбани)', ar: 'صحيح (الألباني)', tr: 'sahih (el-Albânî)' } },
        { t: 'note', kind: 'warn', text: {
          az: 'Suyun soyuq olması və ya tənbəllik təyəmmüm üçün səbəb deyil. Əgər suyu qızdırmaq və ya isti yerdə qüsl almaq mümkündürsə, təyəmmüm caiz olmur.',
          en: 'Water simply being cold, or laziness, is not a reason for tayammum. If it is possible to heat the water or bathe in a warm place, tayammum is not allowed.',
          ru: 'Просто холодная вода или лень — не причина для таяммума. Если можно нагреть воду или искупаться в тёплом месте, таяммум не допускается.',
          ar: 'مجرد برودة الماء أو الكسل ليس عذرًا للتيمم، فإن أمكن تسخين الماء أو الاغتسال في مكان دافئ لم يجز التيمم.',
          tr: 'Suyun sadece soğuk olması veya tembellik teyemmüm için sebep değildir. Suyu ısıtmak veya sıcak bir yerde yıkanmak mümkünse teyemmüm caiz olmaz.',
        } },
      ],
    },
    {
      id: 'how',
      title: { az: 'Təyəmmümün qaydası', en: 'How to perform tayammum', ru: 'Как совершать таяммум', ar: 'صفة التيمم', tr: 'Teyemmümün yapılışı' },
      blocks: [
        { t: 'hadith', ar: 'إِنَّمَا كَانَ يَكْفِيكَ أَنْ تَصْنَعَ هَكَذَا. فَضَرَبَ بِكَفِّهِ ضَرْبَةً عَلَى الأَرْضِ ثُمَّ نَفَضَهَا، ثُمَّ مَسَحَ بِهَا ظَهْرَ كَفِّهِ بِشِمَالِهِ، أَوْ ظَهْرَ شِمَالِهِ بِكَفِّهِ، ثُمَّ مَسَحَ بِهِمَا وَجْهَهُ', text: {
          az: 'Ammar ibn Yasir cünub olub su tapmadıqda heyvan kimi torpaqda eşələnmişdi. Peyğəmbər ﷺ ona dedi: “Sənə belə etmək kifayət edərdi” — və əli ilə yerə bir dəfə vurdu, onu silkələdi, sonra sol əli ilə sağ əlinin üstünü (və ya sağı ilə solun üstünü) məsh etdi, sonra hər ikisi ilə üzünü məsh etdi.',
          en: '‘Ammar ibn Yasir, being in janabah and finding no water, had rolled in the dust like an animal. The Prophet ﷺ told him: “It would have been enough for you to do this” — and he struck the ground once with his palm, shook it off, then wiped the back of his right hand with his left (or the back of his left with his right), then wiped his face with both.',
          ru: 'Аммар ибн Ясир, будучи в джанабе и не найдя воды, вывалялся в пыли, как животное. Пророк ﷺ сказал ему: «Тебе было бы достаточно сделать так», — и он один раз ударил ладонью по земле, стряхнул её, затем левой рукой обтёр тыльную сторону правой кисти (или правой — левую), а потом обеими обтёр лицо.',
          ar: 'حديث عمار بن ياسر في صفة التيمم بضربة واحدة للوجه والكفين.',
          tr: 'Ammâr b. Yâsir cünüp olup su bulamayınca hayvan gibi toprakta yuvarlanmıştı. Peygamber ﷺ ona: “Şöyle yapman sana yeterdi” dedi ve eliyle yere bir kez vurdu, silkeledi, sonra sol eliyle sağ elinin üstünü (veya sağıyla solun üstünü) mesh etti, sonra ikisiyle yüzünü mesh etti.',
        }, src: { az: 'Buxari 347, Müslim 368 (həmçinin Buxari 338)', en: 'Bukhari 347, Muslim 368 (also Bukhari 338)', ru: 'Бухари 347, Муслим 368 (также Бухари 338)', ar: 'البخاري 347، مسلم 368 (وانظر البخاري 338)', tr: 'Buhârî 347, Müslim 368 (ayrıca Buhârî 338)' } },
        { t: 'steps', items: [
          {
            title: { az: 'Niyyət', en: 'Intention', ru: 'Намерение', ar: 'النية', tr: 'Niyet' },
            text: { az: 'Ürəkdə namaz və s. üçün təharət niyyəti edin (dəstəmaz və ya qüslün yerinə).', en: 'Intend in your heart to purify yourself for prayer and the like (in place of wudu or ghusl).', ru: 'Намерьтесь в сердце очиститься для намаза и т. п. (вместо малого омовения или гусля).', ar: 'انوِ بقلبك التطهر للصلاة ونحوها بدلًا عن الوضوء أو الغسل.', tr: 'Kalbinizle namaz vb. için temizlenmeye niyet edin (abdest veya gusül yerine).' },
          },
          {
            title: { az: 'Bir dəfə vurmaq', en: 'One strike', ru: 'Один удар', ar: 'ضربة واحدة', tr: 'Bir kez vurmak' },
            text: { az: 'Hər iki ovucu bir dəfə pak torpağa vurun. Toz çox olarsa, üfürmək və ya silkələmək olar.', en: 'Strike the clean earth once with both palms. If there is much dust, you may blow on them or shake them.', ru: 'Ударьте обеими ладонями по чистой земле один раз. Если пыли много, можно подуть на них или стряхнуть.', ar: 'اضرب الصعيد الطيب بكفيك ضربة واحدة، ولك أن تنفخ فيهما أو تنفضهما إن كثر التراب.', tr: 'İki avucunuzla temiz toprağa bir kez vurun. Toz fazlaysa üfleyebilir veya silkeleyebilirsiniz.' },
          },
          {
            title: { az: 'Üzü məsh etmək', en: 'Wipe the face', ru: 'Обтереть лицо', ar: 'مسح الوجه', tr: 'Yüzü mesh etmek' },
            text: { az: 'Ovuclarla bütün üzü bir dəfə məsh edin.', en: 'Wipe the whole face once with the palms.', ru: 'Обтрите ладонями всё лицо один раз.', ar: 'امسح وجهك كله بكفيك مرة واحدة.', tr: 'Avuçlarla bütün yüzü bir kez mesh edin.' },
          },
          {
            title: { az: 'Əlləri məsh etmək', en: 'Wipe the hands', ru: 'Обтереть кисти рук', ar: 'مسح الكفين', tr: 'Elleri mesh etmek' },
            text: { az: 'Biləyə qədər əllərin üstünü bir-biri ilə məsh edin. Dirsəyə qədər məsh etmək lazım deyil.', en: 'Wipe the backs of the hands up to the wrists, one with the other. Wiping up to the elbows is not required.', ru: 'Обтрите тыльную сторону кистей до запястий, одну другой. Обтирать до локтей не требуется.', ar: 'امسح ظاهر كفيك إلى الرسغين، كل واحدة بالأخرى، ولا يشرع مسح الذراعين.', tr: 'Bileklere kadar ellerin üstünü birbiriyle mesh edin. Dirseklere kadar mesh etmek gerekmez.' },
          },
        ] },
        { t: 'quote', text: {
          az: 'Pak torpağa əlləri ilə bir dəfə vurur, sonra onlarla üzünü və əllərini (biləyə qədər) məsh edir.',
          en: 'He strikes the clean earth once with his hands, then wipes his face and his hands (to the wrists) with them.',
          ru: 'Он один раз ударяет руками по чистой земле, затем обтирает ими лицо и кисти рук.',
          ar: 'يضرب التراب بيديه ضربة واحدة، ثم يمسح بهما وجهه وكفيه.',
          tr: 'Temiz toprağa elleriyle bir kez vurur, sonra onlarla yüzünü ve ellerini (bileklere kadar) mesh eder.',
        }, ar: 'يضرب التراب بيديه ضربة واحدة، ثم يمسح بهما وجهه وكفيه', by: { az: 'Şeyx İbn Baz', en: 'Shaykh Ibn Baz', ru: 'Шейх Ибн Баз', ar: 'الشيخ ابن باز', tr: 'Şeyh İbn Baz' }, ref: { az: 'Fətva 1548 — “Təyəmmümün qaydasının bəyanı”', en: 'Fatwa 1548 — “Explaining how to perform tayammum”', ru: 'Фетва 1548 — «Разъяснение способа таяммума»', ar: 'فتوى 1548: بيان كيفية التيمم', tr: 'Fetva 1548 — “Teyemmümün yapılışının açıklaması”' } },
        { t: 'note', kind: 'info', text: {
          az: 'İki dəfə vurmaq və dirsəyə qədər məsh haqqında rəvayətlər səhih deyil; Buxari və Müslimdəki Ammar hədisi bir vuruş və üz ilə əlləri göstərir.',
          en: 'The narrations about two strikes and wiping to the elbows are not authentic; the hadith of ‘Ammar in Bukhari and Muslim shows one strike, the face and the hands.',
          ru: 'Передачи о двух ударах и обтирании до локтей недостоверны; хадис Аммара у Бухари и Муслима указывает на один удар, лицо и кисти рук.',
          ar: 'لم تصح الروايات في الضربتين والمسح إلى المرفقين، وحديث عمار في الصحيحين صريح في الضربة الواحدة للوجه والكفين.',
          tr: 'İki vuruş ve dirseklere kadar meshle ilgili rivayetler sahih değildir; Buhârî ve Müslim’deki Ammâr hadisi bir vuruşu, yüzü ve elleri gösterir.',
        } },
      ],
    },
    {
      id: 'with-what',
      title: { az: 'Nə ilə təyəmmüm edilir?', en: 'What may tayammum be done with?', ru: 'Чем совершают таяммум?', ar: 'بماذا يُتيمم؟', tr: 'Neyle teyemmüm edilir?' },
      blocks: [
        { t: 'p', text: {
          az: 'Ayədəki “səid” — yerin üzüdür. Səhih rəyə görə yerin cinsindən olan hər şeylə təyəmmüm edilir: torpaq, qum, daş, palçıq. Daş və ya kərpicdən hörülmüş divar da belədir. Boyalı, taxta və ya plastik örtüklü səth, xalça və s. üzərində isə yalnız onda toz olarsa təyəmmüm etmək olar. Torpaq tapılmasa, bir qaba torpaq və ya qum qoyub ondan təyəmmüm etmək olar.',
          en: 'The “sa‘id” in the verse is the surface of the earth. According to the sound view, tayammum may be done with anything of the earth: soil, sand, stone, clay. A wall built of stone or brick is the same. A painted, wooden or plastic-covered surface, a carpet and the like may be used only if there is dust on it. If no earth is at hand, one may put soil or sand in a container and use it.',
          ru: '«Са‘ид» в аяте — это поверхность земли. Согласно верному мнению, таяммум совершают всем, что относится к земле: пылью, песком, камнем, глиной. Так же и стена из камня или кирпича. На окрашенной, деревянной или покрытой пластиком поверхности, ковре и т. п. — только если на них есть пыль. Если земли нет, можно насыпать землю или песок в сосуд и совершить таяммум с него.',
          ar: 'الصعيد وجه الأرض، والصحيح جواز التيمم بكل ما على وجه الأرض من تراب ورمل وحجر وطين، ومثله الجدار المبني من الحجر أو اللبن. أما المدهون أو المغطى بالخشب أو البلاستيك والفرش ونحوها فلا يتيمم عليها إلا إذا كان عليها غبار. ولا بأس أن يضع ترابًا أو رملًا في إناء ويتيمم منه.',
          tr: 'Âyetteki “saîd” yeryüzüdür. Sahih görüşe göre yeryüzü cinsinden olan her şeyle teyemmüm edilir: toprak, kum, taş, çamur. Taş veya kerpiçten örülmüş duvar da böyledir. Boyalı, ahşap veya plastik kaplı yüzey, halı vb. üzerinde ise ancak üzerinde toz varsa teyemmüm edilir. Toprak yoksa bir kaba toprak veya kum koyup ondan teyemmüm edilebilir.',
        } },
        { t: 'quote', ar: 'الجدار من الصعيد الطيب', text: {
          az: '“Divar pak torpaq (səid) cinsindəndir.” Boya və ya taxta ilə örtülübsə, yalnız üzərində toz olduqda.',
          en: '“A wall is part of the clean earth (sa‘id).” If it is covered with paint or wood, only when there is dust on it.',
          ru: '«Стена относится к чистой земле (са‘ид)». Если она покрыта краской или деревом — только когда на ней есть пыль.',
          ar: 'الجدار من الصعيد الطيب، فإن كان مدهونًا أو مغطى بالخشب فلا يتيمم عليه إلا إذا كان عليه غبار.',
          tr: '“Duvar temiz toprak (saîd) cinsindendir.” Boya veya ahşapla kaplıysa, ancak üzerinde toz varsa.',
        }, by: { az: 'Şeyx İbn Useymin', en: 'Shaykh Ibn Uthaymin', ru: 'Шейх Ибн Усаймин', ar: 'الشيخ ابن عثيمين', tr: 'Şeyh İbn Useymin' }, ref: { az: 'İslamQA 36774-də nəql olunub', en: 'quoted in IslamQA 36774', ru: 'приведено в IslamQA 36774', ar: 'نقلًا عن الإسلام سؤال وجواب 36774', tr: 'IslamQA 36774’te nakledilmiştir' } }, // lang-ok[IslamQA]: saytın xüsusi adı
      ],
    },
    {
      id: 'validity',
      title: { az: 'Təyəmmüm nə qədər qüvvədədir və nə onu pozur?', en: 'How long it lasts and what breaks it', ru: 'Сколько действует таяммум и что его нарушает', ar: 'مدة التيمم ونواقضه', tr: 'Teyemmüm ne kadar geçerlidir ve onu ne bozar?' },
      blocks: [
        { t: 'p', text: {
          az: 'Təyəmmüm suyun tam əvəzidir: onunla həm fərz, həm nafilə namazlar qılınır və o, pozulana qədər qüvvədə qalır — hər namaz üçün yenidən təyəmmüm etmək şərt deyil. Bu, Şeyxulislam İbn Teymiyyə, İbn Baz və İbn Useyminin seçdiyi rəydir. Alimlərin bir qismi isə hər fərz namaz üçün yeni təyəmmüm tələb edir.',
          en: 'Tayammum is a full substitute for water: obligatory and voluntary prayers may be prayed with it, and it remains valid until broken — a new tayammum is not required for each prayer. This is the view chosen by Shaykh al-Islam Ibn Taymiyyah, Ibn Baz and Ibn Uthaymin. Some scholars require a new tayammum for every obligatory prayer.',
          ru: 'Таяммум — полная замена воды: с ним совершают и обязательные, и добровольные намазы, и он действует, пока не нарушится, — не нужно обновлять его для каждого намаза. Это мнение избрали шейх аль-ислам Ибн Таймия, Ибн Баз и Ибн Усаймин. Часть учёных требует нового таяммума для каждого обязательного намаза.',
          ar: 'التيمم بدل عن الماء، يصلي به الفرض والنفل، ويبقى ما لم ينتقض، ولا يلزم تجديده لكل صلاة، وهو اختيار شيخ الإسلام ابن تيمية وابن باز وابن عثيمين، وذهب بعض العلماء إلى وجوب التيمم لكل فريضة.',
          tr: 'Teyemmüm suyun tam yerine geçer: onunla farz ve nafile namazlar kılınır ve bozulana kadar geçerlidir — her namaz için yenilemek şart değildir. Bu, Şeyhülislam İbn Teymiyye, İbn Baz ve İbn Useymin’in tercih ettiği görüştür. Âlimlerin bir kısmı ise her farz namaz için yeni teyemmüm şart koşar.',
        } },
        { t: 'list', items: [
          {
            az: 'Dəstəmazı pozan hər şey təyəmmümü də pozur; qüslün yerinə edilmiş təyəmmümü isə qüslü vacib edən şeylər pozur.',
            en: 'Everything that breaks wudu breaks tayammum; a tayammum done in place of ghusl is broken by what makes ghusl obligatory.',
            ru: 'Всё, что нарушает малое омовение, нарушает и таяммум; а таяммум вместо гусля нарушает то, что делает гусль обязательным.',
            ar: 'ينقضه كل ما ينقض الوضوء، والتيمم عن الغسل ينقضه موجبات الغسل.',
            tr: 'Abdesti bozan her şey teyemmümü de bozar; gusül yerine yapılan teyemmümü ise guslü gerektiren şeyler bozar.',
          },
          {
            az: 'Su tapıldıqda və ya ondan istifadə etmək mümkün olduqda təyəmmüm batil olur. Cünub şəxs su tapan kimi qüsl almalıdır.',
            en: 'It becomes void once water is found or one becomes able to use it. A person in janabah must take ghusl as soon as water is found.',
            ru: 'Он становится недействительным, как только найдена вода или появилась возможность её использовать. Находящийся в джанабе должен совершить гусль, как только найдёт воду.',
            ar: 'يبطل بوجود الماء أو القدرة على استعماله، ويلزم الجنب أن يغتسل إذا وجد الماء.',
            tr: 'Su bulunduğunda veya kullanılabilir hâle geldiğinde teyemmüm bozulur. Cünüp kişi suyu bulunca gusletmelidir.',
          },
        ] },
        { t: 'hadith', ar: 'إِنَّ الصَّعِيدَ الطَّيِّبَ طَهُورُ الْمُسْلِمِ وَإِنْ لَمْ يَجِدِ الْمَاءَ عَشْرَ سِنِينَ، فَإِذَا وَجَدَ الْمَاءَ فَلْيُمِسَّهُ بَشَرَتَهُ فَإِنَّ ذَلِكَ خَيْرٌ', text: {
          az: '“Pak torpaq müsəlmanın təmizləyicisidir, on il su tapmasa belə. Su tapdıqda isə onu dərisinə toxundursun, çünki bu, daha xeyirlidir.”',
          en: '“Clean earth is the purifier of the Muslim, even if he finds no water for ten years. When he finds water, let him put it on his skin, for that is better.”',
          ru: '«Чистая земля — средство очищения мусульманина, даже если он не найдёт воды десять лет. А когда найдёт воду, пусть коснётся ею своей кожи, ибо это лучше».',
          ar: 'إن الصعيد الطيب طهور المسلم وإن لم يجد الماء عشر سنين، فإذا وجد الماء فليمسه بشرته فإن ذلك خير.',
          tr: '“Temiz toprak, on yıl su bulamasa bile Müslümanın temizleyicisidir. Suyu bulunca onu derisine değdirsin; çünkü bu daha hayırlıdır.”',
        }, src: { az: 'Tirmizi 124, Əbu Davud 332', en: 'At-Tirmidhi 124, Abu Dawud 332', ru: 'Ат-Тирмизи 124, Абу Дауд 332', ar: 'الترمذي 124، أبو داود 332', tr: 'Tirmizî 124, Ebû Dâvûd 332' }, grade: { az: 'səhih (əl-Albani)', en: 'sahih (al-Albani)', ru: 'достоверный (аль-Альбани)', ar: 'صحيح (الألباني)', tr: 'sahih (el-Albânî)' } },
      ],
    },
    {
      id: 'water-found',
      title: { az: 'Namazdan sonra su tapılarsa', en: 'If water is found after the prayer', ru: 'Если вода найдена после намаза', ar: 'إذا وجد الماء بعد الصلاة', tr: 'Namazdan sonra su bulunursa' },
      blocks: [
        { t: 'hadith', ar: 'خَرَجَ رَجُلاَنِ فِي سَفَرٍ فَحَضَرَتِ الصَّلاَةُ وَلَيْسَ مَعَهُمَا مَاءٌ، فَتَيَمَّمَا صَعِيدًا طَيِّبًا فَصَلَّيَا، ثُمَّ وَجَدَا الْمَاءَ فِي الْوَقْتِ، فَأَعَادَ أَحَدُهُمَا الصَّلاَةَ وَالْوُضُوءَ وَلَمْ يُعِدِ الآخَرُ... فَقَالَ لِلَّذِي لَمْ يُعِدْ: أَصَبْتَ السُّنَّةَ وَأَجْزَأَتْكَ صَلاَتُكَ. وَقَالَ لِلَّذِي تَوَضَّأَ وَأَعَادَ: لَكَ الأَجْرُ مَرَّتَيْنِ', text: {
          az: 'İki nəfər səfərə çıxdı, namaz vaxtı oldu, yanlarında su yox idi. Təyəmmüm edib namaz qıldılar, sonra vaxt çıxmamış su tapdılar. Biri dəstəmaz alıb namazı təkrarladı, digəri təkrarlamadı. Peyğəmbər ﷺ təkrarlamayana dedi: “Sünnəyə müvafiq etdin və namazın sənə kifayət etdi.” Təkrarlayana isə dedi: “Sənə iki qat savab var.”',
          en: 'Two men set out on a journey; the prayer time came and they had no water. They made tayammum and prayed, then found water while the time remained. One repeated wudu and the prayer, the other did not. The Prophet ﷺ said to the one who did not repeat: “You followed the Sunnah and your prayer sufficed you.” And to the one who repeated: “You have the reward twice.”',
          ru: 'Двое мужчин отправились в путь; наступило время намаза, а воды у них не было. Они совершили таяммум и помолились, а затем нашли воду, пока время ещё не вышло. Один из них совершил омовение и повторил намаз, а другой — нет. Пророк ﷺ сказал тому, кто не повторил: «Ты поступил по Сунне, и твой намаз засчитан». А тому, кто повторил: «Тебе награда дважды».',
          ar: 'حديث أبي سعيد في الرجلين اللذين تيمما ثم وجدا الماء في الوقت.',
          tr: 'İki kişi yolculuğa çıktı; namaz vakti geldi, yanlarında su yoktu. Teyemmüm edip kıldılar, sonra vakit çıkmadan su buldular. Biri abdest alıp namazı iade etti, diğeri etmedi. Peygamber ﷺ iade etmeyene: “Sünnete isabet ettin, namazın sana yetti” buyurdu; iade edene ise: “Sana iki kat ecir var” dedi.',
        }, src: { az: 'Əbu Davud 338, Nəsai 433', en: 'Abu Dawud 338, an-Nasa’i 433', ru: 'Абу Дауд 338, ан-Насаи 433', ar: 'أبو داود 338، النسائي 433', tr: 'Ebû Dâvûd 338, Nesâî 433' }, grade: { az: 'səhih (əl-Albani)', en: 'sahih (al-Albani)', ru: 'достоверный (аль-Альбани)', ar: 'صحيح (الألباني)', tr: 'sahih (el-Albânî)' } },
        { t: 'p', text: {
          az: 'Deməli, təyəmmümlə qılınmış namaz düzgündür və su sonradan tapılsa belə, onu təkrarlamaq vacib deyil; Sünnəyə uyğun olan — təkrarlamamaqdır.',
          en: 'So a prayer prayed with tayammum is valid, and even if water is found afterwards it does not have to be repeated; what agrees with the Sunnah is not repeating it.',
          ru: 'Значит, намаз, совершённый с таяммумом, действителен, и даже если вода найдена позже, повторять его не обязательно; соответствует Сунне — не повторять.',
          ar: 'فالصلاة بالتيمم صحيحة، ولا تجب إعادتها إن وجد الماء بعدها، والموافق للسنة ترك الإعادة.',
          tr: 'Demek ki teyemmümle kılınan namaz geçerlidir ve sonradan su bulunsa bile iade etmek gerekmez; Sünnete uygun olan iade etmemektir.',
        } },
      ],
    },
    {
      id: 'faq',
      title: { az: 'Tez-tez verilən suallar', en: 'Common questions', ru: 'Частые вопросы', ar: 'أسئلة شائعة', tr: 'Sık sorulan sorular' },
      blocks: [
        { t: 'qa', items: [
          {
            q: { az: 'Cünub şəxs su tapmasa, namazı tərk edirmi?', en: 'If a person in janabah finds no water, does he leave the prayer?', ru: 'Если находящийся в джанабе не нашёл воды, оставляет ли он намаз?', ar: 'هل يترك الجنب الصلاة إذا لم يجد الماء؟', tr: 'Cünüp kişi su bulamazsa namazı terk eder mi?' },
            a: {
              az: 'Xeyr. O, təyəmmüm edib namazını vaxtında qılır — Ammar hədisi və “Sənə pak torpaq lazımdır, o sənə kifayət edir” hədisi buna dəlildir (Buxari 344).',
              en: 'No. He makes tayammum and prays on time — as shown by the hadith of ‘Ammar and the hadith “Use clean earth, for it suffices you” (Bukhari 344).',
              ru: 'Нет. Он совершает таяммум и молится вовремя — на это указывают хадис Аммара и хадис «Используй чистую землю, ведь её тебе достаточно» (Бухари 344).',
              ar: 'لا، بل يتيمم ويصلي في الوقت؛ لحديث عمار، ولقوله ﷺ: عليك بالصعيد فإنه يكفيك (البخاري 344).',
              tr: 'Hayır. Teyemmüm edip namazını vaktinde kılar — Ammâr hadisi ve “Temiz toprağı kullan, o sana yeter” hadisi buna delildir (Buhârî 344).',
            },
          },
          {
            q: { az: 'Bədənin bir hissəsində yara varsa?', en: 'What if part of the body is wounded?', ru: 'Что делать, если на части тела рана?', ar: 'ماذا يفعل من به جرح في بعض أعضائه؟', tr: 'Bedenin bir kısmında yara varsa?' },
            a: {
              az: 'Sağlam üzvlər su ilə yuyulur, suyun zərər verdiyi yer üçün isə təyəmmüm edilir; sarğı varsa onun üzərinə məsh edilə bilər. Xəstənin təharəti ətraflı “Xəstənin fiqhi” dərsində izah olunur.',
              en: 'The healthy parts are washed with water, and tayammum is made for the place that water would harm; if there is a bandage, it may be wiped over. The purification of the sick is explained in detail in the lesson “Fiqh of the sick”.',
              ru: 'Здоровые части тела моют водой, а за место, которому вода вредит, совершают таяммум; если есть повязка, её можно обтереть. Очищение больного подробно разобрано в уроке «Фикх больного».',
              ar: 'يغسل الصحيح بالماء ويتيمم عن الموضع الذي يضره الماء، وإن كان عليه جبيرة مسح عليها، والتفصيل في درس «أحكام المريض».',
              tr: 'Sağlam uzuvlar suyla yıkanır, suyun zarar verdiği yer için teyemmüm edilir; sargı varsa üzerine mesh edilebilir. Hastanın temizliği “Hastanın fıkhı” dersinde ayrıntılı anlatılır.',
            },
          },
          {
            q: { az: 'Təyəmmümlə bir neçə namaz qılmaq olarmı?', en: 'Can several prayers be prayed with one tayammum?', ru: 'Можно ли совершить несколько намазов одним таяммумом?', ar: 'هل يصلي بالتيمم الواحد عدة صلوات؟', tr: 'Bir teyemmümle birkaç namaz kılınabilir mi?' },
            a: {
              az: 'Bəli. Təyəmmüm natəmizliyi su kimi qaldırır və dəstəmazı pozan bir şey baş verənə, su tapılana və ya ondan istifadə imkanı yaranana qədər qüvvədə qalır.',
              en: 'Yes. Tayammum lifts the impurity as water does and remains valid until something breaks wudu, water is found, or one becomes able to use it.',
              ru: 'Да. Таяммум снимает осквернение, как вода, и действует до тех пор, пока не произойдёт что-то нарушающее омовение, не будет найдена вода или не появится возможность её использовать.',
              ar: 'نعم، فالتيمم رافع للحدث كالماء، ويبقى حتى يحدث، أو يجد الماء، أو يقدر على استعماله.',
              tr: 'Evet. Teyemmüm hadesi su gibi kaldırır ve abdesti bozan bir şey olana, su bulunana veya kullanma imkânı doğana kadar geçerli kalır.',
            },
            ref: { az: 'İbn Baz, fətva 1548', en: 'Ibn Baz, fatwa 1548', ru: 'Ибн Баз, фетва 1548', ar: 'ابن باز، فتوى 1548', tr: 'İbn Baz, fetva 1548' },
            url: 'https://binbaz.org.sa/fatwas/1548',
          },
        ] },
      ],
    },
  ],
  sources: [
    { label: 'Səhih əl-Buxari, Kitab ət-Təyəmmüm — İmam əl-Buxari' },
    { label: 'Səhih Müslim, Kitab əl-Heyz (təyəmmüm babı) — İmam Müslim' },
    { label: 'Sünən Əbu Davud, Sünən ət-Tirmizi, Sünən ən-Nəsai — əl-Albaninin təhqiqi ilə' },
    { label: 'İbn Baz — Bəyanu keyfiyyəti-t-təyəmmüm (fətva 1548)', url: 'https://binbaz.org.sa/fatwas/1548' },
    { label: 'İslamQA 36774 — ət-Təyəmmüm bi-aniyə min əl-fəxxar əv ‘alə ha’it', url: 'https://islamqa.info/ar/answers/36774' },
    { label: 'Hadith API (fawazahmed0) — mətn və nömrələrin yoxlanması', url: 'https://github.com/fawazahmed0/hadith-api' },
  ],
}
