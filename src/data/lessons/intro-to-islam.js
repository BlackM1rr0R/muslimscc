// İslamla tanışlıq — qeyri-müsəlmanlar üçün sadə giriş: Allah, Peyğəmbər ﷺ, Quran,
// İslamın və imanın rüknləri, axirət və müsəlman olmaq.
// Mənbələr: Quran, Buxari və Müslim; fətvalar islamqa.info-da yoxlanılıb.

export const meta = {
  slug: 'intro-to-islam',
  cat: 'dawah',
  order: 10,
  icon: 'globe',
  arTitle: 'تعريف بالإسلام',
  title: {
    az: 'İslamla tanışlıq',
    en: 'Introduction to Islam',
    ru: 'Знакомство с исламом',
    ar: 'تعريف بالإسلام',
    tr: 'İslam’a Giriş',
  },
  summary: {
    az: 'Qeyri-müsəlmanlar üçün sadə giriş: Allah kimdir, Peyğəmbər ﷺ, Quran, İslamın və imanın rüknləri, ölümdən sonrakı həyat və müsəlman olmaq.',
    en: 'A simple introduction for non-Muslims: who Allah is, the Prophet ﷺ, the Quran, the pillars of Islam and faith, life after death and how to become Muslim.',
    ru: 'Простое введение для немусульман: кто такой Аллах, Пророк ﷺ, Коран, столпы ислама и веры, жизнь после смерти и как стать мусульманином.',
    ar: 'مدخل ميسّر لغير المسلمين: من هو الله، والنبي ﷺ، والقرآن، وأركان الإسلام والإيمان، والحياة بعد الموت، وكيف يصبح المرء مسلمًا.',
    tr: 'Gayrimüslimler için sade bir giriş: Allah kimdir, Peygamber ﷺ, Kur’an, İslam’ın ve imanın şartları, ölümden sonraki hayat ve Müslüman olmak.',
  },
  author: {
    az: 'Quran və səhih Sünnə',
    en: 'The Quran and the authentic Sunnah',
    ru: 'Коран и достоверная Сунна',
    ar: 'القرآن والسنة الصحيحة',
    tr: 'Kur’an ve sahih Sünnet',
  },
  minutes: 12,
}

const SAHIH = { az: 'Səhih', en: 'Sahih', ru: 'Достоверный', ar: 'صحيح', tr: 'Sahih' }

export default {
  sections: [
    // ─────────────────────────────────────────────
    {
      id: 'what-is-islam',
      title: {
        az: 'İslam nədir?',
        en: 'What is Islam?',
        ru: 'Что такое ислам?',
        ar: 'ما الإسلام؟',
        tr: 'İslam nedir?',
      },
      blocks: [
        { t: 'p', text: {
          az: '«İslam» ərəbcə «təslim olmaq» deməkdir: Allaha tövhid ilə təslim olmaq, Ona itaət etmək və şirkdən uzaq durmaq. Müsəlman — bu yolu seçən insandır. İslam yeni bir din deyil: Nuh, İbrahim, Musa, İsa və bütün peyğəmbərlər eyni əsas mesajı gətiriblər — yalnız bir Allaha ibadət edin. Muhəmməd ﷺ bu peyğəmbərlərin sonuncusudur.',
          en: '“Islam” is Arabic for “submission”: submitting to Allah in pure monotheism, obeying Him and staying away from associating partners with Him. A Muslim is a person who chooses this path. Islam is not a new religion: Noah, Abraham, Moses, Jesus and all the Prophets brought the same core message — worship the One God alone. Muhammad ﷺ is the last of these Prophets.',
          ru: '«Ислам» по-арабски — «покорность»: покорность Аллаху в единобожии, повиновение Ему и отказ от придания Ему сотоварищей. Мусульманин — человек, выбравший этот путь. Ислам — не новая религия: Ной, Авраам, Моисей, Иисус и все пророки приносили одну главную весть — поклоняйтесь одному Богу. Мухаммад ﷺ — последний из этих пророков.',
          ar: 'الإسلام هو الاستسلام لله بالتوحيد، والانقياد له بالطاعة، والبراءة من الشرك. والمسلم من اختار هذا الطريق. والإسلام ليس دينًا جديدًا؛ فنوح وإبراهيم وموسى وعيسى وسائر الأنبياء جاؤوا برسالة واحدة: اعبدوا الله وحده. ومحمد ﷺ خاتمهم.',
          tr: '“İslam” Arapçada “teslim olmak” demektir: Allah’a tevhid ile teslim olmak, O’na itaat etmek ve şirkten uzak durmak. Müslüman, bu yolu seçen insandır. İslam yeni bir din değildir: Nuh, İbrahim, Musa, İsa ve bütün peygamberler aynı temel mesajı getirmiştir — yalnız tek Allah’a ibadet edin. Muhammed ﷺ bu peygamberlerin sonuncusudur.',
        } },
        { t: 'ayah', ar: 'قُولُوٓا۟ ءَامَنَّا بِٱللَّهِ وَمَآ أُنزِلَ إِلَيْنَا وَمَآ أُنزِلَ إِلَىٰٓ إِبْرَٰهِـۧمَ وَإِسْمَـٰعِيلَ وَإِسْحَـٰقَ وَيَعْقُوبَ وَٱلْأَسْبَاطِ وَمَآ أُوتِىَ مُوسَىٰ وَعِيسَىٰ وَمَآ أُوتِىَ ٱلنَّبِيُّونَ مِن رَّبِّهِمْ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّنْهُمْ وَنَحْنُ لَهُۥ مُسْلِمُونَ', ref: '2:136', text: {
          az: '«Deyin: Biz Allaha, bizə nazil edilənə, İbrahimə, İsmailə, İshaqa, Yaquba və onun nəslinə nazil edilənə, Musaya və İsaya verilənə və peyğəmbərlərə Rəbbləri tərəfindən verilənə iman gətirdik. Onların heç birini digərindən ayırmırıq və biz Ona təslim olanlarıq».',
          en: '“Say: We believe in Allah and what has been sent down to us, and what was sent down to Abraham, Ishmael, Isaac, Jacob and the tribes, and what was given to Moses and Jesus, and what was given to the Prophets from their Lord. We make no distinction between any of them, and to Him we submit.”',
          ru: '«Скажите: Мы уверовали в Аллаха, в то, что ниспослано нам, и в то, что ниспослано Ибрахиму, Исмаилу, Исхаку, Йакубу и коленам, в то, что даровано Мусе и Исе, и в то, что даровано пророкам их Господом. Мы не делаем различий между ними, и Ему одному мы покоряемся».',
          ar: 'قولوا آمنا بالله وما أنزل إلينا وما أنزل إلى إبراهيم وإسماعيل وإسحاق ويعقوب والأسباط وما أوتي موسى وعيسى وما أوتي النبيون من ربهم لا نفرق بين أحد منهم ونحن له مسلمون.',
          tr: '“Deyin ki: Allah’a, bize indirilene, İbrahim’e, İsmail’e, İshak’a, Yakub’a ve torunlarına indirilene, Musa ile İsa’ya verilene ve peygamberlere Rableri tarafından verilene iman ettik. Onlardan hiçbirini ayırt etmeyiz ve biz O’na teslim olanlarız.”',
        } },
        { t: 'ayah', ar: 'لَآ إِكْرَاهَ فِى ٱلدِّينِ ۖ قَد تَّبَيَّنَ ٱلرُّشْدُ مِنَ ٱلْغَىِّ', ref: '2:256', text: {
          az: '«Dində məcburiyyət yoxdur. Doğru yol azğınlıqdan artıq aydın şəkildə ayrılıb».',
          en: '“There is no compulsion in religion. The right way has become clearly distinct from error.”',
          ru: '«Нет принуждения в религии. Прямой путь уже отличился от заблуждения».',
          ar: 'لا إكراه في الدين قد تبين الرشد من الغي.',
          tr: '“Dinde zorlama yoktur. Doğru yol sapıklıktan açıkça ayrılmıştır.”',
        } },
        { t: 'ayah', ar: 'يَـٰٓأَيُّهَا ٱلنَّاسُ إِنَّا خَلَقْنَـٰكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَـٰكُمْ شُعُوبًا وَقَبَآئِلَ لِتَعَارَفُوٓا۟ ۚ إِنَّ أَكْرَمَكُمْ عِندَ ٱللَّهِ أَتْقَىٰكُمْ ۚ إِنَّ ٱللَّهَ عَلِيمٌ خَبِيرٌ', ref: '49:13', text: {
          az: '«Ey insanlar! Biz sizi bir kişi ilə bir qadından yaratdıq və bir-birinizi tanıyasınız deyə sizi xalqlara və qəbilələrə ayırdıq. Allah yanında ən hörmətliniz ən təqvalınızdır. Allah Biləndir, Xəbərdardır».',
          en: '“O mankind, We created you from a male and a female and made you peoples and tribes so that you may know one another. The most noble of you in the sight of Allah is the most God-conscious of you. Allah is All-Knowing, All-Aware.”',
          ru: '«О люди! Мы сотворили вас из мужчины и женщины и сделали вас народами и племенами, чтобы вы узнавали друг друга. Самый почитаемый из вас перед Аллахом — самый богобоязненный. Аллах — Знающий, Сведущий».',
          ar: 'يا أيها الناس إنا خلقناكم من ذكر وأنثى وجعلناكم شعوبًا وقبائل لتعارفوا إن أكرمكم عند الله أتقاكم إن الله عليم خبير.',
          tr: '“Ey insanlar! Sizi bir erkek ile bir dişiden yarattık ve birbirinizle tanışasınız diye sizi milletlere ve kabilelere ayırdık. Allah katında en değerliniz, O’na en çok saygı göstereninizdir. Allah bilendir, haberdardır.”',
        } },
      ],
    },
    // ─────────────────────────────────────────────
    {
      id: 'allah',
      title: {
        az: 'Allah kimdir?',
        en: 'Who is Allah?',
        ru: 'Кто такой Аллах?',
        ar: 'من هو الله؟',
        tr: 'Allah kimdir?',
      },
      blocks: [
        { t: 'p', text: {
          az: '«Allah» — ərəb dilində tək, həqiqi İlahın adıdır; ərəbdilli xristianlar da Tanrını bu sözlə çağırırlar. Allah hər şeyin Yaradanı, Sahibi və idarə edənidir. O, Birdir, heç bir şərik, övlad və bənzəri yoxdur. O, Rəhmlidir, Bağışlayandır, Hikmətlidir, hər şeyi Eşidən və Görəndir; O, ərşin üzərindədir, eyni zamanda elmi ilə hər yerdə və hər şeydən xəbərdardır.',
          en: '“Allah” is the Arabic name of the one true God; Arabic-speaking Christians also call God by this word. Allah is the Creator, Owner and Disposer of everything. He is One; He has no partner, no son and nothing is like Him. He is the Merciful, the Forgiving, the Wise, the All-Hearing and All-Seeing; He is above His Throne, and by His knowledge He is aware of everything everywhere.',
          ru: '«Аллах» — арабское имя единого истинного Бога; арабоязычные христиане тоже называют Бога этим словом. Аллах — Творец, Владыка и Распорядитель всего. Он Один, у Него нет сотоварища, сына и ничего подобного Ему. Он Милосердный, Прощающий, Мудрый, Слышащий и Видящий; Он над Своим Троном и Своим знанием осведомлён обо всём повсюду.',
          ar: 'الله هو اسم الإله الحق الواحد، ويدعو به النصارى العرب أيضًا. وهو خالق كل شيء ومالكه ومدبره، واحد لا شريك له ولا ولد ولا مثيل، الرحمن الغفور الحكيم السميع البصير، مستوٍ على عرشه، محيط بكل شيء علمًا.',
          tr: '“Allah”, tek ve gerçek İlah’ın Arapçadaki adıdır; Arapça konuşan Hristiyanlar da Tanrı’yı bu kelimeyle anar. Allah her şeyin Yaratıcısı, Sahibi ve Yöneticisidir. O birdir; ortağı, çocuğu ve benzeri yoktur. O Rahîm’dir, Gafûr’dur, Hakîm’dir, her şeyi işiten ve görendir; arşının üzerindedir ve ilmiyle her şeyden her yerde haberdardır.',
        } },
        { t: 'ayah', ar: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ ٱللَّهُ ٱلصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ', ref: '112:1-4', text: {
          az: '«De: O, Allahdır, Təkdir. Allah Samaddır (hər şeyin Ona möhtac olduğu, Özü heç kəsə möhtac olmayandır). O, doğmayıb və doğulmayıb. Onun heç bir tayı-bərabəri yoxdur».',
          en: '“Say: He is Allah, the One. Allah, the Self-Sufficient on whom all depend. He neither begets nor was begotten. And there is none comparable to Him.”',
          ru: '«Скажи: Он — Аллах, Единый. Аллах — Самодостаточный, в Котором все нуждаются. Он не родил и не был рождён, и нет никого, равного Ему».',
          ar: 'قل هو الله أحد، الله الصمد، لم يلد ولم يولد، ولم يكن له كفوًا أحد.',
          tr: '“De ki: O Allah birdir. Allah Samed’dir (her şey O’na muhtaçtır, O hiçbir şeye muhtaç değildir). Doğurmamış ve doğurulmamıştır. Hiçbir şey O’na denk değildir.”',
        } },
        { t: 'list', items: [
          { az: 'Yalnız Allaha ibadət olunur: dua, səcdə, nəzir, qurban yalnız Ona aiddir.', en: 'Only Allah is worshipped: supplication, prostration, vows and sacrifice belong to Him alone.', ru: 'Поклоняются только Аллаху: мольба, земной поклон, обеты и жертвоприношение — только Ему.', ar: 'لا يُعبد إلا الله؛ فالدعاء والسجود والنذر والذبح له وحده.', tr: 'Yalnız Allah’a ibadet edilir: dua, secde, adak ve kurban yalnız O’na aittir.' },
          { az: 'Allahla insan arasında vasitəçi yoxdur: hər kəs Ona birbaşa dua edə bilər.', en: 'There is no intermediary between Allah and man: anyone can call upon Him directly.', ru: 'Между Аллахом и человеком нет посредника: каждый может обращаться к Нему напрямую.', ar: 'لا واسطة بين العبد وربه في الدعاء؛ فكل أحد يدعوه مباشرة.', tr: 'Allah ile insan arasında aracı yoktur: herkes O’na doğrudan dua edebilir.' },
          { az: 'Allah yaratdıqlarına bənzəmir; Özünü necə vəsf edibsə, o cür inanırıq — bənzətmədən və inkar etmədən.', en: 'Allah does not resemble His creation; we believe in Him as He described Himself — without likening Him to creation and without denying His attributes.', ru: 'Аллах не подобен Своим творениям; мы веруем в Него так, как Он Сам описал Себя, — не уподобляя и не отрицая.', ar: 'الله لا يشبه خلقه، ونؤمن بما وصف به نفسه من غير تشبيه ولا تعطيل.', tr: 'Allah yarattıklarına benzemez; O’na kendisini nasıl vasfettiyse öyle inanırız — benzetmeden ve inkâr etmeden.' },
        ] },
      ],
    },
    // ─────────────────────────────────────────────
    {
      id: 'prophet',
      title: {
        az: 'Peyğəmbər Muhəmməd ﷺ',
        en: 'The Prophet Muhammad ﷺ',
        ru: 'Пророк Мухаммад ﷺ',
        ar: 'النبي محمد ﷺ',
        tr: 'Peygamber Muhammed ﷺ',
      },
      blocks: [
        { t: 'p', text: {
          az: 'Muhəmməd ﷺ təxminən 570-ci ildə Məkkədə doğulub. Gəncliyində doğruluğu və etibarı ilə tanınırdı, insanlar onu «əl-Əmin» (etibarlı) adlandırırdılar. Qırx yaşında ona ilk vəhy gəldi və iyirmi üç il ərzində Quran ona hissə-hissə nazil oldu. O, 632-ci ildə Mədinədə vəfat edib. O, ilahi deyil, Allahın qulu və elçisidir; Ona ibadət edilmir, ona tabe olunur.',
          en: 'Muhammad ﷺ was born in Makkah around the year 570. In his youth he was known for truthfulness and trustworthiness; people called him “al-Amin” (the trustworthy). At forty the first revelation came to him, and over twenty-three years the Quran was revealed to him gradually. He died in Madinah in 632. He is not divine but the servant and Messenger of Allah; he is not worshipped but followed.',
          ru: 'Мухаммад ﷺ родился в Мекке около 570 года. В юности он был известен правдивостью и надёжностью, люди называли его «аль-Амин» (надёжный). В сорок лет к нему пришло первое откровение, и в течение двадцати трёх лет Коран ниспосылался ему по частям. Он умер в Медине в 632 году. Он не божество, а раб и посланник Аллаха; ему не поклоняются, а следуют за ним.',
          ar: 'وُلد محمد ﷺ في مكة نحو سنة 570م، وعُرف في شبابه بالصدق والأمانة حتى لُقّب بالأمين. وجاءه الوحي وهو ابن أربعين، ونزل عليه القرآن مفرقًا في ثلاث وعشرين سنة، وتوفي في المدينة سنة 632م. وهو عبد الله ورسوله، لا يُعبد بل يُتّبع.',
          tr: 'Muhammed ﷺ yaklaşık 570 yılında Mekke’de doğdu. Gençliğinde doğruluğu ve güvenilirliğiyle tanınır, insanlar ona “el-Emîn” (güvenilir) derdi. Kırk yaşında ilk vahiy geldi ve yirmi üç yıl boyunca Kur’an ona parça parça indirildi. 632’de Medine’de vefat etti. O ilah değil, Allah’ın kulu ve elçisidir; ona ibadet edilmez, ona uyulur.',
        } },
        { t: 'ayah', ar: 'وَمَآ أَرْسَلْنَـٰكَ إِلَّا رَحْمَةً لِّلْعَـٰلَمِينَ', ref: '21:107', text: {
          az: '«Biz səni ancaq aləmlərə rəhmət olaraq göndərdik».',
          en: '“And We have not sent you except as a mercy to the worlds.”',
          ru: '«Мы отправили тебя только в качестве милости для миров».',
          ar: 'وما أرسلناك إلا رحمة للعالمين.',
          tr: '“Biz seni ancak âlemlere rahmet olarak gönderdik.”',
        } },
        { t: 'ayah', ar: 'مَّا كَانَ مُحَمَّدٌ أَبَآ أَحَدٍ مِّن رِّجَالِكُمْ وَلَـٰكِن رَّسُولَ ٱللَّهِ وَخَاتَمَ ٱلنَّبِيِّـۧنَ', ref: '33:40', text: {
          az: '«Muhəmməd sizin kişilərinizdən heç birinin atası deyil, lakin o, Allahın Elçisi və peyğəmbərlərin sonuncusudur».',
          en: '“Muhammad is not the father of any of your men, but he is the Messenger of Allah and the Seal of the Prophets.”',
          ru: '«Мухаммад не был отцом кого-либо из ваших мужчин, но он — Посланник Аллаха и печать пророков».',
          ar: 'ما كان محمد أبا أحد من رجالكم ولكن رسول الله وخاتم النبيين.',
          tr: '“Muhammed sizin erkeklerinizden hiçbirinin babası değildir; fakat o, Allah’ın Resûlü ve peygamberlerin sonuncusudur.”',
        } },
        { t: 'qa', items: [
          {
            q: {
              az: 'Müsəlmanlar İsaya (a.s.) necə baxırlar?',
              en: 'How do Muslims view Jesus (peace be upon him)?',
              ru: 'Как мусульмане относятся к Иисусу (мир ему)?',
              ar: 'ما موقف المسلمين من عيسى عليه السلام؟',
              tr: 'Müslümanlar İsa’ya (a.s.) nasıl bakar?',
            },
            a: {
              az: 'Müsəlmanlar İsanı (a.s.) sevir və hörmət edirlər: o, Allahın böyük peyğəmbərlərindən biridir, atasız olaraq bakirə Məryəmdən möcüzə ilə doğulub. Amma o, Allahın oğlu və ya ilah deyil — Allahın qulu və elçisidir. Quran onun yaradılışını Adəmin yaradılışına bənzədir: Allah «Ol!» dedi və oldu (Ali-İmran 3:59).',
              en: 'Muslims love and honour Jesus (peace be upon him): he is one of the great Prophets of Allah, born miraculously of the virgin Mary without a father. But he is not the son of God or divine — he is the servant and Messenger of Allah. The Quran likens his creation to Adam’s: Allah said “Be!” and he was (Al ‘Imran 3:59).',
              ru: 'Мусульмане любят и почитают Иисуса (мир ему): он — один из великих пророков Аллаха, чудесно рождённый девой Марьям без отца. Но он не сын Бога и не божество — он раб и посланник Аллаха. Коран уподобляет его сотворение сотворению Адама: Аллах сказал «Будь!» — и он стал (Аль ‘Имран 3:59).',
              ar: 'يحب المسلمون عيسى عليه السلام ويوقّرونه؛ فهو من أنبياء الله العظام، وُلد بمعجزة من مريم العذراء بلا أب، لكنه ليس ابن الله ولا إلهًا، بل عبد الله ورسوله، ومثله عند الله كمثل آدم خلقه من تراب ثم قال له كن فيكون (آل عمران 59).',
              tr: 'Müslümanlar İsa’yı (a.s.) sever ve ona saygı gösterir: o, Allah’ın büyük peygamberlerinden biridir, babasız olarak bakire Meryem’den mucizevi şekilde doğmuştur. Ama o Allah’ın oğlu veya ilah değildir — Allah’ın kulu ve elçisidir. Kur’an onun yaratılışını Âdem’in yaratılışına benzetir: Allah “Ol!” dedi, o da oldu (Âl-i İmrân 3:59).',
            },
          },
        ] },
        { t: 'ayah', ar: 'إِنَّ مَثَلَ عِيسَىٰ عِندَ ٱللَّهِ كَمَثَلِ ءَادَمَ ۖ خَلَقَهُۥ مِن تُرَابٍ ثُمَّ قَالَ لَهُۥ كُن فَيَكُونُ', ref: '3:59', text: {
          az: '«Allah yanında İsanın misalı Adəmin misalı kimidir: Onu torpaqdan yaratdı, sonra ona «Ol!» dedi və o, oldu».',
          en: '“The example of Jesus with Allah is like that of Adam: He created him from dust, then said to him “Be,” and he was.”',
          ru: '«Иса перед Аллахом подобен Адаму: Он сотворил его из праха, затем сказал ему «Будь!» — и он стал».',
          ar: 'إن مثل عيسى عند الله كمثل آدم خلقه من تراب ثم قال له كن فيكون.',
          tr: '“Allah katında İsa’nın durumu Âdem’in durumu gibidir: Onu topraktan yarattı, sonra ona “Ol!” dedi, o da oluverdi.”',
        } },
      ],
    },
    // ─────────────────────────────────────────────
    {
      id: 'quran',
      title: {
        az: 'Quran',
        en: 'The Quran',
        ru: 'Коран',
        ar: 'القرآن الكريم',
        tr: 'Kur’an',
      },
      blocks: [
        { t: 'p', text: {
          az: 'Quran Allahın kəlamıdır; mələk Cəbrayıl vasitəsilə Peyğəmbərə ﷺ ərəb dilində nazil edilib. O, 114 surədən ibarətdir və nazil olduğu gündən bu günə qədər həm yazılı, həm də milyonlarla insanın yaddaşında dəyişmədən qorunub. Başqa dillərə tərcümələr Quranın özü deyil, onun mənalarının tərcüməsidir.',
          en: 'The Quran is the speech of Allah, revealed in Arabic to the Prophet ﷺ through the angel Gabriel. It consists of 114 surahs and has been preserved unchanged from the day of its revelation until today, both in writing and in the memory of millions of people. Translations into other languages are not the Quran itself but translations of its meanings.',
          ru: 'Коран — речь Аллаха, ниспосланная Пророку ﷺ на арабском языке через ангела Джибриля. Он состоит из 114 сур и с момента ниспослания до сегодняшнего дня сохраняется неизменным — и в записи, и в памяти миллионов людей. Переводы на другие языки — не сам Коран, а перевод его смыслов.',
          ar: 'القرآن كلام الله، نزل به جبريل على النبي ﷺ بلسان عربي، وهو مائة وأربع عشرة سورة، محفوظ من يوم نزوله إلى اليوم في السطور وفي صدور الملايين. وترجماته إلى اللغات الأخرى ليست قرآنًا، بل ترجمة لمعانيه.',
          tr: 'Kur’an, Allah’ın kelamıdır; melek Cebrail aracılığıyla Peygamber’e ﷺ Arapça olarak indirilmiştir. 114 sureden oluşur ve indiği günden bugüne hem yazılı olarak hem de milyonlarca insanın hafızasında değişmeden korunmuştur. Başka dillere yapılan tercümeler Kur’an’ın kendisi değil, anlamlarının tercümesidir.',
        } },
        { t: 'ayah', ar: 'ذَٰلِكَ ٱلْكِتَـٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ', ref: '2:2', text: {
          az: '«Bu, (o) Kitabdır ki, onda heç bir şübhə yoxdur. O, müttəqilər üçün hidayətdir».',
          en: '“This is the Book about which there is no doubt, a guidance for those conscious of Allah.”',
          ru: '«Это Писание, в котором нет сомнения, — верное руководство для богобоязненных».',
          ar: 'ذلك الكتاب لا ريب فيه هدى للمتقين.',
          tr: '“Bu, kendisinde hiçbir şüphe olmayan Kitap’tır; Allah’a karşı gelmekten sakınanlar için bir hidayettir.”',
        } },
        { t: 'ayah', ar: 'إِنَّا نَحْنُ نَزَّلْنَا ٱلذِّكْرَ وَإِنَّا لَهُۥ لَحَـٰفِظُونَ', ref: '15:9', text: {
          az: '«Şübhəsiz ki, Zikri (Quranı) Biz nazil etdik və onu qoruyan da, əlbəttə, Bizik».',
          en: '“Indeed, it is We who sent down the Reminder, and indeed, We will be its guardian.”',
          ru: '«Воистину, Мы ниспослали Напоминание, и Мы оберегаем его».',
          ar: 'إنا نحن نزلنا الذكر وإنا له لحافظون.',
          tr: '“Şüphesiz Zikri (Kur’an’ı) Biz indirdik ve onun koruyucusu elbette Biziz.”',
        } },
        { t: 'note', kind: 'tip', text: {
          az: 'Quranı ərəbcə və tərcüməsi ilə saytın «Quran» bölməsində oxuya və dinləyə bilərsiniz.',
          en: 'You can read and listen to the Quran in Arabic with a translation in the site’s “Quran” section.',
          ru: 'Коран на арабском с переводом можно читать и слушать в разделе сайта «Коран».',
          ar: 'يمكنك قراءة القرآن والاستماع إليه مع الترجمة في قسم «القرآن» في الموقع.',
          tr: 'Kur’an’ı Arapça ve tercümesiyle sitenin “Kur’an” bölümünde okuyabilir ve dinleyebilirsiniz.',
        } },
      ],
    },
    // ─────────────────────────────────────────────
    {
      id: 'pillars',
      title: {
        az: 'İslamın beş rüknü və imanın altı rüknü',
        en: 'The five pillars of Islam and the six pillars of faith',
        ru: 'Пять столпов ислама и шесть столпов веры',
        ar: 'أركان الإسلام الخمسة وأركان الإيمان الستة',
        tr: 'İslam’ın beş şartı ve imanın altı şartı',
      },
      blocks: [
        { t: 'hadith',
          ar: 'بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلاَةِ، وَإِيتَاءِ الزَّكَاةِ، وَالْحَجِّ، وَصَوْمِ رَمَضَانَ',
          text: {
            az: '«İslam beş şey üzərində qurulub: Allahdan başqa haqq ilah olmadığına və Muhəmmədin Allahın Elçisi olduğuna şəhadət gətirmək, namaz qılmaq, zəkat vermək, həcc etmək və Ramazan orucunu tutmaq».',
            en: '“Islam is built upon five: testifying that there is no deity worthy of worship except Allah and that Muhammad is the Messenger of Allah, establishing prayer, giving zakah, Hajj, and fasting Ramadan.”',
            ru: '«Ислам основан на пяти: свидетельстве, что нет божества, достойного поклонения, кроме Аллаха и что Мухаммад — посланник Аллаха, совершении намаза, выплате закята, хадже и посте в Рамадан».',
            ar: 'بني الإسلام على خمس: شهادة أن لا إله إلا الله وأن محمدًا رسول الله، وإقام الصلاة، وإيتاء الزكاة، والحج، وصوم رمضان.',
            tr: '“İslam beş şey üzerine kurulmuştur: Allah’tan başka ibadete layık ilah olmadığına ve Muhammed’in Allah’ın Resûlü olduğuna şahitlik etmek, namaz kılmak, zekât vermek, hac ve Ramazan orucu.”',
          },
          src: { az: 'Buxari 8; Müslim 16 (İbn Ömər)', en: 'al-Bukhari 8; Muslim 16 (Ibn Umar)', ru: 'Бухари 8; Муслим 16 (Ибн Умар)', ar: 'البخاري 8، ومسلم 16 (عن ابن عمر)', tr: 'Buhari 8; Müslim 16 (İbn Ömer)' },
          grade: SAHIH,
        },
        { t: 'table',
          head: [
            { az: 'Rükn', en: 'Pillar', ru: 'Столп', ar: 'الركن', tr: 'Şart' },
            { az: 'Qısa izah', en: 'Brief explanation', ru: 'Кратко', ar: 'بيان مختصر', tr: 'Kısa açıklama' },
          ],
          rows: [
            [
              { az: 'Şəhadət', en: 'Shahadah', ru: 'Шахада', ar: 'الشهادتان', tr: 'Şehadet' },
              { az: 'Yalnız Allaha ibadət etmək və Muhəmmədə ﷺ tabe olmaq barədə qəlbdən inanılan və dillə deyilən söz', en: 'The testimony, believed in the heart and spoken with the tongue, to worship Allah alone and follow Muhammad ﷺ', ru: 'Свидетельство, принятое сердцем и произнесённое языком: поклоняться только Аллаху и следовать за Мухаммадом ﷺ', ar: 'الإقرار بالقلب واللسان بإفراد الله بالعبادة واتباع محمد ﷺ', tr: 'Yalnız Allah’a ibadet etmek ve Muhammed’e ﷺ uymak üzerine kalple inanılıp dille söylenen söz' },
            ],
            [
              { az: 'Namaz', en: 'Prayer (salah)', ru: 'Намаз', ar: 'الصلاة', tr: 'Namaz' },
              { az: 'Gündə beş vaxt namaz — Allahla gündəlik bağlılıq', en: 'Five daily prayers — a daily connection with Allah', ru: 'Пять ежедневных молитв — ежедневная связь с Аллахом', ar: 'خمس صلوات في اليوم والليلة، صلة يومية بالله', tr: 'Günde beş vakit namaz — Allah ile günlük bağ' },
            ],
            [
              { az: 'Zəkat', en: 'Zakah', ru: 'Закят', ar: 'الزكاة', tr: 'Zekât' },
              { az: 'Müəyyən həddə çatan maldan ildə bir dəfə ehtiyacı olanlara verilən pay', en: 'A yearly share given to those in need from wealth that reaches a set threshold', ru: 'Ежегодная доля нуждающимся с имущества, достигшего установленного порога', ar: 'حق في المال البالغ نصابًا يُعطى للمستحقين كل عام', tr: 'Belirli bir sınıra ulaşan maldan yılda bir ihtiyaç sahiplerine verilen pay' },
            ],
            [
              { az: 'Oruc', en: 'Fasting', ru: 'Пост', ar: 'الصيام', tr: 'Oruç' },
              { az: 'Ramazan ayında dan yeri ağarandan gün batana qədər yemək, içmək və yaxınlıqdan çəkinmək', en: 'In Ramadan, refraining from food, drink and intimacy from dawn until sunset', ru: 'В Рамадан — воздержание от еды, питья и близости от рассвета до заката', ar: 'الإمساك عن الطعام والشراب والجماع من الفجر إلى المغرب في رمضان', tr: 'Ramazan ayında tan yerinin ağarmasından güneş batana kadar yemek, içmek ve cinsel ilişkiden uzak durmak' },
            ],
            [
              { az: 'Həcc', en: 'Hajj', ru: 'Хадж', ar: 'الحج', tr: 'Hac' },
              { az: 'Gücü çatana ömründə bir dəfə Məkkəyə ziyarət', en: 'Pilgrimage to Makkah once in a lifetime for those able', ru: 'Паломничество в Мекку раз в жизни для того, кто способен', ar: 'قصد مكة للنسك مرة في العمر لمن استطاع', tr: 'Gücü yetenin ömründe bir kez Mekke’ye yaptığı ziyaret' },
            ],
          ],
        },
        { t: 'hadith',
          ar: 'أَنْ تُؤْمِنَ بِاللَّهِ وَمَلاَئِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ وَالْيَوْمِ الآخِرِ وَتُؤْمِنَ بِالْقَدَرِ خَيْرِهِ وَشَرِّهِ',
          text: {
            az: 'Cəbrayıl (a.s.) imanın nə olduğunu soruşanda Peyğəmbər ﷺ dedi: «Allaha, Onun mələklərinə, kitablarına, elçilərinə, Axirət gününə iman gətirməyin və qədərə — onun xeyrinə və şərinə iman gətirməyindir».',
            en: 'When Gabriel asked what faith is, the Prophet ﷺ said: “That you believe in Allah, His angels, His Books, His Messengers and the Last Day, and that you believe in the divine decree, its good and its bad.”',
            ru: 'Когда Джибриль спросил, что такое вера, Пророк ﷺ сказал: «Чтобы ты уверовал в Аллаха, Его ангелов, Его Писания, Его посланников и в Последний день, и уверовал в предопределение — его добро и его зло».',
            ar: 'لما سأل جبريل عن الإيمان قال النبي ﷺ: أن تؤمن بالله وملائكته وكتبه ورسله واليوم الآخر، وتؤمن بالقدر خيره وشره.',
            tr: 'Cebrail imanın ne olduğunu sorunca Peygamber ﷺ şöyle dedi: “Allah’a, meleklerine, kitaplarına, peygamberlerine ve ahiret gününe iman etmen; kadere, hayrına ve şerrine iman etmendir.”',
          },
          src: { az: 'Müslim 8 (Ömər ibn əl-Xəttab)', en: 'Muslim 8 (Umar ibn al-Khattab)', ru: 'Муслим 8 (Умар ибн аль-Хаттаб)', ar: 'مسلم 8 (عن عمر بن الخطاب)', tr: 'Müslim 8 (Ömer b. Hattâb)' },
          grade: SAHIH,
        },
        { t: 'list', ordered: true, items: [
          { az: 'Allaha iman — Onun varlığına, Rəbb olmasına, yeganə ibadət olunana layiq olmasına, ad və sifətlərinə.', en: 'Belief in Allah — His existence, His lordship, His sole right to worship, His names and attributes.', ru: 'Вера в Аллаха — в Его бытие, господство, исключительное право на поклонение, Его имена и атрибуты.', ar: 'الإيمان بالله: بوجوده وربوبيته وألوهيته وأسمائه وصفاته.', tr: 'Allah’a iman — varlığına, Rab oluşuna, tek ibadet edilmeye layık oluşuna, isim ve sıfatlarına.' },
          { az: 'Mələklərə iman — Allahın nurdan yaratdığı, Ona itaət edən qullar.', en: 'Belief in the angels — servants created by Allah from light who obey Him.', ru: 'Вера в ангелов — рабов Аллаха, сотворённых из света и покорных Ему.', ar: 'الإيمان بالملائكة: عباد خلقهم الله من نور يطيعونه.', tr: 'Meleklere iman — Allah’ın nurdan yarattığı, O’na itaat eden kullar.' },
          { az: 'Kitablara iman — Tövrat, İncil, Zəbur və sonuncusu Quran.', en: 'Belief in the Books — the Torah, the Gospel, the Psalms and lastly the Quran.', ru: 'Вера в Писания — Таурат, Инджиль, Забур и последнее — Коран.', ar: 'الإيمان بالكتب: التوراة والإنجيل والزبور وآخرها القرآن.', tr: 'Kitaplara iman — Tevrat, İncil, Zebur ve sonuncusu Kur’an.' },
          { az: 'Peyğəmbərlərə iman — Nuh, İbrahim, Musa, İsa və sonuncu Muhəmməd ﷺ daxil olmaqla hamısına.', en: 'Belief in the Messengers — all of them, including Noah, Abraham, Moses, Jesus and lastly Muhammad ﷺ.', ru: 'Вера в посланников — во всех, включая Нуха, Ибрахима, Мусу, Ису и последнего — Мухаммада ﷺ.', ar: 'الإيمان بالرسل جميعًا: نوح وإبراهيم وموسى وعيسى وخاتمهم محمد ﷺ.', tr: 'Peygamberlere iman — Nuh, İbrahim, Musa, İsa ve sonuncusu Muhammed ﷺ dahil hepsine.' },
          { az: 'Axirət gününə iman — dirilmə, hesab, Cənnət və Cəhənnəm.', en: 'Belief in the Last Day — resurrection, judgement, Paradise and Hell.', ru: 'Вера в Последний день — воскрешение, расчёт, Рай и Ад.', ar: 'الإيمان باليوم الآخر: البعث والحساب والجنة والنار.', tr: 'Ahiret gününe iman — diriliş, hesap, Cennet ve Cehennem.' },
          { az: 'Qədərə iman — hər şeyin Allahın elmi, yazısı, istəyi və yaratması ilə olduğuna.', en: 'Belief in the divine decree — that everything happens by Allah’s knowledge, writing, will and creation.', ru: 'Вера в предопределение — что всё происходит по знанию Аллаха, Его записи, воле и творению.', ar: 'الإيمان بالقدر: أن كل شيء بعلم الله وكتابته ومشيئته وخلقه.', tr: 'Kadere iman — her şeyin Allah’ın ilmi, yazması, dilemesi ve yaratmasıyla olduğuna.' },
        ] },
      ],
    },
    // ─────────────────────────────────────────────
    {
      id: 'afterlife',
      title: {
        az: 'Ölümdən sonra nə olur?',
        en: 'What happens after death?',
        ru: 'Что происходит после смерти?',
        ar: 'ماذا بعد الموت؟',
        tr: 'Ölümden sonra ne olur?',
      },
      blocks: [
        { t: 'p', text: {
          az: 'İslama görə ölüm son deyil, keçiddir. Hər insan qəbir həyatından sonra Qiyamət günü diriləcək və dünyada etdiklərinin hesabını verəcək. Allah heç kimə zülm etməz: ən kiçik yaxşılıq da, ən kiçik pislik də qarşılıqsız qalmaz. İman gətirib yaxşı əməl edənlərin sonu Cənnət, inkar edənlərin sonu isə Cəhənnəmdir.',
          en: 'In Islam, death is not the end but a passage. After the life of the grave, every person will be resurrected on the Day of Judgement and will answer for what he did in this world. Allah wrongs no one: not even the smallest good or the smallest evil will go without recompense. The end of those who believe and do good is Paradise, and of those who disbelieve is Hell.',
          ru: 'В исламе смерть — не конец, а переход. После жизни в могиле каждый человек будет воскрешён в Судный день и даст отчёт за то, что делал в этом мире. Аллах никого не обижает: ни малейшее добро, ни малейшее зло не останутся без воздаяния. Исход уверовавших и творивших добро — Рай, а неверующих — Ад.',
          ar: 'الموت في الإسلام ليس نهاية بل انتقال؛ فبعد حياة البرزخ يُبعث كل إنسان يوم القيامة ويحاسَب على عمله في الدنيا. والله لا يظلم أحدًا، فلا يضيع مثقال ذرة من خير أو شر. ومصير المؤمنين العاملين الجنة، ومصير الكافرين النار.',
          tr: 'İslam’a göre ölüm son değil, bir geçiştir. Kabir hayatından sonra her insan Kıyamet günü diriltilecek ve dünyada yaptıklarının hesabını verecektir. Allah kimseye zulmetmez: en küçük iyilik de en küçük kötülük de karşılıksız kalmaz. İman edip iyi amel işleyenlerin sonu Cennet, inkâr edenlerin sonu ise Cehennem’dir.',
        } },
        { t: 'ayah', ar: 'فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُۥ وَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ شَرًّا يَرَهُۥ', ref: '99:7-8', text: {
          az: '«Kim zərrə qədər yaxşılıq etsə, onu görəcək. Kim zərrə qədər pislik etsə, onu görəcək».',
          en: '“Whoever does an atom’s weight of good will see it, and whoever does an atom’s weight of evil will see it.”',
          ru: '«Кто сделал добра на вес пылинки, увидит его, и кто сделал зла на вес пылинки, увидит его».',
          ar: 'فمن يعمل مثقال ذرة خيرًا يره، ومن يعمل مثقال ذرة شرًّا يره.',
          tr: '“Kim zerre ağırlığınca bir hayır işlerse onu görür. Kim de zerre ağırlığınca bir kötülük işlerse onu görür.”',
        } },
        { t: 'ayah', ar: 'كُلُّ نَفْسٍ ذَآئِقَةُ ٱلْمَوْتِ ۗ وَإِنَّمَا تُوَفَّوْنَ أُجُورَكُمْ يَوْمَ ٱلْقِيَـٰمَةِ ۖ فَمَن زُحْزِحَ عَنِ ٱلنَّارِ وَأُدْخِلَ ٱلْجَنَّةَ فَقَدْ فَازَ ۗ وَمَا ٱلْحَيَوٰةُ ٱلدُّنْيَآ إِلَّا مَتَـٰعُ ٱلْغُرُورِ', ref: '3:185', text: {
          az: '«Hər can ölümü dadacaq. Sizin mükafatınız Qiyamət günü tam veriləcək. Kim oddan uzaqlaşdırılıb Cənnətə daxil edilsə, o, uğur qazanmışdır. Dünya həyatı aldadıcı bir zövqdən başqa bir şey deyil».',
          en: '“Every soul will taste death, and you will be paid your full rewards only on the Day of Resurrection. Whoever is drawn away from the Fire and admitted to Paradise has succeeded. And the life of this world is nothing but the enjoyment of delusion.”',
          ru: '«Каждая душа вкусит смерть, и в День воскресения вы получите сполна свои награды. Кто будет отдалён от Огня и введён в Рай, тот преуспел. А мирская жизнь — лишь обманчивое наслаждение».',
          ar: 'كل نفس ذائقة الموت وإنما توفون أجوركم يوم القيامة فمن زحزح عن النار وأدخل الجنة فقد فاز وما الحياة الدنيا إلا متاع الغرور.',
          tr: '“Her can ölümü tadacaktır. Ecirleriniz ancak Kıyamet günü tam olarak verilecektir. Kim ateşten uzaklaştırılıp Cennet’e sokulursa, o gerçekten kurtuluşa ermiştir. Dünya hayatı aldatıcı bir geçimlikten başka bir şey değildir.”',
        } },
        { t: 'ayah', ar: 'قُلْ يَـٰعِبَادِىَ ٱلَّذِينَ أَسْرَفُوا۟ عَلَىٰٓ أَنفُسِهِمْ لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ ۚ إِنَّ ٱللَّهَ يَغْفِرُ ٱلذُّنُوبَ جَمِيعًا ۚ إِنَّهُۥ هُوَ ٱلْغَفُورُ ٱلرَّحِيمُ', ref: '39:53', text: {
          az: '«De: Ey özlərinə qarşı həddi aşan qullarım! Allahın rəhmətindən ümidinizi kəsməyin. Şübhəsiz ki, Allah bütün günahları bağışlayır. O, Bağışlayandır, Rəhmlidir».',
          en: '“Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins. He is the Forgiving, the Merciful.”',
          ru: '«Скажи: О Мои рабы, которые излишествовали во вред самим себе! Не отчаивайтесь в милости Аллаха. Воистину, Аллах прощает все грехи. Он — Прощающий, Милосердный».',
          ar: 'قل يا عبادي الذين أسرفوا على أنفسهم لا تقنطوا من رحمة الله إن الله يغفر الذنوب جميعًا إنه هو الغفور الرحيم.',
          tr: '“De ki: Ey kendilerinin aleyhine aşırı giden kullarım! Allah’ın rahmetinden ümidinizi kesmeyin. Şüphesiz Allah bütün günahları bağışlar. Çünkü O, çok bağışlayan, çok merhamet edendir.”',
        } },
      ],
    },
    // ─────────────────────────────────────────────
    {
      id: 'become-muslim',
      title: {
        az: 'Necə müsəlman olmaq olar?',
        en: 'How does one become Muslim?',
        ru: 'Как стать мусульманином?',
        ar: 'كيف يدخل المرء في الإسلام؟',
        tr: 'Nasıl Müslüman olunur?',
      },
      blocks: [
        { t: 'p', text: {
          az: 'Müsəlman olmaq çətin deyil və heç bir mərasim tələb etmir. İnsan şəhadətin mənasını anlayıb qəlbdən ona inandıqda və onu dili ilə dedikdə müsəlman olur. Bunun üçün məscidə getmək, şahid tapmaq və ya sənəd almaq şərt deyil — İslam insanla Rəbbi arasındadır. Sənəd yalnız sonradan rəsmi işlər (məs. həcc) üçün faydalı ola bilər.',
          en: 'Becoming Muslim is not difficult and requires no ceremony. A person becomes Muslim when he understands the meaning of the shahadah, believes it with his heart and says it with his tongue. Going to a mosque, finding witnesses or getting a certificate is not a condition — Islam is between a person and his Lord. A certificate may only be useful later for official matters (e.g. Hajj).',
          ru: 'Стать мусульманином несложно, и для этого не нужен обряд. Человек становится мусульманином, когда понимает смысл шахады, верует в неё сердцем и произносит её языком. Идти в мечеть, искать свидетелей или получать документ — не условие: ислам — это дело между человеком и его Господом. Документ может пригодиться лишь позже для официальных дел (например, для хаджа).',
          ar: 'الدخول في الإسلام سهل ولا يحتاج إلى مراسم؛ فيصير المرء مسلمًا إذا فهم معنى الشهادتين واعتقدهما بقلبه ونطق بهما بلسانه. ولا يُشترط الذهاب إلى المسجد ولا الشهود ولا الشهادة الرسمية؛ فالإسلام بين العبد وربه، وقد تنفع الشهادة الرسمية لاحقًا في المعاملات كالحج.',
          tr: 'Müslüman olmak zor değildir ve hiçbir tören gerektirmez. Kişi şehadetin anlamını kavrayıp kalbiyle ona inandığında ve diliyle söylediğinde Müslüman olur. Bunun için camiye gitmek, şahit bulmak veya belge almak şart değildir — İslam, insanla Rabbi arasındadır. Belge ancak daha sonra resmî işler (örneğin hac) için faydalı olabilir.',
        } },
        { t: 'dua',
          ar: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ',
          translit: { az: 'Əşhədu əl-la ilahə illəllah, və əşhədu ənnə Muhəmmədən Rəsulullah.', en: 'Ash-hadu an la ilaha illa-llah, wa ash-hadu anna Muhammadan rasulu-llah.', ru: 'Ашхаду ан ля иляха илля-Ллах, ва ашхаду анна Мухаммадан расулю-Ллах.', ar: 'أشهد أن لا إله إلا الله، وأشهد أن محمدًا رسول الله', tr: 'Eşhedü en lâ ilâhe illallah, ve eşhedü enne Muhammeden Resûlullah.' },
          text: { az: 'Şəhadət edirəm ki, Allahdan başqa ibadətə layiq haqq ilah yoxdur və şəhadət edirəm ki, Muhəmməd Allahın Elçisidir.', en: 'I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is the Messenger of Allah.', ru: 'Свидетельствую, что нет божества, достойного поклонения, кроме Аллаха, и свидетельствую, что Мухаммад — посланник Аллаха.', ar: 'أشهد أنه لا معبود بحق إلا الله، وأشهد أن محمدًا رسول الله.', tr: 'Şahitlik ederim ki Allah’tan başka ibadete layık hak ilah yoktur ve şahitlik ederim ki Muhammed Allah’ın Resûlü’dür.' },
          src: { az: 'Şəhadət kəliməsi', en: 'The testimony of faith', ru: 'Слова свидетельства', ar: 'كلمة الشهادة', tr: 'Kelime-i şehadet' },
        },
        { t: 'ayah', ar: 'إِلَّا مَن تَابَ وَءَامَنَ وَعَمِلَ عَمَلًا صَـٰلِحًا فَأُو۟لَـٰٓئِكَ يُبَدِّلُ ٱللَّهُ سَيِّـَٔاتِهِمْ حَسَنَـٰتٍ ۗ وَكَانَ ٱللَّهُ غَفُورًا رَّحِيمًا', ref: '25:70', text: {
          az: '«Tövbə edib iman gətirən və yaxşı əməl edənlər istisnadır. Allah onların pisliklərini yaxşılıqlara çevirər. Allah Bağışlayandır, Rəhmlidir».',
          en: '“Except those who repent, believe and do righteous work — for them Allah will replace their evil deeds with good. Allah is Forgiving, Merciful.”',
          ru: '«Кроме тех, кто раскаялся, уверовал и творил праведные дела. Их злые деяния Аллах заменит добрыми. Аллах — Прощающий, Милосердный».',
          ar: 'إلا من تاب وآمن وعمل عملًا صالحًا فأولئك يبدل الله سيئاتهم حسنات وكان الله غفورًا رحيمًا.',
          tr: '“Ancak tövbe eden, iman eden ve salih amel işleyenler başka. Allah onların kötülüklerini iyiliklere çevirir. Allah çok bağışlayan, çok merhamet edendir.”',
        } },
        { t: 'qa', items: [
          {
            q: {
              az: 'Müsəlman olmaq üçün şahid lazımdırmı?',
              en: 'Do I need witnesses to become Muslim?',
              ru: 'Нужны ли свидетели, чтобы стать мусульманином?',
              ar: 'هل يشترط الشهود للدخول في الإسلام؟',
              tr: 'Müslüman olmak için şahit gerekir mi?',
            },
            a: {
              az: 'Xeyr. İnsanın müsəlman olması üçün İslamını kiminsə qarşısında elan etməsi şərt deyil; İslam insanla Rəbbi arasındadır. Əgər rəsmi sənədlər üçün insanları şahid tutmaq istəsə, bunda qəbahət yoxdur, sadəcə bu, İslamın səhih olması üçün şərt sayılmamalıdır.',
              en: 'No. For a person to become Muslim it is not necessary to declare his Islam before anyone; Islam is between a person and his Lord. If he wants people to witness it for official documents, there is nothing wrong with that, as long as it is not considered a condition for his Islam to be valid.',
              ru: 'Нет. Чтобы человек стал мусульманином, не обязательно объявлять о своём исламе перед кем-либо; ислам — дело между человеком и его Господом. Если он хочет, чтобы люди засвидетельствовали это для официальных документов, в этом нет ничего плохого, лишь бы это не считалось условием действительности его ислама.',
              ar: 'لا؛ لا يشترط لصحة إسلام المرء أن يعلنه أمام أحد، فالإسلام أمر بين العبد وربه. وإن أراد أن يُشهد الناس لتوثيقه في أوراقه الرسمية فلا بأس، على ألا يُجعل ذلك شرطًا لصحة الإسلام.',
              tr: 'Hayır. Kişinin Müslüman olması için İslam’ını birinin önünde ilan etmesi şart değildir; İslam, insanla Rabbi arasındadır. Resmî belgeler için insanları şahit tutmak isterse bunda sakınca yoktur; yeter ki bu, İslam’ının geçerliliği için şart sayılmasın.',
            },
            ref: { az: 'IslamQA, sual 49715', en: 'IslamQA, question 49715', ru: '«Ислам: вопрос и ответ», № 49715', ar: 'الإسلام سؤال وجواب، رقم 49715', tr: 'İslam Soru-Cevap, soru 49715' },
            url: 'https://islamqa.info/en/answers/49715',
          },
          {
            q: {
              az: 'Keçmiş günahlarım nə olacaq?',
              en: 'What about my past sins?',
              ru: 'Что будет с моими прошлыми грехами?',
              ar: 'وماذا عن ذنوبي السابقة؟',
              tr: 'Geçmiş günahlarım ne olacak?',
            },
            a: {
              az: 'İslam ondan əvvəlkiləri silir. Səhabə Amr ibn əl-As müsəlman olanda bağışlanmasını şərt qoymaq istəmişdi; Peyğəmbər ﷺ ona dedi: «Bilmirsənmi ki, İslam ondan əvvəlkiləri silir?» (Müslim 121). Yeni müsəlman təmiz bir səhifə ilə başlayır.',
              en: 'Islam wipes out what came before it. When the Companion Amr ibn al-As became Muslim he wanted to make forgiveness a condition; the Prophet ﷺ said to him: “Do you not know that Islam wipes out what came before it?” (Muslim 121). A new Muslim starts with a clean page.',
              ru: 'Ислам стирает то, что было до него. Когда сподвижник Амр ибн аль-Ас принимал ислам, он хотел поставить условием прощение; Пророк ﷺ сказал ему: «Разве ты не знаешь, что ислам стирает то, что было до него?» (Муслим 121). Новый мусульманин начинает с чистого листа.',
              ar: 'الإسلام يهدم ما كان قبله؛ فلما أراد عمرو بن العاص أن يشترط المغفرة عند إسلامه قال له النبي ﷺ: أما علمت أن الإسلام يهدم ما كان قبله؟ (مسلم 121). فالمسلم الجديد يبدأ صفحة بيضاء.',
              tr: 'İslam kendinden öncekileri siler. Sahabi Amr b. Âs Müslüman olurken bağışlanmayı şart koşmak istemişti; Peygamber ﷺ ona: “İslam’ın kendinden öncekileri sildiğini bilmiyor musun?” dedi (Müslim 121). Yeni Müslüman tertemiz bir sayfayla başlar.',
            },
          },
        ] },
        { t: 'note', kind: 'tip', text: {
          az: 'Müsəlman olduqdan sonrakı ilk addımlar — qüsl, namazı öyrənmək, ilk surələr, ailə ilə münasibət — «Yeni müsəlmanın ilk addımları» dərsində izah olunur.',
          en: 'The first steps after becoming Muslim — ghusl, learning the prayer, the first surahs, relations with family — are explained in the lesson “First steps for a new Muslim”.',
          ru: 'Первые шаги после принятия ислама — гусль, изучение намаза, первые суры, отношения с семьёй — разъясняются в уроке «Первые шаги нового мусульманина».',
          ar: 'الخطوات الأولى بعد الإسلام، من الغسل وتعلم الصلاة وأول السور والتعامل مع الأهل، مبيّنة في درس «أولى خطوات المسلم الجديد».',
          tr: 'Müslüman olduktan sonraki ilk adımlar — gusül, namazı öğrenmek, ilk sureler, aileyle ilişkiler — “Yeni Müslümanın ilk adımları” dersinde anlatılmıştır.',
        } },
      ],
    },
  ],
  sources: [
    { label: 'IslamQA 11819 — How to become a Muslim', url: 'https://islamqa.info/en/answers/11819' },
    { label: 'IslamQA 49715 — Do you need witnesses to take shahadah?', url: 'https://islamqa.info/en/answers/49715' },
    { label: 'Muhəmməd ibn Abdülvəhhab — «Üç əsas» (Usulus-sələsə)' },
    { label: 'Quran mətni: api.quran.com (Osmani yazısı)', url: 'https://quran.com' },
    { label: 'Hədis mətnləri: fawazahmed0/hadith-api', url: 'https://github.com/fawazahmed0/hadith-api' },
  ],
}
