// ═══════════════════════════════════════════════════════
// Detal səhifələrinin URL slug-ları (99 ad, səhabələr)
//
// Tətbiq bandlına düşür (routes.js) — ona görə ağır məlumat faylları
// (names99.js, sahaba.js) burada import OLUNMUR, yalnız slug siyahısı.
// tests/unit/seo-detail.test.js bu siyahıların məlumatla eyni olduğunu yoxlayır.
//
//   NAME_SLUGS[n - 1]   — /names/<n>-<slug> (names99.js → "tr" transliterasiyası)
//   REMOVED_NAME_SLUGS  — köhnə siyahıdan çıxarılmış adlar (köhnə URL-lər üçün)
//   SAHABA_SLUGS[id - 1] — /sahaba/<slug>    (sahaba.js → slugOf, ingiliscə ad)
// ═══════════════════════════════════════════════════════

export const NAME_SLUGS = [
  "allah", "al-ahad", "al-ala", "al-akram", "al-ilah", "al-awwal",
  "al-akhir", "az-zahir", "al-batin", "al-bari", "al-barr", "al-basir",
  "at-tawwab", "al-jabbar", "al-haafiz", "al-hasib", "al-hafiz", "al-hafiyy",
  "al-haqq", "al-mubin", "al-hakim", "al-halim", "al-hamid", "al-hayy",
  "al-qayyum", "al-khabir", "al-khaliq", "al-khallaq", "ar-rauf", "ar-rahman",
  "ar-rahim", "ar-razzaq", "ar-raqib", "as-salam", "as-sami", "ash-shakir",
  "ash-shakur", "ash-shahid", "as-samad", "al-aalim", "al-aziz", "al-azim",
  "al-afuww", "al-alim", "al-aliyy", "al-ghaffar", "al-ghafur", "al-ghani",
  "al-fattah", "al-qadir", "al-qahir", "al-quddus", "al-qadeer", "al-qarib",
  "al-qawiyy", "al-qahhar", "al-kabir", "al-karim", "al-latif", "al-mumin",
  "al-mutaali", "al-mutakabbir", "al-matin", "al-mujib", "al-majid", "al-muhit",
  "al-musawwir", "al-muqtadir", "al-muqit", "al-malik", "al-maleek", "al-mawla",
  "al-muhaymin", "an-nasir", "al-wahid", "al-warith", "al-wasi", "al-wadud",
  "al-wakil", "al-waliyy", "al-wahhab", "al-jamil", "al-jawad", "al-hakam",
  "al-hayiyy", "ar-rabb", "ar-rafiq", "as-subbuh", "as-sayyid", "ash-shafi",
  "at-tayyib", "al-qabid", "al-basit", "al-muqaddim", "al-muakhkhir", "al-muhsin",
  "al-muti", "al-mannan", "al-witr",
]

// Köhnə siyahıdan (Tirmizi 3507 sadalaması) çıxarılmış adların slug-ları.
// Belə köhnə ünvan (/names/23-al-khafid) siyahıya (/names) yönləndirilir —
// bax: src/seo/routes.js → parseDetailSegment / parsePath (removed: true).
// Köhnə siyahıda olub yenisində də olan adlar slug-ı ilə tapılır
// (/names/20-al-alim → /names/44-al-alim).
export const REMOVED_NAME_SLUGS = [
  "al-khafid", "ar-rafi", "al-muizz", "al-mudhill", "al-adl", "al-jalil",
  "al-baith", "al-muhsi", "al-mubdi", "al-muid", "al-muhyi", "al-mumit",
  "al-wajid", "al-wali", "al-muntaqim", "malikul-mulk", "dhul-jalali-wal-ikram", "al-muqsit",
  "al-jami", "al-mughni", "al-mani", "ad-darr", "an-nafi", "an-nur",
  "al-hadi", "al-badi", "al-baqi", "ar-rashid",
]

export const SAHABA_SLUGS = [
  "abu-bakr-as-siddiq", "umar-ibn-al-khattab", "uthman-ibn-affan", "ali-ibn-abi-talib", "khadijah-bint-khuwaylid", "aisha-bint-abi-bakr",
  "fatimah-bint-muhammad", "bilal-ibn-rabah", "abu-hurairah", "abdullah-ibn-masud", "salman-al-farisi", "abu-dharr-al-ghifari",
  "muadh-ibn-jabal", "zaid-ibn-harithah", "khalid-ibn-al-walid", "saad-ibn-abi-waqqas", "talha-ibn-ubaydullah", "zubayr-ibn-al-awwam",
  "anas-ibn-malik", "abu-ubaidah-ibn-al-jarrah",
]
