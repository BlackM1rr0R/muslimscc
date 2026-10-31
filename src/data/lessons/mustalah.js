// Hədis elminin (mustələh) əsasları və muslims.cc-nin zəif/uydurma hədisləri niyə çıxardığı.
// Hədislər fawazahmed0 hadith-api ilə yoxlanıb (Sünən kitablarında Albaninin dərəcəsi də oradandır).
// Fətvalar: islamqa.info/ar/answers/44877 və 13637 açılıb oxunub.

const AGREED = { az: 'Səhih', en: 'Sahih', ru: 'Достоверный', ar: 'صحيح', tr: 'Sahih' }
const SAHIH_ALB = { az: 'Səhih (Albani)', en: 'Sahih (al-Albani)', ru: 'Достоверный (аль-Албани)', ar: 'صحيح (الألباني)', tr: 'Sahih (Elbânî)' }

export const meta = {
  slug: 'mustalah',
  cat: 'knowledge',
  order: 10,
  icon: 'hadith',
  arTitle: 'مبادئ علم مصطلح الحديث',
  title: {
    az: 'Hədis elminin əsasları',
    en: 'Basics of Hadith Science',
    ru: 'Основы науки о хадисах',
    ar: 'مبادئ علم مصطلح الحديث',
    tr: 'Hadis Usulünün Esasları',
  },
  summary: {
    az: 'İsnad və mətn, səhih, həsən, zəif və mövzu hədisin şərtləri, hədisi necə yoxlamalı, məşhur kitablar, Albaninin əməyi və saytın zəif hədisləri niyə çıxardığı.',
    en: 'Isnad and matn; sahih, hasan, weak and fabricated hadith; how to check a hadith; the main collections, al-Albani’s work and why this site removed weak hadith.',
    ru: 'Иснад и матн; достоверный, хороший, слабый и выдуманный хадис; как проверить хадис; главные сборники, труд аль-Албани и почему сайт убрал слабые хадисы.',
    ar: 'الإسناد والمتن، وشروط الصحيح والحسن، والضعيف والموضوع، وكيف تتحقق من الحديث، وأشهر الكتب وجهود الألباني، ولماذا حذف الموقع الضعيف.',
    tr: 'İsnad ve metin; sahih, hasen, zayıf ve mevzu hadis; hadis nasıl kontrol edilir; meşhur kitaplar, Elbânî’nin emeği ve sitenin zayıf hadisleri neden çıkardığı.',
  },
  author: {
    az: 'İbn əs-Səlah, İbn Həcər, İbn Useymin («Mustələhul-hədis»), Albani',
    en: 'Ibn as-Salah, Ibn Hajar, Ibn ‘Uthaymin (“Mustalah al-Hadith”), al-Albani',
    ru: 'Ибн ас-Салах, Ибн Хаджар, Ибн Усеймин («Мусталах аль-хадис»), аль-Албани',
    ar: 'ابن الصلاح، ابن حجر، ابن عثيمين («مصطلح الحديث»)، الألباني',
    tr: 'İbnü’s-Salâh, İbn Hacer, İbn Useymîn (“Mustalahu’l-Hadîs”), Elbânî',
  },
  minutes: 16,
}

export default {
  sections: [
    {
      id: 'why',
      title: { az: 'Bu elm nə üçündür?', en: 'Why this science exists', ru: 'Зачем нужна эта наука', ar: 'لماذا هذا العلم؟', tr: 'Bu ilim ne içindir?' },
      blocks: [
        { t: 'p', text: {
          az: 'Hədis elmi (mustələhul-hədis) Peyğəmbərə ﷺ aid edilən sözün ona həqiqətən aid olub-olmadığını müəyyən edən qaydalar toplusudur. Allah Öz dinini qorumağı vəd edib, Sünnəni qorumaq üçün də müsəlmanlara bu elmi nəsib edib.',
          en: 'The science of hadith (mustalah al-hadith) is the set of rules by which we determine whether a statement attributed to the Prophet ﷺ is truly from him. Allah promised to preserve His religion, and He granted the Muslims this science to preserve the Sunnah.',
          ru: 'Наука о хадисах (мусталах аль-хадис) — это совокупность правил, по которым определяют, действительно ли слова, приписываемые Пророку ﷺ, принадлежат ему. Аллах обещал сохранить Свою религию и даровал мусульманам эту науку для сохранения Сунны.',
          ar: 'علم مصطلح الحديث قواعد يُعرف بها حال ما يُنسب إلى النبي ﷺ: أثابت عنه أم لا. وقد تكفل الله بحفظ دينه، ومن أسباب حفظ السنة هذا العلم.',
          tr: 'Hadis usulü (mustalahu’l-hadîs), Peygamber’e ﷺ nispet edilen bir sözün gerçekten ona ait olup olmadığını belirleyen kurallar bütünüdür. Allah dinini korumayı vaat etmiş, Sünneti korumak için de Müslümanlara bu ilmi nasip etmiştir.',
        } },
        { t: 'ayah', ar: 'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟ إِن جَآءَكُمْ فَاسِقٌۢ بِنَبَإٍ فَتَبَيَّنُوٓا۟ أَن تُصِيبُوا۟ قَوْمًۢا بِجَهَـٰلَةٍ فَتُصْبِحُوا۟ عَلَىٰ مَا فَعَلْتُمْ نَـٰدِمِينَ', ref: '49:6', text: {
          az: 'Ey iman gətirənlər! Əgər bir fasiq sizə bir xəbər gətirsə, onu dəqiqləşdirin ki, bilmədən bir qövmə zərər verib sonra etdiyinizə peşman olmayasınız.',
          en: 'O you who believe, if a sinful person brings you news, verify it, lest you harm a people in ignorance and then regret what you have done.',
          ru: 'О те, которые уверовали! Если нечестивец принесёт вам весть, то проверьте её, чтобы по неведению не причинить вреда людям и потом не сожалеть о содеянном.',
          ar: 'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟ إِن جَآءَكُمْ فَاسِقٌۢ بِنَبَإٍ فَتَبَيَّنُوٓا۟',
          tr: 'Ey iman edenler! Bir fasık size bir haber getirirse, bilmeden bir topluluğa zarar verip sonra yaptığınıza pişman olmamak için onun doğruluğunu araştırın.',
        } },
        { t: 'hadith', ar: 'مَنْ يَقُلْ عَلَيَّ مَا لَمْ أَقُلْ فَلْيَتَبَوَّأْ مَقْعَدَهُ مِنَ النَّارِ', src: { az: 'Buxari 109', en: 'al-Bukhari 109', ru: 'Бухари 109', ar: 'البخاري ١٠٩', tr: 'Buhârî 109' }, grade: AGREED, text: {
          az: 'Sələmə ibn əl-Əkva deyir: Peyğəmbərin ﷺ belə dediyini eşitdim: «Kim mənim deməmədiyim bir sözü mənə aid etsə, Oddakı yerinə hazırlaşsın».',
          en: 'Salamah ibn al-Akwa‘ said: I heard the Prophet ﷺ say: “Whoever attributes to me what I did not say, let him take his seat in the Fire.”',
          ru: 'Салама ибн аль-Акуа сказал: я слышал, как Пророк ﷺ говорил: «Кто припишет мне то, чего я не говорил, пусть займёт своё место в Огне».',
          ar: 'عن سلمة بن الأكوع قال: سمعت النبي ﷺ يقول: «من يقل علي ما لم أقل فليتبوأ مقعده من النار».',
          tr: 'Seleme b. el-Ekva‘ şöyle dedi: Peygamber’in ﷺ şöyle buyurduğunu işittim: “Kim benim söylemediğim bir sözü bana isnat ederse cehennemdeki yerine hazırlansın.”',
        } },
        { t: 'hadith', ar: 'كَفَى بِالْمَرْءِ إِثْمًا أَنْ يُحَدِّثَ بِكُلِّ مَا سَمِعَ', src: { az: 'Əbu Davud 4992', en: 'Abu Dawud 4992', ru: 'Абу Дауд 4992', ar: 'أبو داود ٤٩٩٢', tr: 'Ebû Dâvûd 4992' }, grade: SAHIH_ALB, text: {
          az: 'Əbu Hüreyrə rəvayət edir ki, Peyğəmbər ﷺ dedi: «Eşitdiyi hər şeyi danışması insana günah olaraq bəs edər».',
          en: 'Abu Hurayrah reported that the Prophet ﷺ said: “It is enough of a sin for a person to narrate everything he hears.”',
          ru: 'Абу Хурайра передал, что Пророк ﷺ сказал: «Достаточно греха человеку, чтобы рассказывать всё, что он слышит».',
          ar: 'عن أبي هريرة أن النبي ﷺ قال: «كفى بالمرء إثمًا أن يحدث بكل ما سمع».',
          tr: 'Ebû Hüreyre’nin rivayetine göre Peygamber ﷺ şöyle buyurdu: “Duyduğu her şeyi anlatması kişiye günah olarak yeter.”',
        } },
        { t: 'quote', ar: 'الإِسْنَادُ مِنَ الدِّينِ، وَلَوْلاَ الإِسْنَادُ لَقَالَ مَنْ شَاءَ مَا شَاءَ', by: { az: 'Abdullah ibn əl-Mübarək', en: '‘Abdullah ibn al-Mubarak', ru: 'Абдуллах ибн аль-Мубарак', ar: 'عبد الله بن المبارك', tr: 'Abdullah b. el-Mübârek' }, ref: { az: 'Müslim, «Səhih»in müqəddiməsi', en: 'Muslim, introduction to the “Sahih”', ru: 'Муслим, введение к «Сахиху»', ar: 'مقدمة صحيح مسلم', tr: 'Müslim, “Sahih”in mukaddimesi' }, text: {
          az: '«İsnad dindəndir. İsnad olmasaydı, kim nə istəsə deyərdi».',
          en: '“The isnad is part of the religion. Were it not for the isnad, anyone could say whatever he wished.”',
          ru: '«Иснад — часть религии. Если бы не иснад, любой говорил бы что пожелает».',
          ar: '«الإسناد من الدين، ولولا الإسناد لقال من شاء ما شاء».',
          tr: '“İsnad dindendir. İsnad olmasaydı dileyen dilediğini söylerdi.”',
        } },
        { t: 'quote', ar: 'إِنَّ هَذَا الْعِلْمَ دِينٌ فَانْظُرُوا عَمَّنْ تَأْخُذُونَ دِينَكُمْ', by: { az: 'Muhəmməd ibn Sirin', en: 'Muhammad ibn Sirin', ru: 'Мухаммад ибн Сирин', ar: 'محمد بن سيرين', tr: 'Muhammed b. Sîrîn' }, ref: { az: 'Müslim, «Səhih»in müqəddiməsi', en: 'Muslim, introduction to the “Sahih”', ru: 'Муслим, введение к «Сахиху»', ar: 'مقدمة صحيح مسلم', tr: 'Müslim, “Sahih”in mukaddimesi' }, text: {
          az: '«Bu elm dindir, dininizi kimdən aldığınıza baxın».',
          en: '“This knowledge is religion, so look carefully at whom you take your religion from.”',
          ru: '«Это знание — религия, так смотрите же, от кого вы берёте свою религию».',
          ar: '«إن هذا العلم دين، فانظروا عمن تأخذون دينكم».',
          tr: '“Bu ilim dindir; dininizi kimden aldığınıza bakın.”',
        } },
      ],
    },
    {
      id: 'terms',
      title: { az: 'Əsas terminlər', en: 'Key terms', ru: 'Основные термины', ar: 'مصطلحات أساسية', tr: 'Temel terimler' },
      blocks: [
        { t: 'table',
          head: [
            { az: 'Termin', en: 'Term', ru: 'Термин', ar: 'المصطلح', tr: 'Terim' },
            { az: 'Mənası', en: 'Meaning', ru: 'Значение', ar: 'معناه', tr: 'Anlamı' },
          ],
          rows: [
            [{ az: 'İsnad (sənəd)', en: 'Isnad (sanad)', ru: 'Иснад (санад)', ar: 'الإسناد (السند)', tr: 'İsnad (sened)' }, { az: 'Hədisi bir-birindən nəql edən ravilərin zənciri: «Filankəs bizə danışdı, filankəsdən…».', en: 'The chain of narrators who passed the hadith from one to another: “So-and-so told us, from so-and-so…”.', ru: 'Цепочка передатчиков, передававших хадис друг другу: «Нам рассказал такой-то со слов такого-то…».', ar: 'سلسلة الرواة الموصلة إلى المتن: حدثنا فلان عن فلان...', tr: 'Hadisi birbirinden nakleden ravilerin zinciri: “Falan bize anlattı, falandan…”.' }],
            [{ az: 'Mətn', en: 'Matn', ru: 'Матн', ar: 'المتن', tr: 'Metin' }, { az: 'İsnadın sonunda gələn söz — hədisin özü.', en: 'The wording that comes at the end of the chain — the hadith itself.', ru: 'Слова, которыми заканчивается цепочка, — сам хадис.', ar: 'ما ينتهي إليه السند من الكلام.', tr: 'Senedin sonunda gelen söz — hadisin kendisi.' }],
            [{ az: 'Ravi', en: 'Narrator (rawi)', ru: 'Передатчик (рави)', ar: 'الراوي', tr: 'Râvi' }, { az: 'Hədisi nəql edən şəxs.', en: 'The person who transmits the hadith.', ru: 'Человек, передающий хадис.', ar: 'ناقل الحديث.', tr: 'Hadisi nakleden kişi.' }],
            [{ az: 'Mərfu', en: 'Marfu‘', ru: 'Марфу', ar: 'المرفوع', tr: 'Merfû' }, { az: 'Peyğəmbərə ﷺ aid edilən söz, iş və ya təsdiq.', en: 'A saying, action or approval attributed to the Prophet ﷺ.', ru: 'Слово, действие или одобрение, приписываемое Пророку ﷺ.', ar: 'ما أضيف إلى النبي ﷺ من قول أو فعل أو تقرير.', tr: 'Peygamber’e ﷺ nispet edilen söz, fiil veya takrir.' }],
            [{ az: 'Mövquf', en: 'Mawquf', ru: 'Маукуф', ar: 'الموقوف', tr: 'Mevkûf' }, { az: 'Səhabəyə aid edilən söz və ya iş.', en: 'A saying or action attributed to a Companion.', ru: 'Слово или действие, приписываемое сподвижнику.', ar: 'ما أضيف إلى الصحابي.', tr: 'Sahabeye nispet edilen söz veya fiil.' }],
            [{ az: 'Məqtu', en: 'Maqtu‘', ru: 'Макту', ar: 'المقطوع', tr: 'Maktû' }, { az: 'Tabiinə (səhabədən öyrənənə) aid edilən söz.', en: 'A statement attributed to a Successor (a student of the Companions).', ru: 'Слово, приписываемое табиину (ученику сподвижников).', ar: 'ما أضيف إلى التابعي فمن دونه.', tr: 'Tâbiîye (sahabeden öğrenene) nispet edilen söz.' }],
            [{ az: 'Mütəvatir / ahad', en: 'Mutawatir / ahad', ru: 'Мутаватир / ахад', ar: 'المتواتر / الآحاد', tr: 'Mütevâtir / âhâd' }, { az: 'Mütəvatir — yalan üzərində birləşməsi mümkün olmayan çox sayda ravinin nəqli; ahad — bu həddə çatmayan nəql. Səhih ahad hədis də dəlildir.', en: 'Mutawatir: narrated by so many that agreement on a lie is impossible; ahad: anything short of that. An authentic ahad hadith is also binding evidence.', ru: 'Мутаватир — передано столь многими, что сговор на ложь невозможен; ахад — всё, что не достигло этого. Достоверный хадис ахад тоже является доводом.', ar: 'المتواتر: ما رواه جمع يستحيل تواطؤهم على الكذب، والآحاد ما دونه، والآحاد الصحيح حجة.', tr: 'Mütevâtir: yalan üzerinde birleşmeleri imkânsız sayıda kişinin naklettiği; âhâd: bu sayıya ulaşmayan. Sahih âhâd hadis de delildir.' }],
          ],
        },
        { t: 'note', kind: 'tip', text: {
          az: 'Nümunə: «Səhih əl-Buxari»nin birinci hədisində isnad belədir: Humeydi → Süfyan → Yəhya ibn Səid → Muhəmməd ibn İbrahim ət-Teymi → Alqamə ibn Vəqqas → Ömər ibn əl-Xəttab → Peyğəmbər ﷺ. Mətn isə: «Əməllər ancaq niyyətlərə görədir…».',
          en: 'Example: in the first hadith of “Sahih al-Bukhari” the isnad is: al-Humaydi → Sufyan → Yahya ibn Sa‘id → Muhammad ibn Ibrahim at-Taymi → ‘Alqamah ibn Waqqas → ‘Umar ibn al-Khattab → the Prophet ﷺ. The matn is: “Actions are only by intentions…”.',
          ru: 'Пример: в первом хадисе «Сахиха» аль-Бухари иснад таков: аль-Хумайди → Суфьян → Яхья ибн Саид → Мухаммад ибн Ибрахим ат-Тайми → Алкама ибн Ваккас → Умар ибн аль-Хаттаб → Пророк ﷺ. Матн: «Поистине, дела оцениваются только по намерениям…».',
          ar: 'مثال: إسناد أول حديث في صحيح البخاري: الحميدي ← سفيان ← يحيى بن سعيد ← محمد بن إبراهيم التيمي ← علقمة بن وقاص ← عمر بن الخطاب ← النبي ﷺ، والمتن: «إنما الأعمال بالنيات...».',
          tr: 'Örnek: “Sahîh-i Buhârî”nin ilk hadisinde isnad şöyledir: Humeydî → Süfyân → Yahyâ b. Saîd → Muhammed b. İbrâhîm et-Teymî → Alkame b. Vakkâs → Ömer b. el-Hattâb → Peygamber ﷺ. Metin ise: “Ameller ancak niyetlere göredir…”.',
        } },
      ],
    },
    {
      id: 'sahih',
      title: { az: 'Səhih hədisin beş şərti', en: 'The five conditions of a sahih hadith', ru: 'Пять условий достоверного хадиса', ar: 'شروط الحديث الصحيح الخمسة', tr: 'Sahih hadisin beş şartı' },
      blocks: [
        { t: 'p', text: {
          az: 'İbn əs-Səlah, İbn Həcər və onlardan sonrakı alimlərin (o cümlədən İbn Useyminin «Mustələhul-hədis» kitabının) tərifinə görə səhih hədis bu beş şərti daşıyan hədisdir:',
          en: 'According to the definition of Ibn as-Salah, Ibn Hajar and the scholars after them (including Ibn ‘Uthaymin’s “Mustalah al-Hadith”), a sahih hadith is one that meets these five conditions:',
          ru: 'Согласно определению Ибн ас-Салаха, Ибн Хаджара и учёных после них (в том числе в книге Ибн Усеймина «Мусталах аль-хадис»), достоверный хадис — это хадис, отвечающий пяти условиям:',
          ar: 'الصحيح عند ابن الصلاح وابن حجر ومن بعدهم (ومنهم ابن عثيمين في «مصطلح الحديث») ما اجتمعت فيه خمسة شروط:',
          tr: 'İbnü’s-Salâh, İbn Hacer ve onlardan sonraki âlimlerin (İbn Useymîn’in “Mustalahu’l-Hadîs” kitabı dahil) tanımına göre sahih hadis şu beş şartı taşıyan hadistir:',
        } },
        { t: 'steps', items: [
          { title: { az: 'İsnadın bitişik olması', en: 'A connected chain', ru: 'Непрерывность иснада', ar: 'اتصال السند', tr: 'Senedin muttasıl olması' }, text: { az: 'Hər ravi hədisi öz şeyxindən birbaşa almış olmalıdır — zəncirdə qırıq olmamalıdır.', en: 'Each narrator must have taken the hadith directly from his teacher — no break in the chain.', ru: 'Каждый передатчик должен был взять хадис непосредственно от своего шейха — без разрывов в цепочке.', ar: 'أن يكون كل راوٍ قد أخذه عمن فوقه مباشرة بلا انقطاع.', tr: 'Her râvi hadisi doğrudan kendi hocasından almış olmalıdır — zincirde kopukluk olmamalıdır.' } },
          { title: { az: 'Ravilərin ədaləti', en: 'Upright narrators (‘adalah)', ru: 'Праведность передатчиков', ar: 'عدالة الرواة', tr: 'Râvilerin adaleti' }, text: { az: 'Hər ravi müsəlman, həddi-büluğa çatmış, ağıllı, fasiq olmayan və mürüvvəti pozmayan olmalıdır.', en: 'Each narrator must be a Muslim, adult, sane, not sinful and of upright conduct.', ru: 'Каждый передатчик — мусульманин, совершеннолетний, разумный, не нечестивый и благопристойный.', ar: 'أن يكون كل راوٍ مسلمًا بالغًا عاقلًا سالمًا من الفسق وخوارم المروءة.', tr: 'Her râvi Müslüman, ergen, akıllı, fâsık olmayan ve mürüvveti bozmayan biri olmalıdır.' } },
          { title: { az: 'Tam zəbt (dəqiqlik)', en: 'Full precision (dabt)', ru: 'Полная точность (дабт)', ar: 'تمام الضبط', tr: 'Tam zabt (titizlik)' }, text: { az: 'Ravi eşitdiyini yaddaşında və ya kitabında dəqiq qorumalıdır.', en: 'The narrator must preserve accurately what he heard, in memory or in writing.', ru: 'Передатчик должен точно сохранять услышанное — в памяти или в записи.', ar: 'أن يحفظ الراوي ما سمعه حفظ صدر أو كتاب.', tr: 'Râvi işittiğini hafızasında veya kitabında doğru korumalıdır.' } },
          { title: { az: 'Şaz olmaması', en: 'No irregularity (shudhudh)', ru: 'Отсутствие отклонения (шузуз)', ar: 'عدم الشذوذ', tr: 'Şâz olmaması' }, text: { az: 'Etibarlı ravi özündən daha etibarlı olanlara zidd rəvayət etməməlidir.', en: 'A reliable narrator must not contradict those more reliable than him.', ru: 'Надёжный передатчик не должен противоречить тем, кто надёжнее его.', ar: 'ألا يخالف الثقة من هو أوثق منه.', tr: 'Güvenilir râvi kendisinden daha güvenilir olanlara aykırı rivayet etmemelidir.' } },
          { title: { az: 'Gizli qüsur (illət) olmaması', en: 'No hidden defect (‘illah)', ru: 'Отсутствие скрытого изъяна (‘илля)', ar: 'عدم العلة', tr: 'Gizli kusur (illet) olmaması' }, text: { az: 'Zahirdə səhih görünən, amma mütəxəssislərin aşkar etdiyi gizli qüsur olmamalıdır.', en: 'There must be no hidden flaw that appears sound on the surface but is uncovered by the experts.', ru: 'Не должно быть скрытого изъяна, который не виден на первый взгляд, но выявляется знатоками.', ar: 'ألا تكون فيه علة خفية قادحة يكشفها أهل الصنعة.', tr: 'Görünüşte sahih olup uzmanların ortaya çıkardığı gizli bir kusur bulunmamalıdır.' } },
        ] },
      ],
    },
    {
      id: 'grades',
      title: { az: 'Həsən, zəif və mövzu', en: 'Hasan, weak and fabricated', ru: 'Хороший, слабый и выдуманный', ar: 'الحسن والضعيف والموضوع', tr: 'Hasen, zayıf ve mevzu' },
      blocks: [
        { t: 'table',
          head: [
            { az: 'Dərəcə', en: 'Grade', ru: 'Степень', ar: 'الدرجة', tr: 'Derece' },
            { az: 'Tərifi', en: 'Definition', ru: 'Определение', ar: 'تعريفه', tr: 'Tanımı' },
            { az: 'Hökmü', en: 'Ruling', ru: 'Положение', ar: 'حكمه', tr: 'Hükmü' },
          ],
          rows: [
            [{ az: 'Səhih', en: 'Sahih', ru: 'Сахих (достоверный)', ar: 'الصحيح', tr: 'Sahih' }, { az: 'Beş şərtin hamısı tamdır.', en: 'All five conditions are fully met.', ru: 'Все пять условий выполнены полностью.', ar: 'اجتمعت فيه الشروط الخمسة.', tr: 'Beş şartın hepsi tamdır.' }, { az: 'Dəlildir, ona əməl edilir.', en: 'Evidence; acted upon.', ru: 'Довод, по нему действуют.', ar: 'حجة يعمل به.', tr: 'Delildir, onunla amel edilir.' }],
            [{ az: 'Həsən', en: 'Hasan', ru: 'Хасан (хороший)', ar: 'الحسن', tr: 'Hasen' }, { az: 'Şərtlər eynidir, amma ravilərdən birinin dəqiqliyi bir az aşağıdır.', en: 'The same conditions, but one narrator’s precision is slightly lower.', ru: 'Те же условия, но точность одного из передатчиков немного ниже.', ar: 'كالصحيح إلا أن ضبط بعض رواته خفّ.', tr: 'Şartlar aynıdır, ancak râvilerden birinin zabtı biraz daha düşüktür.' }, { az: 'Dəlildir, ona əməl edilir.', en: 'Evidence; acted upon.', ru: 'Довод, по нему действуют.', ar: 'حجة يعمل به.', tr: 'Delildir, onunla amel edilir.' }],
            [{ az: 'Səhih/həsən li-ğeyrihi', en: 'Sahih/hasan li-ghayrihi', ru: 'Сахих/хасан ли-гайрихи', ar: 'الصحيح/الحسن لغيره', tr: 'Sahih/hasen li-gayrihî' }, { az: 'Yüngül zəif yollar bir-birini gücləndirib yüksəlib.', en: 'Mildly weak routes strengthen one another and raise it.', ru: 'Слегка слабые пути укрепляют друг друга и поднимают его.', ar: 'ضعيف يسير تقوّى بتعدد طرقه.', tr: 'Hafif zayıf yollar birbirini güçlendirerek yükselmiştir.' }, { az: 'Dəlildir.', en: 'Evidence.', ru: 'Довод.', ar: 'حجة.', tr: 'Delildir.' }],
            [{ az: 'Zəif', en: 'Da‘if (weak)', ru: 'Даиф (слабый)', ar: 'الضعيف', tr: 'Zayıf' }, { az: 'Həsənin şərtlərindən biri yoxdur: isnad qırıqdır (mürsəl, münqəti, mudal) və ya ravi zəifdir, naməlumdur.', en: 'One of the conditions of hasan is missing: a broken chain (mursal, munqati‘, mu‘dal) or a weak or unknown narrator.', ru: 'Отсутствует одно из условий хасана: разрыв в иснаде (мурсаль, мункати, му‘даль) или слабый либо неизвестный передатчик.', ar: 'ما فقد شرطًا من شروط الحسن: كالانقطاع (المرسل والمنقطع والمعضل) أو ضعف الراوي أو جهالته.', tr: 'Hasenin şartlarından biri eksiktir: kopuk sened (mürsel, munkatı‘, mu‘dal) veya zayıf ya da meçhul râvi.' }, { az: 'Hökm onun üzərində qurulmur.', en: 'No ruling is built on it.', ru: 'На нём не строят положений.', ar: 'لا يبنى عليه حكم.', tr: 'Hüküm onun üzerine kurulmaz.' }],
            [{ az: 'Mövzu', en: 'Mawdu‘ (fabricated)', ru: 'Мауду (выдуманный)', ar: 'الموضوع', tr: 'Mevzu (uydurma)' }, { az: 'Peyğəmbərə ﷺ yalan olaraq aid edilmiş, uydurulmuş söz.', en: 'A fabricated lie attributed to the Prophet ﷺ.', ru: 'Ложь, выдуманная и приписанная Пророку ﷺ.', ar: 'المكذوب المختلق المنسوب إلى النبي ﷺ.', tr: 'Peygamber’e ﷺ yalan olarak isnat edilmiş uydurma söz.' }, { az: 'Ona əməl etmək haramdır; yalnız yalan olduğunu bildirmək üçün zikr olunur.', en: 'Acting on it is forbidden; it is mentioned only to expose it.', ru: 'Действовать по нему запрещено; его упоминают лишь для разоблачения.', ar: 'يحرم العمل به، ولا تجوز روايته إلا مع بيان حاله.', tr: 'Onunla amel etmek haramdır; yalnızca uydurma olduğunu bildirmek için zikredilir.' }],
          ],
        },
        { t: 'note', kind: 'info', text: {
          az: 'Hədisin dərəcəsi isnadına və mətninə görədir: məşhur olmaq, gözəl məna daşımaq və ya bir kitabda yazılmaq onu səhih etmir.',
          en: 'A hadith’s grade depends on its chain and text: being famous, carrying a beautiful meaning or appearing in some book does not make it authentic.',
          ru: 'Степень хадиса зависит от иснада и текста: известность, красивый смысл или упоминание в какой-то книге не делают его достоверным.',
          ar: 'درجة الحديث بحسب إسناده ومتنه؛ فالشهرة وحسن المعنى ووجوده في كتاب ما لا تجعله صحيحًا.',
          tr: 'Hadisin derecesi senedine ve metnine bağlıdır: meşhur olmak, güzel bir anlam taşımak veya bir kitapta geçmek onu sahih yapmaz.',
        } },
      ],
    },
    {
      id: 'acting-on-weak',
      title: { az: 'Zəif hədislə əməl', en: 'Acting on weak hadith', ru: 'Действие по слабому хадису', ar: 'العمل بالحديث الضعيف', tr: 'Zayıf hadisle amel' },
      blocks: [
        { t: 'p', text: {
          az: 'Alimlər zəif hədislə fəzilətli əməllərdə (fədailul-əmal) əməl edilməsi barədə ixtilaf ediblər. Bəziləri şərtlərlə icazə verib; İbn Həcər bu şərtləri belə xülasə edib: zəiflik şiddətli olmasın, hədis artıq səhih dəlillə sabit olan bir əsasın altına daxil olsun və ona əməl edən onun sabit olduğuna inanmasın.',
          en: 'Scholars differed over acting on weak hadith in virtuous deeds (fada’il al-a‘mal). Some allowed it with conditions; Ibn Hajar summarised them: the weakness must not be severe, the hadith must fall under a principle already established by sound evidence, and the one acting on it must not believe it to be established.',
          ru: 'Учёные разошлись во мнениях о действии по слабому хадису в достоинствах деяний (фадаиль аль-а‘маль). Некоторые разрешали это с условиями; Ибн Хаджар кратко изложил их: слабость не должна быть сильной, хадис должен подпадать под основу, уже установленную достоверным доводом, и действующий не должен считать его достоверным.',
          ar: 'اختلف العلماء في العمل بالحديث الضعيف في فضائل الأعمال، فأجازه بعضهم بشروط لخصها ابن حجر: ألا يكون الضعف شديدًا، وأن يندرج تحت أصل معمول به، وألا يُعتقد عند العمل به ثبوته.',
          tr: 'Âlimler fezâilü’l-a‘mâlde zayıf hadisle amel konusunda ihtilaf etmiştir. Bazıları şartlarla izin vermiştir; İbn Hacer bu şartları şöyle özetlemiştir: zayıflık şiddetli olmamalı, hadis sahih delille sabit bir esasın altına girmeli ve onunla amel eden onun sabit olduğuna inanmamalıdır.',
        } },
        { t: 'quote', ar: 'وَلَا يَجُوزُ أَنْ يُعْتَمَدَ فِي الشَّرِيعَةِ عَلَى الْأَحَادِيثِ الضَّعِيفَةِ الَّتِي لَيْسَتْ صَحِيحَةً وَلَا حَسَنَةً', by: { az: 'Şeyxülislam İbn Teymiyyə', en: 'Shaykh al-Islam Ibn Taymiyyah', ru: 'Шейх аль-Ислам Ибн Таймийя', ar: 'شيخ الإسلام ابن تيمية', tr: 'Şeyhülislam İbn Teymiyye' }, ref: { az: '«Məcmuul-Fətava» 1/250', en: '“Majmu‘ al-Fatawa” 1/250', ru: '«Маджму аль-фатава» 1/250', ar: 'مجموع الفتاوى ١/٢٥٠', tr: '“Mecmû‘u’l-Fetâvâ” 1/250' }, text: {
          az: '«Şəriətdə səhih və həsən olmayan zəif hədislərə söykənmək caiz deyil». O, həmçinin deyib ki, imamlardan heç biri zəif hədislə bir şeyi vacib və ya müstəhəb etməyə icazə verməyib.',
          en: '“It is not permissible to rely in the Shari‘ah on weak hadith that are neither sahih nor hasan.” He also said that none of the imams allowed making something obligatory or recommended on the basis of a weak hadith.',
          ru: '«Недопустимо опираться в шариате на слабые хадисы, которые не являются ни достоверными, ни хорошими». Он также сказал, что никто из имамов не позволял делать что-либо обязательным или желательным на основании слабого хадиса.',
          ar: '«ولا يجوز أن يعتمد في الشريعة على الأحاديث الضعيفة التي ليست صحيحة ولا حسنة»، وذكر أنه لم يقل أحد من الأئمة إنه يجوز أن يجعل الشيء واجبًا أو مستحبًا بحديث ضعيف.',
          tr: '“Şeriatta sahih ve hasen olmayan zayıf hadislere dayanmak caiz değildir.” Ayrıca imamlardan hiçbirinin zayıf hadisle bir şeyi vacip veya müstehap kılmaya izin vermediğini söylemiştir.',
        } },
        { t: 'p', text: {
          az: 'Əbu Bəkr ibn əl-Ərəbi zəif hədislə nə fəzilətlərdə, nə də başqa yerdə əməl edilməyəcəyini demiş, Albani də bu rəyi seçmişdir. Ən güclü yol budur: Peyğəmbərdən ﷺ səhih şəkildə sabit olan hədislər zəif hədisə ehtiyac qoymur.',
          en: 'Abu Bakr ibn al-‘Arabi held that weak hadith are not acted upon at all, neither in virtues nor elsewhere, and al-Albani chose this view. This is the strongest path: what is authentically established from the Prophet ﷺ leaves no need for weak hadith.',
          ru: 'Абу Бакр ибн аль-Араби считал, что по слабому хадису не действуют вовсе — ни в достоинствах, ни в чём-либо ещё, и этот взгляд избрал аль-Албани. Это самый сильный путь: достоверно установленное от Пророка ﷺ избавляет от нужды в слабых хадисах.',
          ar: 'وذهب أبو بكر ابن العربي إلى منع العمل بالضعيف مطلقًا لا في الفضائل ولا في غيرها، واختاره الألباني، وهو الأقوى؛ ففيما صح عن النبي ﷺ غنية عن الضعيف.',
          tr: 'Ebû Bekir İbnü’l-Arabî zayıf hadisle ne faziletlerde ne de başka konularda amel edilemeyeceğini söylemiş, Elbânî de bu görüşü seçmiştir. En güçlü yol budur: Peygamber’den ﷺ sahih olarak sabit olanlar zayıf hadise ihtiyaç bırakmaz.',
        } },
        { t: 'qa', items: [
          {
            q: { az: 'Zəif hədisi fəzilətli əməllərdə istifadə etmək olarmı?', en: 'May weak hadith be used for virtuous deeds?', ru: 'Можно ли использовать слабые хадисы в достоинствах деяний?', ar: 'ما موقفنا من أحاديث فضائل الأعمال الضعيفة؟', tr: 'Zayıf hadis fazilet konularında kullanılabilir mi?' },
            a: { az: 'Fətvada alimlərin iki rəyi və İbn Həcərin üç şərti verilir, sonra deyilir: Peyğəmbərdən ﷺ səhih olanlarda zəif hədislə əməl etməyə ehtiyac qoymayan kifayət qədər şey var; müsəlman səhihi zəifdən ayırmağa çalışmalı və səhihlə kifayətlənməlidir.', en: 'The fatwa presents the two scholarly views and Ibn Hajar’s three conditions, then concludes: in what is authentic from the Prophet ﷺ there is enough to make acting on weak hadith unnecessary; a Muslim should strive to distinguish the authentic from the weak and suffice with the authentic.', ru: 'В фетве приводятся два мнения учёных и три условия Ибн Хаджара, а затем сказано: в достоверном от Пророка ﷺ достаточно того, что избавляет от действия по слабому; мусульманину следует стараться отличать достоверное от слабого и довольствоваться достоверным.', ar: 'ذكرت الفتوى القولين وشروط ابن حجر الثلاثة، ثم قالت: فيما صح عن النبي ﷺ غنية عن العمل بالحديث الضعيف، فعلى المسلم أن يحرص على معرفة الصحيح من الضعيف ويكتفي بالعمل بالصحيح.', tr: 'Fetvada âlimlerin iki görüşü ve İbn Hacer’in üç şartı verilir, sonra şöyle denir: Peygamber’den ﷺ sahih olarak gelenlerde zayıf hadisle amele ihtiyaç bırakmayacak kadar şey vardır; Müslüman sahihi zayıftan ayırmaya çalışmalı ve sahihle yetinmelidir.' },
            ref: { az: 'IslamQA 44877', en: 'IslamQA 44877', ru: '«Ислам: вопрос и ответ» 44877', ar: 'الإسلام سؤال وجواب ٤٤٨٧٧', tr: 'İslam Soru-Cevap 44877' },
            url: 'https://islamqa.info/ar/answers/44877',
          },
        ] },
      ],
    },
    {
      id: 'books',
      title: { az: 'Məşhur hədis kitabları və Albaninin əməyi', en: 'The main collections and al-Albani’s work', ru: 'Главные сборники и труд аль-Албани', ar: 'أشهر كتب الحديث وجهود الألباني', tr: 'Meşhur hadis kitapları ve Elbânî’nin emeği' },
      blocks: [
        { t: 'table',
          head: [
            { az: 'Kitab', en: 'Book', ru: 'Книга', ar: 'الكتاب', tr: 'Kitap' },
            { az: 'Dərəcəsi', en: 'Status', ru: 'Статус', ar: 'منزلته', tr: 'Durumu' },
          ],
          rows: [
            [{ az: 'Səhih əl-Buxari, Səhih Müslim', en: 'Sahih al-Bukhari, Sahih Muslim', ru: 'Сахих аль-Бухари, Сахих Муслим', ar: 'صحيح البخاري، صحيح مسلم', tr: 'Sahîh-i Buhârî, Sahîh-i Müslim' }, { az: 'Ümmət onları qəbul edib; Qurandan sonra ən səhih kitablardır. İçlərindəki müsnəd hədislər səhihdir.', en: 'Received by the Ummah with acceptance; the most authentic books after the Quran. Their connected hadith are authentic.', ru: 'Приняты Уммой; самые достоверные книги после Корана. Их хадисы с полными иснадами достоверны.', ar: 'تلقتهما الأمة بالقبول، وهما أصح الكتب بعد كتاب الله، وأحاديثهما المسندة صحيحة.', tr: 'Ümmet onları kabulle karşılamıştır; Kur’an’dan sonra en sahih kitaplardır. İçlerindeki müsned hadisler sahihtir.' }],
            [{ az: 'Əbu Davud, Tirmizi, Nəsai, İbn Macə (Sünən)', en: 'Abu Dawud, at-Tirmidhi, an-Nasa’i, Ibn Majah (the Sunan)', ru: 'Абу Дауд, ат-Тирмизи, ан-Насаи, Ибн Маджа (Сунан)', ar: 'سنن أبي داود والترمذي والنسائي وابن ماجه', tr: 'Ebû Dâvûd, Tirmizî, Nesâî, İbn Mâce (Sünen)' }, { az: 'Səhih, həsən və zəif hədislər var — hər hədisin dərəcəsinə baxılır.', en: 'Contain sahih, hasan and weak hadith — each hadith’s grade must be checked.', ru: 'Содержат достоверные, хорошие и слабые хадисы — нужно смотреть степень каждого.', ar: 'فيها الصحيح والحسن والضعيف، فينظر في درجة كل حديث.', tr: 'Sahih, hasen ve zayıf hadisler vardır — her hadisin derecesine bakılır.' }],
            [{ az: 'Müsnəd Əhməd, Müvatta Malik və başqaları', en: 'Musnad Ahmad, Muwatta’ Malik and others', ru: 'Муснад Ахмада, Муватта Малика и другие', ar: 'مسند أحمد، موطأ مالك وغيرهما', tr: 'Müsned-i Ahmed, Muvatta’ ve diğerleri' }, { az: 'Böyük dəyəri var, amma hər rəvayəti ayrıca yoxlamaq lazımdır.', en: 'Of great value, but each narration must be checked individually.', ru: 'Имеют большую ценность, но каждое предание нужно проверять отдельно.', ar: 'عظيمة القدر، لكن يحكم على كل رواية بحسبها.', tr: 'Büyük değeri vardır, ancak her rivayet ayrıca kontrol edilmelidir.' }],
          ],
        },
        { t: 'p', text: {
          az: 'Şeyx Muhəmməd Nasiruddin əl-Albani (h. 1420) ömrünü hədisləri yoxlamağa həsr edib. Onun əsərləri: «əs-Silsilətus-Səhihə», «əs-Silsilətuz-Zəifə vəl-Məvdua», «Səhih/Zəif əl-Cami əs-Sağir», dörd Sünən kitabının səhih və zəif bölgüsü, «İrvaul-Ğəlil», «Səhih ət-Tərğib vət-Tərhib», «Səhih/Zəif əl-Ədəb əl-Müfrəd». Bu sahədə Şeyx Muqbil əl-Vadiinin «əs-Səhih əl-Müsnəd» kitabı da var. Əksər hallarda biz də onların hökmünə istinad edirik.',
          en: 'Shaykh Muhammad Nasir ad-Din al-Albani (d. 1420 AH) devoted his life to checking hadith. His works include “as-Silsilah as-Sahihah”, “as-Silsilah ad-Da‘ifah wal-Mawdu‘ah”, “Sahih/Da‘if al-Jami‘ as-Saghir”, the sahih and weak divisions of the four Sunan, “Irwa’ al-Ghalil”, “Sahih at-Targhib wat-Tarhib” and “Sahih/Da‘if al-Adab al-Mufrad”. Shaykh Muqbil al-Wadi‘i’s “as-Sahih al-Musnad” also belongs to this field. In most cases we rely on their verdicts.',
          ru: 'Шейх Мухаммад Насируддин аль-Албани (ум. в 1420 г. х.) посвятил жизнь проверке хадисов. Его труды: «ас-Сильсиля ас-сахиха», «ас-Сильсиля ад-даифа валь-мауду‘а», «Сахих/Даиф аль-Джами ас-сагир», разделение четырёх Сунанов на достоверное и слабое, «Ирва аль-галиль», «Сахих ат-таргиб ва-т-тархиб», «Сахих/Даиф аль-Адаб аль-Муфрад». В этой области есть и книга шейха Мукбиля аль-Вади‘и «ас-Сахих аль-муснад». Чаще всего мы опираемся на их оценки.',
          ar: 'أفنى الشيخ محمد ناصر الدين الألباني (ت ١٤٢٠هـ) عمره في تحقيق الأحاديث، ومن كتبه: «السلسلة الصحيحة»، و«السلسلة الضعيفة والموضوعة»، و«صحيح الجامع الصغير وضعيفه»، و«صحيح السنن الأربع وضعيفها»، و«إرواء الغليل»، و«صحيح الترغيب والترهيب»، و«صحيح الأدب المفرد وضعيفه». ومن هذا الباب «الصحيح المسند» للشيخ مقبل الوادعي. وعلى أحكامهم نعتمد في الغالب.',
          tr: 'Şeyh Muhammed Nâsıruddîn el-Elbânî (h. 1420) ömrünü hadisleri tahkike adamıştır. Eserlerinden bazıları: “es-Silsiletü’s-Sahîha”, “es-Silsiletü’d-Daîfe ve’l-Mevdû‘a”, “Sahîh/Daîfu’l-Câmi‘i’s-Sağîr”, dört Sünen’in sahih ve zayıf ayrımı, “İrvâü’l-Galîl”, “Sahîhu’t-Terğîb ve’t-Terhîb” ve “Sahîh/Daîfu’l-Edebi’l-Müfred”. Bu alanda Şeyh Mukbil el-Vâdiî’nin “es-Sahîhu’l-Müsned” kitabı da vardır. Çoğu durumda biz de onların hükümlerine dayanırız.',
        } },
      ],
    },
    {
      id: 'how-to-check',
      title: { az: 'Hədisi necə yoxlamalı?', en: 'How to check a hadith', ru: 'Как проверить хадис', ar: 'كيف تتحقق من الحديث؟', tr: 'Hadis nasıl kontrol edilir?' },
      blocks: [
        { t: 'steps', items: [
          { title: { az: 'Mənbəni soruş', en: 'Ask for the source', ru: 'Спроси об источнике', ar: 'اسأل عن المصدر', tr: 'Kaynağı sor' }, text: { az: '«Peyğəmbər ﷺ dedi» deyən hər mətn kitab adı və nömrə ilə gəlməlidir. Mənbəsiz «məşhur söz» çox vaxt hədis deyil.', en: 'Any text claiming “the Prophet ﷺ said” should come with a book name and number. An unsourced “famous saying” is often not a hadith.', ru: 'Любой текст со словами «Пророк ﷺ сказал» должен сопровождаться названием книги и номером. «Известное изречение» без источника часто вовсе не хадис.', ar: 'كل نص يقال فيه «قال النبي ﷺ» ينبغي أن يُذكر مصدره ورقمه، و«القول المشهور» بلا مصدر كثيرًا ما لا يكون حديثًا.', tr: '“Peygamber ﷺ buyurdu” diyen her metin kitap adı ve numarasıyla gelmelidir. Kaynaksız “meşhur söz” çoğu zaman hadis değildir.' } },
          { title: { az: 'Buxari və ya Müslimdədirsə', en: 'If it is in al-Bukhari or Muslim', ru: 'Если он у Бухари или Муслима', ar: 'إن كان في الصحيحين', tr: 'Buhârî veya Müslim’de ise' }, text: { az: 'Hədis «Səhih»lərin müsnəd hissəsindədirsə, səhihdir. Yalnız mətnin həqiqətən oradakı ilə eyni olduğunu yoxla.', en: 'If the hadith is in the connected part of the two Sahihs, it is authentic. Just check that the wording really matches.', ru: 'Если хадис есть в основной (с иснадами) части двух «Сахихов», он достоверен. Проверь лишь, что текст действительно совпадает.', ar: 'إن كان مسندًا في الصحيحين فهو صحيح، وتأكد فقط من مطابقة اللفظ.', tr: 'Hadis iki Sahih’in müsned kısmında ise sahihtir. Sadece metnin gerçekten aynı olduğunu kontrol et.' } },
          { title: { az: 'Başqa kitabdadırsa — dərəcəyə bax', en: 'If elsewhere — look at the grade', ru: 'Если в другой книге — смотри степень', ar: 'إن كان في غيرهما فانظر حكمه', tr: 'Başka kitapta ise — dereceye bak' }, text: { az: 'Sünən kitablarında Albaninin və digər mühəddislərin hökmünə bax. sunnah.com və dorar.net hər hədisin yanında alimlərin hökmünü göstərir.', en: 'For the Sunan, look at the verdict of al-Albani and other hadith scholars. sunnah.com and dorar.net show scholars’ verdicts next to each hadith.', ru: 'Для Сунанов смотри оценку аль-Албани и других мухаддисов. sunnah.com и dorar.net показывают оценки учёных рядом с каждым хадисом.', ar: 'في السنن انظر حكم الألباني وغيره من المحدثين، وموقعا sunnah.com و dorar.net يذكران أحكام العلماء عند كل حديث.', tr: 'Sünenlerde Elbânî’nin ve diğer muhaddislerin hükmüne bak. sunnah.com ve dorar.net her hadisin yanında âlimlerin hükmünü gösterir.' } },
          { title: { az: 'Sözə görə yox, dəlilə görə', en: 'By evidence, not by feeling', ru: 'По доводу, а не по ощущению', ar: 'بالدليل لا بالاستحسان', tr: 'Duyguya göre değil, delile göre' }, text: { az: 'Mənası gözəl görünməsi hədisi səhih etmir. Ağıla və ya səhih Sünnəyə açıq ziddiyyət isə uydurmanın əlamətlərindəndir.', en: 'A beautiful meaning does not make a hadith authentic. Clear contradiction of the authentic Sunnah is one of the signs of fabrication.', ru: 'Красивый смысл не делает хадис достоверным. Явное противоречие достоверной Сунне — один из признаков выдумки.', ar: 'حسن المعنى لا يصحح الحديث، ومخالفة السنة الصحيحة مخالفة صريحة من علامات الوضع.', tr: 'Anlamının güzel görünmesi hadisi sahih yapmaz. Sahih Sünnete açık aykırılık ise uydurmanın alametlerindendir.' } },
          { title: { az: 'Əmin deyilsənsə, paylaşma', en: 'If unsure, do not share', ru: 'Не уверен — не распространяй', ar: 'إن لم تتثبت فلا تنشر', tr: 'Emin değilsen paylaşma' }, text: { az: 'Sosial şəbəkədə yayılan «hədisi» yoxlamadan göndərmək eşitdiyi hər şeyi danışmaq kimidir (Əbu Davud 4992).', en: 'Forwarding a “hadith” from social media without checking is like narrating everything you hear (Abu Dawud 4992).', ru: 'Пересылать «хадис» из соцсетей без проверки — то же, что рассказывать всё услышанное (Абу Дауд 4992).', ar: 'نشر «الحديث» المتداول في وسائل التواصل بلا تثبت من التحديث بكل ما يُسمع (أبو داود ٤٩٩٢).', tr: 'Sosyal medyada dolaşan bir “hadisi” kontrol etmeden paylaşmak, duyduğu her şeyi anlatmak gibidir (Ebû Dâvûd 4992).' } },
        ] },
        { t: 'hadith', ar: 'اسْتَأْذَنْتُ عَلَى عُمَرَ ثَلاَثًا، فَلَمْ يُؤْذَنْ لِي فَرَجَعْتُ ... فَقَالَ: وَاللَّهِ لَتُقِيمَنَّ عَلَيْهِ بِبَيِّنَةٍ', src: { az: 'Buxari 6245', en: 'al-Bukhari 6245', ru: 'Бухари 6245', ar: 'البخاري ٦٢٤٥', tr: 'Buhârî 6245' }, grade: AGREED, text: {
          az: 'Əbu Musa üç dəfə izin istəyib cavab almayınca geri qayıtdığını və bunu Peyğəmbərin ﷺ əmri ilə etdiyini deyəndə Ömər ona: «Allaha and olsun, buna dəlil gətirəcəksən», — dedi. Əbu Səid əl-Xudri gəlib bu hədisi Peyğəmbərdən ﷺ eşitdiyini təsdiq etdi. Səhabələr belə ehtiyatlı idilər.',
          en: 'When Abu Musa said he had asked permission three times, received no answer and left, as the Prophet ﷺ had commanded, ‘Umar told him: “By Allah, you will bring proof of this.” Abu Sa‘id al-Khudri came and confirmed he had heard it from the Prophet ﷺ. Such was the care of the Companions.',
          ru: 'Когда Абу Муса сказал, что трижды просил разрешения войти, не получил ответа и ушёл, как велел Пророк ﷺ, Умар сказал ему: «Клянусь Аллахом, ты приведёшь на это доказательство». Абу Саид аль-Худри пришёл и подтвердил, что слышал это от Пророка ﷺ. Такова была осторожность сподвижников.',
          ar: 'لما ذكر أبو موسى أنه استأذن على عمر ثلاثًا فلم يؤذن له فرجع، عملًا بأمر النبي ﷺ، قال عمر: «والله لتقيمن عليه ببينة»، فقام أبو سعيد الخدري فأخبره أنه سمعه من النبي ﷺ. وهكذا كان تثبت الصحابة.',
          tr: 'Ebû Mûsâ üç kez izin isteyip cevap alamayınca Peygamber’in ﷺ emri gereği geri döndüğünü söylediğinde Ömer ona “Allah’a yemin ederim, buna delil getireceksin” dedi. Ebû Saîd el-Hudrî gelip bunu Peygamber’den ﷺ işittiğini doğruladı. Sahabenin titizliği böyleydi.',
        } },
      ],
    },
    {
      id: 'site',
      title: { az: 'muslims.cc zəif hədisləri niyə çıxardı?', en: 'Why muslims.cc removed weak hadith', ru: 'Почему muslims.cc убрал слабые хадисы', ar: 'لماذا حذف muslims.cc الأحاديث الضعيفة؟', tr: 'muslims.cc zayıf hadisleri neden çıkardı?' },
      blocks: [
        { t: 'p', text: {
          az: 'Saytımızın hədis toplusu Sələf mühəddislərinin — ilk növbədə Albaninin — hökmü əsasında yenidən yoxlanıldı. Zəif, çox zəif, mövzu və ümumiyyətlə əsli olmayan yüzdən çox rəvayət, həmçinin səhv olaraq Peyğəmbərə ﷺ aid edilmiş səhabə sözləri siyahıdan çıxarıldı. Hər çıxarılan qeyd üçün hökmü verən alim və mənbə linki saxlanılıb.',
          en: 'Our site’s hadith collection was re-checked according to the verdicts of the hadith scholars of the Salaf — first of all al-Albani. More than a hundred weak, very weak, fabricated or baseless narrations were removed, as well as statements of Companions wrongly attributed to the Prophet ﷺ. For each removed entry, the grading scholar and a source link are kept on record.',
          ru: 'Сборник хадисов нашего сайта был заново проверен по оценкам мухаддисов-саляфитов — прежде всего аль-Албани. Удалено более ста слабых, очень слабых, выдуманных и не имеющих основы преданий, а также слова сподвижников, ошибочно приписанные Пророку ﷺ. Для каждой удалённой записи сохранены имя оценившего учёного и ссылка на источник.',
          ar: 'أعيد فحص مجموعة الأحاديث في موقعنا على أحكام علماء الحديث السلفيين وفي مقدمتهم الألباني، فحذف أكثر من مئة رواية ضعيفة أو ضعيفة جدًا أو موضوعة أو لا أصل لها، وكذلك آثار للصحابة نُسبت خطأً إلى النبي ﷺ، وحُفظ لكل محذوف اسم العالم الذي حكم عليه ورابط المصدر.',
          tr: 'Sitemizin hadis koleksiyonu Selef muhaddislerinin — öncelikle Elbânî’nin — hükümlerine göre yeniden kontrol edildi. Zayıf, çok zayıf, mevzu veya aslı olmayan yüzden fazla rivayet ile yanlışlıkla Peygamber’e ﷺ nispet edilmiş sahabe sözleri listeden çıkarıldı. Çıkarılan her kayıt için hükmü veren âlim ve kaynak bağlantısı saklanmıştır.',
        } },
        { t: 'table',
          head: [
            { az: 'Məşhur söz', en: 'Popular saying', ru: 'Известное изречение', ar: 'العبارة المشهورة', tr: 'Meşhur söz' },
            { az: 'Hökmü', en: 'Verdict', ru: 'Оценка', ar: 'الحكم', tr: 'Hükmü' },
            { az: 'Səhih olan əvəzi', en: 'Authentic alternative', ru: 'Достоверная замена', ar: 'البديل الصحيح', tr: 'Sahih karşılığı' },
          ],
          rows: [
            [{ az: '«Elmi Çində də olsa axtarın»', en: '“Seek knowledge even in China”', ru: '«Ищите знание, даже если оно в Китае»', ar: '«اطلبوا العلم ولو بالصين»', tr: '“İlmi Çin’de de olsa arayın”' }, { az: 'Mövzu (IslamQA 13637; Albani)', en: 'Fabricated (IslamQA 13637; al-Albani)', ru: 'Выдуманный («Ислам: вопрос и ответ» 13637; аль-Албани)', ar: 'موضوع (الإسلام سؤال وجواب ١٣٦٣٧؛ الألباني)', tr: 'Mevzu (İslam Soru-Cevap 13637; Elbânî)' }, { az: '«Kim elm axtararaq bir yola düşsə, Allah ona Cənnətə gedən yolu asanlaşdırar» (Müslim 2699)', en: '“Whoever takes a path seeking knowledge, Allah makes easy for him a path to Paradise” (Muslim 2699)', ru: '«Кто встанет на путь поиска знания, тому Аллах облегчит путь в Рай» (Муслим 2699)', ar: '«من سلك طريقًا يلتمس فيه علمًا سهل الله له به طريقًا إلى الجنة» (مسلم ٢٦٩٩)', tr: '“Kim ilim arayarak bir yola girerse, Allah ona cennete giden yolu kolaylaştırır” (Müslim 2699)' }],
            [{ az: '«Dua ibadətin beynidir»', en: '“Du‘a is the marrow of worship”', ru: '«Дуа — сердцевина поклонения»', ar: '«الدعاء مخ العبادة»', tr: '“Dua ibadetin özüdür”' }, { az: 'Zəif (Tirmizi 3371; Albani)', en: 'Weak (at-Tirmidhi 3371; al-Albani)', ru: 'Слабый (Тирмизи 3371; аль-Албани)', ar: 'ضعيف (الترمذي ٣٣٧١؛ الألباني)', tr: 'Zayıf (Tirmizî 3371; Elbânî)' }, { az: '«Dua ibadətin özüdür» (Tirmizi 2969, Albani: səhih)', en: '“Du‘a is worship” (at-Tirmidhi 2969, al-Albani: sahih)', ru: '«Дуа — это и есть поклонение» (Тирмизи 2969, аль-Албани: достоверный)', ar: '«الدعاء هو العبادة» (الترمذي ٢٩٦٩، صححه الألباني)', tr: '“Dua ibadetin ta kendisidir” (Tirmizî 2969, Elbânî: sahih)' }],
            [{ az: '«Vətən sevgisi imandandır»', en: '“Love of the homeland is part of faith”', ru: '«Любовь к родине — от веры»', ar: '«حب الوطن من الإيمان»', tr: '“Vatan sevgisi imandandır”' }, { az: 'Mövzu (Albani, «əz-Zəifə» 36)', en: 'Fabricated (al-Albani, “ad-Da‘ifah” 36)', ru: 'Выдуманный (аль-Албани, «ад-Даифа» 36)', ar: 'موضوع (الألباني، الضعيفة ٣٦)', tr: 'Mevzu (Elbânî, “ed-Daîfe” 36)' }, { az: '—', en: '—', ru: '—', ar: '—', tr: '—' }],
          ],
        },
        { t: 'note', kind: 'info', text: {
          az: 'Niyə? Çünki Peyğəmbərin ﷺ deməmədiyi sözü ona aid etmək ağır günahdır (Buxari 109), səhih hədislər isə kifayət edir. Bir hədisin dərəcəsi barədə alimlər arasında fərq olarsa, biz dəlili daha güclü olanı götürürük; yanlış gördüyünüz bir şey varsa, bizə mənbə ilə yazın.',
          en: 'Why? Because attributing to the Prophet ﷺ what he did not say is a grave sin (al-Bukhari 109), and the authentic hadith are sufficient. Where scholars differ over a hadith’s grade, we take the view with stronger evidence; if you see a mistake, write to us with a source.',
          ru: 'Почему? Потому что приписывать Пророку ﷺ то, чего он не говорил, — тяжкий грех (Бухари 109), а достоверных хадисов достаточно. Если учёные расходятся в оценке хадиса, мы берём мнение с более сильным доводом; если вы заметили ошибку, напишите нам с указанием источника.',
          ar: 'لماذا؟ لأن نسبة ما لم يقله النبي ﷺ إليه إثم عظيم (البخاري ١٠٩)، وفي الصحيح غنية. وإذا اختلف العلماء في درجة حديث أخذنا بما كان دليله أقوى، فإن رأيت خطأً فراسلنا مع ذكر المصدر.',
          tr: 'Neden? Çünkü Peygamber’in ﷺ söylemediği bir sözü ona nispet etmek ağır bir günahtır (Buhârî 109), sahih hadisler ise yeterlidir. Âlimler bir hadisin derecesinde ihtilaf ederse delili daha güçlü olanı alırız; bir hata görürseniz bize kaynakla birlikte yazın.',
        } },
      ],
    },
  ],
  sources: [
    { label: 'Ibn as-Salah, Ma‘rifat Anwa‘ ‘Ulum al-Hadith (al-Muqaddimah)' },
    { label: 'Ibn Hajar, Nukhbat al-Fikar' },
    { label: 'Ibn ‘Uthaymin, Mustalah al-Hadith' },
    { label: 'IslamQA 44877 — weak hadith in virtuous deeds', url: 'https://islamqa.info/ar/answers/44877' },
    { label: 'IslamQA 13637 — “Seek knowledge even in China” is fabricated', url: 'https://islamqa.info/ar/answers/13637' },
    { label: 'Sahih al-Bukhari, Sahih Muslim, Sunan Abi Dawud, Sunan at-Tirmidhi (with al-Albani’s grades) — fawazahmed0 hadith-api', url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions.json' },
  ],
}
