// ═══════════════════════════════════════════════════════
// Quranda heyvanlar (v6.5) — components/QuranAnimals.jsx (/kids → "Quranda heyvanlar")
//
// QAYDA: yalnız Quranın ADINI AÇIQ ÇƏKDİYİ heyvanlar. Hər biri üçün:
//   • root / lemmas — Quranic Arabic Corpus kökü və lüğət forması (public/data/quran-roots.json);
//     exact — hərəkəsiz forma başqa sözlə üst-üstə düşəndə (فِراش «yataq» ≠ فَراش «pərvanə») dəqiq forma;
//     count — bu formaların Quranda neçə dəfə keçdiyi (həmin fayldan hesablanır, testlə yoxlanılır);
//   • ref — sözün keçdiyi ayə (testlə: söz həmin ayədə var);
//   • surah — heyvanın adını daşıyan surə (varsa).
// Ayə mətni və tərcüməsi burada yazılmır — scripts/build-quran-animals.mjs onları saytın öz
// mənbələrindən (seo-data/quran: Osmani mətni və hər dilin rəsmi tərcüməsi) hərfi-hərfinə götürür
// → public/data/quran-animals/<dil>.json. Dini mətn maşınla tərcümə olunmur.
// Heyvanın necə izah olunduğu (təfsir) yazılmır — yalnız adı, sayı və ayəsi.
// ═══════════════════════════════════════════════════════
export const QURAN_ANIMALS = [
  { id: 'bee', emoji: '🐝', ar: 'النَّحْل', root: 'نحل', lemmas: ['نحل'], count: 1, ref: '16:68', surah: 16,
    name: { az: 'Bal arısı', en: 'Bee', ru: 'Пчела', ar: 'النحل', tr: 'Bal arısı' } },
  { id: 'ant', emoji: '🐜', ar: 'النَّمْل', root: 'نمل', lemmas: ['نمل', 'نملة'], count: 3, ref: '27:18', surah: 27,
    name: { az: 'Qarışqa', en: 'Ant', ru: 'Муравей', ar: 'النمل', tr: 'Karınca' } },
  { id: 'spider', emoji: '🕷️', ar: 'العَنكَبُوت', root: 'عنكب', lemmas: ['عنكبوت'], count: 2, ref: '29:41', surah: 29,
    name: { az: 'Hörümçək', en: 'Spider', ru: 'Паук', ar: 'العنكبوت', tr: 'Örümcek' } },
  { id: 'elephant', emoji: '🐘', ar: 'الفِيل', root: 'فيل', lemmas: ['فيل'], count: 1, ref: '105:1', surah: 105,
    name: { az: 'Fil', en: 'Elephant', ru: 'Слон', ar: 'الفيل', tr: 'Fil' } },
  { id: 'cow', emoji: '🐄', ar: 'البَقَرَة', root: 'بقر', lemmas: ['بقرة', 'بقر'], count: 9, ref: '2:67', surah: 2,
    name: { az: 'İnək', en: 'Cow', ru: 'Корова', ar: 'البقرة', tr: 'İnek' } },
  { id: 'hoopoe', emoji: '🐦', ar: 'الهُدْهُد', root: 'هدهد', lemmas: ['هدهد'], count: 1, ref: '27:20',
    name: { az: 'Hüdhüd', en: 'Hoopoe', ru: 'Удод', ar: 'الهدهد', tr: 'Hüdhüd' } },
  { id: 'camel', emoji: '🐪', ar: 'الإِبِل', root: 'أبل', lemmas: ['ابل'], count: 2, ref: '88:17',
    name: { az: 'Dəvə', en: 'Camel', ru: 'Верблюд', ar: 'الإبل', tr: 'Deve' } },
  { id: 'dog', emoji: '🐕', ar: 'الكَلْب', root: 'كلب', lemmas: ['كلب'], count: 5, ref: '18:18',
    name: { az: 'İt', en: 'Dog', ru: 'Собака', ar: 'الكلب', tr: 'Köpek' } },
  { id: 'wolf', emoji: '🐺', ar: 'الذِّئْب', root: 'ذأب', lemmas: ['ذئب'], count: 3, ref: '12:13',
    name: { az: 'Canavar', en: 'Wolf', ru: 'Волк', ar: 'الذئب', tr: 'Kurt' } },
  { id: 'crow', emoji: '🐦‍⬛', ar: 'الغُرَاب', root: 'غرب', lemmas: ['غراب'], count: 2, ref: '5:31',
    name: { az: 'Qarğa', en: 'Crow', ru: 'Ворон', ar: 'الغراب', tr: 'Karga' } },
  { id: 'fish', emoji: '🐟', ar: 'الحُوت', root: 'حوت', lemmas: ['حوت'], count: 5, ref: '37:142',
    name: { az: 'Böyük balıq', en: 'Great fish', ru: 'Большая рыба', ar: 'الحوت', tr: 'Büyük balık' } },
  { id: 'horse', emoji: '🐎', ar: 'الخَيْل', root: 'خيل', lemmas: ['خيل'], count: 5, ref: '16:8',
    name: { az: 'At', en: 'Horse', ru: 'Конь', ar: 'الخيل', tr: 'At' } },
  { id: 'donkey', emoji: '🫏', ar: 'الحِمَار', root: 'حمر', lemmas: ['حمار'], count: 5, ref: '62:5',
    name: { az: 'Eşşək', en: 'Donkey', ru: 'Осёл', ar: 'الحمار', tr: 'Eşek' } },
  { id: 'sheep', emoji: '🐑', ar: 'الضَّأْن', root: 'ضأن', lemmas: ['ضان'], count: 1, ref: '6:143',
    name: { az: 'Qoyun', en: 'Sheep', ru: 'Овца', ar: 'الضأن', tr: 'Koyun' } },
  { id: 'bird', emoji: '🕊️', ar: 'الطَّيْر', root: 'طير', lemmas: ['طير'], count: 19, ref: '105:3',
    name: { az: 'Quşlar', en: 'Birds', ru: 'Птицы', ar: 'الطير', tr: 'Kuşlar' } },
  { id: 'snake', emoji: '🐍', ar: 'الحَيَّة', root: 'حيي', lemmas: ['حية'], count: 1, ref: '20:20',
    name: { az: 'İlan', en: 'Snake', ru: 'Змея', ar: 'الحية', tr: 'Yılan' } },
  { id: 'frog', emoji: '🐸', ar: 'الضَّفَادِع', root: 'ضفدع', lemmas: ['ضفادع'], count: 1, ref: '7:133',
    name: { az: 'Qurbağalar', en: 'Frogs', ru: 'Лягушки', ar: 'الضفادع', tr: 'Kurbağalar' } },
  { id: 'locust', emoji: '🦗', ar: 'الجَرَاد', root: 'جرد', lemmas: ['جراد'], count: 2, ref: '54:7',
    name: { az: 'Çəyirtkə', en: 'Locusts', ru: 'Саранча', ar: 'الجراد', tr: 'Çekirge' } },
  { id: 'fly', emoji: '🪰', ar: 'الذُّبَاب', root: 'ذبب', lemmas: ['ذباب'], count: 2, ref: '22:73',
    name: { az: 'Milçək', en: 'Fly', ru: 'Муха', ar: 'الذباب', tr: 'Sinek' } },
  { id: 'mosquito', emoji: '🦟', ar: 'البَعُوضَة', root: 'بعض', lemmas: ['بعوضة'], count: 1, ref: '2:26',
    name: { az: 'Ağcaqanad', en: 'Mosquito', ru: 'Комар', ar: 'البعوضة', tr: 'Sivrisinek' } },
  { id: 'moth', emoji: '🦋', ar: 'الفَرَاش', root: 'فرش', lemmas: ['فراش'], exact: 'فَراش', count: 1, ref: '101:4',
    name: { az: 'Pərvanə', en: 'Moths', ru: 'Мотыльки', ar: 'الفراش', tr: 'Pervane' } },
]

/** Hərəkələri və Osmani işarələrini sil (müqayisə üçün) */
export const plainAr = (x) => String(x).normalize('NFC').replace(/[ؐ-ًؚ-ٰٟۖ-ۭ]/g, '').replace(/[ٱأإآ]/g, 'ا')
