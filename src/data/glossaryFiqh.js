// ═══════════════════════════════════════════════════════
// İslami söz lüğəti — FİQH və ÜSUL terminləri (5 dil).
//
// Təriflər Əhli-Sünnənin üsuluna uyğundur: dəlilə tabe olmaq (ittiba),
// dörd imama hörmət, lakin dəlil hər sözdən öndədir; bağlayıcı icma
// səhabələrin və Sələfin icmasıdır. Hədd və qisas yalnız qanuni hakimiyyət
// (məhkəmə) tərəfindən tətbiq olunur, fərdlər tərəfindən yox.
// Ayələr api.quran.com-dan, hədis nömrələri fawazahmed0/hadith-api
// (standart nömrələmə) ilə yoxlanılıb. Yoxlanılmayan istinad yazılmır.
//
// Sahələr: term (az), ar, translit, cat, def{az,en,ru,ar,tr},
// rel — əlaqəli terminlərin id-ləri, lesson — /learn/<slug> dərsi (varsa).
// ═══════════════════════════════════════════════════════

export const GLOSSARY_FIQH = [
  {
    term: 'Üsulul-fiqh', ar: 'أصول الفقه', translit: 'Usul al-Fiqh', cat: 'fiqh',
    def: {
      az: 'Fiqh hökmlərinin dəlillərdən necə çıxarıldığını öyrədən elm: dəlillərin növləri (Quran, Sünnə, icma, qiyas), əmr və qadağanın mənası, ümumi və xüsusi, nasix və mənsux, müctəhidin şərtləri.',
      en: 'The science of how rulings are derived from the evidence: the sources (Quran, Sunnah, consensus, analogy), the meaning of commands and prohibitions, general and specific texts, abrogation, and the qualifications of a mujtahid.',
      ru: 'Наука о том, как шариатские решения выводятся из доводов: источники (Коран, Сунна, иджма, кыяс), смысл повеления и запрета, общее и частное, отменяющее и отменённое, условия муджтахида.',
      ar: 'علم يُعرف به كيفية استنباط الأحكام الشرعية من أدلتها: مصادرها (الكتاب والسنة والإجماع والقياس)، ودلالات الأمر والنهي، والعام والخاص، والناسخ والمنسوخ، وشروط المجتهد.',
      tr: 'Fıkıh hükümlerinin delillerden nasıl çıkarıldığını öğreten ilim: deliller (Kur\'an, Sünnet, icma, kıyas), emir ve yasağın anlamı, umum ve husus, nesih ve müçtehidin şartları.',
    },
    rel: ['fiqh', 'ijma', 'qiyas', 'ijtihad'],
  },
  {
    term: 'İcma', ar: 'الإجماع', translit: 'Ijma\'', cat: 'fiqh',
    def: {
      az: 'Peyğəmbərdən ﷺ sonra bir dövrün bütün müctəhid alimlərinin şəri bir hökmdə yekdil olması. Ən möhkəm və bağlayıcı icma səhabələrin icmasıdır; möminlərin yolundan ayrılmaq qınanmışdır (Nisa 4:115).',
      en: 'The agreement of all the qualified scholars of an era after the Prophet ﷺ on a ruling. The firmest and most binding consensus is that of the Companions; departing from the way of the believers is condemned (An-Nisa 4:115).',
      ru: 'Единогласие всех муджтахидов одной эпохи после Пророка ﷺ по шариатскому вопросу. Самое твёрдое и обязывающее единогласие — единогласие сподвижников; отход от пути верующих порицается (ан-Ниса 4:115).',
      ar: 'اتفاق مجتهدي الأمة في عصر من العصور بعد النبي ﷺ على حكم شرعي. وأقوى الإجماع وألزمه إجماع الصحابة، وقد ذمّ الله اتباع غير سبيل المؤمنين (النساء: 115).',
      tr: 'Peygamber\'den ﷺ sonra bir dönemin bütün müçtehit âlimlerinin şer\'î bir hükümde ittifak etmesi. En sağlam ve bağlayıcı icma sahabenin icmasıdır; müminlerin yolundan ayrılmak kınanmıştır (Nisâ 4:115).',
    },
    rel: ['usul-al-fiqh', 'qiyas', 'salaf', 'sahabah'],
  },
  {
    term: 'Qiyas', ar: 'القياس', translit: 'Qiyas', cat: 'fiqh',
    def: {
      az: 'Haqqında açıq nəss olmayan məsələni ortaq səbəbə (illətə) görə nəssdə hökmü olan məsələyə bənzətmək: məsələn, bütün məstedici içkilərin şərab kimi haram olması. Əhli-Sünnəyə görə səhih qiyas dəlildir, lakin nəssə zidd olan qiyas batildir.',
      en: 'Applying the ruling of a case found in the texts to a new case because they share the same effective cause (\'illah): e.g. every intoxicant is forbidden like wine. For Ahl as-Sunnah sound analogy is a valid proof, but analogy that contradicts a text is void.',
      ru: 'Распространение решения случая, упомянутого в тексте, на новый случай из-за общей причины («илля»): например, всякий опьяняющий напиток запрещён, как вино. У Ахль ас-Сунна правильный кыяс — довод, но кыяс вопреки тексту недействителен.',
      ar: 'إلحاق فرع لا نص فيه بأصل منصوص على حكمه لعلة جامعة بينهما، كتحريم كل مسكر قياسًا على الخمر. والقياس الصحيح حجة عند أهل السنة، والقياس المخالف للنص فاسد الاعتبار.',
      tr: 'Hakkında açık nas bulunmayan meseleyi ortak sebep (illet) nedeniyle hükmü nasta bulunan meseleye bağlamak: örneğin her sarhoş edicinin şarap gibi haram olması. Ehl-i Sünnet\'e göre sahih kıyas delildir; nassa aykırı kıyas ise batıldır.',
    },
    rel: ['usul-al-fiqh', 'ijma', 'ijtihad'],
  },
  {
    term: 'İctihad', ar: 'الاجتهاد', translit: 'Ijtihad', cat: 'fiqh',
    def: {
      az: 'Şərtlərinə malik alimin şəri hökmü dəlillərdən çıxarmaq üçün bütün gücünü sərf etməsi. Peyğəmbər ﷺ buyurub: «Hakim ictihad edib düz tapsa, ona iki savab, ictihad edib səhv etsə, bir savab var» (Buxari 7352). Açıq nəss olan yerdə ictihad olmaz.',
      en: 'A qualified scholar exerting full effort to derive a ruling from the evidence. The Prophet ﷺ said: «When a judge strives and is right, he has two rewards; when he strives and errs, he has one reward» (Bukhari 7352). There is no ijtihad against a clear text.',
      ru: 'Приложение учёным, обладающим нужными качествами, всех сил для выведения решения из доводов. Пророк ﷺ сказал: «Если судья приложил усилие и оказался прав, ему две награды, а если ошибся — одна» (Бухари 7352). При наличии ясного текста иджтихада нет.',
      ar: 'بذل العالم المؤهَّل وسعه في استنباط الحكم الشرعي من أدلته. قال ﷺ: «إذا حكم الحاكم فاجتهد ثم أصاب فله أجران، وإذا حكم فاجتهد ثم أخطأ فله أجر» (البخاري 7352). ولا اجتهاد مع النص.',
      tr: 'Şartlarını taşıyan âlimin şer\'î hükmü delillerden çıkarmak için bütün gücünü harcaması. Peygamber ﷺ şöyle buyurdu: «Hâkim içtihat edip isabet ederse iki sevap, içtihat edip hata ederse bir sevap alır» (Buhari 7352). Açık nas varken içtihat olmaz.',
    },
    rel: ['taqlid', 'qiyas', 'madhhab', 'fatwa'],
  },
  {
    term: 'Təqlid', ar: 'التقليد', translit: 'Taqlid', cat: 'fiqh',
    def: {
      az: 'Bir alimin sözünü dəlilini bilmədən qəbul etmək. Dəlili qiymətləndirə bilməyən avam üçün etibarlı alimə sual verib əməl etmək caizdir: «Bilmirsinizsə, zikr əhlindən soruşun» (Nəhl 16:43). Lakin haqq açıq dəlillə bəlli olduqdan sonra kiməsə kor-koranə tabe olmaq qınanmışdır.',
      en: 'Accepting a scholar\'s view without knowing its evidence. For a layman who cannot weigh the evidence it is permitted to ask a trustworthy scholar and act on it: «Ask the people of knowledge if you do not know» (An-Nahl 16:43). But partisan adherence to anyone after the truth has become clear from the evidence is blameworthy.',
      ru: 'Принятие мнения учёного без знания его довода. Простому человеку, не способному оценить доводы, дозволено спросить надёжного учёного и следовать ответу: «Спросите обладающих знанием, если сами не знаете» (ан-Нахль 16:43). Но фанатичное следование кому-либо вопреки ясному доводу порицается.',
      ar: 'قبول قول العالم من غير معرفة دليله. ويجوز للعامي العاجز عن النظر في الأدلة أن يسأل عالمًا ثقة ويعمل بفتواه: ﴿فَسْـَٔلُوٓا۟ أَهْلَ ٱلذِّكْرِ إِن كُنتُمْ لَا تَعْلَمُونَ﴾ (النحل: 43). أما التعصب لقول أحد بعد ظهور الدليل فمذموم.',
      tr: 'Bir âlimin sözünü delilini bilmeden kabul etmek. Delili değerlendiremeyen avamın güvenilir bir âlime sorup amel etmesi caizdir: «Bilmiyorsanız zikir ehline sorun» (Nahl 16:43). Ancak hak açık delille ortaya çıktıktan sonra birine taassupla bağlanmak kınanmıştır.',
    },
    rel: ['ittiba', 'ijtihad', 'madhhab', 'fatwa'],
  },
  {
    term: 'İttiba', ar: 'الاتباع', translit: 'Ittiba\'', cat: 'fiqh',
    def: {
      az: 'Dəlilə — Quran və Sünnəyə — Sələfin anladığı kimi tabe olmaq, sözü dəlili ilə qəbul etmək. «Rəbbinizdən sizə nazil edilənə tabe olun» (Əraf 7:3). İttibanın əksi həm kor-koranə təqlid, həm də bidətdir.',
      en: 'Following the evidence — the Quran and the Sunnah as understood by the Salaf — and accepting a view together with its proof. «Follow what has been sent down to you from your Lord» (Al-A\'raf 7:3). Its opposites are partisan taqlid and innovation.',
      ru: 'Следование доводу — Корану и Сунне в понимании саляфов, принятие мнения вместе с его доказательством. «Следуйте тому, что ниспослано вам от вашего Господа» (аль-А‘раф 7:3). Противоположность — фанатичный таклид и нововведение.',
      ar: 'اتباع الدليل من الكتاب والسنة بفهم السلف، وقبول القول بحجته. ﴿ٱتَّبِعُوا۟ مَآ أُنزِلَ إِلَيْكُم مِّن رَّبِّكُمْ﴾ (الأعراف: 3). ويضاده التقليد المذموم والابتداع.',
      tr: 'Delile — Selef\'in anladığı şekilde Kur\'an ve Sünnet\'e — uymak, sözü deliliyle kabul etmek. «Rabbinizden size indirilene uyun» (A\'râf 7:3). Zıddı taassupçu taklit ve bidattir.',
    },
    rel: ['taqlid', 'sunnah', 'bidah', 'salaf'],
    lesson: 'bidah',
  },
  {
    term: 'Məzhəb', ar: 'المذهب', translit: 'Madhhab', cat: 'fiqh',
    def: {
      az: 'Bir imamın və tələbələrinin fiqhdə tutduğu yol; tanınmışları Hənəfi, Maliki, Şafii və Hənbəli məzhəbləridir. Dörd imam hörmətlə anılır və onların hər biri sözünün dəlilə zidd olduğu yerdə dəlilə tabe olmağı tövsiyə edib.',
      en: 'The school of an imam and his students in fiqh; the best known are the Hanafi, Maliki, Shafi\'i and Hanbali schools. The four imams are respected, and each of them advised following the evidence wherever his own view contradicted it.',
      ru: 'Путь имама и его учеников во фикхе; наиболее известны ханафитский, маликитский, шафиитский и ханбалитский мазхабы. Четыре имама почитаются, и каждый из них велел следовать доводу там, где его слово ему противоречит.',
      ar: 'طريقة الإمام وأصحابه في الفقه، وأشهرها: الحنفي والمالكي والشافعي والحنبلي. والأئمة الأربعة محترمون، وكلٌّ منهم أوصى بترك قوله إذا خالف الدليل.',
      tr: 'Bir imamın ve talebelerinin fıkıhtaki yolu; en bilinenleri Hanefi, Maliki, Şafii ve Hanbeli mezhepleridir. Dört imama saygı gösterilir; her biri kendi sözünün delile aykırı olduğu yerde delile uyulmasını tavsiye etmiştir.',
    },
    rel: ['fiqh', 'taqlid', 'ittiba', 'ijtihad'],
  },
  {
    term: 'Fətva', ar: 'الفتوى', translit: 'Fatwa', cat: 'fiqh',
    def: {
      az: 'Alimin soruşulan məsələ üzrə şəri hökmü dəlilinə əsasən bəyan etməsi. Fətva yalnız bilikli və təqvalı alimdən alınır; bilmədən fətva vermək Allaha qarşı yalan danışmaq kimi böyük günahdır.',
      en: 'A scholar\'s statement of the Islamic ruling on a question asked, based on its evidence. Fatwas are taken only from knowledgeable and God-fearing scholars; giving rulings without knowledge is a grave sin, like speaking about Allah without knowledge.',
      ru: 'Разъяснение учёным шариатского решения по заданному вопросу на основе доводов. Фетву берут лишь у знающего и богобоязненного учёного; выносить решения без знания — тяжкий грех, подобный речам об Аллахе без знания.',
      ar: 'بيان العالم الحكم الشرعي لمن سأل عنه بدليله. ولا تؤخذ الفتوى إلا من عالم تقي، والفتيا بغير علم من القول على الله بلا علم، وهو من كبائر الذنوب.',
      tr: 'Âlimin sorulan meseledeki şer\'î hükmü deliline dayanarak açıklaması. Fetva yalnız ilim ve takva sahibi âlimden alınır; bilmeden fetva vermek Allah hakkında bilgisizce konuşmak gibi büyük bir günahtır.',
    },
    rel: ['ijtihad', 'taqlid', 'madhhab'],
    lesson: 'fiqh-faq',
  },
  {
    term: 'Şəriətin məqsədləri', ar: 'مقاصد الشريعة', translit: 'Maqasid ash-Shari\'ah', cat: 'fiqh',
    def: {
      az: 'Şəriətin hökmləri ilə qorunan əsas məqsədlər: din, can, ağıl, nəsil və mal. Məqsədlər nəsslərdən çıxarılır və nəsslərə tabedir; onları bəhanə edib açıq hökmləri tərk etmək olmaz.',
      en: 'The higher objectives protected by the rulings of the Shari\'ah: religion, life, intellect, lineage and property. They are drawn from the texts and remain subordinate to them; they may not be used as a pretext for setting clear rulings aside.',
      ru: 'Высшие цели, охраняемые решениями шариата: религия, жизнь, разум, потомство и имущество. Они выводятся из текстов и подчинены им; ими нельзя оправдывать отказ от ясных решений.',
      ar: 'الغايات التي جاءت الشريعة بحفظها: الدين والنفس والعقل والنسل والمال. وهي مستنبطة من النصوص وتابعة لها، فلا يجوز جعلها ذريعة لترك الأحكام الصريحة.',
      tr: 'Şeriatın hükümleriyle korunan temel amaçlar: din, can, akıl, nesil ve mal. Bu amaçlar naslardan çıkarılır ve naslara tabidir; açık hükümleri terk etmek için bahane edilemez.',
    },
    rel: ['usul-al-fiqh', 'darurah', 'sadd-adh-dharai'],
  },
  {
    term: 'Zərurət', ar: 'الضرورة', translit: 'Darurah', cat: 'fiqh',
    def: {
      az: 'İnsanın haramı etməsə canını, sağlamlığını və ya digər zəruri məqsədi itirəcəyi vəziyyət. Belə halda haram ehtiyac qədər mübah olur: «Kim çarəsiz qalsa, həddi aşmadan və zülm etmədən... ona günah yoxdur» (Bəqərə 2:173). Zərurət öz ölçüsü ilə qiymətləndirilir.',
      en: 'A situation in which a person would lose life, health or another essential interest unless he does something forbidden. Then the forbidden becomes allowed to the extent needed: «But whoever is compelled, neither desiring it nor transgressing, there is no sin on him» (Al-Baqarah 2:173). Necessity is measured by its extent.',
      ru: 'Состояние, при котором человек потеряет жизнь, здоровье или иное насущное благо, если не совершит запретное. Тогда запретное дозволено в меру нужды: «А если кто вынужден, не будучи ни жаждущим, ни преступающим, на нём нет греха» (аль-Бакара 2:173). Крайность оценивается по её мере.',
      ar: 'حالة يُخشى فيها هلاك النفس أو ضرر بالغ بأحد الضروريات إن لم يُرتكب المحرم، فيباح بقدرها: ﴿فَمَنِ ٱضْطُرَّ غَيْرَ بَاغٍ وَلَا عَادٍ فَلَآ إِثْمَ عَلَيْهِ﴾ (البقرة: 173). والضرورة تُقدَّر بقدرها.',
      tr: 'Haramı işlemediği takdirde kişinin canını, sağlığını veya başka zaruri bir amacı kaybedeceği durum. O zaman haram ihtiyaç ölçüsünde mubah olur: «Kim çaresiz kalırsa, istekli olmadan ve haddi aşmadan... ona günah yoktur» (Bakara 2:173). Zaruret kendi ölçüsünce takdir edilir.',
    },
    rel: ['rukhsah', 'haram', 'maqasid-ash-shariah'],
  },
  {
    term: 'Ruxsət', ar: 'الرخصة', translit: 'Rukhsah', cat: 'fiqh',
    def: {
      az: 'Üzr səbəbi ilə əsas (əzimət) hökmün yüngülləşdirilməsi: səfərdə namazı qısaltmaq, xəstə və müsafirin orucu sonra tutması, xəstənin oturaraq namaz qılması. «Allah sizin üçün asanlıq istəyir, çətinlik istəmir» (Bəqərə 2:185).',
      en: 'An easing of the original ruling (\'azimah) because of an excuse: shortening prayers when travelling, the sick and the traveller making up fasts later, a sick person praying seated. «Allah intends ease for you and does not intend hardship» (Al-Baqarah 2:185).',
      ru: 'Облегчение исходного решения («азима») из-за уважительной причины: сокращение молитвы в пути, восполнение поста больным и путником позже, молитва больного сидя. «Аллах желает вам облегчения и не желает вам затруднения» (аль-Бакара 2:185).',
      ar: 'تخفيف الحكم الأصلي (العزيمة) لعذر، كقصر الصلاة في السفر، وفطر المريض والمسافر مع القضاء، وصلاة المريض قاعدًا. ﴿يُرِيدُ ٱللَّهُ بِكُمُ ٱلْيُسْرَ وَلَا يُرِيدُ بِكُمُ ٱلْعُسْرَ﴾ (البقرة: 185).',
      tr: 'Bir mazeret nedeniyle asıl (azimet) hükmün hafifletilmesi: yolculukta namazı kısaltmak, hasta ve yolcunun orucu sonra kaza etmesi, hastanın oturarak namaz kılması. «Allah sizin için kolaylık ister, zorluk istemez» (Bakara 2:185).',
    },
    rel: ['darurah', 'qasr', 'jam'],
    lesson: 'sick-fiqh',
  },
  {
    term: 'Şərt', ar: 'الشرط', translit: 'Shart', cat: 'fiqh',
    def: {
      az: 'İbadətin və ya əqdin düzgünlüyü ondan asılı olan, lakin onun içindən olmayan şey: məsələn, namaz üçün dəstəmaz, vaxtın girməsi və qibləyə yönəlmək. Şərt olmasa, əməl səhih olmur.',
      en: 'Something on which the validity of an act of worship or a contract depends but which lies outside it: e.g. for prayer — purification, the time having begun, and facing the qiblah. Without it the act is not valid.',
      ru: 'То, от чего зависит действительность поклонения или договора, но что не входит в его состав: например, для молитвы — очищение, наступление времени и обращение к кибле. Без условия действие недействительно.',
      ar: 'ما يتوقف عليه صحة العبادة أو العقد وهو خارج عن ماهيته، كالطهارة ودخول الوقت واستقبال القبلة للصلاة. فإذا انعدم الشرط لم يصح العمل.',
      tr: 'İbadetin veya akdin geçerliliğinin bağlı olduğu, ancak onun içinde yer almayan şey: örneğin namaz için abdest, vaktin girmesi ve kıbleye yönelmek. Şart yoksa amel sahih olmaz.',
    },
    rel: ['rukn', 'batil', 'tahara'],
  },
  {
    term: 'Rükn', ar: 'الركن', translit: 'Rukn', cat: 'fiqh',
    def: {
      az: 'İbadətin və ya əqdin özünü təşkil edən əsas hissə: məsələn, namazda təkbiratul-ehram, Fatihə, rüku və səcdə; həccdə Ərəfədə durmaq. Rükn unudularaq da tərk edilsə, əvəzi gətirilməlidir, əks halda əməl batildir.',
      en: 'An essential part that makes up an act of worship or a contract: e.g. in prayer the opening takbir, Al-Fatihah, bowing and prostration; in Hajj standing at Arafah. If a pillar is omitted, even by forgetting, it must be made up, otherwise the act is void.',
      ru: 'Основная составная часть поклонения или договора: например, в молитве — вступительный такбир, аль-Фатиха, поясной и земной поклоны; в хадже — стояние на Арафате. Если столп упущен даже по забывчивости, его нужно восполнить, иначе действие недействительно.',
      ar: 'جزء الشيء الذي لا يقوم إلا به، كتكبيرة الإحرام والفاتحة والركوع والسجود في الصلاة، والوقوف بعرفة في الحج. ومن ترك ركنًا ولو سهوًا لزمه الإتيان به وإلا بطل العمل.',
      tr: 'İbadetin veya akdin kendisini oluşturan temel parça: örneğin namazda iftitah tekbiri, Fâtiha, rükû ve secde; hacda Arafat\'ta vakfe. Rükün unutularak da terk edilse yerine getirilmelidir, aksi halde amel batıldır.',
    },
    rel: ['shart', 'batil', 'takbirat-al-ihram', 'arafah'],
  },
  {
    term: 'Batil', ar: 'الباطل', translit: 'Batil', cat: 'fiqh',
    def: {
      az: 'Şərti və ya rükni pozulduğu üçün etibarsız olan ibadət və ya əqd; ondan şəri nəticə çıxmır. Peyğəmbər ﷺ buyurub: «Kim bizim işimizə uyğun olmayan bir əməl etsə, o, rədd edilir» (Müslim 1718).',
      en: 'An act of worship or a contract that is invalid because a condition or pillar is missing; it has no legal effect. The Prophet ﷺ said: «Whoever does a deed not in accordance with our matter, it is rejected» (Muslim 1718).',
      ru: 'Поклонение или договор, недействительные из-за нарушения условия или столпа; они не влекут шариатских последствий. Пророк ﷺ сказал: «Кто совершит дело, не соответствующее нашему делу, оно будет отвергнуто» (Муслим 1718).',
      ar: 'ما لا يترتب عليه أثره الشرعي من عبادة أو عقد لاختلال شرط أو ركن. قال ﷺ: «من عمل عملًا ليس عليه أمرنا فهو رد» (مسلم 1718).',
      tr: 'Şartı veya rüknü bozulduğu için geçersiz olan ibadet ya da akit; ondan şer\'î sonuç doğmaz. Peygamber ﷺ şöyle buyurdu: «Kim bizim işimize uygun olmayan bir amel işlerse o reddedilir» (Müslim 1718).',
    },
    rel: ['shart', 'rukn', 'bidah'],
  },
  {
    term: 'Ürf', ar: 'العرف', translit: 'Urf', cat: 'fiqh',
    def: {
      az: 'İnsanlar arasında yayılmış adət və anlayış. Şəriət ölçü qoymadığı yerlərdə (məsələn, nəfəqənin miqdarı, ticarətdə qəbul olunmuş qaydalar) ürfə müraciət edilir; nəssə zidd olan ürf isə nəzərə alınmır.',
      en: 'Custom and common usage among people. Where the Shari\'ah sets no measure (e.g. the amount of maintenance, accepted trade practices), custom is referred to; custom that contradicts a text is disregarded.',
      ru: 'Обычай и общепринятое понимание среди людей. Там, где шариат не установил меры (например, размер содержания, принятые торговые правила), опираются на обычай; обычай, противоречащий тексту, не учитывается.',
      ar: 'ما تعارف عليه الناس واعتادوه. ويُرجع إليه فيما لم يحدّه الشرع، كقدر النفقة وأعراف البيع، أما العرف المخالف للنص فلا اعتبار له.',
      tr: 'İnsanlar arasında yaygın olan âdet ve anlayış. Şeriatın ölçü koymadığı yerlerde (örneğin nafakanın miktarı, ticarette kabul gören kurallar) örfe başvurulur; nassa aykırı örf ise dikkate alınmaz.',
    },
    rel: ['usul-al-fiqh', 'nafaqah', 'bay'],
  },
  {
    term: 'Səddüz-zəraye', ar: 'سد الذرائع', translit: 'Sadd adh-Dhara\'i\'', cat: 'fiqh',
    def: {
      az: 'Özü mübah olsa da, çox vaxt harama aparan yolu bağlamaq. Məsələn, naməhrəm qadın və kişinin təklikdə qalmasının qadağan edilməsi zinaya aparan yolu bağlayır. Səddüz-zəraye Sələf fiqhinin mühüm qaydalarındandır.',
      en: 'Blocking the means that, though permissible in themselves, commonly lead to the forbidden. E.g. the prohibition of a man and a non-mahram woman being alone together blocks a path to fornication. It is an important principle in the fiqh of the Salaf.',
      ru: 'Перекрытие путей, которые сами по себе дозволены, но обычно ведут к запретному. Например, запрет уединения мужчины с чужой женщиной перекрывает путь к прелюбодеянию. Это важное правило фикха саляфов.',
      ar: 'منع الوسائل المباحة في أصلها إذا كانت تفضي غالبًا إلى المحرم، كتحريم خلوة الرجل بالأجنبية سدًّا لذريعة الفاحشة. وهو من القواعد المعتبرة في فقه السلف.',
      tr: 'Kendisi mubah olsa da çoğunlukla harama götüren yolu kapatmak. Örneğin namahrem erkek ve kadının baş başa kalmasının yasaklanması zinaya giden yolu kapatır. Seddü\'z-zerâi Selef fıkhının önemli kurallarındandır.',
    },
    rel: ['khalwah', 'maqasid-ash-shariah', 'haram'],
  },
  {
    term: 'Mükəlləf', ar: 'المكلف', translit: 'Mukallaf', cat: 'fiqh',
    def: {
      az: 'Şəri hökmlərlə yükümlü olan insan: müsəlman, həddi-büluğa çatmış və ağıllı. Uşaq və dəli mükəlləf deyil; unutqanlıq, xəta və məcburiyyət halında günah götürülür.',
      en: 'A person bound by the rulings of the Shari\'ah: a Muslim who has reached puberty and is sane. Children and the insane are not accountable, and sin is lifted in cases of forgetfulness, mistake and coercion.',
      ru: 'Человек, обязанный исполнять шариатские предписания: мусульманин, достигший зрелости и находящийся в здравом уме. Ребёнок и умалишённый не обязаны; грех снимается при забывчивости, ошибке и принуждении.',
      ar: 'من تلزمه الأحكام الشرعية: المسلم البالغ العاقل. فلا تكليف على الصبي والمجنون، ويُرفع الإثم في النسيان والخطأ والإكراه.',
      tr: 'Şer\'î hükümlerle yükümlü olan kişi: Müslüman, ergenliğe ulaşmış ve akıllı. Çocuk ve akıl hastası mükellef değildir; unutma, hata ve zorlama durumunda günah kalkar.',
    },
    rel: ['fard', 'shart', 'niyyah'],
  },
  {
    term: 'Riba', ar: 'الربا', translit: 'Riba', cat: 'fiqh',
    def: {
      az: 'Sələm: borcda şərt qoyulan hər artıq və eyni cinsdən olan riba mallarının (qızıl, gümüş, buğda və s.) artıqla və ya möhlətlə dəyişdirilməsi. Böyük günahlardandır: «Allah alış-verişi halal, ribanı haram etmişdir» (Bəqərə 2:275). Bank faizi də buna daxildir.',
      en: 'Usury: any stipulated increase on a loan, and exchanging ribawi goods of the same kind (gold, silver, wheat, etc.) with surplus or delay. It is a major sin: «Allah has permitted trade and forbidden riba» (Al-Baqarah 2:275). Bank interest falls under it.',
      ru: 'Ростовщичество: любая оговорённая прибавка к долгу, а также обмен однородных ростовщических товаров (золото, серебро, пшеница и др.) с излишком или отсрочкой. Один из тяжких грехов: «Аллах дозволил торговлю и запретил ростовщичество» (аль-Бакара 2:275). Банковский процент относится к нему.',
      ar: 'كل زيادة مشروطة في القرض، وبيع الأموال الربوية من جنس واحد كالذهب والفضة والبر متفاضلًا أو نسيئة. وهو من الكبائر: ﴿وَأَحَلَّ ٱللَّهُ ٱلْبَيْعَ وَحَرَّمَ ٱلرِّبَوٰا۟﴾ (البقرة: 275)، ومنه فوائد البنوك.',
      tr: 'Faiz: borçta şart koşulan her fazlalık ve aynı cins ribevî malların (altın, gümüş, buğday vb.) fazlalıkla veya vadeli değiştirilmesi. Büyük günahlardandır: «Allah alışverişi helal, faizi haram kıldı» (Bakara 2:275). Banka faizi de buna girer.',
    },
    rel: ['bay', 'qard', 'gharar', 'haram'],
  },
  {
    term: 'Ğərər', ar: 'الغرر', translit: 'Gharar', cat: 'fiqh',
    def: {
      az: 'Alış-verişdə nəticəsi bilinməyən, aldadıcı qeyri-müəyyənlik: məsələn, hələ tutulmamış balığı və ya qaçmış heyvanı satmaq. Peyğəmbər ﷺ ğərərli alış-verişi qadağan edib (Müslim 1513). Kiçik, qaçılmaz qeyri-müəyyənlik bağışlanır.',
      en: 'Excessive uncertainty or deception in a sale, where the outcome is unknown: e.g. selling fish not yet caught or a runaway animal. The Prophet ﷺ forbade sales involving gharar (Muslim 1513). Minor, unavoidable uncertainty is overlooked.',
      ru: 'Чрезмерная неопределённость или обман в сделке, когда исход неизвестен: например, продажа ещё не пойманной рыбы или сбежавшего животного. Пророк ﷺ запретил сделки с гараром (Муслим 1513). Мелкая неизбежная неопределённость прощается.',
      ar: 'الجهالة والمخاطرة في البيع التي لا يُدرى عاقبتها، كبيع السمك في الماء والدابة الشاردة. وقد «نهى رسول الله ﷺ عن بيع الغرر» (مسلم 1513)، ويُعفى عن الغرر اليسير الذي لا يمكن التحرز منه.',
      tr: 'Alışverişte sonucu bilinmeyen, aldatıcı belirsizlik: örneğin henüz tutulmamış balığı veya kaçmış hayvanı satmak. Peygamber ﷺ garar satışını yasaklamıştır (Müslim 1513). Küçük ve kaçınılmaz belirsizlik affedilir.',
    },
    rel: ['bay', 'riba', 'batil'],
  },
  {
    term: 'Alış-veriş', ar: 'البيع', translit: 'Bay\'', cat: 'fiqh',
    def: {
      az: 'Malın mal ilə qarşılıqlı razılıqla mülkiyyətə keçirilməsi. Əsli halaldır; razılıq, satılan malın məlum və təhvil verilə bilən olması kimi şərtləri var, riba, ğərər və aldatma onu pozur.',
      en: 'Exchanging property for property with mutual consent, transferring ownership. It is lawful in principle; its conditions include consent and the goods being known and deliverable, while riba, gharar and fraud corrupt it.',
      ru: 'Обмен имущества на имущество по взаимному согласию с переходом права собственности. В основе дозволен; условия — согласие сторон, известность товара и возможность его передачи; ростовщичество, гарар и обман его портят.',
      ar: 'مبادلة مال بمال على وجه التمليك بالتراضي. والأصل فيه الحل، ومن شروطه التراضي وكون المبيع معلومًا مقدورًا على تسليمه، ويفسده الربا والغرر والغش.',
      tr: 'Malın malla karşılıklı rızayla mülkiyete geçirilmesi. Aslı helaldir; rıza, satılan malın belli ve teslim edilebilir olması gibi şartları vardır; faiz, garar ve hile onu bozar.',
    },
    rel: ['riba', 'gharar', 'urf'],
  },
  {
    term: 'Qərz', ar: 'القرض', translit: 'Qard', cat: 'fiqh',
    def: {
      az: 'Ehtiyacı olana mal verib sonra onun mislini geri almaq — yaxşılıq və savab əməlidir. Borca şərt qoyulmuş hər hansı artıq və ya mənfəət ribadır; borcu yazmaq və vaxtında qaytarmaq tövsiyə olunur.',
      en: 'Giving property to someone in need to be repaid with its equivalent later — an act of kindness that earns reward. Any stipulated increase or benefit on a loan is riba; writing the debt down and repaying it on time are encouraged.',
      ru: 'Передача имущества нуждающемуся с последующим возвратом равноценного — благодеяние, за которое есть награда. Любая оговорённая прибавка или выгода по займу — ростовщичество; долг рекомендуется записывать и возвращать вовремя.',
      ar: 'دفع مال لمن ينتفع به ويردّ بدله، وهو من الإحسان المأجور عليه. وكل قرض شُرط فيه زيادة أو منفعة فهو ربا، ويُستحب توثيق الدين والوفاء به في وقته.',
      tr: 'İhtiyacı olana mal verip sonra mislini geri almak — sevaplı bir iyiliktir. Borca şart koşulan her fazlalık veya menfaat faizdir; borcu yazmak ve vaktinde ödemek tavsiye edilir.',
    },
    rel: ['riba', 'bay', 'sadaqah'],
  },
  {
    term: 'Hədd', ar: 'الحدود', translit: 'Hudud', cat: 'fiqh',
    def: {
      az: 'Allahın haqqı kimi miqdarı şəriətdə müəyyən edilmiş cəzalar: zina, zina böhtanı, oğurluq, məstedici içki, yol kəsmə və s. üçün. Hədd yalnız qəti sübutla, şərtləri tam olduqda və yalnız qanuni hakimiyyət (məhkəmə) tərəfindən tətbiq olunur; fərdlərin onu icra etməsi caiz deyil.',
      en: 'Punishments fixed by the Shari\'ah as the right of Allah: for fornication, false accusation of it, theft, intoxicants, highway robbery, etc. They are applied only with conclusive proof, when all conditions are met, and only by the legitimate authority (court); individuals may not carry them out.',
      ru: 'Наказания, мера которых установлена шариатом как право Аллаха: за прелюбодеяние, ложное обвинение в нём, кражу, опьяняющее, разбой и др. Применяются лишь при неопровержимом доказательстве и соблюдении всех условий и только законной властью (судом); отдельным людям исполнять их нельзя.',
      ar: 'عقوبات مقدّرة شرعًا حقًّا لله، كحدّ الزنا والقذف والسرقة والخمر والحرابة. ولا تقام إلا بثبوت قاطع واستيفاء الشروط، ويقيمها وليّ الأمر أو القضاء، لا آحاد الناس.',
      tr: 'Allah\'ın hakkı olarak miktarı şeriatta belirlenmiş cezalar: zina, zina iftirası, hırsızlık, sarhoş edici, yol kesme vb. için. Had yalnız kesin delille, şartlar tam olduğunda ve yalnız meşru yönetim (mahkeme) tarafından uygulanır; fertlerin uygulaması caiz değildir.',
    },
    rel: ['qisas', 'tazir', 'diyah'],
  },
  {
    term: 'Qisas', ar: 'القصاص', translit: 'Qisas', cat: 'fiqh',
    def: {
      az: 'Qəsdən öldürmə və ya yaralamada cinayətkara eyni ilə cavab vermək (Bəqərə 2:178). Zərərçəkənin və ya varislərinin haqqıdır: onlar bağışlaya və ya diyə ala bilərlər. Qisas yalnız məhkəmə qərarı ilə hakimiyyət tərəfindən icra olunur.',
      en: 'Equal retribution for intentional killing or wounding (Al-Baqarah 2:178). It is the right of the victim or his heirs, who may pardon or accept blood money instead. It is carried out only by the authorities through a court ruling.',
      ru: 'Равное возмездие за умышленное убийство или ранение (аль-Бакара 2:178). Это право потерпевшего или его наследников: они могут простить или принять выкуп. Кысас исполняется только властью по решению суда.',
      ar: 'معاقبة الجاني بمثل فعله في القتل العمد والجراح (البقرة: 178). وهو حق للمجني عليه أو أوليائه، فلهم العفو أو أخذ الدية، ولا يستوفيه إلا السلطان بحكم القضاء.',
      tr: 'Kasten öldürme veya yaralamada suçluya aynısıyla karşılık vermek (Bakara 2:178). Mağdurun veya varislerinin hakkıdır: affedebilir ya da diyet alabilirler. Kısas yalnız mahkeme kararıyla yönetim tarafından uygulanır.',
    },
    rel: ['diyah', 'hudud', 'tazir'],
  },
  {
    term: 'Diyə', ar: 'الدية', translit: 'Diyah', cat: 'fiqh',
    def: {
      az: 'Qətl və ya bədənə vurulan zərər üçün zərərçəkənə və ya varislərinə ödənən mal (qan pulu). Səhvən öldürmədə vacibdir, qəsdən öldürmədə isə varislər qisası bağışlayıb diyə ala bilərlər.',
      en: 'Financial compensation (blood money) paid to the victim or his heirs for killing or bodily injury. It is due for accidental killing, and in intentional killing the heirs may waive retribution and accept it.',
      ru: 'Имущественное возмещение (выкуп за кровь), выплачиваемое потерпевшему или его наследникам за убийство или телесное повреждение. Обязательно при неумышленном убийстве, а при умышленном наследники могут отказаться от возмездия и принять его.',
      ar: 'المال المؤدّى إلى المجني عليه أو أوليائه بسبب القتل أو الجناية على ما دون النفس. وتجب في قتل الخطأ، وفي العمد إن عفا الأولياء عن القصاص إلى الدية.',
      tr: 'Öldürme veya bedene verilen zarar için mağdura ya da varislerine ödenen mal (kan bedeli). Hata ile öldürmede vaciptir; kasten öldürmede ise varisler kısası bağışlayıp diyet alabilirler.',
    },
    rel: ['qisas', 'kaffarah', 'hudud'],
  },
  {
    term: 'Təzir', ar: 'التعزير', translit: 'Ta\'zir', cat: 'fiqh',
    def: {
      az: 'Şəriətdə miqdarı müəyyən edilməmiş günah və cinayətlərə görə hakimin ictihadı ilə təyin etdiyi tərbiyəvi cəza (xəbərdarlıq, cərimə, həbs və s.). Bunu da yalnız qanuni hakimiyyət tətbiq edir.',
      en: 'A discretionary corrective punishment set by the judge for sins and crimes with no fixed penalty (a warning, fine, imprisonment, etc.). It too is applied only by the legitimate authority.',
      ru: 'Воспитательное наказание за грехи и преступления без установленной меры, назначаемое судьёй по своему иджтихаду (предупреждение, штраф, заключение и др.). Его тоже применяет только законная власть.',
      ar: 'عقوبة تأديبية غير مقدّرة شرعًا على المعاصي والجنايات التي لا حدّ فيها، يقدّرها الحاكم باجتهاده كالتوبيخ والغرامة والحبس، ولا يقيمها إلا وليّ الأمر.',
      tr: 'Şeriatta miktarı belirlenmemiş günah ve suçlar için hâkimin içtihadıyla belirlediği terbiye edici ceza (uyarı, para cezası, hapis vb.). Bunu da yalnız meşru yönetim uygular.',
    },
    rel: ['hudud', 'qisas', 'ijtihad'],
  },
  {
    term: 'Kəffarə', ar: 'الكفارة', translit: 'Kaffarah', cat: 'fiqh',
    def: {
      az: 'Müəyyən günah və ya pozuntunu silmək üçün şəriətin təyin etdiyi əməl: qul azad etmək, oruc tutmaq, yoxsulları yedirtmək və ya geyindirmək. Məsələn, and pozmanın kəffarəsi on yoxsulu yedirtmək və ya geyindirməkdir, bacarmayan isə üç gün oruc tutur (Maidə 5:89).',
      en: 'An act prescribed by the Shari\'ah to expiate certain sins or violations: freeing a slave, fasting, feeding or clothing the poor. E.g. the expiation for a broken oath is feeding or clothing ten poor people, and whoever cannot do so fasts three days (Al-Ma\'idah 5:89).',
      ru: 'Действие, установленное шариатом для искупления определённых грехов и нарушений: освобождение раба, пост, кормление или одевание бедняков. Например, искупление нарушенной клятвы — накормить или одеть десять бедняков, а кто не может — поститься три дня (аль-Маида 5:89).',
      ar: 'ما شرعه الله لمحو ذنوب أو مخالفات معينة من عتق أو صيام أو إطعام أو كسوة. فكفارة اليمين إطعام عشرة مساكين أو كسوتهم أو تحرير رقبة، فمن لم يجد فصيام ثلاثة أيام (المائدة: 89).',
      tr: 'Belirli günah veya ihlalleri silmek için şeriatın belirlediği amel: köle azat etmek, oruç tutmak, fakirleri doyurmak veya giydirmek. Örneğin yemin kefareti on fakiri doyurmak veya giydirmektir; gücü yetmeyen üç gün oruç tutar (Mâide 5:89).',
    },
    rel: ['fidyah', 'yamin', 'zihar', 'nadhr'],
    lesson: 'kaffarah-fidyah',
  },
  {
    term: 'Fidyə', ar: 'الفدية', translit: 'Fidyah', cat: 'fiqh',
    def: {
      az: 'Bir ibadəti yerinə yetirə bilməyənin və ya onda pozuntuya yol verənin verdiyi əvəz. Məsələn, sağalması ümid edilməyən xəstə və orucu çəkə bilməyən qoca hər gün üçün bir yoxsulu yedirdir (Bəqərə 2:184); ehramda da bəzi pozuntulara görə fidyə vacibdir.',
      en: 'A compensation given by someone unable to perform an act of worship or who commits certain violations in it. E.g. the chronically ill with no hope of recovery and the elderly who cannot fast feed a poor person for each day (Al-Baqarah 2:184); fidyah is also due for some violations of ihram.',
      ru: 'Возмещение, которое даёт неспособный выполнить поклонение или допустивший в нём определённые нарушения. Например, неизлечимо больной и старик, не способный поститься, кормят бедняка за каждый день (аль-Бакара 2:184); фидья также обязательна за некоторые нарушения ихрама.',
      ar: 'بدل يؤدّيه العاجز عن العبادة أو المخلّ ببعض واجباتها، كالمريض الذي لا يُرجى برؤه والكبير العاجز عن الصوم يطعم عن كل يوم مسكينًا (البقرة: 184)، وتجب الفدية كذلك في بعض محظورات الإحرام.',
      tr: 'Bir ibadeti yerine getiremeyenin veya onda bazı ihlaller yapanın verdiği bedel. Örneğin iyileşme ümidi olmayan hasta ve oruca gücü yetmeyen yaşlı her gün için bir fakiri doyurur (Bakara 2:184); ihramdaki bazı ihlaller için de fidye vaciptir.',
    },
    rel: ['kaffarah', 'sawm', 'ihram'],
    lesson: 'kaffarah-fidyah',
  },
  {
    term: 'Məhrəm', ar: 'المحرم', translit: 'Mahram', cat: 'fiqh',
    def: {
      az: 'Qohumluq, süd qohumluğu və ya evlilik səbəbi ilə qadının əbədi olaraq evlənməsi haram olan kişi: ata, oğul, qardaş, əmi, dayı, qayınata və s. Qadının məhrəmi ilə təklikdə qalması və onunla səfərə çıxması caizdir.',
      en: 'A man whom a woman is permanently forbidden to marry because of blood ties, breastfeeding or marriage: father, son, brother, paternal and maternal uncle, father-in-law, etc. A woman may be alone with and travel with her mahram.',
      ru: 'Мужчина, брак с которым навсегда запрещён женщине из-за кровного родства, молочного родства или брака: отец, сын, брат, дядя по отцу и по матери, свёкор и др. Женщине дозволено оставаться наедине и путешествовать со своим махрамом.',
      ar: 'من يحرم على المرأة نكاحه على التأبيد بنسب أو رضاع أو مصاهرة، كالأب والابن والأخ والعم والخال وأبي الزوج. ويجوز لها الخلوة به والسفر معه.',
      tr: 'Akrabalık, süt akrabalığı veya evlilik sebebiyle kadının ebediyen evlenmesi haram olan erkek: baba, oğul, kardeş, amca, dayı, kayınpeder vb. Kadının mahremiyle baş başa kalması ve onunla yolculuğa çıkması caizdir.',
    },
    rel: ['khalwah', 'awrah', 'nikah'],
    lesson: 'nikah',
  },
  {
    term: 'Nikahda vəli', ar: 'ولي النكاح', translit: 'Wali an-Nikah', cat: 'fiqh',
    def: {
      az: 'Qadının nikahını bağlayan kişi qohum: atası, sonra babası, oğlu, qardaşı və s. Cumhura görə vəlisiz nikah səhih deyil: «Vəlisiz nikah yoxdur» (Əbu Davud 2085). Vəli qadının razılığı olmadan onu evləndirə bilməz.',
      en: 'The male guardian who contracts a woman\'s marriage: her father, then grandfather, son, brother, etc. According to the majority a marriage without a guardian is not valid: «There is no marriage except with a guardian» (Abu Dawud 2085). The guardian may not marry her off without her consent.',
      ru: 'Опекун-мужчина, заключающий брак женщины: её отец, затем дед, сын, брат и т. д. По мнению большинства учёных брак без опекуна недействителен: «Нет брака без опекуна» (Абу Дауд 2085). Опекун не может выдать её замуж без её согласия.',
      ar: 'القريب الذكر الذي يتولى عقد نكاح المرأة: أبوها ثم جدها ثم ابنها ثم أخوها ونحوهم. ولا يصح النكاح بلا وليّ عند الجمهور: «لا نكاح إلا بولي» (أبو داود 2085)، ولا يزوّجها بغير رضاها.',
      tr: 'Kadının nikâhını kıyan erkek akraba: babası, sonra dedesi, oğlu, kardeşi vb. Cumhura göre velisiz nikâh sahih değildir: «Velisiz nikâh yoktur» (Ebu Davud 2085). Veli kadını rızası olmadan evlendiremez.',
    },
    rel: ['nikah', 'mahr', 'mahram'],
    lesson: 'nikah',
  },
  {
    term: 'Övrət', ar: 'العورة', translit: 'Awrah', cat: 'fiqh',
    def: {
      az: 'Bədənin örtülməsi vacib olan hissəsi. Kişinin övrəti göbəklə diz arasıdır; qadın naməhrəm kişilərin yanında bədənini örtür. Övrəti örtmək namazın şərtlərindəndir.',
      en: 'The part of the body that must be covered. For a man it is between the navel and the knee; a woman covers her body in front of non-mahram men. Covering the awrah is a condition of prayer.',
      ru: 'Часть тела, которую обязательно покрывать. У мужчины — от пупка до колен; женщина покрывает тело перед мужчинами, не являющимися махрамами. Покрытие аурата — условие молитвы.',
      ar: 'ما يجب ستره من البدن. فعورة الرجل ما بين السرة والركبة، والمرأة تستر بدنها أمام الرجال الأجانب. وستر العورة من شروط الصلاة.',
      tr: 'Bedenin örtülmesi farz olan kısmı. Erkeğin avreti göbekle diz arasıdır; kadın namahrem erkeklerin yanında bedenini örter. Avreti örtmek namazın şartlarındandır.',
    },
    rel: ['hijab', 'shart', 'mahram'],
    lesson: 'hijab',
  },
  {
    term: 'Hicab', ar: 'الحجاب', translit: 'Hijab', cat: 'fiqh',
    def: {
      az: 'Müsəlman qadının naməhrəm kişilərdən bədənini və zinətini örtməsi — Quranla vacib edilmiş ibadətdir (Nur 24:31; Əhzab 33:59). Geyim geniş və qalın olmalı, bədəni nümayiş etdirməməli, özü diqqət cəlb edən bəzək olmamalıdır.',
      en: 'A Muslim woman covering her body and adornment from non-mahram men — an obligation established by the Quran (An-Nur 24:31; Al-Ahzab 33:59). The clothing should be loose and opaque, not display the body, and not be an eye-catching adornment in itself.',
      ru: 'Покрытие мусульманкой тела и украшений от мужчин, не являющихся махрамами, — обязанность, установленная Кораном (ан-Нур 24:31; аль-Ахзаб 33:59). Одежда должна быть свободной и плотной, не подчёркивать тело и сама не быть броским украшением.',
      ar: 'ستر المرأة المسلمة بدنها وزينتها عن الرجال الأجانب، وهو فريضة بنص القرآن (النور: 31؛ الأحزاب: 59). ويكون اللباس واسعًا صفيقًا لا يصف ولا يكون زينة في نفسه.',
      tr: 'Müslüman kadının namahrem erkeklerden bedenini ve ziynetini örtmesi — Kur\'an\'la farz kılınmış bir ibadettir (Nûr 24:31; Ahzâb 33:59). Elbise bol ve kalın olmalı, bedeni belli etmemeli ve kendisi dikkat çeken bir süs olmamalıdır.',
    },
    rel: ['awrah', 'mahram', 'haya'],
    lesson: 'hijab',
  },
  {
    term: 'Xəlvət', ar: 'الخلوة', translit: 'Khalwah', cat: 'fiqh',
    def: {
      az: 'Naməhrəm kişi ilə qadının başqalarının görmədiyi yerdə təkbətək qalması — haramdır. Peyğəmbər ﷺ buyurub: «Kişi qadınla yalnız məhrəmi yanında olduqda qalsın» (Buxari 5233).',
      en: 'A man and a non-mahram woman being alone together where no one else can see them — it is forbidden. The Prophet ﷺ said: «No man should be alone with a woman except in the presence of a mahram» (Bukhari 5233).',
      ru: 'Уединение мужчины и женщины, не являющихся махрамами, там, где их никто не видит, — запрещено. Пророк ﷺ сказал: «Пусть мужчина не остаётся наедине с женщиной, кроме как в присутствии махрама» (Бухари 5233).',
      ar: 'انفراد الرجل بالمرأة الأجنبية بحيث لا يراهما أحد، وهي محرمة. قال ﷺ: «لا يخلونّ رجل بامرأة إلا مع ذي محرم» (البخاري 5233).',
      tr: 'Namahrem erkek ve kadının başkalarının görmediği yerde baş başa kalması — haramdır. Peygamber ﷺ şöyle buyurdu: «Bir erkek, yanında mahremi olmadıkça bir kadınla baş başa kalmasın» (Buhari 5233).',
    },
    rel: ['mahram', 'sadd-adh-dharai', 'hijab'],
  },
  {
    term: 'Rəcə', ar: 'الرجعة', translit: 'Raj\'ah', cat: 'fiqh',
    def: {
      az: 'Birinci və ya ikinci talaqdan sonra, iddə bitməmiş, ərin yeni nikahsız arvadına qayıtması. «Talaq iki dəfədir; sonra ya yaxşılıqla saxlamaq, ya da gözəlliklə buraxmaq» (Bəqərə 2:229). Üçüncü talaqdan sonra rəcə yoxdur.',
      en: 'A husband taking back his wife without a new marriage contract after a first or second divorce, before her waiting period ends. «Divorce is twice; then either keep her honourably or release her with kindness» (Al-Baqarah 2:229). After a third divorce there is no raj\'ah.',
      ru: 'Возвращение мужем жены без нового брачного договора после первого или второго развода, пока не истёк её срок ожидания. «Развод допускается дважды, после чего надо либо удержать жену по-доброму, либо отпустить её с добром» (аль-Бакара 2:229). После третьего развода возврата нет.',
      ar: 'إعادة الزوج مطلقته طلاقًا رجعيًّا إلى عصمته في العدة بغير عقد جديد. ﴿ٱلطَّلَـٰقُ مَرَّتَانِ ۖ فَإِمْسَاكٌۢ بِمَعْرُوفٍ أَوْ تَسْرِيحٌۢ بِإِحْسَـٰنٍ﴾ (البقرة: 229)، ولا رجعة بعد الطلقة الثالثة.',
      tr: 'Birinci veya ikinci boşamadan sonra, iddet bitmeden, kocanın yeni nikâh olmadan eşine dönmesi. «Boşama iki keredir; sonrası ya iyilikle tutmak ya da güzellikle bırakmaktır» (Bakara 2:229). Üçüncü boşamadan sonra ric\'at yoktur.',
    },
    rel: ['talaq', 'iddah', 'khula'],
  },
  {
    term: 'Zihar', ar: 'الظهار', translit: 'Zihar', cat: 'fiqh',
    def: {
      az: 'Ərin arvadını anasına və ya əbədi məhrəminə bənzədərək özünə haram etməsi («Sən mənə anamın kürəyi kimisən»). Cahiliyyə adəti idi; Quran onu çirkin söz adlandırıb (Mücadilə 58:2), ər arvadına yaxınlaşmazdan əvvəl kəffarə verməlidir.',
      en: 'A husband declaring his wife unlawful to himself by likening her to his mother or another permanent mahram («You are to me like my mother\'s back»). It was a pre-Islamic practice; the Quran calls it a reprehensible saying (Al-Mujadilah 58:2), and the husband must give expiation before touching her.',
      ru: 'Запрещение мужем жены для себя путём уподобления её матери или другой вечной махрам («Ты для меня как спина моей матери»). Это обычай джахилии; Коран называет это мерзкими словами (аль-Муджадаля 58:2), и муж обязан дать искупление прежде, чем приблизиться к ней.',
      ar: 'تشبيه الزوج زوجته بأمه أو بمن تحرم عليه على التأبيد، كقوله: أنتِ عليّ كظهر أمي. وكان من عادات الجاهلية، وسماه القرآن منكرًا من القول وزورًا (المجادلة: 2)، وتجب الكفارة قبل المسيس.',
      tr: 'Kocanın eşini annesine veya ebedî mahremine benzeterek kendine haram kılması («Sen bana annemin sırtı gibisin»). Cahiliye âdetiydi; Kur\'an onu çirkin bir söz olarak niteler (Mücâdele 58:2) ve koca eşine yaklaşmadan önce kefaret vermelidir.',
    },
    rel: ['kaffarah', 'talaq', 'jahiliyyah'],
  },
  {
    term: 'Nəzir', ar: 'النذر', translit: 'Nadhr', cat: 'fiqh',
    def: {
      az: 'Mükəlləfin şəriətin vacib etmədiyi bir ibadəti özünə vacib etməsi. İtaət nəziri yerinə yetirilir, günah nəziri yox: «Kim Allaha itaət etməyi nəzir etsə, itaət etsin; kim Ona asi olmağı nəzir etsə, asi olmasın» (Buxari 6696). Nəzir ibadətdir, Allahdan başqasına nəzir şirkdir.',
      en: 'A person making obligatory on himself an act of worship the Shari\'ah did not oblige. A vow of obedience must be fulfilled, a vow of sin must not: «Whoever vows to obey Allah, let him obey Him; whoever vows to disobey Him, let him not disobey Him» (Bukhari 6696). A vow is worship; vowing to other than Allah is shirk.',
      ru: 'Возложение человеком на себя поклонения, которое шариат не сделал обязательным. Обет послушания исполняется, обет греха — нет: «Кто дал обет повиноваться Аллаху, пусть повинуется Ему, а кто дал обет ослушаться Его, пусть не ослушивается» (Бухари 6696). Обет — поклонение; обет кому-либо, кроме Аллаха, — ширк.',
      ar: 'إلزام المكلف نفسه عبادة لم يوجبها الشرع. ويجب الوفاء بنذر الطاعة دون المعصية: «من نذر أن يطيع الله فليطعه، ومن نذر أن يعصيه فلا يعصه» (البخاري 6696). والنذر عبادة، وصرفه لغير الله شرك.',
      tr: 'Mükellefin şeriatın farz kılmadığı bir ibadeti kendine vacip kılması. İtaat adağı yerine getirilir, günah adağı getirilmez: «Kim Allah\'a itaat etmeyi adarsa itaat etsin; kim O\'na isyan etmeyi adarsa isyan etmesin» (Buhari 6696). Adak ibadettir; Allah\'tan başkasına adak şirktir.',
    },
    rel: ['yamin', 'kaffarah', 'ibadah', 'shirk'],
    lesson: 'kaffarah-fidyah',
  },
  {
    term: 'And (yəmin)', ar: 'اليمين', translit: 'Yamin', cat: 'fiqh',
    def: {
      az: 'Bir işi təsdiqləmək üçün Allahın adı və ya sifəti ilə and içmək. Allahdan başqası ilə and içmək olmaz: «Kim and içirsə, Allaha and içsin və ya sussun» (Buxari 2679). Qəsdlə içilib pozulan andın kəffarəsi var (Maidə 5:89).',
      en: 'Swearing by Allah or one of His names or attributes to affirm something. Swearing by other than Allah is not allowed: «Whoever swears, let him swear by Allah or keep silent» (Bukhari 2679). A deliberate oath that is broken requires expiation (Al-Ma\'idah 5:89).',
      ru: 'Клятва именем или атрибутом Аллаха для подтверждения чего-либо. Клясться кем-либо, кроме Аллаха, нельзя: «Кто клянётся, пусть клянётся Аллахом или молчит» (Бухари 2679). За нарушение преднамеренной клятвы положено искупление (аль-Маида 5:89).',
      ar: 'توكيد الأمر بذكر اسم الله أو صفة من صفاته. ولا يجوز الحلف بغير الله: «من كان حالفًا فليحلف بالله أو ليصمت» (البخاري 2679). واليمين المنعقدة إذا حنث فيها صاحبها وجبت عليه الكفارة (المائدة: 89).',
      tr: 'Bir şeyi pekiştirmek için Allah\'ın adı veya sıfatıyla yemin etmek. Allah\'tan başkası adına yemin edilmez: «Kim yemin edecekse Allah\'a yemin etsin ya da sussun» (Buhari 2679). Bilerek edilip bozulan yeminin kefareti vardır (Mâide 5:89).',
    },
    rel: ['kaffarah', 'nadhr', 'shirk-asghar'],
    lesson: 'kaffarah-fidyah',
  },
  {
    term: 'Zəbh (kəsim)', ar: 'الذبيحة', translit: 'Dhabihah', cat: 'fiqh',
    def: {
      az: 'Əti yeyilən heyvanın şəriətə uyğun kəsilməsi: müsəlman və ya kitab əhli tərəfindən, iti alətlə boğaz və qan damarlarını kəsməklə və Allahın adını çəkməklə. «Üzərinə Allahın adı çəkilməyəndən yeməyin» (Ənam 6:121). Allahdan başqası üçün kəsmək şirkdir.',
      en: 'Slaughtering an animal whose meat is lawful in the prescribed way: by a Muslim or one of the People of the Book, with a sharp tool cutting the throat and blood vessels, mentioning Allah\'s name. «Do not eat of that over which Allah\'s name has not been mentioned» (Al-An\'am 6:121). Slaughtering for other than Allah is shirk.',
      ru: 'Забой животного, мясо которого дозволено, по шариату: мусульманином или людьми Писания, острым орудием с перерезанием горла и кровеносных сосудов, с упоминанием имени Аллаха. «Не ешьте из того, над чем не было упомянуто имя Аллаха» (аль-Ан‘ам 6:121). Забой ради кого-либо, кроме Аллаха, — ширк.',
      ar: 'تذكية الحيوان المأكول على الوجه الشرعي: من مسلم أو كتابي، بآلة حادة تقطع الحلقوم والودجين، مع ذكر اسم الله. ﴿وَلَا تَأْكُلُوا۟ مِمَّا لَمْ يُذْكَرِ ٱسْمُ ٱللَّهِ عَلَيْهِ﴾ (الأنعام: 121). والذبح لغير الله شرك.',
      tr: 'Eti yenen hayvanın şeriata uygun kesilmesi: Müslüman veya Ehl-i Kitap tarafından, keskin bir aletle boğaz ve kan damarları kesilerek ve Allah\'ın adı anılarak. «Üzerine Allah\'ın adı anılmayandan yemeyin» (En\'âm 6:121). Allah\'tan başkası için kesmek şirktir.',
    },
    rel: ['halal', 'udhiyah', 'ahl-al-kitab'],
  },
]
