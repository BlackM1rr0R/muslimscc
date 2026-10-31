// ═══════════════════════════════════════════════════════
// Allahın adları — "Adlar və sifətlər haqqında qaydalar" bölməsi (/names)
//
// MƏNBƏ: Şeyx Məhəmməd ibn Saleh əl-Useymin, «əl-Qavaid əl-Musla fi Sifatillahi
// Təala və Əsmaihil-Husna» — adlar haqqında 7 qayda və sifətlər haqqında 7 qayda,
// qısa izahla. Mətn tutuşdurulub: https://shamela.ws/book/8874/5-38
// (adlar: s. 5–22, sifətlər: s. 23–38). Hər qaydanın ayəsi kitabda həmin qayda
// üçün gətirilən dəlildir.
//
// AYƏLƏR: "ar" — Quran.com API-dən (text_uthmani) hərfi-hərfinə götürülmüş
// hissə (api.quran.com/api/v4/quran/verses/uthmani?verse_key=…) — əl ilə DƏYİŞMƏ.
//
// HƏDİS: «Allahın doxsan doqquz — yüzdən bir əskik — adı var, kim onları
// "ihsa" etsə, Cənnətə girər» — Buxari 2736 və 7392, Müslim 2677 (mətn
// fawazahmed0/hadith-api nəşrində yoxlanılıb). Buxari 7392-dən sonra
// «əhsaynahu» sözünü «hafiznahu» (əzbərlədik) ilə izah edir.
// İHSA: İbn Useymin, həmin kitab, 6-cı qaydanın haşiyəsi: «إحصاؤها: حفظها
// لفظًا، وفهمها معنىً، وتمامه: أن يتعبد لله تعالى بمقتضاها».
// ═══════════════════════════════════════════════════════

export const VIRTUE = {
  ar: 'إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا، مِائَةً إِلَّا وَاحِدًا، مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ',
  text: {
    az: '«Allahın doxsan doqquz — yüzdən bir əskik — adı var. Kim onları sayıb-əhatə etsə (ihsa etsə), Cənnətə girər.»',
    en: '“Allah has ninety-nine names — one hundred less one. Whoever enumerates them (ahsaha) will enter Paradise.”',
    ru: '«Поистине, у Аллаха девяносто девять имён — сто без одного. Кто перечтёт их (ахсаха), тот войдёт в Рай».',
    ar: 'رواه البخاري ومسلم من حديث أبي هريرة رضي الله عنه.',
    tr: '“Allah’ın doksan dokuz — yüzden bir eksik — ismi vardır. Kim onları sayıp kuşatırsa (ihsâ ederse) Cennet’e girer.”',
  },
  ref: {
    az: 'Buxari 2736, 7392; Müslim 2677 — Əbu Hureyrədən (r.a.)',
    en: 'Bukhari 2736, 7392; Muslim 2677 — from Abu Hurayrah',
    ru: 'Бухари 2736, 7392; Муслим 2677 — от Абу Хурайры',
    ar: 'البخاري ٢٧٣٦، ٧٣٩٢؛ مسلم ٢٦٧٧',
    tr: 'Buhârî 2736, 7392; Müslim 2677 — Ebû Hüreyre’den',
  },
  notes: {
    az: [
      'Hədis adların 99-la məhdud olduğunu bildirmir: məna budur ki, bu sayda ad var ki, onları ihsa edən Cənnətə girər. İbn Useymin misal çəkir: «Sədəqə üçün ayırdığım yüz dirhəmim var» demək başqa pulun olmadığını bildirmir.',
      'İmam Buxari hədisdən sonra Qurandakı «əhsaynahu» sözünü «hafiznahu» — «əzbərlədik» kimi izah edir (Buxari 7392).',
    ],
    en: [
      'The hadith does not limit Allah’s names to 99: it means there are this many names which, if enumerated, bring a person into Paradise. Ibn Uthaymin compares it to saying “I have a hundred dirhams set aside for charity” — which does not mean you have no other money.',
      'After the hadith Imam al-Bukhari explains the Quranic word “ahsaynahu” as “hafiznahu” — “We preserved (memorised) it” (Bukhari 7392).',
    ],
    ru: [
      'Хадис не ограничивает имена Аллаха числом 99: смысл в том, что есть столько имён, перечтя которые человек войдёт в Рай. Ибн Усеймин приводит пример: слова «у меня сто дирхамов, отложенных на милостыню» не означают, что других денег нет.',
      'После хадиса имам аль-Бухари поясняет коранское слово «ахсайнаху» как «хафизнаху» — «Мы сохранили (запомнили) это» (Бухари 7392).',
    ],
    ar: [
      'لا يدل الحديث على حصر الأسماء في هذا العدد، وإنما معناه أن هذا العدد من شأنه أن من أحصاه دخل الجنة؛ ونظيره قولك: عندي مائة درهم أعددتها للصدقة، فلا يمنع أن يكون عندك دراهم أخرى (ابن عثيمين، القواعد المثلى).',
      'قال البخاري عقب الحديث: ﴿أَحْصَيْنَاهُ﴾: حَفِظْنَاهُ (البخاري ٧٣٩٢).',
    ],
    tr: [
      'Hadis Allah’ın isimlerini 99 ile sınırlamaz: anlamı, bu sayıda ismin bulunduğu ve onları ihsâ edenin Cennet’e gireceğidir. İbn Useymin şu örneği verir: “Sadaka için ayırdığım yüz dirhemim var” demek, başka paranın olmadığı anlamına gelmez.',
      'İmam Buhârî hadisten sonra Kur’an’daki “ahsaynâhu” kelimesini “hafiznâhu” — “onu ezberledik/koruduk” diye açıklar (Buhârî 7392).',
    ],
  },
}

// Ihsa — üç mərtəbə (İbn Useymin): ləfzən əzbərləmək, mənasını anlamaq, onların tələbi ilə ibadət etmək
export const IHSA = [
  {
    id: 'memorize', icon: 'hifz',
    title: { az: 'Ləfzini əzbərlə', en: 'Memorise the words', ru: 'Выучи наизусть', ar: 'حفظها لفظًا', tr: 'Lafzını ezberle' },
    text: {
      az: 'Adları düzgün tələffüzlə əzbərlə — aşağıdakı kartlar və yoxlama bunun üçündür. Yalnız Quran və səhih Sünnədə gələn adları öyrən: adlar tövqifidir.',
      en: 'Learn the names by heart with correct pronunciation — the flashcards and quiz below are for this. Learn only names that come in the Quran and authentic Sunnah: the names are fixed by revelation.',
      ru: 'Выучи имена наизусть с правильным произношением — для этого карточки и проверка ниже. Учи только имена, пришедшие в Коране и достоверной Сунне: они устанавливаются Откровением.',
      ar: 'احفظ ألفاظها بنطق صحيح — والبطاقات والاختبار أدناه لهذا الغرض. ولا تحفظ إلا ما ثبت في الكتاب والسنة الصحيحة، فأسماء الله توقيفية.',
      tr: 'İsimleri doğru telaffuzla ezberle — aşağıdaki kartlar ve test bunun içindir. Yalnızca Kur’an’da ve sahih Sünnet’te gelen isimleri öğren: isimler tevkîfîdir.',
    },
  },
  {
    id: 'understand', icon: 'learn',
    title: { az: 'Mənasını anla', en: 'Understand the meaning', ru: 'Пойми смысл', ar: 'فهمها معنًى', tr: 'Anlamını kavra' },
    text: {
      az: 'Hər adın hansı sifəti ehtiva etdiyini bil: ər-Rəhim — rəhmət, əs-Səmi — eşitmə, əl-Alim — elm. Sifəti olduğu kimi isbat et — bənzətmədən və keyfiyyətini soruşmadan.',
      en: 'Know the attribute each name contains: ar-Rahim — mercy, as-Sami‘ — hearing, al-‘Alim — knowledge. Affirm the attribute as it is — without likening it to creation and without asking how.',
      ru: 'Знай, какой атрибут заключён в каждом имени: ар-Рахим — милость, ас-Сами‘ — слух, аль-‘Алим — знание. Утверждай атрибут как он есть — без уподобления творению и без вопроса «как».',
      ar: 'اعرف الصفة التي تضمّنها كل اسم: الرحيم — الرحمة، السميع — السمع، العليم — العلم، وأثبتها كما جاءت من غير تمثيل ولا تكييف.',
      tr: 'Her ismin içerdiği sıfatı bil: er-Rahîm — rahmet, es-Semî — işitme, el-Alîm — ilim. Sıfatı olduğu gibi ispat et — benzetmeden ve keyfiyetini sormadan.',
    },
  },
  {
    id: 'worship', icon: 'duas',
    title: { az: 'Onlarla ibadət et', en: 'Worship Allah by them', ru: 'Поклоняйся ими', ar: 'التعبّد لله بمقتضاها', tr: 'Onlarla ibadet et' },
    text: {
      az: 'Birincisi, Allaha bu adlarla dua et: «Allahın ən gözəl adları var, Onu onlarla çağırın» (Əraf 7:180) — bağışlanma diləyəndə «Ya Ğafur», ruzi diləyəndə «Ya Rəzzaq». İkincisi, adın tələb etdiyinə uyğun yaşa: Rəhimi bilən rəhmətə səbəb olan əməl edər, Səmii bilən dilini qoruyar, Rəqibi bilən gizlində də Allahdan çəkinər.',
      en: 'First, call upon Allah by these names: “To Allah belong the best names, so call upon Him by them” (Al-A‘raf 7:180) — “Ya Ghafur” when asking forgiveness, “Ya Razzaq” when asking provision. Second, live by what the name requires: whoever knows ar-Rahim does deeds that bring mercy, whoever knows as-Sami‘ guards his tongue, whoever knows ar-Raqib fears Allah in private too.',
      ru: 'Во-первых, взывай к Аллаху этими именами: «У Аллаха прекраснейшие имена, посему взывайте к Нему посредством них» (аль-А‘раф 7:180) — «Йа Гафур», прося прощения, «Йа Раззак», прося удел. Во-вторых, живи согласно тому, чего требует имя: знающий ар-Рахима совершает дела, привлекающие милость, знающий ас-Сами‘ бережёт язык, знающий ар-Ракиба боится Аллаха и наедине.',
      ar: 'الأول: أن تدعو الله بها، لقوله تعالى: ﴿فَٱدْعُوهُ بِهَا﴾ (الأعراف: ١٨٠)، فتقول عند طلب المغفرة: يا غفور، وعند طلب الرزق: يا رزاق. الثاني: أن تتعرض في عبادتك لما تقتضيه: فمن عرف أنه الرحيم عمل ما يستجلب رحمته، ومن عرف أنه السميع حفظ لسانه، ومن عرف أنه الرقيب راقبه في السر.',
      tr: 'Birincisi, Allah’a bu isimlerle dua et: “En güzel isimler Allah’ındır; O’na onlarla dua edin” (A‘râf 7:180) — bağışlanma isterken “Yâ Gafûr”, rızık isterken “Yâ Rezzâk”. İkincisi, ismin gerektirdiğine göre yaşa: er-Rahîm’i bilen rahmete vesile olan ameli yapar, es-Semî’i bilen dilini korur, er-Rakîb’i bilen gizlide de Allah’tan sakınır.',
    },
  },
]

// Qaydalar: { n, title, text, ayah: { ref, ar } }
export const NAME_RULES = [
  {
    n: 1,
    title: { az: 'Allahın adlarının hamısı gözəldir', en: 'All of Allah’s names are most beautiful', ru: 'Все имена Аллаха прекраснейшие', ar: 'أسماء الله تعالى كلها حسنى', tr: 'Allah’ın isimlerinin hepsi en güzeldir' },
    text: {
      az: 'Hər ad gözəlliyin son həddindədir, çünki heç bir cəhətdən nöqsanı olmayan kamil sifəti ehtiva edir. Məsələn, əl-Həyy — əvvəlində yoxluq, sonunda fəna olmayan tam həyat deməkdir.',
      en: 'Each name is at the utmost limit of beauty because it contains a perfect attribute with no deficiency in any way. For example, al-Hayy denotes complete life, not preceded by non-existence and not followed by cessation.',
      ru: 'Каждое имя достигает предела красоты, так как заключает совершенный атрибут без какого-либо изъяна. Например, аль-Хайй означает совершенную жизнь, которой не предшествовало небытие и за которой не последует исчезновение.',
      ar: 'أي بالغة في الحسن غايته؛ لأنها متضمنة لصفات كاملة لا نقص فيها بوجه من الوجوه. مثاله: «الحي» متضمن للحياة الكاملة التي لم تُسبق بعدم ولا يلحقها زوال.',
      tr: 'Her isim güzelliğin son noktasındadır, çünkü hiçbir yönden eksiği olmayan kâmil bir sıfatı içerir. Örneğin el-Hayy, öncesinde yokluk ve sonrasında yok oluş bulunmayan tam hayatı ifade eder.',
    },
    ayah: { ref: '7:180', ar: 'وَلِلَّهِ ٱلْأَسْمَآءُ ٱلْحُسْنَىٰ فَٱدْعُوهُ بِهَا' },
  },
  {
    n: 2,
    title: { az: 'Adlar həm xüsusi addır, həm də vəsfdir', en: 'The names are both proper names and descriptions', ru: 'Имена — и собственные имена, и описания', ar: 'أسماء الله تعالى أعلام وأوصاف', tr: 'İsimler hem özel isim hem de vasıftır' },
    text: {
      az: 'Zata dəlalət etdiyinə görə hamısı bir Varlığın — Allahın adlarıdır; mənalarına görə isə hər birinin öz mənası var: əl-Həyyin mənası əl-Alimin mənası deyil. Ər-Rəhim — rəhmət sifəti olandır; ayədə «rəhmət sahibi» deyilməsi buna dəlildir.',
      en: 'In pointing to the Essence they all name one Being — Allah; in their meanings each has its own: the meaning of al-Hayy is not that of al-‘Alim. Ar-Rahim is the One described with mercy, as the verse calls Him “Possessor of mercy”.',
      ru: 'Указывая на Сущность, все они — имена одного Существа, Аллаха; по смыслу же у каждого свой смысл: смысл имени аль-Хайй не тот же, что у аль-‘Алим. Ар-Рахим — Тот, Кто обладает милостью, как называет Его аят: «Обладатель милости».',
      ar: 'أعلام باعتبار دلالتها على الذات، وأوصاف باعتبار ما دلت عليه من المعاني؛ فهي بالاعتبار الأول مترادفة، وبالثاني متباينة. وقوله: ﴿ذُو ٱلرَّحْمَةِ﴾ دل على أن الرحيم هو المتصف بالرحمة.',
      tr: 'Zâta delâlet etmeleri bakımından hepsi tek bir Varlığın — Allah’ın isimleridir; anlamları bakımından ise her birinin kendi anlamı vardır: el-Hayy’ın anlamı el-Alîm’in anlamı değildir. er-Rahîm, rahmet sıfatına sahip olandır; âyette “rahmet sahibi” denmesi buna delildir.',
    },
    ayah: { ref: '18:58', ar: 'وَرَبُّكَ ٱلْغَفُورُ ذُو ٱلرَّحْمَةِ' },
  },
  {
    n: 3,
    title: { az: 'Adın ehtiva etdiyi üç şey', en: 'What a name entails', ru: 'Что заключает в себе имя', ar: 'ما يتضمنه الاسم', tr: 'İsmin içerdiği üç şey' },
    text: {
      az: 'Təsiri başqasına keçən (mütəəddi) mənalı ad üç şeyi isbat edir: adın özünü, ehtiva etdiyi sifəti və onun hökmünü. Əs-Səmi: ad, eşitmə sifəti və Allahın gizli söhbəti də eşitməsi. Təsiri keçməyən mənalı ad (əl-Həyy) iki şeyi isbat edir: adı və sifəti.',
      en: 'A name whose meaning passes on to others (transitive) affirms three things: the name itself, the attribute it contains and its effect. As-Sami‘: the name, the attribute of hearing, and that Allah hears even private conversation. A name with an intransitive meaning (al-Hayy) affirms two: the name and the attribute.',
      ru: 'Имя с переходным значением утверждает три вещи: само имя, заключённый в нём атрибут и его действие. Ас-Сами‘: имя, атрибут слуха и то, что Аллах слышит даже тайную беседу. Имя с непереходным значением (аль-Хайй) утверждает две вещи: имя и атрибут.',
      ar: 'إن دلت على وصف متعدٍّ تضمنت ثلاثة أمور: ثبوت الاسم، وثبوت الصفة، وثبوت حكمها ومقتضاها؛ فالسميع يتضمن إثبات الاسم وصفة السمع وأنه يسمع السر والنجوى. وإن دلت على وصف غير متعدٍّ تضمنت أمرين: ثبوت الاسم وثبوت الصفة، كالحي.',
      tr: 'Etkisi başkasına geçen (müteaddî) anlamlı isim üç şeyi ispat eder: ismin kendisini, içerdiği sıfatı ve onun hükmünü. es-Semî: isim, işitme sıfatı ve Allah’ın gizli konuşmayı da işitmesi. Etkisi geçmeyen anlamlı isim (el-Hayy) iki şeyi ispat eder: ismi ve sıfatı.',
    },
    ayah: { ref: '58:1', ar: 'وَٱللَّهُ يَسْمَعُ تَحَاوُرَكُمَآ ۚ إِنَّ ٱللَّهَ سَمِيعٌۢ بَصِيرٌ' },
  },
  {
    n: 4,
    title: { az: 'Adın dəlalətinin üç növü', en: 'Three ways a name indicates', ru: 'Три вида указания имени', ar: 'دلالة الأسماء: المطابقة والتضمن والالتزام', tr: 'İsmin delâletinin üç türü' },
    text: {
      az: 'Əl-Xaliq adı Allahın Zatına və yaratma sifətinə birlikdə (mütabəqə), onların hər birinə ayrıca (təzammun), elm və qüdrət sifətlərinə isə lazım gəlmə yolu ilə (iltizam) dəlalət edir — yaradan bilən və qadir olmalıdır.',
      en: 'The name al-Khaliq indicates Allah’s Essence and the attribute of creating together (correspondence), each of them alone (inclusion), and the attributes of knowledge and power by necessary implication — the Creator must be knowing and able.',
      ru: 'Имя аль-Халик указывает на Сущность Аллаха и атрибут творения вместе (соответствие), на каждое из них по отдельности (включение), а на атрибуты знания и могущества — через необходимое следствие: Творец непременно знающий и могущественный.',
      ar: '«الخالق» يدل على ذات الله وعلى صفة الخلق بالمطابقة، وعلى الذات وحدها وعلى صفة الخلق وحدها بالتضمن، وعلى صفتي العلم والقدرة بالالتزام؛ ولهذا لما ذكر الله خلق السماوات والأرض قال: ﴿لِتَعْلَمُوٓا۟ أَنَّ ٱللَّهَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ﴾.',
      tr: 'el-Hâlık ismi Allah’ın Zâtına ve yaratma sıfatına birlikte (mutâbakat), her birine ayrı ayrı (tazammun), ilim ve kudret sıfatlarına ise gereklilik yoluyla (iltizâm) delâlet eder — yaratan, bilen ve kudret sahibi olmalıdır.',
    },
    ayah: { ref: '65:12', ar: 'لِتَعْلَمُوٓا۟ أَنَّ ٱللَّهَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ وَأَنَّ ٱللَّهَ قَدْ أَحَاطَ بِكُلِّ شَىْءٍ عِلْمًۢا' },
  },
  {
    n: 5,
    title: { az: 'Adlar tövqifidir — ağlın burada yeri yoxdur', en: 'The names are fixed by revelation', ru: 'Имена устанавливаются Откровением', ar: 'أسماء الله تعالى توقيفية لا مجال للعقل فيها', tr: 'İsimler tevkîfîdir — akla burada yer yoktur' },
    text: {
      az: 'Quran və Sünnədə gələnlə kifayətlənilir: nə artırılır, nə azaldılır. Allahı Özünün adlandırmadığı adla adlandırmaq və ya Özünü adlandırdığı adı inkar etmək Onun haqqına qarşı cinayətdir.',
      en: 'We stop at what the Quran and Sunnah have brought, adding nothing and leaving nothing out. Naming Allah with a name He did not give Himself, or denying a name He did, is a transgression against His right.',
      ru: 'Ограничиваются тем, что пришло в Коране и Сунне, ничего не добавляя и не убавляя. Называть Аллаха именем, которым Он Себя не называл, или отрицать имя, которым Он Себя назвал, — посягательство на Его право.',
      ar: 'فيجب الوقوف فيها على ما جاء به الكتاب والسنة، فلا يزاد فيها ولا ينقص؛ لأن العقل لا يمكنه إدراك ما يستحقه تعالى من الأسماء، ولأن تسميته بما لم يسمِّ به نفسه أو إنكار ما سمى به نفسه جناية في حقه تعالى.',
      tr: 'Kur’an ve Sünnet’te gelenle yetinilir: ne eklenir ne eksiltilir. Allah’ı Kendisinin vermediği bir isimle adlandırmak ya da Kendisine verdiği bir ismi inkâr etmek O’nun hakkına karşı bir cinayettir.',
    },
    ayah: { ref: '17:36', ar: 'وَلَا تَقْفُ مَا لَيْسَ لَكَ بِهِۦ عِلْمٌ' },
  },
  {
    n: 6,
    title: { az: 'Adlar müəyyən sayla məhdud deyil', en: 'The names are not limited to a number', ru: 'Имена не ограничены числом', ar: 'أسماء الله تعالى غير محصورة بعدد معين', tr: 'İsimler belli bir sayıyla sınırlı değildir' },
    text: {
      az: 'Peyğəmbər ﷺ duada belə deyib: «...Sənin Özünü adlandırdığın, Kitabında nazil etdiyin, məxluqundan birinə öyrətdiyin və ya qeyb elmində Özün üçün saxladığın hər bir adınla Səndən istəyirəm...» (Əhməd, 3712). Allahın qeybdə saxladığı adları heç kim saya bilməz.',
      en: 'The Prophet ﷺ said in a supplication: “…I ask You by every name that is Yours, with which You named Yourself, or revealed in Your Book, or taught to any of Your creation, or kept with Yourself in the knowledge of the unseen…” (Ahmad, 3712). No one can count the names Allah has kept in the unseen.',
      ru: 'Пророк ﷺ говорил в мольбе: «…прошу Тебя каждым Твоим именем, которым Ты назвал Себя, или ниспослал в Своём Писании, или научил ему кого-либо из Своих творений, или оставил при Себе в знании сокровенного…» (Ахмад, 3712). Никто не в силах перечесть имена, которые Аллах оставил в сокровенном.',
      ar: 'لقوله ﷺ في الحديث المشهور: «أسألك بكل اسم هو لك، سميت به نفسك، أو أنزلته في كتابك، أو علمته أحدًا من خلقك، أو استأثرت به في علم الغيب عندك» (رواه أحمد وابن حبان والحاكم، وهو صحيح). وما استأثر الله به في علم الغيب لا يمكن أحدًا حصره.',
      tr: 'Peygamber ﷺ bir duasında şöyle demiştir: “…Kendini adlandırdığın, Kitabında indirdiğin, kullarından birine öğrettiğin ya da gayb ilminde Kendine ayırdığın her ismin hakkı için Senden istiyorum…” (Ahmed, 3712). Allah’ın gaybda sakladığı isimleri kimse sayamaz.',
    },
    ayah: null,
  },
  {
    n: 7,
    title: { az: 'Adlarda ilhad — haqdan sapmaq', en: 'Ilhad — deviating with the names', ru: 'Ильхад — уклонение в именах', ar: 'الإلحاد في أسماء الله: الميل بها عما يجب فيها', tr: 'İsimlerde ilhâd — haktan sapmak' },
    text: {
      az: 'Dörd növü var: 1) adları və ya onların sifət və hökmlərini inkar etmək (Cəhmilər kimi); 2) onları məxluqa bənzərliyə dəlil saymaq; 3) Allahı Özünün adlandırmadığı adla adlandırmaq (xristianların «Ata», filosofların «fail səbəb» deməsi kimi); 4) Onun adlarından bütlərə ad törətmək (əl-Uzza — əl-Azizdən). Hamısı haramdır, bəzisi şirk və ya küfrdür.',
      en: 'It has four kinds: 1) denying the names or the attributes and rulings they indicate (as the Jahmiyyah did); 2) making them indicate likeness to creation; 3) naming Allah with what He did not name Himself (as Christians say “Father” and philosophers “the efficient cause”); 4) deriving names for idols from His names (al-‘Uzza from al-‘Aziz). All of it is forbidden, and some of it is shirk or kufr.',
      ru: 'Имеет четыре вида: 1) отрицание имён или указываемых ими атрибутов и положений (как у джахмитов); 2) понимание их как уподобления творению; 3) наречение Аллаха тем, чем Он Себя не называл (как христиане говорят «Отец», а философы — «действующая причина»); 4) образование от Его имён имён для идолов (аль-‘Узза — от аль-‘Азиз). Всё это запретно, а часть — ширк или неверие.',
      ar: 'وهو أنواع: أن ينكر شيئًا منها أو مما دلت عليه من الصفات والأحكام كما فعل الجهمية؛ وأن يجعلها دالة على صفات تشابه صفات المخلوقين؛ وأن يسمى الله بما لم يسمِّ به نفسه كتسمية النصارى له «الأب» والفلاسفة «العلة الفاعلة»؛ وأن يشتق من أسمائه أسماء للأصنام كالعزى من العزيز. والإلحاد بجميع أنواعه محرم، ومنه ما يكون شركًا أو كفرًا.',
      tr: 'Dört türü vardır: 1) isimleri ya da onların sıfat ve hükümlerini inkâr etmek (Cehmiyye gibi); 2) onları mahlûka benzerliğe delil saymak; 3) Allah’ı Kendisinin vermediği bir isimle adlandırmak (Hristiyanların “Baba”, filozofların “fâil illet” demesi gibi); 4) O’nun isimlerinden putlara isim türetmek (el-Uzzâ — el-Azîz’den). Hepsi haramdır, bir kısmı şirk veya küfürdür.',
    },
    ayah: { ref: '7:180', ar: 'وَذَرُوا۟ ٱلَّذِينَ يُلْحِدُونَ فِىٓ أَسْمَـٰٓئِهِۦ ۚ سَيُجْزَوْنَ مَا كَانُوا۟ يَعْمَلُونَ' },
  },
]

export const ATTR_RULES = [
  {
    n: 1,
    title: { az: 'Allahın bütün sifətləri kamillik sifətləridir', en: 'All of Allah’s attributes are attributes of perfection', ru: 'Все атрибуты Аллаха — атрибуты совершенства', ar: 'صفات الله كلها صفات كمال لا نقص فيها', tr: 'Allah’ın bütün sıfatları kemal sıfatlarıdır' },
    text: {
      az: 'Həyat, elm, qüdrət, eşitmə, görmə, rəhmət, izzət, hikmət, uca olmaq kimi — heç bir nöqsanı yoxdur. Ölüm, cəhalət, unutqanlıq, acizlik kimi nöqsan sifətləri Ona aid deyil. Bir halda kamillik, başqa halda nöqsan olan sifətlər (məkr, keyd) yalnız kamillik olduğu halda — düşmənə qarşılıq olaraq — isbat edilir.',
      en: 'Such as life, knowledge, power, hearing, sight, mercy, might, wisdom and highness — with no deficiency at all. Deficient attributes like death, ignorance, forgetfulness and incapacity are impossible for Him. Attributes that are perfection in one case and deficiency in another (plotting, scheming) are affirmed only where they are perfection — in requital against enemies.',
      ru: 'Таковы жизнь, знание, могущество, слух, зрение, милость, величие, мудрость и высота — без какого-либо изъяна. Атрибуты недостатка — смерть, невежество, забывчивость, бессилие — к Нему неприменимы. Атрибуты, являющиеся совершенством в одном случае и недостатком в другом (хитрость, козни), утверждаются лишь там, где они совершенство, — как воздаяние врагам.',
      ar: 'كالحياة والعلم والقدرة والسمع والبصر والرحمة والعزة والحكمة والعلو والعظمة. وصفات النقص كالموت والجهل والنسيان والعجز ممتنعة في حقه. وما كان كمالًا في حال ونقصًا في حال كالمكر والكيد فلا يثبت إطلاقًا ولا ينفى إطلاقًا، بل يثبت في الحال التي يكون فيها كمالًا، أي في مقابلة من يعاملونه ورسله بمثله.',
      tr: 'Hayat, ilim, kudret, işitme, görme, rahmet, izzet, hikmet ve yücelik gibi — hiçbir eksikliği yoktur. Ölüm, cehalet, unutkanlık ve acizlik gibi eksiklik sıfatları O’nun hakkında imkânsızdır. Bir durumda kemal, başka durumda eksiklik olan sıfatlar (mekr, keyd) yalnızca kemal oldukları durumda — düşmanlara karşılık olarak — ispat edilir.',
    },
    ayah: { ref: '16:60', ar: 'وَلِلَّهِ ٱلْمَثَلُ ٱلْأَعْلَىٰ ۚ وَهُوَ ٱلْعَزِيزُ ٱلْحَكِيمُ' },
  },
  {
    n: 2,
    title: { az: 'Sifətlər babı adlar babından genişdir', en: 'The attributes are wider than the names', ru: 'Область атрибутов шире области имён', ar: 'باب الصفات أوسع من باب الأسماء', tr: 'Sıfatlar bâbı isimler bâbından geniştir' },
    text: {
      az: 'Hər ad bir sifəti ehtiva edir, sifətlərin bir qismi isə Allahın sonu olmayan işləri ilə bağlıdır: gəlmək, tutmaq, yaxalamaq və s. Ona görə sifətlərdən ad törədilmir: «gələn» deyə Allaha ad verilmir.',
      en: 'Every name contains an attribute, and some attributes relate to Allah’s actions, which are endless: coming, seizing, holding and so on. For this reason names are not derived from attributes: Allah is not given a name such as “the Comer”.',
      ru: 'Каждое имя заключает атрибут, а часть атрибутов связана с бесконечными действиями Аллаха: приход, взятие, удержание и т. д. Поэтому от атрибутов имена не образуются: Аллаха не называют, например, «Приходящим».',
      ar: 'لأن كل اسم متضمن لصفة، ولأن من الصفات ما يتعلق بأفعال الله تعالى، وأفعاله لا منتهى لها كما أن أقواله لا منتهى لها، كالمجيء والإتيان والأخذ والإمساك والبطش.',
      tr: 'Her isim bir sıfatı içerir; sıfatların bir kısmı ise Allah’ın sonu olmayan fiilleriyle ilgilidir: gelmek, yakalamak, tutmak vb. Bu yüzden sıfatlardan isim türetilmez: Allah’a “Gelen” diye isim verilmez.',
    },
    ayah: { ref: '31:27', ar: 'مَّا نَفِدَتْ كَلِمَـٰتُ ٱللَّهِ ۗ إِنَّ ٱللَّهَ عَزِيزٌ حَكِيمٌ' },
  },
  {
    n: 3,
    title: { az: 'Sübuti (isbat edilən) və sülbi (inkar edilən) sifətlər', en: 'Affirmed and negated attributes', ru: 'Утверждаемые и отрицаемые атрибуты', ar: 'الصفات ثبوتية وسلبية', tr: 'Sübûtî ve selbî sıfatlar' },
    text: {
      az: 'Sübuti sifətlər — Allahın Özünə isbat etdikləri: həyat, elm, Ərşə istiva, dünya səmasına enmə, üz, iki əl. Onlar Ona layiq şəkildə, həqiqi mənada isbat edilir. Sülbi sifətlər — Onun Özündən inkar etdikləri: ölüm, yuxu, cəhalət, acizlik. Onlar inkar edilir və əksi kamil şəkildə isbat olunur.',
      en: 'Affirmed attributes are those Allah affirmed for Himself: life, knowledge, rising over the Throne, descending to the lowest heaven, the Face, the two Hands — affirmed in reality as befits Him. Negated attributes are those He denied of Himself: death, sleep, ignorance, incapacity — they are negated while the perfection of their opposite is affirmed.',
      ru: 'Утверждаемые атрибуты — то, что Аллах утвердил для Себя: жизнь, знание, вознесение над Троном, нисхождение к ближнему небу, Лик, две Руки — утверждаются в истинном смысле, как подобает Ему. Отрицаемые — то, что Он отверг от Себя: смерть, сон, невежество, бессилие; их отрицают, утверждая совершенство противоположного.',
      ar: 'فالثبوتية: ما أثبته الله لنفسه كالحياة والعلم والاستواء على العرش والنزول إلى السماء الدنيا والوجه واليدين، فيجب إثباتها حقيقة على الوجه اللائق به. والسلبية: ما نفاه عن نفسه كالموت والنوم والجهل والعجز، فيجب نفيها مع إثبات كمال ضدها.',
      tr: 'Sübûtî sıfatlar Allah’ın Kendisi için ispat ettikleridir: hayat, ilim, Arş’a istivâ, dünya semasına iniş, yüz, iki el — O’na yakışır şekilde hakiki olarak ispat edilir. Selbî sıfatlar O’nun Kendisinden nefyettikleridir: ölüm, uyku, cehalet, acizlik — nefyedilir ve zıddının kemali ispat edilir.',
    },
    ayah: { ref: '35:44', ar: 'وَمَا كَانَ ٱللَّهُ لِيُعْجِزَهُۥ مِن شَىْءٍ فِى ٱلسَّمَـٰوَٰتِ وَلَا فِى ٱلْأَرْضِ ۚ إِنَّهُۥ كَانَ عَلِيمًا قَدِيرًا' },
  },
  {
    n: 4,
    title: { az: 'Sübuti sifətlər tərif və kamillikdir', en: 'Affirmed attributes are praise and perfection', ru: 'Утверждаемые атрибуты — хвала и совершенство', ar: 'الصفات الثبوتية صفات مدح وكمال', tr: 'Sübûtî sıfatlar övgü ve kemaldir' },
    text: {
      az: 'Ona görə Quranda isbat edilən sifətlər inkar edilənlərdən qat-qat çoxdur. İnkar əsasən üç halda gəlir: kamilliyin ümumiliyini bildirmək üçün, yalançıların iddiasını rədd etmək üçün və müəyyən məsələdə nöqsan zənnini aradan qaldırmaq üçün.',
      en: 'That is why the attributes affirmed in the Quran far outnumber those negated. Negation mostly comes in three cases: to show the comprehensiveness of His perfection, to refute what liars claimed about Him, and to remove an imagined deficiency in a particular matter.',
      ru: 'Поэтому утверждаемых в Коране атрибутов намного больше, чем отрицаемых. Отрицание приходит в основном в трёх случаях: чтобы показать всеобъемлющее совершенство, опровергнуть ложные утверждения о Нём и устранить мнимый недостаток в определённом вопросе.',
      ar: 'ولهذا كانت الصفات الثبوتية أكثر بكثير من السلبية. وأما السلبية فلم تذكر غالبًا إلا في أحوال: بيان عموم كماله، ونفي ما ادعاه في حقه الكاذبون، ودفع توهم نقص من كماله فيما يتعلق بأمر معيّن.',
      tr: 'Bu yüzden Kur’an’da ispat edilen sıfatlar nefyedilenlerden kat kat fazladır. Nefiy çoğunlukla üç durumda gelir: kemalinin genelliğini bildirmek, yalancıların iddialarını reddetmek ve belli bir konuda eksiklik vehmini gidermek için.',
    },
    ayah: { ref: '112:4', ar: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ' },
  },
  {
    n: 5,
    title: { az: 'Zati və fe’li sifətlər', en: 'Essential and active attributes', ru: 'Сущностные атрибуты и атрибуты действия', ar: 'الصفات الثبوتية ذاتية وفعلية', tr: 'Zâtî ve fiilî sıfatlar' },
    text: {
      az: 'Zati sifətlər — Allahın həmişə malik olduğu sifətlər: elm, qüdrət, eşitmə, görmə, ucalıq; xəbəri sifətlər də bura daxildir: üz, iki əl, iki göz. Fe’li sifətlər — Onun istəyinə bağlı olanlar: Ərşə istiva, dünya səmasına enmə. Kəlam hər ikisidir: əslinə görə zati, ayrı-ayrı sözlərinə görə fe’lidir.',
      en: 'Essential attributes are those Allah has always had: knowledge, power, hearing, sight, highness; the reported attributes such as the Face, two Hands and Eyes also belong here. Active attributes depend on His will: rising over the Throne, descending to the lowest heaven. Speech is both: essential in origin, active in its individual words.',
      ru: 'Сущностные атрибуты присущи Аллаху всегда: знание, могущество, слух, зрение, высота; сюда же относятся передаваемые атрибуты: Лик, две Руки, Глаза. Атрибуты действия связаны с Его волей: вознесение над Троном, нисхождение к ближнему небу. Речь — и то и другое: сущностная по своей основе и атрибут действия в отдельных словах.',
      ar: 'فالذاتية: التي لم يزل ولا يزال متصفًا بها كالعلم والقدرة والسمع والبصر والعلو، ومنها الخبرية كالوجه واليدين والعينين. والفعلية: التي تتعلق بمشيئته كالاستواء على العرش والنزول إلى السماء الدنيا. وقد تكون الصفة ذاتية فعلية باعتبارين كالكلام.',
      tr: 'Zâtî sıfatlar Allah’ın her zaman sahip olduğu sıfatlardır: ilim, kudret, işitme, görme, yücelik; haberî sıfatlar da buraya girer: yüz, iki el, gözler. Fiilî sıfatlar O’nun dilemesine bağlıdır: Arş’a istivâ, dünya semasına iniş. Kelâm her ikisidir: aslı itibarıyla zâtî, tek tek sözleri itibarıyla fiilîdir.',
    },
    ayah: { ref: '36:82', ar: 'إِنَّمَآ أَمْرُهُۥٓ إِذَآ أَرَادَ شَيْـًٔا أَن يَقُولَ لَهُۥ كُن فَيَكُونُ' },
  },
  {
    n: 6,
    title: { az: 'İki təhlükədən uzaq durmaq: təmsil və təkyif', en: 'Avoiding two dangers: likening and asking how', ru: 'Избегать двух опасностей: уподобления и вопроса «как»', ar: 'التخلي عن محذورين: التمثيل والتكييف', tr: 'İki tehlikeden kaçınmak: temsil ve tekyif' },
    text: {
      az: 'Təmsil — sifətləri məxluqun sifətlərinə bənzər saymaqdır; təkyif — onların keyfiyyətini təsəvvür etmək, təsvir etməkdir. Hər ikisi batildir. İmam Malik istiva barədə soruşulanda demişdir: «İstiva məlumdur, keyfiyyəti ağılla dərk olunmaz, ona iman vacibdir, bu barədə sual bidətdir.»',
      en: 'Tamthil is believing the attributes resemble those of creation; takyif is picturing or describing how they are. Both are false. When Imam Malik was asked about the rising over the Throne he said: “Istiwa is not unknown, its how is not comprehensible, believing in it is obligatory and asking about it is an innovation.”',
      ru: 'Тамсиль — считать атрибуты подобными атрибутам творений; такйиф — представлять или описывать, каковы они. И то и другое ложно. Когда имама Малика спросили о вознесении над Троном, он сказал: «Вознесение известно, его образ непостижим, вера в него обязательна, а вопрос о нём — нововведение».',
      ar: 'فالتمثيل: اعتقاد أن صفات الله مماثلة لصفات المخلوقين، والتكييف: أن يعتقد أن كيفيتها كذا وكذا. وكلاهما باطل. ولما سئل مالك عن الاستواء قال: «الاستواء غير مجهول، والكيف غير معقول، والإيمان به واجب، والسؤال عنه بدعة».',
      tr: 'Temsil, sıfatları mahlûkun sıfatlarına benzer saymaktır; tekyif, onların keyfiyetini tasavvur etmek ve tarif etmektir. İkisi de batıldır. İmam Mâlik istivâ sorulduğunda şöyle demiştir: “İstivâ bilinmektedir, keyfiyeti akılla kavranamaz, ona iman vaciptir, onu sormak bidattir.”',
    },
    ayah: { ref: '42:11', ar: 'لَيْسَ كَمِثْلِهِۦ شَىْءٌ ۖ وَهُوَ ٱلسَّمِيعُ ٱلْبَصِيرُ' },
  },
  {
    n: 7,
    title: { az: 'Sifətlər də tövqifidir', en: 'The attributes are also fixed by revelation', ru: 'Атрибуты также устанавливаются Откровением', ar: 'صفات الله تعالى توقيفية لا مجال للعقل فيها', tr: 'Sıfatlar da tevkîfîdir' },
    text: {
      az: 'İmam Əhməd demişdir: «Allah yalnız Özünü və Rəsulunun Onu vəsf etdiyi ilə vəsf olunur; Qurandan və hədisdən kənara çıxılmaz.» Sifət üç yolla sabit olur: açıq zikr ilə (izzət, rəhmət, üz), addan (əl-Ğafur — məğfirət) və ona dəlalət edən fel ilə (Ərşə istiva, enmə, gəlmə).',
      en: 'Imam Ahmad said: “Allah is described only with what He described Himself or His Messenger described Him, without going beyond the Quran and hadith.” An attribute is established in three ways: stated explicitly (might, mercy, the Face), contained in a name (al-Ghafur — forgiveness), or indicated by a verb (rising over the Throne, descending, coming).',
      ru: 'Имам Ахмад сказал: «Аллах описывается лишь тем, чем Он описал Себя или чем описал Его Посланник, не выходя за пределы Корана и хадиса». Атрибут устанавливается тремя путями: прямым упоминанием (величие, милость, Лик), через имя (аль-Гафур — прощение) или глаголом, указывающим на него (вознесение над Троном, нисхождение, приход).',
      ar: 'قال الإمام أحمد: «لا يوصف الله إلا بما وصف به نفسه، أو وصفه به رسوله ﷺ، لا يتجاوز القرآن والحديث». ولدلالة الكتاب والسنة على ثبوت الصفة ثلاثة أوجه: التصريح بالصفة، وتضمن الاسم لها، والتصريح بفعل أو وصف دال عليها.',
      tr: 'İmam Ahmed şöyle demiştir: “Allah ancak Kendisini ve Resûlü’nün O’nu vasfettiği şekilde vasfedilir; Kur’an’ın ve hadisin ötesine geçilmez.” Sıfat üç yolla sabit olur: açıkça zikredilerek (izzet, rahmet, yüz), bir ismin içerdiği anlamla (el-Gafûr — mağfiret) ya da ona delâlet eden bir fiille (Arş’a istivâ, iniş, geliş).',
    },
    ayah: { ref: '20:5', ar: 'ٱلرَّحْمَـٰنُ عَلَى ٱلْعَرْشِ ٱسْتَوَىٰ' },
  },
]
