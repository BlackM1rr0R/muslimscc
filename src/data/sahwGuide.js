// ═══════════════════════════════════════════════════════
// Səhv səcdəsi bələdçisi (v6.2) — components/prayer/SahwGuide.jsx (/prayerguide)
//
// QAYDA: yalnız Səhih əl-Buxari və Səhih Müslimdə AÇIQ gələn hallar. Hər nəticənin
// hədisi var; mənbəsi olmayan qayda (məs. "tam qalxmamışdısa geri otur") YAZILMIR.
// Hədis nömrələri — ümumi qəbul olunmuş nömrələmə (Buxari; Müslim — Fuad Əbdülbaqi).
// lib — saytın kitabxanasındakı nömrə (fawazahmed0/hadith-api: Müslimdə ardıcıl nömrələnir).
// Mətnlər 2026-11-11-də hadith-api eng-bukhari / eng-muslim nəşrlərindən yoxlanılıb:
//   Buxari 1224 (İbn Buheynə), 1226 (İbn Məsud — beş rükət), 1229 (Zül-Yədeyn),
//   401 (İbn Məsud — təharri), 1232 (Əbu Hureyrə — şübhə);
//   Müslim 570 (lib 1269), 571 (1272, Əbu Səid — yəqin), 572 (1274 təharri, 1281 beş rükət),
//   573 (1288, Zül-Yədeyn), 574 (1293, İmran ibn Husayn — üç rükətdə salam).
// tests/unit/sahw-guide.test.js — hər nəticənin mənbəsi var, bütün keçidlər qapalıdır.
// ═══════════════════════════════════════════════════════

export const SAHW_REFS = {
  b1224: { book: 'bukhari', n: 1224, lib: 1224 },
  b1226: { book: 'bukhari', n: 1226, lib: 1226 },
  b1229: { book: 'bukhari', n: 1229, lib: 1229 },
  b401: { book: 'bukhari', n: 401, lib: 401 },
  b1232: { book: 'bukhari', n: 1232, lib: 1232 },
  m570: { book: 'muslim', n: 570, lib: 1269 },
  m571: { book: 'muslim', n: 571, lib: 1272 },
  m572a: { book: 'muslim', n: 572, lib: 1274 },
  m572b: { book: 'muslim', n: 572, lib: 1281 },
  m573: { book: 'muslim', n: 573, lib: 1288 },
  m574: { book: 'muslim', n: 574, lib: 1293 },
}

// Düyün: { q: sual, opts: [[cavab, növbəti düyün id-si]] }; nəticə: { res: true, when, steps, refs }
export const SAHW_TREE = {
  start: {
    q: { az: 'Namazda nə oldu?', en: 'What happened in the prayer?', ru: 'Что случилось в намазе?', ar: 'ماذا حدث في الصلاة؟', tr: 'Namazda ne oldu?' },
    opts: [
      [{ az: 'Birinci təşəhhüdü (oturuşu) unudub ayağa qalxdım', en: 'I forgot the first tashahhud (sitting) and stood up', ru: 'Я забыл первый ташаххуд (сидение) и встал', ar: 'نسيت التشهد الأول وقمت', tr: 'İlk teşehhüdü (oturuşu) unutup ayağa kalktım' }, 'tashahhud'],
      [{ az: 'Bir rükət artıq qıldım (məs. 4 əvəzinə 5)', en: 'I prayed an extra rak‘ah (e.g. 5 instead of 4)', ru: 'Я совершил лишний ракаат (например, 5 вместо 4)', ar: 'صليت ركعة زائدة (كخمس بدل أربع)', tr: 'Bir rekât fazla kıldım (ör. 4 yerine 5)' }, 'extra'],
      [{ az: 'Namaz bitmədən salam verdim', en: 'I gave the salam before the prayer was complete', ru: 'Я произнёс салям, не завершив намаз', ar: 'سلّمت قبل تمام الصلاة', tr: 'Namaz bitmeden selam verdim' }, 'early'],
      [{ az: 'Neçə rükət qıldığıma şübhə edirəm', en: 'I am unsure how many rak‘ahs I prayed', ru: 'Я не уверен, сколько ракаатов совершил', ar: 'شككت كم صليت', tr: 'Kaç rekât kıldığımdan şüphe ediyorum' }, 'doubt'],
    ],
  },
  doubt: {
    q: { az: 'Bir tərəfə meyliniz varmı?', en: 'Do you lean towards one number?', ru: 'Вы склоняетесь к какому-то числу?', ar: 'هل يغلب على ظنك عدد؟', tr: 'Bir sayıya meyliniz var mı?' },
    opts: [
      [{ az: 'Xeyr — hansı olduğunu heç bilmirəm', en: 'No — I really do not know which', ru: 'Нет — совсем не знаю', ar: 'لا — لا أدري أيّهما', tr: 'Hayır — hangisi olduğunu hiç bilmiyorum' }, 'doubtNone'],
      [{ az: 'Bəli — birinin doğru olduğunu düşünürəm', en: 'Yes — I think one of them is right', ru: 'Да — думаю, что одно из них верно', ar: 'نعم — أظن أحدهما صوابًا', tr: 'Evet — birinin doğru olduğunu düşünüyorum' }, 'doubtLean'],
    ],
  },
  tashahhud: {
    res: true, when: 'before',
    steps: [
      { az: 'Geri oturmayın — namaza davam edin (Peyğəmbər ﷺ və arxasındakılar ayağa qalxıb davam etdilər).', en: 'Do not sit back down — carry on with the prayer (the Prophet ﷺ and those behind him stood and carried on).', ru: 'Не садитесь обратно — продолжайте намаз (Пророк ﷺ и стоявшие за ним встали и продолжили).', ar: 'لا ترجع للجلوس — أكمل صلاتك (قام النبي ﷺ وقام الناس معه).', tr: 'Geri oturmayın — namaza devam edin (Peygamber ﷺ ve arkasındakiler kalkıp devam ettiler).' },
      { az: 'Son təşəhhüddə, salam verməzdən əvvəl oturaraq təkbir deyib iki səcdə edin.', en: 'In the last tashahhud, before the salam, say takbir while sitting and make two prostrations.', ru: 'В последнем ташаххуде, до саляма, сидя произнесите такбир и совершите два земных поклона.', ar: 'في التشهد الأخير، قبل السلام، كبّر وأنت جالس واسجد سجدتين.', tr: 'Son teşehhütte, selamdan önce oturarak tekbir alıp iki secde yapın.' },
      { az: 'Sonra salam verin.', en: 'Then give the salam.', ru: 'Затем произнесите салям.', ar: 'ثم سلّم.', tr: 'Sonra selam verin.' },
    ],
    refs: ['b1224', 'm570'],
  },
  extra: {
    res: true, when: 'after',
    steps: [
      { az: 'Salamdan sonra bildinizsə (və ya sizə dedilərsə), qibləyə dönüb iki səcdə edin.', en: 'If you realise it (or are told) after the salam, turn to the qiblah and make two prostrations.', ru: 'Если вы поняли это (или вам сказали) после саляма, повернитесь к кибле и совершите два земных поклона.', ar: 'إن علمت بعد السلام (أو أُخبرت)، فاستقبل القبلة واسجد سجدتين.', tr: 'Selamdan sonra fark ettiyseniz (veya size söylendiyse), kıbleye dönüp iki secde yapın.' },
      { az: 'Sonra salam verin.', en: 'Then give the salam.', ru: 'Затем произнесите салям.', ar: 'ثم سلّم.', tr: 'Sonra selam verin.' },
    ],
    refs: ['b1226', 'b401', 'm572b'],
  },
  early: {
    res: true, when: 'after',
    steps: [
      { az: 'Xatırlayanda (hədisdəki kimi, az sonra) qalxıb qılmadığınız rükətləri qılın.', en: 'When you remember (soon after, as in the hadith), stand and pray the rak‘ahs you missed.', ru: 'Вспомнив (вскоре, как в хадисе), встаньте и совершите пропущенные ракааты.', ar: 'إذا تذكّرت (بعد قليل كما في الحديث) فقم وأتمّ ما بقي من الركعات.', tr: 'Hatırlayınca (hadisteki gibi kısa süre sonra) kalkıp kılmadığınız rekâtları kılın.' },
      { az: 'Salam verin.', en: 'Give the salam.', ru: 'Произнесите салям.', ar: 'سلّم.', tr: 'Selam verin.' },
      { az: 'Sonra təkbirlə iki səcdə edin və yenidən salam verin.', en: 'Then make two prostrations with takbir and give the salam again.', ru: 'Затем с такбиром совершите два земных поклона и снова произнесите салям.', ar: 'ثم اسجد سجدتين مع التكبير، ثم سلّم.', tr: 'Sonra tekbirle iki secde yapın ve yeniden selam verin.' },
    ],
    refs: ['b1229', 'm573', 'm574'],
  },
  doubtNone: {
    res: true, when: 'before',
    steps: [
      { az: 'Şübhəni atın və yəqin olanı — az sayı götürün (məs. 3 ilə 4 arasında — 3).', en: 'Set the doubt aside and build on what you are sure of — the lower number (e.g. between 3 and 4, take 3).', ru: 'Отбросьте сомнение и опирайтесь на то, в чём уверены, — на меньшее число (например, между 3 и 4 — 3).', ar: 'اطرح الشك وابنِ على ما استيقنت — وهو الأقل (كثلاث بين الثلاث والأربع).', tr: 'Şüpheyi bırakın ve emin olduğunuza — az olan sayıya göre devam edin (ör. 3 ile 4 arasında 3).' },
      { az: 'Namazı onun üzərində tamamlayın.', en: 'Complete the prayer on that basis.', ru: 'Завершите намаз исходя из этого.', ar: 'أتمّ صلاتك على ذلك.', tr: 'Namazı buna göre tamamlayın.' },
      { az: 'Salam verməzdən əvvəl iki səcdə edin, sonra salam verin.', en: 'Make two prostrations before the salam, then give the salam.', ru: 'До саляма совершите два земных поклона, затем произнесите салям.', ar: 'اسجد سجدتين قبل أن تسلّم، ثم سلّم.', tr: 'Selamdan önce iki secde yapın, sonra selam verin.' },
    ],
    refs: ['m571'],
  },
  doubtLean: {
    res: true, when: 'after',
    steps: [
      { az: 'Doğru hesab etdiyinizi götürün və namazı onun üzərində tamamlayın.', en: 'Go with what you think is correct and complete the prayer on that basis.', ru: 'Исходите из того, что считаете верным, и завершите намаз на этом.', ar: 'تحرَّ الصواب وأتمّ صلاتك عليه.', tr: 'Doğru olduğunu düşündüğünüzü esas alıp namazı ona göre tamamlayın.' },
      { az: 'Salam verin.', en: 'Give the salam.', ru: 'Произнесите салям.', ar: 'سلّم.', tr: 'Selam verin.' },
      { az: 'Sonra iki səcdə edin.', en: 'Then make two prostrations.', ru: 'Затем совершите два земных поклона.', ar: 'ثم اسجد سجدتين.', tr: 'Sonra iki secde yapın.' },
    ],
    refs: ['b401', 'm572a'],
  },
}

// Səcdənin özü — hamısı üçün ortaq
export const SAHW_HOW = {
  text: { az: 'Səhv səcdəsi namazdakı səcdə kimidir: oturaraq təkbir deyib səcdəyə gedin, təkbirlə başınızı qaldırın, yenə təkbirlə ikinci səcdəyə gedin və təkbirlə qalxın.', en: 'The prostration of forgetfulness is like the prostration of the prayer: while sitting, say takbir and prostrate, raise your head with takbir, prostrate again with takbir, and rise with takbir.', ru: 'Земной поклон забывчивости — как обычный земной поклон намаза: сидя произнесите такбир и сделайте поклон, поднимите голову с такбиром, снова с такбиром сделайте второй поклон и поднимитесь с такбиром.', ar: 'سجود السهو كسجود الصلاة: كبّر وأنت جالس واسجد، ثم ارفع رأسك مكبّرًا، ثم كبّر واسجد الثانية، ثم ارفع مكبّرًا.', tr: 'Sehiv secdesi namazdaki secde gibidir: oturarak tekbir alıp secdeye varın, tekbirle başınızı kaldırın, yine tekbirle ikinci secdeye varın ve tekbirle kalkın.' },
  refs: ['b1224', 'b1229', 'm573'],
}
