// ═══════════════════════════════════════════════════════
// QURAN SƏHİFƏSİ (/quran) — siyahının altındakı bələdçi: Quran nədir,
// tarixi, oxuma ədəbi, fəziləti, oxuyucunu necə işlətmək.
//
// YOXLANILIB (2026-11-01):
// • Ayələr — api.quran.com/api/v4/quran/verses/uthmani: 15:9, 16:98,
//   26:192–195, 38:29, 73:4, 7:204.
// • Hədislər — fawazahmed0/hadith-api (ara-*; Müslim — Fuad Əbdülbaqi
//   nömrəsi, API-də "arabicnumber"): Buxari 3 (ilk vəhy, Hira), 3851 (Məkkədə
//   13 il, Mədinədə 10 il), 4986 (Əbu Bəkrin dövründə toplanma), 4987 (Osmanın
//   nüsxələri), 5027, 7527; Müslim 798, 804; Tirmizi 2910 (Tirmizi: «həsən
//   səhih qərib»; əl-Albani: səhih).
// • Rəqəmlər: 114 surə, 6236 ayə (Kufə sayı — Həfs rəvayəti), 86 Məkki / 28
//   Mədəni (Tanzil metadatası, api.alquran.cloud/v1/surah ilə yoxlanıb),
//   30 cüz, 604 səhifə (Mədinə mushafı — src/data/mushafIndex.js).
// • TƏKRARLANMIR: Quranı əzbərləmə üsulu və onun dəlilləri — /hifz; təcvid
//   rəngləri — /mushaf; sözlərin kökü — /quran-roots. Burada yalnız keçid.
// ═══════════════════════════════════════════════════════

import { localizeSource } from '../../utils/sourceNames.js'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const S = (s) => Object.fromEntries(LANGS.map(l => [l, localizeSource(s, l)]))

export const QURAN_GUIDE = {
  nav: { az: 'Quran haqqında', en: 'About the Quran', ru: 'О Коране', ar: 'عن القرآن', tr: 'Kur’an hakkında' },

  // ── Quran nədir ──
  about: {
    eyebrow: { az: 'Giriş', en: 'Introduction', ru: 'Введение', ar: 'مدخل', tr: 'Giriş' },
    title: { az: 'Quran nədir?', en: 'What is the Quran?', ru: 'Что такое Коран?', ar: 'ما القرآن؟', tr: 'Kur’an nedir?' },
    text: {
      az: 'Quran — Allahın kəlamıdır. Uca Allah onu Cəbrail (əleyhissəlam) vasitəsilə Peyğəmbərimiz Muhəmmədə ﷺ aydın ərəb dilində nazil etmişdir. Quran yaradılmış deyil, onu oxumaq ibadətdir və Allah onu təhrifdən qorumağı Öz üzərinə götürmüşdür.',
      en: 'The Quran is the speech of Allah. Allah sent it down through Jibril (peace be upon him) to our Prophet Muhammad ﷺ in clear Arabic. It is not created, reciting it is an act of worship, and Allah Himself has undertaken to preserve it from alteration.',
      ru: 'Коран — это речь Аллаха. Всевышний Аллах ниспослал его через Джибриля (мир ему) нашему Пророку Мухаммаду ﷺ на ясном арабском языке. Коран не сотворён, его чтение — поклонение, и Аллах Сам взял на Себя его защиту от искажений.',
      ar: 'القرآن كلام الله، نزل به جبريل عليه السلام على نبينا محمد ﷺ بلسان عربي مبين، منزَّل غير مخلوق، يُتعبَّد بتلاوته، وقد تكفّل الله بحفظه من التحريف والتبديل.',
      tr: 'Kur’an, Allah’ın kelamıdır. Yüce Allah onu Cebrail (aleyhisselam) aracılığıyla Peygamberimiz Muhammed’e ﷺ apaçık Arapça olarak indirmiştir. Kur’an yaratılmış değildir, onu okumak ibadettir ve Allah onu tahriften korumayı bizzat üstlenmiştir.',
    },
    quotes: [
      {
        ar: 'وَإِنَّهُۥ لَتَنزِيلُ رَبِّ ٱلْعَـٰلَمِينَ ﴿١٩٢﴾ نَزَلَ بِهِ ٱلرُّوحُ ٱلْأَمِينُ ﴿١٩٣﴾ عَلَىٰ قَلْبِكَ لِتَكُونَ مِنَ ٱلْمُنذِرِينَ ﴿١٩٤﴾ بِلِسَانٍ عَرَبِىٍّ مُّبِينٍ ﴿١٩٥﴾',
        ref: '26:192-195',
        text: {
          az: 'Şübhəsiz ki, o (Quran) aləmlərin Rəbbinin nazil etdiyidir. Onu etibarlı Ruh (Cəbrail) sənin qəlbinə endirdi ki, xəbərdar edənlərdən olasan — aydın ərəb dilində.',
          en: 'And indeed it is the revelation of the Lord of the worlds. The Trustworthy Spirit brought it down upon your heart, that you may be among the warners — in a clear Arabic tongue.',
          ru: 'Воистину, это — ниспослание Господа миров. Сошёл с ним верный Дух на твоё сердце, чтобы ты был одним из предостерегающих, — на ясном арабском языке.',
          tr: 'Şüphesiz o (Kur’an), âlemlerin Rabbinin indirmesidir. Onu güvenilir Ruh (Cebrail), uyarıcılardan olasın diye senin kalbine indirdi — apaçık Arapça bir dille.',
        },
      },
      {
        ar: 'إِنَّا نَحْنُ نَزَّلْنَا ٱلذِّكْرَ وَإِنَّا لَهُۥ لَحَـٰفِظُونَ',
        ref: '15:9',
        text: {
          az: 'Şübhəsiz ki, Zikri (Quranı) Biz nazil etdik və şübhəsiz ki, onu qoruyan da Bizik.',
          en: 'Indeed, it is We who sent down the Reminder, and indeed We will be its guardian.',
          ru: 'Воистину, Мы ниспослали Напоминание, и Мы оберегаем его.',
          tr: 'Şüphesiz Zikr’i (Kur’an’ı) Biz indirdik, onun koruyucusu da elbette Biziz.',
        },
      },
    ],
  },

  // ── Rəqəmlərlə ──
  facts: {
    title: { az: 'Rəqəmlərlə Quran', en: 'The Quran in numbers', ru: 'Коран в цифрах', ar: 'القرآن بالأرقام', tr: 'Rakamlarla Kur’an' },
    items: [
      { value: '114', label: { az: 'surə', en: 'surahs', ru: 'сур', ar: 'سورة', tr: 'sure' } },
      { value: '6236', label: { az: 'ayə', en: 'verses', ru: 'аятов', ar: 'آية', tr: 'ayet' },
        hint: { az: 'Kufə sayına görə (Həfs rəvayəti)', en: 'Kufan count (narration of Hafs)', ru: 'по куфийскому счёту (чтение Хафса)', ar: 'بالعدّ الكوفي (رواية حفص)', tr: 'Kûfe sayımına göre (Hafs rivayeti)' } },
      { value: '30', label: { az: 'cüz', en: 'juz (parts)', ru: 'джузов', ar: 'جزءًا', tr: 'cüz' },
        hint: { az: 'hər cüz təxminən 20 səhifə', en: 'about 20 pages each', ru: 'около 20 страниц каждый', ar: 'نحو ٢٠ صفحة لكل جزء', tr: 'her cüz yaklaşık 20 sayfa' } },
      { value: '604', label: { az: 'səhifə', en: 'pages', ru: 'страницы', ar: 'صفحات', tr: 'sayfa' },
        hint: { az: 'Mədinə mushafında', en: 'in the Madani mushaf', ru: 'в мединском мусхафе', ar: 'في مصحف المدينة', tr: 'Medine mushafında' } },
      { value: '23', label: { az: 'il ərzində nazil olub', en: 'years of revelation', ru: 'года ниспослания', ar: 'سنة من التنزيل', tr: 'yılda indirildi' },
        hint: { az: '13 il Məkkədə, 10 il Mədinədə', en: '13 in Makkah, 10 in Madinah', ru: '13 в Мекке, 10 в Медине', ar: '١٣ بمكة و١٠ بالمدينة', tr: '13 yıl Mekke’de, 10 yıl Medine’de' } },
    ],
    donutTitle: { az: 'Məkki və Mədəni surələr', en: 'Makkan and Madinan surahs', ru: 'Мекканские и мединские суры', ar: 'السور المكية والمدنية', tr: 'Mekkî ve Medenî sureler' },
    donutSub: { az: 'Hicrətdən əvvəl və sonra nazil olanlar', en: 'Revealed before and after the Hijrah', ru: 'Ниспосланные до и после хиджры', ar: 'ما نزل قبل الهجرة وبعدها', tr: 'Hicretten önce ve sonra inenler' },
    donutNote: {
      az: 'Bölgü Tanzil layihəsinin məlumatına görədir; bir neçə surə barədə alimlərin fikri fərqlidir. Rəqəmlər: Buxari 3851.',
      en: 'Classification per the Tanzil project; scholars differ on a few surahs. Years: Bukhari 3851.',
      ru: 'Деление по данным проекта «Танзил»; о нескольких сурах мнения учёных расходятся. Годы: Бухари 3851.',
      ar: 'التصنيف بحسب بيانات مشروع تنزيل، وفي بعض السور خلاف بين العلماء. السنوات: البخاري 3851.',
      tr: 'Ayrım Tanzil projesinin verilerine göredir; birkaç sure hakkında âlimlerin görüşü farklıdır. Yıllar: Buhârî 3851.',
    },
  },

  // ── Tarix ──
  history: {
    eyebrow: { az: 'Tarix', en: 'History', ru: 'История', ar: 'التاريخ', tr: 'Tarih' },
    title: { az: 'Quran necə nazil olub və toplanıb', en: 'How the Quran was revealed and compiled', ru: 'Как Коран ниспосылался и был собран', ar: 'كيف نزل القرآن وجُمع', tr: 'Kur’an nasıl indirildi ve toplandı' },
    lead: { az: 'Beş əsas mərhələ — hər biri səhih rəvayətə əsaslanır.', en: 'Five key stages — each based on an authentic narration.', ru: 'Пять ключевых этапов — каждый основан на достоверном предании.', ar: 'خمس مراحل رئيسة، كلٌّ منها ثابت بالرواية الصحيحة.', tr: 'Beş temel aşama — her biri sahih bir rivayete dayanır.' },
    items: [
      { when: '610',
        title: { az: 'İlk vəhy', en: 'The first revelation', ru: 'Первое откровение', ar: 'أول الوحي', tr: 'İlk vahiy' },
        text: { az: 'Hira mağarasında Ələq surəsinin ilk ayələri — «Oxu! Yaradan Rəbbinin adı ilə…» — nazil oldu. (Buxari 3)', en: 'In the cave of Hira the opening verses of al-‘Alaq — “Read in the name of your Lord who created…” — were revealed. (Bukhari 3)', ru: 'В пещере Хира были ниспосланы первые аяты суры «аль-Аляк»: «Читай во имя твоего Господа, Который сотворил…» (Бухари 3)', ar: 'نزلت في غار حراء أوائل سورة العلق: ﴿ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ﴾. (البخاري 3)', tr: 'Hira mağarasında Alak suresinin ilk ayetleri — “Yaratan Rabbinin adıyla oku…” — indi. (Buhârî 3)' },
        highlight: true },
      { when: '610–622',
        title: { az: 'Məkkə dövrü — 13 il', en: 'The Makkan period — 13 years', ru: 'Мекканский период — 13 лет', ar: 'العهد المكي — ١٣ سنة', tr: 'Mekke dönemi — 13 yıl' },
        text: { az: 'Vəhy hicrətə qədər 13 il Məkkədə hissə-hissə nazil oldu. (Buxari 3851)', en: 'Revelation came down in portions in Makkah for 13 years until the Hijrah. (Bukhari 3851)', ru: 'Откровение ниспосылалось частями в Мекке 13 лет до хиджры. (Бухари 3851)', ar: 'نزل الوحي منجَّمًا بمكة ثلاث عشرة سنة حتى الهجرة. (البخاري 3851)', tr: 'Vahiy hicrete kadar 13 yıl Mekke’de parça parça indi. (Buhârî 3851)' } },
      { when: '622–632',
        title: { az: 'Mədinə dövrü — 10 il', en: 'The Madinan period — 10 years', ru: 'Мединский период — 10 лет', ar: 'العهد المدني — ١٠ سنوات', tr: 'Medine dönemi — 10 yıl' },
        text: { az: 'Hicrətdən sonra vəhy Peyğəmbərin ﷺ vəfatına qədər 10 il Mədinədə davam etdi. (Buxari 3851)', en: 'After the Hijrah, revelation continued in Madinah for 10 years until the Prophet ﷺ passed away. (Bukhari 3851)', ru: 'После хиджры откровение продолжалось в Медине 10 лет, до кончины Пророка ﷺ. (Бухари 3851)', ar: 'وبعد الهجرة استمر الوحي بالمدينة عشر سنين حتى توفي النبي ﷺ. (البخاري 3851)', tr: 'Hicretten sonra vahiy, Peygamber’in ﷺ vefatına kadar 10 yıl Medine’de devam etti. (Buhârî 3851)' } },
      { when: '~633',
        title: { az: 'Əbu Bəkrin dövründə toplanma', en: 'Compiled under Abu Bakr', ru: 'Собрание при Абу Бакре', ar: 'الجمع في عهد أبي بكر', tr: 'Ebû Bekir döneminde toplanması' },
        text: { az: 'Yəmamə döyüşündə çoxlu qari şəhid olandan sonra Əbu Bəkr (r.a.) Zeyd ibn Sabitə Quranı yazılı vərəqlərdən və yaddaşlardan bir yerə toplamağı tapşırdı. (Buxari 4986)', en: 'After many reciters were killed at al-Yamamah, Abu Bakr (may Allah be pleased with him) charged Zayd ibn Thabit with gathering the Quran from written pieces and from memory. (Bukhari 4986)', ru: 'После гибели многих чтецов в битве при Ямаме Абу Бакр (да будет доволен им Аллах) поручил Зайду ибн Сабиту собрать Коран из записей и из памяти людей. (Бухари 4986)', ar: 'لما استحرّ القتل بالقرّاء يوم اليمامة أمر أبو بكر رضي الله عنه زيد بن ثابت بجمع القرآن من الرِّقاع وصدور الرجال. (البخاري 4986)', tr: 'Yemâme savaşında pek çok kârî şehit düşünce Ebû Bekir (r.a.), Zeyd b. Sâbit’e Kur’an’ı yazılı sayfalardan ve hafızalardan bir araya toplamasını emretti. (Buhârî 4986)' } },
      { when: '~645',
        title: { az: 'Osmanın nüsxələri', en: 'The copies of Uthman', ru: 'Списки Усмана', ar: 'مصاحف عثمان', tr: 'Osman’ın nüshaları' },
        text: { az: 'Hüzeyfə ibn Yəmanın xəbərdarlığından sonra Osman (r.a.) bu vərəqlərdən nüsxələr köçürtdü və hər bölgəyə bir nüsxə göndərdi. (Buxari 4987)', en: 'After Hudhayfah ibn al-Yaman’s warning, Uthman (may Allah be pleased with him) had copies made from those sheets and sent one to every region. (Bukhari 4987)', ru: 'После предостережения Хузайфы ибн аль-Ямана Усман (да будет доволен им Аллах) велел переписать эти листы и отправил список в каждую область. (Бухари 4987)', ar: 'بعد تنبيه حذيفة بن اليمان أمر عثمان رضي الله عنه بنسخ تلك الصحف، وأرسل إلى كل أفق بمصحف. (البخاري 4987)', tr: 'Huzeyfe b. Yemân’ın uyarısından sonra Osman (r.a.) bu sayfalardan nüshalar çoğalttırdı ve her bölgeye bir nüsha gönderdi. (Buhârî 4987)' } },
    ],
  },

  // ── Oxuma ədəbi ──
  adab: {
    eyebrow: { az: 'Ədəb', en: 'Etiquette', ru: 'Этикет', ar: 'الآداب', tr: 'Edep' },
    title: { az: 'Quran oxumağın ədəbi', en: 'Etiquette of reciting the Quran', ru: 'Этикет чтения Корана', ar: 'آداب تلاوة القرآن', tr: 'Kur’an okumanın edebi' },
    lead: { az: 'Altı qayda — hər birinin dəlili ilə.', en: 'Six guidelines — each with its evidence.', ru: 'Шесть правил — каждое с доводом.', ar: 'ستة آداب، لكلٍّ منها دليله.', tr: 'Altı kural — her birinin delili ile.' },
    items: [
      { icon: 'shield',
        title: { az: 'Şeytandan Allaha sığın', en: 'Seek refuge in Allah', ru: 'Прибегни к защите Аллаха', ar: 'الاستعاذة', tr: 'Şeytandan Allah’a sığın' },
        how: { az: 'Oxumağa «Əuzu billəhi minəş-şeytanir-racim» ilə başla.', en: 'Begin with “a‘udhu billahi min ash-shaytan ir-rajim”.', ru: 'Начни со слов «а‘узу билляхи мина-ш-шайтани-р-раджим».', ar: 'ابدأ بقول: أعوذ بالله من الشيطان الرجيم.', tr: '“Eûzü billâhi mine’ş-şeytâni’r-racîm” diyerek başla.' },
        ar: 'فَإِذَا قَرَأْتَ ٱلْقُرْءَانَ فَٱسْتَعِذْ بِٱللَّهِ مِنَ ٱلشَّيْطَـٰنِ ٱلرَّجِيمِ', ref: '16:98',
        text: { az: 'Quran oxuyacağın zaman qovulmuş şeytandan Allaha sığın.', en: 'When you recite the Quran, seek refuge in Allah from Satan, the expelled.', ru: 'Когда ты читаешь Коран, проси защиты у Аллаха от изгнанного шайтана.', tr: 'Kur’an okuyacağın zaman kovulmuş şeytandan Allah’a sığın.' } },
      { icon: 'clock',
        title: { az: 'Aramla, aydın oxu (tərtil)', en: 'Recite slowly and clearly (tartil)', ru: 'Читай размеренно и ясно (тартиль)', ar: 'الترتيل', tr: 'Ağır ağır, açık oku (tertil)' },
        how: { az: 'Tələsmə: hərfləri tam tələffüz et, ayələrin sonunda dayan.', en: 'Do not rush: pronounce each letter fully and pause at the ends of verses.', ru: 'Не спеши: произноси каждую букву полностью и делай паузы в конце аятов.', ar: 'لا تعجل: أعطِ الحروف حقها وقف عند رؤوس الآي.', tr: 'Acele etme: harfleri tam söyle, ayet sonlarında dur.' },
        ar: 'أَوْ زِدْ عَلَيْهِ وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا', ref: '73:4',
        text: { az: '…Və Quranı tərtil ilə (aramla, aydın) oxu.', en: '…And recite the Quran with measured recitation.', ru: '…И читай Коран размеренным чтением.', tr: '…Ve Kur’an’ı tane tane (tertil ile) oku.' } },
      { icon: 'bulb',
        title: { az: 'Mənası üzərində düşün', en: 'Reflect on its meaning', ru: 'Размышляй над смыслом', ar: 'التدبر', tr: 'Anlamı üzerinde düşün' },
        how: { az: 'Tərcüməni və təfsiri oxu — oxuyucuda hər ayənin altında «Təfsir» düyməsi var.', en: 'Read the translation and the tafsir — every verse in the reader has a “Tafsir” button.', ru: 'Читай перевод и тафсир — у каждого аята в читалке есть кнопка «Тафсир».', ar: 'اقرأ التفسير؛ تحت كل آية في القارئ زر «تفسير».', tr: 'Meali ve tefsiri oku — okuyucuda her ayetin altında “Tefsir” düğmesi var.' },
        ar: 'كِتَـٰبٌ أَنزَلْنَـٰهُ إِلَيْكَ مُبَـٰرَكٌ لِّيَدَّبَّرُوٓا۟ ءَايَـٰتِهِۦ وَلِيَتَذَكَّرَ أُو۟لُوا۟ ٱلْأَلْبَـٰبِ', ref: '38:29',
        text: { az: '(Bu,) ayələri üzərində düşünsünlər və ağıl sahibləri öyüd alsınlar deyə sənə nazil etdiyimiz mübarək bir Kitabdır.', en: 'A blessed Book which We have revealed to you, that they might reflect upon its verses and that those of understanding would be reminded.', ru: 'Это благословенное Писание, которое Мы ниспослали тебе, чтобы они размышляли над его аятами и чтобы обладающие разумом помнили назидание.', tr: 'Bu, ayetlerini düşünsünler ve akıl sahipleri öğüt alsınlar diye sana indirdiğimiz mübarek bir Kitap’tır.' } },
      { icon: 'volume',
        title: { az: 'Səsini gözəlləşdir', en: 'Beautify your voice', ru: 'Читай красивым голосом', ar: 'تحسين الصوت', tr: 'Sesini güzelleştir' },
        how: { az: 'Bacardığın qədər gözəl, təcvidlə oxu; mahnı ahənglərinə bənzətmə.', en: 'Recite as beautifully as you can, with tajweed — not in the style of songs.', ru: 'Читай как можно красивее, с таджвидом, но не на манер песен.', ar: 'حسّن صوتك بالقرآن مع التجويد ما استطعت، دون التشبّه بألحان الغناء.', tr: 'Gücün yettiğince güzel ve tecvitle oku; şarkı makamlarına benzetme.' },
        hadith: true,
        ar: 'لَيْسَ مِنَّا مَنْ لَمْ يَتَغَنَّ بِالْقُرْآنِ', src: S('Buxari 7527'),
        text: { az: 'Quranı gözəl avazla oxumayan bizdən deyil.', en: 'He is not of us who does not recite the Quran in a pleasant tone.', ru: 'Не из нас тот, кто не читает Коран нараспев.', tr: 'Kur’an’ı güzel sesle okumayan bizden değildir.' } },
      { icon: 'eye',
        title: { az: 'Oxunanda dinlə və sus', en: 'Listen and be silent', ru: 'Слушай и молчи', ar: 'الاستماع والإنصات', tr: 'Okunurken dinle ve sus' },
        how: { az: 'Quran oxunarkən söhbəti dayandır, diqqətlə qulaq as.', en: 'When the Quran is recited, stop talking and listen attentively.', ru: 'Когда читают Коран, прекрати разговор и внимательно слушай.', ar: 'إذا قُرئ القرآن فاترك الحديث وأنصت.', tr: 'Kur’an okunurken konuşmayı bırak, dikkatle dinle.' },
        ar: 'وَإِذَا قُرِئَ ٱلْقُرْءَانُ فَٱسْتَمِعُوا۟ لَهُۥ وَأَنصِتُوا۟ لَعَلَّكُمْ تُرْحَمُونَ', ref: '7:204',
        text: { az: 'Quran oxunduğu zaman ona qulaq asın və susun ki, sizə rəhm olunsun.', en: 'So when the Quran is recited, listen to it and pay attention that you may receive mercy.', ru: 'Когда читается Коран, слушайте его и храните молчание, — быть может, вас помилуют.', tr: 'Kur’an okunduğu zaman onu dinleyin ve susun ki size merhamet edilsin.' } },
      { icon: 'leaf',
        title: { az: 'Çətin gəlsə də davam et', en: 'Keep going, even if it is hard', ru: 'Продолжай, даже если трудно', ar: 'المداومة ولو شقّ عليك', tr: 'Zor gelse de devam et' },
        how: { az: 'Hələ rəvan oxuya bilmirsənsə, ruhdan düşmə — səyinə görə iki savab var.', en: 'If you cannot read fluently yet, do not lose heart — your effort earns a double reward.', ru: 'Если ещё не читаешь бегло, не унывай — за старание двойная награда.', ar: 'إن لم تُجِد القراءة بعدُ فلا تيأس، فلك أجران على مشقتك.', tr: 'Henüz akıcı okuyamıyorsan ümitsizliğe düşme — gayretin için iki sevap var.' },
        hadith: true,
        ar: 'الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ، وَالَّذِي يَقْرَأُ الْقُرْآنَ وَيَتَتَعْتَعُ فِيهِ وَهُوَ عَلَيْهِ شَاقٌّ لَهُ أَجْرَانِ', src: S('Müslim 798'),
        text: { az: 'Quranı mahir oxuyan şərəfli, itaətkar elçi-mələklərlə birlikdədir. Quranı ilişə-ilişə, çətinliklə oxuyanın isə iki savabı var.', en: 'The one who is skilled in the Quran is with the noble, righteous scribes (angels); and the one who recites it haltingly, finding it hard, has two rewards.', ru: 'Искусный в Коране — вместе с благородными и покорными ангелами-писцами, а тот, кто читает Коран с запинками и с трудом, получит двойную награду.', tr: 'Kur’an’ı mahir okuyan, şerefli ve itaatkâr elçi meleklerle beraberdir. Kur’an’ı zorlanarak, kekeleyerek okuyana ise iki sevap vardır.' } },
    ],
  },

  // ── Fəzilət ──
  virtues: {
    eyebrow: { az: 'Fəzilət', en: 'Virtue', ru: 'Достоинство', ar: 'الفضل', tr: 'Fazilet' },
    title: { az: 'Quran oxumağın savabı', en: 'The reward of reciting the Quran', ru: 'Награда за чтение Корана', ar: 'ثواب تلاوة القرآن', tr: 'Kur’an okumanın sevabı' },
    items: [
      { ar: 'مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ، وَالْحَسَنَةُ بِعَشْرِ أَمْثَالِهَا، لَا أَقُولُ الم حَرْفٌ، وَلَكِنْ أَلِفٌ حَرْفٌ وَلَامٌ حَرْفٌ وَمِيمٌ حَرْفٌ',
        src: S('Tirmizi 2910'),
        grade: { az: 'səhih (əl-Albani)', en: 'sahih (al-Albani)', ru: 'достоверный (аль-Албани)', ar: 'صحيح (الألباني)', tr: 'sahih (Elbânî)' },
        text: { az: 'Kim Allahın Kitabından bir hərf oxusa, ona bir həsənə yazılır, həsənə isə on misli iləndir. Mən demirəm ki, «Əlif-Lam-Mim» bir hərfdir; əksinə, «Əlif» bir hərf, «Lam» bir hərf, «Mim» bir hərfdir.', en: 'Whoever recites a letter from the Book of Allah receives a good deed, and a good deed is multiplied ten times. I do not say that “Alif-Lam-Mim” is one letter; rather Alif is a letter, Lam is a letter and Mim is a letter.', ru: 'Кто прочтёт одну букву из Книги Аллаха, тому запишется благое дело, а благое дело — в десятикратном размере. Я не говорю, что «Алиф-Лям-Мим» — одна буква: «Алиф» — буква, «Лям» — буква и «Мим» — буква.', tr: 'Kim Allah’ın Kitabı’ndan bir harf okursa ona bir iyilik yazılır, iyilik ise on katıyladır. “Elif-Lâm-Mîm” bir harftir demiyorum; bilakis Elif bir harf, Lâm bir harf, Mîm bir harftir.' } },
      { ar: 'اقْرَءُوا الْقُرْآنَ فَإِنَّهُ يَأْتِي يَوْمَ الْقِيَامَةِ شَفِيعًا لِأَصْحَابِهِ',
        src: S('Müslim 804'),
        text: { az: 'Quranı oxuyun, çünki o, Qiyamət günü öz sahiblərinə şəfaətçi olaraq gələcək.', en: 'Recite the Quran, for on the Day of Resurrection it will come as an intercessor for its companions.', ru: 'Читайте Коран, ибо в День воскресения он явится заступником за своих сподвижников.', tr: 'Kur’an okuyun; çünkü o, kıyamet günü kendi sahiplerine şefaatçi olarak gelecektir.' } },
      { ar: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
        src: S('Buxari 5027'),
        text: { az: 'Sizin ən xeyirliniz Quranı öyrənən və öyrədəndir.', en: 'The best of you are those who learn the Quran and teach it.', ru: 'Лучшие из вас — те, кто изучает Коран и обучает ему.', tr: 'Sizin en hayırlınız Kur’an’ı öğrenen ve öğretendir.' } },
    ],
  },

  // ── Oxuyucunu necə işlətmək ──
  howto: {
    eyebrow: { az: 'Bələdçi', en: 'Guide', ru: 'Руководство', ar: 'دليل', tr: 'Rehber' },
    title: { az: 'Oxuyucunu necə işlətmək', en: 'How to use the reader', ru: 'Как пользоваться читалкой', ar: 'كيف تستخدم القارئ', tr: 'Okuyucu nasıl kullanılır' },
    steps: [
      { title: { az: 'Surəni seç', en: 'Choose a surah', ru: 'Выберите суру', ar: 'اختر السورة', tr: 'Sureyi seç' },
        text: { az: 'Siyahıdan, adla axtarışla və ya Məkki/Mədəni və cüz süzgəci ilə. Ayə axtarışı tərcümədə söz tapır.', en: 'From the list, by name, or with the Makkan/Madinan and juz filters. Verse search finds words in the translation.', ru: 'Из списка, поиском по названию или фильтрами «мекканские/мединские» и «джуз». Поиск по аятам ищет слова в переводе.', ar: 'من القائمة أو بالبحث بالاسم أو بتصفية المكي والمدني والأجزاء. وبحث الآيات يبحث في نص التفسير.', tr: 'Listeden, adla arayarak ya da Mekkî/Medenî ve cüz süzgeciyle. Ayet araması mealde kelime bulur.' } },
      { title: { az: 'Oxu və dinlə', en: 'Read and listen', ru: 'Читайте и слушайте', ar: 'اقرأ واستمع', tr: 'Oku ve dinle' },
        text: { az: 'Hər ayənin yanındakı ▶ düyməsi həmin ayədən dinləməni başladır. Aşağıdakı pleyerdə qari, təkrar sayı və sürət seçilir.', en: 'The ▶ button next to a verse starts listening from it. In the player below you choose the reciter, repeats and speed.', ru: 'Кнопка ▶ рядом с аятом запускает чтение с него. В плеере внизу выбираются чтец, число повторов и скорость.', ar: 'زر ▶ بجانب الآية يبدأ الاستماع منها، ومن المشغّل في الأسفل تختار القارئ والتكرار والسرعة.', tr: 'Ayetin yanındaki ▶ düğmesi dinlemeyi o ayetten başlatır. Alttaki oynatıcıda kâri, tekrar sayısı ve hız seçilir.' } },
      { title: { az: 'Mənasını öyrən', en: 'Learn the meaning', ru: 'Изучайте смысл', ar: 'افهم المعنى', tr: 'Anlamını öğren' },
        text: { az: 'Tərcümə ərəb mətninin altındadır. «Təfsir» düyməsi ayənin izahını açır (Səədi, İbn Kəsir və b.).', en: 'The translation sits under the Arabic. The “Tafsir” button opens the explanation (as-Sa‘di, Ibn Kathir and others).', ru: 'Перевод — под арабским текстом. Кнопка «Тафсир» открывает толкование (ас-Саади, Ибн Касир и др.).', ar: 'زر «تفسير» تحت كل آية يفتح شرحها (السعدي، ابن كثير، الميسر وغيرها).', tr: 'Meal Arapça metnin altındadır. “Tefsir” düğmesi ayetin açıklamasını açar (Sa‘dî, İbn Kesîr vb.).' } },
      { title: { az: 'Yerini itirmə', en: 'Never lose your place', ru: 'Не теряйте место', ar: 'لا تُضِع موضعك', tr: 'Yerini kaybetme' },
        text: { az: 'Oxuduğun ayə avtomatik yadda qalır — «Oxumağa davam et» səni oraya qaytarır. G düyməsi «Ayəyə keç» panelini açır.', en: 'The verse you reach is saved automatically — “Continue reading” takes you back. The G key opens “Go to verse”.', ru: 'Аят, до которого вы дошли, сохраняется сам — «Продолжить чтение» вернёт вас туда. Клавиша G открывает «Перейти к аяту».', ar: 'تُحفظ الآية التي وصلت إليها تلقائيًا، و«أكمل القراءة» يعيدك إليها. ومفتاح G يفتح «انتقل إلى آية».', tr: 'Ulaştığın ayet kendiliğinden kaydedilir — “Okumaya devam et” seni oraya götürür. G tuşu “Ayete git” panelini açar.' } },
    ],
  },

  // ── Əlaqəli bölmələr ──
  related: {
    eyebrow: { az: 'Davamı', en: 'Go further', ru: 'Дальше', ar: 'للمزيد', tr: 'Devamı' },
    title: { az: 'Quranla daha çox', en: 'More with the Quran', ru: 'Больше с Кораном', ar: 'المزيد مع القرآن', tr: 'Kur’an ile daha fazlası' },
    items: [
      { key: 'mushaf', icon: 'mushaf',
        title: { az: 'Mushaf görünüşü', en: 'Mushaf view', ru: 'Вид мусхафа', ar: 'عرض المصحف', tr: 'Mushaf görünümü' },
        text: { az: '604 səhifə, təcvid rəngləri', en: '604 pages, tajweed colours', ru: '604 страницы, цвета таджвида', ar: '٦٠٤ صفحات بألوان التجويد', tr: '604 sayfa, tecvit renkleri' } },
      { key: 'hifz', icon: 'hifz',
        title: { az: 'Hifz', en: 'Hifz', ru: 'Хифз', ar: 'الحفظ', tr: 'Hıfz' },
        text: { az: 'Əzbərləmə planı və təkrar', en: 'Memorisation plan and reviews', ru: 'План заучивания и повторения', ar: 'خطة الحفظ والمراجعة', tr: 'Ezber planı ve tekrar' } },
      { key: 'quranroots', icon: 'quranroots',
        title: { az: 'Kök axtarışı', en: 'Root search', ru: 'Поиск по корню', ar: 'البحث بالجذر', tr: 'Kök araması' },
        text: { az: 'Sözlər hansı kökdən gəlir', en: 'Which root a word comes from', ru: 'От какого корня слово', ar: 'جذور كلمات القرآن', tr: 'Kelimeler hangi kökten gelir' } },
      { key: 'arabic', icon: 'arabic',
        title: { az: 'Ərəb dili', en: 'Arabic', ru: 'Арабский язык', ar: 'اللغة العربية', tr: 'Arapça' },
        text: { az: 'Əlifbadan başla', en: 'Start with the alphabet', ru: 'Начните с алфавита', ar: 'ابدأ بالحروف', tr: 'Alfabeyle başla' } },
      { key: 'qurangame', icon: 'qurangame',
        title: { az: 'Quran oyunu', en: 'Quran game', ru: 'Игра по Корану', ar: 'لعبة القرآن', tr: 'Kur’an oyunu' },
        text: { az: 'Biliyini yoxla', en: 'Test your knowledge', ru: 'Проверьте знания', ar: 'اختبر معلوماتك', tr: 'Bilgini sına' } },
      { key: 'learn', icon: 'learn',
        title: { az: 'Dərslər', en: 'Lessons', ru: 'Уроки', ar: 'الدروس', tr: 'Dersler' },
        text: { az: 'Əqidə və fiqh — dəlillə', en: 'Creed and fiqh — with evidence', ru: 'Вероубеждение и фикх — с доводами', ar: 'العقيدة والفقه بالدليل', tr: 'Akide ve fıkıh — delilleriyle' } },
    ],
  },

  // ── Siyahının üstündəki vizual və süzgəc ──
  ui: {
    lead: {
      az: 'Allahın kəlamı — ərəb mətni, tərcümə, təfsir və qiraət bir yerdə.',
      en: 'The speech of Allah — Arabic text, translation, tafsir and recitation in one place.',
      ru: 'Речь Аллаха — арабский текст, перевод, тафсир и чтение в одном месте.',
      ar: 'كلام الله: النص والتفسير والتلاوة في مكان واحد.',
      tr: 'Allah’ın kelamı — Arapça metin, meal, tefsir ve kıraat bir arada.',
    },
    how: {
      az: 'Surəyə toxunun və oxumağa başlayın — hər ayənin yanında dinləmə və təfsir düymələri var. Oxuduğunuz yer avtomatik yadda qalır.',
      en: 'Tap a surah and start reading — every verse has listen and tafsir buttons. Your place is saved automatically.',
      ru: 'Нажмите на суру и начните читать — у каждого аята есть кнопки прослушивания и тафсира. Место чтения сохраняется автоматически.',
      ar: 'اضغط على السورة وابدأ القراءة؛ بجانب كل آية زرّا الاستماع والتفسير، ويُحفظ موضع قراءتك تلقائيًا.',
      tr: 'Bir sureye dokunun ve okumaya başlayın — her ayetin yanında dinleme ve tefsir düğmeleri var. Okuduğunuz yer kendiliğinden kaydedilir.',
    },
    juz: { az: 'Cüz', en: 'Juz', ru: 'Джуз', ar: 'الجزء', tr: 'Cüz' },
    allJuz: { az: 'Bütün cüzlər', en: 'All juz', ru: 'Все джузы', ar: 'كل الأجزاء', tr: 'Bütün cüzler' },
    juzN: { az: n => `${n}-ci cüz`, en: n => `Juz ${n}`, ru: n => `Джуз ${n}`, ar: n => `الجزء ${n}`, tr: n => `${n}. cüz` },
    juzChart: { az: n => `${n}-ci cüzdə ayələr`, en: n => `Verses in juz ${n}`, ru: n => `Аяты в джузе ${n}`, ar: n => `آيات الجزء ${n}`, tr: n => `${n}. cüzdeki ayetler` },
    juzChartSub: { az: 'surələr üzrə, bu cüzə düşən hissə', en: 'by surah — only the part inside this juz', ru: 'по сурам — только часть внутри джуза', ar: 'بحسب السور، القدر الواقع في هذا الجزء', tr: 'surelere göre — bu cüze düşen kısım' },
    juzMore: { az: n => `və daha ${n} surə`, en: n => `and ${n} more surahs`, ru: n => `и ещё сур: ${n}`, ar: n => `و${n} سورة أخرى`, tr: n => `ve ${n} sure daha` },
    // lang-ok[Quran,Quran.com]: saytın rəsmi adı
    juzSrc: { az: 'Mənbə: Quran.com API (cüz bölgüsü)', en: 'Source: Quran.com API (juz division)', ru: 'Источник: API Quran.com (деление на джузы)', ar: 'المصدر: Quran.com (تقسيم الأجزاء)', tr: 'Kaynak: Quran.com API (cüz taksimi)' },
    ayahsTotal: { az: 'ayə', en: 'verses', ru: 'аятов', ar: 'آية', tr: 'ayet' },
    yourReading: { az: 'Oxumanız', en: 'Your reading', ru: 'Ваше чтение', ar: 'قراءتك', tr: 'Okumanız' },
    readingNote: { az: 'Yalnız bu cihazda saxlanılır.', en: 'Stored on this device only.', ru: 'Хранится только на этом устройстве.', ar: 'تُحفظ على هذا الجهاز فقط.', tr: 'Yalnızca bu cihazda saklanır.' },
    surahsWord: { az: 'surə', en: 'surahs', ru: 'сур', ar: 'سورة', tr: 'sure' },
    pages: { az: 'Səhifə', en: 'Pages', ru: 'Страницы', ar: 'الصفحات', tr: 'Sayfa' },
    juzLabel: { az: 'Cüz', en: 'Juz', ru: 'Джуз', ar: 'الجزء', tr: 'Cüz' },
    order: { az: 'Sıra', en: 'Order', ru: 'Порядок', ar: 'الترتيب', tr: 'Sıra' },
    progress: { az: 'Oxunub', en: 'Read', ru: 'Прочитано', ar: 'المقروء', tr: 'Okundu' },
    hadith: { az: 'Hədis', en: 'Hadith', ru: 'Хадис', ar: 'حديث', tr: 'Hadis' },
    quran: { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: 'Kur’an' },
    grade: { az: 'Dərəcəsi', en: 'Grade', ru: 'Степень', ar: 'الدرجة', tr: 'Derecesi' },
  },
}
