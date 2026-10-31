// ═══════════════════════════════════════════════════════
// İslami söz lüğəti — ƏXLAQ (qəlb əməlləri, ədəb) və TARİX (sirə,
// səhabələr, müqəddəs məkanlar) terminləri (5 dil).
//
// Təriflər Əhli-Sünnə vəl-Camaanın, yəni Sələfin yoluna uyğundur:
// Əhli-Beyt də, səhabələr də sevilir, heç birində həddi aşmaq (ğuluvv)
// yoxdur; Peyğəmbərin ﷺ zövcələri Əhli-Beytdəndir. Məkanlar barədə
// bidət olan təbərrük iddiaları yazılmır.
// Ayələr api.quran.com-dan, hədis nömrələri fawazahmed0/hadith-api
// (Buxari — nömrə; Müslim — Fuad Abdulbaqi nömrəsi, "arabicnumber")
// ilə yoxlanılıb. Yoxlanılmayan istinad yazılmır.
//
// Sahələr: term (az), ar, translit, cat, def{az,en,ru,ar,tr},
// rel — əlaqəli terminlərin id-ləri (translit → kiçik hərf, apostrofsuz,
// boşluq → "-"), lesson — /learn/<slug> dərsi (varsa).
// ═══════════════════════════════════════════════════════

export const GLOSSARY_AKHLAQ_HISTORY = [
  // ─────────────── ƏXLAQ ───────────────
  {
    term: 'Səbr', ar: 'الصبر', translit: 'Sabr', cat: 'akhlaq',
    def: {
      az: 'Nəfsi şikayətdən və Allahın razı olmadığı əməldən saxlamaq. Üç növü var: itaətə səbr, günahdan çəkinməyə səbr və Allahın qədərinə (müsibətə) səbr. «Səbr və namazla kömək diləyin» (Bəqərə 2:153).',
      en: 'Restraining the soul from complaint and from what displeases Allah. It has three kinds: patience in obedience, patience in avoiding sin, and patience with Allah\'s decree (affliction). «Seek help through patience and prayer» (Al-Baqarah 2:153).',
      ru: 'Удержание души от жалоб и от того, что неугодно Аллаху. Бывает трёх видов: терпение в покорности, терпение в отказе от грехов и терпение перед предопределением Аллаха (бедой). «Обращайтесь за помощью к терпению и молитве» (аль-Бакара 2:153).',
      ar: 'حبس النفس عن الجزع وعما لا يرضاه الله. وهو ثلاثة أنواع: صبر على الطاعة، وصبر عن المعصية، وصبر على أقدار الله المؤلمة. ﴿اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ﴾ (البقرة: 153).',
      tr: 'Nefsi şikâyetten ve Allah\'ın razı olmadığı şeyden alıkoymak. Üç çeşidi vardır: itaate sabır, günahtan uzak durmaya sabır ve Allah\'ın kaderine (musibete) sabır. «Sabır ve namazla yardım dileyin» (Bakara 2:153).',
    },
    rel: ['shukr', 'ridha', 'qadr', 'tawakkul'],
  },
  {
    term: 'Xövf', ar: 'الخوف', translit: 'Khawf', cat: 'akhlaq',
    def: {
      az: 'Allahın əzabından və narazılığından qorxmaq; insanı günahdan saxlayan qəlb ibadətidir. Əhli-Sünnəyə görə mömin Allaha qorxu, ümid və sevgi ilə birlikdə ibadət edir — biri digərini ləğv etmir (İsra 17:57).',
      en: 'Fear of Allah\'s punishment and displeasure; an act of worship of the heart that keeps a person from sin. According to Ahl as-Sunnah, the believer worships Allah with fear, hope and love together — none cancels the others (Al-Isra 17:57).',
      ru: 'Страх перед наказанием и недовольством Аллаха; поклонение сердца, удерживающее от грехов. Согласно Ахль ас-Сунна, верующий поклоняется Аллаху со страхом, надеждой и любовью одновременно — одно не отменяет другого (аль-Исра 17:57).',
      ar: 'الخوف من عذاب الله وسخطه، وهو عبادة قلبية تحجز عن المعاصي. ويعبد المؤمن ربه عند أهل السنة بالخوف والرجاء والمحبة جميعًا (الإسراء: 57).',
      tr: 'Allah\'ın azabından ve hoşnutsuzluğundan korkmak; insanı günahtan alıkoyan bir kalp ibadetidir. Ehl-i Sünnet\'e göre mümin Allah\'a korku, ümit ve sevgiyle birlikte ibadet eder; biri diğerini iptal etmez (İsrâ 17:57).',
    },
    rel: ['raja', 'mahabbah', 'khashyah', 'taqwa'],
  },
  {
    term: 'Rəca', ar: 'الرجاء', translit: 'Raja\'', cat: 'akhlaq',
    def: {
      az: 'Allahın rəhmətinə və bağışlamasına ümid bəsləmək. Doğru ümid əməllə birlikdə olur: insan itaət edib qəbulunu, günah edib tövbə edərək bağışlanmasını umur; əməlsiz ümid isə arzudan başqa bir şey deyil.',
      en: 'Hope in Allah\'s mercy and forgiveness. True hope comes with action: one obeys and hopes for acceptance, or sins, repents and hopes for forgiveness; hope without deeds is mere wishful thinking.',
      ru: 'Надежда на милость и прощение Аллаха. Истинная надежда сопряжена с делом: человек повинуется и надеется на принятие или кается после греха и надеется на прощение; надежда без дел — лишь пустое желание.',
      ar: 'الطمع في رحمة الله ومغفرته. والرجاء المحمود ما قارنه العمل: يطيع فيرجو القبول، أو يذنب فيتوب فيرجو المغفرة؛ أما الرجاء بلا عمل فتمنٍّ وغرور.',
      tr: 'Allah\'ın rahmetini ve bağışlamasını ummak. Doğru ümit amelle birlikte olur: kişi itaat edip kabulünü, günah işleyip tövbe ederek affını umar; amelsiz ümit ise kuru bir temenniden ibarettir.',
    },
    rel: ['khawf', 'mahabbah', 'tawbah'],
  },
  {
    term: 'Məhəbbət', ar: 'المحبة', translit: 'Mahabbah', cat: 'akhlaq',
    def: {
      az: 'Allahı və Rəsulunu ﷺ hər şeydən çox sevmək — ibadətin əsasıdır. Bu sevginin nişanəsi Peyğəmbərə ﷺ tabe olmaqdır: «De: Əgər Allahı sevirsinizsə, mənə tabe olun ki, Allah da sizi sevsin» (Ali-İmran 3:31).',
      en: 'Loving Allah and His Messenger ﷺ above everything — the foundation of worship. Its sign is following the Prophet ﷺ: «Say: If you love Allah, then follow me; Allah will love you» (Ali Imran 3:31).',
      ru: 'Любовь к Аллаху и Его Посланнику ﷺ превыше всего — основа поклонения. Её признак — следование Пророку ﷺ: «Скажи: Если вы любите Аллаха, то следуйте за мной, и Аллах возлюбит вас» (Аль Имран 3:31).',
      ar: 'محبة الله ورسوله ﷺ فوق كل شيء، وهي أصل العبادة، وعلامتها اتباع النبي ﷺ: ﴿قُلْ إِن كُنتُمْ تُحِبُّونَ اللَّهَ فَاتَّبِعُونِي يُحْبِبْكُمُ اللَّهُ﴾ (آل عمران: 31).',
      tr: 'Allah\'ı ve Resûlü\'nü ﷺ her şeyden çok sevmek; ibadetin temelidir. Bu sevginin alameti Peygamber\'e ﷺ uymaktır: «De ki: Allah\'ı seviyorsanız bana uyun ki Allah da sizi sevsin» (Âl-i İmrân 3:31).',
    },
    rel: ['khawf', 'raja', 'ittiba', 'ibadah'],
  },
  {
    term: 'Xəşyət', ar: 'الخشية', translit: 'Khashyah', cat: 'akhlaq',
    def: {
      az: 'Allahın əzəmətini bilməkdən doğan qorxu. Adi qorxudan fərqi elmə əsaslanmasıdır: «Allahdan Öz qulları arasında ancaq alimlər qorxar» (Fatir 35:28).',
      en: 'Fear born of knowing Allah\'s greatness. It differs from ordinary fear in being based on knowledge: «Only those of His servants who have knowledge truly fear Allah» (Fatir 35:28).',
      ru: 'Страх, рождённый знанием о величии Аллаха. От обычного страха отличается тем, что основан на знании: «Боятся Аллаха из Его рабов лишь знающие» (Фатыр 35:28).',
      ar: 'خوف مقرون بمعرفة عظمة الله، ويفارق الخوف المجرد بأنه عن علم: ﴿إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ﴾ (فاطر: 28).',
      tr: 'Allah\'ın azametini bilmekten doğan korku. Sıradan korkudan farkı ilme dayanmasıdır: «Allah\'tan kulları arasında ancak âlimler gereğince korkar» (Fâtır 35:28).',
    },
    rel: ['khawf', 'ilm', 'taqwa'],
  },
  {
    term: 'İnabə', ar: 'الإنابة', translit: 'Inabah', cat: 'akhlaq',
    def: {
      az: 'Qəlbin daim Allaha yönəlməsi və itaətlə Ona qayıtması. Tövbədən daha geniş məna daşıyır: həm günahdan dönmək, həm də sevgi və ibadətlə Allaha üz tutmaqdır. «Rəbbinizə üz tutun və Ona təslim olun» (Zumər 39:54).',
      en: 'The heart\'s constant turning to Allah and returning to Him through obedience. Broader than repentance: it is both turning away from sin and turning towards Allah with love and worship. «Turn to your Lord and submit to Him» (Az-Zumar 39:54).',
      ru: 'Постоянное обращение сердца к Аллаху и возвращение к Нему через покорность. Шире покаяния: это и отход от греха, и устремлённость к Аллаху с любовью и поклонением. «Обратитесь к вашему Господу и покоритесь Ему» (аз-Зумар 39:54).',
      ar: 'رجوع القلب إلى الله وإقباله عليه بالطاعة على الدوام، وهي أعم من التوبة: ترك للذنب وإقبال على الله بالمحبة والعبادة. ﴿وَأَنِيبُوا إِلَىٰ رَبِّكُمْ وَأَسْلِمُوا لَهُ﴾ (الزمر: 54).',
      tr: 'Kalbin sürekli Allah\'a yönelmesi ve itaatle O\'na dönmesi. Tövbeden daha geniştir: hem günahtan dönmek hem de sevgi ve ibadetle Allah\'a yönelmektir. «Rabbinize yönelin ve O\'na teslim olun» (Zümer 39:54).',
    },
    rel: ['tawbah', 'istighfar', 'mahabbah'],
  },
  {
    term: 'İstiqamət', ar: 'الاستقامة', translit: 'Istiqamah', cat: 'akhlaq',
    def: {
      az: 'Doğru yolda — Quran və Sünnə üzərində — sabit qalmaq, əmrləri yerinə yetirib qadağalardan çəkinmək. Peyğəmbər ﷺ nəsihət istəyənə buyurub: «De: Allaha iman gətirdim, sonra düz yolda ol» (Müslim 38).',
      en: 'Remaining firm on the straight path — the Quran and the Sunnah — by fulfilling commands and avoiding prohibitions. The Prophet ﷺ told one who asked for advice: «Say: I believe in Allah, then be steadfast» (Muslim 38).',
      ru: 'Стойкость на прямом пути — Коране и Сунне: исполнение повелений и отказ от запретного. Пророк ﷺ сказал просившему совета: «Скажи: Я уверовал в Аллаха, — а затем будь стоек» (Муслим 38).',
      ar: 'لزوم الصراط المستقيم من الكتاب والسنة بفعل المأمور وترك المحظور. قال ﷺ لمن سأله وصية: «قل آمنت بالله فاستقم» (مسلم 38).',
      tr: 'Kur\'an ve Sünnet üzere dosdoğru yolda sebat etmek, emirleri yerine getirip yasaklardan kaçınmak. Peygamber ﷺ öğüt isteyene: «Allah\'a iman ettim de, sonra dosdoğru ol» buyurmuştur (Müslim 38).',
    },
    rel: ['taqwa', 'ittiba', 'sabr'],
  },
  {
    term: 'Həya', ar: 'الحياء', translit: 'Haya\'', cat: 'akhlaq',
    def: {
      az: 'Çirkin işdən çəkindirən və haqqı yerinə yetirməyə sövq edən utancaqlıq duyğusu. Peyğəmbər ﷺ buyurub: «Həya imandandır» (Buxari 24). Haqqı deməkdən və elm öyrənməkdən çəkindirən utancaqlıq isə tərifli həya deyil.',
      en: 'A sense of shame that keeps one from what is vile and moves one to fulfil rights. The Prophet ﷺ said: «Modesty is part of faith» (Bukhari 24). Shyness that stops one from speaking the truth or seeking knowledge is not praiseworthy haya\'.',
      ru: 'Чувство стыда, удерживающее от мерзкого и побуждающее исполнять права. Пророк ﷺ сказал: «Стыдливость — часть веры» (Бухари 24). Робость же, мешающая говорить истину или учиться, не является похвальной стыдливостью.',
      ar: 'خُلق يبعث على ترك القبيح ويحث على أداء الحقوق. قال ﷺ: «الحياء من الإيمان» (البخاري 24). أما ما منع من قول الحق أو طلب العلم فليس حياءً محمودًا.',
      tr: 'Çirkin şeyden alıkoyan ve hakları yerine getirmeye sevk eden utanma duygusu. Peygamber ﷺ: «Hayâ imandandır» buyurmuştur (Buhârî 24). Hakkı söylemekten ve ilim öğrenmekten alıkoyan çekingenlik ise övülen hayâ değildir.',
    },
    rel: ['iman', 'husn-al-khuluq', 'hijab'],
  },
  {
    term: 'Təvazö', ar: 'التواضع', translit: 'Tawadu\'', cat: 'akhlaq',
    def: {
      az: 'Haqqı kimdən gəlirsə-gəlsin qəbul etmək və insanlara yuxarıdan baxmamaq; təkəbbürün əksidir. Peyğəmbər ﷺ buyurub: «Kim Allah üçün təvazökar olsa, Allah onu ucaldar» (Müslim 2588).',
      en: 'Accepting the truth from whoever brings it and not looking down on people; the opposite of arrogance. The Prophet ﷺ said: «No one humbles himself for Allah except that Allah raises him» (Muslim 2588).',
      ru: 'Принятие истины от кого бы она ни исходила и отказ от высокомерия к людям; противоположность гордыни. Пророк ﷺ сказал: «Кто проявит смирение ради Аллаха, того Аллах возвысит» (Муслим 2588).',
      ar: 'قبول الحق ممن جاء به وترك الترفع على الناس، وهو ضد الكبر. قال ﷺ: «وما تواضع أحد لله إلا رفعه الله» (مسلم 2588).',
      tr: 'Hakkı kim getirirse getirsin kabul etmek ve insanlara tepeden bakmamak; kibrin zıddıdır. Peygamber ﷺ: «Allah için alçak gönüllü olanı Allah yüceltir» buyurmuştur (Müslim 2588).',
    },
    rel: ['kibr', 'ujb', 'husn-al-khuluq'],
  },
  {
    term: 'Kibr', ar: 'الكبر', translit: 'Kibr', cat: 'akhlaq',
    def: {
      az: 'Təkəbbür. Peyğəmbər ﷺ onu belə tərif edib: «Haqqı rədd etmək və insanları xor görmək»; qəlbində zərrə qədər kibr olan Cənnətə girməz (Müslim 91). Gözəl geyinmək kibr deyil.',
      en: 'Arrogance. The Prophet ﷺ defined it as «rejecting the truth and looking down on people»; whoever has an atom\'s weight of it in his heart will not enter Paradise (Muslim 91). Dressing well is not arrogance.',
      ru: 'Высокомерие. Пророк ﷺ определил его так: «Отвержение истины и презрение к людям»; не войдёт в Рай тот, в чьём сердце есть гордыня весом с пылинку (Муслим 91). Красивая одежда гордыней не является.',
      ar: 'قال ﷺ: «الكبر بطر الحق وغمط الناس»، و«لا يدخل الجنة من كان في قلبه مثقال ذرة من كبر» (مسلم 91). وليس التجمّل في اللباس من الكبر.',
      tr: 'Büyüklenme. Peygamber ﷺ onu «hakkı reddetmek ve insanları hor görmek» diye tanımlamış; kalbinde zerre kadar kibir bulunan Cennet\'e giremez buyurmuştur (Müslim 91). Güzel giyinmek kibir değildir.',
    },
    rel: ['tawadu', 'ujb', 'hasad'],
  },
  {
    term: 'Həsəd', ar: 'الحسد', translit: 'Hasad', cat: 'akhlaq',
    def: {
      az: 'Başqasına verilmiş nemətin ondan getməsini arzulamaq — haram qəlb xəstəliyidir. «Bir-birinizə həsəd aparmayın» (Müslim 2564). Nemətin getməsini istəmədən onun bənzərini arzulamaq (ğibtə) isə caizdir.',
      en: 'Wishing that a blessing given to someone else be taken away — a forbidden disease of the heart. «Do not envy one another» (Muslim 2564). Wishing for a similar blessing without wanting it removed from the other (ghibtah) is permissible.',
      ru: 'Желание, чтобы благо, данное другому, исчезло у него, — запретная болезнь сердца. «Не завидуйте друг другу» (Муслим 2564). Желать подобного блага, не желая его утраты другим (гибта), дозволено.',
      ar: 'تمنّي زوال النعمة عن الغير، وهو مرض قلبي محرم. قال ﷺ: «لا تحاسدوا» (مسلم 2564). أما تمني مثلها دون زوالها عنه فهو الغبطة، وهي جائزة.',
      tr: 'Başkasına verilen nimetin ondan gitmesini istemek; haram bir kalp hastalığıdır. «Birbirinize haset etmeyin» (Müslim 2564). Nimetin gitmesini istemeden benzerini arzulamak (gıpta) ise caizdir.',
    },
    rel: ['ayn', 'kibr', 'ghibah'],
  },
  {
    term: 'Qeybət', ar: 'الغيبة', translit: 'Ghibah', cat: 'akhlaq',
    def: {
      az: 'Qardaşını onun xoşlamadığı şeylə arxasınca anmaq; deyilən doğrudursa qeybət, yalandırsa böhtandır (Müslim 2589). Quranda ölmüş qardaşının ətini yeməyə bənzədilib (Hucurat 49:12).',
      en: 'Mentioning your brother in his absence with what he dislikes; if it is true it is backbiting, if false it is slander (Muslim 2589). The Quran likens it to eating the flesh of one\'s dead brother (Al-Hujurat 49:12).',
      ru: 'Упоминание брата заочно тем, что ему неприятно; если сказанное правда — это злословие, если ложь — клевета (Муслим 2589). Коран уподобляет это поеданию мяса умершего брата (аль-Худжурат 49:12).',
      ar: 'ذكرك أخاك بما يكره في غيبته؛ فإن كان فيه ما تقول فقد اغتبته، وإلا فقد بهتّه (مسلم 2589). وشبّهها القرآن بأكل لحم الأخ ميتًا (الحجرات: 12).',
      tr: 'Kardeşini arkasından hoşlanmayacağı bir şeyle anmak; söylenen doğruysa gıybet, yalansa iftiradır (Müslim 2589). Kur\'an onu ölü kardeşinin etini yemeye benzetir (Hucurât 49:12).',
    },
    rel: ['namimah', 'hasad', 'sidq'],
  },
  {
    term: 'Nəmimə', ar: 'النميمة', translit: 'Namimah', cat: 'akhlaq',
    def: {
      az: 'Aralarını vurmaq məqsədilə insanların sözünü birindən digərinə daşımaq (söz gəzdirmək). Böyük günahlardandır: «Söz gəzdirən Cənnətə girməz» (Buxari 6056).',
      en: 'Carrying people\'s words from one to another in order to cause discord (tale-bearing). It is a major sin: «The tale-bearer will not enter Paradise» (Bukhari 6056).',
      ru: 'Передача слов одних людей другим с целью посеять вражду (сплетни). Это большой грех: «Не войдёт в Рай разносчик сплетен» (Бухари 6056).',
      ar: 'نقل الكلام بين الناس على جهة الإفساد، وهي من الكبائر: «لا يدخل الجنة قتّات» (البخاري 6056).',
      tr: 'Aralarını bozmak amacıyla insanların sözlerini birinden diğerine taşımak (koğuculuk). Büyük günahlardandır: «Koğucu Cennet\'e giremez» (Buhârî 6056).',
    },
    rel: ['ghibah', 'sidq', 'husn-al-khuluq'],
  },
  {
    term: 'Ücb', ar: 'العُجب', translit: 'Ujb', cat: 'akhlaq',
    def: {
      az: 'Özündən, əməlindən razı qalıb onu Allahın lütfü deyil, öz məziyyəti saymaq. Əməlin savabını puç edən qəlb xəstəliyidir və təkəbbürə aparır.',
      en: 'Self-admiration: being pleased with oneself and one\'s deeds and attributing them to one\'s own merit rather than Allah\'s favour. A disease of the heart that ruins the reward of deeds and leads to arrogance.',
      ru: 'Самолюбование: довольство собой и своими делами с приписыванием их собственной заслуге, а не милости Аллаха. Болезнь сердца, губящая награду за дела и ведущая к гордыне.',
      ar: 'استعظام النفس والعمل ونسبته إليها لا إلى فضل الله، وهو داء قلبي يُحبط ثواب العمل ويجرّ إلى الكبر.',
      tr: 'Kendini ve amelini beğenip onu Allah\'ın lütfu değil kendi meziyeti saymak. Amelin sevabını boşa çıkaran ve kibre götüren bir kalp hastalığıdır.',
    },
    rel: ['kibr', 'riya', 'ikhlas'],
  },
  {
    term: 'Sidq', ar: 'الصدق', translit: 'Sidq', cat: 'akhlaq',
    def: {
      az: 'Doğruluq: sözün, niyyətin və əməlin həqiqətə uyğun olması. «Doğruluq yaxşılığa, yaxşılıq isə Cənnətə aparır» (Buxari 6094).',
      en: 'Truthfulness: speech, intention and action matching reality. «Truthfulness leads to righteousness, and righteousness leads to Paradise» (Bukhari 6094).',
      ru: 'Правдивость: соответствие слов, намерений и дел истине. «Правдивость ведёт к благочестию, а благочестие ведёт в Рай» (Бухари 6094).',
      ar: 'مطابقة القول والنية والعمل للحقيقة. قال ﷺ: «إن الصدق يهدي إلى البر، وإن البر يهدي إلى الجنة» (البخاري 6094).',
      tr: 'Doğruluk: sözün, niyetin ve amelin gerçeğe uygun olması. «Doğruluk iyiliğe, iyilik de Cennet\'e götürür» (Buhârî 6094).',
    },
    rel: ['amanah', 'nifaq', 'ikhlas'],
  },
  {
    term: 'Əmanət', ar: 'الأمانة', translit: 'Amanah', cat: 'akhlaq',
    def: {
      az: 'Etibar edilən hər şeyi — mal, sirr, vəzifə və Allahın əmrlərini — qorumaq və sahibinə çatdırmaq. Əmanətin zay edilməsi Qiyamətin əlamətlərindəndir (Buxari 59).',
      en: 'Safeguarding everything entrusted — property, secrets, positions and the commands of Allah — and rendering it to its owner. The loss of trust is among the signs of the Hour (Bukhari 59).',
      ru: 'Сохранение всего доверенного — имущества, тайн, должностей и повелений Аллаха — и возвращение владельцу. Утрата доверия — один из признаков Часа (Бухари 59).',
      ar: 'حفظ كل ما اؤتمن عليه المرء من مال وسر وولاية وأوامر الله، وأداؤه إلى أهله. وتضييعها من أشراط الساعة (البخاري 59).',
      tr: 'Emanet edilen her şeyi — mal, sır, görev ve Allah\'ın emirlerini — korumak ve sahibine teslim etmek. Emanetin zayi edilmesi kıyamet alametlerindendir (Buhârî 59).',
    },
    rel: ['sidq', 'nifaq', 'ashrat-as-saah'],
  },
  {
    term: 'Ədəb', ar: 'الأدب', translit: 'Adab', cat: 'akhlaq',
    def: {
      az: 'Söz və davranışda gözəl əxlaq qaydaları: Allaha, Rəsuluna ﷺ, valideynlərə, alimlərə, qonşuya və hər kəsə qarşı Sünnəyə uyğun rəftar. Hədis alimləri kitablarına ayrıca «ədəb» bölmələri yazıblar.',
      en: 'The etiquette of good conduct in speech and behaviour: treating Allah, His Messenger ﷺ, parents, scholars, neighbours and everyone according to the Sunnah. Hadith scholars devoted whole chapters of their books to adab.',
      ru: 'Правила благого поведения в речи и поступках: отношение к Аллаху, Его Посланнику ﷺ, родителям, учёным, соседям и всем людям согласно Сунне. Знатоки хадисов посвящали этому отдельные главы своих книг.',
      ar: 'استعمال ما يُحمد قولًا وفعلًا: الأدب مع الله ورسوله ﷺ والوالدين والعلماء والجيران وسائر الناس على وفق السنة. وقد أفرد له المحدّثون أبوابًا وكتبًا.',
      tr: 'Söz ve davranışta güzel ahlak kuralları: Allah\'a, Resûlü\'ne ﷺ, anne babaya, âlimlere, komşuya ve herkese Sünnet\'e uygun davranmak. Hadis âlimleri kitaplarında edebe ayrı bölümler ayırmıştır.',
    },
    rel: ['husn-al-khuluq', 'birr-al-walidayn', 'haya'],
    lesson: 'adab-al-mufrad',
  },
  {
    term: 'Birrul-validəyn', ar: 'بر الوالدين', translit: 'Birr al-Walidayn', cat: 'akhlaq',
    def: {
      az: 'Valideynlərə yaxşılıq etmək, günah olmayan işdə onlara itaət etmək və onları incitməmək. Allah onu Özünə ibadətin ardınca zikr edib (İsra 17:23); valideynə ası olmaq (üquq) böyük günahlardandır.',
      en: 'Being dutiful to parents: doing good to them, obeying them in what is not sinful and not hurting them. Allah mentions it right after worshipping Him alone (Al-Isra 17:23); disobedience to parents (\'uquq) is a major sin.',
      ru: 'Почитание родителей: благодеяние им, послушание во всём, что не является грехом, и отказ причинять им обиду. Аллах упомянул это сразу после поклонения Ему одному (аль-Исра 17:23); непочтительность к родителям — большой грех.',
      ar: 'الإحسان إلى الوالدين وطاعتهما في غير معصية وترك أذاهما. قرنه الله بعبادته (الإسراء: 23)، والعقوق من الكبائر.',
      tr: 'Anne babaya iyilik etmek, günah olmayan işlerde onlara itaat etmek ve onları incitmemek. Allah bunu kendisine ibadetin hemen ardından zikretmiştir (İsrâ 17:23); anne babaya isyan (ukuk) büyük günahlardandır.',
    },
    rel: ['silat-ar-rahim', 'adab', 'husn-al-khuluq'],
    lesson: 'birr-al-walidayn',
  },
  {
    term: 'Sılə-rəhm', ar: 'صلة الرحم', translit: 'Silat ar-Rahim', cat: 'akhlaq',
    def: {
      az: 'Qohumlarla əlaqəni saxlamaq: ziyarət, kömək, xəbər tutmaq və yaxşılıq. Vacibdir, kəsilməsi böyük günahdır. «Kim ruzisinin genişlənməsini və ömrünün uzanmasını istəyirsə, qohumluq əlaqəsini saxlasın» (Buxari 5986).',
      en: 'Maintaining ties of kinship: visiting, helping, keeping in touch and doing good to relatives. It is obligatory and severing it is a major sin. «Whoever wishes for his provision to be expanded and his life extended, let him maintain his ties of kinship» (Bukhari 5986).',
      ru: 'Поддержание родственных связей: посещение, помощь, внимание и благодеяние родственникам. Это обязанность, а разрыв связей — большой грех. «Кто желает, чтобы его удел был расширен, а жизнь продлена, пусть поддерживает родственные связи» (Бухари 5986).',
      ar: 'الإحسان إلى الأقارب بالزيارة والمعونة والسؤال عنهم، وهي واجبة وقطيعتها من الكبائر. قال ﷺ: «من أحب أن يُبسط له في رزقه ويُنسأ له في أثره فليصل رحمه» (البخاري 5986).',
      tr: 'Akrabalarla bağı korumak: ziyaret, yardım, hal hatır sormak ve iyilik. Vaciptir, koparılması büyük günahtır. «Rızkının genişlemesini ve ömrünün uzamasını isteyen akrabalık bağını gözetsin» (Buhârî 5986).',
    },
    rel: ['birr-al-walidayn', 'adab', 'husn-al-khuluq'],
    lesson: 'birr-al-walidayn',
  },
  {
    term: 'Hüsnül-xuluq', ar: 'حسن الخلق', translit: 'Husn al-Khuluq', cat: 'akhlaq',
    def: {
      az: 'Gözəl əxlaq: güləruzluq, yaxşılıq etmək, əziyyət verməmək və əziyyətə dözmək. Quran Peyğəmbəri ﷺ «böyük əxlaq sahibi» kimi vəsf edir (Qələm 68:4); gözəl əxlaq imanın kamilliyindəndir.',
      en: 'Good character: a cheerful face, doing good, not causing harm and bearing harm patiently. The Quran describes the Prophet ﷺ as being «of a great moral character» (Al-Qalam 68:4); good character is part of the perfection of faith.',
      ru: 'Благой нрав: приветливость, благодеяние, непричинение вреда и терпение к обидам. Коран описывает Пророка ﷺ как обладателя «великого нрава» (аль-Калам 68:4); благой нрав — от совершенства веры.',
      ar: 'بسط الوجه وبذل المعروف وكف الأذى واحتماله. ووصف الله نبيه ﷺ بقوله: ﴿وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ﴾ (القلم: 4)، وحسن الخلق من كمال الإيمان.',
      tr: 'Güzel ahlak: güler yüz, iyilik yapmak, eziyet etmemek ve eziyete katlanmak. Kur\'an Peygamber\'i ﷺ «yüce bir ahlak üzere» diye vasfeder (Kalem 68:4); güzel ahlak imanın kemalindendir.',
    },
    rel: ['adab', 'hilm', 'tawadu', 'ihsan'],
  },
  {
    term: 'İsar', ar: 'الإيثار', translit: 'Ithar', cat: 'akhlaq',
    def: {
      az: 'Özünə ehtiyac olduğu halda dünyəvi nemətdə başqasını özündən üstün tutmaq. Allah Ənsarı bununla tərifləyib: «Özləri ehtiyac içində olsalar belə, onları özlərindən üstün tutarlar» (Həşr 59:9). İbadətdə isə savab yarışı əsasdır.',
      en: 'Preferring others over oneself in worldly things even when in need. Allah praised the Ansar for it: «They give them preference over themselves, even if they are in need» (Al-Hashr 59:9). In acts of worship, however, one competes for reward.',
      ru: 'Предпочтение других себе в мирских благах даже при собственной нужде. Аллах похвалил за это ансаров: «Они отдают им предпочтение перед собой, даже если сами нуждаются» (аль-Хашр 59:9). В поклонении же следует состязаться в награде.',
      ar: 'تقديم الغير على النفس في حظوظ الدنيا مع الحاجة، وبه مدح الله الأنصار: ﴿وَيُؤْثِرُونَ عَلَىٰ أَنفُسِهِمْ وَلَوْ كَانَ بِهِمْ خَصَاصَةٌ﴾ (الحشر: 9). أما القُرَب فالمشروع فيها التنافس.',
      tr: 'Kendisi muhtaç olduğu halde dünyevi nimette başkasını kendine tercih etmek. Allah Ensar\'ı bununla övmüştür: «Kendileri ihtiyaç içinde olsalar bile onları kendilerine tercih ederler» (Haşr 59:9). İbadetlerde ise sevap yarışı esastır.',
    },
    rel: ['ansar', 'sadaqah', 'husn-al-khuluq'],
  },
  {
    term: 'Hilm', ar: 'الحلم', translit: 'Hilm', cat: 'akhlaq',
    def: {
      az: 'Hirsə hakim olmaq, tələsməmək və cəzalandırmağa gücü çatdığı halda bağışlamaq. «Güclü o deyil ki, güləşdə yıxır; güclü o kəsdir ki, qəzəb anında özünə hakim olur» (Buxari 6114).',
      en: 'Forbearance: controlling anger, not acting hastily and pardoning while able to punish. «The strong man is not the good wrestler; the strong man is the one who controls himself when angry» (Bukhari 6114).',
      ru: 'Сдержанность: владение гневом, неторопливость и прощение при возможности наказать. «Силён не тот, кто побеждает в борьбе, а силён тот, кто владеет собой во гневе» (Бухари 6114).',
      ar: 'ضبط النفس عند الغضب وترك العجلة والعفو مع القدرة. قال ﷺ: «ليس الشديد بالصُّرَعة، إنما الشديد الذي يملك نفسه عند الغضب» (البخاري 6114).',
      tr: 'Öfkeye hâkim olmak, acele etmemek ve cezalandırmaya gücü yettiği halde affetmek. «Güçlü, güreşte yenen değildir; güçlü, öfke anında kendine hâkim olandır» (Buhârî 6114).',
    },
    rel: ['sabr', 'husn-al-khuluq', 'tawadu'],
  },
  {
    term: 'Nəsihət', ar: 'النصيحة', translit: 'Nasihah', cat: 'akhlaq',
    def: {
      az: 'Səmimi xeyirxahlıq: başqasına xeyir istəmək və onu xeyrə yönəltmək. «Din nəsihətdir» — Allah, Onun Kitabı, Rəsulu, müsəlmanların imamları və bütün müsəlmanlar üçün (Müslim 55). Nəsihət gizlində və yumşaqlıqla verilməsi daha uyğundur.',
      en: 'Sincere goodwill: wanting good for others and guiding them to it. «The religion is sincerity» — to Allah, His Book, His Messenger, the leaders of the Muslims and their common folk (Muslim 55). Advice is best given privately and gently.',
      ru: 'Искреннее доброжелательство: желание блага другим и наставление к нему. «Религия — это искренность» — по отношению к Аллаху, Его Писанию, Посланнику, правителям мусульман и всем мусульманам (Муслим 55). Совет лучше давать наедине и мягко.',
      ar: 'إرادة الخير للمنصوح وإرشاده إليه. قال ﷺ: «الدين النصيحة» لله ولكتابه ولرسوله ولأئمة المسلمين وعامتهم (مسلم 55). والأولى أن تكون سرًّا وبرفق.',
      tr: 'Samimi hayırhahlık: başkası için hayır istemek ve onu hayra yöneltmek. «Din nasihattir» — Allah, Kitabı, Resûlü, Müslümanların yöneticileri ve bütün Müslümanlar için (Müslim 55). Nasihat gizlice ve yumuşaklıkla verilmelidir.',
    },
    rel: ['al-amr-bil-maruf', 'dawah', 'ikhlas'],
  },
  {
    term: 'Əmr bil-məruf', ar: 'الأمر بالمعروف والنهي عن المنكر', translit: 'Al-Amr bil-Ma\'ruf', cat: 'akhlaq',
    def: {
      az: 'Yaxşılığı əmr edib pislikdən çəkindirmək — ümmətin vəzifəsidir (Ali-İmran 3:104). Gücə görə dərəcələri var: əl ilə, dil ilə, heç olmasa qəlb ilə (Müslim 49). Elm, yumşaqlıq və səbr tələb edir; daha böyük fəsada səbəb olmamalıdır.',
      en: 'Enjoining good and forbidding evil — a duty of the Ummah (Ali Imran 3:104). It has levels according to ability: by hand, by tongue, and at least by the heart (Muslim 49). It requires knowledge, gentleness and patience, and must not lead to a greater harm.',
      ru: 'Побуждение к одобряемому и удержание от порицаемого — обязанность общины (Аль Имран 3:104). Имеет степени по возможности: рукой, языком и хотя бы сердцем (Муслим 49). Требует знания, мягкости и терпения и не должно вести к большему злу.',
      ar: 'من واجبات الأمة (آل عمران: 104)، ومراتبه بحسب القدرة: باليد ثم باللسان ثم بالقلب (مسلم 49). ويُشترط فيه العلم والرفق والصبر، وألا يؤدي إلى منكر أكبر.',
      tr: 'İyiliği emredip kötülükten sakındırmak; ümmetin görevidir (Âl-i İmrân 3:104). Güce göre dereceleri vardır: elle, dille, hiç olmazsa kalple (Müslim 49). İlim, yumuşaklık ve sabır ister; daha büyük bir kötülüğe yol açmamalıdır.',
    },
    rel: ['nasihah', 'dawah', 'ummah'],
  },
  {
    term: 'Elm', ar: 'العلم', translit: 'Ilm', cat: 'akhlaq',
    def: {
      az: 'Şəriət elmi — Quran və Sünnəni səhabələrin anladığı kimi bilmək. Hər müsəlmana ibadəti və əqidəsi üçün lazım olanı öyrənmək fərzdir. «Kim elm öyrənmək üçün bir yola düşsə, Allah ona Cənnətə gedən yolu asanlaşdırar» (Müslim 2699).',
      en: 'Knowledge of the Shari\'ah — knowing the Quran and Sunnah as the Companions understood them. Learning what one needs for one\'s creed and worship is obligatory on every Muslim. «Whoever travels a path seeking knowledge, Allah makes easy for him a path to Paradise» (Muslim 2699).',
      ru: 'Шариатское знание — знание Корана и Сунны так, как их понимали сподвижники. Изучать необходимое для своей веры и поклонения — обязанность каждого мусульманина. «Кто встанет на путь в поисках знания, тому Аллах облегчит путь в Рай» (Муслим 2699).',
      ar: 'العلم الشرعي: معرفة الكتاب والسنة بفهم الصحابة. وتعلّم ما يحتاجه المسلم لعقيدته وعبادته فرض عين. قال ﷺ: «ومن سلك طريقًا يلتمس فيه علمًا سهّل الله له به طريقًا إلى الجنة» (مسلم 2699).',
      tr: 'Şer\'î ilim: Kur\'an ve Sünnet\'i sahabenin anladığı şekilde bilmek. İnancı ve ibadeti için gerekeni öğrenmek her Müslümana farzdır. «Kim ilim öğrenmek için bir yola girerse, Allah ona Cennet\'e giden yolu kolaylaştırır» (Müslim 2699).',
    },
    rel: ['khashyah', 'salaf', 'fiqh'],
    lesson: 'hilyat-talib-al-ilm',
  },
  {
    term: 'Təzkiyə', ar: 'التزكية', translit: 'Tazkiyah', cat: 'akhlaq',
    def: {
      az: 'Nəfsi şirk, günah və pis əxlaqdan təmizləyib iman və saleh əməllə inkişaf etdirmək. Bunun yolu Quran və Sünnəyə tabe olmaqdır, bidət olan təriqət məşqləri deyil. «Nəfsini təmizləyən nicat tapdı» (Şəms 91:9).',
      en: 'Purifying the soul from shirk, sin and bad character, and growing it through faith and righteous deeds. Its path is following the Quran and Sunnah, not innovated mystic exercises. «He has succeeded who purifies it» (Ash-Shams 91:9).',
      ru: 'Очищение души от ширка, грехов и дурного нрава и её взращивание верой и праведными делами. Путь к этому — следование Корану и Сунне, а не нововведённые упражнения орденов. «Преуспел тот, кто очистил её» (аш-Шамс 91:9).',
      ar: 'تطهير النفس من الشرك والذنوب ومساوئ الأخلاق وتنميتها بالإيمان والعمل الصالح، وطريقها اتباع الكتاب والسنة لا الرياضات المبتدعة. ﴿قَدْ أَفْلَحَ مَن زَكَّاهَا﴾ (الشمس: 9).',
      tr: 'Nefsi şirk, günah ve kötü ahlaktan arındırıp iman ve salih amelle geliştirmek. Yolu Kur\'an ve Sünnet\'e uymaktır, bidat olan tarikat riyazetleri değil. «Nefsini arındıran kurtuluşa ermiştir» (Şems 91:9).',
    },
    rel: ['nafs', 'muhasabah', 'ikhlas', 'taqwa'],
    lesson: 'muhasabah',
  },

  // ─────────────── TARİX ───────────────
  {
    term: 'Sirə', ar: 'السيرة النبوية', translit: 'Sirah', cat: 'history',
    def: {
      az: 'Peyğəmbərin ﷺ həyat tarixi: doğumu, peyğəmbərliyi, dəvəti, hicrəti, döyüşləri və vəfatı. Ən etibarlı mənbələri Quran və səhih hədislərdir; sirə kitablarındakı rəvayətlər də isnadla yoxlanılır.',
      en: 'The life history of the Prophet ﷺ: his birth, prophethood, call, emigration, battles and death. Its most reliable sources are the Quran and authentic hadith; reports in sirah books are also checked by their chains.',
      ru: 'История жизни Пророка ﷺ: рождение, пророчество, призыв, переселение, походы и кончина. Самые надёжные источники — Коран и достоверные хадисы; сообщения книг жизнеописания также проверяются по иснадам.',
      ar: 'تاريخ حياة النبي ﷺ من مولده وبعثته ودعوته وهجرته ومغازيه إلى وفاته. وأصح مصادرها القرآن والأحاديث الصحيحة، وتُمحَّص روايات كتب السيرة بالأسانيد.',
      tr: 'Peygamber\'in ﷺ hayat tarihi: doğumu, peygamberliği, daveti, hicreti, savaşları ve vefatı. En güvenilir kaynakları Kur\'an ve sahih hadislerdir; siyer kitaplarındaki rivayetler de isnatla incelenir.',
    },
    rel: ['bithah', 'hijrah', 'isnad'],
  },
  {
    term: 'Cahiliyyət', ar: 'الجاهلية', translit: 'Jahiliyyah', cat: 'history',
    def: {
      az: 'İslamdan əvvəlki dövr və o dövrün inanc və adətləri: bütpərəstlik, qəbilə təəssübü, qız uşaqlarını diri basdırmaq və s. Quran «əvvəlki cahiliyyət bəzənməsi»ndən çəkindirir (Əhzab 33:33); cahiliyyət xislətləri hər dövrdə ola bilər.',
      en: 'The pre-Islamic era and its beliefs and customs: idolatry, tribal bigotry, burying daughters alive and so on. The Quran forbids «the display of the former Jahiliyyah» (Al-Ahzab 33:33); traits of Jahiliyyah can appear in any age.',
      ru: 'Доисламская эпоха и её верования и обычаи: идолопоклонство, племенной фанатизм, погребение дочерей заживо и пр. Коран запрещает «красоваться, как во времена прежнего невежества» (аль-Ахзаб 33:33); черты невежества могут проявиться в любую эпоху.',
      ar: 'ما كان قبل الإسلام من عقائد وعادات كعبادة الأصنام والعصبية ووأد البنات. ونهى القرآن عن ﴿تَبَرُّجَ الْجَاهِلِيَّةِ الْأُولَىٰ﴾ (الأحزاب: 33)، وقد توجد خصال الجاهلية في كل زمان.',
      tr: 'İslam öncesi dönem ve o dönemin inanç ve adetleri: putperestlik, kabile taassubu, kız çocuklarını diri diri gömmek vb. Kur\'an «eski cahiliye açılıp saçılması»nı yasaklar (Ahzâb 33:33); cahiliye hasletleri her çağda görülebilir.',
    },
    rel: ['bithah', 'shirk', 'sirah'],
  },
  {
    term: 'Bisət', ar: 'البعثة', translit: 'Bi\'thah', cat: 'history',
    def: {
      az: 'Peyğəmbərin ﷺ peyğəmbər olaraq göndərilməsi: qırx yaşında Hira mağarasında ilk vəhyin — «Oxu!» (Ələq surəsinin ilk ayələri) — nazil olması ilə başladı. Bundan sonra Məkkədə on üç il dəvət etdi.',
      en: 'The sending of the Prophet ﷺ as a messenger: it began at the age of forty in the cave of Hira with the first revelation, «Read!» (the opening verses of Surah Al-Alaq). He then called to Islam in Makkah for thirteen years.',
      ru: 'Ниспослание пророческой миссии Пророку ﷺ: началось в сорок лет в пещере Хира с первого откровения — «Читай!» (начальные аяты суры аль-Алак). Затем тринадцать лет он призывал в Мекке.',
      ar: 'إرسال النبي ﷺ رسولًا، وبدأت على رأس الأربعين في غار حراء بنزول ﴿اقْرَأْ﴾ أول سورة العلق، ثم دعا في مكة ثلاث عشرة سنة.',
      tr: 'Peygamber\'in ﷺ peygamber olarak gönderilmesi: kırk yaşında Hira mağarasında ilk vahiy olan «Oku!» (Alak suresinin ilk ayetleri) ile başladı. Ardından Mekke\'de on üç yıl davet etti.',
    },
    rel: ['wahy', 'sirah', 'hijrah'],
  },
  {
    term: 'İsra və Merac', ar: 'الإسراء والمعراج', translit: 'Al-Isra\' wal-Mi\'raj', cat: 'history',
    def: {
      az: 'Peyğəmbərin ﷺ bir gecədə ruhu və bədəni ilə Məscidül-Həramdan Məscidül-Əqsaya aparılması (İsra 17:1) və oradan göylərə yüksəldilməsi; beş vaxt namaz bu gecə fərz edildi. Bu gecəni bayram etmək üçün xüsusi ibadət Sünnədə yoxdur.',
      en: 'The Prophet\'s ﷺ night journey, in body and soul, from al-Masjid al-Haram to al-Masjid al-Aqsa (Al-Isra 17:1) and his ascension to the heavens; the five daily prayers were prescribed that night. No special worship for celebrating this night is found in the Sunnah.',
      ru: 'Ночное перенесение Пророка ﷺ телом и душой из Заповедной мечети в мечеть аль-Акса (аль-Исра 17:1) и его вознесение на небеса; в ту ночь были предписаны пять молитв. Особого поклонения для празднования этой ночи в Сунне нет.',
      ar: 'الإسراء بالنبي ﷺ ليلًا بروحه وجسده من المسجد الحرام إلى المسجد الأقصى (الإسراء: 1) ثم العروج به إلى السماوات، وفيها فُرضت الصلوات الخمس. ولم يثبت في السنة تخصيصها باحتفال أو عبادة.',
      tr: 'Peygamber\'in ﷺ bir gecede ruh ve bedeniyle Mescid-i Haram\'dan Mescid-i Aksâ\'ya götürülmesi (İsrâ 17:1) ve oradan göklere yükseltilmesi; beş vakit namaz bu gece farz kılındı. Bu geceyi kutlamak için özel bir ibadet Sünnet\'te yoktur.',
    },
    rel: ['al-masjid-al-aqsa', 'salah', 'bidah'],
  },
  {
    term: 'Ənsar', ar: 'الأنصار', translit: 'Ansar', cat: 'history',
    def: {
      az: 'Mədinənin Əvs və Xəzrəc qəbilələrindən olan, Peyğəmbəri ﷺ və mühacirləri qarşılayıb onlara kömək edən səhabələr. Allah onlardan razı olduğunu bildirib (Tövbə 9:100) və isarlarını tərifləyib (Həşr 59:9).',
      en: 'The Companions of Madinah, from the Aws and Khazraj tribes, who received and supported the Prophet ﷺ and the emigrants. Allah declared His pleasure with them (At-Tawbah 9:100) and praised their selflessness (Al-Hashr 59:9).',
      ru: 'Сподвижники из Медины, из племён аус и хазрадж, принявшие и поддержавшие Пророка ﷺ и переселенцев. Аллах сообщил, что доволен ими (ат-Тауба 9:100), и похвалил их самоотверженность (аль-Хашр 59:9).',
      ar: 'صحابة المدينة من الأوس والخزرج الذين آووا النبي ﷺ والمهاجرين ونصروهم. أخبر الله برضاه عنهم (التوبة: 100) وأثنى على إيثارهم (الحشر: 9).',
      tr: 'Peygamber\'i ﷺ ve muhacirleri karşılayıp destekleyen Medineli Evs ve Hazrec kabilelerinden sahabeler. Allah onlardan razı olduğunu bildirmiş (Tevbe 9:100) ve fedakârlıklarını övmüştür (Haşr 59:9).',
    },
    rel: ['muhajirun', 'sahabah', 'ithar'],
  },
  {
    term: 'Mühacirlər', ar: 'المهاجرون', translit: 'Muhajirun', cat: 'history',
    def: {
      az: 'Dinləri uğrunda yurdlarını və mallarını tərk edib Məkkədən Mədinəyə hicrət edən səhabələr. Quranda öndə gedən ilk mühacirlər və Ənsarla birlikdə tərif edilirlər (Tövbə 9:100).',
      en: 'The Companions who left their homes and property for the sake of their religion and emigrated from Makkah to Madinah. The Quran praises the foremost emigrants together with the Ansar (At-Tawbah 9:100).',
      ru: 'Сподвижники, оставившие ради религии свои дома и имущество и переселившиеся из Мекки в Медину. Коран восхваляет первых переселенцев вместе с ансарами (ат-Тауба 9:100).',
      ar: 'الصحابة الذين تركوا ديارهم وأموالهم في سبيل دينهم وهاجروا من مكة إلى المدينة. وأثنى الله على السابقين الأولين منهم ومن الأنصار (التوبة: 100).',
      tr: 'Dinleri uğruna yurtlarını ve mallarını bırakıp Mekke\'den Medine\'ye hicret eden sahabeler. Kur\'an ilk öncü muhacirleri Ensar\'la birlikte över (Tevbe 9:100).',
    },
    rel: ['ansar', 'hijrah', 'sahabah'],
  },
  {
    term: 'Bədr döyüşü', ar: 'غزوة بدر', translit: 'Ghazwat Badr', cat: 'history',
    def: {
      az: 'Hicrətin 2-ci ilində, Ramazan ayında müsəlmanlarla Qüreyş müşrikləri arasında olan ilk böyük döyüş. Sayca az olan müsəlmanlar qələbə qazandı: «Siz zəif ikən Allah sizə Bədrdə kömək etdi» (Ali-İmran 3:123). Quran bu günü «Furqan günü» adlandırır.',
      en: 'The first major battle between the Muslims and the pagans of Quraysh, in Ramadan, 2 AH. The outnumbered Muslims were victorious: «Allah had already given you victory at Badr while you were weak» (Ali Imran 3:123). The Quran calls it the Day of Criterion.',
      ru: 'Первое крупное сражение между мусульманами и многобожниками курайшитами в рамадане 2 г. х. Малочисленные мусульмане победили: «Аллах уже помог вам при Бадре, когда вы были слабы» (Аль Имран 3:123). Коран называет этот день Днём различения.',
      ar: 'أول معركة كبرى بين المسلمين ومشركي قريش في رمضان سنة 2 هـ، انتصر فيها المسلمون على قلّتهم: ﴿وَلَقَدْ نَصَرَكُمُ اللَّهُ بِبَدْرٍ وَأَنتُمْ أَذِلَّةٌ﴾ (آل عمران: 123)، وسمّاه القرآن يوم الفرقان.',
      tr: 'Hicretin 2. yılında, Ramazan ayında Müslümanlarla Kureyş müşrikleri arasında yapılan ilk büyük savaş. Sayıca az olan Müslümanlar kazandı: «Siz zayıfken Allah size Bedir\'de yardım etmişti» (Âl-i İmrân 3:123). Kur\'an bu güne Furkan günü der.',
    },
    rel: ['ghazwat-uhud', 'sirah', 'jihad'],
  },
  {
    term: 'Uhud döyüşü', ar: 'غزوة أحد', translit: 'Ghazwat Uhud', cat: 'history',
    def: {
      az: 'Hicrətin 3-cü ilində Mədinə yaxınlığındakı Uhud dağı ətrafında baş verən döyüş. Oxatanların Peyğəmbərin ﷺ əmrinə zidd olaraq yerlərini tərk etməsi müsəlmanların itkisinə səbəb oldu; Həmzə (r.a.) burada şəhid oldu. Ali-İmran surəsində bu döyüşün dərsləri anlatılır.',
      en: 'The battle near Mount Uhud by Madinah in 3 AH. The archers leaving their post against the Prophet\'s ﷺ order led to Muslim losses; Hamzah (may Allah be pleased with him) was martyred there. Surah Ali Imran draws its lessons.',
      ru: 'Сражение у горы Ухуд близ Медины в 3 г. х. Лучники, покинувшие позицию вопреки приказу Пророка ﷺ, стали причиной потерь мусульман; здесь пал мучеником Хамза (да будет доволен им Аллах). Уроки битвы изложены в суре Аль Имран.',
      ar: 'معركة وقعت عند جبل أحد قرب المدينة سنة 3 هـ، وكان ترك الرماة مواقعهم خلافًا لأمر النبي ﷺ سببًا في مصاب المسلمين، واستشهد فيها حمزة رضي الله عنه. وذكرت سورة آل عمران دروسها.',
      tr: 'Hicretin 3. yılında Medine yakınındaki Uhud dağı çevresinde yapılan savaş. Okçuların Peygamber\'in ﷺ emrine aykırı olarak yerlerini terk etmesi Müslümanların kayıp vermesine yol açtı; Hz. Hamza burada şehit oldu. Âl-i İmrân suresi bu savaşın derslerini anlatır.',
    },
    rel: ['ghazwat-badr', 'ghazwat-al-khandaq', 'sirah'],
  },
  {
    term: 'Xəndək döyüşü', ar: 'غزوة الخندق', translit: 'Ghazwat al-Khandaq', cat: 'history',
    def: {
      az: 'Hicrətin 5-ci ilində müşrik qəbilələrin birləşərək (Əhzab) Mədinəni mühasirəyə alması. Müsəlmanlar şəhərin açıq tərəfində xəndək qazdılar; Allah düşmənin üzərinə külək və görünməz ordular göndərdi (Əhzab 33:9).',
      en: 'The siege of Madinah in 5 AH by the allied pagan tribes (al-Ahzab). The Muslims dug a trench on the city\'s open side, and Allah sent a wind and unseen hosts against the enemy (Al-Ahzab 33:9).',
      ru: 'Осада Медины в 5 г. х. объединёнными племенами многобожников (аль-Ахзаб). Мусульмане вырыли ров с открытой стороны города, а Аллах наслал на врага ветер и невидимые войска (аль-Ахзаб 33:9).',
      ar: 'حصار المدينة سنة 5 هـ من الأحزاب المتحالفين من المشركين، فحفر المسلمون الخندق في جهتها المكشوفة، وأرسل الله على الأعداء ريحًا وجنودًا لم يروها (الأحزاب: 9).',
      tr: 'Hicretin 5. yılında müşrik kabilelerin birleşerek (Ahzâb) Medine\'yi kuşatması. Müslümanlar şehrin açık tarafına hendek kazdı; Allah düşmana rüzgâr ve görünmeyen ordular gönderdi (Ahzâb 33:9).',
    },
    rel: ['ghazwat-uhud', 'sulh-al-hudaybiyyah', 'sirah'],
  },
  {
    term: 'Hüdeybiyə sülhü', ar: 'صلح الحديبية', translit: 'Sulh al-Hudaybiyyah', cat: 'history',
    def: {
      az: 'Hicrətin 6-cı ilində Ümrə üçün gələn müsəlmanlarla Qüreyş arasında Məkkə yaxınlığında bağlanmış barışıq. Zahirən ağır şərtlərinə baxmayaraq Quran onu «açıq fəth» adlandırdı; ağac altındakı Rıdvan beyətinin iştirakçılarından Allah razı olduğunu bildirdi (Fəth 48:18).',
      en: 'The truce concluded near Makkah in 6 AH between Quraysh and the Muslims who had come for Umrah. Despite its seemingly harsh terms the Quran called it «a clear victory», and Allah declared His pleasure with those who pledged under the tree (Al-Fath 48:18).',
      ru: 'Перемирие, заключённое в 6 г. х. близ Мекки между курайшитами и мусульманами, пришедшими совершить умру. Несмотря на внешне тяжёлые условия, Коран назвал его «явной победой», а Аллах сообщил, что доволен присягнувшими под деревом (аль-Фатх 48:18).',
      ar: 'صلح عُقد سنة 6 هـ قرب مكة بين قريش والمسلمين القادمين للعمرة، وسمّاه القرآن فتحًا مبينًا مع شدة شروطه في الظاهر، وأخبر الله برضاه عن أهل بيعة الرضوان تحت الشجرة (الفتح: 18).',
      tr: 'Hicretin 6. yılında umre için gelen Müslümanlarla Kureyş arasında Mekke yakınında yapılan antlaşma. Görünüşte ağır şartlarına rağmen Kur\'an onu «apaçık fetih» diye adlandırdı; Allah ağaç altındaki Rıdvan biatına katılanlardan razı olduğunu bildirdi (Fetih 48:18).',
    },
    rel: ['bayah', 'fath-makkah', 'umrah'],
  },
  {
    term: 'Məkkənin fəthi', ar: 'فتح مكة', translit: 'Fath Makkah', cat: 'history',
    def: {
      az: 'Hicrətin 8-ci ilində Qüreyşin sülhü pozmasından sonra Məkkənin demək olar ki, qan tökülmədən fəth edilməsi. Peyğəmbər ﷺ Kəbəni bütlərdən təmizlədi və Məkkə əhlini əfv etdi; insanlar dəstə-dəstə İslama girdi (Nəsr 110:1–2).',
      en: 'The conquest of Makkah, almost without bloodshed, in 8 AH after Quraysh broke the truce. The Prophet ﷺ cleansed the Ka\'bah of idols and pardoned the people of Makkah, and people entered Islam in crowds (An-Nasr 110:1–2).',
      ru: 'Почти бескровное взятие Мекки в 8 г. х. после нарушения курайшитами перемирия. Пророк ﷺ очистил Каабу от идолов и простил жителей Мекки, а люди толпами стали принимать Ислам (ан-Наср 110:1–2).',
      ar: 'فتح مكة سنة 8 هـ دون قتال يُذكر بعد نقض قريش للصلح، فطهّر النبي ﷺ الكعبة من الأصنام وعفا عن أهلها، ودخل الناس في دين الله أفواجًا (النصر: 1–2).',
      tr: 'Hicretin 8. yılında Kureyş\'in antlaşmayı bozmasından sonra Mekke\'nin neredeyse kan dökülmeden fethedilmesi. Peygamber ﷺ Kâbe\'yi putlardan temizledi ve Mekkelileri affetti; insanlar bölük bölük İslam\'a girdi (Nasr 110:1–2).',
    },
    rel: ['sulh-al-hudaybiyyah', 'kabah', 'tawhid'],
  },
  {
    term: 'Vida həcci', ar: 'حجة الوداع', translit: 'Hajjat al-Wada\'', cat: 'history',
    def: {
      az: 'Peyğəmbərin ﷺ hicrətin 10-cu ilində etdiyi yeganə həcc; burada həcc əməllərini əməli olaraq öyrətdi və məşhur xütbələrini söylədi. «Bu gün dininizi kamil etdim» ayəsi (Maidə 5:3) bu həcdə, Ərəfə günü nazil oldu (Buxari 45).',
      en: 'The only Hajj performed by the Prophet ﷺ, in 10 AH, where he taught the rites by example and delivered his famous sermons. The verse «This day I have perfected your religion for you» (Al-Ma\'idah 5:3) was revealed during it, on the day of Arafah (Bukhari 45).',
      ru: 'Единственный хадж Пророка ﷺ в 10 г. х., в котором он на деле обучил обрядам и произнёс знаменитые проповеди. Аят «Сегодня Я завершил для вас вашу религию» (аль-Маида 5:3) был ниспослан во время него, в день Арафата (Бухари 45).',
      ar: 'الحجة الوحيدة للنبي ﷺ سنة 10 هـ، علّم فيها المناسك بفعله وخطب خطبه المشهورة، ونزلت فيها يوم عرفة آية ﴿الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ﴾ (المائدة: 3؛ البخاري 45).',
      tr: 'Peygamber\'in ﷺ hicretin 10. yılında yaptığı tek hac; burada hac menasikini bizzat uygulayarak öğretti ve meşhur hutbelerini irat etti. «Bugün dininizi kemale erdirdim» ayeti (Mâide 5:3) bu hacda, Arefe günü indi (Buhârî 45).',
    },
    rel: ['hajj', 'arafah', 'khutbah'],
    lesson: 'dhul-hijjah-ten',
  },
  {
    term: 'Xüləfayi-Raşidin', ar: 'الخلفاء الراشدون', translit: 'Al-Khulafa\' ar-Rashidun', cat: 'history',
    def: {
      az: 'Peyğəmbərdən ﷺ sonra ümmətə rəhbərlik edən dörd doğru yolda olan xəlifə: Əbu Bəkr, Ömər, Osman və Əli (Allah onlardan razı olsun). Əhli-Sünnəyə görə fəzilətdə də sıraları belədir; onların sünnəsinə tabe olmaq əmr edilib.',
      en: 'The four rightly guided caliphs who led the Ummah after the Prophet ﷺ: Abu Bakr, Umar, Uthman and Ali (may Allah be pleased with them). According to Ahl as-Sunnah, this is also their order in virtue; following their sunnah has been commanded.',
      ru: 'Четыре праведных халифа, руководившие общиной после Пророка ﷺ: Абу Бакр, Умар, Усман и Али (да будет доволен ими Аллах). По убеждению Ахль ас-Сунна, таков же и их порядок по достоинству; следовать их сунне велено.',
      ar: 'الخلفاء الأربعة بعد النبي ﷺ: أبو بكر وعمر وعثمان وعلي رضي الله عنهم، وترتيبهم في الفضل عند أهل السنة كترتيبهم في الخلافة، وقد أُمرنا باتباع سنتهم.',
      tr: 'Peygamber\'den ﷺ sonra ümmeti yöneten dört raşit halife: Ebû Bekir, Ömer, Osman ve Ali (Allah onlardan razı olsun). Ehl-i Sünnet\'e göre faziletteki sıraları da böyledir; onların sünnetine uymak emredilmiştir.',
    },
    rel: ['khalifah', 'sahabah', 'hurub-ar-riddah'],
  },
  {
    term: 'Əhli-Beyt', ar: 'أهل البيت', translit: 'Ahl al-Bayt', cat: 'history',
    def: {
      az: 'Peyğəmbərin ﷺ ailəsi: zövcələri (Əhzab 33:33 ayəsinin konteksti onlar haqdadır), Əli, Fatimə, Həsən, Hüseyn və sədəqə haram olan digər mömin qohumları. Əhli-Sünnə onları sevir və hörmət edir, lakin onlar haqqında ğuluvva — qeybi bilmək, onlara dua etmək kimi — yol vermir.',
      en: 'The Prophet\'s ﷺ household: his wives (the context of Al-Ahzab 33:33 addresses them), Ali, Fatimah, al-Hasan, al-Husayn and his other believing relatives for whom charity is forbidden. Ahl as-Sunnah love and honour them, without exaggeration such as claiming they know the unseen or calling upon them.',
      ru: 'Семья Пророка ﷺ: его жёны (контекст аята аль-Ахзаб 33:33 обращён к ним), Али, Фатима, аль-Хасан, аль-Хусейн и другие верующие родственники, которым запрещена милостыня. Ахль ас-Сунна любят и почитают их, но без чрезмерности — приписывания им знания сокровенного или мольбы к ним.',
      ar: 'آل النبي ﷺ: أزواجه (وسياق آية الأحزاب 33 فيهن) وعلي وفاطمة والحسن والحسين وسائر قرابته المؤمنين الذين تحرم عليهم الصدقة. يحبهم أهل السنة ويوقّرونهم من غير غلو كادعاء علمهم الغيب أو دعائهم.',
      tr: 'Peygamber\'in ﷺ ailesi: hanımları (Ahzâb 33:33 ayetinin bağlamı onlarla ilgilidir), Ali, Fâtıma, Hasan, Hüseyin ve sadakanın haram olduğu diğer mümin akrabaları. Ehl-i Sünnet onları sever ve sayar; ancak gaybı bildiklerini iddia etmek veya onlara dua etmek gibi aşırılığa düşmez.',
    },
    rel: ['ummahat-al-muminin', 'sahabah', 'ahl-as-sunnah-wal-jamaah'],
  },
  {
    term: 'Möminlərin anaları', ar: 'أمهات المؤمنين', translit: 'Ummahat al-Mu\'minin', cat: 'history',
    def: {
      az: 'Peyğəmbərin ﷺ zövcələri — Xədicə, Aişə, Həfsə və digərləri (Allah onlardan razı olsun). Quran onları möminlərin anaları adlandırır (Əhzab 33:6): onlara hörmət vacibdir, Peyğəmbərdən ﷺ sonra onlarla evlənmək haram idi. Onlar Əhli-Beytdəndir.',
      en: 'The wives of the Prophet ﷺ — Khadijah, Aishah, Hafsah and others (may Allah be pleased with them). The Quran calls them the mothers of the believers (Al-Ahzab 33:6): honouring them is obligatory, and marrying them after the Prophet ﷺ was forbidden. They are of Ahl al-Bayt.',
      ru: 'Жёны Пророка ﷺ — Хадиджа, Аиша, Хафса и другие (да будет доволен ими Аллах). Коран называет их матерями верующих (аль-Ахзаб 33:6): почитать их обязательно, а жениться на них после Пророка ﷺ было запрещено. Они относятся к его семье.',
      ar: 'زوجات النبي ﷺ كخديجة وعائشة وحفصة وغيرهن رضي الله عنهن، سمّاهن القرآن أمهات المؤمنين (الأحزاب: 6)، فيجب توقيرهن، وحرم نكاحهن بعده ﷺ، وهن من أهل بيته.',
      tr: 'Peygamber\'in ﷺ hanımları — Hatice, Âişe, Hafsa ve diğerleri (Allah onlardan razı olsun). Kur\'an onları müminlerin anneleri diye anar (Ahzâb 33:6): onlara saygı vaciptir, Peygamber\'den ﷺ sonra onlarla evlenmek haramdı. Onlar Ehl-i Beyt\'tendir.',
    },
    rel: ['ahl-al-bayt', 'sahabah', 'sirah'],
  },
  {
    term: 'Cənnətlə müjdələnən on nəfər', ar: 'العشرة المبشرون بالجنة', translit: 'Al-Asharah al-Mubashsharun', cat: 'history',
    def: {
      az: 'Peyğəmbərin ﷺ bir hədisdə adlarını çəkərək Cənnətlə müjdələdiyi on səhabə: dörd xəlifə, Təlhə, Zübeyr, Əbdürrəhman ibn Auf, Səd ibn Əbu Vəqqas, Səid ibn Zeyd və Əbu Ubeydə ibn əl-Cərrah. Əhli-Sünnə bu müjdəyə inanır.',
      en: 'The ten Companions whom the Prophet ﷺ named together and gave glad tidings of Paradise: the four caliphs, Talhah, az-Zubayr, Abd ar-Rahman ibn Awf, Sa\'d ibn Abi Waqqas, Sa\'id ibn Zayd and Abu Ubaydah ibn al-Jarrah. Ahl as-Sunnah affirm this.',
      ru: 'Десять сподвижников, которых Пророк ﷺ поимённо обрадовал Раем: четыре халифа, Тальха, аз-Зубайр, Абд ар-Рахман ибн Ауф, Саад ибн Абу Ваккас, Саид ибн Зейд и Абу Убайда ибн аль-Джаррах. Ахль ас-Сунна верят в это.',
      ar: 'عشرة من الصحابة بشّرهم النبي ﷺ بالجنة في حديث واحد بأسمائهم: الخلفاء الأربعة وطلحة والزبير وعبد الرحمن بن عوف وسعد بن أبي وقاص وسعيد بن زيد وأبو عبيدة بن الجراح، ويشهد لهم أهل السنة بذلك.',
      tr: 'Peygamber\'in ﷺ bir hadiste isimlerini sayarak Cennet\'le müjdelediği on sahabe: dört halife, Talha, Zübeyr, Abdurrahman b. Avf, Sa\'d b. Ebî Vakkâs, Saîd b. Zeyd ve Ebû Ubeyde b. Cerrâh. Ehl-i Sünnet bu müjdeye inanır.',
    },
    rel: ['al-khulafa-ar-rashidun', 'sahabah', 'jannah'],
  },
  {
    term: 'Təbəüt-tabiin', ar: 'أتباع التابعين', translit: 'Atba\' at-Tabi\'in', cat: 'history',
    def: {
      az: 'Tabiinləri görüb onlardan elm alan nəsil — Peyğəmbərin ﷺ tərif etdiyi üç ən xeyirli nəslin üçüncüsü: «İnsanların ən xeyirlisi mənim nəslimdir, sonra onlardan sonrakılar, sonra onlardan sonrakılar» (Buxari 2652). İmam Malik, Sufyan əs-Sauri kimi alimlər bu nəsildəndir.',
      en: 'The generation who met the Tabi\'un and learned from them — the third of the three best generations praised by the Prophet ﷺ: «The best of people are my generation, then those who follow them, then those who follow them» (Bukhari 2652). Scholars such as Imam Malik and Sufyan ath-Thawri belong to it.',
      ru: 'Поколение, заставшее табиинов и учившееся у них, — третье из трёх лучших поколений, восхвалённых Пророком ﷺ: «Лучшие люди — моё поколение, затем те, кто последует за ними, затем те, кто последует за ними» (Бухари 2652). К нему относятся имам Малик, Суфьян ас-Саури и другие.',
      ar: 'الجيل الذي لقي التابعين وأخذ عنهم، وهو ثالث القرون المفضلة: «خير الناس قرني، ثم الذين يلونهم، ثم الذين يلونهم» (البخاري 2652)، ومنهم الإمام مالك وسفيان الثوري.',
      tr: 'Tâbiîn\'i görüp onlardan ilim alan nesil; Peygamber\'in ﷺ övdüğü en hayırlı üç neslin üçüncüsü: «İnsanların en hayırlısı benim neslimdir, sonra onları takip edenler, sonra onları takip edenler» (Buhârî 2652). İmam Mâlik, Süfyân es-Sevrî gibi âlimler bu nesildendir.',
    },
    rel: ['tabiun', 'sahabah', 'salaf'],
  },
  {
    term: 'Kəbə', ar: 'الكعبة', translit: 'Ka\'bah', cat: 'history',
    def: {
      az: 'Məkkədə, Məscidül-Həramın ortasında yerləşən, İbrahim və İsmail (ə.s.) tərəfindən ucaldılan müqəddəs ev; müsəlmanların qibləsi. «İnsanlar üçün qurulan ilk ev Bəkkədəkidir» (Ali-İmran 3:96). Ona ibadət edilmir — ona tərəf yalnız Allaha ibadət edilir.',
      en: 'The sacred House in the middle of al-Masjid al-Haram in Makkah, raised by Ibrahim and Isma\'il (peace be upon them); the Muslims\' qiblah. «The first House established for mankind was that at Bakkah» (Ali Imran 3:96). It is not worshipped — facing it, Allah alone is worshipped.',
      ru: 'Священный Дом посреди Заповедной мечети в Мекке, возведённый Ибрахимом и Исмаилом (мир им); кибла мусульман. «Первый дом, воздвигнутый для людей, — тот, что в Бекке» (Аль Имран 3:96). Ей не поклоняются — обращаясь к ней, поклоняются лишь Аллаху.',
      ar: 'البيت الحرام في وسط المسجد الحرام بمكة، رفع قواعده إبراهيم وإسماعيل عليهما السلام، وهو قبلة المسلمين: ﴿إِنَّ أَوَّلَ بَيْتٍ وُضِعَ لِلنَّاسِ لَلَّذِي بِبَكَّةَ﴾ (آل عمران: 96). ولا يُعبد البيت، بل يُعبد الله وحده متوجَّهًا إليه.',
      tr: 'Mekke\'de, Mescid-i Haram\'ın ortasında bulunan, İbrahim ve İsmail (a.s.) tarafından yükseltilen kutsal ev; Müslümanların kıblesi. «İnsanlar için kurulan ilk ev Bekke\'dekidir» (Âl-i İmrân 3:96). Ona ibadet edilmez; ona yönelerek yalnız Allah\'a ibadet edilir.',
    },
    rel: ['qiblah', 'al-masjid-al-haram', 'tawaf', 'al-hajar-al-aswad'],
  },
  {
    term: 'Məscidül-Həram', ar: 'المسجد الحرام', translit: 'Al-Masjid al-Haram', cat: 'history',
    def: {
      az: 'Məkkədə Kəbəni əhatə edən məscid — yer üzünün ən fəzilətli məscidi. Səfər edilərək ziyarət olunması məşru olan üç məsciddən biridir (Buxari 1189); namaz zamanı ona tərəf üz tutulur (Bəqərə 2:144).',
      en: 'The mosque surrounding the Ka\'bah in Makkah — the most virtuous mosque on earth. It is one of the three mosques to which travelling for worship is legislated (Bukhari 1189), and prayer is performed facing it (Al-Baqarah 2:144).',
      ru: 'Мечеть вокруг Каабы в Мекке — самая достойная мечеть на земле. Это одна из трёх мечетей, к которым узаконено совершать поездку ради поклонения (Бухари 1189); в молитве обращаются в её сторону (аль-Бакара 2:144).',
      ar: 'المسجد المحيط بالكعبة في مكة، وهو أفضل مساجد الأرض، وأحد المساجد الثلاثة التي تُشد إليها الرحال (البخاري 1189)، ويُستقبل في الصلاة (البقرة: 144).',
      tr: 'Mekke\'de Kâbe\'yi çevreleyen mescit; yeryüzünün en faziletli mescidi. İbadet için yolculuk yapılması meşru olan üç mescitten biridir (Buhârî 1189); namazda ona yönelinir (Bakara 2:144).',
    },
    rel: ['kabah', 'al-masjid-an-nabawi', 'al-masjid-al-aqsa'],
  },
  {
    term: 'Məscidi-Nəbəvi', ar: 'المسجد النبوي', translit: 'Al-Masjid an-Nabawi', cat: 'history',
    def: {
      az: 'Peyğəmbərin ﷺ hicrətdən sonra Mədinədə tikdiyi məscid; səfər edilərək ziyarət olunan üç məsciddən biri (Buxari 1189). Səfərin məqsədi məsciddə namazdır; oradan sonra qəbri Sünnəyə uyğun salamla ziyarət etmək olar, lakin qəbrdən dua istəmək və ona təvaf etmək olmaz.',
      en: 'The mosque the Prophet ﷺ built in Madinah after the Hijrah; one of the three mosques to which one travels for worship (Bukhari 1189). The aim of the journey is prayer in the mosque; one may then visit the grave with the Sunnah greeting, but not ask the grave for anything or circle it.',
      ru: 'Мечеть, построенная Пророком ﷺ в Медине после переселения; одна из трёх мечетей, к которым совершают поездку ради поклонения (Бухари 1189). Цель поездки — молитва в мечети; после этого можно посетить могилу с приветствием по Сунне, но нельзя просить у могилы или обходить её.',
      ar: 'المسجد الذي بناه النبي ﷺ بالمدينة بعد الهجرة، وأحد المساجد الثلاثة التي تُشد إليها الرحال (البخاري 1189). والمقصود بالسفر الصلاة فيه، ثم يُسلَّم على النبي ﷺ عند قبره على الوجه المشروع دون دعائه أو الطواف بالقبر.',
      tr: 'Peygamber\'in ﷺ hicretten sonra Medine\'de inşa ettiği mescit; ibadet için yolculuk yapılan üç mescitten biri (Buhârî 1189). Yolculuğun amacı mescitte namazdır; ardından kabir Sünnet\'e uygun selamla ziyaret edilebilir, fakat kabirden bir şey istenmez ve etrafında tavaf edilmez.',
    },
    rel: ['al-masjid-al-haram', 'hijrah', 'bidah'],
  },
  {
    term: 'Məscidül-Əqsa', ar: 'المسجد الأقصى', translit: 'Al-Masjid al-Aqsa', cat: 'history',
    def: {
      az: 'Qüdsdə yerləşən, İsra gecəsində Peyğəmbərin ﷺ aparıldığı mübarək məscid (İsra 17:1); müsəlmanların ilk qibləsi və səfər edilərək ziyarət olunan üç məscidin üçüncüsü (Buxari 1189).',
      en: 'The blessed mosque in Jerusalem to which the Prophet ﷺ was taken on the Night Journey (Al-Isra 17:1); the first qiblah of the Muslims and the third of the three mosques to which one travels for worship (Bukhari 1189).',
      ru: 'Благословенная мечеть в Иерусалиме, куда Пророк ﷺ был перенесён в ночь Исра (аль-Исра 17:1); первая кибла мусульман и третья из трёх мечетей, к которым совершают поездку ради поклонения (Бухари 1189).',
      ar: 'المسجد المبارك في بيت المقدس الذي أُسري بالنبي ﷺ إليه (الإسراء: 1)، وهو أولى القبلتين وثالث المساجد التي تُشد إليها الرحال (البخاري 1189).',
      tr: 'Kudüs\'te bulunan, İsrâ gecesi Peygamber\'in ﷺ götürüldüğü mübarek mescit (İsrâ 17:1); Müslümanların ilk kıblesi ve ibadet için yolculuk yapılan üç mescidin üçüncüsü (Buhârî 1189).',
    },
    rel: ['al-isra-wal-miraj', 'qiblah', 'al-masjid-al-haram'],
  },
  {
    term: 'Zəmzəm', ar: 'زمزم', translit: 'Zamzam', cat: 'history',
    def: {
      az: 'Məscidül-Həramda, Kəbənin yaxınlığındakı mübarək quyu; Allah onu Hacər və körpə İsmail üçün çıxarıb. Onun suyunu niyyətlə içmək və dua etmək Sünnədir.',
      en: 'The blessed well in al-Masjid al-Haram near the Ka\'bah, which Allah brought forth for Hajar and the infant Isma\'il. Drinking its water with an intention and making du\'a is Sunnah.',
      ru: 'Благословенный колодец в Заповедной мечети близ Каабы, который Аллах вывел для Хаджар и младенца Исмаила. Пить его воду с намерением и обращаться при этом с мольбой — Сунна.',
      ar: 'البئر المباركة في المسجد الحرام قرب الكعبة، أنبعها الله لهاجر وابنها إسماعيل، ويُسن الشرب من مائها بنية والدعاء عنده.',
      tr: 'Mescid-i Haram\'da, Kâbe\'nin yakınındaki mübarek kuyu; Allah onu Hacer ve bebek İsmail için çıkarmıştır. Suyunu niyetle içmek ve dua etmek Sünnettir.',
    },
    rel: ['al-masjid-al-haram', 'hajj', 'umrah'],
  },
  {
    term: 'Həcərül-Əsvəd', ar: 'الحجر الأسود', translit: 'Al-Hajar al-Aswad', cat: 'history',
    def: {
      az: 'Kəbənin şərq küncündə yerləşən qara daş; təvaf ondan başlayır. Onu öpmək, mümkün olmasa toxunmaq və ya ona işarə etmək Sünnədir — yalnız Peyğəmbərə ﷺ tabe olmaq üçün. Ömər (r.a.) demişdir: «Bilirəm ki, sən bir daşsan, nə zərər, nə fayda verirsən» (Buxari 1597).',
      en: 'The black stone set in the eastern corner of the Ka\'bah, where tawaf begins. Kissing it, or touching or pointing to it if that is not possible, is Sunnah — purely to follow the Prophet ﷺ. Umar said: «I know that you are a stone that neither harms nor benefits» (Bukhari 1597).',
      ru: 'Чёрный камень в восточном углу Каабы, от которого начинается обход. Целовать его, а если невозможно — касаться или указывать на него, — Сунна, совершаемая лишь в следовании Пророку ﷺ. Умар сказал: «Я знаю, что ты камень, не приносящий ни вреда, ни пользы» (Бухари 1597).',
      ar: 'حجر في الركن الشرقي من الكعبة يُبدأ منه الطواف، ويُسن تقبيله أو استلامه أو الإشارة إليه اتباعًا للنبي ﷺ لا غير. قال عمر رضي الله عنه: «إني أعلم أنك حجر لا تضر ولا تنفع» (البخاري 1597).',
      tr: 'Kâbe\'nin doğu köşesindeki siyah taş; tavaf ondan başlar. Onu öpmek, mümkün değilse dokunmak veya işaret etmek Sünnettir — sırf Peygamber\'e ﷺ uymak için. Hz. Ömer: «Biliyorum ki sen bir taşsın; ne zarar verirsin ne fayda» demiştir (Buhârî 1597).',
    },
    rel: ['kabah', 'tawaf', 'ittiba'],
  },
  {
    term: 'Beyət', ar: 'البيعة', translit: 'Bay\'ah', cat: 'history',
    def: {
      az: 'Müsəlmanların Peyğəmbərə ﷺ, ondan sonra isə şəri hökmdara Allaha itaət çərçivəsində qulaq asıb itaət edəcəklərinə söz verməsi. Məşhur beyətlər: Əqəbə beyətləri və Hüdeybiyədəki Rıdvan beyəti (Fəth 48:18). Beyət yalnız müsəlmanların hökmdarına verilir, gizli qrup rəhbərlərinə deyil.',
      en: 'The pledge given to the Prophet ﷺ, and after him to the legitimate Muslim ruler, to hear and obey within obedience to Allah. Famous pledges include those of Aqabah and the Pledge of Ridwan at Hudaybiyyah (Al-Fath 48:18). Bay\'ah is given to the ruler of the Muslims, not to leaders of secret groups.',
      ru: 'Присяга Пророку ﷺ, а после него законному правителю мусульман, в том, чтобы слушаться и повиноваться в рамках покорности Аллаху. Известны присяги при Акабе и присяга Ридван при Худейбии (аль-Фатх 48:18). Присягу дают правителю мусульман, а не главарям тайных групп.',
      ar: 'العهد على السمع والطاعة للنبي ﷺ ثم لولي أمر المسلمين في غير معصية الله، ومن أشهرها بيعتا العقبة وبيعة الرضوان بالحديبية (الفتح: 18). ولا تكون البيعة إلا لإمام المسلمين لا لرؤساء الجماعات السرية.',
      tr: 'Peygamber\'e ﷺ, ondan sonra da meşru Müslüman yöneticiye Allah\'a itaat çerçevesinde dinleyip itaat etme sözü. Meşhur biatlar: Akabe biatları ve Hudeybiye\'deki Rıdvan biatı (Fetih 48:18). Biat yalnız Müslümanların yöneticisine verilir, gizli grup liderlerine değil.',
    },
    rel: ['sulh-al-hudaybiyyah', 'khalifah', 'ahl-as-sunnah-wal-jamaah'],
  },
  {
    term: 'Hicri təqvim', ar: 'التقويم الهجري', translit: 'At-Taqwim al-Hijri', cat: 'history',
    def: {
      az: 'Ay aylarına əsaslanan İslam təqvimi: il on iki aydan ibarətdir, onlardan dördü haram aylardır (Tövbə 9:36). Hesab Ömərin (r.a.) xilafəti dövründə səhabələrin razılığı ilə hicrət ilindən başlanıb; il Məhərrəm ayı ilə açılır.',
      en: 'The Islamic lunar calendar: the year has twelve months, four of them sacred (At-Tawbah 9:36). Its count was set during the caliphate of Umar, with the Companions\' agreement, to begin from the year of the Hijrah; the year opens with Muharram.',
      ru: 'Исламский лунный календарь: в году двенадцать месяцев, четыре из них запретные (ат-Тауба 9:36). Летоисчисление было установлено в правление Умара с согласия сподвижников от года переселения; год начинается с мухаррама.',
      ar: 'التقويم القمري الإسلامي، وعدة شهوره اثنا عشر منها أربعة حرم (التوبة: 36). وُضع في خلافة عمر رضي الله عنه باتفاق الصحابة مبتدئًا من عام الهجرة، وأول شهوره المحرم.',
      tr: 'Ay aylarına dayanan İslam takvimi: yıl on iki aydır, bunlardan dördü haram aylardır (Tevbe 9:36). Hz. Ömer\'in halifeliği döneminde sahabenin ittifakıyla hicret yılından başlatılmıştır; yıl Muharrem ayıyla açılır.',
    },
    rel: ['hijrah', 'al-khulafa-ar-rashidun', 'sawm'],
  },
  {
    term: 'Ridda müharibələri', ar: 'حروب الردة', translit: 'Hurub ar-Riddah', cat: 'history',
    def: {
      az: 'Peyğəmbərin ﷺ vəfatından sonra Əbu Bəkrin (r.a.) xilafəti dövründə dindən dönənlərə, yalançı peyğəmbərlərə və zəkatı verməkdən imtina edənlərə qarşı aparılan müharibələr. Səhabələrin birliyi ilə Ərəbistanda İslam yenidən möhkəmləndi.',
      en: 'The wars fought during the caliphate of Abu Bakr after the Prophet\'s ﷺ death against apostates, false prophets and those who refused to pay zakat. Through the Companions\' unity Islam was re-established across Arabia.',
      ru: 'Войны, которые велись в правление Абу Бакра после смерти Пророка ﷺ против отступников, лжепророков и отказавшихся выплачивать закят. Благодаря единству сподвижников Ислам вновь утвердился в Аравии.',
      ar: 'الحروب التي خاضها أبو بكر رضي الله عنه بعد وفاة النبي ﷺ ضد المرتدين ومدّعي النبوة ومانعي الزكاة، وبها ثبّت الله الإسلام في جزيرة العرب باجتماع الصحابة.',
      tr: 'Peygamber\'in ﷺ vefatından sonra Hz. Ebû Bekir\'in halifeliği döneminde dinden dönenlere, yalancı peygamberlere ve zekâtı vermeyi reddedenlere karşı yapılan savaşlar. Sahabenin birliğiyle Arabistan\'da İslam yeniden sağlamlaştı.',
    },
    rel: ['al-khulafa-ar-rashidun', 'zakat', 'kufr'],
  },
]
