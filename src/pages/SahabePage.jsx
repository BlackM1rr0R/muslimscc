import { useState, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import '../styles/SahabePage.css'

/* ── Labels ── */
const LABELS = {
  az: { title:'Səhabələr', subtitle:'Peyğəmbərin ﷺ əshabı', search:'Axtar...', bio:'Həyatı', facts:'Əsas Faktlar', hadiths:'Hədislər', back:'Geri', readMore:'Daha çox', noResults:'Nəticə tapılmadı', hadithLabel:'Hədis' },
  en: { title:'Companions', subtitle:'Companions of the Prophet ﷺ', search:'Search...', bio:'Biography', facts:'Key Facts', hadiths:'Hadiths', back:'Back', readMore:'Read more', noResults:'No results found', hadithLabel:'Hadith' },
  ru: { title:'Сахабы', subtitle:'Сподвижники Пророка ﷺ', search:'Поиск...', bio:'Биография', facts:'Ключевые факты', hadiths:'Хадисы', back:'Назад', readMore:'Подробнее', noResults:'Результаты не найдены', hadithLabel:'Хадис' },
  ar: { title:'الصحابة', subtitle:'أصحاب النبي ﷺ', search:'بحث...', bio:'السيرة', facts:'حقائق أساسية', hadiths:'الأحاديث', back:'رجوع', readMore:'المزيد', noResults:'لم يتم العثور على نتائج', hadithLabel:'حديث' },
  tr: { title:'Sahabeler', subtitle:'Peygamberimizin ﷺ Ashabı', search:'Ara...', bio:'Hayatı', facts:'Temel Bilgiler', hadiths:'Hadisler', back:'Geri', readMore:'Devamı', noResults:'Sonuç bulunamadı', hadithLabel:'Hadis' },
}

/* ── Sahabi Data (20 companions, 5 hadiths each) ── */
const SAHABA = [
  {
    id: 1,
    name: { ar:'أبو بكر الصديق', az:'Əbu Bəkr əs-Siddiq', en:'Abu Bakr as-Siddiq', ru:'Абу Бакр ас-Сиддик', tr:'Ebu Bekir es-Sıddık' },
    title: { az:'Birinci Xəlifə', en:'First Caliph', ru:'Первый Халиф', ar:'الخليفة الأول', tr:'İlk Halife' },
    bio: {
      az:'Əbu Bəkr əs-Siddiq İslama ilk iman gətirən kişilərdən biridir. Hz. Peyğəmbərin (s.a.s) ən yaxın dostu və qayınatası idi. Hicrət zamanı Peyğəmbərlə birlikdə mağarada gizləndi. Peyğəmbərdən sonra birinci xəlifə oldu və riddə müharibələrini idarə edərək İslam dövlətinin bütövlüyünü qorudu.',
      en:'Abu Bakr as-Siddiq was one of the first men to embrace Islam. He was the closest friend and father-in-law of Prophet Muhammad ﷺ. He accompanied the Prophet during the Hijra, hiding in the Cave of Thawr. After the Prophet\'s death, he became the first Caliph and preserved the unity of the Islamic state during the Ridda Wars.',
      ru:'Абу Бакр ас-Сиддик был одним из первых мужчин, принявших Ислам. Он был ближайшим другом и тестем Пророка Мухаммада ﷺ. Он сопровождал Пророка во время Хиджры, укрываясь в пещере Саур. После смерти Пророка он стал первым Халифом и сохранил единство исламского государства во время войн Ридда.',
      ar:'أبو بكر الصديق كان من أوائل الرجال الذين أسلموا. كان أقرب أصدقاء النبي محمد ﷺ وكان حماه. رافق النبي في الهجرة واختبأ معه في غار ثور. بعد وفاة النبي أصبح أول خليفة وحافظ على وحدة الدولة الإسلامية خلال حروب الردة.',
      tr:'Ebu Bekir es-Sıddık, İslam\'ı kabul eden ilk erkeklerden biriydi. Hz. Peygamber\'in (s.a.s) en yakın dostu ve kayınpederiydi. Hicret sırasında Peygamber\'le birlikte Sevr Mağarası\'nda saklandı. Peygamber\'in vefatından sonra ilk halife oldu ve Ridde Savaşları sırasında İslam devletinin birliğini korudu.',
    },
    facts: [
      { az:'İslama ilk iman gətirən azad kişidir', en:'First free man to accept Islam', ru:'Первый свободный мужчина, принявший Ислам', ar:'أول رجل حر أسلم', tr:'İslam\'ı kabul eden ilk hür erkek' },
      { az:'Bütün malını İslam yolunda xərcləmişdir', en:'Spent all his wealth for Islam', ru:'Потратил все свое состояние на пути Ислама', ar:'أنفق كل ماله في سبيل الإسلام', tr:'Tüm malını İslam yolunda harcadı' },
      { az:'Quranı ilk dəfə kitab şəklində topladı', en:'First to compile the Quran into a book', ru:'Первый, кто собрал Коран в книгу', ar:'أول من جمع القرآن في مصحف', tr:'Kur\'an\'ı ilk defa kitap haline getiren kişi' },
      { az:'2 il xəlifəlik etmişdir (632-634)', en:'Served as Caliph for 2 years (632-634)', ru:'Был Халифом 2 года (632-634)', ar:'تولى الخلافة سنتين (632-634)', tr:'2 yıl halifelik yaptı (632-634)' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: لو كنتُ متخذًا خليلًا من أمتي لاتخذتُ أبا بكرٍ خليلًا', source:'Buxari 3654', az:'Peyğəmbər ﷺ buyurdu: "Əgər ümmətimdən bir dost seçsəydim, Əbu Bəkri seçərdim."', en:'The Prophet ﷺ said: "If I were to take a close friend from my Ummah, I would take Abu Bakr."', ru:'Пророк ﷺ сказал: «Если бы я взял себе ближайшего друга из моей Уммы, я бы взял Абу Бакра.»', tr:'Peygamber ﷺ buyurdu: "Ümmetimden bir dost edinseydim, Ebu Bekir\'i edinirdim."' },
      { ar:'قال رسول الله ﷺ: ما نفعني مالٌ قطُّ ما نفعني مالُ أبي بكرٍ', source:'Tirmizi 3661', az:'Peyğəmbər ﷺ buyurdu: "Heç bir mal mənə Əbu Bəkrin malı qədər fayda verməmişdir."', en:'The Prophet ﷺ said: "No wealth has ever benefited me as much as the wealth of Abu Bakr."', ru:'Пророк ﷺ сказал: «Никакое богатство не принесло мне столько пользы, сколько богатство Абу Бакра.»', tr:'Peygamber ﷺ buyurdu: "Hiçbir mal bana Ebu Bekir\'in malı kadar fayda vermemiştir."' },
      { ar:'عن أبي بكر الصديق قال: لستُ تاركًا شيئًا كان رسول الله ﷺ يعملُ به إلا عملتُ به', source:'Buxari 3093', az:'Əbu Bəkr dedi: "Peyğəmbərin ﷺ etdiyi heç bir şeyi tərk etmərəm."', en:'Abu Bakr said: "I will not leave anything that the Prophet ﷺ used to do except that I will do it."', ru:'Абу Бакр сказал: «Я не оставлю ничего, что делал Посланник Аллаха ﷺ, не сделав это сам.»', tr:'Ebu Bekir dedi: "Resulullah\'ın ﷺ yaptığı hiçbir şeyi bırakmam, mutlaka yaparım."' },
      { ar:'قال رسول الله ﷺ: أرحمُ أمتي بأمتي أبو بكرٍ', source:'Tirmizi 3790', az:'Peyğəmbər ﷺ buyurdu: "Ümmətimə ən çox rəhm edən Əbu Bəkrdir."', en:'The Prophet ﷺ said: "The most merciful of my Ummah towards my Ummah is Abu Bakr."', ru:'Пророк ﷺ сказал: «Самый милосердный к моей Умме — Абу Бакр.»', tr:'Peygamber ﷺ buyurdu: "Ümmetime en merhametli olan Ebu Bekir\'dir."' },
      { ar:'قال أبو بكر: أيها الناس، من كان يعبد محمدًا فإن محمدًا قد مات، ومن كان يعبد الله فإن الله حيٌّ لا يموت', source:'Buxari 3668', az:'Əbu Bəkr dedi: "Ey insanlar! Kim Muhammədə ibadət edirdisə, bilin ki Muhammed vəfat etmişdir. Kim Allaha ibadət edirdisə, bilin ki Allah diridir, ölməz."', en:'Abu Bakr said: "O people! Whoever worshipped Muhammad, know that Muhammad has died. Whoever worshipped Allah, know that Allah is alive and does not die."', ru:'Абу Бакр сказал: «О люди! Кто поклонялся Мухаммаду — Мухаммад умер. Кто поклонялся Аллаху — Аллах жив и не умирает.»', tr:'Ebu Bekir dedi: "Ey insanlar! Kim Muhammed\'e tapıyorsa, bilin ki Muhammed vefat etmiştir. Kim Allah\'a tapıyorsa, bilin ki Allah diridir, ölmez."' },
    ],
  },
  {
    id: 2,
    name: { ar:'عمر بن الخطاب', az:'Ömər ibn əl-Xəttab', en:'Umar ibn al-Khattab', ru:'Умар ибн аль-Хаттаб', tr:'Ömer ibn el-Hattab' },
    title: { az:'İkinci Xəlifə', en:'Second Caliph', ru:'Второй Халиф', ar:'الخليفة الثاني', tr:'İkinci Halife' },
    bio: {
      az:'Ömər ibn əl-Xəttab İslamın ən güclü xəlifələrindən biridir. Əvvəlcə İslama düşmən idi, lakin sonra iman gətirib müsəlmanların ən böyük simalarından birinə çevrildi. Ədaləti ilə tanınırdı və xilafəti dövründə İslam dövləti böyük genişlənmə yaşadı.',
      en:'Umar ibn al-Khattab was one of the most powerful caliphs in Islam. Initially hostile to Islam, he later embraced it and became one of the greatest figures among Muslims. Known for his justice, the Islamic state experienced great expansion during his caliphate.',
      ru:'Умар ибн аль-Хаттаб был одним из самых могущественных халифов в Исламе. Сначала враждебный к Исламу, он позже принял его и стал одной из величайших фигур среди мусульман. Известный своей справедливостью, при его халифате Исламское государство пережило великое расширение.',
      ar:'عمر بن الخطاب كان من أقوى الخلفاء في الإسلام. كان في البداية معاديًا للإسلام ثم أسلم وأصبح من أعظم الشخصيات بين المسلمين. عُرف بعدله وشهدت الدولة الإسلامية توسعًا كبيرًا في عهد خلافته.',
      tr:'Ömer ibn el-Hattab, İslam\'ın en güçlü halifelerinden biriydi. Başlangıçta İslam\'a düşmandı, ancak daha sonra iman edip Müslümanların en büyük şahsiyetlerinden biri oldu. Adaleti ile tanınırdı ve halifeliği döneminde İslam devleti büyük bir genişleme yaşadı.',
    },
    facts: [
      { az:'Ədaləti ilə "Əl-Faruq" (haqqı batildən ayıran) ləqəbi verilmişdir', en:'Given the title "Al-Faruq" (the one who distinguishes truth from falsehood)', ru:'Получил прозвище «Аль-Фарук» (различающий истину от лжи)', ar:'لُقِّب بـ"الفاروق" لتمييزه الحق من الباطل', tr:'"El-Faruk" (hakkı batıldan ayıran) lakabı verilmiştir' },
      { az:'10 il xəlifəlik etmişdir (634-644)', en:'Served as Caliph for 10 years (634-644)', ru:'Был Халифом 10 лет (634-644)', ar:'تولى الخلافة عشر سنوات (634-644)', tr:'10 yıl halifelik yaptı (634-644)' },
      { az:'Hicri təqvimi tətbiq edən ilk xəlifədir', en:'First caliph to implement the Hijri calendar', ru:'Первый халиф, внедривший хиджрийский календарь', ar:'أول من وضع التقويم الهجري', tr:'Hicri takvimi uygulayan ilk halifedir' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: لو كان بعدي نبيٌّ لكان عمرَ بنَ الخطابِ', source:'Tirmizi 3686', az:'Peyğəmbər ﷺ buyurdu: "Məndən sonra bir peyğəmbər olsaydı, Ömər ibn əl-Xəttab olardı."', en:'The Prophet ﷺ said: "If there were a prophet after me, it would be Umar ibn al-Khattab."', ru:'Пророк ﷺ сказал: «Если бы после меня был пророк, это был бы Умар ибн аль-Хаттаб.»', tr:'Peygamber ﷺ buyurdu: "Benden sonra bir peygamber olsaydı, Ömer ibn el-Hattab olurdu."' },
      { ar:'قال رسول الله ﷺ: إن الله جعل الحقَّ على لسان عمرَ وقلبه', source:'Tirmizi 3682', az:'Peyğəmbər ﷺ buyurdu: "Allah haqqi Ömərin dili və qəlbi üzərinə qoymuşdur."', en:'The Prophet ﷺ said: "Allah has placed the truth on Umar\'s tongue and heart."', ru:'Пророк ﷺ сказал: «Аллах поместил истину на язык и сердце Умара.»', tr:'Peygamber ﷺ buyurdu: "Allah, hakkı Ömer\'in dili ve kalbi üzerine koymuştur."' },
      { ar:'قال عمر: حاسبوا أنفسكم قبل أن تُحاسَبوا', source:'Tirmizi 2459', az:'Ömər dedi: "Hesaba çəkilmədən əvvəl özünüzü hesaba çəkin."', en:'Umar said: "Hold yourselves accountable before you are held accountable."', ru:'Умар сказал: «Спрашивайте с самих себя, прежде чем вас спросят.»', tr:'Ömer dedi: "Hesaba çekilmeden önce kendinizi hesaba çekin."' },
      { ar:'قال رسول الله ﷺ: إن الشيطان ليفرُّ منك يا عمر', source:'Buxari 3294', az:'Peyğəmbər ﷺ Ömərə buyurdu: "Ey Ömər, şeytan səndən qaçır."', en:'The Prophet ﷺ said to Umar: "O Umar, the devil flees from you."', ru:'Пророк ﷺ сказал Умару: «О Умар, шайтан бежит от тебя.»', tr:'Peygamber ﷺ Ömer\'e buyurdu: "Ey Ömer, şeytan senden kaçar."' },
      { ar:'قال عمر: ما رأيتُ أحدًا أشجعَ ولا أجودَ من رسول الله ﷺ', source:'Muslim 2384', az:'Ömər dedi: "Peyğəmbərdən ﷺ daha cəsarətli və daha səxavətli bir kimsə görmədim."', en:'Umar said: "I have never seen anyone braver or more generous than the Messenger of Allah ﷺ."', ru:'Умар сказал: «Я не видел никого храбрее и щедрее Посланника Аллаха ﷺ.»', tr:'Ömer dedi: "Resulullah\'tan ﷺ daha cesur ve daha cömert birini görmedim."' },
    ],
  },
  {
    id: 3,
    name: { ar:'عثمان بن عفان', az:'Osman ibn Əffan', en:'Uthman ibn Affan', ru:'Усман ибн Аффан', tr:'Osman ibn Affan' },
    title: { az:'Üçüncü Xəlifə', en:'Third Caliph', ru:'Третий Халиф', ar:'الخليفة الثالث', tr:'Üçüncü Halife' },
    bio: {
      az:'Osman ibn Əffan səxavəti və həyası ilə tanınan səhabədir. Peyğəmbərin ﷺ iki qızı ilə evləndiyi üçün "Zun-Nureyn" (iki nur sahibi) ləqəbi verilmişdir. Quranın standart nüsxəsini hazırladı.',
      en:'Uthman ibn Affan was known for his generosity and modesty. He was given the title "Dhun-Nurayn" (possessor of two lights) because he married two daughters of the Prophet ﷺ. He standardized the Quran into a single text.',
      ru:'Усман ибн Аффан был известен своей щедростью и скромностью. Он получил прозвище «Зун-Нурайн» (обладатель двух светочей), так как женился на двух дочерях Пророка ﷺ. Он стандартизировал Коран в единый текст.',
      ar:'عثمان بن عفان كان معروفًا بكرمه وحيائه. لُقِّب بـ"ذو النورين" لأنه تزوج ابنتين من بنات النبي ﷺ. قام بتوحيد نسخ القرآن الكريم.',
      tr:'Osman ibn Affan, cömertliği ve hayâsı ile tanınan bir sahabeydi. Peygamber\'in ﷺ iki kızıyla evlendiği için "Zün-Nureyn" (iki nur sahibi) lakabı verilmiştir. Kur\'an\'ın standart nüshasını hazırladı.',
    },
    facts: [
      { az:'"Zun-Nureyn" — Peyğəmbərin iki qızı ilə evlənmişdir', en:'"Dhun-Nurayn" — married two daughters of the Prophet', ru:'«Зун-Нурайн» — женился на двух дочерях Пророка', ar:'"ذو النورين" — تزوج ابنتين من بنات النبي', tr:'"Zün-Nureyn" — Peygamber\'in iki kızıyla evlendi' },
      { az:'Quranı standart nüsxə halında topladı', en:'Compiled the standard version of the Quran', ru:'Составил стандартную версию Корана', ar:'جمع القرآن في مصحف واحد', tr:'Kur\'an\'ın standart nüshasını derledi' },
      { az:'12 il xəlifəlik etmişdir (644-656)', en:'Served as Caliph for 12 years (644-656)', ru:'Был Халифом 12 лет (644-656)', ar:'تولى الخلافة اثنتي عشرة سنة (644-656)', tr:'12 yıl halifelik yaptı (644-656)' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: ألا أستحي من رجلٍ تستحي منه الملائكة', source:'Muslim 2401', az:'Peyğəmbər ﷺ buyurdu: "Mələklərin həya etdiyi bir kişidən mən həya etməyimmi?"', en:'The Prophet ﷺ said: "Shall I not be shy of a man whom the angels are shy of?"', ru:'Пророк ﷺ сказал: «Разве мне не стесняться человека, которого стесняются ангелы?»', tr:'Peygamber ﷺ buyurdu: "Meleklerin hayâ ettiği bir kişiden ben hayâ etmez miyim?"' },
      { ar:'قال رسول الله ﷺ: لكل نبيٍّ رفيقٌ ورفيقي في الجنة عثمان', source:'Tirmizi 3698', az:'Peyğəmbər ﷺ buyurdu: "Hər peyğəmbərin bir yoldaşı var, mənim Cənnətdəki yoldaşım Osmandır."', en:'The Prophet ﷺ said: "Every prophet has a companion, and my companion in Paradise is Uthman."', ru:'Пророк ﷺ сказал: «У каждого пророка есть спутник, и мой спутник в Раю — Усман.»', tr:'Peygamber ﷺ buyurdu: "Her peygamberin bir arkadaşı vardır, benim Cennet\'teki arkadaşım Osman\'dır."' },
      { ar:'قال رسول الله ﷺ: من جهَّز جيش العسرة فله الجنة', source:'Buxari 2778', az:'Peyğəmbər ﷺ buyurdu: "Kim çətinlik ordusunu təchiz etsə, ona Cənnət var." Osman təchiz etdi.', en:'The Prophet ﷺ said: "Whoever equips the army of hardship shall have Paradise." Uthman equipped it.', ru:'Пророк ﷺ сказал: «Кто снарядит войско трудности, тому Рай.» Усман снарядил его.', tr:'Peygamber ﷺ buyurdu: "Kim zorluk ordusunu donatırsa, ona Cennet vardır." Osman donattı.' },
      { ar:'عن عثمان قال: خيرُكم من تعلَّم القرآنَ وعلَّمه', source:'Buxari 5027', az:'Osman rəvayət etdi ki, Peyğəmbər ﷺ buyurdu: "Sizin ən xeyirliniz Quranı öyrənən və öyrədəndir."', en:'Uthman narrated that the Prophet ﷺ said: "The best of you are those who learn the Quran and teach it."', ru:'Усман передал, что Пророк ﷺ сказал: «Лучший из вас тот, кто изучает Коран и обучает ему.»', tr:'Osman rivayet etti ki, Peygamber ﷺ buyurdu: "Sizin en hayırlınız Kur\'an\'ı öğrenen ve öğretendir."' },
      { ar:'قال عثمان: لو طهرت قلوبُكم ما شبعتم من كلام ربِّكم', source:'İbn Kəsir', az:'Osman dedi: "Əgər qəlbləriniz təmiz olsaydı, Rəbbinizin kəlamından doymaz idiniz."', en:'Uthman said: "If your hearts were pure, you would never tire of the words of your Lord."', ru:'Усман сказал: «Если бы ваши сердца были чисты, вы бы не насытились словами вашего Господа.»', tr:'Osman dedi: "Kalpleriniz temiz olsaydı, Rabbinizin kelamından doyamazdınız."' },
    ],
  },
  {
    id: 4,
    name: { ar:'علي بن أبي طالب', az:'Əli ibn Əbu Talib', en:'Ali ibn Abi Talib', ru:'Али ибн Абу Талиб', tr:'Ali ibn Ebi Talib' },
    title: { az:'Dördüncü Xəlifə', en:'Fourth Caliph', ru:'Четвёртый Халиф', ar:'الخليفة الرابع', tr:'Dördüncü Halife' },
    bio: {
      az:'Əli ibn Əbu Talib Peyğəmbərin ﷺ əmisi oğlu və kürəkəni idi. İslama iman gətirən ilk uşaqdır. Cəsarəti, elmi və ədaləti ilə tanınırdı. Dördüncü xəlifə olaraq xidmət etdi.',
      en:'Ali ibn Abi Talib was the cousin and son-in-law of Prophet Muhammad ﷺ. He was the first child to accept Islam. Known for his bravery, knowledge, and justice, he served as the fourth Caliph.',
      ru:'Али ибн Абу Талиб был двоюродным братом и зятем Пророка Мухаммада ﷺ. Он был первым ребёнком, принявшим Ислам. Известный своей храбростью, знаниями и справедливостью, он был четвёртым Халифом.',
      ar:'علي بن أبي طالب كان ابن عم النبي محمد ﷺ وصهره. كان أول طفل يُسلم. عُرف بشجاعته وعلمه وعدله. تولى الخلافة الرابعة.',
      tr:'Ali ibn Ebi Talib, Hz. Peygamber\'in ﷺ amcaoğlu ve damadıydı. İslam\'ı kabul eden ilk çocuktur. Cesareti, ilmi ve adaleti ile tanınırdı. Dördüncü halife olarak hizmet etti.',
    },
    facts: [
      { az:'İslama iman gətirən ilk uşaqdır', en:'First child to accept Islam', ru:'Первый ребёнок, принявший Ислам', ar:'أول طفل أسلم', tr:'İslam\'ı kabul eden ilk çocuk' },
      { az:'Peyğəmbərin qızı Fatimə ilə evlənmişdir', en:'Married Fatimah, daughter of the Prophet', ru:'Женился на Фатиме, дочери Пророка', ar:'تزوج فاطمة بنت النبي', tr:'Peygamber\'in kızı Fatıma ile evlendi' },
      { az:'"Bab-ul-İlm" — Elmin qapısı ləqəbi verilmişdir', en:'Given the title "Bab-ul-Ilm" — Gate of Knowledge', ru:'Получил прозвище «Баб-уль-Ильм» — Врата Знания', ar:'لُقِّب بـ"باب العلم"', tr:'"Bab-ul-İlm" — İlim Kapısı lakabı verilmiştir' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: أنا مدينة العلم وعليٌّ بابُها', source:'Tirmizi 3723', az:'Peyğəmbər ﷺ buyurdu: "Mən elmin şəhəriyəm, Əli isə onun qapısıdır."', en:'The Prophet ﷺ said: "I am the city of knowledge and Ali is its gate."', ru:'Пророк ﷺ сказал: «Я — город знания, а Али — его врата.»', tr:'Peygamber ﷺ buyurdu: "Ben ilmin şehriyim, Ali de onun kapısıdır."' },
      { ar:'قال رسول الله ﷺ: من كنتُ مولاه فعليٌّ مولاه', source:'Tirmizi 3713', az:'Peyğəmbər ﷺ buyurdu: "Mən kimin mövlasıyamsa, Əli də onun mövlasıdır."', en:'The Prophet ﷺ said: "Whoever I am his master, then Ali is his master."', ru:'Пророк ﷺ сказал: «Кому я покровитель, тому и Али покровитель.»', tr:'Peygamber ﷺ buyurdu: "Ben kimin mevlâsıysam, Ali de onun mevlâsıdır."' },
      { ar:'قال علي: الناسُ نيامٌ فإذا ماتوا انتبهوا', source:'Nəhcül-Bəlağə', az:'Əli dedi: "İnsanlar yatmışdır, öləndə oyanarlar."', en:'Ali said: "People are asleep; when they die, they wake up."', ru:'Али сказал: «Люди спят, а когда умирают — просыпаются.»', tr:'Ali dedi: "İnsanlar uykudadır, öldüklerinde uyanırlar."' },
      { ar:'قال رسول الله ﷺ: أنتَ مني بمنزلة هارون من موسى إلا أنه لا نبيَّ بعدي', source:'Buxari 3706', az:'Peyğəmbər ﷺ Əliyə buyurdu: "Sən mənə Harunun Musaya olan mənzilindəsən, yalnız məndən sonra peyğəmbər yoxdur."', en:'The Prophet ﷺ said to Ali: "You are to me as Aaron was to Moses, except there is no prophet after me."', ru:'Пророк ﷺ сказал Али: «Ты для меня как Харун для Мусы, только нет пророка после меня.»', tr:'Peygamber ﷺ Ali\'ye buyurdu: "Sen bana Harun\'un Musa\'ya olan konumu gibisin, ancak benden sonra peygamber yoktur."' },
      { ar:'قال علي: قيمةُ كلِّ امرئٍ ما يُحسِنه', source:'Nəhcül-Bəlağə', az:'Əli dedi: "Hər insanın dəyəri onun yaxşı bildiyi şeydir."', en:'Ali said: "The value of every person is in what they excel at."', ru:'Али сказал: «Ценность каждого человека — в том, что он умеет делать хорошо.»', tr:'Ali dedi: "Her insanın değeri, iyi bildiği şeydedir."' },
    ],
  },
  {
    id: 5,
    name: { ar:'خديجة بنت خويلد', az:'Xədicə bint Xüveylid', en:'Khadijah bint Khuwaylid', ru:'Хадиджа бинт Хувайлид', tr:'Hatice bint Huveylid' },
    title: { az:'Peyğəmbərin ilk xanımı', en:'First wife of the Prophet', ru:'Первая жена Пророка', ar:'أولى زوجات النبي', tr:'Peygamber\'in ilk eşi' },
    bio: {
      az:'Xədicə bint Xüveylid Peyğəmbərin ﷺ ilk xanımı və İslama iman gətirən ilk insandır. Varlı bir iş qadını idi və bütün malını İslam yolunda sərf etdi. Peyğəmbərin ən çətin anlarında onun ən böyük dayağı oldu.',
      en:'Khadijah bint Khuwaylid was the first wife of Prophet Muhammad ﷺ and the first person to accept Islam. She was a wealthy businesswoman who spent all her wealth for the cause of Islam. She was the greatest support for the Prophet during his most difficult times.',
      ru:'Хадиджа бинт Хувайлид была первой женой Пророка Мухаммада ﷺ и первым человеком, принявшим Ислам. Она была богатой предпринимательницей, потратившей всё своё состояние на дело Ислама. Она была главной опорой Пророка в самые трудные времена.',
      ar:'خديجة بنت خويلد كانت أولى زوجات النبي محمد ﷺ وأول من أسلم. كانت سيدة أعمال ثرية أنفقت كل مالها في سبيل الإسلام. كانت أعظم سند للنبي في أصعب أوقاته.',
      tr:'Hatice bint Huveylid, Hz. Peygamber\'in ﷺ ilk eşi ve İslam\'ı kabul eden ilk insandır. Zengin bir iş kadınıydı ve tüm malını İslam yolunda harcadı. Peygamber\'in en zor anlarında en büyük desteği oldu.',
    },
    facts: [
      { az:'İslama iman gətirən ilk insandır', en:'First person to accept Islam', ru:'Первый человек, принявший Ислам', ar:'أول من أسلم', tr:'İslam\'ı kabul eden ilk insan' },
      { az:'Uğurlu bir iş qadını idi', en:'Successful businesswoman', ru:'Успешная предпринимательница', ar:'كانت سيدة أعمال ناجحة', tr:'Başarılı bir iş kadınıydı' },
      { az:'Peyğəmbərlə 25 il evli qalmışdır', en:'Married to the Prophet for 25 years', ru:'Была замужем за Пророком 25 лет', ar:'بقيت زوجة النبي 25 عامًا', tr:'Peygamber ile 25 yıl evli kaldı' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: خيرُ نسائِها مريمُ بنتُ عمران وخيرُ نسائِها خديجةُ بنتُ خويلد', source:'Buxari 3432', az:'Peyğəmbər ﷺ buyurdu: "Qadınların ən xeyirlisi Məryəm bint İmran, qadınların ən xeyirlisi Xədicə bint Xüveylid."', en:'The Prophet ﷺ said: "The best of women is Maryam bint Imran and the best of women is Khadijah bint Khuwaylid."', ru:'Пророк ﷺ сказал: «Лучшая из женщин — Марьям бинт Имран, и лучшая из женщин — Хадиджа бинт Хувайлид.»', tr:'Peygamber ﷺ buyurdu: "Kadınların en hayırlısı Meryem bint İmran ve kadınların en hayırlısı Hatice bint Huveylid\'dir."' },
      { ar:'قال رسول الله ﷺ: آمنَت بي إذ كفر بي الناسُ، وصدَّقتني إذ كذَّبني الناسُ', source:'Əhməd 24864', az:'Peyğəmbər ﷺ Xədicə haqqında buyurdu: "İnsanlar mənə inanmayanda o mənə inandı, insanlar məni yalanlayanda o məni təsdiq etdi."', en:'The Prophet ﷺ said about Khadijah: "She believed in me when people disbelieved, she affirmed me when people denied me."', ru:'Пророк ﷺ сказал о Хадидже: «Она поверила в меня, когда люди не верили, она подтвердила меня, когда люди отвергали.»', tr:'Peygamber ﷺ Hatice hakkında buyurdu: "İnsanlar bana inanmadığında o inandı, insanlar beni yalanladığında o tasdik etti."' },
      { ar:'أتى جبريلُ النبيَّ ﷺ فقال: بشِّر خديجةَ ببيتٍ في الجنة من قصبٍ لا صخبَ فيه ولا نصَب', source:'Buxari 3820', az:'Cəbrail Peyğəmbərə ﷺ gəlib dedi: "Xədicəni Cənnətdə səs-küy və yorğunluq olmayan qəsrlə müjdələ."', en:'Gabriel came to the Prophet ﷺ and said: "Give Khadijah glad tidings of a palace in Paradise of pearls, with no noise or fatigue."', ru:'Джибриль пришёл к Пророку ﷺ и сказал: «Обрадуй Хадиджу дворцом в Раю из жемчуга, без шума и усталости.»', tr:'Cebrail, Peygamber\'e ﷺ gelip dedi: "Hatice\'yi Cennet\'te gürültü ve yorgunluk olmayan bir köşkle müjdele."' },
      { ar:'كان النبي ﷺ لا يكاد يخرج من البيت حتى يذكرَ خديجةَ فيُحسِنَ الثناءَ عليها', source:'Buxari 3818', az:'Peyğəmbər ﷺ evdən çıxmadan Xədicəni xatırlayar və onu gözəl sözlərlə yad edərdi.', en:'The Prophet ﷺ would hardly leave the house without remembering Khadijah and speaking well of her.', ru:'Пророк ﷺ почти не выходил из дома, не вспомнив Хадиджу и не отозвавшись о ней хорошо.', tr:'Peygamber ﷺ evden çıkmadan Hatice\'yi anar ve onu güzel sözlerle yâd ederdi.' },
      { ar:'قالت خديجة: كلا والله لا يخزيك الله أبدًا، إنك لتصل الرحم وتحمل الكَلَّ وتكسب المعدوم', source:'Buxari 3', az:'Xədicə Peyğəmbərə ﷺ dedi: "Xeyr, Allaha and olsun ki, Allah səni heç vaxt rüsvay etməz. Sən qohumluq əlaqələrini qoruyur, çətinlik çəkənlərə yardım edir, yoxsullara qazandırırsan."', en:'Khadijah said to the Prophet ﷺ: "No, by Allah, Allah will never disgrace you. You maintain family ties, help the burdened, earn for the poor."', ru:'Хадиджа сказала Пророку ﷺ: «Нет, клянусь Аллахом, Аллах никогда не опозорит тебя. Ты поддерживаешь родственные связи, помогаешь обременённым, зарабатываешь для бедных.»', tr:'Hatice, Peygamber\'e ﷺ dedi: "Hayır, Allah\'a yemin olsun ki Allah seni asla rezil etmez. Sen akrabalık bağlarını korur, sıkıntı çekenlere yardım eder, yoksullara kazandırırsın."' },
    ],
  },
  {
    id: 6,
    name: { ar:'عائشة بنت أبي بكر', az:'Aişə bint Əbu Bəkr', en:'Aisha bint Abi Bakr', ru:'Аиша бинт Абу Бакр', tr:'Ayşe bint Ebi Bekir' },
    title: { az:'Böyük alimə xanım', en:'Great female scholar', ru:'Великая учёная', ar:'العالمة الكبرى', tr:'Büyük kadın alim' },
    bio: {
      az:'Aişə bint Əbu Bəkr Peyğəmbərin ﷺ xanımı və Əbu Bəkrin qızı idi. İslamın ən böyük qadın alimlərindən biri olub, 2200-dən çox hədis rəvayət etmişdir.',
      en:'Aisha bint Abi Bakr was the wife of Prophet Muhammad ﷺ and daughter of Abu Bakr. She was one of the greatest female scholars in Islam, narrating over 2,200 hadiths.',
      ru:'Аиша бинт Абу Бакр была женой Пророка Мухаммада ﷺ и дочерью Абу Бакра. Она была одной из величайших женщин-учёных в Исламе, передавшей более 2200 хадисов.',
      ar:'عائشة بنت أبي بكر كانت زوجة النبي محمد ﷺ وابنة أبي بكر. كانت من أعظم العالمات في الإسلام وروت أكثر من 2200 حديث.',
      tr:'Ayşe bint Ebi Bekir, Hz. Peygamber\'in ﷺ eşi ve Ebu Bekir\'in kızıydı. İslam\'ın en büyük kadın alimlerinden biri olup, 2200\'den fazla hadis rivayet etmiştir.',
    },
    facts: [
      { az:'2200-dən çox hədis rəvayət etmişdir', en:'Narrated over 2,200 hadiths', ru:'Передала более 2200 хадисов', ar:'روت أكثر من 2200 حديث', tr:'2200\'den fazla hadis rivayet etti' },
      { az:'Fiqh, təfsir və tibb sahəsində dərin biliyə sahib idi', en:'Had deep knowledge in jurisprudence, exegesis, and medicine', ru:'Обладала глубокими знаниями в юриспруденции, толковании и медицине', ar:'كانت ذات علم عميق في الفقه والتفسير والطب', tr:'Fıkıh, tefsir ve tıp alanında derin bilgiye sahipti' },
      { az:'"Ümmül-Möminin" — Möminlərin anası ləqəbi verilmişdir', en:'Given the title "Umm al-Mu\'minin" — Mother of the Believers', ru:'Получила прозвище «Умм аль-Муминин» — Мать Верующих', ar:'لُقِّبت بـ"أم المؤمنين"', tr:'"Ümmü\'l-Mü\'minin" — Mü\'minlerin Annesi lakabı verilmiştir' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: خذوا نصفَ دينِكم عن هذه الحُميراء', source:'Hakim', az:'Peyğəmbər ﷺ buyurdu: "Dininizin yarısını bu qırmızı yanaqlıdan (Aişədən) öyrənin."', en:'The Prophet ﷺ said: "Take half of your religion from this fair lady (Aisha)."', ru:'Пророк ﷺ сказал: «Берите половину вашей религии от этой белолицей (Аиши).»', tr:'Peygamber ﷺ buyurdu: "Dininizin yarısını bu kırmızı yanaklıdan (Ayşe\'den) öğrenin."' },
      { ar:'قال رسول الله ﷺ: فضلُ عائشةَ على النساء كفضل الثريد على سائر الطعام', source:'Buxari 3770', az:'Peyğəmbər ﷺ buyurdu: "Aişənin qadınlara üstünlüyü, tiridin digər yeməklərə üstünlüyü kimidir."', en:'The Prophet ﷺ said: "The superiority of Aisha over women is like the superiority of tharid over other foods."', ru:'Пророк ﷺ сказал: «Превосходство Аиши над женщинами подобно превосходству тарида над остальной едой.»', tr:'Peygamber ﷺ buyurdu: "Ayşe\'nin kadınlara üstünlüğü, tiridin diğer yemeklere üstünlüğü gibidir."' },
      { ar:'عن عائشة قالت: كان خُلُقُه القرآن', source:'Muslim 746', az:'Aişə Peyğəmbərin ﷺ əxlaqı haqqında dedi: "Onun əxlaqı Quran idi."', en:'Aisha said about the Prophet\'s ﷺ character: "His character was the Quran."', ru:'Аиша сказала о нраве Пророка ﷺ: «Его нравом был Коран.»', tr:'Ayşe, Peygamber\'in ﷺ ahlâkı hakkında dedi: "Onun ahlâkı Kur\'an\'dı."' },
      { ar:'عن عائشة قالت: ما خُيِّر رسول الله ﷺ بين أمرين إلا اختار أيسرَهما ما لم يكن إثمًا', source:'Buxari 3560', az:'Aişə dedi: "Peyğəmbər ﷺ iki şey arasında seçim etdikdə, günah olmadığı müddətcə asan olanı seçərdi."', en:'Aisha said: "Whenever the Prophet ﷺ was given a choice between two things, he would choose the easier one as long as it was not sinful."', ru:'Аиша сказала: «Когда Пророку ﷺ предоставлялся выбор между двумя вещами, он выбирал более лёгкое, если это не было грехом.»', tr:'Ayşe dedi: "Peygamber ﷺ iki şey arasında seçim yaptığında, günah olmadığı sürece kolay olanı seçerdi."' },
      { ar:'عن عائشة قالت: ما ضرب رسول الله ﷺ شيئًا قطُّ بيده ولا امرأةً ولا خادمًا', source:'Muslim 2328', az:'Aişə dedi: "Peyğəmbər ﷺ heç vaxt əli ilə bir şeyə, nə bir qadına, nə də bir xidmətçiyə vurmamışdır."', en:'Aisha said: "The Prophet ﷺ never struck anything with his hand, neither a woman nor a servant."', ru:'Аиша сказала: «Пророк ﷺ никогда не ударял рукой ни вещь, ни женщину, ни слугу.»', tr:'Ayşe dedi: "Peygamber ﷺ asla eliyle bir şeye, ne bir kadına ne de bir hizmetçiye vurmamıştır."' },
    ],
  },
  {
    id: 7,
    name: { ar:'فاطمة بنت محمد', az:'Fatimə bint Muhəmməd', en:'Fatimah bint Muhammad', ru:'Фатима бинт Мухаммад', tr:'Fatıma bint Muhammed' },
    title: { az:'Peyğəmbərin qızı', en:'Daughter of the Prophet', ru:'Дочь Пророка', ar:'بنت النبي', tr:'Peygamber\'in kızı' },
    bio: {
      az:'Fatimə bint Muhəmməd Peyğəmbərin ﷺ ən kiçik və ən sevimli qızı idi. Əli ibn Əbu Taliblə evlənmiş, Həsən və Hüseynin anası olmuşdur. Səbri, ibadəti və təvazökarlığı ilə tanınırdı.',
      en:'Fatimah bint Muhammad was the youngest and most beloved daughter of Prophet Muhammad ﷺ. She married Ali ibn Abi Talib and was the mother of Hasan and Husayn. She was known for her patience, worship, and humility.',
      ru:'Фатима бинт Мухаммад была младшей и самой любимой дочерью Пророка Мухаммада ﷺ. Она вышла замуж за Али ибн Абу Талиба и была матерью Хасана и Хусейна. Она была известна своим терпением, поклонением и скромностью.',
      ar:'فاطمة بنت محمد كانت أصغر بنات النبي ﷺ وأحبهن إليه. تزوجت عليًا بن أبي طالب وكانت أم الحسن والحسين. عُرفت بصبرها وعبادتها وتواضعها.',
      tr:'Fatıma bint Muhammed, Hz. Peygamber\'in ﷺ en küçük ve en sevgili kızıydı. Ali ibn Ebi Talib ile evlendi, Hasan ve Hüseyin\'in annesi oldu. Sabrı, ibadeti ve tevazusu ile tanınırdı.',
    },
    facts: [
      { az:'"Əz-Zəhra" — Parlayan ləqəbi verilmişdir', en:'Given the title "Az-Zahra" — The Radiant', ru:'Получила прозвище «Аз-Захра» — Сияющая', ar:'لُقِّبت بـ"الزهراء"', tr:'"Ez-Zehra" — Parlayan lakabı verilmiştir' },
      { az:'Həsən və Hüseynin anasıdır', en:'Mother of Hasan and Husayn', ru:'Мать Хасана и Хусейна', ar:'أم الحسن والحسين', tr:'Hasan ve Hüseyin\'in annesidir' },
      { az:'Peyğəmbərdən ﷺ 6 ay sonra vəfat etmişdir', en:'Passed away 6 months after the Prophet ﷺ', ru:'Скончалась через 6 месяцев после Пророка ﷺ', ar:'توفيت بعد النبي ﷺ بستة أشهر', tr:'Peygamber\'den ﷺ 6 ay sonra vefat etti' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: فاطمةُ سيدةُ نساءِ أهل الجنة', source:'Buxari 3624', az:'Peyğəmbər ﷺ buyurdu: "Fatimə Cənnət qadınlarının xanımıdır."', en:'The Prophet ﷺ said: "Fatimah is the leader of the women of Paradise."', ru:'Пророк ﷺ сказал: «Фатима — госпожа женщин Рая.»', tr:'Peygamber ﷺ buyurdu: "Fatıma, Cennet kadınlarının hanımefendisidir."' },
      { ar:'قال رسول الله ﷺ: فاطمةُ بَضعةٌ مني، فمن أغضبها أغضبني', source:'Buxari 3714', az:'Peyğəmbər ﷺ buyurdu: "Fatimə mənim bir parçamdır; onu qəzəbləndirən məni qəzəbləndirir."', en:'The Prophet ﷺ said: "Fatimah is part of me; whoever angers her angers me."', ru:'Пророк ﷺ сказал: «Фатима — часть меня; кто разгневает её, разгневает меня.»', tr:'Peygamber ﷺ buyurdu: "Fatıma benim bir parçamdır; onu kızdıran beni kızdırmış olur."' },
      { ar:'كان النبي ﷺ إذا جاءته فاطمة قام إليها فقبَّلها وأجلسها في مجلسه', source:'Əbu Davud 5217', az:'Fatimə gəldikdə Peyğəmbər ﷺ ayağa qalxar, onu öpər və öz yerinə oturardardı.', en:'When Fatimah came, the Prophet ﷺ would stand up, kiss her, and seat her in his place.', ru:'Когда приходила Фатима, Пророк ﷺ вставал, целовал её и усаживал на своё место.', tr:'Fatıma geldiğinde Peygamber ﷺ ayağa kalkar, onu öper ve kendi yerine oturturdur.' },
      { ar:'علَّم النبي ﷺ فاطمةَ أن تسبِّح ثلاثًا وثلاثين وتحمد ثلاثًا وثلاثين وتكبِّر أربعًا وثلاثين', source:'Buxari 5362', az:'Peyğəmbər ﷺ Fatiməyə 33 dəfə Subhanallah, 33 dəfə Əlhəmdulillah, 34 dəfə Allahu Əkbər deməyi öyrətdi.', en:'The Prophet ﷺ taught Fatimah to say SubhanAllah 33 times, Alhamdulillah 33 times, and Allahu Akbar 34 times.', ru:'Пророк ﷺ научил Фатиму говорить СубханАллах 33 раза, Альхамдулиллях 33 раза и Аллаху Акбар 34 раза.', tr:'Peygamber ﷺ Fatıma\'ya 33 kere Sübhanallah, 33 kere Elhamdülillah, 34 kere Allahu Ekber demeyi öğretti.' },
      { ar:'قال رسول الله ﷺ: أفضلُ نساء أهل الجنة: خديجةُ وفاطمةُ ومريمُ وآسية', source:'Əhməd 2668', az:'Peyğəmbər ﷺ buyurdu: "Cənnət qadınlarının ən fəzilətliləri: Xədicə, Fatimə, Məryəm və Asiyədir."', en:'The Prophet ﷺ said: "The best women of Paradise are: Khadijah, Fatimah, Maryam, and Asiya."', ru:'Пророк ﷺ сказал: «Лучшие женщины Рая: Хадиджа, Фатима, Марьям и Асия.»', tr:'Peygamber ﷺ buyurdu: "Cennet kadınlarının en faziletlileri: Hatice, Fatıma, Meryem ve Asiye\'dir."' },
    ],
  },
  {
    id: 8,
    name: { ar:'بلال بن رباح', az:'Bilal ibn Rəbah', en:'Bilal ibn Rabah', ru:'Биляль ибн Рабах', tr:'Bilal ibn Rebah' },
    title: { az:'İlk müəzzin', en:'First muezzin', ru:'Первый муэдзин', ar:'أول مؤذن في الإسلام', tr:'İlk müezzin' },
    bio: {
      az:'Bilal ibn Rəbah İslamın ilk müəzzinidir. Həbəşistanlı bir kölə idi və İslama iman gətirdiyinə görə ağır işgəncələrə məruz qaldı. Əbu Bəkr onu satın alıb azad etdi. "Əhad, Əhad" (Allah birdir) deyərək işgəncələrə dözdü.',
      en:'Bilal ibn Rabah was the first muezzin of Islam. He was an Abyssinian slave who faced severe torture for accepting Islam. Abu Bakr purchased and freed him. He endured torture while proclaiming "Ahad, Ahad" (God is One).',
      ru:'Биляль ибн Рабах был первым муэдзином в Исламе. Он был абиссинским рабом, подвергшимся жестоким пыткам за принятие Ислама. Абу Бакр купил и освободил его. Он переносил пытки, произнося «Ахад, Ахад» (Бог Один).',
      ar:'بلال بن رباح كان أول مؤذن في الإسلام. كان عبدًا حبشيًا تعرض لعذاب شديد بسبب إسلامه. اشتراه أبو بكر وأعتقه. تحمل العذاب وهو يردد "أحد أحد".',
      tr:'Bilal ibn Rebah, İslam\'ın ilk müezzinidir. Habeşistanlı bir köleydi ve İslam\'ı kabul ettiği için ağır işkencelere maruz kaldı. Ebu Bekir onu satın alıp azat etti. "Ehad, Ehad" (Allah birdir) diyerek işkencelere dayandı.',
    },
    facts: [
      { az:'İslama ilk iman gətirən kölələrdəndir', en:'Among the first slaves to accept Islam', ru:'Один из первых рабов, принявших Ислам', ar:'من أوائل العبيد الذين أسلموا', tr:'İslam\'ı kabul eden ilk kölelerden biri' },
      { az:'Bədr, Uhud və bütün döyüşlərdə iştirak etmişdir', en:'Participated in Badr, Uhud, and all battles', ru:'Участвовал в битвах при Бадре, Ухуде и всех остальных', ar:'شارك في بدر وأحد وجميع الغزوات', tr:'Bedir, Uhud ve tüm savaşlara katıldı' },
      { az:'Peyğəmbərdən ﷺ sonra azan verməmişdir', en:'Did not call the adhan after the Prophet ﷺ passed', ru:'Не читал азан после кончины Пророка ﷺ', ar:'لم يؤذن بعد وفاة النبي ﷺ', tr:'Peygamber\'den ﷺ sonra ezan okumadı' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: سمعتُ دفَّ نعليك بين يديَّ في الجنة', source:'Buxari 1149', az:'Peyğəmbər ﷺ Bilala buyurdu: "Cənnətdə sənin ayaqqabılarının səsini qarşımda eşitdim."', en:'The Prophet ﷺ said to Bilal: "I heard the sound of your footsteps ahead of me in Paradise."', ru:'Пророк ﷺ сказал Билялю: «Я слышал звук твоих шагов впереди меня в Раю.»', tr:'Peygamber ﷺ Bilal\'e buyurdu: "Cennet\'te ayakkabılarının sesini önümde duydum."' },
      { ar:'قال رسول الله ﷺ: يا بلالُ قُم فأذِّن', source:'Buxari 604', az:'Peyğəmbər ﷺ buyurdu: "Ey Bilal, qalx azan ver."', en:'The Prophet ﷺ said: "O Bilal, stand up and call the adhan."', ru:'Пророк ﷺ сказал: «О Биляль, встань и объяви азан.»', tr:'Peygamber ﷺ buyurdu: "Ey Bilal, kalk ve ezan oku."' },
      { ar:'قال رسول الله ﷺ: إن بلالًا يؤذِّن بليلٍ فكلوا واشربوا حتى يؤذِّن ابنُ أمِّ مكتوم', source:'Buxari 620', az:'Peyğəmbər ﷺ buyurdu: "Bilal gecə azan verir, İbn Umm Məktum azan verənə qədər yeyib için."', en:'The Prophet ﷺ said: "Bilal calls the adhan at night, so eat and drink until Ibn Umm Maktum calls the adhan."', ru:'Пророк ﷺ сказал: «Биляль объявляет азан ночью, ешьте и пейте, пока Ибн Умм Мактум не объявит азан.»', tr:'Peygamber ﷺ buyurdu: "Bilal gece ezan okur, İbn Ümmü Mektum ezan okuyana kadar yiyip için."' },
      { ar:'مرَّ رسول الله ﷺ على بلالٍ وهو يُعذَّب فقال: صبرًا آلَ ياسر فإن موعدكم الجنة', source:'Hakim 5666', az:'Peyğəmbər ﷺ Bilalın işgəncəyə məruz qaldığını gördü və onu səbrə çağırdı.', en:'The Prophet ﷺ saw Bilal being tortured and called him to patience.', ru:'Пророк ﷺ увидел, как Биляля пытают, и призвал его к терпению.', tr:'Peygamber ﷺ Bilal\'in işkence gördüğünü gördü ve onu sabra çağırdı.' },
      { ar:'قال رسول الله ﷺ: أشدُّ الناس عذابًا يوم القيامة من قتل نبيًّا أو قتلَه نبيٌّ', source:'Əhməd', az:'Bilal rəvayət etdi ki, Peyğəmbər ﷺ zülmkarların axirətdəki əzabı barədə xəbərdarlıq etdi.', en:'Bilal narrated that the Prophet ﷺ warned about the punishment of oppressors in the Hereafter.', ru:'Биляль передал, что Пророк ﷺ предупреждал о наказании угнетателей в Судный день.', tr:'Bilal rivayet etti ki, Peygamber ﷺ zalimlerin ahiretteki azabı hakkında uyardı.' },
    ],
  },
  {
    id: 9,
    name: { ar:'أبو هريرة', az:'Əbu Hureyrə', en:'Abu Hurairah', ru:'Абу Хурайра', tr:'Ebu Hureyre' },
    title: { az:'Ən çox hədis rəvayət edən', en:'Most prolific hadith narrator', ru:'Самый плодовитый передатчик хадисов', ar:'أكثر الصحابة رواية للحديث', tr:'En çok hadis rivayet eden' },
    bio: {
      az:'Əbu Hureyrə 5374 hədis rəvayət etməklə ən çox hədis rəvayət edən səhabədir. Peyğəmbərlə ﷺ 3 il birlikdə olmasına baxmayaraq, güclü yaddaşı sayəsində ən çox hədis rəvayət edən kişi olmuşdur.',
      en:'Abu Hurairah narrated 5,374 hadiths, making him the most prolific hadith narrator among the companions. Despite being with the Prophet ﷺ for only 3 years, his strong memory made him the top narrator.',
      ru:'Абу Хурайра передал 5374 хадиса, что делает его самым плодовитым передатчиком хадисов среди сподвижников. Несмотря на то, что он был с Пророком ﷺ всего 3 года, его сильная память сделала его главным передатчиком.',
      ar:'أبو هريرة روى 5374 حديثًا مما يجعله أكثر الصحابة رواية للحديث. رغم صحبته للنبي ﷺ ثلاث سنوات فقط إلا أن ذاكرته القوية جعلته أكثر الرواة.',
      tr:'Ebu Hureyre, 5374 hadis rivayet ederek sahabeler arasında en çok hadis rivayet eden kişi olmuştur. Peygamber ﷺ ile sadece 3 yıl birlikte olmasına rağmen, güçlü hafızası onu en çok rivayet eden kişi yaptı.',
    },
    facts: [
      { az:'5374 hədis rəvayət etmişdir', en:'Narrated 5,374 hadiths', ru:'Передал 5374 хадиса', ar:'روى 5374 حديثًا', tr:'5374 hadis rivayet etti' },
      { az:'Əsl adı Əbdürrəhman ibn Saxr əd-Dövsidir', en:'Real name is Abdur-Rahman ibn Sakhr ad-Dawsi', ru:'Настоящее имя — Абдуррахман ибн Сахр ад-Дауси', ar:'اسمه الحقيقي عبد الرحمن بن صخر الدوسي', tr:'Gerçek adı Abdurrahman ibn Sahr ed-Devsi\'dir' },
      { az:'Pişik sevgisi üçün "Əbu Hureyrə" (pişiklərin atası) ləqəbi almışdır', en:'Got the name "Abu Hurairah" (father of kittens) for his love of cats', ru:'Получил имя «Абу Хурайра» (отец котят) за любовь к кошкам', ar:'سُمِّي "أبو هريرة" لحبه للقطط', tr:'Kedi sevgisi nedeniyle "Ebu Hureyre" (kedilerin babası) lakabını aldı' },
    ],
    hadiths: [
      { ar:'عن أبي هريرة قال: قال رسول الله ﷺ: من سلك طريقًا يلتمس فيه علمًا سهَّل الله له طريقًا إلى الجنة', source:'Muslim 2699', az:'Əbu Hureyrə rəvayət etdi: Peyğəmbər ﷺ buyurdu: "Kim elm öyrənmək üçün bir yola çıxarsa, Allah ona Cənnətə gedən yolu asanlaşdırar."', en:'Abu Hurairah narrated: The Prophet ﷺ said: "Whoever takes a path seeking knowledge, Allah makes the path to Paradise easy for him."', ru:'Абу Хурайра передал: Пророк ﷺ сказал: «Кто встанет на путь в поисках знания, Аллах облегчит ему путь в Рай.»', tr:'Ebu Hureyre rivayet etti: Peygamber ﷺ buyurdu: "Kim ilim öğrenmek için bir yola çıkarsa, Allah ona Cennet\'e giden yolu kolaylaştırır."' },
      { ar:'عن أبي هريرة قال: قال رسول الله ﷺ: المؤمنُ القوي خيرٌ وأحبُّ إلى الله من المؤمن الضعيف', source:'Muslim 2664', az:'Əbu Hureyrə rəvayət etdi: Peyğəmbər ﷺ buyurdu: "Güclü mömin zəif mömindən Allah üçün daha xeyirli və daha sevimlidir."', en:'Abu Hurairah narrated: The Prophet ﷺ said: "The strong believer is better and more beloved to Allah than the weak believer."', ru:'Абу Хурайра передал: Пророк ﷺ сказал: «Сильный верующий лучше и любимее для Аллаха, чем слабый верующий.»', tr:'Ebu Hureyre rivayet etti: Peygamber ﷺ buyurdu: "Güçlü mümin, zayıf müminden Allah\'a daha hayırlı ve daha sevimlidir."' },
      { ar:'عن أبي هريرة قال: قال رسول الله ﷺ: لا يدخل الجنةَ من لا يأمن جارُه بوائقَه', source:'Muslim 46', az:'Əbu Hureyrə rəvayət etdi: Peyğəmbər ﷺ buyurdu: "Qonşusu zərərindən əmin olmayan kimsə Cənnətə girməz."', en:'Abu Hurairah narrated: The Prophet ﷺ said: "He whose neighbor is not safe from his harm will not enter Paradise."', ru:'Абу Хурайра передал: Пророк ﷺ сказал: «Не войдёт в Рай тот, чей сосед не в безопасности от его вреда.»', tr:'Ebu Hureyre rivayet etti: Peygamber ﷺ buyurdu: "Komşusu zararından emin olmayan kimse Cennet\'e giremez."' },
      { ar:'عن أبي هريرة قال: قال رسول الله ﷺ: تبسُّمُك في وجه أخيك صدقة', source:'Tirmizi 1956', az:'Əbu Hureyrə rəvayət etdi: Peyğəmbər ﷺ buyurdu: "Qardaşının üzünə gülümsəməyin sədəqədir."', en:'Abu Hurairah narrated: The Prophet ﷺ said: "Your smile in the face of your brother is charity."', ru:'Абу Хурайра передал: Пророк ﷺ сказал: «Твоя улыбка брату — это милостыня.»', tr:'Ebu Hureyre rivayet etti: Peygamber ﷺ buyurdu: "Kardeşinin yüzüne gülümsemen sadakadır."' },
      { ar:'عن أبي هريرة قال: قال رسول الله ﷺ: من كان يؤمن بالله واليوم الآخر فليقل خيرًا أو ليصمت', source:'Buxari 6018', az:'Əbu Hureyrə rəvayət etdi: Peyğəmbər ﷺ buyurdu: "Allaha və axirət gününə iman edən xeyir söyləsin, ya da sussun."', en:'Abu Hurairah narrated: The Prophet ﷺ said: "Whoever believes in Allah and the Last Day should speak good or remain silent."', ru:'Абу Хурайра передал: Пророк ﷺ сказал: «Кто верит в Аллаха и Судный день, пусть говорит благое или молчит.»', tr:'Ebu Hureyre rivayet etti: Peygamber ﷺ buyurdu: "Allah\'a ve ahiret gününe iman eden, ya hayır söylesin ya da sussun."' },
    ],
  },
  {
    id: 10,
    name: { ar:'عبد الله بن مسعود', az:'Abdullah ibn Məsud', en:'Abdullah ibn Masud', ru:'Абдуллах ибн Масуд', tr:'Abdullah ibn Mesud' },
    title: { az:'Quran mütəxəssisi', en:'Quran expert', ru:'Эксперт по Корану', ar:'خبير القرآن', tr:'Kur\'an uzmanı' },
    bio: {
      az:'Abdullah ibn Məsud İslama ilk iman gətirən altıncı şəxsdir. Quranı ən yaxşı bilən səhabələrdən biri idi. Peyğəmbər ﷺ onun Quran oxumasını dinləməyi çox sevərdi.',
      en:'Abdullah ibn Masud was the sixth person to accept Islam. He was one of the companions who knew the Quran best. The Prophet ﷺ loved listening to his Quran recitation.',
      ru:'Абдуллах ибн Масуд был шестым человеком, принявшим Ислам. Он был одним из сподвижников, лучше всех знавших Коран. Пророк ﷺ любил слушать его чтение Корана.',
      ar:'عبد الله بن مسعود كان سادس من أسلم. كان من أعلم الصحابة بالقرآن. كان النبي ﷺ يحب سماع تلاوته للقرآن.',
      tr:'Abdullah ibn Mesud, İslam\'ı kabul eden altıncı kişidir. Kur\'an\'ı en iyi bilen sahabelerden biriydi. Peygamber ﷺ onun Kur\'an okumasını dinlemeyi çok severdi.',
    },
    facts: [
      { az:'İslama iman gətirən altıncı şəxsdir', en:'Sixth person to accept Islam', ru:'Шестой человек, принявший Ислам', ar:'سادس من أسلم', tr:'İslam\'ı kabul eden altıncı kişi' },
      { az:'Peyğəmbər ﷺ onun Quran oxumasını dinləməyi sevərdi', en:'The Prophet ﷺ loved listening to his Quran recitation', ru:'Пророк ﷺ любил слушать его чтение Корана', ar:'كان النبي ﷺ يحب سماع تلاوته', tr:'Peygamber ﷺ onun Kur\'an okumasını dinlemeyi severdi' },
      { az:'Kufə elm məktəbinin qurucusudur', en:'Founder of the Kufa school of knowledge', ru:'Основатель куфийской школы знаний', ar:'مؤسس مدرسة الكوفة العلمية', tr:'Kûfe ilim okulunun kurucusudur' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: من أحبَّ أن يقرأ القرآنَ غضًّا كما أُنزل فليقرأه على قراءة ابن أمِّ عبد', source:'İbn Macə 138', az:'Peyğəmbər ﷺ buyurdu: "Kim Quranı endirildiyi kimi təzə oxumaq istəyirsə, İbn Umm Abdin (İbn Məsudun) qiraəti ilə oxusun."', en:'The Prophet ﷺ said: "Whoever wants to recite the Quran fresh as it was revealed, let him recite it according to the reading of Ibn Umm Abd (Ibn Masud)."', ru:'Пророк ﷺ сказал: «Кто хочет читать Коран свежим, как он был ниспослан, пусть читает по чтению Ибн Умм Абда (Ибн Масуда).»', tr:'Peygamber ﷺ buyurdu: "Kim Kur\'an\'ı indirildiği gibi taze okumak istiyorsa, İbn Ümmü Abd\'in (İbn Mesud\'un) kıraatiyle okusun."' },
      { ar:'عن عبد الله بن مسعود قال: قال رسول الله ﷺ: اقرأ عليَّ. قلتُ: أقرأ عليك وعليك أُنزل؟ قال: إني أحبُّ أن أسمعه من غيري', source:'Buxari 5049', az:'İbn Məsud dedi: Peyğəmbər ﷺ "Mənə oxu" dedi. Dedim: "Sənə oxuyum, halbuki sənə endirilmişdir?" Buyurdu: "Mən onu başqasından eşitməyi sevirəm."', en:'Ibn Masud said: The Prophet ﷺ said "Recite to me." I said: "Shall I recite to you when it was revealed to you?" He said: "I love to hear it from others."', ru:'Ибн Масуд сказал: Пророк ﷺ сказал «Прочти мне.» Я сказал: «Читать тебе, когда тебе ниспослано?» Он сказал: «Я люблю слушать от других.»', tr:'İbn Mesud dedi: Peygamber ﷺ "Bana oku" dedi. Dedim: "Sana mı okuyayım, oysa sana indirildi?" Buyurdu: "Ben onu başkasından dinlemeyi severim."' },
      { ar:'عن ابن مسعود قال: قال رسول الله ﷺ: إن الصدق يهدي إلى البرِّ وإن البرَّ يهدي إلى الجنة', source:'Buxari 6094', az:'İbn Məsud rəvayət etdi: Peyğəmbər ﷺ buyurdu: "Doğruluq yaxşılığa aparır, yaxşılıq isə Cənnətə aparır."', en:'Ibn Masud narrated: The Prophet ﷺ said: "Truthfulness leads to righteousness, and righteousness leads to Paradise."', ru:'Ибн Масуд передал: Пророк ﷺ сказал: «Правдивость ведёт к праведности, а праведность ведёт в Рай.»', tr:'İbn Mesud rivayet etti: Peygamber ﷺ buyurdu: "Doğruluk iyiliğe götürür, iyilik de Cennet\'e götürür."' },
      { ar:'عن ابن مسعود قال: قال رسول الله ﷺ: سبابُ المسلم فسوقٌ وقتالُه كفر', source:'Buxari 48', az:'İbn Məsud rəvayət etdi: Peyğəmbər ﷺ buyurdu: "Müsəlmana söymək fasiqlik, onunla döyüşmək küfrdür."', en:'Ibn Masud narrated: The Prophet ﷺ said: "Insulting a Muslim is sinfulness and fighting him is disbelief."', ru:'Ибн Масуд передал: Пророк ﷺ сказал: «Ругать мусульманина — нечестие, а сражаться с ним — неверие.»', tr:'İbn Mesud rivayet etti: Peygamber ﷺ buyurdu: "Müslümana sövmek fısktır, onunla savaşmak küfürdür."' },
      { ar:'عن ابن مسعود قال: خطَّ لنا رسول الله ﷺ خطًّا ثم قال: هذا سبيلُ الله', source:'Əhməd 4142', az:'İbn Məsud dedi: Peyğəmbər ﷺ bir xətt çəkdi və "Bu Allahın yoludur" buyurdu.', en:'Ibn Masud said: The Prophet ﷺ drew a line and said: "This is the path of Allah."', ru:'Ибн Масуд сказал: Пророк ﷺ провёл линию и сказал: «Это путь Аллаха.»', tr:'İbn Mesud dedi: Peygamber ﷺ bir çizgi çizdi ve "Bu Allah\'ın yoludur" buyurdu.' },
    ],
  },
  {
    id: 11,
    name: { ar:'سلمان الفارسي', az:'Salman əl-Farisi', en:'Salman al-Farisi', ru:'Сальман аль-Фариси', tr:'Selman el-Farisi' },
    title: { az:'Fars səhabə', en:'Persian companion', ru:'Персидский сподвижник', ar:'الصحابي الفارسي', tr:'Fars sahabe' },
    bio: {
      az:'Salman əl-Farisi İranın İsfahan şəhərindən olan səhabədir. Haqq dini axtararaq uzun bir səyahət etmiş, nəhayət Mədinədə Peyğəmbərə ﷺ qovuşmuşdur. Xəndək döyüşündə xəndək qazmaq fikrini vermişdir.',
      en:'Salman al-Farisi was a companion from Isfahan, Persia. He undertook a long journey seeking the true religion, finally meeting the Prophet ﷺ in Medina. He suggested digging the trench in the Battle of the Trench.',
      ru:'Сальман аль-Фариси был сподвижником из Исфахана, Персия. Он совершил долгое путешествие в поисках истинной религии, наконец встретив Пророка ﷺ в Медине. Он предложил выкопать ров в Битве у Рва.',
      ar:'سلمان الفارسي كان صحابيًا من أصفهان في فارس. قام برحلة طويلة بحثًا عن الدين الحق حتى التقى بالنبي ﷺ في المدينة. اقترح حفر الخندق في غزوة الخندق.',
      tr:'Selman el-Farisi, İran\'ın İsfahan şehrinden bir sahabeydi. Hak dini arayarak uzun bir yolculuk yaptı ve sonunda Medine\'de Peygamber\'le ﷺ buluştu. Hendek Savaşı\'nda hendek kazma fikrini verdi.',
    },
    facts: [
      { az:'İrandan gəlib İslamı qəbul etmişdir', en:'Came from Persia and accepted Islam', ru:'Пришёл из Персии и принял Ислам', ar:'جاء من فارس وأسلم', tr:'İran\'dan gelip İslam\'ı kabul etti' },
      { az:'Xəndək qazmaq fikrini vermişdir', en:'Suggested digging the trench', ru:'Предложил выкопать ров', ar:'اقترح حفر الخندق', tr:'Hendek kazma fikrini verdi' },
      { az:'Peyğəmbər ﷺ onu "Əhli-beytdən" saymışdır', en:'The Prophet ﷺ counted him among Ahlul-Bayt', ru:'Пророк ﷺ отнёс его к Ахлюль-Бейту', ar:'عدَّه النبي ﷺ من أهل البيت', tr:'Peygamber ﷺ onu Ehl-i Beyt\'ten saydı' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: سلمان منا أهلَ البيت', source:'Hakim 6541', az:'Peyğəmbər ﷺ buyurdu: "Salman bizdən, Əhli-beytdəndir."', en:'The Prophet ﷺ said: "Salman is from us, the Ahlul-Bayt."', ru:'Пророк ﷺ сказал: «Сальман — от нас, от Ахлюль-Бейта.»', tr:'Peygamber ﷺ buyurdu: "Selman bizdendir, Ehl-i Beyt\'tendir."' },
      { ar:'عن سلمان قال: قال رسول الله ﷺ: لا يغتسل رجلٌ يوم الجمعة ويتطهَّر ما استطاع ثم يبكِّر فيجلس قريبًا من الإمام ثم ينصت إلا غُفر له ما بينه وبين الجمعة الأخرى', source:'Buxari 883', az:'Salman rəvayət etdi: Peyğəmbər ﷺ buyurdu: "Kim Cümə günü yuyunub təmizlənər, erkən gedib imama yaxın oturar və susarsa, iki Cümə arasındakı günahları bağışlanar."', en:'Salman narrated: The Prophet ﷺ said: "Whoever bathes on Friday, purifies himself, goes early, sits near the imam, and listens, his sins between two Fridays are forgiven."', ru:'Сальман передал: Пророк ﷺ сказал: «Кто искупается в пятницу, очистится, придёт рано, сядет близко к имаму и будет молча слушать, тому простятся грехи между двумя пятницами.»', tr:'Selman rivayet etti: Peygamber ﷺ buyurdu: "Kim Cuma günü yıkanıp temizlenir, erken gidip imama yakın oturur ve susarsa, iki Cuma arasındaki günahları bağışlanır."' },
      { ar:'قال سلمان: علَّمنا رسول الله ﷺ كلَّ شيء حتى الخِراءة', source:'Muslim 262', az:'Salman dedi: "Peyğəmbər ﷺ bizə hər şeyi öyrətdi, hətta tualetə getməyi belə."', en:'Salman said: "The Prophet ﷺ taught us everything, even how to use the bathroom."', ru:'Сальман сказал: «Пророк ﷺ научил нас всему, даже справлению нужды.»', tr:'Selman dedi: "Peygamber ﷺ bize her şeyi öğretti, tuvalete gitmeyi bile."' },
      { ar:'قال رسول الله ﷺ: لو كان الدينُ عند الثريا لنالَه رجالٌ من فارس', source:'Buxari 4897', az:'Peyğəmbər ﷺ buyurdu: "Əgər din Sürəyya ulduzunda olsaydı, Fars oğulları ona yetişərdilər."', en:'The Prophet ﷺ said: "If the religion were at the Pleiades, men from Persia would reach it."', ru:'Пророк ﷺ сказал: «Если бы религия была у Плеяд, мужи из Персии достигли бы её.»', tr:'Peygamber ﷺ buyurdu: "Din Süreyya yıldızında olsaydı, Fars oğulları ona ulaşırdı."' },
      { ar:'عن سلمان قال: قال رسول الله ﷺ: إن الله حييٌّ كريمٌ يستحيي إذا رفع الرجلُ إليه يديه أن يردَّهما صِفرًا خائبتين', source:'Əbu Davud 1488', az:'Salman rəvayət etdi: Peyğəmbər ﷺ buyurdu: "Allah həyalı və kərimdir; qul əllərini qaldıranda onları boş qaytarmaqdan həya edər."', en:'Salman narrated: The Prophet ﷺ said: "Allah is Shy and Generous; He is ashamed to turn away empty the hands of His servant when raised to Him."', ru:'Сальман передал: Пророк ﷺ сказал: «Аллах Стыдливый и Щедрый; Ему стыдно вернуть пустыми руки Своего раба, поднятые к Нему.»', tr:'Selman rivayet etti: Peygamber ﷺ buyurdu: "Allah Hayiy ve Kerim\'dir; kul ellerini kaldırdığında onları boş çevirmekten hayâ eder."' },
    ],
  },
  {
    id: 12,
    name: { ar:'أبو ذر الغفاري', az:'Əbu Zərr əl-Ğifari', en:'Abu Dharr al-Ghifari', ru:'Абу Зарр аль-Гифари', tr:'Ebu Zer el-Gıfari' },
    title: { az:'Zahid səhabə', en:'Ascetic companion', ru:'Аскетичный сподвижник', ar:'الصحابي الزاهد', tr:'Zahit sahabe' },
    bio: {
      az:'Əbu Zərr əl-Ğifari dünyadan uzaqlaşması, doğruluğu və səxavəti ilə tanınırdı. Peyğəmbər ﷺ onun doğruluğunu göyün altındakı ən doğru sözlü insana bənzətmişdir.',
      en:'Abu Dharr al-Ghifari was known for his asceticism, truthfulness, and generosity. The Prophet ﷺ compared his truthfulness to the most truthful person under the sky.',
      ru:'Абу Зарр аль-Гифари был известен своим аскетизмом, правдивостью и щедростью. Пророк ﷺ сравнил его правдивость с самым правдивым человеком под небом.',
      ar:'أبو ذر الغفاري كان معروفًا بزهده وصدقه وسخائه. شبَّه النبي ﷺ صدقه بأصدق من تحت السماء.',
      tr:'Ebu Zer el-Gıfari, zühdü, doğruluğu ve cömertliği ile tanınırdı. Peygamber ﷺ onun doğruluğunu gökyüzü altındaki en doğru sözlü insana benzetmiştir.',
    },
    facts: [
      { az:'İslama iman gətirən beşinci şəxsdir', en:'Fifth person to accept Islam', ru:'Пятый человек, принявший Ислам', ar:'خامس من أسلم', tr:'İslam\'ı kabul eden beşinci kişi' },
      { az:'Dünyadan uzaq, zahidanə bir həyat yaşamışdır', en:'Lived an ascetic life, far from worldly pleasures', ru:'Жил аскетической жизнью, далёкой от мирских удовольствий', ar:'عاش حياة زاهدة بعيدة عن الدنيا', tr:'Dünyadan uzak, zahidâne bir hayat yaşadı' },
      { az:'Peyğəmbər ﷺ onu "Yerin İsası" adlandırmışdır', en:'The Prophet ﷺ called him "the Isa of the Earth"', ru:'Пророк ﷺ назвал его «Исой земли»', ar:'سماه النبي ﷺ "عيسى الأرض"', tr:'Peygamber ﷺ onu "Yeryüzünün İsa\'sı" olarak adlandırdı' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: ما أقلَّت الغبراءُ ولا أظلَّت الخضراءُ من رجلٍ أصدقَ من أبي ذر', source:'Tirmizi 3801', az:'Peyğəmbər ﷺ buyurdu: "Yer üzü Əbu Zərrdən daha doğru sözlü bir adam daşımamış, göy örtməmişdir."', en:'The Prophet ﷺ said: "The earth has not carried nor has the sky shaded a more truthful man than Abu Dharr."', ru:'Пророк ﷺ сказал: «Земля не носила и небо не укрывало более правдивого человека, чем Абу Зарр.»', tr:'Peygamber ﷺ buyurdu: "Yeryüzü Ebu Zer\'den daha doğru sözlü birini taşımamış, gökyüzü gölgelendirmemiştir."' },
      { ar:'عن أبي ذر قال: قال رسول الله ﷺ: لا تحقرنَّ من المعروف شيئًا ولو أن تلقى أخاك بوجهٍ طَلِق', source:'Muslim 2626', az:'Əbu Zərr rəvayət etdi: Peyğəmbər ﷺ buyurdu: "Heç bir yaxşılığı kiçik görməyin, hətta qardaşını güləş üzlə qarşılamağı belə."', en:'Abu Dharr narrated: The Prophet ﷺ said: "Do not belittle any good deed, even meeting your brother with a cheerful face."', ru:'Абу Зарр передал: Пророк ﷺ сказал: «Не пренебрегай никаким добрым делом, даже встречей брата с радостным лицом.»', tr:'Ebu Zer rivayet etti: Peygamber ﷺ buyurdu: "Hiçbir iyiliği küçümsemeyin, kardeşinizi güler yüzle karşılamayı bile."' },
      { ar:'عن أبي ذر قال: أوصاني خليلي ﷺ بخصالٍ من الخير: أن لا أنظر إلى من هو فوقي وأن أنظر إلى من هو دوني', source:'Əhməd 21458', az:'Əbu Zərr dedi: "Dostum ﷺ mənə tövsiyə etdi: özümdən yuxarıdakılara baxmayım, aşağıdakılara baxım."', en:'Abu Dharr said: "My close friend ﷺ advised me: not to look at those above me, but to look at those below me."', ru:'Абу Зарр сказал: «Мой близкий друг ﷺ посоветовал мне: не смотреть на тех, кто выше меня, а смотреть на тех, кто ниже.»', tr:'Ebu Zer dedi: "Dostum ﷺ bana tavsiye etti: benden üsttekilere değil, altımdakilere bakmamı."' },
      { ar:'عن أبي ذر قال: قال رسول الله ﷺ: إنكم ستفتحون أرضًا يُذكر فيها القيراط فاستوصوا بأهلها خيرًا', source:'Muslim 2543', az:'Əbu Zərr rəvayət etdi: Peyğəmbər ﷺ Misirin fəthini xəbər verərək xalqına yaxşı davranmağı tövsiyə etdi.', en:'Abu Dharr narrated: The Prophet ﷺ foretold the conquest of Egypt and advised treating its people well.', ru:'Абу Зарр передал: Пророк ﷺ предсказал завоевание Египта и завещал хорошо обращаться с его народом.', tr:'Ebu Zer rivayet etti: Peygamber ﷺ Mısır\'ın fethini haber vererek halkına iyi davranmayı tavsiye etti.' },
      { ar:'عن أبي ذر قال: قال لي رسول الله ﷺ: اتقِ الله حيثما كنتَ وأتبع السيئةَ الحسنةَ تمحُها وخالق الناسَ بخُلُقٍ حسن', source:'Tirmizi 1987', az:'Əbu Zərr dedi: Peyğəmbər ﷺ mənə buyurdu: "Harada olursan ol Allahdan qorx, pis işin ardınca yaxşı iş et — onu silər, insanlarla gözəl əxlaqla davran."', en:'Abu Dharr said: The Prophet ﷺ told me: "Fear Allah wherever you are, follow a bad deed with a good one to erase it, and treat people with good character."', ru:'Абу Зарр сказал: Пророк ﷺ сказал мне: «Бойся Аллаха, где бы ты ни был, за плохим делом следуй хорошим — оно его сотрёт, и обращайся с людьми хорошо.»', tr:'Ebu Zer dedi: Peygamber ﷺ bana buyurdu: "Nerede olursan ol Allah\'tan kork, kötülüğün ardından iyilik yap — onu siler, insanlara güzel ahlâkla davran."' },
    ],
  },
  {
    id: 13,
    name: { ar:'معاذ بن جبل', az:'Muaz ibn Cəbəl', en:'Muadh ibn Jabal', ru:'Муаз ибн Джабаль', tr:'Muaz ibn Cebel' },
    title: { az:'Halal-haram alimi', en:'Scholar of halal and haram', ru:'Учёный дозволенного и запретного', ar:'عالم الحلال والحرام', tr:'Helal-haram alimi' },
    bio: {
      az:'Muaz ibn Cəbəl halal və haramı ən yaxşı bilən səhabələrdən biri idi. Peyğəmbər ﷺ onu Yəmənə vali və müəllim olaraq göndərmişdir. Gənc yaşına baxmayaraq dərin elmi ilə seçilirdi.',
      en:'Muadh ibn Jabal was one of the companions who best knew halal and haram. The Prophet ﷺ sent him to Yemen as governor and teacher. Despite his young age, he was distinguished by his deep knowledge.',
      ru:'Муаз ибн Джабаль был одним из сподвижников, лучше всех знавших дозволенное и запретное. Пророк ﷺ отправил его в Йемен правителем и учителем. Несмотря на молодой возраст, он отличался глубокими знаниями.',
      ar:'معاذ بن جبل كان من أعلم الصحابة بالحلال والحرام. أرسله النبي ﷺ إلى اليمن واليًا ومعلمًا. تميز بعلمه الغزير رغم صغر سنه.',
      tr:'Muaz ibn Cebel, helal ve haramı en iyi bilen sahabelerden biriydi. Peygamber ﷺ onu Yemen\'e vali ve öğretmen olarak gönderdi. Genç yaşına rağmen derin ilmiyle öne çıkıyordu.',
    },
    facts: [
      { az:'Peyğəmbər ﷺ onu Yəmənə vali göndərmişdir', en:'The Prophet ﷺ sent him as governor to Yemen', ru:'Пророк ﷺ отправил его правителем в Йемен', ar:'أرسله النبي ﷺ واليًا إلى اليمن', tr:'Peygamber ﷺ onu Yemen\'e vali gönderdi' },
      { az:'Qiyamət günü alimlərin öndə gedəcəyi xəbər verilmişdir', en:'Told he would lead the scholars on the Day of Judgment', ru:'Было сообщено, что он будет впереди учёных в Судный день', ar:'أُخبر بأنه يتقدم العلماء يوم القيامة', tr:'Kıyamet günü alimlerin önünde yürüyeceği haber verildi' },
      { az:'34 yaşında Şamda vəba xəstəliyindən vəfat etmişdir', en:'Died of plague in Syria at age 34', ru:'Умер от чумы в Сирии в возрасте 34 лет', ar:'توفي بالطاعون في الشام وعمره 34 سنة', tr:'34 yaşında Şam\'da vebadan vefat etti' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: يا معاذ، والله إني لأحبُّك، فلا تنسَ أن تقول دبر كل صلاة: اللهم أعنِّي على ذكرك وشكرك وحسن عبادتك', source:'Əbu Davud 1522', az:'Peyğəmbər ﷺ buyurdu: "Ey Muaz, Allaha and olsun ki səni sevirəm. Hər namazdan sonra bunu deməyi unutma: Allahım, Səni zikr etməkdə, Sənə şükr etməkdə və gözəl ibadət etməkdə mənə kömək et."', en:'The Prophet ﷺ said: "O Muadh, by Allah I love you. Do not forget to say after every prayer: O Allah, help me remember You, thank You, and worship You well."', ru:'Пророк ﷺ сказал: «О Муаз, клянусь Аллахом, я люблю тебя. Не забывай говорить после каждой молитвы: О Аллах, помоги мне поминать Тебя, благодарить Тебя и хорошо поклоняться Тебе.»', tr:'Peygamber ﷺ buyurdu: "Ey Muaz, Allah\'a yemin olsun seni seviyorum. Her namazdan sonra şunu söylemeyi unutma: Allah\'ım, Seni zikretmemde, Sana şükretmemde ve güzel ibadet etmemde bana yardım et."' },
      { ar:'عن معاذ قال: قال رسول الله ﷺ: اتقِ الله حيثما كنت', source:'Tirmizi 1987', az:'Muaz rəvayət etdi: Peyğəmbər ﷺ buyurdu: "Harada olursan ol Allahdan qorx."', en:'Muadh narrated: The Prophet ﷺ said: "Fear Allah wherever you are."', ru:'Муаз передал: Пророк ﷺ сказал: «Бойся Аллаха, где бы ты ни был.»', tr:'Muaz rivayet etti: Peygamber ﷺ buyurdu: "Nerede olursan ol Allah\'tan kork."' },
      { ar:'قال رسول الله ﷺ: أعلمُ أمتي بالحلال والحرام معاذُ بن جبل', source:'Tirmizi 3790', az:'Peyğəmbər ﷺ buyurdu: "Ümmətimin halal və haramı ən yaxşı bilən Muaz ibn Cəbəldir."', en:'The Prophet ﷺ said: "The most knowledgeable of my Ummah regarding halal and haram is Muadh ibn Jabal."', ru:'Пророк ﷺ сказал: «Самый знающий в моей Умме о дозволенном и запретном — Муаз ибн Джабаль.»', tr:'Peygamber ﷺ buyurdu: "Ümmetimin helal ve haramı en iyi bileni Muaz ibn Cebel\'dir."' },
      { ar:'قال رسول الله ﷺ لمعاذ: بِمَ تحكم؟ قال: بكتاب الله. قال: فإن لم تجد؟ قال: بسنة رسول الله. قال: فإن لم تجد؟ قال: أجتهد رأيي', source:'Əbu Davud 3592', az:'Peyğəmbər ﷺ Muaza dedi: "Nə ilə hökm verərsən?" Dedi: "Allahın kitabı ilə." "Tapmasam?" "Peyğəmbərin sünnəsi ilə." "Tapmasam?" "İctihadımla."', en:'The Prophet ﷺ asked Muadh: "By what will you judge?" He said: "By the Book of Allah." "If not found?" "By the Sunnah." "If not found?" "By my own reasoning."', ru:'Пророк ﷺ спросил Муаза: «Чем будешь судить?» Он ответил: «Книгой Аллаха.» «Если не найдёшь?» «Сунной Посланника.» «Если не найдёшь?» «Своим мнением.»', tr:'Peygamber ﷺ Muaz\'a dedi: "Neyle hüküm verirsin?" Dedi: "Allah\'ın kitabıyla." "Bulamazsan?" "Peygamber\'in sünnetiyle." "Bulamazsan?" "Kendi içtihadımla."' },
      { ar:'عن معاذ قال: كنتُ رديفَ النبي ﷺ فقال: هل تدري ما حقُّ الله على العباد؟ أن يعبدوه ولا يشركوا به شيئًا', source:'Buxari 2856', az:'Muaz dedi: Peyğəmbərlə ﷺ minirdim, buyurdu: "Allahın qullar üzərindəki haqqının nə olduğunu bilirsənmi? Ona ibadət etmək və heç nəyi şərik qoşmamaq."', en:'Muadh said: I was riding with the Prophet ﷺ and he said: "Do you know what is Allah\'s right over His servants? To worship Him and not associate anything with Him."', ru:'Муаз сказал: Я ехал с Пророком ﷺ и он сказал: «Знаешь ли ты, что есть право Аллаха над Его рабами? Поклоняться Ему и не придавать Ему сотоварищей.»', tr:'Muaz dedi: Peygamber ﷺ ile binicisiydim, buyurdu: "Allah\'ın kullar üzerindeki hakkının ne olduğunu bilir misin? Ona ibadet etmek ve hiçbir şeyi ortak koşmamak."' },
    ],
  },
  {
    id: 14,
    name: { ar:'زيد بن حارثة', az:'Zeyd ibn Harisə', en:'Zaid ibn Harithah', ru:'Зайд ибн Хариса', tr:'Zeyd ibn Harise' },
    title: { az:'Peyğəmbərin oğulluğu', en:'Adopted son of the Prophet', ru:'Приёмный сын Пророка', ar:'ابن النبي بالتبني', tr:'Peygamber\'in evlatlığı' },
    bio: {
      az:'Zeyd ibn Harisə Peyğəmbərin ﷺ oğulluğa götürdüyü səhabədir. Qurani-Kərimdə adı keçən yeganə səhabədir. Mutə döyüşündə şəhid olmuşdur.',
      en:'Zaid ibn Harithah was the companion adopted by Prophet Muhammad ﷺ. He is the only companion mentioned by name in the Quran. He was martyred in the Battle of Mu\'tah.',
      ru:'Зайд ибн Хариса был сподвижником, усыновлённым Пророком Мухаммадом ﷺ. Он единственный сподвижник, упомянутый по имени в Коране. Он пал мучеником в битве при Муте.',
      ar:'زيد بن حارثة كان الصحابي الذي تبناه النبي ﷺ. هو الصحابي الوحيد المذكور بالاسم في القرآن. استشهد في غزوة مؤتة.',
      tr:'Zeyd ibn Harise, Hz. Peygamber\'in ﷺ evlat edindiği sahabeydi. Kur\'an\'da ismiyle anılan tek sahabedir. Mute Savaşı\'nda şehit oldu.',
    },
    facts: [
      { az:'Quranda adı keçən yeganə səhabədir (Əhzab 37)', en:'Only companion mentioned by name in the Quran (Al-Ahzab 37)', ru:'Единственный сподвижник, упомянутый по имени в Коране (Аль-Ахзаб 37)', ar:'الصحابي الوحيد المذكور في القرآن بالاسم (الأحزاب 37)', tr:'Kur\'an\'da ismiyle anılan tek sahabe (Ahzab 37)' },
      { az:'İslama iman gətirən ilk azad edilmiş kölələrdəndir', en:'Among the first freed slaves to accept Islam', ru:'Один из первых освобождённых рабов, принявших Ислам', ar:'من أوائل الموالي الذين أسلموا', tr:'İslam\'ı kabul eden ilk azatlı kölelerden biri' },
      { az:'Mutə döyüşündə şəhid olmuşdur', en:'Martyred in the Battle of Mu\'tah', ru:'Пал мучеником в битве при Муте', ar:'استشهد في غزوة مؤتة', tr:'Mute Savaşı\'nda şehit oldu' },
    ],
    hadiths: [
      { ar:'كان رسول الله ﷺ يحبُّ زيدَ بنَ حارثة حبًّا شديدًا', source:'Tirmizi 3813', az:'Peyğəmbər ﷺ Zeydi çox güclü sevərdi.', en:'The Prophet ﷺ loved Zaid ibn Harithah deeply.', ru:'Пророк ﷺ очень сильно любил Зайда ибн Харису.', tr:'Peygamber ﷺ Zeyd ibn Harise\'yi çok şiddetli severdi.' },
      { ar:'قال رسول الله ﷺ لزيد: أنت أخونا ومولانا', source:'Buxari 4006', az:'Peyğəmbər ﷺ Zeydə buyurdu: "Sən bizim qardaşımız və mövlamızsan."', en:'The Prophet ﷺ said to Zaid: "You are our brother and our freed one."', ru:'Пророк ﷺ сказал Зайду: «Ты наш брат и наш вольноотпущенник.»', tr:'Peygamber ﷺ Zeyd\'e buyurdu: "Sen bizim kardeşimiz ve mevlâmızsın."' },
      { ar:'بعث رسول الله ﷺ زيدَ بنَ حارثة أميرًا على جيش مؤتة', source:'Buxari 4261', az:'Peyğəmbər ﷺ Zeydi Mutə ordusunun komandiri olaraq göndərdi.', en:'The Prophet ﷺ sent Zaid as commander of the army of Mu\'tah.', ru:'Пророк ﷺ отправил Зайда командиром армии при Муте.', tr:'Peygamber ﷺ Zeyd\'i Mute ordusunun komutanı olarak gönderdi.' },
      { ar:'لما جاء نعيُ زيدٍ بكى رسول الله ﷺ', source:'Buxari 4263', az:'Zeydin şəhid xəbəri gələndə Peyğəmbər ﷺ ağladı.', en:'When the news of Zaid\'s martyrdom came, the Prophet ﷺ wept.', ru:'Когда пришло известие о гибели Зайда, Пророк ﷺ заплакал.', tr:'Zeyd\'in şehadet haberi geldiğinde Peygamber ﷺ ağladı.' },
      { ar:'قال أسامة بن زيد: كان زيدٌ أحبَّ الناس إلى رسول الله ﷺ', source:'Tirmizi 3819', az:'Üsamə ibn Zeyd dedi: "Zeyd Peyğəmbərin ﷺ ən çox sevdiyi insanlardan idi."', en:'Usama ibn Zaid said: "Zaid was among the most beloved people to the Prophet ﷺ."', ru:'Усама ибн Зайд сказал: «Зайд был одним из самых любимых людей для Пророка ﷺ.»', tr:'Üsame ibn Zeyd dedi: "Zeyd, Peygamber\'in ﷺ en çok sevdiği insanlardandı."' },
    ],
  },
  {
    id: 15,
    name: { ar:'خالد بن الوليد', az:'Xalid ibn əl-Vəlid', en:'Khalid ibn al-Walid', ru:'Халид ибн аль-Валид', tr:'Halid ibn Velid' },
    title: { az:'Allahın Qılıncı', en:'Sword of Allah', ru:'Меч Аллаха', ar:'سيف الله المسلول', tr:'Allah\'ın Kılıcı' },
    bio: {
      az:'Xalid ibn əl-Vəlid İslam tarixinin ən böyük hərbi dahilərindən biridir. Əvvəlcə müsəlmanlara qarşı döyüşmüş, sonra İslama iman gətirərək ən uğurlu komandanlardan birinə çevrilmişdir.',
      en:'Khalid ibn al-Walid was one of the greatest military geniuses in Islamic history. Initially fighting against Muslims, he later accepted Islam and became one of the most successful commanders.',
      ru:'Халид ибн аль-Валид был одним из величайших военных гениев в истории Ислама. Сначала сражался против мусульман, затем принял Ислам и стал одним из самых успешных полководцев.',
      ar:'خالد بن الوليد كان من أعظم العبقريات العسكرية في التاريخ الإسلامي. قاتل المسلمين أولاً ثم أسلم وأصبح من أنجح القادة.',
      tr:'Halid ibn Velid, İslam tarihinin en büyük askeri dehalarından biriydi. Başlangıçta Müslümanlara karşı savaştı, sonra İslam\'ı kabul ederek en başarılı komutanlardan biri oldu.',
    },
    facts: [
      { az:'Peyğəmbər ﷺ ona "Seyfullah" (Allahın Qılıncı) ləqəbi vermişdir', en:'The Prophet ﷺ gave him the title "Saifullah" (Sword of Allah)', ru:'Пророк ﷺ дал ему прозвище «Сайфуллах» (Меч Аллаха)', ar:'لقبه النبي ﷺ بـ"سيف الله"', tr:'Peygamber ﷺ ona "Seyfullah" (Allah\'ın Kılıcı) lakabını verdi' },
      { az:'Heç bir döyüşdə məğlub olmamışdır', en:'Never lost a single battle', ru:'Не проиграл ни одной битвы', ar:'لم يُهزم في أي معركة', tr:'Hiçbir savaşta yenilmedi' },
      { az:'Yarmuk döyüşünün qalibi', en:'Victor of the Battle of Yarmouk', ru:'Победитель битвы при Ярмуке', ar:'بطل معركة اليرموك', tr:'Yermük Savaşı\'nın galibi' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: خالدٌ سيفٌ من سيوف الله سلَّه الله على الكفار', source:'Tirmizi 3846', az:'Peyğəmbər ﷺ buyurdu: "Xalid Allahın kafirlərin üzərinə sıyırdığı qılınclarından biridir."', en:'The Prophet ﷺ said: "Khalid is a sword among the swords of Allah, drawn against the disbelievers."', ru:'Пророк ﷺ сказал: «Халид — один из мечей Аллаха, обнажённый против неверных.»', tr:'Peygamber ﷺ buyurdu: "Halid, Allah\'ın kâfirlere karşı sıyırdığı kılıçlarından biridir."' },
      { ar:'قال خالد: ما ليلةٌ يُهدى إليَّ فيها عروسٌ أحبُّ إليَّ من ليلة شديدة البرد في سريةٍ أصبِّح بها العدو', source:'Hakim', az:'Xalid dedi: "Gəlin gətirilən gecədən düşmənlə üz-üzə olduğum soyuq bir gecə mənə daha sevimlidir."', en:'Khalid said: "A cold night on a campaign facing the enemy is dearer to me than a wedding night."', ru:'Халид сказал: «Холодная ночь в походе перед врагом мне милее свадебной ночи.»', tr:'Halid dedi: "Düşmanla karşı karşıya olduğum soğuk bir gece, gelin getirilen geceden bana daha sevimlidir."' },
      { ar:'قال خالد عند موته: لقد حضرتُ كذا وكذا من المعارك وما في جسدي موضعُ شبرٍ إلا وفيه ضربةُ سيفٍ أو رميةُ سهم وها أنا أموت على فراشي كما يموت البعير', source:'İbn Kəsir', az:'Xalid ölüm anında dedi: "Bir çox döyüşdə iştirak etmişəm, bədənimdə qılınc yarası və ya ox izi olmayan bir qarış yer yoxdur, amma dəvə kimi yatağımda ölürəm."', en:'Khalid said on his deathbed: "I participated in many battles, there is no spot on my body without a sword or arrow wound, yet I die in my bed like a camel."', ru:'Халид сказал на смертном одре: «Я участвовал во многих сражениях, нет на моём теле места без раны от меча или стрелы, но я умираю в постели, как верблюд.»', tr:'Halid ölüm anında dedi: "Birçok savaşa katıldım, vücudumda kılıç yarası ya da ok izi olmayan bir karış yer yok, ama develer gibi yatağımda ölüyorum."' },
      { ar:'لما أسلم خالد قال له النبي ﷺ: قد كنتُ أرى فيك عقلًا رجوتُ ألا يسلمك إلا إلى خير', source:'Əhməd', az:'Xalid İslama gəldikdə Peyğəmbər ﷺ buyurdu: "Səndə bir ağıl görürdüm ki, onun səni yalnız xeyrə aparacağını umurdum."', en:'When Khalid accepted Islam, the Prophet ﷺ said: "I saw in you an intellect which I hoped would lead you only to good."', ru:'Когда Халид принял Ислам, Пророк ﷺ сказал: «Я видел в тебе разум, который, как я надеялся, приведёт тебя только к добру.»', tr:'Halid İslam\'a geldiğinde Peygamber ﷺ buyurdu: "Sende bir akıl görüyordum, onun seni yalnızca hayra götüreceğini umuyordum."' },
      { ar:'كان خالدٌ يقول: ما أنام الليلَ وجارُ رسول الله ﷺ يقاتل', source:'Vakidi', az:'Xalid deyərdi: "Peyğəmbərin ﷺ qonşuları döyüşərkən gecə yata bilmərəm."', en:'Khalid used to say: "I cannot sleep at night while the neighbors of the Prophet ﷺ are fighting."', ru:'Халид говорил: «Я не могу спать ночью, когда соседи Посланника Аллаха ﷺ сражаются.»', tr:'Halid derdi: "Peygamber\'in ﷺ komşuları savaşırken gece uyuyamam."' },
    ],
  },
  {
    id: 16,
    name: { ar:'سعد بن أبي وقاص', az:'Səd ibn Əbu Vəqqas', en:'Saad ibn Abi Waqqas', ru:'Саад ибн Абу Ваккас', tr:'Sad ibn Ebi Vakkas' },
    title: { az:'İran fatehi', en:'Conqueror of Persia', ru:'Завоеватель Персии', ar:'فاتح فارس', tr:'İran fatihi' },
    bio: {
      az:'Səd ibn Əbu Vəqqas İslama ilk iman gətirənlərdən və Cənnətlə müjdələnən on səhabədən biridir. Qadisiyyə döyüşündə İran imperiyasını məğlub etmişdir.',
      en:'Saad ibn Abi Waqqas was among the first to accept Islam and one of the ten companions promised Paradise. He defeated the Persian Empire at the Battle of Qadisiyyah.',
      ru:'Саад ибн Абу Ваккас был среди первых, принявших Ислам, и одним из десяти сподвижников, обещанных Раем. Он победил Персидскую империю в битве при Кадисии.',
      ar:'سعد بن أبي وقاص كان من أوائل المسلمين ومن العشرة المبشرين بالجنة. هزم الإمبراطورية الفارسية في معركة القادسية.',
      tr:'Sad ibn Ebi Vakkas, İslam\'ı ilk kabul edenlerden ve Cennet\'le müjdelenen on sahabeden biriydi. Kadisiye Savaşı\'nda İran İmparatorluğu\'nu yendi.',
    },
    facts: [
      { az:'Cənnətlə müjdələnən on səhabədən biridir', en:'One of the ten companions promised Paradise', ru:'Один из десяти сподвижников, обещанных Раем', ar:'من العشرة المبشرين بالجنة', tr:'Cennetle müjdelenen on sahabeden biri' },
      { az:'İslam yolunda ilk ox atan səhabədir', en:'First companion to shoot an arrow in the path of Islam', ru:'Первый сподвижник, выпустивший стрелу на пути Ислама', ar:'أول من رمى سهمًا في سبيل الله', tr:'İslam yolunda ilk ok atan sahabe' },
      { az:'Qadisiyyə döyüşünün komandanı', en:'Commander of the Battle of Qadisiyyah', ru:'Командир битвы при Кадисии', ar:'قائد معركة القادسية', tr:'Kadisiye Savaşı\'nın komutanı' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: اللهم سدِّد رميتَه وأجب دعوتَه', source:'Tirmizi 3751', az:'Peyğəmbər ﷺ dua etdi: "Allahım, onun oxunu hədəfə çatdır və duasını qəbul et."', en:'The Prophet ﷺ prayed: "O Allah, direct his arrow and answer his prayer."', ru:'Пророк ﷺ помолился: «О Аллах, направь его стрелу и ответь на его мольбу.»', tr:'Peygamber ﷺ dua etti: "Allah\'ım, onun okunu hedefe ulaştır ve duasını kabul et."' },
      { ar:'قال رسول الله ﷺ: هذا خالي فليُرِني امرؤٌ خالَه', source:'Tirmizi 3752', az:'Peyğəmbər ﷺ Səd haqqında buyurdu: "Bu mənim dayımdır, hər kəs öz dayısını göstərsin."', en:'The Prophet ﷺ said about Saad: "This is my uncle; let each person show their uncle."', ru:'Пророк ﷺ сказал о Сааде: «Это мой дядя; пусть каждый покажет своего дядю.»', tr:'Peygamber ﷺ Sad hakkında buyurdu: "Bu benim dayımdır, herkes dayısını göstersin."' },
      { ar:'عن سعد قال: رأيتُني وأنا ثلثُ الإسلام', source:'Buxari 3727', az:'Səd dedi: "Mən İslamın üçdə biri olduğumu gördüm (yəni üçüncü müsəlman idi)."', en:'Saad said: "I saw myself as one-third of Islam (i.e., the third Muslim)."', ru:'Саад сказал: «Я видел себя третью Ислама (т.е. третьим мусульманином).»', tr:'Sad dedi: "Kendimi İslam\'ın üçte biri olarak gördüm (yani üçüncü Müslüman)."' },
      { ar:'كان سعدٌ مجابَ الدعوة بدعوة رسول الله ﷺ', source:'Buxari 3728', az:'Sədin duası Peyğəmbərin ﷺ duası sayəsində qəbul olunardı.', en:'Saad\'s prayers were answered due to the supplication of the Prophet ﷺ.', ru:'Молитвы Саада были ответены благодаря мольбе Пророка ﷺ.', tr:'Sad\'ın duaları Peygamber\'in ﷺ duası sayesinde kabul olunurdu.' },
      { ar:'عن سعد قال: قال رسول الله ﷺ: من يُرِد الله به خيرًا يُفقِّهه في الدين', source:'Buxari 71', az:'Səd rəvayət etdi: Peyğəmbər ﷺ buyurdu: "Allah kimə xeyir istəsə, onu dində fəqih (anlayışlı) edər."', en:'Saad narrated: The Prophet ﷺ said: "Whoever Allah wants good for, He gives him understanding of the religion."', ru:'Саад передал: Пророк ﷺ сказал: «Кому Аллах желает добра, тому Он даёт понимание религии.»', tr:'Sad rivayet etti: Peygamber ﷺ buyurdu: "Allah kime hayır dilerse, onu dinde fakih (anlayışlı) kılar."' },
    ],
  },
  {
    id: 17,
    name: { ar:'طلحة بن عبيد الله', az:'Talhə ibn Ubeydullah', en:'Talha ibn Ubaydullah', ru:'Тальха ибн Убайдуллах', tr:'Talha ibn Ubeydullah' },
    title: { az:'Uhud qalxanı', en:'Shield at Uhud', ru:'Щит при Ухуде', ar:'درع أحد', tr:'Uhud kalkanı' },
    bio: {
      az:'Talhə ibn Ubeydullah Cənnətlə müjdələnən on səhabədən biridir. Uhud döyüşündə bədəni ilə Peyğəmbəri ﷺ qorumuş və ağır yaralar almışdır.',
      en:'Talha ibn Ubaydullah was one of the ten companions promised Paradise. At the Battle of Uhud, he shielded the Prophet ﷺ with his own body and sustained severe wounds.',
      ru:'Тальха ибн Убайдуллах был одним из десяти сподвижников, обещанных Раем. В битве при Ухуде он прикрыл Пророка ﷺ собственным телом и получил тяжёлые ранения.',
      ar:'طلحة بن عبيد الله كان من العشرة المبشرين بالجنة. في معركة أحد حمى النبي ﷺ بجسده وأصيب بجراح بالغة.',
      tr:'Talha ibn Ubeydullah, Cennet\'le müjdelenen on sahabeden biriydi. Uhud Savaşı\'nda bedeniyle Peygamber\'i ﷺ korumuş ve ağır yaralar almıştır.',
    },
    facts: [
      { az:'Cənnətlə müjdələnən on səhabədən biridir', en:'One of the ten companions promised Paradise', ru:'Один из десяти сподвижников, обещанных Раем', ar:'من العشرة المبشرين بالجنة', tr:'Cennetle müjdelenen on sahabeden biri' },
      { az:'Uhudda Peyğəmbəri ﷺ bədəni ilə qorumuşdur', en:'Shielded the Prophet ﷺ with his body at Uhud', ru:'Прикрыл Пророка ﷺ своим телом при Ухуде', ar:'حمى النبي ﷺ بجسده في أحد', tr:'Uhud\'da Peygamber\'i ﷺ bedeniyle korudu' },
      { az:'75-dən çox yarası var idi Uhud döyüşündən', en:'Sustained over 75 wounds from the Battle of Uhud', ru:'Получил более 75 ран в битве при Ухуде', ar:'أصيب بأكثر من 75 جرحًا في أحد', tr:'Uhud Savaşı\'ndan 75\'ten fazla yarası vardı' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: من أحبَّ أن ينظر إلى شهيدٍ يمشي على وجه الأرض فلينظر إلى طلحة', source:'Tirmizi 3739', az:'Peyğəmbər ﷺ buyurdu: "Kim yer üzündə gəzən bir şəhidə baxmaq istəyirsə, Talhəyə baxsın."', en:'The Prophet ﷺ said: "Whoever wants to look at a martyr walking on the earth, let him look at Talha."', ru:'Пророк ﷺ сказал: «Кто хочет увидеть мученика, ходящего по земле, пусть посмотрит на Тальху.»', tr:'Peygamber ﷺ buyurdu: "Kim yeryüzünde yürüyen bir şehide bakmak istiyorsa, Talha\'ya baksın."' },
      { ar:'قال أبو بكر: ذلك اليوم كلُّه لطلحة', source:'Tirmizi 3738', az:'Əbu Bəkr Uhud döyüşü haqqında dedi: "O gün tamamilə Talhənin günü idi."', en:'Abu Bakr said about the Battle of Uhud: "That day belonged entirely to Talha."', ru:'Абу Бакр сказал о битве при Ухуде: «Тот день целиком принадлежал Тальхе.»', tr:'Ebu Bekir, Uhud Savaşı hakkında dedi: "O gün tamamen Talha\'nın günüydü."' },
      { ar:'يوم أحد لما اشتدَّ الأمرُ اتخذ طلحةُ النبيَّ ﷺ وقايةً بنفسه', source:'Buxari 4063', az:'Uhud döyüşü qızışanda Talhə öz bədəni ilə Peyğəmbəri ﷺ qorudu.', en:'When the battle of Uhud intensified, Talha shielded the Prophet ﷺ with his own body.', ru:'Когда битва при Ухуде усилилась, Тальха прикрыл Пророка ﷺ своим телом.', tr:'Uhud Savaşı şiddetlendiğinde Talha, Peygamber\'i ﷺ kendi bedeniyle korudu.' },
      { ar:'قال رسول الله ﷺ: أوجبَ طلحة', source:'Tirmizi 3740', az:'Peyğəmbər ﷺ (Uhudda Talhənin fədakarlığını görüb) buyurdu: "Talhə (Cənnəti) vacib etdi."', en:'The Prophet ﷺ said (seeing Talha\'s sacrifice at Uhud): "Talha has made it (Paradise) obligatory."', ru:'Пророк ﷺ сказал (увидев самоотверженность Тальхи): «Тальха обязал (себе Рай).»', tr:'Peygamber ﷺ (Talha\'nın fedakarlığını görünce) buyurdu: "Talha (Cennet\'i) vacip kıldı."' },
      { ar:'شلَّت يدُ طلحة يوم أحد حين وقى بها رسول الله ﷺ', source:'Buxari 3724', az:'Talhənin əli Uhud döyüşündə Peyğəmbəri ﷺ qoruyarkən şikəst oldu.', en:'Talha\'s hand was paralyzed at Uhud while protecting the Prophet ﷺ.', ru:'Рука Тальхи была парализована при Ухуде, когда он защищал Пророка ﷺ.', tr:'Talha\'nın eli Uhud\'da Peygamber\'i ﷺ korurken felç oldu.' },
    ],
  },
  {
    id: 18,
    name: { ar:'الزبير بن العوام', az:'Zübeyr ibn əl-Əvvam', en:'Zubayr ibn al-Awwam', ru:'Зубайр ибн аль-Аввам', tr:'Zübeyr ibn Avvam' },
    title: { az:'Peyğəmbərin həvarisi', en:'Disciple of the Prophet', ru:'Апостол Пророка', ar:'حواري النبي', tr:'Peygamber\'in havarisi' },
    bio: {
      az:'Zübeyr ibn əl-Əvvam Cənnətlə müjdələnən on səhabədən biridir. Peyğəmbərin ﷺ bibisi oğlu və xalası oğlu idi. Cəsarəti ilə tanınır və "Peyğəmbərin həvarisi" adlandırılırdı.',
      en:'Zubayr ibn al-Awwam was one of the ten companions promised Paradise. He was the cousin of the Prophet ﷺ. Known for his bravery, he was called "the Disciple of the Prophet."',
      ru:'Зубайр ибн аль-Аввам был одним из десяти сподвижников, обещанных Раем. Он был двоюродным братом Пророка ﷺ. Известный своей храбростью, он назывался «Апостолом Пророка».',
      ar:'الزبير بن العوام كان من العشرة المبشرين بالجنة. كان ابن عمة النبي ﷺ. عُرف بشجاعته ولُقِّب بـ"حواري النبي".',
      tr:'Zübeyr ibn Avvam, Cennet\'le müjdelenen on sahabeden biriydi. Peygamber\'in ﷺ halaoğluydu. Cesareti ile tanınır ve "Peygamber\'in havarisi" olarak adlandırılırdı.',
    },
    facts: [
      { az:'Cənnətlə müjdələnən on səhabədən biridir', en:'One of the ten companions promised Paradise', ru:'Один из десяти сподвижников, обещанных Раем', ar:'من العشرة المبشرين بالجنة', tr:'Cennetle müjdelenen on sahabeden biri' },
      { az:'İslam yolunda ilk qılınc çəkən səhabədir', en:'First companion to draw a sword for Islam', ru:'Первый сподвижник, обнаживший меч за Ислам', ar:'أول من سل سيفه في سبيل الله', tr:'İslam yolunda ilk kılıç çeken sahabe' },
      { az:'Həbəşistana iki dəfə hicrət etmişdir', en:'Migrated to Abyssinia twice', ru:'Дважды переселился в Абиссинию', ar:'هاجر إلى الحبشة مرتين', tr:'Habeşistan\'a iki kez hicret etti' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: إن لكل نبيٍّ حواريًّا وحواريَّ الزبير', source:'Buxari 3719', az:'Peyğəmbər ﷺ buyurdu: "Hər peyğəmbərin bir həvarisi var, mənim həvarim Zübeyrdir."', en:'The Prophet ﷺ said: "Every prophet has a disciple, and my disciple is Zubayr."', ru:'Пророк ﷺ сказал: «У каждого пророка есть апостол, и мой апостол — Зубайр.»', tr:'Peygamber ﷺ buyurdu: "Her peygamberin bir havarisi vardır, benim havarim Zübeyr\'dir."' },
      { ar:'قال رسول الله ﷺ يوم الخندق: من يأتيني بخبر القوم؟ فقال الزبير: أنا', source:'Buxari 3720', az:'Peyğəmbər ﷺ Xəndək günü dedi: "Kim düşmənin xəbərini gətirər?" Zübeyr dedi: "Mən."', en:'The Prophet ﷺ said on the day of the Trench: "Who will bring me news of the enemy?" Zubayr said: "I will."', ru:'Пророк ﷺ сказал в день Рва: «Кто принесёт мне вести о враге?» Зубайр сказал: «Я.»', tr:'Peygamber ﷺ Hendek günü dedi: "Düşmanın haberini kim getirir?" Zübeyr dedi: "Ben."' },
      { ar:'قاتل الزبيرُ يوم بدر وهو فارسان', source:'İbn Hişam', az:'Zübeyr Bədr döyüşündə iki atlının gücünə bərabər döyüşdü.', en:'Zubayr fought at the Battle of Badr with the strength of two horsemen.', ru:'Зубайр сражался при Бадре с силой двух всадников.', tr:'Zübeyr, Bedir Savaşı\'nda iki atlının gücüyle savaştı.' },
      { ar:'كان الزبير يُعرف بشجاعته وإقدامه في كل المعارك مع رسول الله ﷺ', source:'İbn Sad', az:'Zübeyr Peyğəmbərlə ﷺ bütün döyüşlərdə cəsarəti ilə tanınırdı.', en:'Zubayr was known for his courage in every battle with the Prophet ﷺ.', ru:'Зубайр был известен своей храбростью в каждой битве с Пророком ﷺ.', tr:'Zübeyr, Peygamber\'le ﷺ her savaşta cesareti ile tanınırdı.' },
      { ar:'أسلم الزبير وعمره ست عشرة سنة', source:'İbn Sad', az:'Zübeyr 16 yaşında İslama iman gətirmişdir.', en:'Zubayr accepted Islam at the age of 16.', ru:'Зубайр принял Ислам в возрасте 16 лет.', tr:'Zübeyr, 16 yaşında İslam\'ı kabul etti.' },
    ],
  },
  {
    id: 19,
    name: { ar:'أنس بن مالك', az:'Ənəs ibn Malik', en:'Anas ibn Malik', ru:'Анас ибн Малик', tr:'Enes ibn Malik' },
    title: { az:'10 il Peyğəmbərin xidmətçisi', en:'Servant of the Prophet for 10 years', ru:'Слуга Пророка 10 лет', ar:'خادم النبي عشر سنين', tr:'10 yıl Peygamber\'in hizmetçisi' },
    bio: {
      az:'Ənəs ibn Malik 10 yaşında Peyğəmbərin ﷺ xidmətinə verilmiş və 10 il ona xidmət etmişdir. 2286 hədis rəvayət edərək ən çox hədis rəvayət edən üçüncü səhabədir.',
      en:'Anas ibn Malik was given to the Prophet ﷺ at age 10 and served him for 10 years. He narrated 2,286 hadiths, making him the third most prolific hadith narrator.',
      ru:'Анас ибн Малик был отдан Пророку ﷺ в 10 лет и служил ему 10 лет. Он передал 2286 хадисов, став третьим по количеству передатчиком хадисов.',
      ar:'أنس بن مالك خدم النبي ﷺ منذ سن العاشرة لمدة عشر سنوات. روى 2286 حديثًا وهو ثالث أكثر الصحابة رواية.',
      tr:'Enes ibn Malik, 10 yaşında Peygamber\'in ﷺ hizmetine verilmiş ve 10 yıl hizmet etmiştir. 2286 hadis rivayet ederek en çok hadis rivayet eden üçüncü sahabe olmuştur.',
    },
    facts: [
      { az:'2286 hədis rəvayət etmişdir', en:'Narrated 2,286 hadiths', ru:'Передал 2286 хадисов', ar:'روى 2286 حديثًا', tr:'2286 hadis rivayet etti' },
      { az:'103 yaşına qədər yaşamışdır', en:'Lived to the age of 103', ru:'Прожил до 103 лет', ar:'عاش حتى 103 سنوات', tr:'103 yaşına kadar yaşadı' },
      { az:'Peyğəmbər ﷺ ona uzun ömür və çox mal duası etmişdir', en:'The Prophet ﷺ prayed for his long life and abundant wealth', ru:'Пророк ﷺ молился о его долгой жизни и богатстве', ar:'دعا له النبي ﷺ بطول العمر وكثرة المال', tr:'Peygamber ﷺ ona uzun ömür ve çok mal duası etti' },
    ],
    hadiths: [
      { ar:'عن أنس قال: خدمتُ النبيَّ ﷺ عشرَ سنين فما قال لي أُفٍّ قطُّ', source:'Buxari 6038', az:'Ənəs dedi: "Peyğəmbərə ﷺ 10 il xidmət etdim, mənə bir dəfə belə uf demədi."', en:'Anas said: "I served the Prophet ﷺ for 10 years, and he never once said \'uff\' to me."', ru:'Анас сказал: «Я служил Пророку ﷺ 10 лет, и он ни разу не сказал мне «уф».»', tr:'Enes dedi: "Peygamber\'e ﷺ 10 yıl hizmet ettim, bana bir kez bile \'öf\' demedi."' },
      { ar:'عن أنس قال: كان رسول الله ﷺ أحسنَ الناسِ خُلُقًا', source:'Buxari 6203', az:'Ənəs dedi: "Peyğəmbər ﷺ insanların ən gözəl əxlaqlısı idi."', en:'Anas said: "The Prophet ﷺ had the best character among all people."', ru:'Анас сказал: «Пророк ﷺ имел лучший нрав среди всех людей.»', tr:'Enes dedi: "Peygamber ﷺ insanların en güzel ahlâklısıydı."' },
      { ar:'عن أنس قال: قال رسول الله ﷺ: لا يؤمن أحدُكم حتى يحبَّ لأخيه ما يحبُّ لنفسه', source:'Buxari 13', az:'Ənəs rəvayət etdi: Peyğəmbər ﷺ buyurdu: "Sizin heç biriniz qardaşı üçün özü üçün istədiyini istəməyincə iman etmiş sayılmaz."', en:'Anas narrated: The Prophet ﷺ said: "None of you truly believes until he loves for his brother what he loves for himself."', ru:'Анас передал: Пророк ﷺ сказал: «Не уверует никто из вас, пока не полюбит для брата своего то, что любит для себя.»', tr:'Enes rivayet etti: Peygamber ﷺ buyurdu: "Sizden hiçbiriniz, kardeşi için kendisi için istediğini istemedikçe iman etmiş sayılmaz."' },
      { ar:'عن أنس قال: قال رسول الله ﷺ: يسِّروا ولا تعسِّروا وبشِّروا ولا تنفِّروا', source:'Buxari 69', az:'Ənəs rəvayət etdi: Peyğəmbər ﷺ buyurdu: "Asanlaşdırın, çətinləşdirməyin; müjdələyin, nifrət etdirməyin."', en:'Anas narrated: The Prophet ﷺ said: "Make things easy, not difficult; give glad tidings, do not drive people away."', ru:'Анас передал: Пророк ﷺ сказал: «Облегчайте, не затрудняйте; радуйте, не отталкивайте.»', tr:'Enes rivayet etti: Peygamber ﷺ buyurdu: "Kolaylaştırın, zorlaştırmayın; müjdeleyin, nefret ettirmeyin."' },
      { ar:'عن أنس قال: قال رسول الله ﷺ: اللهم بارك له في ماله وولده', source:'Buxari 6344', az:'Ənəs dedi: Peyğəmbər ﷺ mənim üçün dua etdi: "Allahım, onun malına və övladına bərəkət ver."', en:'Anas said: The Prophet ﷺ prayed for me: "O Allah, bless him in his wealth and children."', ru:'Анас сказал: Пророк ﷺ помолился за меня: «О Аллах, благослови его в его имуществе и детях.»', tr:'Enes dedi: Peygamber ﷺ benim için dua etti: "Allah\'ım, onun malına ve çocuklarına bereket ver."' },
    ],
  },
  {
    id: 20,
    name: { ar:'أبو عبيدة بن الجراح', az:'Əbu Ubeydə ibn əl-Cərrah', en:'Abu Ubaidah ibn al-Jarrah', ru:'Абу Убайда ибн аль-Джаррах', tr:'Ebu Ubeyde ibn Cerrah' },
    title: { az:'Ümmətin əmini', en:'Trustee of the Ummah', ru:'Доверенный Уммы', ar:'أمين الأمة', tr:'Ümmetin emini' },
    bio: {
      az:'Əbu Ubeydə ibn əl-Cərrah Cənnətlə müjdələnən on səhabədən biridir. Peyğəmbər ﷺ onu "Ümmətin əmini" (etibarlı şəxsi) adlandırmışdır. Təvazökarlığı və əmanətdarlığı ilə tanınırdı.',
      en:'Abu Ubaidah ibn al-Jarrah was one of the ten companions promised Paradise. The Prophet ﷺ called him "the Trustee of the Ummah." He was known for his humility and trustworthiness.',
      ru:'Абу Убайда ибн аль-Джаррах был одним из десяти сподвижников, обещанных Раем. Пророк ﷺ назвал его «Доверенным Уммы». Он был известен своей скромностью и надёжностью.',
      ar:'أبو عبيدة بن الجراح كان من العشرة المبشرين بالجنة. لقبه النبي ﷺ بـ"أمين الأمة". عُرف بتواضعه وأمانته.',
      tr:'Ebu Ubeyde ibn Cerrah, Cennet\'le müjdelenen on sahabeden biriydi. Peygamber ﷺ onu "Ümmetin Emini" olarak adlandırdı. Tevazusu ve güvenilirliği ile tanınırdı.',
    },
    facts: [
      { az:'Cənnətlə müjdələnən on səhabədən biridir', en:'One of the ten companions promised Paradise', ru:'Один из десяти сподвижников, обещанных Раем', ar:'من العشرة المبشرين بالجنة', tr:'Cennetle müjdelenen on sahabeden biri' },
      { az:'Şam fəthinin baş komandanı', en:'Chief commander of the conquest of Syria', ru:'Главнокомандующий завоеванием Сирии', ar:'القائد العام لفتح الشام', tr:'Şam fethinin baş komutanı' },
      { az:'Vəba xəstəliyindən Şamda şəhid olmuşdur', en:'Died of plague in Syria', ru:'Скончался от чумы в Сирии', ar:'توفي بالطاعون في الشام', tr:'Şam\'da vebadan şehit oldu' },
    ],
    hadiths: [
      { ar:'قال رسول الله ﷺ: إن لكل أمةٍ أمينًا وإن أمينَ هذه الأمة أبو عبيدة بن الجراح', source:'Buxari 3744', az:'Peyğəmbər ﷺ buyurdu: "Hər ümmətin bir əmini var, bu ümmətin əmini Əbu Ubeydə ibn əl-Cərrahdır."', en:'The Prophet ﷺ said: "Every nation has a trustee, and the trustee of this nation is Abu Ubaidah ibn al-Jarrah."', ru:'Пророк ﷺ сказал: «У каждой общины есть доверенный, и доверенный этой общины — Абу Убайда ибн аль-Джаррах.»', tr:'Peygamber ﷺ buyurdu: "Her ümmetin bir emini vardır, bu ümmetin emini Ebu Ubeyde ibn Cerrah\'tır."' },
      { ar:'لما جاء وفد نجران قالوا: ابعث معنا أمينًا، فقال رسول الله ﷺ: لأبعثنَّ معكم أمينًا حقَّ أمين، فبعث أبا عبيدة', source:'Buxari 3745', az:'Nəcran nümayəndəsi gəldikdə etibarlı birini istədi. Peyğəmbər ﷺ Əbu Ubeydəni göndərdi.', en:'When the delegation of Najran came and asked for a trustworthy person, the Prophet ﷺ sent Abu Ubaidah.', ru:'Когда прибыла делегация из Наджрана и попросила надёжного человека, Пророк ﷺ отправил Абу Убайду.', tr:'Necran heyeti gelip güvenilir birini istediğinde, Peygamber ﷺ Ebu Ubeyde\'yi gönderdi.' },
      { ar:'كان أبو عبيدة من أشد الناس تواضعًا وزهدًا', source:'İbn Sad', az:'Əbu Ubeydə insanların ən təvazökar və zahid olanlarından idi.', en:'Abu Ubaidah was among the most humble and ascetic of people.', ru:'Абу Убайда был одним из самых скромных и аскетичных людей.', tr:'Ebu Ubeyde, insanların en mütevazı ve zahit olanlarındandı.' },
      { ar:'قال عمر: لو كان أبو عبيدة حيًّا لاستخلفتُه', source:'Hakim', az:'Ömər dedi: "Əbu Ubeydə sağ olsaydı, onu xəlifə edərdim."', en:'Umar said: "If Abu Ubaidah were alive, I would have made him the caliph."', ru:'Умар сказал: «Если бы Абу Убайда был жив, я бы назначил его халифом.»', tr:'Ömer dedi: "Ebu Ubeyde hayatta olsaydı, onu halife yapardım."' },
      { ar:'لما وقع الطاعون بالشام قال أبو عبيدة: إن هذا رحمةُ ربكم ودعوة نبيكم', source:'Buxari 3473', az:'Şamda vəba yayılanda Əbu Ubeydə dedi: "Bu Rəbbinizin rəhməti və peyğəmbərinizin duasıdır."', en:'When plague struck Syria, Abu Ubaidah said: "This is the mercy of your Lord and the prayer of your Prophet."', ru:'Когда чума поразила Сирию, Абу Убайда сказал: «Это милость вашего Господа и мольба вашего Пророка.»', tr:'Şam\'da veba yayıldığında Ebu Ubeyde dedi: "Bu Rabbinizin rahmeti ve peygamberinizin duasıdır."' },
    ],
  },
]

/* ── Icons for each sahabi ── */
const ICONS = ['☪','☪','☪','☪','🌙','🌙','🌙','📢','📖','📖','🌍','🕌','📚','❤','⚔','🏹','🛡','⚔','🤲','⭐']

export default function SahabePage({ setPage }) {
  const { lang } = useLang()
  const L = LABELS[lang] || LABELS.en
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return SAHABA
    const q = search.toLowerCase()
    return SAHABA.filter(s => {
      const n = s.name[lang] || s.name.en
      const ar = s.name.ar
      const t = s.title[lang] || s.title.en
      return n.toLowerCase().includes(q) || ar.includes(q) || t.toLowerCase().includes(q)
    })
  }, [search, lang])

  const selected = selectedId ? SAHABA.find(s => s.id === selectedId) : null

  if (selected) {
    const n = selected.name[lang] || selected.name.en
    const t = selected.title[lang] || selected.title.en
    const b = selected.bio[lang] || selected.bio.en
    const icon = ICONS[selected.id - 1] || '☪'
    return (
      <div className="sahabe-page">
        <div className="page-hero theme-sahaba">
          <div className="breadcrumb">
            <button onClick={() => setPage('home')}>🏠</button> / <button onClick={() => setSelectedId(null)}>{L.title}</button> / <span>{n}</span>
          </div>
          <div className="page-hero-arabic">{selected.name.ar}</div>
          <h1>{n}</h1>
          <p>{t}</p>
        </div>

        <div className="section">
          <div className="sahabe-profile">
            <button className="sahabe-back-btn" onClick={() => setSelectedId(null)}>
              ← {L.back}
            </button>

            <div className="sahabe-profile-header">
              <div className="sahabe-profile-icon">{icon}</div>
              <div className="sahabe-profile-arabic">{selected.name.ar}</div>
              <div className="sahabe-profile-name">{n}</div>
              <div className="sahabe-profile-title">{t}</div>
            </div>

            {/* Bio */}
            <div className="sahabe-section">
              <div className="sahabe-section-title"><span>📜</span> {L.bio}</div>
              <p className="sahabe-bio">{b}</p>
            </div>

            {/* Facts */}
            <div className="sahabe-section">
              <div className="sahabe-section-title"><span>💡</span> {L.facts}</div>
              <ul className="sahabe-facts-list">
                {selected.facts.map((f, i) => (
                  <li key={i} className="sahabe-fact-item">
                    <span className="sahabe-fact-bullet">{i + 1}</span>
                    <span>{f[lang] || f.en}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hadiths */}
            <div className="sahabe-section">
              <div className="sahabe-section-title"><span>📖</span> {L.hadiths}</div>
              <div className="sahabe-hadiths-list">
                {selected.hadiths.map((h, i) => (
                  <div key={i} className="sahabe-hadith-item">
                    <div className="sahabe-hadith-number">{L.hadithLabel} #{i + 1}</div>
                    <div className="sahabe-hadith-arabic">{h.ar}</div>
                    <div className="sahabe-hadith-translation">{h[lang] || h.en}</div>
                    <span className="sahabe-hadith-source">{h.source}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sahabe-page">
      <div className="page-hero theme-sahaba">
        <div className="breadcrumb">
          <button onClick={() => setPage('home')}>🏠</button> / <span>{L.title}</span>
        </div>
        <div className="page-hero-arabic">الصحابة الكرام</div>
        <h1>{L.title}</h1>
        <p>{L.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner">
          <div className="sahabe-search-wrap">
            <span className="sahabe-search-icon">🔍</span>
            <input
              className="sahabe-search"
              type="text"
              placeholder={L.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="sahabe-no-results">{L.noResults}</div>
          ) : (
            <div className="sahabe-grid">
              {filtered.map(s => {
                const n = s.name[lang] || s.name.en
                const t = s.title[lang] || s.title.en
                const icon = ICONS[s.id - 1] || '☪'
                return (
                  <div key={s.id} className="sahabe-card anim-fadeUp" onClick={() => { setSelectedId(s.id); window.scrollTo(0, 0) }}>
                    <span className="sahabe-card-number">{s.id}</span>
                    <div className="sahabe-card-icon">{icon}</div>
                    <div className="sahabe-card-arabic">{s.name.ar}</div>
                    <div className="sahabe-card-name">{n}</div>
                    <div className="sahabe-card-title">{t}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
