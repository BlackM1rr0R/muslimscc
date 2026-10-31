// ═══════════════════════════════════════════════════════
// İslami söz lüğəti — HƏDİS ELMİ (cat: 'hadith') və QURAN ELMLƏRİ
// (cat: 'quran') terminləri (5 dil).
//
// Hədis terminləri hədis üsulunun klassik qaydalarına uyğundur (İbn
// əs-Salah, «əl-Muqəddimə»; İbn Həcər, «Nuxbətul-Fikər»). Əhli-Sünnəyə görə
// səhih ahad hədis həm əqidədə, həm hökmlərdə dəlildir. Quran Allahın
// yaradılmamış kəlamıdır.
// Ayələr api.quran.com-dan, hədis nömrələri fawazahmed0/hadith-api
// (ara-bukhari, ara-muslim — "arabicnumber", yəni Fuad Abdülbaqi nömrəsi)
// ilə yoxlanılıb. Yoxlanılmayan istinad yazılmır.
//
// Sahələr: term (az), ar, translit, cat, def{az,en,ru,ar,tr},
// rel — əlaqəli terminlərin id-ləri (translit → kiçik hərf, apostrofsuz,
// boşluq → "-"), lesson — /learn/<slug> dərsi (varsa).
// ═══════════════════════════════════════════════════════

export const GLOSSARY_HADITH_QURAN = [
  // ── Hədis elmi ──
  {
    term: 'Mustələhul-hədis', ar: 'مصطلح الحديث', translit: 'Mustalah al-Hadith', cat: 'hadith',
    def: {
      az: 'Hədisin sənədini və mətnini araşdırıb onun qəbul və ya rədd edilməsini müəyyən edən qaydalar elmi (hədis üsulu). Bu elm sayəsində Peyğəmbərə ﷺ aid edilən sözlərin səhihi zəifindən və uydurmasından ayrılır.',
      en: 'The science of the rules by which a hadith’s chain and text are examined to decide whether it is accepted or rejected (usul al-hadith). Through it, what is authentically from the Prophet ﷺ is distinguished from the weak and the fabricated.',
      ru: 'Наука о правилах, по которым исследуются цепочка и текст хадиса, чтобы определить, принимается он или отвергается (усуль аль-хадис). Благодаря ей достоверное от Пророка ﷺ отличают от слабого и выдуманного.',
      ar: 'علم بقواعد يُعرف بها حال السند والمتن من حيث القبول والرد، وبه يُميَّز الصحيح المنسوب إلى النبي ﷺ من الضعيف والموضوع.',
      tr: 'Hadisin senedini ve metnini inceleyerek kabul mü ret mi edileceğini belirleyen kurallar ilmi (hadis usulü). Bu ilim sayesinde Peygamber\'e ﷺ nispet edilen sözlerin sahihi, zayıfından ve uydurmasından ayrılır.',
    },
    rel: ['isnad', 'matn', 'sahih', 'al-jarh-wat-tadil'],
    lesson: 'mustalah',
  },
  {
    term: 'Mərfu', ar: 'المرفوع', translit: 'Marfu\'', cat: 'hadith',
    def: {
      az: 'Peyğəmbərə ﷺ aid edilən söz, əməl, təqrir və ya vəsf. Sənədin bitişik olub-olmamasından asılı olmayaraq, mətn kimə aid edildiyinə görə belə adlanır.',
      en: 'A saying, action, tacit approval or description attributed to the Prophet ﷺ. The name refers to whom the text is attributed, regardless of whether the chain is connected.',
      ru: 'Слово, действие, одобрение или описание, возводимое к Пророку ﷺ. Название указывает, к кому возводится текст, независимо от того, непрерывна ли цепочка.',
      ar: 'ما أُضيف إلى النبي ﷺ من قول أو فعل أو تقرير أو صفة، سواء اتصل سنده أم لا.',
      tr: 'Peygamber\'e ﷺ nispet edilen söz, fiil, takrir veya vasıf. Senedin bitişik olup olmamasına bakılmaksızın, metnin kime nispet edildiğine göre bu adı alır.',
    },
    rel: ['mawquf', 'maqtu', 'hadith', 'sunnah'],
    lesson: 'mustalah',
  },
  {
    term: 'Məvquf', ar: 'الموقوف', translit: 'Mawquf', cat: 'hadith',
    def: {
      az: 'Bir səhabəyə aid edilən söz və ya əməl (Peyğəmbərə ﷺ qaldırılmayan). Səhabənin rəyə əsaslanmayan qeyb xəbəri kimi bəzi hallarda hökmcə mərfu sayılır.',
      en: 'A saying or action attributed to a Companion, not raised to the Prophet ﷺ. In some cases, such as a Companion reporting unseen matters that cannot come from opinion, it takes the ruling of marfu‘.',
      ru: 'Слово или действие, возводимое к сподвижнику, а не к Пророку ﷺ. В некоторых случаях, например когда сподвижник сообщает о сокровенном, что не может исходить из мнения, оно имеет силу марфу‘.',
      ar: 'ما أُضيف إلى الصحابي من قول أو فعل ولم يُرفع إلى النبي ﷺ. وقد يكون له حكم الرفع، كإخبار الصحابي عن أمر غيبي لا مجال للرأي فيه.',
      tr: 'Bir sahabeye nispet edilen söz veya fiil (Peygamber\'e ﷺ ulaştırılmayan). Sahabenin görüşle söylenemeyecek gaybî bir haber vermesi gibi bazı durumlarda hüküm bakımından merfû sayılır.',
    },
    rel: ['marfu', 'maqtu', 'athar', 'sahabah'],
    lesson: 'mustalah',
  },
  {
    term: 'Məqtu', ar: 'المقطوع', translit: 'Maqtu\'', cat: 'hadith',
    def: {
      az: 'Tabiinə və ya ondan sonrakı nəslə aid edilən söz və ya əməl. Sənədi qırıq olan «münqəti» ilə qarışdırılmamalıdır: məqtu mətnin kimə aid olduğunu bildirir.',
      en: 'A saying or action attributed to a Successor (tabi‘i) or someone after him. It should not be confused with munqati‘ (a broken chain): maqtu‘ describes to whom the text is attributed.',
      ru: 'Слово или действие, возводимое к табиину или к кому-то после него. Не следует путать с мункати‘ (прерванная цепочка): макту‘ указывает, к кому относится текст.',
      ar: 'ما أُضيف إلى التابعي فمن دونه من قول أو فعل. ولا يُخلط بالمنقطع، فالمقطوع وصف للمتن والمنقطع وصف للسند.',
      tr: 'Tâbiîne veya ondan sonrakilere nispet edilen söz veya fiil. Senedi kopuk olan «munkatı» ile karıştırılmamalıdır: maktû metnin kime ait olduğunu bildirir.',
    },
    rel: ['mawquf', 'marfu', 'tabiun', 'munqati'],
    lesson: 'mustalah',
  },
  {
    term: 'Ğərib', ar: 'الغريب', translit: 'Gharib', cat: 'hadith',
    def: {
      az: 'Sənədin hansısa təbəqəsində yalnız bir ravinin rəvayət etdiyi hədis (fərd). Ğəriblik hədisin zəif olması demək deyil: «Əməllər niyyətlərə görədir» hədisi kimi bir çox səhih hədis ğəribdir və Əhli-Sünnəyə görə səhih ahad hədis əqidədə də, hökmlərdə də dəlildir.',
      en: 'A hadith narrated by only one narrator at some level of its chain (fard). Being gharib does not mean being weak: many authentic hadiths, such as «Actions are by intentions», are gharib, and according to Ahl as-Sunnah an authentic ahad hadith is proof in both creed and rulings.',
      ru: 'Хадис, который на каком-либо уровне цепочки передаёт лишь один передатчик (фард). Это не означает слабость: многие достоверные хадисы, например «Поистине, дела — по намерениям», являются гариб, а по Ахль ас-Сунна достоверный ахад — довод и в вероубеждении, и в законоположениях.',
      ar: 'ما انفرد بروايته راوٍ واحد في طبقة من طبقات السند، ويسمى الفرد. والغرابة لا تعني الضعف، فكثير من الصحيح غريب كحديث «إنما الأعمال بالنيات»، والآحاد الصحيح عند أهل السنة حجة في العقائد والأحكام.',
      tr: 'Senedin herhangi bir tabakasında yalnız bir ravinin rivayet ettiği hadis (ferd). Garip olmak zayıf olmak demek değildir: «Ameller niyetlere göredir» hadisi gibi pek çok sahih hadis gariptir ve Ehl-i Sünnet\'e göre sahih âhâd hadis hem akidede hem hükümlerde delildir.',
    },
    rel: ['ahad', 'aziz', 'mashhur', 'mutawatir'],
    lesson: 'mustalah',
  },
  {
    term: 'Əziz', ar: 'العزيز', translit: 'Aziz', cat: 'hadith',
    def: {
      az: 'Sənədin heç bir təbəqəsində ravilərinin sayı ikidən az olmayan hədis. Ahad hədisin növlərindəndir; səhih olduqda onunla əməl edilir.',
      en: 'A hadith whose narrators number no fewer than two at every level of the chain. It is a type of ahad hadith; when authentic it is acted upon.',
      ru: 'Хадис, число передатчиков которого ни на одном уровне цепочки не меньше двух. Это вид ахад; если он достоверен, по нему действуют.',
      ar: 'ما لا يقل رواته عن اثنين في جميع طبقات السند، وهو من أقسام الآحاد، ويُعمل به إذا صح.',
      tr: 'Senedin hiçbir tabakasında ravi sayısı ikiden az olmayan hadis. Âhâd hadisin çeşitlerindendir; sahih olduğunda onunla amel edilir.',
    },
    rel: ['gharib', 'mashhur', 'ahad'],
    lesson: 'mustalah',
  },
  {
    term: 'Məşhur', ar: 'المشهور', translit: 'Mashhur', cat: 'hadith',
    def: {
      az: 'Hər təbəqədə üç və ya daha çox ravinin rəvayət etdiyi, lakin mütəvatir dərəcəsinə çatmayan hədis (müstəfiz də deyilir). Dildə «məşhur» sözü hədisin xalq arasında tanınmasına da deyilir — bu isə onun səhih olduğunu göstərmir.',
      en: 'A hadith narrated by three or more narrators at every level, yet not reaching the level of mutawatir (also called mustafid). In common speech a hadith may be «well-known» among people — which says nothing about its authenticity.',
      ru: 'Хадис, который на каждом уровне передают трое и более, но не достигающий степени мутаватир (его также называют мустафид). В обиходе «известным» называют и хадис, популярный среди людей, — что не говорит о его достоверности.',
      ar: 'ما رواه ثلاثة فأكثر في كل طبقة ما لم يبلغ حد التواتر، ويسمى المستفيض. ويُطلق المشهور أيضًا على ما اشتهر على الألسنة، وهذا لا يدل على صحته.',
      tr: 'Her tabakada üç veya daha fazla ravinin rivayet ettiği, ancak mütevatir derecesine ulaşmayan hadis (müstefîz de denir). Halk arasında yaygın olan hadise de «meşhur» denir; bu, onun sahih olduğunu göstermez.',
    },
    rel: ['mutawatir', 'aziz', 'gharib', 'ahad'],
    lesson: 'mustalah',
  },
  {
    term: 'Tədlis', ar: 'التدليس', translit: 'Tadlis', cat: 'hadith',
    def: {
      az: 'Ravinin sənəddəki qüsuru gizlətməsi: məsələn, görüşdüyü şeyxdən onun özündən eşitmədiyi hədisi «ondan» kimi eşitmə ehtimallı ifadə ilə rəvayət etməsi. Belə ravi (müdəllis) «eşitdim» deyib açıq bildirməyincə rəvayəti ehtiyatla qəbul edilir.',
      en: 'A narrator concealing a defect in the chain: for example, narrating from a shaykh he met something he did not hear from him, using a wording such as «from him» that only suggests hearing. Such a narrator (mudallis) is accepted with caution unless he states clearly «I heard».',
      ru: 'Сокрытие передатчиком изъяна в цепочке: например, он передаёт от шейха, с которым встречался, то, чего не слышал от него, выражением «от него», лишь намекающим на слушание. Передачу такого передатчика (мудаллис) принимают с осторожностью, пока он прямо не скажет «я слышал».',
      ar: 'إخفاء عيب في الإسناد وتحسين ظاهره، كأن يروي الراوي عمن لقيه ما لم يسمعه منه بصيغة تحتمل السماع مثل «عن». ولا يُقبل من المدلّس حتى يصرّح بالسماع.',
      tr: 'Ravinin senetteki bir kusuru gizlemesi: örneğin görüştüğü bir hocadan, ondan duymadığı bir hadisi «ondan» gibi duymayı ima eden bir ifadeyle rivayet etmesi. Böyle bir ravinin (müdellis) rivayeti, «işittim» diye açıkça belirtmedikçe ihtiyatla karşılanır.',
    },
    rel: ['isnad', 'illah', 'thiqah', 'muttasil'],
    lesson: 'mustalah',
  },
  {
    term: 'Mö\'dal', ar: 'المعضل', translit: 'Mu\'dal', cat: 'hadith',
    def: {
      az: 'Sənədinin ortasından iki və ya daha çox ravi ardıcıl olaraq düşmüş hədis. Qırıq sənədin ən ağır növlərindəndir və zəif hədislər sırasındadır.',
      en: 'A hadith from whose chain two or more consecutive narrators have dropped. It is among the most severe kinds of broken chains and is classed as weak.',
      ru: 'Хадис, из цепочки которого подряд выпали два или более передатчика. Это один из самых тяжёлых видов прерванной цепочки; такой хадис относится к слабым.',
      ar: 'ما سقط من إسناده اثنان فأكثر على التوالي، وهو من أشد أنواع الانقطاع، ومن قسم الضعيف.',
      tr: 'Senedinden art arda iki veya daha fazla ravinin düştüğü hadis. Kopuk senedin en ağır türlerindendir ve zayıf hadisler arasında yer alır.',
    },
    rel: ['munqati', 'mursal', 'muallaq', 'daif'],
    lesson: 'mustalah',
  },
  {
    term: 'Şazz', ar: 'الشاذ', translit: 'Shadhdh', cat: 'hadith',
    def: {
      az: 'Etibarlı ravinin özündən daha etibarlı və ya daha çox raviyə zidd rəvayəti. Səhih hədisin şərtlərindən biri şazz olmamasıdır; ziddiyyətdə üstün olan rəvayət «məhfuz» adlanır.',
      en: 'A narration by an acceptable narrator that contradicts one who is more reliable or more numerous. Absence of shudhudh is a condition of a sahih hadith; the preferred narration in such a conflict is called mahfuz.',
      ru: 'Передача приемлемого передатчика, противоречащая передаче более надёжного или большего числа передатчиков. Отсутствие шузуза — условие достоверного хадиса; предпочтённая передача называется махфуз.',
      ar: 'ما رواه المقبول مخالفًا لمن هو أوثق منه أو أكثر عددًا. وانتفاء الشذوذ من شروط الصحيح، ويقابله المحفوظ.',
      tr: 'Güvenilir bir ravinin, kendisinden daha güvenilir veya daha kalabalık ravilere aykırı rivayeti. Sahih hadisin şartlarından biri şaz olmamasıdır; tercih edilen rivayete «mahfuz» denir.',
    },
    rel: ['munkar', 'illah', 'sahih', 'thiqah'],
    lesson: 'mustalah',
  },
  {
    term: 'Münkər', ar: 'المنكر', translit: 'Munkar', cat: 'hadith',
    def: {
      az: 'Zəif ravinin etibarlı ravilərə zidd rəvayəti (İbn Həcərin tərifi); bəzi alimlər ciddi zəif ravinin tək qaldığı rəvayəti də belə adlandırır. Münkər hədis rədd edilir; üstün rəvayət «məruf» adlanır.',
      en: 'A narration by a weak narrator contradicting reliable ones (Ibn Hajar’s definition); some scholars also apply it to what a seriously weak narrator alone reports. A munkar hadith is rejected; the preferred narration is called ma‘ruf.',
      ru: 'Передача слабого передатчика, противоречащая надёжным (определение Ибн Хаджара); некоторые учёные так называют и то, что передал лишь один сильно слабый передатчик. Мункар отвергается; предпочтённая передача называется ма‘руф.',
      ar: 'ما رواه الضعيف مخالفًا للثقات (على تعريف ابن حجر)، وبعضهم يطلقه على ما تفرد به من فحش غلطه. وهو مردود، ويقابله المعروف.',
      tr: 'Zayıf bir ravinin güvenilir ravilere aykırı rivayeti (İbn Hacer\'in tanımı); bazı âlimler ağır zayıf bir ravinin tek başına rivayet ettiğini de böyle adlandırır. Münker hadis reddedilir; tercih edilen rivayete «ma\'ruf» denir.',
    },
    rel: ['shadhdh', 'daif', 'al-jarh-wat-tadil'],
    lesson: 'mustalah',
  },
  {
    term: 'İllət', ar: 'العلة', translit: 'Illah', cat: 'hadith',
    def: {
      az: 'Zahirdə səhih görünən hədisin səhihliyini pozan gizli qüsur — məsələn, qırıq sənədin bitişik, məvqufun mərfu kimi rəvayət edilməsi. Belə hədis «müəlləl» adlanır; illəti yalnız yolları toplayıb müqayisə edən mahir hədis alimləri aşkar edir.',
      en: 'A hidden defect that undermines a hadith which looks authentic on the surface — e.g. a broken chain narrated as connected, or a mawquf narrated as marfu‘. Such a hadith is called mu‘allal; only expert critics who gather and compare all routes detect it.',
      ru: 'Скрытый изъян, порочащий хадис, внешне выглядящий достоверным, — например, прерванная цепочка передана как непрерывная или маукуф — как марфу‘. Такой хадис называется му‘аллаль; изъян выявляют лишь знатоки, собирающие и сравнивающие все пути.',
      ar: 'سبب خفي غامض يقدح في صحة الحديث مع أن ظاهره السلامة، كوصل المرسل أو رفع الموقوف. ويسمى الحديث معلولًا أو معلًّا، ولا يكشفها إلا الحفاظ بجمع الطرق والموازنة بينها.',
      tr: 'Görünüşte sahih olan bir hadisin sıhhatini bozan gizli kusur — örneğin kopuk senedin bitişik, mevkufun merfû olarak rivayet edilmesi. Böyle hadise «muallel» denir; illeti ancak bütün yolları toplayıp karşılaştıran usta hadisçiler fark eder.',
    },
    rel: ['shadhdh', 'tadlis', 'sahih', 'mudraj'],
    lesson: 'mustalah',
  },
  {
    term: 'Müdrəc', ar: 'المدرج', translit: 'Mudraj', cat: 'hadith',
    def: {
      az: 'Sənədinə və ya mətninə ravinin öz sözü ayırd edilmədən qarışmış hədis — məsələn, ravinin izahının Peyğəmbərin ﷺ sözü kimi görünməsi. İdrac yolların müqayisəsi ilə aşkar edilir və əlavə hissə Peyğəmbərə ﷺ aid edilmir.',
      en: 'A hadith into whose chain or text a narrator’s own words have been inserted without distinction — e.g. a narrator’s explanation appearing as the Prophet’s ﷺ words. The insertion (idraj) is detected by comparing routes, and the added part is not attributed to the Prophet ﷺ.',
      ru: 'Хадис, в цепочку или текст которого без разграничения вошли слова передатчика — например, его пояснение выглядит как слова Пророка ﷺ. Вставка (идрадж) выявляется сравнением путей, и добавленная часть не приписывается Пророку ﷺ.',
      ar: 'ما أُدخل في سنده أو متنه ما ليس منه بلا فصل، ككلام الراوي يُروى متصلًا بكلام النبي ﷺ فيُظن منه. ويُعرف الإدراج بجمع الطرق، ولا يُنسب المدرج إلى النبي ﷺ.',
      tr: 'Senedine veya metnine ravinin kendi sözünün ayırt edilmeden karıştığı hadis — örneğin ravinin açıklamasının Peygamber\'in ﷺ sözü gibi görünmesi. İdrâc yolların karşılaştırılmasıyla anlaşılır ve eklenen kısım Peygamber\'e ﷺ nispet edilmez.',
    },
    rel: ['matn', 'illah', 'mudtarib'],
    lesson: 'mustalah',
  },
  {
    term: 'Müztərib', ar: 'المضطرب', translit: 'Mudtarib', cat: 'hadith',
    def: {
      az: 'Bərabər güclü, bir-birinə zidd və heç birinə üstünlük verilə bilməyən şəkillərdə rəvayət edilmiş hədis. İdtirab ravinin zəbtinin zəifliyinə dəlalət edir və hədisi zəif edir; rəvayətlərdən biri üstün tutularsa, idtirab aradan qalxır.',
      en: 'A hadith narrated in conflicting versions of equal strength, none of which can be preferred. Such inconsistency (idtirab) indicates poor precision and makes the hadith weak; if one version can be preferred, the idtirab is removed.',
      ru: 'Хадис, переданный в противоречащих друг другу вариантах равной силы, ни одному из которых нельзя отдать предпочтение. Такая противоречивость (идтираб) указывает на слабость точности и делает хадис слабым; если один вариант предпочтительнее, идтираб снимается.',
      ar: 'ما رُوي على أوجه مختلفة متساوية في القوة لا يمكن الترجيح بينها ولا الجمع. والاضطراب يدل على عدم الضبط فيُضعَّف به الحديث، فإن أمكن الترجيح زال الاضطراب.',
      tr: 'Birbirine aykırı, eşit güçte ve hiçbiri tercih edilemeyen şekillerde rivayet edilmiş hadis. Iztırab, ravinin zaptındaki zayıflığa işaret eder ve hadisi zayıf kılar; rivayetlerden biri tercih edilebilirse ıztırab ortadan kalkar.',
    },
    rel: ['dabt', 'illah', 'daif'],
    lesson: 'mustalah',
  },
  {
    term: 'Cərh və Tədil', ar: 'الجرح والتعديل', translit: 'Al-Jarh wat-Ta\'dil', cat: 'hadith',
    def: {
      az: 'Ravilərin dindarlığını və dəqiqliyini araşdırıb onların rəvayətinin qəbul və ya rədd edilməsini müəyyən edən elm. Cərh — ravidəki qüsurun bəyanı, tədil — onun etibarlı olduğunun bəyanıdır; sələf bunu qeybət deyil, dini qorumaq üçün nəsihət sayıb.',
      en: 'The science of examining narrators’ integrity and precision to decide whether their reports are accepted or rejected. Jarh is stating a narrator’s defect, ta‘dil is declaring him reliable; the Salaf regarded this not as backbiting but as sincere advice to protect the religion.',
      ru: 'Наука, исследующая благочестие и точность передатчиков, чтобы определить, принимаются ли их передачи. Джарх — указание на изъян передатчика, та‘диль — признание его надёжным; саляф считали это не злословием, а искренним советом ради защиты религии.',
      ar: 'علم يُبحث فيه عن أحوال الرواة من حيث قبول روايتهم أو ردها. فالجرح وصف الراوي بما يقتضي رد روايته، والتعديل تزكيته بما يقتضي قبولها، وعدّه السلف نصيحة لحفظ الدين لا غيبة.',
      tr: 'Ravilerin dindarlığını ve hıfzını inceleyerek rivayetlerinin kabul mü ret mi edileceğini belirleyen ilim. Cerh, ravideki kusuru açıklamak; ta\'dil, onun güvenilir olduğunu bildirmektir. Selef bunu gıybet değil, dini korumak için nasihat saymıştır.',
    },
    rel: ['thiqah', 'adalah', 'dabt', 'rawi'],
    lesson: 'mustalah',
  },
  {
    term: 'Siqə', ar: 'الثقة', translit: 'Thiqah', cat: 'hadith',
    def: {
      az: 'Həm ədalətli (dindar və mürüvvətli), həm də zəbtli (dəqiq yadda saxlayan) ravi. Cərh-tədil alimlərinin ən çox işlətdiyi tədil dərəcələrindəndir; siqə ravilərin bitişik sənədlə gələn, şazz və illətsiz rəvayəti səhihdir.',
      en: 'A narrator who combines integrity (‘adalah) and precision (dabt). It is one of the main grades of approval used by hadith critics; a connected narration of trustworthy narrators free of shudhudh and hidden defects is sahih.',
      ru: 'Передатчик, сочетающий праведность (‘адаля) и точность (дабт). Это одна из основных степеней одобрения у критиков хадисов; непрерывная передача надёжных передатчиков без шузуза и скрытого изъяна является достоверной.',
      ar: 'الراوي الجامع بين العدالة والضبط، وهي من أعلى مراتب التعديل استعمالًا عند النقاد. وما رواه الثقات بسند متصل من غير شذوذ ولا علة فهو صحيح.',
      tr: 'Hem adalet (dindarlık ve mürüvvet) hem de zapt (sağlam hıfz) sahibi ravi. Cerh ve ta\'dil âlimlerinin en çok kullandığı ta\'dil derecelerindendir; sika ravilerin bitişik senetle gelen, şaz ve illetsiz rivayeti sahihtir.',
    },
    rel: ['adalah', 'dabt', 'al-jarh-wat-tadil', 'sahih'],
    lesson: 'mustalah',
  },
  {
    term: 'Ədalət (ravidə)', ar: 'العدالة', translit: 'Adalah', cat: 'hadith',
    def: {
      az: 'Ravinin müsəlman, həddi-büluğa çatmış, ağıllı olması, böyük günahlardan uzaq durub kiçik günahlarda israr etməməsi və mürüvvəti pozan işlərdən çəkinməsi. Ədalət ravinin doğru danışmasına güvənməyin şərtidir; Əhli-Sünnəyə görə bütün səhabələr ədalətlidir.',
      en: 'A narrator being Muslim, adult and sane, avoiding major sins, not persisting in minor ones and keeping away from what breaches decency (muru’ah). It is the condition for trusting his truthfulness; according to Ahl as-Sunnah all the Companions are upright.',
      ru: 'То, что передатчик — мусульманин, совершеннолетний, разумный, избегает больших грехов, не упорствует в малых и сторонится того, что нарушает достоинство (муру’а). Это условие доверия его правдивости; по Ахль ас-Сунна все сподвижники праведны.',
      ar: 'أن يكون الراوي مسلمًا بالغًا عاقلًا سالمًا من أسباب الفسق وخوارم المروءة. وهي شرط الثقة بصدقه، والصحابة كلهم عدول عند أهل السنة.',
      tr: 'Ravinin Müslüman, ergen ve akıllı olması, büyük günahlardan sakınıp küçük günahlarda ısrar etmemesi ve mürüvveti bozan işlerden kaçınması. Adalet, ravinin doğruluğuna güvenmenin şartıdır; Ehl-i Sünnet\'e göre bütün sahabeler adildir.',
    },
    rel: ['dabt', 'thiqah', 'sahabah', 'al-jarh-wat-tadil'],
    lesson: 'mustalah',
  },
  {
    term: 'Zəbt', ar: 'الضبط', translit: 'Dabt', cat: 'hadith',
    def: {
      az: 'Ravinin eşitdiyini dəqiq yadda saxlaması və ya kitabında qoruyub olduğu kimi çatdırması. İki növü var: sinə zəbti (hafizə) və kitab zəbti; zəbti tam olanın hədisi səhih, bir az zəif olanın hədisi həsən sayılır.',
      en: 'A narrator’s precision: retaining what he heard accurately, or preserving it in his book and conveying it as it was. It is of two kinds — memory and writing; full precision gives a sahih hadith, slightly lighter precision a hasan one.',
      ru: 'Точность передатчика: он точно помнит услышанное или сохраняет его в своей книге и передаёт как было. Бывает двух видов — памятью и записью; при полной точности хадис достоверен, при несколько меньшей — хороший (хасан).',
      ar: 'أن يحفظ الراوي ما سمعه ويؤديه كما سمعه، وهو ضبط صدر وضبط كتاب. فتامّ الضبط حديثه صحيح، وخفيفه حديثه حسن.',
      tr: 'Ravinin işittiğini sağlam şekilde ezberlemesi veya kitabında koruyup olduğu gibi aktarması. İki türü vardır: hafıza zaptı ve kitap zaptı; zaptı tam olanın hadisi sahih, biraz hafif olanınki hasen sayılır.',
    },
    rel: ['adalah', 'thiqah', 'hasan', 'mudtarib'],
    lesson: 'mustalah',
  },
  {
    term: 'Hədisi-qüdsi', ar: 'الحديث القدسي', translit: 'Hadith Qudsi', cat: 'hadith',
    def: {
      az: 'Peyğəmbərin ﷺ Rəbbindən rəvayət etdiyi hədis, məsələn: «Ey bəndələrim, Mən zülmü Özümə haram etdim...» (Müslim 2577). Mənası Allahdandır, lakin Qurandan fərqli olaraq onunla möcüzə və meydan oxuma yoxdur, tilavəti ibadət deyil və namazda oxunmur; sənədi araşdırılır — səhih də, zəif də ola bilər.',
      en: 'A hadith the Prophet ﷺ narrates from his Lord, e.g. «O My servants, I have forbidden injustice for Myself…» (Muslim 2577). Its meaning is from Allah, but unlike the Quran it is not a miraculous challenge, its recitation is not an act of worship in itself and it is not recited in prayer; its chain is examined and it may be authentic or weak.',
      ru: 'Хадис, который Пророк ﷺ передаёт от своего Господа, например: «О рабы Мои, Я запретил несправедливость Самому Себе…» (Муслим 2577). Его смысл — от Аллаха, но в отличие от Корана он не является вызовом-чудом, его чтение само по себе не поклонение и не читается в молитве; его цепочку проверяют — он может быть и достоверным, и слабым.',
      ar: 'ما رواه النبي ﷺ عن ربه، كحديث «يا عبادي إني حرمت الظلم على نفسي...» (مسلم 2577). ويفارق القرآن بأنه لا يُتحدّى به، ولا يُتعبد بتلاوته، ولا يُقرأ في الصلاة، ويُنظر في إسناده فمنه الصحيح والضعيف.',
      tr: 'Peygamber\'in ﷺ Rabbinden rivayet ettiği hadis; örneğin: «Ey kullarım, Ben zulmü kendime haram kıldım...» (Müslim 2577). Kur\'an\'dan farklı olarak onunla meydan okunmaz, okunması başlı başına ibadet değildir ve namazda okunmaz; senedi incelenir, sahih de zayıf da olabilir.',
    },
    rel: ['hadith', 'quran', 'wahy'],
  },
  {
    term: 'Əsər', ar: 'الأثر', translit: 'Athar', cat: 'hadith',
    def: {
      az: 'Sələfdən — səhabə və tabiindən — nəql edilən söz və ya əməl; bəzi alimlər bu sözü mərfu hədisə də şamil edir. Sələfin əsərləri Quran və Sünnəni onların anladığı kimi anlamağın əsas vasitəsidir.',
      en: 'A saying or action transmitted from the Salaf — the Companions and Successors; some scholars also use the word for marfu‘ hadith. The athar of the Salaf are a key means of understanding the Quran and Sunnah as they understood them.',
      ru: 'Слово или действие, переданное от саляфов — сподвижников и табиинов; некоторые учёные называют так и марфу‘ хадис. Асары саляфов — главный путь понимать Коран и Сунну так, как понимали их они.',
      ar: 'ما يُروى عن السلف من الصحابة والتابعين من قول أو فعل، ويطلقه بعضهم على المرفوع أيضًا. وآثار السلف من أهم ما يُفهم به الكتاب والسنة على فهمهم.',
      tr: 'Selef\'ten — sahabe ve tâbiînden — nakledilen söz veya fiil; bazı âlimler bu kelimeyi merfû hadis için de kullanır. Selef\'in eserleri, Kur\'an ve Sünnet\'i onların anladığı gibi anlamanın temel yoludur.',
    },
    rel: ['mawquf', 'maqtu', 'salaf', 'tafsir-bil-mathur'],
  },
  {
    term: 'Kütubi-Sittə', ar: 'الكتب الستة', translit: 'Al-Kutub as-Sittah', cat: 'hadith',
    def: {
      az: 'Altı əsas hədis kitabı: Səhih əl-Buxari, Səhih Müslim, Sünən Əbu Davud, Cami ət-Tirmizi, Sünən ən-Nəsai və Sünən İbn Macə. İlk ikisi istisna olmaqla, onlarda səhih hədislə yanaşı həsən və zəif hədislər də var; hər hədisin dərəcəsinə ayrıca baxılır.',
      en: 'The six principal hadith collections: Sahih al-Bukhari, Sahih Muslim, Sunan Abu Dawud, Jami‘ at-Tirmidhi, Sunan an-Nasa’i and Sunan Ibn Majah. Apart from the first two, they contain hasan and weak hadiths alongside authentic ones, so each hadith’s grade is checked individually.',
      ru: 'Шесть основных сборников хадисов: «Сахих» аль-Бухари, «Сахих» Муслима, «Сунан» Абу Дауда, «Джами‘» ат-Тирмизи, «Сунан» ан-Насаи и «Сунан» Ибн Маджи. Кроме первых двух, в них наряду с достоверными есть хорошие и слабые хадисы, поэтому степень каждого проверяется отдельно.',
      ar: 'أمهات كتب الحديث الست: صحيح البخاري، وصحيح مسلم، وسنن أبي داود، وجامع الترمذي، وسنن النسائي، وسنن ابن ماجه. وفي غير الصحيحين الصحيح والحسن والضعيف، فيُنظر في درجة كل حديث.',
      tr: 'Altı temel hadis kitabı: Sahîh-i Buhârî, Sahîh-i Müslim, Sünen-i Ebû Dâvûd, Câmiu\'t-Tirmizî, Sünen-i Nesâî ve Sünen-i İbn Mâce. İlk ikisi dışında sahih hadislerin yanında hasen ve zayıf hadisler de bulunur; her hadisin derecesine ayrıca bakılır.',
    },
    rel: ['sahihayn', 'sunan', 'musnad', 'hadith'],
  },
  {
    term: 'Səhihayn', ar: 'الصحيحان', translit: 'Sahihayn', cat: 'hadith',
    def: {
      az: 'İmam Buxarinin və İmam Müslimin «Səhih» kitabları. Ümmət onları qəbul etmişdir və Allahın Kitabından sonra ən səhih kitablar sayılır; alimlərin tənqid etdiyi az sayda hərf istisnadır.',
      en: 'The two «Sahih» collections of Imam al-Bukhari and Imam Muslim. The Ummah has received them with acceptance, and they are regarded as the most authentic books after the Book of Allah, apart from a small number of letters criticised by the critics.',
      ru: '«Сахихи» имама аль-Бухари и имама Муслима. Умма приняла их, и они считаются самыми достоверными книгами после Книги Аллаха, за исключением небольшого числа мест, которые критиковали знатоки.',
      ar: 'صحيحا الإمامين البخاري ومسلم، تلقتهما الأمة بالقبول، وهما أصح الكتب بعد كتاب الله، إلا أحرفًا يسيرة انتقدها بعض الحفاظ.',
      tr: 'İmam Buhârî ve İmam Müslim\'in «Sahîh» adlı eserleri. Ümmet onları kabulle karşılamıştır; tenkit edilen az sayıdaki yer dışında Allah\'ın Kitabı\'ndan sonra en sahih kitaplar sayılır.',
    },
    rel: ['muttafaq-alayh', 'al-kutub-as-sittah', 'sahih'],
  },
  {
    term: 'Müttəfəqun əleyh', ar: 'متفق عليه', translit: 'Muttafaq Alayh', cat: 'hadith',
    def: {
      az: 'Eyni səhabədən gələn hədisi həm Buxarinin, həm də Müslimin öz «Səhih»lərində rəvayət etməsi. Səhih hədisin ən yüksək dərəcələrindəndir.',
      en: 'A hadith from the same Companion recorded by both al-Bukhari and Muslim in their «Sahih» collections. It is among the highest grades of authentic hadith.',
      ru: 'Хадис от одного и того же сподвижника, приведённый и аль-Бухари, и Муслимом в их «Сахихах». Это одна из высших степеней достоверности.',
      ar: 'ما اتفق البخاري ومسلم على إخراجه في صحيحيهما من حديث صحابي واحد، وهو من أعلى مراتب الصحيح.',
      tr: 'Aynı sahabeden gelen bir hadisi hem Buhârî\'nin hem de Müslim\'in «Sahîh»lerinde rivayet etmesi. Sahih hadisin en yüksek derecelerindendir.',
    },
    rel: ['sahihayn', 'sahih'],
  },
  {
    term: 'Sünən', ar: 'السنن', translit: 'Sunan', cat: 'hadith',
    def: {
      az: 'Hədisləri fiqh fəsilləri üzrə (təharət, namaz, zəkat...) düzən, əsasən mərfu hədisləri toplayan kitablar — məsələn, Əbu Davudun, Nəsainin və İbn Macənin «Sünən»ləri. Onlarda müxtəlif dərəcəli hədislər var.',
      en: 'Books arranging mainly marfu‘ hadiths by chapters of fiqh (purification, prayer, zakat…), such as the «Sunan» of Abu Dawud, an-Nasa’i and Ibn Majah. They contain hadiths of varying grades.',
      ru: 'Книги, где в основном марфу‘ хадисы расположены по главам фикха (очищение, молитва, закят…), например «Сунаны» Абу Дауда, ан-Насаи и Ибн Маджи. В них хадисы разной степени.',
      ar: 'كتب مرتبة على أبواب الفقه (الطهارة والصلاة والزكاة...) تجمع الأحاديث المرفوعة غالبًا، كسنن أبي داود والنسائي وابن ماجه، وفيها درجات مختلفة.',
      tr: 'Çoğunlukla merfû hadisleri fıkıh bablarına göre (taharet, namaz, zekât...) sıralayan kitaplar; Ebû Dâvûd, Nesâî ve İbn Mâce\'nin «Sünen»leri gibi. İçlerinde farklı derecelerde hadisler vardır.',
    },
    rel: ['al-kutub-as-sittah', 'musnad', 'fiqh'],
  },
  {
    term: 'Müsnəd', ar: 'المسند', translit: 'Musnad', cat: 'hadith',
    def: {
      az: 'Hədisləri mövzuya görə deyil, rəvayət edən səhabələrin adlarına görə düzən kitab; ən məşhuru İmam Əhmədin «Müsnəd»idir. Mustələhda «müsnəd» həm də sənədi Peyğəmbərə ﷺ qədər bitişik olan mərfu hədisə deyilir.',
      en: 'A book arranging hadiths not by topic but by the Companions who narrated them; the most famous is the «Musnad» of Imam Ahmad. In hadith terminology, musnad also means a marfu‘ hadith whose chain is connected to the Prophet ﷺ.',
      ru: 'Книга, где хадисы расположены не по темам, а по именам передавших их сподвижников; самая известная — «Муснад» имама Ахмада. В терминологии муснад — также марфу‘ хадис с непрерывной цепочкой до Пророка ﷺ.',
      ar: 'كتاب رُتبت أحاديثه على أسماء الصحابة لا على الأبواب، وأشهرها مسند الإمام أحمد. والمسند في الاصطلاح أيضًا: المرفوع المتصل السند إلى النبي ﷺ.',
      tr: 'Hadisleri konulara göre değil, rivayet eden sahabelerin adlarına göre sıralayan kitap; en meşhuru İmam Ahmed\'in «Müsned»idir. Hadis usulünde müsned, senedi Peygamber\'e ﷺ kadar bitişik merfû hadise de denir.',
    },
    rel: ['sunan', 'muttasil', 'marfu'],
  },
  {
    term: 'Ravi', ar: 'الراوي', translit: 'Rawi', cat: 'hadith',
    def: {
      az: 'Hədisi və ya xəbəri sənədlə nəql edən şəxs. Ravinin rəvayəti onun ədaləti və zəbti sübut olunduqda qəbul edilir; ravilərin halı cərh və tədil elmində araşdırılır.',
      en: 'A person who transmits a hadith or report with its chain. His narration is accepted when his integrity and precision are established; narrators’ conditions are studied in the science of al-jarh wat-ta‘dil.',
      ru: 'Человек, передающий хадис или сообщение с цепочкой. Его передача принимается, когда установлены его праведность и точность; состояние передатчиков изучает наука аль-джарх ват-та‘диль.',
      ar: 'من ينقل الحديث أو الخبر بالإسناد، وتُقبل روايته إذا ثبتت عدالته وضبطه، وتُدرس أحوال الرواة في علم الجرح والتعديل.',
      tr: 'Hadisi veya haberi senediyle nakleden kişi. Rivayeti, adaleti ve zaptı sabit olduğunda kabul edilir; ravilerin durumu cerh ve ta\'dil ilminde incelenir.',
    },
    rel: ['isnad', 'thiqah', 'al-jarh-wat-tadil'],
  },

  // ── Quran elmləri ──
  {
    term: 'Ulumul-Quran', ar: 'علوم القرآن', translit: 'Ulum al-Qur\'an', cat: 'quran',
    def: {
      az: 'Quranla bağlı elmlər toplusu: nazil olması, toplanması, Məkki və Mədəni, nasix və mənsux, nüzul səbəbləri, qiraətlər, möhkəm və mütəşabih, təfsir qaydaları və s. Məqsədi Allahın kəlamını düzgün anlamaqdır.',
      en: 'The collection of sciences related to the Quran: its revelation, compilation, Makki and Madani, abrogating and abrogated, occasions of revelation, the qira’at, the clear and the ambiguous, rules of tafsir and more. Its aim is to understand Allah’s Speech correctly.',
      ru: 'Совокупность наук, связанных с Кораном: ниспослание, собирание, мекканское и мединское, отменяющее и отменённое, причины ниспослания, чтения, ясное и иносказательное, правила толкования и др. Цель — правильно понимать Слово Аллаха.',
      ar: 'مباحث تتعلق بالقرآن من حيث نزوله وجمعه والمكي والمدني والناسخ والمنسوخ وأسباب النزول والقراءات والمحكم والمتشابه وقواعد التفسير وغير ذلك، والغاية منها فهم كلام الله على وجهه.',
      tr: 'Kur\'an\'la ilgili ilimlerin bütünü: inişi, toplanması, Mekkî ve Medenî, nâsih ve mensuh, nüzul sebepleri, kıraatler, muhkem ve müteşabih, tefsir kuralları vb. Amacı Allah\'ın kelamını doğru anlamaktır.',
    },
    rel: ['quran', 'tafsir', 'asbab-an-nuzul', 'qiraat'],
  },
  {
    term: 'Ayə', ar: 'الآية', translit: 'Ayah', cat: 'quran',
    def: {
      az: 'Quran surəsinin başlanğıcı və sonu olan hissəsi; dildə «nişanə, dəlil, möcüzə» deməkdir. Ayələrin sərhədləri və ardıcıllığı Peyğəmbərdən ﷺ öyrənilib (tövqifidir); Quranda 6236 ayə var (Kufə sayı).',
      en: 'A portion of a Quranic surah with a beginning and an end; linguistically «sign, proof, miracle». Verse boundaries and order were learned from the Prophet ﷺ (tawqifi); the Quran has 6236 verses (Kufan count).',
      ru: 'Часть суры Корана, имеющая начало и конец; в языке — «знамение, довод, чудо». Границы и порядок аятов установлены Пророком ﷺ (таукифи); в Коране 6236 аятов (по куфийскому счёту).',
      ar: 'طائفة من القرآن ذات مبدأ ومقطع مندرجة في سورة، وهي في اللغة العلامة والمعجزة. وترتيب الآيات توقيفي عن النبي ﷺ، وعددها 6236 آية في العدّ الكوفي.',
      tr: 'Kur\'an suresinin başı ve sonu olan bölümü; sözlükte «işaret, delil, mucize» demektir. Âyetlerin sınırları ve sıralaması Peygamber\'den ﷺ öğrenilmiştir (tevkîfî); Kur\'an\'da 6236 âyet vardır (Kûfe sayımı).',
    },
    rel: ['surah', 'mushaf', 'quran'],
  },
  {
    term: 'Surə', ar: 'السورة', translit: 'Surah', cat: 'quran',
    def: {
      az: 'Başlanğıcı və sonu olan, ən azı üç ayədən ibarət Quran bölməsi; Quranda 114 surə var. Ən uzunu Bəqərə, ən qısası Kövsərdir; surələr Məkki və Mədəni deyə iki qismə bölünür.',
      en: 'A section of the Quran with a beginning and an end, consisting of at least three verses; the Quran has 114 surahs. The longest is Al-Baqarah and the shortest Al-Kawthar; surahs are classed as Makki or Madani.',
      ru: 'Раздел Корана, имеющий начало и конец и состоящий как минимум из трёх аятов; в Коране 114 сур. Самая длинная — аль-Бакара, самая короткая — аль-Каусар; суры делятся на мекканские и мединские.',
      ar: 'طائفة مستقلة من آيات القرآن ذات مطلع ومقطع، أقلها ثلاث آيات، وعدد سور القرآن 114 سورة، أطولها البقرة وأقصرها الكوثر، وتنقسم إلى مكية ومدنية.',
      tr: 'Başı ve sonu olan, en az üç âyetten oluşan Kur\'an bölümü; Kur\'an\'da 114 sure vardır. En uzunu Bakara, en kısası Kevser\'dir; sureler Mekkî ve Medenî olarak ikiye ayrılır.',
    },
    rel: ['ayah', 'makki', 'madani', 'juz'],
  },
  {
    term: 'Bəsmələ', ar: 'البسملة', translit: 'Basmalah', cat: 'quran',
    def: {
      az: '«Bismillahir-Rahmanir-Rahim» — «Mərhəmətli, Rəhmli Allahın adı ilə» demək. Nəml surəsindəki ayənin hissəsidir (Nəml 27:30) və Tövbə surəsindən başqa hər surənin əvvəlində yazılır; Fatihənin ayəsi olub-olmaması barədə alimlər ixtilaf ediblər.',
      en: 'Saying «Bismillahir-Rahmanir-Rahim» — «In the name of Allah, the Most Merciful, the Bestower of mercy». It is part of a verse in Surat an-Naml (An-Naml 27:30) and is written at the start of every surah except At-Tawbah; scholars differ over whether it is a verse of Al-Fatihah.',
      ru: 'Слова «Бисмилляхи-р-Рахмани-р-Рахим» — «С именем Аллаха, Милостивого, Милосердного». Это часть аята суры ан-Намль (ан-Намль 27:30), она пишется в начале каждой суры, кроме ат-Тауба; учёные разошлись, является ли она аятом аль-Фатихи.',
      ar: 'قول «بسم الله الرحمن الرحيم»، وهي بعض آية في سورة النمل (النمل: 30)، وتُكتب في أول كل سورة إلا سورة التوبة، واختلف العلماء في كونها آية من الفاتحة.',
      tr: '«Bismillâhirrahmânirrahîm» — «Rahmân ve Rahîm olan Allah\'ın adıyla» demek. Neml suresindeki bir âyetin parçasıdır (Neml 27:30) ve Tevbe suresi dışında her surenin başında yazılır; Fâtiha\'nın âyeti olup olmadığında âlimler ihtilaf etmiştir.',
    },
    rel: ['istiadhah', 'surah', 'ayah'],
  },
  {
    term: 'İstiazə', ar: 'الاستعاذة', translit: 'Isti\'adhah', cat: 'quran',
    def: {
      az: 'Quran oxumağa başlamazdan əvvəl «Əuzu billəhi minəş-şeytanir-racim» deyib Allaha sığınmaq. Allah buyurur: «Quran oxuduğun zaman qovulmuş şeytandan Allaha sığın» (Nəhl 16:98).',
      en: 'Seeking refuge in Allah before reciting the Quran by saying «A‘udhu billahi min ash-shaytan ar-rajim». Allah says: «When you recite the Quran, seek refuge in Allah from Satan, the accursed» (An-Nahl 16:98).',
      ru: 'Прибегание к защите Аллаха перед чтением Корана словами «А‘узу би-Ллахи мина-ш-шайтани-р-раджим». Аллах сказал: «Когда ты читаешь Коран, проси защиты у Аллаха от проклятого шайтана» (ан-Нахль 16:98).',
      ar: 'قول «أعوذ بالله من الشيطان الرجيم» قبل القراءة، لقوله تعالى: ﴿فَإِذَا قَرَأْتَ ٱلْقُرْءَانَ فَٱسْتَعِذْ بِٱللَّهِ مِنَ ٱلشَّيْطَـٰنِ ٱلرَّجِيمِ﴾ (النحل: 98).',
      tr: 'Kur\'an okumaya başlamadan önce «Eûzü billâhi mineşşeytânirracîm» diyerek Allah\'a sığınmak. Allah şöyle buyurur: «Kur\'an okuyacağın zaman kovulmuş şeytandan Allah\'a sığın» (Nahl 16:98).',
    },
    rel: ['basmalah', 'tajwid', 'dhikr'],
  },
  {
    term: 'Mushaf', ar: 'المصحف', translit: 'Mushaf', cat: 'quran',
    def: {
      az: 'Quranın iki qapaq arasında yazılmış nüsxəsi. Quran Əbu Bəkrin dövründə bir yerə toplanmış, Osmanın dövründə səhabələrin icması ilə vahid nüsxələrdə çoxaldılmışdır; Allah onu qorumağı Öz üzərinə götürüb (Hicr 15:9).',
      en: 'A written copy of the Quran between two covers. The Quran was gathered in one place under Abu Bakr and copied into uniform codices under ‘Uthman with the consensus of the Companions; Allah has guaranteed its preservation (Al-Hijr 15:9).',
      ru: 'Письменный экземпляр Корана между двумя переплётами. Коран был собран воедино при Абу Бакре и размножен в единых списках при ‘Усмане с единогласия сподвижников; Аллах взял его сохранение на Себя (аль-Хиджр 15:9).',
      ar: 'ما كُتب فيه القرآن بين دفتين. جُمع القرآن في عهد أبي بكر، ثم نُسخ في مصاحف موحدة في عهد عثمان بإجماع الصحابة، وقد تكفل الله بحفظه (الحجر: 9).',
      tr: 'Kur\'an\'ın iki kapak arasında yazılmış nüshası. Kur\'an, Ebû Bekir döneminde bir araya toplanmış, Osman döneminde sahabenin icmâıyla tek tip nüshalar hâlinde çoğaltılmıştır; Allah onu korumayı üzerine almıştır (Hicr 15:9).',
    },
    rel: ['rasm-uthmani', 'quran', 'hifz'],
  },
  {
    term: 'Osmani rəsm', ar: 'الرسم العثماني', translit: 'Rasm Uthmani', cat: 'quran',
    def: {
      az: 'Osman (r.a.) dövründə köçürülən mushafların yazı tərzi; bəzi sözlər tələffüzdən fərqli yazılır (məs. ٱلصَّلَوٰة). Səhabələrin icması ilə qəbul edildiyi üçün alimlərin çoxu mushafı bu yazı ilə köçürməyi vacib sayıb.',
      en: 'The spelling of the codices copied in the time of ‘Uthman (may Allah be pleased with him); some words are written differently from how they are pronounced (e.g. ٱلصَّلَوٰة). Because it was adopted by the Companions’ consensus, most scholars held that the mushaf must be copied in this script.',
      ru: 'Орфография списков, переписанных во времена ‘Усмана (да будет доволен им Аллах); некоторые слова пишутся не так, как произносятся (напр. ٱلصَّلَوٰة). Поскольку она принята с единогласия сподвижников, большинство учёных обязывали переписывать мусхаф именно так.',
      ar: 'الطريقة التي كُتبت بها المصاحف في عهد عثمان رضي الله عنه، وفيها كلمات تُكتب على خلاف نطقها كـ«الصلوٰة». ولإجماع الصحابة عليه أوجب أكثر العلماء التزامه في كتابة المصحف.',
      tr: 'Osman (r.a.) döneminde çoğaltılan mushafların yazım şekli; bazı kelimeler okunuşundan farklı yazılır (ör. ٱلصَّلَوٰة). Sahabenin icmâıyla benimsendiği için âlimlerin çoğu mushafın bu yazıyla yazılmasını gerekli görmüştür.',
    },
    rel: ['mushaf', 'qiraat', 'al-ahruf-as-sabah'],
  },
  {
    term: 'Qiraətlər', ar: 'القراءات', translit: 'Qira\'at', cat: 'quran',
    def: {
      az: 'Quran sözlərinin səhih sənədlə Peyğəmbərdən ﷺ nəql edilmiş oxunuş tərzləri. Qəbul olunan qiraətin şərtləri: səhih sənəd, Osmani rəsmə uyğunluq və ərəb dilinə uyğunluq; on məşhur qiraət bunlardandır, bizdə yayılan oxunuş Həfsin Asimdən rəvayətidir.',
      en: 'The ways of reciting the words of the Quran transmitted from the Prophet ﷺ with authentic chains. An accepted reading must have an authentic chain, agree with the ‘Uthmani script and with Arabic; the ten well-known readings are of this kind, and the most widespread recitation is Hafs from ‘Asim.',
      ru: 'Способы чтения слов Корана, переданные от Пророка ﷺ достоверными цепочками. Условия принятого чтения: достоверная цепочка, соответствие османской орфографии и арабскому языку; таковы десять известных чтений, а самое распространённое — Хафс от ‘Асима.',
      ar: 'وجوه أداء كلمات القرآن المنقولة عن النبي ﷺ بالسند الصحيح. وشروط القراءة المقبولة: صحة السند، وموافقة الرسم العثماني، وموافقة العربية؛ ومنها القراءات العشر، وأشهرها انتشارًا رواية حفص عن عاصم.',
      tr: 'Kur\'an kelimelerinin sahih senetle Peygamber\'den ﷺ nakledilmiş okunuş şekilleri. Makbul kıraatin şartları: sahih senet, Hz. Osman mushafının yazımına uygunluk ve Arapçaya uygunluk; meşhur on kıraat bunlardandır, en yaygın okuyuş Hafs\'ın Âsım\'dan rivayetidir.',
    },
    rel: ['al-ahruf-as-sabah', 'rasm-uthmani', 'tajwid'],
  },
  {
    term: 'Yeddi hərf', ar: 'الأحرف السبعة', translit: 'Al-Ahruf as-Sab\'ah', cat: 'quran',
    def: {
      az: 'Peyğəmbərin ﷺ «Bu Quran yeddi hərf üzrə nazil edilib, ondan asan olanı oxuyun» hədisində (Buxari 4992) keçən, ümmətə asanlıq üçün verilmiş oxunuş genişliyi. Bu, yeddi məşhur qiraət deyil: qiraətlər həmin hərflərdən Osmani rəsmə uyğun gələn hissənin nəqlidir.',
      en: 'The latitude in recitation granted to ease the Ummah, mentioned in the Prophet’s ﷺ saying «This Quran was revealed in seven ahruf, so recite whatever is easy of it» (Bukhari 4992). It is not the same as the seven famous qira’at: the qira’at transmit what of those ahruf agrees with the ‘Uthmani script.',
      ru: 'Простор в чтении, данный для облегчения умме, о котором сказал Пророк ﷺ: «Этот Коран ниспослан в семи харфах, читайте то, что вам легче» (Бухари 4992). Это не то же самое, что семь известных чтений: чтения передают ту часть этих харфов, которая соответствует османской орфографии.',
      ar: 'ما ورد في قوله ﷺ: «إن هذا القرآن أُنزل على سبعة أحرف فاقرؤوا ما تيسر منه» (البخاري 4992)، وهو توسعة على الأمة. وليست هي القراءات السبع، بل القراءات ما وافق الرسم العثماني من هذه الأحرف.',
      tr: 'Peygamber\'in ﷺ «Bu Kur\'an yedi harf üzere indirildi; ondan kolayınıza geleni okuyun» hadisinde (Buhari 4992) geçen, ümmete kolaylık için verilmiş okuma genişliği. Bu, meşhur yedi kıraat değildir: kıraatler, bu harflerden Hz. Osman mushafının yazımına uyan kısmın naklidir.',
    },
    rel: ['qiraat', 'rasm-uthmani', 'mushaf'],
  },
  {
    term: 'Tərtil', ar: 'الترتيل', translit: 'Tartil', cat: 'quran',
    def: {
      az: 'Quranı tələsmədən, aydın, hərfləri düzgün çıxararaq və mənasına diqqət yetirərək oxumaq. Allah buyurur: «Quranı tərtil ilə oxu» (Müzzəmmil 73:4).',
      en: 'Reciting the Quran unhurriedly and clearly, pronouncing the letters correctly and attending to the meaning. Allah says: «And recite the Quran with measured recitation» (Al-Muzzammil 73:4).',
      ru: 'Чтение Корана неспешно и отчётливо, с правильным произношением букв и вниманием к смыслу. Аллах сказал: «И читай Коран размеренным чтением» (аль-Муззаммиль 73:4).',
      ar: 'قراءة القرآن بتمهل وبيان وإخراج الحروف من مخارجها مع تدبر المعاني، قال تعالى: ﴿وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا﴾ (المزمل: 4).',
      tr: 'Kur\'an\'ı acele etmeden, açık seçik, harfleri doğru çıkararak ve anlamına dikkat ederek okumak. Allah şöyle buyurur: «Kur\'an\'ı tane tane oku» (Müzzemmil 73:4).',
    },
    rel: ['tajwid', 'tadabbur', 'waqf-wa-ibtida'],
  },
  {
    term: 'Vəqf və ibtida', ar: 'الوقف والابتداء', translit: 'Waqf wa Ibtida\'', cat: 'quran',
    def: {
      az: 'Quran oxuyarkən harada dayanmağın (vəqf) və haradan yenidən başlamağın (ibtida) elmi. Mənanı pozan yerdə dayanmaq və ya başlamaq düzgün deyil; mushafdakı vəqf işarələri bu işdə köməkçidir.',
      en: 'The science of where to pause (waqf) and where to resume (ibtida’) when reciting the Quran. Pausing or resuming where it distorts the meaning is improper; the pause signs in the mushaf help with this.',
      ru: 'Наука о том, где остановиться (вакф) и откуда возобновить чтение (ибтида’) при чтении Корана. Нельзя останавливаться или начинать там, где искажается смысл; знаки остановки в мусхафе помогают в этом.',
      ar: 'علم يُعرف به مواضع الوقف في القراءة ومواضع الابتداء، فلا يُوقف ولا يُبتدأ بما يُفسد المعنى، وعلامات الوقف في المصحف معينة على ذلك.',
      tr: 'Kur\'an okurken nerede durulacağını (vakf) ve nereden yeniden başlanacağını (ibtidâ) bildiren ilim. Anlamı bozan yerde durmak veya başlamak doğru değildir; mushaftaki vakf işaretleri buna yardımcı olur.',
    },
    rel: ['tajwid', 'tartil', 'ayah'],
  },
  {
    term: 'Quranın möcüzəliyi', ar: 'إعجاز القرآن', translit: 'I\'jaz al-Qur\'an', cat: 'quran',
    def: {
      az: 'Quranın insanları və cinləri onun bənzərini gətirməkdə aciz qoyması — dili, bəlağəti, xəbərləri, hökmləri və hidayəti ilə. Allah onun bir surəsinin bənzərini gətirməyə çağırıb (Bəqərə 2:23) və bunu heç kimin bacarmayacağını bildirib (İsra 17:88).',
      en: 'The Quran rendering humans and jinn incapable of producing its like — in its language, eloquence, reports, rulings and guidance. Allah challenged them to produce a single surah like it (Al-Baqarah 2:23) and declared that no one can (Al-Isra 17:88).',
      ru: 'Неспособность людей и джиннов создать подобное Корану — по языку, красноречию, сообщениям, законам и руководству. Аллах призвал создать хотя бы одну подобную суру (аль-Бакара 2:23) и сообщил, что никто не сможет этого (аль-Исра 17:88).',
      ar: 'عجز الإنس والجن عن الإتيان بمثل القرآن في لفظه وبلاغته وأخباره وأحكامه وهدايته، وقد تحداهم الله أن يأتوا بسورة من مثله (البقرة: 23) وأخبر أنهم لا يأتون بمثله (الإسراء: 88).',
      tr: 'Kur\'an\'ın insanları ve cinleri benzerini getirmekten âciz bırakması — dili, belâgati, haberleri, hükümleri ve hidayetiyle. Allah onlara bir benzer sure getirmeleri için meydan okumuş (Bakara 2:23) ve bunu kimsenin başaramayacağını bildirmiştir (İsrâ 17:88).',
    },
    rel: ['quran', 'mujizah', 'wahy'],
  },
  {
    term: 'Əsərlə təfsir', ar: 'التفسير بالمأثور', translit: 'Tafsir bil-Ma\'thur', cat: 'quran',
    def: {
      az: 'Quranı Quranla, Sünnə ilə, səhabə və tabiinin sözləri ilə təfsir etmək. Bu, təfsirin ən doğru yoludur; İbn Cərir ət-Təbəri və İbn Kəsirin təfsirləri buna nümunədir.',
      en: 'Explaining the Quran by the Quran, by the Sunnah, and by the words of the Companions and Successors. It is the soundest method of tafsir; the commentaries of Ibn Jarir at-Tabari and Ibn Kathir are examples.',
      ru: 'Толкование Корана Кораном, Сунной и словами сподвижников и табиинов. Это самый верный путь толкования; примеры — тафсиры Ибн Джарира ат-Табари и Ибн Касира.',
      ar: 'تفسير القرآن بالقرآن، ثم بالسنة، ثم بأقوال الصحابة والتابعين، وهو أصح طرق التفسير، ومن أمثلته تفسير ابن جرير الطبري وتفسير ابن كثير.',
      tr: 'Kur\'an\'ı Kur\'an\'la, Sünnet\'le, sahabe ve tâbiînin sözleriyle tefsir etmek. Tefsirin en doğru yoludur; İbn Cerîr et-Taberî ve İbn Kesîr\'in tefsirleri buna örnektir.',
    },
    rel: ['tafsir', 'tafsir-bir-ray', 'athar', 'salaf'],
  },
  {
    term: 'Rəylə təfsir', ar: 'التفسير بالرأي', translit: 'Tafsir bir-Ra\'y', cat: 'quran',
    def: {
      az: 'Quranı ictihadla təfsir etmək. Ərəb dilinə, şəriət üsullarına, Sünnəyə və sələfin sözlərinə əsaslanan rəy təqdirəlayiqdir; elmsiz, həvəsə görə və ya bidəti dəstəkləmək üçün edilən təfsir isə qadağandır.',
      en: 'Explaining the Quran through scholarly reasoning. Opinion based on Arabic, the principles of the Shari‘ah, the Sunnah and the sayings of the Salaf is praiseworthy; tafsir without knowledge, by whim or to support an innovation is forbidden.',
      ru: 'Толкование Корана посредством иджтихада. Мнение, основанное на арабском языке, основах шариата, Сунне и словах саляфов, похвально; толкование без знания, по прихоти или в поддержку нововведения запрещено.',
      ar: 'تفسير القرآن بالاجتهاد. فالمحمود منه ما استند إلى اللغة وأصول الشريعة والسنة وأقوال السلف، والمذموم ما كان بغير علم أو بالهوى أو لنصرة بدعة.',
      tr: 'Kur\'an\'ı içtihatla tefsir etmek. Arapçaya, şeriatın usulüne, Sünnet\'e ve Selef\'in sözlerine dayanan görüş övülmüştür; ilimsiz, hevâya göre veya bir bidati desteklemek için yapılan tefsir ise yasaktır.',
    },
    rel: ['tafsir-bil-mathur', 'tafsir', 'ijtihad', 'bidah'],
  },
  {
    term: 'İsrailiyyat', ar: 'الإسرائيليات', translit: 'Isra\'iliyyat', cat: 'quran',
    def: {
      az: 'Əhli-kitabdan, əsasən yəhudi mənbələrindən gələn xəbərlər. Üç növdür: şəriətimizin təsdiq etdiyi qəbul edilir, ziddinə olan rədd edilir, haqqında heç nə deyilməyən isə nə təsdiq, nə də inkar edilərək nəql oluna bilər — «Onlardan rəvayət edin, bunda qəbahət yoxdur» (Buxari 3461), «Əhli-kitabı nə təsdiq edin, nə də yalanlayın» (Buxari 7362).',
      en: 'Reports from the People of the Book, mainly Jewish sources. They are of three kinds: what our Shari‘ah confirms is accepted, what contradicts it is rejected, and what it is silent about may be narrated without affirming or denying it — «Narrate from the Children of Israel, there is no harm» (Bukhari 3461), «Neither believe the People of the Book nor deny them» (Bukhari 7362).',
      ru: 'Сообщения от людей Писания, в основном из иудейских источников. Они трёх видов: подтверждённое нашим шариатом принимается, противоречащее ему отвергается, а о чём он умалчивает — можно передавать, не подтверждая и не отрицая: «Рассказывайте о сынах Исраиля, в этом нет греха» (Бухари 3461), «Не верьте людям Писания и не обвиняйте их во лжи» (Бухари 7362).',
      ar: 'أخبار منقولة عن أهل الكتاب ولا سيما اليهود، وهي ثلاثة أقسام: ما شهد شرعنا بصدقه فيُقبل، وما شهد بكذبه فيُرد، وما سكت عنه فيُحكى ولا يُصدَّق ولا يُكذَّب؛ لقوله ﷺ: «وحدثوا عن بني إسرائيل ولا حرج» (البخاري 3461)، وقوله: «لا تصدقوا أهل الكتاب ولا تكذبوهم» (البخاري 7362).',
      tr: 'Ehl-i kitaptan, çoğunlukla Yahudi kaynaklarından gelen haberler. Üç türdür: şeriatımızın doğruladığı kabul edilir, ona aykırı olan reddedilir, hakkında bir şey söylenmeyen ise ne doğrulanıp ne yalanlanarak aktarılabilir — «İsrailoğullarından rivayet edin, bunda sakınca yoktur» (Buhari 3461), «Ehl-i kitabı ne doğrulayın ne de yalanlayın» (Buhari 7362).',
    },
    rel: ['ahl-al-kitab', 'tafsir', 'tafsir-bil-mathur'],
  },
  {
    term: 'Müqəttəə hərfləri', ar: 'الحروف المقطعة', translit: 'Al-Huruf al-Muqatta\'ah', cat: 'quran',
    def: {
      az: 'Bəzi surələrin əvvəlində ayrı-ayrı oxunan hərflər: الم، حم، طه، ق və s. (29 surədə). Əhli-Sünnə alimlərinin çoxuna görə onlar ərəb hərfləridir və Quranın məhz bu hərflərdən ibarət olduğu halda bənzərinin gətirilə bilməməsinə — möcüzəliyinə işarə edir; qəti mənası barədə uydurma təvillər qəbul edilmir.',
      en: 'The letters read separately at the start of some surahs: الم، حم، طه، ق etc. (in 29 surahs). Many scholars of Ahl as-Sunnah hold that they point to the Quran’s inimitability — it is made of these very letters, yet none can produce its like; invented claims about a definite hidden meaning are not accepted.',
      ru: 'Отдельно читаемые буквы в начале некоторых сур: الم، حم، طه، ق и др. (в 29 сурах). Многие учёные Ахль ас-Сунна считают, что они указывают на неподражаемость Корана: он состоит из этих же букв, но никто не может создать подобное; выдуманные утверждения о скрытом смысле не принимаются.',
      ar: 'حروف تُقرأ مقطعة في أوائل بعض السور مثل: الم، حم، طه، ق (في تسع وعشرين سورة)، وذهب كثير من أهل العلم إلى أنها إشارة إلى إعجاز القرآن، إذ هو مركب من هذه الحروف ولا يقدرون على مثله، ولا يُقبل ادعاء معانٍ باطنة لها بلا دليل.',
      tr: 'Bazı surelerin başında ayrı ayrı okunan harfler: الم، حم، طه، ق vb. (29 surede). Ehl-i Sünnet âlimlerinin birçoğuna göre bunlar Kur\'an\'ın i\'câzına işaret eder: Kur\'an bu harflerden oluştuğu hâlde kimse benzerini getiremez; delilsiz uydurulan gizli anlamlar kabul edilmez.',
    },
    rel: ['ijaz-al-quran', 'mutashabih', 'surah'],
  },
  {
    term: 'Vəhy', ar: 'الوحي', translit: 'Wahy', cat: 'quran',
    def: {
      az: 'Allahın Öz peyğəmbərlərinə şəriətini və xəbərlərini bildirməsi — mələk (Cəbrayıl) vasitəsilə, pərdə arxasından danışmaqla və ya ilham və yuxu ilə. Quran və Sünnə vəhydir: «O, həvadan danışmır. Bu, yalnız vəhy olunan bir vəhydir» (Nəcm 53:3–4).',
      en: 'Allah communicating His law and tidings to His prophets — through an angel (Jibril), by speaking from behind a veil, or by inspiration and dreams. The Quran and the Sunnah are revelation: «Nor does he speak from desire. It is only a revelation revealed» (An-Najm 53:3–4).',
      ru: 'Сообщение Аллахом Своих законов и вестей пророкам — через ангела (Джибриля), речью из-за завесы, внушением или во сне. Коран и Сунна — откровение: «Он не говорит по прихоти. Это — лишь откровение, которое ему внушается» (ан-Наджм 53:3–4).',
      ar: 'إعلام الله أنبياءه بشرعه وأخباره، بواسطة الملك جبريل أو من وراء حجاب أو بالإلهام والرؤيا. والقرآن والسنة وحي: ﴿وَمَا يَنطِقُ عَنِ ٱلْهَوَىٰٓ ۝ إِنْ هُوَ إِلَّا وَحْىٌ يُوحَىٰ﴾ (النجم: 3–4).',
      tr: 'Allah\'ın şeriatını ve haberlerini peygamberlerine bildirmesi — melek (Cebrâil) aracılığıyla, perde arkasından konuşarak ya da ilham ve rüya ile. Kur\'an ve Sünnet vahiydir: «O, hevâsından konuşmaz. O, ancak vahyedilen bir vahiydir» (Necm 53:3–4).',
    },
    rel: ['quran', 'sunnah', 'nabi-wa-rasul', 'kalam-allah'],
  },
  {
    term: 'Xətm', ar: 'ختم القرآن', translit: 'Khatm al-Qur\'an', cat: 'quran',
    def: {
      az: 'Quranı əvvəldən sonadək oxuyub bitirmək. Sələf xətmi müxtəlif müddətlərdə edib; Peyğəmbər ﷺ Abdullah ibn Amra Quranı bir ayda xətm etməyi tövsiyə etmiş, onun israrı ilə yeddi günə qədər icazə vermişdir (Buxari 5054). Xətmə xas, Sünnədə sabit olmayan mərasim və dualar bidətdir.',
      en: 'Reciting the Quran from beginning to end. The Salaf completed it over various periods; the Prophet ﷺ advised ‘Abdullah ibn ‘Amr to complete it in a month and, at his insistence, allowed down to seven days (Bukhari 5054). Ceremonies and supplications specific to a khatm that are not established in the Sunnah are innovations.',
      ru: 'Прочтение Корана от начала до конца. Саляфы завершали его за разные сроки; Пророк ﷺ посоветовал ‘Абдуллаху ибн ‘Амру завершать его за месяц и по его настоянию разрешил до семи дней (Бухари 5054). Особые обряды и мольбы при хатме, не утверждённые Сунной, — нововведение.',
      ar: 'قراءة القرآن من أوله إلى آخره. وقد كان للسلف في ذلك مُدد مختلفة، وأوصى النبي ﷺ عبد الله بن عمرو أن يختمه في شهر، ثم أذن له إلى سبع لما استزاده (البخاري 5054). وما يُحدث عند الختم من مراسم وأدعية لا أصل لها في السنة فهو بدعة.',
      tr: 'Kur\'an\'ı baştan sona okuyup bitirmek. Selef hatmi farklı sürelerde yapmıştır; Peygamber ﷺ Abdullah b. Amr\'a Kur\'an\'ı bir ayda hatmetmesini tavsiye etmiş, onun ısrarı üzerine yedi güne kadar izin vermiştir (Buhari 5054). Hatme özgü olup Sünnet\'te sabit olmayan merasim ve dualar bidattir.',
    },
    rel: ['hifz', 'juz', 'tartil', 'bidah'],
  },
  {
    term: 'Tədəbbür', ar: 'التدبر', translit: 'Tadabbur', cat: 'quran',
    def: {
      az: 'Quran ayələri üzərində düşünüb mənasını anlamaq, ibrət almaq və onunla əməl etmək. Quranın nazil edilməsinin məqsədlərindəndir: «Bu, ayələri üzərində düşünsünlər və ağıl sahibləri öyüd alsınlar deyə sənə nazil etdiyimiz mübarək bir Kitabdır» (Sad 38:29).',
      en: 'Reflecting on the verses of the Quran to understand them, take lessons and act upon them. It is among the purposes of revelation: «A blessed Book We have sent down to you, that they may reflect upon its verses and that people of understanding may take heed» (Sad 38:29).',
      ru: 'Размышление над аятами Корана, чтобы понять их, извлечь урок и действовать по ним. Это одна из целей ниспослания: «Это — благословенное Писание, которое Мы ниспослали тебе, чтобы они размышляли над его аятами и чтобы обладающие разумом поминали назидание» (Сад 38:29).',
      ar: 'التأمل في آيات القرآن لفهم معانيها والاتعاظ بها والعمل بها، وهو من مقاصد إنزاله: ﴿كِتَـٰبٌ أَنزَلْنَـٰهُ إِلَيْكَ مُبَـٰرَكٌ لِّيَدَّبَّرُوٓا۟ ءَايَـٰتِهِۦ وَلِيَتَذَكَّرَ أُو۟لُوا۟ ٱلْأَلْبَـٰبِ﴾ (ص: 29).',
      tr: 'Kur\'an âyetleri üzerinde düşünerek anlamını kavramak, ibret almak ve onunla amel etmek. Kur\'an\'ın indiriliş amaçlarındandır: «Bu, âyetleri üzerinde düşünsünler ve akıl sahipleri öğüt alsınlar diye sana indirdiğimiz mübarek bir Kitaptır» (Sâd 38:29).',
    },
    rel: ['tafakkur', 'tartil', 'tafsir', 'khushu'],
  },
]
