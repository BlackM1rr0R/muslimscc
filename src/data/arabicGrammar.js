// ═══════════════════════════════════════════════════════
// Ərəb kursu — qrammatika dərsləri (5 dil): əvəzliklər, işarə əvəzlikləri,
// ismi cümlə, feli cümlə. Kim oxuyur: src/pages/ArabicCoursePage.jsx.
//
// Qaydalar
// • Quran nümunələri ({ ref, w }) skriptlə Quran.com API-dən (verses/by_key,
//   words=true, text_uthmani) söz-söz götürülüb, vəqf işarələri atılıb — əl ilə
//   DƏYİŞMƏ. parts — cümlənin hissələri (role: m — mübtəda, k — xəbər,
//   v — fel, f — fail, o — məful, x — digər söz).
// • Cədvəldəki əvəzlik/işarə sözləri (ar) dərslik formasıdır (Quran yazılışı
//   deyil) — Quran yazılışı nümunədə göstərilir.
// • Mənalar qısa izahdır, tam tərcümə deyil.
// ═══════════════════════════════════════════════════════

const m5 = (az, en, ru, ar, tr) => ({ az, en, ru, ar, tr })

// ── Ayrı (müstəqil) şəxs əvəzlikləri ──
export const PRONOUNS_DETACHED = [
  { id: 'ana', ar: 'أَنَا', tl: 'anā', m: m5('mən', 'I', 'я', 'المتكلم المفرد', 'ben'),
    ex: { ref: '20:12', w: 'إِنِّىٓ أَنَا۠ رَبُّكَ', hl: 'أَنَا۠', t: m5('Həqiqətən, Mən sənin Rəbbinəm', 'Indeed, I am your Lord', 'Воистину, Я — твой Господь', 'خطاب الله لموسى', 'Şüphesiz Ben senin Rabbinim') } },
  { id: 'nahnu', ar: 'نَحْنُ', tl: 'naḥnu', m: m5('biz', 'we', 'мы', 'المتكلم مع غيره أو المعظّم نفسه', 'biz'),
    ex: { ref: '15:9', w: 'إِنَّا نَحْنُ نَزَّلْنَا ٱلذِّكْرَ', hl: 'نَحْنُ', t: m5('Həqiqətən, Zikri Biz nazil etdik', 'Indeed, We sent down the Reminder', 'Воистину, Мы ниспослали Напоминание', 'الله يخبر عن نفسه بصيغة التعظيم', 'Şüphesiz Zikri Biz indirdik') } },
  { id: 'anta', ar: 'أَنْتَ', tl: 'anta', m: m5('sən (kişi)', 'you (masc. sing.)', 'ты (м. р.)', 'المخاطب المفرد المذكر', 'sen (eril)'),
    ex: { ref: '2:32', w: 'إِنَّكَ أَنتَ ٱلْعَلِيمُ ٱلْحَكِيمُ', hl: 'أَنتَ', t: m5('Həqiqətən, Sən hər şeyi biləsən, hikmət sahibisən', 'Indeed, You are the All-Knowing, the All-Wise', 'Воистину, Ты — Знающий, Мудрый', 'قول الملائكة لربهم', 'Şüphesiz Sen her şeyi bilensin, hikmet sahibisin') } },
  { id: 'anti', ar: 'أَنْتِ', tl: 'anti', m: m5('sən (qadın)', 'you (fem. sing.)', 'ты (ж. р.)', 'المخاطبة المفردة المؤنثة', 'sen (dişil)'), ex: null },
  { id: 'antum', ar: 'أَنْتُمْ', tl: 'antum', m: m5('siz (kişilər)', 'you (masc. pl.)', 'вы (м. р.)', 'المخاطبون الجمع المذكر', 'siz (eril)'),
    ex: { ref: '47:38', w: 'وَأَنتُمُ ٱلْفُقَرَآءُ', hl: 'وَأَنتُمُ', t: m5('siz isə möhtacsınız', 'and you are the needy', 'а вы — бедные (нуждающиеся)', 'خطاب للناس بفقرهم إلى الله', 'siz ise muhtaçsınız') } },
  { id: 'huwa', ar: 'هُوَ', tl: 'huwa', m: m5('o (kişi)', 'he', 'он', 'الغائب المفرد المذكر', 'o (eril)'),
    ex: { ref: '112:1', w: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', hl: 'هُوَ', t: m5('De: «O, Allah birdir»', 'Say: “He is Allah, the One”', 'Скажи: «Он — Аллах Единый»', 'أمر بإعلان التوحيد', 'De ki: “O, Allah’tır, tektir”') } },
  { id: 'hiya', ar: 'هِيَ', tl: 'hiya', m: m5('o (qadın; cins qadın olan şey)', 'she; it (feminine)', 'она', 'الغائبة المفردة المؤنثة', 'o (dişil)'),
    ex: { ref: '20:18', w: 'قَالَ هِىَ عَصَاىَ', hl: 'هِىَ', t: m5('Dedi: «Bu mənim əsamdır»', 'He said: “It is my staff”', 'Он сказал: «Это мой посох»', 'جواب موسى عن عصاه', 'Dedi ki: “O benim asamdır”') } },
  { id: 'hum', ar: 'هُمْ', tl: 'hum', m: m5('onlar (kişilər)', 'they (masc.)', 'они (м. р.)', 'الغائبون الجمع المذكر', 'onlar (eril)'),
    ex: { ref: '2:5', w: 'وَأُو۟لَـٰٓئِكَ هُمُ ٱلْمُفْلِحُونَ', hl: 'هُمُ', t: m5('və məhz onlar nicat tapanlardır', 'and it is they who are the successful', 'и именно они — преуспевшие', 'وصف المتقين', 've işte onlar kurtuluşa erenlerdir') } },
  { id: 'hunna', ar: 'هُنَّ', tl: 'hunna', m: m5('onlar (qadınlar)', 'they (fem.)', 'они (ж. р.)', 'الغائبات الجمع المؤنث', 'onlar (dişil)'),
    ex: { ref: '2:187', w: 'هُنَّ لِبَاسٌۭ لَّكُمْ', hl: 'هُنَّ', t: m5('Onlar sizin üçün libasdır', 'They are a garment for you', 'Они — одеяние для вас', 'وصف الزوجات', 'Onlar sizin için bir elbisedir') } },
]

// ── Bitişik əvəzliklər (isimdə — yiyəlik, feldə — tamamlıq, ön qoşmada — "-a, -da") ──
export const PRONOUNS_ATTACHED = [
  { id: 'i', ar: 'ـِي', tl: '-ī', m: m5('mənim; məni', 'my; me', 'мой; меня', 'ياء المتكلم', 'benim; beni'),
    ex: { ref: '20:25', w: 'رَبِّ ٱشْرَحْ لِى صَدْرِى', hl: 'صَدْرِى', t: m5('Rəbbim, sinəmi genişlət', 'My Lord, expand for me my chest', 'Господи, раскрой мне мою грудь', 'دعاء موسى', 'Rabbim, göğsümü genişlet') } },
  { id: 'na', ar: 'ـنَا', tl: '-nā', m: m5('bizim; bizi', 'our; us', 'наш; нас', 'نا المتكلمين', 'bizim; bizi'),
    ex: { ref: '1:6', w: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', hl: 'ٱهْدِنَا', t: m5('Bizi doğru yola yönəlt', 'Guide us to the straight path', 'Веди нас прямым путём', 'دعاء الهداية', 'Bizi doğru yola ilet') } },
  { id: 'ka', ar: 'ـكَ', tl: '-ka', m: m5('sənin; səni (kişi)', 'your; you (masc.)', 'твой; тебя (м. р.)', 'كاف الخطاب للمذكر', 'senin; seni (eril)'),
    ex: { ref: '94:1', w: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ', hl: 'صَدْرَكَ', t: m5('Sənin sinəni genişlətmədikmi?', 'Did We not expand for you your chest?', 'Разве Мы не раскрыли тебе твою грудь?', 'امتنان على النبي ﷺ', 'Senin göğsünü açıp genişletmedik mi?') } },
  { id: 'kum', ar: 'ـكُمْ', tl: '-kum', m: m5('sizin; sizi', 'your; you (pl.)', 'ваш; вас', 'ضمير المخاطبين', 'sizin; sizi'),
    ex: { ref: '2:21', w: 'يَـٰٓأَيُّهَا ٱلنَّاسُ ٱعْبُدُوا۟ رَبَّكُمُ', hl: 'رَبَّكُمُ', t: m5('Ey insanlar, Rəbbinizə ibadət edin', 'O people, worship your Lord', 'О люди, поклоняйтесь вашему Господу', 'أول أمر في المصحف', 'Ey insanlar, Rabbinize ibadet edin') } },
  { id: 'hu', ar: 'ـهُ', tl: '-hu', m: m5('onun; onu (kişi)', 'his; him', 'его', 'هاء الغائب', 'onun; onu (eril)'),
    ex: { ref: '112:4', w: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ', hl: 'لَّهُۥ', t: m5('Və heç kəs Ona tay deyil', 'And there is none comparable to Him', 'И нет никого, равного Ему', 'نفي الكفء عن الله', 'Ve hiçbir şey O’na denk değildir') } },
  { id: 'ha', ar: 'ـهَا', tl: '-hā', m: m5('onun; onu (qadın)', 'her; it (fem.)', 'её', 'هاء الغائبة', 'onun; onu (dişil)'),
    ex: { ref: '91:9', w: 'قَدْ أَفْلَحَ مَن زَكَّىٰهَا', hl: 'زَكَّىٰهَا', t: m5('Onu (nəfsini) təmizləyən nicat tapdı', 'Successful is the one who purifies it (the soul)', 'Преуспел тот, кто очистил её (душу)', 'فلاح من زكّى نفسه', 'Onu (nefsini) arındıran kurtuluşa ermiştir') } },
  { id: 'hum2', ar: 'ـهُمْ', tl: '-hum', m: m5('onların; onları', 'their; them', 'их', 'ضمير الغائبين', 'onların; onları'),
    ex: { ref: '1:7', w: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ', hl: 'عَلَيْهِمْ', t: m5('nemət verdiyin kəslərin yoluna', 'the path of those You have blessed', 'путём тех, кого Ты облагодетельствовал', 'صراط المنعم عليهم', 'nimet verdiklerinin yoluna') } },
]

// ── İşarə əvəzlikləri ──
export const DEMONSTRATIVES = [
  { id: 'hadha', ar: 'هَٰذَا', tl: 'hādhā', near: true, m: m5('bu (kişi cinsi)', 'this (masc.)', 'этот', 'للمفرد المذكر القريب', 'bu (eril)'),
    ex: { ref: '2:25', w: 'قَالُوا۟ هَـٰذَا ٱلَّذِى رُزِقْنَا', hl: 'هَـٰذَا', t: m5('Dedilər: «Bu, əvvəl bizə verilən ruzidir»', 'They said: “This is what we were provided before”', 'Они скажут: «Это то, что было даровано нам прежде»', 'قول أهل الجنة', 'Dediler ki: “Bu, daha önce rızıklandığımız şeydir”') } },
  { id: 'hadhihi', ar: 'هَٰذِهِ', tl: 'hādhihi', near: true, m: m5('bu (qadın cinsi)', 'this (fem.)', 'эта', 'للمفردة المؤنثة القريبة', 'bu (dişil)'),
    ex: { ref: '2:35', w: 'وَلَا تَقْرَبَا هَـٰذِهِ ٱلشَّجَرَةَ', hl: 'هَـٰذِهِ', t: m5('və bu ağaca yaxınlaşmayın', 'and do not approach this tree', 'и не приближайтесь к этому дереву', 'نهي آدم وزوجه', 've şu ağaca yaklaşmayın') } },
  { id: 'dhalika', ar: 'ذَٰلِكَ', tl: 'dhālika', near: false, m: m5('o (kişi cinsi, uzaq)', 'that (masc.)', 'тот', 'للمفرد المذكر البعيد', 'şu, o (eril, uzak)'),
    ex: { ref: '2:2', w: 'ذَٰلِكَ ٱلْكِتَـٰبُ', hl: 'ذَٰلِكَ', t: m5('O Kitab…', 'That Book…', 'Это Писание…', 'الإشارة بالبعيد لعلوّ منزلة القرآن', 'O Kitap…') } },
  { id: 'tilka', ar: 'تِلْكَ', tl: 'tilka', near: false, m: m5('o (qadın cinsi, uzaq)', 'that (fem.)', 'та', 'للمفردة المؤنثة البعيدة', 'şu, o (dişil, uzak)'),
    ex: { ref: '2:252', w: 'تِلْكَ ءَايَـٰتُ ٱللَّهِ', hl: 'تِلْكَ', t: m5('Bunlar Allahın ayələridir', 'These are the verses of Allah', 'Таковы аяты Аллаха', 'الإشارة إلى آيات الله', 'Bunlar Allah’ın ayetleridir') } },
  { id: 'haulai', ar: 'هَٰؤُلَاءِ', tl: 'hāʾulāʾi', near: true, m: m5('bunlar', 'these', 'эти', 'للجمع القريب', 'bunlar'),
    ex: { ref: '2:31', w: 'بِأَسْمَآءِ هَـٰٓؤُلَآءِ', hl: 'هَـٰٓؤُلَآءِ', t: m5('bunların adlarını', 'the names of these', 'имена этих', 'سؤال الملائكة', 'bunların isimlerini') } },
  { id: 'ulaika', ar: 'أُولَٰئِكَ', tl: 'ulāʾika', near: false, m: m5('onlar (uzaq)', 'those', 'те', 'للجمع البعيد', 'onlar (uzak)'),
    ex: { ref: '2:5', w: 'أُو۟لَـٰٓئِكَ عَلَىٰ هُدًۭى مِّن رَّبِّهِمْ', hl: 'أُو۟لَـٰٓئِكَ', t: m5('Onlar Rəbbindən olan hidayət üzərindədirlər', 'Those are upon guidance from their Lord', 'Они следуют верному руководству от их Господа', 'وصف المتقين', 'İşte onlar Rablerinden bir hidayet üzeredirler') } },
]

// ── İsmi cümlə: mübtəda (m) + xəbər (k) ──
export const NOMINAL_EXAMPLES = [
  { ref: '1:2', parts: [['ٱلْحَمْدُ', 'm'], ['لِلَّهِ', 'k']], t: m5('Həmd Allaha məxsusdur', 'All praise is for Allah', 'Хвала — Аллаху', 'الحمد كله لله', 'Hamd Allah’a mahsustur') },
  { ref: '112:2', parts: [['ٱللَّهُ', 'm'], ['ٱلصَّمَدُ', 'k']], t: m5('Allah Saməddir (hər kəsin möhtac olduğu)', 'Allah is as-Samad (the One all depend on)', 'Аллах — Самодостаточный (в Ком все нуждаются)', 'الله هو السيد الذي يُصمد إليه في الحوائج', 'Allah Samed’dir (herkesin muhtaç olduğu)') },
  { ref: '48:29', parts: [['مُّحَمَّدٌۭ', 'm'], ['رَّسُولُ ٱللَّهِ', 'k']], t: m5('Muhəmməd Allahın Rəsuludur', 'Muhammad is the Messenger of Allah', 'Мухаммад — Посланник Аллаха', 'إثبات رسالة محمد ﷺ', 'Muhammed Allah’ın Resulüdür') },
  { ref: '49:10', parts: [['إِنَّمَا', 'x'], ['ٱلْمُؤْمِنُونَ', 'm'], ['إِخْوَةٌۭ', 'k']], t: m5('Möminlər ancaq qardaşdırlar', 'The believers are but brothers', 'Верующие — братья', 'أخوّة الإيمان', 'Müminler ancak kardeştirler') },
  { ref: '2:187', parts: [['هُنَّ', 'm'], ['لِبَاسٌۭ لَّكُمْ', 'k']], t: m5('Onlar sizin üçün libasdır', 'They are a garment for you', 'Они — одеяние для вас', 'وصف الزوجات', 'Onlar sizin için bir elbisedir') },
]

// ── Feli cümlə: fel (v) + fail (f) + məful (o) ──
export const VERBAL_EXAMPLES = [
  { ref: '29:44', parts: [['خَلَقَ', 'v'], ['ٱللَّهُ', 'f'], ['ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضَ', 'o']], t: m5('Allah göyləri və yeri yaratdı', 'Allah created the heavens and the earth', 'Аллах сотворил небеса и землю', 'خلق الله السماوات والأرض', 'Allah gökleri ve yeri yarattı') },
  { ref: '4:164', parts: [['وَكَلَّمَ', 'v'], ['ٱللَّهُ', 'f'], ['مُوسَىٰ', 'o']], t: m5('Və Allah Musa ilə danışdı', 'And Allah spoke to Musa', 'И Аллах говорил с Мусой', 'إثبات صفة الكلام', 'Ve Allah Musa ile konuştu') },
  { ref: '20:121', parts: [['وَعَصَىٰٓ', 'v'], ['ءَادَمُ', 'f'], ['رَبَّهُۥ', 'o']], t: m5('Və Adəm Rəbbinə asi oldu', 'And Adam disobeyed his Lord', 'И Адам ослушался своего Господа', 'معصية آدم ثم توبته', 'Ve Âdem Rabbine karşı geldi') },
  { ref: '110:1', parts: [['إِذَا', 'x'], ['جَآءَ', 'v'], ['نَصْرُ ٱللَّهِ', 'f']], t: m5('Allahın köməyi gəldikdə', 'When the help of Allah comes', 'Когда придёт помощь Аллаха', 'البشارة بالنصر', 'Allah’ın yardımı geldiğinde') },
  { ref: '55:2', parts: [['عَلَّمَ', 'v'], ['ٱلْقُرْءَانَ', 'o']], t: m5('(Rəhman) Quranı öyrətdi — fail feldə gizlidir: «O»', '(The Most Merciful) taught the Quran — the doer is hidden in the verb: “He”', '(Милостивый) научил Корану — подлежащее скрыто в глаголе: «Он»', 'الفاعل ضمير مستتر تقديره هو يعود على الرحمن', '(Rahman) Kur’an’ı öğretti — fail fiilde gizlidir: “O”') },
]

// ── Fel zamanları: Qurandan bir nümunə ──
export const VERB_FORMS = [
  { id: 'madi', name: m5('Keçmiş zaman (madi)', 'Past (māḍī)', 'Прошедшее (мади)', 'الماضي', 'Geçmiş zaman (mâzî)'),
    ex: { ref: '29:44', w: 'خَلَقَ', tl: 'khalaqa', t: m5('yaratdı', 'He created', 'сотворил', 'فعل ماضٍ', 'yarattı') } },
  { id: 'mudari', name: m5('İndiki-gələcək zaman (mudari)', 'Present (muḍāriʿ)', 'Настоящее-будущее (мудари)', 'المضارع', 'Şimdiki-geniş zaman (muzâri)'),
    ex: { ref: '1:5', w: 'نَعْبُدُ', tl: 'naʿbudu', t: m5('ibadət edirik', 'we worship', 'мы поклоняемся', 'فعل مضارع', 'ibadet ederiz') } },
  { id: 'amr', name: m5('Əmr forması', 'Imperative (amr)', 'Повелительное наклонение', 'الأمر', 'Emir kipi'),
    ex: { ref: '112:1', w: 'قُلْ', tl: 'qul', t: m5('de!', 'say!', 'скажи!', 'فعل أمر', 'de!') } },
]

// ── Dərslərin izah mətnləri ──
export const GRAMMAR_TEXT = {
  pronouns: {
    intro: m5(
      'Əvəzlik ismin yerinə işlənir. Ərəb dilində iki növ şəxs əvəzliyi var: ayrı yazılanlar (أَنَا — mən) və sözə bitişənlər (رَبِّي — Rəbbim). Kişi və qadın cinsi, tək, cüt və cəm ayrıca formalar alır.',
      'A pronoun stands in place of a noun. Arabic has two kinds of personal pronouns: separate ones (أَنَا — I) and ones attached to a word (رَبِّي — my Lord). Masculine and feminine, singular, dual and plural each have their own forms.',
      'Местоимение заменяет имя. В арабском языке два вида личных местоимений: отдельные (أَنَا — я) и слитные, присоединяемые к слову (رَبِّي — мой Господь). Мужской и женский род, единственное, двойственное и множественное число имеют свои формы.',
      'الضمير ما يُكنى به عن الاسم، وهو قسمان: منفصل يُكتب مستقلًّا كـ«أنا»، ومتصل يتصل بآخر الكلمة كياء «ربّي». وللمذكر والمؤنث والمفرد والمثنى والجمع صيغ خاصة.',
      'Zamir ismin yerine kullanılır. Arapçada iki tür şahıs zamiri vardır: ayrı yazılanlar (أَنَا — ben) ve kelimeye bitişenler (رَبِّي — Rabbim). Eril ve dişil, tekil, ikil ve çoğul için ayrı biçimler vardır.'),
    detached: m5('Ayrı əvəzliklər', 'Separate pronouns', 'Отдельные местоимения', 'الضمائر المنفصلة', 'Ayrı zamirler'),
    attached: m5('Bitişik əvəzliklər', 'Attached pronouns', 'Слитные местоимения', 'الضمائر المتصلة', 'Bitişik zamirler'),
    attachedNote: m5(
      'İsmə bitişəndə yiyəlik bildirir (رَبُّكَ — sənin Rəbbin), felə bitişəndə tamamlıq (ٱهْدِنَا — bizi yönəlt), ön qoşmaya bitişəndə isə yön və yer (لَهُ — onun üçün, عَلَيْهِمْ — onların üzərinə).',
      'Attached to a noun it shows possession (رَبُّكَ — your Lord), to a verb it is the object (ٱهْدِنَا — guide us), and to a preposition it shows direction or place (لَهُ — for him, عَلَيْهِمْ — upon them).',
      'Присоединённое к имени оно выражает принадлежность (رَبُّكَ — твой Господь), к глаголу — дополнение (ٱهْدِنَا — веди нас), к предлогу — направление или место (لَهُ — ему, عَلَيْهِمْ — на них).',
      'إذا اتصل بالاسم دلّ على الملكية (ربُّكَ)، وإذا اتصل بالفعل كان مفعولًا به (اهدِنا)، وإذا اتصل بحرف الجر كان مجرورًا به (لَهُ، عليهم).',
      'İsme bitişince iyelik bildirir (رَبُّكَ — senin Rabbin), fiile bitişince nesne olur (ٱهْدِنَا — bizi ilet), edata bitişince yön ve yer bildirir (لَهُ — onun için, عَلَيْهِمْ — onların üzerine).'),
    dualNote: m5(
      'Cüt üçün: أَنْتُمَا (siz ikiniz), هُمَا (onlar ikisi). Allah Özündən çox vaxt «Biz» (نَحْنُ) deyə xəbər verir — bu, əzəmət bildirir, çoxluq yox.',
      'For the dual: أَنْتُمَا (you two), هُمَا (they two). Allah often speaks of Himself as “We” (نَحْنُ) — this expresses majesty, not plurality.',
      'Для двойственного числа: أَنْتُمَا (вы двое), هُمَا (они двое). Аллах часто говорит о Себе «Мы» (نَحْنُ) — это выражает величие, а не множественность.',
      'وللمثنى: أنتما، هما. ويخبر الله عن نفسه كثيرًا بـ«نحن» للتعظيم لا للتعدد.',
      'İkil için: أَنْتُمَا (siz ikiniz), هُمَا (onlar ikisi). Allah Kendisinden çoğu zaman “Biz” (نَحْنُ) diye bahseder — bu, azamet bildirir, çokluk değil.'),
  },
  demonstratives: {
    intro: m5(
      'İşarə əvəzlikləri bir şeyi göstərmək üçündür: yaxın üçün هَٰذَا (bu), uzaq üçün ذَٰلِكَ (o). Onlar işarə edilən şeyin cinsinə və sayına uyğunlaşır.',
      'Demonstratives point to something: هَٰذَا (this) for what is near and ذَٰلِكَ (that) for what is far. They agree with the gender and number of what they point to.',
      'Указательные местоимения указывают на что-либо: هَٰذَا (этот) — на близкое, ذَٰلِكَ (тот) — на далёкое. Они согласуются в роде и числе с тем, на что указывают.',
      'أسماء الإشارة يُشار بها إلى معيَّن: «هذا» للقريب و«ذلك» للبعيد، وتطابق المشار إليه في التذكير والتأنيث والعدد.',
      'İşaret zamirleri bir şeyi göstermek içindir: yakın için هَٰذَا (bu), uzak için ذَٰلِكَ (şu, o). İşaret edilen şeyin cinsiyetine ve sayısına uyarlar.'),
    near: m5('Yaxın', 'Near', 'Близкое', 'للقريب', 'Yakın'),
    far: m5('Uzaq', 'Far', 'Далёкое', 'للبعيد', 'Uzak'),
    ruleTitle: m5('«Bu kitab» və «Bu, kitabdır»', '“This book” and “This is a book”', '«Эта книга» и «Это — книга»', '«هذا الكتابُ» و«هذا كتابٌ»', '“Bu kitap” ve “Bu bir kitaptır”'),
    rule: m5(
      'İşarədən sonra gələn isim «əl» artiklidirsə, birləşmə alınır: هَٰذَا ٱلْكِتَابُ — «bu kitab». Artiklsizdirsə (tənvinlə), tam cümlə alınır: هَٰذَا كِتَابٌ — «bu, kitabdır». Qurandakı ذَٰلِكَ ٱلْكِتَٰبُ (Bəqərə 2:2) — «o Kitab» deməkdir; uzaq işarə Quranın uca məqamını bildirir.',
      'If the noun after the demonstrative has the article al-, you get a phrase: هَٰذَا ٱلْكِتَابُ — “this book”. Without the article (with tanwin) you get a full sentence: هَٰذَا كِتَابٌ — “this is a book”. In the Quran ذَٰلِكَ ٱلْكِتَٰبُ (Al-Baqarah 2:2) means “that Book”; the far demonstrative conveys the Quran’s lofty rank.',
      'Если имя после указательного местоимения с артиклем аль-, получается словосочетание: هَٰذَا ٱلْكِتَابُ — «эта книга». Без артикля (с танвином) — полное предложение: هَٰذَا كِتَابٌ — «это — книга». В Коране ذَٰلِكَ ٱلْكِتَٰبُ (аль-Бакара 2:2) — «то Писание»; указание на далёкое выражает высокое положение Корана.',
      'إذا جاء بعد اسم الإشارة اسمٌ معرَّف بـ«ال» كان بدلًا أو نعتًا: «هذا الكتابُ»، وإذا جاء نكرةً كان خبرًا فتتم الجملة: «هذا كتابٌ». وفي قوله تعالى: ﴿ذَٰلِكَ ٱلْكِتَـٰبُ﴾ إشارة بالبعيد لعلوّ منزلته.',
      'İşaretten sonra gelen isim “el” takılıysa bir tamlama oluşur: هَٰذَا ٱلْكِتَابُ — “bu kitap”. Takısızsa (tenvinli) tam bir cümle olur: هَٰذَا كِتَابٌ — “bu bir kitaptır”. Kur’an’daki ذَٰلِكَ ٱلْكِتَٰبُ (Bakara 2:2) “o Kitap” demektir; uzak işaret Kur’an’ın yüce makamını bildirir.'),
  },
  nominal: {
    intro: m5(
      'İsmi cümlə isimlə başlayır və iki hissədən ibarətdir: mübtəda (haqqında danışılan, adətən «əl» artikli ilə müəyyən) və xəbər (onun haqqında deyilən, çox vaxt artiklsiz). Hər ikisi adətən raf halındadır (sonu -u/-un). Ərəb dilində indiki zamanda «olmaq» feli işlənmir: ٱللَّهُ ٱلصَّمَدُ — «Allah Saməddir».',
      'A nominal sentence begins with a noun and has two parts: the subject (mubtadaʾ — what is talked about, usually definite with al-) and the predicate (khabar — what is said about it, often indefinite). Both are normally in the nominative (ending -u/-un). Arabic uses no verb “to be” in the present: ٱللَّهُ ٱلصَّمَدُ — “Allah is as-Samad”.',
      'Именное предложение начинается с имени и состоит из двух частей: подлежащего (мубтада — о чём говорится, обычно определённое, с аль-) и сказуемого (хабар — что о нём сообщается, часто неопределённое). Обычно оба в именительном падеже (окончание -у/-ун). В настоящем времени глагол «быть» не используется: ٱللَّهُ ٱلصَّمَدُ — «Аллах — Самодостаточный».',
      'الجملة الاسمية ما بدأت باسم، وركناها المبتدأ (المحدَّث عنه، ويكون غالبًا معرفة) والخبر (المحدَّث به، ويكون غالبًا نكرة)، وحكمهما الرفع. مثل: ﴿ٱللَّهُ ٱلصَّمَدُ﴾.',
      'İsim cümlesi isimle başlar ve iki öğeden oluşur: mübteda (hakkında konuşulan, çoğunlukla “el” takılı ve belirli) ve haber (onun hakkında söylenen, çoğunlukla belirsiz). İkisi de genellikle merfûdur (sonu -u/-un). Şimdiki zamanda “olmak” fiili kullanılmaz: ٱللَّهُ ٱلصَّمَدُ — “Allah Samed’dir”.'),
    khabarTypes: m5(
      'Xəbər tək söz (ٱلصَّمَدُ), birləşmə (رَسُولُ ٱللَّهِ) və ya ön qoşmalı ifadə (لِلَّهِ — Allaha məxsusdur) ola bilər. إِنَّمَا kimi ədatlar cümləyə məna qatır, amma onun hissəsi deyil.',
      'The predicate can be a single word (ٱلصَّمَدُ), a construct phrase (رَسُولُ ٱللَّهِ) or a prepositional phrase (لِلَّهِ — belongs to Allah). Particles like إِنَّمَا add meaning but are not one of the two parts.',
      'Сказуемое может быть одним словом (ٱلصَّمَدُ), сочетанием (رَسُولُ ٱللَّهِ) или предложным оборотом (لِلَّهِ — принадлежит Аллаху). Частицы вроде إِنَّمَا добавляют смысл, но не являются частью предложения.',
      'ويكون الخبر مفردًا (ٱلصَّمَدُ)، أو مضافًا (رَسُولُ ٱللَّهِ)، أو شبه جملة (لِلَّهِ). وأدوات مثل «إنما» تضيف معنى الحصر وليست من ركني الجملة.',
      'Haber tek kelime (ٱلصَّمَدُ), tamlama (رَسُولُ ٱللَّهِ) ya da edatlı ifade (لِلَّهِ — Allah’a aittir) olabilir. إِنَّمَا gibi edatlar anlam katar ama cümlenin iki öğesinden değildir.'),
  },
  verbal: {
    intro: m5(
      'Feli cümlə fellə başlayır: fel (iş) + fail (işi görən, raf halında) + lazım gələrsə məful (işin üzərinə düşdüyü, nəsb halında, sonu -a/-an). Ərəb dilində adi sıra «fel — fail — məful»dur: خَلَقَ ٱللَّهُ ٱلسَّمَـٰوَٰتِ — «Allah göyləri yaratdı».',
      'A verbal sentence begins with a verb: verb + doer (fāʿil, nominative) + if needed the object (mafʿūl, accusative, ending -a/-an). The usual Arabic order is verb — doer — object: خَلَقَ ٱللَّهُ ٱلسَّمَـٰوَٰتِ — “Allah created the heavens”.',
      'Глагольное предложение начинается с глагола: глагол + деятель (фа‘иль, в именительном падеже) + при необходимости объект (маф‘уль, в винительном падеже, окончание -а/-ан). Обычный порядок: глагол — деятель — объект: خَلَقَ ٱللَّهُ ٱلسَّمَـٰوَٰتِ — «Аллах сотворил небеса».',
      'الجملة الفعلية ما بدأت بفعل، وركناها الفعل والفاعل (مرفوع)، وقد يكون لها مفعول به (منصوب). والترتيب الأصلي: فعل ثم فاعل ثم مفعول: ﴿خَلَقَ ٱللَّهُ ٱلسَّمَـٰوَٰتِ﴾.',
      'Fiil cümlesi fiille başlar: fiil + fail (işi yapan, merfû) + gerekirse meful (işten etkilenen, mansûb, sonu -a/-an). Arapçadaki olağan sıra “fiil — fail — meful”dür: خَلَقَ ٱللَّهُ ٱلسَّمَـٰوَٰتِ — “Allah gökleri yarattı”.'),
    hidden: m5(
      'Fail bəzən ayrıca söz kimi görünmür — feldə gizli olur: عَلَّمَ ٱلْقُرْءَانَ — «(O) Quranı öyrətdi». Fel öz failindən əvvəl gələndə tək formada qalır, fail cəm olsa belə.',
      'Sometimes the doer is not a separate word but hidden in the verb: عَلَّمَ ٱلْقُرْءَانَ — “(He) taught the Quran”. When the verb comes before its doer it stays singular even if the doer is plural.',
      'Иногда деятель не выражен отдельным словом, а скрыт в глаголе: عَلَّمَ ٱلْقُرْءَانَ — «(Он) научил Корану». Если глагол стоит перед деятелем, он остаётся в единственном числе, даже если деятель во множественном.',
      'وقد يكون الفاعل ضميرًا مستترًا: ﴿عَلَّمَ ٱلْقُرْءَانَ﴾ أي: هو. وإذا تقدّم الفعل على فاعله الظاهر لزم الإفراد ولو كان الفاعل جمعًا.',
      'Fail bazen ayrı bir kelime olarak görünmez, fiilde gizlidir: عَلَّمَ ٱلْقُرْءَانَ — “(O) Kur’an’ı öğretti”. Fiil failinden önce gelince, fail çoğul olsa bile tekil kalır.'),
    formsTitle: m5('Felin üç forması', 'Three forms of the verb', 'Три формы глагола', 'أقسام الفعل', 'Fiilin üç biçimi'),
  },
  vocab: {
    intro: m5(
      'Quranın təxminən 77 400 sözündən yarıdan çoxu bu 100 sözün təkrarıdır. Onları öyrənən namazda və tilavətdə ayələrin xeyli hissəsini tanıyacaq. Say — sözün Quranda neçə dəfə işləndiyi, ayə — ilk işləndiyi yerdir.',
      'Of the roughly 77,400 words of the Quran, more than half are repetitions of these 100 words. Whoever learns them will recognise much of what is recited in prayer and recitation. The count is how often the word occurs; the verse is where it first appears.',
      'Из примерно 77 400 слов Корана больше половины — повторения этих 100 слов. Выучивший их узнает значительную часть того, что читается в молитве и при чтении Корана. Число — сколько раз слово встречается, аят — где оно встречается впервые.',
      'أكثر من نصف كلمات القرآن (نحو سبعة وسبعين ألف كلمة) تكرارٌ لهذه الكلمات المائة؛ فمن تعلّمها فهم كثيرًا مما يُتلى في الصلاة. والعدد: مرات ورودها، والآية: أول موضع وردت فيه.',
      'Kur’an’ın yaklaşık 77.400 kelimesinin yarısından fazlası bu 100 kelimenin tekrarıdır. Bunları öğrenen, namazda ve tilavette okunanların büyük kısmını tanır. Sayı kelimenin kaç kez geçtiği, ayet ilk geçtiği yerdir.'),
    cats: { all: m5('Hamısı', 'All', 'Все', 'الكل', 'Tümü'), noun: m5('İsimlər', 'Nouns', 'Имена', 'الأسماء', 'İsimler'), verb: m5('Fellər', 'Verbs', 'Глаголы', 'الأفعال', 'Fiiller'), particle: m5('Ədatlar', 'Particles', 'Частицы', 'الحروف', 'Edatlar') },
    times: m5('dəfə', 'times', 'раз', 'مرة', 'kez'),
    firstIn: m5('ilk dəfə', 'first in', 'впервые', 'أول ورود', 'ilk geçtiği yer'),
    credit: m5(
      'Saylar: Quranic Arabic Corpus morfologiyası (Lids Universiteti), mustafa0x/quran-morphology düzəlişli nüsxəsi — GNU GPL v3. Hər söz lüğət formasına (lemma) görə sayılıb; ön şəkilçilər və bitişik əvəzliklər ayrıca sayılmayıb.',
      'Counts: Quranic Arabic Corpus morphology (University of Leeds), corrected fork mustafa0x/quran-morphology — GNU GPL v3. Each word is counted by its dictionary form (lemma); prefixes and attached pronouns are not counted separately.',
      'Подсчёт: морфология Quranic Arabic Corpus (Университет Лидса), исправленная версия mustafa0x/quran-morphology — GNU GPL v3. Каждое слово учтено по словарной форме (лемме); приставки и слитные местоимения отдельно не считались.',
      'الإحصاء: الصرف في «Quranic Arabic Corpus» (جامعة ليدز)، النسخة المصححة mustafa0x/quran-morphology — GNU GPL v3. حُسبت كل كلمة بأصلها المعجمي، ولم تُحسب السوابق والضمائر المتصلة مستقلة.',
      'Sayılar: Quranic Arabic Corpus morfolojisi (Leeds Üniversitesi), düzeltilmiş mustafa0x/quran-morphology sürümü — GNU GPL v3. Her kelime sözlük biçimine (lemma) göre sayılmıştır; önekler ve bitişik zamirler ayrıca sayılmamıştır.'),
  },
}
