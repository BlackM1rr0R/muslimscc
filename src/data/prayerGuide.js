// ═══════════════════════════════════════════════════════
// Namaz və dəstəmaz bələdçisi — məzmun (5 dil)
//
// MƏNHƏC: Sələf alimlərinə uyğun. Əsas istinad:
//   • Nasirəddin əl-Albani — «Sifətu salatin-Nəbiyy ﷺ»
//   • Əbdüləziz ibn Baz — «Kəyfiyyətu salatin-Nəbiyy ﷺ»
//   • Məhəmməd ibn Saleh əl-Useymin — «Sifətu salatin-Nəbiyy ﷺ»
// və bu kitabların dəlil gətirdiyi səhih hədislər. Kitab mətnləri köçürülmür —
// hər addımda qısa xülasə + hədis nömrəsi (refs) verilir.
//
// Hədis nömrələri: Buxari / Müslim — Fuad Əbdülbaqi nömrələnməsi (sunnah.com
// ilə eyni); Sünən kitabları — Albani tahqiqli nəşrlərin nömrələnməsi.
// Alimlər arasında ixtilaf olan yerdə hökm verilmir: `note` sahəsində fikir
// ayrılığı qeyd olunur və "imamınızdan soruşun" deyilir (askImam: true).
//
// Ərəb mətnləri yalnız səhih, geniş məlum formalardır. Səs: zikr.audio —
// fayl (public/audio/prayer, lisenziyası prayerGuideCredits.js-də) və ya
// Quran ayələri (utils/quranAudio.js, əl-Əfasi). Səsi olmayan zikrdə düymə
// göstərilmir (TTS və ya uydurma səs yoxdur).
// ═══════════════════════════════════════════════════════

// ── Mənbə adları ──
export const COLLECTIONS = {
  bukhari:     { az: 'Buxari', en: 'Bukhari', ru: 'Бухари', ar: 'البخاري', tr: 'Buhari' },
  muslim:      { az: 'Müslim', en: 'Muslim', ru: 'Муслим', ar: 'مسلم', tr: 'Müslim' },
  abudawud:    { az: 'Əbu Davud', en: 'Abu Dawud', ru: 'Абу Дауд', ar: 'أبو داود', tr: 'Ebu Davud' },
  tirmidhi:    { az: 'Tirmizi', en: 'at-Tirmidhi', ru: 'ат-Тирмизи', ar: 'الترمذي', tr: 'Tirmizi' },
  nasai:       { az: 'Nəsai', en: "an-Nasa'i", ru: 'ан-Насаи', ar: 'النسائي', tr: 'Nesai' },
  ibnkhuzayma: { az: 'İbn Xuzeymə', en: 'Ibn Khuzaymah', ru: 'Ибн Хузайма', ar: 'ابن خزيمة', tr: 'İbn Huzeyme' },
  quran:       { az: 'Quran', en: 'Quran', ru: 'Коран', ar: 'القرآن', tr: "Kur'an" },
}

// Sünən hədisləri üçün Albaninin hökmü göstərilir
export const GRADE_SAHIH = { az: 'Albani: səhih', en: 'al-Albani: sahih', ru: 'аль-Альбани: достоверный', ar: 'صححه الألباني', tr: 'Elbani: sahih' }

export const BOOKS = {
  albani:   { az: 'Albani, «Sifətu salatin-Nəbiyy»', en: 'al-Albani, "Sifat Salat an-Nabi"', ru: 'аль-Альбани, «Сифату салят ан-Наби»', ar: 'الألباني، «صفة صلاة النبي ﷺ»', tr: 'Elbani, "Sıfatu Salati\'n-Nebi"' },
  ibnbaz:   { az: 'İbn Baz, «Kəyfiyyətu salatin-Nəbiyy»', en: 'Ibn Baz, "Kayfiyyat Salat an-Nabi"', ru: 'Ибн Баз, «Кайфияту салят ан-Наби»', ar: 'ابن باز، «كيفية صلاة النبي ﷺ»', tr: 'İbn Baz, "Keyfiyyetu Salati\'n-Nebi"' },
  uthaymin: { az: 'İbn Useymin, «Sifətu salatin-Nəbiyy»', en: 'Ibn Uthaymin, "Sifat Salat an-Nabi"', ru: 'Ибн Усеймин, «Сифату салят ан-Наби»', ar: 'ابن عثيمين، «صفة صلاة النبي ﷺ»', tr: 'İbn Useymin, "Sıfatu Salati\'n-Nebi"' },
}

// Sünən (Albani hökmü göstərilən) toplular
const SUNAN = new Set(['abudawud', 'tirmidhi', 'nasai', 'ibnkhuzayma'])

/** Bir istinadı cari dildə mətnə çevirir: { c:'bukhari', n:'735' } → "Buxari 735" */
export function refText(ref, lang = 'az') {
  if (ref.book) return (BOOKS[ref.book] || {})[lang] || ''
  const c = COLLECTIONS[ref.c] || {}
  const name = c[lang] || c.en || ref.c
  const grade = SUNAN.has(ref.c) ? ` (${GRADE_SAHIH[lang] || GRADE_SAHIH.en})` : ''
  return `${name} ${ref.n}${grade}`
}

// Səhih hədisin onlayn ünvanı (sunnah.com) — yalnız nömrəsi dəqiq bilinən toplular
export function refUrl(ref) {
  if (ref.book) return ''
  const map = { bukhari: 'bukhari', muslim: 'muslim', abudawud: 'abudawud', tirmidhi: 'tirmidhi', nasai: 'nasai' }
  if (ref.c === 'quran') {
    const [s, a] = String(ref.n).split(':')
    return `https://quran.com/${s}/${a}`
  }
  return map[ref.c] ? `https://sunnah.com/${map[ref.c]}:${ref.n}` : ''
}

// ── Zikrlər ──
// ar — ərəb mətni; tl — transliterasiya (ərəbcə interfeysdə mətnin özü göstərilir);
// mean — məna (ar: qısa izah); audio — səs mənbəyi (yoxdursa düymə yoxdur)
export const ZIKR = {
  takbir: {
    ar: 'اللَّهُ أَكْبَرُ',
    tl: { az: 'Allahu əkbər', en: 'Allahu akbar', ru: 'Аллаху акбар', tr: 'Allahu ekber' },
    mean: { az: 'Allah ən böyükdür', en: 'Allah is the Greatest', ru: 'Аллах превыше всего', ar: 'الله أعظم من كل شيء', tr: 'Allah en büyüktür' },
    audio: { file: '/audio/prayer/takbir.wav', credit: 'takbir' },
  },
  istiftah: {
    ar: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلَهَ غَيْرُكَ',
    tl: {
      az: 'Subhanəkə Allahummə və bihəmdikə, və təbarəkəsmukə, və təalə cədduk, və la ilahə ğayruk',
      en: "Subhanaka Allahumma wa bihamdika, wa tabarakasmuka, wa ta'ala jadduka, wa la ilaha ghayruk",
      ru: 'Субханака-Ллахумма ва бихамдика, ва табарака-смука, ва та‘аля джаддука, ва ля иляха гайрук',
      tr: 'Sübhanekellahümme ve bihamdike, ve tebarekesmüke, ve teala ceddüke, ve la ilahe ğayruk',
    },
    mean: {
      az: 'Allahım, Sən hər nöqsandan pak və müqəddəssən, həmd Sənə məxsusdur. Adın mübarəkdir, əzəmətin ucadır, Səndən başqa ibadətə layiq ilah yoxdur.',
      en: 'Glory be to You, O Allah, and praise be to You. Blessed is Your Name, exalted is Your majesty, and there is no god worthy of worship besides You.',
      ru: 'Пречист Ты, о Аллах, и хвала Тебе. Благословенно Твоё имя, превыше всего Твоё величие, и нет божества, достойного поклонения, кроме Тебя.',
      ar: 'ثناء على الله وتنزيه له في أول الصلاة',
      tr: "Allah'ım! Seni her türlü noksanlıktan tenzih eder ve Sana hamd ederim. İsmin mübarektir, şanın yücedir, Senden başka ibadete layık ilah yoktur.",
    },
  },
  taawwudh: {
    ar: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
    tl: { az: 'Əuzu billəhi minəş-şaytanir-racim', en: "A'udhu billahi minash-shaytanir-rajim", ru: 'А‘узу би-Лляхи мина-ш-шайтани-р-раджим', tr: 'Euzü billahi mineş-şeytanir-racim' },
    mean: { az: 'Qovulmuş şeytandan Allaha sığınıram', en: 'I seek refuge in Allah from Satan, the accursed', ru: 'Прибегаю к защите Аллаха от проклятого шайтана', ar: 'الاستعاذة بالله قبل القراءة', tr: "Kovulmuş şeytandan Allah'a sığınırım" },
  },
  fatiha: {
    ar: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ۝ ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ۝ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ۝ مَٰلِكِ يَوْمِ ٱلدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ ۝ صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
    tl: {
      az: 'Bismillahir-Rəhmanir-Rəhim. Əlhəmdu lillahi Rəbbil-aləmin. Ər-Rəhmanir-Rəhim. Maliki yəvmid-din. İyyakə nəbudu və iyyakə nəstəin. İhdinəs-siratəl-mustəqim. Siratəlləzinə ənamtə ələyhim, ğayril-məğdubi ələyhim vələd-dallin.',
      en: "Bismillahir-Rahmanir-Rahim. Al-hamdu lillahi Rabbil-'alamin. Ar-Rahmanir-Rahim. Maliki yawmid-din. Iyyaka na'budu wa iyyaka nasta'in. Ihdinas-siratal-mustaqim. Siratal-ladhina an'amta 'alayhim, ghayril-maghdubi 'alayhim wa lad-dallin.",
      ru: 'Бисми-Лляхи-р-Рахмани-р-Рахим. Аль-хамду ли-Лляхи Рабби-ль-‘алямин. Ар-Рахмани-р-Рахим. Малики яуми-д-дин. Ийяка на‘буду ва ийяка наста‘ин. Ихдина-с-сырата-ль-мустаким. Сырата-ллязина ан‘амта ‘аляйхим, гайри-ль-магдуби ‘аляйхим ва ля-д-даллин.',
      tr: "Bismillahirrahmanirrahim. Elhamdü lillahi rabbil alemin. Errahmanirrahim. Maliki yevmiddin. İyyake na'büdü ve iyyake nesta'in. İhdinas sıratal müstakim. Sıratallezine en'amte aleyhim, ğayril mağdubi aleyhim veleddallin.",
    },
    mean: {
      az: 'Allaha həmd, Ona ibadət və doğru yola hidayət diləyi (Fatihə 1:1–7)',
      en: 'Praise of Allah, worship of Him alone and a plea for guidance to the straight path (al-Fatiha 1:1–7)',
      ru: 'Хвала Аллаху, поклонение Ему одному и мольба о прямом пути (аль-Фатиха 1:1–7)',
      ar: 'أم الكتاب: حمد الله وإفراده بالعبادة وسؤاله الهداية',
      tr: "Allah'a hamd, yalnız O'na ibadet ve doğru yola hidayet talebi (Fatiha 1:1–7)",
    },
    quran: { s: 1, ayahs: [1, 2, 3, 4, 5, 6, 7], first: 1 },
    audio: { quran: true },
  },
  amin: {
    ar: 'آمِينَ',
    tl: { az: 'Amin', en: 'Amin', ru: 'Амин', tr: 'Amin' },
    mean: { az: 'Allahım, qəbul et', en: 'O Allah, answer (our prayer)', ru: 'О Аллах, ответь на мольбу', ar: 'اللهم استجب', tr: "Allah'ım, kabul eyle" },
    audio: { file: '/audio/prayer/amin.wav', credit: 'amin' },
  },
  ikhlas: {
    ar: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ ۝ ٱللَّهُ ٱلصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ',
    tl: {
      az: 'Qul huvəllahu əhəd. Allahus-saməd. Ləm yəlid və ləm yuləd. Və ləm yəkun ləhu kufuvən əhəd.',
      en: 'Qul huwallahu ahad. Allahus-samad. Lam yalid wa lam yulad. Wa lam yakun lahu kufuwan ahad.',
      ru: 'Куль хува-Ллаху ахад. Аллаху-с-самад. Лям ялид ва лям юляд. Ва лям якун ляху куфуван ахад.',
      tr: 'Kul hüvallahü ehad. Allahüssamed. Lem yelid ve lem yuled. Ve lem yekün lehu küfüven ehad.',
    },
    mean: {
      az: 'Allahın təkliyi — İxlas surəsi (112:1–4)',
      en: 'The Oneness of Allah — Surah al-Ikhlas (112:1–4)',
      ru: 'Единственность Аллаха — сура «Аль-Ихлас» (112:1–4)',
      ar: 'سورة الإخلاص: توحيد الله',
      tr: "Allah'ın birliği — İhlas suresi (112:1–4)",
    },
    quran: { s: 112, ayahs: [1, 2, 3, 4], first: 6222 },
    audio: { quran: true },
  },
  ruku: {
    ar: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
    tl: { az: 'Subhanə Rəbbiyəl-Əzim', en: "Subhana Rabbiyal-'Adhim", ru: 'Субхана Раббия-ль-‘Азым', tr: 'Sübhane rabbiyel azim' },
    mean: { az: 'Əzəmətli Rəbbim hər nöqsandan pakdır', en: 'Glory be to my Lord, the Most Great', ru: 'Пречист мой Великий Господь', ar: 'تنزيه الله العظيم في الركوع', tr: 'Yüce Rabbimi her türlü noksanlıktan tenzih ederim' },
    repeat: 3,
  },
  sami: {
    ar: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ',
    tl: { az: 'Səmiallahu limən həmidəh', en: "Sami'allahu liman hamidah", ru: 'Сами‘а-Ллаху ли-ман хамидах', tr: 'Semiallahü limen hamideh' },
    mean: { az: 'Allah Ona həmd edəni eşitdi', en: 'Allah hears the one who praises Him', ru: 'Аллах слышит того, кто восхвалил Его', ar: 'الله يسمع حمد من حمده ويجيبه', tr: 'Allah kendisine hamd edeni işitti' },
  },
  rabbana: {
    ar: 'رَبَّنَا وَلَكَ الْحَمْدُ',
    tl: { az: 'Rəbbənə və ləkəl-həmd', en: 'Rabbana wa lakal-hamd', ru: 'Раббана ва ляка-ль-хамд', tr: 'Rabbena ve lekel hamd' },
    mean: { az: 'Ey Rəbbimiz, həmd Sənə məxsusdur', en: 'Our Lord, and to You belongs all praise', ru: 'Господь наш, Тебе хвала', ar: 'الحمد كله لله ربنا', tr: 'Rabbimiz, hamd Sana mahsustur' },
  },
  sujud: {
    ar: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
    tl: { az: 'Subhanə Rəbbiyəl-Əla', en: "Subhana Rabbiyal-A'la", ru: 'Субхана Раббия-ль-А‘ля', tr: "Sübhane rabbiyel a'la" },
    mean: { az: 'Uca Rəbbim hər nöqsandan pakdır', en: 'Glory be to my Lord, the Most High', ru: 'Пречист мой Всевышний Господь', ar: 'تنزيه الله الأعلى في السجود', tr: 'En yüce Rabbimi her türlü noksanlıktan tenzih ederim' },
    repeat: 3,
  },
  jalsa: {
    ar: 'رَبِّ اغْفِرْ لِي، رَبِّ اغْفِرْ لِي',
    tl: { az: 'Rəbbiğfir li, Rəbbiğfir li', en: 'Rabbighfir li, Rabbighfir li', ru: 'Раббиг-фир ли, Раббиг-фир ли', tr: 'Rabbiğfir li, rabbiğfir li' },
    mean: { az: 'Rəbbim, məni bağışla', en: 'My Lord, forgive me', ru: 'Господь мой, прости меня', ar: 'طلب المغفرة بين السجدتين', tr: 'Rabbim, beni bağışla' },
  },
  tashahhud: {
    ar: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    tl: {
      az: 'Ət-təhiyyatu lillahi vəs-saləvatu vət-təyyibat. Əs-salamu ələykə əyyuhən-Nəbiyyu və rəhmətullahi və bərəkatuh. Əs-salamu ələynə və alə ibadillahis-salihin. Əşhədu ən la ilahə illəllah, və əşhədu ənnə Muhəmmədən abduhu və rasuluh.',
      en: "At-tahiyyatu lillahi was-salawatu wat-tayyibat. As-salamu 'alayka ayyuhan-Nabiyyu wa rahmatullahi wa barakatuh. As-salamu 'alayna wa 'ala 'ibadillahis-salihin. Ash-hadu an la ilaha illallah, wa ash-hadu anna Muhammadan 'abduhu wa rasuluh.",
      ru: 'Ат-тахийяту ли-Лляхи ва-с-салявату ва-т-таййибат. Ас-саляму ‘аляйка аййуха-н-Набийю ва рахмату-Ллахи ва баракатух. Ас-саляму ‘аляйна ва ‘аля ‘ибади-Лляхи-с-салихин. Ашхаду ан ля иляха илля-Ллах, ва ашхаду анна Мухаммадан ‘абдуху ва расулюх.',
      tr: 'Ettehiyyatü lillahi vessalavatü vettayyibat. Esselamü aleyke eyyühen-nebiyyü ve rahmetullahi ve berekatüh. Esselamü aleyna ve ala ibadillahis-salihin. Eşhedü en la ilahe illallah, ve eşhedü enne Muhammeden abdühu ve resulüh.',
    },
    mean: {
      az: 'Bütün salamlar, dualar və gözəl sözlər Allaha məxsusdur. Ey Peyğəmbər, sənə salam, Allahın rəhməti və bərəkətləri olsun. Bizə və Allahın saleh qullarına salam olsun. Şəhadət verirəm ki, Allahdan başqa ibadətə layiq ilah yoxdur və şəhadət verirəm ki, Muhəmməd Onun qulu və elçisidir.',
      en: 'All greetings, prayers and good words are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no god worthy of worship but Allah, and I bear witness that Muhammad is His servant and Messenger.',
      ru: 'Приветствия, молитвы и благие слова — Аллаху. Мир тебе, о Пророк, милость Аллаха и Его благословения. Мир нам и праведным рабам Аллаха. Свидетельствую, что нет божества, достойного поклонения, кроме Аллаха, и свидетельствую, что Мухаммад — Его раб и посланник.',
      ar: 'التشهد: الثناء على الله والسلام على النبي ﷺ وشهادة التوحيد',
      tr: "Bütün tahiyyeler, dualar ve güzel sözler Allah'a aittir. Ey Peygamber! Sana selam, Allah'ın rahmeti ve bereketleri olsun. Selam bize ve Allah'ın salih kullarına olsun. Şehadet ederim ki Allah'tan başka ibadete layık ilah yoktur ve yine şehadet ederim ki Muhammed O'nun kulu ve elçisidir.",
    },
  },
  salawat: {
    ar: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ',
    tl: {
      az: 'Allahummə salli alə Muhəmmədin və alə ali Muhəmməd, kəma salləytə alə İbrahimə və alə ali İbrahim, innəkə Həmidun Məcid. Allahummə barik alə Muhəmmədin və alə ali Muhəmməd, kəma barəktə alə İbrahimə və alə ali İbrahim, innəkə Həmidun Məcid.',
      en: "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammad, kama sallayta 'ala Ibrahima wa 'ala ali Ibrahim, innaka Hamidun Majid. Allahumma barik 'ala Muhammadin wa 'ala ali Muhammad, kama barakta 'ala Ibrahima wa 'ala ali Ibrahim, innaka Hamidun Majid.",
      ru: 'Аллахумма салли ‘аля Мухаммадин ва ‘аля али Мухаммад, кама салляйта ‘аля Ибрахима ва ‘аля али Ибрахим, иннака Хамидун Маджид. Аллахумма барик ‘аля Мухаммадин ва ‘аля али Мухаммад, кама баракта ‘аля Ибрахима ва ‘аля али Ибрахим, иннака Хамидун Маджид.',
      tr: 'Allahümme salli ala Muhammedin ve ala ali Muhammed, kema salleyte ala İbrahime ve ala ali İbrahim, inneke hamidün mecid. Allahümme barik ala Muhammedin ve ala ali Muhammed, kema barekte ala İbrahime ve ala ali İbrahim, inneke hamidün mecid.',
    },
    mean: {
      az: 'Allahım, İbrahimə və İbrahimin ailəsinə salavat etdiyin kimi Muhəmmədə və Muhəmmədin ailəsinə də salavat et; həqiqətən, Sən həmdə layiqsən, şanı ucasan. Allahım, İbrahimə və İbrahimin ailəsinə bərəkət verdiyin kimi Muhəmmədə və Muhəmmədin ailəsinə də bərəkət ver; həqiqətən, Sən həmdə layiqsən, şanı ucasan.',
      en: 'O Allah, send prayers upon Muhammad and the family of Muhammad, as You sent prayers upon Ibrahim and the family of Ibrahim; You are indeed Praiseworthy, Glorious. O Allah, bless Muhammad and the family of Muhammad, as You blessed Ibrahim and the family of Ibrahim; You are indeed Praiseworthy, Glorious.',
      ru: 'О Аллах, благослови Мухаммада и семью Мухаммада, как Ты благословил Ибрахима и семью Ибрахима, поистине, Ты — Достохвальный, Славный. О Аллах, ниспошли благодать Мухаммаду и семье Мухаммада, как Ты ниспослал благодать Ибрахиму и семье Ибрахима, поистине, Ты — Достохвальный, Славный.',
      ar: 'الصلاة الإبراهيمية على النبي ﷺ',
      tr: "Allah'ım! İbrahim'e ve İbrahim'in ailesine salat ettiğin gibi Muhammed'e ve Muhammed'in ailesine de salat eyle; şüphesiz Sen övülmeye layık ve şanı yüce olansın. Allah'ım! İbrahim'e ve İbrahim'in ailesine bereket verdiğin gibi Muhammed'e ve Muhammed'in ailesine de bereket ver; şüphesiz Sen övülmeye layık ve şanı yüce olansın.",
    },
  },
  arba: {
    ar: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ جَهَنَّمَ، وَمِنْ عَذَابِ الْقَبْرِ، وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ، وَمِنْ شَرِّ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ',
    tl: {
      az: 'Allahummə inni əuzu bikə min əzabi cəhənnəm, və min əzabil-qəbr, və min fitnətil-məhya vəl-məmat, və min şərri fitnətil-Məsihid-Dəccal.',
      en: "Allahumma inni a'udhu bika min 'adhabi jahannam, wa min 'adhabil-qabr, wa min fitnatil-mahya wal-mamat, wa min sharri fitnatil-Masihid-Dajjal.",
      ru: 'Аллахумма инни а‘узу бика мин ‘азаби джаханнам, ва мин ‘азаби-ль-кабр, ва мин фитнати-ль-махья ва-ль-мамат, ва мин шарри фитнати-ль-Масихи-д-Даджаль.',
      tr: 'Allahümme inni euzü bike min azabi cehennem, ve min azabil kabr, ve min fitnetil mahya vel memat, ve min şerri fitnetil Mesihid Deccal.',
    },
    mean: {
      az: 'Allahım, cəhənnəm əzabından, qəbir əzabından, həyatın və ölümün fitnəsindən və Məsih Dəccalın fitnəsinin şərindən Sənə sığınıram.',
      en: 'O Allah, I seek refuge in You from the punishment of Hell, from the punishment of the grave, from the trials of life and death, and from the evil of the trial of the False Messiah.',
      ru: 'О Аллах, прибегаю к Тебе от мучений Ада, от мучений могилы, от искушений жизни и смерти и от зла искушения Лжемессии (Даджаля).',
      ar: 'الاستعاذة من أربع قبل السلام',
      tr: "Allah'ım! Cehennem azabından, kabir azabından, hayatın ve ölümün fitnesinden ve Mesih Deccal'in fitnesinin şerrinden Sana sığınırım.",
    },
  },
  salam: {
    ar: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
    tl: { az: 'Əs-salamu ələykum və rəhmətullah', en: "As-salamu 'alaykum wa rahmatullah", ru: 'Ас-саляму ‘аляйкум ва рахмату-Ллах', tr: 'Esselamü aleyküm ve rahmetullah' },
    mean: { az: 'Sizə salam və Allahın rəhməti olsun', en: 'Peace and the mercy of Allah be upon you', ru: 'Мир вам и милость Аллаха', ar: 'التسليم يُختم به الصلاة', tr: "Selam ve Allah'ın rahmeti üzerinize olsun" },
  },
  bismillah: {
    ar: 'بِسْمِ اللَّهِ',
    tl: { az: 'Bismillah', en: 'Bismillah', ru: 'Бисмилля', tr: 'Bismillah' },
    mean: { az: 'Allahın adı ilə', en: 'In the name of Allah', ru: 'С именем Аллаха', ar: 'التسمية قبل الوضوء', tr: "Allah'ın adıyla" },
  },
  wuduDua: {
    ar: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    tl: {
      az: 'Əşhədu ən la ilahə illəllahu vəhdəhu la şərikə ləh, və əşhədu ənnə Muhəmmədən abduhu və rasuluh.',
      en: "Ash-hadu an la ilaha illallahu wahdahu la sharika lah, wa ash-hadu anna Muhammadan 'abduhu wa rasuluh.",
      ru: 'Ашхаду ан ля иляха илля-Ллаху вахдаху ля шарика лях, ва ашхаду анна Мухаммадан ‘абдуху ва расулюх.',
      tr: 'Eşhedü en la ilahe illallahu vahdehu la şerike leh, ve eşhedü enne Muhammeden abdühu ve resulüh.',
    },
    mean: {
      az: 'Şəhadət verirəm ki, Allahdan başqa ibadətə layiq ilah yoxdur, Onun şəriki yoxdur; şəhadət verirəm ki, Muhəmməd Onun qulu və elçisidir.',
      en: 'I bear witness that there is no god worthy of worship but Allah alone, without partner, and I bear witness that Muhammad is His servant and Messenger.',
      ru: 'Свидетельствую, что нет божества, достойного поклонения, кроме одного лишь Аллаха, у Которого нет сотоварища, и свидетельствую, что Мухаммад — Его раб и посланник.',
      ar: 'الشهادتان بعد الفراغ من الوضوء',
      tr: "Şehadet ederim ki Allah'tan başka ibadete layık ilah yoktur, O tektir, ortağı yoktur; ve şehadet ederim ki Muhammed O'nun kulu ve elçisidir.",
    },
  },
}

// ── Namaz addımları (hərəkətlər) ──
// pose — PrayerPose; lead — keçid zikri (hərəkətə başlayarkən); say — əsas zikrlər;
// refs — dəlillər; note — qeyd (askImam: ixtilaf var, imamdan soruşmaq tövsiyəsi)
const R = (c, n) => ({ c, n: String(n) })
const B = (book) => ({ book })

export const ACTIONS = {
  niyyah: {
    pose: 'stand', say: [],
    name: { az: 'Niyyət və qiblə', en: 'Intention and the Qibla', ru: 'Намерение и кибла', ar: 'النية واستقبال القبلة', tr: 'Niyet ve kıble' },
    do: {
      az: 'Qibləyə dönüb düz durun. Hansı namazı qıldığınızı qəlbinizdə niyyət edin — niyyət dillə deyilmir.',
      en: 'Stand upright facing the Qibla. Intend in your heart the prayer you are about to pray — the intention is not spoken aloud.',
      ru: 'Встаньте прямо лицом к кибле. Сделайте в сердце намерение совершить нужный намаз — намерение не произносят вслух.',
      ar: 'قِف مستقبلًا القبلة، وانوِ بقلبك الصلاة التي تريدها، ولا يُتلفَّظ بالنية.',
      tr: 'Kıbleye dönüp dik durun. Hangi namazı kılacağınıza kalben niyet edin — niyet dille söylenmez.',
    },
    refs: [R('bukhari', 1), R('bukhari', 6251), B('ibnbaz')],
  },
  takbir: {
    pose: 'takbir', say: ['takbir'],
    name: { az: 'Açılış təkbiri', en: 'Opening takbir', ru: 'Открывающий такбир', ar: 'تكبيرة الإحرام', tr: 'İftitah tekbiri' },
    do: {
      az: 'Əllərinizi çiyinləriniz və ya qulaq ucları səviyyəsinə qaldırın və «Allahu əkbər» deyin. Namaz bununla başlayır.',
      en: 'Raise your hands to the level of your shoulders or earlobes and say "Allahu akbar". The prayer begins with this.',
      ru: 'Поднимите руки до уровня плеч или мочек ушей и скажите «Аллаху акбар». С этого начинается намаз.',
      ar: 'ارفع يديك حَذوَ منكبيك أو إلى فروع أذنيك وقل: الله أكبر، وبها تبدأ الصلاة.',
      tr: 'Ellerinizi omuz veya kulak memesi hizasına kaldırın ve "Allahu ekber" deyin. Namaz bununla başlar.',
    },
    refs: [R('bukhari', 735), R('muslim', 391), B('albani')],
  },
  istiftah: {
    pose: 'qiyam', say: ['istiftah', 'taawwudh'],
    name: { az: 'Qiyam: açılış duası', en: 'Standing: opening supplication', ru: 'Стояние: вступительная мольба', ar: 'القيام: دعاء الاستفتاح', tr: 'Kıyam: açılış duası' },
    do: {
      az: 'Sağ əlinizi sol əlinizin üzərinə qoyub sinənizin üstündə saxlayın. Səssizcə açılış duasını, sonra istiazəni deyin.',
      en: 'Place your right hand over your left on your chest. Silently say the opening supplication, then seek refuge in Allah.',
      ru: 'Положите правую руку на левую на груди. Про себя прочитайте вступительную мольбу, затем испросите защиты у Аллаха.',
      ar: 'ضع يدك اليمنى على اليسرى على صدرك، واقرأ سرًّا دعاء الاستفتاح ثم الاستعاذة.',
      tr: 'Sağ elinizi sol elinizin üzerine koyup göğsünüzün üzerinde tutun. İçinizden açılış duasını, ardından istiazeyi okuyun.',
    },
    refs: [R('muslim', 401), R('ibnkhuzayma', 479), R('abudawud', 775), R('quran', '16:98')],
    note: {
      az: 'Peyğəmbərdən ﷺ başqa səhih açılış duaları da gəlib (məsələn, Buxari 744) — hansını oxusanız, sünnədir.',
      en: 'Other authentic opening supplications are also reported from the Prophet ﷺ (e.g. Bukhari 744) — any of them is Sunnah.',
      ru: 'От Пророка ﷺ передаются и другие достоверные вступительные мольбы (например, Бухари 744) — любая из них является сунной.',
      ar: 'وردت عن النبي ﷺ أدعية استفتاح أخرى صحيحة (منها: البخاري 744)، وأيها قرأتَ فهو سنة.',
      tr: "Peygamber'den ﷺ başka sahih açılış duaları da nakledilmiştir (örneğin Buhari 744) — hangisini okusanız sünnettir.",
    },
  },
  fatiha: {
    pose: 'qiyam', say: ['fatiha', 'amin'],
    name: { az: 'Fatihə surəsi', en: 'Surah al-Fatiha', ru: 'Сура «Аль-Фатиха»', ar: 'قراءة الفاتحة', tr: 'Fatiha suresi' },
    do: {
      az: '«Bismillah...» deyib Fatihəni oxuyun — Fatihəsiz namaz olmur. Sonunda «Amin» deyin.',
      en: 'Say "Bismillah…" and recite al-Fatiha — there is no prayer without it. Say "Amin" at the end.',
      ru: 'Скажите «Бисми-Лляхи…» и прочитайте «Аль-Фатиху» — без неё нет намаза. В конце скажите «Амин».',
      ar: 'اقرأ الفاتحة مبتدئًا بالبسملة، فلا صلاة إلا بها، ثم قل: آمين.',
      tr: "Besmele çekip Fatiha'yı okuyun — Fatiha'sız namaz olmaz. Sonunda \"Amin\" deyin.",
    },
    refs: [R('bukhari', 756), R('bukhari', 780)],
  },
  surah: {
    pose: 'qiyam', say: ['ikhlas'],
    name: { az: 'Qısa surə', en: 'A short surah', ru: 'Короткая сура', ar: 'قراءة سورة بعد الفاتحة', tr: 'Kısa sure' },
    do: {
      az: 'İlk iki rükətdə Fatihədən sonra bildiyiniz bir surə və ya bir neçə ayə oxuyun. Nümunə — İxlas surəsi.',
      en: 'In the first two rak‘ahs, after al-Fatiha recite a surah or a few verses you know. Example: Surah al-Ikhlas.',
      ru: 'В первых двух ракаатах после «Аль-Фатихи» прочитайте известную вам суру или несколько аятов. Пример — сура «Аль-Ихлас».',
      ar: 'في الركعتين الأوليين اقرأ بعد الفاتحة سورة أو آيات مما تحفظ، ومثالها سورة الإخلاص.',
      tr: "İlk iki rekatta Fatiha'dan sonra bildiğiniz bir sure veya birkaç ayet okuyun. Örnek: İhlas suresi.",
    },
    refs: [R('bukhari', 776)],
  },
  rise2: {
    pose: 'qiyam', lead: 'takbir', say: ['fatiha', 'amin'],
    name: { az: 'Qalxma və Fatihə', en: 'Rising and al-Fatiha', ru: 'Подъём и «Аль-Фатиха»', ar: 'القيام وقراءة الفاتحة', tr: 'Kalkış ve Fatiha' },
    do: {
      az: '«Allahu əkbər» deyərək növbəti rükətə qalxın, əlləri yenə sinəyə qoyun və Fatihəni oxuyun.',
      en: 'Rise for the next rak‘ah saying "Allahu akbar", place your hands on your chest again and recite al-Fatiha.',
      ru: 'Со словами «Аллаху акбар» встаньте на следующий ракаат, снова положите руки на грудь и прочитайте «Аль-Фатиху».',
      ar: 'انهض للركعة التالية مكبّرًا، وضع يديك على صدرك، واقرأ الفاتحة.',
      tr: "\"Allahu ekber\" diyerek sonraki rekata kalkın, ellerinizi yine göğsünüze koyun ve Fatiha'yı okuyun.",
    },
    refs: [R('bukhari', 789), R('bukhari', 756)],
  },
  rise3: {
    pose: 'takbir', lead: 'takbir', say: ['fatiha', 'amin'],
    name: { az: 'Üçüncü rükət: yalnız Fatihə', en: 'Third rak‘ah: al-Fatiha only', ru: 'Третий ракаат: только «Аль-Фатиха»', ar: 'الركعة الثالثة: الفاتحة فقط', tr: 'Üçüncü rekat: yalnız Fatiha' },
    do: {
      az: 'Birinci təşəhhüddən «Allahu əkbər» deyərək qalxın və əllərinizi təkbirdəki kimi qaldırın. Bu rükətdə yalnız Fatihə oxunur.',
      en: 'Rise from the first tashahhud saying "Allahu akbar" and raise your hands as in the opening takbir. Only al-Fatiha is recited in this rak‘ah.',
      ru: 'Поднимитесь после первого ташаххуда со словами «Аллаху акбар» и поднимите руки, как при первом такбире. В этом ракаате читается только «Аль-Фатиха».',
      ar: 'انهض من التشهد الأول مكبّرًا رافعًا يديك كما في تكبيرة الإحرام، واقرأ في هذه الركعة الفاتحة فقط.',
      tr: "İlk teşehhüdden \"Allahu ekber\" diyerek kalkın ve ellerinizi iftitah tekbirindeki gibi kaldırın. Bu rekatta yalnız Fatiha okunur.",
    },
    refs: [R('bukhari', 739), R('bukhari', 776)],
  },
  rise4: {
    pose: 'qiyam', lead: 'takbir', say: ['fatiha', 'amin'],
    name: { az: 'Dördüncü rükət: yalnız Fatihə', en: 'Fourth rak‘ah: al-Fatiha only', ru: 'Четвёртый ракаат: только «Аль-Фатиха»', ar: 'الركعة الرابعة: الفاتحة فقط', tr: 'Dördüncü rekat: yalnız Fatiha' },
    do: {
      az: '«Allahu əkbər» deyərək qalxın, əlləri sinəyə qoyun və yalnız Fatihəni oxuyun.',
      en: 'Rise saying "Allahu akbar", place your hands on your chest and recite al-Fatiha only.',
      ru: 'Поднимитесь со словами «Аллаху акбар», положите руки на грудь и прочитайте только «Аль-Фатиху».',
      ar: 'انهض مكبّرًا، وضع يديك على صدرك، واقرأ الفاتحة فقط.',
      tr: "\"Allahu ekber\" diyerek kalkın, ellerinizi göğsünüze koyun ve yalnız Fatiha'yı okuyun.",
    },
    refs: [R('bukhari', 789), R('bukhari', 776)],
  },
  ruku: {
    pose: 'ruku', lead: 'takbir', say: ['ruku'],
    name: { az: 'Rüku', en: 'Bowing (ruku‘)', ru: 'Поясной поклон (руку‘)', ar: 'الركوع', tr: 'Rükû' },
    do: {
      az: '«Allahu əkbər» deyib əllərinizi qaldırın və əyilin. Əllər dizlərin üstündə, bel və baş bir xətt üzərində olsun. Zikri ən azı bir dəfə, adətən üç dəfə deyin.',
      en: 'Say "Allahu akbar", raise your hands and bow. Hands on the knees, back and head level. Say the dhikr at least once, commonly three times.',
      ru: 'Скажите «Аллаху акбар», поднимите руки и поклонитесь. Руки на коленях, спина и голова на одной линии. Произнесите зикр хотя бы раз, обычно — три раза.',
      ar: 'كبّر رافعًا يديك ثم اركع، واجعل يديك على ركبتيك، وسوِّ ظهرك مع رأسك، وقل الذكر مرة على الأقل، والغالب ثلاثًا.',
      tr: '"Allahu ekber" deyip ellerinizi kaldırın ve eğilin. Eller dizlerde, sırt ve baş düz bir çizgide olsun. Zikri en az bir kez, genellikle üç kez söyleyin.',
    },
    refs: [R('bukhari', 735), R('bukhari', 828), R('muslim', 772)],
  },
  itidal: {
    pose: 'itidal', say: ['sami', 'rabbana'],
    name: { az: 'Rükudan qalxma', en: 'Rising from ruku‘', ru: 'Выпрямление после поклона', ar: 'الرفع من الركوع', tr: 'Rükûdan doğrulma' },
    do: {
      az: 'Əllərinizi qaldıraraq qalxın və «Səmiallahu limən həmidəh» deyin. Tam düzələndə «Rəbbənə və ləkəl-həmd» deyin.',
      en: 'Rise while raising your hands, saying "Sami‘allahu liman hamidah". Once fully upright, say "Rabbana wa lakal-hamd".',
      ru: 'Выпрямляйтесь, поднимая руки, со словами «Сами‘а-Ллаху ли-ман хамидах». Выпрямившись полностью, скажите «Раббана ва ляка-ль-хамд».',
      ar: 'ارفع من الركوع رافعًا يديك قائلًا: سمع الله لمن حمده، فإذا استويت قائمًا فقل: ربنا ولك الحمد.',
      tr: 'Ellerinizi kaldırarak doğrulun ve "Semiallahü limen hamideh" deyin. Tam doğrulunca "Rabbena ve lekel hamd" deyin.',
    },
    refs: [R('bukhari', 735), R('bukhari', 789)],
    askImam: true,
    note: {
      az: 'Rükudan qalxandan sonra əllərin sinəyə qoyulub-qoyulmaması barədə alimlər arasında fikir ayrılığı var — imamınızdan soruşun.',
      en: 'Scholars differ on whether the hands are placed on the chest again after rising from ruku‘ — ask your imam.',
      ru: 'Учёные расходятся во мнениях, кладут ли руки на грудь после выпрямления из поклона, — спросите своего имама.',
      ar: 'اختلف العلماء في وضع اليدين على الصدر بعد الرفع من الركوع، فاسأل إمامك.',
      tr: 'Rükûdan doğrulduktan sonra ellerin göğse konup konmayacağı konusunda alimler arasında görüş ayrılığı vardır — imamınıza danışın.',
    },
  },
  sujud: {
    pose: 'sujud', lead: 'takbir', say: ['sujud'],
    name: { az: 'Səcdə', en: 'Prostration (sujud)', ru: 'Земной поклон (суджуд)', ar: 'السجود', tr: 'Secde' },
    do: {
      az: '«Allahu əkbər» deyib səcdəyə enin. Alın və burun, iki ovuc, iki diz və ayaq barmaqları yerə dəysin; qollar yerə sərilməsin, dirsəklər yanlardan aralı olsun.',
      en: 'Say "Allahu akbar" and go down into prostration. Forehead and nose, both palms, both knees and the toes touch the ground; do not lay your forearms on the ground, and keep your elbows away from your sides.',
      ru: 'Скажите «Аллаху акбар» и опуститесь в земной поклон. Лоб с носом, обе ладони, оба колена и пальцы ног касаются земли; не кладите предплечья на землю, локти держите в стороне от боков.',
      ar: 'كبِّر واسجد على سبعة أعظم: الجبهة مع الأنف، واليدين، والركبتين، وأطراف القدمين، ولا تبسط ذراعيك على الأرض، وجافِ مرفقيك عن جنبيك.',
      tr: '"Allahu ekber" deyip secdeye inin. Alın ve burun, iki avuç, iki diz ve ayak parmakları yere değsin; kollar yere yayılmasın, dirsekler yanlardan uzak olsun.',
    },
    refs: [R('bukhari', 789), R('bukhari', 812), R('bukhari', 822), R('muslim', 772)],
    askImam: true,
    note: {
      az: 'Səcdəyə enərkən yerə əvvəl əllərin, yoxsa dizlərin qoyulması barədə Sələf alimləri arasında ixtilaf var (Albani — əvvəl əllər; İbn Baz və İbn Useymin — əvvəl dizlər). İmamınızdan soruşun.',
      en: 'Salafi scholars differ on whether the hands or the knees touch the ground first when going down (al-Albani: hands first; Ibn Baz and Ibn Uthaymin: knees first). Ask your imam.',
      ru: 'Учёные-саляфиты расходятся во мнениях, что опускать на землю первым — руки или колени (аль-Альбани — руки; Ибн Баз и Ибн Усеймин — колени). Спросите своего имама.',
      ar: 'اختلف علماء السلف في النزول إلى السجود: باليدين أولًا (الألباني) أم بالركبتين (ابن باز وابن عثيمين)، فاسأل إمامك.',
      tr: 'Secdeye inerken önce ellerin mi yoksa dizlerin mi yere konacağı konusunda Selef alimleri arasında ihtilaf vardır (Elbani — önce eller; İbn Baz ve İbn Useymin — önce dizler). İmamınıza danışın.',
    },
  },
  jalsa: {
    pose: 'jalsa', lead: 'takbir', say: ['jalsa'],
    name: { az: 'İki səcdə arası oturuş', en: 'Sitting between the prostrations', ru: 'Сидение между земными поклонами', ar: 'الجلسة بين السجدتين', tr: 'İki secde arası oturuş' },
    do: {
      az: '«Allahu əkbər» deyib başınızı qaldırın: sol ayağın üstündə oturun, sağ ayağı barmaqları qibləyə baxan halda dik saxlayın. Əllər budların üstündə.',
      en: 'Say "Allahu akbar" and sit up: sit on your left foot and keep the right foot upright with the toes facing the Qibla. Hands rest on the thighs.',
      ru: 'Скажите «Аллаху акбар» и сядьте: сидите на левой стопе, правую держите вертикально, пальцами к кибле. Руки на бёдрах.',
      ar: 'كبّر وارفع رأسك واجلس مفترشًا رجلك اليسرى ناصبًا اليمنى موجِّهًا أصابعها إلى القبلة، ويداك على فخذيك.',
      tr: '"Allahu ekber" deyip başınızı kaldırın: sol ayağınızın üzerine oturun, sağ ayağı parmakları kıbleye bakacak şekilde dik tutun. Eller uyluklarda.',
    },
    refs: [R('bukhari', 828), R('abudawud', 874)],
  },
  sujud2: {
    pose: 'sujud', lead: 'takbir', say: ['sujud'],
    name: { az: 'İkinci səcdə', en: 'Second prostration', ru: 'Второй земной поклон', ar: 'السجدة الثانية', tr: 'İkinci secde' },
    do: {
      az: '«Allahu əkbər» deyib yenidən səcdəyə gedin və eyni zikri deyin.',
      en: 'Say "Allahu akbar", prostrate again and say the same dhikr.',
      ru: 'Скажите «Аллаху акбар», снова совершите земной поклон и произнесите тот же зикр.',
      ar: 'كبّر واسجد السجدة الثانية، وقل الذكر نفسه.',
      tr: '"Allahu ekber" deyip tekrar secdeye gidin ve aynı zikri söyleyin.',
    },
    refs: [R('bukhari', 789), R('muslim', 772)],
  },
  tashahhud1: {
    pose: 'tashahhud', lead: 'takbir', say: ['tashahhud'],
    name: { az: 'Birinci təşəhhüd', en: 'First tashahhud', ru: 'Первый ташаххуд', ar: 'التشهد الأول', tr: 'İlk teşehhüd' },
    do: {
      az: 'İkinci rükətin səcdələrindən sonra «Allahu əkbər» deyib sol ayağın üstündə oturun. Sağ əlin şəhadət barmağı ilə işarə edin və təşəhhüdü oxuyun, sonra üçüncü rükətə qalxın.',
      en: 'After the prostrations of the second rak‘ah, say "Allahu akbar" and sit on your left foot. Point with the right index finger, recite the tashahhud, then rise for the third rak‘ah.',
      ru: 'После земных поклонов второго ракаата скажите «Аллаху акбар» и сядьте на левую стопу. Укажите указательным пальцем правой руки, прочитайте ташаххуд, затем встаньте на третий ракаат.',
      ar: 'بعد سجدتي الركعة الثانية كبّر واجلس مفترشًا، وأشر بسبابتك اليمنى، واقرأ التشهد، ثم انهض للركعة الثالثة.',
      tr: 'İkinci rekatın secdelerinden sonra "Allahu ekber" deyip sol ayağınızın üzerine oturun. Sağ elin şehadet parmağıyla işaret edin, teşehhüdü okuyun, sonra üçüncü rekata kalkın.',
    },
    refs: [R('bukhari', 831), R('muslim', 580), R('bukhari', 828)],
    askImam: true,
    note: {
      az: 'İbn Məsud deyib: Peyğəmbər ﷺ vəfat etdikdən sonra «əs-salamu ələn-Nəbiyy» deyirdik (Buxari 6265). Albani bu formanı üstün tutub; hansı formanı deməyi imamınızdan soruşun.',
      en: 'Ibn Mas‘ud said that after the Prophet ﷺ passed away they would say "as-salamu ‘alan-Nabiyy" (Bukhari 6265). Al-Albani preferred this form; ask your imam which wording to use.',
      ru: 'Ибн Мас‘уд сказал, что после кончины Пророка ﷺ они говорили «ас-саляму ‘аля-н-Наби» (Бухари 6265). Аль-Альбани отдавал предпочтение этой форме; какую форму произносить — спросите своего имама.',
      ar: 'قال ابن مسعود: لما قُبض النبي ﷺ قلنا: السلام على النبي (البخاري 6265)، ورجّحه الألباني؛ فاسأل إمامك أي الصيغتين تقول.',
      tr: 'İbn Mesud, Peygamber ﷺ vefat ettikten sonra "esselamü alen-nebiyy" dediklerini söylemiştir (Buhari 6265). Elbani bu şekli tercih etmiştir; hangisini söyleyeceğinizi imamınıza danışın.',
    },
  },
  final2: {
    pose: 'tashahhud', lead: 'takbir', say: ['tashahhud'],
    name: { az: 'Son təşəhhüd', en: 'Final tashahhud', ru: 'Последний ташаххуд', ar: 'التشهد الأخير', tr: 'Son teşehhüd' },
    do: {
      az: 'Son rükətin səcdələrindən sonra «Allahu əkbər» deyib sol ayağın üstündə oturun, şəhadət barmağı ilə işarə edin və təşəhhüdü oxuyun.',
      en: 'After the prostrations of the last rak‘ah, say "Allahu akbar", sit on your left foot, point with the index finger and recite the tashahhud.',
      ru: 'После земных поклонов последнего ракаата скажите «Аллаху акбар», сядьте на левую стопу, укажите указательным пальцем и прочитайте ташаххуд.',
      ar: 'بعد سجدتي الركعة الأخيرة كبّر واجلس مفترشًا، وأشر بسبابتك، واقرأ التشهد.',
      tr: 'Son rekatın secdelerinden sonra "Allahu ekber" deyip sol ayağınızın üzerine oturun, şehadet parmağıyla işaret edin ve teşehhüdü okuyun.',
    },
    refs: [R('bukhari', 831), R('muslim', 580), R('bukhari', 828)],
  },
  final34: {
    pose: 'tawarruk', lead: 'takbir', say: ['tashahhud'],
    name: { az: 'Son təşəhhüd (təvərrük)', en: 'Final tashahhud (tawarruk)', ru: 'Последний ташаххуд (таваррук)', ar: 'التشهد الأخير (التورك)', tr: 'Son teşehhüd (teverrük)' },
    do: {
      az: 'Son rükətin səcdələrindən sonra «Allahu əkbər» deyib oturun: sol ayağı sağ baldırın altından çıxarın, oturacaq yerə dəysin, sağ ayaq dik qalsın. Şəhadət barmağı ilə işarə edib təşəhhüdü oxuyun.',
      en: 'After the prostrations of the last rak‘ah, say "Allahu akbar" and sit: bring the left foot out from under the right shin and sit on the ground, keeping the right foot upright. Point with the index finger and recite the tashahhud.',
      ru: 'После земных поклонов последнего ракаата скажите «Аллаху акбар» и сядьте: выведите левую стопу из-под правой голени и сядьте на пол, правая стопа остаётся вертикальной. Укажите указательным пальцем и прочитайте ташаххуд.',
      ar: 'بعد سجدتي الركعة الأخيرة كبّر واجلس متورّكًا: أخرج رجلك اليسرى من تحت ساقك اليمنى واقعد على مقعدتك ناصبًا اليمنى، وأشر بسبابتك واقرأ التشهد.',
      tr: 'Son rekatın secdelerinden sonra "Allahu ekber" deyip oturun: sol ayağı sağ baldırın altından çıkarın, oturağınız yere değsin, sağ ayak dik kalsın. Şehadet parmağıyla işaret edip teşehhüdü okuyun.',
    },
    refs: [R('bukhari', 828), R('bukhari', 831), R('muslim', 580)],
  },
  salawat: {
    pose: 'tashahhud', say: ['salawat'],
    name: { az: 'Salavat', en: 'Prayers upon the Prophet ﷺ', ru: 'Салават Пророку ﷺ', ar: 'الصلاة الإبراهيمية', tr: 'Salli-Barik duaları' },
    do: {
      az: 'Son təşəhhüddən sonra oturduğunuz yerdə Peyğəmbərə ﷺ salavat oxuyun.',
      en: 'After the final tashahhud, still sitting, send prayers upon the Prophet ﷺ.',
      ru: 'После последнего ташаххуда, оставаясь сидеть, прочитайте салават Пророку ﷺ.',
      ar: 'بعد التشهد الأخير صلِّ على النبي ﷺ وأنت جالس.',
      tr: "Son teşehhüdden sonra oturduğunuz yerde Peygamber'e ﷺ salavat okuyun.",
    },
    refs: [R('bukhari', 3370)],
  },
  dua: {
    pose: 'tashahhud', say: ['arba'],
    name: { az: 'Salamdan əvvəl dua', en: 'Supplication before the salam', ru: 'Мольба перед салямом', ar: 'الدعاء قبل السلام', tr: 'Selamdan önce dua' },
    do: {
      az: 'Dörd şeydən Allaha sığının; sonra istədiyiniz xeyirli dua ilə dua edə bilərsiniz.',
      en: 'Seek refuge in Allah from four things; then you may ask for whatever good you wish.',
      ru: 'Попросите у Аллаха защиты от четырёх вещей; затем можно обратиться с любой благой мольбой.',
      ar: 'استعذ بالله من أربع، ثم تخيّر من الدعاء ما شئت.',
      tr: "Dört şeyden Allah'a sığının; ardından dilediğiniz hayırlı duayı edebilirsiniz.",
    },
    refs: [R('muslim', 588), R('bukhari', 835)],
  },
  salamR: {
    pose: 'salamR', say: ['salam'],
    name: { az: 'Salam — sağa', en: 'Salam — to the right', ru: 'Салям — направо', ar: 'التسليم عن اليمين', tr: 'Selam — sağa' },
    do: {
      az: 'Başınızı sağa çevirib salam verin.',
      en: 'Turn your head to the right and give the salam.',
      ru: 'Поверните голову направо и произнесите салям.',
      ar: 'التفت عن يمينك وسلِّم.',
      tr: 'Başınızı sağa çevirip selam verin.',
    },
    refs: [R('muslim', 582), R('abudawud', 996)],
  },
  salamL: {
    pose: 'salamL', say: ['salam'],
    name: { az: 'Salam — sola', en: 'Salam — to the left', ru: 'Салям — налево', ar: 'التسليم عن اليسار', tr: 'Selam — sola' },
    do: {
      az: 'Başınızı sola çevirib eyni sözləri deyin. Namaz tamamlandı.',
      en: 'Turn your head to the left and say the same words. The prayer is complete.',
      ru: 'Поверните голову налево и произнесите те же слова. Намаз завершён.',
      ar: 'التفت عن يسارك وسلِّم كذلك، وبه تتم الصلاة.',
      tr: 'Başınızı sola çevirip aynı sözleri söyleyin. Namaz tamamlandı.',
    },
    refs: [R('muslim', 582), R('abudawud', 996)],
  },
}

// ── Namaz növləri ──
export const PRAYERS = [
  { key: 'fajr', rakats: 2, icon: 'sunrise', name: { az: 'Sübh', en: 'Fajr', ru: 'Фаджр', ar: 'الفجر', tr: 'Sabah' } },
  { key: 'dhuhr', rakats: 4, icon: 'sun', name: { az: 'Zöhr', en: 'Dhuhr', ru: 'Зухр', ar: 'الظهر', tr: 'Öğle' } },
  { key: 'asr', rakats: 4, icon: 'sunLow', name: { az: 'Əsr', en: 'Asr', ru: 'Аср', ar: 'العصر', tr: 'İkindi' } },
  { key: 'maghrib', rakats: 3, icon: 'sunset', name: { az: 'Məğrib', en: 'Maghrib', ru: 'Магриб', ar: 'المغرب', tr: 'Akşam' } },
  { key: 'isha', rakats: 4, icon: 'moon', name: { az: 'İşa', en: 'Isha', ru: 'Иша', ar: 'العشاء', tr: 'Yatsı' } },
]

/**
 * N rükətli namazın tam addım ardıcıllığı.
 * Hər element: { id, rakat } — id ACTIONS-dakı açardır.
 * 2 rükət → 22 addım, 3 → 29, 4 → 35.
 */
export function buildSequence(rakats) {
  const n = Math.min(4, Math.max(2, Number(rakats) || 2))
  const seq = []
  const add = (id, rakat) => seq.push({ id, rakat })
  const tail = r => ['ruku', 'itidal', 'sujud', 'jalsa', 'sujud2'].forEach(id => add(id, r))

  // 1-ci rükət
  ;['niyyah', 'takbir', 'istiftah', 'fatiha', 'surah'].forEach(id => add(id, 1))
  tail(1)
  // 2-ci rükət
  add('rise2', 2); add('surah', 2); tail(2)
  if (n > 2) {
    add('tashahhud1', 2)
    add('rise3', 3); tail(3)
  }
  if (n > 3) {
    add('rise4', 4); tail(4)
  }
  // Son oturuş və salam
  add(n > 2 ? 'final34' : 'final2', n)
  ;['salawat', 'dua', 'salamR', 'salamL'].forEach(id => add(id, n))
  // Son oturuşdakı salavat/dua addımları təvərrük mövqeyində qalır
  return seq.map(s => ({ ...s, pose: n > 2 && (s.id === 'salawat' || s.id === 'dua') ? 'tawarruk' : ACTIONS[s.id].pose }))
}

// ── Dəstəmaz ──
export const WUDU = [
  {
    id: 'intent', pose: 'jug', say: ['bismillah'],
    name: { az: 'Niyyət və «Bismillah»', en: 'Intention and "Bismillah"', ru: 'Намерение и «Бисмилля»', ar: 'النية والتسمية', tr: 'Niyet ve "Bismillah"' },
    do: {
      az: 'Qəlbinizdə dəstəmaz almağa niyyət edin və «Bismillah» deyin.',
      en: 'Intend in your heart to make wudu and say "Bismillah".',
      ru: 'Сделайте в сердце намерение совершить омовение и скажите «Бисмилля».',
      ar: 'انوِ الوضوء بقلبك وقل: بسم الله.',
      tr: 'Kalben abdest almaya niyet edin ve "Bismillah" deyin.',
    },
    refs: [R('bukhari', 1), R('abudawud', 101)],
  },
  {
    id: 'hands', pose: 'hands', say: [], times: 3,
    name: { az: 'Əlləri yumaq', en: 'Washing the hands', ru: 'Мытьё кистей рук', ar: 'غسل الكفين', tr: 'Elleri yıkamak' },
    do: {
      az: 'Əllərinizi biləyə qədər üç dəfə yuyun.',
      en: 'Wash your hands up to the wrists three times.',
      ru: 'Вымойте кисти рук до запястий три раза.',
      ar: 'اغسل كفيك ثلاث مرات.',
      tr: 'Ellerinizi bileklere kadar üç kez yıkayın.',
    },
    refs: [R('bukhari', 159), R('muslim', 226)],
  },
  {
    id: 'mouth', pose: 'mouth', say: [], times: 3,
    name: { az: 'Ağız və burun', en: 'Mouth and nose', ru: 'Рот и нос', ar: 'المضمضة والاستنشاق', tr: 'Ağız ve burun' },
    do: {
      az: 'Bir ovuc su ilə ağzınızı yaxalayın, burnunuza su çəkib çıxarın — üç dəfə.',
      en: 'With one handful of water rinse your mouth, then draw water into your nose and blow it out — three times.',
      ru: 'Одной пригоршней воды прополощите рот, втяните воду носом и высморкайте её — три раза.',
      ar: 'تمضمض واستنشق واستنثر من كفٍّ واحدة، ثلاث مرات.',
      tr: 'Bir avuç suyla ağzınızı çalkalayın, burnunuza su çekip sümkürün — üç kez.',
    },
    refs: [R('bukhari', 191), R('muslim', 226)],
  },
  {
    id: 'face', pose: 'face', say: [], times: 3,
    name: { az: 'Üzü yumaq', en: 'Washing the face', ru: 'Мытьё лица', ar: 'غسل الوجه', tr: 'Yüzü yıkamak' },
    do: {
      az: 'Üzünüzü alında saçın bitdiyi yerdən çənənin altına, bir qulaqdan o biri qulağa qədər üç dəfə yuyun.',
      en: 'Wash your face three times, from the hairline to below the chin and from ear to ear.',
      ru: 'Вымойте лицо три раза — от границы волос до подбородка и от уха до уха.',
      ar: 'اغسل وجهك ثلاثًا، من منابت شعر الرأس إلى أسفل الذقن، ومن الأذن إلى الأذن.',
      tr: 'Yüzünüzü saç bitiminden çenenin altına, bir kulaktan diğerine kadar üç kez yıkayın.',
    },
    refs: [R('quran', '5:6'), R('bukhari', 159)],
  },
  {
    id: 'arms', pose: 'arms', say: [], times: 3,
    name: { az: 'Qolları yumaq', en: 'Washing the arms', ru: 'Мытьё рук до локтей', ar: 'غسل اليدين إلى المرفقين', tr: 'Kolları yıkamak' },
    do: {
      az: 'Əvvəl sağ, sonra sol qolunuzu barmaq uclarından dirsəklə birlikdə üç dəfə yuyun.',
      en: 'Wash the right arm, then the left, from the fingertips up to and including the elbow, three times.',
      ru: 'Вымойте сначала правую, затем левую руку от кончиков пальцев до локтя включительно, три раза.',
      ar: 'اغسل يدك اليمنى ثم اليسرى من أطراف الأصابع إلى المرفقين مع إدخالهما، ثلاثًا.',
      tr: 'Önce sağ, sonra sol kolunuzu parmak uçlarından dirseklerle birlikte üç kez yıkayın.',
    },
    refs: [R('quran', '5:6'), R('bukhari', 159), R('bukhari', 168)],
  },
  {
    id: 'head', pose: 'head', say: [], times: 1,
    name: { az: 'Başa məsh', en: 'Wiping the head', ru: 'Протирание головы', ar: 'مسح الرأس', tr: 'Başı meshetmek' },
    do: {
      az: 'Yaş əllərinizi alından ənsəyə, sonra geriyə — alına qədər çəkin. Bir dəfə.',
      en: 'Pass your wet hands from the forehead to the nape, then back to the forehead. Once.',
      ru: 'Проведите влажными руками ото лба до затылка и обратно ко лбу. Один раз.',
      ar: 'امسح رأسك بيديك المبلولتين، أقبل بهما وأدبر: من مقدَّم الرأس إلى القفا ثم ردّهما. مرة واحدة.',
      tr: 'Islak ellerinizi alından enseye, sonra geri alına kadar çekin. Bir kez.',
    },
    refs: [R('quran', '5:6'), R('bukhari', 185)],
  },
  {
    id: 'ears', pose: 'ears', say: [], times: 1,
    name: { az: 'Qulaqlara məsh', en: 'Wiping the ears', ru: 'Протирание ушей', ar: 'مسح الأذنين', tr: 'Kulakları meshetmek' },
    do: {
      az: 'Şəhadət barmaqları ilə qulaqların içini, baş barmaqlarla arxasını məsh edin.',
      en: 'Wipe the inside of the ears with your index fingers and the back of them with your thumbs.',
      ru: 'Протрите уши: внутреннюю сторону — указательными пальцами, внешнюю — большими.',
      ar: 'امسح باطن أذنيك بالسبابتين وظاهرهما بالإبهامين.',
      tr: 'Şehadet parmaklarıyla kulakların içini, baş parmaklarla arkasını meshedin.',
    },
    refs: [R('nasai', 102)],
  },
  {
    id: 'feet', pose: 'feet', say: [], times: 3,
    name: { az: 'Ayaqları yumaq', en: 'Washing the feet', ru: 'Мытьё ног', ar: 'غسل الرجلين', tr: 'Ayakları yıkamak' },
    do: {
      az: 'Əvvəl sağ, sonra sol ayağınızı topuqlarla birlikdə üç dəfə yuyun, barmaqların arasını da ovuşdurun.',
      en: 'Wash the right foot, then the left, up to and including the ankles, three times, rubbing between the toes.',
      ru: 'Вымойте сначала правую, затем левую ногу вместе с щиколотками, три раза, протирая между пальцами.',
      ar: 'اغسل رجلك اليمنى ثم اليسرى إلى الكعبين ثلاثًا، وخلِّل بين الأصابع.',
      tr: 'Önce sağ, sonra sol ayağınızı topuklarla birlikte üç kez yıkayın, parmak aralarını da ovun.',
    },
    refs: [R('quran', '5:6'), R('muslim', 226), R('abudawud', 142)],
  },
]

export const WUDU_AFTER = { say: ['wuduDua'], refs: [R('muslim', 234)] }
export const WUDU_NOTE = {
  refs: [R('bukhari', 157), R('bukhari', 158)],
  text: {
    az: 'Hər üzvü bir və ya iki dəfə yumaq da caizdir — Peyğəmbər ﷺ belə də dəstəmaz alıb.',
    en: 'Washing each part once or twice is also valid — the Prophet ﷺ made wudu this way as well.',
    ru: 'Допустимо мыть каждую часть один или два раза — Пророк ﷺ совершал омовение и так.',
    ar: 'ويجزئ غسل كل عضو مرة أو مرتين، فقد توضأ النبي ﷺ كذلك.',
    tr: "Her uzvu bir veya iki kez yıkamak da caizdir — Peygamber ﷺ böyle de abdest almıştır.",
  },
}

// ── İnterfeys mətnləri ──
export const PG_TEXT = {
  az: {
    title: 'Namaz necə qılınır', lead: 'Hər hərəkət addım-addım, təsvirlə; oxunan dualar ərəbcə, transliterasiya və mənası ilə, mənbə göstərilməklə. Yeni müsəlmanlar və uşaqlar üçün.',
    modes: 'Bələdçi növü', mPrayer: 'Namaz', mWudu: 'Dəstəmaz',
    selectPrayer: 'Namazı seçin', selectSub: 'Rükət sayına görə tam ardıcıllıq', rakatN: n => `${n} rükət`,
    step: 'Addım', rakat: 'Rükət', prev: 'Əvvəlki', next: 'Növbəti', back: 'Namazlar',
    whatDo: 'Nə edilir', whatSay: 'Nə deyilir', transition: 'Hərəkətə keçərkən', meaning: 'Mənası', times: n => `${n} dəfə`,
    sources: 'Mənbələr', basis: 'Əsas istinad', note: 'Qeyd', askImam: 'İmamınızdan soruşun',
    listen: 'Dinlə', stop: 'Dayandır', audioErr: 'Səs yüklənmədi',
    figure: 'Təsvir', male: 'Kişi', female: 'Qadın',
    complete: 'Namaz tamamlandı', completeSub: 'Allah qəbul etsin.', restart: 'Yenidən', choose: 'Başqa namaz',
    paper: 'Kağızla namaz', paperCta: 'Kağızla namaz rejimi', paperCtaSub: 'Telefonu qarşınıza qoyun: hər addımda deyiləcək söz böyük hərflərlə görünür.',
    paperNote: 'Bu rejim öyrənmə dövrü üçün köməkçidir. Namazda telefondan oxumağın hökmü barədə imamınızdan soruşun.',
    start: 'Başla', exit: 'Çıx', pause: 'Fasilə', resume: 'Davam', advance: 'Keçid', tap: 'Toxunuşla', auto: 'Avtomatik', seconds: 'san',
    tapHint: 'Növbəti addım üçün ekranın istənilən yerinə toxunun', nextUp: 'Sonra', last: 'Son addım',
    wakeOn: 'Ekran sönməyəcək', wakeOff: 'Bu brauzer ekranın sönməsinin qarşısını ala bilmir — telefonun ekran vaxtını artırın.',
    wuduTitle: 'Dəstəmaz', wuduSub: 'Peyğəmbərin ﷺ dəstəmazı — addım-addım', wuduDone: 'Dəstəmaz tamamlandı', wuduAfter: 'Dəstəmazdan sonra',
    credits: 'Səs mənbələri və lisenziyalar',
    noAudio: 'Bu zikrin açıq lisenziyalı səsi tapılmadı',
  },
  en: {
    title: 'How to pray', lead: 'Every movement step by step with illustrations; what to say in Arabic, with transliteration, meaning and sources. For new Muslims and children.',
    modes: 'Guide type', mPrayer: 'Prayer', mWudu: 'Wudu',
    selectPrayer: 'Choose a prayer', selectSub: 'The full sequence by number of rak‘ahs', rakatN: n => `${n} rak‘ahs`,
    step: 'Step', rakat: 'Rak‘ah', prev: 'Previous', next: 'Next', back: 'Prayers',
    whatDo: 'What to do', whatSay: 'What to say', transition: 'While moving', meaning: 'Meaning', times: n => `${n} times`,
    sources: 'Sources', basis: 'Main reference', note: 'Note', askImam: 'Ask your imam',
    listen: 'Listen', stop: 'Stop', audioErr: 'Audio failed to load',
    figure: 'Figure', male: 'Male', female: 'Female',
    complete: 'Prayer complete', completeSub: 'May Allah accept it.', restart: 'Again', choose: 'Another prayer',
    paper: 'Prayer prompter', paperCta: 'Prayer prompter mode', paperCtaSub: 'Place the phone in front of you: what to say at each step appears in large letters.',
    paperNote: 'This mode is a helper for the learning period. Ask your imam about the ruling on reading from a phone during prayer.',
    start: 'Start', exit: 'Exit', pause: 'Pause', resume: 'Resume', advance: 'Advance', tap: 'By tap', auto: 'Automatic', seconds: 's',
    tapHint: 'Tap anywhere on the screen for the next step', nextUp: 'Next', last: 'Last step',
    wakeOn: 'The screen will stay on', wakeOff: 'This browser cannot keep the screen on — increase your phone’s screen timeout.',
    wuduTitle: 'Wudu', wuduSub: 'The wudu of the Prophet ﷺ — step by step', wuduDone: 'Wudu complete', wuduAfter: 'After wudu',
    credits: 'Audio sources and licences',
    noAudio: 'No openly licensed recording of this dhikr was found',
  },
  ru: {
    title: 'Как совершать намаз', lead: 'Каждое движение шаг за шагом, с иллюстрациями; что произносить — по-арабски, в транслитерации и с переводом, с указанием источников. Для новых мусульман и детей.',
    modes: 'Тип руководства', mPrayer: 'Намаз', mWudu: 'Омовение',
    selectPrayer: 'Выберите намаз', selectSub: 'Полная последовательность по числу ракаатов', rakatN: n => `${n} ракаата`,
    step: 'Шаг', rakat: 'Ракаат', prev: 'Назад', next: 'Далее', back: 'Намазы',
    whatDo: 'Что делать', whatSay: 'Что произносить', transition: 'При переходе', meaning: 'Смысл', times: n => `${n} раза`,
    sources: 'Источники', basis: 'Основная ссылка', note: 'Примечание', askImam: 'Спросите своего имама',
    listen: 'Слушать', stop: 'Стоп', audioErr: 'Звук не загрузился',
    figure: 'Фигура', male: 'Мужчина', female: 'Женщина',
    complete: 'Намаз завершён', completeSub: 'Да примет его Аллах.', restart: 'Заново', choose: 'Другой намаз',
    paper: 'Намаз-подсказка', paperCta: 'Режим «Намаз-подсказка»', paperCtaSub: 'Положите телефон перед собой: на каждом шаге крупно показано, что произносить.',
    paperNote: 'Этот режим — помощник на время обучения. О допустимости чтения с телефона во время намаза спросите своего имама.',
    start: 'Начать', exit: 'Выйти', pause: 'Пауза', resume: 'Продолжить', advance: 'Переход', tap: 'Касанием', auto: 'Автоматически', seconds: 'с',
    tapHint: 'Коснитесь экрана в любом месте, чтобы перейти дальше', nextUp: 'Далее', last: 'Последний шаг',
    wakeOn: 'Экран не погаснет', wakeOff: 'Этот браузер не может удерживать экран включённым — увеличьте время отключения экрана в настройках.',
    wuduTitle: 'Омовение', wuduSub: 'Омовение Пророка ﷺ — шаг за шагом', wuduDone: 'Омовение завершено', wuduAfter: 'После омовения',
    credits: 'Источники звука и лицензии',
    noAudio: 'Записи этого зикра под открытой лицензией не найдено',
  },
  ar: {
    title: 'كيف تصلي', lead: 'كل حركة خطوة بخطوة مع رسم توضيحي، وما يُقال بالعربية مع معناه ودليله. للمسلمين الجدد والأطفال.',
    modes: 'نوع الدليل', mPrayer: 'الصلاة', mWudu: 'الوضوء',
    selectPrayer: 'اختر الصلاة', selectSub: 'الترتيب الكامل بحسب عدد الركعات', rakatN: n => (n === 2 ? 'ركعتان' : `${n} ركعات`),
    step: 'الخطوة', rakat: 'الركعة', prev: 'السابق', next: 'التالي', back: 'الصلوات',
    whatDo: 'ماذا تفعل', whatSay: 'ماذا تقول', transition: 'عند الانتقال', meaning: 'المعنى', times: n => `${n} مرات`,
    sources: 'المصادر', basis: 'المرجع الأساسي', note: 'تنبيه', askImam: 'اسأل إمامك',
    listen: 'استمع', stop: 'إيقاف', audioErr: 'تعذّر تحميل الصوت',
    figure: 'الرسم', male: 'رجل', female: 'امرأة',
    complete: 'تمت الصلاة', completeSub: 'تقبّل الله منك.', restart: 'من جديد', choose: 'صلاة أخرى',
    paper: 'الملقِّن', paperCta: 'وضع الملقِّن', paperCtaSub: 'ضع الهاتف أمامك: يظهر ما يُقال في كل خطوة بخط كبير.',
    paperNote: 'هذا الوضع مُعين في مرحلة التعلّم، واسأل إمامك عن حكم القراءة من الهاتف في الصلاة.',
    start: 'ابدأ', exit: 'خروج', pause: 'إيقاف مؤقت', resume: 'متابعة', advance: 'الانتقال', tap: 'باللمس', auto: 'تلقائي', seconds: 'ث',
    tapHint: 'المس أي مكان في الشاشة للخطوة التالية', nextUp: 'التالي', last: 'الخطوة الأخيرة',
    wakeOn: 'لن تنطفئ الشاشة', wakeOff: 'هذا المتصفح لا يستطيع إبقاء الشاشة مضاءة — زِد مدة إطفاء الشاشة في الإعدادات.',
    wuduTitle: 'الوضوء', wuduSub: 'وضوء النبي ﷺ خطوة بخطوة', wuduDone: 'تم الوضوء', wuduAfter: 'بعد الوضوء',
    credits: 'مصادر الصوت وتراخيصها',
    noAudio: 'لم يُعثر على تسجيل مفتوح الترخيص لهذا الذكر',
  },
  tr: {
    title: 'Namaz nasıl kılınır', lead: 'Her hareket adım adım, resimli; okunan dualar Arapça, okunuşu ve anlamıyla, kaynaklarıyla. Yeni Müslümanlar ve çocuklar için.',
    modes: 'Rehber türü', mPrayer: 'Namaz', mWudu: 'Abdest',
    selectPrayer: 'Namazı seçin', selectSub: 'Rekat sayısına göre tam sıralama', rakatN: n => `${n} rekat`,
    step: 'Adım', rakat: 'Rekat', prev: 'Önceki', next: 'Sonraki', back: 'Namazlar',
    whatDo: 'Ne yapılır', whatSay: 'Ne söylenir', transition: 'Harekete geçerken', meaning: 'Anlamı', times: n => `${n} kez`,
    sources: 'Kaynaklar', basis: 'Temel kaynak', note: 'Not', askImam: 'İmamınıza danışın',
    listen: 'Dinle', stop: 'Durdur', audioErr: 'Ses yüklenemedi',
    figure: 'Çizim', male: 'Erkek', female: 'Kadın',
    complete: 'Namaz tamamlandı', completeSub: 'Allah kabul etsin.', restart: 'Yeniden', choose: 'Başka namaz',
    paper: 'Namaz yardımcısı', paperCta: 'Namaz yardımcısı modu', paperCtaSub: 'Telefonu önünüze koyun: her adımda söylenecek söz büyük harflerle görünür.',
    paperNote: 'Bu mod öğrenme dönemi için bir yardımcıdır. Namazda telefondan okumanın hükmünü imamınıza danışın.',
    start: 'Başla', exit: 'Çık', pause: 'Duraklat', resume: 'Devam', advance: 'Geçiş', tap: 'Dokunarak', auto: 'Otomatik', seconds: 'sn',
    tapHint: 'Sonraki adım için ekranın herhangi bir yerine dokunun', nextUp: 'Sonra', last: 'Son adım',
    wakeOn: 'Ekran kapanmayacak', wakeOff: 'Bu tarayıcı ekranı açık tutamıyor — telefonun ekran zaman aşımını artırın.',
    wuduTitle: 'Abdest', wuduSub: "Peygamber'in ﷺ abdesti — adım adım", wuduDone: 'Abdest tamamlandı', wuduAfter: 'Abdestten sonra',
    credits: 'Ses kaynakları ve lisanslar',
    noAudio: 'Bu zikrin açık lisanslı ses kaydı bulunamadı',
  },
}
