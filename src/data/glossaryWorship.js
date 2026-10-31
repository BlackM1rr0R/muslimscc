// ═══════════════════════════════════════════════════════
// İslami söz lüğəti — İBADƏT terminləri (5 dil).
//
// Təriflər Quran, səhih Sünnə və Sələfin anlayışına əsaslanır; ixtilaf
// olan məsələlərdə dəlilə görə daha güclü rəy qısaca qeyd edilir
// (İbn Baz, İbn Useymin, Albani kimi alimlərin seçdiyi kimi).
// Ayələr api.quran.com-dan, hədis nömrələri fawazahmed0/hadith-api
// (standart nömrələmə: Buxari, Müslim — Əbdülbaqi, Əbu Davud) ilə
// yoxlanılıb. Yoxlanılmayan istinad yazılmır.
//
// Sahələr: term (az), ar, translit, cat, def{az,en,ru,ar,tr},
// rel — əlaqəli terminlərin id-ləri, lesson — /learn/<slug> dərsi (varsa).
// ═══════════════════════════════════════════════════════

export const GLOSSARY_WORSHIP = [
  {
    term: 'Dəstəmaz', ar: 'الوضوء', translit: 'Wudu', cat: 'worship',
    def: {
      az: 'Namaz və bəzi ibadətlər üçün suyla kiçik təharət: üzü, dirsəklərlə birlikdə qolları yumaq, başa məsh çəkmək və topuqlarla birlikdə ayaqları yumaq (Maidə 5:6). Dəstəmazsız namaz qəbul olunmur (Müslim 224).',
      en: 'Minor purification with water for prayer and certain acts of worship: washing the face, the arms up to and including the elbows, wiping the head and washing the feet up to and including the ankles (Al-Ma’idah 5:6). Prayer is not accepted without purification (Muslim 224).',
      ru: 'Малое очищение водой для молитвы и некоторых видов поклонения: омовение лица, рук вместе с локтями, протирание головы и омовение ног вместе с щиколотками (аль-Маида 5:6). Молитва без очищения не принимается (Муслим 224).',
      ar: 'طهارة صغرى بالماء للصلاة ونحوها: غسل الوجه واليدين إلى المرفقين ومسح الرأس وغسل الرجلين إلى الكعبين (المائدة: 6). ولا تُقبل صلاة بغير طهور (مسلم 224).',
      tr: 'Namaz ve bazı ibadetler için su ile yapılan küçük temizlik: yüzü, dirseklerle birlikte kolları yıkamak, başı meshetmek ve topuklarla birlikte ayakları yıkamak (Mâide 5:6). Abdestsiz namaz kabul edilmez (Müslim 224).',
    },
    rel: ['tahara', 'hadath', 'mash-alal-khuffayn', 'tayammum'],
  },
  {
    term: 'Niyyət', ar: 'النية', translit: 'Niyyah', cat: 'worship',
    def: {
      az: 'Qəlbin bir əməli Allah üçün etməyə qəsd etməsi; ibadəti adətdən və bir ibadəti digərindən ayırır. Yeri qəlbdir, dillə deyilməsi Sünnədə yoxdur. «Əməllər ancaq niyyətlərə görədir» (Buxari 1).',
      en: 'The heart’s resolve to do an act for Allah; it distinguishes worship from habit and one act of worship from another. Its place is the heart — pronouncing it aloud is not from the Sunnah. «Actions are only by intentions» (Bukhari 1).',
      ru: 'Решимость сердца совершить дело ради Аллаха; она отличает поклонение от привычки и одно поклонение от другого. Её место — сердце, произнесение вслух не из Сунны. «Поистине, дела — по намерениям» (Бухари 1).',
      ar: 'قصد القلب فعلَ العمل لله، وبها تتميز العبادة عن العادة والعبادات بعضها عن بعض. ومحلها القلب، والتلفظ بها ليس من السنة. «إنما الأعمال بالنيات» (البخاري 1).',
      tr: 'Kalbin bir ameli Allah için yapmaya kastetmesi; ibadeti adetten ve bir ibadeti diğerinden ayırır. Yeri kalptir, dille söylenmesi Sünnet\'te yoktur. «Ameller ancak niyetlere göredir» (Buhari 1).',
    },
    rel: ['ikhlas', 'ibadah', 'riya'],
  },
  {
    term: 'Təkbirətul-İhram', ar: 'تكبيرة الإحرام', translit: 'Takbirat al-Ihram', cat: 'worship',
    def: {
      az: 'Namazın başlanğıcında deyilən «Allahu əkbər»; namazın rüknüdür. Ondan sonra namazdan kənar sözlər və işlər haram olur: «Namazın açarı təharət, onun haram edəni təkbir, halal edəni salamdır» (Əbu Davud 61).',
      en: 'The «Allahu akbar» that opens the prayer; it is a pillar of the prayer. After it, speech and acts outside the prayer become forbidden: «The key to prayer is purification, its entry into sanctity is the takbir and its exit is the taslim» (Abu Dawud 61).',
      ru: 'Возглас «Аллаху акбар», открывающий молитву; это её столп. После него слова и действия вне молитвы становятся запретными: «Ключ к молитве — очищение, её запретное начало — такбир, а разрешающее завершение — приветствие» (Абу Дауд 61).',
      ar: 'قول «الله أكبر» في افتتاح الصلاة، وهي ركن فيها، يحرم بها ما كان مباحًا قبلها. «مفتاح الصلاة الطهور، وتحريمها التكبير، وتحليلها التسليم» (أبو داود 61).',
      tr: 'Namazın başında söylenen «Allahu ekber»; namazın rüknüdür. Ondan sonra namaz dışı söz ve işler haram olur: «Namazın anahtarı temizlik, haram kılınışı tekbir, helal kılınışı selamdır» (Ebu Davud 61).',
    },
    rel: ['salah', 'taslim', 'rukn'],
  },
  {
    term: 'Təşəhhüd', ar: 'التشهد', translit: 'Tashahhud', cat: 'worship',
    def: {
      az: 'Namazın oturuşunda oxunan «ət-Təhiyyatu lillah…» zikri; şəhadət kəlməsini ehtiva edir. Peyğəmbər ﷺ onu səhabələrə Quran surəsi kimi öyrədirdi (Buxari 831). Son təşəhhüd namazın rüknüdür.',
      en: 'The words «at-Tahiyyatu lillah…» recited while sitting in prayer; they contain the testimony of faith. The Prophet ﷺ taught it to his Companions like a surah of the Quran (Bukhari 831). The final tashahhud is a pillar of the prayer.',
      ru: 'Слова «ат-тахийяту лилляхи…», читаемые сидя в молитве; они содержат свидетельство веры. Пророк ﷺ обучал им сподвижников, как суре Корана (Бухари 831). Последний ташаххуд — столп молитвы.',
      ar: 'قول «التحيات لله...» في جلوس الصلاة، وفيه الشهادتان. وكان النبي ﷺ يعلّمه أصحابه كما يعلمهم السورة من القرآن (البخاري 831). والتشهد الأخير ركن من أركان الصلاة.',
      tr: 'Namazın oturuşunda okunan «et-Tahiyyâtu lillâh…» zikri; şehadet kelimesini içerir. Peygamber ﷺ onu ashabına Kur\'an suresi gibi öğretirdi (Buhari 831). Son teşehhüd namazın rüknüdür.',
    },
    rel: ['salah', 'shahadah', 'taslim'],
  },
  {
    term: 'Salam (namazda)', ar: 'التسليم', translit: 'Taslim', cat: 'worship',
    def: {
      az: 'Namazı «Əssəlamu aleykum və rahmətullah» deyərək bitirmək; namazın rüknüdür və onunla namazdan çıxılır (Əbu Davud 61). Sünnə sağa və sola salam verməkdir.',
      en: 'Ending the prayer by saying «As-salamu alaykum wa rahmatullah»; it is a pillar by which one exits the prayer (Abu Dawud 61). The Sunnah is to give salam to the right and to the left.',
      ru: 'Завершение молитвы словами «Ас-саляму алейкум ва рахматуллах»; это столп, которым выходят из молитвы (Абу Дауд 61). Сунна — приветствовать направо и налево.',
      ar: 'الخروج من الصلاة بقول «السلام عليكم ورحمة الله»، وهو ركن تُختم به الصلاة (أبو داود 61)، والسنة التسليم عن اليمين والشمال.',
      tr: 'Namazı «Esselâmu aleyküm ve rahmetullah» diyerek bitirmek; namazın rüknüdür ve onunla namazdan çıkılır (Ebu Davud 61). Sünnet sağa ve sola selam vermektir.',
    },
    rel: ['takbirat-al-ihram', 'tashahhud', 'salah'],
  },
  {
    term: 'Vitr', ar: 'الوتر', translit: 'Witr', cat: 'worship',
    def: {
      az: 'İşa namazından sonra fəcrə qədər tək sayda (bir, üç, beş və s.) qılınan namaz; təkidli sünnədir. «Gecə namazınızın sonunu vitr edin» (Buxari 998).',
      en: 'A prayer of an odd number of units (one, three, five, etc.) prayed between Isha and dawn; a strongly emphasised Sunnah. «Make witr the last of your prayer at night» (Bukhari 998).',
      ru: 'Молитва с нечётным числом ракаатов (один, три, пять и т. д.) между ночной молитвой и рассветом; подтверждённая сунна. «Делайте последней своей ночной молитвой витр» (Бухари 998).',
      ar: 'صلاة ركعاتها وتر (واحدة أو ثلاث أو خمس...) بين العشاء والفجر، وهي سنة مؤكدة. «اجعلوا آخر صلاتكم بالليل وترًا» (البخاري 998).',
      tr: 'Yatsıdan sonra fecre kadar tek sayıda (bir, üç, beş vb.) kılınan namaz; müekked sünnettir. «Gece namazınızın sonunu vitir yapın» (Buhari 998).',
    },
    rel: ['qiyam-al-layl', 'qunut', 'tarawih'],
  },
  {
    term: 'Gecə namazı', ar: 'قيام الليل', translit: 'Qiyam al-Layl', cat: 'worship',
    def: {
      az: 'İşadan sonra fəcrə qədər qılınan könüllü namaz; ən fəzilətlisi gecənin son üçdə biridir. Peyğəmbər ﷺ Ramazanda da, başqa vaxt da on bir rükətdən artıq qılmazdı (Buxari 1147). Təhəccüd də bu namazdır.',
      en: 'Voluntary prayer offered between Isha and dawn, best in the last third of the night. The Prophet ﷺ did not exceed eleven units, in Ramadan or otherwise (Bukhari 1147). Tahajjud is this prayer.',
      ru: 'Добровольная молитва между ночной молитвой и рассветом; лучше всего — в последнюю треть ночи. Пророк ﷺ не совершал больше одиннадцати ракаатов ни в Рамадан, ни в другое время (Бухари 1147). Тахаджуд — это та же молитва.',
      ar: 'صلاة التطوع بين العشاء والفجر، وأفضلها في الثلث الأخير من الليل. وما كان النبي ﷺ يزيد في رمضان ولا في غيره على إحدى عشرة ركعة (البخاري 1147). والتهجد منها.',
      tr: 'Yatsıdan sonra fecre kadar kılınan nafile namaz; en faziletlisi gecenin son üçte biridir. Peygamber ﷺ Ramazan\'da da başka zaman da on bir rekâttan fazla kılmazdı (Buhari 1147). Teheccüd de bu namazdır.',
    },
    rel: ['witr', 'tarawih', 'nuzul'],
  },
  {
    term: 'Təravih', ar: 'التراويح', translit: 'Tarawih', cat: 'worship',
    def: {
      az: 'Ramazan gecələrində camaatla qılınan gecə namazı. «Kim Ramazanı iman edərək və savabını Allahdan umaraq ibadətlə keçirsə, keçmiş günahları bağışlanar» (Buxari 2009). Peyğəmbərin ﷺ əməli on bir rükət idi (Buxari 1147).',
      en: 'The night prayer offered in congregation in the nights of Ramadan. «Whoever stands in prayer in Ramadan with faith, seeking reward, his past sins are forgiven» (Bukhari 2009). The Prophet’s ﷺ practice was eleven units (Bukhari 1147).',
      ru: 'Ночная молитва, совершаемая коллективно в ночи Рамадана. «Кто выстаивал Рамадан с верой, надеясь на награду, тому прощаются прошлые грехи» (Бухари 2009). Практикой Пророка ﷺ было одиннадцать ракаатов (Бухари 1147).',
      ar: 'قيام ليالي رمضان جماعةً. «من قام رمضان إيمانًا واحتسابًا غُفر له ما تقدم من ذنبه» (البخاري 2009)، وكان هدي النبي ﷺ إحدى عشرة ركعة (البخاري 1147).',
      tr: 'Ramazan gecelerinde cemaatle kılınan gece namazı. «Kim Ramazan\'ı iman ederek ve sevabını Allah\'tan umarak ihya ederse geçmiş günahları bağışlanır» (Buhari 2009). Peygamber\'in ﷺ uygulaması on bir rekâttı (Buhari 1147).',
    },
    rel: ['qiyam-al-layl', 'witr', 'sawm'],
  },
  {
    term: 'Duha namazı', ar: 'صلاة الضحى', translit: 'Duha', cat: 'worship',
    def: {
      az: 'Günəş bir nizə boyu qalxandan zöhrdən bir az əvvələ qədər qılınan könüllü namaz, ən azı iki rükət. İnsanın hər oynağına düşən sədəqəni iki rükət duha əvəz edir (Müslim 720).',
      en: 'A voluntary prayer from when the sun has risen a spear’s length until shortly before Dhuhr, at least two units. Two units of Duha suffice for the charity due on each of a person’s joints (Muslim 720).',
      ru: 'Добровольная молитва с момента, когда солнце поднимется на высоту копья, и до незадолго до полуденной молитвы; минимум два ракаата. Два ракаата духа заменяют милостыню, причитающуюся за каждый сустав человека (Муслим 720).',
      ar: 'صلاة تطوع من ارتفاع الشمس قيد رمح إلى قُبيل الزوال، وأقلها ركعتان، ويجزئ عن الصدقة على كل سُلامى من الإنسان ركعتان يركعهما من الضحى (مسلم 720).',
      tr: 'Güneş bir mızrak boyu yükseldikten öğleden biraz öncesine kadar kılınan nafile namaz, en az iki rekât. İnsanın her eklemine düşen sadakayı iki rekât kuşluk namazı karşılar (Müslim 720).',
    },
    rel: ['sunan-ar-rawatib', 'sadaqah', 'salah'],
  },
  {
    term: 'Rəvatib sünnələr', ar: 'السنن الرواتب', translit: 'Sunan ar-Rawatib', cat: 'worship',
    def: {
      az: 'Fərz namazlarla bağlı müntəzəm sünnə namazlar: sübhdən əvvəl 2, zöhrdən əvvəl 4 və sonra 2, məğribdən sonra 2, işadan sonra 2 rükət. Gündə on iki rükəti davamlı qılana Cənnətdə ev tikilir (Müslim 728).',
      en: 'The regular Sunnah prayers attached to the obligatory ones: 2 before Fajr, 4 before and 2 after Dhuhr, 2 after Maghrib and 2 after Isha. Whoever keeps to twelve units daily has a house built for him in Paradise (Muslim 728).',
      ru: 'Постоянные сунны при обязательных молитвах: 2 ракаата до утренней, 4 до и 2 после полуденной, 2 после вечерней и 2 после ночной. Тому, кто постоянно совершает двенадцать ракаатов в день, строится дом в Раю (Муслим 728).',
      ar: 'السنن التابعة للفرائض: ركعتان قبل الفجر، وأربع قبل الظهر وركعتان بعدها، وركعتان بعد المغرب، وركعتان بعد العشاء. ومن صلى اثنتي عشرة ركعة في يوم بُني له بيت في الجنة (مسلم 728).',
      tr: 'Farz namazlara bağlı düzenli sünnetler: sabahtan önce 2, öğleden önce 4 ve sonra 2, akşamdan sonra 2, yatsıdan sonra 2 rekât. Günde on iki rekâtı devamlı kılana Cennet\'te ev yapılır (Müslim 728).',
    },
    rel: ['salah', 'mustahab', 'duha'],
  },
  {
    term: 'Cümə', ar: 'الجمعة', translit: 'Jumu\'ah', cat: 'worship',
    def: {
      az: 'Həftənin ən fəzilətli günü və həmin gün zöhr namazının yerinə qılınan iki rükətli camaat namazı; ondan əvvəl xütbə oxunur. Yetkin, azad, yerli kişilərə fərzdir (Cümə 62:9).',
      en: 'The best day of the week, and the two-unit congregational prayer that replaces Dhuhr on that day, preceded by a sermon. It is obligatory on adult, free, resident men (Al-Jumu’ah 62:9).',
      ru: 'Лучший день недели и коллективная молитва в два ракаата, заменяющая в этот день полуденную; перед ней читается проповедь. Обязательна для взрослых, свободных, оседлых мужчин (аль-Джуму‘а 62:9).',
      ar: 'أفضل أيام الأسبوع، وصلاتها ركعتان جماعةً بدل الظهر تسبقهما خطبتان، وهي فرض على الرجل البالغ الحر المقيم (الجمعة: 9).',
      tr: 'Haftanın en faziletli günü ve o gün öğle namazının yerine kılınan iki rekâtlık cemaat namazı; öncesinde hutbe okunur. Ergen, hür, yerleşik erkeklere farzdır (Cuma 62:9).',
    },
    rel: ['khutbah', 'salat-al-jamaah', 'salah'],
  },
  {
    term: 'Xütbə', ar: 'الخطبة', translit: 'Khutbah', cat: 'worship',
    def: {
      az: 'Cümə, bayram, küsuf və yağış namazlarında imamın camaata etdiyi nəsihət. Allaha həmd, şəhadət, Peyğəmbərə ﷺ salavat, təqvaya çağırış və Quran ayəsi kimi hissələri olur; cümə xütbəsi namazdan əvvəldir və onu dinləmək vacibdir.',
      en: 'The admonition the imam delivers at the Friday, Eid, eclipse and rain prayers, including praise of Allah, the testimony, blessings on the Prophet ﷺ, a call to taqwa and Quranic verses. The Friday sermon precedes the prayer and must be listened to.',
      ru: 'Наставление имама на пятничной, праздничной молитвах, молитвах при затмении и о дожде: восхваление Аллаха, свидетельство, благословение Пророка ﷺ, призыв к богобоязненности и аяты Корана. Пятничная проповедь предшествует молитве, её обязательно слушать.',
      ar: 'موعظة يلقيها الإمام في الجمعة والعيد والكسوف والاستسقاء، فيها حمد الله والشهادة والصلاة على النبي ﷺ والوصية بالتقوى وقراءة شيء من القرآن. وخطبة الجمعة قبل الصلاة ويجب الإنصات لها.',
      tr: 'Cuma, bayram, küsuf ve yağmur namazlarında imamın cemaate yaptığı nasihat; Allah\'a hamd, şehadet, Peygamber\'e ﷺ salavat, takvaya çağrı ve Kur\'an ayetleri içerir. Cuma hutbesi namazdan öncedir ve onu dinlemek vaciptir.',
    },
    rel: ['jumuah', 'salat-al-id', 'salat-al-kusuf'],
  },
  {
    term: 'Qəsr', ar: 'القصر', translit: 'Qasr', cat: 'worship',
    def: {
      az: 'Səfərdə dörd rükətli namazları (zöhr, əsr, işa) iki rükət qılmaq (Nisa 4:101). Peyğəmbər ﷺ səfərlərində daim qəsr edirdi; güclü rəyə görə təkidli sünnədir.',
      en: 'Shortening the four-unit prayers (Dhuhr, Asr, Isha) to two units while travelling (An-Nisa 4:101). The Prophet ﷺ always shortened on his journeys; according to the stronger view it is a confirmed Sunnah.',
      ru: 'Сокращение четырёхракаатных молитв (полуденной, послеполуденной, ночной) до двух ракаатов в пути (ан-Ниса 4:101). Пророк ﷺ всегда сокращал в поездках; по более сильному мнению, это подтверждённая сунна.',
      ar: 'قصر الرباعية (الظهر والعصر والعشاء) إلى ركعتين في السفر (النساء: 101)، وكان النبي ﷺ يقصر في أسفاره دائمًا، وهو سنة مؤكدة على الراجح.',
      tr: 'Yolculukta dört rekâtlık namazları (öğle, ikindi, yatsı) iki rekât kılmak (Nisâ 4:101). Peygamber ﷺ yolculuklarında daima kısaltırdı; daha güçlü görüşe göre müekked sünnettir.',
    },
    rel: ['jam', 'rukhsah', 'salah'],
    lesson: 'travel-prayer',
  },
  {
    term: 'Cəm (namazları birləşdirmək)', ar: 'الجمع بين الصلاتين', translit: 'Jam\'', cat: 'worship',
    def: {
      az: 'Zöhrlə əsri və ya məğriblə işanı birinin vaxtında qılmaq. Səfərdə, yağış, xəstəlik kimi çətinlikdə caizdir; İbn Abbas: «Ümmətini çətinliyə salmamaq istədi» (Müslim 705).',
      en: 'Praying Dhuhr with Asr, or Maghrib with Isha, in the time of one of them. It is allowed in travel and in hardship such as rain or illness; Ibn Abbas said: «He wanted not to burden his Ummah» (Muslim 705).',
      ru: 'Совершение полуденной молитвы вместе с послеполуденной или вечерней с ночной во время одной из них. Дозволено в пути и при затруднении — дожде, болезни; Ибн Аббас сказал: «Он не хотел обременять свою общину» (Муслим 705).',
      ar: 'أداء الظهر مع العصر أو المغرب مع العشاء في وقت إحداهما، ويجوز في السفر وعند الحرج كالمطر والمرض. قال ابن عباس: «أراد ألّا يُحرج أمته» (مسلم 705).',
      tr: 'Öğle ile ikindiyi veya akşam ile yatsıyı birinin vaktinde kılmak. Yolculukta, yağmur ve hastalık gibi zorlukta caizdir; İbn Abbas: «Ümmetini sıkıntıya sokmamak istedi» (Müslim 705).',
    },
    rel: ['qasr', 'rukhsah', 'salah'],
    lesson: 'travel-prayer',
  },
  {
    term: 'Səhv səcdəsi', ar: 'سجود السهو', translit: 'Sujud as-Sahw', cat: 'worship',
    def: {
      az: 'Namazda unutqanlıqla artırma, əskiltmə və ya şəkk olduqda namazın sonunda edilən iki səcdə. Səbəbə görə salamdan əvvəl və ya sonra edilir; Sünnədə hər iki forma sabitdir.',
      en: 'Two prostrations made at the end of the prayer when something was added, omitted or doubted out of forgetfulness. Depending on the cause they come before or after the taslim; both forms are established in the Sunnah.',
      ru: 'Два земных поклона в конце молитвы, если по забывчивости что-то добавлено, пропущено или возникло сомнение. В зависимости от причины совершаются до или после приветствия; обе формы утверждены в Сунне.',
      ar: 'سجدتان في آخر الصلاة لجبر زيادة أو نقص أو شك وقع سهوًا، وتكونان قبل السلام أو بعده بحسب السبب، وكلاهما ثابت في السنة.',
      tr: 'Namazda unutarak fazlalık, eksiklik veya şüphe olduğunda namazın sonunda yapılan iki secde. Sebebine göre selamdan önce veya sonra yapılır; Sünnet\'te her iki şekil de sabittir.',
    },
    rel: ['sujud', 'salah', 'taslim'],
  },
  {
    term: 'Məsh (xuflara)', ar: 'المسح على الخفين', translit: 'Mash alal-Khuffayn', cat: 'worship',
    def: {
      az: 'Dəstəmazla geyilmiş xuflara (dəri və ya qalın corablara) ayağı yumaq əvəzinə nəm əllə məsh çəkmək. Müddəti yerli üçün bir gün-gecə, müsafir üçün üç gün-gecədir (Müslim 276).',
      en: 'Wiping with wet hands over leather socks (or thick socks) put on in a state of wudu instead of washing the feet. The period is one day and night for a resident and three for a traveller (Muslim 276).',
      ru: 'Протирание влажными руками кожаных носков (или плотных носков), надетых в состоянии омовения, вместо мытья ног. Срок — сутки для оседлого и трое суток для путника (Муслим 276).',
      ar: 'إمرار اليد المبلولة على الخفين (أو الجوربين) الملبوسين على طهارة بدل غسل الرجلين، ومدته يوم وليلة للمقيم وثلاثة أيام بلياليهن للمسافر (مسلم 276).',
      tr: 'Abdestli giyilmiş mestlere (deri ya da kalın çoraplara) ayağı yıkamak yerine ıslak elle meshetmek. Süresi mukim için bir gün bir gece, yolcu için üç gün üç gecedir (Müslim 276).',
    },
    rel: ['wudu', 'rukhsah', 'tahara'],
  },
  {
    term: 'Nəcasət', ar: 'النجاسة', translit: 'Najasah', cat: 'worship',
    def: {
      az: 'Şəriətin murdar saydığı və namaz üçün bədəndən, paltardan və yerdən təmizlənməsi lazım olan şeylər: insan sidiyi və nəcisi, axan qan, leş, donuz və s. Əşyada əsl qayda təmizlikdir — nəcis olduğu dəlillə sübut edilməlidir.',
      en: 'Substances the Shari‘ah deems impure and which must be removed from the body, clothes and place of prayer: human urine and faeces, flowing blood, carrion, swine and the like. The default ruling for things is purity — impurity needs evidence.',
      ru: 'Вещества, которые Шариат считает нечистыми и которые нужно удалить с тела, одежды и места молитвы: моча и кал человека, текущая кровь, мертвечина, свинья и т. п. Изначально вещи чисты — нечистота требует доказательства.',
      ar: 'كل عين مستقذرة شرعًا يجب إزالتها عن البدن والثوب والمكان للصلاة، كبول الآدمي وغائطه والدم المسفوح والميتة والخنزير. والأصل في الأشياء الطهارة، فلا يُحكم بنجاسة شيء إلا بدليل.',
      tr: 'Şeriatın pis saydığı ve namaz için bedenden, elbiseden ve yerden temizlenmesi gereken şeyler: insan idrarı ve dışkısı, akan kan, leş, domuz vb. Eşyada asıl olan temizliktir — necis olduğu delille sabit olmalıdır.',
    },
    rel: ['tahara', 'istinja', 'hadath'],
  },
  {
    term: 'Hədəs', ar: 'الحدث', translit: 'Hadath', cat: 'worship',
    def: {
      az: 'Namaz kimi ibadətlərə mane olan hökmi natəmizlik. Kiçik hədəs (sidik, yel, yuxu və s.) dəstəmazı, böyük hədəs (cünüblük, heyz, nifas) qüslü vacib edir.',
      en: 'A state of ritual impurity that prevents acts such as prayer. Minor hadath (urinating, passing wind, deep sleep, etc.) requires wudu; major hadath (janabah, menstruation, postnatal bleeding) requires ghusl.',
      ru: 'Состояние ритуальной нечистоты, препятствующее молитве и подобному. Малое осквернение (мочеиспускание, выход газов, глубокий сон и т. п.) требует малого омовения, большое (половая нечистота, менструация, послеродовое кровотечение) — полного.',
      ar: 'وصف قائم بالبدن يمنع من الصلاة ونحوها: فالأصغر (كالبول والريح والنوم المستغرق) يوجب الوضوء، والأكبر (الجنابة والحيض والنفاس) يوجب الغسل.',
      tr: 'Namaz gibi ibadetlere engel olan hükmî kirlilik. Küçük hades (idrar, yel, derin uyku vb.) abdesti, büyük hades (cünüplük, hayız, nifas) guslü gerektirir.',
    },
    rel: ['wudu', 'ghusl', 'najasah'],
  },
  {
    term: 'İstinca', ar: 'الاستنجاء', translit: 'Istinja\'', cat: 'worship',
    def: {
      az: 'Ayaqyolundan sonra çıxış yerini su ilə təmizləmək; daş, kağız kimi təmiz quru şeylə silmək isə isticmardır. Sağ əllə deyil, sol əllə edilir.',
      en: 'Cleaning the private parts with water after relieving oneself; wiping with stones or other clean dry material is called istijmar. It is done with the left hand, not the right.',
      ru: 'Очищение интимных мест водой после справления нужды; вытирание камнями или чистым сухим материалом называется истиджмар. Делается левой рукой, а не правой.',
      ar: 'إزالة الخارج من السبيلين بالماء، وإزالته بالحجارة ونحوها من الطاهر اليابس يسمى الاستجمار، ويكون باليد اليسرى لا باليمنى.',
      tr: 'Tuvaletten sonra çıkış yerini su ile temizlemek; taş, kâğıt gibi temiz kuru bir şeyle silmek ise isticmardır. Sağ elle değil, sol elle yapılır.',
    },
    rel: ['najasah', 'tahara', 'wudu'],
  },
  {
    term: 'Heyz', ar: 'الحيض', translit: 'Hayd', cat: 'worship',
    def: {
      az: 'Yetkin qadının bətnindən müəyyən günlərdə gələn təbii qan. Bu müddətdə namaz və oruc tutulmur, ər-arvad yaxınlığı haramdır (Bəqərə 2:222); orucun qəzası tutulur, namazın qəzası yoxdur. Bitəndə qüsl vacibdir.',
      en: 'Natural blood from the womb of a mature woman on certain days. During it she does not pray or fast and intercourse is forbidden (Al-Baqarah 2:222); missed fasts are made up, missed prayers are not. Ghusl is required when it ends.',
      ru: 'Естественная кровь из матки взрослой женщины в определённые дни. В это время она не молится и не постится, близость запрещена (аль-Бакара 2:222); пропущенные посты восполняются, молитвы — нет. По окончании обязательно полное омовение.',
      ar: 'دم طبيعي يخرج من رحم المرأة البالغة في أيام معلومة، تترك فيه الصلاة والصيام ويحرم الجماع (البقرة: 222)، وتقضي الصوم دون الصلاة، ويجب الغسل عند انقطاعه.',
      tr: 'Ergen kadının rahminden belirli günlerde gelen tabii kan. Bu sürede namaz kılınmaz, oruç tutulmaz, eşlerin birleşmesi haramdır (Bakara 2:222); orucun kazası tutulur, namazın kazası yoktur. Bitince gusül gerekir.',
    },
    rel: ['nifas', 'istihadah', 'ghusl'],
    lesson: 'ghusl',
  },
  {
    term: 'Nifas', ar: 'النفاس', translit: 'Nifas', cat: 'worship',
    def: {
      az: 'Doğuşdan sonra gələn qan. Hökmləri heyz kimidir: namaz qılınmır, oruc tutulmur; qan kəsiləndə qüsl alınır. Çox vaxt ən uzun müddəti qırx gün sayılır.',
      en: 'Bleeding after childbirth. Its rulings are like those of menstruation: no prayer or fasting, and ghusl when it stops. Most scholars hold its usual maximum to be forty days.',
      ru: 'Кровотечение после родов. Его положения — как у менструации: без молитвы и поста, а по прекращении — полное омовение. Большинство учёных считают обычным максимумом сорок дней.',
      ar: 'الدم الخارج بسبب الولادة، وأحكامه كأحكام الحيض: لا صلاة ولا صيام، ويجب الغسل عند انقطاعه، وأكثره غالبًا أربعون يومًا عند جمهور العلماء.',
      tr: 'Doğumdan sonra gelen kan. Hükümleri hayız gibidir: namaz kılınmaz, oruç tutulmaz; kan kesilince gusül alınır. Âlimlerin çoğuna göre en uzun süresi genellikle kırk gündür.',
    },
    rel: ['hayd', 'istihadah', 'ghusl'],
    lesson: 'ghusl',
  },
  {
    term: 'İstihazə', ar: 'الاستحاضة', translit: 'Istihadah', cat: 'worship',
    def: {
      az: 'Heyz və nifas vaxtından kənar, xəstəlik səbəbli qanaxma. Belə qadın təmiz sayılır: namaz qılır, oruc tutur, hər namaz vaxtı üçün dəstəmaz alır.',
      en: 'Irregular bleeding due to illness outside the times of menstruation and postnatal bleeding. Such a woman is considered pure: she prays and fasts, making wudu for each prayer time.',
      ru: 'Кровотечение по болезни вне сроков менструации и послеродового периода. Такая женщина считается чистой: молится и постится, совершая омовение к времени каждой молитвы.',
      ar: 'دم يخرج في غير وقت الحيض والنفاس لعلة، وحكم المستحاضة حكم الطاهرات: تصلي وتصوم وتتوضأ لوقت كل صلاة.',
      tr: 'Hayız ve nifas dışındaki, hastalıktan kaynaklanan kanama. Böyle kadın temiz sayılır: namaz kılar, oruç tutar, her namaz vakti için abdest alır.',
    },
    rel: ['hayd', 'nifas', 'wudu'],
    lesson: 'ghusl',
  },
  {
    term: 'Səhur', ar: 'السحور', translit: 'Suhur', cat: 'worship',
    def: {
      az: 'Oruc tutmaq istəyənin fəcrdən əvvəl yediyi yemək. «Səhur edin, çünki səhurda bərəkət var» (Buxari 1923). Sünnə onu fəcrə yaxın gecikdirməkdir.',
      en: 'The meal eaten before dawn by one intending to fast. «Take suhur, for in suhur there is blessing» (Bukhari 1923). The Sunnah is to delay it until close to dawn.',
      ru: 'Еда перед рассветом для того, кто намерен поститься. «Принимайте сухур, ибо в сухуре — благодать» (Бухари 1923). Сунна — откладывать его ближе к рассвету.',
      ar: 'الأكلة قبل الفجر لمن أراد الصيام. «تسحروا فإن في السحور بركة» (البخاري 1923)، والسنة تأخيره إلى قُبيل الفجر.',
      tr: 'Oruç tutmak isteyenin fecirden önce yediği yemek. «Sahur yapın, çünkü sahurda bereket vardır» (Buhari 1923). Sünnet onu fecre yakın geciktirmektir.',
    },
    rel: ['sawm', 'iftar'],
  },
  {
    term: 'İftar', ar: 'الإفطار', translit: 'Iftar', cat: 'worship',
    def: {
      az: 'Günəş batan kimi orucu açmaq; Sünnə onu tələsdirmək və təzə, yoxdursa quru xurma, o da yoxdursa su ilə açmaqdır. «İnsanlar iftarı tələsdirdikcə xeyir içindədirlər» (Buxari 1957).',
      en: 'Breaking the fast as soon as the sun sets; the Sunnah is to hasten it, with fresh dates, otherwise dry dates, otherwise water. «People will remain upon good as long as they hasten to break the fast» (Bukhari 1957).',
      ru: 'Разговение сразу после захода солнца; сунна — не медлить с ним и разговляться свежими финиками, иначе сушёными, иначе водой. «Люди будут пребывать в благе, пока спешат с разговением» (Бухари 1957).',
      ar: 'الفطر عند غروب الشمس، والسنة تعجيله على رطبات، فإن لم تكن فتمرات، فإن لم تكن فماء. «لا يزال الناس بخير ما عجلوا الفطر» (البخاري 1957).',
      tr: 'Güneş batar batmaz orucu açmak; sünnet onu acele etmek ve taze, yoksa kuru hurma, o da yoksa su ile açmaktır. «İnsanlar iftarı acele ettikçe hayır üzeredir» (Buhari 1957).',
    },
    rel: ['sawm', 'suhur', 'dua'],
  },
  {
    term: 'Etikaf', ar: 'الاعتكاف', translit: 'I\'tikaf', cat: 'worship',
    def: {
      az: 'İbadət məqsədilə məsciddə qalmaq. Peyğəmbər ﷺ vəfatına qədər Ramazanın son on günündə etikafa çəkilirdi (Buxari 2026). Ehtiyacsız məsciddən çıxmaq etikafı pozur.',
      en: 'Staying in the mosque for the purpose of worship. The Prophet ﷺ observed i‘tikaf in the last ten days of Ramadan until he died (Bukhari 2026). Leaving the mosque without need breaks it.',
      ru: 'Пребывание в мечети с целью поклонения. Пророк ﷺ уединялся в последние десять дней Рамадана до самой своей кончины (Бухари 2026). Выход из мечети без нужды нарушает итикаф.',
      ar: 'لزوم المسجد لطاعة الله. وكان النبي ﷺ يعتكف العشر الأواخر من رمضان حتى توفاه الله (البخاري 2026)، ويبطل بالخروج من المسجد لغير حاجة.',
      tr: 'İbadet amacıyla mescitte kalmak. Peygamber ﷺ vefatına kadar Ramazan\'ın son on gününde itikâfa girerdi (Buhari 2026). İhtiyaç olmadan mescitten çıkmak itikâfı bozar.',
    },
    rel: ['laylat-al-qadr', 'sawm', 'dhikr'],
  },
  {
    term: 'Qədr gecəsi', ar: 'ليلة القدر', translit: 'Laylat al-Qadr', cat: 'worship',
    def: {
      az: 'Quranın nazil edildiyi, min aydan xeyirli gecə (Qədr 97:3). Ramazanın son on gecəsinin tək gecələrində axtarılır (Buxari 2017); müəyyən bir gecəyə bağlanmır.',
      en: 'The night in which the Quran was sent down, better than a thousand months (Al-Qadr 97:3). It is sought in the odd nights of the last ten of Ramadan (Bukhari 2017) and is not fixed to one particular night.',
      ru: 'Ночь ниспослания Корана, лучшая, чем тысяча месяцев (аль-Кадр 97:3). Её ищут в нечётные ночи последних десяти дней Рамадана (Бухари 2017); она не привязана к одной определённой ночи.',
      ar: 'الليلة التي أُنزل فيها القرآن، وهي خير من ألف شهر (القدر: 3)، تُتحرّى في الوتر من العشر الأواخر من رمضان (البخاري 2017)، ولا تُعيَّن بليلة بعينها.',
      tr: 'Kur\'an\'ın indirildiği, bin aydan hayırlı gece (Kadr 97:3). Ramazan\'ın son on gecesinin tek gecelerinde aranır (Buhari 2017); belirli bir geceye bağlanmaz.',
    },
    rel: ['itikaf', 'qiyam-al-layl', 'quran'],
  },
  {
    term: 'Fitr zəkatı', ar: 'زكاة الفطر', translit: 'Zakat al-Fitr', cat: 'worship',
    def: {
      az: 'Ramazanın sonunda hər müsəlman üçün verilən bir sa\' (təqribən 2,5–3 kq) əsas qida: xurma, arpa, düyü və s. Bayram namazından əvvəl verilməlidir (Buxari 1503). Sünnəyə görə qida ilə verilir.',
      en: 'One sa‘ (about 2.5–3 kg) of staple food — dates, barley, rice and the like — given for every Muslim at the end of Ramadan, before the Eid prayer (Bukhari 1503). According to the Sunnah it is given in food.',
      ru: 'Один са‘ (около 2,5–3 кг) основной пищи — фиников, ячменя, риса и т. п. — за каждого мусульманина в конце Рамадана, до праздничной молитвы (Бухари 1503). По Сунне выдаётся продуктами.',
      ar: 'صاع من طعام قوت البلد (كالتمر والشعير والأرز) عن كل مسلم في آخر رمضان، يُخرج قبل صلاة العيد (البخاري 1503)، والسنة إخراجه طعامًا.',
      tr: 'Ramazan\'ın sonunda her Müslüman için verilen bir sâ\' (yaklaşık 2,5–3 kg) temel gıda: hurma, arpa, pirinç vb. Bayram namazından önce verilmelidir (Buhari 1503). Sünnete göre gıda olarak verilir.',
    },
    rel: ['zakat', 'sawm', 'salat-al-id'],
  },
  {
    term: 'Nisab', ar: 'النصاب', translit: 'Nisab', cat: 'worship',
    def: {
      az: 'Zəkatın vacib olması üçün malın çatmalı olduğu ən az miqdar: məs. 85 q qızıl, 595 q gümüş, beş dəvə, beş vəsq məhsul (Buxari 1405). Nisaba çatan mal üzərindən bir qəməri il keçməlidir (məhsuldan başqa).',
      en: 'The minimum amount wealth must reach for zakat to be due, e.g. 85 g of gold, 595 g of silver, five camels, five wasq of crops (Bukhari 1405). A lunar year must pass over it (except for crops).',
      ru: 'Минимальный размер имущества, при котором обязателен закят: например, 85 г золота, 595 г серебра, пять верблюдов, пять васков урожая (Бухари 1405). Над ним должен пройти лунный год (кроме урожая).',
      ar: 'القدر الأدنى من المال الذي تجب فيه الزكاة، كخمسة وثمانين غرامًا من الذهب، وخمسمائة وخمسة وتسعين غرامًا من الفضة، وخمس من الإبل، وخمسة أوسق من الحب (البخاري 1405)، مع حولان الحول في غير الزروع.',
      tr: 'Zekâtın farz olması için malın ulaşması gereken en az miktar: örn. 85 g altın, 595 g gümüş, beş deve, beş vesk ürün (Buhari 1405). Nisaba ulaşan mal üzerinden bir kamerî yıl geçmelidir (ürün hariç).',
    },
    rel: ['zakat', 'zakat-al-fitr', 'sadaqah'],
  },
  {
    term: 'Sədəqə', ar: 'الصدقة', translit: 'Sadaqah', cat: 'worship',
    def: {
      az: 'Allahın razılığı üçün verilən könüllü ehsan; zəkat da «sədəqə» adlanır. Gülümsəmək, yaxşı söz və zikr də sədəqədir. «Sədəqə malı azaltmaz» (Müslim 2588).',
      en: 'Voluntary giving for Allah’s pleasure; zakat is also called sadaqah. A smile, a good word and dhikr are charity too. «Charity does not decrease wealth» (Muslim 2588).',
      ru: 'Добровольное пожертвование ради довольства Аллаха; закят также называется садака. Улыбка, доброе слово и поминание — тоже милостыня. «Милостыня не уменьшает имущества» (Муслим 2588).',
      ar: 'ما يُبذل تطوعًا ابتغاء وجه الله، وتُسمّى الزكاة صدقة أيضًا، ومن الصدقة الكلمة الطيبة والتبسم والذكر. «ما نقصت صدقة من مال» (مسلم 2588).',
      tr: 'Allah\'ın rızası için verilen gönüllü bağış; zekât da «sadaka» diye anılır. Gülümsemek, güzel söz ve zikir de sadakadır. «Sadaka malı eksiltmez» (Müslim 2588).',
    },
    rel: ['zakat', 'ikhlas', 'waqf'],
  },
  {
    term: 'İhram', ar: 'الإحرام', translit: 'Ihram', cat: 'worship',
    def: {
      az: 'Həcc və ya ümrəyə başlamaq niyyəti; bununla ehramlı şəxsə ətir, saç-dırnaq almaq, ov, nikah, kişiyə tikişli paltar və baş örtmək kimi şeylər haram olur. Kişilər iki ağ parça (izar və rida) geyinir.',
      en: 'The intention to enter Hajj or Umrah, after which perfume, cutting hair and nails, hunting, marriage contracts, and for men sewn clothing and covering the head become forbidden. Men wear two white sheets (izar and rida’).',
      ru: 'Намерение вступить в хадж или умру, после которого запрещаются благовония, стрижка волос и ногтей, охота, заключение брака, а мужчинам — шитая одежда и покрытие головы. Мужчины надевают два белых полотна (изар и рида).',
      ar: 'نية الدخول في النسك من حج أو عمرة، فيحرم بها الطيب وأخذ الشعر والأظفار والصيد وعقد النكاح، وعلى الرجل لبس المخيط وتغطية الرأس، ويلبس الرجل إزارًا ورداءً أبيضين.',
      tr: 'Hacca veya umreye başlama niyeti; bununla ihramlıya koku, saç ve tırnak kesmek, av, nikâh, erkeğe dikişli elbise ve başı örtmek haram olur. Erkekler iki beyaz örtü (izar ve rida) giyer.',
    },
    rel: ['miqat', 'talbiyah', 'hajj', 'umrah'],
  },
  {
    term: 'Miqat', ar: 'الميقات', translit: 'Miqat', cat: 'worship',
    def: {
      az: 'Həcc və ümrə niyyəti olanın ehramsız keçə bilmədiyi yerlər: Zul-Huleyfə, Cuhfə, Qərnul-Mənazil, Yələmləm (Buxari 1524) və Zatu İrq. Bunlar həm orada yaşayanlar, həm də oradan keçənlər üçündür.',
      en: 'The stations that one intending Hajj or Umrah may not pass without ihram: Dhul-Hulayfah, al-Juhfah, Qarn al-Manazil, Yalamlam (Bukhari 1524) and Dhat ‘Irq. They apply to their inhabitants and to anyone passing by them.',
      ru: 'Рубежи, которые желающий совершить хадж или умру не должен пересекать без ихрама: Зуль-Хулейфа, аль-Джухфа, Карн аль-Маназиль, Ялямлям (Бухари 1524) и Зату Ирк. Они касаются местных жителей и всех проезжающих через них.',
      ar: 'المواضع التي لا يتجاوزها مريد الحج أو العمرة إلا محرمًا: ذو الحليفة والجحفة وقرن المنازل ويلملم (البخاري 1524) وذات عرق، وهي لأهلها ولمن أتى عليها من غيرهم.',
      tr: 'Hac veya umre niyeti olanın ihramsız geçemeyeceği yerler: Zülhuleyfe, Cuhfe, Karnü\'l-Menâzil, Yelemlem (Buhari 1524) ve Zâtu Irk. Hem orada yaşayanlar hem de oradan geçenler içindir.',
    },
    rel: ['ihram', 'hajj', 'umrah'],
  },
  {
    term: 'Təvaf', ar: 'الطواف', translit: 'Tawaf', cat: 'worship',
    def: {
      az: 'Kəbəni Həcərul-Əsvəddən başlayaraq sol tərəfdə qalmaqla yeddi dəfə dövrə vurmaq (Həcc 22:29). Növləri: qüdum, ifada (həccin rüknü), vida və ümrə təvafı.',
      en: 'Circling the Ka‘bah seven times, starting from the Black Stone and keeping it on one’s left (Al-Hajj 22:29). Its kinds include the arrival tawaf, tawaf al-ifadah (a pillar of Hajj), the farewell tawaf and the tawaf of Umrah.',
      ru: 'Семикратный обход Каабы, начиная от Чёрного камня и держа её слева (аль-Хадж 22:29). Виды: обход прибытия, обход ифада (столп хаджа), прощальный обход и обход умры.',
      ar: 'الدوران حول الكعبة سبعة أشواط مبتدئًا من الحجر الأسود جاعلًا البيت عن يساره (الحج: 29)، ومنه طواف القدوم وطواف الإفاضة (ركن الحج) وطواف الوداع وطواف العمرة.',
      tr: 'Kâbe\'yi Hacerülesved\'den başlayarak sol tarafta bırakıp yedi kez dolaşmak (Hac 22:29). Çeşitleri: kudüm, ifâda (haccın rüknü), veda ve umre tavafı.',
    },
    rel: ['kabah', 'say', 'al-hajar-al-aswad'],
  },
  {
    term: 'Səy', ar: 'السعي', translit: 'Sa\'y', cat: 'worship',
    def: {
      az: 'Səfa ilə Mərvə arasında yeddi dəfə gedib-gəlmək; Səfadan başlayıb Mərvədə bitir. Həcc və ümrənin rüknüdür (Bəqərə 2:158).',
      en: 'Walking seven times between Safa and Marwah, starting at Safa and ending at Marwah. It is a pillar of Hajj and Umrah (Al-Baqarah 2:158).',
      ru: 'Семикратное прохождение между Сафой и Марвой, начиная с Сафы и заканчивая Марвой. Это столп хаджа и умры (аль-Бакара 2:158).',
      ar: 'التردد بين الصفا والمروة سبعة أشواط، يبدأ بالصفا ويختم بالمروة، وهو ركن في الحج والعمرة (البقرة: 158).',
      tr: 'Safa ile Merve arasında yedi kez gidip gelmek; Safa\'dan başlar, Merve\'de biter. Hac ve umrenin rüknüdür (Bakara 2:158).',
    },
    rel: ['tawaf', 'hajj', 'umrah'],
  },
  {
    term: 'Ərəfə (vüquf)', ar: 'الوقوف بعرفة', translit: 'Arafah', cat: 'worship',
    def: {
      az: 'Zülhiccənin 9-cu günü zöhrdən sonra Ərəfat düzündə dayanmaq; həccin ən böyük rüknüdür: «Həcc Ərəfə günüdür» (Əbu Davud 1949). Hacı olmayanlar üçün bu günün orucu sünnədir.',
      en: 'Standing on the plain of Arafat on the 9th of Dhul-Hijjah after midday — the greatest pillar of Hajj: «Hajj is the day of Arafah» (Abu Dawud 1949). For those not on Hajj, fasting this day is Sunnah.',
      ru: 'Стояние на равнине Арафат 9 зуль-хиджжа после полудня — величайший столп хаджа: «Хадж — это день Арафа» (Абу Дауд 1949). Для не совершающих хадж пост в этот день — сунна.',
      ar: 'الوقوف بعرفة يوم التاسع من ذي الحجة بعد الزوال، وهو ركن الحج الأعظم: «الحج يوم عرفة» (أبو داود 1949)، ويُسن صيامه لغير الحاج.',
      tr: 'Zilhicce\'nin 9. günü öğleden sonra Arafat düzlüğünde durmak; haccın en büyük rüknüdür: «Hac Arafe günüdür» (Ebu Davud 1949). Hacı olmayanlar için bu günün orucu sünnettir.',
    },
    rel: ['hajj', 'rukn', 'dua'],
    lesson: 'dhul-hijjah-ten',
  },
  {
    term: 'Təlbiyə', ar: 'التلبية', translit: 'Talbiyah', cat: 'worship',
    def: {
      az: 'Ehramdan sonra ucadan deyilən zikr: «Ləbbeykəllahummə ləbbeyk, ləbbeykə lə şərikə ləkə ləbbeyk, innəl-həmdə vən-nimətə ləkə vəl-mulk, lə şərikə lək» (Buxari 1549). Tövhid elanıdır.',
      en: 'The words said aloud after entering ihram: «Labbayka Allahumma labbayk, labbayka la sharika laka labbayk, inna al-hamda wan-ni‘mata laka wal-mulk, la sharika lak» (Bukhari 1549). It is a declaration of tawhid.',
      ru: 'Слова, произносимые вслух после вступления в ихрам: «Ляббейка Аллахумма ляббейк, ляббейка ля шарика ляка ляббейк, инна-ль-хамда ва-н-ни‘мата ляка ва-ль-мульк, ля шарика лях» (Бухари 1549). Это провозглашение единобожия.',
      ar: 'قول المحرم: «لبيك اللهم لبيك، لبيك لا شريك لك لبيك، إن الحمد والنعمة لك والملك، لا شريك لك» (البخاري 1549)، وهي إعلان للتوحيد.',
      tr: 'İhramdan sonra yüksek sesle söylenen zikir: «Lebbeyk Allahümme lebbeyk, lebbeyke lâ şerîke leke lebbeyk, inne\'l-hamde ve\'n-ni\'mete leke ve\'l-mülk, lâ şerîke lek» (Buhari 1549). Tevhidin ilanıdır.',
    },
    rel: ['ihram', 'tawhid', 'hajj'],
  },
  {
    term: 'Rəmy (daş atmaq)', ar: 'رمي الجمار', translit: 'Ramy al-Jimar', cat: 'worship',
    def: {
      az: 'Həcdə Minada cəmrələrə yeddi kiçik daş atmaq: bayram günü yalnız böyük cəmrəyə (Əqəbə), təşriq günlərində isə zəvaldan sonra hər üç cəmrəyə. Hər daşla təkbir deyilir.',
      en: 'Throwing seven small pebbles at the pillars in Mina during Hajj: on the day of Eid only at Jamrat al-‘Aqabah, and on the days of Tashriq at all three after midday, saying takbir with each pebble.',
      ru: 'Бросание семи камешков в столбы в Мине во время хаджа: в день праздника — только в большой столб (Акаба), в дни ташрика — во все три после полудня, произнося такбир с каждым камешком.',
      ar: 'رمي الجمرات في منى بسبع حصيات: يوم النحر جمرة العقبة وحدها، وأيام التشريق الجمرات الثلاث بعد الزوال، مع التكبير مع كل حصاة.',
      tr: 'Hacda Mina\'da cemrelere yedi küçük taş atmak: bayram günü yalnız büyük cemreye (Akabe), teşrik günlerinde ise zevalden sonra üç cemreye de. Her taşla tekbir getirilir.',
    },
    rel: ['hajj', 'udhiyah', 'arafah'],
  },
  {
    term: 'Qurban', ar: 'الأضحية', translit: 'Udhiyah', cat: 'worship',
    def: {
      az: 'Qurban bayramı namazından sonra təşriq günlərinin sonuna qədər Allaha yaxınlaşmaq üçün kəsilən qoyun, keçi, inək və ya dəvə (Kövsər 108:2). Təkidli sünnədir; bəzi alimlərə görə imkanlıya vacibdir.',
      en: 'A sheep, goat, cow or camel slaughtered to draw near to Allah from after the Eid al-Adha prayer until the end of the days of Tashriq (Al-Kawthar 108:2). A confirmed Sunnah; some scholars hold it obligatory for those able.',
      ru: 'Овца, коза, корова или верблюд, закалываемые ради приближения к Аллаху после праздничной молитвы Курбан-байрама и до конца дней ташрика (аль-Каусар 108:2). Подтверждённая сунна; некоторые учёные считают её обязательной для состоятельного.',
      ar: 'ما يُذبح من بهيمة الأنعام تقربًا إلى الله من بعد صلاة عيد الأضحى إلى آخر أيام التشريق (الكوثر: 2)، وهي سنة مؤكدة، وأوجبها بعض العلماء على القادر.',
      tr: 'Kurban Bayramı namazından sonra teşrik günlerinin sonuna kadar Allah\'a yakınlaşmak için kesilen koyun, keçi, sığır veya deve (Kevser 108:2). Müekked sünnettir; bazı âlimlere göre imkânı olana vaciptir.',
    },
    rel: ['dhabihah', 'salat-al-id', 'aqiqah'],
    lesson: 'udhiyah',
  },
  {
    term: 'Əqiqə', ar: 'العقيقة', translit: 'Aqiqah', cat: 'worship',
    def: {
      az: 'Uşağın doğumuna görə şükür olaraq kəsilən heyvan; sünnə yeddinci gün kəsilməsi, uşağın başının qırxılması və ad qoyulmasıdır: «Hər uşaq əqiqəsinin girovudur» (Əbu Davud 2838). Oğlan üçün iki, qız üçün bir qoyun.',
      en: 'An animal slaughtered in gratitude for a child’s birth; the Sunnah is on the seventh day, together with shaving the head and naming: «Every child is held in pledge for his aqiqah» (Abu Dawud 2838). Two sheep for a boy, one for a girl.',
      ru: 'Животное, закалываемое в благодарность за рождение ребёнка; по сунне — на седьмой день, вместе с бритьём головы и наречением имени: «Каждый ребёнок — залог своей акыки» (Абу Дауд 2838). Две овцы за мальчика, одна за девочку.',
      ar: 'الذبيحة عن المولود شكرًا لله، والسنة ذبحها يوم السابع مع حلق رأسه وتسميته: «كل غلام رهينة بعقيقته» (أبو داود 2838)، عن الغلام شاتان وعن الجارية شاة.',
      tr: 'Çocuğun doğumuna şükür olarak kesilen hayvan; sünnet yedinci gün kesilmesi, çocuğun saçının tıraş edilmesi ve isim konmasıdır: «Her çocuk akikasına karşılık rehindir» (Ebu Davud 2838). Erkek için iki, kız için bir koyun.',
    },
    rel: ['udhiyah', 'dhabihah', 'shukr'],
    lesson: 'aqiqah',
  },
  {
    term: 'Bayram namazı', ar: 'صلاة العيد', translit: 'Salat al-Id', cat: 'worship',
    def: {
      az: 'Ramazan və Qurban bayramlarında səhər açıq yerdə (musalla) qılınan iki rükətli namaz; əlavə təkbirlərlə qılınır, ondan sonra xütbə oxunur. Azan və iqaməsi yoxdur.',
      en: 'The two-unit prayer on the mornings of Eid al-Fitr and Eid al-Adha, ideally in an open prayer ground, with extra takbirs and followed by a sermon. It has no adhan or iqamah.',
      ru: 'Молитва в два ракаата утром в праздники Ураза-байрам и Курбан-байрам, лучше на открытой площадке, с дополнительными такбирами; после неё — проповедь. Без азана и икамы.',
      ar: 'ركعتان صباح عيدي الفطر والأضحى في المصلى، بتكبيرات زوائد، والخطبة بعدها، بلا أذان ولا إقامة.',
      tr: 'Ramazan ve Kurban bayramlarında sabah açık alanda (musalla) kılınan iki rekâtlık namaz; ek tekbirlerle kılınır, ardından hutbe okunur. Ezanı ve kameti yoktur.',
    },
    rel: ['khutbah', 'zakat-al-fitr', 'udhiyah'],
    lesson: 'eid-prayer',
  },
  {
    term: 'Küsuf namazı', ar: 'صلاة الكسوف', translit: 'Salat al-Kusuf', cat: 'worship',
    def: {
      az: 'Günəş və ya ay tutulanda qılınan, hər rükətində iki qiyam və iki rüku olan namaz. «Günəş və ay Allahın ayələrindəndir… bunu görəndə Allaha dua edin, təkbir deyin, namaz qılın və sədəqə verin» (Buxari 1044).',
      en: 'The prayer at a solar or lunar eclipse, with two standings and two bowings in each unit. «The sun and moon are two of Allah’s signs… when you see this, supplicate to Allah, say takbir, pray and give charity» (Bukhari 1044).',
      ru: 'Молитва при солнечном или лунном затмении, с двумя стояниями и двумя поясными поклонами в каждом ракаате. «Солнце и луна — два знамения Аллаха… увидев это, взывайте к Аллаху, возвеличивайте Его, молитесь и раздавайте милостыню» (Бухари 1044).',
      ar: 'صلاة عند كسوف الشمس أو خسوف القمر، في كل ركعة قيامان وركوعان. «إن الشمس والقمر آيتان من آيات الله... فإذا رأيتم ذلك فادعوا الله وكبروا وصلوا وتصدقوا» (البخاري 1044).',
      tr: 'Güneş veya ay tutulduğunda kılınan, her rekâtında iki kıyam ve iki rükû bulunan namaz. «Güneş ve ay Allah\'ın ayetlerindendir… bunu görünce Allah\'a dua edin, tekbir getirin, namaz kılın ve sadaka verin» (Buhari 1044).',
    },
    rel: ['salah', 'dua', 'sadaqah'],
    lesson: 'kusuf-prayer',
  },
  {
    term: 'Yağış namazı', ar: 'صلاة الاستسقاء', translit: 'Salat al-Istisqa', cat: 'worship',
    def: {
      az: 'Quraqlıqda Allahdan yağış istəmək üçün musallada qılınan iki rükətli namaz; Peyğəmbər ﷺ qibləyə dönüb dua etmiş və ridasını çevirmişdir (Buxari 1012). Tövbə və istiğfarla birlikdə edilir.',
      en: 'A two-unit prayer at the prayer ground to ask Allah for rain in drought; the Prophet ﷺ faced the qiblah in supplication and turned his cloak inside out (Bukhari 1012). It is accompanied by repentance and seeking forgiveness.',
      ru: 'Молитва в два ракаата на молельной площадке с просьбой к Аллаху о дожде во время засухи; Пророк ﷺ обратился к кибле с мольбой и вывернул свой плащ (Бухари 1012). Сопровождается покаянием и просьбой о прощении.',
      ar: 'ركعتان في المصلى عند الجدب طلبًا للسقيا، وقد استقبل النبي ﷺ القبلة يدعو وقلب رداءه (البخاري 1012)، ويسبقها التوبة والاستغفار.',
      tr: 'Kuraklıkta Allah\'tan yağmur istemek için musallada kılınan iki rekâtlık namaz; Peygamber ﷺ kıbleye dönüp dua etmiş ve ridasını ters çevirmiştir (Buhari 1012). Tövbe ve istiğfarla birlikte yapılır.',
    },
    rel: ['dua', 'istighfar', 'tawbah'],
    lesson: 'istisqa-prayer',
  },
  {
    term: 'İstixarə', ar: 'الاستخارة', translit: 'Istikharah', cat: 'worship',
    def: {
      az: 'Mübah bir işdə tərəddüd edəndə iki rükət namazdan sonra Allahdan xeyirlisini seçməyi diləmək; duası Sünnədə sabitdir (Buxari 6382). Nəticə yuxuya bağlı deyil — sonra işə təvəkküllə davam edilir.',
      en: 'Asking Allah to choose what is best, after two units of prayer, when hesitating over a permissible matter; its supplication is established in the Sunnah (Bukhari 6382). It does not depend on a dream — one then proceeds with reliance on Allah.',
      ru: 'Просьба к Аллаху выбрать лучшее после двух ракаатов молитвы, когда колеблешься в дозволенном деле; её мольба утверждена в Сунне (Бухари 6382). Результат не зависит от сна — затем действуют, уповая на Аллаха.',
      ar: 'طلب الخيرة من الله بعد ركعتين عند التردد في أمر مباح، ودعاؤها ثابت في السنة (البخاري 6382)، ولا يُشترط لها رؤيا، بل يمضي العبد متوكلًا على الله.',
      tr: 'Mubah bir işte tereddüt edince iki rekât namazdan sonra Allah\'tan hayırlısını seçmesini istemek; duası Sünnet\'te sabittir (Buhari 6382). Sonuç rüyaya bağlı değildir — sonra işe tevekkülle devam edilir.',
    },
    rel: ['dua', 'tawakkul', 'mubah'],
    lesson: 'istikhara',
  },
  {
    term: 'Zikr', ar: 'الذكر', translit: 'Dhikr', cat: 'worship',
    def: {
      az: 'Allahı qəlb və dillə anmaq: təsbih, təhmid, təhlil, təkbir, Quran oxumaq və Sünnədə gələn zikrlər. «Bilin ki, qəlblər yalnız Allahın zikri ilə rahatlıq tapar» (Rəd 13:28). Bidət zikr formaları buraya daxil deyil.',
      en: 'Remembering Allah with the heart and tongue: glorifying, praising, declaring His oneness and greatness, reciting the Quran and the words reported in the Sunnah. «Surely in the remembrance of Allah do hearts find rest» (Ar-Ra‘d 13:28). Innovated forms of dhikr are not included.',
      ru: 'Поминание Аллаха сердцем и языком: прославление, восхваление, провозглашение единственности и величия, чтение Корана и слова из Сунны. «Воистину, при поминании Аллаха успокаиваются сердца» (ар-Ра‘д 13:28). Нововведённые формы поминания сюда не относятся.',
      ar: 'ذكر الله بالقلب واللسان: التسبيح والتحميد والتهليل والتكبير وتلاوة القرآن والأذكار الواردة في السنة. ﴿أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ﴾ (الرعد: 28)، ولا يدخل فيه الذكر المبتدع.',
      tr: 'Allah\'ı kalp ve dille anmak: tesbih, tahmid, tehlil, tekbir, Kur\'an okumak ve Sünnet\'te gelen zikirler. «Bilin ki kalpler ancak Allah\'ı anmakla huzur bulur» (Ra\'d 13:28). Bidat zikir şekilleri buna dahil değildir.',
    },
    rel: ['adhkar-as-salah', 'dua', 'istighfar', 'bidah'],
  },
  {
    term: 'Dua', ar: 'الدعاء', translit: 'Dua', cat: 'worship',
    def: {
      az: 'Allaha yalvarmaq, Ondan istəmək; ibadətin özüdür: «Dua ibadətdir» (Əbu Davud 1479). Yalnız Allaha edilir — ölüyə və ya qaib birinə dua etmək şirkdir.',
      en: 'Calling upon Allah and asking of Him; it is worship itself: «Supplication is worship» (Abu Dawud 1479). It is made to Allah alone — calling upon the dead or the absent is shirk.',
      ru: 'Мольба к Аллаху, просьба к Нему; это само поклонение: «Мольба — это поклонение» (Абу Дауд 1479). Обращается только к Аллаху — мольба к умершим или отсутствующим является ширком.',
      ar: 'سؤال الله والتضرع إليه، وهو العبادة: «الدعاء هو العبادة» (أبو داود 1479)، ولا يُصرف إلا لله، ودعاء الأموات والغائبين شرك.',
      tr: 'Allah\'a yalvarmak, O\'ndan istemek; ibadetin ta kendisidir: «Dua ibadettir» (Ebu Davud 1479). Yalnız Allah\'a yapılır — ölüye veya orada olmayana dua etmek şirktir.',
    },
    rel: ['ibadah', 'tawassul', 'shirk', 'dhikr'],
  },
  {
    term: 'Namazdan sonrakı zikrlər', ar: 'أذكار الصلاة', translit: 'Adhkar as-Salah', cat: 'worship',
    def: {
      az: 'Fərz namazdan sonra Sünnədə gələn zikrlər: üç dəfə istiğfar, «Allahummə əntəs-salam…», 33 dəfə «Subhanəllah», 33 «Əlhəmdulillah», 33 «Allahu əkbər» və «Lə iləhə illəllahu vəhdəhu…» ilə yüzə tamamlamaq (Müslim 597), Ayətul-Kürsi və s.',
      en: 'The remembrances reported after the obligatory prayer: seeking forgiveness three times, «Allahumma anta as-salam…», «Subhan Allah» 33 times, «Alhamdulillah» 33, «Allahu akbar» 33, completing a hundred with «La ilaha illallahu wahdahu…» (Muslim 597), Ayat al-Kursi and others.',
      ru: 'Поминания после обязательной молитвы, переданные в Сунне: трижды просить прощения, «Аллахумма анта-с-салям…», 33 раза «Субхана-Ллах», 33 «Аль-хамду ли-Ллях», 33 «Аллаху акбар» и до сотни «Ля иляха илля-Ллаху вахдаху…» (Муслим 597), аят аль-Курси и др.',
      ar: 'الأذكار الواردة بعد الفريضة: الاستغفار ثلاثًا، و«اللهم أنت السلام...»، والتسبيح ثلاثًا وثلاثين والتحميد ثلاثًا وثلاثين والتكبير ثلاثًا وثلاثين وتمام المائة «لا إله إلا الله وحده لا شريك له...» (مسلم 597)، وآية الكرسي وغيرها.',
      tr: 'Farz namazdan sonra Sünnet\'te gelen zikirler: üç kez istiğfar, «Allahümme ente\'s-selâm…», 33 «Sübhânallah», 33 «Elhamdülillah», 33 «Allahu ekber» ve «Lâ ilâhe illallahu vahdehû…» ile yüze tamamlamak (Müslim 597), Âyetü\'l-Kürsî vb.',
    },
    rel: ['dhikr', 'salah', 'istighfar'],
    lesson: 'adhkar-after-salah',
  },
  {
    term: 'Sütrə', ar: 'السترة', translit: 'Sutrah', cat: 'worship',
    def: {
      az: 'Namaz qılanın önünə qoyduğu divar, sütun, çubuq kimi maneə; önündən keçməyin qarşısını alır. «Biriniz namaz qılanda sütrəyə doğru qılsın və ona yaxın dursun» (Əbu Davud 698).',
      en: 'An object such as a wall, pillar or stick placed in front of one praying, which prevents others passing in front. «When one of you prays, let him pray towards a sutrah and draw close to it» (Abu Dawud 698).',
      ru: 'Преграда перед молящимся — стена, колонна, палка и т. п., не дающая проходить перед ним. «Когда кто-то из вас молится, пусть молится по направлению к преграде и приблизится к ней» (Абу Дауд 698).',
      ar: 'ما يجعله المصلي أمامه من جدار أو سارية أو عصا ليمنع المرور بين يديه. «إذا صلى أحدكم فليصل إلى سترة وليدن منها» (أبو داود 698).',
      tr: 'Namaz kılanın önüne koyduğu duvar, sütun, değnek gibi engel; önünden geçilmesini önler. «Biriniz namaz kılınca bir sütreye doğru kılsın ve ona yaklaşsın» (Ebu Davud 698).',
    },
    rel: ['salah', 'qiblah', 'salat-al-jamaah'],
  },
  {
    term: 'Camaat namazı', ar: 'صلاة الجماعة', translit: 'Salat al-Jama\'ah', cat: 'worship',
    def: {
      az: 'Fərz namazı imamın arxasında birlikdə qılmaq. «Camaat namazı tək qılınan namazdan iyirmi yeddi dərəcə üstündür» (Buxari 645). Güclü rəyə görə üzrsüz kişilərə məsciddə vacibdir.',
      en: 'Praying the obligatory prayer together behind an imam. «Prayer in congregation is twenty-seven degrees better than prayer alone» (Bukhari 645). According to the stronger view it is obligatory on men in the mosque unless excused.',
      ru: 'Совместное совершение обязательной молитвы за имамом. «Коллективная молитва превосходит одиночную на двадцать семь степеней» (Бухари 645). По более сильному мнению, она обязательна для мужчин в мечети, если нет уважительной причины.',
      ar: 'أداء الفريضة جماعةً خلف إمام. «صلاة الجماعة تفضل صلاة الفذ بسبع وعشرين درجة» (البخاري 645)، وهي واجبة على الرجال في المسجد على الراجح إلا لعذر.',
      tr: 'Farz namazı imamın arkasında birlikte kılmak. «Cemaatle kılınan namaz tek başına kılınandan yirmi yedi derece üstündür» (Buhari 645). Daha güçlü görüşe göre özrü olmayan erkeklere mescitte vaciptir.',
    },
    rel: ['salah', 'jumuah', 'iqamah'],
  },
  {
    term: 'İstiğfar', ar: 'الاستغفار', translit: 'Istighfar', cat: 'worship',
    def: {
      az: 'Allahdan günahları bağışlamasını və örtməsini diləmək; ən kamili tövbə ilə birlikdə olanıdır. Nuh (ə) qövmünə demişdi: «Rəbbinizdən bağışlanma diləyin, çünki O, çox bağışlayandır» (Nuh 71:10).',
      en: 'Asking Allah to forgive and cover one’s sins; it is most complete when joined with repentance. Nuh said to his people: «Seek forgiveness of your Lord; indeed He is ever Forgiving» (Nuh 71:10).',
      ru: 'Просьба к Аллаху простить и скрыть грехи; совершеннее всего, когда сопровождается покаянием. Нух сказал своему народу: «Просите прощения у вашего Господа, ведь Он — Прощающий» (Нух 71:10).',
      ar: 'طلب المغفرة من الله وستر الذنوب، وأكمله ما قارنته التوبة. قال نوح عليه السلام: ﴿ٱسْتَغْفِرُوا۟ رَبَّكُمْ إِنَّهُۥ كَانَ غَفَّارًا﴾ (نوح: 10).',
      tr: 'Allah\'tan günahları bağışlamasını ve örtmesini dilemek; en kâmili tövbeyle birlikte olanıdır. Nuh (a.s.) kavmine şöyle demişti: «Rabbinizden bağışlanma dileyin, çünkü O çok bağışlayandır» (Nuh 71:10).',
    },
    rel: ['tawbah', 'dhikr', 'dua'],
  },
]
