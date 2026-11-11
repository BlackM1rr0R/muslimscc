// ═══════════════════════════════════════════════════════
// Peyğəmbərlər şəcərəsi (v6.1) — components/ProphetTree.jsx (/history → Peyğəmbərlər)
//
// QAYDA: yalnız QURANIN ÖZÜNÜN dediyi əlaqələr. Hər xəttin ayəsi var və
// tests/unit/prophet-tree.test.js ayə mətnində göstərilən sözün keçdiyini yoxlayır
// (seo-data/quran/quran-uthmani.json, normalizeArabic ilə).
// Rəvayət və ya təfsirdən gələn əlaqələr (məs. Lutun İbrahimin qardaşı oğlu olması,
// İsrail = Yəqub, 6:84-dəki "onun nəslindən" əvəzliyi) ÇƏKİLMİR.
// ═══════════════════════════════════════════════════════

// Düyünlər: num — data/islamicHistory.js PROPHETS[].num; num yoxdursa — peyğəmbər olmayan şəxs (name ilə)
export const TREE_NODES = {
  ibrahim: { num: 6, at: [420, 64] },
  lut: { num: 7, at: [720, 64] },
  ismail: { num: 8, at: [230, 190] },
  ishaq: { num: 9, at: [560, 190] },
  muhammad: { num: 25, at: [130, 620] },
  yaqub: { num: 10, at: [560, 300] },
  yusuf: { num: 11, at: [560, 410] },
  musa: { num: 14, at: [880, 150] },
  harun: { num: 15, at: [880, 262] },
  dawud: { num: 17, at: [880, 410] },
  sulayman: { num: 18, at: [880, 522] },
  zakariyya: { num: 22, at: [360, 430] },
  yahya: { num: 23, at: [230, 525] },
  imran: { at: [720, 480], ar: 'عمران', name: { az: 'İmran', en: 'Imran', ru: 'Имран', ar: 'عمران', tr: 'İmran' } },
  maryam: { at: [500, 560], ar: 'مريم', name: { az: 'Məryəm', en: 'Maryam', ru: 'Марьям', ar: 'مريم', tr: 'Meryem' } },
  isa: { num: 24, at: [380, 650] },
}

// Əlaqə növləri (5 dil)
export const TREE_REL = {
  son: { az: 'oğlu', en: 'son', ru: 'сын', ar: 'ابنه', tr: 'oğlu' },
  daughter: { az: 'qızı', en: 'daughter', ru: 'дочь', ar: 'ابنته', tr: 'kızı' },
  brother: { az: 'qardaşı', en: 'brother', ru: 'брат', ar: 'أخوه', tr: 'kardeşi' },
  guardian: { az: 'himayəsinə götürdü', en: 'took her into his care', ru: 'взял на попечение', ar: 'كفلها', tr: 'himayesine aldı' },
  believed: { az: 'ona iman gətirdi', en: 'believed in him', ru: 'уверовал в него', ar: 'آمن له', tr: 'ona iman etti' },
  dua: { az: 'İbrahim və İsmailin duası', en: 'the prayer of Ibrahim and Ismail', ru: 'мольба Ибрахима и Исмаила', ar: 'دعوة إبراهيم وإسماعيل', tr: 'İbrahim ve İsmail’in duası' },
  glad: { az: 'gələcəyini müjdələdi', en: 'gave glad tidings of him', ru: 'возвестил о его приходе', ar: 'بشّر به', tr: 'geleceğini müjdeledi' },
}

// [kimdən, kimə, növ, [[ayə, ayədə keçən söz (normalizeArabic formasında)], …], qırıq xətt?]
export const TREE_EDGES = [
  ['ibrahim', 'ismail', 'son', [['14:39', 'اسمعيل']]],
  ['ibrahim', 'ishaq', 'son', [['14:39', 'واسحق'], ['11:71', 'باسحق']]],
  ['ishaq', 'yaqub', 'son', [['11:71', 'ومن ورا اسحق يعقوب'], ['21:72', 'اسحق ويعقوب نافله']]],
  ['yaqub', 'yusuf', 'son', [['12:4', 'يوسف لابيه'], ['12:38', 'ابرهيم واسحق ويعقوب']]],
  ['ibrahim', 'lut', 'believed', [['29:26', 'فامن له لوط']], true],
  ['musa', 'harun', 'brother', [['20:30', 'هرون اخي']]],
  ['dawud', 'sulayman', 'son', [['38:30', 'لداود سليمن'], ['27:16', 'وورث سليمن داود']]],
  ['zakariyya', 'yahya', 'son', [['19:7', 'يزكريا انا نبشرك بغلم اسمه يحيي']]],
  ['imran', 'maryam', 'daughter', [['66:12', 'ومريم ابنت عمرن']]],
  ['zakariyya', 'maryam', 'guardian', [['3:37', 'وكفلها زكريا']], true],
  ['maryam', 'isa', 'son', [['3:45', 'عيسي ابن مريم']]],
  ['ismail', 'muhammad', 'dua', [['2:127', 'ابرهم القواعد من البيت واسمعيل'], ['2:129', 'وابعث فيهم رسولا منهم']], true],
  ['isa', 'muhammad', 'glad', [['61:6', 'ومبشرا برسول ياتي من بعدي اسمه احمد']], true],
]
