// Valideynə yaxşılıq, qohumluq əlaqəsi və qonşu haqqı.
// Hədislər: Buxari/Müslim (fawazahmed0 hadith-api ilə yoxlanıb; Müslim — Fuad Abdulbaqi nömrəsi),
// əl-Ədəb əl-Müfrəd — Albaninin dərəcəsi ilə (prophetmuhammad.com/adab), Tirmizi — Albaninin dərəcəsi ilə.

const AGREED = { az: 'Səhih', en: 'Sahih', ru: 'Достоверный', ar: 'صحيح', tr: 'Sahih' }
const SAHIH_ALB = { az: 'Səhih (Albani)', en: 'Sahih (al-Albani)', ru: 'Достоверный (аль-Албани)', ar: 'صحيح (الألباني)', tr: 'Sahih (Elbânî)' }
const HASAN_ALB = { az: 'Həsən (Albani)', en: 'Hasan (al-Albani)', ru: 'Хороший (аль-Албани)', ar: 'حسن (الألباني)', tr: 'Hasen (Elbânî)' }
const SRC = (az, en, ru, ar, tr) => ({ az, en, ru, ar, tr })

export const meta = {
  slug: 'birr-al-walidayn',
  cat: 'heart',
  order: 30,
  icon: 'jamaat',
  arTitle: 'بر الوالدين وصلة الرحم وحق الجار',
  title: {
    az: 'Valideynə yaxşılıq, qohumluq və qonşuluq',
    en: 'Dutifulness to Parents, Kinship and Neighbours',
    ru: 'Почтение к родителям, родство и соседи',
    ar: 'بر الوالدين وصلة الرحم وحق الجار',
    tr: 'Anne-Babaya İyilik, Akrabalık ve Komşuluk',
  },
  summary: {
    az: 'Valideynin haqları (vəfatından sonra da), ananın üstünlüyü, ataya-anaya üsyanın günahı, qohumluq əlaqəsi və qonşu haqqı — ayə və səhih hədislərlə.',
    en: 'Rights of parents (also after death), the mother’s precedence, the sin of disobedience, ties of kinship and neighbours’ rights — from Quran and Sunnah.',
    ru: 'Права родителей (и после их смерти), первенство матери, грех непочтительности, родственные связи и права соседа — по Корану и достоверной Сунне.',
    ar: 'حقوق الوالدين في الحياة وبعد الممات، وتقديم الأم، وإثم العقوق، وصلة الرحم، وحق الجار، بأدلة الكتاب والسنة الصحيحة.',
    tr: 'Anne-babanın hakları (vefatlarından sonra da), annenin önceliği, anne-babaya isyanın günahı, akrabalık bağı ve komşu hakkı — ayet ve sahih hadislerle.',
  },
  author: {
    az: 'Quran, səhih Sünnə; İmam Buxarinin «əl-Ədəb əl-Müfrəd» kitabı (Albaninin dərəcəsi ilə)',
    en: 'Quran, authentic Sunnah; al-Bukhari’s “al-Adab al-Mufrad” (with al-Albani’s grading)',
    ru: 'Коран, достоверная Сунна; «аль-Адаб аль-Муфрад» аль-Бухари (с оценкой аль-Албани)',
    ar: 'القرآن والسنة الصحيحة؛ و«الأدب المفرد» للبخاري بتحقيق الألباني',
    tr: 'Kur’an, sahih Sünnet; Buhârî’nin “el-Edebü’l-Müfred” kitabı (Elbânî’nin derecelendirmesiyle)',
  },
  minutes: 15,
}

export default {
  sections: [
    {
      id: 'status',
      title: { az: 'Valideynin haqqı Allahın haqqından sonra gəlir', en: 'The parents’ right comes after Allah’s right', ru: 'Право родителей — после права Аллаха', ar: 'حق الوالدين بعد حق الله', tr: 'Anne-babanın hakkı Allah’ın hakkından sonra gelir' },
      blocks: [
        { t: 'ayah', ar: 'وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوٓا۟ إِلَّآ إِيَّاهُ وَبِٱلْوَٰلِدَيْنِ إِحْسَـٰنًا ۚ إِمَّا يَبْلُغَنَّ عِندَكَ ٱلْكِبَرَ أَحَدُهُمَآ أَوْ كِلَاهُمَا فَلَا تَقُل لَّهُمَآ أُفٍّ وَلَا تَنْهَرْهُمَا وَقُل لَّهُمَا قَوْلًا كَرِيمًا ۝ وَٱخْفِضْ لَهُمَا جَنَاحَ ٱلذُّلِّ مِنَ ٱلرَّحْمَةِ وَقُل رَّبِّ ٱرْحَمْهُمَا كَمَا رَبَّيَانِى صَغِيرًا', ref: '17:23-24', text: {
          az: 'Rəbbin hökm etdi ki, yalnız Ona ibadət edəsiniz və valideynə yaxşılıq edəsiniz. Əgər onlardan biri və ya hər ikisi sənin yanında qocalığa çatsa, onlara «uf» belə demə, onları danlama, onlara hörmətli söz söylə. Mərhəmətdən onlara təvazö qanadını endir və de: «Rəbbim, onlar məni kiçikkən böyütdükləri kimi, Sən də onlara rəhm et».',
          en: 'Your Lord has decreed that you worship none but Him, and that you be good to parents. Whether one or both of them reach old age with you, do not say to them “uff”, nor repel them, but speak to them a noble word. And lower to them the wing of humility out of mercy and say: “My Lord, have mercy on them as they raised me when I was small.”',
          ru: 'Твой Господь повелел, чтобы вы не поклонялись никому, кроме Него, и делали добро родителям. Если один из них или оба достигнут при тебе старости, не говори им «тьфу», не кричи на них и говори им почтительные слова. Преклони перед ними крыло смирения по милосердию и скажи: «Господи, помилуй их, ведь они растили меня маленьким».',
          ar: 'وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوٓا۟ إِلَّآ إِيَّاهُ وَبِٱلْوَٰلِدَيْنِ إِحْسَـٰنًا',
          tr: 'Rabbin, yalnız O’na kulluk etmenizi ve anne-babaya iyilik etmenizi emretti. Onlardan biri ya da ikisi senin yanında yaşlılığa erişirse onlara “öf” bile deme, onları azarlama, onlara güzel söz söyle. Merhametle onlara alçakgönüllülük kanadını indir ve de ki: “Rabbim, onlar beni küçükken nasıl yetiştirdilerse Sen de onlara öyle merhamet et.”',
        } },
        { t: 'hadith', ar: 'سَأَلْتُ النَّبِيَّ ﷺ: أَيُّ الْعَمَلِ أَحَبُّ إِلَى اللهِ عَزَّ وَجَلَّ؟ قَالَ: الصَّلاَةُ عَلَى وَقْتِهَا، قُلْتُ: ثُمَّ أَيٌّ؟ قَالَ: ثُمَّ بِرُّ الْوَالِدَيْنِ، قُلْتُ: ثُمَّ أَيٌّ؟ قَالَ: ثُمَّ الْجِهَادُ فِي سَبِيلِ اللهِ', src: SRC('Buxari 527, 5970; əl-Ədəb əl-Müfrəd 1', 'al-Bukhari 527, 5970; al-Adab al-Mufrad 1', 'Бухари 527, 5970; аль-Адаб аль-Муфрад 1', 'البخاري ٥٢٧، ٥٩٧٠؛ الأدب المفرد ١', 'Buhârî 527, 5970; el-Edebü’l-Müfred 1'), grade: AGREED, text: {
          az: 'İbn Məsud deyir: Peyğəmbərdən ﷺ soruşdum: «Allaha ən sevimli əməl hansıdır?» Buyurdu: «Vaxtında qılınan namaz». «Sonra hansı?» — dedim. Buyurdu: «Sonra valideynə yaxşılıq». «Sonra hansı?» — dedim. Buyurdu: «Sonra Allah yolunda cihad».',
          en: 'Ibn Mas‘ud said: I asked the Prophet ﷺ: “Which deed is most beloved to Allah?” He said: “Prayer at its proper time.” I said: “Then what?” He said: “Then dutifulness to parents.” I said: “Then what?” He said: “Then jihad in the path of Allah.”',
          ru: 'Ибн Масуд сказал: я спросил Пророка ﷺ: «Какое дело любимее всего Аллаху?» Он ответил: «Намаз, совершённый вовремя». Я спросил: «А затем?» Он ответил: «Затем почтение к родителям». Я спросил: «А затем?» Он ответил: «Затем джихад на пути Аллаха».',
          ar: 'عن ابن مسعود قال: سألت النبي ﷺ: أي العمل أحب إلى الله؟ قال: «الصلاة على وقتها»، قلت: ثم أي؟ قال: «ثم بر الوالدين»، قلت: ثم أي؟ قال: «ثم الجهاد في سبيل الله».',
          tr: 'İbn Mes‘ûd şöyle dedi: Peygamber’e ﷺ “Allah’a en sevimli amel hangisidir?” diye sordum. “Vaktinde kılınan namaz” buyurdu. “Sonra hangisi?” dedim. “Sonra anne-babaya iyilik” buyurdu. “Sonra hangisi?” dedim. “Sonra Allah yolunda cihad” buyurdu.',
        } },
        { t: 'p', text: {
          az: 'Allah Qurani-Kərimdə valideynə yaxşılığı bir neçə yerdə Özünə ibadət əmri ilə yanaşı zikr edib (2:83, 4:36, 17:23). Bu, onların haqqının nə qədər böyük olduğunu göstərir.',
          en: 'In several places Allah mentions kindness to parents right beside the command to worship Him alone (2:83, 4:36, 17:23). This shows how great their right is.',
          ru: 'В нескольких местах Корана Аллах упоминает доброту к родителям рядом с повелением поклоняться только Ему (2:83, 4:36, 17:23). Это показывает величие их права.',
          ar: 'وقد قرن الله الإحسان إلى الوالدين بالأمر بعبادته في مواضع من كتابه (البقرة ٨٣، النساء ٣٦، الإسراء ٢٣)، وهذا يدل على عظم حقهما.',
          tr: 'Allah, Kur’an’ın birkaç yerinde anne-babaya iyiliği Kendisine kulluk emriyle yan yana zikretmiştir (2:83, 4:36, 17:23). Bu, haklarının ne kadar büyük olduğunu gösterir.',
        } },
      ],
    },
    {
      id: 'mother',
      title: { az: 'Əvvəlcə ana', en: 'The mother first', ru: 'Прежде всего мать', ar: 'الأم أولًا', tr: 'Önce anne' },
      blocks: [
        { t: 'ayah', ar: 'وَوَصَّيْنَا ٱلْإِنسَـٰنَ بِوَٰلِدَيْهِ حَمَلَتْهُ أُمُّهُۥ وَهْنًا عَلَىٰ وَهْنٍ وَفِصَـٰلُهُۥ فِى عَامَيْنِ أَنِ ٱشْكُرْ لِى وَلِوَٰلِدَيْكَ إِلَىَّ ٱلْمَصِيرُ', ref: '31:14', text: {
          az: 'Biz insana valideyni barədə tövsiyə etdik. Anası onu zəiflik üstündən zəifliklə daşıdı, onu süddən kəsmək iki ildədir. (Tövsiyə etdik ki:) «Mənə və valideyninə şükür et. Dönüş Mənədir».',
          en: 'We have enjoined upon man care for his parents. His mother carried him in weakness upon weakness, and his weaning is in two years. Be grateful to Me and to your parents; to Me is the final return.',
          ru: 'Мы заповедали человеку относиться хорошо к родителям. Мать носила его, испытывая слабость за слабостью, и отнимают его от груди через два года. Будь благодарен Мне и своим родителям. Ко Мне предстоит прибытие.',
          ar: 'وَوَصَّيْنَا ٱلْإِنسَـٰنَ بِوَٰلِدَيْهِ حَمَلَتْهُ أُمُّهُۥ وَهْنًا عَلَىٰ وَهْنٍ',
          tr: 'Biz insana anne-babasını tavsiye ettik. Annesi onu zayıflık üstüne zayıflıkla taşıdı; sütten kesilmesi de iki yıldadır. (Dedik ki:) “Bana ve anne-babana şükret. Dönüş Bana’dır.”',
        } },
        { t: 'hadith', ar: 'جَاءَ رَجُلٌ إِلَى رَسُولِ اللَّهِ ﷺ فَقَالَ: يَا رَسُولَ اللَّهِ، مَنْ أَحَقُّ بِحُسْنِ صَحَابَتِي؟ قَالَ: أُمُّكَ. قَالَ: ثُمَّ مَنْ؟ قَالَ: أُمُّكَ. قَالَ: ثُمَّ مَنْ؟ قَالَ: أُمُّكَ. قَالَ: ثُمَّ مَنْ؟ قَالَ: ثُمَّ أَبُوكَ', src: SRC('Buxari 5971, Müslim 2548', 'al-Bukhari 5971, Muslim 2548', 'Бухари 5971, Муслим 2548', 'البخاري ٥٩٧١، مسلم ٢٥٤٨', 'Buhârî 5971, Müslim 2548'), grade: AGREED, text: {
          az: 'Bir nəfər Allahın Elçisinin ﷺ yanına gəlib dedi: «Ey Allahın Elçisi, gözəl rəftarıma ən çox kim layiqdir?» Buyurdu: «Anan». «Sonra kim?» Buyurdu: «Anan». «Sonra kim?» Buyurdu: «Anan». «Sonra kim?» Buyurdu: «Sonra atan».',
          en: 'A man came to the Messenger of Allah ﷺ and said: “O Messenger of Allah, who is most deserving of my good companionship?” He said: “Your mother.” He said: “Then who?” He said: “Your mother.” He said: “Then who?” He said: “Your mother.” He said: “Then who?” He said: “Then your father.”',
          ru: 'Один человек пришёл к Посланнику Аллаха ﷺ и спросил: «О Посланник Аллаха, кто больше всех достоин моего хорошего отношения?» Он ответил: «Твоя мать». — «А затем кто?» — «Твоя мать». — «А затем кто?» — «Твоя мать». — «А затем кто?» — «Затем твой отец».',
          ar: 'جاء رجل إلى رسول الله ﷺ فقال: يا رسول الله، من أحق بحسن صحابتي؟ قال: «أمك»، قال: ثم من؟ قال: «أمك»، قال: ثم من؟ قال: «أمك»، قال: ثم من؟ قال: «ثم أبوك».',
          tr: 'Bir adam Allah’ın Resûlü’ne ﷺ gelip “Ey Allah’ın Resûlü, iyi davranışıma en çok kim layıktır?” dedi. “Annen” buyurdu. “Sonra kim?” dedi. “Annen” buyurdu. “Sonra kim?” dedi. “Annen” buyurdu. “Sonra kim?” dedi. “Sonra baban” buyurdu.',
        } },
        { t: 'hadith', ar: 'قُلْتُ: يَا رَسُولَ اللهِ، مَنْ أَبَرُّ؟ قَالَ: أُمَّكَ، قُلْتُ: مَنْ أَبَرُّ؟ قَالَ: أُمَّكَ، قُلْتُ: مَنْ أَبَرُّ؟ قَالَ: أُمَّكَ، قُلْتُ: مَنْ أَبَرُّ؟ قَالَ: أَبَاكَ، ثُمَّ الأَقْرَبَ فَالأَقْرَبَ', src: SRC('əl-Ədəb əl-Müfrəd 3', 'al-Adab al-Mufrad 3', 'аль-Адаб аль-Муфрад 3', 'الأدب المفرد ٣', 'el-Edebü’l-Müfred 3'), grade: HASAN_ALB, text: {
          az: 'Bəhz ibn Həkimin babası deyir: «Ey Allahın Elçisi, kimə yaxşılıq edim?» — dedim. Buyurdu: «Anana» (üç dəfə), sonra: «Atana, sonra yaxın olana, sonra ondan sonrakı yaxına».',
          en: 'The grandfather of Bahz ibn Hakim said: I said: “O Messenger of Allah, to whom should I be dutiful?” He said: “Your mother” (three times), then: “Your father, then the nearest and then the next nearest.”',
          ru: 'Дед Бахза ибн Хакима сказал: я спросил: «О Посланник Аллаха, к кому мне проявлять почтение?» Он ответил: «К матери» (трижды), затем: «К отцу, затем к ближайшему, а затем к следующему по близости».',
          ar: 'عن جد بهز بن حكيم قال: قلت: يا رسول الله، من أبر؟ قال: «أمك» ثلاثًا، ثم قال: «أباك، ثم الأقرب فالأقرب».',
          tr: 'Behz b. Hakîm’in dedesi şöyle dedi: “Ey Allah’ın Resûlü, kime iyilik edeyim?” dedim. “Annene” buyurdu (üç kez), sonra: “Babana, sonra en yakınına, sonra ondan sonraki yakınına.”',
        } },
      ],
    },
    {
      id: 'practice',
      title: { az: 'Yaxşılıq necə olur?', en: 'What dutifulness looks like', ru: 'В чём выражается почтение', ar: 'صور البر', tr: 'İyilik nasıl olur?' },
      blocks: [
        { t: 'list', items: [
          { az: 'Onlarla yumşaq və hörmətlə danışmaq, «uf» belə deməmək, səsi onların səsindən ucaltmamaq (17:23).', en: 'Speaking to them gently and respectfully, not even saying “uff”, not raising your voice above theirs (17:23).', ru: 'Говорить с ними мягко и почтительно, не говорить даже «тьфу», не повышать голос над их голосом (17:23).', ar: 'لين الكلام معهما وتوقيرهما، وعدم قول «أف»، وعدم رفع الصوت عليهما (الإسراء ٢٣).', tr: 'Onlarla yumuşak ve saygıyla konuşmak, “öf” bile dememek, sesini onların sesinden yükseltmemek (17:23).' },
          { az: 'Məşru işlərdə onlara itaət etmək, ehtiyaclarını qarşılamaq, lazım olanda onlara xərcləmək.', en: 'Obeying them in what is permissible, meeting their needs and spending on them when they need it.', ru: 'Слушаться их в дозволенном, удовлетворять их нужды и тратить на них, когда они нуждаются.', ar: 'طاعتهما في المعروف، وقضاء حوائجهما، والنفقة عليهما عند الحاجة.', tr: 'Meşru işlerde onlara itaat etmek, ihtiyaçlarını karşılamak, gerektiğinde onlara harcamak.' },
          { az: 'Qocalanda onlara xidmət etmək və onları başqasına «yük» kimi baxmamaq.', en: 'Serving them in old age and never treating them as a “burden”.', ru: 'Служить им в старости и не относиться к ним как к «обузе».', ar: 'خدمتهما عند الكبر، وألا يُنظر إليهما كأنهما عبء.', tr: 'Yaşlandıklarında onlara hizmet etmek ve onları bir “yük” gibi görmemek.' },
          { az: 'Onlar üçün dua etmək: «Rəbbim, onlar məni kiçikkən böyütdükləri kimi, Sən də onlara rəhm et» (17:24).', en: 'Making du‘a for them: “My Lord, have mercy on them as they raised me when I was small” (17:24).', ru: 'Делать за них дуа: «Господи, помилуй их, ведь они растили меня маленьким» (17:24).', ar: 'الدعاء لهما: ﴿رَّبِّ ٱرْحَمْهُمَا كَمَا رَبَّيَانِى صَغِيرًا﴾.', tr: 'Onlar için dua etmek: “Rabbim, onlar beni küçükken nasıl yetiştirdilerse Sen de onlara öyle merhamet et” (17:24).' },
        ] },
        { t: 'hadith', ar: 'لاَ يَجْزِي وَلَدٌ وَالِدَهُ، إِلاَّ أَنْ يَجِدَهُ مَمْلُوكًا فَيَشْتَرِيَهُ فَيُعْتِقَهُ', src: SRC('əl-Ədəb əl-Müfrəd 10', 'al-Adab al-Mufrad 10', 'аль-Адаб аль-Муфрад 10', 'الأدب المفرد ١٠', 'el-Edebü’l-Müfred 10'), grade: SAHIH_ALB, text: {
          az: 'Əbu Hüreyrə rəvayət edir ki, Peyğəmbər ﷺ dedi: «Övlad atasının haqqını ödəyə bilməz — yalnız onu qul görüb satın alaraq azad etsə, istisnadır».',
          en: 'Abu Hurayrah reported that the Prophet ﷺ said: “A child cannot repay his father unless he finds him a slave, buys him and sets him free.”',
          ru: 'Абу Хурайра передал, что Пророк ﷺ сказал: «Сын не сможет воздать отцу, разве что найдёт его рабом, выкупит и освободит».',
          ar: 'عن أبي هريرة عن النبي ﷺ قال: «لا يجزي ولد والده، إلا أن يجده مملوكًا فيشتريه فيعتقه».',
          tr: 'Ebû Hüreyre’nin rivayetine göre Peygamber ﷺ şöyle buyurdu: “Evlat babasının hakkını ödeyemez; ancak onu köle olarak bulup satın alır ve azat ederse başka.”',
        } },
        { t: 'ayah', ar: 'وَإِن جَـٰهَدَاكَ عَلَىٰٓ أَن تُشْرِكَ بِى مَا لَيْسَ لَكَ بِهِۦ عِلْمٌ فَلَا تُطِعْهُمَا ۖ وَصَاحِبْهُمَا فِى ٱلدُّنْيَا مَعْرُوفًا ۖ وَٱتَّبِعْ سَبِيلَ مَنْ أَنَابَ إِلَىَّ ۚ ثُمَّ إِلَىَّ مَرْجِعُكُمْ فَأُنَبِّئُكُم بِمَا كُنتُمْ تَعْمَلُونَ', ref: '31:15', text: {
          az: 'Əgər onlar səni haqqında heç bir biliyin olmayan bir şeyi Mənə şərik qoşmağa məcbur etməyə çalışsalar, onlara itaət etmə; dünyada isə onlarla yaxşı rəftar et. Mənə tərəf yönələnin yoluna tabe ol. Sonra dönüşünüz Mənədir və Mən sizə etdiklərinizi xəbər verəcəyəm.',
          en: 'But if they strive to make you associate with Me that of which you have no knowledge, do not obey them; yet keep company with them in this world in kindness, and follow the way of those who turn back to Me. Then to Me is your return, and I will inform you of what you used to do.',
          ru: 'Если же они станут принуждать тебя приобщать ко Мне в сотоварищи то, о чём у тебя нет знания, не повинуйся им, но в этом мире обходись с ними по-доброму и следуй путём обратившихся ко Мне. Затем вам предстоит вернуться ко Мне, и Я сообщу вам о том, что вы совершали.',
          ar: 'وَإِن جَـٰهَدَاكَ عَلَىٰٓ أَن تُشْرِكَ بِى مَا لَيْسَ لَكَ بِهِۦ عِلْمٌ فَلَا تُطِعْهُمَا ۖ وَصَاحِبْهُمَا فِى ٱلدُّنْيَا مَعْرُوفًا',
          tr: 'Eğer onlar seni, hakkında bilgin olmayan bir şeyi Bana ortak koşman için zorlarlarsa onlara itaat etme; dünyada ise onlarla iyi geçin. Bana yönelenin yoluna uy. Sonra dönüşünüz Bana’dır; yaptıklarınızı size haber vereceğim.',
        } },
        { t: 'note', kind: 'info', text: {
          az: 'İtaət yalnız yaxşı işdədir: «Günahda itaət yoxdur, itaət yalnız məruf (yaxşı) işdədir» (Buxari 7257). Valideyn günah əmr edərsə, ona itaət edilmir, amma onlarla rəftar yenə də gözəl qalır. Əsma bint Əbu Bəkrin müşrik anası onun yanına gələndə Peyğəmbər ﷺ ona «Anana yaxşılıq et» demişdi (Buxari 2620; əl-Ədəb əl-Müfrəd 25).',
          en: 'Obedience is only in what is good: “There is no obedience in sin; obedience is only in what is right” (al-Bukhari 7257). If parents command a sin, they are not obeyed in it, yet one’s treatment of them stays kind. When the idolatrous mother of Asma’ bint Abi Bakr came to her, the Prophet ﷺ told her: “Keep ties with your mother” (al-Bukhari 2620; al-Adab al-Mufrad 25).',
          ru: 'Повиновение — только в благом: «Нет повиновения в грехе, повиновение — только в одобряемом» (Бухари 7257). Если родители велят совершить грех, им в этом не подчиняются, но обращение с ними остаётся добрым. Когда к Асме бинт Абу Бакр пришла её мать-многобожница, Пророк ﷺ сказал ей: «Поддерживай связь с матерью» (Бухари 2620; аль-Адаб аль-Муфрад 25).',
          ar: 'الطاعة في المعروف فقط: «لا طاعة في معصية، إنما الطاعة في المعروف» (البخاري ٧٢٥٧). فإن أمر الوالدان بمعصية لم يطاعا فيها مع بقاء الإحسان إليهما، ولما قدمت على أسماء بنت أبي بكر أمها وهي مشركة قال لها النبي ﷺ: «صلي أمك» (البخاري ٢٦٢٠؛ الأدب المفرد ٢٥).',
          tr: 'İtaat yalnızca iyilikte olur: “Günahta itaat yoktur, itaat ancak marufta (iyi işte)dır” (Buhârî 7257). Anne-baba günah emrederse onlara itaat edilmez, ama onlara davranış yine güzel kalır. Esmâ bint Ebî Bekir’in müşrik annesi ona geldiğinde Peygamber ﷺ ona “Annene iyilik et” buyurmuştu (Buhârî 2620; el-Edebü’l-Müfred 25).',
        } },
      ],
    },
    {
      id: 'uquq',
      title: { az: 'Valideynə üsyan (üquq) — böyük günah', en: 'Disobedience to parents — a major sin', ru: 'Непочтительность к родителям — тяжкий грех', ar: 'عقوق الوالدين من الكبائر', tr: 'Anne-babaya isyan (ukuk) — büyük günah' },
      blocks: [
        { t: 'hadith', ar: 'أَلاَ أُنَبِّئُكُمْ بِأَكْبَرِ الْكَبَائِرِ؟ قُلْنَا: بَلَى يَا رَسُولَ اللَّهِ. قَالَ: الإِشْرَاكُ بِاللَّهِ، وَعُقُوقُ الْوَالِدَيْنِ. وَكَانَ مُتَّكِئًا فَجَلَسَ فَقَالَ: أَلاَ وَقَوْلُ الزُّورِ وَشَهَادَةُ الزُّورِ', src: SRC('Buxari 5976; əl-Ədəb əl-Müfrəd 15', 'al-Bukhari 5976; al-Adab al-Mufrad 15', 'Бухари 5976; аль-Адаб аль-Муфрад 15', 'البخاري ٥٩٧٦؛ الأدب المفرد ١٥', 'Buhârî 5976; el-Edebü’l-Müfred 15'), grade: AGREED, text: {
          az: 'Əbu Bəkrə rəvayət edir ki, Allahın Elçisi ﷺ dedi: «Sizə günahların ən böyüyünü xəbər verimmi?» Dedik: «Bəli, ey Allahın Elçisi». Buyurdu: «Allaha şərik qoşmaq və valideynə üsyan etmək». Söykənmişdi, oturub dedi: «Bilin ki, yalan söz və yalançı şahidlik də».',
          en: 'Abu Bakrah reported that the Messenger of Allah ﷺ said: “Shall I not tell you of the greatest of the major sins?” We said: “Yes, O Messenger of Allah.” He said: “Associating partners with Allah and disobedience to parents.” He had been reclining, then sat up and said: “And false speech and false testimony.”',
          ru: 'Абу Бакра передал, что Посланник Аллаха ﷺ сказал: «Не сообщить ли вам о величайшем из тяжких грехов?» Мы сказали: «Да, о Посланник Аллаха». Он сказал: «Придавать Аллаху сотоварищей и быть непочтительным к родителям». Он сидел, облокотившись, затем выпрямился и сказал: «А также ложные слова и лжесвидетельство».',
          ar: 'عن أبي بكرة قال: قال رسول الله ﷺ: «ألا أنبئكم بأكبر الكبائر؟» قلنا: بلى يا رسول الله، قال: «الإشراك بالله، وعقوق الوالدين»، وكان متكئًا فجلس فقال: «ألا وقول الزور وشهادة الزور».',
          tr: 'Ebû Bekre’nin rivayetine göre Allah’ın Resûlü ﷺ şöyle buyurdu: “Size büyük günahların en büyüğünü haber vereyim mi?” “Evet, ey Allah’ın Resûlü” dedik. “Allah’a ortak koşmak ve anne-babaya isyan etmek” buyurdu. Yaslanmıştı, doğrulup oturdu ve “Dikkat edin, yalan söz ve yalancı şahitlik de” buyurdu.',
        } },
        { t: 'hadith', ar: 'رَغِمَ أَنْفُ، ثُمَّ رَغِمَ أَنْفُ، ثُمَّ رَغِمَ أَنْفُ. قِيلَ: مَنْ يَا رَسُولَ اللَّهِ؟ قَالَ: مَنْ أَدْرَكَ أَبَوَيْهِ عِنْدَ الْكِبَرِ أَحَدَهُمَا أَوْ كِلَيْهِمَا فَلَمْ يَدْخُلِ الْجَنَّةَ', src: SRC('Müslim 2551; əl-Ədəb əl-Müfrəd 21', 'Muslim 2551; al-Adab al-Mufrad 21', 'Муслим 2551; аль-Адаб аль-Муфрад 21', 'مسلم ٢٥٥١؛ الأدب المفرد ٢١', 'Müslim 2551; el-Edebü’l-Müfred 21'), grade: AGREED, text: {
          az: '«Burnu torpağa sürtülsün, yenə burnu torpağa sürtülsün, yenə burnu torpağa sürtülsün!» Soruşdular: «Kimin, ey Allahın Elçisi?» Buyurdu: «Ata-anasından birinin və ya hər ikisinin qocalığına çatıb (onlara yaxşılıq edərək) Cənnətə girə bilməyənin».',
          en: '“May his nose be rubbed in dust, then may his nose be rubbed in dust, then may his nose be rubbed in dust!” It was said: “Who, O Messenger of Allah?” He said: “The one whose parents, one or both of them, reach old age while he is with them, yet he does not enter Paradise (through serving them).”',
          ru: '«Да будет унижен, да будет унижен, да будет унижен!» Спросили: «Кто, о Посланник Аллаха?» Он ответил: «Тот, при ком один из родителей или оба достигли старости, а он (служа им) так и не вошёл в Рай».',
          ar: 'قال رسول الله ﷺ: «رغم أنف، ثم رغم أنف، ثم رغم أنف»، قيل: من يا رسول الله؟ قال: «من أدرك أبويه عند الكبر أحدهما أو كليهما فلم يدخل الجنة».',
          tr: '“Burnu yere sürtülsün, yine burnu yere sürtülsün, yine burnu yere sürtülsün!” “Kimin, ey Allah’ın Resûlü?” denildi. “Anne-babasından birinin veya ikisinin yaşlılığına erişip de (onlara iyilik ederek) cennete giremeyenin” buyurdu.',
        } },
        { t: 'hadith', ar: 'مِنَ الْكَبَائِرِ أَنْ يَشْتِمَ الرَّجُلُ وَالِدَيْهِ، فَقَالُوا: كَيْفَ يَشْتِمُ؟ قَالَ: يَشْتِمُ الرَّجُلَ، فَيَشْتُمُ أَبَاهُ وَأُمَّهُ', src: SRC('əl-Ədəb əl-Müfrəd 27', 'al-Adab al-Mufrad 27', 'аль-Адаб аль-Муфрад 27', 'الأدب المفرد ٢٧', 'el-Edebü’l-Müfred 27'), grade: SAHIH_ALB, text: {
          az: 'Abdullah ibn Amr rəvayət edir ki, Peyğəmbər ﷺ dedi: «İnsanın öz valideynini söyməsi böyük günahlardandır». Soruşdular: «İnsan valideynini necə söyər?» Buyurdu: «Başqasının atasını söyər, o da onun atasını və anasını söyər».',
          en: '‘Abdullah ibn ‘Amr reported that the Prophet ﷺ said: “Among the major sins is that a man reviles his parents.” They said: “How could he revile them?” He said: “He reviles another man, and that man reviles his father and mother.”',
          ru: 'Абдуллах ибн Амр передал, что Пророк ﷺ сказал: «К тяжким грехам относится, когда человек бранит своих родителей». Спросили: «Как же он их бранит?» Он ответил: «Он бранит другого человека, а тот бранит его отца и мать».',
          ar: 'عن عبد الله بن عمرو قال: قال النبي ﷺ: «من الكبائر أن يشتم الرجل والديه»، فقالوا: كيف يشتم؟ قال: «يشتم الرجل فيشتم أباه وأمه».',
          tr: 'Abdullah b. Amr’ın rivayetine göre Peygamber ﷺ şöyle buyurdu: “Kişinin anne-babasına sövmesi büyük günahlardandır.” “Nasıl söver?” dediler. “Başkasına söver, o da onun babasına ve annesine söver” buyurdu.',
        } },
        { t: 'quote', ar: 'بُكَاءُ الْوَالِدَيْنِ مِنَ الْعُقُوقِ وَالْكَبَائِرِ', by: { az: 'Abdullah ibn Ömər', en: '‘Abdullah ibn ‘Umar', ru: 'Абдуллах ибн Умар', ar: 'عبد الله بن عمر', tr: 'Abdullah b. Ömer' }, ref: { az: 'əl-Ədəb əl-Müfrəd 31 (Albani: səhih)', en: 'al-Adab al-Mufrad 31 (al-Albani: sahih)', ru: 'аль-Адаб аль-Муфрад 31 (аль-Албани: достоверно)', ar: 'الأدب المفرد ٣١ (صححه الألباني)', tr: 'el-Edebü’l-Müfred 31 (Elbânî: sahih)' }, text: {
          az: '«Valideyni ağlatmaq üquqdan və böyük günahlardandır».',
          en: '“Making one’s parents weep is part of disobedience and of the major sins.”',
          ru: '«Довести родителей до слёз — это непочтительность и один из тяжких грехов».',
          ar: '«بكاء الوالدين من العقوق والكبائر».',
          tr: '“Anne-babayı ağlatmak ukuktan ve büyük günahlardandır.”',
        } },
      ],
    },
    {
      id: 'after-death',
      title: { az: 'Vəfatlarından sonra yaxşılıq', en: 'Dutifulness after their death', ru: 'Почтение после их смерти', ar: 'البر بعد الموت', tr: 'Vefatlarından sonra iyilik' },
      blocks: [
        { t: 'hadith', ar: 'إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ: إِلاَّ مِنْ صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ', src: SRC('Müslim 1631; əl-Ədəb əl-Müfrəd 38', 'Muslim 1631; al-Adab al-Mufrad 38', 'Муслим 1631; аль-Адаб аль-Муфрад 38', 'مسلم ١٦٣١؛ الأدب المفرد ٣٨', 'Müslim 1631; el-Edebü’l-Müfred 38'), grade: AGREED, text: {
          az: 'Əbu Hüreyrə rəvayət edir ki, Allahın Elçisi ﷺ dedi: «İnsan öldükdə əməli kəsilir, üç şey istisnadır: davamlı sədəqə, fayda verən elm və ya onun üçün dua edən saleh övlad».',
          en: 'Abu Hurayrah reported that the Messenger of Allah ﷺ said: “When a person dies, his deeds are cut off except for three: an ongoing charity, knowledge that is benefited from, or a righteous child who makes du‘a for him.”',
          ru: 'Абу Хурайра передал, что Посланник Аллаха ﷺ сказал: «Когда человек умирает, его деяния прекращаются, кроме трёх: непрекращающейся милостыни, знания, которое приносит пользу, или праведного ребёнка, который делает за него дуа».',
          ar: 'عن أبي هريرة أن رسول الله ﷺ قال: «إذا مات الإنسان انقطع عنه عمله إلا من ثلاثة: إلا من صدقة جارية، أو علم ينتفع به، أو ولد صالح يدعو له».',
          tr: 'Ebû Hüreyre’nin rivayetine göre Allah’ın Resûlü ﷺ şöyle buyurdu: “İnsan ölünce ameli kesilir; ancak üç şey müstesna: sadaka-i câriye, faydalanılan ilim veya kendisine dua eden salih evlat.”',
        } },
        { t: 'steps', items: [
          { title: { az: 'Dua və istiğfar', en: 'Du‘a and seeking forgiveness', ru: 'Дуа и мольба о прощении', ar: 'الدعاء والاستغفار', tr: 'Dua ve istiğfar' }, text: { az: 'Saleh övladın duası onlara çatır (Müslim 1631).', en: 'The du‘a of a righteous child reaches them (Muslim 1631).', ru: 'Дуа праведного ребёнка доходит до них (Муслим 1631).', ar: 'دعاء الولد الصالح ينفعهما (مسلم ١٦٣١).', tr: 'Salih evladın duası onlara ulaşır (Müslim 1631).' } },
          { title: { az: 'Onların adından sədəqə', en: 'Charity on their behalf', ru: 'Милостыня от их имени', ar: 'الصدقة عنهما', tr: 'Onlar adına sadaka' }, text: { az: 'Bir nəfər: «Anam vəsiyyətsiz öldü, onun adından sədəqə versəm, ona fayda verərmi?» — deyə soruşdu. Peyğəmbər ﷺ «Bəli» dedi (əl-Ədəb əl-Müfrəd 39, səhih).', en: 'A man asked: “My mother died without a will; will it benefit her if I give charity on her behalf?” The Prophet ﷺ said: “Yes” (al-Adab al-Mufrad 39, sahih).', ru: 'Один человек спросил: «Моя мать умерла без завещания; поможет ли ей, если я раздам милостыню от её имени?» Пророк ﷺ ответил: «Да» (аль-Адаб аль-Муфрад 39, достоверный).', ar: 'قال رجل: إن أمي توفيت ولم توص، أفينفعها أن أتصدق عنها؟ قال: «نعم» (الأدب المفرد ٣٩، صحيح).', tr: 'Bir adam “Annem vasiyetsiz öldü, onun adına sadaka versem ona fayda verir mi?” diye sordu. Peygamber ﷺ “Evet” buyurdu (el-Edebü’l-Müfred 39, sahih).' } },
          { title: { az: 'Onların borcunu və nəzirini ödəmək', en: 'Fulfilling their debts and vows', ru: 'Выплатить их долги и исполнить обеты', ar: 'قضاء ديونهما ونذورهما', tr: 'Borçlarını ve adaklarını ödemek' }, text: { az: 'Cüheynədən bir qadın anasının nəzir etdiyi həcc barədə soruşduqda Peyğəmbər ﷺ «Onun yerinə həcc et… Allahın haqqını ödəyin, Allah vəfaya daha layiqdir» buyurdu (Buxari 1852).', en: 'When a woman from Juhaynah asked about a Hajj her mother had vowed, the Prophet ﷺ said: “Perform Hajj on her behalf… Pay what is due to Allah, for Allah is more deserving of fulfilment” (al-Bukhari 1852).', ru: 'Когда женщина из племени Джухайна спросила о хадже, который обещала совершить её мать, Пророк ﷺ сказал: «Соверши хадж за неё… Выплачивайте долг Аллаху, ведь Аллах более достоин исполнения» (Бухари 1852).', ar: 'سألت امرأة من جهينة عن حجٍّ نذرته أمها، فقال ﷺ: «حجي عنها... اقضوا الله، فالله أحق بالوفاء» (البخاري ١٨٥٢).', tr: 'Cüheyne’den bir kadın annesinin adadığı hac hakkında sorunca Peygamber ﷺ “Onun yerine haccet… Allah’ın hakkını ödeyin, Allah vefaya daha layıktır” buyurdu (Buhârî 1852).' } },
          { title: { az: 'Onların dostlarına yaxşılıq', en: 'Kindness to their friends', ru: 'Доброта к их друзьям', ar: 'صلة أهل ودهما', tr: 'Dostlarına iyilik' }, text: { az: '«Yaxşılığın ən yaxşısı insanın atasının sevdiyi adamlarla əlaqəni saxlamasıdır» (Müslim 2552; əl-Ədəb əl-Müfrəd 41).', en: '“The finest form of dutifulness is that a man keeps ties with those his father loved” (Muslim 2552; al-Adab al-Mufrad 41).', ru: '«Наилучшее проявление почтения — поддерживать связь с теми, кого любил отец» (Муслим 2552; аль-Адаб аль-Муфрад 41).', ar: '«إن أبر البر صلة الولد أهل ود أبيه» (مسلم ٢٥٥٢؛ الأدب المفرد ٤١).', tr: '“İyiliğin en güzeli, kişinin babasının sevdikleriyle bağı sürdürmesidir” (Müslim 2552; el-Edebü’l-Müfred 41).' } },
        ] },
        { t: 'note', kind: 'warn', text: {
          az: 'Bu barədə məşhur olan bəzi rəvayətlər səhih deyil: məsələn, «valideynin vəfatından sonra yaxşılıqdan nə qalıb?» sualı ilə başlayan Əbu Useyd hədisini (əl-Ədəb əl-Müfrəd 35) Albani zəif sayıb; «hər cümə valideynin qəbrini ziyarət edənin günahı bağışlanar» sözünü isə mövzu (uydurma) sayıb. Qəbir ziyarətinin ümumi hökmləri «Cənazə» dərsindədir.',
          en: 'Some well-known narrations on this topic are not authentic: for example, al-Albani graded weak the hadith of Abu Usayd that begins “Is there anything left of dutifulness to my parents after their death?” (al-Adab al-Mufrad 35), and graded as fabricated the saying “Whoever visits his parents’ grave every Friday is forgiven”. The general rulings of visiting graves are in the “Janazah” lesson.',
          ru: 'Некоторые известные на эту тему предания недостоверны: например, хадис Абу Усайда, начинающийся словами «Осталось ли что-то из почтения к родителям после их смерти?» (аль-Адаб аль-Муфрад 35), аль-Албани признал слабым, а слова «Кто посещает могилу родителей каждую пятницу, тому прощается» — выдуманными. Общие положения о посещении могил — в уроке «Джаназа».',
          ar: 'بعض ما اشتهر في هذا الباب لا يصح؛ فحديث أبي أسيد: «هل بقي من بر أبوي شيء أبرهما به بعد موتهما؟» (الأدب المفرد ٣٥) ضعفه الألباني، وحديث «من زار قبر أبويه في كل جمعة غفر له» حكم عليه بالوضع. وأحكام زيارة القبور عمومًا في درس «الجنائز».',
          tr: 'Bu konuda meşhur olan bazı rivayetler sahih değildir: örneğin “Anne-babamın vefatından sonra onlara iyilikten geriye bir şey kaldı mı?” diye başlayan Ebû Üseyd hadisini (el-Edebü’l-Müfred 35) Elbânî zayıf saymış; “Her cuma anne-babasının kabrini ziyaret eden bağışlanır” sözünü ise mevzu (uydurma) saymıştır. Kabir ziyaretinin genel hükümleri “Cenaze” dersindedir.',
        } },
      ],
    },
    {
      id: 'kinship',
      title: { az: 'Qohumluq əlaqəsi (silətur-rəhim)', en: 'Ties of kinship (silat ar-rahim)', ru: 'Родственные связи (силя ар-рахим)', ar: 'صلة الرحم', tr: 'Akrabalık bağı (sıla-i rahim)' },
      blocks: [
        { t: 'ayah', ar: 'فَهَلْ عَسَيْتُمْ إِن تَوَلَّيْتُمْ أَن تُفْسِدُوا۟ فِى ٱلْأَرْضِ وَتُقَطِّعُوٓا۟ أَرْحَامَكُمْ ۝ أُو۟لَـٰٓئِكَ ٱلَّذِينَ لَعَنَهُمُ ٱللَّهُ فَأَصَمَّهُمْ وَأَعْمَىٰٓ أَبْصَـٰرَهُمْ', ref: '47:22-23', text: {
          az: 'Əgər üz döndərsəniz, yer üzündə fitnə-fəsad törədib qohumluq əlaqələrinizi qırmağınız mümkündürmü? Onlar Allahın lənətlədiyi, qulaqlarını kar, gözlərini kor etdiyi kəslərdir.',
          en: 'Would you, if you turned away, cause corruption on earth and sever your ties of kinship? Those are the ones whom Allah has cursed, so He made them deaf and blinded their eyes.',
          ru: 'Неужели, если вы отвернётесь, вы станете распространять на земле нечестие и разрывать родственные узы? Это — те, которых проклял Аллах, сделал глухими и ослепил их взоры.',
          ar: 'فَهَلْ عَسَيْتُمْ إِن تَوَلَّيْتُمْ أَن تُفْسِدُوا۟ فِى ٱلْأَرْضِ وَتُقَطِّعُوٓا۟ أَرْحَامَكُمْ',
          tr: 'Yüz çevirirseniz yeryüzünde bozgunculuk yapmanız ve akrabalık bağlarınızı koparmanız umulur mu? İşte onlar, Allah’ın lanetlediği, kulaklarını sağır ve gözlerini kör ettiği kimselerdir.',
        } },
        { t: 'hadith', ar: 'مَنْ أَحَبَّ أَنْ يُبْسَطَ لَهُ فِي رِزْقِهِ، وَأَنْ يُنْسَأَ لَهُ فِي أَثَرِهِ، فَلْيَصِلْ رَحِمَهُ', src: SRC('Buxari 5986; əl-Ədəb əl-Müfrəd 56', 'al-Bukhari 5986; al-Adab al-Mufrad 56', 'Бухари 5986; аль-Адаб аль-Муфрад 56', 'البخاري ٥٩٨٦؛ الأدب المفرد ٥٦', 'Buhârî 5986; el-Edebü’l-Müfred 56'), grade: AGREED, text: {
          az: 'Ənəs rəvayət edir ki, Allahın Elçisi ﷺ dedi: «Kim ruzisinin genişlənməsini və ömrünün uzanmasını istəyirsə, qohumluq əlaqəsini saxlasın».',
          en: 'Anas reported that the Messenger of Allah ﷺ said: “Whoever would like his provision to be expanded and his life to be extended, let him keep ties of kinship.”',
          ru: 'Анас передал, что Посланник Аллаха ﷺ сказал: «Кто хочет, чтобы его удел был расширен, а срок жизни продлён, пусть поддерживает родственные связи».',
          ar: 'عن أنس أن رسول الله ﷺ قال: «من أحب أن يبسط له في رزقه، وأن ينسأ له في أثره، فليصل رحمه».',
          tr: 'Enes’in rivayetine göre Allah’ın Resûlü ﷺ şöyle buyurdu: “Kim rızkının genişlemesini ve ömrünün uzamasını isterse akrabalık bağını gözetsin.”',
        } },
        { t: 'hadith', ar: 'الرَّحِمُ مُعَلَّقَةٌ بِالْعَرْشِ تَقُولُ: مَنْ وَصَلَنِي وَصَلَهُ اللَّهُ، وَمَنْ قَطَعَنِي قَطَعَهُ اللَّهُ', src: SRC('Müslim 2555', 'Muslim 2555', 'Муслим 2555', 'مسلم ٢٥٥٥', 'Müslim 2555'), grade: AGREED, text: {
          az: 'Aişə rəvayət edir ki, Allahın Elçisi ﷺ dedi: «Qohumluq Ərşdən asılıb deyir: “Məni birləşdirəni Allah (Öz rəhmətinə) birləşdirsin, məni kəsəni Allah kəssin”».',
          en: '‘A’ishah reported that the Messenger of Allah ﷺ said: “Kinship is suspended from the Throne, saying: ‘Whoever keeps me, Allah will keep him; whoever cuts me off, Allah will cut him off.’”',
          ru: 'Аиша передала, что Посланник Аллаха ﷺ сказал: «Родство подвешено к Трону и говорит: “Кто поддерживает меня, того Аллах приблизит, а кто разрывает меня, от того Аллах отдалится”».',
          ar: 'عن عائشة قالت: قال رسول الله ﷺ: «الرحم معلقة بالعرش تقول: من وصلني وصله الله، ومن قطعني قطعه الله».',
          tr: 'Âişe’nin rivayetine göre Allah’ın Resûlü ﷺ şöyle buyurdu: “Akrabalık Arş’a asılıdır ve şöyle der: Beni gözeteni Allah da gözetsin, beni koparanı Allah da koparsın.”',
        } },
        { t: 'hadith', ar: 'لَيْسَ الْوَاصِلُ بِالْمُكَافِئِ، وَلَكِنَّ الْوَاصِلَ الَّذِي إِذَا قُطِعَتْ رَحِمُهُ وَصَلَهَا', src: SRC('Buxari 5991; əl-Ədəb əl-Müfrəd 68', 'al-Bukhari 5991; al-Adab al-Mufrad 68', 'Бухари 5991; аль-Адаб аль-Муфрад 68', 'البخاري ٥٩٩١؛ الأدب المفرد ٦٨', 'Buhârî 5991; el-Edebü’l-Müfred 68'), grade: AGREED, text: {
          az: '«Qohumluğu saxlayan, (yaxşılığa) qarşılıq verən deyil; əsl saxlayan odur ki, qohumluğu kəsiləndə onu birləşdirər».',
          en: '“The one who keeps ties is not the one who merely reciprocates; rather, the one who keeps ties is he who, when his kinship is cut, restores it.”',
          ru: '«Поддерживает родство не тот, кто лишь отвечает тем же; поддерживает его тот, кто восстанавливает связь, когда её разрывают».',
          ar: '«ليس الواصل بالمكافئ، ولكن الواصل الذي إذا قطعت رحمه وصلها».',
          tr: '“Akrabalık bağını gözeten, (iyiliğe) karşılık veren değildir; asıl gözeten, akrabalığı koparıldığında onu birleştirendir.”',
        } },
        { t: 'hadith', ar: 'لاَ يَدْخُلُ الْجَنَّةَ قَاطِعٌ', src: SRC('Buxari 5984; əl-Ədəb əl-Müfrəd 64', 'al-Bukhari 5984; al-Adab al-Mufrad 64', 'Бухари 5984; аль-Адаб аль-Муфрад 64', 'البخاري ٥٩٨٤؛ الأدب المفرد ٦٤', 'Buhârî 5984; el-Edebü’l-Müfred 64'), grade: AGREED, text: {
          az: 'Cübeyr ibn Mutim rəvayət edir ki, Peyğəmbər ﷺ dedi: «(Qohumluğu) kəsən Cənnətə girməz».',
          en: 'Jubayr ibn Mut‘im reported that the Prophet ﷺ said: “The one who severs (kinship) will not enter Paradise.”',
          ru: 'Джубайр ибн Мутым передал, что Пророк ﷺ сказал: «Не войдёт в Рай разрывающий (родственные связи)».',
          ar: 'عن جبير بن مطعم أنه سمع النبي ﷺ يقول: «لا يدخل الجنة قاطع».',
          tr: 'Cübeyr b. Mut‘ım’ın rivayetine göre Peygamber ﷺ şöyle buyurdu: “(Akrabalığı) koparan cennete giremez.”',
        } },
        { t: 'list', items: [
          { az: 'Ziyarət etmək, zəng vurmaq, xəstəni yoluxmaq, sevinc və kədərdə yanında olmaq.', en: 'Visiting, calling, visiting the sick and being present in joy and grief.', ru: 'Навещать, звонить, проведывать больных, быть рядом в радости и горе.', ar: 'الزيارة والاتصال وعيادة المريض والحضور في الأفراح والأحزان.', tr: 'Ziyaret etmek, aramak, hastayı ziyaret etmek, sevinçte ve kederde yanında olmak.' },
          { az: 'Ehtiyacı olan qohuma maddi kömək etmək — bu, həm sədəqə, həm də qohumluq əlaqəsidir.', en: 'Helping a relative in need financially — this is both charity and keeping ties.', ru: 'Помогать нуждающемуся родственнику деньгами — это и милостыня, и поддержание родства.', ar: 'الإنفاق على القريب المحتاج، فهو صدقة وصلة.', tr: 'İhtiyacı olan akrabaya maddi yardım etmek — bu hem sadaka hem de sıla-i rahimdir.' },
          { az: 'Onları dinə yaxşılıqla dəvət etmək və pislikdən yumşaqlıqla çəkindirmək.', en: 'Calling them to the religion with kindness and gently warning them against wrongdoing.', ru: 'Призывать их к религии по-доброму и мягко удерживать от дурного.', ar: 'دعوتهم إلى الدين بالحسنى، ونهيهم عن المنكر برفق.', tr: 'Onları dine güzellikle davet etmek ve kötülükten yumuşaklıkla sakındırmak.' },
          { az: 'Yaxından-uzağa: «sonra yaxın olana, sonra ondan sonrakı yaxına» (əl-Ədəb əl-Müfrəd 3).', en: 'From nearest to more distant: “then the nearest and then the next nearest” (al-Adab al-Mufrad 3).', ru: 'От ближних к дальним: «затем к ближайшему, а затем к следующему по близости» (аль-Адаб аль-Муфрад 3).', ar: 'الأقرب فالأقرب: «ثم الأقرب فالأقرب» (الأدب المفرد ٣).', tr: 'Yakından uzağa: “sonra en yakınına, sonra ondan sonraki yakınına” (el-Edebü’l-Müfred 3).' },
        ] },
      ],
    },
    {
      id: 'neighbour',
      title: { az: 'Qonşu haqqı', en: 'The rights of the neighbour', ru: 'Права соседа', ar: 'حق الجار', tr: 'Komşu hakkı' },
      blocks: [
        { t: 'ayah', ar: 'وَٱعْبُدُوا۟ ٱللَّهَ وَلَا تُشْرِكُوا۟ بِهِۦ شَيْـًٔا ۖ وَبِٱلْوَٰلِدَيْنِ إِحْسَـٰنًا وَبِذِى ٱلْقُرْبَىٰ وَٱلْيَتَـٰمَىٰ وَٱلْمَسَـٰكِينِ وَٱلْجَارِ ذِى ٱلْقُرْبَىٰ وَٱلْجَارِ ٱلْجُنُبِ وَٱلصَّاحِبِ بِٱلْجَنۢبِ وَٱبْنِ ٱلسَّبِيلِ وَمَا مَلَكَتْ أَيْمَـٰنُكُمْ ۗ إِنَّ ٱللَّهَ لَا يُحِبُّ مَن كَانَ مُخْتَالًا فَخُورًا', ref: '4:36', text: {
          az: 'Allaha ibadət edin və Ona heç nəyi şərik qoşmayın. Valideynə, qohumlara, yetimlərə, yoxsullara, yaxın qonşuya, uzaq qonşuya, yanınızdakı yoldaşa, yolda qalmışa və əlinizin altında olanlara yaxşılıq edin. Şübhəsiz, Allah təkəbbürlü və lovğa olanı sevmir.',
          en: 'Worship Allah and associate nothing with Him, and be good to parents, relatives, orphans, the needy, the near neighbour, the distant neighbour, the companion at your side, the traveller, and those your right hands possess. Indeed, Allah does not love the arrogant and boastful.',
          ru: 'Поклоняйтесь Аллаху и не приобщайте к Нему ничего; делайте добро родителям, родственникам, сиротам, беднякам, соседу из числа родственников и соседу, не являющемуся родственником, спутнику рядом, путнику и тем, кем овладели ваши десницы. Воистину, Аллах не любит гордецов и бахвалов.',
          ar: 'وَٱعْبُدُوا۟ ٱللَّهَ وَلَا تُشْرِكُوا۟ بِهِۦ شَيْـًٔا ۖ وَبِٱلْوَٰلِدَيْنِ إِحْسَـٰنًا وَبِذِى ٱلْقُرْبَىٰ ... وَٱلْجَارِ ذِى ٱلْقُرْبَىٰ وَٱلْجَارِ ٱلْجُنُبِ',
          tr: 'Allah’a kulluk edin ve O’na hiçbir şeyi ortak koşmayın. Anne-babaya, akrabaya, yetimlere, yoksullara, yakın komşuya, uzak komşuya, yanınızdaki arkadaşa, yolda kalmışa ve elinizin altındakilere iyilik edin. Şüphesiz Allah kibirli ve övüngen olanı sevmez.',
        } },
        { t: 'hadith', ar: 'مَا زَالَ جِبْرِيلُ يُوصِينِي بِالْجَارِ حَتَّى ظَنَنْتُ أَنَّهُ سَيُوَرِّثُهُ', src: SRC('Buxari 6015; əl-Ədəb əl-Müfrəd 101', 'al-Bukhari 6015; al-Adab al-Mufrad 101', 'Бухари 6015; аль-Адаб аль-Муфрад 101', 'البخاري ٦٠١٥؛ الأدب المفرد ١٠١', 'Buhârî 6015; el-Edebü’l-Müfred 101'), grade: AGREED, text: {
          az: '«Cəbrayıl mənə qonşu barədə o qədər tövsiyə etdi ki, onu (qonşunu) varis edəcəyini zənn etdim».',
          en: '“Jibril kept advising me about the neighbour until I thought he would make him an heir.”',
          ru: '«Джибриль столько заповедовал мне соседа, что я подумал, что он сделает его наследником».',
          ar: '«ما زال جبريل يوصيني بالجار حتى ظننت أنه سيورثه».',
          tr: '“Cebrâil bana komşu hakkında o kadar tavsiyede bulundu ki, onu (komşuyu) mirasçı kılacağını sandım.”',
        } },
        { t: 'hadith', ar: 'لاَ يَدْخُلُ الْجَنَّةَ مَنْ لاَ يَأْمَنُ جَارُهُ بَوَائِقَهُ', src: SRC('əl-Ədəb əl-Müfrəd 121; Müslim 46', 'al-Adab al-Mufrad 121; Muslim 46', 'аль-Адаб аль-Муфрад 121; Муслим 46', 'الأدب المفرد ١٢١؛ مسلم ٤٦', 'el-Edebü’l-Müfred 121; Müslim 46'), grade: AGREED, text: {
          az: '«Qonşusu onun şərrindən əmin olmayan kəs Cənnətə girməz».',
          en: '“He will not enter Paradise whose neighbour is not safe from his harm.”',
          ru: '«Не войдёт в Рай тот, чей сосед не защищён от его зла».',
          ar: '«لا يدخل الجنة من لا يأمن جاره بوائقه».',
          tr: '“Komşusu kötülüklerinden emin olmayan kimse cennete giremez.”',
        } },
        { t: 'hadith', ar: 'لَيْسَ الْمُؤْمِنُ الَّذِي يَشْبَعُ وَجَارُهُ جَائِعٌ', src: SRC('əl-Ədəb əl-Müfrəd 112', 'al-Adab al-Mufrad 112', 'аль-Адаб аль-Муфрад 112', 'الأدب المفرد ١١٢', 'el-Edebü’l-Müfred 112'), grade: SAHIH_ALB, text: {
          az: 'İbn Abbas rəvayət edir ki, Peyğəmbər ﷺ dedi: «Qonşusu ac ikən özü tox yatan mömin deyil».',
          en: 'Ibn ‘Abbas reported that the Prophet ﷺ said: “He is not a believer who eats his fill while his neighbour is hungry.”',
          ru: 'Ибн Аббас передал, что Пророк ﷺ сказал: «Не является верующим тот, кто сыт, когда его сосед голоден».',
          ar: 'عن ابن عباس قال: سمعت النبي ﷺ يقول: «ليس المؤمن الذي يشبع وجاره جائع».',
          tr: 'İbn Abbâs’ın rivayetine göre Peygamber ﷺ şöyle buyurdu: “Komşusu açken tok yatan mümin değildir.”',
        } },
        { t: 'hadith', ar: 'يَا أَبَا ذَرٍّ، إِذَا طَبَخْتَ مَرَقَةً فَأَكْثِرْ مَاءَهَا وَتَعَاهَدْ جِيرَانَكَ', src: SRC('Müslim 2625; əl-Ədəb əl-Müfrəd 114', 'Muslim 2625; al-Adab al-Mufrad 114', 'Муслим 2625; аль-Адаб аль-Муфрад 114', 'مسلم ٢٦٢٥؛ الأدب المفرد ١١٤', 'Müslim 2625; el-Edebü’l-Müfred 114'), grade: AGREED, text: {
          az: '«Ey Əbu Zərr, şorba bişirəndə suyunu çox et və qonşularını da yada sal».',
          en: '“O Abu Dharr, when you cook a stew, add more water to it and look after your neighbours.”',
          ru: '«О Абу Зарр, когда варишь похлёбку, добавь в неё больше воды и не забудь о соседях».',
          ar: '«يا أبا ذر، إذا طبخت مرقة فأكثر ماءها وتعاهد جيرانك».',
          tr: '“Ey Ebû Zer, çorba pişirdiğinde suyunu çok koy ve komşularını gözet.”',
        } },
        { t: 'hadith', ar: 'قِيلَ لِلنَّبِيِّ ﷺ: يَا رَسُولَ اللهِ، إِنَّ فُلاَنَةً تَقُومُ اللَّيْلَ وَتَصُومُ النَّهَارَ، وَتَفْعَلُ، وَتَصَّدَّقُ، وَتُؤْذِي جِيرَانَهَا بِلِسَانِهَا؟ فَقَالَ: لاَ خَيْرَ فِيهَا، هِيَ مِنْ أَهْلِ النَّارِ. قَالُوا: وَفُلاَنَةٌ تُصَلِّي الْمَكْتُوبَةَ، وَتَصَّدَّقُ بِأَثْوَارٍ، وَلاَ تُؤْذِي أَحَدًا؟ فَقَالَ: هِيَ مِنْ أَهْلِ الْجَنَّةِ', src: SRC('əl-Ədəb əl-Müfrəd 119', 'al-Adab al-Mufrad 119', 'аль-Адаб аль-Муфрад 119', 'الأدب المفرد ١١٩', 'el-Edebü’l-Müfred 119'), grade: SAHIH_ALB, text: {
          az: 'Peyğəmbərə ﷺ dedilər: «Filan qadın gecələr namaz qılır, gündüzlər oruc tutur, sədəqə verir, amma dili ilə qonşularına əziyyət verir». Buyurdu: «Onda xeyir yoxdur, o, Cəhənnəm əhlindəndir». Dedilər: «Filan qadın isə yalnız fərz namazlarını qılır, bir az kəsmik sədəqə verir və heç kəsə əziyyət vermir». Buyurdu: «O, Cənnət əhlindəndir».',
          en: 'It was said to the Prophet ﷺ: “A certain woman prays at night, fasts by day and gives charity, but she harms her neighbours with her tongue.” He said: “There is no good in her; she is among the people of the Fire.” They said: “And another prays only the obligatory prayers, gives a few pieces of dried curd in charity and harms no one.” He said: “She is among the people of Paradise.”',
          ru: 'Пророку ﷺ сказали: «Такая-то женщина молится ночью, постится днём и раздаёт милостыню, но обижает соседей своим языком». Он сказал: «Нет в ней блага, она из обитателей Огня». Сказали: «А такая-то совершает лишь обязательные намазы, подаёт немного сушёного творога и никого не обижает». Он сказал: «Она из обитателей Рая».',
          ar: 'قيل للنبي ﷺ: يا رسول الله، إن فلانة تقوم الليل وتصوم النهار وتفعل وتصدق، وتؤذي جيرانها بلسانها؟ فقال: «لا خير فيها، هي من أهل النار»، قالوا: وفلانة تصلي المكتوبة، وتصدق بأثوار، ولا تؤذي أحدًا؟ فقال: «هي من أهل الجنة».',
          tr: 'Peygamber’e ﷺ “Falan kadın geceleri namaz kılıyor, gündüzleri oruç tutuyor, sadaka veriyor, ama diliyle komşularına eziyet ediyor” denildi. “Onda hayır yoktur, o cehennem ehlindendir” buyurdu. “Falan kadın ise yalnızca farz namazları kılıyor, biraz kurut sadaka veriyor ve kimseye eziyet etmiyor” dediler. “O cennet ehlindendir” buyurdu.',
        } },
        { t: 'table',
          head: [
            { az: 'Qonşuya qarşı', en: 'Towards the neighbour', ru: 'По отношению к соседу', ar: 'مع الجار', tr: 'Komşuya karşı' },
            { az: 'Dəlil', en: 'Evidence', ru: 'Довод', ar: 'الدليل', tr: 'Delil' },
          ],
          rows: [
            [{ az: 'Əziyyət verməmək (səs-küy, zibil, söz)', en: 'Do not harm him (noise, rubbish, words)', ru: 'Не причинять вреда (шум, мусор, слова)', ar: 'كف الأذى (الضجيج والقمامة والكلام)', tr: 'Eziyet etmemek (gürültü, çöp, söz)' }, { az: 'Buxari 6018; əl-Ədəb əl-Müfrəd 121', en: 'al-Bukhari 6018; al-Adab al-Mufrad 121', ru: 'Бухари 6018; аль-Адаб аль-Муфрад 121', ar: 'البخاري ٦٠١٨؛ الأدب المفرد ١٢١', tr: 'Buhârî 6018; el-Edebü’l-Müfred 121' }],
            [{ az: 'Yeməkdən pay vermək', en: 'Share food with him', ru: 'Делиться едой', ar: 'إهداء الطعام', tr: 'Yemekten pay vermek' }, { az: 'Müslim 2625', en: 'Muslim 2625', ru: 'Муслим 2625', ar: 'مسلم ٢٦٢٥', tr: 'Müslim 2625' }],
            [{ az: 'Qapısı ən yaxın olandan başlamaq', en: 'Begin with the one whose door is nearest', ru: 'Начинать с того, чья дверь ближе', ar: 'البدء بأقربهم بابًا', tr: 'Kapısı en yakın olandan başlamak' }, { az: 'Buxari 6020; əl-Ədəb əl-Müfrəd 107', en: 'al-Bukhari 6020; al-Adab al-Mufrad 107', ru: 'Бухари 6020; аль-Адаб аль-Муфрад 107', ar: 'البخاري ٦٠٢٠؛ الأدب المفرد ١٠٧', tr: 'Buhârî 6020; el-Edebü’l-Müfred 107' }],
            [{ az: 'Kiçik hədiyyəni də xor görməmək', en: 'Do not belittle even a small gift', ru: 'Не пренебрегать даже малым подарком', ar: 'ألا تحقر جارة لجارتها ولو فرسن شاة', tr: 'Küçük hediyeyi de küçümsememek' }, { az: 'Buxari 6017; əl-Ədəb əl-Müfrəd 123', en: 'al-Bukhari 6017; al-Adab al-Mufrad 123', ru: 'Бухари 6017; аль-Адаб аль-Муфрад 123', ar: 'البخاري ٦٠١٧؛ الأدب المفرد ١٢٣', tr: 'Buhârî 6017; el-Edebü’l-Müfred 123' }],
            [{ az: 'Qonşunun ən yaxşısı olmaq', en: 'Be the best of neighbours', ru: 'Быть лучшим из соседей', ar: 'أن تكون خير الجيران', tr: 'Komşuların en hayırlısı olmak' }, { az: 'Tirmizi 1944 (Albani: səhih); əl-Ədəb əl-Müfrəd 115', en: 'at-Tirmidhi 1944 (al-Albani: sahih); al-Adab al-Mufrad 115', ru: 'Тирмизи 1944 (аль-Албани: достоверный); аль-Адаб аль-Муфрад 115', ar: 'الترمذي ١٩٤٤ (صححه الألباني)؛ الأدب المفرد ١١٥', tr: 'Tirmizî 1944 (Elbânî: sahih); el-Edebü’l-Müfred 115' }],
          ],
        },
        { t: 'note', kind: 'info', text: {
          az: 'Qonşu haqqı qeyri-müsəlman qonşuya da aiddir. Abdullah ibn Amr qoyun kəsdirəndə «Əvvəl yəhudi qonşumuzdan başla» demiş və Peyğəmbərin ﷺ qonşu barədə tövsiyəsini xatırlatmışdı (əl-Ədəb əl-Müfrəd 128, səhih).',
          en: 'The neighbour’s right includes a non-Muslim neighbour. When a sheep was slaughtered for ‘Abdullah ibn ‘Amr, he said, “Begin with our Jewish neighbour,” recalling the Prophet’s ﷺ counsel about neighbours (al-Adab al-Mufrad 128, sahih).',
          ru: 'Право соседа распространяется и на соседа-немусульманина. Когда для Абдуллаха ибн Амра зарезали овцу, он сказал: «Начни с нашего соседа-иудея», напомнив заповедь Пророка ﷺ о соседе (аль-Адаб аль-Муфрад 128, достоверный).',
          ar: 'حق الجار يشمل الجار غير المسلم؛ فقد ذبحت لعبد الله بن عمرو شاة فقال: «ابدأ بجارنا اليهودي»، وذكر وصية النبي ﷺ بالجار (الأدب المفرد ١٢٨، صحيح).',
          tr: 'Komşu hakkı gayrimüslim komşuyu da kapsar. Abdullah b. Amr için koyun kesildiğinde “Önce Yahudi komşumuzdan başla” demiş ve Peygamber’in ﷺ komşu hakkındaki tavsiyesini hatırlatmıştı (el-Edebü’l-Müfred 128, sahih).',
        } },
      ],
    },
    {
      id: 'faq',
      title: { az: 'Tez-tez verilən suallar', en: 'Common questions', ru: 'Частые вопросы', ar: 'أسئلة شائعة', tr: 'Sık sorulan sorular' },
      blocks: [
        { t: 'qa', items: [
          {
            q: { az: 'Valideynim müsəlman deyil. Onlara yaxşılıq etməliyəmmi?', en: 'My parents are not Muslim. Must I still be good to them?', ru: 'Мои родители не мусульмане. Должен ли я делать им добро?', ar: 'والداي غير مسلمين، فهل أبرهما؟', tr: 'Anne-babam Müslüman değil. Onlara iyilik etmeli miyim?' },
            a: { az: 'Bəli. Allah buyurur: «Dünyada onlarla yaxşı rəftar et» (31:15), Peyğəmbər ﷺ də Əsmaya müşrik anası ilə əlaqə saxlamağı əmr etdi (Buxari 2620). Yalnız şirk və günahda onlara itaət edilmir; onları hikmətlə İslama dəvət etmək isə ən böyük yaxşılıqdır.', en: 'Yes. Allah says: “Keep company with them in this world in kindness” (31:15), and the Prophet ﷺ told Asma’ to keep ties with her idolatrous mother (al-Bukhari 2620). They are only not obeyed in shirk and sin; and inviting them to Islam with wisdom is the greatest kindness.', ru: 'Да. Аллах говорит: «В этом мире обходись с ними по-доброму» (31:15), и Пророк ﷺ велел Асме поддерживать связь с матерью-многобожницей (Бухари 2620). Им не подчиняются лишь в многобожии и грехе, а мудрый призыв их к исламу — величайшее добро.', ar: 'نعم؛ قال تعالى: ﴿وَصَاحِبْهُمَا فِى ٱلدُّنْيَا مَعْرُوفًا﴾، وأمر النبي ﷺ أسماء أن تصل أمها المشركة (البخاري ٢٦٢٠). وإنما لا يطاعان في الشرك والمعصية، ودعوتهما إلى الإسلام بالحكمة أعظم البر.', tr: 'Evet. Allah “Dünyada onlarla iyi geçin” buyurur (31:15); Peygamber ﷺ de Esmâ’ya müşrik annesiyle bağını sürdürmesini emretmiştir (Buhârî 2620). Yalnızca şirkte ve günahta onlara itaat edilmez; onları hikmetle İslam’a davet etmek ise en büyük iyiliktir.' },
          },
          {
            q: { az: 'Qohumlarım mənə pislik edir. Yenə də əlaqə saxlamalıyammı?', en: 'My relatives treat me badly. Should I still keep ties?', ru: 'Родственники плохо ко мне относятся. Нужно ли всё равно поддерживать связь?', ar: 'أقاربي يسيئون إلي، فهل أصلهم؟', tr: 'Akrabalarım bana kötülük ediyor. Yine de bağı sürdürmeli miyim?' },
            a: { az: 'Bəli, bu, əlaqənin ən fəzilətli növüdür. Bir nəfər eyni şeyi deyəndə Peyğəmbər ﷺ buyurdu: «Əgər dediyin kimidirsə, sən onların ağzına isti kül tökürsən və bu halda olduqca Allahdan sənə onlara qarşı köməkçi olacaq» (Müslim 2558; əl-Ədəb əl-Müfrəd 52). Əlaqə saxlamaq, onların zərərinə özünü açıq qoymaq demək deyil: ölçülü, nəzakətli əlaqə də əlaqədir.', en: 'Yes, and this is the most virtuous kind of keeping ties. When a man said the same, the Prophet ﷺ said: “If you are as you say, it is as if you are feeding them hot ashes, and you will continue to have a supporter from Allah against them as long as you remain so” (Muslim 2558; al-Adab al-Mufrad 52). Keeping ties does not mean exposing yourself to harm: measured, courteous contact is still keeping ties.', ru: 'Да, и это самый достойный вид поддержания связи. Когда один человек сказал то же самое, Пророк ﷺ ответил: «Если всё так, как ты говоришь, то ты словно кормишь их горячим пеплом, и пока ты так поступаешь, с тобой будет помощник от Аллаха против них» (Муслим 2558; аль-Адаб аль-Муфрад 52). Поддерживать связь не значит подставлять себя под вред: сдержанное, вежливое общение — тоже связь.', ar: 'نعم، وهذا أفضل الصلة؛ قال رجل مثل ذلك فقال ﷺ: «لئن كنت كما قلت فكأنما تسفهم المل، ولا يزال معك من الله ظهير عليهم ما دمت على ذلك» (مسلم ٢٥٥٨؛ الأدب المفرد ٥٢). وليست الصلة تعريض النفس للأذى؛ فالصلة المعتدلة المؤدبة صلة.', tr: 'Evet, bu, sıla-i rahmin en faziletli şeklidir. Bir adam aynı şeyi söylediğinde Peygamber ﷺ şöyle buyurdu: “Eğer dediğin gibiyse, sen onların ağzına sıcak kül döküyorsun; bu hâl üzere oldukça Allah’tan sana onlara karşı bir yardımcı olacaktır” (Müslim 2558; el-Edebü’l-Müfred 52). Bağı sürdürmek kendini zarara açık bırakmak demek değildir: ölçülü, nazik bir ilişki de sıla-i rahimdir.' },
          },
          {
            q: { az: 'Qonşum mənə əziyyət verir. Nə edim?', en: 'My neighbour harms me. What should I do?', ru: 'Сосед причиняет мне вред. Что делать?', ar: 'جاري يؤذيني، فماذا أفعل؟', tr: 'Komşum bana eziyet ediyor. Ne yapayım?' },
            a: { az: 'Səbr et, yaxşılıqla qarşılıq ver və nəsihət et. Bir nəfər qonşusundan şikayət edəndə Peyğəmbər ﷺ ona əşyalarını yola çıxarmağı əmr etdi; insanlar səbəbini soruşub o qonşunu qınadılar və o, əziyyətdən əl çəkdi (əl-Ədəb əl-Müfrəd 124, Albani: həsən səhih). Haqqın tələb etmək üçün qanuni yollara müraciət etmək də caizdir.', en: 'Be patient, respond with kindness and advise him. When a man complained about his neighbour, the Prophet ﷺ told him to put his belongings out on the road; people asked why and censured that neighbour, and he stopped the harm (al-Adab al-Mufrad 124, al-Albani: hasan sahih). It is also permissible to use lawful means to claim your right.', ru: 'Терпи, отвечай добром и наставляй. Когда один человек пожаловался на соседа, Пророк ﷺ велел ему вынести вещи на дорогу; люди спрашивали о причине и порицали соседа, и тот прекратил вредить (аль-Адаб аль-Муфрад 124, аль-Албани: хороший достоверный). Допустимо также обращаться к законным средствам, чтобы добиться своего права.', ar: 'اصبر وقابل الإساءة بالإحسان وانصح، وقد شكا رجل جاره فأمره النبي ﷺ أن يخرج متاعه إلى الطريق، فجعل الناس يسألونه ويذمون الجار حتى كف أذاه (الأدب المفرد ١٢٤، حسن صحيح عند الألباني). ويجوز سلوك الطرق المشروعة لأخذ الحق.', tr: 'Sabret, iyilikle karşılık ver ve nasihat et. Bir adam komşusundan şikâyet edince Peygamber ﷺ ona eşyalarını yola çıkarmasını emretti; insanlar sebebini sorup o komşuyu kınadılar ve o da eziyetten vazgeçti (el-Edebü’l-Müfred 124, Elbânî: hasen sahih). Hakkını almak için meşru yollara başvurmak da caizdir.' },
          },
        ] },
      ],
    },
  ],
  sources: [
    { label: 'al-Bukhari, al-Adab al-Mufrad — with al-Albani’s grading', url: 'https://www.prophetmuhammad.com/adab' },
    { label: 'Sahih al-Bukhari; Sahih Muslim; Sunan at-Tirmidhi (fawazahmed0 hadith-api)', url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions.json' },
    { label: 'Quran.com — Uthmani text', url: 'https://quran.com' },
  ],
}
