// ═══════════════════════════════════════════════════════
// Ulduzların ərəb adları və mənası (v6.9, planetari — /qibla)
//
// Bir çox ulduzun beynəlxalq adı ərəbcədən gəlir (orta əsr astronomiya
// kitabları ərəbcədən latıncaya tərcümə olunanda). Etimologiya: P. Kunitzsch,
// T. Smart, "A Dictionary of Modern Star Names" (2006) və IAU WGSN siyahısı.
// Parlaq ulduzlar data/brightStars.js-dəndir (koordinat oradan); əlavələr
// burada J2000 koordinatı ilə (planetari kataloqun ən yaxın ulduzuna yapışdırır).
// lang-ok: ulduz adları beynəlxalq yazılışdadır
// ═══════════════════════════════════════════════════════

// [id, ərəbcə, { az, en, ru, tr } — mənası]
export const STAR_MEANING = {
  aldebaran: ['الدبران', { az: 'izləyən (Ülkərin ardınca gələn)', en: 'the follower (of the Pleiades)', ru: 'следующий (за Плеядами)', tr: 'takip eden (Ülker’i)' }], // lang-ok: ərəbcəsi — ad (birinci element)
  altair: ['النسر الطائر', { az: 'uçan (qartal)', en: 'the flying (eagle)', ru: 'летящий (орёл)', tr: 'uçan (kartal)' }], // lang-ok: ərəbcəsi — ad (birinci element)
  vega: ['النسر الواقع', { az: 'enən (qartal)', en: 'the swooping (eagle)', ru: 'падающий (орёл)', tr: 'süzülen (kartal)' }], // lang-ok: ərəbcəsi — ad (birinci element)
  deneb: ['ذنب الدجاجة', { az: 'quyruq (toyuğun quyruğu)', en: 'tail (of the hen)', ru: 'хвост (курицы)', tr: 'kuyruk (tavuğun kuyruğu)' }], // lang-ok: ərəbcəsi — ad (birinci element)
  betelgeuse: ['يد الجوزاء', { az: 'əl-Cövzanın əli', en: 'hand of al-Jawzā’', ru: 'рука аль-Джаузы', tr: 'el-Cevzâ’nın eli' }], // lang-ok: ərəbcəsi — ad (birinci element)
  rigel: ['رجل الجبار', { az: 'ayaq (Cabbarın ayağı)', en: 'foot (of the Giant)', ru: 'нога (Великана)', tr: 'ayak (Cebbar’ın ayağı)' }], // lang-ok: ərəbcəsi — ad (birinci element)
  fomalhaut: ['فم الحوت', { az: 'balığın ağzı', en: 'mouth of the fish', ru: 'рот рыбы', tr: 'balığın ağzı' }], // lang-ok: ərəbcəsi — ad (birinci element)
  achernar: ['آخر النهر', { az: 'çayın sonu', en: 'end of the river', ru: 'конец реки', tr: 'nehrin sonu' }], // lang-ok: ərəbcəsi — ad (birinci element)
  dubhe: ['الدب', { az: 'ayı', en: 'the bear', ru: 'медведь', tr: 'ayı' }], // lang-ok: ərəbcəsi — ad (birinci element)
  merak: ['المراق', { az: 'böyür (ayının)', en: 'the loins (of the bear)', ru: 'пах (медведицы)', tr: 'böğür (ayının)' }], // lang-ok: ərəbcəsi — ad (birinci element)
  alnilam: ['النظام', { az: '(mirvari) sırası', en: 'the string (of pearls)', ru: 'нить (жемчуга)', tr: '(inci) dizisi' }], // lang-ok: ərəbcəsi — ad (birinci element)
  schedar: ['الصدر', { az: 'sinə', en: 'the breast', ru: 'грудь', tr: 'göğüs' }], // lang-ok: ərəbcəsi — ad (birinci element)
  antares: ['قلب العقرب', { az: 'əqrəbin ürəyi', en: 'heart of the scorpion', ru: 'сердце скорпиона', tr: 'akrebin kalbi' }], // lang-ok: ərəbcəsi — ad (birinci element)
  regulus: ['قلب الأسد', { az: 'şirin ürəyi', en: 'heart of the lion', ru: 'сердце льва', tr: 'aslanın kalbi' }], // lang-ok: ərəbcəsi — ad (birinci element)
  spica: ['السماك الأعزل', { az: 'silahsız Simak', en: 'the unarmed Simāk', ru: 'безоружный Симак', tr: 'silahsız Simâk' }], // lang-ok: ərəbcəsi — ad (birinci element)
  arcturus: ['السماك الرامح', { az: 'nizəli Simak', en: 'Simāk the lance-bearer', ru: 'Симак-копьеносец', tr: 'mızraklı Simâk' }], // lang-ok: ərəbcəsi — ad (birinci element)
  sirius: ['الشعرى', { az: 'əş-Şira — Quranda adı çəkilir (Nəcm, 49)', en: 'ash-Shiʿrā — named in the Quran (an-Najm 53:49)', ru: 'аш-Шира — упомянута в Коране (ан-Наджм, 49)', tr: 'eş-Şi‘râ — Kur’an’da adı geçer (Necm, 49)' }], // lang-ok: ərəbcəsi — ad (birinci element)
  canopus: ['سهيل', { az: 'Süheyl', en: 'Suhayl', ru: 'Сухейль', tr: 'Süheyl' }], // lang-ok: ərəbcəsi — ad (birinci element)
  algol: ['رأس الغول', { az: 'qulun başı', en: 'the demon’s head', ru: 'голова демона', tr: 'gulyabaninin başı' }], // lang-ok: ərəbcəsi — ad (birinci element)
  mizar: ['المئزر', { az: 'izar (bel örtüyü)', en: 'the girdle', ru: 'пояс', tr: 'peştemal' }], // lang-ok: ərəbcəsi — ad (birinci element)
  alkaid: ['القائد', { az: 'başçı', en: 'the leader', ru: 'предводитель', tr: 'önder' }], // lang-ok: ərəbcəsi — ad (birinci element)
  alnitak: ['النطاق', { az: 'kəmər', en: 'the belt', ru: 'пояс', tr: 'kuşak' }], // lang-ok: ərəbcəsi — ad (birinci element)
  mintaka: ['المنطقة', { az: 'kəmər', en: 'the belt', ru: 'пояс', tr: 'kuşak' }], // lang-ok: ərəbcəsi — ad (birinci element)
  saiph: ['سيف الجبار', { az: 'qılınc', en: 'the sword', ru: 'меч', tr: 'kılıç' }], // lang-ok: ərəbcəsi — ad (birinci element)
  denebola: ['ذنب الأسد', { az: 'şirin quyruğu', en: 'the lion’s tail', ru: 'хвост льва', tr: 'aslanın kuyruğu' }], // lang-ok: ərəbcəsi — ad (birinci element)
  alphard: ['الفرد', { az: 'tənha olan', en: 'the solitary one', ru: 'одинокий', tr: 'yalnız olan' }], // lang-ok: ərəbcəsi — ad (birinci element)
  elnath: ['النطح', { az: 'buynuzlayan', en: 'the butting one', ru: 'бодающий', tr: 'toslayan' }], // lang-ok: ərəbcəsi — ad (birinci element)
  rasalhague: ['رأس الحواء', { az: 'ilan oynadanın başı', en: 'head of the serpent-charmer', ru: 'голова заклинателя змей', tr: 'yılan oynatıcının başı' }], // lang-ok: ərəbcəsi — ad (birinci element)
  hamal: ['الحمل', { az: 'quzu', en: 'the lamb', ru: 'ягнёнок', tr: 'kuzu' }], // lang-ok: ərəbcəsi — ad (birinci element)
  mirfak: ['المرفق', { az: 'dirsək', en: 'the elbow', ru: 'локоть', tr: 'dirsek' }], // lang-ok: ərəbcəsi — ad (birinci element)
  shaula: ['الشولة', { az: 'qaldırılmış (quyruq)', en: 'the raised (tail)', ru: 'поднятый (хвост)', tr: 'kalkık (kuyruk)' }], // lang-ok: ərəbcəsi — ad (birinci element)
  alpheratz: ['سرة الفرس', { az: 'atın göbəyi', en: 'the horse’s navel', ru: 'пуп коня', tr: 'atın göbeği' }], // lang-ok: ərəbcəsi — ad (birinci element)
  markab: ['مركب', { az: 'minik (yəhər)', en: 'the saddle', ru: 'седло', tr: 'binek (eyer)' }], // lang-ok: ərəbcəsi — ad (birinci element)
  scheat: ['الساق', { az: 'baldır', en: 'the shin', ru: 'голень', tr: 'baldır' }], // lang-ok: ərəbcəsi — ad (birinci element)
  enif: ['أنف الفرس', { az: 'burun (atın burnu)', en: 'the nose (of the horse)', ru: 'нос (коня)', tr: 'burun (atın burnu)' }], // lang-ok: ərəbcəsi — ad (birinci element)
  sadr: ['الصدر', { az: 'sinə', en: 'the breast', ru: 'грудь', tr: 'göğüs' }], // lang-ok: ərəbcəsi — ad (birinci element)
  algieba: ['الجبهة', { az: 'alın', en: 'the forehead', ru: 'лоб', tr: 'alın' }], // lang-ok: ərəbcəsi — ad (birinci element)
  zubenelgenubi: ['الزبانى الجنوبي', { az: 'cənub caynağı', en: 'the southern claw', ru: 'южная клешня', tr: 'güney kıskacı' }], // lang-ok: ərəbcəsi — ad (birinci element)
  unukalhai: ['عنق الحية', { az: 'ilanın boynu', en: 'the serpent’s neck', ru: 'шея змеи', tr: 'yılanın boynu' }], // lang-ok: ərəbcəsi — ad (birinci element)
}

// brightStars.js-də olmayanlar: [id, beynəlxalq ad, ra°, dec° (J2000)]
export const EXTRA_STARS = [
  ['algol', 'Algol', 47.04, 40.96], ['mizar', 'Mizar', 200.98, 54.93], ['alkaid', 'Alkaid', 206.89, 49.31],
  ['alnitak', 'Alnitak', 85.19, -1.94], ['mintaka', 'Mintaka', 83.0, -0.3], ['saiph', 'Saiph', 86.94, -9.67],
  ['denebola', 'Denebola', 177.26, 14.57], ['alphard', 'Alphard', 141.9, -8.66], ['elnath', 'Elnath', 81.57, 28.61],
  ['rasalhague', 'Rasalhague', 263.73, 12.56], ['hamal', 'Hamal', 31.79, 23.46], ['mirfak', 'Mirfak', 51.08, 49.86],
  ['shaula', 'Shaula', 263.4, -37.1], ['alpheratz', 'Alpheratz', 2.1, 29.09], ['markab', 'Markab', 346.19, 15.21],
  ['scheat', 'Scheat', 345.94, 28.08], ['enif', 'Enif', 326.05, 9.87], ['sadr', 'Sadr', 305.56, 40.26],
  ['algieba', 'Algieba', 154.99, 19.84], ['zubenelgenubi', 'Zubenelgenubi', 222.72, -16.04], ['unukalhai', 'Unukalhai', 236.07, 6.43],
]
